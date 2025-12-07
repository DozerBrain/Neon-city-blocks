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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ----- TUNING CONSTANTS -----
const BLOCK_SIZE = 60;                 // size of each block (square)
const PLATFORM_HEIGHT = 10;            // thickness of ground line
const MAX_BLOCKS = 25;                 // hard cap, just in case
const SWING_AMPLITUDE = SCREEN_WIDTH * 0.4; // how wide the top block swings
const DROP_DURATION = 450;             // ms for block to fall
const TILT_SENSITIVITY = 260;          // bigger = slower sway
const TILT_LIMIT = 1.25;               // when |tilt| > this -> GAME OVER

// Play area: from some top margin down to just above the button
const PLAY_TOP = 80;
const PLAY_BOTTOM = SCREEN_HEIGHT * 0.78;
const TOWER_CENTER_X = SCREEN_WIDTH / 2;

type Block = {
  id: number;
  index: number;      // 0 = bottom on platform
  x: number;          // absolute x (center)
};

interface Props {
  onGameOver: (score: number) => void;
}

export default function NeonGame({ onGameOver }: Props) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [score, setScore] = useState(0);
  const [isDropping, setIsDropping] = useState(false);
  const [isInputLocked, setIsInputLocked] = useState(false);

  // swinging top block (x only)
  const swingX = useRef(
    new Animated.Value(TOWER_CENTER_X)
  ).current;
  const swingAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  // falling block
  const fallingY = useRef(new Animated.Value(PLAY_TOP + 100)).current;
  const fallingX = useRef<number | null>(null);

  // tower tilt (for sway)
  const tiltValueRef = useRef(0); // logical tilt value
  const tiltAnim = useRef(new Animated.Value(0)).current;

  // ----- HELPER: start swinging animation -----
  const startSwinging = () => {
    const left = TOWER_CENTER_X - SWING_AMPLITUDE / 2;
    const right = TOWER_CENTER_X + SWING_AMPLITUDE / 2;

    swingX.setValue(TOWER_CENTER_X);

    swingAnimRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(swingX, {
          toValue: right,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(swingX, {
          toValue: left,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    );

    swingAnimRef.current.start();
  };

  // ----- HELPER: stop swinging -----
  const stopSwinging = () => {
    if (swingAnimRef.current) {
      swingAnimRef.current.stop();
      swingAnimRef.current = null;
    }
  };

  // ----- INITIALIZE GAME -----
  useEffect(() => {
    resetGame();
  }, []);

  const resetGame = () => {
    stopSwinging();
    setBlocks([]);
    setScore(0);
    setIsDropping(false);
    setIsInputLocked(false);
    tiltValueRef.current = 0;
    tiltAnim.setValue(0);
    startSwinging();
  };

  // ----- DROP BUTTON HANDLER -----
  const handleDrop = () => {
    if (isDropping || isInputLocked) return;

    setIsDropping(true);
    setIsInputLocked(true);
    stopSwinging();

    const currentX = (swingX as any)._value ?? TOWER_CENTER_X;
    fallingX.current = currentX;

    const targetIndex = blocks.length; // 0 = platform
    const targetY =
      PLAY_BOTTOM - PLATFORM_HEIGHT - BLOCK_SIZE / 2 - targetIndex * BLOCK_SIZE;

    fallingY.setValue(PLAY_TOP + 100);

    Animated.timing(fallingY, {
      toValue: targetY,
      duration: DROP_DURATION,
      easing: Easing.in(Easing.quad),
      useNativeDriver: false,
    }).start(() => {
      onBlockLanded(currentX, targetIndex);
    });
  };

  // ----- WHEN BLOCK LANDS -----
  const onBlockLanded = (x: number, index: number) => {
    const newBlock: Block = {
      id: Date.now(),
      index,
      x,
    };

    // update score & blocks
    setBlocks((prev) => {
      const updated = [...prev, newBlock].slice(0, MAX_BLOCKS);
      setScore(updated.length);
      return updated;
    });

    // update tower tilt based on misalignment
    const offset = x - TOWER_CENTER_X; // >0 = to the right, <0 = to the left
    const newTilt = tiltValueRef.current + offset / TILT_SENSITIVITY;
    tiltValueRef.current = newTilt;

    Animated.spring(tiltAnim, {
      toValue: newTilt,
      friction: 6,
      tension: 40,
      useNativeDriver: false,
    }).start();

    // check for collapse
    if (Math.abs(newTilt) > TILT_LIMIT) {
      // small delay then game over
      setTimeout(() => {
        onGameOver(score + 1); // +1 for the block we just added
        resetGame();
      }, 550);
      return;
    }

    // continue playing: start swinging next block
    setIsDropping(false);
    setIsInputLocked(false);
    startSwinging();
  };

  // ----- RENDER HELPERS -----
  const renderPlatform = () => (
    <View
      style={[
        styles.platform,
        {
          bottom: SCREEN_HEIGHT - PLAY_BOTTOM,
        },
      ]}
    />
  );

  const renderStaticBlocks = () => {
    return blocks.map((b) => {
      const y =
        PLAY_BOTTOM -
        PLATFORM_HEIGHT -
        BLOCK_SIZE / 2 -
        b.index * BLOCK_SIZE;

      return (
        <View
          key={b.id}
          style={[
            styles.block,
            {
              left: b.x - BLOCK_SIZE / 2,
              top: y - BLOCK_SIZE / 2,
            },
          ]}
        />
      );
    });
  };

  const renderSwingingBlock = () => {
    if (isDropping) return null; // while dropping, we draw the falling one instead

    return (
      <Animated.View
        style={[
          styles.block,
          {
            top: PLAY_TOP + 100 - BLOCK_SIZE / 2,
            left: Animated.subtract(swingX, BLOCK_SIZE / 2),
          },
        ]}
      />
    );
  };

  const renderFallingBlock = () => {
    if (!isDropping || fallingX.current == null) return null;

    return (
      <Animated.View
        style={[
          styles.block,
          {
            left: fallingX.current - BLOCK_SIZE / 2,
            top: Animated.subtract(fallingY, BLOCK_SIZE / 2),
          },
        ]}
      />
    );
  };

  // tilt -> deg for visual sway
  const towerTiltDeg = tiltAnim.interpolate({
    inputRange: [-2, 0, 2],
    outputRange: ["-16deg", "0deg", "16deg"],
  });

  return (
    <View style={styles.root}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>NEON CITY BLOXX</Text>
        <Text style={styles.scoreText}>SCORE: {score}</Text>
      </View>

      {/* PLAY AREA */}
      <View style={styles.playArea}>
        <Animated.View
          style={[
            styles.towerContainer,
            {
              transform: [{ rotate: towerTiltDeg }],
            },
          ]}
        >
          {renderPlatform()}
          {renderStaticBlocks()}
          {renderSwingingBlock()}
          {renderFallingBlock()}
        </Animated.View>
      </View>

      {/* DROP BUTTON */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.dropButton,
            isInputLocked && { opacity: 0.5 },
          ]}
          onPress={handleDrop}
          activeOpacity={0.8}
        >
          <Text style={styles.dropText}>DROP</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#050710",
  },
  header: {
    paddingTop: 40,
    paddingHorizontal: 24,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  title: {
    color: "#00eaff",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 2,
  },
  scoreText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  playArea: {
    flex: 1,
    paddingHorizontal: 12,
  },
  towerContainer: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#101320",
    overflow: "hidden",
  },
  platform: {
    position: "absolute",
    left: 10,
    right: 10,
    height: PLATFORM_HEIGHT,
    borderWidth: 2,
    borderColor: "#00eaff",
    borderRadius: 4,
  },
  block: {
    position: "absolute",
    width: BLOCK_SIZE,
    height: BLOCK_SIZE,
    borderWidth: 3,
    borderColor: "#00eaff",
    borderRadius: 2,
    backgroundColor: "transparent",
  },
  footer: {
    paddingBottom: 26,
    paddingTop: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dropButton: {
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#00eaff",
  },
  dropText: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
