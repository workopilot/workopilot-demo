import type { AgentTool, DataPlugin } from '#/types/tools-data';

export const mockAgentTools: AgentTool[] = [
  {
    id: '1',
    name: '企业图谱查询',
    key: 'company_search',
    type: 'MCP_HTTP',
    description: '通过企业名称查询工商信息，仅用于国内企业',
    endpoint: 'https://mcp.example.com/company',
    schema: JSON.stringify(
      {
        type: 'object',
        properties: {
          companyName: { type: 'string', description: '企业名称' },
        },
        required: ['companyName'],
      },
      null,
      2,
    ),
    status: 'active',
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-01T10:00:00Z',
  },
  {
    id: '2',
    name: '系统时间获取',
    key: 'get_current_time',
    type: 'NATIVE',
    description: '获取当前系统时间，用于时间相关的规则判断',
    nativeMethod: 'TimePlugin.GetCurrentTime',
    status: 'active',
    createdAt: '2025-01-02T11:00:00Z',
    updatedAt: '2025-01-02T11:00:00Z',
  },
];

export const mockDataPlugins: DataPlugin[] = [
  {
    id: '1',
    code: 'HR_SYSTEM',
    name: 'HR人力资源系统',
    baseUrl: 'https://hr-api.internal',
    description: '对接公司内部HR系统，获取员工信息',
    authType: 'BEARER',
    authToken: 'sk-hr-token-123456',
    status: 'active',
    services: [
      {
        id: 's1',
        relativeUrl: '/api/v1/staff/info',
        method: 'GET',
        description: 'Query: employeeId (员工工号)',
        returnType: '{ name: string, department: string, level: string }',
      },
      {
        id: 's2',
        relativeUrl: '/api/v1/staff/leave-balance',
        method: 'GET',
        description: 'Query: employeeId (员工工号)',
        returnType: '{ annual: number, sick: number }',
      },
    ],
    createdAt: '2025-01-05T09:00:00Z',
    updatedAt: '2025-01-05T09:00:00Z',
  },
  {
    id: '2',
    code: 'CRM_SYSTEM',
    name: 'CRM客户管理系统',
    baseUrl: 'https://crm-api.internal',
    description: '客户关系管理系统接口',
    authType: 'API_KEY',
    authToken: 'crm-secret-key',
    status: 'active',
    services: [
      {
        id: 's3',
        relativeUrl: '/api/customers/search',
        method: 'POST',
        description: 'Body: { keyword: string }',
        returnType: 'Array<{ id: string, name: string, industry: string }>',
      },
    ],
    createdAt: '2025-01-06T10:00:00Z',
    updatedAt: '2025-01-06T10:00:00Z',
  },
];

export function mockDelay(ms: number = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createMockResponse<T>(data: T) {
  return {
    code: 0,
    data,
    message: 'success',
  };
}
