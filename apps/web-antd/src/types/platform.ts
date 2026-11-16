/**
 * 运营平台相关类型定义
 */

// ==================== 1. 租户管理 ====================

// 租户状态
export type TenantStatus = 'disabled' | 'expired' | 'normal';

// 租户行业
export type TenantIndustry =
  | 'education'
  | 'finance'
  | 'healthcare'
  | 'manufacturing'
  | 'other'
  | 'retail'
  | 'technology';

// 租户
export interface Tenant {
  id: string;
  name: string;
  code: string;
  contactPerson: string;
  contactPhone: string;
  email: string;
  industry: TenantIndustry;
  status: TenantStatus;
  packageId: string; // 套餐ID
  packageQuota: number; // 套餐配额
  usedQuota: number; // 已用量
  employeeCount: number; // 员工数量
  tags: string[]; // 标签
  registeredAt: string; // 注册时间
  expiredAt: string; // 到期时间
  lastActiveAt: string; // 最后活跃时间
  createdAt: string;
  updatedAt: string;
}

// ==================== 2. 套餐与订阅管理 ====================

// 套餐周期类型
export type PackageCycle = 'monthly' | 'quarterly' | 'yearly';

// 套餐
export interface Package {
  id: string;
  name: string;
  code: string;
  description: string;
  price: number; // 价格(元)
  cycle: PackageCycle; // 周期
  services: string[]; // 包含的服务ID列表
  modelQuota: number; // 模型调用额度(Token)
  maxTenants: number; // 最大租户数
  maxUsers: number; // 最大用户数
  trialDays: number; // 试用天数
  features: string[]; // 功能特性
  isPopular: boolean; // 是否热门
  status: 'disabled' | 'enabled';
  createdAt: string;
  updatedAt: string;
}

// 订阅状态
export type SubscriptionStatus = 'active' | 'expired' | 'suspended' | 'trial';

// 订阅记录
export interface Subscription {
  id: string;
  tenantId: string;
  tenantName: string;
  packageId: string;
  packageName: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  autoRenew: boolean; // 是否自动续费
  price: number; // 订阅价格
  trialUsed: boolean; // 是否已试用
  createdAt: string;
  updatedAt: string;
}

// ==================== 3. 产品服务管理 ====================

// 服务类型
export type ServiceType =
  | 'audit'
  | 'chat'
  | 'classification'
  | 'extraction'
  | 'summary'
  | 'translation';

// 服务状态
export type ServiceStatus = 'beta' | 'disabled' | 'enabled';

// 服务
export interface Service {
  id: string;
  name: string;
  code: string;
  type: ServiceType;
  description: string;
  icon: string; // 图标
  status: ServiceStatus;
  modelId: string; // 默认模型ID
  dependencies: string[]; // 依赖的服务ID列表
  apiEndpoint: string; // API端点
  configSchema: Record<string, any>; // 配置参数Schema
  rateLimit: number; // 速率限制(次/分钟)
  version: string; // 版本号
  createdAt: string;
  updatedAt: string;
}

// ==================== 4. 用量与计费 ====================

// 账单状态
export type BillStatus = 'cancelled' | 'overdue' | 'paid' | 'unpaid';

// 账单
export interface Bill {
  id: string;
  tenantId: string;
  tenantName: string;
  billNo: string; // 账单编号
  cycle: string; // 账单周期
  totalAmount: number; // 总金额
  serviceFees: number; // 服务费用
  modelFees: number; // 模型费用
  additionalFees: number; // 附加费用
  status: BillStatus;
  dueDate: string; // 到期日期
  paidAt?: string; // 支付时间
  createdAt: string;
}

// 用量明细
export interface UsageRecord {
  id: string;
  tenantId: string;
  tenantName: string;
  serviceId: string;
  serviceName: string;
  modelId: string;
  modelName: string;
  callCount: number; // 调用次数
  inputTokens: number; // 输入Token数
  outputTokens: number; // 输出Token数
  totalTokens: number; // 总Token数
  cost: number; // 费用
  date: string; // 日期
  createdAt: string;
}

// ==================== 5. 模型管理 ====================

