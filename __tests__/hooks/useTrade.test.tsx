import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useTrade } from "@/hooks/useTrade";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ state: { status: "confirmed", txHash: "0xTX", filled: 5, price: 0.62 } }),
    }),
  );
});

describe("useTrade", () => {
  it("starts idle and transitions to the fetched state after execute()", async () => {
    const { result } = renderHook(() => useTrade());
    expect(result.current.state).toEqual({ status: "idle" });

    await act(async () => {
      await result.current.execute("0x1", "YES", 5);
    });

    await waitFor(() => expect(result.current.state.status).toBe("confirmed"));
  });
});
