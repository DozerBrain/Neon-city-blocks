// src/game/NeonGame.tsx

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import type { GameTheme } from "./ThemeManager";
import {
  BLOCK_SIZE,
  createInitialTower,
  landBlock,
  getBlockTopY,
  updateScore,
  computeTilt,
  type TowerBlock,
} from "./TowerLogic";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get("window");

// Inner game frame
const GAME_WIDTH = SCREEN_WIDTH * 0.9;
const GAME_HEIGHT = SCREEN_HEIGHT * 0.7;

// Platform vertical position inside the frame
const PLATFORM_Y = GAME_HEIGHT - 60;

// Swinging block height inside the frame
const SWING_Y = 80;

// Left/right limits for swinging block center
const LEFT_LIMIT = BLOCK_SIZE / 2 + 8;
const RIGHT_LIMIT = GAME_WIDTH - BLOCK_SIZE / 2 - 8;

// Anim tuning
const DROP_DURATION = 450;
const SWING_DURATION = 900;
const MAX_TILT_DEG = 14;

type Props = {
  onGameOver: (score: number) => void;
  theme: GameTheme;
};

const NeonGame: React.FC<Props> = ({ onGameOver, theme }) => {
  const centerX = GAME_WIDTH / 2;

  // Core state
  const [blocks, setBlocks] = useState<TowerBlock[]>(
    createInitialTower(centerX)
  );
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [isDropping, setIsDropping] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isNight, setIsNight] = useState(true);

  // Swing animation (center X in game coords)
  const swingX = useRef(new Animated.Value(centerX)).current;
  const swingValue = useRef(centerX);
  useEffect(() => {
    const sub = swingX.addListener(({ value }) => {
      swingValue.current = value;
    });
    return () => swingX.removeListener(sub);
  }, [swingX]);

  // Falling block (Y animated, X stored)
  const fallingY = useRef(new Animated.Value(SWING_Y)).current;
  const fallingX = useRef(centerX);

  // Frame tilt animation
  const tiltUnit = useRef(new Animated.Value(0)).current; // -1..1
  const tiltDeg = tiltUnit.interpolate({
    inputRange: [-1, 1],
    outputRange: [`-${MAX_TILT_DEG}deg`, `${MAX_TILT_DEG}deg`],
  });
  const tiltValue = useRef(0);
  useEffect(() => {
    const sub = tiltUnit.addListener(({ value }) => {
      tiltValue.current = value;
    });
    return () => tiltUnit.removeListener(sub);
  }, [tiltUnit]);

  const swingAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const startSwing = () => {
    // Start from center
    swingX.setValue(centerX);

    const makeStep = (to: number) =>
      Animated.timing(swingX, {
        toValue: to,
        duration: SWING_DURATION,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      });

    swingAnimRef.current = Animated.loop(
      Animated.sequence([
        makeStep(RIGHT_LIMIT),
        makeStep(LEFT_LIMIT),
      ])
    );
    swingAnimRef.current.start();
  };

  const stopSwing = () => {
    if (swingAnimRef.current) {
      swingAnimRef.current.stop();
      swingAnimRef.current = null;
    }
  };

  useEffect(() => {
    startSwing();
    return () => stopSwing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- INPUT: DROP ----------
  const handleDrop = () => {
    if (isDropping || isGameOver) return;

    setIsDropping(true);
    stopSwing();

    const dropX = swingValue.current; // current swing center
    fallingX.current = dropX;

    const targetIndex = blocks.length;
    const targetTopY = getBlockTopY(PLATFORM_Y, targetIndex);

    fallingY.setValue(SWING_Y);

    Animated.timing(fallingY, {
      toValue: targetTopY,
      duration: DROP_DURATION,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      handleLand(dropX);
    });
  };

  // ---------- GAME LOGIC AFTER DROP ----------
  const handleLand = (dropX: number) => {
    const result = landBlock(blocks, dropX);

    if (result.miss) {
      triggerGameOver(score);
      return;
    }

    setBlocks(result.blocks);

    const updatedScore = updateScore(score, best);
    setScore(updatedScore.score);
    setBest(updatedScore.best);

    // Compute new tilt
    const tiltTarget = computeTilt(result.blocks.length, result.dx);
    Animated.spring(tiltUnit, {
      toValue: tiltTarget,
      friction: 7,
      tension: 40,
      useNativeDriver: true,
    }).start();

    setIsDropping(false);
    startSwing();
  };

  const triggerGameOver = (finalScore: number) => {
    setIsGameOver(true);
    stopSwing();

    const direction = tiltValue.current >= 0 ? 1 : -1;

    Animated.timing(tiltUnit, {
      toValue: direction,
      duration: 350,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      onGameOver(finalScore);
    });
  };

  const handleToggleMode = () => {
    setIsNight((prev) => !prev);
  };

  const handleRestartLocal = () => {
    setBlocks(createInitialTower(centerX));
    setScore(0);
    setIsGameOver(false);
    setIsDropping(false);
    tiltUnit.setValue(0);
    swingX.setValue(centerX);
    fallingY.setValue(SWING_Y);
    startSwing();
  };

  // Theme colors
  const bg = isNight ? theme.bgNight : theme.bgDay;
  const playBg = isNight ? theme.playBgNight : theme.playBgDay;
  const neon = theme.neon;

  // ---------- RENDER HELPERS ----------
  const renderTower = () =>
    blocks.map((block) => {
      const topY = getBlockTopY(PLATFORM_Y, block.level);

      return (
        <View
          key={block.id}
          style={[
            styles.block,
            {
              borderColor: neon,
              width: BLOCK_SIZE,
              height: BLOCK_SIZE,
              transform: [
                { translateX: block.x - BLOCK_SIZE / 2 },
                { translateY: topY },
              ],
            },
          ]}
        />
      );
    });

  const renderSwingingOrFalling = () => {
    const baseStyle = {
      borderColor: neon,
      width: BLOCK_SIZE,
      height: BLOCK_SIZE,
    };

    if (isDropping) {
      return (
        <Animated.View
          style={[
            styles.block,
            baseStyle,
            {
              transform: [
                { translateX: fallingX.current - BLOCK_SIZE / 2 },
                { translateY: fallingY },
              ],
            },
          ]}
        />
      );
    }

    return (
      <Animated.View
        style={[
          styles.block,
          baseStyle,
          {
            transform: [
              {
                translateX: Animated.subtract(
                  swingX,
                  BLOCK_SIZE / 2
                ),
              },
              { translateY: SWING_Y },
            ],
          },
        ]}
      />
    );
  };

  // ---------- RENDER MAIN ----------
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
          {renderTower()}

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

          {/* Swing / fall block */}
          {renderSwingingOrFalling()}
        </Animated.View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.dropButton, { backgroundColor: neon }]}
          onPress={handleDrop}
          disabled={isDropping || isGameOver}
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

const styles = StyleSheet.create({
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
    height: PLATFORM_HEIGHT,
    borderWidth: 3,
    borderRadius: 999,
  },
  footer: {
    paddingTop: 8,
    paddingBottom: 120,
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
