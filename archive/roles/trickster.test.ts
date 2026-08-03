import { describe, it, expect } from "vitest";
import { createGame, investigate, livingWolves, resolveNight } from "./game";
import { alignmentOf, isWolf, seerReadingOf } from "./roles";
import type { Seat } from "./player";
import type { Shuffle } from "./shuffle";

const identityShuffle: Shuffle = (items) => [...items];
function seats(count: number): Seat[] {
  return Array.from({ length: count }, (_, i) => ({ id: `p${i + 1}`, name: `Player ${i + 1}` }));
}

describe("trickster role (Ronroneo Falso)", () => {
  it("is wolf-aligned", () => {
    expect(alignmentOf("trickster")).toBe("wolves");
    expect(isWolf("trickster")).toBe(true);
  });

  it("disguises only the trickster in the seer reading", () => {
    expect(seerReadingOf("trickster")).toBe("town");
    expect(seerReadingOf("werewolf")).toBe("wolves");
    expect(seerReadingOf("villager")).toBe("town");
    expect(seerReadingOf("infector")).toBe("wolves");
  });

  it("makes the seer read the disguised wolf as town", () => {
    // p1 werewolf, p2 trickster, p3 seer, p4-6 villagers
    const g = createGame(seats(6), { werewolves: 1, seer: true, guardian: false, trickster: true }, identityShuffle);
    expect(investigate(g, "p2")).toBe("town"); // disguised wolf
    expect(investigate(g, "p1")).toBe("wolves"); // real werewolf
    expect(investigate(g, "p3")).toBe("town"); // seer
  });

  it("counts the trickster among the living wolves", () => {
    const g = createGame(seats(6), { werewolves: 1, seer: true, guardian: false, trickster: true }, identityShuffle);
    expect(livingWolves(g)).toHaveLength(2);
  });

  it("counts the trickster as a wolf for the strict-minority invariant", () => {
    // 4 seats: 1 werewolf + 1 trickster = 2 wolves vs 2 town -> invalid
    expect(() =>
      createGame(seats(4), { werewolves: 1, seer: false, guardian: false, trickster: true }, identityShuffle),
    ).toThrow(RangeError);
  });

  it("counts for parity when the wolves reach it", () => {
    // 5 seats: p1 wolf, p2 trickster, p3-5 villagers. Kill p3 -> 2 wolves vs 2 town.
    const g = createGame(seats(5), { werewolves: 1, seer: false, guardian: false, trickster: true }, identityShuffle);
    const after = resolveNight(g, "p3", null);
    expect(after.status).toBe("ended");
    expect(after.winner).toBe("wolves");
  });
});
