import { computed, reactive } from 'vue';
import dayjs from 'dayjs';
import { createMockResponse, mockDelay } from './mock-data';
import { reviewReports, reviewFeedbacks, reviewKey } from './mock-new-review';
import type { ReviewReport } from './mock-new-review';
import { periodLabel, reportPeriodRange } from '#/utils/report-period';
import type { ReportPeriod } from '#/types/zhiji';
import { reviewInsights } from '#/utils/review-insights';

export type ReviewWorkState = 'pending' | 'approved' | 'missing' | 'shared';
export interface ReviewSignal {
  tone: 'risk' | 'positive';
  label: string;
  detail: string;
}
export interface ReviewWorkItem {
  id: string;
  author: string;
  department: string;
  type: string;
  period: ReportPeriod;
  start: string;
  end: string;
  title: string;
  summary: string;
  reference: string;
  entry?: ReviewReport;
  deadline?: string;
}
const period = reportPeriodRange(
  dayjs().subtract(1, 'week').format('YYYY-MM-DD'),
  'week',
);
export const missingReviewReports = reactive<ReviewWorkItem[]>(
  ['周昕', '陈磊', '许悦'].map((author, index) => ({
    id: `missing-weekly-${index}`,
    author,
    department: index === 1 ? '交付项目组' : '产品研发部',
    type: 'personal',
    period: 'week',
    ...period,
    title: `${author} · 个人周报`,
    summary: '尚未提交本期报告，提交后才能阅读与审批。',
    reference: '应交清单',
    deadline: `${dayjs(period.end).add(1, 'day').format('YYYY-MM-DD')} 18:00`,
  })),
);
export const reviewReminderRecords = reactive<
  Record<string, { time: string; text: string }>
>({});
export function reviewWorkState(item: ReviewWorkItem): ReviewWorkState {
  if (!item.entry) return 'missing';
  if (!item.entry.assigned) return 'shared';
  return reviewFeedbacks[reviewKey(item.entry)] ? 'approved' : 'pending';
}
export function reviewWorkScore(item: ReviewWorkItem) {
  return item.entry ? reviewFeedbacks[reviewKey(item.entry)]?.score : undefined;
}
export function reviewWorkLabel(item: ReviewWorkItem) {
  const state = reviewWorkState(item);
  if (state === 'approved')
    return `${item.entry?.report.customerApproval?.status === 'changes' ? '已退回' : '已反馈'} ${reviewWorkScore(item)}分`;
  return { pending: '待审批', missing: '未提交', shared: '分享给我' }[state];
}
export function reportFormatLabel(item: ReviewWorkItem) {
  return `${item.type === 'project' ? '项目' : item.type === 'customer' ? '客户' : '个人'}${periodLabel(item.period)}`;
}
export function reviewSignals(entry: ReviewReport): ReviewSignal[] {
  const analysis = reviewInsights(entry);
  const signals: ReviewSignal[] = [];
  if (/延期|延误|超时|阻塞|影响.{0,12}(联调|交付|进度)/.test(analysis.risk))
    signals.push({
      tone: 'risk',
      label: '进度滞后风险',
      detail: analysis.risk,
    });
  else if (analysis.risk)
    signals.push({ tone: 'risk', label: '需协调跟进', detail: analysis.risk });
  const records =
    entry.report.generatedSections
      ?.filter((section) => section.enabled)
      .flatMap((section) => section.records) ?? [];
  const stats = records
    .filter((record) => record.kind === '任务')
    .map((record) => record.statistics)
    .filter((value) => value && value.total > 0);
  if (stats.length && stats.every((value) => value!.completed === value!.total))
    signals.push({
      tone: 'positive',
      label: '任务100%完成',
      detail:
        '依据报告任务统计，本期纳入统计的任务均已完成；成果物仍需人工核对。',
    });
  else if (/超预期|提前完成/.test(entry.report.summary))
    signals.push({
      tone: 'positive',
      label: '交付亮点',
      detail: entry.report.summary,
    });
  return signals.slice(0, 2);
}
export function reviewPlanComparison(entry: ReviewReport) {
  const prior = reviewReports.value
    .filter(
      (item) =>
        item.author === entry.author &&
        item.report.schemeId === entry.report.schemeId &&
        item.report.end < entry.report.start,
    )
    .sort((a, b) => b.report.end.localeCompare(a.report.end))[0];
  const text = prior?.report.plan.trim() || entry.previousPlan?.text || '';
  const previous = text ? text.replace(/[*`#>]/g, '') : '未找到上期计划快照';
  const analysis = reviewInsights(entry);
  return {
    previous,
    assessment: text
      ? '请对照上期承诺和本期完成情况，确认交付依据、延期原因及下一步承接。'
      : '上期计划依据不足，本次仅依据当前报告预审，不自动判断计划已完成。',
    opinion: text
      ? `${entry.author}上期计划：${previous} 本期报告：${entry.report.summary} ${analysis.opinion}`
      : analysis.opinion,
  };
}
export const reviewWorkItems = computed<ReviewWorkItem[]>(() => [
  ...reviewReports.value.map((entry) => ({
    id: entry.id,
    author: entry.author,
    department: entry.department,
    type: entry.type,
    entry,
    period:
      entry.report.period ??
      (entry.report.schemeId === 'daily'
        ? 'day'
        : entry.type === 'customer'
          ? 'month'
          : 'week'),
    start: entry.report.start,
    end: entry.report.end,
    title: entry.report.title,
    summary: entry.report.summary,
    reference: [
      `V${entry.report.version}`,
      entry.report.business?.snapshots?.[
        entry.report.business.scenario
      ]?.projectNames[0]
        ?.split('·')[0]
        ?.trim(),
    ]
      .filter(Boolean)
      .join(' · '),
  })),
  ...missingReviewReports,
]);
export async function remindReviewReports(ids: string[], text: string) {
  if (!text.trim()) throw new Error('请填写催交内容');
  const targets = missingReviewReports.filter(
    (item) => ids.includes(item.id) && !reviewReminderRecords[item.id],
  );
  if (!targets.length) throw new Error('没有可催交的未提交报告');
  await mockDelay(300);
  const time = new Date().toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour12: false,
  });
  targets.forEach((item) => {
    if (!reviewReminderRecords[item.id])
      reviewReminderRecords[item.id] = { time, text: text.trim() };
  });
  return createMockResponse({ count: targets.length });
}
