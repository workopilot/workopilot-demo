import { computed, reactive, ref } from 'vue';

export type CommentKind = 'action' | 'comment' | 'question';

export interface DemoComment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  createdAt: string;
  kind: CommentKind;
  section: string;
  replies?: Array<{ author: string; content: string; createdAt: string }>;
}

export interface EvidenceItem {
  id: string;
  icon: string;
  name: string;
  meta: string;
  summary: string;
  type: 'audio' | 'document' | 'image' | 'video';
  previewUrl?: string;
}

/** 报告类型 = 归属维度（与周期无关）：个人 / 项目 / 产品 / 部门 */
export type ReportType = 'department' | 'personal' | 'product' | 'project';

export const reportTypeLabels: Record<ReportType, string> = {
  personal: '个人',
  project: '项目',
  product: '产品',
  department: '部门',
};

export const reportTypeIcons: Record<ReportType, string> = {
  personal: 'lucide:user',
  project: 'lucide:folder-kanban',
  product: 'lucide:package',
  department: 'lucide:building-2',
};

/** 报告周期：一份报告覆盖的时间区间形态（与报告类型无关，是配置属性） */
export type ReportPeriod =
  'biweekly' | 'custom' | 'daily' | 'monthly' | 'quarterly' | 'weekly';

export const reportPeriodLabels: Record<ReportPeriod, string> = {
  daily: '日报',
  weekly: '周报',
  biweekly: '双周报',
  monthly: '月报',
  quarterly: '季报',
  custom: '自定义区间',
};

/** 报告周期标签配色（报告中心与卡片用） */
export const reportPeriodColors: Record<ReportPeriod, string> = {
  daily: 'cyan',
  weekly: 'green',
  biweekly: 'geekblue',
  monthly: 'purple',
  quarterly: 'orange',
  custom: 'default',
};

/**
 * 报告目录项：我参与的一份报告 = 类型（归属维度）× 对象 × 周期配置。
 * 报告中心第一层；「新建报告」产生的新组合会自动沉淀为目录项。
 */
export interface ReportCatalogItem {
  id: string;
  reportType: ReportType;
  /** 报告名称，含对象与周期，如「华达智能打印项目周报」 */
  title: string;
  /** 补充说明，如「产品研发部 · 韩立」 */
  subtitle?: string;
  period: ReportPeriod;
  /** 生成节奏说明，如「每周五 18:00 截止」 */
  schedule: string;
}

/** 我参与的报告目录（Mock，响应式：新建报告时会追加） */
export const reportCatalog = reactive<ReportCatalogItem[]>([
  {
    id: 'my-daily',
    reportType: 'personal',
    title: '我的日报',
    subtitle: '产品研发部 · 韩立',
    period: 'daily',
    schedule: '每日 18:00 截止',
  },
  {
    id: 'my-weekly',
    reportType: 'personal',
    title: '我的周报',
    subtitle: '产品研发部 · 韩立',
    period: 'weekly',
    schedule: '每周五 18:00 截止',
  },
  {
    id: 'proj-huada-weekly',
    reportType: 'project',
    title: '华达智能打印项目周报',
    subtitle: '项目经理 · 韩立',
    period: 'weekly',
    schedule: '每周五 18:00 截止',
  },
  {
    id: 'prod-woke-weekly',
    reportType: 'product',
    title: '喔壳智能体平台周报',
    subtitle: '产品经理 · 李想',
    period: 'weekly',
    schedule: '每周五 18:00 截止',
  },
  {
    id: 'proj-ningde-monthly',
    reportType: 'project',
    title: '宁德 D4 项目月报',
    subtitle: '项目经理 · 韩立',
    period: 'monthly',
    schedule: '每月最后一个工作日截止',
  },
  {
    id: 'dept-rd-monthly',
    reportType: 'department',
    title: '产品研发部月报',
    subtitle: '部门负责人 · 李建国',
    period: 'monthly',
    schedule: '每月最后一个工作日截止',
  },
]);

export interface WeeklyReportItem {
  id: string;
  /** 所属报告目录（见 reportCatalog）；缺省视为个人周报 */
  catalogId?: string;
  /** 报告覆盖区间起始日（ISO，含当日）；日报 start=end */
  startDate: string;
  /** 报告覆盖区间截止日（ISO，含当日） */
  endDate: string;
  /** 归档分组月，如「8月」，由 startDate 派生 */
  month: string;
  weekLabel: string;
  range: string;
  status: 'draft' | 'reviewed' | 'submitted';
  title: string;
  score: number;
  highlights: string[];
  blockers: string[];
  nextWeek: string[];
  evidenceIds: string[];
  reportType?: ReportType;
}

/** 项目实体（用于项目周报生成） */
export interface ProjectEntity {
  id: string;
  name: string;
  manager: string;
  members: string[];
  stage: string;
}

/** 产品实体（用于产品周报生成） */
export interface ProductEntity {
  id: string;
  name: string;
  productManager: string;
  stage: string;
}

export const mockProjects: ProjectEntity[] = [
  {
    id: 'proj-huada',
    name: '华达智能打印项目',
    manager: '韩立',
    members: ['韩立', '周小曼', '陈浩'],
    stage: '接口联调阶段',
  },
  {
    id: 'proj-customer-portal',
    name: '客户门户项目',
    manager: '张三',
    members: ['张三', '李想'],
    stage: '前端开发阶段',
  },
  {
    id: 'proj-ningde-d4',
    name: '宁德 D4 检测相机升级交付项目',
    manager: '韩立',
    members: ['韩立', '王天豪'],
    stage: '实施研发阶段',
  },
];

export const mockProducts: ProductEntity[] = [
  {
    id: 'prod-woke',
    name: '喔壳智能体平台',
    productManager: '李想',
    stage: '3.0 迭代',
  },
  {
    id: 'prod-quote',
    name: '报价平台 V2',
    productManager: '高飞',
    stage: '联调验证',
  },
  {
    id: 'prod-memory',
    name: '记忆模块',
    productManager: '李想',
    stage: '方案初审',
  },
];

export type AccessRequestStatus = 'approved' | 'pending' | 'rejected';

/** 主动申请查看他人报告的记录 */
export interface AccessRequestItem {
  id: string;
  target: string;
  targetDept: string;
  reportType: ReportType;
  reason: string;
  createdAt: string;
  status: AccessRequestStatus;
}

/** 待我审批的报告（审阅助理 · 我的审批） */
export interface PendingApprovalItem {
  id: string;
  author: string;
  avatar: string;
  dept: string;
  title: string;
  summary: string;
  reportType: ReportType;
  /** 报告周期（日报实例用于弹窗预览等场景） */
  period?: ReportPeriod;
  weekLabel: string;
  /** ISO 日期，用于时间段筛选 */
  date: string;
  /** 所属周次，用于本周/上周快捷筛选 */
  weekKey: 'w33' | 'w34';
  submittedAt: string;
  status: 'approved' | 'missing' | 'pending';
  score: number;
  entities: string[];
  /** 日报正文（Markdown/文本），仅日报类型用到 */
  content?: string;
  /** 关联附件 id（引用 evidenceItems） */
  attachmentIds?: string[];
}

/** 我订阅的报告（审阅助理 · 我的订阅） */
export interface SubscribedReportItem {
  id: string;
  author: string;
  avatar: string;
  dept: string;
  title: string;
  summary: string;
  reportType: ReportType;
  weekLabel: string;
  publishedAt: string;
  score: number;
  entities: string[];
}

/** 催办任务 */
export interface ReminderItem {
  id: string;
  target: string;
  reportType: ReportType;
  weekLabel: string;
  kind: 'not-approved' | 'not-submitted';
  dueAt: string;
  sentAt: string;
}

export interface WorkRecordItem {
  id: string;
  date: string;
  weekday: string;
  time: string;
  title: string;
  original?: string;
  source: 'conversation' | 'manual';
  evidenceIds: string[];
  entities: Array<{ name: string; type: '产品' | '客户' | '项目' }>;
}

export type MentionStatus =
  'ignored' | 'known' | 'pending' | 'recorded' | 'replied';
export type MentionType = 'assist' | 'fyi' | 'reply';

export interface MentionItem {
  id: string;
  author: string;
  avatar: string;
  department: string;
  week: string;
  createdAt: string;
  type: MentionType;
  status: MentionStatus;
  summary: string;
  excerpt: string;
  reportTitle: string;
  section: string;
  entities: string[];
  response?: string;
}

export interface ApprovalStyleChange {
  id: string;
  type: 'added' | 'merged' | 'reinforced' | 'replaced';
  title: string;
  detail: string;
  evidence: string;
}

export interface HtmlPromptTemplate {
  id: string;
  name: string;
  description: string;
  accent: string;
  prompt: string;
  system?: boolean;
}

export interface GeneratedReportVersion {
  reportId: string;
  markdown: string;
  prompt: string;
  templateId: string;
  generatedAt: string;
  htmlGenerated?: boolean;
}

const w34ReferenceMarkdown = `# 喔壳智能体平台研发周报

> 汇报人：韩立 · 产品研发部 · 第 3 周（W34）

## 本周概览

本周围绕喔壳智能体平台推进指令功能、AI 服务和嵌入端能力建设，同时完成客户端 Demo、汇报材料、方案设计及技能编写等线下工作。

## 上周计划及完成度

- **附件分类技能**：已完成编写，完成度 100%；尚未完成测试验证。
- **附件审核技能**：已完成编写，完成度 100%；尚未完成测试验证。
- **定时任务设计**：已完成需求方案、接口草案及数据库脚本，完成度 100%。

## 一、研发工作

### 1. 指令功能模块
- **指令配置与调用**：新增数字员工指令配置与调用能力。
- **指令模板管理**：完善查询、保存、删除和导入模板等能力。
- **指令入口优化**：优化前端指令入口、快捷操作及工作台展示。
- **指令数据模型**：完成数据库迁移和前后端数据模型补充。

### 2. AI 服务与嵌入端能力
- **外部 AI 服务接口**：新增外部 AI 服务详情接口。
- **AI Chat 体验优化**：优化指令入口和历史会话分页。
- **嵌入端身份识别**：修复身份识别和语言识别问题。

## 二、方案设计与文档
- **记忆模块**：完成记忆模块设计方案初审。
- **定时任务方案**：完成定时方案设计与规则梳理。
- **定时任务文档**：完成需求文档、接口草案及 MySQL 初始化脚本。

## 三、线下工作补充
- **喔壳客户端 Demo**：完成客户端 Demo 设计。
- **汇报材料**：编写智能审核、智能填报、开发等 4 个 PPT。
- **附件技能**：完成附件分类和审核技能编写，尚未测试验证。

## 五、下周建议
- [ ] 优先测试附件分类技能和附件审核技能。
- [ ] 对指令、嵌入端和 AI Chat 改动进行联调回归。
- [ ] 根据初审意见完善记忆模块方案。`;

