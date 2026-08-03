import type { Game } from "../../domain/game/game";
import type { Player } from "../../domain/game/player";
import { PrimaryButton } from "../components/PrimaryButton";
import { CatIcon } from "../components/CatIcon";

interface DayViewProps {
  game: Game;
  /** The player picked as the day's suspect, if any. */
  suspectId: string | null;
  onSelectSuspect: (playerId: string) => void;
  /** Banish the current suspect (calls lynch). */
  onLynch: () => void;
  /** Skip the vote and fall straight into night (calls advancePhase). */
  onSkip: () => void;
}

/**
 * The daytime board: the town discusses and votes. Every player is a tile with
 * alive/dead state; tapping a living player marks them as the suspect. Then the
 * town either banishes them or lets the day pass without a lynch.
 */
export function DayView({
  game,
  suspectId,
  onSelectSuspect,
  onLynch,
  onSkip,
}: DayViewProps) {
  const suspect = suspectId
    ? game.players.find((player) => player.id === suspectId)
    : undefined;

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <h3
          style={{
            margin: 0,
            fontFamily: "var(--lyk-serif)",
            fontWeight: 400,
            fontSize: "clamp(24px, 6.5vw, 30px)",
            lineHeight: 1.1,
            color: "var(--lyk-ink-strong)",
          }}
        >
          El callejón murmura
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: "13.5px",
            lineHeight: 1.55,
            color: "var(--lyk-muted-2)",
            textWrap: "pretty",
          }}
        >
          Discutan en voz alta y voten. Toca a un gato para señalarlo como
          sospechoso.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(112px, 1fr))",
          gap: "8px",
          overflowY: "auto",
          paddingRight: "2px",
        }}
      >
        {game.players.map((player) => (
          <PlayerTile
            key={player.id}
            player={player}
            selected={player.id === suspectId}
            onSelect={() => onSelectSuspect(player.id)}
          />
        ))}
      </div>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
        <PrimaryButton onClick={onLynch} disabled={!suspect}>
          {suspect ? `Desterrar a ${suspect.name}` : "Elige un sospechoso"}
        </PrimaryButton>
        <PrimaryButton variant="ghost" onClick={onSkip}>
          Que nadie caiga hoy
        </PrimaryButton>
      </div>
    </div>
  );
}

function PlayerTile({
  player,
  selected,
  onSelect,
}: {
  player: Player;
  selected: boolean;
  onSelect: () => void;
}) {
  const dead = !player.alive;
  const tone = dead
    ? "var(--lyk-faint)"
    : selected
      ? "var(--lyk-gold)"
      : "var(--lyk-gold)";
  const status = dead ? "Caído" : selected ? "Señalado" : "En pie";

  return (
    <button
      type="button"
      aria-label={`Señalar a ${player.name}${dead ? " (caído)" : ""}`}
      aria-pressed={selected}
      disabled={dead}
      onClick={onSelect}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "9px",
        padding: "10px",
        border: `1px solid ${
          dead ? "#1d1f24" : selected ? "var(--lyk-gold)" : "#2a2d33"
        }`,
        background: dead
          ? "rgba(0,0,0,.2)"
          : selected
            ? "rgba(198,161,90,.08)"
            : "rgba(255,255,255,.015)",
        opacity: dead ? 0.45 : 1,
        cursor: dead ? "default" : "pointer",
        textAlign: "left",
        transition: "border-color .2s, background .2s",
      }}
    >
      <CatIcon stroke={tone} />
      <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
        <span
          style={{
            fontSize: "13px",
            color: "var(--lyk-ink)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textDecoration: dead ? "line-through" : "none",
          }}
        >
          {player.name}
        </span>
        <span
          style={{
            fontSize: "9.5px",
            letterSpacing: ".16em",
            textTransform: "uppercase",
            color: tone,
          }}
        >
          {status}
        </span>
      </div>
    </button>
  );
}
