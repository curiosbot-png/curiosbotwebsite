import { describe, expect, it } from "vitest";
import { scoreLead, type ScoringRule, type StageThreshold } from "../src/lib/scoring";

const rules: ScoringRule[] = [
  { key: "product_view", label: "Product", event_type: "page_view", content_type: "product", points: 5, max_count: 3, active: true },
  { key: "insights_multi", label: "Articles", event_type: "page_view", content_type: "insight", points: 3, max_count: 3, active: true },
  { key: "return_visit", label: "Return", event_type: null, content_type: null, points: 5, max_count: 1, active: true },
  { key: "demo_request", label: "Demo", event_type: "demo_request", content_type: null, points: 25, max_count: 1, active: true },
  { key: "off", label: "Disabled", event_type: "download", content_type: null, points: 99, max_count: 1, active: false },
];
const stages: StageThreshold[] = [
  { stage: "early_interest", min_score: 0 }, { stage: "engaged", min_score: 15 },
  { stage: "high_intent", min_score: 35 }, { stage: "sales_ready", min_score: 60 },
];

describe("scoreLead", () => {
  it("scores empty history as 0 / early interest", () => {
    expect(scoreLead([], rules, stages)).toMatchObject({ score: 0, stage: "early_interest", breakdown: [] });
  });
  it("caps repeated rules and explains the score", () => {
    const ev = Array.from({ length: 5 }, () => ({ type: "page_view", content_type: "product", day: "2026-09-01" }));
    const r = scoreLead(ev, rules, stages);
    expect(r.score).toBe(15);
    expect(r.stage).toBe("engaged");
    expect(r.breakdown).toEqual([{ rule: "product_view", label: "Product", points: 15, count: 3 }]);
  });
  it("requires 2+ article views for the multi-article rule", () => {
    const one = [{ type: "page_view", content_type: "insight", day: "d1" }];
    expect(scoreLead(one, rules, stages).score).toBe(0);
    expect(scoreLead([...one, ...one], rules, stages).score).toBe(6);
  });
  it("awards return visit only across different days and ignores inactive rules", () => {
    const ev = [
      { type: "page_view", content_type: "home", day: "2026-09-01" },
      { type: "page_view", content_type: "home", day: "2026-09-03" },
      { type: "download", content_type: null, day: "2026-09-03" },
    ];
    expect(scoreLead(ev, rules, stages).score).toBe(5);
  });
  it("lands in high_intent at 54 points (below the 60 sales_ready threshold)", () => {
    const ev = [
      ...Array.from({ length: 3 }, () => ({ type: "page_view", content_type: "product", day: "a" })),
      { type: "page_view", content_type: "x", day: "b" },
      { type: "demo_request", content_type: null, day: "b" },
      ...Array.from({ length: 3 }, () => ({ type: "page_view", content_type: "insight", day: "b" })),
    ];
    const r = scoreLead(ev, rules, stages);
    expect(r.score).toBe(15 + 25 + 9 + 5);
    expect(r.stage).toBe("high_intent");
  });
});
