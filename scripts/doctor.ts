// scripts/doctor.ts
//
// Manual connectivity check — run before a demo, not part of `npm test`.
// Verifies Somnia RPC reachability and (if BOT_OPERATOR_PRIVATE_KEY is set)
// the operator wallet's native balance for gas, per docs/getting-started.md's
// "empty wallet to a running bot" checklist.
import { config as loadEnv } from "dotenv";
import { createPublicClient, http, defineChain, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { loadDreamDexConfig } from "../lib/dreamdex/client";

// Unlike Next.js API routes, a standalone tsx script does not auto-load
// .env.local — load it explicitly so this script sees the same config a
// developer set up for `npm run dev`.
loadEnv({ path: ".env.local" });

async function main() {
  const config = loadDreamDexConfig();
  const chain = defineChain({
    id: config.chainId,
    name: `somnia-${config.chainId}`,
    nativeCurrency: { name: "Somnia Test Token", symbol: "STT", decimals: 18 },
    rpcUrls: { default: { http: [config.rpcUrl] } },
  });
  const client = createPublicClient({ chain, transport: http(config.rpcUrl) });

  const blockNumber = await client.getBlockNumber();
  console.log(`[DOCTOR] connected to ${config.rpcUrl} — block ${blockNumber}`);

  if (config.privateKey) {
    const account = privateKeyToAccount(config.privateKey as Hex);
    const balance = await client.getBalance({ address: account.address });
    console.log(`[DOCTOR] operator ${account.address} holds ${balance} wei native gas token`);
    if (balance === BigInt(0)) {
      console.warn(`[DOCTOR] WARNING: operator wallet has 0 gas — fund it at https://testnet.somnia.network`);
    }
  } else {
    console.log("[DOCTOR] BOT_OPERATOR_PRIVATE_KEY not set — skipping wallet balance check");
  }
}

main().catch((error) => {
  console.error("[DOCTOR] failed:", error);
  process.exit(1);
});
