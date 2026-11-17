import type {
  AiWorkApplication,
  AiWorkDemoState,
  AiWorkEvidenceNode,
  AiWorkMaterial,
  AiWorkRecord,
  AiWorkReport,
  AiWorkReportItem,
  AiWorkReviewRow,
  AiWorkWorkItem,
} from '#/types/ai-work';

const publicAsset = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

export const initialAiWorkDemoState: AiWorkDemoState = {
  scene: 1,
  reportStatus: 'DRAFT',
  completeness: 76,
  draftGenerated: false,
  missingWorkAdded: false,
  delayExplained: false,
  delayDueDate: '',
  reviewDecision: 'none',
  returnReason: '',
  focusMarked: false,
  huadaStatus: 'watch',
};

// ============ 工作资料（原始材料）============
export const aiWorkMaterials: AiWorkMaterial[] = [
  {
    id: 'mat-huada-audio',
    type: 'audio',
    name: '华达现场处理录音.m4a',
    uploadedAt: '2026-08-05 14:30',
    duration: '12:34',
    size: '8.2 MB',
    excerpt:
      '今天来华达处理打印卷曲问题，和王天豪一起排查，调整了打印参数并更换了耗材，下午基本解决，客户希望下周继续观察。',
  },
  {
    id: 'mat-huada-photo',
    type: 'image',
    name: '现场照片.png',
    uploadedAt: '2026-08-05 15:10',
    size: '3.6 MB',
    excerpt: '卷曲样品与调整后效果对比照片 ×2',
  },
  {
    id: 'mat-quote-doc',
    type: 'document',
    name: '报价模块接口设计文档.docx',
    uploadedAt: '2026-08-04 11:00',
    size: '1.4 MB',
  },
  {
    id: 'mat-customerb-doc',
    type: 'document',
    name: '客户B接口联调说明.docx',
    uploadedAt: '2026-08-06 16:20',
    size: '620 KB',
    excerpt: '客户测试环境尚未准备完成，本周无法按原计划完成联调。',
  },
  {
    id: 'mat-aiwork-meeting',
    type: 'meeting',
    name: 'AI Work 产品评审会议纪要',
    uploadedAt: '2026-08-07 17:00',
    size: '48 KB',
    excerpt:
      '完成 Demo 信息架构、员工端与管理端主故事评审，确定下周进入开发排期。',
  },
  {
    id: 'mat-quote-screenshot',
    type: 'image',
    name: '接口联调测试截图.png',
    uploadedAt: '2026-08-04 16:20',
    size: '1.2 MB',
    excerpt: '报价接口在测试环境通过 Postman 联调成功的返回结果截图。',
  },
  {
    id: 'mat-huada-video',
    type: 'video',
    name: '华达现场复测录像.mp4',
    uploadedAt: '2026-08-05 16:00',
    duration: '03:28',
    size: '42.1 MB',
    excerpt: '调整参数后连续打印 50 张未出现卷曲的复测录像。',
  },
  {
    id: 'mat-quote-audio',
    type: 'audio',
    name: '报价模块技术讨论录音.m4a',
    uploadedAt: '2026-08-04 10:00',
    duration: '08:15',
    size: '5.4 MB',
    excerpt: '与后端讨论报价模块接口字段与分页方案的语音记录。',
  },
];

/** 按索引取演示材料（数据为固定常量，越界说明数据配置错误） */
function materialAt(index: number): AiWorkMaterial {
  const item = aiWorkMaterials[index];
  if (!item) {
    throw new Error(`aiWorkMaterials[${index}] 不存在`);
  }
  return item;
}

