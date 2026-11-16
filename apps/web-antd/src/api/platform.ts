/**
 * 运营平台 API 函数
 */

import type {
  Admin,
  AlertRule,
  ApiKey,
  ApiResponse,
  AuditLog,
  Bill,
  IpRule,
  Model,
  NotificationTemplate,
  Package,
  PaginatedResponse,
  Permission,
  Report,
  Role,
  Service,
  ServiceCallLog,
  Subscription,
  SystemConfig,
  Tenant,
  TenantActivityStats,
  TenantModelQuota,
  UsageRecord,
  Webhook,
  WebhookLog,
} from '#/types/platform';

import { createMockResponse, mockDelay } from './mock-data';
import {
  mockAdmins,
  mockAlertRules,
  mockApiKeys,
  mockAuditLogs,
  mockBills,
  mockIpRules,
  mockModelPerformanceStats,
  mockModels,
  mockNotificationTemplates,
  mockPackages,
  mockPermissions,
  mockReports,
  mockRoles,
  mockServiceCallLogs,
  mockServices,
  mockSubscriptions,
  mockSystemConfigs,
  mockTenantActivityStats,
  mockTenantModelQuotas,
  mockTenants,
  mockUsageRecords,
  mockWebhookLogs,
  mockWebhooks,
} from './platform-mock-data';

// ==================== 1. 租户管理 API ====================

/**
 * 获取租户列表
 */
export async function getTenantsApi(params?: {
  keyword?: string;
  page?: number;
  pageSize?: number;
  status?: string;
}): Promise<ApiResponse<PaginatedResponse<Tenant>>> {
  await mockDelay();

  let filtered = [...mockTenants];

  // 状态筛选
  if (params?.status) {
    filtered = filtered.filter((t) => t.status === params.status);
  }

  // 关键词搜索
  if (params?.keyword) {
    const keyword = params.keyword.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.name.toLowerCase().includes(keyword) ||
        t.code.toLowerCase().includes(keyword) ||
        t.contactPerson.toLowerCase().includes(keyword),
    );
  }

  const page = params?.page || 1;
  const pageSize = params?.pageSize || 10;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return createMockResponse({
    items,
    total: filtered.length,
    page,
    pageSize,
  });
}

/**
 * 获取租户详情
 */
export async function getTenantApi(
  id: string,
): Promise<ApiResponse<Tenant | undefined>> {
  await mockDelay();
  const tenant = mockTenants.find((t) => t.id === id);
  return createMockResponse(tenant);
}

/**
 * 创建租户
 */
