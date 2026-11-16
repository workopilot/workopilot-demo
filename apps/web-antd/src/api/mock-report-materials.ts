import type {
  ReportDraft,
  ReportSource,
  ReportMaterialSection,
} from '#/types/new-report';
import { personalSourceOverview } from './mock-personal-report-statistics';
import { reactive } from 'vue';
import { demoReports, reportSchemes } from './mock-new-reports';

export const sourceDefinitions = [
  {
    id: 'tickets',
    title: '工单',
    icon: 'lucide:ticket',
    description: '处理结果、客户反馈与服务成果',
  },
  {
    id: 'projects',
    title: '项目',
    icon: 'lucide:folder-kanban',
    description: '项目进展、里程碑与协作风险',
  },
  {
    id: 'tasks',
    title: '任务',
    icon: 'lucide:list-checks',
    description: '完成事项、交付物与待办进度',
  },
  {
    id: 'git',
    title: 'Git',
    icon: 'lucide:git-branch',
    description: '授权仓库中的提交与合并记录',
  },
  {
    id: 'requirements',
    title: '需求',
    icon: 'lucide:lightbulb',
    description: '需求评审、变更和验收结果',
  },
  {
    id: 'files',
    title: '文件与其他',
    icon: 'lucide:files',
    description: '成果文件、巡检与满意度记录',
  },
];
export type SourceSettings = Record<string, boolean>;
export const reportSourceSettings = reactive<Record<string, SourceSettings>>(
  {},
);
export const gitConnection = reactive({ authorized: false });
export function settingsFor(id: string): SourceSettings {
  const config = demoReports.find((r) => r.id === id)?.schemeConfig;
  if (!reportSourceSettings[id] && config)
    return Object.fromEntries(
      sourceDefinitions.map((source) => [
        source.id,
        config.sources.includes(source.id),
      ]),
    );
  return (
    reportSourceSettings[id] ?? {
      tickets: true,
      projects: true,
      tasks: true,
      git: true,
      requirements: false,
      files: true,
    }
  );
}