// ============ 工作事项（资料结构化产物，周报组成单元）============
export const aiWorkWorkItems: AiWorkWorkItem[] = [
  {
    id: 'item-huada-requirement',
    date: '08/03',
    weekday: '周一',
    title: '华达项目需求确认',
    summary: '与华达确认智能打印接口范围、验收口径和本周现场安排。',
    type: '会议记录',
    status: '已完成',
    source: 'AI Hub',
    materials: [],
    entities: {
      projects: ['华达智能打印'],
      customers: ['华达'],
      people: ['王天豪'],
    },
    inReport: true,
  },
  {
    id: 'item-quote-api',
    date: '08/04',
    weekday: '周二',
    title: '完成报价模块接口开发',
    summary: '完成报价核心接口开发，已提交测试环境进入联调。',
    type: '开发记录',
    status: '进行中',
    source: '研发工作台',
    materials: [materialAt(2)],
    entities: {
      projects: ['报价平台 V2'],
      products: ['报价模块'],
    },
    inReport: true,
  },
  {
    id: 'item-huada-print',
    date: '08/05',
    weekday: '周三',
    title: '华达客户现场打印问题处理',
    summary: '调整打印参数并更换耗材，卷曲问题基本解决，客户要求继续观察一周。',
    type: '现场记录',
    status: '暂停',
    source: 'AI Hub',
    materials: [materialAt(0), materialAt(1)],
    entities: {
      projects: ['华达智能打印'],
      customers: ['华达'],
      people: ['王天豪'],
    },
    inReport: false, // 演示：遗漏项，后续加入
  },
  {
    id: 'item-customer-b',
    date: '08/06',
    weekday: '周四',
    title: '客户 B 接口联调',
    summary:
      '客户测试环境尚未准备完成，本周无法按原计划完成联调。已补充沟通录音并重新排期。',
    type: '项目记录',
    status: '暂停',
    source: '项目工作台',
    materials: [materialAt(3)],
    entities: {
      projects: ['客户 B 集成'],
      customers: ['客户 B'],
    },
    inReport: true,
    isCommitment: true, // 上周承诺事项
    commitmentStatus: 'delayed',
    delayWeeks: 1,
    historyLogs: [
      {
        id: 'log-w31',
        weekLabel: '第 31 周 (上周承诺)',
        date: '07/31 周五',
        content:
          '完成客户 B 接口方案确认，计划下周三前完成环境联调与上线准备。',
        author: '张三',
        statusTag: '已承诺',
        materials: [
          {
            id: 'mat-w31-doc',
            type: 'document',
            name: '客户B接口联调说明书V1.0.pdf',
            uploadedAt: '2026-07-31 16:00',
            size: '1.2 MB',
          },
        ],
      },
      {
        id: 'log-w32',
        weekLabel: '第 32 周 (本周追踪)',
        date: '08/06 周四',
        content:
          '由于客户方测试环境未准备就绪，导致联调无法按原计划完成，已沟通调整至下周三前交付。',
        author: '张三',
        statusTag: '延期1周',
        materials: [materialAt(3)],
      },
      {
        id: 'log-w33-plan',
        weekLabel: '第 33 周 (下周计划预估)',
        date: '预计 08/12',
        content: '跟进客户测试环境就绪状态，优先完成核心联调与闭环测试。',
        author: 'AI 自动生成建议',
        statusTag: '下周目标',
      },
    ],
  },
  {
    id: 'item-aiwork-review',
    date: '08/07',
    weekday: '周五',
    title: 'AI Work 产品评审',
    summary: '完成 Demo 信息架构、员工端与管理端主故事评审。',
    type: '评审记录',
    status: '已完成',
    source: '会议助手',
    materials: [materialAt(4)],
    entities: {
      projects: ['AI Work'],
      products: ['AI Work'],
    },
    inReport: true,
  },
  {
    id: 'item-screen-demo',
    date: '08/01',
    weekday: '周六',
    title: '智能填报方案录屏演示与沟通',
    summary: '录制填报自动化流程录屏，向主管演示表单提取效果并记录优化意见。',
    type: '录屏视频',
    status: '已完成',
    source: '视频解析',
    materials: [
      {
        id: 'mat-screen-rec',
        type: 'video',
        name: '智能填报方案演示录屏.mp4',
        uploadedAt: '2026-08-01 10:00',
        duration: '05:12',
        size: '38.5 MB',
      },
    ],
    entities: {
      projects: ['智能填报 Agent'],
      products: ['填报模块'],
      people: ['李经理'],
    },
    inReport: false,
  },
  {
    id: 'item-pdf-minutes',
    date: '08/02',
    weekday: '周日',
    title: '供应商云服务对接会议纪要',
    summary: '解析 PDF 会议纪要，明确华为云接口带宽升级方案与服务响应 SLA。',
    type: 'PDF纪要',
    status: '已完成',
    source: 'PDF解析',
    materials: [
      {
        id: 'mat-pdf-minutes',
        type: 'meeting',
        name: '0802_供应商对接会议纪要.pdf',
        uploadedAt: '2026-08-02 16:30',
        size: '1.8 MB',
      },
    ],
    entities: {
      projects: ['报价平台 V2'],
      customers: ['华为云'],
      people: ['李经理'],
    },
    inReport: true,
  },
  {
    id: 'item-voice-arch',
    date: '07/31',
    weekday: '周五',
    title: '架构演进与能力抽象语音讨论',
    summary: '通过录音提取架构设计核心讨论点：解耦数据采集层与周报生成 Agent。',
    type: '语音录音',
    status: '进行中',
    source: '语音解析',
    materials: [
      {
        id: 'mat-voice-arch',
        type: 'audio',
        name: '架构演进讨论录音.m4a',
        uploadedAt: '2026-07-31 18:00',
        duration: '18:45',
        size: '14.2 MB',
      },
    ],
    entities: {
      projects: ['AI Work'],
      products: ['AI Work'],
      people: ['张三'],
    },
    inReport: false,
  },
];

