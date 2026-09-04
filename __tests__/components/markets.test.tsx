import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Countdown } from "@/components/markets/Countdown";
import { MarketCard } from "@/components/dashboard/MarketCard";
import { MarketSelector } from "@/components/markets/MarketSelector";
import { VenueSelector } from "@/components/markets/VenueSelector";
import type { MarketView } from "@/lib/dreamdex/event-contracts";

const market: MarketView = {
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

describe("Countdown", () => {
  it("renders minutes and seconds remaining as MM:SS", () => {
    render(<Countdown expiryMs={Date.now() + 90_000} />);
    expect(screen.getByText(/^1:\d{2}$/)).toBeInTheDocument();
  });

  it("renders EXPIRED once past expiry", () => {
    render(<Countdown expiryMs={Date.now() - 1_000} />);
    expect(screen.getByText(/expired/i)).toBeInTheDocument();
  });
});

describe("MarketCard", () => {
  it("shows the asset, status, and YES/NO prices", () => {
    render(<MarketCard market={market} />);
    expect(screen.getByText("BTC")).toBeInTheDocument();
    expect(screen.getByText(/live/i)).toBeInTheDocument();
    expect(screen.getByText(/0\.60/)).toBeInTheDocument();
    expect(screen.getByText(/0\.62/)).toBeInTheDocument();
  });
});

describe("MarketSelector", () => {
  const other: MarketView = { ...market, marketId: "0x2", asset: "ETH", symbol: "ETH-2500-31DEC26/USDC", referencePrice: 2_500 };

  it("renders one clickable tile per market with its real asset/price/countdown", () => {
    render(<MarketSelector markets={[market, other]} selected={null} onSelect={vi.fn()} />);
    expect(screen.getByRole("button", { name: /BTC/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ETH/ })).toBeInTheDocument();
    expect(screen.getByText("$95,000")).toBeInTheDocument();
  });

  it("calls onSelect with the clicked market's id", () => {
    const onSelect = vi.fn();
    render(<MarketSelector markets={[market, other]} selected={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: /ETH/ }));
    expect(onSelect).toHaveBeenCalledWith("0x2");
  });

  it("marks the selected tile pressed", () => {
    render(<MarketSelector markets={[market, other]} selected="0x1" onSelect={vi.fn()} />);
    expect(screen.getByRole("button", { name: /BTC/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /ETH/ })).toHaveAttribute("aria-pressed", "false");
  });

  it("renders nothing for an empty market list", () => {
    const { container } = render(<MarketSelector markets={[]} selected={null} onSelect={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("VenueSelector", () => {
  it("renders an 'All venues' option plus one per discovered venue", () => {
    render(<VenueSelector venueIds={["0xAAA", "0xBBB"]} selected={undefined} onSelect={vi.fn()} />);
    expect(screen.getByRole("button", { name: /all venues/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "0xAAA" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "0xBBB" })).toBeInTheDocument();
  });

  it("calls onSelect with the clicked venue id", () => {
    const onSelect = vi.fn();
    render(<VenueSelector venueIds={["0xAAA", "0xBBB"]} selected={undefined} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: "0xAAA" }));
    expect(onSelect).toHaveBeenCalledWith("0xAAA");
  });

  it("calls onSelect with undefined when 'All venues' is clicked", () => {
    const onSelect = vi.fn();
    render(<VenueSelector venueIds={["0xAAA", "0xBBB"]} selected="0xAAA" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: /all venues/i }));
    expect(onSelect).toHaveBeenCalledWith(undefined);
  });

  it("renders nothing when there is only one (or zero) discovered venue — no real choice to make", () => {
    const { container } = render(<VenueSelector venueIds={["0xONLY"]} selected={undefined} onSelect={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
