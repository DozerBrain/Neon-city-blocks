// src/NeonGame.tsx
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

// ---- TUNING CONSTANTS ----
const BLOCK_SIZE = 60;
const PLATFORM_HEIGHT = 8;
const PLAY_WIDTH = SCREEN_WIDTH * 0.9;
const PLAY_HEIGHT = SCREEN_HEIGHT * 0.7;

const PLATFORM_BOTTOM = 24; // distance from play-area bottom
const MAX_VISIBLE_BLOCKS = 9; // after this, bottom starts moving down
const DROP_DURATION = 450;

type TowerBlock = {
  id: number;
  index: number; // 0 = sitting on platform
  x: number; // center X inside play area (0..PLAY_WIDTH)
};

type NeonGameProps = {
  onGameOver: (score: number) => void;
};

const NeonGame: React.FC<NeonGameProps> = ({ onGameOver }) => {
  // one base block on platform in the centre
  const [blocks, setBlocks] = useState<TowerBlock[]>([
    { id: 0, index: 0, x: PLAY_WIDTH / 2 },
  ]);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [isDropping, setIsDropping] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isNight, setIsNight] = useState(true);
  const [scrollOffset, setScrollOffset] = useState(0); // pushes bottom down when tower tall

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

  // ---- SWINGING BLOCK (TOP) ----
  const LEFT_BOUND = BLOCK_SIZE / 2 + 16;
  const RIGHT_BOUND = PLAY_WIDTH - BLOCK_SIZE / 2 - 16;

  const swingPhase = useRef(new Animated.Value(0)).current; // 0..1
  const swingAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const currentSwingX = useRef((LEFT_BOUND + RIGHT_BOUND) / 2); // actual centre X

  useEffect(() => {
    const sub = swingPhase.addListener(({ value }) => {
      const x = LEFT_BOUND + value * (RIGHT_BOUND - LEFT_BOUND);
      currentSwingX.current = x;
    });

    startSwing();

    return () => {
      swingPhase.removeListener(sub);
      stopSwing();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startSwing = () => {
    swingPhase.setValue(0);
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(swingPhase, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(swingPhase, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    swingAnimRef.current = anim;
    anim.start();
  };

  const stopSwing = () => {
    if (swingAnimRef.current) {
      swingAnimRef.current.stop();
      swingAnimRef.current = null;
    }
  };

  // ---- FALLING BLOCK ----
  const fallBottom = useRef(new Animated.Value(PLAY_HEIGHT + 100)).current;
  const fallingX = useRef(currentSwingX.current); // centre X of the falling block

  // ---- TILT (WHOLE PLAY AREA) ----
  const tiltUnit = useRef(new Animated.Value(0)).current; // -1..1
  const tiltDeg = tiltUnit.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-14deg", "14deg"],
  });

  const handleDrop = () => {
    if (isDropping || isGameOver) return;

    setIsDropping(true);
    stopSwing();

    const baseBlock = blocks[blocks.length - 1];
    const nextIndex = blocks.length;

    // X position from swing
    const x = currentSwingX.current;
    fallingX.current = x;

    // where this block should land (bottom from play-area bottom)
    const targetBottom =
      PLATFORM_BOTTOM +
      PLATFORM_HEIGHT +
      nextIndex * BLOCK_SIZE -
      scrollOffset;

    fallBottom.setValue(PLAY_HEIGHT + 80);

    Animated.timing(fallBottom, {
      toValue: targetBottom,
      duration: DROP_DURATION,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      landBlock(x, baseBlock.x, nextIndex);
    });
  };

  const landBlock = (x: number, prevX: number, index: number) => {
    const dx = x - prevX;
    const missThreshold = BLOCK_SIZE * 0.7;

    // MISS → game over
    if (Math.abs(dx) > missThreshold) {
      triggerGameOver(score);
      return;
    }

    // add new block
    const newBlock: TowerBlock = {
      id: Date.now(),
      index,
      x,
    };
    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);

    // score
    const newScore = score + 1;
    setScore(newScore);
    if (newScore > best) setBest(newScore);

    // scrolling: once tower higher than MAX_VISIBLE_BLOCKS, push bottom down
    const extraBlocks = Math.max(0, newBlocks.length - MAX_VISIBLE_BLOCKS);
    const newScroll = extraBlocks * BLOCK_SIZE;
    setScrollOffset(newScroll);

    // tilt: more tilt for taller tower + off-centre landings
    const heightFactor = Math.max(
      0,
      Math.min(1, (newBlocks.length - 2) / 10)
    );
    const offsetFactor = Math.min(1, Math.abs(dx) / missThreshold);
    const direction = dx === 0 ? 0 : dx > 0 ? 1 : -1;
    const targetTilt = direction * heightFactor * offsetFactor; // -1..1

    Animated.spring(tiltUnit, {
      toValue: targetTilt,
      friction: 7,
      tension: 40,
      useNativeDriver: true,
    }).start();

    // ready for next swing
    setIsDropping(false);
    startSwing();
  };

  const triggerGameOver = (finalScore: number) => {
    setIsGameOver(true);

    // small tilt "fall" animation
    Animated.timing(tiltUnit, {
      toValue: tiltUnit.__getValue() >= 0 ? 1 : -1,
      duration: 350,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      onGameOver(finalScore);
    });
  };

  const handleToggleMode = () => setIsNight((prev) => !prev);

  const handleRestartLocal = () => {
    setBlocks([{ id: 0, index: 0, x: PLAY_WIDTH / 2 }]);
    setScore(0);
    setIsGameOver(false);
    setIsDropping(false);
    setScrollOffset(0);
    tiltUnit.setValue(0);
    fallBottom.setValue(PLAY_HEIGHT + 100);
    startSwing();
  };

  // ---- RENDER HELPERS ----

  const renderTower = () =>
    blocks.map((block) => {
      const bottom =
        PLATFORM_BOTTOM +
        PLATFORM_HEIGHT +
        block.index * BLOCK_SIZE -
        scrollOffset;

      return (
        <View
          key={block.id}
          style={[
            styles.block,
            {
              borderColor: theme.border,
              width: BLOCK_SIZE,
              height: BLOCK_SIZE,
              bottom,
              left: block.x - BLOCK_SIZE / 2,
            },
          ]}
        />
      );
    });

  const renderSwingingOrFalling = () => {
    const common = {
      borderColor: theme.border,
      width: BLOCK_SIZE,
      height: BLOCK_SIZE,
    };

    if (isDropping) {
      // falling
      return (
        <Animated.View
          style={[
            styles.block,
            common,
            {
              left: fallingX.current - BLOCK_SIZE / 2,
              transform: [
                {
                  translateY: Animated.subtract(
                    fallBottom,
                    PLAY_HEIGHT
                  ),
                },
              ],
            },
          ]}
        />
      );
    }

    // swinging
    const animatedLeft = swingPhase.interpolate({
      inputRange: [0, 1],
      outputRange: [
        LEFT_BOUND - BLOCK_SIZE / 2,
        RIGHT_BOUND - BLOCK_SIZE / 2,
      ],
    });

    return (
      <Animated.View
        style={[
          styles.block,
          common,
          {
            bottom:
              PLAY_HEIGHT -
              (PLATFORM_BOTTOM + PLATFORM_HEIGHT + BLOCK_SIZE * 3),
            left: animatedLeft,
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
              width: PLAY_WIDTH,
              height: PLAY_HEIGHT,
              borderColor: theme.border,
              backgroundColor: theme.playBg,
              transform: [{ rotate: tiltDeg }],
            },
          ]}
        >
          {/* platform from corner to corner */}
          <View
            style={[
              styles.platform,
              {
                borderColor: theme.border,
                left: 16,
                right: 16,
                bottom: PLATFORM_BOTTOM - scrollOffset,
                height: PLATFORM_HEIGHT,
              },
            ]}
          />

          {/* tower & active block */}
          {renderTower()}
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
