import type { MateChatSession } from '#/types/mate';
import type { ReportDraft } from '#/types/new-report';
import { computed, reactive } from 'vue';
import dayjs from 'dayjs';
import { reportPeriodRange } from '#/utils/report-period';
import { demoReports, makeReport, reportSchemes } from './mock-new-reports';
import {
  businessProfileForPeriod,
  defaultBusinessEdits,
  newBusinessState,
} from './mock-business-reports';
import { scopedBusinessProfile } from './mock-report-objects';
import { createMockResponse, mockDelay } from './mock-data';

export const reviewIdentity = '杨总';
export const reviewReportTypes = [
  { id: 'personal', title: '个人报告', icon: 'lucide:user-round' },
  { id: 'project', title: '项目报告', icon: 'lucide:folder-kanban' },
  { id: 'customer', title: '客户报告', icon: 'lucide:building-2' },
];
export interface ReviewReport {
  previousPlan?: { start: string; end: string; text: string };
  id: string;
  report: ReportDraft;
  author: string;
  department: string;
  type: string;
  assigned: boolean;
  aiScore: number;
  aiFeedback: string;
  concern: string;
}
export interface ReviewFeedback {
  score: number;
  text: string;
  time: string;
}
export const reviewFeedbacks = reactive<Record<string, ReviewFeedback>>({});
export const reviewKey = (entry: ReviewReport) =>
  `${entry.id}:v${entry.report.version}`;
