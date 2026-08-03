import { describe, it, expect } from "vitest";
import {
  advancePhase,
  createGame,
  lynch,
  pledgeLovers,
  resolveNight,
  type Game,
} from "./game";
import { alignmentOf, ROLE_WEIGHT } from "./roles";
import { configBalance } from "./balance";
import { countSpecials, type RoleConfig, type Seat } from "./player";
import type { Shuffle } from "./shuffle";

const identityShuffle: Shuffle = (items) => [...items];

function seats(count: number): Seat[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
  }));
}

function isAlive(g: Game, id: string): boolean {
  const p = g.players.find((pp) => pp.id === id);
  return p ? p.alive : false;
}

describe("little red — role plumbing", () => {
  it("is town-aligned (only the werewolf is a wolf)", () => {
    expect(alignmentOf("littleRed")).toBe("town");
  });

  it("weighs +3 toward the town", () => {
    expect(ROLE_WEIGHT.littleRed).toBe(3);
  });

  it("deals a littleRed when configured, before the villagers", () => {
    // p1 wolf, p2 littleRed, p3-5 villagers (identity shuffle, push order).
    const cfg: RoleConfig = {
      werewolves: 1,
      seer: false,
      guardian: false,
      littleRed: true,
    };
    const g = createGame(seats(5), cfg, identityShuffle);
    expect(g.players.filter((p) => p.role === "littleRed")).toHaveLength(1);
    expect(g.players.find((p) => p.id === "p2")?.role).toBe("littleRed");
  });

  it("counts its seat as a special in the balance total (+3 over a plain villager)", () => {
    const base: RoleConfig = { werewolves: 1, seer: false, guardian: false };
    const withRed: RoleConfig = { ...base, littleRed: true };
    // A littleRed seat replaces a villager (+1) with a +3 role: a net +2.
    expect(configBalance(withRed, 6) - configBalance(base, 6)).toBe(2);
  });
});

describe("countSpecials — the single source of truth for non-villager seats", () => {
  it("counts only the werewolves when every special flag is off", () => {
    expect(countSpecials({ werewolves: 2, seer: false, guardian: false })).toBe(
      2,
    );
  });

  it("sums the werewolves and every enabled special", () => {
    const full: RoleConfig = {
      werewolves: 1,
      seer: true,
      guardian: true,
      hunter: true,
      mayor: true,
      cupid: true,
      witch: true,
      littleRed: true,
    };
    expect(countSpecials(full)).toBe(8); // 1 wolf + 7 specials
  });

  it("ignores absent optional flags (treated as off)", () => {
    expect(countSpecials({ werewolves: 1, seer: true, guardian: false })).toBe(
      2,
    );
  });
});

describe("little red — immunity to the wolves while a Cazador lives", () => {
  // p1 wolf, p2 hunter, p3 littleRed, p4/p5 villagers (identity shuffle).
  const withHunter: RoleConfig = {
    werewolves: 1,
    seer: false,
    guardian: false,
    hunter: true,
    littleRed: true,
  };

  it("survives the wolves' attack while a hunter is alive; the night still advances", () => {
    const g = createGame(seats(5), withHunter, identityShuffle);
    const after = resolveNight(g, "p3", null); // wolves target Caperucita
    expect(isAlive(after, "p3")).toBe(true); // immune while the Cazador breathes
    expect(after.phase).toBe("day");
    expect(after.status).toBe("in_progress");
  });

  it("dies to the wolves when NO hunter is in the game", () => {
    // p1 wolf, p2 littleRed, p3-5 villagers.
    const cfg: RoleConfig = {
      werewolves: 1,
      seer: false,
      guardian: false,
      littleRed: true,
    };
    const g = createGame(seats(5), cfg, identityShuffle);
    const after = resolveNight(g, "p2", null);
    expect(isAlive(after, "p2")).toBe(false);
  });

  it("dies to the wolves when the Cazador was dealt but already killed a prior night", () => {
    // p1 wolf, p2 hunter, p3 littleRed, p4-6 villagers.
    const cfg: RoleConfig = {
      werewolves: 1,
      seer: false,
      guardian: false,
      hunter: true,
      littleRed: true,
    };
    let g = createGame(seats(6), cfg, identityShuffle);
    // Night 1: the wolves kill the hunter (p2), who takes nobody.
    g = resolveNight(g, "p2", null, null);
    expect(isAlive(g, "p2")).toBe(false);
    g = advancePhase(g); // day1 -> night2
    // Night 2: no living hunter, so Caperucita (p3) dies to the wolves normally.
    g = resolveNight(g, "p3", null);
    expect(isAlive(g, "p3")).toBe(false);
  });

  it("(control) the hunter can be the wolves' target and Caperucita is untouched", () => {
    const g = createGame(seats(5), withHunter, identityShuffle);
    const after = resolveNight(g, "p2", null); // wolves take the hunter himself
    expect(isAlive(after, "p2")).toBe(false); // the hunter fell
    expect(isAlive(after, "p3")).toBe(true); // Caperucita never in danger
  });
});

