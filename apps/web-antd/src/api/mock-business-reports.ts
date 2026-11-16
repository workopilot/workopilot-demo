import type {
  BusinessReportProfile,
  BusinessReportState,
  BusinessReportEdits,
} from '#/types/business-report';

// Business data is scoped to one project or one customer's related projects.
// These fixtures are deliberately independent of employee report aggregation.
export const businessProfiles: Record<string, BusinessReportProfile> = {
  project: {
    id: 'project',
    kind: 'project',
    label: '项目周报',
    name: '喔壳平台 · 汇报引擎',
    manager: '小刚',
    role: '项目经理',
    phase: '方案设计',
    projectNames: ['PRJ-021 · 喔壳平台 · 汇报引擎'],
    stages: ['需求确认', '方案设计', '开发联调', '验收上线'],
    stageIndex: 1,
    conclusion:
      '需求与方案评审已完成，当前处于方案设计阶段。本周计划交付 4 项，已完成 3 项；客户字段映射待确认，可能影响下阶段联调，需在 10 月 23 日前协调确认。',
    metrics: [
      {
        label: '本周计划完成',
        value: '3 / 4 项',
        hint: '1 项字段映射待确认',
        icon: 'lucide:list-checks',
      },
      {
        label: '累计任务完成',
        value: '8 / 12 项',
        hint: '剩余 4 项仍在推进',
        icon: 'lucide:chart-no-axes-combined',
      },
      {
        label: '当前阶段',
        value: '方案设计',
        hint: '下一阶段：开发联调',
        icon: 'lucide:milestone',
      },
      {
        label: '需协调风险',
        value: '1 项',
        hint: '影响联调前置条件',
        icon: 'lucide:flag',
      },
    ],
    progress: { done: 8, total: 12, label: '累计任务完成情况' },
    milestones: [
      {
        title: '需求基线确认',
        planned: '2026-10-16',
        actual: '2026-10-16',
        status: '已完成',
      },
      {
        title: '交互方案确认',
        planned: '2026-10-23',
        actual: '预计 2026-10-23',
        status: '推进中',
      },
      {
        title: '接口联调完成',
        planned: '2026-10-30',
        actual: '待字段映射确认',
        status: '有风险',
      },
      {
        title: '验收上线',
        planned: '2026-11-06',
        actual: '预计 2026-11-06',
        status: '未开始',
      },
    ],
    sourcePath: [
      '项目 PRJ-021',
      '任务 / 里程碑 / 项目工单',
      '成果文档 + 已确认项目素材',
      '项目经理审查',
    ],
    blocks: [
      {
        id: 'outcomes',
        title: '本周完成与交付',
        icon: 'lucide:package-check',
        summary:
          '本周 4 项计划中完成 3 项：需求基线、核心流程原型、取数口径。字段映射尚未完成，不计入本周交付成果。',
        items: [
          {
            id: 'T-201',
            title: '统一汇报需求基线',
            detail:
              '已完成评审，明确个人、项目与客户报告的取数、分发和人工确认规则。',
            status: '已完成',
            evidence: 'PRJ-021 / T-201 · 需求方案 V1.3 · 评审记录 10/20',
          },
          {
            id: 'T-202',
            title: '核心流程交互原型',
            detail:
              '已完成草稿核对、来源补充及最终预览流程，评审意见已纳入原型。',
            status: '已完成',
            evidence: 'PRJ-021 / T-202 · 交互原型 V2 · 确认记录 10/21',
          },
          {
            id: 'T-203',
            title: '项目数据口径确认',
            detail: '已确认以项目原始业务数据为主，不依赖收齐成员个人周报。',
            status: '已完成',
            evidence: 'PRJ-021 / T-203 · 项目字段清单 V1 · 确认记录 10/22',
          },
        ],
      },
      {
        id: 'delivery',
        title: '阶段、里程碑与交付',
        icon: 'lucide:route',
        summary:
          '当前处于方案设计，目标 10 月 23 日确认交互方案，10 月 26 日进入联调。验收基线为 11 月 6 日；当前未调整该承诺，但联调存在前置依赖风险。',
        items: [
          {
            id: 'M-02',
            title: '交互方案确认',
            detail:
              '原型已完成，等待项目经理核对客户报告字段与展示口径后确认。',
            status: '推进中',
            evidence: 'PRJ-021 / M-02 · 项目里程碑 · 计划 10/23',
          },
          {
            id: 'T-210',
            title: '接口联调前置条件',
            detail: '联调任务已安排在 10/26—10/30；客户字段映射必须先确认。',
            status: '有依赖',
            evidence: 'PRJ-021 / T-210 · 联调任务与依赖关系',
          },
        ],
      },
      {
        id: 'risks',
        title: '风险与协调',
        icon: 'lucide:flag',
        tone: 'risk',
        summary:
          '客户字段映射若未在 10 月 23 日确认，将影响 10 月 26 日联调启动。建议客户经理协调客户接口人确认，项目经理在联调前复核。',
        items: [
          {
            id: 'RISK-03',
            title: '字段映射确认存在阻塞',
            detail:
              '影响：联调启动可能延后。措施：先完成内部模拟联调。协调诉求：客户经理在 10/23 前取得字段映射确认。',
            status: '需协调',
            evidence: 'PRJ-021 / RISK-03 · 已确认项目风险素材 · T-204',
          },
        ],
      },
      {
        id: 'plan',
        title: '下周目标与计划',
        icon: 'lucide:calendar-arrow-up',
        tone: 'plan',
        summary:
          '下周完成接口联调并输出联调记录；验收材料应同步整理，先检查既有任务是否覆盖，再补充子任务。',
        items: [
          {
            id: 'T-210',
            title: '完成接口联调',
            detail:
              '10/26—10/30 完成约定接口联调，交付联调记录；已有任务承接，需核对前置条件。',
            status: '已有任务',
            evidence: 'PRJ-021 / T-210 · 计划 10/26—10/30',
          },
          {
            id: 'PLAN-02',
            title: '整理验收材料',
            detail:
              '补齐测试记录、成果链接与验收清单；现有联调任务未覆盖，建议确认后补充子任务。',
            status: '待确认行动',
            evidence: 'PRJ-021 · 项目经理待确认计划',
          },
        ],
      },
    ],
  },
  operations: {
    id: 'operations',
    kind: 'customer',
    label: '运维服务期',
    name: '华辰医药',
    manager: 'Angus',
    role: '客户经理',
    phase: '运维服务期',
    serviceStartedAt: '2026-08-29',
    taskRecords: [
      ...[1, 2, 3, 4].map((week) => ({
        id: `HC-INSPECT-${week}`,
        title: `9 月第 ${week} 次巡检`,
        owner: '运维工程师',
        state: 'completed' as const,
        periodPlanned: true,
        status: '已完成',
        detail: '巡检已完成，结果记录待统一归档；整改证明缺项需补齐。',
        evidence: `SVC-HC-2026 / INSPECT-09-${week} · 演示巡检任务`,
      })),
      {
        id: 'HC-TASK-SYNC',
        title: '数据同步异常专项排查',
        owner: '接口工程师',
        state: 'delayed',
        periodPlanned: true,
        nextPeriod: true,
        status: '延期 · 需协调',
        detail:
          '关联 WO-HC-029，持续 2 天，需协调接口工程师共同排查并明确下一次反馈时间。',
        evidence: 'SVC-HC-2026 / HC-TASK-SYNC · 演示任务',
      },
      {
        id: 'HC-TASK-EXPORT',
        title: '报表导出复现与验证',
        owner: '运维工程师',
        state: 'active',
        periodPlanned: true,
        nextPeriod: true,
        status: '进行中',
        detail: '关联 WO-HC-030，等待客户提供脱敏样本后复测。',
        evidence: 'SVC-HC-2026 / HC-TASK-EXPORT · 演示任务',
      },
    ],
    projectNames: [
      'SVC-HC-2026 · 华辰医药年度运维',
      'PRJ-HC-01 · 华辰医药系统建设',
    ],
    stages: ['建设交付', '上线交接', '运维服务'],
    stageIndex: 2,
    conclusion:
      '本月受理 30 个服务问题，已解决 28 个，剩余 2 个持续跟进；完成 4 次巡检，客户满意度 4.8/5。系统建设项目已于 8 月按期验收，当前重点是服务闭环和遗留问题处理。',
    metrics: [
      {
        label: '已解决问题',
        value: '28 / 30 个',
        hint: '剩余 2 个持续处理',
        icon: 'lucide:circle-check',
      },
      {
        label: '上门巡检',
        value: '4 次',
        hint: '其中 1 份整改证明待补',
        icon: 'lucide:clipboard-check',
      },
      {
        label: '平均响应',
        value: '18 分钟',
        hint: '本月 30 张工单首次响应',
        icon: 'lucide:timer',
      },
      {
        label: '客户满意度',
        value: '4.8 / 5',
        hint: '12 份有效回访问卷',
        icon: 'lucide:smile',
      },
    ],
    service: {
      resolved: 28,
      open: 2,
      categories: [
        { label: '设备与外设', count: 14 },
        { label: '账号与权限', count: 8 },
        { label: '数据与接口', count: 8 },
      ],
    },
    milestones: [
      {
        title: '系统建设项目验收',
        planned: '2026-08-28',
        actual: '2026-08-28',
        status: '按期交付',
      },
      {
        title: '本月巡检整改归档',
        planned: '2026-09-30',
        actual: '1 份整改证明待补',
        status: '待闭环',
      },
    ],
    sourcePath: [
      '客户 华辰医药',
      '已关联交付项目 + 运维服务项目',
      '项目工单 / 巡检 / 回访 / 验收',
      '客户经理审查',
    ],
    blocks: [
      {
        id: 'outcomes',
        title: '为客户解决的问题',
        icon: 'lucide:heart-handshake',
        summary:
          '本月受理 30 个问题，28 个已关闭、2 个仍在处理。已关闭问题以工单处理结果为准；进行中的问题不计入解决数。',
        items: [
          {
            id: 'HC-DEV',
            title: '设备与外设问题',
            detail: '共 14 个问题，已解决 14 个，恢复日常打印、扫描等操作。',
            status: '已解决 14 个',
            evidence: 'SVC-HC-2026 · 工单设备分类 · 9 月关闭记录',
          },
          {
            id: 'HC-ACC',
            title: '账号与权限问题',
            detail: '共 8 个问题，已解决 8 个，恢复人员登录与业务访问。',
            status: '已解决 8 个',
            evidence: 'SVC-HC-2026 · 工单权限分类 · 9 月关闭记录',
          },
          {
            id: 'HC-DATA',
            title: '数据与接口问题',
            detail:
              '共 8 个问题，已解决 6 个；报表导出、数据同步 2 个问题仍在跟进。',
            status: '跟进中 2 个',
            evidence: 'SVC-HC-2026 · 工单数据分类 · WO-HC-029 / 030',
          },
        ],
      },
      {
        id: 'delivery',
        title: '关联项目与交付承诺',
        icon: 'lucide:package-check',
        summary:
          '华辰医药系统建设项目计划 8 月 28 日验收，实际同日验收，属于历史按期交付。本月为运维服务期，不将历史验收计入本月新增交付。',
        items: [
          {
            id: 'PRJ-HC-01',
            title: '华辰医药系统建设',
            detail:
              '承诺验收：8/28；实际验收：8/28。已进入运维，本月无新增建设里程碑。',
            status: '历史按期交付',
            evidence: 'PRJ-HC-01 · 验收记录 2026-08-28',
          },
          {
            id: 'SVC-HC-2026',
            title: '年度运维服务',
            detail:
              '服务周期内完成 4 次上门巡检，28 个问题已解决；整改证明 1 份待归档。',
            status: '服务执行中',
            evidence: 'SVC-HC-2026 · 巡检 4 次 / 回访 12 份',
          },
        ],
      },
      {
        id: 'risks',
        title: '未闭环问题与协调',
        icon: 'lucide:flag',
        tone: 'risk',
        summary:
          '2 个问题未闭环：数据同步异常已持续 2 天，需增派接口工程师；报表导出问题等待客户提供复现样本。另有 1 份巡检整改证明待归档。',
        items: [
          {
            id: 'WO-HC-029',
            title: '数据同步异常',
            detail:
              '工程师排查中，影响每日数据同步；建议协调接口工程师共同处理，下一次反馈时间 10/01 12:00。',
            status: '需协调',
            evidence: 'SVC-HC-2026 / WO-HC-029 · 截至 9/30 持续 2 天',
          },
          {
            id: 'WO-HC-030',
            title: '报表导出异常',
            detail:
              '等待客户提供脱敏复现样本，客户经理负责跟进；收到后安排复测。',
            status: '待客户配合',
            evidence: 'SVC-HC-2026 / WO-HC-030 · 工单进展',
          },
        ],
      },
      {
        id: 'plan',
        title: '下月服务与改进计划',
        icon: 'lucide:calendar-arrow-up',
        tone: 'plan',
        summary:
          '优先闭环 2 个遗留问题，补齐巡检整改证明；按服务计划完成下月巡检，针对数据同步异常安排专项检查。',
        items: [
          {
            id: 'HC-PLAN1',
            title: '遗留问题专项闭环',
            detail:
              '10/01—10/09 跟进同步、导出问题，交付处理记录与客户确认。已有问题工单承接。',
            status: '已有工单',
            evidence: 'SVC-HC-2026 / WO-HC-029 / 030',
          },
          {
            id: 'HC-PLAN2',
            title: '同步专项检查与整改归档',
            detail:
              '10/09 前补齐整改证明；建议在下月巡检任务中补充同步专项检查子任务。',
            status: '建议补充子任务',
            evidence: 'SVC-HC-2026 · 下月巡检计划',
          },
        ],
      },
    ],
  },
  delivery: {
    id: 'delivery',
    kind: 'customer',
    label: '建设交付期',
    name: '华辰医药',
    manager: 'Angus',
    role: '客户经理',
    phase: '建设交付期',
    projectNames: ['PRJ-HC-02 · 华辰医药协同升级'],
    stages: ['建设交付', '上线交接', '运维服务'],
    stageIndex: 0,
    conclusion:
      '协同升级项目处于开发联调阶段，12 个约定接口已完成 10 个。原承诺 10 月 8 日验收，当前预计 10 月 10 日，存在 2 天延期风险；需先与项目经理核对，再与客户确认调整方案。',
    metrics: [
      {
        label: '接口完成',
        value: '10 / 12 个',
        hint: '剩余 2 个等待联调',
        icon: 'lucide:plug-zap',
      },
      {
        label: '原承诺验收',
        value: '10 月 8 日',
        hint: '以项目基线为准',
        icon: 'lucide:calendar-check',
      },
      {
        label: '预计验收',
        value: '10 月 10 日',
        hint: '尚未与客户确认变更',
        icon: 'lucide:calendar-clock',
      },
      {
        label: '交付风险',
        value: '2 天',
        hint: '预计较原基线延后',
        icon: 'lucide:flag',
      },
    ],
    progress: { done: 10, total: 12, label: '约定接口完成情况' },
    milestones: [
      {
        title: '需求确认',
        planned: '2026-09-08',
        actual: '2026-09-08',
        status: '已完成',
      },
      {
        title: '接口联调',
        planned: '2026-09-30',
        actual: '预计 2026-10-02',
        status: '有风险',
      },
      {
        title: '项目验收',
        planned: '2026-10-08',
        actual: '预计 2026-10-10',
        status: '预计延后 2 天',
      },
    ],
    sourcePath: [
      '客户 华辰医药',
      'PRJ-HC-02 协同升级',
      '项目阶段 / 里程碑 / 交付物 / 风险',
      '客户经理核对并沟通',
    ],
    blocks: [
      {
        id: 'outcomes',
        title: '本月交付与客户价值',
        icon: 'lucide:package-check',
        summary:
          '已完成需求确认及 10 个接口对接，形成联调记录；剩余 2 个接口未完成，不计入已交付。',
        items: [
          {
            id: 'HC-IF10',
            title: '10 个接口完成对接',
            detail:
              '已形成接口联调记录，客户可核对字段和结果；剩余 2 个接口待客户测试环境恢复。',
            status: '已完成 10 个',
            evidence: 'PRJ-HC-02 · 接口清单与联调记录 V2',
          },
        ],
      },
      {
        id: 'delivery',
        title: '项目进度与按期交付',
        icon: 'lucide:route',
        summary:
          '原承诺 10/08 验收，当前预计 10/10。延期 2 天是当前预测，未经客户确认，不直接改写原合同或项目承诺。',
        items: [
          {
            id: 'HC-M3',
            title: '验收里程碑存在延期风险',
            detail:
              '客户测试环境未就绪影响剩余接口联调。项目经理提供排期，客户经理协调环境与客户沟通。',
            status: '需协调',
            evidence: 'PRJ-HC-02 / M-03 · 基线 10/08 / 预测 10/10',
          },
        ],
      },
      {
        id: 'risks',
        title: '交付风险与客户配合',
        icon: 'lucide:flag',
        tone: 'risk',
        summary:
          '客户测试环境需在 10/01 恢复；建议项目经理提供并行联调方案，客户经理确认验收时间及客户配合事项。',
        items: [
          {
            id: 'HC-R2',
            title: '测试环境待恢复',
            detail:
              '影响 2 个接口联调及验收。需客户 IT 负责人提供环境恢复时间。',
            status: '待客户配合',
            evidence: 'PRJ-HC-02 · 项目风险 R-02',
          },
        ],
      },
      {
        id: 'plan',
        title: '下月交付与沟通计划',
        icon: 'lucide:calendar-arrow-up',
        tone: 'plan',
        summary:
          '完成剩余 2 个接口联调、验收材料整理与验收安排；客户经理在对外发送前确认交付口径。',
        items: [
          {
            id: 'HC-DPLAN',
            title: '联调与验收',
            detail:
              '10/02 完成剩余接口，10/10 完成验收；由项目经理核对任务覆盖，客户经理确认沟通计划。',
            status: '待确认排期',
            evidence: 'PRJ-HC-02 · 联调任务与验收计划',
          },
        ],
      },
    ],
  },
  handover: {
    id: 'handover',
    kind: 'customer',
    label: '上线交接期',
    name: '华辰医药',
    manager: 'Angus',
    role: '客户经理',
    phase: '上线交接期',
    projectNames: ['PRJ-HC-03 · 华辰医药移动审批'],
    stages: ['建设交付', '上线交接', '运维服务'],
    stageIndex: 1,
    conclusion:
      '移动审批已于 9 月 25 日按期上线，完成 2 场培训，验收清单 6 项中确认 5 项。剩余 1 项培训资料签收与 2 个非阻塞问题待闭环，尚不等同于整体验收完成。',
    metrics: [
      {
        label: '上线交付',
        value: '已按期',
        hint: '计划与实际均为 9/25',
        icon: 'lucide:rocket',
      },
      {
        label: '验收确认',
        value: '5 / 6 项',
        hint: '培训资料签收待确认',
        icon: 'lucide:clipboard-check',
      },
      {
        label: '用户培训',
        value: '2 场',
        hint: '已保留培训记录',
        icon: 'lucide:graduation-cap',
      },
      {
        label: '遗留问题',
        value: '2 个',
        hint: '非阻塞问题待闭环',
        icon: 'lucide:flag',
      },
    ],
    progress: { done: 5, total: 6, label: '验收清单确认情况' },
    milestones: [
      {
        title: '系统上线',
        planned: '2026-09-25',
        actual: '2026-09-25',
        status: '按期上线',
      },
      {
        title: '交接验收确认',
        planned: '2026-09-30',
        actual: '5 / 6 项确认',
        status: '待闭环',
      },
    ],
    sourcePath: [
      '客户 华辰医药',
      'PRJ-HC-03 移动审批',
      '上线 / 验收 / 培训 / 遗留工单',
      '客户经理审查后分发',
    ],
    blocks: [
      {
        id: 'outcomes',
        title: '上线成果与使用准备',
        icon: 'lucide:rocket',
        summary:
          '9/25 按期上线，已完成 2 场用户培训。验收确认 5/6 项，不能将上线完成直接写成整体验收完成。',
        items: [
          {
            id: 'HC-GO',
            title: '移动审批按期上线',
            detail: '部署记录与上线确认齐备，培训记录 2 份已归档。',
            status: '已上线',
            evidence: 'PRJ-HC-03 · 上线确认 / 培训记录',
          },
        ],
      },
      {
        id: 'delivery',
        title: '验收与服务交接',
        icon: 'lucide:clipboard-check',
        summary:
          '6 项验收清单已确认 5 项，培训资料签收未完成；运维接手前应确认联系人、服务范围和遗留问题清单。',
        items: [
          {
            id: 'HC-ACC6',
            title: '培训资料签收待完成',
            detail:
              '请客户业务负责人确认培训资料，项目经理核对验收清单，客户经理协调签收。',
            status: '待客户确认',
            evidence: 'PRJ-HC-03 · 验收清单第 6 项',
          },
        ],
      },
      {
        id: 'risks',
        title: '遗留问题与交接风险',
        icon: 'lucide:flag',
        tone: 'risk',
        summary:
          '2 个非阻塞问题已建工单；如签收和遗留问题未明确责任人与日期，运维接手可能出现边界不清。',
        items: [
          {
            id: 'HC-LEG',
            title: '遗留问题责任与时限',
            detail:
              '审批提醒延迟、导出样式问题由项目工程师跟进，建议 10/09 前关闭并取得客户确认。',
            status: '跟进中',
            evidence: 'PRJ-HC-03 · WO-HC-041 / 042',
          },
        ],
      },
      {
        id: 'plan',
        title: '下月闭环与运维接手',
        icon: 'lucide:calendar-arrow-up',
        tone: 'plan',
        summary:
          '完成培训资料签收、关闭 2 个遗留问题并形成运维交接清单；经客户确认后转入运维服务阶段。',
        items: [
          {
            id: 'HC-HPLAN',
            title: '验收闭环与运维交接',
            detail:
              '10/09 前完成资料签收和问题处理；交接工单已建立，先核对覆盖范围。',
            status: '已有交接工单',
            evidence: 'PRJ-HC-03 · 交接工单 HC-HO-01',
          },
        ],
      },
    ],
  },
};

