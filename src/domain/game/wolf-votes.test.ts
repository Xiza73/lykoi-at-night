import { describe, expect, it } from "vitest";
import { resolveWolfVotes } from "./game";

describe("resolveWolfVotes", () => {
  it("picks the plurality winner", () => {
    expect(resolveWolfVotes(["p3", "p3", "p4"])).toEqual({
      victim: "p3",
      tie: false,
    });
  });

  it("returns the sole target when a single wolf votes", () => {
    expect(resolveWolfVotes(["p3"])).toEqual({ victim: "p3", tie: false });
  });

  it("reports a two-way tie between two targets", () => {
    expect(resolveWolfVotes(["p3", "p4"])).toEqual({
      victim: null,
      tie: true,
    });
  });

  it("reports a tie when the top is split evenly", () => {
    expect(resolveWolfVotes(["p3", "p3", "p4", "p4"])).toEqual({
      victim: null,
      tie: true,
    });
  });

  it("ignores abstentions when tallying", () => {
    expect(resolveWolfVotes(["p3", null, "p3"])).toEqual({
      victim: "p3",
      tie: false,
    });
  });

  it("treats all-abstentions as no victim, not a tie", () => {
    expect(resolveWolfVotes([null, null])).toEqual({
      victim: null,
      tie: false,
    });
  });

  it("treats an empty ballot as no victim, not a tie", () => {
    expect(resolveWolfVotes([])).toEqual({ victim: null, tie: false });
  });

  it("breaks a tie with one extra vote", () => {
    expect(resolveWolfVotes(["p3", "p4", "p3"])).toEqual({
      victim: "p3",
      tie: false,
    });
  });
});
