import type {
  ContractAuthorizationRule,
  ContractChatSession,
  ContractPermission,
} from '#/types/contract-assistant';

import { ruleCoversContract } from '#/views/app/mate/contract-assistant/utils/authorization';

import { mockAdmins } from './mock-data';
import {
  mockContractAccessGrants,
  mockContractAuthorizationRules,
} from './mock-data-contract-authorization';
import { currentUserId, mockUsers } from './mock-data-user-groups';

export function contractUser() {
  const user = mockUsers.find((item) => item.id === currentUserId);
  return {
    id: currentUserId,
    name: user?.name || '',
    department: user?.department || '',
    roles: mockAdmins
      .filter((item) => item.realName === user?.name)
      .map((item) => item.roleId),
  };
}
export function matchesContractSubject(rule: ContractAuthorizationRule) {
  const user = contractUser();
  if (rule.subjectType === 'user') return rule.subjectId === user.id;
  if (rule.subjectType === 'department')
    return rule.subjectId === user.department;
  return user.roles.includes(rule.subjectId);
}
export function contractPermission(
  item: ContractChatSession,
): ContractPermission | undefined {
  const user = contractUser();
  const levels: ContractPermission[] = [];
  if (item.ownerId ? item.ownerId === user.id : item.owner === user.name)
    levels.push('handle');
  if (!item.managementState?.archived && item.uploadedBy === user.id)
    levels.push('handle');
  for (const rule of mockContractAuthorizationRules)
    if (
      matchesContractSubject(rule) &&
      ruleCoversContract(rule, item, user.department, user.name)
    )
      levels.push(rule.permission);
  for (const grant of mockContractAccessGrants[item.contractId || item.id] ||
    [])
    if (grant.userId === user.id) levels.push(grant.permission);
  if (levels.includes('manage')) return 'manage';
  if (levels.includes('handle')) return 'handle';
  if (levels.includes('view')) return 'view';
  return undefined;
}
export function requireContractPermission(
  item: ContractChatSession,
  permission: ContractPermission,
) {
  const rank = { view: 1, handle: 2, manage: 3 };
  const actual = contractPermission(item);
  if (!actual || rank[actual] < rank[permission])
    throw new Error(
      `没有该合同的${{ view: '查看', handle: '办理', manage: '管理' }[permission]}权限`,
    );
}
export function requireContractActive(item: ContractChatSession) {
  if (item.end) throw new Error('合同已终止或作废，不能新建业务计划');
  if (!item.managementState?.archived) throw new Error('请先完成合同建档');
}
