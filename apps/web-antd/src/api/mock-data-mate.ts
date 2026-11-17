import type {
  MateAutomationLog,
  MateAutomationTask,
  MateChatSession,
  MateEmployee,
  MateEmployeeMenu,
  MateEmployeeProfile,
  MateFile,
  MateMessage,
} from '#/types/mate';

const matePublicAsset = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

const weeklyAssistantMenus: MateEmployeeMenu[] = [
  {
    key: 'chat',
    title: '数字员工',
    icon: 'lucide:message-circle',
    summary: '与周报助理对话，生成、检查并完善本周周报。',
    path: '/app/mate/employee/weekly-assistant/chat',
  },
  {
    key: 'my-work',
    title: '我的工作',
    icon: 'lucide:briefcase',
    summary: '日常积累的工作资料与事项，周末自动聚合为周报。',
    path: '/app/mate/employee/weekly-assistant/my-work',
  },
  {
    key: 'my-report',
    title: '我的周报',
    icon: 'lucide:file-check-2',
    summary: '时间树翻阅历史周报与编辑本周内容。',
    path: '/app/mate/employee/weekly-assistant/my-report',
  },
];

const weeklyReviewMenus: MateEmployeeMenu[] = [
  {
    key: 'chat',
    title: '数字员工',
    icon: 'lucide:message-circle',
    summary: '询问团队周报中值得主管关注和追问的问题。',
    path: '/app/mate/employee/weekly-review/chat',
  },
  {
    key: 'pending',
    title: '待我审核',
    icon: 'lucide:clipboard-check',
    summary: '按风险优先顺序审核团队周报。',
    path: '/app/mate/employee/weekly-review/pending',
  },
  {
    key: 'team-reports',
    title: '团队周报',
    icon: 'lucide:files',
    summary: '查询团队成员的连续周报。',
    path: '/app/mate/employee/weekly-review/team-reports',
  },
  {
    key: 'focus',
    title: '重点关注',
    icon: 'lucide:scan-eye',
    summary: '按照问题组织管理关注事项。',
    path: '/app/mate/employee/weekly-review/focus',
  },
];

const weeklyAnalysisMenus: MateEmployeeMenu[] = [
  {
    key: 'chat',
    title: '数字员工',
    icon: 'lucide:message-circle',
    summary: '从团队、项目、客户和风险维度询问连续工作情况。',
    path: '/app/mate/employee/weekly-analysis/chat',
  },
  {
    key: 'team',
    title: '团队洞察',
    icon: 'lucide:chart-no-axes-combined',
    summary: '查看本周团队成果、风险和趋势。',
    path: '/app/mate/employee/weekly-analysis/team',
  },
  {
    key: 'projects',
    title: '项目洞察',
    icon: 'lucide:briefcase-business',
    summary: '查看重点项目状态和连续 Context。',
    path: '/app/mate/employee/weekly-analysis/insight-projects',
  },
  {
    key: 'customers',
    title: '客户洞察',
    icon: 'lucide:building-2',
    summary: '查看重点客户状态、工作和风险。',
    path: '/app/mate/employee/weekly-analysis/customers',
  },
  {
    key: 'risks',
    title: '风险洞察',
    icon: 'lucide:triangle-alert',
    summary: '统一查看延期、阻塞和需要支持的事项。',
    path: '/app/mate/employee/weekly-analysis/risks',
  },
];

const reportCopilotMenus: MateEmployeeMenu[] = [
  {
    key: 'chat',
    title: '数字员工',
    icon: 'lucide:message-circle',
    summary: '上传资料、补充信息，由 AI 生成并完善本周汇报。',
    path: '/app/mate/employee/report-copilot/new-chat',
  },
  {
    key: 'reports',
    title: '报告',
    icon: 'lucide:files',
    summary: '统一管理我参与的日报、周报、月报等各类报告，查询历史与编辑本期。',
    path: '/app/mate/employee/report-copilot/reports',
  },
  {
    key: 'work-records',
    title: '工作记录',
    icon: 'lucide:list-checks',
    summary: '查看员工录入或由对话自动拆分的逐条工作记录与关联附件。',
    path: '/app/mate/employee/report-copilot/work-records',
  },
  {
    key: 'mentions',
    title: '我的待办',
    icon: 'lucide:list-todo',
    summary: '统一处理项目、成果物、审批、周报协作和制度确认事项。',
    path: '/app/mate/employee/report-copilot/mentions',
  },
  {
    key: 'settings',
    title: '个人设置',
    icon: 'lucide:user-cog',
    summary: '配置计划任务、审批关系与可见范围，以及报告类型和数据源。',
    path: '/app/mate/employee/report-copilot/personal-settings',
  },
];

