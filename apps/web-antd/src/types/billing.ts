/**
 * 计费管理相关类型
 */

// ============ 产品服务相关 ============

// 产品类型
export type ProductType = 'application' | 'other' | 'service'; // 应用 | 服务 | 其他

// 产品版本
export type ProductVersion = 'plus' | 'pro' | 'promax' | 'standard'; // 标准 | Plus | Pro | ProMax

// 计费单位类型
export type BillingUnit = 'per_server' | 'per_year' | 'unlimited'; // 每年 | 每台服务器 | 不限

// 服务配置（左侧服务列表）
export interface ServiceConfig {
  id: string; // 服务ID
  name: string; // 服务名称
  description: string; // 服务描述
  status: 'disabled' | 'enabled'; // 状态
  createdAt: string; // 创建时间
  updatedAt: string; // 更新时间
}

// 产品信息（右侧产品版本列表）
export interface Product {
  id: string; // 产品ID
  serviceName: string; // 服务名称
  version: ProductVersion; // 版本
  versionDescription: string; // 版本说明
  price: number; // 单价（人民币元/月）
  usageLimit: number; // 数量限制（次/月）
  tokensLimit: number; // Tokens限制（个/月）
  status: 'disabled' | 'enabled'; // 状态
  createdAt: string; // 创建时间
  updatedAt: string; // 更新时间
}

// 产品查询参数
export interface ProductQueryParams {
  serviceName?: string; // 服务名称筛选
  version?: ProductVersion; // 版本筛选
  versionDescription?: string; // 版本说明筛选
  status?: 'disabled' | 'enabled'; // 状态筛选
  page: number;
  pageSize: number;
}

// 产品版本映射（用于显示）
export const ProductVersionMap: Record<ProductVersion, string> = {
  standard: '标准',
  plus: 'Plus',
  pro: 'Pro',
  promax: 'ProMax',
};

// ============ 租户订阅相关 ============

// 订阅状态
export type SubscriptionStatus = 'active' | 'expired';

// 租户订阅信息
export interface TenantSubscription {
  id: string; // 订阅ID
  tenantId: string; // 租户ID
  tenantName: string; // 租户名称
  productId: string; // 产品ID
  productName: string; // 产品名称
  productVersion: ProductVersion; // 产品版本
  subscribeDate: string; // 订阅日期
  expiryDate: string; // 到期日期
  status: SubscriptionStatus; // 订阅状态
  quantity: number; // 订阅数量（月数）
  price: number; // 订阅价格
  usageLimit: number; // 数量限制（次/月）
  tokensLimit: number; // Tokens限制（个/月）
  usedAmount: number; // 已使用量
  createdAt: string; // 创建时间
  updatedAt: string; // 更新时间
}

// 订阅查询参数
export interface SubscriptionQueryParams {
  tenantName?: string; // 租户名称筛选
  productName?: string; // 产品名称筛选
  productVersion?: ProductVersion; // 产品版本筛选
  status?: SubscriptionStatus; // 状态筛选
  subscribeDateRange?: [string, string] | null; // 订阅日期范围
  expiryDateRange?: [string, string] | null; // 到期日期范围
  keyword?: string; // 关键词搜索
  page: number;
  pageSize: number;
}

// 续订请求
export interface RenewSubscriptionRequest {
  subscriptionId: string; // 订阅ID
  duration: number; // 续订时长（月）
}

// 新增订阅请求
export interface CreateSubscriptionRequest {
  tenantId: string; // 租户ID
  tenantName: string; // 租户名称
  productId: string; // 产品ID
  quantity: number; // 订阅数量（月数）
  expiryDate: string; // 到期日期（自动计算）
}

// ============ 用量监控相关 ============

// 用量状态
export type UsageStatus = 'exceeded' | 'normal' | 'warning';

// 用量监控项
export interface UsageMonitor {
  id: string; // 监控ID
  tenantId: string; // 租户ID
  tenantName: string; // 租户名称
  productId: string; // 产品ID
  productName: string; // 产品名称
  productVersion: ProductVersion; // 产品版本
  subscriptionId: string; // 订阅ID
  usageLimit: number; // 数量限制
  usedAmount: number; // 已使用量
  remainingAmount: number; // 剩余量
  usagePercentage: number; // 使用率（百分比）
  status: UsageStatus; // 用量状态
  expiryDate: string; // 到期日期
  lastUpdated: string; // 最后更新时间
}

// 用量查询参数
export interface UsageQueryParams {
  tenantName?: string; // 租户名称筛选
  productName?: string; // 产品服务筛选
  status?: UsageStatus; // 状态筛选
  expiryDateRange?: [string, string] | null; // 到期日期范围
  sortByUsagePercentage?: 'asc' | 'desc' | null; // 使用率排序
  sortByExpiryDate?: 'asc' | 'desc' | null; // 到期日期排序
  page: number;
  pageSize: number;
}

// 用量详情
export interface UsageDetail {
  subscriptionId: string; // 订阅ID
  tenantName: string; // 租户名称
  productName: string; // 产品名称
  productVersion: ProductVersion; // 产品版本
  usageLimit: number; // 数量限制
  usedAmount: number; // 已使用量
  remainingAmount: number; // 剩余量
  usagePercentage: number; // 使用率
  status: UsageStatus; // 用量状态
  subscribeDate: string; // 订阅日期
  expiryDate: string; // 到期日期
  usageHistory: UsageHistoryItem[]; // 使用历史
}

// 使用历史记录
export interface UsageHistoryItem {
  date: string; // 日期
  amount: number; // 使用量
  description: string; // 描述
}

// 升级套餐请求
export interface UpgradePackageRequest {
  subscriptionId: string; // 订阅ID
  targetProductId: string; // 目标产品ID
}

// ============ 通用分页响应 ============

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
