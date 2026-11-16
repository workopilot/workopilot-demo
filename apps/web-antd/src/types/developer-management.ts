/**
 * 开发者管理 — 类型定义
 */

export interface Developer {
  /** 记录ID */
  id: string;
  /** 开发者租户名称 */
  tenantName: string;
  /** 负责人 */
  ownerName: string;
  /** 开通时间 ISO */
  activatedAt: string;
  /** 已消耗 Token */
  consumedTokens: number;
  /** 可用 Token */
  availableTokens: number;
  /** 更新时间 ISO */
  updatedAt: string;
}

export interface DeveloperQueryParams {
  page: number;
  pageSize: number;
  /** 关键词(模糊匹配开发者租户名称) */
  keyword?: string;
}

export interface DeveloperListResult {
  items: Developer[];
  total: number;
}

/** 充值入参 */
export interface RechargePayload {
  amount: number;
}
