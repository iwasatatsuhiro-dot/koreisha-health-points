import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pedometer } from 'expo-sensors';

import { healthApi } from '@/src/services/api/endpoints';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function startOfTodayLocal(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

type PedometerState =
  | { status: 'unsupported' }
  | { status: 'denied' }
  | { status: 'ok'; count: number };

export function useDevicePedometer(): PedometerState | null {
  const [state, setState] = useState<PedometerState | null>(null);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;
    let cancelled = false;

    (async () => {
      if (Platform.OS === 'web') {
        if (!cancelled) setState({ status: 'unsupported' });
        return;
      }
      try {
        const available = await Pedometer.isAvailableAsync();
        if (!available) {
          if (!cancelled) setState({ status: 'unsupported' });
          return;
        }
        const perm = await Pedometer.requestPermissionsAsync().catch(() => null);
        if (perm && perm.status !== 'granted') {
          if (!cancelled) setState({ status: 'denied' });
          return;
        }
        const start = startOfTodayLocal();
        const end = new Date();
        try {
          const result = await Pedometer.getStepCountAsync(start, end);
          if (!cancelled) setState({ status: 'ok', count: result.steps });
        } catch {
          // getStepCountAsync はプラットフォーム非対応時に失敗し得るため live watch にフォールバック
        }
        subscription = Pedometer.watchStepCount((r) => {
          setState((prev) => {
            const base = prev && prev.status === 'ok' ? prev.count : 0;
            return { status: 'ok', count: base + r.steps };
          });
        });
      } catch {
        if (!cancelled) setState({ status: 'unsupported' });
      }
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  return state;
}

export function useWeeklySteps(kkpId: string | null) {
  return useQuery({
    queryKey: ['steps', 'weekly', kkpId],
    queryFn: () => healthApi.getWeeklySteps(kkpId!),
    enabled: !!kkpId,
  });
}

export function useDailySteps(kkpId: string | null) {
  return useQuery({
    queryKey: ['steps', 'daily', kkpId],
    queryFn: () => healthApi.getDailySteps(kkpId!),
    enabled: !!kkpId,
  });
}

export function useSyncDeviceSteps(kkpId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (count: number) => healthApi.submitDailySteps(kkpId!, todayIso(), count),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['steps', 'daily', kkpId] });
      qc.invalidateQueries({ queryKey: ['steps', 'weekly', kkpId] });
    },
  });
}
