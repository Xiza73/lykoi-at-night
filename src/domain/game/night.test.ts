import { describe, it, expect } from "vitest";
import {
  ACCUSATIONS_FOR_TRIAL,
  accuse,
  advancePhase,
  constableId,
  createGame,
  eliminatePlayer,
  resolveNight,
  revealTryal,
  type Game,
} from "./game";
import type { Seat } from "./player";
import type { Shuffle } from "./shuffle";

const identityShuffle: Shuffle = (items) => [...items];

function seats(count: number): Seat[] {
  return Array.from({ length: count }, (_, i) => ({ id: `p${i + 1}`, name: `Player ${i + 1}` }));
}
// identityShuffle + witchCount 2 => p1,p2 witches; p3,p4,p5 town; constable = p3 (card index 0)
function nightGame(): Game {
  return advancePhase(createGame(seats(5), { witchCount: 2 }, identityShuffle));
}
function isAlive(g: Game, id: string): boolean {
  const p = g.players.find((pp) => pp.id === id);
  return p ? p.alive : false;
}
function accuseToTrial(game: Game, id: string): Game {
  let g = game;
  for (let i = 0; i < ACCUSATIONS_FOR_TRIAL; i += 1) g = accuse(g, id);
  return g;
}

describe("constableId", () => {
  it("finds the living townsperson holding a hidden constable card", () => {
    expect(constableId(nightGame())).toBe("p3");
  });
});

describe("resolveNight", () => {
  it("kills the witches' victim and breaks to the next day", () => {
    const g = resolveNight(nightGame(), "p4", null);
    expect(isAlive(g, "p4")).toBe(false);
    expect(g.phase).toBe("day");
    expect(g.round).toBe(2);
  });

  it("spares the victim when the constable wards them", () => {
    const g = resolveNight(nightGame(), "p4", "p4");
    expect(isAlive(g, "p4")).toBe(true);
    expect(g.phase).toBe("day");
  });

  it("does not let the constable ward themselves", () => {
    const g = resolveNight(nightGame(), "p3", "p3");
    expect(isAlive(g, "p3")).toBe(false);
  });

  it("is a no-op during the day", () => {
    const day = createGame(seats(5), { witchCount: 2 }, identityShuffle);
    const g = resolveNight(day, "p4", null);
    expect(isAlive(g, "p4")).toBe(true);
    expect(g.phase).toBe("day");
  });

  it("ends the game for the witches when the last townsperson falls", () => {
    let g = createGame(seats(5), { witchCount: 2 }, identityShuffle);
    g = eliminatePlayer(g, "p3");
    g = eliminatePlayer(g, "p5");
    g = advancePhase(g); // -> night
    g = resolveNight(g, "p4", null);
    expect(g.status).toBe("ended");
    expect(g.winner).toBe("witches");
  });

  it("cannot ward once the constable card has been revealed", () => {
    let g = createGame(seats(5), { witchCount: 2 }, identityShuffle);
    g = revealTryal(accuseToTrial(g, "p3"), 0); // reveals p3's constable card; p3 survives
    expect(constableId(g)).toBeNull();
    g = advancePhase(g); // -> night
    const after = resolveNight(g, "p4", "p4");
    expect(isAlive(after, "p4")).toBe(false);
  });
});
