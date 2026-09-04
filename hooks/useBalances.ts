"use client";
import { useCallback, useEffect, useState } from "react";
import { createPublicClient, http } from "viem";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";
import { SOMNIA_TESTNET_ADDRESSES } from "@somnia-chain/markets-sdk";
import { useWallet } from "./useWallet";
import { useBrowserExchange } from "./useBrowserExchange";

// The SDK's default write gas ceiling (10,000,000) at a representative
// testnet gas price made the upfront balance-covers-gas-ceiling check fail
// at 0.27 STT and pass at 1.27 STT during this session's live debugging of
// a real "approve reverted: Missing or invalid parameters" incident (the
// message is misleading — the real cause was insufficient native balance to
// cover the tx's declared gas ceiling, not a malformed parameter). 0.6 STT
// is a safety margin comfortably inside that observed range.
const STT_LOW_THRESHOLD = BigInt("600000000000000000"); // 0.6 STT, 18dp

const MAX_ORDER_SIZE_DISPLAY = Number(process.env.NEXT_PUBLIC_MAX_ORDER_SIZE ?? "20");

export function useBalances() {
  const { address, isConnected } = useWallet();
  const exchange = useBrowserExchange();
  const [stt, setStt] = useState<bigint | null>(null);
  const [tUsdc, setTUsdc] = useState<bigint | null>(null);
  const [tUsdcDecimals, setTUsdcDecimals] = useState(6);

  const refetch = useCallback(() => {
    if (!isConnected || !address || !exchange) {
      setStt(null);
      setTUsdc(null);
      return;
    }
    const publicClient = createPublicClient({ chain: somniaShannon, transport: http() });
    publicClient
      .getBalance({ address })
      .then(setStt)
      .catch(() => setStt(null)); // a transient RPC read failure must never block trading

    const collateral = SOMNIA_TESTNET_ADDRESSES.collateral ?? SOMNIA_TESTNET_ADDRESSES.testUsdc;
    if (!collateral) return;
    Promise.all([exchange.client.getErc20Balance(collateral, address), exchange.client.getErc20Metadata(collateral)])
      .then(([balance, metadata]) => {
        setTUsdc(balance);
        setTUsdcDecimals(metadata.decimals);
      })
      .catch(() => setTUsdc(null));
  }, [address, isConnected, exchange]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => refetch(), [refetch]);

  const sttLow = stt !== null && stt < STT_LOW_THRESHOLD;
  const tUsdcLowThreshold = BigInt(Math.round(MAX_ORDER_SIZE_DISPLAY * 10 ** tUsdcDecimals));
  const tUsdcLow = tUsdc !== null && tUsdc < tUsdcLowThreshold;

  return { stt, tUsdc, sttLow, tUsdcLow, refetch };
}
