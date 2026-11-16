import type {
  ContractFulfillmentConfig,
  ContractManagementConfig,
} from '#/types/contract-assistant';

export const fulfillmentPresets: {
  description: string;
  fields: string[];
  name: string;
  type: ContractFulfillmentConfig['type'];
}[] = [
  {
    type: 'collection',
    name: '收款',
    fields: ['amount', 'paymentTerms', 'paymentSchedule'],
    description: '跟踪客户付款及分期到账',
  },
  {
    type: 'payment',
    name: '付款',
    fields: ['amount', 'paymentTerms', 'paymentSchedule'],
    description: '跟踪我方付款及付款条件',
  },
  {
    type: 'delivery',
    name: '交付',
    fields: ['scope', 'deliveryDate', 'location'],
    description: '跟踪交货、成果或资料移交',
  },
  {
    type: 'acceptance',
    name: '验收',
    fields: ['scope', 'deliveryDate'],
    description: '跟踪交付后的验收确认',
  },
  {
    type: 'service',
    name: '服务',
    fields: ['scope', 'startDate', 'expiryDate', 'frequency', 'requirements'],
    description: '跟踪巡检、培训或技术支持',
  },
];
export function createFulfillmentPreset(
  type: ContractFulfillmentConfig['type'],
  id: string,
): ContractFulfillmentConfig {
  const preset = fulfillmentPresets.find((item) => item.type === type);
  return {
    id,
    type,
    name: preset?.name || '',
    fields: preset ? [...preset.fields] : [],
    trigger: 'contract',
    method: 'manual',
    responsibility: 'owner',
    party: 'contract',
    schedule: 'contract',
    reminderDays: 3,
    advanceDays: 0,
  };
}
export const templatePresets = [
  {
    value: 'sales',
    label: '销售合同预设',
    name: '设备销售合同',
    scope: '适用于产品、设备或软件销售合同。',
    purpose: '识别向客户提供产品或成果、约定交付与收款的销售合同。',
  },
  {
    value: 'purchase',
    label: '采购合同预设',
    name: '设备采购合同',
    scope: '适用于设备、物资或软件采购合同。',
    purpose: '识别我方向供应商采购货物或服务，约定交付、验收与付款的合同。',
  },
  {
    value: 'service',
    label: '服务合同预设',
    name: '设备运维合同',
    scope: '适用于运维、技术支持、培训等服务合同。',
    purpose: '识别按服务期限、频次或服务成果履行义务的服务合同。',
  },
] as const;
export function defaultExpiryActions(
  key: string,
): ContractManagementConfig['lifecycle']['actions'] {
  return [
    {
      id: `${key}-before`,
      name: '到期前提醒',
      trigger: 'before-expiry',
      days: 30,
      action: 'message',
      recipients: ['合同负责人'],
      description: '核对合同到期安排，评估是否需要续约或衔接后续事项。',
      stopWhen: ['已续约', '已终止', '已作废'],
    },
    {
      id: `${key}-expiry`,
      name: '到期当天提醒',
      trigger: 'on-expiry',
      days: 0,
      action: 'message',
      recipients: ['合同负责人'],
      description: '核对合同是否已到期，以及是否仍有未完成履约事项。',
      stopWhen: ['已终止', '已作废'],
    },
  ];
}
