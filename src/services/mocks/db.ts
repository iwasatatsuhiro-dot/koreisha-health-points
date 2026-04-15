import { currentStepsGoal, isWinterMonth, WINTER_VIDEO_BONUS } from '@/src/utils/season';
import type {
  AppEvent,
  Badge,
  BadgeKind,
  BadgeListResult,
  BadgeStatus,
  EmergencyContact,
  EventApplication,
  EventParticipation,
  EventRoster,
  EventRosterEntry,
  FrailtyRiskAssessment,
  FrailtyRiskLevel,
  HealthChangesResult,
  HealthSnapshot,
  HealthStateChange,
  HealthVideo,
  Inquiry,
  InquiryCategory,
  Mission,
  Notice,
  PointHistory,
  PointHistoryCategory,
  PushCategory,
  PushMessage,
  PushPreferences,
  RankingEntry,
  StepsDaily,
  Survey,
  UserRole,
  VitalReading,
  VitalType,
  WatchOverConfig,
} from '@/src/types';

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

const exchangeProviders = [
  { id: 'suica', name: 'モバイルSuica', minPoints: 100, description: 'Suicaへチャージ' },
  { id: 'paypay', name: 'PayPayポイント', minPoints: 50, description: 'PayPayポイントへ交換' },
  { id: 'rakuten', name: '楽天ポイント', minPoints: 50, description: '楽天ポイントへ交換' },
];

// ── イベント ──────────────────────────────────────────────────────────────────

const now = new Date();
const fmt = (d: Date) => d.toISOString();
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

const events: AppEvent[] = [
  {
    id: 'EVT-001',
    title: '健康ウォーキング教室',
    category: 'health',
    location: '中央区円山公園',
    latitude: 43.0544,
    longitude: 141.3179,
    startAt: fmt(addDays(now, 3)),
    endAt: fmt(addDays(now, 3)),
    description: '円山公園を歩きながら健康増進！ 参加無料。歩きやすい靴でお越しください。',
    organizerId: 'ORG-000001',
    organizerName: '北区健康推進協会',
    maxParticipants: 30,
    participantCount: 12,
    pointsAwarded: 50,
    status: 'open',
    selectionMode: 'first-come',
  },
  {
    id: 'EVT-002',
    title: '地域清掃ボランティア',
    category: 'volunteer',
    location: '豊平区美園公園',
    latitude: 43.0371,
    longitude: 141.3842,
    startAt: fmt(addDays(now, 7)),
    endAt: fmt(addDays(now, 7)),
    description: '地域の公園を皆で清掃します。軍手・ゴミ袋は主催者が用意します。',
    organizerId: 'ORG-000001',
    organizerName: '北区健康推進協会',
    participantCount: 5,
    pointsAwarded: 80,
    status: 'open',
    selectionMode: 'first-come',
  },
  {
    id: 'EVT-003',
    title: '健康講座「フレイル予防」【抽選】',
    category: 'health',
    location: '中央区民センター',
    latitude: 43.0621,
    longitude: 141.3544,
    startAt: fmt(addDays(now, 14)),
    endAt: fmt(addDays(now, 14)),
    description: 'フレイル（虚弱）を予防するための食事・運動・社会参加についての講座です。定員制のため抽選となります。',
    organizerId: 'ORG-000001',
    organizerName: '北区健康推進協会',
    maxParticipants: 20,
    participantCount: 0,
    pointsAwarded: 60,
    status: 'open',
    selectionMode: 'lottery',
    applicationDeadline: fmt(addDays(now, 7)),
    lotteryStatus: 'accepting',
  },
  {
    id: 'EVT-004',
    title: '介護予防体操教室',
    category: 'recreation',
    location: '北区コミュニティセンター',
    latitude: 43.0908,
    longitude: 141.3386,
    startAt: fmt(addDays(now, -5)),
    endAt: fmt(addDays(now, -5)),
    description: '過去に開催した体操教室です（参加終了）。',
    organizerId: 'ORG-000001',
    organizerName: '北区健康推進協会',
    participantCount: 20,
    pointsAwarded: 40,
    status: 'closed',
    selectionMode: 'first-come',
  },
];

const applications: EventApplication[] = [];

const participations: EventParticipation[] = [];

function getEvent(id: string): AppEvent | null {
  return events.find((e) => e.id === id) ?? null;
}

// ── ポイント履歴 ─────────────────────────────────────────────────────────────

let historySeq = 100;

const pointHistory: PointHistory[] = [
  {
    id: 'PH-001',
    kkpId: 'KKP-000001',
    category: 'walk',
    delta: 30,
    note: '歩数ポイント（6000歩達成）',
    recordedAt: addDays(now, -1).toISOString(),
  },
  {
    id: 'PH-002',
    kkpId: 'KKP-000001',
    category: 'walk',
    delta: 30,
    note: '歩数ポイント（6000歩達成）',
    recordedAt: addDays(now, -2).toISOString(),
  },
  {
    id: 'PH-003',
    kkpId: 'KKP-000001',
    category: 'event',
    delta: 40,
    note: '介護予防体操教室 参加',
    recordedAt: addDays(now, -5).toISOString(),
  },
  {
    id: 'PH-004',
    kkpId: 'KKP-000001',
    category: 'video',
    delta: 20,
    note: '動画視聴「フレイルを知ろう」',
    recordedAt: addDays(now, -7).toISOString(),
  },
  {
    id: 'PH-005',
    kkpId: 'KKP-000002',
    category: 'walk',
    delta: 30,
    note: '歩数ポイント（6000歩達成）',
    recordedAt: addDays(now, -1).toISOString(),
  },
  {
    id: 'PH-006',
    kkpId: 'KKP-000002',
    category: 'event',
    delta: 80,
    note: '地域清掃ボランティア 参加',
    recordedAt: addDays(now, -3).toISOString(),
  },
  {
    id: 'PH-007',
    kkpId: 'KKP-000002',
    category: 'survey',
    delta: 20,
    note: 'アンケート「健康意識調査」回答',
    recordedAt: addDays(now, -6).toISOString(),
  },
  {
    id: 'PH-008',
    kkpId: 'KKP-000001',
    category: 'exchange',
    delta: -100,
    note: 'PayPayへ交換',
    recordedAt: addDays(now, -10).toISOString(),
  },
  {
    id: 'PH-009',
    kkpId: 'KKP-000001',
    category: 'exchange',
    delta: -50,
    note: '楽天ポイントへ交換',
    recordedAt: addDays(now, -25).toISOString(),
  },
  {
    id: 'PH-010',
    kkpId: 'KKP-000002',
    category: 'exchange',
    delta: -200,
    note: 'Suicaへ交換',
    recordedAt: addDays(now, -15).toISOString(),
  },
];

