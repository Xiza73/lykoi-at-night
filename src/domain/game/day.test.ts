import { describe, it, expect } from "vitest";
import { advancePhase, createGame, lynch, resolveNight, type Game } from "./game";
import type { RoleConfig, Seat } from "./player";
import type { Shuffle } from "./shuffle";

const identityShuffle: Shuffle = (items) => [...items];
function seats(count: number): Seat[] {
  return Array.from({ length: count }, (_, i) => ({ id: `p${i + 1}`, name: `Player ${i + 1}` }));
}
function isAlive(g: Game, id: string): boolean {
  const p = g.players.find((pp) => pp.id === id);
  return p ? p.alive : false;
}
// 4 players: p1 wolf, p2/p3/p4 villagers
const SIMPLE: RoleConfig = { werewolves: 1, seer: false, guardian: false };
function game4(): Game {
  return createGame(seats(4), SIMPLE, identityShuffle);
}

describe("lynch", () => {
  it("eliminates the target and falls to the next night", () => {
    const g = lynch(advancePhase(game4()), "p2");
    expect(isAlive(g, "p2")).toBe(false);
    expect(g.phase).toBe("night");
    expect(g.round).toBe(2);
  });
  it("the town wins when the last wolf is lynched", () => {
    const g = lynch(advancePhase(game4()), "p1");
    expect(g.status).toBe("ended");
    expect(g.winner).toBe("town");
  });
  it("is a no-op during the night", () => {
    const g = lynch(game4(), "p2");
    expect(isAlive(g, "p2")).toBe(true);
  });
});

describe("werewolves win at parity", () => {
  it("wolves win when the night kill reaches parity", () => {
    let g = resolveNight(game4(), "p2", null); // town 2, wolf 1 -> day1
    expect(g.status).toBe("in_progress");
    g = advancePhase(g); // day1 -> night2
    g = resolveNight(g, "p3", null); // town 1 == wolf 1 -> wolves win
    expect(g.status).toBe("ended");
    expect(g.winner).toBe("wolves");
  });
});
