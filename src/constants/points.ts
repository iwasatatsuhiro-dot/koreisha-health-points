import type { PointHistoryCategory } from '@/src/types';

export const POINT_CATEGORY_LABEL: Record<PointHistoryCategory, string> = {
  walk: '歩数',
  event: 'イベント',
  video: '動画視聴',
  survey: 'アンケート',
  manual: '手動付与',
  exchange: 'ポイント交換',
};

export const POINT_CATEGORY_COLOR: Record<PointHistoryCategory, string> = {
  walk: '#1E8449',
  event: '#2471A3',
  video: '#7D3C98',
  survey: '#D35400',
  manual: '#717D7E',
  exchange: '#C0392B',
};

export const EARNING_CATEGORIES: PointHistoryCategory[] = [
  'walk',
  'event',
  'video',
  'survey',
  'manual',
];
