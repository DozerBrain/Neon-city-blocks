import React, { useState } from "react";
import { SafeAreaView, StatusBar, StyleSheet } from "react-native";
import MainMenu from "./ui/MainMenu";
import GameOver from "./ui/GameOver";
import NeonGame from "./game/NeonGame";

type Screen = "menu" | "game" | "gameover";

const AppRoot: React.FC = () => {
  const [screen, setScreen] = useState<Screen>("menu");
  const [lastScore, setLastScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);

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

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />
      {screen === "menu" && (
        <MainMenu bestScore={bestScore} onStart={handleStart} />
      )}
      {screen === "game" && <NeonGame onGameOver={handleGameOver} />}
      {screen === "gameover" && (
        <GameOver
          score={lastScore}
          bestScore={bestScore}
          onRestart={handleRestart}
          onMenu={handleBackToMenu}
        />
      )}
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
