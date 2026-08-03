import { describe, it, expect } from "vitest";
import {
  advancePhase,
  applyLoverBond,
  createGame,
  hunterRevenge,
  lynch,
  pledgeLovers,
  resolveNight,
  type Game,
} from "./game";
import { alignmentOf } from "./roles";
import { createPlayer, type Player, type RoleConfig, type Seat } from "./player";
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

describe("cupid role", () => {
  it("is town-aligned (no lovers faction)", () => {
    expect(alignmentOf("cupid")).toBe("town");
  });

  it("deals a cupid when configured, before the villagers", () => {
    // p1 wolf, p2 cupid, p3-5 villagers (identity shuffle, in order).
    const cfg: RoleConfig = { werewolves: 1, seer: false, guardian: false, cupid: true };
    const g = createGame(seats(5), cfg, identityShuffle);
    expect(g.players.filter((p) => p.role === "cupid")).toHaveLength(1);
    expect(g.players.find((p) => p.id === "p2")?.role).toBe("cupid");
  });

  it("starts with no lovers", () => {
    const g = createGame(seats(4), { werewolves: 1, seer: false, guardian: false }, identityShuffle);
    expect(g.lovers).toBeNull();
  });
});

describe("pledgeLovers", () => {
  it("commits the pair", () => {
    const g = createGame(seats(4), { werewolves: 1, seer: false, guardian: false }, identityShuffle);
    const paired = pledgeLovers(g, "p2", "p3");
    expect(paired.lovers).toEqual(["p2", "p3"]);
  });

  it("refuses to pair a player with themselves — the game is unchanged", () => {
    const g = createGame(seats(4), { werewolves: 1, seer: false, guardian: false }, identityShuffle);
    const paired = pledgeLovers(g, "p2", "p2");
    expect(paired.lovers).toBeNull();
    expect(paired).toBe(g);
  });
});

describe("applyLoverBond", () => {
  const players: Player[] = [
    createPlayer("p1", "One", "villager"),
    createPlayer("p2", "Two", "villager"),
    createPlayer("p3", "Three", "villager"),
  ];

  it("no-ops when lovers is null", () => {
    expect(applyLoverBond(players, null)).toBe(players);
  });

  it("no-ops when both lovers are alive", () => {
    expect(applyLoverBond(players, ["p1", "p2"])).toBe(players);
  });

  it("no-ops when both lovers are already dead", () => {
    const dead = players.map((p) =>
      p.id === "p1" || p.id === "p2" ? { ...p, alive: false } : p,
    );
    expect(applyLoverBond(dead, ["p1", "p2"])).toBe(dead);
  });

  it("kills the surviving lover when exactly one is dead", () => {
    const oneDead = players.map((p) =>
      p.id === "p1" ? { ...p, alive: false } : p,
    );
    const after = applyLoverBond(oneDead, ["p1", "p2"]);
    expect(after.find((p) => p.id === "p2")?.alive).toBe(false);
    expect(after.find((p) => p.id === "p3")?.alive).toBe(true);
  });
});

describe("chained death — resolveNight (wolf kill)", () => {
  it("a lover killed by the pack drags the partner down", () => {
    // p1 wolf, p2 cupid, p3-6 villagers.
    const cfg: RoleConfig = { werewolves: 1, seer: false, guardian: false, cupid: true };
    let g = createGame(seats(6), cfg, identityShuffle);
    g = pledgeLovers(g, "p3", "p4"); // link two villagers
    const after = resolveNight(g, "p3", null); // wolf kills p3
    expect(isAlive(after, "p3")).toBe(false);
    expect(isAlive(after, "p4")).toBe(false); // partner chained
  });

  it("chains when the pledged pair includes the Cupido himself", () => {
    const cfg: RoleConfig = { werewolves: 1, seer: false, guardian: false, cupid: true };
    let g = createGame(seats(6), cfg, identityShuffle);
    g = pledgeLovers(g, "p2", "p4"); // cupid (p2) links himself to p4
    const after = resolveNight(g, "p4", null); // wolf kills p4
    expect(isAlive(after, "p4")).toBe(false);
    expect(isAlive(after, "p2")).toBe(false); // the Cupido follows
  });

  it("chains alongside the Cazador's pre-committed shot at dawn", () => {
    // p1 wolf, p2 hunter, p3 cupid, p4-6 villagers.
    const cfg: RoleConfig = {
      werewolves: 1,
      seer: false,
      guardian: false,
      hunter: true,
      cupid: true,
    };
    let g = createGame(seats(6), cfg, identityShuffle);
    g = pledgeLovers(g, "p5", "p6"); // link two villagers
    // Wolf kills the hunter (p2); the hunter's shot fells p5, a lover, whose
    // partner p6 must chain too.
    const after = resolveNight(g, "p2", null, "p5");
    expect(isAlive(after, "p2")).toBe(false); // hunter killed
    expect(isAlive(after, "p5")).toBe(false); // shot target
    expect(isAlive(after, "p6")).toBe(false); // partner chained by the bond
  });

  it("does not chain when there are no lovers", () => {
    const g = createGame(seats(6), { werewolves: 1, seer: false, guardian: false }, identityShuffle);
    const after = resolveNight(g, "p3", null);
    expect(isAlive(after, "p3")).toBe(false);
    expect(after.players.filter((p) => !p.alive)).toHaveLength(1);
  });

  it("the bond marks both lovers dead BEFORE win-eval, ending the game", () => {
    // 5 players: p1/p2 wolves, p3 cupid, p4/p5 villagers. Lovers = p4 & p5 (the
    // last two townsfolk besides the cupid). The pack kills p4; the bond fells
    // p5. Now only the cupid (p3) stands against 2 wolves — parity, wolves win.
    const cfg: RoleConfig = { werewolves: 2, seer: false, guardian: false, cupid: true };
    let g = createGame(seats(5), cfg, identityShuffle);
    g = pledgeLovers(g, "p4", "p5");
    const after = resolveNight(g, "p4", null);
    expect(isAlive(after, "p4")).toBe(false);
    expect(isAlive(after, "p5")).toBe(false);
    expect(after.status).toBe("ended");
    expect(after.winner).toBe("wolves");
  });
});

