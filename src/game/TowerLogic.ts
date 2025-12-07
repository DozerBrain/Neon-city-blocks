// src/game/TowerLogic.ts

export const BLOCK_SIZE = 60;

// One block in the tower
export type TowerBlock = {
  id: number;
  level: number; // 0 = sitting on platform
  x: number;     // center position inside the play area (0..GAME_WIDTH)
};

// How far from previous center we still allow a hit
const MISS_THRESHOLD_MULTIPLIER = 0.7;

/**
 * Initial tower: single block on the platform center.
 */
export function createInitialTower(centerX: number): TowerBlock[] {
  return [
    {
      id: 0,
      level: 0,
      x: centerX,
    },
  ];
}

/**
 * Compute where a new block lands relative to the tower.
 * Returns:
 *  - updated blocks if hit
 *  - miss = true if we should trigger game over
 *  - dx = horizontal difference from previous block
 */
export function landBlock(
  currentBlocks: TowerBlock[],
  dropX: number
): { blocks: TowerBlock[]; miss: boolean; dx: number } {
  const top = currentBlocks[currentBlocks.length - 1];
  const dx = dropX - top.x;
  const missThreshold = BLOCK_SIZE * MISS_THRESHOLD_MULTIPLIER;

  if (Math.abs(dx) > missThreshold) {
    return {
      blocks: currentBlocks,
      miss: true,
      dx,
    };
  }

  const newBlock: TowerBlock = {
    id: Date.now(),
    level: currentBlocks.length,
    x: dropX,
  };

  return {
    blocks: [...currentBlocks, newBlock],
    miss: false,
    dx,
  };
}

/**
 * Y position (top) for a given block level inside the play area.
 */
export function getBlockTopY(platformY: number, level: number): number {
  // Platform is at platformY, block sits above it.
  return platformY - BLOCK_SIZE * (level + 1);
}

/**
 * Score + best score update after a successful drop.
 */
export function updateScore(
  currentScore: number,
  currentBest: number
): { score: number; best: number } {
  const score = currentScore + 1;
  return {
    score,
    best: Math.max(currentBest, score),
  };
}

/**
 * Compute tilt value in range -1..1 based on tower height and how off-center the drop is.
 */
export function computeTilt(
  blockCount: number,
  dx: number
): number {
  const missThreshold = BLOCK_SIZE * MISS_THRESHOLD_MULTIPLIER;

  // Start caring about tilt after a few blocks
  const heightFactor = Math.max(0, Math.min(1, (blockCount - 4) / 10));
  const offsetFactor = Math.min(1, Math.abs(dx) / missThreshold);
  const direction = dx === 0 ? 0 : dx > 0 ? 1 : -1;

  return direction * heightFactor * offsetFactor; // -1..1
}
