import {
  AtomicTransactionComposer,
  decodeAddress,
  getApplicationAddress,
  getMethodByName,
  Indexer,
  LogicSigAccount,
  makeApplicationCloseOutTxn,
  OnApplicationComplete,
  SuggestedParams,
  Transaction
} from "algosdk";
import { Dispenser, Distributor } from "../common";
import {
  addEscrowNoteTransaction,
  getParsedValueFromState,
  signer,
  transferAlgoOrAsset
} from "../../utils";
import { abiDistributor } from "./constants/abiContracts";
import { DistributorInfo, UserCommitmentInfo } from "./types";

function getDistributorLogicSig(userAddr: string): LogicSigAccount {
  const prefix = Uint8Array.from([
    7, 32, 1, 1, 128, 36, 70, 79, 76, 75, 83, 95, 70, 73, 78, 65, 78, 67, 69, 95,
    65, 76, 71, 79, 95, 76, 73, 81, 85, 73, 68, 95, 71, 79, 86, 69, 82, 78, 65, 78,
    67, 69, 72, 49, 22, 34, 9, 56, 16, 34, 18, 68, 49, 22, 34, 9, 56, 0, 128, 32,
  ]);
  const suffix = Uint8Array.from([
    18, 68, 49, 22, 34, 9, 56, 8, 20, 68, 49, 22, 34, 9, 56, 32, 50, 3, 18, 68,
    49, 22, 34, 9, 56, 9, 50, 3, 18, 68, 49, 22, 34, 9, 56, 21, 50, 3, 18, 68,
    34, 67,
  ]);
  return new LogicSigAccount(new Uint8Array([
    ...prefix,
    ...decodeAddress(userAddr).publicKey,
    ...suffix,
  ]));
}

/**
 *
 * Returns information regarding the given liquid governance distributor.
 *
 * @param indexerClient - Algorand indexer client to query
 * @param distributor - distributor to query about
 * @returns DistributorInfo[] distributor info
 */
async function getDistributorInfo(indexerClient: Indexer, distributor: Distributor): Promise<DistributorInfo> {
  const { appId } = distributor;
  const res = await indexerClient.lookupApplications(appId).do();
  const state = res["application"]["params"]["global-state"];

  const dispenserAppId = Number(getParsedValueFromState(state, "dispenser_app_id") || 0);
  const premintEnd = BigInt(getParsedValueFromState(state, "premint_end") || 0);
  const commitEnd = BigInt(getParsedValueFromState(state, "commit_end") || 0);
  const periodEnd = BigInt(getParsedValueFromState(state, "period_end") || 0);
  const totalCommitment = BigInt(getParsedValueFromState(state, "total_commitment") || 0);
  const isBurningPaused = Boolean(getParsedValueFromState(state, "is_burning_paused") || 0);

  return {
    currentRound: res["current-round"],
    dispenserAppId,
    premintEnd,
    commitEnd,
    periodEnd,
    totalCommitment,
    isBurningPaused,
  };
}

/**
 *
 * Returns information regarding a user's liquid governance commitment.
 *
 * @param indexerClient - Algorand indexer client to query
 * @param distributor - distributor to query about
 * @param userAddr - user address to get governance info about
 * @returns UserCommitmentInfo[] user commitment info
 */
async function getUserLiquidGovernanceInfo(
  indexerClient: Indexer,
  distributor: Distributor,
  userAddr: string,
): Promise<UserCommitmentInfo> {
  const { appId } = distributor;
  const escrowAddr = getDistributorLogicSig(userAddr).address();

  // get user account local state
  const req = indexerClient.lookupAccountAppLocalStates(escrowAddr).applicationID(appId);
  const res = await req.do();

  // user local state
  const state = res["apps-local-states"]?.find((app: any) => app.id === appId)?.["key-value"];
  if (state === undefined) throw new Error("Unable to find commitment for: " + userAddr + ".");
  const canDelegate = Boolean(getParsedValueFromState(state, "d"));
  const premint = BigInt(getParsedValueFromState(state, "p") || 0);
  const commitment = BigInt(getParsedValueFromState(state, "c") || 0);
  const nonCommitment = BigInt(getParsedValueFromState(state, "n") || 0);

  return {
    currentRound: res["current-round"],
    userAddress: userAddr,
    canDelegate,
    premint,
    commitment,
    nonCommitment,
  };
}

/**
 *
 * Returns a group transaction to add liquid governance escrow.
 *
 * @param distributor - distributor that adding escrow to
 * @param userAddr - account address for the user
 * @param params - suggested params for the transactions with the fees overwritten
 * @returns { txns: Transaction[], escrow: LogicSigAccount } object containing group transaction and generated escrow account
 */
