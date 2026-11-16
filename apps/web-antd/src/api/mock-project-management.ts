import type {
  DualTrackWeeklyReport,
  ManagedProject,
  ProjectCharter,
  ProjectDiscussion,
  ProjectObjective,
  ProjectStage,
  ProjectStoryStage,
  ProjectTemplate,
  StageGateItem,
  TransitionRecord,
  WeeklyReportItem,
} from '#/types/project-management';

export const projectStoryStages: ProjectStoryStage[] = [
  {
    id: 1,
    label: '计划正常推进',
    shortLabel: '正常',
    health: 'healthy',
    healthLabel: '正常',
    probability: 88,
    progress: 54,
    headline: '接口联调已启动，关键成果物均在计划内',
    explanation:
      '本周周报与联调记录已覆盖当前阶段的两项关键结果，暂无连续延期或未解释事项。',
    nextAction: '按计划完成核心接口回归，并在周三前补充联调测试报告。',
  },
  {
    id: 2,
    label: '临期缺少成果物',
    shortLabel: '临期',
    health: 'watch',
    healthLabel: '需关注',
    probability: 67,
    progress: 58,
    headline: '联调测试报告将在 3 天后到期，但尚无可验收版本',
    explanation:
      '周报提到“接口联调推进中”，附件仅有会议录音，未发现测试范围、通过率和遗留问题清单。',
    nextAction: '提醒张三补充测试报告草稿，并用验收清单检查缺失章节。',
  },
  {
    id: 3,
    label: '逾期且没有解释',
    shortLabel: '逾期',
    health: 'at-risk',
    healthLabel: '有风险',
    probability: 39,
    progress: 58,
    headline: '接口联调成果物已逾期 2 天，负责人尚未说明原因',
    explanation:
      '连续两周周报均承诺完成联调，当前仍无测试报告；客户环境问题只出现在聊天记录中，尚未形成正式说明。',
    nextAction: '要求负责人补充延期原因、影响范围和补救计划，并同步项目经理。',
  },
  {
    id: 4,
    label: '已补充说明与计划',
    shortLabel: '补救',
    health: 'watch',
    healthLabel: '补救中',
    probability: 63,
    progress: 62,
    headline: '延期原因和补救计划已补齐，等待客户环境验证',
    explanation:
      '负责人已说明客户测试环境未就绪，并提交三步补救计划；新日期为 8 月 14 日，但关键依赖仍在客户侧。',
    nextAction: '确认客户环境责任人和就绪时间，周三进行一次联合检查。',
  },
  {
    id: 5,
    label: '管理者确认升级',
    shortLabel: '升级',
    health: 'blocked',
    healthLabel: '已升级',
    probability: 51,
    progress: 62,
    headline: '补救计划仍受客户环境阻塞，建议召开联合升级会',
    explanation:
      '新承诺日期临近，客户测试环境仍未确认。按照标准交付项目升级规则，已达到第三次干预条件。',
    nextAction:
      '由项目经理确认会议议程，邀请客户 IT 负责人和双方项目经理参加。',
  },
];

export const projectTemplates: ProjectTemplate[] = [
  {
    id: 'standard-delivery',
    name: '标准交付项目',
    description: '适用于产品实施、系统集成和标准方案落地。',
    icon: 'lucide:package-check',
    objectiveCount: 5,
    krCount: 12,
    phases: ['立项', '需求确认', '实施联调', 'UAT', '上线验收'],
    highlights: ['交付成果清单', '客户确认节点', '三段风险升级'],
  },
  {
    id: 'custom-development',
    name: '定制开发项目',
    description: '适用于范围逐步澄清、包含研发与变更管理的项目。',
    icon: 'lucide:blocks',
    objectiveCount: 6,
    krCount: 16,
    phases: ['立项', '需求基线', '设计开发', '测试', 'UAT', '上线'],
    highlights: ['需求基线', '范围变更确认', '质量门禁'],
  },
  {
    id: 'oem',
    name: 'OEM 合作项目',
    description: '适用于品牌、产品、供应与合规多方协同。',
    icon: 'lucide:factory',
    objectiveCount: 5,
    krCount: 14,
    phases: ['合作立项', '样品确认', '认证合规', '量产准备', '首批交付'],
    highlights: ['样品签样', '合规证据', '供应风险检查'],
  },
];

const customerBObjectives = [
  {
    id: 'o1',
    code: 'O1',
    title: '形成双方确认的需求与交付基线',
    description: '让范围、接口和验收口径在实施前可验证、可追溯。',
    owner: '李四',
    collaborators: ['张三', '刘敏'],
    progress: 100,
    health: 'healthy' as const,
    krs: [
      {
        id: 'kr-1-1',
        title: '需求规格说明书完成客户确认',
        kind: 'deliverable' as const,
        owner: '李四',
        dueDate: '07/28',
        status: 'accepted' as const,
        weight: 60,
        acceptance: '客户项目负责人邮件确认，范围无待定项',
        artifact: '需求规格说明书',
        weeklyEvidence: '2026-W30 周报 · 需求定版',
        confidence: 98,
      },
      {
        id: 'kr-1-2',
        title: '需求待定项清零',
        kind: 'metric' as const,
        owner: '李四',
        dueDate: '07/28',
        status: 'accepted' as const,
        weight: 40,
        target: 0,
        actual: 0,
        unit: '项',
        weeklyEvidence: '需求评审纪要 · 7 月 28 日',
        confidence: 96,
      },
    ],
  },
  {
    id: 'o2',
    code: 'O2',
    title: '完成接口联调并达到可验收状态',
    description: '核心接口稳定运行，问题清单闭环，具备进入 UAT 的条件。',
    owner: '张三',
    collaborators: ['李四', '赵凯'],
    progress: 58,
    health: 'at-risk' as const,
    krs: [
      {
        id: 'kr-2-1',
        title: '提交接口联调测试报告',
        kind: 'deliverable' as const,
        owner: '张三',
        dueDate: '08/12',
        status: 'at-risk' as const,
        weight: 55,
        acceptance: '覆盖 12 个核心接口、遗留问题分级、双方负责人确认',
        artifact: '接口联调测试报告',
        weeklyEvidence: '2026-W32 周报 · 客户 B 接口联调延期',
        confidence: 82,
      },
      {
        id: 'kr-2-2',
        title: '核心接口测试通过率达到 95%',
        kind: 'metric' as const,
        owner: '张三',
        dueDate: '08/12',
        status: 'in-progress' as const,
        weight: 45,
        target: 95,
        actual: 68,
        unit: '%',
        weeklyEvidence: '接口联调记录 · 8 月 10 日',
        confidence: 91,
      },
    ],
  },
  {
    id: 'o3',
    code: 'O3',
    title: '完成 UAT、上线与项目验收',
    description: '以客户确认的业务结果完成交付闭环。',
    owner: '王天豪',
    collaborators: ['张三', '李四'],
    progress: 12,
    health: 'watch' as const,
    krs: [
      {
        id: 'kr-3-1',
        title: '获得客户 UAT 确认',
        kind: 'deliverable' as const,
        owner: '王天豪',
        dueDate: '08/21',
        status: 'pending' as const,
        weight: 60,
        acceptance: '关键场景全部通过，客户签字或邮件确认',
        artifact: '客户 UAT 验收报告',
        confidence: 100,
      },
      {
        id: 'kr-3-2',
        title: '上线后 P1/P2 故障为 0',
        kind: 'metric' as const,
        owner: '王天豪',
        dueDate: '08/28',
        status: 'pending' as const,
        weight: 40,
        target: 0,
        actual: 0,
        unit: '项',
        confidence: 100,
      },
    ],
  },
];

