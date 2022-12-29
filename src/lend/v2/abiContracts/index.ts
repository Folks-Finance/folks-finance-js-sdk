import { ABIContract } from "algosdk";

import depositsABI from "./deposits.json";
import depositStakingABI from "./deposit_staking.json";
import loanABI from "./loan.json";
import lpTokenOracleABI from "./lpTokenOracle.json";
import oracleAdapterABI from "./oracleAdapter.json";
import poolABI from "./pool.json";

export const depositsABIContract = new ABIContract(depositsABI);
export const depositStakingABIContract = new ABIContract(depositStakingABI);
export const loanABIContract = new ABIContract(loanABI);
export const lpTokenOracleABIContract = new ABIContract(lpTokenOracleABI);
export const oracleAdapterABIContract = new ABIContract(oracleAdapterABI);
export const poolABIContract = new ABIContract(poolABI);
