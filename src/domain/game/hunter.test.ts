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

  it("night-killing the hunter with a pre-committed target takes both, no pause, dawn breaks", () => {
    // The hunter pre-commits p3 during the night; the wolves kill the hunter (p2).
    // Both fall at dawn automatically — no interactive revenge.
    const g = resolveNight(nightGame(), "p2", null, "p3");
    expect(isAlive(g, "p2")).toBe(false);
    expect(isAlive(g, "p3")).toBe(false);
    expect(g.pendingHunter).toBeNull();
    expect(g.phase).toBe("day");
    expect(g.status).toBe("in_progress");
  });

  it("night-killing the hunter with no pre-commit takes only the hunter", () => {
    const g = resolveNight(nightGame(), "p2", null, null);
    expect(isAlive(g, "p2")).toBe(false);
    expect(isAlive(g, "p3")).toBe(true);
    expect(g.pendingHunter).toBeNull();
    expect(g.phase).toBe("day");
  });

  it("the hunter's night shot is unstoppable — a LIVING ward on the shot target never saves it", () => {
    // A REAL guardian must be in the roster, else `guardianAlive` is always false
    // and the ward is a no-op that proves nothing. Config with a live guardian:
    // p1 wolf, p2 guardian, p3 hunter, p4/p5 villagers (identity shuffle, in order).
    const cfg: RoleConfig = { werewolves: 1, seer: false, guardian: true, hunter: true };
    const guarded = (): Game => createGame(seats(5), cfg, identityShuffle);
    // The living guardian (p2) wards p4, the Cazador's pre-committed shot. The pack
    // kills the HUNTER (p3), a different player — so the ward is genuinely "live"
    // over p4 and would save it from a normal kill. It must NOT save p4 from the
    // hunter's unstoppable shot.
    const g = resolveNight(guarded(), "p3", "p4", "p4");
    expect(isAlive(g, "p3")).toBe(false); // the hunter fell
    expect(isAlive(g, "p4")).toBe(false); // the ward did NOT save the shot target

    // Control: the SAME ward WOULD save p4 from an ordinary wolf kill. This proves
    // the ward is live and distinguishes the unstoppable-shot carve-out — if the
    // carve-out were deleted, the shot would be treated as a normal kill and p4
    // would survive above, failing the assertion.
    const control = resolveNight(guarded(), "p4", "p4", null);
    expect(isAlive(control, "p4")).toBe(true);
  });

  it("a pre-commit is ignored when the hunter is NOT the one killed", () => {
    // The wolves kill a villager (p3); the hunter (p2) survives, so the pre-commit
    // on p4 does nothing.
    const g = resolveNight(nightGame(), "p3", null, "p4");
    expect(isAlive(g, "p3")).toBe(false);
    expect(isAlive(g, "p4")).toBe(true);
    expect(isAlive(g, "p2")).toBe(true);
    expect(g.pendingHunter).toBeNull();
  });

  it("a night pre-commit that kills the last wolf hands the town the win", () => {
    // 4 players: p1 wolf, p2 hunter, p3-4 villagers. The hunter pre-commits the
    // wolf (p1); the wolves kill the hunter — the shot takes the last wolf.
    const g = createGame(seats(4), { werewolves: 1, seer: false, guardian: false, hunter: true }, identityShuffle);
    const after = resolveNight(g, "p2", null, "p1");
    expect(after.status).toBe("ended");
    expect(after.winner).toBe("town");
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

  it("a night-killed hunter with a null or not-alive shot takes only the hunter — no crash, no phantom death", () => {
    // Null pre-commit: only the hunter (p2) falls, nobody else, dawn breaks.
    const noShot = resolveNight(nightGame(), "p2", null, null);
    expect(isAlive(noShot, "p2")).toBe(false);
    expect(noShot.players.filter((p) => !p.alive)).toHaveLength(1);
    expect(noShot.pendingHunter).toBeNull();
    expect(noShot.phase).toBe("day");

    // A shot id that is not a living player (unknown id) is a safe no-op: the
    // hunter still falls alone, no phantom second death, no throw.
    const absentShot = resolveNight(nightGame(), "p2", null, "ghost");
    expect(isAlive(absentShot, "p2")).toBe(false);
    expect(absentShot.players.filter((p) => !p.alive)).toHaveLength(1);
    expect(absentShot.pendingHunter).toBeNull();
    expect(absentShot.phase).toBe("day");
  });

  it("killing a non-hunter does not pause", () => {
    const g = resolveNight(nightGame(), "p3", null); // villager
    expect(g.pendingHunter).toBeNull();
    expect(g.phase).toBe("day");
  });
});
