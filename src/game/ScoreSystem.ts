// src/game/ScoreSystem.ts
// Small functions to calculate score for each successful drop

/**
 * More precise drops → more points.
 * Offset is how far the block center is from perfect alignment.
 */
export function scoreForPlacement(offset: number, blockSize: number, combo: number): number {
  const accuracy = Math.max(0, 1 - Math.abs(offset) / blockSize); // 0..1

  // base score 1-5 depending on accuracy
  const base = 1 + Math.round(accuracy * 4);

  // tiny combo multiplier (1x, 1.1x, 1.2x...)
  const comboMultiplier = 1 + Math.min(combo, 10) * 0.1;

  return Math.round(base * comboMultiplier);
}