function seed(
  schemeId: string,
  author: string,
  department: string,
  assigned: boolean,
  objectId?: string,
): ReviewReport {
  const scheme = reportSchemes.find((s) => s.id === schemeId)!;
  const report = makeReport(scheme);
  report.id = `RV-${schemeId}-${objectId ?? author}`;
  report.status = 'submitted';
  report.recipients = [reviewIdentity];
  report.reviewers = assigned ? [reviewIdentity] : [];
  report.title = `${author} · ${scheme.title}`;
  report.period =
    schemeId === 'daily' ? 'day' : schemeId === 'customer' ? 'month' : 'week';
  if (schemeId === 'customer')
    report.customerApproval = {
      status: assigned ? 'pending' : 'approved',
      reviewer: reviewIdentity,
      version: report.version,
    };
  if (objectId) {
    const scenario = schemeId === 'project' ? 'project' : 'operations';
    const profile = businessProfileForPeriod(
      scopedBusinessProfile(objectId, scenario),
      report.start,
      report.end,
    );
    report.business = {
      ...newBusinessState(schemeId),
      objectId,
      snapshots: { [scenario]: profile },
      drafts: {
        [scenario]: {
          ...defaultBusinessEdits(profile),
          reviewed: profile.blocks.map((b) => b.id),
        },
      },
    };
    report.title = `${profile.name} · ${scheme.title}`;
    report.summary = profile.conclusion;
  }
  return {
    id: `review-${report.id}`,
    report,
    author,
    department,
    type:
      schemeId === 'project'
        ? 'project'
        : schemeId === 'customer'
          ? 'customer'
          : 'personal',
    assigned,
    aiScore: schemeId === 'customer' ? 8.4 : 8.6,
    concern:
      schemeId === 'customer'
        ? '核对已解决问题、未闭环问题与下月服务安排。'
        : schemeId === 'project'
          ? '重点核对交付承诺、前置依赖和风险协调。'
          : '核对成果依据、完成标准与下一步计划。',
    aiFeedback:
      schemeId === 'project'
        ? '本期成果与阶段安排较清晰。建议补齐交付依据，明确风险的协调责任人和反馈时间，并确认下阶段计划已有任务承接。'
        : schemeId === 'customer'
          ? '服务成果有量化依据。请区分已解决与未闭环问题，补齐客户确认及整改证明，并明确下月问题闭环安排。'
          : '成果表达较清晰。请补齐成果物链接、验收标准，并明确下一周期交付和需协调的事项。',
  };
}
const seededReports = reactive<ReviewReport[]>([
  seed('weekly', '王安康', '产品团队', true),
  seed('daily', '王安康', '产品团队', true),
  seed('project', '小刚', '项目交付组', true, 'engine'),
  seed('project', '小刚', '项目交付组', false, 'edb'),
  seed('customer', 'Angus', '客户服务组', true, 'huachen'),
  seed('customer', 'Angus', '客户服务组', false, 'jinmao'),
]);
const reviewedExample = seededReports.find(
  (entry) => entry.report.schemeId === 'daily',
)!;
reviewFeedbacks[reviewKey(reviewedExample)] = {
  score: 8.8,
  text: '当天成果与后续工作区分清楚，继续补充成果依据并跟进未完成事项。',
  time: '2026-10-22 11:00',
};
// A department-sized sample for evaluating compact review and batch operations.
const teamNames = [
  '张三',
  '李明',
  '陈静',
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
];
const teamPeriod = reportPeriodRange(
  dayjs().subtract(1, 'week').format('YYYY-MM-DD'),
  'week',
);
teamNames.forEach((name, index) => {
  const entry = seed(
    'weekly',
    name,
    index % 3 === 0 ? '交付项目组' : '产品研发部',
    true,
  );
  const done = 3 + (index % 4);
  const delayed = index % 4 === 0 ? 1 : 0;
  const total = done + delayed;
  const module = [
    '客户接口联调',
    '待办模块设计',
    '需求文档评审',
    '运维数据汇总',
  ][index % 4]!;
  entry.previousPlan = {
    ...reportPeriodRange(
      dayjs(teamPeriod.start).subtract(1, 'week').format('YYYY-MM-DD'),
      'week',
    ),
    text: `完成${module}等 ${total} 项计划任务，保留成果记录，并安排下一阶段验收与任务承接。`,
  };
  Object.assign(entry.report, teamPeriod, {
    summary: `本周完成 ${done} / ${total} 项任务，推进${module}。${delayed ? '客户测试环境未确认，可能影响下阶段联调，需协调接口人确认。' : '本期计划任务已完成，交付记录待核对归档。'}`,
    risk: delayed
      ? '客户测试环境准备延期，可能影响下阶段联调，请协调客户接口人确认准备时间。'
      : '',
    plan: `下周推进${module}后续工作，确认交付标准与验收记录。`,
    generatedSections: [
      {
        id: 'tasks',
        title: '任务',
        icon: 'lucide:list-checks',
        description: '本周任务完成情况',
        enabled: true,
        needsAuth: false,
        summary: `本期计划 **${total} 项**，完成 **${done} 项**，延期 **${delayed} 项**。`,
        records: [
          {
            id: `TEAM-T-${index + 1}`,
            kind: '任务',
            title: module,
            detail: delayed
              ? '进行中：前置环境未确认，预计延期，需协调接口人。'
              : '已完成：本期任务已经完成，交付记录待核对。',
            statistics: {
              total,
              completed: done,
              active: delayed,
              delayed,
              planned: total,
              nextWeekPlanned: 2,
            },
          },
        ],
      },
    ],
  });
  entry.concern = delayed
    ? '客户测试环境未确认，可能影响联调进度。'
    : '本期计划任务已完成，核对成果与下一周承接。';
  seededReports.push(entry);
  if (index >= 9)
    reviewFeedbacks[reviewKey(entry)] = {
      score: 8.5 + (index % 5) / 10,
      text: `${name}本期完成情况已核对，请继续跟进下周任务承接与成果归档。`,
      time: `${teamPeriod.end} 18:30`,
    };
});
export const reviewReports = computed<ReviewReport[]>(() =>
  [
    ...seededReports,
    ...demoReports
      .filter(
        (report) =>
          report.status === 'submitted' &&
          (report.reviewers.includes(reviewIdentity) ||
            report.recipients.includes(reviewIdentity) ||
            report.recipients.includes('PMO / 项目管理部') ||
            report.recipients.includes('产品团队')),
      )
      .map((report) => ({
        id: `live-${report.id}`,
        report,
        author:
          report.schemeId === 'project'
            ? '项目经理'
            : report.schemeId === 'customer'
              ? '客户经理'
              : '王安康',
        department: '当前汇报工作台',
        type:
          report.schemeId === 'project'
            ? 'project'
            : report.schemeId === 'customer'
              ? 'customer'
              : 'personal',
        assigned: report.reviewers.includes(reviewIdentity),
        aiScore: 8.5,
        aiFeedback:
          '请结合报告成果和原始依据给出反馈，重点核对风险、交付与下一步计划。',
        concern: '来自新汇报助理已确认分发的报告。',
      })),
  ].sort(
    (a, b) =>
      b.report.end.localeCompare(a.report.end) ||
      b.report.id.localeCompare(a.report.id, undefined, { numeric: true }),
  ),
);

