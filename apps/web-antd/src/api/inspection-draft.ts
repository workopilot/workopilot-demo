import type { InspectionDraft } from '#/types/inspection';

export function emptyInspectionDraft(): InspectionDraft {
  return {
    contractId: '',
    name: '',
    contract: '',
    contractText: '',
    customer: '',
    project: '',
    start: '',
    end: '',
    scope: '',
    requirements: '',
    frequency: '',
    firstDate: '',
    owner: '',
    team: '',
    advanceDays: 3,
  };
}

/** 演示解析：仅提取明确提供的标签字段，不补造合同事实。 */
export function collectInspectionDraft(
  text: string,
  current: InspectionDraft,
): InspectionDraft {
  const draft = {
    ...current,
    contractText: [current.contractText, text].filter(Boolean).join('\n'),
  };
  const labels: Record<string, keyof InspectionDraft> = {
    合同档案号: 'contractId',
    合同名称: 'contract',
    合同: 'contract',
    计划名称: 'name',
    客户名称: 'customer',
    客户: 'customer',
    项目名称: 'project',
    项目: 'project',
    巡检范围: 'scope',
    交付或服务范围: 'scope',
    服务范围: 'scope',
    检查要求: 'requirements',
    巡检要求: 'requirements',
    特殊服务要求: 'requirements',
    负责人: 'owner',
    执行班组: 'team',
    负责团队: 'team',
    班组: 'team',
    首次巡检日期: 'firstDate',
    首次执行日期: 'firstDate',
    服务开始日期: 'start',
    起算日期: 'start',
    到期日期: 'end',
    服务结束日期: 'end',
    执行频次: 'frequency',
    巡检频次: 'frequency',
    服务期限: 'contractText',
  };
  const pattern = new RegExp(
    String.raw`(${Object.keys(labels)
      .toSorted((a, b) => b.length - a.length)
      .join('|')})[：:]\s*`,
    'g',
  );
  const matches = [...text.matchAll(pattern)];
  for (const [i, match] of matches.entries()) {
    const value = text
      .slice(
        (match.index ?? 0) + match[0].length,
        matches[i + 1]?.index ?? text.length,
      )
      .split('\n')[0]
      ?.replace(/[，,；;。\s]+$/, '')
      .trim();
    const field = labels[match[1] ?? ''];
    if (!field) continue;
    if (
      !value ||
      /^(?:待确认|待核对|待补充|尚未确认|未提供|暂无)(?:[（(].*)?$/.test(value)
    )
      continue;
    if (field === 'contractText') {
      const dates = value.match(/\d{4}-\d{2}-\d{2}/g);
      if (dates?.length === 2) {
        draft.start = dates[0] ?? '';
        draft.end = dates[1] ?? '';
      }
    } else if (field === 'frequency') {
      if (/每月|每季度|每季/.test(value))
        draft.frequency = /每季/.test(value) ? '每季度' : '每月';
    } else if (field !== 'advanceDays') {
      draft[field] = value;
    }
  }
  // 无标签时也识别明确频次，其他事实仍由用户补齐。
  if (/每月(?:巡检)?一?次/.test(text)) draft.frequency = '每月';
  if (/每季度?(?:巡检)?一?次/.test(text)) draft.frequency = '每季度';
  if (!draft.name && draft.contract) draft.name = `${draft.contract}巡检计划`;
  return draft;
}

export const inspectionRequiredFields: [keyof InspectionDraft, string][] = [
  ['contract', '合同名称'],
  ['contractText', '合同信息'],
  ['name', '计划名称'],
  ['customer', '客户'],
  ['project', '项目'],
  ['start', '服务开始日期'],
  ['end', '服务结束日期'],
  ['scope', '巡检范围'],
  ['requirements', '检查要求'],
  ['frequency', '巡检频次'],
  ['firstDate', '首次巡检日期'],
  ['owner', '负责人'],
  ['team', '执行班组'],
];
export function missingInspectionFields(draft: InspectionDraft) {
  return inspectionRequiredFields
    .filter(([key]) => !String(draft[key] ?? '').trim())
    .map(([, label]) => label);
}
function validDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value
  );
}
export function buildInspectionDates(draft: InspectionDraft): string[] {
  if (
    ![draft.start, draft.end, draft.firstDate].every((value) =>
      validDate(value),
    )
  )
    throw new Error('请填写有效的服务期限和首次巡检日期');
  if (draft.start > draft.end) throw new Error('服务开始日期不能晚于结束日期');
  if (draft.firstDate < draft.start || draft.firstDate > draft.end)
    throw new Error('首次巡检日期必须在服务期限内');
  if (!['每季度', '每月'].includes(draft.frequency))
    throw new Error('请选择每月或每季度巡检');
  const base = new Date(`${draft.firstDate}T12:00:00Z`);
  const result: string[] = [];
  for (let i = 0; i < 1200; i++) {
    const date = new Date(base);
    date.setUTCDate(1);
    date.setUTCMonth(
      base.getUTCMonth() + i * (draft.frequency === '每季度' ? 3 : 1),
    );
    const lastDay = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
    ).getUTCDate();
    date.setUTCDate(Math.min(base.getUTCDate(), lastDay));
    const value = date.toISOString().slice(0, 10);
    if (value > draft.end) return result;
    result.push(value);
  }
  throw new Error('排期超过 1200 次，请缩短服务期限');
}