// ============ 本周周报草稿（第 32 周）============
const week32Items: AiWorkReportItem[] = [
  {
    id: 'report-quote',
    title: '报价平台 V2 接口开发',
    content: '完成报价核心接口开发并进入联调，整体按本周计划推进。',
    project: '报价平台 V2',
    evidenceCount: 3,
    category: 'achievement',
    status: '进入联调',
    materials: [materialAt(2), materialAt(5), materialAt(7)],
    entities: {
      projects: ['报价平台 V2'],
      products: ['报价模块'],
    },
  },
  {
    id: 'report-huada',
    title: '华达智能打印项目推进',
    content: '完成需求确认和现场排查，打印卷曲问题基本解决，进入一周观察期。',
    customer: '华达',
    project: '华达智能打印',
    evidenceCount: 2,
    category: 'work',
    status: '基本解决',
    materials: [materialAt(0), materialAt(1), materialAt(6)],
    entities: {
      projects: ['华达智能打印'],
      customers: ['华达'],
      people: ['王天豪'],
    },
  },
  {
    id: 'report-customer-b',
    title: '客户 B 接口联调延期',
    content:
      '客户测试环境未准备完成，接口联调未能按原计划完成，预计延期至下周三。',
    customer: '客户 B',
    project: '客户 B 集成',
    evidenceCount: 2,
    category: 'risk',
    status: '延期',
    riskLevel: 'high',
    materials: [materialAt(3)],
    entities: {
      projects: ['客户 B 集成'],
      customers: ['客户 B'],
    },
  },
  {
    id: 'report-next-plan',
    title: '下周关键计划',
    content:
      '完成客户 B 接口联调，并持续跟踪华达打印效果，周五前同步联调结果。',
    evidenceCount: 1,
    category: 'plan',
  },
];

const week32Commitments = [
  {
    id: 'commit-customer-b',
    description: '完成客户 B 接口联调',
    plannedWeek: 31,
    currentStatus: 'delayed' as const,
    delayWeeks: 1,
    explanation: '客户测试环境未准备完成，预计延期到下周三。',
  },
];

