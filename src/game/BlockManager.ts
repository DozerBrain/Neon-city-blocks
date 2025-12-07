// src/game/BlockManager.ts
// Low-level helpers for blocks in Neon City Bloxx

export const BLOCK_SIZE = 60;

// How much the tower can be off-center before we call it a fail
export const MAX_OFFSET_RATIO = 0.6; // 60% of block width

export type Block = {
  id: number;
  x: number; // center X
  y: number; // top Y
};

export function createBlock(id: number, x: number, y: number): Block {
  return { id, x, y };
}

/**
 * Returns the horizontal offset between top of tower and falling block.
 * Positive = falling block is to the RIGHT.
 */
export function getHorizontalOffset(top: Block, falling: Block): number {
  return falling.x - top.x;
}

/**
 * Returns true if the falling block placement is "safe" (tower survives).
 */
export function isPlacementSafe(offset: number): boolean {
  const maxOffset = BLOCK_SIZE * MAX_OFFSET_RATIO;
  return Math.abs(offset) <= maxOffset;
}
