import { describe, it, expect } from "vitest";
import { nextPhase } from "./phase";

describe("nextPhase", () => {
  it("goes from day to night", () => {
    expect(nextPhase("day")).toBe("night");
  });

  it("goes from night to day", () => {
    expect(nextPhase("night")).toBe("day");
  });
});
