import type { ReportPeriod } from '#/types/zhiji';

import dayjs from 'dayjs';

export const reportPeriods: { label: string; value: ReportPeriod }[] = [
  { value: 'day', label: '日报' },
  { value: 'week', label: '周报' },
  { value: 'biweek', label: '双周报' },
  { value: 'month', label: '月报' },
  { value: 'quarter', label: '季报' },
  { value: 'year', label: '年报' },
];
export function periodLabel(period: ReportPeriod) {
  return reportPeriods.find((item) => item.value === period)?.label ?? '周报';
}
export function reportPeriodRange(
  date: string,
  period: ReportPeriod,
  anchor = '2026-01-05',
) {
  const selected = dayjs(date).startOf('day');
  let start = selected;
  let end = selected;
  switch (period) {
    case 'biweek': {
      const base = dayjs(anchor).startOf('day');
      start = base.add(
        Math.floor(selected.diff(base, 'day') / 14) * 14,
        'day',
      );
      end = start.add(13, 'day');

      break;
    }
    case 'month': {
      start = selected.startOf('month');
      end = selected.endOf('month');

      break;
    }
    case 'quarter': {
      start = selected
        .month(Math.floor(selected.month() / 3) * 3)
        .startOf('month');
      end = start.add(2, 'month').endOf('month');

      break;
    }
    case 'week': {
      start = selected.subtract((selected.day() + 6) % 7, 'day');
      end = start.add(6, 'day');

      break;
    }
    case 'year': {
      start = selected.startOf('year');
      end = selected.endOf('year');

      break;
    }
    // No default
  }
  return { start: start.format('YYYY-MM-DD'), end: end.format('YYYY-MM-DD') };
}
