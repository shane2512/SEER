"use client";
// hooks/useWallet.ts
//
// wagmi@3 renamed several v2 hooks/fields to deprecated aliases (useAccount
// -> useConnection, useConnect().connect -> .mutate, useConnectors() split
// out of useConnect(), useDisconnect()/useSwitchChain()'s named mutate
// fields -> .mutate) while keeping the old names working as deprecated
// aliases — verified against node_modules/wagmi/dist/types/hooks/*.d.ts
// (the actual installed version, 3.7.7) rather than assumed from wagmi v2
// docs. This hook uses the canonical (non-deprecated) names throughout.
import { useConnection, useConnect, useConnectors, useDisconnect, useSwitchChain } from "wagmi";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";

export function useWallet() {
  const { address, isConnected, chainId } = useConnection();
  const { mutate: connectMutate, isPending: isConnecting } = useConnect();
  const connectors = useConnectors();
  const { mutate: disconnect } = useDisconnect();
  const { mutate: switchChain, isPending: isSwitching } = useSwitchChain();

  const isWrongNetwork = isConnected && chainId !== somniaShannon.id;

  function connect() {
    const injectedConnector = connectors[0];
    if (injectedConnector) connectMutate({ connector: injectedConnector });
  }

  function switchToSomnia() {
    switchChain({ chainId: somniaShannon.id });
  }

  return {
    address,
    isConnected,
    isWrongNetwork,
    isConnecting,
    isSwitching,
    connect,
    disconnect,
    switchToSomnia,
  };
}
