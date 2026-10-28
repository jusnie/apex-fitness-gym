/**
 * Theme Store — Athletly V2
 *
 * Zustand store for color preset and mode.
 * Currently light-mode only (no dark mode per user directive).
 * Color preset is persisted via AsyncStorage for future expansion.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/lib/colors';

const PRESET_KEY = 'theme_color_preset';

type ColorPreset = 'default';
type ThemeMode = 'light';

type ColorMap = typeof Colors;

/**
 * Color presets map. Currently only 'default' exists.
 * Add 'ocean', 'sunset', etc. here when needed.
 */
const colorPresets: Record<ColorPreset, ColorMap> = {
  default: Colors,
} as const;

interface ThemeState {
  colorPreset: ColorPreset;
  mode: ThemeMode;

  /** Returns the resolved color map for the active preset. */
  getColors: () => ColorMap;

  /** Switch color preset (persists to AsyncStorage). */
  setColorPreset: (preset: ColorPreset) => void;

  /** Hydrate persisted preset from AsyncStorage. */
  loadPreset: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  colorPreset: 'default',
  mode: 'light',

  getColors: () => {
    const { colorPreset } = get();
    return colorPresets[colorPreset] ?? colorPresets.default;
  },

  setColorPreset: (preset) => {
    set({ colorPreset: preset });
    AsyncStorage.setItem(PRESET_KEY, preset).catch((err) =>
      console.warn('[themeStore] Failed to persist colorPreset:', err),
    );
  },

  loadPreset: async () => {
    try {
      const saved = await AsyncStorage.getItem(PRESET_KEY);
      if (saved && saved in colorPresets) {
        set({ colorPreset: saved as ColorPreset });
      }
    } catch (err) {
      console.warn('[themeStore] Failed to load colorPreset:', err);
    }
  },
}));
