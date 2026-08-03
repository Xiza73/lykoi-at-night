import { describe, it, expect } from "vitest";
import { advancePhase, createGame, pledgeLovers, resolveNight, type Game } from "./game";
import type { RoleConfig, Seat } from "./player";
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

// p1 wolf, p2 witch, p3-6 villagers (identity shuffle, push order).
const WITCH: RoleConfig = { werewolves: 1, seer: false, guardian: false, witch: true };
function witchGame(): Game {
  return createGame(seats(6), WITCH, identityShuffle);
}

describe("witch — potion state", () => {
  it("starts a game with both potions available", () => {
    const g = witchGame();
    expect(g.witchHeal).toBe(true);
    expect(g.witchPoison).toBe(true);
  });
});

describe("witch — life potion (blind heal)", () => {
  it("saves the wolves' victim and is consumed", () => {
    const g = resolveNight(witchGame(), "p3", null, null, {
      heal: true,
      poisonTargetId: null,
    });
    expect(isAlive(g, "p3")).toBe(true); // the victim was healed
    expect(g.witchHeal).toBe(false); // the potion was spent
  });

  it("returns unused when there is no victim to save (wolves killed nobody)", () => {
    const g = resolveNight(witchGame(), null, null, null, {
      heal: true,
      poisonTargetId: null,
    });
    expect(g.witchHeal).toBe(true); // nothing to save -> not consumed
    expect(g.players.filter((p) => !p.alive)).toHaveLength(0);
  });

  it("returns unused when the Curandero already warded the victim", () => {
    // p1 wolf, p2 guardian, p3 witch, p4-6 villagers.
    const cfg: RoleConfig = {
      werewolves: 1,
      seer: false,
      guardian: true,
      witch: true,
    };
    const g0 = createGame(seats(6), cfg, identityShuffle);
    // Wolves target p4, the guardian wards p4, and the witch also reserves the heal.
    const g = resolveNight(g0, "p4", "p4", null, {
      heal: true,
      poisonTargetId: null,
    });
    expect(isAlive(g, "p4")).toBe(true); // saved by the ward
    expect(g.witchHeal).toBe(true); // the heal had nothing to do -> returns
  });

  it("a healed victim who is the Cazador does NOT fire his pre-committed shot", () => {
    // p1 wolf, p2 hunter, p3 witch, p4-6 villagers.
    const cfg: RoleConfig = {
      werewolves: 1,
      seer: false,
      guardian: false,
      hunter: true,
      witch: true,
    };
    const g0 = createGame(seats(6), cfg, identityShuffle);
    // Wolves kill the hunter (p2), who pre-committed p4; the witch heals him.
    const g = resolveNight(g0, "p2", null, "p4", {
      heal: true,
      poisonTargetId: null,
    });
    expect(isAlive(g, "p2")).toBe(true); // the hunter was healed
    expect(isAlive(g, "p4")).toBe(true); // so his shot never fired
    expect(g.witchHeal).toBe(false); // the heal was spent (it saved him)
  });
});

describe("witch — poison potion", () => {
  it("kills its target and is consumed, independent of the wolves' victim", () => {
    const g = resolveNight(witchGame(), null, null, null, {
      heal: false,
      poisonTargetId: "p3",
    });
    expect(isAlive(g, "p3")).toBe(false); // poisoned to death
    expect(g.witchPoison).toBe(false); // the potion was spent
  });

  it("BYPASSES the Curandero ward — a warded poisoned cat still dies", () => {
    // p1 wolf, p2 guardian, p3 witch, p4-6 villagers.
    const cfg: RoleConfig = {
      werewolves: 1,
      seer: false,
      guardian: true,
      witch: true,
    };
    const g0 = createGame(seats(6), cfg, identityShuffle);
    // Wolves target p4 AND the guardian wards p4 (which stops the wolf attack),
    // but the witch poisons p4: the poison ignores the ward entirely, so p4 dies.
    const g = resolveNight(g0, "p4", "p4", null, {
      heal: false,
      poisonTargetId: "p4",
    });
    expect(isAlive(g, "p4")).toBe(false); // the ward could not stop the poison
    expect(g.witchPoison).toBe(false);
  });

  it("chains a poisoned lover's partner through the bond", () => {
    // p1 wolf, p2 cupid, p3 witch, p4-6 villagers.
    const cfg: RoleConfig = {
      werewolves: 1,
      seer: false,
      guardian: false,
      cupid: true,
      witch: true,
    };
    let g = createGame(seats(6), cfg, identityShuffle);
    g = pledgeLovers(g, "p4", "p5"); // link two villagers
    const after = resolveNight(g, null, null, null, {
      heal: false,
      poisonTargetId: "p4",
    });
    expect(isAlive(after, "p4")).toBe(false); // poisoned
    expect(isAlive(after, "p5")).toBe(false); // partner chained
  });
});

describe("witch — both potions the same night", () => {
  it("heals the wolves' victim and poisons another cat, spending both", () => {
    const g = resolveNight(witchGame(), "p3", null, null, {
      heal: true,
      poisonTargetId: "p4",
    });
    expect(isAlive(g, "p3")).toBe(true); // healed
    expect(isAlive(g, "p4")).toBe(false); // poisoned
    expect(g.witchHeal).toBe(false);
    expect(g.witchPoison).toBe(false);
  });
});

