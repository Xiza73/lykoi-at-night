import type { Game } from "../../domain/game/game";
import type { Player } from "../../domain/game/player";
import { PrimaryButton } from "../components/PrimaryButton";
import { CatIcon } from "../components/CatIcon";

interface HunterViewProps {
  game: Game;
  /** The player the fallen Cazador picks to take down, if any. */
  targetId: string | null;
  onSelectTarget: (playerId: string) => void;
  /** Confirm taking the picked target (calls hunterRevenge with the target). */
  onConfirm: () => void;
  /** Confirm taking NOBODY (calls hunterRevenge with a null target). */
  onTakeNobody: () => void;
}

/**
 * The Cazador de Sombras' dying revenge, rendered while `game.pendingHunter` is
 * set. This step is PUBLIC: the hunter just died and is revealed, so any living
 * player (a Lykoi included) is a valid target. The view never kills anyone
 * itself — it collects the pick and hands it to `hunterRevenge`.
 */
export function HunterView({
  game,
  targetId,
  onSelectTarget,
  onConfirm,
  onTakeNobody,
}: HunterViewProps) {
  // Any living player can be taken — including the Lykoi that may have done it.
  const living = game.players.filter((player) => player.alive);
  const target = targetId
    ? game.players.find((player) => player.id === targetId)
    : undefined;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        height: "100%",
        animation: "lyk-rise .4s ease both",
      }}
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
          El Cazador de Sombras cae
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
          Antes de irse, se lleva a un gato con él.
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
        {living.map((player) => (
          <TargetTile
            key={player.id}
            player={player}
            selected={player.id === targetId}
            onSelect={() => onSelectTarget(player.id)}
          />
        ))}
      </div>

      <div
        style={{
          marginTop: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <PrimaryButton onClick={onConfirm} disabled={!target}>
          {target ? `Se lleva a ${target.name}` : "Elegí a quién llevarte"}
        </PrimaryButton>
        <button
          type="button"
          onClick={onTakeNobody}
          style={{
            padding: "12px",
            border: "1px solid #2a2d33",
            background: "rgba(255,255,255,.015)",
            color: "var(--lyk-ink)",
            fontSize: "12px",
            letterSpacing: ".14em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "border-color .2s, color .2s",
          }}
        >
          No llevarse a nadie
        </button>
      </div>
    </div>
  );
}

function TargetTile({
  player,
  selected,
  onSelect,
}: {
  player: Player;
  selected: boolean;
  onSelect: () => void;
}) {
  const tone = selected ? "var(--lyk-blood-bright)" : "var(--lyk-faint)";

  return (
    <button
      type="button"
      aria-label={`Llevarse a ${player.name}`}
      aria-pressed={selected}
      onClick={onSelect}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "9px",
        padding: "10px",
        border: `1px solid ${selected ? "var(--lyk-blood-bright)" : "#2a2d33"}`,
        background: selected
          ? "rgba(158,42,43,.1)"
          : "rgba(255,255,255,.015)",
        cursor: "pointer",
        textAlign: "left",
        transition: "border-color .2s, background .2s",
      }}
    >
      <CatIcon stroke={tone} />
      <span
        style={{
          fontSize: "13px",
          color: "var(--lyk-ink)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          minWidth: 0,
        }}
      >
        {player.name}
      </span>
    </button>
  );
}
