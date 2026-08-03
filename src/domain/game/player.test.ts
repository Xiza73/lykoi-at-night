import { describe, it, expect } from "vitest";
import {
  createPlayer,
  dealRoles,
  eliminate,
  MAX_PLAYERS,
  MIN_PLAYERS,
  type RoleConfig,
  type Seat,
} from "./player";
import type { Role } from "./roles";
import type { Shuffle } from "./shuffle";

const identityShuffle: Shuffle = (items) => [...items];
function seats(count: number): Seat[] {
  return Array.from({ length: count }, (_, i) => ({ id: `p${i + 1}`, name: `Player ${i + 1}` }));
}
const CORE: RoleConfig = { werewolves: 1, seer: true, guardian: true };
function roleOf(players: { id: string; role: Role }[], id: string): Role | undefined {
  return players.find((p) => p.id === id)?.role;
}

describe("createPlayer / eliminate", () => {
  it("starts alive and eliminates immutably", () => {
    const p = createPlayer("p1", "Ana", "villager");
    expect(p.alive).toBe(true);
    const dead = eliminate(p);
    expect(dead.alive).toBe(false);
    expect(p.alive).toBe(true);
  });
});

describe("dealRoles", () => {
  it("deals the configured roles, filling the rest with villagers", () => {
    // identityShuffle => [werewolf, seer, guardian, villager, villager, villager]
    const players = dealRoles(seats(6), CORE, identityShuffle);
    expect(roleOf(players, "p1")).toBe("werewolf");
    expect(roleOf(players, "p2")).toBe("seer");
    expect(roleOf(players, "p3")).toBe("guardian");
    expect(players.filter((p) => p.role === "villager")).toHaveLength(3);
  });
  it("works with specials off", () => {
    const players = dealRoles(seats(4), { werewolves: 1, seer: false, guardian: false }, identityShuffle);
    expect(players.filter((p) => p.role === "werewolf")).toHaveLength(1);
    expect(players.filter((p) => p.role === "villager")).toHaveLength(3);
  });
  it("rejects fewer than the minimum players", () => {
    expect(() => dealRoles(seats(MIN_PLAYERS - 1), CORE, identityShuffle)).toThrow();
  });
  it("rejects more than the maximum players", () => {
    expect(() => dealRoles(seats(MAX_PLAYERS + 1), CORE, identityShuffle)).toThrow();
  });
  it("rejects zero werewolves", () => {
    expect(() => dealRoles(seats(6), { werewolves: 0, seer: false, guardian: false }, identityShuffle)).toThrow();
  });
  it("rejects werewolves that are not a strict minority", () => {
    expect(() => dealRoles(seats(4), { werewolves: 2, seer: false, guardian: false }, identityShuffle)).toThrow();
  });
  it("rejects duplicate player ids", () => {
    const dupes: Seat[] = [
      { id: "x", name: "A" }, { id: "x", name: "B" }, { id: "y", name: "C" }, { id: "z", name: "D" },
    ];
    expect(() => dealRoles(dupes, { werewolves: 1, seer: false, guardian: false }, identityShuffle)).toThrow();
  });
});
