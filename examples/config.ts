import { Algodv2, Indexer, mnemonicToSecretKey } from "algosdk";

export const sender = mnemonicToSecretKey(""); // TODO: Fill in

export const algodClient = new Algodv2("", "https://testnet-api.algonode.cloud/", 443);
export const indexerClient = new Indexer("", "https://testnet-idx.algonode.cloud/", 443);
