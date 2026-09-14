import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <main>
      <h1>Game not found</h1>
      <p>Game này không tồn tại hoặc chưa được thêm vào METOK Game Center.</p>
      <Link to="/">← Game Center</Link>
    </main>
  );
}
