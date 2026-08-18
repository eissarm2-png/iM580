import React, { useCallback, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, RefreshControl, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";

import AppText from "@/src/components/AppText";
import Logo from "@/src/components/Logo";
import Avatar from "@/src/components/Avatar";
import GameCard, { Game } from "@/src/components/GameCard";
import GradientButton from "@/src/components/GradientButton";
import { useTheme } from "@/src/theme/ThemeProvider";
import { useAuth } from "@/src/context/AuthContext";
import { api } from "@/src/api/client";
import { RADIUS, GRADIENTS, SPACING } from "@/src/theme/colors";
import { feedback } from "@/src/utils/feedback";

export default function Home() {
  const { colors, isDark } = useTheme();
  const { user, setUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api.get("/home");
      setData(d);
      if (d.user) setUser(d.user);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const featured: Game[] = data?.featured || [];
  const upcoming: Game[] = data?.upcoming || [];
  const stats = data?.stats;

  const openGame = (g: Game) => {
    if (g.status === "coming_soon") return;
    router.push(`/game/${g.key}`);
  };

  if (loading && !data) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.brand} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable testID="home-avatar" onPress={() => router.push("/(tabs)/profile")}>
            <Avatar index={user?.avatar || 0} size={46} />
          </Pressable>
          <Logo size={26} />
          <View style={styles.headerLeft}>
            <Pressable testID="home-notifications" onPress={() => { feedback.tap(); router.push("/notifications"); }} style={[styles.iconBtn, { backgroundColor: colors.surface2 }]}>
              <Feather name="bell" size={19} color={colors.onSurface} />
              <View style={[styles.dot, { backgroundColor: colors.error }]} />
            </Pressable>
          </View>
        </View>

        {/* Coins */}
        <View style={styles.coinsRow}>
          <LinearGradient colors={["#2A2140", colors.surface2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.coinsPill, { borderColor: colors.border }]}>
            <MaterialCommunityIcons name="star-four-points" size={16} color="#F5B301" />
            <AppText weight="bold" size={14} color={colors.onSurface}>
              {(user?.coins || 0).toLocaleString("ar-EG")}
            </AppText>
          </LinearGradient>
        </View>

        {/* Search + play with friends */}
        <View style={styles.searchRow}>
          <Pressable testID="home-search" onPress={() => router.push("/(tabs)/games")} style={[styles.search, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
            <Feather name="search" size={18} color={colors.muted} />
            <AppText size={14} color={colors.muted}>ابحث عن الألعاب...</AppText>
          </Pressable>
          <Pressable testID="home-multiplayer" onPress={() => { feedback.tap(); router.push("/multiplayer"); }}>
            <LinearGradient colors={["#7C5CFF", "#9333EA"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.friendsPill}>
              <Feather name="users" size={16} color="#fff" />
              <AppText weight="bold" size={12} color="#fff">الأصدقاء</AppText>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Hero */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <LinearGradient colors={GRADIENTS.hero as unknown as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <View style={styles.heroMascot}>
              <MaterialCommunityIcons name="brain" size={72} color="#F5B301" />
            </View>
            <View style={{ flex: 1 }}>
              <AppText weight="black" size={22} color="#fff">مرحباً {user?.username} 👋</AppText>
              <AppText size={13} color="rgba(255,255,255,0.9)" style={{ marginTop: 6, marginBottom: 16 }}>
                اختبر ذكاءك، ووسّع معلوماتك، واستمتع بأقوى الألعاب الذهنية!
              </AppText>
              <GradientButton label="ابدأ اللعب الآن" icon="play" variant="gold" size={14} onPress={() => router.push("/game/quiz")} testID="hero-start-button" />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Stats strip */}
        {stats && (
          <Animated.View entering={FadeIn.delay(150)} style={[styles.statsStrip, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
            <Stat icon="star" color="#F5B301" value={stats.rating.toFixed(1)} label="التقييم" colors={colors} />
            <Divider colors={colors} />
            <Stat icon="users" color={colors.brand} value={stats.active_users.toLocaleString("ar-EG")} label="لاعب" colors={colors} />
            <Divider colors={colors} />
            <Stat icon="grid" color="#EC4899" value={String(stats.games_count)} label="ألعاب" colors={colors} />
            <Divider colors={colors} />
            <Stat icon="award" color="#F5B301" value={`#${stats.rank}`} label="ترتيبك" colors={colors} />
          </Animated.View>
        )}

        {/* Featured */}
        <SectionHeader title="الألعاب المميزة" emoji="🔥" onSeeAll={() => router.push("/(tabs)/games")} colors={colors} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
          {featured.map((g, i) => (
            <Animated.View key={g.key} entering={FadeInDown.delay(i * 80)}>
              <GameCard game={g} width={260} onPress={() => openGame(g)} />
            </Animated.View>
          ))}
        </ScrollView>

        {/* Upcoming */}
        <SectionHeader title="الألعاب القادمة" emoji="🚀" colors={colors} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
          {upcoming.map((g, i) => (
            <Animated.View key={g.key} entering={FadeInDown.delay(i * 60)}>
              <UpcomingCard game={g} colors={colors} />
            </Animated.View>
          ))}
        </ScrollView>

        <AppText size={12} color={colors.muted} align="center" style={{ marginTop: 28 }}>
          ♥ تم تطوير هذا التطبيق بواسطة أبو خلف
        </AppText>
      </ScrollView>
    </View>
  );
}

function Stat({ icon, color, value, label, colors }: any) {
  return (
    <View style={styles.stat}>
      <Feather name={icon} size={18} color={color} />
      <AppText weight="black" size={16} color={colors.onSurface} style={{ marginTop: 4 }}>{value}</AppText>
      <AppText size={10} color={colors.muted}>{label}</AppText>
    </View>
  );
}
const Divider = ({ colors }: any) => <View style={{ width: 1, height: 34, backgroundColor: colors.border }} />;

export function SectionHeader({ title, emoji, onSeeAll, colors }: any) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6 }}>
        <AppText weight="black" size={18} color={colors.onSurface}>{title}</AppText>
        {emoji ? <AppText size={16}>{emoji}</AppText> : null}
      </View>
      {onSeeAll && (
        <Pressable onPress={onSeeAll} style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4 }}>
          <AppText weight="bold" size={13} color={colors.brand}>عرض الكل</AppText>
          <Feather name="chevron-left" size={16} color={colors.brand} />
        </Pressable>
      )}
    </View>
  );
}