function prepareAddLiquidGovernanceEscrowTransactions(
  distributor: Distributor,
  userAddr: string,
  params: SuggestedParams,
): { txns: Transaction[]; escrow: LogicSigAccount } {
  const { appId } = distributor;
  const escrow = getDistributorLogicSig(userAddr);

  const userCall = addEscrowNoteTransaction(userAddr, escrow.address(), appId, "ga ", {
    ...params,
    flatFee: true,
    fee: 2000,
  });

  const atc = new AtomicTransactionComposer();
  atc.addMethodCall({
    sender: escrow.address(),
    signer,
    appID: appId,
    onComplete: OnApplicationComplete.OptInOC,
    method: getMethodByName(abiDistributor.methods, "add_escrow"),
    methodArgs: [{ txn: userCall, signer }],
    rekeyTo: getApplicationAddress(appId),
    suggestedParams: { ...params, flatFee: true, fee: 0 },
  });
  const txns = atc.buildGroup().map(({ txn }) => {
    txn.group = undefined;
    return txn;
  });
  return { txns, escrow };
}

/**
 *
 * Returns a group transaction to mint gALGO for ALGO at a one-to-one rate.
 * If in the commitment period then also commits user into governance.
 *
 * @param dispenser - dispenser to mint gALGO from
 * @param distributor - distributor that calls dispenser and to send ALGO to
 * @param senderAddr - account address for the sender
 * @param amount - amount of ALGO to send and gALGO to mint
 * @param ensureCommit - whether to ensure commitment
 * @param params - suggested params for the transactions with the fees overwritten
 * @param note - optional note to distinguish who is the minter (must pass to be eligible for revenue share)
 * @returns Transaction[] mint transactions
 */
function prepareMintTransactions(
  dispenser: Dispenser,
  distributor: Distributor,
  senderAddr: string,
  amount: number | bigint,
  ensureCommit: boolean,
  params: SuggestedParams,
  note?: Uint8Array,
): Transaction[] {
  const escrowAddr = getDistributorLogicSig(senderAddr).address();

  const sendAlgo = {
    txn: transferAlgoOrAsset(0, senderAddr, escrowAddr, amount, { ...params, flatFee: true, fee: 0 }),
    signer,
  }

  const atc = new AtomicTransactionComposer();
  atc.addMethodCall({
    sender: senderAddr,
    signer,
    appID: distributor.appId,
    method: getMethodByName(abiDistributor.methods, "mint"),
    methodArgs: [sendAlgo, dispenser.appId, dispenser.gAlgoId, ensureCommit],
    suggestedParams: { ...params, flatFee: true, fee: 4000 },
    note,
  });
  return atc.buildGroup().map(({ txn }) => {
    txn.group = undefined;
    return txn;
  });
}

/**
 *
 * Returns a transaction to unmint pre-minted gALGO for ALGO at a one-to-one rate.
 * Must be in commitment period. By unminting, you will lose your governance rewards.
 *
 * @param distributor - distributor that calls dispenser and to send ALGO to
 * @param senderAddr - account address for the sender
 * @param amount - amount of gALGO to unmint and ALGO to receive
 * @param params - suggested params for the transactions with the fees overwritten
 * @param note - optional note to distinguish who is the unminter (must pass to be eligible for revenue share)
 * @returns Transaction unmint pre-mint transaction
 */
function prepareUnmintPremintTransaction(
  distributor: Distributor,
  senderAddr: string,
  amount: number | bigint,
  params: SuggestedParams,
  note?: Uint8Array,
): Transaction[] {
  const escrowAddr = getDistributorLogicSig(senderAddr).address();

  const atc = new AtomicTransactionComposer();
  atc.addMethodCall({
    sender: senderAddr,
    signer,
    appID: distributor.appId,
    method: getMethodByName(abiDistributor.methods, "unmint_premint"),
    methodArgs: [escrowAddr, amount],
    suggestedParams: { ...params, flatFee: true, fee: 4000 },
    note,
  });
  return atc.buildGroup().map(({ txn }) => {
    txn.group = undefined;
    return txn;
  });
}

/**
 *
 * Returns a transaction to unmint pre-minted gALGO for ALGO at a one-to-one rate.
 * Must be in commitment period. By unminting, you will lose your governance rewards.
 *
 * @param dispenser - dispenser to send gALGO to
 * @param distributor - distributor that calls dispenser and to send ALGO to
 * @param senderAddr - account address for the sender
 * @param amount - amount of gALGO to unmint and ALGO to receive
 * @param params - suggested params for the transactions with the fees overwritten
 * @param note - optional note to distinguish who is the unminter (must pass to be eligible for revenue share)
 * @returns Transaction[] unmint transactions
 */
