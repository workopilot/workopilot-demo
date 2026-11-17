import { reactive } from 'vue';
import dayjs from 'dayjs';
import { createMockResponse, mockDelay } from './mock-data';
export type ApprovalKind = 'project' | 'ticket';
export type BusinessApprovalStatus =
  'pending' | 'approved' | 'returned' | 'shared';
export interface BusinessApproval {
  id: string;
  kind: ApprovalKind;
  title: string;
  author: string;
  department: string;
  subtype: string;
  submittedAt: string;
  status: BusinessApprovalStatus;
  facts: { label: string; value: string }[];
  sections: { title: string; text: string }[];
  feedback?: string;
  reviewedAt?: string;
}
const submittedAt = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
const projectSeeds = [
  [
    'PJ-101',
    '曼伦 EDB 项目立项',
    '小刚',
    '产品建设',
    'pending',
    '曼伦',
    '12 万元',
    '首页、待办与审批流程建设，交付可验收的 EDB 工作门户。',
  ],
  [
    'PJ-102',
    '华天接口集成二期',
    '张三',
    '系统集成',
    'pending',
    '华天',
    '18 万元',
    '新增 12 个业务接口并完成端到端联调与客户验收。',
  ],
  [
    'PJ-103',
    '华辰医药服务升级',
    'Angus',
    '服务升级',
    'approved',
    '华辰医药',
    '8 万元',
    '统一设备台账、工单管理与月度服务回顾。',
  ],
  [
    'PJ-104',
    '铁塔数据同步改造',
    '李明',
    '系统集成',
    'returned',
    '铁塔',
    '15 万元',
    '治理同步链路异常，补齐监控告警与故障恢复机制。',
  ],
  [
    'PJ-105',
    '金茂府设备管理平台',
    '陈静',
    '产品建设',
    'shared',
    '金茂府',
    '10 万元',
    '建立设备档案、巡检计划和维修记录查询。',
  ],
  [
    'PJ-106',
    '航天运维服务续期',
    '张敏',
    '服务升级',
    'pending',
    '航天',
    '6 万元',
    '提供驻场支持、季度巡检和关键设备故障处置。',
  ],
];
const ticketSeeds = [
  [
    'TK-201',
    '金茂府 4 台打印机故障处理',
    '李伟',
    '完工验收',
    'pending',
    '金茂府',
    '4 台打印机',
    '已更换故障部件并清理纸路，4 台设备均完成连续打印测试。',
  ],
  [
    'TK-202',
    '航天扫描仪卡纸处理',
    '张敏',
    '工单关闭',
    'pending',
    '航天',
    '1 台扫描仪',
    '已清理进纸机构并校准滚轮，完成 50 页连续扫描。',
  ],
  [
    'TK-203',
    '铁塔数据无法同步',
    '韩立',
    '延期申请',
    'pending',
    '铁塔',
    '数据同步服务',
    '故障已持续 2 天，申请延长处理时限并协调接口工程师共同排查。',
  ],
  [
    'TK-204',
    '华辰医药季度巡检',
    '陈静',
    '完工验收',
    'approved',
    '华辰医药',
    '12 台设备',
    '已完成设备巡检，异常记录已闭环，客户确认巡检结果。',
  ],
  [
    'TK-205',
    '曼伦网络连接异常',
    '李明',
    '工单关闭',
    'returned',
    '曼伦',
    '办公网络',
    '网络连通性已恢复，需补充客户确认记录及稳定性观察结果。',
  ],
  [
    'TK-206',
    '金茂府服务回访',
    'Angus',
    '完工验收',
    'shared',
    '金茂府',
    '服务回访',
    '客户确认打印服务恢复，建议下月安排预防性保养。',
  ],
];
export const businessApprovals = reactive<BusinessApproval[]>([
  ...projectSeeds.map(
    ([id, title, author, subtype, status, customer, budget, objective]) => ({
      id: id!,
      title: title!,
      author: author!,
      subtype: subtype!,
      kind: 'project' as const,
      status: status as BusinessApprovalStatus,
      department: '项目交付组',
      submittedAt,
      facts: [
        { label: '客户', value: customer! },
        { label: '预算', value: budget! },
        { label: '计划周期', value: '6 周' },
        { label: '项目负责人', value: author! },
      ],
      sections: [
        { title: '立项目标与范围', text: objective! },
        {
          title: '交付计划',
          text: '第 1 周完成需求确认；第 2–4 周完成设计与实施；第 5–6 周完成验证、验收及交接。',
        },
        {
          title: '资源与验收标准',
          text: '申请项目经理 1 人、实施工程师 2 人；按双方确认的需求清单逐项验收，形成交付文档及验收记录。',
        },
        {
          title: '风险与前置条件',
          text: '需确认客户接口人、测试环境和资源排期；范围变更需经项目负责人确认。',
        },
      ],
      feedback:
        status === 'approved'
          ? '同意立项，按确认的范围与预算推进。'
          : status === 'returned'
            ? '请补充接口依赖清单和资源排期后重新提报。'
            : undefined,
    }),
  ),
  ...ticketSeeds.map(
    ([id, title, author, subtype, status, customer, asset, result]) => ({
      id: id!,
      title: title!,
      author: author!,
      subtype: subtype!,
      kind: 'ticket' as const,
      status: status as BusinessApprovalStatus,
      department: '运维服务组',
      submittedAt,
      facts: [
        { label: '客户', value: customer! },
        { label: '关联对象', value: asset! },
        { label: '审核事项', value: subtype! },
        { label: '处理工程师', value: author! },
      ],
      sections: [
        { title: '处理结果与申请说明', text: result! },
        {
          title: '验收依据',
          text:
            subtype === '延期申请'
              ? '已记录同步日志和排查过程；仍需接口工程师协助定位。'
              : '处理记录与现场验证结果已提交；审核时需核对客户确认及设备运行情况。',
        },
        {
          title: '后续安排',
          text:
            subtype === '延期申请'
              ? '申请延期 2 个工作日，安排接口工程师协同处理，每日同步进展。'
              : '通过后交由服务人员完成回访与归档。',
        },
      ],
      feedback:
        status === 'approved'
          ? '处理及验收记录完整，同意通过。'
          : status === 'returned'
            ? '请补充客户确认记录后重新提交。'
            : undefined,
    }),
  ),
]);
export async function submitBusinessApproval(
  id: string,
  decision: 'approved' | 'returned',
  feedback: string,
) {
  const item = businessApprovals.find((entry) => entry.id === id);
  if (!item || item.status !== 'pending') throw new Error('该事项当前不可审批');
  if (!feedback.trim()) throw new Error('请填写审批意见');
  await mockDelay(350);
  if (item.status !== 'pending') throw new Error('该事项已被处理，请刷新查看');
  item.status = decision;
  item.feedback = feedback.trim();
  item.reviewedAt = dayjs().format('YYYY-MM-DD HH:mm');
  return createMockResponse(item);
}
