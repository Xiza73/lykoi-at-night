/** A player's secret role. */
export type Role =
  | "werewolf"
  | "seer"
  | "guardian"
  | "hunter"
  | "mayor"
  | "cupid"
  | "villager";

/** The two teams. */
export type Alignment = "wolves" | "town";

/** Which team a role belongs to (only the werewolf is a wolf). */
export function alignmentOf(role: Role): Alignment {
  return role === "werewolf" ? "wolves" : "town";
}

/** Whether a role is on the wolf team. */
export function isWolf(role: Role): boolean {
  return alignmentOf(role) === "wolves";
}

/**
 * The balance weight each role contributes to a hand. Positive weights favour
 * the town; negative weights favour the wolves. These are the target-roster
 * weights used to score how easy or hard a game is for the town.
 */
export const ROLE_WEIGHT: Record<Role, number> = {
  werewolf: -6,
  seer: 7,
  guardian: 3, // becomes the Curandero later; same weight
  hunter: 3, // the Cazador; same weight
  mayor: 2, // the Alcalde: a conditional day-vote tie-break
  cupid: -2, // Cupido: the lover bond is a liability the pack can exploit
  villager: 1,
};

/** The balance weight for a single role. */
export function roleWeight(role: Role): number {
  return ROLE_WEIGHT[role];
}