function prepareUnmintTransactions(
  dispenser: Dispenser,
  distributor: Distributor,
  senderAddr: string,
  amount: number | bigint,
  params: SuggestedParams,
  note?: Uint8Array,
): Transaction[] {
  const escrowAddr = getDistributorLogicSig(senderAddr).address();

  const sendgALGO = {
    txn: transferAlgoOrAsset(dispenser.gAlgoId, senderAddr, getApplicationAddress(dispenser.appId), amount, { ...params, flatFee: true, fee: 0 }),
    signer,
  }

  const atc = new AtomicTransactionComposer();
  atc.addMethodCall({
    sender: senderAddr,
    signer,
    appID: distributor.appId,
    method: getMethodByName(abiDistributor.methods, "unmint"),
    methodArgs: [sendgALGO, escrowAddr, dispenser.appId],
    suggestedParams: { ...params, flatFee: true, fee: 3000 },
    note,
  });
  return atc.buildGroup().map(({ txn }) => {
    txn.group = undefined;
    return txn;
  });
}

/**
 *
 * Returns a transaction to claim pre-minted gALGO.
 * Can be called on behalf of yourself or another user.
 *
 * @param dispenser - dispenser to send gALGO to
 * @param distributor - distributor to receive ALGO from
 * @param senderAddr - account address for the sender
 * @param receiverAddr - account address for the pre-minter that will receiver the gALGO
 * @param params - suggested params for the transactions with the fees overwritten
 * @returns Transaction claim pre-mint transaction
 */
function prepareClaimPremintTransaction(
  dispenser: Dispenser,
  distributor: Distributor,
  senderAddr: string,
  receiverAddr: string,
  params: SuggestedParams,
): Transaction {
  const escrowAddr = getDistributorLogicSig(receiverAddr).address();

  const atc = new AtomicTransactionComposer();
  atc.addMethodCall({
    sender: senderAddr,
    signer,
    appID: distributor.appId,
    method: getMethodByName(abiDistributor.methods, "claim_premint"),
    methodArgs: [escrowAddr, receiverAddr, dispenser.appId, dispenser.gAlgoId],
    suggestedParams: { ...params, flatFee: true, fee: 4000 },
  });
  const txns = atc.buildGroup().map(({ txn }) => {
    txn.group = undefined;
    return txn;
  });
  return txns[0];
}

/**
 *
 * Returns a transaction to register escrow online.
 *
 * @param distributor - distributor that has escrow
 * @param senderAddr - account address for the sender
 * @param voteKeyAddr - account address for the vote key
 * @param selectionKeyAddr - account address for the selection key
 * @param stateProofKey - state proof key
 * @param voteFirstRound - vote first round
 * @param voteLastRound - vote last round
 * @param voteKeyDilution - vote key dilution
 * @param params - suggested params for the transactions with the fees overwritten
 * @returns Transaction register online transaction
 */
function prepareRegisterEscrowOnlineTransaction(
  distributor: Distributor,
  senderAddr: string,
  voteKeyAddr: string,
  selectionKeyAddr: string,
  stateProofKey: Buffer,
  voteFirstRound: number | bigint,
  voteLastRound: number | bigint,
  voteKeyDilution: number | bigint,
  params: SuggestedParams,
): Transaction {
  const escrowAddr = getDistributorLogicSig(senderAddr).address();

  const atc = new AtomicTransactionComposer();
  atc.addMethodCall({
    sender: senderAddr,
    signer,
    appID: distributor.appId,
    method: getMethodByName(abiDistributor.methods, "register_online"),
    methodArgs: [escrowAddr, voteKeyAddr, selectionKeyAddr, stateProofKey, voteFirstRound, voteLastRound, voteKeyDilution],
    suggestedParams: { ...params, flatFee: true, fee: 2000 },
  });
  const txns = atc.buildGroup().map(({ txn }) => {
    txn.group = undefined;
    return txn;
  });
  return txns[0];
}

/**
 *
 * Returns a transaction to register escrow offline.
 *
 * @param distributor - distributor that has escrow
 * @param senderAddr - account address for the sender
 * @param params - suggested params for the transactions with the fees overwritten
 * @returns Transaction register offline transaction
 */
function prepareRegisterEscrowOfflineTransaction(
  distributor: Distributor,
  senderAddr: string,
  params: SuggestedParams,
): Transaction {
  const escrowAddr = getDistributorLogicSig(senderAddr).address();

  const atc = new AtomicTransactionComposer();
  atc.addMethodCall({
    sender: senderAddr,
    signer,
    appID: distributor.appId,
    method: getMethodByName(abiDistributor.methods, "register_offline"),
    methodArgs: [escrowAddr],
    suggestedParams: { ...params, flatFee: true, fee: 2000 },
  });
  const txns = atc.buildGroup().map(({ txn }) => {
    txn.group = undefined;
    return txn;
  });
  return txns[0];
}

