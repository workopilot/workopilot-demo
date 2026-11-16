import type { ReviewReport } from '#/api/mock-new-review';
import { materialSections } from '#/api/mock-report-materials';

export interface ReviewNextAction {
  id: string;
  title: string;
  icon: string;
  prompt: string;
}
export interface ReviewNextEmployee {
  id: string;
  name: string;
  avatar: string;
  role: string;
  path: string;
  reason: string;
  actions: ReviewNextAction[];
}
function plain(text: string) {
  return text
    .replace(/[*`#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
/** Deterministic Demo suggestions based on the actual submitted snapshot and its author. */
export function reviewInsights(entry: ReviewReport) {
  const report = entry.report;
  const name = entry.author;
  const snapshot = report.business?.snapshots?.[report.business.scenario];
  const edit = report.business?.drafts[report.business.scenario];
  const records = (report.generatedSections ?? materialSections(report))
    .filter((section) => section.enabled && !section.needsAuth)
    .flatMap((section) => section.records);
  const riskBlocks =
    snapshot?.blocks.filter(
      (block) => block.tone === 'risk' || /risk/.test(block.id),
    ) ?? [];
  const candidates = [
    report.risk,
    edit?.notes.risks ?? '',
    ...riskBlocks.flatMap((block) => [
      block.summary,
      ...block.items.map((item) => `${item.title}：${item.detail}`),
    ]),
    ...(snapshot?.taskRecords
      ?.filter((item) => item.state === 'delayed')
      .map((item) => `${item.title}：${item.detail}`) ?? []),
    ...records
      .filter((record) =>
        record.statistics
          ? record.statistics.delayed > 0
          : /延期|超时|待确认|无法同步|待协调|尚未明确/.test(record.detail),
      )
      .map((record) => `${record.title}：${record.detail}`),
  ]
    .map(plain)
    .filter(
      (text) =>
        text && !/^(?:当前)?(?:暂无|没有|未发现|无已确认|无风险)/.test(text),
    );
  const risk = candidates.join('；');
  const hasRisk = candidates.length > 0;
  const interfaceRisk = /接口|联调|字段映射/.test(risk);
  const issue = interfaceRisk
    ? '接口协调'
    : /同步/.test(risk)
      ? '数据同步问题'
      : /资源|人手|人员不足/.test(risk)
        ? '资源协调'
        : /验收|交付/.test(risk)
          ? '交付风险'
          : /工单|故障|设备/.test(risk)
            ? '运维问题'
            : '风险协调';
  const planBlocks =
    snapshot?.blocks.filter(
      (block) => block.tone === 'plan' || /plan/.test(block.id),
    ) ?? [];
  const plan = plain(
    [
      report.plan,
      ...planBlocks.flatMap((block) => [
        block.summary,
        ...block.items.map((item) => `${item.title}：${item.detail}`),
      ]),
    ].join('；'),
  );
  const nextPeriod =
    report.period === 'day' || report.schemeId === 'daily'
      ? '明日'
      : report.period === 'month' || report.schemeId === 'customer'
        ? '下月'
        : '下周';
  const allText = [
    report.summary,
    report.supplement,
    ...records.map((record) => `${record.title} ${record.detail}`),
  ].join(' ');
  const strengths: string[] = [];
  if (/\d/.test(allText))
    strengths.push('包含量化数据，可据此核对本期完成情况与交付进展。');
  if (/已完成|已验收|验收通过|已关闭/.test(allText))
    strengths.push('已完成事项有状态说明，便于区分产出与进行中的工作。');
  if (plan) strengths.push(`已说明${nextPeriod}安排，可以继续核对任务承接。`);
  if (!strengths.length)
    strengths.push('已形成报告摘要，可结合原始记录进一步核对成果。');
  const improvements: string[] = [];
  if (hasRisk)
    improvements.push(
      `${name}的${issue}需要明确责任人、预计解决时间与所需支持。`,
    );
  if (!Object.values(report.attachments ?? {}).flat().length)
    improvements.push('成果物与验收凭据需核实：材料引用不等同于已上传附件。');
  if (!plan)
    improvements.push(`请${name}补充${nextPeriod}计划，并确认是否有对应任务。`);
  else
    improvements.push(
      `请核对${name}${nextPeriod}计划中的负责人、完成时间和验收标准。`,
    );
  const opinion = `${name}的本期报告已提供工作进展${strengths.length > 1 ? '与成果线索' : ''}，建议结合原始依据确认完成结果。${hasRisk ? `请优先补齐${issue}的推进责任人和反馈时间。` : '请进一步核实成果物与完成标准。'}${plan ? `同时确认${nextPeriod}计划已有任务承接。` : `补充${nextPeriod}明确可执行的工作计划。`}`;
  const tasks: ReviewNextEmployee = {
    id: 'project-assistant',
    name: '项目助理',
    avatar: '产品经理.jpg',
    role: '项目任务 · 执行跟进',
    path: '/app/mate/employee/project-assistant/project-chat',
    reason: hasRisk
      ? `报告涉及${issue}，同时核对计划承接。`
      : `结合${name}的报告确认计划和成果。`,
    actions: [
      {
        id: 'plan',
        title: `确认${name}${nextPeriod}的项目任务`,
        icon: 'lucide:list-checks',
        prompt: `请与${name}核对${nextPeriod}项目任务，先检查已有任务是否覆盖计划，明确负责人、截止时间与验收标准；没有覆盖时再建议创建，等待确认。`,
      },
      hasRisk
        ? {
            id: 'risk',
            title: `跟进${name}的${interfaceRisk ? '接口联调进度' : issue}`,
            icon: 'lucide:flag',
            prompt: `请跟进${name}报告中的${issue}，核对原定计划、当前阻塞、影响范围及预计完成时间，优先补充已有任务。依据：${risk}`,
          }
        : {
            id: 'outcome',
            title: `核对${name}的成果验收`,
            icon: 'lucide:badge-check',
            prompt: `请核对${name}本期已完成事项的交付物、验收依据与完成标准，列出待补充材料，不直接修改完成状态。`,
          },
      {
        id: 'evidence',
        title: `整理${name}待补充的成果依据`,
        icon: 'lucide:paperclip',
        prompt: `请根据${name}的报告和关联素材，梳理成果物链接、验收记录与完成标准的缺项，形成补充清单。`,
      },
    ],
  };
  const ticket: ReviewNextEmployee = {
    id: 'ticket-assistant',
    name: '工单助理',
    avatar: '技术员.jpg',
    role: '服务工单 · 问题闭环',
    path: '/app/mate/employee/ticket-assistant/ticket-chat',
    reason: `围绕${name}负责客户的服务记录确认闭环情况。`,
    actions: [
      {
        id: 'service',
        title: `核对${name}本期的工单闭环`,
        icon: 'lucide:ticket',
        prompt: `请与${name}核对本期客户工单的完成数量、客户确认及未闭环事项，先查询已有记录，不直接转派或新建工单。`,
      },
      hasRisk
        ? {
            id: 'follow',
            title: `跟进${name}的${issue}`,
            icon: 'lucide:clock-3',
            prompt: `请跟进${name}报告中的${issue}，明确处理责任人、下一次反馈时间和需要协调的资源。依据：${risk}`,
          }
        : {
            id: 'verify',
            title: `补齐${name}的客户确认记录`,
            icon: 'lucide:file-check-2',
            prompt: `请核对${name}本期已完成工单是否有客户确认和整改依据，列出待补清单，不代替客户确认。`,
          },
      {
        id: 'next-service',
        title: `确认${name}${nextPeriod}的服务任务`,
        icon: 'lucide:calendar-check',
        prompt: `请核对${name}${nextPeriod}客户服务计划与已有工单、巡检或任务的覆盖关系，避免重复创建，待我确认后再操作。`,
      },
    ],
  };
  const meetings: ReviewNextEmployee = {
    id: 'meeting-assistant',
    name: '会议助理',
    avatar: '项目经理.jpg',
    role: '风险协调 · 沟通推进',
    path: '/app/mate/employee/meeting-assistant/project-chat',
    reason: hasRisk
      ? `围绕${name}的${issue}准备沟通。`
      : `围绕${name}的下期安排做对齐与复盘。`,
    actions: [
      hasRisk
        ? {
            id: 'coordinate',
            title: `约${name}开${issue}会`,
            icon: 'lucide:users-round',
            prompt: `请为${name}准备一次推进${issue}的协调会议，依据报告梳理需要参与的人、阻塞问题、待决事项和建议时间。先生成会议草稿，不直接预约或通知。依据：${risk}`,
          }
        : {
            id: 'align',
            title: `约${name}确认${nextPeriod}工作安排`,
            icon: 'lucide:calendar-plus',
            prompt: `请为${name}准备${nextPeriod}工作计划沟通草稿，核对交付目标、参与人员和前置依赖，时间待确认，不直接发送会议邀请。`,
          },
      {
        id: 'review',
        title: `和${name}复盘${hasRisk ? `${issue}事项` : '本期交付成果'}`,
        icon: 'lucide:messages-square',
        prompt: `请准备与${name}的${hasRisk ? '风险与阻塞' : '成果'}复盘议题，列出报告依据、需要澄清的问题以及期望形成的决策与后续跟进项，不自动安排会议。`,
      },
    ],
  };
  return {
    summary:
      plain(report.summary).slice(0, 190) ||
      `${name}已提交本期报告，重点核对${entry.concern}`,
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 3),
    opinion,
    risk,
    plan,
    employees: [entry.type === 'customer' ? ticket : tasks, meetings],
  };
}
