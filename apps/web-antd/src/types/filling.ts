/**
 * 智能填报相关类型定义
 */

// 填报状态
export type FillingStatus = 'failed' | 'success';

// 单据状态
export type BillStatus = 'draft' | 'submitted';

// 步骤类型
export type StepType = 'fill' | 'login' | 'navigate' | 'submit' | 'verify';

// 填报日志记录
export interface FillingLog {
  id: string; // 日志ID
  billNo: string; // 单号
  billType: string; // 单据类型
  scriptName: string; // 执行脚本名称
  scriptId: string; // 脚本ID
  filledAt: string; // 填报时间
  status: FillingStatus; // 填报状态（成功/失败）
  billStatus: BillStatus; // 单据状态（草稿/已提交）
  steps: FillingStep[]; // 操作步骤
  errorMessage?: string; // 错误信息（失败时）
  filledBy: string; // 填报人
  duration: number; // 耗时（毫秒）
  systemName: string; // 目标系统名称
}

// 操作步骤
export interface FillingStep {
  id: string;
  stepName: string; // 步骤名称
  stepType: StepType; // 步骤类型
  status: FillingStatus;
  startTime: string;
  endTime: string;
  description: string; // 步骤描述
  screenshot?: string; // 截图URL（可选）
  details?: Record<string, unknown>; // 详细数据
}

// 日志查询参数
export interface FillingLogQueryParams {
  billNo?: string;
  billType?: string;
  scriptId?: string;
  status?: FillingStatus;
  billStatus?: BillStatus;
  startTime?: string;
  endTime?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