const pointBalances: Record<string, number> = {
  'KKP-000001': 120,
  'KKP-000002': 340,
};

function recalcBalance(kkpId: string): number {
  return pointHistory
    .filter((h) => h.kkpId === kkpId)
    .reduce((sum, h) => sum + h.delta, 0);
}

// ── お知らせ ─────────────────────────────────────────────────────────────────

const notices: Notice[] = [
  {
    id: 'NOT-001',
    title: '【重要】令和7年度健康ポイント事業スタートのお知らせ',
    body: '令和7年4月1日より、札幌市高齢者向け健康ポイント事業が開始されました。歩数・イベント参加・動画視聴などでポイントが貯まります。貯まったポイントはPayPay・楽天・Suicaなどに交換できます。',
    publishedAt: addDays(now, -10).toISOString(),
    important: true,
  },
  {
    id: 'NOT-002',
    title: '春のウォーキングキャンペーン開催中',
    body: '4月から5月の期間中、歩数目標達成でポイントが2倍になるキャンペーンを実施中です。ぜひ積極的に歩きましょう！',
    publishedAt: addDays(now, -5).toISOString(),
    important: false,
  },
  {
    id: 'NOT-003',
    title: 'アンケートのご協力をお願いします',
    body: '健康意識に関するアンケートを実施中です。ご回答いただいた方にポイント20ptを付与します。所要時間は約3分です。',
    publishedAt: addDays(now, -3).toISOString(),
    important: false,
  },
  {
    id: 'NOT-004',
    title: 'アプリのメンテナンスについて',
    body: '5月15日（木）午前2時〜午前4時の間、システムメンテナンスのためアプリをご利用いただけない場合があります。ご了承ください。',
    publishedAt: addDays(now, -1).toISOString(),
    important: false,
  },
];

// ── アンケート ────────────────────────────────────────────────────────────────

const surveys: Survey[] = [
  {
    id: 'SRV-001',
    title: '健康意識調査',
    description: '日頃の健康に対する意識についてお聞かせください。',
    questions: [
      {
        id: 'Q1',
        text: '1日の平均的な歩数はどのくらいですか？',
        type: 'single',
        options: ['3000歩未満', '3000〜6000歩', '6000〜9000歩', '9000歩以上'],
      },
      {
        id: 'Q2',
        text: '健康のために取り組んでいることを選んでください（複数選択可）',
        type: 'multi',
        options: ['ウォーキング', '体操・ストレッチ', '食事管理', '健康診断', '地域活動への参加'],
      },
      {
        id: 'Q3',
        text: 'このアプリを使ってよかったと思うことをご自由にお書きください',
        type: 'text',
      },
    ],
    pointsAwarded: 20,
    expiresAt: addDays(now, 30).toISOString(),
  },
  {
    id: 'SRV-002',
    title: 'イベント満足度調査',
    description: '最近ご参加いただいたイベントの満足度についてお聞かせください。',
    questions: [
      {
        id: 'Q1',
        text: 'イベント全体の満足度を教えてください',
        type: 'single',
        options: ['とても満足', 'まあ満足', 'どちらともいえない', 'やや不満', 'とても不満'],
      },
      {
        id: 'Q2',
        text: 'また参加したいと思いますか？',
        type: 'single',
        options: ['ぜひ参加したい', '機会があれば参加したい', '参加しない'],
      },
    ],
    pointsAwarded: 10,
    expiresAt: addDays(now, 14).toISOString(),
  },
];

const answeredSurveys: Record<string, Set<string>> = {};

// ── 健康動画 ─────────────────────────────────────────────────────────────────

const healthVideos: HealthVideo[] = [
  {
    id: 'VID-001',
    title: 'フレイルを知ろう',
    description: 'フレイル（加齢に伴う虚弱）の基礎と予防のポイントを解説します。',
    durationSec: 180,
    category: 'frailty',
    pointsAwarded: 20,
    thumbnailEmoji: '🧓',
  },
  {
    id: 'VID-002',
    title: '自宅でできる簡単ストレッチ',
    description: '椅子に座ったままできる、毎日続けやすい5分間のストレッチです。',
    durationSec: 300,
    category: 'exercise',
    pointsAwarded: 20,
    thumbnailEmoji: '🧘',
  },
  {
    id: 'VID-003',
    title: '健康な食事の基本',
    description: 'タンパク質・野菜・主食のバランスよい1日の食事例を紹介します。',
    durationSec: 240,
    category: 'nutrition',
    pointsAwarded: 20,
    thumbnailEmoji: '🥗',
  },
  {
    id: 'VID-004',
    title: '認知症を予防する生活習慣',
    description: '認知症予防に効果的な運動・食事・社会参加について学びます。',
    durationSec: 360,
    category: 'mental',
    pointsAwarded: 30,
    thumbnailEmoji: '🧠',
  },
];

