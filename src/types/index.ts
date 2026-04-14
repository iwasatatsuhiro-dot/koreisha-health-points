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
