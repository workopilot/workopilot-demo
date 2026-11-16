import type { AuditRule, AuditScheme } from '#/types/audit';

import {
  createMockResponse,
  mockAuditRules,
  mockAuditSchemes,
  mockDelay,
} from './mock-data-audit';

export { mockDelay };

// --- Audit Rules ---

export async function getAuditRulesApi() {
  await mockDelay();
  return createMockResponse(mockAuditRules);
}

export async function createAuditRuleApi(data: Partial<AuditRule>) {
  await mockDelay();
  const newRule: AuditRule = {
    id: String(Date.now()),
    code: data.code || `RULE_${Date.now()}`,
    name: data.name || '未命名规则',
    scope: data.scope || 'line',
    prompt: data.prompt || '',
    version: 'V1.0',
    status: 'active',
    dataSources: data.dataSources || [],
    tools: data.tools || [],
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...data,
  };
  mockAuditRules.push(newRule);
  return createMockResponse(newRule);
}

export async function updateAuditRuleApi(id: string, data: Partial<AuditRule>) {
  await mockDelay();
  const index = mockAuditRules.findIndex((r) => r.id === id);
  if (index !== -1) {
    mockAuditRules[index] = {
      ...mockAuditRules[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return createMockResponse(mockAuditRules[index]);
  }
  throw new Error('Rule not found');
}

export async function deleteAuditRuleApi(id: string) {
  await mockDelay();
  const index = mockAuditRules.findIndex((r) => r.id === id);
  if (index !== -1) {
    if (mockAuditRules[index].usageCount > 0) {
      throw new Error(
        `该规则正在被 ${mockAuditRules[index].usageCount} 个方案使用，无法删除。`,
      );
    }
    mockAuditRules.splice(index, 1);
  }
  return createMockResponse(undefined);
}

// --- Audit Schemes ---

export async function getAuditSchemesApi() {
  await mockDelay();
  return createMockResponse(mockAuditSchemes);
}

export async function createAuditSchemeApi(data: Partial<AuditScheme>) {
  await mockDelay();
  const newScheme: AuditScheme = {
    id: String(Date.now()),
    name: data.name || '未命名方案',
    billType: data.billType || '',
    globalConfidenceThreshold: data.globalConfidenceThreshold || 60,
    rules: data.rules || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...data,
  };
  mockAuditSchemes.push(newScheme);
  return createMockResponse(newScheme);
}

export async function updateAuditSchemeApi(
  id: string,
  data: Partial<AuditScheme>,
) {
  await mockDelay();
  const index = mockAuditSchemes.findIndex((s) => s.id === id);
  if (index !== -1) {
    mockAuditSchemes[index] = {
      ...mockAuditSchemes[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return createMockResponse(mockAuditSchemes[index]);
  }
  throw new Error('Scheme not found');
}

export async function deleteAuditSchemeApi(id: string) {
  await mockDelay();
  const index = mockAuditSchemes.findIndex((s) => s.id === id);
  if (index !== -1) {
    mockAuditSchemes.splice(index, 1);
  }
  return createMockResponse(undefined);
}
