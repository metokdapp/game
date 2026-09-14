import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import { Header } from "./components/Header";
import { GameGrid } from "./components/GameGrid";
import { NotFound } from "./components/NotFound";
import { games } from "./registry/games";

function Home() {
  return (
    <main>
      <h2>METOK Game Center</h2>
      <p>Chọn game để bắt đầu chơi.</p>
      <GameGrid />
    </main>
  );
}

function App() {
  return (
    <>
      <Header />

      <Suspense fallback={<main>Loading game...</main>}>
        <Routes>
          <Route path="/" element={<Home />} />

          {games.map((game) => {
            const GameComponent = game.component;

            return (
              <Route
                key={game.id}
                path={game.route}
                element={<GameComponent />}
              />
            );
          })}

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
