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

/** The presets offered by the wizard. All four are dealable. */
export type PresetId = "basic" | "classic" | "advanced" | "custom";

/** A preset's identity plus the smallest player count it can be dealt at. */
export interface PresetMeta {
  readonly id: PresetId;
  readonly name: string;
  readonly minPlayers: number;
}

/**
 * The presets offered by the wizard, each with its minimum player count. Below
 * that count the preset is shown disabled in the picker.
 */
export const PRESETS: readonly PresetMeta[] = [
  { id: "basic", name: "Básico", minPlayers: MIN_PLAYERS }, // 4
  { id: "classic", name: "Clásico", minPlayers: MIN_PLAYERS }, // 4
  { id: "advanced", name: "Avanzado", minPlayers: 5 },
  { id: "custom", name: "Personalizado", minPlayers: MIN_PLAYERS },
];

/** True when `preset` can be dealt at `count` players. */
export function isPresetAvailable(preset: PresetId, count: number): boolean {
  const meta = PRESETS.find((p) => p.id === preset);
  return meta ? count >= meta.minPlayers : false;
}

/**
 * The Avanzado role ladder: each role joins the hand once the player count
 * reaches its `min`. The two wolf-aligned specials (Madre Camada, Ronroneo
 * Falso) are marked `wolf` so they are counted into the pack, keeping the wolves
 * a strict minority instead of stacking on top of `recommendedWolves`.
 */
const AVANZADO_LADDER: readonly {
  role: keyof RoleConfig;
  min: number;
  wolf?: boolean;
}[] = [
  { role: "seer", min: 5 },
  { role: "guardian", min: 5 },
  { role: "hunter", min: 5 },
  { role: "insomniac", min: 6 },
  { role: "infector", min: 7, wolf: true },
  { role: "gossip", min: 8 },
  { role: "trickster", min: 9, wolf: true },
];

/** Builds the Avanzado hand for `count`, scaling roles in via the ladder. */
function advancedConfig(count: number): RoleConfig {
  const included = AVANZADO_LADDER.filter((r) => count >= r.min);
  const wolfSpecials = included.filter((r) => r.wolf).length;
  // The wolf-aligned specials are counted into the pack, so back the plain
  // werewolves down to keep total wolves ≈ recommendedWolves (never below 1).
  const werewolves = Math.max(1, recommendedWolves(count) - wolfSpecials);
  const has = (role: keyof RoleConfig) => included.some((r) => r.role === role);
  return {
    werewolves,
    seer: has("seer"),
    guardian: has("guardian"),
    hunter: has("hunter"),
    insomniac: has("insomniac"),
    infector: has("infector"),
    gossip: has("gossip"),
    trickster: has("trickster"),
  };
}

/** The role config a preset resolves to for the current player count. */
export function presetConfig(preset: PresetId, count: number): RoleConfig {
  const werewolves = recommendedWolves(count);
  switch (preset) {
    case "basic":
      return { werewolves, seer: false, guardian: false };
    case "advanced":
      return advancedConfig(count);
    case "classic":
    case "custom":
      // Custom starts from the Clásico hand as its baseline.
      return { werewolves, seer: true, guardian: true };
  }
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
