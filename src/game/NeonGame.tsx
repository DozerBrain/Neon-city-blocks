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

// ----- GAME CONSTANTS -----
const BLOCK_SIZE = 60;
const PLATFORM_HEIGHT = 10;
const SWING_RANGE = SCREEN_WIDTH * 0.6; // wider left-right movement
const DROP_DURATION = 450;
const TILT_LIMIT = 1.0;

// Play area positioning
const PLAY_TOP = 80;
const PLAY_BOTTOM = SCREEN_HEIGHT * 0.78;

type TowerBlock = {
  id: number;
  index: number;
  x: number;
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

  // ----- ANIMATIONS -----
  const swingX = useRef(new Animated.Value(0)).current;
  const swingValue = useRef(0);
  const fallingY = useRef(new Animated.Value(PLAY_TOP + 100)).current;
  const fallingX = useRef(0);

  const tiltUnit = useRef(new Animated.Value(0)).current;
  const tiltDeg = tiltUnit.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-14deg", "14deg"],
  });

  const swingAnimRef = useRef(null);

  // Track swing value
  useEffect(() => {
    const sub = swingX.addListener(({ value }) => {
      swingValue.current = value;
    });
    return () => swingX.removeListener(sub);
  }, []);

  // Start swing loop
  const startSwing = () => {
    swingX.setValue(0);
    const left = -SWING_RANGE / 2;
    const right = SWING_RANGE / 2;

    const moveTo = (to) =>
      Animated.timing(swingX, {
        toValue: to,
        duration: 900,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      });

    swingAnimRef.current = Animated.loop(
      Animated.sequence([moveTo(right), moveTo(left)])
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
  }, []);

  // ----- DROP -----
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
      PLAY_BOTTOM -
      PLATFORM_HEIGHT -
      BLOCK_SIZE / 2 -
      targetIndex * BLOCK_SIZE;

    fallingY.setValue(PLAY_TOP + 100);

    Animated.timing(fallingY, {
      toValue: targetY,
      duration: DROP_DURATION,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) landBlock(currentX, targetIndex);
    });
  };

  // ----- LANDING LOGIC -----
  const landBlock = (x, index) => {
    const top = blocks[blocks.length - 1];
    const dx = x - top.x;
    const missThreshold = BLOCK_SIZE * 0.65;

    if (Math.abs(dx) > missThreshold) return triggerGameOver(score);

    const newBlock = { id: Date.now(), index, x };
    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);

    const newScore = score + 1;
    setScore(newScore);
    if (newScore > best) setBest(newScore);

    // Calculate tower tilt
    const heightFactor = Math.max(0, Math.min(1, (newBlocks.length - 3) / 12));
    const offsetFactor = Math.min(1, Math.abs(dx) / missThreshold);
    const direction = dx === 0 ? 0 : dx > 0 ? 1 : -1;

    const targetTilt = direction * heightFactor * offsetFactor;

    Animated.spring(tiltUnit, {
      toValue: targetTilt,
      friction: 7,
      tension: 40,
      useNativeDriver: true,
    }).start();

    // Collapse if tilt too strong
    if (newBlocks.length > 7 && Math.abs(targetTilt) > TILT_LIMIT) {
      triggerGameOver(newScore);
    } else {
      setIsDropping(false);
      startSwing();
    }
  };

  // ----- GAME OVER -----
  const triggerGameOver = (finalScore) => {
    setIsGameOver(true);
    stopSwing();

    Animated.timing(tiltUnit, {
      toValue: tiltUnit.__getValue() > 0 ? 1 : -1,
      duration: 400,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => onGameOver(finalScore));
  };

  // Restart
  const restart = () => {
    setBlocks([{ id: 0, index: 0, x: SCREEN_WIDTH / 2 }]);
    setScore(0);
    setIsGameOver(false);
    setIsDropping(false);
    tiltUnit.setValue(0);
    swingX.setValue(0);
    fallingY.setValue(PLAY_TOP + 100);
    startSwing();
  };

  // ----- THEMES -----
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

  // ----- DYNAMIC TOWER SCROLL -----
  const dynamicBottomOffset = Math.max(0, blocks.length - 8) * 12;
  const baseBottom = PLAY_BOTTOM + dynamicBottomOffset;

  // Render tower blocks
  const renderTower = () =>
    blocks.map((block) => {
      const y =
        baseBottom -
        PLATFORM_HEIGHT -
        BLOCK_SIZE / 2 -
        block.index * BLOCK_SIZE;

      return (
        <View
          key={block.id}
          style={[
            styles.block,
            {
              borderColor: theme.border,
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

  // Render swinging or falling block
  const renderDropper = () => {
    if (isDropping) {
      return (
        <Animated.View
          style={[
            styles.block,
            {
              borderColor: theme.border,
              width: BLOCK_SIZE,
              height: BLOCK_SIZE,
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
          {
            borderColor: theme.border,
            width: BLOCK_SIZE,
            height: BLOCK_SIZE,
            transform: [
              {
                translateX: swingX.interpolate({
                  inputRange: [-SWING_RANGE / 2, SWING_RANGE / 2],
                  outputRange: [
                    centerX - SWING_RANGE / 2 - BLOCK_SIZE / 2,
                    centerX + SWING_RANGE / 2 - BLOCK_SIZE / 2,
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
          onPress={() => setIsNight((v) => !v)}
        >
          <Text style={[styles.modeText, { color: theme.text }]}>
            {isNight ? "NIGHT" : "DAY"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Score Row */}
      <View style={styles.scoreRow}>
        <Text style={[styles.scoreText, { color: theme.text }]}>
          SCORE: {score}
        </Text>
        <Text style={[styles.scoreText, { color: theme.text }]}>
          BEST: {best}
        </Text>
      </View>

      {/* Play Area */}
      <View style={styles.playWrapper}>
        <Animated.View
          style={[
            styles.playArea,
            {
              width: playWidth,
              height: playHeight,
              backgroundColor: theme.playBg,
              borderColor: theme.border,
              transform: [{ rotate: tiltDeg }],
            },
          ]}
        >
          {renderTower()}

          {/* Full-width platform */}
          <View
            style={[
              styles.platform,
              {
                borderColor: theme.border,
                width: playWidth * 1.05,
                transform: [
                  { translateX: centerX - (playWidth * 1.05) / 2 },
                  { translateY: baseBottom - PLATFORM_HEIGHT * 2 },
                ],
              },
            ]}
          />

          {renderDropper()}
        </Animated.View>
      </View>

      {/* Drop button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.dropButton, { backgroundColor: theme.text }]}
          onPress={handleDrop}
          disabled={isDropping || isGameOver}
        >
          <Text style={styles.dropText}>DROP</Text>
        </TouchableOpacity>

        {isGameOver && (
          <TouchableOpacity
            style={[styles.restartButton, { borderColor: theme.text }]}
            onPress={restart}
          >
            <Text style={[styles.restartText, { color: theme.text }]}>
              RESTART
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
    paddingBottom: 80, // space for ads later
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 2,
  },
  modeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 2,
  },
  modeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 8,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: "700",
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
    alignItems: "center",
    paddingTop: 8,
  },
  dropButton: {
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 999,
  },
  dropText: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 2,
    color: "#000",
  },
  restartButton: {
    marginTop: 10,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
  },
  restartText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },
});
