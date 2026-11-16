import { reactive } from 'vue';
import type { ReportKind } from '#/types/zhiji';
export type ReportApprovalRule = 'all' | 'any' | 'majority';
export const reportApprovalPolicies = reactive<
  Record<ReportKind, ReportApprovalRule>
>({ personal: 'all', project: 'all', customer: 'all', productline: 'all' });
export const reportApprovalRuleOptions = [
  { value: 'all', label: '全部通过' },
  { value: 'any', label: '任一人通过' },
  { value: 'majority', label: '超过半数通过' },
];
