import { describe, expect, it, vi } from "vitest";
import { pollTradeStatus, type ReceiptReader } from "@/lib/blockchain/client";

describe("pollTradeStatus", () => {
  it("returns confirmed when the receipt status is success", async () => {
    const reader: ReceiptReader = {
      getTransactionReceipt: vi.fn().mockResolvedValue({ status: "success" }),
    };
    const result = await pollTradeStatus(reader, "0xTX", { attempts: 1, intervalMs: 0 });
    expect(result).toEqual({ status: "confirmed", txHash: "0xTX", filled: 0, price: 0 });
  });

  it("returns failed when the receipt status is reverted", async () => {
    const reader: ReceiptReader = {
      getTransactionReceipt: vi.fn().mockResolvedValue({ status: "reverted" }),
    };
    const result = await pollTradeStatus(reader, "0xTX", { attempts: 1, intervalMs: 0 });
    expect(result).toEqual({ status: "failed", error: expect.stringMatching(/reverted/i) });
  });

  it("retries until the receipt appears, then reports submitted if it never does", async () => {
    const getTransactionReceipt = vi.fn().mockResolvedValue(null);
    const reader: ReceiptReader = { getTransactionReceipt };
    const result = await pollTradeStatus(reader, "0xTX", { attempts: 3, intervalMs: 0 });
    expect(getTransactionReceipt).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ status: "submitted", txHash: "0xTX" });
  });
});
