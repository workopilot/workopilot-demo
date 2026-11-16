import type { BusinessReportProfile } from '#/types/business-report';
import { reactive } from 'vue';
import { businessProfiles } from './mock-business-reports';

export const reportObjects = [
  {
    id: 'engine',
    kind: 'project',
    name: '喔壳平台 · 汇报引擎',
    owned: true,
    owner: '小刚',
    description: '方案设计 · 我负责',
    scenarios: ['project'],
  },
  {
    id: 'edb',
    kind: 'project',
    name: '曼伦 EDB 项目',
    owned: true,
    owner: '小刚',
    description: '需求已确认 · 即将进入设计',
    scenarios: ['project'],
  },
  {
    id: 'huatian',
    kind: 'project',
    name: '华天项目',
    owned: false,
    owner: '项目交付组',
    description: '接口已验收 · 协作可见',
    scenarios: ['project'],
  },
  {
    id: 'huachen',
    kind: 'customer',
    name: '华辰医药',
    owned: true,
    owner: 'Angus',
    description: '系统建设及年度运维 · 我负责',
    scenarios: ['delivery', 'handover', 'operations'],
  },
  {
    id: 'jinmao',
    kind: 'customer',
    name: '金茂府',
    owned: true,
    owner: 'Angus',
    description: '设备运维服务 · 我负责',
    scenarios: ['operations'],
  },
  {
    id: 'tower',
    kind: 'customer',
    name: '铁塔',
    owned: false,
    owner: '客户服务组',
    description: '数据同步服务 · 协作可见',
    scenarios: ['operations'],
  },
] as const;
export type ReportObject = (typeof reportObjects)[number];
export type ReportObjectKind = 'project' | 'customer';
export const followedReportObjects = reactive<
  Record<ReportObjectKind, string[]>
