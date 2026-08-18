import React, { useCallback, useState } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";

import AppText from "@/src/components/AppText";
import { useTheme } from "@/src/theme/ThemeProvider";
import { api } from "@/src/api/client";
import { RADIUS } from "@/src/theme/colors";

type Ach = { key: string; title_ar: string; description_ar: string; icon: any; xp: number; unlocked: boolean };

export default function Achievements() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [list, setList] = useState<Ach[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    api.get("/achievements").then((a) => { setList(a); setLoading(false); }).catch(() => setLoading(false));
  }, []));

  const unlockedCount = list.filter((a) => a.unlocked).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 8 }}>
        <AppText weight="black" size={24}>الإنجازات ⭐</AppText>
        <AppText size={13} color={colors.muted} style={{ marginTop: 4 }}>
          فتحت {unlockedCount} من {list.length} إنجاز
        </AppText>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(a) => a.key}
          numColumns={2}
          columnWrapperStyle={{ gap: 14, paddingHorizontal: 20 }}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 120, gap: 14 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 50)} style={{ flex: 1 }}>
              <View style={[styles.card, { backgroundColor: colors.surface2, borderColor: item.unlocked ? colors.gold : colors.border, opacity: item.unlocked ? 1 : 0.6 }]}>
                <LinearGradient
                  colors={item.unlocked ? ["#FBBF24", "#F59E0B"] : [colors.surface3, colors.surface3]}
                  style={styles.iconWrap}
                >
                  <Feather name={item.unlocked ? item.icon : "lock"} size={24} color={item.unlocked ? "#0B0B14" : colors.muted} />
                </LinearGradient>
                <AppText weight="bold" size={14} align="center" style={{ marginTop: 10 }}>{item.title_ar}</AppText>
                <AppText size={11} color={colors.muted} align="center" numberOfLines={2} style={{ marginTop: 4, minHeight: 30 }}>{item.description_ar}</AppText>
                <View style={[styles.xpBadge, { backgroundColor: item.unlocked ? colors.brandSoft : colors.surface3 }]}>
                  <AppText weight="bold" size={11} color={item.unlocked ? colors.brand : colors.muted}>+{item.xp} XP</AppText>
                </View>
              </View>
            </Animated.View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS.md, borderWidth: 1.5, padding: 16, alignItems: "center" },
  iconWrap: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  xpBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: RADIUS.pill, marginTop: 10 },
});
