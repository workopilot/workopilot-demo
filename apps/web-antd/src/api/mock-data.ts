/**
 * 前端Mock数据
 * 直接在前端定义所有Mock数据,无需后端Mock服务器
 */

import type {
  AiApiKey,
  AiApiKeyLog,
  AiModel,
  AiServiceDef,
  AiTool,
  ApiKeyDef,
} from '#/types/aiservice';
import type { ModelCallLog } from '#/types/model-logs';
import type {
  Admin,
  BillType,
  BillTypeTreeNode,
  ConnectionTestResult,
  ExpenseCategory,
  Permission,
  PermissionTreeNode,
  PluginGlobalConfig,
  Role,
  SourceSystem,
} from '#/types/settings';
/**
 * 租户首页Mock数据
 */
import type { TenantHomeData } from '#/types/tenant-home';

/**
 * 业务系统Mock数据
 */
export const mockSourceSystems: SourceSystem[] = [
  {
    id: '1',
    name: 'SAP Fiori',
    code: 'sap_fiori_hq',
    vendor: 'SAP',
    baseUrl: 'https://fiori.sap.com',
    authConfig: {
      type: 'OAuth',
      clientId: 'fiori_client_123',
      clientSecret: '***********',
      tokenUrl: 'https://auth.sap.com/oauth/token',
    },
    status: 'enabled',
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z',
  },
  {
    id: '2',
    name: '用友 U8',
    code: 'yonyou_u8',
    vendor: 'Yonyou',
    baseUrl: 'https://u8.yonyou.com/api',
    authConfig: {
      type: 'Basic',
      username: 'admin',
      password: '***********',
    },
    status: 'enabled',
    createdAt: '2024-01-16T09:30:00Z',
    updatedAt: '2024-01-16T09:30:00Z',
  },
  {
    id: '3',
    name: '金蝶 K3',
    code: 'kingdee_k3',
    vendor: 'Kingdee',
    baseUrl: 'https://k3.kingdee.com/api',
    authConfig: {
      type: 'Basic',
      username: 'k3admin',
      password: '***********',
    },
    status: 'disabled',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
  },
];

/**
 * 单据类型Mock数据
 */
export const mockBillTypes: BillType[] = [
  {
    id: '1',
    code: 'TRAVEL_001',
    name: '差旅报销单',
    systemId: '1',
    systemName: 'SAP Fiori',
    description: '员工出差产生的交通、住宿、餐饮等费用报销',
    enabled: true,
    urlRegex: String.raw`^https://fiori\.sap\.com/expense/travel/.*`,
    extractionRules: [
      {
        id: 'r1',
        fieldKey: 'billNo',
        fieldDesc: '单据号',
        required: true,
        strategies: [
          { type: 'XPATH', selector: '//input[@id="billNo"]/@value' },
          { type: 'CSS', selector: '#billNo' },
        ],
      },
      {
        id: 'r2',
        fieldKey: 'applicant',
        fieldDesc: '申请人',
        required: true,
        strategies: [{ type: 'CSS', selector: '.applicant-name' }],
      },
    ],
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z',
  },
  {
    id: '2',
    code: 'OFFICE_001',
    name: '办公用品采购单',
    systemId: '2',
    systemName: '用友 U8',
    description: '办公用品采购申请',
    enabled: true,
    urlRegex: String.raw`^https://u8\.yonyou\.com/purchase/office/.*`,
    extractionRules: [],
    createdAt: '2024-01-16T09:30:00Z',
    updatedAt: '2024-01-16T09:30:00Z',
  },
];

/**
 * 单据类型树形数据
 */
export const mockBillTypesTree: BillTypeTreeNode[] = [
  {
    key: 'system-1',
    title: 'SAP Fiori',
    type: 'system',
    systemId: '1',
    children: [
      {
        key: 'bill-1',
        title: '差旅报销单',
        type: 'billType',
        systemId: '1',
        billTypeId: '1',
      },
    ],
  },
  {
    key: 'system-2',
    title: '用友 U8',
    type: 'system',
    systemId: '2',
    children: [
      {
        key: 'bill-2',
        title: '办公用品采购单',
        type: 'billType',
        systemId: '2',
        billTypeId: '2',
      },
    ],
  },
  {
    key: 'system-3',
    title: '金蝶 K3',
    type: 'system',
    systemId: '3',
    children: [],
  },
];

/**
 * 费用科目Mock数据
 */
export const mockExpenseCategories: ExpenseCategory[] = [
  {
    id: '1',
    code: 'TRAVEL',
    name: '差旅费',
    system: 'SAP Fiori',
    aliases: ['出差费用', '差旅支出', '商务旅行费'],
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z',
    children: [
      {
        id: '1-1',
        code: 'TRAVEL_TRANS',
        name: '交通费',
        parentId: '1',
        system: 'SAP Fiori',
        aliases: ['交通支出', '车费', '路费'],
        createdAt: '2024-01-15T08:00:00Z',
        updatedAt: '2024-01-15T08:00:00Z',
        children: [
          {
            id: '1-1-1',
            code: 'TRAVEL_TRANS_AIR',
            name: '飞机票',
            parentId: '1-1',
            system: 'SAP Fiori',
            aliases: ['机票', '航空费', '空中交通'],
            createdAt: '2024-01-15T08:00:00Z',
            updatedAt: '2024-01-15T08:00:00Z',
          },
          {
            id: '1-1-2',
            code: 'TRAVEL_TRANS_TRAIN',
            name: '火车票',
            parentId: '1-1',
            system: 'SAP Fiori',
            aliases: ['高铁票', '动车票', '铁路费用'],
            createdAt: '2024-01-15T08:00:00Z',
            updatedAt: '2024-01-15T08:00:00Z',
          },
        ],
      },
      {
        id: '1-2',
        code: 'TRAVEL_HOTEL',
        name: '住宿费',
        parentId: '1',
        system: 'SAP Fiori',
        aliases: ['酒店费用', '住宿支出', '宾馆费'],
        createdAt: '2024-01-15T08:00:00Z',
        updatedAt: '2024-01-15T08:00:00Z',
      },
    ],
  },
  {
    id: '2',
    code: 'OFFICE',
    name: '办公费',
    system: '用友 U8',
    aliases: ['办公用品', '办公支出'],
    createdAt: '2024-01-16T09:30:00Z',
    updatedAt: '2024-01-16T09:30:00Z',
    children: [
      {
        id: '2-1',
        code: 'OFFICE_SUPPLY',
        name: '办公用品',
        parentId: '2',
        system: '用友 U8',
        aliases: ['文具', '耗材'],
        createdAt: '2024-01-16T09:30:00Z',
        updatedAt: '2024-01-16T09:30:00Z',
      },
    ],
  },
];

/**
 * 插件全局配置Mock数据
 */
export const mockPluginConfig: PluginGlobalConfig = {
  privateDeployment: false,
  apiUrl: 'https://api.example.com',
  debugMode: true,
  floatPosition: 'bottom-right',
};

/**
 * 模拟异步请求延迟
 */
