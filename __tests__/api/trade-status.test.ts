import { describe, expect, it, vi, beforeEach } from "vitest";

const mockConfig = { network: "testnet", chainId: 50312, rpcUrl: "http://rpc", wsRpcUrl: "", indexerUrl: "" };

vi.mock("@/lib/dreamdex/client", () => ({
  loadDreamDexConfig: vi.fn().mockReturnValue(mockConfig),
  resolveSomniaChain: vi.fn().mockReturnValue({ id: 50312, name: "somnia-50312" }),
}));

const getTransactionReceipt = vi.fn().mockResolvedValue({ status: "success" });

vi.mock("viem", async (importOriginal) => {
  const actual = await importOriginal<typeof import("viem")>();
  return {
    ...actual,
    createPublicClient: vi.fn().mockReturnValue({
      getTransactionReceipt: (...args: unknown[]) => getTransactionReceipt(...args),
    }),
  };
});

describe("GET /api/trade/status", () => {
  beforeEach(() => {
    getTransactionReceipt.mockReset().mockResolvedValue({ status: "success" });
  });

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

  it("returns a 502 error envelope when polling throws unexpectedly", async () => {
    const { loadDreamDexConfig } = await import("@/lib/dreamdex/client");
    vi.mocked(loadDreamDexConfig).mockImplementationOnce(() => {
      throw new Error("config blew up");
    });
    const { GET } = await import("@/app/api/trade/status/route");
    const response = await GET(new Request("http://localhost/api/trade/status?txHash=0xTX"));
    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.error).toBeTruthy();
  });
});
