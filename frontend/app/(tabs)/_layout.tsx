import React from "react";
import { View, Pressable, StyleSheet, Platform } from "react-native";
import { Tabs } from "expo-router";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

import AppText from "@/src/components/AppText";
import { useTheme } from "@/src/theme/ThemeProvider";
import { feedback } from "@/src/utils/feedback";

const TABS: { name: string; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { name: "index", label: "الرئيسية", icon: "home" },
  { name: "games", label: "الألعاب", icon: "grid" },
  { name: "leaderboard", label: "التصنيف", icon: "award" },
  { name: "achievements", label: "الإنجازات", icon: "star" },
  { name: "profile", label: "الملف", icon: "user" },
];

function TabBar({ state, navigation }: BottomTabBarProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.wrap}>
      <BlurView
        intensity={isDark ? 40 : 60}
        tint={isDark ? "dark" : "light"}
        style={[
          styles.bar,
          {
            paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
            backgroundColor: isDark ? "rgba(11,11,20,0.85)" : "rgba(255,255,255,0.9)",
            borderTopColor: colors.border,
          },
        ]}
      >
        {state.routes
          .filter((r) => TABS.some((t) => t.name === r.name))
          .map((route) => {
            const cfg = TABS.find((t) => t.name === route.name)!;
            const routeIndex = state.routes.findIndex((r) => r.key === route.key);
            const focused = state.index === routeIndex;
            const color = focused ? colors.brand : colors.tabInactive;
            return (
              <Pressable
                key={route.key}
                testID={`tab-${cfg.name}`}
                style={styles.item}
                onPress={() => {
                  feedback.select();
                  const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                  if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
                }}
              >
                <Feather name={cfg.icon} size={22} color={color} />
                <AppText weight={focused ? "bold" : "medium"} size={10} color={color} style={{ marginTop: 3 }}>
                  {cfg.label}
                </AppText>
                {focused && (
                  <Animated.View entering={FadeIn} style={[styles.indicator, { backgroundColor: colors.brand }]} />
                )}
              </Pressable>
            );
          })}
      </BlurView>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="games" />
      <Tabs.Screen name="leaderboard" />
      <Tabs.Screen name="achievements" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", bottom: 0, left: 0, right: 0 },
  bar: {
    flexDirection: "row-reverse",
    justifyContent: "space-around",
    alignItems: "flex-start",
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    ...Platform.select({ web: { paddingBottom: 12 } as any }),
  },
  item: { alignItems: "center", justifyContent: "center", flex: 1, gap: 0 },
  indicator: { position: "absolute", top: -10, width: 26, height: 3, borderRadius: 3 },
});
