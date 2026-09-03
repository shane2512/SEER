# SEER — Technical Design Spec

**Date:** 2026-09-03
**Scope:** Architectural — new project, full-stack build
**Feeds:** superpowers:writing-plans → implementation plan

See [`PRD.md`](../../../PRD.md) for product scope and rationale. This document is
the engineering design: modules, types, data flow, error handling, and testing.

---

## 1. Repository layout

```
seer/
├── app/
│   ├── api/
│   │   ├── markets/route.ts        # GET  -> normalized live markets
│   │   ├── evaluate/route.ts       # POST { marketId } -> Decision
│   │   ├── trade/route.ts          # POST { marketId, side, size } -> TradeResult
│   │   └── trade/status/route.ts   # GET  ?txHash= -> TradeState
│   ├── dashboard/page.tsx
│   ├── layout.tsx, page.tsx, globals.css
├── components/
│   ├── dashboard/ (MarketCard, SignalCard, ReasoningFeed, TradePanel, PositionCard, PnLCard)
│   ├── markets/   (MarketList, EventHeader, Countdown)
│   └── ui/        (Button, Card, Badge, Status)
├── hooks/ (useMarkets, useMarket, useEvaluation, useTrade, useTradeStatus)
├── lib/
│   ├── dreamdex/
│   │   ├── client.ts        # createExchange() wrapper around SomniaMarkets
│   │   ├── markets.ts       # activeMarkets, marketOnchain, snapshot, outcomeSymbols
│   │   ├── event-contracts.ts # normalizeMarket() -> app-facing MarketView type
│   │   └── orderbook.ts     # fetchOrderBook wrapper, spread/imbalance calc
│   ├── bot/
│   │   ├── context.ts       # operator EcContext (ctx.owner set), owner-only setup helper
│   │   ├── execution.ts     # placeLimit-derived submit(), assertTxOk, quantize
│   │   └── permissions.ts   # validateTrade() — every guardrail in one place
│   ├── seer/
│   │   ├── evaluator.ts     # estimateUp model, SpotHistory, referenceReader (adapted)
│   │   ├── decision.ts      # tilt -> Decision mapping, rationale template
│   │   └── validation.ts    # input normalization / zod schemas for API routes
│   ├── blockchain/
│   │   ├── client.ts        # viem public client, tx receipt polling
│   │   └── transactions.ts  # TradeState machine helpers
│   └── utils/ (formatting.ts, errors.ts)
├── scripts/
│   ├── doctor.ts            # RPC + wallet connectivity check (adapted from kit)
│   ├── ec-doctor.ts         # venue/market discovery check (adapted from kit)
│   └── operator-setup.ts    # one-time owner-key grant script (adapted from kit)
├── __tests__/ (evaluator, validation, decision, trade-state)
├── .env.example, .env.local (gitignored)
├── package.json, tsconfig.json, next.config.ts, tailwind.config.ts
```

This matches README.md's existing project structure section exactly, with
`scripts/operator-setup.ts` added per the owner/operator decision.

## 2. Domain types (strict TypeScript, no `any`)

```ts
// lib/dreamdex/event-contracts.ts
type EventSide = "YES" | "NO";

type MarketStatus = "Listed" | "Trading" | "Locked" | "Settling" | "Resolved" | "Voided";

type MarketView = {
  marketId: `0x${string}`;
  symbol: string;
  asset: "BTC" | "ETH";
  referenceKind: "strike" | "opening";
  referencePrice: number;          // same units as spot
  expiryMs: number;
  status: MarketStatus;
  yesBid: number | null;
  yesAsk: number | null;
  yesMid: number | null;
  spread: number | null;
};

// lib/seer/decision.ts
type Decision = {
  marketId: string;
  direction: "BULLISH" | "BEARISH" | "NEUTRAL";
  confidence: number;              // 0..1
  rationale: string;
  timestamp: number;
};

// lib/blockchain/transactions.ts
type TradeState =
  | { status: "idle" }
  | { status: "validating"; requestId: string }
  | { status: "submitting"; requestId: string }
  | { status: "submitted"; txHash: string }
  | { status: "confirmed"; txHash: string; filled: number; price: number }
  | { status: "failed"; error: string };
```

## 3. Data flow

