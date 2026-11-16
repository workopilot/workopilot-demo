import type { ContractScheme } from '#/types/contract-assistant';

import { ensureArchiveManagement } from '#/views/app/mate/contract-assistant/utils/archive-management';
import {
  defaultContractExtraction,
  missingContractExtraction,
  validateExtraction,
} from '#/views/app/mate/contract-assistant/utils/contract-extraction';
import {
  defaultExpiryActions,
  templatePresets,
} from '#/views/app/mate/contract-assistant/utils/implementation-presets';

import { reconcileContractChanges } from './contract-lifecycle';
import {
  contractPermission,
  contractUser,
  requireContractPermission,
} from './contract-permissions';
import {
  contractArchives,
  contractChatSessions,
  contractNow,
  relatedContractItems,
} from './contract-state';
import {
  createContractManagementDefaults,
  createMockResponse,
  mockDelay,
} from './mock-data';

const schemes: ContractScheme[] = [
  {
    id: 'maintenance',
    contractCategory: 'service',
    name: '运维巡检方案',
    purpose: '从合同服务要求到巡检计划，落实每一次服务承诺。',
    categoryIds: ['contract-maintenance'],
    fields: [
      'contract-maintenance:contract_number',
      'contract-maintenance:service_scope',
      'contract-maintenance:service_period',
      'contract-maintenance:inspection_frequency',
      'contract-maintenance:service_location',
    ],
    scope: '适用于包含定期巡检服务的合同，仅处理其中的运维服务部分。',
    owner: '实施管理员',
    version: 1,
    status: 'published',
    updatedAt: '2026-10-16',
    releases: [
      {
        version: 1,
        date: '2026-10-16',
        note: '发布定期巡检场景方案',
        owner: '实施管理员',
      },
    ],
  },
  {
    id: 'sales',
    contractCategory: 'sales',
    name: '销售开票与收款方案',
    purpose: '识别分期约定，分别推进开票与收款事项。',
    categoryIds: ['contract-sales'],
    fields: [
      'contract-sales:contract_number',
      'contract-sales:contract_amount',
      'contract-sales:signing_date',
      'contract-sales:payment_terms',
      'contract-sales:invoice_terms',
    ],
    scope: '适用于包含分期开票或收款约定的销售合同。',
    owner: '实施管理员',
    version: 1,
    status: 'draft',
    updatedAt: '2026-10-16',
    releases: [],
  },
  {
    id: 'purchase',
    contractCategory: 'purchase',
    name: '设备采购合同',
    purpose: '识别采购合同的交付、验收与付款约定，统一完成审核和建档。',
    categoryIds: [],
    fields: [],
    scope: '适用于设备、物资或软件采购合同。',
    owner: '实施管理员',
    version: 1,
    status: 'published',
    updatedAt: '2026-10-27',
    releases: [
      {
        version: 1,
        date: '2026-10-27',
        note: '发布设备采购合同类型',
        owner: '实施管理员',
      },
    ],
  },
];
// 管理配置与业务场景解耦；历史合同持有自己的配置快照。
function contractMappingTarget(source: string) {
  if (source.endsWith(':contract_number')) return 'contractNumber';
  if (source.endsWith(':contract_amount')) return 'amount';
  if (source.endsWith(':signing_date')) return 'signedAt';
  if (source.endsWith(':service_scope')) return 'scope';
  if (source.endsWith(':service_location')) return 'location';
  return 'details';
}
for (const scheme of schemes) {
  const sales = scheme.id === 'sales';
  scheme.name = sales ? '销售合同' : '运维服务合同';
  scheme.purpose = sales
    ? '统一管理销售合同的摘要、审核、有效期与到期事项。'
    : '统一管理运维合同的摘要、审核、有效期与到期事项。';
  scheme.management = createContractManagementDefaults(scheme.id, sales);
  scheme.management.code = scheme.id.toUpperCase();
  scheme.management.lifecycle.startBasis = 'contract';
  scheme.management.extraction = defaultContractExtraction(
    scheme.contractCategory,
  );
  const preset = templatePresets.find(
    (item) => item.value === scheme.contractCategory,
  );
  if (!preset) throw new Error('合同模板预设不可用');
  scheme.management.lifecycle.actions = defaultExpiryActions(scheme.id);
  scheme.purpose = preset.purpose;
  scheme.name = preset.name;
  delete scheme.management.fulfillment;
  scheme.management.mappings = scheme.fields.map((source) => ({
    source,
    target: contractMappingTarget(source),
  }));
}
export async function getContractSchemes() {
  await mockDelay();
  return createMockResponse(structuredClone(schemes));
}
export async function setContractCategoryEnabled(id: string, enabled: boolean) {
  await mockDelay();
  const selected = schemes.find((item) => item.id === id);
  if (!selected) throw new Error('合同类型不存在');
  const key = selected.management?.categoryKey || selected.id;
  for (const item of schemes) {
    if ((item.management?.categoryKey || item.id) === key)
      item.enabled = enabled;
  }
  return createMockResponse(true);
}
export async function saveContractScheme(scheme: ContractScheme) {
  if (scheme.status === 'published' && scheme.management?.extraction) {
    const errors = validateExtraction(scheme.management.extraction);
    if (errors.length > 0) throw new Error(errors[0]);
  }
  if (!['purchase', 'sales', 'service'].includes(scheme.contractCategory || ''))
    throw new Error('请选择合同类别：销售类、采购类或服务类');
  await mockDelay();
  const copy = structuredClone(scheme);
  if (copy.management) delete copy.management.fulfillment;
  const key = copy.management?.categoryKey || copy.id;
  const existing = schemes
    .filter((item) => (item.management?.categoryKey || item.id) === key)
    .toSorted((a, b) => b.version - a.version)[0];
  copy.enabled =
    existing?.enabled ?? copy.enabled ?? existing?.status !== 'disabled';

  const index = schemes.findIndex((item) => item.id === copy.id);
  if (index === -1) schemes.push(copy);
  else schemes[index] = copy;
  return createMockResponse(copy);
}

