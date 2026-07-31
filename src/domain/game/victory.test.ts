import { describe, it, expect } from "vitest";
import {
  advancePhase,
  createGame,
  eliminatePlayer,
  evaluateOutcome,
  type Game,
} from "./game";
import type { Seat } from "./player";
import type { Shuffle } from "./shuffle";

const identityShuffle: Shuffle = (items) => [...items];

function seats(count: number): Seat[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
  }));
}

// identityShuffle + witchCount 2 => p1 & p2 are witches, p3..p5 villagers.
function newGame(): Game {
  return createGame(seats(5), { witchCount: 2 }, identityShuffle);
}

describe("evaluateOutcome", () => {
  it("is undecided at the start", () => {
    expect(evaluateOutcome(newGame())).toBeNull();
  });

  it("gives the town the win when no witches are alive", () => {
    let game = newGame();
    game = eliminatePlayer(game, "p1");
    game = eliminatePlayer(game, "p2");
    expect(evaluateOutcome(game)).toBe("town");
  });

  it("gives the witches the win when only witches remain alive", () => {
    let game = newGame();
    game = eliminatePlayer(game, "p3");
    game = eliminatePlayer(game, "p4");
    game = eliminatePlayer(game, "p5");
    expect(evaluateOutcome(game)).toBe("witches");
  });
});

describe("eliminatePlayer", () => {
  it("ends the game and records the winner when a faction is wiped out", () => {
    let game = newGame();
    game = eliminatePlayer(game, "p1");
    expect(game.status).toBe("in_progress");
    expect(game.winner).toBeNull();
    game = eliminatePlayer(game, "p2");
    expect(game.status).toBe("ended");
    expect(game.winner).toBe("town");
  });

  it("does not mutate the previous game state", () => {
    const game = newGame();
    eliminatePlayer(game, "p1");
    expect(game.players.every((p) => p.alive)).toBe(true);
  });

  it("is a no-op for an unknown player id", () => {
    const game = newGame();
    const result = eliminatePlayer(game, "does-not-exist");
    expect(result.players.filter((p) => p.alive)).toHaveLength(5);
    expect(result.status).toBe("in_progress");
  });
});

describe("advancePhase after the game ends", () => {
  it("leaves an ended game unchanged", () => {
    let game = newGame();
    game = eliminatePlayer(game, "p1");
    game = eliminatePlayer(game, "p2"); // town wins -> ended
    expect(advancePhase(game)).toBe(game); // same reference, no-op
  });
});
