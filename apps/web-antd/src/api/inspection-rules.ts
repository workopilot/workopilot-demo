import type { InspectionDraft, InspectionPlan } from '#/types/inspection';

export const normalizeInspectionText = (value: string) =>
  value.replaceAll(/有限责任公司|有限公司/g, '').trim();
export function inspectionOverlaps(
  plan: Partial<InspectionDraft>,
  plans: InspectionPlan[],
  excludeId = '',
) {
  return plans.filter(
    (other) =>
      other.id !== excludeId &&
      !['已完成', '已终止'].includes(other.status) &&
      (plan.contractId && other.contractId
        ? plan.contractId === other.contractId
        : !!plan.contract &&
          normalizeInspectionText(plan.contract) ===
            normalizeInspectionText(other.contract)) &&
      (!plan.scope ||
        !other.scope ||
        normalizeInspectionText(plan.scope) ===
          normalizeInspectionText(other.scope)) &&
      (!plan.start ||
        !plan.end ||
        !other.start ||
        !other.end ||
        (plan.start <= other.end && plan.end >= other.start)),
  );
}
export function inspectionExpectedCount(scope: string) {
  const match = scope.match(/(\d+)\s*台/);
  return match ? Number(match[1]) : undefined;
}
export function inspectionToday() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' });
}
export function inspectionOverdue(plan: InspectionPlan) {
  return plan.status === '执行中'
    ? plan.executions.filter(
        (item) => item.status !== '已完成' && item.date < inspectionToday(),
      ).length
    : 0;
}
export function inspectionNextDate(plan: InspectionPlan) {
  return ['已完成', '已终止', '草稿'].includes(plan.status)
    ? '—'
    : plan.executions
        .filter(
          (item) => item.status !== '已完成' && item.date >= inspectionToday(),
        )
        .map((item) => item.date)
        .toSorted()[0] || '—';
}