const reviewCopilotMenus: MateEmployeeMenu[] = [
  {
    key: 'chat',
    title: '数字员工',
    icon: 'lucide:message-circle',
    summary: '直接询问本周最值得关注、追问和协调的事项。',
    path: '/app/mate/employee/review-copilot/new-chat',
  },
  {
    key: 'review',
    title: '审阅中心',
    icon: 'lucide:scan-text',
    summary: '按管理优先级阅读汇报、证据、评论与员工回复。',
    path: '/app/mate/employee/review-copilot/review',
  },
  {
    key: 'follow-ups',
    title: '下周关注',
    icon: 'lucide:list-checks',
    summary: '汇总主管提问与行动建议，不强制拆成正式任务。',
    path: '/app/mate/employee/review-copilot/follow-ups',
  },
  {
    key: 'approval-style',
    title: '审批风格',
    icon: 'lucide:brain-circuit',
    summary: '查看 AI 从历史审批中持续提炼的个人审批逻辑与本周变化。',
    path: '/app/mate/employee/review-copilot/approval-style',
  },
  {
    key: 'entity-management',
    title: '实体管理',
    icon: 'lucide:database',
    summary:
      '查看报告识别实体的使用统计与识别流水，合并重复实体、维护别名、删除错误实体。',
    path: '/app/mate/employee/review-copilot/entity-management',
  },
  {
    key: 'settings',
    title: '审核设置',
    icon: 'lucide:settings-2',
    summary: '按岗位配置审核分析策略，以及员工提交前的 AI 检查提示词。',
    path: '/app/mate/employee/review-copilot/settings',
  },
];

const fillAssistantMenus: MateEmployeeMenu[] = [
  {
    key: 'chat',
    title: '数字员工',
    icon: 'lucide:bot',
    summary: '通过对话完成发票筛选、表头确认与合规校验，分步生成报销单。',
    path: '/app/mate/employee/fill-assistant/fill-chat',
  },
  {
    key: 'my-bills',
    title: '我的单据',
    icon: 'lucide:file-check-2',
    summary: '查看已生成的报销单与填报记录，跟踪提交与审批状态。',
    path: '/app/mate/employee/fill-assistant/my-bills',
  },
];

const ticketAssistantMenus: MateEmployeeMenu[] = [
  {
    key: 'chat',
    title: '对话',
    icon: 'lucide:bot',
    summary: '通过对话引导式收集分析现场信息，快速创建工单。',
    path: '/app/mate/employee/ticket-assistant/ticket-chat',
  },
  {
    key: 'my-tickets',
    title: '我的工单',
    icon: 'lucide:clipboard-list',
    summary: '查看我创建的工单以及分派给我的工单，跟踪处理进度。',
    path: '/app/mate/employee/ticket-assistant/my-tickets',
  },
  {
    key: 'inspection-plans',
    title: '巡检计划',
    icon: 'lucide:calendar-check',
    summary: '管理合同巡检计划，跟踪巡检执行与变更记录。',
    path: '/app/mate/employee/ticket-assistant/inspection-plans',
  },
];

const projectAssistantMenus: MateEmployeeMenu[] = [
  {
    key: 'chat',
    title: '数字员工',
    icon: 'lucide:message-circle',
    summary: '询问下一步、检查成果物并生成补救或周报材料。',
    path: '/app/mate/employee/project-assistant/project-chat',
  },
  {
    key: 'my-goals',
    title: '我的目标',
    icon: 'lucide:target',
    summary: '集中查看我负责和协作的目标、关键结果及成果要求。',
    path: '/app/mate/employee/project-assistant/my-goals',
  },
  {
    key: 'projects',
    title: '我的项目',
    icon: 'lucide:folder-kanban',
    summary: '按列表或甘特图查看我参与项目的阶段、目标、KR 与成果物。',
    path: '/app/mate/employee/project-assistant/projects',
  },
];

