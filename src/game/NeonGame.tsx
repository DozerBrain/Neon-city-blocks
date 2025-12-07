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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get("window");

// sizes
const BLOCK_SIZE = 60;
const PLATFORM_HEIGHT = 10;

// vertical layout
const PLAY_TOP = 80;
const PLAY_BOTTOM = SCREEN_HEIGHT * 0.78;

// how many blocks visible before we start pushing the tower down
const MAX_VISIBLE_BLOCKS = 7;

type TowerBlock = {
  id: number;
  index: number; // 0 = sitting on platform
  x: number; // center position
};

type Props = {
  onGameOver: (score: number) => void;
};

const NeonGame: React.FC<Props> = ({ onGameOver }) => {
  const [blocks, setBlocks] = useState<TowerBlock[]>([
    { id: 0, index: 0, x: SCREEN_WIDTH / 2 },
  ]);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [isDropping, setIsDropping] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isNight, setIsNight] = useState(true);

  // ---- SWING / DROP ----
  const swingX = useRef(new Animated.Value(0)).current;
  const swingValue = useRef(0);
  useEffect(() => {
    const sub = swingX.addListener(({ value }) => {
      swingValue.current = value;
    });
    return () => swingX.removeListener(sub);
  }, [swingX]);

  const fallingY = useRef(new Animated.Value(PLAY_TOP + 100)).current;
  const fallingX = useRef(SCREEN_WIDTH / 2);

  // ---- TILT ----
  const tiltUnit = useRef(new Animated.Value(0)).current; // -1..1
  const tiltDeg = tiltUnit.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-14deg", "14deg"],
  });

  const swingAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  // theme
  const theme = isNight
    ? {
        bg: "#02020A",
        text: "#00E5FF",
        playBg: "#05050F",
        border: "#00E5FF",
      }
    : {
        bg: "#F4F7FF",
        text: "#007A8F",
        playBg: "#FFFFFF",
        border: "#00A5C8",
      };

  const playWidth = SCREEN_WIDTH * 0.9;
  const playHeight = SCREEN_HEIGHT * 0.7;
  const centerX = SCREEN_WIDTH / 2;

  // swing range based on play area width
  const SWING_RANGE = playWidth - BLOCK_SIZE * 1.6;

  const startSwing = () => {
    swingX.setValue(0);
    const left = -SWING_RANGE / 2;
    const right = SWING_RANGE / 2;

    const animTo = (to: number) =>
      Animated.timing(swingX, {
        toValue: to,
        duration: 900,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      });

    swingAnimRef.current = Animated.loop(
      Animated.sequence([animTo(right), animTo(left)])
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

  // -------- DROP LOGIC ----------
  const handleDrop = () => {
    if (isDropping || isGameOver) return;

    setIsDropping(true);
    stopSwing();

    // exact X where the block is when you tap
    const baseX = SCREEN_WIDTH / 2;
    const offset = swingValue.current;
    const currentX = baseX + offset;
    fallingX.current = currentX;

    const targetIndex = blocks.length;
    const tallestIndex = targetIndex;
    const yBase = PLAY_BOTTOM - PLATFORM_HEIGHT - BLOCK_SIZE / 2;
    const shift =
      Math.max(0, tallestIndex - MAX_VISIBLE_BLOCKS) * BLOCK_SIZE;

    const targetY = yBase - targetIndex * BLOCK_SIZE + shift;

    // start falling from top area
    fallingY.setValue(PLAY_TOP + BLOCK_SIZE * 1.5);

    Animated.timing(fallingY, {
      toValue: targetY,
      duration: 450,
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
    const missThreshold = BLOCK_SIZE * 0.65;

    // miss → game over
    if (Math.abs(dx) > missThreshold) {
      triggerGameOver(score);
      return;
    }

    const newBlock: TowerBlock = {
      id: Date.now(),
      index,
      x,
    };

    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);

    const newScore = score + 1;
    setScore(newScore);
    if (newScore > best) setBest(newScore);

    // tilt effect (only when tower is tall)
    const heightFactor = Math.max(0, Math.min(1, (newBlocks.length - 3) / 12));
    const offsetFactor = Math.min(1, Math.abs(dx) / missThreshold);
    const direction = dx === 0 ? 0 : dx > 0 ? 1 : -1;
    const targetTilt = direction * heightFactor * offsetFactor; // -1..1

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
    onGameOver(finalScore);
  };

  const handleToggleMode = () => {
    setIsNight((prev) => !prev);
  };

  const handleRestartLocal = () => {
    setBlocks([{ id: 0, index: 0, x: SCREEN_WIDTH / 2 }]);
    setScore(0);
    setIsGameOver(false);
    setIsDropping(false);
    tiltUnit.setValue(0);
    swingX.setValue(0);
    fallingY.setValue(PLAY_TOP + BLOCK_SIZE * 1.5);
    startSwing();
  };

  // ------- RENDER HELPERS --------
  const computeVerticalShift = (maxIndex: number) => {
    return Math.max(0, maxIndex - MAX_VISIBLE_BLOCKS) * BLOCK_SIZE;
  };

  const renderTower = () => {
    const tallestIndex = blocks[blocks.length - 1]?.index ?? 0;
    const yBase = PLAY_BOTTOM - PLATFORM_HEIGHT - BLOCK_SIZE / 2;
    const shift = computeVerticalShift(tallestIndex);

    return blocks.map((block) => {
      const y = yBase - block.index * BLOCK_SIZE + shift;
      const translateX = block.x - BLOCK_SIZE / 2;
      const translateY = y - BLOCK_SIZE / 2;

      return (
        <View
          key={block.id}
          style={[
            styles.block,
            {
              borderColor: theme.border,
              width: BLOCK_SIZE,
              height: BLOCK_SIZE,
              transform: [{ translateX }, { translateY }],
            },
          ]}
        />
      );
    });
  };

  const renderSwingingOrFalling = () => {
    const size = BLOCK_SIZE;
    const baseStyle = {
      borderColor: theme.border,
      width: size,
      height: size,
    };

    const tallestIndex = blocks[blocks.length - 1]?.index ?? 0;
    const yBase = PLAY_BOTTOM - PLATFORM_HEIGHT - BLOCK_SIZE / 2;
    const shift = computeVerticalShift(tallestIndex);

    if (isDropping) {
      // dropping block – its Y is driven by fallingY, X is frozen at tap position
      return (
        <Animated.View
          style={[
            styles.block,
            baseStyle,
            {
              transform: [
                { translateX: fallingX.current - size / 2 },
                { translateY: fallingY },
              ],
            },
          ]}
        />
      );
    }

    // *** FIXED: swing always near the TOP of the play area, not near platform ***
    const swingY = PLAY_TOP + BLOCK_SIZE * 1.5; // constant top path

    return (
      <Animated.View
        style={[
          styles.block,
          baseStyle,
          {
            transform: [
              {
                translateX: swingX.interpolate({
                  inputRange: [-SWING_RANGE / 2, SWING_RANGE / 2],
                  outputRange: [
                    centerX - SWING_RANGE / 2 - size / 2,
                    centerX + SWING_RANGE / 2 - size / 2,
                  ],
                }),
              },
              { translateY: swingY - size / 2 },
            ],
          },
        ]}
      />
    );
  };

  // --------- UI -----------
  const platformWidth = playWidth - 24;
  const tallestIndex = blocks[blocks.length - 1]?.index ?? 0;
  const yBasePlatform = PLAY_BOTTOM - PLATFORM_HEIGHT / 2;
  const shiftPlatform = computeVerticalShift(tallestIndex);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>
          NEON CITY BLOCK
        </Text>
        <TouchableOpacity
          style={[styles.modeChip, { borderColor: theme.text }]}
          onPress={handleToggleMode}
        >
          <Text style={[styles.modeText, { color: theme.text }]}>
            {isNight ? "NIGHT" : "DAY"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Scores */}
      <View style={styles.scoreRow}>
        <Text style={[styles.scoreText, { color: theme.text }]}>
          SCORE: <Text style={styles.scoreValue}>{score}</Text>
        </Text>
        <Text style={[styles.scoreText, { color: theme.text }]}>
          BEST: <Text style={styles.scoreValue}>{best}</Text>
        </Text>
      </View>

      {/* Play area */}
      <View style={styles.playWrapper}>
        <Animated.View
          style={[
            styles.playArea,
            {
              width: playWidth,
              height: playHeight,
              borderColor: theme.border,
              backgroundColor: theme.playBg,
              transform: [{ rotate: tiltDeg }],
            },
          ]}
        >
          {renderTower()}

          {/* Platform – full width */}
          <View
            style={[
              styles.platform,
              {
                borderColor: theme.border,
                width: platformWidth,
                transform: [
                  { translateX: centerX - platformWidth / 2 },
                  { translateY: yBasePlatform + shiftPlatform },
                ],
              },
            ]}
          />

          {renderSwingingOrFalling()}
        </Animated.View>
      </View>

      {/* Bottom buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.dropButton, { backgroundColor: theme.text }]}
          onPress={handleDrop}
          disabled={isDropping || isGameOver}
          activeOpacity={0.8}
        >
          <Text style={styles.dropText}>DROP</Text>
        </TouchableOpacity>

        {isGameOver && (
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.text }]}
            onPress={handleRestartLocal}
          >
            <Text style={[styles.secondaryText, { color: theme.text }]}>
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
    flex: 1,
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
    height: 6,
    borderWidth: 3,
    borderRadius: 999,
  },
  footer: {
    paddingBottom: 24,
    paddingTop: 8,
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
