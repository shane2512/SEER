// lib/dreamdex/browserClient.ts
//
// Browser-safe sibling to lib/dreamdex/client.ts — deliberately NOT a
// modification of that file. client.ts's normalizePrivateKey/
// requireOperatorConfig are server-only concerns; keeping this factory in
// its own module means a browser bundle can never accidentally pull in
// anything private-key-adjacent, even if client.ts later changes.
import {
  SOMNIA_TESTNET_ADDRESSES,
  SOMNIA_TESTNET_PRICE_FEED,
  SomniaMarkets,
  type SomniaMarketsConfig,
} from "@somnia-chain/markets-sdk";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";
import type { WalletClient } from "viem";

const DEFAULT_WS_RPC_URL = "wss://api.infra.testnet.somnia.network/ws";
const DEFAULT_INDEXER_URL = "https://dev.smk.somnia.host/v1/graphql";

/**
 * Build a signer-bound SomniaMarkets exchange from a connected browser
 * wallet's viem WalletClient (from wagmi's useWalletClient). No private key
 * ever passes through this module — the wallet extension signs; this only
 * wires the SDK to ask it to. Somnia Shannon only, matching wagmiConfig's
 * single-chain setup (CLAUDE.md's testnet-only constraint).
 */
export function createBrowserDreamDexExchange(walletClient: WalletClient): SomniaMarkets {
  const config: SomniaMarketsConfig = {
    indexerUrl: process.env.NEXT_PUBLIC_DREAMDEX_INDEXER_URL ?? DEFAULT_INDEXER_URL,
    chain: somniaShannon,
    wsRpcUrl: process.env.NEXT_PUBLIC_SOMNIA_WS_RPC_URL ?? DEFAULT_WS_RPC_URL,
    addresses: SOMNIA_TESTNET_ADDRESSES,
    priceFeed: SOMNIA_TESTNET_PRICE_FEED,
    walletClient,
  };
  return new SomniaMarkets(config);
}
