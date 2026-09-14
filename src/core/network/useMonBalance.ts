import { useAccount, useBalance } from "wagmi";
import { formatEther } from "viem";
import { CHAIN } from "./chain";

export function useMonBalance() {
  const { address } = useAccount();

  const { data, isLoading, refetch } = useBalance({
    address,
    chainId: CHAIN.id,
    query: {
      enabled: !!address,
    },
  });

  return {
    balance: data?.value,
    formattedBalance:
      data?.value !== undefined ? formatEther(data.value) : "0",
    symbol: "MON",
    isLoading,
    refetch,
  };
}