// kkpId -> Map(videoId, lastWatchedDate 'YYYY-MM-DD')
const watchedVideos: Record<string, Map<string, string>> = {};

// ── 問い合わせ ───────────────────────────────────────────────────────────────

const inquiries: Inquiry[] = [];
let inquirySeq = 1;

// ── プッシュ通知 ─────────────────────────────────────────────────────────────

const pushMessages: PushMessage[] = [
  {
    id: 'PN-001',
    kkpId: 'KKP-000001',
    category: 'notice',
    title: '【お知らせ】春のキャンペーン開催中',
    body: '4月から5月の期間中、歩数達成ポイントが2倍になります。',
    sentAt: addDays(now, -2).toISOString(),
  },
  {
    id: 'PN-002',
    kkpId: 'KKP-000001',
    category: 'event_reminder',
    title: 'イベント開催のお知らせ',
    body: '3日後に「健康ウォーキング教室」が開催されます。',
    sentAt: addDays(now, -1).toISOString(),
  },
];
let pushSeq = 100;

const defaultPushPrefs = (): PushPreferences => ({
  enabled: true,
  categories: {
    event_reminder: true,
    notice: true,
    lottery_result: true,
    achievement: true,
    system: true,
  },
});

const pushPreferences: Record<string, PushPreferences> = {};
const pushTokens: Record<string, string> = {};

// ── 歩数 ─────────────────────────────────────────────────────────────────────

const DEFAULT_STEPS_GOAL = currentStepsGoal();

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

// ── バイタル ─────────────────────────────────────────────────────────────────

const vitalsByUser: Record<string, VitalReading[]> = {};
let vitalsSeq = 1;

// ── バッジ ─────────────────────────────────────────────────────────────────

const badgeCatalog: Badge[] = [
  { id: 'BDG-STEPS-100K', title: '歩行 10万歩', description: '累計10万歩を達成', emoji: '👟', kind: 'steps_total', target: 100_000 },
  { id: 'BDG-STEPS-500K', title: '歩行 50万歩', description: '累計50万歩を達成', emoji: '🏃', kind: 'steps_total', target: 500_000 },
  { id: 'BDG-STEPS-1M', title: '歩行 100万歩', description: '累計100万歩を達成', emoji: '🏆', kind: 'steps_total', target: 1_000_000 },
  { id: 'BDG-VITALS-10', title: 'バイタル 10回', description: 'バイタルを10回記録', emoji: '❤️', kind: 'vitals_count', target: 10 },
  { id: 'BDG-VITALS-30', title: 'バイタル 30回', description: 'バイタルを30回記録', emoji: '💖', kind: 'vitals_count', target: 30 },
  { id: 'BDG-EVENTS-1', title: 'はじめてのイベント', description: 'イベントに初参加', emoji: '🌱', kind: 'events_attended', target: 1 },
  { id: 'BDG-EVENTS-5', title: 'イベント 5回参加', description: 'イベントに5回参加', emoji: '🌼', kind: 'events_attended', target: 5 },
  { id: 'BDG-VIDEOS-5', title: '健康動画 5本', description: '健康動画を5本視聴', emoji: '🎬', kind: 'videos_watched', target: 5 },
  { id: 'BDG-SURVEYS-3', title: 'アンケート 3回', description: 'アンケートに3回回答', emoji: '📝', kind: 'surveys_answered', target: 3 },
];

const unlockedBadges: Record<string, Record<string, string>> = {};

function getBadgeProgress(kkpId: string, kind: BadgeKind): number {
  switch (kind) {
    case 'steps_total':
      return (stepsByUser[kkpId] ?? []).reduce((s, d) => s + d.count, 0);
    case 'vitals_count':
      return (vitalsByUser[kkpId] ?? []).length;
    case 'events_attended':
      return participations.filter((p) => p.kkpId === kkpId).length;
    case 'videos_watched':
      return watchedVideos[kkpId]?.size ?? 0;
    case 'surveys_answered':
      return answeredSurveys[kkpId]?.size ?? 0;
  }
}

function computeBadges(kkpId: string): BadgeListResult {
  if (!unlockedBadges[kkpId]) unlockedBadges[kkpId] = {};
  const store = unlockedBadges[kkpId];
  const newlyUnlocked: string[] = [];
  const badges: BadgeStatus[] = badgeCatalog.map((b) => {
    const progress = getBadgeProgress(kkpId, b.kind);
    const alreadyUnlocked = !!store[b.id];
    if (!alreadyUnlocked && progress >= b.target) {
      const now = new Date().toISOString();
      store[b.id] = now;
      newlyUnlocked.push(b.id);
      pushMessages.push({
        id: `PN-${pushSeq++}`,
        kkpId,
        category: 'achievement',
        title: 'バッジを獲得しました！',
        body: `${b.emoji} ${b.title} — ${b.description}`,
        sentAt: now,
        data: { badgeId: b.id },
      });
    }
    const unlockedAt = store[b.id] ?? null;
    return {
      badge: b,
      progress: Math.min(progress, b.target),
      unlocked: !!unlockedAt,
      unlockedAt,
    };
  });
  badges.sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
    const aPct = a.progress / a.badge.target;
    const bPct = b.progress / b.badge.target;
    return bPct - aPct;
  });
  return {
    badges,
    unlockedCount: badges.filter((b) => b.unlocked).length,
    totalCount: badges.length,
    newlyUnlocked,
  };
}

