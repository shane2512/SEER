import { SomniaMarkets, type SomniaMarketsConfig } from "@somnia-chain/markets-sdk";
import { defineChain } from "viem";

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
    chainId: env.NEXT_PUBLIC_SOMNIA_CHAIN_ID ? Number(env.NEXT_PUBLIC_SOMNIA_CHAIN_ID) : DEFAULT_CHAIN_ID,
    rpcUrl: env.NEXT_PUBLIC_SOMNIA_RPC_URL ?? DEFAULT_RPC_URL,
    wsRpcUrl: env.SOMNIA_WS_RPC_URL ?? DEFAULT_WS_RPC_URL,
    indexerUrl: env.DREAMDEX_INDEXER_URL ?? DEFAULT_INDEXER_URL,
    venueId: venueId ? (venueId as `0x${string}`) : undefined,
    privateKey: privateKey ? (privateKey as `0x${string}`) : undefined,
  };
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

  const chain = defineChain({
    id: config.chainId,
    name: `somnia-${config.chainId}`,
    nativeCurrency: { name: "Somnia Test Token", symbol: "STT", decimals: 18 },
    rpcUrls: {
      default: {
        http: [config.rpcUrl],
        webSocket: [config.wsRpcUrl],
      },
    },
  });

  const somniaConfig: SomniaMarketsConfig = {
    indexerUrl: config.indexerUrl,
    chain,
    wsRpcUrl: config.wsRpcUrl,
    privateKey: opts.withSigner ? config.privateKey : undefined,
  };

  return new SomniaMarkets(somniaConfig);
}
