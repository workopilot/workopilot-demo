import dayjs from 'dayjs';
import { demoReports, makeReport, reportSchemes } from './mock-new-reports';
import {
  defaultReportObject,
  followedReportObjects,
  reportObjects,
} from './mock-report-objects';
import { newBusinessState } from './mock-business-reports';
import { reportPeriodRange } from '#/utils/report-period';
import type { ReportDraft } from '#/types/new-report';
import type { ReportPeriod } from '#/types/zhiji';

export type ReportCategory =
  'personal' | 'project' | 'customer' | 'productline';
export const reportCategories = [
  {
    id: 'personal',
    title: '个人报告',
    icon: 'lucide:user-round',
    description: '梳理个人成果，记录工作进展与下一步计划。',
    hint: '个人周报 · 个人日报',
    color: 'green',
  },
  {
    id: 'project',
    title: '项目报告',
    icon: 'lucide:folder-kanban',
    description: '按项目汇报阶段、任务、风险与协作计划。',
    hint: '项目周报 · 项目月报',
    color: 'blue',
  },
  {
    id: 'customer',
    title: '客户报告',
    icon: 'lucide:building-2',
    description: '按客户呈现服务成果、交付情况与跟进计划。',
    hint: '客户周报 · 客户月报',
    color: 'orange',
  },
  {
    id: 'productline',
    title: '产品报告',
    icon: 'lucide:layers',
    description: '同步产品版本、需求进展与后续迭代安排。',
    hint: '产品月报',
    color: 'teal',
  },
] as const;

export const hubReportGroups: {
  category: ReportCategory;
  schemeId: string;
  period: ReportPeriod;
  title: string;
}[] = [
  {
    category: 'personal',
    schemeId: 'weekly',
    period: 'week',
    title: '个人周报',
  },
  { category: 'personal', schemeId: 'daily', period: 'day', title: '个人日报' },
  {
    category: 'project',
    schemeId: 'project',
    period: 'week',
    title: '项目周报',
  },
  {
    category: 'project',
    schemeId: 'project',
    period: 'month',
    title: '项目月报',
  },
  {
    category: 'customer',
    schemeId: 'customer',
    period: 'week',
    title: '客户周报',
  },
  {
    category: 'customer',
    schemeId: 'customer',
    period: 'month',
    title: '客户月报',
  },
  {
    category: 'productline',
    schemeId: 'productline',
    period: 'month',
    title: '产品月报',
  },
];

export function hubObjects(category: ReportCategory) {
  if (category === 'project' || category === 'customer') {
    return reportObjects.filter(
      (item) =>
        item.kind === category &&
        followedReportObjects[category].includes(item.id),
    );
  }
  return [
    {
      id: '',
      name: category === 'personal' ? '我的报告' : '产品线',
      owner: '',
    },
  ];
}
function reportPeriod(report: ReportDraft): ReportPeriod {
  return (
    report.period ??
    (report.schemeId === 'daily'
      ? 'day'
      : report.schemeId === 'customer' || report.schemeId === 'productline'
        ? 'month'
        : 'week')
  );
}
export function hubReports(
  group: (typeof hubReportGroups)[number],
  objectId: string,
) {
  return demoReports.filter(
    (report) =>
      report.schemeId === group.schemeId &&
      reportPeriod(report) === group.period &&
      (!objectId ||
        (report.business?.objectId ?? defaultReportObject(report.schemeId)) ===
          objectId),
  );
}

const seeded = new Set<string>();
/** Static demonstration periods; never modifies an existing report's submission status. */
export function seedReportHub() {
  for (const group of hubReportGroups) {
    const scheme = reportSchemes.find(
      (item) => item.id === group.schemeId && item.enabled,
    );
    if (!scheme) continue;
    for (const object of hubObjects(group.category)) {
      const key = `${group.schemeId}:${group.period}:${object.id}`;
      if (seeded.has(key)) continue;
      seeded.add(key);
      const create = (start: string, end: string) => {
        const report = makeReport(scheme, start, end);
        report.period = group.period;
        report.title = `${object.id ? object.name : scheme.object} · ${group.title}`;
        if (object.id)
          report.business = {
            ...newBusinessState(group.schemeId),
            objectId: object.id,
          };
        report.generatedAt = `${start} 09:00`;
        demoReports.push(report);
        return report;
      };
      const anchor = dayjs().format('YYYY-MM-DD');
      for (
        let offset = 0;
        offset < 16 &&
        hubReports(group, object.id).filter((item) => item.status === 'draft')
          .length < 3;
        offset++
      ) {
        const date = dayjs(anchor).subtract(
          offset,
          group.period === 'day'
            ? 'day'
            : group.period === 'month'
              ? 'month'
              : 'week',
        );
        const range = reportPeriodRange(
          date.format('YYYY-MM-DD'),
          group.period,
        );
        if (
          !hubReports(group, object.id).some(
            (report) =>
              report.start === range.start && report.end === range.end,
          )
        )
          create(range.start, range.end);
      }
      if (
        !hubReports(group, object.id).some(
          (report) => report.status === 'submitted',
        )
      ) {
        const oldest =
          hubReports(group, object.id)
            .map((item) => item.start)
            .sort()[0] ?? anchor;
        const range = reportPeriodRange(
          dayjs(oldest).subtract(1, 'day').format('YYYY-MM-DD'),
          group.period,
        );
        const report = create(range.start, range.end);
        report.status = 'submitted';
        report.submittedAt = `${range.end} 18:00`;
        report.history = ['历史已提交报告示例，供查看只读预览。'];
      }
    }
  }
}

export function recentHubReports(
  group: (typeof hubReportGroups)[number],
  objectId: string,
) {
  const reports = hubReports(group, objectId);
  const drafts = reports
    .filter((item) => item.status === 'draft')
    .sort((a, b) => b.start.localeCompare(a.start))
    .slice(0, 3)
    .sort((a, b) => a.start.localeCompare(b.start));
  const latest = reports
    .filter((item) => item.status === 'submitted')
    .sort((a, b) => {
      const submittedTime = (report: ReportDraft) => {
        const submitted = dayjs(report.submittedAt);
        return report.submittedAt && submitted.isValid()
          ? submitted.valueOf()
          : dayjs(report.end).valueOf();
      };
      return submittedTime(b) - submittedTime(a);
    })[0];
  return latest ? [latest, ...drafts] : drafts;
}
