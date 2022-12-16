import {
  decodeAddress,
  encodeAddress,
  getApplicationAddress,
  Indexer,
  makePaymentTxnWithSuggestedParams,
  SuggestedParams,
  Transaction,
} from "algosdk";
import { TealKeyValue } from "algosdk/dist/types/client/v2/algod/models/types";
import { enc, getParsedValueFromState, parseUint64s } from "../../utils";
import {
  calcBorrowAssetLoanValue,
  calcBorrowBalance,
  calcBorrowInterestIndex,
  calcBorrowUtilisationRatio,
  calcCollateralAssetLoanValue,
  calcLiquidationMargin,
  calcLTVRatio,
  calcWithdrawReturn,
} from "./formulae";
import { expBySquaring, ONE_16_DP, ONE_4_DP, SECONDS_IN_YEAR } from "./mathLib";
import {
  LoanInfo,
  LoanLocalState,
  OraclePrices,
  PoolManagerInfo,
  UserLoanInfo,
  UserLoanInfoBorrow,
  UserLoanInfoCollateral,
} from "./types";

export function addEscrowNoteTransaction(
  userAddr: string,
  escrowAddr: string,
  appId: number,
  notePrefix: string,
  params: SuggestedParams,
): Transaction {
  const note = Uint8Array.from([...enc.encode(notePrefix), ...decodeAddress(escrowAddr).publicKey]);
  return makePaymentTxnWithSuggestedParams(userAddr, getApplicationAddress(appId), 0, undefined, note, params);
}

export function removeEscrowNoteTransaction(
  escrowAddr: string,
  userAddr: string,
  notePrefix: string,
  params: SuggestedParams,
): Transaction {
  const note = Uint8Array.from([...enc.encode(notePrefix), ...decodeAddress(escrowAddr).publicKey]);
  return makePaymentTxnWithSuggestedParams(escrowAddr, userAddr, 0, userAddr, note, params);
}

export async function getEscrows(
  indexerClient: Indexer,
  userAddr: string,
  appId: number,
  addNotePrefix: string,
  removeNotePrefix: string,
): Promise<Set<string>> {
  const escrows: Set<string> = new Set();
  const appAddress = getApplicationAddress(appId);

  const addedReq = indexerClient
    .searchForTransactions()
    .address(userAddr)
    .addressRole("sender")
    .txType("pay")
    .notePrefix(enc.encode(addNotePrefix))
    .do();
  const removedReq = indexerClient
    .searchForTransactions()
    .address(userAddr)
    .addressRole("receiver")
    .txType("pay")
    .notePrefix(enc.encode(removeNotePrefix))
    .do();

  const [added, removed] = await Promise.all([addedReq, removedReq]);

  for (const txn of added["transactions"]) {
    const receiver: string = txn["payment-transaction"]["receiver"];
    if (receiver === appAddress) {
      const note: Uint8Array = Buffer.from(txn["note"], "base64");
      const address = encodeAddress(note.slice(addNotePrefix.length));
      escrows.add(address);
    }
  }
  for (const txn of removed["transactions"]) {
    const sender: string = txn["sender"];
    escrows.delete(sender);
  }

  return escrows;
}

/**
 *
 * Derives loan local state from escrow account.
 *
 * @param state - escrow account local state
 * @param loanAppId - loan application to query about
 * @param escrowAddr - escrow address
 * @returns LoanLocalState loan local state
 */
