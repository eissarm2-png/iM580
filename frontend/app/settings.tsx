import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Switch } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import AppText from "@/src/components/AppText";
import { useTheme } from "@/src/theme/ThemeProvider";
import { useAuth } from "@/src/context/AuthContext";
import { RADIUS } from "@/src/theme/colors";
import { feedback, setSoundOn, setHapticsOn, getSoundOn, getHapticsOn } from "@/src/utils/feedback";

export default function Settings() {
  const { colors, isDark, mode, setMode } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [sound, setSound] = useState(getSoundOn());
  const [haptics, setHaptics] = useState(getHapticsOn());

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, paddingTop: insets.top + 8 }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={styles.header}>
        <Pressable testID="settings-back" onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.surface2 }]}>
          <Feather name="arrow-right" size={20} color={colors.onSurface} />
        </Pressable>
        <AppText weight="black" size={20}>الإعدادات</AppText>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <AppText weight="bold" size={14} color={colors.muted} style={{ marginBottom: 12 }}>المظهر</AppText>
        <View style={[styles.card, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
          {(["dark", "light", "system"] as const).map((m, i) => (
            <Pressable key={m} testID={`theme-${m}`} onPress={() => { feedback.select(); setMode(m); }} style={[styles.themeRow, i < 2 && { borderBottomWidth: 1, borderBottomColor: colors.divider }]}>
              <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 12 }}>
                <Feather name={m === "dark" ? "moon" : m === "light" ? "sun" : "smartphone"} size={18} color={colors.onSurface} />
                <AppText size={15}>{m === "dark" ? "الوضع الداكن" : m === "light" ? "الوضع الفاتح" : "حسب النظام"}</AppText>
              </View>
              {mode === m && <Feather name="check" size={20} color={colors.brand} />}
            </Pressable>
          ))}
        </View>

        <AppText weight="bold" size={14} color={colors.muted} style={{ marginTop: 24, marginBottom: 12 }}>التفاعل</AppText>
        <View style={[styles.card, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
          <Row icon="volume-2" label="الأصوات" value={sound} onChange={(v) => { setSound(v); setSoundOn(v); feedback.tap(); }} colors={colors} border />
          <Row icon="zap" label="الاهتزاز (Haptics)" value={haptics} onChange={(v) => { setHaptics(v); setHapticsOn(v); }} colors={colors} />
        </View>

        <AppText weight="bold" size={14} color={colors.muted} style={{ marginTop: 24, marginBottom: 12 }}>الحساب</AppText>
        <View style={[styles.card, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
          <View style={[styles.themeRow, { borderBottomWidth: 1, borderBottomColor: colors.divider }]}>
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 12 }}>
              <Feather name="user" size={18} color={colors.onSurface} />
              <AppText size={15}>اسم المستخدم</AppText>
            </View>
            <AppText size={14} color={colors.muted}>{user?.username}</AppText>
          </View>
          <Pressable testID="settings-logout" onPress={() => { feedback.tap(); logout(); router.replace("/(auth)/login"); }} style={styles.themeRow}>
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 12 }}>
              <Feather name="log-out" size={18} color={colors.error} />
              <AppText size={15} color={colors.error}>تسجيل الخروج</AppText>
            </View>
          </Pressable>
        </View>

        <AppText size={12} color={colors.muted} align="center" style={{ marginTop: 30 }}>
          عبقور • الإصدار 1.0.0{"\n"}♥ تم تطوير هذا التطبيق بواسطة أبو خلف
        </AppText>
      </ScrollView>
    </View>
  );
}

function Row({ icon, label, value, onChange, colors, border }: any) {
  return (
    <View style={[styles.themeRow, border && { borderBottomWidth: 1, borderBottomColor: colors.divider }]}>
      <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 12 }}>
        <Feather name={icon} size={18} color={colors.onSurface} />
        <AppText size={15}>{label}</AppText>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.brand, false: colors.surface3 }} thumbColor="#fff" />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 8 },
  iconBtn: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  card: { borderRadius: RADIUS.md, borderWidth: 1, overflow: "hidden" },
  themeRow: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 15 },
});