const customerBStages: ProjectStage[] = [
  {
    id: 'customer-b-stage-1',
    code: 'S1',
    name: '需求与基线确认',
    description: '完成合同范围、接口边界和验收口径的双方确认。',
    owner: '李四',
    plannedStart: '2026-07-20',
    plannedEnd: '2026-07-28',
    actualStart: '2026-07-20',
    actualEnd: '2026-07-28',
    dependsOn: [],
    entryCriteria: '立项审批通过，客户与项目负责人已确认',
    exitCriteria: '需求基线完成签署，待定项清零',
    status: 'completed',
    progress: 100,
    health: 'healthy',
    objectives: [customerBObjectives[0]!],
  },
  {
    id: 'customer-b-stage-2',
    code: 'S2',
    name: '实施与接口联调',
    description: '完成核心接口联调、问题闭环并达到可验收状态。',
    owner: '张三',
    plannedStart: '2026-07-29',
    plannedEnd: '2026-08-12',
    actualStart: '2026-07-30',
    dependsOn: ['customer-b-stage-1'],
    entryCriteria: '需求基线签署，客户测试环境可用',
    exitCriteria: '联调报告通过审查，核心接口通过率达到 95%',
    status: 'blocked',
    progress: 58,
    health: 'at-risk',
    objectives: [customerBObjectives[1]!],
  },
  {
    id: 'customer-b-stage-3',
    code: 'S3',
    name: 'UAT、上线与验收',
    description: '完成客户验证、生产上线和项目验收闭环。',
    owner: '王天豪',
    plannedStart: '2026-08-13',
    plannedEnd: '2026-08-28',
    dependsOn: ['customer-b-stage-2'],
    entryCriteria: '接口联调门禁通过，UAT 环境准备完成',
    exitCriteria: '客户完成验收确认，上线后 P1/P2 故障为 0',
    status: 'pending',
    progress: 12,
    health: 'watch',
    objectives: [customerBObjectives[2]!],
  },
];

const quotePlatformObjectives: ProjectObjective[] = [
  {
    id: 'quote-o1',
    code: 'O1',
    title: '完成报价规则与需求基线确认',
    description: '冻结核心计价规则、审批边界和对接范围。',
    owner: '周小曼',
    collaborators: ['陈浩', '林晓'],
    progress: 100,
    health: 'healthy',
    krs: [
      {
        id: 'quote-kr-1-1',
        title: '需求基线评审报告完成签署',
        kind: 'deliverable',
        owner: '周小曼',
        dueDate: '08/08',
        status: 'accepted',
        weight: 60,
        acceptance: '业务、产品和研发负责人完成签署',
        artifact: '需求基线评审报告',
      },
      {
        id: 'quote-kr-1-2',
        title: '待确认计价规则数量降为 0',
        kind: 'metric',
        owner: '陈浩',
        dueDate: '08/08',
        status: 'accepted',
        weight: 40,
        target: 0,
        actual: 0,
        unit: '项',
      },
    ],
  },
  {
    id: 'quote-o2',
    code: 'O2',
    title: '完成核心报价链路开发与系统测试',
    description: '覆盖询价、计价、审批和报价单生成的完整链路。',
    owner: '陈浩',
    collaborators: ['周小曼', '罗文'],
    progress: 72,
    health: 'healthy',
    krs: [
      {
        id: 'quote-kr-2-1',
        title: '提交系统测试报告',
        kind: 'deliverable',
        owner: '罗文',
        dueDate: '09/03',
        status: 'in-progress',
        weight: 50,
        acceptance: '核心流程与异常场景覆盖率达到验收要求',
        artifact: '系统测试报告',
      },
      {
        id: 'quote-kr-2-2',
        title: '核心用例通过率达到 98%',
        kind: 'metric',
        owner: '陈浩',
        dueDate: '09/03',
        status: 'in-progress',
        weight: 50,
        target: 98,
        actual: 91,
        unit: '%',
      },
    ],
  },
];

const quotePlatformStages: ProjectStage[] = [
  {
    id: 'quote-stage-1',
    code: 'S1',
    name: '需求基线',
    description: '冻结核心计价规则、审批边界和对接范围。',
    owner: '周小曼',
    plannedStart: '2026-07-25',
    plannedEnd: '2026-08-08',
    actualStart: '2026-07-25',
    actualEnd: '2026-08-08',
    dependsOn: [],
    entryCriteria: '立项审批和需求调研计划完成',
    exitCriteria: '需求基线完成签署，待确认规则清零',
    status: 'completed',
    progress: 100,
    health: 'healthy',
    objectives: [quotePlatformObjectives[0]!],
  },
  {
    id: 'quote-stage-2',
    code: 'S2',
    name: '开发与系统测试',
    description: '完成核心报价链路开发和系统级验证。',
    owner: '陈浩',
    plannedStart: '2026-08-09',
    plannedEnd: '2026-09-10',
    actualStart: '2026-08-09',
    dependsOn: ['quote-stage-1'],
    entryCriteria: '需求基线签署，研发资源已锁定',
    exitCriteria: '系统测试报告通过，核心用例通过率达到 98%',
    status: 'in-progress',
    progress: 72,
    health: 'healthy',
    objectives: [quotePlatformObjectives[1]!],
  },
];

const huadaPrintingObjectives: ProjectObjective[] = [
  {
    id: 'print-o1',
    code: 'O1',
    title: '完成设备部署并稳定运行',
    description: '完成现场部署、参数调优和连续稳定性验证。',
    owner: '王天豪',
    collaborators: ['孙莉', '高峰'],
    progress: 86,
    health: 'watch',
    krs: [
      {
        id: 'print-kr-1-1',
        title: '形成现场试运行报告',
        kind: 'deliverable',
        owner: '孙莉',
        dueDate: '09/02',
        status: 'in-progress',
        weight: 55,
        acceptance: '包含连续运行数据、异常记录和客户确认',
        artifact: '现场试运行报告',
      },
      {
        id: 'print-kr-1-2',
        title: '连续 7 天严重卡纸次数为 0',
        kind: 'metric',
        owner: '高峰',
        dueDate: '09/02',
        status: 'at-risk',
        weight: 45,
        target: 0,
        actual: 1,
        unit: '次',
      },
    ],
  },
  {
    id: 'print-o2',
    code: 'O2',
    title: '完成客户验收与运维移交',
    description: '交付完整验收材料并完成客户运维人员培训。',
    owner: '孙莉',
    collaborators: ['王天豪', '赵凯'],
    progress: 35,
    health: 'healthy',
    krs: [
      {
        id: 'print-kr-2-1',
        title: '提交项目验收资料包',
        kind: 'deliverable',
        owner: '孙莉',
        dueDate: '09/05',
        status: 'in-progress',
        weight: 60,
        acceptance: '部署、培训、试运行和遗留问题材料齐全',
        artifact: '项目验收资料包',
      },
      {
        id: 'print-kr-2-2',
        title: '客户运维培训覆盖率达到 100%',
        kind: 'metric',
        owner: '赵凯',
        dueDate: '09/04',
        status: 'pending',
        weight: 40,
        target: 100,
        actual: 60,
        unit: '%',
      },
    ],
  },
];

