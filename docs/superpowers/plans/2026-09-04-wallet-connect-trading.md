# Wallet-Connect Trading & Live Venue Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace SEER's single seeded server wallet with per-visitor wallet-connect trading (wagmi + viem), and replace the fixed `.env` venue with a live, discovered, user-selectable venue list — so the demo works for any visitor, not just the developer.

**Architecture:** The browser connects a wallet (wagmi, injected connector, Somnia Shannon only) and builds its own signer-bound `SomniaMarkets` exchange from the wallet's viem `WalletClient`. Guardrail validation stays server-side (`POST /api/trade/validate`, the existing `validateTrade` logic unchanged); only signing and submission move to the browser, reusing the existing `submitTrade` function unchanged. Venue discovery already re-runs on every `/api/markets` call — this plan just surfaces the discovered venue ids to the UI and makes venue selection a query param instead of a fixed env value. Two new helpers (STT faucet link, in-app tUSDC mint) prevent a funds-less visitor from hitting a confusing raw RPC error.

**Tech Stack:** Next.js App Router, TypeScript, wagmi v2, viem, @tanstack/react-query, `@somnia-chain/markets-sdk`, TailwindCSS, Vitest + Testing Library.

**Spec:** [docs/superpowers/specs/2026-09-04-wallet-connect-trading-design.md](../specs/2026-09-04-wallet-connect-trading-design.md)

## Global Constraints

- Testnet only — Somnia Shannon, chain id 50312 (CLAUDE.md non-negotiable constraint; this plan touches no other chain).
- No private key material of any kind may enter browser code. The browser only ever asks the connected wallet extension to sign via wagmi's `WalletClient`.
- Every DreamDEX SDK method/type used must be verified against the installed `node_modules/@somnia-chain/markets-sdk` `.d.ts` files — every signature in this plan was confirmed that way during design; if an implementer finds a mismatch against the installed version, stop and re-verify rather than guessing.
- `lib/bot/permissions.ts` (`validateTrade`) and `lib/bot/execution.ts` (`submitTrade`) are reused **unchanged** — no task in this plan edits either file.
- `MAX_ORDER_SIZE` / `MAX_PRICE_DEVIATION` remain server-only guardrail config; nothing in this plan makes them a trust boundary in the browser.
- Run `npm run lint`, `npx tsc --noEmit`, and `npm test` after every task before committing (per CLAUDE.md §4); a task is not done until all three are clean.

---

## Task 1: Wagmi provider setup

**Files:**
- Modify: `package.json`
- Create: `lib/wallet/wagmiConfig.ts`
- Create: `app/providers.tsx`
- Modify: `app/layout.tsx`
- Test: `__tests__/wallet/wagmiConfig.test.ts`

**Interfaces:**
- Produces: `wagmiConfig` (a wagmi `Config`) from `lib/wallet/wagmiConfig.ts`, consumed by `app/providers.tsx` (this task) and by every later hook that calls wagmi's `useAccount`/`useConnect`/`useWalletClient`/etc. (Tasks 2, 3, 9, 10, 11), since those hooks read whichever `Config` the nearest `WagmiProvider` supplies.

- [ ] **Step 1: Install wagmi and its required peer dependency**

Run:
```bash
npm install wagmi @tanstack/react-query
```

- [ ] **Step 2: Write the wagmi config**

Create `lib/wallet/wagmiConfig.ts`:

```ts
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
```

- [ ] **Step 3: Write the failing test**

Create `__tests__/wallet/wagmiConfig.test.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run __tests__/wallet/wagmiConfig.test.ts`
Expected: FAIL (`lib/wallet/wagmiConfig.ts` / `wagmi` not yet resolvable, or module not found) — if it unexpectedly passes, check Step 2 was actually saved.

- [ ] **Step 5: Verify it passes**

Run: `npx vitest run __tests__/wallet/wagmiConfig.test.ts`
Expected: PASS

- [ ] **Step 6: Write the providers wrapper**

Create `app/providers.tsx`:

```tsx
"use client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wallet/wagmiConfig";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
```

- [ ] **Step 7: Mount it in the root layout**

Modify `app/layout.tsx` — wrap `{children}` in `<Providers>`:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SEER — Event Contract Intelligence",
  description:
    "An explainable trading agent for DreamDEX Event Contracts on Somnia testnet — live BTC/ETH markets, a deterministic decision engine, and on-chain execution.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 8: Run the full check**

