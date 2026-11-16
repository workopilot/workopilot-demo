/**
 * 模型调用日志相关 API
 */

import type {
  ModelCallLog,
  ModelLogListItem,
  ModelLogQueryParams,
} from '#/types/model-logs';
import type { PaginatedResponse } from '#/types/settings';

import { createMockResponse, mockDelay, mockModelCallLogs } from './mock-data';

/**
 * 获取模型调用日志列表（分页）
 */
export async function getModelLogsApi(params: ModelLogQueryParams): Promise<{
  code: number;
  data: PaginatedResponse<ModelLogListItem>;
  message: string;
}> {
  await mockDelay();

  let filteredLogs = [...mockModelCallLogs];

  // 根据查询参数过滤
  if (params.tenantId) {
    filteredLogs = filteredLogs.filter(
      (log) => log.tenantId === params.tenantId,
    );
  }
  if (params.userId) {
    filteredLogs = filteredLogs.filter((log) => log.userId === params.userId);
  }
  if (params.requestId) {
    filteredLogs = filteredLogs.filter(
      (log) => log.requestId === params.requestId,
    );
  }
  if (params.businessType) {
    filteredLogs = filteredLogs.filter(
      (log) => log.businessType === params.businessType,
    );
  }
  if (params.businessId) {
    filteredLogs = filteredLogs.filter(
      (log) => log.businessId === params.businessId,
    );
  }
  if (params.status) {
    filteredLogs = filteredLogs.filter((log) => log.status === params.status);
  }
  if (params.modelLevel) {
    filteredLogs = filteredLogs.filter(
      (log) => log.modelLevel === params.modelLevel,
    );
  }
  if (params.modelVendor) {
    filteredLogs = filteredLogs.filter(
      (log) => log.modelVendor === params.modelVendor,
    );
  }
  if (params.requestIp) {
    filteredLogs = filteredLogs.filter(
      (log) => log.requestIp === params.requestIp,
    );
  }
  if (params.keyword) {
    const keyword = params.keyword.toLowerCase();
    filteredLogs = filteredLogs.filter(
      (log) =>
        log.promptContent.toLowerCase().includes(keyword) ||
        log.responseContent?.toLowerCase().includes(keyword),
    );
  }
  if (params.startTime) {
    filteredLogs = filteredLogs.filter(
      (log) => log.calledAt >= params.startTime,
    );
  }
  if (params.endTime) {
    filteredLogs = filteredLogs.filter((log) => log.calledAt <= params.endTime);
  }

  // 排序
  const sortBy = params.sortBy || 'calledAt';
  const sortOrder = params.sortOrder || 'desc';
  filteredLogs.sort((a, b) => {
    let aValue: number | string;
    let bValue: number | string;

    switch (sortBy) {
      case 'calledAt': {
        aValue = new Date(a.calledAt).getTime();
        bValue = new Date(b.calledAt).getTime();
        break;
      }
      case 'duration': {
        aValue = a.duration;
        bValue = b.duration;
        break;
      }
      case 'totalTokens': {
        aValue = a.totalTokens;
        bValue = b.totalTokens;
        break;
      }
      default: {
        aValue = new Date(a.calledAt).getTime();
        bValue = new Date(b.calledAt).getTime();
      }
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  // 分页
  const total = filteredLogs.length;
  const start = (params.page - 1) * params.pageSize;
  const end = start + params.pageSize;
  const paginatedLogs = filteredLogs.slice(start, end);

  // 转换为列表项格式
  const items: ModelLogListItem[] = paginatedLogs.map((log) => ({
    id: log.id,
    tenantId: log.tenantId,
    tenantName: log.tenantName,
    userId: log.userId,
    requestId: log.requestId,
    businessType: log.businessType,
    businessId: log.businessId,
    inputTokens: log.inputTokens,
    outputTokens: log.outputTokens,
    totalTokens: log.totalTokens,
    cost: log.cost,
    status: log.status,
    duration: log.duration,
    modelName: log.modelName,
    modelVendor: log.modelVendor,
    modelLevel: log.modelLevel,
    calledAt: log.calledAt,
  }));

  return createMockResponse<PaginatedResponse<ModelLogListItem>>({
    items,
    total,
    page: params.page,
    pageSize: params.pageSize,
  });
}

/**
 * 获取日志详情
 */
export async function getModelLogDetailApi(id: string): Promise<{
  code: number;
  data: ModelCallLog | undefined;
  message: string;
}> {
  await mockDelay();
  const log = mockModelCallLogs.find((l) => l.id === id);
  return createMockResponse(log);
}

/**
 * 导出日志数据
 */
export async function exportModelLogsApi(
  _params: ModelLogQueryParams,
): Promise<{
  code: number;
  data: { url: string };
  message: string;
}> {
  await mockDelay(500);

  // 模拟生成导出文件
  const timestamp = Date.now();
  const filename = `model_logs_${timestamp}.xlsx`;
  const url = `/downloads/${filename}`;

  return createMockResponse({ url });
}

/**
 * 获取统计概览
 */
export async function getModelLogsStatsApi(): Promise<{
  code: number;
  data: {
    avgDuration: number;
    failedCalls: number;
    successCalls: number;
    totalCalls: number;
    totalCost: number;
    totalTokens: number;
  };
  message: string;
}> {
  await mockDelay();

  const totalCalls = mockModelCallLogs.length;
  const successCalls = mockModelCallLogs.filter(
    (log) => log.status === 'success',
  ).length;
  const failedCalls = mockModelCallLogs.filter(
    (log) => log.status !== 'success',
  ).length;
  const totalTokens = mockModelCallLogs.reduce(
    (sum, log) => sum + log.totalTokens,
    0,
  );
  const totalCost = mockModelCallLogs.reduce((sum, log) => sum + log.cost, 0);
  const avgDuration =
    totalCalls > 0
      ? Math.round(
          mockModelCallLogs.reduce((sum, log) => sum + log.duration, 0) /
            totalCalls,
        )
      : 0;

  return createMockResponse({
    totalCalls,
    successCalls,
    failedCalls,
    totalTokens,
    totalCost: Number(totalCost.toFixed(4)),
    avgDuration,
  });
}