// ── 健康状態スナップショット ───────────────────────────────────────────────

const healthSnapshots: HealthSnapshot[] = [
  {
    id: 'HS-101',
    kkpId: 'KKP-000001',
    capturedAt: addDays(now, -45).toISOString(),
    frailtyLevel: 'medium',
    frailtyScore: 2,
    avgWeeklySteps: 3200,
    avgSystolic: 148,
    avgDiastolic: 90,
    weightKg: 62.5,
  },
  {
    id: 'HS-102',
    kkpId: 'KKP-000001',
    capturedAt: addDays(now, -7).toISOString(),
    frailtyLevel: 'low',
    frailtyScore: 0,
    avgWeeklySteps: 5600,
    avgSystolic: 132,
    avgDiastolic: 82,
    weightKg: 61.3,
  },
  {
    id: 'HS-201',
    kkpId: 'KKP-000002',
    capturedAt: addDays(now, -40).toISOString(),
    frailtyLevel: 'low',
    frailtyScore: 0,
    avgWeeklySteps: 5800,
    avgSystolic: 128,
    avgDiastolic: 80,
    weightKg: 55.0,
  },
  {
    id: 'HS-202',
    kkpId: 'KKP-000002',
    capturedAt: addDays(now, -5).toISOString(),
    frailtyLevel: 'medium',
    frailtyScore: 2,
    avgWeeklySteps: 3100,
    avgSystolic: 142,
    avgDiastolic: 88,
    weightKg: 56.8,
  },
];
let snapshotSeq = 300;

const FRAILTY_ORDER: Record<FrailtyRiskLevel, number> = {
  unknown: -1,
  low: 0,
  medium: 1,
  high: 2,
};

function buildFrailtyChange(prev: HealthSnapshot, curr: HealthSnapshot): HealthStateChange | null {
  if (prev.frailtyLevel === curr.frailtyLevel) return null;
  const prevRank = FRAILTY_ORDER[prev.frailtyLevel];
  const currRank = FRAILTY_ORDER[curr.frailtyLevel];
  const improved = currRank < prevRank;
  const levelLabel: Record<FrailtyRiskLevel, string> = {
    low: '良好', medium: '注意', high: '要相談', unknown: '判定中',
  };
  return {
    id: `HSC-${snapshotSeq++}`,
    kkpId: curr.kkpId,
    kind: 'frailty',
    direction: improved ? 'improved' : 'worsened',
    title: improved ? 'フレイルリスクが改善しました' : 'フレイルリスクが上がっています',
    body: `${levelLabel[prev.frailtyLevel]} → ${levelLabel[curr.frailtyLevel]}（${
      improved ? '良い変化' : '活動量や血圧の見直しをご検討ください'
    }）`,
    detectedAt: curr.capturedAt,
  };
}

function buildStepsChange(prev: HealthSnapshot, curr: HealthSnapshot): HealthStateChange | null {
  const diff = curr.avgWeeklySteps - prev.avgWeeklySteps;
  if (Math.abs(diff) < 1000) return null;
  const improved = diff > 0;
  return {
    id: `HSC-${snapshotSeq++}`,
    kkpId: curr.kkpId,
    kind: 'steps',
    direction: improved ? 'improved' : 'worsened',
    title: improved ? '平均歩数が増えています' : '平均歩数が減っています',
    body: `${prev.avgWeeklySteps.toLocaleString()} 歩/日 → ${curr.avgWeeklySteps.toLocaleString()} 歩/日（${
      improved ? '+' : ''
    }${diff.toLocaleString()} 歩）`,
    detectedAt: curr.capturedAt,
  };
}

function buildBloodPressureChange(prev: HealthSnapshot, curr: HealthSnapshot): HealthStateChange | null {
  if (prev.avgSystolic == null || curr.avgSystolic == null) return null;
  const diff = curr.avgSystolic - prev.avgSystolic;
  if (Math.abs(diff) < 10) return null;
  const improved = diff < 0;
  return {
    id: `HSC-${snapshotSeq++}`,
    kkpId: curr.kkpId,
    kind: 'blood_pressure',
    direction: improved ? 'improved' : 'worsened',
    title: improved ? '血圧が改善傾向です' : '血圧が上昇しています',
    body: `最高血圧 ${prev.avgSystolic} → ${curr.avgSystolic} mmHg`,
    detectedAt: curr.capturedAt,
  };
}

function buildWeightChange(prev: HealthSnapshot, curr: HealthSnapshot): HealthStateChange | null {
  if (prev.weightKg == null || curr.weightKg == null) return null;
  const diff = curr.weightKg - prev.weightKg;
  if (Math.abs(diff) < 2) return null;
  return {
    id: `HSC-${snapshotSeq++}`,
    kkpId: curr.kkpId,
    kind: 'weight',
    direction: 'stable',
    title: diff > 0 ? '体重が増えています' : '体重が減っています',
    body: `${prev.weightKg.toFixed(1)}kg → ${curr.weightKg.toFixed(1)}kg（${
      diff > 0 ? '+' : ''
    }${diff.toFixed(1)}kg）`,
    detectedAt: curr.capturedAt,
  };
}

