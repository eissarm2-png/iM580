import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, Pressable, Dimensions } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import AppText from "@/src/components/AppText";
import GradientButton from "@/src/components/GradientButton";
import GameResult from "@/src/components/GameResult";
import { useTheme } from "@/src/theme/ThemeProvider";
import { api } from "@/src/api/client";
import { RADIUS } from "@/src/theme/colors";
import { feedback } from "@/src/utils/feedback";

const GRID = 3;
const EMPTY = GRID * GRID - 1;
const SIZE = Math.min(Dimensions.get("window").width - 40, 340);
const TILE = SIZE / GRID;

const IMAGES = [
  "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=600&q=80",
  "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=600&q=80",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80",
];

function isSolved(b: number[]) {
  return b.every((v, i) => v === i);
}
function neighbors(i: number) {
  const r = Math.floor(i / GRID), c = i % GRID;
  const res: number[] = [];
  if (r > 0) res.push(i - GRID);
  if (r < GRID - 1) res.push(i + GRID);
  if (c > 0) res.push(i - 1);
  if (c < GRID - 1) res.push(i + 1);
  return res;
}
function scramble(): number[] {
  let b = Array.from({ length: GRID * GRID }, (_, i) => i);
  let empty = EMPTY;
  for (let k = 0; k < 120; k++) {
    const n = neighbors(empty);
    const pick = n[Math.floor(Math.random() * n.length)];
    [b[empty], b[pick]] = [b[pick], b[empty]];
    empty = pick;
  }
  return isSolved(b) ? scramble() : b;
}

export default function PuzzlePlay() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const image = useMemo(() => IMAGES[Math.floor(Math.random() * IMAGES.length)], []);
  const [board, setBoard] = useState<number[]>(() => scramble());
  const [moves, setMoves] = useState(0);
  const [done, setDone] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const [reward, setReward] = useState<any>(null);

  const emptyPos = board.indexOf(EMPTY);

  const tap = (pos: number) => {
    if (done) return;
    if (!neighbors(emptyPos).includes(pos)) return;
    feedback.select();
    const nb = [...board];
    [nb[pos], nb[emptyPos]] = [nb[emptyPos], nb[pos]];
    setBoard(nb);
    setMoves((m) => m + 1);
    if (isSolved(nb)) finish(moves + 1);
  };

  const finish = async (finalMoves: number) => {
    setDone(true);
    setShowFull(true);
    feedback.win();
    const score = Math.max(50, 400 - finalMoves * 5);
    try {
      const res = await api.post("/results", { game_key: "puzzle", score, correct: 1, total: 1, details: { moves: finalMoves } });
      setReward(res);
    } catch {}
    setTimeout(() => setDone2(true), 1400);
  };
  const [done2, setDone2] = useState(false);

  if (done2) {
    const score = Math.max(50, 400 - moves * 5);
    return (
      <GameResult title="اكتملت الصورة!" score={score} reward={reward}
        onReplay={() => router.replace("/play/puzzle")} onHome={() => router.replace("/(tabs)")} />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, paddingTop: insets.top + 8 }}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Pressable testID="puzzle-exit" onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.surface2 }]}>
          <Feather name="x" size={20} color={colors.onSurface} />
        </Pressable>
        <View style={[styles.movePill, { backgroundColor: colors.surface2 }]}>
          <Feather name="move" size={14} color={colors.brand} />
          <AppText weight="black" size={14}>{moves} حركة</AppText>
        </View>
        <Pressable testID="puzzle-preview" onPressIn={() => setShowFull(true)} onPressOut={() => !done && setShowFull(false)} style={[styles.iconBtn, { backgroundColor: colors.surface2 }]}>
          <Feather name="eye" size={18} color={colors.onSurface} />
        </Pressable>
      </View>

      <AppText size={13} color={colors.muted} align="center" style={{ marginTop: 12 }}>
        رتّب القطع لتكوين الصورة — اضغط مطوّلاً على 👁 للمعاينة
      </AppText>

      <View style={styles.boardWrap}>
        <View style={[styles.board, { width: SIZE, height: SIZE, backgroundColor: colors.surface2 }]}>
          {board.map((val, pos) => {
            const posRow = Math.floor(pos / GRID), posCol = pos % GRID;
            if (val === EMPTY && !showFull) {
              return <View key={pos} style={{ position: "absolute", left: posCol * TILE, top: posRow * TILE, width: TILE, height: TILE }} />;
            }
            const origRow = Math.floor(val / GRID), origCol = val % GRID;
            return (
              <Pressable
                key={pos}
                testID={`puzzle-tile-${pos}`}
                onPress={() => tap(pos)}
                style={{ position: "absolute", left: posCol * TILE, top: posRow * TILE, width: TILE, height: TILE, overflow: "hidden", borderWidth: 0.5, borderColor: "rgba(0,0,0,0.2)" }}
              >
                <Image
                  source={{ uri: image }}
                  style={{ width: SIZE, height: SIZE, transform: [{ translateX: -origCol * TILE }, { translateY: -origRow * TILE }] }}
                  contentFit="cover"
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: "auto", marginBottom: 40 }}>
        <GradientButton label="خلط جديد" variant="brand" icon="shuffle" onPress={() => { feedback.tap(); setBoard(scramble()); setMoves(0); }} testID="puzzle-shuffle-button" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20 },
  iconBtn: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  movePill: { flexDirection: "row-reverse", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.pill },
  boardWrap: { alignItems: "center", marginTop: 30 },
  board: { borderRadius: RADIUS.md, overflow: "hidden" },
});
