"use client";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

function truncate(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function ConnectWalletButton() {
  const { address, isConnected, isWrongNetwork, isConnecting, isSwitching, connect, disconnect, switchToSomnia } =
    useWallet();

  if (!isConnected) {
    return (
      <Button onClick={connect} disabled={isConnecting}>
        {isConnecting ? "Connecting…" : "Connect Wallet"}
      </Button>
    );
  }

  if (isWrongNetwork) {
    return (
      <div className="flex items-center gap-2">
        <Badge tone="bearish">Wrong network</Badge>
        <Button onClick={switchToSomnia} disabled={isSwitching}>
          {isSwitching ? "Switching…" : "Switch to Somnia Shannon"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge tone="neutral">{address ? truncate(address) : ""}</Badge>
      <button onClick={() => disconnect()} className="text-sm text-slate-500 underline">
        Disconnect
      </button>
    </div>
  );
}
