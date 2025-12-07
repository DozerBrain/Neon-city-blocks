import React, { useState } from "react";
import MainMenu from "./ui/MainMenu";
import GameOver from "./ui/GameOver";
import NeonGame from "./game/NeonGame";

export type Screen = "menu" | "game" | "gameover";

export default function AppRoot() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [lastScore, setLastScore] = useState(0);

  const startGame = () => setScreen("game");

  const endGame = (score: number) => {
    setLastScore(score);
    setScreen("gameover");
  };

  const returnToMenu = () => setScreen("menu");

  if (screen === "menu") return <MainMenu onStart={startGame} />;
  if (screen === "game")
    return <NeonGame onGameOver={endGame} />;

  return <GameOver score={lastScore} onRestart={startGame} onMenu={returnToMenu} />;
}
