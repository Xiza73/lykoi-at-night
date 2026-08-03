import { describe, expect, it } from "vitest";
import {
  dealRoles,
  MAX_PLAYERS,
  MIN_PLAYERS,
  type Seat,
} from "../domain/game/player";
import type { Shuffle } from "../domain/game/shuffle";
import {
  isPresetAvailable,
  PRESETS,
  presetConfig,
  recommendedWolves,
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

describe("recommendedWolves", () => {
  it("scales roughly one wolf per four cats", () => {
    expect(recommendedWolves(4)).toBe(1);
    expect(recommendedWolves(8)).toBe(2);
    expect(recommendedWolves(12)).toBe(3);
  });

  it("never drops below one wolf", () => {
    expect(recommendedWolves(MIN_PLAYERS)).toBeGreaterThanOrEqual(1);
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
  it("offers the base presets from the minimum player count", () => {
    for (const preset of ["basic", "classic", "custom"] as const) {
      expect(isPresetAvailable(preset, MIN_PLAYERS)).toBe(true);
    }
  });

  it("gates Avanzado below five players", () => {
    expect(isPresetAvailable("advanced", 4)).toBe(false);
    expect(isPresetAvailable("advanced", 5)).toBe(true);
    expect(isPresetAvailable("advanced", MAX_PLAYERS)).toBe(true);
  });
});

describe("presetConfig", () => {
  it("Básico plays only Lykoi and honest cats", () => {
    expect(presetConfig("basic", 6)).toEqual({
      werewolves: recommendedWolves(6),
      seer: false,
      guardian: false,
    });
  });

  it("Clásico adds the Seer and Guardian", () => {
    expect(presetConfig("classic", 6)).toEqual({
      werewolves: recommendedWolves(6),
      seer: true,
      guardian: true,
    });
  });

  it("Personalizado starts from the Clásico hand", () => {
    expect(presetConfig("custom", 6)).toEqual(presetConfig("classic", 6));
  });

  describe("Avanzado scales with the player count", () => {
    it("opens at five with the Seer, Guardian and Cazador", () => {
      const config = presetConfig("advanced", 5);
      expect(config.seer).toBe(true);
      expect(config.guardian).toBe(true);
      expect(config.hunter).toBe(true);
    });

    it("scales the werewolf count up with the player count", () => {
      expect(presetConfig("advanced", 5).werewolves).toBe(
        recommendedWolves(5),
      );
      expect(presetConfig("advanced", MAX_PLAYERS).werewolves).toBe(
        recommendedWolves(MAX_PLAYERS),
      );
    });
  });
});

describe("preset invariant: every offered preset is dealable at every offered count", () => {
  it("never throws for any preset at any count where it is available", () => {
    for (const meta of PRESETS) {
      for (let count = MIN_PLAYERS; count <= MAX_PLAYERS; count += 1) {
        if (!isPresetAvailable(meta.id, count)) {
          continue;
        }
        const config = presetConfig(meta.id, count);
        expect(
          () => dealRoles(seats(count), config, identityShuffle),
          `${meta.id} @ ${count}`,
        ).not.toThrow();
      }
    }
  });
});
