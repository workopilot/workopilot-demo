/**
 * 服务调用日志相关 API
 */

import type {
  PaginatedResponse,
  ServiceCallLog,
  ServiceCallLogQueryParams,
} from '#/types/service-log';

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

// Mock 数据 - 基于数据库表 service_call_logs
export const mockServiceCallLogs: ServiceCallLog[] = [
  {
    id: '1',
    requestId: 'REQ2024122400001',
    subscriptionId: 'SUB001',
    tenantId: 'tenant_001',
    tenantName: '示例企业A',
    productId: 'prod_001',
    productSpecId: 'spec_001',
    serviceName: '智能附件分类',
    version: 'Pro',
    documentNo: 'DOC20241201001',
    callCount: 1,
    callStatus: 'success',
    requestIp: '192.168.1.100',
    requestUser: 'admin',
    requestMethod: 'POST',
    requestUrl: '/api/service/classify',
    requestHeaders: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      'X-Request-ID': 'REQ2024122400001',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    requestParams: {
      fileId: 'file_12345',
      category: 'invoice',
    },
    requestBody: {
      file: {
        name: 'invoice_20241201.pdf',
        size: 2_048_576,
        type: 'application/pdf',
      },
      options: {
        autoClassify: true,
        confidence: 0.95,
      },
    },
    responseCode: 200,
    responseTime: 1250,
    responseHeaders: {
      'Content-Type': 'application/json',
      'X-Response-Time': '1250ms',
      Server: 'nginx/1.18.0',
    },
    responseBody: {
      success: true,
      message: '分类完成',
    },
    responseData: {
      category: '增值税专用发票',
      confidence: 0.98,
      categories: [
        { name: '增值税专用发票', confidence: 0.98 },
        { name: '普通发票', confidence: 0.02 },
      ],
      processingTime: 1250,
    },
    callTime: '2024-12-24T10:30:00.000Z',
    createdAt: '2024-12-24T10:30:00.000Z',
  },
  {
    id: '2',
    requestId: 'REQ2024122400002',
    subscriptionId: 'SUB001',
    tenantId: 'tenant_001',
    tenantName: '示例企业A',
    productId: 'prod_002',
    productSpecId: 'spec_002',
    serviceName: '智能附件比对',
    version: 'Plus',
    documentNo: 'DOC20241201002',
    callCount: 2,
    callStatus: 'success',
    requestIp: '192.168.1.101',
    requestUser: 'user001',
    requestMethod: 'POST',
    requestUrl: '/api/service/compare',
    requestHeaders: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      'X-Request-ID': 'REQ2024122400002',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    requestParams: {
      fileId1: 'file_001',
      fileId2: 'file_002',
      compareType: 'strict',
    },
    requestBody: {
      files: [
        { id: 'file_001', name: 'contract_a.pdf' },
        { id: 'file_002', name: 'contract_b.pdf' },
      ],
      options: {
        compareType: 'strict',
        ignoreWhitespace: true,
      },
    },
    responseCode: 200,
    responseTime: 2340,
    responseHeaders: {
      'Content-Type': 'application/json',
      'X-Response-Time': '2340ms',
      Server: 'nginx/1.18.0',
    },
    responseBody: {
      success: true,
      message: '比对完成',
    },
    responseData: {
      similarity: 0.87,
      differences: [
        { type: 'text', location: '第3页第2行', detail: '金额不一致' },
        { type: 'format', location: '第5页', detail: '段落格式差异' },
      ],
      matchScore: 87,
    },
    callTime: '2024-12-24T10:35:00.000Z',
    createdAt: '2024-12-24T10:35:00.000Z',
  },
  {
    id: '3',
    requestId: 'REQ2024122400003',
    subscriptionId: 'SUB002',
    tenantId: 'tenant_002',
    tenantName: '示例企业B',
    productId: 'prod_003',
    productSpecId: 'spec_003',
    serviceName: '智能单据填报',
    version: 'Standard',
    documentNo: 'DOC20241201003',
    callCount: 1,
    callStatus: 'failed',
    requestIp: '192.168.1.102',
    requestUser: 'admin',
    requestMethod: 'POST',
    requestUrl: '/api/service/fill',
    requestHeaders: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      'X-Request-ID': 'REQ2024122400003',
    },
    requestParams: {
      templateId: 'tpl_001',
      mode: 'auto',
    },
    requestBody:
      '{"templateId":"tpl_001","data":{"invalid":"<script>alert(1)</script>"}}',
    responseCode: 500,
    responseTime: 890,
    responseHeaders: {
      'Content-Type': 'application/json',
      'X-Error-Code': 'SERVICE_ERROR',
      Server: 'nginx/1.18.0',
    },
    responseBody: {
      success: false,
      error: '数据格式不正确',
    },
    errorCode: 'SERVICE_ERROR',
    errorMessage: '服务处理失败:数据格式不正确，检测到非法字符',
    callTime: '2024-12-24T10:40:00.000Z',
    createdAt: '2024-12-24T10:40:00.000Z',
  },
  {
    id: '4',
    requestId: 'REQ2024122400004',
    subscriptionId: 'SUB003',
    tenantId: 'tenant_002',
    tenantName: '示例企业B',
    productId: 'prod_004',
    productSpecId: 'spec_004',
    serviceName: '智能单据审核',
    version: 'ProMax',
    documentNo: 'DOC20241201004',
    callCount: 3,
    callStatus: 'success',
    requestIp: '192.168.1.103',
    requestUser: 'user002',
    requestMethod: 'POST',
    requestUrl: '/api/service/audit',
    requestHeaders: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      'X-Request-ID': 'REQ2024122400004',
    },
    requestParams: {
      documentId: 'doc_001',
      auditLevel: 'strict',
    },
    requestBody: {
      document: { id: 'doc_001', type: 'invoice' },
      auditLevel: 'strict',
      options: { checkCompliance: true },
    },
    responseCode: 200,
    responseTime: 5670,
    responseHeaders: {
      'Content-Type': 'application/json',
      'X-Response-Time': '5670ms',
    },
    responseBody: {
      success: true,
      message: '审核完成',
    },
    responseData: {
      auditResult: 'passed',
      riskLevel: 'low',
      checkedItems: [
        { item: '发票真实性', result: 'pass' },
        { item: '金额准确性', result: 'pass' },
        { item: '税务合规性', result: 'pass' },
      ],
    },
    callTime: '2024-12-24T10:45:00.000Z',
    createdAt: '2024-12-24T10:45:00.000Z',
  },
  {
    id: '5',
    requestId: 'REQ2024122400005',
    subscriptionId: 'SUB001',
    tenantId: 'tenant_001',
    tenantName: '示例企业A',
    productId: 'prod_001',
    productSpecId: 'spec_001',
    serviceName: '智能附件分类',
    version: 'Pro',
    documentNo: 'DOC20241201005',
    callCount: 1,
    callStatus: 'success',
    requestIp: '192.168.1.104',
    requestUser: 'admin',
    requestMethod: 'POST',
    requestUrl: '/api/service/classify',
    requestHeaders: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      'X-Request-ID': 'REQ2024122400005',
    },
    requestParams: {
      fileId: 'file_67890',
      category: 'receipt',
    },
    requestBody: {
      file: { name: 'receipt_20241201.pdf', size: 1_048_576 },
      options: { autoClassify: true, multiCategory: false },
    },
    responseCode: 200,
    responseTime: 980,
    responseHeaders: {
      'Content-Type': 'application/json',
      'X-Response-Time': '980ms',
    },
    responseBody: {
      success: true,
      message: '分类完成',
    },
    responseData: {
      category: '收据',
      confidence: 0.96,
      categories: [
        { name: '收据', confidence: 0.96 },
        { name: '发票', confidence: 0.04 },
      ],
    },
    callTime: '2024-12-24T11:00:00.000Z',
    createdAt: '2024-12-24T11:00:00.000Z',
  },
  {
    id: '6',
    requestId: 'REQ2024122400006',
    subscriptionId: 'SUB004',
    tenantId: 'tenant_003',
    tenantName: '示例企业C',
    productId: 'prod_002',
    productSpecId: 'spec_002',
    serviceName: '智能附件比对',
    version: 'Plus',
    documentNo: 'DOC20241201006',
    callCount: 1,
    callStatus: 'failed',
    requestIp: '192.168.1.105',
    requestUser: 'user003',
    requestMethod: 'POST',
    requestUrl: '/api/service/compare',
    requestHeaders: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      'X-Request-ID': 'REQ2024122400006',
    },
    requestParams: {
      fileId2: 'file_002',
      compareType: 'strict',
    },
    requestBody: {
      files: [{ id: 'file_002', name: 'contract_b.pdf' }],
      options: { compareType: 'strict' },
    },
    responseCode: 400,
    responseTime: 450,
    responseHeaders: {
      'Content-Type': 'application/json',
      'X-Error-Code': 'INVALID_PARAM',
    },
    responseBody: {
      success: false,
      error: '缺少必需参数',
    },
    errorCode: 'INVALID_PARAM',
    errorMessage: '请求参数无效:缺少必需参数fileId1',
    callTime: '2024-12-24T11:15:00.000Z',
    createdAt: '2024-12-24T11:15:00.000Z',
  },
  {
    id: '7',
    requestId: 'REQ2024122400007',
    subscriptionId: 'SUB002',
    tenantId: 'tenant_002',
    tenantName: '示例企业B',
    productId: 'prod_003',
    productSpecId: 'spec_003',
    serviceName: '智能单据填报',
    version: 'Pro',
    documentNo: 'DOC20241202001',
    callCount: 2,
    callStatus: 'success',
    requestIp: '192.168.1.106',
    requestUser: 'admin',
    requestMethod: 'POST',
    requestUrl: '/api/service/fill',
    responseCode: 200,
    responseTime: 1820,
    callTime: '2024-12-23T14:20:00.000Z',
    createdAt: '2024-12-23T14:20:00.000Z',
  },
  {
    id: '8',
    requestId: 'REQ2024122300001',
    subscriptionId: 'SUB005',
    tenantId: 'tenant_001',
    tenantName: '示例企业A',
    productId: 'prod_004',
    productSpecId: 'spec_004',
    serviceName: '智能单据审核',
    version: 'ProMax',
    documentNo: 'DOC20241202002',
    callCount: 1,
    callStatus: 'success',
    requestIp: '192.168.1.107',
    requestUser: 'user001',
    requestMethod: 'POST',
    requestUrl: '/api/service/audit',
    responseCode: 200,
    responseTime: 4320,
    callTime: '2024-12-23T15:30:00.000Z',
    createdAt: '2024-12-23T15:30:00.000Z',
  },
  {
    id: '9',
    requestId: 'REQ2024122300002',
    subscriptionId: 'SUB006',
    tenantId: 'tenant_003',
    tenantName: '示例企业C',
    productId: 'prod_005',
    productSpecId: 'spec_005',
    serviceName: '信息提取服务',
    version: 'Enterprise',
    documentNo: 'DOC20241203001',
    callCount: 1,
    callStatus: 'success',
    requestIp: '192.168.1.108',
    requestUser: 'admin',
    requestMethod: 'POST',
    requestUrl: '/api/service/extract',
    responseCode: 200,
    responseTime: 3150,
    callTime: '2024-12-22T09:15:00.000Z',
    createdAt: '2024-12-22T09:15:00.000Z',
  },
  {
    id: '10',
    requestId: 'REQ2024122300003',
    subscriptionId: 'SUB003',
    tenantId: 'tenant_002',
    tenantName: '示例企业B',
    productId: 'prod_006',
    productSpecId: 'spec_006',
    serviceName: '文本翻译服务',
    version: 'Standard',
    documentNo: 'DOC20241203002',
    callCount: 5,
    callStatus: 'failed',
    requestIp: '192.168.1.109',
    requestUser: 'user002',
    requestMethod: 'POST',
    requestUrl: '/api/service/translate',
    responseCode: 503,
    responseTime: 5000,
    errorCode: 'SERVICE_UNAVAILABLE',
    errorMessage: '服务暂时不可用:翻译服务超时',
    callTime: '2024-12-22T10:20:00.000Z',
    createdAt: '2024-12-22T10:20:00.000Z',
  },
];

