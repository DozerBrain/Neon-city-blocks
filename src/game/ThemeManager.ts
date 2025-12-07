// src/game/ThemeManager.ts
// Manages visual themes (City, Desert, Beach, Jungle, etc.)

export type ThemeId = "city" | "desert" | "beach" | "jungle";

export type Theme = {
  id: ThemeId;
  name: string;
  bgNight: string;
  bgDay: string;
  neon: string;
  groundFill: string;
};

export const THEMES: Theme[] = [
  {
    id: "city",
    name: "Neon City",
    bgNight: "#02020A",
    bgDay: "#1A1B2F",
    neon: "#00E5FF",
    groundFill: "#041821",
  },
  {
    id: "desert",
    name: "Neon Desert",
    bgNight: "#1B0B19",
    bgDay: "#3C2133",
    neon: "#FF9F1C",
    groundFill: "#663F2F",
  },
  {
    id: "beach",
    name: "Neon Beach",
    bgNight: "#031926",
    bgDay: "#145374",
    neon: "#00FFF5",
    groundFill: "#F4D35E",
  },
  {
    id: "jungle",
    name: "Neon Jungle",
    bgNight: "#01110A",
    bgDay: "#063F2E",
    neon: "#35FF69",
    groundFill: "#024731",
  },
];

export function getTheme(id: ThemeId): Theme {
  const found = THEMES.find((t) => t.id === id);
  return found ?? THEMES[0];
}

export function getNextTheme(current: ThemeId): ThemeId {
  const index = THEMES.findIndex((t) => t.id === current);
  if (index === -1) return THEMES[0].id;
  return THEMES[(index + 1) % THEMES.length].id;
}
