import BigNumber from "bignumber.js";

export interface Balance {
  symbol: string;
  balance: BigNumber;
  usdPrice: BigNumber | null;
  usdValue: BigNumber | null;
}