```
GET /api/markets
  -> lib/dreamdex/markets.activeMarkets(ctx, { scope: VENUE_ID })
  -> per market: marketOnchain() [authoritative status] + snapshot() [YES book]
  -> event-contracts.normalizeMarket() -> MarketView[]

POST /api/evaluate { marketId }
  -> re-resolve MarketView (fresh onchain snapshot)
  -> seer/evaluator: spot via SDK price feed, referenceReader, SpotHistory.momentum
  -> estimateUp() -> { pUp, tilt, anchored }
  -> seer/decision.toDecision(tilt, confidence-scale) -> Decision (pure, deterministic)

POST /api/trade { marketId, side, size }
  -> lib/bot/permissions.validateTrade() [FR-07 checklist — reject fast on any failure]
  -> lib/bot/execution.submit() -> quantize + tick/lot-safe placeLimit (type: "ioc")
  -> assertTxOk(receipt) -> TradeState "submitted" -> poll receipt -> "confirmed" | "failed"

GET /api/trade/status?txHash=
  -> lib/blockchain/client poll -> TradeState
```

The evaluator never imports from `lib/bot/`; execution never imports from
`lib/seer/`. The API route layer is the only place that sequences
evaluate → validate → execute, matching CLAUDE.md §11's required pipeline
(`Input → Evaluation → Decision → Risk validation → Trade request → Bot Kit`) and
explicitly forbidding a direct evaluation → execution path.

## 4. Error handling

- API routes: zod-validate input, catch expected errors (market not tradable,
  expired, invalid side/size), return structured `{ error: string }` JSON with an
  appropriate status code, never a raw stack trace or secret.
- Blockchain writes: always `assertTxOk` — a DreamDEX revert does not throw by
  default, so an unchecked write "succeeds" silently.
- Market/network errors surface as explicit UI states (loading, empty, error,
  retry) per REQUIREMENTS.md §8, never a blank screen.
- Every guardrail rejection in `permissions.ts` returns a specific reason string
  (not a generic "invalid trade") so the UI and logs both explain *why*.

## 5. Logging (per CLAUDE.md §13 / REQUIREMENTS.md NFR-04)

`[MARKET] BTC event loaded`, `[SIGNAL] BULLISH confidence=0.82`,
`[TRADE] validation passed`, `[TRADE] order submitted`, `[TRADE] tx=0x...`,
`[TRADE] confirmed`. Never log `BOT_OPERATOR_PRIVATE_KEY`, `BOT_OWNER_ADDRESS`'s
key material, or any raw signing credential.

## 6. Testing strategy

Vitest (matches the Bot Kit's own tooling and REQUIREMENTS.md §15's "focus on the
critical path"):

- `evaluator.test.ts` — `estimateUp` strike/momentum math against known inputs
  (ported test cases from the kit's own model, plus SEER-specific tilt→direction
  mapping and deadzone boundaries).
- `validation.test.ts` — every FR-07 guardrail, including boundary cases (exactly
  at expiry headroom, exactly at max size).
- `decision.test.ts` — determinism: same `ModelInput` twice → identical `Decision`.
- `trade-state.test.ts` — every legal `TradeState` transition, and that illegal
  transitions are rejected.
- `event-contracts.test.ts` — `normalizeMarket()` against fixture on-chain/indexer
  rows, including the `strike = 0` (up/down) case.

Integration: `scripts/doctor.ts` and `scripts/ec-doctor.ts` (adapted from the kit)
run against real Somnia Shannon RPC + the live venue — these are the "small
number of deterministic integration checks" CLAUDE.md §15 asks for, run manually
before a demo rather than in CI (they need a funded testnet wallet).

## 7. Environment

```env
NEXT_PUBLIC_SOMNIA_CHAIN_ID=50312
NEXT_PUBLIC_SOMNIA_RPC_URL=https://api.infra.testnet.somnia.network

DREAMDEX_VENUE_ID=            # read off a live market row at setup time — moves over time
DREAMDEX_INDEXER_URL=https://dev.smk.somnia.host/v1/graphql

BOT_OWNER_ADDRESS=            # fund key's address only — never the owner private key
BOT_OPERATOR_PRIVATE_KEY=     # server-only, hot key, place/cancel only
```

The owner private key is never stored in `.env.local` for the running app — it is
used once, interactively, to run `scripts/operator-setup.ts`, and then set aside.

## 8. Spec self-review

- **Placeholders:** none — every section above maps to a verified file/function in
  the real Bot Kit source (cited in PRD.md §4) or an explicit SEER-authored module.
- **Internal consistency:** decision engine and execution are checked against each
  other for the "never LLM → direct transaction" rule (CLAUDE.md §11) — confirmed
  no path skips risk validation.
- **Scope:** single cohesive project, one implementation plan; no decomposition
  needed.
- **Ambiguity resolved:** IOC order type chosen explicitly for the demo path
  (crosses immediately for a visible confirmation) over resting `post-only`
  (`docs/event-contracts.md` sharp edge #4 — the choice must be deliberate).
