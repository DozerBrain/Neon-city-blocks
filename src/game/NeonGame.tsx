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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get("window");

// LOCAL PLAY AREA (inside neon frame)
const GAME_WIDTH = SCREEN_WIDTH * 0.9;
const GAME_HEIGHT = SCREEN_HEIGHT * 0.7;

const BLOCK_SIZE = 60;
const PLATFORM_HEIGHT = 10;

// Y positions inside the frame
const SWING_Y = 80;
const BASE_Y = GAME_HEIGHT - 60;

// swing horizontal limits (center of swinging block)
const LEFT_LIMIT = BLOCK_SIZE / 2 + 8;
const RIGHT_LIMIT = GAME_WIDTH - BLOCK_SIZE / 2 - 8;

const DROP_DURATION = 450;
const MAX_TILT_DEG = 14;

type TowerBlock = {
  id: number;
  index: number; // 0 = on platform
  x: number; // center, 0..GAME_WIDTH
};

type Props = {
  onGameOver: (score: number) => void;
  theme: GameTheme;
};

const NeonGame: React.FC<Props> = ({ onGameOver, theme }) => {
  const [blocks, setBlocks] = useState<TowerBlock[]>([
    { id: 0, index: 0, x: GAME_WIDTH / 2 },
  ]);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [isDropping, setIsDropping] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isNight, setIsNight] = useState(true);

  // swing animation
  const swingX = useRef(new Animated.Value(GAME_WIDTH / 2)).current;
  const swingValue = useRef(GAME_WIDTH / 2);
  useEffect(() => {
    const sub = swingX.addListener(({ value }) => {
      swingValue.current = value;
    });
    return () => swingX.removeListener(sub);
  }, [swingX]);

  // falling block
  const fallingY = useRef(new Animated.Value(SWING_Y)).current;
  const fallingX = useRef(GAME_WIDTH / 2);

  // tilt of play area
  const tiltUnit = useRef(new Animated.Value(0)).current; // -1..1
  const tiltDeg = tiltUnit.interpolate({
    inputRange: [-1, 1],
    outputRange: [`-${MAX_TILT_DEG}deg`, `${MAX_TILT_DEG}deg`],
  });

  const swingAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const startSwing = () => {
    swingX.setValue(GAME_WIDTH / 2);

    const makeStep = (to: number) =>
      Animated.timing(swingX, {
        toValue: to,
        duration: 900,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      });

    swingAnimRef.current = Animated.loop(
      Animated.sequence([makeStep(RIGHT_LIMIT), makeStep(LEFT_LIMIT)])
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

  const handleDrop = () => {
    if (isDropping || isGameOver) return;

    setIsDropping(true);
    stopSwing();

    const currentX = swingValue.current;
    fallingX.current = currentX;

    const targetIndex = blocks.length;
    const targetY = BASE_Y - BLOCK_SIZE / 2 - targetIndex * BLOCK_SIZE;

    fallingY.setValue(SWING_Y);

    Animated.timing(fallingY, {
      toValue: targetY,
      duration: DROP_DURATION,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        landBlock(currentX, targetIndex);
      }
    });
  };

  const landBlock = (x: number, index: number) => {
    const top = blocks[blocks.length - 1];
    const dx = x - top.x;
    const missThreshold = BLOCK_SIZE * 0.7;

    if (Math.abs(dx) > missThreshold) {
      triggerGameOver(score);
      return;
    }

    const newBlock: TowerBlock = { id: Date.now(), index, x };
    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);

    const newScore = score + 1;
    setScore(newScore);
    if (newScore > best) setBest(newScore);

    // small tilt based on off-center
    const heightFactor = Math.max(
      0,
      Math.min(1, (newBlocks.length - 4) / 10)
    );
    const offsetFactor = Math.min(1, Math.abs(dx) / missThreshold);
    const direction = dx === 0 ? 0 : dx > 0 ? 1 : -1;
    const targetTilt = direction * heightFactor * offsetFactor;

    Animated.spring(tiltUnit, {
      toValue: targetTilt,
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

    Animated.timing(tiltUnit, {
      toValue: tiltUnit.__getValue() >= 0 ? 1 : -1,
      duration: 400,
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
    setBlocks([{ id: 0, index: 0, x: GAME_WIDTH / 2 }]);
    setScore(0);
    setIsGameOver(false);
    setIsDropping(false);
    tiltUnit.setValue(0);
    swingX.setValue(GAME_WIDTH / 2);
    fallingY.setValue(SWING_Y);
    startSwing();
  };

  // theme colors
  const bg = isNight ? theme.bgNight : theme.bgDay;
  const playBg = isNight ? theme.playBgNight : theme.playBgDay;
  const neon = theme.neon;

  const renderTower = () =>
    blocks.map((block) => {
      const y = BASE_Y - BLOCK_SIZE / 2 - block.index * BLOCK_SIZE;

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
                { translateY: y - BLOCK_SIZE / 2 },
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
                translateX: Animated.subtract(swingX, BLOCK_SIZE / 2),
              },
              { translateY: SWING_Y },
            ],
          ]}
        />
      );
    };
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: neon }]}>NEON CITY BLOCK</Text>
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

      {/* Play Area */}
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
          {renderTower()}

          {/* Platform (corner-to-corner-ish) */}
          <View
            style={[
              styles.platform,
              {
                borderColor: neon,
                width: GAME_WIDTH - 40,
                transform: [{ translateX: 20 }, { translateY: BASE_Y }],
              },
            ]}
          />

          {renderSwingingOrFalling()}
        </Animated.View>
      </View>

      {/* Footer (space for ads above system nav) */}
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
            style={[styles.secondaryButton, { borderColor: neon }]}
            onPress={handleRestartLocal}
          >
            <Text style={[styles.secondaryText, { color: neon }]}>
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
