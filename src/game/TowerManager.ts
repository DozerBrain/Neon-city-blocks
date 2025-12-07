// src/game/TowerManager.ts
// Handles the tower array and how it grows

import type { Block } from "./BlockManager";
import { createBlock, BLOCK_SIZE } from "./BlockManager";

export type TowerState = {
  blocks: Block[];
};

export function createInitialTower(baseCenterX: number, baseBottomY: number): TowerState {
  // base block sits on the platform, we store by top-left y (so bottomY - BLOCK_SIZE)
  const baseBlock = createBlock(0, baseCenterX, baseBottomY - BLOCK_SIZE);
  return { blocks: [baseBlock] };
}

export function getTopBlock(tower: TowerState): Block {
  return tower.blocks[tower.blocks.length - 1];
}

export function getHeight(tower: TowerState): number {
  return tower.blocks.length;
}

/**
 * Adds a new block on top of the tower.
 * Y is computed automatically above current top.
 */
export function stackBlock(tower: TowerState, centerX: number): TowerState {
  const top = getTopBlock(tower);
  const id = top.id + 1;
  const newBlockY = top.y - BLOCK_SIZE; // one block above
  const newBlock = createBlock(id, centerX, newBlockY);

  return {
    blocks: [...tower.blocks, newBlock],
  };
}
