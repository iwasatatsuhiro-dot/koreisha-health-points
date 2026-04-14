export type KkpId = string;

export type UserRole = 'user' | 'organizer';

export type AuthState = {
  kkpId: KkpId | null;
  role: UserRole | null;
  nickname: string | null;
  termsAcceptedAt: string | null;
};

export type UserProfile = {
  kkpId: KkpId;
  role: UserRole;
  nickname?: string;
  ageBand?: string;
  ward?: string;
};

export type PointBalance = {
  current: number;
  breakdown: Array<{ category: string; earned: number; overflow: number }>;
};

export type StepsDaily = {
  date: string;
  count: number;
  goal: number;
};

export type StepsWeekly = {
  days: StepsDaily[];
  total: number;
  goal: number;
};

export type VitalType =
  | 'blood_pressure'
  | 'heart_rate'
  | 'temperature'
  | 'weight';

export type VitalReading = {
  id: string;
  kkpId: KkpId;
  type: VitalType;
  recordedAt: string;
  systolic?: number;
  diastolic?: number;
  bpm?: number;
  celsius?: number;
  weightKg?: number;
};

export type VitalInput =
  | { type: 'blood_pressure'; systolic: number; diastolic: number }
  | { type: 'heart_rate'; bpm: number }
  | { type: 'temperature'; celsius: number }
  | { type: 'weight'; weightKg: number };

export type EventCategory = 'recreation' | 'volunteer' | 'health' | 'other';

export type AppEvent = {
  id: string;
  title: string;
  category: EventCategory;
  location: string;
  startAt: string;
  endAt: string;
  description: string;
  organizerId: string;
  organizerName: string;
  maxParticipants?: number;
  participantCount: number;
  pointsAwarded: number;
  status: 'open' | 'closed' | 'cancelled';
};

export type EventParticipation = {
  eventId: string;
  kkpId: string;
  participatedAt: string;
  pointsAwarded: number;
};

export type PointHistoryCategory = 'walk' | 'event' | 'video' | 'survey' | 'manual' | 'exchange';

export type PointHistory = {
  id: string;
  kkpId: string;
  category: PointHistoryCategory;
  delta: number;
  note: string;
  recordedAt: string;
};

export type ExchangeProvider = {
  id: string;
  name: string;
  minPoints: number;
  description: string;
};

export type Notice = {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
  important: boolean;
};

export type SurveyQuestion = {
  id: string;
  text: string;
  type: 'single' | 'multi' | 'text';
  options?: string[];
};

export type Survey = {
  id: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  pointsAwarded: number;
  expiresAt: string;
  answeredAt?: string;
};

export type HealthVideoCategory = 'frailty' | 'exercise' | 'nutrition' | 'mental';

export type HealthVideo = {
  id: string;
  title: string;
  description: string;
  durationSec: number;
  category: HealthVideoCategory;
  pointsAwarded: number;
  thumbnailEmoji: string;
  watchedAt?: string;
};

export type MissionPeriod = 'daily' | 'weekly' | 'monthly';

export type Mission = {
  id: string;
  title: string;
  description: string;
  period: MissionPeriod;
  target: number;
  progress: number;
  unit: string;
  pointsAwarded: number;
  completed: boolean;
};

export type RankingEntry = {
  rank: number;
  kkpId: string;
  displayName: string;
  points: number;
  isMe: boolean;
};

export type FrailtyRiskLevel = 'low' | 'medium' | 'high' | 'unknown';

export type FrailtyRiskAssessment = {
  level: FrailtyRiskLevel;
  score: number;
  factors: Array<{ label: string; status: 'good' | 'warn' | 'bad' | 'unknown'; detail: string }>;
  advice: string;
  assessedAt: string;
};
