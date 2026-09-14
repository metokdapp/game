import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { METOK_ABI } from "./abi";
import { METOK } from "./config";

export function useMetok() {
  const { address } = useAccount();

  const { data: balance, isLoading, refetch } = useReadContract({
    address: METOK.address,
    abi: METOK_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
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