export function loanLocalState(state: TealKeyValue[], loanAppId: number, escrowAddr: string): LoanLocalState {
  // standard
  const userAddress = encodeAddress(Buffer.from(String(getParsedValueFromState(state, "u")), "base64"));
  const colPls = parseUint64s(String(getParsedValueFromState(state, "c")));
  const borPls = parseUint64s(String(getParsedValueFromState(state, "b")));
  const colBals = parseUint64s(String(getParsedValueFromState(state, "cb")));
  const borAms = parseUint64s(String(getParsedValueFromState(state, "ba")));
  const borBals = parseUint64s(String(getParsedValueFromState(state, "bb")));
  const lbii = parseUint64s(String(getParsedValueFromState(state, "l")));
  const sbir = parseUint64s(String(getParsedValueFromState(state, "r")));
  const lsc = parseUint64s(String(getParsedValueFromState(state, "t")));

  // custom
  const collaterals = [];
  const borrows = [];
  for (let i = 0; i < 15; i++) {
    // add collateral
    collaterals.push({
      poolAppId: Number(colPls[i]),
      fAssetBalance: colBals[i],
    });

    // add borrow
    borrows.push({
      poolAppId: Number(borPls[i]),
      borrowedAmount: borAms[i],
      borrowBalance: borBals[i],
      latestBorrowInterestIndex: lbii[i],
      stableBorrowInterestRate: sbir[i],
      latestStableChange: lsc[i],
    });
  }

  return {
    userAddress,
    escrowAddress: escrowAddr,
    collaterals,
    borrows,
  };
}

/**
 *
 * Derives user loan info from escrow account.
 * Use for advanced use cases where optimising number of network request.
 *
 * @param localState - local state of escrow account
 * @param poolManagerInfo - pool manager info which is returned by retrievePoolManagerInfo function
 * @param loanInfo - loan info which is returned by retrieveLoanInfo function
 * @param oraclePrices - oracle prices which is returned by getOraclePrices function
 * @returns Promise<UserLoansInfo> user loans info
 */
