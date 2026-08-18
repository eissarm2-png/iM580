import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from "expo-audio";
import { storage } from "@/src/utils/storage";

let hapticsOn = true;
let soundOn = true;

const SOUND_KEY = "abqour_sound";
const HAPTIC_KEY = "abqour_haptics";

const SOURCES = {
  click: "https://assets.mixkit.co/active_storage/sfx/2568/2568.wav",
  correct: "https://assets.mixkit.co/active_storage/sfx/2018/2018.wav",
  wrong: "https://assets.mixkit.co/active_storage/sfx/2955/2955.wav",
  win: "https://assets.mixkit.co/active_storage/sfx/1435/1435.wav",
};

const players: Partial<Record<keyof typeof SOURCES, AudioPlayer>> = {};

export async function initFeedback() {
  hapticsOn = (await storage.getItem<boolean>(HAPTIC_KEY, true)) ?? true;
  soundOn = (await storage.getItem<boolean>(SOUND_KEY, true)) ?? true;
  try {
    await setAudioModeAsync({ playsInSilentMode: true });
    (Object.keys(SOURCES) as (keyof typeof SOURCES)[]).forEach((k) => {
      try {
        players[k] = createAudioPlayer({ uri: SOURCES[k] });
      } catch {}
    });
  } catch {}
}

export function setSoundOn(v: boolean) {
  soundOn = v;
  storage.setItem(SOUND_KEY, v);
}
export function setHapticsOn(v: boolean) {
  hapticsOn = v;
  storage.setItem(HAPTIC_KEY, v);
}
export const getSoundOn = () => soundOn;
export const getHapticsOn = () => hapticsOn;

function playSound(key: keyof typeof SOURCES) {
  if (!soundOn || Platform.OS === "web") return;
  try {
    const p = players[key];
    if (p) {
      p.seekTo(0);
      p.play();
    }
  } catch {}
}

export const feedback = {
  tap() {
    if (hapticsOn && Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    playSound("click");
  },
  select() {
    if (hapticsOn && Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
  },
  success() {
    if (hapticsOn && Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    playSound("correct");
  },
  error() {
    if (hapticsOn && Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    playSound("wrong");
  },
  win() {
    if (hapticsOn && Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    playSound("win");
  },
};
