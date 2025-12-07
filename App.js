import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Sizes
const BLOCK_SIZE = 60;
const PLAY_MARGIN = 12;

// Ground / platform
const BASE_WIDTH = SCREEN_WIDTH - PLAY_MARGIN * 4; // almost full width inside playArea
const BASE_HEIGHT = 22;
const BASE_BOTTOM = 120; // how high from bottom

// Swing height (top path)
const SWING_Y = BASE_BOTTOM + BASE_HEIGHT + BLOCK_SIZE * 7;

// Swing range
const LEFT_BOUND = PLAY_MARGIN * 2;
const RIGHT_BOUND = SCREEN_WIDTH - PLAY_MARGIN * 2 - BLOCK_SIZE;

// Game pacing
const START_SPEED = 1500;
const MAX_BLOCKS = 20;

// Theme (later we can add Desert/City/Beach/Jungle)
const theme = {
  bgNight: "#02020A",
  bgDay: "#F4F7FF",
  neon: "#00E5FF",
  groundFill: "#041821",
};

export default function App() {
  // base ground is index 0
  const [blocks, setBlocks] = useState(() => [
    { x: (SCREEN_WIDTH - BASE_WIDTH) / 2 },
  ]);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isNight, setIsNight] = useState(true);
  const [speed, setSpeed] = useState(START_SPEED);

  const isGameOverRef = useRef(false);

  // Swinging block (top)
  const swingX = useRef(new Animated.Value((SCREEN_WIDTH - BLOCK_SIZE) / 2))
    .current;
  const swingXValue = useRef((SCREEN_WIDTH - BLOCK_SIZE) / 2);
  const direction = useRef(1);
  const swingAnimRef = useRef(null);

  // Falling block
  const [isDropping, setIsDropping] = useState(false);
  const [fallingX, setFallingX] = useState(null);
  const dropY = useRef(new Animated.Value(SWING_Y)).current;

  // Tower sway
  const tilt = useRef(new Animated.Value(0)).current; // -1..1 mapped to degrees

  // Keep JS copy of swingX
  useEffect(() => {
    const id = swingX.addListener(({ value }) => {
      swingXValue.current = value;
    });
    return () => swingX.removeListener(id);
  }, [swingX]);

  useEffect(() => {
    isGameOverRef.current = isGameOver;
  }, [isGameOver]);

  // Start swinging once
  useEffect(() => {
    startSwing();
    return () => {
      if (swingAnimRef.current) swingAnimRef.current.stop();
    };
  }, []);

  const startSwing = () => {
    if (swingAnimRef.current) swingAnimRef.current.stop();

    const animate = () => {
      const target = direction.current === 1 ? RIGHT_BOUND : LEFT_BOUND;

      swingAnimRef.current = Animated.timing(swingX, {
        toValue: target,
        duration: speed,
        useNativeDriver: false,
      });

      swingAnimRef.current.start(({ finished }) => {
        if (!finished || isGameOverRef.current || isDropping) return;
        direction.current *= -1;
        animate();
      });
    };

    animate();
  };

  // only sway when tower is tall enough + misplacement
  const triggerTilt = (offsetFromCenter, towerHeight) => {
    const MIN_HEIGHT_FOR_SWAY = 5; // no sway while tower is short
    if (towerHeight < MIN_HEIGHT_FOR_SWAY) return;

    const dir = offsetFromCenter === 0 ? 0 : offsetFromCenter > 0 ? 1 : -1;
    if (dir === 0) return;

    // scale intensity by misplacement and height
    const heightFactor = Math.min(1.5, (towerHeight - MIN_HEIGHT_FOR_SWAY) / 10);
    const offsetFactor = Math.min(1, Math.abs(offsetFromCenter) / BLOCK_SIZE);

    const raw = dir * offsetFactor * heightFactor; // between -1.5..1.5
    const clamped = Math.max(-1, Math.min(1, raw)); // -1..1

    const target = clamped * 0.7; // final internal tilt value

    Animated.sequence([
      Animated.timing(tilt, {
        toValue: target,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(tilt, {
        toValue: -target * 0.5,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(tilt, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleDrop = () => {
    if (isGameOverRef.current || isDropping) return;

    if (swingAnimRef.current) swingAnimRef.current.stop();

    const x = swingXValue.current; // exact X when you tapped
    setIsDropping(true);
    setFallingX(x);
    dropY.setValue(SWING_Y);

    const targetBottom =
      BASE_BOTTOM + BASE_HEIGHT + (blocks.length - 1) * BLOCK_SIZE;

    Animated.timing(dropY, {
      toValue: targetBottom,
      duration: 380,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (!finished) return;

      const last = blocks[blocks.length - 1];
      const lastWidth = blocks.length - 1 === 0 ? BASE_WIDTH : BLOCK_SIZE;

      const lastLeft = last.x;
      const lastRight = last.x + lastWidth;
      const lastCenter = lastLeft + lastWidth / 2;

      const currentLeft = x;
      const currentRight = x + BLOCK_SIZE;
      const currentCenter = currentLeft + BLOCK_SIZE / 2;

      // HIT rule: block center must be above the top block
      const isHit = currentCenter >= lastLeft && currentCenter <= lastRight;

      if (isHit && blocks.length <= MAX_BLOCKS) {
        // keep EXACT X where player dropped
        const newBlockX = x;

        // how off-center?
        const offsetFromCenter = currentCenter - lastCenter;
        const newTowerHeight = blocks.length + 1; // after adding this block

        setBlocks((prev) => [...prev, { x: newBlockX }]);
        const newScore = score + 1;
        setScore(newScore);
        if (newScore > best) setBest(newScore);

        setSpeed((prev) => Math.max(700, prev - 60));

        setIsDropping(false);

        // tower sway animation (only when tall enough)
        triggerTilt(offsetFromCenter, newTowerHeight);

        // restart swing from random side
        const startSide = Math.random() < 0.5 ? LEFT_BOUND : RIGHT_BOUND;
        swingX.setValue(startSide);
        swingXValue.current = startSide;
        direction.current = startSide === LEFT_BOUND ? 1 : -1;
        startSwing();

        if (blocks.length + 1 > MAX_BLOCKS) {
          setIsGameOver(true);
          if (swingAnimRef.current) swingAnimRef.current.stop();
        }
      } else {
        // MISS – let it fall off
        Animated.timing(dropY, {
          toValue: -BLOCK_SIZE * 2,
          duration: 520,
          useNativeDriver: false,
        }).start(() => {
          setIsDropping(false);
          setIsGameOver(true);
        });
      }
    });
  };

  const handleRestart = () => {
    const base = { x: (SCREEN_WIDTH - BASE_WIDTH) / 2 };
    setBlocks([base]);
    setScore(0);
    setIsGameOver(false);
    setSpeed(START_SPEED);
    setIsDropping(false);
    dropY.setValue(SWING_Y);

    const centerX = (SCREEN_WIDTH - BLOCK_SIZE) / 2;
    swingX.setValue(centerX);
    swingXValue.current = centerX;
    direction.current = 1;
    startSwing();
  };

  const bgColor = isNight ? theme.bgNight : theme.bgDay;
  const neon = theme.neon;
  const textColor = isNight ? "#FFFFFF" : "#000000";

  const towerRotate = tilt.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-5deg", "5deg"], // small, realistic sway
  });

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: neon }]}>NEON CITY BLOXX</Text>
        <TouchableOpacity
          style={[styles.modeButton, { borderColor: neon }]}
          onPress={() => setIsNight((v) => !v)}
        >
          <Text style={[styles.modeText, { color: neon }]}>
            {isNight ? "NIGHT" : "DAY"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* SCORE */}
      <View style={styles.scoreRow}>
        <Text style={[styles.scoreText, { color: textColor }]}>
          SCORE: <Text style={{ color: neon }}>{score}</Text>
        </Text>
        <Text style={[styles.scoreText, { color: textColor }]}>
          BEST: <Text style={{ color: neon }}>{best}</Text>
        </Text>
      </View>

      {/* PLAY AREA */}
      <View style={styles.playArea}>
        {/* TOWER + GROUND inside one Animated container → sway only when tall */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            { transform: [{ rotate: towerRotate }] },
          ]}
        >
          {blocks.map((b, i) => {
            if (i === 0) {
              // ground strip
              return (
                <View
                  key={i}
                  style={[
                    styles.base,
                    {
                      left: b.x,
                      width: BASE_WIDTH,
                      height: BASE_HEIGHT,
                      bottom: BASE_BOTTOM,
                      borderColor: neon,
                      backgroundColor: theme.groundFill,
                      shadowColor: neon,
                    },
                  ]}
                />
              );
            }

            const bottom =
              BASE_BOTTOM + BASE_HEIGHT + (i - 1) * BLOCK_SIZE;

            return (
              <View
                key={i}
                style={[
                  styles.block,
                  {
                    left: b.x,
                    bottom,
                    borderColor: neon,
                    shadowColor: neon,
                  },
                ]}
              />
            );
          })}

          {/* FALLING BLOCK (part of tower visual while dropping) */}
          {isDropping && (
            <Animated.View
              style={[
                styles.block,
                {
                  left: fallingX,
                  bottom: dropY,
                  borderColor: neon,
                  shadowColor: neon,
                },
              ]}
            />
          )}
        </Animated.View>

        {/* SWINGING BLOCK (stays stable, not swaying with tower) */}
        {!isGameOver && !isDropping && (
          <Animated.View
            style={[
              styles.block,
              {
                left: swingX,
                bottom: SWING_Y,
                borderColor: neon,
                shadowColor: neon,
              },
            ]}
          />
        )}

        {/* GAME OVER */}
        {isGameOver && (
          <View style={styles.gameOverBox}>
            <Text style={[styles.gameOverTitle, { color: neon }]}>
              GAME OVER
            </Text>
            <Text style={[styles.gameOverText, { color: textColor }]}>
              Score: <Text style={{ color: neon }}>{score}</Text>
            </Text>
            <TouchableOpacity
              style={[styles.restartButton, { backgroundColor: neon }]}
              onPress={handleRestart}
            >
              <Text style={styles.restartText}>RESTART</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* DROP BUTTON */}
      {!isGameOver && (
        <TouchableOpacity
          style={[styles.dropButton, { backgroundColor: neon }]}
          onPress={handleDrop}
        >
          <Text style={styles.dropText}>DROP</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ===== STYLES =====
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 2,
  },
  modeButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  modeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 10,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: "600",
  },
  playArea: {
    flex: 1,
    marginTop: 10,
    marginHorizontal: PLAY_MARGIN,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },

  base: {
    position: "absolute",
    borderWidth: 3,
    borderRadius: 6,
    shadowOpacity: 0.9,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },

  block: {
    position: "absolute",
    width: BLOCK_SIZE,
    height: BLOCK_SIZE,
    borderWidth: 3,
    borderRadius: 2,
    backgroundColor: "transparent",
    shadowOpacity: 0.95,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },

  dropButton: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 999,
  },
  dropText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#000",
    letterSpacing: 1,
  },

  gameOverBox: {
    position: "absolute",
    alignSelf: "center",
    top: SCREEN_HEIGHT * 0.22,
    paddingHorizontal: 26,
    paddingVertical: 20,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.85)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
  },
  gameOverTitle: {
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 6,
    letterSpacing: 1,
  },
  gameOverText: {
    fontSize: 16,
    marginBottom: 12,
  },
  restartButton: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 999,
  },
  restartText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "800",
  },
});
