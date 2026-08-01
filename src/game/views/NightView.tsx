import type { Game } from "../../domain/game/game";
import type { Player } from "../../domain/game/player";
import { PrimaryButton } from "../components/PrimaryButton";
import { CatIcon } from "../components/CatIcon";

/** The night's ordered sub-steps, owned by the container. */
export type NightStep = "gate" | "pick" | "ward" | "dawn";

interface NightViewProps {
  game: Game;
  step: NightStep;
  /** The witches' chosen victim, once picked. */
  victimId: string | null;
  /** The player warded by the Guardian, or null for "nobody". */
  wardedId: string | null;
  onOpenGate: () => void;
  onSelectVictim: (playerId: string) => void;
  onConfirmVictim: () => void;
  onSelectWard: (playerId: string | null) => void;
  onConfirmWard: () => void;
  onDawnContinue: () => void;
}

/**
 * The night flow, rendered while `game.phase === "night"`. It never computes
 * deaths or protection itself — the container collects the victim and ward and
 * routes them through `resolveNight`. This view only paints the pass-and-play
 * sub-steps and reports the resolved outcome at dawn.
 */
export function NightView({
  game,
  step,
  victimId,
  wardedId,
  onOpenGate,
  onSelectVictim,
  onConfirmVictim,
  onSelectWard,
  onConfirmWard,
  onDawnContinue,
}: NightViewProps) {
  const living = game.players.filter((player) => player.alive);

  if (step === "gate") {
    return (
      <Frame
        title="Cae la noche"
        body="Pásale el teléfono a los Lykoi. Que los demás aparten la mirada."
      >
        <div style={{ marginTop: "auto" }}>
          <PrimaryButton onClick={onOpenGate}>Somos los Lykoi</PrimaryButton>
        </div>
      </Frame>
    );
  }

  if (step === "pick") {
    return (
      <Frame
        title="La caza"
        body="Cae la noche. Elijan a quién se lleva la oscuridad."
      >
        <PlayerGrid
          players={living}
          selectedId={victimId}
          actionLabel={(name) => `Elegir a ${name}`}
          onSelect={onSelectVictim}
        />
        <div style={{ marginTop: "auto" }}>
          <PrimaryButton onClick={onConfirmVictim} disabled={victimId === null}>
            Sellar la presa
          </PrimaryButton>
        </div>
      </Frame>
    );
  }

  if (step === "ward") {
    return (
      <Frame
        title="El Guardián del Umbral"
        body="Guardián del Umbral, si sigues en pie, vela a un gato. Si no eres tú, pasa sin tocar."
      >
        <PlayerGrid
          players={living}
          selectedId={wardedId}
          actionLabel={(name) => `Velar a ${name}`}
          onSelect={onSelectWard}
        />
        <button
          type="button"
          aria-label="Nadie / pasar"
          onClick={() => onSelectWard(null)}
          style={{
            padding: "12px",
            border: `1px solid ${wardedId === null ? "var(--lyk-gold)" : "#2a2d33"}`,
            background: "rgba(255,255,255,.015)",
            color: wardedId === null ? "var(--lyk-gold)" : "var(--lyk-ink)",
            fontSize: "12px",
            letterSpacing: ".14em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "border-color .2s, color .2s",
          }}
        >
          Nadie / pasar
        </button>
        <div style={{ marginTop: "auto" }}>
          <PrimaryButton onClick={onConfirmWard}>Sella la noche</PrimaryButton>
        </div>
      </Frame>
    );
  }

  // step === "dawn". The container has already run resolveNight, so we read the
  // resolved game to tell whether the victim fell.
  const victim = victimId
    ? game.players.find((player) => player.id === victimId)
    : undefined;
  const fell = victim ? !victim.alive : false;

  return (
    <Frame
      title="Amanece"
      body={
        fell && victim
          ? `Amanece. ${victim.name} no volvió al callejón.`
          : "Amaneció sin bajas. Alguien veló una puerta esta noche."
      }
    >
      <div
        style={{
          padding: "12px 14px",
          borderLeft: `2px solid ${fell ? "var(--lyk-blood-bright)" : "var(--lyk-gold)"}`,
          background: "rgba(255,255,255,.03)",
          fontSize: "13px",
          lineHeight: 1.5,
          color: "var(--lyk-ink)",
        }}
      >
        {fell && victim
          ? `La oscuridad se llevó a ${victim.name}.`
          : "El umbral resistió. Nadie cayó esta noche."}
      </div>
      <div style={{ marginTop: "auto" }}>
        <PrimaryButton onClick={onDawnContinue}>Volver al callejón</PrimaryButton>
      </div>
    </Frame>
  );
}

/** Shared night scaffold: title, body copy and a column of children. */
function Frame({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: React.ReactNode;
}) {
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
          {title}
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
          {body}
        </p>
      </div>
      {children}
    </div>
  );
}

/**
 * A grid of living players, reusing the PlayView tile styling. Tapping a tile
 * selects it (highlight); the selected id is controlled by the parent.
 */
function PlayerGrid({
  players,
  selectedId,
  actionLabel,
  onSelect,
}: {
  players: readonly Player[];
  selectedId: string | null;
  actionLabel: (name: string) => string;
  onSelect: (playerId: string) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(112px, 1fr))",
        gap: "8px",
        overflowY: "auto",
        paddingRight: "2px",
      }}
    >
      {players.map((player) => {
        const selected = player.id === selectedId;
        const tone = selected ? "var(--lyk-gold)" : "var(--lyk-faint)";
        return (
          <button
            key={player.id}
            type="button"
            aria-label={actionLabel(player.name)}
            aria-pressed={selected}
            onClick={() => onSelect(player.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              padding: "10px",
              border: `1px solid ${selected ? "var(--lyk-gold)" : "#2a2d33"}`,
              background: selected
                ? "rgba(198,161,90,.08)"
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
      })}
    </div>
  );
}
