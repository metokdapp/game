import {
  encodeAbiParameters,
  keccak256,
  parseAbiParameters,
  toHex,
  type Address,
  type Hex,
} from "viem";
import { CHAIN } from "../../core/network/chain";
import { GAME_ADDRESS } from "./contract";

export const RPS_CHOICE = {
  rock: 1,
  paper: 2,
  scissors: 3,
} as const;

export type RpsChoice =
  (typeof RPS_CHOICE)[keyof typeof RPS_CHOICE];

export type SavedReveal = {
  choice: RpsChoice;
  secret: Hex;
  commitment: Hex;
};

function storageKey(
  roomId: bigint,
  matchId: bigint,
  roundId: bigint,
  player: Address,
) {
  return [
    "metokrps",
    CHAIN.id,
    roomId.toString(),
    matchId.toString(),
    roundId.toString(),
    player.toLowerCase(),
  ].join(":");
}

export function createSecret(): Hex {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

export function makeCommitment(
  roomId: bigint,
  matchId: bigint,
  roundId: bigint,
  player: Address,
  choice: RpsChoice,
  secret: Hex,
): Hex {
  return keccak256(
    encodeAbiParameters(
      parseAbiParameters(
        "address,uint256,uint256,uint64,uint32,address,uint8,bytes32",
      ),
      [
        GAME_ADDRESS,
        BigInt(CHAIN.id),
        roomId,
        matchId,
        Number(roundId),
        player,
        choice,
        secret,
      ],
    ),
  );
}

export function saveReveal(
  roomId: bigint,
  matchId: bigint,
  roundId: bigint,
  player: Address,
  value: SavedReveal,
) {
  localStorage.setItem(
    storageKey(roomId, matchId, roundId, player),
    JSON.stringify(value),
  );
}

export function loadReveal(
  roomId: bigint,
  matchId: bigint,
  roundId: bigint,
  player: Address,
): SavedReveal | null {
  const raw = localStorage.getItem(
    storageKey(roomId, matchId, roundId, player),
  );

  if (!raw) return null;

  try {
    return JSON.parse(raw) as SavedReveal;
  } catch {
    return null;
  }
}

export function clearReveal(
  roomId: bigint,
  matchId: bigint,
  roundId: bigint,
  player: Address,
) {
  localStorage.removeItem(
    storageKey(roomId, matchId, roundId, player),
  );
}
