import type { InspectionPlan, InspectionStatus } from '#/types/inspection';

import { buildInspectionDates, emptyInspectionDraft } from './inspection-draft';
import {
  inspectionExpectedCount,
  inspectionOverlaps,
} from './inspection-rules';
import {
  createMockResponse,
  mockDelay,
  mockInspectionPlans,
} from './mock-data';

const transitions: Partial<Record<InspectionStatus, InspectionStatus[]>> = {
  草稿: ['已终止'],
  待启用: ['执行中', '已终止'],
  执行中: ['已暂停', '已终止'],
  已暂停: ['执行中', '已终止'],
};
export async function getInspectionPlansApi() {
  await mockDelay();
  mockInspectionPlans.forEach((plan) => {
    if (plan.status === '待启用') plan.status = '草稿';
    if (plan.status === '草稿') plan.executions = [];
  });
  const snapshot = structuredClone(mockInspectionPlans);
  snapshot.forEach((plan) => {
    plan.executions.forEach((item) => {
      if (item.status === '待执行' || item.status === '已逾期')
        item.status =
          plan.status === '执行中' &&
          item.date <
            new Date().toLocaleDateString('sv-SE', {
              timeZone: 'Asia/Shanghai',
            })
            ? '已逾期'
            : '待执行';
    });
  });
  return createMockResponse(snapshot);
}
export async function updateInspectionPlanApi(
  id: string,
  patch: Partial<
    import('#/types/inspection').InspectionDraft & { status: InspectionStatus }
  >,
  nextDate?: string,
  configuration?: import('#/types/inspection').InspectionActivation,
) {
  await mockDelay();
  const plan = mockInspectionPlans.find((item) => item.id === id);
  if (!plan) throw new Error('计划不存在');
  if (patch.status === '执行中' && ['待启用', '草稿'].includes(plan.status))
    throw new Error('请通过工单助理补齐设备与执行安排后启用');
  if (patch.status === '待启用')
    throw new Error('草稿无需提交待启用，请通过工单助理启用');
  if (['已完成', '已终止'].includes(plan.status))
    throw new Error('该计划已结束，不能修改');
  if (patch.status && !transitions[plan.status]?.includes(patch.status))
    throw new Error('当前状态不支持此操作');
  if (
    patch.advanceDays !== undefined &&
    (!Number.isInteger(patch.advanceDays) ||
      patch.advanceDays < 0 ||
      patch.advanceDays > 30)
  )
    throw new Error('提前生成天数须为 0 至 30 的整数');
  if (
    nextDate &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(nextDate) ||
      Number.isNaN(Date.parse(nextDate)))
  )
    throw new Error('请选择有效的执行日期');
  if (nextDate && (nextDate < plan.start || nextDate > plan.end))
    throw new Error('执行日期须在合同服务期内');
  const changes = Object.entries(patch)
    .filter(([key, value]) => plan[key as keyof InspectionPlan] !== value)
    .map(
      ([key, value]) =>
        `${({ name: '计划名称', owner: '负责人', frequency: '巡检频次', advanceDays: '提前生成天数', status: '状态', contract: '合同', contractId: '合同档案', customer: '客户', project: '项目', start: '服务开始日期', end: '服务结束日期', scope: '巡检范围', requirements: '通用要求', firstDate: '首次日期', team: '负责班组', contractText: '合同原文' } as Record<string, string>)[key] || key}：${plan[key as keyof InspectionPlan]} → ${value}`,
    );
  if (
    plan.status !== '草稿' &&
    (nextDate || patch.frequency || patch.end || patch.start)
  ) {
    const firstPending = plan.executions
      .filter((item) => !item.ticket && item.status !== '已完成')
      .map((item) => item.date)
      .toSorted()[0];
    const anchor = nextDate || firstPending;
    if (!anchor) throw new Error('没有可调整的未生成排期');
    const config = {
      ...emptyInspectionDraft(),
      ...plan,
      ...patch,
      firstDate: anchor,
    };
    const keep = plan.executions.filter(
      (item) => item.ticket || item.status === '已完成',
    );
    const dates = buildInspectionDates(config).filter(
      (date) => !keep.some((item) => item.date === date),
    );
    const oldCount = plan.executions.length - keep.length;
    plan.executions = [
      ...keep,
      ...dates.map((date) => ({
        id: `${plan.id}-${date}`,
        date,
        owner: patch.owner || plan.owner,
        status: '待生成' as const,
        ticket: '',
        result: '',
        completedAt: '',
      })),
    ].toSorted((a, b) => a.date.localeCompare(b.date));
    plan.firstDate = plan.executions[0]?.date || anchor;
    changes.push(
      `重建后续排期：原${oldCount}次 → ${dates.length}次；保留${keep.length}次已有工单或已完成记录`,
    );
  }
  const newOwner = patch.owner;
  if (newOwner)
    plan.executions
      .filter((item) => !item.ticket)
      .forEach((item) => {
        item.owner = newOwner;
      });
  if (configuration) {
    if (plan.status !== '草稿') throw new Error('仅草稿可保存未启用配置');
    plan.devices = structuredClone(configuration.devices);
    plan.dispatchMode = configuration.dispatchMode;
    plan.configuration = {
      scopeReason: configuration.scopeReason,
      overlapReason: configuration.overlapReason,
    };
    changes.push('保存设备、模板与派单配置');
  }
  Object.assign(plan, patch);
  if (changes.length > 0)
    plan.logs.unshift({
      time: new Date().toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        hour12: false,
      }),
      operator: '当前用户',
      content: changes.join('；'),
    });
  return createMockResponse(structuredClone(plan));
}
export async function copyInspectionPlanApi(id: string) {
  await mockDelay();
  const source = mockInspectionPlans.find((item) => item.id === id);
  if (!source) throw new Error('计划不存在');
  const plan = structuredClone(source);
  plan.id = `IP-2026-${String(mockInspectionPlans.length + 1).padStart(3, '0')}`;
  plan.name += '（副本）';
  plan.status = '草稿';
  plan.devices = [];
  plan.firstDate = '';
  plan.executions = [];

  plan.logs = [
    {
      time: new Date().toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        hour12: false,
      }),
      operator: '当前用户',
      content: `从 ${id} 复制为草稿，请核对合同信息，通过工单助理补齐并启用。`,
    },
  ];
  mockInspectionPlans.unshift(plan);
  return createMockResponse(structuredClone(plan));
}

