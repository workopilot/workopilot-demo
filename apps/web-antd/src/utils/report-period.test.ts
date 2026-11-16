import { describe, expect, it } from 'vitest';

import { reportPeriodRange } from './report-period';

describe('report coverage boundaries', () => {
  it('uses Monday to Sunday, including a cross-year week', () => {
    expect(reportPeriodRange('2027-01-01', 'week')).toEqual({ start: '2026-12-28', end: '2027-01-03' });
  });
  it('uses a continuous two-week anchor rather than ISO week parity', () => {
    expect(reportPeriodRange('2026-01-04', 'biweek', '2026-01-05')).toEqual({ start: '2025-12-22', end: '2026-01-04' });
    expect(reportPeriodRange('2026-01-18', 'biweek', '2026-01-05')).toEqual({ start: '2026-01-05', end: '2026-01-18' });
    expect(reportPeriodRange('2026-01-19', 'biweek', '2026-01-05')).toEqual({ start: '2026-01-19', end: '2026-02-01' });
  });
  it('handles leap-year months and natural quarters', () => {
    expect(reportPeriodRange('2028-02-22', 'month')).toEqual({ start: '2028-02-01', end: '2028-02-29' });
    expect(reportPeriodRange('2026-12-31', 'quarter')).toEqual({ start: '2026-10-01', end: '2026-12-31' });
    expect(reportPeriodRange('2027-01-01', 'quarter')).toEqual({ start: '2027-01-01', end: '2027-03-31' });
  });
  it('uses natural years and single-day coverage', () => {
    expect(reportPeriodRange('2026-10-22', 'year')).toEqual({ start: '2026-01-01', end: '2026-12-31' });
    expect(reportPeriodRange('2026-10-22', 'day')).toEqual({ start: '2026-10-22', end: '2026-10-22' });
  });
});
