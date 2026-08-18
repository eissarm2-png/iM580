import { useFonts } from "expo-font";

// Tajawal Arabic font loaded from jsDelivr (google/fonts mirror). Works on native + web.
const CDN = "https://cdn.jsdelivr.net/gh/google/fonts/ofl/tajawal";

export function useAppFonts() {
  return useFonts({
    Tajawal_400Regular: `${CDN}/Tajawal-Regular.ttf`,
    Tajawal_500Medium: `${CDN}/Tajawal-Medium.ttf`,
    Tajawal_700Bold: `${CDN}/Tajawal-Bold.ttf`,
    Tajawal_800ExtraBold: `${CDN}/Tajawal-ExtraBold.ttf`,
  });
}
