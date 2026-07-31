import { describe, it, expect } from "vitest";
import {
  createPlayer,
  dealRoles,
  eliminate,
  MAX_PLAYERS,
  MIN_PLAYERS,
  type Seat,
} from "./player";
import type { Shuffle } from "./shuffle";

const identityShuffle: Shuffle = (items) => [...items];

function seats(count: number): Seat[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
  }));
}

describe("createPlayer", () => {
  it("starts alive", () => {
    expect(createPlayer("p1", "Whiskers", "villager").alive).toBe(true);
  });
});

describe("eliminate", () => {
  it("marks the player dead without mutating the original", () => {
    const player = createPlayer("p1", "Whiskers", "witch");
    const dead = eliminate(player);
    expect(dead.alive).toBe(false);
    expect(player.alive).toBe(true);
  });
});

describe("dealRoles", () => {
  it("assigns the first shuffled seats as witches", () => {
    const players = dealRoles(seats(5), 2, identityShuffle);
    const witches = players.filter((p) => p.role === "witch");
    expect(witches).toHaveLength(2);
    expect(witches.map((p) => p.id)).toEqual(["p1", "p2"]);
  });

  it("assigns a role to every seat", () => {
    const players = dealRoles(seats(6), 2, identityShuffle);
    expect(players).toHaveLength(6);
    expect(players.every((p) => p.role === "witch" || p.role === "villager")).toBe(true);
  });

  it("rejects fewer than the minimum players", () => {
    expect(() => dealRoles(seats(MIN_PLAYERS - 1), 1, identityShuffle)).toThrow();
  });

  it("rejects more than the maximum players", () => {
    expect(() => dealRoles(seats(MAX_PLAYERS + 1), 1, identityShuffle)).toThrow();
  });

  it("rejects a witch count that leaves no villagers", () => {
    expect(() => dealRoles(seats(4), 4, identityShuffle)).toThrow();
  });

  it("rejects zero witches", () => {
    expect(() => dealRoles(seats(4), 0, identityShuffle)).toThrow();
  });

  it("rejects duplicate player ids", () => {
    const dupes: Seat[] = [
      { id: "x", name: "A" },
      { id: "x", name: "B" },
      { id: "y", name: "C" },
      { id: "z", name: "D" },
    ];
    expect(() => dealRoles(dupes, 1, identityShuffle)).toThrow();
  });
});
