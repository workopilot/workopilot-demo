import type { AgentItem, BillRecord } from '#/types/agent';

import {
  createMockResponse,
  mockAgents,
  mockBillRecords,
  mockDelay,
} from './mock-agent-data';

/**
 * Get list of agents
 */
export async function getAgentsApi() {
  await mockDelay();
  return createMockResponse<AgentItem[]>(mockAgents);
}

/**
 * 单据查询接口
 * @param params 查询参数
 * @param params.billNo 单据编号
 * @param params.billType 单据类型
 * @param params.systemId 业务系统ID
 * @param params.auditStatus 审核状态
 * @param params.auditDateRange 审核时间范围
 * @param params.dateRange 日期范围
 */
export async function getBillRecordsApi(params?: {
  auditDateRange?: any;
  auditStatus?: string;
  billNo?: string;
  billType?: string;
  dateRange?: any;
  systemId?: string;
}) {
  await mockDelay();

  // 模拟筛选逻辑
  let filteredData = [...mockBillRecords];

  if (params?.billNo) {
    filteredData = filteredData.filter((record) =>
      record.billNo.includes(params.billNo || ''),
    );
  }

  if (params?.billType) {
    filteredData = filteredData.filter(
      (record) => record.billType === params.billType,
    );
  }

  if (params?.systemId) {
    filteredData = filteredData.filter(
      (record) => record.systemId === params.systemId,
    );
  }

  if (params?.auditStatus) {
    filteredData = filteredData.filter(
      (record) => record.auditStatus === params.auditStatus,
    );
  }

  if (params?.auditDateRange && params.auditDateRange.length === 2) {
    const [startDate, endDate] = params.auditDateRange;
    filteredData = filteredData.filter((record) => {
      if (!record.auditDate) return false;
      const auditDateTime = new Date(record.auditDate).getTime();
      const startTime = new Date(
        startDate.format('YYYY-MM-DD 00:00:00'),
      ).getTime();
      const endTime = new Date(endDate.format('YYYY-MM-DD 23:59:59')).getTime();
      return auditDateTime >= startTime && auditDateTime <= endTime;
    });
  }

  // 按审核时间降序排序（最新的在前）
  filteredData.sort((a, b) => {
    // 如果两个单据都有审核时间，按审核时间降序
    if (a.auditDate && b.auditDate) {
      return new Date(b.auditDate).getTime() - new Date(a.auditDate).getTime();
    }
    // 如果只有单据 a 有审核时间，a 排在前面
    if (a.auditDate && !b.auditDate) return -1;
    // 如果只有单据 b 有审核时间，b 排在前面
    if (!a.auditDate && b.auditDate) return 1;
    // 如果都没有审核时间，按创建时间降序
    return (
      new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
    );
  });

  return createMockResponse<BillRecord[]>(filteredData);
}
