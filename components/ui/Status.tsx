import type { TradeState } from "@/lib/blockchain/transactions";

const LABELS: Record<TradeState["status"], string> = {
  idle: "IDLE",
  validating: "VALIDATING…",
  submitting: "SUBMITTING…",
  submitted: "SUBMITTED",
  confirmed: "CONFIRMED",
  failed: "FAILED",
};

export function Status({ state }: { state: TradeState["status"] }) {
  return <span className="font-mono text-sm font-bold tracking-wide text-text-dim uppercase">{LABELS[state]}</span>;
}
