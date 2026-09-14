import "./App.css";
import { Header } from "./components/Header";
import { GameGrid } from "./components/GameGrid";

function App() {
  return (
    <>
      <Header />

      <main>
        <h2>METOK Game Center</h2>
        <p>Chọn game để bắt đầu chơi.</p>

        <GameGrid />
      </main>
    </>
  );
}

export default App;