// 模型提供商
export type ModelProvider =
  | 'alibaba'
  | 'anthropic'
  | 'baidu'
  | 'custom'
  | 'google'
  | 'openai'
  | 'tencent';

// 模型级别
export type ModelLevel = 'advanced' | 'basic' | 'enterprise' | 'standard';

// 模型能力
export type ModelCapability =
  | 'audio'
  | 'multimodal'
  | 'text-analysis'
  | 'text-generation'
  | 'vision';

// 模型状态
export type ModelStatus = 'disabled' | 'enabled' | 'testing';

// 模型
export interface Model {
  id: string;
  name: string;
  code: string;
  displayName: string; // 显示名称
  provider: ModelProvider;
  version: string; // 版本
  level: ModelLevel; // 级别
  capabilities: ModelCapability[]; // 能力列表
  description: string;
  status: ModelStatus;
  maxTokens: number; // 最大Token数
  inputPrice: number; // 输入单价(元/千Token)
  outputPrice: number; // 输出单价(元/千Token)
  supportLanguages: string[]; // 支持的语言
  maxConcurrency: number; // 最大并发数
  rateLimit: number; // 速率限制(次/分钟)
  apiEndpoint: string; // API端点
  config: Record<string, any>; // 配置信息
  createdAt: string;
  updatedAt: string;
}

// 租户模型配额
export interface TenantModelQuota {
  id: string;
  tenantId: string;
  tenantName: string;
  modelId: string;
  modelName: string;
  monthlyQuota: number; // 月配额
  usedQuota: number; // 已使用配额
  resetDate: string; // 重置日期
  createdAt: string;
  updatedAt: string;
}

// ==================== 6. 日志与审计 ====================

// 日志级别
export type LogLevel = 'debug' | 'error' | 'info' | 'warn';

// 操作类型
export type AuditAction =
  | 'config'
  | 'create'
  | 'delete'
  | 'export'
  | 'import'
  | 'login'
  | 'logout'
  | 'update';

// 服务调用日志
export interface ServiceCallLog {
  id: string;
  tenantId: string;
  tenantName: string;
  userId: string;
  userName: string;
  serviceId: string;
  serviceName: string;
  requestId: string;
  method: string; // 请求方法
  params: Record<string, any>; // 请求参数
  response: any; // 响应数据
  statusCode: number; // 响应状态码
  duration: number; // 耗时(ms)
  ip: string; // IP地址
  userAgent: string; // 用户代理
  success: boolean; // 是否成功
  errorMessage?: string; // 错误信息
  createdAt: string;
}

// 操作审计日志
export interface AuditLog {
  id: string;
  tenantId: string;
  tenantName: string;
  userId: string;
  userName: string;
  action: AuditAction;
  module: string; // 模块
  resource: string; // 资源
  resourceId?: string; // 资源ID
  details: Record<string, any>; // 详细信息
  ip: string;
  location?: string; // 地理位置
  userAgent: string;
  success: boolean;
  errorMessage?: string;
  createdAt: string;
}

// ==================== 7. 系统配置 ====================

// 超限策略
export type OverLimitStrategy = 'block' | 'charge' | 'warning';

// 通知渠道
export type NotificationChannel = 'email' | 'in-app' | 'sms' | 'webhook';

// 系统配置
export interface SystemConfig {
  id: string;
  key: string;
  value: any;
  description: string;
  category: string; // 配置分类
  type: 'array' | 'boolean' | 'json' | 'number' | 'string';
  updatedAt: string;
}

