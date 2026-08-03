/** A player's secret role. */
export type Role =
  | "werewolf"
  | "infector"
  | "trickster"
  | "seer"
  | "guardian"
  | "hunter"
  | "insomniac"
  | "villager";

/** The two teams. */
export type Alignment = "wolves" | "town";

/** Which team a role belongs to (werewolf, infector and trickster are wolves). */
export function alignmentOf(role: Role): Alignment {
  return role === "werewolf" || role === "infector" || role === "trickster"
    ? "wolves"
    : "town";
}

/** Whether a role is on the wolf team. */
export function isWolf(role: Role): boolean {
  return alignmentOf(role) === "wolves";
}

/** What the seer perceives — the trickster's false purr reads as town. */
export function seerReadingOf(role: Role): Alignment {
  return role === "trickster" ? "town" : alignmentOf(role);
}
