import { useNavigate } from "react-router-dom";
import { games } from "../registry/games";
import { GameCard } from "./GameCard";

export function GameGrid() {
  const navigate = useNavigate();

  return (
    <section className="game-grid">
      {games.map((game) => (
        <GameCard
          key={game.id}
          name={game.name}
          description={game.description}
          image={game.image}
          enabled={game.enabled}
          onPlay={() => navigate(game.route)}
        />
      ))}
    </section>
  );
}
