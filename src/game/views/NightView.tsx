import { useState } from "react";
import type { Game } from "../../domain/game/game";
import { investigate, livingTown, peekRole } from "../../domain/game/game";
import type { Player } from "../../domain/game/player";
import { roleInfo } from "../roleLabels";
import { PrimaryButton } from "../components/PrimaryButton";
import { CatIcon } from "../components/CatIcon";

/**
 * The night's ordered sub-steps, owned by the container. Every role turn is
 * ALWAYS shown (gate then action) so nobody can infer who is still alive from
 * which turns appear.
 */
export type NightStep =
  | "guardian-gate"
  | "guardian-pick"
  | "wolf-gate"
  | "wolf-pick"
  | "infector-gate"
  | "infector-pick"
  | "seer-gate"
  | "seer-pick"
  | "gossip-gate"
  | "gossip-pick"
  | "dawn";

interface NightViewProps {
  game: Game;
  step: NightStep;
  /** The Guardian's warded player, or null for "nobody". */
  protectedId: string | null;
  /** The Lykoi's chosen victim, once picked. */
  wolfTargetId: string | null;
  /** The Madre Camada's chosen townsperson to convert, or null for "pass". */
  infectTargetId: string | null;
  /** The player the Seer looked at this night, if any. */
  seerTargetId: string | null;
  /** The dead cat La Chismosa peeked this night, if any. */
  gossipTargetId: string | null;
  /** Whether the wolves' victim died this night (from the dawn snapshot). */
  victimName: string | null;
  onOpenGate: (next: NightStep) => void;
  onSelectProtected: (playerId: string | null) => void;
  onConfirmProtected: () => void;
  onSelectWolfTarget: (playerId: string) => void;
  onConfirmWolfTarget: () => void;
  onSelectInfectTarget: (playerId: string | null) => void;
  onConfirmInfectTarget: () => void;
  onSelectSeerTarget: (playerId: string) => void;
  /** Advances past the Seer's reading (to La Chismosa's turn or straight to dawn). */
  onConfirmSeer: () => void;
  onSelectGossipTarget: (playerId: string) => void;
  onResolve: () => void;
  onDawnContinue: () => void;
}

/**
 * The night flow, rendered while `game.phase === "night"` (and through dawn).
 * It never computes deaths or protection itself — the container collects the
 * ward, victim and seer reading and routes them through `resolveNight`. This
 * view only paints the pass-and-play sub-steps and reports the outcome at dawn.
 */
