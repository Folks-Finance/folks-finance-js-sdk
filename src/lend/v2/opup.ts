import {
  encodeUint64,
  makeApplicationNoOpTxn,
  SuggestedParams,
  Transaction
} from "algosdk";
import { OpUp } from "./types";

/**
 *
 * Given a transaction or transaction group, prefixes it with appl call to increase opcode budget and returns the new
 * transaction group.
 * A lot of the lending operations require additional opcode cost so use this to increase the budget.
 *
 * @param opup - opup applications
 * @param userAddr - account address for the user
 * @param transactions - transaction(s) to prefix opup to
 * @param numInnerTransactions - number of inner transactions to issue (remaining opcode is 691 + 689 * num.inner.txns)
 * @param params - suggested params for the transactions with the fees overwritten
 * @returns Transaction[] transaction group with opup prefixed
 */
function prefixWithOpUp(
  opup: OpUp,
  userAddr: string,
  transactions: Transaction | Transaction[],
  numInnerTransactions: number,
  params: SuggestedParams,
): Transaction[] {
  if (!Number.isInteger(numInnerTransactions) || numInnerTransactions > 256) {
    throw Error("Invalid number of inner transactions");
  }

  const { callerAppId, baseAppId } = opup;
  const fee = (numInnerTransactions + 1) * 1000;
  const budget = numInnerTransactions === 0 ? 0 : 686 * numInnerTransactions - 3;
  const prefix = makeApplicationNoOpTxn(userAddr, { ...params, flatFee: true, fee }, callerAppId, [encodeUint64(budget)], undefined, [baseAppId]);
  const txns = Array.isArray(transactions) ? transactions : [transactions];
  return [prefix, ...txns].map(txn => { txn.group = undefined; return txn; });
}

export { prefixWithOpUp };
