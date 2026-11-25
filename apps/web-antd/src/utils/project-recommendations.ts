import type { EmployeeRecommendationContext } from '#/types/employee-recommendation';
import type { ManagedProject } from '#/types/project-management';

import { recommendationEmployee } from './employee-recommendations';

/** Legacy Demo records can use MM/DD; interpret them in the stated reference year. */
function deadlineDate(value: string, today: string) {
  const full = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(value);
  const short = /^(\d{1,2})\/(\d{1,2})$/.exec(value);
  if (!full && !short) return undefined;
  const year = Number(full?.[1] ?? today.slice(0, 4));
  const month = Number(full?.[2] ?? short?.[1]);
  const day = Number(full?.[3] ?? short?.[2]);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  )
    return undefined;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Suggestions follow the selected project's real stage, owners and unfinished work. */
export function projectRecommendations(
  project: ManagedProject,
  currentEmployeeId: string,
  today = new Date().toLocaleDateString('sv-SE'),
) {
  const stage =
    project.stages.find((item) => item.name === project.stage) ??
    project.stages.find((item) =>
      ['blocked', 'in-progress', 'ready'].includes(item.status),
    ) ??
    project.stages.at(-1);
  const tasks = project.stages.flatMap((item) =>
    item.objectives.flatMap((objective) => objective.krs),
  );
  const overdue = tasks.filter((task) => {
    const deadline = deadlineDate(task.dueDate, today);
    return task.status !== 'accepted' && deadline && deadline < today;
  });
  const risky = project.health === 'at-risk' || project.health === 'blocked';
  const completed = project.progress >= 100;
  const objective = stage?.objectives.find((item) => item.progress < 100);
  const owner = objective?.owner || stage?.owner || project.manager;
  const taskTitle =
    objective?.title || `${stage?.name || project.stage}后续工作`;
  const context: EmployeeRecommendationContext = {
    currentEmployeeId,
    source: 'project-detail',
    businessId: project.id,
    title: `项目详情 · ${project.name}`,
    query: { projectId: project.id },
    summary: [
      `项目：${project.name}（${project.code}）`,
      `项目经理：${project.manager}；当前阶段：${stage?.name || project.stage}；整体进度：${project.progress}%`,
      `阶段负责人：${owner}；当前目标：${taskTitle}`,
      `项目说明：${project.summary}`,
      `未验收且已过截止日期的任务：${overdue.length} 项（核对日期 ${today}；未标年份的日期按 ${today.slice(0, 4)} 年解释）`,
      ...overdue
        .slice(0, 6)
        .map(
          (task) =>
            `- ${task.title}；负责人：${task.owner}；截止：${task.dueDate}；编号：${task.id}`,
        ),
    ].join('\n'),
  };
  let meetingType = '项目周会';
  let meetingReason = `项目当前处于“${stage?.name || project.stage}”，适合通过周会对齐本周进展。`;
  if (risky) {
    meetingType = '风险协调会';
    meetingReason = `项目当前存在风险，需要${owner}与相关成员对齐阻塞和处理安排。`;
  }
  if (completed) {
    meetingType = '项目复盘会';
    meetingReason = '项目进度已达 100%，可以组织成果复盘。';
  }
  let taskReason = `“${taskTitle}”需要明确下一步执行安排，优先核对已有任务。`;
  if (completed) taskReason = '项目已完成，可核对任务验收依据并整理成果。';
  if (overdue.length > 0)
    taskReason = `当前有 ${overdue.length} 项未验收任务已过截止日期，先核对延期，再安排跟进。`;
  return {
    context,
    overdueTasks: overdue,
    employees: [
      recommendationEmployee('meeting-assistant', meetingReason, [
        {
          id: 'meeting',
          title: `为${project.name}准备${meetingType}`,
          icon: 'lucide:calendar-plus',
          prompt: `请为${project.name}准备${meetingType}草稿，结合当前阶段、负责人和未完成事项整理议题。候选参会人包括${project.manager}和${owner}；请先核对名单并询问时间，不直接预约或发送邀请。`,
        },
      ]),
      recommendationEmployee('project-assistant', taskReason, [
        {
          id: 'query-tasks',
          title: `查询${project.name}的${completed ? '任务验收情况' : '延期任务'}`,
          icon: 'lucide:list-checks',
          prompt: `请仅查询项目 ${project.name}（${project.id}）的${completed ? '任务验收情况与待补充依据' : '延期任务，按负责人列出截止时间、当前状态和阻塞原因'}。以当前记录为准，无记录时明确说明，不编造结果。`,
        },
        ...(completed
          ? []
          : [
              {
                id: 'create-task',
                title: `给${owner}创建“${taskTitle}”跟进任务`,
                icon: 'lucide:clipboard-plus',
                prompt: `请先查询项目 ${project.name} 的已有任务，检查“${taskTitle}”是否已有覆盖。已有则建议补充；没有则为${owner}准备任务草稿，关联项目 ${project.id}，询问截止时间和验收标准，确认后再创建。`,
              },
            ]),
      ]),
    ],
  };
}
