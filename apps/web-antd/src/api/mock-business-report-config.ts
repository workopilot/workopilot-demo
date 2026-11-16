import type { BusinessReportProfile } from '#/types/business-report';
import { businessProfileForPeriod } from './mock-business-reports';
import { scopedBusinessProfile } from './mock-report-objects';

export const businessSourceOptions = [
  {
    id: 'project',
    title: '项目与风险',
    description: '阶段、已确认风险与后续计划',
  },
  {
    id: 'tasks',
    title: '项目任务',
    description: '新增、完成、进行中与延期任务',
  },
  {
    id: 'tickets',
    title: '服务工单',
    description: '处理结果、超时问题与客户服务记录',
  },
  {
    id: 'milestones',
    title: '里程碑与验收',
    description: '计划基线、实际交付与验收结果',
  },
  {
    id: 'files',
    title: '成果文件',
    description: '需求文档、交付材料、巡检与满意度记录',
  },
];
export const businessTemplateVersions = [
  {
    value: 'standard-v2',
    label: 'V2 · 成果与异常（默认）',
    description: '管理员配置：量化成果优先，异常解释、风险和计划完整保留。',
  },
  {
    value: 'brief-v1',
    label: 'V1 · 管理摘要',
    description: '管理员配置：保留核心数字，正文聚焦结论；原始明细折叠保留。',
  },
];
const metric = (label: string, value: string, hint: string, icon: string) => ({
  label,
  value,
  hint,
  icon: `lucide:${icon}`,
});
export function businessQuantities(
  profile: BusinessReportProfile,
  objectId: string,
) {
  if (!profile.metrics.length) return [];
  if (objectId === 'engine')
    return [
      metric('本期新增任务', '2 项', '当前项目 · 示例任务统计', 'list-plus'),
      metric(
        '本期计划完成',
        '3 / 4 项',
        '完成率 75% · 1 项未完成',
        'list-checks',
      ),
      metric(
        '当前进行中',
        '3 项',
        '累计 12 项：完成 8、进行中 3、延期 1',
        'activity',
      ),
      metric(
        '当前延期任务',
        '1 项',
        '字段映射待确认 · 请补充支持诉求',
        'alarm-clock',
      ),
    ];
  if (objectId === 'huachen' && profile.id === 'operations')
    return [
      metric(
        '本期新增工单',
        '30 单',
        '期初待处理 0 单 · 示例口径',
        'ticket-plus',
      ),
      metric(
        '本期已解决',
        '28 单',
        '已闭环 · 不包含处理中问题',
        'circle-check',
      ),
      metric('期末待处理', '2 单', '报表导出与数据同步仍在跟进', 'clock-3'),
      metric(
        '超时工单',
        '1 单',
        '包含在 2 单待处理中，不能重复相加',
        'alarm-clock',
      ),
    ];
  // Other objects only use their confirmed metrics; never borrow another object's counts.
  return profile.metrics;
}
export function collectBusinessReport(
  objectId: string,
  scenario: string,
  start: string,
  end: string,
  sources = businessSourceOptions.map((item) => item.id),
  template = 'standard-v2',
): BusinessReportProfile {
  const profile = businessProfileForPeriod(
    scopedBusinessProfile(objectId, scenario),
    start,
    end,
  );
  const enabled = new Set(sources);
  if (profile.kind === 'customer' && !enabled.has('tasks'))
    profile.taskRecords = undefined;
  if (profile.kind === 'project') {
    const taskRecords = new Map(
      profile.blocks
        .filter((block) => block.id !== 'plan')
        .flatMap((block) => block.items)
        .filter((item) => /^(T-|EDB-REQ)/.test(item.id))
        .map((item) => [item.id, item]),
    );
    if (objectId === 'engine' && profile.metrics.length)
      taskRecords.set('T-204', {
        id: 'T-204',
        title: '客户字段映射确认',
        status: '延期 · 需协调',
        detail:
          '本期计划中的字段映射尚未完成，需客户经理协调客户接口人确认；项目经理需补充延期申请情况、预计完成时间及对联调的影响。',
        evidence: 'PRJ-021 / T-204 · 项目任务与依赖记录',
      });
    profile.blocks.splice(1, 0, {
      id: 'tasks',
      title: '项目任务',
      icon: 'lucide:list-checks',
      metrics: enabled.has('tasks')
        ? objectId === 'engine'
          ? businessQuantities(profile, objectId)
          : []
        : [],
      summary: !enabled.has('tasks')
        ? '项目任务数据源已关闭，不参与本次汇总。'
        : !profile.metrics.length
          ? '本周期尚未采集项目任务，暂无可确认的新增、完成或延期统计。'
          : objectId === 'engine'
            ? '本期新增 2 项任务，计划完成 4 项、实际完成 3 项，计划完成率 75%。当前累计 12 项任务中已完成 8 项、进行中 3 项、延期 1 项。字段映射延期可能影响联调，请解释延期原因与协调诉求。'
            : '汇总当前项目任务的完成与推进情况。完整任务数量及计划偏差尚待采集；接口交付数量不作为任务数量。请核对下方任务依据并补充延期或阻塞说明。',
      items: enabled.has('tasks') ? [...taskRecords.values()] : [],
    });
  }
  if (enabled.size < businessSourceOptions.length) {
    const sourceFor = (id: string, text: string) =>
      /^(WO|HC-DEV|HC-ACC|HC-DATA|HC-LEG|TOWER)/.test(id) || /工单/.test(text)
        ? 'tickets'
        : /^(T-|T\d|EDB|HT-)/.test(id)
          ? 'tasks'
          : /^(M-|PRJ|HC-D)/.test(id) || /验收|里程碑/.test(text)
            ? 'milestones'
            : /巡检|资料|文档|签收/.test(text)
              ? 'files'
              : 'project';
    profile.blocks = profile.blocks.map((block) => {
      if (block.id === 'tasks') return block;
      const items = block.items.filter((item) =>
        enabled.has(sourceFor(item.id, item.evidence)),
      );
      return {
        ...block,
        items,
        summary: items.length
          ? items.map((item) => item.detail).join('\n\n')
          : '已按数据源配置筛选，本节暂无可汇总记录。请补充经核实的说明。',
      };
    });
    // Mixed-source statistics cannot be presented as a complete total after excluding sources.
    profile.metrics = [];
    profile.service = undefined;
    profile.progress = undefined;
    if (!enabled.has('milestones')) profile.milestones = [];
    if (!enabled.has('project')) {
      profile.phase = '未采集项目阶段';
      profile.stageIndex = -1;
    }
    profile.conclusion =
      '本报告按已启用的数据源整理；未启用来源不参与本次汇总，完整业务统计需恢复默认数据源后重新生成。';
  }
  if (template === 'brief-v1')
    profile.blocks = profile.blocks.map((block) => ({
      ...block,
      summary:
        block.summary
          .split(/[。\n]/)
          .filter(Boolean)
          .slice(0, 1)
          .join('') + '。',
    }));
  return profile;
}
