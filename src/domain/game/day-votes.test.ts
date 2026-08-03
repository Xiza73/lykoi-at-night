import { describe, expect, it } from "vitest";
import { resolveDayVotes } from "./game";

describe("resolveDayVotes", () => {
  it("banishes the plurality winner", () => {
    expect(resolveDayVotes(["p3", "p3", "p4"])).toEqual({
      banished: "p3",
      tied: false,
      brokenByMayor: false,
    });
  });

  it("resolves a single non-abstaining vote to that player", () => {
    expect(resolveDayVotes(["p3"])).toEqual({
      banished: "p3",
      tied: false,
      brokenByMayor: false,
    });
  });

  it("ignores abstentions (null) when tallying", () => {
    expect(resolveDayVotes(["p3", null, "p3"])).toEqual({
      banished: "p3",
      tied: false,
      brokenByMayor: false,
    });
  });

  it("banishes nobody on a tie with no mayor vote", () => {
    expect(resolveDayVotes(["p3", "p4"])).toEqual({
      banished: null,
      tied: true,
      brokenByMayor: false,
    });
  });

  it("lets the mayor break a tie by voting a tied leader", () => {
    // p3 and p4 tie at 1 each; the mayor's own vote was for p3 (already in the
    // ballot). The +1 tips the scale to p3.
    expect(resolveDayVotes(["p3", "p4"], "p3")).toEqual({
      banished: "p3",
      tied: false,
      brokenByMayor: true,
    });
  });

  it("does NOT break a tie when the mayor's vote is never on the ballot", () => {
    // p3 and p4 tie; the mayor voted p9, which never appears in `votes`, so the
    // `tally.has(mayorVote)` guard rejects the boost and the tie stands.
    expect(resolveDayVotes(["p3", "p4"], "p9")).toEqual({
      banished: null,
      tied: true,
      brokenByMayor: false,
    });
  });

  it("does NOT break a tie when the mayor abstains", () => {
    expect(resolveDayVotes(["p3", "p4"], null)).toEqual({
      banished: null,
      tied: true,
      brokenByMayor: false,
    });
  });

  it("does NOT break a tie when the mayor voted a low non-leader", () => {
    // p3=3, p4=3 tie at the top; p5 got 1. The mayor voting p5 lifts it to 2,
    // still far below the leaders, so the top pair stays tied — nobody banished.
    expect(
      resolveDayVotes(["p3", "p3", "p3", "p4", "p4", "p4", "p5"], "p5"),
    ).toEqual({
      banished: null,
      tied: true,
      brokenByMayor: false,
    });
  });

  it("still ties when boosting the mayor's pick only levels a three-way top", () => {
    // p3=2, p4=2, p5=1; the mayor voting p5 lifts it to 2/2/2 — a three-way
    // tie, so there is still no unique winner and nobody is banished.
    expect(resolveDayVotes(["p3", "p3", "p4", "p4", "p5"], "p5")).toEqual({
      banished: null,
      tied: true,
      brokenByMayor: false,
    });
  });

  it("banishes nobody when there are no votes", () => {
    expect(resolveDayVotes([])).toEqual({
      banished: null,
      tied: false,
      brokenByMayor: false,
    });
  });

  it("banishes nobody when everyone abstains", () => {
    expect(resolveDayVotes([null, null])).toEqual({
      banished: null,
      tied: false,
      brokenByMayor: false,
    });
  });
});