describe("witch — a spent potion has no further effect", () => {
  it("cannot heal again once the life potion is gone", () => {
    let g = resolveNight(witchGame(), "p3", null, null, {
      heal: true,
      poisonTargetId: null,
    });
    expect(g.witchHeal).toBe(false);
    g = advancePhase(g); // day1 -> night2
    // She reserves the heal again, but the potion is gone: the victim dies.
    g = resolveNight(g, "p4", null, null, { heal: true, poisonTargetId: null });
    expect(isAlive(g, "p4")).toBe(false);
  });

  it("cannot poison again once the poison potion is gone", () => {
    let g = resolveNight(witchGame(), null, null, null, {
      heal: false,
      poisonTargetId: "p3",
    });
    expect(g.witchPoison).toBe(false);
    g = advancePhase(g); // day1 -> night2
    // She picks another poison target, but the potion is gone: p4 lives.
    g = resolveNight(g, null, null, null, { heal: false, poisonTargetId: "p4" });
    expect(isAlive(g, "p4")).toBe(true);
  });
});

describe("witch — no living witch", () => {
  it("ignores the witch params when the config has no witch", () => {
    const g0 = createGame(
      seats(6),
      { werewolves: 1, seer: false, guardian: false },
      identityShuffle,
    );
    const g = resolveNight(g0, "p3", null, null, {
      heal: true,
      poisonTargetId: "p4",
    });
    expect(isAlive(g, "p3")).toBe(false); // heal ignored -> victim still dies
    expect(isAlive(g, "p4")).toBe(true); // poison ignored -> nobody else falls
  });
});

describe("witch — edge interactions (design pins)", () => {
  it("poisoning the Cazador directly does NOT fire his pre-committed shot", () => {
    // p1 wolf, p2 hunter, p3 witch, p4-6 villagers. The Cazador's shot is a reflex
    // to the WOLVES' attack alone, so poisoning him — while the pack kills someone
    // else — kills him WITHOUT firing his pre-commit.
    const cfg: RoleConfig = {
      werewolves: 1,
      seer: false,
      guardian: false,
      hunter: true,
      witch: true,
    };
    const g0 = createGame(seats(6), cfg, identityShuffle);
    // Wolves kill p4 (a villager); the witch poisons the hunter (p2), who had
    // pre-committed p5. His shot must NOT fire.
    const g = resolveNight(g0, "p4", null, "p5", {
      heal: false,
      poisonTargetId: "p2",
    });
    expect(isAlive(g, "p2")).toBe(false); // the hunter died to the poison
    expect(isAlive(g, "p5")).toBe(true); // but his pre-committed shot never fired
    expect(isAlive(g, "p4")).toBe(false); // the wolves' own victim still fell
  });

  it("poisoning the SAME cat the heal saved overrides the heal — the cat still dies", () => {
    // p1 wolf, p2 witch, p3-6 villagers. Wolves target p3; the witch both reserves
    // the heal (which saves p3 from the pack) AND poisons p3. The poison wins.
    const g = resolveNight(witchGame(), "p3", null, null, {
      heal: true,
      poisonTargetId: "p3",
    });
    expect(isAlive(g, "p3")).toBe(false); // poison overrides the heal
    // The heal is still SPENT: it did save p3 from the wolves' attack before the
    // poison took over. The poison is likewise spent.
    expect(g.witchHeal).toBe(false);
    expect(g.witchPoison).toBe(false);
  });

  it("does nothing from beyond the grave: a dead witch's potions and params are inert", () => {
    // p1 wolf, p2 witch, p3-6 villagers.
    let g = witchGame();
    // Night 1: the wolves kill the witch (p2). No witch action this night, so both
    // potion flags carry over untouched.
    g = resolveNight(g, "p2", null);
    expect(isAlive(g, "p2")).toBe(false);
    expect(g.witchHeal).toBe(true);
    expect(g.witchPoison).toBe(true);
    g = advancePhase(g); // day1 -> night2
    // Night 2: witch params are passed, but with no LIVING witch they are inert —
    // the wolves' victim dies normally and the poison target lives.
    g = resolveNight(g, "p3", null, null, { heal: true, poisonTargetId: "p4" });
    expect(isAlive(g, "p3")).toBe(false); // heal did nothing
    expect(isAlive(g, "p4")).toBe(true); // poison did nothing
    expect(g.witchHeal).toBe(true); // flags unchanged
    expect(g.witchPoison).toBe(true);
  });

  it("a poison kill that reaches parity ends the game through the shared resolve", () => {
    // 4 players: p1 wolf, p2 witch, p3/p4 villagers. The wolves kill p3, leaving
    // one wolf against two townsfolk (still in progress). The witch's poison then
    // fells p4, bringing the pack to parity (1 wolf vs 1 town) — so resolveNight's
    // single shared resolve ends the game for the wolves.
    const g0 = createGame(
      seats(4),
      { werewolves: 1, seer: false, guardian: false, witch: true },
      identityShuffle,
    );
    const g = resolveNight(g0, "p3", null, null, {
      heal: false,
      poisonTargetId: "p4",
    });
    expect(isAlive(g, "p3")).toBe(false); // wolves' victim
    expect(isAlive(g, "p4")).toBe(false); // poisoned
    expect(g.status).toBe("ended");
    expect(g.winner).toBe("wolves");
  });

  it("self-poison works at the domain layer (the UI forbids it; the engine does not)", () => {
    // p1 wolf, p2 witch, p3-6 villagers. Nothing stops the witch naming her own id.
    const g = resolveNight(witchGame(), null, null, null, {
      heal: false,
      poisonTargetId: "p2",
    });
    expect(isAlive(g, "p2")).toBe(false); // she poisoned herself
    expect(g.witchPoison).toBe(false); // the potion is spent
  });
});
