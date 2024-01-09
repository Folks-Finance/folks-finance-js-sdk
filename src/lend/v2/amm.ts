import { Algodv2, Indexer } from "algosdk";
import {
  getAccountApplicationLocalState,
  getApplicationGlobalState,
  getParsedValueFromState,
  parseUint64s,
} from "../../utils";
import { compoundEveryHour, ONE_16_DP } from "./mathLib";
import { LendingPoolInfo, PactLendingPool, PoolManagerInfo, TinymanLendingPool } from "./types";

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
  const [lpInfoRes, farmInfoRes] = await Promise.all([
    fetch(`https://api.pact.fi/api/pools/${lendingPool.lpPoolAppId}`),
    fetch("https://api.pact.fi/api/farms/all"),
  ]);
  if (!lpInfoRes.ok || lpInfoRes.status !== 200) throw Error("Failed to fetch pact swap fee from api");
  const pactPoolData = await lpInfoRes.json();
  const swapFeeInterestRate = BigInt(Math.round(Number(pactPoolData?.["apr_7d"] || 0) * 1e16));
  const tvlUsd = Number(pactPoolData?.["tvl_usd"] || 0);

  // if farm apr request failed for any reason, we just set farm interest rate to 0
  // avoiding the whole function to fail
  const farmData = farmInfoRes.ok ? await farmInfoRes.json() : [];
  const farm = farmData.find((f: any) => f?.pool_id === lendingPool.lpPoolAppId);
  const farmInterestYield = BigInt(Math.round(Number(farm?.apr || 0) * 1e16));

  // lending pool deposit interest
  const pool0 = poolManagerInfo.pools[lendingPool.pool0AppId];
  const pool1 = poolManagerInfo.pools[lendingPool.pool1AppId];
  if (pool0 === undefined || pool1 === undefined) throw Error("Could not find deposit pool");

  return {
    currentRound,
    fAsset0Supply: fa0s,
    fAsset1Supply: fa1s,
    liquidityTokenCirculatingSupply: ltcs,
    fee: config[2],
    swapFeeInterestRate,
    swapFeeInterestYield: compoundEveryHour(swapFeeInterestRate, ONE_16_DP),
    asset0DepositInterestRate: pool0.depositInterestRate / BigInt(2),
    asset0DepositInterestYield: pool0.depositInterestYield / BigInt(2),
    asset1DepositInterestRate: pool1.depositInterestRate / BigInt(2),
    asset1DepositInterestYield: pool1.depositInterestYield / BigInt(2),
    farmInterestYield,
    tvlUsd,
  };
}

/**
 *
 * Returns information regarding the given Tinyman lending pool.
 *
 * @param client - Algorand client to query
 * @param tinymanAppId - Tinyman application id where lending pool belongs to
 * @param lendingPool - Pact lending pool to query about
 * @param poolManagerInfo - pool manager info which is returned by retrievePoolManagerInfo function
 * @returns Promise<LendingPoolInfo> lending pool info
 */
async function retrieveTinymanLendingPoolInfo(
  client: Algodv2 | Indexer,
  tinymanAppId: number,
  lendingPool: TinymanLendingPool,
  poolManagerInfo: PoolManagerInfo,
): Promise<LendingPoolInfo> {
  const { currentRound, localState: state } = await getAccountApplicationLocalState(
    client,
    tinymanAppId,
    lendingPool.lpPoolAppAddress,
  );
  if (state === undefined) throw Error("Could not find lending pool");
  const fee = BigInt(getParsedValueFromState(state, "total_fee_share") || 0);
  const fa0s = BigInt(getParsedValueFromState(state, "asset_2_reserves") || 0);
  const fa1s = BigInt(getParsedValueFromState(state, "asset_1_reserves") || 0);
  const ltcs = BigInt(getParsedValueFromState(state, "issued_pool_tokens") || 0);

  // pact pool swap fee interest
  const res = await fetch(`https://mainnet.analytics.tinyman.org/api/v1/pools/${lendingPool.lpPoolAppAddress}`);
  if (!res.ok || res.status !== 200) throw Error("Failed to fetch tinyman swap fee from api");
  const tmPoolData = await res.json();

  const swapFeeInterestRate = BigInt(Math.round(Number(tmPoolData?.["annual_percentage_rate"] || 0) * 1e16));
  const swapFeeInterestYield = BigInt(Math.round(Number(tmPoolData?.["annual_percentage_yield"] || 0) * 1e16));
  const farmInterestYield = BigInt(
    Math.round(Number(tmPoolData?.["staking_total_annual_percentage_yield"] || 0) * 1e16),
  );
  const tvlUsd = Number(tmPoolData?.["liquidity_in_usd"] || 0);

  // lending pool deposit interest
  const pool0 = poolManagerInfo.pools[lendingPool.pool0AppId];
  const pool1 = poolManagerInfo.pools[lendingPool.pool1AppId];
  if (pool0 === undefined || pool1 === undefined) throw Error("Could not find deposit pool");

  return {
    currentRound,
    fAsset0Supply: fa0s,
    fAsset1Supply: fa1s,
    liquidityTokenCirculatingSupply: ltcs,
    fee,
    swapFeeInterestRate,
    swapFeeInterestYield,
    asset0DepositInterestRate: pool0.depositInterestRate / BigInt(2),
    asset0DepositInterestYield: pool0.depositInterestYield / BigInt(2),
    asset1DepositInterestRate: pool1.depositInterestRate / BigInt(2),
    asset1DepositInterestYield: pool1.depositInterestYield / BigInt(2),
    farmInterestYield,
    tvlUsd,
  };
}

export { retrievePactLendingPoolInfo, retrieveTinymanLendingPoolInfo };
