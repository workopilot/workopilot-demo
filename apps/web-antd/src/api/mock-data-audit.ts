import type { AuditRule, AuditScheme } from '#/types/audit';

export const mockAuditRules: AuditRule[] = [
  {
    id: '1',
    code: 'RULE_HTL_01',
    name: '住宿费-一线城市限额',
    scope: 'line',
    applicableCategories: ['住宿费'],
    prompt: `你是一名财务审核专家。
任务：检查当前报销明细 {{item}} 的金额是否符合职级标准。

参考数据：
1. 员工职级：{{hr_info}}
2. 附件证据：{{proofs}}
3. 管理制度：{{policy}}

步骤：
1. 从 {{proofs}} 中找到发票金额，核对是否与 {{item}} 一致。
2. 根据 {{hr_info}} 匹配 {{policy}} 中的限额。
3. 如果涉及外币，请使用 \`exchange_rate\` 工具计算。

输出 JSON：{ "is_pass": bool, "reason": "string" }`,
    version: 'V1.2',
    status: 'active',
    dataSources: [
      { type: 'POLICY', policyId: '差旅管理办法' },
      { type: 'PLUGIN', pluginId: '汇率查询' },
    ],
    tools: ['exchange_rate'],
    usageCount: 3,
    createdAt: '2024-01-01',
    updatedAt: '2024-03-15',
  },
  {
    id: '2',
    code: 'RULE_INV_CHK',
    name: '发票抬头一致性',
    scope: 'entire',
    prompt: `检查发票抬头是否与公司名称一致。`,
    version: 'V1.0',
    status: 'active',
    dataSources: [{ type: 'ATTACH', filterCats: ['发票提取'] }],
    tools: [],
    usageCount: 15,
    createdAt: '2024-02-01',
    updatedAt: '2024-02-01',
  },
  {
    id: '3',
    code: 'RULE_TRAIN_01',
    name: '火车票-席别管控',
    scope: 'line',
    applicableCategories: ['交通费'],
    prompt: `任务：检查火车票席别是否符合职级标准。
规则：
1. 员工（M3以下）：仅限二等座/硬卧。
2. 经理（M3-M5）：一等座/软卧。
3. 高管（M6以上）：商务座。`,
    version: 'V2.0',
    status: 'active',
    dataSources: [{ type: 'POLICY', policyId: '差旅管理办法' }],
    tools: [],
    usageCount: 8,
    createdAt: '2024-03-10',
    updatedAt: '2024-03-20',
  },
  {
    id: '4',
    code: 'RULE_MEAL_01',
    name: '业务招待费-人均限额',
    scope: 'line',
    applicableCategories: ['业务招待费'],
    prompt: `任务：计算人均消费是否超标。
输入：总金额、参与人数。
标准：一线城市 500元/人，其他城市 300元/人。`,
    version: 'V1.0',
    status: 'inactive',
    dataSources: [{ type: 'POLICY', policyId: '招待费管理办法' }],
    tools: [],
    usageCount: 0,
    createdAt: '2024-03-12',
    updatedAt: '2024-03-12',
  },
  {
    id: '5',
    code: 'RULE_TAXI_01',
    name: '打车费-连号发票检查',
    scope: 'entire',
    applicableCategories: ['市内交通费'],
    prompt: `检查提供的打车发票是否存在连号情况，若存在3张以上连号，标记为风险。`,
    version: 'V1.1',
    status: 'active',
    dataSources: [{ type: 'ATTACH', filterCats: ['出租车票'] }],
    tools: [],
    usageCount: 5,
    createdAt: '2024-03-15',
    updatedAt: '2024-03-18',
  },
  {
    id: '6',
    code: 'RULE_FLIGHT_01',
    name: '机票-提前预订检查',
    scope: 'line',
    applicableCategories: ['交通费'],
    prompt: '检查机票是否提前3天预订。',
    version: 'V1.0',
    status: 'active',
    dataSources: [{ type: 'POLICY', policyId: '差旅管理办法' }],
    tools: [],
    usageCount: 12,
    createdAt: '2024-03-20',
    updatedAt: '2024-03-20',
  },
  {
    id: '7',
    code: 'RULE_HOTEL_02',
    name: '住宿费-连住优惠检查',
    scope: 'line',
    applicableCategories: ['住宿费'],
    prompt: '检查连续住宿超过3天是否使用了协议酒店优惠价。',
    version: 'V1.0',
    status: 'inactive',
    dataSources: [{ type: 'POLICY', policyId: '差旅管理办法' }],
    tools: [],
    usageCount: 0,
    createdAt: '2024-03-21',
    updatedAt: '2024-03-21',
  },
  {
    id: '8',
    code: 'RULE_GIFT_01',
    name: '礼品费-合规性检查',
    scope: 'line',
    applicableCategories: ['业务招待费'],
    prompt: '检查礼品费是否包含违规物品（如烟酒、奢侈品）。',
    version: 'V1.1',
    status: 'active',
    dataSources: [{ type: 'POLICY', policyId: '合规手册' }],
    tools: [],
    usageCount: 7,
    createdAt: '2024-03-22',
    updatedAt: '2024-03-22',
  },
];

// 合同管理复用同一审核规则与方案目录。
mockAuditRules.push(
  {
    id: 'contract-signature',
    code: 'CONTRACT_SIGNATURE',
    name: '合同签署完整性',
    scope: 'entire',
    prompt:
      '检查合同双方签署、印章与主体是否完整，返回证据和异常说明；不能确认的内容应标记待核对。',
    version: 'V1.0',
    status: 'active',
    dataSources: [],
    tools: [],
    usageCount: 0,
    createdAt: '2026-10-20',
    updatedAt: '2026-10-20',
  },
  {
    id: 'contract-consistency',
    code: 'CONTRACT_CONSISTENCY',
    name: '合同提取一致性',
    scope: 'entire',
    prompt:
      '核对合同提取信息与原文，检查主体、金额、日期及关键约定是否一致，列出差异与原文依据。',
    version: 'V1.0',
    status: 'active',
    dataSources: [],
    tools: [],
    usageCount: 0,
    createdAt: '2026-10-20',
    updatedAt: '2026-10-20',
  },
);
export const mockAuditSchemes: AuditScheme[] = [
  {
    id: 'contract-general',
    code: 'CONTRACT_GENERAL',
    name: '合同归档审核方案',
    billType: 'CONTRACT',
    globalConfidenceThreshold: 80,
    rules: [
      { ruleId: 'contract-signature', action: 'BLOCK', priority: 1 },
      { ruleId: 'contract-consistency', action: 'WARNING', priority: 2 },
    ],
    createdAt: '2026-10-20',
    updatedAt: '2026-10-20',
  },

  {
    id: '1',
    code: 'SCHEME_SAP_CN',
    name: 'SAP国内差旅标准方案',
    billType: 'SAP_TRAVEL',
    globalConfidenceThreshold: 60,
    rules: [
      {
        ruleId: '1',
        action: 'BLOCK',
        priority: 1,
        localConfidenceThreshold: 80,
      },
      { ruleId: '2', action: 'WARNING', priority: 2 },
    ],
    createdAt: '2024-01-10',
    updatedAt: '2024-03-20',
  },
];

export function mockDelay(ms: number = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createMockResponse<T>(data: T) {
  return {
    code: 0,
    data,
    message: 'success',
  };
}
