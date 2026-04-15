import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthState, UserRole } from '@/src/types';

type AuthActions = {
  acceptTerms: () => void;
  completeTutorial: () => void;
  setSession: (args: { kkpId: string; role: UserRole; nickname?: string }) => void;
  setNickname: (nickname: string) => void;
  signOut: () => void;
  ensureDeviceId: () => string;
};

const initial: AuthState = {
  kkpId: null,
  role: null,
  nickname: null,
  termsAcceptedAt: null,
  tutorialCompletedAt: null,
  deviceId: null,
};

function generateDeviceId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `dev-${Date.now().toString(36)}-${rand}`;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      ...initial,
      acceptTerms: () => set({ termsAcceptedAt: new Date().toISOString() }),
      completeTutorial: () => set({ tutorialCompletedAt: new Date().toISOString() }),
      setSession: ({ kkpId, role, nickname }) =>
        set({ kkpId, role, nickname: nickname ?? null }),
      setNickname: (nickname) => set({ nickname }),
      signOut: () =>
        set((s) => ({ ...initial, deviceId: s.deviceId })),
      ensureDeviceId: () => {
        const current = get().deviceId;
        if (current) return current;
        const next = generateDeviceId();
        set({ deviceId: next });
        return next;
      },
    }),
    {
      name: 'kkp-auth',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
