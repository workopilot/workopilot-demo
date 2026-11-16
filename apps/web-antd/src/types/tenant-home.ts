/**
 * 租户管理首页相关类型定义
 */

// 服务状态
export type ServiceStatus = 'error' | 'normal' | 'warning';

// 快捷操作
export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  color?: string;
  route?: string;
  action?: string;
  badge?: number;
}

// 服务运行状态
export interface ServiceRunningStatus {
  id: string;
  name: string; // 服务名称：智能填报、智能审核、附件分类
  status: ServiceStatus;
  todayCalls: number; // 今日调用次数
  totalCalls: number; // 总调用次数
  successRate: number; // 成功率
  avgResponseTime: number; // 平均响应时间(ms)
  route?: string; // 跳转路由
  logo?: string; // 图标（图片路径或图标名称）
  logoColor?: string; // 图标颜色
  logoBgColor?: string; // 图标背景色
}

// 服务用量数据
export interface ServiceUsageData {
  name: string;
  value: number;
  percentage: number;
}

// 服务用量监控
export interface ServiceUsageMonitor {
  total: number;
  data: ServiceUsageData[];
}

// 模型用量数据点
export interface ModelUsagePoint {
  time: string; // 时间点
  modelName: string;
  calls: number;
}

// 模型用量统计
export interface ModelUsageData {
  modelName: string;
  modelVendor: string;
  totalCalls: number;
  data: ModelUsagePoint[];
}

// 模型用量监控
export interface ModelUsageMonitor {
  timeRange: 'custom' | 'month' | 'today' | 'week';
  customStart?: string;
  customEnd?: string;
  data: ModelUsageData[];
}

// 租户概览统计
export interface TenantOverview {
  tenantId: string;
  tenantName: string;
  totalCalls: number; // 总调用次数
  todayCalls: number; // 今日调用次数
  activeModels: number; // 活跃模型数
  serviceHealth: number; // 服务健康度(0-100)
  expiryDate: string; // 套餐到期日期
  packageType: string; // 套餐类型
}

// 首页数据聚合
export interface TenantHomeData {
  overview: TenantOverview;
  quickActions: QuickAction[];
  serviceStatus: ServiceRunningStatus[];
  serviceUsage: ServiceUsageMonitor;
  modelUsage: ModelUsageMonitor;
}
