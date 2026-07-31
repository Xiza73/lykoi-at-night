import { isWitch } from "./roles";
import type { Player, PlayerId } from "./player";
import type { Shuffle } from "./shuffle";

/** A face-down tryal card. A player is a witch if they hold a "witch" card. */
export type TryalCard = "witch" | "not_witch" | "constable";

/** Each player holds this many face-down tryal cards. */
export const TRYALS_PER_PLAYER = 3;

/** A player's tryal cards and which of them have been revealed. */
export interface TryalDeck {
  readonly cards: readonly TryalCard[];
  readonly revealed: readonly boolean[];
}

/**
 * Builds each player's tryal deck. Every witch holds exactly one "witch" card
 * among "not_witch" cards; townsfolk hold only "not_witch" cards, except one
 * townsperson who holds a single "constable" card. Card order within each deck
 * is shuffled so a revealer cannot predict which card is the witch.
 */
export function dealTryals(
  players: readonly Player[],
  shuffle: Shuffle,
): Record<PlayerId, TryalDeck> {
  const townIds = players.filter((p) => !isWitch(p.role)).map((p) => p.id);
  const constableId = townIds.length > 0 ? shuffle(townIds)[0] : null;

  const decks: Record<PlayerId, TryalDeck> = {};
  for (const player of players) {
    const cards: TryalCard[] = [];
    if (isWitch(player.role)) {
      cards.push("witch");
    } else if (player.id === constableId) {
      cards.push("constable");
    }
    while (cards.length < TRYALS_PER_PLAYER) {
      cards.push("not_witch");
    }
    const ordered = shuffle(cards);
    decks[player.id] = { cards: ordered, revealed: ordered.map(() => false) };
  }
  return decks;
}
