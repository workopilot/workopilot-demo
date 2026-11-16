import type { ReportMaterialSection } from '#/types/new-report';
import type { ReportPeriod } from '#/types/zhiji';

/** Shared factual overview for the personal editor and final preview. */
export function personalReportOverview(
  sections: ReportMaterialSection[],
  period: ReportPeriod = 'week',
) {
  const label = (
    {
      day: '今天',
      week: '本周',
      biweek: '本双周',
      month: '本月',
      quarter: '本季度',
      year: '本年',
    } as Record<ReportPeriod, string>
  )[period];
  const included = sections.filter(
    (section) => section.enabled && !section.needsAuth,
  );
  const recordsFor = (id: string) => [
    ...new Map(
      included
        .filter((section) => section.id === id)
        .flatMap((section) => section.records)
        .map((record) => [record.id, record]),
    ).values(),
  ];
  const projects = recordsFor('projects');
  const tickets = recordsFor('tickets');
  const projectTasks = new Map(
    projects
      .flatMap((project) => project.projectTasks ?? [])
      .map((task) => [task.id, task]),
  );
  const tasks = recordsFor('tasks').filter(
    (task) => !projectTasks.has(task.id),
  );
  const done = (detail: string) =>
    /已完成|已处理|已关闭|已确认|已验收/.test(detail) &&
    !/状态：进行中|状态：延期|状态：超时|正在排查|未完成/.test(detail);
  const delayed = (detail: string) =>
    /延期|超时/.test(detail) &&
    !/未延期|未超时|无延期|无超时|是否|尚未判定/.test(detail);
  const sentences: string[] = [];
  if (projects.length)
    sentences.push(
      `参与 ${projects.length} 个项目，分别是${projects.map((project) => project.title.split(' · ')[0]).join('、')}`,
    );
  if (tickets.length) {
    const completed = tickets.filter((ticket) => done(ticket.detail)).length;
    const late = tickets.filter((ticket) => delayed(ticket.detail)).length;
    sentences.push(
      `处理 ${tickets.length} 条工单，已完成 ${completed} 条，${tickets.length - completed} 条待跟进${late ? `，其中 ${late} 条延期或超时` : ''}`,
    );
  }
  const completeProjectStats = projects.every(
    (project) => !!project.statistics,
  );
  const listedProjectTasks =
    projects.length > 0 &&
    projects.every(
      (project) =>
        project.projectTasks &&
        project.statistics &&
        project.projectTasks.length === project.statistics.total,
    );
  const projectCount = (key: 'completed' | 'active' | 'delayed') =>
    listedProjectTasks
      ? [...projectTasks.values()].filter((task) => task.status === key).length
      : projects.reduce(
          (sum, project) => sum + (project.statistics?.[key] ?? 0),
          0,
        );
  if (projects.length || tasks.length) {
    const independentDone = tasks.filter((task) => done(task.detail)).length;
    const independentLate = tasks.filter((task) => delayed(task.detail)).length;
    const independentActive = tasks.filter(
      (task) =>
        /进行中|排查/.test(task.detail) &&
        !delayed(task.detail) &&
        !done(task.detail),
    ).length;
    if (completeProjectStats) {
      const completed = projectCount('completed') + independentDone;
      const active = projectCount('active') + independentActive;
      const late = projectCount('delayed') + independentLate;
      sentences.push(
        `完成 ${completed} 项任务${projects.length && tasks.length ? `（项目任务 ${projectCount('completed')} 项、独立任务 ${independentDone} 项）` : ''}，${active} 项任务进行中，${late} 项任务延期`,
      );
    } else {
      if (tasks.length)
        sentences.push(
          `独立任务完成 ${independentDone} 项、延期 ${independentLate} 项`,
        );
      sentences.push('项目任务完成及延期数量待采集');
    }
  }
  return sentences.length
    ? `${label}${sentences.join('；')}。`
    : `${label}暂无可确认的项目、工单和任务统计，请核实数据源或补充经确认的成果。`;
}
export function needsNextWeekProjectTasks(section: ReportMaterialSection) {
  return (
    section.id === 'projects' &&
    section.records.length > 0 &&
    !section.records.some(
      (record) =>
        (record.statistics?.nextWeekPlanned ?? 0) > 0 ||
        (record.statistics?.active ?? 0) > 0,
    )
  );
}
export function personalSourceStatistics(section: ReportMaterialSection) {
  const records = section.records;
  const done = records.filter(
    (item) =>
      /已完成|已处理|已验收|已关闭|已确认/.test(item.detail) &&
      !/状态：进行中/.test(item.detail),
  ).length;
  const delayed = records.filter((item) =>
    /延期|超时/.test(item.detail),
  ).length;
  if (section.id === 'projects') {
    const stats = records
      .map((item) => item.statistics)
      .filter((item) => !!item);
    const complete = stats.length === records.length;
    return [
      { label: '本期参与项目', value: records.length, unit: '个' },
      {
        label: '项目任务总数',
        value: complete
          ? stats.reduce((sum, item) => sum + item.total, 0)
          : '待采集',
        unit: '项',
      },
      {
        label: '已完成任务',
        value: complete
          ? stats.reduce((sum, item) => sum + item.completed, 0)
          : '待采集',
        unit: '项',
      },
      {
        label: '延期任务',
        value: complete
          ? stats.reduce((sum, item) => sum + item.delayed, 0)
          : '待采集',
        unit: '项',
      },
    ];
  }
  return [
    {
      label: section.id === 'tickets' ? '本期处理工单' : '本期采集记录',
      value: records.length,
      unit: '条',
    },
    { label: '已完成 / 已确认', value: done, unit: '条' },
    { label: '待跟进', value: records.length - done, unit: '条' },
    { label: '延期 / 超时', value: delayed, unit: '条' },
  ];
}

