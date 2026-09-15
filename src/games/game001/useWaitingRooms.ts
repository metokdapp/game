import { useEffect, useMemo, useState } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { CHAIN } from "../../core/network/chain";
import { GAME_ABI, GAME_ADDRESS } from "./contract";

export type WaitingRoom = {
  roomId: bigint;
  token: `0x${string}`;
  stake: bigint;
  feeBps: number;
  host: `0x${string}`;
  challenger: `0x${string}`;
  hostSession: `0x${string}`;
  challengerSession: `0x${string}`;
  hostBalance: bigint;
  challengerBalance: bigint;
  waitingDeadline: bigint;
  choiceDeadline: bigint;
  revealDeadline: bigint;
  matchId: bigint;
  roundId: number;
  hostLeaveAfterRound: boolean;
  challengerLeaveAfterRound: boolean;
  state: number;
};

export function useWaitingRooms() {
  const [now, setNow] = useState(0n);

  useEffect(() => {
    const tick = () => {
      setNow(BigInt(Math.floor(Date.now() / 1000)));
    };

    tick();
    const timer = window.setInterval(tick, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const nextRoomIdQuery = useReadContract({
    address: GAME_ADDRESS,
    abi: GAME_ABI,
    functionName: "nextRoomId",
    chainId: CHAIN.id,
    query: {
      refetchInterval: 3000,
    },
  });

  const nextRoomId =
    (nextRoomIdQuery.data as bigint | undefined) ?? 1n;

  const contracts = useMemo(() => {
    const items = [];

    for (let id = 1n; id < nextRoomId; id++) {
      items.push({
        address: GAME_ADDRESS,
        abi: GAME_ABI,
        functionName: "getRoom",
        args: [id],
        chainId: CHAIN.id,
      } as const);
    }

    return items;
  }, [nextRoomId]);

  const roomsQuery = useReadContracts({
    contracts,
    allowFailure: true,
    query: {
      enabled: contracts.length > 0,
      refetchInterval: 3000,
    },
  });

  const waitingRooms = useMemo(() => {
    const rows: WaitingRoom[] = [];

    for (let index = 0; index < (roomsQuery.data?.length ?? 0); index++) {
      const item = roomsQuery.data?.[index];

      if (!item || item.status !== "success") continue;

      const room = item.result as WaitingRoom | undefined;
      if (!room) continue;

      if (
        room.state === 1 &&
        room.waitingDeadline > now &&
        room.hostBalance >= room.stake
      ) {
        rows.push({
          ...room,
          roomId: BigInt(index + 1),
        });
      }
    }

    return rows.sort((a, b) =>
      a.roomId > b.roomId ? -1 : a.roomId < b.roomId ? 1 : 0,
    );
  }, [roomsQuery.data, now]);

  return {
    waitingRooms,
    isLoading: nextRoomIdQuery.isLoading || roomsQuery.isLoading,
    now,
    refetch: async () => {
      await nextRoomIdQuery.refetch();
      await roomsQuery.refetch();
    },
  };
}
