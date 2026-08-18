import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import AppText from "@/src/components/AppText";
import Logo from "@/src/components/Logo";
import GradientButton from "@/src/components/GradientButton";
import { Field } from "./login";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/theme/ThemeProvider";
import { feedback } from "@/src/utils/feedback";

export default function Register() {
  const { colors } = useTheme();
  const { register } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (username.trim().length < 3) return setError("اسم المستخدم 3 أحرف على الأقل");
    if (password.length < 3) return setError("كلمة المرور 3 أحرف على الأقل");
    if (password !== confirm) return setError("كلمتا المرور غير متطابقتين");
    setError("");
    setLoading(true);
    try {
      await register(username.trim(), password);
      feedback.success();
      router.replace("/(tabs)");
    } catch (e: any) {
      feedback.error();
      setError(e.message || "تعذّر إنشاء الحساب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <StatusBar style="light" />
      <LinearGradient colors={["#1B1140", colors.surface]} style={StyleSheet.absoluteFill} />
      <KeyboardAwareScrollView
        contentContainerStyle={{ paddingTop: insets.top + 30, paddingBottom: 40, paddingHorizontal: 24 }}
        bottomOffset={20}
      >
        <Animated.View entering={FadeInDown.duration(500)} style={{ alignItems: "center", marginBottom: 28 }}>
          <Logo size={40} />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(120)}>
          <AppText weight="black" size={26} style={{ marginBottom: 6 }}>
            إنشاء حساب
          </AppText>
          <AppText size={14} color={colors.muted} style={{ marginBottom: 24 }}>
            انضم إلى عبقور وابدأ رحلة التحدي
          </AppText>

          <Field icon="user" placeholder="اسم المستخدم" value={username} onChangeText={setUsername} testID="register-username-input" />
          <Field icon="lock" placeholder="كلمة المرور" value={password} onChangeText={setPassword} secure testID="register-password-input" />
          <Field icon="check" placeholder="تأكيد كلمة المرور" value={confirm} onChangeText={setConfirm} secure testID="register-confirm-input" />

          {error ? (
            <AppText size={13} color={colors.error} style={{ marginTop: 4, marginBottom: 8 }}>
              {error}
            </AppText>
          ) : null}

          <GradientButton label="إنشاء الحساب" icon="user-plus" onPress={submit} loading={loading} testID="register-submit-button" style={{ marginTop: 16 }} />

          <Pressable testID="go-login-button" onPress={() => router.back()} style={{ marginTop: 22, alignItems: "center" }}>
            <AppText size={14} color={colors.muted}>
              لديك حساب بالفعل؟{" "}
              <AppText size={14} weight="bold" color={colors.brand}>
                سجّل الدخول
              </AppText>
            </AppText>
          </Pressable>
        </Animated.View>
      </KeyboardAwareScrollView>
    </View>
  );
}
