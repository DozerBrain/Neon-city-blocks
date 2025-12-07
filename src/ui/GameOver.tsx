// src/ui/GameOver.tsx

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

type Props = {
  visible: boolean;
  score: number;
  best: number;
  onRestart: () => void;
  onMenu: () => void;
};

export default function GameOver({ visible, score, best, onRestart, onMenu }: Props) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>GAME OVER</Text>
        <Text style={styles.score}>Score: {score}</Text>
        <Text style={styles.best}>Best: {best}</Text>

        <TouchableOpacity style={styles.button} onPress={onRestart}>
          <Text style={styles.buttonText}>RESTART</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.menuButton]} onPress={onMenu}>
          <Text style={styles.buttonText}>MAIN MENU</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "80%",
    backgroundColor: "#02020A",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#00E5FF",
    padding: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    color: "#00E5FF",
    fontWeight: "bold",
    marginBottom: 16,
  },
  score: {
    fontSize: 18,
    color: "#FFFFFF",
  },
  best: {
    fontSize: 16,
    color: "#888",
    marginBottom: 24,
  },
  button: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#00E5FF",
    alignItems: "center",
    marginBottom: 12,
  },
  menuButton: {
    borderColor: "#FFFFFF",
  },
  buttonText: {
    color: "#00E5FF",
    fontWeight: "bold",
    fontSize: 16,
  },
});
