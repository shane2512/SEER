import { describe, expect, it } from "vitest";
import { loadDreamDexConfig, createDreamDexExchange } from "@/lib/dreamdex/client";

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
});

describe("createDreamDexExchange", () => {
  it("throws when withSigner is requested but no privateKey is configured", () => {
    const config = loadDreamDexConfig({} as unknown as NodeJS.ProcessEnv);
    expect(() => createDreamDexExchange(config, { withSigner: true })).toThrow(/BOT_OPERATOR_PRIVATE_KEY/);
  });
});
