"use client";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useBalances } from "@/hooks/useBalances";
import { useBrowserExchange } from "@/hooks/useBrowserExchange";

const STT_FAUCET_URL = "https://cloud.google.com/application/web3/faucet/somnia/shannon";

/** Shown only when a connected wallet can't cover gas or a demo trade —
 *  prevents a new visitor from ever hitting the raw RPC "insufficient
 *  balance" error this session diagnosed live. Rendered as nothing when
 *  both balances are healthy, or before a wallet is connected at all. */
export function FundingCard() {
  const { sttLow, tUsdcLow, refetch } = useBalances();
  const exchange = useBrowserExchange();
  const [minting, setMinting] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);

  if (!sttLow && !tUsdcLow) return null;

  async function mintTestUsdc() {
    if (!exchange) return;
    setMinting(true);
    setMintError(null);
    try {
      await exchange.trader.faucet();
      refetch();
    } catch (err) {
      setMintError(err instanceof Error ? err.message : String(err));
    } finally {
      setMinting(false);
    }
  }

  return (
    <Card>
      <h3 className="font-semibold">Fund your wallet</h3>
      <div className="mt-2 space-y-2 text-sm">
        {sttLow && (
          <p>
            Low on STT (gas) —{" "}
            <a href={STT_FAUCET_URL} target="_blank" rel="noopener noreferrer" className="underline">
              Get STT from Google Cloud&apos;s faucet
            </a>
            .
          </p>
        )}
        {tUsdcLow && (
          <div className="flex items-center gap-2">
            <span>Low on TestUSDC —</span>
            <Button onClick={mintTestUsdc} disabled={minting || !exchange}>
              {minting ? "Minting…" : "Mint TestUSDC"}
            </Button>
          </div>
        )}
        {mintError && <p className="text-rose-600">{mintError}</p>}
      </div>
    </Card>
  );
}
