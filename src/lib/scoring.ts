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
  location: number;
};

// Alias used by tests
export type WeightInput = Weights;

export type ScoredCollege = ScoringInput & {
  score: number;
  dimensionScores: {
    placement: number;
    fees: number;
    location: number;
  };
};



export function scoreColleges(inputs: ScoringInput[], weights: Weights): ScoredCollege[] {
  if (inputs.length === 0) return [];

  // Get ranges for normalisation
  const packages = inputs.map((i) => i.avgPackage ?? 0);
  const fees     = inputs.map((i) => i.minFee ?? 0);
  const ranks    = inputs.map((i) => i.nirfRank ?? 999);

  const minPkg = Math.min(...packages), maxPkg = Math.max(...packages);
  const minFee = Math.min(...fees),     maxFee = Math.max(...fees);
  const minRnk = Math.min(...ranks),    maxRnk = Math.max(...ranks);

  // Normalise weights to sum to 1
  const totalWeight = weights.placement + weights.fees + weights.location || 1;
  const normWeights = {
    placement: weights.placement / totalWeight,
    fees:      weights.fees      / totalWeight,
    location:  weights.location  / totalWeight,
  };

  const norm = (v: number, lo: number, hi: number) =>
    hi === lo ? 0.5 : Math.max(0, Math.min(1, (v - lo) / (hi - lo)));

  const scored: ScoredCollege[] = inputs.map((college) => {
    // Placement: higher package = better
    const placementScore = norm(college.avgPackage ?? 0, minPkg, maxPkg);

    // Fees: lower fee = better → invert
    const feesScore = 1 - norm(college.minFee ?? 0, minFee, maxFee);

    // Location (NIRF rank proxy): lower rank number = better → invert
    const locationScore = 1 - norm(college.nirfRank ?? 999, minRnk, maxRnk);

    const weightedScore =
      placementScore * normWeights.placement +
      feesScore      * normWeights.fees      +
      locationScore  * normWeights.location;

    return {
      ...college,
      score: Math.round(weightedScore * 1000) / 10, // 0–100
      dimensionScores: {
        placement: Math.round(placementScore * 1000) / 10,
        fees:      Math.round(feesScore      * 1000) / 10,
        location:  Math.round(locationScore  * 1000) / 10,
      },
    };
  });

  return scored.sort((a, b) => b.score - a.score);
}