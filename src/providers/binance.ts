import { Spot } from "@binance/connector-typescript";
import BigNumber from "bignumber.js";
import { Balance } from "./types";
import { BaseWalletProvider } from "./base";

export class BinanceWalletProvider implements BaseWalletProvider {
  constructor(private readonly client: Spot) {}

  public async getBalances(): Promise<Balance[]> {
    const earnBalances = await this.client.getFlexibleProductPosition({ size: 100 });
    const spotBalances = await this.client.userAsset();

    const formattedEarnBalances = earnBalances["rows"].map((balance) => ({
      symbol: balance.asset,
      balance: BigNumber(balance.totalAmount),
    }));
    const formattedSpotBalances = spotBalances.map((balance) => ({
      symbol: balance.asset,
      balance: BigNumber(balance.free).plus(balance.locked),
    }));

    const totalBalances = formattedEarnBalances.concat(formattedSpotBalances);

    const aggregatedBalances = totalBalances.reduce(
      (acc, balance) => {
        if (acc[balance.symbol]) {
          acc[balance.symbol].balance = acc[balance.symbol].balance.plus(balance.balance);
        } else {
          acc[balance.symbol] = balance;
        }
        return acc;
      },
      {} as {
        [symbol: string]: {
          symbol: string;
          balance: BigNumber;
        };
      }
    );
    const aggregatedBalancesValues = Object.values(aggregatedBalances);

    // Fetch prices
    const symbols = aggregatedBalancesValues
      .map((balance) => balance.symbol)
      .filter((symbol) => symbol !== "USDT");
    const prices = await this.getPrices(symbols);
    prices["USDT"] = new BigNumber(1);

    return aggregatedBalancesValues.map((balance) => {
      const usdPrice = prices[balance.symbol];
      return {
        ...balance,
        usdPrice,
        usdValue: balance.balance.multipliedBy(usdPrice),
      };
    });
  }

  public async getPrices(symbols: string[]): Promise<{ [symbol: string]: BigNumber }> {
    const symbolsQuery = symbols.map((symbol) => `${symbol}USDT`);
    const prices = (await this.client.symbolPriceTicker({ symbols: symbolsQuery })) as {
      symbol: string;
      price: string;
    }[];
    return prices.reduce((acc, price) => {
      acc[price.symbol.replace("USDT", "")] = new BigNumber(price.price);
      return acc;
    }, {} as { [symbol: string]: BigNumber });
  }
}
