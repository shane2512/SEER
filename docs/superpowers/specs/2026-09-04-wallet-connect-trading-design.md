# SEER: Wallet-Connect Trading & Live Venue Discovery — Design

Date: 2026-09-04
Status: Approved by user, pending implementation plan

## Problem

SEER's trading path currently signs every order with a single server-held
`BOT_OPERATOR_PRIVATE_KEY` — a wallet the developer seeds with testnet STT
and tUSDC. That works for one person testing locally, but it does not work
as a public demo: every visitor would be trading out of the same wallet,
and there is no way for someone else to fund or control their own trades.
Separately, `DREAMDEX_VENUE_ID` is a fixed value baked into `.env.local`,
requiring a developer to manually run `ec:doctor`, copy a venue id, and
restart the server whenever the active venue moves — an operation an
ordinary visitor cannot do at all.

This design replaces the seeded-wallet trading path with a per-visitor
wallet-connect flow (the visitor's own browser wallet signs every order),
and replaces the fixed `.env` venue with a live, user-selectable venue list
computed from the same market discovery call SEER already makes.

## Goals

- Any visitor can connect their own wallet (MetaMask or another injected
  provider) and place real trades signed by their own key — SEER's server
  never sees or holds a trading private key.
- Guardrail validation (CLAUDE.md's "Trading Guardrails") stays
  server-side and authoritative; only signing/submission moves to the
  browser.
- Venue selection becomes a live, discovered, user-facing choice instead
  of a static env value.
- A visitor who lacks testnet funds is told how to get STT (external
  faucet link) and can mint tUSDC themselves, in-app, using their own gas.
- A `/history` page shows a connected wallet's real on-chain
  positions/orders/fills via the DreamDEX indexer — no local state, no
  database.
- The old seeded-wallet path (`BOT_OPERATOR_PRIVATE_KEY`,
  `requireOperatorConfig`) is fully retired, not kept as a fallback.

## Non-goals

- Multi-wallet-provider support beyond the browser's injected provider
  (no WalletConnect, no Coinbase Wallet SDK, etc. — out of scope for this
  pass; wagmi's connector model leaves room to add these later without a
  rework).
- Any change to the read-only market-evaluation path
  (`/api/evaluate`, the decision engine) — untouched by this design.
- A persistent trade-history database. History is always a live read
  from the indexer for the connected address.

## Architecture

```
Wallet connect (wagmi + injected connector, Somnia Shannon only, chain id 50312)
        |
Browser holds: connected address + a viem WalletClient (from wagmi)
        |
Browser builds a read/write SomniaMarkets exchange bound to that walletClient
        |
+----------------- Market browsing (mostly unchanged) -----------------+
| GET /api/markets       -> live discovery + distinct venueIds (new)    |
| UI: venue selector (new) -> ?venueId= filters the next /api/markets   |
| POST /api/evaluate     -> unchanged, still server-side, no signer     |
+------------------------------------------------------------------------+
        | (user clicks Execute)
POST /api/trade/validate  -- same guardrail logic (lib/bot/permissions.ts,
                              unchanged), no signer, returns
                              {ok:true} or {ok:false, reason}
        | ok
Browser calls submitTrade(browserExchange, view, tradeRequest)
  -- the EXISTING lib/bot/execution.ts function, unchanged; only its
     caller moves from the API route into browser code
        |
Wallet extension prompts the user to sign -> SDK awaits the receipt
        |
TradeState -> submitted/confirmed with a real txHash (same shape as today)

+----------------- Funding helpers (new) -----------------+
| On wallet connect: read STT balance (viem public client)  |
| and tUSDC balance (client.getErc20Balance). If either is  |
| below a safe threshold, show a "Fund your wallet" card:   |
|   STT   -> link to Google Cloud's Somnia Shannon faucet   |
|            (https://cloud.google.com/application/web3/    |
|             faucet/somnia/shannon)                        |
|   tUSDC -> "Mint TestUSDC" button -> browserExchange       |
|            .trader.faucet() signed by the user's own       |
|            wallet, paid with their own STT                |
+-------------------------------------------------------------+

+----------------- /history page (new) -----------------+
| client.getPortfolio(connectedAddress) -- real           |
| positions/open orders/recent fills, no local state       |
+-----------------------------------------------------------+
```

Nothing privileged moves to the server, and nothing secret moves to the
browser: wagmi's `walletClient` only ever asks the extension to sign,
exactly like any other dApp. The server keeps sole ownership of the
guardrail rules; it just stops being the party that signs.

## Components

### Wallet connection

- **`lib/wallet/wagmiConfig.ts`** — a wagmi `createConfig` scoped to a
  single chain: Somnia Shannon (id 50312), sourced from
  `@somnia-chain/markets-sdk/chains`'s `somniaShannon` rather than
  hand-defined, so it stays in sync with the SDK's own chain metadata.
  One connector: `injected()`. Transport: `http(NEXT_PUBLIC_SOMNIA_RPC_URL)`.
- **`app/providers.tsx`** — a client component wrapping the app tree in
  `WagmiProvider` + `QueryClientProvider` (wagmi's required peer),
  mounted once in `app/layout.tsx`.
- **`hooks/useWallet.ts`** — wraps wagmi's `useAccount`/`useConnect`/
  `useDisconnect`/`useSwitchChain` into the shape SEER's components need:
  `{ address, isConnected, isWrongNetwork, connect, disconnect, switchToSomnia }`.
  `isWrongNetwork` is true whenever a connected wallet's `chainId` isn't
  50312; the dashboard prompts a switch (via `switchToSomnia`) rather than
  silently allowing actions against the wrong network.
- **`components/wallet/ConnectWalletButton.tsx`** — shows "Connect
  Wallet" when disconnected; once connected, shows a truncated address and
  a network badge (flagging wrong-network state visually, not just via a
  toast).

### Browser-side exchange construction

- **`lib/dreamdex/browserClient.ts`** — a sibling to the existing
  `lib/dreamdex/client.ts`, NOT a modification of it. Server-only
  concerns (`BOT_OPERATOR_PRIVATE_KEY`, `normalizePrivateKey`,
  `requireOperatorConfig`) never belonged in a browser bundle, so keeping
  this as a separate file avoids ever importing a private-key-adjacent
  module client-side. It exports `createBrowserDreamDexExchange(walletClient)`,
  which builds a `SomniaMarketsConfig` from `NEXT_PUBLIC_*` env only
  (`NEXT_PUBLIC_SOMNIA_CHAIN_ID`, `NEXT_PUBLIC_SOMNIA_RPC_URL`,
  `NEXT_PUBLIC_SOMNIA_WS_RPC_URL`, `NEXT_PUBLIC_DREAMDEX_INDEXER_URL`),
  passes `SOMNIA_TESTNET_ADDRESSES`/`SOMNIA_TESTNET_PRICE_FEED` (public
  constants, safe to bundle — the exact fix already applied server-side
  for the same `NotConfiguredError` class of bug), and sets
  `walletClient` instead of `privateKey`.

### Venue discovery

- **`lib/dreamdex/markets.ts`** — `activeMarkets()` gains an explicit
  `opts.venueId` override, checked before `ctx.config.venueId` (env stays
  as a fallback default for scripts like `ec-doctor.ts`, but the live app
  path always passes the request's own venue choice). New export
  `discoverVenues(markets: UnifiedMarket[]): string[]` returns the sorted,
  de-duplicated venue ids present in a discovered market list.
- **`app/api/markets/route.ts`** — accepts `?venueId=`, forwards it to
  `activeMarkets`, and includes `venueIds: string[]` (from
  `discoverVenues` run over the *unfiltered* discovery result, so the
  selector always lists every venue, not just the currently-filtered one)
  in its JSON response alongside the existing `markets` array.
- **`components/markets/VenueSelector.tsx`** — renders the venue ids from
  `/api/markets`'s response as pills/a dropdown; selecting one re-fetches
  `/api/markets?venueId=...`. No selection means "all venues" (today's
  effective default when `DREAMDEX_VENUE_ID` is unset).

### Trade validation & execution split

- **`app/api/trade/validate/route.ts`** (replaces `app/api/trade/route.ts`)
  — mirrors `/api/evaluate`'s shape: loads a read-only exchange (no
  signer), resolves the market, calls the *unchanged*
  `validateTrade()` from `lib/bot/permissions.ts`, and returns
  `{ ok: true }` or `{ ok: false, reason }`. It never calls `submitTrade`
  and never touches a private key.
- **`hooks/useTrade.ts`** — rewritten to: (1) POST the trade request to
  `/api/trade/validate`; (2) on `ok`, build a browser exchange via
  `createBrowserDreamDexExchange(walletClient)` (the wagmi-provided
  client for the connected account); (3) call the *unchanged*
  `submitTrade(browserExchange, view, tradeRequest)` from
  `lib/bot/execution.ts` directly in the browser. The `TradeState`
  machine (`idle → validating → submitting → submitted/confirmed/failed`)
  keeps its existing shape — `validating` now covers the server
  round-trip, `submitting` covers the wallet-signature prompt and receipt
  wait.
- **`lib/bot/context.ts`** — `requireOperatorConfig()` is deleted (no
  code path signs server-side anymore). `loadRiskLimits()` is kept
  unchanged and is now called from the validate route instead of the old
  trade route.

### Funding helpers

- **`hooks/useBalances.ts`** — once a wallet is connected, reads native
  STT via a viem public client's `getBalance` and tUSDC via
  `exchange.client.getErc20Balance(SOMNIA_TESTNET_ADDRESSES.collateral, address)`
  (the exact call verified live during this session's debugging).
  Exposes `{ stt, tUsdc, sttLow, tUsdcLow, refetch }`. Thresholds: `sttLow`
  when balance is under a small safety margin above the SDK's default
  gas ceiling cost (empirically ~0.6 STT during this session's live
  debugging — the constant should be named and commented with that
  provenance, not left as a bare magic number); `tUsdcLow` when the raw
  balance, converted via the token's own decimals (from
  `client.getErc20Metadata`, not assumed), is below a `NEXT_PUBLIC_MAX_ORDER_SIZE`
  value mirroring the server's `MAX_ORDER_SIZE` guardrail constant — a
  *display-only* threshold so the funding card's copy stays in sync with
  the real limit; `/api/trade/validate` remains the sole authority on
  whether a trade is actually allowed, so this duplication can never
  become a trust boundary.
- **`components/wallet/FundingCard.tsx`** — rendered only when `sttLow`
  or `tUsdcLow` is true. STT row links out to
  `https://cloud.google.com/application/web3/faucet/somnia/shannon`.
  tUSDC row is a "Mint TestUSDC" button that calls
  `browserExchange.trader.faucet()` — signed and paid for by the
  connected wallet itself, identical to the manual script used earlier
  in this session to confirm the call works.

### History page

- **`app/history/page.tsx`** — requires a connected wallet (redirects/
  prompts connect otherwise); calls
  `client.getPortfolio(connectedAddress)` through the same browser
  exchange used for trading, and renders positions, open orders, and
  recent fills. Layout is a plain functional table for the first pass —
  the Stitch "SEER // Trade History" screen (project id
  `1897895306545728849`, screen id `39dca78c061848b58314a2292cd29296`)
  should be pulled in to restyle this once the Stitch MCP connection is
  working again; that MCP failed to connect (`CONNECTION_CLOSED`) at
  design time and its assets are not part of this plan.

## Error handling

- `/api/trade/validate` failures return the existing `422`
  (guardrail-failed) / `502` (unexpected) shape — unchanged from today.
- A browser-side `submitTrade` failure (wallet rejection, RPC error,
  insufficient balance) surfaces through the same `TradeState: failed`
  branch the UI already renders; the message shown is whatever the SDK
  raises, same as the current behavior.
- A wrong-network wallet is blocked from executing (button disabled,
  "Switch to Somnia Shannon" prompt shown) rather than allowed to attempt
  a trade that would fail downstream.
- If `getErc20Balance`/`getBalance` themselves fail (RPC hiccup), the
  funding card is simply not shown rather than shown with a broken
  number — a transient read failure must never block trading outright.

## Environment variables

Removed: `BOT_OPERATOR_PRIVATE_KEY`, `DREAMDEX_VENUE_ID` (venue is now
runtime UI state, not env, though `ec-doctor.ts` can keep reading a
now-optional env override for its own manual/CLI use).

Renamed (both were already public endpoint URLs, just missing the
browser-visible prefix): `SOMNIA_WS_RPC_URL` →
`NEXT_PUBLIC_SOMNIA_WS_RPC_URL`; `DREAMDEX_INDEXER_URL` →
`NEXT_PUBLIC_DREAMDEX_INDEXER_URL`.

Unchanged: `NEXT_PUBLIC_SOMNIA_CHAIN_ID`, `NEXT_PUBLIC_SOMNIA_RPC_URL`,
`MAX_ORDER_SIZE`, `MAX_PRICE_DEVIATION` (still server-only guardrail
config — `MAX_ORDER_SIZE` is what `/api/trade/validate` actually
enforces).

Added: `NEXT_PUBLIC_MAX_ORDER_SIZE` — a browser-visible mirror of
`MAX_ORDER_SIZE`, used only to size the `tUsdcLow` display threshold in
`useBalances`. Display-only; never a substitute for the server-side
check.

## Testing

- Unit: `discoverVenues`, `activeMarkets`'s `opts.venueId` override,
  `/api/trade/validate` (same coverage `lib/bot/permissions.ts` already
  has via its existing tests, re-pointed at the new route).
- New surface: `useTrade`/`useBalances` need wagmi's hooks mocked
  (vitest + jsdom, already configured) to test the
  validate-then-browser-submit sequencing and low-balance-driven
  `FundingCard` visibility without a real wallet.
- Genuinely untestable by unit tests: real wallet signing. The
  acceptance test stays manual, same as today's verification — connect a
  real browser wallet on Shannon testnet and complete one real trade,
  now through the wallet-connect flow instead of the seeded key.

## Documentation follow-up

`CLAUDE.md` §9 ("Session/operator key architecture") describes an
owner/operator/session-key model that no longer matches reality once
this ships — there is no server-held signer on the trade path at all.
This needs a rewrite as part of implementation, called out explicitly
here rather than edited silently mid-design.

## Out of scope for this spec (explicitly deferred)

- Restyling `/dashboard` and `/history` to match the Stitch "Bento
  Dashboard" / "Trade History" screens — blocked on the Stitch MCP
  connection; will be a follow-up pass once that's reachable.
- Any non-injected wallet connector (WalletConnect, etc.).