// ============ 完整周报（3 周）============
export const aiWorkReports: AiWorkReport[] = [
  // 第 32 周（当前，草稿）
  {
    id: 'report-w32',
    weekNumber: 32,
    weekLabel: '第 32 周',
    dateRange: '2026-08-03 至 2026-08-09',
    ownerName: '张三',
    ownerDepartment: '产品研发部',
    status: 'DRAFT',
    completeness: 78,
    items: week32Items,
    plan: week32Items.slice(3, 4),
    materials: aiWorkMaterials,
    entities: {
      projects: ['报价平台 V2', '华达智能打印', '客户 B 集成', 'AI Work'],
      customers: ['华达', '客户 B'],
      products: ['报价模块', 'AI Work'],
      people: ['王天豪'],
    },
    commitments: week32Commitments,
    comments: [],
  },
  // 第 31 周（已通过，带评价和评论）
  {
    id: 'report-w31',
    weekNumber: 31,
    weekLabel: '第 31 周',
    dateRange: '2026-07-27 至 2026-08-02',
    ownerName: '张三',
    ownerDepartment: '产品研发部',
    status: 'APPROVED',
    completeness: 95,
    items: [
      {
        id: 'w31-item-1',
        title: '报价平台 V2 需求评审',
        content: '完成报价平台 V2 的需求评审与技术方案设计，明确接口分工。',
        project: '报价平台 V2',
        evidenceCount: 2,
        category: 'achievement',
        entities: { projects: ['报价平台 V2'], products: ['报价模块'] },
      },
      {
        id: 'w31-item-2',
        title: '华达智能打印项目启动',
        content: '完成项目立项，与客户确认范围，安排本周现场对接。',
        customer: '华达',
        project: '华达智能打印',
        evidenceCount: 3,
        category: 'work',
        entities: {
          projects: ['华达智能打印'],
          customers: ['华达'],
          people: ['王天豪'],
        },
      },
      {
        id: 'w31-item-3',
        title: '客户 B 接口方案确认',
        content: '与客户 B 确认接口方案，承诺下周完成联调。',
        customer: '客户 B',
        project: '客户 B 集成',
        evidenceCount: 1,
        category: 'work',
        entities: { projects: ['客户 B 集成'], customers: ['客户 B'] },
      },
      {
        id: 'w31-plan',
        title: '下周计划',
        content: '完成客户 B 接口联调；完成报价模块接口开发；华达需求确认。',
        evidenceCount: 1,
        category: 'plan',
      },
    ],
    plan: [
      {
        id: 'w31-plan',
        title: '下周计划',
        content: '完成客户 B 接口联调；完成报价模块接口开发；华达需求确认。',
        evidenceCount: 1,
        category: 'plan',
      },
    ],
    materials: [],
    entities: {
      projects: ['报价平台 V2', '华达智能打印', '客户 B 集成'],
      customers: ['华达', '客户 B'],
      products: ['报价模块'],
      people: ['王天豪'],
    },
    commitments: [],
    review: {
      reviewerId: 'manager-li',
      reviewerName: '李经理',
      reviewerRole: '产品研发部负责人',
      score: 4.2,
      comment:
        '整体推进清晰，报价模块进展符合预期。客户 B 联调注意节奏，避免连续延期。',
      itemScores: [
        {
          itemTitle: '报价平台 V2 需求评审',
          score: 4.5,
          comment: '方案清晰，分工明确。',
        },
        {
          itemTitle: '客户 B 接口方案确认',
          score: 3.5,
          comment: '注意环境依赖的前置确认，避免被动延期。',
        },
        {
          itemTitle: '华达智能打印项目启动',
          score: 4.5,
          comment: '响应及时，现场安排合理。',
        },
      ],
      insights: [],
      reviewedAt: '2026-08-03 10:30',
    },
    comments: [
      {
        id: 'comment-w31-1',
        authorId: 'manager-li',
        authorName: '李经理',
        authorRole: 'manager',
        content:
          '客户 B 联调注意节奏，下周三前一定要拿到测试环境就绪的确认，避免再次被动延期。',
        createdAt: '2026-08-03 10:35',
      },
      {
        id: 'comment-w31-2',
        authorId: 'zhang-san',
        authorName: '张三',
        authorRole: 'employee',
        content:
          '收到，客户 B 环境问题我已经和对方确认，下周三前一定完成联调。',
        createdAt: '2026-08-03 14:20',
        replyTo: 'comment-w31-1',
      },
    ],
  },
  // 第 30 周（已通过）
  {
    id: 'report-w30',
    weekNumber: 30,
    weekLabel: '第 30 周',
    dateRange: '2026-07-20 至 2026-07-26',
    ownerName: '张三',
    ownerDepartment: '产品研发部',
    status: 'APPROVED',
    completeness: 92,
    items: [
      {
        id: 'w30-item-1',
        title: '报价平台 V2 立项',
        content: '完成报价平台 V2 立项与排期，确定 MVP 范围。',
        project: '报价平台 V2',
        evidenceCount: 2,
        category: 'achievement',
        entities: { projects: ['报价平台 V2'] },
      },
      {
        id: 'w30-item-2',
        title: '客户 B 需求对接',
        content: '完成客户 B 接口需求首轮对接。',
        customer: '客户 B',
        project: '客户 B 集成',
        evidenceCount: 1,
        category: 'work',
        entities: { projects: ['客户 B 集成'], customers: ['客户 B'] },
      },
      {
        id: 'w30-plan',
        title: '下周计划',
        content: '报价平台 V2 需求评审；华达项目启动准备。',
        evidenceCount: 1,
        category: 'plan',
      },
    ],
    plan: [],
    materials: [],
    entities: {
      projects: ['报价平台 V2', '客户 B 集成'],
      customers: ['客户 B'],
    },
    commitments: [],
    review: {
      reviewerId: 'manager-li',
      reviewerName: '李经理',
      reviewerRole: '产品研发部负责人',
      score: 4.5,
      comment: '本周立项推进高效，下周注意需求评审的细节把控。',
      itemScores: [
        {
          itemTitle: '报价平台 V2 立项',
          score: 4.5,
          comment: '排期合理。',
        },
      ],
      insights: [],
      reviewedAt: '2026-07-27 09:20',
    },
    comments: [],
  },
];

