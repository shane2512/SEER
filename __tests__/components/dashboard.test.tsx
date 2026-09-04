import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SignalCard } from "@/components/dashboard/SignalCard";
import { ReasoningFeed } from "@/components/dashboard/ReasoningFeed";
import { TradePanel } from "@/components/dashboard/TradePanel";
import { PositionCard } from "@/components/dashboard/PositionCard";
import type { Decision } from "@/lib/seer/decision";
import type { TradeState } from "@/lib/blockchain/transactions";

const decision: Decision = {
  marketId: "0x1",
  direction: "BULLISH",
  confidence: 0.82,
  rationale: "BTC spot $63,912 sits 0.6% above the $63,500 strike with 2m41s remaining; model favors UP.",
  timestamp: Date.now(),
};

describe("SignalCard", () => {
  it("shows direction, confidence, and rationale", () => {
    render(<SignalCard decision={decision} />);
    expect(screen.getByText("BULLISH")).toBeInTheDocument();
    expect(screen.getByText(/82%/)).toBeInTheDocument();
    expect(screen.getByText(/63,912/)).toBeInTheDocument();
  });
});

describe("ReasoningFeed", () => {
  it("highlights the steps completed so far", () => {
    render(<ReasoningFeed tradeState={{ status: "submitted", txHash: "0xTX" }} hasDecision />);
    expect(screen.getByText(/order submitted/i)).toBeInTheDocument();
  });
});

describe("TradePanel", () => {
  it("calls onExecute with the chosen side and size", () => {
    const onExecute = vi.fn();
    render(<TradePanel decision={decision} tradeState={{ status: "idle" }} onExecute={onExecute} />);
    fireEvent.click(screen.getByRole("button", { name: /execute/i }));
    expect(onExecute).toHaveBeenCalledWith("YES", expect.any(Number));
  });

  it("disables execute while a trade is in flight", () => {
    render(<TradePanel decision={decision} tradeState={{ status: "submitting", requestId: "r1" }} onExecute={vi.fn()} />);
    expect(screen.getByRole("button", { name: /execute/i })).toBeDisabled();
  });
});

describe("PositionCard", () => {
  it("shows the confirmed transaction hash and fill", () => {
    const state: TradeState = { status: "confirmed", txHash: "0xTX", filled: 5, price: 0.62 };
    render(<PositionCard tradeState={state} />);
    expect(screen.getByText(/0xTX/)).toBeInTheDocument();
    expect(screen.getByText(/0.62/)).toBeInTheDocument();
  });
});
