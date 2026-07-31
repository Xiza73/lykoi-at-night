import type { Role } from "./roles";
import type { Shuffle } from "./shuffle";

export type PlayerId = string;

/** A configured seat in the lobby, before roles are dealt. */
export interface Seat {
  readonly id: PlayerId;
  readonly name: string;
}

/** A player in an active game, holding a secret role. */
export interface Player {
  readonly id: PlayerId;
  readonly name: string;
  readonly role: Role;
  readonly alive: boolean;
}

/** Salem 1692 supports 4 to 12 players. */
export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 12;

/** Creates a living player with the given role. */
export function createPlayer(id: PlayerId, name: string, role: Role): Player {
  return { id, name, role, alive: true };
}

/** Returns a copy of the player marked as eliminated. */
export function eliminate(player: Player): Player {
  return { ...player, alive: false };
}

/**
 * Deals secret roles to seats: the first `witchCount` seats of the shuffled
 * order become witches, the rest villagers. Pure — given the same shuffle the
 * outcome is deterministic, which is what makes it testable.
 *
 * Throws if the seat count or witch count breaks the game's invariants.
 */
export function dealRoles(
  seats: readonly Seat[],
  witchCount: number,
  shuffle: Shuffle,
): Player[] {
  if (seats.length < MIN_PLAYERS || seats.length > MAX_PLAYERS) {
    throw new RangeError(
      `A game needs between ${MIN_PLAYERS} and ${MAX_PLAYERS} players, got ${seats.length}`,
    );
  }
  if (witchCount < 1 || witchCount >= seats.length) {
    throw new RangeError(
      `witchCount must be between 1 and ${seats.length - 1}, got ${witchCount}`,
    );
  }
  const ids = new Set(seats.map((seat) => seat.id));
  if (ids.size !== seats.length) {
    throw new Error("Duplicate player ids are not allowed");
  }

  return shuffle(seats).map((seat, index) =>
    createPlayer(seat.id, seat.name, index < witchCount ? "witch" : "villager"),
  );
}
