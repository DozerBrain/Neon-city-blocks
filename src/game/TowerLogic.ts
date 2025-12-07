// src/game/TowerLogic.ts

// Size of each block
export const BLOCK_SIZE = 60;

// One block in the tower
export type TowerBlock = {
  id: number;
  level: number; // 0 = sitting on the platform, 1 = 1st block above, etc.
  x: number;     // center X in play-area coordinates
};

// Create the initial tower with one base block in the middle
export function createInitialTower(centerX: number): TowerBlock[] {
  return [
    {
      id: 0,
      level: 0,
      x: centerX,
    },
  ];
}

// Given the platform Y and the block level, return the TOP Y for the block
// This is used directly as translateY in the styles.
export function getBlockTopY(platformY: number, level: number): number {
  // level 0: top = platformY - 1*BLOCK_SIZE
  // level 1: top = platformY - 2*BLOCK_SIZE
  return platformY - (level + 1) * BLOCK_SIZE;
}

// Try to land a block at dropX.
// - If we miss too far -> miss = true
// - If we hit -> we ADD a new block at the REAL dropX (no snapping to center)
export function landBlock(
  blocks: TowerBlock[],
  dropX: number
): { miss: boolean; blocks: TowerBlock[]; dx: number } {
  const top = blocks[blocks.length - 1];
  const dx = dropX - top.x;
  const missThreshold = BLOCK_SIZE * 0.7;

  // Too far from the tower -> miss
  if (Math.abs(dx) > missThreshold) {
    return { miss: true, blocks, dx };
  }

  // Hit -> ADD at the REAL drop position (NO snapping)
  const newBlock: TowerBlock = {
    id: Date.now(),
    level: top.level + 1,
    x: dropX,
  };

  return {
    miss: false,
    blocks: [...blocks, newBlock],
    dx,
  };
}

// Update score and best
export function updateScore(score: number, best: number) {
  const newScore = score + 1;
  return {
    score: newScore,
    best: Math.max(best, newScore),
  };
}

// Compute how much the frame should tilt based on
// - tower height
// - how off-center the last block was (dx)
export function computeTilt(towerHeight: number, dx: number): number {
  const missThreshold = BLOCK_SIZE * 0.7;

  // Start tilting only after a few blocks
  const heightFactor = clamp01((towerHeight - 4) / 10); // 0..1
  const offsetFactor = clamp01(Math.abs(dx) / missThreshold); // 0..1
  const direction = dx === 0 ? 0 : dx > 0 ? 1 : -1; // -1 left, 1 right

  // Final tilt in logical -1..1 space (useNeonGameController maps it to degrees)
  return direction * heightFactor * offsetFactor;
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}