function computeHealthChanges(kkpId: string): HealthChangesResult {
  const snaps = healthSnapshots
    .filter((s) => s.kkpId === kkpId)
    .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
  if (snaps.length < 2) {
    return {
      changes: [],
      previousSnapshotAt: null,
      latestSnapshotAt: snaps[0]?.capturedAt ?? null,
    };
  }
  const prev = snaps[snaps.length - 2];
  const curr = snaps[snaps.length - 1];
  const raw = [
    buildFrailtyChange(prev, curr),
    buildStepsChange(prev, curr),
    buildBloodPressureChange(prev, curr),
    buildWeightChange(prev, curr),
  ];
  return {
    changes: raw.filter((c): c is HealthStateChange => c !== null),
    previousSnapshotAt: prev.capturedAt,
    latestSnapshotAt: curr.capturedAt,
  };
}

// ── 見守り設定 ─────────────────────────────────────────────────────────────

const defaultWatchOver = (): WatchOverConfig => ({
  enabled: false,
  emergencyContact: null,
  inactivityAlertDays: 3,
  lastActiveAt: null,
});

const watchOverByUser: Record<string, WatchOverConfig> = {
  'KKP-000001': {
    enabled: true,
    emergencyContact: { name: '山田 花子', relation: '長女', phone: '090-1234-5678' },
    inactivityAlertDays: 3,
    lastActiveAt: new Date().toISOString(),
  },
};

// ── DB export ────────────────────────────────────────────────────────────────

const nicknames: Record<string, string> = {};

type ActiveDeviceRecord = { deviceId: string; boundAt: string };
const activeDevices: Record<string, ActiveDeviceRecord> = {};

