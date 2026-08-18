import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";

import AppText from "./AppText";
import GradientButton from "./GradientButton";
import { useTheme } from "@/src/theme/ThemeProvider";
import { RADIUS, GRADIENTS } from "@/src/theme/colors";

export default function GameResult({
  title,
  score,
  correct,
  total,
  reward,
  onReplay,
  onHome,
}: {
  title: string;
  score: number;
  correct?: number;
  total?: number;
  reward?: any;
  onReplay: () => void;
  onHome: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const newAch = reward?.new_achievements || [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, paddingTop: insets.top }}>
      <StatusBar style="light" />
      <View style={styles.center}>
        <Animated.View entering={ZoomIn.duration(500)}>
          <LinearGradient colors={GRADIENTS.gold as unknown as string[]} style={styles.trophy}>
            <Feather name="award" size={56} color="#0B0B14" />
          </LinearGradient>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(200)} style={{ alignItems: "center" }}>
          <AppText weight="black" size={26} style={{ marginTop: 20 }}>{title}</AppText>
          <AppText weight="black" size={44} color={colors.gold} style={{ marginTop: 8 }}>{score}</AppText>
          <AppText size={14} color={colors.muted}>نقطة</AppText>
        </Animated.View>

        {typeof correct === "number" && (
          <Animated.View entering={FadeInDown.delay(300)} style={styles.statsRow}>
            <Box label="إجابات صحيحة" value={`${correct}/${total}`} icon="check-circle" color={colors.success} colors={colors} />
            {reward && <Box label="خبرة مكتسبة" value={`+${reward.xp_earned}`} icon="zap" color={colors.brand} colors={colors} />}
            {reward && <Box label="عملات" value={`+${reward.coins_earned}`} icon="star" color={colors.gold} colors={colors} />}
          </Animated.View>
        )}

        {newAch.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400)} style={[styles.achBox, { backgroundColor: colors.brandSoft, borderColor: colors.brand }]}>
            <Feather name="unlock" size={18} color={colors.brand} />
            <AppText weight="bold" size={13} color={colors.brand}>
              إنجاز جديد: {newAch.map((a: any) => a.title_ar).join("، ")}
            </AppText>
          </Animated.View>
        )}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <GradientButton label="العب مرة أخرى" icon="refresh-cw" onPress={onReplay} testID="result-replay-button" />
        <GradientButton label="العودة للرئيسية" icon="home" variant="brand" onPress={onHome} testID="result-home-button" style={{ marginTop: 12 }} />
      </View>
    </View>
  );
}

function Box({ label, value, icon, color, colors }: any) {
  return (
    <View style={[styles.box, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
      <Feather name={icon} size={18} color={color} />
      <AppText weight="black" size={16} style={{ marginTop: 4 }}>{value}</AppText>
      <AppText size={10} color={colors.muted}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  trophy: { width: 110, height: 110, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row-reverse", gap: 10, marginTop: 28 },
  box: { alignItems: "center", borderRadius: RADIUS.md, borderWidth: 1, paddingVertical: 14, paddingHorizontal: 8, minWidth: 90 },
  achBox: { flexDirection: "row-reverse", alignItems: "center", gap: 8, marginTop: 20, paddingHorizontal: 16, paddingVertical: 12, borderRadius: RADIUS.md, borderWidth: 1 },
  footer: { paddingHorizontal: 20 },
});
