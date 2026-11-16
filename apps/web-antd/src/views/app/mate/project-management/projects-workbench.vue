<script setup lang="ts">
import type {
  ManagedProject,
  ProjectHealth,
  ProjectKr,
  ProjectObjective,
  ProjectStage,
} from '#/types/project-management';
import type { UploadProps } from 'ant-design-vue';

import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import {
  Button,
  Dropdown,
  Drawer,
  Empty,
  Input,
  message,
  Modal,
  Pagination,
  Progress,
  Select,
  Tag,
  Tooltip,
  Upload,
} from 'ant-design-vue';

import { mockMateEmployees } from '#/api/mock-data-mate';
import { managedProjects } from '#/api/mock-project-management';
import AiWorkPage from '#/views/app/mate/ai-work/components/ai-work-page.vue';

type ViewMode = 'board' | 'structure';
type ProjectDirectoryTab = 'active' | 'archived';
type ExecutorGoalStatus = 'active' | 'completed' | 'pending' | 'risk' | 'watch';
type DetailNode =
  | { kind: 'objective'; objective: ProjectObjective; stage: ProjectStage }
  | { kind: 'stage'; stage: ProjectStage };

const route = useRoute();
const router = useRouter();
const isManager = computed(() => route.params.employeeId === 'pmo-assistant');
const projectRows = ref<ManagedProject[]>([...managedProjects]);
const viewMode = ref<ViewMode>('structure');
const stageFlowExpanded = ref(false);
const keyword = ref('');
const healthFilter = ref('all');
const typeFilter = ref('all');
const selectedProject = ref<ManagedProject>(managedProjects[0]!);
const expandedStageIds = ref<string[]>([]);
const expandedObjectiveIds = ref<string[]>([]);
const editingStageIds = ref<string[]>([]);
const expandedProjectGroups = ref<string[]>([
  '喔壳平台一级项目',
  '智能制造客户项目',
]);
const projectDirectoryTab = ref<ProjectDirectoryTab>('active');
const structureProjectDetailOpen = ref(false);
const structureProjectPage = ref(1);
const structureProjectPageSize = 6;
const archivedProjectIds = ref<string[]>([]);
const customProjectGroups = ref<string[]>([]);
const addingProjectDirectory = ref(false);
const newProjectDirectoryName = ref('');
const detailOpen = ref(false);
const detailNode = ref<DetailNode>();
const addingObjectiveStageId = ref<string>();
const addingKrObjectiveId = ref<string>();
const inlineObjectiveForm = reactive({
  title: '',
  owner: '',
  dueDate: '',
});
const inlineKrForm = reactive({
  title: '',
  kind: 'deliverable' as ProjectKr['kind'],
  owner: '',
  dueDate: '',
});
const executorProgressDrawerOpen = ref(false);
const executorProgressObjective = ref<ProjectObjective>();
const executorProgressStage = ref<ProjectStage>();
const executorProgressDraft = ref(0);
const executorStatusDraft = ref<ExecutorGoalStatus>('active');
const executorProgressNote = ref('');
const executorUploadedFiles = reactive<
  Record<string, Array<{ name: string; size: string; uploadedAt: string }>>
>({});

const projectAiGuides = [
  {
    employeeId: 'meeting-assistant',
    name: '会议助理',
    specialty: '议程、纪要与会后跟进',
    example: '帮我创建个项目周会',
    icon: 'lucide:messages-square',
  },
  {
    employeeId: 'project-assistant',
    name: '任务助理',
    specialty: '任务拆解与执行推进',
    example: '根据当前阶段拆解本周任务',
    icon: 'lucide:list-checks',
  },
  {
    employeeId: 'pmo-assistant',
    name: '交付项目 PMO',
    specialty: '风险判断与管理干预',
    example: '分析当前风险并给出干预建议',
    icon: 'lucide:shield-alert',
  },
].map((item) => ({
  ...item,
  avatar:
    mockMateEmployees.find((employee) => employee.id === item.employeeId)
      ?.avatar || '',
}));

function ensureManagerEditAccess() {
  if (isManager.value) return true;
  message.info('“我的项目”为只读视图，项目调整请由交付项目 PMO 操作');
  return false;
}

const healthOptions = [
  { label: '全部状态', value: 'all' },
  { label: '正常', value: 'healthy' },
  { label: '需关注', value: 'watch' },
  { label: '有风险', value: 'at-risk' },
  { label: '受阻', value: 'blocked' },
];

const typeOptions = [
  { label: '全部类型', value: 'all' },
  { label: '标准交付', value: 'standard-delivery' },
  { label: '定制开发', value: 'custom-development' },
  { label: 'OEM 合作', value: 'oem' },
];

const memberOptions = [
  '周小曼',
  '林晓',
  '陈浩',
  '罗文',
  '刘敏',
  '赵凯',
  '李四',
  '王天豪',
  '张三',
  '孙莉',
  '刘工',
  '高峰',
].map((name) => ({ label: name, value: name }));

const krKindOptions = [
  { label: '成果物', value: 'deliverable' },
  { label: '量化指标', value: 'metric' },
];

const filteredProjects = computed(() => {
  const query = keyword.value.trim().toLowerCase();
  return projectRows.value.filter((project) => {
    const isArchived = archivedProjectIds.value.includes(project.id);
    const matchesDirectoryTab =
      projectDirectoryTab.value === 'archived' ? isArchived : !isArchived;
    const text =
      `${project.name}${project.code || ''}${project.department || ''}${project.customer}${project.manager}${project.typeLabel}`.toLowerCase();
    return (
      matchesDirectoryTab &&
      (!query || text.includes(query)) &&
      (healthFilter.value === 'all' || project.health === healthFilter.value) &&
      (typeFilter.value === 'all' || project.type === typeFilter.value)
    );
  });
});
const activeProjectCount = computed(
  () => projectRows.value.length - archivedProjectIds.value.length,
);
const archivedProjectCount = computed(() => archivedProjectIds.value.length);
const portfolioSummary = computed(() => {
  const projects = filteredProjects.value;
  const riskProjects = projects.filter((project) =>
    ['at-risk', 'blocked'].includes(project.health),
  ).length;
  const watchProjects = projects.filter(
    (project) => project.health === 'watch',
  ).length;
  const averageProgress = projects.length
    ? Math.round(
        projects.reduce((sum, project) => sum + project.progress, 0) /
          projects.length,
      )
    : 0;
  return { averageProgress, riskProjects, total: projects.length, watchProjects };
});
const pagedStructureProjects = computed(() => {
  const start = (structureProjectPage.value - 1) * structureProjectPageSize;
  return filteredProjects.value.slice(start, start + structureProjectPageSize);
});

watch([keyword, healthFilter, typeFilter, projectDirectoryTab], () => {
  structureProjectPage.value = 1;
});
const activeStructureProject = computed(
  () =>
    filteredProjects.value.find(
      (project) => project.id === selectedProject.value?.id,
    ) || filteredProjects.value[0],
);
const projectGroups = computed(() => {
  const groups = new Map<string, ManagedProject[]>();
  filteredProjects.value.forEach((project) => {
    const groupName = project.parentProject || '其他项目';
    const projects = groups.get(groupName) || [];
    projects.push(project);
    groups.set(groupName, projects);
  });
  if (projectDirectoryTab.value === 'active') {
    customProjectGroups.value.forEach((name) => {
      if (!groups.has(name)) groups.set(name, []);
    });
  }
  return [...groups.entries()].map(([name, projects]) => ({ name, projects }));
});

function currentStage(project: ManagedProject) {
  return (
    project.stages.find((stage) =>
      ['blocked', 'in-progress', 'ready'].includes(stage.status),
    ) || project.stages.at(-1)
  );
}

function currentStageNumber(project: ManagedProject) {
  const stage = currentStage(project);
  const index = project.stages.findIndex((item) => item.id === stage?.id);
  return Math.max(1, index + 1);
}

function countStageKrs(stage: ProjectStage) {
  return stage.objectives.reduce(
    (total, objective) => total + objective.krs.length,
    0,
  );
}

function projectBoardStats(project: ManagedProject) {
  const objectives = project.stages.flatMap((stage) => stage.objectives);
  const tasks = objectives.flatMap((objective) => objective.krs);
  const deliverables = tasks.filter((task) => task.kind === 'deliverable');
  return {
    completedDeliverables: deliverables.filter(
      (task) => task.status === 'accepted',
    ).length,
    completedObjectives: objectives.filter(
      (objective) => objective.progress >= 100,
    ).length,
    completedTasks: tasks.filter((task) => task.status === 'accepted').length,
    deliverables: deliverables.length,
    objectives: objectives.length,
    tasks: tasks.length,
  };
}

function stageFlatItems(stage: ProjectStage) {
  return [
    ...stage.objectives.map((objective) => ({
      id: objective.id,
      kind: 'objective' as const,
      objective,
    })),
    ...stage.objectives.flatMap((objective) =>
      objective.krs.map((kr) => ({
        id: kr.id,
        kind: kr.kind,
        kr,
        objective,
      })),
    ),
  ];
}

function startAddStageItem(stage: ProjectStage) {
  const objective = stage.objectives[0];
  if (!objective) {
    message.info('请先在当前阶段新增一个目标，再添加成果物或量化指标');
    return;
  }
  startAddKr(stage, objective);
}

function stageAddingKrObjective(stage: ProjectStage) {
  return stage.objectives.find(
    (objective) => objective.id === addingKrObjectiveId.value,
  );
}

function saveStageInlineKr(stage: ProjectStage) {
  const objective = stageAddingKrObjective(stage);
  if (objective) saveInlineKr(objective);
}

function objectiveKrs(objective: ProjectObjective) {
  return objective.krs;
}

function stageTone(stage: ProjectStage) {
  if (stage.status === 'completed') return 'completed';
  if (
    stage.status === 'blocked' ||
    ['at-risk', 'blocked'].includes(stage.health)
  )
    return 'abnormal';
  if (stage.status === 'in-progress') return 'active';
  return 'pending';
}

function healthLabel(health: ProjectHealth) {
  return {
    'at-risk': '有风险',
    blocked: '受阻',
    healthy: '正常',
    watch: '需关注',
  }[health];
}

function stageStatusLabel(status: ProjectStage['status']) {
  return {
    blocked: '受阻',
    completed: '已完成',
    'in-progress': '进行中',
    pending: '未开始',
    ready: '可进入',
  }[status];
}

function krStatusLabel(kr: Pick<ProjectKr, 'status'>) {
  return {
    accepted: '已完成',
    'at-risk': '有风险',
    'in-progress': '进行中',
    missing: '缺少成果',
    pending: '待开始',
  }[kr.status];
}

function krProgress(kr: ProjectKr) {
  if (kr.status === 'accepted') return 100;
  if (['missing', 'pending'].includes(kr.status)) return 0;
  if (kr.kind === 'deliverable') {
    if (['at-risk', 'in-progress'].includes(kr.status)) return 60;
    return 0;
  }
  if (kr.target === 0) return kr.actual === 0 ? 100 : 0;
  return Math.min(
    100,
    Math.round(((kr.actual || 0) / Math.max(kr.target || 1, 1)) * 100),
  );
}

function formatExecutorFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function uploadExecutorDeliverable(
  kr: ProjectKr,
  file: Parameters<NonNullable<UploadProps['beforeUpload']>>[0],
) {
  const uploaded = executorUploadedFiles[kr.id] || [];
  executorUploadedFiles[kr.id] = [
    ...uploaded,
    {
      name: file.name,
      size: formatExecutorFileSize(file.size),
      uploadedAt: '刚刚',
    },
  ];
  kr.weeklyEvidence = file.name;
  if (kr.status !== 'accepted') kr.status = 'in-progress';
  message.success(`“${file.name}”已关联到成果物“${kr.artifact || kr.title}”`);
  return false;
}

function openExecutorProgress(
  stage: ProjectStage,
  objective: ProjectObjective,
) {
  executorProgressStage.value = stage;
  executorProgressObjective.value = objective;
  executorProgressDraft.value = objective.progress;
  executorStatusDraft.value = objective.progress === 100 ? 'completed' : objective.progress === 0 ? 'pending' : objective.health === 'at-risk' || objective.health === 'blocked' ? 'risk' : objective.health === 'watch' ? 'watch' : 'active';
  executorProgressNote.value = '';
  executorProgressDrawerOpen.value = true;
}

function saveExecutorProgress() {
  const objective = executorProgressObjective.value;
  const stage = executorProgressStage.value;
  const project = activeStructureProject.value;
  if (!objective || !stage || !project) return;
  let nextProgress = Math.max(
    0,
    Math.min(100, Number(executorProgressDraft.value) || 0),
  );
  if (executorStatusDraft.value === 'completed') nextProgress = 100;
  if (executorStatusDraft.value === 'pending') nextProgress = 0;
  if (executorStatusDraft.value === 'active' && nextProgress === 100) nextProgress = 99;
  objective.progress = nextProgress;
  objective.health = executorStatusDraft.value === 'risk' ? 'at-risk' : executorStatusDraft.value === 'watch' ? 'watch' : 'healthy';
  stage.progress = stage.objectives.length
    ? Math.round(
        stage.objectives.reduce((sum, item) => sum + item.progress, 0) /
          stage.objectives.length,
      )
    : 0;
  project.progress = project.stages.length
    ? Math.round(
        project.stages.reduce((sum, item) => sum + item.progress, 0) /
          project.stages.length,
      )
    : 0;
  executorProgressDrawerOpen.value = false;
  const statusLabel = { active: '进行中', completed: '已完成', pending: '未开始', risk: '有风险', watch: '需关注' }[executorStatusDraft.value];
  message.success(`“${objective.title}”已更新为 ${statusLabel} · ${nextProgress}%`);
}

function formatMilestoneDate(value: string) {
  const match = /^\d{4}-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${Number(match[1])}月${Number(match[2])}日` : value;
}

function milestoneStatusLabel(stage: ProjectStage) {
  const state = stageDisplayState(stage);
  if (state === 'completed') return '已完成';
  if (state === 'blocked' || state === 'current') return '进行中';
  return '未开始';
}

function stageDisplayState(stage: ProjectStage) {
  if (stage.health === 'blocked') return 'blocked';
  if (stage.status === 'completed') return 'completed';
  if (isStageActive(stage)) return 'current';
  return 'pending';
}

function openProject(project: ManagedProject) {
  selectedProject.value = project;
  stageFlowExpanded.value = false;
  expandedStageIds.value = [];
  expandedObjectiveIds.value = [];
  viewMode.value = 'structure';
  structureProjectDetailOpen.value = true;
}

function openStructureProjectList() {
  viewMode.value = 'structure';
  structureProjectDetailOpen.value = false;
  structureProjectPage.value = 1;
}

function backToStructureProjectList() {
  structureProjectDetailOpen.value = false;
  stageFlowExpanded.value = false;
  expandedStageIds.value = [];
  expandedObjectiveIds.value = [];
}

function buildProjectChatContext(project: ManagedProject) {
  const stats = projectBoardStats(project);
  return [
    '请基于以下项目上下文协助我：',
    `项目：${project.name}（${project.code}）`,
    `项目经理：${project.manager}`,
    `当前阶段：${project.stage}（第 ${currentStageNumber(project)}/${project.stages.length} 阶段）`,
    `项目状态：${healthLabel(project.health)}，整体进度 ${project.progress}%`,
    `执行情况：任务 ${stats.completedTasks}/${stats.tasks}，目标 ${stats.completedObjectives}/${stats.objectives}，成果物 ${stats.completedDeliverables}/${stats.deliverables}`,
    `项目说明：${project.summary}`,
    '',
    '请结合以上信息给出下一步建议。',
  ].join('\n');
}

function openLinkedProjectEmployee(
  project: ManagedProject,
  employeeId: string,
  instruction = '',
) {
  const context = buildProjectChatContext(project);
  void router.push({
    path: `/app/mate/employee/${employeeId}/project-chat`,
    query: {
      prefill: instruction ? `${context}\n\n当前需求：${instruction}` : context,
      projectId: project.id,
    },
  });
}

function selectProject(project: ManagedProject) {
  selectedProject.value = project;
  stageFlowExpanded.value = false;
  expandedStageIds.value = [];
  expandedObjectiveIds.value = [];
  structureProjectDetailOpen.value = true;
}

function switchProjectDirectoryTab(tab: ProjectDirectoryTab) {
  projectDirectoryTab.value = tab;
  addingProjectDirectory.value = false;
  const firstProject = filteredProjects.value[0];
  if (firstProject) selectProject(firstProject);
}

function archiveProject(project: ManagedProject) {
  if (!ensureManagerEditAccess()) return;
  if (!archivedProjectIds.value.includes(project.id)) {
    archivedProjectIds.value = [...archivedProjectIds.value, project.id];
  }
  message.success(`“${project.name}”已归档`);
  const firstProject = filteredProjects.value[0];
  if (firstProject) selectProject(firstProject);
}

function restoreProject(project: ManagedProject) {
  if (!ensureManagerEditAccess()) return;
  archivedProjectIds.value = archivedProjectIds.value.filter(
    (id) => id !== project.id,
  );
  message.success(`“${project.name}”已恢复到项目`);
  const firstProject = filteredProjects.value[0];
  if (firstProject) selectProject(firstProject);
}

function startAddProjectDirectory() {
  if (!ensureManagerEditAccess()) return;
  projectDirectoryTab.value = 'active';
  newProjectDirectoryName.value = '';
  addingProjectDirectory.value = true;
}

function cancelAddProjectDirectory() {
  addingProjectDirectory.value = false;
  newProjectDirectoryName.value = '';
}

function saveProjectDirectory() {
  if (!ensureManagerEditAccess()) return;
  const name = newProjectDirectoryName.value.trim();
  if (!name) {
    message.warning('请输入项目目录名称');
    return;
  }

  const existingNames = new Set([
    ...projectRows.value.map((project) => project.parentProject || '其他项目'),
    ...customProjectGroups.value,
  ]);
  if (existingNames.has(name)) {
    message.warning('该项目目录已存在');
    return;
  }

  customProjectGroups.value = [...customProjectGroups.value, name];
  expandedProjectGroups.value = [...expandedProjectGroups.value, name];
  addingProjectDirectory.value = false;
  newProjectDirectoryName.value = '';
  message.success(`项目目录“${name}”已创建`);
}

function goToInitiation() {
  if (!ensureManagerEditAccess()) return;
  void router.push('/app/mate/employee/pmo-assistant/initiation');
}

function isProjectGroupExpanded(groupName: string) {
  return expandedProjectGroups.value.includes(groupName);
}

function toggleProjectGroup(groupName: string) {
  expandedProjectGroups.value = isProjectGroupExpanded(groupName)
    ? expandedProjectGroups.value.filter((name) => name !== groupName)
    : [...expandedProjectGroups.value, groupName];
}

function isStageExpanded(stage: ProjectStage) {
  return expandedStageIds.value.includes(stage.id);
}

function toggleStage(stage: ProjectStage) {
  if (isStageExpanded(stage)) {
    expandedStageIds.value = expandedStageIds.value.filter(
      (id) => id !== stage.id,
    );
    return;
  }
  expandedStageIds.value = [...expandedStageIds.value, stage.id];
  expandedObjectiveIds.value = [
    ...new Set([
      ...expandedObjectiveIds.value,
      ...stage.objectives.map((objective) => objective.id),
    ]),
  ];
}

function isObjectiveExpanded(objective: ProjectObjective) {
  return expandedObjectiveIds.value.includes(objective.id);
}

function toggleObjective(objective: ProjectObjective) {
  expandedObjectiveIds.value = isObjectiveExpanded(objective)
    ? expandedObjectiveIds.value.filter((id) => id !== objective.id)
    : [...expandedObjectiveIds.value, objective.id];
}

type StageTabKey = 'ai' | 'execution' | 'overview';
type ProjectDossierTabKey =
  | 'charter'
  | 'deliverables'
  | 'logs'
  | 'overview'
  | 'reports';

interface LinkedDeliverableFile {
  id: string;
  name: string;
  report: any;
  reportTitle: string;
  size: string;
  uploadedAt: string;
}

interface ProjectDeliverableRecord {
  acceptance: string;
  dueDate: string;
  files: LinkedDeliverableFile[];
  id: string;
  name: string;
  objectiveCode: string;
  objectiveTitle: string;
  owner: string;
  stageCode: string;
  stageId: string;
  stageName: string;
  status: ProjectKr['status'];
}

interface ProjectDeliverableStageGroup {
  deliverables: ProjectDeliverableRecord[];
  stageCode: string;
  stageId: string;
  stageName: string;
}

interface ProjectOperationLog {
  after?: string;
  before?: string;
  description: string;
  id: string;
  kind: 'change' | 'goal' | 'initiation' | 'stage';
  operator: string;
  reason?: string;
  time: string;
  title: string;
}

const stageDrawerOpen = ref(false);
const activeManagedStage = ref<null | ProjectStage>(null);
const stageDrawerActiveTab = ref<StageTabKey>('overview');
const projectReportSearchKeyword = ref('');
const weeklyReportPreviewOpen = ref(false);
const selectedWeeklyReport = ref<any>(null);

const projectDossierDrawerOpen = ref(false);
const projectDossierActiveTab = ref<ProjectDossierTabKey>('overview');
const projectDeliverableKeyword = ref('');
const projectDeliverableFileFilter = ref('all');
const projectLogKeyword = ref('');
const projectLogType = ref('all');
const projectLogPage = ref(1);
const projectLogPageSize = 6;
const projectLogTypeOptions = [
  { label: '全部类型', value: 'all' },
  { label: '项目变更', value: 'change' },
  { label: '项目立项', value: 'initiation' },
  { label: '阶段完成', value: 'stage' },
  { label: '目标完成', value: 'goal' },
];
const projectDeliverableFileOptions = [
  { label: '全部成果物', value: 'all' },
  { label: '已关联文件', value: 'linked' },
  { label: '待关联文件', value: 'unlinked' },
];

function openProjectDossier() {
  projectDossierActiveTab.value = 'overview';
  projectReportSearchKeyword.value = '';
  projectDeliverableKeyword.value = '';
  projectDeliverableFileFilter.value = 'all';
  projectLogKeyword.value = '';
  projectLogType.value = 'all';
  projectLogPage.value = 1;
  projectDossierDrawerOpen.value = true;
}

function showStageDetail(
  stage: ProjectStage,
  defaultTab: StageTabKey = 'overview',
) {
  activeManagedStage.value = stage;
  activeDiagnosisStage.value = stage;
  stageDrawerActiveTab.value = defaultTab;
  stageDrawerOpen.value = true;
}

function isStageActive(stage: ProjectStage): boolean {
  if (!activeStructureProject.value) return false;
  return (
    activeStructureProject.value.stage === stage.name ||
    stage.status === 'in-progress' ||
    stage.status === 'blocked'
  );
}

function switchToStage(stage: ProjectStage) {
  if (!ensureManagerEditAccess()) return;
  if (!activeStructureProject.value) return;
  const project = activeStructureProject.value;
  const stages = project.stages;
  const targetIndex = stages.findIndex((s) => s.id === stage.id);
  if (targetIndex === -1 || isStageActive(stage)) return;

  Modal.confirm({
    autoFocusButton: 'cancel',
    wrapClassName: 'project-stage-confirm-modal',
    title: '确定要手动切换状态吗？',
    content: `项目当前执行阶段将切换为“${stage.name}”，系统会同步重算前后阶段的完成状态和项目进度。`,
    okText: '确定切换',
    cancelText: '取消',
    onOk() {
      project.stage = stage.name;

      stages.forEach((item, index) => {
        if (index < targetIndex) {
          item.status = 'completed';
          item.progress = 100;
          item.health = 'healthy';
        } else if (index === targetIndex) {
          item.status = item.health === 'blocked' ? 'blocked' : 'in-progress';
          if (item.progress === 100) item.progress = 68;
        } else {
          item.status = 'pending';
          item.progress = 0;
          item.health = 'healthy';
        }
      });

      const completedCount = stages.filter(
        (item) => item.status === 'completed',
      ).length;
      const currentProgress = stages[targetIndex]?.progress || 0;
      project.progress = Math.round(
        (completedCount * 100 + currentProgress) / stages.length,
      );

      if (!stage.transitionHistory) stage.transitionHistory = [];
      stage.transitionHistory.unshift({
        time: new Date().toLocaleString('zh-CN', { hour12: false }),
        operator: 'PMO 管理员 (手动激活)',
        action: 'advance',
        actionLabel: '手动切换激活',
        fromStage: '前序阶段',
        toStage: stage.name,
        reason: `管理员手动将项目当前执行阶段切换为【${stage.name}】`,
      });

      message.success(`已将项目当前执行阶段切换为“${stage.name}”`);
    },
  });
}

function showObjectiveDetail(stage: ProjectStage, objective: ProjectObjective) {
  detailNode.value = { kind: 'objective', stage, objective };
  detailOpen.value = true;
}

function confirmDeleteStage(stage: ProjectStage) {
  if (!ensureManagerEditAccess()) return;
  const project = activeStructureProject.value;
  if (!project) return;
  Modal.confirm({
    title: `删除“${stage.name}”？`,
    content: `该阶段下的 ${stage.objectives.length} 个目标和 ${countStageKrs(stage)} 个 KR 将一并删除。`,
    okText: '删除',
    cancelText: '取消',
    okButtonProps: { danger: true },
    onOk() {
      const objectiveIds = new Set(
        stage.objectives.map((objective) => objective.id),
      );
      const stageIndex = project.stages.findIndex(
        (item) => item.id === stage.id,
      );
      if (stageIndex !== -1) project.stages.splice(stageIndex, 1);
      project.objectives = project.objectives.filter(
        (objective) => !objectiveIds.has(objective.id),
      );
      expandedStageIds.value = expandedStageIds.value.filter(
        (id) => id !== stage.id,
      );
      expandedObjectiveIds.value = expandedObjectiveIds.value.filter(
        (id) => !objectiveIds.has(id),
      );
      editingStageIds.value = editingStageIds.value.filter(
        (id) => id !== stage.id,
      );
      if (addingObjectiveStageId.value === stage.id)
        addingObjectiveStageId.value = undefined;
      if (
        addingKrObjectiveId.value &&
        objectiveIds.has(addingKrObjectiveId.value)
      ) {
        addingKrObjectiveId.value = undefined;
      }
      message.success(`已删除阶段“${stage.name}”`);
    },
  });
}

function isStageEditing(stage: ProjectStage) {
  return editingStageIds.value.includes(stage.id);
}

function toggleStageEdit(stage: ProjectStage) {
  if (!ensureManagerEditAccess()) return;
  if (isStageEditing(stage)) {
    editingStageIds.value = editingStageIds.value.filter(
      (id) => id !== stage.id,
    );
    if (addingObjectiveStageId.value === stage.id)
      addingObjectiveStageId.value = undefined;
    if (
      stage.objectives.some(
        (objective) => objective.id === addingKrObjectiveId.value,
      )
    ) {
      addingKrObjectiveId.value = undefined;
    }
    message.success(`${stage.name}的修改已保存`);
    return;
  }
  editingStageIds.value = [...editingStageIds.value, stage.id];
  stage.objectives.forEach((objective) => {
    if (!objective.dueDate) objective.dueDate = stage.plannedEnd;
  });
  if (!isStageExpanded(stage))
    expandedStageIds.value = [...expandedStageIds.value, stage.id];
  expandedObjectiveIds.value = [
    ...new Set([
      ...expandedObjectiveIds.value,
      ...stage.objectives.map((objective) => objective.id),
    ]),
  ];
}

function krName(kr: ProjectKr) {
  return kr.kind === 'deliverable' ? kr.artifact || kr.title : kr.title;
}

function updateKrName(kr: ProjectKr, value: string) {
  if (kr.kind === 'deliverable') {
    kr.artifact = value;
    return;
  }
  kr.title = value;
}

function krDateInputValue(kr: ProjectKr, stage: ProjectStage) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(kr.dueDate)) return kr.dueDate;
  const match = kr.dueDate.match(/^(\d{2})\/(\d{2})$/);
  return match
    ? `${stage.plannedEnd.slice(0, 4)}-${match[1]}-${match[2]}`
    : stage.plannedEnd;
}

function updateKrDueDate(kr: ProjectKr, value: string) {
  kr.dueDate = value;
}

function shortDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value.slice(5).replace('-', '/')
    : value;
}

function startAddObjective(stage: ProjectStage) {
  if (!ensureManagerEditAccess()) return;
  addingObjectiveStageId.value = stage.id;
  inlineObjectiveForm.title = '';
  inlineObjectiveForm.owner = stage.owner;
  inlineObjectiveForm.dueDate = stage.plannedEnd;
}

function cancelAddObjective() {
  addingObjectiveStageId.value = undefined;
}

function saveInlineObjective(stage: ProjectStage) {
  if (!ensureManagerEditAccess()) return;
  const project = activeStructureProject.value;
  if (!project) return;
  if (!inlineObjectiveForm.title.trim() || !inlineObjectiveForm.owner) {
    message.warning('请填写目标名称和负责人');
    return;
  }

  const objective: ProjectObjective = {
    id: `objective-${Date.now()}`,
    code: `O${project.objectives.length + 1}`,
    title: inlineObjectiveForm.title.trim(),
    description: '待补充目标说明与验收口径。',
    owner: inlineObjectiveForm.owner,
    collaborators: [],
    dueDate: inlineObjectiveForm.dueDate || stage.plannedEnd,
    progress: 0,
    health: 'healthy',
    krs: [],
  };

  stage.objectives.push(objective);
  project.objectives.push(objective);
  expandedObjectiveIds.value = [...expandedObjectiveIds.value, objective.id];
  addingObjectiveStageId.value = undefined;
  message.success(`已在${stage.name}下新增目标`);
}

function startAddKr(stage: ProjectStage, objective: ProjectObjective) {
  if (!ensureManagerEditAccess()) return;
  addingKrObjectiveId.value = objective.id;
  inlineKrForm.title = '';
  inlineKrForm.kind = 'deliverable';
  inlineKrForm.owner = objective.owner;
  inlineKrForm.dueDate = objective.dueDate || stage.plannedEnd;
}

function cancelAddKr() {
  addingKrObjectiveId.value = undefined;
}

function saveInlineKr(objective: ProjectObjective) {
  if (!ensureManagerEditAccess()) return;
  if (
    !inlineKrForm.title.trim() ||
    !inlineKrForm.owner ||
    !inlineKrForm.dueDate
  ) {
    message.warning('请填写事项名称、负责人和日期');
    return;
  }
  const title = inlineKrForm.title.trim();
  const kr: ProjectKr = {
    id: `kr-${Date.now()}`,
    title,
    kind: inlineKrForm.kind,
    owner: inlineKrForm.owner,
    dueDate: inlineKrForm.dueDate.slice(5).replace('-', '/'),
    status: 'pending',
    weight: 0,
    ...(inlineKrForm.kind === 'deliverable'
      ? { artifact: title, acceptance: '待补充验收标准' }
      : { target: 100, actual: 0, unit: '%' }),
  };
  objective.krs.push(kr);
  addingKrObjectiveId.value = undefined;
  message.success('阶段事项已保存');
}

function openAiConversation() {
  const project = activeStructureProject.value;
  if (!project) return;
  void router.push({
    path: `/app/mate/employee/${String(route.params.employeeId)}/project-chat`,
    query: { projectId: project.id, source: 'project-ai-detection' },
  });
}

interface StageDiagnosisStrategy {
  id: string;
  shortTitle: string;
  tag: string;
  tagColor: string;
  title: string;
  targetRole: string;
  description: string;
  previewContent: string;
  actionLabel: string;
  appliedLabel: string;
  type?: 'action' | 'replan' | 'resource';
  riskLevel?: 'high' | 'low' | 'medium';
}

const strategyNumberLabels = ['一', '二', '三'];

interface StageDiagnosis {
  stageId: string;
  stageCode: string;
  stageName: string;
  stageHealth: ProjectHealth;
  owner: string;
  plannedStart: string;
  plannedEnd: string;
  delayedDays: number;
  blockedObjective: {
    code: string;
    progress: number;
    title: string;
  };
  rootCause: {
    blockerReason: string;
    deliverableDueDate: string;
    deliverableName: string;
    deliverableOwner: string;
    deliverableStatus: string;
    templateRule: string;
  };
  chainImpact: {
    downstreamStageName: string;
    downstreamStartDate: string;
    impactDescription: string;
    originalDueDate: string;
    probabilityAfter: number;
    probabilityBefore: number;
    projectDelayDays: number;
    revisedDueDate: string;
  };
  strategies: StageDiagnosisStrategy[];
}

const activeDiagnosisStage = ref<null | ProjectStage>(null);
const appliedStrategies = reactive<
  Record<string, { strategyId: string; time: string; title: string }>
>({});
const copiedStrategyId = ref<null | string>(null);

function openStageAiDiagnosis(stage: ProjectStage) {
  showStageDetail(stage, 'ai');
}

function applyStrategy(stageId: string, strategy: StageDiagnosisStrategy) {
  if (!ensureManagerEditAccess()) return;
  appliedStrategies[stageId] = {
    strategyId: strategy.id,
    title: strategy.title,
    time: '刚刚',
  };

  message.success(
    `已采纳应对预案【${strategy.title}】！已同步至阶段决策记录。`,
  );
}

function copyStrategyText(strategyId: string, content: string) {
  if (navigator.clipboard) {
    void navigator.clipboard.writeText(content);
  }
  copiedStrategyId.value = strategyId;
  message.success('已复制策略内容到剪贴板');
  setTimeout(() => {
    if (copiedStrategyId.value === strategyId) {
      copiedStrategyId.value = null;
    }
  }, 2500);
}

const concessionModalOpen = ref(false);
const concessionReason = ref(
  '因关键路径生产交付窗口期限制，经双方项目经理及 PMO 确认，核心接口联调遗留非致命事项容缺推进，纳入试运行阶段前 3 天继续闭环。',
);

watch(isManager, (canEdit) => {
  if (canEdit) return;
  editingStageIds.value = [];
  addingProjectDirectory.value = false;
  addingObjectiveStageId.value = undefined;
  addingKrObjectiveId.value = undefined;
  concessionModalOpen.value = false;
});

function checkStageGates(stage: ProjectStage) {
  const unsatisfied = (stage.exitGates || []).filter((g) => !g.satisfied);
  if (unsatisfied.length === 0) {
    message.success(
      `门禁体检通过：${stage.name} 全部 ${stage.exitGates?.length || 0} 项准出门禁均已达成，具备推进结项条件！`,
    );
  } else {
    message.warning(
      `门禁体检未达标：${unsatisfied.length} 项准出门禁未满足（${unsatisfied.map((g) => g.name).join('；')}）`,
    );
  }
}

function advanceToNextStage(stage: ProjectStage) {
  if (!ensureManagerEditAccess()) return;
  if (!activeStructureProject.value) return;
  const stages = activeStructureProject.value.stages;
  const currentIndex = stages.findIndex((s) => s.id === stage.id);
  if (currentIndex === -1) return;

  const unsatisfied = (stage.exitGates || []).filter((g) => !g.satisfied);
  if (unsatisfied.length > 0) {
    message.error(
      `推进失败：仍有 ${unsatisfied.length} 项准出门禁未满足。如需紧急推进，请使用【容缺特批流转】。`,
    );
    return;
  }

  stage.status = 'completed';
  stage.health = 'healthy';
  stage.progress = 100;

  if (currentIndex + 1 < stages.length) {
    const nextStage = stages[currentIndex + 1]!;
    nextStage.status = 'in-progress';
    nextStage.health = 'healthy';
    activeStructureProject.value.stage = nextStage.name;
  }

  if (!stage.transitionHistory) stage.transitionHistory = [];
  stage.transitionHistory.unshift({
    time: new Date().toLocaleString('zh-CN', { hour12: false }),
    operator: 'PMO 管理员',
    action: 'advance',
    actionLabel: '准出门禁达标 · 正常推进',
    fromStage: stage.name,
    toStage: stages[currentIndex + 1]?.name || '已结项',
    reason: '必备成果物审查通过，核心指标 100% 达标，准出门禁全票通过。',
  });

  message.success(
    `恭喜！【${stage.name}】阶段结项完成，已顺利推进至【${stages[currentIndex + 1]?.name || '最终交付'}】！`,
  );
}

function confirmConcessionAdvance() {
  if (!ensureManagerEditAccess()) return;
  if (!activeManagedStage.value || !activeStructureProject.value) return;
  const stage = activeManagedStage.value;
  const stages = activeStructureProject.value.stages;
  const currentIndex = stages.findIndex((s) => s.id === stage.id);

  stage.status = 'completed';
  stage.progress = 100;

  if (currentIndex + 1 < stages.length) {
    const nextStage = stages[currentIndex + 1]!;
    nextStage.status = 'in-progress';
    nextStage.health = 'watch';
    activeStructureProject.value.stage = nextStage.name;
  }

  if (!stage.transitionHistory) stage.transitionHistory = [];
  stage.transitionHistory.unshift({
    time: new Date().toLocaleString('zh-CN', { hour12: false }),
    operator: 'PMO 管理员 (特批)',
    action: 'concession',
    actionLabel: '容缺特批流转',
    fromStage: stage.name,
    toStage: stages[currentIndex + 1]?.name || '下一阶段',
    reason: concessionReason.value || '经审批容缺特批推进',
  });

  concessionModalOpen.value = false;
  message.warning(
    `已执行【容缺特批流转】：【${stage.name}】已特批结项，遗留卡点已滚入下一阶段重点督办！`,
  );
}

interface MonthlyReportGroup {
  month: string;
  reports: Array<any>;
}

const groupedProjectWeeklyReportsByMonth = computed<MonthlyReportGroup[]>(() => {
  const project = activeStructureProject.value;
  if (!project) return [];
  const reports = project.stages.flatMap((stage) =>
    (stage.weeklyReports || []).map((report) => ({
      ...report,
      stageCode: stage.code,
      stageName: stage.name,
    })),
  );
  const query = projectReportSearchKeyword.value.trim().toLowerCase();
  const groupsMap = new Map<string, Array<any>>();

  reports.forEach((report) => {
    let monthKey = '2026年08月';
    const dateStr = report.submitDate || report.submittedAt || '';
    const match = dateStr.match(/(\d{4})[/-](\d{2})/);
    if (match) {
      monthKey = `${match[1]}年${match[2]}月`;
    }

    const weekTitle = report.weekTitle || report.title || '';
    const weekMatch =
      weekTitle.match(/第\s*\d+\s*周/) ||
      (report.cycle ? report.cycle.match(/W\d+/) : null);
    const weekStr = weekMatch ? weekMatch[0] : report.cycle || '本周';
    const authorName =
      report.author || report.reporter || project.manager || '责任人';
    const personWeekTitle = `${authorName} · ${weekStr}`;

    const searchableText = [
      authorName,
      weekStr,
      report.weekTitle,
      report.title,
      report.weekRange,
      report.cycle,
      report.summary,
      report.stageCode,
      report.stageName,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (query && !searchableText.includes(query)) return;

    if (!groupsMap.has(monthKey)) {
      groupsMap.set(monthKey, []);
    }
    groupsMap.get(monthKey)!.push({
      ...report,
      personWeekTitle,
    });
  });

  const list: MonthlyReportGroup[] = [];
  groupsMap.forEach((items, month) => {
    list.push({ month, reports: items });
  });
  return list.toSorted((a, b) => b.month.localeCompare(a.month, 'zh-CN'));
});

const filteredProjectWeeklyReportCount = computed(() =>
  groupedProjectWeeklyReportsByMonth.value.reduce(
    (total, group) => total + group.reports.length,
    0,
  ),
);

function normalizedArtifactName(value = '') {
  return value
    .toLowerCase()
    .replace(/\.(docx?|pdf|xlsx?|pptx?|zip|html?|vsdx)$/i, '')
    .replace(/[《》（）()\s_-]/g, '')
    .replace(/完成并提交|草稿版本|已签批|盖章/g, '');
}

const projectDeliverableStageGroups = computed<
  ProjectDeliverableStageGroup[]
>(() => {
  const project = activeStructureProject.value;
  if (!project) return [];

  return project.stages
    .map((stage) => {
      const stageFiles: LinkedDeliverableFile[] = [];
      const seenFiles = new Set<string>();
      (stage.weeklyReports || []).forEach((report) => {
        const reportFiles =
          report.deliverablesSubmitted || report.deliverables || [];
        reportFiles.forEach((file: any) => {
          const fileKey = file.id || file.name;
          if (seenFiles.has(fileKey)) return;
          seenFiles.add(fileKey);
          stageFiles.push({
            id: file.id || `${stage.id}-${stageFiles.length + 1}`,
            name: file.name,
            size: file.size || '—',
            uploadedAt: file.uploadedAt || report.submitDate || '—',
            reportTitle: report.weekTitle || report.title || '项目周报',
            report,
          });
        });
      });

      const deliverables = stage.objectives.flatMap((objective) =>
        objective.krs
          .filter((kr) => kr.kind === 'deliverable')
          .map((kr) => {
            const artifactName = normalizedArtifactName(
              kr.artifact || kr.title,
            );
            const files =
              kr.status === 'pending'
                ? []
                : stageFiles.filter((file) => {
                    const fileName = normalizedArtifactName(file.name);
                    return (
                      artifactName.length >= 4 &&
                      (fileName.includes(artifactName) ||
                        artifactName.includes(fileName))
                    );
                  });
            return {
              id: kr.id,
              name: kr.artifact || kr.title.replace(/^完成并提交/, ''),
              stageId: stage.id,
              stageCode: stage.code,
              stageName: stage.name,
              objectiveCode: objective.code,
              objectiveTitle: objective.title,
              owner: kr.owner,
              dueDate: kr.dueDate,
              status: kr.status,
              acceptance: kr.acceptance || '按项目阶段验收标准执行',
              files,
            } satisfies ProjectDeliverableRecord;
          }),
      );

      return {
        stageId: stage.id,
        stageCode: stage.code,
        stageName: stage.name,
        deliverables,
      };
    })
    .filter((group) => group.deliverables.length > 0);
});

const projectDeliverableCount = computed(() =>
  projectDeliverableStageGroups.value.reduce(
    (total, group) => total + group.deliverables.length,
    0,
  ),
);

const filteredProjectDeliverableStageGroups = computed(() => {
  const query = projectDeliverableKeyword.value.trim().toLowerCase();
  return projectDeliverableStageGroups.value
    .map((group) => ({
      ...group,
      deliverables: group.deliverables.filter((deliverable) => {
        const matchesFileFilter =
          projectDeliverableFileFilter.value === 'all' ||
          (projectDeliverableFileFilter.value === 'linked'
            ? deliverable.files.length > 0
            : deliverable.files.length === 0);
        const searchableText = [
          deliverable.name,
          deliverable.stageCode,
          deliverable.stageName,
          deliverable.objectiveCode,
          deliverable.objectiveTitle,
          deliverable.owner,
          deliverable.acceptance,
          ...deliverable.files.map((file) => file.name),
        ]
          .join(' ')
          .toLowerCase();
        return matchesFileFilter && (!query || searchableText.includes(query));
      }),
    }))
    .filter((group) => group.deliverables.length > 0);
});

const projectOperationLogs = computed<ProjectOperationLog[]>(() => {
  const project = activeStructureProject.value;
  if (!project) return [];
  const completedStage = project.stages.find(
    (stage) => stage.status === 'completed',
  );
  const completedObjective = project.stages
    .flatMap((stage) => stage.objectives)
    .find((objective) => objective.progress === 100);
  const dueTimestamp = Date.parse(`${project.dueDate}T00:00:00Z`);
  const previousDueDate = Number.isNaN(dueTimestamp)
    ? '原计划日期'
    : new Date(dueTimestamp - 6 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

  return [
    {
      id: `${project.id}-change-date`,
      kind: 'change',
      title: '项目交付基线发生变更',
      description: '客户现场窗口调整，交付计划经审批后更新。',
      before: `计划交付 ${previousDueDate}`,
      after: `计划交付 ${project.dueDate}`,
      reason: '客户现场停线窗口延后，经项目经理与交付总监确认。',
      operator: project.manager,
      time: '2026-08-29 16:20',
    },
    {
      id: `${project.id}-change-scope`,
      kind: 'change',
      title: '项目交付范围发生变更',
      description: '客户追加一个业务场景，已完成范围、成本和工期影响评估。',
      before: '原范围：核心业务场景',
      after: '新范围：增加异常追溯场景',
      reason: '客户提出新增业务需求，变更申请已通过审批。',
      operator: project.manager,
      time: '2026-08-27 14:08',
    },
    {
      id: `${project.id}-goal-2`,
      kind: 'goal',
      title: 'O2 方案评审目标已完成',
      description: '方案评审意见全部关闭，评审结论和确认记录已归档。',
      operator: project.manager,
      time: '2026-08-25 18:06',
    },
    {
      id: `${project.id}-stage-2`,
      kind: 'stage',
      title: `${project.stages[1]?.code || 'S2'} ${project.stages[1]?.name || '方案阶段'}已完成`,
      description: '阶段目标与成果物均通过验收，系统自动推进后续阶段。',
      operator: project.stages[1]?.owner || project.manager,
      time: '2026-08-25 18:10',
    },
    {
      id: `${project.id}-goal-completed`,
      kind: 'goal',
      title: `${completedObjective?.code || 'O1'} 目标已完成`,
      description:
        completedObjective?.title || '需求范围、验收边界与责任关系已确认。',
      operator: completedObjective?.owner || project.manager,
      time: '2026-08-22 17:36',
    },
    {
      id: `${project.id}-stage-completed`,
      kind: 'stage',
      title: `${completedStage?.code || 'S1'} ${completedStage?.name || '需求确认'}已完成`,
      description: '阶段准出门禁全部满足，成果物已完成验收并进入下一阶段。',
      operator: completedStage?.owner || project.manager,
      time: '2026-08-22 17:40',
    },
    {
      id: `${project.id}-change-manager`,
      kind: 'change',
      title: '项目经理调整',
      description: '因资源安排变化，项目管理责任完成交接。',
      before: '项目经理：王磊',
      after: `项目经理：${project.manager}`,
      reason: '交付资源重新分工，原负责人已完成资料和风险交接。',
      operator: '交付总监',
      time: '2026-08-15 11:26',
    },
    {
      id: `${project.id}-goal-baseline`,
      kind: 'goal',
      title: 'O0 项目启动准备目标已完成',
      description: '核心成员、客户联系人、沟通机制与项目资料均已到位。',
      operator: project.manager,
      time: '2026-08-08 16:42',
    },
    {
      id: `${project.id}-stage-ready`,
      kind: 'stage',
      title: '立项准备阶段已完成',
      description: '项目资料齐套，AI 解析、宪章确认和执行基线发布均已完成。',
      operator: project.manager,
      time: '2026-08-05 09:35',
    },
    {
      id: `${project.id}-initiated`,
      kind: 'initiation',
      title: '项目正式立项',
      description: `项目宪章与执行基线已确认，生成治理编号 #PMO-${project.code}。`,
      operator: project.manager,
      time: '2026-08-01 10:18',
    },
    {
      id: `${project.id}-baseline-published`,
      kind: 'initiation',
      title: '执行基线 V1.0 已发布',
      description: '阶段、目标、KR、责任矩阵和交付日期正式生效。',
      operator: project.manager,
      time: '2026-08-01 10:16',
    },
    {
      id: `${project.id}-charter-confirmed`,
      kind: 'initiation',
      title: '项目宪章已确认',
      description: '项目目标、范围边界、核心角色与治理约定完成确认。',
      operator: project.manager,
      time: '2026-08-01 10:08',
    },
  ];
});

