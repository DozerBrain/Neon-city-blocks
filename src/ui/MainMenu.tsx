// src/ui/MainMenu.tsx

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

type Props = {
  bestScore: number;
  onStart: () => void;
  onOpenThemes: () => void;
  onOpenSettings: () => void;
};

const MainMenu: React.FC<Props> = ({
  bestScore,
  onStart,
  onOpenThemes,
  onOpenSettings,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>NEON CITY BLOCK</Text>

      {bestScore > 0 && (
        <Text style={styles.bestText}>BEST: {bestScore}</Text>
      )}

      <View style={styles.buttons}>
        <MenuButton label="PLAY" onPress={onStart} />
        <MenuButton label="THEMES" onPress={onOpenThemes} />
        <MenuButton label="SETTINGS" onPress={onOpenSettings} />
      </View>
    </View>
  );
};

const MenuButton: React.FC<{ label: string; onPress: () => void }> = ({
  label,
  onPress,
}) => (
  <TouchableOpacity style={styles.button} onPress={onPress}>
    <Text style={styles.buttonText}>{label}</Text>
  </TouchableOpacity>
);

export default MainMenu;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#02020A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 3,
    color: "#00E5FF",
    marginBottom: 40,
  },
  bestText: {
    color: "#00E5FF",
    marginBottom: 12,
    fontWeight: "600",
  },
  buttons: {
    width: "100%",
    gap: 16,
  },
  button: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#00E5FF",
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#00E5FF",
    fontWeight: "700",
    letterSpacing: 2,
    fontSize: 16,
  },
});
