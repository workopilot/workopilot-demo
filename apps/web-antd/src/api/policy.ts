import type {
  Policy,
  PolicyClause,
  PolicyRelease,
  PolicyVersion,
} from '#/types/policy';

import { createMockResponse, mockDelay } from './mock-data';

// Mock Data
const mockPolicies: Policy[] = [
  {
    id: '1',
    code: 'POL_TRAVEL_001',
    name: '集团差旅管理规定',
    description: '最新更新于 2025-12-25，共 45 条规则',
    category: 'travel',
    version: 'V2.1',
    status: 'active',
    ruleCount: 45,
    updatedAt: '2025-12-25',
  },
  {
    id: '2',
    code: 'POL_PURCHASE_001',
    name: '办公用品采购管理办法',
    description: '规范日常办公用品采购流程',
    category: 'purchase',
    version: 'V1.0',
    status: 'active',
    ruleCount: 12,
    updatedAt: '2025-10-01',
  },
  {
    id: '3',
    code: 'POL_FINANCE_002',
    name: '业务招待费报销指引',
    description: '适用于销售部门',
    category: 'finance',
    version: 'V3.0',
    status: 'inactive',
    ruleCount: 8,
    updatedAt: '2025-11-15',
  },
];

const mockClauses: PolicyClause[] = [
  {
    id: 'c1',
    policyId: '1',
    clauseCode: '1.1',
    title: '第一章 总则',
    content: '<p>为了规范集团差旅管理，特制定本规定。</p>',
    summary: '规范差旅管理...',
    source: 'manual',
    order: 1,
  },
  {
    id: 'c2',
    policyId: '1',
    clauseCode: '3.1',
    title: '第三章 住宿标准',
    content:
      '<p>一线城市（北京、上海、广州、深圳）住宿标准为 <strong>800元/天</strong>。</p><p>其他省会城市为 600元/天。</p>',
    summary: '上海、北京限额 800...',
    source: 'ai',
    params: { city_tier_1: 800, city_tier_2: 600 },
    order: 2,
  },
];

const mockVersions: PolicyVersion[] = [
  {
    id: 'v1',
    policyId: '1',
    version: 'V2.1',
    fileName: '集团差旅管理规定_2025.pdf',
    fileUrl: '#',
    uploader: 'Admin',
    uploadedAt: '2025-12-25 10:00:00',
    status: 'parsed',
  },
  {
    id: 'v2',
    policyId: '1',
    version: 'V2.0',
    fileName: '集团差旅管理规定_2024.docx',
    fileUrl: '#',
    uploader: 'Admin',
    uploadedAt: '2024-01-01 09:00:00',
    status: 'parsed',
  },
];

const mockReleases: PolicyRelease[] = [
  {
    id: 'r1',
    policyId: '1',
    version: 'V2.1',
    title: '2025年度调整',
    content: '1. 调整一线城市住宿标准\n2. 新增高铁二等座规定',
    publisher: 'Admin',
    publishDate: '2025-12-25 10:30:00',
  },
  {
    id: 'r2',
    policyId: '1',
    version: 'V2.0',
    title: '初始版本',
    content: '系统上线初始化',
    publisher: 'System',
    publishDate: '2024-01-01 09:00:00',
  },
];

// API Functions

export async function getPoliciesApi() {
  await mockDelay();
  return createMockResponse(mockPolicies);
}

export async function createPolicyApi(data: Partial<Policy>) {
  await mockDelay();
  const newPolicy: Policy = {
    id: String(Date.now()),
    code: data.code || '',
    name: data.name || '',
    description: data.description || '新建制度',
    category: data.category || 'other',
    version: 'V1.0',
    status: 'active',
    ruleCount: 0,
    updatedAt: new Date().toISOString().split('T')[0],
  };
  mockPolicies.unshift(newPolicy);
  return createMockResponse(newPolicy);
}

export async function getPolicyApi(id: string) {
  await mockDelay();
  const policy = mockPolicies.find((p) => p.id === id);
  if (policy) return createMockResponse(policy);
  throw new Error('Policy not found');
}

export async function updatePolicyApi(id: string, data: Partial<Policy>) {
  await mockDelay();
  const idx = mockPolicies.findIndex((p) => p.id === id);
  if (idx !== -1) {
    mockPolicies[idx] = { ...mockPolicies[idx], ...data };
    return createMockResponse(mockPolicies[idx]);
  }
  throw new Error('Policy not found');
}

export async function getPolicyClausesApi(policyId: string) {
  await mockDelay();
  return createMockResponse(mockClauses.filter((c) => c.policyId === policyId));
}

export async function createPolicyClauseApi(data: Partial<PolicyClause>) {
  await mockDelay();
  const newClause: PolicyClause = {
    id: String(Date.now()),
    policyId: data.policyId || '',
    clauseCode: data.clauseCode || String(mockClauses.length + 1),
    title: data.title || '新条款',
    content: data.content || '',
    summary: data.summary,
    source: data.source || 'manual',
    order: mockClauses.length + 1,
    ...data,
  };
  mockClauses.push(newClause);
  return createMockResponse(newClause);
}

export async function updatePolicyClauseApi(
  id: string,
  data: Partial<PolicyClause>,
) {
  await mockDelay();
  const idx = mockClauses.findIndex((c) => c.id === id);
  if (idx !== -1) {
    mockClauses[idx] = { ...mockClauses[idx], ...data };
    return createMockResponse(mockClauses[idx]);
  }
  throw new Error('Clause not found');
}

export async function deletePolicyClauseApi(id: string) {
  await mockDelay();
  const idx = mockClauses.findIndex((c) => c.id === id);
  if (idx !== -1) {
    mockClauses.splice(idx, 1);
  }
  return createMockResponse(true);
}

export async function getPolicyVersionsApi(policyId: string) {
  await mockDelay();
  const versions = mockVersions.filter((v) => v.policyId === policyId);
  return createMockResponse(versions);
}

export async function getPolicyReleasesApi(policyId: string) {
  await mockDelay();
  const releases = mockReleases.filter((r) => r.policyId === policyId);
  // Sort by date desc
  releases.sort(
    (a, b) =>
      new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime(),
  );
  return createMockResponse(releases);
}

export async function createPolicyReleaseApi(data: Partial<PolicyRelease>) {
  await mockDelay();
  const newRelease: PolicyRelease = {
    id: String(Date.now()),
    policyId: data.policyId || '',
    version: data.version || '',
    title: data.title || '',
    content: data.content || '',
    publisher: 'Current User',
    publishDate: new Date().toLocaleString(),
  };
  mockReleases.unshift(newRelease);

  // Also update the policy main version
  const policyIndex = mockPolicies.findIndex((p) => p.id === data.policyId);
  if (policyIndex !== -1) {
    mockPolicies[policyIndex].version = data.version || '';
    mockPolicies[policyIndex].updatedAt = new Date()
      .toISOString()
      .split('T')[0];
  }

  return createMockResponse(newRelease);
}

export async function deletePolicyApi(id: string) {
  await mockDelay();
  const idx = mockPolicies.findIndex((p) => p.id === id);
  if (idx !== -1) {
    mockPolicies.splice(idx, 1);
  }
  return createMockResponse(true);
}
