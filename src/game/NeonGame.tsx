// src/game/NeonGame.tsx

import React from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import type { GameTheme } from "./ThemeManager";
import useNeonGameController, {
  GAME_WIDTH,
  GAME_HEIGHT,
  PLATFORM_Y,
} from "./useNeonGameController";
import { styles } from "./NeonGame.styles";

type Props = {
  onGameOver: (score: number) => void;
  theme: GameTheme;
};

const NeonGame: React.FC<Props> = ({ onGameOver, theme }) => {
  const {
    bg,
    playBg,
    neon,
    isNight,
    score,
    best,
    isGameOver,
    tiltDeg,
    handleToggleMode,
    handleDrop,
    handleRestartLocal,
    towerNode,
    swingNode,
  } = useNeonGameController(theme, onGameOver);

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: neon }]}>
          NEON CITY BLOCK
        </Text>
        <TouchableOpacity
          style={[styles.modeChip, { borderColor: neon }]}
          onPress={handleToggleMode}
        >
          <Text style={[styles.modeText, { color: neon }]}>
            {isNight ? "NIGHT" : "DAY"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Scores */}
      <View style={styles.scoreRow}>
        <Text style={[styles.scoreText, { color: neon }]}>
          SCORE: <Text style={styles.scoreValue}>{score}</Text>
        </Text>
        <Text style={[styles.scoreText, { color: neon }]}>
          BEST: <Text style={styles.scoreValue}>{best}</Text>
        </Text>
      </View>

      {/* Play area */}
      <View style={styles.playWrapper}>
        <Animated.View
          style={[
            styles.playArea,
            {
              width: GAME_WIDTH,
              height: GAME_HEIGHT,
              borderColor: neon,
              backgroundColor: playBg,
              transform: [{ rotate: tiltDeg }],
            },
          ]}
        >
          {/* Tower */}
          {towerNode}

          {/* Platform */}
          <View
            style={[
              styles.platform,
              {
                borderColor: neon,
                width: GAME_WIDTH - 40,
                transform: [
                  { translateX: 20 },
                  { translateY: PLATFORM_Y },
                ],
              },
            ]}
          />

          {/* Swinging / falling block */}
          {swingNode}
        </Animated.View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.dropButton, { backgroundColor: neon }]}
          onPress={handleDrop}
          disabled={isGameOver}
          activeOpacity={0.8}
        >
          <Text style={styles.dropText}>DROP</Text>
        </TouchableOpacity>

        {isGameOver && (
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { borderColor: neon },
            ]}
            onPress={handleRestartLocal}
          >
            <Text
              style={[
                styles.secondaryText,
                { color: neon },
              ]}
            >
              RESTART HERE
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default NeonGame;
