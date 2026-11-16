import { computed, ref } from 'vue';

export type TodoBucket = 'completed' | 'ignored' | 'pending';
export type TodoScope = 'assigned' | 'created';
export type TodoPriority = 'high' | 'normal' | 'urgent';
export type TodoType =
  | 'approval'
  | 'deliverable'
  | 'policy'
  | 'reply'
  | 'report'
  | 'risk';

export interface TodoTimelineItem {
  detail: string;
  time: string;
  title: string;
}

export interface TodoEvidenceItem {
  label: string;
  value: string;
}

export interface TodoItem {
  actionLabel: string;
  aiReason: string;
  assignee: string;
  bucket: TodoBucket;
  createdAt: string;
  detail: string;
  dueAt: string;
  endDate?: string;
  evidence: TodoEvidenceItem[];
  id: string;
  priority: TodoPriority;
  projectId?: string;
  projectName?: string;
  relatedLabel: string;
  requester: string;
  response?: string;
  scope: TodoScope;
  sourceIcon: string;
  sourceLabel: string;
  summary: string;
  timeline: TodoTimelineItem[];
  title: string;
  type: TodoType;
}

export const todoItems = ref<TodoItem[]>([
  {
    id: 'todo-001',
    title: '确认客户验收报告并完成阶段准出',
    summary: '交付上线阶段的客户验收报告已提交，等待你确认是否满足准出规则。',
    bucket: 'pending',
    type: 'deliverable',
    priority: 'urgent',
    sourceLabel: 'AI PMO',
    sourceIcon: 'lucide:briefcase-business',
    projectId: 'huada-crm',
    projectName: '华达药业 CRM',
    relatedLabel: '交付上线阶段 · 客户验收报告',
    assignee: '王安康',
    requester: '周小曼',
    scope: 'assigned',
    createdAt: '今天 09:42',
    dueAt: '今天 17:30',
    endDate: '2026-09-08',
    detail:
      '客户验收报告已由项目经理上传。AI 已完成完整性校验，签字页、验收范围和遗留问题清单均已识别，但仍需你确认后才能完成阶段准出。',
    aiReason: '这是项目关键路径上的门禁动作，若今天未确认，交付上线阶段将延迟 1 天。',
    actionLabel: '确认并通过',
    evidence: [
      { label: '成果物', value: '客户验收报告' },
      { label: 'AI 质检', value: '完整度 96%，无阻断项' },
      { label: '阶段负责人', value: '周小曼' },
    ],
    timeline: [
      { time: '今天 09:42', title: '提交成果物', detail: '周小曼上传客户验收报告。' },
      { time: '今天 09:44', title: 'AI 完成质检', detail: '识别 3 项准出规则，均已满足。' },
    ],
  },
  {
    id: 'todo-002',
    title: '补充相机联调延期说明',
    summary: '成果物已延期 2 天，系统仍未收到根因、恢复计划和新的承诺时间。',
    bucket: 'pending',
    type: 'risk',
    priority: 'urgent',
    sourceLabel: '项目助理',
    sourceIcon: 'lucide:bot',
    projectId: 'ningde-d4',
    projectName: '宁德 D4 检测相机升级',
    relatedLabel: '实施研发阶段 · 相机驱动接口联调测试报告',
    assignee: '王安康',
    requester: '项目助理',
    scope: 'assigned',
    createdAt: '今天 08:50',
    dueAt: '已逾期 2 天',
    endDate: '2026-09-06',
    detail:
      '系统连续两天未检测到代码合并记录或测试报告。请补充延期根因、预计恢复时间，以及是否需要协调资源。信息会同步给项目经理并进入本周项目周报。',
    aiReason: '该成果物阻塞后续试运行，建议今天完成延期说明并明确恢复计划。',
    actionLabel: '提交延期说明',
    evidence: [
      { label: '原计划', value: '2026-09-05 完成' },
      { label: '当前证据', value: '无代码合并记录、无测试报告' },
      { label: '影响范围', value: '试运行阶段预计顺延 2 天' },
    ],
    timeline: [
      { time: '09-05 18:00', title: '首次提醒', detail: '项目助理提醒成果物当日到期。' },
      { time: '09-06 10:00', title: '升级提醒', detail: '未收到说明，转入待办。' },
    ],
  },
  {
    id: 'todo-003',
    title: '审批喔壳 3.0 交付基线变更',
    summary: '研发阶段建议顺延 4 天，影响测试开始时间，但不影响正式发布时间。',
    bucket: 'pending',
    type: 'approval',
    priority: 'high',
    sourceLabel: 'AI PMO',
    sourceIcon: 'lucide:briefcase-business',
    projectId: 'worko-30',
    projectName: '喔壳 3.0 版本',
    relatedLabel: '变更申请 CR-20260907-03',
    assignee: '王安康',
    requester: '陈立',
    scope: 'assigned',
    createdAt: '昨天 16:18',
    dueAt: '明天 12:00',
    endDate: '2026-09-09',
    detail:
      '因权限中心接口调整，研发阶段申请顺延 4 天。项目经理已压缩测试准备窗口，当前方案不改变正式发布时间。',
    aiReason: '调整后的缓冲仅剩 2 天，建议批准时增加“每日同步接口联调进展”的约束。',
    actionLabel: '进入审批',
    evidence: [
      { label: '原基线', value: '研发阶段 09-12 完成' },
      { label: '建议基线', value: '研发阶段 09-16 完成' },
      { label: '总交付期', value: '保持 10-30 不变' },
    ],
    timeline: [
      { time: '昨天 15:40', title: '发起变更', detail: '陈立提交交付基线变更申请。' },
      { time: '昨天 16:18', title: 'AI 完成影响分析', detail: '未发现合同交付风险。' },
    ],
  },
  {
    id: 'todo-004',
    title: '确认项目交付管理制度解析结果',
    summary: 'AI 从新上传的制度中识别出 5 个阶段和 12 条阶段提示词。',
    bucket: 'pending',
    type: 'policy',
    priority: 'normal',
    sourceLabel: 'AI PMO',
    sourceIcon: 'lucide:scan-text',
    relatedLabel: '制度与模板 · 交付类项目模板',
    assignee: '王安康',
    requester: '项目管理部',
    scope: 'assigned',
    createdAt: '昨天 14:06',
    dueAt: '09-09 18:00',
    endDate: '2026-09-09',
    detail:
      '《项目交付管理制度》已解析完成。保存前需要确认阶段名称、阶段顺序，以及各阶段用于拆分目标与成果物的提示词。',
    aiReason: '制度解析结果会影响之后所有交付类项目的立项生成，应在正式启用前人工确认。',
    actionLabel: '查看并确认',
    evidence: [
      { label: '来源文件', value: '项目交付管理制度.docx' },
      { label: '解析结果', value: '5 个阶段、12 条提示词' },
      { label: '模板版本', value: '交付类项目 V2（草稿）' },
    ],
    timeline: [
      { time: '昨天 13:52', title: '上传制度', detail: '项目管理部上传新版制度。' },
      { time: '昨天 14:06', title: '解析完成', detail: 'AI 生成模板草稿，等待确认。' },
    ],
  },
  {
    id: 'todo-005',
    title: '回复测试资源协调请求',
    summary: '王小明在周报中请求你确认下周是否可以协调 1 名测试人员。',
    bucket: 'pending',
    type: 'reply',
    priority: 'normal',
    sourceLabel: '汇报助理',
    sourceIcon: 'lucide:notebook-pen',
    relatedLabel: '王小明 · 2026 年第 36 周周报',
    assignee: '王安康',
    requester: '王小明',
    scope: 'assigned',
    createdAt: '昨天 11:20',
    dueAt: '09-09 12:00',
    endDate: '2026-09-09',
    detail:
      '王小明计划下周启动回归测试，希望协调 1 名测试人员支持 3 个工作日。你的回复将同步回原周报评论区。',
    aiReason: '该请求暂无明确项目关联，但会影响测试资源安排，适合在统一待办中处理。',
    actionLabel: '回复并完成',
    evidence: [
      { label: '请求人', value: '王小明 · 产品研发部' },
      { label: '资源需求', value: '测试人员 1 名，共 3 个工作日' },
      { label: '期望时间', value: '09-14 至 09-16' },
    ],
    timeline: [
      { time: '昨天 11:18', title: '提交周报', detail: '王小明在“需要协助”中提出资源请求。' },
      { time: '昨天 11:20', title: 'AI 识别待办', detail: '汇报助理将请求分派给你。' },
    ],
  },
  {
    id: 'todo-006',
    title: '确认本周周报的项目目标关联',
    summary: 'AI 已将 6 条工作记录关联到 3 个目标，仍有 1 条需要人工确认。',
    bucket: 'pending',
    type: 'report',
    priority: 'normal',
    sourceLabel: '汇报助理',
    sourceIcon: 'lucide:notebook-pen',
    projectId: 'worko-30',
    projectName: '喔壳 3.0 版本',
    relatedLabel: '2026 年第 36 周周报 · 目标关联',
    assignee: '王安康',
    requester: '汇报助理',
    scope: 'assigned',
    createdAt: '今天 10:08',
    dueAt: '周五 17:00',
    endDate: '2026-09-11',
    detail:
      '本周工作记录已自动关联目标与成果物。“完成客户权限迁移方案评审”存在两个候选目标，需要你确认归属。',
    aiReason: '确认后，项目周报将能按目标汇总实际进展，并把成果物证据带入管理者视图。',
    actionLabel: '确认目标关联',
    evidence: [
      { label: '已自动关联', value: '6 条工作记录' },
      { label: '待确认', value: '1 条工作记录' },
      { label: '候选目标', value: '权限中心改造 / 客户数据迁移' },
    ],
    timeline: [
      { time: '今天 10:05', title: '生成周报草稿', detail: '汇报助理聚合本周工作记录。' },
      { time: '今天 10:08', title: '发现歧义', detail: '1 条记录命中两个项目目标。' },
    ],
  },
  {
    id: 'todo-007',
    title: '等待客户确认生产环境开放时间',
    summary: '已向客户发出确认请求，收到回复后将自动更新项目计划。',
    bucket: 'pending',
    type: 'risk',
    priority: 'high',
    sourceLabel: '项目助理',
    sourceIcon: 'lucide:bot',
    projectId: 'huada-crm',
    projectName: '华达药业 CRM',
    relatedLabel: '交付上线阶段 · 环境开放',
    assignee: '客户 IT 负责人',
    requester: '王安康',
    scope: 'created',
    createdAt: '09-06 15:30',
    dueAt: '等待外部回复',
    detail: '客户生产环境尚未开放。项目助理已代你发送确认消息，并将在收到回复后更新交付计划。',
    aiReason: '当前由外部人员处理，无需重复催办；若明天中午仍未回复，系统会再次提醒你。',
    actionLabel: '查看沟通记录',
    evidence: [
      { label: '等待对象', value: '客户 IT 负责人' },
      { label: '已发送', value: '09-06 15:30' },
      { label: '下次检查', value: '明天 12:00' },
    ],
    timeline: [
      { time: '09-06 15:30', title: '发出确认请求', detail: '询问生产环境开放时间。' },
    ],
  },
  {
    id: 'todo-008',
    title: '跟进客户签字风险处置',
    summary: '蓝图确认已逾期 3 天，等待交付总监给出处置意见。',
    bucket: 'pending',
    type: 'risk',
    priority: 'high',
    sourceLabel: 'AI PMO',
    sourceIcon: 'lucide:briefcase-business',
    projectId: 'zhongliang-e5',
    projectName: '中粮 E5 产线升级',
    relatedLabel: '蓝图确认阶段 · 客户签字',
    assignee: '交付总监',
    requester: '王安康',
    scope: 'created',
    createdAt: '今天 09:10',
    dueAt: '今天 18:00',
    detail: '客户签字连续 3 天未完成，AI PMO 已按制度将风险升级至交付总监，并附带全部沟通证据。',
    aiReason: '当前仅需知晓。若管理者给出新指令，系统会生成新的待处理事项。',
    actionLabel: '我已知晓',
    evidence: [
      { label: '延期天数', value: '3 天' },
      { label: '升级对象', value: '交付总监' },
      { label: '制度规则', value: '二次提醒后升级直属领导' },
    ],
    timeline: [
      { time: '今天 09:10', title: '完成风险升级', detail: '通知交付总监并附带沟通记录。' },
    ],
  },
  {
    id: 'todo-009',
    title: '中粮 E5 项目立项审批已完成',
    summary: '项目编号、责任矩阵和初始交付基线均已生效。',
    bucket: 'completed',
    type: 'approval',
    priority: 'normal',
    sourceLabel: 'AI PMO',
    sourceIcon: 'lucide:briefcase-business',
    projectId: 'zhongliang-e5',
    projectName: '中粮 E5 产线升级',
    relatedLabel: '立项申请 PRJ-2026-082',
    assignee: '周小曼',
    requester: '王安康',
    scope: 'created',
    createdAt: '09-05 16:40',
    dueAt: '已完成',
    detail: '立项申请已审批通过，项目已按交付类模板生成 5 个阶段和对应目标。',
    aiReason: '事项已闭环，可作为后续操作审计记录查看。',
    actionLabel: '查看处理结果',
    response: '同意立项，按交付类项目模板执行。',
    evidence: [
      { label: '项目编号', value: 'ZL-E5-2026' },
      { label: '审批结果', value: '已通过' },
      { label: '生效基线', value: '2026-09-05' },
    ],
    timeline: [
      { time: '09-05 16:40', title: '审批通过', detail: '项目正式进入需求沟通阶段。' },
    ],
  },
]);