/**
 *
 * Returns a transaction to commit or vote in governance.
 *
 * @param distributor - distributor that has escrow
 * @param senderAddr - account address for the sender
 * @param destAddr - destination address
 * @param note - note to send
 * @param params - suggested params the transactions with the fees overwritten
 * @returns Transaction commit/vote transaction
 */
function prepareCommitOrVoteTransaction(
  distributor: Distributor,
  senderAddr: string,
  destAddr: string,
  note: string,
  params: SuggestedParams,
): Transaction {
  const escrowAddr = getDistributorLogicSig(senderAddr).address();

  const atc = new AtomicTransactionComposer();
  atc.addMethodCall({
    sender: senderAddr,
    signer,
    appID: distributor.appId,
    method: getMethodByName(abiDistributor.methods, "governance"),
    methodArgs: [escrowAddr, destAddr, note],
    suggestedParams: { ...params, flatFee: true, fee: 2000 },
  });
  const txns = atc.buildGroup().map(({ txn }) => {
    txn.group = undefined;
    return txn;
  });
  return txns[0];
}

/**
 *
 * Returns a group transaction to remove escrow from distributor.
 * Must have zero balance or be after period end.
 *
 * @param distributor - distributor that removing escrow from
 * @param senderAddr - account address for the sender
 * @param params - suggested params for the transactions with the fees overwritten
 * @returns Transaction[] burn transactions
 */
function prepareRemoveLiquidGovernanceEscrowTransactions(
  distributor: Distributor,
  senderAddr: string,
  params: SuggestedParams,
): Transaction[] {
  const escrowAddr = getDistributorLogicSig(senderAddr).address();

  const atc = new AtomicTransactionComposer();
  atc.addMethodCall({
    sender: senderAddr,
    signer,
    appID: distributor.appId,
    method: getMethodByName(abiDistributor.methods, "remove_escrow"),
    methodArgs: [escrowAddr],
    suggestedParams: { ...params, flatFee: true, fee: 4000 },
  });
  const txns = atc.buildGroup().map(({ txn }) => {
    txn.group = undefined;
    return txn;
  });
  const optOutTx = makeApplicationCloseOutTxn(escrowAddr, { ...params, flatFee: true, fee: 0 }, distributor.appId, undefined, undefined, undefined, undefined, undefined, undefined, escrowAddr);
  return [txns[0], optOutTx];
}

/**
 *
 * Returns a group transaction to burn gALGO for ALGO at a one-to-one rate.
 * Must be after period end.
 *
 * @param dispenser - dispenser to send gALGO to
 * @param distributor - distributor that calls dispenser and to send ALGO to
 * @param senderAddr - account address for the sender
 * @param amount - amount of gALGO to send and ALGO to receive
 * @param params - suggested params for the transactions with the fees overwritten
 * @returns Transaction[] burn transactions
 */
function prepareBurnTransactions(
  dispenser: Dispenser,
  distributor: Distributor,
  senderAddr: string,
  amount: number | bigint,
  params: SuggestedParams,
): Transaction[] {
  const sendgALGO = {
    txn: transferAlgoOrAsset(dispenser.gAlgoId, senderAddr, getApplicationAddress(dispenser.appId), amount, { ...params, flatFee: true, fee: 0 }),
    signer,
  }

  const atc = new AtomicTransactionComposer();
  atc.addMethodCall({
    sender: senderAddr,
    signer,
    appID: distributor.appId,
    method: getMethodByName(abiDistributor.methods, "burn"),
    methodArgs: [sendgALGO, dispenser.appId],
    suggestedParams: { ...params, flatFee: true, fee: 3000 },
  });
  return atc.buildGroup().map(({ txn }) => {
    txn.group = undefined;
    return txn;
  });
}

export {
  getDistributorLogicSig,
  getDistributorInfo,
  getUserLiquidGovernanceInfo,
  prepareAddLiquidGovernanceEscrowTransactions,
  prepareMintTransactions,
  prepareUnmintPremintTransaction,
  prepareUnmintTransactions,
  prepareClaimPremintTransaction,
  prepareRegisterEscrowOnlineTransaction,
  prepareRegisterEscrowOfflineTransaction,
  prepareCommitOrVoteTransaction,
  prepareRemoveLiquidGovernanceEscrowTransactions,
  prepareBurnTransactions,
};