/** 创建只保存草稿；执行条件在启用时集中确认。 */
export async function createInspectionPlanApi(
  input: import('#/types/inspection').InspectionDraft,
  overlapReason = '',
  configuration?: import('#/types/inspection').InspectionActivation,
) {
  const draft = structuredClone(input);
  if (!draft.contract.trim() || !draft.name.trim())
    throw new Error('请填写合同名称和计划名称');
  const overlaps = inspectionOverlaps(draft, mockInspectionPlans);
  if (overlaps.length > 0 && !overlapReason.trim())
    throw new Error(
      `存在重叠计划：${overlaps.map((item) => item.id).join('、')}，请确认另建原因`,
    );
  await mockDelay();
  const id = `IP-2026-${String(mockInspectionPlans.length + 1).padStart(3, '0')}`;
  const plan: InspectionPlan = {
    ...draft,
    id,
    status: '草稿',
    devices: structuredClone(configuration?.devices || []),
    dispatchMode: configuration?.dispatchMode || 'auto',
    configuration: { scopeReason: configuration?.scopeReason, overlapReason },
    executions: [],
    logs: [
      {
        time: new Date().toLocaleString('zh-CN', {
          timeZone: 'Asia/Shanghai',
          hour12: false,
        }),
        operator: '当前用户',
        content: `通过工单助理创建草稿，设备与执行安排将在启用前确认。${overlapReason ? `另建原因：${overlapReason}` : ''}`,
      },
    ],
  };
  mockInspectionPlans.unshift(plan);
  return createMockResponse(structuredClone(plan));
}

export async function getInspectionResourcesApi() {
  const { mockInspectionDevices, mockInspectionTemplates } =
    await import('./mock-data');
  await mockDelay();
  return createMockResponse(
    structuredClone({
      devices: mockInspectionDevices,
      templates: mockInspectionTemplates,
    }),
  );
}

