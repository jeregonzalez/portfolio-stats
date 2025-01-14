import { Spot } from "@binance/connector-typescript";
import { env } from "./config/env";
import { BinanceWalletProvider, MoralisWalletProvider } from "./providers";
import BigNumber from "bignumber.js";
import { BitcoinWalletProvider } from "./providers/bitcoin";

const fetchStats = async () => {
  // Ledger balances (except Bitcoin)
  const moralis = new MoralisWalletProvider({
    apiKey: env.MORALIS_API_KEY,
    address: env.ADDRESS,
    blockchains: env.EVM_BLOCKCHAINS,
  });
  const evmBalances = await moralis.getBalancesByChain();

  // Binance balances
  const spot = new Spot(env.BINANCE_API_KEY, env.BINANCE_API_SECRET);
  const binance = new BinanceWalletProvider(spot);
  const binanceBalances = await binance.getBalances();

  // Bitcoin balances
  const bitcoin = new BitcoinWalletProvider(binance);
  const bitcoinBalances = await bitcoin.getBalances();

  // Calculate stats

  // Ledger
  const evmStats: { [blockchain: string]: { totalUsd: BigNumber } } = {};
  for (const [blockchain, balances] of Object.entries(evmBalances)) {
    const stats = balances.reduce(
      (acc, balance) => {
        if (balance.usdValue) {
          acc.totalUsd = acc.totalUsd.plus(balance.usdValue);
        }
        return acc;
      },
      {
        totalUsd: new BigNumber(0),
      } as { totalUsd: BigNumber }
    );
    evmStats[blockchain] = stats;
  }

  // Binance
  const binanceStats = binanceBalances.reduce(
    (acc, balance) => {
      if (balance.usdValue) {
        acc.totalUsd = acc.totalUsd.plus(balance.usdValue);
      }
      return acc;
    },
    { totalUsd: BigNumber(0) } as {
      totalUsd: BigNumber;
    }
  );

  // Bitcoin
  const bitcoinStats = bitcoinBalances.reduce(
    (acc, balance) => {
      if (balance.usdValue) {
        acc.totalUsd = acc.totalUsd.plus(balance.usdValue);
      }
      return acc;
    },
    { totalUsd: BigNumber(0) } as {
      totalUsd: BigNumber;
    }
  );

  // Aggregated
  const allBalances = Object.values(evmStats);
  allBalances.push(binanceStats);
  allBalances.push(bitcoinStats);

  const aggregatedStats = allBalances.reduce(
    (acc, stats) => {
      acc.totalUsd = acc.totalUsd.plus(stats.totalUsd);
      return acc;
    },
    { totalUsd: BigNumber(0) } as { totalUsd: BigNumber }
  );

  const result = {
    ledger: { ...evmStats, bitcoin: bitcoinStats },
    binance: binanceStats,
    all: aggregatedStats,
  };

  console.log(JSON.stringify(result, null, 2));
};

fetchStats();
