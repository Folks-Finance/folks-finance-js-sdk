enum LPTokenProvider {
  TINYMAN = 0,
  PACT = 1,
}

interface BaseLPToken {
  provider: LPTokenProvider;
  lpAssetId: number;
  asset0Id: number;
  asset1Id: number;
}

interface TinymanLPToken extends BaseLPToken {
  provider: LPTokenProvider.TINYMAN;
  lpPoolAddress: string;
}

interface PactLPToken extends BaseLPToken {
  provider: LPTokenProvider.PACT;
  lpPoolAppId: number;
}

type LPToken = TinymanLPToken | PactLPToken;

type PoolManagerInfo = {
  currentRound?: number;
  pools: Partial<
    Record<
      number,
      {
        // poolAppId -> ...
        variableBorrowInterestRate: bigint; // 16 d.p.
        variableBorrowInterestYield: bigint; // approximation 16 d.p.
        variableBorrowInterestIndex: bigint; // 14 d.p.
        depositInterestRate: bigint; // 16 d.p.
        depositInterestYield: bigint; // approximation 16 d.p.
        depositInterestIndex: bigint; // 14 d.p.
        metadata: {
          oldVariableBorrowInterestIndex: bigint; // 14 d.p.
          oldDepositInterestIndex: bigint; // 14 d.p.
          oldTimestamp: bigint;
        };
      }
    >
  >;
};

interface BasePool {
  appId: number;
  assetId: number;
  fAssetId: number;
  frAssetId: number;
  assetDecimals: number;
  poolManagerIndex: number;
  loans: Partial<Record<number, bigint>>; // loanAppId -> loanIndex
}

interface LPTokenPool extends BasePool {
  lpToken: LPToken;
}

type Pool = BasePool | LPTokenPool;

interface PoolInfo {
  currentRound?: number;
  variableBorrow: {
    vr0: bigint; // 16 d.p.
    vr1: bigint; // 16 d.p.
    vr2: bigint; // 16 d.p.
    totalVariableBorrowAmount: bigint;
    variableBorrowInterestRate: bigint; // 16 d.p.
    variableBorrowInterestYield: bigint; // approximation 16 d.p.
    variableBorrowInterestIndex: bigint; // 14 d.p.
  };
  stableBorrow: {
    sr0: bigint; // 16 d.p.
    sr1: bigint; // 16 d.p.
    sr2: bigint; // 16 d.p.
    sr3: bigint; // 16 d.p.
    optimalStableToTotalDebtRatio: bigint; // 16 d.p.
    rebalanceUpUtilisationRatio: bigint; // 16 d.p.
    rebalanceUpDepositInterestRate: bigint; // 16 d.p.
    rebalanceDownDelta: bigint; // 16 d.p.
    totalStableBorrowAmount: bigint;
    stableBorrowInterestRate: bigint; // 16 d.p.
    stableBorrowInterestYield: bigint; // approximation 16 d.p.
    overallStableBorrowInterestAmount: bigint; // 16 d.p.
  };
  interest: {
    retentionRate: bigint; // 16 d.p.
    flashLoanFee: bigint; // 16 d.p.
    optimalUtilisationRatio: bigint; // 16 d.p.
    totalDeposits: bigint;
    depositInterestRate: bigint; // 16 d.p.
    depositInterestYield: bigint; // approximation 16 d.p.
    depositInterestIndex: bigint; // 14 d.p.
    latestUpdate: bigint;
  };
  caps: {
    borrowCap: bigint; // $ value
    stableBorrowPercentageCap: bigint; // 16 d.p.
  };
  config: {
    depreciated: boolean;
    rewardsPaused: boolean;
    stableBorrowSupported: boolean;
    flashLoanSupported: boolean;
  };
}

type UserDepositInfo = {
  currentRound?: number;
  escrowAddress: string;
  holdings: {
    fAssetId: number;
    fAssetBalance: bigint;
  }[];
};

interface PoolLoanInfo {
  poolAppId: number;
  assetId: number;
  collateralCap: bigint; // $ value
  collateralUsed: bigint;
  collateralFactor: bigint; // 4 d.p.
  borrowFactor: bigint; // 4 d.p.
  liquidationMax: bigint; // 4 d.p.
  liquidationBonus: bigint; // 4 d.p.
  liquidationFee: bigint; // 4 d.p.
}

