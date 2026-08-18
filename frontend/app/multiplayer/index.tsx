import React, { useState } from "react";
import { View, StyleSheet, Pressable, TextInput } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";

import AppText from "@/src/components/AppText";
import GradientButton from "@/src/components/GradientButton";
import { useTheme } from "@/src/theme/ThemeProvider";
import { api } from "@/src/api/client";
import { RADIUS, GRADIENTS } from "@/src/theme/colors";
import { feedback } from "@/src/utils/feedback";

export default function MultiplayerLobby() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  const createRoom = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/rooms", { game_key: "quiz" });
      feedback.success();
      router.replace(`/multiplayer/room/${res.code}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async () => {
    if (code.trim().length < 6) return setError("أدخل رقم غرفة صحيح (6 أرقام)");
    setJoining(true);
    setError("");
    try {
      await api.post(`/rooms/${code.trim()}/join`);
      feedback.success();
      router.replace(`/multiplayer/room/${code.trim()}`);
    } catch (e: any) {
      feedback.error();
      setError(e.message);
    } finally {
      setJoining(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <StatusBar style="light" />
      <KeyboardAwareScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 40 }} bottomOffset={20}>
        <View style={styles.header}>
          <Pressable testID="mp-back" onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.surface2 }]}>
            <Feather name="arrow-right" size={20} color={colors.onSurface} />
          </Pressable>
          <AppText weight="black" size={20}>اللعب مع الأصدقاء</AppText>
          <View style={{ width: 42 }} />
        </View>

        <Animated.View entering={FadeInDown.duration(400)} style={{ paddingHorizontal: 20, marginTop: 10 }}>
          <LinearGradient colors={GRADIENTS.hero as unknown as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
            <Feather name="users" size={40} color="#fff" />
            <AppText weight="black" size={20} color="#fff" align="center" style={{ marginTop: 12 }}>تحدَّ أصدقاءك مباشرة!</AppText>
            <AppText size={13} color="rgba(255,255,255,0.9)" align="center" style={{ marginTop: 6 }}>
              أنشئ غرفة وشارك الرقم، أو انضم لغرفة صديقك والعبوا كويز جماعي لحظياً
            </AppText>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120)} style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <GradientButton label="إنشاء غرفة جديدة" icon="plus-circle" onPress={createRoom} loading={loading} testID="mp-create-button" />

          <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 12, marginVertical: 24 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            <AppText size={13} color={colors.muted}>أو انضم برقم غرفة</AppText>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          </View>

          <View style={[styles.codeInput, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
            <Feather name="hash" size={20} color={colors.muted} />
            <TextInput
              testID="mp-code-input"
              placeholder="رقم الغرفة"
              placeholderTextColor={colors.muted}
              value={code}
              onChangeText={(t) => setCode(t.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              maxLength={6}
              style={[styles.codeText, { color: colors.onSurface }]}
            />
          </View>

          {error ? <AppText size={13} color={colors.error} style={{ marginTop: 10 }}>{error}</AppText> : null}

          <GradientButton label="انضمام" icon="log-in" variant="brand" onPress={joinRoom} loading={joining} testID="mp-join-button" style={{ marginTop: 16 }} />
        </Animated.View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 8 },
  iconBtn: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  banner: { borderRadius: RADIUS.lg, padding: 24, alignItems: "center" },
  codeInput: { flexDirection: "row-reverse", alignItems: "center", gap: 10, height: 64, borderRadius: RADIUS.md, borderWidth: 1, paddingHorizontal: 18 },
  codeText: { flex: 1, fontFamily: "Tajawal_800ExtraBold", fontSize: 24, textAlign: "center", letterSpacing: 6 },
});
