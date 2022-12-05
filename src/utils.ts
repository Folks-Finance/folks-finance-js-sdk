import {
  Algodv2,
  Indexer,
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

const signer = async () => [];

function unixTime(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Wraps a call to Algorand client (algod/indexer) and returns global state
 */
async function getApplicationGlobalState(client: Algodv2 | Indexer, appId: number): Promise<{
  currentRound?: number;
  globalState?: TealKeyValue[];
}> {
  const res = await (client instanceof Algodv2 ?
      client.getApplicationByID(appId) :
      client.lookupApplications(appId)
  ).do();

  // algod https://developer.algorand.org/docs/rest-apis/algod/v2/#application
  // indexer https://developer.algorand.org/docs/rest-apis/indexer/#lookupapplicationbyid-response-200
  const app = client instanceof Algodv2 ? res : res['application'];

  return {
    currentRound: res['current-round'],
    globalState: app['params']['global-state'],
  };
}

/**
 * Wraps a call to Algorand client (algod/indexer) and returns local state
 */
async function getAccountApplicationLocalState(client: Algodv2 | Indexer, appId: number, addr: string): Promise<{
  currentRound?: number;
  localState?: TealKeyValue[];
}> {
  const res = await (client instanceof Algodv2 ?
      client.accountApplicationInformation(addr, appId) :
      client.lookupAccountAppLocalStates(addr).applicationID(appId)
  ).do();

  // algod https://developer.algorand.org/docs/rest-apis/algod/v2/#accountapplicationinformation-response-200
  // indexer https://developer.algorand.org/docs/rest-apis/indexer/#lookupaccountapplocalstates-response-200
  const localState = client instanceof Algodv2 ?
    res['app-local-state'] :
    res['apps-local-states']?.find(({ id }: any) => id === appId);

  return {
    currentRound: res['current-round'],
    localState: localState['key-value'],
  };
}

/**
 * Wraps a call to Algorand client (algod/indexer) and returns asset holdings
 */
async function getAccountAssets(client: Algodv2 | Indexer, addr: string): Promise<{
  currentRound?: number;
  holdings: { assetId: number; balance: bigint }[];
}> {
  const res = await (client instanceof Algodv2 ?
      client.accountInformation(addr) :
      client.lookupAccountAssets(addr)
  ).do();

  // algod https://developer.algorand.org/docs/rest-apis/algod/v2/#account
  // indexer https://developer.algorand.org/docs/rest-apis/indexer/#lookupaccountassets-response-200
  const assets = res['assets'];

  const holdings: { assetId: number, balance: bigint }[] = [];
  assets.forEach(({ 'asset-id': assetId, amount }: any) => {
    holdings.push({ assetId, balance: BigInt(amount) });
  });

  return {
    currentRound: res['current-round'],
    holdings,
  };
}


/**
 * Convert an int to its hex representation with a fixed length of 8 bytes.
 */
function fromIntToBytes8Hex(num: number | bigint) {
  return num.toString(16).padStart(16, '0');
}

/**
 * Convert an int to its hex representation with a fixed length of 1 byte.
 */
function fromIntToByteHex(num: number | bigint) {
  return num.toString(16).padStart(2, '0');
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
  return uint64s;
}

function parseUint8s(base64Value: string): bigint[] {
  const value = Buffer.from(base64Value, 'base64').toString('hex');
  // uint8s are 1 byte each
  const uint8s: bigint[] = [];
  for (let i = 0; i < value.length; i += 2) {
    uint8s.push(BigInt("0x" + value.slice(i, i + 2)))
  }
  return uint8s;
}

function parseBitsAsBooleans(base64Value: string): boolean[] {
  const value = Buffer.from(base64Value, 'base64').toString('hex');
  const bits = ("00000000" + Number("0x" + value).toString(2)).slice(-8)
  const bools: boolean[] = [];
  for (let i = 0; i < bits.length; i++) {
    bools.push(Boolean(parseInt(bits[i])));
  }
  return bools;
}

export {
  enc,
  transferAlgoOrAsset,
  signer,
  unixTime,
  getApplicationGlobalState,
  getAccountApplicationLocalState,
  getAccountAssets,
  fromIntToBytes8Hex,
  fromIntToByteHex,
  getParsedValueFromState,
  parseUint64s,
  parseUint8s,
  parseBitsAsBooleans,
};