// ============ 后台评分 Agent 产出的洞察（用于审核演示）============
export const aiWorkReviewInsights = [
  {
    id: 'insight-customer-b',
    level: 'high' as const,
    title: '客户 B 联调连续延期',
    detail:
      '该员工第 31 周承诺完成客户 B 接口联调，第 32 周仍未完成，延期 1 周。',
    suggestion: '建议一对一面谈确认真实阻塞因素，明确新的完成日期。',
  },
  {
    id: 'insight-huada',
    level: 'medium' as const,
    title: '华达现场问题待验证',
    detail:
      '打印卷曲问题虽已基本解决，但客户要求观察一周，稳定性尚未被时间验证。',
    suggestion: '下周五前确认观察结果，形成阶段结论。',
  },
];

/** 当前员工（张三）的周报评分趋势 */
export const aiWorkScoreTrend = [
  { weekLabel: '第 28 周', score: 4 },
  { weekLabel: '第 29 周', score: 4.3 },
  { weekLabel: '第 30 周', score: 4.5 },
  { weekLabel: '第 31 周', score: 4.2 },
];

export const aiWorkApplications: AiWorkApplication[] = [
  {
    id: 'zhiji',
    name: '知记',
    description: '汇报：记下每一步，看见自己的成长',
    icon: publicAsset('mate/apps/zhiji.svg'),
    badge: '官方应用',
    badgeTone: 'green',
    path: '/app/mate/apps/zhiji/home',
  },
  {
    id: 'smart-crm',
    name: '知赢',
    description: '销售：懂客户，把握机会，赢得信任',
    icon: publicAsset('mate/apps/smartcrm.png'),
    badge: '官方应用',
    badgeTone: 'green',
    path: '/app/mate/apps/smart-crm',
  },
];

