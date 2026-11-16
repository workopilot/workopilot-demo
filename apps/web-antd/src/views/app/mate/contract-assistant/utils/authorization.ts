import type {
  ContractAuthorizationRule,
  ContractChatSession,
  ContractPermission,
} from '#/types/contract-assistant';

export const contractPermissionOptions = [
  { value: 'view', label: '查看' },
  { value: 'handle', label: '办理' },
  { value: 'manage', label: '管理' },
];
export const contractScopeOptions = [
  { value: 'owned', label: '本人负责的合同' },
  { value: 'department', label: '本部门合同' },
  { value: 'all', label: '全部合同' },
  { value: 'specified', label: '指定合同' },
];
export const permissionLabel = (value: ContractPermission) =>
  contractPermissionOptions.find((item) => item.value === value)?.label ||
  value;
export function ruleCoversContract(
  rule: ContractAuthorizationRule,
  contract: ContractChatSession,
  subjectDepartment?: string,
  personName?: string,
) {
  if (
    !rule.enabled ||
    (rule.categoryId && rule.categoryId !== contract.scheme?.id)
  )
    return false;
  if (rule.scope === 'all') return true;
  if (rule.scope === 'specified') return rule.contractIds.includes(contract.id);
  if (rule.scope === 'owned')
    return (
      !!contract.owner &&
      (personName || (rule.subjectType === 'user' ? rule.subjectName : '')) ===
        contract.owner
    );
  return (
    !!contract.department &&
    contract.department ===
      (rule.subjectType === 'department' ? rule.subjectId : subjectDepartment)
  );
}
export function validateAuthorizationRule(rule: ContractAuthorizationRule) {
  if (!rule.name.trim()) return '请填写规则名称';
  if (!rule.subjectId || !rule.subjectName) return '请选择授权对象';
  if (!['department', 'role', 'user'].includes(rule.subjectType))
    return '请选择授权对象类型';
  if (!['handle', 'manage', 'view'].includes(rule.permission))
    return '请选择合同权限';
  if (!contractScopeOptions.some((item) => item.value === rule.scope))
    return '请选择合同范围';
  if (rule.scope === 'specified' && rule.contractIds.length === 0)
    return '请选择至少一份合同';
  return '';
}
