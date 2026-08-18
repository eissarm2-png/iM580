import React, { useEffect, useState } from "react";
import { View, StyleSheet, Pressable, TextInput, ActivityIndicator, ScrollView } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import AppText from "@/src/components/AppText";
import GradientButton from "@/src/components/GradientButton";
import { useTheme } from "@/src/theme/ThemeProvider";
import { api } from "@/src/api/client";
import { RADIUS } from "@/src/theme/colors";
import { feedback } from "@/src/utils/feedback";

const TABS = [
  { key: "overview", label: "نظرة عامة", icon: "grid" },
  { key: "questions", label: "الأسئلة", icon: "help-circle" },
  { key: "users", label: "المستخدمون", icon: "users" },
  { key: "results", label: "النتائج", icon: "bar-chart-2" },
  { key: "notify", label: "إشعار", icon: "bell" },
];

export default function Admin() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState("overview");

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, paddingTop: insets.top + 8 }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={styles.header}>
        <Pressable testID="admin-back" onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.surface2 }]}>
          <Feather name="arrow-right" size={20} color={colors.onSurface} />
        </Pressable>
        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
          <Feather name="shield" size={18} color={colors.gold} />
          <AppText weight="black" size={20}>لوحة المسؤول</AppText>
        </View>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <Pressable key={t.key} testID={`admin-tab-${t.key}`} onPress={() => { feedback.select(); setTab(t.key); }} style={[styles.tab, { backgroundColor: active ? colors.brand : colors.surface2, borderColor: active ? colors.brand : colors.border }]}>
              <Feather name={t.icon as any} size={14} color={active ? "#fff" : colors.muted} />
              <AppText weight="bold" size={13} color={active ? "#fff" : colors.muted}>{t.label}</AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ flex: 1 }}>
        {tab === "overview" && <Overview colors={colors} />}
        {tab === "questions" && <Questions colors={colors} />}
        {tab === "users" && <Users colors={colors} />}
        {tab === "results" && <Results colors={colors} />}
        {tab === "notify" && <Notify colors={colors} />}
      </View>
    </View>
  );
}

