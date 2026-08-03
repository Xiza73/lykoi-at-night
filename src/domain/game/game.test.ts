import { describe, it, expect } from "vitest";
import {
  advancePhase,
  createGame,
  evaluateOutcome,
  livingTown,
  livingWolves,
  type Game,
} from "./game";
import type { RoleConfig, Seat } from "./player";
import type { Shuffle } from "./shuffle";

const identityShuffle: Shuffle = (items) => [...items];
function seats(count: number): Seat[] {
  return Array.from({ length: count }, (_, i) => ({ id: `p${i + 1}`, name: `Player ${i + 1}` }));
}
const CORE: RoleConfig = { werewolves: 1, seer: true, guardian: true };
function newGame(): Game {
  return createGame(seats(6), CORE, identityShuffle);
}

describe("createGame", () => {
  it("opens on night 1, in progress, undecided", () => {
    const g = newGame();
    expect(g.phase).toBe("night");
    expect(g.round).toBe(1);
    expect(g.status).toBe("in_progress");
    expect(g.winner).toBeNull();
  });
  it("deals one wolf and five townsfolk", () => {
    const g = newGame();
    expect(livingWolves(g)).toHaveLength(1);
    expect(livingTown(g)).toHaveLength(5);
  });
});

describe("advancePhase", () => {
  it("night 1 -> day 1 keeps the round", () => {
    const g = advancePhase(newGame());
    expect(g.phase).toBe("day");
    expect(g.round).toBe(1);
  });
  it("day -> night bumps the round", () => {
    const g = advancePhase(advancePhase(newGame()));
    expect(g.phase).toBe("night");
    expect(g.round).toBe(2);
  });
});

describe("evaluateOutcome", () => {
  it("is undecided at the start", () => {
    expect(evaluateOutcome(newGame())).toBeNull();
  });
});
