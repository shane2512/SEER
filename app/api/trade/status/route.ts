import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { loadDreamDexConfig, resolveSomniaChain } from "@/lib/dreamdex/client";
import { pollTradeStatus, type ReceiptReader } from "@/lib/blockchain/client";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const txHash = url.searchParams.get("txHash");
  if (!txHash || !txHash.startsWith("0x")) {
    return NextResponse.json({ error: "txHash query parameter is required" }, { status: 400 });
  }

  try {
    const config = loadDreamDexConfig();
    const chain = resolveSomniaChain(config);
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
    console.log(`[TRADE] status polled for tx=${txHash}`);
    return NextResponse.json({ state });
  } catch (error) {
    console.error("[TRADE] failed to poll trade status", error);
    return NextResponse.json({ error: "Unable to check trade status right now." }, { status: 502 });
  }
}
