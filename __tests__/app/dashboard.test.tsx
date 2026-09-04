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

const mockFetch = vi.fn((url: string) => {
  if (url.startsWith("/api/markets")) return Promise.resolve({ ok: true, json: async () => ({ markets: [market], venueIds: [] }) });
  if (url === "/api/evaluate") return Promise.resolve({ ok: true, json: async () => ({ decision }) });
  if (url === "/api/trade/validate") return Promise.resolve({ ok: true, json: async () => ({ ok: true, market }) });
  return Promise.resolve({ ok: true, json: async () => ({}) });
});
vi.stubGlobal("fetch", mockFetch as unknown as typeof fetch);

const mockUseWallet = vi.fn();
vi.mock("@/hooks/useWallet", () => ({ useWallet: () => mockUseWallet() }));

const mockCreateOrder = vi.fn().mockResolvedValue({ id: "1", status: "closed", filled: 5, price: 0.62, txHash: "0xTX" });
vi.mock("@/hooks/useBrowserExchange", () => ({
  useBrowserExchange: () => ({ createOrder: mockCreateOrder, client: { getErc20Balance: vi.fn(), getErc20Metadata: vi.fn() } }),
}));
vi.mock("@/lib/dreamdex/browserClient", () => ({
  createBrowserDreamDexExchange: () => ({ createOrder: mockCreateOrder }),
}));
vi.mock("wagmi", () => ({
  useWalletClient: () => ({ data: { account: { address: "0xABC" }, chain: { id: 50312 } } }),
}));
// FundingCard/useBalances have their own dedicated tests (Task 10) —
// stub healthy balances here so this test stays focused on wallet-gating
// and the trade flow, and so it never makes a real viem network call.
vi.mock("@/hooks/useBalances", () => ({
  useBalances: () => ({ stt: null, tUsdc: null, sttLow: false, tUsdcLow: false, refetch: vi.fn() }),
}));

describe("DashboardPage", () => {
  it("prompts wallet connection instead of showing the trade panel when disconnected", async () => {
    mockUseWallet.mockReturnValue({
      address: undefined, isConnected: false, isWrongNetwork: false, isConnecting: false, isSwitching: false,
      connect: vi.fn(), disconnect: vi.fn(), switchToSomnia: vi.fn(),
    });
    const { default: DashboardPage } = await import("@/app/dashboard/page");
    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByText("BULLISH")).toBeInTheDocument());
    expect(screen.getByText(/connect your wallet to trade/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^execute/i })).not.toBeInTheDocument();
  });

  it("renders the market, its signal, and lets a connected user execute a trade", async () => {
    mockUseWallet.mockReturnValue({
      address: "0xABC", isConnected: true, isWrongNetwork: false, isConnecting: false, isSwitching: false,
      connect: vi.fn(), disconnect: vi.fn(), switchToSomnia: vi.fn(),
    });
    const { default: DashboardPage } = await import("@/app/dashboard/page");
    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByText("BTC")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("BULLISH")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /execute/i }));

    await waitFor(() => expect(screen.getByText(/0xTX/)).toBeInTheDocument());
  });

  it("shows a retryable error, not a silently stuck feed, when evaluation fails", async () => {
    mockUseWallet.mockReturnValue({
      address: "0xABC", isConnected: true, isWrongNetwork: false, isConnecting: false, isSwitching: false,
      connect: vi.fn(), disconnect: vi.fn(), switchToSomnia: vi.fn(),
    });
    mockFetch.mockImplementationOnce((url: string) =>
      Promise.resolve({ ok: true, json: async () => ({ markets: [market], venueIds: [] }) } as Response),
    );
    mockFetch.mockImplementationOnce((url: string) =>
      Promise.resolve({ ok: true, json: async () => ({ error: "no live price feed reading for this asset" }) } as Response),
    );

    const { default: DashboardPage } = await import("@/app/dashboard/page");
    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByText("BTC")).toBeInTheDocument());
    await waitFor(() =>
      expect(screen.getByText(/no live price feed reading for this asset/i)).toBeInTheDocument(),
    );
    expect(screen.queryByText("BULLISH")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry evaluation/i })).toBeInTheDocument();
  });
});
