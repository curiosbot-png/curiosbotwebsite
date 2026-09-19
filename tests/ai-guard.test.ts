import { describe, expect, it } from "vitest";
import { extractNumbers, snapshotNumbers, unverifiedNumbers } from "../src/lib/ai";

describe("numeric traceability guard", () => {
  const snap = { kpis: { cur: { visitors: 1204, leads: 31 }, change: { visitors: 31.4 } } };
  const allowed = snapshotNumbers(snap);
  it("extracts numbers", () => expect(extractNumbers("Up 31% to 1,204")).toEqual([31, 1204]));
  it("accepts numbers present in the snapshot (incl. rounding)", () => {
    expect(unverifiedNumbers("Visitors rose 31% to 1,204", allowed)).toEqual([]);
    expect(unverifiedNumbers("Visitors rose 31.4%", allowed)).toEqual([]);
  });
  it("flags invented numbers", () => expect(unverifiedNumbers("Conversion hit 87% and 4,500 visits", allowed)).toEqual([87, 4500]));
  it("ignores small counts like 'top 3'", () => expect(unverifiedNumbers("Test on the top 3 articles", allowed)).toEqual([]));
});
