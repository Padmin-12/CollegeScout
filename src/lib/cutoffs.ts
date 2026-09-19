/** Cutoff row shape used across UI and APIs */
export type CutoffRow = {
  id: string;
  exam: string;
  year: number;
  category: string;
  branch: string;
  cutoffValue: number;
};

/** Per exam/year/category: last rank/score needed to get into ANY branch */
export type CutoffSummary = {
  exam: string;
  year: number;
  category: string;
  lastClosingRank: number;
  easiestBranch: string;
  branches: { branch: string; cutoffValue: number }[];
};
export function isScoreBasedExam(exam: string): boolean {
  const upper = exam.toUpperCase();
  return ["BITSAT", "VITEEE", "SRMJEEE", "MET"].some((e) => upper.includes(e));
}

export function isPercentileExam(exam: string): boolean {
  const upper = exam.toUpperCase();
  return upper.includes("MHT-CET") || upper.includes("PERCENTILE");
}

/**
 * For rank-based exams, the highest cutoff value across branches = last seat filled.
 * For score/percentile-based exams, the lowest cutoff value across branches = last seat filled.
 */
export function summarizeCutoffs(rows: CutoffRow[]): CutoffSummary[] {
  const groups = new Map<string, CutoffRow[]>();

  for (const row of rows) {
    const key = `${row.exam}::${row.year}::${row.category}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const summaries: CutoffSummary[] = [];

  for (const [, group] of groups) {
    const sample = group[0];
    const isHigherBetter = isScoreBasedExam(sample.exam) || isPercentileExam(sample.exam);

    const branches = group
      .map((r) => ({ branch: r.branch || "General", cutoffValue: r.cutoffValue }))
      .sort((a, b) => (isHigherBetter ? a.cutoffValue - b.cutoffValue : b.cutoffValue - a.cutoffValue));

    const easiest = branches[0];
    if (!easiest) continue;

    summaries.push({
      exam: sample.exam,
      year: sample.year,
      category: sample.category,
      lastClosingRank: easiest.cutoffValue,
      easiestBranch: easiest.branch,
      branches,
    });
  }

  return summaries.sort((a, b) => {
    if (a.exam !== b.exam) return a.exam.localeCompare(b.exam);
    if (b.year !== a.year) return b.year - a.year;
    return a.category.localeCompare(b.category);
  });
}

/** Latest year's last closing rank or score for predictor (any branch). */
export function latestLastClosingRank(rows: CutoffRow[]): number | null {
  if (!rows.length) return null;
  const latestYear = Math.max(...rows.map((r) => r.year));
  const latest = rows.filter((r) => r.year === latestYear);
  const sampleExam = rows[0]?.exam ?? "";
  if (isScoreBasedExam(sampleExam) || isPercentileExam(sampleExam)) {
    return Math.min(...latest.map((r) => r.cutoffValue));
  }
  return Math.max(...latest.map((r) => r.cutoffValue));
}

export function cutoffValueLabel(exam: string): string {
  if (isPercentileExam(exam)) return "Percentile";
  if (isScoreBasedExam(exam)) return "Score";
  return "Closing rank";
}