const filteredProjectOperationLogs = computed(() => {
  const query = projectLogKeyword.value.trim().toLowerCase();
  return projectOperationLogs.value
    .filter((log) => {
      const matchesType =
        projectLogType.value === 'all' || log.kind === projectLogType.value;
      const searchableText = [
        log.kind === 'change'
          ? '项目变更'
          : log.kind === 'initiation'
            ? '项目立项'
            : log.kind === 'stage'
              ? '阶段完成'
              : '目标完成',
        log.title,
        log.description,
        log.operator,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return matchesType && (!query || searchableText.includes(query));
    })
    .toSorted((a, b) => b.time.localeCompare(a.time));
});

const pagedProjectOperationLogs = computed(() => {
  const start = (projectLogPage.value - 1) * projectLogPageSize;
  return filteredProjectOperationLogs.value.slice(
    start,
    start + projectLogPageSize,
  );
});

function reportAvatarText(report: any) {
  const name = report.reporter || report.author || '责任人';
  return name.slice(-1);
}

function previewWeeklyReport(report: any) {
  selectedWeeklyReport.value = report;
  weeklyReportPreviewOpen.value = true;
}

const activeStageDiagnosis = computed<null | StageDiagnosis>(() => {
  const stage = activeDiagnosisStage.value || activeManagedStage.value;
  const project = activeStructureProject.value;
  if (!stage || !project) return null;

  if (project.id === 'delivery-ningde-d4' && stage.code === 'S3') {
    return {
      stageId: stage.id,
      stageCode: stage.code,
      stageName: stage.name,
      stageHealth: stage.health,
      owner: stage.owner,
      plannedStart: stage.plannedStart,
      plannedEnd: stage.plannedEnd,
      delayedDays: 3,
      blockedObjective: {
        code: 'O3',
        title: '完成实施研发阶段并达到下一阶段准入条件',
        progress: 58,
      },
      rootCause: {
        deliverableName: '《接口联调测试报告》',
        deliverableOwner: '张三',
        deliverableDueDate: '09/05',
        deliverableStatus: '有风险 (完成率仅 68%)',
        templateRule:
          '退出门禁：核心接口测试通过率达到 95% 且具备双方签字的联调测试报告',
        blockerReason:
          '现场网络白名单尚未开通，核心接口联调无法在客户实际网络环境中完成联通验证，当前仅完成本地回归（68%）。',
      },
      chainImpact: {
        downstreamStageName: 'S4 试运行阶段',
        downstreamStartDate: '原定 2026-09-06',
        impactDescription:
          '实施研发阶段无法达成退出门禁，导致现场试运行无法如期部署，整机联调被阻断。',
        projectDelayDays: 5,
        originalDueDate: '2026-09-30',
        revisedDueDate: '2026-10-05',
        probabilityBefore: 78,
        probabilityAfter: 43,
      },
      strategies: [
        {
          id: 'inquire-ningde',
          shortTitle: '责任催办',
          type: 'action',
          riskLevel: 'low',
          tag: '督促与定责',
          tagColor: 'orange',
          title: '向执行人张三下发延期质询与周报重承诺指令',
          targetRole: '研发负责人 · 张三',
          description:
            '要求在周五周报中正式说明外部白名单受阻事实，并在周报中重新给出可验证的交付承诺日期。',
          previewContent:
            '【项目管理质询督促令】\n致研发负责人张三：\n检测到《接口联调测试报告》进度（68%）滞后于计划窗口，已阻碍 S3 阶段验收与 O3 达成。请在明天 12:00 前提交白名单受阻补充说明，并在本周五周报中重新提交交付承诺日期与补救措施。',
          actionLabel: '一键下发质询令',
          appliedLabel: '已下发督促令',
        },
        {
          id: 'trim-ningde',
          shortTitle: '申请变更',
          type: 'replan',
          riskLevel: 'medium',
          tag: '范围与排期调整',
          tagColor: 'blue',
          title: '范围裁剪：核心接口先验，非关键接口容缺后置',
          targetRole: '项目经理 · 李四',
          description:
            '锁定已通过的 8 个核心工序接口先进入试运行环境部署，剩余 4 个报表非核心接口后置至试运行期间并行排查。',
          previewContent:
            '【排期与范围调整方案】\n• 建议调整：将 4 项非阻塞报表接口剥离至 S4 试运行第一周交付；\n• 调整后效果：S4 准入门禁达成率提升至 90%，降低非关键接口对主路径的影响。',
          actionLabel: '采纳排期微调建议',
          appliedLabel: '排期调整已登记',
        },
        {
          id: 'escalate-ningde',
          shortTitle: '资源升级',
          type: 'resource',
          riskLevel: 'medium',
          tag: '外部依赖升级',
          tagColor: 'red',
          title: '启动客户外部依赖联合升级：客户 IT 部网络白名单催办',
          targetRole: '交付部总监 / 客户 IT 部负责人',
          description:
            '符合《项目交付管理制度》第 5 条“外部依赖阻塞超 48 小时应升级”。自动生成《客户网络白名单协调备忘录》。',
          previewContent:
            '【客户协调备忘录草稿】\n关于宁德 D4 项目测试环境网络白名单开通的紧急协调函：\n宁德客户项目组：因相机升级需联调 MES 与数据回传接口，白名单申请已滞后 3 个工作日，已直接影响 9/06 试运行排期。特申请召开 15 分钟高层联合确认会，协同开通网络权限。',
          actionLabel: '生成外部升级公函',
          appliedLabel: '已生成升级公函',
        },
      ],
    };
  }

  if (project.id === 'ops-zhongliang-e5' && stage.code === 'S3') {
    return {
      stageId: stage.id,
      stageCode: stage.code,
      stageName: stage.name,
      stageHealth: stage.health,
      owner: stage.owner,
      plannedStart: stage.plannedStart,
      plannedEnd: stage.plannedEnd,
      delayedDays: 4,
      blockedObjective: {
        code: 'O3',
        title: '完成处置修复阶段并达到下一阶段准入条件',
        progress: 46,
      },
      rootCause: {
        deliverableName: '《故障修复与变更记录》',
        deliverableOwner: '孙莉',
        deliverableDueDate: '09/03',
        deliverableStatus: '严重受阻 (恢复率仅 60%)',
        templateRule:
          '退出门禁：受影响设备恢复率达到 100%，具备合格的故障修复与变更记录',
        blockerReason:
          '相机驱动适配补丁在高温环境下反复出现丢帧异常，原厂补丁验证失败，处置方案等待供应商二次固件推送。',
      },
      chainImpact: {
        downstreamStageName: 'S4 验证观察阶段',
        downstreamStartDate: '原定 2026-09-04',
        impactDescription:
          '无法达成连续 7 天无重大故障运行的门禁要求，验证观察期无法启动。',
        projectDelayDays: 7,
        originalDueDate: '2026-09-16',
        revisedDueDate: '2026-09-23',
        probabilityBefore: 72,
        probabilityAfter: 38,
      },
      strategies: [
        {
          id: 'supplier-zl',
          shortTitle: '原厂催办',
          type: 'action',
          riskLevel: 'medium',
          tag: '供应商督促',
          tagColor: 'orange',
          title: '要求原厂提供临时降级驱动与备用机方案',
          targetRole: '供应商管理 · 高峰',
          description:
            '要求相机原厂在 24 小时内提供兼容版本驱动，若无法解决则启用备选硬件方案。',
          previewContent:
            '【供应商紧急催告函】\n致相机驱动研发支持组：高温丢帧问题已导致中粮生产线修复阶段超期 4 天。请于今日 18:00 前提供 V2.14 修复固件或临时降频运行参数。',
          actionLabel: '下发原厂催告函',
          appliedLabel: '已下发催告函',
        },
        {
          id: 'concession-zl',
          shortTitle: '分批验证',
          type: 'replan',
          riskLevel: 'medium',
          tag: '容缺试跑',
          tagColor: 'blue',
          title: '分批试跑：非高温产线先行进入验证期',
          targetRole: '运维工程师 · 刘工',
          description:
            '常温环境下的 6 台设备已恢复，可先行启动局实验证，隔离高温产线 4 台设备单独处置。',
          previewContent:
            '【分批试运行方案】\n隔离受影响产线，先启动已修复产线的 7 天无故障统计，将整体工期影响压缩在 2 天以内。',
          actionLabel: '采纳分批验证排期',
          appliedLabel: '分批验证已登记',
        },
        {
          id: 'memo-zl',
          shortTitle: '客户沟通',
          type: 'resource',
          riskLevel: 'low',
          tag: '管理升级',
          tagColor: 'red',
          title: '与中粮设备部召开专项沟通会并签署延期谅解备忘',
          targetRole: '项目经理 · 王天豪',
          description:
            '主动向上汇报驱动兼容性客观风险，争取 5 天观察宽限期，避免触发合同违约。',
          previewContent:
            '【中粮产线运维说明备忘录】\n针对高温环境丢帧现象的分析报告与第二阶段应对举措，提请中粮生产设备部知悉并协同调整维护窗口。',
          actionLabel: '生成客户沟通备忘录',
          appliedLabel: '已生成备忘录',
        },
      ],
    };
  }

  // 通用动态兜底计算
  const blockedObj =
    stage.objectives.find((o) => ['at-risk', 'blocked'].includes(o.health)) ||
    stage.objectives[0];
  const blockedKr =
    blockedObj?.krs.find((kr) =>
      ['at-risk', 'in-progress', 'missing'].includes(kr.status),
    ) || blockedObj?.krs[0];
  const stageIndex = project.stages.findIndex((s) => s.id === stage.id);
  const nextStage =
    stageIndex !== -1 && stageIndex < project.stages.length - 1
      ? project.stages[stageIndex + 1]
      : null;

  return {
    stageId: stage.id,
    stageCode: stage.code,
    stageName: stage.name,
    stageHealth: stage.health,
    owner: stage.owner,
    plannedStart: stage.plannedStart,
    plannedEnd: stage.plannedEnd,
    delayedDays: stage.health === 'blocked' ? 4 : 2,
    blockedObjective: {
      code: blockedObj?.code || 'O1',
      title: blockedObj?.title || stage.name,
      progress: blockedObj?.progress || stage.progress,
    },
    rootCause: {
      deliverableName: blockedKr
        ? `《${blockedKr.artifact || blockedKr.title}》`
        : '《阶段必备交付物》',
      deliverableOwner: blockedKr?.owner || stage.owner,
      deliverableDueDate: blockedKr?.dueDate || stage.plannedEnd,
      deliverableStatus: stage.health === 'blocked' ? '受阻未交付' : '临期滞后',
      templateRule:
        stage.exitCriteria || '完成阶段必备成果物交付并达到准出指标',
      blockerReason: `该阶段关键交付物未能满足退出门禁要求，前序依赖项尚未完全解开，导致目标【${blockedObj?.code || 'O'}】无法按期验收。`,
    },
    chainImpact: {
      downstreamStageName: nextStage
        ? `${nextStage.code} ${nextStage.name}`
        : '最终项目交付',
      downstreamStartDate: nextStage
        ? `原定 ${nextStage.plannedStart}`
        : '原定完成期',
      impactDescription: nextStage
        ? `阻碍后序【${nextStage.name}】准入启动，压缩整体缓冲时间。`
        : '直接危及整体项目按期验收。',
      projectDelayDays: stage.health === 'blocked' ? 5 : 3,
      originalDueDate: project.dueDate,
      revisedDueDate: '预计顺延 3~5 天',
      probabilityBefore: project.onTimeProbability,
      probabilityAfter: Math.max(30, project.onTimeProbability - 25),
    },
    strategies: [
      {
        id: `inquire-${stage.id}`,
        shortTitle: '责任催办',
        type: 'action',
        riskLevel: 'low',
        tag: '督促与定责',
        tagColor: 'orange',
        title: `向责任人 ${stage.owner} 下发延期质询与周报重承诺指令`,
        targetRole: `阶段负责人 · ${stage.owner}`,
        description:
          '要求责任人说明卡点原因，并在周五周报中重新提交交付承诺日期与具体执行路径。',
        previewContent: `【项目质询督促令】\n致责任人${stage.owner}：\n检测到【${stage.name}】推进滞后，已直接阻碍${blockedObj?.code || '目标'}达成。请在明天 12:00 前提交卡点说明，并在本周五周报中更新承诺交付时间与补救措施。`,
        actionLabel: '一键生成并下发质询令',
        appliedLabel: '已下发督促令',
      },
      {
        id: `trim-${stage.id}`,
        shortTitle: '申请变更',
        type: 'replan',
        riskLevel: 'medium',
        tag: '排期与门禁优化',
        tagColor: 'blue',
        title: '阶段容缺与排期微调：关键任务先行，非核心项后置',
        targetRole: `项目经理 · ${project.manager}`,
        description:
          '梳理核心与非核心交付项，允许部分非关键指标在进入下一阶段后补齐，减少停摆损失。',
        previewContent: `【排期微调建议】\n• 建议调整：允许关键结果容缺先行推进；\n• 调整后效果：减少下游阶段等待并保护项目关键路径。`,
        actionLabel: '采纳排期微调建议',
        appliedLabel: '排期调整已登记',
      },
      {
        id: `escalate-${stage.id}`,
        shortTitle: '资源升级',
        type: 'resource',
        riskLevel: 'medium',
        tag: '管理升级',
        tagColor: 'red',
        title: '启动外部资源与依赖升级协调',
        targetRole: '项目总监 / 业务干系人',
        description:
          '当外部依赖超过时限时，自动生成包含影响事实的高层协调公函，推动跨部门解决。',
        previewContent: `【管理升级沟通函】\n关于【${project.name}】${stage.name}外部卡点的协调函：\n因关键依赖受阻导致阶段延期，特申请高层资源介入协调，以保障项目整体里程碑按期落地。`,
        actionLabel: '生成升级沟通函',
        appliedLabel: '已生成沟通函',
      },
    ],
  };
});
</script>

<template>
  <AiWorkPage
    icon="lucide:folder-kanban"
    :title="isManager ? '项目' : '我的项目'"
  >
    <section class="project-workbench">
      <section class="project-panel">
        <header class="project-toolbar">
          <div class="project-search">
            <Input
              v-model:value="keyword"
              allow-clear
              aria-label="搜索项目"
              placeholder="搜索项目、客户或负责人"
            >
              <template #prefix><Icon icon="lucide:search" /></template>
            </Input>
            <Select
              v-model:value="healthFilter"
              :options="healthOptions"
              aria-label="项目状态筛选"
            />
            <Select
              v-model:value="typeFilter"
              :options="typeOptions"
              aria-label="项目类型筛选"
            />
          </div>
          <div class="project-toolbar-actions">
            <span v-if="!isManager" class="project-readonly-badge">
              <Icon icon="lucide:eye" />
              只读查看
            </span>
            <div class="view-switch" aria-label="项目视图切换">
            <button
              type="button"
              :aria-pressed="viewMode === 'structure'"
              :class="{ 'is-active': viewMode === 'structure' }"
              @click="openStructureProjectList"
            >
              <Icon icon="lucide:list-tree" />
              阶段与成果
            </button>
            <button
              type="button"
              :aria-pressed="viewMode === 'board'"
              :class="{ 'is-active': viewMode === 'board' }"
              @click="viewMode = 'board'"
            >
              <Icon icon="lucide:layout-dashboard" />
              项目看板
            </button>
            </div>
          </div>
        </header>

        <div v-if="filteredProjects.length > 0 && viewMode === 'board'" class="portfolio-board">
          <section class="portfolio-overview" aria-label="项目组合概览">
            <article><span class="overview-icon is-primary"><Icon icon="lucide:folder-kanban" /></span><div><small>项目总数</small><strong>{{ portfolioSummary.total }}</strong><p>当前项目组合</p></div></article>
            <article><span class="overview-icon is-danger"><Icon icon="lucide:triangle-alert" /></span><div><small>风险项目</small><strong>{{ portfolioSummary.riskProjects }}</strong><p>需优先处理</p></div></article>
            <article><span class="overview-icon is-warning"><Icon icon="lucide:circle-alert" /></span><div><small>需关注</small><strong>{{ portfolioSummary.watchProjects }}</strong><p>持续跟踪</p></div></article>
            <article><span class="overview-icon is-success"><Icon icon="lucide:chart-no-axes-column-increasing" /></span><div><small>平均进度</small><strong>{{ portfolioSummary.averageProgress }}%</strong><p>项目整体完成度</p></div></article>
          </section>

          <section class="project-card-grid" aria-label="项目看板">
            <article
              v-for="project in filteredProjects"
              :key="project.id"
              class="project-board-card"
              :class="`is-${project.health}`"
              tabindex="0"
              role="button"
              :aria-label="`打开项目 ${project.name}`"
              @click="openProject(project)"
              @keyup.enter="openProject(project)"
            >
              <div class="project-health-bar"></div>
              <header class="project-card-head">
                <span class="project-card-icon"><Icon icon="lucide:folder-kanban" /></span>
                <div>
                  <div><span>{{ project.code }}</span><span class="health-dot"></span><b>{{ healthLabel(project.health) }}</b></div>
                  <h3>{{ project.name }}</h3>
                  <p>{{ project.customer }} · {{ project.typeLabel }}</p>
                </div>
                <Icon icon="lucide:arrow-up-right" class="project-card-arrow" />
              </header>

              <div class="current-stage-card">
                <div><span>当前阶段</span><b>{{ currentStageNumber(project) }}/{{ project.stages.length }}</b></div>
                <strong>{{ currentStage(project)?.name || project.stage }}</strong>
                <Progress :percent="currentStage(project)?.progress || 0" :show-info="false" :stroke-color="['at-risk', 'blocked'].includes(project.health) ? '#e45b52' : project.health === 'watch' ? '#e8a23a' : '#18a17d'" />
              </div>

              <div class="project-card-metrics">
                <div><span>任务</span><strong>{{ projectBoardStats(project).completedTasks }}<small>/{{ projectBoardStats(project).tasks }}</small></strong><i>已完成</i></div>
                <div><span>目标</span><strong>{{ projectBoardStats(project).completedObjectives }}<small>/{{ projectBoardStats(project).objectives }}</small></strong><i>已完成</i></div>
                <div><span>成果物</span><strong>{{ projectBoardStats(project).completedDeliverables }}<small>/{{ projectBoardStats(project).deliverables }}</small></strong><i>已验收</i></div>
              </div>

              <footer class="project-card-foot">
                <span><Icon icon="lucide:user-round" />{{ project.manager }}</span>
                <span><Icon icon="lucide:calendar-days" />{{ project.dueDate }}</span>
                <b>{{ project.progress }}%</b>
              </footer>
            </article>
          </section>
        </div>

        <div v-else-if="viewMode === 'structure'" class="structure-workbench">
          <section
            v-if="!structureProjectDetailOpen"
            class="structure-project-browser"
          >
            <header class="structure-browser-header">
              <div>
                <span>PROJECTS</span>
                <h2>选择项目查看阶段与成果</h2>
                <p>点击项目卡片进入阶段、目标和成果物工作区。</p>
              </div>
              <strong>{{ filteredProjects.length }} 个项目</strong>
            </header>

            <div
              v-if="pagedStructureProjects.length"
              class="structure-project-card-grid"
            >
              <article
                v-for="project in pagedStructureProjects"
                :key="project.id"
                class="structure-project-card"
                :class="`is-${project.health}`"
                tabindex="0"
                role="button"
                @click="selectProject(project)"
                @keyup.enter="selectProject(project)"
              >
                <div class="structure-card-status"></div>
                <header>
                  <span class="structure-card-icon">
                    <Icon icon="lucide:folder-kanban" />
                  </span>
                  <div>
                    <small>{{ project.code }}</small>
                    <h3>{{ project.name }}</h3>
                    <p>{{ project.customer }} · {{ project.typeLabel }}</p>
                  </div>
                  <span class="status-pill" :class="`is-${project.health}`">
                    {{ healthLabel(project.health) }}
                  </span>
                </header>
                <div class="structure-card-stage">
                  <span>当前阶段</span>
                  <strong>{{ currentStage(project)?.name || project.stage }}</strong>
                  <b>{{ project.progress }}%</b>
                </div>
                <footer>
                  <span><Icon icon="lucide:user-round" />{{ project.manager }}</span>
                  <span><Icon icon="lucide:target" />{{ projectBoardStats(project).objectives }} 个目标</span>
                  <span><Icon icon="lucide:file-check-2" />{{ projectBoardStats(project).deliverables }} 个成果物</span>
                  <Icon icon="lucide:arrow-right" class="structure-card-arrow" />
                </footer>
              </article>
            </div>
            <Empty v-else description="没有符合条件的项目" />

            <Pagination
              v-if="filteredProjects.length > structureProjectPageSize"
              v-model:current="structureProjectPage"
              :page-size="structureProjectPageSize"
              :total="filteredProjects.length"
              :show-size-changer="false"
              show-less-items
              class="structure-project-pagination"
            />
          </section>

          <aside v-if="false" class="structure-project-list" aria-label="项目树">
            <header class="project-directory-header">
              <div class="project-directory-tabs" role="tablist" aria-label="项目目录">
                <button
                  type="button"
                  role="tab"
                  :aria-selected="projectDirectoryTab === 'active'"
                  :class="{ 'is-active': projectDirectoryTab === 'active' }"
                  @click="switchProjectDirectoryTab('active')"
                >
                  项目
                  <span>{{ activeProjectCount }}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  :aria-selected="projectDirectoryTab === 'archived'"
                  :class="{ 'is-active': projectDirectoryTab === 'archived' }"
                  @click="switchProjectDirectoryTab('archived')"
                >
                  归档项目
                  <span>{{ archivedProjectCount }}</span>
                </button>
                <Dropdown
                  v-if="isManager"
                  :trigger="['click']"
                  placement="bottomRight"
                >
                  <button
                    type="button"
                    class="project-directory-add"
                    aria-label="新增项目目录或发起项目立项"
                    title="新增"
                  >
                    <Icon icon="lucide:plus" />
                  </button>
                  <template #overlay>
                    <div class="project-action-menu" role="menu">
                      <button
                        type="button"
                        role="menuitem"
                        @click="startAddProjectDirectory"
                      >
                        <Icon icon="lucide:folder-plus" />
                        新增项目目录
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        @click="goToInitiation"
                      >
                        <Icon icon="lucide:sparkles" />
                        项目立项
                      </button>
                    </div>
                  </template>
                </Dropdown>
              </div>

              <div
                v-if="isManager && addingProjectDirectory"
                class="new-directory-form"
              >
                <Input
                  v-model:value="newProjectDirectoryName"
                  autofocus
                  aria-label="项目目录名称"
                  placeholder="输入新目录名称"
                  @keyup.enter="saveProjectDirectory"
                  @keyup.esc="cancelAddProjectDirectory"
                />
                <button
                  type="button"
                  aria-label="保存项目目录"
                  title="保存"
                  @click="saveProjectDirectory"
                >
                  <Icon icon="lucide:check" />
                </button>
                <button
                  type="button"
                  aria-label="取消新增项目目录"
                  title="取消"
                  @click="cancelAddProjectDirectory"
                >
                  <Icon icon="lucide:x" />
                </button>
              </div>
            </header>
            <section
              v-for="group in projectGroups"
              :key="group.name"
              class="project-tree-group"
            >
              <button
                type="button"
                class="project-tree-parent"
                :aria-expanded="isProjectGroupExpanded(group.name)"
                @click="toggleProjectGroup(group.name)"
              >
                <Icon
                  :icon="
                    isProjectGroupExpanded(group.name)
                      ? 'lucide:square-minus'
                      : 'lucide:square-plus'
                  "
                />
                <strong>{{ group.name }}</strong>
              </button>
              <div
                v-if="isProjectGroupExpanded(group.name)"
                class="project-tree-children"
              >
                <div
                  v-for="project in group.projects"
                  :key="project.id"
                  class="project-tree-project"
                  :class="{
                    'is-selected': activeStructureProject?.id === project.id,
                  }"
                >
                  <button
                    type="button"
                    class="project-tree-project-main"
                    @click="selectProject(project)"
                  >
                    <span>{{ project.name }}</span>
                  </button>
                  <Dropdown
                    v-if="isManager"
                    :trigger="['click']"
                    placement="bottomRight"
                  >
                    <button
                      type="button"
                      class="project-more-button"
                      :aria-label="`${project.name}更多操作`"
                      title="更多操作"
                      @click.stop
                    >
                      <Icon icon="lucide:ellipsis" />
                    </button>
                    <template #overlay>
                      <div class="project-action-menu" role="menu">
                        <button
                          v-if="projectDirectoryTab === 'active'"
                          type="button"
                          role="menuitem"
                          @click="archiveProject(project)"
                        >
                          <Icon icon="lucide:archive" />
                          归档项目
                        </button>
                        <button
                          v-else
                          type="button"
                          role="menuitem"
                          @click="restoreProject(project)"
                        >
                          <Icon icon="lucide:archive-restore" />
                          恢复项目
                        </button>
                      </div>
                    </template>
                  </Dropdown>
                </div>
              </div>
            </section>
            <div
              v-if="projectGroups.length === 0"
              class="project-directory-empty"
            >
              <Icon icon="lucide:archive" />
              <span>{{
                projectDirectoryTab === 'archived'
                  ? '暂无归档项目'
                  : '没有符合条件的项目'
              }}</span>
            </div>
          </aside>

          <section
            v-if="structureProjectDetailOpen && activeStructureProject"
            class="structure-detail"
          >
            <div class="structure-detail-toolbar">
              <Button
                size="small"
                class="back-project-list-button"
                @click="backToStructureProjectList"
              >
                <Icon icon="lucide:arrow-left" />
                返回项目列表
              </Button>
              <span>
                <Icon icon="lucide:folder-kanban" />
                {{ activeStructureProject.name }}
              </span>
            </div>
            <header
              class="structure-project-summary is-clickable-card"
              title="点击查看完整项目详情"
              @click="openProjectDossier"
            >
              <div class="summary-main-info">
                <div class="summary-heading">
                  <h2>{{ activeStructureProject.name }}</h2>
                  <Button
                    size="small"
                    class="detail-quick-btn"
                    @click.stop="openProjectDossier"
                  >
                    <Icon icon="lucide:file-text" />
                    项目详情
                  </Button>
                </div>
                <p>{{ activeStructureProject.summary }}</p>
                <small>
                  项目经理 {{ activeStructureProject.manager }} ·
                  {{ activeStructureProject.startDate }} 至
                  {{ activeStructureProject.dueDate }}
                </small>
              </div>

              <div class="summary-right-side">
                <div class="summary-progress">
                  <strong>
                    {{ currentStageNumber(activeStructureProject) }}/{{
                      activeStructureProject.stages.length
                    }}
                  </strong>
                  <span>当前阶段</span>
                </div>
              </div>
            </header>

            <div class="stage-tree-scroll">
              <!-- 可展开的阶段里程碑全景 -->
              <div
                class="stage-flow-strip"
                :class="{ 'is-expanded': stageFlowExpanded }"
              >
                <div class="stage-flow-strip__header">
                  <span class="strip-label">
                    <Icon icon="lucide:milestone" aria-hidden="true" />
                    阶段流转全景
                  </span>
                  <button
                    type="button"
                    class="stage-flow-toggle"
                    :aria-expanded="stageFlowExpanded"
                    aria-controls="project-stage-milestones"
                    @click="stageFlowExpanded = !stageFlowExpanded"
                  >
                    {{ stageFlowExpanded ? '收起' : '展开' }}
                    <Icon
                      :icon="
                        stageFlowExpanded
                          ? 'lucide:chevron-up'
                          : 'lucide:chevron-down'
                      "
                      aria-hidden="true"
                    />
                  </button>
                </div>

                <div
                  v-show="stageFlowExpanded"
                  id="project-stage-milestones"
                  class="milestone-scroll"
                >
                  <div class="milestone-track">
                    <button
                      v-for="st in activeStructureProject.stages"
                      :key="st.id"
                      type="button"
                      class="milestone-item"
                      :class="{
                        'is-current': isStageActive(st),
                        'is-completed': st.status === 'completed',
                        'is-blocked': st.health === 'blocked',
                      }"
                      :aria-label="`${st.name}，${formatMilestoneDate(st.plannedEnd)}完成，${milestoneStatusLabel(st)}`"
                      :title="
                        isManager
                          ? isStageActive(st)
                            ? '当前正在执行该阶段'
                            : `点击后确认是否将项目当前阶段切换为【${st.name}】`
                          : `查看【${st.name}】阶段详情`
                      "
                      @click="
                        isManager ? switchToStage(st) : showStageDetail(st)
                      "
                    >
                      <span class="milestone-card">
                        <strong>{{ st.name }}</strong>
                        <span>
                          {{ formatMilestoneDate(st.plannedEnd) }}完成
                        </span>
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <section class="compact-stage-list">
                <article
                  v-for="(stage, stageIndex) in activeStructureProject.stages"
                  :key="stage.id"
                  class="compact-stage"
                  :class="[
                    `is-${stageTone(stage)}`,
                    { 'is-current-stage': isStageActive(stage) },
                    { 'is-completed-stage': stage.status === 'completed' },
                    { 'is-expanded': isStageExpanded(stage) },
                    { 'is-editing': isStageEditing(stage) },
                    {
                      'has-ai-alert': ['at-risk', 'blocked'].includes(
                        stage.health,
                      ),
                    },
                    `is-alert-${stage.health}`,
                  ]"
                >
                  <header
                    class="stage-row"
                    :class="{ 'is-active-stage-row': isStageActive(stage) }"
                  >
                    <button
                      type="button"
                      class="expand-button"
                      :aria-expanded="isStageExpanded(stage)"
                      :aria-label="`${isStageExpanded(stage) ? '收起' : '展开'}${stage.name}`"
                      @click="toggleStage(stage)"
                    >
                      <Icon
                        :icon="
                          isStageExpanded(stage)
                            ? 'lucide:square-minus'
                            : 'lucide:square-plus'
                        "
                      />
                    </button>
                    <div class="stage-row-title">
                      <div class="stage-row-title-top">
                        <strong
                          v-if="!isStageEditing(stage)"
                          class="stage-primary-title"
                          :class="`is-${stageDisplayState(stage)}`"
                        >
                          <span class="stage-order-label">
                            阶段 {{ stageIndex + 1 }}
                          </span>
                          <span class="stage-display-name">
                            {{ stage.name }}
                          </span>
                          <span
                            class="stage-mini-status"
                            :class="`is-${stageDisplayState(stage)}`"
                          >
                            {{ milestoneStatusLabel(stage) }}
                          </span>
                        </strong>
                        <div v-else class="node-name-editor">
                          <span class="stage-order-label">
                            阶段 {{ stageIndex + 1 }}
                          </span>
                          <Input
                            v-model:value="stage.name"
                            aria-label="阶段名称"
                          />
                          <span
                            class="stage-mini-status"
                            :class="`is-${stageDisplayState(stage)}`"
                          >
                            {{ milestoneStatusLabel(stage) }}
                          </span>
                        </div>

                        <!-- AI 延期卡点诊断胶囊入口 (并入标题同行) -->
                        <button
                          v-if="
                            ['at-risk', 'blocked'].includes(stage.health) &&
                            !isStageEditing(stage)
                          "
                          type="button"
                          class="stage-ai-pill"
                          :class="`is-${stage.health}`"
                          title="点击打开 AI 延期卡点深度诊断与应对预案"
                          @click.stop="openStageAiDiagnosis(stage)"
                        >
                          <Icon icon="lucide:sparkles" class="pill-sparkle" />
                          <span>AI 延期诊断</span>
                          <span class="pill-badge">
                            {{
                              stage.health === 'blocked'
                                ? '严重受阻'
                                : '延期预警'
                            }}
                          </span>
                        </button>
                      </div>
                      <small>
                        {{ stage.objectives.length }} 个目标 ·
                        {{ stageFlatItems(stage).filter((item) => item.kind === 'deliverable').length }} 个成果物 ·
                        {{ stageFlatItems(stage).filter((item) => item.kind === 'metric').length }} 个指标
                      </small>
                    </div>

                    <div class="stage-row-meta">
                      <span>
                        <Icon icon="lucide:calendar-clock" />
                        截止 {{ stage.plannedEnd }}
                      </span>
                      <span>
                        <Icon icon="lucide:user-round" />
                        {{ stage.owner }}
                      </span>
                    </div>
                    <div class="stage-actions">
                      <!-- 1. 切换/激活当前阶段 -->
                      <Tooltip
                        v-if="isManager"
                        :title="
                          isStageActive(stage)
                            ? '项目当前正在执行的主阶段'
                            : '手动启动此阶段，确认后切换项目当前状态'
                        "
                      >
                        <Button
                          size="small"
                          class="stage-icon-action"
                          :class="{
                            'is-active-stage-btn': isStageActive(stage),
                          }"
                          :disabled="isStageActive(stage)"
                          :aria-label="
                            isStageActive(stage)
                              ? `${stage.name}正在进行中`
                              : `手动启动${stage.name}`
                          "
                          @click.stop="switchToStage(stage)"
                        >
                          <Icon
                            :icon="
                              isStageActive(stage)
                                ? 'lucide:play-circle'
                                : 'lucide:arrow-right-left'
                            "
                          />
                        </Button>
                      </Tooltip>

                      <!-- 2. 编辑/保存阶段 -->
                      <Tooltip
                        v-if="isManager"
                        :title="
                          isStageEditing(stage)
                            ? '完成并保存编辑'
                            : '编辑阶段名称与排期'
                        "
                      >
                        <Button
                          size="small"
                          class="stage-icon-action"
                          :type="isStageEditing(stage) ? 'primary' : 'default'"
                          :aria-label="
                            isStageEditing(stage)
                              ? `保存${stage.name}`
                              : `编辑${stage.name}`
                          "
                          @click.stop="toggleStageEdit(stage)"
                        >
                          <Icon
                            :icon="
                              isStageEditing(stage)
                                ? 'lucide:check'
                                : 'lucide:pencil'
                            "
                          />
                        </Button>
                      </Tooltip>

                      <!-- 3. 删除阶段 -->
                      <Tooltip v-if="isManager" title="删除该阶段">
                        <Button
                          size="small"
                          danger
                          class="stage-icon-action stage-delete-action"
                          :aria-label="`删除${stage.name}`"
                          @click.stop="confirmDeleteStage(stage)"
                        >
                          <Icon icon="lucide:trash-2" />
                        </Button>
                      </Tooltip>

                      <!-- 4. 阶段详情（打开阶段抽屉） -->
                      <Tooltip title="查看阶段门禁、周报与详情抽屉">
                        <Button
                          size="small"
                          class="stage-icon-action stage-detail-action"
                          :aria-label="`查看${stage.name}详情`"
                          @click.stop="showStageDetail(stage)"
                        >
                          <Icon icon="lucide:panel-right-open" />
                        </Button>
                      </Tooltip>
                    </div>
                  </header>

                  <div
                    v-if="isManager && isStageEditing(stage)"
                    class="stage-edit-fields"
                  >
                    <label>
                      <span>阶段负责人</span>
                      <Select
                        v-model:value="stage.owner"
                        :options="memberOptions"
                        aria-label="阶段负责人"
                      />
                    </label>
                    <label>
                      <span>开始日期</span>
                      <Input
                        v-model:value="stage.plannedStart"
                        type="date"
                        aria-label="阶段开始日期"
                      />
                    </label>
                    <label>
                      <span>截止日期</span>
                      <Input
                        v-model:value="stage.plannedEnd"
                        type="date"
                        aria-label="阶段截止日期"
                      />
                    </label>
                  </div>

                  <div v-if="isStageExpanded(stage)" class="stage-flat-list">
                    <header class="stage-flat-list__head">
                      <div>
                        <strong>阶段事项</strong>
                        <span>目标、成果物和量化指标均直接挂在当前阶段下</span>
                      </div>
                      <span>{{ stageFlatItems(stage).length }} 项</span>
                    </header>
                    <article
                      v-for="item in stageFlatItems(stage)"
                      :key="item.id"
                      class="stage-flat-item"
                      :class="`is-${item.kind}`"
                    >
                      <span class="flat-item-icon">
                        <Icon :icon="item.kind === 'objective' ? 'lucide:target' : item.kind === 'deliverable' ? 'lucide:file-check-2' : 'lucide:gauge'" />
                      </span>
                      <div v-if="item.kind === 'objective'" class="flat-item-copy">
                        <div><span class="node-type-label is-objective">目标</span><span class="flat-item-code">{{ item.objective.code }}</span></div>
                        <strong>{{ item.objective.title }}</strong>
                        <small>负责人 {{ item.objective.owner }} · 截止 {{ item.objective.dueDate || stage.plannedEnd }}</small>
                      </div>
                      <div v-else class="flat-item-copy">
                        <div><span class="node-type-label" :class="item.kind === 'deliverable' ? 'is-deliverable' : 'is-metric'">{{ item.kind === 'deliverable' ? '成果物' : '量化指标' }}</span><span class="flat-item-parent">阶段直属事项</span></div>
                        <strong>{{ item.kind === 'deliverable' ? item.kr.artifact || item.kr.title : item.kr.title }}</strong>
                        <small>负责人 {{ item.kr.owner }} · 截止 {{ shortDate(item.kr.dueDate) }}<template v-if="item.kind === 'metric'"> · 当前 {{ item.kr.actual }}{{ item.kr.unit }} / 目标 {{ item.kr.target }}{{ item.kr.unit }}</template></small>
                      </div>
                      <div class="flat-item-progress">
                        <template v-if="item.kind === 'objective'">
                          <b>{{ item.objective.progress }}%</b>
                          <Progress :percent="item.objective.progress" :show-info="false" stroke-color="#159477" />
                        </template>
                        <template v-else>
                          <b>{{ krStatusLabel(item.kr) }}</b>
                          <Progress :percent="krProgress(item.kr)" :show-info="false" :stroke-color="['at-risk', 'missing'].includes(item.kr.status) ? '#e45b52' : '#159477'" />
                        </template>
                      </div>
                      <div class="flat-item-actions">
                        <Button v-if="item.kind === 'objective' && !isManager" size="small" @click="openExecutorProgress(stage, item.objective)">更新进度</Button>
                        <Button v-if="item.kind === 'objective'" size="small" @click="showObjectiveDetail(stage, item.objective)">详情</Button>
                        <Upload v-else-if="!isManager && item.kind === 'deliverable'" :show-upload-list="false" :max-count="1" accept=".doc,.docx,.pdf,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.png,.jpg,.jpeg" :before-upload="(file) => uploadExecutorDeliverable(item.kr, file)"><Button size="small"><Icon icon="lucide:upload" />上传</Button></Upload>
                      </div>
                    </article>
                    <div v-if="stageFlatItems(stage).length === 0" class="empty-objectives">当前阶段还没有目标或成果物。</div>
                    <div v-if="isManager && isStageEditing(stage)" class="stage-flat-create">
                      <div v-if="addingObjectiveStageId === stage.id" class="flat-create-form">
                        <span class="node-type-label is-objective">目标</span>
                        <Input v-model:value="inlineObjectiveForm.title" autofocus placeholder="输入目标名称" />
                        <Select v-model:value="inlineObjectiveForm.owner" :options="memberOptions" aria-label="目标负责人" />
                        <Input v-model:value="inlineObjectiveForm.dueDate" type="date" aria-label="目标截止日期" />
                        <Button size="small" @click="cancelAddObjective">取消</Button>
                        <Button size="small" type="primary" @click="saveInlineObjective(stage)">保存</Button>
                      </div>
                      <div v-if="stageAddingKrObjective(stage)" class="flat-create-form">
                        <Select v-model:value="inlineKrForm.kind" :options="krKindOptions" aria-label="事项类型" />
                        <Input v-model:value="inlineKrForm.title" autofocus placeholder="输入成果物或指标名称" />
                        <Select v-model:value="inlineKrForm.owner" :options="memberOptions" aria-label="事项负责人" />
                        <Input v-model:value="inlineKrForm.dueDate" type="date" aria-label="事项截止日期" />
                        <Button size="small" @click="cancelAddKr">取消</Button>
                        <Button size="small" type="primary" @click="saveStageInlineKr(stage)">保存</Button>
                      </div>
                      <div v-if="addingObjectiveStageId !== stage.id && !stageAddingKrObjective(stage)" class="stage-flat-create-actions">
                        <Button size="small" @click="startAddObjective(stage)"><Icon icon="lucide:plus" />新增目标</Button>
                        <Button size="small" @click="startAddStageItem(stage)"><Icon icon="lucide:plus" />新增成果物/指标</Button>
                      </div>
                    </div>
                  </div>

                  <div v-if="false" class="objective-list">
                    <div
                      v-for="(objective, objectiveIndex) in stage.objectives"
                      :key="objective.id"
                      class="objective-branch"
                    >
                      <article
                        class="objective-row"
                        :class="{ 'is-editing': isStageEditing(stage) }"
                      >
                        <button
                          v-if="objectiveKrs(objective).length > 0"
                          type="button"
                          class="expand-button is-objective"
                          :aria-expanded="isObjectiveExpanded(objective)"
                          :aria-label="`${isObjectiveExpanded(objective) ? '收起' : '展开'}${objective.title}的 KR`"
                          @click="toggleObjective(objective)"
                        >
                          <Icon
                            :icon="
                              isObjectiveExpanded(objective)
                                ? 'lucide:square-minus'
                                : 'lucide:square-plus'
                            "
                          />
                        </button>
                        <span v-else class="tree-leaf-spacer">
                          <Icon icon="lucide:minus" />
                        </span>
                        <div
                          v-if="!isStageEditing(stage)"
                          class="objective-row-title"
                        >
                          <strong>
                            <span class="node-type-label is-objective">
                              目标{{ objectiveIndex + 1 }}
                            </span>
                            {{ objective.title }}
                          </strong>
                          <small>
                            负责人 {{ objective.owner }} · 截止
                            {{ objective.dueDate || stage.plannedEnd }} · 协作人
                            {{
                              objective.collaborators.length > 0
                                ? objective.collaborators.join('、')
                                : '暂无'
                            }}
                          </small>
                        </div>
                        <div v-else class="objective-edit-content">
                          <div class="node-name-editor">
                            <span class="node-type-label is-objective">
                              目标{{ objectiveIndex + 1 }}
                            </span>
                            <Input
                              v-model:value="objective.title"
                              aria-label="目标名称"
                            />
                          </div>
                          <Select
                            v-model:value="objective.owner"
                            :options="memberOptions"
                            aria-label="目标负责人"
                          />
                          <Select
                            v-model:value="objective.collaborators"
                            mode="multiple"
                            :max-tag-count="1"
                            :options="memberOptions"
                            aria-label="目标协作人"
                            placeholder="协作人"
                          />
                          <Input
                            v-model:value="objective.dueDate"
                            type="date"
                            aria-label="目标截止日期"
                          />
                        </div>
                        <template v-if="!isStageEditing(stage)">
                          <span class="objective-kr-count">
                            {{ objectiveKrs(objective).length }} 个 KR
                          </span>
                          <span
                            class="status-pill"
                            :class="`is-${objective.health}`"
                          >
                            {{ healthLabel(objective.health) }} ·
                            {{ objective.progress }}%
                          </span>
                        </template>
                        <div class="objective-row-actions">
                          <Button
                            v-if="!isManager"
                            size="small"
                            class="executor-progress-button"
                            @click="openExecutorProgress(stage, objective)"
                          >
                            <Icon icon="lucide:chart-no-axes-column-increasing" />
                            更新进度
                          </Button>
                          <Button
                            size="small"
                            @click="showObjectiveDetail(stage, objective)"
                          >
                            详情
                          </Button>
                        </div>
                      </article>

                      <div
                        v-if="isObjectiveExpanded(objective)"
                        class="tree-kr-list"
                      >
                        <article
                          v-for="kr in objectiveKrs(objective)"
                          :key="kr.id"
                          class="tree-kr-row"
                          :class="{
                            'is-editing': isStageEditing(stage),
                            'has-executor-action':
                              !isManager && kr.kind === 'deliverable',
                          }"
                        >
                          <div v-if="!isStageEditing(stage)">
                            <strong>
                              <span
                                class="node-type-label"
                                :class="
                                  kr.kind === 'deliverable'
                                    ? 'is-deliverable'
                                    : 'is-metric'
                                "
                              >
                                {{
                                  kr.kind === 'deliverable'
                                    ? '成果物 KR'
                                    : '指标 KR'
                                }}
                              </span>
                              {{
                                kr.kind === 'deliverable'
                                  ? kr.artifact || kr.title
                                  : kr.title
                              }}
                            </strong>
                            <small v-if="kr.kind === 'deliverable'">
                              {{ kr.title }}
                            </small>
                            <small v-else>
                              目标 {{ kr.target }}{{ kr.unit }} · 当前
                              {{ kr.actual }}{{ kr.unit }}
                            </small>
                          </div>
                          <div v-else class="kr-edit-content">
                            <div class="node-name-editor">
                              <span
                                class="node-type-label"
                                :class="
                                  kr.kind === 'deliverable'
                                    ? 'is-deliverable'
                                    : 'is-metric'
                                "
                              >
                                {{
                                  kr.kind === 'deliverable'
                                    ? '成果物 KR'
                                    : '指标 KR'
                                }}
                              </span>
                              <Input
                                :value="krName(kr)"
                                aria-label="KR 名称"
                                @update:value="updateKrName(kr, String($event))"
                              />
                            </div>
                            <Select
                              v-model:value="kr.owner"
                              :options="memberOptions"
                              aria-label="KR 负责人"
                            />
                            <Input
                              :value="krDateInputValue(kr, stage)"
                              type="date"
                              aria-label="KR 截止日期"
                              @update:value="
                                updateKrDueDate(kr, String($event))
                              "
                            />
                          </div>
                          <span v-if="!isStageEditing(stage)">
                            <Icon icon="lucide:user-round" />
                            {{ kr.owner }}
                          </span>
                          <span v-if="!isStageEditing(stage)">
                            <Icon icon="lucide:calendar-clock" />
                            {{ shortDate(kr.dueDate) }}
                          </span>
                          <span
                            class="status-pill"
                            :class="`is-${kr.status === 'accepted' ? 'healthy' : kr.status === 'pending' ? 'pending' : 'at-risk'}`"
                          >
                            {{ krStatusLabel(kr) }}
                          </span>
                          <div
                            v-if="!isManager && kr.kind === 'deliverable'"
                            class="executor-deliverable-action"
                          >
                            <small
                              v-if="executorUploadedFiles[kr.id]?.length"
                              :title="executorUploadedFiles[kr.id]?.at(-1)?.name"
                            >
                              已上传 {{ executorUploadedFiles[kr.id]?.length }} 个
                            </small>
                            <Upload
                              :show-upload-list="false"
                              :max-count="1"
                              accept=".doc,.docx,.pdf,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.png,.jpg,.jpeg"
                              :before-upload="
                                (file) => uploadExecutorDeliverable(kr, file)
                              "
                            >
                              <Button
                                size="small"
                                class="executor-upload-button"
                              >
                                <Icon icon="lucide:upload" />
                                上传
                              </Button>
                            </Upload>
                          </div>
                        </article>
                        <div
                        v-if="
                            isManager &&
                            isStageEditing(stage) &&
                            addingKrObjectiveId === objective.id
                          "
                          class="inline-create-row is-kr"
                        >
                          <Select
                            v-model:value="inlineKrForm.kind"
                            :options="krKindOptions"
                            aria-label="KR 类型"
                          />
                          <Input
                            v-model:value="inlineKrForm.title"
                            autofocus
                            placeholder="输入 KR 名称"
                          />
                          <Select
                            v-model:value="inlineKrForm.owner"
                            :options="memberOptions"
                            aria-label="KR 负责人"
                          />
                          <Input
                            v-model:value="inlineKrForm.dueDate"
                            type="date"
                            aria-label="KR 截止日期"
                          />
                          <div>
                            <Button size="small" @click="cancelAddKr">
                              取消
                            </Button>
                            <Button
                              size="small"
                              class="light-primary-action"
                              @click="saveInlineKr(objective)"
                            >
                              保存
                            </Button>
                          </div>
                        </div>
                        <button
                          v-else-if="isManager && isStageEditing(stage)"
                          type="button"
                          class="inline-add-trigger is-kr"
                          @click="startAddKr(stage, objective)"
                        >
                          <Icon icon="lucide:plus" />
                          新增 KR
                        </button>
                      </div>
                    </div>
                    <div
                      v-if="
                        isManager &&
                        isStageEditing(stage) &&
                        addingObjectiveStageId === stage.id
                      "
                      class="inline-create-row is-objective"
                    >
                      <span class="node-type-label is-objective">目标</span>
                      <Input
                        v-model:value="inlineObjectiveForm.title"
                        autofocus
                        placeholder="输入目标名称"
                      />
                      <Select
                        v-model:value="inlineObjectiveForm.owner"
                        :options="memberOptions"
                        aria-label="目标负责人"
                      />
                      <Input
                        v-model:value="inlineObjectiveForm.dueDate"
                        type="date"
                        aria-label="目标截止日期"
                      />
                      <div>
                        <Button size="small" @click="cancelAddObjective">
                          取消
                        </Button>
                        <Button
                          size="small"
                          class="light-primary-action"
                          @click="saveInlineObjective(stage)"
                        >
                          保存
                        </Button>
                      </div>
                    </div>
                    <button
                      v-else-if="isManager && isStageEditing(stage)"
                      type="button"
                      class="inline-add-trigger is-objective"
                      @click="startAddObjective(stage)"
                    >
                      <Icon icon="lucide:plus" />
                      新增目标
                    </button>
                    <div
                      v-if="
                        stage.objectives.length === 0 && !isStageEditing(stage)
                      "
                      class="empty-objectives"
                    >
                      当前阶段还没有目标，可以点击“新增目标”补充。
                    </div>
                  </div>
                </article>
              </section>
            </div>
          </section>
          <section v-else-if="structureProjectDetailOpen" class="structure-detail-empty">
            <Empty
              :description="
                projectDirectoryTab === 'archived'
                  ? '暂无归档项目'
                  : '没有符合条件的项目'
              "
            />
          </section>

          <aside
            v-if="structureProjectDetailOpen && activeStructureProject"
            class="project-ai-guide-panel"
          >
            <header class="project-ai-guide-header">
              <span class="ai-guide-mark"><Icon icon="lucide:sparkles" /></span>
              <div>
                <small>AI COPILOT</small>
                <h2>下一步建议</h2>
                <p>基于当前项目阶段选择合适的数字员工。</p>
              </div>
            </header>

            <div class="project-ai-insight">
              <span><Icon icon="lucide:lightbulb" />AI 建议</span>
              <strong>
                当前处于“{{ currentStage(activeStructureProject)?.name || activeStructureProject.stage }}”，建议先明确本周会议决策，再拆解负责人任务。
              </strong>
            </div>

            <div class="project-ai-employee-list">
              <article
                v-for="employee in projectAiGuides"
                :key="employee.employeeId"
                class="project-ai-employee-card"
              >
                <button
                  type="button"
                  class="project-ai-employee-main"
                  @click="openLinkedProjectEmployee(activeStructureProject, employee.employeeId)"
                >
                  <img :src="employee.avatar" :alt="employee.name" />
                  <span>
                    <strong>{{ employee.name }}</strong>
                    <small>{{ employee.specialty }}</small>
                  </span>
                  <Icon icon="lucide:arrow-up-right" />
                </button>
                <button
                  type="button"
                  class="project-ai-example"
                  @click="
                    openLinkedProjectEmployee(
                      activeStructureProject,
                      employee.employeeId,
                      employee.example,
                    )
                  "
                >
                  <Icon :icon="employee.icon" />
                  <span>{{ employee.example }}</span>
                  <Icon icon="lucide:chevron-right" />
                </button>
              </article>
            </div>

            <div class="project-ai-context-note">
              <Icon icon="lucide:paperclip" />
              点击后会自动带入项目、当前阶段、进度、目标与成果物上下文。
            </div>
          </aside>
        </div>

        <Empty v-else description="没有符合条件的项目" />
      </section>
    </section>

    <Drawer
      v-model:open="detailOpen"
      width="620px"
      placement="right"
      :title="detailNode?.kind === 'stage' ? '阶段详情' : '目标详情'"
      root-class-name="project-light-drawer"
    >
      <section v-if="detailNode" class="node-detail">
        <template v-if="detailNode.kind === 'stage'">
          <header>
            <span class="stage-code">{{ detailNode.stage.code }}</span>
            <div>
              <h3>{{ detailNode.stage.name }}</h3>
              <p>{{ detailNode.stage.description }}</p>
            </div>
            <span class="status-pill" :class="`is-${detailNode.stage.health}`">
              {{ stageStatusLabel(detailNode.stage.status) }} ·
              {{ detailNode.stage.progress }}%
            </span>
          </header>
          <div class="detail-grid">
            <article>
              <span>阶段负责人</span>
              <strong>{{ detailNode.stage.owner }}</strong>
            </article>
            <article>
              <span>计划时间</span>
              <strong>
                {{ detailNode.stage.plannedStart }} 至
                {{ detailNode.stage.plannedEnd }}
              </strong>
            </article>
            <article>
              <span>前置依赖</span>
              <strong>
                {{
                  detailNode.stage.dependsOn.length > 0
                    ? `${detailNode.stage.dependsOn.length} 个阶段`
                    : '无'
                }}
              </strong>
            </article>
            <article>
              <span>目标与 KR</span>
              <strong>
                {{ detailNode.stage.objectives.length }} O ·
                {{ countStageKrs(detailNode.stage) }} KR
              </strong>
            </article>
          </div>
          <div class="detail-rules">
            <p>
              <b>进入条件</b>
              {{ detailNode.stage.entryCriteria }}
            </p>
            <p>
              <b>完成门禁</b>
              {{ detailNode.stage.exitCriteria }}
            </p>
          </div>
        </template>

        <template v-else>
          <header>
            <span class="objective-code">{{ detailNode.objective.code }}</span>
            <div>
              <h3>{{ detailNode.objective.title }}</h3>
              <p>{{ detailNode.objective.description }}</p>
            </div>
            <span
              class="status-pill"
              :class="`is-${detailNode.objective.health}`"
            >
              {{ healthLabel(detailNode.objective.health) }} ·
              {{ detailNode.objective.progress }}%
            </span>
          </header>
          <div class="detail-grid">
            <article>
              <span>所属阶段</span>
              <strong>{{ detailNode.stage.name }}</strong>
            </article>
            <article>
              <span>负责人</span>
              <strong>{{ detailNode.objective.owner }}</strong>
            </article>
            <article>
              <span>协作人</span>
              <strong>
                {{
                  detailNode.objective.collaborators.length > 0
                    ? detailNode.objective.collaborators.join('、')
                    : '暂无'
                }}
              </strong>
            </article>
            <article>
              <span>关键结果</span>
              <strong>{{ detailNode.objective.krs.length }} 个 KR</strong>
            </article>
          </div>
          <div class="detail-kr-list">
            <article v-for="kr in detailNode.objective.krs" :key="kr.id">
              <Icon
                :icon="
                  kr.kind === 'deliverable'
                    ? 'lucide:file-check-2'
                    : 'lucide:gauge'
                "
              />
              <div>
                <strong>{{ kr.title }}</strong>
                <small>
                  {{ kr.kind === 'deliverable' ? '成果物型' : '指标型' }} ·
                  {{ kr.owner }} · {{ kr.dueDate }}
                </small>
              </div>
              <span>{{ krStatusLabel(kr) }} · {{ krProgress(kr) }}%</span>
            </article>
            <p
              v-if="detailNode.objective.krs.length === 0"
              class="empty-objectives"
            >
              该目标暂未配置 KR。
            </p>
          </div>
        </template>
      </section>
    </Drawer>

    <!-- 阶段全局管控大抽屉 (940px) -->
    <Drawer
      v-model:open="stageDrawerOpen"
      width="940px"
      placement="right"
      root-class-name="stage-mgmt-drawer"
      :closable="false"
    >
      <div v-if="activeManagedStage" class="stage-mgmt-panel">
        <!-- 抽屉顶部头部 -->
        <header class="stage-mgmt-head">
          <div class="stage-mgmt-head-info">
            <div class="stage-head-badges">
              <span class="stage-mgmt-code">{{ activeManagedStage.code }}</span>
              <span class="stage-lifecycle-label">
                <Icon
                  :icon="
                    isStageActive(activeManagedStage)
                      ? 'lucide:play-circle'
                      : activeManagedStage.status === 'completed'
                        ? 'lucide:check-circle-2'
                        : 'lucide:clock'
                  "
                />
                {{
                  isStageActive(activeManagedStage)
                    ? '当前执行阶段'
                    : activeManagedStage.status === 'completed'
                      ? '已结项阶段'
                      : '待启动阶段'
                }}
              </span>
              <span
                class="status-pill"
                :class="`is-${activeManagedStage.health}`"
              >
                {{ stageStatusLabel(activeManagedStage.status) }} ·
                {{ healthLabel(activeManagedStage.health) }}
              </span>
              <span class="stage-period-text">
                <Icon icon="lucide:calendar" />
                {{ activeManagedStage.plannedStart }} 至
                {{ activeManagedStage.plannedEnd }}
              </span>
              <span class="stage-owner-chip">
                <Icon icon="lucide:user" />
                负责人：{{ activeManagedStage.owner }}
              </span>
            </div>
            <h2>{{ activeManagedStage.name }}</h2>
            <p>{{ activeManagedStage.description }}</p>
          </div>
          <Button
            type="text"
            shape="circle"
            aria-label="关闭抽屉"
            @click="stageDrawerOpen = false"
          >
            <Icon icon="lucide:x" />
          </Button>
        </header>

        <!-- 抽屉主体：左侧简版菜单 + 右侧主内容区 -->
        <div class="stage-mgmt-split-layout">
          <!-- 左侧简版菜单 -->
          <aside class="stage-mgmt-sidebar-menu">
            <button
              type="button"
              class="sidebar-menu-btn"
              :class="{ 'is-active': stageDrawerActiveTab === 'overview' }"
              @click="stageDrawerActiveTab = 'overview'"
            >
              <span class="menu-icon">
                <Icon icon="lucide:layout-dashboard" />
              </span>
              <div class="menu-texts">
                <strong>阶段概述</strong>
                <small>门禁与流转控制</small>
              </div>
            </button>

            <button
              type="button"
              class="sidebar-menu-btn"
              :class="{ 'is-active': stageDrawerActiveTab === 'execution' }"
              @click="stageDrawerActiveTab = 'execution'"
            >
              <span class="menu-icon"><Icon icon="lucide:target" /></span>
              <div class="menu-texts">
                <strong>目标与成果物</strong>
                <small>更新进度与上传成果</small>
              </div>
              <span class="menu-count-pill">{{ activeManagedStage.objectives.length }}</span>
            </button>

            <button
              type="button"
              class="sidebar-menu-btn is-ai-btn"
              :class="{ 'is-active': stageDrawerActiveTab === 'ai' }"
              @click="stageDrawerActiveTab = 'ai'"
            >
              <span class="menu-icon"><Icon icon="lucide:sparkles" /></span>
              <div class="menu-texts">
                <strong>AI 建议</strong>
                <small>卡点推演与预案</small>
              </div>
              <span
                v-if="
                  ['at-risk', 'blocked'].includes(activeManagedStage.health)
                "
                class="menu-alert-pill"
              >
                !
              </span>
            </button>
          </aside>

          <!-- 右侧主内容区 -->
          <div class="stage-mgmt-main-content">
            <!-- 1. 概述与门禁流转 -->
            <section
              v-if="stageDrawerActiveTab === 'overview'"
              class="tab-pane tab-overview"
            >
              <!-- 阶段进度与核心摘要条 -->
              <div class="overview-metric-strip">
                <div class="overview-metric-item">
                  <small>阶段整体达成率</small>
                  <div class="metric-progress-box">
                    <strong>{{ activeManagedStage.progress }}%</strong>
                    <Progress
                      :percent="activeManagedStage.progress"
                      :show-info="false"
                      :stroke-color="
                        activeManagedStage.health === 'blocked'
                          ? '#ef4444'
                          : activeManagedStage.health === 'at-risk'
                            ? '#f59e0b'
                            : '#10b981'
                      "
                    />
                  </div>
                </div>
                <div class="overview-metric-item">
                  <small>阶段负责人</small>
                  <div class="metric-text-val">
                    <Icon icon="lucide:user" />
                    <strong>{{ activeManagedStage.owner }}</strong>
                  </div>
                </div>
                <div class="overview-metric-item">
                  <small>所属业务模块目标</small>
                  <div class="metric-text-val">
                    <strong>
                      {{ activeManagedStage.objectives.length }} 业务模块 ·
                      {{ countStageKrs(activeManagedStage) }} 项 KR
                    </strong>
                  </div>
                </div>
                <div class="overview-metric-item">
                  <small>准入与准出门禁</small>
                  <div class="metric-text-val metric-counts">
                    <span>
                      {{ (activeManagedStage.entryGates || []).length }} 项准入
                    </span>
                    <span>
                      {{ (activeManagedStage.exitGates || []).length }} 项准出
                    </span>
                  </div>
                </div>
              </div>

              <!-- 阶段流转控制台 -->
              <div class="stage-transition-console">
                <header class="console-head">
                  <div>
                    <h4>
                      <Icon icon="lucide:arrow-right-circle" />
                      {{
                        isManager
                          ? '阶段流转控制台 (Stage Gate Transition)'
                          : '阶段状态与门禁'
                      }}
                    </h4>
                    <p>
                      {{
                        isManager
                          ? '支持【设为当前执行阶段】、【一键门禁体检】、【正常验收推进】与【容缺特批流转】。'
                          : '阶段流转与门禁保持只读；目标状态、进度和成果物可在“目标与成果物”页签更新。'
                      }}
                    </p>
                  </div>
                  <Button
                    size="small"
                    class="light-ai-button"
                    @click="checkStageGates(activeManagedStage)"
                  >
                    <Icon icon="lucide:wand-sparkles" />
                    一键门禁体检
                  </Button>
                </header>

                <div class="console-actions-strip">
                  <div class="console-state-info">
                    <span class="state-label">当前流转状态：</span>
                    <span class="stage-state-line">
                      <Icon
                        :icon="
                          isStageActive(activeManagedStage)
                            ? 'lucide:play-circle'
                            : activeManagedStage.status === 'completed'
                              ? 'lucide:check-circle-2'
                              : 'lucide:clock'
                        "
                      />
                      {{
                        isStageActive(activeManagedStage)
                          ? '本阶段为项目当前进行中主阶段'
                          : activeManagedStage.status === 'completed'
                            ? '本阶段已结项'
                            : '本阶段待启动（未激活为当前主阶段）'
                      }}
                    </span>
                  </div>

                  <div v-if="isManager" class="console-btn-group">
                    <!-- 若非当前阶段，提供一键激活按钮 -->
                    <Button
                      v-if="!isStageActive(activeManagedStage)"
                      type="primary"
                      class="btn-activate-stage"
                      @click="switchToStage(activeManagedStage)"
                    >
                      <Icon icon="lucide:play-circle" />
                      设为项目当前主阶段
                    </Button>

                    <template v-else>
                      <Button
                        type="primary"
                        :disabled="activeManagedStage.status === 'completed'"
                        @click="advanceToNextStage(activeManagedStage)"
                      >
                        <Icon icon="lucide:badge-check" />
                        确认通过并推进至下一阶段
                      </Button>
                      <Button
                        danger
                        :disabled="activeManagedStage.status === 'completed'"
                        @click="concessionModalOpen = true"
                      >
                        <Icon icon="lucide:shield-alert" />
                        容缺特批流转
                      </Button>
                    </template>
                  </div>
                </div>
              </div>

              <!-- 准入条件清单 -->
              <div class="gate-block">
                <header class="gate-block-head">
                  <div>
                    <h4>
                      <Icon icon="lucide:log-in" class="gate-icon-entry" />
                      阶段准入条件清单 (Entry Gates)
                    </h4>
                    <p>进入本阶段前必须具备的前置条件、输入交付物或依赖环境</p>
                  </div>
                  <Tag color="blue">
                    {{
                      (activeManagedStage.entryGates || []).filter(
                        (g) => g.satisfied,
                      ).length
                    }}
                    / {{ (activeManagedStage.entryGates || []).length }} 已就绪
                  </Tag>
                </header>

                <div class="gate-items-grid">
                  <article
                    v-for="gate in activeManagedStage.entryGates || []"
                    :key="gate.id"
                    class="gate-card"
                    :class="{ 'is-satisfied': gate.satisfied }"
                  >
                    <div class="gate-card-left">
                      <span class="gate-status-icon">
                        <Icon
                          :icon="
                            gate.satisfied
                              ? 'lucide:check-circle-2'
                              : 'lucide:clock'
                          "
                        />
                      </span>
                      <div class="gate-card-content">
                        <div class="gate-card-top">
                          <span class="gate-type-label">
                            {{
                              gate.type === 'deliverable'
                                ? '前置交付物'
                                : gate.type === 'approval'
                                  ? '审批授权'
                                  : '环境就绪'
                            }}
                          </span>
                          <strong>{{ gate.name }}</strong>
                        </div>
                        <p v-if="gate.note">{{ gate.note }}</p>
                      </div>
                    </div>
                    <Tag :color="gate.satisfied ? 'green' : 'orange'">
                      {{ gate.satisfied ? '准入满足' : '前置阻塞' }}
                    </Tag>
                  </article>
                </div>
              </div>

              <!-- 准出门禁核验清单 -->
              <div class="gate-block">
                <header class="gate-block-head">
                  <div>
                    <h4>
                      <Icon icon="lucide:log-out" class="gate-icon-exit" />
                      阶段完成与准出门禁 (Exit Gates / Stage-Gate)
                    </h4>
                    <p>
                      阶段结项并推进至下一阶段前必须 100%
                      闭环的交付成果物与验收指标
                    </p>
                  </div>
                  <Tag
                    :color="
                      (activeManagedStage.exitGates || []).every(
                        (g) => g.satisfied,
                      )
                        ? 'green'
                        : 'red'
                    "
                  >
                    {{
                      (activeManagedStage.exitGates || []).filter(
                        (g) => g.satisfied,
                      ).length
                    }}
                    / {{ (activeManagedStage.exitGates || []).length }} 已满足
                  </Tag>
                </header>

                <div class="gate-items-grid">
                  <article
                    v-for="gate in activeManagedStage.exitGates || []"
                    :key="gate.id"
                    class="gate-card is-exit-card"
                    :class="{
                      'is-satisfied': gate.satisfied,
                      'is-blocked': !gate.satisfied,
                    }"
                  >
                    <div class="gate-card-left">
                      <span class="gate-status-icon">
                        <Icon
                          :icon="
                            gate.satisfied
                              ? 'lucide:check-circle-2'
                              : 'lucide:alert-circle'
                          "
                        />
                      </span>
                      <div class="gate-card-content">
                        <div class="gate-card-top">
                          <span class="gate-type-label">
                            {{
                              gate.type === 'deliverable'
                                ? '必备成果物'
                                : gate.type === 'metric'
                                  ? '硬性指标'
                                  : '验收准则'
                            }}
                          </span>
                          <strong>{{ gate.name }}</strong>
                        </div>
                        <div class="gate-metrics-compare">
                          <span>
                            要求标准：
                            <b>{{ gate.targetValue }}</b>
                          </span>
                          <span>
                            实际现状：
                            <b
                              :class="
                                gate.satisfied
                                  ? 'text-emerald-600'
                                  : 'text-rose-600'
                              "
                            >
                              {{ gate.actualValue }}
                            </b>
                          </span>
                        </div>
                        <p v-if="gate.description">{{ gate.description }}</p>
                      </div>
                    </div>
                    <Tag :color="gate.satisfied ? 'green' : 'red'">
                      {{ gate.satisfied ? '门禁达成' : '门禁阻塞' }}
                    </Tag>
                  </article>
                </div>
              </div>

              <!-- 阶段流转审计记录 -->
              <div class="transition-history-section">
                <header class="history-head">
                  <h5>
                    <Icon icon="lucide:history" />
                    阶段审批与流转留痕 ({{
                      (activeManagedStage.transitionHistory || []).length
                    }})
                  </h5>
                </header>
                <div
                  v-if="(activeManagedStage.transitionHistory || []).length > 0"
                  class="history-list"
                >
                  <article
                    v-for="(rec, rIdx) in activeManagedStage.transitionHistory"
                    :key="rIdx"
                    class="history-item"
                  >
                    <div class="history-meta">
                      <Tag
                        :color="rec.action === 'advance' ? 'green' : 'orange'"
                      >
                        {{ rec.actionLabel }}
                      </Tag>
                      <span class="history-time">{{ rec.time }}</span>
                      <span class="history-op">操作人：{{ rec.operator }}</span>
                    </div>
                    <div class="history-flow-text">
                      <span>{{ rec.fromStage }}</span>
                      <Icon icon="lucide:arrow-right" />
                      <strong>{{ rec.toStage }}</strong>
                    </div>
                    <p class="history-reason">{{ rec.reason }}</p>
                  </article>
                </div>
                <Empty
                  v-else
                  description="本阶段尚无推进流转留痕记录"
                  :image-style="{ height: '40px' }"
                />
              </div>
            </section>

            <!-- 2. 目标进度与成果物执行 -->
            <section
              v-else-if="stageDrawerActiveTab === 'execution'"
              class="tab-pane stage-execution-tab"
            >
              <header class="execution-tab-head">
                <div>
                  <span><Icon icon="lucide:circle-user-round" /></span>
                  <div>
                    <h3>阶段目标与成果物</h3>
                    <p>{{ isManager ? '交付项目助理可在阶段详情中代为更新目标进度并补充成果物。' : '普通用户可更新自己负责目标的状态、进度，并上传成果物证据。' }}</p>
                  </div>
                </div>
                <Tag color="blue">{{ activeManagedStage.objectives.length }} 个目标 · {{ stageFlatItems(activeManagedStage).filter((item) => item.kind === 'deliverable').length }} 项成果物</Tag>
              </header>

              <div class="execution-flat-list">
                <article v-for="item in stageFlatItems(activeManagedStage)" :key="item.id" class="execution-flat-item" :class="`is-${item.kind}`">
                  <span class="execution-flat-icon"><Icon :icon="item.kind === 'objective' ? 'lucide:target' : item.kind === 'deliverable' ? 'lucide:file-check-2' : 'lucide:gauge'" /></span>
                  <div v-if="item.kind === 'objective'" class="execution-flat-copy"><div><Tag color="green">目标</Tag><span>{{ item.objective.code }}</span></div><strong>{{ item.objective.title }}</strong><small>负责人 {{ item.objective.owner }} · 截止 {{ item.objective.dueDate || activeManagedStage.plannedEnd }}</small></div>
                  <div v-else class="execution-flat-copy"><div><Tag :color="item.kind === 'deliverable' ? 'purple' : 'orange'">{{ item.kind === 'deliverable' ? '成果物' : '量化指标' }}</Tag><span>阶段直属事项</span></div><strong>{{ item.kind === 'deliverable' ? item.kr.artifact || item.kr.title : item.kr.title }}</strong><small>负责人 {{ item.kr.owner }} · 截止 {{ item.kr.dueDate || '未设置截止日期' }}</small><p v-if="item.kr.weeklyEvidence"><Icon icon="lucide:paperclip" />当前证据：{{ item.kr.weeklyEvidence }}</p></div>
                  <div class="execution-flat-state"><template v-if="item.kind === 'objective'"><Tag :color="item.objective.progress === 100 ? 'green' : item.objective.health === 'at-risk' || item.objective.health === 'blocked' ? 'red' : item.objective.health === 'watch' ? 'orange' : 'blue'">{{ item.objective.progress === 100 ? '已完成' : healthLabel(item.objective.health) }}</Tag><strong>{{ item.objective.progress }}%</strong></template><template v-else><Tag :color="item.kr.status === 'accepted' ? 'green' : item.kr.status === 'at-risk' || item.kr.status === 'missing' ? 'orange' : 'blue'">{{ krStatusLabel(item.kr) }}</Tag><strong v-if="item.kind === 'metric'">{{ item.kr.actual ?? '—' }} / {{ item.kr.target ?? '—' }} {{ item.kr.unit }}</strong></template></div>
                  <div class="execution-flat-actions"><Button v-if="item.kind === 'objective'" type="primary" size="small" @click="openExecutorProgress(activeManagedStage, item.objective)"><Icon icon="lucide:chart-no-axes-column-increasing" />更新进度</Button><Upload v-else-if="item.kind === 'deliverable'" :show-upload-list="false" :max-count="1" accept=".doc,.docx,.pdf,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.png,.jpg,.jpeg" :before-upload="(file) => uploadExecutorDeliverable(item.kr, file)"><Button size="small"><Icon icon="lucide:upload" />上传成果物</Button></Upload></div>
                </article>
                <Empty v-if="!stageFlatItems(activeManagedStage).length" description="本阶段暂未配置目标或成果物" />
              </div>
            </section>

            <!-- 3. AI 建议 (深度归因、链式推演与应对预案) -->
            <section
              v-else-if="stageDrawerActiveTab === 'ai'"
              class="tab-pane tab-ai"
            >
              <div v-if="activeStageDiagnosis" class="ai-tab-content-reborn">
                <!-- 1. 卡点深度归因：左右对照高质感卡片 -->
                <section class="ai-glass-card attribution-reborn">
                  <header class="ai-card-banner is-danger">
                    <div class="flex items-center gap-2.5">
                      <span class="ai-banner-icon is-red">
                        <Icon icon="lucide:shield-alert" />
                      </span>
                      <div>
                        <h4 class="ai-banner-title">卡点深度归因诊断</h4>
                        <small class="ai-banner-subtitle">
                          融合《交付管理制度》门禁标准与现场执行数据比对深度穿透
                        </small>
                      </div>
                    </div>
                    <Tag
                      :color="
                        ['at-risk', 'blocked'].includes(
                          activeStageDiagnosis.stageHealth,
                        )
                          ? 'error'
                          : 'success'
                      "
                      class="滞后标签"
                    >
                      <Icon icon="lucide:clock" />
                      {{
                        ['at-risk', 'blocked'].includes(
                          activeStageDiagnosis.stageHealth,
                        )
                          ? '已延期一次 · 再次延期将上报总经理'
                          : '按计划推进 · 暂无延期记录'
                      }}
                    </Tag>
                  </header>

                  <!-- 受阻目标通栏条 -->
                  <div class="blocked-objective-strip">
                    <div class="strip-left">
                      <span class="strip-tag">受阻主目标</span>
                      <strong class="strip-obj-title">
                        {{ activeStageDiagnosis.blockedObjective.code }} ·
                        {{ activeStageDiagnosis.blockedObjective.title }}
                      </strong>
                    </div>
                    <div class="strip-right">
                      <span class="text-xs text-slate-500">
                        当前阶段达成度：
                      </span>
                      <strong class="text-sm text-amber-600">
                        {{ activeStageDiagnosis.blockedObjective.progress }}%
                      </strong>
                      <Progress
                        :percent="
                          activeStageDiagnosis.blockedObjective.progress
                        "
                        :size="[120, 8]"
                        stroke-color="#f59e0b"
                        :show-info="false"
                      />
                    </div>
                  </div>

                  <!-- 制度底线 VS 现场实况 左右对比分栏 -->
                  <div class="attribution-split-grid">
                    <!-- 左栏：制度退出门禁标准 -->
                    <div class="split-card is-rule">
                      <div class="split-card-head text-emerald-800">
                        <Icon icon="lucide:book-open-check" />
                        <h5>制度退出门禁标准 (治理底线要求)</h5>
                      </div>
                      <div class="split-rule-content">
                        <p class="rule-statement">
                          {{ activeStageDiagnosis.rootCause.templateRule }}
                        </p>
                        <div class="rule-meta-tags">
                          <span class="rule-meta-pill">
                            <Icon icon="lucide:clock-4" />
                            限期整改时限: 3 个工作日
                          </span>
                          <span class="rule-meta-pill">
                            <Icon icon="lucide:badge-alert" />
                            容缺特批人: 交付总监 / PMO
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- 右栏：现场卡点与根因事实 -->
                    <div class="split-card is-blocker">
                      <div class="split-card-head text-rose-800">
                        <Icon icon="lucide:alert-circle" />
                        <h5>现场卡点与根因事实 (执行阻碍)</h5>
                      </div>
                      <div class="split-blocker-content">
                        <div class="blocker-deliverable-bar">
                          <div class="flex items-center gap-1.5">
                            <span class="text-xs font-semibold text-slate-600">
                              卡点成果物:
                            </span>
                            <strong class="text-xs text-slate-800">
                              《{{
                                activeStageDiagnosis.rootCause.deliverableName
                              }}》
                            </strong>
                          </div>
                          <Tag color="orange">
                            {{
                              activeStageDiagnosis.rootCause.deliverableStatus
                            }}
                          </Tag>
                        </div>
                        <p class="blocker-reason-text">
                          {{ activeStageDiagnosis.rootCause.blockerReason }}
                        </p>
                        <div class="blocker-footer-info">
                          <span>
                            责任人:
                            <strong>
                              {{
                                activeStageDiagnosis.rootCause.deliverableOwner
                              }}
                            </strong>
                          </span>
                          <span>
                            原定截止:
                            {{
                              activeStageDiagnosis.rootCause.deliverableDueDate
                            }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <!-- 2. 链式影响推演：一体化时序传导泳道卡片 -->
                <section class="ai-glass-card chain-impact-reborn">
                  <header class="ai-card-banner is-orange">
                    <div class="flex items-center gap-2.5">
                      <span class="ai-banner-icon is-orange">
                        <Icon icon="lucide:git-pull-request" />
                      </span>
                      <div>
                        <h4 class="ai-banner-title">链式影响推演</h4>
                        <small class="ai-banner-subtitle">
                          测算当前滞后对下游关键里程碑、客户交付期与按期概率的连锁传导
                        </small>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-xs text-slate-500">按期达成概率：</span>
                      <span class="prob-chip">
                        <s class="mr-1 font-normal text-slate-400">
                          {{
                            activeStageDiagnosis.chainImpact.probabilityBefore
                          }}%
                        </s>
                        <strong class="text-sm font-bold text-rose-600">
                          {{
                            activeStageDiagnosis.chainImpact.probabilityAfter
                          }}%
                        </strong>
                      </span>
                    </div>
                  </header>

                  <!-- 传导时序泳道图 -->
                  <div class="chain-pipeline-steps">
                    <!-- 节点 1 -->
                    <div class="pipeline-node is-current">
                      <div class="node-step-badge">01</div>
                      <div class="node-body">
                        <span class="node-title">
                          {{ activeStageDiagnosis.stageName }}
                        </span>
                        <strong class="node-state text-amber-700">
                          当前滞后 +{{ activeStageDiagnosis.delayedDays }} 天
                        </strong>
                        <small>核心接口未通过测试</small>
                      </div>
                    </div>

                    <div class="pipeline-connector">
                      <Icon icon="lucide:chevron-right" />
                    </div>

                    <!-- 节点 2 -->
                    <div class="pipeline-node is-downstream">
                      <div class="node-step-badge">02</div>
                      <div class="node-body">
                        <span class="node-title">
                          {{
                            activeStageDiagnosis.chainImpact.downstreamStageName
                          }}
                        </span>
                        <strong class="node-state text-slate-700">
                          下游启动被阻断
                        </strong>
                        <small>
                          原定
                          {{
                            activeStageDiagnosis.chainImpact.downstreamStartDate
                          }}
                          无法进场
                        </small>
                      </div>
                    </div>

                    <div class="pipeline-connector">
                      <Icon icon="lucide:chevron-right" />
                    </div>

                    <!-- 节点 3 -->
                    <div class="pipeline-node is-final">
                      <div class="node-step-badge">03</div>
                      <div class="node-body">
                        <span class="node-title">项目最终客户交付</span>
                        <strong class="node-state text-rose-700">
                          整体顺延 +{{
                            activeStageDiagnosis.chainImpact.projectDelayDays
                          }}
                          天
                        </strong>
                        <small>
                          {{ activeStageDiagnosis.chainImpact.originalDueDate }}
                          ➔
                          {{ activeStageDiagnosis.chainImpact.revisedDueDate }}
                        </small>
                      </div>
                    </div>
                  </div>

                  <div class="chain-narrative-box">
                    <Icon icon="lucide:arrow-right-left" />
                    <p>
                      {{ activeStageDiagnosis.chainImpact.impactDescription }}
                    </p>
                  </div>
                </section>

                <!-- 3. 可执行应对预案：三张高级策略卡片与一键采纳预案 -->
                <section class="ai-glass-card strategies-reborn">
                  <header class="ai-card-banner is-blue">
                    <div class="flex items-center gap-2.5">
                      <span class="ai-banner-icon is-blue">
                        <Icon icon="lucide:compass" />
                      </span>
                      <div>
                        <h4 class="ai-banner-title">AI 建议的处置方案</h4>
                        <small class="ai-banner-subtitle">
                          先比较方案方向，再查看指导意见或展开行动草稿
                        </small>
                      </div>
                    </div>
                    <Tag color="processing">3 套预案均已完成推演</Tag>
                  </header>

                  <div class="strategy-cards-layout">
                    <article
                      v-for="(
                        strat, strategyIndex
                      ) in activeStageDiagnosis.strategies"
                      :key="strat.id"
                      class="strategy-reborn-card"
                    >
                      <div class="strategy-option-heading">
                        <div>
                          <small>
                            方案{{
                              strategyNumberLabels[strategyIndex] ||
                              strategyIndex + 1
                            }}
                          </small>
                          <h4>{{ strat.shortTitle }}</h4>
                        </div>
                      </div>

                      <div class="strategy-guidance">
                        <small>指导意见</small>
                        <strong>{{ strat.title }}</strong>
                        <p>{{ strat.description }}</p>
                      </div>

                      <div class="strat-indicators">
                        <div class="indicator-cell">
                          <small>执行成本/风险</small>
                          <strong
                            :class="
                              strat.riskLevel === 'high'
                                ? 'text-rose-600'
                                : strat.riskLevel === 'medium'
                                  ? 'text-amber-600'
                                  : 'text-emerald-600'
                            "
                          >
                            {{
                              strat.riskLevel === 'high'
                                ? '较高 (需外部协调)'
                                : strat.riskLevel === 'medium'
                                  ? '中等'
                                  : '低风险'
                            }}
                          </strong>
                        </div>
                        <div class="indicator-cell">
                          <small>协同对象</small>
                          <strong class="text-slate-700">
                            {{ strat.targetRole }}
                          </strong>
                        </div>
                      </div>

                      <details class="strat-draft-box">
                        <summary>
                          <span>
                            <Icon icon="lucide:file-text" />
                            查看行动草稿
                          </span>
                          <Icon icon="lucide:chevron-down" />
                        </summary>
                        <div class="draft-head">
                          <span>{{ strat.actionLabel }}</span>
                          <button
                            type="button"
                            class="btn-copy-draft"
                            :aria-label="`复制${strat.shortTitle}行动草稿`"
                            @click="
                              copyStrategyText(strat.id, strat.previewContent)
                            "
                          >
                            <Icon
                              :icon="
                                copiedStrategyId === strat.id
                                  ? 'lucide:check'
                                  : 'lucide:copy'
                              "
                            />
                            {{
                              copiedStrategyId === strat.id ? '已复制' : '复制'
                            }}
                          </button>
                        </div>
                        <div class="draft-content-scroll">
                          <pre>{{ strat.previewContent }}</pre>
                        </div>
                      </details>

                      <!-- 底部操作按钮：一键采纳应对预案 -->
                      <div class="strat-footer-action">
                        <div
                          v-if="
                            appliedStrategies[activeStageDiagnosis.stageId]
                              ?.strategyId === strat.id
                          "
                          class="strat-applied-pill"
                        >
                          <Icon icon="lucide:badge-check" />
                          <span>已采纳该预案 (刚刚)</span>
                        </div>
                        <Button
                          v-else-if="isManager"
                          type="primary"
                          block
                          class="btn-apply-strategy"
                          @click="
                            applyStrategy(activeStageDiagnosis.stageId, strat)
                          "
                        >
                          <Icon icon="lucide:check-circle-2" />
                          采纳“{{ strat.shortTitle }}”方案
                        </Button>
                      </div>
                    </article>
                  </div>
                </section>
              </div>
              <Empty v-else description="本阶段运行平稳，暂无卡点预警" />
            </section>
          </div>
        </div>

        <!-- 抽屉底部 -->
        <footer class="stage-mgmt-footer">
          <div class="footer-left-status">
            <span
              v-if="isStageActive(activeManagedStage)"
              class="status-active-label"
            >
              <span class="ping-dot"></span>
              当前项目主阶段：【{{ activeManagedStage.name }}】
            </span>
            <Button
              v-else-if="isManager"
              type="dashed"
              size="small"
              class="footer-activate-btn"
              @click="switchToStage(activeManagedStage)"
            >
              <Icon icon="lucide:arrow-right-left" />
              将项目主阶段激活切换为此阶段
            </Button>
          </div>
          <div class="footer-right-buttons">
            <Button @click="openAiConversation">
              <Icon icon="lucide:message-square-text" />
              在 AI 对话中深入探讨
            </Button>
            <Button type="primary" @click="stageDrawerOpen = false">
              完成审阅并关闭
            </Button>
          </div>
        </footer>
      </div>
    </Drawer>

    <Modal
      v-model:open="weeklyReportPreviewOpen"
      width="680px"
      title="周报详情"
      :footer="null"
      wrap-class-name="weekly-report-preview-modal"
    >
      <article v-if="selectedWeeklyReport" class="weekly-report-preview">
        <header class="weekly-report-preview-head">
          <span class="report-avatar" aria-hidden="true">
            {{ reportAvatarText(selectedWeeklyReport) }}
          </span>
          <div>
            <strong>
              {{
                selectedWeeklyReport.reporter ||
                selectedWeeklyReport.author ||
                '责任人'
              }}
            </strong>
            <h4>
              {{ selectedWeeklyReport.weekTitle || selectedWeeklyReport.title }}
            </h4>
            <small>
              {{ selectedWeeklyReport.weekRange || selectedWeeklyReport.cycle }}
              · 提交于
              {{
                selectedWeeklyReport.submitDate ||
                selectedWeeklyReport.submittedAt
              }}
            </small>
          </div>
        </header>

        <p class="weekly-report-preview-summary">
          {{ selectedWeeklyReport.summary }}
        </p>

        <div class="weekly-report-preview-progress">
          <span>阶段推进贡献</span>
          <Progress
            :percent="
              selectedWeeklyReport.stageProgress ||
              selectedWeeklyReport.progressRate
            "
            size="small"
          />
        </div>

        <section
          v-if="
            (
              selectedWeeklyReport.deliverables ||
              selectedWeeklyReport.deliverablesSubmitted ||
              []
            ).length > 0
          "
          class="weekly-report-preview-section"
        >
          <strong>本周成果物</strong>
          <div class="weekly-report-preview-files">
            <span
              v-for="item in selectedWeeklyReport.deliverables ||
              selectedWeeklyReport.deliverablesSubmitted"
              :key="item.id || item.name"
            >
              <Icon icon="lucide:file-text" />
              {{ item.name }}
            </span>
          </div>
        </section>

        <section
          v-if="(selectedWeeklyReport.blockers || []).length > 0"
          class="weekly-report-preview-section is-risk"
        >
          <strong>阻塞与外部依赖</strong>
          <p
            v-for="(item, index) in selectedWeeklyReport.blockers"
            :key="index"
          >
            <Icon icon="lucide:alert-triangle" />
            {{ item.text || item.issue }}
          </p>
        </section>
      </article>
    </Modal>

    <!-- 容缺特批流转审批弹窗 -->
    <Modal
      v-if="isManager"
      v-model:open="concessionModalOpen"
      title="阶段容缺特批流转审批"
      ok-text="确认特批并推进流转"
      cancel-text="取消"
      :ok-button-props="{ danger: true }"
      @ok="confirmConcessionAdvance"
    >
      <div class="concession-modal-content">
        <div class="concession-alert-note">
          <Icon icon="lucide:alert-triangle" />
          <div>
            <strong>注意：当前阶段仍有准出门禁未满足</strong>
            <p>
              执行容缺特批后，该阶段将被标记为已结项，下一阶段将以【需关注】状态启动，遗留卡点将作为高优先级任务并入下阶段继续监督闭环。
            </p>
          </div>
        </div>
        <label class="concession-field">
          <span>特批流转原因与审批批复 (必填)</span>
          <textarea
            v-model="concessionReason"
            rows="4"
            class="concession-textarea"
          ></textarea>
        </label>
      </div>
    </Modal>

    <!-- 项目详情侧滑宽抽屉：项目规划与宪章合并为一个连续页面 -->
    <Drawer
      v-model:open="projectDossierDrawerOpen"
      width="980px"
      placement="right"
      root-class-name="project-dossier-drawer"
      :closable="false"
    >
      <div v-if="activeStructureProject" class="project-dossier-panel">
        <!-- 抽屉顶部头部 -->
        <header class="project-dossier-head">
          <div class="project-dossier-head-info">
            <div class="dossier-head-badges">
              <span class="dossier-project-code">
                {{ activeStructureProject.code }}
              </span>
              <span
                class="status-pill"
                :class="`is-${activeStructureProject.health}`"
              >
                {{ healthLabel(activeStructureProject.health) }}
              </span>
              <Tag color="cyan">{{ activeStructureProject.typeLabel }}</Tag>
              <Tag color="green">
                {{ activeStructureProject.initiationStatusLabel }}
              </Tag>
              <span class="dossier-meta-item">
                <Icon icon="lucide:building-2" />
                客户：{{ activeStructureProject.customer }}
              </span>
              <span class="dossier-meta-item">
                <Icon icon="lucide:user" />
                项目经理：{{ activeStructureProject.manager }}
              </span>
              <span class="dossier-meta-item">
                <Icon icon="lucide:calendar" />
                {{ activeStructureProject.startDate }} 至
                {{ activeStructureProject.dueDate }}
              </span>
              <span class="dossier-meta-item">
                <Icon icon="lucide:flag" />
                当前主阶段：{{ activeStructureProject.stage }}
              </span>
            </div>
            <h2>{{ activeStructureProject.name }}</h2>
            <p>{{ activeStructureProject.summary }}</p>
          </div>
          <Button
            type="text"
            shape="circle"
            aria-label="关闭抽屉"
            @click="projectDossierDrawerOpen = false"
          >
            <Icon
              icon="lucide:x"
              class="size-5 text-slate-500 hover:text-slate-800"
            />
          </Button>
        </header>

        <!-- 抽屉主体：左侧菜单 + 右侧分区内容 -->
        <div class="project-dossier-split-layout">
          <aside class="project-dossier-sidebar-menu">
            <button
              type="button"
              class="sidebar-menu-btn"
              :class="{ 'is-active': projectDossierActiveTab === 'overview' }"
              @click="projectDossierActiveTab = 'overview'"
            >
              <span class="menu-icon">
                <Icon icon="lucide:layout-dashboard" />
              </span>
              <div class="menu-texts">
                <strong>项目概览</strong>
                <small>进度与阶段计划</small>
              </div>
            </button>
            <button
              type="button"
              class="sidebar-menu-btn"
              :class="{ 'is-active': projectDossierActiveTab === 'charter' }"
              @click="projectDossierActiveTab = 'charter'"
            >
              <span class="menu-icon">
                <Icon icon="lucide:file-badge-2" />
              </span>
              <div class="menu-texts">
                <strong>项目宪章</strong>
                <small>立项依据与治理</small>
              </div>
            </button>
            <button
              type="button"
              class="sidebar-menu-btn"
              :class="{
                'is-active': projectDossierActiveTab === 'deliverables',
              }"
              @click="projectDossierActiveTab = 'deliverables'"
            >
              <span class="menu-icon">
                <Icon icon="lucide:package-check" />
              </span>
              <div class="menu-texts">
                <strong>关联成果物</strong>
                <small>成果物与项目文件</small>
              </div>
              <span class="menu-badge">{{ projectDeliverableCount }}</span>
            </button>
            <button
              type="button"
              class="sidebar-menu-btn"
              :class="{ 'is-active': projectDossierActiveTab === 'reports' }"
              @click="projectDossierActiveTab = 'reports'"
            >
              <span class="menu-icon">
                <Icon icon="lucide:calendar-range" />
              </span>
              <div class="menu-texts">
                <strong>项目周报</strong>
                <small>跨阶段集中归档</small>
              </div>
              <span class="menu-badge">
                {{ filteredProjectWeeklyReportCount }}
              </span>
            </button>
            <button
              type="button"
              class="sidebar-menu-btn is-log-btn"
              :class="{ 'is-active': projectDossierActiveTab === 'logs' }"
              @click="projectDossierActiveTab = 'logs'"
            >
              <span class="menu-icon"><Icon icon="lucide:history" /></span>
              <div class="menu-texts">
                <strong>操作日志</strong>
                <small>立项、完成与变更</small>
              </div>
              <span class="menu-alert-pill">
                {{
                  projectOperationLogs.filter(
                    (item) => item.kind === 'change',
                  ).length
                }}
              </span>
            </button>
          </aside>

          <div class="project-dossier-main-content">
            <div
              v-if="projectDossierActiveTab === 'overview'"
              class="dossier-content-wrapper"
            >
              <!-- 基本规划与交付指标 -->
              <section class="dossier-section">
                <h5 class="section-title">
                  <Icon icon="lucide:layout-grid" class="text-emerald-700" />
                  基本规划与交付指标
                </h5>
                <div class="grid grid-cols-4 gap-3">
                  <div class="meta-field-card">
                    <small>交付总进度</small>
                    <div class="mt-1 flex items-center gap-2">
                      <Progress
                        :percent="activeStructureProject.progress"
                        size="small"
                        stroke-color="#0b806f"
                        style="flex: 1"
                      />
                      <b class="text-xs text-slate-800">
                        {{ activeStructureProject.progress }}%
                      </b>
                    </div>
                  </div>
                  <div class="meta-field-card">
                    <small>按期达成概率</small>
                    <div class="mt-1">
                      <strong
                        :class="
                          activeStructureProject.onTimeProbability < 50
                            ? 'text-rose-600'
                            : 'text-emerald-700'
                        "
                        class="text-sm"
                      >
                        {{ activeStructureProject.onTimeProbability }}%
                      </strong>
                    </div>
                  </div>
                  <div class="meta-field-card">
                    <small>项目基线状态</small>
                    <div class="mt-1">
                      <Tag color="green">
                        {{ activeStructureProject.initiationStatusLabel }}
                      </Tag>
                    </div>
                  </div>
                  <div class="meta-field-card">
                    <small>所属业务部门</small>
                    <div class="mt-1 text-xs font-medium text-slate-700">
                      {{
                        activeStructureProject.department || '智能制造交付部'
                      }}
                    </div>
                  </div>
                </div>
              </section>

              <!-- 商业目标与交付范围概述 -->
              <section class="dossier-section">
                <h5 class="section-title">
                  <Icon icon="lucide:target" class="text-blue-700" />
                  商业目标与交付范围概述
                </h5>
                <div
                  class="space-y-2 rounded-xl border border-slate-200 bg-white p-3.5 text-xs shadow-sm"
                >
                  <p class="m-0 font-medium leading-relaxed text-slate-800">
                    <span class="text-slate-500">交付边界概述：</span>
                    {{ activeStructureProject.summary }}
                  </p>
                  <p
                    v-if="activeStructureProject.charter?.sowSummary"
                    class="m-0 leading-relaxed text-slate-600"
                  >
                    <span class="text-slate-500">合同范围 (SOW)：</span>
                    {{ activeStructureProject.charter.sowSummary }}
                  </p>
                  <div
                    v-if="activeStructureProject.charter?.businessGoals"
                    class="flex flex-wrap gap-2 pt-1"
                  >
                    <Tag
                      v-for="goal in activeStructureProject.charter
                        .businessGoals"
                      :key="goal"
                      color="blue"
                    >
                      🎯 {{ goal }}
                    </Tag>
                  </div>
                </div>
              </section>

              <!-- 阶段全景规划与推进里程碑 -->
              <section class="dossier-section">
                <h5 class="section-title">
                  <Icon icon="lucide:git-commit" class="text-indigo-700" />
                  阶段全景规划与推进里程碑
                </h5>
                <div class="charter-table-wrapper">
                  <table class="charter-table">
                    <thead>
                      <tr>
                        <th style="width: 70px">阶段</th>
                        <th style="width: 140px">阶段名称</th>
                        <th style="width: 90px">负责人</th>
                        <th style="width: 180px">计划起止日期</th>
                        <th style="width: 90px">推进进度</th>
                        <th style="width: 90px">健康状态</th>
                        <th>核心准入门槛 / 成果要求</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="st in activeStructureProject.stages"
                        :key="st.id"
                      >
                        <td class="font-mono font-bold text-slate-700">
                          {{ st.code }}
                        </td>
                        <td class="font-semibold text-slate-800">
                          {{ st.name }}
                        </td>
                        <td>
                          <Tag color="cyan">{{ st.owner }}</Tag>
                        </td>
                        <td class="font-mono text-xs text-slate-600">
                          {{ st.plannedStart }} ~ {{ st.plannedEnd }}
                        </td>
                        <td>
                          <b
                            :class="
                              st.progress === 100
                                ? 'text-emerald-600'
                                : 'text-blue-600'
                            "
                          >
                            {{ st.progress }}%
                          </b>
                        </td>
                        <td>
                          <Tag
                            :color="
                              st.health === 'blocked'
                                ? 'red'
                                : st.health === 'at-risk'
                                  ? 'orange'
                                  : 'green'
                            "
                          >
                            {{ healthLabel(st.health) }}
                          </Tag>
                        </td>
                        <td
                          class="max-w-[240px] truncate text-xs text-slate-600"
                          :title="st.exitCriteria || st.entryCriteria"
                        >
                          {{ st.exitCriteria || st.entryCriteria }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <div
              v-else-if="projectDossierActiveTab === 'charter'"
              class="dossier-content-wrapper dossier-charter-section"
            >
              <div class="dossier-section-heading">
                <div>
                  <span>PROJECT CHARTER</span>
                  <h3>项目宪章与治理约定</h3>
                  <p>
                    立项依据、责任矩阵、成果物验收和例外处置统一归入项目详情。
                  </p>
                </div>
                <span class="dossier-effective-badge">
                  <Icon icon="lucide:badge-check" />
                  已签发生效
                </span>
              </div>
              <div
                v-if="activeStructureProject?.charter"
                class="charter-modal-paper"
              >
                <div
                  class="mb-4 flex items-start justify-between border-b border-slate-200 pb-4"
                >
                  <div>
                    <span
                      class="text-xs font-semibold tracking-wider text-emerald-700"
                    >
                      PROJECT CHARTER · 规范立项生效正本
                    </span>
                    <h3 class="m-0 mt-1 text-lg font-bold text-slate-800">
                      {{ activeStructureProject.charter.title }}
                    </h3>
                    <p class="m-0 mt-1 text-xs text-slate-500">
                      客户:
                      <strong>
                        {{ activeStructureProject.charter.customer }}
                      </strong>
                      · 项目经理:
                      <strong>
                        {{ activeStructureProject.charter.manager }}
                      </strong>
                      · 版本:
                      <strong>
                        {{ activeStructureProject.charter.version }}
                      </strong>
                    </p>
                  </div>
                </div>

                <div class="space-y-4">
                  <!-- 双重依据 -->
                  <div
                    class="space-y-1.5 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3.5 text-xs"
                  >
                    <p class="m-0 font-medium text-emerald-950">
                      <strong>外部商务合同：</strong>
                      {{ activeStructureProject.charter.contractRef }}
                    </p>
                    <p class="m-0 font-medium text-emerald-950">
                      <strong>内部管理制度：</strong>
                      {{ activeStructureProject.charter.governanceStandardRef }}
                    </p>
                    <p class="m-0 mt-1 text-slate-600">
                      {{ activeStructureProject.charter.scopeSummary }}
                    </p>
                  </div>

                  <!-- RACI 责任矩阵 -->
                  <div>
                    <h5
                      class="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-800"
                    >
                      <Icon icon="lucide:users" class="text-blue-600" />
                      RACI 责任矩阵
                    </h5>
                    <table class="charter-table">
                      <thead>
                        <tr>
                          <th style="width: 130px">角色</th>
                          <th style="width: 110px">责任人</th>
                          <th>职责范围</th>
                          <th style="width: 110px">RACI</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="raci in activeStructureProject.charter
                            .raciMatrix"
                          :key="raci.role"
                        >
                          <td class="font-medium text-slate-700">
                            {{ raci.role }}
                          </td>
                          <td>
                            <Tag color="cyan">{{ raci.owner }}</Tag>
                          </td>
                          <td class="text-xs text-slate-600">
                            {{ raci.responsibility }}
                          </td>
                          <td>
                            <Tag
                              :color="
                                raci.type === 'R'
                                  ? 'red'
                                  : raci.type === 'A'
                                    ? 'purple'
                                    : raci.type === 'C'
                                      ? 'blue'
                                      : 'default'
                              "
                            >
                              {{
                                raci.type === 'R'
                                  ? 'R 负责执行'
                                  : raci.type === 'A'
                                    ? 'A 最终问责'
                                    : raci.type === 'C'
                                      ? 'C 咨询协同'
                                      : 'I 知会备查'
                              }}
                            </Tag>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- 成果物前置格式标准 -->
                  <div>
                    <h5
                      class="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-800"
                    >
                      <Icon icon="lucide:file-check" class="text-indigo-600" />
                      成果物前置验收规范与凭证格式要求
                    </h5>
                    <table class="charter-table">
                      <thead>
                        <tr>
                          <th style="width: 160px">成果物名称</th>
                          <th style="width: 90px">归属阶段</th>
                          <th>前置格式规范 (杜绝模糊截图)</th>
                          <th style="width: 110px">验收人</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="del in activeStructureProject.charter
                            .deliverableStandards"
                          :key="del.name"
                        >
                          <td class="font-medium text-slate-800">
                            {{ del.name }}
                          </td>
                          <td>
                            <Tag color="blue">{{ del.stageCode }}</Tag>
                          </td>
                          <td class="text-xs font-medium text-rose-700">
                            {{ del.formatStandard }}
                          </td>
                          <td>
                            <Tag color="green">{{ del.approverRole }}</Tag>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- 异常与预算 -->
                  <div class="grid grid-cols-2 gap-3 pt-1">
                    <div
                      class="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs"
                    >
                      <strong class="mb-1 block text-amber-900">
                        例外处置与容缺机制:
                      </strong>
                      <p class="m-0 text-amber-800">
                        {{ activeStructureProject.charter.exceptionHandling }}
                      </p>
                    </div>
                    <div
                      class="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs"
                    >
                      <strong class="mb-1 block text-slate-800">
                        资源预算与变更控制:
                      </strong>
                      <p class="m-0 text-slate-600">
                        {{ activeStructureProject.charter.budgetSummary }}。{{
                          activeStructureProject.charter.changeControlRule
                        }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <Empty v-else description="该项目暂未录入项目宪章" />
            </div>

            <section
              v-else-if="projectDossierActiveTab === 'deliverables'"
              class="project-dossier-tab project-deliverables-tab"
            >
              <header class="project-tab-heading">
                <div>
                  <span>PROJECT DELIVERABLES</span>
                  <h3>关联成果物与项目文件</h3>
                  <p>
                    按阶段汇总成果物 KR，并追溯其在项目周报中提交的文件证据。
                  </p>
                </div>
                <span class="project-deliverable-summary">
                  <Icon icon="lucide:package-check" />
                  {{ projectDeliverableCount }} 项成果物
                </span>
              </header>

              <div class="project-deliverable-toolbar">
                <Input
                  v-model:value="projectDeliverableKeyword"
                  allow-clear
                  aria-label="搜索项目成果物"
                  placeholder="搜索成果物、目标、负责人或文件"
                >
                  <template #prefix><Icon icon="lucide:search" /></template>
                </Input>
                <Select
                  v-model:value="projectDeliverableFileFilter"
                  :options="projectDeliverableFileOptions"
                  aria-label="按文件关联状态筛选"
                />
              </div>

              <div
                v-if="filteredProjectDeliverableStageGroups.length > 0"
                class="project-deliverable-stage-list"
              >
                <section
                  v-for="group in filteredProjectDeliverableStageGroups"
                  :key="group.stageId"
                  class="project-deliverable-stage-group"
                >
                  <header>
                    <div>
                      <span>{{ group.stageCode }}</span>
                      <strong>{{ group.stageName }}</strong>
                    </div>
                    <small>
                      {{ group.deliverables.length }} 项成果物 ·
                      {{
                        group.deliverables.reduce(
                          (total, item) => total + item.files.length,
                          0,
                        )
                      }}
                      个文件
                    </small>
                  </header>
                  <div class="project-deliverable-table-wrap">
                    <table class="project-deliverable-table">
                      <thead>
                        <tr>
                          <th>成果物</th>
                          <th>关联目标</th>
                          <th>负责人</th>
                          <th>状态</th>
                          <th>关联文件</th>
                          <th>截止日期</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="deliverable in group.deliverables"
                          :key="deliverable.id"
                        >
                          <td class="deliverable-record-name">
                            <strong>{{ deliverable.name }}</strong>
                            <small :title="deliverable.acceptance">
                              验收：{{ deliverable.acceptance }}
                            </small>
                          </td>
                          <td class="deliverable-record-objective">
                            <span>{{ deliverable.objectiveCode }}</span>
                            <small :title="deliverable.objectiveTitle">
                              {{ deliverable.objectiveTitle }}
                            </small>
                          </td>
                          <td>
                            <span class="deliverable-owner">
                              {{ deliverable.owner.slice(0, 1) }}
                            </span>
                            <strong class="deliverable-owner-name">
                              {{ deliverable.owner }}
                            </strong>
                          </td>
                          <td>
                            <span
                              class="deliverable-status"
                              :class="`is-${deliverable.status}`"
                            >
                              {{ krStatusLabel(deliverable) }}
                            </span>
                          </td>
                          <td>
                            <div
                              v-if="deliverable.files.length > 0"
                              class="linked-file-list"
                            >
                              <button
                                v-for="file in deliverable.files"
                                :key="file.id"
                                type="button"
                                :title="`来源：${file.reportTitle}`"
                                @click="previewWeeklyReport(file.report)"
                              >
                                <Icon icon="lucide:file-text" />
                                <span>
                                  <strong>{{ file.name }}</strong>
                                  <small>
                                    {{ file.size }} · {{ file.uploadedAt }}
                                  </small>
                                </span>
                                <Icon icon="lucide:external-link" />
                              </button>
                            </div>
                            <span v-else class="unlinked-file-state">
                              <Icon icon="lucide:link-2-off" />
                              待关联文件
                            </span>
                          </td>
                          <td class="deliverable-due-date">
                            {{ deliverable.dueDate }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
              <Empty
                v-else
                description="没有符合查询条件的成果物"
              />
            </section>

            <section
              v-else-if="projectDossierActiveTab === 'reports'"
              class="project-dossier-tab tab-reports"
            >
              <header class="project-tab-heading">
                <div>
                  <span>PROJECT WEEKLY REPORTS</span>
                  <h3>项目周报</h3>
                  <p>汇总项目全部阶段的周报，按月份、人员和周次集中查看。</p>
                </div>
                <span class="project-tab-count">
                  {{ filteredProjectWeeklyReportCount }} 份
                </span>
              </header>
              <div class="report-list-toolbar">
                <Input
                  v-model:value="projectReportSearchKeyword"
                  allow-clear
                  class="report-search-input"
                  placeholder="搜索人员、周次、标题或阶段"
                  aria-label="搜索项目周报"
                >
                  <template #prefix>
                    <Icon icon="lucide:search" />
                  </template>
                </Input>
                <span class="report-result-count">
                  已覆盖 {{ activeStructureProject.stages.length }} 个项目阶段
                </span>
              </div>

              <div
                v-if="groupedProjectWeeklyReportsByMonth.length > 0"
                class="monthly-report-groups"
              >
                <details
                  v-for="(group, groupIndex) in groupedProjectWeeklyReportsByMonth"
                  :key="group.month"
                  class="month-group-card"
                  :open="Boolean(projectReportSearchKeyword) || groupIndex === 0"
                >
                  <summary class="month-group-header">
                    <span class="month-calendar-icon">
                      <Icon icon="lucide:calendar" />
                    </span>
                    <h4>{{ group.month }}</h4>
                    <span class="month-count-pill">
                      {{ group.reports.length }} 份
                    </span>
                    <Icon class="month-chevron" icon="lucide:chevron-down" />
                  </summary>
                  <div class="month-reports-grid">
                    <button
                      v-for="report in group.reports"
                      :key="`${report.stageCode}-${report.id}`"
                      type="button"
                      class="person-week-card"
                      :class="`is-${report.status}`"
                      :aria-label="`查看${report.reporter || report.author || '责任人'}的${report.weekTitle || report.title}`"
                      @click="previewWeeklyReport(report)"
                    >
                      <span class="report-avatar" aria-hidden="true">
                        {{ reportAvatarText(report) }}
                      </span>
                      <span class="compact-report-body">
                        <span class="compact-report-line is-primary">
                          <strong>{{ report.reporter || report.author }}</strong>
                          <span class="compact-report-title">
                            {{ report.weekTitle || report.title }}
                          </span>
                        </span>
                        <span class="compact-report-line is-secondary">
                          <span class="report-week-chip">
                            {{
                              (report.personWeekTitle || '').split(' · ')[1] ||
                              report.cycle ||
                              '本周'
                            }}
                          </span>
                          <span class="report-stage-chip">
                            {{ report.stageCode }} · {{ report.stageName }}
                          </span>
                          <span>{{ report.weekRange || report.cycle }}</span>
                          <span
                            v-if="
                              report.status === 'blocked' ||
                              report.status === 'delayed' ||
                              report.status === 'at-risk'
                            "
                            class="compact-report-risk"
                          >
                            {{ report.status === 'blocked' ? '卡点' : '延期' }}
                          </span>
                        </span>
                      </span>
                      <Icon
                        class="compact-report-arrow"
                        icon="lucide:chevron-right"
                      />
                    </button>
                  </div>
                </details>
              </div>
              <Empty
                v-else-if="projectReportSearchKeyword"
                description="没有匹配的项目周报，请尝试搜索人员、周次、标题或阶段"
              />
              <Empty v-else description="该项目暂无周报记录" />
            </section>

            <section v-else class="project-dossier-tab project-log-tab">
              <header class="project-tab-heading">
                <div>
                  <span>PROJECT OPERATION LOG</span>
                  <h3>项目操作日志</h3>
                  <p>按时间记录立项、阶段完成、目标完成与项目基线变更。</p>
                </div>
                <span class="project-change-summary">
                  <Icon icon="lucide:triangle-alert" />
                  {{
                    projectOperationLogs.filter(
                      (item) => item.kind === 'change',
                    ).length
                  }}
                  条重点变更
                </span>
              </header>
              <div class="project-log-toolbar">
                <Input
                  v-model:value="projectLogKeyword"
                  allow-clear
                  placeholder="搜索操作内容或操作人"
                  aria-label="搜索项目操作日志"
                  @change="projectLogPage = 1"
                >
                  <template #prefix><Icon icon="lucide:search" /></template>
                </Input>
                <Select
                  v-model:value="projectLogType"
                  :options="projectLogTypeOptions"
                  aria-label="按日志类型筛选"
                  @change="projectLogPage = 1"
                />
                <span>
                  共 {{ filteredProjectOperationLogs.length }} 条记录
                </span>
              </div>
              <div
                v-if="filteredProjectOperationLogs.length > 0"
                class="project-log-table-wrap"
              >
                <table class="project-log-table">
                  <thead>
                    <tr>
                      <th>操作时间</th>
                      <th>日志类型</th>
                      <th>操作内容</th>
                      <th>操作人</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="log in pagedProjectOperationLogs"
                      :key="log.id"
                      :class="{ 'is-change': log.kind === 'change' }"
                    >
                      <td class="project-log-time">{{ log.time }}</td>
                      <td>
                        <span
                          class="project-log-type"
                          :class="`is-${log.kind}`"
                        >
                          {{
                            log.kind === 'change'
                              ? '项目变更'
                              : log.kind === 'goal'
                                ? '目标完成'
                                : log.kind === 'stage'
                                  ? '阶段完成'
                                  : '项目立项'
                          }}
                        </span>
                      </td>
                      <td class="project-log-action">
                        <strong>{{ log.title }}</strong>
                        <small>{{ log.description }}</small>
                      </td>
                      <td class="project-log-operator">
                        <span>{{ log.operator.slice(0, 1) }}</span>
                        <strong>{{ log.operator }}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <footer class="project-log-pagination">
                  <span>
                    第 {{ projectLogPage }} 页，共
                    {{
                      Math.ceil(
                        filteredProjectOperationLogs.length /
                          projectLogPageSize,
                      )
                    }}
                    页
                  </span>
                  <Pagination
                    v-model:current="projectLogPage"
                    :page-size="projectLogPageSize"
                    :total="filteredProjectOperationLogs.length"
                    :show-size-changer="false"
                    show-less-items
                  />
                </footer>
              </div>
              <Empty v-else description="没有符合查询条件的操作日志" />
            </section>
          </div>
        </div>

        <!-- 抽屉底部 -->
        <footer class="project-dossier-footer">
          <div class="footer-left-status">
            <span class="status-active-label">
              <span class="ping-dot"></span>
              统一治理编号：#PMO-{{ activeStructureProject.code }}
            </span>
            <span class="ml-2 text-xs text-slate-500">
              当前主阶段：【{{ activeStructureProject.stage }}】
            </span>
          </div>
          <div class="footer-right-buttons">
            <Button @click="openAiConversation">
              <Icon icon="lucide:message-square-text" />
              在 AI 对话中探讨项目规划
            </Button>
            <Button type="primary" @click="projectDossierDrawerOpen = false">
              关闭抽屉
            </Button>
          </div>
        </footer>
      </div>
    </Drawer>

    <Drawer
      v-model:open="executorProgressDrawerOpen"
      width="440px"
      placement="right"
      title="更新目标状态与进度"
      root-class-name="project-light-drawer executor-progress-drawer"
    >
      <section
        v-if="executorProgressObjective && executorProgressStage"
        class="executor-progress-panel"
      >
        <header>
          <span><Icon icon="lucide:target" /></span>
          <div>
            <small>{{ executorProgressStage.name }}</small>
            <h3>{{ executorProgressObjective.title }}</h3>
            <p>负责人：{{ executorProgressObjective.owner }}</p>
          </div>
        </header>
        <label class="executor-progress-input">
          <span>目标状态</span>
          <Select
            v-model:value="executorStatusDraft"
            :options="[
              { label: '未开始', value: 'pending' },
              { label: '进行中', value: 'active' },
              { label: '需关注', value: 'watch' },
              { label: '有风险', value: 'risk' },
              { label: '已完成', value: 'completed' },
            ]"
            aria-label="目标状态"
          />
        </label>
        <div class="executor-progress-value">
          <span>当前完成进度</span>
          <strong>{{ executorProgressDraft }}%</strong>
          <Progress
            :percent="Number(executorProgressDraft)"
            :show-info="false"
            stroke-color="#2f7d6b"
          />
        </div>
        <label class="executor-progress-input">
          <span>更新为</span>
          <Input
            v-model:value="executorProgressDraft"
            type="number"
            :min="0"
            :max="100"
            aria-label="目标完成进度"
          >
            <template #suffix>%</template>
          </Input>
        </label>
        <div class="executor-progress-presets" aria-label="快捷进度">
          <Button
            v-for="value in [25, 50, 75, 100]"
            :key="value"
            size="small"
            :class="{ 'is-active': Number(executorProgressDraft) === value }"
            @click="executorProgressDraft = value"
          >
            {{ value }}%
          </Button>
        </div>
        <label class="executor-progress-note">
          <span>本次进展说明（选填）</span>
          <Input.TextArea
            v-model:value="executorProgressNote"
            :rows="4"
            placeholder="说明本次完成内容、当前阻碍或下一步计划"
          />
        </label>
        <aside>
          <Icon icon="lucide:info" />
          保存后会同步更新目标、所属阶段及项目整体进度。
        </aside>
        <footer>
          <Button @click="executorProgressDrawerOpen = false">取消</Button>
          <Button class="light-primary-action" @click="saveExecutorProgress">
            <Icon icon="lucide:check" />
            保存进度
          </Button>
        </footer>
      </section>
    </Drawer>
  </AiWorkPage>
</template>

<style scoped>
@keyframes stage-pulse-amber {
  0%,
  100% {
    border-color: #f59e0b;
    box-shadow: 0 0 0 0 rgb(245 158 11 / 40%);
  }

  50% {
    border-color: #d97706;
    box-shadow: 0 0 0 6px rgb(245 158 11 / 12%);
  }
}

@keyframes stage-pulse-red {
  0%,
  100% {
    border-color: #ef4444;
    box-shadow: 0 0 0 0 rgb(239 68 68 / 45%);
  }

  50% {
    border-color: #dc2626;
    box-shadow: 0 0 0 6px rgb(239 68 68 / 15%);
  }
}

@keyframes sparkle-rotate {
  0% {
    transform: rotate(0deg) scale(1);
  }

  50% {
    transform: rotate(180deg) scale(1.15);
  }

  100% {
    transform: rotate(360deg) scale(1);
  }
}

@container project-structure (max-width: 760px) {
  .structure-project-summary {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .summary-heading {
    flex-wrap: wrap;
  }

  .ai-next-step {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .ai-next-step__action,
  .ai-next-step > :deep(.ant-btn) {
    grid-column: 2;
  }

  .ai-next-step__action {
    padding: 6px 0 0;
    border-top: 1px solid #d9e5e1;
    border-left: 0;
  }

  .stage-row {
    grid-template-columns: 28px minmax(0, 1fr) auto;
  }

  .stage-row-meta {
    flex-wrap: wrap;
    grid-row: 2;
    grid-column: 2;
  }

  .stage-edit-fields {
    grid-template-columns: 1fr 1fr;
  }

  .stage-edit-fields label:first-child {
    grid-column: 1 / 3;
  }

  .objective-list {
    padding-left: 42px;
  }

  .objective-list::before {
    left: 26px;
  }

  .objective-edit-content {
    grid-template-columns: minmax(160px, 1fr) 104px 124px;
  }

  .objective-edit-content > :deep(.ant-input) {
    grid-column: 2 / 4;
  }

  .tree-kr-list {
    padding-left: 32px;
  }

  .tree-kr-list::before {
    left: 15px;
  }
}

@container project-structure (max-width: 560px) {
  .structure-project-summary {
    grid-template-columns: 1fr;
  }

  .summary-progress {
    grid-template-columns: auto auto;
    justify-content: start;
    width: max-content;
  }

  .stage-row > .status-pill {
    grid-row: 2;
    grid-column: 3;
  }

  .stage-edit-fields {
    grid-template-columns: 1fr;
  }

  .stage-edit-fields label:first-child {
    grid-column: auto;
  }

  .objective-row.is-editing {
    grid-template-columns: 28px minmax(0, 1fr);
  }

  .objective-row.is-editing > :deep(.ant-btn) {
    grid-column: 2;
    justify-self: start;
  }

  .objective-edit-content,
  .kr-edit-content {
    grid-template-columns: 1fr 1fr;
  }

  .objective-edit-content .node-name-editor,
  .kr-edit-content .node-name-editor {
    grid-column: 1 / 3;
  }

  .objective-edit-content > :deep(.ant-input) {
    grid-column: auto;
  }

  .tree-kr-row.is-editing {
    grid-template-columns: minmax(0, 1fr);
  }

  .tree-kr-row.is-editing > .status-pill {
    grid-row: auto;
    grid-column: auto;
    justify-self: start;
  }
}

@keyframes pulse-ring {
  0% {
    box-shadow: 0 0 0 0 rgb(16 185 129 / 70%);
    transform: scale(0.9);
  }

  70% {
    box-shadow: 0 0 0 5px rgb(16 185 129 / 0%);
    transform: scale(1);
  }

  100% {
    box-shadow: 0 0 0 0 rgb(16 185 129 / 0%);
    transform: scale(0.9);
  }
}

@media (max-width: 900px) {
  .project-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .project-search {
    grid-template-columns: 1fr 1fr;
    width: 100%;
  }

  .project-search :deep(.ant-input-affix-wrapper) {
    grid-column: 1 / 3;
  }

  .view-switch {
    width: max-content;
  }

  .portfolio-overview,
  .project-card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .structure-workbench {
    grid-template-columns: 1fr;
  }

  .structure-project-list {
    max-height: 190px;
    padding: 8px;
    overflow: auto;
    border-right: 0;
    border-bottom: 1px solid #dce8e4;
  }

  .project-tree-children {
    padding-left: 24px;
  }

  .project-tree-children::before {
    left: 12px;
  }
}

@media (max-width: 640px) {
  .ai-next-step {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .ai-next-step__action,
  .ai-next-step > :deep(.ant-btn) {
    grid-column: 2;
  }

  .ai-next-step__action {
    padding: 6px 0 0;
    border-top: 1px solid #d9e5e1;
    border-left: 0;
  }

  .stage-gates,
  .project-search {
    grid-template-columns: 1fr;
  }

  .project-search :deep(.ant-input-affix-wrapper) {
    grid-column: auto;
  }

  .portfolio-overview,
  .project-card-grid {
    grid-template-columns: 1fr;
  }

  .portfolio-board { padding: 10px; }

  .stage-flat-list { padding-left: 10px; }

  .stage-flat-item { grid-template-columns: 32px minmax(0, 1fr); }

  .flat-item-progress,
  .flat-item-actions { grid-column: 2; }

  .flat-create-form { grid-template-columns: 1fr; }

  .kr-list article {
    grid-template-columns: auto 1fr;
  }

  .kr-progress {
    grid-column: 2;
  }

  .structure-workbench {
    grid-template-columns: 1fr;
  }

  .structure-project-list {
    max-height: 220px;
    overflow: auto;
    border-right: 0;
    border-bottom: 1px solid #dce8e4;
  }

  .structure-project-list > header {
    padding-bottom: 6px;
  }

  .structure-detail {
    padding: 12px;
  }

  .structure-project-summary {
    grid-template-columns: 1fr;
  }

  .summary-progress {
    grid-template-columns: auto auto;
    justify-content: start;
    width: max-content;
  }

  .stage-row {
    grid-template-columns: 28px minmax(0, 1fr) auto;
  }

  .stage-row-meta {
    grid-row: 2;
    grid-column: 2;
  }

  .stage-row > .status-pill {
    grid-row: 2;
    grid-column: 3;
  }

  .stage-row > .stage-actions {
    grid-row: 1;
    grid-column: 3;
  }

  .objective-list {
    padding: 8px;
  }

  .objective-row {
    grid-template-columns: 28px minmax(0, 1fr) auto;
  }

  .objective-kr-count {
    display: none;
  }

  .objective-row > .status-pill {
    grid-row: 2;
    grid-column: 2;
  }

  .objective-row > :deep(.ant-btn) {
    grid-row: 1 / 3;
    grid-column: 3;
  }

  .objective-row-actions {
    grid-row: 1 / 3;
    grid-column: 3;
    flex-direction: column;
  }

  .tree-kr-list {
    padding-left: 32px;
  }

  .tree-kr-list::before {
    left: 15px;
  }

  .tree-kr-row {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .tree-kr-row.has-executor-action {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .tree-kr-row > .status-pill {
    grid-row: 1 / 3;
    grid-column: 2;
  }

  .tree-kr-row > span:not(.status-pill) {
    grid-column: 1;
  }

  .executor-deliverable-action {
    grid-column: 1 / -1;
    justify-content: flex-start;
    padding-top: 5px;
    border-top: 1px solid #eee7f2;
  }

  .inline-create-row.is-objective,
  .inline-create-row.is-kr {
    grid-template-columns: 1fr;
  }

  .inline-create-row > div {
    justify-content: flex-start;
  }

  .detail-grid,
  .objective-form > div {
    grid-template-columns: 1fr;
  }

  .objective-card {
    margin-left: 10px;
  }
}

@media (max-width: 960px) {
  .month-reports-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .view-switch button {
    transition: none;
  }
}

@media (max-width: 900px) {
  :global(.stage-mgmt-drawer .ant-drawer-content-wrapper),
  :global(.project-dossier-drawer .ant-drawer-content-wrapper) {
    width: 100% !important;
    max-width: 100% !important;
  }

  .project-dossier-split-layout,
  .stage-mgmt-split-layout {
    flex-direction: column;
  }

  .project-dossier-sidebar-menu,
  .stage-mgmt-sidebar-menu {
    flex-direction: row;
    width: 100%;
    padding: 10px 12px;
    overflow-x: auto;
    border-right: 0;
    border-bottom: 1px solid #dce8e4;
  }

  .sidebar-menu-btn {
    min-width: 154px;
  }

  .overview-metric-strip,
  .strategy-cards-layout {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .attribution-split-grid {
    grid-template-columns: 1fr;
  }

  .chain-pipeline-steps {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .pipeline-connector {
    justify-content: center;
    transform: rotate(90deg);
  }

  .project-dossier-main-content .grid-cols-4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .stage-mgmt-head,
  .project-dossier-head {
    padding: 14px 16px;
  }

  .stage-mgmt-main-content,
  .project-dossier-main-content {
    padding: 14px;
  }

  .overview-metric-strip,
  .strategy-cards-layout,
  .project-dossier-main-content .grid-cols-4,
  .charter-grid-summary,
  .project-log-toolbar {
    grid-template-columns: 1fr;
  }

  .console-head,
  .console-actions-strip,
  .gate-block-head,
  .dossier-section-heading,
  .stage-mgmt-footer,
  .project-dossier-footer {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .stage-flow-strip,
  .stage-flow-toggle,
  .milestone-card,
  .sidebar-menu-btn,
  .strategy-reborn-card,
  .strat-draft-box > summary > svg {
    transition: none;
  }
}

.project-workbench {
  display: grid;
  gap: 12px;
  min-height: 0;
}

.project-panel {
  min-height: 0;
  overflow: hidden;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 14px;
}

.project-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid #e3ece8;
}

.project-search {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) 128px 128px;
  gap: 8px;
  width: min(650px, 72%);
}

.project-toolbar-actions {
  display: inline-flex;
  flex: none;
  gap: 8px;
  align-items: center;
}

.project-readonly-badge {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  min-height: 30px;
  padding: 0 9px;
  font-size: 12px;
  font-weight: 650;
  color: #526a63;
  background: #f3f7f5;
  border: 1px solid #d5e1dd;
  border-radius: 8px;
}

.project-readonly-badge svg {
  font-size: 14px;
  color: #397565;
}

.view-switch {
  display: inline-flex;
  gap: 3px;
  padding: 3px;
  background: #eef4f1;
  border-radius: 9px;
}

.view-switch button {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  min-height: 32px;
  padding: 0 11px;
  font-size: 12px;
  color: #667b74;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 7px;
}

.view-switch button.is-active {
  color: #176b5c;
  background: #fff;
  box-shadow: 0 1px 4px rgb(34 70 60 / 12%);
}

.view-switch button:focus-visible,
.project-name:focus-visible,
.project-board-card:focus-visible,
.gantt-project:focus-visible,
.gantt-bar:focus-visible {
  outline: 3px solid rgb(54 139 117 / 24%);
  outline-offset: 2px;
}

.portfolio-board {
  min-height: 560px;
  padding: 16px;
  overflow: auto;
  background: #f5f8f7;
}

.portfolio-overview {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.portfolio-overview > article {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  padding: 12px 13px;
  background: #fff;
  border: 1px solid #dce7e3;
  border-radius: 11px;
}

.overview-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  font-size: 17px;
  color: #176b5c;
  background: #e6f3ee;
  border-radius: 10px;
}

.overview-icon.is-danger { color: #b6443b; background: #fbe9e7; }
.overview-icon.is-warning { color: #9b681b; background: #fff1da; }
.overview-icon.is-success { color: #17735e; background: #e2f4ed; }
.portfolio-overview small,
.portfolio-overview p { font-size: 11px; color: #72857f; }
.portfolio-overview strong { margin: 0 5px 0 0; font-size: 21px; color: #203f38; }
.portfolio-overview p { display: inline; margin: 0; }

.project-card-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.project-board-card {
  position: relative;
  min-width: 0;
  overflow: hidden;
  cursor: pointer;
  background: #fff;
  border: 1px solid #d9e5e1;
  border-radius: 13px;
  box-shadow: 0 4px 14px rgb(31 74 63 / 5%);
  transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
}

.project-board-card:hover {
  border-color: #9fc6bb;
  box-shadow: 0 10px 24px rgb(31 74 63 / 10%);
  transform: translateY(-2px);
}

.project-health-bar { height: 4px; background: #20a17f; }
.project-board-card.is-watch .project-health-bar { background: #e6a13c; }
.project-board-card.is-at-risk .project-health-bar,
.project-board-card.is-blocked .project-health-bar { background: #e05a50; }

.project-card-head {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: start;
  padding: 14px 14px 11px;
}

.project-card-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  font-size: 17px;
  color: #176b5c;
  background: #e7f3ef;
  border-radius: 10px;
}

.project-card-head > div { min-width: 0; }
.project-card-head > div > div { display: flex; gap: 5px; align-items: center; font-size: 10px; color: #7b8c86; }
.project-card-head > div > div b { font-weight: 650; color: #4e6860; }
.health-dot { width: 5px; height: 5px; margin-left: 2px; background: #20a17f; border-radius: 50%; }
.is-watch .health-dot { background: #e6a13c; }
.is-at-risk .health-dot,
.is-blocked .health-dot { background: #e05a50; }
.project-card-head h3 { margin: 4px 0 2px; overflow: hidden; text-overflow: ellipsis; font-size: 15px; font-weight: 760; color: #203f38; white-space: nowrap; }
.project-card-head p { margin: 0; overflow: hidden; text-overflow: ellipsis; font-size: 11px; color: #70837c; white-space: nowrap; }
.project-card-arrow { margin-top: 2px; font-size: 16px; color: #8da099; }

.current-stage-card {
  padding: 10px 11px;
  margin: 0 14px;
  background: #f5f9f7;
  border: 1px solid #e0eae6;
  border-radius: 9px;
}

.current-stage-card > div { display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: #73877f; }
.current-stage-card > div b { color: #587069; }
.current-stage-card > strong { display: block; margin: 3px 0 4px; overflow: hidden; text-overflow: ellipsis; font-size: 12px; color: #30564c; white-space: nowrap; }
.current-stage-card :deep(.ant-progress-line) { margin: 0; }

.project-card-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  margin: 12px 14px;
  overflow: hidden;
  background: #e2eae7;
  border: 1px solid #e2eae7;
  border-radius: 9px;
}

.project-card-metrics > div { display: grid; gap: 2px; padding: 9px 8px; background: #fff; }
.project-card-metrics span,
.project-card-metrics i { font-size: 10px; font-style: normal; color: #7a8d86; }
.project-card-metrics strong { font-size: 17px; line-height: 1; color: #294e44; }
.project-card-metrics strong small { margin-left: 2px; font-size: 11px; font-weight: 600; color: #8a9a95; }

.project-card-foot {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px 14px;
  font-size: 10px;
  color: #6e817a;
  background: #fbfcfc;
  border-top: 1px solid #e8efec;
}

.project-card-foot span { display: inline-flex; gap: 4px; align-items: center; }
.project-card-foot b { margin-left: auto; font-size: 12px; color: #21715f; }

.project-table-wrap,
.gantt-scroll {
  overflow: auto;
}

.project-table {
  width: 100%;
  min-width: 1120px;
  border-collapse: collapse;
}

.project-table th {
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 700;
  color: #758780;
  text-align: left;
  background: #f7faf9;
  border-bottom: 1px solid #e3ebe8;
}

.project-table td {
  padding: 12px;
  font-size: 12px;
  color: #506a61;
  border-bottom: 1px solid #edf2f0;
}

.project-table tbody tr:hover {
  background: #fbfdfc;
}

.project-name {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 9px;
  align-items: center;
  min-width: 220px;
  padding: 0;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.project-name > span:first-child {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  font-size: 16px;
  color: #247665;
  background: #e6f3ee;
  border-radius: 9px;
}

.project-name > span:last-child,
.stage-cell {
  display: grid;
  gap: 3px;
}

.project-name strong,
.stage-cell strong {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: #274b42;
  white-space: nowrap;
}

.project-name small,
.stage-cell small,
.structure-copy,
.date-window {
  font-size: 12px;
  color: #7a8c85;
}

.progress-cell {
  display: grid;
  grid-template-columns: minmax(70px, 1fr) auto;
  gap: 8px;
  align-items: center;
  min-width: 110px;
}

.progress-cell b {
  font-size: 12px;
  color: #4a685f;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  width: max-content;
  min-height: 24px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 650;
  color: #27725f;
  background: #e7f5ef;
  border: 1px solid #b9dfd2;
  border-radius: 999px;
}

.status-pill.is-watch,
.status-pill.is-pending {
  color: #94601f;
  background: #fff4e2;
  border-color: #efd5ad;
}

.status-pill.is-at-risk,
.status-pill.is-blocked {
  color: #a14b43;
  background: #fbecea;
  border-color: #ecc4bf;
}

.status-pill.is-neutral,
.status-pill.is-initiation {
  color: #526861;
  background: #f1f6f4;
  border-color: #d6e2de;
}

.gantt-board {
  min-width: 1160px;
}

.gantt-header,
.gantt-row {
  display: grid;
  grid-template-columns: 230px minmax(900px, 1fr);
}

.gantt-header {
  position: sticky;
  top: 0;
  z-index: 3;
  min-height: 42px;
  background: #f7faf9;
  border-bottom: 1px solid #e2ebe7;
}

.gantt-project-heading {
  display: flex;
  align-items: center;
  padding: 0 14px;
  font-size: 12px;
  font-weight: 700;
  color: #6e827b;
  border-right: 1px solid #e2ebe7;
}

.gantt-axis {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
}

.gantt-axis span {
  display: flex;
  align-items: center;
  padding-left: 7px;
  font-size: 12px;
  color: #7a8c85;
  border-left: 1px solid #e5ece9;
}

.gantt-row {
  min-height: 66px;
  border-bottom: 1px solid #edf2f0;
}

.gantt-project {
  display: grid;
  gap: 4px;
  align-content: center;
  padding: 10px 14px;
  text-align: left;
  cursor: pointer;
  background: #fff;
  border: 0;
  border-right: 1px solid #e5ece9;
}

.gantt-project strong {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: #294d44;
  white-space: nowrap;
}

.gantt-project span {
  font-size: 12px;
  color: #7b8d86;
}

.gantt-track {
  position: relative;
  min-height: 66px;
  background: #fbfdfc;
}

.gantt-track > i {
  position: relative;
  display: inline-block;
  width: calc(100% / 12);
  height: 100%;
  border-left: 1px solid #edf2f0;
}

.gantt-bar {
  position: absolute;
  top: 17px;
  z-index: 2;
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: space-between;
  min-width: 44px;
  height: 32px;
  padding: 0 9px;
  overflow: hidden;
  color: #286454;
  cursor: pointer;
  background: #dff1ea;
  border: 1px solid #abd4c7;
  border-radius: 7px;
}

.gantt-bar.is-completed {
  color: #4e6960;
  background: #edf4f1;
  border-color: #ceded8;
}

.gantt-bar.is-blocked {
  color: #a14b43;
  background: #fae8e6;
  border-color: #e8bbb5;
}

.gantt-bar.is-ready,
.gantt-bar.is-pending {
  color: #85622c;
  background: #fff2dc;
  border-color: #e8cda4;
}

.gantt-bar span {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.gantt-bar b {
  font-size: 12px;
}

.structure-workbench {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  min-height: 560px;
  background: #fff;
}

.structure-project-list {
  min-width: 0;
  padding: 12px;
  background: #f5f9f7;
  border-right: 1px solid #dce8e4;
}

.structure-project-list > header {
  display: grid;
  gap: 8px;
  padding: 4px 4px 12px;
}

.project-directory-tabs {
  display: flex;
  gap: 3px;
  align-items: center;
  padding: 3px;
  background: #e8f0ed;
  border: 1px solid #d7e4df;
  border-radius: 9px;
}

.project-directory-tabs > button {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  padding: 0 9px;
  font-size: 12px;
  font-weight: 650;
  color: #5f746d;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 7px;
}

.project-directory-tabs > button.is-active {
  color: #1f6253;
  background: #fff;
  box-shadow: 0 1px 4px rgb(40 83 71 / 12%);
}

.project-directory-tabs > button > span {
  display: inline-grid;
  place-items: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  font-size: 12px;
  font-weight: 600;
  color: #688079;
  background: #edf4f1;
  border-radius: 999px;
}

.project-directory-tabs > button.is-active > span {
  color: #24705f;
  background: #e5f2ed;
}

.project-directory-tabs .project-directory-add {
  width: 30px;
  min-width: 30px;
  padding: 0;
  margin-left: auto;
  color: #236958;
  background: #f8fbfa;
  border: 1px solid #c9ddd7;
}

.project-directory-tabs .project-directory-add:hover,
.project-directory-tabs .project-directory-add:focus-visible {
  color: #145647;
  outline: 2px solid rgb(44 126 105 / 20%);
  background: #fff;
  border-color: #8fbcaf;
}

.new-directory-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 30px 30px;
  gap: 5px;
  align-items: center;
}

.new-directory-form > button {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  padding: 0;
  font-size: 14px;
  color: #286a59;
  cursor: pointer;
  background: #fff;
  border: 1px solid #c8dcd6;
  border-radius: 7px;
}

.new-directory-form > button:last-child {
  color: #72857f;
}

.project-tree-group + .project-tree-group {
  margin-top: 5px;
}

.project-tree-parent {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  gap: 5px;
  align-items: center;
  width: 100%;
  min-height: 34px;
  padding: 5px 7px;
  color: #31584e;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 7px;
}

.project-tree-parent:hover,
.project-tree-parent:focus-visible {
  outline: 2px solid rgb(79 157 136 / 18%);
  background: #eaf3f0;
}

.project-tree-parent > svg {
  font-size: 16px;
  color: #4d766c;
}

.project-tree-parent strong {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  white-space: nowrap;
}

.project-tree-children {
  position: relative;
  display: grid;
  gap: 3px;
  padding: 2px 0 4px 34px;
}

.project-tree-children::before {
  position: absolute;
  top: 0;
  bottom: 14px;
  left: 18px;
  width: 1px;
  content: '';
  background: #c9d9d4;
}

.project-tree-project {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 30px;
  align-items: center;
  width: 100%;
  min-height: 32px;
  color: #4c6860;
  background: #fff;
  border: 1px solid #dce7e3;
  border-radius: 7px;
}

.project-tree-project-main {
  min-width: 0;
  min-height: 32px;
  padding: 6px 8px;
  font-size: 12px;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.project-tree-project-main > span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-tree-project::before {
  position: absolute;
  top: 15px;
  left: -16px;
  width: 15px;
  height: 1px;
  content: '';
  background: #c9d9d4;
}

.project-tree-project:hover,
.project-tree-project:focus-within {
  color: #285d50;
  outline: none;
  background: #f7fbf9;
  border-color: #a9cec3;
}

.project-tree-project.is-selected {
  font-weight: 700;
  color: #1f6152;
  background: #e7f3ef;
  border-color: #91c1b4;
  box-shadow: inset 3px 0 0 #4f9d88;
}

.project-more-button {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  padding: 0;
  font-size: 15px;
  color: #60766f;
  pointer-events: none;
  cursor: pointer;
  visibility: hidden;
  background: transparent;
  border: 0;
  border-radius: 6px;
  opacity: 0;
  transition:
    opacity 120ms ease,
    background-color 120ms ease;
}

.project-tree-project:hover .project-more-button,
.project-tree-project:focus-within .project-more-button {
  pointer-events: auto;
  visibility: visible;
  opacity: 1;
}

.project-more-button:hover,
.project-more-button:focus-visible {
  color: #245f51;
  outline: 2px solid rgb(50 130 109 / 18%);
  background: #e5f0ec;
}

.project-directory-empty,
.structure-detail-empty {
  display: grid;
  gap: 8px;
  place-items: center;
  color: #7b8e87;
}

.project-directory-empty {
  min-height: 120px;
  padding: 20px 8px;
  font-size: 12px;
  text-align: center;
}

.project-directory-empty > svg {
  font-size: 24px;
  color: #9bada7;
}

.structure-detail-empty {
  min-height: 560px;
  background: #fbfdfc;
}

.structure-detail {
  min-width: 0;
  padding: 14px 16px 22px;
  container: project-structure / inline-size;
  overflow: hidden auto;
  background: #fbfdfc;
}

.structure-project-summary {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 9px 12px;
  background: #fff;
  border: 1px solid #dbe8e4;
  border-radius: 10px;
}

.summary-heading {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.summary-right-side {
  display: flex;
  gap: 10px;
  align-items: center;
}

.linked-employee-group {
  display: grid;
  gap: 4px;
}

.linked-employee-label {
  font-size: 10px;
  line-height: 1;
  color: #83958f;
}

.linked-employee-list {
  display: flex;
  gap: 6px;
}

.linked-employee-card {
  display: grid;
  grid-template-columns: 30px minmax(82px, 1fr) auto;
  gap: 7px;
  align-items: center;
  min-width: 148px;
  padding: 5px 7px;
  text-align: left;
  cursor: pointer;
  background: #f7faf9;
  border: 1px solid #dbe8e4;
  border-radius: 9px;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.linked-employee-card:hover {
  background: #fff;
  border-color: #9bcabb;
  box-shadow: 0 5px 14px rgb(32 91 75 / 10%);
  transform: translateY(-1px);
}

.linked-employee-avatar {
  width: 30px;
  height: 30px;
  object-fit: cover;
  border: 1px solid #d7e7e2;
  border-radius: 9px;
}

.linked-employee-card > span {
  display: grid;
  min-width: 0;
}

.linked-employee-card strong,
.linked-employee-card small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.linked-employee-card strong {
  font-size: 11px;
  font-weight: 700;
  color: #244a40;
}

.linked-employee-card small {
  font-size: 10px;
  color: #778a84;
}

.linked-employee-card > svg {
  font-size: 13px;
  color: #74938a;
}

.summary-tags {
  display: flex;
  flex: none;
  gap: 5px;
}

.structure-project-summary h2 {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 15px;
  color: #23473e;
  white-space: nowrap;
}

.structure-project-summary p {
  margin: 3px 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  line-height: 1.4;
  color: #657a73;
  white-space: nowrap;
}

.structure-project-summary > div > small {
  display: block;
  margin-top: 3px;
  font-size: 12px;
  color: #73867f;
}

.summary-progress {
  display: grid;
  gap: 2px;
  min-width: 72px;
  padding: 7px 9px;
  text-align: center;
  background: #eef7f4;
  border: 1px solid #cce2da;
  border-radius: 10px;
}

.summary-progress strong {
  font-size: 17px;
  color: #287564;
}

.summary-progress span {
  font-size: 12px;
  color: #6c817a;
}

.ai-next-step {
  display: grid;
  grid-template-columns: auto minmax(190px, 0.8fr) minmax(280px, 1.2fr) auto;
  gap: 10px;
  align-items: center;
  min-height: 48px;
  padding: 7px 9px;
  margin-top: 8px;
  background: #f2f8f6;
  border: 1px solid #d6e7e1;
  border-left: 3px solid #5a9f8d;
  border-radius: 9px;
}

.ai-next-step.is-watch {
  background: #fff9ec;
  border-color: #ead8ad;
  border-left-color: #d49a3a;
}

.ai-next-step.is-at-risk,
.ai-next-step.is-blocked {
  background: #fff3f1;
  border-color: #eccbc6;
  border-left-color: #cf6a5f;
}

.ai-next-step__icon {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  font-size: 15px;
  color: #287564;
  background: #fff;
  border: 1px solid #cee1db;
  border-radius: 8px;
}

.ai-next-step > div {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.ai-next-step small {
  font-size: 12px;
  font-weight: 700;
  color: #71867f;
}

.ai-next-step strong {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  font-weight: 600;
  color: #38594f;
  white-space: nowrap;
}

.ai-next-step__action {
  padding-left: 10px;
  border-left: 1px solid #d9e5e1;
}

.ai-next-step :deep(.ant-btn) {
  color: #256858 !important;
  background: #fff !important;
  border-color: #bed8d0 !important;
  box-shadow: none !important;
}

.ai-next-step :deep(.ant-btn:hover),
.ai-next-step :deep(.ant-btn:focus-visible) {
  color: #145548 !important;
  background: #eaf5f1 !important;
  border-color: #84b9ab !important;
}

.compact-stage-list {
  display: grid;
  gap: 8px;
  padding: 8px 0 2px;
}

.stage-tree-scroll {
  width: 100%;
  max-width: 100%;
  padding-bottom: 5px;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scrollbar-color: #a9c4bc #edf4f1;
  scrollbar-width: thin;
}

.stage-tree-scroll .compact-stage-list {
  min-width: 820px;
}

.compact-stage {
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 10px;
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease;
}

.compact-stage.is-completed .stage-row {
  background: #eff8f4;
}

.compact-stage.is-completed {
  border-color: #bcded2;
}

.compact-stage.is-active .stage-row {
  background: #eef6fb;
}

.compact-stage.is-active {
  border-color: #bfd6e5;
}

.compact-stage.is-abnormal .stage-row {
  background: #fff0ee;
}

.compact-stage.is-abnormal {
  border-color: #e9bbb5;
}

.compact-stage.is-pending .stage-row {
  background: #f5f6f7;
}

.compact-stage.is-pending {
  border-color: #dfe3e5;
}

.compact-stage.is-expanded {
  border-color: #a8cec3;
  box-shadow: 0 4px 14px rgb(43 94 80 / 7%);
}

.compact-stage.has-ai-alert.is-alert-at-risk {
  border-color: #f59e0b;
  animation: stage-pulse-amber 2.4s infinite ease-in-out;
}

.compact-stage.has-ai-alert.is-alert-blocked {
  border-color: #ef4444;
  animation: stage-pulse-red 2s infinite ease-in-out;
}

.stage-ai-pill {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 4px 10px 4px 8px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  border-radius: 999px;
  transition: all 180ms ease;
}

.stage-ai-pill.is-at-risk {
  color: #92400e;
  background: #fef3c7;
  border: 1px solid #fcd34d;
}

.stage-ai-pill.is-at-risk:hover {
  background: #fde68a;
  border-color: #f59e0b;
  box-shadow: 0 3px 8px rgb(217 119 6 / 18%);
  transform: translateY(-1px);
}

.stage-ai-pill.is-blocked {
  color: #991b1b;
  background: #fee2e2;
  border: 1px solid #fca5a5;
}

.stage-ai-pill.is-blocked:hover {
  background: #fecaca;
  border-color: #ef4444;
  box-shadow: 0 3px 8px rgb(220 38 38 / 20%);
  transform: translateY(-1px);
}

.pill-sparkle {
  font-size: 13px;
  animation: sparkle-rotate 3s infinite linear;
}

.pill-badge {
  padding: 1px 6px;
  font-size: 12px;
  font-weight: 800;
  border-radius: 999px;
}

.is-at-risk .pill-badge {
  color: #b45309;
  background: #fff;
}

.is-blocked .pill-badge {
  color: #b91c1c;
  background: #fff;
}

.stage-ai-pill-spacer {
  display: block;
}

.stage-row {
  display: grid;
  grid-template-columns: 28px minmax(230px, 1fr) minmax(190px, auto) auto;
  gap: 12px;
  align-items: center;
  min-height: 58px;
  padding: 8px 12px;
}

.expand-button {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 0;
  font-size: 15px;
  color: #527168;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 5px;
}

.expand-button:hover,
.expand-button:focus-visible {
  color: #176b5c;
  outline: 3px solid rgb(79 157 136 / 14%);
  background: #e8f4f0;
}

.expand-button.is-objective {
  width: 26px;
  height: 26px;
  font-size: 16px;
}

.tree-leaf-spacer {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  color: #a8b7b2;
}

.stage-actions {
  display: flex;
  flex-shrink: 0;
  gap: 5px;
  align-items: center;
  justify-content: flex-end;
  justify-self: end;
  margin-left: auto;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 160ms ease;
}

.compact-stage:hover > .stage-row .stage-actions,
.stage-actions:focus-within {
  pointer-events: auto;
  opacity: 1;
}

.stage-icon-action {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 28px !important;
  height: 28px !important;
  padding: 0 !important;
  color: #4b635b !important;
  background: #fff !important;
  border-color: #d1dfd9 !important;
  border-radius: 6px !important;
  transition: all 140ms ease !important;
}

.stage-icon-action:hover {
  color: #0b7062 !important;
  background: #f0f7f4 !important;
  border-color: #a7d3c4 !important;
}

.stage-icon-action.is-active-stage-btn {
  color: #245f8f !important;
  cursor: default;
  background: #e8f2f9 !important;
  border-color: #a8c9dd !important;
  opacity: 1 !important;
}

.stage-icon-action.stage-delete-action {
  color: #dc2626 !important;
  background: #fff5f5 !important;
  border-color: #fecaca !important;
}

.stage-icon-action.stage-delete-action:hover {
  color: #b91c1c !important;
  background: #fee2e2 !important;
  border-color: #fca5a5 !important;
}

.stage-icon-action.stage-detail-action:hover {
  color: #0b7062 !important;
  background: #e6f4f0 !important;
  border-color: #6ee7b7 !important;
}

.stage-row .stage-code {
  width: 34px;
  height: 34px;
}

.stage-row-title,
.objective-row-title {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.stage-row-title-top {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.node-name-editor {
  display: flex;
  gap: 6px;
  align-items: center;
  min-width: 0;
}

.node-name-editor .node-type-label {
  flex: none;
  margin-right: 0;
}

.node-name-editor :deep(.ant-input) {
  min-width: 0;
  height: 30px;
  color: #294f45;
  background: #fbfdfc;
  border-color: #b9d3cb;
  box-shadow: none;
}

.stage-row-title strong,
.objective-row-title strong {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: #2b5046;
  white-space: nowrap;
}

.stage-primary-title {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
  max-width: 100%;
  font-size: 14px !important;
  font-weight: 800;
}

.stage-order-label {
  flex: none;
  font-size: 12px;
  font-weight: 800;
  color: #45645c;
  letter-spacing: 0.02em;
}

.stage-display-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stage-primary-title.is-completed .stage-display-name {
  color: #24725f;
}

.stage-primary-title.is-current .stage-display-name {
  color: #245f8f;
}

.stage-primary-title.is-pending .stage-display-name {
  color: #596d67;
}

.stage-primary-title.is-blocked .stage-display-name {
  color: #a34a42;
}

.stage-mini-status {
  display: inline-flex;
  flex: none;
  align-items: center;
  min-height: 20px;
  padding: 0 6px;
  font-size: 12px;
  font-weight: 750;
  line-height: 1;
  border: 1px solid transparent;
  border-radius: 999px;
}

.stage-mini-status.is-completed {
  color: #24725f;
  background: #e7f4ef;
  border-color: #bdded2;
}

.stage-mini-status.is-current {
  color: #245f8f;
  background: #e8f2f9;
  border-color: #a8c9dd;
}

.stage-mini-status.is-pending {
  color: #61716c;
  background: #f0f3f2;
  border-color: #d5ddda;
}

.stage-mini-status.is-blocked {
  color: #a34a42;
  background: #fbe9e6;
  border-color: #e8bdb7;
}

.node-type-label {
  display: inline-flex;
  align-items: center;
  min-height: 18px;
  padding: 1px 6px;
  margin-right: 6px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  vertical-align: 1px;
  color: #586b65;
  background: #f3f6f5;
  border: 1px solid #dbe4e1;
  border-radius: 4px;
}

.node-type-label.is-stage {
  color: #176b5c;
  background: #eaf5f1;
  border-color: #bad9d0;
}

.node-type-label.is-objective {
  color: #315f83;
  background: #edf5fb;
  border-color: #c7ddeb;
}

.node-type-label.is-deliverable {
  color: #6a4f7e;
  background: #f4eff8;
  border-color: #ddcee8;
}

.node-type-label.is-metric {
  color: #8a5a17;
  background: #fff7e8;
  border-color: #ead6ad;
}

.stage-row-title small,
.objective-row-title small {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: #778a83;
  white-space: nowrap;
}

.stage-row-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.stage-row-meta span {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font-size: 12px;
  color: #5f766e;
  white-space: nowrap;
}

.stage-edit-fields {
  display: grid;
  grid-template-columns: minmax(130px, 1fr) minmax(130px, 1fr) minmax(
      130px,
      1fr
    );
  gap: 8px;
  padding: 8px 12px;
  background: #f7fbf9;
  border-top: 1px solid #dce8e4;
}

.stage-edit-fields label {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 7px;
  align-items: center;
  min-width: 0;
  font-size: 12px;
  color: #627a72;
}

.stage-edit-fields :deep(.ant-select),
.stage-edit-fields :deep(.ant-input) {
  width: 100%;
  min-width: 0;
}

.compact-stage :deep(.ant-btn),
.objective-form :deep(.ant-btn) {
  color: #4d675f !important;
  background: #fff !important;
  border-color: #cddcd7 !important;
  box-shadow: none !important;
}

.compact-stage :deep(.ant-btn:hover),
.compact-stage :deep(.ant-btn:focus-visible),
.objective-form :deep(.ant-btn:hover),
.objective-form :deep(.ant-btn:focus-visible) {
  color: #176b5c !important;
  background: #eef7f4 !important;
  border-color: #8fc1b4 !important;
}

.stage-flat-list {
  display: grid;
  gap: 7px;
  padding: 10px 12px 12px 52px;
  background: #f4f8f6;
  border-top: 1px solid #e1eae7;
}

.stage-flat-list__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2px 3px;
}

.stage-flat-list__head > div { display: flex; gap: 8px; align-items: center; }
.stage-flat-list__head strong { font-size: 12px; color: #31574e; }
.stage-flat-list__head span { font-size: 11px; color: #788b84; }
.stage-flat-list__head > span { padding: 2px 7px; background: #e7efec; border-radius: 999px; }

.stage-flat-item {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) 120px auto;
  gap: 10px;
  align-items: center;
  min-height: 64px;
  padding: 9px 10px;
  background: #fff;
  border: 1px solid #dbe6e2;
  border-radius: 9px;
}

.stage-flat-item:hover { border-color: #b8d2ca; }
.flat-item-icon { display: grid; place-items: center; width: 32px; height: 32px; font-size: 15px; color: #236b5b; background: #e7f3ef; border-radius: 8px; }
.stage-flat-item.is-deliverable .flat-item-icon { color: #65508e; background: #f0eaf7; }
.stage-flat-item.is-metric .flat-item-icon { color: #996515; background: #fff3df; }
.flat-item-copy { display: grid; gap: 3px; min-width: 0; }
.flat-item-copy > div { display: flex; gap: 6px; align-items: center; }
.flat-item-copy strong,
.flat-item-copy small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.flat-item-copy strong { font-size: 12px; color: #31564d; }
.flat-item-copy small { font-size: 11px; color: #74877f; }
.flat-item-code,
.flat-item-parent { font-size: 10px; color: #8a9a95; }
.flat-item-progress { display: grid; gap: 4px; min-width: 0; }
.flat-item-progress b { overflow: hidden; font-size: 10px; font-weight: 650; color: #587069; text-overflow: ellipsis; white-space: nowrap; }
.flat-item-progress :deep(.ant-progress-line) { margin: 0; }
.flat-item-actions { display: flex; gap: 5px; justify-content: flex-end; }
.stage-flat-create { padding-top: 3px; }
.stage-flat-create-actions { display: flex; gap: 7px; }
.flat-create-form { display: grid; grid-template-columns: 112px minmax(180px, 1fr) 120px 140px auto auto; gap: 7px; align-items: center; padding: 9px; background: #fff; border: 1px dashed #a9c8bf; border-radius: 9px; }
.flat-create-form :deep(.ant-select) { width: 100%; }

.objective-list {
  position: relative;
  display: grid;
  gap: 6px;
  padding: 8px 10px 10px 71px;
  background: #f3f7f5;
  border-top: 1px solid #e3ece8;
}

.objective-list::before {
  position: absolute;
  top: 18px;
  bottom: 16px;
  left: 54px;
  width: 2px;
  content: '';
  background: #cbd9e5;
  border-radius: 999px;
}

.objective-branch {
  position: relative;
  display: grid;
  gap: 6px;
  padding-left: 18px;
}

.objective-branch::before {
  position: absolute;
  top: 25px;
  left: 0;
  width: 18px;
  height: 2px;
  content: '';
  background: #cbd9e5;
}

.objective-row {
  display: grid;
  grid-template-columns: 28px minmax(180px, 1fr) 76px auto auto;
  gap: 9px;
  align-items: center;
  min-height: 52px;
  padding: 7px 9px;
  background: #fff;
  border: 1px solid #dce7e3;
  border-radius: 8px;
}

.objective-row.is-editing {
  grid-template-columns: 28px minmax(0, 1fr) auto;
}

.objective-row-actions {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: flex-end;
}

.executor-progress-button,
.executor-upload-button {
  color: #245f55 !important;
  background: #edf7f3 !important;
  border-color: #b9d9cf !important;
  box-shadow: none !important;
}

.executor-progress-button:hover,
.executor-progress-button:focus-visible,
.executor-upload-button:hover,
.executor-upload-button:focus-visible {
  color: #0f6659 !important;
  background: #e1f2ec !important;
  border-color: #80b8a8 !important;
}

.objective-edit-content {
  display: grid;
  grid-template-columns:
    minmax(150px, 1fr) minmax(92px, 0.36fr) minmax(112px, 0.48fr)
    minmax(124px, 0.42fr);
  gap: 7px;
  min-width: 0;
}

.objective-edit-content :deep(.ant-select),
.objective-edit-content :deep(.ant-input) {
  width: 100%;
  min-width: 0;
}

.tree-kr-list {
  position: relative;
  display: grid;
  gap: 5px;
  padding-left: 50px;
}

.tree-kr-list::before {
  position: absolute;
  top: 0;
  bottom: 24px;
  left: 31px;
  width: 2px;
  content: '';
  background: #d8cae4;
}

.tree-kr-row {
  position: relative;
  display: grid;
  grid-template-columns: minmax(160px, 1fr) 90px 98px auto;
  gap: 8px;
  align-items: center;
  min-height: 48px;
  padding: 7px 9px;
  background: #fff;
  border: 1px solid #e1d9e8;
  border-radius: 8px;
}

.tree-kr-row.has-executor-action {
  grid-template-columns: minmax(160px, 1fr) 90px 98px auto minmax(92px, auto);
}

.tree-kr-row.is-editing {
  grid-template-columns: minmax(0, 1fr) auto;
}

.kr-edit-content {
  display: grid !important;
  grid-template-columns: minmax(150px, 1fr) minmax(92px, 0.35fr) minmax(
      124px,
      0.45fr
    );
  gap: 7px !important;
  min-width: 0;
}

.kr-edit-content :deep(.ant-select),
.kr-edit-content :deep(.ant-input) {
  width: 100%;
  min-width: 0;
}

.tree-kr-row::before {
  position: absolute;
  top: 23px;
  left: -19px;
  width: 18px;
  height: 2px;
  content: '';
  background: #d8cae4;
}

.tree-kr-row > div {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.tree-kr-row strong,
.tree-kr-row small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-kr-row strong {
  font-size: 12px;
  color: #4e415d;
}

.tree-kr-row small {
  font-size: 12px;
  color: #83768f;
}

.tree-kr-row > span:not(.status-pill) {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font-size: 12px;
  color: #6e6577;
  white-space: nowrap;
}

.executor-deliverable-action {
  display: flex !important;
  gap: 7px !important;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
}

.executor-deliverable-action > small {
  max-width: 84px;
  overflow: hidden;
  font-size: 12px;
  color: #4f7469;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.executor-progress-panel {
  display: grid;
  gap: 16px;
}

.executor-progress-panel > header {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 14px;
  background: #f6faf8;
  border: 1px solid #d2e1dc;
  border-radius: 11px;
}

.executor-progress-panel > header > span {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  font-size: 21px;
  color: #246b5c;
  background: #e5f2ed;
  border-radius: 11px;
}

.executor-progress-panel h3,
.executor-progress-panel p {
  margin: 0;
}

.executor-progress-panel h3 {
  margin: 2px 0;
  font-size: 15px;
  color: #234b41;
}

.executor-progress-panel small,
.executor-progress-panel p,
.executor-progress-panel label > span,
.executor-progress-panel > aside {
  font-size: 12px;
  color: #677e76;
}

.executor-progress-value {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  padding: 14px;
  background: #fff;
  border: 1px solid #d5e2de;
  border-radius: 10px;
}

.executor-progress-value > span {
  font-size: 12px;
  color: #60776f;
}

.executor-progress-value > strong {
  font-size: 17px;
  color: #245f55;
}

.executor-progress-value :deep(.ant-progress) {
  grid-column: 1 / -1;
}

.executor-progress-input,
.executor-progress-note {
  display: grid;
  gap: 7px;
}

.executor-progress-input > span,
.executor-progress-note > span {
  font-weight: 700;
  color: #405f57 !important;
}

.executor-progress-presets {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.executor-progress-presets :deep(.ant-btn) {
  min-height: 36px;
  color: #526e66;
  background: #fff;
  border-color: #d1dfdb;
}

.executor-progress-presets :deep(.ant-btn.is-active) {
  color: #155e51;
  background: #e6f3ee;
  border-color: #78ad9f;
}

.executor-progress-panel > aside {
  display: flex;
  gap: 7px;
  align-items: flex-start;
  padding: 10px 12px;
  line-height: 1.55;
  background: #f7faf9;
  border: 1px solid #dbe6e2;
  border-radius: 8px;
}

.executor-progress-panel > aside svg {
  flex: none;
  margin-top: 2px;
}

.executor-progress-panel > footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 4px;
}

.inline-add-trigger {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  min-height: 30px;
  padding: 5px 8px;
  font-size: 12px;
  color: #60766f;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 1px dashed #c7d7d2;
  border-radius: 7px;
}

.inline-add-trigger:hover,
.inline-add-trigger:focus-visible {
  color: #176b5c;
  outline: 2px solid rgb(79 157 136 / 14%);
  background: #eef7f4;
  border-color: #8fc1b4;
}

.inline-add-trigger.is-objective {
  margin-left: 0;
}

.inline-create-row {
  display: grid;
  gap: 7px;
  align-items: center;
  min-height: 46px;
  padding: 7px 8px;
  background: #fff;
  border: 1px solid #b9d6ce;
  border-radius: 8px;
  box-shadow: 0 3px 12px rgb(42 90 77 / 7%);
}

.inline-create-row.is-objective {
  grid-template-columns: auto minmax(180px, 1fr) 110px 135px auto;
}

.inline-create-row.is-kr {
  position: relative;
  grid-template-columns: 120px minmax(180px, 1fr) 110px 135px auto;
}

.inline-create-row.is-kr::before,
.inline-add-trigger.is-kr::before {
  position: absolute;
  top: 50%;
  left: -19px;
  width: 18px;
  height: 2px;
  content: '';
  background: #d8cae4;
}

.inline-add-trigger.is-kr {
  position: relative;
}

.inline-create-row > div {
  display: flex;
  gap: 5px;
  justify-content: flex-end;
}

.inline-create-row :deep(.ant-input),
.inline-create-row :deep(.ant-select-selector) {
  color: #34584e !important;
  background: #fbfdfc !important;
  border-color: #cfddd8 !important;
  box-shadow: none !important;
}

.objective-code {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  font-size: 12px;
  font-weight: 800;
  color: #4d6f94;
  background: #eaf0f6;
  border: 1px solid #ccd9e6;
  border-radius: 7px;
}

.objective-kr-count {
  font-size: 12px;
  color: #687d75;
  text-align: center;
}

.empty-objectives {
  padding: 12px;
  margin: 0;
  font-size: 12px;
  color: #71857e;
  text-align: center;
  background: #fff;
  border: 1px dashed #cfded9;
  border-radius: 8px;
}

:global(.project-light-drawer) {
  color-scheme: light;
}

:global(.project-light-drawer .ant-drawer-content),
:global(.project-light-drawer .ant-drawer-header),
:global(.project-light-drawer .ant-drawer-body) {
  color: #294b42 !important;
  background: #f8fbfa !important;
}

:global(.project-light-drawer .ant-drawer-content-wrapper) {
  max-width: calc(100vw - 16px);
  box-shadow: -18px 0 48px rgb(31 70 59 / 16%) !important;
}

:global(.project-light-drawer .ant-drawer-header) {
  border-bottom: 1px solid #dce8e4 !important;
}

:global(.project-light-drawer .ant-drawer-title) {
  color: #23483f !important;
}

:global(.project-light-drawer .ant-drawer-close) {
  color: #5f766f !important;
  background: #f1f6f4 !important;
}

.node-detail,
.objective-form {
  display: grid;
  gap: 14px;
  color: #2c4f46;
}

.node-detail > header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 12px;
  background: #f5f9f7;
  border: 1px solid #dce8e4;
  border-radius: 10px;
}

.node-detail h3 {
  margin: 0;
  font-size: 15px;
  color: #244a40;
}

.node-detail header p,
.objective-form > p {
  margin: 3px 0 0;
  font-size: 12px;
  line-height: 1.55;
  color: #6c8079;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.detail-grid article {
  display: grid;
  gap: 4px;
  padding: 10px;
  background: #fff;
  border: 1px solid #e0e9e6;
  border-radius: 8px;
}

.detail-grid span {
  font-size: 12px;
  color: #788a84;
}

.detail-grid strong {
  font-size: 12px;
  color: #34584e;
}

.detail-rules {
  display: grid;
  gap: 7px;
}

.detail-rules p {
  display: grid;
  gap: 3px;
  padding: 10px;
  margin: 0;
  font-size: 12px;
  color: #62776f;
  background: #f6f9f8;
  border-radius: 8px;
}

.detail-rules b {
  color: #33584e;
}

.detail-kr-list {
  display: grid;
  gap: 6px;
}

.detail-kr-list article {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 9px;
  align-items: center;
  padding: 9px 10px;
  background: #f7faf9;
  border: 1px solid #e0e9e6;
  border-radius: 8px;
}

.detail-kr-list article > svg {
  font-size: 16px;
  color: #397a6a;
}

.detail-kr-list article > div {
  display: grid;
  gap: 2px;
}

.detail-kr-list strong {
  font-size: 12px;
  color: #365a50;
}

.detail-kr-list small,
.detail-kr-list article > span {
  font-size: 12px;
  color: #71847e;
}

.objective-form > label,
.objective-form > div > label {
  display: grid;
  gap: 5px;
  font-size: 12px;
  font-weight: 700;
  color: #4a665d;
}

.objective-form > div {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.objective-form footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.tree-legend {
  display: flex;
  gap: 7px;
  align-items: center;
  padding: 12px 4px 2px;
  font-size: 12px;
  color: #657a73;
}

.tree-legend span {
  display: inline-flex;
  gap: 5px;
  align-items: center;
}

.tree-legend i {
  width: 8px;
  height: 8px;
  background: #4f9d88;
  border-radius: 2px;
}

.tree-legend i.is-objective {
  background: #6e8db2;
}

.tree-legend i.is-kr {
  background: #9b7bb5;
}

.tree-legend svg {
  font-size: 12px;
  color: #a0afa9;
}

.drawer-project-summary {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  padding: 16px;
  background: #f5faf8;
  border: 1px solid #dbe9e4;
  border-radius: 13px;
}

.drawer-project-summary > div > span {
  margin-right: 5px;
}

.drawer-project-summary h2 {
  margin: 10px 0 4px;
  font-size: 18px;
  color: #23473e;
}

.drawer-project-summary p {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: #667b74;
}

.stage-tree {
  position: relative;
  display: grid;
  gap: 12px;
  padding-left: 20px;
  margin-top: 14px;
}

.stage-tree::before {
  position: absolute;
  top: 10px;
  bottom: 10px;
  left: 6px;
  width: 2px;
  content: '';
  background: #c7ded6;
  border-radius: 999px;
}

.stage-card {
  position: relative;
  padding: 15px;
  background: #fff;
  border: 1px solid #dbe8e4;
  border-radius: 13px;
}

.stage-card::before {
  position: absolute;
  top: 26px;
  left: -15px;
  width: 15px;
  height: 2px;
  content: '';
  background: #c7ded6;
}

.stage-card::after {
  position: absolute;
  top: 21px;
  left: -19px;
  width: 10px;
  height: 10px;
  content: '';
  background: #4f9d88;
  border: 2px solid #fbfdfc;
  border-radius: 50%;
}

.stage-card > header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 10px;
  align-items: start;
}

.stage-code {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  font-size: 12px;
  font-weight: 800;
  color: #176b5c;
  background: #e4f2ed;
  border: 1px solid #bddcd2;
  border-radius: 10px;
}

.stage-card > header strong {
  font-size: 13px;
  color: #254940;
}

.stage-card > header p {
  margin: 3px 0 0;
  font-size: 12px;
  color: #72857e;
}

.stage-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  padding: 11px 0;
  font-size: 12px;
  color: #637870;
}

.stage-meta span {
  display: inline-flex;
  gap: 5px;
  align-items: center;
}

.stage-gates {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.stage-gates p {
  display: grid;
  gap: 3px;
  padding: 9px 10px;
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: #647970;
  background: #f7faf9;
  border-radius: 8px;
}

.stage-gates b {
  color: #345a50;
}

.objective-card {
  position: relative;
  margin-top: 10px;
  margin-left: 24px;
  overflow: visible;
  border: 1px solid #e0eae6;
  border-left: 3px solid #86a3c3;
  border-radius: 10px;
}

.objective-card::before {
  position: absolute;
  top: 22px;
  left: -27px;
  width: 24px;
  height: 2px;
  content: '';
  background: #d2dfeb;
}

.objective-card > header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 9px;
  align-items: center;
  padding: 10px 12px;
  background: #f3f8f6;
}

.objective-card > header > span {
  font-size: 12px;
  font-weight: 800;
  color: #247462;
}

.objective-card > header div {
  display: grid;
  gap: 2px;
}

.objective-card > header strong {
  font-size: 12px;
  color: #2c5047;
}

.objective-card > header small {
  font-size: 12px;
  color: #778982;
}

.objective-card > header > b {
  font-size: 13px;
  color: #347c6a;
}

.objective-state {
  display: flex !important;
  gap: 8px !important;
  align-items: center;
}

.objective-state > b {
  font-size: 12px;
  color: #347c6a;
}

.kr-list article {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) 120px;
  gap: 9px;
  align-items: center;
  min-height: 58px;
  padding: 8px 12px;
  margin-left: 18px;
  border-top: 1px solid #edf2f0;
}

.kr-icon {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  color: #16736d;
  background: #e3f3f1;
  border-radius: 8px;
}

.kr-icon.is-metric {
  color: #6d55a1;
  background: #efeaf7;
}

.kr-list article > div:nth-child(2) {
  display: grid;
  gap: 3px;
}

.kr-list article strong {
  font-size: 12px;
  color: #34564e;
}

.kr-list article small,
.kr-progress span {
  font-size: 12px;
  color: #778982;
}

.kr-progress {
  display: grid;
  gap: 3px;
}

.light-primary-action {
  color: #176b5c !important;
  background: #e7f5ef !important;
  border-color: #afd7ca !important;
  box-shadow: none !important;
}

.light-primary-action:hover,
.light-primary-action:focus-visible {
  color: #10594d !important;
  background: #dcefe8 !important;
  border-color: #83bdae !important;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  white-space: nowrap;
  border: 0;
  clip: rect(0, 0, 0, 0);
}

/* 阶段树保持完整列宽，空间不足时由外层横向滚动承载。 */
.stage-tree-scroll .stage-row {
  grid-template-columns: 28px minmax(230px, 1fr) minmax(190px, auto) auto;
  padding: 8px 12px;
}

.stage-tree-scroll .stage-row-meta {
  flex-wrap: nowrap;
  grid-row: auto;
  grid-column: 3;
}

.stage-tree-scroll .stage-row > .status-pill {
  position: static;
  grid-row: auto;
  grid-column: 4;
  transform: none;
}

.stage-tree-scroll .stage-row > .stage-actions {
  position: static;
  grid-row: auto;
  grid-column: 4;
  justify-self: end;
  margin-left: auto;
  transform: none;
}

.stage-tree-scroll .stage-edit-fields {
  grid-template-columns: repeat(3, minmax(130px, 1fr));
}

.stage-tree-scroll .stage-edit-fields label:first-child {
  grid-column: auto;
}

.stage-tree-scroll .objective-list {
  padding: 8px 10px 10px 71px;
}

.stage-tree-scroll .objective-list::before {
  left: 54px;
}

.stage-tree-scroll .objective-row {
  grid-template-columns: 28px minmax(180px, 1fr) 76px auto auto;
}

.stage-tree-scroll .objective-row.is-editing {
  grid-template-columns: 28px minmax(0, 1fr) auto;
}

.stage-tree-scroll .objective-edit-content {
  grid-template-columns:
    minmax(150px, 1fr) minmax(92px, 0.36fr) minmax(112px, 0.48fr)
    minmax(124px, 0.42fr);
}

.stage-tree-scroll .objective-edit-content > :deep(.ant-input) {
  grid-column: auto;
}

.stage-tree-scroll .objective-kr-count {
  display: inline;
}

.stage-tree-scroll .objective-row > .status-pill,
.stage-tree-scroll .objective-row > :deep(.ant-btn) {
  grid-row: auto;
  grid-column: auto;
}

.stage-tree-scroll .tree-kr-list {
  padding-left: 50px;
}

.stage-tree-scroll .tree-kr-list::before {
  left: 31px;
}

.stage-tree-scroll .tree-kr-row {
  grid-template-columns: minmax(160px, 1fr) 90px 98px auto;
}

.stage-tree-scroll .tree-kr-row.has-executor-action {
  grid-template-columns: minmax(160px, 1fr) 90px 98px auto minmax(92px, auto);
}

.stage-tree-scroll .tree-kr-row.is-editing {
  grid-template-columns: minmax(0, 1fr) auto;
}

.stage-tree-scroll .kr-edit-content {
  grid-template-columns: minmax(150px, 1fr) minmax(92px, 0.35fr) minmax(
      124px,
      0.45fr
    );
}

.stage-tree-scroll .tree-kr-row > .status-pill,
.stage-tree-scroll .tree-kr-row > span:not(.status-pill) {
  grid-row: auto;
  grid-column: auto;
}

.stage-tree-scroll .inline-create-row.is-objective {
  grid-template-columns: auto minmax(180px, 1fr) 110px 135px auto;
}

.stage-tree-scroll .inline-create-row.is-kr {
  grid-template-columns: 120px minmax(180px, 1fr) 110px 135px auto;
}

/* 阶段全局管控大抽屉 (760px) 样式 */
.stage-mgmt-drawer :deep(.ant-drawer-header) {
  display: none;
}

.stage-mgmt-drawer :deep(.ant-drawer-body) {
  padding: 0;
  background: #f8faf9;
}

.stage-mgmt-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.stage-mgmt-head {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px 20px;
  background: #fff;
  border-bottom: 1px solid #e2ece8;
}

.stage-mgmt-head-info {
  display: grid;
  gap: 4px;
}

.stage-head-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.stage-mgmt-code {
  display: inline-flex;
  padding: 2px 7px;
  font-size: 12px;
  font-weight: 800;
  color: #0b7062;
  background: #e6f4f0;
  border-radius: 4px;
}

.stage-period-text,
.stage-owner-chip {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font-size: 12px;
  color: #657b74;
}

.stage-owner-chip {
  padding: 1px 6px;
  background: #f0f7f4;
  border-radius: 4px;
}

.stage-mgmt-head-info h2 {
  margin: 3px 0 0;
  font-size: 17px;
  font-weight: 800;
  color: #173b33;
}

.stage-mgmt-head-info p {
  margin: 0;
  font-size: 12px;
  color: #657b74;
}

/* 抽屉双栏布局 */
.stage-mgmt-split-layout {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: #f8faf9;
}

/* 左侧简版菜单 */
.stage-mgmt-sidebar-menu {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 6px;
  width: 175px;
  padding: 16px 12px;
  background: #eff6f3;
  border-right: 1px solid #dce8e3;
}

.sidebar-menu-btn {
  position: relative;
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 10px;
  transition: all 160ms ease;
}

.sidebar-menu-btn:hover {
  color: #0b7062;
  background: #e2eee8;
}

.sidebar-menu-btn.is-active {
  background: #fff;
  border-color: #cce0d8;
  box-shadow: 0 2px 8px rgb(18 57 45 / 8%);
}

.sidebar-menu-btn .menu-icon {
  display: flex;
  align-items: center;
  font-size: 16px;
  color: #55726a;
}

.sidebar-menu-btn.is-active .menu-icon {
  color: #0b7062;
}

.sidebar-menu-btn.is-ai-btn .menu-icon {
  color: #7c3aed;
}

.sidebar-menu-btn .menu-texts {
  display: grid;
  flex: 1;
  gap: 2px;
  min-width: 0;
}

.sidebar-menu-btn .menu-texts strong {
  font-size: 12px;
  color: #173b33;
}

.sidebar-menu-btn.is-active .menu-texts strong {
  font-weight: 800;
  color: #0b7062;
}

.sidebar-menu-btn .menu-texts small {
  font-size: 12px;
  color: #728c83;
}

.sidebar-menu-btn .menu-badge {
  padding: 1px 6px;
  font-size: 12px;
  font-weight: 700;
  color: #0b7062;
  background: #d8ece4;
  border-radius: 10px;
}

.sidebar-menu-btn .menu-alert-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 15px;
  height: 15px;
  font-size: 12px;
  font-weight: 900;
  color: #fff;
  background: #ef4444;
  border-radius: 50%;
}

/* 右侧主内容区 */
.stage-mgmt-main-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 14px;
  padding: 16px 22px;
  overflow-y: auto;
}

.tab-pane {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Tab 1: 概览与门禁流转 */
.overview-metric-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.overview-metric-item {
  display: grid;
  gap: 4px;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #dce7e3;
  border-radius: 10px;
}

.overview-metric-item small {
  font-size: 12px;
  color: #6a827a;
}

.metric-progress-box {
  display: grid;
  gap: 4px;
}

.metric-progress-box strong {
  font-size: 15px;
  color: #173c34;
}

.metric-text-val {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 12px;
  color: #274c42;
}

.gate-block {
  display: grid;
  gap: 10px;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #dce7e3;
  border-radius: 12px;
}

.gate-block.is-exit-block {
  border-left: 3px solid #f59e0b;
}

.gate-block-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.gate-block-head h4 {
  display: flex;
  gap: 6px;
  align-items: center;
  margin: 0 0 2px;
  font-size: 13px;
  font-weight: 800;
  color: #193f36;
}

.gate-icon-entry {
  color: #0b806f;
}

.gate-icon-exit {
  color: #d97706;
}

.gate-block-head p {
  margin: 0;
  font-size: 12px;
  color: #728780;
}

.gate-items-grid {
  display: grid;
  gap: 8px;
}

.gate-card {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  background: #f9fbfa;
  border: 1px solid #e1ece8;
  border-radius: 8px;
}

.gate-card.is-satisfied {
  background: #f4faf7;
  border-color: #cfe2da;
}

.gate-card.is-exit-card.is-blocked {
  background: #fef7f7;
  border-color: #fcdad7;
}

.gate-card-left {
  display: flex;
  flex: 1;
  gap: 10px;
  align-items: flex-start;
  min-width: 0;
}

.gate-status-icon {
  margin-top: 2px;
  font-size: 15px;
}

.gate-card.is-satisfied .gate-status-icon {
  color: #10b981;
}

.gate-card.is-blocked .gate-status-icon {
  color: #ef4444;
}

.gate-card-content {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.gate-card-top {
  display: flex;
  gap: 6px;
  align-items: center;
}

.gate-card-top strong {
  font-size: 12px;
  color: #193e35;
}

.gate-metrics-compare {
  display: flex;
  gap: 14px;
  font-size: 12px;
  color: #617b73;
}

.gate-card-content p {
  margin: 0;
  font-size: 12px;
  color: #718881;
}

/* 阶段流转控制台 */
.stage-transition-console {
  display: grid;
  gap: 12px;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #cfe2da;
  border-radius: 12px;
  box-shadow: 0 3px 10px rgb(18 57 45 / 4%);
}

.console-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.console-head h4 {
  display: flex;
  gap: 6px;
  align-items: center;
  margin: 0 0 2px;
  font-size: 13px;
  font-weight: 800;
  color: #193f36;
}

.console-head p {
  margin: 0;
  font-size: 12px;
  color: #6a827a;
}

.console-actions-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #f4f8f6;
  border-radius: 8px;
}

.console-state-info {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 12px;
}

.console-state-info .state-label {
  font-weight: 700;
  color: #4b675f;
}

.console-btn-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 留痕记录 */
.transition-history-section {
  display: grid;
  gap: 8px;
  padding: 12px 14px;
  background: #fff;
  border: 1px solid #dce7e3;
  border-radius: 10px;
}

.history-head h5 {
  display: flex;
  gap: 6px;
  align-items: center;
  margin: 0;
  font-size: 12px;
  font-weight: 800;
  color: #274c42;
}

.history-list {
  display: grid;
  gap: 8px;
}

.history-item {
  display: grid;
  gap: 4px;
  padding: 8px 10px;
  background: #f7faf9;
  border-left: 3px solid #0b806f;
  border-radius: 6px;
}

.history-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  color: #728780;
}

.history-flow-text {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 12px;
  color: #193f36;
}

.history-reason {
  margin: 0;
  font-size: 12px;
  color: #557068;
}

/* Tab 2: 业务模块交付看板 */
.modules-intro,
.vault-intro {
  padding: 8px 12px;
  background: #eef6f3;
  border: 1px solid #dce8e3;
  border-radius: 8px;
}

.modules-intro p,
.vault-intro p {
  display: flex;
  gap: 6px;
  align-items: center;
  margin: 0;
  font-size: 12px;
  color: #4b675f;
}

.modules-cards-list {
  display: grid;
  gap: 12px;
}

.module-card {
  display: grid;
  gap: 10px;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #dce7e3;
  border-radius: 12px;
}

.module-card.is-health-blocked {
  border-left: 3px solid #ef4444;
}

.module-card.is-health-at-risk {
  border-left: 3px solid #f59e0b;
}

.module-card.is-health-healthy {
  border-left: 3px solid #10b981;
}

.module-card-head {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
}

.module-head-title {
  display: flex;
  gap: 8px;
  align-items: center;
}

.module-code-badge {
  padding: 2px 6px;
  font-size: 12px;
  font-weight: 800;
  color: #0b7062;
  background: #e6f4f0;
  border-radius: 4px;
}

.module-head-title h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 800;
  color: #1a4138;
}

.module-head-meta {
  display: flex;
  gap: 8px;
  align-items: center;
}

.module-owner-tag {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font-size: 12px;
  color: #657b74;
}

.module-desc {
  margin: 0;
  font-size: 12px;
  color: #5d756e;
}

/* 可展开的阶段里程碑全景 */
.stage-flow-strip {
  display: grid;
  padding: 8px 12px;
  margin-bottom: 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgb(15 41 37 / 4%);
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease;
}

.stage-flow-strip.is-expanded {
  border-color: #c8ded7;
  box-shadow: 0 4px 14px rgb(11 110 101 / 6%);
}

.stage-flow-strip__header {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  min-height: 36px;
}

.strip-label {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  font-size: 12px;
  font-weight: 800;
  color: #0b7062;
  white-space: nowrap;
}

.stage-flow-toggle {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  justify-content: center;
  min-width: 70px;
  min-height: 34px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 700;
  color: #0b6e65;
  cursor: pointer;
  background: #f4faf7;
  border: 1px solid #cfe1db;
  border-radius: 8px;
  transition:
    color 180ms ease,
    background 180ms ease,
    border-color 180ms ease;
}

.stage-flow-toggle:hover {
  color: #075c54;
  background: #edf6f2;
  border-color: #91bfb4;
}

.stage-flow-toggle:focus-visible,
.milestone-item:focus-visible {
  outline: 3px solid rgb(11 128 111 / 20%);
  outline-offset: 2px;
}

.milestone-scroll {
  padding: 8px 2px 4px;
  overflow-x: auto;
  border-top: 1px solid #edf2f0;
}

.milestone-track {
  position: relative;
  display: flex;
  gap: 16px;
  min-width: max-content;
  padding: 8px 0 2px;
}

.milestone-track::before {
  position: absolute;
  top: calc(50% + 3px);
  right: 72px;
  left: 72px;
  z-index: 0;
  height: 2px;
  pointer-events: none;
  content: '';
  background: #b8cdc6;
}

.milestone-item {
  position: relative;
  z-index: 1;
  display: block;
  flex: 1 0 144px;
  min-width: 144px;
  max-width: 200px;
  padding: 0;
  color: #37534b;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.milestone-card {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 8px;
  align-content: space-between;
  width: 100%;
  min-height: 74px;
  padding: 11px 12px;
  text-align: center;
  background: #f6f8f7;
  border: 1px solid #dce8e4;
  border-radius: 9px;
  box-shadow: 0 1px 2px rgb(15 41 37 / 4%);
  transition:
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease;
}

.milestone-card strong {
  position: relative;
  z-index: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  line-height: 1.4;
  color: #24483f;
  white-space: nowrap;
}

.milestone-card > span {
  position: relative;
  z-index: 2;
  font-size: 12px;
  color: #687f78;
}

.milestone-item:hover .milestone-card {
  border-color: #90bdb2;
  box-shadow: 0 4px 10px rgb(11 110 101 / 8%);
}

.milestone-item.is-completed .milestone-card {
  background: #eef7f3;
  border-color: #c5dfd6;
}

.milestone-item.is-current .milestone-card {
  background: #edf5fb;
  border-color: #9fc3dc;
}

.milestone-item.is-current .milestone-card strong {
  color: #245f8f;
}

.milestone-item.is-completed .milestone-card strong {
  color: #0b6e65;
}

.milestone-item.is-blocked .milestone-card {
  background: #fff4f2;
  border-color: #e9b8b2;
}

/* 阶段卡片高亮与标志 */
.compact-stage.is-current-stage {
  position: relative;
  z-index: 2;
  background: #f3f8fc !important;
  border: 2px solid #4f91bc !important;
  box-shadow:
    0 4px 16px rgb(47 121 170 / 12%),
    0 0 0 2px rgb(47 121 170 / 14%) !important;
}

.stage-row.is-active-stage-row {
  background: linear-gradient(90deg, #edf5fb 0%, #fff 100%) !important;
}

.compact-stage.is-completed-stage {
  background: #fbfdfc;
  border-left: 3px solid #10b981 !important;
}

.current-active-stage-flag {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 800;
  color: #245f8f;
  background: #e8f2f9;
  border: 1px solid #a8c9dd;
  border-radius: 6px;
}

.ping-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 0 0 rgb(16 185 129 / 70%);
  animation: pulse-ring 1.8s infinite ease-in-out;
}

.completed-stage-flag {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 2px 7px;
  font-size: 12px;
  font-weight: 700;
  color: #047857;
  background: #e6f4ed;
  border-radius: 6px;
}

.pending-stage-flag {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 2px 7px;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  background: #f3f4f6;
  border-radius: 6px;
}

.stage-activate-action {
  font-weight: 700 !important;
  color: #059669 !important;
  background: #ecfdf5 !important;
  border-color: #6ee7b7 !important;
}

.stage-activate-action:hover {
  background: #d1fae5 !important;
}

.stage-current-indicator {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 800;
  color: #245f8f;
  background: #e8f2f9;
  border-radius: 6px;
}

/* 月度周报与人+周次卡片 */
.report-list-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

.report-search-input {
  max-width: 360px;
}

.report-search-input :deep(.ant-input-affix-wrapper),
.report-search-input :deep(input) {
  background: #fff;
}

.report-result-count {
  flex: none;
  font-size: 12px;
  color: #60756e;
}

.monthly-report-groups {
  display: grid;
  gap: 8px;
}

.month-group-card {
  overflow: hidden;
  background: #fff;
  border: 1px solid #dce8e3;
  border-radius: 10px;
}

.month-group-header {
  display: flex;
  gap: 8px;
  align-items: center;
  min-height: 44px;
  padding: 7px 12px;
  cursor: pointer;
  user-select: none;
  list-style: none;
}

.month-group-header::-webkit-details-marker {
  display: none;
}

.month-group-header:hover {
  background: #f6faf8;
}

.month-group-header:focus-visible {
  outline: 2px solid #1d6f9f;
  outline-offset: -2px;
}

.month-calendar-icon {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  font-size: 14px;
  color: #0b7062;
  background: #e6f4f0;
  border-radius: 6px;
}

.month-group-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  color: #1a4238;
}

.month-count-pill {
  padding: 2px 7px;
  font-size: 12px;
  font-weight: 700;
  color: #0b7062;
  background: #d5eee5;
  border-radius: 10px;
}

.month-chevron {
  margin-left: auto;
  color: #6b827b;
  transition: transform 180ms ease;
}

.month-group-card[open] .month-chevron {
  transform: rotate(180deg);
}

.month-reports-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding: 10px 12px 12px;
  border-top: 1px solid #edf4f1;
}

.person-week-card {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) 16px;
  gap: 9px;
  align-items: center;
  min-height: 60px;
  padding: 8px 10px;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: #fbfdfc;
  border: 1px solid #e1ece8;
  border-radius: 8px;
  transition:
    border-color 150ms ease,
    background 150ms ease;
}

.person-week-card:hover {
  background: #f4f9f7;
  border-color: #9fc9bc;
}

.person-week-card:focus-visible {
  outline: 2px solid #1d6f9f;
  outline-offset: 2px;
}

.person-week-card.is-blocked {
  border-left: 3px solid #ef4444;
}

.person-week-card.is-delayed,
.person-week-card.is-at-risk {
  border-left: 3px solid #f59e0b;
}

.report-avatar {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  font-size: 13px;
  font-weight: 800;
  color: #245f8f;
  background: #e8f2f9;
  border: 1px solid #b7d1e2;
  border-radius: 50%;
}

.compact-report-body {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.compact-report-line {
  display: flex;
  align-items: center;
  min-width: 0;
}

.compact-report-line.is-primary {
  gap: 7px;
  font-size: 12px;
  color: #173f35;
}

.compact-report-line.is-primary strong {
  flex: none;
  font-size: 12px;
}

.compact-report-title {
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
  color: #385b52;
  white-space: nowrap;
}

.compact-report-line.is-secondary {
  gap: 7px;
  overflow: hidden;
  font-size: 12px;
  color: #748981;
  white-space: nowrap;
}

.report-week-chip {
  flex: none;
  padding: 1px 6px;
  font-weight: 700;
  color: #245f8f;
  background: #e8f2f9;
  border-radius: 8px;
}

.compact-report-risk {
  flex: none;
  font-weight: 700;
  color: #b42318;
}

.compact-report-arrow {
  color: #82978f;
}

.weekly-report-preview {
  display: grid;
  gap: 16px;
  color: #294c43;
}

.weekly-report-preview-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.weekly-report-preview-head h4 {
  margin: 3px 0;
  font-size: 16px;
  color: #173f35;
}

.weekly-report-preview-head small {
  color: #71877f;
}

.weekly-report-preview-summary {
  padding: 12px 14px;
  margin: 0;
  line-height: 1.65;
  background: #f6faf8;
  border: 1px solid #e0ebe7;
  border-radius: 8px;
}

.weekly-report-preview-progress {
  display: grid;
  grid-template-columns: 90px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  font-size: 12px;
}

.weekly-report-preview-section {
  display: grid;
  gap: 8px;
}

.weekly-report-preview-files {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.weekly-report-preview-files span,
.weekly-report-preview-section.is-risk p {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 7px 9px;
  margin: 0;
  font-size: 12px;
  color: #315b51;
  background: #f3f8f6;
  border: 1px solid #dce8e4;
  border-radius: 7px;
}

.weekly-report-preview-section.is-risk p {
  color: #9f241a;
  background: #fff7f6;
  border-color: #f3cbc7;
}

:global(.weekly-report-preview-modal .ant-modal-content),
:global(.weekly-report-preview-modal .ant-modal-header) {
  background: #fff !important;
}

/* 抽屉底部状态栏 */
.footer-left-status {
  display: flex;
  gap: 8px;
  align-items: center;
}

.status-active-label {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 3px 8px;
  font-size: 12px;
  font-weight: 800;
  color: #065f46;
  background: #d1fae5;
  border-radius: 6px;
}

.footer-activate-btn {
  font-size: 12px;
  font-weight: 700;
  color: #047857 !important;
  border-color: #6ee7b7 !important;
}

.footer-right-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-activate-stage {
  background: #059669 !important;
  border-color: #047857 !important;
}

/* Tab 5: AI 深度诊断与策略 */
.diag-card {
  padding: 15px 16px;
  background: #fff;
  border: 1px solid #dce7e3;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgb(18 57 45 / 4%);
}

.diag-card-head {
  display: flex;
  gap: 10px;
  align-items: center;
  padding-bottom: 10px;
  margin-bottom: 12px;
  border-bottom: 1px solid #ecf3f0;
}

.diag-card-icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  font-size: 16px;
  border-radius: 8px;
}

.diag-card-icon.is-red {
  color: #dc2626;
  background: #fee2e2;
}

.diag-card-icon.is-orange {
  color: #d97706;
  background: #fef3c7;
}

.diag-card-icon.is-green {
  color: #0b806f;
  background: #e6f4f0;
}

.diag-card-head > div {
  display: grid;
  flex: 1;
  gap: 1px;
}

.diag-card-head h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  color: #193f36;
}

.diag-card-head small {
  font-size: 12px;
  color: #728780;
}

.diag-attribution-box {
  display: grid;
  gap: 10px;
}

.diag-field {
  display: grid;
  gap: 4px;
}

.diag-field-label {
  font-size: 12px;
  font-weight: 700;
  color: #647a73;
}

.diag-field-value.is-obj {
  font-size: 12px;
  color: #1a4239;
}

.diag-field-value.is-obj small {
  font-weight: 400;
  color: #0b806f;
}

.diag-deliverable-item {
  display: grid;
  gap: 4px;
  padding: 9px 12px;
  background: #fdfaf4;
  border: 1px solid #fae6c6;
  border-radius: 8px;
}

.deliverable-tag-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.deliverable-name {
  font-size: 13px;
  font-weight: 800;
  color: #92400e;
}

.diag-deliverable-item small {
  font-size: 12px;
  color: #855f36;
}

.diag-gate-rule {
  display: flex;
  gap: 6px;
  align-items: flex-start;
  padding: 8px 10px;
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: #4b665f;
  background: #f4f9f7;
  border: 1px solid #d8e8e2;
  border-radius: 7px;
}

.diag-gate-rule svg {
  flex: none;
  margin-top: 2px;
  font-size: 14px;
  color: #d97706;
}

.diag-fact-callout {
  display: flex;
  gap: 7px;
  align-items: flex-start;
  padding: 9px 11px;
  background: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 7px;
}

.diag-fact-callout svg {
  flex: none;
  margin-top: 1px;
  font-size: 15px;
  color: #e53e3e;
}

.diag-fact-callout p {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  color: #9b2c2c;
}

.chain-metrics-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.chain-metric {
  display: grid;
  gap: 2px;
  padding: 8px 10px;
  background: #f7faf9;
  border: 1px solid #e1ece7;
  border-radius: 8px;
}

.chain-metric span {
  font-size: 12px;
  color: #6a8079;
}

.chain-metric strong {
  font-size: 13px;
  color: #173c34;
}

.chain-metric strong.is-warning {
  color: #d97706;
}

.chain-metric strong.is-danger {
  color: #dc2626;
}

.chain-metric small {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: #7b9089;
  white-space: nowrap;
}

.chain-flow-diagram {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 10px;
  margin-bottom: 10px;
  background: #edf5f2;
  border-radius: 8px;
}

.flow-step {
  display: flex;
  flex: 1;
  gap: 6px;
  align-items: center;
  min-width: 0;
  padding: 6px 8px;
  background: #fff;
  border: 1px solid #cfe2da;
  border-radius: 6px;
}

.flow-step.is-delayed {
  border-left: 3px solid #f59e0b;
}

.flow-step.is-blocked {
  border-left: 3px solid #ef4444;
}

.flow-step.is-final {
  border-left: 3px solid #6366f1;
}

.flow-step .step-num {
  font-size: 12px;
  font-weight: 800;
  color: #0b806f;
}

.flow-step strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: #1a4138;
  white-space: nowrap;
}

.flow-step small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: #6a827a;
  white-space: nowrap;
}

.flow-arrow {
  flex: none;
  font-size: 13px;
  color: #6a8e83;
}

.chain-impact-desc {
  display: flex;
  gap: 6px;
  align-items: center;
  margin: 0;
  font-size: 12px;
  color: #55726a;
}

.chain-impact-desc svg {
  color: #0b806f;
}

.strategy-cards {
  display: grid;
  gap: 12px;
}

.strategy-card {
  padding: 12px 14px;
  background: #fbfdfc;
  border: 1px solid #dce8e4;
  border-radius: 10px;
  transition: all 180ms ease;
}

.strategy-card:hover {
  background: #fff;
  border-color: #a8d2c6;
  box-shadow: 0 4px 14px rgb(18 57 45 / 6%);
}

.strategy-card.is-applied {
  background: #f0f9f6;
  border-color: #79baa9;
}

.strategy-card-header {
  display: flex;
  gap: 7px;
  align-items: center;
  margin-bottom: 6px;
}

.strategy-index {
  padding: 1px 6px;
  font-size: 12px;
  font-weight: 800;
  color: #0b806f;
  background: #e4f2ee;
  border-radius: 4px;
}

.strategy-card-header strong {
  flex: 1;
  font-size: 12px;
  color: #1b4138;
}

.strategy-target-role {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 6px;
  font-size: 12px;
}

.strategy-target-role span {
  color: #6e847d;
}

.strategy-target-role strong {
  color: #274c42;
}

.strategy-desc {
  margin: 0 0 8px;
  font-size: 12px;
  line-height: 1.55;
  color: #526d65;
}

.strategy-preview-box {
  padding: 8px 10px;
  margin-bottom: 10px;
  background: #f4f8f6;
  border: 1px solid #e1eee9;
  border-radius: 7px;
}

.strategy-preview-box header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.strategy-preview-box header span {
  font-size: 12px;
  font-weight: 700;
  color: #647b74;
}

.strategy-preview-box pre {
  margin: 0;
  font-family: inherit;
  font-size: 12px;
  line-height: 1.6;
  color: #38564e;
  word-break: break-all;
  white-space: pre-wrap;
}

.strategy-card-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.applied-status {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
  color: #0b806f;
}

.applied-status svg {
  font-size: 14px;
}

/* 抽屉底部按钮区 */
.stage-mgmt-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #fff;
  border-top: 1px solid #e2ece8;
}

/* 容缺特批流转审批弹窗 */
.concession-modal-content {
  display: grid;
  gap: 12px;
  padding: 6px 0;
}

.concession-alert-note {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 10px 12px;
  color: #92400e;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
}

.concession-alert-note svg {
  flex: none;
  margin-top: 2px;
  font-size: 18px;
}

.concession-alert-note strong {
  display: block;
  margin-bottom: 2px;
  font-size: 12px;
}

.concession-alert-note p {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
}

.concession-field {
  display: grid;
  gap: 5px;
}

.concession-field span {
  font-size: 12px;
  font-weight: 700;
  color: #374151;
}

.concession-textarea {
  width: 100%;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.5;
  color: #1f2937;
  resize: vertical;
  outline: none;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

.concession-textarea:focus {
  border-color: #f59e0b;
  box-shadow: 0 0 0 2px rgb(245 158 11 / 15%);
}

.charter-governance-box {
  padding: 14px 16px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #f7faf8 0%, #edf5f1 100%);
  border: 1px solid #cfe2d9;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgb(22 65 53 / 4%);
}

.charter-box-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  margin-bottom: 10px;
  border-bottom: 1px dashed #d3e4dc;
}

.charter-badge-pill {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
  color: #10594d;
  background: #d8ede4;
  border-radius: 12px;
}

.charter-grid-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.charter-sum-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  background: #fff;
  border: 1px solid #e2ece7;
  border-radius: 8px;
}

.charter-sum-item small {
  font-size: 12px;
  font-weight: 600;
  color: #5c756d;
}

.charter-sum-item p {
  margin: 0;
  font-size: 12px;
}

/* ================= 项目详情与项目宪章宽抽屉 (980px) 样式 ================= */
.project-dossier-drawer :deep(.ant-drawer-header) {
  display: none;
}

.project-dossier-drawer :deep(.ant-drawer-body) {
  height: 100%;
  padding: 0;
  background: #f8faf9;
}

.project-dossier-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.project-dossier-head {
  display: flex;
  flex: none;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px 20px;
  background: #fff;
  border-bottom: 1px solid #e2ece8;
}

.project-dossier-head-info {
  display: grid;
  gap: 6px;
}

.dossier-head-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.dossier-project-code {
  display: inline-flex;
  padding: 2px 7px;
  font-family: monospace;
  font-size: 12px;
  font-weight: 800;
  color: #0b7062;
  background: #e6f4f0;
  border-radius: 4px;
}

.dossier-meta-item {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font-size: 12px;
  color: #657b74;
}

.project-dossier-head-info h2 {
  margin: 2px 0 0;
  font-size: 18px;
  font-weight: 800;
  color: #173b33;
}

.project-dossier-head-info p {
  max-width: 820px;
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: #657b74;
}

/* 抽屉主体分栏布局 */
.project-dossier-split-layout {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: #f8faf9;
}

/* 左侧双导航菜单 */
.project-dossier-sidebar-menu {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 6px;
  width: 175px;
  padding: 16px 12px;
  background: #eff6f3;
  border-right: 1px solid #dce8e3;
}

.dossier-menu-badge {
  padding: 1px 6px;
  font-size: 12px;
  font-weight: 700;
  color: #047857;
  background: #d1fae5;
  border-radius: 9999px;
}

/* 右侧主内容区 */
.project-dossier-main-content {
  flex: 1;
  min-width: 0;
  padding: 20px 24px;
  overflow-y: auto;
}

.dossier-content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.dossier-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title {
  display: flex;
  gap: 6px;
  align-items: center;
  margin: 0;
  font-size: 13px;
  font-weight: 800;
  color: #1a4238;
}

.meta-field-card {
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 3%);
}

.meta-field-card small {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}

/* 抽屉底部 */
.project-dossier-footer {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #fff;
  border-top: 1px solid #e2ece8;
}

.charter-modal-paper {
  padding: 20px 24px;
  background: #fff;
  border: 1px solid #e1ebe6;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgb(18 57 45 / 4%);
}

.charter-table-wrapper {
  overflow-x: auto;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

.charter-table {
  width: 100%;
  font-size: 12px;
  border-collapse: collapse;
}

.charter-table th {
  padding: 8px 10px;
  font-weight: 600;
  color: #475569;
  text-align: left;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.charter-table td {
  padding: 8px 10px;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
}

.summary-card-quick-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}

.detail-quick-btn {
  font-size: 12px;
  font-weight: 600;
  color: #0b7062 !important;
  border-color: #a7d3c4 !important;
}

.detail-quick-btn:hover {
  background: #e6f4f0 !important;
}

.charter-quick-btn {
  font-size: 12px;
  font-weight: 600;
  color: #1e3a8a !important;
  border-color: #bfdbfe !important;
}

.charter-quick-btn:hover {
  background: #eff6ff !important;
}

.is-clickable-card {
  cursor: pointer;
  transition: all 160ms ease;
}

.is-clickable-card:hover {
  border-color: #a7d3c4;
  box-shadow: 0 4px 14px rgb(18 57 45 / 6%);
}

/* ================= AI 建议焕新重构 (深度归因 + 链式推演 + 预案) ================= */
.ai-tab-content-reborn {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 80px; /* 预留充足底部空间，杜绝遮挡 */
}

.ai-glass-card {
  padding: 18px 20px;
  background: #fff;
  border: 1px solid #e0ebe6;
  border-radius: 14px;
  box-shadow: 0 4px 18px rgb(18 54 44 / 4%);
}

.ai-card-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  margin-bottom: 14px;
  border-bottom: 1px solid #edf4f0;
}

.ai-banner-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  font-size: 18px;
  border-radius: 10px;
}

.ai-banner-icon.is-red {
  color: #ef4444;
  background: #fee2e2;
}

.ai-banner-icon.is-orange {
  color: #f97316;
  background: #ffedd5;
}

.ai-banner-icon.is-blue {
  color: #0284c7;
  background: #e0f2fe;
}

.ai-banner-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
}

.ai-banner-subtitle {
  font-size: 12px;
  color: #64748b;
}

/* 目标通栏条 */
.blocked-objective-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  margin-bottom: 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.strip-left {
  display: flex;
  gap: 8px;
  align-items: center;
}

.strip-tag {
  padding: 2px 6px;
  font-size: 12px;
  font-weight: 700;
  color: #0369a1;
  background: #e0f2fe;
  border-radius: 4px;
}

.strip-obj-title {
  font-size: 13px;
  color: #1e293b;
}

.strip-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 左右对比分栏 */
.attribution-split-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.split-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 10px;
}

.split-card.is-rule {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.split-card.is-blocker {
  background: #fff1f2;
  border: 1px solid #fecdd3;
}

.split-card-head {
  display: flex;
  gap: 6px;
  align-items: center;
}

.split-card-head h5 {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
}

.rule-statement {
  margin: 0;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
  color: #166534;
}

.rule-meta-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.rule-meta-pill {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 2px 8px;
  font-size: 12px;
  color: #15803d;
  background: #dcfce7;
  border-radius: 6px;
}

.blocker-deliverable-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 6px;
  border-bottom: 1px dashed #fecdd3;
}

.blocker-reason-text {
  margin: 0;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
  color: #9f1239;
}

.blocker-footer-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #9f1239;
  opacity: 0.85;
}

/* 链式推演泳道图 */
.chain-pipeline-steps {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 14px;
  margin-bottom: 12px;
  background: #fcfdfe;
  border: 1px solid #eef3f6;
  border-radius: 10px;
}

.pipeline-node {
  display: flex;
  flex: 1;
  gap: 10px;
  align-items: flex-start;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.pipeline-node.is-current {
  background: #fffdf5;
  border-color: #fcd34d;
}

.pipeline-node.is-downstream {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.pipeline-node.is-final {
  background: #fff5f5;
  border-color: #fca5a5;
}

.node-step-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  font-size: 12px;
  font-weight: 800;
  color: #fff;
  background: #0f766e;
  border-radius: 50%;
}

.pipeline-node.is-final .node-step-badge {
  background: #e11d48;
}

.node-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.node-title {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}

.node-state {
  font-size: 13px;
  font-weight: 700;
}

.node-body small {
  font-size: 12px;
  color: #94a3b8;
}

.pipeline-connector {
  display: flex;
  align-items: center;
  padding: 0 8px;
  font-size: 18px;
  color: #94a3b8;
}

.chain-narrative-box {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 10px 14px;
  font-size: 12px;
  color: #9a3412;
  background: #fff7ed;
  border: 1px solid #ffedd5;
  border-radius: 8px;
}

.chain-narrative-box p {
  margin: 0;
  line-height: 1.5;
}

/* 可执行预案 3 列卡片布局 */
.strategy-cards-layout {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  align-items: start;
}

.strategy-reborn-card {
  display: flex;
  flex-direction: column;
  padding: 16px 14px;
  background: #fff;
  border: 1px solid #e1ece7;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgb(0 0 0 / 2%);
  transition: all 0.2s ease;
}

.strategy-reborn-card:hover {
  border-color: #0d9488;
  box-shadow: 0 4px 16px rgb(13 148 136 / 8%);
}

.strategy-option-heading {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  justify-content: space-between;
  padding-bottom: 10px;
  margin-bottom: 10px;
  border-bottom: 1px solid #dce8e4;
}

.strategy-option-heading > div {
  display: grid;
  gap: 2px;
}

.strategy-option-heading small {
  font-size: 12px;
  font-weight: 700;
  color: #668078;
}

.strategy-option-heading h4 {
  margin: 0;
  font-size: 18px;
  line-height: 1.25;
  color: #123a32;
}

.strategy-guidance {
  display: grid;
  gap: 5px;
  margin-bottom: 10px;
}

.strategy-guidance small {
  font-size: 12px;
  font-weight: 700;
  color: #0b6e65;
}

.strategy-guidance strong {
  font-size: 12px;
  line-height: 1.45;
  color: #223f38;
}

.strategy-guidance p {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  color: #5b716a;
}

.strat-head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.strat-pill {
  padding: 2px 7px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 6px;
}

.strat-pill.is-action {
  color: #7c3aed;
  background: #f3e8ff;
}

.strat-pill.is-replan {
  color: #d97706;
  background: #fef3c7;
}

.strat-pill.is-resource {
  color: #0284c7;
  background: #e0f2fe;
}

.strat-title {
  min-height: 38px;
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.4;
  color: #1e293b;
}

.strat-indicators {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 8px;
  margin-bottom: 10px;
  background: #f8fafc;
  border: 1px solid #edf2f7;
  border-radius: 8px;
}

.indicator-cell small {
  display: block;
  font-size: 12px;
  color: #64748b;
}

.indicator-cell strong {
  display: block;
  font-size: 12px;
}

.strat-desc-text {
  min-height: 48px;
  margin: 0 0 10px;
  font-size: 12px;
  line-height: 1.5;
  color: #475569;
}

.strat-draft-box {
  margin-bottom: 12px;
  background: #f8faf9;
  border: 1px solid #e2ece7;
  border-radius: 8px;
}

.strat-draft-box > summary {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  min-height: 38px;
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 700;
  color: #31564d;
  cursor: pointer;
  list-style: none;
}

.strat-draft-box > summary::-webkit-details-marker {
  display: none;
}

.strat-draft-box > summary:focus-visible,
.btn-copy-draft:focus-visible {
  outline: 3px solid rgb(11 128 111 / 22%);
  outline-offset: 2px;
}

.strat-draft-box > summary span {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.strat-draft-box > summary > svg {
  transition: transform 160ms ease;
}

.strat-draft-box[open] > summary > svg {
  transform: rotate(180deg);
}

.strat-draft-box .draft-head,
.strat-draft-box .draft-content-scroll {
  margin-right: 10px;
  margin-left: 10px;
}

.strat-draft-box .draft-content-scroll {
  margin-bottom: 10px;
}

.draft-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.draft-head span {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}

.btn-copy-draft {
  display: inline-flex;
  gap: 3px;
  align-items: center;
  padding: 1px 4px;
  font-size: 12px;
  color: #0d9488;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 4px;
}

.btn-copy-draft:hover {
  background: #e6f4f1;
}

.draft-content-scroll {
  max-height: 68px;
  overflow-y: auto;
}

.draft-content-scroll pre {
  margin: 0;
  font-family: inherit;
  font-size: 12px;
  line-height: 1.4;
  color: #334155;
  word-break: normal;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.strat-footer-action {
  margin-top: auto;
}

.btn-apply-strategy {
  height: 32px !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  background: #0d9488 !important;
  border-color: #0d9488 !important;
  box-shadow: 0 2px 8px rgb(13 148 136 / 20%) !important;
}

.strat-applied-pill {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  padding: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #059669;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 6px;
}

/* ================= 项目详情与阶段抽屉视觉收敛 ================= */
/* stylelint-disable no-duplicate-selectors */
.project-dossier-split-layout {
  display: flex;
  background: #f8fbfa;
}

.project-dossier-sidebar-menu {
  gap: 5px;
  width: 190px;
  padding: 16px 12px;
  background: #f8fbfa;
  border-color: #dce8e4;
}

.project-dossier-sidebar-menu .sidebar-menu-btn {
  min-height: 56px;
}

.project-dossier-sidebar-menu .menu-texts strong,
.project-dossier-sidebar-menu .menu-texts small,
.project-dossier-sidebar-menu .menu-badge,
.project-dossier-sidebar-menu .menu-alert-pill {
  font-size: 12px;
}

.project-dossier-main-content {
  width: 100%;
  padding: 20px 24px 28px;
}

.dossier-charter-section {
  padding: 0;
  margin: 0;
  border: 0;
}

.project-dossier-tab {
  display: grid;
  gap: 14px;
}

.project-tab-heading {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 15px 17px;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 12px;
}

.project-tab-heading > div {
  display: grid;
  gap: 3px;
}

.project-tab-heading > div > span {
  font-size: 12px;
  font-weight: 800;
  color: #0b6e65;
  letter-spacing: 0.08em;
}

.project-tab-heading h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #173c34;
}

.project-tab-heading p {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: #667e76;
}

.project-tab-count,
.project-change-summary {
  display: inline-flex;
  flex: none;
  gap: 5px;
  align-items: center;
  padding: 6px 9px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 7px;
}

.project-tab-count {
  color: #0b6e65;
  background: #edf5f2;
  border: 1px solid #c9ddd6;
}

.project-change-summary {
  color: #a2473d;
  background: #fff0ed;
  border: 1px solid #efc4bd;
}

.project-deliverable-summary {
  display: inline-flex;
  flex: none;
  gap: 6px;
  align-items: center;
  padding: 6px 9px;
  font-size: 12px;
  font-weight: 700;
  color: #0b6e65;
  background: #edf5f2;
  border: 1px solid #c9ddd6;
  border-radius: 7px;
}

.project-deliverable-toolbar {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) 160px;
  gap: 9px;
  padding: 11px 12px;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 10px;
}

.project-deliverable-toolbar :deep(.ant-select) {
  width: 100%;
}

.project-deliverable-stage-list {
  display: grid;
  gap: 12px;
}

.project-deliverable-stage-group {
  overflow: hidden;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 11px;
}

.project-deliverable-stage-group > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #f4f8f6;
  border-bottom: 1px solid #dce8e4;
}

.project-deliverable-stage-group > header > div {
  display: flex;
  gap: 8px;
  align-items: center;
}

.project-deliverable-stage-group > header span {
  display: inline-grid;
  place-items: center;
  min-width: 30px;
  height: 24px;
  padding: 0 7px;
  font-size: 12px;
  font-weight: 800;
  color: #17695a;
  background: #fff;
  border: 1px solid #c8ddd6;
  border-radius: 6px;
}

.project-deliverable-stage-group > header strong {
  font-size: 13px;
  color: #294f45;
}

.project-deliverable-stage-group > header small {
  font-size: 12px;
  color: #6d827b;
}

.project-deliverable-table-wrap {
  overflow-x: auto;
}

.project-deliverable-table {
  width: 100%;
  min-width: 680px;
  border-collapse: collapse;
}

.project-deliverable-table th {
  padding: 9px 10px;
  font-size: 12px;
  font-weight: 750;
  color: #5a716a;
  text-align: left;
  background: #fbfdfc;
  border-bottom: 1px solid #e3ebe8;
}

.project-deliverable-table th:nth-child(1) {
  width: 165px;
}

.project-deliverable-table th:nth-child(2) {
  width: 130px;
}

.project-deliverable-table th:nth-child(3) {
  width: 82px;
}

.project-deliverable-table th:nth-child(4) {
  width: 74px;
}

.project-deliverable-table th:nth-child(5) {
  width: 190px;
}

.project-deliverable-table th:nth-child(6) {
  width: 74px;
}

.project-deliverable-table td {
  padding: 10px;
  font-size: 12px;
  color: #526b63;
  vertical-align: middle;
  border-bottom: 1px solid #e7eeeb;
}

.project-deliverable-table tbody tr:last-child td {
  border-bottom: 0;
}

.project-deliverable-table tbody tr:hover td {
  background: #fbfdfc;
}

.deliverable-record-name strong,
.deliverable-record-name small,
.deliverable-record-objective small {
  display: block;
}

.deliverable-record-name strong {
  font-size: 12px;
  color: #25483f;
}

.deliverable-record-name small,
.deliverable-record-objective small {
  margin-top: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: #748780;
  white-space: nowrap;
}

.deliverable-record-name small {
  max-width: 180px;
}

.deliverable-record-objective > span {
  font-weight: 800;
  color: #246859;
}

.deliverable-record-objective small {
  max-width: 135px;
}

.deliverable-owner {
  display: inline-grid;
  place-items: center;
  width: 26px;
  height: 26px;
  margin-right: 6px;
  font-size: 12px;
  font-weight: 800;
  color: #0b6e65;
  vertical-align: middle;
  background: #e5f2ed;
  border-radius: 50%;
}

.deliverable-owner-name {
  font-size: 12px;
  color: #3f5f56;
  vertical-align: middle;
}

.deliverable-status,
.unlinked-file-state {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  width: max-content;
  min-height: 24px;
  padding: 0 7px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 6px;
}

.deliverable-status {
  color: #2f705f;
  background: #e8f4ef;
}

.deliverable-status.is-at-risk,
.deliverable-status.is-missing {
  color: #a24a40;
  background: #fbe9e6;
}

.deliverable-status.is-in-progress,
.deliverable-status.is-pending {
  color: #8b6427;
  background: #fff2dc;
}

.linked-file-list {
  display: grid;
  gap: 5px;
}

.linked-file-list button {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) 14px;
  gap: 6px;
  align-items: center;
  width: 100%;
  padding: 6px 7px;
  color: #32665a;
  text-align: left;
  cursor: pointer;
  background: #f5faf8;
  border: 1px solid #d4e5df;
  border-radius: 7px;
}

.linked-file-list button:hover,
.linked-file-list button:focus-visible {
  color: #155d4e;
  outline: 2px solid rgb(42 124 103 / 18%);
  background: #eef7f3;
  border-color: #9bc9bc;
}

.linked-file-list button > span {
  display: grid;
  min-width: 0;
}

.linked-file-list button strong,
.linked-file-list button small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.linked-file-list button strong {
  font-size: 12px;
}

.linked-file-list button small {
  font-size: 12px;
  color: #768a83;
}

.unlinked-file-state {
  color: #7a8581;
  background: #f1f4f3;
}

.deliverable-due-date {
  font-variant-numeric: tabular-nums;
  color: #657a73 !important;
  white-space: nowrap;
}

.report-stage-chip {
  padding: 2px 6px;
  font-size: 12px;
  font-weight: 700;
  color: #42645b;
  background: #edf5f2;
  border-radius: 5px;
}

.project-log-toolbar {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) 150px auto;
  gap: 9px;
  align-items: center;
  padding: 11px 12px;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 10px;
}

.project-log-toolbar :deep(.ant-select) {
  width: 100%;
}

.project-log-toolbar > span {
  font-size: 12px;
  color: #667b74;
  white-space: nowrap;
}

.project-log-table-wrap {
  overflow-x: auto;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 11px;
}

.project-log-table {
  width: 100%;
  min-width: 640px;
  border-collapse: collapse;
}

.project-log-table th {
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 800;
  color: #49675f;
  text-align: left;
  background: #f2f7f5;
  border-bottom: 1px solid #dce8e4;
}

.project-log-table th:nth-child(1) {
  width: 148px;
}

.project-log-table th:nth-child(2) {
  width: 130px;
}

.project-log-table th:nth-child(4) {
  width: 128px;
}

.project-log-table td {
  padding: 11px 12px;
  font-size: 12px;
  color: #506961;
  vertical-align: top;
  border-bottom: 1px solid #e7eeeb;
}

.project-log-table tbody tr:last-child td {
  border-bottom: 0;
}

.project-log-table tbody tr:hover td {
  background: #f8fbfa;
}

.project-log-table tbody tr.is-change td {
  background: #fff8f6;
  border-bottom-color: #f0d6d0;
}

.project-log-table tbody tr.is-change td:first-child {
  box-shadow: inset 4px 0 0 #c65347;
}

.project-log-time {
  font-variant-numeric: tabular-nums;
  color: #657a73 !important;
  white-space: nowrap;
}

.project-log-type {
  display: inline-flex;
  padding: 3px 7px;
  font-size: 12px;
  font-weight: 800;
  color: #35675b;
  background: #e8f3ef;
  border-radius: 6px;
}

.project-log-type.is-change {
  color: #a43f35;
  background: #f9e4df;
}

.project-log-action {
  min-width: 260px;
}

.project-log-action strong {
  display: block;
  font-size: 13px;
  color: #27483f;
}

.project-log-action small {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.45;
  color: #6b7e78;
}

.project-log-operator {
  vertical-align: middle !important;
  white-space: nowrap;
}

.project-log-operator > span {
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  margin-right: 7px;
  font-size: 12px;
  font-weight: 800;
  color: #0b6e65;
  vertical-align: middle;
  background: #e4f1ed;
  border-radius: 50%;
}

.project-log-operator strong {
  display: inline-block;
  font-size: 12px;
  color: #385c53;
  vertical-align: middle;
}

.project-log-pagination {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  min-width: 640px;
  padding: 10px 12px;
  background: #f8fbfa;
  border-top: 1px solid #dce8e4;
}

.project-log-pagination > span {
  font-size: 12px;
  color: #667b74;
}

.dossier-section-heading {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px 18px;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 12px;
}

.dossier-section-heading > div {
  display: grid;
  gap: 3px;
}

.dossier-section-heading span:first-child {
  font-size: 12px;
  font-weight: 800;
  color: #0b6e65;
  letter-spacing: 0.12em;
}

.dossier-section-heading h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  color: #173c34;
}

.dossier-section-heading p {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: #667e76;
}

.dossier-effective-badge {
  display: inline-flex;
  flex: none;
  gap: 5px;
  align-items: center;
  padding: 5px 9px;
  font-size: 12px;
  font-weight: 700;
  color: #0b6e65;
  background: #edf5f2;
  border: 1px solid #c9ddd6;
  border-radius: 999px;
}

.project-dossier-panel :deep(.ant-tag) {
  color: #355a51 !important;
  background: #f1f6f4 !important;
  border-color: #d7e5e0 !important;
}

.project-dossier-panel .section-title svg,
.project-dossier-panel .charter-modal-paper h5 svg {
  color: #0b6e65 !important;
}

.project-dossier-panel .text-rose-700 {
  color: #405f57 !important;
}

.charter-modal-paper {
  padding: 18px;
  box-shadow: none;
}

.charter-table th {
  color: #49675f;
  background: #f3f8f6;
}

.stage-mgmt-drawer :deep(.ant-drawer-content),
.stage-mgmt-drawer :deep(.ant-drawer-body) {
  background: #f8fbfa;
}

.stage-lifecycle-label {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  padding: 3px 8px;
  font-size: 12px;
  font-weight: 700;
  color: #3e6259;
  background: #edf5f2;
  border: 1px solid #d5e4df;
  border-radius: 6px;
}

.stage-owner-chip {
  padding: 0;
  background: transparent;
}

.stage-mgmt-sidebar-menu {
  gap: 5px;
  width: 184px;
  padding: 16px 12px;
  background: #f8fbfa;
  border-color: #dce8e4;
}

.sidebar-menu-btn {
  min-height: 52px;
  padding: 9px 10px;
  border-radius: 9px;
  transition:
    background-color 160ms ease,
    border-color 160ms ease;
}

.sidebar-menu-btn:hover {
  color: #0b6e65;
  background: #f0f6f4;
}

.sidebar-menu-btn.is-active {
  background: #edf5f2;
  border-color: #bcd7cf;
  box-shadow: inset 3px 0 0 #0b6e65;
}

.sidebar-menu-btn .menu-icon,
.sidebar-menu-btn.is-ai-btn .menu-icon {
  color: #55736a;
}

.sidebar-menu-btn.is-active .menu-icon {
  color: #0b6e65;
}

.stage-mgmt-main-content {
  padding: 18px 22px 28px;
  background: #f8fbfa;
}

.stage-mgmt-panel :deep(.ant-btn-primary),
.project-dossier-panel :deep(.ant-btn-primary) {
  color: #fff !important;
  background: #0b6e65 !important;
  border-color: #0b6e65 !important;
  box-shadow: none !important;
}

.stage-mgmt-panel :deep(.ant-btn-primary:hover),
.stage-mgmt-panel :deep(.ant-btn-primary:focus-visible),
.project-dossier-panel :deep(.ant-btn-primary:hover),
.project-dossier-panel :deep(.ant-btn-primary:focus-visible) {
  background: #085c55 !important;
  border-color: #085c55 !important;
}

.gate-block-head :deep(.ant-tag) {
  color: #0b6e65 !important;
  background: #edf5f2 !important;
  border-color: #c9ddd6 !important;
}

.overview-metric-item,
.stage-transition-console,
.gate-block,
.transition-history-section,
.month-group-card,
.person-week-card,
.ai-glass-card,
.strategy-reborn-card {
  background: #fff;
  border-color: #dce8e4;
  box-shadow: none;
}

.overview-metric-item {
  min-height: 72px;
  padding: 11px 12px;
}

.metric-counts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.metric-counts span,
.gate-type-label {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  font-size: 12px;
  font-weight: 700;
  color: #49675f;
  background: #edf5f2;
  border-radius: 999px;
}

.console-actions-strip,
.blocked-objective-strip,
.strat-indicators,
.strat-draft-box {
  background: #f3f8f6;
  border-color: #dce8e4;
}

.stage-state-line {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
  color: #2f574d;
}

.gate-block.is-exit-block,
.gate-card,
.gate-card.is-satisfied,
.gate-card.is-exit-card.is-blocked {
  background: #fff;
  border-color: #dce8e4;
}

.history-item {
  background: #f5f9f7;
  border-left-color: #8ab8ab;
}

.month-calendar-icon,
.month-count-pill {
  color: #0b6e65;
  background: #edf5f2;
  border-color: #d5e4df;
}

.ai-tab-content-reborn {
  gap: 14px;
}

.ai-glass-card {
  padding: 16px 18px;
  border-radius: 12px;
}

.ai-banner-icon.is-red,
.ai-banner-icon.is-orange,
.ai-banner-icon.is-blue {
  color: #0b6e65;
  background: #edf5f2;
}

.strip-tag,
.rule-meta-pill,
.strat-pill.is-action,
.strat-pill.is-replan,
.strat-pill.is-resource {
  color: #0b6e65;
  background: #edf5f2;
}

.split-card.is-rule,
.split-card.is-blocker {
  background: #f8fbfa;
  border-color: #dce8e4;
}

.split-card-head,
.rule-statement,
.blocker-reason-text,
.blocker-footer-info {
  color: #31564d !important;
}

.blocker-deliverable-bar {
  border-color: #dce8e4;
}

.chain-pipeline-steps {
  background: #f8fbfa;
  border-color: #dce8e4;
}

.pipeline-node,
.pipeline-node.is-current,
.pipeline-node.is-downstream,
.pipeline-node.is-final {
  background: #fff;
  border-color: #dce8e4;
}

.pipeline-node.is-current {
  border-left: 3px solid #d09a43;
}

.pipeline-node.is-final {
  border-left: 3px solid #c65347;
}

.chain-narrative-box {
  color: #355a51;
  background: #f3f8f6;
  border-color: #dce8e4;
}

.strategy-reborn-card:hover {
  border-color: #9bc5b9;
  box-shadow: 0 4px 14px rgb(11 110 101 / 6%);
}

:global(.project-action-menu) {
  display: grid;
  gap: 3px;
  min-width: 148px;
  padding: 5px;
  background: #fff;
  border: 1px solid #d7e4df;
  border-radius: 9px;
  box-shadow: 0 8px 24px rgb(32 74 63 / 14%);
}

:global(.project-action-menu button) {
  display: flex;
  gap: 8px;
  align-items: center;
  min-height: 34px;
  padding: 0 10px;
  font-size: 12px;
  color: #355a51;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 7px;
}

:global(.project-action-menu button:hover),
:global(.project-action-menu button:focus-visible) {
  color: #1f6152;
  outline: none;
  background: #edf5f2;
}

:global(.project-action-menu button svg) {
  flex: none;
  font-size: 15px;
  color: #5e7e75;
}

.menu-count-pill {
  display: grid;
  flex: none;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  place-items: center;
  font-size: 12px;
  color: #236a59;
  background: #dceee7;
  border-radius: 10px;
}

.execution-tab-head {
  display: flex;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: linear-gradient(135deg, #eef8f4, #f8fbfa);
  border: 1px solid #d1e4dd;
  border-radius: 12px;
}

.execution-tab-head > div {
  display: flex;
  gap: 10px;
  align-items: center;
}

.execution-tab-head > div > span {
  display: grid;
  flex: none;
  width: 38px;
  height: 38px;
  place-items: center;
  font-size: 18px;
  color: #fff;
  background: #2e7b67;
  border-radius: 10px;
}

.execution-tab-head h3,
.execution-tab-head p,
.execution-objective-card h4,
.execution-objective-card p {
  margin: 0;
}

.execution-tab-head h3 {
  font-size: 15px;
  color: #244b40;
}

.execution-tab-head p {
  margin-top: 3px;
  font-size: 12px;
  color: #668078;
}

.execution-flat-list { display: grid; gap: 9px; }
.execution-flat-item { display: grid; grid-template-columns: 38px minmax(0, 1fr) 132px auto; gap: 11px; align-items: center; min-height: 76px; padding: 11px 13px; background: #fff; border: 1px solid #d8e4df; border-radius: 11px; }
.execution-flat-item:hover { border-color: #a9cdc2; box-shadow: 0 5px 15px rgb(35 82 69 / 6%); }
.execution-flat-icon { display: grid; place-items: center; width: 36px; height: 36px; font-size: 17px; color: #27715f; background: #e7f3ef; border-radius: 9px; }
.execution-flat-item.is-deliverable .execution-flat-icon { color: #6f5194; background: #f0eaf7; }
.execution-flat-item.is-metric .execution-flat-icon { color: #9a6617; background: #fff3df; }
.execution-flat-copy { display: grid; gap: 3px; min-width: 0; }
.execution-flat-copy > div { display: flex; gap: 5px; align-items: center; font-size: 11px; color: #85958f; }
.execution-flat-copy :deep(.ant-tag) { margin: 0; }
.execution-flat-copy strong,
.execution-flat-copy small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.execution-flat-copy strong { font-size: 13px; color: #2d5147; }
.execution-flat-copy small { font-size: 11px; color: #74877f; }
.execution-flat-copy p { display: flex; gap: 4px; align-items: center; margin: 1px 0 0; font-size: 11px; color: #477466; }
.execution-flat-state { display: grid; gap: 5px; justify-items: start; }
.execution-flat-state strong { font-size: 12px; color: #47685f; }
.execution-flat-actions { display: flex; justify-content: flex-end; }

.execution-objective-list {
  display: grid;
  gap: 12px;
}

.execution-objective-card {
  overflow: hidden;
  background: #fff;
  border: 1px solid #d8e4df;
  border-radius: 11px;
}

.execution-objective-card > header {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
}

.execution-objective-title,
.execution-objective-actions {
  display: flex;
  gap: 9px;
  align-items: center;
}

.execution-objective-title > span {
  display: grid;
  flex: none;
  height: 26px;
  padding: 0 7px;
  place-items: center;
  font-size: 12px;
  font-weight: 700;
  color: #246856;
  background: #e5f2ed;
  border-radius: 6px;
}

.execution-objective-title h4 {
  font-size: 14px;
  color: #274a40;
}

.execution-objective-title p {
  margin-top: 3px;
  font-size: 12px;
  color: #75877f;
}

.execution-progress-line {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 42px;
  gap: 10px;
  align-items: center;
  padding: 0 14px 10px;
}

.execution-progress-line strong {
  font-size: 12px;
  color: #2b6758;
  text-align: right;
}

.execution-kr-list {
  border-top: 1px solid #e4ebe8;
}

.execution-kr-row {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) auto 150px;
  gap: 10px;
  align-items: center;
  min-height: 62px;
  padding: 9px 14px;
  border-top: 1px solid #edf1ef;
}

.execution-kr-row:first-child {
  border-top: 0;
}

.execution-kr-icon {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  color: #347462;
  background: #edf6f2;
  border-radius: 7px;
}

.execution-kr-copy {
  min-width: 0;
}

.execution-kr-copy strong,
.execution-kr-copy small,
.execution-kr-copy span {
  display: block;
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.execution-kr-copy strong {
  color: #35534a;
}

.execution-kr-copy small {
  margin-top: 3px;
  color: #7b8c85;
}

.execution-kr-copy span {
  display: flex;
  gap: 4px;
  align-items: center;
  margin-top: 4px;
  color: #3e7463;
}

.execution-upload-action {
  display: flex;
  gap: 7px;
  align-items: center;
  justify-content: flex-end;
}

.execution-upload-action small,
.execution-metric-value {
  font-size: 12px;
  color: #678078;
}

.executor-progress-input :deep(.ant-select) {
  width: 100%;
}

/* stylelint-enable no-duplicate-selectors */

:global(.project-stage-confirm-modal .ant-modal-content),
:global(.project-stage-confirm-modal .ant-modal-body) {
  color: #365b52 !important;
  background: #fff !important;
}

:global(.project-stage-confirm-modal .ant-modal-confirm-title) {
  color: #153a32 !important;
}

:global(.project-stage-confirm-modal .ant-modal-confirm-content) {
  color: #5d756e !important;
}

:global(.project-stage-confirm-modal .ant-btn) {
  color: #28584d !important;
  background: #fff !important;
  border-color: #c7dcd6 !important;
  box-shadow: none !important;
}

:global(.project-stage-confirm-modal .ant-btn-primary) {
  color: #fff !important;
  background: #0b6e65 !important;
  border-color: #0b6e65 !important;
}

:global(.project-stage-confirm-modal .ant-btn-primary:hover) {
  background: #075c54 !important;
  border-color: #075c54 !important;
}

/* 阶段与成果：项目选择页 + 70/30 项目工作区 */
.structure-workbench {
  grid-template-columns: minmax(0, 7fr) minmax(280px, 3fr);
  gap: 12px;
  padding: 12px;
  overflow: hidden;
  background: #f4f7f6;
}

.structure-project-browser {
  grid-column: 1 / -1;
  min-height: 0;
  padding: 18px;
  overflow: auto;
  background: #fff;
  border: 1px solid #dce7e3;
  border-radius: 14px;
}

.structure-browser-header {
  display: flex;
  gap: 20px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.structure-browser-header span,
.project-ai-guide-header small {
  font-size: 9px;
  font-weight: 800;
  color: #18816d;
  letter-spacing: 0.13em;
}

.structure-browser-header h2,
.project-ai-guide-header h2 {
  margin: 2px 0 0;
  font-size: 17px;
  color: #24493f;
}

.structure-browser-header p,
.project-ai-guide-header p {
  margin: 3px 0 0;
  font-size: 12px;
  color: #74867f;
}

.structure-browser-header > strong {
  padding: 5px 10px;
  font-size: 12px;
  color: #346b5d;
  background: #edf6f3;
  border-radius: 999px;
}

.structure-project-card-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.structure-project-card {
  position: relative;
  min-width: 0;
  overflow: hidden;
  cursor: pointer;
  background: #fff;
  border: 1px solid #dbe6e2;
  border-radius: 12px;
  box-shadow: 0 5px 16px rgb(29 74 62 / 5%);
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.structure-project-card:hover {
  border-color: #9bc7ba;
  box-shadow: 0 10px 24px rgb(29 74 62 / 10%);
  transform: translateY(-2px);
}

.structure-card-status {
  height: 3px;
  background: #1b9b79;
}

.structure-project-card.is-watch .structure-card-status { background: #dfa03f; }
.structure-project-card.is-at-risk .structure-card-status,
.structure-project-card.is-blocked .structure-card-status { background: #da5b52; }

.structure-project-card > header {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) auto;
  gap: 9px;
  align-items: start;
  padding: 13px 13px 9px;
}

.structure-card-icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  font-size: 16px;
  color: #176d5c;
  background: #e8f3ef;
  border-radius: 9px;
}

.structure-project-card header > div { min-width: 0; }
.structure-project-card header small { font-size: 9px; color: #8a9994; }
.structure-project-card h3 { margin: 1px 0; overflow: hidden; font-size: 14px; color: #294d44; text-overflow: ellipsis; white-space: nowrap; }
.structure-project-card header p { margin: 0; overflow: hidden; font-size: 10px; color: #778983; text-overflow: ellipsis; white-space: nowrap; }

.structure-card-stage {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
  margin: 0 13px 10px;
  background: #f4f8f6;
  border-radius: 8px;
}

.structure-card-stage span { font-size: 10px; color: #7b8c86; }
.structure-card-stage strong { overflow: hidden; font-size: 11px; color: #3a6258; text-overflow: ellipsis; white-space: nowrap; }
.structure-card-stage b { font-size: 11px; color: #18725f; }

.structure-project-card > footer {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 9px 13px;
  font-size: 10px;
  color: #6f837c;
  background: #fbfcfc;
  border-top: 1px solid #e8efec;
}

.structure-project-card > footer span { display: inline-flex; gap: 4px; align-items: center; }
.structure-card-arrow { margin-left: auto; font-size: 14px; color: #678f84; }
.structure-project-pagination { display: flex; justify-content: center; margin-top: 18px; }

.structure-detail {
  padding: 12px 13px 22px;
  background: #fff;
  border: 1px solid #dce7e3;
  border-radius: 14px;
}

.structure-detail-toolbar {
  display: flex;
  gap: 10px;
  align-items: center;
  min-height: 34px;
  padding-bottom: 9px;
}

.structure-detail-toolbar > span {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  overflow: hidden;
  font-size: 11px;
  color: #71847d;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.back-project-list-button {
  flex: none;
  font-size: 12px;
  font-weight: 650;
  color: #176b5b !important;
  background: #edf7f3 !important;
  border-color: #b9d9cf !important;
}

.back-project-list-button:hover {
  color: #0d5c4d !important;
  background: #e2f2ec !important;
  border-color: #8fc4b5 !important;
}

.project-ai-guide-panel {
  min-width: 0;
  padding: 14px;
  overflow: auto;
  background: #fff;
  border: 1px solid #dce7e3;
  border-radius: 14px;
}

.project-ai-guide-header {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #e8efec;
}

.ai-guide-mark {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  font-size: 17px;
  color: #fff;
  background: linear-gradient(145deg, #16836d, #4aa48f);
  border-radius: 11px;
  box-shadow: 0 7px 16px rgb(22 131 109 / 18%);
}

.project-ai-insight {
  display: grid;
  gap: 7px;
  padding: 11px;
  margin-top: 12px;
  background: #f0f7f4;
  border: 1px solid #d5e8e1;
  border-radius: 10px;
}

.project-ai-insight > span {
  display: flex;
  gap: 5px;
  align-items: center;
  font-size: 10px;
  font-weight: 700;
  color: #16715f;
}

.project-ai-insight strong { font-size: 12px; font-weight: 600; line-height: 1.6; color: #375d53; }
.project-ai-employee-list { display: grid; gap: 9px; margin-top: 12px; }

.project-ai-employee-card {
  overflow: hidden;
  background: #fff;
  border: 1px solid #dce7e3;
  border-radius: 10px;
}

.project-ai-employee-card:hover { border-color: #a9cdc2; box-shadow: 0 6px 17px rgb(35 82 69 / 7%); }
.project-ai-employee-main { display: grid; grid-template-columns: 34px minmax(0, 1fr) auto; gap: 8px; align-items: center; width: 100%; padding: 9px; text-align: left; cursor: pointer; background: #fff; border: 0; }
.project-ai-employee-main img { width: 34px; height: 34px; object-fit: cover; border-radius: 9px; }
.project-ai-employee-main > span { display: grid; min-width: 0; }
.project-ai-employee-main strong { font-size: 12px; color: #2e554b; }
.project-ai-employee-main small { overflow: hidden; font-size: 10px; color: #7a8d87; text-overflow: ellipsis; white-space: nowrap; }
.project-ai-employee-main > svg { color: #7b968e; }

.project-ai-example {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 6px;
  align-items: center;
  width: 100%;
  padding: 7px 9px;
  font-size: 11px;
  color: #28705f;
  text-align: left;
  cursor: pointer;
  background: #f6faf8;
  border: 0;
  border-top: 1px solid #e7efec;
}

.project-ai-example:hover { background: #eaf5f1; }
.project-ai-context-note { display: flex; gap: 6px; align-items: flex-start; padding: 10px 2px 0; font-size: 10px; line-height: 1.5; color: #7c8d87; }

@media (max-width: 760px) {
  .structure-workbench { grid-template-columns: 1fr; overflow: auto; }
  .structure-project-card-grid { grid-template-columns: 1fr; }
  .project-ai-guide-panel { min-height: 420px; }
  .execution-flat-item { grid-template-columns: 36px minmax(0, 1fr); }
  .execution-flat-state,
  .execution-flat-actions { grid-column: 2; }
}
</style>
