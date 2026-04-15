// 札幌の積雪・凍結期間（12月〜3月）を冬季とみなす
export const WINTER_MONTHS = [11, 0, 1, 2]; // Date#getMonth() は 0=Jan

export function isWinterMonth(date: Date = new Date()): boolean {
  return WINTER_MONTHS.includes(date.getMonth());
}

export const WINTER_STEPS_GOAL = 3000;
export const STANDARD_STEPS_GOAL = 6000;
export const WINTER_VIDEO_BONUS = 2;

export function currentStepsGoal(date: Date = new Date()): number {
  return isWinterMonth(date) ? WINTER_STEPS_GOAL : STANDARD_STEPS_GOAL;
}