export const evidenceItems: EvidenceItem[] = [
  {
    id: 'ev-audio',
    name: '华达现场沟通录音.m4a',
    meta: '12:34 · 8 月 5 日',
    type: 'audio',
    icon: 'lucide:audio-waveform',
    summary:
      '客户确认打印问题已基本解决；接口联调环境尚未就绪，预计 8 月 14 日开放。关键内容位于 06:20—08:45。',
    previewUrl:
      'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
  },
  {
    id: 'ev-design',
    name: '报价模块接口设计文档.docx',
    meta: '1.4 MB · 8 月 4 日',
    type: 'document',
    icon: 'lucide:file-text',
    summary:
      '包含报价平台 V2 的接口范围、验收口径和测试清单，本周已完成核心接口开发。',
  },
  {
    id: 'ev-photo',
    name: '华达现场打印照片.png',
    meta: '3.6 MB · 8 月 5 日',
    type: 'image',
    icon: 'lucide:image',
    summary: '现场更换耗材并调整打印参数后的测试结果，打印质量恢复正常。',
  },
  {
    id: 'ev-meeting',
    name: '客户需求评审会议.mp4',
    meta: '28:10 · 8 月 1 日',
    type: 'video',
    icon: 'lucide:video',
    summary:
      '销售向客户承诺提供批量导入能力，但研发与交付排期中尚未出现对应工作。关键内容位于 18:12。',
    previewUrl:
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
];

export const workRecords = ref<WorkRecordItem[]>([
  {
    id: 'wr-20260814-1',
    date: '2026-08-14',
    weekday: '周五',
    time: '17:42',
    title: '完成华达接口对接开发工作',
    original: '今天开发完了华大的接口',
    source: 'conversation',
    evidenceIds: ['ev-design'],
    entities: [
      { name: '华达智能打印项目', type: '项目' },
      { name: '华达', type: '客户' },
    ],
  },
  {
    id: 'wr-20260814-2',
    date: '2026-08-14',
    weekday: '周五',
    time: '16:20',
    title: '完成 AI Chat 历史会话分页回归验证',
    source: 'manual',
    evidenceIds: [],
    entities: [{ name: '喔壳智能体平台', type: '产品' }],
  },
  {
    id: 'wr-20260814-3',
    date: '2026-08-14',
    weekday: '周五',
    time: '14:08',
    title: '补充外部 AI 服务详情接口说明文档',
    source: 'conversation',
    evidenceIds: ['ev-design'],
    entities: [{ name: '喔壳智能体平台', type: '产品' }],
  },
  {
    id: 'wr-20260813-1',
    date: '2026-08-13',
    weekday: '周四',
    time: '18:10',
    title: '完成指令入口与指令模板管理优化',
    source: 'manual',
    evidenceIds: [],
    entities: [{ name: '喔壳智能体平台', type: '产品' }],
  },
  {
    id: 'wr-20260813-2',
    date: '2026-08-13',
    weekday: '周四',
    time: '16:44',
    title: '完成数字员工指令快捷入口交互调整',
    source: 'conversation',
    evidenceIds: [],
    entities: [{ name: '喔壳智能体平台', type: '产品' }],
  },
  {
    id: 'wr-20260813-3',
    date: '2026-08-13',
    weekday: '周四',
    time: '11:26',
    title: '与测试确认嵌入端鉴权兼容范围',
    source: 'manual',
    evidenceIds: ['ev-audio'],
    entities: [{ name: '喔壳智能体平台', type: '产品' }],
  },
  {
    id: 'wr-20260812-1',
    date: '2026-08-12',
    weekday: '周三',
    time: '16:35',
    title: '完成定时任务方案、接口草案及数据库脚本',
    source: 'manual',
    evidenceIds: ['ev-design'],
    entities: [{ name: '喔壳智能体平台', type: '产品' }],
  },
  {
    id: 'wr-20260812-2',
    date: '2026-08-12',
    weekday: '周三',
    time: '14:12',
    title: '完成记忆模块设计方案初审问题整理',
    source: 'manual',
    evidenceIds: [],
    entities: [{ name: '喔壳智能体平台', type: '产品' }],
  },
  {
    id: 'wr-20260812-3',
    date: '2026-08-12',
    weekday: '周三',
    time: '10:05',
    title: '输出定时任务失败处理与幂等规则',
    source: 'conversation',
    evidenceIds: [],
    entities: [{ name: '喔壳智能体平台', type: '产品' }],
  },
  {
    id: 'wr-20260811-1',
    date: '2026-08-11',
    weekday: '周二',
    time: '18:06',
    title: '完成附件分类技能和附件审核技能编写',
    source: 'conversation',
    evidenceIds: ['ev-photo'],
    entities: [{ name: '喔壳智能体平台', type: '产品' }],
  },
  {
    id: 'wr-20260811-2',
    date: '2026-08-11',
    weekday: '周二',
    time: '15:30',
    title: '完成客户端 Demo 导航与页面状态走查',
    source: 'manual',
    evidenceIds: ['ev-photo'],
    entities: [{ name: '喔壳客户端 Demo', type: '项目' }],
  },
  {
    id: 'wr-20260811-3',
    date: '2026-08-11',
    weekday: '周二',
    time: '10:18',
    title: '整理智能审核与智能填报汇报材料',
    source: 'conversation',
    evidenceIds: [],
    entities: [],
  },
  {
    id: 'wr-20260810-1',
    date: '2026-08-10',
    weekday: '周一',
    time: '17:18',
    title: '修复嵌入端身份识别与语言识别问题',
    source: 'manual',
    evidenceIds: [],
    entities: [{ name: '喔壳智能体平台', type: '产品' }],
  },
  {
    id: 'wr-20260810-2',
    date: '2026-08-10',
    weekday: '周一',
    time: '14:36',
    title: '完成指令相关数据库迁移脚本验证',
    source: 'manual',
    evidenceIds: [],
    entities: [{ name: '喔壳智能体平台', type: '产品' }],
  },
]);

function normalizeWorkRecordTitle(original: string) {
  if (/华达/.test(original) && /接口/.test(original)) {
    return '完成开发华达接口对接工作';
  }
  return original
    .replace(/^今天/, '')
    .replace(/开发完了/, '完成开发')
    .replace(/做完了/, '完成')
    .replace(/处理完了/, '完成处理')
    .trim();
}

export function addWorkRecordFromConversation(original: string) {
  const title = normalizeWorkRecordTitle(original);
  const record: WorkRecordItem = {
    id: `wr-${Date.now()}`,
    date: '2026-08-14',
    weekday: '周五',
    time: '刚刚',
    title,
    original,
    source: 'conversation',
    evidenceIds: [],
    entities: /华达/.test(original)
      ? [
          { name: '华达智能打印项目', type: '项目' },
          { name: '华达', type: '客户' },
        ]
      : [],
  };
  workRecords.value.unshift(record);
  return record;
}

export function addManualWorkRecord(title: string) {
  const record: WorkRecordItem = {
    id: `wr-${Date.now()}`,
    date: '2026-08-14',
    weekday: '周五',
    time: '刚刚',
    title: title.trim(),
    source: 'manual',
    evidenceIds: [],
    entities: [],
  };
  workRecords.value.unshift(record);
  return record;
}

export const mentionItems = ref<MentionItem[]>([
  {
    id: 'mention-1',
    author: '张三',
    avatar: '项目经理.jpg',
    department: '产品研发部',
    week: '第 3 周（W34）',
    createdAt: '今天 09:18',
    type: 'assist',
    status: 'pending',
    summary:
      '张三希望你协助完成客户门户的前端页面，并在下周五前交付可联调版本。',
    excerpt:
      '客户门户后端接口已经完成，下一步需要李四协助开发前端页面，希望下周五前能够提供可联调版本。接口文档今天会同步到项目群。',
    reportTitle: '客户门户项目研发周报',
    section: '下周计划',
    entities: ['客户门户项目', '客户 B'],
  },
  {
    id: 'mention-2',
    author: '赵琳',
    avatar: '商务分析助手.jpg',
    department: '销售部',
    week: '第 3 周（W34）',
    createdAt: '今天 10:06',
    type: 'reply',
    status: 'pending',
    summary:
      '赵琳需要你确认批量导入功能是否能够进入本周研发排期，以便回复华达客户。',
    excerpt:
      '华达客户希望本月增加批量导入能力，目前需要李四确认研发工作量和本周是否能够排期，我将在确认后回复客户。',
    reportTitle: '重点客户推进与续费周报',
    section: '需要协同',
    entities: ['华达客户', '批量导入'],
  },
  {
    id: 'mention-3',
    author: '周小曼',
    avatar: '项目经理.jpg',
    department: '交付部',
    week: '第 3 周（W34）',
    createdAt: '昨天 17:42',
    type: 'fyi',
    status: 'pending',
    summary:
      '周小曼在华达项目风险说明中将你列为技术协同人，需要你知晓新的联调时间。',
    excerpt:
      '客户环境预计 8 月 17 日开放，接口联调顺延至下周。李四作为技术协同人，需要提前准备测试账号和联调脚本。',
    reportTitle: '客户交付与现场支持周报',
    section: '风险与阻塞',
    entities: ['华达智能打印项目'],
  },
  {
    id: 'mention-4',
    author: '孙悦',
    avatar: '数据分析师.jpg',
    department: '测试部',
    week: '第 2 周（W33）',
    createdAt: '8 月 9 日',
    type: 'assist',
    status: 'recorded',
    summary: '孙悦希望你协助定位嵌入端语言识别问题，该事项已转入你的工作记录。',
    excerpt:
      '嵌入端语言识别在英文环境下仍会回退到中文，需要李四协助定位身份和语言上下文传递问题。',
    reportTitle: '质量保障与回归测试周报',
    section: '问题清单',
    entities: ['喔壳智能体平台'],
  },
  {
    id: 'mention-5',
    author: '林悦',
    avatar: '设计师.jpg',
    department: '设计部',
    week: '第 2 周（W33）',
    createdAt: '8 月 8 日',
    type: 'fyi',
    status: 'known',
    summary: '林悦说明新版汇报工作台已经按照你的反馈调整，你已标记知晓。',
    excerpt:
      '新版汇报工作台已按照李四提出的阅读密度建议完成调整，周报正文区域增加了更多展示空间。',
    reportTitle: '产品设计与体验优化周报',
    section: '本周成果',
    entities: ['汇报助理'],
  },
]);

export const pendingMentionCount = computed(
  () => mentionItems.value.filter((item) => item.status === 'pending').length,
);

export function updateMentionStatus(id: string, status: MentionStatus) {
  const mention = mentionItems.value.find((item) => item.id === id);
  if (mention) mention.status = status;
}

export function replyMention(id: string, response: string) {
  const mention = mentionItems.value.find((item) => item.id === id);
  if (!mention) return;
  mention.response = response;
  mention.status = 'replied';
}

export function convertMentionToWorkRecord(id: string) {
  const mention = mentionItems.value.find((item) => item.id === id);
  if (!mention) return;
  addManualWorkRecord(
    mention.summary.replace(/^.+?希望你/, '').replace(/^.+?需要你/, ''),
  );
  mention.status = 'recorded';
}

export const approvalStyleMarkdown = ref(`# 我的审批风格

> 由 AI 根据我的历史审批、评分调整和最终回复持续提炼。岗位审核策略始终优先于本文件。

## 审批原则

- 先判断工作成果和承诺是否形成闭环，再判断表达是否完整。
- 对技术成果，不只看“完成了什么”，还要说明业务价值、验证结果或下一步落地场景。
- 对延期事项不简单否定，重点确认原因、新完成时间和需要的管理支持。

## 重点关注

- 延期或连续两周没有推进的事项。
- 销售承诺与研发、交付排期尚未对齐的跨部门事项。
- 下周计划缺少负责人、完成时间或验收标准。
- 已完成开发但缺少测试、联调或客户验证证据的事项。

## 追问逻辑

- 连续两周未推进：追问阻塞原因、最新完成时间和所需支持。
- 客户原因延期：确认客户侧责任人、开放时间以及内部是否可以提前准备。
- 跨部门协作：检查被提及人员是否已经收到并回应。
- 技术成果：追问首个业务场景和可量化收益。

## 不同事项的回复方式

### 已完成事项
先肯定成果；如果具有复用价值，建议沉淀为方案、手册或技能。

### 延期事项
要求补充延期原因、新完成时间、负责人和支持需求，避免只描述“继续跟进”。

### 风险事项
明确风险等级、影响范围和下一次检查时间；必要时指定跨部门协调人。

### 协作请求
确认被协作人是否已知晓；如果未回应，在评价中明确要求完成协作确认。

## 评分倾向

- 成果完整且有验证证据：4.5 分以上。
- 主体成果完成但验证或业务价值不清晰：4.0–4.5 分。
- 延期未说明原因或下周计划不可执行：4.0 分以下。
`);

export const approvalStyleChanges = ref<ApprovalStyleChange[]>([
  {
    id: 'change-1',
    type: 'added',
    title: '新增“协作请求”的回复逻辑',
    detail: '跨部门协作需要检查被提及人员是否已经收到并回应。',
    evidence: '来自本周 3 份涉及跨部门协作的审批回复',
  },
  {
    id: 'change-2',
    type: 'replaced',
    title: '更新延期事项判断',
    detail: '从“说明延期原因”强化为“原因、新完成时间、负责人和支持需求”。',
    evidence: '来自赵琳、周小曼周报的最终评价',
  },
  {
    id: 'change-3',
    type: 'merged',
    title: '合并重复的技术价值追问',
    detail: '将 3 条相似表达合并为“首个业务场景和可量化收益”。',
    evidence: '来自最近 4 周的 8 条主管追问',
  },
]);

/** Demo 时间锚点：演示数据统一以 2026-08-14 为"今天" */
export const DEMO_TODAY = '2026-08-14';

export const reportArchive = reactive<WeeklyReportItem[]>([
  {
    id: '2026-m08-ningde',
    catalogId: 'proj-ningde-monthly',
    reportType: 'project',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    month: '8月',
    weekLabel: '8月月报',
    range: '8/1—8/31',
    status: 'draft',
    title: '宁德 D4 检测相机升级交付项目月报',
    score: 0,
    highlights: [
      '完成检测相机嵌入式软件升级方案评审，进入实施研发阶段。',
      '与客户确认 9 月现场部署窗口，交付计划已同步项目群。',
    ],
    blockers: ['客户现场网络改造进度滞后，可能影响部署窗口。'],
    nextWeek: ['输出实施研发排期', '跟踪客户网络改造进度'],
    evidenceIds: ['ev-design'],
  },
  {
    id: '2026-m08-dept',
    catalogId: 'dept-rd-monthly',
    reportType: 'department',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    month: '8月',
    weekLabel: '8月月报',
    range: '8/1—8/31',
    status: 'submitted',
    title: '产品研发部月报',
    score: 88,
    highlights: [
      '指令功能与 AI 服务能力建设完成阶段性目标，进入联调回归。',
      '记忆模块方案完成初审，下阶段排期已对齐。',
    ],
    blockers: ['批量导入能力销售承诺与研发排期尚未对齐。'],
    nextWeek: ['完成 3.0 迭代联调回归', '确认批量导入范围与排期'],
    evidenceIds: ['ev-design'],
  },
  {
    id: '2026-m07-ningde',
    catalogId: 'proj-ningde-monthly',
    reportType: 'project',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    month: '7月',
    weekLabel: '7月月报',
    range: '7/1—7/31',
    status: 'reviewed',
    title: '宁德 D4 检测相机升级交付项目月报',
    score: 90,
    highlights: [
      '完成现场勘查与升级范围确认，输出实施方案初稿。',
      '与客户对齐验收口径，明确检测精度回归标准。',
    ],
    blockers: [],
    nextWeek: ['完成方案评审', '启动实施研发'],
    evidenceIds: [],
  },
  {
    id: '2026-w34',
    catalogId: 'my-weekly',
    reportType: 'personal',
    startDate: '2026-08-17',
    endDate: '2026-08-23',
    month: '8月',
    weekLabel: '第 3 周（W34）',
    range: '8/17—8/23',
    status: 'draft',
    title: '喔壳智能体平台研发周报',
    score: 92,
    highlights: [
      '完成新版汇报生成工作流设计，支持 Markdown 编辑与 HTML 独立预览。',
      '梳理华达客户现场问题材料，并补充接口联调的关键进展。',
    ],
    blockers: ['客户 B 测试环境开放时间仍待最终确认，可能影响本周联调计划。'],
    nextWeek: ['完成 HTML 分享页验收', '确认客户 B 联调时间并同步项目负责人'],
    evidenceIds: ['ev-audio', 'ev-design', 'ev-photo', 'ev-meeting'],
  },
  {
    id: '2026-w33',
    catalogId: 'my-weekly',
    reportType: 'personal',
    startDate: '2026-08-10',
    endDate: '2026-08-16',
    month: '8月',
    weekLabel: '第 2 周（W33）',
    range: '8/10—8/16',
    status: 'submitted',
    title: '产品研发部个人工作汇报',
    score: 86,
    highlights: ['完成报价平台 V2 联调准备', '推进华达客户接口环境确认'],
    blockers: ['客户接口环境开放时间仍需确认'],
    nextWeek: ['完成接口联调', '输出现场问题复盘'],
    evidenceIds: ['ev-design'],
  },
  {
    id: '2026-w32',
    catalogId: 'my-weekly',
    reportType: 'personal',
    startDate: '2026-08-03',
    endDate: '2026-08-09',
    month: '8月',
    weekLabel: '第 1 周（W32）',
    range: '8/3—8/9',
    status: 'reviewed',
    title: '产品研发部个人工作汇报',
    score: 92,
    highlights: [
      '完成报价平台 V2 核心接口开发，并提交测试环境进入联调。',
      '处理华达客户现场打印问题，更换耗材并调整参数后已基本恢复。',
      '完成华达智能打印接口范围与验收口径确认。',
    ],
    blockers: [
      '客户 B 接口联调因客户测试环境未准备完成而延期，新的计划时间为 8 月 14 日。',
      '批量导入能力已对客户承诺，但研发和交付侧暂未形成明确排期。',
    ],
    nextWeek: [
      '完成客户 B 接口联调并提交验收记录。',
      '与销售、交付共同确认批量导入范围和排期。',
      '沉淀华达现场打印问题处理手册。',
    ],
    evidenceIds: ['ev-audio', 'ev-design', 'ev-photo', 'ev-meeting'],
  },
  {
    id: '2026-w31',
    catalogId: 'my-weekly',
    reportType: 'personal',
    startDate: '2026-07-27',
    endDate: '2026-08-02',
    month: '7月',
    weekLabel: '第 5 周（W31）',
    range: '7/27—8/2',
    status: 'reviewed',
    title: '产品研发部个人工作汇报',
    score: 89,
    highlights: ['确认报价平台 V2 开发范围', '完成客户 B 联调方案'],
    blockers: ['等待客户提供测试环境'],
    nextWeek: ['完成核心接口开发', '推进客户 B 接口联调'],
    evidenceIds: ['ev-design'],
  },
]);

export const selectedReportId = ref('2026-w34');

/** 某报告目录下的全部历史实例（按时间倒序） */
export function catalogReports(catalogId: string): WeeklyReportItem[] {
  return reportArchive
    .filter((item) => (item.catalogId ?? 'my-weekly') === catalogId)
    .toSorted((a, b) => (a.id < b.id ? 1 : -1));
}

/** 报告目录概要：本期草稿 + 最近一期 + 总份数（报告中心卡片用） */
export function getCatalogSummary(catalogId: string) {
  const reports = catalogReports(catalogId);
  return {
    draft: reports.find((item) => item.status === 'draft'),
    latest: reports[0],
    total: reports.length,
  };
}

// ===== 报告区间与日期查询 =====

function parseISODate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

function toISODate(date: Date): string {
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** 展示区间，如 8/17—8/23（同月省略右侧月份） */
export function formatRangeLabel(start: string, end: string): string {
  const s = parseISODate(start);
  const e = parseISODate(end);
  const left = `${s.getMonth() + 1}/${s.getDate()}`;
  const right =
    s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()
      ? `${e.getDate()}`
      : `${e.getMonth() + 1}/${e.getDate()}`;
  return `${left}—${right}`;
}

/** 归档分组月，如「8月」 */
function monthLabelOf(start: string): string {
  return `${parseISODate(start).getMonth() + 1}月`;
}

/** ISO 8601 周序号（W34 的 34） */
function isoWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((d.getTime() - yearStart.getTime()) / 86_400_000 / 7 + 1);
}

/** 期次展示标签：日报 8月14日 / 周报 第 3 周（W34）/ 月报 8月月报 / 自定义区间用范围 */
export function instancePeriodLabel(
  period: ReportPeriod,
  start: string,
  end: string,
): string {
  const s = parseISODate(start);
  switch (period) {
    case 'biweekly': {
      return `第 ${Math.ceil(isoWeekNumber(s) / 2)} 期（双周）`;
    }
    case 'daily': {
      return `${s.getMonth() + 1}月${s.getDate()}日`;
    }
    case 'monthly': {
      return `${s.getMonth() + 1}月月报`;
    }
    case 'quarterly': {
      return `Q${Math.floor(s.getMonth() / 3) + 1} 季报`;
    }
    case 'weekly': {
      const weekOfMonth = Math.ceil(s.getDate() / 7);
      return `第 ${weekOfMonth} 周（W${isoWeekNumber(s)}）`;
    }
    default: {
      return `${formatRangeLabel(start, end)} 专项报告`;
    }
  }
}

/** 各周期「本期」的默认日期区间（以 DEMO_TODAY 为锚点） */
export function currentPeriodRange(period: ReportPeriod): [string, string] {
  const today = parseISODate(DEMO_TODAY);
  switch (period) {
    case 'biweekly': {
      const half = today.getDate() <= 15 ? [1, 15] : [16, -1];
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return [
        toISODate(new Date(today.getFullYear(), today.getMonth(), half[0])),
        toISODate(
          new Date(
            today.getFullYear(),
            today.getMonth(),
            half[1] === -1 ? lastDay.getDate() : half[1],
          ),
        ),
      ];
    }
    case 'daily': {
      return [DEMO_TODAY, DEMO_TODAY];
    }
    case 'monthly': {
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return [
        toISODate(new Date(today.getFullYear(), today.getMonth(), 1)),
        toISODate(lastDay),
      ];
    }
    case 'quarterly': {
      const qStartMonth = Math.floor(today.getMonth() / 3) * 3;
      const qEnd = new Date(today.getFullYear(), qStartMonth + 3, 0);
      return [
        toISODate(new Date(today.getFullYear(), qStartMonth, 1)),
        toISODate(qEnd),
      ];
    }
    case 'weekly': {
      const mondayOffset = (today.getDay() + 6) % 7;
      const monday = addDays(today, -mondayOffset);
      return [toISODate(monday), toISODate(addDays(monday, 6))];
    }
    default: {
      return [DEMO_TODAY, DEMO_TODAY];
    }
  }
}

/**
 * 日期区间查询：返回与 [start, end] 有交集的报告实例。
 * 日报是 start=end 的特例；不传区间则返回全部。
 */
export function filterReportsByRange(
  reports: WeeklyReportItem[],
  start?: string,
  end?: string,
): WeeklyReportItem[] {
  if (!start || !end) return reports;
  return reports.filter(
    (item) => item.startDate <= end && item.endDate >= start,
  );
}

// ===== 新建报告（从 0 生成） =====

const periodScheduleLabels: Record<ReportPeriod, string> = {
  daily: '每日 18:00 截止',
  weekly: '每周五 18:00 截止',
  biweekly: '双周周五 18:00 截止',
  monthly: '每月最后一个工作日截止',
  quarterly: '每季度末月最后一个工作日截止',
  custom: '按所选区间生成',
};

export interface CreateReportInput {
  reportType: ReportType;
  /** 对象名称：个人填「我的」，其余填项目 / 产品 / 部门名 */
  target: string;
  period: ReportPeriod;
  startDate: string;
  endDate: string;
}

/** 报告标题：个人 → 我的日报；其余 → 对象 + 周期，如「华达智能打印项目月报」 */
export function buildReportTitle(
  input: Pick<CreateReportInput, 'period' | 'reportType' | 'target'>,
): string {
  if (input.period === 'custom') {
    return `${input.target}专项报告`;
  }
  const suffix = reportPeriodLabels[input.period];
  return input.reportType === 'personal'
    ? `我的${suffix}`
    : `${input.target}${suffix}`;
}

/** 按 标题+周期 匹配现有目录项，没有则沉淀为新目录项 */
export function ensureReportCatalog(
  input: CreateReportInput,
): ReportCatalogItem {
  const title = buildReportTitle(input);
  const existing = reportCatalog.find((item) => item.title === title);
  if (existing) return existing;
  const item: ReportCatalogItem = {
    id: `${input.reportType}-${Date.now()}`,
    reportType: input.reportType,
    title,
    period: input.period,
    schedule: periodScheduleLabels[input.period],
  };
  reportCatalog.push(item);
  return item;
}

/** 新建报告实例：创建本期草稿（空内容，进入工作区后由助理完善） */
export function createReportInstance(
  input: CreateReportInput,
): WeeklyReportItem {
  const catalog = ensureReportCatalog(input);
  const item: WeeklyReportItem = {
    id: `${catalog.id}-${Date.now()}`,
    catalogId: catalog.id,
    reportType: catalog.reportType,
    startDate: input.startDate,
    endDate: input.endDate,
    month: monthLabelOf(input.startDate),
    weekLabel: instancePeriodLabel(
      input.period,
      input.startDate,
      input.endDate,
    ),
    range: formatRangeLabel(input.startDate, input.endDate),
    status: 'draft',
    title: catalog.title,
    score: 0,
    highlights: [],
    blockers: [],
    nextWeek: [],
    evidenceIds: [],
  };
  reportArchive.unshift(item);
  return item;
}

/** 为目录生成本期草稿（工作区「生成本期报告」入口） */
export function createCurrentDraft(
  catalog: ReportCatalogItem,
): WeeklyReportItem {
  const [startDate, endDate] = currentPeriodRange(catalog.period);
  return createReportInstance({
    reportType: catalog.reportType,
    target: catalog.reportType === 'personal' ? '我的' : catalog.title,
    period: catalog.period,
    startDate,
    endDate,
  });
}

/** 汇报助理提交后更新共享报告实例，供报告中心和审阅助理读取。 */
export function submitReportInstance(reportId: string) {
  const report = reportArchive.find((item) => item.id === reportId);
  if (!report) return undefined;
  report.status = 'submitted';
  return report;
}

export function withdrawReportInstance(reportId: string) {
  const report = reportArchive.find((item) => item.id === reportId);
  if (!report) return undefined;
  report.status = 'draft';
  return report;
}
export const htmlPromptTemplates: HtmlPromptTemplate[] = [
  {
    id: 'executive',
    name: '管理摘要',
    description: '结论优先、风险醒目，适合主管快速审阅。',
    accent: '#0b806f',
    prompt:
      '将 Markdown 生成为专业的管理周报 HTML。结论优先，突出关键成果、风险、需要支持和下周计划；使用克制的企业绿色，信息密度中等，适合主管在 3 分钟内阅读完成。',
  },
  {
    id: 'project',
    name: '项目进展',
    description: '突出里程碑、阻塞和跨部门依赖。',
    accent: '#3c78a8',
    prompt:
      '将 Markdown 生成为项目进展型 HTML。突出里程碑、完成状态、延期原因、负责人和跨部门依赖；采用清晰的蓝绿色时间线与状态标签。',
  },
  {
    id: 'editorial',
    name: '复盘长文',
    description: '更舒展的阅读排版，适合经验沉淀与分享。',
    accent: '#9a6a3a',
    prompt:
      '将 Markdown 生成为具有编辑感的工作复盘 HTML。使用舒展的文章排版、清晰的章节引导和适量留白，强调背景、过程、结果与经验。',
  },
];

const generatedStorageKey = 'mate-generated-report-versions-v2';
const promptStorageKey = 'mate-html-prompt-templates';

function readSavedPromptTemplates(): HtmlPromptTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(promptStorageKey) || '[]');
  } catch {
    return [];
  }
}

