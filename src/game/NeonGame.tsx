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

// Playfield sizes
const PLAY_WIDTH = SCREEN_WIDTH * 0.9;
const PLAY_HEIGHT = SCREEN_HEIGHT * 0.7;

const BLOCK_SIZE = 60;
const PLATFORM_HEIGHT = 8;

// Top of swinging block (inside play area)
const SWING_TOP = 60;
// Distance from play bottom to platform top
const PLATFORM_BOTTOM_MARGIN = 24;

// The highest we allow the tower top to go before we push everything down
const TOP_LIMIT = 80;

type TowerBlock = {
  id: number;
  index: number; // 0 = base block on platform
  x: number; // center X inside play area (0..PLAY_WIDTH)
};

type NeonGameProps = {
  onGameOver: (score: number) => void;
};

const NeonGame: React.FC<NeonGameProps> = ({ onGameOver }) => {
  // one base block in the centre on the platform
  const [blocks, setBlocks] = useState<TowerBlock[]>([
    { id: 0, index: 0, x: PLAY_WIDTH / 2 },
  ]);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [isDropping, setIsDropping] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isNight, setIsNight] = useState(true);

  // vertical offset for the whole tower + platform
  // when tower gets high, we increase offsetY so bottom goes down
  const [offsetY, setOffsetY] = useState(0);

  const basePlatformTop =
    PLAY_HEIGHT - PLATFORM_HEIGHT - PLATFORM_BOTTOM_MARGIN;

  const blockTop = (index: number, off: number) =>
    basePlatformTop + off - BLOCK_SIZE * (index + 1);

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

  // --- Swinging block (horizontal) ---
  const swingX = useRef(new Animated.Value(0)).current; // 0..maxSwing
  const swingValueRef = useRef(0); // numeric value for logic

  // max pixels we move horizontally (inside padding)
  const SWING_PADDING = 16;
  const maxSwing = PLAY_WIDTH - BLOCK_SIZE - SWING_PADDING * 2;

  useEffect(() => {
    const sub = swingX.addListener(({ value }) => {
      swingValueRef.current = value;
    });

    startSwing();

    return () => {
      swingX.removeListener(sub);
      swingX.stopAnimation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startSwing = () => {
    swingX.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(swingX, {
          toValue: maxSwing,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false, // animating "left"
        }),
        Animated.timing(swingX, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ])
    ).start();
  };

  const stopSwing = () => {
    swingX.stopAnimation();
  };

  // --- Falling block (vertical) ---
  const fallingY = useRef(new Animated.Value(0)).current; // translateY
  const fallingXRef = useRef(PLAY_WIDTH / 2); // centre X while falling

  const handleDrop = () => {
    if (isDropping || isGameOver) return;

    setIsDropping(true);
    stopSwing();

    const currentCentreX =
      SWING_PADDING + swingValueRef.current + BLOCK_SIZE / 2;
    fallingXRef.current = currentCentreX;

    const nextIndex = blocks.length;
    const targetTop = blockTop(nextIndex, offsetY); // where it should land

    const startTop = SWING_TOP;
    fallingY.setValue(0);

    Animated.timing(fallingY, {
      toValue: targetTop - startTop,
      duration: 450,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false, // animating translateY
    }).start(({ finished }) => {
      if (!finished) return;

      const prev = blocks[blocks.length - 1];
      landBlock(currentCentreX, prev.x, nextIndex);
    });
  };

  const landBlock = (x: number, prevX: number, index: number) => {
    const dx = x - prevX;

    // MUCH more generous: as long as there is some overlap, it counts
    const missThreshold = BLOCK_SIZE * 1.1;

    // Miss → game over (no crash, just go out)
    if (Math.abs(dx) > missThreshold) {
      triggerGameOver(score);
      return;
    }

    const newBlock: TowerBlock = { id: Date.now(), index, x };
    const newBlocks = [...blocks, newBlock];

    // ---- vertical scroll logic ----
    // compute where the top of this new block would be
    let newOffsetY = offsetY;
    const newTop = blockTop(index, newOffsetY);

    // if top is above TOP_LIMIT, push whole tower + platform down
    if (newTop < TOP_LIMIT) {
      const diff = TOP_LIMIT - newTop; // how much we need to move down
      newOffsetY += diff;
    }

    setBlocks(newBlocks);
    setOffsetY(newOffsetY);

    const newScore = score + 1;
    setScore(newScore);
    if (newScore > best) setBest(newScore);

    // ready for next swing
    setIsDropping(false);
    fallingY.setValue(0);
    startSwing();
  };

  const triggerGameOver = (finalScore: number) => {
    setIsGameOver(true);
    onGameOver(finalScore);
  };

  const handleRestartLocal = () => {
    setBlocks([{ id: 0, index: 0, x: PLAY_WIDTH / 2 }]);
    setScore(0);
    setIsGameOver(false);
    setIsDropping(false);
    fallingY.setValue(0);
    setOffsetY(0);
    startSwing();
  };

  const handleToggleMode = () => setIsNight((prev) => !prev);

  // ---- RENDER HELPERS ----

  const renderTower = () =>
    blocks.map((block) => (
      <View
        key={block.id}
        style={[
          styles.block,
          {
            borderColor: theme.border,
            width: BLOCK_SIZE,
            height: BLOCK_SIZE,
            top: blockTop(block.index, offsetY),
            left: block.x - BLOCK_SIZE / 2,
          },
        ]}
      />
    ));

  const renderSwingingOrFalling = () => {
    const baseStyle = {
      borderColor: theme.border,
      width: BLOCK_SIZE,
      height: BLOCK_SIZE,
    };

    if (isDropping) {
      // falling from fixed SWING_TOP
      return (
        <Animated.View
          style={[
            styles.block,
            baseStyle,
            {
              top: SWING_TOP,
              left: fallingXRef.current - BLOCK_SIZE / 2,
              transform: [{ translateY: fallingY }],
            },
          ]}
        />
      );
    }

    // swinging
    return (
      <Animated.View
        style={[
          styles.block,
          baseStyle,
          {
            top: SWING_TOP,
            left: SWING_PADDING,
            transform: [{ translateX: swingX }],
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
          {/* Platform from corner to corner (inside padding) */}
          <View
            style={[
              styles.platform,
              {
                borderColor: theme.border,
                left: SWING_PADDING,
                right: SWING_PADDING,
                top: basePlatformTop + offsetY,
                height: PLATFORM_HEIGHT,
              },
            ]}
          />

          {/* Tower blocks & active block */}
          {renderTower()}
          {renderSwingingOrFalling()}
        </View>
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
