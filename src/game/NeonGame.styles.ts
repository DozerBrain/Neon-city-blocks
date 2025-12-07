// src/game/NeonGame.styles.ts
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 2,
  },
  modeChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 2,
  },
  modeText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 8,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: "600",
  },
  scoreValue: {
    fontWeight: "800",
  },
  playWrapper: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  playArea: {
    borderRadius: 24,
    borderWidth: 2,
    overflow: "hidden",
    position: "relative",
  },
  block: {
    position: "absolute",
    borderWidth: 3,
    borderRadius: 4,
    backgroundColor: "transparent",
  },
  platform: {
    position: "absolute",
    height: 10,
    borderWidth: 3,
    borderRadius: 999,
  },
  footer: {
    paddingTop: 8,
    paddingBottom: 120, // space for banner ad later
    alignItems: "center",
  },
  dropButton: {
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 999,
  },
  dropText: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 2,
    color: "#000",
  },
  secondaryButton: {
    marginTop: 10,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
  },
  secondaryText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },
});
