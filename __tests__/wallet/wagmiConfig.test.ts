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
});
