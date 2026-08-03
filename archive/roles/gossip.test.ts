import { describe, it, expect } from "vitest";
import { createGame, livingTown, livingWolves, peekRole, type Game } from "./game";
import { alignmentOf, isWolf, seerReadingOf } from "./roles";
import type { RoleConfig, Seat } from "./player";
import type { Shuffle } from "./shuffle";

const identityShuffle: Shuffle = (items) => [...items];

function seats(count: number): Seat[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
  }));
}

// p1 werewolf, p2 gossip, p3-6 villagers
const CFG: RoleConfig = { werewolves: 1, seer: false, guardian: false, gossip: true };
function game(): Game {
  return createGame(seats(6), CFG, identityShuffle);
}

describe("gossip role", () => {
  it("is town-aligned, no wolf, reads as town to the seer", () => {
    expect(alignmentOf("gossip")).toBe("town");
    expect(isWolf("gossip")).toBe(false);
    expect(seerReadingOf("gossip")).toBe("town");
  });

  it("deals one gossip and counts them with the town, never the wolves", () => {
    const g = game();
    expect(g.players.filter((p) => p.role === "gossip")).toHaveLength(1);
    // Only the werewolf is a wolf; the gossip + 4 villagers are town.
    expect(livingWolves(g)).toHaveLength(1);
    expect(livingTown(g)).toHaveLength(5);
  });

  it("peeks the true role of any cat, dead or alive", () => {
    const g = game();
    expect(peekRole(g, "p1")).toBe("werewolf");
    expect(peekRole(g, "p2")).toBe("gossip");
    expect(peekRole(g, "p3")).toBe("villager");
  });

  it("returns null for an unknown id", () => {
    expect(peekRole(game(), "nobody")).toBeNull();
  });

  it("counts as a town special toward the deal-fit bound", () => {
    // seats(4): 1 wolf + seer + guardian + hunter + gossip = 5 specials > 4.
    expect(() =>
      createGame(
        seats(4),
        {
          werewolves: 1,
          seer: true,
          guardian: true,
          hunter: true,
          gossip: true,
        },
        identityShuffle,
      ),
    ).toThrow();
  });
});