export function mockDelay(ms: number = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 生成Mock响应
 */
export function createMockResponse<T>(data: T) {
  return {
    code: 0,
    data,
    message: 'success',
  };
}

/**
 * 模拟连接测试结果
 */
export function mockConnectionTest(id: string): ConnectionTestResult {
  const system = mockSourceSystems.find((s) => s.id === id);
  if (!system) {
    return {
      success: false,
      message: '系统不存在',
    };
  }

  if (system.status === 'disabled') {
    return {
      success: false,
      message: '系统已禁用',
    };
  }

  return {
    success: true,
    message: '连接成功',
    latency: Math.floor(Math.random() * 200) + 50, // 50-250ms
  };
}

/**
 * 模型调用日志Mock数据
 */
export const mockModelCallLogs: ModelCallLog[] = [
  {
    id: 'LOG001',
    tenantId: 'tenant_001',
    tenantName: '默认租户',
    userId: 'user_001',
    tenantModelConfigId: 'model_config_001',
    tenantVendorConfigId: 'vendor_config_001',
    requestId: 'req_20241223001',
    businessType: 'audit',
    businessId: 'audit_123',
    promptContent:
      '请审核以下差旅报销单：申请人张三，出差北京3天，交通费1500元，住宿费900元，餐饮费450元。',
    inputTokens: 256,
    requestParams: {
      temperature: 0.7,
      max_tokens: 2000,
      model: 'gpt-4',
    },
    responseContent:
      '该差旅报销单审核通过。费用明细合理，符合公司差旅标准。其中交通费1500元在合理范围内，住宿费900元符合北京地区标准，餐饮费450元未超出日均标准。',
    outputTokens: 128,
    totalTokens: 384,
    modelName: 'GPT-4',
    modelVendor: 'OpenAI',
    modelLevel: 'advanced',
    inputTokenPrice: 0.000_01,
    outputTokenPrice: 0.000_03,
    cost: 0.0064,
    status: 'success',
    duration: 1250,
    requestIp: '192.168.1.100',
    calledAt: '2024-12-23T10:30:00Z',
  },
  {
    id: 'LOG002',
    tenantId: 'tenant_001',
    tenantName: '默认租户',
    userId: 'user_001',
    tenantModelConfigId: 'model_config_001',
    tenantVendorConfigId: 'vendor_config_001',
    requestId: 'req_20241223002',
    businessType: 'extraction',
    businessId: 'doc_456',
    promptContent:
      '请从以下发票信息中提取：发票号码、金额、开票日期、开票单位。',
    inputTokens: 189,
    requestParams: {
      temperature: 0.3,
      max_tokens: 1000,
      model: 'gpt-3.5-turbo',
    },
    responseContent:
      '{"invoiceNumber":"12345678","amount":1250.50,"date":"2024-12-20","issuer":"某某科技有限公司"}',
    outputTokens: 95,
    totalTokens: 284,
    modelName: 'GPT-3.5 Turbo',
    modelVendor: 'OpenAI',
    modelLevel: 'standard',
    inputTokenPrice: 0.000_005,
    outputTokenPrice: 0.000_015,
    cost: 0.002_475,
    status: 'success',
    duration: 890,
    requestIp: '192.168.1.100',
    calledAt: '2024-12-23T11:15:00Z',
  },
  {
    id: 'LOG003',
    tenantId: 'tenant_001',
    tenantName: '默认租户',
    userId: 'user_002',
    tenantModelConfigId: 'model_config_002',
    tenantVendorConfigId: 'vendor_config_002',
    requestId: 'req_20241223003',
    businessType: 'chat',
    businessId: 'chat_789',
    promptContent: '如何使用智能审核系统进行费用报销审核？',
    inputTokens: 156,
    requestParams: {
      temperature: 0.8,
      max_tokens: 1500,
      model: 'gpt-4',
    },
    responseContent:
      '智能审核系统使用流程如下：\n1. 登录系统，进入审核模块\n2. 选择待审核的单据\n3. 系统自动进行AI审核\n4. 查看审核结果和风险评估\n5. 确认审核意见并提交',
    outputTokens: 168,
    totalTokens: 324,
    modelName: 'GPT-4',
    modelVendor: 'OpenAI',
    modelLevel: 'advanced',
    inputTokenPrice: 0.000_01,
    outputTokenPrice: 0.000_03,
    cost: 0.006_12,
    status: 'success',
    duration: 1580,
    requestIp: '192.168.1.101',
    calledAt: '2024-12-23T13:20:00Z',
  },
  {
    id: 'LOG004',
    tenantId: 'tenant_001',
    tenantName: '默认租户',
    userId: 'user_001',
    tenantModelConfigId: 'model_config_001',
    tenantVendorConfigId: 'vendor_config_001',
    requestId: 'req_20241223004',
    businessType: 'classification',
    businessId: 'attachment_101',
    promptContent: '请判断附件类型：飞机票.jpg',
    inputTokens: 98,
    requestParams: {
      temperature: 0.5,
      max_tokens: 500,
      model: 'gpt-3.5-turbo',
    },
    responseContent:
      '{"type":"travel_ticket","category":"交通费","confidence":0.98}',
    outputTokens: 45,
    totalTokens: 143,
    modelName: 'GPT-3.5 Turbo',
    modelVendor: 'OpenAI',
    modelLevel: 'standard',
    inputTokenPrice: 0.000_005,
    outputTokenPrice: 0.000_015,
    cost: 0.000_729,
    status: 'success',
    duration: 520,
    requestIp: '192.168.1.100',
    calledAt: '2024-12-23T14:45:00Z',
  },
  {
    id: 'LOG005',
    tenantId: 'tenant_001',
    tenantName: '默认租户',
    userId: 'user_003',
    tenantModelConfigId: 'model_config_003',
    tenantVendorConfigId: 'vendor_config_003',
    requestId: 'req_20241223005',
    businessType: 'audit',
    businessId: 'audit_124',
    promptContent:
      '请审核以下办公用品采购申请：申请人李四，申请购买笔记本电脑2台，单价8000元。',
    inputTokens: 198,
    requestParams: {
      temperature: 0.7,
      max_tokens: 2000,
      model: 'claude-3-opus',
    },
    responseContent: undefined,
    outputTokens: 0,
    totalTokens: 198,
    modelName: 'Claude 3 Opus',
    modelVendor: 'Anthropic',
    modelLevel: 'advanced',
    inputTokenPrice: 0.000_015,
    outputTokenPrice: 0.000_075,
    cost: 0.003_96,
    status: 'failed',
    duration: 5000,
    errorCode: 'TIMEOUT',
    errorMessage: '请求超时，模型响应时间超过5秒',
    requestIp: '192.168.1.102',
    calledAt: '2024-12-23T15:30:00Z',
  },
  {
    id: 'LOG006',
    tenantId: 'tenant_001',
    tenantName: '默认租户',
    userId: 'user_001',
    tenantModelConfigId: 'model_config_001',
    tenantVendorConfigId: 'vendor_config_001',
    requestId: 'req_20241223006',
    businessType: 'translation',
    businessId: 'trans_201',
    promptContent: '将以下内容翻译成英文：智能审核系统',
    inputTokens: 124,
    requestParams: {
      temperature: 0.6,
      max_tokens: 800,
      model: 'gpt-3.5-turbo',
    },
    responseContent: 'Intelligent Audit System',
    outputTokens: 28,
    totalTokens: 152,
    modelName: 'GPT-3.5 Turbo',
    modelVendor: 'OpenAI',
    modelLevel: 'standard',
    inputTokenPrice: 0.000_005,
    outputTokenPrice: 0.000_015,
    cost: 0.000_67,
    status: 'success',
    duration: 450,
    requestIp: '192.168.1.100',
    calledAt: '2024-12-23T16:10:00Z',
  },
  {
    id: 'LOG007',
    tenantId: 'tenant_002',
    tenantName: '企业租户A',
    userId: 'user_002',
    tenantModelConfigId: 'model_config_002',
    tenantVendorConfigId: 'vendor_config_004',
    requestId: 'req_20241223007',
    businessType: 'summary',
    businessId: 'doc_789',
    promptContent:
      '请总结以下合同的主要内容：本合同由甲方某某公司与乙方某某供应商签订，约定采购办公用品一批，总价款10万元，分两次付款...',
    inputTokens: 312,
    requestParams: {
      temperature: 0.5,
      max_tokens: 1500,
      model: 'ernie-bot-4',
    },
    responseContent:
      '合同摘要：\n1. 合同双方：甲方某某公司，乙方某某供应商\n2. 采购内容：办公用品一批\n3. 合同金额：10万元\n4. 付款方式：分两次付款\n5. 合同期限：自签订之日起一年内有效',
    outputTokens: 156,
    totalTokens: 468,
    modelName: '文心一言 4.0',
    modelVendor: 'Baidu',
    modelLevel: 'advanced',
    inputTokenPrice: 0.000_012,
    outputTokenPrice: 0.000_012,
    cost: 0.005_66,
    status: 'success',
    duration: 1820,
    requestIp: '192.168.1.101',
    calledAt: '2024-12-23T17:00:00Z',
  },
  {
    id: 'LOG008',
    tenantId: 'tenant_001',
    tenantName: '默认租户',
    userId: 'user_001',
    tenantModelConfigId: 'model_config_001',
    tenantVendorConfigId: 'vendor_config_001',
    requestId: 'req_20241223008',
    businessType: 'extraction',
    businessId: 'doc_460',
    promptContent: '请提取发票中的所有关键信息',
    inputTokens: 142,
    requestParams: {
      temperature: 0.3,
      max_tokens: 1000,
      model: 'gpt-3.5-turbo',
    },
    responseContent: undefined,
    outputTokens: 0,
    totalTokens: 142,
    modelName: 'GPT-3.5 Turbo',
    modelVendor: 'OpenAI',
    modelLevel: 'standard',
    inputTokenPrice: 0.000_005,
    outputTokenPrice: 0.000_015,
    cost: 0.000_71,
    status: 'timeout',
    duration: 30_000,
    errorCode: 'REQUEST_TIMEOUT',
    errorMessage: '请求处理超时',
    requestIp: '192.168.1.100',
    calledAt: '2024-12-23T17:45:00Z',
  },
];

/**
 * 安全与权限Mock数据
 */

// 权限列表
export const mockPermissions: Permission[] = [
  // 审核管理模块
  {
    id: 'perm-1',
    key: 'audit',
    name: '审核管理',
    type: 'module',
    children: [
      {
        id: 'perm-1-1',
        key: 'audit:view',
        name: '查看审核',
        type: 'operation',
        parentId: 'perm-1',
      },
      {
        id: 'perm-1-2',
        key: 'audit:approve',
        name: '审批审核',
        type: 'operation',
        parentId: 'perm-1',
      },
      {
        id: 'perm-1-3',
        key: 'audit:reject',
        name: '拒绝审核',
        type: 'operation',
        parentId: 'perm-1',
      },
    ],
  },
  // 基础设置模块
  {
    id: 'perm-2',
    key: 'settings',
    name: '基础设置',
    type: 'module',
    children: [
      {
        id: 'perm-2-1',
        key: 'settings:view',
        name: '查看设置',
        type: 'operation',
        parentId: 'perm-2',
      },
      {
        id: 'perm-2-2',
        key: 'settings:edit',
        name: '编辑设置',
        type: 'operation',
        parentId: 'perm-2',
      },
    ],
  },
  // 单据管理模块
  {
    id: 'perm-3',
    key: 'bill',
    name: '单据管理',
    type: 'module',
    children: [
      {
        id: 'perm-3-1',
        key: 'bill:view',
        name: '查看单据',
        type: 'operation',
        parentId: 'perm-3',
      },
      {
        id: 'perm-3-2',
        key: 'bill:create',
        name: '创建单据',
        type: 'operation',
        parentId: 'perm-3',
      },
      {
        id: 'perm-3-3',
        key: 'bill:edit',
        name: '编辑单据',
        type: 'operation',
        parentId: 'perm-3',
      },
      {
        id: 'perm-3-4',
        key: 'bill:delete',
        name: '删除单据',
        type: 'operation',
        parentId: 'perm-3',
      },
    ],
  },
  // 费用科目模块
  {
    id: 'perm-4',
    key: 'expense',
    name: '费用科目',
    type: 'module',
    children: [
      {
        id: 'perm-4-1',
        key: 'expense:view',
        name: '查看科目',
        type: 'operation',
        parentId: 'perm-4',
      },
      {
        id: 'perm-4-2',
        key: 'expense:edit',
        name: '编辑科目',
        type: 'operation',
        parentId: 'perm-4',
      },
    ],
  },
  // 平台管理模块
  {
    id: 'perm-5',
    key: 'platform',
    name: '平台管理',
    type: 'module',
    children: [
      {
        id: 'perm-5-1',
        key: 'platform:admin',
        name: '管理员管理',
        type: 'operation',
        parentId: 'perm-5',
      },
      {
        id: 'perm-5-2',
        key: 'platform:role',
        name: '角色管理',
        type: 'operation',
        parentId: 'perm-5',
      },
      {
        id: 'perm-5-3',
        key: 'platform:permission',
        name: '权限配置',
        type: 'operation',
        parentId: 'perm-5',
      },
    ],
  },
  // 系统监控模块
  {
    id: 'perm-6',
    key: 'monitor',
    name: '系统监控',
    type: 'module',
    children: [
      {
        id: 'perm-6-1',
        key: 'monitor:log',
        name: '查看日志',
        type: 'operation',
        parentId: 'perm-6',
      },
      {
        id: 'perm-6-2',
        key: 'monitor:metrics',
        name: '查看指标',
        type: 'operation',
        parentId: 'perm-6',
      },
    ],
  },
];

// 权限树形结构
export const mockPermissionsTree: PermissionTreeNode[] = [
  {
    key: 'perm-1',
    title: '审核管理',
    type: 'module',
    permissionId: 'perm-1',
    children: [
      {
        key: 'perm-1-1',
        title: '查看审核',
        type: 'operation',
        permissionId: 'perm-1-1',
      },
      {
        key: 'perm-1-2',
        title: '审批审核',
        type: 'operation',
        permissionId: 'perm-1-2',
      },
      {
        key: 'perm-1-3',
        title: '拒绝审核',
        type: 'operation',
        permissionId: 'perm-1-3',
      },
    ],
  },
  {
    key: 'perm-2',
    title: '基础设置',
    type: 'module',
    permissionId: 'perm-2',
    children: [
      {
        key: 'perm-2-1',
        title: '查看设置',
        type: 'operation',
        permissionId: 'perm-2-1',
      },
      {
        key: 'perm-2-2',
        title: '编辑设置',
        type: 'operation',
        permissionId: 'perm-2-2',
      },
    ],
  },
  {
    key: 'perm-3',
    title: '单据管理',
    type: 'module',
    permissionId: 'perm-3',
    children: [
      {
        key: 'perm-3-1',
        title: '查看单据',
        type: 'operation',
        permissionId: 'perm-3-1',
      },
      {
        key: 'perm-3-2',
        title: '创建单据',
        type: 'operation',
        permissionId: 'perm-3-2',
      },
      {
        key: 'perm-3-3',
        title: '编辑单据',
        type: 'operation',
        permissionId: 'perm-3-3',
      },
      {
        key: 'perm-3-4',
        title: '删除单据',
        type: 'operation',
        permissionId: 'perm-3-4',
      },
    ],
  },
  {
    key: 'perm-4',
    title: '费用科目',
    type: 'module',
    permissionId: 'perm-4',
    children: [
      {
        key: 'perm-4-1',
        title: '查看科目',
        type: 'operation',
        permissionId: 'perm-4-1',
      },
      {
        key: 'perm-4-2',
        title: '编辑科目',
        type: 'operation',
        permissionId: 'perm-4-2',
      },
    ],
  },
  {
    key: 'perm-5',
    title: '平台管理',
    type: 'module',
    permissionId: 'perm-5',
    children: [
      {
        key: 'perm-5-1',
        title: '管理员管理',
        type: 'operation',
        permissionId: 'perm-5-1',
      },
      {
        key: 'perm-5-2',
        title: '角色管理',
        type: 'operation',
        permissionId: 'perm-5-2',
      },
      {
        key: 'perm-5-3',
        title: '权限配置',
        type: 'operation',
        permissionId: 'perm-5-3',
      },
    ],
  },
  {
    key: 'perm-6',
    title: '系统监控',
    type: 'module',
    permissionId: 'perm-6',
    children: [
      {
        key: 'perm-6-1',
        title: '查看日志',
        type: 'operation',
        permissionId: 'perm-6-1',
      },
      {
        key: 'perm-6-2',
        title: '查看指标',
        type: 'operation',
        permissionId: 'perm-6-2',
      },
    ],
  },
];

// 角色列表
export const mockRoles: Role[] = [
  {
    id: 'role-1',
    name: '超级管理员',
    permissionKey: 'super_admin',
    dataPermission: 'all',
    sort: 1,
    status: 'enabled',
    description: '拥有系统所有权限',
    permissions: mockPermissions,
    adminCount: 2,
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'role-2',
    name: '审核员',
    permissionKey: 'auditor',
    dataPermission: 'department',
    sort: 2,
    status: 'enabled',
    description: '负责单据审核工作',
    permissions: [
      mockPermissions[0], // 审核管理
      mockPermissions[3], // 费用科目
    ],
    adminCount: 5,
    isSystem: false,
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-10T08:00:00Z',
  },
  {
    id: 'role-3',
    name: '业务员',
    permissionKey: 'salesman',
    dataPermission: 'self',
    sort: 3,
    status: 'enabled',
    description: '负责单据创建和查看',
    permissions: [
      {
        ...mockPermissions[0],
        children: [
          mockPermissions[0].children?.[0], // 仅查看审核
        ],
      },
      {
        ...mockPermissions[2],
        children: [
          mockPermissions[2].children?.[0], // 查看单据
          mockPermissions[2].children?.[1], // 创建单据
        ],
      },
      mockPermissions[3], // 费用科目
    ],
    adminCount: 10,
    isSystem: false,
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-15T09:00:00Z',
  },
];

// 管理员列表
export const mockAdmins: Admin[] = [
  {
    id: 'admin-1',
    username: 'admin',
    realName: '系统管理员',
    roleId: 'role-1',
    roleName: '超级管理员',
    mfaEnabled: 'enabled',
    lastLoginAt: '2024-12-29T10:30:00Z',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-12-29T10:30:00Z',
  },
  {
    id: 'admin-2',
    username: 'zhangsan',
    realName: '张三',
    roleId: 'role-2',
    roleName: '审核员',
    mfaEnabled: 'enabled',
    lastLoginAt: '2024-12-29T09:15:00Z',
    status: 'active',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-12-29T09:15:00Z',
  },
  {
    id: 'admin-3',
    username: 'lisi',
    realName: '李四',
    roleId: 'role-3',
    roleName: '业务员',
    mfaEnabled: 'disabled',
    lastLoginAt: '2024-12-28T16:45:00Z',
    status: 'active',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-12-28T16:45:00Z',
  },
  {
    id: 'admin-4',
    username: 'wangwu',
    realName: '王五',
    roleId: 'role-3',
    roleName: '业务员',
    mfaEnabled: 'disabled',
    lastLoginAt: '2024-12-27T14:20:00Z',
    status: 'active',
    createdAt: '2024-01-18T10:30:00Z',
    updatedAt: '2024-12-27T14:20:00Z',
  },
  {
    id: 'admin-5',
    username: 'zhaoliu',
    realName: '赵六',
    roleId: 'role-4',
    roleName: '查看员',
    mfaEnabled: 'disabled',
    lastLoginAt: '2024-12-26T11:00:00Z',
    status: 'active',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-12-26T11:00:00Z',
  },
  {
    id: 'admin-6',
    username: 'sunqi',
    realName: '孙七',
    roleId: 'role-2',
    roleName: '审核员',
    mfaEnabled: 'enabled',
    lastLoginAt: '2024-12-25T15:30:00Z',
    status: 'active',
    createdAt: '2024-02-01T08:00:00Z',
    updatedAt: '2024-12-25T15:30:00Z',
  },
  {
    id: 'admin-7',
    username: 'test_user',
    realName: '测试用户',
    roleId: 'role-4',
    roleName: '查看员',
    mfaEnabled: 'disabled',
    lastLoginAt: '2024-12-20T09:00:00Z',
    status: 'disabled',
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-12-20T09:00:00Z',
  },
];

/**
 * AI 服务 Mock 数据
 */
export const mockAiModels: AiModel[] = [
  { id: '1', name: 'GPT-3.5 Turbo', provider: 'OpenAI', code: 'gpt-3.5-turbo' },
  { id: '2', name: 'GPT-4', provider: 'OpenAI', code: 'gpt-4' },
  {
    id: '3',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    code: 'claude-3-opus',
  },
  { id: '4', name: 'Qwen-Turbo', provider: 'Aliyun', code: 'qwen-turbo' },
  { id: '5', name: 'Qwen-Plus', provider: 'Aliyun', code: 'qwen-plus' },
  {
    id: '6',
    name: 'Qwen1.5-72B-Chat',
    provider: 'SiliconFlow',
    code: 'Qwen/Qwen1.5-72B-Chat',
  },
  {
    id: '7',
    name: 'DeepSeek-V2',
    provider: 'SiliconFlow',
    code: 'deepseek-ai/DeepSeek-V2-Chat',
  },
];

export const mockApiKeys: ApiKeyDef[] = [
  { label: '测试项目', value: 'sk-Esiw892...', vendor: '内部测试' },
  { label: '智能填报', value: 'sk-SmartFi...', vendor: '业务系统' },
  { label: '喔壳 (WoKe)', value: 'sk-WoKe992...', vendor: '第三方' },
];

export const mockAiTools: AiTool[] = [
  {
    id: '1',
    name: 'Web Search',
    code: 'web_search',
    description: 'Search the internet for up-to-date information',
    parameters: {},
  },
  {
    id: '2',
    name: 'Calculator',
    code: 'calculator',
    description: 'Perform mathematical calculations',
    parameters: {},
  },
];

export const mockAiTags: string[] = [
  '办公效能',
  '数据处理',
  '创意写作',
  '代码辅助',
  '会议助手',
];

export const mockAiServices: AiServiceDef[] = [
  {
    id: '1',
    serviceName: 'Meeting Minutes Generator',
    serviceCode: 'meeting_minutes',
    executionMode: 'CHAT',
    tags: ['办公效能', '会议助手'],
    modelConfig: {
      provider: 'OpenAI',
      model: 'gpt-4',
      temperature: 0.7,
      topP: 1,
    },
    inputSchema: [
      {
        name: 'content',
        type: 'string',
        desc: 'Meeting Transcript',
        ui: 'textarea',
      },
      {
        name: 'attendees',
        type: 'string',
        desc: 'Attendees List',
        ui: 'input',
      },
    ],
    systemPrompt:
      'You are a helpful assistant that generates meeting minutes from transcripts. \nAttendees: {{attendees}}\n\nTranscript:\n{{content}}',
    outputType: 'MARKDOWN',
    isActive: true,
    isRouteEnabled: false,
    routeMode: 'CODE',
    intentPrompt: '',
    routes: [],
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
  },
  {
    id: '2',
    serviceName: 'Invoice Extractor',
    serviceCode: 'invoice_extractor',
    executionMode: 'CHAT',
    tags: ['数据处理'],
    modelConfig: {
      provider: 'OpenAI',
      model: 'gpt-3.5-turbo',
      temperature: 0,
      topP: 1,
    },
    inputSchema: [
      {
        name: 'ocr_text',
        type: 'string',
        desc: 'OCR Text content',
        ui: 'textarea',
      },
    ],
    systemPrompt:
      'Extract invoice details from the following text and return as JSON: {{ocr_text}}',
    outputType: 'JSON',
    isActive: true,
    isRouteEnabled: false,
    routeMode: 'CODE',
    intentPrompt: '',
    routes: [],
    createdAt: '2024-01-21T10:00:00Z',
    updatedAt: '2024-01-21T10:00:00Z',
  },
];

export const mockApiKeysList: AiApiKey[] = [
  {
    id: '1',
    tenantId: 'tenant_001',
    createdBy: 'admin_001',
    createdTime: '2024-01-01T00:00:00Z',
    remark: 'Default API Key for dev',
    accessKey: 'sk-7f8a9d0e1b2c3d4e5f6g7h8i9j0k1l2m',
    permissions: ['*'],
    status: 1,
  },
  {
    id: '2',
    tenantId: 'tenant_001',
    createdBy: 'admin_002',
    createdTime: '2024-02-01T00:00:00Z',
    remark: 'Test Key (Expired)',
    accessKey: 'sk-1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p',
    permissions: ['*'],
    expirationTime: '2024-02-02T00:00:00Z',
    status: 0,
  },
];

export const mockApiKeyLogs: AiApiKeyLog[] = [
  {
    id: '101',
    apiKeyId: '1',
    requestUrl: '/api/v1/chat/completions',
    requestMethod: 'POST',
    requestData:
      '{"model": "gpt-4", "messages": [{"role": "user", "content": "Hello"}]}',
    responseData:
      '{"id": "chatcmpl-123", "choices": [{"message": {"content": "Hi there!"}}]}',
    createdTime: '2024-03-10T10:05:00Z',
    isSuccess: true,
  },
  {
    id: '102',
    apiKeyId: '1',
    requestUrl: '/api/v1/embeddings',
    requestMethod: 'POST',
    requestData: '{"input": "Search query"}',
    responseData: '{"data": [{"embedding": [0.1, 0.2, ...]}]}',
    createdTime: '2024-03-10T10:06:00Z',
    isSuccess: true,
  },
  {
    id: '103',
    apiKeyId: '1',
    requestUrl: '/api/v1/chat/completions',
    requestMethod: 'POST',
    requestData: '{"model": "gpt-5-preview"}',
    responseData: '{"error": {"message": "Model not found"}}',
    createdTime: '2024-03-10T10:10:00Z',
    isSuccess: false,
    message: 'Invalid model',
  },
];

export function generateMockAccessKey(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'sk-';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const mockTenantHomeData: TenantHomeData = {
  overview: {
    tenantId: 'tenant_001',
    tenantName: '默认租户',
    totalCalls: 125_600,
    todayCalls: 3280,
    activeModels: 5,
    serviceHealth: 98,
    expiryDate: '2025-12-31',
    packageType: '企业版',
  },
  quickActions: [
    {
      id: 'action-1',
      title: '智能审核',
      description: '快速进入智能审核配置',
      icon: 'lucide:shield-check',
      route: '/agent/smart_audit',
    },
    {
      id: 'action-2',
      title: 'API密钥管理',
      description: '管理API访问密钥',
      icon: 'lucide:key',
      route: '/agent/apikey',
    },
    {
      id: 'action-3',
      title: 'AI服务管理',
      description: '配置AI服务参数',
      icon: 'lucide:cpu',
      route: '/agent/service',
    },
  ],
  serviceStatus: [
    {
      id: 'svc-1',
      name: '智能审核',
      status: 'normal',
      todayCalls: 1200,
      totalCalls: 58_000,
      successRate: 99.2,
      avgResponseTime: 320,
    },
    {
      id: 'svc-2',
      name: '智能填报',
      status: 'normal',
      todayCalls: 850,
      totalCalls: 32_000,
      successRate: 98.8,
      avgResponseTime: 450,
    },
    {
      id: 'svc-3',
      name: '智能分类',
      status: 'warning',
      todayCalls: 680,
      totalCalls: 21_000,
      successRate: 96.5,
      avgResponseTime: 280,
    },
    {
      id: 'svc-4',
      name: '智能合规',
      status: 'normal',
      todayCalls: 420,
      totalCalls: 12_000,
      successRate: 99.5,
      avgResponseTime: 520,
    },
  ],
  serviceUsage: {
    total: 3150,
    data: [
      { name: '智能审核', value: 1200, percentage: 38 },
      { name: '智能填报', value: 850, percentage: 27 },
      { name: '智能分类', value: 680, percentage: 22 },
      { name: '智能合规', value: 420, percentage: 13 },
    ],
  },
  modelUsage: {
    timeRange: 'week',
    data: [
      {
        modelName: 'GPT-4',
        modelVendor: 'OpenAI',
        totalCalls: 18_500,
        data: [
          { time: '周一', modelName: 'GPT-4', calls: 2500 },
          { time: '周二', modelName: 'GPT-4', calls: 2800 },
          { time: '周三', modelName: 'GPT-4', calls: 2600 },
          { time: '周四', modelName: 'GPT-4', calls: 2700 },
          { time: '周五', modelName: 'GPT-4', calls: 3200 },
          { time: '周六', modelName: 'GPT-4', calls: 2100 },
          { time: '周日', modelName: 'GPT-4', calls: 2600 },
        ],
      },
      {
        modelName: 'Claude 3',
        modelVendor: 'Anthropic',
        totalCalls: 8200,
        data: [
          { time: '周一', modelName: 'Claude 3', calls: 1100 },
          { time: '周二', modelName: 'Claude 3', calls: 1300 },
          { time: '周三', modelName: 'Claude 3', calls: 1200 },
          { time: '周四', modelName: 'Claude 3', calls: 1150 },
          { time: '周五', modelName: 'Claude 3', calls: 1400 },
          { time: '周六', modelName: 'Claude 3', calls: 950 },
          { time: '周日', modelName: 'Claude 3', calls: 1100 },
        ],
      },
    ],
  },
};

// 企业实体实施工作台的内存模拟数据，刷新后重置。
// 设备字段与身份规则来自设计；具体值、时间和工单为对话中的演示样例，不代表真实设备数据。
export const mockDeviceSourceObjects: import('#/types/enterprise-entity').SourceObject[] =
  [
    {
      id: 'mst_dev',
      system: '设备系统',
      name: 'mst_dev',
      description: '设备台账',
      purpose: '基础信息：设备编号唯一，包含名称和设备型号',
      fields: [
        'dev_no（主键 / 设备编号）',
        'device_name（设备名称）',
        'model（设备型号）',
        'customer_no（所属客户编号）',
      ],
      status: '已确认',
    },
    {
      id: 'device_config',
      system: '运维系统',
      name: 'device_config',
      description: '当前设备配置',
      purpose:
        '动态属性：扫描仪型号、操作系统版本；配置属性：大仓位数。不创建独立部件实体。',
      fields: [
        'dev_no（设备编号）',
        'scanner（扫描仪型号）',
        'os_ver（操作系统版本）',
        'large_slots（大仓位数）',
      ],
      status: '已确认',
    },
    {
      id: 'repair_changes',
      system: '运维系统',
      name: 'repair_changes',
      description: '维修变更明细',
      purpose: '业务历史：可靠变更生效时间、前后值、事件编号、原因及来源工单',
      fields: [
        'dev_no（设备编号）',
        'attribute（属性标识）',
        'old_value',
        'new_value',
        'effective_at',
        'event_id',
        'work_order',
        'reason',
      ],
      status: '已确认',
    },
    {
      id: 'device_project',
      system: '设备系统',
      name: 'device_project',
      description: '设备项目关联',
      purpose: '通过设备编号和项目编号关联多个项目',
      fields: ['dev_no（设备编号）', 'project_no（项目编号）'],
      status: '已确认',
    },
  ];

export const mockDeviceAttributes: import('#/types/enterprise-entity').EntityAttribute[] =
  [
    {
      id: 'device_code',
      name: '设备编号',
      type: '文本',
      group: '基础信息',
      standard: true,
      dynamic: false,
      confirmed: true,
      nullable: false,
      alias: '设备编码',
      source: '设备系统',
      field: 'mst_dev.dev_no',
      strategy: '身份同步',
      history: '不开放历史',
      historyRequired: false,
      historyObject: '',
      verified: true,
    },
    {
      id: 'device_name',
      name: '设备名称',
      type: '文本',
      group: '基础信息',
      standard: true,
      dynamic: false,
      confirmed: true,
      nullable: true,
      alias: '设备名',
      source: '设备系统',
      field: 'mst_dev.device_name',
      strategy: '实时查询',
      history: '不开放历史',
      historyRequired: false,
      historyObject: '',
      verified: true,
    },
    {
      id: 'model',
      name: '设备型号',
      type: '文本',
      group: '基础信息',
      standard: true,
      dynamic: false,
      confirmed: true,
      nullable: true,
      alias: '型号',
      source: '设备系统',
      field: 'mst_dev.model',
      strategy: '实时查询',
      history: '不开放历史',
      historyRequired: false,
      historyObject: '',
      verified: true,
    },
    {
      id: 'scanner_model',
      name: '扫描仪型号',
      type: '文本',
      group: '设备配置',
      standard: false,
      dynamic: true,
      confirmed: true,
      nullable: true,
      alias: '扫描器型号',
      source: '运维系统',
      field: 'device_config.scanner',
      strategy: '事件同步',
      history: '查询来源历史',
      historyRequired: true,
      historyObject: 'repair_changes',
      verified: false,
    },
    {
      id: 'os_version',
      name: '操作系统版本',
      type: '文本',
      group: '软件信息',
      standard: true,
      dynamic: true,
      confirmed: true,
      nullable: true,
      alias: '系统版本',
      source: '运维系统',
      field: 'device_config.os_ver',
      strategy: '实时查询',
      history: '不开放历史',
      historyRequired: false,
      historyObject: '',
      verified: true,
    },
    {
      id: 'large_slot_count',
      name: '大仓位数',
      type: '整数',
      group: '设备配置',
      standard: false,
      dynamic: false,
      confirmed: true,
      nullable: true,
      alias: '大仓位数量',
      source: '运维系统',
      field: 'device_config.large_slots',
      strategy: '实时查询',
      history: '不开放历史',
      historyRequired: false,
      historyObject: '',
      verified: true,
    },
  ];

export const mockDeviceRelations: import('#/types/enterprise-entity').EntityRelation[] =
  [
    {
      id: 'belongs_to_customer',
      name: '所属客户',
      target: 'Customer',
      cardinality: '多对一',
      enabled: true,
      source: '设备系统',
      object: 'mst_dev',
      sourceField: 'customer_no',
      targetField: 'customer_no',
      verified: true,
    },
    {
      id: 'linked_project',
      name: '关联项目',
      target: 'Project',
      cardinality: '多对多',
      enabled: true,
      source: '设备系统',
      object: 'device_project',
      sourceField: 'project_no',
      targetField: 'project_no',
      verified: true,
    },
    {
      id: 'maintained_by',
      name: '运维负责人',
      target: 'Employee',
      cardinality: '多对一',
      enabled: false,
    },
  ];

export const mockDeviceRecords: import('#/types/enterprise-entity').EntityRecord[] =
  [
    {
      id: 'DEV-000001',
      code: 'SB20260001',
      name: '智能收单机',
      sources: ['设备系统', '运维系统'],
      status: '正常',
    },
    {
      id: 'DEV-000002',
      code: 'SB20260002',
      name: '智能收单机',
      sources: ['设备系统'],
      status: '运维来源未关联',
    },
  ];

export const mockDeviceSourceRecords: import('#/types/enterprise-entity').DeviceSourceRecord[] =
  [
    {
      system: '设备系统',
      object: 'mst_dev',
      primaryKey: 'SB20260001',
      deviceCode: 'SB20260001',
      updatedAt: '2026-10-12 09:30',
      values: {
        dev_no: 'SB20260001',
        customer_no: 'KH20260001',
        device_name: '智能收单机',
        model: 'DDL-860',
      },
    },
    {
      system: '设备系统',
      object: 'mst_dev',
      primaryKey: 'SB20260002',
      deviceCode: 'SB20260002',
      updatedAt: '2026-10-12 09:30',
      values: {
        dev_no: 'SB20260002',
        customer_no: 'KH20260002',
        device_name: '智能收单机',
        model: 'DDL-860',
      },
    },
    {
      system: '运维系统',
      object: 'device_config',
      primaryKey: 'SB20260001',
      deviceCode: 'SB20260001',
      updatedAt: '2026-10-12 09:30',
      values: {
        dev_no: 'SB20260001',
        scanner: 'Honeywell 1900G',
        os_ver: 'Windows 11 23H2',
        large_slots: 12,
      },
    },
    {
      system: '设备系统',
      object: 'device_project',
      primaryKey: 'SB20260001_XM20260001',
      deviceCode: 'SB20260001',
      updatedAt: '2026-10-14 09:30',
      values: {
        dev_no: 'SB20260001',
        project_no: 'XM20260001',
      },
    },
    {
      system: '设备系统',
      object: 'device_project',
      primaryKey: 'SB20260001_XM20260002',
      deviceCode: 'SB20260001',
      updatedAt: '2026-10-14 09:30',
      values: {
        dev_no: 'SB20260001',
        project_no: 'XM20260002',
      },
    },
    {
      system: '设备系统',
      object: 'device_project',
      primaryKey: 'SB20260002_XM20260001',
      deviceCode: 'SB20260002',
      updatedAt: '2026-10-14 09:30',
      values: {
        dev_no: 'SB20260002',
        project_no: 'XM20260001',
      },
    },
  ];

export const mockDeviceChanges: import('#/types/enterprise-entity').DeviceChangeEvent[] =
  [
    {
      id: 'EV-0928-001',
      deviceCode: 'SB20260001',
      effectiveAt: '2026-09-28 14:20',
      reason: '扫描模组故障',
      source: '运维系统',
      object: 'repair_changes',
      document: 'WX20260928003',
      changes: [
        {
          attribute: 'scanner_model',
          name: '扫描仪型号',
          oldValue: 'Zebra DS2208',
          newValue: 'Honeywell 1900G',
        },
      ],
    },
  ];

export const mockDeviceAgentCases: import('#/types/enterprise-entity').AgentCase[] =
  [
    {
      id: 'basic',
      name: '基础查询',
      question: '查询 SB20260001 的设备型号',
      history: false,
      status: '未测试',
      answer: '',
      evidence: '',
    },
    {
      id: 'dynamic',
      name: '动态属性',
      question: '查询 SB20260001 当前扫描仪型号',
      history: false,
      status: '未测试',
      answer: '',
      evidence: '',
    },
    {
      id: 'history',
      name: '历史查询',
      question: '查询 SB20260001 最近一次扫描仪更换',
      history: true,
      status: '未测试',
      answer: '',
      evidence: '',
    },
    {
      id: 'missing',
      name: '不存在的设备',
      question: '查询 SB20999999 的设备型号',
      history: false,
      status: '未测试',
      answer: '',
      evidence: '',
    },
    {
      id: 'no-history',
      name: '历史不可用',
      question: '查询 SB20260002 的扫描仪更换历史',
      history: true,
      status: '未测试',
      answer: '',
      evidence: '',
    },
    {
      id: 'permission',
      name: '权限测试',
      question: '用无权限身份查询 SB20260001',
      history: false,
      status: '未测试',
      answer: '',
      evidence: '',
    },
    {
      id: 'unavailable',
      name: '来源不可用',
      question: '来源接口不可用时查询当前扫描仪型号',
      history: false,
      status: '未测试',
      answer: '',
      evidence: '',
    },
    {
      id: 'customer-relation',
      name: '所属客户查询',
      question: '查询 SB20260001 的所属客户',
      history: false,
      relation: 'belongs_to_customer',
      status: '未测试',
      answer: '',
      evidence: '',
    },
    {
      id: 'project-relations',
      name: '关联项目查询',
      question: '查询 SB20260001 关联的全部项目',
      history: false,
      relation: 'linked_project',
      status: '未测试',
      answer: '',
      evidence: '',
    },
  ];

// 以下客户、项目与关系记录为合成演示数据。
export const mockCustomerRecords: import('#/types/enterprise-entity').EntityRecord[] =
  [
    {
      id: 'CUS-000001',
      code: 'KH20260001',
      name: '示例客户A',
      sources: ['客户系统'],
      status: '正常',
    },
    {
      id: 'CUS-000002',
      code: 'KH20260002',
      name: '示例客户B',
      sources: ['客户系统'],
      status: '正常',
    },
  ];
export const mockProjectRecords: import('#/types/enterprise-entity').EntityRecord[] =
  [
    {
      id: 'PRJ-000001',
      code: 'XM20260001',
      name: '设备部署项目（示例）',
      sources: ['项目系统'],
      status: '正常',
    },
    {
      id: 'PRJ-000002',
      code: 'XM20260002',
      name: '运维升级项目（示例）',
      sources: ['项目系统'],
      status: '正常',
    },
  ];
export const mockEntitySourceRecords: import('#/types/enterprise-entity').EntitySourceRecord[] =
  [
    {
      entityCode: 'Customer',
      recordCode: 'KH20260001',
      system: '客户系统',
      object: 'customer_master',
      primaryKey: 'KH20260001',
      updatedAt: '2026-10-14 09:30',
      values: {
        customer_no: 'KH20260001',
        customer_name: '示例客户A',
        status: '正常',
      },
    },
    {
      entityCode: 'Customer',
      recordCode: 'KH20260002',
      system: '客户系统',
      object: 'customer_master',
      primaryKey: 'KH20260002',
      updatedAt: '2026-10-14 09:30',
      values: {
        customer_no: 'KH20260002',
        customer_name: '示例客户B',
        status: '正常',
      },
    },
    {
      entityCode: 'Project',
      recordCode: 'XM20260001',
      system: '项目系统',
      object: 'project_master',
      primaryKey: 'XM20260001',
      updatedAt: '2026-10-14 09:30',
      values: {
        project_no: 'XM20260001',
        project_name: '设备部署项目（示例）',
        status: '正常',
      },
    },
    {
      entityCode: 'Project',
      recordCode: 'XM20260002',
      system: '项目系统',
      object: 'project_master',
      primaryKey: 'XM20260002',
      updatedAt: '2026-10-14 09:30',
      values: {
        project_no: 'XM20260002',
        project_name: '运维升级项目（示例）',
        status: '正常',
      },
    },
  ];
export const mockEntityRelationLinks: import('#/types/enterprise-entity').EntityRelationLink[] =
  [
    {
      relationId: 'belongs_to_customer',
      sourceRecordCode: 'SB20260001',
      targetEntityCode: 'Customer',
      targetRecordCode: 'KH20260001',
      source: '设备系统',
      object: 'mst_dev',
      sourceKey: 'SB20260001',
      updatedAt: '2026-10-14 09:30',
    },
    {
      relationId: 'belongs_to_customer',
      sourceRecordCode: 'SB20260002',
      targetEntityCode: 'Customer',
      targetRecordCode: 'KH20260002',
      source: '设备系统',
      object: 'mst_dev',
      sourceKey: 'SB20260002',
      updatedAt: '2026-10-14 09:30',
    },
    {
      relationId: 'linked_project',
      sourceRecordCode: 'SB20260001',
      targetEntityCode: 'Project',
      targetRecordCode: 'XM20260001',
      source: '设备系统',
      object: 'device_project',
      sourceKey: 'SB20260001_XM20260001',
      updatedAt: '2026-10-14 09:30',
    },
    {
      relationId: 'linked_project',
      sourceRecordCode: 'SB20260001',
      targetEntityCode: 'Project',
      targetRecordCode: 'XM20260002',
      source: '设备系统',
      object: 'device_project',
      sourceKey: 'SB20260001_XM20260002',
      updatedAt: '2026-10-14 09:30',
    },
    {
      relationId: 'linked_project',
      sourceRecordCode: 'SB20260002',
      targetEntityCode: 'Project',
      targetRecordCode: 'XM20260001',
      source: '设备系统',
      object: 'device_project',
      sourceKey: 'SB20260002_XM20260001',
      updatedAt: '2026-10-14 09:30',
    },
  ];

function createPublishedBusinessEntity(
  code: string,
  name: string,
  system: string,
  object: string,
  key: string,
  nameKey: string,
  records: import('#/types/enterprise-entity').EntityRecord[],
): import('#/types/enterprise-entity').EntityDraft {
  const attributes: import('#/types/enterprise-entity').EntityAttribute[] = [
    [key, `${name}编号`],
    [nameKey, `${name}名称`],
    ['status', `${name}状态`],
  ].map(([id, label]) => ({
    id: id ?? '',
    name: label ?? '',
    type: '文本',
    group: '基础信息',
    standard: true,
    dynamic: false,
    confirmed: true,
    nullable: false,
    alias: '',
    source: system,
    field: `${object}.${id}`,
    strategy: id === key ? '身份同步' : '实时查询',
    history: '不开放历史',
    historyRequired: false,
    historyObject: '',
    verified: true,
  }));
  const objects: import('#/types/enterprise-entity').SourceObject[] = [
    {
      id: object,
      system,
      name: object,
      description: `${name}主数据`,
      purpose: `以${name}编号唯一识别${name}，提供设备关系的目标实体`,
      fields: [key, nameKey, 'status'],
      status: '已确认',
    },
  ];
  const services = [
    `resolve_${code.toLowerCase()}`,
    `get_${code.toLowerCase()}`,
  ];
  const cases: import('#/types/enterprise-entity').AgentCase[] = [
    {
      id: 'entity-current',
      name: `${name}基础查询`,
      question: `查询 ${records[0]?.code} 的${name}名称`,
      history: false,
      status: '通过',
      answer: `${records[0]?.code}：${records[0]?.name}`,
      evidence: `${services[0]} → ${records[0]?.id}；${services[1]} → ${object}.${nameKey}；来源 ${system}；范围 当前租户`,
    },
  ];
  return {
    id: `entity-${code.toLowerCase()}`,
    name,
    code,
    description: `已发布的${name}主数据 · 供设备关系查询使用（示例）`,
    uniqueKey: `${name}编号`,
    revision: 1,
    version: 'v1.0',
    activeVersion: 'v1.0',
    serviceEnabled: true,
    modelConfirmed: true,
    identityVerified: true,
    sources: [system],
    objects,
    attributes,
    relations: [],
    records: structuredClone(records),
    cases,
    releases: [
      { version: 'v1.0', time: '2026-10-14 09:30', services, revision: 1 },
    ],
    published: {
      attributes: structuredClone(attributes),
      objects: structuredClone(objects),
      relations: [],
      records: structuredClone(records),
      role: '运维管理员',
      scope: '当前租户',
      protocol: 'MCP',
    },
    updatedAt: '2026-10-14 09:30',
    role: '运维管理员',
    scope: '当前租户',
    protocol: 'MCP',
  };
}
export const mockEnterpriseEntities: import('#/types/enterprise-entity').EntityDraft[] =
  [
    {
      id: 'entity-device',
      name: '设备',
      code: 'Device',
      description: '设备编号唯一 · 多业务来源 · 动态属性与变更历史',
      uniqueKey: '设备编号',
      revision: 1,
      version: 'v1.0',
      activeVersion: '',
      serviceEnabled: false,
      modelConfirmed: true,
      identityVerified: true,
      sources: ['设备系统', '运维系统'],
      objects: structuredClone(mockDeviceSourceObjects),
      attributes: structuredClone(mockDeviceAttributes),
      relations: structuredClone(mockDeviceRelations),
      records: structuredClone(mockDeviceRecords),
      cases: structuredClone(mockDeviceAgentCases),
      releases: [],
      updatedAt: '2026-10-12 09:30',
      role: '运维管理员',
      scope: '当前租户',
      protocol: 'MCP',
    },
    createPublishedBusinessEntity(
      'Customer',
      '客户',
      '客户系统',
      'customer_master',
      'customer_no',
      'customer_name',
      mockCustomerRecords,
    ),
    createPublishedBusinessEntity(
      'Project',
      '项目',
      '项目系统',
      'project_master',
      'project_no',
      'project_name',
      mockProjectRecords,
    ),
  ];

// 合同类别的管理配置，不包含巡检、开票或催款等业务执行规则。
export function createContractManagementDefaults(
  categoryKey: string,
  sales = false,
): import('#/types/contract-assistant').ContractManagementConfig {
  return {
    categoryKey,
    code: sales ? 'SALES' : 'MAINTENANCE',
    mappings: [],
    summary: {
      requirements:
        '概括合同主体、范围、金额、有效期、生效条件、关键权利义务、交付与验收要求及特殊条款。保留原文依据，区分明确约定与人工补充。',
      missing:
        '缺失关键约定时列为待补充；正文与附件冲突时并列展示依据，由合同管理员确认，不得自行取舍。',
    },
    audit: {
      mode: 'intelligent',
      schemeId: 'contract-general',
      resultHandling:
        '审核异常先提示上传人补充；阻断问题未解决前不允许完成建档。非阻断事项可说明原因后由确认人确认。',
    },
    lifecycle: {
      startBasis: sales ? 'contract' : 'acceptance',
      expiryBasis: 'contract',
      durationMonths: 12,
      missingDate: 'ask',
      automaticRenewal: 'clause',
      renewalInstructions:
        '识别自动续约约定及取消通知期限，先由合同负责人确认；不因识别出条款就自动执行续约或对外发送通知。',
      changeHandling:
        '有效期变化后重新计算尚未触发事项，保留已发送记录；合同终止、作废或完成续约后按各事项的停止条件取消后续提醒。',
      actions: [
        {
          id: `${categoryKey}-renewal`,
          name: '续约评估',
          trigger: 'before-expiry',
          days: 90,
          action: 'todo',
          recipients: ['合同负责人'],
          description: '确认是否续约，准备需要补充的资料。',
          stopWhen: ['已续约', '已终止', '已作废'],
        },
        {
          id: `${categoryKey}-expiry`,
          name: '合同到期提醒',
          trigger: 'on-expiry',
          days: 0,
          action: 'message',
          recipients: ['合同负责人'],
          description: '核对合同是否到期，以及是否需要衔接后续服务。',
          stopWhen: ['已续约', '已终止', '已作废'],
        },
      ],
    },
  };
}

// 由项目、财务、运维模块提供的关联事项进展，合同详情只读展示。
export const mockContractRelatedItems: Record<
  string,
  import('#/types/contract-assistant').ContractRelatedItem[]
> = {
  'CT-DEMO-002': [
    {
      id: 'inspection-001',
      type: 'inspection',
      name: '第1次网络设备巡检',
      owner: '张三',
      status: 'completed',
      plannedDate: '2026-10-20',
      updatedAt: '2026-10-20 10:30',
      progress: '已提交巡检记录，运维负责人已确认完成。',
    },
    {
      id: 'inspection-002',
      type: 'inspection',
      name: '第2次网络设备巡检',
      owner: '张三',
      status: 'pending',
      plannedDate: '2027-01-20',
      updatedAt: '2026-10-20 10:30',
      progress: '待执行，执行前与客户确认服务时间。',
    },
    {
      id: 'inspection-003',
      type: 'inspection',
      name: '第3次网络设备巡检',
      owner: '张三',
      status: 'pending',
      plannedDate: '2027-04-20',
      updatedAt: '2026-10-20 10:30',
      progress: '已纳入年度巡检安排，尚未执行。',
    },
    {
      id: 'inspection-004',
      type: 'inspection',
      name: '第4次网络设备巡检',
      owner: '张三',
      status: 'pending',
      plannedDate: '2027-07-20',
      updatedAt: '2026-10-20 10:30',
      progress: '已纳入年度巡检安排，尚未执行。',
    },
  ],
  'CT-SALES-001': [
    {
      id: 'project-001',
      type: 'project',
      name: '华辰制造设备交付项目立项',
      owner: '王敏',
      status: 'overdue',
      plannedDate: '2026-10-19',
      updatedAt: '2026-10-20 09:30',
      progress: '立项草稿待补充项目负责人，尚未提交。',
    },
  ],
  'CT-SALES-002': [
    {
      id: 'project-002',
      type: 'project',
      name: '远景科技软件交付项目立项',
      owner: '李四',
      status: 'completed',
      plannedDate: '2026-10-19',
      updatedAt: '2026-10-19 16:00',
      progress: '项目已立项，项目负责人：赵明；进入交付准备阶段。',
    },
    {
      id: 'invoice-001',
      type: 'invoice',
      name: '第1期开票',
      owner: '李四',
      status: 'completed',
      plannedDate: '2026-10-20',
      updatedAt: '2026-10-20 09:00',
      progress: '财务已确认实际开票记录。',
      amount: 60_000,
      completedAmount: 60_000,
    },
    {
      id: 'invoice-002',
      type: 'invoice',
      name: '第2期开票',
      owner: '李四',
      status: 'pending',
      plannedDate: '2026-11-20',
      updatedAt: '2026-10-20 09:00',
      progress: '待按合同约定发起开票申请。',
      amount: 60_000,
      completedAmount: 0,
    },
    {
      id: 'invoice-003',
      type: 'invoice',
      name: '第3期开票',
      owner: '李四',
      status: 'pending',
      plannedDate: '2026-12-20',
      updatedAt: '2026-10-20 09:00',
      progress: '尚未到计划开票日期。',
      amount: 60_000,
      completedAmount: 0,
    },
    {
      id: 'collection-001',
      type: 'collection',
      name: '第1期收款',
      owner: '李四',
      status: 'in-progress',
      plannedDate: '2026-10-20',
      updatedAt: '2026-10-20 10:00',
      progress: '财务已确认到账3万元，剩余3万元由销售继续跟进。',
      amount: 60_000,
      completedAmount: 30_000,
    },
    {
      id: 'collection-002',
      type: 'collection',
      name: '第2期收款',
      owner: '李四',
      status: 'pending',
      plannedDate: '2026-11-20',
      updatedAt: '2026-10-20 10:00',
      progress: '尚未到应收日期。',
      amount: 60_000,
      completedAmount: 0,
    },
    {
      id: 'collection-003',
      type: 'collection',
      name: '第3期收款',
      owner: '李四',
      status: 'pending',
      plannedDate: '2026-12-20',
      updatedAt: '2026-10-20 10:00',
      progress: '尚未到应收日期。',
      amount: 60_000,
      completedAmount: 0,
    },
  ],
};

// 巡检计划演示数据；刷新页面后恢复。
export const mockInspectionPlans: import('#/types/inspection').InspectionPlan[] =
  [
    [
      '总部网络设备季度巡检',
      '总部网络设备运维合同',
      '华信科技',
      '总部园区',
      '执行中',
      '张三',
    ],
    [
      '生产线设备月度巡检',
      '生产线年度维保合同',
      '中粮包装',
      '一号生产车间',
      '执行中',
      '李四',
    ],
    [
      '数据中心环境巡检',
      '数据中心运维合同',
      '云启信息',
      '浦东数据中心',
      '已暂停',
      '张三',
    ],
    [
      '园区安防系统巡检',
      '园区安防维保合同',
      '华信科技',
      '总部园区',
      '待启用',
      '王五',
    ],
    [
      '仓储设备巡检',
      '仓储设备维保合同',
      '远达物流',
      '华东物流园',
      '草稿',
      '张三',
    ],
    [
      '机房专项巡检',
      '机房专项服务合同',
      '云启信息',
      '浦东数据中心',
      '已完成',
      '李四',
    ],
    [
      '旧厂区设备巡检',
      '旧厂区设备维保合同',
      '中粮包装',
      '旧厂区',
      '已终止',
      '王五',
    ],
  ].map((values, index) => {
    const [name, contract, customer, project, status, owner] = values as [
      string,
      string,
      string,
      string,
      import('#/types/inspection').InspectionStatus,
      string,
    ];
    const dates =
      index === 0
        ? ['2026-04-20', '2026-07-20', '2026-10-20', '2027-01-20']
        : ['2026-09-15', '2026-10-15', '2026-11-15', '2026-12-15'];
    return {
      id: `IP-2026-${String(index + 1).padStart(3, '0')}`,
      name,
      contract,
      customer,
      project,
      status,
      owner,
      start: '2026-02-01',
      end: '2027-01-31',
      scope: index === 0 ? '智能收单机 · 共 10 台' : '智能收单机 · 共 8 台',
      requirements:
        '检查设备运行状态、告警日志及配置备份；记录关键指标，上传现场照片，异常需提交处理建议。',
      frequency: index === 0 ? '每季度' : '每月',
      team: '华东运维组',
      advanceDays: 3,
      executions: dates.map((date, i) => {
        const done =
          status === '已完成' ||
          (i === 0 && !['待启用', '草稿'].includes(status));
        const generated =
          done ||
          (i === 1 && !['待启用', '草稿'].includes(status)) ||
          (index === 0 && i === 2);
        let executionStatus: '已完成' | '已逾期' | '待执行' | '待生成';
        if (done) executionStatus = '已完成';
        else if (generated)
          executionStatus = date < '2026-10-20' ? '已逾期' : '待执行';
        else executionStatus = '待生成';
        return {
          id: `EX-${index}-${i}`,
          date,
          owner,
          status: executionStatus,
          ticket: generated ? `XJ-2026-${index + 1}0${i + 1}` : '',
          result: done ? '设备运行正常，已完成配置备份并上传巡检照片。' : '',
          completedAt: done ? `${date} 16:30` : '',
        };
      }),
      logs: [
        {
          time: '2026-10-10 09:30',
          operator: '张三',
          content: `创建巡检计划，关联《${contract}》。`,
        },
      ],
    };
  });

export const mockInspectionTemplates: import('#/types/inspection').InspectionTemplate[] =
  [
    {
      id: 'smart-receipt',
      name: '智能收单机标准巡检',
      category: '智能收单机',
      items: [
        {
          id: 'appearance',
          name: '外观与供电',
          standard: '机身、屏幕及线缆完好，开关机正常，无异常噪声',
          required: true,
          evidence: '设备外观照片',
        },
        {
          id: 'feeding',
          name: '进纸与传动',
          standard: '使用测试纸检查进纸、走纸和出纸，无卡纸、重张或歪斜',
          required: true,
          evidence: '测试记录或现场视频',
        },
        {
          id: 'scanning',
          name: '扫描图像质量',
          standard: '测试单据图像清晰完整，无黑线、缺边、明显偏色',
          required: true,
          evidence: '脱敏测试单据扫描样张',
        },
        {
          id: 'recognition',
          name: '单据识别与上传',
          standard:
            '使用脱敏测试单据检查识别结果，确认测试记录可正常上传并在后台查询',
          required: true,
          evidence: '脱敏测试结果截图',
        },
        {
          id: 'network',
          name: '网络与应用状态',
          standard: '网络连接稳定，收单应用可正常使用，无未处理异常提示',
          required: true,
          evidence: '设备状态截图',
        },
        {
          id: 'cleaning',
          name: '清洁与耗材',
          standard:
            '清洁扫描玻璃、进纸通道和滚轮，检查易损件磨损并记录维护建议',
          required: true,
          evidence: '维护照片与记录',
        },
      ],
    },
    {
      id: 'general',
      name: '设备通用巡检',
      category: '通用',
      items: [
        {
          id: 'appearance',
          name: '外观与环境',
          standard: '设备无破损，散热与供电正常',
          required: true,
          evidence: '现场照片',
        },
        {
          id: 'status',
          name: '运行与告警',
          standard: '运行正常，无未处理异常告警',
          required: true,
          evidence: '运行记录',
        },
      ],
    },
  ];
export const mockInspectionDevices: import('#/types/inspection').InspectionDevice[] =
  [
    ...Array.from({ length: 10 }, (_, i) => ({
      id: `SDJ-${i + 1}`,
      code: `SDJ-${String(i + 1).padStart(3, '0')}`,
      name: `智能收单机 ${i % 2 === 0 ? 'D5200' : 'D3200'}（${String(i + 1).padStart(2, '0')}号）`,
      model: i % 2 === 0 ? 'D5200' : 'D3200',
      customer: '华信科技有限公司',
      project: '总部园区',
      location: i < 5 ? '总部一楼收单区' : '总部二楼财务服务区',
      category: '智能收单机',
    })),
    ...Array.from({ length: 8 }, (_, i) => ({
      id: `SDJ-ZL-${i + 1}`,
      code: `SDJ-ZL-${String(i + 1).padStart(3, '0')}`,
      name: `智能收单机 D5200（${String(i + 1).padStart(2, '0')}号）`,
      model: 'D5200',
      customer: '中粮包装',
      project: '一号生产车间',
      location: i < 4 ? '车间单据收集点' : '财务共享服务点',
      category: '智能收单机',
    })),
  ];

// 为非草稿示例计划补充启用时确认的设备与事项快照。
mockInspectionDevices.push(
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `SDJ-YQ-${i + 1}`,
    code: `SDJ-YQ-${String(i + 1).padStart(3, '0')}`,
    name: `智能收单机 D5200（${String(i + 1).padStart(2, '0')}号）`,
    model: 'D5200',
    customer: '云启信息',
    project: '浦东数据中心',
    location: '浦东单据服务区',
    category: '智能收单机',
  })),
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `SDJ-OLD-${i + 1}`,
    code: `SDJ-OLD-${String(i + 1).padStart(3, '0')}`,
    name: `智能收单机 D3200（${String(i + 1).padStart(2, '0')}号）`,
    model: 'D3200',
    customer: '中粮包装',
    project: '旧厂区',
    location: '旧厂区单据收集点',
    category: '智能收单机',
  })),
);
mockInspectionPlans.forEach((plan) => {
  if (['待启用', '草稿'].includes(plan.status)) return;
  const normalize = (value: string) =>
    value.replaceAll(/有限公司|有限责任公司/g, '').trim();
  const template = mockInspectionTemplates.find(
    (item) => item.id === 'smart-receipt',
  );
  if (!template) return;
  plan.devices = mockInspectionDevices
    .filter(
      (device) =>
        normalize(device.customer) === normalize(plan.customer) &&
        device.project === plan.project,
    )
    .slice(0, plan.id === 'IP-2026-001' ? 10 : 8)
    .map((device) => ({
      ...device,
      templateId: template.id,
      items: structuredClone(template.items),
    }));
  plan.dispatchMode = 'auto';
});

