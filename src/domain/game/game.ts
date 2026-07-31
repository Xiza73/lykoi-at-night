import type { Phase } from "./phase";
import { nextPhase } from "./phase";
import { dealRoles, type Player, type Seat } from "./player";
import { isWitch } from "./roles";
import type { Shuffle } from "./shuffle";

export type GameStatus = "in_progress" | "ended";

/** Setup options for a new game. */
export interface GameConfig {
  readonly witchCount: number;
}

/** Immutable snapshot of an in-progress game. */
export interface Game {
  readonly players: readonly Player[];
  readonly phase: Phase;
  readonly round: number;
  readonly status: GameStatus;
}

/** Creates a new game: deals roles and starts on Day 1. */
export function createGame(
  seats: readonly Seat[],
  config: GameConfig,
  shuffle: Shuffle,
): Game {
  const players = dealRoles(seats, config.witchCount, shuffle);
  return { players, phase: "day", round: 1, status: "in_progress" };
}

/**
 * Advances the day/night clock. Day -> Night keeps the round number;
 * Night -> Day starts the next round.
 */
export function advancePhase(game: Game): Game {
  const phase = nextPhase(game.phase);
  const round = game.phase === "night" ? game.round + 1 : game.round;
  return { ...game, phase, round };
}

/** Living players who belong to the witch faction. */
export function livingWitches(game: Game): readonly Player[] {
  return game.players.filter((player) => player.alive && isWitch(player.role));
}

/** Living players who are not witches. */
export function livingVillagers(game: Game): readonly Player[] {
  return game.players.filter((player) => player.alive && !isWitch(player.role));
}
