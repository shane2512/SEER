import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

const mockCreateOrder = vi.fn().mockResolvedValue({ id: "1", status: "closed", filled: 5, price: 0.62, txHash: "0xTX" });
const fakeWalletClient = { account: { address: "0xABC" }, chain: { id: 50312 } };

vi.mock("wagmi", () => ({
  useWalletClient: vi.fn(() => ({ data: fakeWalletClient })),
}));
vi.mock("@/lib/dreamdex/browserClient", () => ({
  createBrowserDreamDexExchange: vi.fn(() => ({ createOrder: mockCreateOrder })),
}));

const marketView = {
  marketId: "0x1",
  symbol: "BTC-95000-31DEC26/USDC",
  asset: "BTC",
  referenceKind: "strike",
  referencePrice: 95_000,
  expiryMs: Date.now() + 300_000,
  status: "Trading",
  yesBid: 0.6,
  yesAsk: 0.62,
  yesMid: 0.61,
  spread: 0.02,
};

beforeEach(() => {
  mockCreateOrder.mockClear();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, market: marketView }) }),
  );
});

describe("useTrade", () => {
  it("starts idle, validates server-side, then submits client-side via the connected wallet", async () => {
    const { useTrade } = await import("@/hooks/useTrade");
    const { result } = renderHook(() => useTrade());
    expect(result.current.state).toEqual({ status: "idle" });

    await act(async () => {
      await result.current.execute("0x1", "YES", 5);
    });

    await waitFor(() => expect(result.current.state.status).toBe("confirmed"));
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/trade/validate",
      expect.objectContaining({ method: "POST" }),
    );
    // yesAsk 0.62 -> cross = min(0.99, 0.62 + 0.002) = 0.622 (submitTrade's own IOC-cross logic, unchanged).
    expect(mockCreateOrder).toHaveBeenCalledWith(
      "BTC-95000-31DEC26/USDC#YES",
      "limit",
      "buy",
      5,
      expect.closeTo(0.622, 5),
      { timeInForce: "IOC" },
    );
  });

  it("fails without calling the wallet when server-side validation rejects the trade", async () => {
    vi.mocked(global.fetch as never as typeof fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: false, reason: "size 999 exceeds the configured max of 20" }),
    } as Response);

    const { useTrade } = await import("@/hooks/useTrade");
    const { result } = renderHook(() => useTrade());

    await act(async () => {
      await result.current.execute("0x1", "YES", 999);
    });

    await waitFor(() => expect(result.current.state.status).toBe("failed"));
    expect(result.current.state).toMatchObject({ error: expect.stringMatching(/size/i) });
    expect(mockCreateOrder).not.toHaveBeenCalled();
  });

  it("fails with a clear message when no wallet is connected", async () => {
    const { useWalletClient } = await import("wagmi");
    vi.mocked(useWalletClient).mockReturnValueOnce({ data: undefined } as never);

    const { useTrade } = await import("@/hooks/useTrade");
    const { result } = renderHook(() => useTrade());

    await act(async () => {
      await result.current.execute("0x1", "YES", 5);
    });

    expect(result.current.state).toEqual({ status: "failed", error: "Connect a wallet before trading." });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
