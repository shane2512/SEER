import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useMarkets } from "@/hooks/useMarkets";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ markets: [{ marketId: "0x1", symbol: "BTC-95000-31DEC26/USDC" }] }),
    }),
  );
});

describe("useMarkets", () => {
  it("fetches markets on mount", async () => {
    const { result } = renderHook(() => useMarkets());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.markets).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });
});
