import { useMemo, useState } from "react";
import {
  advancePhase,
  createGame,
  lynch,
  resolveNight,
  type Game,
} from "../domain/game/game";
import type { RoleConfig, Seat } from "../domain/game/player";
import { createShuffle, type Shuffle } from "../domain/game/shuffle";
import { PhoneHeader } from "./components/PhoneHeader";
import { LobbyView } from "./views/LobbyView";
import { maxWolves } from "./roleLabels";
import { RevealView } from "./views/RevealView";
import { NightView, type NightStep } from "./views/NightView";
import { DayView } from "./views/DayView";
import { EndView } from "./views/EndView";

/** The finite set of screens the pass-and-play flow moves through. */
type Step = "lobby" | "reveal" | "night" | "day" | "end";

interface GameScreenProps {
  /**
   * The ONLY place randomness enters. Defaults to a real RNG; tests inject a
   * deterministic shuffle so the dealt game is predictable. The domain stays
   * pure — it never reads Math.random itself.
   */
  shuffle?: Shuffle;
}

const DEFAULT_NAMES = ["Ceniza", "Morriña", "Almendra", "Tuerto"] as const;
const DEFAULT_ROLE_CONFIG: RoleConfig = {
  werewolves: 1,
  seer: true,
  guardian: true,
};

/**
 * The production shuffle, built once at module load. `createShuffle` is pure —
 * it only closes over the RNG and defers Math.random until a shuffle actually
 * runs — so evaluating this here keeps the component render pure.
 */
const defaultShuffle = createShuffle(() => Math.random());

/**
 * Interactive pass-and-play game screen. Holds all mutable state and is the sole
 * owner of the domain `Game` snapshot; every rule transition goes through the
 * domain functions, keeping this container a thin state machine over pure logic.
 */
