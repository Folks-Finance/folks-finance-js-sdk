interface XAlgo {
  appId: number;
  xAlgoId: number;
}

interface XAlgoInfo {
  currentRound?: number; // round the data was read at
  timeDelay: bigint;
  commitEnd: bigint;
  fee: bigint; // 4 d.p.
  hasClaimedFee: boolean;
  isMintingPaused: boolean;
  algoBalance: bigint;
  xAlgoCirculatingBalance: bigint;
}

export { XAlgo, XAlgoInfo };