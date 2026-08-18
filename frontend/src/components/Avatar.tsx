import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";

const PALETTE: [string, string][] = [
  ["#7C5CFF", "#C026D3"],
  ["#F97316", "#EF4444"],
  ["#14B8A6", "#059669"],
  ["#3B82F6", "#06B6D4"],
  ["#EC4899", "#8B5CF6"],
  ["#F59E0B", "#F5B301"],
];

const ICONS: (keyof typeof Feather.glyphMap)[] = ["user", "smile", "star", "zap", "award", "coffee"];

export default function Avatar({ index = 0, size = 44 }: { index?: number; size?: number }) {
  const i = ((index % PALETTE.length) + PALETTE.length) % PALETTE.length;
  const colors = PALETTE[i];
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Feather name={ICONS[i]} size={size * 0.5} color="#fff" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
});
