import type {
  ContractAccessEntry,
  ContractAccessGrant,
  ContractAuthorizationRule,
  ContractPermission,
} from '#/types/contract-assistant';

import {
  ruleCoversContract,
  validateAuthorizationRule,
} from '#/views/app/mate/contract-assistant/utils/authorization';

import {
  contractPermission,
  requireContractPermission,
} from './contract-permissions';
import { rawContract } from './contract-state';
import {
  createMockResponse,
  mockAdmins,
  mockDelay,
  mockRoles,
} from './mock-data';
import {
  mockContractAccessGrants,
  mockContractAuthorizationRules,
} from './mock-data-contract-authorization';
import { currentUserId, mockUsers } from './mock-data-user-groups';

const now = () =>
  new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' });
function userRoles(userId: string) {
  const user = mockUsers.find((item) => item.id === userId);
  return mockAdmins
    .filter((item) => item.realName === user?.name)
    .map((item) => item.roleId);
}
function matchesCurrentUser(rule: ContractAuthorizationRule) {
  if (rule.subjectType === 'user') return rule.subjectId === currentUserId;
  const user = mockUsers.find((item) => item.id === currentUserId);
  if (rule.subjectType === 'department')
    return rule.subjectId === user?.department;
  return userRoles(currentUserId).includes(rule.subjectId);
}
function canManageRules() {
  return mockContractAuthorizationRules.some(
    (rule) =>
      rule.enabled &&
      rule.permission === 'manage' &&
      rule.scope === 'all' &&
      !rule.categoryId &&
      matchesCurrentUser(rule),
  );
}
function requireRuleManager() {
  if (!canManageRules())
    throw new Error('当前用户没有默认合同授权规则的管理权限');
}
export async function getContractAuthorizationOptions() {
  await mockDelay(100);
  return createMockResponse({
    users: mockUsers.map((item) => ({
      value: item.id,
      label: item.name,
      department: item.department,
    })),
    departments: [...new Set(mockUsers.map((item) => item.department))].map(
      (value) => ({ value, label: value }),
    ),
    roles: mockRoles
      .filter((item) => item.status === 'enabled')
      .map((item) => ({ value: item.id, label: item.name })),
    canManage: canManageRules(),
  });
}
export async function getContractAuthorizationRules() {
  requireRuleManager();
  await mockDelay(100);
  return createMockResponse(structuredClone(mockContractAuthorizationRules));
}
export async function saveContractAuthorizationRule(
  value: ContractAuthorizationRule,
) {
  requireRuleManager();
  const error = validateAuthorizationRule(value);
  if (error) throw new Error(error);
  const copy = structuredClone(value);
  if (copy.scope !== 'specified') copy.contractIds = [];
  const index = mockContractAuthorizationRules.findIndex(
    (item) => item.id === copy.id,
  );
  // 不允许在当前操作中移除自己管理默认授权规则的最后一条授权。
  const candidate =
    index === -1
      ? [...mockContractAuthorizationRules, copy]
      : mockContractAuthorizationRules.map((item, i) =>
          i === index ? copy : item,
        );
  if (
    !candidate.some(
      (rule) =>
        rule.enabled &&
        rule.permission === 'manage' &&
        rule.scope === 'all' &&
        !rule.categoryId &&
        matchesCurrentUser(rule),
    )
  )
    throw new Error('请保留当前用户至少一条全部合同的管理授权');
  copy.updatedAt = now();
  if (index === -1) mockContractAuthorizationRules.push(copy);
  else mockContractAuthorizationRules[index] = copy;
  await mockDelay(100);
  return createMockResponse(structuredClone(copy));
}
export async function deleteContractAuthorizationRule(id: string) {
  requireRuleManager();
  const rule = mockContractAuthorizationRules.find((item) => item.id === id);
  if (!rule) throw new Error('授权规则不存在');
  await saveContractAuthorizationRule({ ...rule, enabled: false });
  mockContractAuthorizationRules.splice(
    mockContractAuthorizationRules.findIndex((item) => item.id === id),
    1,
  );
  return createMockResponse(true);
}
async function contractContext(id: string) {
  const contract = rawContract(id);
  requireContractPermission(contract, 'view');
  const grants = mockContractAccessGrants[id] || [];
  const canManage = contractPermission(contract) === 'manage';
  return { contract, grants, canManage };
}
export async function getContractAccess(id: string) {
  const { contract, grants, canManage } = await contractContext(id);
  const entries: ContractAccessEntry[] = [];
  for (const rule of mockContractAuthorizationRules) {
    let users: (typeof mockUsers)[number][];
    if (rule.subjectType === 'user') {
      users = mockUsers.filter((user) => user.id === rule.subjectId);
    } else if (rule.subjectType === 'department') {
      users = mockUsers.filter((user) => user.department === rule.subjectId);
    } else {
      users = mockUsers.filter((user) =>
        userRoles(user.id).includes(rule.subjectId),
      );
    }
    const covered = users.filter((user) =>
      ruleCoversContract(rule, contract, user.department, user.name),
    );
    if (covered.length > 0)
      entries.push({
        id: `rule-${rule.id}`,
        name: rule.subjectName,
        permission: rule.permission,
        source: 'rule',
        sourceLabel: `默认规则 · ${rule.name}`,
      });
  }
  if (contract.owner)
    entries.push({
      id: 'owner',
      name: contract.owner,
      permission: 'handle',
      source: 'owner',
      sourceLabel: '合同负责人',
    });
  entries.push(
    ...grants.map((grant) => ({
      id: grant.id,
      name: grant.userName,
      userId: grant.userId,
      permission: grant.permission,
      source: 'manual' as const,
      sourceLabel: '单独授权',
      grantId: grant.id,
    })),
  );
  return createMockResponse({ entries, canManage });
}
export async function saveContractAccessGrant(
  contractId: string,
  userId: string,
  permission: ContractPermission,
) {
  const { grants, canManage } = await contractContext(contractId);
  if (!canManage) throw new Error('当前用户没有本合同的授权管理权限');
  const user = mockUsers.find((item) => item.id === userId);
  if (!user) throw new Error('请选择有效人员');
  if (!['handle', 'manage', 'view'].includes(permission))
    throw new Error('请选择合同权限');
  const grant: ContractAccessGrant = {
    id:
      grants.find((item) => item.userId === userId)?.id ||
      `grant-${Date.now()}-${userId}`,
    userId,
    userName: user.name,
    permission,
    updatedAt: now(),
  };
  const index = grants.findIndex((item) => item.userId === userId);
  if (index === -1) grants.push(grant);
  else grants[index] = grant;
  mockContractAccessGrants[contractId] = grants;
  return createMockResponse(structuredClone(grant));
}
export async function removeContractAccessGrant(
  contractId: string,
  grantId: string,
) {
  const { grants, canManage } = await contractContext(contractId);
  if (!canManage) throw new Error('当前用户没有本合同的授权管理权限');
  mockContractAccessGrants[contractId] = grants.filter(
    (item) => item.id !== grantId,
  );
  return createMockResponse(true);
}