/**
 * 获取服务调用日志列表
 */
export async function getServiceCallLogsApi(
  params: ServiceCallLogQueryParams,
): Promise<{
  code: number;
  data: PaginatedResponse<ServiceCallLog>;
  message: string;
}> {
  await mockDelay();

  let filteredLogs = [...mockServiceCallLogs];

  // 按请求ID筛选
  if (params.requestId) {
    const requestId = params.requestId.toLowerCase();
    filteredLogs = filteredLogs.filter((log) =>
      log.requestId.toLowerCase().includes(requestId),
    );
  }

  // 按订阅ID筛选
  if (params.subscriptionId) {
    const subscriptionId = params.subscriptionId.toLowerCase();
    filteredLogs = filteredLogs.filter((log) =>
      log.subscriptionId?.toLowerCase().includes(subscriptionId),
    );
  }

  // 按租户名称筛选
  if (params.tenantName) {
    const tenantName = params.tenantName.toLowerCase();
    filteredLogs = filteredLogs.filter((log) =>
      log.tenantName?.toLowerCase().includes(tenantName),
    );
  }

  // 按服务名称筛选
  if (params.serviceName) {
    const serviceName = params.serviceName.toLowerCase();
    filteredLogs = filteredLogs.filter((log) =>
      log.serviceName.toLowerCase().includes(serviceName),
    );
  }

  // 按版本号筛选
  if (params.version) {
    const version = params.version.toLowerCase();
    filteredLogs = filteredLogs.filter((log) =>
      log.version?.toLowerCase().includes(version),
    );
  }

  // 按单号筛选
  if (params.documentNo) {
    const documentNo = params.documentNo.toLowerCase();
    filteredLogs = filteredLogs.filter((log) =>
      log.documentNo?.toLowerCase().includes(documentNo),
    );
  }

  // 按调用状态筛选
  if (params.callStatus) {
    filteredLogs = filteredLogs.filter(
      (log) => log.callStatus === params.callStatus,
    );
  }

  // 按请求IP筛选
  if (params.requestIp) {
    const requestIp = params.requestIp.toLowerCase();
    filteredLogs = filteredLogs.filter((log) =>
      log.requestIp?.toLowerCase().includes(requestIp),
    );
  }

  // 按请求用户筛选
  if (params.requestUser) {
    const requestUser = params.requestUser.toLowerCase();
    filteredLogs = filteredLogs.filter((log) =>
      log.requestUser?.toLowerCase().includes(requestUser),
    );
  }

  // 按时间范围筛选
  if (params.startTime) {
    const startTime = new Date(params.startTime).getTime();
    filteredLogs = filteredLogs.filter((log) => {
      const logTime = new Date(log.callTime).getTime();
      return logTime >= startTime;
    });
  }

  if (params.endTime) {
    const endTime = new Date(params.endTime).getTime();
    filteredLogs = filteredLogs.filter((log) => {
      const logTime = new Date(log.callTime).getTime();
      return logTime <= endTime;
    });
  }

  // 按调用时间倒序排序
  filteredLogs.sort((a, b) => {
    return new Date(b.callTime).getTime() - new Date(a.callTime).getTime();
  });

  const total = filteredLogs.length;
  const start = (params.page - 1) * params.pageSize;
  const end = start + params.pageSize;
  const items = filteredLogs.slice(start, end);

  return createMockResponse<PaginatedResponse<ServiceCallLog>>({
    items,
    total,
    page: params.page,
    pageSize: params.pageSize,
  });
}

/**
 * 获取调用日志详情
 */
export async function getServiceCallLogApi(id: string): Promise<{
  code: number;
  data: ServiceCallLog | undefined;
  message: string;
}> {
  await mockDelay();
  const log = mockServiceCallLogs.find((l) => l.id === id);
  return createMockResponse(log);
}

/**
 * 导出调用日志
 */
export async function exportServiceCallLogsApi(
  _params: ServiceCallLogQueryParams,
): Promise<{
  code: number;
  data: boolean;
  message: string;
}> {
  await mockDelay();
  return createMockResponse(true);
}

// 导出类型映射
export { CallStatusColorMap, CallStatusMap } from '#/types/service-log';