/** Mock AI output: one Markdown document, with raw records kept outside the body. */
export function personalSourceOverview(section: ReportMaterialSection): string {
  if (!section.records.length) return '';
  const stats = personalSourceStatistics(section);
  const overview = [
    `| ${stats.map((item) => item.label).join(' | ')} |`,
    `| ${stats.map(() => '---').join(' | ')} |`,
    `| ${stats.map((item) => `**\`${item.value}${typeof item.value === 'number' ? item.unit : ''}\`**`).join(' | ')} |`,
  ].join('\n');
  const counts = section.records
    .map((item) => item.statistics)
    .filter((item) => !!item);
  const completed = section.records.filter(
    (item) =>
      /已完成|已处理|已验收|已关闭|已确认/.test(item.detail) &&
      !/状态：进行中|排查/.test(item.detail),
  ).length;
  const following = section.records.filter((item) =>
    /进行中|排查|延期|超时|阻碍|无法/.test(item.detail),
  );
  const missingEvidence = section.records.filter((item) =>
    /(?:成果|文档|链接|材料|证明|附件|验收|标准)[^。；]{0,20}(?:待补充|尚待|未归档|尚未)|(?:待补充|尚待|未归档)[^。；]{0,20}(?:成果|文档|链接|材料|证明|附件|验收|标准)/.test(
      item.detail,
    ),
  ).length;
  let result: string;
  let risk: string;
  if (section.id === 'projects') {
    const allCollected = counts.length === section.records.length;
    const total = counts.reduce((sum, item) => sum + item.total, 0);
    const done = counts.reduce((sum, item) => sum + item.completed, 0);
    const active = counts.reduce((sum, item) => sum + item.active, 0);
    const delayed = counts.reduce((sum, item) => sum + item.delayed, 0);
    result = allCollected
      ? `本期参与 \`${section.records.length}\` 个项目，关联任务共 \`${total}\` 项，**已完成 \`${done}\` 项**，进行中 \`${active}\` 项，延期 \`${delayed}\` 项。项目成果与验收依据见关联数据源。`
      : `本期参与 \`${section.records.length}\` 个项目；已完成的阶段成果见关联数据源。**任务总数与完成率尚待采集**，不使用接口数量代替任务数量。`;
    const cell = (text: string) =>
      text.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
    const projectRows = section.records.map((record) => {
      const statistics = record.statistics;
      const name = cell(record.title.split(' · ')[0] ?? record.title);
      const planned =
        statistics?.planned === undefined
          ? '待采集'
          : `**\`${statistics.planned}项\`**`;
      const completed = statistics
        ? `**\`${statistics.completed}项\`**`
        : '待采集';
      const nextWeek =
        statistics?.nextWeekPlanned === undefined
          ? '待采集'
          : `**\`${statistics.nextWeekPlanned}项\`**`;
      const delay = !statistics
        ? '任务状态待采集'
        : statistics.delayed > 0
          ? `**\`${statistics.delayed}项\`**：${cell(statistics.delayedDescription || '延期任务名称、原因及预计完成时间待补充；请确认是否已申请延期、是否需要加班或协调支持。')}`
          : '';
      return `| ${name} | ${planned} | ${completed} | ${nextWeek} | ${delay} |`;
    });
    result +=
      '\n\n**参与项目与任务进展**\n\n' +
      [
        '| 项目 | 计划任务数 | 完成任务数 | 下周计划数 | 延期任务（说明） |',
        '| --- | --- | --- | --- | --- |',
        ...projectRows,
      ].join('\n');
    risk = !allCollected
      ? '任务状态尚未采集完整，暂不能判断延期数量与风险情况；请补充实际进展、交付影响和所需支持。'
      : delayed
        ? `**有 \`${delayed}\` 项延期任务需要解释**。请确认是否已申请延期、预计完成时间、是否影响里程碑，以及是否需要加班或协调支持。`
        : '';
  } else if (section.id === 'tickets') {
    result = `本期处理 \`${section.records.length}\` 条工单，**已完成 \`${completed}\` 条**，其余 \`${section.records.length - completed}\` 条需持续跟进。已完成数量按工单记录统计，不将设备数量折算成工单数量。`;
    risk = following.length
      ? `**\`${following.length}\` 条工单仍有异常或未闭环**，需要补充业务影响、排查进展、协调人员和下次反馈时间。是否超时以工单时限字段为准，不凭持续天数推定。`
      : '本期采集记录未发现明确的处理中或异常工单，请核实关闭结果与客户确认情况。';
  } else if (section.id === 'git') {
    result = `本期采集 \`${section.records.length}\` 条代码变更摘要，作为研发成果的补充依据。**提交数量不等于任务完成数量**，合并与验证结果需结合关联记录核实。`;
    risk =
      '请补充变更产生的业务效果、验证结果与发布状态；尚未合并或验证的变更不表述为已交付。';
  } else if (section.id === 'files') {
    result = `本期归集 \`${section.records.length}\` 条成果文件记录，用于支撑文档、方案与验收成果。**文件数量不代表业务任务完成数量**。`;
    risk = missingEvidence
      ? `有 \`${missingEvidence}\` 条记录的成果依据尚待补齐，请补充正式文件、链接或签收确认。`
      : '请确认成果文件为正式版本，并具备相应访问权限和完成依据。';
  } else {
    result = `本期采集 \`${section.records.length}\` 条${section.title}记录，**已完成或确认 \`${completed}\` 条**，其余 \`${section.records.length - completed}\` 条需核对进展与完成标准。`;
    risk = following.length
      ? `有 \`${following.length}\` 条事项仍在推进或存在异常，请补充延期原因、预计完成时间与所需支持。`
      : '未采集到明确的延期或阻塞标记，请核对实际进展与完成标准。';
  }
  if (missingEvidence && section.id !== 'files')
    risk += `\n\n- **成果依据待补**：\`${missingEvidence}\` 条记录涉及待补材料或待确认事项，请补齐成果链接、附件或验收标准。`;
  return `**本期统计**\n\n${overview}\n\n**完成情况**\n\n${result}${risk.trim() ? `\n\n**风险与关注**\n\n${risk.trim()}` : ''}`;
}
