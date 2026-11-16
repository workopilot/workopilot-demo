/**
 * 计费管理相关 API
 */

import type {
  CreateSubscriptionRequest,
  PaginatedResponse,
  Product,
  ProductQueryParams,
  RenewSubscriptionRequest,
  ServiceConfig,
  SubscriptionQueryParams,
  TenantSubscription,
  UpgradePackageRequest,
  UsageDetail,
  UsageMonitor,
  UsageQueryParams,
} from '#/types/billing';

import {
  createMockResponse,
  mockDelay,
  mockProducts,
  mockServiceConfigs,
  mockSubscriptions,
  mockUsageMonitors,
} from './mock-data-billing';

// ==================== 服务配置 API ====================

/**
 * 获取服务配置列表
 */
export async function getServiceConfigsApi(): Promise<{
  code: number;
  data: ServiceConfig[];
  message: string;
}> {
  await mockDelay();
  return createMockResponse(mockServiceConfigs);
}

/**
 * 更新服务配置
 */
export async function updateServiceConfigApi(
  id: string,
  data: Partial<Omit<ServiceConfig, 'createdAt' | 'id' | 'updatedAt'>>,
): Promise<{
  code: number;
  data: ServiceConfig | undefined;
  message: string;
}> {
  await mockDelay();

  const index = mockServiceConfigs.findIndex((s) => s.id === id);
  if (index !== -1) {
    mockServiceConfigs[index] = {
      ...mockServiceConfigs[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return createMockResponse(mockServiceConfigs[index]);
  }

  return createMockResponse(undefined);
}

// ==================== 产品服务 API ====================

/**
 * 获取产品列表
 */
export async function getProductsApi(params: ProductQueryParams): Promise<{
  code: number;
  data: PaginatedResponse<Product>;
  message: string;
}> {
  await mockDelay();

  let filteredProducts = [...mockProducts];

  // 按服务名称筛选
  if (params.serviceName) {
    const serviceName = params.serviceName.toLowerCase();
    filteredProducts = filteredProducts.filter((p) =>
      p.serviceName.toLowerCase().includes(serviceName),
    );
  }

  // 按版本筛选
  if (params.version) {
    filteredProducts = filteredProducts.filter(
      (p) => p.version === params.version,
    );
  }

  // 按版本说明筛选
  if (params.versionDescription) {
    const desc = params.versionDescription.toLowerCase();
    filteredProducts = filteredProducts.filter((p) =>
      p.versionDescription.toLowerCase().includes(desc),
    );
  }

  // 按状态筛选
  if (params.status) {
    filteredProducts = filteredProducts.filter(
      (p) => p.status === params.status,
    );
  }

  const total = filteredProducts.length;
  const start = (params.page - 1) * params.pageSize;
  const end = start + params.pageSize;
  const items = filteredProducts.slice(start, end);

  return createMockResponse<PaginatedResponse<Product>>({
    items,
    total,
    page: params.page,
    pageSize: params.pageSize,
  });
}

/**
 * 获取产品详情
 */
export async function getProductApi(id: string): Promise<{
  code: number;
  data: Product | undefined;
  message: string;
}> {
  await mockDelay();
  const product = mockProducts.find((p) => p.id === id);
  return createMockResponse(product);
}

/**
 * 创建产品
 */
export async function createProductApi(
  data: Omit<Product, 'createdAt' | 'id' | 'updatedAt'>,
): Promise<{
  code: number;
  data: Product;
  message: string;
}> {
  await mockDelay();

  // 检查是否已存在相同服务名称和版本的产品
  const existing = mockProducts.find(
    (p) => p.serviceName === data.serviceName && p.version === data.version,
  );
  if (existing) {
    throw new Error('该服务名称和版本组合已存在');
  }

  const newProduct: Product = {
    id: String(Date.now()),
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockProducts.push(newProduct);
  return createMockResponse(newProduct);
}

/**
 * 更新产品
 */
export async function updateProductApi(
  id: string,
  data: Partial<Omit<Product, 'createdAt' | 'id' | 'updatedAt'>>,
): Promise<{
  code: number;
  data: Product | undefined;
  message: string;
}> {
  await mockDelay();

  const index = mockProducts.findIndex((p) => p.id === id);
  if (index !== -1) {
    // 检查服务名称和版本组合是否与其他产品冲突
    if (data.serviceName || data.version) {
      const serviceName = data.serviceName || mockProducts[index].serviceName;
      const version = data.version || mockProducts[index].version;
      const conflict = mockProducts.find(
        (p) =>
          p.serviceName === serviceName && p.version === version && p.id !== id,
      );
      if (conflict) {
        throw new Error('该服务名称和版本组合已存在');
      }
    }

    mockProducts[index] = {
      ...mockProducts[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return createMockResponse(mockProducts[index]);
  }

  return createMockResponse(undefined);
}

/**
 * 删除产品
 */
export async function deleteProductApi(id: string): Promise<{
  code: number;
  data: boolean;
  message: string;
}> {
  await mockDelay();

  const index = mockProducts.findIndex((p) => p.id === id);
  if (index !== -1) {
    mockProducts.splice(index, 1);
  }

  return createMockResponse(true);
}

/**
 * 批量删除产品
 */
export async function batchDeleteProductsApi(ids: string[]): Promise<{
  code: number;
  data: boolean;
  message: string;
}> {
  await mockDelay();

  ids.forEach((id) => {
    const index = mockProducts.findIndex((p) => p.id === id);
    if (index !== -1) {
      mockProducts.splice(index, 1);
    }
  });

  return createMockResponse(true);
}

// ==================== 租户订阅 API ====================

/**
 * 获取订阅列表
 */
export async function getSubscriptionsApi(
  params: SubscriptionQueryParams,
): Promise<{
  code: number;
  data: PaginatedResponse<TenantSubscription>;
  message: string;
}> {
  await mockDelay();

  let filteredSubscriptions = [...mockSubscriptions];

  // 按租户名称筛选
  if (params.tenantName) {
    const tenantName = params.tenantName.toLowerCase();
    filteredSubscriptions = filteredSubscriptions.filter((s) =>
      s.tenantName.toLowerCase().includes(tenantName),
    );
  }

  // 按产品名称筛选
  if (params.productName) {
    const productName = params.productName.toLowerCase();
    filteredSubscriptions = filteredSubscriptions.filter((s) =>
      s.productName.toLowerCase().includes(productName),
    );
  }

  // 按状态筛选
  if (params.status) {
    filteredSubscriptions = filteredSubscriptions.filter(
      (s) => s.status === params.status,
    );
  }

  // 按关键词筛选
  if (params.keyword) {
    const keyword = params.keyword.toLowerCase();
    filteredSubscriptions = filteredSubscriptions.filter(
      (s) =>
        s.tenantName.toLowerCase().includes(keyword) ||
        s.productName.toLowerCase().includes(keyword),
    );
  }

  const total = filteredSubscriptions.length;
  const start = (params.page - 1) * params.pageSize;
  const end = start + params.pageSize;
  const items = filteredSubscriptions.slice(start, end);

  return createMockResponse<PaginatedResponse<TenantSubscription>>({
    items,
    total,
    page: params.page,
    pageSize: params.pageSize,
  });
}

/**
 * 获取订阅详情
 */
export async function getSubscriptionApi(id: string): Promise<{
  code: number;
  data: TenantSubscription | undefined;
  message: string;
}> {
  await mockDelay();
  const subscription = mockSubscriptions.find((s) => s.id === id);
  return createMockResponse(subscription);
}

/**
 * 续订订阅
 */
export async function renewSubscriptionApi(
  data: RenewSubscriptionRequest,
): Promise<{
  code: number;
  data: TenantSubscription | undefined;
  message: string;
}> {
  await mockDelay();

  const subscription = mockSubscriptions.find(
    (s) => s.id === data.subscriptionId,
  );

  if (subscription) {
    // 计算新的到期日期
    const currentDate = new Date(subscription.expiryDate);
    currentDate.setMonth(currentDate.getMonth() + data.duration);
    subscription.expiryDate = currentDate.toISOString();
    subscription.status = 'active';
    subscription.updatedAt = new Date().toISOString();

    return createMockResponse(subscription);
  }

  return createMockResponse(undefined);
}

/**
 * 新增订阅
 */
export async function createSubscriptionApi(
  data: CreateSubscriptionRequest,
): Promise<{
  code: number;
  data: TenantSubscription;
  message: string;
}> {
  await mockDelay();

  const product = mockProducts.find((p) => p.id === data.productId);
  if (!product) {
    throw new Error('产品不存在');
  }

  const newSubscription: TenantSubscription = {
    id: `s${Date.now()}`,
    tenantId: data.tenantId,
    tenantName: data.tenantName,
    productId: product.id,
    productName: product.serviceName,
    productVersion: product.version,
    subscribeDate: new Date().toISOString(),
    expiryDate: data.expiryDate,
    quantity: data.quantity,
    status: 'active',
    price: product.price,
    usageLimit: product.usageLimit,
    tokensLimit: product.tokensLimit,
    usedAmount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockSubscriptions.push(newSubscription);

  // 同时创建用量监控记录
  const newUsageMonitor: UsageMonitor = {
    id: `u${Date.now()}`,
    tenantId: data.tenantId,
    tenantName: data.tenantName,
    productId: product.id,
    productName: product.serviceName,
    productVersion: product.version,
    subscriptionId: newSubscription.id,
    usageLimit: product.usageLimit,
    usedAmount: 0,
    remainingAmount: product.usageLimit,
    usagePercentage: 0,
    status: 'normal',
    expiryDate: data.expiryDate,
    lastUpdated: new Date().toISOString(),
  };
  mockUsageMonitors.push(newUsageMonitor);

  return createMockResponse(newSubscription);
}

/**
 * 批量删除订阅
 */
export async function batchDeleteSubscriptionsApi(ids: string[]): Promise<{
  code: number;
  data: boolean;
  message: string;
}> {
  await mockDelay();

  ids.forEach((id) => {
    const index = mockSubscriptions.findIndex((s) => s.id === id);
    if (index !== -1) {
      mockSubscriptions.splice(index, 1);
    }
    // 同时删除用量监控
    const usageIndex = mockUsageMonitors.findIndex(
      (u) => u.subscriptionId === id,
    );
    if (usageIndex !== -1) {
      mockUsageMonitors.splice(usageIndex, 1);
    }
  });

  return createMockResponse(true);
}

// ==================== 用量监控 API ====================

/**
 * 获取用量监控列表
 */
export async function getUsageMonitorsApi(params: UsageQueryParams): Promise<{
  code: number;
  data: PaginatedResponse<UsageMonitor>;
  message: string;
}> {
  await mockDelay();

  let filteredUsage = [...mockUsageMonitors];

  // 按租户名称筛选（精确匹配）
  if (params.tenantName) {
    filteredUsage = filteredUsage.filter(
      (u) => u.tenantName === params.tenantName,
    );
  }

  // 按产品服务筛选（精确匹配）
  if (params.productName) {
    filteredUsage = filteredUsage.filter(
      (u) => u.productName === params.productName,
    );
  }

  // 按状态筛选
  if (params.status) {
    filteredUsage = filteredUsage.filter((u) => u.status === params.status);
  }

  // 按到期日期范围筛选
  if (
    params.expiryDateRange &&
    params.expiryDateRange[0] &&
    params.expiryDateRange[1]
  ) {
    const startDate = new Date(params.expiryDateRange[0]).getTime();
    const endDate = new Date(params.expiryDateRange[1]).getTime();
    filteredUsage = filteredUsage.filter((u) => {
      const expiryDate = new Date(u.expiryDate).getTime();
      return expiryDate >= startDate && expiryDate <= endDate;
    });
  }

  // 按使用率排序
  if (params.sortByUsagePercentage) {
    filteredUsage.sort((a, b) => {
      return params.sortByUsagePercentage === 'asc'
        ? a.usagePercentage - b.usagePercentage
        : b.usagePercentage - a.usagePercentage;
    });
  }

  // 按到期日期排序
  if (params.sortByExpiryDate) {
    filteredUsage.sort((a, b) => {
      const dateA = new Date(a.expiryDate).getTime();
      const dateB = new Date(b.expiryDate).getTime();
      return params.sortByExpiryDate === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }

  const total = filteredUsage.length;
  const start = (params.page - 1) * params.pageSize;
  const end = start + params.pageSize;
  const items = filteredUsage.slice(start, end);

  return createMockResponse<PaginatedResponse<UsageMonitor>>({
    items,
    total,
    page: params.page,
    pageSize: params.pageSize,
  });
}

/**
 * 获取用量详情
 */
export async function getUsageDetailApi(subscriptionId: string): Promise<{
  code: number;
  data: undefined | UsageDetail;
  message: string;
}> {
  await mockDelay();

  const usage = mockUsageMonitors.find(
    (u) => u.subscriptionId === subscriptionId,
  );
  const subscription = mockSubscriptions.find((s) => s.id === subscriptionId);

  if (usage && subscription) {
    // 生成使用历史
    const usageHistory = [
      { date: '2025-12-01', amount: 120, description: '月初统计' },
      { date: '2025-12-10', amount: 280, description: '中期使用' },
      { date: '2025-12-20', amount: 450, description: '近期统计' },
      { date: '2025-12-23', amount: usage.usedAmount, description: '当前使用' },
    ];

    const detail: UsageDetail = {
      subscriptionId,
      tenantName: usage.tenantName,
      productName: usage.productName,
      productVersion: usage.productVersion,
      usageLimit: usage.usageLimit,
      usedAmount: usage.usedAmount,
      remainingAmount: usage.remainingAmount,
      usagePercentage: usage.usagePercentage,
      status: usage.status,
      subscribeDate: subscription.subscribeDate,
      expiryDate: subscription.expiryDate,
      usageHistory,
    };

    return createMockResponse(detail);
  }

  return createMockResponse(undefined);
}

/**
 * 升级套餐
 */
export async function upgradePackageApi(data: UpgradePackageRequest): Promise<{
  code: number;
  data: TenantSubscription | undefined;
  message: string;
}> {
  await mockDelay();

  const subscription = mockSubscriptions.find(
    (s) => s.id === data.subscriptionId,
  );
  const targetProduct = mockProducts.find((p) => p.id === data.targetProductId);

  if (subscription && targetProduct) {
    // 更新订阅信息
    subscription.productId = targetProduct.id;
    subscription.productName = targetProduct.serviceName;
    subscription.productVersion = targetProduct.version;
    subscription.price = targetProduct.price;
    subscription.usageLimit = targetProduct.usageLimit;
    subscription.updatedAt = new Date().toISOString();

    // 同步更新用量监控
    const usage = mockUsageMonitors.find(
      (u) => u.subscriptionId === data.subscriptionId,
    );
    if (usage) {
      usage.productId = targetProduct.id;
      usage.productName = targetProduct.serviceName;
      usage.productVersion = targetProduct.version;
      usage.usageLimit = targetProduct.usageLimit;
      usage.remainingAmount = targetProduct.usageLimit - usage.usedAmount;
      usage.usagePercentage =
        (usage.usedAmount / targetProduct.usageLimit) * 100;
      usage.status = calculateUsageStatus(usage.usagePercentage);
      usage.lastUpdated = new Date().toISOString();
    }

    return createMockResponse(subscription);
  }

  return createMockResponse(undefined);
}

// ==================== 辅助函数 ====================

/**
 * 计算用量状态
 */
function calculateUsageStatus(
  percentage: number,
): 'exceeded' | 'normal' | 'warning' {
  if (percentage >= 100) {
    return 'exceeded';
  }
  if (percentage >= 80) {
    return 'warning';
  }
  return 'normal';
}
