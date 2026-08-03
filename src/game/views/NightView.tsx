import type { Game } from "../../domain/game/game";
import { investigate, livingTown } from "../../domain/game/game";
import type { Player } from "../../domain/game/player";
import { isWolf } from "../../domain/game/roles";
import { roleInfo } from "../roleLabels";
import { PrimaryButton } from "../components/PrimaryButton";
import { CatIcon } from "../components/CatIcon";

/**
 * The night's sub-steps, owned by the container. The phone travels in SEAT
 * ORDER: each living player takes a "gate" (a hand-off named only by the seated
 * player, never by a role) and then an "action" dispatched by THAT player's own
 * role. When the last living player has acted the round resolves; the "dawn"
 * step reports the outcome. Because the flow is keyed on the seat's role — not
 * on which powers exist — a Básico game (only wolves + villagers) shows no
 * seer/guardian screens at all: those players simply pass.
 */
export type NightSubStep = "gate" | "action" | "dawn";

interface NightViewProps {
  game: Game;
  /** Which sub-step the pass is on. */
  subStep: NightSubStep;
  /** The living player currently holding the phone (undefined at dawn). */
  seated: Player | undefined;
  /** The vote round: 1, or 2 after a first-round tie. */
  round: 1 | 2;
  /** The Guardian's warded player this night, or null for "nobody". */
  protectedId: string | null;
  /** Votes cast so far this round, keyed by the voting wolf's id. */
  wolfVotes: Record<string, string>;
  /** The seer's chosen player for the current turn, if any. */
  seerTargetId: string | null;
  /** This wolf's chosen prey for the current turn, if any. */
  wolfTargetId: string | null;
  /** Whether the wolves' victim died this night (from the dawn snapshot). */
  victimName: string | null;
  /** Whether the double-tie spared the night (nobody was chosen). */
  spared: boolean;
  onOpenGate: () => void;
  onSelectProtected: (playerId: string | null) => void;
  onSelectSeerTarget: (playerId: string) => void;
  onSelectWolfTarget: (playerId: string) => void;
  /** Confirms the current player's action and passes on (or resolves). */
  onConfirmAction: () => void;
  onDawnContinue: () => void;
}

/**
 * The seating-order night flow, rendered while `game.phase === "night"` (and
 * through dawn). It never computes deaths or protection itself — the container
 * collects the ward and the pack's votes and routes them through
 * `resolveWolfVotes` + `resolveNight`. This view only paints the pass-and-play
 * turns and reports the outcome at dawn.
 */
export function NightView({
  game,
  subStep,
  seated,
  round,
  protectedId,
  wolfVotes,
  seerTargetId,
  wolfTargetId,
  victimName,
  spared,
  onOpenGate,
  onSelectProtected,
  onSelectSeerTarget,
  onSelectWolfTarget,
  onConfirmAction,
  onDawnContinue,
}: NightViewProps) {
  if (subStep === "dawn") {
    return <Dawn victimName={victimName} spared={spared} onContinue={onDawnContinue} />;
  }

  // Both "gate" and "action" need a seated player; the container only routes
  // here with one while the pass is running.
  if (!seated) {
    return null;
  }

  if (subStep === "gate") {
    return (
      <Frame
        title={`Le toca a ${seated.name}`}
        body={`Pásale el teléfono a ${seated.name}. Que los demás aparten la mirada.`}
      >
        <div style={{ marginTop: "auto" }}>
          <PrimaryButton onClick={onOpenGate}>Ya lo tengo</PrimaryButton>
        </div>
      </Frame>
    );
  }

  // subStep === "action": dispatched by the seated player's own role.
  return (
    <ActionTurn
      game={game}
      seated={seated}
      round={round}
      protectedId={protectedId}
      wolfVotes={wolfVotes}
      seerTargetId={seerTargetId}
      wolfTargetId={wolfTargetId}
      onSelectProtected={onSelectProtected}
      onSelectSeerTarget={onSelectSeerTarget}
      onSelectWolfTarget={onSelectWolfTarget}
      onConfirmAction={onConfirmAction}
    />
  );
}

