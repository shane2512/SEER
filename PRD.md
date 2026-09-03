# SEER — Product Requirements Document

**Status:** Approved for implementation
**Stage:** 5-day hackathon MVP — Somnia × DreamDEX Event Contracts Hackathon
**Author:** Built with Claude Code, in collaboration with the project owner

---

## 1. Product Overview

**SEER** (Structured Event Evaluation & Reasoning) is an explainable trading agent for
**DreamDEX Event Contracts** — binary Up/Down BTC/ETH prediction markets trading on
Somnia's on-chain order book. SEER evaluates a live event, produces a structured,
deterministic decision (direction, confidence, rationale), validates it against hard
risk limits, and executes it through DreamDEX's real **owner/operator (session-key)
Bot Kit model** on **Somnia Shannon testnet**.

The product exists to solve one problem: automated trading bots hide *why* they did
what they did. SEER makes the full pipeline — market → evaluation → decision →
risk check → execution → on-chain confirmation — visible and independently
verifiable by anyone watching.

This PRD reflects the actual, verified DreamDEX Bot Kit implementation
(`somnia-chain/dreamdex-bot-kit` on GitHub, and the published
`@somnia-chain/markets-sdk` npm package), not assumed or invented APIs.

---

## 2. Goals / Non-Goals

### Goals

- One real BTC or ETH DreamDEX Event Contract, evaluated and traded end-to-end on
  Somnia Shannon testnet.
- A judge can independently verify every step: the market, the reasoning, the
  transaction hash, and the resulting position.
- Real owner/operator key separation — the server-side bot key can place and cancel
  orders but can never withdraw funds.
- Deterministic, explainable decisions — same input always yields the same
  direction/confidence/rationale.

### Non-Goals

Explicitly out of scope for the 5-day MVP (per REQUIREMENTS.md §12): multi-chain
support, custom smart contracts, a custom matching engine, production custody, DAO/
tokenomics, mobile apps, complex auth, multi-agent orchestration, autonomous
strategy marketplaces, or a production-grade oracle system. SEER integrates against
DreamDEX's **already-deployed** Event Contracts — it deploys nothing of its own.

---

## 3. Target Users

- **Primary:** a DeFi trader who wants automated Event Contract execution without
  blindly trusting an opaque bot.
- **Secondary:** DeFi researchers, bot developers, prediction-market traders, and
  hackathon judges evaluating DreamDEX integrations.

---

## 4. Verified Technical Foundation

