import { describe, it, expect } from "vitest";
import {
  advancePhase,
  createGame,
  livingTown,
  livingWolves,
  lynch,
  nightFootsteps,
  type Game,
} from "./game";
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

// p1 werewolf, p2 insomniac, p3-6 villagers
const CFG: RoleConfig = { werewolves: 1, seer: false, guardian: false, insomniac: true };
function game(): Game {
  return createGame(seats(6), CFG, identityShuffle);
}

describe("insomniac role", () => {
  it("is town-aligned, no wolf, reads as town to the seer", () => {
    expect(alignmentOf("insomniac")).toBe("town");
    expect(isWolf("insomniac")).toBe(false);
    expect(seerReadingOf("insomniac")).toBe("town");
  });

  it("deals one insomniac and counts them with the town, never the wolves", () => {
    const g = game();
    expect(g.players.filter((p) => p.role === "insomniac")).toHaveLength(1);
    // Only the werewolf is a wolf; the insomniac + 4 villagers are town.
    expect(livingWolves(g)).toHaveLength(1);
    expect(livingTown(g)).toHaveLength(5);
  });

  it("hears the pack: footsteps equal the living wolves count", () => {
    expect(nightFootsteps(game())).toBe(1);
  });

  it("footsteps track the pack as wolves fall", () => {
    // Two wolves (p1, p2), then the insomniac + villagers.
    let g = createGame(
      seats(6),
      { werewolves: 2, seer: false, guardian: false, insomniac: true },
      identityShuffle,
    );
    expect(nightFootsteps(g)).toBe(2);
    // Move to day and lynch a wolf: one wolf left, footsteps drop to one.
    g = advancePhase(g); // night -> day
    g = lynch(g, "p1");
    expect(nightFootsteps(g)).toBe(1);
  });

  it("counts as a town special toward the deal-fit bound", () => {
    // seats(4): 1 wolf + seer + guardian + hunter + insomniac = 5 specials > 4.
    expect(() =>
      createGame(
        seats(4),
        {
          werewolves: 1,
          seer: true,
          guardian: true,
          hunter: true,
          insomniac: true,
        },
        identityShuffle,
      ),
    ).toThrow();
  });
});
