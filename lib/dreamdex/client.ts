import {
  SOMNIA_TESTNET_ADDRESSES,
  SOMNIA_TESTNET_PRICE_FEED,
  SomniaMarkets,
  type SomniaMarketsConfig,
} from "@somnia-chain/markets-sdk";
import { getSomniaChain, defineChain, type Chain } from "@somnia-chain/markets-sdk/chains";

export interface DreamDexConfig {
  network: "testnet";
  chainId: number;
  rpcUrl: string;
  wsRpcUrl: string;
  indexerUrl: string;
  venueId?: `0x${string}`;
  privateKey?: `0x${string}`;
}

const DEFAULT_CHAIN_ID = 50312;
const DEFAULT_RPC_URL = "https://api.infra.testnet.somnia.network";
const DEFAULT_WS_RPC_URL = "wss://api.infra.testnet.somnia.network/ws";
const DEFAULT_INDEXER_URL = "https://dev.smk.somnia.host/v1/graphql";

const HEX_64_RE = /^[0-9a-fA-F]{64}$/;

/**
 * Parse an env string into a positive, finite number, falling back to
 * `fallback` when the variable is unset/empty. Throws a clear error when the
 * variable IS set but doesn't parse to a finite positive number — a typo'd
 * value (e.g. "0.05x") must fail loudly at startup, not silently become
 * `NaN` and defeat every downstream `>`/`<` guardrail comparison (NaN
 * compares false against every bound, so a NaN limit passes every trade).
 */
export function parsePositiveNumber(raw: string | undefined, fallback: number, name: string): number {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return fallback;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} is set to "${trimmed}", which is not a finite positive number.`);
  }
  return value;
}

/**
 * Normalize a private key env value to a `0x`-prefixed hex string. A real
 * gitignored `.env.local` in this repo was found (Task 22) to store the key
 * without its `0x` prefix — accept that shape, but only when the value
 * actually looks like 64 hex characters; never blindly prepend `0x` to
 * something that isn't hex, which would just produce a different-looking
 * garbage value instead of failing loudly.
 */
function normalizePrivateKey(raw: string): `0x${string}` | undefined {
  if (!raw) return undefined;
  if (raw.startsWith("0x") || raw.startsWith("0X")) return raw as `0x${string}`;
  if (HEX_64_RE.test(raw)) return (`0x${raw}`) as `0x${string}`;
  // Doesn't look like a bare hex key — pass through unchanged so any
  // downstream consumer's own validation reports the real problem.
  return raw as `0x${string}`;
}

/**
 * Read + validate SEER's Somnia/DreamDEX environment into a DreamDexConfig.
 * Testnet only — SEER has no mainnet code path (CLAUDE.md non-negotiable
 * constraint).
 */
export function loadDreamDexConfig(env: NodeJS.ProcessEnv = process.env): DreamDexConfig {
  const venueId = (env.DREAMDEX_VENUE_ID ?? "").trim();
  const privateKey = (env.BOT_OPERATOR_PRIVATE_KEY ?? "").trim();

  return {
    network: "testnet",
    chainId: parsePositiveNumber(env.NEXT_PUBLIC_SOMNIA_CHAIN_ID, DEFAULT_CHAIN_ID, "NEXT_PUBLIC_SOMNIA_CHAIN_ID"),
    rpcUrl: env.NEXT_PUBLIC_SOMNIA_RPC_URL ?? DEFAULT_RPC_URL,
    wsRpcUrl: env.SOMNIA_WS_RPC_URL ?? DEFAULT_WS_RPC_URL,
    indexerUrl: env.DREAMDEX_INDEXER_URL ?? DEFAULT_INDEXER_URL,
    venueId: venueId ? (venueId as `0x${string}`) : undefined,
    privateKey: normalizePrivateKey(privateKey),
  };
}

/**
 * Resolve a SEER DreamDexConfig to a viem Chain — a known Somnia chain
 * definition (carrying `contracts.multicall3`, block explorer metadata,
 * etc.) when `chainId` is one the SDK ships, else a minimal fallback built
 * from the configured RPC URLs. This is the one place chain resolution
 * happens — every call site (exchange construction, the trade-status route,
 * the doctor script) must go through this function rather than duplicating
 * the `getSomniaChain(...) ?? defineChain({...})` fallback inline, or it
 * silently loses that metadata.
 */
export function resolveSomniaChain(config: DreamDexConfig): Chain {
  return (
    getSomniaChain(config.chainId) ??
    defineChain({
      id: config.chainId,
      name: `somnia-${config.chainId}`,
      nativeCurrency: { name: "Somnia Test Token", symbol: "STT", decimals: 18 },
      rpcUrls: {
        default: {
          http: [config.rpcUrl],
          webSocket: [config.wsRpcUrl],
        },
      },
    })
  );
}

/**
 * Build the SomniaMarkets exchange handle. Pass `{ withSigner: true }` only
 * for the execution path (lib/bot/) — the read-only market/evaluation path
 * never needs a signer and must never load one.
 */
export function createDreamDexExchange(
  config: DreamDexConfig,
  opts: { withSigner?: boolean } = {},
): SomniaMarkets {
  if (opts.withSigner && !config.privateKey) {
    throw new Error(
      "BOT_OPERATOR_PRIVATE_KEY is required to trade. Set it in .env.local, or call " +
        "createDreamDexExchange without withSigner for read-only access.",
    );
  }

  const chain = resolveSomniaChain(config);

  const somniaConfig: SomniaMarketsConfig = {
    indexerUrl: config.indexerUrl,
    chain,
    wsRpcUrl: config.wsRpcUrl,
    // Protocol contract addresses — "all optional — features degrade if
    // unset" per the SDK's own docs, which is exactly what happened here:
    // exchange.client.getMarketOnchain() silently required
    // addresses.binaryModule and threw NotConfiguredError for every real
    // market, with no test ever catching it because every unit test mocks
    // the SDK entirely. Testnet-only (SEER's non-negotiable constraint) —
    // SOMNIA_MAINNET_ADDRESSES is never used.
    addresses: SOMNIA_TESTNET_ADDRESSES,
    // Same class of gap as addresses above: exchange.fetchPrice(asset) (the
    // BTC/ETH spot feed the evaluator's strike/momentum model depends on)
    // requires config.priceFeed and throws NotConfiguredError without it.
    // Testnet-only, matching this config's non-negotiable scope.
    priceFeed: SOMNIA_TESTNET_PRICE_FEED,
    privateKey: opts.withSigner ? config.privateKey : undefined,
  };

  return new SomniaMarkets(somniaConfig);
}
