import type { Game } from "../../domain/game/game";
import type { Player } from "../../domain/game/player";
import { PrimaryButton } from "../components/PrimaryButton";
import { CatIcon } from "../components/CatIcon";

/**
 * The day's sub-steps, owned by the container. First the whole table DISCUSSES
 * (the board), then — if they call a vote — the phone travels in SEAT ORDER: each
 * living player takes a "gate" (a hand-off named only by the seated player, never
 * a role) and casts a SECRET vote. Unlike the pack at night, the running day
 * tally stays HIDDEN; only the "result" screen reveals the banishment. The town
 * may also skip the vote entirely and fall straight into night.
 */
export type DaySubStep = "discuss" | "gate" | "vote" | "result";

/** The banishment announcement, snapshotted the moment the vote resolves. */
export interface DayResult {
  /** The name of whoever the alley banished, or null if nobody fell. */
  readonly banishedName: string | null;
  /** True when a tie was tipped by the Alcalde's doubled vote. */
  readonly brokenByMayor: boolean;
}

interface DayViewProps {
  game: Game;
  /** Which sub-step the day is on. */
  subStep: DaySubStep;
  /** The living player currently holding the phone (undefined off the pass). */
  seated: Player | undefined;
  /** This voter's chosen candidate for the current turn, if any. */
  pick: string | null;
  /** Whether this voter has chosen to abstain this turn. */
  abstained: boolean;
  /** The banishment announcement, once the vote has resolved. */
  result: DayResult | null;
  /** Opens the secret vote pass (from the discussion board). */
  onStartVote: () => void;
  /** Skip the vote and fall straight into night (calls advancePhase). */
  onSkip: () => void;
  /** Hand-off accepted: reveal the seated voter's private ballot. */
  onOpenGate: () => void;
  /** Selects a candidate for the current voter. */
  onSelectCandidate: (playerId: string) => void;
  /** Marks the current voter as abstaining. */
  onAbstain: () => void;
  /** Confirms the current voter's ballot and passes on (or resolves). */
  onConfirmVote: () => void;
  /** Leaves the result screen: falls into night (or ends the game). */
  onResultContinue: () => void;
}

/**
 * The daytime flow, rendered while `game.phase === "day"`. It never computes the
 * banishment itself — the container collects each secret ballot and routes them
 * through `resolveDayVotes` + `lynch`. This view only paints the discussion
 * board, the pass-and-play voting turns and the result announcement.
 */
export function DayView({
  game,
  subStep,
  seated,
  pick,
  abstained,
  result,
  onStartVote,
  onSkip,
  onOpenGate,
  onSelectCandidate,
  onAbstain,
  onConfirmVote,
  onResultContinue,
}: DayViewProps) {
  if (subStep === "discuss") {
    return (
      <Discussion game={game} onStartVote={onStartVote} onSkip={onSkip} />
    );
  }

  if (subStep === "result") {
    return <Result result={result} onContinue={onResultContinue} />;
  }

  // "gate" and "vote" both need a seated voter; the container only routes here
  // with one while the pass is running.
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

  // subStep === "vote": the seated player's secret ballot.
  return (
    <Ballot
      game={game}
      seated={seated}
      pick={pick}
      abstained={abstained}
      onSelectCandidate={onSelectCandidate}
      onAbstain={onAbstain}
      onConfirmVote={onConfirmVote}
    />
  );
}

/** The discussion board: everyone talks, then the town calls a vote or skips. */
function Discussion({
  game,
  onStartVote,
  onSkip,
}: {
  game: Game;
  onStartVote: () => void;
  onSkip: () => void;
}) {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <h3 style={headingStyle}>El callejón murmura</h3>
        <p style={subtitleStyle}>
          Discutan en voz alta. Cuando estén listos, el teléfono da la vuelta y
          cada uno vota en secreto.
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
          <PlayerTile key={player.id} player={player} />
        ))}
      </div>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
        <PrimaryButton onClick={onStartVote}>A votar</PrimaryButton>
        <PrimaryButton variant="ghost" onClick={onSkip}>
          Que nadie caiga hoy
        </PrimaryButton>
      </div>
    </div>
  );
}