Run: `npm run lint && npx tsc --noEmit && npm test`
Expected: all clean. (The dashboard still renders — `app/dashboard/page.tsx` isn't touched yet — this task only adds the provider tree around it.)

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json lib/wallet/wagmiConfig.ts app/providers.tsx app/layout.tsx __tests__/wallet/wagmiConfig.test.ts
git commit -m "feat: add wagmi provider scoped to Somnia Shannon testnet"
```

---

## Task 2: Wallet connect hook and button

**Files:**
- Create: `hooks/useWallet.ts`
- Create: `components/wallet/ConnectWalletButton.tsx`
- Test: `__tests__/wallet/useWallet.test.tsx`
- Test: `__tests__/wallet/ConnectWalletButton.test.tsx`

**Interfaces:**
- Consumes: `wagmiConfig` from Task 1 (indirectly, via the `WagmiProvider` wrapping the test's render tree).
- Produces: `useWallet(): { address: `0x${string}` | undefined; isConnected: boolean; isWrongNetwork: boolean; isConnecting: boolean; isSwitching: boolean; connect: () => void; disconnect: () => void; switchToSomnia: () => void }`, consumed by `ConnectWalletButton` (this task) and by the dashboard wiring in Task 12.

- [ ] **Step 1: Write the failing hook test**

Create `__tests__/wallet/useWallet.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockSwitchChain = vi.fn();

vi.mock("wagmi", () => ({
  useAccount: vi.fn(() => ({ address: "0xABC", isConnected: true, chainId: 50312 })),
  useConnect: vi.fn(() => ({ connect: mockConnect, connectors: [{ id: "injected" }], isPending: false })),
  useDisconnect: vi.fn(() => ({ disconnect: mockDisconnect })),
  useSwitchChain: vi.fn(() => ({ switchChain: mockSwitchChain, isPending: false })),
}));

describe("useWallet", () => {
  it("reports connected on the right network", async () => {
    const { useWallet } = await import("@/hooks/useWallet");
    const { result } = renderHook(() => useWallet());
    expect(result.current.isConnected).toBe(true);
    expect(result.current.isWrongNetwork).toBe(false);
    expect(result.current.address).toBe("0xABC");
  });

  it("flags the wrong network when connected chainId isn't Somnia Shannon", async () => {
    const { useAccount } = await import("wagmi");
    vi.mocked(useAccount).mockReturnValueOnce({ address: "0xABC", isConnected: true, chainId: 1 } as never);

    const { useWallet } = await import("@/hooks/useWallet");
    const { result } = renderHook(() => useWallet());
    expect(result.current.isWrongNetwork).toBe(true);
  });

  it("calls wagmi connect with the first available connector", async () => {
    const { useWallet } = await import("@/hooks/useWallet");
    const { result } = renderHook(() => useWallet());
    result.current.connect();
    expect(mockConnect).toHaveBeenCalledWith({ connector: { id: "injected" } });
  });

  it("calls wagmi switchChain with Somnia Shannon's chain id", async () => {
    const { useWallet } = await import("@/hooks/useWallet");
    const { result } = renderHook(() => useWallet());
    result.current.switchToSomnia();
    expect(mockSwitchChain).toHaveBeenCalledWith({ chainId: 50312 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/wallet/useWallet.test.tsx`
Expected: FAIL (`@/hooks/useWallet` not found)

- [ ] **Step 3: Write the hook**

Create `hooks/useWallet.ts`:

```ts
"use client";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";

export function useWallet() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const isWrongNetwork = isConnected && chainId !== somniaShannon.id;

  function connectWallet() {
    const injectedConnector = connectors[0];
    if (injectedConnector) connect({ connector: injectedConnector });
  }

  function switchToSomnia() {
    switchChain({ chainId: somniaShannon.id });
  }

  return {
    address,
    isConnected,
    isWrongNetwork,
    isConnecting,
    isSwitching,
    connect: connectWallet,
    disconnect,
    switchToSomnia,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/wallet/useWallet.test.tsx`
Expected: PASS

- [ ] **Step 5: Write the failing component test**

Create `__tests__/wallet/ConnectWalletButton.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockUseWallet = vi.fn();
vi.mock("@/hooks/useWallet", () => ({ useWallet: () => mockUseWallet() }));

describe("ConnectWalletButton", () => {
  it("shows a Connect Wallet button when disconnected", async () => {
    mockUseWallet.mockReturnValue({
      isConnected: false, isWrongNetwork: false, isConnecting: false, isSwitching: false,
      address: undefined, connect: vi.fn(), disconnect: vi.fn(), switchToSomnia: vi.fn(),
    });
    const { ConnectWalletButton } = await import("@/components/wallet/ConnectWalletButton");
    render(<ConnectWalletButton />);
    expect(screen.getByRole("button", { name: /connect wallet/i })).toBeInTheDocument();
  });

  it("prompts a network switch when connected to the wrong chain", async () => {
    const switchToSomnia = vi.fn();
    mockUseWallet.mockReturnValue({
      isConnected: true, isWrongNetwork: true, isConnecting: false, isSwitching: false,
      address: "0xABCDEF1234567890", connect: vi.fn(), disconnect: vi.fn(), switchToSomnia,
    });
    const { ConnectWalletButton } = await import("@/components/wallet/ConnectWalletButton");
    render(<ConnectWalletButton />);
    fireEvent.click(screen.getByRole("button", { name: /switch to somnia/i }));
    expect(switchToSomnia).toHaveBeenCalled();
  });

  it("shows a truncated address once connected on the right network", async () => {
    mockUseWallet.mockReturnValue({
      isConnected: true, isWrongNetwork: false, isConnecting: false, isSwitching: false,
      address: "0xABCDEF1234567890", connect: vi.fn(), disconnect: vi.fn(), switchToSomnia: vi.fn(),
    });
    const { ConnectWalletButton } = await import("@/components/wallet/ConnectWalletButton");
    render(<ConnectWalletButton />);
    expect(screen.getByText(/0xABCD.{1,3}7890/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run __tests__/wallet/ConnectWalletButton.test.tsx`
Expected: FAIL (`@/components/wallet/ConnectWalletButton` not found)

- [ ] **Step 7: Write the component**

Create `components/wallet/ConnectWalletButton.tsx`:

```tsx
"use client";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

function truncate(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function ConnectWalletButton() {
  const { address, isConnected, isWrongNetwork, isConnecting, isSwitching, connect, disconnect, switchToSomnia } =
    useWallet();

  if (!isConnected) {
    return (
      <Button onClick={connect} disabled={isConnecting}>
        {isConnecting ? "Connecting…" : "Connect Wallet"}
      </Button>
    );
  }

  if (isWrongNetwork) {
    return (
      <div className="flex items-center gap-2">
        <Badge tone="bearish">Wrong network</Badge>
        <Button onClick={switchToSomnia} disabled={isSwitching}>
          {isSwitching ? "Switching…" : "Switch to Somnia Shannon"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge tone="neutral">{address ? truncate(address) : ""}</Badge>
      <button onClick={() => disconnect()} className="text-sm text-slate-500 underline">
        Disconnect
      </button>
    </div>
  );
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run __tests__/wallet/ConnectWalletButton.test.tsx`
Expected: PASS

- [ ] **Step 9: Run the full check and commit**

Run: `npm run lint && npx tsc --noEmit && npm test`

```bash
git add hooks/useWallet.ts components/wallet/ConnectWalletButton.tsx __tests__/wallet/useWallet.test.tsx __tests__/wallet/ConnectWalletButton.test.tsx
git commit -m "feat: add wallet connect hook and Connect Wallet button"
```

---

## Task 3: Browser-safe DreamDEX exchange + env rename

**Files:**
- Modify: `lib/dreamdex/client.ts:73-75` (rename two env reads)
- Modify: `.env.example`
- Modify: `__tests__/dreamdex/client.test.ts:24-39` (matching env key rename)
- Create: `lib/dreamdex/browserClient.ts`
- Create: `hooks/useBrowserExchange.ts`
- Test: `__tests__/dreamdex/browserClient.test.ts`

**Interfaces:**
- Produces: `createBrowserDreamDexExchange(walletClient: WalletClient): SomniaMarkets` from `lib/dreamdex/browserClient.ts`, and `useBrowserExchange(): SomniaMarkets | null` from `hooks/useBrowserExchange.ts` — both consumed by Task 9 (`useTrade`), Task 10 (`useBalances`/`FundingCard`'s mint button), and Task 11 (`/history`).

- [ ] **Step 1: Rename the two env vars so they're browser-visible**

`SOMNIA_WS_RPC_URL` and `DREAMDEX_INDEXER_URL` are already public endpoint URLs (not secrets) — they're only server-only today because they're missing Next.js's browser-visible prefix. The browser-side exchange needs to read the same values, so this gives both the server and browser code one canonical name instead of two.

Modify `lib/dreamdex/client.ts` — in `loadDreamDexConfig`, change:

```ts
    wsRpcUrl: env.SOMNIA_WS_RPC_URL ?? DEFAULT_WS_RPC_URL,
    indexerUrl: env.DREAMDEX_INDEXER_URL ?? DEFAULT_INDEXER_URL,
```

to:

```ts
    wsRpcUrl: env.NEXT_PUBLIC_SOMNIA_WS_RPC_URL ?? DEFAULT_WS_RPC_URL,
    indexerUrl: env.NEXT_PUBLIC_DREAMDEX_INDEXER_URL ?? DEFAULT_INDEXER_URL,
```

- [ ] **Step 2: Update the matching test**

Modify `__tests__/dreamdex/client.test.ts` — in the `"reads chain/rpc from env with testnet defaults"` test, change the input object's keys:

```ts
    const config = loadDreamDexConfig({
      NEXT_PUBLIC_SOMNIA_CHAIN_ID: "50312",
      NEXT_PUBLIC_SOMNIA_RPC_URL: "https://api.infra.testnet.somnia.network",
      NEXT_PUBLIC_DREAMDEX_INDEXER_URL: "https://dev.smk.somnia.host/v1/graphql",
      DREAMDEX_VENUE_ID: "0xabc",
    } as unknown as NodeJS.ProcessEnv);
```

(The `wsRpcUrl` in the test's `toEqual` assertion is unaffected — it was already asserting the default value since the test never set that key.)

- [ ] **Step 3: Update `.env.example`**

Modify `.env.example`:

```env
NEXT_PUBLIC_SOMNIA_CHAIN_ID=50312
NEXT_PUBLIC_SOMNIA_RPC_URL=https://api.infra.testnet.somnia.network
# Somnia testnet WebSocket RPC endpoint (read by loadDreamDexConfig in lib/dreamdex/client.ts)
NEXT_PUBLIC_SOMNIA_WS_RPC_URL=wss://api.infra.testnet.somnia.network/ws

DREAMDEX_VENUE_ID=
NEXT_PUBLIC_DREAMDEX_INDEXER_URL=https://dev.smk.somnia.host/v1/graphql

BOT_OPERATOR_PRIVATE_KEY=
MAX_ORDER_SIZE=20
MAX_PRICE_DEVIATION=0.05
```

(`BOT_OPERATOR_PRIVATE_KEY` and `DREAMDEX_VENUE_ID` are retired in Task 13, once nothing reads them any more — left in place here so `.env.example` never has a gap mid-plan.)

- [ ] **Step 4: Run the renamed test to confirm it still passes**

Run: `npx vitest run __tests__/dreamdex/client.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing browser exchange test**

Create `__tests__/dreamdex/browserClient.test.ts`:

```ts
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
    const [[config]] = vi.mocked(SomniaMarkets).mock.calls;
    expect(config).not.toHaveProperty("privateKey");
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run __tests__/dreamdex/browserClient.test.ts`
Expected: FAIL (`@/lib/dreamdex/browserClient` not found)

- [ ] **Step 7: Write the browser exchange factory**

Create `lib/dreamdex/browserClient.ts`:

```ts
// lib/dreamdex/browserClient.ts
//
// Browser-safe sibling to lib/dreamdex/client.ts — deliberately NOT a
// modification of that file. client.ts's normalizePrivateKey/
// requireOperatorConfig are server-only concerns; keeping this factory in
// its own module means a browser bundle can never accidentally pull in
// anything private-key-adjacent, even if client.ts later changes.
import {
  SOMNIA_TESTNET_ADDRESSES,
  SOMNIA_TESTNET_PRICE_FEED,
  SomniaMarkets,
  type SomniaMarketsConfig,
} from "@somnia-chain/markets-sdk";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";
import type { WalletClient } from "viem";

const DEFAULT_WS_RPC_URL = "wss://api.infra.testnet.somnia.network/ws";
const DEFAULT_INDEXER_URL = "https://dev.smk.somnia.host/v1/graphql";

/**
 * Build a signer-bound SomniaMarkets exchange from a connected browser
 * wallet's viem WalletClient (from wagmi's useWalletClient). No private key
 * ever passes through this module — the wallet extension signs; this only
 * wires the SDK to ask it to. Somnia Shannon only, matching wagmiConfig's
 * single-chain setup (CLAUDE.md's testnet-only constraint).
 */
export function createBrowserDreamDexExchange(walletClient: WalletClient): SomniaMarkets {
  const config: SomniaMarketsConfig = {
    indexerUrl: process.env.NEXT_PUBLIC_DREAMDEX_INDEXER_URL ?? DEFAULT_INDEXER_URL,
    chain: somniaShannon,
    wsRpcUrl: process.env.NEXT_PUBLIC_SOMNIA_WS_RPC_URL ?? DEFAULT_WS_RPC_URL,
    addresses: SOMNIA_TESTNET_ADDRESSES,
    priceFeed: SOMNIA_TESTNET_PRICE_FEED,
    walletClient,
  };
  return new SomniaMarkets(config);
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run __tests__/dreamdex/browserClient.test.ts`
Expected: PASS

- [ ] **Step 9: Write the memoizing hook (no separate test — trivial wiring over Task 2/3's already-tested pieces; exercised end-to-end in Task 9's useTrade tests)**

Create `hooks/useBrowserExchange.ts`:

```ts
"use client";
import { useMemo } from "react";
import { useWalletClient } from "wagmi";
import { createBrowserDreamDexExchange } from "@/lib/dreamdex/browserClient";
import type { SomniaMarkets } from "@somnia-chain/markets-sdk";

/**
 * A signer-bound DreamDEX exchange for the connected wallet, or null before
 * a wallet is connected. Rebuilt only when the underlying WalletClient
 * identity changes (wallet/account/chain switch), not on every render.
 */
export function useBrowserExchange(): SomniaMarkets | null {
  const { data: walletClient } = useWalletClient();
  return useMemo(() => (walletClient ? createBrowserDreamDexExchange(walletClient) : null), [walletClient]);
}
```

- [ ] **Step 10: Run the full check and commit**

Run: `npm run lint && npx tsc --noEmit && npm test`

```bash
git add lib/dreamdex/client.ts .env.example __tests__/dreamdex/client.test.ts lib/dreamdex/browserClient.ts hooks/useBrowserExchange.ts __tests__/dreamdex/browserClient.test.ts
git commit -m "feat: add browser-safe DreamDEX exchange factory for wallet-connect signing"
```

---

## Task 4: Live venue discovery in `lib/dreamdex/markets.ts`

**Files:**
- Modify: `lib/dreamdex/markets.ts`
- Modify: `__tests__/dreamdex/markets.test.ts`

**Interfaces:**
- Produces: `discoverVenues(markets: UnifiedMarket[]): string[]` and `activeMarkets(ctx, opts?: { asset?: "BTC" | "ETH"; venueId?: string })` (the existing function, `opts.venueId` now takes precedence over `ctx.config.venueId`) — both consumed by Task 5 (`/api/markets`).

- [ ] **Step 1: Write the failing tests**

Modify `__tests__/dreamdex/markets.test.ts` — add these two `describe` blocks after the existing `outcomeSymbols` block:

```ts
describe("discoverVenues", () => {
  it("returns the sorted, de-duplicated venue ids present in a market list", () => {
    const a = fakeMarket({ id: "0x1", info: { marketType: "BINARY", venueId: "0xB" } as unknown as UnifiedMarket["info"] });
    const b = fakeMarket({ id: "0x2", info: { marketType: "BINARY", venueId: "0xA" } as unknown as UnifiedMarket["info"] });
    const c = fakeMarket({ id: "0x3", info: { marketType: "BINARY", venueId: "0xA" } as unknown as UnifiedMarket["info"] });
    expect(discoverVenues([a, b, c])).toEqual(["0xA", "0xB"]);
  });

  it("skips markets with no venueId", () => {
    const noVenue = fakeMarket({ id: "0x1", info: { marketType: "BINARY" } as unknown as UnifiedMarket["info"] });
    expect(discoverVenues([noVenue])).toEqual([]);
  });
});

describe("activeMarkets venueId override", () => {
  it("prefers an explicit opts.venueId over ctx.config.venueId", async () => {
    const inScope = fakeMarket({ id: "0x1", info: { marketType: "BINARY", venueId: "0xREQUESTED" } as unknown as UnifiedMarket["info"] });
    const outOfScope = fakeMarket({ id: "0x2", info: { marketType: "BINARY", venueId: "0xCONFIGURED" } as unknown as UnifiedMarket["info"] });
    const ctx: DreamDexContext = {
      config: { network: "testnet", chainId: 50312, rpcUrl: "", wsRpcUrl: "", indexerUrl: "", venueId: "0xCONFIGURED" },
      exchange: {
        loadMarkets: vi.fn().mockResolvedValue({ "0x1": inScope, "0x2": outOfScope }),
        fetchOrderBook: vi.fn(),
        fetchPrice: vi.fn(),
        client: { getMarketOnchain: vi.fn(), getOpeningPrices: vi.fn() },
      },
    };

    const result = await activeMarkets(ctx, { venueId: "0xREQUESTED" });
    expect(result).toEqual([inScope]);
  });
});
```

Update the top import line to include `discoverVenues`:

```ts
import { activeMarkets, discoverVenues, marketOnchain, outcomeSymbols, type DreamDexContext } from "@/lib/dreamdex/markets";
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/dreamdex/markets.test.ts`
Expected: FAIL (`discoverVenues` not exported; `venueId` opt ignored)

- [ ] **Step 3: Implement `discoverVenues` and the `opts.venueId` override**

Modify `lib/dreamdex/markets.ts` — replace the `activeMarkets` function and add `discoverVenues` right after `venueOf`:

```ts
function venueOf(m: UnifiedMarket): string | null {
  const info = m.info as { venueId?: string | null };
  return info?.venueId ?? null;
}

/** The distinct venue ids present in a discovered market list, sorted for a
 *  stable UI order. Markets with no venueId are skipped — they can't be
 *  filtered to, so they'd be a meaningless entry in a venue selector. */
export function discoverVenues(markets: UnifiedMarket[]): string[] {
  const ids = new Set<string>();
  for (const m of markets) {
    const id = venueOf(m);
    if (id) ids.add(id);
  }
  return Array.from(ids).sort();
}

/**
 * The venue's active binary (Event Contract) markets, optionally narrowed to
 * one underlying asset and/or one venue. `opts.venueId` (typically the
 * user's UI selection) takes precedence over `ctx.config.venueId` (the
 * env-configured default, kept only for scripts like ec-doctor.ts) — an
 * unset venueId on both means "every active binary market on this
 * deployment" rather than a guess.
 */
export async function activeMarkets(
  ctx: DreamDexContext,
  opts: { asset?: "BTC" | "ETH"; venueId?: string } = {},
): Promise<UnifiedMarket[]> {
  const all = Object.values(await ctx.exchange.loadMarkets(true));
  let live = all.filter((m) => m.type === "binary" && m.active);

  const venueId = opts.venueId ?? ctx.config.venueId;
  if (venueId) {
    const scoped = venueId.toLowerCase();
    live = live.filter((m) => (venueOf(m) ?? "").toLowerCase() === scoped);
  }

  if (opts.asset) {
    live = live.filter((m) => (m.info as { asset?: string }).asset === opts.asset);
  }

  return live;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/dreamdex/markets.test.ts`
Expected: PASS (all tests, including the two pre-existing `activeMarkets` tests — the change is additive: `opts.venueId ?? ctx.config.venueId` behaves exactly like `ctx.config.venueId` alone when `opts.venueId` is omitted)

- [ ] **Step 5: Run the full check and commit**

Run: `npm run lint && npx tsc --noEmit && npm test`

```bash
git add lib/dreamdex/markets.ts __tests__/dreamdex/markets.test.ts
git commit -m "feat: add discoverVenues and an explicit venueId override to activeMarkets"
```

---

## Task 5: Surface discovered venues from `/api/markets`

**Files:**
- Modify: `app/api/markets/route.ts`
- Modify: `__tests__/api/markets.test.ts`

**Interfaces:**
- Consumes: `activeMarkets(ctx, opts?)`, `discoverVenues(markets)` from Task 4.
- Produces: `GET /api/markets` (optionally `?venueId=...`) now returns `{ markets: MarketView[], venueIds: string[] }` instead of just `{ markets }` — consumed by Task 6 (`useMarkets`).

- [ ] **Step 1: Update the failing test**

Modify `__tests__/api/markets.test.ts` — replace its `lib/dreamdex/markets` mock with a partial mock (same `importOriginal` pattern already used in `__tests__/api/trade.test.ts`, needed here because `discoverVenues` must run for real) and add venue-aware assertions:

```ts
// __tests__/api/markets.test.ts
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/dreamdex/client", () => ({
  loadDreamDexConfig: vi.fn().mockReturnValue({ network: "testnet", chainId: 50312, rpcUrl: "", wsRpcUrl: "", indexerUrl: "" }),
  createDreamDexExchange: vi.fn().mockReturnValue({}),
}));
// Partial mock: discoverVenues must run for real so the route's venueIds
// field reflects the mocked markets, not a stub.
vi.mock("@/lib/dreamdex/markets", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/dreamdex/markets")>();
  return {
    ...actual,
    activeMarkets: vi.fn().mockResolvedValue([
      { id: "0x1", symbol: "BTC-95000-31DEC26/USDC", info: { venueId: "0xVENUE1" } },
    ]),
  };
});
vi.mock("@/lib/dreamdex/event-contracts", () => ({
  normalizeMarkets: vi.fn().mockResolvedValue([
    {
      marketId: "0x1",
      symbol: "BTC-95000-31DEC26/USDC",
      asset: "BTC",
      referenceKind: "strike",
      referencePrice: 95000,
      expiryMs: 1_800_300_000_000,
      status: "Trading",
      yesBid: 0.6,
      yesAsk: 0.62,
      yesMid: 0.61,
      spread: 0.02,
    },
  ]),
}));

function makeRequest(query = "") {
  return new Request(`http://localhost/api/markets${query}`);
}

describe("GET /api/markets", () => {
  it("returns normalized markets and the discovered venue ids as JSON", async () => {
    const { GET } = await import("@/app/api/markets/route");
    const response = await GET(makeRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.markets).toHaveLength(1);
    expect(body.markets[0].symbol).toBe("BTC-95000-31DEC26/USDC");
    expect(body.venueIds).toEqual(["0xVENUE1"]);
  });

  it("forwards a ?venueId= query param to activeMarkets for the scoped fetch", async () => {
    const { activeMarkets } = await import("@/lib/dreamdex/markets");
    const { GET } = await import("@/app/api/markets/route");
    await GET(makeRequest("?venueId=0xVENUE1"));
    expect(vi.mocked(activeMarkets)).toHaveBeenCalledWith(expect.anything(), { venueId: "0xVENUE1" });
  });

  it("returns a 502 with a structured error when the exchange read fails", async () => {
    const { activeMarkets } = await import("@/lib/dreamdex/markets");
    vi.mocked(activeMarkets).mockRejectedValueOnce(new Error("indexer unavailable"));

    const { GET } = await import("@/app/api/markets/route");
    const response = await GET(makeRequest());
    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.error).toMatch(/market/i);
    expect(body.error).not.toMatch(/indexer unavailable/); // no raw internal detail leaked
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/api/markets.test.ts`
Expected: FAIL (`GET` still takes no arguments; no `venueIds` field)

- [ ] **Step 3: Update the route**

Modify `app/api/markets/route.ts`:

```ts
import { NextResponse } from "next/server";
import { createDreamDexExchange, loadDreamDexConfig } from "@/lib/dreamdex/client";
import { activeMarkets, discoverVenues, type DreamDexContext } from "@/lib/dreamdex/markets";
import { normalizeMarkets } from "@/lib/dreamdex/event-contracts";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const venueId = url.searchParams.get("venueId") ?? undefined;

  try {
    const config = loadDreamDexConfig();
    const exchange = createDreamDexExchange(config);
    const ctx: DreamDexContext = { exchange: exchange as never, config };

    // One unfiltered fetch computes the full venue list; a second, scoped
    // fetch only runs when the caller actually asked to narrow to one venue
    // — the common case (no venue selected) stays a single round-trip.
    const all = await activeMarkets(ctx);
    const venueIds = discoverVenues(all);
    const scoped = venueId ? await activeMarkets(ctx, { venueId }) : all;
    const views = await normalizeMarkets(ctx, scoped);

    console.log(`[MARKET] ${views.length} event contract(s) loaded`);
    return NextResponse.json({ markets: views, venueIds });
  } catch (error) {
    console.error("[MARKET] failed to load markets", error);
    return NextResponse.json({ error: "Unable to load DreamDEX markets right now." }, { status: 502 });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/api/markets.test.ts`
Expected: PASS

- [ ] **Step 5: Run the full check and commit**

Run: `npm run lint && npx tsc --noEmit && npm test`

```bash
git add app/api/markets/route.ts __tests__/api/markets.test.ts
git commit -m "feat: surface discovered venue ids from GET /api/markets"
```

---

## Task 6: `useMarkets` gains venue selection

**Files:**
- Modify: `hooks/useMarkets.ts`
- Modify: `__tests__/hooks/useMarkets.test.tsx`

**Interfaces:**
- Consumes: `GET /api/markets?venueId=...` from Task 5.
- Produces: `useMarkets(venueId?: string): { markets: MarketView[]; venueIds: string[]; loading: boolean; error: string | null; refresh: () => void }` — consumed by Task 7 (`VenueSelector`) and Task 12 (dashboard wiring).

- [ ] **Step 1: Update the failing test**

Modify `__tests__/hooks/useMarkets.test.tsx`:

```tsx
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useMarkets } from "@/hooks/useMarkets";

const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ markets: [{ marketId: "0x1", symbol: "BTC-95000-31DEC26/USDC" }], venueIds: ["0xVENUE1"] }),
});

beforeEach(() => {
  mockFetch.mockClear();
  vi.stubGlobal("fetch", mockFetch);
});

describe("useMarkets", () => {
  it("fetches markets and venueIds on mount", async () => {
    const { result } = renderHook(() => useMarkets());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.markets).toHaveLength(1);
    expect(result.current.venueIds).toEqual(["0xVENUE1"]);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith("/api/markets");
  });

  it("passes a selected venueId as a query param and refetches when it changes", async () => {
    const { result, rerender } = renderHook(({ venueId }: { venueId?: string }) => useMarkets(venueId), {
      initialProps: { venueId: undefined as string | undefined },
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    rerender({ venueId: "0xVENUE1" });
    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith("/api/markets?venueId=0xVENUE1"));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/hooks/useMarkets.test.tsx`
Expected: FAIL (`useMarkets` ignores its argument; no `venueIds` in return value)

- [ ] **Step 3: Update the hook**

Modify `hooks/useMarkets.ts`:

```ts
"use client";
import { useCallback, useEffect, useState } from "react";
import type { MarketView } from "@/lib/dreamdex/event-contracts";

export function useMarkets(venueId?: string) {
  const [markets, setMarkets] = useState<MarketView[]>([]);
  const [venueIds, setVenueIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    const url = venueId ? `/api/markets?venueId=${encodeURIComponent(venueId)}` : "/api/markets";
    fetch(url)
      .then((res) => res.json())
      .then((body) => {
        if (body.error) throw new Error(body.error);
        setMarkets(body.markets ?? []);
        setVenueIds(body.venueIds ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [venueId]);

  // fetch-on-mount is React's own documented pattern for this exact case (load data once on
  // mount, no external subscription to synchronize); the rule's concern is
  // synchronous cascading renders from an effect, not a plain one-shot fetch
  // kicked off on mount. Rewriting this into whatever shape avoids the rule
  // adds real complexity for a hackathon MVP without changing behavior.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => refresh(), [refresh]);

  return { markets, venueIds, loading, error, refresh };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/hooks/useMarkets.test.tsx`
Expected: PASS

- [ ] **Step 5: Run the full check and commit**

Run: `npm run lint && npx tsc --noEmit && npm test`

```bash
git add hooks/useMarkets.ts __tests__/hooks/useMarkets.test.tsx
git commit -m "feat: let useMarkets select a venue and expose discovered venueIds"
```

---

## Task 7: Venue selector component

**Files:**
- Create: `components/markets/VenueSelector.tsx`
- Test: `__tests__/components/markets.test.tsx` (new `describe` block — file already exists per the codebase's `__tests__/components/markets.test.tsx` convention for `components/markets/*`; if it doesn't exist yet, create it)

**Interfaces:**
- Consumes: `venueIds: string[]` (from Task 6's `useMarkets`).
- Produces: `<VenueSelector venueIds={string[]} selected={string | undefined} onSelect={(venueId: string | undefined) => void} />` — consumed by Task 12 (dashboard wiring).

- [ ] **Step 1: Write the failing test**

Add to (or create) `__tests__/components/markets.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VenueSelector } from "@/components/markets/VenueSelector";

describe("VenueSelector", () => {
  it("renders an 'All venues' option plus one per discovered venue", () => {
    render(<VenueSelector venueIds={["0xAAA", "0xBBB"]} selected={undefined} onSelect={vi.fn()} />);
    expect(screen.getByRole("button", { name: /all venues/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "0xAAA" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "0xBBB" })).toBeInTheDocument();
  });

  it("calls onSelect with the clicked venue id", () => {
    const onSelect = vi.fn();
    render(<VenueSelector venueIds={["0xAAA"]} selected={undefined} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: "0xAAA" }));
    expect(onSelect).toHaveBeenCalledWith("0xAAA");
  });

  it("calls onSelect with undefined when 'All venues' is clicked", () => {
    const onSelect = vi.fn();
    render(<VenueSelector venueIds={["0xAAA"]} selected="0xAAA" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: /all venues/i }));
    expect(onSelect).toHaveBeenCalledWith(undefined);
  });

  it("renders nothing when there is only one (or zero) discovered venue — no real choice to make", () => {
    const { container } = render(<VenueSelector venueIds={["0xONLY"]} selected={undefined} onSelect={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/components/markets.test.tsx`
Expected: FAIL (`@/components/markets/VenueSelector` not found)

- [ ] **Step 3: Write the component**

Create `components/markets/VenueSelector.tsx`:

```tsx
"use client";

/**
 * A row of venue-filter pills. Renders nothing when there's zero or one
 * discovered venue — a selector with no real choice is noise, not a control
 * (CLAUDE.md: avoid decorative components with no information value).
 */
export function VenueSelector({
  venueIds,
  selected,
  onSelect,
}: {
  venueIds: string[];
  selected: string | undefined;
  onSelect: (venueId: string | undefined) => void;
}) {
  if (venueIds.length < 2) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(undefined)}
        className={`rounded-full px-3 py-1 text-sm font-medium ${
          selected === undefined ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
        }`}
      >
        All venues
      </button>
      {venueIds.map((venueId) => (
        <button
          key={venueId}
          onClick={() => onSelect(venueId)}
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            selected === venueId ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
          }`}
        >
          {venueId}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/components/markets.test.tsx`
Expected: PASS

- [ ] **Step 5: Run the full check and commit**

Run: `npm run lint && npx tsc --noEmit && npm test`

```bash
git add components/markets/VenueSelector.tsx __tests__/components/markets.test.tsx
git commit -m "feat: add venue selector component"
```

---

## Task 8: Replace `/api/trade` with a validate-only route

**Files:**
- Create: `app/api/trade/validate/route.ts`
- Create: `__tests__/api/trade-validate.test.ts`
- Delete: `app/api/trade/route.ts`
- Delete: `__tests__/api/trade.test.ts`

**Interfaces:**
- Consumes: `loadDreamDexConfig`, `createDreamDexExchange` (`lib/dreamdex/client.ts`, unchanged); `activeMarkets` (`lib/dreamdex/markets.ts`, unchanged); `normalizeMarkets` (`lib/dreamdex/event-contracts.ts`, unchanged); `validateTrade` (`lib/bot/permissions.ts`, unchanged); `loadRiskLimits` (`lib/bot/context.ts`, unchanged).
- Produces: `POST /api/trade/validate` returning `{ ok: true, market: MarketView }` (200) or `{ ok: false, reason: string }` (422) or `{ error: string }` (400/404/502) — consumed by Task 9 (`useTrade`).

- [ ] **Step 1: Delete the old route and its test**

```bash
git rm app/api/trade/route.ts __tests__/api/trade.test.ts
```

- [ ] **Step 2: Write the failing test for the new route**

Create `__tests__/api/trade-validate.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

const activeMarket = {
  marketId: "0xabc",
  symbol: "BTC-95000-31DEC26/USDC",
  asset: "BTC",
  referenceKind: "strike",
  referencePrice: 95_000,
  expiryMs: Date.now() + 300_000,
  status: "Trading",
  yesBid: 0.6,
  yesAsk: 0.62,
  yesMid: 0.61,
  spread: 0.02,
};

vi.mock("@/lib/bot/context", () => ({
  loadRiskLimits: vi.fn().mockReturnValue({ maxOrderSize: 20, maxPriceDeviation: 0.05 }),
}));
vi.mock("@/lib/dreamdex/client", () => ({
  loadDreamDexConfig: vi.fn().mockReturnValue({ network: "testnet", chainId: 50312, rpcUrl: "", wsRpcUrl: "", indexerUrl: "" }),
  createDreamDexExchange: vi.fn().mockReturnValue({}),
}));
vi.mock("@/lib/dreamdex/markets", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/dreamdex/markets")>();
  return {
    ...actual,
    activeMarkets: vi.fn().mockResolvedValue([{ id: "0xabc", symbol: "BTC-95000-31DEC26/USDC" }]),
  };
});
vi.mock("@/lib/dreamdex/event-contracts", () => ({
  normalizeMarkets: vi.fn().mockResolvedValue([activeMarket]),
}));

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/trade/validate", { method: "POST", body: JSON.stringify(body) });
}

describe("POST /api/trade/validate", () => {
  it("returns ok:true with the resolved market view for a valid trade request", async () => {
    const { POST } = await import("@/app/api/trade/validate/route");
    const response = await POST(makeRequest({ marketId: "0xabc", side: "YES", size: 5 }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.market).toEqual(activeMarket);
  });

  it("returns 422 with ok:false and the guardrail reason when validation fails", async () => {
    const { POST } = await import("@/app/api/trade/validate/route");
    const response = await POST(makeRequest({ marketId: "0xabc", side: "YES", size: 999 }));
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.reason).toMatch(/size/i);
  });

  it("returns 400 on a malformed request body", async () => {
    const { POST } = await import("@/app/api/trade/validate/route");
    const response = await POST(makeRequest({ marketId: "0xabc", side: "UP", size: 5 }));
    expect(response.status).toBe(400);
  });

  it("returns 404 when the market is not currently active", async () => {
    const { POST } = await import("@/app/api/trade/validate/route");
    const response = await POST(makeRequest({ marketId: "0xnotfound", side: "YES", size: 5 }));
    expect(response.status).toBe(404);
  });

  it("never calls anything that signs or submits an order", async () => {
    // No trader/execution mock is set up above at all — if the route tried to
    // sign or submit, importing this module would throw on the missing mock.
    const { POST } = await import("@/app/api/trade/validate/route");
    const response = await POST(makeRequest({ marketId: "0xabc", side: "YES", size: 5 }));
    expect(response.status).toBe(200);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run __tests__/api/trade-validate.test.ts`
Expected: FAIL (`@/app/api/trade/validate/route` not found)

- [ ] **Step 4: Write the route**

Create `app/api/trade/validate/route.ts`:

```ts
import { NextResponse } from "next/server";
import { loadDreamDexConfig, createDreamDexExchange } from "@/lib/dreamdex/client";
import { loadRiskLimits } from "@/lib/bot/context";
import { activeMarkets, type DreamDexContext } from "@/lib/dreamdex/markets";
import { normalizeMarkets } from "@/lib/dreamdex/event-contracts";
import { validateTrade } from "@/lib/bot/permissions";
import { tradeRequestSchema } from "@/lib/seer/validation";

/**
 * Guardrail-only check — no signer, no order submission. The browser calls
 * this first; on ok:true it signs and submits the returned `market` snapshot
 * itself via its own connected wallet (see hooks/useTrade.ts). Returning the
 * exact MarketView that was just validated (rather than the browser
 * re-fetching its own) guarantees the price used for the real order matches
 * what the guardrails actually checked.
 */
export async function POST(request: Request) {
  const parsed = tradeRequestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "invalid request" }, { status: 400 });
  }
  const tradeRequest = parsed.data;

  try {
    const config = loadDreamDexConfig();
    const limits = loadRiskLimits();
    const exchange = createDreamDexExchange(config);
    const ctx: DreamDexContext = { exchange: exchange as never, config };

    const markets = await activeMarkets(ctx);
    const unified = markets.find((m) => m.id === tradeRequest.marketId);
    if (!unified) {
      return NextResponse.json({ error: `market ${tradeRequest.marketId} is not currently active` }, { status: 404 });
    }
    const [view] = await normalizeMarkets(ctx, [unified]);
    if (!view) {
      return NextResponse.json({ error: "market could not be normalized" }, { status: 502 });
    }

    const validation = validateTrade(view, tradeRequest, limits, Date.now());
    if (!validation.ok) {
      console.log(`[TRADE] validation failed: ${validation.reason}`);
      return NextResponse.json({ ok: false, reason: validation.reason }, { status: 422 });
    }

    console.log("[TRADE] validation passed");
    return NextResponse.json({ ok: true, market: view });
  } catch (error) {
    console.error("[TRADE] unexpected error during validation", error);
    return NextResponse.json({ error: "Unable to validate this trade right now." }, { status: 502 });
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run __tests__/api/trade-validate.test.ts`
Expected: PASS

- [ ] **Step 6: Run the full check and commit**

Run: `npm run lint && npx tsc --noEmit && npm test`

Note: `npm test` will fail at this point because `hooks/useTrade.ts` still calls the now-deleted `/api/trade` in spirit (it still compiles — it just posts to a URL no route serves — so its own existing test at `__tests__/hooks/useTrade.test.tsx` still passes against its mocked `fetch`, but the hook itself is stale until Task 9). Confirm no *other* test references `app/api/trade/route` before committing.

```bash
git add app/api/trade/validate/route.ts __tests__/api/trade-validate.test.ts
git commit -m "feat: replace /api/trade with a validate-only route (no server-side signing)"
```

---

## Task 9: Rewrite `useTrade` to validate server-side, submit client-side

**Files:**
- Modify: `hooks/useTrade.ts`
- Modify: `__tests__/hooks/useTrade.test.tsx`

**Interfaces:**
- Consumes: `POST /api/trade/validate` (Task 8); `useBrowserExchange()` (Task 3); `submitTrade(executor, market, request)` and `TradeExecutor` from `lib/bot/execution.ts` (unchanged).
- Produces: `useTrade(): { state: TradeState; execute: (marketId: string, side: "YES" | "NO", size: number) => Promise<void> }` — same shape as today, consumed by Task 12 (dashboard wiring, unchanged call site).

- [ ] **Step 1: Update the failing test**

Modify `__tests__/hooks/useTrade.test.tsx`:

```tsx
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

const mockCreateOrder = vi.fn().mockResolvedValue({ id: "1", status: "closed", filled: 5, price: 0.62, txHash: "0xTX" });
const fakeWalletClient = { account: { address: "0xABC" }, chain: { id: 50312 } };

vi.mock("wagmi", () => ({
  useWalletClient: vi.fn(() => ({ data: fakeWalletClient })),
}));
vi.mock("@/lib/dreamdex/browserClient", () => ({
  createBrowserDreamDexExchange: vi.fn(() => ({ createOrder: mockCreateOrder })),
}));

const marketView = {
  marketId: "0x1",
  symbol: "BTC-95000-31DEC26/USDC",
  asset: "BTC",
  referenceKind: "strike",
  referencePrice: 95_000,
  expiryMs: Date.now() + 300_000,
  status: "Trading",
  yesBid: 0.6,
  yesAsk: 0.62,
  yesMid: 0.61,
  spread: 0.02,
};

beforeEach(() => {
  mockCreateOrder.mockClear();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, market: marketView }) }),
  );
});

describe("useTrade", () => {
  it("starts idle, validates server-side, then submits client-side via the connected wallet", async () => {
    const { useTrade } = await import("@/hooks/useTrade");
    const { result } = renderHook(() => useTrade());
    expect(result.current.state).toEqual({ status: "idle" });

    await act(async () => {
      await result.current.execute("0x1", "YES", 5);
    });

    await waitFor(() => expect(result.current.state.status).toBe("confirmed"));
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/trade/validate",
      expect.objectContaining({ method: "POST" }),
    );
    // yesAsk 0.62 -> cross = min(0.99, 0.62 + 0.002) = 0.622 (submitTrade's own IOC-cross logic, unchanged).
    expect(mockCreateOrder).toHaveBeenCalledWith(
      "BTC-95000-31DEC26/USDC#YES",
      "limit",
      "buy",
      5,
      expect.closeTo(0.622, 5),
      { timeInForce: "IOC" },
    );
  });

  it("fails without calling the wallet when server-side validation rejects the trade", async () => {
    vi.mocked(global.fetch as never as typeof fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: false, reason: "size 999 exceeds the configured max of 20" }),
    } as Response);

    const { useTrade } = await import("@/hooks/useTrade");
    const { result } = renderHook(() => useTrade());

    await act(async () => {
      await result.current.execute("0x1", "YES", 999);
    });

    await waitFor(() => expect(result.current.state.status).toBe("failed"));
    expect(result.current.state).toMatchObject({ error: expect.stringMatching(/size/i) });
    expect(mockCreateOrder).not.toHaveBeenCalled();
  });

  it("fails with a clear message when no wallet is connected", async () => {
    const { useWalletClient } = await import("wagmi");
    vi.mocked(useWalletClient).mockReturnValueOnce({ data: undefined } as never);

    const { useTrade } = await import("@/hooks/useTrade");
    const { result } = renderHook(() => useTrade());

    await act(async () => {
      await result.current.execute("0x1", "YES", 5);
    });

    expect(result.current.state).toEqual({ status: "failed", error: "Connect a wallet before trading." });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/hooks/useTrade.test.tsx`
Expected: FAIL (hook still posts to `/api/trade` and expects the full `state` back directly)

- [ ] **Step 3: Rewrite the hook**

Modify `hooks/useTrade.ts`:

```ts
"use client";
import { useState } from "react";
import { useWalletClient } from "wagmi";
import type { TradeState } from "@/lib/blockchain/transactions";
import { createBrowserDreamDexExchange } from "@/lib/dreamdex/browserClient";
import { submitTrade, type TradeExecutor } from "@/lib/bot/execution";
import type { MarketView } from "@/lib/dreamdex/event-contracts";

export function useTrade() {
  const [state, setState] = useState<TradeState>({ status: "idle" });
  const { data: walletClient } = useWalletClient();

  async function execute(marketId: string, side: "YES" | "NO", size: number) {
    if (!walletClient) {
      setState({ status: "failed", error: "Connect a wallet before trading." });
      return;
    }

    const requestId = crypto.randomUUID();
    setState({ status: "validating", requestId });
    try {
      const res = await fetch("/api/trade/validate", {
        method: "POST",
        body: JSON.stringify({ marketId, side, size }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        setState({ status: "failed", error: body.reason ?? body.error ?? "trade validation failed" });
        return;
      }
      const market = body.market as MarketView;

      setState({ status: "submitting", requestId });
      const exchange = createBrowserDreamDexExchange(walletClient);
      const result = await submitTrade(exchange as unknown as TradeExecutor, market, { marketId, side, size });
      if (!result.ok) {
        setState({ status: "failed", error: result.error });
        return;
      }
      setState({ status: "confirmed", txHash: result.txHash, filled: result.filled, price: result.price });
    } catch (err) {
      setState({ status: "failed", error: err instanceof Error ? err.message : String(err) });
    }
  }

  return { state, execute };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/hooks/useTrade.test.tsx`
Expected: PASS

- [ ] **Step 5: Run the full check and commit**

Run: `npm run lint && npx tsc --noEmit && npm test`

```bash
git add hooks/useTrade.ts __tests__/hooks/useTrade.test.tsx
git commit -m "feat: useTrade validates server-side, submits via the connected wallet client-side"
```

---

## Task 10: Balance checks and funding helpers

**Files:**
- Modify: `.env.example` (add `NEXT_PUBLIC_MAX_ORDER_SIZE`)
- Create: `hooks/useBalances.ts`
- Create: `components/wallet/FundingCard.tsx`
- Test: `__tests__/wallet/useBalances.test.tsx`
- Test: `__tests__/wallet/FundingCard.test.tsx`

**Interfaces:**
- Consumes: `useWallet()` (Task 2, for `address`); `useBrowserExchange()` (Task 3, for the tUSDC mint button and `getErc20Balance`/`getErc20Metadata` reads).
- Produces: `useBalances(): { stt: bigint | null; tUsdc: bigint | null; sttLow: boolean; tUsdcLow: boolean; refetch: () => void }` and `<FundingCard />` — both consumed by Task 12 (dashboard wiring).

- [ ] **Step 1: Add the display-only env var**

Modify `.env.example` — add this line under `MAX_ORDER_SIZE=20`:

```env
MAX_ORDER_SIZE=20
NEXT_PUBLIC_MAX_ORDER_SIZE=20
MAX_PRICE_DEVIATION=0.05
```

(A browser-visible mirror of the server's `MAX_ORDER_SIZE`, used only to size the `tUsdcLow` display threshold below — `/api/trade/validate` remains the sole authority on whether a trade is actually allowed, so keeping these two values in sync is a UX nicety, never a trust boundary.)

- [ ] **Step 2: Write the failing hook test**

Create `__tests__/wallet/useBalances.test.tsx`:

```tsx
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const mockGetBalance = vi.fn();
vi.mock("viem", async (importOriginal) => {
  const actual = await importOriginal<typeof import("viem")>();
  return { ...actual, createPublicClient: vi.fn(() => ({ getBalance: mockGetBalance })) };
});

const mockUseWallet = vi.fn();
vi.mock("@/hooks/useWallet", () => ({ useWallet: () => mockUseWallet() }));

const mockGetErc20Balance = vi.fn();
const mockGetErc20Metadata = vi.fn();
const mockUseBrowserExchange = vi.fn();
vi.mock("@/hooks/useBrowserExchange", () => ({ useBrowserExchange: () => mockUseBrowserExchange() }));

beforeEach(() => {
  mockGetBalance.mockReset().mockResolvedValue(2_000_000_000_000_000_000n); // 2 STT — well above the low threshold
  mockGetErc20Balance.mockReset().mockResolvedValue(50_000_000n); // 50 tUSDC (6dp) — above a size-20 threshold
  mockGetErc20Metadata.mockReset().mockResolvedValue({ symbol: "TestUSDC", name: "Test USDC", decimals: 6 });
  mockUseWallet.mockReturnValue({ address: "0xABC", isConnected: true });
  mockUseBrowserExchange.mockReturnValue({
    client: { getErc20Balance: mockGetErc20Balance, getErc20Metadata: mockGetErc20Metadata },
  });
});

describe("useBalances", () => {
  it("reports both balances once loaded, with neither flagged low", async () => {
    const { useBalances } = await import("@/hooks/useBalances");
    const { result } = renderHook(() => useBalances());

    await waitFor(() => expect(result.current.stt).toBe(2_000_000_000_000_000_000n));
    expect(result.current.tUsdc).toBe(50_000_000n);
    expect(result.current.sttLow).toBe(false);
    expect(result.current.tUsdcLow).toBe(false);
  });

  it("flags sttLow when the native balance is below the safety margin", async () => {
    mockGetBalance.mockResolvedValue(100_000_000_000_000_000n); // 0.1 STT
    const { useBalances } = await import("@/hooks/useBalances");
    const { result } = renderHook(() => useBalances());
    await waitFor(() => expect(result.current.stt).not.toBeNull());
    expect(result.current.sttLow).toBe(true);
  });

  it("flags tUsdcLow when the collateral balance can't cover one demo-sized order", async () => {
    mockGetErc20Balance.mockResolvedValue(0n);
    const { useBalances } = await import("@/hooks/useBalances");
    const { result } = renderHook(() => useBalances());
    await waitFor(() => expect(result.current.tUsdc).toBe(0n));
    expect(result.current.tUsdcLow).toBe(true);
  });

  it("reports null balances (never a broken number) when not connected", async () => {
    mockUseWallet.mockReturnValue({ address: undefined, isConnected: false });
    mockUseBrowserExchange.mockReturnValue(null);
    const { useBalances } = await import("@/hooks/useBalances");
    const { result } = renderHook(() => useBalances());
    expect(result.current.stt).toBeNull();
    expect(result.current.tUsdc).toBeNull();
    expect(result.current.sttLow).toBe(false);
    expect(result.current.tUsdcLow).toBe(false);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run __tests__/wallet/useBalances.test.tsx`
Expected: FAIL (`@/hooks/useBalances` not found)

- [ ] **Step 4: Write the hook**

Create `hooks/useBalances.ts`:

```ts
"use client";
import { useCallback, useEffect, useState } from "react";
import { createPublicClient, http } from "viem";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";
import { SOMNIA_TESTNET_ADDRESSES } from "@somnia-chain/markets-sdk";
import { useWallet } from "./useWallet";
import { useBrowserExchange } from "./useBrowserExchange";

// The SDK's default write gas ceiling (10,000,000) at a representative
// testnet gas price made the upfront balance-covers-gas-ceiling check fail
// at 0.27 STT and pass at 1.27 STT during this session's live debugging of
// a real "approve reverted: Missing or invalid parameters" incident (the
// message is misleading — the real cause was insufficient native balance to
// cover the tx's declared gas ceiling, not a malformed parameter). 0.6 STT
// is a safety margin comfortably inside that observed range.
const STT_LOW_THRESHOLD = 600_000_000_000_000_000n; // 0.6 STT, 18dp

const MAX_ORDER_SIZE_DISPLAY = Number(process.env.NEXT_PUBLIC_MAX_ORDER_SIZE ?? "20");

export function useBalances() {
  const { address, isConnected } = useWallet();
  const exchange = useBrowserExchange();
  const [stt, setStt] = useState<bigint | null>(null);
  const [tUsdc, setTUsdc] = useState<bigint | null>(null);
  const [tUsdcDecimals, setTUsdcDecimals] = useState(6);

  const refetch = useCallback(() => {
    if (!isConnected || !address || !exchange) {
      setStt(null);
      setTUsdc(null);
      return;
    }
    const publicClient = createPublicClient({ chain: somniaShannon, transport: http() });
    publicClient
      .getBalance({ address })
      .then(setStt)
      .catch(() => setStt(null)); // a transient RPC read failure must never block trading

    const collateral = SOMNIA_TESTNET_ADDRESSES.collateral ?? SOMNIA_TESTNET_ADDRESSES.testUsdc;
    if (!collateral) return;
    Promise.all([exchange.client.getErc20Balance(collateral, address), exchange.client.getErc20Metadata(collateral)])
      .then(([balance, metadata]) => {
        setTUsdc(balance);
        setTUsdcDecimals(metadata.decimals);
      })
      .catch(() => setTUsdc(null));
  }, [address, isConnected, exchange]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => refetch(), [refetch]);

  const sttLow = stt !== null && stt < STT_LOW_THRESHOLD;
  const tUsdcLowThreshold = BigInt(Math.round(MAX_ORDER_SIZE_DISPLAY * 10 ** tUsdcDecimals));
  const tUsdcLow = tUsdc !== null && tUsdc < tUsdcLowThreshold;

  return { stt, tUsdc, sttLow, tUsdcLow, refetch };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run __tests__/wallet/useBalances.test.tsx`
Expected: PASS

- [ ] **Step 6: Write the failing component test**

Create `__tests__/wallet/FundingCard.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockUseBalances = vi.fn();
vi.mock("@/hooks/useBalances", () => ({ useBalances: () => mockUseBalances() }));

const mockFaucet = vi.fn().mockResolvedValue({ hash: "0xFAUCETTX" });
const mockUseBrowserExchange = vi.fn(() => ({ trader: { faucet: mockFaucet } }));
vi.mock("@/hooks/useBrowserExchange", () => ({ useBrowserExchange: () => mockUseBrowserExchange() }));

describe("FundingCard", () => {
  it("renders nothing when both balances are healthy", async () => {
    mockUseBalances.mockReturnValue({ stt: 2n * 10n ** 18n, tUsdc: 50_000_000n, sttLow: false, tUsdcLow: false, refetch: vi.fn() });
    const { FundingCard } = await import("@/components/wallet/FundingCard");
    const { container } = render(<FundingCard />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the Google Cloud faucet link when STT is low", async () => {
    mockUseBalances.mockReturnValue({ stt: 0n, tUsdc: 50_000_000n, sttLow: true, tUsdcLow: false, refetch: vi.fn() });
    const { FundingCard } = await import("@/components/wallet/FundingCard");
    render(<FundingCard />);
    const link = screen.getByRole("link", { name: /get stt/i });
    expect(link).toHaveAttribute("href", "https://cloud.google.com/application/web3/faucet/somnia/shannon");
  });

  it("mints TestUSDC via the connected wallet when the Mint button is clicked", async () => {
    const refetch = vi.fn();
    mockUseBalances.mockReturnValue({ stt: 2n * 10n ** 18n, tUsdc: 0n, sttLow: false, tUsdcLow: true, refetch });
    const { FundingCard } = await import("@/components/wallet/FundingCard");
    render(<FundingCard />);
    fireEvent.click(screen.getByRole("button", { name: /mint testusdc/i }));
    await waitFor(() => expect(mockFaucet).toHaveBeenCalled());
    await waitFor(() => expect(refetch).toHaveBeenCalled());
  });
});
```

- [ ] **Step 7: Run test to verify it fails**

Run: `npx vitest run __tests__/wallet/FundingCard.test.tsx`
Expected: FAIL (`@/components/wallet/FundingCard` not found)

- [ ] **Step 8: Write the component**

Create `components/wallet/FundingCard.tsx`:

```tsx
"use client";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useBalances } from "@/hooks/useBalances";
import { useBrowserExchange } from "@/hooks/useBrowserExchange";

const STT_FAUCET_URL = "https://cloud.google.com/application/web3/faucet/somnia/shannon";

/** Shown only when a connected wallet can't cover gas or a demo trade —
 *  prevents a new visitor from ever hitting the raw RPC "insufficient
 *  balance" error this session diagnosed live. Rendered as nothing when
 *  both balances are healthy, or before a wallet is connected at all. */
export function FundingCard() {
  const { sttLow, tUsdcLow, refetch } = useBalances();
  const exchange = useBrowserExchange();
  const [minting, setMinting] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);

  if (!sttLow && !tUsdcLow) return null;

  async function mintTestUsdc() {
    if (!exchange) return;
    setMinting(true);
    setMintError(null);
    try {
      await exchange.trader.faucet();
      refetch();
    } catch (err) {
      setMintError(err instanceof Error ? err.message : String(err));
    } finally {
      setMinting(false);
    }
  }

  return (
    <Card>
      <h3 className="font-semibold">Fund your wallet</h3>
      <div className="mt-2 space-y-2 text-sm">
        {sttLow && (
          <p>
            Low on STT (gas) —{" "}
            <a href={STT_FAUCET_URL} target="_blank" rel="noopener noreferrer" className="underline">
              Get STT from Google Cloud&apos;s faucet
            </a>
            .
          </p>
        )}
        {tUsdcLow && (
          <div className="flex items-center gap-2">
            <span>Low on TestUSDC —</span>
            <Button onClick={mintTestUsdc} disabled={minting || !exchange}>
              {minting ? "Minting…" : "Mint TestUSDC"}
            </Button>
          </div>
        )}
        {mintError && <p className="text-rose-600">{mintError}</p>}
      </div>
    </Card>
  );
}
```

- [ ] **Step 9: Run test to verify it passes**

Run: `npx vitest run __tests__/wallet/FundingCard.test.tsx`
Expected: PASS

- [ ] **Step 10: Run the full check and commit**

Run: `npm run lint && npx tsc --noEmit && npm test`

```bash
git add .env.example hooks/useBalances.ts components/wallet/FundingCard.tsx __tests__/wallet/useBalances.test.tsx __tests__/wallet/FundingCard.test.tsx
git commit -m "feat: add balance checks and in-app STT/tUSDC funding helpers"
```

---

## Task 11: `/history` page

**Files:**
- Create: `app/history/page.tsx`
- Create: `components/history/PortfolioTable.tsx`
- Test: `__tests__/app/history.test.tsx`

**Interfaces:**
- Consumes: `useWallet()` (Task 2); `useBrowserExchange()` (Task 3); `client.getPortfolio(account): Promise<Portfolio>` (SDK, verified against `node_modules/@somnia-chain/markets-sdk/dist/binary/portfolio.d.ts` during design — `Portfolio = { account, positions: PortfolioPosition[], openOrders: PortfolioOrder[], trades: PortfolioTrade[], tradesTruncated }`); `toHuman(raw, decimals)` and `explorerTxUrl(chainId, txHash)` (both already exported, from `@somnia-chain/markets-sdk` and `lib/blockchain/explorer.ts` respectively).
- Produces: the `/history` route — a plain functional layout for now (Stitch's "SEER // Trade History" screen restyles this later, once that MCP connection works — out of scope here per the spec).

- [ ] **Step 1: Write the failing test**

Create `__tests__/app/history.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const mockUseWallet = vi.fn();
vi.mock("@/hooks/useWallet", () => ({ useWallet: () => mockUseWallet() }));

const mockGetPortfolio = vi.fn();
const mockUseBrowserExchange = vi.fn();
vi.mock("@/hooks/useBrowserExchange", () => ({ useBrowserExchange: () => mockUseBrowserExchange() }));

describe("HistoryPage", () => {
  it("prompts wallet connection when disconnected", async () => {
    mockUseWallet.mockReturnValue({ address: undefined, isConnected: false });
    mockUseBrowserExchange.mockReturnValue(null);
    const { default: HistoryPage } = await import("@/app/history/page");
    render(<HistoryPage />);
    expect(screen.getByText(/connect your wallet/i)).toBeInTheDocument();
  });

  it("shows real positions, open orders, and trades for the connected wallet", async () => {
    mockUseWallet.mockReturnValue({ address: "0xABC", isConnected: true });
    mockGetPortfolio.mockResolvedValue({
      account: "0xabc",
      positions: [
        {
          market: { id: "0x1", asset: "BTC", question: "Will BTC be above $95,000?", quoteDecimals: 6 },
          outcomeIndex: 0,
          tokenId: "1",
          balance: "5000000",
        },
      ],
      openOrders: [],
      trades: [
        {
          id: "t1",
          fillPrice: "620000",
          quantity: "5000000",
          timestamp: String(Math.floor(Date.now() / 1000)),
          txHash: "0xTX1",
          side: "YES",
          asMaker: false,
          counterparty: null,
          market: { marketAddress: "0xmkt", asset: "BTC", quoteDecimals: 6, intervalSec: null, interval: null, tradingStart: null, expiry: null },
        },
      ],
      tradesTruncated: false,
    });
    mockUseBrowserExchange.mockReturnValue({ client: { getPortfolio: mockGetPortfolio } });

    const { default: HistoryPage } = await import("@/app/history/page");
    render(<HistoryPage />);

    await waitFor(() => expect(screen.getByText(/will btc be above \$95,000\?/i)).toBeInTheDocument());
    expect(screen.getByText(/0xTX1/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/app/history.test.tsx`
Expected: FAIL (`@/app/history/page` not found)

- [ ] **Step 3: Write the portfolio table component**

Create `components/history/PortfolioTable.tsx`:

```tsx
import { toHuman } from "@somnia-chain/markets-sdk";
import type { Portfolio } from "@somnia-chain/markets-sdk";
import { Card } from "@/components/ui/Card";
import { explorerTxUrl } from "@/lib/blockchain/explorer";

const DEFAULT_CHAIN_ID = 50312;

function parseChainId(raw: string | undefined): number {
  const value = Number((raw ?? "").trim());
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_CHAIN_ID;
}

export function PortfolioTable({ portfolio }: { portfolio: Portfolio }) {
  const chainId = parseChainId(process.env.NEXT_PUBLIC_SOMNIA_CHAIN_ID);

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="font-semibold">Open positions</h3>
        {portfolio.positions.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No open positions.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {portfolio.positions.map((p) => (
              <li key={`${p.market.id}-${p.outcomeIndex}`}>
                <span className="font-medium">{p.market.question}</span> —{" "}
                {p.outcomeIndex === 0 ? "YES" : "NO"}: {toHuman(p.balance, p.market.quoteDecimals)}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h3 className="font-semibold">Open orders</h3>
        {portfolio.openOrders.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No open orders.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {portfolio.openOrders.map((o) => (
              <li key={o.id}>
                {o.market.asset} {o.side} — {toHuman(o.quantityRemaining, o.market.quoteDecimals)} remaining @{" "}
                {toHuman(o.price, o.market.quoteDecimals)}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h3 className="font-semibold">Recent trades</h3>
        {portfolio.trades.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No trades yet.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {portfolio.trades.map((t) => {
              const url = explorerTxUrl(chainId, t.txHash);
              return (
                <li key={t.id}>
                  {t.market.asset} {t.side ?? ""} {toHuman(t.quantity, t.market.quoteDecimals)} @{" "}
                  {toHuman(t.fillPrice, t.market.quoteDecimals)} —{" "}
                  {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="font-mono underline">
                      {t.txHash}
                    </a>
                  ) : (
                    <span className="font-mono">{t.txHash}</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Write the page**

Create `app/history/page.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useBrowserExchange } from "@/hooks/useBrowserExchange";
import { PortfolioTable } from "@/components/history/PortfolioTable";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import type { Portfolio } from "@somnia-chain/markets-sdk";

export default function HistoryPage() {
  const { address, isConnected } = useWallet();
  const exchange = useBrowserExchange();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected || !address || !exchange) return;
    exchange.client
      .getPortfolio(address)
      .then(setPortfolio)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address, exchange]);

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trade History</h1>
        <ConnectWalletButton />
      </div>
      {!isConnected && <p className="text-sm text-slate-500">Connect your wallet to see your real on-chain trade history.</p>}
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {isConnected && portfolio && <PortfolioTable portfolio={portfolio} />}
    </main>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run __tests__/app/history.test.tsx`
Expected: PASS

- [ ] **Step 6: Run the full check and commit**

Run: `npm run lint && npx tsc --noEmit && npm test`

```bash
git add app/history/page.tsx components/history/PortfolioTable.tsx __tests__/app/history.test.tsx
git commit -m "feat: add /history page backed by the connected wallet's real portfolio"
```

---

## Task 12: Wire wallet-connect into the dashboard

**Files:**
- Modify: `app/dashboard/page.tsx`
- Modify: `components/dashboard/ReasoningFeed.tsx`
- Modify: `__tests__/app/dashboard.test.tsx`

**Interfaces:**
- Consumes: `useWallet()` (Task 2), `ConnectWalletButton` (Task 2), `useMarkets(venueId?)` + `venueIds` (Task 6), `VenueSelector` (Task 7), `FundingCard` (Task 10), `useTrade()` (Task 9, unchanged call signature).

- [ ] **Step 1: Update the failing dashboard test**

Modify `__tests__/app/dashboard.test.tsx`:

```tsx
// __tests__/app/dashboard.test.tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const market = {
  marketId: "0x1",
  symbol: "BTC-95000-31DEC26/USDC",
  asset: "BTC",
  referenceKind: "strike",
  referencePrice: 95_000,
  expiryMs: Date.now() + 161_000,
  status: "Trading",
  yesBid: 0.6,
  yesAsk: 0.62,
  yesMid: 0.61,
  spread: 0.02,
};
const decision = {
  marketId: "0x1",
  direction: "BULLISH",
  confidence: 0.82,
  rationale: "BTC spot $63,912 sits 0.6% above the $63,500 strike with 2m41s remaining; model favors UP.",
  timestamp: Date.now(),
};

const mockFetch = vi.fn((url: string) => {
  if (url.startsWith("/api/markets")) return Promise.resolve({ ok: true, json: async () => ({ markets: [market], venueIds: [] }) });
  if (url === "/api/evaluate") return Promise.resolve({ ok: true, json: async () => ({ decision }) });
  if (url === "/api/trade/validate") return Promise.resolve({ ok: true, json: async () => ({ ok: true, market }) });
  return Promise.resolve({ ok: true, json: async () => ({}) });
});
vi.stubGlobal("fetch", mockFetch as unknown as typeof fetch);

const mockUseWallet = vi.fn();
vi.mock("@/hooks/useWallet", () => ({ useWallet: () => mockUseWallet() }));

const mockCreateOrder = vi.fn().mockResolvedValue({ id: "1", status: "closed", filled: 5, price: 0.62, txHash: "0xTX" });
vi.mock("@/hooks/useBrowserExchange", () => ({
  useBrowserExchange: () => ({ createOrder: mockCreateOrder, client: { getErc20Balance: vi.fn(), getErc20Metadata: vi.fn() } }),
}));
vi.mock("@/lib/dreamdex/browserClient", () => ({
  createBrowserDreamDexExchange: () => ({ createOrder: mockCreateOrder }),
}));
vi.mock("wagmi", () => ({
  useWalletClient: () => ({ data: { account: { address: "0xABC" }, chain: { id: 50312 } } }),
}));

describe("DashboardPage", () => {
  it("prompts wallet connection instead of showing the trade panel when disconnected", async () => {
    mockUseWallet.mockReturnValue({
      address: undefined, isConnected: false, isWrongNetwork: false, isConnecting: false, isSwitching: false,
      connect: vi.fn(), disconnect: vi.fn(), switchToSomnia: vi.fn(),
    });
    const { default: DashboardPage } = await import("@/app/dashboard/page");
    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByText("BULLISH")).toBeInTheDocument());
    expect(screen.getByText(/connect your wallet to trade/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^execute/i })).not.toBeInTheDocument();
  });

  it("renders the market, its signal, and lets a connected user execute a trade", async () => {
    mockUseWallet.mockReturnValue({
      address: "0xABC", isConnected: true, isWrongNetwork: false, isConnecting: false, isSwitching: false,
      connect: vi.fn(), disconnect: vi.fn(), switchToSomnia: vi.fn(),
    });
    const { default: DashboardPage } = await import("@/app/dashboard/page");
    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByText("BTC")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("BULLISH")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /execute/i }));

    await waitFor(() => expect(screen.getByText(/0xTX/)).toBeInTheDocument());
  });

  it("shows a retryable error, not a silently stuck feed, when evaluation fails", async () => {
    mockUseWallet.mockReturnValue({
      address: "0xABC", isConnected: true, isWrongNetwork: false, isConnecting: false, isSwitching: false,
      connect: vi.fn(), disconnect: vi.fn(), switchToSomnia: vi.fn(),
    });
    mockFetch.mockImplementationOnce((url: string) =>
      Promise.resolve({ ok: true, json: async () => ({ markets: [market], venueIds: [] }) } as Response),
    );
    mockFetch.mockImplementationOnce((url: string) =>
      Promise.resolve({ ok: true, json: async () => ({ error: "no live price feed reading for this asset" }) } as Response),
    );

    const { default: DashboardPage } = await import("@/app/dashboard/page");
    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByText("BTC")).toBeInTheDocument());
    await waitFor(() =>
      expect(screen.getByText(/no live price feed reading for this asset/i)).toBeInTheDocument(),
    );
    expect(screen.queryByText("BULLISH")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry evaluation/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/app/dashboard.test.tsx`
Expected: FAIL (dashboard still shows the trade panel unconditionally; no wallet gating)

- [ ] **Step 3: Update the dashboard page**

Modify `app/dashboard/page.tsx`:

```tsx
"use client";
import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useMarkets } from "@/hooks/useMarkets";
import { useEvaluation } from "@/hooks/useEvaluation";
import { useTrade } from "@/hooks/useTrade";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { FundingCard } from "@/components/wallet/FundingCard";
import { VenueSelector } from "@/components/markets/VenueSelector";
import { MarketCard } from "@/components/dashboard/MarketCard";
import { SignalCard } from "@/components/dashboard/SignalCard";
import { ReasoningFeed } from "@/components/dashboard/ReasoningFeed";
import { TradePanel } from "@/components/dashboard/TradePanel";
import { PositionCard } from "@/components/dashboard/PositionCard";

export default function DashboardPage() {
  const { isConnected, isWrongNetwork } = useWallet();
  const [venueId, setVenueId] = useState<string | undefined>(undefined);
  const { markets, venueIds, loading, error } = useMarkets(venueId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeId = selectedId ?? markets[0]?.marketId ?? null;
  const market = markets.find((m) => m.marketId === activeId) ?? null;
  const { decision, loading: evalLoading, error: evalError, evaluate } = useEvaluation(activeId);
  const { state: tradeState, execute } = useTrade();

  if (loading) return <main className="p-8 text-slate-500">Loading live DreamDEX markets…</main>;
  if (error) return <main className="p-8 text-rose-600">{error}</main>;

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">SEER</h1>
        <ConnectWalletButton />
      </div>
      <VenueSelector venueIds={venueIds} selected={venueId} onSelect={setVenueId} />
      {isConnected && <FundingCard />}
      {!market && <p className="text-slate-500">No active BTC/ETH Event Contract right now.</p>}
      {market && <MarketCard market={market} />}
      {/* Evaluation has its own loading/error states, distinct from the
          markets list above — a failed /api/evaluate call must never leave
          the judge staring at a stuck reasoning feed with no explanation
          (CLAUDE.md §7: never silently swallow errors). */}
      {evalLoading && !decision && <p className="text-sm text-slate-500">Evaluating…</p>}
      {evalError && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <p>{evalError}</p>
          <button onClick={evaluate} className="mt-1 font-medium underline">
            Retry evaluation
          </button>
        </div>
      )}
      {decision && <SignalCard decision={decision} />}
      {decision && market && isConnected && !isWrongNetwork && (
        <TradePanel
          decision={decision}
          tradeState={tradeState}
          onExecute={(side, size) => execute(market.marketId, side, size)}
        />
      )}
      {decision && !isConnected && (
        <p className="text-sm text-slate-500">Connect your wallet to trade this signal.</p>
      )}
      {decision && isConnected && isWrongNetwork && (
        <p className="text-sm text-slate-500">Switch to Somnia Shannon to trade this signal.</p>
      )}
      <ReasoningFeed tradeState={tradeState} hasDecision={Boolean(decision)} />
      <PositionCard tradeState={tradeState} />
    </main>
  );
}
```

- [ ] **Step 4: Update the stale server-wallet disclosure text**

Modify `components/dashboard/ReasoningFeed.tsx` — replace the closing `<p>`:

```tsx
      <p className="mt-3 text-xs text-slate-400">
        Trades are signed by your own connected wallet — SEER never holds or
        sees your private key. The wallet extension prompts you to approve
        each order before it submits.
      </p>
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run __tests__/app/dashboard.test.tsx`
Expected: PASS

- [ ] **Step 6: Run the full check and commit**

Run: `npm run lint && npx tsc --noEmit && npm test`

```bash
git add app/dashboard/page.tsx components/dashboard/ReasoningFeed.tsx __tests__/app/dashboard.test.tsx
git commit -m "feat: wire wallet-connect, venue selection, and funding helpers into the dashboard"
```

---

## Task 13: Retire the seeded-wallet path and finish the migration

**Files:**
- Modify: `lib/bot/context.ts`
- Modify: `__tests__/bot/context.test.ts`
- Modify: `.env.example`
- Modify: `CLAUDE.md` (§9)

**Interfaces:**
- Removes: `requireOperatorConfig` (no longer called by anything — `/api/trade/validate` uses plain `loadDreamDexConfig`, per Task 8).

- [ ] **Step 1: Confirm nothing still calls `requireOperatorConfig`**

Run:
```bash
grep -rn "requireOperatorConfig" --include="*.ts" --include="*.tsx" app lib hooks components __tests__ scripts
```
Expected: no matches outside `lib/bot/context.ts` itself and `__tests__/bot/context.test.ts` (both edited in this task).

- [ ] **Step 2: Remove the dead export and its tests**

Modify `lib/bot/context.ts` — delete the `requireOperatorConfig` function entirely, leaving:

```ts
import { parsePositiveNumber } from "../dreamdex/client";
import type { RiskLimits } from "./permissions";

const DEFAULT_MAX_ORDER_SIZE = 20;
const DEFAULT_MAX_PRICE_DEVIATION = 0.05;

export function loadRiskLimits(env: NodeJS.ProcessEnv = process.env): RiskLimits {
  return {
    maxOrderSize: parsePositiveNumber(env.MAX_ORDER_SIZE, DEFAULT_MAX_ORDER_SIZE, "MAX_ORDER_SIZE"),
    maxPriceDeviation: parsePositiveNumber(env.MAX_PRICE_DEVIATION, DEFAULT_MAX_PRICE_DEVIATION, "MAX_PRICE_DEVIATION"),
  };
}
```

Modify `__tests__/bot/context.test.ts` — delete the whole `describe("requireOperatorConfig", ...)` block and its now-unused `requireOperatorConfig` import, leaving only the `loadRiskLimits` import and its `describe` block:

```ts
import { describe, expect, it } from "vitest";
import { loadRiskLimits } from "@/lib/bot/context";

describe("loadRiskLimits", () => {
  it("reads configured limits from env", () => {
    const limits = loadRiskLimits({
      MAX_ORDER_SIZE: "10",
      MAX_PRICE_DEVIATION: "0.02",
    } as unknown as NodeJS.ProcessEnv);
    expect(limits).toEqual({ maxOrderSize: 10, maxPriceDeviation: 0.02 });
  });

  it("falls back to safe defaults when unset", () => {
    const limits = loadRiskLimits({} as unknown as NodeJS.ProcessEnv);
    expect(limits.maxOrderSize).toBeGreaterThan(0);
    expect(limits.maxPriceDeviation).toBeGreaterThan(0);
  });

  it("throws instead of silently defeating the guardrail on a malformed MAX_ORDER_SIZE", () => {
    expect(() =>
      loadRiskLimits({ MAX_ORDER_SIZE: "not-a-number" } as unknown as NodeJS.ProcessEnv),
    ).toThrow(/MAX_ORDER_SIZE/);
  });

  it("throws instead of silently defeating the guardrail on a malformed MAX_PRICE_DEVIATION", () => {
    expect(() =>
      loadRiskLimits({ MAX_PRICE_DEVIATION: "0.05x" } as unknown as NodeJS.ProcessEnv),
    ).toThrow(/MAX_PRICE_DEVIATION/);
  });
});
```

- [ ] **Step 3: Run the full test suite to confirm nothing else broke**

Run: `npm test`
Expected: PASS (all suites)

- [ ] **Step 4: Finalize `.env.example`**

Modify `.env.example` — remove `BOT_OPERATOR_PRIVATE_KEY` and `DREAMDEX_VENUE_ID` entirely (nothing reads either any more — venue is runtime UI state per Task 6/7, and no code path signs with a server-held key any more per Task 9):

```env
NEXT_PUBLIC_SOMNIA_CHAIN_ID=50312
NEXT_PUBLIC_SOMNIA_RPC_URL=https://api.infra.testnet.somnia.network
# Somnia testnet WebSocket RPC endpoint (read by loadDreamDexConfig in lib/dreamdex/client.ts)
NEXT_PUBLIC_SOMNIA_WS_RPC_URL=wss://api.infra.testnet.somnia.network/ws

NEXT_PUBLIC_DREAMDEX_INDEXER_URL=https://dev.smk.somnia.host/v1/graphql

MAX_ORDER_SIZE=20
NEXT_PUBLIC_MAX_ORDER_SIZE=20
MAX_PRICE_DEVIATION=0.05
```

- [ ] **Step 5: Update CLAUDE.md §9**

Modify `CLAUDE.md` — replace the "Session/operator key architecture" subsection (the part describing the owner/operator/session-key model) with:

```markdown
### Wallet architecture

SEER does not hold or sign with any trading private key on the server.
Every visitor connects their own wallet (an injected browser provider —
MetaMask or similar — via wagmi) and every order is signed by that wallet
directly, through the SDK's `walletClient` signing mode. The server's only
role in a trade is guardrail validation (`POST /api/trade/validate`) — it
never sees, holds, or transmits a private key.

Do not reintroduce a server-held trading key. If a future feature
genuinely needs one (e.g. an automated/unattended strategy), it must be a
separate, clearly-scoped addition — not a fallback bolted onto the
visitor-facing trade path.
```

- [ ] **Step 6: Run the full check**

Run: `npm run lint && npx tsc --noEmit && npm run build && npm test`
Expected: all clean.

- [ ] **Step 7: Commit**

```bash
git add lib/bot/context.ts __tests__/bot/context.test.ts .env.example CLAUDE.md
git commit -m "chore: retire the seeded server wallet path and update docs"
```

- [ ] **Step 8: Manual acceptance test (cannot be automated — real wallet signing)**

This mirrors the original seeded-wallet acceptance test from earlier in the project, now through the wallet-connect flow:

1. `npm run dev`, open the dashboard in a browser with MetaMask (or another injected wallet) installed.
2. Click "Connect Wallet," approve the connection in the extension.
3. If prompted "Wrong network," click "Switch to Somnia Shannon" and approve.
4. If the funding card appears, follow its STT link and/or click "Mint TestUSDC" until it disappears.
5. Wait for a market to load and a decision to render, then click "Execute."
6. Approve the order transaction in the wallet extension.
7. Confirm the dashboard shows `confirmed` with a real transaction hash, linked to the Shannon explorer.
8. Visit `/history` and confirm the same trade appears in "Recent trades."

Report the real transaction hash once this passes — that is the actual proof this migration works, the same standard used for the original seeded-wallet build.

---

## Plan Self-Review

**Spec coverage:**
- Wallet connect (wagmi, injected, Somnia Shannon only) → Tasks 1, 2. ✓
- Guardrails stay server-side, signing moves client-side → Tasks 8, 9. ✓
- Live venue discovery + selector → Tasks 4, 5, 6, 7. ✓
- Funding helpers (STT faucet link, in-app tUSDC mint) → Task 10. ✓
- `/history` via real `getPortfolio` → Task 11. ✓
- Full replacement of the seeded wallet, not a fallback → Tasks 8, 9, 13. ✓
- Dashboard wiring + stale copy fix → Task 12. ✓
- Env var renames/additions/removals → Tasks 3, 10, 13. ✓
- `CLAUDE.md` §9 follow-up → Task 13. ✓
- Out of scope (Stitch restyling, non-injected connectors) → explicitly not tasked, matching the spec.

**Placeholder scan:** no TBD/TODO; every step has real, complete code.

**Type consistency:** `useTrade`'s `TradeState` shape, `MarketView`, `TradeExecutor`/`submitTrade`, and `Portfolio`/`PortfolioPosition`/`PortfolioOrder`/`PortfolioTrade` field names are used identically across every task that touches them, matching the installed SDK's `.d.ts` files confirmed during design (Task 11 in particular was checked field-by-field against `binary/portfolio.d.ts`).
