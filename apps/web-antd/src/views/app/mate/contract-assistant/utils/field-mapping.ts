import type { ContractFieldMapping } from '#/types/contract-assistant';

export const standardContractFields = [
  { value: 'contractNumber', label: '合同编号', kind: 'text' },
  { value: 'name', label: '合同名称', kind: 'text' },
  { value: 'counterparty', label: '客户／签约对方', kind: 'text' },
  { value: 'company', label: '所属公司', kind: 'text' },
  { value: 'amount', label: '合同金额（元）', kind: 'amount' },
  { value: 'signedAt', label: '签订日期', kind: 'date' },
  { value: 'startDate', label: '生效／服务开始日期', kind: 'date' },
  { value: 'expiryDate', label: '到期／服务结束日期', kind: 'date' },
  { value: 'scope', label: '交付／服务范围', kind: 'text' },
  { value: 'location', label: '交付／服务地点', kind: 'text' },
  { value: 'owner', label: '合同负责人', kind: 'text' },
  { value: 'salesManager', label: '销售经理', kind: 'text' },
  { value: 'deliveryDate', label: '交付日期', kind: 'date' },
  { value: 'invoiceTerms', label: '开票约定', kind: 'text' },
  { value: 'paymentTerms', label: '收付款约定', kind: 'text' },
  { value: 'frequency', label: '巡检频次', kind: 'text' },
  { value: 'requirements', label: '检查要求', kind: 'text' },
  { value: 'paymentSchedule[].name', label: '收付款明细 · 期次', kind: 'text' },
  { value: 'paymentSchedule[].date', label: '收付款明细 · 日期', kind: 'date' },
  {
    value: 'paymentSchedule[].amount',
    label: '收付款明细 · 金额（元）',
    kind: 'amount',
  },
  { value: 'devices[].code', label: '设备清单 · 设备编号', kind: 'text' },
  { value: 'devices[].name', label: '设备清单 · 设备名称', kind: 'text' },
  { value: 'details', label: '租户扩展字段', kind: 'json' },
];
export function allowedMappingTransforms(target: string) {
  const kind = standardContractFields.find(
    (item) => item.value === target,
  )?.kind;
  if (target === 'details')
    return ['auto', 'text', 'number', 'amount', 'wan-amount', 'date', 'json'];
  if (kind === 'date') return ['auto', 'date'];
  if (kind === 'amount') return ['auto', 'number', 'amount', 'wan-amount'];
  return ['auto', 'text'];
}
export const sourcePath = (mapping: ContractFieldMapping) =>
  mapping.path?.trim() || mapping.source.slice(mapping.source.indexOf(':') + 1);
