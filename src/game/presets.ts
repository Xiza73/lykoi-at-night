import { MIN_PLAYERS, type RoleConfig } from "../domain/game/player";
import { maxWolves } from "./roleLabels";

/**
 * The recommended number of Lykoi for a given player count: roughly one wolf per
 * four cats, never fewer than one and never enough to reach parity with the town
 * (kept strictly below `floor((count - 1) / 2)`, which `maxWolves` enforces).
 */
export function recommendedWolves(count: number): number {
  return Math.min(Math.max(1, Math.floor(count / 4)), maxWolves(count));
}

/**
 * The presets offered by the wizard: three curated skill levels plus a blank
 * custom hand the player builds up role by role.
 */
export type PresetId = "beginner" | "intermediate" | "advanced" | "custom";

/** The three curated skill levels — every one has an entry for every count 4..24. */
type SkillLevel = Exclude<PresetId, "custom">;

/** A preset's identity plus the smallest player count it can be dealt at. */
export interface PresetMeta {
  readonly id: PresetId;
  readonly name: string;
  readonly minPlayers: number;
}

/**
 * The presets offered by the wizard, each with its minimum player count. Every
 * preset covers the full 4..24 range, so none is ever gated in the picker.
 */
export const PRESETS: readonly PresetMeta[] = [
  { id: "beginner", name: "Principiante", minPlayers: MIN_PLAYERS },
  { id: "intermediate", name: "Intermedio", minPlayers: MIN_PLAYERS },
  { id: "advanced", name: "Avanzado", minPlayers: MIN_PLAYERS },
  { id: "custom", name: "Personalizado", minPlayers: MIN_PLAYERS },
];

/** True when `preset` can be dealt at `count` players. */
export function isPresetAvailable(preset: PresetId, count: number): boolean {
  const meta = PRESETS.find((p) => p.id === preset);
  return meta ? count >= meta.minPlayers : false;
}

/**
 * The curated preset tables: one hand per player count (4..24) at each skill
 * level. Each entry was derived to land in the balance band measured by
 * `configBalance` (see `../domain/game/balance`):
 *   - Principiante: +1..+3 (comfortably town-favoured)
 *   - Intermedio:   −1..+1 (roughly even)
 *   - Avanzado:     −1..−3 (wolf-favoured)
 * with a small documented margin at the deck's extremes (counts >= 21, where the
 * six-Lykoi / twelve-villager caps bite, Avanzado may reach −4/−5). Every hand
 * also respects the finite deck: at most 6 Lykoi, at most 12 villagers, at most
 * one of each special. `presets.test.ts` locks all 63 cells to their band.
 */
