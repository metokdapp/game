type GameCardProps = {
  name: string;
  description: string;
  image?: string;
  enabled: boolean;
  onPlay?: () => void;
};

export function GameCard({
  name,
  description,
  image,
  enabled,
  onPlay,
}: GameCardProps) {
  return (
    <article className="game-card">
      {image && <img src={image} alt={name} />}

      <h3>{name}</h3>
      <p>{description}</p>

      <button
        type="button"
        disabled={!enabled}
        onClick={onPlay}
      >
        {enabled ? "PLAY" : "COMING SOON"}
      </button>
    </article>
  );
}
