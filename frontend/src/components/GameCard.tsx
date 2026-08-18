import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import AppText from "./AppText";
import { RADIUS } from "@/src/theme/colors";
import { feedback } from "@/src/utils/feedback";

const AP = Animated.createAnimatedComponent(Pressable);

export type Game = {
  key: string;
  title_ar: string;
  description_ar: string;
  status: string;
  gradient: string[];
  icon: keyof typeof Feather.glyphMap;
  rating: number;
  plays_count: number;
};

export default function GameCard({
  game,
  width,
  onPress,
}: {
  game: Game;
  width?: number;
  onPress?: () => void;
}) {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const coming = game.status === "coming_soon";

  return (
    <AP
      testID={`game-card-${game.key}`}
      onPressIn={() => (scale.value = withSpring(0.97))}
      onPressOut={() => (scale.value = withSpring(1))}
      onPress={() => {
        feedback.tap();
        onPress?.();
      }}
      style={[aStyle, width ? { width } : { flex: 1 }]}
    >
      <LinearGradient
        colors={game.gradient as string[]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.topRow}>
          <View style={styles.iconBadge}>
            <Feather name={game.icon} size={18} color="#fff" />
          </View>
          {coming ? (
            <View style={styles.comingBadge}>
              <AppText weight="bold" size={11} color="#0B0B14">
                قريباً 🚀
              </AppText>
            </View>
          ) : (
            <View style={styles.ratingBadge}>
              <Feather name="star" size={11} color="#F5B301" />
              <AppText weight="bold" size={11} color="#fff">
                {game.rating.toFixed(1)}
              </AppText>
            </View>
          )}
        </View>

        <View style={styles.iconCircle}>
          <Feather name={game.icon} size={40} color="rgba(255,255,255,0.95)" />
        </View>

        <AppText weight="black" size={17} color="#fff" numberOfLines={1}>
          {game.title_ar}
        </AppText>
        <AppText size={12} color="rgba(255,255,255,0.85)" numberOfLines={2} style={{ marginTop: 4, minHeight: 34 }}>
          {game.description_ar}
        </AppText>

        <View style={[styles.cta, coming && { opacity: 0.6 }]}>
          <Feather name={coming ? "clock" : "play"} size={13} color="#fff" />
          <AppText weight="bold" size={13} color="#fff">
            {coming ? "قريباً" : "العب الآن"}
          </AppText>
        </View>
      </LinearGradient>
    </AP>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    padding: 16,
    minHeight: 210,
  },
  topRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  comingBadge: {
    backgroundColor: "#F5B301",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  ratingBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  iconCircle: {
    marginVertical: 14,
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  cta: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.28)",
    borderRadius: RADIUS.pill,
    paddingVertical: 10,
    marginTop: 14,
  },
});
