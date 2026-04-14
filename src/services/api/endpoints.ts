import { apiClient } from './client';
import type {
  PointBalance,
  StepsDaily,
  StepsWeekly,
  UserProfile,
  VitalInput,
  VitalReading,
} from '@/src/types';

export const targetSystemApi = {
  getTarget: async (kkpId: string) => {
    const res = await apiClient.get(`/target-system/targets/${kkpId}`);
    return res.data as UserProfile;
  },
};

export const secretariatApi = {
  registerUser: async (kkpId: string) => {
    const res = await apiClient.post('/secretariat/users/register', { kkpId });
    return res.data as UserProfile;
  },
  getBalance: async (kkpId: string) => {
    const res = await apiClient.get(`/secretariat/users/${kkpId}/balance`);
    return res.data as PointBalance;
  },
};

export const healthApi = {
  getDailySteps: async (kkpId: string) => {
    const res = await apiClient.get(`/health/${kkpId}/steps/daily`);
    return res.data as StepsDaily;
  },
  getWeeklySteps: async (kkpId: string) => {
    const res = await apiClient.get(`/health/${kkpId}/steps/weekly`);
    return res.data as StepsWeekly;
  },
  submitDailySteps: async (kkpId: string, date: string, count: number) => {
    const res = await apiClient.post(`/health/${kkpId}/steps/daily`, { date, count });
    return res.data as StepsDaily;
  },
  listVitals: async (kkpId: string) => {
    const res = await apiClient.get(`/health/${kkpId}/vitals`);
    return res.data.vitals as VitalReading[];
  },
  submitVital: async (kkpId: string, input: VitalInput) => {
    const res = await apiClient.post(`/health/${kkpId}/vitals`, input);
    return res.data as VitalReading;
  },
};

export const paymentGwApi = {
  listProviders: async () => {
    const res = await apiClient.get('/payment-gw/providers');
    return res.data.providers as Array<{ id: string; name: string; minPoints: number; description: string }>;
  },
};
