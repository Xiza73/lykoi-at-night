import type { TryalCard } from "../domain/game/tryal";

/** Spanish display label for a tryal card. */
export function tryalLabel(card: TryalCard): string {
  switch (card) {
    case "witch":
      return "La Marca";
    case "constable":
      return "El Guardián";
    case "not_witch":
      return "Sin mancha";
  }
}

/** Tone used to colour a tryal card by kind. */
export function tryalTone(card: TryalCard): string {
  switch (card) {
    case "witch":
      return "var(--lyk-blood-bright)";
    case "constable":
      return "var(--lyk-gold)";
    case "not_witch":
      return "var(--lyk-muted)";
  }
}
