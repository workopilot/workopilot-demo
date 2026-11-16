import type { ContractPermission } from '#/types/contract-assistant';
import type { InspectionDraft } from '#/types/inspection';

import {
  requireContractActive,
  requireContractPermission,
} from './contract-permissions';
import {
  contractArchives,
  contractNow,
  contractToday,
  rawContract,
  relatedContractItems,
} from './contract-state';
import * as inspection from './inspection';
import * as execution from './inspection-execution';
import { createMockResponse, mockInspectionPlans } from './mock-data';
import { mockWorkOrders } from './mock-data-ticket';

export { inspectionStaff } from './inspection-execution';
function check(planId: string, permission: ContractPermission = 'handle') {
  const plan = mockInspectionPlans.find((item) => item.id === planId);
  if (!plan) throw new Error('计划不存在');
  if (plan.contractId)
    requireContractPermission(rawContract(plan.contractId), permission);
  return plan;
}
function active(planId: string) {
  const plan = check(planId);
  if (plan.contractId) {
    const contract = rawContract(plan.contractId);
    requireContractActive(contract);
    if (!contract.managementState?.dateConfirmed)
      throw new Error('合同日期尚未确认，不能启用或生成工单');
    if (
      (relatedContractItems.get(plan.contractId) || []).some(
        (item) => item.id === planId && item.needsReview,
      )
    )
      throw new Error('合同变更待核对，请先在计划详情记录核对结果');
  }
  return plan;
}
export function syncContractInspectionProgress() {
  for (const plan of mockInspectionPlans) {
    if (!plan.contractId || !contractArchives.has(plan.contractId)) continue;
    for (const row of plan.executions) {
      const ticket = mockWorkOrders.find((item) => item.code === row.ticket);
      if (ticket && ['closed', 'completed'].includes(ticket.status)) {
        row.status = '已完成';
        row.completedAt =
          ticket.completedAt || row.completedAt || contractNow();
        row.result = ticket.solution || row.result || '工单已完成';
      }
    }
    const completed = plan.executions.filter(
      (row) => row.status === '已完成',
    ).length;
    if (plan.executions.length > 0 && completed === plan.executions.length)
      plan.status = '已完成';
    const items = relatedContractItems.get(plan.contractId) || [];
    const old = items.find((item) => item.id === plan.id);
    let status: 'completed' | 'in-progress' | 'overdue' | 'pending';
    if (plan.status === '已完成') {
      status = 'completed';
    } else if (
      plan.executions.some(
        (row) => row.date < contractToday() && row.status !== '已完成',
      )
    ) {
      status = 'overdue';
    } else if (plan.status === '草稿') {
      status = 'pending';
    } else {
      status = 'in-progress';
    }
    const item = {
      ...old,
      id: plan.id,
      type: 'inspection' as const,
      name: plan.name,
      owner: plan.owner,
      status,
      plannedDate:
        plan.executions.find((row) => row.status !== '已完成')?.date ||
        plan.firstDate ||
        plan.start,
      updatedAt:
        [plan.logs[0]?.time, ...plan.executions.map((row) => row.completedAt)]
          .filter((value): value is string => !!value)
          .toSorted((a, b) => Date.parse(a) - Date.parse(b))
          .at(-1) || contractNow(),
      progress: `${plan.status}；已完成${completed}/${plan.executions.length}次巡检${old?.reviewNote ? `；变更核对：${old.reviewNote}` : ''}`,
      plannedCount: plan.executions.length,
      completedCount: completed,
    };
    const index = items.findIndex((row) => row.id === plan.id);
    if (index === -1) items.push(item);
    else items[index] = item;
    relatedContractItems.set(plan.contractId, items);
  }
}
export async function getInspectionPlansApi() {
  const response = await inspection.getInspectionPlansApi();
  syncContractInspectionProgress();
  return createMockResponse(
    response.data.filter((plan) => {
      try {
        check(plan.id, 'view');
        return true;
      } catch {
        return false;
      }
    }),
  );
}
export async function createInspectionPlanApi(
  input: InspectionDraft,
  reason = '',
  configuration?: Parameters<typeof inspection.createInspectionPlanApi>[2],
) {
  if (input.contractId) {
    const contract = rawContract(input.contractId);
    requireContractPermission(contract, 'handle');
    requireContractActive(contract);
    if (
      mockInspectionPlans.some(
        (plan) =>
          plan.contractId === input.contractId &&
          plan.status !== '已终止' &&
          plan.name === input.name &&
          plan.scope === input.scope &&
          plan.start === input.start &&
          plan.end === input.end,
      )
    )
      throw new Error('该合同已有相同巡检计划，不能重复创建');
  }
  const response = await inspection.createInspectionPlanApi(
    input,
    reason,
    configuration,
  );
  syncContractInspectionProgress();
  return response;
}
export async function activateInspectionPlanApi(
  ...args: Parameters<typeof inspection.activateInspectionPlanApi>
) {
  const plan = check(args[0]);
  if (plan.contractId) {
    const contract = rawContract(plan.contractId);
    requireContractActive(contract);
    if (!contract.managementState?.dateConfirmed)
      throw new Error('合同服务日期尚未确认');
    if (
      args[1].draft.start !== contract.start ||
      args[1].draft.end !== contract.managementState.expiryDate
    )
      throw new Error('计划服务期限须与已确认合同日期一致');
    args[1].draft.contractId = plan.contractId;
  }
  const response = await inspection.activateInspectionPlanApi(...args);
  syncContractInspectionProgress();
  return response;
}
export async function updateInspectionPlanApi(
  ...args: Parameters<typeof inspection.updateInspectionPlanApi>
) {
  check(args[0]);
  if (args[1].status === '执行中') active(args[0]);
  const response = await inspection.updateInspectionPlanApi(...args);
  syncContractInspectionProgress();
  return response;
}
export async function copyInspectionPlanApi(id: string) {
  check(id);
  const response = await inspection.copyInspectionPlanApi(id);
  const plan = mockInspectionPlans.find((item) => item.id === response.data.id);
  if (!plan) throw new Error('巡检计划不存在');
  plan.contractId = undefined;
  plan.contract = '';
  response.data.contractId = undefined;
  response.data.contract = '';
  return response;
}
export const getInspectionResourcesApi = inspection.getInspectionResourcesApi;
export async function generateInspectionOrderApi(
  ...args: Parameters<typeof execution.generateInspectionOrderApi>
) {
  active(args[0]);
  const response = await execution.generateInspectionOrderApi(...args);
  syncContractInspectionProgress();
  return response;
}
export async function getInspectionOrderApi(code: string) {
  const order = mockWorkOrders.find((item) => item.code === code);
  if (order?.inspection) check(order.inspection.planId, 'view');
  return execution.getInspectionOrderApi(code);
}
export async function updateInspectionOrderApi(
  ...args: Parameters<typeof execution.updateInspectionOrderApi>
) {
  const order = mockWorkOrders.find((item) => item.code === args[0]);
  if (order?.inspection) check(order.inspection.planId);
  const response = await execution.updateInspectionOrderApi(...args);
  syncContractInspectionProgress();
  return response;
}
export async function runInspectionDispatchApi(id: string) {
  const plan = active(id);
  for (const row of plan.executions) {
    const date = new Date(`${row.date}T12:00:00`);
    date.setDate(date.getDate() - plan.advanceDays);
    if (!row.ticket && date.toLocaleDateString('sv-SE') <= contractToday())
      await generateInspectionOrderApi(id, row.id);
  }
  syncContractInspectionProgress();
  return createMockResponse(structuredClone(plan));
}