export const savedHtmlPromptTemplates = ref<HtmlPromptTemplate[]>(
  readSavedPromptTemplates(),
);
export const availableHtmlPromptTemplates = computed(() => [
  ...htmlPromptTemplates.map((item) => ({ ...item, system: true })),
  ...savedHtmlPromptTemplates.value,
]);

function readGeneratedVersions(): Record<string, GeneratedReportVersion> {
  const defaults: Record<string, GeneratedReportVersion> = {
    '2026-w34': {
      reportId: '2026-w34',
      markdown: w34ReferenceMarkdown,
      prompt: htmlPromptTemplates[0]?.prompt ?? '',
      templateId: 'executive',
      generatedAt: '今天 18:30',
      htmlGenerated: true,
    },
  };
  if (typeof window === 'undefined') return defaults;
  try {
    return {
      ...defaults,
      ...JSON.parse(localStorage.getItem(generatedStorageKey) || '{}'),
    };
  } catch {
    return defaults;
  }
}

export const generatedReportVersions = ref<
  Record<string, GeneratedReportVersion>
>(readGeneratedVersions());
export const liked = ref(false);
export const likeCount = ref(12);
export const comments = ref<DemoComment[]>([
  {
    id: 'c1',
    author: '李建国',
    avatar: '李',
    content: '现场问题处理得很好，建议把经验沉淀为操作手册。',
    createdAt: '今天 09:20',
    kind: 'comment',
    section: '本周成果',
  },
  {
    id: 'c2',
    author: '李建国',
    avatar: '李',
    content: '客户 B 接口联调为什么连续两周没有推进？请补充新的完成时间。',
    createdAt: '今天 09:26',
    kind: 'question',
    section: '问题与阻塞',
    replies: [
      {
        author: '王天豪',
        content: '客户环境尚未准备完成，已确认 8 月 14 日开放，届时立即联调。',
        createdAt: '今天 10:08',
      },
    ],
  },
  {
    id: 'c3',
    author: '周小曼',
    avatar: '周',
    content: '批量导入和交付侧已有能力可能重叠，建议三方确认范围。',
    createdAt: '今天 10:12',
    kind: 'action',
    section: '下周计划',
  },
]);
export const sharedWith = ref(['直属主管 · 可审阅', '产品研发部 · 可评论']);