const meetingAssistantMenus: MateEmployeeMenu[] = [
  {
    key: 'chat',
    title: '对话',
    icon: 'lucide:messages-square',
    summary: '结合项目上下文生成会议议程、纪要、决策和会后跟进任务。',
    path: '/app/mate/employee/meeting-assistant/project-chat',
  },
];

const pmoAssistantMenus: MateEmployeeMenu[] = [
  {
    key: 'chat',
    title: '数字员工',
    icon: 'lucide:message-circle',
    summary: '询问项目风险、管理建议并生成干预材料。',
    path: '/app/mate/employee/pmo-assistant/project-chat',
  },
  {
    key: 'initiation',
    title: '项目立项',
    icon: 'lucide:clipboard-check',
    summary: '上传项目资料，完成 AI 解析、宪章确认、审批和基线发布。',
    path: '/app/mate/employee/pmo-assistant/initiation',
  },
  {
    key: 'portfolio',
    title: '项目',
    icon: 'lucide:folder-kanban',
    summary: '查看已立项项目的阶段、目标、KR、成果物和执行状态。',
    path: '/app/mate/employee/pmo-assistant/portfolio',
  },
  {
    key: 'templates',
    title: '制度与模板',
    icon: 'lucide:library-big',
    summary: '上传公司制度，由 AI 解析执行规则，经人工确认后发布项目模板。',
    path: '/app/mate/employee/pmo-assistant/templates',
  },
];

const salesAssistantMenus: MateEmployeeMenu[] = [
  {
    key: 'sales-chat',
    title: '数字员工',
    icon: 'lucide:message-circle',
    summary: '通过对话报备商机、记录跟进、询问制度并获得下一步建议。',
    path: '/app/mate/employee/sales-assistant/sales-chat',
  },
  {
    key: 'opportunities',
    title: '商机',
    icon: 'lucide:chart-no-axes-combined',
    summary: '按列表查询商机，查看阶段、资料、跟进状态和制度风险。',
    path: '/app/mate/employee/sales-assistant/opportunities',
  },
  {
    key: 'customer-followup',
    title: '客户跟进',
    icon: 'lucide:users-round',
    summary: '维护客户跟进事实，查看 AI 生成的下一步建议、阶段资料和公海计时。',
    path: '/app/mate/employee/sales-assistant/customer-followup',
  },
  {
    key: 'sales-scope',
    title: '销售范围',
    icon: 'lucide:map-pinned',
    summary: '按区域、行业、产品线维护负责范围，处理跨范围和公开招标冲突。',
    path: '/app/mate/employee/sales-assistant/sales-scope',
  },
  {
    key: 'sales-performance',
    title: '绩效提成',
    icon: 'lucide:badge-dollar-sign',
    summary: '查看新签、续约、增购的业绩口径、提成计算依据和复核状态。',
    path: '/app/mate/employee/sales-assistant/sales-performance',
  },
  {
    key: 'sales-policy',
    title: '销售制度',
    icon: 'lucide:book-open-check',
    summary: '把销售管理要求转成可执行规则、流程模板和 AI 检查项。',
    path: '/app/mate/employee/sales-assistant/sales-policy',
  },
];