const huadaPrintingStages: ProjectStage[] = [
  {
    id: 'huada-stage-1',
    code: 'S1',
    name: '现场部署与试运行',
    description: '完成设备部署、参数调优和连续稳定性验证。',
    owner: '王天豪',
    plannedStart: '2026-08-12',
    plannedEnd: '2026-09-02',
    actualStart: '2026-08-13',
    dependsOn: [],
    entryCriteria: '设备到场，现场施工条件确认',
    exitCriteria: '试运行报告通过，连续 7 天严重卡纸为 0',
    status: 'in-progress',
    progress: 86,
    health: 'watch',
    objectives: [huadaPrintingObjectives[0]!],
  },
  {
    id: 'huada-stage-2',
    code: 'S2',
    name: '客户验收与运维移交',
    description: '完成验收资料、培训和客户运维移交。',
    owner: '孙莉',
    plannedStart: '2026-09-03',
    plannedEnd: '2026-09-05',
    dependsOn: ['huada-stage-1'],
    entryCriteria: '现场试运行门禁通过',
    exitCriteria: '验收资料齐全，客户完成验收确认',
    status: 'ready',
    progress: 35,
    health: 'healthy',
    objectives: [huadaPrintingObjectives[1]!],
  },
];

export const legacyManagedProjects: ManagedProject[] = [
  {
    id: 'customer-b-delivery',
    code: 'CB-DEL-2026',
    name: '客户 B 集成交付项目',
    customer: '客户 B',
    type: 'standard-delivery',
    typeLabel: '标准交付',
    manager: '李四',
    startDate: '2026-07-20',
    stage: '实施联调',
    dueDate: '2026-08-28',
    initiationStatus: 'approved',
    initiationStatusLabel: '已立项',
    progress: 58,
    onTimeProbability: 39,
    health: 'at-risk',
    healthLabel: '有风险',
    summary: '测试环境未就绪导致接口联调延期，成果物与周报证据正在补齐。',
    stages: customerBStages,
    objectives: customerBObjectives,
  },
  {
    id: 'quote-platform-v2',
    code: 'QP-V2-2026',
    name: '报价平台 V2',
    customer: '华为云',
    type: 'custom-development',
    typeLabel: '定制开发',
    manager: '周小曼',
    startDate: '2026-07-25',
    stage: '系统测试',
    dueDate: '2026-09-10',
    initiationStatus: 'approved',
    initiationStatusLabel: '已立项',
    progress: 72,
    onTimeProbability: 86,
    health: 'healthy',
    healthLabel: '正常',
    summary: '核心接口完成并进入回归测试，需求基线稳定。',
    stages: quotePlatformStages,
    objectives: quotePlatformObjectives,
  },
  {
    id: 'huada-printing',
    code: 'HD-PRINT-2026',
    name: '华达智能打印项目',
    customer: '华达',
    type: 'standard-delivery',
    typeLabel: '标准交付',
    manager: '王天豪',
    startDate: '2026-08-12',
    stage: '试运行',
    dueDate: '2026-09-05',
    initiationStatus: 'pending',
    initiationStatusLabel: '立项补录中',
    progress: 78,
    onTimeProbability: 74,
    health: 'watch',
    healthLabel: '需关注',
    summary: '打印卷曲问题基本解决，仍需连续观察一周。',
    stages: huadaPrintingStages,
    objectives: huadaPrintingObjectives,
  },
];

type DepartmentPhaseSeed = readonly [
  name: string,
  start: string,
  end: string,
  artifact: string,
  metric: string,
  target: number,
  actual: number,
  unit: string,
];

interface DepartmentProjectSeed {
  id: string;
  code: string;
  name: string;
  parentProject: string;
  department: string;
  customer: string;
  type: ManagedProject['type'];
  typeLabel: string;
  manager: string;
  owners: string[];
  currentStageIndex: number;
  progress: number;
  onTimeProbability: number;
  health: ManagedProject['health'];
  healthLabel: string;
  summary: string;
  phases: DepartmentPhaseSeed[];
}