describe("little red — the immunity is wolves-only", () => {
  it("dies when banished by a day lynch, even with a living hunter", () => {
    const cfg: RoleConfig = {
      werewolves: 1,
      seer: false,
      guardian: false,
      hunter: true,
      littleRed: true,
    };
    let g = createGame(seats(5), cfg, identityShuffle);
    g = advancePhase(g); // night1 -> day1
    const after = lynch(g, "p3"); // banish Caperucita
    expect(isAlive(after, "p3")).toBe(false);
  });

  it("dies to La Bruja's poison, even with a living hunter", () => {
    // p1 wolf, p2 hunter, p3 witch, p4 littleRed, p5/p6 villagers.
    const cfg: RoleConfig = {
      werewolves: 1,
      seer: false,
      guardian: false,
      hunter: true,
      witch: true,
      littleRed: true,
    };
    const g = createGame(seats(6), cfg, identityShuffle);
    const after = resolveNight(g, null, null, null, {
      heal: false,
      poisonTargetId: "p4",
    });
    expect(isAlive(after, "p4")).toBe(false); // poison is a separate elimination
  });

  it("follows a fallen Cupido partner through the lover bond, even with a living hunter", () => {
    // p1 wolf, p2 hunter, p3 cupid, p4 littleRed, p5/p6 villagers.
    const cfg: RoleConfig = {
      werewolves: 1,
      seer: false,
      guardian: false,
      hunter: true,
      cupid: true,
      littleRed: true,
    };
    let g = createGame(seats(6), cfg, identityShuffle);
    g = pledgeLovers(g, "p4", "p5"); // link Caperucita with a villager
    // The wolves kill her partner (p5); the bond drags Caperucita (p4) down. Her
    // wolves-only immunity does not shield her from the bond.
    const after = resolveNight(g, "p5", null);
    expect(isAlive(after, "p5")).toBe(false);
    expect(isAlive(after, "p4")).toBe(false);
  });
});

describe("little red — immunity is measured at the START of resolution", () => {
  it("survives the wolves while the SAME night's poison fells the hunter (alive at entry)", () => {
    // p1 wolf, p2 hunter, p3 witch, p4 littleRed, p5/p6 villagers.
    const cfg: RoleConfig = {
      werewolves: 1,
      seer: false,
      guardian: false,
      hunter: true,
      witch: true,
      littleRed: true,
    };
    const g = createGame(seats(6), cfg, identityShuffle);
    // In ONE resolveNight: the wolves target Caperucita AND the Bruja poisons the
    // hunter. Immunity is read from the incoming snapshot (hunter alive at entry),
    // so Caperucita survives even though the hunter dies THIS same night.
    const after = resolveNight(g, "p4", null, null, {
      heal: false,
      poisonTargetId: "p2",
    });
    expect(isAlive(after, "p4")).toBe(true); // immune — hunter was alive at entry
    expect(isAlive(after, "p2")).toBe(false); // the poison still fells the hunter
  });
});

describe("little red — the Cazador's own dying shot is not the wolves' bite", () => {
  it("a night-killed Cazador's pre-committed shot can still take Caperucita", () => {
    // p1 wolf, p2 hunter, p3 littleRed, p4/p5 villagers.
    const cfg: RoleConfig = {
      werewolves: 1,
      seer: false,
      guardian: false,
      hunter: true,
      littleRed: true,
    };
    const g = createGame(seats(5), cfg, identityShuffle);
    // The wolves kill the hunter (p2), whose pre-committed shot targets Caperucita
    // (p3). The shot is the Cazador's OWN action, not the wolves' bite, so her
    // wolves-only immunity does not shield her — this is deliberate.
    const after = resolveNight(g, "p2", null, "p3");
    expect(isAlive(after, "p2")).toBe(false); // the hunter fell to the wolves
    expect(isAlive(after, "p3")).toBe(false); // the shot took Caperucita anyway
  });
});

describe("little red — composing with La Bruja's blind heal", () => {
  it("a heal reserved on a night whose only target is an immune Caperucita is NOT consumed", () => {
    // p1 wolf, p2 hunter, p3 witch, p4 littleRed, p5/p6 villagers.
    const cfg: RoleConfig = {
      werewolves: 1,
      seer: false,
      guardian: false,
      hunter: true,
      witch: true,
      littleRed: true,
    };
    const g = createGame(seats(6), cfg, identityShuffle);
    // The wolves target the immune Caperucita and the witch reserves her heal.
    // Nobody would have died, so — like the ward-already-saved case — the potion
    // returns.
    const after = resolveNight(g, "p4", null, null, {
      heal: true,
      poisonTargetId: null,
    });
    expect(isAlive(after, "p4")).toBe(true); // immune, survives
    expect(after.witchHeal).toBe(true); // nothing to save -> the heal returns
  });
});
