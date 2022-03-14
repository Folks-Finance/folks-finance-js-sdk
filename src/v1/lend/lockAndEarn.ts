import IndexerClient from "algosdk/dist/types/src/client/v2/indexer/indexer";
import { enc, getParsedValueFromState, transferAlgoOrAsset } from "../utils";
import { LockAndEarn, LockAndEarnInfo, LockedDepositInfo, Pool } from "./types";
import {
  Account,
  assignGroupID,
  encodeAddress,
  generateAccount,
  getApplicationAddress,
  makeApplicationNoOpTxn,
  makeApplicationOptInTxn,
  SuggestedParams,
  Transaction
} from "algosdk";

/**
 *
 * Returns array of lock and earns.
 *
 * @param indexerClient - Algorand indexer client to query
 * @param pool - pool to query about
 * @returns LockAndEarn[] lock and earns
 */
async function getLockAndEarns(indexerClient: IndexerClient, pool: Pool): Promise<LockAndEarn[]> {
  const { appId } = pool;
  const res = await indexerClient.searchAccounts().applicationID(pool.appId).do();

  // build array of lock and earns
  const lockAndEarns: LockAndEarn[] = [];
  res['accounts'].forEach((account: any) => {
      const state = account['apps-local-state'].find((app: any) => app.id === appId)?.['key-value'];
      const liquidityAppId = getParsedValueFromState(state, 'liquidity_app_id');
      if (liquidityAppId !== undefined) lockAndEarns.push({
        appId: Number(liquidityAppId),
        pool,
        linkAddr: account['address'],
      });
  });
  return lockAndEarns;
}

/**
 *
 * Returns information regarding the given lock and earn application.
 *
 * @param indexerClient - Algorand indexer client to query
 * @param appId - lock and earn app id
 * @returns LockAndEarnInfo[] lock and earn info
 */
async function getLockAndEarnInfo(indexerClient: IndexerClient, appId: number): Promise<LockAndEarnInfo> {
  const { application } = await indexerClient.lookupApplications(appId).do();
  const state = application['params']['global-state'];

  const rewardsRatio = BigInt(getParsedValueFromState(state, 'rewards_ratio') || 0);
  const timeLocked = BigInt(getParsedValueFromState(state, 'time_locked') || 0);

  return { rewardsRatio, timeLocked };
}

/**
 *
 * Returns a group transaction to provide liquidity in lock and earn.
 *
 * @param pool - pool to provide liquidity in
 * @param lockAndEarn - lock and earn
 * @param senderAddr - account address for the sender
 * @param depositAmount - amount to deposit (will be locked)
 * @param params - suggested params for the transactions with the fees overwritten
 * @returns { txns: Transaction[], escrow: Account } object containing group transaction and escrow account
 */
function prepareProvideLiquidityTransactions(
  pool: Pool,
  lockAndEarn: LockAndEarn,
  senderAddr: string,
  depositAmount: number | bigint,
  params: SuggestedParams,
): ({ txns: Transaction[], escrow: Account }) {
  const { assetId, fAssetId, frAssetId } = pool;
  const { linkAddr } = lockAndEarn;

  const escrow = generateAccount();

  const fundEscrow = transferAlgoOrAsset(0, senderAddr, escrow.addr, 0.407e6, { ...params, flatFee: true, fee: 8000 });
  const optInCall = makeApplicationOptInTxn(escrow.addr, { ...params, flatFee: true, fee: 0 }, lockAndEarn.appId, undefined, undefined, undefined, undefined, undefined, undefined, getApplicationAddress(lockAndEarn.appId));
  const liquidityCall = makeApplicationNoOpTxn(senderAddr, { ...params, flatFee: true, fee: 0 }, lockAndEarn.appId, [enc.encode("pl")], [escrow.addr], undefined, [fAssetId]);
  const dispenserCall = makeApplicationNoOpTxn(senderAddr, { ...params, flatFee: true, fee: 0 }, pool.appId, [enc.encode("pl")], [linkAddr, escrow.addr], [lockAndEarn.appId], [fAssetId, frAssetId]);
  const depositTx = transferAlgoOrAsset(assetId, senderAddr, getApplicationAddress(pool.appId), depositAmount, {...params, fee: 0, flatFee: true});

  return {
    txns: assignGroupID([fundEscrow, optInCall, liquidityCall, dispenserCall, depositTx]),
    escrow,
  };
}

/**
 *
 * Returns information regarding the locked deposit.
 *
 * @param indexerClient - Algorand indexer client to query
 * @param lockAndEarn - lock and earn of the deposit
 * @param escrowAddr - escrow address to query about
 * @returns Promise<LoanInfo> loan info
 */
async function getLockedDepositInfo(
  indexerClient: IndexerClient,
  lockAndEarn: LockAndEarn,
  escrowAddr: string
): Promise<LockedDepositInfo> {
  const { appId, pool } = lockAndEarn;

  // get escrow account
  const { account } = await indexerClient.lookupAccountByID(escrowAddr).do();

  // escrow balance
  const lockedBalance = account['assets'].find((asset: any) => asset['asset-id'] === pool.fAssetId)?.['amount'];
  if (lockedBalance === undefined) throw new Error("Unable to get escrow: " + escrowAddr + " locked balance.");

  // escrow local state
  const state = account['apps-local-state'].find((app: any) => app.id === appId)?.['key-value'];
  if (state === undefined) throw new Error("Unable to find escrow: " + escrowAddr + " for lock and earn " + appId + ".");
  const ua = String(getParsedValueFromState(state, 'user_address'));
  const release = BigInt(getParsedValueFromState(state, 'release') || 0);

  return {
    escrowAddress: escrowAddr,
    userAddress: encodeAddress(Buffer.from(ua)),
    lockedBalance,
    release,
  }
}

/**
 *
 * Returns a transaction to claim locked deposit.
 *
 * @param lockAndEarn - lock and earn
 * @param senderAddr - account address for the sender
 * @param escrowAddr - escrow address that will hold the collateral
 * @param params - suggested params for the transactions with the fees overwritten
 * @returns Transaction claim locked deposit transaction
 */
function prepareClaimLockedDepositTransactions(
  lockAndEarn: LockAndEarn,
  senderAddr: string,
  escrowAddr: string,
  params: SuggestedParams,
) {
  const { appId, pool } = lockAndEarn;
  return makeApplicationNoOpTxn(senderAddr, { ...params, flatFee: true, fee: 2000 }, appId, [enc.encode("c")], [escrowAddr], undefined, [pool.fAssetId]);
}

export {
  getLockAndEarns,
  getLockAndEarnInfo,
  prepareProvideLiquidityTransactions,
  getLockedDepositInfo,
  prepareClaimLockedDepositTransactions,
}
