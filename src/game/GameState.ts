// src/game/GameState.ts
// Overall game state container

import type { TowerState } from "./TowerManager";
import type { ThemeId } from "./ThemeManager";
import type { DayNightMode } from "./DayNightManager";

export type GameState = {
  score: number;
  best: number;
  tower: TowerState;
  isGameOver: boolean;
  isPaused: boolean;
  currentTheme: ThemeId;
  dayNightMode: DayNightMode;
};

export function withNewScore(state: GameState, score: number): GameState {
  const best = Math.max(state.best, score);
  return { ...state, score, best };
}

export function setGameOver(state: GameState, value: boolean): GameState {
  return { ...state, isGameOver: value };
}

export function setPaused(state: GameState, value: boolean): GameState {
  return { ...state, isPaused: value };
}

export function setTheme(state: GameState, theme: ThemeId): GameState {
  return { ...state, currentTheme: theme };
}

export function setDayNightMode(state: GameState, mode: DayNightMode): GameState {
  return { ...state, dayNightMode: mode };
}
