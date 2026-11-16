import type {
  ContractAccessGrant,
  ContractAuthorizationRule,
} from '#/types/contract-assistant';

// 授权数据与业务示例分开维护，避免公共业务数据调整影响授权页面加载。
export const mockContractAuthorizationRules: ContractAuthorizationRule[] = [
  {
    id: 'ca-admin',
    name: '合同管理人员授权',
    subjectType: 'user',
    subjectId: 'u001',
    subjectName: '张三',
    permission: 'manage',
    scope: 'all',
    categoryId: '',
    contractIds: [],
    enabled: true,
    updatedAt: '2026-10-20 10:00',
  },
  {
    id: 'ca-department',
    name: '技术部合同查阅',
    subjectType: 'department',
    subjectId: '技术部',
    subjectName: '技术部',
    permission: 'view',
    scope: 'department',
    categoryId: '',
    contractIds: [],
    enabled: true,
    updatedAt: '2026-10-20 10:00',
  },
];

export const mockContractAccessGrants: Record<string, ContractAccessGrant[]> = {
  'CT-SALES-002': [
    {
      id: 'grant-sales-002',
      userId: 'u005',
      userName: '孙七',
      permission: 'view',
      updatedAt: '2026-10-20 10:00',
    },
  ],
};
