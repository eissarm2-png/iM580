import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { storage } from "@/src/utils/storage";
import { DARK, LIGHT, ThemeColors } from "./colors";

type Mode = "dark" | "light" | "system";

type Ctx = {
  colors: ThemeColors;
  isDark: boolean;
  mode: Mode;
  setMode: (m: Mode) => void;
};

const ThemeCtx = createContext<Ctx>({
  colors: DARK,
  isDark: true,
  mode: "dark",
  setMode: () => {},
});

const KEY = "abqour_theme_mode";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<Mode>("dark");

  useEffect(() => {
    storage.getItem<Mode>(KEY, "dark").then((m) => {
      if (m) setModeState(m as Mode);
    });
  }, []);

  const setMode = (m: Mode) => {
    setModeState(m);
    storage.setItem(KEY, m);
  };

  const isDark = mode === "system" ? system !== "light" : mode === "dark";
  const colors = isDark ? DARK : LIGHT;

  return (
    <ThemeCtx.Provider value={{ colors, isDark, mode, setMode }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
