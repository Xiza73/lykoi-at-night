import { describe, it, expect } from "vitest";
import { isWitch, type Role } from "./roles";

describe("isWitch", () => {
  it("identifies witches", () => {
    expect(isWitch("witch")).toBe(true);
  });

  it("does not flag villagers", () => {
    const role: Role = "villager";
    expect(isWitch(role)).toBe(false);
  });
});
