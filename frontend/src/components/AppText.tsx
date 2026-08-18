import React from "react";
import { Text, TextProps, StyleSheet, TextStyle } from "react-native";
import { useTheme } from "@/src/theme/ThemeProvider";
import { FONTS } from "@/src/theme/colors";

type Weight = "regular" | "medium" | "bold" | "black";

interface Props extends TextProps {
  weight?: Weight;
  size?: number;
  color?: string;
  align?: TextStyle["textAlign"];
}

export default function AppText({
  weight = "regular",
  size = 14,
  color,
  align = "right",
  style,
  children,
  ...rest
}: Props) {
  const { colors } = useTheme();
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: FONTS[weight],
          fontSize: size,
          color: color ?? colors.onSurface,
          textAlign: align,
          writingDirection: "rtl",
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export const _s = StyleSheet.create({});
