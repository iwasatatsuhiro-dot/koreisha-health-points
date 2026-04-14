import type {
  AppEvent,
  EventParticipation,
  Notice,
  PointHistory,
  PointHistoryCategory,
  StepsDaily,
  Survey,
  UserRole,
  VitalReading,
  VitalType,
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
    startAt: fmt(addDays(now, 3)),
    endAt: fmt(addDays(now, 3)),
    description: '円山公園を歩きながら健康増進！ 参加無料。歩きやすい靴でお越しください。',
    organizerId: 'ORG-000001',
    organizerName: '北区健康推進協会',
    maxParticipants: 30,
    participantCount: 12,
    pointsAwarded: 50,
    status: 'open',
  },
  {
    id: 'EVT-002',
    title: '地域清掃ボランティア',
    category: 'volunteer',
    location: '豊平区美園公園',
    startAt: fmt(addDays(now, 7)),
    endAt: fmt(addDays(now, 7)),
    description: '地域の公園を皆で清掃します。軍手・ゴミ袋は主催者が用意します。',
    organizerId: 'ORG-000001',
    organizerName: '北区健康推進協会',
    participantCount: 5,
    pointsAwarded: 80,
    status: 'open',
  },
  {
    id: 'EVT-003',
    title: '健康講座「フレイル予防」',
    category: 'health',
    location: '中央区民センター',
    startAt: fmt(addDays(now, 14)),
    endAt: fmt(addDays(now, 14)),
    description: 'フレイル（虚弱）を予防するための食事・運動・社会参加についての講座です。',
    organizerId: 'ORG-000001',
    organizerName: '北区健康推進協会',
    maxParticipants: 50,
    participantCount: 28,
    pointsAwarded: 60,
    status: 'open',
  },
  {
    id: 'EVT-004',
    title: '介護予防体操教室',
    category: 'recreation',
    location: '北区コミュニティセンター',
    startAt: fmt(addDays(now, -5)),
    endAt: fmt(addDays(now, -5)),
    description: '過去に開催した体操教室です（参加終了）。',
    organizerId: 'ORG-000001',
    organizerName: '北区健康推進協会',
    participantCount: 20,
    pointsAwarded: 40,
    status: 'closed',
  },
];

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

// ── 歩数 ─────────────────────────────────────────────────────────────────────

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

// ── バイタル ─────────────────────────────────────────────────────────────────

const vitalsByUser: Record<string, VitalReading[]> = {};
let vitalsSeq = 1;

// ── DB export ────────────────────────────────────────────────────────────────

export const db = {
  // --- ターゲット ---
  findTarget: (kkpId: string) => targets[kkpId] ?? null,
  listExchangeProviders: () => exchangeProviders,

  // --- ポイント ---
  getBalance: (kkpId: string) => {
    const seeded = pointBalances[kkpId] ?? 0;
    const dynamic = pointHistory
      .filter((h) => h.kkpId === kkpId && !['PH-001','PH-002','PH-003','PH-004','PH-005','PH-006','PH-007'].includes(h.id))
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
  getParticipations: (kkpId: string) => participations.filter((p) => p.kkpId === kkpId),
  getEventParticipations: (eventId: string) => participations.filter((p) => p.eventId === eventId),
  hasParticipated: (eventId: string, kkpId: string) =>
    participations.some((p) => p.eventId === eventId && p.kkpId === kkpId),
  addParticipation: (p: EventParticipation) => {
    participations.push(p);
    const evt = getEvent(p.eventId);
    if (evt) evt.participantCount += 1;
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
};
