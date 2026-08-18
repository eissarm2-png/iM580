import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LogBox, I18nManager, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { useAppFonts } from "@/src/hooks/useAppFonts";
import { ThemeProvider } from "@/src/theme/ThemeProvider";
import { AuthProvider } from "@/src/context/AuthContext";
import { initFeedback } from "@/src/utils/feedback";

LogBox.ignoreAllLogs(true);

// RTL for Arabic
try {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
} catch {}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [iconsLoaded, iconErr] = useIconFonts();
  const [fontsLoaded, fontErr] = useAppFonts();

  const ready = (iconsLoaded || iconErr) && (fontsLoaded || fontErr);

  useEffect(() => {
    initFeedback();
  }, []);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <ThemeProvider>
            <AuthProvider>
              <Stack screenOptions={{ headerShown: false, animation: "slide_from_left" }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="game/[key]" options={{ presentation: "card" }} />
                <Stack.Screen name="play/quiz" />
                <Stack.Screen name="play/puzzle" />
                <Stack.Screen name="play/word" />
                <Stack.Screen name="multiplayer/index" />
                <Stack.Screen name="multiplayer/room/[code]" />
                <Stack.Screen name="notifications" options={{ presentation: "modal" }} />
                <Stack.Screen name="settings" />
                <Stack.Screen name="admin/index" />
              </Stack>
            </AuthProvider>
          </ThemeProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
