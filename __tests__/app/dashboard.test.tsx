// __tests__/app/dashboard.test.tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const market = {
  marketId: "0x1",
  symbol: "BTC-95000-31DEC26/USDC",
  asset: "BTC",
  referenceKind: "strike",
  referencePrice: 95_000,
  expiryMs: Date.now() + 161_000,
  status: "Trading",
  yesBid: 0.6,
  yesAsk: 0.62,
  yesMid: 0.61,
  spread: 0.02,
};
const decision = {
  marketId: "0x1",
  direction: "BULLISH",
  confidence: 0.82,
  rationale: "BTC spot $63,912 sits 0.6% above the $63,500 strike with 2m41s remaining; model favors UP.",
  timestamp: Date.now(),
};

vi.stubGlobal(
  "fetch",
  vi.fn((url: string, init?: RequestInit) => {
    if (url === "/api/markets") return Promise.resolve({ ok: true, json: async () => ({ markets: [market] }) });
    if (url === "/api/evaluate") return Promise.resolve({ ok: true, json: async () => ({ decision }) });
    if (url === "/api/trade") {
      return Promise.resolve({
        ok: true,
        json: async () => ({ state: { status: "confirmed", txHash: "0xTX", filled: 5, price: 0.62 } }),
      });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  }) as unknown as typeof fetch,
);

describe("DashboardPage", () => {
  it("renders the market, its signal, and lets the user execute a trade", async () => {
    const { default: DashboardPage } = await import("@/app/dashboard/page");
    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByText("BTC")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("BULLISH")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /execute/i }));

    await waitFor(() => expect(screen.getByText(/0xTX/)).toBeInTheDocument());
  });
});
