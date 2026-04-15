export type KkpId = string;

export type UserRole = 'user' | 'organizer';

export type AuthState = {
  kkpId: KkpId | null;
  role: UserRole | null;
  nickname: string | null;
  termsAcceptedAt: string | null;
  tutorialCompletedAt: string | null;
  deviceId: string | null;
};

export type DeviceBinding = {
  kkpId: KkpId;
  deviceId: string;
  boundAt: string;
};

export type RegisterResult =
  | { kind: 'ok'; profile: UserProfile }
  | { kind: 'device_conflict'; kkpId: KkpId; boundAt: string };

export type UserProfile = {
  kkpId: KkpId;
  role: UserRole;
  nickname?: string;
  ageBand?: string;
  ward?: string;
};

export type EmergencyContact = {
  name: string;
  relation: string;
  phone: string;
};

export type WatchOverConfig = {
  enabled: boolean;
  emergencyContact: EmergencyContact | null;
  inactivityAlertDays: 1 | 3 | 7 | 14;
  lastActiveAt: string | null;
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

export type EventSelectionMode = 'first-come' | 'lottery';

export type EventLotteryStatus = 'accepting' | 'drawn' | 'closed';

export type AppEvent = {
  id: string;
  title: string;
  category: EventCategory;
  location: string;
  latitude?: number;
  longitude?: number;
  startAt: string;
  endAt: string;
  description: string;
  organizerId: string;
  organizerName: string;
  maxParticipants?: number;
  participantCount: number;
  pointsAwarded: number;
  status: 'open' | 'closed' | 'cancelled';
  selectionMode: EventSelectionMode;
  applicationDeadline?: string;
  lotteryStatus?: EventLotteryStatus;
  drawnAt?: string;
};

export type EventApplication = {
  eventId: string;
  kkpId: string;
  appliedAt: string;
  result: 'pending' | 'won' | 'lost';
};

export type EventParticipation = {
  eventId: string;
  kkpId: string;
  participatedAt: string;
  pointsAwarded: number;
};

export type EventRosterEntry = {
  kkpId: string;
  nickname: string | null;
  applicationStatus: 'none' | 'pending' | 'won' | 'lost';
  appliedAt: string | null;
  checkedIn: boolean;
  checkedInAt: string | null;
  pointsAwarded: number | null;
};

export type EventRoster = {
  eventId: string;
  capacity: number | null;
  appliedCount: number;
  winnerCount: number;
  checkedInCount: number;
  entries: EventRosterEntry[];
};

export type EventUpdateInput = {
  title?: string;
  description?: string;
  location?: string;
  pointsAwarded?: number;
  maxParticipants?: number;
};

export type BadgeKind =
  | 'steps_total'
  | 'vitals_count'
  | 'events_attended'
  | 'videos_watched'
  | 'surveys_answered';

export type Badge = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  kind: BadgeKind;
  target: number;
};

export type BadgeStatus = {
  badge: Badge;
  progress: number;
  unlocked: boolean;
  unlockedAt: string | null;
};

export type BadgeListResult = {
  badges: BadgeStatus[];
  unlockedCount: number;
  totalCount: number;
  newlyUnlocked: string[];
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

export type HealthSnapshot = {
  id: string;
  kkpId: string;
  capturedAt: string;
  frailtyLevel: FrailtyRiskLevel;
  frailtyScore: number;
  avgWeeklySteps: number;
  avgSystolic: number | null;
  avgDiastolic: number | null;
  weightKg: number | null;
};

export type HealthChangeKind = 'frailty' | 'steps' | 'blood_pressure' | 'weight';
export type HealthChangeDirection = 'improved' | 'worsened' | 'stable';

export type HealthStateChange = {
  id: string;
  kkpId: string;
  kind: HealthChangeKind;
  direction: HealthChangeDirection;
  title: string;
  body: string;
  detectedAt: string;
};

export type HealthChangesResult = {
  changes: HealthStateChange[];
  previousSnapshotAt: string | null;
  latestSnapshotAt: string | null;
};

export type InquiryCategory = 'app' | 'points' | 'event' | 'account' | 'other';

export type Inquiry = {
  id: string;
  kkpId: string;
  category: InquiryCategory;
  subject: string;
  body: string;
  submittedAt: string;
  status: 'open' | 'in_progress' | 'resolved';
};

export type PushCategory =
  | 'event_reminder'
  | 'notice'
  | 'lottery_result'
  | 'achievement'
  | 'system';

export type PushMessage = {
  id: string;
  kkpId: string;
  category: PushCategory;
  title: string;
  body: string;
  sentAt: string;
  readAt?: string;
  data?: Record<string, string>;
};

export type PushPreferences = {
  enabled: boolean;
  categories: Record<PushCategory, boolean>;
};
