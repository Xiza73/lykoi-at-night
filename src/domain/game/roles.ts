/** A player's secret role. */
export type Role = "werewolf" | "infector" | "seer" | "guardian" | "hunter" | "villager";

/** The two teams. */
export type Alignment = "wolves" | "town";

/** Which team a role belongs to (werewolves and the infector are wolves). */
export function alignmentOf(role: Role): Alignment {
  return role === "werewolf" || role === "infector" ? "wolves" : "town";
}

/** Whether a role is on the wolf team. */
export function isWolf(role: Role): boolean {
  return alignmentOf(role) === "wolves";
}