>({
  project: reportObjects
    .filter((o) => o.kind === 'project' && o.owned)
    .map((o) => o.id),
  customer: reportObjects
    .filter((o) => o.kind === 'customer' && o.owned)
    .map((o) => o.id),
});
export function defaultReportObject(kind: string) {
  return kind === 'project' ? 'engine' : 'huachen';
}
export function scopedBusinessProfile(
  objectId: string,
  scenario: string,
): BusinessReportProfile {
  const object = reportObjects.find((o) => o.id === objectId)!;
  const base = structuredClone(
    businessProfiles[scenario] ??
      businessProfiles[object.kind === 'project' ? 'project' : 'operations']!,
  );
  if (objectId === 'engine' || objectId === 'huachen') return base;
  base.serviceStartedAt = undefined;
  base.taskRecords = undefined;
  base.name = object.name;
  base.manager = object.kind === 'project' ? '小刚' : 'Angus';
  base.milestones = [];
  base.metrics = [];
  base.progress = undefined;
  base.service = undefined;
  base.blocks = base.blocks.map((block) => ({
    ...block,
    items: [],
    summary: '本期暂无更多已确认素材，可补充经核实的成果、风险与计划。',
  }));
  const [outcomes, delivery, risks, plan] = base.blocks;
  if (objectId === 'edb') {
    base.projectNames = ['PRJ-ML-EDB · 曼伦 EDB 项目'];
    base.phase = '需求确认完成 · 待进入设计';
    base.stageIndex = 0;
    base.conclusion =
      '需求调研已完成，交付物为需求文档；正式文档链接待补充。下一阶段进入设计，计划完成首页与待办模块设计。当前没有已确认的验收日期，需项目经理补充交付基线。';
    base.metrics = [
      {
        label: '需求调研',
        value: '已完成',
        hint: '成果为需求文档',
        icon: 'lucide:file-check-2',
      },
      {
        label: '下阶段设计',
        value: '2 个模块',
        hint: '首页、待办',
        icon: 'lucide:panels-top-left',
      },
    ];
    outcomes!.summary = '已完成需求调研，输出需求文档，需补齐正式成果链接。';
    outcomes!.items = [
      {
        id: 'EDB-REQ',
        title: '需求调研与需求文档',
        detail: '需求调研已完成，成果物为需求文档；正式文档链接待补充。',
        status: '已完成 · 依据待补',
        evidence: 'PRJ-ML-EDB · 需求调研记录',
      },
    ];
    delivery!.summary =
      '当前已完成需求确认，下一阶段为方案设计。尚无已确认的验收日期，不自动推测按期交付结论。';
    risks!.summary =
      '需求文档链接和项目交付基线待补充，请确认需求范围及设计验收标准。未发现其他已确认风险，仍需项目经理核对。';
    plan!.summary =
      '下周进入设计阶段，完成首页与待办模块设计；先检查项目已有设计任务是否覆盖，再确认是否新增。';
    plan!.items = [
      {
        id: 'EDB-PLAN',
        title: '首页与待办模块设计',
        detail:
          '进入设计阶段，交付首页与待办模块设计稿。完成时间与任务覆盖待核对。',
        status: '待核对任务覆盖',
        evidence: 'PRJ-ML-EDB · 下阶段人工计划',
      },
    ];
  } else if (objectId === 'huatian') {
    base.projectNames = ['PRJ-HT · 华天项目'];
    base.phase = '接口验收完成';
    base.stageIndex = 3;
    base.conclusion =
      '已对接完成 12 个接口，接口已验收通过。该成果仅代表本阶段接口验收，不自动等同于整个项目验收完成。后续收尾与下一阶段安排由项目经理补充。';
    base.metrics = [
      {
        label: '接口完成',
        value: '12 / 12 个',
        hint: '已完成对接',
        icon: 'lucide:plug-zap',
      },
      {
        label: '接口验收',
        value: '已通过',
        hint: '本阶段成果',
        icon: 'lucide:badge-check',
      },
    ];
    base.progress = { done: 12, total: 12, label: '本阶段接口对接完成情况' };
    outcomes!.summary = '本阶段 12 个接口已完成对接，验收通过。';
    outcomes!.items = [
      {
        id: 'HT-IF12',
        title: '12 个接口对接与验收',
        detail: '12 个接口已完成对接并验收通过。',
        status: '已验收',
        evidence: 'PRJ-HT · 接口联调与验收记录',
      },
    ];
    delivery!.summary =
      '当前阶段接口已验收，项目整体交付承诺和最终验收状态待负责人核对。';
    risks!.summary =
      '当前无已确认接口阻塞；请核对是否还有收尾工作或其他项目风险。';
    plan!.summary =
      '请补充验收后归档、收尾或后续阶段计划；当前不自动新增任务。';
  } else if (objectId === 'jinmao') {
    base.projectNames = ['SVC-JMF · 金茂府设备运维服务'];
    base.phase = '运维服务期';
    base.stageIndex = 2;
    base.conclusion =
      '已处理金茂府 4 台机器的打印机故障，恢复相关设备使用。设备数量与工单数量分开统计，当前缺少完整月度工单、响应时效和满意度数据，需客户经理补充确认。';
    base.metrics = [
      {
        label: '恢复设备',
        value: '4 台',
        hint: '打印机故障已处理',
        icon: 'lucide:printer',
      },
      {
        label: '月度服务口径',
        value: '待补充',
        hint: '不将设备数当作工单数',
        icon: 'lucide:clipboard-check',
      },
    ];
    outcomes!.summary =
      '本期已处理 4 台机器的打印机故障；具体处理记录和客户确认可继续补充。';
    outcomes!.items = [
      {
        id: 'WO-JMF-004',
        title: '打印机故障处理',
        detail: '已处理金茂府 4 台机器的打印机故障，恢复相关设备使用。',
        status: '已处理',
        evidence: 'SVC-JMF / WO-JMF-004 · 设备处理记录',
      },
    ];
    delivery!.summary =
      '当前处于设备运维服务阶段，无已确认的建设项目交付基线，不推断项目按期交付率。';
    risks!.summary =
      '请确认故障是否复发、是否需要更换耗材或设备，以及客户侧有无其他待处理问题。';
    plan!.summary =
      '建议回访设备使用情况，补齐处理确认；下月巡检安排需客户经理确认后再形成任务。';
  } else {
    base.projectNames = ['SVC-TOWER · 铁塔数据服务'];
    base.phase = '运维服务期';
    base.stageIndex = 2;
    base.conclusion =
      '数据无法同步的问题已持续 2 天，工程师仍在排查，当前尚未解决。建议协调其他工程师共同处理，客户经理明确下一次反馈时间。';
    base.metrics = [
      {
        label: '重点问题',
        value: '处理中',
        hint: '数据无法同步',
        icon: 'lucide:activity',
      },
      {
        label: '已持续',
        value: '2 天',
        hint: '需协调共同排查',
        icon: 'lucide:timer',
      },
    ];
    outcomes!.summary =
      '当前已确认素材为数据同步异常，尚未闭环，不计入已解决问题。';
    outcomes!.items = [
      {
        id: 'WO-TT-002',
        title: '数据无法同步',
        detail: '问题已持续 2 天，工程师正在排查，原因尚未明确。',
        status: '处理中',
        evidence: 'SVC-TOWER / WO-TT-002 · 问题进展记录',
      },
    ];
    delivery!.summary =
      '当前处于数据服务运维阶段，暂无已确认建设项目交付记录。';
    risks!.summary =
      '数据同步问题仍未解决，建议协调其他工程师共同排查，确认业务影响和下一次反馈时间。';
    risks!.items = [
      {
        id: 'TOWER-RISK',
        title: '同步异常需联合排查',
        detail:
          '建议增加接口或数据工程师协作，客户经理跟进处理进展并明确沟通时间。',
        status: '需协调',
        evidence: 'SVC-TOWER / WO-TT-002',
      },
    ];
    plan!.summary =
      '优先在已有问题工单中推进联合排查；恢复后补充复测与客户确认记录。';
    plan!.items = [
      {
        id: 'TOWER-PLAN',
        title: '联合排查并闭环同步问题',
        detail: '已有工单承接，需补充协作人员及计划反馈时间。',
        status: '已有工单',
        evidence: 'SVC-TOWER / WO-TT-002',
      },
    ];
  }
  base.sourcePath = [
    object.kind === 'project' ? `项目 ${object.name}` : `客户 ${object.name}`,
    ...base.projectNames,
    '仅采集关联项目业务数据',
    `${base.role}审查`,
  ];
  return base;
}
