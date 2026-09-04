# SEER: Brutal-Clay Design System

Date: 2026-09-04
Status: Implemented (`app/globals.css`). Supersedes
`2026-09-04-terminal-brutalism-design-system.md` per explicit user
direction — same Stitch project, a different design system asset within it.
Source: Stitch project 1897895306545728849's design system
"Brutal-Clay Dark Matrix" (`assets/6b6cbd6f3ec44331a304bf9b3ba2d346`),
pulled via `list_design_systems` — real tokens, not guessed.

## What changed from Terminal Brutalism

The content language (monospace type, uppercase labels, bracketed system
markers like `[LIVE]` / `// SEC_01`, zero chromatic color) carries over
unchanged. What flips completely is the **shape and elevation model**:

| | Terminal Brutalism | Brutal-Clay |
|---|---|---|
| Corners | Hard 0px everywhere | Real radius — `rounded-2xl` cards, `rounded-full` pills/buttons |
| Depth | Flat, diagrammatic — offset hard shadows only | Multi-layer inset+exterior shadows simulating an inflated, tactile surface |
| Background | Pure black `#000000` | Obsidian `#0a0a0c` |
| Press feedback | `translate(2px,2px)` + shadow removed | `translateY(2-3px)` + shadow layers compress |

The same content-mismatch discipline from the earlier spec still applies:
adopt the visual system faithfully, never the mockup's placeholder copy
(no fictional TEE enclave, no fictional LLM model name).

## Tokens (implemented in `app/globals.css`)

Colors — grayscale/cold slate only, still zero chromatic hue:

| Token | Hex | Use |
|---|---|---|
| `surface-base` | `#0A0A0C` | Page background |
| `surface-well` | `#08090A` | Debossed cavity — inputs, inactive wells |
| `surface-layer` | `#121316` | Level 1 — cards, panels |
| `surface-active` | `#18191E` | Level 2 — buttons, pills, active modals |
| `border-well` / `border-layer` / `border-active` | `#1C1E24` / `#262933` / `#323642` | Matching border tier per surface |
| `text-bright` | `#FFFFFF` | Primary ink |
| `text-dim` | `#A3A8B4` | Secondary slate — body/metadata |
| `text-inert` | `#3D424D` | Disabled |

`border-dim` is kept as an alias to `border-layer` — a large body of
component code was already written against Terminal Brutalism's single
`border-dim` token before this switch; aliasing avoided a full rename
sweep across every file for a cosmetic mid-tier border color.

Typography — Space Mono (`font-display`) for headlines/labels, JetBrains
Mono (`font-mono`/`font-sans`) for body/data: `display-hero` (48/56),
`headline-lg` (32/40), `headline-md` (24/32), `headline-sm` (18/26),
`body-lg` (15/24), `body-md` (13/20), `body-sm` (11/16), `label-lg`
(13px, 0.06em), `label-md` (11px, 0.08em).

Radius — real values now: `sm` 0.25rem, `md` 0.5rem, `lg` 1rem, `xl`
1.5rem, `full` 9999px.

## Elevation utilities (`.clay-*` classes in `globals.css`)

Each "extrusion level" couples an exterior drop shadow with inset
highlight/shadow layers:

- `.clay-well` — debossed cavities (inputs, inactive wells): inset shadows
  only, no exterior lift.
- `.clay-1` — Level 1 (cards): inset highlight + exterior shadow, a
  "resting slab."
- `.clay-2` — Level 2 (interactive buttons/pills/modals): stronger inset +
  exterior shadow, plus a real `:active` press state (`translateY(3px)`,
  shadows compress) for tactile feedback.
- `.clay-primary` — the primary button's specific white-capsule treatment
  (heavier top sheen, `translateY(2px)` on press).

## Applied

Core primitives (`Button`, `Badge`, `Card`, `Status`) and every
market/wallet/history component that composes them inherit the new look
automatically through the shared tokens. Components with bespoke literal
styling (`MarketSelector`, `VenueSelector`, `TradeFilters`'s segmented
control, dashboard/history page containers) were updated directly to add
real radius + the matching `.clay-*` class. The landing page (`app/page.tsx`)
was simplified in the same pass per explicit request — fewer sections (a
header, hero, 3-item feature grid, footer), not the earlier 6-feature +
"how it works" version.