const mateEmployeeCatalog: MateEmployee[] = [
  {
    id: 'new-review-assistant',
    name: '新审核助理',
    role: '业务审核数字员工',
    description:
      '集中处理汇报、项目立项与运维工单，查看业务依据并确认审批意见。',
    avatar: matePublicAsset('images/ai-employee/商务分析助手.jpg'),
    accent: '#5d86a7',
    status: 'online',
    unread: 0,
    pinned: true,
    lastActive: '刚刚',
    menus: [
      {
        key: 'chat',
        title: '对话',
        icon: 'lucide:messages-square',
        summary: '与新审核助理对话，查看待反馈清单和审核建议。',
        path: '/app/mate/employee/new-review-assistant/review-chat',
      },
      {
        key: 'report-review',
        title: '审核中心',
        icon: 'lucide:clipboard-check',
        summary: '按汇报、立项、工单分类查看并处理审核事项。',
        path: '/app/mate/employee/new-review-assistant/report-review',
      },
    ],
    quickPrompts: [
      '有哪些报告待我反馈？',
      '查看项目报告',
      '评分和反馈有什么要求？',
    ],
  },
  {
    id: 'new-sales-assistant',
    name: '新销售助理',
    role: 'AI 销售协作数字员工',
    description: '客户、商机与每一次跟进。',
    avatar: matePublicAsset('images/ai-employee/商务分析助手.jpg'),
    accent: '#087f8c',
    status: 'online',
    unread: 0,
    pinned: true,
    lastActive: '刚刚',
    menus: [
      {
        key: 'chat',
        title: '对话',
        icon: 'lucide:messages-square',
        summary: '对话',
        path: '/app/mate/employee/new-sales-assistant/sales/chat',
      },
      {
        key: 'workbench',
        title: '销售工作台',
        icon: 'lucide:layout-dashboard',
        summary: '每日行动',
        path: '/app/mate/employee/new-sales-assistant/sales/workbench',
      },
      {
        key: 'customers',
        title: '客户中心',
        icon: 'lucide:building-2',
        summary: '客户与线索',
        path: '/app/mate/employee/new-sales-assistant/sales/customers',
      },
      {
        key: 'pipeline',
        title: '商机',
        icon: 'lucide:kanban',
        summary: '每一笔商机的推进',
        path: '/app/mate/employee/new-sales-assistant/sales/pipeline',
      },
    ],
    quickPrompts: ['挖掘客户画像', '分析重点商机', '生成客户方案'],
  },
  {
    id: 'new-report-assistant',
    name: '新汇报助理',
    role: '统一汇报数字员工',
    description:
      '自动整理工作成果，帮你核对、补充和分发报告，把下一步计划接到实际行动。',
    avatar: matePublicAsset('images/ai-employee/咨询人员.jpg'),
    accent: '#238873',
    status: 'online',
    unread: 0,
    pinned: true,
    lastActive: '刚刚',
    menus: [
      {
        key: 'chat',
        title: '对话',
        icon: 'lucide:messages-square',
        summary: '与新汇报助理对话，整理工作和查看报告。',
        path: '/app/mate/employee/new-report-assistant/report-chat',
      },
      {
        key: 'reports',
        title: '汇报',
        icon: 'lucide:files',
        summary: '选择汇报方案，核对自动生成的报告并提报。',
        path: '/app/mate/employee/new-report-assistant/reports',
      },
      {
        key: 'personal-settings',
        title: '个人设置',
        icon: 'lucide:user-round-cog',
        summary: '按报告类型设置定时生成、分享对象和审批人。',
        path: '/app/mate/employee/new-report-assistant/report-settings',
      },
    ],
    quickPrompts: ['生成本周汇报', '每周六自动生成', '检查下一步计划'],
  },
  {
    id: 'contract-assistant',
    name: '合同助理',
    role: '合同解析与履约协同数字员工',
    description:
      '按合同类型提取信息、逐项审核并确认建档，统一查看合同资料及关联业务进展。',
    avatar: matePublicAsset('images/ai-employee/商务分析助手.jpg'),
    accent: '#287c71',
    status: 'online',
    unread: 0,
    pinned: true,
    lastActive: '刚刚',
    menus: [
      {
        key: 'contract-chat',
        title: '数字员工',
        icon: 'lucide:message-circle',
        summary: '上传合同，核对要求并确认履约安排。',
        path: '/app/mate/employee/contract-assistant/contract-chat',
      },
      {
        key: 'contract-archives',
        title: '合同档案',
        icon: 'lucide:folder-archive',
        summary: '统一查找合同资料、确认信息与履约计划。',
        path: '/app/mate/employee/contract-assistant/contract-archives',
      },
    ],
    quickPrompts: ['配置运维巡检方案', '试运行销售合同', '查看履约规则'],
  },
  {
    id: 'meeting-assistant',
    name: '会议助理',
    role: '项目会议协同数字员工',
    description:
      '读取项目阶段、目标、风险和成果物上下文，协助准备会议议程、沉淀纪要、识别决策并生成会后跟进任务。',
    avatar: matePublicAsset('images/ai-employee/项目经理.jpg'),
    accent: '#527f9a',
    status: 'online',
    unread: 0,
    pinned: true,
    lastActive: '刚刚',
    menus: meetingAssistantMenus,
    quickPrompts: ['生成项目例会议程', '整理会议纪要', '提取会后跟进任务'],
  },
  {
    id: 'project-assistant',
    name: '项目助理',
    role: '项目执行推进数字员工',
    description:
      '围绕项目 O/KR 与成果物，告诉执行者现在最值得做什么，并直接协助生成验收、补救和周报材料。',
    avatar: matePublicAsset('images/ai-employee/产品经理.jpg'),
    accent: '#3f9d86',
    status: 'online',
    unread: 2,
    pinned: true,
    lastActive: '刚刚',
    menus: projectAssistantMenus,
    quickPrompts: ['我今天应该先做什么', '检查联调测试报告', '把进展写入周报'],
  },
  {
    id: 'pmo-assistant',
    name: '交付项目 PMO',
    role: '交付项目治理与风险干预数字员工',
    description:
      '面向交付部门完成项目立项、制度落地和执行风险干预；同一能力可配置复用于其他部门。',
    avatar: matePublicAsset('images/ai-employee/项目经理.jpg'),
    accent: '#557f9d',
    status: 'online',
    unread: 3,
    pinned: true,
    lastActive: '2分钟前',
    menus: pmoAssistantMenus,
    quickPrompts: [
      '发起一个交付项目',
      '客户 B 为什么有风险',
      '生成升级会议议程',
    ],
  },
  {
    id: 'sales-assistant',
    name: 'AI 销售助理',
    role: '销售制度与业务推进数字员工',
    description:
      '将销售制度落实到商机报备、过程推进和绩效核算，并在执行时说明依据、提示缺口。',
    avatar: matePublicAsset('images/ai-employee/sales.png'),
    accent: '#b56a3d',
    status: 'online',
    unread: 2,
    pinned: true,
    lastActive: '刚刚',
    menus: salesAssistantMenus,
    quickPrompts: ['帮我报备一个新客户', '检查报备归属冲突', '解析销售制度'],
  },
  {
    id: 'report-copilot',
    name: '汇报助理',
    role: '个人工作汇报数字员工',
    description:
      '把文件、录音和聊天变成高质量汇报；你只需补充说明，不必维护复杂表单。',
    avatar: matePublicAsset('images/ai-employee/咨询人员.jpg'),
    accent: '#4e9c88',
    status: 'online',
    unread: 1,
    pinned: true,
    lastActive: '刚刚',
    menus: reportCopilotMenus,
    quickPrompts: ['生成本周汇报', '检查上周承诺', '还缺什么资料'],
  },
  {
    id: 'review-copilot',
    name: '审阅助理',
    role: '主管汇报审阅数字员工',
    description: '先给结论和管理关注，再进入原文、证据、提问与下周跟进。',
    avatar: matePublicAsset('images/ai-employee/商务分析助手.jpg'),
    accent: '#668fb0',
    status: 'online',
    unread: 3,
    pinned: true,
    lastActive: '3分钟前',
    menus: reviewCopilotMenus,
    quickPrompts: ['开始审阅', '谁需要我介入', '查看未回应问题'],
  },
  {
    id: 'weekly-assistant',
    name: '周报助理',
    role: '员工工作复盘助手',
    description: '旧版周报生成与提交入口，保留用于历史 Demo 对照。',
    avatar: matePublicAsset('images/ai-employee/产品经理.jpg'),
    accent: '#90c7b6',
    status: 'offline',
    unread: 0,
    pinned: false,
    lastActive: '已作废',
    menus: weeklyAssistantMenus,
    quickPrompts: ['帮我生成本周周报', '检查遗漏工作', '检查上周计划'],
    deprecated: true,
  },
  {
    id: 'weekly-review',
    name: '周报审核',
    role: '主管审核助手',
    description: '旧版团队周报审核入口，保留用于历史 Demo 对照。',
    avatar: matePublicAsset('images/ai-employee/项目经理.jpg'),
    accent: '#8fb6d1',
    status: 'offline',
    unread: 0,
    pinned: false,
    lastActive: '已作废',
    menus: weeklyReviewMenus,
    quickPrompts: ['开始审核', '查看重点问题', '谁还没有提交'],
    deprecated: true,
  },
  {
    id: 'weekly-analysis',
    name: '周报分析',
    role: '组织工作洞察助手',
    description: '旧版组织周报分析入口，保留用于历史 Demo 对照。',
    avatar: matePublicAsset('images/ai-employee/数据分析师.jpg'),
    accent: '#c8ae80',
    status: 'offline',
    unread: 0,
    pinned: false,
    lastActive: '已作废',
    menus: weeklyAnalysisMenus,
    quickPrompts: ['总结本周团队', '查看风险', '分析重点客户'],
    deprecated: true,
  },
  {
    id: 'ticket-assistant',
    name: '工单助理',
    role: '运维工单全生命周期管理数字员工',
    description: '知应-你的响应先锋，让每张工单都响应',
    avatar: matePublicAsset('images/ai-employee/技术员.jpg'),
    accent: '#5b9d8e',
    status: 'online',
    unread: 1,
    pinned: true,
    lastActive: '3分钟前',
    menus: ticketAssistantMenus,
    quickPrompts: [
      '创建内部工单',
      '创建外部工单',
      '查看我的工单',
      '现场打卡',
      '提交解决方案',
    ],
    profile: {
      audience:
        '客户经理、公司员工、运维人员、一线人员（同一人可兼任多角色，权限按角色叠加）',
      coreCapabilities: [
        '工单分类管理：区分内部工单（公司员工发起）与外部工单（运维人员发起），共用同一套状态机',
        '对话式工单创建：设备编号 → 故障现象 → 复现方式 → 影响范围 → 优先级建议，自动匹配设备台账与在保状态',
        '故障附件管理：支持现场照片、短视频、报错截图、录音等材料随工单上传',
        '现场决策记录：客户经理判定是否前往现场，系统记录判定结果并据此要求现场打卡留痕',
        '现场打卡留痕：前往现场时上传带时间与地点水印的照片，作为服务质量追溯凭证',
        '处理闭环管理：解决方案必填、视频/截图凭证上传、现场打卡记录，三项齐备方可闭环',
        'SLA 多维度计算：按设备类型、客户等级、故障级别、设备在保状态分别计算响应与解决时效',
        '超时多渠道告警：站内消息、邮件、社交工具并行通知，确保超时风险及时触达',
      ],
      highlights: [
        '内部/外部工单共用状态机，字段、流程、权限无差异，仅按使用对象标记分类',
        '转派受派单规则约束，转派后 SLA 重新计时，避免责任真空',
        '现场打卡水印照片作为留痕凭证，第一阶段不对接报销系统，后续可扩展',
        '售后制度文件自动解析生成派单规则与 SLA 草稿，经人工复核后生效',
      ],
      scenarios: [
        '现场巡检发现设备偶发异常：一线人员通过对话快速记录并附带照片，创建外部工单进入待派池',
        '公司员工发起内部需求：通过工单助理创建内部工单，客户经理判定是否需要现场处理',
        '一线人员到场处理：现场打卡水印照片留痕，处理完成后填写解决方案并上传视频/截图凭证闭环',
        '转派场景：处理人外出或超负荷，通过对话快速转派，SLA 重新计时，处理人与客户同步收到通知',
      ],
    } as MateEmployeeProfile,
  },
  {
    id: 'fill-assistant',
    name: '填报助理',
    role: '报销单智能填报数字员工',
    description:
      '从发票池到报销单：智能筛选发票、推断表头、归类费用并完成合规校验，分步确认后一键生成报销单。',
    avatar: matePublicAsset('images/ai-employee/咨询人员.jpg'),
    accent: '#8b5cf6',
    status: 'online',
    unread: 2,
    pinned: true,
    lastActive: '刚刚',
    menus: fillAssistantMenus,
    quickPrompts: ['帮我填报差旅报销单', '筛选本月可报销发票', '查看我的单据'],
    profile: {
      audience: '需要提交报销单、费用单据的全体员工',
      coreCapabilities: [
        '填报方案生成：根据单据类型与报销期间自动扫描发票池，生成可确认的分步填报方案',
        '发票智能筛选：按行程日期、费用类型自动匹配发票，异常发票高亮提醒并默认排除',
        '表头智能推断：根据历史单据推断公司、预算、费用归属等表头信息，支持人工修改',
        '费用归类与合规校验：按科目自动归类费用明细，逐项执行差旅标准、连号发票等合规预校验',
        '一键生成报销单：汇总确认后生成报销单待办，支持单据预览与提交',
      ],
      highlights: [
        'AI 生成 ≠ 自动提交，每一步都需人工确认后进入下一步',
        '异常发票自动标记（信息缺失、连号等），默认排除避免填报退单',
        '差旅补贴按标准自动计算（餐补 100 元/天），依据透明可追溯',
      ],
      scenarios: [
        '差旅归来：一句话发起填报，AI 按行程匹配发票，分步确认后生成差旅报销单',
        '日常费用报销：同步发票后由 AI 归类汇总，完成合规校验后一键生成费用报销单',
        '填报被退单：AI 标记异常项与缺失信息，补充后重新生成提交',
      ],
    } as MateEmployeeProfile,
  },
] as MateEmployee[];

