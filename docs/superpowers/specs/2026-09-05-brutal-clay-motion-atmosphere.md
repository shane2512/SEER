# SEER: Brutal-Clay Motion & Atmosphere (additive revision)

Date: 2026-09-05
Status: Implemented (`app/globals.css`'s "ADDITIVE REVISION — 2026-09-05"
block, `components/motion/`, `components/landing/PipelineRail.tsx`,
`components/ui/Skeleton.tsx`).

## What this adds, and why

The Brutal-Clay Dark Matrix system pulled from Stitch
(`2026-09-04-brutal-clay-design-system.md`) was designed for a dense
internal dashboard: cards, pills, a data table. It has no vocabulary for
three things a landing page and richer app loading states need, and this
revision adds exactly those three, additively — nothing in the original
system's tokens or `.clay-*` utilities is modified:

1. **A display scale above `display-hero` (48px).** 48px is a section
   headline, not a statement — a page whose whole job is a first
   impression needs a tier above it. `--text-display-xl` is fluid
   (`clamp(2rem, 9vw, 7.5rem)`) so the hero fills the first viewport on a
   phone and a 27" display without a breakpoint cascade; `--text-display-lg`
   (`clamp(2.25rem, 6vw, 4rem)`) is the section-headline tier below it.
2. **Atmosphere.** The base system is pure flat obsidian; a dark page
   with no luminance gradient reads as an unfinished background rather
   than a deliberate one. `.atmos` paints one fixed overhead light pool
   plus a weaker floor bounce, `.atmos-grain` breaks up the resulting
   gradient bands (visible artifacts on dark, near-OLED backgrounds
   otherwise) with an inline-generated SVG turbulence texture — no network
   request, no chromatic color, both a `pulse-dim` accent and every
   atmosphere layer are strictly white-only, preserving the source
   DESIGN.md's zero-chromatic-hue rule absolutely.
3. **Motion tokens.** The `.clay-*` utilities hardcode `150ms ease-out`
   inline; there was no shared easing/duration vocabulary to compose
   page-level choreography from. Named curves (`--ease-clay` — the
   existing press feel, promoted to a token; `--ease-out-expo` — the long
   decelerating entrance curve; `--ease-spring` — a slight overshoot for
   elements popping to a raised clay level) and a duration scale
   (`--duration-instant` 100ms through `--duration-reveal` 900ms) replace
   ad hoc per-component values.

Also added: `--section-pivotal` / `--section-major` / `--section-minor`,
a weighted (not uniform) section-padding scale — a pivotal section (hero,
closing ask) gets materially more air than a connective one, since
uniform section padding is what makes a page read as "everything cramped,
nothing has its own moment."

## Components

- **`components/motion/InView.tsx`** (`InView`, `Line`, `Rise`) — reveals
  content by setting `data-revealed="true"` on a ref after mount (or on
  intersection), with every actual animation expressed in CSS keyed off
  that attribute. Deliberately holds no React state: the predecessor of
  this component (`components/landing/Reveal.tsx`, from the previous
  session's work) drove visibility through `useState` and had already
  caused one real, live SSR hydration mismatch when an earlier revision
  tried to read `window` in the state initializer to dodge a lint
  warning. Writing a DOM attribute from an effect sidesteps the whole
  class of problem — server and client render identical markup; the
  reveal is a post-hydration mutation, never a render difference.
  `Line` masks its content behind `overflow: hidden` for a "type is
  uncovered" reveal; `Rise` is the same entrance without the clipping box,
  for focusable content whose focus ring `Line`'s mask would otherwise
  clip.
- **`components/motion/Parallax.tsx`** (`Parallax`, `PointerField`) —
  scroll-driven and pointer-driven transform effects. Both are
  `transform`-only (never `top`/`margin`), batch reads into
  `requestAnimationFrame`, and gate on `prefers-reduced-motion`;
  `PointerField` additionally gates on `(pointer: fine)` so it never
  attaches a listener on touch devices, and eases toward the pointer
  (8% of the remaining gap per frame) rather than tracking it exactly.
- **`components/landing/PipelineRail.tsx`** — the one scroll-scrubbed
  effect on the landing page, applied only to the four-step execution
  pipeline because it is the only content that is genuinely a sequence
  (the parallel feature list above it is deliberately *not* given the
  same treatment — that would be decoration encoding an order that
  doesn't exist). Publishes `--progress` (0..1) consumed as a `scaleY` on
  a vertical rail; with reduced motion the rail draws complete rather
  than empty, since an unfilled rail reads as broken or still-loading.
- **`components/ui/Skeleton.tsx`** (`Skeleton`, `SkeletonCard`) —
  placeholder geometry mirroring real card shapes (not generic grey bars)
  so the dashboard and history pages hold their layout while live
  DreamDEX data is in flight, instead of rendering a line of loading text
  and then reflowing completely once markets arrive.

## Reduced motion

Handled as one global guard in `globals.css` (`@media
(prefers-reduced-motion: reduce)`) rather than a per-component
capability check: every masked/risen element resolves instantly to its
final visible state, and every looping animation (`atmos-bloom`,
`pulse-dim`, `skeleton-sweep`) stops. The failure mode that matters is a
reveal that never fires and leaves the page blank for the exact users who
asked for less motion — the guard is written to make that impossible by
construction rather than by remembering to check it in each component.
