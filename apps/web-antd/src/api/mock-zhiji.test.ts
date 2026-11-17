import { describe, expect, it, vi } from 'vitest';

vi.mock('#/utils/report-period', () => import('../utils/report-period'));
vi.mock('./mock-data', () => ({
  mockDelay: async () => {},
  createMockResponse: (data: unknown) => ({ code: 0, data, message: 'ok' }),
}));

import { demoReports, reportSchemes } from './mock-new-reports';
import {
  cloneZhijiScheme,
  newZhijiScheme,
  saveZhijiScheme,
  validateZhijiScheme,
  zhijiHistory,
  zhijiSchemes,
} from './mock-zhiji';

describe('report scheme publishing', () => {
  it('rejects an empty choice set and a non-Monday biweekly anchor', () => {
    const scheme = newZhijiScheme();
    scheme.name = 'Validation fixture';
    scheme.periods = [];
    expect(validateZhijiScheme(scheme).periods).toBeTruthy();
    scheme.periods = ['biweek'];
    scheme.defaultPeriod = 'biweek';
    scheme.anchor = '2026-01-06';
    expect(validateZhijiScheme(scheme).anchor).toBeTruthy();
  });
  it('keeps drafts out of the reporter hub until published', async () => {
    const scheme = newZhijiScheme();
    scheme.name = 'Draft fixture';
    await saveZhijiScheme(scheme, false);
    expect(reportSchemes.find((s) => s.id === scheme.id)?.enabled).toBe(
      false,
    );
    await saveZhijiScheme(scheme, true);
    expect(reportSchemes.find((s) => s.id === scheme.id)?.enabled).toBe(true);
    expect(
      demoReports.find((r) => r.schemeId === scheme.id)?.schemeConfig
        ?.version,
    ).toBe(1);
  });
  it('preserves report and prior configuration snapshots when publishing another version', async () => {
    const old = zhijiSchemes.find((s) => s.id === 'weekly');
    if (!old) throw new Error('missing fixture');
    const oldVersion = old.version;
    const report = demoReports.find((r) => r.schemeId === 'weekly');
    const snapshot = JSON.stringify(report);
    const edit = cloneZhijiScheme(old);
    edit.defaultPeriod = 'month';
    edit.periods = ['month'];
    await saveZhijiScheme(edit, true);
    expect(old.version).toBe(oldVersion + 1);
    expect(JSON.stringify(report)).toBe(snapshot);
    expect(
      zhijiHistory.find((h) => h.id === old.id)?.snapshot.defaultPeriod,
    ).toBe('week');
  });
  it('publishes a previously disabled sample with a valid calendar range', async () => {
    const scheme = zhijiSchemes.find((s) => s.id === 'productline');
    if (!scheme) throw new Error('missing fixture');
    await saveZhijiScheme(cloneZhijiScheme(scheme), true);
    const report = demoReports.find((r) => r.schemeId === scheme.id);
    expect(report?.start).toBe('2026-10-01');
    expect(report?.end).toBe('2026-12-31');
  });
  it('validates scope IDs against their selected mode', () => {
    const scheme = newZhijiScheme();
    scheme.name = 'Scope fixture';
    scheme.scopeIds = [];
    expect(validateZhijiScheme(scheme).scope).toBeTruthy();
    scheme.scopeMode = 'people';
    scheme.scopeIds = ['rd'];
    expect(validateZhijiScheme(scheme).scope).toBeTruthy();
    scheme.scopeIds = ['wang'];
    expect(validateZhijiScheme(scheme).scope).toBeUndefined();
  });
  it('persists selected people and isolated source prompts in report snapshots', async () => {
    const scheme = newZhijiScheme();
    scheme.name = 'Source prompt fixture';
    scheme.scopeMode = 'people';
    scheme.scopeIds = ['wang', 'chen'];
    scheme.sources = ['tasks'];
    scheme.sourcePrompts.tasks = 'Summarize completed deliverables';
    await saveZhijiScheme(scheme, true);
    const config = demoReports.find(
      (report) => report.schemeId === scheme.id,
    )?.schemeConfig;
    expect(config?.scope).toBe('韩立、陈静');
    expect(config?.sources).toEqual(['tasks']);
    scheme.sourcePrompts.tasks = 'Changed locally';
    expect(config?.sourcePrompts.tasks).toBe(
      'Summarize completed deliverables',
    );
  });
});