| Component | Source of truth |
|---|---|
| Protocol docs | [docs.dreamdex.io/developers/event-contracts](https://docs.dreamdex.io/developers/event-contracts) |
| Bot Kit reference implementation | [github.com/somnia-chain/dreamdex-bot-kit](https://github.com/somnia-chain/dreamdex-bot-kit) — `docs/event-contracts.md`, `docs/session-keys.md`, `packages/ec-core/`, `strategies/ec-*` |
| Published SDK | [`@somnia-chain/markets-sdk`](https://www.npmjs.com/package/@somnia-chain/markets-sdk) (npm, MIT, v0.29.0 at time of writing) |
| Network | Somnia Shannon testnet, chain id `50312` |
| Faucet | [testnet.somnia.network](https://testnet.somnia.network) |

`@dreamdex-bot-kit/core` and `@dreamdex-bot-kit/ec-core` are **not** published to
npm — they exist only as source inside the Bot Kit monorepo. SEER therefore depends
directly on the real, published `@somnia-chain/markets-sdk`, and adapts (with
attribution, MIT license permits it) the small set of `ec-core` helpers it actually
needs — venue-scoped market discovery, on-chain status gating, tick/lot-safe order
placement, and the strike/momentum evaluation model — rather than reinventing or
guessing at DreamDEX behavior.

Key verified facts that shape this design:

- Event contract markets share the venue's on-chain order book but use a distinct
  SDK surface from spot (`isBinaryMarket`, `BinarySide`, `MarketOnchain`).
- Only on-chain market status `Trading` (1) accepts orders — the indexer lags by
  seconds and must never be treated as authoritative.
- A reverted write does **not** throw by default; every state-changing call must be
  checked with `assertTxOk`.
- Prices must never be handed to the SDK as raw floats on an 18-decimal venue —
  `placeLimit`'s tick/lot integer conversion avoids `InvalidPrice` reverts.
- `VENUE_ID` moves over time and must be read off a live market row, not hardcoded
  from memory.
- The owner/operator split is a real, on-chain-enforced feature
  (`OperatorPermissionsRegistry`), not a convention SEER invents.

---

## 5. Core User Flow

```
Open SEER
  → Live BTC/ETH Event Contract shown, countdown running
  → SEER evaluates it (spot vs. strike/opening, momentum, time-to-expiry)
  → BULLISH / BEARISH / NEUTRAL, with confidence and a one-sentence rationale
  → User clicks Execute
  → Risk engine validates the request
  → Operator key submits the order via the Bot Kit (owner funds, never touched)
  → Transaction hash returned, confirmation polled
  → Position and result displayed
```

Target: understandable within 5 seconds on first paint, full loop demoable in
60–90 seconds.

---

## 6. Functional Requirements

Restated from REQUIREMENTS.md, unchanged in substance, grounded in the verified SDK:

- **FR-01/02** — Somnia Shannon testnet only; DreamDEX integration only, via the
  real Bot Kit/`markets-sdk`, no simulated replacement in the final demo.
- **FR-03/04** — Market UI shows asset, strike or opening reference, expiry,
  status, YES/NO best bid/ask, spread.
- **FR-05/06** — Decision engine emits
  `{ marketId, direction, confidence, rationale, timestamp }`, deterministic given
  the same normalized input, and is architecturally separated from execution.
- **FR-07** — Every trade request is validated: market exists, is `Trading`, has
  not expired (headroom scaled to the market's own interval, not a fixed
  threshold), side valid, size ≤ configured limit, price within bounds, operator
  authorized.

---

## 7. Decision Engine Design

Adapted directly from the Bot Kit's own `ec-oracle-follow` strategy model
(`signal.ts: estimateUp`), which is the only strategy in the kit that produces a
standalone directional fair value rather than just following the book:

1. **Reference resolution** — each market resolves against either a fixed
   `strike` or, for up/down markets (`strike = 0`), its own `opening` price
   (`getOpeningPrices`). Reading `strike = 0` as "no signal" would blind SEER to
   exactly the up/down markets that carry the most liquidity — so both cases are
   handled explicitly.
2. **Spot + momentum** — BTC/ETH spot is read from the SDK's bundled **testnet**
   price feed (`SOMNIA_TESTNET_PRICE_FEED`) and tracked in a rolling window
   (`SpotHistory`) to compute a windowed return.
3. **Model** — `moneyness = (spot - reference) / reference`, drift scaled by
   `sqrt(time-remaining / window)` (diffusive, not linear), mapped through a
   tanh approximation of the normal CDF to a model P(up), clamped to [0.05, 0.95].
4. **Tilt vs. market** — the model's P(up) is compared against the market's own
   implied P(up) (the YES mid). The **signed gap** (`tilt`), not raw P(up), is
   what SEER trades — a market already priced at 0.75 needs a bearish signal to
   read BEARISH even though raw P(up) is still > 0.5.
5. **Mapping to SEER's decision type**:
   - `tilt > deadzone` → `BULLISH` (buy YES)
   - `tilt < -deadzone` → `BEARISH` (buy NO)
   - otherwise → `NEUTRAL` (no trade offered)
   - `confidence = clamp(|tilt| / scale, 0, 1)`
   - `rationale` is a generated sentence citing the live spot price, the
     strike/opening reference, and time remaining — e.g. *"BTC spot $63,912 sits
     0.7% above the $63,500 strike with 2m41s remaining; model favors UP."*

This is a real, deterministic, explainable function of real market data — not an
LLM call, and not invented heuristics.

---

## 8. Execution & Key Architecture

Full owner/operator split, per `docs/session-keys.md`:

- **Owner (fund) key** — cold, used once via an adapted `operator-setup.ts`: sets
  manual vault mode, deposits working capital, grants the operator
  `placeOrderFor`/`cancelOrderFor` on the traded pool. Never touched by the
  running app.
- **Operator (bot) key** — hot, server-side only
  (`BOT_OPERATOR_PRIVATE_KEY`, never `NEXT_PUBLIC_`). Trades on the owner's
  behalf; every fill settles to the **owner's** vault. Authorization is enforced
  on-chain by `OperatorPermissionsRegistry`, so a compromised server cannot drain
  funds — it can only place/cancel within the granted scope.
- Order placement snaps price/size to the venue's tick/lot grid as integers
  (never a raw float, which reverts with `InvalidPrice` on an 18-decimal venue),
  and every write is checked with `assertTxOk` since a revert does not throw by
  default.

---

## 9. Trading Guardrails

Hard limits enforced in `lib/bot/permissions.ts` before every order, per
REQUIREMENTS.md §9 and CLAUDE.md §12:

- `MAX_ORDER_SIZE` — demo-scale share cap.
- `MAX_PRICE_DEVIATION` — reject if requested price is unreasonably far from the
  live book.
- Market must resolve on-chain to status `Trading` (never the indexer's cached
  status).
- Time remaining must exceed the venue's scaled headroom (a fraction of the
  market's own interval, not a fixed threshold — a fixed 300s threshold would
  reject every market on a 5-minute venue).
- Side, quantity, and price must all validate before any signing occurs.
- Operator authorization is a precondition, not an assumption.

---

## 10. UI Requirements

Matches REQUIREMENTS.md UI-01–03 and README.md's existing component structure:
`MarketCard`, `Countdown`, `SignalCard`, `ReasoningFeed`, `TradePanel`,
`PositionCard`/`PnLCard`. The reasoning feed shows the structured pipeline
(`MARKET DETECTED → EVENT ACTIVE → SIGNAL GENERATED → RISK CHECK PASSED → ORDER
SUBMITTED → TRANSACTION CONFIRMED`) — concise, user-facing rationale only, never
framed as private model chain-of-thought.

---

## 11. Success Criteria

SEER is MVP-complete when a fresh developer can, end to end:

```
✓ Somnia Shannon RPC connects
✓ DreamDEX Event Contract markets are discovered dynamically (real VENUE_ID)
✓ A live BTC/ETH market is visible with real order-book data
✓ SEER produces a real evaluation (direction, confidence, rationale)
✓ The risk engine validates the trade against hard limits
✓ The operator key executes via the real Bot Kit path (placeOrderFor)
✓ A transaction hash is returned and confirmed on Somnia Shannon
✓ No private key ever reaches the browser
✓ Lint, typecheck, build, and tests all pass
✓ The demo is reproducible from a clean checkout
```

---

## 12. Out of Scope (5-Day Rule)

Per CLAUDE.md §16 — anything not required for the judge to see a working
end-to-end DreamDEX Event Contract product is deferred: multi-strategy
orchestration, backtesting UI, social/copy-trading features, portfolio
management beyond the single active position, and any new smart contract.
