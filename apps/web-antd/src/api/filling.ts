/**
 * 智能填报相关 API
 */

import type {
  FillingLog,
  FillingLogQueryParams,
  PaginatedResponse,
} from '#/types/filling';

import {
  createMockResponse,
  mockDelay,
  mockFillingLogs,
} from './mock-filling-data';

/**
 * 获取填报日志列表（分页）
 */
export async function getFillingLogsApi(
  params: FillingLogQueryParams,
): Promise<{
  code: number;
  data: PaginatedResponse<FillingLog>;
  message: string;
}> {
  await mockDelay();

  let filteredLogs = [...mockFillingLogs];

  // 根据查询参数过滤
  if (params.billNo) {
    filteredLogs = filteredLogs.filter((log) =>
      log.billNo.includes(params.billNo!),
    );
  }
  if (params.billType) {
    filteredLogs = filteredLogs.filter(
      (log) => log.billType === params.billType,
    );
  }
  if (params.scriptId) {
    filteredLogs = filteredLogs.filter(
      (log) => log.scriptId === params.scriptId,
    );
  }
  if (params.status) {
    filteredLogs = filteredLogs.filter((log) => log.status === params.status);
  }
  if (params.billStatus) {
    filteredLogs = filteredLogs.filter(
      (log) => log.billStatus === params.billStatus,
    );
  }
  if (params.startTime) {
    filteredLogs = filteredLogs.filter(
      (log) => log.filledAt >= params.startTime!,
    );
  }
  if (params.endTime) {
    filteredLogs = filteredLogs.filter(
      (log) => log.filledAt <= params.endTime!,
    );
  }

  // 排序
  const sortBy = params.sortBy || 'filledAt';
  const sortOrder = params.sortOrder || 'desc';
  filteredLogs.sort((a, b) => {
    let aValue: number | string;
    let bValue: number | string;

    switch (sortBy) {
      case 'billNo': {
        aValue = a.billNo;
        bValue = b.billNo;
        break;
      }
      case 'duration': {
        aValue = a.duration;
        bValue = b.duration;
        break;
      }
      case 'filledAt': {
        aValue = new Date(a.filledAt).getTime();
        bValue = new Date(b.filledAt).getTime();
        break;
      }
      default: {
        aValue = new Date(a.filledAt).getTime();
        bValue = new Date(b.filledAt).getTime();
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

  return createMockResponse<PaginatedResponse<FillingLog>>({
    items: paginatedLogs,
    total,
    page: params.page,
    pageSize: params.pageSize,
  });
}

/**
 * 获取填报日志详情
 */
export async function getFillingLogDetailApi(
  id: string,
): Promise<{ code: number; data: FillingLog | undefined; message: string }> {
  await mockDelay();
  const log = mockFillingLogs.find((l) => l.id === id);
  return createMockResponse(log);
}

/**
 * 导出填报日志
 */
export async function exportFillingLogsApi(
  _params: FillingLogQueryParams,
): Promise<{ code: number; data: { url: string }; message: string }> {
  await mockDelay(500);

  // 模拟生成导出文件
  const timestamp = Date.now();
  const filename = `filling_logs_${timestamp}.xlsx`;
  const url = `/downloads/${filename}`;

  return createMockResponse({ url });
}

/**
 * 获取填报日志统计
 */
export async function getFillingLogsStatsApi(): Promise<{
  code: number;
  data: {
    avgDuration: number;
    failedCount: number;
    successCount: number;
    totalCount: number;
  };
  message: string;
}> {
  await mockDelay();

  const totalCount = mockFillingLogs.length;
  const successCount = mockFillingLogs.filter(
    (log) => log.status === 'success',
  ).length;
  const failedCount = mockFillingLogs.filter(
    (log) => log.status === 'failed',
  ).length;
  const avgDuration =
    totalCount > 0
      ? Math.round(
          mockFillingLogs.reduce((sum, log) => sum + log.duration, 0) /
            totalCount,
        )
      : 0;

  return createMockResponse({
    totalCount,
    successCount,
    failedCount,
    avgDuration,
  });
}
