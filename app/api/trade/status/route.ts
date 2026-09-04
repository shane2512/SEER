import { NextResponse } from "next/server";
import { createPublicClient, http, defineChain } from "viem";
import { loadDreamDexConfig } from "@/lib/dreamdex/client";
import { pollTradeStatus, type ReceiptReader } from "@/lib/blockchain/client";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const txHash = url.searchParams.get("txHash");
  if (!txHash || !txHash.startsWith("0x")) {
    return NextResponse.json({ error: "txHash query parameter is required" }, { status: 400 });
  }

  const config = loadDreamDexConfig();
  const chain = defineChain({
    id: config.chainId,
    name: `somnia-${config.chainId}`,
    nativeCurrency: { name: "Somnia Test Token", symbol: "STT", decimals: 18 },
    rpcUrls: { default: { http: [config.rpcUrl] } },
  });
  const client = createPublicClient({ chain, transport: http(config.rpcUrl) });
  const reader: ReceiptReader = {
    getTransactionReceipt: async (hash) => {
      try {
        const receipt = await client.getTransactionReceipt({ hash });
        return { status: receipt.status === "success" ? "success" : "reverted" };
      } catch {
        return null; // not mined yet
      }
    },
  };

  const state = await pollTradeStatus(reader, txHash as `0x${string}`, { attempts: 1, intervalMs: 0 });
  return NextResponse.json({ state });
}
