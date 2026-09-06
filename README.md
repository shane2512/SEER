# SEER

**A deterministic, non-custodial trading agent for DreamDEX Event Contracts on Somnia Shannon testnet.**

[![SEER — Somnia x DreamDEX](docs/seer-hero.png)](https://youtu.be/gcHBpvcPFvI)

SEER evaluates live BTC/ETH DreamDEX Event Contracts, produces a structured directional signal with a stated confidence and rationale, checks that trade against hard risk limits, and hands it to the visitor's own connected wallet to sign. It never holds a key, and it never makes a call it can't explain.

**Track: Deterministic / Statistical Model.** There is no LLM, no agentic multi-step reasoning loop, and no black-box inference anywhere in the trade path — the signal comes from a closed-form momentum/moneyness model, so the same market state always produces the same call.

Live app: [seer-omega.vercel.app](https://seer-omega.vercel.app/)
Demo video: [youtu.be/gcHBpvcPFvI](https://youtu.be/gcHBpvcPFvI)

---

## The problem, and why Somnia

DreamDEX Event Contracts turn a market view into a single binary question — will BTC/ETH be up or down when this contract expires — on windows as short as a minute. That cadence only works if two things hold: the venue can confirm a trade before the window closes, and the trader can trust *why* a bot took a side, since there's no time to second-guess it mid-round.

Automated trading tools usually fail one of those. A signal from an opaque model can't be checked before you act on it, and a bot that needs custody of your funds to trade fast enough puts your capital at risk of a bug or a compromised operator. SEER is built to fail neither:

- **Somnia's throughput and finality** make it realistic to validate, sign, and settle a trade inside a sub-hour, sometimes sub-minute, contract window — something a slower L1 couldn't support for this product shape at all.
- **DreamDEX Event Contracts** are the actual market being traded, discovered and read through the official `@somnia-chain/markets-sdk` (DreamDEX Bot Kit), not a mocked price feed.
- **The signing model is wallet-native**, not custodial: every order is submitted by the visitor's own wallet client, so SEER's role stays limited to evaluating and validating, never holding funds.

## Architecture

```text
UI Layer (app/, components/, hooks/)
    -> connects a wallet, displays the market, the signal, and trade status
    -> never holds a key, never calls DreamDEX directly

Application Layer (app/api/evaluate, app/api/trade/validate)
    -> runs the decision model
    -> checks a proposed trade against hard risk limits
    -> returns ok/reject; never signs or submits anything

DreamDEX + Somnia Web3 Engine (lib/dreamdex/, lib/bot/)
    -> lib/dreamdex/client.ts + markets.ts + event-contracts.ts: market
       discovery and normalization via the official SDK
    -> lib/bot/permissions.ts: the guardrail checks themselves
    -> lib/dreamdex/browserClient.ts + hooks/useTrade.ts: the browser's own
       SDK instance, signed and submitted through the connected wallet
```

The server never holds a trading private key. `POST /api/trade/validate` is guardrail-only — it has no signer and submits nothing. On an `ok: true` response, the browser signs the returned market snapshot itself, through its own wallet client, and submits it directly.

### Core logic

**Signal (`lib/seer/evaluator.ts`).** A closed-form directional estimate ported from DreamDEX Bot Kit's own reference strategy (`ec-oracle-follow`), math unchanged: a rolling spot-price momentum window feeds a moneyness calculation against the contract's strike/reference price, passed through a normal-CDF-shaped estimator to produce `P(up)`. When a market's reference price fails a plausibility check against live spot (guards against a misread strike swinging the estimate to a false-confident extreme), the model falls back to momentum-only. No training, no external inference call, no non-determinism — the same `(spot, momentum, strike, time-to-expiry)` tuple always produces the same `P(up)`.

**Guardrails (`lib/bot/permissions.ts`).** Before a trade is allowed to reach a wallet for signing, `validateTrade` checks, in order: the market matches the request, the market is actually in `Trading` status, it isn't within a fixed 30-second floor of expiry, the side is valid, the size is positive and within `MAX_ORDER_SIZE`, and the requested price doesn't deviate from the book's own reference mid by more than `MAX_PRICE_DEVIATION`. Any failure returns a specific rejection reason; nothing partially passes.

### Stack

TypeScript, Next.js (App Router), React, TailwindCSS, `@somnia-chain/markets-sdk` (DreamDEX Bot Kit), wagmi + viem (wallet connect and client-side signing), Zod (request validation), Vitest (unit tests).

## Smart contracts and deployment

SEER does not deploy or own any smart contract. Every market is a DreamDEX Event Contract, already live on **Somnia Shannon testnet (Chain ID 50312)**, discovered at runtime through the official SDK rather than a hardcoded address — DreamDEX's venues rotate over time, so a value baked into this README would go stale. To find the venue and markets currently live:

```bash
npm run ec:doctor
```

This lists the active binary markets and the `venueId` backing them right now. Every confirmed trade's block-explorer link is resolved dynamically from the SDK's own chain metadata (`lib/blockchain/explorer.ts`) rather than a hardcoded explorer origin, so it always points at the correct Somnia Shannon explorer for the transaction shown.

## Quick start

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

   | Variable | Required | Notes |
   | --- | --- | --- |
   | `NEXT_PUBLIC_SOMNIA_CHAIN_ID` | yes | Somnia Shannon testnet chain id (`50312`) |
   | `NEXT_PUBLIC_SOMNIA_RPC_URL` | yes | Somnia testnet HTTP RPC endpoint |
   | `NEXT_PUBLIC_SOMNIA_WS_RPC_URL` | yes | Somnia testnet WebSocket RPC endpoint |
   | `NEXT_PUBLIC_DREAMDEX_INDEXER_URL` | yes | DreamDEX GraphQL indexer endpoint |
   | `MAX_ORDER_SIZE` / `NEXT_PUBLIC_MAX_ORDER_SIZE` | yes | Guardrail: max order size (`lib/bot/permissions.ts`) |
   | `MAX_PRICE_DEVIATION` | yes | Guardrail: max allowed deviation from book mid |

   No private key belongs in this file — every trade is signed by whichever wallet the visitor connects in the browser.

3. **Verify RPC connectivity**

   ```bash
   npm run doctor
   ```

4. **Discover the active DreamDEX venue**

   ```bash
   npm run ec:doctor
   ```

   Copy the `venueId` this prints if you're scoping discovery to one venue — don't reuse a stale value from a previous session.

5. **Run the app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard), connect a wallet on Somnia Shannon, and trade a live signal.

6. **Verify before a demo or submission**

   ```bash
   npm run lint
   npx tsc --noEmit
   npm run build
   npm test
   ```

### Other commands

```bash
npm run build   # production build
npm run start   # run the production build
npm test        # unit test suite (vitest)
```

## Team

Built by [shane2512](https://github.com/shane2512) for the Somnia x DreamDEX Event Contracts hackathon.

## What's next

- Broaden asset and venue coverage as DreamDEX opens more Event Contract markets, rather than assuming BTC/ETH stays the only pair.
- Move `MAX_ORDER_SIZE` from a flat cap toward a proper position-sizing rule that accounts for the model's own stated confidence.
- Harden the guardrail service and RPC handling for production traffic once DreamDEX and Somnia's own mainnet timelines are set.

See `PRD.md` for the full product spec, `CLAUDE.md` for the project's non-negotiable rules, and `docs/superpowers/specs/` for technical design notes.