/** Each period has independent material samples; other periods are intentionally empty. */
export function materialSections(
  report: ReportDraft,
  settings = settingsFor(report.id),
) {
  const scheme = reportSchemes.find((item) => item.id === report.schemeId);
  const hasSample =
    scheme?.start === report.start &&
    scheme?.end === report.end &&
    scheme.sources.length > 0;
  const buckets: Record<string, ReportSource[]> = Object.fromEntries(
    sourceDefinitions.map((item) => [item.id, []]),
  );
  if (hasSample && scheme) {
    for (const source of scheme.sources) {
      const key = /工单/.test(source.kind)
        ? 'tickets'
        : /任务/.test(source.kind)
          ? 'tasks'
          : /项目/.test(source.kind)
            ? 'projects'
            : /需求/.test(source.kind)
              ? 'requirements'
              : /Git/i.test(source.kind)
                ? 'git'
                : 'files';
      buckets[key]!.push(source);
    }
    if (!buckets.projects!.length)
      buckets.projects!.push({
        id: scheme.id === 'customer' ? 'P-C01' : 'P-021',
        kind: '项目',
        title:
          scheme.id === 'customer' ? '华辰医药运维服务' : '汇报引擎方案与 Demo',
        detail:
          scheme.id === 'customer'
            ? '本期服务围绕工单闭环与巡检整改开展；下一步补齐整改证明，形成客户沟通材料。'
            : '已确认个人、项目、产品线、客户四类业务报告范围；当前阶段聚焦员工侧草稿核对与提报流程。',
      });
    if (!buckets.tickets!.length)
      buckets.tickets!.push({
        id: 'WO-031',
        kind: '工单',
        title: '报告数据口径反馈处理',
        detail:
          '已整理工单关闭口径与来源字段反馈，待核对服务成果链接。此条为所选周期的演示工单素材。',
      });
    if (!buckets.tasks!.length)
      buckets.tasks!.push({
        id: scheme.id === 'customer' ? 'T-C07' : 'T-108',
        kind: '任务',
        title:
          scheme.id === 'customer' ? '归档巡检整改证明' : '绘制员工汇报页面',
        detail:
          scheme.id === 'customer'
            ? '巡检记录已整理，整改证明尚待补充；需明确归档时间。'
            : '已完成报告卡片与草稿布局，继续补齐数据源配置及任务建议确认流程。',
      });
    buckets.git!.push({
      id: 'demo-7c91a',
      kind: 'Git',
      title:
        scheme.id === 'customer'
          ? 'fix: 完善客户服务巡检日志'
          : 'feat: 增加汇报草稿核对页面',
      detail:
        scheme.id === 'customer'
          ? '示例仓库 workopilot-demo，分支 customer/service；补充华辰医药服务巡检日志记录。仅展示模拟授权后的提交摘要。'
          : '示例仓库 workopilot-demo，分支 feature/report；涉及报告入口、来源区块与人工补充表单。仅展示模拟授权后的提交摘要。',
    });
    buckets.requirements!.push({
      id: 'REQ-026',
      kind: '需求',
      title:
        scheme.id === 'customer'
          ? '客户巡检整改需求确认'
          : '统一汇报引擎需求评审',
      detail:
        scheme.id === 'customer'
          ? '已确认巡检整改证明的归档要求，后续服务计划待与客户核对。'
          : '已确认定时只生成草稿，行动建议必须人工确认；分发接收人与指定反馈人分别配置。',
    });
  }
  return sourceDefinitions.map((definition) => {
    const enabled = !!settings[definition.id];
    const needsAuth = definition.id === 'git' && !gitConnection.authorized;
    const records =
      enabled && !needsAuth
        ? buckets[definition.id]!.map((item) => {
            if (definition.id !== 'projects') return item;
            if (item.id === 'P-HT-012')
              return {
                ...item,
                projectTasks: [
                  {
                    id: 'HT-T01',
                    title: '完成约定的 12 个接口对接',
                    status: 'completed' as const,
                    detail: '已完成接口对接，接口数量与任务数量分别统计。',
                  },
                  {
                    id: 'HT-T02',
                    title: '接口联调与问题处理',
                    status: 'completed' as const,
                    detail: '已完成联调并处理本阶段问题。',
                  },
                  {
                    id: 'HT-T03',
                    title: '接口验收确认',
                    status: 'completed' as const,
                    detail: '本阶段接口已验收通过。',
                  },
                ],
                statistics: {
                  total: 3,
                  planned: 3,
                  nextWeekPlanned: 0,
                  completed: 3,
                  active: 0,
                  delayed: 0,
                },
              };
            if (item.id === 'P-ML-EDB')
              return {
                ...item,
                projectTasks: [
                  {
                    id: 'EDB-T01',
                    title: '需求调研与需求文档',
                    status: 'completed' as const,
                    detail: '已完成需求调研，正式成果链接待补齐。',
                  },
                  {
                    id: 'EDB-T02',
                    title: '首页模块设计',
                    status: 'active' as const,
                    detail: '设计工作推进中，下周继续完成与评审。',
                  },
                  {
                    id: 'EDB-T03',
                    title: '待办模块设计',
                    status: 'active' as const,
                    detail: '设计工作推进中，纳入下周项目任务。',
                  },
                  {
                    id: 'EDB-T04',
                    title: '需求文档正式版归档',
                    status: 'delayed' as const,
                    detail: '成果链接未补齐，需确认归档时间与协调人。',
                  },
                ],
                statistics: {
                  total: 4,
                  planned: 4,
                  nextWeekPlanned: 2,
                  completed: 1,
                  active: 2,
                  delayed: 1,
                  delayedDescription:
                    '需求文档正式版归档延期，成果链接未补齐；需补充归档时间、延期申请情况及协调人。',
                },
              };
            return item;
          })
        : [];
    const section: ReportMaterialSection = {
      ...definition,
      enabled,
      needsAuth,
      records,
      summaryFormat: 'markdown-overview',
      summary: '',
    };
    section.summary = personalSourceOverview(section);
    return section;
  });
}
