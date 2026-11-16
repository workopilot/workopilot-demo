/**
 * 租户管理相关 API
 */

import type {
  PaginatedResponse,
  Tenant,
  TenantAdmin,
  TenantQueryParams,
} from '#/types/tenant';

// ==================== Mock 数据 ====================

export const mockTenants: Tenant[] = [
  {
    id: '1',
    name: '深圳科创集团',
    code: 'SZKC001',
    industry: 'technology',
    size: 'enterprise',
    contact: '张经理',
    phone: '0755-88888888',
    email: 'zhang@szkc.com',
    address: '深圳市南山区科技园',
    status: 'active',
    expiryDate: '2025-12-31T23:59:59.000Z',
    subscriptionCount: 5,
    createdAt: '2024-01-15T10:30:00.000Z',
    updatedAt: '2024-12-20T14:25:00.000Z',
  },
  {
    id: '2',
    name: '上海金融服务中心',
    code: 'SHJR002',
    industry: 'finance',
    size: 'large',
    contact: '李主任',
    phone: '021-66666666',
    email: 'li@shjr.com',
    address: '上海市浦东新区陆家嘴',
    status: 'active',
    expiryDate: '2025-06-30T23:59:59.000Z',
    subscriptionCount: 3,
    createdAt: '2024-02-20T09:15:00.000Z',
    updatedAt: '2024-12-18T16:40:00.000Z',
  },
  {
    id: '3',
    name: '北京制造有限公司',
    code: 'BJZZ003',
    industry: 'manufacturing',
    size: 'medium',
    contact: '王总监',
    phone: '010-55555555',
    email: 'wang@bjzz.com',
    address: '北京市朝阳区工业园',
    status: 'active',
    expiryDate: '2025-09-30T23:59:59.000Z',
    subscriptionCount: 2,
    createdAt: '2024-03-10T11:20:00.000Z',
    updatedAt: '2024-12-19T10:15:00.000Z',
  },
  {
    id: '4',
    name: '广州医疗科技',
    code: 'GZYK004',
    industry: 'healthcare',
    size: 'small',
    contact: '赵医师',
    phone: '020-44444444',
    email: 'zhao@gzyk.com',
    address: '广州市天河区科学城',
    status: 'active',
    expiryDate: '2025-03-31T23:59:59.000Z',
    subscriptionCount: 1,
    createdAt: '2024-04-05T14:50:00.000Z',
    updatedAt: '2024-12-15T09:30:00.000Z',
  },
  {
    id: '5',
    name: '杭州零售连锁',
    code: 'HZLS005',
    industry: 'retail',
    size: 'large',
    contact: '刘店长',
    phone: '0571-33333333',
    email: 'liu@hzls.com',
    address: '杭州市西湖区商业街',
    status: 'disabled',
    expiryDate: '2024-11-30T23:59:59.000Z',
    subscriptionCount: 0,
    createdAt: '2024-05-12T08:40:00.000Z',
    updatedAt: '2024-11-20T13:20:00.000Z',
  },
  {
    id: '6',
    name: '成都政府部门',
    code: 'CDZF006',
    industry: 'government',
    size: 'enterprise',
    contact: '陈科长',
    phone: '028-22222222',
    email: 'chen@cdzf.com',
    address: '成都市武侯区政务中心',
    status: 'active',
    expiryDate: '2025-12-31T23:59:59.000Z',
    subscriptionCount: 4,
    createdAt: '2024-06-18T15:25:00.000Z',
    updatedAt: '2024-12-22T11:45:00.000Z',
  },
  {
    id: '7',
    name: '武汉软件园',
    code: 'WHRJ007',
    industry: 'technology',
    size: 'medium',
    contact: '周工程师',
    phone: '027-11111111',
    email: 'zhou@whrj.com',
    address: '武汉市东湖高新区',
    status: 'active',
    expiryDate: '2025-08-31T23:59:59.000Z',
    subscriptionCount: 2,
    createdAt: '2024-07-22T10:10:00.000Z',
    updatedAt: '2024-12-17T15:50:00.000Z',
  },
  {
    id: '8',
    name: '西安重工集团',
    code: 'XAZG008',
    industry: 'manufacturing',
    size: 'enterprise',
    contact: '吴董事长',
    phone: '029-99999999',
    email: 'wu@xazg.com',
    address: '西安市雁塔区高新区',
    status: 'expired',
    expiryDate: '2024-10-31T23:59:59.000Z',
    subscriptionCount: 0,
    createdAt: '2024-08-30T13:35:00.000Z',
    updatedAt: '2024-10-15T09:20:00.000Z',
  },
];

