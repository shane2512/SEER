import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const mockUseWallet = vi.fn();
vi.mock("@/hooks/useWallet", () => ({ useWallet: () => mockUseWallet() }));

const mockGetPortfolio = vi.fn();
const mockUseBrowserExchange = vi.fn();
vi.mock("@/hooks/useBrowserExchange", () => ({ useBrowserExchange: () => mockUseBrowserExchange() }));

describe("HistoryPage", () => {
  it("prompts wallet connection when disconnected", async () => {
    mockUseWallet.mockReturnValue({ address: undefined, isConnected: false });
    mockUseBrowserExchange.mockReturnValue(null);
    const { default: HistoryPage } = await import("@/app/history/page");
    render(<HistoryPage />);
    expect(screen.getByText(/connect your wallet/i)).toBeInTheDocument();
  });

  it("shows real positions, open orders, and trades for the connected wallet", async () => {
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
      trades: [
        {
          id: "t1",
          fillPrice: "620000",
          quantity: "5000000",
          timestamp: String(Math.floor(Date.now() / 1000)),
          txHash: "0xTX1",
          side: "YES",
          asMaker: false,
          counterparty: null,
          market: { marketAddress: "0xmkt", asset: "BTC", quoteDecimals: 6, intervalSec: null, interval: null, tradingStart: null, expiry: null },
        },
      ],
      tradesTruncated: false,
    });
    mockUseBrowserExchange.mockReturnValue({ client: { getPortfolio: mockGetPortfolio } });

    const { default: HistoryPage } = await import("@/app/history/page");
    render(<HistoryPage />);

    await waitFor(() => expect(screen.getByText(/will btc be above \$95,000\?/i)).toBeInTheDocument());
    expect(screen.getByText(/0xTX1/)).toBeInTheDocument();
  });
});
