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

/** The seer's reading of a player: their true alignment (null if unknown id). */
export function investigate(game: Game, targetId: PlayerId): Alignment | null {
  const target = game.players.find((player) => player.id === targetId);
  return target ? alignmentOf(target.role) : null;
}

/**
 * Resolves a night. The werewolves' victim dies unless a living guardian warded
 * exactly them. Then dawn breaks (advance to day) or the game ends. No-op unless
 * it is night and the game is in progress.
 */
export function resolveNight(
  game: Game,
  wolfTargetId: PlayerId | null,
  protectedId: PlayerId | null,
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
  const players =
    victim && victim.alive && !saved
      ? game.players.map((player) =>
          player.id === victim.id ? eliminate(player) : player,
        )
      : game.players;
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
  const resolved = resolve({ ...game, players });
  return resolved.status === "ended" ? resolved : advancePhase(resolved);
}