export const db = {
  // --- ターゲット ---
  findTarget: (kkpId: string) => targets[kkpId] ?? null,
  listExchangeProviders: () => exchangeProviders,

  // --- アカウント ---
  getNickname: (kkpId: string) => nicknames[kkpId] ?? null,
  setNickname: (kkpId: string, nickname: string) => {
    nicknames[kkpId] = nickname;
    return { kkpId, nickname };
  },
  withdraw: (kkpId: string) => {
    const target = targets[kkpId];
    if (!target) return false;
    target.status = 'withdrawn';
    delete nicknames[kkpId];
    delete pushPreferences[kkpId];
    delete pushTokens[kkpId];
    delete activeDevices[kkpId];
    delete watchOverByUser[kkpId];
    return true;
  },

  // --- 端末バインディング（単一端末運用） ---
  getActiveDevice: (kkpId: string): ActiveDeviceRecord | null =>
    activeDevices[kkpId] ?? null,
  bindDevice: (kkpId: string, deviceId: string): ActiveDeviceRecord => {
    const rec = { deviceId, boundAt: new Date().toISOString() };
    activeDevices[kkpId] = rec;
    return rec;
  },
  unbindDevice: (kkpId: string) => {
    delete activeDevices[kkpId];
  },

  // --- 見守り ---
  getWatchOver: (kkpId: string): WatchOverConfig =>
    watchOverByUser[kkpId] ?? defaultWatchOver(),
  setWatchOver: (kkpId: string, patch: Partial<WatchOverConfig>): WatchOverConfig => {
    const current = watchOverByUser[kkpId] ?? defaultWatchOver();
    const next: WatchOverConfig = { ...current, ...patch };
    watchOverByUser[kkpId] = next;
    return next;
  },
  recordActivity: (kkpId: string): WatchOverConfig => {
    const current = watchOverByUser[kkpId] ?? defaultWatchOver();
    const next: WatchOverConfig = { ...current, lastActiveAt: new Date().toISOString() };
    watchOverByUser[kkpId] = next;
    return next;
  },

  // --- ポイント ---
  getBalance: (kkpId: string) => {
    const seeded = pointBalances[kkpId] ?? 0;
    const dynamic = pointHistory
      .filter((h) => h.kkpId === kkpId && !['PH-001','PH-002','PH-003','PH-004','PH-005','PH-006','PH-007','PH-008','PH-009','PH-010'].includes(h.id))
      .reduce((s, h) => s + h.delta, 0);
    return seeded + dynamic;
  },
  getBalanceBreakdown: (kkpId: string) => {
    const hist = pointHistory.filter((h) => h.kkpId === kkpId);
    const sum = (cat: PointHistoryCategory) =>
      hist.filter((h) => h.category === cat && h.delta > 0).reduce((s, h) => s + h.delta, 0);
    return {
      walk: sum('walk'),
      event: sum('event'),
      video: sum('video'),
      survey: sum('survey'),
      manual: sum('manual'),
    };
  },
  addPointHistory: (entry: Omit<PointHistory, 'id'>): PointHistory => {
    const h: PointHistory = { ...entry, id: `PH-${historySeq++}` };
    pointHistory.push(h);
    return h;
  },
  getPointHistory: (kkpId: string) =>
    [...pointHistory.filter((h) => h.kkpId === kkpId)].sort(
      (a, b) => b.recordedAt.localeCompare(a.recordedAt),
    ),

  // --- イベント ---
  listEvents: () => [...events].sort((a, b) => a.startAt.localeCompare(b.startAt)),
  getEvent,
  addEvent: (evt: AppEvent) => events.push(evt),
  updateEvent: (id: string, patch: Partial<AppEvent>): AppEvent | null => {
    const evt = getEvent(id);
    if (!evt) return null;
    const allowed: (keyof AppEvent)[] = [
      'title', 'description', 'location', 'pointsAwarded', 'maxParticipants',
    ];
    for (const key of allowed) {
      if (key in patch && patch[key] !== undefined) {
        (evt as Record<string, unknown>)[key] = patch[key];
      }
    }
    return evt;
  },
  cancelEvent: (id: string): AppEvent | null => {
    const evt = getEvent(id);
    if (!evt) return null;
    evt.status = 'cancelled';
    // 参加者 / 応募者へ中止通知
    const affected = new Set<string>([
      ...participations.filter((p) => p.eventId === id).map((p) => p.kkpId),
      ...applications.filter((a) => a.eventId === id).map((a) => a.kkpId),
    ]);
    affected.forEach((kkpId) => {
      pushMessages.push({
        id: `PN-${pushSeq++}`,
        kkpId,
        category: 'notice',
        title: 'イベント中止のお知らせ',
        body: `「${evt.title}」は中止となりました。ご了承ください。`,
        sentAt: new Date().toISOString(),
        data: { eventId: id },
      });
    });
    return evt;
  },
  getRoster: (eventId: string): EventRoster | null => {
    const evt = getEvent(eventId);
    if (!evt) return null;
    const apps = applications.filter((a) => a.eventId === eventId);
    const parts = participations.filter((p) => p.eventId === eventId);
    const kkpIds = new Set<string>([
      ...apps.map((a) => a.kkpId),
      ...parts.map((p) => p.kkpId),
    ]);
    const entries: EventRosterEntry[] = Array.from(kkpIds).map((kkpId) => {
      const app = apps.find((a) => a.kkpId === kkpId) ?? null;
      const part = parts.find((p) => p.kkpId === kkpId) ?? null;
      return {
        kkpId,
        nickname: nicknames[kkpId] ?? null,
        applicationStatus: app ? app.result : 'none',
        appliedAt: app?.appliedAt ?? null,
        checkedIn: !!part,
        checkedInAt: part?.participatedAt ?? null,
        pointsAwarded: part?.pointsAwarded ?? null,
      };
    });
    entries.sort((a, b) => {
      if (a.checkedIn !== b.checkedIn) return a.checkedIn ? -1 : 1;
      return a.kkpId.localeCompare(b.kkpId);
    });
    return {
      eventId,
      capacity: evt.maxParticipants ?? null,
      appliedCount: apps.length,
      winnerCount: apps.filter((a) => a.result === 'won').length,
      checkedInCount: parts.length,
      entries,
    };
  },
  getParticipations: (kkpId: string) => participations.filter((p) => p.kkpId === kkpId),
  getEventParticipations: (eventId: string) => participations.filter((p) => p.eventId === eventId),
  hasParticipated: (eventId: string, kkpId: string) =>
    participations.some((p) => p.eventId === eventId && p.kkpId === kkpId),
  addParticipation: (p: EventParticipation) => {
    participations.push(p);
    const evt = getEvent(p.eventId);
    if (evt) evt.participantCount += 1;
  },

  // --- 抽選イベント ---
  listApplications: (kkpId: string) => applications.filter((a) => a.kkpId === kkpId),
  getApplication: (eventId: string, kkpId: string) =>
    applications.find((a) => a.eventId === eventId && a.kkpId === kkpId) ?? null,
  getEventApplications: (eventId: string) => applications.filter((a) => a.eventId === eventId),
  addApplication: (eventId: string, kkpId: string): { already: boolean; application: EventApplication | null } => {
    const existing = applications.find((a) => a.eventId === eventId && a.kkpId === kkpId);
    if (existing) return { already: true, application: existing };
    const app: EventApplication = {
      eventId,
      kkpId,
      appliedAt: new Date().toISOString(),
      result: 'pending',
    };
    applications.push(app);
    return { already: false, application: app };
  },
  drawLottery: (eventId: string): { drawn: number; won: number } => {
    const evt = getEvent(eventId);
    if (!evt || evt.selectionMode !== 'lottery') return { drawn: 0, won: 0 };
    const apps = applications.filter((a) => a.eventId === eventId && a.result === 'pending');
    const capacity = evt.maxParticipants ?? apps.length;
    const shuffled = [...apps].sort(() => Math.random() - 0.5);
    const winners = new Set(shuffled.slice(0, capacity).map((a) => a.kkpId));
    apps.forEach((a) => {
      a.result = winners.has(a.kkpId) ? 'won' : 'lost';
    });
    evt.lotteryStatus = 'drawn';
    evt.drawnAt = new Date().toISOString();
    evt.participantCount = winners.size;
    // 当選者・落選者にプッシュ通知
    apps.forEach((a) => {
      const won = winners.has(a.kkpId);
      pushMessages.push({
        id: `PN-${pushSeq++}`,
        kkpId: a.kkpId,
        category: 'lottery_result',
        title: won ? '【当選】抽選結果のお知らせ' : '【落選】抽選結果のお知らせ',
        body: won
          ? `「${evt.title}」に当選しました。当日お待ちしています。`
          : `「${evt.title}」は残念ながら落選となりました。`,
        sentAt: new Date().toISOString(),
        data: { eventId: evt.id },
      });
    });
    return { drawn: apps.length, won: winners.size };
  },

  // --- 歩数 ---
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

  // --- バイタル ---
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

  // --- お知らせ ---
  listNotices: () => [...notices].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
  getNotice: (id: string) => notices.find((n) => n.id === id) ?? null,

  // --- アンケート ---
  listSurveys: (kkpId: string) =>
    surveys.map((s) => ({
      ...s,
      answeredAt: answeredSurveys[kkpId]?.has(s.id) ? new Date().toISOString() : undefined,
    })),
  getSurvey: (id: string, kkpId: string) => {
    const s = surveys.find((sv) => sv.id === id);
    if (!s) return null;
    return {
      ...s,
      answeredAt: answeredSurveys[kkpId]?.has(id) ? new Date().toISOString() : undefined,
    };
  },
  submitSurveyAnswer: (surveyId: string, kkpId: string): { alreadyAnswered: boolean; pointsAwarded: number } => {
    if (!answeredSurveys[kkpId]) answeredSurveys[kkpId] = new Set();
    if (answeredSurveys[kkpId].has(surveyId)) return { alreadyAnswered: true, pointsAwarded: 0 };
    answeredSurveys[kkpId].add(surveyId);
    const survey = surveys.find((s) => s.id === surveyId);
    return { alreadyAnswered: false, pointsAwarded: survey?.pointsAwarded ?? 0 };
  },

  // --- 健康動画 ---
  listVideos: (kkpId: string): HealthVideo[] => {
    const today = new Date().toISOString().slice(0, 10);
    const watched = watchedVideos[kkpId];
    return healthVideos.map((v) => ({
      ...v,
      watchedAt: watched?.get(v.id) === today ? new Date().toISOString() : undefined,
    }));
  },
  getVideo: (id: string, kkpId: string): HealthVideo | null => {
    const v = healthVideos.find((x) => x.id === id);
    if (!v) return null;
    const today = new Date().toISOString().slice(0, 10);
    const watched = watchedVideos[kkpId];
    return {
      ...v,
      watchedAt: watched?.get(id) === today ? new Date().toISOString() : undefined,
    };
  },
  markVideoWatched: (videoId: string, kkpId: string): { alreadyWatchedToday: boolean; pointsAwarded: number } => {
    const video = healthVideos.find((v) => v.id === videoId);
    if (!video) return { alreadyWatchedToday: false, pointsAwarded: 0 };
    if (!watchedVideos[kkpId]) watchedVideos[kkpId] = new Map();
    const today = new Date().toISOString().slice(0, 10);
    if (watchedVideos[kkpId].get(videoId) === today) {
      return { alreadyWatchedToday: true, pointsAwarded: 0 };
    }
    watchedVideos[kkpId].set(videoId, today);
    const multiplier = isWinterMonth() ? WINTER_VIDEO_BONUS : 1;
    return { alreadyWatchedToday: false, pointsAwarded: video.pointsAwarded * multiplier };
  },

  // --- ミッション ---
  listMissions: (kkpId: string): Mission[] => {
    const weekly = db.getWeeklySteps(kkpId);
    const todayDate = new Date().toISOString().slice(0, 10);
    const todayCount = weekly.days.find((d) => d.date === todayDate)?.count ?? 0;
    const daysAchieved = weekly.days.filter((d) => d.count >= DEFAULT_STEPS_GOAL).length;
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthParticipations = participations.filter(
      (p) => p.kkpId === kkpId && new Date(p.participatedAt) >= monthStart,
    ).length;

    const dailySteps: Mission = {
      id: 'M-DAILY-STEPS',
      title: '今日6000歩を歩こう',
      description: '毎日の歩数目標を達成してポイントを獲得',
      period: 'daily',
      target: DEFAULT_STEPS_GOAL,
      progress: Math.min(todayCount, DEFAULT_STEPS_GOAL),
      unit: '歩',
      pointsAwarded: 10,
      completed: todayCount >= DEFAULT_STEPS_GOAL,
    };
    const weeklyStreak: Mission = {
      id: 'M-WEEKLY-STREAK',
      title: '今週5日以上6000歩達成',
      description: '週5日以上、歩数目標をクリア',
      period: 'weekly',
      target: 5,
      progress: Math.min(daysAchieved, 5),
      unit: '日',
      pointsAwarded: 50,
      completed: daysAchieved >= 5,
    };
    const monthlyEvents: Mission = {
      id: 'M-MONTHLY-EVENTS',
      title: '今月2つのイベントに参加',
      description: 'イベント参加で地域とつながろう',
      period: 'monthly',
      target: 2,
      progress: Math.min(monthParticipations, 2),
      unit: '回',
      pointsAwarded: 80,
      completed: monthParticipations >= 2,
    };
    return [dailySteps, weeklyStreak, monthlyEvents];
  },

  // --- ランキング ---
  getRanking: (kkpId: string): RankingEntry[] => {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const totalsByUser: Record<string, number> = {};
    for (const h of pointHistory) {
      if (h.delta <= 0) continue;
      if (new Date(h.recordedAt) < since) continue;
      const t = targets[h.kkpId];
      if (!t || t.role !== 'user') continue;
      totalsByUser[h.kkpId] = (totalsByUser[h.kkpId] ?? 0) + h.delta;
    }
    // 他ユーザダミーを補充して順位感を出す
    const dummyTotals: Record<string, number> = {
      'KKP-DUMMY-1': 420,
      'KKP-DUMMY-2': 280,
      'KKP-DUMMY-3': 180,
      'KKP-DUMMY-4': 150,
    };
    const displayNames: Record<string, string> = {
      'KKP-DUMMY-1': '札幌花子さん',
      'KKP-DUMMY-2': 'すすきの太郎さん',
      'KKP-DUMMY-3': '大通公子さん',
      'KKP-DUMMY-4': '円山次郎さん',
      'KKP-000001': 'あなた',
      'KKP-000002': 'サンプルユーザ',
    };
    const combined: Array<{ kkpId: string; points: number }> = [
      ...Object.entries(totalsByUser).map(([k, p]) => ({ kkpId: k, points: p })),
      ...Object.entries(dummyTotals).map(([k, p]) => ({ kkpId: k, points: p })),
    ];
    combined.sort((a, b) => b.points - a.points);
    return combined.slice(0, 10).map((row, i) => ({
      rank: i + 1,
      kkpId: row.kkpId,
      displayName: row.kkpId === kkpId ? 'あなた' : displayNames[row.kkpId] ?? `ユーザ${row.kkpId.slice(-4)}`,
      points: row.points,
      isMe: row.kkpId === kkpId,
    }));
  },

  // --- バッジ ---
  getBadges: (kkpId: string): BadgeListResult => computeBadges(kkpId),

  // --- フレイルリスク判定 ---
  getHealthChanges: (kkpId: string): HealthChangesResult => computeHealthChanges(kkpId),

  assessFrailty: (kkpId: string): FrailtyRiskAssessment => {
    const weekly = db.getWeeklySteps(kkpId);
    const avgSteps = weekly.total / 7;
    const vitals = vitalsByUser[kkpId] ?? [];
    const recentBp = [...vitals]
      .filter((v) => v.type === 'blood_pressure')
      .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0];
    const recentWeight = [...vitals]
      .filter((v) => v.type === 'weight')
      .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0];

    const factors: FrailtyRiskAssessment['factors'] = [];
    let score = 0;

    if (avgSteps >= 6000) {
      factors.push({ label: '活動量', status: 'good', detail: `平均 ${Math.round(avgSteps).toLocaleString()} 歩/日` });
    } else if (avgSteps >= 3000) {
      factors.push({ label: '活動量', status: 'warn', detail: `平均 ${Math.round(avgSteps).toLocaleString()} 歩/日` });
      score += 1;
    } else {
      factors.push({ label: '活動量', status: 'bad', detail: `平均 ${Math.round(avgSteps).toLocaleString()} 歩/日` });
      score += 2;
    }

    if (!recentBp) {
      factors.push({ label: '血圧', status: 'unknown', detail: '記録なし' });
      score += 1;
    } else {
      const sys = recentBp.systolic ?? 0;
      if (sys >= 160 || sys < 90) {
        factors.push({ label: '血圧', status: 'bad', detail: `最高 ${sys} mmHg` });
        score += 2;
      } else if (sys >= 140) {
        factors.push({ label: '血圧', status: 'warn', detail: `最高 ${sys} mmHg` });
        score += 1;
      } else {
        factors.push({ label: '血圧', status: 'good', detail: `最高 ${sys} mmHg` });
      }
    }

    if (!recentWeight) {
      factors.push({ label: '体重記録', status: 'unknown', detail: '記録なし' });
    } else {
      factors.push({ label: '体重記録', status: 'good', detail: `${recentWeight.weightKg?.toFixed(1) ?? '-'} kg` });
    }

    let level: FrailtyRiskLevel;
    let advice: string;
    if (score === 0) {
      level = 'low';
      advice = '現状のペースを維持しましょう。無理のない範囲で活動を続けてください。';
    } else if (score <= 2) {
      level = 'medium';
      advice = '活動量やバイタル記録を増やすとさらに健康維持に効果的です。';
    } else {
      level = 'high';
      advice = 'お近くの地域包括支援センターへ相談することをおすすめします。無理せず活動量を少しずつ増やしましょう。';
    }

    return {
      level,
      score,
      factors,
      advice,
      assessedAt: new Date().toISOString(),
    };
  },

  // --- 問い合わせ ---
  listInquiries: (kkpId: string) =>
    [...inquiries.filter((i) => i.kkpId === kkpId)].sort(
      (a, b) => b.submittedAt.localeCompare(a.submittedAt),
    ),
  addInquiry: (input: { kkpId: string; category: InquiryCategory; subject: string; body: string }): Inquiry => {
    const inquiry: Inquiry = {
      id: `INQ-${String(inquirySeq++).padStart(4, '0')}`,
      kkpId: input.kkpId,
      category: input.category,
      subject: input.subject,
      body: input.body,
      submittedAt: new Date().toISOString(),
      status: 'open',
    };
    inquiries.push(inquiry);
    return inquiry;
  },

  // --- プッシュ通知 ---
  listPushMessages: (kkpId: string) =>
    [...pushMessages.filter((m) => m.kkpId === kkpId)].sort(
      (a, b) => b.sentAt.localeCompare(a.sentAt),
    ),
  unreadPushCount: (kkpId: string) =>
    pushMessages.filter((m) => m.kkpId === kkpId && !m.readAt).length,
  markPushRead: (kkpId: string, id?: string) => {
    const now = new Date().toISOString();
    pushMessages.forEach((m) => {
      if (m.kkpId !== kkpId) return;
      if (id && m.id !== id) return;
      if (!m.readAt) m.readAt = now;
    });
  },
  getPushPreferences: (kkpId: string): PushPreferences => {
    if (!pushPreferences[kkpId]) pushPreferences[kkpId] = defaultPushPrefs();
    return pushPreferences[kkpId];
  },
  updatePushPreferences: (kkpId: string, patch: Partial<PushPreferences>): PushPreferences => {
    const current = pushPreferences[kkpId] ?? defaultPushPrefs();
    const merged: PushPreferences = {
      enabled: patch.enabled ?? current.enabled,
      categories: { ...current.categories, ...(patch.categories ?? {}) },
    };
    pushPreferences[kkpId] = merged;
    return merged;
  },
  registerPushToken: (kkpId: string, token: string) => {
    pushTokens[kkpId] = token;
    return { kkpId, token };
  },
  sendPush: (msg: Omit<PushMessage, 'id' | 'sentAt'>): PushMessage => {
    const saved: PushMessage = {
      ...msg,
      id: `PN-${pushSeq++}`,
      sentAt: new Date().toISOString(),
    };
    pushMessages.push(saved);
    return saved;
  },
};
