import type { TradeState } from "./transactions";

export interface ReceiptReader {
  getTransactionReceipt(hash: `0x${string}`): Promise<{ status: "success" | "reverted" } | null>;
}

/**
 * Poll for a transaction's receipt, mapping it onto TradeState. Still
 * "submitted" (not a failure) if no receipt appears within `attempts` — the
 * caller's UI keeps polling this endpoint rather than treating a slow node
 * as a dead trade.
 */
export async function pollTradeStatus(
  reader: ReceiptReader,
  txHash: `0x${string}`,
  opts: { attempts?: number; intervalMs?: number } = {},
): Promise<TradeState> {
  const attempts = opts.attempts ?? 10;
  const intervalMs = opts.intervalMs ?? 1_000;

  for (let i = 0; i < attempts; i++) {
    const receipt = await reader.getTransactionReceipt(txHash);
    if (receipt?.status === "success") {
      return { status: "confirmed", txHash, filled: 0, price: 0 };
    }
    if (receipt?.status === "reverted") {
      return { status: "failed", error: `transaction ${txHash} reverted on-chain` };
    }
    if (i < attempts - 1 && intervalMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
  return { status: "submitted", txHash };
}
