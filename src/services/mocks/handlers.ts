import { db } from './db';

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
];
