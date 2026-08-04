import { describe, expect, it } from "vitest";
import {
  dealRoles,
  MAX_PLAYERS,
  MIN_PLAYERS,
  type Seat,
} from "../domain/game/player";
import { configBalance } from "../domain/game/balance";
import type { Shuffle } from "../domain/game/shuffle";
import {
  isPresetAvailable,
  PRESETS,
  presetConfig,
  recommendedWolves,
  type PresetId,
} from "./presets";

/** Identity shuffle: leaves seat order untouched, so deals are deterministic. */
const identityShuffle: Shuffle = (items) => [...items];

/** Builds a roster of `count` plain seats for dealing in tests. */
function seats(count: number): Seat[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `p${index + 1}`,
    name: `Gato ${index + 1}`,
  }));
}

/** The three curated skill levels, each covering the full 4..24 range. */
const LEVELS = ["beginner", "intermediate", "advanced"] as const;

/**
 * The balance band each level must land in, given the player count. Avanzado is
 * allowed a slightly wider window at the deck's extremes (counts >= 21), where
 * the six-Lykoi / twelve-villager caps force a harder tilt.
 */
function bandFor(level: (typeof LEVELS)[number], count: number): [number, number] {
  if (level === "beginner") return [1, 3];
  if (level === "intermediate") return [-1, 1];
  return count >= 21 ? [-5, -1] : [-3, -1];
}

describe("recommendedWolves", () => {
  it("scales roughly one wolf per four cats", () => {
    expect(recommendedWolves(4)).toBe(1);
    expect(recommendedWolves(8)).toBe(2);
    expect(recommendedWolves(12)).toBe(3);
  });

  it("never drops below one wolf", () => {
    expect(recommendedWolves(MIN_PLAYERS)).toBeGreaterThanOrEqual(1);
  });

  it("caps at the deck's six Lykoi", () => {
    expect(recommendedWolves(MAX_PLAYERS)).toBe(6);
  });

  it("never reaches parity with the town", () => {
    for (let count = MIN_PLAYERS; count <= MAX_PLAYERS; count += 1) {
      const upper = Math.floor((count - 1) / 2);
      expect(recommendedWolves(count)).toBeLessThanOrEqual(upper);
      // Below parity means the pack stays strictly smaller than the townsfolk.
      expect(recommendedWolves(count)).toBeLessThan(count - recommendedWolves(count));
    }
  });
});

describe("isPresetAvailable", () => {
  it("offers every preset from the minimum player count up", () => {
    for (const meta of PRESETS) {
      for (let count = MIN_PLAYERS; count <= MAX_PLAYERS; count += 1) {
        expect(isPresetAvailable(meta.id, count)).toBe(true);
      }
    }
  });
});

describe("presetConfig — Personalizado", () => {
  it("hands back a blank slate: recommended Lykoi and no specials", () => {
    for (let count = MIN_PLAYERS; count <= MAX_PLAYERS; count += 1) {
      const config = presetConfig("custom", count);
      expect(config.werewolves).toBe(recommendedWolves(count));
      expect(config.seer).toBeFalsy();
      expect(config.guardian).toBeFalsy();
      expect(config.hunter).toBeFalsy();
      expect(config.mayor).toBeFalsy();
      expect(config.cupid).toBeFalsy();
      expect(config.witch).toBeFalsy();
      expect(config.littleRed).toBeFalsy();
    }
  });
});

/**
 * The safety net that locks the whole curated table: for every skill level and
 * every player count 4..24 the hand must be dealable (a valid config for the
 * finite deck) AND sit inside its balance band.
 */
describe("preset table invariant: every level is dealable and in-band at every count", () => {
  for (const level of LEVELS) {
    for (let count = MIN_PLAYERS; count <= MAX_PLAYERS; count += 1) {
      const id: PresetId = level;

      it(`${level} @ ${count} deals a valid, in-band hand`, () => {
        const config = presetConfig(id, count);

        // Dealable: at most 6 wolves, at most 12 villagers, a strict wolf
        // minority, and specials that fit the seats — dealRoles enforces all.
        expect(() =>
          dealRoles(seats(count), config, identityShuffle),
        ).not.toThrow();

        // In-band: the hand's signed balance lands in its level's window.
        const [lo, hi] = bandFor(level, count);
        const balance = configBalance(config, count);
        expect(balance).toBeGreaterThanOrEqual(lo);
        expect(balance).toBeLessThanOrEqual(hi);
      });
    }
  }
});
