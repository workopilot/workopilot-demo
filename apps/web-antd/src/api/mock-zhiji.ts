import type { ZhijiScheme, ZhijiType } from '#/types/zhiji';

import { reactive, toRaw } from 'vue';

import { periodLabel, reportPeriodRange } from '#/utils/report-period';

import { createMockResponse, mockDelay } from './mock-data';
import { demoReports, makeReport, reportSchemes } from './mock-new-reports';
import { reportLayoutTemplates } from './mock-report-layout-templates';
import {
  reportMarkdownRules,
  reportSourcePrompts,
} from './report-source-prompts';

export const zhijiTypes = reactive<ZhijiType[]>([
  {
    id: 'personal',
    name: '个人报告',
    description: '从日常工作中提炼个人成果、计划与协作诉求。',
    object: '单个员工',
    owner: '员工本人',
    icon: 'lucide:user-round',
    sources: ['tasks', 'tickets', 'projects', 'git', 'files'],
    sections: ['核心成果', '工作详情', '下期计划', '风险与协调'],
    enabled: true,
  },
  {
    id: 'project',
    name: '项目报告',
    description: '围绕单个项目，核对阶段目标与交付进展。',
    object: '单个项目',
    owner: '项目经理',
    icon: 'lucide:folder-kanban',
    sources: ['projects', 'tasks', 'tickets', 'files'],
    sections: [
      '当前阶段与进展',
      '任务情况与负责人',
      '风险与需要协调',
      '下期计划',
    ],
    enabled: true,
  },
  {
    id: 'productline',
    name: '产品线报告',
    description: '汇总单个产品线的需求、版本与成果。',
    object: '单个产品线',
    owner: '产品线负责人',
    icon: 'lucide:layers-3',
    sources: ['projects', 'tasks', 'requirements', 'files'],
    sections: ['产品进展', '版本交付', '需求与反馈', '下期计划'],
    enabled: true,
  },
  {
    id: 'customer',
    name: '客户报告',
    description: '用交付与服务证据呈现客户获得的价值。',
    object: '单个客户',
    owner: '客户经理',
    icon: 'lucide:building-2',
    sources: ['projects', 'tasks', 'tickets', 'files'],
    sections: [
      '客户概述',
      '工单处理情况',
      '任务与交付情况',
      '待补充事项与协调',
      '下期计划',
      '其他补充',
    ],
    enabled: true,
  },
]);
export const zhijiSources = reactive([
  {
    id: 'projects',
    name: '项目与里程碑',
    icon: 'lucide:folder-kanban',
    description: '阶段、计划日期与交付验收',
    system: '项目管理',
    status: '可用',
    checked: '10:20',
  },
  {
    id: 'tasks',
    name: '任务与交付物',
    icon: 'lucide:list-checks',
    description: '任务结果、负责人和成果链接',
    system: '项目管理',
    status: '可用',
    checked: '10:20',
  },
  {
    id: 'tickets',
    name: '工单与服务',
    icon: 'lucide:ticket',
    description: '处理结果、服务响应与客户反馈',
    system: '知应工单',
    status: '可用',
    checked: '10:18',
  },
  {
    id: 'git',
    name: 'Git 代码活动',
    icon: 'lucide:git-branch',
    description: '授权仓库中的提交与合并记录',
    system: '公司统一连接',
    status: '待授权',
    checked: '—',
  },
  {
    id: 'requirements',
    name: '需求与变更',
    icon: 'lucide:lightbulb',
    description: '需求评审、变更和版本交付',
    system: '产品管理',
    status: '可用',
    checked: '10:15',
  },
  {
    id: 'files',
    name: '文件与工作素材',
    icon: 'lucide:files',
    description: '文档、手工记录、巡检与满意度',
    system: '文件中心',
    status: '可用',
    checked: '10:16',
  },
]);
export const zhijiTemplates = reactive([
  {
    id: 'outcome',
    name: '成果汇报',
    description: '突出本期产出、成果依据与下一步交付。',
    sections: ['核心成果', '工作详情', '下期计划', '风险与协调'],
    prompt: `${reportMarkdownRules}\n\n按“概述、本期完成、下期计划、风险与协调”生成正文，合并各来源统计并按唯一记录去重。概述用简短文本说明参与项目与完成情况；保留数据源 Markdown 统计表，数量加粗并使用行内代码，明细放在关联数据源。没有风险不输出风险段落。缺少成果物、完成标准和异常解释时提出补充问题。`,
  },
  {
    id: 'progress',
    name: '项目进展',
    description: '按阶段、里程碑与风险组织管理视图。',
    sections: [
      '当前阶段与进展',
      '任务情况与负责人',
      '风险与需要协调',
      '下期计划',
    ],
    prompt: `${reportMarkdownRules}\n\n按单个项目生成，先给文本概述和本期完成、任务总数、累计完成、当前任务完成比例、本期参与人数。正文仅围绕“当前阶段与进展、任务情况与负责人、风险和需要协调、下期计划”四部分。阶段和里程碑对照计划与实际日期；任务使用 Markdown 表格体现负责人、本期计划、本期完成、进行中、延期说明和下期计划数。风险先分类再解释，补充人工协调诉求；不统计确认人数，不罗列成员周报，不生成 PMO 多项目总览。`,
  },
  {
    id: 'service',
    name: '客户服务',
    description: '区分历史交付与本期服务，呈现客户价值。',
    sections: [
      '客户概述',
      '工单处理情况',
      '任务与交付情况',
      '待补充事项与协调',
      '下期计划',
      '其他补充',
    ],
    prompt: `${reportMarkdownRules}\n\n按单个客户及其关联项目生成月报，依据实际项目阶段、验收和服务记录自动识别客户情况，无需用户选择阶段。先用文字写客户概述、运维起始日期与截至期末时长，再呈现本周期工单和任务统计。正文按“工单处理情况、任务与交付情况、待补充事项与协调、下期计划、其他补充”组织，任务按负责人统计，明细折叠。区分本期服务与历史交付，说明是否按期交付，未知时不推断。内部说明与对客补充分离；内部说明不进入对客报告。提交运维负责人审批后由客户经理分享，不自动发送或执行行动。`,
  },
]);
export const zhijiDepartments = [
  { value: 'rd', label: '产品研发部' },
  { value: 'delivery', label: '交付项目组' },
  { value: 'service', label: '客户服务组' },
];
export const zhijiPeople = [
  { value: 'wang', label: '王安康', department: '产品研发部' },
  { value: 'zhang', label: '张三', department: '产品研发部' },
  { value: 'li', label: '李明', department: '交付项目组' },
  { value: 'chen', label: '陈静', department: '客户服务组' },
  { value: 'yang', label: '杨总', department: '产品研发部' },
  ...[
    '刘洋',
    '赵敏',
    '周宁',
    '吴昊',
    '徐静',
    '孙悦',
    '马超',
    '朱琳',
    '胡杰',
    '林晓',
    '何涛',
    '郭颖',
    '高远',
    '罗欣',
    '郑凯',
    '梁晨',
    '宋佳',
    '唐磊',
    '许诺',
    '韩雪',
  ].map((label, index) => ({
    value: `demo-person-${index + 1}`,
    label,
    department: ['产品研发部', '交付项目组', '客户服务组'][index % 3] ?? '',
  })),
].map((person, index) => ({
  ...person,
  number: `WK${String(index + 1).padStart(4, '0')}`,
}));

