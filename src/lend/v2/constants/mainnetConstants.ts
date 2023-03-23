import { LoanType, OpUp, Oracle, Pool, ReserveAddress } from "../types";

const MainnetPoolManagerAppId = 971350278;

const MainnetDepositsAppId = 971353536;

type MainnetPoolKey = "ALGO" | "gALGO" | "USDC" | "USDt" | "goBTC" | "goETH" | "OPUL" | "GARD" | "WBTC" | "WETH" ;
const MainnetPools: Record<MainnetPoolKey, Pool> = {
  ALGO: {
    appId: 971368268,
    assetId: 0,
    fAssetId: 971381860,
    frAssetId: 971381861,
    assetDecimals: 6,
    poolManagerIndex: 0,
    loans: {
      971388781: BigInt(0),
      971389489: BigInt(0),
    },
  },
  gALGO: {
    appId: 971370097,
    assetId: 793124631,
    fAssetId: 971383839,
    frAssetId: 971383840,
    assetDecimals: 6,
    poolManagerIndex: 1,
    loans: {
      971388781: BigInt(1),
      971389489: BigInt(1),
    },
  },
  USDC: {
    appId: 971372237,
    assetId: 31566704,
    fAssetId: 971384592,
    frAssetId: 971384593,
    assetDecimals: 6,
    poolManagerIndex: 2,
    loans: {
      971388781: BigInt(2),
      971388977: BigInt(0),
    },
  },
  USDt: {
    appId: 971372700,
    assetId: 312769,
    fAssetId: 971385312,
    frAssetId: 971385313,
    assetDecimals: 6,
    poolManagerIndex: 3,
    loans: {
      971388781: BigInt(3),
      971388977: BigInt(1),
    },
  },
  GARD: {
    appId: 1060585819,
    assetId: 684649988,
    fAssetId: 1060587336,
    frAssetId: 1060587337,
    assetDecimals: 6,
    poolManagerIndex: 7,
    loans: {
      971388781: BigInt(7),
      971388977: BigInt(2),
    },
  },
  goBTC: {
    appId: 971373361,
    assetId: 386192725,
    fAssetId: 971386173,
    frAssetId: 971386174,
    assetDecimals: 8,
    poolManagerIndex: 4,
    loans: {
      971388781: BigInt(4),
    },
  },
  goETH: {
    appId: 971373611,
    assetId: 386195940,
    fAssetId: 971387073,
    frAssetId: 971387074,
    assetDecimals: 8,
    poolManagerIndex: 5,
    loans: {
      971388781: BigInt(5),
    },
  },
  WBTC: {
    appId: 1067289273,
    assetId: 1058926737,
    fAssetId: 1067295154,
    frAssetId: 1067295155,
    assetDecimals: 8,
    poolManagerIndex: 8,
    loans: {
      971388781: BigInt(8),
    },
  },
  WETH: {
    appId: 1067289481,
    assetId: 887406851,
    fAssetId: 1067295558,
    frAssetId: 1067295559,
    assetDecimals: 8,
    poolManagerIndex: 9,
    loans: {
      971388781: BigInt(9),
    },
  },
  OPUL: {
    appId: 1044267181,
    assetId: 287867876,
    fAssetId: 1044269355,
    frAssetId: 1044269356,
    assetDecimals: 10,
    poolManagerIndex: 6,
    loans: {
      971388781: BigInt(6),
    }
  },
};

const MainnetLoans: Partial<Record<LoanType, number>> = {
  [LoanType.GENERAL]: 971388781,
  [LoanType.STABLECOIN_EFFICIENCY]: 971388977,
  [LoanType.ALGO_EFFICIENCY]: 971389489,
};

const MainnetReserveAddress: ReserveAddress = "Q5Q5FC5PTYQIUX5PGNTEW22UJHJHVVUEMMWV2LSG6MGT33YQ54ST7FEIGA";

const MainnetOracle: Oracle = {
  oracle0AppId: 1040271396,
  oracle1AppId: 971323141,
  oracleAdapterAppId: 971333964,
  decimals: 14,
};

const MainnetOpUp: OpUp = {
  callerAppId: 971335937,
  baseAppId: 971335616,
};

export {
  MainnetPoolManagerAppId,
  MainnetDepositsAppId,
  MainnetPoolKey,
  MainnetPools,
  MainnetLoans,
  MainnetReserveAddress,
  MainnetOracle,
  MainnetOpUp,
};
