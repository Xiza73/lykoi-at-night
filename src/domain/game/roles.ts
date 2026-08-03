/** A player's secret role. */
export type Role = "werewolf" | "seer" | "guardian" | "villager";

/** The two teams. */
export type Alignment = "wolves" | "town";

/** Which team a role belongs to (only werewolves are wolves). */
export function alignmentOf(role: Role): Alignment {
  return role === "werewolf" ? "wolves" : "town";
}

/** Whether a role is a werewolf. */
export function isWolf(role: Role): boolean {
  return role === "werewolf";
}
