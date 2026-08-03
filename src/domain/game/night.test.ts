import { describe, it, expect } from "vitest";
import {
  advancePhase,
  createGame,
  investigate,
  lynch,
  resolveNight,
  type Game,
} from "./game";
import type { RoleConfig, Seat } from "./player";
import type { Shuffle } from "./shuffle";

const identityShuffle: Shuffle = (items) => [...items];
function seats(count: number): Seat[] {
  return Array.from({ length: count }, (_, i) => ({ id: `p${i + 1}`, name: `Player ${i + 1}` }));
}
// p1 wolf, p2 seer, p3 guardian, p4-6 villagers
const CORE: RoleConfig = { werewolves: 1, seer: true, guardian: true };
function nightGame(): Game {
  return createGame(seats(6), CORE, identityShuffle);
}
function isAlive(g: Game, id: string): boolean {
  const p = g.players.find((pp) => pp.id === id);
  return p ? p.alive : false;
}

describe("investigate (seer)", () => {
  it("reads a werewolf as wolves and a villager as town", () => {
    const g = nightGame();
    expect(investigate(g, "p1")).toBe("wolves");
    expect(investigate(g, "p4")).toBe("town");
  });
});

describe("resolveNight", () => {
  it("kills the wolves' victim and breaks to day", () => {
    const g = resolveNight(nightGame(), "p4", null);
    expect(isAlive(g, "p4")).toBe(false);
    expect(g.phase).toBe("day");
    expect(g.round).toBe(1);
  });
  it("spares the victim when a living guardian wards them", () => {
    const g = resolveNight(nightGame(), "p4", "p4");
    expect(isAlive(g, "p4")).toBe(true);
  });
  it("does not save when the ward misses the victim", () => {
    const g = resolveNight(nightGame(), "p4", "p5");
    expect(isAlive(g, "p4")).toBe(false);
  });
  it("cannot ward once the guardian is dead", () => {
    let g = advancePhase(nightGame()); // night1 -> day1
    g = lynch(g, "p3"); // guardian lynched -> night2
    const after = resolveNight(g, "p4", "p4");
    expect(isAlive(after, "p4")).toBe(false);
  });
  it("is a no-op during the day", () => {
    const day = advancePhase(nightGame());
    const g = resolveNight(day, "p4", null);
    expect(isAlive(g, "p4")).toBe(true);
    expect(g.phase).toBe("day");
  });
});

describe("resolveNight — Curandero ward memory (no-repeat / no-self)", () => {
  it("records the warded player in lastWarded and starts null", () => {
    const g0 = nightGame();
    expect(g0.lastWarded).toBeNull();
    const g1 = resolveNight(g0, "p4", "p4");
    expect(g1.lastWarded).toBe("p4");
  });

  it("rejects warding the SAME player two nights in a row — the repeat target dies", () => {
    // Night 1: ward p4 (the wolf's target) -> saved, lastWarded = p4.
    let g = resolveNight(nightGame(), "p4", "p4");
    expect(isAlive(g, "p4")).toBe(true);
    expect(g.lastWarded).toBe("p4");
    // Day 1 -> night 2 (no death, guardian p3 still alive).
    g = advancePhase(g); // day1 -> night2
    // Night 2: ward p4 again — illegal repeat, so p4 is NOT saved and dies.
    g = resolveNight(g, "p4", "p4");
    expect(isAlive(g, "p4")).toBe(false);
    // The rejected ward resets the streak to null.
    expect(g.lastWarded).toBeNull();
  });

  it("rejects the guardian warding HIMSELF — self dies if targeted", () => {
    // The wolves target the guardian (p3) and the guardian wards himself.
    const g = resolveNight(nightGame(), "p3", "p3");
    expect(isAlive(g, "p3")).toBe(false);
    expect(g.lastWarded).toBeNull();
  });

  it("does not record lastWarded when no living guardian warded", () => {
    // Guardian (p3) lynched on day 1; on night 2 a stray non-null protectedId must
    // NOT pollute the ward memory — there is no living Curandero watching anyone.
    let g = advancePhase(nightGame()); // night1 -> day1
    g = lynch(g, "p3"); // guardian lynched -> night2
    g = resolveNight(g, "p4", "p5"); // stray ward, no guardian alive
    expect(g.lastWarded).toBeNull();
    expect(isAlive(g, "p4")).toBe(false); // nobody could save the victim
  });

  it("resets the streak when nobody is warded, freeing last night's target again", () => {
    // Night 1: ward p4 -> saved, lastWarded = p4.
    let g = resolveNight(nightGame(), "p4", "p4");
    expect(g.lastWarded).toBe("p4");
    g = advancePhase(g); // day1 -> night2
    // Night 2: ward nobody -> streak resets to null (target p5 dies).
    g = resolveNight(g, "p5", null);
    expect(g.lastWarded).toBeNull();
    g = advancePhase(g); // day2 -> night3
    // Night 3: p4 is wardable again because the streak was broken.
    g = resolveNight(g, "p4", "p4");
    expect(isAlive(g, "p4")).toBe(true);
    expect(g.lastWarded).toBe("p4");
  });

  it("threads lastWarded through the game-end return path", () => {
    // 5 players: p1/p2 wolves, p3 guardian, p4/p5 villagers. The pack kills p4, so
    // two wolves remain against two townsfolk (p3, p5) — parity, the wolves win
    // and the game ends on the same resolveNight. The guardian (p3) legally wards
    // p5, which is threaded through the ended snapshot even though it did not save
    // the victim.
    const g0 = createGame(
      seats(5),
      { werewolves: 2, seer: false, guardian: true },
      identityShuffle,
    );
    const g = resolveNight(g0, "p4", "p5");
    expect(g.status).toBe("ended");
    expect(g.winner).toBe("wolves");
    expect(g.lastWarded).toBe("p5");
  });

  it("threads lastWarded through the hunter-shot return path", () => {
    // p1 wolf, p2 guardian, p3 hunter, p4-6 villagers. Wolf kills the hunter (p3),
    // whose pre-committed shot fires. The guardian legally wards p4, which is
    // recorded in lastWarded even though the death path routes through the shot.
    const g0 = createGame(
      seats(6),
      { werewolves: 1, seer: false, guardian: true, hunter: true },
      identityShuffle,
    );
    const g = resolveNight(g0, "p3", "p4", "p5");
    expect(isAlive(g, "p3")).toBe(false); // hunter killed
    expect(isAlive(g, "p5")).toBe(false); // his shot fired
    expect(g.lastWarded).toBe("p4"); // legal ward recorded through the shot path
  });
});
