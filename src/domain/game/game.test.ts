import { describe, it, expect } from "vitest";
import {
  advancePhase,
  createGame,
  livingVillagers,
  livingWitches,
  type Game,
} from "./game";
import { eliminate, type Seat } from "./player";
import type { Shuffle } from "./shuffle";

const identityShuffle: Shuffle = (items) => [...items];

function seats(count: number): Seat[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
  }));
}

function newGame(): Game {
  return createGame(seats(5), { witchCount: 2 }, identityShuffle);
}

describe("createGame", () => {
  it("starts on day 1, in progress", () => {
    const game = newGame();
    expect(game.phase).toBe("day");
    expect(game.round).toBe(1);
    expect(game.status).toBe("in_progress");
  });

  it("deals the configured number of witches", () => {
    const game = newGame();
    expect(livingWitches(game)).toHaveLength(2);
    expect(livingVillagers(game)).toHaveLength(3);
  });
});

describe("advancePhase", () => {
  it("goes day 1 -> night 1 keeping the round", () => {
    const game = advancePhase(newGame());
    expect(game.phase).toBe("night");
    expect(game.round).toBe(1);
  });

  it("goes night 1 -> day 2, incrementing the round", () => {
    const game = advancePhase(advancePhase(newGame()));
    expect(game.phase).toBe("day");
    expect(game.round).toBe(2);
  });

  it("does not mutate the previous state", () => {
    const game = newGame();
    advancePhase(game);
    expect(game.phase).toBe("day");
    expect(game.round).toBe(1);
  });
});

describe("living faction helpers", () => {
  it("exclude eliminated players", () => {
    const game = newGame();
    const updated: Game = {
      ...game,
      players: game.players.map((p) => (p.id === "p1" ? eliminate(p) : p)),
    };
    expect(livingWitches(updated)).toHaveLength(1);
  });
});
