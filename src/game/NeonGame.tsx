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

// ----- TUNING CONSTANTS -----
const BLOCK_SIZE = 60;
const PLATFORM_HEIGHT = 10;
const SWING_RANGE = SCREEN_WIDTH * 0.3; // total left-right range for swing
const DROP_DURATION = 450;
const TILT_LIMIT = 1.0; // logical tilt; visual is mapped to degrees
const PLAY_TOP = 80;
const PLAY_BOTTOM = SCREEN_HEIGHT * 0.78;

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

  // swing animation
  const swingX = useRef(new Animated.Value(0)).current;
  const swingValue = useRef(0);
  useEffect(() => {
    const sub = swingX.addListener(({ value }) => {
      swingValue.current = value;
    });
    return () => swingX.removeListener(sub);
  }, [swingX]);

  // falling block
  const fallingY = useRef(new Animated.Value(PLAY_TOP + 100)).current;
  const fallingX = useRef(0);

  // tilt animation
  const tiltUnit = useRef(new Animated.Value(0)).current; // -1..1 logical
  const tiltDeg = tiltUnit.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-14deg", "14deg"],
  });

  const swingAnimRef = useRef<Animated.CompositeAnimation | null>(null);

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

  const handleDrop = () => {
    if (isDropping || isGameOver) return;

    setIsDropping(true);
    stopSwing();

    const baseX = SCREEN_WIDTH / 2;
    const offset = swingValue.current;
    const currentX = baseX + offset;
    fallingX.current = currentX;

    const targetIndex = blocks.length;
    const targetY =
      PLAY_BOTTOM - PLATFORM_HEIGHT - BLOCK_SIZE / 2 - targetIndex * BLOCK_SIZE;

    fallingY.setValue(PLAY_TOP + 100);

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
    const missThreshold = BLOCK_SIZE * 0.65;

    // if too far from previous block center -> miss = game over
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

    // tilt grows when tower is tall and placements are off-center
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

    // collapse if tall + big tilt
    if (newBlocks.length > 7 && Math.abs(targetTilt) > TILT_LIMIT) {
      triggerGameOver(newScore);
    } else {
      setIsDropping(false);
      startSwing();
    }
  };

  const triggerGameOver = (finalScore: number) => {
    setIsGameOver(true);
    stopSwing();

    Animated.timing(tiltUnit, {
      toValue: tiltUnit.__getValue() > 0 ? 1 : -1,
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
    setBlocks([{ id: 0, index: 0, x: SCREEN_WIDTH / 2 }]);
    setScore(0);
    setIsGameOver(false);
    setIsDropping(false);
    tiltUnit.setValue(0);
    swingX.setValue(0);
    fallingY.setValue(PLAY_TOP + 100);
    startSwing();
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

  const centerX = SCREEN_WIDTH / 2;
  const playHeight = SCREEN_HEIGHT * 0.7;
  const playWidth = SCREEN_WIDTH * 0.9;

  const renderTower = () =>
    blocks.map((block) => {
      const y =
        PLAY_BOTTOM -
        PLATFORM_HEIGHT -
        BLOCK_SIZE / 2 -
        block.index * BLOCK_SIZE;

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

  const renderSwingingOrFalling = () => {
    const size = BLOCK_SIZE;
    const baseStyle = {
      borderColor: theme.border,
      width: size,
      height: size,
    };

    if (isDropping) {
      return (
        <Animated.View
          style={[
            styles.block,
            baseStyle,
            {
              transform: [
                {
                  translateX:
                    fallingX.current - size / 2,
                },
                {
                  translateY: fallingY,
                },
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
                translateX: swingX.interpolate({
                  inputRange: [-SWING_RANGE / 2, SWING_RANGE / 2],
                  outputRange: [
                    centerX - SWING_RANGE / 2 - size / 2,
                    centerX + SWING_RANGE / 2 - size / 2,
                  ],
                }),
              },
              { translateY: PLAY_TOP + 60 },
            ],
          },
        ]}
      />
    );
  };

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
          {/* Tower */}
          {renderTower()}

          {/* Platform */}
          <View
            style={[
              styles.platform,
              {
                borderColor: theme.border,
                width: playWidth * 0.8,
                transform: [
                  {
                    translateX:
                      centerX - (playWidth * 0.8) / 2,
                  },
                  {
                    translateY:
                      PLAY_BOTTOM - PLATFORM_HEIGHT * 2,
                  },
                ],
              },
            ]}
          />

          {/* Swinging / falling block */}
          {renderSwingingOrFalling()}
        </Animated.View>
      </View>

      {/* Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.dropButton,
            { backgroundColor: theme.text },
          ]}
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
              { borderColor: theme.text },
            ]}
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
