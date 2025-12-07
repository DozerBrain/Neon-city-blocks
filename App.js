import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import AppRoot from "./src/AppRoot";

export default function App() {
  return (
    <View style={styles.container}>
      <AppRoot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
