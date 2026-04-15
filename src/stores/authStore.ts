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
};

const initial: AuthState = {
  kkpId: null,
  role: null,
  nickname: null,
  termsAcceptedAt: null,
  tutorialCompletedAt: null,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      ...initial,
      acceptTerms: () => set({ termsAcceptedAt: new Date().toISOString() }),
      completeTutorial: () => set({ tutorialCompletedAt: new Date().toISOString() }),
      setSession: ({ kkpId, role, nickname }) =>
        set({ kkpId, role, nickname: nickname ?? null }),
      setNickname: (nickname) => set({ nickname }),
      signOut: () => set({ ...initial }),
    }),
    {
      name: 'kkp-auth',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
