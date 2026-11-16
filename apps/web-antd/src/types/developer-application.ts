/**
 * 开发者申请原型 — 类型定义
 */

// 处理状态:未处理 / 已处理
export type ApplicationStatus = 'pending' | 'processed';

// 处理结果(已处理时):通过 / 不通过
export type ProcessResult = 'approved' | 'rejected';

// 处理状态筛选值
export type ApplicationStatusFilter = 'all' | ApplicationStatus;

export interface DeveloperApplication {
  /** 申请ID */
  id: string;
  /** 申请人 */
  applicantName: string;
  /** 申请时间 ISO */
  applyTime: string;
  /** 手机号 */
  phone: string;
  /** 邮箱 */
  email: string;
  /** 技术方向 */
  techDirection: string;
  /** 申请目的 */
  purpose: string;
  /** GitHub 主页(可选) */
  githubUrl?: string;
  /** GitLab 主页(可选) */
  gitlabUrl?: string;
  /** 处理状态 */
  status: ApplicationStatus;
  /** 处理结果:通过/不通过(已处理时) */
  processResult?: ProcessResult;
  /** 处理结果富文本 HTML(已处理时) */
  processDetail?: string;
  /** 处理时间 ISO */
  processedAt?: string;
  /** 处理人 */
  processedBy?: string;
  /** 创建时间 ISO */
  createdAt: string;
  /** 更新时间 ISO */
  updatedAt: string;
}

export interface DeveloperApplicationQueryParams {
  page: number;
  pageSize: number;
  /** 处理状态筛选,默认 pending */
  status?: ApplicationStatusFilter;
  /** 申请日期起(YYYY-MM-DD) */
  startDate?: string;
  /** 申请日期止(YYYY-MM-DD) */
  endDate?: string;
}

export interface DeveloperApplicationListResult {
  items: DeveloperApplication[];
  total: number;
}

/** 申请处理入参 */
export interface ProcessApplicationPayload {
  processResult: ProcessResult;
  processDetail: string;
}
