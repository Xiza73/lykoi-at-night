import { describe, it, expect } from "vitest";
import { alignmentOf, isWolf } from "./roles";

describe("alignmentOf", () => {
  it("puts werewolves with the wolves", () => {
    expect(alignmentOf("werewolf")).toBe("wolves");
  });
  it("puts everyone else with the town", () => {
    expect(alignmentOf("seer")).toBe("town");
    expect(alignmentOf("guardian")).toBe("town");
    expect(alignmentOf("villager")).toBe("town");
  });
});

describe("isWolf", () => {
  it("is true only for werewolves", () => {
    expect(isWolf("werewolf")).toBe(true);
    expect(isWolf("villager")).toBe(false);
  });
});
