// src/game/ThemeManager.ts

export type ThemeId = "neon-blue" | "neon-pink";

export type GameTheme = {
  id: ThemeId;
  name: string;
  neon: string;      // main neon color
  bgNight: string;
  playBgNight: string;
  bgDay: string;
  playBgDay: string;
};

export const THEMES: GameTheme[] = [
  {
    id: "neon-blue",
    name: "Neon Blue",
    neon: "#00E5FF",
    bgNight: "#02020A",
    playBgNight: "#05050F",
    bgDay: "#F4F7FF",
    playBgDay: "#FFFFFF",
  },
  {
    id: "neon-pink",
    name: "Neon Pink",
    neon: "#FF2DCB",
    bgNight: "#160012",
    playBgNight: "#23001D",
    bgDay: "#FFF4FB",
    playBgDay: "#FFFFFF",
  },
];

export const DEFAULT_THEME_ID: ThemeId = "neon-blue";

export function getThemeById(id: ThemeId): GameTheme {
  const found = THEMES.find((t) => t.id === id);
  return found ?? THEMES[0];
}
