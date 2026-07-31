/** A source of randomness returning a float in [0, 1). */
export type Rng = () => number;

/** Reorders a list without mutating it. */
export type Shuffle = <T>(items: readonly T[]) => T[];

/**
 * Builds a Fisher-Yates shuffle from an injected RNG. Keeping the RNG external
 * makes shuffling deterministic in tests and pure in the domain.
 */
export function createShuffle(rng: Rng): Shuffle {
  return <T>(items: readonly T[]): T[] => {
    const result: T[] = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      const temp = result[i];
      result[i] = result[j];
      result[j] = temp;
    }
    return result;
  };
}
