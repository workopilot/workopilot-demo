import type { InspectionCheckResult } from '#/types/inspection';
import type { WorkOrder } from '#/types/ticket';

import { inspectionToday } from './inspection-rules';
import {
  createMockResponse,
  mockDelay,
  mockInspectionPlans,
} from './mock-data';
import { CURRENT_USER, engineers, mockWorkOrders } from './mock-data-ticket';

const snapshot = <T>(value: T): T => structuredClone(value);
const now = () =>
  new Date().toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour12: false,
  });
export const inspectionStaff = [
  { ...CURRENT_USER, team: '华东运维组', workload: 0 },
  ...engineers,
];
function log(plan: (typeof mockInspectionPlans)[number], content: string) {
  plan.logs.unshift({ time: now(), operator: CURRENT_USER.name, content });
}
export async function generateInspectionOrderApi(
  planId: string,
  executionId: string,
  simulatedDate = inspectionToday(),
) {
  await mockDelay();
  const plan = mockInspectionPlans.find((p) => p.id === planId);
  const execution = plan?.executions.find((e) => e.id === executionId);
  if (!plan || !execution) throw new Error('计划或排期不存在');
  if (execution.ticket) {
    const existing = mockWorkOrders.find(
      (order) => order.code === execution.ticket,
    );
    if (existing?.inspection) return createMockResponse(snapshot(existing));
    throw new Error('该记录为历史演示工单，仅展示历史结果，不可重复生成');
  }
  if (plan.status !== '执行中') throw new Error('仅执行中的计划可生成工单');
  if (!plan.devices?.length) throw new Error('请先补齐设备与巡检事项');
  const trigger = new Date(`${execution.date}T12:00:00Z`);
  trigger.setUTCDate(trigger.getUTCDate() - plan.advanceDays);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(simulatedDate) ||
    new Date(`${simulatedDate}T12:00:00Z`).toISOString().slice(0, 10) !==
      simulatedDate
  )
    throw new Error('模拟日期无效');
  if (simulatedDate < trigger.toISOString().slice(0, 10))
    throw new Error(`尚未到生成日：${trigger.toISOString().slice(0, 10)}`);
  const candidates =
    plan.dispatchMode === 'auto'
      ? inspectionStaff
          .filter((person) => person.team === plan.team)
          .toSorted((a, b) => a.workload - b.workload)
      : [];
  const staff = candidates[0];
  const code = `XJ-${Date.now()}-${mockWorkOrders.length}`;
  const order: WorkOrder = {
    id: code,
    code,
    title: `${plan.name} · ${execution.date}`,
    type: '定期巡检',
    scenario: '巡检工单',
    category: 'external',
    customer: plan.customer,
    device: `${plan.devices.length}台智能收单机`,
    priority: 'medium',
    status: staff ? 'dispatched' : 'pending',
    source: '巡检计划',
    creator: CURRENT_USER.name,
    creatorId: CURRENT_USER.id,
    assignee: staff?.name,
    assigneeId: staff?.id,
    createdAt: now(),
    deadline: execution.date,
    slaStatus: 'normal',
    description: `合同：${plan.contract}；项目：${plan.project}；计划：${plan.id}；${plan.requirements}`,
    inspection: {
      planId,
      executionId,
      devices: structuredClone(plan.devices),
      results: [],
    },
    timeline: [
      {
        id: `tl-${code}`,
        time: now(),
        operator: CURRENT_USER.name,
        operatorId: CURRENT_USER.id,
        action: 'created',
        summary: `按巡检计划生成；${staff ? `派单助理按班组匹配${staff.name}` : '进入待派单池，等待调度安排'}`,
      },
    ],
  };
  mockWorkOrders.unshift(order);
  execution.ticket = code;
  execution.status = staff ? '待执行' : '待派单';
  execution.owner = staff?.name || plan.owner;
  log(
    plan,
    `生成巡检工单${code}，执行日期${execution.date}；${staff ? `自动派给${staff.name}` : '等待人工派单'}（演示日期：${simulatedDate}）`,
  );
  return createMockResponse(snapshot(order));
}
export async function getInspectionOrderApi(code: string) {
  await mockDelay();
  const order = mockWorkOrders.find(
    (item) => item.code === code && item.inspection,
  );
  if (!order)
    throw new Error(
      '此工单为历史演示记录，未提供可编辑检查快照；新生成工单可执行完整流程',
    );
  return createMockResponse(snapshot(order));
}
export async function updateInspectionOrderApi(
  code: string,
  action:
    | 'accept'
    | 'approve'
    | 'dispatch'
    | 'exception'
    | 'reject'
    | 'save'
    | 'submit',
  input: {
    assigneeId?: string;
    note?: string;
    results?: InspectionCheckResult[];
  } = {},
) {
  await mockDelay();
  const order = mockWorkOrders.find((item) => item.code === code);
  const meta = order?.inspection;
  const plan = mockInspectionPlans.find((item) => item.id === meta?.planId);
  const execution = plan?.executions.find(
    (item) => item.id === meta?.executionId,
  );
  if (!order || !meta || !plan || !execution) throw new Error('巡检工单不存在');
  const allowed: Record<typeof action, string[]> = {
    dispatch: ['pending'],
    accept: ['dispatched'],
    save: ['processing'],
    submit: ['processing'],
    approve: ['pending-acceptance'],
    reject: ['pending-acceptance'],
    exception: ['processing'],
  };
  if (!allowed[action].includes(order.status))
    throw new Error('工单状态已变化，请刷新后操作');
  const results = input.results ? structuredClone(input.results) : meta.results;
  if (
    new Set(results.map((item) => `${item.deviceId}/${item.itemId}`)).size !==
    results.length
  )
    throw new Error('检查记录不能重复');
  for (const item of results) {
    if (
      !meta.devices.some(
        (device) =>
          device.id === item.deviceId &&
          device.items.some((check) => check.id === item.itemId),
      ) ||
      !['异常', '正常'].includes(item.result)
    )
      throw new Error('检查记录与设备快照不匹配');
  }
  if (action === 'dispatch') {
    const staff = inspectionStaff.find((item) => item.id === input.assigneeId);
    if (!staff) throw new Error('请选择有效执行人员');
    order.assignee = staff.name;
    order.assigneeId = staff.id;
    order.status = 'dispatched';
    execution.owner = staff.name;
    execution.status = '待执行';
  }
  if (action === 'accept') {
    order.status = 'processing';
    execution.status = '处理中';
  }
  if (['exception', 'save', 'submit'].includes(action)) {
    if (action === 'submit') {
      for (const device of meta.devices)
        for (const check of device.items.filter((item) => item.required)) {
          const result = results.find(
            (item) => item.deviceId === device.id && item.itemId === check.id,
          );
          if (!result || !result.evidence.trim())
            throw new Error(
              `${device.name}的${check.name}尚未填写结果和凭证说明`,
            );
        }
      if (results.some((item) => item.result === '异常' && !item.note.trim()))
        throw new Error('异常项必须填写说明');
      if (
        results.some((item) => item.result === '异常') &&
        !meta.exceptionTicket
      )
        throw new Error('存在异常，请先创建关联报修工单再提交验收');
    }
    if (action === 'exception') {
      if (!results.some((item) => item.result === '异常' && item.note.trim()))
        throw new Error('请先填写异常检查项及原因');
      if (!meta.exceptionTicket) {
        const exception: WorkOrder = {
          ...order,
          id: `EX-${Date.now()}`,
          code: `BX-${Date.now()}`,
          title: `巡检异常报修 · ${order.title}`,
          type: '故障报修',
          status: 'pending',
          source: '巡检异常',
          assignee: undefined,
          assigneeId: undefined,
          inspection: undefined,
          description: `来源工单：${order.code}；${results
            .filter((item) => item.result === '异常')
            .map((item) => item.note)
            .join('；')}`,
          timeline: [],
        };
        mockWorkOrders.unshift(exception);
        meta.exceptionTicket = exception.code;
        log(plan, `巡检工单${code}创建关联报修${exception.code}`);
      }
    }
    meta.results = results;
    if (action === 'submit') {
      order.status = 'pending-acceptance';
      execution.status = '待验收';
    }
  }
  if (['approve', 'reject'].includes(action)) {
    if (!input.note?.trim()) throw new Error('请填写验收意见');
    meta.acceptanceNote = input.note;
    order.status = action === 'approve' ? 'completed' : 'processing';
    execution.status = action === 'approve' ? '已完成' : '处理中';
    if (action === 'approve') {
      order.completedAt = now();
      execution.completedAt = order.completedAt;
      execution.result = `验收通过：${input.note}${meta.exceptionTicket ? `；异常转报修${meta.exceptionTicket}` : ''}`;
    }
  }
  if (
    plan.status !== '已终止' &&
    plan.executions.length > 0 &&
    plan.executions.every((item) => item.status === '已完成')
  )
    plan.status = '已完成';
  const labels = {
    dispatch: '派单',
    accept: '接单',
    save: '保存检查结果',
    submit: '提交验收',
    approve: '验收通过',
    reject: '验收退回',
    exception: '创建异常报修',
  };
  if (action !== 'save')
    log(
      plan,
      `${code}：${labels[action]}${input.note ? `；${input.note}` : ''}`,
    );
  return createMockResponse(snapshot(order));
}
