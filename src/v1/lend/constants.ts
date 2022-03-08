import { Oracle, Pool, TokenPair } from "./types";

type TestnetPoolsKeys = "ALGO" | "USDC" | "USDt" | "goBTC" | "goETH" | "xUSD";
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
  "goETH": {
    appId: 76601031,
    assetId: 76598897,
    fAssetId: 76601047,
    frAssetId: 76601048,
  },
  "xUSD": {
    appId: 76601432,
    assetId: 62281549,
    fAssetId: 76601447,
    frAssetId: 76601448,
  },
};

// CollateralPool-BorrowPool
type TestnetTokenPairsKeys = "ALGO-USDC" | "ALGO-USDt" | "ALGO-goBTC" | "ALGO-goETH" | "ALGO-xUSD" | "USDC-ALGO" | "USDC-USDt" | "USDC-goBTC" | "USDC-goETH" | "USDC-xUSD" | "USDt-ALGO" | "USDt-USDC" | "USDt-goBTC" | "USDt-goETH" | "USDt-xUSD" | "goBTC-ALGO" | "goBTC-USDC" | "goBTC-USDt" | "goBTC-goETH" | "goBTC-xUSD" | "goETH-ALGO"| "goETH-USDC"| "goETH-USDt"| "goETH-goBTC" | "goETH-xUSD" | "xUSD-ALGO" | "xUSD-USDC"| "xUSD-USDt"| "xUSD-goBTC"| "xUSD-goETH";
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
  "ALGO-goETH": {
    appId: 76603356,
    collateralPool: TestnetPools.ALGO,
    borrowPool: TestnetPools.goETH,
    linkAddr: "UZ4BFVUCL5CZOJELM4BTDXPMEWEO5V6R7ESY3BV6V4RPEXHHWSOZTA7KLA",
  },
  "ALGO-xUSD": {
    appId: 76605205,
    collateralPool: TestnetPools.ALGO,
    borrowPool: TestnetPools.xUSD,
    linkAddr: "67SMT24TIZY2SVOJ4BKVOOLU5UON2WCZU6DV3FDEGHMN2UDHS24BLUSSEM",
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
  "USDC-goETH": {
    appId: 76603539,
    collateralPool: TestnetPools.USDC,
    borrowPool: TestnetPools.goETH,
    linkAddr: "MUWZ2G3WNZ6FX3BQGUCLAGKWIPJBFWX4T7XQ64LXSUP2MJ6XSESODMZY74",
  },
  "USDC-xUSD": {
    appId: 76605480,
    collateralPool: TestnetPools.USDC,
    borrowPool: TestnetPools.xUSD,
    linkAddr: "4SNM7SOXN2N2JAT4P3TFQCVIH4PRWBTJG7AU6U7DNDTHX4KL5TNHDPGLA4",
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
  "USDt-goETH": {
    appId: 76604015,
    collateralPool: TestnetPools.USDt,
    borrowPool: TestnetPools.goETH,
    linkAddr: "US2Y4GOHRQ2SWUOZEDMS6KCVTONC52J36CAOQVGXGVEZLJE7MJ7EYFBOK4",
  },
  "USDt-xUSD": {
    appId: 76605902,
    collateralPool: TestnetPools.USDt,
    borrowPool: TestnetPools.xUSD,
    linkAddr: "V4AQZ6VR7VSLKPQET7CGQJT5EJVJK46VTTCF53U3LAV6GQQ3GIIZECATMI",
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
  "goBTC-goETH": {
    appId: 76604346,
    collateralPool: TestnetPools.goBTC,
    borrowPool: TestnetPools.goETH,
    linkAddr: "2PPD6WMJEMR6JXSSPZD76VNTQU2JOBZQWRMW6B2AZRKMEJEQNRZBQ2MNQA",
  },
  "goBTC-xUSD": {
    appId: 76606056,
    collateralPool: TestnetPools.goBTC,
    borrowPool: TestnetPools.xUSD,
    linkAddr: "2UH4MLTYC6BJUGYZX4BWPZTNPRGL66EJN3M3DFH5WOYDPT2VM4FTVUPPXU",
  },
  "goETH-ALGO": {
    appId: 76603077,
    collateralPool: TestnetPools.goETH,
    borrowPool: TestnetPools.ALGO,
    linkAddr: "YGN55EMIT3LUA76V5ODBAOKN56VCVQVOUDLMF3W44KRPVRIOZ3OUOORWME",
  },
  "goETH-USDC": {
    appId: 76603710,
    collateralPool: TestnetPools.goETH,
    borrowPool: TestnetPools.USDC,
    linkAddr: "3M6JWN4J6W2WH2SZNXRRVNAGEAUCQUQ7PAHCUWZ2A7G3SYW3CH3LLPLAZY",
  },
  "goETH-USDt": {
    appId: 76603873,
    collateralPool: TestnetPools.goETH,
    borrowPool: TestnetPools.USDt,
    linkAddr: "LGL5P7BKFSIETFDTX6ETROWZOJVINQEIK3CQKYEKS2MKVISR4EFCSH4SYU",
  },
  "goETH-goBTC": {
    appId: 76604472,
    collateralPool: TestnetPools.goETH,
    borrowPool: TestnetPools.goBTC,
    linkAddr: "6OTTO42RWIJ4U6FXOP6BBTCTR62JAY3HUPOEBFHFLVBXC24NQ4A6JE5ESE",
  },
  "goETH-xUSD": {
    appId: 76604688,
    collateralPool: TestnetPools.goETH,
    borrowPool: TestnetPools.xUSD,
    linkAddr: "MN3VJHHCELVUR7DJFYZIC73RG77D6XIXLANZZ6GQXY7RURLY6O6VQXYPN4",
  },
  "xUSD-ALGO": {
    appId: 76604980,
    collateralPool: TestnetPools.xUSD,
    borrowPool: TestnetPools.ALGO,
    linkAddr: "XKM3FCDQT4FHY55JKPTJ5B4WWBLKAC4U3EAFIZ2E52FJEFLLBJKJDVDKXY",
  },
  "xUSD-USDC": {
    appId: 76605680,
    collateralPool: TestnetPools.xUSD,
    borrowPool: TestnetPools.USDC,
    linkAddr: "DC3XPGPML7FDRZBEEGPLWR4WVN2JM7R333FRHAMZSLZDJRUR3JFSQ6FGAU",
  },
  "xUSD-USDt": {
    appId: 76605769,
    collateralPool: TestnetPools.xUSD,
    borrowPool: TestnetPools.USDt,
    linkAddr: "VVERUBNX2GL3QJYKLWJFFVICTERY6HRINORJQYFZZHSQ4GHXRNXRGBT3O4",
  },
  "xUSD-goBTC": {
    appId: 76606191,
    collateralPool: TestnetPools.xUSD,
    borrowPool: TestnetPools.goBTC,
    linkAddr: "LPMIFGWM7MT4JDU5ZACA323RMEASYFRJPQPYCPSBRH7DDRHWHPGCN46MBE",
  },
  "xUSD-goETH": {
    appId: 76604778,
    collateralPool: TestnetPools.xUSD,
    borrowPool: TestnetPools.goETH,
    linkAddr: "WYNR6L6W57KBP63C5PUC4UCY5HR7JHIBG57EX3KL2KYVXZV7DH4OTHKEFA",
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
