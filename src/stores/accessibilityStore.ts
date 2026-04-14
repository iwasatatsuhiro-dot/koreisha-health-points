import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { fontScaleSteps, type FontScale } from '@/src/theme';

type AccessibilityState = {
  fontScale: FontScale;
  cycleFontScale: () => void;
};

export const useAccessibilityStore = create<AccessibilityState>()(
  persist(
    (set, get) => ({
      fontScale: 1.0,
      cycleFontScale: () => {
        const current = get().fontScale;
        const idx = fontScaleSteps.indexOf(current);
        const next = fontScaleSteps[(idx + 1) % fontScaleSteps.length];
        set({ fontScale: next });
      },
    }),
    {
      name: 'kkp-a11y',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
