import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

const mockUseWallet = vi.fn();
vi.mock("@/hooks/useWallet", () => ({ useWallet: () => mockUseWallet() }));

const mockGetPortfolio = vi.fn();
const mockUseBrowserExchange = vi.fn();
vi.mock("@/hooks/useBrowserExchange", () => ({ useBrowserExchange: () => mockUseBrowserExchange() }));

function makeTrade(overrides: Record<string, unknown> = {}) {
  return {
    id: "t1",
    fillPrice: "620000",
    quantity: "5000000",
    timestamp: String(Math.floor(Date.now() / 1000)),
    txHash: "0xTX1",
    side: "BUY_YES",
    asMaker: false,
    counterparty: null,
    market: { marketAddress: "0xmkt", asset: "BTC", quoteDecimals: 6, intervalSec: null, interval: null, tradingStart: null, expiry: null },
    ...overrides,
  };
}

describe("HistoryPage", () => {
  it("prompts wallet connection when disconnected", async () => {
    mockUseWallet.mockReturnValue({ address: undefined, isConnected: false });
    mockUseBrowserExchange.mockReturnValue(null);
    const { default: HistoryPage } = await import("@/app/history/page");
    render(<HistoryPage />);
    expect(screen.getByText(/connect your wallet/i)).toBeInTheDocument();
  });

  it("shows real metrics, positions, and a filterable trade table for the connected wallet", async () => {
    mockUseWallet.mockReturnValue({ address: "0xABC", isConnected: true });
    mockGetPortfolio.mockResolvedValue({
      account: "0xabc",
      positions: [
        {
          market: { id: "0x1", asset: "BTC", question: "Will BTC be above $95,000?", quoteDecimals: 6 },
          outcomeIndex: 0,
          tokenId: "1",
          balance: "5000000",
        },
      ],
      openOrders: [],
      trades: [makeTrade({ id: "t1", txHash: "0xTX1" }), makeTrade({ id: "t2", txHash: "0xTX2", side: "BUY_NO", market: { ...makeTrade().market, asset: "ETH" } })],
      tradesTruncated: false,
    });
    mockUseBrowserExchange.mockReturnValue({ client: { getPortfolio: mockGetPortfolio } });

    const { default: HistoryPage } = await import("@/app/history/page");
    render(<HistoryPage />);

    await waitFor(() => expect(screen.getByText(/will btc be above \$95,000\?/i)).toBeInTheDocument());
    // Total Trades metric reflects the real count.
    expect(screen.getByText("Total Trades")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(/0xTX1/)).toBeInTheDocument();
    expect(screen.getByText(/0xTX2/)).toBeInTheDocument();

    // Filtering by market narrows the table to matching trades only.
    fireEvent.click(screen.getByRole("button", { name: "ETH" }));
    await waitFor(() => expect(screen.queryByText(/0xTX1/)).not.toBeInTheDocument());
    expect(screen.getByText(/0xTX2/)).toBeInTheDocument();
  });

  it("shows a read error instead of a silently stuck page", async () => {
    mockUseWallet.mockReturnValue({ address: "0xABC", isConnected: true });
    mockGetPortfolio.mockRejectedValue(new Error("indexer unavailable"));
    mockUseBrowserExchange.mockReturnValue({ client: { getPortfolio: mockGetPortfolio } });

    const { default: HistoryPage } = await import("@/app/history/page");
    render(<HistoryPage />);

    await waitFor(() => expect(screen.getByText(/indexer unavailable/i)).toBeInTheDocument());
  });
});
