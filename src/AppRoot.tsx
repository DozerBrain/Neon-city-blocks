// src/AppRoot.tsx
import React, { useState } from "react";
import { SafeAreaView, StatusBar, StyleSheet } from "react-native";
import MainMenu from "./ui/MainMenu";
import GameOver from "./ui/GameOver";
import ThemesMenu from "./ui/ThemesMenu";
import Settings from "./ui/Settings";
import NeonGame from "./game/NeonGame";
import {
  DEFAULT_THEME_ID,
  getThemeById,
  type ThemeId,
} from "./game/ThemeManager";

type Screen = "menu" | "game" | "gameover" | "themes" | "settings";

const AppRoot: React.FC = () => {
  const [screen, setScreen] = useState<Screen>("menu");
  const [lastScore, setLastScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  const [themeId, setThemeId] = useState<ThemeId>(DEFAULT_THEME_ID);
  const currentTheme = getThemeById(themeId);

  const handleStart = () => {
    setScreen("game");
  };

  const handleGameOver = (score: number) => {
    setLastScore(score);
    setBestScore((prev) => Math.max(prev, score));
    setScreen("gameover");
  };

  const handleRestart = () => {
    setScreen("game");
  };

  const handleBackToMenu = () => {
    setScreen("menu");
  };

  const openThemes = () => {
    setScreen("themes");
  };

  const openSettings = () => {
    setScreen("settings");
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />
      {screen === "menu" && (
        <MainMenu
          bestScore={bestScore}
          onStart={handleStart}
          onOpenThemes={openThemes}
          onOpenSettings={openSettings}
        />
      )}

      {screen === "game" && (
        <NeonGame onGameOver={handleGameOver} theme={currentTheme} />
      )}

      {screen === "gameover" && (
        <GameOver
          score={lastScore}
          bestScore={bestScore}
          onRestart={handleRestart}
          onMenu={handleBackToMenu}
        />
      )}

      {screen === "themes" && (
        <ThemesMenu
          current={themeId}
          onSelect={(id) => setThemeId(id)}
          onBack={handleBackToMenu}
        />
      )}

      {screen === "settings" && <Settings onBack={handleBackToMenu} />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#02020A",
  },
});

export default AppRoot;
