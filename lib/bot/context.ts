import { parsePositiveNumber } from "../dreamdex/client";
import type { RiskLimits } from "./permissions";

const DEFAULT_MAX_ORDER_SIZE = 20;
const DEFAULT_MAX_PRICE_DEVIATION = 0.05;

export function loadRiskLimits(env: NodeJS.ProcessEnv = process.env): RiskLimits {
  return {
    maxOrderSize: parsePositiveNumber(env.MAX_ORDER_SIZE, DEFAULT_MAX_ORDER_SIZE, "MAX_ORDER_SIZE"),
    maxPriceDeviation: parsePositiveNumber(env.MAX_PRICE_DEVIATION, DEFAULT_MAX_PRICE_DEVIATION, "MAX_PRICE_DEVIATION"),
  };
}
