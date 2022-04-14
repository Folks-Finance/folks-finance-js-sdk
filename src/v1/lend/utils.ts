import { encodeAddress, Indexer } from "algosdk";
import { getParsedValueFromState } from "../utils";
import { calcBorrowBalance, calcHealthFactor, calcThreshold } from "./math";
import { ConversionRate, LoanInfo, PoolInfo, TokenPair, TokenPairInfo } from "./types";

/**
 *
 * Derives loan info from escrow account.
 *
 * @param escrow - escrow account with structure https://developer.algorand.org/docs/rest-apis/indexer/#account
 * @param tokenPair - token pair of the loan
 * @param tokenPairInfo - token pair info
 * @param collateralPoolInfo - collateral pool info
 * @param borrowPoolInfo - borrow pool info
 * @param conversionRate - conversion rate from collateral to borrow asset
 * @param currentRound - results for specified round
 * @returns LoanInfo loan info
 */
function loanInfo(
  escrow: any,
  tokenPair: TokenPair,
  tokenPairInfo: TokenPairInfo,
  collateralPoolInfo: PoolInfo,
  borrowPoolInfo: PoolInfo,
  conversionRate: ConversionRate,
  currentRound: number,
): LoanInfo {
  const escrowAddr = escrow.address;
  const { appId, collateralPool } = tokenPair;
  const { liquidationThreshold } = tokenPairInfo;
  const { depositInterestIndex } = collateralPoolInfo;
  const { borrowInterestIndex } = borrowPoolInfo;
  const { rate, decimals } = conversionRate;

  // escrow balance
  const collateralBalance = escrow['assets']?.find((asset: any) => asset['asset-id'] === collateralPool.fAssetId)?.['amount'];
  if (collateralBalance === undefined) throw new Error("Unable to get escrow: " + escrowAddr + " collateral balance.");

  // escrow local state
  const state = escrow['apps-local-state']?.find((app: any) => app.id === appId)?.['key-value'];
  if (state === undefined) throw new Error("Unable to find escrow: " + escrowAddr + " for token pair " + appId + ".");
  if (getParsedValueFromState(state, 'borrowed') === undefined) throw new Error("No loan for escrow: " + escrowAddr + " for token pair " + appId + ".");

  const ua = String(getParsedValueFromState(state, 'user_address'));
  const borrowed = BigInt(getParsedValueFromState(state, 'borrowed') || 0);
  const bb = BigInt(getParsedValueFromState(state, 'borrow_balance') || 0);
  const lbii = BigInt(getParsedValueFromState(state, 'latest_borrow_interest_index') || 0);

  // calculate health factor
  const threshold = calcThreshold(BigInt(collateralBalance), depositInterestIndex, liquidationThreshold, rate, decimals);
  const borrowBalance = calcBorrowBalance(bb, borrowInterestIndex, lbii);
  const healthFactor = calcHealthFactor(threshold, borrowBalance);

  return {
    currentRound,
    escrowAddress: escrowAddr,
    userAddress: encodeAddress(Buffer.from(ua, "base64")),
    borrowed,
    collateralBalance: BigInt(collateralBalance),
    borrowBalance,
    borrowBalanceLiquidationThreshold: threshold,
    healthFactor,
  }
}

/**
 *
 * Returns escrow accounts for given token pair.
 *
 * @param indexerClient - Algorand indexer client to query
 * @param tokenPair - token pair to query about
 * @param nextToken - token for retrieving next escrows
 * @param round - results for specified round
 * @returns response with structure https://developer.algorand.org/docs/rest-apis/indexer/#searchforaccounts-response-200
 */
async function getEscrows(
  indexerClient: Indexer,
  tokenPair: TokenPair,
  nextToken?: string,
  round?: number,
): Promise<any> {
  const { appId, collateralPool } = tokenPair;
  const req = indexerClient
    .searchAccounts()
    .applicationID(appId)
    .assetID(collateralPool.fAssetId)
    .currencyGreaterThan("0" as any); // TODO: https://github.com/algorand/indexer/issues/144
  if (nextToken) req.nextToken(nextToken);
  if (round) req.round(round);
  return await req.do();
}

export { loanInfo, getEscrows };