export async function submitReviewFeedback(
  id: string,
  version: number,
  score: number,
  text: string,
  decision?: 'approved' | 'changes',
) {
  const key = `${id}:v${version}`;
  const entry = reviewReports.value.find(
    (item) => item.id === id && item.report.version === version,
  );
  if (
    !entry?.assigned ||
    entry.report.status !== 'submitted' ||
    reviewFeedbacks[key]
  )
    throw new Error('当前报告无需反馈或已完成反馈');
  if (!Number.isFinite(score) || score < 0 || score > 10 || !text.trim())
    throw new Error('请填写 0—10 分和反馈意见');
  if (!Number.isInteger(score * 2))
    throw new Error('评分以半星为单位，每半星 0.5 分');
  if (entry.report.customerApproval?.status === 'pending' && !decision)
    throw new Error('请选择通过或退回修改');
  await mockDelay(350);
  if (
    entry.report.status !== 'submitted' ||
    entry.report.version !== version ||
    reviewFeedbacks[key]
  )
    throw new Error('报告版本已变化或已反馈，请重新查看');
  const feedback = {
    score,
    text: text.trim(),
    time: new Date().toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      hour12: false,
    }),
  };
  reviewFeedbacks[key] = feedback;
  if (entry.report.customerApproval?.status === 'pending') {
    Object.assign(entry.report.customerApproval, {
      status: decision,
      feedback: feedback.text,
      score,
      reviewedAt: feedback.time,
    });
    entry.report.history.unshift(
      `运维负责人${decision === 'approved' ? '审批通过' : '退回修改'} V${version}：${feedback.text}`,
    );
  }
  return createMockResponse(feedback);
}

export const reviewChatSessions = reactive<MateChatSession[]>([
  {
    id: 'review-chat-initial',
    employeeId: 'new-review-assistant',
    title: '本周待审核的汇报',
    relativeTime: '今天',
    unread: 0,
    messages: [
      {
        id: 'review-welcome',
        role: 'assistant',
        time: '刚刚',
        content:
          '我可以按个人、项目、客户报告整理待反馈清单，帮助核对成果、风险与计划。评分和意见由你确认后提交；普通分享报告无需强制反馈。',
      },
    ],
  },
]);
export async function replyReviewChat(text: string) {
  await mockDelay(450);
  const type = /客户/.test(text)
    ? 'customer'
    : /项目/.test(text)
      ? 'project'
      : /个人/.test(text)
        ? 'personal'
        : undefined;
  const entries = reviewReports.value.filter(
    (entry) => !type || entry.type === type,
  );
  const pending = entries.filter(
    (entry) => entry.assigned && !reviewFeedbacks[reviewKey(entry)],
  );
  const content = /怎么|规则|评分/.test(text)
    ? '指定给你的报告需要提交评分与反馈意见；普通分享只需阅读。进入「汇报审核」，可以按报告类型、日期、状态筛选，阅读报告后采纳或调整 AI 建议，确认后提交。AI 不会自动替你评分或发送反馈。'
    : `当前${type ? reviewReportTypes.find((item) => item.id === type)?.title : '全部报告'}共有 ${entries.length} 份，其中 ${pending.length} 份需要你评分反馈。${
        pending.length
          ? '建议先看：' +
            pending
              .slice(0, 3)
              .map((entry) => entry.report.title)
              .join('、') +
            '。'
          : '当前没有待反馈报告。'
      }请在「汇报审核」查看原文、成果与风险，再决定评分和反馈意见。`;
  return createMockResponse({ content });
}
