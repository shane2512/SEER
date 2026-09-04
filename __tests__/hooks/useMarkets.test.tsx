import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useMarkets } from "@/hooks/useMarkets";

const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ markets: [{ marketId: "0x1", symbol: "BTC-95000-31DEC26/USDC" }], venueIds: ["0xVENUE1"] }),
});

beforeEach(() => {
  mockFetch.mockClear();
  vi.stubGlobal("fetch", mockFetch);
});

describe("useMarkets", () => {
  it("fetches markets and venueIds on mount", async () => {
    const { result } = renderHook(() => useMarkets());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.markets).toHaveLength(1);
    expect(result.current.venueIds).toEqual(["0xVENUE1"]);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith("/api/markets");
  });

  it("passes a selected venueId as a query param and refetches when it changes", async () => {
    const { result, rerender } = renderHook(({ venueId }: { venueId?: string }) => useMarkets(venueId), {
      initialProps: { venueId: undefined as string | undefined },
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    rerender({ venueId: "0xVENUE1" });
    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith("/api/markets?venueId=0xVENUE1"));
  });
});
