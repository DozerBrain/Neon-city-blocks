// src/ui/ThemesMenu.tsx

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { THEMES, type ThemeId } from "../game/ThemeManager";

type Props = {
  current: ThemeId;
  onSelect: (id: ThemeId) => void;
  onBack: () => void;
};

export default function ThemesMenu({ current, onSelect, onBack }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>THEMES</Text>

      <FlatList
        data={THEMES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const selected = item.id === current;
          return (
            <TouchableOpacity
              style={[styles.themeRow, selected && styles.themeRowSelected]}
              onPress={() => onSelect(item.id)}
            >
              <View style={[styles.colorDot, { backgroundColor: item.neon }]} />
              <Text style={styles.themeName}>{item.name}</Text>
              {selected && <Text style={styles.selectedLabel}>SELECTED</Text>}
            </TouchableOpacity>
          );
        }}
      />

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
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A2A",
  },
  themeRowSelected: {
    backgroundColor: "rgba(0,229,255,0.08)",
  },
  colorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 12,
  },
  themeName: {
    color: "#FFFFFF",
    fontSize: 16,
    flex: 1,
  },
  selectedLabel: {
    color: "#00E5FF",
    fontSize: 12,
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
