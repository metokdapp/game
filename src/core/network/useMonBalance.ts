import { useAccount, useBalance } from "wagmi";
import { formatEther } from "viem";

export function useMonBalance() {
  const { address } = useAccount();

  const { data, isLoading, refetch } = useBalance({
    address,
    query: {
      enabled: !!address,
    },
  });

  return {
    balance: data?.value,
    formattedBalance:
      data?.value !== undefined ? formatEther(data.value) : "0",
    symbol: data?.symbol || "MON",
    isLoading,
    refetch,
  };
}