/** 未归档的模拟合同内容，仅用于演示创建时的自动收集；不冒用已有合同档案。 */
export const mockInspectionContractDraft: import('#/types/inspection').InspectionDraft =
  {
    contractId: '',
    contract: '智能收单机年度运维服务合同（模拟）',
    name: '智能收单机年度巡检计划',
    customer: '华信科技有限公司',
    project: '总部园区',
    start: '2026-11-01',
    end: '2027-10-31',
    scope: '总部园区10台智能收单机，覆盖一楼收单区及二楼财务服务区',
    frequency: '每月',
    firstDate: '',
    owner: '',
    team: '华东运维组',
    advanceDays: 3,
    requirements:
      '检查外观与供电、进纸传动、扫描图像、单据识别上传、网络应用及清洁耗材，巡检前预约客户，完成后提交巡检记录。',
    contractText:
      '合同名称：智能收单机年度运维服务合同（模拟）\n客户：华信科技有限公司\n项目：总部园区\n服务期限：2026-11-01 至 2027-10-31\n巡检范围：总部园区10台智能收单机，覆盖一楼收单区及二楼财务服务区\n巡检频次：每月一次\n执行班组：华东运维组\n检查要求：检查外观与供电、进纸传动、扫描图像、单据识别上传、网络应用及清洁耗材，巡检前预约客户，完成后提交巡检记录。',
  };
