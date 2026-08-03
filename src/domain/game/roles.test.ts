import { describe, it, expect } from "vitest";
import { alignmentOf, isWolf, roleWeight } from "./roles";

describe("alignmentOf", () => {
  it("puts werewolves with the wolves", () => {
    expect(alignmentOf("werewolf")).toBe("wolves");
  });
  it("puts everyone else with the town", () => {
    expect(alignmentOf("seer")).toBe("town");
    expect(alignmentOf("guardian")).toBe("town");
    expect(alignmentOf("mayor")).toBe("town");
    expect(alignmentOf("villager")).toBe("town");
  });
});

describe("isWolf", () => {
  it("is true only for werewolves", () => {
    expect(isWolf("werewolf")).toBe(true);
    expect(isWolf("villager")).toBe(false);
  });
});

describe("roleWeight", () => {
  it("carries the target-roster balance weight for each role", () => {
    expect(roleWeight("werewolf")).toBe(-6);
    expect(roleWeight("seer")).toBe(7);
    expect(roleWeight("guardian")).toBe(3);
    expect(roleWeight("hunter")).toBe(3);
    expect(roleWeight("mayor")).toBe(2);
    expect(roleWeight("villager")).toBe(1);
  });
});
