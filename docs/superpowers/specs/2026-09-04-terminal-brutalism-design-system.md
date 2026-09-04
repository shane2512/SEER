# SEER: Terminal Brutalism Design System

Date: 2026-09-04
Status: Tokens implemented (`app/globals.css`, `app/layout.tsx`); component
rules below are the reference for Phase 2 page rebuilds.
Source: Stitch project "Brutalist Minimal Trading Dashboard"
(`projects/1897895306545728849`), pulled via the Stitch MCP connector's
`get_project`/`get_screen` — real design data, not a guess from a
screenshot. Cached locally at `.stitch-cache/` (gitignored — see note at
the end of this doc).

## What this supersedes

CLAUDE.md's UI section (§14) currently reads "avoid unnecessary animations,
complicated dashboards, excessive gradients... the objective is a small,
demonstrably real MVP." Per the user's explicit direction ("we have time,
we can scale the project, don't mind CLAUDE.md"), this redesign
consciously overrides that minimalism stance. CLAUDE.md is being reworked
separately to reflect this. What CLAUDE.md's non-negotiable technical
constraints (§1) still govern absolutely: real Somnia testnet only, real
DreamDEX SDK, no invented capabilities, no private keys in the browser.
Visual scale-up does not license technical fabrication — see the content
mismatch note below.

## Critical: content mismatch in the source mockups

Stitch generated plausible-sounding placeholder copy with no knowledge of
SEER's actual codebase. Both pulled screens describe a system that does not
exist:

- **"SEER SERVER RELAYER" / "TEE hardware enclave" / `MR_ENCLAVE` /
  "100% AUTONOMOUS RELAYED"** — describes the old seeded-server-wallet
  model this project explicitly retired in favor of wallet-connect (this
  session's prior work). The real signer is the visitor's own connected
  wallet; there is no enclave, no autonomous relayer, no server-held key.
- **"MODEL: DEEPSEEK-R1-SOMNIA-ORACLE"** — SEER's decision engine is
  deterministic (`lib/seer/evaluator.ts`'s `estimateUp`, a strike/momentum
  model), not an LLM. Never label it as one.
- Fabricated market data (BTC $94,250, 5-asset bento grid with SOL/AVAX
  markets, `RELAYER: 0x71C...89B4`, block numbers, PnL history) — cosmetic
  placeholder values from Stitch's generator, not to be treated as sample
  data worth preserving; every screen must bind to SEER's real API
  responses (`MarketView`, `Decision`, `TradeState`, `Portfolio`).

**Rule for Phase 2:** adopt the visual system (layout, type, color, motion
restraint) faithfully. Rewrite every label and data binding to what SEER
actually does. When a mockup's copy and SEER's real mechanics conflict,
SEER's mechanics win, full stop.

## Design tokens (implemented)

Colors — strict two-tone with a support greyscale, zero chromatic color
anywhere in the interface. State (long/short, yes/no, win/loss) is
communicated by fill inversion and bracketed text tokens (`[LONG]`,
`[SETTLED]`), never by hue:

| Token | Hex | Use |
|---|---|---|
| `surface-base` | `#000000` | Page background |
| `surface-layer` | `#0A0A0A` | Sub-panel backing, inactive wells |
| `surface-active` | `#1A1A1A` | Hover, selected cell |
| `border-hard` | `#FFFFFF` | Structural dividers, active state |
| `border-dim` | `#333333` | Low-priority framing |
| `text-bright` | `#FFFFFF` | Values, titles, active markers |
| `text-dim` | `#888888` | Labels, metadata |
| `text-inert` | `#444444` | Disabled |
| `error` | `#FFB4AB` | The one reserved chromatic exception — irrecoverable/destructive states only |

Typography — Space Mono for display/headline/body, JetBrains Mono for
tabular data and uppercase labels (both load-bearing, not decorative —
JetBrains Mono's tabular figures are what keeps numeric columns aligned):
`display-lg` (56/60, -0.04em), `headline-xl` (40/48), `headline-lg`
(24/30), `headline-sm` (18/24), `body-lg` (16/24), `body-sm` (14/20),
`data-lg`/`data-md`/`data-sm` (JetBrains Mono, tabular-nums forced via the
`[data-numeric]`/`.font-mono` selector in `globals.css`), `label-caps`
(11px, uppercase, 0.1em tracking).

Spacing — `unit-1` (0.25rem) through `unit-16` (4rem), plus
`grid-gutter: 1px` (adjacent cells share borders, never double-margin) and
`layout-margin-desktop`/`mobile`.

Shape — every `--radius-*` resolves to `0px`. No curves anywhere. Diagonal
clip-path chamfers (4–8px) are the one permitted corner treatment, reserved
for execution buttons and terminal window edges — not implemented as a
token (a `clip-path` value, applied per-component when used).

Elevation — no blur, no soft shadows, no faux physical lighting. Depth is
2D and diagrammatic only:
- **Plane inversion**: an elevated/focused element flips `surface-base` →
  `border-hard` background with inverted text, snapping to the foreground.
- **Hard border**: `2px solid var(--color-border-hard)` perimeter for
  modals/tooltips/floating command lines.
- **Offset hard shadow** (`.shadow-hard` in `globals.css`):
  `box-shadow: 4px 4px 0px 0px #FFFFFF` — zero blur, for primary execution
  controls only.
- **Hatch overlays**: 45° diagonal hash patterns for disabled/inactive
  wells, instead of opacity fades (not yet implemented as a utility —
  needed the first time Phase 2 hits a genuinely disabled market state).

## Component rules (reference for Phase 2 — not yet applied to any page)

**Buttons**
- Primary: solid white fill, black text, bold, uppercase. Hover: inverts
  (black fill, white 2px outline). Active: `translate(2px, 2px)` + shadow
  reset (the offset shadow "resolves" on press).
- Secondary: black background, `1px solid white` outline. Hover: fills
  `surface-active`.
- Destructive/cancel: black surface, `1px dashed white`, text prefixed
  `[X]`.

**Status pills** — rectangular, never rounded:
- Live/active: `1px solid white` outline + solid glyph, e.g. `[■ LIVE]`.
- Resolved/neutral: `1px solid border-dim`, `text-dim` color, e.g.
  `[○ SETTLED]`.
- Selected: fully inverted block.

**Inputs** — `1px solid border-dim` → `2px solid white` on focus. Pure
black background, JetBrains Mono text, blinking block cursor (`▋`).
Inline unit tickers (e.g. token symbol) right-aligned in `label-caps`.

**Checkboxes** — rigid 16×16px square, `1px solid white`; selected state
is a solid inner 10×10px block, no checkmark glyph.

**Tables** — border-collapsed cells (shared borders, not doubled).
Headers: full-width `2px solid white` bottom border, `label-caps`. Numeric
columns right-aligned, tabular-nums. Row hover → `surface-active`.

**Cards** — grid cells with `1px solid border-dim` perimeter. Header
carries an integrated coordinate-style badge docked on the top border
(e.g. `TILE_01 // MARKET`), echoing real content (market symbol, page
name) rather than the mockup's arbitrary tile numbering.

## Layout structure (from the pulled screens)

- **Bento dashboard**: multi-tile grid, edge-to-edge panels separated by
  1–2px borders (no floating padded cards). A market-selector strip across
  the top, then tiles for market detail, AI/decision reasoning, execution
  controls, verification pipeline, and position state.
- **Trade history**: a metrics row (total trades, win rate, net PnL, gas)
  above a filterable, paginated, border-collapsed table with CSV export.
- Both are desktop-first (1440px+, 240px nav / variable center / 360px
  dock per the DESIGN.md), collapsing to a single vertical stream under
  768px with borders thinning from 2px to 1px.

## Local Stitch cache

`.stitch-cache/` holds the downloaded HTML + screenshots for both pulled
screens (`bento-dashboard.{html,png}`, `trade-history.{html,png}`) — kept
locally as the Phase 2 implementation reference, not committed (added to
`.gitignore`).
