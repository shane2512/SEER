import { describe, expect, it, vi } from "vitest";

vi.mock("@somnia-chain/markets-sdk", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@somnia-chain/markets-sdk")>();
  return { ...actual, SomniaMarkets: vi.fn() };
});

describe("createBrowserDreamDexExchange", () => {
  it("builds a SomniaMarkets config from a walletClient, never a private key", async () => {
    const { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES, SOMNIA_TESTNET_PRICE_FEED } = await import(
      "@somnia-chain/markets-sdk"
    );
    const { createBrowserDreamDexExchange } = await import("@/lib/dreamdex/browserClient");
    const fakeWalletClient = { account: { address: "0xABC" }, chain: { id: 50312 } } as never;

    createBrowserDreamDexExchange(fakeWalletClient);

    expect(SomniaMarkets).toHaveBeenCalledWith(
      expect.objectContaining({
        addresses: SOMNIA_TESTNET_ADDRESSES,
        priceFeed: SOMNIA_TESTNET_PRICE_FEED,
        walletClient: fakeWalletClient,
      }),
    );
    const config = vi.mocked(SomniaMarkets).mock.calls[0]?.[0];
    expect(config).not.toHaveProperty("privateKey");
  });
});
