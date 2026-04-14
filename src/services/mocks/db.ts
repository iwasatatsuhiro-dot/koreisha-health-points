import type { StepsDaily, UserRole, VitalReading, VitalType } from '@/src/types';

type TargetRecord = {
  kkpId: string;
  ageBand: string;
  ward: string;
  status: 'active' | 'withdrawn' | 'ineligible';
  role: UserRole;
};

const targets: Record<string, TargetRecord> = {
  'KKP-000001': { kkpId: 'KKP-000001', ageBand: '70-74', ward: '中央区', status: 'active', role: 'user' },
  'KKP-000002': { kkpId: 'KKP-000002', ageBand: '80-84', ward: '豊平区', status: 'active', role: 'user' },
  'ORG-000001': { kkpId: 'ORG-000001', ageBand: '-', ward: '北区', status: 'active', role: 'organizer' },
};

const pointBalances: Record<string, number> = {
  'KKP-000001': 120,
  'KKP-000002': 340,
};

const exchangeProviders = [
  { id: 'suica', name: 'モバイルSuica', minPoints: 100, description: 'Suicaへチャージ' },
  { id: 'paypay', name: 'PayPayポイント', minPoints: 50, description: 'PayPayポイントへ交換' },
  { id: 'rakuten', name: '楽天ポイント', minPoints: 50, description: '楽天ポイントへ交換' },
];

const DEFAULT_STEPS_GOAL = 6000;

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function seedWeeklySteps(kkpId: string): StepsDaily[] {
  const base = hash(kkpId);
  const today = new Date();
  const out: StepsDaily[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    const pseudo = (base + i * 131) % 5000;
    const count = 2500 + pseudo;
    out.push({ date, count, goal: DEFAULT_STEPS_GOAL });
  }
  return out;
}

const stepsByUser: Record<string, StepsDaily[]> = {};
function getOrSeedSteps(kkpId: string): StepsDaily[] {
  if (!stepsByUser[kkpId]) stepsByUser[kkpId] = seedWeeklySteps(kkpId);
  return stepsByUser[kkpId];
}

const vitalsByUser: Record<string, VitalReading[]> = {};
let vitalsSeq = 1;

export const db = {
  findTarget: (kkpId: string) => targets[kkpId] ?? null,
  getBalance: (kkpId: string) => pointBalances[kkpId] ?? 0,
  listExchangeProviders: () => exchangeProviders,

  getWeeklySteps: (kkpId: string) => {
    const days = getOrSeedSteps(kkpId);
    const total = days.reduce((s, d) => s + d.count, 0);
    return { days, total, goal: DEFAULT_STEPS_GOAL };
  },
  getDailySteps: (kkpId: string, date?: string) => {
    const days = getOrSeedSteps(kkpId);
    const target = date ?? days[days.length - 1].date;
    return days.find((d) => d.date === target) ?? { date: target, count: 0, goal: DEFAULT_STEPS_GOAL };
  },
  upsertDailySteps: (kkpId: string, date: string, count: number) => {
    const days = getOrSeedSteps(kkpId);
    const existing = days.find((d) => d.date === date);
    if (existing) existing.count = count;
    else days.push({ date, count, goal: DEFAULT_STEPS_GOAL });
  },

  listVitals: (kkpId: string, type?: VitalType) => {
    const all = vitalsByUser[kkpId] ?? [];
    const filtered = type ? all.filter((v) => v.type === type) : all;
    return [...filtered].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
  },
  addVital: (reading: Omit<VitalReading, 'id'>): VitalReading => {
    const saved: VitalReading = { ...reading, id: `v-${vitalsSeq++}` };
    if (!vitalsByUser[reading.kkpId]) vitalsByUser[reading.kkpId] = [];
    vitalsByUser[reading.kkpId].push(saved);
    return saved;
  },
};
