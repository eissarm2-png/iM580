import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";

import AppText from "@/src/components/AppText";
import GradientButton from "@/src/components/GradientButton";
import GameResult from "@/src/components/GameResult";
import { useTheme } from "@/src/theme/ThemeProvider";
import { api } from "@/src/api/client";
import { RADIUS } from "@/src/theme/colors";
import { feedback } from "@/src/utils/feedback";

const QUESTION_TIME = 15;

type Q = { text: string; options: string[]; correct: number; category: string };

export default function QuizPlay() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [questions, setQuestions] = useState<Q[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);
  const [time, setTime] = useState(QUESTION_TIME);
  const [reward, setReward] = useState<any>(null);
  const timer = useRef<any>(null);
  const bar = useSharedValue(1);

  useEffect(() => {
    api.get("/quiz/questions?count=10").then((q) => setQuestions(q)).catch(() => {});
  }, []);

  useEffect(() => {
    if (questions.length === 0 || done || selected !== null) return;
    setTime(QUESTION_TIME);
    bar.value = 1;
    bar.value = withTiming(0, { duration: QUESTION_TIME * 1000 });
    timer.current = setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          clearInterval(timer.current);
          handleAnswer(-1);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer.current);
  }, [idx, questions, done]);

  const barStyle = useAnimatedStyle(() => ({ width: `${bar.value * 100}%` }));

  const handleAnswer = (choice: number) => {
    if (selected !== null) return;
    clearInterval(timer.current);
    setSelected(choice);
    const q = questions[idx];
    if (choice === q.correct) {
      const gained = 10 + Math.max(0, time);
      setScore((s) => s + gained);
      setCorrectCount((c) => c + 1);
      feedback.success();
    } else {
      feedback.error();
    }
    setTimeout(next, 1200);
  };

  const next = async () => {
    if (idx + 1 >= questions.length) {
      finish();
    } else {
      setIdx((i) => i + 1);
      setSelected(null);
    }
  };

  const finish = async () => {
    setDone(true);
    feedback.win();
    try {
      const res = await api.post("/results", {
        game_key: "quiz",
        score,
        correct: correctCount,
        total: questions.length,
      });
      setReward(res);
    } catch {}
  };

  if (questions.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.brand} size="large" />
        <AppText size={14} color={colors.muted} style={{ marginTop: 16 }}>جاري تحميل الأسئلة...</AppText>
      </View>
    );
  }

  if (done) {
    return (
      <GameResult
        title="انتهت الجولة!"
        score={score}
        correct={correctCount}
        total={questions.length}
        reward={reward}
        onReplay={() => router.replace("/play/quiz")}
        onHome={() => router.replace("/(tabs)")}
      />
    );
  }

  const q = questions[idx];

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, paddingTop: insets.top + 8 }}>
      <StatusBar style="light" />
      {/* header */}
      <View style={styles.header}>
        <Pressable testID="quiz-exit" onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.surface2 }]}>
          <Feather name="x" size={20} color={colors.onSurface} />
        </Pressable>
        <View style={[styles.scorePill, { backgroundColor: colors.surface2 }]}>
          <Feather name="star" size={14} color={colors.gold} />
          <AppText weight="black" size={14} color={colors.gold}>{score}</AppText>
        </View>
        <View style={[styles.timePill, { backgroundColor: time <= 5 ? colors.error : colors.surface2 }]}>
          <Feather name="clock" size={14} color={time <= 5 ? "#fff" : colors.onSurface} />
          <AppText weight="black" size={14} color={time <= 5 ? "#fff" : colors.onSurface}>{time}</AppText>
        </View>
      </View>

      {/* progress */}
      <View style={styles.progressWrap}>
        <View style={[styles.progressBg, { backgroundColor: colors.surface3 }]}>
          <Animated.View style={[styles.progressFill, { backgroundColor: colors.brand }, barStyle]} />
        </View>
        <AppText size={12} color={colors.muted} style={{ marginTop: 8 }}>السؤال {idx + 1} من {questions.length}</AppText>
      </View>

      {/* question */}
      <Animated.View key={idx} entering={FadeIn.duration(300)} style={styles.questionCard}>
        <View style={[styles.catBadge, { backgroundColor: colors.brandSoft }]}>
          <AppText weight="bold" size={12} color={colors.brand}>{catName(q.category)}</AppText>
        </View>
        <AppText weight="bold" size={22} align="center" style={{ lineHeight: 34 }}>{q.text}</AppText>
      </Animated.View>

      {/* options */}
      <View style={styles.options}>
        {q.options.map((opt, i) => {
          const isCorrect = selected !== null && i === q.correct;
          const isWrong = selected === i && i !== q.correct;
          let bg = colors.surface2;
          let border = colors.border;
          let textColor = colors.onSurface;
          if (isCorrect) { bg = colors.success; border = colors.success; textColor = "#fff"; }
          else if (isWrong) { bg = colors.error; border = colors.error; textColor = "#fff"; }
          return (
            <Animated.View key={i} entering={FadeInDown.delay(i * 70)}>
              <Pressable
                testID={`quiz-option-${i}`}
                disabled={selected !== null}
                onPress={() => handleAnswer(i)}
                style={[styles.option, { backgroundColor: bg, borderColor: border }]}
              >
                <AppText weight="bold" size={16} color={textColor} style={{ flex: 1 }}>{opt}</AppText>
                {isCorrect && <Feather name="check-circle" size={20} color="#fff" />}
                {isWrong && <Feather name="x-circle" size={20} color="#fff" />}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

function catName(c: string) {
  const m: Record<string, string> = { science: "علوم", tech: "تقنية", history: "تاريخ", geography: "جغرافيا", sports: "رياضة", culture: "ثقافة عامة", iq: "ذكاء", riddles: "ألغاز" };
  return m[c] || c;
}

const styles = StyleSheet.create({
  header: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20 },
  iconBtn: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  scorePill: { flexDirection: "row-reverse", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.pill },
  timePill: { flexDirection: "row-reverse", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.pill, minWidth: 64, justifyContent: "center" },
  progressWrap: { paddingHorizontal: 20, marginTop: 18, alignItems: "center" },
  progressBg: { width: "100%", height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  questionCard: { paddingHorizontal: 24, marginTop: 36, alignItems: "center" },
  catBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS.pill, marginBottom: 20 },
  options: { paddingHorizontal: 20, marginTop: "auto", marginBottom: 40, gap: 12 },
  option: { flexDirection: "row-reverse", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingVertical: 18, borderRadius: RADIUS.md, borderWidth: 1.5 },
});
