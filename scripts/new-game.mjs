import fs from "node:fs";
import path from "node:path";

const id = process.argv[2];
const name = process.argv.slice(3).join(" ") || `METOK ${id}`;

if (!id || !/^game\d+$/.test(id)) {
  console.error("Usage: node scripts/new-game.mjs game002 \"Tên Game\"");
  process.exit(1);
}

const root = process.cwd();
const templateDir = path.join(root, "src/games/_template");
const gameDir = path.join(root, "src/games", id);
const publicDir = path.join(root, "public/games", id);

if (fs.existsSync(gameDir)) {
  console.error(`${id} đã tồn tại.`);
  process.exit(1);
}

fs.cpSync(templateDir, gameDir, { recursive: true });
fs.mkdirSync(publicDir, { recursive: true });

const configPath = path.join(gameDir, "config.ts");
let config = fs.readFileSync(configPath, "utf8");

config = config
  .replaceAll("game000", id)
  .replaceAll("METOK Game", name);

fs.writeFileSync(configPath, config);

const gamePath = path.join(gameDir, "Game.tsx");
let game = fs.readFileSync(gamePath, "utf8");

game = game
  .replaceAll("GameTemplate", `${id.toUpperCase()}Page`)
  .replaceAll("METOK Game", name);

fs.writeFileSync(gamePath, game);

console.log(`Created ${id}: ${name}`);
console.log(`Source: src/games/${id}`);
console.log(`Assets: public/games/${id}`);