describe("chained death — lynch (day banishment)", () => {
  it("banishing a lover drags the partner down", () => {
    const cfg: RoleConfig = { werewolves: 1, seer: false, guardian: false, cupid: true };
    let g = createGame(seats(6), cfg, identityShuffle);
    g = pledgeLovers(g, "p3", "p4");
    g = advancePhase(g); // night1 -> day1
    const after = lynch(g, "p3");
    expect(isAlive(after, "p3")).toBe(false);
    expect(isAlive(after, "p4")).toBe(false); // partner chained
  });

  it("a banished hunter-lover still routes to pendingHunter while the partner chains", () => {
    // p1 wolf, p2 hunter, p3 cupid, p4-6 villagers. Lovers = hunter (p2) & p4.
    const cfg: RoleConfig = {
      werewolves: 1,
      seer: false,
      guardian: false,
      hunter: true,
      cupid: true,
    };
    let g = createGame(seats(6), cfg, identityShuffle);
    g = pledgeLovers(g, "p2", "p4");
    g = advancePhase(g); // night1 -> day1
    const after = lynch(g, "p2"); // banish the hunter-lover
    expect(isAlive(after, "p2")).toBe(false); // hunter banished
    expect(isAlive(after, "p4")).toBe(false); // partner chained
    expect(after.pendingHunter).toBe("p2"); // the hunter's revenge still pends
    expect(after.phase).toBe("day"); // paused, not advanced
  });
});

describe("chained death — lynch defers resolve so the Cazador's dying shot can flip the game", () => {
  it("banishing a Cazador who is also a lover: both fall, revenge still pends, and the shot wins it for the town", () => {
    // 5 players: p1 wolf, p2 hunter, p3 cupid, p4/p5 villagers. Lovers = the
    // hunter (p2) and a villager (p4). The town banishes the hunter by day.
    const cfg: RoleConfig = {
      werewolves: 1,
      seer: false,
      guardian: false,
      hunter: true,
      cupid: true,
    };
    let g = createGame(seats(5), cfg, identityShuffle);
    g = pledgeLovers(g, "p2", "p4");
    g = advancePhase(g); // night1 -> day1
    g = lynch(g, "p2"); // banish the hunter-lover

    // The bond fells the partner immediately, but the game must NOT be resolved
    // yet: the Cazador has not fired his dying shot, and that shot can still
    // decide the outcome. So the revenge pends, the phase stays "day", and the
    // game is still in progress even though both lovers are already dead.
    expect(isAlive(g, "p2")).toBe(false); // hunter banished
    expect(isAlive(g, "p4")).toBe(false); // partner chained by the bond
    expect(g.pendingHunter).toBe("p2");
    expect(g.phase).toBe("day");
    expect(g.status).toBe("in_progress");

    // The dying shot takes the last wolf (p1): NOW the town wins. This proves the
    // deferred resolve is intentional — resolving inside `lynch` would have been
    // wrong, since the shot flips the result.
    const after = hunterRevenge(g, "p1");
    expect(isAlive(after, "p1")).toBe(false);
    expect(after.status).toBe("ended");
    expect(after.winner).toBe("town");
  });
});

describe("chained death — hunterRevenge (Cazador shot)", () => {
  it("the Cazador's revenge shot on a lover drags the partner down", () => {
    // p1 wolf, p2 hunter, p3 cupid, p4-6 villagers. Lovers = p5 & p6.
    const cfg: RoleConfig = {
      werewolves: 1,
      seer: false,
      guardian: false,
      hunter: true,
      cupid: true,
    };
    let g = createGame(seats(6), cfg, identityShuffle);
    g = pledgeLovers(g, "p5", "p6");
    g = advancePhase(g); // night1 -> day1
    g = lynch(g, "p2"); // banish the hunter -> pendingHunter
    expect(g.pendingHunter).toBe("p2");
    const after = hunterRevenge(g, "p5"); // shoot a lover
    expect(isAlive(after, "p5")).toBe(false); // shot target
    expect(isAlive(after, "p6")).toBe(false); // partner chained
    expect(after.pendingHunter).toBeNull(); // no second revenge from the bond
  });
});
