import type { AiServiceDef, AiServiceQuery } from '#/types/aiservice';
// --- API Key Management APIs ---
import type { AiApiKey } from '#/types/aiservice';

import {
  createMockResponse,
  generateMockAccessKey,
  mockAiModels,
  mockAiServices,
  mockAiTags,
  mockAiTools,
  mockApiKeyLogs,
  mockApiKeys,
  mockApiKeysList,
  mockDelay,
} from './mock-data';

/**
 * Get AI Service List
 */
export async function getAiServiceListApi(params: AiServiceQuery) {
  await mockDelay();
  let result = [...mockAiServices];

  if (params.serviceName) {
    result = result.filter((item) =>
      item.serviceName.includes(params.serviceName!),
    );
  }
  if (params.serviceCode) {
    result = result.filter((item) =>
      item.serviceCode.includes(params.serviceCode!),
    );
  }
  if (params.isActive !== undefined) {
    const activeBool = params.isActive === 1;
    result = result.filter((item) => item.isActive === activeBool);
  }
  if (params.tags && params.tags.length > 0) {
    result = result.filter(
      (item) => item.tags && item.tags.some((t) => params.tags!.includes(t)),
    );
  }

  // Pagination
  const { pageIndex = 1, pageSize = 20 } = params;
  const total = result.length;
  const start = (pageIndex - 1) * pageSize;
  const end = start + pageSize;
  const rows = result.slice(start, end);

  return createMockResponse({
    rows,
    total,
  });
}

/**
 * Get AI Service Detail
 */
export async function getAiServiceApi(id: string) {
  await mockDelay();
  const item = mockAiServices.find((s) => s.id === id);
  if (!item) {
    throw new Error('Service not found');
  }
  return createMockResponse(item);
}

/**
 * Save AI Service (Create or Update)
 */
export async function saveAiServiceApi(data: AiServiceDef) {
  await mockDelay();
  if (data.id && data.id !== '0') {
    // Update
    const index = mockAiServices.findIndex((s) => s.id === data.id);
    if (index !== -1) {
      mockAiServices[index] = {
        ...mockAiServices[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      return createMockResponse(data.id);
    }
    throw new Error('Service not found');
  } else {
    // Create
    const newId = String(Date.now());
    const newItem: AiServiceDef = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockAiServices.push(newItem);
    return createMockResponse(newId);
  }
}

/**
 * Delete AI Service
 */
export async function deleteAiServiceApi(id: string) {
  await mockDelay();
  const index = mockAiServices.findIndex((s) => s.id === id);
  if (index !== -1) {
    mockAiServices.splice(index, 1);
  }
  return createMockResponse(true);
}

/**
 * Get AI Models
 */
export async function getAiModelsApi() {
  await mockDelay();
  return createMockResponse(mockAiModels);
}

/**
 * Get AI Tools
 */
export async function getAiToolsApi() {
  await mockDelay();
  return createMockResponse(mockAiTools);
}

/**
 * Get API Keys
 */
export async function getApiKeysApi() {
  await mockDelay();
  return createMockResponse(mockApiKeys);
}

/**
 * Get AI Tags
 */
export async function getAiTagsApi() {
  await mockDelay();
  return createMockResponse(mockAiTags);
}

/**
 * Get API Key List
 */
export async function getApiKeyListApi(params?: {
  remark?: string;
  status?: number;
}) {
  await mockDelay();
  let result = [...mockApiKeysList];
  if (params?.status !== undefined) {
    result = result.filter((item) => item.status === params.status);
  }
  if (params?.remark) {
    result = result.filter((item) => item.remark.includes(params.remark!));
  }
  // Sort by createdTime desc
  result.sort(
    (a, b) =>
      new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime(),
  );
  return createMockResponse(result);
}

/**
 * Create API Key
 */
export async function createApiKeyApi(data: Partial<AiApiKey>) {
  await mockDelay();
  const newId = String(Date.now());
  const newItem: AiApiKey = {
    id: newId,
    tenantId: 'tenant_default',
    createdBy: 'user_current',
    createdTime: new Date().toISOString(),
    remark: data.remark || '',
    accessKey: generateMockAccessKey(),
    permissions: ['*'], // Default to all permissions for now
    expirationTime: data.expirationTime,
    status: 1,
  };
  mockApiKeysList.unshift(newItem); // Add to beginning
  return createMockResponse(newItem);
}

/**
 * Revoke API Key (Disable)
 */
export async function revokeApiKeyApi(id: string) {
  await mockDelay();
  const item = mockApiKeysList.find((k) => k.id === id);
  if (item) {
    item.status = 0;
    return createMockResponse(true);
  }
  throw new Error('API Key not found');
}

/**
 * Delete API Key
 */
export async function deleteApiKeyApi(id: string) {
  await mockDelay();
  const index = mockApiKeysList.findIndex((k) => k.id === id);
  if (index !== -1) {
    mockApiKeysList.splice(index, 1);
    return createMockResponse(true);
  }
  return createMockResponse(false);
}

/**
 * Get API Key Logs
 */
export async function getApiKeyLogsApi(
  apiKeyId: string,
  params?: {
    endTime?: string;
    keyword?: string;
    startTime?: string;
  },
) {
  await mockDelay();
  let logs = mockApiKeyLogs.filter((l) => l.apiKeyId === apiKeyId);

  if (params) {
    if (params.startTime) {
      logs = logs.filter(
        (l) => new Date(l.createdTime) >= new Date(params.startTime!),
      );
    }
    if (params.endTime) {
      logs = logs.filter(
        (l) => new Date(l.createdTime) <= new Date(params.endTime!),
      );
    }
    if (params.keyword) {
      const lowerKeyword = params.keyword.toLowerCase();
      logs = logs.filter(
        (l) =>
          l.requestUrl.toLowerCase().includes(lowerKeyword) ||
          l.requestData.toLowerCase().includes(lowerKeyword) ||
          l.responseData.toLowerCase().includes(lowerKeyword),
      );
    }
  }

  // Sort logs desc
  logs.sort(
    (a, b) =>
      new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime(),
  );
  return createMockResponse(logs);
}