function buildStageModules(
  seed: DepartmentProjectSeed,
  stageIndex: number,
  stageName: string,
  stageStart: string,
  stageEnd: string,
  isCompleted: boolean,
  isCurrent: boolean,
  health: ProjectStage['health'],
  mainArtifact: string,
  mainMetric: string,
  target: number,
  actual: number,
  unit: string,
): ProjectObjective[] {
  const owners = seed.owners;
  const owner1 = owners[stageIndex % owners.length]!;
  const owner2 = owners[(stageIndex + 1) % owners.length]!;
  const owner3 = owners[(stageIndex + 2) % owners.length]!;

  // 针对“研发/实施/处置”阶段：拆分 3 个具象业务模块目标
  if (
    stageName.includes('研发') ||
    stageName.includes('实施') ||
    stageName.includes('处置')
  ) {
    const isProblemProject =
      seed.health === 'at-risk' || seed.health === 'blocked';
    return [
      {
        id: `${seed.id}-obj-${stageIndex + 1}-1`,
        code: `O${stageIndex + 1}.1`,
        title: '权限与租户安全控制域研发',
        description:
          '完成系统 RBAC 细粒度鉴权、租户级资源隔离与操作审计追踪能力。',
        owner: owner1,
        collaborators: [owner2],
        progress: isCompleted ? 100 : 100,
        health: 'healthy',
        krs: [
          {
            id: `${seed.id}-kr-${stageIndex + 1}-1-deliv`,
            title: '完成并提交《RBAC权限矩阵与安全审计测试报告》',
            kind: 'deliverable',
            owner: owner1,
            dueDate: stageEnd.slice(5).replace('-', '/'),
            status: 'accepted',
            weight: 50,
            acceptance: '租户隔离与操作审计用例 100% 通过',
            artifact: 'RBAC权限矩阵与安全审计测试报告',
            weeklyEvidence: '第 34 周周报已附带测试归档证明',
            confidence: 100,
          },
          {
            id: `${seed.id}-kr-${stageIndex + 1}-1-metric`,
            title: '鉴权接口平均响应时延低于 30ms',
            kind: 'metric',
            owner: owner1,
            dueDate: stageEnd.slice(5).replace('-', '/'),
            status: 'accepted',
            weight: 50,
            target: 30,
            actual: 24,
            unit: 'ms',
            weeklyEvidence: '压测环境平均时延 24ms',
            confidence: 100,
          },
        ],
      },
      {
        id: `${seed.id}-obj-${stageIndex + 1}-2`,
        code: `O${stageIndex + 1}.2`,
        title: '核心业务算法与工控状态机流水线研发',
        description:
          '构建端到端检测推理状态机，完成核心业务逻辑闭环与接口双向调优。',
        owner: owner2,
        collaborators: [owner1, owner3],
        progress: isCompleted ? 100 : isProblemProject ? 68 : 88,
        health: isCompleted
          ? 'healthy'
          : isProblemProject
            ? 'at-risk'
            : 'healthy',
        krs: [
          {
            id: `${seed.id}-kr-${stageIndex + 1}-2-deliv`,
            title: `完成并提交《${mainArtifact}》`,
            kind: 'deliverable',
            owner: owner2,
            dueDate: stageEnd.slice(5).replace('-', '/'),
            status: isCompleted
              ? 'accepted'
              : isProblemProject
                ? 'at-risk'
                : 'in-progress',
            weight: 60,
            acceptance: '覆盖所有关键业务接口，经双方联调签字确认',
            artifact: mainArtifact,
            weeklyEvidence: isProblemProject
              ? '受网络白名单阻塞，当前仅跑通本地用例'
              : '已进入联调验证阶段',
            confidence: isCompleted ? 100 : isProblemProject ? 45 : 85,
          },
          {
            id: `${seed.id}-kr-${stageIndex + 1}-2-metric`,
            title: mainMetric,
            kind: 'metric',
            owner: owner2,
            dueDate: stageEnd.slice(5).replace('-', '/'),
            status: isCompleted
              ? 'accepted'
              : isProblemProject
                ? 'at-risk'
                : 'in-progress',
            weight: 40,
            target,
            actual: isCompleted ? target : isCurrent ? actual : 0,
            unit,
            weeklyEvidence: isProblemProject
              ? '当前通过率未达门槛'
              : '已达到阶段目标',
            confidence: isCompleted ? 100 : isProblemProject ? 50 : 88,
          },
        ],
      },
      {
        id: `${seed.id}-obj-${stageIndex + 1}-3`,
        code: `O${stageIndex + 1}.3`,
        title: '工业设备通信协议与硬件驱动适配',
        description: '适配生产设备现场通信链路，实现毫秒级数据采集与心跳保活。',
        owner: owner3,
        collaborators: [owner2],
        progress: isCompleted ? 100 : isCurrent ? 75 : 0,
        health: 'healthy',
        krs: [
          {
            id: `${seed.id}-kr-${stageIndex + 1}-3-deliv`,
            title: '完成并提交《软硬件通信联调与标定确认单》',
            kind: 'deliverable',
            owner: owner3,
            dueDate: stageEnd.slice(5).replace('-', '/'),
            status: isCompleted
              ? 'accepted'
              : isCurrent
                ? 'in-progress'
                : 'pending',
            weight: 60,
            acceptance: '现场通信驱动无丢包，硬件自检通过',
            artifact: '软硬件通信联调与标定确认单',
            weeklyEvidence: '硬件实验室模拟采图测试正常',
            confidence: isCompleted ? 100 : 90,
          },
          {
            id: `${seed.id}-kr-${stageIndex + 1}-3-metric`,
            title: '设备持续稳定通信帧率不低于 100fps',
            kind: 'metric',
            owner: owner3,
            dueDate: stageEnd.slice(5).replace('-', '/'),
            status: isCompleted
              ? 'accepted'
              : isCurrent
                ? 'in-progress'
                : 'pending',
            weight: 40,
            target: 100,
            actual: isCompleted ? 100 : isCurrent ? 112 : 0,
            unit: 'fps',
            weeklyEvidence: '模拟环境已达 112fps',
            confidence: 100,
          },
        ],
      },
    ];
  }

  // 针对“需求/沟通/方案/蓝图/商机”阶段：拆分 2 个业务模块
  if (
    stageName.includes('需求') ||
    stageName.includes('方案') ||
    stageName.includes('蓝图') ||
    stageName.includes('商机')
  ) {
    return [
      {
        id: `${seed.id}-obj-${stageIndex + 1}-1`,
        code: `O${stageIndex + 1}.1`,
        title: `划定${stageName.replace('阶段', '')}核心业务范围与交付基线`,
        description: '明确合同边界、关键利益干系人诉求及优先级排定。',
        owner: owner1,
        collaborators: [owner2],
        progress: isCompleted ? 100 : isCurrent ? seed.progress : 0,
        health: 'healthy',
        krs: [
          {
            id: `${seed.id}-kr-${stageIndex + 1}-1-deliv`,
            title: `完成并提交《${mainArtifact}》`,
            kind: 'deliverable',
            owner: owner1,
            dueDate: stageEnd.slice(5).replace('-', '/'),
            status: isCompleted
              ? 'accepted'
              : isCurrent
                ? 'in-progress'
                : 'pending',
            weight: 60,
            acceptance: '双方项目负责人签字确认',
            artifact: mainArtifact,
            confidence: 100,
          },
          {
            id: `${seed.id}-kr-${stageIndex + 1}-1-metric`,
            title: mainMetric,
            kind: 'metric',
            owner: owner1,
            dueDate: stageEnd.slice(5).replace('-', '/'),
            status: isCompleted
              ? 'accepted'
              : isCurrent
                ? 'in-progress'
                : 'pending',
            weight: 40,
            target,
            actual: isCompleted ? target : isCurrent ? actual : 0,
            unit,
            confidence: 100,
          },
        ],
      },
      {
        id: `${seed.id}-obj-${stageIndex + 1}-2`,
        code: `O${stageIndex + 1}.2`,
        title: '现场软硬件环境调研与接口拓扑规划',
        description: '厘清客户现有系统部署拓扑、安全规范与准入网络要求。',
        owner: owner2,
        collaborators: [owner1],
        progress: isCompleted ? 100 : isCurrent ? 80 : 0,
        health: 'healthy',
        krs: [
          {
            id: `${seed.id}-kr-${stageIndex + 1}-2-deliv`,
            title: '完成并提交《现场部署环境与网络边界调研报告》',
            kind: 'deliverable',
            owner: owner2,
            dueDate: stageEnd.slice(5).replace('-', '/'),
            status: isCompleted
              ? 'accepted'
              : isCurrent
                ? 'in-progress'
                : 'pending',
            weight: 100,
            acceptance: '明确网络端口、白名单审批链及机房条件',
            artifact: '现场部署环境与网络边界调研报告',
            confidence: 100,
          },
        ],
      },
    ];
  }

  // 针对“测试/试运行/上线/验收/复盘”阶段：拆分 2 个业务模块
  return [
    {
      id: `${seed.id}-obj-${stageIndex + 1}-1`,
      code: `O${stageIndex + 1}.1`,
      title: `${stageName.replace('阶段', '')}现场部署与稳定性验证`,
      description: '保障系统在真实业务场景与产线环境中稳定运行并完成验收指标。',
      owner: owner1,
      collaborators: [owner2],
      progress: isCompleted ? 100 : isCurrent ? seed.progress : 0,
      health: isCompleted ? 'healthy' : isCurrent ? health : 'healthy',
      krs: [
        {
          id: `${seed.id}-kr-${stageIndex + 1}-1-deliv`,
          title: `完成并提交《${mainArtifact}》`,
          kind: 'deliverable',
          owner: owner1,
          dueDate: stageEnd.slice(5).replace('-', '/'),
          status: isCompleted
            ? 'accepted'
            : isCurrent
              ? 'in-progress'
              : 'pending',
          weight: 60,
          acceptance: `满足${stageName}结项标准`,
          artifact: mainArtifact,
          confidence: 100,
        },
        {
          id: `${seed.id}-kr-${stageIndex + 1}-1-metric`,
          title: mainMetric,
          kind: 'metric',
          owner: owner1,
          dueDate: stageEnd.slice(5).replace('-', '/'),
          status: isCompleted
            ? 'accepted'
            : isCurrent
              ? 'in-progress'
              : 'pending',
          weight: 40,
          target,
          actual: isCompleted ? target : isCurrent ? actual : 0,
          unit,
          confidence: 100,
        },
      ],
    },
    {
      id: `${seed.id}-obj-${stageIndex + 1}-2`,
      code: `O${stageIndex + 1}.2`,
      title: '操作人员实操培训与遗留问题闭环管控',
      description: '对关键操作人员完成培训，并对过程缺陷进行收敛归零。',
      owner: owner2,
      collaborators: [owner1],
      progress: isCompleted ? 100 : isCurrent ? 50 : 0,
      health: 'healthy',
      krs: [
        {
          id: `${seed.id}-kr-${stageIndex + 1}-2-deliv`,
          title: '完成并提交《用户培训记录与签到表》',
          kind: 'deliverable',
          owner: owner2,
          dueDate: stageEnd.slice(5).replace('-', '/'),
          status: isCompleted
            ? 'accepted'
            : isCurrent
              ? 'in-progress'
              : 'pending',
          weight: 100,
          acceptance: '核心岗位操作人员 100% 参训并考核合格',
          artifact: '用户培训记录与签到表',
          confidence: 100,
        },
      ],
    },
  ];
}

