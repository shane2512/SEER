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
  // Without this, a previously-connected wallet's persisted state (read
  // from localStorage) can already be resolved by the time the client's
  // first render happens, while the server render — which never has
  // access to that storage — always renders disconnected. That mismatch
  // is exactly what produced a live hydration error on the dashboard
  // header (ConnectWalletButton rendering a <button> on the server and a
  // connected-state <div> on the client). ssr:true makes wagmi report a
  // deterministic disconnected-like state on both the server render and
  // the client's first paint, then reconcile from storage after mount —
  // the same fix class as Reveal.tsx's SSR guard, but built into wagmi
  // itself (verified against the installed @wagmi/core's own
  // CreateConfigParameters type rather than assumed).
  ssr: true,
  transports: {
    [somniaShannon.id]: http(
      process.env.NEXT_PUBLIC_SOMNIA_RPC_URL ?? somniaShannon.rpcUrls.default.http[0],
    ),
  },
});