export async function activateInspectionPlanApi(
  id: string,
  input: import('#/types/inspection').InspectionActivation,
  editOnly = false,
) {
  const { buildInspectionDates, missingInspectionFields } =
    await import('./inspection-draft');
  const { mockInspectionDevices, mockInspectionTemplates } =
    await import('./mock-data');
  const config = structuredClone(input);
  const missing = missingInspectionFields(config.draft).filter(
    (label) => !['合同信息', '检查要求'].includes(label),
  );
  if (missing.length > 0)
    throw new Error(`启用前请补充：${missing.join('、')}`);
  if (!['auto', 'manual'].includes(config.dispatchMode))
    throw new Error('请选择派单方式');
  if (
    !Number.isInteger(config.draft.advanceDays) ||
    config.draft.advanceDays < 0 ||
    config.draft.advanceDays > 30
  )
    throw new Error('提前生成天数须为0至30的整数');
  if (config.devices.length === 0) throw new Error('请选择至少一台巡检设备');
  if (
    new Set(config.devices.map((device) => device.id)).size !==
    config.devices.length
  )
    throw new Error('设备清单不能重复');
  const devices = config.devices.map((device) => {
    const asset = mockInspectionDevices.find((item) => item.id === device.id);
    const template = mockInspectionTemplates.find(
      (item) => item.id === device.templateId,
    );
    if (!asset || !template?.items.length)
      throw new Error('请为每台有效设备关联巡检模板');
    if (template.category !== '通用' && template.category !== asset.category)
      throw new Error(`${asset.name}与巡检模板不匹配`);
    const normalize = (value: string) =>
      value.replaceAll(/有限公司|有限责任公司/g, '').trim();
    if (
      normalize(asset.customer) !== normalize(config.draft.customer) ||
      asset.project !== config.draft.project
    )
      throw new Error(`${asset.name}不属于当前客户与项目，请重新匹配设备`);
    return {
      ...asset,
      templateId: template.id,
      items: structuredClone(template.items),
    };
  });
  const expected = inspectionExpectedCount(config.draft.scope);
  if (
    expected !== undefined &&
    expected !== devices.length &&
    !config.scopeReason?.trim()
  )
    throw new Error(
      `合同约定${expected}台，已选${devices.length}台，请补齐设备或说明差异原因`,
    );
  const overlaps = inspectionOverlaps(config.draft, mockInspectionPlans, id);
  if (overlaps.length > 0 && !config.overlapReason?.trim())
    throw new Error('存在重叠计划，请填写另建或保留原因');
  const dates = buildInspectionDates(config.draft);
  await mockDelay();
  const plan = mockInspectionPlans.find((item) => item.id === id);
  if (!plan) throw new Error('计划不存在');
  if (
    editOnly
      ? !['已暂停', '执行中'].includes(plan.status)
      : !['待启用', '草稿'].includes(plan.status)
  )
    throw new Error(
      editOnly
        ? '仅运行或暂停中的计划可调整后续配置'
        : '仅草稿计划可启用，请刷新状态',
    );
  if (editOnly && !config.changeReason?.trim())
    throw new Error('请填写配置变更原因');
  const retained = editOnly
    ? plan.executions.filter((item) => item.ticket || item.status === '已完成')
    : [];
  const oldStatus = plan.status;
  Object.assign(plan, config.draft, {
    devices,
    dispatchMode: config.dispatchMode,
    configuration: {
      scopeReason: config.scopeReason,
      overlapReason: config.overlapReason,
    },
    status: editOnly ? oldStatus : '执行中',
  });
  plan.executions = [
    ...retained,
    ...dates
      .filter((date) => !retained.some((item) => item.date === date))
      .map((date, i) => ({
        id: `${id}-${i}`,
        date,
        owner: config.draft.owner,
        status: '待生成' as const,
        ticket: '',
        result: '',
        completedAt: '',
      })),
  ].toSorted((a, b) => a.date.localeCompare(b.date));
  plan.logs.unshift({
    time: new Date().toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      hour12: false,
    }),
    operator: '当前用户',
    content: `通过工单助理${editOnly ? '调整后续配置' : '确认启用'}；${config.changeReason || ''}；范围确认：${config.scopeReason || '与约定数量一致'}；重叠确认：${config.overlapReason || '无'}；关联${devices.length}台设备、${devices.reduce((total, item) => total + item.items.length, 0)}个检查项；${config.dispatchMode === 'auto' ? '自动派单（按负责班组匹配）' : '人工派单'}；生成${dates.length}次排期。`,
  });
  return createMockResponse(structuredClone(plan));
}
