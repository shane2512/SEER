import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Countdown } from "@/components/markets/Countdown";
import { MarketCard } from "@/components/dashboard/MarketCard";
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
  it("renders minutes and seconds remaining", () => {
    render(<Countdown expiryMs={Date.now() + 90_000} />);
    expect(screen.getByText(/1m/)).toBeInTheDocument();
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
    expect(screen.getByText(/Trading/)).toBeInTheDocument();
    expect(screen.getByText(/0\.60/)).toBeInTheDocument();
    expect(screen.getByText(/0\.62/)).toBeInTheDocument();
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