// 会话与合同档案分别维护：删除会话不删除合同档案。
type ContractChatSession =
  import('#/types/contract-assistant').ContractChatSession;
function copySession(value: ContractChatSession): ContractChatSession {
  const { file, ...data } = value;
  return { ...structuredClone(data), file };
}
function schemeById(id: string) {
  const scheme = schemes.find((item) => item.id === id);
  if (!scheme) throw new Error(`未找到方案 ${id}`);
  return scheme;
}
const exampleScheme = schemeById('maintenance');
for (const example of [
  {
    id: 'CT-DEMO-001',
    name: '园区设备运维服务合同.pdf',
    phase: 2,
    owner: '',
  },
  {
    id: 'CT-DEMO-002',
    name: '总部网络设备运维合同.pdf',
    phase: 4,
    owner: '张三',
  },
]) {
  const plans =
    example.phase === 4
      ? ['2026-10-20', '2027-01-20', '2027-04-20', '2027-07-20'].map(
          (date) => ({
            date,
            content: '网络设备例行巡检，完成后提交巡检记录。',
          }),
        )
      : [];
  const session: ContractChatSession = {
    id: example.id,
    fileName: example.name,
    phase: example.phase,
    scheme: structuredClone(exampleScheme),
    available: [structuredClone(exampleScheme)],
    pickedScheme: exampleScheme.id,
    scope: '网络与安防设备',
    location: example.phase === 4 ? '总部园区' : '园区A区',
    count: 4,
    special: '巡检前与客户预约，完成后提交巡检记录。',
    start: example.phase === 4 ? '2026-10-20' : '',
    team: example.phase === 4 ? '华东运维组' : '',
    owner: example.owner,
    plans,
    notes: [
      {
        role: 'assistant',
        text:
          example.phase === 4
            ? '履约计划已创建，可查看完整计划。'
            : '合同要求已确认，请补充验收日期、负责团队与负责人。',
      },
    ],
    draftText: '',
    editing: false,
    time: '10:20',
    createdAt: '2026-10-16 10:20',
    demo: true,
  };
  contractChatSessions.set(session.id, copySession(session));
  contractArchives.set(session.id, copySession(session));
}
// 销售合同按开票与收款分别建立事项，同一天可以有不同类型的事项。
const salesScheme = structuredClone(schemeById('sales'));
salesScheme.status = 'published';
salesScheme.releases = [
  {
    version: 1,
    date: '2026-10-17',
    note: '销售履约场景启用',
    owner: '实施管理员',
  },
];
const salesSchemeIndex = schemes.findIndex((item) => item.id === 'sales');
schemes[salesSchemeIndex] = salesScheme;
for (const example of [
  {
    id: 'CT-SALES-001',
    fileName: '华辰制造设备销售合同.pdf',
    phase: 3,
    customer: '华辰智能制造有限公司',
    amount: 300_000,
    owner: '王敏',
  },
  {
    id: 'CT-SALES-002',
    fileName: '远景科技软件销售合同.pdf',
    phase: 4,
    customer: '远景科技有限公司',
    amount: 180_000,
    owner: '李四',
  },
]) {
  const dates = ['2026-10-20', '2026-11-20', '2026-12-20'];
  const plans: ContractChatSession['plans'] = dates.flatMap((date, index) => [
    {
      date,
      kind: 'invoice' as const,
      title: `第${index + 1}期开票申请`,
      amount: example.amount / 3,
      content: `由销售负责人发起开票申请，财务确认实际开票记录。金额${(example.amount / 3).toLocaleString('zh-CN')}元。`,
    },
    {
      date,
      kind: 'collection' as const,
      title: `第${index + 1}期收款跟进`,
      amount: example.amount / 3,
      content: `销售负责人跟进客户付款，财务确认到账后完成。金额${(example.amount / 3).toLocaleString('zh-CN')}元，开票完成不等于款项到账。`,
    },
  ]);
  const session: ContractChatSession = {
    id: example.id,
    fileName: example.fileName,
    phase: example.phase,
    businessType: 'sales',
    contractNumber: example.id.replace('CT-', 'HT-'),
    counterparty: example.customer,
    company: '企财通科技有限公司',
    amount: example.amount,
    signedAt: '2026-10-17',
    salesManager: example.owner,
    deliveryDate: example.id === 'CT-SALES-001' ? '2026-10-25' : '2026-11-01',
    acceptanceRequirements:
      example.id === 'CT-SALES-001'
        ? '完成设备供货与安装，由客户核对设备清单并签署验收单。'
        : '完成软件许可交付与部署，由客户验证功能并签署验收单。',

    invoiceTerms: '合同分三期开票，每期金额为合同总额的三分之一。',
    paymentTerms:
      '分三期各支付合同总额的三分之一，付款日期分别为2026年10月20日、11月20日、12月20日。',
    sourceText: `合同总额人民币${example.amount.toLocaleString('zh-CN')}元，分三期各支付合同总额的三分之一，付款日期为2026年10月20日、11月20日、12月20日。按期发起开票申请，实际开票与到账分别确认。`,
    scheme: structuredClone(salesScheme),
    available: [structuredClone(salesScheme)],
    pickedScheme: salesScheme.id,
    scope: example.id.endsWith('001') ? '设备供货与安装' : '软件产品许可',
    location: '客户指定地点',
    count: 3,
    special: '开票与收款独立跟踪，到账以财务确认为准。',
    start: '2026-10-17',
    team: '销售一部',
    owner: example.owner,
    plans,
    notes: [
      {
        role: 'assistant',
        text:
          example.phase === 4
            ? '已创建三期开票与收款履约事项，共六条。'
            : '已提取三期开票与收款约定，请核对六条履约安排后确认创建。',
      },
    ],
    draftText: '',
    editing: false,
    time: '09:30',
    createdAt: '2026-10-17 09:30',
    demo: true,
  };
  contractChatSessions.set(session.id, copySession(session));
  contractArchives.set(session.id, copySession(session));
}
// 档案示例沿用管理配置快照，旧业务计划不再作为合同助理的建档产物。
for (const [id, original] of contractArchives) {
  const item = copySession(original);
  item.contractNumber ||= `HT-2026-${id.slice(-3)}`;
  item.counterparty ||= '华信科技有限公司';
  item.company ||= '企财通科技有限公司';
  item.owner ||= '王敏';
  item.department ||= item.businessType === 'sales' ? '市场部' : '技术部';
  item.contractId = item.id;
  item.sessionId = item.id;
  item.revision = 1;
  const state = ensureArchiveManagement(item);
  item.plans = [];
  item.notes = [
    {
      role: 'assistant',
      text: state.archived
        ? '合同已建档，摘要、审核结果及到期处理事项已保存。到期事项按已确认日期计算。'
        : '已匹配合同类别，请核对提取信息，接着确认合同摘要与审核结果。起算事件尚未发生时，可保留日期待确认。',
    },
  ];
  contractArchives.set(id, copySession(item));
  contractChatSessions.set(id, copySession(item));
}
// 使用相对日期，使档案中的不同有效状态在后续演示时仍可查看。
function archiveDateOffset(days: number) {
  const date = new Date(`${contractNow().slice(0, 10)}T12:00:00+08:00`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
// 为已建档的演示档案补充完整流转记录：上传草稿 → 智能审核 → 完成建档（新事件在前）。
function seedArchiveFlow(item: ContractChatSession, archiveDate: string) {
  const uploadAt = item.createdAt || `${archiveDate} 08:50`;
  const sameDay = uploadAt.slice(0, 10) >= archiveDate;
  const flowDate = sameDay ? uploadAt.slice(0, 10) : archiveDate;
  const actor = item.owner || '张三';
  item.changes = [
    {
      id: `${item.id}-flow-archive`,
      at: `${flowDate} ${sameDay ? '11:20' : '09:40'}`,
      actor,
      description: '完成合同建档',
      fields: [],
    },
    {
      id: `${item.id}-flow-audit`,
      at: `${flowDate} ${sameDay ? '10:40' : '09:10'}`,
      actor: '智能审核',
      description: '智能审核通过，未发现阻断问题',
      fields: [],
    },
    {
      id: `${item.id}-flow-upload`,
      at: uploadAt,
      actor,
      description: '上传合同，创建档案草稿',
      fields: [],
    },
  ];
}
const archiveStateExamples = [
  {
    suffix: '101',
    name: '嘉禾园区设备运维服务合同',
    sales: false,
    state: 'incomplete',
    start: 0,
    end: 365,
  },
  {
    suffix: '102',
    name: '启明科技软件采购合同',
    sales: true,
    state: 'pending',
    start: 0,
    end: 365,
  },
  {
    suffix: '103',
    name: '瑞丰制造设备销售合同',
    sales: true,
    state: 'issues',
    start: 0,
    end: 365,
  },
  {
    suffix: '104',
    name: '云川园区年度运维服务合同',
    sales: false,
    state: 'future',
    start: 30,
    end: 394,
  },
  {
    suffix: '105',
    name: '恒远科技软件销售合同',
    sales: true,
    state: 'active',
    start: -30,
    end: 334,
  },
  {
    suffix: '106',
    name: '南山园区网络设备运维合同',
    sales: false,
    state: 'expired',
    start: -400,
    end: -36,
  },
  {
    suffix: '107',
    name: '博达制造设备销售合同',
    sales: true,
    state: 'terminated',
    start: -120,
    end: 244,
  },
  {
    suffix: '108',
    name: '星海科技软件许可合同',
    sales: true,
    state: 'void',
    start: -10,
    end: 354,
  },
] as const;
for (const example of archiveStateExamples) {
  const base = contractArchives.get(
    example.sales ? 'CT-SALES-002' : 'CT-DEMO-002',
  );
  if (!base) continue;
  const item = copySession(base);
  item.id = `CT-STATE-${example.suffix}`;
  item.contractId = item.id;
  delete item.sessionId;
  item.fileName = `${example.name}.pdf`;
  item.contractNumber = `HT-2026-${example.suffix}`;
  item.counterparty = `${example.name.slice(0, 4)}有限公司`;
  item.owner = '张三';
  item.ownerId = 'u001';
  item.salesManager = example.sales ? '张三' : undefined;
  item.amount = example.sales ? 240_000 : 96_000;
  item.start = archiveDateOffset(example.start);
  item.signedAt = archiveDateOffset(-150);
  item.createdAt = `${archiveDateOffset(-7)} 09:30`;
  item.notes = [];
  item.changes = [];
  item.revision = 1;
  item.phase = ['incomplete', 'issues', 'pending'].includes(example.state)
    ? 3
    : 4;
  const state = ensureArchiveManagement(item);
  state.summary = `${example.name}。${item.scope}，合同双方按约定范围及期限完成交付或服务。`;
  state.archived = item.phase === 4;
  if (example.state === 'issues') state.auditStatus = 'issues';
  else if (state.archived) state.auditStatus = 'passed';
  else state.auditStatus = 'pending';
  state.auditConfirmed = state.archived;
  if (example.state === 'issues')
    state.auditNote =
      '合同正文与附件中的交付日期不一致，需补充确认后重新审核。';
  else if (state.archived)
    state.auditNote = '签约主体、合同编号及主要条款核对通过。';
  else state.auditNote = '';
  state.dateConfirmed = state.archived;
  state.expiryDate = archiveDateOffset(example.end);
  state.remindersConfirmed = state.archived;
  if (example.state === 'incomplete') {
    item.scope = '';
    state.summary = '';
    item.start = '';
    state.expiryDate = '';
  }
  if (state.archived)
    seedArchiveFlow(item, archiveDateOffset(Math.min(example.start, 0)));
  if (example.state === 'terminated' || example.state === 'void') {
    item.end = {
      kind: example.state === 'terminated' ? 'terminated' : 'void',
      reason:
        example.state === 'terminated'
          ? '双方协商提前结束合作，剩余结算另行跟进。'
          : '本合同被正式签署版本替代，经确认作废。',
      date: archiveDateOffset(-3),
      actor: '张三',
    };
    item.changes = [
      {
        id: `${item.id}-end`,
        at: `${item.end.date} 10:00`,
        actor: '张三',
        description: example.state === 'terminated' ? '终止合同' : '作废合同',
        fields: [{ label: '处理原因', before: '', after: item.end.reason }],
      },
      ...(item.changes || []),
    ];
  }
  contractArchives.set(item.id, item);
}
// 兜底：其余已建档的演示档案（如基础示例）若无建档流转记录，也补充完整流转。
for (const item of contractArchives.values()) {
  const state = ensureArchiveManagement(item);
  if (!state.archived) continue;
  if (item.changes?.some((change) => change.description.includes('建档')))
    continue;
  seedArchiveFlow(item, item.start || contractNow().slice(0, 10));
}
for (const [id, item] of contractArchives) {
  const state = ensureArchiveManagement(item);
  if (!['issues', 'passed'].includes(state.auditStatus)) continue;
  state.auditItems =
    state.auditStatus === 'issues'
      ? [
          {
            title: '合同条款一致性',
            status: 'blocked',
            severity: 'BLOCK',
            detail: state.auditNote || '交付日期存在冲突，需补充确认。',
            evidence: '合同正文与附件的交付约定不一致。',
          },
        ]
      : [
          {
            title: '合同信息完整性',
            status: 'passed',
            severity: 'BLOCK',
            detail: '合同编号、签约主体及服务范围已核对。',
            evidence: `合同编号：${item.contractNumber}；签约对方：${item.counterparty}`,
          },
          {
            title: '签署材料核对',
            status: 'unknown',
            severity: 'BLOCK',
            detail:
              '此条历史演示档案没有可在线核验的签署原件，结论保留无法判断。',
            evidence: '待查看合同原件。',
          },
        ];
  if (state.archived)
    state.auditHandlingNote =
      '历史演示记录：已由合同管理员人工核对签署材料并确认建档。';
  if (!state.archived) state.auditConfirmed = false;
  contractChatSessions.get(id) &&
    contractChatSessions.set(id, copySession(item));
}
export class ContractDuplicateError extends Error {
  constructor(public contractId: string) {
    super(
      '该所属公司下已存在相同编号的合同，请打开已有档案；补充协议请作为附件关联。',
    );
  }
}
export async function saveContractChatSession(value: ContractChatSession) {
  const id = value.contractId || value.id;
  const before = contractArchives.get(id);
  const actor = contractUser();
  if (before) requireContractPermission(before, 'handle');
  const copy = copySession(value);
  copy.contractId = id;
  copy.sessionId = value.sessionId || value.id;
  copy.uploadedBy = before?.uploadedBy || actor.id;
  const state = ensureArchiveManagement(copy);
  if (state.archived) {
    const missing = missingContractExtraction(copy);
    if (missing.length > 0) throw new Error(missing.join('；'));
    if (state.auditItems?.some((item) => item.status === 'blocked'))
      throw new Error('存在阻断审核事项，不能建档');
    if (
      state.auditItems?.some((item) =>
        ['unknown', 'warning'].includes(item.status),
      ) &&
      !state.auditHandlingNote?.trim()
    )
      throw new Error('请填写警告或无法判断事项的人工核对说明');
    if (
      !copy.company?.trim() ||
      !copy.contractNumber?.trim() ||
      !copy.counterparty?.trim() ||
      !copy.scope.trim() ||
      !copy.owner.trim() ||
      !state.summary.trim()
    )
      throw new Error('请补齐所属公司、合同编号、客户、范围、负责人和摘要');
    if (!copy.scheme?.management) throw new Error('请选择有效合同类别');
    if (
      copy.scheme.management.audit.mode === 'intelligent' &&
      (state.auditStatus !== 'passed' || !state.auditItems?.length)
    )
      throw new Error('审核问题未解决，不能建档');
    if (!state.remindersConfirmed) throw new Error('请确认到期处理事项');
    const duplicate = [...contractArchives.values()].find(
      (item) =>
        item.id !== id &&
        item.company?.trim() === copy.company?.trim() &&
        item.contractNumber?.trim().toLowerCase() ===
          copy.contractNumber?.trim().toLowerCase(),
    );
    if (duplicate) {
      if (!contractPermission(duplicate))
        throw new Error('同公司已有相同编号合同，请联系合同管理员核对');
      throw new ContractDuplicateError(duplicate.id);
    }
  }
  // 终止及续约结果只能通过专用管理操作修改。
  copy.end = before?.end;
  copy.renewal = before?.renewal;
  copy.previousContractId = before?.previousContractId;
  copy.createdAt = before?.createdAt || contractNow();
  copy.demo = before?.demo ?? !copy.file;
  reconcileContractChanges(before, copy);
  const archive = copySession({ ...copy, id });
  contractArchives.set(id, archive);
  contractChatSessions.set(copy.sessionId, copySession(copy));
  await mockDelay(0);
  return createMockResponse(copySession(copy));
}
export async function getContractChatSessions() {
  await mockDelay(100);
  return createMockResponse(
    [...contractChatSessions.values()]
      .filter((item) =>
        contractPermission(
          contractArchives.get(item.contractId || item.id) || item,
        ),
      )
      .map((item) =>
        copySession({
          ...item,
          ...contractArchives.get(item.contractId || item.id),
          id: item.id,
          sessionId: item.sessionId,
          notes: item.notes,
        }),
      ),
  );
}
export async function deleteContractChatSession(id: string) {
  const item = contractChatSessions.get(id);
  if (item)
    requireContractPermission(
      contractArchives.get(item.contractId || item.id) || item,
      'view',
    );
  contractChatSessions.delete(id);
  return createMockResponse(true);
}
export async function getContractArchives() {
  await mockDelay(100);
  return createMockResponse(
    [...contractArchives.values()]
      .filter((item) => contractPermission(item))
      .map((item) => copySession(item)),
  );
}
export async function getContractArchive(id: string) {
  await mockDelay(100);
  const item = contractArchives.get(id);
  if (item) requireContractPermission(item, 'view');
  return createMockResponse(item ? copySession(item) : null);
}
export async function getContractRelatedItems(id: string) {
  const item = contractArchives.get(id);
  if (!item) throw new Error('未找到合同');
  requireContractPermission(item, 'view');
  const { syncContractInspectionProgress } =
    await import('./contract-inspection');
  syncContractInspectionProgress();
  const { refreshBusinessStatus } = await import('./contract-business');
  const rows = relatedContractItems.get(id) || [];
  rows.forEach((row) => refreshBusinessStatus(row));
  return createMockResponse(structuredClone(rows));
}
export async function getContractOperationPermission(id: string) {
  const item = contractArchives.get(id);
  if (!item) throw new Error('未找到合同');
  requireContractPermission(item, 'view');
  return createMockResponse(contractPermission(item));
}