/** One voter's secret ballot: pick a living player (not themselves) or abstain. */
function Ballot({
  game,
  seated,
  pick,
  abstained,
  onSelectCandidate,
  onAbstain,
  onConfirmVote,
}: {
  game: Game;
  seated: Player;
  pick: string | null;
  abstained: boolean;
  onSelectCandidate: (playerId: string) => void;
  onAbstain: () => void;
  onConfirmVote: () => void;
}) {
  // Candidates: every living player EXCEPT the voter. The tally stays hidden.
  const candidates = game.players.filter(
    (player) => player.alive && player.id !== seated.id,
  );
  const chosen = abstained || pick !== null;

  return (
    <Frame
      title="Tu voto"
      body="¿A quién destierra el callejón? Nadie verá tu elección hasta el recuento."
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(112px, 1fr))",
          gap: "8px",
          overflowY: "auto",
          paddingRight: "2px",
        }}
      >
        {candidates.map((player) => {
          const selected = !abstained && player.id === pick;
          const tone = selected ? "var(--lyk-gold)" : "var(--lyk-faint)";
          return (
            <button
              key={player.id}
              type="button"
              aria-label={`Votar por ${player.name}`}
              aria-pressed={selected}
              onClick={() => onSelectCandidate(player.id)}
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

      <AbstainOption selected={abstained} onClick={onAbstain} />

      <div style={{ marginTop: "auto" }}>
        <PrimaryButton onClick={onConfirmVote} disabled={!chosen}>
          Confirmar voto
        </PrimaryButton>
      </div>
    </Frame>
  );
}

/** The result of the vote: who the alley banished, and whether the Alcalde tipped it. */
function Result({
  result,
  onContinue,
}: {
  result: DayResult | null;
  onContinue: () => void;
}) {
  const banished = result?.banishedName ?? null;
  return (
    <Frame
      title="El recuento"
      body={
        banished !== null
          ? `El callejón destierra a ${banished}.`
          : "El callejón no se pone de acuerdo. Nadie cae hoy."
      }
    >
      <Note tone={banished !== null ? "var(--lyk-blood-bright)" : "var(--lyk-gold)"}>
        {banished !== null
          ? result?.brokenByMayor
            ? "Hubo empate. El Alcalde inclinó la balanza."
            : `${banished} cae por voluntad del callejón.`
          : "Ningún nombre se impuso. El callejón queda en silencio."}
      </Note>
      <div style={{ marginTop: "auto" }}>
        <PrimaryButton onClick={onContinue}>Cae la noche</PrimaryButton>
      </div>
    </Frame>
  );
}

/** The "abstain" option shown under the ballot grid. */
function AbstainOption({
  selected,
  onClick,
}: {
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label="Me abstengo"
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
      Me abstengo
    </button>
  );
}

const headingStyle = {
  margin: 0,
  fontFamily: "var(--lyk-serif)",
  fontWeight: 400,
  fontSize: "clamp(24px, 6.5vw, 30px)",
  lineHeight: 1.1,
  color: "var(--lyk-ink-strong)",
} as const;

const subtitleStyle = {
  margin: 0,
  fontSize: "13.5px",
  lineHeight: 1.55,
  color: "var(--lyk-muted-2)",
  textWrap: "pretty",
} as const;

/** Shared day scaffold: title, body copy and a column of children. */
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
        <h3 style={headingStyle}>{title}</h3>
        <p style={subtitleStyle}>{body}</p>
      </div>
      {children}
    </div>
  );
}

/** A small tinted note block used for the result announcement. */
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

/** A read-only board tile: alive/dead state, no interaction (discussion phase). */
function PlayerTile({ player }: { player: Player }) {
  const dead = !player.alive;
  const tone = dead ? "var(--lyk-faint)" : "var(--lyk-gold)";
  const status = dead ? "Caído" : "En pie";

  return (
    <div
      aria-label={`${player.name}${dead ? " (caído)" : ""}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "9px",
        padding: "10px",
        border: `1px solid ${dead ? "#1d1f24" : "#2a2d33"}`,
        background: dead ? "rgba(0,0,0,.2)" : "rgba(255,255,255,.015)",
        opacity: dead ? 0.45 : 1,
        textAlign: "left",
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
    </div>
  );
}
