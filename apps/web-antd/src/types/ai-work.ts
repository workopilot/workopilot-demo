export type AiWorkEmployeeId =
  'weekly-analysis' | 'weekly-assistant' | 'weekly-review';
export type AiWorkReportStatus =
  'APPROVED' | 'ARCHIVED' | 'DRAFT' | 'RETURNED' | 'SUBMITTED';
export type AiWorkRiskLevel = 'high' | 'low' | 'medium';

/** 工作资料类型（原始材料：文档/录音/截图/录像/视频/会议纪要/文字） */
export type AiWorkMaterialType =
  'audio' | 'document' | 'image' | 'meeting' | 'text' | 'video';

/** 工作资料（周报的原材料） */
export interface AiWorkMaterial {
  id: string;
  type: AiWorkMaterialType;
  name: string;
  uploadedAt: string;
  duration?: string;
  size?: string;
  excerpt?: string;
}

/** 实体关联标签（Context Layer：项目/客户/产品/人员） */
export interface AiWorkEntities {
  projects?: string[];
  customers?: string[];
  products?: string[];
  people?: string[];
}

export interface AiWorkTimelineLog {
  id: string;
  weekLabel: string; // 如：'第 31 周 (上周承诺)', '第 32 周 (本周进展)'
  date: string;
  content: string;
  author?: string;
  statusTag?: string;
  materials?: AiWorkMaterial[];
}

export type AiWorkStatus = '已取消' | '已完成' | '暂停' | '未开始' | '进行中';

/** 工作事项（资料结构化后的产物，周报的组成单元） */
export interface AiWorkWorkItem {
  id: string;
  date: string;
  weekday: string;
  title: string;
  summary: string;
  type: string;
  status: AiWorkStatus | string;
  source: string;
  materials: AiWorkMaterial[];
  entities: AiWorkEntities;
  inReport: boolean;
  /** 是否为上周承诺事项（本周需追踪完成情况） */
  isCommitment?: boolean;
  /** 承诺事项的当前完成状态 */
  commitmentStatus?: 'delayed' | 'done' | 'in_progress';
  /** 延期周数 */
  delayWeeks?: number;
  /** 跨周动态与历史补充记录 (上周/本周/下周计划时间轴) */
  historyLogs?: AiWorkTimelineLog[];
}

export interface AiWorkRecord {
  id: string;
  date: string;
  weekday: string;
  title: string;
  source: string;
  type: string;
  project?: string;
  customer?: string;
  status: string;
  summary: string;
  inReport: boolean;
}

export interface AiWorkReportItem {
  id: string;
  title: string;
  content: string;
  customer?: string;
  project?: string;
  evidenceCount: number;
  category: 'achievement' | 'plan' | 'risk' | 'support' | 'work';
  /** 事项当前状态（如：已完成/延期/进行中） */
  status?: string;
  /** 风险等级（风险事项显示黄色条） */
  riskLevel?: AiWorkRiskLevel;
  /** 该事项关联的工作资料 */
  materials?: AiWorkMaterial[];
  /** 该事项关联的实体标签 */
  entities?: AiWorkEntities;
}

export interface AiWorkEvidenceNode {
  id: string;
  title: string;
  source: string;
  time: string;
  excerpt: string;
  icon: string;
  route?: string;
}

export interface AiWorkReviewRow {
  id: string;
  employee: string;
  department: string;
  status: string;
  completeness: number;
  risk: AiWorkRiskLevel;
  openCommitments: number;
  project: string;
}

export interface AiWorkApplication {
  id:
    | 'ai-work'
    | 'enterprise-context'
    | 'invoice-check'
    | 'smart-contract'
    | 'smart-crm'
    | 'smart-ticket'
    | 'zhangkou-filling'
    | 'zhiji';
  name: string;
  description: string;
  icon: string;
  badge?: string;
  badgeTone?: 'blue' | 'green' | 'orange';
  path: string;
}

/** 承诺追踪（上周下周计划 vs 本周完成情况） */
export interface AiWorkCommitment {
  id: string;
  description: string;
  plannedWeek: number;
  currentStatus: 'delayed' | 'done' | 'in_progress';
  delayWeeks?: number;
  explanation?: string;
}

/** 周报的逐项评价（主管对具体事项的打分） */
export interface AiWorkItemScore {
  itemTitle: string;
  score: number;
  comment: string;
}

/** 周报评价（后台评分 Agent 自动产出，由数字员工呈现） */
export interface AiWorkReportReview {
  reviewerId: string;
  reviewerName: string;
  reviewerRole: string;
  reviewerAvatar?: string;
  score: number;
  comment: string;
  itemScores: AiWorkItemScore[];
  /** 后台洞察 Agent 挖掘出的问题模式（如"连续跟进无进展"） */
  insights?: AiWorkReviewInsight[];
  reviewedAt: string;
}

/** 后台洞察 Agent 自动挖掘的问题模式 */
export interface AiWorkReviewInsight {
  id: string;
  level: AiWorkRiskLevel;
  title: string;
  detail: string;
  suggestion: string;
}

/** 论坛式评论（多轮，与周报关联） */
export interface AiWorkComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: 'employee' | 'manager';
  authorAvatar?: string;
  content: string;
  createdAt: string;
  /** 被回复的评论 id（用于多轮对话） */
  replyTo?: string;
}

/** 完整周报（聚合产物：事项 + 资料 + 下周计划 + 实体 + 评价 + 评论） */
export interface AiWorkReport {
  id: string;
  weekNumber: number;
  weekLabel: string;
  dateRange: string;
  ownerName: string;
  ownerDepartment: string;
  status: AiWorkReportStatus;
  completeness: number;
  /** 本周事项（按类分组） */
  items: AiWorkReportItem[];
  /** 下周计划（= 下周的承诺，会被追踪） */
  plan: AiWorkReportItem[];
  /** 全部关联资料 */
  materials: AiWorkMaterial[];
  /** 全局实体关联 */
  entities: AiWorkEntities;
  /** 承诺追踪（上周计划 vs 本周完成） */
  commitments: AiWorkCommitment[];
  /** 主管评价（后台 Agent 自动产出） */
  review?: AiWorkReportReview;
  /** 论坛式评论（多轮） */
  comments: AiWorkComment[];
}

export interface AiWorkDemoState {
  scene: number;
  reportStatus: AiWorkReportStatus;
  completeness: number;
  draftGenerated: boolean;
  missingWorkAdded: boolean;
  delayExplained: boolean;
  delayDueDate: string;
  reviewDecision: 'approved' | 'none' | 'returned';
  returnReason: string;
  focusMarked: boolean;
  huadaStatus: 'normal' | 'resolved' | 'rising' | 'watch';
}

export type AiWorkCard =
  | {
      actionLabel: string;
      description: string;
      route: string;
      title: string;
      type: 'deep-link';
    }
  | {
      actions: Array<{
        id: string;
        kind?: 'default' | 'primary';
        label: string;
      }>;
      description: string;
      meta: string[];
      title: string;
      type: 'action';
    }
  | {
      description: string;
      duration: string;
      evidenceId: string;
      level: AiWorkRiskLevel;
      object: string;
      title: string;
      type: 'insight';
    }
  | {
      options: string[];
      question: string;
      type: 'question';
    };

export interface AiWorkChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  time: string;
  card?: AiWorkCard;
}
