import { apiClient } from './client';
import type {
  AppEvent,
  BadgeListResult,
  EventApplication,
  EventFeedback,
  EventFeedbackSummary,
  EventRoster,
  EventUpdateInput,
  ExchangeProvider,
  FrailtyRiskAssessment,
  HealthVideo,
  Inquiry,
  InquiryCategory,
  Mission,
  Notice,
  PointBalance,
  PointHistory,
  PushMessage,
  PushPreferences,
  RankingEntry,
  RegisterResult,
  StepsDaily,
  StepsWeekly,
  Survey,
  UserProfile,
  VitalInput,
  VitalReading,
  HealthChangesResult,
  WatchOverConfig,
} from '@/src/types';

export const targetSystemApi = {
  getTarget: async (kkpId: string) => {
    const res = await apiClient.get(`/target-system/targets/${kkpId}`);
    return res.data as UserProfile;
  },
};

export const secretariatApi = {
  registerUser: async (
    kkpId: string,
    deviceId: string,
    options?: { forceTransfer?: boolean },
  ): Promise<RegisterResult> => {
    const res = await apiClient.post(
      '/secretariat/users/register',
      { kkpId, deviceId, forceTransfer: options?.forceTransfer ?? false },
      { validateStatus: (s) => s === 200 || s === 409 },
    );
    if (res.status === 409) {
      return {
        kind: 'device_conflict',
        kkpId: res.data.kkpId,
        boundAt: res.data.boundAt,
      };
    }
    return { kind: 'ok', profile: res.data as UserProfile };
  },
  getBalance: async (kkpId: string) => {
    const res = await apiClient.get(`/secretariat/users/${kkpId}/balance`);
    return res.data as PointBalance;
  },
  getHistory: async (kkpId: string) => {
    const res = await apiClient.get(`/secretariat/users/${kkpId}/history`);
    return res.data.history as PointHistory[];
  },
  updateNickname: async (kkpId: string, nickname: string) => {
    const res = await apiClient.put(`/secretariat/users/${kkpId}/nickname`, { nickname });
    return res.data as { kkpId: string; nickname: string };
  },
  withdraw: async (kkpId: string) => {
    const res = await apiClient.post(`/secretariat/users/${kkpId}/withdraw`, {});
    return res.data as { success: boolean; kkpId: string };
  },
  getWatchOver: async (kkpId: string) => {
    const res = await apiClient.get(`/secretariat/users/${kkpId}/watch-over`);
    return res.data as WatchOverConfig;
  },
  updateWatchOver: async (kkpId: string, patch: Partial<WatchOverConfig>) => {
    const res = await apiClient.put(`/secretariat/users/${kkpId}/watch-over`, patch);
    return res.data as WatchOverConfig;
  },
  pingActivity: async (kkpId: string) => {
    const res = await apiClient.post(`/secretariat/users/${kkpId}/watch-over/ping`, {});
    return res.data as WatchOverConfig;
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
  listMyEvents: async (organizerId: string) => {
    const res = await apiClient.get(`/organizers/${organizerId}/events`);
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
  updateEvent: async (eventId: string, organizerId: string, patch: EventUpdateInput) => {
    const res = await apiClient.put(`/events/${eventId}`, { organizerId, ...patch });
    return res.data as AppEvent;
  },
  cancelEvent: async (eventId: string, organizerId: string) => {
    const res = await apiClient.post(`/events/${eventId}/cancel`, { organizerId });
    return res.data as AppEvent;
  },
  getRoster: async (eventId: string) => {
    const res = await apiClient.get(`/events/${eventId}/roster`);
    return res.data as EventRoster;
  },
  attend: async (eventId: string, kkpId: string, location?: { latitude: number; longitude: number }) => {
    const payload: Record<string, unknown> = { kkpId };
    if (location) {
      payload.latitude = location.latitude;
      payload.longitude = location.longitude;
    }
    const res = await apiClient.post(`/events/${eventId}/attend`, payload);
    return res.data as { success: boolean; pointsAwarded: number };
  },
  apply: async (eventId: string, kkpId: string) => {
    const res = await apiClient.post(`/events/${eventId}/apply`, { kkpId });
    return res.data as { success: boolean; application: EventApplication };
  },
  listApplications: async (kkpId: string) => {
    const res = await apiClient.get(`/users/${kkpId}/applications`);
    return res.data.applications as EventApplication[];
  },
  getApplication: async (eventId: string, kkpId: string) => {
    const res = await apiClient.get(`/events/${eventId}/applications/${kkpId}`, {
      validateStatus: (s) => s === 200 || s === 404,
    });
    if (res.status === 404) return null;
    return res.data as EventApplication;
  },
  draw: async (eventId: string, organizerId: string) => {
    const res = await apiClient.post(`/events/${eventId}/draw`, { organizerId });
    return res.data as { success: boolean; drawn: number; won: number };
  },
  checkIn: async (eventId: string, organizerId: string, kkpId: string) => {
    const res = await apiClient.post(`/events/${eventId}/check-in`, { organizerId, kkpId });
    return res.data as { success: boolean; kkpId: string; pointsAwarded: number };
  },
  getMyFeedback: async (eventId: string, kkpId: string) => {
    const res = await apiClient.get(`/events/${eventId}/my-feedback/${kkpId}`);
    return res.data as { feedback: EventFeedback | null; participated: boolean };
  },
  submitFeedback: async (eventId: string, kkpId: string, rating: 1 | 2 | 3 | 4 | 5, comment: string) => {
    const res = await apiClient.post(`/events/${eventId}/feedback`, { kkpId, rating, comment });
    return res.data as { success: boolean; feedback: EventFeedback; updated: boolean };
  },
  getFeedbackSummary: async (eventId: string, organizerId: string) => {
    const res = await apiClient.get(`/events/${eventId}/feedback/${organizerId}`);
    return res.data as EventFeedbackSummary;
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

export const healthChangesApi = {
  list: async (kkpId: string) => {
    const res = await apiClient.get(`/users/${kkpId}/health-changes`);
    return res.data as HealthChangesResult;
  },
};

export const badgesApi = {
  list: async (kkpId: string) => {
    const res = await apiClient.get(`/users/${kkpId}/badges`);
    return res.data as BadgeListResult;
  },
};

export const inquiriesApi = {
  submit: async (payload: { kkpId: string; category: InquiryCategory; subject: string; body: string }) => {
    const res = await apiClient.post('/inquiries', payload);
    return res.data as { success: boolean; inquiry: Inquiry };
  },
  listMine: async (kkpId: string) => {
    const res = await apiClient.get(`/users/${kkpId}/inquiries`);
    return res.data.inquiries as Inquiry[];
  },
};

export const pushApi = {
  listMessages: async (kkpId: string) => {
    const res = await apiClient.get(`/users/${kkpId}/push-messages`);
    return res.data as { messages: PushMessage[]; unread: number };
  },
  markRead: async (kkpId: string, id?: string) => {
    const res = await apiClient.post(`/users/${kkpId}/push-messages/read`, { id });
    return res.data as { success: boolean; unread: number };
  },
  getPreferences: async (kkpId: string) => {
    const res = await apiClient.get(`/users/${kkpId}/push-preferences`);
    return res.data as PushPreferences;
  },
  updatePreferences: async (kkpId: string, patch: Partial<PushPreferences>) => {
    const res = await apiClient.put(`/users/${kkpId}/push-preferences`, patch);
    return res.data as PushPreferences;
  },
  registerToken: async (kkpId: string, token: string) => {
    const res = await apiClient.post(`/users/${kkpId}/push-token`, { token });
    return res.data as { kkpId: string; token: string };
  },
};