// 当前演示只开放汇报和工单两个数字员工，所有入口共用此列表。
export const mockMateEmployees = mateEmployeeCatalog.filter((employee) =>
  ['new-report-assistant', 'ticket-assistant'].includes(employee.id),
);

function createEmployeeSessions(
  employee: MateEmployee,
  titles: [string, string],
): MateChatSession[] {
  return [
    {
      id: `${employee.id}-session-1`,
      employeeId: employee.id,
      title: titles[0],
      relativeTime: '1月',
      unread: 0,
      messages: [
        {
          id: `${employee.id}-message-4`,
          role: 'assistant',
          content:
            '分析：\n假设目标公司是山东省一家专注于传热技术和热能工程的企业，主营业务可能包括换热器设计制造、热能设备研发、工业传热解决方案等。\n已生成基于行业假设的商业合作分析报告。\n搜索未找到“辉承传热技术（山东）有限公司”的确切公开信息，可能是非上市公司或信息较少。\n基于公司名称特征与行业画像，分析得出三个核心合作点：',
          time: '10:21',
          list: [
            '热能工程项目管理数字化平台',
            '换热设备智能售后服务平台',
            '热能工程数字化协同平台',
          ],
          closing:
            '报告包含能力互补性分析、潜在合作壁垒识别以及详细的时序交互流程图。',
          card: {
            tag: '技能卡片',
            title: '辉承传热技术数字化合作分析',
            summary: '基于行业假设分析热技术企业的数字化合作机会',
            actionLabel: '查看详情',
            details: [
              '企业画像：工业传热技术与热能工程解决方案提供商。',
              '合作切入：项目管理、售后服务、工程协同。',
              '建议动作：进一步核验企业公开信息并安排业务访谈。',
            ],
          },
        },
      ],
    },
    {
      id: `${employee.id}-session-2`,
      employeeId: employee.id,
      title: titles[1],
      relativeTime: '2月',
      unread: employee.unread,
      messages: [
        {
          id: `${employee.id}-message-5`,
          role: 'user',
          content: titles[1],
          time: '昨天',
        },
        {
          id: `${employee.id}-message-6`,
          role: 'assistant',
          content: `我可以围绕${employee.role}提供信息检索、内容归纳、业务分析和结果生成等工具支持。`,
          time: '昨天',
        },
      ],
    },
  ];
}

