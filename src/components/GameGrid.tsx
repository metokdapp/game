import { games } from "../registry/games";
import { GameCard } from "./GameCard";

export function GameGrid() {
  return (
    <section className="game-grid">
      {games.map((game) => (
        <GameCard
          key={game.id}
          name={game.name}
          description={game.description}
          image={game.image}
          enabled={game.enabled}
          onPlay={() => {
            window.location.href = game.route;
          }}
        />
      ))}
    </section>
  );
}
