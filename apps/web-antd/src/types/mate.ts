export type MateEmployeeStatus = 'busy' | 'offline' | 'online';
export type MateFileStatus = 'failed' | 'processing' | 'ready';
export type MateTaskStatus = 'disabled' | 'enabled' | 'running';

export interface MateEmployeeProfile {
  /** 服务对象/适用人群 */
  audience: string;
  /** 核心能力（3-5 条） */
  coreCapabilities: string[];
  /** 特色优势 */
  highlights: string[];
  /** 典型使用场景（2-4 条） */
  scenarios: string[];
}

export interface MateEmployee {
  id: string;
  name: string;
  role: string;
  description: string;
  avatar: string;
  accent: string;
  status: MateEmployeeStatus;
  unread: number;
  pinned: boolean;
  lastActive: string;
  menus: MateEmployeeMenu[];
  quickPrompts: string[];
  /** 已停用但仍保留展示与历史访问的员工 */
  deprecated?: boolean;
  /** 员工详细简介（售后客服 / 工单助理 / 派单助理已补充） */
  profile?: MateEmployeeProfile;
}

export interface MateEmployeeMenu {
  key: string;
  title: string;
  icon: string;
  summary: string;
  path: string;
}

export interface MateMessageCard {
  tag: string;
  title: string;
  summary: string;
  actionLabel: string;
  details: string[];
}

export interface MateMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  time: string;
  list?: string[];
  closing?: string;
  card?: MateMessageCard;
}

export interface MateChatSession {
  id: string;
  employeeId: string;
  title: string;
  relativeTime: string;
  unread: number;
  messages: MateMessage[];
}

export interface MateFile {
  id: string;
  name: string;
  category: string;
  size: string;
  owner: string;
  updatedAt: string;
  status: MateFileStatus;
}

export interface MateAutomationTask {
  id: string;
  title: string;
  description: string;
  schedule: string;
  employeeId: string;
  status: MateTaskStatus;
  lastRun: string;
  nextRun: string;
  successRate: number;
}

export interface MateAutomationLog {
  id: string;
  taskId: string;
  taskTitle: string;
  status: 'failed' | 'success';
  startedAt: string;
  duration: string;
  summary: string;
}

export interface MateStats {
  employeeCount: number;
  fileCount: number;
  automationCount: number;
  completedCount: number;
}

/** 日报提交频率 */
export type MateDailyFrequency = 'daily' | 'workday';
/** 日报分享渠道 */
export type MateShareChannel = 'dingtalk' | 'feishu' | 'wecom';

/** 周报自动生成与提交配置 */
export interface MatePersonalWeeklyConfig {
  enabled: boolean;
  /** 生成星期 1=周一 … 7=周日 */
  generateDay: number;
  /** 生成时刻 HH:mm */
  generateTime: string;
  /** true=自动提交，false=仅生成草稿 */
  autoSubmit: boolean;
  /** 默认接收人 id 列表 */
  recipients: string[];
}

/** 日报自动提交与分享配置 */
export interface MatePersonalDailyConfig {
  enabled: boolean;
  frequency: MateDailyFrequency;
  /** 提交时刻 HH:mm */
  submitTime: string;
  /** 分享人员 id 列表 */
  shareTo: string[];
  /** 分享渠道 */
  shareChannels: MateShareChannel[];
}

/** 汇报助理个人设置 */
export interface MatePersonalSettings {
  weekly: MatePersonalWeeklyConfig;
  daily: MatePersonalDailyConfig;
}
