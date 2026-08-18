import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "@/src/theme/ThemeProvider";

export default function Screen({
  children,
  style,
  edges = true,
  padded = false,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: boolean;
  padded?: boolean;
}) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View
        style={[
          { flex: 1, paddingTop: edges ? insets.top : 0 },
          padded && { paddingHorizontal: 16 },
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
