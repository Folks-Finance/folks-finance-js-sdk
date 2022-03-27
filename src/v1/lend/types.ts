interface Pool {
  appId: number;
  assetId: number;
  fAssetId: number;
  frAssetId: number;
  assetDecimals: number;
}

interface PoolInfo {
  currentRound: number;
  depositInterestRate: bigint; // 14 d.p.
  depositInterestIndex: bigint; // 14 d.p.
  borrowInterestRate: bigint; // 14 d.p.
  borrowInterestIndex: bigint; // 14 d.p.
  retentionRate: bigint; // 14 d.p.
  totalDeposits: bigint;
  totalBorrows: bigint;
  utilizationRatio: bigint; // 14 d.p.
  optimalUtilizationRatio: bigint; // 14 d.p.
  epsilon: bigint; // 14 d.p.
  latestUpdate: bigint;
  isPaused: boolean;
  isRewardsPaused: boolean;
}

interface LockAndEarn {
  appId: number;
  pool: Pool;
  linkAddr: string;
}

interface LockAndEarnInfo {
  currentRound: number;
  rewardsRatio: bigint; // 14 d.p.
  timeLocked: bigint;
  deposits: bigint;
  limit: bigint;
}

interface LockedDepositInfo {
  currentRound: number;
  escrowAddress: string;
  userAddress: string;
  lockedBalance: bigint;
  release: bigint;
}

interface RewardsAggregator {
  appId: number;
  pool: Pool;
}

interface AssetRewardsInfo {
  assetId: number;
  periodRewards: {
    claimed: bigint;
    limit: bigint;
    conversionRate: bigint; // 10 d.p.
  }[];
}

interface RewardsAggregatorInfo {
  currentRound: number;
  vestingPeriodLengths: bigint[];
  assetsRewards: AssetRewardsInfo[];
}

interface StakedRewardsInfo {
  currentRound: number;
  escrowAddress: string;
  userAddress: string;
  start: bigint;
  latest: bigint;
  end: bigint;
  rewards: {
    assetId: number;
    claimed: bigint;
    total: bigint;
  }[];
}

interface TokenPair {
  appId: number;
  collateralPool: Pool;
  borrowPool: Pool;
  linkAddr: string;
}

interface TokenPairInfo {
  currentRound: number;
  loanToValueRatio: bigint; // 14 d.p.
  liquidationThreshold: bigint; // 14 d.p.
  safetyThreshold: bigint; // 14 d.p.
}

interface LoanInfo {
  currentRound: number;
  escrowAddress: string;
  userAddress: string;
  borrowed: bigint;
  collateralBalance: bigint;
  borrowBalance: bigint;
  borrowBalanceLiquidationThreshold: bigint;
  healthFactor: bigint; // 14 d.p.
}

interface Oracle {
  oracleAppId: number;
  oracleAdapterAppId: number;
  decimals: number;
}

interface OraclePrice {
  price: bigint; // price in USD for amount 1 of asset in lowest denomination
  timestamp: bigint;
}

interface OraclePrices {
  currentRound: number;
  prices: Record<number, OraclePrice>,
}

interface ConversionRate {
  rate: bigint; // <decimals> d.p.
  decimals: number;
}

type ReserveAddress = string;

export {
  Pool,
  PoolInfo,
  LockAndEarn,
  LockAndEarnInfo,
  LockedDepositInfo,
  RewardsAggregator,
  AssetRewardsInfo,
  RewardsAggregatorInfo,
  StakedRewardsInfo,
  TokenPair,
  TokenPairInfo,
  LoanInfo,
  Oracle,
  OraclePrice,
  OraclePrices,
  ConversionRate,
  ReserveAddress,
};