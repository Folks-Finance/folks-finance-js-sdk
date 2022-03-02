import {Oracle, Pool, TokenPair} from "./types";

type TestnetPoolsKeys = "ALGO" | "USDC" | "USDt" | "goBTC";
const TestnetPools: Record<TestnetPoolsKeys, Pool> = {
  "ALGO": {
    appId: 70993130,
    assetId: 0,
    fAssetId: 70993146,
    frAssetId: 70993147,
  },
  "USDC": {
    appId: 70993719,
    assetId: 67395862,
    fAssetId: 70993731,
    frAssetId: 70993732,
  },
  "USDt": {
    appId: 70993826,
    assetId: 67396430,
    fAssetId: 70993856,
    frAssetId: 70993857,
  },
  "goBTC": {
    appId: 70993569,
    assetId: 67396528,
    fAssetId: 70993577,
    frAssetId: 70993578,
  },
};

// CollateralPool-BorrowPool
type TestnetTokenPairsKeys = "ALGO-USDC" | "ALGO-USDt" | "ALGO-goBTC" | "USDC-ALGO" | "USDC-USDt" | "USDC-goBTC" | "USDt-ALGO" | "USDt-USDC" | "USDt-goBTC" | "goBTC-ALGO" | "goBTC-USDC" | "goBTC-USDt";
const TestnetTokenPairs: Record<TestnetTokenPairsKeys, TokenPair> = {
  "ALGO-USDC": {
    appId: 71021458,
    collateralPool: TestnetPools.ALGO,
    borrowPool: TestnetPools.USDC,
    linkAddr: "HQ2ZDROU66BUEEHAQ2TH27JBK6FXV7OGBP7OT5SGFSOZRMTCYLM5IUU3CU",
  },
  "ALGO-USDt": {
    appId: 71021767,
    collateralPool: TestnetPools.ALGO,
    borrowPool: TestnetPools.USDt,
    linkAddr: "VROWZDHEXNGYOP4MAPG536LQ6POFQNOACVTS5BGCGXX66S4ZGEPEMFU43Y",
  },
  "ALGO-goBTC": {
    appId: 71022033,
    collateralPool: TestnetPools.ALGO,
    borrowPool: TestnetPools.goBTC,
    linkAddr: "TWXT4D3LG3PPDI6RCWYAKDUMXOXM2BHG25GODJ6GVQNFENFAUPCAUINVVY",
  },
  "USDC-ALGO": {
    appId: 71021575,
    collateralPool: TestnetPools.USDC,
    borrowPool: TestnetPools.ALGO,
    linkAddr: "HPNPYNNEG2EHIVM7KRW5SMPE4VKJM3SEJXPYVK3RLH7CV3BRK43PVUX3IM",
  },
  "USDC-USDt": {
    appId: 71022422,
    collateralPool: TestnetPools.USDC,
    borrowPool: TestnetPools.USDt,
    linkAddr: "BIOFDGA2DMSMM56GM72O762MYQQ6C7PWQZ4RD4RYX73GNPS37MS5AEDX2M",
  },
  "USDC-goBTC": {
    appId: 71022758,
    collateralPool: TestnetPools.USDC,
    borrowPool: TestnetPools.goBTC,
    linkAddr: "YWNN4AHE5QREP5LMHGJKH5XPFTNNYUBHN3WJI7AUARTPCQDBOMP6WMLFL4",
  },
  "USDt-ALGO": {
    appId: 71021885,
    collateralPool: TestnetPools.USDt,
    borrowPool: TestnetPools.ALGO,
    linkAddr: "566WJQBL72QYFYFNEJIOA6PVBPNTGSHMKRZJHW66QWYOBC4FP3SNDVWY7U",
  },
  "USDt-USDC": {
    appId: 71022527,
    collateralPool: TestnetPools.USDt,
    borrowPool: TestnetPools.USDC,
    linkAddr: "XO3ICX3D4ZCJ72IH4KJZTGP7IF4WOIGASK4ZF4KTSHWSVBT6H2P3RZ3ZL4",
  },
  "USDt-goBTC": {
    appId: 71023192,
    collateralPool: TestnetPools.USDt,
    borrowPool: TestnetPools.goBTC,
    linkAddr: "RTNMVHSS2FFTIEMVH74RYU6O77QG7QSBIUMZ4KTJMILKPA6ZA5CUEWOKUA",
  },
  "goBTC-ALGO": {
    appId: 71022125,
    collateralPool: TestnetPools.goBTC,
    borrowPool: TestnetPools.ALGO,
    linkAddr: "G4APAE6GSWAYDBYNIY6MQKGPJGTITRK5AWAILEUTX2FM7CCRCIOZGDOQBY",
  },
  "goBTC-USDC": {
    appId: 71022943,
    collateralPool: TestnetPools.goBTC,
    borrowPool: TestnetPools.USDC,
    linkAddr: "Z2JAZFTXW646KMI77XC43YSAPRICKTF37RAJOVTR77YRPIAZBWDSPZNLOU",
  },
  "goBTC-USDt": {
    appId: 71023105,
    collateralPool: TestnetPools.goBTC,
    borrowPool: TestnetPools.USDt,
    linkAddr: "XOBUZ4YRUJFN67SOGZ6S4WXWOFVSAVMOLULZC63PG5RIR3JMBEJTCJVQH4",
  },
};

const TestnetOracle: Oracle = {
  oracleAppId: 67734391,
  oracleAdapterAppId: 67734412,
  decimals: 14,
}

const TestnetReserveAddress = "5ISPVI3JMQ4MP5XWWK4ILLKJAYU34U4TGZGXNC5BKR5AK3JBVAMJYBRYEI";

export {
  TestnetPoolsKeys,
  TestnetPools,
  TestnetTokenPairsKeys,
  TestnetTokenPairs,
  TestnetOracle,
  TestnetReserveAddress,
};
