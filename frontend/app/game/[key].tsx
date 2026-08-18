import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";

import AppText from "@/src/components/AppText";
import GradientButton from "@/src/components/GradientButton";
import { useTheme } from "@/src/theme/ThemeProvider";
import { api } from "@/src/api/client";
import { Game } from "@/src/components/GameCard";
import { RADIUS } from "@/src/theme/colors";
import { feedback } from "@/src/utils/feedback";

export default function GameDetail() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [game, setGame] = useState<Game | null>(null);

  useEffect(() => {
    api.get(`/games/${key}`).then(setGame).catch(() => {});
  }, [key]);

  if (!game) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

  const coming = game.status === "coming_soon";
  const play = () => {
    feedback.tap();
    if ((game as any).multiplayer && key === "quiz") {
      // still go single by default; multiplayer via lobby
    }
    router.push(`/play/${key}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        <LinearGradient colors={game.gradient as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { paddingTop: insets.top + 8 }]}>
          <Pressable testID="game-back" onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-right" size={22} color="#fff" />
          </Pressable>
          <View style={styles.heroIcon}>
            <Feather name={game.icon} size={54} color="#fff" />
          </View>
          <AppText weight="black" size={26} color="#fff" align="center">{game.title_ar}</AppText>
          {!coming && (
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Feather name="star" size={14} color="#F5B301" />
                <AppText weight="bold" size={13} color="#fff">{game.rating.toFixed(1)}</AppText>
              </View>
              <View style={styles.heroStat}>
                <Feather name="users" size={14} color="#fff" />
                <AppText weight="bold" size={13} color="#fff">{(game.plays_count / 1000).toFixed(1)}k لعبة</AppText>
              </View>
            </View>
          )}
        </LinearGradient>

        <Animated.View entering={FadeInDown} style={{ padding: 20 }}>
          <AppText weight="black" size={18}>عن اللعبة</AppText>
          <AppText size={14} color={colors.muted} style={{ marginTop: 10, lineHeight: 24 }}>{game.description_ar}</AppText>

          <View style={[styles.infoRow, { borderColor: colors.border }]}>
            <InfoItem icon="target" title="الهدف" value={objective(key as string)} colors={colors} />
          </View>

          {(game as any).multiplayer && !coming && (
            <Pressable testID="detail-multiplayer" onPress={() => router.push("/multiplayer")} style={[styles.mpBtn, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
              <Feather name="users" size={18} color={colors.brand} />
              <AppText weight="bold" size={14} color={colors.brand}>العب مع الأصدقاء (متعدد اللاعبين)</AppText>
            </Pressable>
          )}
        </Animated.View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12, backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {coming ? (
          <View style={[styles.comingBox, { backgroundColor: colors.surface2 }]}>
            <AppText weight="bold" size={15} color={colors.gold}>قريباً 🚀</AppText>
          </View>
        ) : (
          <GradientButton label="ابدأ اللعب" icon="play" onPress={play} testID="start-play-button" />
        )}
      </View>
    </View>
  );
}

function objective(key: string) {
  return key === "quiz" ? "أجب على أكبر عدد من الأسئلة بشكل صحيح قبل انتهاء الوقت"
    : key === "puzzle" ? "أعد ترتيب قطع الصورة لتكوين الصورة الأصلية"
    : key === "word" ? "رتّب الحروف لتكوين الكلمة الصحيحة"
    : "استمتع باللعب";
}

function InfoItem({ icon, title, value, colors }: any) {
  return (
    <View style={{ flexDirection: "row-reverse", alignItems: "flex-start", gap: 10, flex: 1 }}>
      <View style={[styles.infoIcon, { backgroundColor: colors.brandSoft }]}>
        <Feather name={icon} size={16} color={colors.brand} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText weight="bold" size={13}>{title}</AppText>
        <AppText size={12} color={colors.muted} style={{ marginTop: 2 }}>{value}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 20, paddingBottom: 30, alignItems: "center", borderBottomLeftRadius: RADIUS.lg, borderBottomRightRadius: RADIUS.lg },
  backBtn: { alignSelf: "flex-end", width: 42, height: 42, borderRadius: 14, backgroundColor: "rgba(0,0,0,0.25)", alignItems: "center", justifyContent: "center" },
  heroIcon: { width: 96, height: 96, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center", marginVertical: 16 },
  heroStats: { flexDirection: "row-reverse", gap: 12, marginTop: 14 },
  heroStat: { flexDirection: "row-reverse", alignItems: "center", gap: 5, backgroundColor: "rgba(0,0,0,0.22)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.pill },
  infoRow: { flexDirection: "row-reverse", marginTop: 20, padding: 14, borderRadius: RADIUS.md, borderWidth: 1 },
  infoIcon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  mpBtn: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16, height: 52, borderRadius: RADIUS.md, borderWidth: 1 },
  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  comingBox: { alignItems: "center", justifyContent: "center", height: 54, borderRadius: RADIUS.pill },
});
