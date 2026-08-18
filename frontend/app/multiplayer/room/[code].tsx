import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, Share } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";

import AppText from "@/src/components/AppText";
import Avatar from "@/src/components/Avatar";
import GradientButton from "@/src/components/GradientButton";
import { useTheme } from "@/src/theme/ThemeProvider";
import { useAuth } from "@/src/context/AuthContext";
import { api, WS_BASE, getToken } from "@/src/api/client";
import { RADIUS, GRADIENTS } from "@/src/theme/colors";
import { feedback } from "@/src/utils/feedback";

type Player = { id: string; username: string; ready: boolean; score: number; avatar: number };

export default function Room() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [players, setPlayers] = useState<Player[]>([]);
  const [hostId, setHostId] = useState("");
  const [phase, setPhase] = useState<"loading" | "lobby" | "question" | "scoreboard" | "over">("loading");
  const [question, setQuestion] = useState<any>(null);
  const [qIndex, setQIndex] = useState(0);
  const [qTotal, setQTotal] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctIdx, setCorrectIdx] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [winner, setWinner] = useState<Player | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const timerRef = useRef<any>(null);

  const isHost = user?.id === hostId;
  const me = players.find((p) => p.id === user?.id);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const room = await api.get(`/rooms/${code}`);
        if (!mounted) return;
        setHostId(room.host_id);
        setPlayers(room.players);
        setPhase(room.status === "waiting" ? "lobby" : "question");
      } catch {}
      const token = await getToken();
      const socket = new WebSocket(`${WS_BASE}/ws/room/${code}?token=${token}`);
      ws.current = socket;
      socket.onmessage = (ev) => {
        const msg = JSON.parse(ev.data);
        handleMessage(msg);
      };
    })();
    return () => {
      mounted = false;
      clearInterval(timerRef.current);
      try {
        ws.current?.send(JSON.stringify({ action: "leave" }));
        ws.current?.close();
      } catch {}
    };
  }, [code]);

  const handleMessage = (msg: any) => {
    if (msg.type === "room_update") {
      setPlayers(msg.players);
      if (msg.status === "waiting") setPhase("lobby");
    } else if (msg.type === "question") {
      setQuestion(msg);
      setQIndex(msg.index);
      setQTotal(msg.total);
      setCorrectIdx(null);
      setSelected(null);
      setPhase("question");
      startCountdown(msg.duration);
    } else if (msg.type === "scoreboard") {
      clearInterval(timerRef.current);
      setPlayers(msg.players);
      setCorrectIdx(msg.correct);
      setPhase("scoreboard");
    } else if (msg.type === "game_over") {
      clearInterval(timerRef.current);
      setPlayers(msg.players);
      setWinner(msg.winner);
      setPhase("over");
      feedback.win();
    }
  };

  const startCountdown = (duration: number) => {
    clearInterval(timerRef.current);
    setTimeLeft(duration);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const send = (action: string, extra: any = {}) => {
    try { ws.current?.send(JSON.stringify({ action, ...extra })); } catch {}
  };

  const answer = (choice: number) => {
    if (selected !== null) return;
    setSelected(choice);
    feedback.select();
    send("answer", { choice, time: question?.duration - timeLeft });
  };

  const invite = () => {
    feedback.tap();
    Share.share({ message: `انضم إلى غرفتي في عبقور 🎮\nرقم الغرفة: ${code}` });
  };

  // ---- render ----
  if (phase === "loading") {
    return <View style={{ flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={colors.brand} size="large" /></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, paddingTop: insets.top + 8 }}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Pressable testID="room-exit" onPress={() => router.replace("/(tabs)")} style={[styles.iconBtn, { backgroundColor: colors.surface2 }]}>
          <Feather name="x" size={20} color={colors.onSurface} />
        </Pressable>
        <AppText weight="black" size={18}>غرفة اللعب</AppText>
        <View style={{ width: 42 }} />
      </View>

      {phase === "lobby" && (
        <Animated.View entering={FadeIn} style={{ flex: 1, paddingHorizontal: 20 }}>
          <LinearGradient colors={GRADIENTS.hero as unknown as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.codeCard}>
            <AppText size={13} color="rgba(255,255,255,0.85)">رقم الغرفة</AppText>
            <AppText weight="black" size={40} color="#fff" style={{ letterSpacing: 8, marginTop: 6 }} testID="room-code">{code}</AppText>
            <Pressable testID="room-invite" onPress={invite} style={styles.inviteBtn}>
              <Feather name="share-2" size={16} color="#0B0B14" />
              <AppText weight="bold" size={13} color="#0B0B14">دعوة صديق</AppText>
            </Pressable>
          </LinearGradient>

          <AppText weight="bold" size={15} style={{ marginTop: 24, marginBottom: 12 }}>اللاعبون ({players.length}/4)</AppText>
          {players.map((p) => (
            <View key={p.id} style={[styles.playerRow, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
              <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 12 }}>
                <Avatar index={p.avatar} size={42} />
                <View>
                  <AppText weight="bold" size={14}>{p.username}{p.id === user?.id ? " (أنت)" : ""}</AppText>
                  {p.id === hostId && <AppText size={11} color={colors.gold}>👑 صاحب الغرفة</AppText>}
                </View>
              </View>
              <View style={[styles.readyBadge, { backgroundColor: p.ready ? colors.success : colors.surface3 }]}>
                <AppText weight="bold" size={11} color={p.ready ? "#fff" : colors.muted}>{p.ready ? "جاهز" : "ينتظر"}</AppText>
              </View>
            </View>
          ))}

          <View style={{ marginTop: "auto", marginBottom: insets.bottom + 20, gap: 12 }}>
            {!isHost && (
              <GradientButton label={me?.ready ? "إلغاء الاستعداد" : "أنا جاهز!"} icon="check-circle" variant={me?.ready ? "brand" : "gold"} onPress={() => { feedback.tap(); send("ready"); }} testID="room-ready-button" />
            )}
            {isHost && (
              <GradientButton label="ابدأ اللعبة" icon="play" onPress={() => { feedback.tap(); send("start"); }} testID="room-start-button" />
            )}
            {isHost && <AppText size={12} color={colors.muted} align="center">تأكد أن جميع اللاعبين جاهزون قبل البدء</AppText>}
          </View>
        </Animated.View>
      )}

      {(phase === "question" || phase === "scoreboard") && question && (
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          <View style={styles.qTop}>
            <AppText size={13} color={colors.muted}>السؤال {qIndex + 1} / {qTotal}</AppText>
            <View style={[styles.timePill, { backgroundColor: timeLeft <= 3 ? colors.error : colors.surface2 }]}>
              <Feather name="clock" size={13} color={timeLeft <= 3 ? "#fff" : colors.onSurface} />
              <AppText weight="black" size={13} color={timeLeft <= 3 ? "#fff" : colors.onSurface}>{timeLeft}</AppText>
            </View>
          </View>

          <Animated.View key={qIndex} entering={FadeIn} style={styles.qCard}>
            <AppText weight="bold" size={20} align="center" style={{ lineHeight: 32 }}>{question.text}</AppText>
          </Animated.View>

          <View style={{ gap: 12, marginTop: 20 }}>
            {question.options.map((opt: string, i: number) => {
              const showCorrect = correctIdx !== null && i === correctIdx;
              const showWrong = correctIdx !== null && selected === i && i !== correctIdx;
              const isSel = selected === i && correctIdx === null;
              let bg = colors.surface2, border = colors.border, tc = colors.onSurface;
              if (showCorrect) { bg = colors.success; border = colors.success; tc = "#fff"; }
              else if (showWrong) { bg = colors.error; border = colors.error; tc = "#fff"; }
              else if (isSel) { bg = colors.brandSoft; border = colors.brand; }
              return (
                <Pressable key={i} testID={`room-option-${i}`} disabled={selected !== null || phase === "scoreboard"} onPress={() => answer(i)} style={[styles.option, { backgroundColor: bg, borderColor: border }]}>
                  <AppText weight="bold" size={16} color={tc} style={{ flex: 1 }}>{opt}</AppText>
                  {showCorrect && <Feather name="check-circle" size={20} color="#fff" />}
                  {showWrong && <Feather name="x-circle" size={20} color="#fff" />}
                </Pressable>
              );
            })}
          </View>

          {/* live scores */}
          <View style={styles.liveScores}>
            {[...players].sort((a, b) => b.score - a.score).map((p) => (
              <View key={p.id} style={[styles.scoreChip, { backgroundColor: colors.surface2, borderColor: p.id === user?.id ? colors.brand : colors.border }]}>
                <Avatar index={p.avatar} size={22} />
                <AppText weight="bold" size={11}>{p.username}</AppText>
                <AppText weight="black" size={12} color={colors.gold}>{p.score}</AppText>
              </View>
            ))}
          </View>
        </View>
      )}

      {phase === "over" && (
        <Animated.View entering={FadeInDown} style={{ flex: 1, alignItems: "center", paddingHorizontal: 20 }}>
          <LinearGradient colors={GRADIENTS.gold as unknown as string[]} style={styles.trophy}>
            <Feather name="award" size={48} color="#0B0B14" />
          </LinearGradient>
          <AppText weight="black" size={24} style={{ marginTop: 18 }}>انتهت اللعبة! 🎉</AppText>
          {winner && <AppText weight="bold" size={16} color={colors.gold} style={{ marginTop: 8 }}>الفائز: {winner.username}</AppText>}

          <View style={{ width: "100%", marginTop: 26 }}>
            {[...players].sort((a, b) => b.score - a.score).map((p, i) => (
              <View key={p.id} style={[styles.playerRow, { backgroundColor: i === 0 ? colors.brandSoft : colors.surface2, borderColor: i === 0 ? colors.brand : colors.border }]}>
                <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 12 }}>
                  <AppText weight="black" size={16} color={colors.muted} style={{ width: 24 }}>{i + 1}</AppText>
                  <Avatar index={p.avatar} size={38} />
                  <AppText weight="bold" size={14}>{p.username}{p.id === user?.id ? " (أنت)" : ""}</AppText>
                </View>
                <AppText weight="black" size={15} color={colors.gold}>{p.score}</AppText>
              </View>
            ))}
          </View>

          <View style={{ marginTop: "auto", marginBottom: insets.bottom + 20, width: "100%" }}>
            <GradientButton label="العودة للرئيسية" icon="home" onPress={() => router.replace("/(tabs)")} testID="room-home-button" />
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 10 },
  iconBtn: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  codeCard: { borderRadius: RADIUS.lg, padding: 22, alignItems: "center" },
  inviteBtn: { flexDirection: "row-reverse", alignItems: "center", gap: 6, backgroundColor: "#F5B301", paddingHorizontal: 18, paddingVertical: 10, borderRadius: RADIUS.pill, marginTop: 14 },
  playerRow: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", padding: 12, borderRadius: RADIUS.md, borderWidth: 1, marginBottom: 10 },
  readyBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS.pill },
  qTop: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  timePill: { flexDirection: "row-reverse", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS.pill },
  qCard: { marginTop: 24, paddingHorizontal: 8 },
  option: { flexDirection: "row-reverse", alignItems: "center", gap: 10, paddingHorizontal: 18, paddingVertical: 16, borderRadius: RADIUS.md, borderWidth: 1.5 },
  liveScores: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8, marginTop: "auto", marginBottom: 24, justifyContent: "center" },
  scoreChip: { flexDirection: "row-reverse", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.pill, borderWidth: 1 },
  trophy: { width: 96, height: 96, borderRadius: 28, alignItems: "center", justifyContent: "center", marginTop: 20 },
});