const dangerous = new Set(['__proto__', 'constructor', 'prototype']);
export function validMappingPath(path: string) {
  return (
    !!path &&
    path
      .split('.')
      .every(
        (part) =>
          /^[^.[\]\s]+(?:\[\])?$/.test(part) &&
          !dangerous.has(part.replace(/\[\]$/, '')),
      )
  );
}
function readPath(root: unknown, parts: string[]): unknown {
  if (parts.length === 0) return root;
  const [head = '', ...rest] = parts;
  const array = head.endsWith('[]');
  const key = array ? head.slice(0, -2) : head;
  const value =
    root && typeof root === 'object' && Object.hasOwn(root, key)
      ? (root as Record<string, unknown>)[key]
      : undefined;
  if (array) {
    if (!Array.isArray(value)) throw new Error(`“${key}”不是明细数组`);
    return value.map((row) => readPath(row, rest));
  }
  return readPath(value, rest);
}
function convert(value: unknown, transform: string, enumMap?: string): unknown {
  if (value === undefined || value === null || value === '') return undefined;
  if (Array.isArray(value))
    return value.map((item) => convert(item, transform, enumMap));
  if (enumMap?.trim()) {
    const values = JSON.parse(enumMap) as Record<string, unknown>;
    if (!Object.hasOwn(values, String(value)))
      throw new Error(`枚举值“${String(value)}”未配置对应关系`);
    value = values[String(value)];
  }
  if (transform === 'raw') return value;
  if (transform === 'json')
    return typeof value === 'string' ? JSON.parse(value) : value;
  if (typeof value === 'object')
    throw new Error('对象需选择子字段或使用保留JSON转换');
  if (transform === 'date') {
    const input = String(value)
      .trim()
      .replaceAll(/[年月/]/g, '-')
      .replace(/日$/, '');
    const match = input.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T].*)?$/);
    if (!match) throw new Error('日期须包含明确的年、月、日');
    const [, y = '', m = '', d = ''] = match;
    const formatted = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    const parsed = new Date(`${formatted}T12:00:00Z`);
    if (
      Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== formatted
    )
      throw new Error('日期无效');
    return formatted;
  }
  if (['amount', 'number', 'wan-amount'].includes(transform)) {
    let text = String(value).trim();
    const inWan = /万元?$/.test(text);
    if (transform !== 'number')
      text = text
        .replaceAll(/[￥¥元,，\s]/g, '')
        .replace(/^人民币/, '')
        .replace(/万元?$/, '');
    if (!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(text))
      throw new Error('数值格式无法识别');
    const num =
      Number(text) *
      (transform === 'wan-amount' || (transform === 'amount' && inWan)
        ? 10_000
        : 1);
    if (!Number.isFinite(num)) throw new Error('数值超出范围');
    return transform === 'number' ? num : Math.round(num * 100) / 100;
  }
  return String(value);
}
export function validateFieldMappings(
  mappings: ContractFieldMapping[],
  fields: string[],
) {
  const issues: string[] = [];
  const used = new Set<string>();
  const roots = new Map<string, string>();
  for (const [index, mapping] of mappings.entries()) {
    const prefix = `字段对应 ${index + 1}：`;
    const path = sourcePath(mapping);
    if (!fields.includes(mapping.source))
      issues.push(`${prefix}提取字段已失效`);
    if (!validMappingPath(path) || path.split('[]').length > 2)
      issues.push(`${prefix}请输入有效JSON路径，支持一层明细数组`);
    const root = mapping.source.slice(mapping.source.indexOf(':') + 1);
    if (
      path !== root &&
      !path.startsWith(`${root}.`) &&
      !path.startsWith(`${root}[].`) &&
      path !== `${root}[]`
    )
      issues.push(`${prefix}JSON路径须位于所选提取字段下`);
    if (!standardContractFields.some((item) => item.value === mapping.target))
      issues.push(`${prefix}请选择产品字段`);
    if (
      mapping.transform &&
      !allowedMappingTransforms(mapping.target).includes(mapping.transform)
    )
      issues.push(`${prefix}转换方式与产品字段类型不匹配`);
    const targetArray = mapping.target.includes('[]');
    if (targetArray !== path.includes('[]') && mapping.target !== 'details')
      issues.push(`${prefix}明细数组须对应明细字段，或保留为扩展JSON`);
    const key =
      mapping.target === 'details'
        ? `extension:${mapping.extensionKey?.trim() || path}`
        : mapping.target;
    if (used.has(key)) issues.push(`${prefix}目标字段重复，请保留一个来源`);
    used.add(key);
    if (
      mapping.target === 'details' &&
      mapping.extensionKey?.trim() &&
      !validMappingPath(mapping.extensionKey.trim())
    )
      issues.push(`${prefix}扩展字段编码无效`);
    if (targetArray) {
      const targetRoot = mapping.target.split('[]')[0] ?? '';
      const sourceRoot = path.split('[]')[0] ?? '';
      if (roots.has(targetRoot) && roots.get(targetRoot) !== sourceRoot)
        issues.push(`${prefix}同一明细表应引用同一来源数组，避免行错配`);
      roots.set(targetRoot, sourceRoot);
    }
    if (mapping.enumMap?.trim()) {
      try {
        const values = JSON.parse(mapping.enumMap);
        if (
          !values ||
          typeof values !== 'object' ||
          Array.isArray(values) ||
          Object.keys(values).some((key) => dangerous.has(key))
        )
          throw new Error('枚举对应含不安全键名');
      } catch {
        issues.push(`${prefix}枚举对应须为JSON对象`);
      }
    }
  }
  return issues;
}
function unmappedValue(
  value: unknown,
  path: string,
  used: Set<string>,
): unknown {
  if (used.has(path)) return undefined;
  if (Array.isArray(value)) {
    if (used.has(`${path}[]`)) return undefined;
    const rows = value.map((row) => unmappedValue(row, `${path}[]`, used));
    return rows.every((row) => row === undefined)
      ? undefined
      : rows.map((row) => (row === undefined ? null : row));
  }
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      if (dangerous.has(key)) continue;
      const remaining = unmappedValue(
        child,
        path ? `${path}.${key}` : key,
        used,
      );
      if (remaining !== undefined) result[key] = remaining;
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }
  return value;
}
export function previewFieldMappings(
  raw: unknown,
  mappings: ContractFieldMapping[],
) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    throw new Error('提取结果须为JSON对象');
  const output: Record<string, unknown> = {};
  const extensions: Record<string, unknown> = {};
  const results = mappings.map((mapping) => {
    const path = sourcePath(mapping);
    const label =
      standardContractFields.find((item) => item.value === mapping.target)
        ?.label || mapping.target;
    try {
      if (!validMappingPath(path)) throw new Error('JSON路径无效');
      const input = readPath(raw, path.split('.'));
      const target = standardContractFields.find(
        (item) => item.value === mapping.target,
      );
      if (!target) throw new Error('产品字段无效');
      if (
        mapping.extensionKey &&
        !validMappingPath(mapping.extensionKey.trim())
      )
        throw new Error('扩展字段编码无效');
      const kind = mapping.target === 'details' ? 'raw' : target.kind;
      const value = convert(
        input,
        mapping.transform && mapping.transform !== 'auto'
          ? mapping.transform
          : kind,
        mapping.enumMap,
      );
      if (
        value === undefined ||
        (Array.isArray(value) &&
          (value.length === 0 || value.includes(undefined)))
      )
        throw new Error(
          mapping.required
            ? '必填字段缺失，请补充'
            : '未提取到完整内容，待人工补充',
        );
      if (mapping.target === 'details')
        extensions[mapping.extensionKey?.trim() || path] = value;
      else if (mapping.target.includes('[].')) {
        const [key, field] = mapping.target.split('[].') as [string, string];
        if (!Array.isArray(value)) throw new Error('明细字段需要数组来源');
        const rows = (output[key] ||= []) as Record<string, unknown>[];
        value.forEach((item, index) => {
          const row = (rows[index] ||= {});
          row[field] = item;
        });
      } else output[mapping.target] = value;
      return { path, label, value, error: '' };
    } catch (error) {
      return { path, label, value: undefined, error: (error as Error).message };
    }
  });
  const consumed = new Set(
    results.filter((row) => !row.error).map((row) => row.path),
  );
  const remaining = unmappedValue(raw, '', consumed) as
    Record<string, unknown> | undefined;
  for (const [key, value] of Object.entries(remaining || {})) {
    if (!Object.hasOwn(extensions, key)) extensions[key] = value;
  }
  return { output, extensions, results, raw };
}
export function discoverJsonPaths(
  value: unknown,
  prefix = '',
  result: string[] = [],
): string[] {
  if (!value || typeof value !== 'object') return result;
  for (const [key, child] of Object.entries(value)) {
    if (dangerous.has(key)) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    result.push(path);
    if (Array.isArray(child)) {
      result.push(`${path}[]`);
      for (const row of child) discoverJsonPaths(row, `${path}[]`, result);
    } else discoverJsonPaths(child, path, result);
  }
  return [...new Set(result)];
}
