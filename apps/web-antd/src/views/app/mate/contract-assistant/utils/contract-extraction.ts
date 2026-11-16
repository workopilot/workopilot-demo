import type {
  ContractChatSession,
  ContractExtractionField,
} from '#/types/contract-assistant';

const base: ContractExtractionField[] = [
  {
    key: 'name',
    name: '合同名称',
    type: 'text',
    required: true,
    instruction: '提取合同正文标题，不使用附件目录标题。',
  },
  {
    key: 'contractNumber',
    name: '合同编号',
    type: 'text',
    required: true,
    instruction: '提取正式合同编号，排除项目编号、订单编号。',
  },
  {
    key: 'counterparty',
    name: '客户／签约对方',
    type: 'text',
    required: true,
    instruction: '提取与我方签约的对方主体全称。',
  },
  {
    key: 'company',
    name: '所属公司',
    type: 'text',
    required: true,
    instruction: '提取我方签约主体名称。',
  },
  {
    key: 'amount',
    name: '合同金额',
    type: 'amount',
    required: false,
    instruction: '提取含税合同总金额，统一换算为元，不将分期金额当作总额。',
  },
  {
    key: 'signedAt',
    name: '签订日期',
    type: 'date',
    required: false,
    instruction: '提取合同签订日期，不能替代服务开始日期。',
  },
  {
    key: 'startDate',
    name: '生效／服务开始日期',
    type: 'date',
    required: false,
    instruction: '只提取明确约定的日期；依赖验收等未发生事件时保留待确认。',
  },
  {
    key: 'expiryDate',
    name: '到期／服务结束日期',
    type: 'date',
    required: false,
    instruction: '提取明确约定的到期日期，不能确定时保留待确认。',
  },
  {
    key: 'scope',
    name: '交付／服务范围',
    type: 'text',
    required: true,
    instruction: '概括明确约定的交付或服务范围，保留重要边界。',
  },
  {
    key: 'location',
    name: '交付／服务地点',
    type: 'text',
    required: false,
    instruction: '提取合同明确的交付或服务地点。',
  },
  {
    key: 'owner',
    name: '合同负责人',
    type: 'text',
    required: false,
    instruction: '合同明确指定时提取，否则由用户指定。',
  },
  {
    key: 'salesManager',
    name: '销售经理',
    type: 'text',
    required: false,
    instruction: '提取明确的销售经理，无约定时留空。',
  },
  {
    key: 'deliveryDate',
    name: '交付日期',
    type: 'date',
    required: false,
    instruction: '提取合同明确约定的交付日期。',
  },
  {
    key: 'invoiceTerms',
    name: '开票约定',
    type: 'text',
    required: false,
    instruction: '提取开票条件、税率及分期开票要求。',
  },
  {
    key: 'paymentTerms',
    name: '收付款约定',
    type: 'text',
    required: false,
    instruction: '提取收付款条件及分期要求，区分我方付款与客户付款。',
  },
  {
    key: 'paymentSchedule',
    name: '收付款明细',
    type: 'detail',
    required: false,
    instruction: '按期次逐行提取条件、日期、金额，不补造未约定日期。',
    columns: [
      { key: 'name', name: '期次', type: 'text' },
      { key: 'date', name: '约定日期', type: 'date' },
      { key: 'amount', name: '金额（元）', type: 'amount' },
    ],
  },
  {
    key: 'frequency',
    name: '巡检频次',
    type: 'option',
    required: false,
    instruction: '提取每月或每季度一次等约定，不将总次数当作频次。',
    options: ['每月', '每季度'],
  },
  {
    key: 'requirements',
    name: '检查要求',
    type: 'text',
    required: false,
    instruction: '提取检查内容、服务约束及交付记录要求。',
  },
  {
    key: 'devices',
    name: '设备清单',
    type: 'detail',
    required: false,
    instruction: '逐行提取设备编号和名称，不能将清单拼为一个文本。',
    columns: [
      { key: 'code', name: '设备编号', type: 'text' },
      { key: 'name', name: '设备名称', type: 'text' },
    ],
  },
];
export const contractExtractionOptions = base;
export function defaultContractExtraction(category?: string) {
  const exclude =
    category === 'service'
      ? ['salesManager', 'deliveryDate']
      : ['frequency', 'requirements', 'devices'];
  if (category === 'purchase') exclude.push('salesManager');
  return structuredClone(base.filter((field) => !exclude.includes(field.key)));
}
export function extractionValue(
  item: ContractChatSession,
  key: string,
): string {
  if (key === 'name') return item.fileName.replace(/\.[^.]+$/, '');
  if (key === 'startDate') return item.start;
  if (key === 'expiryDate') return item.managementState?.expiryDate || '';
  if (key === 'requirements') return item.special;
  if (key === 'frequency') return item.extractedFields?.frequency || '';
  const value = (item as unknown as Record<string, unknown>)[key];
  return value === undefined
    ? item.extractedFields?.[key] || ''
    : String(value);
}
export function validateExtraction(fields: ContractExtractionField[]) {
  const errors: string[] = [];
  const keys = new Set<string>();
  if (fields.length === 0) errors.push('请至少选择一个提取字段');
  for (const [index, field] of fields.entries()) {
    const prefix = `提取字段${index + 1}：`;
    if (!field.name.trim() || !field.instruction.trim())
      errors.push(`${prefix}请填写名称和提取要求`);
    if (
      !/^[A-Z]\w*$/i.test(field.key) ||
      ['__proto__', 'constructor', 'prototype'].includes(field.key)
    )
      errors.push(`${prefix}字段编码无效`);
    if (
      !base.some((item) => item.key === field.key) &&
      !field.key.startsWith('custom_')
    )
      errors.push(`${prefix}自定义编码须以custom_开头`);
    if (keys.has(field.key)) errors.push(`${prefix}字段编码重复`);
    keys.add(field.key);
    if (
      field.type === 'option' &&
      !field.options?.filter((value) => value.trim()).length
    )
      errors.push(`${prefix}请维护可选值`);
    if (field.type === 'detail') {
      if (!field.columns?.length) errors.push(`${prefix}请添加明细列`);
      const columns = new Set<string>();
      for (const column of field.columns || []) {
        if (
          !/^[A-Z]\w*$/i.test(column.key) ||
          ['constructor', 'prototype'].includes(column.key) ||
          !column.name.trim() ||
          columns.has(column.key)
        )
          errors.push(`${prefix}明细列名称、编码须有效且不重复`);
        columns.add(column.key);
      }
    }
  }
  return errors;
}
export function missingContractExtraction(item: ContractChatSession) {
  const errors: string[] = [];
  for (const field of item.scheme?.management?.extraction || []) {
    const value = extractionValue(item, field.key).trim();
    if (field.required && !value) {
      errors.push(`请补充${field.name}`);
      continue;
    }
    if (!value) continue;
    if (field.type === 'detail')
      try {
        const rows: unknown = JSON.parse(value);
        if (!Array.isArray(rows)) throw new Error('明细须为 JSON 数组');
        if (field.required && rows.length === 0)
          errors.push(`请补充${field.name}明细`);
        for (const row of rows) {
          if (!row || typeof row !== 'object' || Array.isArray(row))
            throw new Error('明细行须为对象');
          for (const column of field.columns || []) {
            const cell = (row as Record<string, unknown>)[column.key];
            if (column.required && (cell === undefined || cell === ''))
              errors.push(`${field.name}：请补充${column.name}`);
            if (
              cell !== undefined &&
              cell !== '' &&
              column.type === 'amount' &&
              !Number.isFinite(Number(cell))
            )
              errors.push(`${field.name}：${column.name}金额格式无效`);
          }
        }
      } catch {
        errors.push(`${field.name}须为有效的明细JSON数组`);
      }
    if (field.type === 'amount' && !Number.isFinite(Number(value)))
      errors.push(`${field.name}金额格式无效`);
    if (field.type === 'date') {
      const date = new Date(`${value}T12:00:00Z`);
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== value
      )
        errors.push(`${field.name}日期无效`);
    }
    if (field.type === 'option' && !field.options?.includes(value))
      errors.push(`${field.name}不在配置选项中`);
  }
  return [...new Set(errors)];
}