export const aiWorkRecords: AiWorkRecord[] = [
  {
    id: 'record-huada-requirement',
    date: '08/03',
    weekday: '周一',
    title: '华达项目需求确认',
    source: 'AI Hub',
    type: '会议记录',
    project: '华达智能打印',
    customer: '华达',
    status: '已完成',
    summary: '与华达确认智能打印接口范围、验收口径和本周现场安排。',
    inReport: true,
  },
  {
    id: 'record-quote-api',
    date: '08/04',
    weekday: '周二',
    title: '完成报价模块接口开发',
    source: '研发工作台',
    type: '开发记录',
    project: '报价平台 V2',
    status: '进入联调',
    summary: '完成报价核心接口开发，已提交测试环境进入联调。',
    inReport: true,
  },
  {
    id: 'record-huada-print',
    date: '08/05',
    weekday: '周三',
    title: '华达客户现场打印问题处理',
    source: 'AI Hub',
    type: '现场记录',
    project: '华达智能打印',
    customer: '华达',
    status: '基本解决',
    summary: '调整打印参数并更换耗材，卷曲问题基本解决，客户要求继续观察一周。',
    inReport: false,
  },
  {
    id: 'record-customer-b',
    date: '08/06',
    weekday: '周四',
    title: '客户 B 接口联调',
    source: '项目工作台',
    type: '项目记录',
    project: '客户 B 集成',
    customer: '客户 B',
    status: '延期',
    summary: '客户测试环境尚未准备完成，本周无法按原计划完成联调。',
    inReport: true,
  },
  {
    id: 'record-ai-work-review',
    date: '08/07',
    weekday: '周五',
    title: 'AI Work 产品评审',
    source: '会议助手',
    type: '评审记录',
    project: 'AI Work',
    status: '已完成',
    summary: '完成 Demo 信息架构、员工端与管理端主故事评审。',
    inReport: true,
  },
];

export const aiWorkReportItems: AiWorkReportItem[] = week32Items;

export const aiWorkEvidence: AiWorkEvidenceNode[] = [
  {
    id: 'evidence-commitment',
    title: '第 31 周承诺',
    source: '历史周报',
    time: '2026-07-31 17:40',
    excerpt: '下周完成客户 B 接口联调并进入验收准备。',
    icon: 'lucide:flag',
    route: '/app/mate/employee/weekly-assistant/report-history',
  },
  {
    id: 'evidence-record',
    title: '第 32 周工作记录',
    source: '项目工作台',
    time: '2026-08-06 16:20',
    excerpt: '客户测试环境尚未准备完成，本周无法开展完整联调。',
    icon: 'lucide:notebook-text',
    route: '/app/mate/employee/weekly-assistant/work-records',
  },
  {
    id: 'evidence-explanation',
    title: '延期原因补充',
    source: '周报助理对话',
    time: '2026-08-07 15:42',
    excerpt: '客户环境没准备好，预计延期到下周三。',
    icon: 'lucide:message-square-text',
  },
  {
    id: 'evidence-report',
    title: '周报风险条目',
    source: '第 32 周周报',
    time: '2026-08-07 17:26',
    excerpt: '客户 B 接口联调延期，需要项目负责人协助推进测试环境。',
    icon: 'lucide:file-warning',
    route: '/app/mate/employee/weekly-assistant/my-report',
  },
  {
    id: 'evidence-review',
    title: '主管审核结论',
    source: '周报审核',
    time: '2026-08-10 09:40',
    excerpt: '通过并标记重点关注，要求下周三前同步联调结果。',
    icon: 'lucide:shield-check',
    route: '/app/mate/employee/weekly-review/report/zhang-san-w32',
  },
];

export const aiWorkReviewRows: AiWorkReviewRow[] = [
  {
    id: 'zhang-san-w32',
    employee: '张三',
    department: '产品研发部',
    status: '待审核',
    completeness: 93,
    risk: 'high',
    openCommitments: 1,
    project: '华达智能打印',
  },
  {
    id: 'li-si-w32',
    employee: '李四',
    department: '产品研发部',
    status: '待审核',
    completeness: 88,
    risk: 'medium',
    openCommitments: 0,
    project: '客户 B 集成',
  },
  {
    id: 'wang-wu-w32',
    employee: '王五',
    department: '产品研发部',
    status: '已审核',
    completeness: 95,
    risk: 'low',
    openCommitments: 0,
    project: '报价平台 V2',
  },
];