export const mockMateChatSessions: Record<string, MateChatSession[]> =
  Object.fromEntries(
    mockMateEmployees.map((employee) => [
      employee.id,
      createEmployeeSessions(employee, ['你支持哪些工具', '你支持什么工具？']),
    ]),
  );

export const mockMateMessages: Record<string, MateMessage[]> =
  Object.fromEntries(
    Object.entries(mockMateChatSessions).map(([employeeId, sessions]) => [
      employeeId,
      sessions[0]?.messages || [],
    ]),
  );

export const mockMateFiles: MateFile[] = [
  {
    id: 'f1',
    name: '2026 年员工手册.pdf',
    category: '人事制度',
    size: '2.4 MB',
    owner: '韩立',
    updatedAt: '今天 09:18',
    status: 'ready',
  },
  {
    id: 'f2',
    name: 'Q2 采购框架合同.docx',
    category: '合同资料',
    size: '846 KB',
    owner: '李然',
    updatedAt: '昨天 18:42',
    status: 'ready',
  },
  {
    id: 'f3',
    name: '运营周报 2026-W32.xlsx',
    category: '经营数据',
    size: '1.2 MB',
    owner: '张立',
    updatedAt: '昨天 16:20',
    status: 'processing',
  },
  {
    id: 'f4',
    name: '客户访谈纪要.zip',
    category: '会议资料',
    size: '18.6 MB',
    owner: '小曼',
    updatedAt: '周一 14:06',
    status: 'ready',
  },
  {
    id: 'f5',
    name: '品牌素材清单.pptx',
    category: '内容资产',
    size: '4.8 MB',
    owner: 'Chloe',
    updatedAt: '周一 10:30',
    status: 'failed',
  },
];

