import type { ContractChatSession } from '#/types/contract-assistant';

import { ensureArchiveManagement } from '#/views/app/mate/contract-assistant/utils/archive-management';
import {
  extractionValue,
  missingContractExtraction,
} from '#/views/app/mate/contract-assistant/utils/contract-extraction';

import { mockAuditRules, mockAuditSchemes } from './mock-data-audit';

export function applyExtractedContract(
  item: ContractChatSession,
  data: Record<string, unknown>,
) {
  item.extractedFields ||= {};
  item.extractionEvidence ||= {};
  const state = ensureArchiveManagement(item);
  const snapshot: Record<string, string> = {};
  const direct = new Set([
    'amount',
    'company',
    'contractNumber',
    'counterparty',
    'deliveryDate',
    'invoiceTerms',
    'location',
    'owner',
    'paymentTerms',
    'salesManager',
    'scope',
    'signedAt',
  ]);
  for (const field of item.scheme?.management?.extraction || []) {
    const value = data[field.key] ?? data[field.name];
    if (value === undefined || value === null || value === '') continue;
    const text =
      typeof value === 'object' ? JSON.stringify(value) : String(value);
    item.extractedFields[field.key] = text;
    switch (field.key) {
      case 'expiryDate': {
        state.expiryDate = text;
        break;
      }
      case 'name': {
        item.fileName = text;
        break;
      }
      case 'requirements': {
        item.special = text;
        break;
      }
      case 'startDate': {
        item.start = text;
        break;
      }
      default: {
        if (direct.has(field.key))
          (item as unknown as Record<string, unknown>)[field.key] =
            field.key === 'amount' ? Number(value) : text;
      }
    }
    item.extractionEvidence[field.key] = `${field.name}：${text}`;
    snapshot[field.key] = extractionValue(item, field.key);
  }
  item.extractionSnapshot = snapshot;
  state.summary = `${item.fileName.replace(/\.[^.]+$/, '')}；签约对方：${item.counterparty || '待补充'}；范围：${item.scope || '待补充'}。`;
  state.auditStatus = 'pending';
  state.auditConfirmed = false;
  state.auditHandlingNote = '';
}
export function applyDemoContract(item: ContractChatSession) {
  const sales = item.scheme?.contractCategory === 'sales';
  const purchase = item.scheme?.contractCategory === 'purchase';
  const year = new Date().getFullYear();
  const installment = sales || purchase ? 100_000 : 40_000;
  let name = '华信科技设备运维合同';
  let code = 'YW';
  if (sales) {
    name = '华信科技设备销售合同';
    code = 'XS';
  } else if (purchase) {
    name = '华信科技设备采购合同';
    code = 'CG';
  }
  const data: Record<string, unknown> = {
    name,
    contractNumber: `${code}-${year}-${item.id.slice(-6)}`,
    counterparty: '华信科技有限公司',
    company: '企财通科技有限公司',
    amount: sales || purchase ? 300_000 : 120_000,
    signedAt: `${year}-10-01`,
    startDate: `${year}-10-01`,
    expiryDate: `${year + 1}-09-30`,
    scope:
      sales || purchase
        ? '网络设备供货、安装与调试'
        : '园区网络与安防设备运维服务',
    location: '总部园区',
    owner: item.owner,
    frequency: '每季度',
    requirements:
      '巡检前预约客户，检查供电、网络和设备运行情况，完成后提交巡检记录。',
    invoiceTerms: `按三期各${installment / 10_000}万元申请开票`,
    paymentTerms: `分三期各支付${installment / 10_000}万元`,
    paymentSchedule: [
      { name: '首期', date: `${year}-10-20`, amount: installment },
      { name: '第二期', date: `${year}-11-20`, amount: installment },
      { name: '尾款', date: `${year}-12-20`, amount: installment },
    ],
    devices: [
      { code: 'NET-001', name: '核心交换机' },
      { code: 'NET-002', name: '接入交换机' },
    ],
  };
  applyExtractedContract(item, data);
  item.count = sales || purchase ? 0 : 4;
  item.team = sales || purchase ? '销售一部' : '华东运维组';
  item.sourceText = `${Object.entries(data)
    .map(
      ([key, value]) =>
        `${key}：${typeof value === 'object' ? JSON.stringify(value) : value}`,
    )
    .join('\n')}\n签署情况：双方已签字盖章。`;
}
export async function parseContractText(item: ContractChatSession, file: File) {
  if (!/\.(?:txt|json)$/i.test(file.name)) return false;
  const text = await file.text();
  item.sourceText = text;
  let data: Record<string, unknown> = {};
  if (/\.json$/i.test(file.name)) {
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      throw new Error('合同JSON须为对象');
    data = parsed as Record<string, unknown>;
  } else
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^([^：:]+)[：:](.*)$/);
      if (match) {
        let value: unknown = (match[2] ?? '').trim();
        if (typeof value === 'string' && /^[[{]/.test(value))
          try {
            value = JSON.parse(value);
          } catch {}
        data[(match[1] ?? '').trim()] = value;
      }
    }
  applyExtractedContract(item, data);
  return true;
}
export function runContractDemoAudit(item: ContractChatSession) {
  const state = ensureArchiveManagement(item);
  const config = item.scheme?.management;
  state.auditHandlingNote = '';
  state.auditConfirmed = false;
  if (config?.audit.mode === 'none') {
    state.auditItems = [];
    state.auditStatus = 'skipped';
    state.auditNote = '本类型不审核';
    return;
  }
  const scheme = mockAuditSchemes.find(
    (value) => value.id === config?.audit.schemeId,
  );
  if (!scheme) throw new Error('审核方案不可用');
  const results: NonNullable<typeof state.auditItems> = [];
  const missing = missingContractExtraction(item);
  results.push({
    title: '必填合同信息完整性',
    status: missing.length > 0 ? 'blocked' : 'passed',
    severity: 'BLOCK',
    detail:
      missing.length > 0 ? missing.join('；') : '类型要求的必填信息已补齐。',
    evidence:
      missing.length > 0
        ? '详见合同信息页待补充字段。'
        : `合同编号：${item.contractNumber || '未设置为必填'}；客户：${item.counterparty || '未设置为必填'}`,
  });
  for (const ref of [...scheme.rules]
    .filter(
      (rule) =>
        !config?.audit.ruleIds || config.audit.ruleIds.includes(rule.ruleId),
    )
    .toSorted((a, b) => a.priority - b.priority)) {
    const rule = mockAuditRules.find(
      (value) => value.id === ref.ruleId && value.status === 'active',
    );
    if (!rule) {
      results.push({
        title: '审核事项不可用',
        status: 'unknown',
        severity: ref.action,
        detail: '引用的审核事项不存在或已停用，请修复方案或人工核对。',
      });
      continue;
    }
    if (rule.id === 'contract-signature') {
      const signed =
        !!item.demo && /双方已签字盖章/.test(item.sourceText || '');
      results.push({
        title: rule.name,
        status: signed ? 'passed' : 'unknown',
        severity: ref.action,
        detail: signed
          ? '演示文本中存在双方签字盖章记录。'
          : '当前材料无法验证双方签署及印章，请查看合同原件并填写核对说明。',
        evidence: signed
          ? '签署情况：双方已签字盖章。'
          : '未获得可验证的签署证据。',
      });
    } else if (rule.id === 'contract-consistency') {
      const changed = (item.scheme?.management?.extraction || []).filter(
        (field) =>
          item.extractionSnapshot?.[field.key] !== undefined &&
          item.extractionSnapshot[field.key] !==
            extractionValue(item, field.key),
      );
      let consistencyStatus: 'blocked' | 'passed' | 'unknown' | 'warning';
      let consistencyDetail: string;
      if (!item.extractionSnapshot) {
        consistencyStatus = 'unknown';
        consistencyDetail = '尚无提取依据，请人工核对原文。';
      } else if (changed.length === 0) {
        consistencyStatus = 'passed';
        consistencyDetail = '当前信息与初始提取记录一致。';
      } else {
        consistencyStatus = ref.action === 'BLOCK' ? 'blocked' : 'warning';
        consistencyDetail = `以下字段与初始提取结果不同：${changed.map((field) => field.name).join('、')}。请说明修正依据。`;
      }
      results.push({
        title: rule.name,
        status: consistencyStatus,
        severity: ref.action,
        detail: consistencyDetail,
        evidence:
          changed.length > 0
            ? changed
                .map(
                  (field) =>
                    `${field.name}原提取值：${item.extractionSnapshot?.[field.key]}`,
                )
                .join('；')
            : '依据本次合同提取快照核对，不代表对全部法律条款的审核。',
      });
    } else
      results.push({
        title: rule.name,
        status: 'unknown',
        severity: ref.action,
        detail:
          '该事项的真实智能审核服务尚未接入，请按规则人工核对并填写说明。',
        evidence: rule.prompt,
      });
  }
  state.auditItems = results;
  state.auditStatus = results.some((row) => row.status === 'blocked')
    ? 'issues'
    : 'passed';
  state.auditNote = `共${results.length}项：通过${results.filter((row) => row.status === 'passed').length}项，阻断${results.filter((row) => row.status === 'blocked').length}项，警告${results.filter((row) => row.status === 'warning').length}项，无法判断${results.filter((row) => row.status === 'unknown').length}项。`;
}
