import type { ReportDraft, ReportScheme } from '#/types/new-report';
import { reactive } from 'vue';
import { createMockResponse, mockDelay } from './mock-data';

export const reportSchemes = reactive<ReportScheme[]>([
  {
    id: 'weekly',
    title: '个人周报',
    type: '个人报告',
    icon: 'lucide:calendar-days',
    color: '#268475',
    object: '王安康',
    enabled: true,
    cadence: '每周六 09:00',
    start: '2026-10-12',
    end: '2026-10-18',
    description: '把一周的工作，整理成看得见的成果。',
    summary:
      '本周完成汇报引擎需求梳理与交互方案评审，明确 4 类内置报告和分发反馈规则。推进 6 项任务，完成其中 4 项；处理 3 条产品反馈。剩余任务集中在汇报 Demo 绘制与数据源字段核对，计划下周继续推进。',
    metrics: [
      { label: '已完成任务', value: '4 / 6' },
      { label: '处理反馈', value: '3 条' },
      { label: '成果文档', value: '2 份' },
    ],
    sources: [
      {
        id: 'WO-JMF-004',
        kind: '工单',
        title: '金茂府 · 打印机故障处理',
        detail:
          '状态：已完成。已处理金茂府 4 台机器的打印机故障问题。处理范围：4 台设备。',
      },
      {
        id: 'WO-HT-001',
        kind: '工单',
        title: '航天 · 扫描仪卡纸处理',
        detail: '状态：已完成。已处理航天扫描仪卡纸问题。',
      },
      {
        id: 'WO-TT-002',
        kind: '工单',
        title: '铁塔 · 数据无法同步',
        detail:
          '状态：进行中。数据无法同步问题已持续 2 天，工程师正在排查，原因尚未明确。协调建议：协调其他工程师共同排查和处理。',
      },
      {
        id: 'P-HT-012',
        kind: '项目',
        title: '华天项目 · 接口对接与验收',
        detail:
          '状态：已完成。已对接完成 12 个接口，已验收通过。完成目标：本阶段接口对接与验收。',
      },
      {
        id: 'P-ML-EDB',
        kind: '项目',
        title: '曼伦 EDB 项目 · 需求调研',
        detail:
          '状态：已完成。需求调研已完成。交付物：需求文档；正式文档链接待补充。下一阶段：进入设计阶段。',
      },
      {
        id: 'T-102',
        kind: '任务',
        title: '汇报引擎需求梳理',
        detail:
          '负责人：王安康；状态：已完成。交付物：需求方案 V1.3，明确类型、分发和行动确认规则。',
      },
      {
        id: 'T-108',
        kind: '任务',
        title: '新汇报助理交互 Demo',
        detail:
          '负责人：王安康；状态：进行中。计划：10 月 19—25 日；已有任务覆盖“绘制汇报 Demo”，可直接关联。',
      },
      {
        id: 'DOC-21',
        kind: '文件',
        title: '方案评审记录与需求文档',
        detail:
          '2 份成果：需求文档和方案评审记录。此处为演示素材快照，不打开真实公司文件。',
      },
    ],
  },
  {
    id: 'daily',
    title: '个人日报',
    type: '个人报告',
    icon: 'lucide:sun',
    color: '#b68135',
    object: '王安康',
    enabled: true,
    cadence: '工作日 18:00',
    start: '2026-10-22',
    end: '2026-10-22',
    description: '轻量记录今天的进展，及时同步重点。',
    summary:
      '今日已完成汇报方案入口与报告阅读布局设计，核对 2 条提报反馈规则。下午继续补充任务建议确认流程；当前草稿统计截至 10:00，后续工作可在人工补充区记录。',
    metrics: [
      { label: '完成事项', value: '2 项' },
      { label: '核对规则', value: '2 条' },
      { label: '数据截至', value: '10:00' },
    ],
    sources: [
      {
        id: 'D-22',
        kind: '手工记录',
        title: '10 月 22 日上午工作记录',
        detail:
          '已完成方案入口及阅读布局；下午安排为人工计划，不计入已完成成果。',
      },
      {
        id: 'T-108',
        kind: '任务',
        title: '新汇报助理交互 Demo',
        detail: '进行中，目标交付为汇报页面及任务确认交互。',
      },
    ],
  },
  {
    id: 'project',
    title: '项目周报',
    type: '项目报告',
    icon: 'lucide:folders',
    color: '#5878b9',
    object: '喔壳平台 · 汇报引擎',
    enabled: true,
    cadence: '每周五 17:00',
    start: '2026-10-19',
    end: '2026-10-25',
    description: '从项目事实出发，同步进度、风险与协作事项。',
    summary:
      '本周期截至 10 月 22 日，汇报引擎已完成方案评审，12 项工作中已完成 8 项，剩余 4 项推进中。关键路径为 Demo 确认及客户报告字段映射。已确认的项目素材包含 1 条接口协调诉求，尚未形成正式工单。',
    metrics: [
      { label: '完成任务', value: '8 / 12' },
      { label: '确认素材', value: '3 条' },
      { label: '协调事项', value: '1 项' },
    ],
    sources: [
      {
        id: 'P-01',
        kind: '项目',
        title: '汇报引擎里程碑与任务进度',
        detail:
          '单项目：12 项任务，8 项完成，4 项进行中。当前为周期内进度快照，不表示周期末结果。',
      },
      {
        id: 'T-210',
        kind: '任务',
        title: '接口联调',
        detail:
          '计划 10 月 26—30 日，已有联调任务；不包含验收材料整理，可建议补充子任务。',
      },
      {
        id: 'M-03',
        kind: '项目素材',
        title: '客户字段映射协调诉求',
        detail:
          '项目成员已确认披露的协调条目；项目可引用该条目，不开放成员整篇个人报告。',
      },
    ],
  },
  {
    id: 'customer',
    title: '客户月报',
    type: '客户报告',
    icon: 'lucide:building-2',
    color: '#8870ae',
    object: '华辰医药',
    enabled: true,
    cadence: '每月 1 日 09:00',
    start: '2026-09-01',
    end: '2026-09-30',
    description: '用服务数据呈现价值，让每次客户沟通有据可依。',
    summary:
      '9 月为华辰医药处理 28 张工单，全部已关闭，平均响应时长 18 分钟；完成 4 次上门巡检。客户满意度收回 12 份有效问卷，平均 4.8 / 5 分。1 份巡检整改证明尚未归档，需补充成果附件后用于客户服务沟通。',
    metrics: [
      { label: '关闭工单', value: '28 张' },
      { label: '上门巡检', value: '4 次' },
      { label: '满意度', value: '4.8 / 5' },
    ],
    sources: [
      {
        id: 'C-28',
        kind: '工单',
        title: '9 月客户服务工单汇总',
        detail: '28 张已关闭工单，平均响应 18 分钟；仅华辰医药客户范围。',
      },
      {
        id: 'V-04',
        kind: '巡检',
        title: '4 次上门巡检记录',
        detail: '完成 4 次巡检；第 4 次巡检整改证明待补充，不伪造缺失成果。',
      },
      {
        id: 'Q-12',
        kind: '问卷',
        title: '客户满意度回访',
        detail:
          '12 份有效问卷，平均评分 4.8/5；此数据用于服务成果，不自动产生收费决定。',
      },
    ],
  },
  {
    id: 'productline',
    title: '产品月报',
    type: '产品线报告',
    icon: 'lucide:layers',
    color: '#548074',
    object: '产品线',
    enabled: true,
    cadence: '每月 1 日 09:00',
    start: '2026-10-01',
    end: '2026-10-31',
    description: '汇总产品版本交付、重点需求与下期迭代计划。',
    summary:
      '本期完成统一汇报引擎方案评审，明确个人、项目、客户和产品四类报告入口。下一阶段推进交互方案确认与版本交付，具体完成数量以已确认的需求和任务记录为准。',
    metrics: [],
    sources: [
      {
        id: 'PRODUCT-REPORT',
        kind: '需求',
        title: '统一汇报引擎 · 需求评审',
        detail:
          '已完成报告分类与汇报流程方案评审，待确认版本范围与下期迭代任务。',
      },
    ],
  },
]);