export const selectedReport = computed(
  () =>
    reportArchive.find((item) => item.id === selectedReportId.value) ||
    reportArchive[0],
);

export function toggleLike() {
  liked.value = !liked.value;
  likeCount.value += liked.value ? 1 : -1;
}

export function addComment(content: string, kind: CommentKind = 'comment') {
  comments.value.push({
    id: `c-${Date.now()}`,
    author: '韩立',
    avatar: '韩',
    content,
    createdAt: '刚刚',
    kind,
    section: '整份汇报',
  });
}

export function buildReportMarkdown(report: WeeklyReportItem) {
  const reportEvidence = report.evidenceIds
    .map((id) => evidenceItems.find((item) => item.id === id))
    .filter(Boolean) as EvidenceItem[];
  return `# ${report.title}\n\n> 2026 年 ${report.month} ${report.weekLabel} · ${report.range}\n\n## 本周成果\n${report.highlights.map((item) => `- ${item}`).join('\n')}\n\n## 问题与阻塞\n${report.blockers.map((item) => `- ${item}`).join('\n')}\n\n## 下周计划\n${report.nextWeek.map((item) => `- [ ] ${item}`).join('\n')}\n\n## 引用资料\n${reportEvidence.map((item) => `- ${item.name}`).join('\n')}`;
}

export function getReportMarkdown(report: WeeklyReportItem) {
  return (
    generatedReportVersions.value[report.id]?.markdown ||
    buildReportMarkdown(report)
  );
}

export function saveGeneratedReportVersion(version: GeneratedReportVersion) {
  generatedReportVersions.value = {
    ...generatedReportVersions.value,
    [version.reportId]: version,
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(
      generatedStorageKey,
      JSON.stringify(generatedReportVersions.value),
    );
  }
}

export function saveHtmlPromptTemplate(name: string, prompt: string) {
  const template: HtmlPromptTemplate = {
    id: `custom-${Date.now()}`,
    name:
      name.trim() || `我的模板 ${savedHtmlPromptTemplates.value.length + 1}`,
    description: '个人保存的 HTML 生成提示词，可在后续周报中复用。',
    accent: '#7c5caa',
    prompt: prompt.trim(),
    system: false,
  };
  savedHtmlPromptTemplates.value = [
    ...savedHtmlPromptTemplates.value,
    template,
  ];
  if (typeof window !== 'undefined') {
    localStorage.setItem(
      promptStorageKey,
      JSON.stringify(savedHtmlPromptTemplates.value),
    );
  }
  return template;
}

export function parseReportMarkdown(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  const title =
    lines
      .find((line) => line.startsWith('# '))
      ?.slice(2)
      .trim() || '工作汇报';
  const sections: Record<string, string[]> = {};
  let current = '';
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith('## ')) {
      current = line.slice(3).trim();
      sections[current] ||= [];
      continue;
    }
    if (!current || !line) continue;
    const content = line
      .replace(/^[-*]\s+\[[ x]\]\s+/i, '')
      .replace(/^[-*]\s+/, '')
      .replace(/^\d+[.)]\s+/, '')
      .trim();
    if (content && !content.startsWith('>')) sections[current]?.push(content);
  }
  return {
    title,
    highlights: sections['本周成果'] ||
      sections['工作成果'] || [
        ...(sections['本周概览'] || []),
        ...(sections['一、研发工作'] || []),
      ],
    blockers: sections['问题与阻塞'] || sections['风险与问题'] || [],
    nextWeek: sections['下周计划'] || sections['五、下周建议'] || [],
  };
}

