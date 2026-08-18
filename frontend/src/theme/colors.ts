export const DARK = {
  surface: "#0B0B14",
  surface2: "#161625",
  surface3: "#1F1F33",
  onSurface: "#FFFFFF",
  onSurface2: "#F3F4F6",
  muted: "#9CA3AF",
  brand: "#7C5CFF",
  brandSoft: "#2E225C",
  onBrand: "#FFFFFF",
  gold: "#F5B301",
  onGold: "#0B0B14",
  success: "#10B981",
  error: "#EF4444",
  info: "#3B82F6",
  border: "#2D2D42",
  divider: "#1F1F33",
  card: "#161625",
  tabInactive: "#6B7280",
};

export const LIGHT = {
  surface: "#F4F4F8",
  surface2: "#FFFFFF",
  surface3: "#ECECF3",
  onSurface: "#0B0B14",
  onSurface2: "#2D2D3A",
  muted: "#6B7280",
  brand: "#8B5CF6",
  brandSoft: "#EDE9FE",
  onBrand: "#FFFFFF",
  gold: "#F5B301",
  onGold: "#0B0B14",
  success: "#10B981",
  error: "#EF4444",
  info: "#3B82F6",
  border: "#E5E7EB",
  divider: "#F0F0F5",
  card: "#FFFFFF",
  tabInactive: "#9CA3AF",
};

export type ThemeColors = typeof DARK;

// Fixed brand gradients (same in both modes)
export const GRADIENTS = {
  hero: ["#7C5CFF", "#9333EA", "#C026D3"] as const,
  gold: ["#FBBF24", "#F59E0B"] as const,
  quiz: ["#F97316", "#EF4444"] as const,
  puzzle: ["#8B5CF6", "#EC4899"] as const,
  word: ["#14B8A6", "#059669"] as const,
};

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
export const RADIUS = { sm: 8, md: 16, lg: 24, pill: 999 };

export const FONTS = {
  regular: "Tajawal_400Regular",
  medium: "Tajawal_500Medium",
  bold: "Tajawal_700Bold",
  black: "Tajawal_800ExtraBold",
};