enum LoanType {
  "GENERAL" = "GENERAL",
  "STABLECOIN_EFFICIENCY" = "STABLECOIN_EFFICIENCY",
}

interface LoanInfo {
  currentRound?: number;
  canSwapCollateral: boolean;
  pools: Partial<Record<number, PoolLoanInfo>>; // poolAppId -> PoolLoanInfo
}

interface LoanLocalState {
  currentRound?: number;
  userAddress: string;
  escrowAddress: string;
  collaterals: {
    poolAppId: number;
    fAssetBalance: bigint;
  }[];
  borrows: {
    poolAppId: number;
    borrowedAmount: bigint;
    borrowBalance: bigint;
    latestBorrowInterestIndex: bigint; // 14 d.p.
    stableBorrowInterestRate: bigint; // 16 d.p.
    latestStableChange: bigint;
  }[];
}

interface UserLoanInfoCollateral {
  poolAppId: number;
  assetId: number;
  assetPrice: bigint; // 14 d.p.
  collateralFactor: bigint; // 4 d.p.
  depositInterestIndex: bigint; // 14 d.p.
  fAssetBalance: bigint;
  assetBalance: bigint;
  balanceValue: bigint; // in $, 4 d.p.
  effectiveBalanceValue: bigint; // in $, 4 d.p.
  interestRate: bigint; // 16 d.p.
  interestYield: bigint; // approximation 16 d.p.
}

interface UserLoanInfoBorrow {
  poolAppId: number;
  assetId: number;
  assetPrice: bigint; // 14 d.p.
  isStable: boolean;
  borrowFactor: bigint; // 4 d.p.
  borrowedAmount: bigint;
  borrowedAmountValue: bigint; // in $, 4 d.p.
  borrowBalance: bigint;
  borrowBalanceValue: bigint; // in $, 4 d.p.
  effectiveBorrowBalanceValue: bigint; // in $, 4 d.p.
  accruedInterest: bigint;
  accruedInterestValue: bigint; // in $, 4 d.p.
  interestRate: bigint; // 16 d.p.
  interestYield: bigint; // approximation 16 d.p.
}

interface UserLoanInfo {
  currentRound?: number;
  userAddress: string;
  escrowAddress: string;
  collaterals: UserLoanInfoCollateral[];
  borrows: UserLoanInfoBorrow[];
  netRate: bigint; // 16 d.p. - negative indicates losing more on borrows than gaining on collaterals
  netYield: bigint; // 16 d.p. - negative indicates losing more on borrows than gaining on collaterals
  totalCollateralBalanceValue: bigint; // in $, 4 d.p.
  totalBorrowedAmountValue: bigint; // in $, 4 d.p.
  totalBorrowBalanceValue: bigint; // in $, 4 d.p.
  totalEffectiveCollateralBalanceValue: bigint; // in $, 4 d.p. - used to determine if liquidatable
  totalEffectiveBorrowBalanceValue: bigint; // in $, 4 d.p. - used to determine if liquidatable
  loanToValueRatio: bigint; // 4 d.p.
  borrowUtilisationRatio: bigint; // 4 d.p.
  liquidationMargin: bigint; // 4 d.p.
}

interface Oracle {
  oracle0AppId: number;
  oracle1AppId?: number;
  lpTokenOracle?: {
    appId: number;
    tinymanValidatorAppId: number;
  };
  oracleAdapterAppId: number;
  decimals: number;
}

interface OraclePrice {
  price: bigint; // price in USD for amount 1 of asset in lowest denomination
  timestamp: bigint;
}

interface OraclePrices {
  currentRound?: number;
  prices: Partial<Record<number, OraclePrice>>; // assetId -> OraclePrice
}

interface OpUp {
  callerAppId: number;
  baseAppId: number;
}

type ReserveAddress = string;

export {
  LPTokenProvider,
  TinymanLPToken,
  PactLPToken,
  LPToken,
  PoolManagerInfo,
  BasePool,
  LPTokenPool,
  Pool,
  PoolInfo,
  UserDepositInfo,
  PoolLoanInfo,
  LoanType,
  LoanLocalState,
  LoanInfo,
  UserLoanInfoCollateral,
  UserLoanInfoBorrow,
  UserLoanInfo,
  Oracle,
  OraclePrice,
  OraclePrices,
  OpUp,
  ReserveAddress,
};
