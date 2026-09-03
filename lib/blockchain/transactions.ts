export type TradeState =
  | { status: "idle" }
  | { status: "validating"; requestId: string }
  | { status: "submitting"; requestId: string }
  | { status: "submitted"; txHash: string }
  | { status: "confirmed"; txHash: string; filled: number; price: number }
  | { status: "failed"; error: string };

const LEGAL_TRANSITIONS: Record<TradeState["status"], TradeState["status"][]> = {
  idle: ["validating"],
  validating: ["submitting", "failed"],
  submitting: ["submitted", "failed"],
  submitted: ["confirmed", "failed"],
  confirmed: [],
  failed: [],
};

export function canTransition(from: TradeState["status"], to: TradeState["status"]): boolean {
  return LEGAL_TRANSITIONS[from].includes(to);
}

/** Apply `event` on top of `current`, throwing on any transition REQUIREMENTS.md's
 *  state machine (§4) does not allow. */
export function nextState(current: TradeState, event: TradeState): TradeState {
  if (!canTransition(current.status, event.status)) {
    throw new Error(`illegal transition: ${current.status} -> ${event.status}`);
  }
  return event;
}