// 通知模板
export interface NotificationTemplate {
  id: string;
  name: string;
  code: string;
  channel: NotificationChannel;
  title: string;
  content: string; // 支持变量如{{租户名称}}
  variables: string[]; // 变量列表
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// IP规则类型
export type IpRuleType = 'blacklist' | 'whitelist';

// IP规则
export interface IpRule {
  id: string;
  type: IpRuleType;
  ip: string; // IP地址或CIDR
  description: string;
  enabled: boolean;
  expiredAt?: string; // 过期时间
  createdAt: string;
  updatedAt: string;
}

// ==================== 8. 安全与权限 ====================

// 管理员角色
export type AdminRole = 'admin' | 'operator' | 'super-admin' | 'viewer';

// MFA状态
export type MfaStatus = 'disabled' | 'enabled';

// 管理员
export interface Admin {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  role: AdminRole;
  permissions: string[]; // 权限列表
  mfaEnabled: boolean; // 是否启用MFA
  status: 'active' | 'disabled' | 'locked';
  lastLoginAt?: string;
  lastLoginIp?: string;
  createdAt: string;
  updatedAt: string;
}

// 角色
export interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
  permissions: string[]; // 权限ID列表
  isSystem: boolean; // 是否系统角色
  adminCount: number; // 管理员数量
  createdAt: string;
  updatedAt: string;
}

// 权限
export interface Permission {
  id: string;
  name: string;
  code: string;
  module: string; // 所属模块
  description: string;
  type: 'api' | 'button' | 'menu';
  parentId?: string;
  children?: Permission[];
}

// ==================== 9. 数据分析 ====================

// 租户活跃度统计
export interface TenantActivityStats {
  tenantId: string;
  tenantName: string;
  loginCount: number; // 登录次数
  activeUsers: number; // 活跃用户数
  serviceCalls: number; // 服务调用次数
  modelCalls: number; // 模型调用次数
  tokenUsage: number; // Token使用量
  date: string;
}

// 模型性能统计
export interface ModelPerformanceStats {
  modelId: string;
  modelName: string;
  totalCalls: number; // 总调用次数
  successRate: number; // 成功率
  avgResponseTime: number; // 平均响应时间(ms)
  p50ResponseTime: number; // P50响应时间
  p95ResponseTime: number; // P95响应时间
  p99ResponseTime: number; // P99响应时间
  totalTokens: number; // 总Token数
  totalCost: number; // 总费用
  errorCount: number; // 错误次数
  date: string;
}

// 报表
export interface Report {
  id: string;
  name: string;
  code: string;
  type: 'billing' | 'custom' | 'model' | 'service' | 'tenant';
  description: string;
  config: Record<string, any>; // 报表配置
  schedule?: string; // 定时发送配置
  isPublic: boolean; // 是否公开
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== 10. 自动化与集成 ====================

// 告警级别
export type AlertLevel = 'critical' | 'info' | 'warning';

// 告警状态
export type AlertStatus = 'disabled' | 'enabled' | 'triggered';

// 告警规则
export interface AlertRule {
  id: string;
  name: string;
  code: string;
  type: 'billing' | 'error' | 'performance' | 'usage'; // 告警类型
  condition: Record<string, any>; // 触发条件
  level: AlertLevel;
  channels: NotificationChannel[]; // 通知渠道
  recipients: string[]; // 接收人
  status: AlertStatus;
  lastTriggeredAt?: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// API密钥
export interface ApiKey {
  id: string;
  name: string;
  key: string; // 密钥(脱敏)
  tenantId: string;
  tenantName: string;
  permissions: string[]; // 权限列表
  rateLimit: number; // 速率限制
  expiredAt?: string; // 过期时间
  lastUsedAt?: string; // 最后使用时间
  status: 'active' | 'disabled' | 'expired';
  createdBy: string;
  createdAt: string;
}

// Webhook事件类型
export type WebhookEvent =
  | 'alert.triggered'
  | 'subscription.expired'
  | 'tenant.created'
  | 'tenant.disabled'
  | 'usage.threshold';

// Webhook
export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[]; // 事件类型
  secret: string; // 签名密钥
  headers: Record<string, string>; // 请求头
  retryTimes: number; // 重试次数
  timeout: number; // 超时时间(秒)
  status: 'disabled' | 'enabled';
  lastTriggeredAt?: string;
  lastStatus?: 'failed' | 'success';
  createdAt: string;
  updatedAt: string;
}

// Webhook调用日志
export interface WebhookLog {
  id: string;
  webhookId: string;
  webhookName: string;
  event: WebhookEvent;
  payload: Record<string, any>; // 请求负载
  responseCode?: number; // 响应状态码
  responseBody?: string; // 响应内容
  duration: number; // 耗时(ms)
  success: boolean;
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
}
