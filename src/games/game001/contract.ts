import type { Abi } from "viem";
import abi from "./abi.json";
import { GAME_CONFIG } from "./config";

export const GAME_ADDRESS = GAME_CONFIG.address;
export const GAME_ABI = abi as Abi;
