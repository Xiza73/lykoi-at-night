import { describe, expect, it } from "vitest";
import {
  dealRoles,
  MAX_PLAYERS,
  MIN_PLAYERS,
  type Seat,
} from "../domain/game/player";
import type { Shuffle } from "../domain/game/shuffle";
import {
  COMING_SOON_ROLES,
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
    it("opens at five with the Cazador but no wolf-aligned specials", () => {
      const config = presetConfig("advanced", 5);
      expect(config.hunter).toBe(true);
      expect(config.infector).toBe(false);
      expect(config.trickster).toBe(false);
    });

    it("adds the Madre Camada from seven players", () => {
      expect(presetConfig("advanced", 6).infector).toBe(false);
      expect(presetConfig("advanced", 7).infector).toBe(true);
    });

    it("adds the Ronroneo Falso from nine players", () => {
      expect(presetConfig("advanced", 8).trickster).toBe(false);
      expect(presetConfig("advanced", 9).trickster).toBe(true);
    });

    it("includes strictly more special roles at higher counts", () => {
      const specialsAt = (count: number) => {
        const config = presetConfig("advanced", count);
        const wolfSpecials =
          (config.infector ? 1 : 0) + (config.trickster ? 1 : 0);
        const townSpecials =
          (config.seer ? 1 : 0) +
          (config.guardian ? 1 : 0) +
          (config.hunter ? 1 : 0) +
          (config.insomniac ? 1 : 0) +
          (config.gossip ? 1 : 0);
        return wolfSpecials + townSpecials;
      };
      expect(specialsAt(5)).toBeLessThan(specialsAt(9));
      expect(specialsAt(6)).toBeGreaterThanOrEqual(specialsAt(5));
    });
  });

  it("has no coming-soon roles left: all nine are implemented", () => {
    expect(COMING_SOON_ROLES).toEqual([]);
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
