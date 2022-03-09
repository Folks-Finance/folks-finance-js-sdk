import IndexerClient from "algosdk/dist/types/src/client/v2/indexer/indexer";
import { enc, getParsedValueFromState, transferAlgoOrAsset } from "../utils";
import { EarnAndLock, EarnAndLockInfo, LockedDepositInfo, Pool } from "./types";
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
 * Returns array of earn and locks.
 *
 * @param indexerClient - Algorand indexer client to query
 * @param pool - pool to query about
 * @returns EarnAndLock[] earn and locks
 */
async function getEarnAndLocks(indexerClient: IndexerClient, pool: Pool): Promise<EarnAndLock[]> {
  const { appId } = pool;
  const res = await indexerClient.searchAccounts().applicationID(pool.appId).do();

  // build array of earn and locks
  const earnAndLocks: EarnAndLock[] = [];
  res['accounts'].forEach((account: any) => {
      const state = account['apps-local-state'].find((app: any) => app.id === appId)?.['key-value'];
      const liquidityAppId = getParsedValueFromState(state, 'liquidity_app_id');
      if (liquidityAppId !== undefined) earnAndLocks.push({
        appId: Number(liquidityAppId),
        pool,
        linkAddr: account['address'],
      });
  });
  return earnAndLocks;
}

/**
 *
 * Returns information regarding the given earn and lock application.
 *
 * @param indexerClient - Algorand indexer client to query
 * @param appId - earn and lock app id
 * @returns EarnAndLockInfo[] earn and lock info
 */
async function getEarnAndLockInfo(indexerClient: IndexerClient, appId: number): Promise<EarnAndLockInfo> {
  const { application } = await indexerClient.lookupApplications(appId).do();
  const state = application['params']['global-state'];

  const rewardsRatio = BigInt(getParsedValueFromState(state, 'reward_ratio') || 0);
  const timeLocked = BigInt(getParsedValueFromState(state, 'time_locked') || 0);

  return { rewardsRatio, timeLocked };
}

/**
 *
 * Returns a group transaction to provide liquidity in earn and lock.
 *
 * @param pool - pool to provide liquidity in
 * @param earnAndLock - earn and lock
 * @param senderAddr - account address for the sender
 * @param depositAmount - amount to deposit (will be locked)
 * @param params - suggested params for the transactions with the fees overwritten
 * @returns { txns: Transaction[], escrow: Account } object containing group transaction and escrow account
 */
function prepareProvideLiquidityTransactions(
  pool: Pool,
  earnAndLock: EarnAndLock,
  senderAddr: string,
  depositAmount: number | bigint,
  params: SuggestedParams,
): ({ txns: Transaction[], escrow: Account }) {
  const { assetId, fAssetId, frAssetId } = pool;
  const { linkAddr } = earnAndLock;

  const escrow = generateAccount();

  const fundEscrow = transferAlgoOrAsset(0, senderAddr, escrow.addr, 0.407e6, { ...params, flatFee: true, fee: 8000 });
  const optInCall = makeApplicationOptInTxn(escrow.addr, { ...params, flatFee: true, fee: 0 }, earnAndLock.appId, undefined, undefined, undefined, undefined, undefined, undefined, getApplicationAddress(earnAndLock.appId));
  const liquidityCall = makeApplicationNoOpTxn(senderAddr, { ...params, flatFee: true, fee: 0 }, earnAndLock.appId, [enc.encode("pl")], [escrow.addr], undefined, [fAssetId]);
  const dispenserCall = makeApplicationNoOpTxn(senderAddr, { ...params, flatFee: true, fee: 0 }, pool.appId, [enc.encode("pl")], [linkAddr, escrow.addr], [earnAndLock.appId], [fAssetId, frAssetId]);
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
 * @param earnAndLock - earn and lock of the deposit
 * @param escrowAddr - escrow address to query about
 * @returns Promise<LoanInfo> loan info
 */
async function getLockedDepositInfo(
  indexerClient: IndexerClient,
  earnAndLock: EarnAndLock,
  escrowAddr: string
): Promise<LockedDepositInfo> {
  const { appId, pool } = earnAndLock;

  // get escrow account
  const { account } = await indexerClient.lookupAccountByID(escrowAddr).do();

  // escrow balance
  const lockedBalance = account['assets'].find((asset: any) => asset['asset-id'] === pool.fAssetId)?.['amount'];
  if (lockedBalance === undefined) throw new Error("Unable to get escrow: " + escrowAddr + " locked balance.");

  // escrow local state
  const state = account['apps-local-state'].find((app: any) => app.id === appId)?.['key-value'];
  if (state === undefined) throw new Error("Unable to find escrow: " + escrowAddr + " for earn and lock " + appId + ".");
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
 * @param earnAndLock - earn and lock
 * @param senderAddr - account address for the sender
 * @param escrowAddr - escrow address that will hold the collateral
 * @param params - suggested params for the transactions with the fees overwritten
 * @returns Transaction claim locked deposit transaction
 */
function prepareClaimLockedDepositTransactions(
  earnAndLock: EarnAndLock,
  senderAddr: string,
  escrowAddr: string,
  params: SuggestedParams,
) {
  const { appId, pool } = earnAndLock;
  return makeApplicationNoOpTxn(senderAddr, { ...params, flatFee: true, fee: 2000 }, appId, [enc.encode("c")], [escrowAddr], undefined, [pool.fAssetId]);
}

export {
  getEarnAndLocks,
  getEarnAndLockInfo,
  prepareProvideLiquidityTransactions,
  getLockedDepositInfo,
  prepareClaimLockedDepositTransactions,
}
