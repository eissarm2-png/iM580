import React, { useCallback, useState } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";

import AppText from "@/src/components/AppText";
import Avatar from "@/src/components/Avatar";
import { useTheme } from "@/src/theme/ThemeProvider";
import { api } from "@/src/api/client";
import { RADIUS } from "@/src/theme/colors";

type Row = { rank: number; id: string; username: string; total_score: number; level: number; avatar: number; is_me: boolean };

export default function Leaderboard() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [board, setBoard] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    api.get("/leaderboard").then((b) => { setBoard(b); setLoading(false); }).catch(() => setLoading(false));
  }, []));

  const podium = board.slice(0, 3);
  const rest = board.slice(3);
  const order = [podium[1], podium[0], podium[2]].filter(Boolean); // 2nd,1st,3rd
  const heights = [96, 128, 80];
  const medals = ["#C0C0C0", "#F5B301", "#CD7F32"];

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 10 }}>
        <AppText weight="black" size={24}>التصنيف 🏆</AppText>
        <AppText size={13} color={colors.muted} style={{ marginTop: 4 }}>أفضل اللاعبين حسب النقاط</AppText>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={rest}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.podiumWrap}>
              {order.map((p) => {
                if (!p) return null;
                const actualPos = p.rank; // 1,2,3
                const idx = actualPos === 1 ? 1 : actualPos === 2 ? 0 : 2;
                return (
                  <Animated.View key={p.id} entering={FadeInDown.delay(actualPos * 100)} style={styles.podiumItem}>
                    <View style={{ position: "relative" }}>
                      <Avatar index={p.avatar} size={actualPos === 1 ? 68 : 54} />
                      <View style={[styles.crownBadge, { backgroundColor: medals[actualPos - 1] }]}>
                        <AppText weight="black" size={11} color="#0B0B14">{actualPos}</AppText>
                      </View>
                    </View>
                    <AppText weight="bold" size={13} numberOfLines={1} style={{ marginTop: 8, maxWidth: 90 }} align="center">{p.username}</AppText>
                    <AppText weight="bold" size={12} color={colors.gold}>{p.total_score.toLocaleString("ar-EG")}</AppText>
                    <LinearGradient colors={actualPos === 1 ? ["#7C5CFF", "#C026D3"] : [colors.surface2, colors.surface3]} style={[styles.pillar, { height: heights[idx] }]}>
                      <Feather name={actualPos === 1 ? "award" : "star"} size={20} color={actualPos === 1 ? "#F5B301" : colors.muted} />
                    </LinearGradient>
                  </Animated.View>
                );
              })}
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 40)} style={[styles.row, { backgroundColor: item.is_me ? colors.brandSoft : colors.surface2, borderColor: item.is_me ? colors.brand : colors.border }]}>
              <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 12, flex: 1 }}>
                <AppText weight="black" size={15} color={colors.muted} style={{ width: 28 }}>{item.rank}</AppText>
                <Avatar index={item.avatar} size={40} />
                <View>
                  <AppText weight="bold" size={14}>{item.username}{item.is_me ? " (أنت)" : ""}</AppText>
                  <AppText size={11} color={colors.muted}>المستوى {item.level}</AppText>
                </View>
              </View>
              <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4 }}>
                <Feather name="star" size={13} color={colors.gold} />
                <AppText weight="black" size={14} color={colors.gold}>{item.total_score.toLocaleString("ar-EG")}</AppText>
              </View>
            </Animated.View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  podiumWrap: { flexDirection: "row-reverse", alignItems: "flex-end", justifyContent: "center", gap: 10, marginVertical: 24 },
  podiumItem: { alignItems: "center", flex: 1 },
  crownBadge: { position: "absolute", bottom: -6, alignSelf: "center", width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#0B0B14" },
  pillar: { width: "100%", borderTopLeftRadius: RADIUS.md, borderTopRightRadius: RADIUS.md, marginTop: 12, alignItems: "center", justifyContent: "flex-start", paddingTop: 12 },
  row: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", padding: 12, borderRadius: RADIUS.md, borderWidth: 1, marginBottom: 10 },
});
