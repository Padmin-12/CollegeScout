// src/lib/scoring.ts

export type ScoringInput = {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  nirfRank: number | null;
  avgPackage: number | null;
  minFee: number | null;
};

// Aliases used by tests and external callers
export type CollegeInput = ScoringInput;

export type Weights = {
  placement: number;
  fees: number;
  ranking?: number;
  location?: number; // Backwards-compatible alias for ranking
};

// Alias used by tests
export type WeightInput = Weights;

export type ScoredCollege = ScoringInput & {
  score: number;
  dimensionScores: {
    placement: number;
    fees: number;
    ranking: number;
    location: number; // Backwards-compatible alias
  };
};

export function scoreColleges(inputs: ScoringInput[], weights: Weights): ScoredCollege[] {
  if (inputs.length === 0) return [];

  // Extract valid non-null values for range calculation
  const validPkgs = inputs.map((i) => i.avgPackage).filter((v): v is number => v != null);
  const validFees = inputs.map((i) => i.minFee).filter((v): v is number => v != null);
  const validRanks = inputs.map((i) => i.nirfRank).filter((v): v is number => v != null);

  const minPkg = validPkgs.length > 0 ? Math.min(...validPkgs) : 0;
  const maxPkg = validPkgs.length > 0 ? Math.max(...validPkgs) : 0;

  const minFee = validFees.length > 0 ? Math.min(...validFees) : 0;
  const maxFee = validFees.length > 0 ? Math.max(...validFees) : 0;

  const minRnk = validRanks.length > 0 ? Math.min(...validRanks) : 1;
  const maxRnk = validRanks.length > 0 ? Math.max(...validRanks) : 100;

  // Support both weights.ranking and legacy weights.location
  const rankWeight = weights.ranking ?? weights.location ?? 0;
  const totalWeight = weights.placement + weights.fees + rankWeight || 1;
  const normWeights = {
    placement: weights.placement / totalWeight,
    fees:      weights.fees      / totalWeight,
    ranking:   rankWeight        / totalWeight,
  };

  const norm = (v: number, lo: number, hi: number) =>
    hi === lo ? 0.5 : Math.max(0, Math.min(1, (v - lo) / (hi - lo)));

  const scored: ScoredCollege[] = inputs.map((college) => {
    // Placement: higher package = better. If missing, neutral score (0.2).
    let placementScore = 0.2;
    if (college.avgPackage != null) {
      placementScore = norm(college.avgPackage, minPkg, maxPkg);
    }

    // Fees: lower fee = better (invert). If missing, neutral score (0.5) to avoid false "cheapest" advantage.
    let feesScore = 0.5;
    if (college.minFee != null) {
      feesScore = 1 - norm(college.minFee, minFee, maxFee);
    }

    // Ranking: lower NIRF rank number = better (invert).
    let rankingScore = 0.2;
    if (college.nirfRank != null) {
      rankingScore = 1 - norm(college.nirfRank, minRnk, maxRnk);
    }

    const weightedScore =
      placementScore * normWeights.placement +
      feesScore      * normWeights.fees      +
      rankingScore   * normWeights.ranking;

    const roundedPlacement = Math.round(placementScore * 1000) / 10;
    const roundedFees      = Math.round(feesScore      * 1000) / 10;
    const roundedRanking   = Math.round(rankingScore   * 1000) / 10;

    return {
      ...college,
      score: Math.round(weightedScore * 1000) / 10, // 0–100
      dimensionScores: {
        placement: roundedPlacement,
        fees:      roundedFees,
        ranking:   roundedRanking,
        location:  roundedRanking, // Alias for backward compatibility
      },
    };
  });

  return scored.sort((a, b) => b.score - a.score);
}