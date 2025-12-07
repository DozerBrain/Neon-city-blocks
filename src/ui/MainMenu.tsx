// src/ui/MainMenu.tsx

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

type Props = {
  onStart: () => void;
  onThemes: () => void;
  onSettings: () => void;
};

export default function MainMenu({ onStart, onThemes, onSettings }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>NEON CITY BLOXX</Text>

      <TouchableOpacity style={styles.button} onPress={onStart}>
        <Text style={styles.buttonText}>PLAY</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={onThemes}>
        <Text style={styles.buttonText}>THEMES</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={onSettings}>
        <Text style={styles.buttonText}>SETTINGS</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#02020A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 32,
    color: "#00E5FF",
    fontWeight: "bold",
    letterSpacing: 3,
    marginBottom: 40,
  },
  button: {
    width: "80%",
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#00E5FF",
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: {
    color: "#00E5FF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
