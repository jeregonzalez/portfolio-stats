import axios, { AxiosInstance } from "axios";
import { Balance } from "./types";
import BigNumber from "bignumber.js";
import { BaseWalletProvider } from "./base";

const USDT_LIKE_PRICE_TOKENS = ["cUSDTv3"];

export enum Blockchain {
  Ethereum = "eth",
  Optimism = "optimism",
  Polygon = "polygon",
}

type PaginatedResponse<T> = {
  cursor: string;
  page: number;
  page_size: number;
  result: T[];
};

type TokensResponse = PaginatedResponse<{
  token_address: string;
  symbol: string;
  name: string;
  logo: string;
  thumbnail: string;
  decimals: number;
  balance: string;
  possible_spam: boolean;
  verified_contract: boolean;
  total_supply: string;
  total_supply_formatted: string;
  percentage_relative_to_total_supply: string;
  security_score: number;
  balance_formatted: string;
  usd_price: number;
  usd_price_24hr_percent_change: number;
  usd_price_24hr_usd_change: number;
  usd_value: number;
  usd_value_24hr_usd_change: number;
  native_token: boolean;
  portfolio_percentage: number;
}>;

interface MoralisConfig {
  apiKey: string;
  address: string;
  blockchains: Blockchain[];
}

export class MoralisWalletProvider implements BaseWalletProvider {
  private readonly baseUrl = "https://deep-index.moralis.io/api/v2.2";

  private readonly apiKey: string;
  private readonly address: string;
  private readonly blockchains: Blockchain[];

  private session: AxiosInstance;

  constructor({ apiKey, address, blockchains }: MoralisConfig) {
    this.apiKey = apiKey;
    this.address = address;
    this.blockchains = blockchains;

    this.session = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "X-Api-Key": apiKey,
      },
    });
  }

  private async getBalance(address: string, blockchain: Blockchain): Promise<Balance[]> {
    const response = await this.session.get<TokensResponse>(`/wallets/${address}/tokens`, {
      params: { chain: blockchain },
    });
    const tokens = response.data.result;
    return tokens.map((token) => ({
      symbol: token.symbol,
      balance: BigNumber(token.balance_formatted),
      usdPrice: token.usd_price
        ? BigNumber(token.usd_price)
        : USDT_LIKE_PRICE_TOKENS.includes(token.symbol)
        ? new BigNumber(1)
        : null,
      usdValue: token.usd_value
        ? BigNumber(token.usd_value)
        : USDT_LIKE_PRICE_TOKENS.includes(token.symbol)
        ? BigNumber(token.balance_formatted)
        : null,
    }));
  }

  public async getBalances(): Promise<Balance[]> {
    const fetchPromises = this.blockchains.map((blockchain) =>
      this.getBalance(this.address, blockchain)
    );
    const balances = await Promise.all(fetchPromises);
    const aggregatedBalances = balances.flat().reduce((acc, balance) => {
      if (acc[balance.symbol]) {
        acc[balance.symbol].balance = acc[balance.symbol].balance.plus(balance.balance);
      } else {
        acc[balance.symbol] = balance;
      }
      return acc;
    }, {} as { [symbol: string]: Balance });
    return Object.values(aggregatedBalances);
  }

  public async getBalancesByChain(): Promise<{ [blockchain: string]: Balance[] }> {
    const fetchPromises = this.blockchains.map((blockchain) =>
      this.getBalance(this.address, blockchain)
    );
    const balances = await Promise.all(fetchPromises);
    return this.blockchains.reduce((acc, blockchain, index) => {
      acc[blockchain] = balances[index];
      return acc;
    }, {} as { [blockchain: string]: Balance[] });
  }
}