export const pendingTodoCount = computed(
  () =>
    todoItems.value.filter(
      (item) => item.scope === 'assigned' && item.bucket === 'pending',
    ).length,
);

export const todoProjects = computed(() => {
  const projects = new Map<string, string>();
  todoItems.value.forEach((item) => {
    if (item.projectId && item.projectName)
      projects.set(item.projectId, item.projectName);
  });
  return [...projects].map(([value, label]) => ({ label, value }));
});

export function completeTodo(id: string, response?: string) {
  const item = todoItems.value.find((todo) => todo.id === id);
  if (!item || item.bucket !== 'pending') return;
  item.bucket = 'completed';
  if (response) item.response = response;
  item.timeline.unshift({
    time: '刚刚',
    title: '已完成待办',
    detail: response || '已将该待办标记为完成。',
  });
}

export function markTodoKnown(id: string) {
  completeTodo(id, '已知晓');
}

export function ignoreTodo(id: string) {
  const item = todoItems.value.find((todo) => todo.id === id);
  if (!item || item.bucket !== 'pending') return;
  item.bucket = 'ignored';
  item.timeline.unshift({
    time: '刚刚',
    title: '已忽略待办',
    detail: '该待办已关闭，不再继续提醒。',
  });
}

export function replyTodo(id: string, response: string) {
  const item = todoItems.value.find((todo) => todo.id === id);
  if (!item || item.bucket !== 'pending' || !response.trim()) return;
  item.response = response;
  item.timeline.unshift({
    time: '刚刚',
    title: '已发送回复',
    detail: response,
  });
}

export function updateTodo(
  id: string,
  changes: Pick<TodoItem, 'title' | 'detail' | 'assignee' | 'projectId' | 'projectName' | 'endDate'>,
) {
  const item = todoItems.value.find((todo) => todo.id === id);
  if (!item || item.bucket !== 'pending') return false;
  if (!changes.title.trim() || !changes.assignee.trim()) return false;
  Object.assign(item, {
    title: changes.title.trim(),
    detail: changes.detail,
    assignee: changes.assignee,
    projectId: changes.projectId,
    projectName: changes.projectName,
    endDate: changes.endDate || undefined,
  });
  item.timeline.unshift({ time: '刚刚', title: '更新待办', detail: '已保存待办信息。' });
  return true;
}

export function deferTodo(id: string) {
  const item = todoItems.value.find((todo) => todo.id === id);
  if (!item) return;
  item.dueAt = '明天 10:00';
  item.timeline.unshift({
    time: '刚刚',
    title: '已延后提醒',
    detail: '系统将在明天 10:00 再次提醒你。',
  });
}
