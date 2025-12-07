import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function NeonGame({ onGameOver }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Neon City Bloxx — Game Coming Online</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "#00eaff",
    fontSize: 20,
  },
});
