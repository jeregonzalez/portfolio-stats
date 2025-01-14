import { cleanEnv, json, str } from "envalid";
import dotenv from "dotenv";
import { Blockchain } from "../providers/moralis";

dotenv.config();

export const env = cleanEnv(process.env, {
  MORALIS_API_KEY: str(),
  ADDRESS: str(),
  EVM_BLOCKCHAINS: json<Blockchain[]>(),
  BINANCE_API_KEY: str(),
  BINANCE_API_SECRET: str(),
});
