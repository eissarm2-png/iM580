import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import AppText from "@/src/components/AppText";
import Logo from "@/src/components/Logo";
import GradientButton from "@/src/components/GradientButton";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/theme/ThemeProvider";
import { RADIUS, GRADIENTS } from "@/src/theme/colors";
import { feedback } from "@/src/utils/feedback";

export default function Login() {
  const { colors } = useTheme();
  const { login } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!username.trim() || !password) {
      setError("أدخل اسم المستخدم وكلمة المرور");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(username.trim(), password);
      feedback.success();
      router.replace("/(tabs)");
    } catch (e: any) {
      feedback.error();
      setError(e.message || "تعذّر تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <StatusBar style="light" />
      <LinearGradient colors={["#1B1140", colors.surface]} style={StyleSheet.absoluteFill} />
      <KeyboardAwareScrollView
        contentContainerStyle={{ paddingTop: insets.top + 40, paddingBottom: 40, paddingHorizontal: 24 }}
        bottomOffset={20}
      >
        <Animated.View entering={FadeInDown.duration(500)} style={{ alignItems: "center", marginBottom: 36 }}>
          <Logo size={44} />
          <AppText size={16} color={colors.muted} align="center" style={{ marginTop: 16 }}>
            اختبر ذكاءك ووسّع معلوماتك
          </AppText>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(150)}>
          <AppText weight="black" size={26} style={{ marginBottom: 6 }}>
            تسجيل الدخول
          </AppText>
          <AppText size={14} color={colors.muted} style={{ marginBottom: 24 }}>
            أهلاً بعودتك! سجّل دخولك للمتابعة
          </AppText>

          <Field
            icon="user"
            placeholder="اسم المستخدم"
            value={username}
            onChangeText={setUsername}
            testID="login-username-input"
          />
          <Field
            icon="lock"
            placeholder="كلمة المرور"
            value={password}
            onChangeText={setPassword}
            secure={!show}
            rightIcon={show ? "eye-off" : "eye"}
            onRightPress={() => setShow((s) => !s)}
            testID="login-password-input"
          />

          {error ? (
            <AppText size={13} color={colors.error} style={{ marginTop: 4, marginBottom: 8 }}>
              {error}
            </AppText>
          ) : null}

          <GradientButton
            label="دخول"
            icon="log-in"
            onPress={submit}
            loading={loading}
            testID="login-submit-button"
            style={{ marginTop: 16 }}
          />

          <Pressable
            testID="go-register-button"
            onPress={() => router.push("/(auth)/register")}
            style={{ marginTop: 22, alignItems: "center" }}
          >
            <AppText size={14} color={colors.muted}>
              ليس لديك حساب؟{" "}
              <AppText size={14} weight="bold" color={colors.brand}>
                أنشئ حساباً
              </AppText>
            </AppText>
          </Pressable>
        </Animated.View>
      </KeyboardAwareScrollView>
    </View>
  );
}

export function Field({
  icon,
  placeholder,
  value,
  onChangeText,
  secure,
  rightIcon,
  onRightPress,
  testID,
}: any) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.field,
        { backgroundColor: colors.surface2, borderColor: colors.border },
      ]}
    >
      <Feather name={icon} size={18} color={colors.muted} />
      <TextInput
        testID={testID}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure}
        autoCapitalize="none"
        style={[styles.input, { color: colors.onSurface }]}
      />
      {rightIcon ? (
        <Pressable onPress={onRightPress} hitSlop={10}>
          <Feather name={rightIcon} size={18} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 14,
  },
  input: {
    flex: 1,
    fontFamily: "Tajawal_500Medium",
    fontSize: 15,
    textAlign: "right",
    height: "100%",
  },
});
