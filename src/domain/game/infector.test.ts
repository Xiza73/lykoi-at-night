import { describe, it, expect } from "vitest";
import {
  advancePhase,
  createGame,
  livingWolves,
  lynch,
  resolveNight,
  type Game,
} from "./game";
import { alignmentOf, isWolf } from "./roles";
import type { Seat } from "./player";
import type { Shuffle } from "./shuffle";

const identityShuffle: Shuffle = (items) => [...items];
function seats(count: number): Seat[] {
  return Array.from({ length: count }, (_, i) => ({ id: `p${i + 1}`, name: `Player ${i + 1}` }));
}
function roleOf(g: Game, id: string): string | undefined {
  return g.players.find((p) => p.id === id)?.role;
}

describe("infector role (Madre Camada)", () => {
  it("is wolf-aligned", () => {
    expect(alignmentOf("infector")).toBe("wolves");
    expect(isWolf("infector")).toBe(true);
  });

  it("deals an infector and counts it among the living wolves", () => {
    // p1 werewolf, p2 infector, p3-8 villagers
    const g = createGame(seats(8), { werewolves: 1, seer: false, guardian: false, infector: true }, identityShuffle);
    expect(g.players.filter((p) => p.role === "infector")).toHaveLength(1);
    expect(livingWolves(g)).toHaveLength(2);
  });

  it("counts the infector as a wolf for the strict-minority invariant", () => {
    // 4 seats: 1 werewolf + 1 infector = 2 wolves vs 2 town -> invalid
    expect(() =>
      createGame(seats(4), { werewolves: 1, seer: false, guardian: false, infector: true }, identityShuffle),
    ).toThrow(RangeError);
  });

  it("converts a townsperson into a werewolf at night", () => {
    const g = createGame(seats(8), { werewolves: 1, seer: false, guardian: false, infector: true }, identityShuffle);
    const after = resolveNight(g, null, null, "p3");
    expect(roleOf(after, "p3")).toBe("werewolf");
    expect(after.infectionUsed).toBe(true);
    expect(livingWolves(after)).toHaveLength(3);
    expect(after.status).toBe("in_progress");
    expect(after.phase).toBe("day");
  });

  it("infection can hand the wolves a parity win", () => {
    // 5 seats: p1 wolf, p2 infector, p3-5 villagers. Convert p3 -> 3 wolves vs 2 town.
    const g = createGame(seats(5), { werewolves: 1, seer: false, guardian: false, infector: true }, identityShuffle);
    const after = resolveNight(g, null, null, "p3");
    expect(after.status).toBe("ended");
    expect(after.winner).toBe("wolves");
  });

  it("only fires once per game", () => {
    let g = createGame(seats(8), { werewolves: 1, seer: false, guardian: false, infector: true }, identityShuffle);
    g = resolveNight(g, null, null, "p3"); // night1 -> day1, p3 turned
    g = advancePhase(g); // day1 -> night2
    g = resolveNight(g, null, null, "p4"); // should NOT convert p4
    expect(roleOf(g, "p4")).toBe("villager");
    expect(g.infectionUsed).toBe(true);
  });

  it("cannot infect a fellow wolf (no-op)", () => {
    const g = createGame(seats(8), { werewolves: 1, seer: false, guardian: false, infector: true }, identityShuffle);
    const after = resolveNight(g, null, null, "p1"); // p1 is the werewolf
    expect(after.infectionUsed).toBe(false);
    expect(livingWolves(after)).toHaveLength(2);
  });

  it("is ignored when no infector is alive", () => {
    let g = createGame(seats(8), { werewolves: 1, seer: false, guardian: false, infector: true }, identityShuffle);
    g = advancePhase(g); // night1 -> day1
    g = lynch(g, "p2"); // lynch the infector -> day1 -> night2
    g = resolveNight(g, null, null, "p3"); // no living infector
    expect(roleOf(g, "p3")).toBe("villager");
    expect(g.infectionUsed).toBe(false);
  });
});
