import { describe, it, expect } from "vitest";
import {
  advancePhase,
  createGame,
  investigate,
  lynch,
  resolveNight,
  type Game,
} from "./game";
import type { RoleConfig, Seat } from "./player";
import type { Shuffle } from "./shuffle";

const identityShuffle: Shuffle = (items) => [...items];
function seats(count: number): Seat[] {
  return Array.from({ length: count }, (_, i) => ({ id: `p${i + 1}`, name: `Player ${i + 1}` }));
}
// p1 wolf, p2 seer, p3 guardian, p4-6 villagers
const CORE: RoleConfig = { werewolves: 1, seer: true, guardian: true };
function nightGame(): Game {
  return createGame(seats(6), CORE, identityShuffle);
}
function isAlive(g: Game, id: string): boolean {
  const p = g.players.find((pp) => pp.id === id);
  return p ? p.alive : false;
}

describe("investigate (seer)", () => {
  it("reads a werewolf as wolves and a villager as town", () => {
    const g = nightGame();
    expect(investigate(g, "p1")).toBe("wolves");
    expect(investigate(g, "p4")).toBe("town");
  });
});

describe("resolveNight", () => {
  it("kills the wolves' victim and breaks to day", () => {
    const g = resolveNight(nightGame(), "p4", null);
    expect(isAlive(g, "p4")).toBe(false);
    expect(g.phase).toBe("day");
    expect(g.round).toBe(1);
  });
  it("spares the victim when a living guardian wards them", () => {
    const g = resolveNight(nightGame(), "p4", "p4");
    expect(isAlive(g, "p4")).toBe(true);
  });
  it("does not save when the ward misses the victim", () => {
    const g = resolveNight(nightGame(), "p4", "p5");
    expect(isAlive(g, "p4")).toBe(false);
  });
  it("cannot ward once the guardian is dead", () => {
    let g = advancePhase(nightGame()); // night1 -> day1
    g = lynch(g, "p3"); // guardian lynched -> night2
    const after = resolveNight(g, "p4", "p4");
    expect(isAlive(after, "p4")).toBe(false);
  });
  it("is a no-op during the day", () => {
    const day = advancePhase(nightGame());
    const g = resolveNight(day, "p4", null);
    expect(isAlive(g, "p4")).toBe(true);
    expect(g.phase).toBe("day");
  });
});
