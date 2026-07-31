import { describe, it, expect } from "vitest";
import { dealTryals, TRYALS_PER_PLAYER, type TryalCard } from "./tryal";
import { dealRoles, type Seat } from "./player";
import type { Shuffle } from "./shuffle";

const identityShuffle: Shuffle = (items) => [...items];

function seats(count: number): Seat[] {
  return Array.from({ length: count }, (_, i) => ({ id: `p${i + 1}`, name: `Player ${i + 1}` }));
}

function countCard(cards: readonly TryalCard[], card: TryalCard): number {
  return cards.filter((c) => c === card).length;
}

describe("dealTryals", () => {
  // identityShuffle + witchCount 2 => p1,p2 witches; p3,p4,p5 townsfolk
  const players = dealRoles(seats(5), 2, identityShuffle);
  const decks = dealTryals(players, identityShuffle);

  it("gives every player the same number of face-down cards", () => {
    for (const player of players) {
      const deck = decks[player.id];
      expect(deck.cards).toHaveLength(TRYALS_PER_PLAYER);
      expect(deck.revealed).toHaveLength(TRYALS_PER_PLAYER);
      expect(deck.revealed.every((r) => r === false)).toBe(true);
    }
  });

  it("gives each witch exactly one witch card", () => {
    expect(countCard(decks["p1"].cards, "witch")).toBe(1);
    expect(countCard(decks["p2"].cards, "witch")).toBe(1);
  });

  it("gives no townsperson a witch card", () => {
    for (const id of ["p3", "p4", "p5"]) {
      expect(countCard(decks[id].cards, "witch")).toBe(0);
    }
  });

  it("places exactly one constable card, held by a townsperson", () => {
    const all = players.flatMap((p) => decks[p.id].cards);
    expect(countCard(all, "constable")).toBe(1);
    const holder = players.find((p) => decks[p.id].cards.includes("constable"));
    expect(holder?.role).toBe("villager");
  });
});
