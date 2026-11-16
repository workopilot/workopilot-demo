import type { NotificationTemplate } from '#/types/platform';

export const defaultContractMessageTemplateId = 'tpl_contract_expiry';
export const contractMessageVariables = [
  '合同名称',
  '合同编号',
  '签约对方',
  '到期日期',
  '合同负责人',
  '事项名称',
];
export function supportsContractMessageTemplate(
  template: NotificationTemplate,
) {
  const used = [
    ...template.variables,
    ...[
      ...`${template.title}\n${template.content}`.matchAll(/\{\{([^{}]+)\}\}/g),
    ].map((match) => (match[1] ?? '').trim()),
  ];
  return (
    template.enabled &&
    template.channel === 'in-app' &&
    used.every((key) => contractMessageVariables.includes(key))
  );
}
export function renderContractMessage(
  template: NotificationTemplate,
  values: Record<string, string>,
) {
  if (!supportsContractMessageTemplate(template))
    throw new Error('消息模版已停用、渠道不匹配或包含不支持的变量');
  const render = (text: string) =>
    text.replaceAll(
      /\{\{([^{}]+)\}\}/g,
      (_, key: string) => values[key.trim()] || '待确认',
    );
  return { title: render(template.title), content: render(template.content) };
}
