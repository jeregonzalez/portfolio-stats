import BigNumber from "bignumber.js";
import { BaseWalletProvider } from "./base";
import { Balance } from "./types";
import { BinanceWalletProvider } from "./binance";

export class BitcoinWalletProvider implements BaseWalletProvider {
  constructor(private readonly binance: BinanceWalletProvider) {}

  public async getBalances(): Promise<Balance[]> {
    // TODO: Implement
    const balance = [
      {
        symbol: "BTC",
        balance: BigNumber("0.1557703"),
        usdPrice: new BigNumber(0),
        usdValue: new BigNumber(0),
      },
    ];

    // Get BTC price
    const btcPrice = await this.binance.getPrices(["BTC"]);
    balance[0].usdPrice = btcPrice["BTC"];
    balance[0].usdValue = balance[0].balance.multipliedBy(btcPrice["BTC"]);

    return balance;
  }
}
