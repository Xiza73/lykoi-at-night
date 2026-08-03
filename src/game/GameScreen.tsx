import { useMemo, useState } from "react";
import {
  advancePhase,
  createGame,
  hunterRevenge,
  lynch,
  resolveDayVotes,
  resolveNight,
  resolveWolfVotes,
  type Game,
} from "../domain/game/game";
import type { RoleConfig, Seat } from "../domain/game/player";
import { isWolf } from "../domain/game/roles";
import { createShuffle, type Shuffle } from "../domain/game/shuffle";
import { PhoneHeader } from "./components/PhoneHeader";
import { LobbyView } from "./views/LobbyView";
import { RevealView } from "./views/RevealView";
import { NightView, type NightSubStep } from "./views/NightView";
import { DayView, type DayResult, type DaySubStep } from "./views/DayView";
import { EndView } from "./views/EndView";
import { HunterView } from "./views/HunterView";

/** The finite set of screens the pass-and-play flow moves through. */
type Step = "lobby" | "reveal" | "night" | "day" | "hunter" | "end";

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
  // Night sub-flow state, owned by the container. The phone passes to each
  // LIVING player in SEAT ORDER; each acts by THEIR role. The ward and the
  // pack's votes are collected here and handed to resolveWolfVotes +
  // resolveNight — the only death path at night. No screen ever names a role
  // at hand-off, so passing the phone never leaks who holds which role.
  const [nightRound, setNightRound] = useState<1 | 2>(1);
  const [seatIndex, setSeatIndex] = useState(0);
  const [nightSubStep, setNightSubStep] = useState<NightSubStep>("gate");
  const [protectedId, setProtectedId] = useState<string | null>(null);
  // The Cazador's PRE-COMMITTED shot for this night, set on his turn and held
  // (like the ward) until resolveNight. If the pack kills him tonight, this
  // target falls too — automatically, at dawn. Null means he takes nobody.
  const [hunterShotId, setHunterShotId] = useState<string | null>(null);
  // Votes for the CURRENT round, keyed by the voting wolf's id.
  const [wolfVotes, setWolfVotes] = useState<Record<string, string>>({});
  // The action-turn selections for the seated player (reset between turns).
  const [wolfTargetId, setWolfTargetId] = useState<string | null>(null);
  const [seerTargetId, setSeerTargetId] = useState<string | null>(null);
  // Snapshot taken the moment resolveNight runs: the name of whoever the night
  // claimed, or null if the umbral held. Drives the dawn message even after the
  // phase has advanced to day.
  const [dawnVictimName, setDawnVictimName] = useState<string | null>(null);
  // The second fallen at dawn: the Cazador's pre-committed shot, when the pack
  // killed him tonight. Null on an ordinary night with a single (or no) death.
  const [dawnShotName, setDawnShotName] = useState<string | null>(null);
  // True when a double tie in the pack's vote spared the night (nobody chosen).
  const [nightSpared, setNightSpared] = useState(false);
  // Day sub-flow state, mirroring the night machine. The town first DISCUSSES,
  // then the phone passes to each LIVING player in SEAT ORDER for a SECRET
  // ballot. The votes are collected here and handed to resolveDayVotes + lynch —
  // the only day death path. The running tally never shows (unlike the pack at
  // night), and no screen names a role at hand-off.
  const [daySubStep, setDaySubStep] = useState<DaySubStep>("discuss");
  const [daySeatIndex, setDaySeatIndex] = useState(0);
  // Votes for the current day, keyed by the voting player's id (null = abstain).
  const [dayVotes, setDayVotes] = useState<Record<string, string | null>>({});
  // The seated voter's transient ballot: a chosen candidate, or an abstention.
  const [dayPick, setDayPick] = useState<string | null>(null);
  const [dayAbstained, setDayAbstained] = useState(false);
  // The banishment announcement, snapshotted the moment the vote resolves.
  const [dayResult, setDayResult] = useState<DayResult | null>(null);
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
    setNightRound(1);
    setSeatIndex(0);
    setNightSubStep("gate");
    setProtectedId(null);
    setHunterShotId(null);
    setWolfVotes({});
    setWolfTargetId(null);
    setSeerTargetId(null);
    setDawnVictimName(null);
    setDawnShotName(null);
    setNightSpared(false);
  };

  // Resets the day machine when entering day (from dawn or a hunter's revenge).
  const armDay = () => {
    setDaySubStep("discuss");
    setDaySeatIndex(0);
    setDayVotes({});
    setDayPick(null);
    setDayAbstained(false);
    setDayResult(null);
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

  // The living players, in seat order — the phone travels down this list. The
  // domain preserves seat order, so index i is the i-th living seat.
  const livingSeats = game?.players.filter((player) => player.alive) ?? [];
  const seated = livingSeats[seatIndex];
  // The living voter currently holding the phone during the day's secret vote.
  const daySeated = livingSeats[daySeatIndex];

  const handleOpenGate = () => {
    // Hand-off accepted: reveal the seated player's private action.
    setNightSubStep("action");
  };

  // Resolves a completed vote round: on a first-round tie run a second pass;
  // on a second-round tie nobody dies. Otherwise the plurality victim falls.
  const resolveRound = (votes: Record<string, string>, round: 1 | 2) => {
    if (!game) {
      return;
    }
    const { victim, tie } = resolveWolfVotes(Object.values(votes));
    if (tie && round === 1) {
      // The pack re-votes: fresh votes, everything else from round 1 stays.
      setNightRound(2);
      setSeatIndex(0);
      setNightSubStep("gate");
      setWolfVotes({});
      setWolfTargetId(null);
      setSeerTargetId(null);
      return;
    }
    // No-tie (either round) → victim; round-2 tie → nobody dies (victim = null).
    const spared = tie;
    finishNight(victim, spared);
  };

  // Runs the single domain resolution and reports the dawn. At night the Cazador
  // never routes to the interactive step: his pre-committed shot resolves inside
  // resolveNight, so a night can now claim TWO players (the hunter + his shot).
  const finishNight = (victimId: string | null, spared: boolean) => {
    if (!game) {
      return;
    }
    // resolveNight is the ONLY night death path: it kills (or spares) the pack's
    // victim, fires the Cazador's pre-committed shot if he was the victim, and
    // breaks to the next day — or ends the game. Randomness never enters.
    const resolved = resolveNight(game, victimId, protectedId, hunterShotId);
    // Name the dawn deaths by ROLE IN THE STORY, not seat order: the primary loss
    // is always the pack's victim, and the shot is only reported when the player
    // who fell WAS the Cazador (his pre-committed shot dragging a second player
    // down). `died(id)` confirms a player was alive before and is dead after —
    // robust to a null id or an already-dead target.
    const died = (id: string | null): boolean => {
      if (id === null) {
        return false;
      }
      const before = game.players.find((p) => p.id === id);
      const after = resolved.players.find((p) => p.id === id);
      return (
        before !== undefined &&
        before.alive &&
        after !== undefined &&
        !after.alive
      );
    };
    const victim = game.players.find((p) => p.id === victimId);
    const dawnVictim = died(victimId) ? (victim?.name ?? null) : null;
    // The shot fell only alongside the Cazador: report it when the pack's victim
    // was the hunter AND his pre-committed shot actually died.
    const dawnShot =
      victim?.role === "hunter" && died(hunterShotId)
        ? (game.players.find((p) => p.id === hunterShotId)?.name ?? null)
        : null;
    setDawnVictimName(dawnVictim);
    setDawnShotName(dawnShot);
    setNightSpared(spared);
    setGame(resolved);
    setStep("night");
    setNightSubStep("dawn");
  };

  // The seated player finished their action: fold in any vote, then advance to
  // the next living seat — or resolve the round once the pass is complete.
  const handleConfirmAction = () => {
    if (!game || !seated) {
      return;
    }
    // A wolf's confirmed vote for this round; other roles cast no vote.
    let votes = wolfVotes;
    if (isWolf(seated.role) && wolfTargetId !== null) {
      votes = { ...wolfVotes, [seated.id]: wolfTargetId };
      setWolfVotes(votes);
    }
    // Clear the per-turn selections before the next player takes the phone.
    setWolfTargetId(null);
    setSeerTargetId(null);

    const isLast = seatIndex + 1 >= livingSeats.length;
    if (isLast) {
      resolveRound(votes, nightRound);
      return;
    }
    setSeatIndex(seatIndex + 1);
    setNightSubStep("gate");
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
    armDay();
    setStep("day");
  };

  // The town opens the secret vote from the discussion board: pass to the first
  // living seat.
  const handleStartVote = () => {
    setDaySeatIndex(0);
    setDayPick(null);
    setDayAbstained(false);
    setDaySubStep("gate");
  };

  const handleDayOpenGate = () => {
    // Hand-off accepted: reveal the seated voter's secret ballot.
    setDaySubStep("vote");
  };

  const handleSelectCandidate = (playerId: string) => {
    setDayPick(playerId);
    setDayAbstained(false);
  };

  const handleAbstain = () => {
    setDayPick(null);
    setDayAbstained(true);
  };

  // The seated voter confirmed their ballot: fold it in, then advance to the next
  // living seat — or resolve the vote once the pass is complete.
  const handleConfirmVote = () => {
    if (!game || !daySeated) {
      return;
    }
    // The confirmed ballot for this voter: their candidate, or null to abstain.
    const votes = { ...dayVotes, [daySeated.id]: dayAbstained ? null : dayPick };
    setDayVotes(votes);
    setDayPick(null);
    setDayAbstained(false);

    const isLast = daySeatIndex + 1 >= livingSeats.length;
    if (isLast) {
      resolveDay(votes);
      return;
    }
    setDaySeatIndex(daySeatIndex + 1);
    setDaySubStep("gate");
  };

  // Resolves a completed day vote: the LIVING mayor's own ballot may break a tie.
  // Then the banished player is lynched (or nobody falls), and the result screen
  // reports the outcome before night.
  const resolveDay = (votes: Record<string, string | null>) => {
    if (!game) {
      return;
    }
    // The living seats in the order they voted, so the ballot list matches.
    const ballots = livingSeats.map((player) => votes[player.id] ?? null);
    const mayor = livingSeats.find((player) => player.role === "mayor");
    const mayorVote = mayor ? (votes[mayor.id] ?? null) : null;
    const { banished, brokenByMayor } = resolveDayVotes(ballots, mayorVote);

    if (banished === null) {
      // Nobody banished: announce the stalemate, then fall into night.
      setDayResult({ banishedName: null, brokenByMayor: false });
      setDaySubStep("result");
      return;
    }
    const banishedName =
      game.players.find((player) => player.id === banished)?.name ?? null;
    // lynch is the ONLY day death path: it removes the banished player and,
    // if that ends the game, resolves it — otherwise the clock advances.
    const next = lynch(game, banished);
    setGame(next);
    setDayResult({ banishedName, brokenByMayor });
    // The Cazador was banished by day: pause for the public revenge before the
    // clock is allowed to move on. The result screen shows after the revenge.
    if (next.pendingHunter !== null) {
      setHunterTargetId(null);
      setStep("hunter");
      return;
    }
    setDaySubStep("result");
  };

  // Leaves the result screen: the domain already advanced the clock (or ended
  // the game) inside lynch; route to whichever it reached.
  const handleDayResultContinue = () => {
    if (!game) {
      return;
    }
    if (game.status === "ended") {
      setStep("end");
      return;
    }
    // A banishment already advanced to night via lynch; a stalemate has not, so
    // advance it here. Either way we land on night.
    if (game.phase === "day") {
      const next = advancePhase(game);
      setGame(next);
      if (next.status === "ended") {
        setStep("end");
        return;
      }
    }
    armNight();
    setStep("night");
  };

  // The day-banished Cazador's interactive revenge. `targetId` is the chosen
  // player, or null to take nobody (the "No llevarse a nadie" path).
  const resolveHunterRevenge = (targetId: string | null) => {
    if (!game) {
      return;
    }
    // hunterRevenge is the ONLY revenge death path: it takes the chosen player,
    // clears the pause and lets the domain resolve + advance the clock.
    const next = hunterRevenge(game, targetId);
    setGame(next);
    setHunterTargetId(null);
    if (next.status === "ended") {
      setStep("end");
      return;
    }
    // This interactive revenge only follows a DAY banishment now (a night death
    // pre-commits and resolves automatically), so the domain has advanced day ->
    // night: fall straight into the next night.
    armNight();
    setStep("night");
  };

  const handleHunterRevenge = () => resolveHunterRevenge(hunterTargetId);
  const handleHunterTakeNobody = () => resolveHunterRevenge(null);

  const handleSkipDay = () => {
    if (!game) {
      return;
    }
    // "No lynch": skip straight to the next night.
    const next = advancePhase(game);
    setGame(next);
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
    setHunterTargetId(null);
    armNight();
    armDay();
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
      return <LobbyView onDeal={handleDeal} />;
    }

    if (step === "reveal") {
      const player = game.players[revealIndex];
      // The pack knows its own: surface the OTHER wolves' names so the reveal
      // card can show them. Uses isWolf so the pack sees each other. Empty (or
      // ignored) for town players.
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

    if (step === "hunter") {
      return (
        <HunterView
          game={game}
          targetId={hunterTargetId}
          onSelectTarget={setHunterTargetId}
          onConfirm={handleHunterRevenge}
          onTakeNobody={handleHunterTakeNobody}
        />
      );
    }

    if (step === "night") {
      return (
        <NightView
          game={game}
          subStep={nightSubStep}
          seated={seated}
          round={nightRound}
          protectedId={protectedId}
          lastWarded={game.lastWarded}
          hunterShotId={hunterShotId}
          wolfVotes={wolfVotes}
          seerTargetId={seerTargetId}
          wolfTargetId={wolfTargetId}
          victimName={dawnVictimName}
          shotName={dawnShotName}
          spared={nightSpared}
          onOpenGate={handleOpenGate}
          onSelectProtected={setProtectedId}
          onSelectHunterShot={setHunterShotId}
          onSelectSeerTarget={setSeerTargetId}
          onSelectWolfTarget={setWolfTargetId}
          onConfirmAction={handleConfirmAction}
          onDawnContinue={handleDawnContinue}
        />
      );
    }

    // step === "day".
    return (
      <DayView
        game={game}
        subStep={daySubStep}
        seated={daySeated}
        pick={dayPick}
        abstained={dayAbstained}
        result={dayResult}
        onStartVote={handleStartVote}
        onSkip={handleSkipDay}
        onOpenGate={handleDayOpenGate}
        onSelectCandidate={handleSelectCandidate}
        onAbstain={handleAbstain}
        onConfirmVote={handleConfirmVote}
        onResultContinue={handleDayResultContinue}
      />
    );
  }
}