export function zhijiScopeText(s: ZhijiScheme) {
  if (s.scopeMode === 'all') return '全员';
  const options =
    s.scopeMode === 'departments' ? zhijiDepartments : zhijiPeople;
  return options
    .filter((item) => s.scopeIds.includes(item.value))
    .map((item) => item.label)
    .join('、');
}
export function defaultSourcePrompt(id: string) {
  if (reportSourcePrompts[id]) return reportSourcePrompts[id];
  const source = zhijiSources.find((item) => item.id === id);
  return `根据${source?.name ?? '数据源'}的本期记录，总结${source?.description ?? '实际成果'}。保留事实依据与来源链接，区分已完成、进行中和风险，不编造缺失信息。`;
}
export function cloneZhijiScheme(s: ZhijiScheme): ZhijiScheme {
  return structuredClone(toRaw(s));
}
let serial = 20;
export function newZhijiScheme(): ZhijiScheme {
  return {
    layoutTemplates: structuredClone(toRaw(reportLayoutTemplates)),
    layoutTemplateIds: ['layout-classic', 'layout-executive', 'layout-warm'],
    defaultLayoutTemplateId: 'layout-classic',
    id: `scheme-${++serial}`,
    name: '',
    type: 'personal',
    description: '',
    scope: '产品研发部',
    scopeMode: 'departments',
    scopeIds: ['rd'],
    sourcePrompts: Object.fromEntries(
      zhijiSources.map((item) => [item.id, defaultSourcePrompt(item.id)]),
    ),
    owner: '员工本人',
    mode: 'fixed',
    periods: ['week'],
    defaultPeriod: 'week',
    anchor: '2026-01-05',
    autoGenerate: true,
    generateDay: 1,
    generateTime: '09:00',
    required: false,
    deadlineDay: 1,
    deadlineTime: '18:00',
    reminder: true,
    sources: ['tasks', 'tickets', 'projects', 'files'],
    sections: ['核心成果', '工作详情', '下期计划', '风险与协调'],
    template: 'outcome',
    prompt: zhijiTemplates[0]?.prompt ?? '请根据实际成果生成报告',
    recipients: ['产品团队'],
    reviewers: [],
    allowAdjustRecipients: true,
    status: 'draft',
    version: 0,
    updated: '尚未保存',
  };
}
export const zhijiSchemes = reactive<ZhijiScheme[]>([
  {
    ...newZhijiScheme(),
    id: 'weekly',
    name: '个人周报',
    description: '记录每周成果，让工作与协作清晰可见。',
    required: true,
    status: 'published',
    version: 2,
    updated: '2026-10-22 10:20',
  },
  {
    ...newZhijiScheme(),
    id: 'daily',
    name: '个人日报',
    description: '轻量同步每天的实际进展。',
    periods: ['day'],
    defaultPeriod: 'day',
    autoGenerate: false,
    status: 'published',
    version: 1,
    updated: '2026-10-21 16:40',
  },
  {
    ...newZhijiScheme(),
    id: 'project',
    name: '项目进展汇报',
    type: 'project',
    description: '项目经理按实际节奏选择汇报周期。',
    scope: '交付项目组',
    scopeIds: ['delivery'],
    owner: '项目经理',
    mode: 'selectable',
    periods: ['week', 'biweek', 'month', 'quarter'],
    template: 'progress',
    sections: [...(zhijiTypes[1]?.sections ?? [])],
    prompt: zhijiTemplates[1]?.prompt ?? '请根据实际成果生成报告',
    status: 'published',
    version: 3,
    updated: '2026-10-22 09:30',
  },
  {
    ...newZhijiScheme(),
    id: 'project-biweekly',
    name: '交付项目双周报',
    type: 'project',
    description: '每两周对齐交付成果与阶段风险。',
    scope: '交付项目组',
    scopeIds: ['delivery'],
    owner: '项目经理',
    periods: ['biweek'],
    defaultPeriod: 'biweek',
    template: 'progress',
    sections: [...(zhijiTypes[1]?.sections ?? [])],
    required: true,
    status: 'published',
    version: 1,
    updated: '2026-10-21 14:20',
  },
  {
    ...newZhijiScheme(),
    id: 'customer',
    name: '客户服务汇报',
    type: 'customer',
    description: '按月、季度或年度呈现客户服务价值。',
    scope: '客户服务组',
    scopeIds: ['service'],
    owner: '客户经理',
    mode: 'selectable',
    periods: ['week', 'month', 'quarter', 'year'],
    defaultPeriod: 'month',
    template: 'service',
    sections: [...(zhijiTypes[3]?.sections ?? [])],
    prompt: zhijiTemplates[2]?.prompt ?? '请根据实际成果生成报告',
    sources: ['projects', 'tasks', 'tickets', 'files'],
    status: 'published',
    version: 2,
    updated: '2026-10-21 11:30',
  },
  {
    ...newZhijiScheme(),
    id: 'productline',
    name: '产品月报',
    type: 'productline',
    description: '汇总版本交付与重点需求的进展。',
    scope: '产品研发部',
    owner: '产品线负责人',
    periods: ['month'],
    defaultPeriod: 'month',
    sources: ['projects', 'tasks', 'requirements', 'files'],
    sections: [...(zhijiTypes[2]?.sections ?? [])],
    status: 'published',
    version: 1,
    updated: '2026-10-22 10:00',
  },
]);
export const zhijiHistory = reactive<
  { id: string; name: string; snapshot: ZhijiScheme; version: number }[]
