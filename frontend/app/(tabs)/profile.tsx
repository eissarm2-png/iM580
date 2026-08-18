import React, { useCallback, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";

import AppText from "@/src/components/AppText";
import Avatar from "@/src/components/Avatar";
import { useTheme } from "@/src/theme/ThemeProvider";
import { useAuth } from "@/src/context/AuthContext";
import { api } from "@/src/api/client";
import { RADIUS, GRADIENTS } from "@/src/theme/colors";
import { feedback } from "@/src/utils/feedback";

export default function Profile() {
  const { colors, isDark } = useTheme();
  const { user, logout, setUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [results, setResults] = useState<any[]>([]);
  const progress = useSharedValue(0);

  useFocusEffect(useCallback(() => {
    api.get("/auth/me").then(setUser).catch(() => {});
    api.get("/results/mine").then(setResults).catch(() => {});
  }, []));

  const pct = user ? user.level_current / Math.max(1, user.level_needed) : 0;
  progress.value = withTiming(pct, { duration: 800 });
  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  if (!user) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 120 }}>
        <View style={styles.topRow}>
          <AppText weight="black" size={22}>الملف الشخصي</AppText>
          <View style={{ flexDirection: "row-reverse", gap: 8 }}>
            {user.is_admin && (
              <Pressable testID="open-admin" onPress={() => router.push("/admin")} style={[styles.iconBtn, { backgroundColor: colors.surface2 }]}>
                <Feather name="shield" size={18} color={colors.gold} />
              </Pressable>
            )}
            <Pressable testID="open-settings" onPress={() => router.push("/settings")} style={[styles.iconBtn, { backgroundColor: colors.surface2 }]}>
              <Feather name="settings" size={18} color={colors.onSurface} />
            </Pressable>
          </View>
        </View>

        <Animated.View entering={FadeInDown.duration(500)}>
          <LinearGradient colors={GRADIENTS.hero as unknown as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.profileCard}>
            <Avatar index={user.avatar} size={80} />
            <AppText weight="black" size={22} color="#fff" style={{ marginTop: 12 }}>{user.username}</AppText>
            <View style={styles.levelPill}>
              <Feather name="zap" size={13} color="#F5B301" />
              <AppText weight="bold" size={13} color="#fff">المستوى {user.level}</AppText>
            </View>

            {/* XP bar */}
            <View style={styles.xpBarBg}>
              <Animated.View style={[styles.xpBarFill, barStyle]} />
            </View>
            <AppText size={11} color="rgba(255,255,255,0.9)" style={{ marginTop: 6 }}>
              {user.level_current} / {user.level_needed} نقطة خبرة للمستوى التالي
            </AppText>
          </LinearGradient>
        </Animated.View>

        {/* Stat cards */}
        <View style={styles.statsGrid}>
          <StatCard icon="star" color="#F5B301" value={user.total_score.toLocaleString("ar-EG")} label="مجموع النقاط" colors={colors} />
          <StatCard icon="grid" color={colors.brand} value={String(user.games_played)} label="جولات لعبت" colors={colors} />
          <StatCard icon="zap" color="#EC4899" value={String(user.xp)} label="نقاط الخبرة" colors={colors} />
          <StatCard icon="award" color="#10B981" value={user.coins.toLocaleString("ar-EG")} label="العملات" colors={colors} />
        </View>

        {/* Recent results */}
        <AppText weight="black" size={17} style={{ paddingHorizontal: 20, marginTop: 24, marginBottom: 12 }}>آخر النتائج</AppText>
        {results.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 24 }}>
            <Feather name="bar-chart-2" size={36} color={colors.muted} />
            <AppText size={13} color={colors.muted} style={{ marginTop: 10 }}>لم تلعب أي جولة بعد</AppText>
          </View>
        ) : (
          results.slice(0, 10).map((r, i) => (
            <View key={r.id || i} style={[styles.resultRow, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
              <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10 }}>
                <View style={[styles.resIcon, { backgroundColor: colors.brandSoft }]}>
                  <Feather name={gameIcon(r.game_key)} size={16} color={colors.brand} />
                </View>
                <View>
                  <AppText weight="bold" size={13}>{gameName(r.game_key)}</AppText>
                  {r.total > 0 && <AppText size={11} color={colors.muted}>{r.correct} / {r.total} صحيحة</AppText>}
                </View>
              </View>
              <AppText weight="black" size={14} color={colors.gold}>{r.score} نقطة</AppText>
            </View>
          ))
        )}

        <Pressable testID="logout-button" onPress={() => { feedback.tap(); logout(); router.replace("/(auth)/login"); }} style={[styles.logout, { borderColor: colors.error }]}>
          <Feather name="log-out" size={17} color={colors.error} />
          <AppText weight="bold" size={14} color={colors.error}>تسجيل الخروج</AppText>
        </Pressable>

        <AppText size={11} color={colors.muted} align="center" style={{ marginTop: 20 }}>
          ♥ تم تطوير هذا التطبيق بواسطة أبو خلف
        </AppText>
      </ScrollView>
    </View>
  );
}

function gameIcon(k: string): any {
  return k === "quiz" ? "help-circle" : k === "puzzle" ? "image" : k === "word" ? "type" : "play";
}
function gameName(k: string) {
  return k === "quiz" ? "كويز المعلومات" : k === "puzzle" ? "تركيب الصور" : k === "word" ? "تركيب الكلمات" : k;
}

function StatCard({ icon, color, value, label, colors }: any) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
      <Feather name={icon} size={20} color={color} />
      <AppText weight="black" size={18} style={{ marginTop: 6 }}>{value}</AppText>
      <AppText size={11} color={colors.muted}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 8 },
  iconBtn: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  profileCard: { marginHorizontal: 20, borderRadius: RADIUS.lg, padding: 22, alignItems: "center" },
  levelPill: { flexDirection: "row-reverse", alignItems: "center", gap: 6, backgroundColor: "rgba(0,0,0,0.25)", paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS.pill, marginTop: 10 },
  xpBarBg: { width: "100%", height: 10, borderRadius: 5, backgroundColor: "rgba(0,0,0,0.3)", marginTop: 16, overflow: "hidden" },
  xpBarFill: { height: "100%", borderRadius: 5, backgroundColor: "#F5B301" },
  statsGrid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 14, paddingHorizontal: 20, marginTop: 16 },
  statCard: { width: "47%", flexGrow: 1, borderRadius: RADIUS.md, borderWidth: 1, padding: 16, alignItems: "flex-end" },
  resultRow: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginHorizontal: 20, marginBottom: 10, padding: 12, borderRadius: RADIUS.md, borderWidth: 1 },
  resIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  logout: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 20, marginTop: 24, height: 52, borderRadius: RADIUS.md, borderWidth: 1.5 },
});