export function GameScreen({ shuffle = defaultShuffle }: GameScreenProps) {
  const [names, setNames] = useState<string[]>([...DEFAULT_NAMES]);
  const [roleConfig, setRoleConfig] = useState<RoleConfig>(DEFAULT_ROLE_CONFIG);
  const [step, setStep] = useState<Step>("lobby");
  const [revealIndex, setRevealIndex] = useState(0);
  const [game, setGame] = useState<Game | null>(null);
  // Night sub-flow state, owned by the container. The ward, victim and seer
  // reading are collected by the UI and handed to resolveNight — the only
  // death path at night.
  const [nightStep, setNightStep] = useState<NightStep>("guardian-gate");
  const [protectedId, setProtectedId] = useState<string | null>(null);
  const [wolfTargetId, setWolfTargetId] = useState<string | null>(null);
  const [seerTargetId, setSeerTargetId] = useState<string | null>(null);
  // Snapshot taken the moment resolveNight runs: the name of whoever the night
  // claimed, or null if the umbral held. Drives the dawn message even after the
  // phase has advanced to day.
  const [dawnVictimName, setDawnVictimName] = useState<string | null>(null);
  // The day's suspect, marked by the town before the vote resolves.
  const [suspectId, setSuspectId] = useState<string | null>(null);

  const roundLabel = useMemo(() => {
    if (step === "lobby") {
      return "El callejón";
    }
    if (step === "reveal") {
      return "Reparto";
    }
    return `Ronda ${game?.round ?? 1}`;
  }, [step, game]);

  const armNight = () => {
    setNightStep("guardian-gate");
    setProtectedId(null);
    setWolfTargetId(null);
    setSeerTargetId(null);
    setDawnVictimName(null);
  };

  const handleAddSeat = () => setNames((prev) => [...prev, ""]);

  const handleRemoveSeat = (index: number) =>
    setNames((prev) => prev.filter((_, i) => i !== index));

  const handleRenameSeat = (index: number, name: string) =>
    setNames((prev) => prev.map((value, i) => (i === index ? name : value)));

  const handleRoleConfigChange = (next: RoleConfig) => {
    // Keep the werewolf count within the valid band as the roster changes.
    const upper = maxWolves(names.length);
    setRoleConfig({
      ...next,
      werewolves: Math.min(Math.max(1, next.werewolves), upper),
    });
  };

  const handleDeal = () => {
    const seats: Seat[] = names.map((name, index) => ({
      id: `p${index + 1}`,
      name: name.trim() || `Gato ${index + 1}`,
    }));
    // createShuffle is the single randomness boundary; the domain deals purely.
    const dealt = createGame(seats, roleConfig, shuffle);
    setGame(dealt);
    setRevealIndex(0);
    setStep("reveal");
  };

  const handlePass = () => {
    if (!game) {
      return;
    }
    if (revealIndex + 1 >= game.players.length) {
      armNight();
      setStep("night");
      return;
    }
    setRevealIndex((prev) => prev + 1);
  };

  const handleResolveNight = () => {
    if (!game) {
      return;
    }
    // resolveNight is the ONLY night death path: it kills (or spares) the victim
    // and breaks to the next day — or ends the game. Randomness never enters.
    const resolved = resolveNight(game, wolfTargetId, protectedId);
    const victim = wolfTargetId
      ? resolved.players.find((player) => player.id === wolfTargetId)
      : undefined;
    // The victim fell if they were the wolves' target and are now dead.
    setDawnVictimName(victim && !victim.alive ? victim.name : null);
    setGame(resolved);
    setNightStep("dawn");
  };

  const handleDawnContinue = () => {
    if (!game) {
      return;
    }
    // resolveNight already advanced to day (or ended the game): route the screen.
    if (game.status === "ended") {
      setStep("end");
      return;
    }
    setSuspectId(null);
    setStep("day");
  };

  const handleLynch = () => {
    if (!game || suspectId === null) {
      return;
    }
    const next = lynch(game, suspectId);
    setGame(next);
    setSuspectId(null);
    if (next.status === "ended") {
      setStep("end");
      return;
    }
    armNight();
    setStep("night");
  };

  const handleSkipDay = () => {
    if (!game) {
      return;
    }
    // "No lynch": skip straight to the next night.
    const next = advancePhase(game);
    setGame(next);
    setSuspectId(null);
    if (next.status === "ended") {
      setStep("end");
      return;
    }
    armNight();
    setStep("night");
  };

  const handleReset = () => {
    setGame(null);
    setStep("lobby");
    setRevealIndex(0);
    setSuspectId(null);
    armNight();
  };

  // The header phase chip only shows during active play (night/day).
  const phase =
    step === "night" ? "night" : step === "day" ? "day" : undefined;

  return (
    <div
      style={{
        flex: "0 1 430px",
        width: "min(100%, 430px)",
        border: "1px solid #26282d",
        background: "var(--lyk-surface-2)",
        boxShadow: "0 40px 90px rgba(0,0,0,.6)",
        display: "flex",
        flexDirection: "column",
        minHeight: "660px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(90% 55% at 50% 0%, rgba(56,80,107,.22), transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <PhoneHeader roundLabel={roundLabel} phase={phase} />

      <div
        style={{
          position: "relative",
          flex: 1,
          padding: "clamp(18px, 5vw, 26px) clamp(16px, 4.5vw, 22px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {renderStep()}
      </div>
    </div>
  );

  function renderStep() {
    if (step === "lobby" || game === null) {
      return (
        <LobbyView
          names={names}
          roleConfig={roleConfig}
          onAddSeat={handleAddSeat}
          onRemoveSeat={handleRemoveSeat}
          onRenameSeat={handleRenameSeat}
          onRoleConfigChange={handleRoleConfigChange}
          onDeal={handleDeal}
        />
      );
    }

    if (step === "reveal") {
      const player = game.players[revealIndex];
      return (
        <RevealView
          key={player.id}
          player={player}
          isLast={revealIndex + 1 >= game.players.length}
          onPass={handlePass}
        />
      );
    }

    if (step === "end" && game.winner !== null) {
      return <EndView winner={game.winner} onReset={handleReset} />;
    }

    if (step === "night") {
      return (
        <NightView
          game={game}
          step={nightStep}
          protectedId={protectedId}
          wolfTargetId={wolfTargetId}
          seerTargetId={seerTargetId}
          victimName={dawnVictimName}
          onOpenGate={setNightStep}
          onSelectProtected={setProtectedId}
          onConfirmProtected={() => setNightStep("wolf-gate")}
          onSelectWolfTarget={setWolfTargetId}
          onConfirmWolfTarget={() => setNightStep("seer-gate")}
          onSelectSeerTarget={setSeerTargetId}
          onResolve={handleResolveNight}
          onDawnContinue={handleDawnContinue}
        />
      );
    }

    // step === "day".
    return (
      <DayView
        game={game}
        suspectId={suspectId}
        onSelectSuspect={setSuspectId}
        onLynch={handleLynch}
        onSkip={handleSkipDay}
      />
    );
  }
}
