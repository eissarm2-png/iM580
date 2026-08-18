import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";

import AppText from "@/src/components/AppText";
import GradientButton from "@/src/components/GradientButton";
import GameResult from "@/src/components/GameResult";
import { useTheme } from "@/src/theme/ThemeProvider";
import { api } from "@/src/api/client";
import { RADIUS } from "@/src/theme/colors";
import { feedback } from "@/src/utils/feedback";

type Word = { word: string; hint: string };
type Tile = { id: number; char: string; used: boolean };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const TOTAL = 8;

export default function WordPlay() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [words, setWords] = useState<Word[]>([]);
  const [idx, setIdx] = useState(0);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [slots, setSlots] = useState<(number | null)[]>([]);
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [score, setScore] = useState(0);
  const [solved, setSolved] = useState(0);
  const [done, setDone] = useState(false);
  const [reward, setReward] = useState<any>(null);

  useEffect(() => {
    api.get(`/words?count=${TOTAL}`).then((w) => setWords(w)).catch(() => {});
  }, []);

  const word = words[idx];

  useEffect(() => {
    if (!word) return;
    const chars = word.word.split("");
    setTiles(shuffle(chars.map((c, i) => ({ id: i, char: c, used: false }))));
    setSlots(Array(chars.length).fill(null));
    setStatus("idle");
  }, [word]);

  const placeTile = (tile: Tile) => {
    if (tile.used || status !== "idle") return;
    const emptyIdx = slots.findIndex((s) => s === null);
    if (emptyIdx === -1) return;
    feedback.select();
    const newSlots = [...slots];
    newSlots[emptyIdx] = tile.id;
    setSlots(newSlots);
    setTiles((t) => t.map((x) => (x.id === tile.id ? { ...x, used: true } : x)));
    if (!newSlots.includes(null)) checkWord(newSlots);
  };

  const removeSlot = (slotIdx: number) => {
    if (status !== "idle") return;
    const tileId = slots[slotIdx];
    if (tileId === null) return;
    feedback.tap();
    const newSlots = [...slots];
    newSlots[slotIdx] = null;
    setSlots(newSlots);
    setTiles((t) => t.map((x) => (x.id === tileId ? { ...x, used: false } : x)));
  };

  const checkWord = (currentSlots: (number | null)[]) => {
    const built = currentSlots.map((id) => tiles.find((t) => t.id === id)?.char).join("");
    if (built === word.word) {
      setStatus("correct");
      setScore((s) => s + 20);
      setSolved((n) => n + 1);
      feedback.success();
      setTimeout(nextWord, 1000);
    } else {
      setStatus("wrong");
      feedback.error();
      setTimeout(() => {
        setSlots(Array(word.word.length).fill(null));
        setTiles((t) => t.map((x) => ({ ...x, used: false })));
        setStatus("idle");
      }, 800);
    }
  };

  const nextWord = () => {
    if (idx + 1 >= words.length) finish();
    else setIdx((i) => i + 1);
  };

  const finish = async () => {
    setDone(true);
    feedback.win();
    try {
      const res = await api.post("/results", { game_key: "word", score, correct: solved, total: words.length });
      setReward(res);
    } catch {}
  };

  if (words.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

  if (done) {
    return (
      <GameResult title="أحسنت!" score={score} correct={solved} total={words.length} reward={reward}
        onReplay={() => router.replace("/play/word")} onHome={() => router.replace("/(tabs)")} />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, paddingTop: insets.top + 8 }}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Pressable testID="word-exit" onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.surface2 }]}>
          <Feather name="x" size={20} color={colors.onSurface} />
        </Pressable>
        <AppText weight="bold" size={14} color={colors.muted}>كلمة {idx + 1} / {words.length}</AppText>
        <View style={[styles.scorePill, { backgroundColor: colors.surface2 }]}>
          <Feather name="star" size={14} color={colors.gold} />
          <AppText weight="black" size={14} color={colors.gold}>{score}</AppText>
        </View>
      </View>

      <Animated.View key={idx} entering={FadeIn} style={styles.hintCard}>
        <View style={[styles.hintBadge, { backgroundColor: colors.brandSoft }]}>
          <Feather name="help-circle" size={16} color={colors.brand} />
          <AppText weight="bold" size={13} color={colors.brand}>تلميح</AppText>
        </View>
        <AppText weight="bold" size={22} align="center" style={{ marginTop: 16 }}>{word.hint}</AppText>
      </Animated.View>

      {/* Slots */}
      <View style={styles.slotsRow}>
        {slots.map((tileId, i) => {
          const char = tileId !== null ? tiles.find((t) => t.id === tileId)?.char : "";
          const border = status === "correct" ? colors.success : status === "wrong" ? colors.error : colors.border;
          return (
            <Pressable key={i} onPress={() => removeSlot(i)} style={[styles.slot, { backgroundColor: colors.surface2, borderColor: char ? colors.brand : border }]}>
              <AppText weight="black" size={24} color={status === "correct" ? colors.success : colors.onSurface}>{char}</AppText>
            </Pressable>
          );
        })}
      </View>

      {/* Tiles */}
      <View style={styles.tilesRow}>
        {tiles.map((tile) => (
          <Pressable
            key={tile.id}
            testID={`word-tile-${tile.id}`}
            disabled={tile.used}
            onPress={() => placeTile(tile)}
            style={[styles.tile, { backgroundColor: tile.used ? colors.surface3 : colors.gold, opacity: tile.used ? 0.4 : 1 }]}
          >
            <AppText weight="black" size={24} color={tile.used ? colors.muted : "#0B0B14"}>{tile.char}</AppText>
          </Pressable>
        ))}
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: "auto", marginBottom: 40 }}>
        <GradientButton label="تخطّي الكلمة" variant="brand" icon="skip-forward" onPress={nextWord} testID="word-skip-button" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20 },
  iconBtn: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  scorePill: { flexDirection: "row-reverse", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.pill },
  hintCard: { alignItems: "center", marginTop: 30, paddingHorizontal: 24 },
  hintBadge: { flexDirection: "row-reverse", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS.pill },
  slotsRow: { flexDirection: "row-reverse", flexWrap: "wrap", justifyContent: "center", gap: 10, marginTop: 40, paddingHorizontal: 20 },
  slot: { width: 52, height: 60, borderRadius: RADIUS.md, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  tilesRow: { flexDirection: "row-reverse", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: 40, paddingHorizontal: 20 },
  tile: { width: 56, height: 56, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
});
