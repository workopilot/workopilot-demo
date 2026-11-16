import type {
  ContractChatSession,
  ContractManagementConfig,
} from '#/types/contract-assistant';

import { getContractReminderDate } from './management-config';

export function calculateContractExpiry(
  start: string,
  lifecycle: ContractManagementConfig['lifecycle'],
) {
  if (
    lifecycle.expiryBasis !== 'duration' ||
    !lifecycle.durationMonths ||
    !getContractReminderDate('on-expiry', 0, start, true)
  )
    return '';
  const d = new Date(`${start}T12:00:00`);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + lifecycle.durationMonths);
  d.setDate(
    Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()),
  );
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function ensureArchiveManagement(item: ContractChatSession) {
  if (!item.managementState) {
    const completed = item.phase === 4;
    let auditStatus: 'passed' | 'pending' | 'skipped';
    if (item.scheme?.management?.audit.mode === 'none') auditStatus = 'skipped';
    else if (completed) auditStatus = 'passed';
    else auditStatus = 'pending';
    item.managementState = {
      summary: `${item.fileName.replace(/\.[^.]+$/, '')}：${item.scope || '范围待核对'}。${item.businessType === 'sales' ? `开票约定：${item.invoiceTerms || '待核对'}；收款约定：${item.paymentTerms || '待核对'}。` : `服务地点：${item.location || '待核对'}；服务期内巡检${item.count}次。`}`,
      auditStatus,
      auditNote: completed ? '已核对合同编号、签约主体及正文附件一致性。' : '',
      auditConfirmed: completed,
      dateConfirmed: false,
      expiryDate: '',
      remindersConfirmed: completed,
      archived: completed,
    };
  }
  return item.managementState;
}
export function archiveStateLabel(item: ContractChatSession) {
  const state = ensureArchiveManagement(item);
  if (state.archived) return '已建档';
  if (state.auditStatus === 'issues') return '待处理问题';
  if (
    item.contractNumber?.trim() &&
    item.counterparty?.trim() &&
    item.scope.trim() &&
    state.summary.trim() &&
    state.auditStatus === 'pending'
  )
    return '待审核';
  return '待完善';
}
export function contractValidityLabel(
  item: ContractChatSession,
  today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' }),
) {
  if (item.end) return item.end.kind === 'terminated' ? '已终止' : '已作废';
  const state = ensureArchiveManagement(item);
  if (!state.dateConfirmed || !item.start || !state.expiryDate) return '待确认';
  if (today < item.start) return '待生效';
  return today > state.expiryDate ? '已到期' : '生效中';
}
export function archiveReminders(item: ContractChatSession) {
  const state = ensureArchiveManagement(item);
  return (item.scheme?.management?.lifecycle.actions || []).map((action) => {
    let status: '已取消' | '待日期确认' | '待确认' | '待续约确认' | '待触发';
    if (item.end) status = '已取消';
    else if (!state.archived || !state.remindersConfirmed) status = '待确认';
    else if (state.dateConfirmed) {
      status = action.trigger === 'renewal-confirmed' ? '待续约确认' : '待触发';
    } else {
      status = '待日期确认';
    }
    return {
      ...action,
      date: getContractReminderDate(
        action.trigger,
        action.days,
        state.expiryDate,
        state.dateConfirmed,
      ),
      status,
    };
  });
}
