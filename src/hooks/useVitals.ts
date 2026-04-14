import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { healthApi } from '@/src/services/api/endpoints';
import type { VitalInput, VitalReading, VitalType } from '@/src/types';

export function useVitals(kkpId: string | null) {
  return useQuery({
    queryKey: ['vitals', kkpId],
    queryFn: () => healthApi.listVitals(kkpId!),
    enabled: !!kkpId,
  });
}

export function useLatestVitalsByType(kkpId: string | null) {
  const q = useVitals(kkpId);
  const map: Partial<Record<VitalType, VitalReading>> = {};
  for (const v of q.data ?? []) {
    const current = map[v.type];
    if (!current || current.recordedAt < v.recordedAt) map[v.type] = v;
  }
  return { ...q, latest: map };
}

export function useSubmitVital(kkpId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: VitalInput) => healthApi.submitVital(kkpId!, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vitals', kkpId] });
    },
  });
}
