import IndexerClient from "algosdk/dist/types/src/client/v2/indexer/indexer";
import { fromIntToBytes8Hex, getParsedValueFromState } from "../utils";
import { calcConversionRate } from "./math";
import { ConversionRate, Oracle, OraclePrice, OraclePrices } from "./types";

function parseOracleValue(base64Value: string) {
  const value = Buffer.from(base64Value, 'base64').toString('hex');
  // first 8 bytes are the price
  const price = BigInt("0x" + value.slice(0, 16));
  // next 8 bytes are the timestamp
  const timestamp = BigInt("0x" + value.slice(16, 32));
  return { price, timestamp };
}

/**
 *
 * Returns oracle prices for given oracle and provided assets.
 *
 * @param indexerClient - Algorand indexer client to query
 * @param oracle - oracle to query
 * @param assets - assets to get prices for
 * @returns OraclePrices oracle prices
 */
async function getOraclePrices(
  indexerClient: IndexerClient,
  oracle: Oracle,
  assets: number[],
): Promise<OraclePrices> {
  const { oracle1AppId } = oracle;
  const res = await indexerClient.lookupApplications(oracle1AppId).do();
  const state = res['application']['params']['global-state'];

  let prices: Record<number, OraclePrice> = {};
  assets.forEach(assetId => {
    const base64Value = String(getParsedValueFromState(state, fromIntToBytes8Hex(assetId), 'hex'));
    prices[assetId] = parseOracleValue(base64Value);
  });

  return { currentRound: res['current-round'], prices };
}

/**
 *
 * Returns conversion rate between two prices.
 *
 * @param collateralPrice - collateral asset price
 * @param borrowPrice - borrow asset price
 * @returns ConversionRate conversion rate
 */
function getConversionRate(collateralPrice: bigint, borrowPrice: bigint): ConversionRate {
  return calcConversionRate(collateralPrice, borrowPrice);
}

export { getOraclePrices, getConversionRate };
