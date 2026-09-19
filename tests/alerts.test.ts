import { describe, expect, it } from "vitest";
import { detectConversionDrop, detectSpike, detectTrending } from "../src/lib/alerts";

describe("alert detectors", () => {
  it("spike needs both a multiple and minimum volume", () => {
    expect(detectSpike(60, 20, 2)).toBe(true);
    expect(detectSpike(10, 2, 2)).toBe(false); // ratio is high but volume too low to be meaningful
    expect(detectSpike(30, 0, 2)).toBe(false); // no baseline
  });
  it("conversion drop requires enough visitors in both periods", () => {
    expect(detectConversionDrop(0.01, 0.03, 200, 200, 30)).toBe(true);
    expect(detectConversionDrop(0.01, 0.03, 20, 200, 30)).toBe(false);
    expect(detectConversionDrop(0.025, 0.03, 200, 200, 30)).toBe(false);
  });
  it("trending requires volume and growth", () => {
    expect(detectTrending(50, 20, 2)).toBe(true);
    expect(detectTrending(50, 40, 2)).toBe(false);
    expect(detectTrending(5, 1, 2)).toBe(false);
  });
});
