import React from "react";
import { Pressable, StyleSheet, ViewStyle, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import AppText from "./AppText";
import { GRADIENTS, RADIUS } from "@/src/theme/colors";
import { feedback } from "@/src/utils/feedback";

const AView = Animated.createAnimatedComponent(Pressable);

type Variant = "gold" | "brand";

export default function GradientButton({
  label,
  onPress,
  icon,
  variant = "gold",
  loading = false,
  disabled = false,
  style,
  testID,
  size = 16,
}: {
  label: string;
  onPress?: () => void;
  icon?: keyof typeof Feather.glyphMap;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
  size?: number;
}) {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const colors = variant === "gold" ? GRADIENTS.gold : (["#7C5CFF", "#9333EA"] as const);
  const textColor = variant === "gold" ? "#0B0B14" : "#FFFFFF";

  return (
    <AView
      testID={testID}
      disabled={disabled || loading}
      onPressIn={() => (scale.value = withSpring(0.96))}
      onPressOut={() => (scale.value = withSpring(1))}
      onPress={() => {
        feedback.tap();
        onPress?.();
      }}
      style={[aStyle, { opacity: disabled ? 0.5 : 1 }, style]}
    >
      <LinearGradient
        colors={colors as unknown as string[]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.grad}
      >
        {loading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <>
            {icon && <Feather name={icon} size={size + 2} color={textColor} />}
            <AppText weight="bold" size={size} color={textColor}>
              {label}
            </AppText>
          </>
        )}
      </LinearGradient>
    </AView>
  );
}

const styles = StyleSheet.create({
  grad: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    paddingHorizontal: 22,
    borderRadius: RADIUS.pill,
  },
});
