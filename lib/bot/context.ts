import { loadDreamDexConfig, type DreamDexConfig } from "../dreamdex/client";
import type { RiskLimits } from "./permissions";

/** DreamDexConfig with `privateKey` guaranteed present — throws otherwise,
 *  so a misconfigured deploy fails at the trade route rather than signing
 *  with an absent key. */
export function requireOperatorConfig(env: NodeJS.ProcessEnv = process.env): DreamDexConfig {
  const config = loadDreamDexConfig(env);
  if (!config.privateKey) {
    throw new Error(
      "BOT_OPERATOR_PRIVATE_KEY is not set. SEER needs a dedicated, demo-funded " +
        "Somnia Shannon testnet wallet to execute trades — see .env.example.",
    );
  }
  return config;
}

const DEFAULT_MAX_ORDER_SIZE = 20;
const DEFAULT_MAX_PRICE_DEVIATION = 0.05;

export function loadRiskLimits(env: NodeJS.ProcessEnv = process.env): RiskLimits {
  return {
    maxOrderSize: env.MAX_ORDER_SIZE ? Number(env.MAX_ORDER_SIZE) : DEFAULT_MAX_ORDER_SIZE,
    maxPriceDeviation: env.MAX_PRICE_DEVIATION ? Number(env.MAX_PRICE_DEVIATION) : DEFAULT_MAX_PRICE_DEVIATION,
  };
}
