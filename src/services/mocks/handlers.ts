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

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
      const deviceId = req.body?.deviceId as string | undefined;
      const forceTransfer = Boolean(req.body?.forceTransfer);
      if (!kkpId) return json({ error: 'kkpId_required' }, 400);
      if (!deviceId) return json({ error: 'device_id_required' }, 400);
      const target = db.findTarget(kkpId);
      if (!target) return json({ error: 'unknown_kkp_id' }, 404);
      if (target.status !== 'active') return json({ error: 'ineligible' }, 403);

      const existing = db.getActiveDevice(kkpId);
      if (existing && existing.deviceId !== deviceId && !forceTransfer) {
        return json(
          { error: 'device_conflict', kkpId, boundAt: existing.boundAt },
          409,
        );
      }
      db.bindDevice(kkpId, deviceId);

      return json({
        kkpId: target.kkpId,
        role: target.role,
        ageBand: target.ageBand,
        ward: target.ward,
        nickname: db.getNickname(target.kkpId) ?? undefined,
      });
    },
  },

  // ── 事務局システム：ニックネーム更新 ─────────────────────────────────────
  {
    method: 'PUT',
    pattern: /^\/secretariat\/users\/([\w-]+)\/nickname$/,
    handle: (req, m) => {
      const nickname = req.body?.nickname as string | undefined;
      if (typeof nickname !== 'string' || !nickname.trim()) {
        return json({ error: 'nickname_required' }, 400);
      }
      const trimmed = nickname.trim();
      if (trimmed.length > 20) return json({ error: 'nickname_too_long' }, 400);
      const target = db.findTarget(m[1]);
      if (!target) return json({ error: 'not_found' }, 404);
      return json(db.setNickname(m[1], trimmed));
    },
  },

  // ── 事務局システム：退会 ─────────────────────────────────────────────────
  {
    method: 'POST',
    pattern: /^\/secretariat\/users\/([\w-]+)\/withdraw$/,
    handle: (_req, m) => {
      const ok = db.withdraw(m[1]);
      if (!ok) return json({ error: 'not_found' }, 404);
      return json({ success: true, kkpId: m[1] });
    },
  },

  // ── 事務局システム：見守り設定 ───────────────────────────────────────────
  {
    method: 'GET',
    pattern: /^\/secretariat\/users\/([\w-]+)\/watch-over$/,
    handle: (_req, m) => json(db.getWatchOver(m[1])),
  },
  {
    method: 'PUT',
    pattern: /^\/secretariat\/users\/([\w-]+)\/watch-over$/,
    handle: (req, m) => {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const patch: Record<string, unknown> = {};
      if (typeof body.enabled === 'boolean') patch.enabled = body.enabled;
      if ('emergencyContact' in body) patch.emergencyContact = body.emergencyContact;
      if (typeof body.inactivityAlertDays === 'number' &&
          [1, 3, 7, 14].includes(body.inactivityAlertDays)) {
        patch.inactivityAlertDays = body.inactivityAlertDays;
      }
      return json(db.setWatchOver(m[1], patch));
    },
  },
  {
    method: 'POST',
    pattern: /^\/secretariat\/users\/([\w-]+)\/watch-over\/ping$/,
    handle: (_req, m) => json(db.recordActivity(m[1])),
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

  // ── イベント編集（開催者） ───────────────────────────────────────────────
  {
    method: 'PUT',
    pattern: /^\/events\/([\w-]+)$/,
    handle: (req, m) => {
      const eventId = m[1];
      const body = (req.body ?? {}) as Record<string, unknown>;
      const organizerId = body.organizerId as string | undefined;
      if (!organizerId) return json({ error: 'organizerId_required' }, 400);
      const evt = db.getEvent(eventId);
      if (!evt) return json({ error: 'event_not_found' }, 404);
      if (evt.organizerId !== organizerId) return json({ error: 'forbidden' }, 403);
      if (evt.status === 'cancelled') return json({ error: 'event_cancelled' }, 400);
      const patch: Partial<AppEvent> = {};
      if (typeof body.title === 'string' && body.title.trim()) patch.title = body.title.trim();
      if (typeof body.description === 'string') patch.description = body.description;
      if (typeof body.location === 'string' && body.location.trim()) patch.location = body.location.trim();
      if (typeof body.pointsAwarded === 'number' && body.pointsAwarded >= 0) patch.pointsAwarded = body.pointsAwarded;
      if (typeof body.maxParticipants === 'number' && body.maxParticipants > 0) patch.maxParticipants = body.maxParticipants;
      const updated = db.updateEvent(eventId, patch);
      return json(updated);
    },
  },

  // ── イベント中止（開催者） ───────────────────────────────────────────────
  {
    method: 'POST',
    pattern: /^\/events\/([\w-]+)\/cancel$/,
    handle: (req, m) => {
      const eventId = m[1];
      const organizerId = (req.body as { organizerId?: string } | undefined)?.organizerId;
      if (!organizerId) return json({ error: 'organizerId_required' }, 400);
      const evt = db.getEvent(eventId);
      if (!evt) return json({ error: 'event_not_found' }, 404);
      if (evt.organizerId !== organizerId) return json({ error: 'forbidden' }, 403);
      if (evt.status === 'cancelled') return json({ error: 'already_cancelled' }, 400);
      const updated = db.cancelEvent(eventId);
      return json(updated);
    },
  },

  // ── 参加者名簿（開催者） ───────────────────────────────────────────────
  {
    method: 'GET',
    pattern: /^\/events\/([\w-]+)\/roster$/,
    handle: (_req, m) => {
      const eventId = m[1];
      const roster = db.getRoster(eventId);
      if (!roster) return json({ error: 'event_not_found' }, 404);
      return json(roster);
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
        latitude: body.latitude,
        longitude: body.longitude,
        startAt: body.startAt,
        endAt: body.endAt ?? body.startAt,
        description: body.description ?? '',
        organizerId: body.organizerId,
        organizerName: body.organizerName ?? organizer.ward,
        maxParticipants: body.maxParticipants,
        participantCount: 0,
        pointsAwarded: body.pointsAwarded ?? 50,
        status: 'open',
        selectionMode: body.selectionMode ?? 'first-come',
        applicationDeadline: body.applicationDeadline,
        lotteryStatus: body.selectionMode === 'lottery' ? 'accepting' : undefined,
        approvalStatus: 'pending',
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
      const { kkpId, latitude, longitude } = (req.body ?? {}) as {
        kkpId?: string;
        latitude?: number;
        longitude?: number;
      };
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
      // 抽選イベントは当選者のみ参加可
      if (evt.selectionMode === 'lottery') {
        const app = db.getApplication(eventId, kkpId);
        if (!app || app.result !== 'won') {
          return json({ error: 'not_selected' }, 403);
        }
      }
      // 位置情報による不正防止（会場から1km以内を許可）
      if (typeof latitude === 'number' && typeof longitude === 'number' && typeof evt.latitude === 'number' && typeof evt.longitude === 'number') {
        const distKm = haversineKm(latitude, longitude, evt.latitude, evt.longitude);
        if (distKm > 1.0) {
          return json({ error: 'location_too_far', distanceKm: Math.round(distKm * 10) / 10 }, 403);
        }
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

  // ── イベントフィードバック：自分の回答 ──────────────────────────────────
  {
    method: 'GET',
    pattern: /^\/events\/([\w-]+)\/my-feedback\/([\w-]+)$/,
    handle: (_req, m) => {
      const eventId = m[1];
      const kkpId = m[2];
      const feedback = db.getMyEventFeedback(eventId, kkpId);
      const participated = db.hasParticipated(eventId, kkpId);
      return json({ feedback, participated });
    },
  },

  // ── イベントフィードバック：送信 ───────────────────────────────────────
  {
    method: 'POST',
    pattern: /^\/events\/([\w-]+)\/feedback$/,
    handle: (req, m) => {
      const eventId = m[1];
      const { kkpId, rating, comment } = (req.body ?? {}) as {
        kkpId?: string;
        rating?: number;
        comment?: string;
      };
      if (!kkpId || !rating) return json({ error: 'missing_fields' }, 400);
      if (rating < 1 || rating > 5 || !Number.isInteger(rating)) return json({ error: 'invalid_rating' }, 400);
      const evt = db.getEvent(eventId);
      if (!evt) return json({ error: 'event_not_found' }, 404);
      if (!db.hasParticipated(eventId, kkpId)) return json({ error: 'not_participated' }, 403);
      const result = db.submitEventFeedback(
        eventId,
        kkpId,
        rating as 1 | 2 | 3 | 4 | 5,
        (comment ?? '').trim(),
      );
      return json({
        success: true,
        feedback: result.feedback,
        updated: result.alreadySubmitted,
      });
    },
  },

  // ── イベントフィードバック：集計（開催者向け） ─────────────────────────
  {
    method: 'GET',
    pattern: /^\/events\/([\w-]+)\/feedback\/([\w-]+)$/,
    handle: (_req, m) => {
      const eventId = m[1];
      const organizerId = m[2];
      const organizer = db.findTarget(organizerId);
      if (!organizer || organizer.role !== 'organizer') return json({ error: 'unauthorized' }, 403);
      const evt = db.getEvent(eventId);
      if (!evt) return json({ error: 'event_not_found' }, 404);
      if (evt.organizerId !== organizerId) return json({ error: 'forbidden' }, 403);
      return json(db.getEventFeedbackSummary(eventId));
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

  // ── 健康動画：一覧 ───────────────────────────────────────────────────────
  {
    method: 'GET',
    pattern: /^\/users\/([\w-]+)\/videos$/,
    handle: (_req, m) => json({ videos: db.listVideos(m[1]) }),
  },

  // ── 健康動画：詳細 ───────────────────────────────────────────────────────
  {
    method: 'GET',
    pattern: /^\/users\/([\w-]+)\/videos\/([\w-]+)$/,
    handle: (_req, m) => {
      const v = db.getVideo(m[2], m[1]);
      if (!v) return json({ error: 'not_found' }, 404);
      return json(v);
    },
  },

  // ── 健康動画：視聴完了 ───────────────────────────────────────────────────
  {
    method: 'POST',
    pattern: /^\/users\/([\w-]+)\/videos\/([\w-]+)\/watch$/,
    handle: (_req, m) => {
      const kkpId = m[1];
      const videoId = m[2];
      const video = db.getVideo(videoId, kkpId);
      if (!video) return json({ error: 'not_found' }, 404);
      const result = db.markVideoWatched(videoId, kkpId);
      if (result.alreadyWatchedToday) return json({ error: 'already_watched_today' }, 409);
      db.addPointHistory({
        kkpId,
        category: 'video',
        delta: result.pointsAwarded,
        note: `動画視聴「${video.title}」`,
        recordedAt: new Date().toISOString(),
      });
      return json({ success: true, pointsAwarded: result.pointsAwarded });
    },
  },

  // ── ミッション一覧 ───────────────────────────────────────────────────────
  {
    method: 'GET',
    pattern: /^\/users\/([\w-]+)\/missions$/,
    handle: (_req, m) => json({ missions: db.listMissions(m[1]) }),
  },

  // ── ランキング ───────────────────────────────────────────────────────────
  {
    method: 'GET',
    pattern: /^\/users\/([\w-]+)\/ranking$/,
    handle: (_req, m) => json({ ranking: db.getRanking(m[1]) }),
  },

  // ── フレイルリスク判定 ───────────────────────────────────────────────────
  {
    method: 'GET',
    pattern: /^\/users\/([\w-]+)\/frailty-risk$/,
    handle: (_req, m) => json(db.assessFrailty(m[1])),
  },

  // ── 健康状態変化メッセージ ───────────────────────────────────────────────
  {
    method: 'GET',
    pattern: /^\/users\/([\w-]+)\/health-changes$/,
    handle: (_req, m) => json(db.getHealthChanges(m[1])),
  },

  // ── バッジ ─────────────────────────────────────────────────────────────
  {
    method: 'GET',
    pattern: /^\/users\/([\w-]+)\/badges$/,
    handle: (_req, m) => json(db.getBadges(m[1])),
  },

  // ── 抽選：応募 ───────────────────────────────────────────────────────────
  {
    method: 'POST',
    pattern: /^\/events\/([\w-]+)\/apply$/,
    handle: (req, m) => {
      const eventId = m[1];
      const { kkpId } = (req.body ?? {}) as { kkpId?: string };
      if (!kkpId) return json({ error: 'kkpId_required' }, 400);
      const evt = db.getEvent(eventId);
      if (!evt) return json({ error: 'event_not_found' }, 404);
      if (evt.selectionMode !== 'lottery') return json({ error: 'not_lottery' }, 400);
      if (evt.lotteryStatus !== 'accepting') return json({ error: 'applications_closed' }, 400);
      if (evt.applicationDeadline && new Date() > new Date(evt.applicationDeadline)) {
        return json({ error: 'deadline_passed' }, 400);
      }
      const result = db.addApplication(eventId, kkpId);
      if (result.already) return json({ error: 'already_applied' }, 409);
      return json({ success: true, application: result.application });
    },
  },

  // ── 抽選：自分の応募一覧 ─────────────────────────────────────────────────
  {
    method: 'GET',
    pattern: /^\/users\/([\w-]+)\/applications$/,
    handle: (_req, m) => json({ applications: db.listApplications(m[1]) }),
  },

  // ── 抽選：応募状況確認（単件） ───────────────────────────────────────────
  {
    method: 'GET',
    pattern: /^\/events\/([\w-]+)\/applications\/([\w-]+)$/,
    handle: (_req, m) => {
      const app = db.getApplication(m[1], m[2]);
      if (!app) return json({ error: 'not_found' }, 404);
      return json(app);
    },
  },

  // ── 抽選：抽選実行（開催者） ─────────────────────────────────────────────
  {
    method: 'POST',
    pattern: /^\/events\/([\w-]+)\/draw$/,
    handle: (req, m) => {
      const eventId = m[1];
      const { organizerId } = (req.body ?? {}) as { organizerId?: string };
      if (!organizerId) return json({ error: 'organizerId_required' }, 400);
      const evt = db.getEvent(eventId);
      if (!evt) return json({ error: 'event_not_found' }, 404);
      if (evt.organizerId !== organizerId) return json({ error: 'unauthorized' }, 403);
      if (evt.selectionMode !== 'lottery') return json({ error: 'not_lottery' }, 400);
      if (evt.lotteryStatus === 'drawn') return json({ error: 'already_drawn' }, 409);
      const result = db.drawLottery(eventId);
      return json({ success: true, ...result });
    },
  },

  // ── 問い合わせ：送信 ─────────────────────────────────────────────────────
  {
    method: 'POST',
    pattern: /^\/inquiries$/,
    handle: (req) => {
      const { kkpId, category, subject, body } = (req.body ?? {}) as {
        kkpId?: string;
        category?: 'app' | 'points' | 'event' | 'account' | 'other';
        subject?: string;
        body?: string;
      };
      if (!kkpId || !category || !subject || !body) {
        return json({ error: 'missing_fields' }, 400);
      }
      const inquiry = db.addInquiry({ kkpId, category, subject, body });
      return json({ success: true, inquiry }, 201);
    },
  },

  // ── 問い合わせ：自分の履歴 ───────────────────────────────────────────────
  {
    method: 'GET',
    pattern: /^\/users\/([\w-]+)\/inquiries$/,
    handle: (_req, m) => json({ inquiries: db.listInquiries(m[1]) }),
  },

  // ── プッシュ通知：メッセージ一覧 ─────────────────────────────────────────
  {
    method: 'GET',
    pattern: /^\/users\/([\w-]+)\/push-messages$/,
    handle: (_req, m) => json({
      messages: db.listPushMessages(m[1]),
      unread: db.unreadPushCount(m[1]),
    }),
  },

  // ── プッシュ通知：既読マーク ─────────────────────────────────────────────
  {
    method: 'POST',
    pattern: /^\/users\/([\w-]+)\/push-messages\/read$/,
    handle: (req, m) => {
      const { id } = (req.body ?? {}) as { id?: string };
      db.markPushRead(m[1], id);
      return json({ success: true, unread: db.unreadPushCount(m[1]) });
    },
  },

  // ── プッシュ通知：通知設定 ───────────────────────────────────────────────
  {
    method: 'GET',
    pattern: /^\/users\/([\w-]+)\/push-preferences$/,
    handle: (_req, m) => json(db.getPushPreferences(m[1])),
  },
  {
    method: 'PUT',
    pattern: /^\/users\/([\w-]+)\/push-preferences$/,
    handle: (req, m) => json(db.updatePushPreferences(m[1], req.body ?? {})),
  },

  // ── プッシュ通知：トークン登録 ───────────────────────────────────────────
  {
    method: 'POST',
    pattern: /^\/users\/([\w-]+)\/push-token$/,
    handle: (req, m) => {
      const { token } = (req.body ?? {}) as { token?: string };
      if (!token) return json({ error: 'token_required' }, 400);
      return json(db.registerPushToken(m[1], token));
    },
  },

  // ── 開催者：自分のイベント一覧（承認状況含む） ───────────────────────────
  {
    method: 'GET',
    pattern: /^\/organizers\/([\w-]+)\/events$/,
    handle: (_req, m) => {
      const organizerId = m[1];
      const target = db.findTarget(organizerId);
      if (!target || target.role !== 'organizer') {
        return json({ error: 'forbidden' }, 403);
      }
      return json({ events: db.listMyEvents(organizerId) });
    },
  },

  // ── 事務局：承認待ちイベント一覧 ─────────────────────────────────────────
  {
    method: 'GET',
    pattern: /^\/secretariat\/events\/pending$/,
    handle: () => json({ events: db.listPendingEvents() }),
  },

  // ── 事務局：イベント承認 ─────────────────────────────────────────────────
  {
    method: 'POST',
    pattern: /^\/secretariat\/events\/([\w-]+)\/approve$/,
    handle: (req, m) => {
      const { secretariatId } = (req.body ?? {}) as { secretariatId?: string };
      if (!secretariatId) return json({ error: 'secretariatId_required' }, 400);
      const target = db.findTarget(secretariatId);
      if (!target || target.role !== 'secretariat') {
        return json({ error: 'forbidden' }, 403);
      }
      const evt = db.getEvent(m[1]);
      if (!evt) return json({ error: 'event_not_found' }, 404);
      if (evt.approvalStatus !== 'pending') {
        return json({ error: 'not_pending', approvalStatus: evt.approvalStatus }, 400);
      }
      const updated = db.approveEvent(m[1], secretariatId);
      return json(updated);
    },
  },

  // ── 事務局：イベント差し戻し ─────────────────────────────────────────────
  {
    method: 'POST',
    pattern: /^\/secretariat\/events\/([\w-]+)\/reject$/,
    handle: (req, m) => {
      const { secretariatId, reason } = (req.body ?? {}) as {
        secretariatId?: string;
        reason?: string;
      };
      if (!secretariatId) return json({ error: 'secretariatId_required' }, 400);
      if (typeof reason !== 'string' || !reason.trim()) {
        return json({ error: 'reason_required' }, 400);
      }
      const target = db.findTarget(secretariatId);
      if (!target || target.role !== 'secretariat') {
        return json({ error: 'forbidden' }, 403);
      }
      const evt = db.getEvent(m[1]);
      if (!evt) return json({ error: 'event_not_found' }, 404);
      if (evt.approvalStatus !== 'pending') {
        return json({ error: 'not_pending', approvalStatus: evt.approvalStatus }, 400);
      }
      const updated = db.rejectEvent(m[1], secretariatId, reason.trim());
      return json(updated);
    },
  },

  // ── 事務局：お知らせ作成 ─────────────────────────────────────────────────
  {
    method: 'POST',
    pattern: /^\/secretariat\/([\w-]+)\/notices$/,
    handle: (req, m) => {
      const secretariatId = m[1];
      const target = db.findTarget(secretariatId);
      if (!target || target.role !== 'secretariat') {
        return json({ error: 'forbidden' }, 403);
      }
      const body = (req.body ?? {}) as {
        title?: string;
        body?: string;
        important?: boolean;
      };
      if (typeof body.title !== 'string' || !body.title.trim()) {
        return json({ error: 'title_required' }, 400);
      }
      if (typeof body.body !== 'string' || !body.body.trim()) {
        return json({ error: 'body_required' }, 400);
      }
      const notice = db.createNotice({
        title: body.title.trim(),
        body: body.body.trim(),
        important: Boolean(body.important),
      });
      return json(notice, 201);
    },
  },

  // ── 事務局：お知らせ更新 ─────────────────────────────────────────────────
  {
    method: 'PUT',
    pattern: /^\/secretariat\/([\w-]+)\/notices\/([\w-]+)$/,
    handle: (req, m) => {
      const secretariatId = m[1];
      const target = db.findTarget(secretariatId);
      if (!target || target.role !== 'secretariat') {
        return json({ error: 'forbidden' }, 403);
      }
      const body = (req.body ?? {}) as {
        title?: string;
        body?: string;
        important?: boolean;
      };
      const updated = db.updateNotice(m[2], {
        title: typeof body.title === 'string' ? body.title.trim() : undefined,
        body: typeof body.body === 'string' ? body.body.trim() : undefined,
        important: typeof body.important === 'boolean' ? body.important : undefined,
      });
      if (!updated) return json({ error: 'not_found' }, 404);
      return json(updated);
    },
  },

  // ── 事務局：お知らせ削除 ─────────────────────────────────────────────────
  {
    method: 'DELETE',
    pattern: /^\/secretariat\/([\w-]+)\/notices\/([\w-]+)$/,
    handle: (_req, m) => {
      const secretariatId = m[1];
      const target = db.findTarget(secretariatId);
      if (!target || target.role !== 'secretariat') {
        return json({ error: 'forbidden' }, 403);
      }
      const ok = db.deleteNotice(m[2]);
      if (!ok) return json({ error: 'not_found' }, 404);
      return json({ success: true });
    },
  },
];
