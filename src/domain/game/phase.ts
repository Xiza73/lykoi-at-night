/** The two halves of a game round. */
export type Phase = "day" | "night";

/** The phase that follows the given one in the day/night cycle. */
export function nextPhase(phase: Phase): Phase {
  return phase === "day" ? "night" : "day";
}
