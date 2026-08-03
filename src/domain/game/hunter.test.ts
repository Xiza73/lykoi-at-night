import { describe, it, expect } from "vitest";
import {
  advancePhase,
  createGame,
  hunterRevenge,
  lynch,
  resolveNight,
  type Game,
} from "./game";
import { alignmentOf } from "./roles";
import type { RoleConfig, Seat } from "./player";
import type { Shuffle } from "./shuffle";

const identityShuffle: Shuffle = (items) => [...items];
function seats(count: number): Seat[] {
  return Array.from({ length: count }, (_, i) => ({ id: `p${i + 1}`, name: `Player ${i + 1}` }));
}
// p1 werewolf, p2 hunter, p3-5 villagers
const CFG: RoleConfig = { werewolves: 1, seer: false, guardian: false, hunter: true };
function nightGame(): Game {
  return createGame(seats(5), CFG, identityShuffle);
}
function isAlive(g: Game, id: string): boolean {
  const p = g.players.find((pp) => pp.id === id);
  return p ? p.alive : false;
}

describe("hunter role", () => {
  it("is town-aligned", () => {
    expect(alignmentOf("hunter")).toBe("town");
  });

  it("deals a hunter when configured", () => {
    const g = nightGame();
    expect(g.players.filter((p) => p.role === "hunter")).toHaveLength(1);
  });

  it("night-killing the hunter pauses for revenge (no advance, no winner yet)", () => {
    const g = resolveNight(nightGame(), "p2", null);
    expect(isAlive(g, "p2")).toBe(false);
    expect(g.pendingHunter).toBe("p2");
    expect(g.phase).toBe("night");
    expect(g.status).toBe("in_progress");
  });

  it("the hunter's revenge kills the target and then dawn breaks", () => {
    let g = resolveNight(nightGame(), "p2", null);
    g = hunterRevenge(g, "p3");
    expect(isAlive(g, "p3")).toBe(false);
    expect(g.pendingHunter).toBeNull();
    expect(g.phase).toBe("day");
  });

  it("a dying hunter can take the last wolf and hand the town the win", () => {
    // 4 players (domain MIN_PLAYERS): p1 wolf, p2 hunter, p3-4 villagers
    let g = createGame(seats(4), { werewolves: 1, seer: false, guardian: false, hunter: true }, identityShuffle);
    g = resolveNight(g, "p2", null); // wolf kills hunter -> paused (NOT wolves-win yet)
    expect(g.status).toBe("in_progress");
    g = hunterRevenge(g, "p1"); // hunter takes the wolf
    expect(g.status).toBe("ended");
    expect(g.winner).toBe("town");
  });

  it("lynching the hunter pauses, and the revenge falls to the next night", () => {
    let g = advancePhase(nightGame()); // night1 -> day1
    g = lynch(g, "p2"); // hunter lynched -> paused, still day
    expect(g.pendingHunter).toBe("p2");
    expect(g.phase).toBe("day");
    g = hunterRevenge(g, "p3");
    expect(isAlive(g, "p3")).toBe(false);
    expect(g.phase).toBe("night");
    expect(g.round).toBe(2);
  });

  it("killing a non-hunter does not pause", () => {
    const g = resolveNight(nightGame(), "p3", null); // villager
    expect(g.pendingHunter).toBeNull();
    expect(g.phase).toBe("day");
  });
});
