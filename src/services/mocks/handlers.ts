import { db } from './db';
import type { AppEvent, VitalType } from '@/src/types';

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
  // ── 対象者管理システム（KKP-ID 照会） ────────────────────────────────────
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

  // ── 事務局システム：ユーザ登録 ───────────────────────────────────────────
  {
    method: 'POST',
    pattern: /^\/secretariat\/users\/register$/,
    handle: (req) => {
      const kkpId = req.body?.kkpId as string | undefined;
      if (!kkpId) return json({ error: 'kkpId_required' }, 400);
      const target = db.findTarget(kkpId);
      if (!target) return json({ error: 'unknown_kkp_id' }, 404);
      return json({ kkpId: target.kkpId, role: target.role, ageBand: target.ageBand, ward: target.ward });
    },
  },

  // ── 事務局システム：ポイント残高 ─────────────────────────────────────────
  {
    method: 'GET',
    pattern: /^\/secretariat\/users\/([\w-]+)\/balance$/,
    handle: (_req, m) => {
      const current = db.getBalance(m[1]);
      const bd = db.getBalanceBreakdown(m[1]);
      return json({
        current,
        breakdown: [
          { category: 'walk', earned: bd.walk, overflow: 0 },
          { category: 'event', earned: bd.event, overflow: 0 },
          { category: 'video', earned: bd.video, overflow: 0 },
          { category: 'survey', earned: bd.survey, overflow: 0 },
        ],
      });
    },
  },

  // ── 事務局システム：ポイント履歴 ─────────────────────────────────────────
  {
    method: 'GET',
    pattern: /^\/secretariat\/users\/([\w-]+)\/history$/,
    handle: (_req, m) => json({ history: db.getPointHistory(m[1]) }),
  },

  // ── 決済代行：交換先一覧 ─────────────────────────────────────────────────
  {
    method: 'GET',
    pattern: /^\/payment-gw\/providers$/,
    handle: () => json({ providers: db.listExchangeProviders() }),
  },

  // ── 決済代行：ポイント交換 ───────────────────────────────────────────────
  {
    method: 'POST',
    pattern: /^\/payment-gw\/exchange$/,
    handle: (req) => {
      const { kkpId, providerId, points } = (req.body ?? {}) as {
        kkpId?: string;
        providerId?: string;
        points?: number;
      };
      if (!kkpId || !providerId || typeof points !== 'number') {
        return json({ error: 'invalid_payload' }, 400);
      }
      const providers = db.listExchangeProviders();
      const provider = providers.find((p) => p.id === providerId);
      if (!provider) return json({ error: 'unknown_provider' }, 404);
      if (points < provider.minPoints) {
        return json({ error: 'below_minimum', minPoints: provider.minPoints }, 400);
      }
      const current = db.getBalance(kkpId);
      if (current < points) return json({ error: 'insufficient_points', current }, 400);
      db.addPointHistory({
        kkpId,
        category: 'exchange',
        delta: -points,
        note: `${provider.name}へ交換`,
        recordedAt: new Date().toISOString(),
      });
      return json({ success: true, exchangedPoints: points, provider: provider.name });
    },
  },

  // ── 健康：週間歩数 ───────────────────────────────────────────────────────
  {
    method: 'GET',
    pattern: /^\/health\/([\w-]+)\/steps\/weekly$/,
    handle: (_req, m) => json(db.getWeeklySteps(m[1])),
  },

  // ── 健康：当日歩数 ───────────────────────────────────────────────────────
  {
    method: 'GET',
    pattern: /^\/health\/([\w-]+)\/steps\/daily$/,
    handle: (_req, m) => json(db.getDailySteps(m[1])),
  },

  // ── 健康：当日歩数を端末からの実測値で上書き ─────────────────────────────
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

  // ── 健康：バイタル一覧 ───────────────────────────────────────────────────
  {
    method: 'GET',
    pattern: /^\/health\/([\w-]+)\/vitals$/,
    handle: (_req, m) => json({ vitals: db.listVitals(m[1]) }),
  },

  // ── 健康：バイタル登録 ───────────────────────────────────────────────────
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

  // ── イベント一覧 ─────────────────────────────────────────────────────────
  {
    method: 'GET',
    pattern: /^\/events$/,
    handle: () => json({ events: db.listEvents() }),
  },

  // ── イベント詳細 ─────────────────────────────────────────────────────────
  {
    method: 'GET',
    pattern: /^\/events\/([\w-]+)$/,
    handle: (_req, m) => {
      const evt = db.getEvent(m[1]);
      if (!evt) return json({ error: 'not_found' }, 404);
      return json(evt);
    },
  },

  // ── イベント登録（開催者） ───────────────────────────────────────────────
  {
    method: 'POST',
    pattern: /^\/events$/,
    handle: (req) => {
      const body = req.body as Partial<AppEvent> & { organizerId?: string };
      if (!body?.title || !body?.startAt || !body?.organizerId) {
        return json({ error: 'missing_required_fields' }, 400);
      }
      const organizer = db.findTarget(body.organizerId);
      if (!organizer || organizer.role !== 'organizer') {
        return json({ error: 'unauthorized' }, 403);
      }
      const id = `EVT-${String(Date.now()).slice(-6)}`;
      const evt: AppEvent = {
        id,
        title: body.title,
        category: body.category ?? 'other',
        location: body.location ?? '',
        startAt: body.startAt,
        endAt: body.endAt ?? body.startAt,
        description: body.description ?? '',
        organizerId: body.organizerId,
        organizerName: body.organizerName ?? organizer.ward,
        maxParticipants: body.maxParticipants,
        participantCount: 0,
        pointsAwarded: body.pointsAwarded ?? 50,
        status: 'open',
      };
      db.addEvent(evt);
      return json(evt, 201);
    },
  },

  // ── イベント参加（ユーザがQRスキャン） ───────────────────────────────────
  {
    method: 'POST',
    pattern: /^\/events\/([\w-]+)\/attend$/,
    handle: (req, m) => {
      const eventId = m[1];
      const { kkpId } = (req.body ?? {}) as { kkpId?: string };
      if (!kkpId) return json({ error: 'kkpId_required' }, 400);
      const evt = db.getEvent(eventId);
      if (!evt) return json({ error: 'event_not_found' }, 404);
      if (evt.status !== 'open') return json({ error: 'event_closed' }, 400);
      if (db.hasParticipated(eventId, kkpId)) {
        return json({ error: 'already_participated' }, 409);
      }
      const today = new Date().toISOString().slice(0, 10);
      const eventDate = evt.startAt.slice(0, 10);
      if (today !== eventDate) {
        return json({ error: 'date_mismatch', eventDate, today }, 400);
      }
      const participation = {
        eventId,
        kkpId,
        participatedAt: new Date().toISOString(),
        pointsAwarded: evt.pointsAwarded,
      };
      db.addParticipation(participation);
      db.addPointHistory({
        kkpId,
        category: 'event',
        delta: evt.pointsAwarded,
        note: `${evt.title} 参加`,
        recordedAt: new Date().toISOString(),
      });
      return json({ success: true, pointsAwarded: evt.pointsAwarded });
    },
  },

  // ── ポイント付与（開催者がユーザQRをスキャン） ────────────────────────────
  {
    method: 'POST',
    pattern: /^\/events\/([\w-]+)\/check-in$/,
    handle: (req, m) => {
      const eventId = m[1];
      const { organizerId, kkpId } = (req.body ?? {}) as { organizerId?: string; kkpId?: string };
      if (!organizerId || !kkpId) return json({ error: 'missing_fields' }, 400);
      const organizer = db.findTarget(organizerId);
      if (!organizer || organizer.role !== 'organizer') return json({ error: 'unauthorized' }, 403);
      const evt = db.getEvent(eventId);
      if (!evt) return json({ error: 'event_not_found' }, 404);
      if (evt.status !== 'open') return json({ error: 'event_closed' }, 400);
      const user = db.findTarget(kkpId);
      if (!user) return json({ error: 'user_not_found' }, 404);
      if (db.hasParticipated(eventId, kkpId)) {
        return json({ error: 'already_participated', kkpId }, 409);
      }
      const participation = {
        eventId,
        kkpId,
        participatedAt: new Date().toISOString(),
        pointsAwarded: evt.pointsAwarded,
      };
      db.addParticipation(participation);
      db.addPointHistory({
        kkpId,
        category: 'event',
        delta: evt.pointsAwarded,
        note: `${evt.title} 参加（開催者確認）`,
        recordedAt: new Date().toISOString(),
      });
      return json({ success: true, kkpId, pointsAwarded: evt.pointsAwarded });
    },
  },

  // ── お知らせ一覧 ─────────────────────────────────────────────────────────
  {
    method: 'GET',
    pattern: /^\/notices$/,
    handle: () => json({ notices: db.listNotices() }),
  },

  // ── アンケート一覧 ───────────────────────────────────────────────────────
  {
    method: 'GET',
    pattern: /^\/users\/([\w-]+)\/surveys$/,
    handle: (_req, m) => {
      return json({ surveys: db.listSurveys(m[1]) });
    },
  },

  // ── アンケート詳細 ───────────────────────────────────────────────────────
  {
    method: 'GET',
    pattern: /^\/users\/([\w-]+)\/surveys\/([\w-]+)$/,
    handle: (_req, m) => {
      const survey = db.getSurvey(m[2], m[1]);
      if (!survey) return json({ error: 'not_found' }, 404);
      return json(survey);
    },
  },

  // ── アンケート回答 ───────────────────────────────────────────────────────
  {
    method: 'POST',
    pattern: /^\/users\/([\w-]+)\/surveys\/([\w-]+)\/answer$/,
    handle: (req, m) => {
      const kkpId = m[1];
      const surveyId = m[2];
      const result = db.submitSurveyAnswer(surveyId, kkpId);
      if (result.alreadyAnswered) return json({ error: 'already_answered' }, 409);
      db.addPointHistory({
        kkpId,
        category: 'survey',
        delta: result.pointsAwarded,
        note: `アンケート回答`,
        recordedAt: new Date().toISOString(),
      });
      return json({ success: true, pointsAwarded: result.pointsAwarded });
    },
  },
];