const PRESET_TABLES: Record<SkillLevel, Record<number, RoleConfig>> = {
  beginner: {
    4: { werewolves: 1, seer: true },
    5: { werewolves: 2, seer: true, mayor: true, witch: true },
    6: { werewolves: 2, seer: true, guardian: true, hunter: true, mayor: true },
    7: { werewolves: 2, seer: true, guardian: true, mayor: true },
    8: { werewolves: 3, seer: true, guardian: true, hunter: true, mayor: true, witch: true },
    9: { werewolves: 3, seer: true, guardian: true, hunter: true, mayor: true, witch: true },
    10: { werewolves: 3, seer: true, guardian: true, hunter: true, mayor: true, littleRed: true },
    11: { werewolves: 3, seer: true, guardian: true, hunter: true, mayor: true, littleRed: true },
    12: { werewolves: 3, seer: true, guardian: true, hunter: true, mayor: true },
    13: { werewolves: 4, seer: true, guardian: true, hunter: true, mayor: true, witch: true, littleRed: true },
    14: { werewolves: 4, seer: true, guardian: true, hunter: true, mayor: true, witch: true, littleRed: true },
    15: { werewolves: 4, seer: true, guardian: true, hunter: true, mayor: true, witch: true },
    16: { werewolves: 4, seer: true, guardian: true, hunter: true, mayor: true, witch: true },
    17: { werewolves: 4, seer: true, guardian: true, hunter: true, mayor: true, littleRed: true },
    18: { werewolves: 4, seer: true, guardian: true, hunter: true, mayor: true, littleRed: true },
    19: { werewolves: 5, seer: true, guardian: true, hunter: true, mayor: true, witch: true, littleRed: true },
    20: { werewolves: 5, seer: true, guardian: true, hunter: true, mayor: true, witch: true, littleRed: true },
    21: { werewolves: 5, seer: true, guardian: true, hunter: true, mayor: true, witch: true, littleRed: true },
    22: { werewolves: 5, seer: true, guardian: true, hunter: true, mayor: true, witch: true },
    23: { werewolves: 5, seer: true, guardian: true, hunter: true, mayor: true, cupid: true, witch: true, littleRed: true },
    24: { werewolves: 5, seer: true, guardian: true, hunter: true, mayor: true, cupid: true, witch: true, littleRed: true },
  },
  intermediate: {
    4: { werewolves: 1, seer: true, cupid: true },
    5: { werewolves: 2, seer: true, guardian: true, mayor: true },
    6: { werewolves: 2, seer: true, guardian: true },
    7: { werewolves: 2, seer: true, mayor: true },
    8: { werewolves: 2, seer: true },
    9: { werewolves: 2, seer: true },
    10: { werewolves: 3, seer: true, guardian: true, hunter: true, mayor: true },
    11: { werewolves: 3, seer: true, guardian: true, hunter: true },
    12: { werewolves: 3, seer: true, guardian: true, mayor: true },
    13: { werewolves: 4, seer: true, guardian: true, hunter: true, mayor: true, witch: true },
    14: { werewolves: 4, seer: true, guardian: true, hunter: true, witch: true },
    15: { werewolves: 4, seer: true, guardian: true, hunter: true, mayor: true, littleRed: true },
    16: { werewolves: 4, seer: true, guardian: true, hunter: true, mayor: true, littleRed: true },
    17: { werewolves: 5, seer: true, guardian: true, hunter: true, mayor: true, witch: true, littleRed: true },
    18: { werewolves: 5, seer: true, guardian: true, hunter: true, mayor: true, witch: true, littleRed: true },
    19: { werewolves: 5, seer: true, guardian: true, hunter: true, witch: true, littleRed: true },
    20: { werewolves: 5, seer: true, guardian: true, hunter: true, mayor: true, witch: true },
    21: { werewolves: 5, seer: true, guardian: true, hunter: true, mayor: true, witch: true },
    22: { werewolves: 5, seer: true, guardian: true, hunter: true, mayor: true, littleRed: true },
    23: { werewolves: 5, seer: true, guardian: true, hunter: true, mayor: true, cupid: true, witch: true },
    24: { werewolves: 6, seer: true, guardian: true, hunter: true, mayor: true, witch: true, littleRed: true },
  },
  advanced: {
    4: { werewolves: 1 },
    5: { werewolves: 2, seer: true },
    6: { werewolves: 2, seer: true },
    7: { werewolves: 2, seer: true },
    8: { werewolves: 3, seer: true, witch: true },
    9: { werewolves: 3, seer: true, witch: true },
    10: { werewolves: 3, seer: true, witch: true },
    11: { werewolves: 3, seer: true, guardian: true },
    12: { werewolves: 4, seer: true, guardian: true, hunter: true, witch: true },
    13: { werewolves: 4, seer: true, guardian: true, witch: true },
    14: { werewolves: 4, seer: true, guardian: true, witch: true },
    15: { werewolves: 4, seer: true, mayor: true, witch: true },
    16: { werewolves: 5, seer: true, guardian: true, hunter: true, witch: true, littleRed: true },
    17: { werewolves: 5, seer: true, guardian: true, hunter: true, witch: true, littleRed: true },
    18: { werewolves: 5, seer: true, guardian: true, hunter: true, mayor: true, witch: true },
    19: { werewolves: 5, seer: true, guardian: true, hunter: true, witch: true },
    20: { werewolves: 5, seer: true, guardian: true, mayor: true, witch: true },
    21: { werewolves: 6, seer: true, guardian: true, hunter: true, mayor: true, witch: true, littleRed: true },
    22: { werewolves: 6, seer: true, guardian: true, hunter: true, mayor: true, witch: true, littleRed: true },
    23: { werewolves: 6, seer: true, guardian: true, hunter: true, mayor: true, witch: true, littleRed: true },
    24: { werewolves: 6, seer: true, guardian: true, hunter: true, mayor: true, cupid: true, witch: true, littleRed: true },
  },
};

/**
 * The role config a preset resolves to for the current player count. The three
 * skill levels read straight from the curated table; "custom" hands back a blank
 * slate — the recommended Lykoi and no specials — for the player to build up.
 */
export function presetConfig(preset: PresetId, count: number): RoleConfig {
  if (preset === "custom") {
    return { werewolves: recommendedWolves(count) };
  }
  return PRESET_TABLES[preset][count];
}

/**
 * The special roles previewed under the Personalizado preset that are not yet
 * dealable. Display-only: they are NOT part of `RoleConfig` and never reach the
 * domain. All nine roles are now implemented as real toggles, so this list is
 * empty; it is kept as the seam for any future not-yet-dealable role.
 */
export const COMING_SOON_ROLES = [] as const;

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
