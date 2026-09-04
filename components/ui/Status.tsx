import type { TradeState } from "@/lib/blockchain/transactions";

const LABELS: Record<TradeState["status"], string> = {
  idle: "Idle",
  validating: "Validating…",
  submitting: "Submitting…",
  submitted: "Submitted",
  confirmed: "Confirmed",
  failed: "Failed",
};

export function Status({ state }: { state: TradeState["status"] }) {
  return <span className="text-sm font-medium text-slate-600">{LABELS[state]}</span>;
}
