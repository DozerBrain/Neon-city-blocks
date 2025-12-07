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

// ---- CONSTANTS ----
const BLOCK_SIZE = 60;
const PLATFORM_HEIGHT = 10;

// Play area box (frame)
const PLAY_WIDTH = SCREEN_WIDTH * 0.9;
const PLAY_HEIGHT = SCREEN_HEIGHT * 0.7;

// Where blocks stack (inside play area, from bottom up)
const BASE_Y = PLAY_HEIGHT - 40; // center of the bottom block
const START_Y = 110; // start Y for swinging block (center)

// Swing range (how far left/right top block travels)
const SWING_RANGE = PLAY_WIDTH * 0.35;

// Drop speed
const DROP_DURATION = 420;

type TowerBlock = {
  id: number;
  index: number; // 0 = on platform, 1 = above, etc.
  x: number; // center position inside play area
};

type Props = {
  onGameOver: (score: number) => void;
};

const NeonGame: React.FC<Props> = ({ onGameOver }) => {
  // tower state
  const [blocks, setBlocks] = useState<TowerBlock[]>([
    { id: 0, index: 0, x: PLAY_WIDTH / 2 },
  ]);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);

  const [isDropping, setIsDropping] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isNight, setIsNight] = useState(true);

  // ---- S W I N G ----
  // value from -SWING_RANGE .. +SWING_RANGE (centered on tower)
  const swingX = useRef(new Animated.Value(0)).current;
  const swingValue = useRef(0);

  useEffect(() => {
    const sub = swingX.addListener(({ value }) => {
      swingValue.current = value;
    });
    return () => swingX.removeListener(sub);
  }, [swingX]);

  const swingAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const startSwing = () => {
    swingX.setValue(0);
    const left = -SWING_RANGE;
    const right = SWING_RANGE;

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

  // ---- D R O P P I N G   B L O C K ----
  const fallingY = useRef(new Animated.Value(START_Y)).current;
  const fallingX = useRef(PLAY_WIDTH / 2); // center inside play area

  const handleDrop = () => {
    if (isDropping || isGameOver) return;

    setIsDropping(true);

    // stop swing but keep last value
    stopSwing();

    const towerCenterX = PLAY_WIDTH / 2;
    const offset = swingValue.current; // -SWING_RANGE..+SWING_RANGE
    const currentX = towerCenterX + offset;

    fallingX.current = currentX;

    const targetIndex = blocks.length;
    const targetY = BASE_Y - targetIndex * BLOCK_SIZE;

    fallingY.setValue(START_Y);

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

  const landBlock = (xCenter: number, index: number) => {
    const top = blocks[blocks.length - 1];
    const dx = xCenter - top.x;
    const missThreshold = BLOCK_SIZE * 0.7;

    // MISS -> game over
    if (Math.abs(dx) > missThreshold) {
      doGameOver(score);
      return;
    }

    const newBlock: TowerBlock = {
      id: Date.now(),
      index,
      x: xCenter,
    };

    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);

    const newScore = score + 1;
    setScore(newScore);
    if (newScore > best) setBest(newScore);

    // continue game
    setIsDropping(false);
    startSwing();
  };

  const doGameOver = (finalScore: number) => {
    setIsGameOver(true);
    stopSwing();

    // small delay so user sees the miss
    setTimeout(() => {
      onGameOver(finalScore);
    }, 250);
  };

  const handleRestartLocal = () => {
    setBlocks([{ id: 0, index: 0, x: PLAY_WIDTH / 2 }]);
    setScore(0);
    setIsDropping(false);
    setIsGameOver(false);
    fallingY.setValue(START_Y);
    swingX.setValue(0);
    startSwing();
  };

  const handleToggleMode = () => {
    setIsNight((prev) => !prev);
  };

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

  // ---- R E N D E R   T O W E R ----
  const renderTower = () =>
    blocks.map((block) => {
      const yCenter = BASE_Y - block.index * BLOCK_SIZE;
      const left = block.x - BLOCK_SIZE / 2;
      const top = yCenter - BLOCK_SIZE / 2;

      return (
        <View
          key={block.id}
          style={[
            styles.block,
            {
              left,
              top,
              width: BLOCK_SIZE,
              height: BLOCK_SIZE,
              borderColor: theme.border,
            },
          ]}
        />
      );
    });

  // ---- R E N D E R   T O P   B L O C K ----
  const renderSwingOrFalling = () => {
    const size = BLOCK_SIZE;

    if (isDropping) {
      return (
        <Animated.View
          style={[
            styles.block,
            {
              width: size,
              height: size,
              borderColor: theme.border,
              transform: [
                { translateX: fallingX.current - size / 2 },
                { translateY: Animated.subtract(fallingY, size / 2) },
              ],
            },
          ]}
        />
      );
    }

    // swinging
    const towerCenterX = PLAY_WIDTH / 2;

    return (
      <Animated.View
        style={[
          styles.block,
          {
            width: size,
            height: size,
            borderColor: theme.border,
            transform: [
              {
                translateX: swingX.interpolate({
                  inputRange: [-SWING_RANGE, SWING_RANGE],
                  outputRange: [
                    towerCenterX - SWING_RANGE - size / 2,
                    towerCenterX + SWING_RANGE - size / 2,
                  ],
                }),
              },
              { translateY: START_Y - size / 2 },
            ],
          },
        ]}
      />
    );
  };

  // Platform: almost full width, centered
  const platformWidth = PLAY_WIDTH * 0.9;

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
        <View
          style={[
            styles.playArea,
            {
              width: PLAY_WIDTH,
              height: PLAY_HEIGHT,
              borderColor: theme.border,
              backgroundColor: theme.playBg,
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
                width: platformWidth,
                borderColor: theme.border,
                left: (PLAY_WIDTH - platformWidth) / 2,
                top: BASE_Y + BLOCK_SIZE / 2 - PLATFORM_HEIGHT / 2,
              },
            ]}
          />

          {/* Top block */}
          {renderSwingOrFalling()}
        </View>
      </View>

      {/* Footer with buttons */}
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
    height: PLATFORM_HEIGHT,
    borderWidth: 3,
    borderRadius: 999,
  },
  footer: {
    paddingBottom: 28, // lifts DROP button a bit
    paddingTop: 8,
    alignItems: "center",
    gap: 10,
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