export const mockMateAutomationTasks: MateAutomationTask[] = [
  {
    id: 'a1',
    title: '每日运营简报',
    description: '自动整理前一天的业务指标并生成早会简报。',
    schedule: '工作日 08:30',
    employeeId: 'weekly-analysis',
    status: 'enabled',
    lastRun: '今天 08:30',
    nextRun: '明天 08:30',
    successRate: 98,
  },
  {
    id: 'a2',
    title: '新员工入职提醒',
    description: '检查入职清单并向负责人发送待办提醒。',
    schedule: '每天 09:00',
    employeeId: 'weekly-assistant',
    status: 'running',
    lastRun: '今天 09:00',
    nextRun: '明天 09:00',
    successRate: 100,
  },
  {
    id: 'a3',
    title: '合同到期扫描',
    description: '扫描合同资料，识别未来 30 天内的到期风险。',
    schedule: '每周一 10:00',
    employeeId: 'weekly-review',
    status: 'enabled',
    lastRun: '周一 10:00',
    nextRun: '下周一 10:00',
    successRate: 96,
  },
  {
    id: 'a4',
    title: '内容发布检查',
    description: '检查待发布内容的素材和审批状态。',
    schedule: '每天 17:30',
    employeeId: 'weekly-analysis',
    status: 'disabled',
    lastRun: '昨天 17:30',
    nextRun: '未安排',
    successRate: 91,
  },
];

export const mockMateLogs: MateAutomationLog[] = [
  {
    id: 'l1',
    taskId: 'a1',
    taskTitle: '每日运营简报',
    status: 'success',
    startedAt: '今天 08:30',
    duration: '42 秒',
    summary: '已生成运营简报并发送至工作群。',
  },
  {
    id: 'l2',
    taskId: 'a2',
    taskTitle: '新员工入职提醒',
    status: 'success',
    startedAt: '今天 09:00',
    duration: '18 秒',
    summary: '发现 2 项待处理事项，已提醒相关负责人。',
  },
  {
    id: 'l3',
    taskId: 'a3',
    taskTitle: '合同到期扫描',
    status: 'failed',
    startedAt: '周一 10:00',
    duration: '1 分 06 秒',
    summary: '部分文件无法读取，建议检查文件权限后重试。',
  },
];

export function mockDelay(ms = 180) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
