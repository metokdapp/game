import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { games } from "../registry/games";
import { GameCard } from "./GameCard";

export function GameGrid() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const filteredGames = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    if (!keyword) return games;

    return games.filter((game) =>
      `${game.name} ${game.description}`
        .toLowerCase()
        .includes(keyword)
    );
  }, [query]);

  return (
    <section>
      <input
        type="search"
        placeholder="Tìm game..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      <div className="game-grid">
        {filteredGames.map((game) => (
          <GameCard
            key={game.id}
            name={game.name}
            description={game.description}
            image={game.image}
            enabled={game.enabled}
            onPlay={() => navigate(game.route)}
          />
        ))}
      </div>
    </section>
  );
}