function buildStageGates(
  stageIndex: number,
  stageName: string,
  isCompleted: boolean,
  isCurrent: boolean,
  health: ProjectStage['health'],
  mainArtifact: string,
  mainMetric: string,
  target: number,
  actual: number,
  unit: string,
): { entryGates: StageGateItem[]; exitGates: StageGateItem[] } {
  const isProblem = isCurrent && (health === 'at-risk' || health === 'blocked');

  const entryGates: StageGateItem[] = [
    {
      id: `eg-${stageIndex}-1`,
      name:
        stageIndex === 0
          ? '项目立项批复与授权书已正式签署'
          : `前序阶段准出门禁全部达成并签字确认`,
      type: 'approval',
      satisfied: true,
      note: '前置依赖条件已满足',
    },
    {
      id: `eg-${stageIndex}-2`,
      name:
        stageIndex <= 1
          ? '客户核心联系人与现场环境清单明确'
          : '现场网络与测试机房环境就绪',
      type: 'milestone',
      satisfied: true,
      note: '具备阶段启动基础',
    },
    {
      id: `eg-${stageIndex}-3`,
      name: '阶段启动会召开并明确分工排期',
      type: 'approval',
      satisfied: true,
      note: '团队全员已拉齐认知',
    },
  ];

  const exitGates: StageGateItem[] = [
    {
      id: `xg-${stageIndex}-1`,
      name: `必备成果物《${mainArtifact}》经审查合格并签字`,
      type: 'deliverable',
      satisfied: isCompleted ? true : !isProblem,
      targetValue: '双方签字归档',
      actualValue: isCompleted
        ? '已归档'
        : isProblem
          ? '完成率68% 待签署'
          : '编写中',
      note: isProblem
        ? '受外部网络白名单卡点阻碍，当前尚未取得最终签字'
        : '符合质量要求',
    },
    {
      id: `xg-${stageIndex}-2`,
      name: mainMetric,
      type: 'metric',
      satisfied: isCompleted ? true : !isProblem,
      targetValue: `${target}${unit}`,
      actualValue: isCompleted
        ? `${target}${unit}`
        : isCurrent
          ? `${actual}${unit}`
          : `0${unit}`,
      note: isProblem ? '核心指标达成率未达准出底线' : undefined,
    },
    {
      id: `xg-${stageIndex}-3`,
      name: '本阶段全部阻塞级缺陷清零或形成容缺协议',
      type: 'milestone',
      satisfied: isCompleted ? true : !isProblem,
      note: isProblem ? '存在 1 项外部严重依赖未闭环' : '质量门禁通过',
    },
    {
      id: `xg-${stageIndex}-4`,
      name: '阶段结项评审会议决议签署',
      type: 'approval',
      satisfied: isCompleted,
      note: isCompleted ? '评审委员会全票通过' : '等待阶段终审',
    },
  ];

  return { entryGates, exitGates };
}

