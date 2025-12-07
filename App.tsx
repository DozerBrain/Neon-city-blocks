import React from "react";
import { View, StyleSheet } from "react-native";
import AppRoot from "./src/AppRoot";

const App: React.FC = () => {
  return (
    <View style={styles.container}>
      <AppRoot />
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
