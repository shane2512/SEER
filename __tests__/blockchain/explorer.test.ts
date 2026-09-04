import { describe, expect, it } from "vitest";
import { explorerTxUrl } from "@/lib/blockchain/explorer";

describe("explorerTxUrl", () => {
  it("returns a real Somnia Shannon testnet explorer URL for chain id 50312", () => {
    const url = explorerTxUrl(50312, "0xabc123");
    expect(url).toBe("https://shannon-explorer.somnia.network/tx/0xabc123");
  });

  it("returns null for an unrecognized chain id", () => {
    const url = explorerTxUrl(999999, "0xabc123");
    expect(url).toBeNull();
  });
});