function buildStageWeeklyReports(
  seed: DepartmentProjectSeed,
  stageIndex: number,
  stageName: string,
  isCompleted: boolean,
  isCurrent: boolean,
  health: ProjectStage['health'],
  mainArtifact: string,
  mainMetric?: string,
): WeeklyReportItem[] {
  const reporter = seed.owners[stageIndex % seed.owners.length]!;
  const coWorkers =
    seed.owners.length > 1
      ? seed.owners
      : ['张三', '李四', '王天豪', '赵凯', '孙莉'];

  if (isCurrent && (health === 'at-risk' || health === 'blocked')) {
    return [
      // 2026年09月
      {
        id: `wr-${seed.id}-${stageIndex}-09-w36-1`,
        weekTitle: '第 36 周周报 · 白名单协调与客户二次升级',
        weekRange: '2026/09/01 ~ 2026/09/07',
        reporter: coWorkers[1] || '李四',
        submitDate: '2026/09/04 18:30',
        summary:
          '已向宁德客户交付负责人发起第二轮白名单升级协调，同步抄送双方项目总监；在测试桩上先行跑通模拟数据。',
        progressRate: 70,
        deliverablesSubmitted: [
          {
            id: 'f-09-1',
            name: '宁德D4现场网络白名单协调备忘录-已签批.pdf',
            size: '1.4 MB',
            uploadedAt: '09/04 16:20',
          },
        ],
        blockers: [
          {
            text: '客户现场生产网白名单审批周期超预期，目前等待客户信息化部最终放行',
            status: 'pending',
          },
        ],
        status: 'blocked',
      },
      {
        id: `wr-${seed.id}-${stageIndex}-09-w36-2`,
        weekTitle: '第 36 周周报 · 本地单测加固与模拟桩联调',
        weekRange: '2026/09/01 ~ 2026/09/07',
        reporter: coWorkers[2] || '张三',
        submitDate: '2026/09/04 17:45',
        summary:
          '完成数据采集核心算法的本地环境模拟回归测试，覆盖 28 组边界异常测试用例，用例通过率 100%。',
        progressRate: 68,
        deliverablesSubmitted: [
          {
            id: 'f-09-2',
            name: '本地虚拟桩模拟用例执行日志与报告.html',
            size: '2.8 MB',
            uploadedAt: '09/04 15:10',
          },
        ],
        blockers: [],
        status: 'normal',
      },
      // 2026年08月
      {
        id: `wr-${seed.id}-${stageIndex}-08-w35-1`,
        weekTitle: '第 35 周周报 · 白名单阻塞与延期预警',
        weekRange: '2026/08/25 ~ 2026/08/31',
        reporter: coWorkers[2] || '张三',
        submitDate: '2026/08/31 19:00',
        summary: `现场网络白名单仍未开通，接口联调无法在真实客户环境进行，必备成果物《${mainArtifact}》已逾期 2 天，目前在本地模拟环境中先跑部分用例。`,
        progressRate: 68,
        deliverablesSubmitted: [
          {
            id: 'f-08-3',
            name: `${mainArtifact}（草稿版本）.xlsx`,
            size: '2.1 MB',
            uploadedAt: '08/30 11:20',
          },
        ],
        blockers: [
          {
            text: '客户现场网络白名单未开通导致真实外部接口联调严重受阻，急需项目经理升级干预',
            status: 'pending',
          },
        ],
        status: 'delayed',
      },
      {
        id: `wr-${seed.id}-${stageIndex}-08-w35-2`,
        weekTitle: '第 35 周周报 · 自动化回归测试用例编写与评审',
        weekRange: '2026/08/25 ~ 2026/08/31',
        reporter: coWorkers[3] || '王天豪',
        submitDate: '2026/08/31 18:20',
        summary:
          '完成主流程接口自动化脚本编写，支持全量回放与性能指标采集统计，为后续联调通过后的验收打底。',
        progressRate: 62,
        deliverablesSubmitted: [
          {
            id: 'f-08-4',
            name: '自动化接口回归脚本集与说明.zip',
            size: '5.6 MB',
            uploadedAt: '08/31 14:00',
          },
        ],
        blockers: [],
        status: 'normal',
      },
      {
        id: `wr-${seed.id}-${stageIndex}-08-w35-3`,
        weekTitle: '第 35 周周报 · 生产拓扑架构审计与通道梳理',
        weekRange: '2026/08/25 ~ 2026/08/31',
        reporter: coWorkers[4] || '赵凯',
        submitDate: '2026/08/31 17:10',
        summary:
          '完成现场机房服务器端点与网络端口矩阵梳理，形成清晰的双向防火墙策略需求清单。',
        progressRate: 58,
        deliverablesSubmitted: [
          {
            id: 'f-08-5',
            name: '机房拓扑图与防火墙端口放行清单.vsdx',
            size: '3.2 MB',
            uploadedAt: '08/30 16:30',
          },
        ],
        blockers: [],
        status: 'normal',
      },
      {
        id: `wr-${seed.id}-${stageIndex}-08-w34-1`,
        weekTitle: '第 34 周周报 · 核心模块联调与白名单申请',
        weekRange: '2026/08/18 ~ 2026/08/24',
        reporter: coWorkers[2] || '张三',
        submitDate: '2026/08/24 18:15',
        summary:
          '完成权限模块安全测试与报告归档；检测流水线算法完成第 1 轮本地模拟跑通；向客户提出现场网络白名单申请。',
        progressRate: 52,
        deliverablesSubmitted: [
          {
            id: 'f-08-2',
            name: 'RBAC权限矩阵与安全审计测试报告.pdf',
            size: '3.4 MB',
            uploadedAt: '08/23 16:40',
          },
        ],
        blockers: [
          {
            text: '客户现场生产网白名单审批周期较长，外部接口联调环境暂未连通',
            status: 'pending',
          },
        ],
        status: 'normal',
      },
      {
        id: `wr-${seed.id}-${stageIndex}-08-w34-2`,
        weekTitle: '第 34 周周报 · 安全合规审计与前置清单核查',
        weekRange: '2026/08/18 ~ 2026/08/24',
        reporter: coWorkers[0] || '孙莉',
        submitDate: '2026/08/24 17:30',
        summary:
          '按 ISO27001 与客户厂区安全规范，对照前置准入清单完成交付包安全性扫描与合规留痕。',
        progressRate: 48,
        deliverablesSubmitted: [
          {
            id: 'f-08-safe',
            name: '交付包静态代码审计与CVE漏洞排查报告.pdf',
            size: '1.9 MB',
            uploadedAt: '08/24 11:00',
          },
        ],
        blockers: [],
        status: 'normal',
      },
      {
        id: `wr-${seed.id}-${stageIndex}-08-w33-1`,
        weekTitle: '第 33 周周报 · 环境准备与基础框架搭建',
        weekRange: '2026/08/11 ~ 2026/08/17',
        reporter: coWorkers[2] || '张三',
        submitDate: '2026/08/17 17:30',
        summary:
          '完成本阶段基础架构代码搭建与权限模块核心逻辑编写，启动本地单测。',
        progressRate: 35,
        deliverablesSubmitted: [
          {
            id: 'f-08-1',
            name: '基础架构搭建与环境准备单.pdf',
            size: '1.8 MB',
            uploadedAt: '08/16 15:20',
          },
        ],
        blockers: [],
        status: 'normal',
      },
      // 2026年07月
      {
        id: `wr-${seed.id}-${stageIndex}-07-w31-1`,
        weekTitle: '第 31 周周报 · 蓝图交接与S3实施准入核查',
        weekRange: '2026/07/28 ~ 2026/08/03',
        reporter: coWorkers[1] || '李四',
        submitDate: '2026/08/01 18:00',
        summary:
          '前序蓝图确认书获得客户签字盖章，S3 实施阶段准入门禁 3 项均已达标，完成实施资源入场交底。',
        progressRate: 15,
        deliverablesSubmitted: [
          {
            id: 'f-07-1',
            name: 'S3阶段准入交底与资源核验单-盖章.pdf',
            size: '2.0 MB',
            uploadedAt: '08/01 14:30',
          },
        ],
        blockers: [],
        status: 'normal',
      },
    ];
  }

  // 默认阶段周报
  return [
    {
      id: `wr-${seed.id}-${stageIndex}-1`,
      weekTitle: `${stageName} 第 1 期周报 · 启动与基线建立`,
      weekRange: '2026/08/04 ~ 2026/08/10',
      reporter,
      submitDate: '2026/08/10 18:00',
      summary: `已完成${stageName}启动交接，分解业务模块目标并与客户责任人建立周度对齐机制。`,
      progressRate: isCompleted ? 50 : 30,
      deliverablesSubmitted: [
        {
          id: 'f-1',
          name: `${stageName}启动备忘录.pdf`,
          size: '1.2 MB',
          uploadedAt: '08/09 14:00',
        },
      ],
      blockers: [],
      status: 'normal',
    },
    {
      id: `wr-${seed.id}-${stageIndex}-2`,
      weekTitle: `${stageName} 第 2 期周报 · 核心成果交付`,
      weekRange: '2026/08/11 ~ 2026/08/17',
      reporter: coWorkers[1] || reporter,
      submitDate: '2026/08/17 18:20',
      summary: `推进《${mainArtifact}》的编制与评审，指标 ${mainMetric || '达标率'} 持续向好，关键节点按排期推进。`,
      progressRate: isCompleted ? 100 : 75,
      deliverablesSubmitted: [
        {
          id: 'f-2',
          name: `${mainArtifact}.pdf`,
          size: '4.2 MB',
          uploadedAt: '08/16 17:00',
        },
      ],
      blockers: [],
      status: 'normal',
    },
  ];
}

function buildStageTransitionHistory(
  seed: DepartmentProjectSeed,
  stageIndex: number,
  stageName: string,
  isCompleted: boolean,
): TransitionRecord[] {
  if (!isCompleted) return [];
  return [
    {
      time: '2026-08-04 17:30',
      operator: seed.manager,
      action: 'advance',
      actionLabel: '准出门禁达标 · 正常推进',
      fromStage: stageName,
      toStage: seed.phases[stageIndex + 1]?.[0] || '下一阶段',
      reason: '本阶段必备成果物均已归档，指标测试通过，准出门禁审查全票通过。',
    },
  ];
}

