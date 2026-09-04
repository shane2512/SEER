import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

const mockConnectMutate = vi.fn();
const mockDisconnectMutate = vi.fn();
const mockSwitchChainMutate = vi.fn();

vi.mock("wagmi", () => ({
  useConnection: vi.fn(() => ({ address: "0xABC", isConnected: true, chainId: 50312 })),
  useConnect: vi.fn(() => ({ mutate: mockConnectMutate, isPending: false })),
  useConnectors: vi.fn(() => [{ id: "injected" }]),
  useDisconnect: vi.fn(() => ({ mutate: mockDisconnectMutate })),
  useSwitchChain: vi.fn(() => ({ mutate: mockSwitchChainMutate, isPending: false })),
}));

describe("useWallet", () => {
  it("reports connected on the right network", async () => {
    const { useWallet } = await import("@/hooks/useWallet");
    const { result } = renderHook(() => useWallet());
    expect(result.current.isConnected).toBe(true);
    expect(result.current.isWrongNetwork).toBe(false);
    expect(result.current.address).toBe("0xABC");
  });

  it("flags the wrong network when connected chainId isn't Somnia Shannon", async () => {
    const { useConnection } = await import("wagmi");
    vi.mocked(useConnection).mockReturnValueOnce({ address: "0xABC", isConnected: true, chainId: 1 } as never);

    const { useWallet } = await import("@/hooks/useWallet");
    const { result } = renderHook(() => useWallet());
    expect(result.current.isWrongNetwork).toBe(true);
  });

  it("calls wagmi connect with the first available connector", async () => {
    const { useWallet } = await import("@/hooks/useWallet");
    const { result } = renderHook(() => useWallet());
    result.current.connect();
    expect(mockConnectMutate).toHaveBeenCalledWith({ connector: { id: "injected" } });
  });

  it("calls wagmi switchChain with Somnia Shannon's chain id", async () => {
    const { useWallet } = await import("@/hooks/useWallet");
    const { result } = renderHook(() => useWallet());
    result.current.switchToSomnia();
    expect(mockSwitchChainMutate).toHaveBeenCalledWith({ chainId: 50312 });
  });
});
