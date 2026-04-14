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
