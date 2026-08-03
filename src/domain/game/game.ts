import type { Phase } from "./phase";
import { nextPhase } from "./phase";
import {
  dealRoles,
  eliminate,
  type Player,
  type PlayerId,
  type RoleConfig,
  type Seat,
} from "./player";
import { alignmentOf, isWolf, type Alignment } from "./roles";
import type { Shuffle } from "./shuffle";

export type GameStatus = "in_progress" | "ended";

/** Which team won, once the game has ended. */
export type Outcome = "wolves" | "town";

/** Immutable snapshot of a game. */
export interface Game {
  readonly players: readonly Player[];
  readonly phase: Phase;
  readonly round: number;
  readonly status: GameStatus;
  readonly winner: Outcome | null;
  readonly pendingHunter: PlayerId | null;
}

/** Creates a new game: deals roles and opens on the first night. */
export function createGame(
  seats: readonly Seat[],
  config: RoleConfig,
  shuffle: Shuffle,
): Game {
  const players = dealRoles(seats, config, shuffle);
  return {
    players,
    phase: "night",
    round: 1,
    status: "in_progress",
    winner: null,
    pendingHunter: null,
  };
}

/** Living werewolves. */
export function livingWolves(game: Game): readonly Player[] {
  return game.players.filter((player) => player.alive && isWolf(player.role));
}

/** Living townsfolk (everyone who is not a werewolf). */
export function livingTown(game: Game): readonly Player[] {
  return game.players.filter((player) => player.alive && !isWolf(player.role));
}

/**
 * Evaluates the win condition:
 * - the town wins once no werewolf is left alive;
 * - the werewolves win once they equal or outnumber the town (parity).
 * Returns null while the game is undecided.
 */
export function evaluateOutcome(game: Game): Outcome | null {
  const wolves = livingWolves(game).length;
  if (wolves === 0) {
    return "town";
  }
  if (wolves >= livingTown(game).length) {
    return "wolves";
  }
  return null;
}

/** Recomputes status and winner from the current players. */
export function resolve(game: Game): Game {
  const outcome = evaluateOutcome(game);
  if (outcome === null) {
    return game;
  }
  return { ...game, status: "ended", winner: outcome };
}

/**
 * Advances the night/day clock. No-op once the game has ended. Night -> Day
 * keeps the round; Day -> Night starts the next round.
 */
export function advancePhase(game: Game): Game {
  if (game.status === "ended") {
    return game;
  }
  const phase = nextPhase(game.phase);
  const round = game.phase === "day" ? game.round + 1 : game.round;
  return { ...game, phase, round };
}

/** The seer's reading of a player: their alignment (null if unknown id). */
export function investigate(game: Game, targetId: PlayerId): Alignment | null {
  const target = game.players.find((player) => player.id === targetId);
  return target ? alignmentOf(target.role) : null;
}

/**
 * Resolves a night. The werewolves' victim dies unless a living guardian warded
 * exactly them. Then dawn breaks (advance to day) or the game ends. No-op unless
 * it is night and the game is in progress.
 *
 * The Cazador acts at night by PRE-COMMITTING a target (`hunterShotId`): he won't
 * know he died until dawn, so if the pack kills him tonight his shot fires
 * automatically at dawn — no interactive step. The shot is UNSTOPPABLE (a
 * guardian ward never saves the shot target) and OPTIONAL (a null, or
 * already-dead, `hunterShotId` means he takes nobody). The pre-commit is ignored
 * entirely unless the hunter is the one the pack kills tonight.
 */
export function resolveNight(
  game: Game,
  wolfTargetId: PlayerId | null,
  protectedId: PlayerId | null,
  hunterShotId: PlayerId | null = null,
): Game {
  if (game.phase !== "night" || game.status === "ended") {
    return game;
  }
  const guardianAlive = game.players.some(
    (player) => player.alive && player.role === "guardian",
  );
  const victim =
    wolfTargetId === null
      ? null
      : (game.players.find((player) => player.id === wolfTargetId) ?? null);
  const saved =
    guardianAlive && protectedId !== null && protectedId === wolfTargetId;
  const dies = victim !== null && victim.alive && !saved;
  let players = dies
    ? game.players.map((p) => (p.id === victim.id ? eliminate(p) : p))
    : game.players;
  // The Cazador died in his sleep: his pre-committed shot fires now, unstoppable
  // (the ward never saves the shot) and automatic (no interactive revenge). A
  // null or already-dead pre-commit means he takes nobody.
  if (dies && victim.role === "hunter" && hunterShotId !== null) {
    players = players.map((p) =>
      p.id === hunterShotId && p.alive ? eliminate(p) : p,
    );
  }
  const resolved = resolve({ ...game, players });
  return resolved.status === "ended" ? resolved : advancePhase(resolved);
}

/**
 * Resolves a day lynch: the chosen player is eliminated, then the game ends or
 * night falls again. No-op unless it is day and the game is in progress.
 */
