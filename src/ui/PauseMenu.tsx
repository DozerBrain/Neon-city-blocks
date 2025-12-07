// src/ui/PauseMenu.tsx

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

type Props = {
  visible: boolean;
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
};

export default function PauseMenu({ visible, onResume, onRestart, onMenu }: Props) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>PAUSED</Text>

        <TouchableOpacity style={styles.button} onPress={onResume}>
          <Text style={styles.buttonText}>RESUME</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={onRestart}>
          <Text style={styles.buttonText}>RESTART</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={onMenu}>
          <Text style={styles.buttonText}>MAIN MENU</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "75%",
    backgroundColor: "#02020A",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#00E5FF",
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    color: "#00E5FF",
    fontWeight: "bold",
    marginBottom: 18,
  },
  button: {
    width: "100%",
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#00E5FF",
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "#00E5FF",
    fontWeight: "bold",
    fontSize: 15,
  },
});