function UpcomingCard({ game, colors }: { game: Game; colors: any }) {
  return (
    <View style={[styles.upcoming, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
      <LinearGradient colors={game.gradient as string[]} style={styles.upcomingIcon}>
        <Feather name={game.icon} size={22} color="#fff" />
      </LinearGradient>
      <AppText weight="bold" size={13} color={colors.onSurface} numberOfLines={1} align="center" style={{ marginTop: 10 }}>
        {game.title_ar}
      </AppText>
      <View style={styles.upcomingBadge}>
        <AppText weight="bold" size={10} color="#0B0B14">قريباً 🚀</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, height: 52 },
  headerLeft: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  iconBtn: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  dot: { position: "absolute", top: 9, right: 10, width: 8, height: 8, borderRadius: 4 },
  coinsRow: { flexDirection: "row-reverse", paddingHorizontal: 20, marginTop: 10 },
  coinsPill: { flexDirection: "row-reverse", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.pill, borderWidth: 1 },
  searchRow: { flexDirection: "row-reverse", alignItems: "center", gap: 10, paddingHorizontal: 20, marginTop: 14 },
  search: { flex: 1, flexDirection: "row-reverse", alignItems: "center", gap: 8, height: 50, borderRadius: RADIUS.md, borderWidth: 1, paddingHorizontal: 14 },
  friendsPill: { flexDirection: "row-reverse", alignItems: "center", gap: 6, height: 50, borderRadius: RADIUS.md, paddingHorizontal: 16 },
  hero: { flexDirection: "row-reverse", gap: 12, marginHorizontal: 20, marginTop: 18, borderRadius: RADIUS.lg, padding: 18, overflow: "hidden" },
  heroMascot: { width: 96, height: 96, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center", alignSelf: "center" },
  statsStrip: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginHorizontal: 20, marginTop: 16, borderRadius: RADIUS.md, borderWidth: 1, paddingVertical: 14, paddingHorizontal: 8 },
  stat: { alignItems: "center", flex: 1 },
  sectionHeader: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginTop: 26, marginBottom: 14 },
  hList: { flexDirection: "row-reverse", paddingHorizontal: 20, gap: 14 },
  upcoming: { width: 130, borderRadius: RADIUS.md, borderWidth: 1, padding: 14, alignItems: "center" },
  upcomingIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  upcomingBadge: { backgroundColor: "#F5B301", paddingHorizontal: 12, paddingVertical: 4, borderRadius: RADIUS.pill, marginTop: 10 },
});
