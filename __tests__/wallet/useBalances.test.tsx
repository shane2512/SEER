import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const mockGetBalance = vi.fn();
vi.mock("viem", async (importOriginal) => {
  const actual = await importOriginal<typeof import("viem")>();
  return { ...actual, createPublicClient: vi.fn(() => ({ getBalance: mockGetBalance })) };
});

const mockUseWallet = vi.fn();
vi.mock("@/hooks/useWallet", () => ({ useWallet: () => mockUseWallet() }));

const mockGetErc20Balance = vi.fn();
const mockGetErc20Metadata = vi.fn();
const mockUseBrowserExchange = vi.fn();
vi.mock("@/hooks/useBrowserExchange", () => ({ useBrowserExchange: () => mockUseBrowserExchange() }));

beforeEach(() => {
  mockGetBalance.mockReset().mockResolvedValue(BigInt("2000000000000000000")); // 2 STT — well above the low threshold
  mockGetErc20Balance.mockReset().mockResolvedValue(BigInt(50_000_000)); // 50 tUSDC (6dp) — above a size-20 threshold
  mockGetErc20Metadata.mockReset().mockResolvedValue({ symbol: "TestUSDC", name: "Test USDC", decimals: 6 });
  mockUseWallet.mockReturnValue({ address: "0xABC", isConnected: true });
  mockUseBrowserExchange.mockReturnValue({
    client: { getErc20Balance: mockGetErc20Balance, getErc20Metadata: mockGetErc20Metadata },
  });
});

describe("useBalances", () => {
  it("reports both balances once loaded, with neither flagged low", async () => {
    const { useBalances } = await import("@/hooks/useBalances");
    const { result } = renderHook(() => useBalances());

    await waitFor(() => expect(result.current.stt).toBe(BigInt("2000000000000000000")));
    expect(result.current.tUsdc).toBe(BigInt(50_000_000));
    expect(result.current.sttLow).toBe(false);
    expect(result.current.tUsdcLow).toBe(false);
  });

  it("flags sttLow when the native balance is below the safety margin", async () => {
    mockGetBalance.mockResolvedValue(BigInt("100000000000000000")); // 0.1 STT
    const { useBalances } = await import("@/hooks/useBalances");
    const { result } = renderHook(() => useBalances());
    await waitFor(() => expect(result.current.stt).not.toBeNull());
    expect(result.current.sttLow).toBe(true);
  });

  it("flags tUsdcLow when the collateral balance can't cover one demo-sized order", async () => {
    mockGetErc20Balance.mockResolvedValue(BigInt(0));
    const { useBalances } = await import("@/hooks/useBalances");
    const { result } = renderHook(() => useBalances());
    await waitFor(() => expect(result.current.tUsdc).toBe(BigInt(0)));
    expect(result.current.tUsdcLow).toBe(true);
  });

  it("reports null balances (never a broken number) when not connected", async () => {
    mockUseWallet.mockReturnValue({ address: undefined, isConnected: false });
    mockUseBrowserExchange.mockReturnValue(null);
    const { useBalances } = await import("@/hooks/useBalances");
    const { result } = renderHook(() => useBalances());
    expect(result.current.stt).toBeNull();
    expect(result.current.tUsdc).toBeNull();
    expect(result.current.sttLow).toBe(false);
    expect(result.current.tUsdcLow).toBe(false);
  });
});