function buildDepartmentProject(seed: DepartmentProjectSeed): ManagedProject {
  const stages: ProjectStage[] = seed.phases.map((phase, index) => {
    const [name, start, end, artifact, metric, target, actual, unit] = phase;
    const owner = seed.owners[index % seed.owners.length]!;
    const isCompleted = index < seed.currentStageIndex;
    const isCurrent = index === seed.currentStageIndex;
    const status: ProjectStage['status'] = isCompleted
      ? 'completed'
      : isCurrent
        ? seed.health === 'blocked'
          ? 'blocked'
          : 'in-progress'
        : 'pending';
    const health = isCompleted
      ? 'healthy'
      : isCurrent
        ? seed.health
        : 'healthy';
    const progress = isCompleted ? 100 : isCurrent ? seed.progress : 0;
    const stageId = `${seed.id}-stage-${index + 1}`;

    const objectives = buildStageModules(
      seed,
      index,
      name,
      start,
      end,
      isCompleted,
      isCurrent,
      health,
      artifact,
      metric,
      target,
      actual,
      unit,
    );

    const { entryGates, exitGates } = buildStageGates(
      index,
      name,
      isCompleted,
      isCurrent,
      health,
      artifact,
      metric,
      target,
      actual,
      unit,
    );

    const weeklyReports = buildStageWeeklyReports(
      seed,
      index,
      name,
      isCompleted,
      isCurrent,
      health,
      artifact,
      metric,
    );

    const transitionHistory = buildStageTransitionHistory(
      seed,
      index,
      name,
      isCompleted,
    );

    return {
      id: stageId,
      code: `S${index + 1}`,
      name,
      description: `完成${name}的计划执行、成果审核和指标验收。`,
      owner,
      plannedStart: start,
      plannedEnd: end,
      ...(isCompleted ? { actualStart: start, actualEnd: end } : {}),
      ...(isCurrent ? { actualStart: start } : {}),
      dependsOn: index ? [`${seed.id}-stage-${index}`] : [],
      entryCriteria: index
        ? `前序${seed.phases[index - 1]![0]}已完成，满足准入条件`
        : '项目立项审批通过，商务合同签署',
      exitCriteria: `《${artifact}》审核通过，${metric}`,
      entryGates,
      exitGates,
      weeklyReports,
      transitionHistory,
      exceptionRules: {
        maxRectificationDays: 3,
        rectificationOwner: owner,
        concessionApprover: '交付总监 / PMO负责人',
        unqualifiedHandlingWorkflow:
          '初审不合格 -> 触发3日限期整改 -> 上传规范凭证复核 -> 逾期记入质量红线',
      },
      status,
      progress,
      health,
      objectives,
    };
  });

  const charter: ProjectCharter = {
    projectId: seed.id,
    title: `${seed.name} · 项目宪章 (Project Charter)`,
    version: 'V1.0-生效正本',
    approvedDate: seed.phases[0]![1],
    customer: seed.customer,
    manager: seed.manager,
    contractRef: `HT-${seed.code}-2026 (客户主合同与SOW约定)`,
    governanceStandardRef: '《公司客户项目交付管理制度（2026版）》',
    scopeSummary: `融合外部商务合同 SOW 与内部管理制度，锁定${seed.name}全生命周期里程碑，实施双轨周报与门禁准出治理。`,
    objectives: seed.phases
      .slice(0, 3)
      .map((p) => `达成${p[0]}目标，输出符合前置标准的《${p[3]}》`),
    raciMatrix: [
      {
        role: '项目经理 (PM)',
        owner: seed.manager,
        responsibility: '统筹项目宪章执行、把控双轨周报与门禁准入准出',
        type: 'A',
      },
      {
        role: '交付技术负责人',
        owner: seed.owners[1] || '王天豪',
        responsibility: '负责成果物研发自查与前置规范凭证提交',
        type: 'R',
      },
      {
        role: '质量/架构专家',
        owner: seed.owners[2] || '张三',
        responsibility: '执行阶段门禁严审与成果物合规性校验',
        type: 'C',
      },
      {
        role: 'PMO 治理委员会',
        owner: '项目管理委员会',
        responsibility: '阶段跳跃特批、例外容缺裁定与制度执行监督',
        type: 'I',
      },
    ],
    deliverableStandards: seed.phases.map((p, pIdx) => ({
      deliverableName: p[3],
      stageCode: `S${pIdx + 1}`,
      formatStandard:
        '必须为系统正式审批流归档PDF或带签名电子凭单，严禁微信聊天截图',
      storagePath: `/nas/pmo/projects/${seed.code}/S${pIdx + 1}/${p[3]}.pdf`,
      approverRole: seed.manager,
    })),
    exceptionHandling:
      '成果物验收不合格时，责任人必须在 3 个工作日内完成闭环整改；容缺推进需经交付总监与 PMO 联合特批。',
    budgetSummary: '核准人天 180 人天，外部软硬件采购预算 45 万元',
    changeControlRule:
      '任何里程碑变更超出 3 天必须发起正式变更评审并呈报项目赞助人。',
  };

  return {
    id: seed.id,
    code: seed.code,
    name: seed.name,
    parentProject: seed.parentProject,
    department: seed.department,
    customer: seed.customer,
    type: seed.type,
    typeLabel: seed.typeLabel,
    manager: seed.manager,
    startDate: seed.phases[0]![1],
    stage: seed.phases[seed.currentStageIndex]![0],
    dueDate: seed.phases.at(-1)![2],
    initiationStatus: 'approved',
    initiationStatusLabel: '已立项',
    progress: seed.progress,
    onTimeProbability: seed.onTimeProbability,
    health: seed.health,
    healthLabel: seed.healthLabel,
    summary: seed.summary,
    charter,
    stages,
    objectives: stages.flatMap((stage) => stage.objectives),
  };
}

