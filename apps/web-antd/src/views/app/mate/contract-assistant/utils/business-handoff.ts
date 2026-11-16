import type {
  ContractChatSession,
  ContractRelatedItem,
} from '#/types/contract-assistant';

export type ContractBusinessTask = 'collection' | 'inspection' | 'invoice';

/** 按业务任务传递必要合同信息，不携带整份合同或无关业务数据。 */
export function buildContractBusinessHandoff(
  contract: ContractChatSession,
  items: ContractRelatedItem[],
  task: ContractBusinessTask,
) {
  const context = [
    `合同档案号：${contract.id}`,
    `合同名称：${contract.fileName.replace(/\.[^.]+$/, '')}`,
    `合同编号：${contract.contractNumber || '待确认'}`,
    `客户：${contract.counterparty || '待确认'}`,
    `交付或服务范围：${contract.scope || '待确认'}`,
    `负责人：${contract.owner || '待确认'}`,
  ];
  if (task === 'inspection') {
    context.push(
      `项目：${items.find((item) => item.type === 'project')?.name || '待确认'}`,
      `负责团队：${contract.team || '待确认'}`,
      `巡检频次：${
        [contract.special, contract.scope, contract.sourceText]
          .filter(Boolean)
          .join('\n')
          .match(/每月|每季度|每季/)?.[0] || '待确认'
      }`,
      `服务地点：${contract.location || '待确认'}`,
      `巡检次数：${contract.count > 0 ? `${contract.count}次（待核对合同约定）` : '待确认'}`,
      `起算日期：${contract.managementState?.dateConfirmed ? contract.start || '待确认' : '尚未确认'}`,
      `到期日期：${contract.managementState?.dateConfirmed ? contract.managementState.expiryDate || '待确认' : '尚未确认'}`,
      `特殊服务要求：${contract.special || '待核对'}`,
    );
  } else {
    context.push(
      `合同金额：${contract.amount === undefined ? '待确认' : `${contract.amount.toLocaleString('zh-CN')}元`}`,
      `销售经理：${contract.salesManager || contract.owner || '待确认'}`,
      task === 'invoice'
        ? `开票约定：${contract.invoiceTerms || '待核对'}`
        : `收款约定：${contract.paymentTerms || '待核对'}`,
    );
  }
  const existing = items.filter((item) => item.type === task);
  const existingText =
    existing.length > 0
      ? `当前已关联${existing.length}项：\n${existing.map((item) => `- ${item.name}；计划日期：${item.plannedDate}；状态：${{ pending: '待办理', 'in-progress': '进行中', completed: '已完成', overdue: '已逾期' }[item.status]}；进展：${item.progress}`).join('\n')}`
      : '当前档案暂无该类关联事项，仍需核对业务模块中是否已有计划。';
  let request: string;
  if (task === 'inspection')
    request =
      '请根据这份运维合同协助制订巡检计划。先核对已有安排，避免重复创建；区分合同约定与建议日期，核对服务期限、频次、地点、负责团队和人员。起算事件尚未发生时列出待确认条件，不得编造日期或直接派发工单。整理计划草稿，待用户确认后再办理。';
  else if (task === 'invoice')
    request =
      '请根据这份销售合同协助制订开票计划。先核对已有安排，避免重复创建；核对各期金额、开票条件、计划日期和责任人，缺失信息先请用户补充。整理开票计划草稿，待用户确认后再办理，提醒已发送不等于已开票。';
  else
    request =
      '请根据这份销售合同协助制订收款计划。先核对已有安排和实际到账，避免重复创建；核对各期应收金额、付款条件、应收日期和责任人，缺失信息先请用户补充。整理收款计划草稿，待用户确认后再办理，到账以财务确认为准。';
  return {
    path:
      task === 'inspection'
        ? '/app/mate/employee/ticket-assistant/ticket-chat'
        : '/app/mate/employee/sales-assistant/sales-chat',
    query: {
      contractId: contract.contractId || contract.id,
      intent: task,
      ...(task === 'inspection'
        ? { intent: 'inspection-create', inspectionContext: context.join('\n') }
        : {}),
      prefill: `${context.join('\n')}\n\n${existingText}\n\n${request}`,
    },
  };
}
