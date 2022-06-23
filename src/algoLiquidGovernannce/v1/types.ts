interface Dispenser {
  appId: number;
  gAlgoId: number;
}

interface DispenserInfo {
  currentRound: number;
  distributorAppIds: number[];
  isMintingPaused: boolean;
}

interface Distributor {
  appId: number;
}

interface DistributorInfo {
  currentRound: number;
  dispenserAppId: number;
  commitEnd: bigint;
  periodEnd: bigint;
  totalCommitment: bigint;
  totalCommitmentClaimed: bigint;
  canClaimAlgoRewards: boolean;
  rewardsPerAlgo: bigint; // 16 d.p.
  totalRewardsClaimed: bigint;
  isBurningPaused: boolean;
}

export {
  Dispenser,
  DispenserInfo,
  Distributor,
  DistributorInfo,
};