export const managedProjects: ManagedProject[] = [
  buildDepartmentProject({
    id: 'product-ai-copilot-v3',
    code: 'PD-AICP-V3',
    name: '喔壳 3.0 版本',
    parentProject: '喔壳平台一级项目',
    department: '产品部',
    customer: '公司产品线',
    type: 'custom-development',
    typeLabel: '产品研发',
    manager: '周小曼',
    owners: ['林晓', '周小曼', '陈浩', '罗文', '刘敏', '赵凯'],
    currentStageIndex: 2,
    progress: 52,
    onTimeProbability: 76,
    health: 'watch',
    healthLabel: '需关注',
    summary: '核心能力已进入研发阶段，项目风险诊断规则仍需补齐真实项目样本。',
    phases: [
      [
        '需求阶段',
        '2026-07-01',
        '2026-07-10',
        '产品需求文档',
        '高优需求确认率达到 100%',
        100,
        100,
        '%',
      ],
      [
        '方案阶段',
        '2026-07-11',
        '2026-07-22',
        '产品方案文档',
        '方案评审遗留问题清零',
        0,
        0,
        '项',
      ],
      [
        '研发阶段',
        '2026-07-23',
        '2026-08-25',
        '研发交付清单',
        '核心功能开发完成率达到 100%',
        100,
        72,
        '%',
      ],
      [
        '测试阶段',
        '2026-08-26',
        '2026-09-08',
        '系统测试报告',
        '核心用例通过率达到 98%',
        98,
        0,
        '%',
      ],
      [
        '宣发阶段',
        '2026-09-09',
        '2026-09-18',
        '产品发布方案',
        '种子客户演示覆盖数量达到 10 家',
        10,
        0,
        '家',
      ],
      [
        '运维阶段',
        '2026-09-19',
        '2026-10-16',
        '产品运维手册',
        '上线后 P1/P2 故障数量为 0',
        0,
        0,
        '项',
      ],
    ],
  }),
  buildDepartmentProject({
    id: 'delivery-ningde-d4',
    code: 'DEL-ND-D4',
    name: '宁德 D4 检测相机升级交付项目',
    parentProject: '智能制造客户项目',
    department: '交付部',
    customer: '宁德客户',
    type: 'standard-delivery',
    typeLabel: '客户交付',
    manager: '李四',
    owners: ['李四', '王天豪', '张三', '孙莉', '赵凯'],
    currentStageIndex: 2,
    progress: 58,
    onTimeProbability: 43,
    health: 'at-risk',
    healthLabel: '有风险',
    summary:
      '现场网络白名单尚未开通，实施研发阶段的接口联调成果物存在延期风险。',
    phases: [
      [
        '需求沟通阶段',
        '2026-07-15',
        '2026-07-24',
        '客户需求沟通纪要',
        '需求待确认项清零',
        0,
        0,
        '项',
      ],
      [
        '蓝图确认阶段',
        '2026-07-25',
        '2026-08-04',
        '项目实施蓝图确认书',
        '蓝图确认覆盖率达到 100%',
        100,
        100,
        '%',
      ],
      [
        '实施研发阶段',
        '2026-08-05',
        '2026-09-05',
        '接口联调测试报告',
        '核心接口测试通过率达到 95%',
        95,
        68,
        '%',
      ],
      [
        '试运行阶段',
        '2026-09-06',
        '2026-09-18',
        '现场试运行报告',
        '连续稳定运行天数达到 7 天',
        7,
        0,
        '天',
      ],
      [
        '交付上线阶段',
        '2026-09-19',
        '2026-09-30',
        '客户验收报告',
        '客户验收问题关闭率达到 100%',
        100,
        0,
        '%',
      ],
    ],
  }),
  buildDepartmentProject({
    id: 'ops-zhongliang-e5',
    code: 'OPS-ZL-E5',
    name: '中粮 E5 产线稳定性提升专项',
    parentProject: '智能制造客户项目',
    department: '运维部',
    customer: '中粮包装',
    type: 'standard-delivery',
    typeLabel: '运维专项',
    manager: '王天豪',
    owners: ['刘工', '高峰', '孙莉', '赵凯', '王天豪'],
    currentStageIndex: 2,
    progress: 46,
    onTimeProbability: 38,
    health: 'blocked',
    healthLabel: '受阻',
    summary: '相机驱动适配问题反复出现，处置方案等待供应商补丁验证。',
    phases: [
      [
        '服务受理阶段',
        '2026-08-12',
        '2026-08-13',
        '服务受理与影响确认单',
        '重大故障响应时间不超过 30 分钟',
        30,
        22,
        '分钟',
      ],
      [
        '诊断分析阶段',
        '2026-08-14',
        '2026-08-17',
        '故障根因分析报告',
        '根因定位准确率达到 100%',
        100,
        100,
        '%',
      ],
      [
        '处置修复阶段',
        '2026-08-18',
        '2026-09-03',
        '故障修复与变更记录',
        '受影响设备恢复率达到 100%',
        100,
        60,
        '%',
      ],
      [
        '验证观察阶段',
        '2026-09-04',
        '2026-09-11',
        '稳定性观察报告',
        '连续无重大故障运行达到 7 天',
        7,
        0,
        '天',
      ],
      [
        '复盘关闭阶段',
        '2026-09-12',
        '2026-09-16',
        '运维事件复盘报告',
        '改进措施关闭率达到 100%',
        100,
        0,
        '%',
      ],
    ],
  }),
  buildDepartmentProject({
    id: 'sales-south-manufacturing',
    code: 'SAL-SM-2026',
    name: '华达药业 CRM',
    parentProject: '喔壳平台一级项目',
    department: '销售部',
    customer: '华达药业',
    type: 'custom-development',
    typeLabel: '销售经营',
    manager: '刘敏',
    owners: ['刘敏', '陈浩', '周小曼', '林晓', '李四'],
    currentStageIndex: 2,
    progress: 54,
    onTimeProbability: 82,
    health: 'healthy',
    healthLabel: '正常',
    summary: '重点客户需求已完成分级，方案与报价正在按客户价值排序推进。',
    phases: [
      [
        '商机识别阶段',
        '2026-07-20',
        '2026-07-31',
        '重点客户商机清单',
        '有效商机数量达到 12 个',
        12,
        12,
        '个',
      ],
      [
        '需求澄清阶段',
        '2026-08-01',
        '2026-08-14',
        '客户需求与决策链分析报告',
        'A 类客户需求澄清率达到 100%',
        100,
        100,
        '%',
      ],
      [
        '方案报价阶段',
        '2026-08-15',
        '2026-09-06',
        '解决方案与报价书',
        '完成正式报价客户数量达到 6 家',
        6,
        4,
        '家',
      ],
      [
        '商务谈判阶段',
        '2026-09-07',
        '2026-09-22',
        '商务谈判纪要与条款清单',
        '核心商务条款达成率达到 90%',
        90,
        0,
        '%',
      ],
      [
        '合同签署阶段',
        '2026-09-23',
        '2026-10-15',
        '销售合同与项目移交单',
        '合同签署金额达到 500 万元',
        500,
        0,
        '万元',
      ],
    ],
  }),
];

export const initialProjectDiscussions: ProjectDiscussion[] = [
  {
    id: 'discussion-1',
    objectLabel: 'O2 · 接口联调',
    author: '张三',
    role: '研发负责人',
    time: '今天 09:26',
    content:
      '客户测试环境的白名单仍未开通，今天先完成本地回归，并把失败用例整理出来。',
    aiSummary: '外部依赖尚未解除；已形成可并行执行的本地回归动作。',
  },
  {
    id: 'discussion-2',
    objectLabel: 'KR2.1 · 联调测试报告',
    author: '李四',
    role: '项目经理',
    time: '昨天 17:40',
    content: '@张三 请补充延期影响和新计划，我需要在下午客户沟通前确认。',
    aiSummary: '管理者已要求形成正式解释；尚缺新的可验证承诺日期。',
  },
];

/**
 * 提交双轨制周报并反哺项目大盘与对应阶段成果物
 */
export function submitDualTrackWeeklyReport(
  report: DualTrackWeeklyReport,
): boolean {
  const project =
    managedProjects.find(
      (p) => p.id === report.projectId || p.name.includes(report.projectName),
    ) || managedProjects[1]; // 兜底宁德项目
  if (!project) return false;

  const stage =
    project.stages.find(
      (s) => s.id === report.stageId || s.name === report.stageName,
    ) ||
    project.stages[project.currentStageIndex ?? 2] ||
    project.stages[0];

  if (stage) {
    // 1. 回写周报记录到对应阶段
    const newReport: WeeklyReportItem = {
      id: report.id,
      weekLabel: report.weekLabel,
      reporter: report.reporter,
      role: '交付实施负责人',
      submitTime: report.submitTime,
      summary: report.projectSummary,
      status: report.risks.length > 0 ? 'delayed' : 'normal',
      progressPercent: 75,
      actualHours: report.projectHours,
      keyMilestone: `阶段推进至 ${report.plannedDeliverables.filter((d) => d.status === 'done').length}/${report.plannedDeliverables.length} 成果物`,
      artifacts: report.plannedDeliverables.map((d) => ({
        name: d.deliverableName,
        status:
          d.status === 'done'
            ? 'completed'
            : d.status === 'in_progress'
              ? 'reviewing'
              : 'draft',
        progress:
          d.status === 'done' ? 100 : d.status === 'in_progress' ? 60 : 20,
        evidence: d.evidenceUrl
          ? `归档凭证: ${d.evidenceUrl} (前置格式已自查通过)`
          : undefined,
        updatedAt: report.submitTime,
      })),
    };

    stage.weeklyReports = [newReport, ...stage.weeklyReports];

    // 2. 闭环反哺更新目标 KR 进度
    const krObj = stage.objectives.find(
      (o) =>
        o.type === 'deliverable' ||
        o.keyResults.some((kr) => kr.type === 'artifact'),
    );
    if (krObj) {
      krObj.keyResults.forEach((kr) => {
        if (kr.type === 'artifact') {
          const matchedDel = report.plannedDeliverables.find(
            (d) =>
              d.deliverableName.includes(kr.targetValue) ||
              kr.title.includes(d.deliverableName),
          );
          if (matchedDel && matchedDel.status === 'done') {
            kr.currentValue = kr.targetValue;
            kr.progress = 100;
          }
        }
      });
    }

    // 3. 提升阶段进度与项目健康度（如果有风险则转为需关注，若解决了阻碍则提升概率）
    stage.progress = Math.min(100, stage.progress + 15);
    project.progress = Math.min(100, project.progress + 6);
    project.onTimeProbability = Math.min(95, project.onTimeProbability + 12);
  }

  return true;
}
