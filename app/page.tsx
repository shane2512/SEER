import Link from "next/link";
import { InView, Line, Rise } from "@/components/motion/InView";
import { PointerField } from "@/components/motion/Parallax";
import { PipelineRail } from "@/components/landing/PipelineRail";
import { SiteHeader } from "@/components/chrome/SiteHeader";
import FloatingLines from "@/components/motion/FloatingLinesLazy";

// Every value below is a real property of the deployed system — the Shannon
// chain id, its block time, and the custody model that follows from SEER
// holding no trading key (CLAUDE.md §9). Nothing here is an invented metric;
// a landing page for an integration is only worth anything if its numbers
// are checkable.
const FACTS = [
  { label: "Network", value: "Somnia Shannon" },
  { label: "Chain ID", value: "50312" },
  { label: "Block time", value: "~100ms" },
  { label: "Custody", value: "Non-custodial" },
] as const;

// Four parallel properties of the system — deliberately NOT numbered. The
// pipeline below is a genuine sequence and carries numbers for that reason;
// numbering a set of simultaneous attributes would encode an order that does
// not exist.
const PROPERTIES = [
  {
    label: "Markets",
    title: "Real event contracts, read live",
    body: "SEER discovers currently active DreamDEX BTC and ETH binary markets straight from Somnia Shannon — real order books, real expiries, real reference prices. There is no sample dataset behind it.",
  },
  {
    label: "Decisions",
    title: "A model you can audit",
    body: "A strike and momentum estimator produces a bullish, bearish or neutral call with a written rationale. It is deterministic: the same inputs always give the same answer, and no language model sits anywhere in the decision path.",
  },
  {
    label: "Limits",
    title: "Checked before you ever sign",
    body: "Each proposed order is validated on the server against market status, expiry, size limits and price-deviation bounds. A request that fails any of those never reaches your wallet.",
  },
  {
    label: "Custody",
    title: "Your wallet holds the keys",
    body: "Orders are signed by the wallet you connect, through the DreamDEX SDK. SEER never holds, sees or transmits a private key — not in the browser, and not on the server.",
  },
] as const;

const PIPELINE = [
  {
    step: "01",
    title: "Discover active markets",
    body: "SEER queries every live Event Contract on the connected venue and normalises the order book, strike and expiry into one shape the rest of the pipeline reads.",
  },
  {
    step: "02",
    title: "Run the decision model",
    body: "Spot price and short-horizon momentum are measured against the market's strike, producing a direction, a confidence score, and the rationale behind both.",
  },
  {
    step: "03",
    title: "Clear the guardrails",
    body: "The proposed order is checked server-side against market status, size ceilings and price-deviation bounds. Anything outside them is rejected before a signature is requested.",
  },
  {
    step: "04",
    title: "Sign and settle",
    body: "Your wallet signs. The SDK submits the order to Somnia, and SEER follows the transaction to confirmation with a link to the Shannon explorer.",
  },
] as const;

const DIAGRAM_NODES = ["Market", "Signal", "Guardrail", "Signature"] as const;

