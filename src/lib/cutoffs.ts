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

/**
 * For rank-based exams, the highest cutoff value across branches = last seat filled
 * (most accessible branch to enter the college).
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
    const branches = group
      .map((r) => ({ branch: r.branch || "General", cutoffValue: r.cutoffValue }))
      .sort((a, b) => b.cutoffValue - a.cutoffValue);

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

/** Latest year's last closing rank for predictor (any branch). */
export function latestLastClosingRank(rows: CutoffRow[]): number | null {
  if (!rows.length) return null;
  const latestYear = Math.max(...rows.map((r) => r.year));
  const latest = rows.filter((r) => r.year === latestYear);
  return Math.max(...latest.map((r) => r.cutoffValue));
}

export function cutoffValueLabel(exam: string): string {
  const upper = exam.toUpperCase();
  if (upper.includes("MHT-CET") || upper.includes("PERCENTILE")) return "Percentile";
  if (["BITSAT", "VITEEE", "SRMJEEE", "MET"].some((e) => upper.includes(e))) return "Score";
  return "Closing rank";
}
