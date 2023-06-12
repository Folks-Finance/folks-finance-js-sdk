import {
  Algodv2,
  AtomicTransactionComposer,
  getApplicationAddress,
  getMethodByName,
  Indexer,
  SuggestedParams,
  Transaction
} from "algosdk";
import {
  getAccountAssets,
  getApplicationGlobalState,
  getParsedValueFromState,
  signer,
  transferAlgoOrAsset
} from "../utils";
import { xAlgoABIContract } from "./abiContracts";
import { XAlgo, XAlgoInfo } from "./types";

/**
 *
 * Returns information regarding the given xAlgo application.
 *
 * @param client - Algorand client to query
 * @param xAlgo - xAlgo to query about
 * @returns DispenserInfo[] dispenser info
 */
async function getXAlgoInfo(client: Algodv2 | Indexer, xAlgo: XAlgo): Promise<XAlgoInfo> {
  const { appId, xAlgoId } = xAlgo;
  const [
    { holdings },
    { currentRound, globalState: state },
  ] = await Promise.all([
    getAccountAssets(client, getApplicationAddress(appId)),
    getApplicationGlobalState(client, appId),
  ]);
  if (state === undefined) throw Error("Could not find xAlgo application");

  const timeDelay = BigInt(getParsedValueFromState(state, "time_delay") || 0);
  const commitEnd = BigInt(getParsedValueFromState(state, "commit_end") || 0);
  const fee = BigInt(getParsedValueFromState(state, "fee") || 0);
  const hasClaimedFee = Boolean(getParsedValueFromState(state, "has_claimed_fee") || 0);
  const isMintingPaused = Boolean(getParsedValueFromState(state, "is_minting_paused") || 0);

  const algoBalance = holdings.get(0)! - BigInt(0.2e6);
  const xAlgoCirculatingBalance = BigInt(10e15) - holdings.get(xAlgoId)!;

  return {
    currentRound,
    timeDelay,
    commitEnd,
    fee,
    hasClaimedFee,
    isMintingPaused,
    algoBalance,
    xAlgoCirculatingBalance,
  };
}

/**
 *
 * Returns a group transaction to mint xALGO for ALGO.
 *
 * @param xAlgo - xAlgo application to mint xALGO from
 * @param senderAddr - account address for the sender
 * @param amount - amount of ALGO to send
 * @param minReceivedAmount - min amount of xALGO expected to receive
 * @param params - suggested params for the transactions with the fees overwritten
 * @returns Transaction[] mint transactions
 */
function prepareMintXAlgoTransactions(
  xAlgo: XAlgo,
  senderAddr: string,
  amount: number | bigint,
  minReceivedAmount: number | bigint,
  params: SuggestedParams,
): Transaction[] {
  const { appId, xAlgoId } = xAlgo;
  const sendAlgo = {
    txn: transferAlgoOrAsset(0, senderAddr, getApplicationAddress(appId), amount, { ...params, flatFee: true, fee: 0 }),
    signer,
  };
  const atc = new AtomicTransactionComposer();
  atc.addMethodCall({
    sender: senderAddr,
    signer,
    appID: appId,
    method: getMethodByName(xAlgoABIContract.methods, "mint"),
    methodArgs: [sendAlgo, xAlgoId, minReceivedAmount],
    suggestedParams: { ...params, flatFee: true, fee: 2000 },
  });
  return atc.buildGroup().map(({ txn }) => { txn.group = undefined; return txn; });
}

/**
 *
 * Returns a group transaction to burn xALGO for ALGO.
 *
 * @param xAlgo - xAlgo application to mint xALGO from
 * @param senderAddr - account address for the sender
 * @param amount - amount of xALGO to send
 * @param minReceivedAmount - min amount of ALGO expected to receive
 * @param params - suggested params for the transactions with the fees overwritten
 * @returns Transaction[] mint transactions
 */
function prepareBurnXAlgoTransactions(
  xAlgo: XAlgo,
  senderAddr: string,
  amount: number | bigint,
  minReceivedAmount: number | bigint,
  params: SuggestedParams,
): Transaction[] {
  const { appId, xAlgoId } = xAlgo;
  const sendXAlgo = {
    txn: transferAlgoOrAsset(xAlgoId, senderAddr, getApplicationAddress(appId), amount, params),
    signer,
  }
  const atc = new AtomicTransactionComposer();
  atc.addMethodCall({
    sender: senderAddr,
    signer,
    appID: appId,
    method: getMethodByName(xAlgoABIContract.methods, "burn"),
    methodArgs: [sendXAlgo, xAlgoId, minReceivedAmount],
    suggestedParams: { ...params, flatFee: true, fee: 2000 },
  });
  return atc.buildGroup().map(({ txn }) => { txn.group = undefined; return txn; });
}

export {
  getXAlgoInfo,
  prepareMintXAlgoTransactions,
  prepareBurnXAlgoTransactions,
};
