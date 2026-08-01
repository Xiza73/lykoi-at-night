import { useMemo, useState } from "react";
import {
  accuse,
  advancePhase,
  createGame,
  revealTryal,
  type Game,
} from "../domain/game/game";
import type { Seat } from "../domain/game/player";
import { createShuffle, type Shuffle } from "../domain/game/shuffle";
import { PhoneHeader } from "./components/PhoneHeader";
import { LobbyView } from "./views/LobbyView";
import { RevealView } from "./views/RevealView";
import { PlayView } from "./views/PlayView";
import { TrialView } from "./views/TrialView";
import { EndView } from "./views/EndView";

/** The finite set of screens the pass-and-play flow moves through. */
type Step = "lobby" | "reveal" | "play";

interface GameScreenProps {
  /**
   * The ONLY place randomness enters. Defaults to a real RNG; tests inject a
   * deterministic shuffle so the dealt game is predictable. The domain stays
   * pure — it never reads Math.random itself.
   */
  shuffle?: Shuffle;
}

const DEFAULT_NAMES = ["Ceniza", "Morriña", "Almendra", "Tuerto"] as const;

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
  const [witchCount, setWitchCount] = useState(3);
  const [step, setStep] = useState<Step>("lobby");
  const [revealIndex, setRevealIndex] = useState(0);
  const [game, setGame] = useState<Game | null>(null);
  // The player whose trial is on screen. Set when a trial opens and kept until
  // the host dismisses it, because the domain clears `onTrial` on the reveal —
  // we still want to show the resolved outcome afterwards.
  const [trialId, setTrialId] = useState<string | null>(null);

  const roundLabel = useMemo(() => {
    if (step === "lobby") {
      return "El callejón";
    }
    if (step === "reveal") {
      return "Reparto";
    }
    return `Ronda ${game?.round ?? 1}`;
  }, [step, game]);

  const handleAddSeat = () => setNames((prev) => [...prev, ""]);

  const handleRemoveSeat = (index: number) =>
    setNames((prev) => prev.filter((_, i) => i !== index));

  const handleRenameSeat = (index: number, name: string) =>
    setNames((prev) => prev.map((value, i) => (i === index ? name : value)));

  const handleDeal = () => {
    const seats: Seat[] = names.map((name, index) => ({
      id: `p${index + 1}`,
      name: name.trim() || `Gato ${index + 1}`,
    }));
    // createShuffle is the single randomness boundary; the domain deals purely.
    const dealt = createGame(seats, { witchCount }, shuffle);
    setGame(dealt);
    setRevealIndex(0);
    setStep("reveal");
  };

  const handlePass = () => {
    if (!game) {
      return;
    }
    if (revealIndex + 1 >= game.players.length) {
      setStep("play");
      return;
    }
    setRevealIndex((prev) => prev + 1);
  };

  const handleAccuse = (playerId: string) => {
    setGame((prev) => {
      if (!prev) {
        return prev;
      }
      const next = accuse(prev, playerId);
      // A fresh trial just opened: remember who is on trial so the trial view
      // stays up after the reveal clears the domain's onTrial.
      if (next.onTrial !== null && prev.onTrial === null) {
        setTrialId(next.onTrial);
      }
      return next;
    });
  };

  const handleReveal = (index: number) => {
    setGame((prev) => (prev ? revealTryal(prev, index) : prev));
  };

  const handleTrialContinue = () => setTrialId(null);

  const handleAdvancePhase = () => {
    setGame((prev) => (prev ? advancePhase(prev) : prev));
  };

  const handleReset = () => {
    setGame(null);
    setStep("lobby");
    setRevealIndex(0);
    setTrialId(null);
  };

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

      <PhoneHeader
        roundLabel={roundLabel}
        phase={game && step === "play" ? game.phase : undefined}
      />

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
          witchCount={witchCount}
          onAddSeat={handleAddSeat}
          onRemoveSeat={handleRemoveSeat}
          onRenameSeat={handleRenameSeat}
          onWitchCountChange={setWitchCount}
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
          tryal={game.tryals[player.id]}
          isLast={revealIndex + 1 >= game.players.length}
          onPass={handlePass}
        />
      );
    }

    // step === "play". A trial is on screen while trialId is set, even after
    // the reveal resolves it — so the outcome copy stays visible.
    if (trialId !== null) {
      const accused = game.players.find((p) => p.id === trialId);
      if (accused) {
        return (
          <TrialView
            accused={accused}
            tryal={game.tryals[accused.id]}
            onReveal={handleReveal}
            onContinue={handleTrialContinue}
            gameEnded={game.status === "ended"}
          />
        );
      }
    }

    if (game.status === "ended" && game.winner !== null) {
      return <EndView winner={game.winner} onReset={handleReset} />;
    }

    return (
      <PlayView
        game={game}
        onAccuse={handleAccuse}
        onAdvancePhase={handleAdvancePhase}
      />
    );
  }
}