export function newBusinessState(kind: string): BusinessReportState {
  return {
    scenario: kind === 'project' ? 'project' : 'operations',
    drafts: {},
    updatedAt: '',
  };
}
export function defaultBusinessEdits(
  profile: BusinessReportProfile,
): BusinessReportEdits {
  return {
    conclusion: '',
    health:
      profile.stageIndex < 0
        ? '待核对'
        : profile.id === 'project' || profile.id === 'delivery'
          ? '需关注'
          : '正常',
    forecast:
      profile.kind === 'project' && profile.stageIndex >= 0
        ? (profile.milestones.at(-1)?.planned ?? '')
        : '',
    notes: {},
    customerNotes: {},
    reviewed: [],
  };
}
export function businessProfileForPeriod(
  profile: BusinessReportProfile,
  start: string,
  end: string,
): BusinessReportProfile {
  const sample =
    profile.kind === 'project'
      ? ['2026-10-19', '2026-10-25']
      : ['2026-09-01', '2026-09-30'];
  if (start === sample[0] && end === sample[1]) return structuredClone(profile);
  return {
    ...structuredClone(profile),
    phase: '待采集确认',
    stageIndex: -1,
    conclusion: '所选周期暂无已采集业务数据，请重新采集或补充经确认的事实。',
    metrics: [],
    taskRecords: undefined,
    progress: undefined,
    service: undefined,
    milestones: [],
    blocks: profile.blocks.map((b) => ({
      ...b,
      summary: '本周期暂无采集结果，请补充成果依据后核对。',
      items: [],
    })),
  };
}

for (const profile of Object.values(businessProfiles)) {
  if (profile.service)
    console.assert(
      profile.service.categories.reduce((sum, c) => sum + c.count, 0) ===
        profile.service.resolved + profile.service.open,
      '客户工单分类与处理总数必须一致',
    );
  if (profile.progress)
    console.assert(
      profile.progress.done <= profile.progress.total,
      '完成数不得大于总数',
    );
}