export default function LandingPage() {
  return (
    <>
      <SiteHeader
        action={
          <Link
            href="/dashboard"
            className="clay-primary rounded-full border-2 border-border-hard bg-border-hard px-4 py-2 font-display text-[13px] font-bold tracking-[0.02em] text-surface-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-hard"
          >
            Open dashboard
          </Link>
        }
      />

      <main className="relative z-10">
        {/* Hero — the one place the page spends its boldness. The headline is
            the visual: Space Mono at up to 120px with -0.055em tracking,
            revealed line by line from behind its own clipping box so the
            statement assembles itself once, on load. Everything below the
            fold is deliberately quiet by comparison. */}
        <PointerField>
          <section className="relative overflow-hidden px-5 pt-[var(--section-major)] pb-[var(--section-pivotal)] lg:px-8">
            {/* The hero's only background layer: a WebGL shader (React
                Bits' FloatingLines, components/motion/FloatingLines.tsx)
                drawing slow, wave-like white lines rather than the earlier
                static radial-gradient glow + separate dodecahedron render.
                `linesGradient={["#ffffff"]}` is load-bearing, not
                decorative — the shader's own `background_color()` defaults
                to a hardcoded blue/pink pair, and only supplying a gradient
                array bypasses it (see the component's header comment). Its
                own `interactive`/`parallax` pointer response replaces the
                old pointer-tracked gradient div, so PointerField here is
                kept only for the CTA row's own hover/parallax affordances,
                not for driving this background. `mixBlendMode="screen"`
                lets it sit over `.atmos`/`.atmos-grain` without a flat
                rectangle stacking on top of them. Absolutely positioned and
                `aria-hidden`: it's atmosphere, not content. */}
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-70">
              <FloatingLines linesGradient={["#ffffff"]} interactive parallax mixBlendMode="screen" />
            </div>

            <InView immediate className="mx-auto max-w-[var(--shell-width)]">
              <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-border-active bg-surface-active/70 px-3.5 py-1.5 font-mono text-[12px] text-text-dim backdrop-blur-sm">
                <span className="pulse-dim inline-block size-1.5 rounded-full bg-text-bright" />
                Live on Somnia Shannon testnet
              </div>

              <h1 className="text-display-xl text-text-bright">
                <Line delay={60}>A trading agent</Line>
                <Line delay={150}>that shows</Line>
                <Line delay={240}>its work.</Line>
              </h1>

              <Line delay={420}>
                <p className="mt-9 max-w-[54ch] font-mono text-[15px] leading-7 text-text-dim">
                  SEER evaluates live BTC and ETH event contracts on Somnia with a deterministic model,
                  publishes the reasoning behind every call, and hands the order to your own wallet to sign.
                </p>
              </Line>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Rise delay={540}>
                  <Link
                    href="/dashboard"
                    className="clay-primary inline-block rounded-full border-2 border-border-hard bg-border-hard px-6 py-3.5 font-display text-sm font-bold tracking-[0.02em] text-surface-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-hard"
                  >
                    Open dashboard
                  </Link>
                </Rise>
                <Rise delay={600}>
                  <Link
                    href="#how-it-works"
                    className="inline-block rounded-full border-2 border-border-active bg-surface-active px-6 py-3.5 font-display text-sm font-bold tracking-[0.02em] text-text-bright transition-colors duration-[--duration-fast] hover:border-border-hard focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-hard"
                  >
                    How it works
                  </Link>
                </Rise>
              </div>
            </InView>
          </section>
        </PointerField>

        {/* Fact rail — four checkable facts as one hairline-divided instrument
            rail rather than four identical rounded cards. The card-grid
            version gave four unrelated one-word values the same visual weight
            as a feature, which is more structure than the content earns. */}
        <section className="px-5 lg:px-8">
          <div className="mx-auto max-w-[var(--shell-width)]">
            <hr className="rule-fade" />
            <InView className="grid grid-cols-2 divide-x divide-border-well lg:grid-cols-4">
              {FACTS.map((fact) => (
                <div key={fact.label} className="px-5 py-7 first:pl-0 lg:px-7">
                  <div className="font-display text-[11px] font-bold tracking-[0.08em] text-text-inert uppercase">
                    {fact.label}
                  </div>
                  <div className="mt-2 font-mono text-lg text-text-bright" data-numeric>
                    {fact.value}
                  </div>
                </div>
              ))}
            </InView>
            <hr className="rule-fade" />
          </div>
        </section>

        {/* Properties — an editorial list on hairlines, not a card grid.
            Boxing each of these in its own bordered, shadowed slab was the
            single biggest thing making the page read as generated: four
            identical containers implying four identical kinds of thing. */}
        <section className="px-5 py-[var(--section-major)] lg:px-8">
          <div className="mx-auto max-w-[var(--shell-width)]">
            <InView>
              <h2 className="text-display-lg max-w-[18ch] text-text-bright">
                <Line>Built on the real thing.</Line>
              </h2>
              <p className="mt-5 max-w-[58ch] font-mono text-[15px] leading-7 text-text-dim">
                SEER runs no oracle and no protocol of its own. It reads and trades DreamDEX Event Contracts
                through the official SDK, which is what makes every claim on this page checkable on-chain.
              </p>
            </InView>

            <div className="mt-14 grid gap-x-14 sm:grid-cols-2">
              {PROPERTIES.map((property) => (
                <InView
                  key={property.label}
                  threshold={0.25}
                  className="border-t border-border-well py-8"
                >
                  <div className="font-display text-[11px] font-bold tracking-[0.08em] text-text-inert uppercase">
                    {property.label}
                  </div>
                  <h3 className="mt-3 max-w-[22ch] font-display text-[22px] leading-8 font-bold tracking-[-0.02em] text-text-bright">
                    {property.title}
                  </h3>
                  <p className="mt-3 max-w-[46ch] font-mono text-[14px] leading-6 text-text-dim">
                    {property.body}
                  </p>
                </InView>
              ))}
            </div>
          </div>
        </section>

        {/* Pipeline — genuinely a sequence, so this is the section that earns
            numbering, a vertical rail, and the page's only scroll-scrubbed
            effect. */}
        <section id="how-it-works" className="scroll-mt-24 px-5 py-[var(--section-major)] lg:px-8">
          <div className="mx-auto max-w-[var(--shell-width)]">
            <InView>
              <h2 className="text-display-lg max-w-[16ch] text-text-bright">
                <Line>Four checkpoints, every trade.</Line>
              </h2>
            </InView>

            {/* The four checkpoints shown at a glance before they are
                described. The flow is legible here in about a second, where
                the list below takes a minute to read. */}
            <InView className="mt-12 overflow-x-auto">
              <svg
                viewBox="0 0 960 96"
                role="img"
                aria-label="Pipeline: market, then signal, then guardrail, then signature."
                className="h-24 w-full min-w-[640px] text-text-inert"
              >
                <defs>
                  <marker
                    id="pipeline-arrow"
                    viewBox="0 0 8 8"
                    refX="7"
                    refY="4"
                    markerWidth="7"
                    markerHeight="7"
                    orient="auto"
                  >
                    <path d="M0 0 L8 4 L0 8 z" fill="currentColor" />
                  </marker>
                </defs>
                {DIAGRAM_NODES.map((node, index) => {
                  const x = index * 248;
                  return (
                    <g key={node}>
                      <rect
                        x={x}
                        y="26"
                        width="188"
                        height="44"
                        rx="22"
                        fill="var(--color-surface-layer)"
                        stroke="var(--color-border-layer)"
                        strokeWidth="2"
                      />
                      <text
                        x={x + 94}
                        y="53"
                        textAnchor="middle"
                        fill="var(--color-text-bright)"
                        fontFamily="var(--font-space-mono)"
                        fontSize="13"
                        fontWeight="700"
                        letterSpacing="1.2"
                      >
                        {node.toUpperCase()}
                      </text>
                      {index < DIAGRAM_NODES.length - 1 && (
                        <line
                          x1={x + 196}
                          y1="48"
                          x2={x + 238}
                          y2="48"
                          stroke="currentColor"
                          strokeWidth="2"
                          markerEnd="url(#pipeline-arrow)"
                        />
                      )}
                    </g>
                  );
                })}
              </svg>
            </InView>

            <PipelineRail>
              <div className="mt-14">
                {PIPELINE.map((step) => (
                  <InView key={step.step} threshold={0.3} className="flex gap-6 py-7 sm:gap-9">
                    <div
                      className="relative z-10 mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border border-border-active bg-surface-base font-mono text-[10px] text-text-dim sm:size-8 sm:text-[11px]"
                      data-numeric
                    >
                      {step.step}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display text-[22px] leading-8 font-bold tracking-[-0.02em] text-text-bright">
                        {step.title}
                      </h3>
                      <p className="mt-2 max-w-[62ch] font-mono text-[14px] leading-6 text-text-dim">
                        {step.body}
                      </p>
                    </div>
                  </InView>
                ))}
              </div>
            </PipelineRail>
          </div>
        </section>

        {/* Close — left-aligned and full-width rather than a centred card. The
            centred box is the default closing treatment on every generated
            landing page, and it also fights the left-aligned rhythm the rest
            of the page establishes. */}
        <section className="px-5 pt-[var(--section-minor)] pb-[var(--section-pivotal)] lg:px-8">
          <div className="mx-auto max-w-[var(--shell-width)]">
            <hr className="rule-fade mb-[var(--section-minor)]" />
            <InView>
              <h2 className="text-display-lg max-w-[15ch] text-text-bright">
                <Line>See it call a live market.</Line>
              </h2>
              <p className="mt-5 max-w-[52ch] font-mono text-[15px] leading-7 text-text-dim">
                Connect a wallet on Somnia Shannon and place a real, wallet-signed trade against a live DreamDEX
                Event Contract. Testnet funds only.
              </p>
              <Link
                href="/dashboard"
                className="clay-primary mt-9 inline-block rounded-full border-2 border-border-hard bg-border-hard px-7 py-4 font-display text-[15px] font-bold tracking-[0.02em] text-surface-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-hard"
              >
                Open dashboard
              </Link>
            </InView>
          </div>
        </section>
      </main>
    </>
  );
}
