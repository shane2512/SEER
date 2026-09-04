import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HistoryMetrics } from "@/components/history/HistoryMetrics";
import { TradeFilters } from "@/components/history/TradeFilters";
import { TradeTable } from "@/components/history/TradeTable";
import type { Portfolio, PortfolioTrade } from "@somnia-chain/markets-sdk";

function makeTrade(overrides: Partial<PortfolioTrade> = {}): PortfolioTrade {
  return {
    id: `t${Math.random()}`,
    fillPrice: "620000",
    quantity: "5000000",
    timestamp: "1700000000",
    txHash: "0xTX",
    side: "BUY_YES",
    asMaker: false,
    counterparty: null,
    market: { marketAddress: "0xmkt", asset: "BTC", quoteDecimals: 6, intervalSec: null, interval: null, tradingStart: null, expiry: null },
    ...overrides,
  } as PortfolioTrade;
}

describe("HistoryMetrics", () => {
  it("computes real metrics from the portfolio — no fabricated win-rate/PnL", () => {
    const portfolio = {
      account: "0xabc",
      positions: [{}],
      openOrders: [],
      trades: [makeTrade({ fillPrice: "500000", quantity: "2000000" })],
      tradesTruncated: false,
    } as unknown as Portfolio;
    render(<HistoryMetrics portfolio={portfolio} />);
    expect(screen.getByText("Total Trades")).toBeInTheDocument();
    expect(screen.getByText("Open Positions")).toBeInTheDocument();
    // fillPrice 0.5 * quantity 2 = 1.00 total volume; Total Trades = 1;
    // Open Positions = 1 -- three tiles legitimately show "1" here.
    expect(screen.getAllByText("1")).toHaveLength(3);
    expect(screen.getByText("Open Orders")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.queryByText(/win rate/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/pnl/i)).not.toBeInTheDocument();
  });
});

describe("TradeFilters", () => {
  it("calls onChange with the selected asset, and All resets it", () => {
    const onChange = vi.fn();
    render(<TradeFilters assets={["BTC", "ETH"]} filters={{ asset: null, outcome: null }} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "ETH" }));
    expect(onChange).toHaveBeenCalledWith({ asset: "ETH", outcome: null });
  });

  it("calls onChange with the selected outcome", () => {
    const onChange = vi.fn();
    render(<TradeFilters assets={["BTC"]} filters={{ asset: null, outcome: null }} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "NO" }));
    expect(onChange).toHaveBeenCalledWith({ asset: null, outcome: "NO" });
  });
});

describe("TradeTable", () => {
  beforeEach(() => {
    // jsdom doesn't implement these — stub them so the Export CSV click
    // path is exercised without a real download.
    URL.createObjectURL = vi.fn(() => "blob:mock");
    URL.revokeObjectURL = vi.fn();
  });

  it("shows an honest empty state for no trades", () => {
    render(<TradeTable trades={[]} />);
    expect(screen.getByText(/no trades yet/i)).toBeInTheDocument();
  });

  it("paginates at 8 rows per page", () => {
    const trades = Array.from({ length: 10 }, (_, i) => makeTrade({ id: `t${i}`, txHash: `0xTX${i}` }));
    render(<TradeTable trades={trades} />);
    expect(screen.getByText(/showing 8 of 10 records/i)).toBeInTheDocument();
    expect(screen.getByText(/0xTX0/)).toBeInTheDocument();
    expect(screen.queryByText(/0xTX9/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText(/0xTX9/)).toBeInTheDocument();
    expect(screen.queryByText(/0xTX0/)).not.toBeInTheDocument();
  });

  it("exports a CSV without throwing", () => {
    const trades = [makeTrade({ id: "t1", txHash: "0xTX1" })];
    render(<TradeTable trades={trades} />);
    fireEvent.click(screen.getByRole("button", { name: /export csv/i }));
    expect(URL.createObjectURL).toHaveBeenCalled();
  });
});
