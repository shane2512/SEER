import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockUseBalances = vi.fn();
vi.mock("@/hooks/useBalances", () => ({ useBalances: () => mockUseBalances() }));

const mockFaucet = vi.fn().mockResolvedValue({ hash: "0xFAUCETTX" });
const mockUseBrowserExchange = vi.fn(() => ({ trader: { faucet: mockFaucet } }));
vi.mock("@/hooks/useBrowserExchange", () => ({ useBrowserExchange: () => mockUseBrowserExchange() }));

describe("FundingCard", () => {
  it("renders nothing when both balances are healthy", async () => {
    mockUseBalances.mockReturnValue({ stt: BigInt("2000000000000000000"), tUsdc: BigInt(50_000_000), sttLow: false, tUsdcLow: false, refetch: vi.fn() });
    const { FundingCard } = await import("@/components/wallet/FundingCard");
    const { container } = render(<FundingCard />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the Google Cloud faucet link when STT is low", async () => {
    mockUseBalances.mockReturnValue({ stt: BigInt(0), tUsdc: BigInt(50_000_000), sttLow: true, tUsdcLow: false, refetch: vi.fn() });
    const { FundingCard } = await import("@/components/wallet/FundingCard");
    render(<FundingCard />);
    const link = screen.getByRole("link", { name: /get stt/i });
    expect(link).toHaveAttribute("href", "https://cloud.google.com/application/web3/faucet/somnia/shannon");
  });

  it("mints TestUSDC via the connected wallet when the Mint button is clicked", async () => {
    const refetch = vi.fn();
    mockUseBalances.mockReturnValue({ stt: BigInt("2000000000000000000"), tUsdc: BigInt(0), sttLow: false, tUsdcLow: true, refetch });
    const { FundingCard } = await import("@/components/wallet/FundingCard");
    render(<FundingCard />);
    fireEvent.click(screen.getByRole("button", { name: /mint testusdc/i }));
    await waitFor(() => expect(mockFaucet).toHaveBeenCalled());
    await waitFor(() => expect(refetch).toHaveBeenCalled());
  });
});