export function NightView({
  game,
  step,
  protectedId,
  wolfTargetId,
  infectTargetId,
  seerTargetId,
  gossipTargetId,
  victimName,
  onOpenGate,
  onSelectProtected,
  onConfirmProtected,
  onSelectWolfTarget,
  onConfirmWolfTarget,
  onSelectInfectTarget,
  onConfirmInfectTarget,
  onSelectSeerTarget,
  onConfirmSeer,
  onSelectGossipTarget,
  onResolve,
  onDawnContinue,
}: NightViewProps) {
  const living = game.players.filter((player) => player.alive);
  // The wolves never target their own pack: their prey list is the living
  // townsfolk only. The seer and guardian still act on every living player.
  const wolfCandidates = livingTown(game);

  if (step === "guardian-gate") {
    return (
      <Frame
        title="El Guardián del Umbral"
        body="Pásale el teléfono al Guardián del Umbral. Que los demás aparten la mirada."
      >
        <div style={{ marginTop: "auto" }}>
          <PrimaryButton onClick={() => onOpenGate("guardian-pick")}>
            Ya lo tengo
          </PrimaryButton>
        </div>
      </Frame>
    );
  }

  if (step === "guardian-pick") {
    return (
      <Frame
        title="Vela una puerta"
        body="Vela a un gato esta noche. Si no sos el Guardián, pasá sin tocar."
      >
        <PlayerGrid
          players={living}
          selectedId={protectedId}
          actionLabel={(name) => `Velar a ${name}`}
          onSelect={onSelectProtected}
        />
        <PassOption
          label="Nadie / pasar"
          selected={protectedId === null}
          onClick={() => onSelectProtected(null)}
        />
        <div style={{ marginTop: "auto" }}>
          <PrimaryButton onClick={onConfirmProtected}>Listo</PrimaryButton>
        </div>
      </Frame>
    );
  }

  if (step === "wolf-gate") {
    return (
      <Frame
        title="Los Lykoi"
        body="Pásale el teléfono a los Lykoi. Que los demás aparten la mirada."
      >
        <div style={{ marginTop: "auto" }}>
          <PrimaryButton onClick={() => onOpenGate("wolf-pick")}>
            Somos los Lykoi
          </PrimaryButton>
        </div>
      </Frame>
    );
  }

  if (step === "wolf-pick") {
    return (
      <Frame
        title="La caza"
        body="Elijan a quién se lleva la oscuridad."
      >
        <PlayerGrid
          players={wolfCandidates}
          selectedId={wolfTargetId}
          actionLabel={(name) => `Elegir a ${name}`}
          onSelect={onSelectWolfTarget}
        />
        <div style={{ marginTop: "auto" }}>
          <PrimaryButton
            onClick={onConfirmWolfTarget}
            disabled={wolfTargetId === null}
          >
            Sellar la presa
          </PrimaryButton>
        </div>
      </Frame>
    );
  }

  if (step === "infector-gate") {
    return (
      <Frame
        title="La Madre Camada"
        body="Pásale el teléfono a la Madre Camada. Que los demás aparten la mirada."
      >
        <div style={{ marginTop: "auto" }}>
          <PrimaryButton onClick={() => onOpenGate("infector-pick")}>
            Ya lo tengo
          </PrimaryButton>
        </div>
      </Frame>
    );
  }

  if (step === "infector-pick") {
    return (
      <Frame
        title="La camada crece"
        body="Convertí a un gato en uno de los tuyos — una vez por partida. Si no sos la Madre Camada o ya lo usaste, pasá sin tocar."
      >
        <PlayerGrid
          players={livingTown(game)}
          selectedId={infectTargetId}
          actionLabel={(name) => `Convertir a ${name}`}
          onSelect={onSelectInfectTarget}
        />
        <PassOption
          label="No convertir / pasar"
          selected={infectTargetId === null}
          onClick={() => onSelectInfectTarget(null)}
        />
        <div style={{ marginTop: "auto" }}>
          <PrimaryButton onClick={onConfirmInfectTarget}>Listo</PrimaryButton>
        </div>
      </Frame>
    );
  }

  if (step === "seer-gate") {
    return (
      <Frame
        title="La Vidente del Alféizar"
        body="Pásale el teléfono a la Vidente del Alféizar. Que los demás aparten la mirada."
      >
        <div style={{ marginTop: "auto" }}>
          <PrimaryButton onClick={() => onOpenGate("seer-pick")}>
            Ya lo tengo
          </PrimaryButton>
        </div>
      </Frame>
    );
  }

  if (step === "seer-pick") {
    const target = seerTargetId
      ? game.players.find((player) => player.id === seerTargetId)
      : undefined;
    const reading = target ? investigate(game, target.id) : null;
    const readingText =
      target && reading
        ? reading === "wolves"
          ? `${target.name} esconde algo bajo el pelaje.`
          : `${target.name} ronronea de verdad.`
        : null;
    const readingTone =
      reading === "wolves" ? "var(--lyk-blood-bright)" : "var(--lyk-gold)";

    return (
      <Frame
        title="La visión"
        body="Mira a un gato. Si no sos la Vidente, pasá sin tocar."
      >
        <PlayerGrid
          players={living}
          selectedId={seerTargetId}
          actionLabel={(name) => `Mirar a ${name}`}
          onSelect={onSelectSeerTarget}
        />
        {readingText ? (
          <div
            style={{
              padding: "12px 14px",
              borderLeft: `2px solid ${readingTone}`,
              background: "rgba(255,255,255,.03)",
              fontSize: "13px",
              lineHeight: 1.5,
              color: "var(--lyk-ink)",
            }}
          >
            {readingText}
          </div>
        ) : null}
        <div style={{ marginTop: "auto" }}>
          <PrimaryButton onClick={onConfirmSeer}>Listo</PrimaryButton>
        </div>
      </Frame>
    );
  }

  if (step === "gossip-gate") {
    return (
      <Frame
        title="La Chismosa"
        body="Pásale el teléfono a La Chismosa. Que los demás aparten la mirada."
      >
        <div style={{ marginTop: "auto" }}>
          <PrimaryButton onClick={() => onOpenGate("gossip-pick")}>
            Ya lo tengo
          </PrimaryButton>
        </div>
      </Frame>
    );
  }

  if (step === "gossip-pick") {
    const dead = game.players.filter((player) => !player.alive);
    const target = gossipTargetId
      ? game.players.find((player) => player.id === gossipTargetId)
      : undefined;
    const peekedRole = target ? peekRole(game, target.id) : null;
    const gossipText =
      target && peekedRole
        ? `${target.name} era ${roleInfo(peekedRole).name}.`
        : null;

    if (dead.length === 0) {
      return (
        <Frame
          title="El chisme"
          body="Todavía no ha caído nadie. No hay chisme esta noche."
        >
          <div style={{ marginTop: "auto" }}>
            <PrimaryButton onClick={onResolve}>Listo</PrimaryButton>
          </div>
        </Frame>
      );
    }

    return (
      <Frame
        title="El chisme"
        body="Espía el rol de un gato caído. Si no sos La Chismosa, pasá sin tocar."
      >
        <PlayerGrid
          players={dead}
          selectedId={gossipTargetId}
          actionLabel={(name) => `Espiar a ${name}`}
          onSelect={onSelectGossipTarget}
        />
        {gossipText ? (
          <div
            style={{
              padding: "12px 14px",
              borderLeft: "2px solid var(--lyk-gold)",
              background: "rgba(255,255,255,.03)",
              fontSize: "13px",
              lineHeight: 1.5,
              color: "var(--lyk-ink)",
            }}
          >
            {gossipText}
          </div>
        ) : null}
        <div style={{ marginTop: "auto" }}>
          <PrimaryButton onClick={onResolve}>Listo</PrimaryButton>
        </div>
      </Frame>
    );
  }

  // step === "dawn". The container has already run resolveNight and captured a
  // snapshot of whether the victim fell.
  const fell = victimName !== null;
  return (
    <Frame
      title="Amanece"
      body={
        fell
          ? `Amanece. ${victimName} no volvió al callejón.`
          : "Amaneció sin bajas. Alguien veló una puerta."
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
        {fell
          ? `La oscuridad se llevó a ${victimName}.`
          : "El umbral resistió. Nadie cayó esta noche."}
      </div>
      <div style={{ marginTop: "auto" }}>
        <PrimaryButton onClick={onDawnContinue}>Volver al callejón</PrimaryButton>
      </div>
    </Frame>
  );
}

/**
 * The private, two-beat "you were turned" gate shown to a freshly-infected
 * player before the dawn announcement. First it hands them the phone, then it
 * tells them, privately, that they now hunt with the Lykoi.
 */
export function TurnedView({
  name,
  onContinue,
}: {
  name: string;
  onContinue: () => void;
}) {
  const [revealed, setRevealed] = useState(false);

  if (!revealed) {
    return (
      <Frame title="Algo cambió" body={`Pásale el teléfono a ${name}.`}>
        <div style={{ marginTop: "auto" }}>
          <PrimaryButton onClick={() => setRevealed(true)}>
            Ya lo tengo
          </PrimaryButton>
        </div>
      </Frame>
    );
  }

  return (
    <Frame
      title="La mordida"
      body="Anoche te mordieron. Ahora cazás con los Lykoi."
    >
      <div
        style={{
          padding: "12px 14px",
          borderLeft: "2px solid var(--lyk-blood-bright)",
          background: "rgba(255,255,255,.03)",
          fontSize: "13px",
          lineHeight: 1.5,
          color: "var(--lyk-ink)",
        }}
      >
        Guardá el secreto. A partir de esta noche, la camada es tu manada.
      </div>
      <div style={{ marginTop: "auto" }}>
        <PrimaryButton onClick={onContinue}>Entendido</PrimaryButton>
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

/** The "nobody / pass" option shared by the ward and (implicitly) seer turns. */
function PassOption({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      onClick={onClick}
      style={{
        padding: "12px",
        border: `1px solid ${selected ? "var(--lyk-gold)" : "#2a2d33"}`,
        background: "rgba(255,255,255,.015)",
        color: selected ? "var(--lyk-gold)" : "var(--lyk-ink)",
        fontSize: "12px",
        letterSpacing: ".14em",
        textTransform: "uppercase",
        cursor: "pointer",
        transition: "border-color .2s, color .2s",
      }}
    >
      {label}
    </button>
  );
}

/**
 * A grid of living players. Tapping a tile selects it (highlight); the selected
 * id is controlled by the parent.
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