/** The private action screen for the seated player, keyed on their role. */
function ActionTurn({
  game,
  seated,
  round,
  protectedId,
  wolfVotes,
  seerTargetId,
  wolfTargetId,
  onSelectProtected,
  onSelectSeerTarget,
  onSelectWolfTarget,
  onConfirmAction,
}: {
  game: Game;
  seated: Player;
  round: 1 | 2;
  protectedId: string | null;
  wolfVotes: Record<string, string>;
  seerTargetId: string | null;
  wolfTargetId: string | null;
  onSelectProtected: (playerId: string | null) => void;
  onSelectSeerTarget: (playerId: string) => void;
  onSelectWolfTarget: (playerId: string) => void;
  onConfirmAction: () => void;
}) {
  const living = game.players.filter((player) => player.alive);

  if (isWolf(seated.role)) {
    // On a second-round re-vote, a NON-wolf just passes: the pack alone re-votes,
    // so only wolves ever see this branch. (A non-wolf on round 2 is handled by
    // the villager branch below via the round guard.)
    const pack = game.players
      .filter((player) => isWolf(player.role) && player.id !== seated.id)
      .map((player) => player.name);
    // The wolves never target their own pack: candidates are living townsfolk.
    const candidates = livingTown(game);
    // The votes cast so far this round, rendered by voter and target name.
    const castLines = Object.entries(wolfVotes).map(([wolfId, targetId]) => {
      const wolf = game.players.find((player) => player.id === wolfId);
      const target = game.players.find((player) => player.id === targetId);
      return `${wolf?.name ?? "?"} votó por ${target?.name ?? "?"}`;
    });

    return (
      <Frame
        title="Sos un Lykoi"
        body="Votá a quién se lleva la oscuridad esta noche."
      >
        <Note tone="var(--lyk-blood-bright)">
          {pack.length > 0
            ? `La manada: ${pack.join(", ")}`
            : "Cazás en soledad esta noche."}
        </Note>
        {castLines.length > 0 ? (
          <Note tone="var(--lyk-gold)">
            {castLines.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </Note>
        ) : null}
        <PlayerGrid
          players={candidates}
          selectedId={wolfTargetId}
          actionLabel={(name) => `Votar por ${name}`}
          onSelect={onSelectWolfTarget}
        />
        <div style={{ marginTop: "auto" }}>
          <PrimaryButton onClick={onConfirmAction} disabled={wolfTargetId === null}>
            Confirmar voto
          </PrimaryButton>
        </div>
      </Frame>
    );
  }

  // On a re-vote round, non-wolves take no action: they just pass through.
  if (round === 2) {
    return (
      <Frame
        title="La manada volvió a dudar"
        body="Vos no votás — pasá."
      >
        <div style={{ marginTop: "auto" }}>
          <PrimaryButton onClick={onConfirmAction}>Siguiente</PrimaryButton>
        </div>
      </Frame>
    );
  }

  if (seated.role === "seer") {
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
      <Frame title="Sos la Vidente" body="Mirá a un gato y sabé si ronronea de verdad.">
        <PlayerGrid
          players={living}
          selectedId={seerTargetId}
          actionLabel={(name) => `Mirar a ${name}`}
          onSelect={onSelectSeerTarget}
        />
        {readingText ? <Note tone={readingTone}>{readingText}</Note> : null}
        <div style={{ marginTop: "auto" }}>
          <PrimaryButton onClick={onConfirmAction}>Listo</PrimaryButton>
        </div>
      </Frame>
    );
  }

  if (seated.role === "guardian") {
    return (
      <Frame title="Sos el Guardián del Umbral" body="Velá a un gato esta noche; quien esté detrás, sobrevive.">
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
          <PrimaryButton onClick={onConfirmAction}>Listo</PrimaryButton>
        </div>
      </Frame>
    );
  }

  // hunter and villager: no night action.
  return (
    <Frame
      title={`Sos ${roleInfo(seated.role).name}`}
      body="Dormís tranquilo, nada que hacer esta noche."
    >
      <div style={{ marginTop: "auto" }}>
        <PrimaryButton onClick={onConfirmAction}>Listo</PrimaryButton>
      </div>
    </Frame>
  );
}

/** The dawn report, after the container has resolved the pack's votes. */
function Dawn({
  victimName,
  spared,
  onContinue,
}: {
  victimName: string | null;
  spared: boolean;
  onContinue: () => void;
}) {
  const fell = victimName !== null;
  return (
    <Frame
      title="Amanece"
      body={
        fell
          ? `Amanece. ${victimName} no volvió al callejón.`
          : "Amaneció sin bajas."
      }
    >
      <Note tone={fell ? "var(--lyk-blood-bright)" : "var(--lyk-gold)"}>
        {fell
          ? `La oscuridad se llevó a ${victimName}.`
          : spared
            ? "La manada no se puso de acuerdo. Nadie cayó esta noche."
            : "El umbral resistió. Nadie cayó esta noche."}
      </Note>
      <div style={{ marginTop: "auto" }}>
        <PrimaryButton onClick={onContinue}>Volver al callejón</PrimaryButton>
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

/** A small tinted note block used for readings, pack lists and vote tallies. */
function Note({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "12px 14px",
        borderLeft: `2px solid ${tone}`,
        background: "rgba(255,255,255,.03)",
        fontSize: "13px",
        lineHeight: 1.5,
        color: "var(--lyk-ink)",
      }}
    >
      {children}
    </div>
  );
}

/** The "nobody / pass" option shared by the ward turn. */
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
 * A grid of players. Tapping a tile selects it (highlight); the selected id is
 * controlled by the parent.
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
