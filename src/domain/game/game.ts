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
import { dealTryals, type TryalDeck } from "./tryal";

export type GameStatus = "in_progress" | "ended";

/** Which faction won, once the game has ended. */
export type Outcome = "town" | "witches";

/** Accusations required to send a player to trial (as in Salem 1692). */
export const ACCUSATIONS_FOR_TRIAL = 7;

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
  readonly accusations: Readonly<Record<PlayerId, number>>;
  readonly tryals: Readonly<Record<PlayerId, TryalDeck>>;
  readonly onTrial: PlayerId | null;
}

/** Creates a new game: deals roles and tryal cards, starts on Day 1. */
export function createGame(
  seats: readonly Seat[],
  config: GameConfig,
  shuffle: Shuffle,
): Game {
  const players = dealRoles(seats, config.witchCount, shuffle);
  const tryals = dealTryals(players, shuffle);
  const accusations: Record<PlayerId, number> = {};
  for (const player of players) {
    accusations[player.id] = 0;
  }
  return {
    players,
    phase: "day",
    round: 1,
    status: "in_progress",
    winner: null,
    accusations,
    tryals,
    onTrial: null,
  };
}

/**
 * Advances the day/night clock. No-op once the game has ended. Day -> Night
 * keeps the round number; Night -> Day starts the next round.
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

/**
 * Places an accusation on a living player. Reaching ACCUSATIONS_FOR_TRIAL sends
 * that player to trial and clears their accusation count. Ignored while a trial
 * is already pending or the game has ended.
 */
export function accuse(game: Game, targetId: PlayerId): Game {
  if (game.status === "ended" || game.onTrial !== null) {
    return game;
  }
  const target = game.players.find((player) => player.id === targetId);
  if (!target || !target.alive) {
    return game;
  }
  const next = (game.accusations[targetId] ?? 0) + 1;
  if (next >= ACCUSATIONS_FOR_TRIAL) {
    return {
      ...game,
      accusations: { ...game.accusations, [targetId]: 0 },
      onTrial: targetId,
    };
  }
  return { ...game, accusations: { ...game.accusations, [targetId]: next } };
}

/**
 * Reveals one of the accused player's tryal cards during a trial. The accused
 * dies if the revealed card is a witch card, or if it was their last hidden
 * card. Clears the trial and re-evaluates the win condition.
 */
export function revealTryal(game: Game, index: number): Game {
  const accusedId = game.onTrial;
  if (accusedId === null) {
    return game;
  }
  const deck = game.tryals[accusedId];
  if (index < 0 || index >= deck.cards.length || deck.revealed[index]) {
    return game;
  }
  const revealed = deck.revealed.map((flag, i) => (i === index ? true : flag));
  const card = deck.cards[index];
  const dies = card === "witch" || revealed.every((flag) => flag);
  const players = dies
    ? game.players.map((player) =>
        player.id === accusedId ? eliminate(player) : player,
      )
    : game.players;
  return resolve({
    ...game,
    players,
    tryals: { ...game.tryals, [accusedId]: { cards: deck.cards, revealed } },
    onTrial: null,
  });
}

/** The living player whose constable tryal card is still hidden, or null. */
export function constableId(game: Game): PlayerId | null {
  for (const player of game.players) {
    if (!player.alive) {
      continue;
    }
    const deck = game.tryals[player.id];
    const index = deck.cards.indexOf("constable");
    if (index >= 0 && !deck.revealed[index]) {
      return player.id;
    }
  }
  return null;
}

/**
 * Resolves a night. The witches' victim dies unless the constable warded
 * exactly that player (the constable cannot ward themselves). Then dawn breaks:
 * the game advances to the next day, or ends if a faction has won. No-op unless
 * it is night and the game is still in progress.
 */
export function resolveNight(
  game: Game,
  victimId: PlayerId,
  wardedId: PlayerId | null,
): Game {
  if (game.phase !== "night" || game.status === "ended") {
    return game;
  }
  const victim = game.players.find((player) => player.id === victimId);
  if (!victim || !victim.alive) {
    return game;
  }
  const guard = constableId(game);
  const warded = guard !== null && wardedId === victimId && victimId !== guard;
  const players = warded
    ? game.players
    : game.players.map((player) =>
        player.id === victimId ? eliminate(player) : player,
      );
  const resolved = resolve({ ...game, players });
  return resolved.status === "ended" ? resolved : advancePhase(resolved);
}
