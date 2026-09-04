import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockUseWallet = vi.fn();
vi.mock("@/hooks/useWallet", () => ({ useWallet: () => mockUseWallet() }));

describe("ConnectWalletButton", () => {
  it("shows a Connect Wallet button when disconnected", async () => {
    mockUseWallet.mockReturnValue({
      isConnected: false, isWrongNetwork: false, isConnecting: false, isSwitching: false,
      address: undefined, connect: vi.fn(), disconnect: vi.fn(), switchToSomnia: vi.fn(),
    });
    const { ConnectWalletButton } = await import("@/components/wallet/ConnectWalletButton");
    render(<ConnectWalletButton />);
    expect(screen.getByRole("button", { name: /connect wallet/i })).toBeInTheDocument();
  });

  it("prompts a network switch when connected to the wrong chain", async () => {
    const switchToSomnia = vi.fn();
    mockUseWallet.mockReturnValue({
      isConnected: true, isWrongNetwork: true, isConnecting: false, isSwitching: false,
      address: "0xABCDEF1234567890", connect: vi.fn(), disconnect: vi.fn(), switchToSomnia,
    });
    const { ConnectWalletButton } = await import("@/components/wallet/ConnectWalletButton");
    render(<ConnectWalletButton />);
    fireEvent.click(screen.getByRole("button", { name: /switch to somnia/i }));
    expect(switchToSomnia).toHaveBeenCalled();
  });

  it("shows a truncated address once connected on the right network", async () => {
    mockUseWallet.mockReturnValue({
      isConnected: true, isWrongNetwork: false, isConnecting: false, isSwitching: false,
      address: "0xABCDEF1234567890", connect: vi.fn(), disconnect: vi.fn(), switchToSomnia: vi.fn(),
    });
    const { ConnectWalletButton } = await import("@/components/wallet/ConnectWalletButton");
    render(<ConnectWalletButton />);
    expect(screen.getByText(/0xABCD.{1,3}7890/)).toBeInTheDocument();
  });
});
