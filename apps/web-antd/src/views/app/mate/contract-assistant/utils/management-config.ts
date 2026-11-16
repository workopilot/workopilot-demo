import type {
  ContractManagementConfig,
  ContractScheme,
} from '#/types/contract-assistant';

export const masterFieldOptions = [
  { value: 'contractNumber', label: '合同编号' },
  { value: 'name', label: '合同名称' },
  { value: 'counterparty', label: '签约主体／客户' },
  { value: 'company', label: '所属公司' },
  { value: 'amount', label: '合同金额' },
  { value: 'signedAt', label: '签订日期' },
  { value: 'startDate', label: '生效日期' },
  { value: 'expiryDate', label: '到期日期' },
  { value: 'scope', label: '合同范围' },
  { value: 'location', label: '交付／服务地点' },
  { value: 'details', label: '明细数据（JSON）' },
];
export function validateContractManagement(
  draft: ContractScheme,
  config: ContractManagementConfig,
  existing: ContractScheme[],
): string[] {
  const issues: string[] = [];
  if (!draft.name.trim()) issues.push('请填写合同类别名称');
  if (!config.code.trim()) issues.push('请填写类别编码');
  if (!draft.scope.trim()) issues.push('请填写适用说明');
  if (
    existing.some(
      (item) =>
        item.management?.categoryKey !== config.categoryKey &&
        item.management?.code.toLowerCase() ===
          config.code.trim().toLowerCase(),
    )
  )
    issues.push('类别编码已被其他类别使用');
  if (draft.categoryIds.length === 0) issues.push('请映射至少一个平台附件分类');
  if (draft.fields.length === 0) issues.push('请选择需要引用的提取字段');
  if (!config.summary.requirements.trim()) issues.push('请填写摘要生成要求');
  if (!config.summary.missing.trim())
    issues.push('请填写信息缺失与冲突的处理要求');
  if (config.audit.mode === 'intelligent') {
    if (!config.audit.schemeId) issues.push('请选择审核方案');
    if (!config.audit.resultHandling.trim())
      issues.push('请填写审核异常的处理方式');
  }
  if (
    config.lifecycle.expiryBasis === 'duration' &&
    (!config.lifecycle.durationMonths || config.lifecycle.durationMonths < 1)
  )
    issues.push('请填写有效期限（月）');
  if (
    config.lifecycle.automaticRenewal !== 'none' &&
    !config.lifecycle.renewalInstructions.trim()
  )
    issues.push('请补充续约确认要求');
  if (!config.lifecycle.changeHandling.trim())
    issues.push('请填写日期变更与终止处理要求');
  for (const [index, item] of config.lifecycle.actions.entries()) {
    const prefix = `到期事项${index + 1}：`;
    if (!item.name.trim()) issues.push(`${prefix}请填写事项名称`);
    if (
      item.recipients.length === 0 ||
      item.recipients.some((value) => !value.trim())
    )
      issues.push(`${prefix}请选择接收人或责任角色`);
    if (
      ['after-expiry', 'before-expiry'].includes(item.trigger) &&
      (!Number.isInteger(item.days) || item.days < 1)
    )
      issues.push(`${prefix}提前或延后天数必须为正整数`);
    if (item.action === 'renewal-draft' && item.trigger !== 'renewal-confirmed')
      issues.push(`${prefix}续签草稿应在人工确认续约后生成`);
    if (!item.description.trim()) issues.push(`${prefix}请说明处理要求`);
    if (item.stopWhen.length === 0) issues.push(`${prefix}请设置停止条件`);
  }
  return [...new Set(issues)];
}

/** 标准字段使用统一编码，其余保留为明细；存在歧义时在建档环节确认。 */
export function getDefaultContractFieldTarget(source: string): string {
  const code = source.split(':').at(-1) || '';
  const targets: Record<string, string> = {
    contract_number: 'contractNumber',
    contract_no: 'contractNumber',
    contract_name: 'name',
    contract_title: 'name',
    customer: 'counterparty',
    customer_name: 'counterparty',
    counterparty: 'counterparty',
    company: 'company',
    company_name: 'company',
    contract_amount: 'amount',
    signing_date: 'signedAt',
    signed_at: 'signedAt',
    effective_date: 'startDate',
    start_date: 'startDate',
    expiry_date: 'expiryDate',
    end_date: 'expiryDate',
    service_scope: 'scope',
    delivery_scope: 'scope',
    service_location: 'location',
    delivery_location: 'location',
  };
  return targets[code] || 'details';
}

/** 固定规则：日期未确认、无效或续约尚未人工确认时，不产生到期提醒日期。 */
export function getContractReminderDate(
  trigger: string,
  days: number,
  expiryDate: string,
  dateConfirmed: boolean,
): string | undefined {
  if (
    !dateConfirmed ||
    !/^\d{4}-\d{2}-\d{2}$/.test(expiryDate) ||
    trigger === 'renewal-confirmed'
  )
    return undefined;
  const date = new Date(`${expiryDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return undefined;
  const format = (value: Date) =>
    `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  if (format(date) !== expiryDate) return undefined;
  if (
    ['after-expiry', 'before-expiry'].includes(trigger) &&
    (!Number.isInteger(days) || days < 1)
  )
    return undefined;
  if (trigger === 'before-expiry') date.setDate(date.getDate() - days);
  else if (trigger === 'after-expiry') date.setDate(date.getDate() + days);
  else if (trigger !== 'on-expiry') return undefined;
  return format(date);
}
