import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { TradeState } from "@/lib/blockchain/transactions";
import { explorerTxUrl } from "@/lib/blockchain/explorer";

const DEFAULT_CHAIN_ID = 50312;

/** Parse NEXT_PUBLIC_SOMNIA_CHAIN_ID for display purposes only — this is a
 *  UI convenience, not a guardrail, so it degrades to the default instead of
 *  throwing: a malformed value here should never crash the dashboard. The
 *  loud-throwing version (lib/dreamdex/client.ts's parsePositiveNumber) is
 *  intentionally not imported here to keep the private-key-adjacent
 *  DreamDEX/bot SDK out of the client bundle (CLAUDE.md's DreamDEX
 *  isolation + "no privileged Bot Kit operations in the UI layer" rules). */
function parseChainId(raw: string | undefined): number {
  const value = Number((raw ?? "").trim());
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_CHAIN_ID;
}

export function PositionCard({ tradeState }: { tradeState: TradeState }) {
  if (tradeState.status !== "confirmed" && tradeState.status !== "submitted") {
    return null;
  }
  const chainId = parseChainId(process.env.NEXT_PUBLIC_SOMNIA_CHAIN_ID);
  const explorerUrl = explorerTxUrl(chainId, tradeState.txHash);
  return (
    <Card label="POSITION // COMMITTED STATE">
      <div className="flex items-center justify-between">
        <Badge tone={tradeState.status === "confirmed" ? "bullish" : "live"}>
          {tradeState.status === "confirmed" ? "■ Filled" : "■ Pending"}
        </Badge>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-y-1 font-mono text-sm">
        <dt className="text-[11px] font-bold tracking-[0.1em] text-text-dim uppercase">Transaction</dt>
        <dd className="truncate text-right text-text-bright">
          {explorerUrl ? (
            <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-text-dim">
              {tradeState.txHash}
            </a>
          ) : (
            tradeState.txHash
          )}
        </dd>
        {tradeState.status === "confirmed" && (
          <>
            <dt className="text-[11px] font-bold tracking-[0.1em] text-text-dim uppercase">Filled</dt>
            <dd className="text-right text-text-bright" data-numeric>{tradeState.filled} contracts</dd>
            <dt className="text-[11px] font-bold tracking-[0.1em] text-text-dim uppercase">Fill Price</dt>
            <dd className="text-right text-text-bright" data-numeric>{tradeState.price.toFixed(2)}</dd>
          </>
        )}
      </dl>
    </Card>
  );
}