/** 个人设置中可选的联系人（姓名取自本文件 mentions 与评论数据） */
export const mateContactOptions = [
  { label: '韩立（产品研发部）', value: 'wang-ankang' },
  { label: '张三（产品研发部）', value: 'zhang-san' },
  { label: '赵琳（销售部）', value: 'zhao-lin' },
  { label: '周小曼（交付部）', value: 'zhou-xiaoman' },
  { label: '孙悦（测试部）', value: 'sun-yue' },
  { label: '林悦（设计部）', value: 'lin-yue' },
  { label: '李建国（产品研发部）', value: 'li-jianguo' },
  { label: '王天豪（研发部）', value: 'wang-tianhao' },
];

// ===== 报告实体词典 / 语音纠错 / 提纲 =====

export type ReportEntityType = '产品' | '同事' | '客户' | '项目';

export interface ReportEntity {
  id: string;
  name: string;
  type: ReportEntityType;
  description: string;
  meta?: string;
  /** 别名/昵称（语音或口语中可能出现的简称） */
  aliases?: string[];
}

export const reportEntityTypeMeta: Record<
  ReportEntityType,
  { bg: string; color: string; icon: string; label: string }
> = {
  项目: {
    icon: 'lucide:folder-kanban',
    label: '项目',
    color: '#0D6853',
    bg: '#E8FFEA',
  },
  产品: {
    icon: 'lucide:layers',
    label: '产品',
    color: '#16A34A',
    bg: '#F0FDF4',
  },
  客户: {
    icon: 'lucide:building-2',
    label: '客户',
    color: '#2563EB',
    bg: '#EFF6FF',
  },
  同事: {
    icon: 'lucide:user-round',
    label: '同事',
    color: '#EA580C',
    bg: '#FFF7ED',
  },
};

/** 实体词典：汇总项目、产品、同事、客户（响应式，支持手动增删改） */
export const reportEntityDictionary = ref<ReportEntity[]>([
  ...mockProjects.map((p) => ({
    id: `proj-${p.id}`,
    name: p.name,
    type: '项目' as ReportEntityType,
    description: `${p.stage}，负责人 ${p.manager}`,
    meta: p.manager,
    aliases: [p.name.replace(/项目$/, '')],
  })),
  ...mockProducts.map((p) => ({
    id: `prod-${p.id}`,
    name: p.name,
    type: '产品' as ReportEntityType,
    description: `${p.stage}，产品经理 ${p.productManager}`,
    meta: p.productManager,
    aliases: [p.name.replace(/平台$/, '')],
  })),
  // 同事：姓名 + 多个昵称/别称（同一人在不同人口中称呼不同）
  ...mateContactOptions.map((c) => {
    const name = c.label.split('（')[0] ?? '';
    const dept = c.label.match(/（(.+?)）/)?.[1] || '';
    const aliasMap: Record<string, string[]> = {
      韩立: ['小韩', '韩工', '老韩'],
      张三: ['小张', '张工'],
      赵琳: ['琳姐', '小赵'],
      周小曼: ['小曼', '周工'],
      孙悦: ['小孙', '悦姐'],
      林悦: ['悦悦', '小林'],
      李建国: ['建国', '李工', '老李'],
      王天豪: ['天豪', '小王'],
    };
    return {
      id: `person-${c.value}`,
      name,
      type: '同事' as ReportEntityType,
      description: dept,
      meta: dept,
      aliases: aliasMap[name] || (name.length > 2 ? [name.slice(-2)] : []),
    };
  }),
  // 客户：从工作记录实体中汇总去重
  ...workRecords.value
    .flatMap((r) => r.entities)
    .filter(
      (e, i, arr) =>
        e.type === '客户' && arr.findIndex((x) => x.name === e.name) === i,
    )
    .map((e) => ({
      id: `cust-${e.name}`,
      name: e.name,
      type: '客户' as ReportEntityType,
      description: '客户实体',
    })),
]);

/** 语音识别错字 → 正确实体名 */
export interface EntityCorrection {
  wrong: string;
  correct: string;
  reason: string;
}

export const reportEntityCorrections = ref<EntityCorrection[]>([
  {
    wrong: '华大',
    correct: '华达',
    reason: '语音识别同音字，应为「华达」（客户 / 华达智能打印项目）',
  },
  {
    wrong: '周晓曼',
    correct: '周小曼',
    reason: '语音识别同音字，应为「周小曼」（同事）',
  },
  {
    wrong: '林岳',
    correct: '林悦',
    reason: '语音识别同音字，应为「林悦」（同事）',
  },
  {
    wrong: '智能提体',
    correct: '智能体平台',
    reason: '语音识别错误，应为「智能体平台」（产品）',
  },
  {
    wrong: '报价品台',
    correct: '报价平台',
    reason: '语音识别错误，应为「报价平台」（产品）',
  },
  {
    wrong: '韩力',
    correct: '韩立',
    reason: '语音识别同音字，应为「韩立」（同事）',
  },
  {
    wrong: '李建果',
    correct: '李建国',
    reason: '语音识别同音字，应为「李建国」（同事）',
  },
  { wrong: '象目', correct: '项目', reason: '语音识别同音字，应为「项目」' },
  {
    wrong: '记以模块',
    correct: '记忆模块',
    reason: '语音识别同音字，应为「记忆模块」（产品）',
  },
  {
    wrong: '喔客',
    correct: '喔壳',
    reason: '语音识别错字，应为「喔壳」（产品）',
  },
  { wrong: '催瓣', correct: '催办', reason: '语音识别同音字，应为「催办」' },
]);

/** 增删改实体（手动兜底） */
export function addReportEntity(entity: Omit<ReportEntity, 'id'>): boolean {
  const exists = reportEntityDictionary.value.some(
    (e) => e.name === entity.name && e.type === entity.type,
  );
  if (exists) return false;
  reportEntityDictionary.value = [
    ...reportEntityDictionary.value,
    { ...entity, id: `custom-${Date.now()}` },
  ];
  return true;
}

export function updateReportEntity(id: string, patch: Partial<ReportEntity>) {
  reportEntityDictionary.value = reportEntityDictionary.value.map((e) =>
    e.id === id ? { ...e, ...patch } : e,
  );
}

export function removeReportEntity(id: string) {
  reportEntityDictionary.value = reportEntityDictionary.value.filter(
    (e) => e.id !== id,
  );
}

/** 增删纠错规则 */
export function addEntityCorrection(correction: EntityCorrection): boolean {
  if (reportEntityCorrections.value.some((c) => c.wrong === correction.wrong)) {
    return false;
  }
  reportEntityCorrections.value = [
    ...reportEntityCorrections.value,
    correction,
  ];
  return true;
}

export function removeEntityCorrection(wrong: string) {
  reportEntityCorrections.value = reportEntityCorrections.value.filter(
    (c) => c.wrong !== wrong,
  );
}

/** 生成精简提纲 Markdown（区别于完整 buildReportMarkdown） */
export function buildReportOutline(report: WeeklyReportItem) {
  return `# ${report.title}\n\n> ${report.month} ${report.weekLabel} · ${report.range}\n\n## 本周成果\n${report.highlights.map((item) => `- ${item}`).join('\n')}\n\n## 问题与阻塞\n${report.blockers.map((item) => `- ${item}`).join('\n') || '- 暂无'}\n\n## 下周计划\n${report.nextWeek.map((item) => `- [ ] ${item}`).join('\n') || '- 暂无'}`;
}

export interface DetectedEntity extends ReportEntity {
  count: number;
}

