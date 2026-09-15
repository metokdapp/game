import { useWriteContract } from "wagmi";
import type { Hex } from "viem";
import { METOK } from "../../core/metok/config";
import { METOK_ABI } from "../../core/metok/abi";
import { CHAIN } from "../../core/network/chain";
import { GAME_ABI, GAME_ADDRESS } from "./contract";
import type { RpsChoice } from "./gameplay";

export function useGame001Actions() {
  const { writeContractAsync, isPending, error } = useWriteContract();

  async function approve(amount: bigint) {
    return writeContractAsync({
      address: METOK.address,
      abi: METOK_ABI,
      functionName: "approve",
      args: [GAME_ADDRESS, amount],
      chainId: CHAIN.id,
    });
  }

  async function createRoom(
    stake: bigint,
    bankroll: bigint,
    sessionKey: `0x${string}`,
  ) {
    return writeContractAsync({
      address: GAME_ADDRESS,
      abi: GAME_ABI,
      functionName: "createRoom",
      args: [METOK.address, stake, bankroll, sessionKey],
      chainId: CHAIN.id,
    });
  }

  async function joinRoom(
    roomId: bigint,
    bankroll: bigint,
    sessionKey: `0x${string}`,
  ) {
    return writeContractAsync({
      address: GAME_ADDRESS,
      abi: GAME_ABI,
      functionName: "joinRoom",
      args: [roomId, bankroll, sessionKey],
      chainId: CHAIN.id,
    });
  }

  async function confirmChoice(
    roomId: bigint,
    commitment: Hex,
  ) {
    return writeContractAsync({
      address: GAME_ADDRESS,
      abi: GAME_ABI,
      functionName: "confirmChoice",
      args: [roomId, commitment],
      chainId: CHAIN.id,
    });
  }

  async function revealChoice(
    roomId: bigint,
    choice: RpsChoice,
    secret: Hex,
  ) {
    return writeContractAsync({
      address: GAME_ADDRESS,
      abi: GAME_ABI,
      functionName: "revealChoice",
      args: [roomId, choice, secret],
      chainId: CHAIN.id,
    });
  }

  async function settleChoiceTimeout(
    roomId: bigint,
    choice: number,
    secret: Hex,
  ) {
    return writeContractAsync({
      address: GAME_ADDRESS,
      abi: GAME_ABI,
      functionName: "settleChoiceTimeout",
      args: [roomId, choice, secret],
      chainId: CHAIN.id,
    });
  }

  async function forceSettleChoiceTimeout(roomId: bigint) {
    return writeContractAsync({
      address: GAME_ADDRESS,
      abi: GAME_ABI,
      functionName: "forceSettleChoiceTimeout",
      args: [roomId],
      chainId: CHAIN.id,
    });
  }

  async function settleRevealTimeout(roomId: bigint) {
    return writeContractAsync({
      address: GAME_ADDRESS,
      abi: GAME_ABI,
      functionName: "settleRevealTimeout",
      args: [roomId],
      chainId: CHAIN.id,
    });
  }

  async function claim() {
    return writeContractAsync({
      address: GAME_ADDRESS,
      abi: GAME_ABI,
      functionName: "claim",
      args: [METOK.address],
      chainId: CHAIN.id,
    });
  }

  async function cancelWaitingRoom(roomId: bigint) {
    return writeContractAsync({
      address: GAME_ADDRESS,
      abi: GAME_ABI,
      functionName: "cancelWaitingRoom",
      args: [roomId],
      chainId: CHAIN.id,
    });
  }

  async function requestLeave(roomId: bigint) {
    return writeContractAsync({
      address: GAME_ADDRESS,
      abi: GAME_ABI,
      functionName: "requestLeave",
      args: [roomId],
      chainId: CHAIN.id,
    });
  }

  async function requestImmediateLeave(
    roomId: bigint,
    matchId: bigint,
    roundId: number,
  ) {
    return writeContractAsync({
      address: GAME_ADDRESS,
      abi: GAME_ABI,
      functionName: "requestImmediateLeave",
      args: [roomId, matchId, roundId],
      chainId: CHAIN.id,
    });
  }

  return {
    approve,
    createRoom,
    joinRoom,
    confirmChoice,
    revealChoice,
    settleChoiceTimeout,
    forceSettleChoiceTimeout,
    settleRevealTimeout,
    claim,
    cancelWaitingRoom,
    requestLeave,
    requestImmediateLeave,
    isPending,
    error,
  };
}
