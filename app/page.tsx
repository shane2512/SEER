import Link from "next/link";
import { Reveal } from "@/components/landing/Reveal";

const FEATURES = [
  {
    title: "Live DreamDEX Markets",
    body: "Real BTC/ETH binary Event Contracts, discovered live on Somnia Shannon testnet.",
  },
  {
    title: "Deterministic Reasoning",
    body: "A strike/momentum estimator, not a black-box LLM — every call comes with a plain-language rationale.",
  },
  {
    title: "Your Wallet, Your Keys",
    body: "Every order is signed by your own connected wallet. SEER never holds a private key.",
  },
] as const;

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 lg:px-6">
      <div className="flex items-center justify-between py-4">
        <span className="font-display text-lg font-bold text-text-bright">SEER</span>
        <Link
          href="/dashboard"
          className="clay-primary rounded-full border-2 border-border-hard bg-border-hard px-4 py-2 font-display text-xs font-bold tracking-wide text-surface-base uppercase"
        >
          Open Dashboard
        </Link>
      </div>

      <section className="py-16 lg:py-20">
        <Reveal>
          <div className="clay-2 mb-5 inline-block rounded-full border-2 border-border-active bg-surface-active px-3 py-1 font-display text-[11px] font-bold tracking-[0.08em] text-text-bright uppercase">
            ● Somnia Shannon Testnet
          </div>
          <h1 className="max-w-xl font-display text-4xl leading-tight font-bold tracking-tight text-text-bright lg:text-5xl">
            An explainable trading agent for DreamDEX Event Contracts.
          </h1>
          <p className="mt-5 max-w-md font-mono text-base text-text-dim">
            SEER evaluates live BTC/ETH prediction markets and produces a deterministic call you execute yourself
            — signed by your own wallet, validated by real guardrails.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="clay-primary rounded-full border-2 border-border-hard bg-border-hard px-5 py-3 font-display text-sm font-bold tracking-wide text-surface-base uppercase"
            >
              Open Dashboard
            </Link>
            <Link
              href="/history"
              className="clay-2 rounded-full border-2 border-border-active bg-surface-active px-5 py-3 font-display text-sm font-bold tracking-wide text-text-bright uppercase"
            >
              Trade History
            </Link>
          </div>
        </Reveal>
      </section>

      <section className="border-t border-border-well py-14">
        <Reveal>
          <div className="grid gap-3 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="clay-1 rounded-2xl border-2 border-border-layer bg-surface-layer p-4">
                <h3 className="font-display text-sm font-bold text-text-bright">{f.title}</h3>
                <p className="mt-2 font-mono text-xs text-text-dim">{f.body}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-border-well py-6 font-mono text-xs text-text-dim">
        SEER — Somnia testnet only. Not investment advice.
      </footer>
    </main>
  );
}
