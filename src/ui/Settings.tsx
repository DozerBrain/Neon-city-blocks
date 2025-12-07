// src/ui/Settings.tsx

import React, { useState } from "react";
import { View, Text, StyleSheet, Switch, TouchableOpacity } from "react-native";

type Props = {
  onBack: () => void;
};

const Settings: React.FC<Props> = ({ onBack }) => {
  const [sound, setSound] = useState(true);
  const [haptics, setHaptics] = useState(true);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SETTINGS</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Sound</Text>
        <Switch value={sound} onValueChange={setSound} />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Haptics</Text>
        <Switch value={haptics} onValueChange={setHaptics} />
      </View>

      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>BACK</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Settings;

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
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  backButton: {
    marginTop: 40,
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
