import { describe, it, expect } from "vitest";
import { balanceBand, configBalance } from "./balance";
import type { RoleConfig } from "./player";

describe("configBalance", () => {
  it("scores the Clásico-6 hand (1 wolf, seer, guardian) at +7", () => {
    const config: RoleConfig = { werewolves: 1, seer: true, guardian: true };
    // -6 (wolf) + 7 (seer) + 3 (guardian) + 3 villagers * 1 = +7
    expect(configBalance(config, 6)).toBe(7);
  });

  it("scores the Básico-4 hand (1 wolf, no specials) at -3", () => {
    const config: RoleConfig = { werewolves: 1, seer: false, guardian: false };
    // -6 (wolf) + 3 villagers * 1 = -3
    expect(configBalance(config, 4)).toBe(-3);
  });

  it("adds the Cazador's +3 when the hunter is in play", () => {
    const withHunter: RoleConfig = {
      werewolves: 1,
      seer: true,
      guardian: true,
      hunter: true,
    };
    // -6 + 7 + 3 + 3 (hunter) + 2 villagers * 1 = +9
    expect(configBalance(withHunter, 6)).toBe(9);
  });

  it("adds the Alcalde's +2 when the mayor is in play", () => {
    const withMayor: RoleConfig = {
      werewolves: 1,
      seer: true,
      guardian: true,
      mayor: true,
    };
    // -6 + 7 + 3 + 2 (mayor) + 2 villagers * 1 = +8
    expect(configBalance(withMayor, 6)).toBe(8);
  });

  it("subtracts each extra wolf from the total", () => {
    const oneWolf: RoleConfig = { werewolves: 1, seer: true, guardian: true };
    const twoWolves: RoleConfig = { werewolves: 2, seer: true, guardian: true };
    // Second wolf takes a villager seat: -6 (wolf) - 1 (lost villager) = -7 swing.
    expect(configBalance(twoWolves, 6)).toBe(configBalance(oneWolf, 6) - 7);
  });
});

describe("balanceBand", () => {
  it("classifies each boundary", () => {
    expect(balanceBand(-4)).toBe("wolfHeavy");
    expect(balanceBand(-3)).toBe("experienced");
    expect(balanceBand(-1)).toBe("experienced");
    expect(balanceBand(0)).toBe("even");
    expect(balanceBand(1)).toBe("beginner");
    expect(balanceBand(3)).toBe("beginner");
    expect(balanceBand(4)).toBe("townHeavy");
  });
});
