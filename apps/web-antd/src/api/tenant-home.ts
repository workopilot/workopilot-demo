/**
 * 租户管理首页 API
 */

import type { TenantHomeData } from '#/types/tenant-home';

import { createMockResponse, mockDelay } from './mock-data';

// Mock 数据
const mockTenantHomeData: TenantHomeData = {
  overview: {
    tenantId: '1',
    tenantName: '深圳科创集团',
    totalCalls: 125_680,
    todayCalls: 1234,
    activeModels: 5,
    serviceHealth: 98,
    expiryDate: '2025-12-31',
    packageType: '专业版',
  },
  quickActions: [
    {
      id: '1',
      title: '企业信息',
      description: '管理企业信息',
      icon: 'lucide:building-2',
      color: '#1fdaca',
      route: '/tenant/info',
    },
    {
      id: '2',
      title: '组织架构',
      description: '管理组织架构',
      icon: 'lucide:sitemap',
      color: '#bf0c2c',
      route: '/tenant/org',
    },
    {
      id: '3',
      title: '用户管理',
      description: '管理系统用户',
      icon: 'lucide:users',
      color: '#e18525',
      route: '/tenant/users',
    },
    {
      id: '4',
      title: '源系统配置',
      description: '配置源系统',
      icon: 'lucide:database',
      color: '#3fb27f',
      route: '/audit/sources',
    },
    {
      id: '5',
      title: '模型管理',
      description: '管理AI模型',
      icon: 'lucide:cpu',
      color: '#00d8ff',
      route: '/audit/models',
    },
  ],
  serviceStatus: [
    {
      id: '1',
      name: '智能填报',
      status: 'normal',
      todayCalls: 345,
      totalCalls: 12_450,
      successRate: 99.2,
      avgResponseTime: 120,
      route: '/filling/scripts',
      logo: `${import.meta.env.BASE_URL}demo/tianbao.png`,
      logoColor: '#10b981',
      logoBgColor: '#ecfdf5',
    },
    {
      id: '2',
      name: '智能审核',
      status: 'normal',
      todayCalls: 567,
      totalCalls: 23_450,
      successRate: 98.5,
      avgResponseTime: 150,
      route: '/audit/policy',
      logo: `${import.meta.env.BASE_URL}demo/shenhe.png`,
      logoColor: '#3b82f6',
      logoBgColor: '#eff6ff',
    },
    {
      id: '3',
      name: '附件分类',
      status: 'normal',
      todayCalls: 89,
      totalCalls: 3450,
      successRate: 99.5,
      avgResponseTime: 80,
      route: '/audit/settings',
      logo: `${import.meta.env.BASE_URL}demo/fenlei.png`,
      logoColor: '#f59e0b',
      logoBgColor: '#fffbeb',
    },
  ],
  serviceUsage: {
    total: 10_000,
    data: [
      { name: '智能填报', value: 3450, percentage: 34.5 },
      { name: '智能审核', value: 5670, percentage: 56.7 },
      { name: '附件分类', value: 890, percentage: 8.9 },
    ],
  },
  modelUsage: {
    timeRange: 'week',
    data: [
      {
        modelName: 'GPT-4',
        modelVendor: 'OpenAI',
        totalCalls: 5670,
        data: [
          { time: '周一', modelName: 'GPT-4', calls: 810 },
          { time: '周二', modelName: 'GPT-4', calls: 850 },
          { time: '周三', modelName: 'GPT-4', calls: 780 },
          { time: '周四', modelName: 'GPT-4', calls: 920 },
          { time: '周五', modelName: 'GPT-4', calls: 890 },
          { time: '周六', modelName: 'GPT-4', calls: 720 },
          { time: '周日', modelName: 'GPT-4', calls: 700 },
        ],
      },
      {
        modelName: '文心一言',
        modelVendor: '百度',
        totalCalls: 3450,
        data: [
          { time: '周一', modelName: '文心一言', calls: 490 },
          { time: '周二', modelName: '文心一言', calls: 520 },
          { time: '周三', modelName: '文心一言', calls: 480 },
          { time: '周四', modelName: '文心一言', calls: 550 },
          { time: '周五', modelName: '文心一言', calls: 530 },
          { time: '周六', modelName: '文心一言', calls: 440 },
          { time: '周日', modelName: '文心一言', calls: 440 },
        ],
      },
      {
        modelName: '通义千问',
        modelVendor: '阿里',
        totalCalls: 2340,
        data: [
          { time: '周一', modelName: '通义千问', calls: 330 },
          { time: '周二', modelName: '通义千问', calls: 350 },
          { time: '周三', modelName: '通义千问', calls: 320 },
          { time: '周四', modelName: '通义千问', calls: 380 },
          { time: '周五', modelName: '通义千问', calls: 360 },
          { time: '周六', modelName: '通义千问', calls: 300 },
          { time: '周日', modelName: '通义千问', calls: 300 },
        ],
      },
    ],
  },
};

/**
 * 获取租户管理首页数据
 */
export async function getTenantHomeDataApi(): Promise<
  ReturnType<typeof createMockResponse<TenantHomeData>>
> {
  await mockDelay();
  return createMockResponse(mockTenantHomeData);
}

/**
 * 刷新服务监控状态
 */
export async function refreshServiceStatusApi(): Promise<
  ReturnType<typeof createMockResponse<TenantHomeData>>
> {
  await mockDelay(500);
  // 模拟刷新服务状态
  return createMockResponse(mockTenantHomeData);
}

/**
 * 获取模型运行状态
 */
export async function getModelStatusApi(): Promise<
  ReturnType<typeof createMockResponse<TenantHomeData>>
> {
  await mockDelay();
  return createMockResponse(mockTenantHomeData);
}

/**
 * 获取使用趋势数据
 * @param _period - 时间周期: week | month | quarter
 */
export async function getUsageTrendApi(
  _period: 'month' | 'quarter' | 'week' = 'week',
): Promise<ReturnType<typeof createMockResponse<TenantHomeData>>> {
  await mockDelay();
  return createMockResponse(mockTenantHomeData);
}
