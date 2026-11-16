/**
 * 开发者管理 API(前端 Mock)
 */

import type {
  Developer,
  DeveloperListResult,
  DeveloperQueryParams,
  RechargePayload,
} from '#/types/developer-management';

import { createMockResponse, mockDelay } from './mock-data';

// Mock 种子数据(内存持久化,刷新重置)
const mockDevelopers: Developer[] = [
  {
    id: 'DEV-001',
    tenantName: '张氏人工智能服务公司',
    ownerName: '张丽峰',
    activatedAt: '2024-03-15T08:00:00.000Z',
    consumedTokens: 1_280_000,
    availableTokens: 3_720_000,
    updatedAt: '2026-06-12T10:20:00.000Z',
  },
  {
    id: 'DEV-002',
    tenantName: '云图数据科技',
    ownerName: '李哲',
    activatedAt: '2024-06-20T09:30:00.000Z',
    consumedTokens: 865_400,
    availableTokens: 2_134_600,
    updatedAt: '2026-06-10T14:05:00.000Z',
  },
  {
    id: 'DEV-003',
    tenantName: '智链软件开发工作室',
    ownerName: '王强',
    activatedAt: '2025-01-08T11:00:00.000Z',
    consumedTokens: 432_100,
    availableTokens: 567_900,
    updatedAt: '2026-05-28T16:40:00.000Z',
  },
  {
    id: 'DEV-004',
    tenantName: '远景智能(杭州)',
    ownerName: '赵敏',
    activatedAt: '2025-04-12T10:15:00.000Z',
    consumedTokens: 1_980_500,
    availableTokens: 19_500,
    updatedAt: '2026-06-15T09:12:00.000Z',
  },
  {
    id: 'DEV-005',
    tenantName: '蜂巢信息科技',
    ownerName: '陈杰',
    activatedAt: '2025-07-03T13:45:00.000Z',
    consumedTokens: 326_800,
    availableTokens: 1_673_200,
    updatedAt: '2026-06-08T11:30:00.000Z',
  },
  {
    id: 'DEV-006',
    tenantName: '量子跃迁实验室',
    ownerName: '刘洋',
    activatedAt: '2025-09-19T08:50:00.000Z',
    consumedTokens: 92_400,
    availableTokens: 907_600,
    updatedAt: '2026-06-05T17:20:00.000Z',
  },
  {
    id: 'DEV-007',
    tenantName: '蓝鲸数字科技',
    ownerName: '周婷',
    activatedAt: '2025-11-25T15:00:00.000Z',
    consumedTokens: 56_300,
    availableTokens: 943_700,
    updatedAt: '2026-05-30T10:00:00.000Z',
  },
  {
    id: 'DEV-008',
    tenantName: '极客联合工作室',
    ownerName: '吴磊',
    activatedAt: '2026-01-14T09:00:00.000Z',
    consumedTokens: 18_900,
    availableTokens: 481_100,
    updatedAt: '2026-06-13T13:15:00.000Z',
  },
];

/**
 * 获取开发者列表(支持关键词模糊匹配租户名称 + 分页)
 */
export async function getDevelopersApi(params: DeveloperQueryParams) {
  await mockDelay();

  const { keyword, page, pageSize } = params;

  let list = [...mockDevelopers];

  if (keyword) {
    const kw = keyword.trim().toLowerCase();
    list = list.filter((item) => item.tenantName.toLowerCase().includes(kw));
  }

  // 按开通时间倒序
  list.sort((a, b) => (a.activatedAt < b.activatedAt ? 1 : -1));

  const total = list.length;
  const start = (page - 1) * pageSize;
  const items = list.slice(start, start + pageSize);

  return createMockResponse<DeveloperListResult>({ items, total });
}

/**
 * 开发者充值(增加可用 Token)
 */
export async function rechargeDeveloperApi(
  id: string,
  payload: RechargePayload,
) {
  await mockDelay();
  const index = mockDevelopers.findIndex((d) => d.id === id);
  if (index === -1) {
    throw new Error('开发者记录不存在');
  }
  mockDevelopers[index] = {
    ...mockDevelopers[index],
    availableTokens: mockDevelopers[index].availableTokens + payload.amount,
    updatedAt: new Date().toISOString(),
  };
  return createMockResponse(mockDevelopers[index]);
}
