import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AppText from "./AppText";

export default function Logo({ size = 34 }: { size?: number }) {
  return (
    <View style={styles.row}>
      <AppText weight="black" size={size} color="#FFFFFF">
        عبقور
      </AppText>
      <LinearGradient
        colors={["#7C5CFF", "#C026D3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.badge, { width: size * 1.35, height: size * 1.35, borderRadius: size * 0.4 }]}
      >
        <MaterialCommunityIcons name="brain" size={size * 0.85} color="#F5B301" />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  badge: { alignItems: "center", justifyContent: "center" },
});