/** 扫描文本命中的实体（含别名），去重并统计出现次数 */
export function detectEntitiesInText(
  text: string,
  dict: ReportEntity[] = reportEntityDictionary.value,
): DetectedEntity[] {
  const result: DetectedEntity[] = [];
  for (const entity of dict) {
    const names = [entity.name, ...(entity.aliases || [])].filter(Boolean);
    let count = 0;
    for (const n of names) {
      const re = new RegExp(
        n.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`),
        'g',
      );
      const matches = text.match(re);
      if (matches) count += matches.length;
    }
    if (count > 0) result.push({ ...entity, count });
  }
  return result.sort((a, b) => b.count - a.count);
}

/** 扫描文本命中的语音纠错项 */
export function detectCorrectionsInText(
  text: string,
  corrections: EntityCorrection[] = reportEntityCorrections.value,
): EntityCorrection[] {
  return corrections.filter((c) => text.includes(c.wrong));
}

/** 对文本中所有错字一键替换 */
export function applyAllCorrections(
  text: string,
  corrections: EntityCorrection[] = reportEntityCorrections.value,
): string {
  return corrections.reduce(
    (acc, c) => acc.replaceAll(c.wrong, c.correct),
    text,
  );
}

/** 在已渲染的 HTML 中高亮实体与错字（DOM 文本节点遍历，不破坏标签） */
export function highlightEntitiesInHtml(
  html: string,
  dict: ReportEntity[] = reportEntityDictionary.value,
  corrections: EntityCorrection[] = reportEntityCorrections.value,
): string {
  if (typeof window === 'undefined' || !html) return html;
  const container = document.createElement('div');
  container.innerHTML = html;

  // 命中表：token → { type, id?, correct? }
  const tokens: Array<{
    correct?: string;
    id?: string;
    key: string;
    type: string;
  }> = [];
  for (const e of dict) {
    tokens.push({ key: e.name, type: e.type, id: e.id });
    for (const a of e.aliases || [])
      tokens.push({ key: a, type: e.type, id: e.id });
  }
  for (const c of corrections) {
    tokens.push({ key: c.wrong, type: 'misspell', correct: c.correct });
  }
  // 长者优先，避免短 token 误拆
  tokens.sort((a, b) => b.key.length - a.key.length);

  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null,
  );
  const targets: Text[] = [];
  let node = walker.nextNode();
  while (node) {
    targets.push(node as Text);
    node = walker.nextNode();
  }
  for (const textNode of targets) {
    const original = textNode.nodeValue || '';
    if (!original) continue;
    const hits: Array<{
      end: number;
      start: number;
      token: (typeof tokens)[number];
    }> = [];
    for (const t of tokens) {
      let from = 0;
      let idx = original.indexOf(t.key, from);
      while (idx !== -1) {
        hits.push({ start: idx, end: idx + t.key.length, token: t });
        from = idx + t.key.length;
        idx = original.indexOf(t.key, from);
      }
    }
    if (hits.length === 0) continue;
    // 去重重叠：贪心按 start 排序，跳过已占用区间
    hits.sort((a, b) => a.start - b.start || b.end - a.end);
    const frag = document.createDocumentFragment();
    let cursor = 0;
    for (const hit of hits) {
      if (hit.start < cursor) continue; // 重叠跳过
      if (hit.start > cursor) {
        frag.append(document.createTextNode(original.slice(cursor, hit.start)));
      }
      const mark = document.createElement('mark');
      if (hit.token.type === 'misspell') {
        mark.className = 'rd-entity-misspell';
        mark.dataset.wrong = hit.token.key;
        mark.dataset.correct = hit.token.correct || '';
        mark.title = `疑似语音识别错误：${hit.token.key} → ${hit.token.correct}`;
      } else {
        mark.className = `rd-entity is-${hit.token.type}`;
        if (hit.token.id) mark.dataset.id = hit.token.id;
        mark.dataset.type = hit.token.type;
        mark.title = `${hit.token.key}（${hit.token.type}）`;
      }
      mark.textContent = original.slice(hit.start, hit.end);
      frag.append(mark);
      cursor = hit.end;
    }
    if (cursor < original.length) {
      frag.append(document.createTextNode(original.slice(cursor)));
    }
    textNode.parentNode?.replaceChild(frag, textNode);
  }
  return container.innerHTML;
}

// ===== 实体识别流水 / 使用统计（审阅助理·实体管理） =====

/** 识别动作：自动命中 / 别名命中 / 纠错后命中 / 人工绑定 */
export type EntityLogAction = 'alias' | 'auto' | 'corrected' | 'manual';

export const entityLogActionMeta: Record<
  EntityLogAction,
  { color: string; label: string }
> = {
  alias: { color: 'blue', label: '别名命中' },
  auto: { color: 'green', label: '自动识别' },
  corrected: { color: 'orange', label: '纠错命中' },
  manual: { color: 'purple', label: '人工绑定' },
};

export interface EntityRecognitionLog {
  id: string;
  /** 归一化后的实体 id；空字符串表示实体已被删除、提及未归一化 */
  entityId: string;
  reportId: string;
  /** 报告原文中的原始提及 */
  mention: string;
  action: EntityLogAction;
  /** 置信度 0-1 */
  confidence: number;
  /** 识别时间（ISO 日期；取报告撰写日，不晚于 DEMO_TODAY） */
  createdAt: string;
}

/**
 * 识别流水 mock：时间锚定到各归档报告的撰写日。
 * 月报/未来周报的撰写日均按 DEMO_TODAY 处理，保证周期筛选可见。
 */
export const entityRecognitionLogs = ref<EntityRecognitionLog[]>([
  // 2026-m08-ningde 宁德 D4 项目月报（草稿，撰写中）
  {
    action: 'auto',
    confidence: 0.97,
    createdAt: '2026-08-14',
    entityId: 'proj-ningde-d4',
    id: 'log-001',
    mention: '宁德 D4 检测相机升级交付项目',
    reportId: '2026-m08-ningde',
  },
  {
    action: 'alias',
    confidence: 0.95,
    createdAt: '2026-08-14',
    entityId: 'person-wang-ankang',
    id: 'log-002',
    mention: '王工',
    reportId: '2026-m08-ningde',
  },
  {
    action: 'corrected',
    confidence: 0.88,
    createdAt: '2026-08-14',
    entityId: 'prod-woke',
    id: 'log-003',
    mention: '智能提体',
    reportId: '2026-m08-ningde',
  },
  {
    action: 'auto',
    confidence: 0.96,
    createdAt: '2026-08-14',
    entityId: 'cust-华达',
    id: 'log-004',
    mention: '华达',
    reportId: '2026-m08-ningde',
  },
  // 2026-m08-dept 产品研发部月报
  {
    action: 'auto',
    confidence: 0.97,
    createdAt: '2026-08-14',
    entityId: 'prod-woke',
    id: 'log-005',
    mention: '喔壳智能体平台',
    reportId: '2026-m08-dept',
  },
  {
    action: 'alias',
    confidence: 0.94,
    createdAt: '2026-08-14',
    entityId: 'prod-quote',
    id: 'log-006',
    mention: '报价平台',
    reportId: '2026-m08-dept',
  },
  {
    action: 'auto',
    confidence: 0.95,
    createdAt: '2026-08-14',
    entityId: 'person-lijianguo',
    id: 'log-007',
    mention: '李建国',
    reportId: '2026-m08-dept',
  },
  {
    action: 'alias',
    confidence: 0.92,
    createdAt: '2026-08-14',
    entityId: 'person-linyue',
    id: 'log-008',
    mention: '琳姐',
    reportId: '2026-m08-dept',
  },
  // 2026-w34 喔壳智能体平台研发周报（下期草稿）
  {
    action: 'auto',
    confidence: 0.98,
    createdAt: '2026-08-14',
    entityId: 'prod-woke',
    id: 'log-009',
    mention: '喔壳智能体平台',
    reportId: '2026-w34',
  },
  {
    action: 'auto',
    confidence: 0.95,
    createdAt: '2026-08-14',
    entityId: 'prod-memory',
    id: 'log-010',
    mention: '记忆模块',
    reportId: '2026-w34',
  },
  {
    action: 'alias',
    confidence: 0.91,
    createdAt: '2026-08-14',
    entityId: 'person-zhangsan',
    id: 'log-011',
    mention: '张工',
    reportId: '2026-w34',
  },
  {
    action: 'corrected',
    confidence: 0.86,
    createdAt: '2026-08-14',
    entityId: 'proj-huada',
    id: 'log-012',
    mention: '华大智能打印项目',
    reportId: '2026-w34',
  },
  // 2026-w33 个人工作汇报 8/10-8/16
  {
    action: 'auto',
    confidence: 0.97,
    createdAt: '2026-08-14',
    entityId: 'prod-woke',
    id: 'log-013',
    mention: '喔壳智能体平台',
    reportId: '2026-w33',
  },
  {
    action: 'auto',
    confidence: 0.95,
    createdAt: '2026-08-14',
    entityId: 'proj-huada',
    id: 'log-014',
    mention: '华达智能打印项目',
    reportId: '2026-w33',
  },
  {
    action: 'auto',
    confidence: 0.94,
    createdAt: '2026-08-14',
    entityId: 'person-zhaolin',
    id: 'log-015',
    mention: '赵琳',
    reportId: '2026-w33',
  },
  {
    action: 'alias',
    confidence: 0.92,
    createdAt: '2026-08-14',
    entityId: 'person-zhouxiaoman',
    id: 'log-016',
    mention: '小曼',
    reportId: '2026-w33',
  },
  // 2026-w32 个人工作汇报 8/3-8/9
  {
    action: 'corrected',
    confidence: 0.89,
    createdAt: '2026-08-09',
    entityId: 'prod-woke',
    id: 'log-017',
    mention: '智能提体',
    reportId: '2026-w32',
  },
  {
    action: 'auto',
    confidence: 0.94,
    createdAt: '2026-08-09',
    entityId: 'prod-quote',
    id: 'log-018',
    mention: '报价平台 V2',
    reportId: '2026-w32',
  },
  {
    action: 'auto',
    confidence: 0.93,
    createdAt: '2026-08-09',
    entityId: 'person-wangtianhao',
    id: 'log-019',
    mention: '王天豪',
    reportId: '2026-w32',
  },
  {
    action: 'auto',
    confidence: 0.95,
    createdAt: '2026-08-09',
    entityId: 'cust-华达',
    id: 'log-020',
    mention: '华达',
    reportId: '2026-w32',
  },
  // 2026-w31 个人工作汇报 7/27-8/2
  {
    action: 'auto',
    confidence: 0.94,
    createdAt: '2026-08-02',
    entityId: 'proj-customer-portal',
    id: 'log-021',
    mention: '客户门户项目',
    reportId: '2026-w31',
  },
  {
    action: 'alias',
    confidence: 0.9,
    createdAt: '2026-08-02',
    entityId: 'person-zhangsan',
    id: 'log-022',
    mention: '小张',
    reportId: '2026-w31',
  },
  {
    action: 'auto',
    confidence: 0.93,
    createdAt: '2026-08-02',
    entityId: 'prod-memory',
    id: 'log-023',
    mention: '记忆模块',
    reportId: '2026-w31',
  },
  {
    action: 'auto',
    confidence: 0.92,
    createdAt: '2026-08-02',
    entityId: 'person-sunyue',
    id: 'log-024',
    mention: '孙悦',
    reportId: '2026-w31',
  },
  // 2026-m07-ningde 宁德 D4 项目月报（7月，落在近一月之外、近半年之内）
  {
    action: 'auto',
    confidence: 0.96,
    createdAt: '2026-07-31',
    entityId: 'proj-ningde-d4',
    id: 'log-025',
    mention: '宁德 D4 检测相机升级交付项目',
    reportId: '2026-m07-ningde',
  },
  {
    action: 'auto',
    confidence: 0.95,
    createdAt: '2026-07-31',
    entityId: 'cust-华达',
    id: 'log-026',
    mention: '华达',
    reportId: '2026-m07-ningde',
  },
  {
    action: 'alias',
    confidence: 0.93,
    createdAt: '2026-07-31',
    entityId: 'person-wang-ankang',
    id: 'log-027',
    mention: '小韩',
    reportId: '2026-m07-ningde',
  },
]);

/** 周期筛选预设（以 DEMO_TODAY 为锚点） */
export const entityPeriodPresets: Array<{
  days?: number;
  key: 'all' | 'half-year' | 'one-month' | 'two-weeks';
  label: string;
}> = [
  { days: 13, key: 'two-weeks', label: '近两周' },
  { days: 29, key: 'one-month', label: '近一月' },
  { days: 179, key: 'half-year', label: '近半年' },
  { key: 'all', label: '全部' },
];

/** 预设对应的日期区间 [start, end]；「全部」返回 [undefined, undefined] */
export function entityPeriodRange(
  preset: (typeof entityPeriodPresets)[number]['key'],
): [string | undefined, string | undefined] {
  const item = entityPeriodPresets.find((p) => p.key === preset);
  if (!item?.days) return [undefined, undefined];
  return [toISODate(addDays(parseISODate(DEMO_TODAY), -item.days)), DEMO_TODAY];
}

/** 按日期区间过滤识别流水（ISO 日期字符串闭区间比较；缺省不限） */
export function filterEntityLogsByRange(
  logs: EntityRecognitionLog[],
  start?: string,
  end?: string,
): EntityRecognitionLog[] {
  return logs.filter(
    (log) =>
      (!start || log.createdAt >= start) && (!end || log.createdAt <= end),
  );
}

export interface EntityUsageStat {
  count: number;
  entity: ReportEntity;
  lastUsedAt: string;
}

/** 实体使用统计：仅统计仍存在于词典的实体，按使用次数倒序 */
export function computeEntityUsageStats(
  logs: EntityRecognitionLog[],
  dict: ReportEntity[] = reportEntityDictionary.value,
): EntityUsageStat[] {
  const byEntity = new Map<string, { count: number; lastUsedAt: string }>();
  for (const log of logs) {
    if (!log.entityId) continue;
    const stat = byEntity.get(log.entityId) ?? { count: 0, lastUsedAt: '' };
    stat.count += 1;
    if (log.createdAt > stat.lastUsedAt) stat.lastUsedAt = log.createdAt;
    byEntity.set(log.entityId, stat);
  }
  return dict
    .filter((entity) => byEntity.has(entity.id))
    .map((entity) => ({
      count: byEntity.get(entity.id)?.count ?? 0,
      entity,
      lastUsedAt: byEntity.get(entity.id)?.lastUsedAt ?? '',
    }))
    .toSorted(
      (a, b) => b.count - a.count || (a.lastUsedAt < b.lastUsedAt ? 1 : -1),
    );
}

/** 某实体命中的识别流水（按时间倒序） */
export function entityLogsFor(
  entityId: string,
  logs: EntityRecognitionLog[] = entityRecognitionLogs.value,
): EntityRecognitionLog[] {
  return logs
    .filter((log) => log.entityId === entityId)
    .toSorted((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** 用到某实体的报告（去重，按报告截止日倒序） */
export function reportsUsingEntity(
  entityId: string,
  logs: EntityRecognitionLog[] = entityRecognitionLogs.value,
  reports: WeeklyReportItem[] = reportArchive,
): WeeklyReportItem[] {
  const reportIds = new Set(
    logs.filter((log) => log.entityId === entityId).map((log) => log.reportId),
  );
  return reports
    .filter((report) => reportIds.has(report.id))
    .toSorted((a, b) => (a.endDate < b.endDate ? 1 : -1));
}

/** 合并实体：source 并入 target——别名并入、历史流水改指向、source 从词典删除 */
export function mergeReportEntities(
  sourceId: string,
  targetId: string,
): boolean {
  if (sourceId === targetId) return false;
  const source = reportEntityDictionary.value.find((e) => e.id === sourceId);
  const target = reportEntityDictionary.value.find((e) => e.id === targetId);
  if (!source || !target) return false;
  const mergedAliases = [
    ...(target.aliases || []),
    source.name,
    ...(source.aliases || []),
  ].filter(
    (alias, index, arr) =>
      alias && alias !== target.name && arr.indexOf(alias) === index,
  );
  reportEntityDictionary.value = reportEntityDictionary.value.map((e) =>
    e.id === targetId ? { ...e, aliases: mergedAliases } : e,
  );
  entityRecognitionLogs.value = entityRecognitionLogs.value.map((log) =>
    log.entityId === sourceId ? { ...log, entityId: targetId } : log,
  );
  removeReportEntity(sourceId);
  return true;
}

/** 删除实体后，其历史流水标记为「未归一化」（entityId 置空） */
export function markEntityLogsUnmapped(entityId: string) {
  entityRecognitionLogs.value = entityRecognitionLogs.value.map((log) =>
    log.entityId === entityId ? { ...log, entityId: '' } : log,
  );
}

/** 新增别名；与名称/已有别名重复时返回 false */
export function addEntityAlias(entityId: string, alias: string): boolean {
  const entity = reportEntityDictionary.value.find((e) => e.id === entityId);
  const value = alias.trim();
  if (!entity || !value) return false;
  const exists = [entity.name, ...(entity.aliases || [])].includes(value);
  if (exists) return false;
  updateReportEntity(entityId, { aliases: [...(entity.aliases || []), value] });
  return true;
}

/** 移除别名 */
export function removeEntityAlias(entityId: string, alias: string) {
  const entity = reportEntityDictionary.value.find((e) => e.id === entityId);
  if (!entity) return;
  updateReportEntity(entityId, {
    aliases: (entity.aliases || []).filter((a) => a !== alias),
  });
}

/** 为缺失流水的报告按正文自动补算识别记录（幂等） */
export function ensureReportEntityLogs(
  report: WeeklyReportItem,
  logs: EntityRecognitionLog[] = entityRecognitionLogs.value,
) {
  if (logs.some((log) => log.reportId === report.id)) return;
  const text = [
    ...report.highlights,
    ...report.blockers,
    ...report.nextWeek,
  ].join('\n');
  // eslint-disable-next-line unicorn/prefer-math-min-max -- ISO 日期字符串按字典序比较，不能用 Math.min
  const createdAt = report.endDate > DEMO_TODAY ? DEMO_TODAY : report.endDate;
  for (const detected of detectEntitiesInText(text)) {
    // 命中的原始提及：优先取最长匹配的名称/别名
    const names = [detected.name, ...(detected.aliases || [])].filter(Boolean);
    const mention =
      names
        .toSorted((a, b) => b.length - a.length)
        .find((n) => text.includes(n)) ?? detected.name;
    logs.push({
      action: mention === detected.name ? 'auto' : 'alias',
      confidence: 0.9,
      createdAt,
      entityId: detected.id,
      id: `log-${report.id}-${detected.id}`,
      mention,
      reportId: report.id,
    });
  }
}

/** 报告汇报人（mock：部门月报→李建国，宁德项目月报→韩立，其余视为当前用户王天豪） */
export function reportAuthorOf(reportId: string): string {
  if (reportId.includes('dept')) return '李建国';
  if (reportId.includes('ningde')) return '韩立';
  return '王天豪';
}

// ===== 订阅与审批 mock 数据 =====

const mateAsset = (name: string) =>
  `${import.meta.env.BASE_URL}images/ai-employee/${name}`;

/** 报告相关人关系类型 */
export type ContactRelation = 'approver' | 'recipient' | 'subscriber';
/** 报告相关人适用报告范围 */
export type ContactScope = 'all' | 'daily' | 'weekly';

export const contactRelationLabels: Record<ContactRelation, string> = {
  approver: '审批人',
  subscriber: '订阅人',
  recipient: '接收人',
};

export const contactRelationColors: Record<ContactRelation, string> = {
  approver: 'purple',
  subscriber: 'cyan',
  recipient: 'blue',
};

export const contactScopeLabels: Record<ContactScope, string> = {
  all: '全部报告',
  weekly: '周报',
  daily: '日报',
};

export interface ReportContact {
  id: string;
  personId: string;
  name: string;
  dept: string;
  relation: ContactRelation;
  scope: ContactScope;
  status: 'active' | 'pending';
  grantedAt: string;
}

/** 报告相关人（统一管理审批人 / 接收人 / 订阅人） */
export const mockReportContacts = ref<ReportContact[]>([
  {
    id: 'rc-1',
    personId: 'li-jianguo',
    name: '李建国',
    dept: '产品研发部',
    relation: 'approver',
    scope: 'weekly',
    status: 'active',
    grantedAt: '2026-07-12',
  },
  {
    id: 'rc-2',
    personId: 'wang-tianhao',
    name: '王天豪',
    dept: '研发部',
    relation: 'approver',
    scope: 'weekly',
    status: 'active',
    grantedAt: '2026-07-12',
  },
  {
    id: 'rc-3',
    personId: 'zhou-xiaoman',
    name: '周小曼',
    dept: '交付部',
    relation: 'subscriber',
    scope: 'weekly',
    status: 'active',
    grantedAt: '2026-08-01',
  },
  {
    id: 'rc-4',
    personId: 'zhao-lin',
    name: '赵琳',
    dept: '销售部',
    relation: 'subscriber',
    scope: 'weekly',
    status: 'pending',
    grantedAt: '今天',
  },
  {
    id: 'rc-5',
    personId: 'sun-yue',
    name: '孙悦',
    dept: '测试部',
    relation: 'recipient',
    scope: 'daily',
    status: 'active',
    grantedAt: '2026-08-05',
  },
]);

/** 通知方式配置 */
export const mockNotifyChannels = ref({
  email: { enabled: true, address: 'han.li@example.com' },
  wecom: { enabled: true, account: '韩立' },
  inApp: { enabled: true },
});

/** 主动申请查看他人报告的记录 */
export const mockAccessRequests = ref<AccessRequestItem[]>([
  {
    id: 'ar-1',
    target: '赵琳',
    targetDept: '销售部',
    reportType: 'personal',
    reason: '需要了解华达客户批量导入承诺的进展，便于安排研发排期。',
    createdAt: '今天 09:30',
    status: 'pending',
  },
  {
    id: 'ar-2',
    target: '周小曼',
    targetDept: '交付部',
    reportType: 'project',
    reason: '跟进华达智能打印项目交付进度与风险。',
    createdAt: '昨天 16:20',
    status: 'approved',
  },
  {
    id: 'ar-3',
    target: '李想',
    targetDept: '产品部',
    reportType: 'product',
    reason: '了解记忆模块产品排期。',
    createdAt: '8 月 9 日',
    status: 'rejected',
  },
]);

/** 催办与提醒任务 */
export const mockReminders = ref<ReminderItem[]>([
  {
    id: 'rm-1',
    target: '陈浩',
    reportType: 'personal',
    weekLabel: '第 3 周（W34）',
    kind: 'not-submitted',
    dueAt: '今天 18:00',
    sentAt: '今天 09:00',
  },
  {
    id: 'rm-2',
    target: '赵琳',
    reportType: 'personal',
    weekLabel: '第 3 周（W34）',
    kind: 'not-submitted',
    dueAt: '今天 18:00',
    sentAt: '今天 10:06',
  },
  {
    id: 'rm-3',
    target: '李想',
    reportType: 'product',
    weekLabel: '第 3 周（W34）',
    kind: 'not-approved',
    dueAt: '明天 12:00',
    sentAt: '今天 11:20',
  },
]);

/** 待我审批的报告（审阅助理 · 我的审批） */
export const mockPendingApprovals = ref<PendingApprovalItem[]>([
  {
    id: 'pa-wang',
    author: '韩立',
    avatar: mateAsset('咨询人员.jpg'),
    dept: '产品研发部',
    title: '喔壳智能体平台研发周报',
    summary: '完成指令功能、AI 服务和嵌入端能力建设，附件技能待验证。',
    reportType: 'personal',
    weekLabel: '第 3 周（W34）',
    date: '2026-08-20',
    weekKey: 'w34',
    submittedAt: '今天 18:30',
    status: 'pending',
    score: 0,
    entities: ['喔壳智能体平台', '华达项目'],
  },
  {
    id: 'pa-zhao',
    author: '赵琳',
    avatar: mateAsset('商务分析助手.jpg'),
    dept: '销售部',
    title: '重点客户推进与续费周报',
    summary: '推进华达与客户 B 商务沟通，批量导入承诺需要研发确认。',
    reportType: 'personal',
    weekLabel: '第 3 周（W34）',
    date: '2026-08-20',
    weekKey: 'w34',
    submittedAt: '今天 17:42',
    status: 'pending',
    score: 0,
    entities: ['华达客户', '客户 B'],
  },
  {
    id: 'pa-li',
    author: '李想',
    avatar: mateAsset('产品经理.jpg'),
    dept: '产品部',
    title: '记忆模块产品周报',
    summary: '完成记忆模块需求整理，下阶段排期已对齐。',
    reportType: 'product',
    weekLabel: '第 3 周（W34）',
    date: '2026-08-20',
    weekKey: 'w34',
    submittedAt: '今天 16:08',
    status: 'pending',
    score: 0,
    entities: ['记忆模块', '喔壳智能体平台'],
  },
  {
    id: 'pa-chen',
    author: '陈浩',
    avatar: mateAsset('技术员.jpg'),
    dept: '研发二部',
    title: '数据服务迭代周报',
    summary: '本周周报尚未提交，系统已发送一次提醒，仍待提交。',
    reportType: 'personal',
    weekLabel: '第 3 周（W34）',
    date: '2026-08-20',
    weekKey: 'w34',
    submittedAt: '尚未提交',
    status: 'missing',
    score: 0,
    entities: [],
  },
  {
    id: 'pa-zhou',
    author: '周小曼',
    avatar: mateAsset('项目经理.jpg'),
    dept: '交付部',
    title: '华达智能打印项目周报',
    summary: '华达打印问题已恢复，客户 B 测试环境仍未开放。',
    reportType: 'project',
    weekLabel: '第 2 周（W33）',
    date: '2026-08-13',
    weekKey: 'w33',
    submittedAt: '8 月 14 日 19:20',
    status: 'approved',
    score: 4.8,
    entities: ['华达项目', '智能打印'],
  },
  {
    id: 'pa-lin',
    author: '林悦',
    avatar: mateAsset('设计师.jpg'),
    dept: '设计部',
    title: '产品设计与体验优化周报',
    summary: '本周周报尚未提交，距截止时间不足 2 小时。',
    reportType: 'personal',
    weekLabel: '第 2 周（W33）',
    date: '2026-08-13',
    weekKey: 'w33',
    submittedAt: '尚未提交',
    status: 'missing',
    score: 0,
    entities: [],
  },
  {
    id: 'pa-sun-daily',
    author: '孙悦',
    avatar: mateAsset('数据分析师.jpg'),
    dept: '测试部',
    title: '质量保障日报',
    summary: '完成指令模块第一轮回归测试，发现 3 项兼容性问题。',
    reportType: 'personal',
    period: 'daily',
    weekLabel: '8 月 14 日',
    date: '2026-08-14',
    weekKey: 'w34',
    submittedAt: '今天 18:00',
    status: 'pending',
    score: 0,
    entities: ['指令中心', '喔壳智能体平台'],
    content: `## 今日成果
- 完成指令模块第一轮回归测试，覆盖配置、调用、模板管理三条链路。
- 提交 3 项兼容性问题缺陷单（指令入口英文环境回退、模板删除未级联、快捷操作抖动）。

## 问题与阻塞
- 嵌入端身份识别在英文环境下仍回退到中文，需李四协助定位上下文传递问题。

## 明日计划
- 复测身份识别回退问题，输出复现路径与日志。
- 启动 AI Chat 历史会话分页回归。`,
    attachmentIds: ['ev-audio', 'ev-design'],
  },
]);

/** 我订阅的报告（审阅助理 · 我的订阅） */
export const mockSubscribedReports = ref<SubscribedReportItem[]>([
  {
    id: 'sr-zhou',
    author: '周小曼',
    avatar: mateAsset('项目经理.jpg'),
    dept: '交付部',
    title: '客户交付与现场支持周报',
    summary: '华达打印问题已恢复，客户 B 测试环境仍未开放。',
    reportType: 'personal',
    weekLabel: '第 2 周（W33）',
    publishedAt: '8 月 16 日',
    score: 4.6,
    entities: ['华达智能打印项目'],
  },
  {
    id: 'sr-lin',
    author: '林悦',
    avatar: mateAsset('设计师.jpg'),
    dept: '设计部',
    title: '产品设计与体验优化周报',
    summary: '完成汇报工作台与客户端 Demo 视觉迭代。',
    reportType: 'personal',
    weekLabel: '第 2 周（W33）',
    publishedAt: '8 月 15 日',
    score: 4.5,
    entities: ['汇报助理'],
  },
  {
    id: 'sr-gao',
    author: '高飞',
    avatar: mateAsset('报价专员.jpg'),
    dept: '售前部',
    title: '报价平台 V2 产品周报',
    summary: '完成三个重点客户方案和两份报价测算。',
    reportType: 'product',
    weekLabel: '第 2 周（W33）',
    publishedAt: '8 月 15 日',
    score: 4.3,
    entities: ['报价平台 V2', '华达客户'],
  },
  {
    id: 'sr-sun',
    author: '孙悦',
    avatar: mateAsset('数据分析师.jpg'),
    dept: '测试部',
    title: '质量保障与回归测试日报',
    summary: '完成指令模块第一轮回归，发现 3 项兼容性问题。',
    reportType: 'personal',
    weekLabel: '8 月 14 日',
    publishedAt: '8 月 14 日',
    score: 4.2,
    entities: ['指令中心'],
  },
]);

/** 时间维度筛选项 */
export const timeFilterOptions = [
  { label: '本周', value: 'this-week' },
  { label: '上周', value: 'last-week' },
  { label: '更早', value: 'earlier' },
] as const;

export function addAccessRequest(
  target: string,
  reportType: ReportType,
  reason: string,
) {
  const [name, dept] = target.split('（');
  mockAccessRequests.value = [
    {
      id: `ar-${Date.now()}`,
      target: name || target,
      targetDept: dept?.replace('）', '') || '',
      reportType,
      reason,
      createdAt: '刚刚',
      status: 'pending',
    },
    ...mockAccessRequests.value,
  ];
}

/** 他人申请查看我的报告（我作为被申请方，在「待我处理」中同意/驳回） */
export interface IncomingAccessRequest {
  id: string;
  applicant: string;
  applicantDept: string;
  reportType: ReportType;
  reason: string;
  createdAt: string;
  status: 'approved' | 'pending' | 'rejected';
}

export const mockIncomingRequests = ref<IncomingAccessRequest[]>([
  {
    id: 'in-1',
    applicant: '孙悦',
    applicantDept: '测试部',
    reportType: 'personal',
    reason: '需要了解指令模块进展，以便安排下周回归测试。',
    createdAt: '今天 09:10',
    status: 'pending',
  },
  {
    id: 'in-2',
    applicant: '高飞',
    applicantDept: '售前部',
    reportType: 'project',
    reason: '华达客户问起项目进度，需要参考最新项目周报。',
    createdAt: '昨天 16:30',
    status: 'pending',
  },
  {
    id: 'in-3',
    applicant: '林悦',
    applicantDept: '设计部',
    reportType: 'personal',
    reason: '同步汇报工作台视觉迭代情况，便于对齐设计资源。',
    createdAt: '8 月 9 日',
    status: 'approved',
  },
]);

/** 同意他人查看我的报告 → 建立订阅关系（申请人成为我的订阅人） */
export function approveIncomingRequest(id: string) {
  const req = mockIncomingRequests.value.find((r) => r.id === id);
  if (!req || req.status !== 'pending') return;
  req.status = 'approved';
  const personId = `in-${req.id}`;
  if (
    !mockReportContacts.value.some(
      (c) => c.personId === personId && c.relation === 'subscriber',
    )
  ) {
    mockReportContacts.value = [
      ...mockReportContacts.value,
      {
        id: `rc-${personId}`,
        personId,
        name: req.applicant,
        dept: req.applicantDept,
        relation: 'subscriber',
        // 相关人范围沿用「周报」粒度（Demo 中的申请均非日报）
        scope: 'weekly',
        status: 'active',
        grantedAt: '刚刚',
      },
    ];
  }
}

/** 驳回他人查看我的报告的申请 */
export function rejectIncomingRequest(id: string) {
  const req = mockIncomingRequests.value.find((r) => r.id === id);
  if (req && req.status === 'pending') req.status = 'rejected';
}

export function addReportContact(
  personId: string,
  name: string,
  dept: string,
  relation: ContactRelation,
  scope: ContactScope,
) {
  if (
    mockReportContacts.value.some(
      (c) => c.personId === personId && c.relation === relation,
    )
  ) {
    return false;
  }
  mockReportContacts.value = [
    ...mockReportContacts.value,
    {
      id: `rc-${Date.now()}`,
      personId,
      name,
      dept,
      relation,
      scope,
      // 订阅人需对方接受，其余直接生效
      status: relation === 'subscriber' ? 'pending' : 'active',
      grantedAt: '刚刚',
    },
  ];
  return true;
}

export function removeReportContact(id: string) {
  mockReportContacts.value = mockReportContacts.value.filter(
    (c) => c.id !== id,
  );
}

/** 模拟对方接受订阅邀请（演示用） */
export function acceptReportContact(id: string) {
  const item = mockReportContacts.value.find((c) => c.id === id);
  if (item) {
    item.status = 'active';
    item.grantedAt = '刚刚';
  }
}

// ===== 我能审批的人 / 哪些人能看到我 =====

export interface PersonEntry {
  id: string;
  /** 人名 */
  name: string;
  /** 组织名称 */
  org: string;
  /** 岗位名称 */
  position: string;
  reportType: ReportType;
}

/** 我能审批的人（我作为审批人） */
export const mockMyApprovals = ref<PersonEntry[]>([
  {
    id: 'ma-1',
    name: '韩立',
    org: '产品研发部',
    position: '研发工程师',
    reportType: 'personal',
  },
  {
    id: 'ma-2',
    name: '赵琳',
    org: '销售部',
    position: '销售经理',
    reportType: 'personal',
  },
  {
    id: 'ma-3',
    name: '李想',
    org: '产品部',
    position: '产品经理',
    reportType: 'product',
  },
  {
    id: 'ma-4',
    name: '周小曼',
    org: '交付部',
    position: '交付经理',
    reportType: 'project',
  },
  {
    id: 'ma-5',
    name: '孙悦',
    org: '测试部',
    position: '测试工程师',
    reportType: 'personal',
  },
  {
    id: 'ma-6',
    name: '陈浩',
    org: '研发二部',
    position: '后端工程师',
    reportType: 'personal',
  },
]);

/** 哪些人能看到我（被授权查看我的报告） */
export const mockMyViewers = ref<PersonEntry[]>([
  {
    id: 'mv-1',
    name: '李建国',
    org: '产品研发部',
    position: '部门主管',
    reportType: 'personal',
  },
  {
    id: 'mv-2',
    name: '周小曼',
    org: '交付部',
    position: '交付经理',
    reportType: 'project',
  },
  {
    id: 'mv-3',
    name: '林悦',
    org: '设计部',
    position: '设计师',
    reportType: 'personal',
  },
  {
    id: 'mv-4',
    name: '王天豪',
    org: '研发部',
    position: '研发组长',
    reportType: 'personal',
  },
  {
    id: 'mv-5',
    name: '高飞',
    org: '售前部',
    position: '售前顾问',
    reportType: 'personal',
  },
]);

export function addMyApproval(entry: Omit<PersonEntry, 'id'>): boolean {
  if (
    mockMyApprovals.value.some(
      (e) => e.name === entry.name && e.reportType === entry.reportType,
    )
  ) {
    return false;
  }
  mockMyApprovals.value = [
    ...mockMyApprovals.value,
    { ...entry, id: `ma-${Date.now()}` },
  ];
  return true;
}

export function removeMyApproval(id: string) {
  mockMyApprovals.value = mockMyApprovals.value.filter((e) => e.id !== id);
}

export function addMyViewer(entry: Omit<PersonEntry, 'id'>): boolean {
  if (
    mockMyViewers.value.some(
      (e) => e.name === entry.name && e.reportType === entry.reportType,
    )
  ) {
    return false;
  }
  mockMyViewers.value = [
    ...mockMyViewers.value,
    { ...entry, id: `mv-${Date.now()}` },
  ];
  return true;
}

export function removeMyViewer(id: string) {
  mockMyViewers.value = mockMyViewers.value.filter((e) => e.id !== id);
}

export function approvePendingReport(id: string, score: number) {
  const item = mockPendingApprovals.value.find((r) => r.id === id);
  if (item) {
    item.status = 'approved';
    item.score = score;
  }
}
