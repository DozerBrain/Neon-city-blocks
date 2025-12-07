// src/game/useNeonGameController.ts

import React, { useEffect, useRef, useState } from "react";
import { Dimensions, Animated, Easing, View } from "react-native";
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
import { styles } from "./NeonGame.styles";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get("window");

// Exposed geometry constants
export const GAME_WIDTH = SCREEN_WIDTH * 0.9;
export const GAME_HEIGHT = SCREEN_HEIGHT * 0.7;
export const PLATFORM_Y = GAME_HEIGHT - 60;
const SWING_Y = 80;

// Swing bounds
const LEFT_LIMIT = BLOCK_SIZE / 2 + 8;
const RIGHT_LIMIT = GAME_WIDTH - BLOCK_SIZE / 2 - 8;

// Animation constants
const DROP_DURATION = 450;
const SWING_DURATION = 900;
const MAX_TILT_DEG = 14;

type ControllerResult = {
  bg: string;
  playBg: string;
  neon: string;
  isNight: boolean;
  score: number;
  best: number;
  isGameOver: boolean;
  tiltDeg: Animated.AnimatedInterpolation<string | number>;
  handleToggleMode: () => void;
  handleDrop: () => void;
  handleRestartLocal: () => void;
  towerNode: React.ReactNode;
  swingNode: React.ReactNode;
};

export default function useNeonGameController(
  theme: GameTheme,
  onGameOver: (score: number) => void
): ControllerResult {
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

  // Swing animation
  const swingX = useRef(new Animated.Value(centerX)).current;
  const swingValue = useRef(centerX);
  useEffect(() => {
    const sub = swingX.addListener(({ value }) => {
      swingValue.current = value;
    });
    return () => swingX.removeListener(sub);
  }, [swingX]);

  // Falling block
  const fallingY = useRef(new Animated.Value(SWING_Y)).current;
  const fallingX = useRef(centerX);

  // Tilt animation
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
    swingX.setValue(centerX);

    const makeStep = (to: number) =>
      Animated.timing(swingX, {
        toValue: to,
        duration: SWING_DURATION,
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

  // ------------ DROP ------------
  const handleDrop = () => {
    if (isDropping || isGameOver) return;

    setIsDropping(true);
    stopSwing();

    const dropX = swingValue.current;
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

  // ------------ LAND ------------
  const handleLand = (dropX: number) => {
    const result = landBlock(blocks, dropX);

    if (result.miss) {
      triggerGameOver(score);
      return;
    }

    setBlocks(result.blocks);

    const updated = updateScore(score, best);
    setScore(updated.score);
    setBest(updated.best);

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

  // THEME COLORS
  const bg = isNight ? theme.bgNight : theme.bgDay;
  const playBg = isNight ? theme.playBgNight : theme.playBgDay;
  const neon = theme.neon;

  // ------------ RENDER PARTS ------------
  const towerNode = (
    <>
      {blocks.map((block) => {
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
      })}
    </>
  );

  const swingNode = isDropping ? (
    <Animated.View
      style={[
        styles.block,
        {
          borderColor: neon,
          width: BLOCK_SIZE,
          height: BLOCK_SIZE,
          transform: [
            { translateX: fallingX.current - BLOCK_SIZE / 2 },
            { translateY: fallingY },
          ],
        },
      ]}
    />
  ) : (
    <Animated.View
      style={[
        styles.block,
        {
          borderColor: neon,
          width: BLOCK_SIZE,
          height: BLOCK_SIZE,
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

  return {
    bg,
    playBg,
    neon,
    isNight,
    score,
    best,
    isGameOver,
    tiltDeg,
    handleToggleMode,
    handleDrop,
    handleRestartLocal,
    towerNode,
    swingNode,
  };
}
