import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";

import AppText from "@/src/components/AppText";
import { useTheme } from "@/src/theme/ThemeProvider";
import { api } from "@/src/api/client";
import { RADIUS } from "@/src/theme/colors";

export default function Notifications() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    api.get("/notifications").then((n) => {
      setItems(n);
      api.post("/notifications/read").catch(() => {});
    }).catch(() => {});
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, paddingTop: insets.top + 8 }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={styles.header}>
        <Pressable testID="notif-back" onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.surface2 }]}>
          <Feather name="arrow-right" size={20} color={colors.onSurface} />
        </Pressable>
        <AppText weight="black" size={20}>الإشعارات</AppText>
        <View style={{ width: 42 }} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 80 }}>
            <Feather name="bell-off" size={44} color={colors.muted} />
            <AppText size={14} color={colors.muted} style={{ marginTop: 14 }}>لا توجد إشعارات بعد</AppText>
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50)} style={[styles.card, { backgroundColor: colors.surface2, borderColor: item.read ? colors.border : colors.brand }]}>
            <View style={[styles.icon, { backgroundColor: colors.brandSoft }]}>
              <Feather name="bell" size={18} color={colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText weight="bold" size={14}>{item.title_ar}</AppText>
              <AppText size={13} color={colors.muted} style={{ marginTop: 4, lineHeight: 20 }}>{item.body_ar}</AppText>
            </View>
          </Animated.View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 8 },
  iconBtn: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  card: { flexDirection: "row-reverse", gap: 12, padding: 14, borderRadius: RADIUS.md, borderWidth: 1.5, marginBottom: 12 },
  icon: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
});
