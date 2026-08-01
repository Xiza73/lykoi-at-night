import type { Phase } from "../../domain/game/phase";

/** Tone used for the current phase: warm gold by day, cold blue by night. */
export function phaseTone(phase: Phase): string {
  return phase === "day" ? "var(--lyk-gold)" : "var(--lyk-night-bright)";
}

/** Spanish label for a phase. */
export function phaseLabel(phase: Phase): string {
  return phase === "day" ? "Día" : "Noche";
}