>([]);
export const zhijiExecutions = reactive([
  {
    id: 'RUN-1022-01',
    name: '个人周报',
    action: '草稿生成',
    time: '2026-10-22 09:00',
    status: '成功',
    detail: '已生成 8 份示例草稿，等待汇报者核对。',
    attempts: 1,
  },
  {
    id: 'RUN-1022-02',
    name: '客户服务汇报',
    action: '资料采集',
    time: '2026-10-22 09:05',
    status: '失败',
    detail: '巡检来源响应超时，已有报告未被覆盖。可模拟重试。',
    attempts: 1,
  },
  {
    id: 'RUN-1022-03',
    name: '项目进展汇报',
    action: '草稿生成',
    time: '2026-10-22 09:10',
    status: '成功',
    detail: '已生成项目草稿，未自动分发或创建任务。',
    attempts: 1,
  },
]);
export const zhijiObligations = reactive([
  {
    id: 'O-01',
    name: '个人周报',
    person: '王安康',
    scope: '产品研发部',
    period: '10.12 — 10.18',
    deadline: '10-19 18:00',
    status: '已提报',
    feedback: '待反馈',
    reviewer: '杨总',
    reminders: 0,
  },
  {
    id: 'O-02',
    name: '个人周报',
    person: '张三',
    scope: '产品研发部',
    period: '10.12 — 10.18',
    deadline: '10-19 18:00',
    status: '已逾期',
    feedback: '—',
    reviewer: '—',
    reminders: 0,
  },
  {
    id: 'O-03',
    name: '交付项目双周报',
    person: '李明',
    scope: '交付项目组',
    period: '10.12 — 10.25',
    deadline: '10-26 18:00',
    status: '待提报',
    feedback: '—',
    reviewer: '—',
    reminders: 0,
  },
  {
    id: 'O-04',
    name: '客户服务汇报',
    person: '陈静',
    scope: '客户服务组',
    period: '09.01 — 09.30',
    deadline: '自愿汇报',
    status: '已提报',
    feedback: '仅分享',
    reviewer: '无指定反馈人',
    reminders: 0,
  },
]);
export function zhijiCycleText(s: ZhijiScheme) {
  return s.mode === 'fixed'
    ? `固定 · ${periodLabel(s.defaultPeriod)}`
    : `自选 · ${s.periods.map((p) => periodLabel(p)).join(' / ')}`;
}
export function syncReporterScheme(s: ZhijiScheme) {
  const type = zhijiTypes.find((t) => t.id === s.type);
  if (!type) return;
  let target = reportSchemes.find((item) => item.id === s.id);
  const enabled = s.status === 'published' && type.enabled;
  if (!target) {
    const range = reportPeriodRange('2026-10-22', s.defaultPeriod, s.anchor);
    target = {
      id: s.id,
      title: s.name,
      type: type.name,
      icon: type.icon,
      color: '#147d70',
      object: s.scope,
      enabled,
      cadence: '',
      ...range,
      description: s.description,
      sources: [],
      summary: '此方案暂未采集到演示素材，请补充本期实际成果与计划。',
      metrics: [],
    };
    reportSchemes.push(target);
  }
  if (!target.start || !target.end) {
    Object.assign(
      target,
      reportPeriodRange('2026-10-22', s.defaultPeriod, s.anchor),
    );
  }
  Object.assign(target, {
    title: s.name,
    description: s.description,
    type: type.name,
    enabled,
    cadence: zhijiCycleText(s),
  });
  if (enabled && !demoReports.some((r) => r.schemeId === s.id)) {
    const draft = makeReport(target);
    draft.schemeConfig = cloneZhijiScheme(s);
    draft.period = s.defaultPeriod;
    demoReports.push(draft);
  }
}
export function validateZhijiScheme(s: ZhijiScheme): Record<string, string> {
  const errors: Record<string, string> = {};
  if (s.layoutTemplateIds !== undefined) {
    const requiredIds = s.layoutTemplateIds;
    const available = (s.layoutTemplates ?? reportLayoutTemplates).filter(
      (item) =>
        item.enabled &&
        item.kinds.includes(s.type) &&
        requiredIds.includes(item.id),
    );
    if (
      available.length === 0 ||
      !available.some((item) => item.id === s.defaultLayoutTemplateId)
    )
      errors.layoutTemplates =
        '请至少选择一个适用的启用模板，并设置有效的默认模板';
  }
  if (!s.name.trim()) errors.name = '请输入方案名称';
  const scopeOptions =
    s.scopeMode === 'departments' ? zhijiDepartments : zhijiPeople;
  if (
    s.scopeMode !== 'all' &&
    (s.scopeIds.length === 0 ||
      s.scopeIds.some((id) => !scopeOptions.some((item) => item.value === id)))
  )
    errors.scope = '请至少勾选一个有效部门或人员';
  if (s.required && (!Number.isSafeInteger(s.deadlineDay) || s.deadlineDay < 1))
    errors.deadlineDay = '请输入大于等于 1 的整数天数';
  if (s.periods.length === 0 || !s.periods.includes(s.defaultPeriod))
    errors.periods = '至少选择一个周期，默认周期必须在允许范围内';
  if (s.periods.includes('biweek')) {
    const date = new Date(`${s.anchor}T00:00:00`);
    if (!s.anchor || Number.isNaN(date.getTime()) || date.getDay() !== 1)
      errors.anchor = '双周起始日期请选择周一';
  }
  if (!s.prompt.trim()) errors.prompt = '请填写 AI 生成要求';
  if (s.autoGenerate && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(s.generateTime))
    errors.generateTime = '请填写有效的生成时间';
  if (s.required && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(s.deadlineTime))
    errors.deadlineTime = '请填写有效的截止时间';
  return errors;
}
export async function saveZhijiScheme(s: ZhijiScheme, publish: boolean) {
  s.autoGenerate = false;
  s.mode = 'fixed';
  s.periods = [s.defaultPeriod];
  s.scope = zhijiScopeText(s);
  if (Object.keys(validateZhijiScheme(s)).length > 0)
    throw new Error('请先补齐标记的配置项');
  await mockDelay(300);
  const old = zhijiSchemes.find((item) => item.id === s.id);
  if (old?.status === 'published' && !publish)
    throw new Error('已发布方案请使用发布新版本，避免影响正在使用的配置');
  if (publish && !zhijiTypes.find((t) => t.id === s.type)?.enabled)
    throw new Error('请先启用所属报告类型');
  if (old)
    zhijiHistory.unshift({
      id: old.id,
      name: old.name,
      version: old.version,
      snapshot: cloneZhijiScheme(old),
    });
  const saved: ZhijiScheme = {
    ...cloneZhijiScheme(s),
    status: publish ? 'published' : 'draft',
    version: publish ? (old?.version ?? 0) + 1 : (old?.version ?? 0),
    updated: new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Shanghai',
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date()),
  };
  if (old) Object.assign(old, saved);
  else zhijiSchemes.unshift(saved);
  syncReporterScheme(saved);
  return createMockResponse(saved);
}
zhijiSchemes.forEach((s) => syncReporterScheme(s));

for (const report of demoReports) {
  const config = zhijiSchemes.find((s) => s.id === report.schemeId);
  if (config && !report.schemeConfig) {
    report.schemeConfig = cloneZhijiScheme(config);
    report.period = config.defaultPeriod;
  }
}
