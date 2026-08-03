import { describe, expect, it } from "vitest";
import { MAX_PLAYERS, MIN_PLAYERS } from "../domain/game/player";
import { presetConfig, recommendedWolves } from "./presets";

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
});
