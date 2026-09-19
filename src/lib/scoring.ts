// Pure lead-scoring engine. Uses only behavioural events + voluntarily-submitted form data.
// It never receives or uses sensitive personal attributes, and always returns a breakdown explaining the score.

export interface ScoringRule {
  key: string;
  label: string;
  event_type: string | null;
  content_type: string | null;
  points: number;
  max_count: number;
  active: boolean;
}
export interface ScoringEvent {
  type: string;
  content_type: string | null;
  day: string; // YYYY-MM-DD
}
export interface StageThreshold {
  stage: "early_interest" | "engaged" | "high_intent" | "sales_ready";
  min_score: number;
}
export interface ScoreLine {
  rule: string;
  label: string;
  points: number;
  count: number;
}
export interface ScoreResult {
  score: number;
  stage: StageThreshold["stage"];
  breakdown: ScoreLine[];
}

export function scoreLead(events: ScoringEvent[], rules: ScoringRule[], stages: StageThreshold[]): ScoreResult {
  const breakdown: ScoreLine[] = [];
  const distinctDays = new Set(events.map((e) => e.day));
  for (const rule of rules.filter((r) => r.active)) {
    let count: number;
    if (rule.key === "return_visit") {
      count = distinctDays.size > 1 ? 1 : 0; // behaviour on 2+ different days
    } else {
      count = events.filter(
        (e) => e.type === rule.event_type && (rule.content_type === null || e.content_type === rule.content_type),
      ).length;
    }
    // "multiple articles" only scores when there are at least 2 article views
    if (rule.key === "insights_multi" && count < 2) count = 0;
    count = Math.min(count, rule.max_count);
    if (count > 0) breakdown.push({ rule: rule.key, label: rule.label, points: rule.points * count, count });
  }
  const score = breakdown.reduce((s, l) => s + l.points, 0);
  const sorted = [...stages].sort((a, b) => b.min_score - a.min_score);
  const stage = sorted.find((s) => score >= s.min_score)?.stage ?? "early_interest";
  return { score, stage, breakdown };
}
