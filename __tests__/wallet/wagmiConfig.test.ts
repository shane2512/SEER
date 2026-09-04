import { describe, expect, it } from "vitest";
import { wagmiConfig } from "@/lib/wallet/wagmiConfig";

describe("wagmiConfig", () => {
  it("is scoped to Somnia Shannon testnet only", () => {
    expect(wagmiConfig.chains).toHaveLength(1);
    expect(wagmiConfig.chains[0]!.id).toBe(50312);
  });

  it("registers exactly one (injected) connector", () => {
    expect(wagmiConfig.connectors).toHaveLength(1);
  });

  it("enables ssr mode — without it, a previously-connected wallet's persisted state resolves before hydration on the client but not on the server, producing a real hydration mismatch (caught live in ConnectWalletButton)", () => {
    expect(wagmiConfig._internal.ssr).toBe(true);
  });
});
