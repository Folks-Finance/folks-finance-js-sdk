import { LendingPoolInfo, PactLendingPool, PoolManagerInfo } from "./types";
import { Algodv2, Indexer } from "algosdk";
import { getApplicationGlobalState, getParsedValueFromState, parseUint64s } from "../../utils";
import { compoundEveryHour, ONE_16_DP } from "./mathLib";

/**
 *
 * Returns information regarding the given Pact lending pool.
 *
 * @param client - Algorand client to query
 * @param lendingPool - Pact lending pool to query about
 * @param poolManagerInfo - pool manager info which is returned by retrievePoolManagerInfo function
 * @returns Promise<LendingPoolInfo> lending pool info
 */
async function retrievePactLendingPoolInfo(
  client: Algodv2 | Indexer,
  lendingPool: PactLendingPool,
  poolManagerInfo: PoolManagerInfo,
): Promise<LendingPoolInfo> {
  const { currentRound, globalState: state } = await getApplicationGlobalState(client, lendingPool.lpPoolAppId);
  if (state === undefined) throw Error("Could not find lending pool");
  const config = parseUint64s(String(getParsedValueFromState(state, "CONFIG")));
  const fa0s = BigInt(getParsedValueFromState(state, "A") || 0);
  const fa1s = BigInt(getParsedValueFromState(state, "B") || 0);
  const ltcs = BigInt(getParsedValueFromState(state, "L") || 0);

  // pact pool swap fee interest
  const res = await fetch(`https://api.pact.fi/api/pools/${lendingPool.lpPoolAppId}`);
  if (!res.ok || res.status !== 200) throw Error("Failed to fetch pact swap fee from api");
  const pactPoolData = await res.json();
  const swapFeeInterestRate = BigInt(Number(pactPoolData?.["apr_7d"] || 0) * 1e16);
  const tvlUsd = Number(pactPoolData?.["tvl_usd"] || 0);

  // lending pool deposit interest
  const pool0 = poolManagerInfo.pools[lendingPool.pool0AppId];
  const pool1 = poolManagerInfo.pools[lendingPool.pool1AppId];
  if (pool0 === undefined || pool1 === undefined) throw Error("Could not find deposit pool");

  return {
    currentRound,
    fAsset0Supply: fa0s,
    asset0Supply: BigInt(0),
    fAsset1Supply: fa1s,
    asset1Supply: BigInt(0),
    liquidityTokenCirculatingSupply: ltcs,
    fee: config[2],
    swapFeeInterestRate,
    swapFeeInterestYield: compoundEveryHour(swapFeeInterestRate, ONE_16_DP),
    asset0DepositInterestRate: pool0.depositInterestRate / BigInt(2),
    asset0DepositInterestYield: pool0.depositInterestYield / BigInt(2),
    asset1DepositInterestRate: pool1.depositInterestRate / BigInt(2),
    asset1DepositInterestYield: pool1.depositInterestYield / BigInt(2),
    tvlUsd,
  };
}

export { retrievePactLendingPoolInfo };
