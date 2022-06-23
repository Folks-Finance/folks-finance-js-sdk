import {
  makeAssetTransferTxnWithSuggestedParams,
  makePaymentTxnWithSuggestedParams,
  SuggestedParams,
  Transaction,
} from "algosdk";
import { TealKeyValue } from "algosdk/dist/types/src/client/v2/algod/models/types";

const enc = new TextEncoder();

/**
 * Transfer algo or asset. 0 assetId indicates algo transfer, else asset transfer.
 */
function transferAlgoOrAsset(
  assetId: number,
  from: string,
  to: string,
  amount: number | bigint,
  params: SuggestedParams,
): Transaction {
  return assetId !== 0
    ? makeAssetTransferTxnWithSuggestedParams(from, to, undefined, undefined, amount, undefined, assetId, params)
    : makePaymentTxnWithSuggestedParams(from, to, amount, undefined, undefined, params);
}

function unixTime(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Convert an int to its hex representation with a fixed length of 8 bytes.
 */
function fromIntToBytes8Hex(num: number | bigint) {
  return num.toString(16).padStart(16, '0');
}

function encodeToBase64(str: string, encoding: BufferEncoding = 'utf8') {
  return Buffer.from(str, encoding).toString('base64');
}

function getParsedValueFromState(
  state: TealKeyValue[],
  key: string,
  encoding: BufferEncoding = 'utf8',
): string | bigint | undefined {
  const encodedKey: string = encoding ? encodeToBase64(key, encoding) : key;
  const keyValue: TealKeyValue | undefined = state.find(entry => entry.key === encodedKey);
  if (keyValue === undefined) return;
  const { value } = keyValue;
  if (value.type === 1) return value.bytes;
  if (value.type === 2) return BigInt(value.uint);
  return;
}

function parseUint64s(base64Value: string): bigint[] {
  const value = Buffer.from(base64Value, 'base64').toString('hex');

  // uint64s are 8 bytes each
  const uint64s: bigint[] = [];
  for (let i = 0; i < value.length; i += 16) {
    uint64s.push(BigInt("0x" + value.slice(i, i + 16)))
  }
  return uint64s
}

export { enc, transferAlgoOrAsset, unixTime, fromIntToBytes8Hex, getParsedValueFromState, parseUint64s };
