import type {
  BusinessReportProfile,
  ProjectReportTask,
} from '#/types/business-report';

function task(
  id: string,
  title: string,
  owner: string,
  state: ProjectReportTask['state'],
  periodPlanned = false,
  nextPeriod = false,
): ProjectReportTask {
  return {
    id,
    title,
    owner,
    state,
    periodPlanned,
    nextPeriod,
    status:
      state === 'completed' ? '已完成' : state === 'active' ? '进行中' : '延期',
    detail: `${title}；负责人：${owner}。`,
    evidence: `项目任务 / ${id}`,
  };
}
function fixtureTasks(objectId: string): ProjectReportTask[] {
  if (objectId === 'engine')
    return [
      task('T-191', '项目启动与范围确认', '小刚', 'completed'),
      task('T-192', '业务访谈与记录', '小刚', 'completed'),
      task('T-193', '接口清单盘点', '项目工程师', 'completed'),
      task('T-194', '数据样例准备', '项目工程师', 'completed'),
      task('T-195', '汇报业务规则确认', '王安康', 'completed'),
      task('T-201', '统一汇报需求基线', '小刚', 'completed', true),
      task('T-202', '核心流程交互原型', '王安康', 'completed', true),
      task('T-203', '项目数据口径确认', '小刚', 'completed', true),
      task('T-204', '客户字段映射确认', '项目工程师', 'delayed', true),
      task('T-210', '接口联调准备', '项目工程师', 'active', false, true),
      task('T-211', '联调样例验证', '项目工程师', 'active'),
      task('T-212', '数据访问权限核验', '项目工程师', 'active'),
    ];
  if (objectId === 'edb')
    return [
      task('EDB-T01', '需求调研与需求文档', '小刚', 'completed', true),
      task('EDB-T02', '首页模块设计', '设计工程师', 'active', true, true),
      task('EDB-T03', '待办模块设计', '设计工程师', 'active', true, true),
      task('EDB-T04', '需求文档正式版归档', '小刚', 'delayed', true),
    ];
  if (objectId === 'huatian')
    return [
      task('HT-T01', '12 个接口对接', '项目工程师', 'completed', true),
      task('HT-T02', '接口联调与问题处理', '项目工程师', 'completed', true),
      task('HT-T03', '接口验收确认', '小刚', 'completed', true),
    ];
  return [];
}
const cell = (value: string) =>
  value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
export function projectOwnerSummary(tasks: ProjectReportTask[]) {
  if (!tasks.length)
    return '本周期暂无已采集的项目任务与负责人统计，可补充经确认的任务进展。';
  const count = (condition: (task: ProjectReportTask) => boolean) =>
    tasks.filter(condition).length;
  const number = (value: number | undefined) =>
    value === undefined ? '待确认' : `**\`${value}\`**`;
  const rows = [...new Set(tasks.map((task) => task.owner))].map((owner) => {
    const owned = tasks.filter((task) => task.owner === owner);
    const plannedKnown = owned.every(
      (task) => task.periodPlanned !== undefined,
    );
    const nextKnown = owned.every((task) => task.nextPeriod !== undefined);
    return `| ${cell(owner)} | ${number(plannedKnown ? owned.filter((task) => task.periodPlanned).length : undefined)} | ${number(plannedKnown ? owned.filter((task) => task.periodPlanned && task.state === 'completed').length : undefined)} | ${number(owned.filter((task) => task.state === 'active').length)} | ${owned.some((task) => task.state === 'delayed') ? number(owned.filter((task) => task.state === 'delayed').length) : ''} | ${number(nextKnown ? owned.filter((task) => task.nextPeriod).length : undefined)} |`;
  });
  const plannedKnown = tasks.every((task) => task.periodPlanned !== undefined);
  return `> 本期计划 ${number(plannedKnown ? count((task) => !!task.periodPlanned) : undefined)} 项，完成 ${number(plannedKnown ? count((task) => !!task.periodPlanned && task.state === 'completed') : undefined)} 项；当前进行中 ${number(count((task) => task.state === 'active'))} 项，延期 ${number(count((task) => task.state === 'delayed'))} 项。\n\n| 负责人 | 本期计划 | 本期完成 | 进行中 | 延期 | 下期任务 |\n| --- | --- | --- | --- | --- | --- |\n${rows.join('\n')}\n\n按已关联任务统计，具体工作与负责人见下方关联数据源。`;
}
/** Four stable modules; existing manual notes retain their original block IDs. */
export function simplifyProjectReport(
  input: BusinessReportProfile,
  objectId: string,
  allowMockTasks = true,
): BusinessReportProfile {
  const profile: BusinessReportProfile = JSON.parse(JSON.stringify(input));
  if (profile.kind !== 'project') return profile;
  const byId = (id: string) => profile.blocks.find((block) => block.id === id);
  const delivery = byId('delivery');
  const outcomes = byId('outcomes');
  const taskBlock = byId('tasks');
  const plan = byId('plan');
  const risks = byId('risks');
  const hasTaskData = profile.metrics.length > 0 || !!taskBlock?.items.length;
  const tasks =
    profile.taskRecords ??
    (allowMockTasks && hasTaskData
      ? fixtureTasks(objectId)
      : (taskBlock?.items ?? []).map((item) => ({
          ...item,
          owner: item.owner ?? '待确认',
          state: /延期|阻塞/.test(item.status ?? '')
            ? ('delayed' as const)
            : /已完成|已验收/.test(item.status ?? '')
              ? ('completed' as const)
              : ('active' as const),
        })));
  profile.taskRecords = tasks;
  const progressText = outcomes
    ? [
        delivery?.summary,
        outcomes.summary ? `**本期成果**\n\n${outcomes.summary}` : '',
      ]
        .filter(Boolean)
        .join('\n\n')
    : (delivery?.summary ?? profile.conclusion);
  const sources = [
    ...new Map(
      [...(delivery?.items ?? []), ...(outcomes?.items ?? [])].map((item) => [
        item.id,
        item,
      ]),
    ).values(),
  ];
  profile.blocks = [
    {
      id: 'delivery',
      title: '当前阶段与进展',
      icon: 'lucide:route',
      summary: progressText,
      items: sources,
    },
    {
      id: 'tasks',
      title: '任务情况与负责人',
      icon: 'lucide:users-round',
      summary: projectOwnerSummary(tasks),
      items: tasks,
    },
    {
      id: 'risks',
      title: '风险与需要协调',
      icon: 'lucide:flag',
      summary: risks?.items.length
        ? risks.summary
        : /无已确认|暂无|没有/.test(risks?.summary ?? '')
          ? ''
          : (risks?.summary ?? ''),
      items: risks?.items ?? [],
      tone: 'risk',
    },
    {
      id: 'plan',
      title: '下期计划',
      icon: 'lucide:calendar-arrow-up',
      summary: plan?.summary ?? '',
      items: plan?.items ?? [],
      tone: 'plan',
    },
  ];
  return profile;
}
