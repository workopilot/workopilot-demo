import type {
  BillType,
  ExpenseCategory,
  FieldExtractionRule,
  PluginGlobalConfig,
  Role,
  SourceSystem,
} from '#/types/settings';

import {
  createMockResponse,
  mockAdmins,
  mockBillTypes,
  mockBillTypesTree,
  mockConnectionTest,
  mockDelay,
  mockExpenseCategories,
  mockPermissionsTree,
  mockPluginConfig,
  mockRoles,
  mockSourceSystems,
} from './mock-data';

/**
 * 业务系统相关API
 */

// 获取业务系统列表
export async function getSourceSystemsApi() {
  // 使用前端Mock数据
  await mockDelay();
  return createMockResponse(mockSourceSystems);
}

// 新增业务系统
export async function createSourceSystemApi(data: Partial<SourceSystem>) {
  await mockDelay();
  const newSystem: SourceSystem = {
    id: String(Date.now()),
    name: data.name || '',
    code: data.code || '',
    vendor: data.vendor || 'Custom',
    baseUrl: data.baseUrl || '',
    authConfig: data.authConfig || {
      type: 'Basic',
      username: '',
      password: '',
    },
    status: data.status || 'enabled',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockSourceSystems.push(newSystem);
  return createMockResponse(newSystem);
}

// 更新业务系统
export async function updateSourceSystemApi(
  id: string,
  data: Partial<SourceSystem>,
) {
  await mockDelay();
  const index = mockSourceSystems.findIndex((s) => s.id === id);
  if (index !== -1) {
    mockSourceSystems[index] = {
      ...mockSourceSystems[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return createMockResponse(mockSourceSystems[index]);
  }
  throw new Error('系统不存在');
}

// 删除业务系统
export async function deleteSourceSystemApi(id: string) {
  await mockDelay();
  const index = mockSourceSystems.findIndex((s) => s.id === id);
  if (index !== -1) {
    mockSourceSystems.splice(index, 1);
  }
  return createMockResponse(undefined);
}

// 连接测试
export async function testConnectionApi(id: string) {
  await mockDelay();
  return createMockResponse(mockConnectionTest(id));
}

// 更新审核策略配置
export async function updateSourceSystemAuditPolicyApi(
  id: string,
  auditPolicy: any,
) {
  await mockDelay();
  const index = mockSourceSystems.findIndex((s) => s.id === id);
  if (index !== -1) {
    mockSourceSystems[index].auditPolicy = auditPolicy;
    mockSourceSystems[index].updatedAt = new Date().toISOString();
    return createMockResponse(mockSourceSystems[index]);
  }
  throw new Error('系统不存在');
}

/**
 * 单据类型相关API
 */

// 获取单据类型树形列表
export async function getBillTypesTreeApi() {
  await mockDelay();
  return createMockResponse(mockBillTypesTree);
}

// 获取单据类型详情
export async function getBillTypeDetailApi(id: string) {
  await mockDelay();
  const billType = mockBillTypes.find((b) => b.id === id);
  if (!billType) {
    throw new Error('单据类型不存在');
  }
  return createMockResponse(billType);
}

// 新增单据类型
export async function createBillTypeApi(data: Partial<BillType>) {
  await mockDelay();
  const newBillType: BillType = {
    id: String(Date.now()),
    code: data.code || '',
    name: data.name || '',
    systemId: data.systemId || '',
    systemName: data.systemName || '',
    description: data.description,
    enabled: data.enabled ?? true,
    urlRegex: data.urlRegex || '',
    extractionRules: data.extractionRules || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockBillTypes.push(newBillType);
  return createMockResponse(newBillType);
}

// 更新单据类型基本信息
export async function updateBillTypeApi(id: string, data: Partial<BillType>) {
  await mockDelay();
  const index = mockBillTypes.findIndex((b) => b.id === id);
  if (index !== -1) {
    mockBillTypes[index] = {
      ...mockBillTypes[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return createMockResponse(mockBillTypes[index]);
  }
  throw new Error('单据类型不存在');
}

// 删除单据类型
export async function deleteBillTypeApi(id: string) {
  await mockDelay();
  const index = mockBillTypes.findIndex((b) => b.id === id);
  if (index !== -1) {
    mockBillTypes.splice(index, 1);
  }
  return createMockResponse(undefined);
}

// 获取单据类型的字段提取规则
export async function getExtractionRulesApi(billTypeId: string) {
  await mockDelay();
  const billType = mockBillTypes.find((b) => b.id === billTypeId);
  if (!billType) {
    throw new Error('单据类型不存在');
  }
  return createMockResponse(billType.extractionRules);
}

// 更新单据类型的字段提取规则
export async function updateExtractionRulesApi(
  billTypeId: string,
  rules: FieldExtractionRule[],
) {
  await mockDelay();
  const index = mockBillTypes.findIndex((b) => b.id === billTypeId);
  if (index !== -1) {
    mockBillTypes[index].extractionRules = rules;
    mockBillTypes[index].updatedAt = new Date().toISOString();
    return createMockResponse(rules);
  }
  throw new Error('单据类型不存在');
}

/**
 * 费用科目相关API
 */

// 获取费用科目树形列表
export async function getExpenseCategoriesApi() {
  await mockDelay();
  return createMockResponse(mockExpenseCategories);
}

// 新增费用科目
export async function createExpenseCategoryApi(data: Partial<ExpenseCategory>) {
  await mockDelay();
  const newCategory: ExpenseCategory = {
    id: String(Date.now()),
    code: data.code || '',
    name: data.name || '',
    parentId: data.parentId,
    system: data.system || '',
    aliases: data.aliases || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  // 简化处理:直接添加到根级
  mockExpenseCategories.push(newCategory);
  return createMockResponse(newCategory);
}

// 更新费用科目
export async function updateExpenseCategoryApi(
  id: string,
  data: Partial<ExpenseCategory>,
) {
  await mockDelay();
  // 递归查找并更新
  function updateInTree(categories: ExpenseCategory[]): boolean {
    for (let i = 0; i < categories.length; i++) {
      if (categories[i].id === id) {
        categories[i] = {
          ...categories[i],
          ...data,
          updatedAt: new Date().toISOString(),
        };
        return true;
      }
      if (categories[i].children && updateInTree(categories[i].children)) {
        return true;
      }
    }
    return false;
  }
  updateInTree(mockExpenseCategories);
  return createMockResponse(data as ExpenseCategory);
}

// 删除费用科目
export async function deleteExpenseCategoryApi(id: string) {
  await mockDelay();
  // 递归查找并删除
  function deleteInTree(categories: ExpenseCategory[]): boolean {
    for (let i = 0; i < categories.length; i++) {
      if (categories[i].id === id) {
        categories.splice(i, 1);
        return true;
      }
      if (categories[i].children && deleteInTree(categories[i].children)) {
        return true;
      }
    }
    return false;
  }
  deleteInTree(mockExpenseCategories);
  return createMockResponse(undefined);
}

// 更新费用科目别名
export async function updateCategoryAliasesApi(id: string, aliases: string[]) {
  await mockDelay();
  // 递归查找并更新别名
  function updateAliasesInTree(
    categories: ExpenseCategory[],
  ): ExpenseCategory | null {
    for (const category of categories) {
      if (category.id === id) {
        category.aliases = aliases;
        category.updatedAt = new Date().toISOString();
        return category;
      }
      if (category.children) {
        const result = updateAliasesInTree(category.children);
        if (result) return result;
      }
    }
    return null;
  }
  const updated = updateAliasesInTree(mockExpenseCategories);
  if (!updated) {
    throw new Error('费用科目不存在');
  }
  return createMockResponse(updated);
}

/**
 * 插件全局设置相关API
 */

// 获取插件全局配置
export async function getPluginConfigApi() {
  await mockDelay();
  return createMockResponse(mockPluginConfig);
}

// 更新插件全局配置
export async function updatePluginConfigApi(config: PluginGlobalConfig) {
  await mockDelay();
  Object.assign(mockPluginConfig, config);
  return createMockResponse(mockPluginConfig);
}

/**
 * 安全与权限相关API
 */

// 获取管理员列表
export async function getAdminsApi() {
  await mockDelay();
  return createMockResponse(mockAdmins);
}

// 获取角色列表
export async function getRolesApi(params?: any) {
  await mockDelay();
  let filteredRoles = [...mockRoles];

  // 过滤逻辑
  if (params) {
    if (params.roleName) {
      filteredRoles = filteredRoles.filter((role) =>
        role.name.toLowerCase().includes(params.roleName.toLowerCase()),
      );
    }
    if (params.permissionKey) {
      filteredRoles = filteredRoles.filter((role) =>
        role.permissionKey
          .toLowerCase()
          .includes(params.permissionKey.toLowerCase()),
      );
    }
    if (params.status) {
      filteredRoles = filteredRoles.filter(
        (role) => role.status === params.status,
      );
    }
  }

  return createMockResponse(filteredRoles);
}

// 新增角色
export async function createRoleApi(data: Partial<Role>) {
  await mockDelay();
  const newRole: Role = {
    id: String(Date.now()),
    name: data.name || '',
    permissionKey: data.permissionKey || '',
    dataPermission: data.dataPermission || 'all',
    sort: data.sort || 0,
    status: data.status || 'enabled',
    description: data.description,
    permissions: data.permissions || [],
    adminCount: 0,
    isSystem: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockRoles.push(newRole);
  return createMockResponse(newRole);
}

// 更新角色
export async function updateRoleApi(id: string, data: Partial<Role>) {
  await mockDelay();
  const index = mockRoles.findIndex((r) => r.id === id);
  if (index !== -1) {
    mockRoles[index] = {
      ...mockRoles[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return createMockResponse(mockRoles[index]);
  }
  throw new Error('角色不存在');
}

// 删除角色
export async function deleteRoleApi(id: string) {
  await mockDelay();
  const index = mockRoles.findIndex((r) => r.id === id);
  if (index !== -1) {
    mockRoles.splice(index, 1);
  }
  return createMockResponse(undefined);
}

// 获取权限配置树
export async function getPermissionsApi() {
  await mockDelay();
  return createMockResponse(mockPermissionsTree);
}
