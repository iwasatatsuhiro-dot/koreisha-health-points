import { apiClient } from './client';
import type {
  AppEvent,
  ExchangeProvider,
  FrailtyRiskAssessment,
  HealthVideo,
  Mission,
  Notice,
  PointBalance,
  PointHistory,
  RankingEntry,
  StepsDaily,
  StepsWeekly,
  Survey,
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
  getHistory: async (kkpId: string) => {
    const res = await apiClient.get(`/secretariat/users/${kkpId}/history`);
    return res.data.history as PointHistory[];
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
    return res.data.providers as ExchangeProvider[];
  },
  exchangePoints: async (kkpId: string, providerId: string, points: number) => {
    const res = await apiClient.post('/payment-gw/exchange', { kkpId, providerId, points });
    return res.data as { success: boolean; exchangedPoints: number; provider: string };
  },
};

export const eventsApi = {
  listEvents: async () => {
    const res = await apiClient.get('/events');
    return res.data.events as AppEvent[];
  },
  getEvent: async (id: string) => {
    const res = await apiClient.get(`/events/${id}`);
    return res.data as AppEvent;
  },
  registerEvent: async (data: Partial<AppEvent> & { organizerId: string }) => {
    const res = await apiClient.post('/events', data);
    return res.data as AppEvent;
  },
  attend: async (eventId: string, kkpId: string) => {
    const res = await apiClient.post(`/events/${eventId}/attend`, { kkpId });
    return res.data as { success: boolean; pointsAwarded: number };
  },
  checkIn: async (eventId: string, organizerId: string, kkpId: string) => {
    const res = await apiClient.post(`/events/${eventId}/check-in`, { organizerId, kkpId });
    return res.data as { success: boolean; kkpId: string; pointsAwarded: number };
  },
};

export const noticesApi = {
  listNotices: async () => {
    const res = await apiClient.get('/notices');
    return res.data.notices as Notice[];
  },
};

export const surveysApi = {
  listSurveys: async (kkpId: string) => {
    const res = await apiClient.get(`/users/${kkpId}/surveys`);
    return res.data.surveys as Survey[];
  },
  getSurvey: async (id: string, kkpId: string) => {
    const res = await apiClient.get(`/users/${kkpId}/surveys/${id}`);
    return res.data as Survey;
  },
  submitAnswer: async (surveyId: string, kkpId: string, answers: Record<string, string | string[]>) => {
    const res = await apiClient.post(`/users/${kkpId}/surveys/${surveyId}/answer`, { kkpId, answers });
    return res.data as { success: boolean; pointsAwarded: number };
  },
};

export const videosApi = {
  listVideos: async (kkpId: string) => {
    const res = await apiClient.get(`/users/${kkpId}/videos`);
    return res.data.videos as HealthVideo[];
  },
  getVideo: async (id: string, kkpId: string) => {
    const res = await apiClient.get(`/users/${kkpId}/videos/${id}`);
    return res.data as HealthVideo;
  },
  markWatched: async (id: string, kkpId: string) => {
    const res = await apiClient.post(`/users/${kkpId}/videos/${id}/watch`, {});
    return res.data as { success: boolean; pointsAwarded: number };
  },
};

export const missionsApi = {
  listMissions: async (kkpId: string) => {
    const res = await apiClient.get(`/users/${kkpId}/missions`);
    return res.data.missions as Mission[];
  },
};

export const rankingApi = {
  getRanking: async (kkpId: string) => {
    const res = await apiClient.get(`/users/${kkpId}/ranking`);
    return res.data.ranking as RankingEntry[];
  },
};

export const frailtyApi = {
  assess: async (kkpId: string) => {
    const res = await apiClient.get(`/users/${kkpId}/frailty-risk`);
    return res.data as FrailtyRiskAssessment;
  },
};
