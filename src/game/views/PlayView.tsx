import type { Game } from "../../domain/game/game";
import { ACCUSATIONS_FOR_TRIAL } from "../../domain/game/game";
import type { Player } from "../../domain/game/player";
import { PrimaryButton } from "../components/PrimaryButton";
import { CatIcon } from "../components/CatIcon";
import { phaseTone } from "../components/phaseStyle";

interface PlayViewProps {
  game: Game;
  onAccuse: (playerId: string) => void;
  onAdvancePhase: () => void;
}

/**
 * The daytime board: every player as a tile with alive/dead state, accusation
 * count (n/7) and an on-trial highlight. Tapping a living player accuses them.
 * A pacing button toggles day/night — night has no action yet.
 */
export function PlayView({ game, onAccuse, onAdvancePhase }: PlayViewProps) {
  const isNight = game.phase === "night";
  const tone = phaseTone(game.phase);

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
          {isNight ? "Cae la noche" : "El callejón murmura"}
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
          {isNight
            ? "Todos cierran los ojos. La noche aún no muerde: no hay acción nocturna todavía."
            : `Toca a un gato vivo para señalarlo. Con ${ACCUSATIONS_FOR_TRIAL} marcas empieza su juicio.`}
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
            accusations={game.accusations[player.id] ?? 0}
            disabled={isNight || !player.alive || game.onTrial !== null}
            onAccuse={() => onAccuse(player.id)}
          />
        ))}
      </div>

      <div style={{ marginTop: "auto" }}>
        <PrimaryButton
          variant={isNight ? "gold" : "ghost"}
          onClick={onAdvancePhase}
          style={isNight ? undefined : { borderColor: tone, color: tone }}
        >
          {isNight ? "Amanece" : "Que caiga la noche"}
        </PrimaryButton>
      </div>
    </div>
  );
}

function PlayerTile({
  player,
  accusations,
  disabled,
  onAccuse,
}: {
  player: Player;
  accusations: number;
  disabled: boolean;
  onAccuse: () => void;
}) {
  const dead = !player.alive;
  const tone = dead ? "var(--lyk-faint)" : "var(--lyk-gold)";
  const status = dead
    ? "Caído"
    : `${accusations}/${ACCUSATIONS_FOR_TRIAL}`;

  return (
    <button
      type="button"
      aria-label={`Señalar a ${player.name}${dead ? " (caído)" : ""}`}
      disabled={disabled}
      onClick={onAccuse}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "9px",
        padding: "10px",
        border: `1px solid ${dead ? "#1d1f24" : "#2a2d33"}`,
        background: dead ? "rgba(0,0,0,.2)" : "rgba(255,255,255,.015)",
        opacity: dead ? 0.45 : 1,
        cursor: disabled ? "default" : "pointer",
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
