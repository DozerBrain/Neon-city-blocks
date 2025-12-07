// src/game/TowerLogic.ts

export const BLOCK_SIZE = 60;

// Single tower block
export type TowerBlock = {
  id: number;
  level: number; // 0 = base on the platform
  x: number;     // center X in game coords
};

// how far you can miss before it's a fail
const MISS_THRESHOLD = BLOCK_SIZE * 0.7;

// ----- CREATE INITIAL TOWER -----
export function createInitialTower(centerX: number): TowerBlock[] {
  return [
    {
      id: 0,
      level: 0,
      x: centerX,
    },
  ];
}

// ----- GEOMETRY HELPERS -----
export function getBlockTopY(platformY: number, level: number): number {
  // top of level 0 block sits exactly one BLOCK_SIZE above platform
  return platformY - BLOCK_SIZE - level * BLOCK_SIZE;
}

// ----- LANDING RESULT TYPE -----
export type LandResult = {
  blocks: TowerBlock[];
  dx: number;   // horizontal offset from previous top block
  miss: boolean;
};

// ----- LAND BLOCK LOGIC -----
// IMPORTANT: this is where we *keep* the dropX so it doesn't snap to center
export function landBlock(
  currentBlocks: TowerBlock[],
  dropX: number
): LandResult {
  const top = currentBlocks[currentBlocks.length - 1];
  const dx = dropX - top.x;

  // Miss → tell caller it's a fail, don't change blocks
  if (Math.abs(dx) > MISS_THRESHOLD) {
    return {
      blocks: currentBlocks,
      dx,
      miss: true,
    };
  }

  const newBlock: TowerBlock = {
    id: Date.now(),
    level: top.level + 1,
    x: dropX, // ← KEY: use the actual drop position, not top.x
  };

  return {
    blocks: [...currentBlocks, newBlock],
    dx,
    miss: false,
  };
}

// ----- SCORE HELPERS -----
export type ScoreState = {
  score: number;
  best: number;
};

export function updateScore(score: number, best: number): ScoreState {
  const newScore = score + 1;
  const newBest = Math.max(best, newScore);
  return { score: newScore, best: newBest };
}

// ----- TILT COMPUTATION -----
// returns value in [-1, 1], controller turns that into degrees
export function computeTilt(height: number, dx: number): number {
  const TILT_TRIGGER_HEIGHT = 4; // when tower tall enough
  const heightFactor = Math.max(
    0,
    Math.min(1, (height - TILT_TRIGGER_HEIGHT) / 10)
  );
  const offsetFactor = Math.min(1, Math.abs(dx) / MISS_THRESHOLD);
  const direction = dx === 0 ? 0 : dx > 0 ? 1 : -1;

  return direction * heightFactor * offsetFactor; // -1..1
}
