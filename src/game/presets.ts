import type { RoleConfig } from "../domain/game/player";
import { maxWolves } from "./roleLabels";

/**
 * The recommended number of Lykoi for a given player count: roughly one wolf per
 * four cats, never fewer than one and never enough to reach parity with the town
 * (kept strictly below `floor((count - 1) / 2)`, which `maxWolves` enforces).
 */
export function recommendedWolves(count: number): number {
  return Math.min(Math.max(1, Math.floor(count / 4)), maxWolves(count));
}

/** The presets offered by the wizard. "advanced" is a preview and not dealable. */
export type PresetId = "basic" | "classic" | "advanced" | "custom";

/** The role config a preset resolves to for the current player count. */
export function presetConfig(preset: PresetId, count: number): RoleConfig {
  const werewolves = recommendedWolves(count);
  switch (preset) {
    case "basic":
      return { werewolves, seer: false, guardian: false };
    case "classic":
    case "custom":
    case "advanced":
      // Custom and advanced both start from the Clásico hand as their baseline.
      return { werewolves, seer: true, guardian: true };
  }
}

/**
 * The five special roles previewed under the Personalizado preset. Display-only:
 * they are NOT part of `RoleConfig` and never reach the domain — the deck still
 * only carries werewolf / seer / guardian / villager.
 */
export const COMING_SOON_ROLES = [
  "Cazador de Sombras",
  "Madre Camada",
  "Ronroneo Falso",
  "El Insomne",
  "La Chismosa",
] as const;

/**
 * Cat-name pool used to prefill the roster so a deal is never blocked by an
 * empty seat. Seats beyond the pool fall back to "Gato N".
 */
export const CAT_NAME_POOL = [
  "Ceniza",
  "Morriña",
  "Doña Perpetua",
  "Almendra",
  "Tuerto",
  "Bigotes",
  "Nube",
  "Ramona",
  "Sardina",
  "Óxido",
  "Lunes",
  "Fantasma",
] as const;

/** The default name for the seat at `index` (0-based), from the pool or a fallback. */
export function defaultName(index: number): string {
  return CAT_NAME_POOL[index] ?? `Gato ${index + 1}`;
}
