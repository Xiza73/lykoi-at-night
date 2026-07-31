import { describe, it, expect } from "vitest";
import { createShuffle } from "./shuffle";

function makeRng(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

describe("createShuffle", () => {
  it("keeps every element (produces a permutation)", () => {
    const shuffle = createShuffle(() => 0.5);
    const output = shuffle([1, 2, 3, 4, 5]);
    expect([...output].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
  });

  it("does not mutate the input", () => {
    const shuffle = createShuffle(() => 0);
    const input = [1, 2, 3];
    shuffle(input);
    expect(input).toEqual([1, 2, 3]);
  });

  it("is deterministic for a given rng sequence", () => {
    const input = ["a", "b", "c", "d"];
    const a = createShuffle(makeRng([0.1, 0.9, 0.3]))(input);
    const b = createShuffle(makeRng([0.1, 0.9, 0.3]))(input);
    expect(a).toEqual(b);
  });
});
