/**
 * 模型调用日志相关类型
 */

// 调用状态
export type CallStatus = 'failed' | 'success' | 'timeout';

// 模型级别
export type ModelLevel = 'advanced' | 'standard';

// 模型厂商
export type ModelVendor =
  | 'Alibaba'
  | 'Anthropic'
  | 'Azure'
  | 'Baidu'
  | 'Google'
  | 'OpenAI';

// 业务类型
export type BusinessType =
  | 'audit'
  | 'chat'
  | 'classification'
  | 'extraction'
  | 'summary'
  | 'translation';

// 模型调用日志
export interface ModelCallLog {
  id: string; // 日志ID
  tenantId: string; // 租户ID
  tenantName: string; // 租户名称
  userId: string; // 用户ID
  tenantModelConfigId: string; // 租户模型配置ID
  tenantVendorConfigId: string; // 租户厂商配置ID
  requestId: string; // 请求ID
  businessType: BusinessType; // 业务类型
  businessId?: string; // 业务ID
  promptContent: string; // 提示词内容
  inputTokens: number; // 输入Token数
  requestParams: Record<string, unknown>; // 请求参数
  responseContent?: string; // 响应内容
  outputTokens: number; // 输出Token数
  totalTokens: number; // 总Token数
  modelName: string; // 模型名称
  modelVendor: ModelVendor; // 模型厂商
  modelLevel: ModelLevel; // 模型级别
  inputTokenPrice: number; // 输入Token单价
  outputTokenPrice: number; // 输出Token单价
  cost: number; // 费用(元)
  status: CallStatus; // 调用状态
  duration: number; // 耗时(毫秒)
  errorCode?: string; // 错误码
  errorMessage?: string; // 错误信息
  requestIp: string; // 请求IP
  calledAt: string; // 调用时间
}

// 日志查询参数
export interface ModelLogQueryParams {
  tenantId?: string;
  userId?: string;
  tenantModelConfigId?: string;
  tenantVendorConfigId?: string;
  requestId?: string;
  businessType?: BusinessType;
  businessId?: string;
  status?: CallStatus;
  modelLevel?: ModelLevel;
  modelVendor?: ModelVendor;
  requestIp?: string;
  startTime?: string;
  endTime?: string;
  keyword?: string; // 关键词搜索(提示词/响应内容)
  sortBy?: 'calledAt' | 'duration' | 'totalTokens';
  sortOrder?: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

// 日志列表项(用于表格展示)
export interface ModelLogListItem {
  id: string;
  tenantId: string;
  tenantName: string;
  userId: string;
  requestId: string;
  businessType: BusinessType;
  businessId?: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  status: CallStatus;
  duration: number;
  modelName: string;
  modelVendor: ModelVendor;
  modelLevel: ModelLevel;
  calledAt: string;
}
