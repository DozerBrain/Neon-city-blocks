// src/ui/GameOver.tsx

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

type Props = {
  score: number;
  bestScore: number;
  onRestart: () => void;
  onMenu: () => void;
};

const GameOver: React.FC<Props> = ({
  score,
  bestScore,
  onRestart,
  onMenu,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>GAME OVER</Text>
      <Text style={styles.score}>SCORE: {score}</Text>
      <Text style={styles.score}>BEST: {bestScore}</Text>

      <TouchableOpacity style={styles.buttonPrimary} onPress={onRestart}>
        <Text style={styles.buttonPrimaryText}>RETRY</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonSecondary} onPress={onMenu}>
        <Text style={styles.buttonSecondaryText}>MENU</Text>
      </TouchableOpacity>
    </View>
  );
};

export default GameOver;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#02020A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    color: "#00E5FF",
    fontWeight: "900",
    marginBottom: 24,
  },
  score: {
    color: "#FFFFFF",
    fontSize: 18,
    marginBottom: 4,
  },
  buttonPrimary: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 40,
    backgroundColor: "#00E5FF",
    borderRadius: 999,
  },
  buttonPrimaryText: {
    color: "#000",
    fontWeight: "800",
    letterSpacing: 2,
  },
  buttonSecondary: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#00E5FF",
  },
  buttonSecondaryText: {
    color: "#00E5FF",
    fontWeight: "700",
    letterSpacing: 1,
  },
});
