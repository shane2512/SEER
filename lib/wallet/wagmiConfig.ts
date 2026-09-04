// lib/wallet/wagmiConfig.ts
//
// Single-chain wagmi config: Somnia Shannon testnet only (CLAUDE.md's
// non-negotiable "Somnia Testnet only" constraint). somniaShannon is
// imported from the SDK's own /chains export rather than hand-defined, so
// chain id, RPC URLs, and explorer metadata always match what the rest of
// SEER already resolves via getSomniaChain(50312).
import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";

export const wagmiConfig = createConfig({
  chains: [somniaShannon],
  connectors: [injected()],
  transports: {
    [somniaShannon.id]: http(
      process.env.NEXT_PUBLIC_SOMNIA_RPC_URL ?? somniaShannon.rpcUrls.default.http[0],
    ),
  },
});
