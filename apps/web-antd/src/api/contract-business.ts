import type {
  ContractBusinessDraft,
  ContractRelatedItem,
} from '#/types/contract-assistant';

import { getContractReminderDate } from '#/views/app/mate/contract-assistant/utils/management-config';

import { recordContractEvent } from './contract-lifecycle';
import {
  requireContractActive,
  requireContractPermission,
} from './contract-permissions';
import {
  contractNow,
  contractToday,
  rawContract,
  relatedContractItems,
} from './contract-state';
import { createMockResponse } from './mock-data';

const receipts = new Map<
  string,
  { amount: number; at: string; note: string; reference: string }[]
>();
const amountInCents = (amount: number) => Math.round(amount * 100);
const validAmount = (amount: number | undefined): amount is number =>
  typeof amount === 'number' &&
  Number.isFinite(amount) &&
  amount > 0 &&
  Math.abs(amount * 100 - amountInCents(amount)) < 0.000_001;
export function refreshBusinessStatus(item: ContractRelatedItem) {
  if (item.status === 'completed') return;
  if (item.plannedDate && item.plannedDate < contractToday())
    item.status = 'overdue';
}
export async function createContractBusinessPlan(
  id: string,
  type: 'collection' | 'invoice' | 'project',
  draft: ContractBusinessDraft,
) {
  const contract = rawContract(id);
  requireContractPermission(contract, 'handle');
  requireContractActive(contract);
  if (!['collection', 'invoice', 'project'].includes(type))
    throw new Error('不支持的业务事项类型');
  const existing = relatedContractItems.get(id) || [];
  if (existing.some((item) => item.type === type))
    throw new Error('该合同已有此类关联计划，请核对已有安排，避免重复创建');
  if (!draft.name.trim() || !draft.owner.trim() || draft.rows.length === 0)
    throw new Error('请补齐计划名称、负责人和期次');
  for (const row of draft.rows)
    if (
      !row.name.trim() ||
      !getContractReminderDate('on-expiry', 0, row.date, true) ||
      (type !== 'project' && !validAmount(row.amount))
    )
      throw new Error('请核对各期名称、日期及金额');
  if (
    type !== 'project' &&
    draft.rows.reduce((sum, row) => sum + amountInCents(row.amount || 0), 0) >
      amountInCents(contract.amount || 0)
  )
    throw new Error('计划合计不能超过已确认合同金额，请先核对合同金额');
  const added: ContractRelatedItem[] = draft.rows.map((row, index) => ({
    id: `${id}-${type}-${Date.now()}-${index}`,
    type,
    name: row.name,
    owner: draft.owner,
    status: row.date < contractToday() ? 'overdue' : 'pending',
    plannedDate: row.date,
    updatedAt: contractNow(),
    progress:
      type === 'project'
        ? '立项草稿已确认，等待登记实际立项结果。'
        : '计划已确认，等待实际业务结果。',
    ...(type === 'project' ? {} : { amount: row.amount, completedAmount: 0 }),
  }));
  relatedContractItems.set(id, [...existing, ...added]);
  return createMockResponse(structuredClone(added));
}
export async function recordContractBusinessResult(
  id: string,
  itemId: string,
  reference: string,
  note: string,
  amount?: number,
) {
  const contract = rawContract(id);
  requireContractPermission(contract, 'handle');
  const item = (relatedContractItems.get(id) || []).find(
    (row) => row.id === itemId,
  );
  if (!item || !['collection', 'invoice', 'project'].includes(item.type))
    throw new Error('关联事项不存在');
  if (!reference.trim() || !note.trim())
    throw new Error('请填写实际业务记录编号及说明');
  const logs = receipts.get(itemId) || [];
  if (logs.some((log) => log.reference === reference.trim()))
    throw new Error('该业务记录已登记，请勿重复提交');
  if (item.status === 'completed') throw new Error('该事项已经完成');
  if (item.type === 'project') {
    item.status = 'completed';
  } else {
    if (
      !validAmount(amount) ||
      amountInCents(amount) + amountInCents(item.completedAmount || 0) >
        amountInCents(item.amount || 0)
    )
      throw new Error(
        '本次金额须大于0、最多两位小数，且累计金额不能超过本期计划',
      );
    item.completedAmount =
      (amountInCents(item.completedAmount || 0) + amountInCents(amount ?? 0)) /
      100;
    item.status =
      item.completedAmount === item.amount ? 'completed' : 'in-progress';
  }
  item.reference = reference.trim();
  item.progress = note.trim();
  item.updatedAt = contractNow();
  logs.push({
    reference: reference.trim(),
    amount: amount || 0,
    at: contractNow(),
    note,
  });
  receipts.set(itemId, logs);
  refreshBusinessStatus(item);
  return createMockResponse(structuredClone(item));
}
export async function acknowledgeContractBusinessChange(
  id: string,
  itemId: string,
  note: string,
) {
  const contract = rawContract(id);
  requireContractPermission(contract, 'handle');
  const item = (relatedContractItems.get(id) || []).find(
    (row) => row.id === itemId,
  );
  if (!item) throw new Error('事项不存在');
  if (!note.trim()) throw new Error('请说明变更影响及后续处理');
  item.reviewNote = note.trim();
  recordContractEvent(contract, '核对关联业务变更影响', [
    {
      label: item.name,
      before: item.reviewReason || '待核对',
      after: note.trim(),
    },
  ]);
  item.needsReview = false;
  item.reviewReason = '';
  item.progress = `变更已核对：${note}`;
  item.updatedAt = contractNow();
  return createMockResponse(true);
}
