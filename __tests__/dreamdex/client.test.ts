import { describe, expect, it } from "vitest";
import { loadDreamDexConfig, createDreamDexExchange, parsePositiveNumber, resolveSomniaChain } from "@/lib/dreamdex/client";

describe("loadDreamDexConfig", () => {
  it("reads chain/rpc from env with testnet defaults", () => {
    const config = loadDreamDexConfig({
      NEXT_PUBLIC_SOMNIA_CHAIN_ID: "50312",
      NEXT_PUBLIC_SOMNIA_RPC_URL: "https://api.infra.testnet.somnia.network",
      DREAMDEX_INDEXER_URL: "https://dev.smk.somnia.host/v1/graphql",
      DREAMDEX_VENUE_ID: "0xabc",
    } as unknown as NodeJS.ProcessEnv);

    expect(config).toEqual({
      network: "testnet",
      chainId: 50312,
      rpcUrl: "https://api.infra.testnet.somnia.network",
      wsRpcUrl: "wss://api.infra.testnet.somnia.network/ws",
      indexerUrl: "https://dev.smk.somnia.host/v1/graphql",
      venueId: "0xabc",
      privateKey: undefined,
    });
  });

  it("leaves venueId and privateKey undefined when unset", () => {
    const config = loadDreamDexConfig({} as unknown as NodeJS.ProcessEnv);
    expect(config.venueId).toBeUndefined();
    expect(config.privateKey).toBeUndefined();
    expect(config.chainId).toBe(50312); // default
  });

  it("throws a clear error instead of silently becoming NaN for a malformed chain id", () => {
    expect(() =>
      loadDreamDexConfig({ NEXT_PUBLIC_SOMNIA_CHAIN_ID: "not-a-number" } as unknown as NodeJS.ProcessEnv),
    ).toThrow(/NEXT_PUBLIC_SOMNIA_CHAIN_ID/);
  });

  it("normalizes a 64-hex-char privateKey without a 0x prefix", () => {
    const bareHex = "a".repeat(64);
    const config = loadDreamDexConfig({ BOT_OPERATOR_PRIVATE_KEY: bareHex } as unknown as NodeJS.ProcessEnv);
    expect(config.privateKey).toBe(`0x${bareHex}`);
  });

  it("leaves an already-0x-prefixed privateKey unchanged", () => {
    const key = `0x${"b".repeat(64)}`;
    const config = loadDreamDexConfig({ BOT_OPERATOR_PRIVATE_KEY: key } as unknown as NodeJS.ProcessEnv);
    expect(config.privateKey).toBe(key);
  });
});

describe("parsePositiveNumber", () => {
  it("returns the fallback when unset", () => {
    expect(parsePositiveNumber(undefined, 7, "TEST_VAR")).toBe(7);
    expect(parsePositiveNumber("", 7, "TEST_VAR")).toBe(7);
  });

  it("parses a valid positive number", () => {
    expect(parsePositiveNumber("0.05", 1, "TEST_VAR")).toBe(0.05);
  });

  it("throws instead of silently producing NaN for a malformed value", () => {
    expect(() => parsePositiveNumber("not-a-number", 1, "TEST_VAR")).toThrow(/TEST_VAR/);
  });

  it("throws for a zero or negative value", () => {
    expect(() => parsePositiveNumber("0", 1, "TEST_VAR")).toThrow(/TEST_VAR/);
    expect(() => parsePositiveNumber("-5", 1, "TEST_VAR")).toThrow(/TEST_VAR/);
  });
});

describe("createDreamDexExchange", () => {
  it("throws when withSigner is requested but no privateKey is configured", () => {
    const config = loadDreamDexConfig({} as unknown as NodeJS.ProcessEnv);
    expect(() => createDreamDexExchange(config, { withSigner: true })).toThrow(/BOT_OPERATOR_PRIVATE_KEY/);
  });
});

describe("resolveSomniaChain", () => {
  it("resolves the real Somnia testnet chain (with multicall3) for chain id 50312", () => {
    const config = loadDreamDexConfig({ NEXT_PUBLIC_SOMNIA_CHAIN_ID: "50312" } as unknown as NodeJS.ProcessEnv);
    const chain = resolveSomniaChain(config);
    expect(chain.id).toBe(50312);
    expect(chain.contracts?.multicall3).toBeDefined();
  });

  it("falls back to a minimal chain definition for an unrecognized chain id", () => {
    const config = loadDreamDexConfig({
      NEXT_PUBLIC_SOMNIA_CHAIN_ID: "999999",
      NEXT_PUBLIC_SOMNIA_RPC_URL: "https://example.invalid",
    } as unknown as NodeJS.ProcessEnv);
    const chain = resolveSomniaChain(config);
    expect(chain.id).toBe(999999);
    expect(chain.rpcUrls.default.http[0]).toBe("https://example.invalid");
  });
});
