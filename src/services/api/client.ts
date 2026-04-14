import axios from 'axios';
import { mockAdapter, useMocks } from '@/src/services/mocks/adapter';

export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE ?? 'http://localhost:3001',
  timeout: 10_000,
});

if (useMocks) {
  apiClient.defaults.adapter = mockAdapter;
}
