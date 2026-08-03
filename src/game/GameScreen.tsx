import { useMemo, useState } from "react";
import {
  advancePhase,
  createGame,
  hunterRevenge,
  lynch,
  resolveNight,
  type Game,
} from "../domain/game/game";
import type { RoleConfig, Seat } from "../domain/game/player";
import { isWolf } from "../domain/game/roles";
import { createShuffle, type Shuffle } from "../domain/game/shuffle";
import { PhoneHeader } from "./components/PhoneHeader";
import { LobbyView } from "./views/LobbyView";
import { RevealView } from "./views/RevealView";
import { NightView, TurnedView, type NightStep } from "./views/NightView";
import { DayView } from "./views/DayView";
import { EndView } from "./views/EndView";
import { HunterView } from "./views/HunterView";
import { InsomniacView } from "./views/InsomniacView";

/** The finite set of screens the pass-and-play flow moves through. */
type Step =
  | "lobby"
  | "reveal"
  | "night"
  | "turned"
  | "insomniac"
  | "day"
  | "hunter"
  | "end";

interface GameScreenProps {
  /**
   * The ONLY place randomness enters. Defaults to a real RNG; tests inject a
   * deterministic shuffle so the dealt game is predictable. The domain stays
   * pure — it never reads Math.random itself.
   */
  shuffle?: Shuffle;
}

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
  const [step, setStep] = useState<Step>("lobby");
  const [revealIndex, setRevealIndex] = useState(0);
  const [game, setGame] = useState<Game | null>(null);
  // Night sub-flow state, owned by the container. The ward, victim and seer
  // reading are collected by the UI and handed to resolveNight — the only
  // death path at night.
  const [nightStep, setNightStep] = useState<NightStep>("guardian-gate");
  const [protectedId, setProtectedId] = useState<string | null>(null);
  const [wolfTargetId, setWolfTargetId] = useState<string | null>(null);
  // The Madre Camada's chosen townsperson to convert, or null for "pass".
  const [infectTargetId, setInfectTargetId] = useState<string | null>(null);
  const [seerTargetId, setSeerTargetId] = useState<string | null>(null);
  // The dead cat La Chismosa peeked this night, or null. A live info read only.
  const [gossipTargetId, setGossipTargetId] = useState<string | null>(null);
  // The freshly-turned player's name, shown on the private "you were turned" gate
  // before dawn. Null unless an infection actually landed this night.
  const [turnedName, setTurnedName] = useState<string | null>(null);
  // Snapshot taken the moment resolveNight runs: the name of whoever the night
  // claimed, or null if the umbral held. Drives the dawn message even after the
  // phase has advanced to day.
  const [dawnVictimName, setDawnVictimName] = useState<string | null>(null);
  // The day's suspect, marked by the town before the vote resolves.
  const [suspectId, setSuspectId] = useState<string | null>(null);
  // The player the fallen Cazador de Sombras picks to take down with them.
  const [hunterTargetId, setHunterTargetId] = useState<string | null>(null);

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
    setInfectTargetId(null);
    setSeerTargetId(null);
    setGossipTargetId(null);
    setDawnVictimName(null);
    setTurnedName(null);
  };

  const handleDeal = (seats: readonly Seat[], roleConfig: RoleConfig) => {
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
    const resolved = resolveNight(game, wolfTargetId, protectedId, infectTargetId);
    const victim = wolfTargetId
      ? resolved.players.find((player) => player.id === wolfTargetId)
      : undefined;
    // The victim fell if they were the wolves' target and are now dead.
    setDawnVictimName(victim && !victim.alive ? victim.name : null);
    // Diff the pre/post snapshots for a player the Madre Camada turned this night:
    // one whose role flipped to "werewolf" (a townsperson before, wolf after).
    const before = game.players;
    const turned = resolved.players.find((player) => {
      const prior = before.find((p) => p.id === player.id);
      return prior?.role !== "werewolf" && player.role === "werewolf";
    });
    const turnedThisNight = turned ? turned.name : null;
    setTurnedName(turnedThisNight);
    setGame(resolved);
    // When several things land the same night, chain the gates so none is
    // swallowed: the freshly-turned cat learns their fate first, THEN the fallen
    // Cazador's revenge (see handleTurnedContinue), THEN dawn.
    if (turnedThisNight !== null) {
      setStep("turned");
      return;
    }
    // Otherwise, if the Cazador fell at night, pause for the public revenge.
    if (resolved.pendingHunter !== null) {
      setHunterTargetId(null);
      setStep("hunter");
      return;
    }
    proceedToDawn(resolved);
  };

  const handleTurnedContinue = () => {
    // Dismiss the private turn notice. If the Cazador also fell this same night,
    // his public revenge follows before dawn; otherwise fall through to dawn.
    if (!game) {
      return;
    }
    if (game.pendingHunter !== null) {
      setHunterTargetId(null);
      setStep("hunter");
      return;
    }
    proceedToDawn(game);
  };

  /**
   * Routes the resolved night to the dawn announcement, gating El Insomne's
   * private "footsteps" reading in front of it whenever the role is in play.
   * The insomniac step is always shown while the role exists (even if dead) so
   * nothing leaks — matching how the night turns are gated by role-in-game.
   */
  const proceedToDawn = (resolved: Game) => {
    if (resolved.players.some((p) => p.role === "insomniac")) {
      setStep("insomniac");
      return;
    }
    setStep("night");
    setNightStep("dawn");
  };

  const handleInsomniacContinue = () => {
    setStep("night");
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
    // The Cazador is lynched by day: pause for the public revenge before night.
    if (next.pendingHunter !== null) {
      setHunterTargetId(null);
      setStep("hunter");
      return;
    }
    if (next.status === "ended") {
      setStep("end");
      return;
    }
    armNight();
    setStep("night");
  };

  const handleHunterRevenge = () => {
    if (!game) {
      return;
    }
    // hunterRevenge is the ONLY revenge death path: it takes the chosen player,
    // clears the pause and lets the domain resolve + advance the clock.
    const next = hunterRevenge(game, hunterTargetId);
    setGame(next);
    setHunterTargetId(null);
    if (next.status === "ended") {
      setStep("end");
      return;
    }
    // The domain already advanced: dawn if the hunter died at night (now day),
    // nightfall if lynched by day (now night). Route to whichever it reached.
    if (next.phase === "night") {
      armNight();
      setStep("night");
      return;
    }
    // Dawn broke (the hunter fell at night): gate El Insomne's private reading
    // before the day board, whenever the role is in play.
    if (next.players.some((p) => p.role === "insomniac")) {
      setStep("insomniac");
      return;
    }
    setSuspectId(null);
    setStep("day");
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
    setHunterTargetId(null);
    armNight();
  };

  // The header phase chip only shows during active play (night/day). The private
  // "you were turned" gate still happens under the cover of night.
  const phase =
    step === "night" || step === "turned" || step === "insomniac"
      ? "night"
      : step === "day"
        ? "day"
        : undefined;

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
      return <LobbyView onDeal={handleDeal} />;
    }

    if (step === "reveal") {
      const player = game.players[revealIndex];
      // The pack knows its own: surface the OTHER wolves' names so the reveal
      // card can show them. Uses isWolf so the Madre Camada and the werewolves
      // see each other. Empty (or ignored) for town players.
      const teammates = isWolf(player.role)
        ? game.players
            .filter((p) => isWolf(p.role) && p.id !== player.id)
            .map((p) => p.name)
        : [];
      return (
        <RevealView
          key={player.id}
          player={player}
          teammates={teammates}
          isLast={revealIndex + 1 >= game.players.length}
          onPass={handlePass}
        />
      );
    }

    if (step === "end" && game.winner !== null) {
      return <EndView winner={game.winner} onReset={handleReset} />;
    }

    if (step === "turned" && turnedName !== null) {
      return <TurnedView name={turnedName} onContinue={handleTurnedContinue} />;
    }

    if (step === "insomniac") {
      // Gated by the role being in the game — always shown while El Insomne is in
      // play (even dead), so the private footsteps reading never leaks who lives.
      return <InsomniacView game={game} onContinue={handleInsomniacContinue} />;
    }

    if (step === "hunter") {
      return (
        <HunterView
          game={game}
          targetId={hunterTargetId}
          onSelectTarget={setHunterTargetId}
          onConfirm={handleHunterRevenge}
        />
      );
    }

    if (step === "night") {
      // The Madre Camada's turn is gated by her role being in the game — always
      // shown while she's in play (even dead / power spent); the domain ignores
      // an invalid or repeat infection.
      const hasInfector = game.players.some((p) => p.role === "infector");
      // La Chismosa's turn is gated by her role being in the game — always shown
      // while she's in play (even dead) so the private peek never leaks who lives.
      const hasGossip = game.players.some((p) => p.role === "gossip");
      return (
        <NightView
          game={game}
          step={nightStep}
          protectedId={protectedId}
          wolfTargetId={wolfTargetId}
          infectTargetId={infectTargetId}
          seerTargetId={seerTargetId}
          gossipTargetId={gossipTargetId}
          victimName={dawnVictimName}
          onOpenGate={setNightStep}
          onSelectProtected={setProtectedId}
          onConfirmProtected={() => setNightStep("wolf-gate")}
          onSelectWolfTarget={setWolfTargetId}
          onConfirmWolfTarget={() =>
            // The Madre Camada's turn is shown only when her role is in the game;
            // otherwise the night skips straight to the seer.
            setNightStep(hasInfector ? "infector-gate" : "seer-gate")
          }
          onSelectInfectTarget={setInfectTargetId}
          onConfirmInfectTarget={() => setNightStep("seer-gate")}
          onSelectSeerTarget={setSeerTargetId}
          onConfirmSeer={() =>
            // La Chismosa's turn follows the Seer only when her role is in play;
            // otherwise the night resolves straight away.
            hasGossip ? setNightStep("gossip-gate") : handleResolveNight()
          }
          onSelectGossipTarget={setGossipTargetId}
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
