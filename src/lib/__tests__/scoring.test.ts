/**
 * Scoring engine unit tests
 * Run with: npx ts-node --esm src/lib/__tests__/scoring.test.ts
 * (No external test runner needed — uses Node's built-in assert)
 */

import assert from "node:assert/strict";
import { scoreColleges, type CollegeInput, type WeightInput } from "../scoring";

// ── Test data ────────────────────────────────────────────────────────────────

const colleges: CollegeInput[] = [
  {
    id: "1", slug: "iit-bombay", name: "IIT Bombay",
    city: "Mumbai", state: "Maharashtra", nirfRank: 3,
    avgPackage: 27.5, minFee: 220000,
  },
  {
    id: "2", slug: "nit-trichy", name: "NIT Trichy",
    city: "Tiruchirappalli", state: "Tamil Nadu", nirfRank: 8,
    avgPackage: 15.2, minFee: 155000,
  },
  {
    id: "3", slug: "jadavpur-university", name: "Jadavpur University",
    city: "Kolkata", state: "West Bengal", nirfRank: 12,
    avgPackage: 12.5, minFee: 25000,
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${(err as Error).message}`);
    process.exitCode = 1;
  }
}

// ── Test Suite ───────────────────────────────────────────────────────────────

console.log("\nScoring Engine Tests\n");

// ── Edge Case 1: Equal weights (1/3 each) ────────────────────────────────────
runTest("Edge Case 1 — equal weights produce deterministic ranked output", () => {
  const weights: WeightInput = { placement: 1 / 3, fees: 1 / 3, location: 1 / 3 };
  const results = scoreColleges(colleges, weights);

  // Must return all colleges
  assert.equal(results.length, 3, "Should return all 3 colleges");

  // Scores must be between 0 and 100
  for (const r of results) {
    assert.ok(r.score >= 0 && r.score <= 100, `Score ${r.score} out of 0-100 range`);
  }

  // Results must be sorted descending by score
  for (let i = 0; i < results.length - 1; i++) {
    assert.ok(
      results[i].score >= results[i + 1].score,
      `Results not sorted: ${results[i].score} < ${results[i + 1].score}`
    );
  }

  // Deterministic: run twice, same order
  const results2 = scoreColleges(colleges, weights);
  assert.deepEqual(
    results.map((r) => r.id),
    results2.map((r) => r.id),
    "Results should be deterministic"
  );
});

// ── Edge Case 2: Single weight = 100% (placement only) ───────────────────────
runTest("Edge Case 2 — single weight 100% placement ranks by avg package only", () => {
  const weights: WeightInput = { placement: 1.0, fees: 0, location: 0 };
  const results = scoreColleges(colleges, weights);

  // IIT Bombay (27.5 LPA) must be #1
  assert.equal(results[0].id, "1", "IIT Bombay should be #1 with highest package");

  // NIT Trichy (15.2 LPA) must be #2
  assert.equal(results[1].id, "2", "NIT Trichy should be #2");

  // Jadavpur (12.5 LPA) must be #3
  assert.equal(results[2].id, "3", "Jadavpur should be #3 with lowest package");

  // Top college should have score = 100
  assert.equal(results[0].score, 100, "Top placement college should score 100");

  // Bottom college should score 0
  assert.equal(results[results.length - 1].score, 0, "Bottom placement college should score 0");
});

// ── Edge Case 3: Extreme fee range — fees 100% weight ───────────────────────
runTest("Edge Case 3 — extreme fee range with 100% fees weight ranks cheapest first", () => {
  const weights: WeightInput = { placement: 0, fees: 1.0, location: 0 };
  const results = scoreColleges(colleges, weights);

  // Jadavpur (₹25,000) must be #1 (cheapest = best when fees=100%)
  assert.equal(results[0].id, "3", "Jadavpur (cheapest) should be #1 with fees-only weight");

  // IIT Bombay (₹2,20,000) must be #3 (most expensive = worst)
  assert.equal(results[results.length - 1].id, "1", "IIT Bombay (costliest) should be last");

  // Top college scores 100
  assert.equal(results[0].score, 100, "Cheapest college should score 100");
});

// ── Edge Case 4: Empty college list ──────────────────────────────────────────
runTest("Edge Case 4 — empty input returns empty array", () => {
  const weights: WeightInput = { placement: 0.6, fees: 0.3, location: 0.1 };
  const results = scoreColleges([], weights);
  assert.equal(results.length, 0, "Empty input should return empty array");
});

// ── Edge Case 5: Weights sum > 1 are normalised ───────────────────────────────
runTest("Edge Case 5 — weights summing to >1 are normalised correctly", () => {
  // 6+3+1 = 10, normalised to 0.6/0.3/0.1
  const weights: WeightInput = { placement: 6, fees: 3, location: 1 };
  const normalResults = scoreColleges(colleges, weights);

  const canonicalWeights: WeightInput = { placement: 0.6, fees: 0.3, location: 0.1 };
  const canonicalResults = scoreColleges(colleges, canonicalWeights);

  assert.deepEqual(
    normalResults.map((r) => r.id),
    canonicalResults.map((r) => r.id),
    "Normalised weights should produce same ranking as canonical 0.6/0.3/0.1"
  );
});

console.log("\n");
