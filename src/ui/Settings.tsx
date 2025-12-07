// src/ui/Settings.tsx

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch } from "react-native";
import type { DayNightMode } from "../game/DayNightManager";

type Props = {
  soundEnabled: boolean;
  onToggleSound: () => void;
  dayNightMode: DayNightMode;
  onCycleDayNight: () => void;
  onBack: () => void;
};

export default function Settings({
  soundEnabled,
  onToggleSound,
  dayNightMode,
  onCycleDayNight,
  onBack,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>SETTINGS</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Sound</Text>
        <Switch value={soundEnabled} onValueChange={onToggleSound} />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Day / Night</Text>
        <TouchableOpacity style={styles.modeButton} onPress={onCycleDayNight}>
          <Text style={styles.modeText}>{dayNightMode.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>BACK</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#02020A",
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 26,
    color: "#00E5FF",
    fontWeight: "bold",
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  label: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
  },
  modeButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#00E5FF",
  },
  modeText: {
    color: "#00E5FF",
    fontWeight: "bold",
  },
  backButton: {
    marginTop: 24,
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#00E5FF",
  },
  backText: {
    color: "#00E5FF",
    fontWeight: "bold",
  },
});
