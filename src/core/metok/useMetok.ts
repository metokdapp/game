import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { METOK_ABI } from "./abi";
import { METOK } from "./config";
import { CHAIN } from "../network/chain";

export function useMetok() {
  const { address } = useAccount();

  const { data: balance, isLoading, refetch } = useReadContract({
    address: METOK.address,
    abi: METOK_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: CHAIN.id,
    query: {
      enabled: !!address,
    },
  });

  const formattedBalance =
    balance !== undefined ? formatUnits(balance, 18) : "0";

  return {
    balance,
    formattedBalance,
    isLoading,
    refetch,
  };
}
