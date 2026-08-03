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

/** The game supports 4 to 12 players. */
export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 12;

/** Which special roles are in play; the remaining seats become villagers. */
export interface RoleConfig {
  readonly werewolves: number;
  readonly seer: boolean;
  readonly guardian: boolean;
  readonly hunter?: boolean;
  readonly mayor?: boolean;
  readonly cupid?: boolean;
  readonly witch?: boolean;
  readonly littleRed?: boolean;
}

/**
 * The number of NON-villager seats a config deals: the werewolves plus every
 * enabled special role. The remaining `count - countSpecials(config)` seats
 * become villagers. This is the single source of truth for the specials tally —
 * dealing, balance scoring and the lobby's validity gate all call it, so adding
 * a new role can never leave the sites out of sync.
 */
export function countSpecials(config: RoleConfig): number {
  return (
    config.werewolves +
    (config.seer ? 1 : 0) +
    (config.guardian ? 1 : 0) +
    (config.hunter ? 1 : 0) +
    (config.mayor ? 1 : 0) +
    (config.cupid ? 1 : 0) +
    (config.witch ? 1 : 0) +
    (config.littleRed ? 1 : 0)
  );
}

/** Creates a living player with the given role. */
export function createPlayer(id: PlayerId, name: string, role: Role): Player {
  return { id, name, role, alive: true };
}

/** Returns a copy of the player marked as eliminated. */
export function eliminate(player: Player): Player {
  return { ...player, alive: false };
}

/**
 * Deals roles to seats: the configured werewolves, an optional seer and
 * guardian, and villagers for the rest. Shuffled so roles are unlinkable to
 * seat order. Throws if the config breaks the game's invariants.
 */
export function dealRoles(
  seats: readonly Seat[],
  config: RoleConfig,
  shuffle: Shuffle,
): Player[] {
  if (seats.length < MIN_PLAYERS || seats.length > MAX_PLAYERS) {
    throw new RangeError(
      `A game needs between ${MIN_PLAYERS} and ${MAX_PLAYERS} players, got ${seats.length}`,
    );
  }
  const ids = new Set(seats.map((seat) => seat.id));
  if (ids.size !== seats.length) {
    throw new Error("Duplicate player ids are not allowed");
  }
  if (config.werewolves < 1) {
    throw new RangeError("A game needs at least one werewolf");
  }
  const wolfCount = config.werewolves;
  const specials = countSpecials(config);
  if (specials > seats.length) {
    throw new RangeError("More special roles than players");
  }
  const town = seats.length - wolfCount;
  if (wolfCount >= town) {
    throw new RangeError("Werewolves must be fewer than the townsfolk");
  }

  const roles: Role[] = [];
  for (let i = 0; i < config.werewolves; i += 1) {
    roles.push("werewolf");
  }
  if (config.seer) {
    roles.push("seer");
  }
  if (config.guardian) {
    roles.push("guardian");
  }
  if (config.hunter) {
    roles.push("hunter");
  }
  if (config.mayor) {
    roles.push("mayor");
  }
  if (config.cupid) {
    roles.push("cupid");
  }
  if (config.witch) {
    roles.push("witch");
  }
  if (config.littleRed) {
    roles.push("littleRed");
  }
  while (roles.length < seats.length) {
    roles.push("villager");
  }

  // Shuffle the ROLES, not the seats: players keep their entry order so the
  // phone travels the table seat by seat (names = seating order), while roles
  // stay unlinkable to any given seat.
  const dealt = shuffle(roles);
  return seats.map((seat, index) =>
    createPlayer(seat.id, seat.name, dealt[index]),
  );
}
