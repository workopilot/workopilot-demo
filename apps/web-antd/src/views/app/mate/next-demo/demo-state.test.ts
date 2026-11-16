import type { EntityRecognitionLog, WeeklyReportItem } from './demo-state';

import { afterEach, describe, expect, it } from 'vitest';

import {
  addEntityAlias,
  addReportEntity,
  computeEntityUsageStats,
  createReportInstance,
  entityPeriodRange,
  entityRecognitionLogs,
  filterEntityLogsByRange,
  markEntityLogsUnmapped,
  mergeReportEntities,
  removeEntityAlias,
  removeReportEntity,
  reportArchive,
  reportEntityDictionary,
  reportsUsingEntity,
  submitReportInstance,
  withdrawReportInstance,
} from './demo-state';

describe('汇报助理共享报告状态', () => {
  const createdIds: string[] = [];

  afterEach(() => {
    for (const id of createdIds.splice(0)) {
      const index = reportArchive.findIndex((item) => item.id === id);
      if (index !== -1) reportArchive.splice(index, 1);
    }
  });

  it('生成草稿后提交会进入审阅状态，并可撤回', () => {
    const report = createReportInstance({
      reportType: 'personal',
      target: '我的',
      period: 'weekly',
      startDate: '2026-08-17',
      endDate: '2026-08-23',
    });
    createdIds.push(report.id);

    expect(report.status).toBe('draft');
    expect(submitReportInstance(report.id)?.status).toBe('submitted');
    expect(withdrawReportInstance(report.id)?.status).toBe('draft');
  });
});

describe('实体识别流水与治理', () => {
  const createdEntityIds: string[] = [];
  const createdLogIds: string[] = [];

  const sampleLogs: EntityRecognitionLog[] = [
    {
      action: 'auto',
      confidence: 0.9,
      createdAt: '2026-08-13',
      entityId: 'e1',
      id: 't1',
      mention: '喔壳智能体平台',
      reportId: 'r1',
    },
    {
      action: 'auto',
      confidence: 0.9,
      createdAt: '2026-07-20',
      entityId: 'e1',
      id: 't2',
      mention: '喔壳智能体平台',
      reportId: 'r2',
    },
    {
      action: 'auto',
      confidence: 0.9,
      createdAt: '2026-07-15',
      entityId: 'e1',
      id: 't3',
      mention: '喔壳智能体平台',
      reportId: 'r3',
    },
    {
      action: 'alias',
      confidence: 0.9,
      createdAt: '2026-08-10',
      entityId: 'e2',
      id: 't4',
      mention: '王工',
      reportId: 'r1',
    },
  ];

  afterEach(() => {
    for (const id of createdEntityIds.splice(0)) {
      removeReportEntity(id);
    }
    for (const id of createdLogIds.splice(0)) {
      const index = entityRecognitionLogs.value.findIndex((l) => l.id === id);
      if (index !== -1) entityRecognitionLogs.value.splice(index, 1);
    }
  });

  function createTempEntity(name: string) {
    expect(
      addReportEntity({ description: '测试实体', name, type: '产品' }),
    ).toBe(true);
    const entity = reportEntityDictionary.value.find((e) => e.name === name);
    if (!entity) throw new Error(`未找到测试实体：${name}`);
    createdEntityIds.push(entity.id);
    return entity;
  }

  it('按周期过滤识别流水', () => {
    const [start, end] = entityPeriodRange('two-weeks');
    expect(
      filterEntityLogsByRange(sampleLogs, start, end).map((l) => l.id),
    ).toEqual(['t1', 't4']);

    const [monthStart] = entityPeriodRange('one-month');
    expect(
      filterEntityLogsByRange(sampleLogs, monthStart, end).map((l) => l.id),
    ).toEqual(['t1', 't2', 't4']);

    const [halfStart] = entityPeriodRange('half-year');
    expect(filterEntityLogsByRange(sampleLogs, halfStart, end)).toHaveLength(4);

    expect(
      filterEntityLogsByRange(sampleLogs, undefined, undefined),
    ).toHaveLength(4);
  });

  it('统计实体使用次数并倒序，忽略不在词典中的实体', () => {
    const stats = computeEntityUsageStats(sampleLogs, [
      { description: '', id: 'e1', name: '实体一', type: '产品' },
      { description: '', id: 'e2', name: '实体二', type: '同事' },
    ]);
    expect(stats.map((s) => s.entity.id)).toEqual(['e1', 'e2']);
    expect(stats[0]).toMatchObject({ count: 3, lastUsedAt: '2026-08-13' });

    const partial = computeEntityUsageStats(sampleLogs, [
      { description: '', id: 'e2', name: '实体二', type: '同事' },
    ]);
    expect(partial).toHaveLength(1);
  });

  it('合并实体：别名并入目标、流水改指向、源实体删除', () => {
    const source = createTempEntity('测试产品甲');
    const target = createTempEntity('测试产品乙');
    addEntityAlias(source.id, '甲甲');

    entityRecognitionLogs.value.push({
      action: 'auto',
      confidence: 0.9,
      createdAt: '2026-08-14',
      entityId: source.id,
      id: 'merge-test-log',
      mention: '测试产品甲',
      reportId: 'r1',
    });
    createdLogIds.push('merge-test-log');

    expect(mergeReportEntities(source.id, source.id)).toBe(false);
    expect(mergeReportEntities(source.id, target.id)).toBe(true);

    const merged = reportEntityDictionary.value.find((e) => e.id === target.id);
    expect(merged?.aliases).toContain('测试产品甲');
    expect(merged?.aliases).toContain('甲甲');
    expect(reportEntityDictionary.value.some((e) => e.id === source.id)).toBe(
      false,
    );
    expect(
      entityRecognitionLogs.value.find((l) => l.id === 'merge-test-log')
        ?.entityId,
    ).toBe(target.id);
  });

  it('删除实体后流水标记为未归一化', () => {
    const entity = createTempEntity('测试产品丙');
    entityRecognitionLogs.value.push({
      action: 'auto',
      confidence: 0.9,
      createdAt: '2026-08-14',
      entityId: entity.id,
      id: 'unmap-test-log',
      mention: '测试产品丙',
      reportId: 'r1',
    });
    createdLogIds.push('unmap-test-log');

    removeReportEntity(entity.id);
    createdEntityIds.length = 0;
    markEntityLogsUnmapped(entity.id);

    expect(
      entityRecognitionLogs.value.find((l) => l.id === 'unmap-test-log')
        ?.entityId,
    ).toBe('');
  });

  it('别名维护：新增去重、可删除', () => {
    const entity = createTempEntity('测试产品丁');
    expect(addEntityAlias(entity.id, '丁丁')).toBe(true);
    expect(addEntityAlias(entity.id, '丁丁')).toBe(false);
    expect(addEntityAlias(entity.id, '测试产品丁')).toBe(false);
    removeEntityAlias(entity.id, '丁丁');
    expect(
      reportEntityDictionary.value.find((e) => e.id === entity.id)?.aliases,
    ).toEqual([]);
  });

  it('reportsUsingEntity 按报告去重并倒序', () => {
    const reports = [
      { endDate: '2026-08-02', id: 'r3' },
      { endDate: '2026-08-09', id: 'r2' },
      { endDate: '2026-08-16', id: 'r1' },
    ] as WeeklyReportItem[];
    const result = reportsUsingEntity('e1', sampleLogs, reports);
    expect(result.map((r) => r.id)).toEqual(['r1', 'r2', 'r3']);
  });
});
