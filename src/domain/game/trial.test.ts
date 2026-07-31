import { describe, it, expect } from "vitest";
import { accuse, createGame, revealTryal, ACCUSATIONS_FOR_TRIAL, type Game } from "./game";
import type { Seat } from "./player";
import type { Shuffle } from "./shuffle";

const identityShuffle: Shuffle = (items) => [...items];

function seats(count: number): Seat[] {
  return Array.from({ length: count }, (_, i) => ({ id: `p${i + 1}`, name: `Player ${i + 1}` }));
}
function newGame(): Game {
  return createGame(seats(5), { witchCount: 2 }, identityShuffle);
}
function accuseToTrial(game: Game, id: string): Game {
  let g = game;
  for (let i = 0; i < ACCUSATIONS_FOR_TRIAL; i += 1) g = accuse(g, id);
  return g;
}
function isAlive(g: Game, id: string): boolean {
  const p = g.players.find((pp) => pp.id === id);
  return p ? p.alive : false;
}

describe("accuse", () => {
  it("accumulates accusations below the threshold", () => {
    const g = accuse(newGame(), "p1");
    expect(g.accusations["p1"]).toBe(1);
    expect(g.onTrial).toBeNull();
  });

  it("sends a player to trial on the threshold accusation", () => {
    const g = accuseToTrial(newGame(), "p1");
    expect(g.onTrial).toBe("p1");
    expect(g.accusations["p1"]).toBe(0);
  });

  it("ignores accusations while a trial is pending", () => {
    let g = accuseToTrial(newGame(), "p1");
    g = accuse(g, "p2");
    expect(g.onTrial).toBe("p1");
    expect(g.accusations["p2"]).toBe(0);
  });
});

describe("revealTryal", () => {
  it("kills the accused when a witch card is revealed", () => {
    // identityShuffle => p1 is a witch, witch card at index 0
    const g = revealTryal(accuseToTrial(newGame(), "p1"), 0);
    expect(isAlive(g, "p1")).toBe(false);
    expect(g.onTrial).toBeNull();
  });

  it("spares the accused when a non-witch card is revealed", () => {
    // p3 is a townsperson (constable card at index 0, not a witch card)
    const g = revealTryal(accuseToTrial(newGame(), "p3"), 0);
    expect(isAlive(g, "p3")).toBe(true);
    expect(g.onTrial).toBeNull();
  });

  it("ends the game for the town once the last witch is revealed", () => {
    let g = newGame();
    g = revealTryal(accuseToTrial(g, "p1"), 0);
    g = revealTryal(accuseToTrial(g, "p2"), 0);
    expect(g.status).toBe("ended");
    expect(g.winner).toBe("town");
  });

  it("kills a townsperson only once all their cards are revealed", () => {
    let g = newGame();
    g = revealTryal(accuseToTrial(g, "p4"), 0); // non-witch, survives
    expect(isAlive(g, "p4")).toBe(true);
    g = revealTryal(accuseToTrial(g, "p4"), 1); // survives
    expect(isAlive(g, "p4")).toBe(true);
    g = revealTryal(accuseToTrial(g, "p4"), 2); // all revealed -> dies
    expect(isAlive(g, "p4")).toBe(false);
  });
});