let serial = 100;
export function makeReport(
  scheme: ReportScheme,
  start = scheme.start,
  end = scheme.end,
): ReportDraft {
  return {
    id: `R-${++serial}`,
    schemeId: scheme.id,
    title: `${scheme.object} · ${scheme.title}`,
    start,
    end,
    summary: scheme.summary,
    supplement: '',
    plan:
      scheme.id === 'weekly' && start === scheme.start && end === scheme.end
        ? '**曼伦 EDB 项目**进入设计阶段，完成 **首页** 和 **待办模块** 的设计。'
        : '',
    risk:
      scheme.id === 'weekly' && start === scheme.start && end === scheme.end
        ? '**铁塔数据同步问题**已持续 `2 天`，工程师正在排查，原因尚未明确。建议协调其他工程师共同排查和处理。'
        : '',
    status: 'draft',
    version: 1,
    generatedAt: '2026-10-22 10:00',
    recipients: [],
    reviewers: [],
    actions: [],
    materials: [],
    versions: [],
    history: ['AI 已按方案整理示例素材，生成草稿。'],
  };
}
export const demoReports = reactive<ReportDraft[]>(
  reportSchemes.filter((s) => s.enabled).map((s) => makeReport(s)),
);
export const receivedReports = reactive([
  {
    id: 'in-1',
    title: '汇报引擎 · 项目进展报告',
    author: '小刚',
    period: '10 月 19 日 — 10 月 25 日',
    assigned: true,
    score: 0,
    feedback: '',
    done: false,
    summary:
      '已完成方案评审及 8 项任务，待确认客户字段映射和 Demo 页面。需要产品侧补充工单关闭口径。',
  },
  {
    id: 'in-2',
    title: '华辰医药 · 9 月服务报告',
    author: '运维服务组',
    period: '9 月 1 日 — 9 月 30 日',
    assigned: false,
    score: 0,
    feedback: '',
    done: false,
    summary:
      '本月关闭 28 张工单，完成 4 次巡检，满意度 4.8/5。分享给产品团队参考，无需评分反馈。',
  },
]);
export async function regenerateReport(report: ReportDraft) {
  await mockDelay(650);
  return createMockResponse(
    `${reportSchemes.find((s) => s.id === report.schemeId)?.summary ?? report.summary}\n\n核心结论：成果与剩余工作已分开呈现；后续行动以人工确认的计划和任务为准。${report.supplement ? '人工补充保留在独立区域，不并入来源事实。' : ''}`,
  );
}