function Overview({ colors }: any) {
  const [data, setData] = useState<any>(null);
  useEffect(() => { api.get("/admin/overview").then(setData).catch(() => {}); }, []);
  if (!data) return <ActivityIndicator color={colors.brand} style={{ marginTop: 40 }} />;
  const items = [
    { k: "users", label: "المستخدمون", icon: "users", color: "#7C5CFF" },
    { k: "questions", label: "الأسئلة", icon: "help-circle", color: "#F5B301" },
    { k: "games", label: "الألعاب", icon: "grid", color: "#EC4899" },
    { k: "categories", label: "التصنيفات", icon: "tag", color: "#10B981" },
    { k: "results", label: "النتائج", icon: "bar-chart-2", color: "#3B82F6" },
    { k: "rooms", label: "الغرف", icon: "home", color: "#F97316" },
  ];
  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 14 }}>
        {items.map((it) => (
          <View key={it.k} style={[styles.statCard, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
            <Feather name={it.icon as any} size={22} color={it.color} />
            <AppText weight="black" size={24} style={{ marginTop: 8 }}>{data[it.k] ?? 0}</AppText>
            <AppText size={12} color={colors.muted}>{it.label}</AppText>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function Questions({ colors }: any) {
  const [list, setList] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("science");
  const [text, setText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState(0);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = () => api.get("/admin/questions").then(setList).catch(() => {});
  useEffect(() => { load(); api.get("/categories").then(setCats).catch(() => {}); }, []);

  const add = async () => {
    if (!text.trim() || options.some((o) => !o.trim())) return setMsg("أكمل جميع الحقول");
    setSaving(true); setMsg("");
    try {
      await api.post("/admin/questions", { category, text: text.trim(), options: options.map((o) => o.trim()), correct, difficulty: "medium" });
      feedback.success();
      setText(""); setOptions(["", "", "", ""]); setCorrect(0); setShowForm(false);
      load();
    } catch (e: any) { setMsg(e.message); feedback.error(); }
    finally { setSaving(false); }
  };

  const del = async (id: string) => { feedback.tap(); await api.del(`/admin/questions/${id}`).catch(() => {}); load(); };

  return (
    <KeyboardAwareScrollView contentContainerStyle={{ padding: 20, paddingBottom: 80 }} bottomOffset={20}>
      <GradientButton label={showForm ? "إغلاق النموذج" : "إضافة سؤال جديد"} icon={showForm ? "x" : "plus"} variant={showForm ? "brand" : "gold"} onPress={() => setShowForm((s) => !s)} testID="admin-toggle-form" />

      {showForm && (
        <View style={[styles.form, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
          <AppText weight="bold" size={13} color={colors.muted} style={{ marginBottom: 8 }}>التصنيف</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: "row-reverse", gap: 8, marginBottom: 14 }}>
            {cats.map((c) => (
              <Pressable key={c.key} onPress={() => setCategory(c.key)} style={[styles.catChip, { backgroundColor: category === c.key ? colors.brand : colors.surface3 }]}>
                <AppText weight="bold" size={12} color={category === c.key ? "#fff" : colors.muted}>{c.name_ar}</AppText>
              </Pressable>
            ))}
          </ScrollView>
          <TextInput testID="admin-q-text" placeholder="نص السؤال" placeholderTextColor={colors.muted} value={text} onChangeText={setText} multiline style={[styles.input, { color: colors.onSurface, backgroundColor: colors.surface3, minHeight: 60 }]} />
          {options.map((o, i) => (
            <View key={i} style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8, marginTop: 10 }}>
              <Pressable testID={`admin-correct-${i}`} onPress={() => setCorrect(i)} style={[styles.radio, { borderColor: correct === i ? colors.success : colors.border, backgroundColor: correct === i ? colors.success : "transparent" }]}>
                {correct === i && <Feather name="check" size={14} color="#fff" />}
              </Pressable>
              <TextInput testID={`admin-option-${i}`} placeholder={`الخيار ${i + 1}`} placeholderTextColor={colors.muted} value={o} onChangeText={(v) => setOptions((prev) => prev.map((x, j) => (j === i ? v : x)))} style={[styles.input, { flex: 1, color: colors.onSurface, backgroundColor: colors.surface3 }]} />
            </View>
          ))}
          <AppText size={11} color={colors.muted} style={{ marginTop: 8 }}>اضغط الدائرة لتحديد الإجابة الصحيحة</AppText>
          {msg ? <AppText size={12} color={colors.error} style={{ marginTop: 6 }}>{msg}</AppText> : null}
          <GradientButton label="حفظ السؤال" icon="save" onPress={add} loading={saving} testID="admin-save-question" style={{ marginTop: 14 }} />
        </View>
      )}

      <AppText weight="bold" size={14} color={colors.muted} style={{ marginTop: 20, marginBottom: 12 }}>الأسئلة ({list.length})</AppText>
      {list.map((q) => (
        <View key={q.id} style={[styles.qItem, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <AppText weight="bold" size={13} numberOfLines={2}>{q.text}</AppText>
            <AppText size={11} color={colors.brand} style={{ marginTop: 4 }}>{q.category} • {q.options[q.correct]}</AppText>
          </View>
          <Pressable testID={`admin-del-q-${q.id}`} onPress={() => del(q.id)} hitSlop={8} style={{ padding: 6 }}>
            <Feather name="trash-2" size={18} color={colors.error} />
          </Pressable>
        </View>
      ))}
    </KeyboardAwareScrollView>
  );
}

function Users({ colors }: any) {
  const [list, setList] = useState<any[]>([]);
  const load = () => api.get("/admin/users").then(setList).catch(() => {});
  useEffect(() => { load(); }, []);
  const del = async (id: string) => { feedback.tap(); await api.del(`/admin/users/${id}`).catch(() => {}); load(); };
  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      {list.map((u) => (
        <View key={u.id} style={[styles.qItem, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <AppText weight="bold" size={14}>{u.username} {u.is_admin ? "👑" : ""}</AppText>
            <AppText size={11} color={colors.muted} style={{ marginTop: 3 }}>المستوى {u.level} • {u.total_score} نقطة • {u.games_played} جولة</AppText>
          </View>
          {!u.is_admin && (
            <Pressable testID={`admin-del-u-${u.id}`} onPress={() => del(u.id)} hitSlop={8} style={{ padding: 6 }}>
              <Feather name="trash-2" size={18} color={colors.error} />
            </Pressable>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

function Results({ colors }: any) {
  const [list, setList] = useState<any[]>([]);
  useEffect(() => { api.get("/admin/results").then(setList).catch(() => {}); }, []);
  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      {list.length === 0 && <AppText size={13} color={colors.muted} align="center" style={{ marginTop: 40 }}>لا توجد نتائج بعد</AppText>}
      {list.map((r) => (
        <View key={r.id} style={[styles.qItem, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <AppText weight="bold" size={13}>{r.username} • {r.game_key}</AppText>
            <AppText size={11} color={colors.muted} style={{ marginTop: 3 }}>{r.score} نقطة {r.total > 0 ? `• ${r.correct}/${r.total}` : ""}</AppText>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function Notify({ colors }: any) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const send = async () => {
    if (!title.trim() || !body.trim()) return setMsg("أكمل الحقول");
    setSending(true); setMsg("");
    try {
      await api.post("/admin/notifications", { title_ar: title.trim(), body_ar: body.trim(), target: "all" });
      feedback.success();
      setTitle(""); setBody(""); setMsg("✅ تم إرسال الإشعار لجميع المستخدمين");
    } catch (e: any) { setMsg(e.message); }
    finally { setSending(false); }
  };
  return (
    <KeyboardAwareScrollView contentContainerStyle={{ padding: 20 }} bottomOffset={20}>
      <AppText weight="bold" size={14} style={{ marginBottom: 12 }}>إرسال إشعار جماعي</AppText>
      <TextInput testID="admin-notif-title" placeholder="العنوان" placeholderTextColor={colors.muted} value={title} onChangeText={setTitle} style={[styles.input, { color: colors.onSurface, backgroundColor: colors.surface2, marginBottom: 12 }]} />
      <TextInput testID="admin-notif-body" placeholder="نص الإشعار" placeholderTextColor={colors.muted} value={body} onChangeText={setBody} multiline style={[styles.input, { color: colors.onSurface, backgroundColor: colors.surface2, minHeight: 100 }]} />
      {msg ? <AppText size={13} color={msg.startsWith("✅") ? colors.success : colors.error} style={{ marginTop: 10 }}>{msg}</AppText> : null}
      <GradientButton label="إرسال الإشعار" icon="send" onPress={send} loading={sending} testID="admin-send-notif" style={{ marginTop: 16 }} />
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 10 },
  iconBtn: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  tabs: { flexDirection: "row-reverse", gap: 10, paddingHorizontal: 20, paddingVertical: 6 },
  tab: { flexShrink: 0, flexDirection: "row-reverse", alignItems: "center", gap: 6, height: 40, paddingHorizontal: 16, borderRadius: RADIUS.pill, borderWidth: 1 },
  statCard: { width: "47%", flexGrow: 1, borderRadius: RADIUS.md, borderWidth: 1, padding: 18, alignItems: "flex-end" },
  form: { borderRadius: RADIUS.md, borderWidth: 1, padding: 16, marginTop: 16 },
  input: { fontFamily: "Tajawal_500Medium", fontSize: 15, textAlign: "right", borderRadius: RADIUS.sm, paddingHorizontal: 14, paddingVertical: 12 },
  catChip: { flexShrink: 0, paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.pill },
  radio: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  qItem: { flexDirection: "row-reverse", alignItems: "center", gap: 10, padding: 14, borderRadius: RADIUS.md, borderWidth: 1, marginBottom: 10 },
});
