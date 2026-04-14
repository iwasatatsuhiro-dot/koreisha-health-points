import { apiClient } from './client';
import type { PointBalance, UserProfile } from '@/src/types';

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

export const paymentGwApi = {
  listProviders: async () => {
    const res = await apiClient.get('/payment-gw/providers');
    return res.data.providers as Array<{ id: string; name: string; minPoints: number; description: string }>;
  },
};
