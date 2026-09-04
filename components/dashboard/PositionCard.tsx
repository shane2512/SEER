import { Card } from "@/components/ui/Card";
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
    <Card>
      <h3 className="font-semibold">Position</h3>
      <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
        <dt className="text-slate-500">Transaction</dt>
        <dd className="truncate font-mono">
          {explorerUrl ? (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-slate-700"
            >
              {tradeState.txHash}
            </a>
          ) : (
            tradeState.txHash
          )}
        </dd>
        {tradeState.status === "confirmed" && (
          <>
            <dt className="text-slate-500">Filled</dt>
            <dd>{tradeState.filled}</dd>
            <dt className="text-slate-500">Price</dt>
            <dd>{tradeState.price.toFixed(2)}</dd>
          </>
        )}
      </dl>
    </Card>
  );
}
