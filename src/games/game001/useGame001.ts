import { useAccount, useReadContract } from "wagmi";
import { METOK } from "../../core/metok/config";
import { METOK_ABI } from "../../core/metok/abi";
import { CHAIN } from "../../core/network/chain";
import { GAME_ABI, GAME_ADDRESS } from "./contract";

export function useGame001(roomId?: bigint) {
  const { address } = useAccount();

  const nextRoomId = useReadContract({
    address: GAME_ADDRESS,
    abi: GAME_ABI,
    functionName: "nextRoomId",
    chainId: CHAIN.id,
    query: {
      refetchInterval: 3000,
    },
  });

  const paused = useReadContract({
    address: GAME_ADDRESS,
    abi: GAME_ABI,
    functionName: "paused",
    chainId: CHAIN.id,
    query: {
      refetchInterval: 3000,
    },
  });

  const room = useReadContract({
    address: GAME_ADDRESS,
    abi: GAME_ABI,
    functionName: "getRoom",
    args: roomId && roomId > 0n ? [roomId] : undefined,
    chainId: CHAIN.id,
    query: {
      enabled: !!roomId && roomId > 0n,
      refetchInterval: 3000,
    },
  });

  const currentRound = useReadContract({
    address: GAME_ADDRESS,
    abi: GAME_ABI,
    functionName: "getCurrentRound",
    args: roomId && roomId > 0n ? [roomId] : undefined,
    chainId: CHAIN.id,
    query: {
      enabled: !!roomId && roomId > 0n,
      refetchInterval: 3000,
    },
  });

  const allowance = useReadContract({
    address: METOK.address,
    abi: METOK_ABI,
    functionName: "allowance",
    args: address ? [address, GAME_ADDRESS] : undefined,
    chainId: CHAIN.id,
    query: {
      enabled: !!address,
      refetchInterval: 3000,
    },
  });

  const balance = useReadContract({
    address: METOK.address,
    abi: METOK_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: CHAIN.id,
    query: {
      enabled: !!address,
      refetchInterval: 3000,
    },
  });

  const claimable = useReadContract({
    address: GAME_ADDRESS,
    abi: GAME_ABI,
    functionName: "claimable",
    args: address ? [METOK.address, address] : undefined,
    chainId: CHAIN.id,
    query: {
      enabled: !!address,
      refetchInterval: 3000,
    },
  });

  return {
    nextRoomId,
    paused,
    room,
    currentRound,
    allowance,
    balance,
    claimable,
  };
}
