import type { UserRole } from '@/src/types';

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

export const db = {
  findTarget: (kkpId: string) => targets[kkpId] ?? null,
  getBalance: (kkpId: string) => pointBalances[kkpId] ?? 0,
  listExchangeProviders: () => exchangeProviders,
};
