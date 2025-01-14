import { Balance } from "./types";

export interface BaseWalletProvider {
  getBalances(): Promise<Balance[]>;
}
