# Developer Feedback — SEER (Somnia x DreamDEX Event Contracts Hackathon)

Real issues and sharp edges hit while building against the DreamDEX Bot Kit /
`@somnia-chain/markets-sdk` and Somnia Shannon testnet, kept here as the
organizers asked. Each one links to where it's handled in the code, so it's
verifiable rather than a vague complaint.

## 1. The oracle's price scale isn't documented anywhere obvious

`BinaryMarket.strike` and the `getOpeningPrices` response are described in
the SDK's own docs only as "raw, in the oracle's price scale" — no scale
factor is given. We had to confirm it empirically against live spot data
before trusting the model on it: an "opening" market's `boundary.raw` of
`7935580` matched real BTC spot ($79,355.80 at `/100`, within 0.04%), and
`245207` matched real ETH spot (within 0.08%). Until that was confirmed, our
first attempt cited an incorrect scale, which would have silently produced
wrong moneyness math for every trade.

See `lib/dreamdex/event-contracts.ts` (search "Scale confirmed live").

**Ask:** publish the oracle price scale (and whether it's the same for
`strike` and `opening` modes — we could only verify the `opening` case
directly, no live `strike`-mode market existed to check) directly in the SDK
reference docs.

## 2. A validity gate that quietly never ran against real markets

Our reference-price plausibility check (rejecting a wildly-off strike/spot
ratio before trusting it) originally only applied when `referenceKind ===
"strike"`. That's a reasonable-looking assumption that turned out to be
wrong: in practice essentially every currently-live DreamDEX Event Contract
is an "opening" (up/down) market, not a fixed-strike one — so the check
never engaged against real markets at all until we noticed and widened it to
both reference kinds. Nothing in the SDK signaled this; it only surfaced by
testing against live markets and noticing the gate's log line never fired.

See `app/api/evaluate/route.ts` (search "found live, testing against real
markets").

## 3. NO-side pricing has to be derived — there's no direct field for it

`MarketView`/the book only ever carries YES bid/ask; there is no separate
NO-side field. A NO order's ask is `1 - yesBid` and its reference mid is
`1 - yesMid`, never `yesMid` itself — comparing a NO price against the YES
mid (our own first draft's bug) tests proximity to 0.5, not real NO-side
book health. This "the whole venue quotes in YES terms" convention isn't
stated up front anywhere we could find in the docs; it has to be inferred
from field names.

See `lib/bot/permissions.ts` (search "The book only carries YES bid/ask").

## 4. A relative-deviation guardrail breaks near the edges of the price range

A plain `|price - mid| / mid` price-deviation check blows up whenever `mid`
sits near 0 or 1 — confirmed live against a real market where the NO side's
reference mid was near 0.02, so an entirely ordinary two-cent-wide spread
reported as a 72.4% "deviation" and got rejected. Flooring the denominator
(we used `max(mid, 0.05)`) fixes it, but it's an easy trap for anyone
implementing risk checks against this kind of 0–1-bounded market price.

See `lib/bot/permissions.ts` (search "blows up whenever referenceMid").

## 5. Each SDK exchange instance needs its own `loadMarkets()` call

`createOrder()` throws `InvalidInputError: unknown symbol — call
loadMarkets() first` until `loadMarkets()` has run on that specific exchange
instance's symbol table. That's documented, but it's easy to miss that a
server-side exchange instance and a browser-side one (e.g. one built from a
connected wallet's `walletClient`) are two completely separate instances
with two separate tables — validating a trade server-side does *not* warm
the browser instance's table. We hit this live: a real order attempt threw
on the exact symbol that had just been validated moments earlier, and no
unit test caught it because the tests mock the browser exchange entirely.

See `hooks/useTrade.ts` (search "confirmed live: a real order attempt
threw").

## 6. A naive expiry-headroom design is mathematically inert

Our first attempt at a "reject trades too close to expiry" guardrail scaled
the required headroom as a fraction of the market's *remaining* time —
`max(30s, min(300s, remainingMs * 0.4))`. That's inert by construction:
`remainingMs * 0.4` is always less than `remainingMs` itself, so the
comparison can only ever fire once the flat 30s floor already dominates,
for every trading cadence. The correct approach (matching the Bot Kit's own
reference strategy) scales off the market's *fixed* interval
(`expiry - tradingStart`, a constant), never off the shrinking remaining
time — but `MarketView` as returned by the SDK doesn't carry that interval
field, so we shipped a flat floor instead and left the scaled version as
future work.

See `lib/bot/permissions.ts` (search "This is a FLAT floor").

## 7. Unrelated: a tooling gap that blocked our first Vercel deploy

Not DreamDEX-specific, but worth flagging since it wasted real time: `npm
install` on Vercel (no `--legacy-peer-deps` by default) hard-fails on a
peer-dependency conflict between `vitest@5` (which requires `@types/node`
`^22` or `>=24`) and a project pinned to `@types/node@^20`. Not a DreamDEX
issue at all, just a reminder that a clean local `npm install` (which had
already cached a working resolution) doesn't guarantee a clean CI/deploy
install.

---

None of the above blocked shipping — SEER is live on Somnia Shannon with a
real DreamDEX integration end to end — but each one cost real debugging time
that better docs or a clearer error message could have saved.
