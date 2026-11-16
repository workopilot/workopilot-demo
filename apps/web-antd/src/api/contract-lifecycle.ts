import type {
  ContractChange,
  ContractChatSession,
} from '#/types/contract-assistant';
import type { NotificationTemplate } from '#/types/platform';

import {
  archiveReminders,
  calculateContractExpiry,
  ensureArchiveManagement,
} from '#/views/app/mate/contract-assistant/utils/archive-management';
import { getContractReminderDate } from '#/views/app/mate/contract-assistant/utils/management-config';
import {
  defaultContractMessageTemplateId,
  renderContractMessage,
} from '#/views/app/mate/contract-assistant/utils/message-template';
import { addMateInboxMessage } from '#/views/app/mate/messages/message-state';

import {
  contractUser,
  requireContractPermission,
} from './contract-permissions';
import {
  contractArchives,
  contractNow,
  contractReminderRecords,
  contractToday,
  rawContract,
  relatedContractItems,
} from './contract-state';
import { createMockResponse } from './mock-data';
import { getNotificationTemplatesApi } from './platform';

const validDate = (value: string) =>
  !!getContractReminderDate('on-expiry', 0, value, true);
export function recordContractEvent(
  item: ContractChatSession,
  description: string,
  fields: ContractChange['fields'] = [],
) {
  item.changes ||= [];
  item.changes.unshift({
    id: `change-${Date.now()}-${item.changes.length}`,
    at: contractNow(),
    actor: contractUser().name,
    description,
    fields,
  });
  item.revision = (item.revision || 0) + 1;
}
export function reconcileContractChanges(
  before: ContractChatSession | undefined,
  after: ContractChatSession,
) {
  const state = ensureArchiveManagement(after);
  if (state.dateConfirmed) {
    if (
      !validDate(after.start) ||
      !validDate(state.expiryDate) ||
      state.expiryDate < after.start
    )
      throw new Error('请核对实际起算日期与到期日期');
    const expected =
      after.scheme?.management &&
      calculateContractExpiry(after.start, after.scheme.management.lifecycle);
    if (expected && expected !== state.expiryDate)
      throw new Error(`到期日期应按配置期限计算为${expected}`);
  }
  after.changes = structuredClone(before?.changes || []);
  after.revision = before?.revision || 0;
  if (!before?.managementState?.archived) {
    if (state.archived) recordContractEvent(after, '完成合同建档');
    return;
  }
  if (before.end)
    throw new Error('已终止或作废合同不能修改主数据，请通过补充资料保留依据');
  state.archived = true;
  const keys: [string, string][] = [
    ['fileName', '合同名称'],
    ['company', '所属公司'],
    ['contractNumber', '合同编号'],
    ['counterparty', '客户'],
    ['scope', '服务范围'],
    ['amount', '合同金额'],
    ['start', '起算日期'],
    ['owner', '合同负责人'],
    ['department', '归属部门'],
    ['count', '巡检次数'],
    ['special', '特殊要求'],
  ];
  const fields = keys
    .filter(
      ([key]) =>
        String(before[key as keyof ContractChatSession] ?? '') !==
        String(after[key as keyof ContractChatSession] ?? ''),
    )
    .map(([key, label]) => ({
      label,
      before: String(before[key as keyof ContractChatSession] ?? ''),
      after: String(after[key as keyof ContractChatSession] ?? ''),
    }));
  if (before.managementState?.dateConfirmed !== state.dateConfirmed)
    fields.push({
      label: '日期确认状态',
      before: String(before.managementState?.dateConfirmed),
      after: String(state.dateConfirmed),
    });
  if (before.managementState?.summary !== state.summary)
    fields.push({
      label: '合同摘要',
      before: before.managementState?.summary || '',
      after: state.summary,
    });
  if (before.managementState?.expiryDate !== state.expiryDate)
    fields.push({
      label: '到期日期',
      before: before.managementState?.expiryDate || '',
      after: state.expiryDate,
    });
  if (before.scheme?.id !== after.scheme?.id)
    fields.push({
      label: '合同类别配置',
      before: before.scheme?.name || '',
      after: after.scheme?.name || '',
    });
  if (fields.length === 0) return;
  if (before.end)
    throw new Error('已终止或作废合同不能修改主数据，请通过补充资料保留依据');
  recordContractEvent(after, '变更合同信息', fields);
  const affectsBusiness = fields.some(
    (field) => !['合同摘要', '归属部门'].includes(field.label),
  );
  if (affectsBusiness)
    for (const item of relatedContractItems.get(before.id) || [])
      if (item.status !== 'completed') {
        item.needsReview = true;
        item.reviewReason = `合同第${after.revision}版发生变更：${fields.map((field) => field.label).join('、')}`;
      }
  if (
    before.start !== after.start ||
    before.managementState?.expiryDate !== state.expiryDate ||
    before.managementState?.dateConfirmed !== state.dateConfirmed
  )
    for (const record of contractReminderRecords.get(before.id) || [])
      if (['failed', 'waiting'].includes(record.status)) {
        record.status = 'cancelled';
        record.note = '合同日期调整，原未触发事项已取消，将按新周期计算';
      }
}
function reminderCycle(item: ContractChatSession) {
  return `${item.start}|${item.managementState?.expiryDate}`;
}
function stopped(item: ContractChatSession, actionId: string) {
  const action = item.scheme?.management?.lifecycle.actions.find(
    (a) => a.id === actionId,
  );
  return (
    !!item.end ||
    (!!item.renewal?.newContractId && action?.stopWhen.includes('已续约')) ||
    (item.renewal?.decision === 'no-renew' &&
      /续约|续签/.test(action?.name || ''))
  );
}
function stateReady(item: ContractChatSession) {
  return !!item.managementState?.dateConfirmed && !item.end;
}
function ensureRecords(item: ContractChatSession) {
  const records = contractReminderRecords.get(item.id) || [];
  const cycle = reminderCycle(item);
  for (const action of archiveReminders(item)) {
    const existing = records.find(
      (record) => record.actionId === action.id && record.cycle === cycle,
    );
    if (existing) {
      if (existing.status === 'waiting') existing.date = action.date;
      if (
        existing.status === 'cancelled' &&
        existing.note.startsWith('合同日期调整') &&
        stateReady(item)
      ) {
        existing.status = 'waiting';
        existing.date = action.date;
        existing.note = '等待新周期触发';
      }
      if (
        stopped(item, action.id) &&
        !['cancelled', 'completed', 'sent'].includes(existing.status)
      ) {
        existing.status = 'cancelled';
        existing.note = '合同结束或续约决策使本事项不再适用';
      }
      continue;
    }
    let note = '待日期确认';
    if (item.managementState?.dateConfirmed)
      note =
        action.trigger === 'renewal-confirmed' ? '待人工确认续约' : '等待触发';
    records.push({
      id: `${item.id}:${action.id}:${cycle}`,
      actionId: action.id,
      cycle,
      name: action.name,
      date: action.date,
      status: stopped(item, action.id) ? 'cancelled' : 'waiting',
      note,
    });
  }
  contractReminderRecords.set(item.id, records);
  return records;
}
export async function getContractReminderRecords(id: string) {
  const item = rawContract(id);
  requireContractPermission(item, 'view');
  return createMockResponse(structuredClone(ensureRecords(item)));
}
export async function runContractReminders(id: string) {
  const item = rawContract(id);
  requireContractPermission(item, 'handle');
  const state = ensureArchiveManagement(item);
  const records = ensureRecords(item);
  if (
    !state.archived ||
    !state.dateConfirmed ||
    !state.remindersConfirmed ||
    item.end
  )
    return createMockResponse(structuredClone(records));
  const templatesResponse = await getNotificationTemplatesApi();
  const templates: NotificationTemplate[] = templatesResponse.data;
  const actions = (item.scheme?.management?.lifecycle.actions || []).toSorted(
    (a, b) =>
      Number(b.purpose === 'renewal-review') -
      Number(a.purpose === 'renewal-review'),
  );
  for (const action of actions) {
    const record = records.find(
      (r) => r.actionId === action.id && r.cycle === reminderCycle(item),
    );
    if (!record) continue;
    if (
      !['failed', 'waiting'].includes(record.status) ||
      stopped(item, action.id)
    )
      continue;
    if (
      action.trigger === 'renewal-confirmed' &&
      item.renewal?.decision !== 'renew'
    )
      continue;
    if (
      action.trigger !== 'renewal-confirmed' &&
      (!record.date || record.date > contractToday())
    )
      continue;
    const combinedReview =
      action.action === 'message' &&
      actions.find(
        (candidate) =>
          candidate.purpose === 'renewal-review' &&
          !stopped(item, candidate.id) &&
          candidate.recipients.toSorted().join('|') ===
            action.recipients.toSorted().join('|') &&
          records.some(
            (value) =>
              value.actionId === candidate.id &&
              value.cycle === record.cycle &&
              value.date === record.date &&
              ['completed', 'processing'].includes(value.status),
          ),
      );
    if (combinedReview) {
      record.status = 'cancelled';
      record.note = `到期提示已合并至“${combinedReview.name}”待办，不重复通知`;
      continue;
    }
    const mergedNotices =
      action.purpose === 'renewal-review'
        ? actions.filter(
            (candidate) =>
              candidate.action === 'message' &&
              !stopped(item, candidate.id) &&
              candidate.recipients.toSorted().join('|') ===
                action.recipients.toSorted().join('|') &&
              records.some(
                (value) =>
                  value.actionId === candidate.id &&
                  value.cycle === record.cycle &&
                  value.date === record.date &&
                  ['failed', 'waiting'].includes(value.status),
              ),
          )
        : [];
    try {
      const render = (notice: (typeof actions)[number]) => {
        const templateId =
          item.scheme?.management?.lifecycle.reminderTemplateId ||
          defaultContractMessageTemplateId;
        const template = templates.find((value) => value.id === templateId);
        if (!template) throw new Error('消息模版不存在，请重新选择');
        return renderContractMessage(template, {
          合同名称: item.fileName.replace(/\.[^.]+$/, ''),
          合同编号: item.contractNumber || '待确认',
          签约对方: item.counterparty || '待确认',
          到期日期: state.expiryDate || '待确认',
          合同负责人: item.owner || '待指定',
          事项名称: notice.name,
        });
      };
      const rendered = action.action === 'message' ? render(action) : undefined;
      const content = [
        rendered?.content || action.description,
        ...mergedNotices.map((notice) => `到期提醒：${render(notice).content}`),
      ].join('\n\n');
      addMateInboxMessage({
        id: `reminder-${record.id}`,
        category: action.action === 'message' ? 'assistant' : 'todo',
        title:
          rendered?.title ||
          `${item.fileName.replace(/\.[^.]+$/, '')} · ${action.name}`,
        summary: content,
        sourceName: '合同助理',
        sender: '合同助理',
        date: contractToday().slice(5),
        fullDate: contractNow(),
        unread: true,
        icon: 'lucide:calendar-clock',
        actionHint: '查看到期事项',
        targetPath: `/app/mate/employee/contract-assistant/contract-archives/${id}?tab=plans`,
        contentMarkdown: `${content}\n\n责任角色：${action.recipients.join('、')}`,
      });
      record.status = action.action === 'message' ? 'sent' : 'processing';
      record.at = contractNow();
      record.note =
        action.action === 'message'
          ? '消息已发送'
          : '已生成办理待办，等待记录处理结果';
    } catch (error) {
      record.status = 'failed';
      record.note = error instanceof Error ? error.message : '发送失败，可重试';
    }
  }
  return createMockResponse(structuredClone(records));
}
export async function completeContractReminder(
  id: string,
  recordId: string,
  note: string,
) {
  const item = rawContract(id);
  requireContractPermission(item, 'handle');
  const record = ensureRecords(item).find((r) => r.id === recordId);
  if (!record || record.status !== 'processing')
    throw new Error('该事项当前不支持完成');
  if (/续约|续签/.test(record.name))
    throw new Error('请记录续约决策和续签结果后完成');
  if (!note.trim()) throw new Error('请填写办理结果');
  record.note = note.trim();
  record.status = 'completed';
  record.at = contractNow();
  return createMockResponse(true);
}
export async function recordContractRenewal(
  id: string,
  decision: 'no-renew' | 'renew' | 'undecided',
  note: string,
  newContractId?: string,
) {
  const item = rawContract(id);
  requireContractPermission(item, 'handle');
  if (item.end) throw new Error('已结束合同不能办理续约');
  if (!note.trim()) throw new Error('请说明续约决策或处理结果');
  if (!['no-renew', 'renew', 'undecided'].includes(decision))
    throw new Error('请选择续约决策');
  if (
    item.renewal?.newContractId &&
    (newContractId !== item.renewal.newContractId || decision !== 'renew')
  )
    throw new Error('续签已完成，不能覆盖已确认的新旧合同关联');
  if (newContractId) {
    if (decision !== 'renew' || newContractId === id)
      throw new Error('请选择有效的新合同');
    const next = rawContract(newContractId);
    requireContractPermission(next, 'handle');
    if (
      !next.managementState?.archived ||
      !next.signedAt ||
      !validDate(next.signedAt) ||
      next.signedAt > contractToday() ||
      next.counterparty !== item.counterparty ||
      next.end
    )
      throw new Error('新合同须已建档、已签署且客户一致');
    if (next.previousContractId && next.previousContractId !== id)
      throw new Error('新合同已关联其他原合同');
    let ancestor: ContractChatSession | undefined = item;
    const visited = new Set<string>();
    while (ancestor) {
      if (ancestor.id === newContractId || visited.has(ancestor.id))
        throw new Error('新旧合同不能循环关联');
      visited.add(ancestor.id);
      ancestor = ancestor.previousContractId
        ? contractArchives.get(ancestor.previousContractId)
        : undefined;
    }
    next.previousContractId = id;
    recordContractEvent(next, '关联原合同', [
      { label: '原合同', before: '', after: id },
    ]);
  }
  item.renewal = {
    decision,
    note: note.trim(),
    newContractId: decision === 'renew' ? newContractId : undefined,
  };
  recordContractEvent(item, '记录续约结果');
  for (const record of ensureRecords(item))
    if (
      /续约|续签/.test(record.name) &&
      !['cancelled', 'completed', 'sent'].includes(record.status)
    ) {
      record.status =
        decision === 'undecided' || (decision === 'renew' && !newContractId)
          ? 'processing'
          : 'completed';
      record.note = note;
      record.at = contractNow();
    }
  return createMockResponse(true);
}
export async function endContract(
  id: string,
  kind: 'terminated' | 'void',
  date: string,
  reason: string,
) {
  const item = rawContract(id);
  requireContractPermission(item, 'manage');
  if (item.end) throw new Error('合同已结束');
  if (
    !['terminated', 'void'].includes(kind) ||
    !validDate(date) ||
    date > contractToday() ||
    !reason.trim()
  )
    throw new Error('请填写有效的实际结束日期及原因');
  item.end = { kind, date, reason: reason.trim(), actor: contractUser().name };
  recordContractEvent(
    item,
    kind === 'terminated' ? '确认合同终止' : '确认合同作废',
  );
  ensureRecords(item);
  for (const linked of relatedContractItems.get(id) || [])
    if (linked.status !== 'completed') {
      linked.needsReview = true;
      linked.reviewReason =
        '合同已结束，请业务负责人核对剩余事项，不自动取消已安排业务';
    }
  return createMockResponse(true);
}
export async function addContractSupplement(id: string, file: File) {
  const item = rawContract(id);
  requireContractPermission(item, 'handle');
  item.supplementaryFiles ||= [];
  if (item.supplementaryFiles.some((f) => f.name === file.name))
    throw new Error('已有关联的同名附件');
  item.supplementaryFiles.push({ name: file.name, file, at: contractNow() });
  recordContractEvent(item, '关联补充协议或证明资料', [
    { label: '附件', before: '', after: file.name },
  ]);
  return createMockResponse(true);
}
