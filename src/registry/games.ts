import { lazy } from "react";

const Game001 = lazy(() => import("../games/game001/Game"));

export const games = [
  {
    id: "game001",
    name: "METOK Game 001",
    description: "Game on-chain đầu tiên của METOK",
    image: "/game/games/game001/cover.png",
    route: "/game001",
    enabled: true,
    component: Game001,
  },
] as const;