// 模拟延迟
export function mockDelay(ms: number = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 生成统一响应格式
export function createMockResponse<T>(data: T) {
  return {
    code: 0,
    data,
    message: 'success',
  };
}

// ==================== API 函数 ====================

/**
 * 获取租户列表
 */
export async function getTenantsApi(params: TenantQueryParams): Promise<{
  code: number;
  data: PaginatedResponse<Tenant>;
  message: string;
}> {
  await mockDelay();

  let filteredTenants = [...mockTenants];

  // 按租户编号筛选
  if (params.code) {
    const code = params.code.toLowerCase();
    filteredTenants = filteredTenants.filter((t) =>
      t.code.toLowerCase().includes(code),
    );
  }

  // 按租户名称筛选
  if (params.name) {
    const name = params.name.toLowerCase();
    filteredTenants = filteredTenants.filter((t) =>
      t.name.toLowerCase().includes(name),
    );
  }

  // 按联系人筛选
  if (params.contact) {
    const contact = params.contact.toLowerCase();
    filteredTenants = filteredTenants.filter((t) =>
      t.contact.toLowerCase().includes(contact),
    );
  }

  // 按状态筛选
  if (params.status) {
    filteredTenants = filteredTenants.filter((t) => t.status === params.status);
  }

  const total = filteredTenants.length;
  const start = (params.page - 1) * params.pageSize;
  const end = start + params.pageSize;
  const items = filteredTenants.slice(start, end);

  return createMockResponse<PaginatedResponse<Tenant>>({
    items,
    total,
    page: params.page,
    pageSize: params.pageSize,
  });
}

/**
 * 获取租户详情
 */
export async function getTenantApi(id: string): Promise<{
  code: number;
  data: Tenant | undefined;
  message: string;
}> {
  await mockDelay();
  const tenant = mockTenants.find((t) => t.id === id);
  return createMockResponse(tenant);
}

/**
 * 创建租户
 */
export async function createTenantApi(
  data: Omit<Tenant, 'createdAt' | 'id' | 'updatedAt'>,
): Promise<{
  code: number;
  data: Tenant;
  message: string;
}> {
  await mockDelay();

  // 检查租户编码是否已存在
  const existing = mockTenants.find((t) => t.code === data.code);
  if (existing) {
    throw new Error('租户编码已存在');
  }

  const newTenant: Tenant = {
    id: String(Date.now()),
    ...data,
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
  data: Partial<Omit<Tenant, 'createdAt' | 'id' | 'updatedAt'>>,
): Promise<{
  code: number;
  data: Tenant | undefined;
  message: string;
}> {
  await mockDelay();

  const index = mockTenants.findIndex((t) => t.id === id);
  if (index !== -1) {
    // 检查租户编码是否与其他租户冲突
    if (data.code) {
      const conflict = mockTenants.find(
        (t) => t.code === data.code && t.id !== id,
      );
      if (conflict) {
        throw new Error('租户编码已存在');
      }
    }

    mockTenants[index] = {
      ...mockTenants[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return createMockResponse(mockTenants[index]);
  }

  return createMockResponse(undefined);
}

/**
 * 删除租户
 */
export async function deleteTenantApi(id: string): Promise<{
  code: number;
  data: boolean;
  message: string;
}> {
  await mockDelay();

  const index = mockTenants.findIndex((t) => t.id === id);
  if (index !== -1) {
    mockTenants.splice(index, 1);
  }

  return createMockResponse(true);
}

/**
 * 批量删除租户
 */
export async function batchDeleteTenantsApi(ids: string[]): Promise<{
  code: number;
  data: boolean;
  message: string;
}> {
  await mockDelay();

  ids.forEach((id) => {
    const index = mockTenants.findIndex((t) => t.id === id);
    if (index !== -1) {
      mockTenants.splice(index, 1);
    }
  });

  return createMockResponse(true);
}

// ==================== 导出映射函数 ====================

export {
  TenantIndustryMap,
  TenantSizeMap,
  TenantStatusMap,
} from '#/types/tenant';

// ==================== 管理员 Mock 数据 ====================

export const mockTenantAdmins: TenantAdmin[] = [
  // 深圳科创集团的管理员
  {
    id: 'admin-1',
    tenantId: '1',
    tenantName: '深圳科创集团',
    username: 'szkc_admin',
    realName: '张伟',
    phone: '13800138001',
    email: 'zhangwei@szkc.com',
    role: 'super_admin',
    status: 'active',
    lastLoginTime: '2025-01-08T09:30:00.000Z',
    createdAt: '2024-01-15T10:30:00.000Z',
    updatedAt: '2025-01-08T09:30:00.000Z',
  },
  {
    id: 'admin-2',
    tenantId: '1',
    tenantName: '深圳科创集团',
    username: 'szkc_operator',
    realName: '李娜',
    phone: '13800138002',
    email: 'lina@szkc.com',
    role: 'operator',
    status: 'active',
    lastLoginTime: '2025-01-07T14:20:00.000Z',
    createdAt: '2024-02-10T11:00:00.000Z',
    updatedAt: '2025-01-07T14:20:00.000Z',
  },
  // 上海金融服务中心的管理员
  {
    id: 'admin-3',
    tenantId: '2',
    tenantName: '上海金融服务中心',
    username: 'shjr_admin',
    realName: '王强',
    phone: '13800138003',
    email: 'wangqiang@shjr.com',
    role: 'super_admin',
    status: 'active',
    lastLoginTime: '2025-01-08T08:45:00.000Z',
    createdAt: '2024-02-20T09:15:00.000Z',
    updatedAt: '2025-01-08T08:45:00.000Z',
  },
  {
    id: 'admin-4',
    tenantId: '2',
    tenantName: '上海金融服务中心',
    username: 'shjr_op_01',
    realName: '刘洋',
    phone: '13800138004',
    email: 'liuyang@shjr.com',
    role: 'admin',
    status: 'active',
    lastLoginTime: '2025-01-06T16:30:00.000Z',
    createdAt: '2024-03-15T13:20:00.000Z',
    updatedAt: '2025-01-06T16:30:00.000Z',
  },
  // 北京制造有限公司的管理员
  {
    id: 'admin-5',
    tenantId: '3',
    tenantName: '北京制造有限公司',
    username: 'bjzz_admin',
    realName: '陈明',
    phone: '13800138005',
    email: 'chenming@bjzz.com',
    role: 'super_admin',
    status: 'active',
    lastLoginTime: '2025-01-08T10:15:00.000Z',
    createdAt: '2024-03-10T11:20:00.000Z',
    updatedAt: '2025-01-08T10:15:00.000Z',
  },
  // 广州医疗科技的管理员
  {
    id: 'admin-6',
    tenantId: '4',
    tenantName: '广州医疗科技',
    username: 'gzyk_admin',
    realName: '赵丽',
    phone: '13800138006',
    email: 'zhaoli@gzyk.com',
    role: 'super_admin',
    status: 'active',
    lastLoginTime: '2025-01-05T11:50:00.000Z',
    createdAt: '2024-04-05T14:50:00.000Z',
    updatedAt: '2025-01-05T11:50:00.000Z',
  },
  {
    id: 'admin-7',
    tenantId: '4',
    tenantName: '广州医疗科技',
    username: 'gzyk_op',
    realName: '孙杰',
    phone: '13800138007',
    email: 'sunjie@gzyk.com',
    role: 'operator',
    status: 'disabled',
    lastLoginTime: '2024-12-20T09:10:00.000Z',
    createdAt: '2024-05-10T10:00:00.000Z',
    updatedAt: '2024-12-20T15:30:00.000Z',
  },
  // 杭州零售连锁的管理员
  {
    id: 'admin-8',
    tenantId: '5',
    tenantName: '杭州零售连锁',
    username: 'hzls_admin',
    realName: '周婷',
    phone: '13800138008',
    email: 'zhouting@hzls.com',
    role: 'super_admin',
    status: 'disabled',
    lastLoginTime: '2024-11-15T14:20:00.000Z',
    createdAt: '2024-05-12T08:40:00.000Z',
    updatedAt: '2024-11-20T13:20:00.000Z',
  },
  // 成都政府部门的管理员
  {
    id: 'admin-9',
    tenantId: '6',
    tenantName: '成都政府部门',
    username: 'cdzf_admin',
    realName: '吴刚',
    phone: '13800138009',
    email: 'wugang@cdzf.com',
    role: 'super_admin',
    status: 'active',
    lastLoginTime: '2025-01-08T07:50:00.000Z',
    createdAt: '2024-06-18T15:25:00.000Z',
    updatedAt: '2025-01-08T07:50:00.000Z',
  },
  {
    id: 'admin-10',
    tenantId: '6',
    tenantName: '成都政府部门',
    username: 'cdzf_op_01',
    realName: '郑华',
    phone: '13800138010',
    email: 'zhenghua@cdzf.com',
    role: 'admin',
    status: 'active',
    lastLoginTime: '2025-01-07T13:40:00.000Z',
    createdAt: '2024-07-05T09:30:00.000Z',
    updatedAt: '2025-01-07T13:40:00.000Z',
  },
  {
    id: 'admin-11',
    tenantId: '6',
    tenantName: '成都政府部门',
    username: 'cdzf_op_02',
    realName: '冯敏',
    phone: '13800138011',
    email: 'fengmin@cdzf.com',
    role: 'operator',
    status: 'active',
    lastLoginTime: '2025-01-06T10:20:00.000Z',
    createdAt: '2024-07-20T11:15:00.000Z',
    updatedAt: '2025-01-06T10:20:00.000Z',
  },
  // 武汉软件园的管理员
  {
    id: 'admin-12',
    tenantId: '7',
    tenantName: '武汉软件园',
    username: 'whrj_admin',
    realName: '袁浩',
    phone: '13800138012',
    email: 'yuanhao@whrj.com',
    role: 'super_admin',
    status: 'active',
    lastLoginTime: '2025-01-08T11:25:00.000Z',
    createdAt: '2024-07-22T10:10:00.000Z',
    updatedAt: '2025-01-08T11:25:00.000Z',
  },
  // 西安重工集团的管理员
  {
    id: 'admin-13',
    tenantId: '8',
    tenantName: '西安重工集团',
    username: 'xazg_admin',
    realName: '邓涛',
    phone: '13800138013',
    email: 'dengtao@xazg.com',
    role: 'super_admin',
    status: 'locked',
    lastLoginTime: '2024-10-10T08:30:00.000Z',
    createdAt: '2024-08-30T13:35:00.000Z',
    updatedAt: '2024-10-15T09:20:00.000Z',
  },
];

// ==================== 管理员 API 函数 ====================

/**
 * 获取租户管理员列表
 */
export async function getTenantAdminsApi(tenantId: string): Promise<{
  code: number;
  data: TenantAdmin[];
  message: string;
}> {
  await mockDelay();

  const admins = mockTenantAdmins.filter((a) => a.tenantId === tenantId);
  return createMockResponse(admins);
}