export function lynch(game: Game, targetId: PlayerId): Game {
  if (game.phase !== "day" || game.status === "ended") {
    return game;
  }
  const target = game.players.find((player) => player.id === targetId);
  if (!target || !target.alive) {
    return game;
  }
  const players = game.players.map((player) =>
    player.id === targetId ? eliminate(player) : player,
  );
  if (target.role === "hunter") {
    return { ...game, players, pendingHunter: target.id };
  }
  const resolved = resolve({ ...game, players });
  return resolved.status === "ended" ? resolved : advancePhase(resolved);
}

/**
 * Resolves the Hunter's dying revenge: the chosen player is taken down too.
 * Only valid while a hunter's death is pending. Then the game resolves and the
 * clock advances (dawn if the hunter died at night, nightfall if by day).
 * A null target means no one is taken. (No cascade: shooting another hunter
 * does not trigger a second revenge.)
 */
export function hunterRevenge(game: Game, targetId: PlayerId | null): Game {
  if (game.pendingHunter === null) {
    return game;
  }
  const target =
    targetId === null
      ? null
      : (game.players.find((player) => player.id === targetId) ?? null);
  const players =
    target && target.alive
      ? game.players.map((player) =>
          player.id === target.id ? eliminate(player) : player,
        )
      : game.players;
  const cleared: Game = { ...game, players, pendingHunter: null };
  const resolved = resolve(cleared);
  return resolved.status === "ended" ? resolved : advancePhase(resolved);
}

/**
 * Resolves the pack's votes into a single victim. Each entry is one wolf's
 * chosen target (or null to abstain). Returns the plurality target; if the top
 * is tied between two or more targets, returns { victim: null, tie: true } so
 * the caller can run a re-vote (and, on a second tie, spare the night). No votes
 * at all is not a tie — nobody was chosen.
 */
export function resolveWolfVotes(
  votes: readonly (PlayerId | null)[],
): { victim: PlayerId | null; tie: boolean } {
  const tally = new Map<PlayerId, number>();
  for (const vote of votes) {
    if (vote !== null) {
      tally.set(vote, (tally.get(vote) ?? 0) + 1);
    }
  }
  if (tally.size === 0) {
    return { victim: null, tie: false };
  }
  let top = 0;
  let leaders: PlayerId[] = [];
  for (const [id, count] of tally) {
    if (count > top) {
      top = count;
      leaders = [id];
    } else if (count === top) {
      leaders.push(id);
    }
  }
  return leaders.length === 1
    ? { victim: leaders[0], tie: false }
    : { victim: null, tie: true };
}

/**
 * Resolves the town's day vote into a banishment. Each entry is one living
 * player's vote (or null to abstain), weight 1. Returns the plurality target.
 *
 * On a TIE for the top, the Alcalde may tip the scale: `mayorVote` is the LIVING
 * mayor's own vote (already counted in `votes`), or null when there is no living
 * mayor / the mayor abstained. If it lands on one of the tallied candidates, that
 * candidate gets +1 and the tally is re-evaluated —
 * modelling "on a tie the mayor's vote counts double". A unique winner then means
 * { banished, tied: false, brokenByMayor: true }; anything else stays a tie
 * ({ banished: null, tied: true }). No votes at all banishes nobody (not a tie).
 */
export function resolveDayVotes(
  votes: readonly (PlayerId | null)[],
  mayorVote: PlayerId | null = null,
): { banished: PlayerId | null; tied: boolean; brokenByMayor: boolean } {
  const tally = new Map<PlayerId, number>();
  for (const vote of votes) {
    if (vote !== null) {
      tally.set(vote, (tally.get(vote) ?? 0) + 1);
    }
  }
  if (tally.size === 0) {
    return { banished: null, tied: false, brokenByMayor: false };
  }
  const leaders = topLeaders(tally);
  if (leaders.length === 1) {
    return { banished: leaders[0], tied: false, brokenByMayor: false };
  }
  // A tie: the Alcalde's own vote may tip the scale if it landed on a tallied
  // candidate. Add its +1 and re-evaluate for a unique winner.
  if (mayorVote !== null && tally.has(mayorVote)) {
    const boosted = new Map(tally);
    boosted.set(mayorVote, (boosted.get(mayorVote) ?? 0) + 1);
    const after = topLeaders(boosted);
    if (after.length === 1) {
      return { banished: after[0], tied: false, brokenByMayor: true };
    }
  }
  return { banished: null, tied: true, brokenByMayor: false };
}

/** The candidates sharing the highest vote count in a tally. */
function topLeaders(tally: Map<PlayerId, number>): PlayerId[] {
  let top = 0;
  let leaders: PlayerId[] = [];
  for (const [id, count] of tally) {
    if (count > top) {
      top = count;
      leaders = [id];
    } else if (count === top) {
      leaders.push(id);
    }
  }
  return leaders;
}
