import { getSomniaChain } from "@somnia-chain/markets-sdk/chains";

/**
 * Build a block-explorer URL for a confirmed transaction, using the real
 * chain metadata the SDK ships (`somniaChains[chainId].blockExplorers`) —
 * never a hardcoded explorer origin. Returns `null` when `chainId` isn't a
 * Somnia network the SDK recognizes (no explorer to link to), so callers
 * fall back to plain, non-linked text — the same graceful-degradation
 * pattern used throughout this codebase (see MarketView's `null` fields).
 */
export function explorerTxUrl(chainId: number, txHash: string): string | null {
  const chain = getSomniaChain(chainId);
  const baseUrl = chain?.blockExplorers?.default?.url;
  if (!baseUrl) return null;
  return `${baseUrl}/tx/${txHash}`;
}
