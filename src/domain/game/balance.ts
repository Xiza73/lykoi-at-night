import type { RoleConfig } from "./player";
import { roleWeight } from "./roles";

/**
 * The signed balance of a hand: the sum of its roles' weights. Positive favours
 * the town (an easier game), negative favours the wolves (a harder game). The
 * seats not taken by a special role become villagers.
 */
export function configBalance(config: RoleConfig, count: number): number {
  const specials =
    config.werewolves +
    (config.seer ? 1 : 0) +
    (config.guardian ? 1 : 0) +
    (config.hunter ? 1 : 0) +
    (config.mayor ? 1 : 0);
  const villagers = count - specials;
  return (
    config.werewolves * roleWeight("werewolf") +
    (config.seer ? roleWeight("seer") : 0) +
    (config.guardian ? roleWeight("guardian") : 0) +
    (config.hunter ? roleWeight("hunter") : 0) +
    (config.mayor ? roleWeight("mayor") : 0) +
    villagers * roleWeight("villager")
  );
}

/**
 * How a total reads for players: from a hand tilted hard toward the wolves to
 * one tilted hard toward the town, with the recommended sweet spot (-3..+3)
 * spread across "experienced", "even" and "beginner".
 */
export type BalanceBand =
  | "wolfHeavy"
  | "experienced"
  | "even"
  | "beginner"
  | "townHeavy";

/** Maps a signed total to its balance band. */
export function balanceBand(total: number): BalanceBand {
  if (total <= -4) return "wolfHeavy";
  if (total < 0) return "experienced";
  if (total === 0) return "even";
  if (total <= 3) return "beginner";
  return "townHeavy";
}
