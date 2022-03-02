import { unixTime } from "../utils";
import { ConversionRate } from "./types";

const DECIMALS = BigInt(1e14);
const SECONDS_IN_YEAR = 365 * 24 * 60 * 60;

function mul14(n1: bigint, n2: bigint): bigint {
  return (n1 * n2) / BigInt(1e14);
}

function mulVariable(n1: bigint, n2: bigint, dec: number): bigint {
  return (n1 * n2) / BigInt(10 ** dec);
}

function div14(n1: bigint, n2: bigint): bigint {
  return (n1 * BigInt(1e14)) / n2;
}

export function divVariable(n1: bigint, n2: bigint, dec: number): bigint {
  return (n1 * BigInt(10 ** dec)) / n2;
}

/**
 * Calculates the utilization ratio of the pool.
 * @param totalBorrows (Xdp)
 * @param totalDeposits (Xdp)
 * @return utilizationRate (14dp)
 */
function calcUtilizationRatio(totalBorrows: bigint, totalDeposits: bigint): bigint {
  return div14(totalBorrows, totalDeposits);
}

/**
 * Calculates the current interest index. If epsilon undefined then deposit interest index, else borrow interest index.
 * @param interestIndex (14dp)
 * @param interestRate (14dp)
 * @param latestUpdate (0dp)
 * @param epsilon (14dp)
 * @return interestIndex (14dp)
 */
function calcInterestIndex(
  interestIndex: bigint,
  interestRate: bigint,
  latestUpdate: bigint,
  epsilon?: bigint,
): bigint {
  const dt = BigInt(unixTime()) - latestUpdate;
  const interest = (interestRate / BigInt(SECONDS_IN_YEAR)) * dt;
  return mul14(interestIndex, DECIMALS + (epsilon !== undefined ? mul14(epsilon, interest) : interest));
}

/**
 * Calculates the threshold of under-collaterization of the loan
 * @param collateralAmount (Xdp)
 * @param depositInterestIndex (14dp)
 * @param s2 (14dp)
 * @param conversionRate (<r_dec>dp)
 * @param conversionRateDec (0dp)
 * @return threshold (Xdp)
 */
export function calcThreshold(
  collateralAmount: bigint,
  depositInterestIndex: bigint,
  s2: bigint,
  conversionRate: bigint,
  conversionRateDec: number,
): bigint {
  return mulVariable(mul14(mul14(collateralAmount, depositInterestIndex), s2), conversionRate, conversionRateDec);
}

/**
 * Calculates the borrow balance of the loan at time t
 * @param borrowBalanceAtLastOperation (Xdp)
 * @param borrowInterestIndex (14dp)
 * @param borrowInterestIndexAtLastOperation (14dp)
 * @return borrowBalance (Xdp)
 */
export function calcBorrowBalance(
  borrowBalanceAtLastOperation: bigint,
  borrowInterestIndex: bigint,
  borrowInterestIndexAtLastOperation: bigint,
): bigint {
  return mul14(borrowBalanceAtLastOperation, div14(borrowInterestIndex, borrowInterestIndexAtLastOperation)) + BigInt(1);
}

/**
 * Calculates the health factor of the loan at time t
 * @param threshold (Xdp)
 * @param borrowBalance (Xdp)
 * @return healthFactor (14dp)
 */
function calcHealthFactor(threshold: bigint, borrowBalance: bigint): bigint {
  return div14(threshold, borrowBalance);
}

/**
 * Calculate the conversion rate between two assets
 * @param collateralPrice (Xdp)
 * @param borrowPrice (Xdp)
 * @return { rate: bigint, decimals: number } (14dp)
 */
function calcConversionRate(collateralPrice: bigint, borrowPrice: bigint): ConversionRate {
  let decimals = 18;
  if (collateralPrice >= borrowPrice) {
    let borrowExpPrice = borrowPrice;
    for (; borrowExpPrice < collateralPrice && decimals > 0; decimals--) {
      borrowExpPrice *= BigInt(10);
    }
  }
  const rate = divVariable(collateralPrice, borrowPrice, decimals);
  return { rate, decimals };
}

export { calcUtilizationRatio, calcInterestIndex, calcHealthFactor, calcConversionRate }
