import type { Phase } from "./phase";
import { nextPhase } from "./phase";
import {
  dealRoles,
  eliminate,
  type Player,
  type PlayerId,
  type Seat,
} from "./player";
import { isWitch } from "./roles";
import type { Shuffle } from "./shuffle";

export type GameStatus = "in_progress" | "ended";

/** Which faction won, once the game has ended. */
export type Outcome = "town" | "witches";

/** Setup options for a new game. */
export interface GameConfig {
  readonly witchCount: number;
}

/** Immutable snapshot of a game. */
export interface Game {
  readonly players: readonly Player[];
  readonly phase: Phase;
  readonly round: number;
  readonly status: GameStatus;
  readonly winner: Outcome | null;
}

/** Creates a new game: deals roles and starts on Day 1, undecided. */
export function createGame(
  seats: readonly Seat[],
  config: GameConfig,
  shuffle: Shuffle,
): Game {
  const players = dealRoles(seats, config.witchCount, shuffle);
  return {
    players,
    phase: "day",
    round: 1,
    status: "in_progress",
    winner: null,
  };
}

/**
 * Advances the day/night clock. Once the game has ended this is a no-op and
 * returns the same snapshot. Day -> Night keeps the round number;
 * Night -> Day starts the next round.
 */
export function advancePhase(game: Game): Game {
  if (game.status === "ended") {
    return game;
  }
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

/**
 * Evaluates the win condition, mirroring Salem 1692:
 * - the town wins once no witch is left alive;
 * - the witches win once every living player is a witch.
 * Returns null while the game is still undecided.
 */
export function evaluateOutcome(game: Game): Outcome | null {
  if (livingWitches(game).length === 0) {
    return "town";
  }
  if (livingVillagers(game).length === 0) {
    return "witches";
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

/** Eliminates a player by id and re-evaluates the win condition. */
export function eliminatePlayer(game: Game, playerId: PlayerId): Game {
  const players = game.players.map((player) =>
    player.id === playerId ? eliminate(player) : player,
  );
  return resolve({ ...game, players });
}
