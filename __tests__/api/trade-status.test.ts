import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/dreamdex/client", () => ({
  loadDreamDexConfig: vi.fn().mockReturnValue({ network: "testnet", chainId: 50312, rpcUrl: "http://rpc", wsRpcUrl: "", indexerUrl: "" }),
}));
vi.mock("viem", async (importOriginal) => {
  const actual = await importOriginal<typeof import("viem")>();
  return {
    ...actual,
    createPublicClient: vi.fn().mockReturnValue({
      getTransactionReceipt: vi.fn().mockResolvedValue({ status: "success" }),
    }),
  };
});

describe("GET /api/trade/status", () => {
  it("returns 400 when txHash is missing", async () => {
    const { GET } = await import("@/app/api/trade/status/route");
    const response = await GET(new Request("http://localhost/api/trade/status"));
    expect(response.status).toBe(400);
  });

  it("returns the polled state for a valid txHash", async () => {
    const { GET } = await import("@/app/api/trade/status/route");
    const response = await GET(new Request("http://localhost/api/trade/status?txHash=0xTX"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.state.status).toBe("confirmed");
  });
});