export async function createTenantApi(
  data: Partial<Tenant>,
): Promise<ApiResponse<Tenant>> {
  await mockDelay();

  const newTenant: Tenant = {
    id: `tenant_${Date.now()}`,
    name: data.name || '',
    code: data.code || '',
    contactPerson: data.contactPerson || '',
    contactPhone: data.contactPhone || '',
    email: data.email || '',
    industry: data.industry || 'other',
    status: 'normal',
    packageId: data.packageId || '',
    packageQuota: data.packageQuota || 0,
    usedQuota: 0,
    employeeCount: data.employeeCount || 0,
    tags: data.tags || [],
    registeredAt: new Date().toISOString(),
    expiredAt: data.expiredAt || new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockTenants.push(newTenant);
  return createMockResponse(newTenant);
}

/**
 * 更新租户
 */
export async function updateTenantApi(
  id: string,
  data: Partial<Tenant>,
): Promise<ApiResponse<Tenant | undefined>> {
  await mockDelay();

  const index = mockTenants.findIndex((t) => t.id === id);
  if (index !== -1) {
    mockTenants[index] = {
      ...mockTenants[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return createMockResponse(mockTenants[index]);
  }

  throw new Error('租户不存在');
}

/**
 * 删除租户
 */
export async function deleteTenantApi(id: string): Promise<ApiResponse<void>> {
  await mockDelay();

  const index = mockTenants.findIndex((t) => t.id === id);
  if (index !== -1) {
    mockTenants.splice(index, 1);
  }

  return createMockResponse(undefined);
}

// ==================== 2. 套餐与订阅管理 API ====================

/**
 * 获取套餐列表
 */
export async function getPackagesApi(): Promise<ApiResponse<Package[]>> {
  await mockDelay();
  return createMockResponse(mockPackages);
}

/**
 * 获取订阅记录
 */
export async function getSubscriptionsApi(params?: {
  status?: string;
  tenantId?: string;
}): Promise<ApiResponse<Subscription[]>> {
  await mockDelay();

  let filtered = [...mockSubscriptions];

  if (params?.tenantId) {
    filtered = filtered.filter((s) => s.tenantId === params.tenantId);
  }

  if (params?.status) {
    filtered = filtered.filter((s) => s.status === params.status);
  }

  return createMockResponse(filtered);
}

/**
 * 创建订阅
 */
export async function createSubscriptionApi(
  data: Partial<Subscription>,
): Promise<ApiResponse<Subscription>> {
  await mockDelay();

  const newSubscription: Subscription = {
    id: `sub_${Date.now()}`,
    tenantId: data.tenantId || '',
    tenantName: data.tenantName || '',
    packageId: data.packageId || '',
    packageName: data.packageName || '',
    status: data.status || 'active',
    startDate: data.startDate || new Date().toISOString(),
    endDate: data.endDate || new Date().toISOString(),
    autoRenew: data.autoRenew || false,
    price: data.price || 0,
    trialUsed: data.trialUsed || false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockSubscriptions.push(newSubscription);
  return createMockResponse(newSubscription);
}

// ==================== 3. 产品服务管理 API ====================

/**
 * 获取服务列表
 */
export async function getServicesApi(): Promise<ApiResponse<Service[]>> {
  await mockDelay();
  return createMockResponse(mockServices);
}

/**
 * 获取服务详情
 */
export async function getServiceApi(
  id: string,
): Promise<ApiResponse<Service | undefined>> {
  await mockDelay();
  const service = mockServices.find((s) => s.id === id);
  return createMockResponse(service);
}

/**
 * 更新服务状态
 */
export async function updateServiceStatusApi(
  id: string,
  status: 'disabled' | 'enabled',
): Promise<ApiResponse<void>> {
  await mockDelay();

  const service = mockServices.find((s) => s.id === id);
  if (service) {
    service.status = status;
    service.updatedAt = new Date().toISOString();
  }

  return createMockResponse(undefined);
}

// ==================== 4. 用量与计费 API ====================

/**
 * 获取账单列表
 */
export async function getBillsApi(params?: {
  status?: string;
  tenantId?: string;
}): Promise<ApiResponse<Bill[]>> {
  await mockDelay();

  let filtered = [...mockBills];

  if (params?.tenantId) {
    filtered = filtered.filter((b) => b.tenantId === params.tenantId);
  }

  if (params?.status) {
    filtered = filtered.filter((b) => b.status === params.status);
  }

  return createMockResponse(filtered);
}

/**
 * 获取用量记录
 */
export async function getUsageRecordsApi(params?: {
  endDate?: string;
  startDate?: string;
  tenantId?: string;
}): Promise<ApiResponse<UsageRecord[]>> {
  await mockDelay();

  let filtered = [...mockUsageRecords];

  if (params?.tenantId) {
    filtered = filtered.filter((r) => r.tenantId === params.tenantId);
  }

  return createMockResponse(filtered);
}

// ==================== 5. 模型管理 API ====================

/**
 * 获取模型列表
 */
export async function getModelsApi(): Promise<ApiResponse<Model[]>> {
  await mockDelay();
  return createMockResponse(mockModels);
}

/**
 * 获取租户模型配额
 */
export async function getTenantModelQuotasApi(
  tenantId?: string,
): Promise<ApiResponse<TenantModelQuota[]>> {
  await mockDelay();

  let filtered = [...mockTenantModelQuotas];

  if (tenantId) {
    filtered = filtered.filter((q) => q.tenantId === tenantId);
  }

  return createMockResponse(filtered);
}

/**
 * 更新模型配额
 */
export async function updateTenantModelQuotaApi(
  id: string,
  quota: number,
): Promise<ApiResponse<void>> {
  await mockDelay();

  const item = mockTenantModelQuotas.find((q) => q.id === id);
  if (item) {
    item.monthlyQuota = quota;
    item.updatedAt = new Date().toISOString();
  }

  return createMockResponse(undefined);
}

// ==================== 6. 日志与审计 API ====================

/**
 * 获取服务调用日志
 */
export async function getServiceCallLogsApi(params?: {
  endDate?: string;
  page?: number;
  pageSize?: number;
  serviceId?: string;
  startDate?: string;
  tenantId?: string;
}): Promise<ApiResponse<PaginatedResponse<ServiceCallLog>>> {
  await mockDelay();

  let filtered = [...mockServiceCallLogs];

  if (params?.tenantId) {
    filtered = filtered.filter((l) => l.tenantId === params.tenantId);
  }

  if (params?.serviceId) {
    filtered = filtered.filter((l) => l.serviceId === params.serviceId);
  }

  const page = params?.page || 1;
  const pageSize = params?.pageSize || 10;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return createMockResponse({
    items,
    total: filtered.length,
    page,
    pageSize,
  });
}

/**
 * 获取审计日志
 */
export async function getAuditLogsApi(params?: {
  action?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  startDate?: string;
  tenantId?: string;
}): Promise<ApiResponse<PaginatedResponse<AuditLog>>> {
  await mockDelay();

  let filtered = [...mockAuditLogs];

  if (params?.tenantId) {
    filtered = filtered.filter((l) => l.tenantId === params.tenantId);
  }

  if (params?.action) {
    filtered = filtered.filter((l) => l.action === params.action);
  }

  const page = params?.page || 1;
  const pageSize = params?.pageSize || 10;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return createMockResponse({
    items,
    total: filtered.length,
    page,
    pageSize,
  });
}

// ==================== 7. 系统配置 API ====================

/**
 * 获取系统配置
 */
export async function getSystemConfigsApi(): Promise<
  ApiResponse<SystemConfig[]>
> {
  await mockDelay();
  return createMockResponse(mockSystemConfigs);
}

/**
 * 更新系统配置
 */
export async function updateSystemConfigApi(
  key: string,
  value: any,
): Promise<ApiResponse<void>> {
  await mockDelay();

  const config = mockSystemConfigs.find((c) => c.key === key);
  if (config) {
    config.value = value;
    config.updatedAt = new Date().toISOString();
  }

  return createMockResponse(undefined);
}

/**
 * 获取通知模板
 */
export async function getNotificationTemplatesApi(): Promise<
  ApiResponse<NotificationTemplate[]>
> {
  await mockDelay();
  return createMockResponse(mockNotificationTemplates);
}

/**
 * 获取IP规则
 */
export async function getIpRulesApi(): Promise<ApiResponse<IpRule[]>> {
  await mockDelay();
  return createMockResponse(mockIpRules);
}

// ==================== 8. 安全与权限 API ====================

/**
 * 获取管理员列表
 */
export async function getAdminsApi(): Promise<ApiResponse<Admin[]>> {
  await mockDelay();
  return createMockResponse(mockAdmins);
}

/**
 * 获取角色列表
 */
export async function getRolesApi(): Promise<ApiResponse<Role[]>> {
  await mockDelay();
  return createMockResponse(mockRoles);
}

/**
 * 获取权限列表
 */
export async function getPermissionsApi(): Promise<ApiResponse<Permission[]>> {
  await mockDelay();
  return createMockResponse(mockPermissions);
}

// ==================== 9. 数据分析 API ====================

/**
 * 获取租户活跃度统计
 */
export async function getTenantActivityStatsApi(params?: {
  endDate?: string;
  startDate?: string;
  tenantId?: string;
}): Promise<ApiResponse<TenantActivityStats[]>> {
  await mockDelay();

  let filtered = [...mockTenantActivityStats];

  if (params?.tenantId) {
    filtered = filtered.filter((s) => s.tenantId === params.tenantId);
  }

  return createMockResponse(filtered);
}

/**
 * 获取模型性能统计
 */
export async function getModelPerformanceStatsApi(params?: {
  endDate?: string;
  modelId?: string;
  startDate?: string;
}): Promise<ApiResponse<any[]>> {
  await mockDelay();

  let filtered = [...mockModelPerformanceStats];

  if (params?.modelId) {
    filtered = filtered.filter((s) => s.modelId === params.modelId);
  }

  return createMockResponse(filtered);
}

/**
 * 获取报表列表
 */
export async function getReportsApi(): Promise<ApiResponse<Report[]>> {
  await mockDelay();
  return createMockResponse(mockReports);
}

// ==================== 10. 自动化与集成 API ====================

/**
 * 获取告警规则
 */
export async function getAlertRulesApi(): Promise<ApiResponse<AlertRule[]>> {
  await mockDelay();
  return createMockResponse(mockAlertRules);
}

/**
 * 获取API密钥
 */
export async function getApiKeysApi(
  tenantId?: string,
): Promise<ApiResponse<ApiKey[]>> {
  await mockDelay();

  let filtered = [...mockApiKeys];

  if (tenantId) {
    filtered = filtered.filter((k) => k.tenantId === tenantId);
  }

  return createMockResponse(filtered);
}

/**
 * 创建API密钥
 */
export async function createApiKeyApi(
  data: Partial<ApiKey>,
): Promise<ApiResponse<ApiKey>> {
  await mockDelay();

  const newApiKey: ApiKey = {
    id: `key_${Date.now()}`,
    name: data.name || '',
    key: `sk_${Math.random().toString(36).slice(2, 20)}`,
    tenantId: data.tenantId || '',
    tenantName: data.tenantName || '',
    permissions: data.permissions || [],
    rateLimit: data.rateLimit || 1000,
    expiredAt: data.expiredAt,
    lastUsedAt: undefined,
    status: 'active',
    createdBy: data.createdBy || '',
    createdAt: new Date().toISOString(),
  };

  mockApiKeys.push(newApiKey);
  return createMockResponse(newApiKey);
}

/**
 * 获取Webhook列表
 */
export async function getWebhooksApi(): Promise<ApiResponse<Webhook[]>> {
  await mockDelay();
  return createMockResponse(mockWebhooks);
}

/**
 * 获取Webhook调用日志
 */
export async function getWebhookLogsApi(
  webhookId?: string,
): Promise<ApiResponse<WebhookLog[]>> {
  await mockDelay();

  let filtered = [...mockWebhookLogs];

  if (webhookId) {
    filtered = filtered.filter((l) => l.webhookId === webhookId);
  }

  return createMockResponse(filtered);
}
