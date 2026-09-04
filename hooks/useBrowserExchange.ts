"use client";
import { useMemo } from "react";
import { useWalletClient } from "wagmi";
import { createBrowserDreamDexExchange } from "@/lib/dreamdex/browserClient";
import type { SomniaMarkets } from "@somnia-chain/markets-sdk";

/**
 * A signer-bound DreamDEX exchange for the connected wallet, or null before
 * a wallet is connected. Rebuilt only when the underlying WalletClient
 * identity changes (wallet/account/chain switch), not on every render.
 */
export function useBrowserExchange(): SomniaMarkets | null {
  const { data: walletClient } = useWalletClient();
  return useMemo(() => (walletClient ? createBrowserDreamDexExchange(walletClient) : null), [walletClient]);
}
