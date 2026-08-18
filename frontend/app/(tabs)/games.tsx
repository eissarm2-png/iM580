import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, TextInput, FlatList } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";

import AppText from "@/src/components/AppText";
import GameCard, { Game } from "@/src/components/GameCard";
import { useTheme } from "@/src/theme/ThemeProvider";
import { api } from "@/src/api/client";
import { RADIUS } from "@/src/theme/colors";
import { feedback } from "@/src/utils/feedback";

const FILTERS = [
  { key: "all", label: "الكل" },
  { key: "active", label: "متاحة الآن" },
  { key: "coming_soon", label: "قريباً" },
];

export default function Games() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [games, setGames] = useState<Game[]>([]);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    api.get("/games").then(setGames).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    return games.filter((g) => {
      const matchFilter = filter === "all" ? true : g.status === filter;
      const matchQuery = query.trim() ? g.title_ar.includes(query.trim()) : true;
      return matchFilter && matchQuery;
    });
  }, [games, filter, query]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      {/* Sticky header */}
      <View style={{ paddingTop: insets.top + 8, backgroundColor: colors.surface }}>
        <AppText weight="black" size={24} style={{ paddingHorizontal: 20 }}>الألعاب</AppText>
        <View style={styles.searchRow}>
          <View style={[styles.search, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
            <Feather name="search" size={18} color={colors.muted} />
            <TextInput
              testID="games-search-input"
              placeholder="ابحث عن لعبة..."
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={setQuery}
              style={[styles.input, { color: colors.onSurface }]}
            />
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                testID={`filter-${f.key}`}
                onPress={() => { feedback.select(); setFilter(f.key); }}
                style={[styles.chip, { backgroundColor: active ? colors.brand : colors.surface2, borderColor: active ? colors.brand : colors.border }]}
              >
                <AppText weight="bold" size={13} color={active ? "#fff" : colors.muted}>{f.label}</AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(g) => g.key}
        numColumns={2}
        columnWrapperStyle={{ gap: 14, paddingHorizontal: 20 }}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 120, gap: 14 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50)} style={{ flex: 1 }}>
            <GameCard game={item} onPress={() => item.status === "active" && router.push(`/game/${item.key}`)} />
          </Animated.View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Feather name="inbox" size={40} color={colors.muted} />
            <AppText size={14} color={colors.muted} style={{ marginTop: 12 }}>لا توجد ألعاب مطابقة</AppText>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: { paddingHorizontal: 20, marginTop: 14 },
  search: { flexDirection: "row-reverse", alignItems: "center", gap: 8, height: 50, borderRadius: RADIUS.md, borderWidth: 1, paddingHorizontal: 14 },
  input: { flex: 1, fontFamily: "Tajawal_500Medium", fontSize: 15, textAlign: "right", height: "100%" },
  chips: { flexDirection: "row-reverse", gap: 10, paddingHorizontal: 20, paddingVertical: 14 },
  chip: { flexShrink: 0, height: 36, justifyContent: "center", paddingHorizontal: 18, borderRadius: RADIUS.pill, borderWidth: 1 },
});
