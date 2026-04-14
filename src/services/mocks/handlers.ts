import { db } from './db';
import type { VitalType } from '@/src/types';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type MockRequest = {
  method: Method;
  url: string;
  body?: any;
};

export type MockResponse = {
  status: number;
  data: any;
};

type Handler = {
  method: Method;
  pattern: RegExp;
  handle: (req: MockRequest, match: RegExpMatchArray) => Promise<MockResponse> | MockResponse;
};

const json = (data: any, status = 200): MockResponse => ({ status, data });

export const handlers: Handler[] = [
  // ---- 対象者管理システム（KKP-ID 照会） ----
  {
    method: 'GET',
    pattern: /^\/target-system\/targets\/([\w-]+)$/,
    handle: (_req, m) => {
      const target = db.findTarget(m[1]);
      if (!target) return json({ error: 'not_found' }, 404);
      if (target.status !== 'active') return json({ error: 'ineligible' }, 403);
      return json(target);
    },
  },

  // ---- 事務局システム：ユーザ登録 ----
  {
    method: 'POST',
    pattern: /^\/secretariat\/users\/register$/,
    handle: (req) => {
      const kkpId = req.body?.kkpId as string | undefined;
      if (!kkpId) return json({ error: 'kkpId_required' }, 400);
      const target = db.findTarget(kkpId);
      if (!target) return json({ error: 'unknown_kkp_id' }, 404);
      return json({
        kkpId: target.kkpId,
        role: target.role,
        ageBand: target.ageBand,
        ward: target.ward,
      });
    },
  },

  // ---- 事務局システム：ポイント残高 ----
  {
    method: 'GET',
    pattern: /^\/secretariat\/users\/([\w-]+)\/balance$/,
    handle: (_req, m) => {
      const current = db.getBalance(m[1]);
      return json({
        current,
        breakdown: [
          { category: 'walk', earned: Math.floor(current * 0.6), overflow: 0 },
          { category: 'event', earned: Math.floor(current * 0.3), overflow: 0 },
          { category: 'video', earned: Math.floor(current * 0.1), overflow: 0 },
        ],
      });
    },
  },

  // ---- 決済代行：交換先一覧 ----
  {
    method: 'GET',
    pattern: /^\/payment-gw\/providers$/,
    handle: () => json({ providers: db.listExchangeProviders() }),
  },

  // ---- 健康：週間歩数 ----
  {
    method: 'GET',
    pattern: /^\/health\/([\w-]+)\/steps\/weekly$/,
    handle: (_req, m) => json(db.getWeeklySteps(m[1])),
  },

  // ---- 健康：当日歩数 ----
  {
    method: 'GET',
    pattern: /^\/health\/([\w-]+)\/steps\/daily$/,
    handle: (_req, m) => json(db.getDailySteps(m[1])),
  },

  // ---- 健康：当日歩数を端末からの実測値で上書き ----
  {
    method: 'POST',
    pattern: /^\/health\/([\w-]+)\/steps\/daily$/,
    handle: (req, m) => {
      const { date, count } = (req.body ?? {}) as { date?: string; count?: number };
      if (!date || typeof count !== 'number') return json({ error: 'invalid_payload' }, 400);
      db.upsertDailySteps(m[1], date, count);
      return json(db.getDailySteps(m[1], date));
    },
  },

  // ---- 健康：バイタル一覧 ----
  {
    method: 'GET',
    pattern: /^\/health\/([\w-]+)\/vitals$/,
    handle: (_req, m) => json({ vitals: db.listVitals(m[1]) }),
  },

  // ---- 健康：バイタル登録 ----
  {
    method: 'POST',
    pattern: /^\/health\/([\w-]+)\/vitals$/,
    handle: (req, m) => {
      const body = req.body as {
        type?: VitalType;
        systolic?: number;
        diastolic?: number;
        bpm?: number;
        celsius?: number;
        weightKg?: number;
        recordedAt?: string;
      };
      if (!body?.type) return json({ error: 'type_required' }, 400);
      const saved = db.addVital({
        kkpId: m[1],
        type: body.type,
        recordedAt: body.recordedAt ?? new Date().toISOString(),
        systolic: body.systolic,
        diastolic: body.diastolic,
        bpm: body.bpm,
        celsius: body.celsius,
        weightKg: body.weightKg,
      });
      return json(saved, 201);
    },
  },
];
