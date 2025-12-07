// src/game/DayNightManager.ts
// Handles day / night / auto mode

import type { Theme } from "./ThemeManager";

export type DayNightMode = "day" | "night" | "auto";

export function toggleDayNight(current: DayNightMode): DayNightMode {
  if (current === "day") return "night";
  if (current === "night") return "auto";
  return "day";
}

/**
 * Given a theme + mode, return actual colors to use in UI.
 * (Later "auto" can follow real clock; now we just treat it as night).
 */
export function getColorsForMode(theme: Theme, mode: DayNightMode) {
  const isNight = mode !== "day";
  return {
    background: isNight ? theme.bgNight : theme.bgDay,
    neon: theme.neon,
    ground: theme.groundFill,
  };
}
