import "./App.css";
import { Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import { GameGrid } from "./components/GameGrid";
import Game001 from "./games/game001/Game";

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

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game001" element={<Game001 />} />
      </Routes>
    </>
  );
}

export default App;
