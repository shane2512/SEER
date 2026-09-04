# SEER

**SEER** (Structured Event Evaluation & Reasoning) is an explainable trading agent for
**DreamDEX Event Contracts** — binary Up/Down BTC/ETH prediction markets trading on
Somnia's on-chain order book. SEER evaluates a live event, produces a structured,
deterministic decision (direction, confidence, rationale), validates it against hard
risk limits, and executes it on **Somnia Shannon testnet** through the DreamDEX
`@somnia-chain/markets-sdk`.

See `PRD.md` for the full product spec and `docs/superpowers/specs/` for the technical
design.

## Quickstart

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env.local` and fill in the values:

   ```bash
   cp .env.example .env.local
   ```

   | Variable | Required | Notes |
   | --- | --- | --- |
   | `NEXT_PUBLIC_SOMNIA_CHAIN_ID` | yes | Somnia Shannon testnet chain id (default `50312`) |
   | `NEXT_PUBLIC_SOMNIA_RPC_URL` | yes | Somnia testnet RPC endpoint |
   | `DREAMDEX_INDEXER_URL` | yes | DreamDEX GraphQL indexer endpoint |
   | `DREAMDEX_VENUE_ID` | recommended | Scopes market discovery to one DreamDEX venue — see step 4, do not guess this value |
   | `BOT_OPERATOR_PRIVATE_KEY` | only for trading | Server-side only. Never prefix with `NEXT_PUBLIC_`, never commit, never expose to the browser |
   | `MAX_ORDER_SIZE` / `MAX_PRICE_DEVIATION` | yes | Hard trading guardrails (see `lib/bot/context.ts`) |

3. **Verify RPC and wallet connectivity**

   ```bash
   npm run doctor
   ```

   Confirms the Somnia RPC is reachable (prints the current block number) and, if
   `BOT_OPERATOR_PRIVATE_KEY` is set, checks the operator wallet's gas balance.

4. **Discover the active DreamDEX venue/market**

   ```bash
   npm run ec:doctor
   ```

   Lists active binary (Event Contract) markets and their `venueId`. DreamDEX venue
   ids move over time, so **copy the `venueId` this script prints into
   `DREAMDEX_VENUE_ID` in `.env.local`** — don't guess it or reuse an old value.

5. **Run the app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard) to see the
   live market, the deterministic signal/reasoning feed, and trade controls.

6. **Verify before a demo or submission**

   ```bash
   npm run lint
   npx tsc --noEmit
   npm run build
   npm test
   ```

## Other commands

```bash
npm run build   # production build
npm run start   # run the production build
npm test        # unit test suite (vitest)
```

## Architecture

```text
UI Layer (app/, components/, hooks/)
    ↓
Application Layer (app/api/*)
    ↓
DreamDEX + Somnia Web3 Engine (lib/dreamdex/, lib/bot/)
```

Private keys and privileged Bot Kit execution stay server-side (`lib/bot/`,
`app/api/*`); the UI never holds a key and never calls DreamDEX directly. See
`CLAUDE.md` for the full set of project rules.