export function userLoanInfo(
  localState: LoanLocalState,
  poolManagerInfo: PoolManagerInfo,
  loanInfo: LoanInfo,
  oraclePrices: OraclePrices,
): UserLoanInfo {
  const { pools: poolManagerPools } = poolManagerInfo;
  const { pools: loanPools } = loanInfo;
  const { prices } = oraclePrices;

  let netRate = BigInt(0);
  let netYield = BigInt(0);

  // collaterals
  const collaterals: UserLoanInfoCollateral[] = [];
  let totalCollateralBalanceValue = BigInt(0);
  let totalEffectiveCollateralBalanceValue = BigInt(0);

  localState.collaterals.forEach(({ poolAppId, fAssetBalance }) => {
    const isColPresent = poolAppId > 0;
    if (!isColPresent) return;

    const poolInfo = poolManagerPools[poolAppId];
    const poolLoanInfo = loanPools[poolAppId];
    if (poolInfo === undefined || poolLoanInfo === undefined)
      throw Error("Could not find collateral pool " + poolAppId);

    const { depositInterestIndex, depositInterestRate, depositInterestYield } = poolInfo;
    const { assetId, collateralFactor } = poolLoanInfo;
    const oraclePrice = prices[assetId];
    if (oraclePrice === undefined) throw Error("Could not find asset price " + assetId);

    const { price: assetPrice } = oraclePrice;
    const assetBalance = calcWithdrawReturn(fAssetBalance, depositInterestIndex);
    const balanceValue = calcCollateralAssetLoanValue(assetBalance, assetPrice, ONE_4_DP);
    const effectiveBalanceValue = calcCollateralAssetLoanValue(assetBalance, assetPrice, collateralFactor);

    totalCollateralBalanceValue += balanceValue;
    totalEffectiveCollateralBalanceValue += effectiveBalanceValue;
    netRate += balanceValue * depositInterestRate;
    netYield += balanceValue * depositInterestYield;

    collaterals.push({
      poolAppId,
      assetId,
      assetPrice,
      depositInterestIndex,
      collateralFactor,
      fAssetBalance,
      assetBalance,
      balanceValue,
      effectiveBalanceValue,
      interestRate: depositInterestRate,
      interestYield: depositInterestYield,
    });
  });

  // borrows
  const borrows: UserLoanInfoBorrow[] = [];
  let totalBorrowedAmountValue = BigInt(0);
  let totalBorrowBalanceValue = BigInt(0);
  let totalEffectiveBorrowBalanceValue = BigInt(0);

  localState.borrows.forEach(
    ({
      poolAppId,
      borrowedAmount,
      borrowBalance: oldBorrowBalance,
      latestBorrowInterestIndex,
      stableBorrowInterestRate,
      latestStableChange,
    }) => {
      const isBorPresent = oldBorrowBalance > BigInt(0);
      if (!isBorPresent) return;

      const poolInfo = poolManagerPools[poolAppId];
      const poolLoanInfo = loanPools[poolAppId];
      if (poolInfo === undefined || poolLoanInfo === undefined) throw Error("Could not find borrow pool " + poolAppId);

      const { assetId, borrowFactor } = poolLoanInfo;
      const oraclePrice = prices[assetId];
      if (oraclePrice === undefined) throw Error("Could not find asset price " + assetId);

      const { price: assetPrice } = oraclePrice;
      const isStable = latestStableChange > BigInt(0);
      const bii = isStable
        ? calcBorrowInterestIndex(stableBorrowInterestRate, latestBorrowInterestIndex, latestStableChange)
        : poolInfo.variableBorrowInterestIndex;
      const borrowedAmountValue = calcCollateralAssetLoanValue(borrowedAmount, oraclePrice.price, ONE_4_DP); // no rounding
      const borrowBalance = calcBorrowBalance(oldBorrowBalance, bii, latestBorrowInterestIndex);
      const borrowBalanceValue = calcBorrowAssetLoanValue(borrowBalance, assetPrice, ONE_4_DP);
      const effectiveBorrowBalanceValue = calcBorrowAssetLoanValue(borrowBalance, assetPrice, borrowFactor);
      const interestRate = isStable ? stableBorrowInterestRate : poolInfo.variableBorrowInterestRate;
      const interestYield = isStable
        ? expBySquaring(ONE_16_DP + stableBorrowInterestRate / SECONDS_IN_YEAR, SECONDS_IN_YEAR, ONE_16_DP) - ONE_16_DP
        : poolInfo.variableBorrowInterestYield;

      totalBorrowedAmountValue += borrowedAmount;
      totalBorrowBalanceValue += borrowBalanceValue;
      totalEffectiveBorrowBalanceValue += effectiveBorrowBalanceValue;
      netRate -= borrowBalanceValue * interestRate;
      netYield -= borrowBalanceValue * interestYield;

      borrows.push({
        poolAppId,
        assetId,
        assetPrice,
        isStable,
        borrowFactor,
        borrowedAmount,
        borrowedAmountValue,
        borrowBalance,
        borrowBalanceValue,
        effectiveBorrowBalanceValue,
        accruedInterest: borrowBalance - borrowedAmount,
        accruedInterestValue: borrowBalanceValue - borrowedAmountValue,
        interestRate,
        interestYield,
      });
    },
  );

  const amount = totalCollateralBalanceValue + totalBorrowBalanceValue;
  if (amount > BigInt(0)) {
    netRate /= amount;
    netYield /= amount;
  }

  // combine
  return {
    currentRound: localState.currentRound,
    userAddress: localState.userAddress,
    escrowAddress: localState.escrowAddress,
    collaterals,
    borrows,
    netRate,
    netYield,
    totalCollateralBalanceValue,
    totalBorrowedAmountValue,
    totalBorrowBalanceValue,
    totalEffectiveCollateralBalanceValue,
    totalEffectiveBorrowBalanceValue,
    loanToValueRatio: calcLTVRatio(totalBorrowBalanceValue, totalCollateralBalanceValue),
    borrowUtilisationRatio: calcBorrowUtilisationRatio(
      totalEffectiveBorrowBalanceValue,
      totalEffectiveCollateralBalanceValue,
    ),
    liquidationMargin: calcLiquidationMargin(totalEffectiveBorrowBalanceValue, totalEffectiveCollateralBalanceValue),
  };
}
