import type {
  AcceptGuideAdvice,
  AiBackgroundAnalysis,
  AiTicketSummary,
  AiUnderstandingItem,
  Asset,
  AssetCategory,
  AssignmentAiSuggestion,
  AssignmentPolicy,
  AssignmentRule,
  ChatMsg,
  CockpitScenario,
  DocumentParseResult,
  FieldAiSuggestion,
  FlowEdge,
  FlowGraph,
  FlowNode,
  KnowledgeArticle,
  OpsStaff,
  PlatformActionEvent,
  SchemaFieldDef,
  SlaAiSuggestion,
  SlaConfig,
  SlaEmailTemplate,
  SlaPolicy,
  StatusFlowAiSuggestion,
  SubTaskTemplate,
  TicketAction,
  TicketAiAdvisor,
  TicketAttachment,
  TicketDevice,
  TicketFieldType,
  TicketOverviewStats,
  TicketScenario,
  TicketSchema,
  TripCompletion,
  TripOrder,
  WorkOrder,
} from '#/types/ticket';

import { reactive } from 'vue';

/** 当前登录用户（与 Mate 用户端 shell 保持一致） */
export const CURRENT_USER = {
  id: 'u-wangankang',
  name: '王安康',
};

/** 工程师池（用于派单/转派） */
export const engineers = [
  {
    id: 'e-liwei',
    name: '李伟',
    role: '高级现场工程师',
    team: '华东交付组',
    area: '上海 / 苏州 / 无锡',
    workload: 3,
  },
  {
    id: 'e-zhangmin',
    name: '张敏',
    role: '现场工程师',
    team: '华东交付组',
    area: '上海 / 杭州 / 宁波',
    workload: 5,
  },
  {
    id: 'e-chenyu',
    name: '陈宇',
    role: '远程支持工程师',
    team: '远程支持组',
    area: '远程支持（全国）',
    workload: 2,
  },
  {
    id: 'e-sunhao',
    name: '孙浩',
    role: '高级现场工程师',
    team: '华北交付组',
    area: '北京 / 济南 / 天津',
    workload: 4,
  },
  {
    id: 'e-zhouqi',
    name: '周齐',
    role: '现场工程师',
    team: '华南交付组',
    area: '深圳 / 广州 / 宁德',
    workload: 1,
  },
  {
    id: 'e-wangankang',
    name: '王安康',
    role: '一线工程师',
    team: '华东交付组',
    area: '上海 / 苏州 / 南京',
    workload: 2,
  },
];

export const mockDevices: TicketDevice[] = [
  {
    id: 'd-1001',
    code: 'EQ-1001',
    name: '智能打印终端 A1',
    model: 'PrintMax-X3',
    category: '打印设备',
    customer: '华达智能打印',
    customerLevel: 'VIP',
    location: '上海·华达工厂 1 号车间',
    status: 'fault',
    warrantyStatus: 'in-warranty',
    warrantyExpiry: '2026-12-31',
    warrantyStartDate: '2025-03-12',
    warrantyEndDate: '2026-12-31',
    warrantyDescription: '原厂一年质保，含上门维修与备件更换',
    installDate: '2025-03-12',
    lastMaintenance: '2026-07-20',
  },
  {
    id: 'd-1002',
    code: 'EQ-1002',
    name: '自动贴标机 B2',
    model: 'LabelBot-Pro',
    category: '包装设备',
    customer: '中粮包装',
    customerLevel: '重要',
    location: '苏州·中粮工厂 2 号线',
    status: 'normal',
    warrantyStatus: 'expiring',
    warrantyExpiry: '2026-09-15',
    warrantyStartDate: '2024-11-08',
    warrantyEndDate: '2026-09-15',
    warrantyDescription: '一年质保即将到期，建议续签延保服务',
    installDate: '2024-11-08',
    lastMaintenance: '2026-08-01',
  },
  {
    id: 'd-1003',
    code: 'EQ-1003',
    name: '激光喷码机 C3',
    model: 'LaserMark-900',
    category: '标识设备',
    customer: '辉承传热技术',
    customerLevel: '普通',
    location: '济南·辉承车间',
    status: 'maintenance',
    warrantyStatus: 'expired',
    warrantyExpiry: '2026-01-20',
    warrantyStartDate: '2025-06-21',
    warrantyEndDate: '2026-01-20',
    warrantyDescription: '质保已过期，维修费用按标准服务套餐计费',
    installDate: '2025-06-21',
    lastMaintenance: '2026-08-10',
  },
  {
    id: 'd-1004',
    code: 'EQ-1004',
    name: '智能检测相机 D4',
    model: 'VisionCam-V2',
    category: '检测设备',
    customer: '宁德部件',
    customerLevel: 'VIP',
    location: '宁德·部件工厂',
    status: 'fault',
    warrantyStatus: 'in-warranty',
    warrantyExpiry: '2027-03-30',
    warrantyStartDate: '2025-09-30',
    warrantyEndDate: '2027-03-30',
    warrantyDescription: 'VIP 客户延长保修，含 4 小时现场响应',
    installDate: '2025-09-30',
    lastMaintenance: '2026-07-05',
  },
  {
    id: 'd-1005',
    code: 'EQ-1005',
    name: '自动封箱机 E5',
    model: 'BoxSeal-3000',
    category: '包装设备',
    customer: '中粮包装',
    customerLevel: '重要',
    location: '苏州·中粮工厂 1 号线',
    status: 'offline',
    warrantyStatus: 'expired',
    warrantyExpiry: '2025-08-14',
    warrantyStartDate: '2024-08-14',
    warrantyEndDate: '2025-08-14',
    warrantyDescription: '质保已过期，设备长期离线待处理',
    installDate: '2024-08-14',
    lastMaintenance: '2026-06-18',
  },
  {
    id: 'd-1006',
    code: 'EQ-1006',
    name: '热转印打印机 F6',
    model: 'ThermoPrint-T8',
    category: '打印设备',
    customer: '华达智能打印',
    customerLevel: 'VIP',
    location: '上海·华达工厂 2 号车间',
    status: 'normal',
    warrantyStatus: 'in-warranty',
    warrantyExpiry: '2026-12-31',
    warrantyStartDate: '2025-04-02',
    warrantyEndDate: '2026-12-31',
    warrantyDescription: '原厂一年质保，含上门维修与备件更换',
    installDate: '2025-04-02',
    lastMaintenance: '2026-08-08',
  },
];

// ==================== 资产分类（一级，自带字段 schema） ====================

export const mockAssetCategories: AssetCategory[] = [
  {
    id: 'cat-sold',
    name: '售出设备',
    description: '公司销售给客户的设备，运维工单关联此分类',
    builtin: true,
    lifecycleStates: ['normal', 'fault', 'maintenance', 'offline'],
    fieldDefs: [
      {
        id: 'fd-sold-model',
        key: 'model',
        label: '设备型号',
        valueType: 'text',
      },
      {
        id: 'fd-sold-device-category',
        key: 'deviceCategory',
        label: '设备类别',
        valueType: 'enum',
        options: ['打印设备', '包装设备', '标识设备', '检测设备'],
      },
      {
        id: 'fd-sold-customer',
        key: 'customer',
        label: '所属客户',
        valueType: 'text',
      },
      {
        id: 'fd-sold-customer-level',
        key: 'customerLevel',
        label: '客户等级',
        valueType: 'enum',
        options: ['VIP', '重要', '普通'],
      },
      {
        id: 'fd-sold-location',
        key: 'location',
        label: '安装位置',
        valueType: 'text',
      },
      {
        id: 'fd-sold-warranty-status',
        key: 'warrantyStatus',
        label: '质保状态',
        valueType: 'enum',
        options: ['in-warranty', 'expiring', 'expired'],
      },
      {
        id: 'fd-sold-warranty-start',
        key: 'warrantyStartDate',
        label: '质保起始日',
        valueType: 'date',
      },
      {
        id: 'fd-sold-warranty-end',
        key: 'warrantyEndDate',
        label: '质保到期日',
        valueType: 'date',
      },
      {
        id: 'fd-sold-warranty-desc',
        key: 'warrantyDescription',
        label: '质保说明',
        valueType: 'text',
      },
      {
        id: 'fd-sold-install-date',
        key: 'installDate',
        label: '安装日期',
        valueType: 'date',
      },
      {
        id: 'fd-sold-last-maintenance',
        key: 'lastMaintenance',
        label: '上次保养',
        valueType: 'date',
      },
    ],
  },
  {
    id: 'cat-it',
    name: '公司资产',
    description: '公司内部 IT 设备、办公设备与家具，IT 工单关联此分类',
    builtin: true,
    lifecycleStates: ['in-use', 'fault', 'scrapped'],
    fieldDefs: [
      { id: 'fd-it-model', key: 'model', label: '型号规格', valueType: 'text' },
      {
        id: 'fd-it-asset-tag',
        key: 'assetTag',
        label: '资产标签号',
        valueType: 'text',
      },
      {
        id: 'fd-it-category',
        key: 'assetCategory',
        label: '资产类别',
        valueType: 'enum',
        options: ['IT设备', '办公设备', '办公家具'],
      },
      {
        id: 'fd-it-department',
        key: 'departmentName',
        label: '所属部门',
        valueType: 'text',
      },
      { id: 'fd-it-user', key: 'userName', label: '使用人', valueType: 'text' },
      {
        id: 'fd-it-location',
        key: 'location',
        label: '存放位置',
        valueType: 'text',
      },
      {
        id: 'fd-it-purchase-date',
        key: 'purchaseDate',
        label: '采购日期',
        valueType: 'date',
      },
    ],
  },
  {
    id: 'cat-product',
    name: '产品模块',
    description: '公司产品的功能模块，产品需求工单关联此分类',
    builtin: true,
    lifecycleStates: ['online', 'gray', 'offline'],
    fieldDefs: [
      {
        id: 'fd-product-line',
        key: 'productLine',
        label: '所属产品线',
        valueType: 'text',
      },
      {
        id: 'fd-product-version',
        key: 'version',
        label: '版本号',
        valueType: 'text',
      },
      {
        id: 'fd-product-owner',
        key: 'owner',
        label: '产品负责人',
        valueType: 'text',
      },
    ],
  },
];

// ==================== 资产实例统一主档 ====================

/** 售出设备资产（从 mockDevices 映射，字段按 cat-sold schema 填充） */
const soldAssets: Asset[] = mockDevices.map((d) => ({
  id: d.id,
  code: d.code,
  name: d.name,
  categoryId: 'cat-sold',
  status: d.status,
  createdAt: d.installDate,
  updatedAt: d.lastMaintenance,
  extAttributes: {
    model: d.model,
    deviceCategory: d.category,
    customer: d.customer,
    customerLevel: d.customerLevel,
    location: d.location,
    warrantyStatus: d.warrantyStatus,
    warrantyStartDate: d.warrantyStartDate ?? '',
    warrantyEndDate: d.warrantyEndDate ?? d.warrantyExpiry ?? '',
    warrantyDescription: d.warrantyDescription ?? '',
    installDate: d.installDate,
    lastMaintenance: d.lastMaintenance,
  },
}));

/** 公司资产实例（IT 设备 / 办公设备） */
const itAssets: Asset[] = [
  {
    id: 'a-it-1',
    code: 'IT-2023-0089',
    name: 'ThinkPad X1 Carbon 笔记本',
    categoryId: 'cat-it',
    status: 'in-use',
    createdAt: '2023-05-10',
    updatedAt: '2026-06-20',
    extAttributes: {
      model: 'ThinkPad X1 Carbon Gen 11',
      assetTag: 'IT-2023-0089',
      assetCategory: 'IT设备',
      departmentName: 'IT 部',
      userName: '张敏',
      location: '上海总部 8F',
      purchaseDate: '2023-05-10',
    },
  },
  {
    id: 'a-it-2',
    code: 'IT-2022-0156',
    name: '戴尔 OptiPlex 7090 台式机',
    categoryId: 'cat-it',
    status: 'fault',
    createdAt: '2022-03-18',
    updatedAt: '2026-09-10',
    extAttributes: {
      model: 'Dell OptiPlex 7090',
      assetTag: 'IT-2022-0156',
      assetCategory: 'IT设备',
      departmentName: '财务部',
      userName: '李静',
      location: '上海总部 5F',
      purchaseDate: '2022-03-18',
    },
  },
  {
    id: 'a-it-3',
    code: 'OF-2021-0034',
    name: '佳能 iR2625 数码复合机',
    categoryId: 'cat-it',
    status: 'in-use',
    createdAt: '2021-09-02',
    updatedAt: '2026-04-15',
    extAttributes: {
      model: 'Canon iR2625',
      assetTag: 'OF-2021-0034',
      assetCategory: '办公设备',
      departmentName: '行政部',
      userName: '公共使用',
      location: '上海总部 3F 文印区',
      purchaseDate: '2021-09-02',
    },
  },
  {
    id: 'a-it-4',
    code: 'OF-2024-0212',
    name: '升降办公桌',
    categoryId: 'cat-it',
    status: 'in-use',
    createdAt: '2024-01-15',
    updatedAt: '2026-01-20',
    extAttributes: {
      model: '1.4m 双电机升降桌',
      assetTag: 'OF-2024-0212',
      assetCategory: '办公家具',
      departmentName: '产品部',
      userName: '陈思远',
      location: '上海总部 7F',
      purchaseDate: '2024-01-15',
    },
  },
];

/** 产品模块实例（产品需求工单关联对象） */
const productAssets: Asset[] = [
  {
    id: 'a-pm-1',
    code: 'PM-001',
    name: '工单中心·移动端',
    categoryId: 'cat-product',
    status: 'online',
    createdAt: '2025-06-01',
    updatedAt: '2026-08-15',
    extAttributes: {
      productLine: '知应工单',
      version: 'v2.4.1',
      owner: '陈思远',
    },
  },
  {
    id: 'a-pm-2',
    code: 'PM-002',
    name: '审核中心·规则引擎',
    categoryId: 'cat-product',
    status: 'gray',
    createdAt: '2026-02-10',
    updatedAt: '2026-09-01',
    extAttributes: {
      productLine: '智能审核',
      version: 'v1.0.3',
      owner: '林洁',
    },
  },
  {
    id: 'a-pm-3',
    code: 'PM-003',
    name: 'CRM·客户管理',
    categoryId: 'cat-product',
    status: 'offline',
    createdAt: '2024-11-20',
    updatedAt: '2026-07-30',
    extAttributes: {
      productLine: 'CRM',
      version: 'v3.1.0',
      owner: '王培',
    },
  },
];

/** 资产实例统一主档（售出设备 6 + 公司资产 4 + 产品模块 3） */
export const mockAssets: Asset[] = [
  ...soldAssets,
  ...itAssets,
  ...productAssets,
];

export const mockDispatchRules: AssignmentRule[] = [
  {
    id: 'r-1',
    name: '打印设备故障优先派单',
    code: 'DISPATCH-PRINT-01',
    condition: '设备类别 = 打印设备 且 故障等级 ≥ 中',
    targetMode: 'position',
    targetPosition: '高级现场工程师',
    target: '高级现场工程师',
    priority: 'high',
    deviceCategory: '打印设备',
    faultLevel: '中',
    enabled: true,
    hitCount: 42,
    source: 'ai',
    evidence: {
      confidence: '91%',
      source: '《设备维保服务管理制度 V3.0》· 6.2 派单规则',
      snippet:
        '打印设备发生故障且等级为中级及以上时，须优先指派高级现场工程师上门处理，并要求 2 小时内响应。',
    },
    trigger: 'enter-node',
    triggerNodeId: 'fn-1',
    candidateScope: { type: 'position', ids: [] },
    strategy: 'load-balance',
    rulePriority: 10,
    stopOnMatch: true,
    targetStatus: '待接单',
    confirmStatus: 'pending-review',
    conflictNote:
      '夜间（18:00 后）紧急打印设备工单也可能命中「夜间故障转值班工程师」，按顺序本规则先执行，命中后停止匹配',
  },
  {
    id: 'r-2',
    name: '检测设备故障远程优先',
    code: 'DISPATCH-REMOTE-01',
    condition: '设备类别 = 检测设备 且 客户等级 = VIP',
    targetMode: 'position',
    targetPosition: '远程支持工程师',
    target: '远程支持工程师',
    priority: 'urgent',
    deviceCategory: '检测设备',
    customerLevel: 'VIP',
    enabled: true,
    hitCount: 18,
    source: 'ai',
    evidence: {
      confidence: '87%',
      source: '《客户分级与服务策略管理办法》· 3.1 服务响应策略',
      snippet:
        'VIP 客户的检测设备故障优先采用远程支持方式处理，远程无法解决的再升级至现场工程师，确保 2 小时内首次响应。',
    },
    trigger: 'create',
    candidateScope: { type: 'position', ids: [] },
    strategy: 'load-balance',
    rulePriority: 20,
    stopOnMatch: true,
    targetStatus: '处理中',
    confirmStatus: 'pending-review',
  },
  {
    id: 'r-3',
    name: '同城工单就近派单',
    code: 'DISPATCH-NEARBY-01',
    condition: '设备所在地 = 上海 且 工程师同区域 且 负荷 < 5',
    targetMode: 'person',
    targetPersonId: 'e-liwei',
    target: '李伟（华东交付组）',
    priority: 'medium',
    deviceCategory: '通用设备',
    customerLevel: '重要',
    enabled: true,
    hitCount: 67,
    trigger: 'enter-node',
    triggerNodeId: 'fn-1',
    candidateScope: { type: 'person', ids: ['e-liwei'] },
    strategy: 'load-balance',
    rulePriority: 30,
    stopOnMatch: true,
    targetStatus: '待接单',
    confirmStatus: 'confirmed',
    confirmRecord: {
      by: '王安康',
      at: '2026-09-18 14:30',
      version: 'v1.2.0',
    },
  },
  {
    id: 'r-4',
    name: '包装设备按客户分组派单',
    code: 'DISPATCH-PACK-01',
    condition: '设备类别 = 包装设备',
    targetMode: 'position',
    targetPosition: '现场工程师',
    target: '现场工程师',
    priority: 'medium',
    deviceCategory: '包装设备',
    enabled: true,
    hitCount: 35,
    trigger: 'enter-node',
    triggerNodeId: 'fn-1',
    candidateScope: { type: 'position', ids: [] },
    strategy: 'round-robin',
    rulePriority: 40,
    stopOnMatch: true,
    targetStatus: '待接单',
    confirmStatus: 'confirmed',
    confirmRecord: {
      by: '王安康',
      at: '2026-09-18 14:35',
      version: 'v1.2.0',
    },
  },
  {
    id: 'r-5',
    name: '夜间故障转值班工程师',
    code: 'DISPATCH-NIGHT-01',
    condition: '受理时间 ≥ 18:00 或 节假日 且 等级 = 紧急',
    targetMode: 'person',
    targetPersonId: 'e-sunhao',
    target: '孙浩（华北交付组）',
    priority: 'urgent',
    faultLevel: '紧急',
    warrantyStatus: 'in-warranty',
    enabled: false,
    hitCount: 9,
    trigger: 'transfer',
    candidateScope: { type: 'person', ids: ['e-sunhao'] },
    strategy: 'load-balance',
    rulePriority: 50,
    stopOnMatch: true,
    targetStatus: '待接单',
    confirmStatus: 'confirmed',
    confirmRecord: {
      by: '李明哲',
      at: '2026-09-10 09:00',
      version: 'v1.1.0',
    },
  },
];

export const mockSlaConfigs: SlaConfig[] = [
  {
    id: 's-1',
    name: '紧急工单 SLA',
    priority: 'urgent',
    responseHours: 0.5,
    resolveHours: 4,
    penalty: '超时自动升级至交付负责人',
    faultLevel: '紧急',
    responseAlert: {
      enabled: true,
      delayMinutes: 0,
      targetPersonIds: ['e-liwei', 'e-sunhao'],
      channels: ['in-app', 'email', 'wecom'],
    },
    resolveAlert: {
      enabled: true,
      delayMinutes: 15,
      targetPersonIds: ['u-wangankang'],
      channels: ['in-app', 'email', 'wecom'],
    },
    alertChannels: ['in-app', 'email', 'wecom'],
    enabled: true,
    source: 'ai',
    evidence: {
      confidence: '90%',
      source: '《设备维保服务管理制度 V3.0》· 7.1 时限要求',
      snippet:
        '紧急故障须在 30 分钟内响应、4 小时内解决；响应超时立即升级通知交付负责人，处理超时 15 分钟触发二次提醒。',
    },
    startTiming: 'accept',
    confirmStatus: 'pending-review',
  },
  {
    id: 's-2',
    name: '高优先级 SLA',
    priority: 'high',
    responseHours: 2,
    resolveHours: 24,
    penalty: '超时触发主管提醒',
    deviceCategory: '检测设备',
    customerLevel: 'VIP',
    faultLevel: '高',
    responseAlert: {
      enabled: true,
      delayMinutes: 15,
      targetPersonIds: ['e-liwei'],
      channels: ['in-app', 'email'],
    },
    resolveAlert: {
      enabled: true,
      delayMinutes: 60,
      targetPersonIds: ['u-wangankang'],
      channels: ['in-app', 'wecom'],
    },
    alertChannels: ['in-app', 'email'],
    enabled: true,
    source: 'ai',
    evidence: {
      confidence: '86%',
      source: '《客户分级与服务策略管理办法》· 3.2 时效标准',
      snippet:
        '高优先级工单须在 2 小时内响应、24 小时内解决；响应超时 15 分钟提醒责任人，解决超时 60 分钟升级至主管。',
    },
    startTiming: 'accept',
    confirmStatus: 'confirmed',
    confirmRecord: {
      by: '王安康',
      at: '2026-09-20 11:20',
      version: 'v1.2.0',
    },
  },
  {
    id: 's-3',
    name: '中优先级 SLA',
    priority: 'medium',
    responseHours: 4,
    resolveHours: 72,
    penalty: '超时标记风险工单',
    faultLevel: '中',
    responseAlert: {
      enabled: true,
      delayMinutes: 30,
      targetPersonIds: ['e-zhangmin'],
      channels: ['in-app'],
    },
    resolveAlert: {
      enabled: false,
      delayMinutes: 120,
      targetPersonIds: [],
      channels: ['in-app'],
    },
    alertChannels: ['in-app'],
    enabled: true,
    startTiming: 'create',
    confirmStatus: 'confirmed',
    confirmRecord: {
      by: '王安康',
      at: '2026-09-12 16:40',
      version: 'v1.1.0',
    },
  },
  {
    id: 's-4',
    name: '低优先级 SLA',
    priority: 'low',
    responseHours: 8,
    resolveHours: 168,
    penalty: '纳入周报统计',
    faultLevel: '低',
    responseAlert: {
      enabled: false,
      delayMinutes: 60,
      targetPersonIds: [],
      channels: ['in-app'],
    },
    resolveAlert: {
      enabled: false,
      delayMinutes: 240,
      targetPersonIds: [],
      channels: ['in-app'],
    },
    alertChannels: ['in-app'],
    enabled: false,
  },
];

/** 工单运维人员（用于派单目标、SLA 告警通知对象） */
export const mockOpsStaff: OpsStaff[] = [
  {
    id: 'e-liwei',
    userId: 'u-1001',
    position: '高级现场工程师',
    area: '上海 / 苏州 / 无锡',
    workload: 3,
    status: 'on',
    enabled: true,
  },
  {
    id: 'e-zhangmin',
    userId: 'u-1002',
    position: '现场工程师',
    area: '上海 / 杭州 / 宁波',
    workload: 5,
    status: 'on',
    enabled: true,
  },
  {
    id: 'e-chenyu',
    userId: 'u-1003',
    position: '远程支持工程师',
    area: '远程支持（全国）',
    workload: 2,
    status: 'on',
    enabled: true,
  },
  {
    id: 'e-sunhao',
    userId: 'u-1004',
    position: '高级现场工程师',
    area: '北京 / 济南 / 天津',
    workload: 4,
    status: 'on',
    enabled: true,
  },
  {
    id: 'e-zhouqi',
    userId: 'u-1005',
    position: '现场工程师',
    area: '深圳 / 广州 / 宁德',
    workload: 1,
    status: 'rest',
    enabled: true,
  },
  {
    id: 'e-wangankang',
    userId: 'u-1006',
    position: '一线工程师',
    area: '上海 / 苏州 / 南京',
    workload: 2,
    status: 'on',
    enabled: true,
  },
];

/** 岗位可选值（派单目标按岗位时使用，自动从运维人员列表派生） */
export const positionOptions: string[] = [
  '高级现场工程师',
  '现场工程师',
  '远程支持工程师',
  '一线工程师',
];

/** 角色可选值（派单目标按角色时使用） */
export const roleOptions: Array<{ label: string; value: string }> = [
  { label: '一线技术支持', value: 'role-tier1-support' },
  { label: '二线技术支持', value: 'role-tier2-support' },
  { label: '客户经理', value: 'role-account-manager' },
  { label: '调度岗', value: 'role-dispatcher' },
  { label: '网络工程师', value: 'role-network-engineer' },
];

/** 可选用户列表（用于运维人员关联系统用户） */
export const userOptions: Array<{ label: string; value: string }> = [
  { label: '李伟（u-1001）', value: 'u-1001' },
  { label: '张敏（u-1002）', value: 'u-1002' },
  { label: '陈宇（u-1003）', value: 'u-1003' },
  { label: '孙浩（u-1004）', value: 'u-1004' },
  { label: '周齐（u-1005）', value: 'u-1005' },
  { label: '王安康（u-1006）', value: 'u-1006' },
  { label: '刘洋（u-1007）', value: 'u-1007' },
  { label: '赵磊（u-1008）', value: 'u-1008' },
];

/** 服务区域可选值 */
export const areaOptions: string[] = [
  '上海 / 苏州 / 无锡',
  '上海 / 杭州 / 宁波',
  '北京 / 济南 / 天津',
  '深圳 / 广州 / 宁德',
  '上海 / 苏州 / 南京',
  '成都 / 重庆 / 西安',
  '远程支持（全国）',
];

/** 预置故障附件：华达 A1 打印卷曲（售后客户提交） */
const attachmentsA1Roll: TicketAttachment[] = [
  {
    id: 'att-a1-1',
    name: '卷曲样品-正面.JPG',
    type: 'image',
    size: '2.4 MB',
    uploader: '王天豪',
    uploaderId: 'customer-wangtianhao',
    uploadedAt: '2026-08-15 09:45',
    note: '连续打印第 15 张样品，右侧边缘卷曲约 3mm',
  },
  {
    id: 'att-a1-2',
    name: '卷曲样品-侧面.JPG',
    type: 'image',
    size: '1.8 MB',
    uploader: '王天豪',
    uploaderId: 'customer-wangtianhao',
    uploadedAt: '2026-08-15 09:46',
    note: '侧面视角，可见打印后走纸轨道存在卡滞痕迹',
  },
  {
    id: 'att-a1-3',
    name: '设备报错截图.png',
    type: 'screenshot',
    size: '512 KB',
    uploader: '王天豪',
    uploaderId: 'customer-wangtianhao',
    uploadedAt: '2026-08-15 09:47',
    note: '屏幕提示「走纸张力异常」',
  },
];

/** 预置故障附件：中粮 E5 急停后无法复位 */
const attachmentsE5Stop: TicketAttachment[] = [
  {
    id: 'att-e5-1',
    name: '急停按键复位失败.MP4',
    type: 'video',
    size: '18.2 MB',
    uploader: '刘工',
    uploaderId: 'customer-liugong',
    uploadedAt: '2026-08-14 09:15',
    duration: '00:47',
    note: '现场演示急停按键回位后主继电器无响应',
  },
  {
    id: 'att-e5-2',
    name: '现场环境照片.jpg',
    type: 'image',
    size: '3.1 MB',
    uploader: '刘工',
    uploaderId: 'customer-liugong',
    uploadedAt: '2026-08-14 09:17',
    note: '中粮 3 号线封箱工位，设备周围无明显碰撞痕迹',
  },
  {
    id: 'att-e5-3',
    name: '王安康-现场诊断记录.docx',
    type: 'pdf',
    size: '680 KB',
    uploader: '王安康',
    uploaderId: 'u-wangankang',
    uploadedAt: '2026-08-14 15:20',
    note: '到达现场后 I/O 板检测 + 急停回路排查记录',
  },
];

/** 预置附件：宁德 D4 识别异常 */
const attachmentsD4Cam: TicketAttachment[] = [
  {
    id: 'att-d4-1',
    name: '识别失败样本-01.png',
    type: 'image',
    size: '960 KB',
    uploader: '陈主管',
    uploaderId: 'customer-chenzhuguan',
    uploadedAt: '2026-08-15 11:08',
    note: '合格品被误判为 NG，漏检出 3 件',
  },
  {
    id: 'att-d4-2',
    name: '光源参数对比截图.png',
    type: 'screenshot',
    size: '340 KB',
    uploader: '陈主管',
    uploaderId: 'customer-chenzhuguan',
    uploadedAt: '2026-08-15 11:10',
    note: '曝光参数近 1 周出现漂移',
  },
  {
    id: 'att-d4-3',
    name: '王安康-远程协助说明.m4a',
    type: 'audio',
    size: '2.2 MB',
    uploader: '王安康',
    uploaderId: 'u-wangankang',
    uploadedAt: '2026-08-15 11:45',
    duration: '03:10',
    note: '远程指导重启视觉服务 + 恢复出厂标定的操作录音',
  },
];

/** 预置附件：华达 F6 联机失败 */
const attachmentsF6Link: TicketAttachment[] = [
  {
    id: 'att-f6-1',
    name: 'MES 联机日志.txt',
    type: 'pdf',
    size: '120 KB',
    uploader: '王天豪',
    uploaderId: 'customer-wangtianhao',
    uploadedAt: '2026-08-14 14:35',
    note: '过去 24 小时联机状态日志，间断性报 502',
  },
  {
    id: 'att-f6-2',
    name: '网口指示灯.JPG',
    type: 'image',
    size: '760 KB',
    uploader: '王天豪',
    uploaderId: 'customer-wangtianhao',
    uploadedAt: '2026-08-14 14:37',
    note: '交换机侧网口黄灯闪烁异常',
  },
];

/** 预置附件：辉承 C3 保养（由我创建 / 李伟处理） */
const attachmentsC3Maintain: TicketAttachment[] = [
  {
    id: 'att-c3-1',
    name: '保养前光路功率测试表.jpg',
    type: 'image',
    size: '1.4 MB',
    uploader: '王安康',
    uploaderId: 'u-wangankang',
    uploadedAt: '2026-08-13 16:03',
    note: '创建工单时附带的上次保养遗留照片',
  },
  {
    id: 'att-c3-2',
    name: '现场保养视频.MP4',
    type: 'video',
    size: '42.6 MB',
    uploader: '李伟',
    uploaderId: 'e-liwei',
    uploadedAt: '2026-08-15 09:55',
    duration: '06:20',
    note: '镜头拆装 + 光路校准的完整过程',
  },
];

/** WO-20261004001 新版详情页演示故障附件（含 AI 识别结论） */
const scanDemoAttachments: TicketAttachment[] = [
  {
    id: 'att-scan-1',
    name: '卡纸图片-正面.jpg',
    type: 'image',
    size: '2.4 MB',
    uploader: '李店长',
    uploaderId: 'customer-lidianzhang',
    uploadedAt: '2025-10-04 09:46',
    note: '连续扫描第 15 张时卡纸，左边缘掉纸约 15mm，疑似进纸辊打滑。',
  },
  {
    id: 'att-scan-2',
    name: '扫描仪错误提示.png',
    type: 'screenshot',
    size: '860 KB',
    uploader: '李店长',
    uploaderId: 'customer-lidianzhang',
    uploadedAt: '2025-10-04 09:48',
    note: '面板报「E3 进纸错误」，与进纸组件异常的判断一致。',
  },
];

const rawMockWorkOrders: WorkOrder[] = [
  // ============ AI 驾驶舱演示工单（一句话报修 → AI 闭环处理演示） ============
  {
    id: 'wo-scan-demo',
    code: 'WO-20261004001',
    title: 'XX连锁门店高速扫描仪频繁卡纸',
    type: '设备故障',
    scenario: '维修工单',
    category: 'external',
    device: '高清文档扫描仪 DS-520（SN: DS520-0231）',
    customer: 'XX连锁门店',
    customerLocation: '上海市浦东新区 X 路 100 号 2F',
    contact: '李店长',
    phone: '137****6688',
    priority: 'high',
    status: 'dispatched',
    source: 'AI 工单助理',
    creator: '赵一鸣',
    creatorId: 'u-zhaoyiming',
    createdAt: '今天 09:41',
    deadline: '今天 18:00',
    slaStatus: 'normal',
    slaRemaining: '剩余 6 小时',
    assignee: '王安康',
    assigneeId: 'u-wangankang',
    description:
      'XX门店的高速扫描仪今天上午开始频繁卡纸，取出卡纸后继续扫描仍会卡纸，当前门店文档扫描录入无法正常进行。',
    flowGraphId: 'fg-ops-v3',
    currentNodeId: 'fn-2',
    attachments: scanDemoAttachments,
    timeline: [
      {
        id: 'tl-scan-demo-1',
        action: 'created',
        time: '今天 09:39',
        operator: '赵一鸣',
        operatorId: 'u-zhaoyiming',
        summary: '一句话描述问题，AI 自动整理生成工单',
      },
      {
        id: 'tl-scan-demo-2',
        action: 'dispatched',
        time: '今天 09:41',
        operator: 'AI 工单助理',
        operatorId: 'ai-ticket-assistant',
        summary:
          'AI 完成 30 天历史案例与原因分析，匹配「扫描设备卡纸」规则，派给客户经理王安康',
        extra: { assignee: '王安康' },
      },
    ],
  },
  // ============ 图片参考工单（6 条设备故障 / 维修工单场景） ============
  {
    id: 'wo-img-001',
    code: 'WO-20260929162805563',
    title: '打印机坏了测试数据',
    type: '设备故障',
    scenario: '维修工单',
    category: 'external',
    device: '熊猫集团-D5200P-南京-4',
    customer: '熊猫集团',
    contact: '熊猫集团·联系人',
    phone: '138****0001',
    priority: 'medium',
    status: 'dispatched',
    source: '售后客服',
    creator: '薛占彪',
    creatorId: 'u-xuezhanbiao',
    createdAt: '2026-09-29 16:28',
    deadline: '2026-10-02 16:28',
    slaStatus: 'normal',
    slaRemaining: '剩余 71 小时',
    assignee: '沈俊',
    assigneeId: 'u-shenjun',
    description: '客户反馈打印机故障，打印头不出墨，需现场排查更换。',
    flowGraphId: 'fg-ops-v3',
    currentNodeId: 'fn-2',
    attachments: [],
    timeline: [
      {
        id: 'tl-img-001-1',
        action: 'created',
        time: '2026-09-29 16:28',
        operator: '薛占彪',
        operatorId: 'u-xuezhanbiao',
        summary: '创建工单：熊猫集团打印机故障报修',
      },
      {
        id: 'tl-img-001-2',
        action: 'dispatched',
        time: '2026-09-29 16:30',
        operator: '派单助理',
        operatorId: 'ai-dispatch-assistant',
        summary: '按区域匹配派单给沈俊（南京）',
        extra: { assignee: '沈俊' },
      },
    ],
  },
  {
    id: 'wo-img-002',
    code: 'WO-20260922171433668',
    title: '中车电机轨道单据不齐',
    type: '设备故障',
    scenario: '维修工单',
    category: 'external',
    device: '中车电机-D5200-株洲-1',
    customer: '中车电机',
    contact: '中车电机·联系人',
    phone: '139****0002',
    priority: 'urgent',
    status: 'dispatched',
    source: '售后客服',
    creator: '李常华',
    creatorId: 'u-lichanghua',
    createdAt: '2026-09-22 17:14',
    deadline: '2026-09-23 17:14',
    slaStatus: 'breached',
    slaRemaining: '已超时 95 小时',
    assignee: '苏冠宇',
    assigneeId: 'u-suguanyu',
    description: '现场作业单据不齐，轨道设备疑似异常需重新核查。',
    flowGraphId: 'fg-ops-v3',
    currentNodeId: 'fn-2',
    attachments: [],
    timeline: [
      {
        id: 'tl-img-002-1',
        action: 'created',
        time: '2026-09-22 17:14',
        operator: '李常华',
        operatorId: 'u-lichanghua',
        summary: '创建工单，派单给苏冠宇',
      },
    ],
  },
  {
    id: 'wo-img-003',
    code: 'WO-20260922164254499',
    title: '鲁西化工1号柜单据不齐',
    type: '设备故障',
    scenario: '维修工单',
    category: 'external',
    device: '鲁西化工-D5200-聊城-1',
    customer: '鲁西化工',
    contact: '鲁西化工·联系人',
    phone: '137****0003',
    priority: 'low',
    status: 'completed',
    source: '售后客服',
    creator: '李常华',
    creatorId: 'u-lichanghua',
    createdAt: '2026-09-22 16:42',
    deadline: '2026-09-25 16:42',
    slaStatus: 'normal',
    slaRemaining: '已完成',
    completedAt: '2026-09-23 09:00',
    description: '现场核查单据不齐，无实际故障，完成说明并归档。',
    flowGraphId: 'fg-ops-v3',
    currentNodeId: 'fn-8',
    attachments: [],
    timeline: [
      {
        id: 'tl-img-003-1',
        action: 'created',
        time: '2026-09-22 16:42',
        operator: '李常华',
        operatorId: 'u-lichanghua',
        summary: '创建工单',
      },
      {
        id: 'tl-img-003-2',
        action: 'completed',
        time: '2026-09-23 09:00',
        operator: '王圣瑞',
        operatorId: 'u-wangshengrui',
        summary: '现场核查无实际故障，说明归档后完成',
      },
    ],
  },
  {
    id: 'wo-img-004',
    code: 'WO-20260922163300866',
    title: '苏美达大厦13楼单据掉落',
    type: '设备故障',
    scenario: '维修工单',
    category: 'external',
    device: '苏美达-D5200P-南京-3',
    customer: '苏美达',
    contact: '苏美达·联系人',
    phone: '136****0004',
    priority: 'urgent',
    status: 'processing',
    source: '售后客服',
    creator: '李常华',
    creatorId: 'u-lichanghua',
    createdAt: '2026-09-22 16:33',
    deadline: '2026-09-23 16:33',
    slaStatus: 'breached',
    slaRemaining: '已超时 95 小时',
    assignee: '沈俊',
    assigneeId: 'u-shenjun',
    description: '现场单据掉落，需紧急前往现场处理。',
    flowGraphId: 'fg-ops-v3',
    currentNodeId: 'fn-3',
    attachments: [],
    timeline: [
      {
        id: 'tl-img-004-1',
        action: 'created',
        time: '2026-09-22 16:33',
        operator: '李常华',
        operatorId: 'u-lichanghua',
        summary: '创建工单，派单给沈俊',
      },
      {
        id: 'tl-img-004-2',
        action: 'started',
        time: '2026-09-22 17:00',
        operator: '沈俊',
        operatorId: 'u-shenjun',
        summary: '已接单前往现场',
      },
    ],
  },
  {
    id: 'wo-img-005',
    code: 'WO-20260922160741775',
    title: '山东港4董家口航运-内置',
    type: '设备故障',
    scenario: '维修工单',
    category: 'external',
    device: '山东港-D5200P-青岛-4',
    customer: '山东港',
    contact: '山东港·联系人',
    phone: '135****0005',
    priority: 'high',
    status: 'dispatched',
    source: '售后客服',
    creator: '李常华',
    creatorId: 'u-lichanghua',
    createdAt: '2026-09-22 16:07',
    deadline: '2026-09-23 16:07',
    slaStatus: 'breached',
    slaRemaining: '已超时 96 小时',
    assignee: '王圣瑞',
    assigneeId: 'u-wangshengrui',
    description: '客户航运设备内置模块故障，需现场更换。',
    flowGraphId: 'fg-ops-v3',
    currentNodeId: 'fn-2',
    attachments: [],
    timeline: [
      {
        id: 'tl-img-005-1',
        action: 'created',
        time: '2026-09-22 16:07',
        operator: '李常华',
        operatorId: 'u-lichanghua',
        summary: '创建工单，派单给王圣瑞（青岛）',
      },
    ],
  },
  {
    id: 'wo-img-006',
    code: 'WO-20260922155841695',
    title: '东风技术中心2号柜内部',
    type: '设备故障',
    scenario: '维修工单',
    category: 'external',
    device: '东风汽车-D5200-武汉-2',
    customer: '东风汽车',
    contact: '东风汽车·联系人',
    phone: '133****0006',
    priority: 'high',
    status: 'dispatched',
    source: '售后客服',
    creator: '李常华',
    creatorId: 'u-lichanghua',
    createdAt: '2026-09-22 15:58',
    deadline: '2026-09-23 15:58',
    slaStatus: 'breached',
    slaRemaining: '已超时 96 小时',
    assignee: '张利刚',
    assigneeId: 'u-zhangligang',
    description: '技术中心2号控制柜内部元件损坏，需现场排查。',
    flowGraphId: 'fg-ops-v3',
    currentNodeId: 'fn-2',
    attachments: [],
    timeline: [
      {
        id: 'tl-img-006-1',
        action: 'created',
        time: '2026-09-22 15:58',
        operator: '李常华',
        operatorId: 'u-lichanghua',
        summary: '创建工单，派单给张利刚（武汉）',
      },
    ],
  },
  // ============ 存量工单 ============
  {
    id: 'wo-2026-1001',
    code: 'WO-2026-1001',
    title: '华达打印终端 A1 打印卷曲问题',
    type: '设备故障',
    scenario: '运维工单',
    category: 'external',
    device: '智能打印终端 A1 (EQ-1001)',
    customer: '华达智能打印',
    customerLocation: '上海·浦东新区',
    contact: '王天豪',
    phone: '138****2104',
    priority: 'high',
    status: 'dispatched',
    source: '售后客服',
    creator: '售后客服(王天豪)',
    creatorId: 'customer-wangtianhao',
    createdAt: '2026-08-15 09:42',
    deadline: '2026-08-16 09:42',
    slaStatus: 'warning',
    slaRemaining: '剩余 3 小时',
    onSiteRequired: true,
    onSiteDecisionBy: '李铭',
    onSiteDecisionAt: '2026-08-15 10:00',
    assignee: '王安康',
    assigneeId: 'u-wangankang',
    flowGraphId: 'fg-ops-v3',
    currentNodeId: 'fn-2',
    description:
      '现场反馈打印出来的样品出现卷曲，已尝试更换耗材未解决，疑似打印参数异常。',
    attachments: attachmentsA1Roll,
  },
  {
    id: 'wo-2026-1002',
    code: 'WO-2026-1002',
    title: '中粮自动贴标机 B2 标签偏移',
    type: '设备故障',
    scenario: '运维工单',
    flowGraphId: 'fg-ops-v3',
    currentNodeId: 'fn-2',
    category: 'external',
    device: '自动贴标机 B2 (EQ-1002)',
    customer: '中粮包装',
    contact: '刘工',
    phone: '139****7720',
    priority: 'medium',
    status: 'dispatched',
    source: '售后客服',
    creator: '售后客服(刘工)',
    creatorId: 'customer-liugong',
    assignee: '王安康',
    assigneeId: 'u-wangankang',
    createdAt: '2026-08-15 10:18',
    deadline: '2026-08-18 10:18',
    slaStatus: 'normal',
    slaRemaining: '剩余 47 小时',
    description: '贴标位置出现 2-3mm 偏移，影响产线良率。',
    attachments: [
      {
        id: 'att-b2-1',
        name: '贴标偏移样品.jpg',
        type: 'image',
        size: '1.2 MB',
        uploader: '刘工',
        uploaderId: 'customer-liugong',
        uploadedAt: '2026-08-15 10:21',
        note: '左偏移约 2.5mm',
      },
    ],
  },
  {
    id: 'wo-2026-1003',
    code: 'WO-2026-1003',
    title: '宁德检测相机 D4 图像识别异常',
    type: '设备故障',
    scenario: '运维工单',
    category: 'external',
    device: '智能检测相机 D4 (EQ-1004)',
    customer: '宁德部件',
    contact: '陈主管',
    phone: '137****0091',
    priority: 'urgent',
    status: 'processing',
    source: '巡检告警',
    creator: '巡检系统',
    creatorId: 'system-inspect',
    createdAt: '2026-08-15 11:02',
    deadline: '2026-08-15 15:02',
    slaStatus: 'warning',
    slaRemaining: '剩余 1 小时 20 分',
    assignee: '王安康',
    assigneeId: 'u-wangankang',
    description: '检测相机偶发性识别失败，已重启 2 次仍复现，需现场排查。',
    flowGraphId: 'fg-ops-v3',
    currentNodeId: 'fn-3',
    attachments: attachmentsD4Cam,
    timeline: [
      {
        id: 'tl-1003-1',
        action: 'created',
        time: '2026-08-15 11:02',
        operator: '巡检系统',
        operatorId: 'system-inspect',
        summary: '巡检触发告警，自动生成报修工单',
      },
      {
        id: 'tl-1003-2',
        action: 'dispatched',
        time: '2026-08-15 11:05',
        operator: '派单助理',
        operatorId: 'ai-dispatch-assistant',
        summary: '按紧急度与技能匹配，派单给一线工程师 王安康',
        extra: { assignee: '王安康' },
      },
      {
        id: 'tl-1003-3',
        action: 'started',
        time: '2026-08-15 11:20',
        operator: '王安康',
        operatorId: 'u-wangankang',
        summary: '王安康 已接单，前往宁德现场排查',
      },
    ],
    checkInRecords: [
      {
        id: 'cin-1003-1',
        person: '李伟',
        personId: 'e-liwei',
        time: '2026-09-22 08:42',
        location: '宁德部件 1 号厂房 · 检测相机 D4 工位',
        photoUrl: '/auditdemo/mock/checkin-d4.jpg',
        note: '现场到岗，对接陈主管',
      },
    ],
  },
  {
    id: 'wo-2026-1004',
    code: 'WO-2026-1004',
    title: '华达热转印打印机 F6 联机失败',
    type: '设备故障',
    scenario: '运维工单',
    category: 'external',
    device: '热转印打印机 F6 (EQ-1006)',
    customer: '华达智能打印',
    contact: '王天豪',
    phone: '138****2104',
    priority: 'medium',
    status: 'dispatched',
    source: '售后客服',
    creator: '售后客服(王天豪)',
    creatorId: 'customer-wangtianhao',
    createdAt: '2026-08-14 14:30',
    deadline: '2026-08-17 14:30',
    slaStatus: 'normal',
    slaRemaining: '剩余 28 小时',
    assignee: '王安康',
    assigneeId: 'u-wangankang',
    description: '设备与产线 MES 联机失败，已远程指导未解决，需现场处理。',
    flowGraphId: 'fg-ops-v3',
    currentNodeId: 'fn-2',
    attachments: attachmentsF6Link,
    timeline: [
      {
        id: 'tl-1004-1',
        action: 'created',
        time: '2026-08-14 14:30',
        operator: '售后客服(王天豪)',
        operatorId: 'customer-wangtianhao',
        summary: '客户 王天豪 经售后客服引导式收集后提交报修',
      },
      {
        id: 'tl-1004-2',
        action: 'dispatched',
        time: '2026-08-14 15:10',
        operator: '派单助理',
        operatorId: 'ai-dispatch-assistant',
        summary: '派单至一线工程师 王安康（华东交付组）',
        extra: { assignee: '王安康' },
      },
    ],
  },
  {
    id: 'wo-2026-1005',
    code: 'WO-2026-1005',
    title: '辉承激光喷码机 C3 定期保养',
    type: '定期保养',
    scenario: '运维工单',
    category: 'internal',
    device: '激光喷码机 C3 (EQ-1003)',
    customer: '辉承传热技术',
    contact: '赵经理',
    phone: '136****5512',
    priority: 'low',
    status: 'dispatched',
    source: '保养计划',
    creator: '王安康',
    creatorId: 'u-wangankang',
    createdAt: '2026-08-13 16:00',
    deadline: '2026-08-20 16:00',
    slaStatus: 'normal',
    slaRemaining: '剩余 4 天',
    assignee: '李伟',
    assigneeId: 'e-liwei',
    description: '按保养计划执行季度保养与光路校准。',
    flowGraphId: 'fg-ops-v3',
    currentNodeId: 'fn-2',
    attachments: attachmentsC3Maintain,
  },
  {
    id: 'wo-2026-1012',
    code: 'WO-2026-1012',
    title: '华达 A1 打印样品卷曲待处理',
    type: '设备故障',
    scenario: '运维工单',
    category: 'internal',
    device: '智能打印终端 A1 (EQ-1001)',
    customer: '华达智能打印',
    contact: '王天豪',
    phone: '138****2104',
    priority: 'high',
    status: 'dispatched',
    source: '售后客服',
    creator: '王安康',
    creatorId: 'u-wangankang',
    assignee: '王安康',
    assigneeId: 'u-wangankang',
    createdAt: '2026-08-15 09:42',
    deadline: '2026-08-16 09:42',
    slaStatus: 'warning',
    slaRemaining: '剩余 3 小时',
    description:
      '现场反馈打印出来的样品出现卷曲，已尝试更换耗材未解决，疑似打印参数异常，已派单待接单。',
    flowGraphId: 'fg-ops-v3',
    currentNodeId: 'fn-2',
    attachments: [],
    timeline: [
      {
        id: 'tl-1012-1',
        action: 'created',
        time: '2026-08-15 09:42',
        operator: '王安康',
        operatorId: 'u-wangankang',
        summary: '王安康 通过售后客服提交报修，等待派单',
      },
    ],
  },
  {
    id: 'wo-2026-1006',
    code: 'WO-2026-1006',
    title: '中粮封箱机 E5 急停故障',
    type: '设备故障',
    scenario: '运维工单',
    category: 'external',
    device: '自动封箱机 E5 (EQ-1005)',
    customer: '中粮包装',
    contact: '刘工',
    phone: '139****7720',
    priority: 'high',
    status: 'processing',
    source: '售后客服',
    creator: '售后客服(刘工)',
    creatorId: 'customer-liugong',
    createdAt: '2026-08-14 09:10',
    deadline: '2026-08-15 09:10',
    slaStatus: 'breached',
    slaRemaining: '已超时 2 小时',
    assignee: '王安康',
    assigneeId: 'u-wangankang',
    description: '封箱机急停后无法复位，产线已停机，影响交付。',
    flowGraphId: 'fg-ops-v3',
    currentNodeId: 'fn-3',
    attachments: attachmentsE5Stop,
    timeline: [
      {
        id: 'tl-1006-1',
        action: 'created',
        time: '2026-08-14 09:10',
        operator: '售后客服(刘工)',
        operatorId: 'customer-liugong',
        summary: '客户 刘工 通过售后客服提交报修，产线已停机',
      },
      {
        id: 'tl-1006-2',
        action: 'dispatched',
        time: '2026-08-14 09:20',
        operator: '派单助理',
        operatorId: 'ai-dispatch-assistant',
        summary: '按高优先级派单给 王安康',
        extra: { assignee: '王安康' },
      },
      {
        id: 'tl-1006-3',
        action: 'started',
        time: '2026-08-14 10:30',
        operator: '王安康',
        operatorId: 'u-wangankang',
        summary: '已抵达中粮现场，初查急停回路异常，准备备件更换',
      },
    ],
    checkInRecords: [
      {
        id: 'cin-1006-1',
        person: '李伟',
        personId: 'e-liwei',
        time: '2026-09-22 10:18',
        location: '中粮包装 2 号车间 · 封箱机 E5 工位',
        photoUrl: '/auditdemo/mock/checkin-e5.jpg',
        note: '产线停机中，与刘工现场确认故障现象',
      },
    ],
  },
  {
    id: 'wo-2026-1007',
    code: 'WO-2026-1007',
    title: '华达 A1 设备参数调优咨询',
    type: '技术咨询',
    scenario: '需求工单',
    category: 'internal',
    device: '智能打印终端 A1 (EQ-1001)',
    customer: '华达智能打印',
    contact: '王天豪',
    phone: '138****2104',
    priority: 'low',
    status: 'processing',
    source: '工单助理',
    creator: '王安康',
    creatorId: 'u-wangankang',
    createdAt: '2026-08-12 13:20',
    deadline: '2026-08-19 13:20',
    slaStatus: 'normal',
    slaRemaining: '剩余 3 天',
    assignee: '王安康',
    assigneeId: 'u-wangankang',
    description: '客户咨询不同耗材下的推荐打印参数组合。',
    attachments: [
      {
        id: 'att-a1-4',
        name: '客户参数对比表.xlsx',
        type: 'pdf',
        size: '88 KB',
        uploader: '王安康',
        uploaderId: 'u-wangankang',
        uploadedAt: '2026-08-12 13:25',
        note: '不同温度/速度组合下的卷曲/精度表现',
      },
    ],
    timeline: [
      {
        id: 'tl-1007-1',
        action: 'created',
        time: '2026-08-12 13:20',
        operator: '王安康',
        operatorId: 'u-wangankang',
        summary: '通过工单助理建单，整理客户参数咨询需求',
      },
      {
        id: 'tl-1007-2',
        action: 'dispatched',
        time: '2026-08-12 13:20',
        operator: '派单助理',
        operatorId: 'ai-dispatch-assistant',
        summary: '因由工程师本人建单，自动分派给 王安康',
        extra: { assignee: '王安康' },
      },
      {
        id: 'tl-1007-3',
        action: 'started',
        time: '2026-08-12 14:00',
        operator: '王安康',
        operatorId: 'u-wangankang',
        summary: '已开始对接华达技术组，准备参数组合建议',
      },
    ],
  },
  {
    id: 'wo-2026-1008',
    code: 'WO-2026-1008',
    title: '宁德 D4 相机镜头更换',
    type: '备件更换',
    scenario: '运维工单',
    category: 'internal',
    device: '智能检测相机 D4 (EQ-1004)',
    customer: '宁德部件',
    customerLocation: '宁德·蕉城区',
    contact: '陈主管',
    phone: '137****0091',
    priority: 'medium',
    status: 'pending-acceptance',
    source: '工单助理',
    creator: '王安康',
    creatorId: 'u-wangankang',
    createdAt: '2026-08-10 10:00',
    deadline: '2026-08-13 10:00',
    slaStatus: 'normal',
    slaRemaining: '待客户验收',
    assignee: '王安康',
    assigneeId: 'u-wangankang',
    onSiteRequired: true,
    onSiteDecisionBy: '王安康',
    onSiteDecisionAt: '2026-08-10 10:30',
    description: '现场更换检测相机镜头并完成标定，等待客户验收确认。',
    flowGraphId: 'fg-ops-v3',
    currentNodeId: 'fn-6',
    attachments: [
      {
        id: 'att-d4-4',
        name: '镜头更换前后标定对比.JPG',
        type: 'image',
        size: '2.6 MB',
        uploader: '王安康',
        uploaderId: 'u-wangankang',
        uploadedAt: '2026-08-11 17:40',
        note: '更换后精度从 ±0.05mm 提升到 ±0.02mm',
      },
      {
        id: 'att-d4-5',
        name: '更换工单签字单.pdf',
        type: 'pdf',
        size: '1.1 MB',
        uploader: '王安康',
        uploaderId: 'u-wangankang',
        uploadedAt: '2026-08-11 17:45',
        note: '客户现场签字确认单扫描件',
      },
    ],
    solution:
      '1. 现场排查确认镜头组镜片划伤导致成像模糊；\n2. 使用备件库原厂镜头（型号 VisionCam-V2-Lens）进行更换；\n3. 重新执行九点标定与白平衡校准；\n4. 连续运行 2 小时复测，识别成功率从 78% 提升至 99.6%；\n5. 客户现场签字确认，进入待验收。',
    completedAt: '2026-08-11 17:50',
    acceptanceAttachments: [
      {
        id: 'att-d4-acc-1',
        name: '复测视频-连续识别.mp4',
        type: 'video',
        size: '18.4 MB',
        uploader: '王安康',
        uploaderId: 'u-wangankang',
        uploadedAt: '2026-08-11 17:48',
        duration: '00:42',
        note: '更换后连续运行 2 小时的识别录像，0 次失败',
      },
      {
        id: 'att-d4-acc-2',
        name: '标定结果截图.png',
        type: 'screenshot',
        size: '640 KB',
        uploader: '王安康',
        uploaderId: 'u-wangankang',
        uploadedAt: '2026-08-11 17:46',
        note: 'HMI 上标定通过画面，精度 ±0.02mm',
      },
    ],
  },
  {
    id: 'wo-2026-1009',
    code: 'WO-2026-1009',
    title: '华达 F6 联机问题复测',
    type: '现场复测',
    scenario: '上门工单',
    category: 'internal',
    device: '热转印打印机 F6 (EQ-1006)',
    customer: '华达智能打印',
    contact: '王天豪',
    phone: '138****2104',
    priority: 'medium',
    status: 'completed',
    source: '工单助理',
    creator: '王安康',
    creatorId: 'u-wangankang',
    createdAt: '2026-08-05 09:00',
    deadline: '2026-08-08 09:00',
    slaStatus: 'normal',
    slaRemaining: '已按时完成',
    assignee: '王安康',
    assigneeId: 'u-wangankang',
    description: '调整打印参数并更换耗材，连续打印 50 张未出现卷曲，复测通过。',
    checkInRecords: [
      {
        id: 'ci-1',
        person: '陈宇',
        personId: 'u-chen',
        time: '2026-08-15 14:30',
        location: '上海·华达工厂 1 号车间',
        photoUrl: '/mate/apps/ticket.svg',
        note: '到场打卡',
      },
    ],
    attachments: [
      {
        id: 'att-f6-3',
        name: '复测报告-客户签字.jpg',
        type: 'image',
        size: '820 KB',
        uploader: '王安康',
        uploaderId: 'u-wangankang',
        uploadedAt: '2026-08-08 11:05',
        note: '连续 50 张 0 故障，客户签字验收',
      },
    ],
  },
  {
    id: 'wo-2026-1010',
    code: 'WO-2026-1010',
    title: '辉承 C3 光路校准',
    type: '定期保养',
    scenario: '运维工单',
    category: 'internal',
    device: '激光喷码机 C3 (EQ-1003)',
    customer: '辉承传热技术',
    contact: '赵经理',
    phone: '136****5512',
    priority: 'low',
    status: 'completed',
    source: '保养计划',
    creator: '王安康',
    creatorId: 'u-wangankang',
    createdAt: '2026-08-01 14:00',
    deadline: '2026-08-04 14:00',
    slaStatus: 'normal',
    slaRemaining: '已按时完成',
    assignee: '张敏',
    assigneeId: 'e-zhangmin',
    description: '完成光路校准与功率测试，各项指标正常。',
    flowGraphId: 'fg-ops-v3',
    currentNodeId: 'fn-8',
    attachments: [
      {
        id: 'att-c3-3',
        name: '功率测试记录.pdf',
        type: 'pdf',
        size: '420 KB',
        uploader: '张敏',
        uploaderId: 'e-zhangmin',
        uploadedAt: '2026-08-04 15:20',
        note: '校准后功率偏差 < ±5%，满足合同要求',
      },
    ],
  },
  {
    id: 'wo-2026-1011',
    code: 'WO-2026-1011',
    title: '中粮 B2 贴标精度优化',
    type: '技术改进',
    scenario: '需求工单',
    category: 'external',
    device: '自动贴标机 B2 (EQ-1002)',
    customer: '中粮包装',
    contact: '刘工',
    phone: '139****7720',
    priority: 'medium',
    status: 'processing',
    source: '售后客服',
    creator: '售后客服(刘工)',
    creatorId: 'customer-liugong',
    createdAt: '2026-08-13 11:30',
    deadline: '2026-08-16 11:30',
    slaStatus: 'warning',
    slaRemaining: '剩余 6 小时',
    assignee: '王安康',
    assigneeId: 'u-wangankang',
    description: '远程协助调整贴标伺服参数，优化长期良率。',
    attachments: [
      {
        id: 'att-b2-2',
        name: '贴标伺服参数-前后对比.PNG',
        type: 'screenshot',
        size: '460 KB',
        uploader: '陈宇',
        uploaderId: 'e-chenyu',
        uploadedAt: '2026-08-14 20:00',
        note: '前：速度 220 张/分；后：速度 180 张/分 + 精度达标',
      },
    ],
  },
  // ============ 上门流程节点演示（fn-4 / fn-5 / fn-8 / fn-9 / fn-10） ============
  {
    id: 'wo-2026-1101',
    code: 'WO-2026-1101',
    title: '华达 A1 打印卷曲 · 待上门调度',
    type: '设备故障',
    scenario: '运维工单',
    category: 'external',
    device: '智能打印终端 A1 (EQ-1001)',
    customer: '华达智能打印',
    customerLocation: '上海·浦东新区',
    contact: '王天豪',
    phone: '138****2104',
    priority: 'high',
    status: 'pending-visit',
    source: '售后客服',
    creator: '售后客服(王天豪)',
    creatorId: 'customer-wangtianhao',
    createdAt: '2026-09-18 09:42',
    deadline: '2026-09-21 09:42',
    slaStatus: 'normal',
    slaRemaining: '剩余 3 天',
    assignee: '王安康',
    assigneeId: 'u-wangankang',
    onSiteRequired: true,
    onSiteDecisionBy: '王安康',
    onSiteDecisionAt: '2026-09-18 10:30',
    description:
      '已远程排查未解决，判定需上门更换加热模组。已申请上门，等待调度确认出发。',
    flowGraphId: 'fg-ops-v3',
    currentNodeId: 'fn-4',
    timeline: [
      {
        id: 'tl-1101-1',
        action: 'created',
        time: '2026-09-18 09:42',
        operator: '售后客服(王天豪)',
        operatorId: 'customer-wangtianhao',
        summary: '客户提交报修，自动派单给 王安康',
      },
      {
        id: 'tl-1101-2',
        action: 'started',
        time: '2026-09-18 10:15',
        operator: '王安康',
        operatorId: 'u-wangankang',
        summary: '已接单，远程排查后判定需现场更换加热模组',
      },
      {
        id: 'tl-1101-3',
        action: 'completed',
        time: '2026-09-18 10:30',
        operator: '王安康',
        operatorId: 'u-wangankang',
        summary: '申请上门，工单进入「待上门调度」，等待调度安排',
      },
    ],
  },
  {
    id: 'wo-2026-1102',
    code: 'WO-2026-1102',
    title: '中粮 B2 贴标偏移 · 上门处理中',
    type: '设备故障',
    scenario: '运维工单',
    category: 'external',
    device: '自动贴标机 B2 (EQ-1002)',
    customer: '中粮包装',
    customerLocation: '上海·松江区',
    contact: '刘工',
    phone: '139****7720',
    priority: 'medium',
    status: 'onsite-processing',
    source: '售后客服',
    creator: '售后客服(刘工)',
    creatorId: 'customer-liugong',
    createdAt: '2026-09-17 14:00',
    deadline: '2026-09-20 14:00',
    slaStatus: 'normal',
    slaRemaining: '剩余 2 天',
    assignee: '王安康',
    assigneeId: 'u-wangankang',
    travelOrder: {
      code: 'TR-2026-001',
      reason: '上门校准伺服参数（与 WO-2026-1101 同线路）',
      transport: '驾车',
      departAt: '2026-09-20 13:30',
      status: 'executing',
    },
    onSiteRequired: true,
    onSiteDecisionBy: '王安康',
    onSiteDecisionAt: '2026-09-17 15:10',
    description:
      '已建行程单 TR-2026-001，计划 9/20 下午上门校准伺服参数，行程执行中。',
    flowGraphId: 'fg-ops-v3',
    currentNodeId: 'fn-5',
    timeline: [
      {
        id: 'tl-1102-1',
        action: 'created',
        time: '2026-09-17 14:00',
        operator: '售后客服(刘工)',
        operatorId: 'customer-liugong',
        summary: '客户报修，自动派单给 王安康',
      },
      {
        id: 'tl-1102-2',
        action: 'started',
        time: '2026-09-17 14:30',
        operator: '王安康',
        operatorId: 'u-wangankang',
        summary: '已接单，判定需上门伺服校准',
      },
      {
        id: 'tl-1102-3',
        action: 'completed',
        time: '2026-09-17 15:10',
        operator: '王安康',
        operatorId: 'u-wangankang',
        summary: '申请上门，工单进入待上门调度',
      },
      {
        id: 'tl-1102-4',
        action: 'dispatched',
        time: '2026-09-18 09:00',
        operator: '高学义',
        operatorId: 'u-gaoxueyi',
        summary: '确认出发，行程单 TR-2026-001 执行中（含本单 + WO-2026-1101）',
        extra: { tripId: 'tr-2026-001' },
      },
    ],
  },
  {
    id: 'wo-2026-1103',
    code: 'WO-2026-1103',
    title: '宁德 D4 相机故障复测',
    type: '现场复测',
    scenario: '运维工单',
    category: 'internal',
    device: '智能检测相机 D4 (EQ-1004)',
    customer: '宁德部件',
    customerLocation: '宁德·蕉城区',
    contact: '陈主管',
    phone: '137****0091',
    priority: 'medium',
    status: 'completed',
    source: '工单助理',
    creator: '王安康',
    creatorId: 'u-wangankang',
    createdAt: '2026-09-15 10:00',
    deadline: '2026-09-17 10:00',
    slaStatus: 'normal',
    slaRemaining: '已完成',
    assignee: '王安康',
    assigneeId: 'u-wangankang',
    onSiteRequired: true,
    onSiteDecisionBy: '王安康',
    onSiteDecisionAt: '2026-09-15 10:30',
    description: '现场复测已通过，客户已确认，验收通过，工单已完成。',
    flowGraphId: 'fg-ops-v3',
    currentNodeId: 'fn-8',
    solution: `1. 现场连跑 4 小时，识别成功率 99.7% 以上；
2. 客户现场签字确认；
3. 已上传复测视频与签字单；
4. 提单人验收通过。`,
    completedAt: '2026-09-16 18:00',
    timeline: [
      {
        id: 'tl-1103-1',
        action: 'created',
        time: '2026-09-15 10:00',
        operator: '王安康',
        operatorId: 'u-wangankang',
        summary: '王安康 创建内部复测工单，自动分派给自己',
      },
      {
        id: 'tl-1103-2',
        action: 'completed',
        time: '2026-09-16 18:00',
        operator: '王安康',
        operatorId: 'u-wangankang',
        summary: '现场处理完成，提交验收',
      },
      {
        id: 'tl-1103-3',
        action: 'accepted',
        time: '2026-09-17 09:30',
        operator: '售后客服(陈主管)',
        operatorId: 'customer-chenzhuguan',
        summary: '客户验收通过，工单已完成',
      },
    ],
  },
  {
    id: 'wo-2026-1104',
    code: 'WO-2026-1104',
    title: '辉承 C3 激光喷码机保养',
    type: '定期保养',
    scenario: '运维工单',
    category: 'internal',
    device: '激光喷码机 C3 (EQ-1003)',
    customer: '辉承传热技术',
    contact: '赵经理',
    phone: '136****5512',
    priority: 'low',
    status: 'completed',
    source: '保养计划',
    creator: '王安康',
    creatorId: 'u-wangankang',
    createdAt: '2026-09-10 11:00',
    deadline: '2026-09-13 11:00',
    slaStatus: 'normal',
    slaRemaining: '已完成',
    description:
      '季度保养执行完成，与 WO-2026-1010 为同期保养计划，结果合并归档。',
    flowGraphId: 'fg-ops-v3',
    currentNodeId: 'fn-8',
    completedAt: '2026-09-12 15:30',
    timeline: [
      {
        id: 'tl-1104-1',
        action: 'created',
        time: '2026-09-10 11:00',
        operator: '王安康',
        operatorId: 'u-wangankang',
        summary: '王安康 通过保养计划创建内部工单',
      },
      {
        id: 'tl-1104-2',
        action: 'completed',
        time: '2026-09-12 15:30',
        operator: '王安康',
        operatorId: 'u-wangankang',
        summary: '保养执行完成，经验收归档',
      },
    ],
  },
  {
    id: 'wo-2026-1105',
    code: 'WO-2026-1105',
    title: '华达 F6 联机修复 · 验收不通过待整改',
    type: '设备故障',
    scenario: '运维工单',
    category: 'external',
    device: '热转印打印机 F6 (EQ-1006)',
    customer: '华达智能打印',
    contact: '王天豪',
    phone: '138****2104',
    priority: 'high',
    status: 'processing',
    source: '售后客服',
    creator: '售后客服(王天豪)',
    creatorId: 'customer-wangtianhao',
    createdAt: '2026-09-12 09:00',
    deadline: '2026-09-15 09:00',
    slaStatus: 'breached',
    slaRemaining: '已超时 4 小时（待整改）',
    assignee: '王安康',
    assigneeId: 'u-wangankang',
    description:
      '现场已更换通讯板并复测，但客户验收时发现偶发丢包未解决，验收不通过，退回承办人补充处理。',
    flowGraphId: 'fg-ops-v3',
    currentNodeId: 'fn-10',
    solution: `1. 现场更换通讯板；
2. 联机测试 30 分钟未复现，但客户长时间复测后反馈偶发丢包；
3. 需补充排查接地干扰与屏蔽措施。`,
    completedAt: '2026-09-14 17:00',
    timeline: [
      {
        id: 'tl-1105-1',
        action: 'created',
        time: '2026-09-12 09:00',
        operator: '售后客服(王天豪)',
        operatorId: 'customer-wangtianhao',
        summary: '客户报修 F6 联机失败',
      },
      {
        id: 'tl-1105-2',
        action: 'started',
        time: '2026-09-12 10:00',
        operator: '王安康',
        operatorId: 'u-wangankang',
        summary: '已接单，前往现场',
      },
      {
        id: 'tl-1105-3',
        action: 'completed',
        time: '2026-09-14 17:00',
        operator: '王安康',
        operatorId: 'u-wangankang',
        summary: '更换通讯板后联机 30 分钟未复现，提交验收',
      },
      {
        id: 'tl-1105-4',
        action: 'cancelled',
        time: '2026-09-15 14:00',
        operator: '售后客服(王天豪)',
        operatorId: 'customer-wangtianhao',
        summary: '客户长时间复测发现偶发丢包，验收不通过，退回待整改',
      },
    ],
  },
];

/**
 * Mock 工单统一做 reactive 深度响应式包装：
 * 流程动作（申请上门 / 记录处理结果 / 验收 / 复核等）原地修改工单属性即可触发视图更新。
 * 数据仍为内存态，刷新页面后重置。
 */
export const mockWorkOrders: WorkOrder[] = reactive(rawMockWorkOrders);

/**
 * 工单助理 · 我在理工单（运维工单场景演示数据）
 *
 * 覆盖运维工单主流程：fn-1 待派单 / fn-2 待接单 / fn-3 处理中 / fn-4 待上门调度 /
 * fn-5 上门处理中 / fn-6 待验收 / fn-7 待复核 / fn-10 待整改（分支）
 *
 * 每张工单均关联运维工单流程图 fg-ops-v3，currentNodeId 对应当前状态节点。
 * 工单助理基于 currentNodeId 通过 getAvailableEdges 推导可执行操作按钮。
 */
export const mockTicketAssistantActiveOrders: WorkOrder[] = [
  {
    id: 'wo-2026-2001',
    code: 'WO-2026-2001',
    title: '华达 A1 打印样品卷曲',
    type: '设备故障',
    scenario: '运维工单',
    category: 'external',
    device: '智能打印终端 A1 (EQ-1001)',
    customer: '华达智能打印',
    contact: '王天豪',
    phone: '138****2104',
    priority: 'high',
    status: 'dispatched',
    source: '售后客服',
    creator: '售后客服(王天豪)',
    creatorId: 'customer-wangtianhao',
    assignee: '王安康',
    assigneeId: 'u-wangankang',
    createdAt: '2026-09-24 08:42',
    deadline: '2026-09-25 08:42',
    slaStatus: 'warning',
    slaRemaining: '剩余 3 小时',
    description:
      '打印样品出现卷曲，已更换耗材未解决，疑似打印参数异常，已派单待王安康接单。',
    currentNodeId: 'fn-2',
    flowGraphId: 'fg-ops-v3',
  },
  {
    id: 'wo-2026-2002',
    code: 'WO-2026-2002',
    title: '中粮 B2 贴标位置偏移',
    type: '设备故障',
    scenario: '运维工单',
    category: 'external',
    device: '自动贴标机 B2 (EQ-1002)',
    customer: '中粮包装',
    contact: '刘工',
    phone: '139****7720',
    priority: 'medium',
    status: 'dispatched',
    source: '售后客服',
    creator: '售后客服(刘工)',
    creatorId: 'customer-liugong',
    createdAt: '2026-09-24 09:10',
    deadline: '2026-09-26 09:10',
    slaStatus: 'normal',
    slaRemaining: '剩余 22 小时',
    description: '贴标位置出现 2-3mm 偏移，已派单待王安康接单。',
    assignee: '王安康',
    assigneeId: 'u-wangankang',
    currentNodeId: 'fn-2',
    flowGraphId: 'fg-ops-v3',
  },
  {
    id: 'wo-2026-2003',
    code: 'WO-2026-2003',
    title: '宁德 D4 检测相机识别异常',
    type: '设备故障',
    scenario: '运维工单',
    category: 'external',
    device: '智能检测相机 D4 (EQ-1004)',
    customer: '宁德部件',
    contact: '陈主管',
    phone: '137****0091',
    priority: 'urgent',
    status: 'processing',
    source: '巡检告警',
    creator: '巡检系统',
    creatorId: 'system-inspect',
    createdAt: '2026-09-24 10:02',
    deadline: '2026-09-24 14:02',
    slaStatus: 'warning',
    slaRemaining: '剩余 1 小时',
    description:
      '检测相机偶发性识别失败，已重启 2 次仍复现，正在现场排查伺服参数。',
    assignee: '王安康',
    assigneeId: 'u-wangankang',
    currentNodeId: 'fn-3',
    flowGraphId: 'fg-ops-v3',
  },
  {
    id: 'wo-2026-2004',
    code: 'WO-2026-2004',
    title: '华达 F6 热转印联机失败',
    type: '设备故障',
    scenario: '运维工单',
    category: 'external',
    device: '热转印打印机 F6 (EQ-1006)',
    customer: '华达智能打印',
    customerLocation: '上海·浦东新区',
    contact: '王天豪',
    phone: '138****2104',
    priority: 'medium',
    status: 'pending-visit',
    source: '售后客服',
    creator: '售后客服(王天豪)',
    creatorId: 'customer-wangtianhao',
    createdAt: '2026-09-24 11:30',
    deadline: '2026-09-27 11:30',
    slaStatus: 'normal',
    slaRemaining: '剩余 3 天',
    description: '设备与产线 MES 联机失败，已申请上门，待调度确认出发。',
    assignee: '王安康',
    assigneeId: 'u-wangankang',
    onSiteRequired: true,
    onSiteDecisionBy: '王安康',
    onSiteDecisionAt: '2026-09-24 11:45',
    currentNodeId: 'fn-4',
    flowGraphId: 'fg-ops-v3',
  },
  {
    id: 'wo-2026-2005',
    code: 'WO-2026-2005',
    title: '辉承 C3 激光喷码机季度保养',
    type: '定期保养',
    scenario: '运维工单',
    category: 'internal',
    device: '激光喷码机 C3 (EQ-1003)',
    customer: '辉承传热技术',
    customerLocation: '上海·闵行区',
    contact: '赵经理',
    phone: '136****5512',
    priority: 'low',
    status: 'onsite-processing',
    source: '保养计划',
    creator: '王安康',
    creatorId: 'u-wangankang',
    createdAt: '2026-09-23 16:00',
    deadline: '2026-09-30 16:00',
    slaStatus: 'normal',
    slaRemaining: '剩余 7 天',
    description:
      '行程执行中：华达 F6 + 辉承 C3 合并行程单，逐单回填后回流承办。',
    assignee: '王安康',
    assigneeId: 'u-wangankang',
    onSiteRequired: true,
    onSiteDecisionBy: '高学义',
    onSiteDecisionAt: '2026-09-24 09:00',
    currentNodeId: 'fn-5',
    flowGraphId: 'fg-ops-v3',
  },
  {
    id: 'wo-2026-2006',
    code: 'WO-2026-2006',
    title: '中粮 E5 封箱机急停故障',
    type: '设备故障',
    scenario: '运维工单',
    category: 'external',
    device: '自动封箱机 E5 (EQ-1005)',
    customer: '中粮包装',
    contact: '刘工',
    phone: '139****7720',
    priority: 'high',
    status: 'pending-acceptance',
    source: '售后客服',
    creator: '售后客服(刘工)',
    creatorId: 'customer-liugong',
    createdAt: '2026-09-23 14:00',
    deadline: '2026-09-24 14:00',
    slaStatus: 'normal',
    slaRemaining: '剩余 18 小时',
    description:
      '急停故障已处理，完工材料齐备（解决方案 + 现场复测视频 + 打卡），待提单人验收。',
    assignee: '王安康',
    assigneeId: 'u-wangankang',
    solution:
      '更换急停继电器 KM-2 + 复位 PLC 程序，现场试运行 30 分钟未复现，速度恢复 220 张/分。',
    completedAt: '2026-09-24 10:30',
    currentNodeId: 'fn-6',
    flowGraphId: 'fg-ops-v3',
  },
  {
    id: 'wo-2026-2007',
    code: 'WO-2026-2007',
    title: '华达 A1 打印参数校准复测',
    type: '设备故障',
    scenario: '运维工单',
    category: 'external',
    device: '智能打印终端 A1 (EQ-1001)',
    customer: '华达智能打印',
    contact: '王天豪',
    phone: '138****2104',
    priority: 'medium',
    status: 'pending-acceptance',
    source: '售后客服',
    creator: '售后客服(王天豪)',
    creatorId: 'customer-wangtianhao',
    createdAt: '2026-09-23 09:00',
    deadline: '2026-09-24 18:00',
    slaStatus: 'normal',
    slaRemaining: '剩余 1 小时',
    description: '验收通过，待高学义 2 小时终审。',
    assignee: '王安康',
    assigneeId: 'u-wangankang',
    solution:
      '复写控制板参数：温度 195℃ → 188℃，速度 240 张/分 → 220 张/分，连续复测 50 张无卷曲。',
    completedAt: '2026-09-23 16:00',
    currentNodeId: 'fn-7',
    flowGraphId: 'fg-ops-v3',
  },
  {
    id: 'wo-2026-2008',
    code: 'WO-2026-2008',
    title: '宁德 D4 验收不通过退回整改',
    type: '设备故障',
    scenario: '运维工单',
    category: 'external',
    device: '智能检测相机 D4 (EQ-1004)',
    customer: '宁德部件',
    contact: '陈主管',
    phone: '137****0091',
    priority: 'urgent',
    status: 'processing',
    source: '售后客服',
    creator: '售后客服(陈主管)',
    creatorId: 'customer-chenzhuguan',
    createdAt: '2026-09-23 11:00',
    deadline: '2026-09-24 11:00',
    slaStatus: 'warning',
    slaRemaining: '剩余 30 分钟',
    description:
      '验收不通过：客户反馈偶发性识别失败仍存在，退回承办人补充处理后重新提交验收。',
    assignee: '王安康',
    assigneeId: 'u-wangankang',
    solution:
      '已现场更换 CCD 传感器并重新标定，连续运行 2 小时无复现，重新提交验收。',
    completedAt: '2026-09-24 09:00',
    currentNodeId: 'fn-10',
    flowGraphId: 'fg-ops-v3',
  },
];

/** 工单概览统计（基于上方工单数据派生 + 演示趋势） */
export const mockTicketOverview: TicketOverviewStats = {
  total: 11,
  pending: 3,
  processing: 2,
  completed: 2,
  breached: 1,
  avgResolveHours: 6.5,
  byType: [
    { type: '设备故障', count: 5 },
    { type: '定期保养', count: 2 },
    { type: '技术咨询', count: 1 },
    { type: '备件更换', count: 1 },
    { type: '现场复测', count: 1 },
    { type: '技术改进', count: 1 },
  ],
  byPriority: [
    { priority: 'urgent', count: 1 },
    { priority: 'high', count: 2 },
    { priority: 'medium', count: 6 },
    { priority: 'low', count: 2 },
  ],
  byCategory: [
    { count: 3, category: 'internal' },
    { count: 5, category: 'external' },
  ],
  trend: [
    { day: '08-09', created: 2, completed: 1 },
    { day: '08-10', created: 3, completed: 2 },
    { day: '08-11', created: 1, completed: 1 },
    { day: '08-12', created: 2, completed: 1 },
    { day: '08-13', created: 2, completed: 2 },
    { day: '08-14', created: 3, completed: 1 },
    { day: '08-15', created: 2, completed: 0 },
  ],
};

/** 派单助理 Dashboard 统计数据 */
export interface DispatchDashboard {
  /** 顶部 6 项核心指标 */
  topStats: Array<{
    color: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'teal';
    key: string;
    label: string;
    value: string;
  }>;
  /** 工单状态分布（横向堆叠条） */
  statusDistribution: Array<{
    color: string;
    count: number;
    key: string;
    label: string;
  }>;
  /** 工单量趋势（近 7 日，用于折线图） */
  trend7d: Array<{ count: number; day: string }>;
  /** 实时预警 */
  alerts: Array<{
    color: string;
    count: number;
    label: string;
    type: string;
  }>;
  /** 服务人员/网点负载 */
  staffLoad: Array<{
    count: number;
    label: string;
    max: number;
  }>;
  /** 区域工单热力（3x4 网格） */
  regionHeat: Array<{
    count: number;
    region: string;
  }>;
  /** 工单类型分布 */
  typeBreakdown: Array<{
    count: number;
    type: string;
  }>;
  /** 工单明细（下钻表格） */
  detailList: Array<{
    address?: string;
    /** AI 派工建议 */
    aiSuggest?: AiDispatchSuggestion;
    assignee: string;
    attachments?: Array<{ name: string; size: string }>;
    code: string;
    contact?: { name: string; phone: string };
    createdAt?: string;
    customer: string;
    description?: string;
    device?: string;
    id: string;
    priority?: 'high' | 'low' | 'medium' | 'urgent';
    region: string;
    reportNo?: string;
    sla: string;
    status: string;
    /** 详情扩展（用于工单详情弹窗） */
    title?: string;
    type: string;
  }>;
}

export interface AiDispatchSuggestion {
  /** AI 综合评分结论 */
  summary: string;
  /** 推荐的前 3 名工程师（id 需匹配 engineers） */
  candidates: Array<{
    engineerId: string;
    reason: string[];
    score: number;
    tag?: '备选' | '推荐' | '替补';
  }>;
  /** 风险提示 */
  risks: string[];
  /** 任务要点（携带备件 / 预计工时 / 注意事项） */
  taskNotes: {
    attention?: string[];
    carryParts?: string[];
    estimateHours?: string;
  };
}

export const mockDispatchDashboard: DispatchDashboard = {
  topStats: [
    { key: 'pending', label: '待派单', value: '12', color: 'orange' },
    { key: 'processing', label: '处理中', value: '28', color: 'blue' },
    { key: 'today-done', label: '今日完工', value: '18', color: 'green' },
    { key: 'breached', label: '超时工单', value: '3', color: 'red' },
    { key: 'avg-hours', label: '平均处理', value: '6.2h', color: 'teal' },
    { key: 'satisfaction', label: '满意度', value: '95%', color: 'purple' },
  ],
  statusDistribution: [
    { label: '待派', key: 'pending', count: 12, color: '#c9a43a' },
    { label: '已派', key: 'dispatched', count: 16, color: '#4a7da5' },
    { label: '处理中', key: 'processing', count: 28, color: '#087565' },
    { label: '待验收', key: 'pending-acceptance', count: 8, color: '#7a5da8' },
    { label: '已完工', key: 'completed', count: 18, color: '#2c8a5d' },
    { label: '已关闭', key: 'closed', count: 6, color: '#9ca8a4' },
  ],
  trend7d: [
    { day: '08-10', count: 16 },
    { day: '08-11', count: 14 },
    { day: '08-12', count: 18 },
    { day: '08-13', count: 22 },
    { day: '08-14', count: 20 },
    { day: '08-15', count: 24 },
    { day: '08-16', count: 20 },
  ],
  alerts: [
    { type: 'breached', label: '超时工单', count: 3, color: '#d4541f' },
    { type: 'complaint', label: '客户投诉', count: 1, color: '#c9a43a' },
    { type: 'backlog', label: '区域积压', count: 2, color: '#7a5da8' },
    { type: 'offline', label: '设备离线', count: 2, color: '#4a7da5' },
  ],
  staffLoad: [
    { label: '在岗', count: 24, max: 30 },
    { label: '忙碌', count: 16, max: 30 },
    { label: '空闲', count: 8, max: 30 },
  ],
  regionHeat: [
    { region: '华东-上海', count: 18 },
    { region: '华东-苏州', count: 12 },
    { region: '华东-杭州', count: 9 },
    { region: '华东-南京', count: 7 },
    { region: '华南-深圳', count: 16 },
    { region: '华南-广州', count: 11 },
    { region: '华南-宁德', count: 8 },
    { region: '华北-北京', count: 14 },
    { region: '华北-济南', count: 7 },
    { region: '华中-武汉', count: 9 },
    { region: '西南-成都', count: 6 },
    { region: '东北-沈阳', count: 4 },
  ],
  typeBreakdown: [
    { type: '设备故障', count: 34 },
    { type: '定期保养', count: 16 },
    { type: '技术咨询', count: 12 },
    { type: '备件更换', count: 9 },
    { type: '现场复测', count: 7 },
    { type: '技术改进', count: 5 },
  ],
  detailList: buildDispatchDetailList(),
};

/** 构造 detailList（含详情扩展字段 + AI 派工建议） */
function buildDispatchDetailList(): DispatchDashboard['detailList'] {
  type Row = [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    'high' | 'low' | 'medium' | 'urgent' | undefined,
  ];
  const rows: Row[] = [
    [
      'wo-2026-2001',
      'WO-2026-2001',
      '上海华达智能打印',
      '设备故障',
      '华东',
      '待派单',
      '剩余2h',
      '待分配',
      'urgent',
    ],
    [
      'wo-2026-2002',
      'WO-2026-2002',
      '深圳锐科制造股份',
      '设备故障',
      '华南',
      '待派单',
      '剩余5h',
      '待分配',
      'high',
    ],
    [
      'wo-2026-2003',
      'WO-2026-2003',
      '苏州中粮包装',
      '定期保养',
      '华东',
      '待派单',
      '剩余24h',
      '待分配',
      'medium',
    ],
    [
      'wo-2026-2013',
      'WO-2026-2013',
      '南京晨光机械',
      '设备故障',
      '华东',
      '待派单',
      '剩余8h',
      '待分配',
      'high',
    ],
    [
      'wo-2026-2014',
      'WO-2026-2014',
      '广州珠江食品',
      '现场复测',
      '华南',
      '待派单',
      '剩余12h',
      '待分配',
      'medium',
    ],
    [
      'wo-2026-2015',
      'WO-2026-2015',
      '北京顺义汽配',
      '设备故障',
      '华北',
      '待派单',
      '剩余3h',
      '待分配',
      'urgent',
    ],
    [
      'wo-2026-2016',
      'WO-2026-2016',
      '上海嘉定电子',
      '技术咨询',
      '华东',
      '待派单',
      '剩余48h',
      '待分配',
      'low',
    ],
    [
      'wo-2026-2017',
      'WO-2026-2017',
      '杭州萧山织造',
      '设备故障',
      '华东',
      '待派单',
      '剩余4h',
      '待分配',
      'high',
    ],
    [
      'wo-2026-2018',
      'WO-2026-2018',
      '武汉光谷激光',
      '备件更换',
      '华中',
      '待派单',
      '剩余18h',
      '待分配',
      'medium',
    ],
    [
      'wo-2026-2019',
      'WO-2026-2019',
      '济南高新制药',
      '定期保养',
      '华北',
      '待派单',
      '剩余36h',
      '待分配',
      'low',
    ],
    [
      'wo-2026-2004',
      'WO-2026-2004',
      '北京国盛电子集团',
      '设备故障',
      '华北',
      '待接单',
      '剩余8h',
      '李伟',
      'medium',
    ],
    [
      'wo-2026-2005',
      'WO-2026-2005',
      '杭州安能新材料',
      '技术咨询',
      '华东',
      '待接单',
      '剩余12h',
      '陈宇',
      'high',
    ],
    [
      'wo-2026-2020',
      'WO-2026-2020',
      '上海浦东模具',
      '设备故障',
      '华东',
      '待接单',
      '剩余5h',
      '张敏',
      'high',
    ],
    [
      'wo-2026-2021',
      'WO-2026-2021',
      '深圳宝安医疗',
      '设备故障',
      '华南',
      '待接单',
      '剩余1h',
      '周齐',
      'urgent',
    ],
    [
      'wo-2026-2022',
      'WO-2026-2022',
      '苏州相城电子',
      '定期保养',
      '华东',
      '待接单',
      '剩余30h',
      '李伟',
      'low',
    ],
    [
      'wo-2026-2023',
      'WO-2026-2023',
      '北京通州物流',
      '技术改进',
      '华北',
      '待接单',
      '剩余20h',
      '孙浩',
      'medium',
    ],
    [
      'wo-2026-2024',
      'WO-2026-2024',
      '广州花都汽配',
      '备件更换',
      '华南',
      '待接单',
      '剩余10h',
      '周齐',
      'medium',
    ],
    [
      'wo-2026-2025',
      'WO-2026-2025',
      '成都双流食品',
      '现场复测',
      '西南',
      '待接单',
      '剩余15h',
      '陈宇',
      'medium',
    ],
    [
      'wo-2026-2006',
      'WO-2026-2006',
      '宁德时代部件',
      '设备故障',
      '华南',
      '处理中',
      '剩余1h',
      '孙浩',
      'urgent',
    ],
    [
      'wo-2026-2007',
      'WO-2026-2007',
      '广州拓维精密器械',
      '备件更换',
      '华南',
      '处理中',
      '超时风险',
      '周齐',
      'urgent',
    ],
    [
      'wo-2026-2008',
      'WO-2026-2008',
      '上海华捷科技',
      '技术改进',
      '华东',
      '处理中',
      '剩余6h',
      '张敏',
      'high',
    ],
    [
      'wo-2026-2026',
      'WO-2026-2026',
      '沈阳大东机床',
      '设备故障',
      '东北',
      '处理中',
      '已超时',
      '孙浩',
      'urgent',
    ],
    [
      'wo-2026-2027',
      'WO-2026-2027',
      '上海闵行汽配',
      '设备故障',
      '华东',
      '处理中',
      '剩余3h',
      '李伟',
      'urgent',
    ],
    [
      'wo-2026-2028',
      'WO-2026-2028',
      '武汉江夏包装',
      '定期保养',
      '华中',
      '处理中',
      '剩余16h',
      '张敏',
      'low',
    ],
    [
      'wo-2026-2029',
      'WO-2026-2029',
      '深圳龙华电子',
      '技术咨询',
      '华南',
      '处理中',
      '剩余4h',
      '陈宇',
      'high',
    ],
    [
      'wo-2026-2030',
      'WO-2026-2030',
      '北京大兴汽车',
      '设备故障',
      '华北',
      '处理中',
      '剩余2h',
      '王安康',
      'urgent',
    ],
    [
      'wo-2026-2031',
      'WO-2026-2031',
      '杭州余杭制药',
      '备件更换',
      '华东',
      '处理中',
      '剩余9h',
      '李伟',
      'high',
    ],
    [
      'wo-2026-2032',
      'WO-2026-2032',
      '广州南沙石化',
      '设备故障',
      '华南',
      '处理中',
      '超时风险',
      '周齐',
      'urgent',
    ],
    [
      'wo-2026-2009',
      'WO-2026-2009',
      '济南辉承传热技术',
      '定期保养',
      '华北',
      '待验收',
      '准时',
      '李伟',
      'low',
    ],
    [
      'wo-2026-2010',
      'WO-2026-2010',
      '沈阳北辰重工',
      '现场复测',
      '东北',
      '待验收',
      '准时',
      '孙浩',
      'medium',
    ],
    [
      'wo-2026-2033',
      'WO-2026-2033',
      '上海松江电子',
      '设备故障',
      '华东',
      '待验收',
      '准时',
      '张敏',
      'medium',
    ],
    [
      'wo-2026-2034',
      'WO-2026-2034',
      '深圳福田金融',
      '技术改进',
      '华南',
      '待验收',
      '准时',
      '陈宇',
      'high',
    ],
    [
      'wo-2026-2035',
      'WO-2026-2035',
      '苏州工业园区',
      '备件更换',
      '华东',
      '待验收',
      '准时',
      '李伟',
      'medium',
    ],
    [
      'wo-2026-2036',
      'WO-2026-2036',
      '北京海淀医疗',
      '设备故障',
      '华北',
      '待验收',
      '准时',
      '孙浩',
      'urgent',
    ],
    [
      'wo-2026-2037',
      'WO-2026-2037',
      '成都高新电子',
      '定期保养',
      '西南',
      '待验收',
      '准时',
      '陈宇',
      'low',
    ],
    [
      'wo-2026-2038',
      'WO-2026-2038',
      '武汉青山钢铁',
      '设备故障',
      '华中',
      '待验收',
      '准时',
      '王安康',
      'high',
    ],
    [
      'wo-2026-2011',
      'WO-2026-2011',
      '成都西联电器',
      '技术改进',
      '西南',
      '已完工',
      '准时',
      '陈宇',
      'medium',
    ],
    [
      'wo-2026-2012',
      'WO-2026-2012',
      '武汉中恒信息',
      '技术咨询',
      '华中',
      '已完工',
      '准时',
      '王安康',
      'low',
    ],
    [
      'wo-2026-2039',
      'WO-2026-2039',
      '上海青浦包装',
      '设备故障',
      '华东',
      '已完工',
      '准时',
      '李伟',
      'high',
    ],
    [
      'wo-2026-2040',
      'WO-2026-2040',
      '深圳龙岗汽配',
      '定期保养',
      '华南',
      '已完工',
      '准时',
      '周齐',
      'low',
    ],
    [
      'wo-2026-2041',
      'WO-2026-2041',
      '北京朝阳通信',
      '技术咨询',
      '华北',
      '已完工',
      '准时',
      '孙浩',
      'medium',
    ],
    [
      'wo-2026-2042',
      'WO-2026-2042',
      '杭州滨江电子',
      '备件更换',
      '华东',
      '已完工',
      '准时',
      '张敏',
      'medium',
    ],
    [
      'wo-2026-2043',
      'WO-2026-2043',
      '广州黄埔物流',
      '现场复测',
      '华南',
      '已完工',
      '准时',
      '陈宇',
      'medium',
    ],
    [
      'wo-2026-2044',
      'WO-2026-2044',
      '苏州吴中纺织',
      '设备故障',
      '华东',
      '已完工',
      '提前',
      '李伟',
      'high',
    ],
    [
      'wo-2026-2045',
      'WO-2026-2045',
      '沈阳皇姑重工',
      '定期保养',
      '东北',
      '已完工',
      '准时',
      '孙浩',
      'low',
    ],
    [
      'wo-2026-2046',
      'WO-2026-2046',
      '成都武侯医疗',
      '技术改进',
      '西南',
      '已完工',
      '准时',
      '陈宇',
      'high',
    ],
    [
      'wo-2026-2047',
      'WO-2026-2047',
      '武汉洪山教育',
      '技术咨询',
      '华中',
      '已完工',
      '准时',
      '王安康',
      'low',
    ],
    [
      'wo-2026-2048',
      'WO-2026-2048',
      '上海金山化工',
      '设备故障',
      '华东',
      '已完工',
      '提前',
      '张敏',
      'urgent',
    ],
    [
      'wo-2026-2049',
      'WO-2026-2049',
      '深圳南山科技',
      '设备故障',
      '华南',
      '已完工',
      '准时',
      '周齐',
      'high',
    ],
    [
      'wo-2026-2050',
      'WO-2026-2050',
      '北京丰台铁路',
      '备件更换',
      '华北',
      '已完工',
      '准时',
      '孙浩',
      'medium',
    ],
    [
      'wo-2026-2051',
      'WO-2026-2051',
      '上海徐汇商务',
      '技术咨询',
      '华东',
      '已关闭',
      '准时',
      '李伟',
      'low',
    ],
    [
      'wo-2026-2052',
      'WO-2026-2052',
      '深圳盐田港口',
      '定期保养',
      '华南',
      '已关闭',
      '准时',
      '周齐',
      'low',
    ],
    [
      'wo-2026-2053',
      'WO-2026-2053',
      '北京石景山钢铁',
      '设备故障',
      '华北',
      '已关闭',
      '准时',
      '孙浩',
      'medium',
    ],
    [
      'wo-2026-2054',
      'WO-2026-2054',
      '杭州西湖文旅',
      '技术改进',
      '华东',
      '已关闭',
      '准时',
      '张敏',
      'medium',
    ],
    [
      'wo-2026-2055',
      'WO-2026-2055',
      '广州越秀医疗',
      '现场复测',
      '华南',
      '已关闭',
      '准时',
      '陈宇',
      'medium',
    ],
    [
      'wo-2026-2056',
      'WO-2026-2056',
      '苏州姑苏食品',
      '备件更换',
      '华东',
      '已关闭',
      '准时',
      '李伟',
      'medium',
    ],
  ];

  /** 先构造基础项（不依赖 aiSuggest 中待处理数，避免循环引用） */
  const base = rows.map((r) => {
    const [id, code, customer, type, region, status, sla, assignee, priority] =
      r;
    return {
      id,
      code,
      customer,
      type,
      region,
      status,
      sla,
      assignee,
      priority,
      ...makeTicketExtra(id, customer, type, region, status, assignee),
    };
  });

  /** 工程师实时待处理数（detailList 基础） */
  function pendingOf(eid: string): number {
    const name = engineers.find((e) => e.id === eid)?.name;
    if (!name) return 0;
    let c = 0;
    for (const item of base) {
      if (
        item.assignee === name &&
        (item.status === '待接单' || item.status === '处理中')
      )
        c += 1;
    }
    return c;
  }

  /** 再补 aiSuggest */
  return base.map((item) => ({
    ...item,
    aiSuggest: makeAiSuggestion(
      item.type,
      item.region,
      item.status,
      item.priority,
      item.assignee,
      pendingOf,
    ),
  }));
}

/** 根据工单类型/区域构造标题、描述、设备、联系人、地址、创建时间、附件等详情字段 */
function makeTicketExtra(
  id: string,
  customer: string,
  type: string,
  region: string,
  status: string,
  _assignee: string,
) {
  const titleMap: Record<string, string> = {
    设备故障: '生产设备异常停机待抢修',
    定期保养: '季度保养到期提醒',
    技术咨询: '联机参数配置与优化咨询',
    备件更换: '损耗备件更换',
    现场复测: '客户验收前现场复测',
    技术改进: '设备参数与工艺改进',
  };
  const deviceMap: Record<string, string> = {
    设备故障: 'PrintMax-X3 智能打印终端',
    定期保养: 'LaserMark-900 激光喷码机',
    技术咨询: 'MES 数据采集网关',
    备件更换: '贴标机同步轮套件',
    现场复测: 'VisionCam-V2 视觉检测系统',
    技术改进: '卷膜张力控制单元',
  };
  const descMap: Record<string, string> = {
    设备故障:
      '客户反馈设备运行中突发报警并停机，疑似控制板卡异常，打印头温度异常，产线已暂停，请求尽快安排现场工程师排查处理。',
    定期保养:
      '季度保养合同期内最后 3 天到期，按计划更换滤芯/压轮、清洁光路与同步带张紧度校准，需与客户提前预约日期。',
    技术咨询:
      '客户新接入 MES 系统联机失败，请求提供 TCP/OPC-UA 参数、端口白名单与证书有效期的排查指引，必要时远程协助。',
    备件更换:
      '客户反馈同步轮磨损、送料不平稳，申请上门更换备件并重新校准张力与运行速度。',
    现场复测:
      '客户系统改造完成，要求上门对 12 项检测指标进行复测并出具现场报告，用于客户验收。',
    技术改进:
      '客户希望提升产品合格率与速度指标，希望工程师结合当前产线节奏给出改进建议并协助上线验证。',
  };
  const regionToCity: Record<string, string> = {
    华东: '上海市',
    华南: '深圳市',
    华北: '北京市',
    华中: '武汉市',
    西南: '成都市',
    东北: '沈阳市',
  };
  const contactNames: Record<string, string> = {
    华东: '王工',
    华南: '李经理',
    华北: '赵主管',
    华中: '张主任',
    西南: '周工',
    东北: '孙经理',
  };

  const createdAt = generateCreatedAtByStatus(status, id);
  const titleSuffix = customer.length > 10 ? customer.slice(0, 10) : customer;

  return {
    title: `${titleMap[type] || '售后现场服务'} - ${titleSuffix}`,
    device: deviceMap[type] || '智能产线设备',
    description:
      descMap[type] || '客户发起售后/服务请求，请与客户确认并安排合适工程师。',
    contact: {
      name: contactNames[region] || '负责人',
      phone: `138****${Math.abs(hashStr(id)) % 10_000}`,
    },
    address: `${regionToCity[region] || '上海市'}·${customer.slice(0, 8)}厂区 1 号车间 2-3F`,
    createdAt,
    reportNo: `RP-${codeToReportId(id)}`,
    attachments: makeAttachments(type, id),
  };
}

function makeAttachments(type: string, id: string) {
  const list: Array<{ name: string; size: string }> = [];
  const h = Math.abs(hashStr(id));
  list.push({
    name: '报修现场照片_1.jpg',
    size: `${(1 + (h % 4) / 10).toFixed(1)} MB`,
  });
  if (type === '设备故障' || type === '备件更换') {
    list.push(
      { name: '设备报警截图.png', size: `${0.2 + (h % 10) / 40} MB` },
      { name: '铭牌照片.jpg', size: `${0.5 + (h % 10) / 40} MB` },
    );
  }
  if (type === '现场复测' || type === '定期保养') {
    list.push({
      name: '设备检测数据表.pdf',
      size: `${0.3 + (h % 10) / 50} MB`,
    });
  }
  if (type === '技术咨询') {
    list.push({ name: '联机日志.txt', size: `${0.04 + (h % 10) / 300} MB` });
  }
  return list;
}

/** 根据状态+id 生成合理的创建时间（越紧急越近） */
function generateCreatedAtByStatus(status: string, id: string) {
  const h = Math.abs(hashStr(id));
  const now = new Date('2026-08-16T15:00:00');
  let diffMin = 0;
  switch (status) {
    case '处理中': {
      diffMin = 120 + (h % 360);
      break;
    }
    case '已关闭': {
      diffMin = 120 * 60 + (h % 720);
      break;
    }
    case '已完工': {
      diffMin = 48 * 60 + (h % 720);
      break;
    }
    case '待接单': {
      diffMin = 40 + (h % 240);
      break;
    }
    case '待派单': {
      diffMin = 15 + (h % 180);
      break;
    }
    case '待验收': {
      diffMin = 720 + (h % 360);
      break;
    }
    default: {
      diffMin = 60;
    }
  }
  const t = new Date(now.getTime() - diffMin * 60_000);
  return t.toISOString().replace('T', ' ').slice(0, 16);
}

function codeToReportId(id: string) {
  return String(Math.abs(hashStr(id)))
    .padStart(6, '0')
    .slice(0, 6);
}

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + (s.codePointAt(i) ?? 0);
  return h;
}

/** 构造 AI 派工建议（根据 type/region/status 智能匹配工程师池） */
function makeAiSuggestion(
  type: string,
  region: string,
  status: string,
  priority: 'high' | 'low' | 'medium' | 'urgent' | undefined,
  assignee: string,
  pendingOf: (eid: string) => number,
): AiDispatchSuggestion | undefined {
  if (status === '已完工' || status === '已关闭') return undefined;

  const regionPrimary: Record<string, string[]> = {
    华东: ['e-liwei', 'e-zhangmin', 'e-wangankang'],
    华南: ['e-zhouqi'],
    华北: ['e-sunhao'],
    华中: ['e-chenyu', 'e-liwei'],
    西南: ['e-chenyu'],
    东北: ['e-sunhao', 'e-chenyu'],
  };
  const typeNeedRemote = type === '技术咨询' || type === '技术改进';

  const ids = [...(regionPrimary[region] || []), 'e-chenyu'];
  if (typeNeedRemote) ids.unshift('e-chenyu');

  const visited = new Set<string>();
  const ordered: string[] = [];
  for (const id of ids) {
    if (visited.has(id)) continue;
    visited.add(id);
    ordered.push(id);
  }
  if (status === '处理中') {
    const current = engineers.find((e) => e.name === assignee);
    if (current && !ordered.includes(current.id)) ordered.push(current.id);
  }

  const tags: Array<'备选' | '推荐' | '替补'> = ['推荐', '备选', '替补'];
  const candidates = ordered
    .slice(0, 3)
    .map((id, idx) => {
      const e = engineers.find((x) => x.id === id);
      if (!e) return null;
      const pending = pendingOf(id);
      const matchRegion =
        !regionPrimary[region] ||
        regionPrimary[region].includes(id) ||
        e.area.includes('全国');
      const score = Math.max(
        55,
        100 -
          idx * 9 -
          pending * 6 +
          (matchRegion ? 8 : 0) +
          (typeNeedRemote && e.role.includes('远程') ? 10 : 0),
      );
      const reason: string[] = [];
      if (matchRegion) reason.push(`服务区域覆盖${region}大区，可快速到场`);
      else reason.push('跨大区支援，需协调交通时间');
      if (typeNeedRemote && e.role.includes('远程'))
        reason.push('擅长远程支持/参数调试，优先远程介入');
      if (type === '设备故障' && e.role.includes('高级'))
        reason.push('资深工程师，复杂故障一次性解决率高');
      if (type === '定期保养' || type === '现场复测')
        reason.push('熟悉该类流程，现场作业规范高效');
      if (pending === 0) reason.push('当前无积压工单，可立即响应');
      else if (pending >= 4)
        reason.push(`当前有 ${pending} 单待处理，饱和较高，需评估响应时效`);
      else reason.push(`当前待处理 ${pending} 单，排程可控`);
      return {
        engineerId: id,
        score,
        tag: tags[idx],
        reason,
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  const risks: string[] = [];
  if (priority === 'urgent')
    risks.push('紧急工单，需 1 小时内确认响应，建议同时通知备用工程师');
  if (type === '备件更换')
    risks.push('需确认备件库存与物流时效，避免到场后无法替换');
  if (region === '西南' || region === '东北')
    risks.push('区域常驻工程师较少，必要时跨大区调派');
  if (status === '处理中')
    risks.push('当前已在处理中，如需转派请同步交接现场情况与备件状态');
  if (risks.length === 0) risks.push('常规工单，按标准流程响应即可');

  const taskNotes: AiDispatchSuggestion['taskNotes'] = {};
  switch (type) {
    case '备件更换': {
      taskNotes.carryParts = ['同步轮套件', '张力传感器', '校准工具'];
      taskNotes.estimateHours = '1~2 小时';
      taskNotes.attention = [
        '备件型号务必与客户机型一致',
        '拆换过程中同步做机械检查',
        '校准后 100 件连续测试',
      ];

      break;
    }
    case '定期保养': {
      taskNotes.carryParts = ['滤芯套装', '压轮更换组件', '润滑脂'];
      taskNotes.estimateHours = '1.5~2 小时';
      taskNotes.attention = [
        '按保养清单逐项记录',
        '光路清洁后务必复测功率',
        '保养报告现场盖章归档',
      ];

      break;
    }
    case '技术咨询': {
      taskNotes.estimateHours = '0.5~1.5 小时';
      taskNotes.attention = [
        '优先远程接入排查',
        '记录完整日志与参数',
        '给出操作指引并回传知识库',
      ];

      break;
    }
    case '技术改进': {
      taskNotes.estimateHours = '3~5 小时';
      taskNotes.attention = [
        '先确认当前产线数据基线',
        '改进上线需在非生产时段',
        '上线后连续观察 2 小时确认数据',
      ];
      taskNotes.carryParts = ['笔记本与远程工具', '参数模板'];

      break;
    }
    case '现场复测': {
      taskNotes.carryParts = ['便携检测仪器', '复测报告模板'];
      taskNotes.estimateHours = '2~3 小时';
      taskNotes.attention = [
        '复测前确认环境温湿度符合标准',
        '逐项记录数据，异常项需拍视频佐证',
      ];

      break;
    }
    case '设备故障': {
      taskNotes.carryParts = ['主控制板备用件', '温度传感器', '打印头清洁套件'];
      taskNotes.estimateHours = '2~4 小时';
      taskNotes.attention = [
        '到场先读取设备日志并拍照留档',
        '更换板卡前确认固件版本一致',
        '处理完成后需客户现场验收签字',
      ];

      break;
    }
    // No default
  }

  const top = candidates[0];
  if (!top) return undefined;
  const topName = engineers.find((e) => e.id === top.engineerId)?.name || '';
  const summary = `综合区域匹配度、待处理负荷和技能专长，推荐 ${topName} 作为首选工程师（AI 评分 ${top.score}），可 ${priority === 'urgent' ? '优先加急处理并指派备选' : '按正常派单流程执行'}。`;

  return { summary, candidates, risks, taskNotes };
}

/** 售后制度文件解析结果 */
export const mockDocumentParseResults: DocumentParseResult[] = [
  {
    id: 'doc-1',
    fileName: '2026年售后运维管理制度.pdf',
    fileType: 'PDF',
    uploadedAt: '2026-08-10 09:15',
    status: 'confirmed',
    ruleCount: 4,
    slaCount: 3,
    parsedRules: [
      {
        id: 'pr-1',
        condition: '设备类别 = 打印设备 且 故障等级 ≥ 中',
        target: '华东交付组·高级现场工程师',
        priority: 'high',
      },
      {
        id: 'pr-2',
        condition: '设备类别 = 检测设备 且 客户等级 = VIP',
        target: '远程支持组·远程支持工程师',
        priority: 'urgent',
      },
      {
        id: 'pr-3',
        condition: '设备类别 = 包装设备',
        target: '设备所属客户·默认交付组',
        priority: 'medium',
      },
      {
        id: 'pr-4',
        condition: '受理时间 ≥ 18:00 或 节假日 且 等级 = 紧急',
        target: '值班·高级现场工程师',
        priority: 'urgent',
      },
    ],
    parsedSlas: [
      {
        id: 'ps-1',
        name: '紧急工单 SLA',
        priority: 'urgent',
        responseHours: 0.5,
        resolveHours: 4,
      },
      {
        id: 'ps-2',
        name: '高优先级 SLA',
        priority: 'high',
        responseHours: 2,
        resolveHours: 24,
      },
      {
        id: 'ps-3',
        name: '中优先级 SLA',
        priority: 'medium',
        responseHours: 4,
        resolveHours: 72,
      },
    ],
    reviewedBy: '王安康',
    reviewedAt: '2026-08-10 15:30',
    reviewNote: '规则与现行制度一致，已确认生效',
  },
  {
    id: 'doc-2',
    fileName: '设备保修与响应时效标准.docx',
    fileType: 'Word',
    uploadedAt: '2026-08-18 14:00',
    status: 'draft',
    ruleCount: 2,
    slaCount: 2,
    parsedRules: [
      {
        id: 'pr-5',
        condition: '在保状态 = 过保 且 客户等级 = VIP',
        target: '高级工程师优先处理',
        priority: 'high',
      },
      {
        id: 'pr-6',
        condition: '在保状态 = 即将过保',
        target: '提醒客户续保并安排预防性维护',
        priority: 'medium',
      },
    ],
    parsedSlas: [
      {
        id: 'ps-4',
        name: 'VIP过保设备 SLA',
        priority: 'high',
        responseHours: 1,
        resolveHours: 12,
      },
      {
        id: 'ps-5',
        name: '即将过保预防性 SLA',
        priority: 'medium',
        responseHours: 8,
        resolveHours: 48,
      },
    ],
  },
];

export const mockKnowledgeArticles: KnowledgeArticle[] = [
  {
    id: 'kb-1',
    title: 'PrintMax-X3 打印卷曲问题排查指南',
    category: '故障排查',
    summary:
      '介绍打印卷曲的常见原因、耗材与参数排查路径，以及现场快速验证方法。',
    content:
      '打印卷曲通常由三个因素叠加导致：1) 耗材受潮或规格不符；2) 打印温度与速度不匹配；3) 压轮压力异常。\n建议排查顺序：先更换新耗材验证 → 再校准温度曲线 → 最后检查压轮压力与导轨平行度。现场可使用连续打印 50 张作为稳定性验证标准。',
    views: 326,
    helpful: 41,
    updatedAt: '2026-08-12',
    tags: ['打印设备', '卷曲', 'PrintMax-X3', '现场排查'],
  },
  {
    id: 'kb-2',
    title: '设备与 MES 联机失败通用处理流程',
    category: '故障排查',
    summary:
      '设备联机失败的标准排查流程：网络层 → 协议层 → 数据层，含常见报错码对照。',
    content:
      '联机失败按三层排查：\n1. 网络层：ping 设备 IP、确认端口连通、排查防火墙与 VLAN；\n2. 协议层：核对 TCP/OPC-UA 配置、证书有效期、心跳超时；\n3. 数据层：校验报文格式、点位映射、MES 侧接收日志。\n常见报错码 E-3011 为证书过期，E-4022 为点位未注册。',
    views: 214,
    helpful: 33,
    updatedAt: '2026-08-08',
    tags: ['联机失败', 'MES', '协议', '网络'],
  },
  {
    id: 'kb-3',
    title: 'LabelBot-Pro 贴标偏移校准步骤',
    category: '操作指引',
    summary: '贴标偏移 1-3mm 时的伺服参数校准与机械复位标准操作。',
    content:
      '贴标偏移处理：\n1. 进入工程模式读取当前伺服位置；\n2. 以 0.1mm 步进微调 X/Y 偏置；\n3. 连续取样 20 张统计偏差；\n4. 若机械性偏移，检查导轨锁紧与同步带张紧度。\n校准后建议写入参数快照便于回溯。',
    views: 158,
    helpful: 27,
    updatedAt: '2026-08-05',
    tags: ['贴标', '偏移', 'LabelBot-Pro', '校准'],
  },
  {
    id: 'kb-4',
    title: '激光喷码机季度保养清单',
    category: '保养规范',
    summary: '激光喷码机季度保养的标准项目、光路校准方法与验收指标。',
    content:
      '季度保养清单：\n1. 光路清洁与功率测试（功率衰减 < 5%）；\n2. 冷却系统检查与滤芯更换；\n3. 场镜清洁与焦距校准；\n4. 软件日志巡检与固件升级。\n验收指标：连续喷码 30 分钟无断码、功率稳定、温度曲线正常。',
    views: 92,
    helpful: 18,
    updatedAt: '2026-07-28',
    tags: ['激光喷码', '保养', '光路校准', 'LaserMark-900'],
  },
  {
    id: 'kb-5',
    title: '检测相机偶发识别失败处置',
    category: '故障排查',
    summary: 'VisionCam-V2 偶发性识别失败的排查路径与现场快速恢复方案。',
    content:
      '偶发识别失败排查：\n1. 检查光源稳定性与曝光参数漂移；\n2. 查看算法日志是否存在模型加载失败；\n3. 排查网络抖动导致图像丢帧；\n4. 必要时重启视觉服务并复测 100 次。\n若仍复现，进入镜头/相机硬件排查流程。',
    views: 134,
    helpful: 22,
    updatedAt: '2026-08-11',
    tags: ['检测设备', '识别失败', 'VisionCam-V2', '偶发'],
  },
  {
    id: 'kb-6',
    title: '客户报修信息采集话术与字段规范',
    category: '服务规范',
    summary:
      '售后客服引导式采集设备编号、故障现象、复现条件与现场环境的标准话术。',
    content:
      '采集话术规范：\n1. 先确认设备编号与型号（避免口误，请客户拍照铭牌）；\n2. 引导描述故障现象与首次出现时间；\n3. 追问复现条件（连续/偶发、特定耗材/产品）；\n4. 记录现场环境（温湿度、产线节拍、近端改动）；\n5. 询问是否已尝试处置及结果。\n字段需完整后才能建单，提升一次性解决率。',
    views: 287,
    helpful: 52,
    updatedAt: '2026-08-14',
    tags: ['售后客服', '信息采集', '话术', '建单规范'],
  },
];

export function mockTicketDelay(ms = 180): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 工单状态展示文本 */
export const ticketStatusLabel: Record<WorkOrder['status'], string> = {
  pending: '待派单',
  dispatched: '待接单',
  processing: '处理中',
  'pending-acceptance': '待验收',
  'pending-review': '待复核',
  'pending-visit': '待上门调度',
  'onsite-processing': '上门处理中',
  completed: '已完成',
  closed: '已关闭',
  cancelled: '已取消',
};

/** 工单优先级展示文本 */
export const ticketPriorityLabel: Record<WorkOrder['priority'], string> = {
  urgent: '紧急',
  high: '高',
  medium: '中',
  low: '低',
};

/** SLA 状态展示文本 */
export const slaStatusLabel: Record<WorkOrder['slaStatus'], string> = {
  normal: '正常',
  warning: '临期',
  breached: '超时',
  paused: '暂停',
};

/**
 * 数字员工预置对话场景
 * 进入对话时即展示一段完整 AI 引导流程，便于演示对话效果
 */
export const mockChatScenarios: Record<string, ChatMsg[]> = {
  // 售后客服：客户报修 → 知识库匹配 → 生成工单
  'after-sales-service': [
    {
      id: 'as-1',
      role: 'user',
      content: '你好，我们车间的打印设备好像出问题了。',
      time: '09:38',
    },
    {
      id: 'as-2',
      role: 'assistant',
      content:
        '您好，我是售后客服数字员工。很抱歉设备出现问题，我会尽快帮您处理。\n请先提供设备铭牌上的编号（如 EQ-1001），我会自动带出设备信息并匹配排查指南。',
      time: '09:38',
    },
    {
      id: 'as-3',
      role: 'user',
      content: '编号是 EQ-1001，我们是华达智能打印。',
      time: '09:39',
    },
    {
      id: 'as-4',
      role: 'assistant',
      content:
        '已找到设备：智能打印终端 A1（型号 PrintMax-X3），所属客户：华达智能打印，安装于上海·华达工厂 1 号车间。\n该设备目前状态为「故障」，上次保养时间 2026-07-20。\n请描述一下具体的故障现象，越详细越好（如：打印效果、声音、报错信息等）。',
      time: '09:39',
    },
    {
      id: 'as-5',
      role: 'user',
      content:
        '打印出来的样品出现卷曲，已经换过新耗材了还是这样，连续打印几张都会出现。',
      time: '09:40',
    },
    {
      id: 'as-6',
      role: 'assistant',
      content:
        '收到。根据您描述的「打印卷曲 + 连续复现 + 已更换耗材」，我匹配到知识库《PrintMax-X3 打印卷曲问题排查指南》，建议您先按以下步骤现场排查：',
      time: '09:41',
      card: 'kb-answer',
      kbArticleId: 'kb-1',
    },
    {
      id: 'as-7',
      role: 'user',
      content: '好的我试试，如果还是不行怎么办？',
      time: '09:42',
    },
    {
      id: 'as-8',
      role: 'assistant',
      content:
        '如果按排查指南处理后仍未解决，我将为您创建一张工单，由派单助理分派工程师上门处理。\n您也可以现在就提交报修信息，我会在工单中关联本次排查记录：',
      time: '09:42',
      card: 'report-collect',
    },
  ],

  // 工单助理：一线工程师现场建单
  'ticket-assistant': [
    {
      id: 'ta-1',
      role: 'user',
      content: '现场需要创建一个工单，宁德客户的检测相机出问题了。',
      time: '11:00',
    },
    {
      id: 'ta-2',
      role: 'assistant',
      content: `好的 ${CURRENT_USER.name}，我来引导你创建工单。\n请补充一下现场情况：设备编号、故障现象、是否已尝试处置？`,
      time: '11:00',
    },
    {
      id: 'ta-3',
      role: 'user',
      content:
        '设备是智能检测相机 D4（EQ-1004），偶发性识别失败，已经重启 2 次了还是复现。',
      time: '11:02',
    },
    {
      id: 'ta-4',
      role: 'assistant',
      content:
        '收到。已匹配设备：智能检测相机 D4（VisionCam-V2），客户：宁德部件。\n基于「偶发识别失败 + 已重启 2 次仍复现」，初步判断可能涉及：\n1. 光源稳定性或曝光参数漂移；\n2. 视觉服务模型加载异常；\n3. 网络抖动导致图像丢帧。\n建议优先级：紧急（产线已影响），是否确认创建？',
      time: '11:03',
    },
    {
      id: 'ta-5',
      role: 'user',
      content: '确认，按紧急创建。',
      time: '11:03',
    },
    {
      id: 'ta-6',
      role: 'assistant',
      content:
        '工单 WO-2026-1003 已创建成功，状态：待派单。\n· 优先级：紧急\n· SLA：响应 0.5h / 解决 4h\n· 关联设备：智能检测相机 D4 (EQ-1004)\n· 客户：宁德部件（联系人：陈主管）\n\n派单助理将根据「检测设备故障 + VIP 客户」规则，优先派给远程支持组陈宇远程协助，必要时升级现场支持。\n你可以前往「我的工单」跟踪进度，或继续补充信息。',
      time: '11:04',
      ticketCode: 'WO-2026-1003',
    },
    {
      id: 'ta-7',
      role: 'user',
      content: '再帮我创建一张，中粮贴标机标签偏移的问题。',
      time: '11:10',
    },
    {
      id: 'ta-8',
      role: 'assistant',
      content:
        '好的，已识别设备：自动贴标机 B2（EQ-1002，LabelBot-Pro），客户：中粮包装。\n贴标偏移通常需要现场伺服参数校准，建议优先级：中。请确认工单标题与描述，提交后进入待派单池：',
      time: '11:11',
      card: 'ticket-create',
    },
  ],

  // 派单助理：查看待派工单并处理
  'dispatch-assistant': [
    {
      id: 'da-1',
      role: 'user',
      content: '现在有多少待派工单？',
      time: '14:00',
    },
    {
      id: 'da-2',
      role: 'assistant',
      content:
        '当前共 3 张待派工单，已按优先级与 SLA 临期程度排序。其中 1 张紧急工单 SLA 临期（剩余 1 小时 20 分），建议优先处理：',
      time: '14:00',
      card: 'dispatch-list',
    },
    {
      id: 'da-3',
      role: 'user',
      content: 'WO-2026-1003 这张紧急的，谁适合接单？',
      time: '14:02',
    },
    {
      id: 'da-4',
      role: 'assistant',
      content:
        '基于派单规则「检测设备故障 + VIP 客户 → 远程支持组」，并结合工程师当前负荷分析：\n· 陈宇（远程支持工程师，负荷 2 单）— 规则命中，推荐\n· 周齐（现场工程师，负荷 1 单）— 同区域就近备选\n建议优先派给陈宇远程协助，若需现场再转派周齐。',
      time: '14:02',
    },
    {
      id: 'da-5',
      role: 'user',
      content: '派给陈宇。',
      time: '14:03',
    },
    {
      id: 'da-6',
      role: 'assistant',
      content:
        '已将 WO-2026-1003 派单给陈宇（远程支持工程师），SLA 计时已启动。\n· 响应时效：0.5h（截止 14:33）\n· 解决时效：4h（截止 18:03）\n工单状态已更新为「待接单」，可在工单中心查看全部已派工单与转派。',
      time: '14:03',
      ticketCode: 'WO-2026-1003',
    },
  ],
};

// ==================== 流程图：运维工单闭环流程 V3 ====================

/** 流程图节点（按你提供的 V3 闭环流程图定义） */
/**
 * 运维工单状态（V3 · 状态流转视角，对应《运维服务管理制度手册》V2.1）
 * 主路径 8 态：待派单 → 待接单 → 处理中 → 待上门调度 → 上门处理中 → 待验收 → 待复核 → 已完成
 * 分支 2 态：已取消（重复/误提）、待整改（验收不通过/复核驳回退回承办人）
 */
export const mockFlowNodes: FlowNode[] = [
  {
    id: 'fn-1',
    code: 'PENDING',
    name: '待派单',
    ownerRole: '系统 / 刘静宇',
    type: 'start',
    system: true,
    order: 1,
    slaHint: '自动派单即时流转 · 兜底刘静宇 1 小时',
    desc: '提单成功即进入，自动派单即时流转，兜底刘静宇 1 小时',
    colorKey: 'blue',
    ownerRoleType: 'person',
    ownerRoleConfig: { staffId: 'u-1004' },
    ruleSource: 'manual',
  },
  {
    id: 'fn-2',
    code: 'WAIT_ACCEPT',
    name: '待接单',
    ownerRole: '承办人',
    type: 'normal',
    system: true,
    order: 2,
    slaHint: '30 分钟内确认 · 超 2 小时升级刘静宇督促改派',
    desc: '承办人 30 分钟确认，超 2 小时升级刘静宇督促改派',
    colorKey: 'blue',
    ownerRoleType: 'position',
    ownerRoleConfig: { positionId: 'pos-02' },
    ruleSource: 'ai',
    confirmStatus: 'pending-review',
    aiReason:
      '制度要求承办人接单后 30 分钟内确认，超时升级督促；AI 将其提取为独立状态并绑定超时升级动作。',
    evidence: {
      confidence: '93%',
      source: '《设备维保服务管理制度 V3.0》· 5.2 接单要求',
      snippet:
        '派单成功后承办人应在 30 分钟内确认接单；超 2 小时未确认的，由调度岗督促改派。',
    },
  },
  {
    id: 'fn-3',
    code: 'PROCESSING',
    name: '处理中',
    ownerRole: '承办人',
    type: 'normal',
    system: true,
    order: 3,
    slaHint: '接单后时效起算 · 当日内完成上门 / 协助判断',
    desc: '接单后时效起算，当日内完成上门 / 协助判断，协助子任务挂本状态',
    colorKey: 'blue',
    subTaskTemplateIds: ['st-1', 'st-2'],
    ownerRoleType: 'role',
    ownerRoleConfig: { roleId: 'role-fe' },
    ruleSource: 'ai',
    confirmStatus: 'confirmed',
    confirmRecord: { by: '王安康', at: '2026-09-22 10:15', version: 'v1.2.0' },
    aiReason:
      'AI 依据接单后的处理动作推断「处理中」为核心工作状态，协助子任务在本状态下发起。',
    evidence: {
      confidence: '95%',
      source: '《设备维保服务管理制度 V3.0》· 5.3 处理要求',
      snippet:
        '承办人确认接单后进入处理阶段，当日内完成上门或协助判断，处理结果须如实记录。',
    },
  },
  {
    id: 'fn-4',
    code: 'WAIT_ONSITE',
    name: '待上门调度',
    ownerRole: '高学义',
    type: 'normal',
    system: true,
    order: 4,
    slaHint: 'SLA 正常计时，调度安排完成即可确认出发',
    desc: '申请上门后进入，调度安排完成即可确认出发',
    colorKey: 'amber',
    ruleSource: 'ai',
    confirmStatus: 'pending-review',
    aiReason:
      'AI 推断申请上门后需统一安排行程，建议由调度负责人在 1 个工作日内完成安排（此为 AI 推断，需与制度核对）。',
    evidence: {
      confidence: '82%',
      source: '《设备维保服务管理制度 V3.0》· 5.4 上门安排',
      snippet:
        '需现场处理的工单由高学义在 1 个工作日内完成同城多单的行程安排；安排期间工单处于等待状态。',
    },
  },
  {
    id: 'fn-5',
    code: 'ONSITE_PROCESSING',
    name: '上门处理中',
    ownerRole: '高学义',
    type: 'normal',
    system: true,
    order: 5,
    slaHint: 'SLA 正常计时，行程执行中',
    desc: '确认出发后现场处理 · 客户改期或未完成则退回「待上门调度」',
    colorKey: 'amber',
    ruleSource: 'ai',
    confirmStatus: 'pending-review',
    aiReason:
      'AI 推断确认出发后工程师在现场处理，建议如实记录现场进度与处理结果（此为 AI 推断，需与制度核对）。',
    evidence: {
      confidence: '80%',
      source: '《设备维保服务管理制度 V3.0》· 5.4 上门安排',
      snippet:
        '行程执行期间逐单回填结果；客户改期或当日未完成的工单退回待上门调度，重新纳入后续行程。',
    },
  },
  {
    id: 'fn-6',
    code: 'WAIT_ACCEPTANCE',
    name: '待验收',
    ownerRole: '提单人',
    type: 'normal',
    system: true,
    order: 6,
    slaHint: '24 小时内依据客户反馈确认',
    desc: '完工材料 + 上门次数提交后进入，提单人 24 小时依据客户反馈确认',
    colorKey: 'blue',
    requireMaterial: true,
    ownerRoleType: 'creator',
    ruleSource: 'ai',
    confirmStatus: 'confirmed',
    confirmRecord: { by: '王安康', at: '2026-09-22 10:18', version: 'v1.2.0' },
    aiReason:
      'AI 依据完工材料与验收动作推断出验收环节，验收人为提单人（对应制度中的报修人确认）。',
    evidence: {
      confidence: '92%',
      source: '《设备维保服务管理制度 V3.0》· 5.6 验收要求',
      snippet:
        '处理完成后由提单人依据客户反馈在 24 小时内确认验收；验收不通过的退回承办人补充处理。',
    },
  },
  {
    id: 'fn-7',
    code: 'WAIT_REVIEW',
    name: '待复核',
    ownerRole: '高学义',
    type: 'normal',
    system: true,
    order: 7,
    slaHint: '2 小时终审 · 不转派',
    desc: '验收通过后进入，高学义 2 小时终审，不转派',
    colorKey: 'blue',
    ownerRoleType: 'leader',
    ruleSource: 'ai',
    confirmStatus: 'pending-info',
    aiReason:
      'AI 推断存在复核环节，但制度中未明确复核时限与驳回后的处理要求，需补充制度依据后再确认。',
  },
  {
    id: 'fn-8',
    code: 'COMPLETED',
    name: '已完成',
    ownerRole: '系统',
    type: 'end',
    system: true,
    order: 8,
    desc: '复核通过 · 归档留存 · 解决方案沉淀知识库（终态）',
    colorKey: 'green',
    ruleSource: 'system',
  },
  // ===== 分支状态 =====
  {
    id: 'fn-9',
    code: 'CANCELLED',
    name: '已取消',
    ownerRole: '刘静宇',
    type: 'end',
    system: true,
    order: 1.5,
    desc: '重复 / 误提单由刘静宇确认取消（终态）',
    colorKey: 'gray',
    ruleSource: 'system',
  },
  {
    id: 'fn-10',
    code: 'WAIT_RECTIFY',
    name: '待整改',
    ownerRole: '承办人',
    type: 'normal',
    system: true,
    order: 6.5,
    desc: '验收不通过 / 复核驳回，退回承办人补充处理后重新提交',
    colorKey: 'coral',
    ruleSource: 'manual',
  },
];

/** 状态流转规则（from → to，含分支、回退、异步回流） */
export const mockFlowEdges: FlowEdge[] = [
  // ① 待派单
  {
    id: 'fe-1',
    from: 'fn-1',
    to: 'fn-2',
    action: '自动派单',
    condition: '按「设备—客户经理」对应关系即时分派',
    ruleSource: 'ai',
    confirmStatus: 'pending-review',
    evidence: {
      source: '《设备维保服务管理制度 V3.0》· 6.1 自动派单',
      snippet:
        '工单受理后系统按设备与客户经理的对应关系自动分派，派单成功后进入待接单。',
    },
  },
  {
    id: 'fe-cancel',
    from: 'fn-1',
    to: 'fn-9',
    action: '重复 / 误提',
    condition: '刘静宇确认取消',
  },
  // ② 待接单
  {
    id: 'fe-2',
    from: 'fn-2',
    to: 'fn-3',
    action: '确认接单',
    condition: '承办人 30 分钟内确认',
  },
  // ③ 处理中（「记录处理结果」在前，与列表操作顺序一致）
  {
    id: 'fe-3b',
    from: 'fn-3',
    to: 'fn-6',
    action: '记录处理结果',
    condition: '无需上门 / 协助，完工材料齐备直接提交验收',
    ruleSource: 'ai',
    confirmStatus: 'confirmed',
    confirmRecord: { by: '王安康', at: '2026-09-22 10:20', version: 'v1.2.0' },
    evidence: {
      source: '《设备维保服务管理制度 V3.0》· 5.5 完工提交',
      snippet:
        '无需上门或协助的故障，处理结果记录完整且完工材料齐备后可直接提交验收。',
    },
  },
  {
    id: 'fe-3',
    from: 'fn-3',
    to: 'fn-4',
    action: '申请上门',
    condition: '承办人判断需要现场处理',
  },
  // ④⑤ 上门安排
  {
    id: 'fe-4',
    from: 'fn-4',
    to: 'fn-5',
    action: '确认出发',
    condition: '调度安排完成，确认出发前往现场',
  },
  {
    id: 'fe-r3',
    from: 'fn-5',
    to: 'fn-4',
    action: '客户改期 / 未完成',
    rollback: true,
  },
  {
    id: 'fe-5',
    from: 'fn-5',
    to: 'fn-6',
    action: '完成处理',
    condition: '上门处理完成，回填结果提交验收',
  },
  // ⑥ 待验收
  {
    id: 'fe-6',
    from: 'fn-6',
    to: 'fn-8',
    action: '验收通过',
    condition: '提单人依据客户反馈 24 小时内确认',
  },
  {
    id: 'fe-r1',
    from: 'fn-6',
    to: 'fn-10',
    action: '验收不通过',
    rollback: true,
  },
  // ⑦ 待复核
  {
    id: 'fe-7',
    from: 'fn-7',
    to: 'fn-8',
    action: '复核通过',
    condition: '高学义 2 小时终审通过',
  },
  {
    id: 'fe-r2',
    from: 'fn-7',
    to: 'fn-10',
    action: '退回修改',
    rollback: true,
  },
  // 待整改 → 重新提交
  { id: 'fe-r4', from: 'fn-10', to: 'fn-6', action: '补充处理 · 重新提交' },
];

/** 子任务模板（可在"发起协助子任务"节点下动态增删） */
export const mockSubTaskTemplates: SubTaskTemplate[] = [
  {
    id: 'st-1',
    name: '现场协助',
    description: '需要同事到场协助排查硬件故障',
    defaultRole: '运维工程师',
    required: true,
  },
  {
    id: 'st-2',
    name: '备件协调',
    description: '协调备件仓管员确认库存与到货时间',
    defaultRole: '备件仓管员',
    required: true,
  },
  {
    id: 'st-3',
    name: '远程协助',
    description: '远程支持工程师提供技术支援',
    defaultRole: '远程支持工程师',
    required: false,
  },
];

/** 完整流程图导出 */
export const mockFlowGraph: FlowGraph = {
  id: 'fg-ops-v3',
  name: '运维工单闭环流程 V3',
  nodes: mockFlowNodes,
  edges: mockFlowEdges,
  subTaskTemplates: mockSubTaskTemplates,
  enabled: true,
};

/** 流转引擎：给定当前节点 + 动作，返回下一节点（无匹配则停留） */
export function resolveFlowTransition(
  graph: FlowGraph,
  currentNodeId: string,
  action: string,
  context?: Record<string, unknown>,
): null | string {
  const edge = graph.edges.find(
    (e) => e.from === currentNodeId && e.action === action,
  );
  if (!edge) return null;
  // 有 condition 且上下文匹配才通过；无条件则默认可走
  if (edge.condition && context) {
    // Demo 阶段不做真正的 condition 求值，业务层自己判断
    void context;
  }
  return edge.to;
}

/** 获取节点可达的所有出边（用于 UI 展示"下一步可以做什么"） */
export function getAvailableEdges(
  graph: FlowGraph,
  nodeId: string,
  includeAsync = false,
): FlowEdge[] {
  return graph.edges.filter(
    (e) => e.from === nodeId && (includeAsync || !e.async),
  );
}

/** 根据节点 id 查节点 */
export function getFlowNode(
  graph: FlowGraph,
  nodeId: string,
): FlowNode | undefined {
  return graph.nodes.find((n) => n.id === nodeId);
}

/** 根据 currentNodeId 推导 legacy TicketStatus（兼容存量 UI） */
export function nodeIdToLegacyStatus(nodeId: string): WorkOrder['status'] {
  const map: Record<string, WorkOrder['status']> = {
    'fn-1': 'pending', // 待派单
    'fn-2': 'dispatched', // 待接单
    'fn-3': 'processing', // 处理中
    'fn-4': 'pending-visit', // 待上门调度
    'fn-5': 'onsite-processing', // 上门处理中（行程执行中）
    'fn-6': 'pending-acceptance', // 待验收
    'fn-7': 'completed', // 验收通过即完成（复核环节合并）
    'fn-8': 'completed', // 已完成
    'fn-9': 'cancelled', // 已取消
    'fn-10': 'processing', // 待整改（退回承办人）
  };
  return map[nodeId] ?? 'processing';
}

/** 节点类型对应的中文标签 */
export const flowNodeTypeLabel: Record<FlowNode['type'], string> = {
  start: '起点',
  decision: '决策节点',
  normal: '常规节点',
  subtask: '协助子任务',
  suspend: '挂起节点',
  end: '终点',
};

// ==================== 需求工单 · 简化流程图 ====================

export const mockFlowGraphReqTicket: FlowGraph = {
  id: 'fg-req-v1',
  name: '需求工单流程 V1',
  enabled: true,
  nodes: [
    {
      id: 'r1',
      code: 'REQ_SUBMIT',
      name: '需求提交',
      ownerRole: '业务部门',
      type: 'start',
      system: true,
      order: 1,
      colorKey: 'amber',
    },
    {
      id: 'r2',
      code: 'REQ_REVIEW',
      name: '需求评审',
      ownerRole: '产品经理',
      type: 'decision',
      system: true,
      order: 2,
      colorKey: 'blue',
    },
    {
      id: 'r3',
      code: 'REQ_SCHEDULE',
      name: '排期确认',
      ownerRole: '项目经理',
      type: 'normal',
      system: true,
      order: 3,
      colorKey: 'blue',
    },
    {
      id: 'r4',
      code: 'REQ_DEV',
      name: '开发实施',
      ownerRole: '研发团队',
      type: 'subtask',
      system: true,
      order: 4,
      colorKey: 'coral',
      subTaskTemplateIds: ['st-req-dev', 'st-req-test'],
    },
    {
      id: 'r5',
      code: 'REQ_UAT',
      name: '验收上线',
      ownerRole: '业务部门',
      type: 'normal',
      system: true,
      order: 5,
      colorKey: 'green2',
    },
    {
      id: 'r6',
      code: 'REQ_CLOSED',
      name: '关闭归档',
      ownerRole: '系统',
      type: 'end',
      system: true,
      order: 6,
      colorKey: 'green',
    },
  ],
  edges: [
    { id: 're-1', from: 'r1', to: 'r2', action: '提交需求' },
    { id: 're-2', from: 'r2', to: 'r3', action: '评审通过' },
    { id: 're-r1', from: 'r2', to: 'r6', action: '评审驳回', rollback: true },
    { id: 're-3', from: 'r3', to: 'r4', action: '排期确认' },
    { id: 're-4', from: 'r4', to: 'r5', action: '开发完成' },
    { id: 're-5', from: 'r5', to: 'r6', action: '验收通过' },
    { id: 're-r2', from: 'r5', to: 'r4', action: '验收不通过', rollback: true },
  ],
  subTaskTemplates: [
    {
      id: 'st-req-dev',
      name: '开发任务',
      description: '具体功能开发',
      defaultRole: '研发团队',
      required: true,
    },
    {
      id: 'st-req-test',
      name: '测试任务',
      description: 'QA 联调与回归',
      defaultRole: '测试团队',
      required: true,
    },
  ],
};

// ==================== 上门工单 · 简化流程图 ====================

export const mockFlowGraphOnsiteTicket: FlowGraph = {
  id: 'fg-onsite-v1',
  name: '上门工单流程 V1',
  enabled: true,
  nodes: [
    {
      id: 'o1',
      code: 'ONSITE_BOOK',
      name: '预约上门',
      ownerRole: '客户/客户经理',
      type: 'start',
      system: true,
      order: 1,
      colorKey: 'amber',
    },
    {
      id: 'o2',
      code: 'ONSITE_ASSIGN',
      name: '分配工程师',
      ownerRole: '调度岗',
      type: 'normal',
      system: true,
      order: 2,
      colorKey: 'blue',
    },
    {
      id: 'o3',
      code: 'ONSITE_CHECKIN',
      name: '上门签到',
      ownerRole: '工程师',
      type: 'normal',
      system: true,
      order: 3,
      colorKey: 'blue',
    },
    {
      id: 'o4',
      code: 'ONSITE_PROCESS',
      name: '现场处理',
      ownerRole: '工程师',
      type: 'subtask',
      system: true,
      order: 4,
      colorKey: 'coral',
      subTaskTemplateIds: ['st-onsite-checkin', 'st-onsite-diagnose'],
    },
    {
      id: 'o5',
      code: 'ONSITE_CONFIRM',
      name: '客户确认',
      ownerRole: '客户',
      type: 'decision',
      system: true,
      order: 5,
      colorKey: 'green2',
    },
    {
      id: 'o6',
      code: 'ONSITE_CLOSED',
      name: '归档关闭',
      ownerRole: '系统',
      type: 'end',
      system: true,
      order: 6,
      colorKey: 'green',
    },
    {
      id: 'o7',
      code: 'ONSITE_WAITPART',
      name: '等待备件',
      ownerRole: '系统',
      type: 'suspend',
      system: false,
      order: 4.5,
      colorKey: 'pink',
    },
  ],
  edges: [
    { id: 'oe-1', from: 'o1', to: 'o2', action: '创建预约' },
    { id: 'oe-2', from: 'o2', to: 'o3', action: '工程师接单' },
    { id: 'oe-3', from: 'o3', to: 'o4', action: '现场签到' },
    { id: 'oe-4', from: 'o4', to: 'o7', action: '需等备件', async: true },
    {
      id: 'oe-5',
      from: 'o7',
      to: 'o4',
      action: '备件到位',
      condition: '备件到货后自动恢复',
    },
    { id: 'oe-6', from: 'o4', to: 'o5', action: '处理完成' },
    { id: 'oe-7', from: 'o5', to: 'o6', action: '客户确认' },
    { id: 'oe-r1', from: 'o5', to: 'o4', action: '客户不认可', rollback: true },
  ],
  subTaskTemplates: [
    {
      id: 'st-onsite-checkin',
      name: '现场打卡',
      description: 'GPS + 水印照片签到',
      defaultRole: '工程师',
      required: true,
    },
    {
      id: 'st-onsite-diagnose',
      name: '故障排查',
      description: '现场诊断 + 解决方案',
      defaultRole: '工程师',
      required: true,
    },
  ],
};

/** 三套流程图全集（可按 id 索引，场景绑定用） */
export const mockFlowGraphs: FlowGraph[] = [
  mockFlowGraph, // fg-ops-v3
  mockFlowGraphReqTicket, // fg-req-v1
  mockFlowGraphOnsiteTicket, // fg-onsite-v1
];

/** 根据 flowGraphId 查流程图 */
export function getFlowGraph(id: string): FlowGraph | undefined {
  return mockFlowGraphs.find((g) => g.id === id);
}

// ==================== 场景 ←→ 流程图 绑定 ====================

/** 工单场景配置（每个场景绑定一套流程图） */
export const mockTicketScenarios: TicketScenario[] = [
  {
    id: 's1',
    code: 'ops-ticket',
    name: '运维工单',
    description: '面向设备运维工单：报修、派单、SLA、超时升级与闭环。',
    status: 'published',
    latestStatus: 'published',
    latestVersion: 'v1.2.0',
    lastPublishedVersion: 'v1.2.0',
    updatedAt: '2026-08-20 10:22',
    by: '王安康',
    flowGraphId: 'fg-ops-v3',
    flowGraphName: '运维工单闭环流程 V3',
  },
  {
    id: 's2',
    code: 'req-ticket',
    name: '需求工单',
    description: '需求收集与流转：提需求、评审、排期与上线跟踪。',
    status: 'draft',
    latestStatus: 'draft',
    latestVersion: 'v0.5.0',
    lastPublishedVersion: 'v0.4.0',
    updatedAt: '2026-08-21 09:12',
    by: '王安康',
    flowGraphId: 'fg-req-v1',
    flowGraphName: '需求工单流程 V1',
  },
  {
    id: 's3',
    code: 'onsite-ticket',
    name: '上门工单',
    description: '上门服务工单：预约、签到、过程记录与客户确认。',
    status: 'published',
    latestStatus: 'published',
    latestVersion: 'v1.0.0',
    lastPublishedVersion: 'v1.0.0',
    updatedAt: '2026-08-18 16:40',
    by: '王安康',
    flowGraphId: 'fg-onsite-v1',
    flowGraphName: '上门工单流程 V1',
  },
];

// ==================== 行程单（上门运维工单合并出行） ====================

/** 行程单状态文案 */
export const tripStatusLabel: Record<TripOrder['status'], string> = {
  cancelled: '已取消',
  completed: '已完成',
  draft: '草稿',
  ongoing: '执行中',
  planned: '已规划',
};

/** 行程单状态颜色 */
export const tripStatusColor: Record<TripOrder['status'], string> = {
  cancelled: 'red',
  completed: 'green',
  draft: 'default',
  ongoing: 'processing',
  planned: 'blue',
};

/** 计划时段选项 */
export const tripSlotOptions = [
  { label: '上午', value: '上午' },
  { label: '下午', value: '下午' },
  { label: '全天', value: '全天' },
];

/** 行程单初始 mock 数据 */
export const mockTripOrders: TripOrder[] = [
  {
    id: 'tr-2026-001',
    code: 'TR-2026-001',
    title: '上海·华达 + 中粮·上门行程',
    workOrderIds: ['wo-2026-1101', 'wo-2026-1102'],
    owner: '王安康',
    ownerId: 'u-wangankang',
    planDate: '2026-09-20',
    planSlot: '下午',
    status: 'planned',
    remark: '下午先到华达 A1 更换加热模组，再前往中粮 B2 校准伺服参数。',
    createdAt: '2026-09-18 09:00',
  },
  {
    id: 'tr-2026-002',
    code: 'TR-2026-002',
    title: '宁德·D4 相机镜头更换行程',
    workOrderIds: ['wo-2026-1008'],
    owner: '王安康',
    ownerId: 'u-wangankang',
    planDate: '2026-08-11',
    planSlot: '全天',
    status: 'completed',
    remark: '现场更换 D4 相机镜头并完成标定，客户已验收。',
    createdAt: '2026-08-10 16:00',
    completedAt: '2026-08-11 17:50',
  },
];

/** 深拷贝行程单（含关联工单数组） */
export function cloneTripOrders(): TripOrder[] {
  return mockTripOrders.map((t) => ({
    ...t,
    workOrderIds: [...t.workOrderIds],
  }));
}

/** 行程单创建入参（id / code / 时间戳由 mock 生成） */
export type CreateTripPayload = Omit<
  TripOrder,
  'code' | 'completedAt' | 'createdAt' | 'id' | 'updatedAt'
>;

/** 当前时间格式化为 YYYY-MM-DD HH:mm */
function tripNowText(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 创建行程单 */
export async function createTripApi(data: CreateTripPayload) {
  await mockTicketDelay();
  const timestamp = tripNowText();
  const d = new Date();
  const datePart = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const seq = mockTripOrders.length + 1;
  const newTrip: TripOrder = {
    ...data,
    id: `trip-${datePart}-${seq}`,
    code: `TRIP-${datePart}-${String(seq).padStart(2, '0')}`,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  mockTripOrders.push(newTrip);
  return { code: 0, data: newTrip, message: 'success' };
}

/** 更新行程单（状态流转） */
export async function updateTripApi(
  id: string,
  patch: Partial<TripOrder>,
): Promise<{ code: number; data: TripOrder; message: string }> {
  await mockTicketDelay();
  const index = mockTripOrders.findIndex((t) => t.id === id);
  if (index === -1) throw new Error('行程单不存在');
  const current = mockTripOrders[index] as TripOrder;
  const updated: TripOrder = {
    ...current,
    ...patch,
    updatedAt: tripNowText(),
    completedAt:
      patch.status === 'completed' ? tripNowText() : current.completedAt,
  };
  mockTripOrders[index] = updated;
  return { code: 0, data: updated, message: 'success' };
}

/** 删除行程单 */
export async function deleteTripApi(id: string) {
  await mockTicketDelay();
  const index = mockTripOrders.findIndex((t) => t.id === id);
  if (index === -1) throw new Error('行程单不存在');
  mockTripOrders.splice(index, 1);
  return { code: 0, data: undefined, message: 'success' };
}

/** 工单标记状态展示文案 */
export const tripWoMarkStatusLabel: Record<
  TripCompletion['woMarks'][number]['status'],
  string
> = {
  ok: '已处理',
  partial: '部分处理',
  fail: '未处理',
  rework: '需返修',
};

/** 工单标记状态对应 Tag 颜色 */
export const tripWoMarkStatusColor: Record<
  TripCompletion['woMarks'][number]['status'],
  string
> = {
  ok: 'green',
  partial: 'orange',
  fail: 'red',
  rework: 'volcano',
};

/**
 * 完成行程并回写至关联工单：
 * 1. 行程状态置为 completed，completion 字段保存提交材料
 * 2. 行程级验收附件回写到每张关联工单的 acceptanceAttachments
 * 3. 行程总结回写到每张关联工单的 solution 字段（如工单本身未填）
 * 4. 按工单标记状态分别写入 timeline 事件（completed / dispatched / escalated）
 */
export async function completeTripWithMaterialsApi(
  tripId: string,
  completion: TripCompletion,
): Promise<{ code: number; data: TripOrder; message: string }> {
  await mockTicketDelay();
  const index = mockTripOrders.findIndex((t) => t.id === tripId);
  if (index === -1) throw new Error('行程单不存在');
  const trip = mockTripOrders[index] as TripOrder;
  const timestamp = tripNowText();

  // 1. 更新行程
  const updated: TripOrder = {
    ...trip,
    status: 'completed',
    completedAt: timestamp,
    completion: { ...completion, submittedAt: timestamp },
    updatedAt: timestamp,
  };
  mockTripOrders[index] = updated;

  // 2. 回写到关联工单
  const tripAtts = completion.attachments;
  const tripSummary = completion.summary;

  for (const mark of completion.woMarks) {
    const wo = mockWorkOrders.find((o) => o.id === mark.workOrderId);
    if (!wo) continue;
    if (!wo.timeline) wo.timeline = [];

    // 合并行程级 + 工单级验收附件
    const mergedAtts = [...tripAtts, ...(mark.attachments ?? [])];
    wo.acceptanceAttachments = [
      ...(wo.acceptanceAttachments ?? []),
      ...mergedAtts,
    ];
    // 行程总结回写到 solution（仅当工单本身未填写时）
    if (!wo.solution || wo.solution.trim() === '') {
      wo.solution = tripSummary;
    }

    // 按 status 写 timeline 事件
    const operatorName = trip.owner;
    const operatorId = trip.ownerId;
    const tripCodeRef = trip.code;

    switch (mark.status) {
      case 'fail': {
        wo.timeline.push({
          id: `tl-${wo.id}-tripfail-${tripId}`,
          action: 'completed',
          time: timestamp,
          operator: operatorName,
          operatorId,
          summary: `行程 ${tripCodeRef} 标记未处理：${mark.failReason ?? ''}`,
          extra: { tripId, tripCode: tripCodeRef, markStatus: 'fail' },
        });
        if (mark.needRedispatch) {
          wo.timeline.push({
            id: `tl-${wo.id}-tripredis-${tripId}`,
            action: 'dispatched',
            time: timestamp,
            operator: operatorName,
            operatorId,
            summary: `未处理，已重新派单`,
            extra: {
              tripId,
              tripCode: tripCodeRef,
              reason: mark.failReason ?? '',
            },
          });
        }
        if (mark.needEscalate) {
          wo.timeline.push({
            id: `tl-${wo.id}-tripesc-${tripId}`,
            action: 'note',
            time: timestamp,
            operator: operatorName,
            operatorId,
            summary: `未处理且已升级处理`,
            extra: {
              tripId,
              tripCode: tripCodeRef,
              reason: mark.failReason ?? '',
            },
          });
        }

        break;
      }
      case 'ok': {
        wo.timeline.push({
          id: `tl-${wo.id}-tripcmp-${tripId}`,
          action: 'completed',
          time: timestamp,
          operator: operatorName,
          operatorId,
          summary: `行程 ${tripCodeRef} 完成，工单验收通过：${mark.handledNote ?? ''}`,
          extra: { tripId, tripCode: tripCodeRef, markStatus: 'ok' },
        });
        wo.status = 'completed';
        wo.completedAt = timestamp;

        break;
      }
      case 'partial': {
        wo.timeline.push({
          id: `tl-${wo.id}-trippart-${tripId}`,
          action: 'completed',
          time: timestamp,
          operator: operatorName,
          operatorId,
          summary: `行程 ${tripCodeRef} 部分处理：已处理 ${mark.handledNote ?? ''}；未完成 ${mark.unhandledNote ?? ''}`,
          extra: { tripId, tripCode: tripCodeRef, markStatus: 'partial' },
        });
        if (mark.needRedispatch) {
          wo.timeline.push({
            id: `tl-${wo.id}-tripredis-${tripId}`,
            action: 'dispatched',
            time: timestamp,
            operator: operatorName,
            operatorId,
            summary: `因部分未完成，已重新派单处理`,
            extra: {
              tripId,
              tripCode: tripCodeRef,
              reason: mark.unhandledNote ?? '',
            },
          });
        }

        break;
      }
      case 'rework': {
        wo.timeline.push({
          id: `tl-${wo.id}-triprework-${tripId}`,
          action: 'completed',
          time: timestamp,
          operator: operatorName,
          operatorId,
          summary: `行程 ${tripCodeRef} 标记需返修（${mark.reworkType ?? ''}）：${mark.reworkReason ?? ''}`,
          extra: { tripId, tripCode: tripCodeRef, markStatus: 'rework' },
        });
        if (mark.needRedispatch) {
          wo.timeline.push({
            id: `tl-${wo.id}-tripredis-${tripId}`,
            action: 'dispatched',
            time: timestamp,
            operator: operatorName,
            operatorId,
            summary: `需返修，已重新派单（期望 ${mark.reworkExpectedAt ?? '尽快'}）`,
            extra: {
              tripId,
              tripCode: tripCodeRef,
              reason: mark.reworkReason ?? '',
            },
          });
        }

        break;
      }
      // No default
    }
  }

  return { code: 0, data: updated, message: 'success' };
}

// ============================================================================
// V1.1：可配置流程模型扩展（PRD 工单V1.1prd.md）
// 与现有 mockFlowGraphs/mockTicketScenarios/mockDispatchRules/mockSlaConfigs
// 并存，互不干扰；运行时按场景 id 关联查询。
// ============================================================================

// ---------------- 工单字段类型选项（PRD 第 6.2 节）----------------

export const ticketFieldTypeOptions: Array<{
  label: string;
  value: TicketFieldType;
}> = [
  { label: '文本', value: 'text' },
  { label: '多行文本', value: 'textarea' },
  { label: '数字', value: 'number' },
  { label: '金额', value: 'amount' },
  { label: '日期', value: 'date' },
  { label: '日期时间', value: 'datetime' },
  { label: '单选', value: 'select' },
  { label: '多选', value: 'multiselect' },
  { label: '人员', value: 'person' },
  { label: '部门', value: 'department' },
  { label: '岗位', value: 'position' },
  { label: '客户', value: 'customer' },
  { label: '设备', value: 'device' },
  { label: '附件', value: 'attachment' },
  { label: '地址', value: 'address' },
  { label: '表格', value: 'table' },
];

/** 字段类型 → 中文文案（展示用） */
export const fieldTypeLabel: Record<TicketFieldType, string> = {
  address: '地址',
  amount: '金额',
  attachment: '附件',
  customer: '客户',
  date: '日期',
  datetime: '日期时间',
  department: '部门',
  device: '设备',
  location: '定位',
  multiselect: '多选',
  number: '数字',
  person: '人员',
  position: '岗位',
  select: '单选',
  table: '表格',
  text: '文本',
  textarea: '多行文本',
};

/** 通用系统字段定义（PRD 第 6.2 节：所有场景共享） */
function buildSystemFields(): SchemaFieldDef[] {
  return [
    {
      id: 'sf-code',
      code: 'code',
      name: '工单编号',
      type: 'text',
      required: true,
      visible: true,
      editable: false,
      system: true,
      order: 1,
    },
    {
      id: 'sf-title',
      code: 'title',
      name: '工单标题',
      type: 'text',
      required: true,
      visible: true,
      editable: true,
      system: true,
      order: 2,
    },
    {
      id: 'sf-creator',
      code: 'creator',
      name: '创建人',
      type: 'person',
      required: true,
      visible: true,
      editable: false,
      system: true,
      order: 3,
    },
    {
      id: 'sf-createdAt',
      code: 'createdAt',
      name: '创建时间',
      type: 'datetime',
      required: true,
      visible: true,
      editable: false,
      system: true,
      order: 4,
    },
    {
      id: 'sf-status',
      code: 'status',
      name: '当前状态',
      type: 'select',
      required: true,
      visible: true,
      editable: false,
      system: true,
      order: 5,
    },
    {
      id: 'sf-assignee',
      code: 'assignee',
      name: '当前处理人',
      type: 'person',
      visible: true,
      editable: false,
      system: true,
      order: 6,
    },
    {
      id: 'sf-priority',
      code: 'priority',
      name: '优先级',
      type: 'select',
      required: true,
      visible: true,
      editable: true,
      system: true,
      defaultValue: 'medium',
      dataSource: 'priority',
      usedInWorkflow: true,
      usedInSla: true,
      usedInDispatch: true,
      order: 7,
    },
    {
      id: 'sf-source',
      code: 'source',
      name: '来源',
      type: 'select',
      visible: true,
      editable: true,
      system: true,
      dataSource: 'ticket-source',
      order: 8,
    },
    {
      id: 'sf-updatedAt',
      code: 'updatedAt',
      name: '更新时间',
      type: 'datetime',
      visible: true,
      editable: false,
      system: true,
      order: 9,
    },
  ];
}

// ---------------- 工单模型（TicketSchema）----------------

export const mockTicketSchemas: TicketSchema[] = [
  {
    id: 'ts-s1',
    sceneId: 's1',
    systemFields: buildSystemFields(),
    customFields: [
      {
        id: 'cf-s1-device',
        code: 'device',
        name: '故障设备',
        type: 'device',
        required: true,
        visible: true,
        editable: true,
        usedInDispatch: true,
        dataSource: 'device-category',
        order: 1,
      },
      {
        id: 'cf-s1-customerLevel',
        code: 'customerLevel',
        name: '客户等级',
        type: 'select',
        required: true,
        visible: true,
        editable: true,
        dataSource: 'customer-level',
        usedInSla: true,
        usedInDispatch: true,
        usedInWorkflow: true,
        order: 2,
      },
      {
        id: 'cf-s1-faultType',
        code: 'faultType',
        name: '故障类型',
        type: 'select',
        required: true,
        visible: true,
        editable: true,
        dataSource: 'fault-type',
        usedInWorkflow: true,
        usedInDispatch: true,
        order: 3,
      },
      {
        id: 'cf-s1-faultLevel',
        code: 'faultLevel',
        name: '故障级别',
        type: 'select',
        required: true,
        visible: true,
        editable: true,
        dataSource: 'fault-level',
        usedInSla: true,
        usedInWorkflow: true,
        order: 4,
      },
      {
        id: 'cf-s1-warranty',
        code: 'warrantyStatus',
        name: '在保状态',
        type: 'select',
        visible: true,
        editable: true,
        dataSource: 'warranty-status',
        usedInDispatch: true,
        order: 5,
      },
      {
        id: 'cf-s1-location',
        code: 'location',
        name: '设备地址',
        type: 'address',
        required: true,
        visible: true,
        editable: true,
        order: 6,
      },
      {
        id: 'cf-s1-desc',
        code: 'description',
        name: '故障描述',
        type: 'textarea',
        required: true,
        visible: true,
        editable: true,
        order: 7,
      },
      {
        id: 'cf-s1-attachments',
        code: 'attachments',
        name: '现场附件',
        type: 'attachment',
        visible: true,
        editable: true,
        order: 8,
      },
    ],
    layout: [
      {
        id: 'fg-s1-base',
        name: '基本信息',
        fieldIds: [
          'sf-code',
          'sf-title',
          'sf-creator',
          'sf-createdAt',
          'sf-status',
          'sf-assignee',
          'sf-priority',
          'sf-source',
          'sf-updatedAt',
        ],
      },
      {
        id: 'fg-s1-device',
        name: '设备信息',
        fieldIds: [
          'cf-s1-device',
          'cf-s1-customerLevel',
          'cf-s1-faultType',
          'cf-s1-faultLevel',
          'cf-s1-warranty',
          'cf-s1-location',
        ],
      },
      {
        id: 'fg-s1-desc',
        name: '描述与附件',
        fieldIds: ['cf-s1-desc', 'cf-s1-attachments'],
      },
    ],
  },
  {
    id: 'ts-s2',
    sceneId: 's2',
    systemFields: buildSystemFields(),
    customFields: [
      {
        id: 'cf-s2-module',
        code: 'module',
        name: '需求模块',
        type: 'select',
        required: true,
        visible: true,
        editable: true,
        dataSource: 'req-module',
        usedInDispatch: true,
        order: 1,
      },
      {
        id: 'cf-s2-urgency',
        code: 'urgency',
        name: '紧急度',
        type: 'select',
        required: true,
        visible: true,
        editable: true,
        dataSource: 'req-urgency',
        usedInSla: true,
        usedInWorkflow: true,
        order: 2,
      },
      {
        id: 'cf-s2-expectedDate',
        code: 'expectedDate',
        name: '期望上线日期',
        type: 'date',
        visible: true,
        editable: true,
        usedInSla: true,
        order: 3,
      },
      {
        id: 'cf-s2-desc',
        code: 'description',
        name: '需求描述',
        type: 'textarea',
        required: true,
        visible: true,
        editable: true,
        order: 4,
      },
      {
        id: 'cf-s2-attachment',
        code: 'attachments',
        name: '需求附件',
        type: 'attachment',
        visible: true,
        editable: true,
        order: 5,
      },
    ],
    layout: [
      {
        id: 'fg-s2-base',
        name: '基本信息',
        fieldIds: [
          'sf-code',
          'sf-title',
          'sf-creator',
          'sf-createdAt',
          'sf-status',
          'sf-assignee',
          'sf-priority',
          'sf-source',
          'sf-updatedAt',
        ],
      },
      {
        id: 'fg-s2-detail',
        name: '需求详情',
        fieldIds: [
          'cf-s2-module',
          'cf-s2-urgency',
          'cf-s2-expectedDate',
          'cf-s2-desc',
          'cf-s2-attachment',
        ],
      },
    ],
  },
  {
    id: 'ts-s3',
    sceneId: 's3',
    systemFields: buildSystemFields(),
    customFields: [
      {
        id: 'cf-s3-customerName',
        code: 'customer',
        name: '客户名称',
        type: 'customer',
        required: true,
        visible: true,
        editable: true,
        usedInDispatch: true,
        order: 1,
      },
      {
        id: 'cf-s3-address',
        code: 'address',
        name: '上门地址',
        type: 'address',
        required: true,
        visible: true,
        editable: true,
        order: 2,
      },
      {
        id: 'cf-s3-appointDate',
        code: 'appointDate',
        name: '预约时间',
        type: 'datetime',
        required: true,
        visible: true,
        editable: true,
        usedInSla: true,
        order: 3,
      },
      {
        id: 'cf-s3-contact',
        code: 'contact',
        name: '现场联系人',
        type: 'text',
        visible: true,
        editable: true,
        order: 4,
      },
      {
        id: 'cf-s3-phone',
        code: 'phone',
        name: '联系电话',
        type: 'text',
        visible: true,
        editable: true,
        order: 5,
      },
      {
        id: 'cf-s3-purpose',
        code: 'purpose',
        name: '上门目的',
        type: 'textarea',
        required: true,
        visible: true,
        editable: true,
        order: 6,
      },
    ],
    layout: [
      {
        id: 'fg-s3-base',
        name: '基本信息',
        fieldIds: [
          'sf-code',
          'sf-title',
          'sf-creator',
          'sf-createdAt',
          'sf-status',
          'sf-assignee',
          'sf-priority',
          'sf-source',
          'sf-updatedAt',
        ],
      },
      {
        id: 'fg-s3-detail',
        name: '上门信息',
        fieldIds: [
          'cf-s3-customerName',
          'cf-s3-address',
          'cf-s3-appointDate',
          'cf-s3-contact',
          'cf-s3-phone',
          'cf-s3-purpose',
        ],
      },
    ],
  },
];

// ---------------- 工单动作（TicketAction）----------------

export const mockTicketActions: TicketAction[] = [
  // === 运维工单场景（节点 fn-1..fn-10）===
  {
    id: 'act-dispatch',
    code: 'dispatch',
    name: '派单',
    allowedRoles: ['account-manager', 'ops-staff'],
    nextStateId: 'fn-2',
    requireReason: false,
    enabled: true,
  },
  {
    id: 'act-accept',
    code: 'accept',
    name: '接单',
    allowedRoles: ['field-engineer'],
    nextStateId: 'fn-3',
    enabled: true,
  },
  {
    id: 'act-start-process',
    code: 'start_process',
    name: '开始处理',
    allowedRoles: ['field-engineer'],
    nextStateId: 'fn-3',
    enabled: true,
  },
  {
    id: 'act-mark-onsite',
    code: 'mark_onsite',
    name: '标记需上门',
    allowedRoles: ['field-engineer'],
    nextStateId: 'fn-4',
    inputFields: ['description'],
    requireReason: true,
    enabled: true,
  },
  {
    id: 'act-complete-direct',
    code: 'complete_direct',
    name: '直接处理完成',
    allowedRoles: ['field-engineer'],
    nextStateId: 'fn-6',
    inputFields: ['solution'],
    requireReason: false,
    enabled: true,
  },
  {
    id: 'act-submit-acceptance',
    code: 'submit_acceptance',
    name: '提交验收',
    allowedRoles: ['field-engineer'],
    nextStateId: 'fn-6',
    inputFields: ['solution', 'attachments'],
    requireReason: false,
    enabled: true,
  },
  {
    id: 'act-accept-pass',
    code: 'acceptance_pass',
    name: '验收通过',
    allowedRoles: ['account-manager', 'employee'],
    nextStateId: 'fn-7',
    condition: {
      id: 'cond-accept-pass',
      field: 'faultLevel',
      op: 'ne',
      value: '一级故障',
    },
    requireReason: false,
    enabled: true,
  },
  {
    id: 'act-accept-reject',
    code: 'acceptance_reject',
    name: '验收不通过',
    allowedRoles: ['account-manager', 'employee'],
    nextStateId: 'fn-10',
    requireReason: true,
    enabled: true,
  },
  {
    id: 'act-review-pass',
    code: 'review_pass',
    name: '复核通过',
    allowedRoles: ['ops-staff'],
    nextStateId: 'fn-8',
    enabled: true,
    triggers: [{ type: 'notify', payload: { target: 'creator' } }],
  },
  {
    id: 'act-review-reject',
    code: 'review_reject',
    name: '复核驳回',
    allowedRoles: ['ops-staff'],
    nextStateId: 'fn-10',
    requireReason: true,
    enabled: true,
  },
  {
    id: 'act-resubmit',
    code: 'resubmit',
    name: '补充处理·重新提交',
    allowedRoles: ['field-engineer'],
    nextStateId: 'fn-6',
    inputFields: ['solution'],
    enabled: true,
  },
  {
    id: 'act-cancel',
    code: 'cancel',
    name: '取消工单',
    allowedRoles: ['account-manager', 'employee'],
    nextStateId: 'fn-9',
    requireReason: true,
    enabled: true,
  },
  {
    id: 'act-transfer',
    code: 'transfer',
    name: '转派',
    allowedRoles: ['account-manager', 'ops-staff'],
    nextStateId: 'fn-2',
    inputFields: ['assignee'],
    requireReason: true,
    enabled: true,
    triggers: [{ type: 'sla-pause' }],
  },
  // === 需求工单场景（节点 r1..r6）===
  {
    id: 'act-req-submit',
    code: 'submit_requirement',
    name: '提交需求',
    allowedRoles: ['employee'],
    nextStateId: 'r2',
    enabled: true,
  },
  {
    id: 'act-req-review-pass',
    code: 'req_review_pass',
    name: '评审通过',
    allowedRoles: ['account-manager'],
    nextStateId: 'r3',
    enabled: true,
  },
  {
    id: 'act-req-review-reject',
    code: 'req_review_reject',
    name: '评审驳回',
    allowedRoles: ['account-manager'],
    nextStateId: 'r6',
    requireReason: true,
    enabled: true,
  },
  // === 上门工单场景（节点 o1..o5）===
  {
    id: 'act-onsite-assign',
    code: 'onsite_assign',
    name: '分配工程师',
    allowedRoles: ['ops-staff'],
    nextStateId: 'o2',
    enabled: true,
  },
  {
    id: 'act-onsite-checkin',
    code: 'onsite_checkin',
    name: '上门签到',
    allowedRoles: ['field-engineer'],
    nextStateId: 'o3',
    inputFields: ['attachments'],
    enabled: true,
    triggers: [{ type: 'notify', payload: { target: 'customer' } }],
  },
];

// ---------------- 派单策略（AssignmentPolicy）----------------

/** 分配策略选项 */
export const assignStrategyOptions: Array<{
  label: string;
  value: AssignmentRule['strategy'];
}> = [
  { label: '指定人员', value: 'fixed' },
  { label: '轮询', value: 'round-robin' },
  { label: '负载均衡', value: 'load-balance' },
  { label: '最少工单', value: 'least-tickets' },
  { label: '随机', value: 'random' },
  { label: '优先级分配', value: 'priority' },
];

/** 候选范围类型选项 */
export const candidateScopeTypeOptions: Array<{
  label: string;
  value: AssignmentRule['candidateScope']['type'];
}> = [
  { label: '指定人员', value: 'person' },
  { label: '指定岗位', value: 'position' },
  { label: '指定部门', value: 'department' },
  { label: '指定角色', value: 'role' },
  { label: '客户经理', value: 'account-manager' },
  { label: '一线人员', value: 'field-engineer' },
  { label: '动态人员', value: 'dynamic' },
];

/** 触发节点选项 */
export const triggerOptions: Array<{
  label: string;
  value: AssignmentRule['trigger'];
}> = [
  { label: '工单创建', value: 'create' },
  { label: '进入节点', value: 'enter-node' },
  { label: '转派', value: 'transfer' },
  { label: '动作完成', value: 'action' },
];

export const mockAssignmentPolicies: AssignmentPolicy[] = [
  {
    id: 'ap-s1',
    sceneId: 's1',
    defaultAssigneeId: 'e-liwei',
    rules: [
      {
        // 继承 DispatchRule 必填字段
        id: 'ar-s1-1',
        name: 'VIP 客户工单 → 客户经理',
        code: 'AS-VIP-AM',
        condition: '客户等级=VIP',
        targetMode: 'person',
        targetPersonId: 'u-wangankang',
        target: '王安康（客户经理）',
        priority: 'high',
        enabled: true,
        hitCount: 0,
        // V1.1 扩展
        trigger: 'create',
        candidateScope: {
          type: 'dynamic',
          ids: [],
          dynamicExpr: '工单所属客户经理',
        },
        filters: [],
        strategy: 'fixed',
        rulePriority: 1,
        stopOnMatch: false,
      },
      {
        id: 'ar-s1-2',
        name: '网络设备故障 → 高级工程师',
        code: 'AS-NET-LB',
        condition: '设备类型=网络设备',
        targetMode: 'position',
        targetPosition: '高级现场工程师',
        target: '高级现场工程师岗位',
        priority: 'high',
        enabled: true,
        hitCount: 0,
        trigger: 'enter-node',
        triggerNodeId: 'fn-1',
        candidateScope: { type: 'position', ids: ['高级现场工程师'] },
        filters: [
          {
            id: 'flt-s1-2-1',
            field: 'workload',
            op: 'lt',
            value: 5,
            logic: 'and',
          },
        ],
        strategy: 'load-balance',
        rulePriority: 2,
        stopOnMatch: true,
      },
      {
        id: 'ar-s1-3',
        name: '默认派单 → 华东交付组',
        code: 'AS-FE-RR',
        condition: '默认规则',
        targetMode: 'position',
        targetPosition: '现场工程师',
        target: '华东交付组现场工程师',
        priority: 'medium',
        enabled: true,
        hitCount: 0,
        trigger: 'create',
        candidateScope: {
          type: 'position',
          ids: ['现场工程师', '高级现场工程师', '远程支持工程师'],
        },
        filters: [
          {
            id: 'flt-s1-3-1',
            field: 'status',
            op: 'eq',
            value: 'on',
            logic: 'and',
          },
        ],
        strategy: 'round-robin',
        rulePriority: 99,
        stopOnMatch: true,
        isDefault: true,
      },
    ],
  },
  {
    id: 'ap-s2',
    sceneId: 's2',
    defaultAssigneeId: 'u-wangankang',
    rules: [
      {
        id: 'ar-s2-1',
        name: '需求评审 → 二线技术支持',
        code: 'AS-PRD-T2',
        condition: '需求提交',
        targetMode: 'position',
        targetPosition: '远程支持工程师',
        target: '二线技术支持',
        priority: 'medium',
        enabled: true,
        hitCount: 0,
        trigger: 'enter-node',
        triggerNodeId: 'r1',
        candidateScope: { type: 'role', ids: ['role-tier2-support'] },
        strategy: 'round-robin',
        rulePriority: 1,
        stopOnMatch: true,
      },
    ],
  },
  {
    id: 'ap-s3',
    sceneId: 's3',
    defaultAssigneeId: 'e-liwei',
    rules: [
      {
        id: 'ar-s3-1',
        name: '上门工单 → 调度岗',
        code: 'AS-ONSITE',
        condition: '上门预约',
        targetMode: 'position',
        targetPosition: '调度岗',
        target: '调度岗',
        priority: 'medium',
        enabled: true,
        hitCount: 0,
        trigger: 'create',
        candidateScope: { type: 'role', ids: ['role-dispatcher'] },
        strategy: 'round-robin',
        rulePriority: 1,
        stopOnMatch: true,
      },
    ],
  },
];

// ---------------- SLA 策略（SlaPolicy）----------------

/** 预定义 SLA 邮件模板（供超时告警渠道引用） */
export const mockSlaEmailTemplates: SlaEmailTemplate[] = [
  {
    id: 'et-response-timeout-vip',
    name: 'VIP 工单响应超时邮件模板',
    content:
      '【VIP 工单响应超时】工单 {ticketCode} 已超时响应，请立即处理。客户：{customerName}，标题：{title}',
    scene: 'VIP 客户响应超时告警',
  },
  {
    id: 'et-resolve-timeout-vip',
    name: 'VIP 工单解决超时邮件模板',
    content:
      '【VIP 工单解决超时】工单 {ticketCode} 距创建已超 90 分钟未解决，请及时跟进。',
    scene: 'VIP 客户解决超时告警',
  },
  {
    id: 'et-response-timeout-onsite',
    name: '上门工单响应超时邮件模板',
    content:
      '【上门工单响应超时】工单 {ticketCode} 已超时，请立即安排上门。地址：{address}',
    scene: '上门工单响应超时告警',
  },
  {
    id: 'et-resolve-timeout-onsite',
    name: '上门工单解决超时邮件模板',
    content:
      '【上门工单解决超时】工单 {ticketCode} 已超 60 分钟未解决，请跟进。',
    scene: '上门工单解决超时告警',
  },
  {
    id: 'et-notify-leader',
    name: '工单超时通知主管邮件模板',
    content:
      '【工单超时通知】工单 {ticketCode} 已超时，处理人：{assigneeName}，请主管及时跟进。',
    scene: '通用超时通知主管',
  },
];

/** 计时模式选项 */
export const timingModeOptions: Array<{
  label: string;
  value: 'natural' | 'service' | 'working';
}> = [
  { label: '自然时间', value: 'natural' },
  { label: '工作时间', value: 'working' },
  { label: '服务时间', value: 'service' },
];

/** 通知对象选项 */
export const warnTargetOptions: Array<{
  label: string;
  value: 'assignee' | 'leader';
}> = [
  { label: '处理人', value: 'assignee' },
  { label: '主管', value: 'leader' },
];

/** 升级动作选项 */
export const escalateActionOptions: Array<{
  label: string;
  value: 'create-ticket' | 'notify-leader' | 'reassign' | 'upgrade-priority';
}> = [
  { label: '通知主管', value: 'notify-leader' },
  { label: '转派', value: 'reassign' },
  { label: '提高优先级', value: 'upgrade-priority' },
  { label: '创建升级工单', value: 'create-ticket' },
];

export const mockSlaPolicies: SlaPolicy[] = [
  {
    id: 'sp-s1-vip',
    sceneId: 's1',
    name: 'VIP 客户运维 SLA',
    code: 'SLA-VIP-OPS',
    applyConditionText: '客户等级为 VIP 的运维工单；7×24 小时响应。',
    applyCondition: {
      id: 'cond-sp-s1-vip',
      field: 'customerLevel',
      op: 'eq',
      value: 'VIP',
    },
    responseTarget: {
      hours: 0.5,
      timeMode: 'natural',
      startNodeId: 'fn-1',
      endNodeId: 'fn-3',
    },
    resolveTarget: {
      hours: 2,
      timeMode: 'natural',
      startNodeId: 'fn-3',
      endNodeId: 'fn-8',
    },
    pauseRules: [
      {
        id: 'pr-s1-vip-1',
        condition: {
          id: 'cond-pr-s1-vip-1',
          field: 'status',
          op: 'eq',
          value: 'fn-4',
        },
        maxPauseMinutes: 480,
        accumulate: true,
      },
    ],
    warnRules: [
      {
        id: 'wr-s1-vip-1',
        atMinutes: 25,
        target: 'assignee',
        channels: ['in-app', 'wecom'],
      },
      {
        id: 'wr-s1-vip-2',
        atMinutes: 28,
        target: 'leader',
        channels: ['wecom', 'email'],
      },
    ],
    escalateRules: [
      { id: 'er-s1-vip-1', atMinutes: 30, action: 'notify-leader' },
      { id: 'er-s1-vip-2', atMinutes: 60, action: 'reassign' },
      { id: 'er-s1-vip-3', atMinutes: 120, action: 'create-ticket' },
    ],
    responseAlertEnabled: true,
    responseTimeoutRules: [
      {
        id: 'rtr-s1-vip-1',
        description: '响应超时 25 分钟时通知处理人，28 分钟时升级至主管',
        atMinutes: 25,
        target: 'assignee',
        channels: ['in-app', 'wecom'],
      },
      {
        id: 'rtr-s1-vip-2',
        description: '响应超时 30 分钟后升级主管并重新派单',
        atMinutes: 30,
        target: 'leader',
        channels: ['wecom', 'email'],
        emailTemplateId: 'et-response-timeout-vip',
      },
    ],
    resolveAlertEnabled: true,
    resolveTimeoutRules: [
      {
        id: 'dtr-s1-vip-1',
        description: '解决超时 90 分钟时通知主管',
        atMinutes: 90,
        target: 'leader',
        channels: ['wecom', 'email'],
        emailTemplateId: 'et-resolve-timeout-vip',
      },
    ],
    enabled: true,
  },
  {
    id: 'sp-s1-normal',
    sceneId: 's1',
    name: '普通客户运维 SLA',
    code: 'SLA-NORMAL-OPS',
    applyConditionText: '客户等级非 VIP 的运维工单；工作时间响应。',
    applyCondition: {
      id: 'cond-sp-s1-normal',
      field: 'customerLevel',
      op: 'ne',
      value: 'VIP',
    },
    responseTarget: {
      hours: 2,
      timeMode: 'working',
      startNodeId: 'fn-1',
      endNodeId: 'fn-3',
      worktime: { start: '09:00', end: '18:00', days: [1, 2, 3, 4, 5] },
    },
    resolveTarget: {
      hours: 8,
      timeMode: 'working',
      startNodeId: 'fn-3',
      endNodeId: 'fn-8',
      worktime: { start: '09:00', end: '18:00', days: [1, 2, 3, 4, 5] },
    },
    warnRules: [
      {
        id: 'wr-s1-normal-1',
        atMinutes: 90,
        target: 'assignee',
        channels: ['in-app'],
      },
      {
        id: 'wr-s1-normal-2',
        atMinutes: 110,
        target: 'leader',
        channels: ['in-app', 'wecom'],
      },
    ],
    escalateRules: [
      { id: 'er-s1-normal-1', atMinutes: 120, action: 'notify-leader' },
      { id: 'er-s1-normal-2', atMinutes: 240, action: 'reassign' },
    ],
    responseAlertEnabled: false,
    responseTimeoutRules: [
      {
        id: 'rtr-s1-normal-1',
        description: '响应超时 90 分钟时通知处理人',
        atMinutes: 90,
        target: 'assignee',
        channels: ['in-app'],
      },
      {
        id: 'rtr-s1-normal-2',
        description: '响应超时 120 分钟后升级主管',
        atMinutes: 120,
        target: 'leader',
        channels: ['in-app', 'wecom'],
      },
    ],
    resolveAlertEnabled: false,
    resolveTimeoutRules: [
      {
        id: 'dtr-s1-normal-1',
        description: '解决超时 240 分钟时重新派单',
        atMinutes: 240,
        target: 'leader',
        channels: ['wecom'],
      },
    ],
    enabled: true,
  },
  {
    id: 'sp-s2-default',
    sceneId: 's2',
    name: '需求工单默认 SLA',
    code: 'SLA-REQ-DEFAULT',
    responseTarget: {
      hours: 4,
      timeMode: 'working',
      startNodeId: 'r1',
      endNodeId: 'r2',
      worktime: { start: '09:00', end: '18:00', days: [1, 2, 3, 4, 5] },
    },
    resolveTarget: {
      hours: 40,
      timeMode: 'working',
      startNodeId: 'r2',
      endNodeId: 'r6',
      worktime: { start: '09:00', end: '18:00', days: [1, 2, 3, 4, 5] },
    },
    warnRules: [
      {
        id: 'wr-s2-1',
        atMinutes: 180,
        target: 'assignee',
        channels: ['in-app'],
      },
    ],
    escalateRules: [{ id: 'er-s2-1', atMinutes: 240, action: 'notify-leader' }],
    responseAlertEnabled: false,
    responseTimeoutRules: [
      {
        id: 'rtr-s2-1',
        description: '响应超时 180 分钟时通知处理人',
        atMinutes: 180,
        target: 'assignee',
        channels: ['in-app'],
      },
    ],
    resolveAlertEnabled: false,
    resolveTimeoutRules: [
      {
        id: 'dtr-s2-1',
        description: '解决超时 240 分钟时通知主管',
        atMinutes: 240,
        target: 'leader',
        channels: ['in-app', 'wecom'],
      },
    ],
    enabled: true,
  },
  {
    id: 'sp-s3-default',
    sceneId: 's3',
    name: '上门工单 SLA',
    code: 'SLA-ONSITE',
    responseTarget: {
      hours: 0.5,
      timeMode: 'natural',
      startNodeId: 'o1',
      endNodeId: 'o3',
    },
    resolveTarget: {
      hours: 4,
      timeMode: 'natural',
      startNodeId: 'o3',
      endNodeId: 'o5',
    },
    warnRules: [
      {
        id: 'wr-s3-1',
        atMinutes: 25,
        target: 'assignee',
        channels: ['in-app', 'wecom'],
      },
      { id: 'wr-s3-2', atMinutes: 28, target: 'leader', channels: ['wecom'] },
    ],
    escalateRules: [
      { id: 'er-s3-1', atMinutes: 30, action: 'notify-leader' },
      { id: 'er-s3-2', atMinutes: 60, action: 'reassign' },
    ],
    responseAlertEnabled: true,
    responseTimeoutRules: [
      {
        id: 'rtr-s3-1',
        description: '响应超时 25 分钟时通知处理人',
        atMinutes: 25,
        target: 'assignee',
        channels: ['in-app', 'wecom'],
      },
      {
        id: 'rtr-s3-2',
        description: '响应超时 30 分钟后升级主管',
        atMinutes: 30,
        target: 'leader',
        channels: ['wecom', 'email'],
        emailTemplateId: 'et-response-timeout-onsite',
      },
    ],
    resolveAlertEnabled: true,
    resolveTimeoutRules: [
      {
        id: 'dtr-s3-1',
        description: '解决超时 60 分钟时重新派单',
        atMinutes: 60,
        target: 'leader',
        channels: ['wecom', 'email'],
        emailTemplateId: 'et-resolve-timeout-onsite',
      },
    ],
    enabled: true,
  },
];

// ---------------- 工单字段 AI 推荐建议（基于场景描述 / 制度条款）----------------

export const mockFieldAiSuggestions: FieldAiSuggestion[] = [
  // ===== 运维工单字段（保留不变） =====
  {
    id: 'ai-field-1',
    source: '场景关键词：设备故障报修',
    reason:
      '场景描述提及"办公设备故障"，建议新增「设备编号」字段用于关联资产台账，并作为派单条件维度之一。',
    suggestion: {
      name: '设备编号',
      code: 'deviceCode',
      type: 'text',
      required: true,
      usedInWorkflow: true,
      usedInDispatch: true,
    },
  },
  {
    id: 'ai-field-2',
    source: '场景关键词：故障类型分类',
    reason:
      '场景描述涉及打印机/投影/网络等多类故障，建议新增「故障类型」下拉字段，便于统计分析与按类型派单。',
    suggestion: {
      name: '故障类型',
      code: 'faultType',
      type: 'select',
      required: true,
      dataSource: 'dict_fault_type',
      usedInWorkflow: true,
      usedInDispatch: true,
    },
  },
  {
    id: 'ai-field-3',
    source: '场景关键词：SLA 升级判定',
    reason:
      '场景描述提及"故障严重或处理超时需升级"，建议新增「紧急程度」字段作为 SLA 升级判定维度。',
    suggestion: {
      name: '紧急程度',
      code: 'urgencyLevel',
      type: 'select',
      required: true,
      dataSource: 'dict_urgency_level',
      usedInSla: true,
      usedInDispatch: true,
    },
  },
  // ===== 上门工单专属字段 =====
  {
    id: 'ai-field-onsite-1',
    source: '场景关键词：客户上门服务',
    reason:
      '上门工单必须明确客户位置，建议新增「服务地址」字段（含省/市/区/详细地址），支持智能地址解析，并作为派单的区域维度。',
    suggestion: {
      name: '服务地址',
      code: 'serviceAddress',
      type: 'address',
      required: true,
      usedInDispatch: true,
    },
  },
  {
    id: 'ai-field-onsite-2',
    source: '场景关键词：预约上门时间',
    reason:
      '场景描述提及工程师与客户预约上门时间，建议新增「预约时间窗口」字段（开始/结束），用于智能派单匹配和 SLA 计算。',
    suggestion: {
      name: '预约时间窗口',
      code: 'appointmentWindow',
      type: 'datetime',
      required: true,
      usedInWorkflow: true,
      usedInSla: true,
    },
  },
  {
    id: 'ai-field-onsite-3',
    source: '场景关键词：服务类型/技能匹配',
    reason:
      '上门服务含安装/维修/巡检等多种类型，建议新增「服务类型」下拉字段，关联技能标签，用于派单时匹配工程师能力。',
    suggestion: {
      name: '服务类型',
      code: 'serviceType',
      type: 'select',
      required: true,
      dataSource: 'dict_service_type',
      usedInDispatch: true,
    },
  },
  {
    id: 'ai-field-onsite-4',
    source: '场景关键词：客户验收',
    reason:
      '场景描述提到客户验收环节，建议新增「客户验收结果」字段（验收通过/验收不通过）和「验收说明」多行文本，验收不通过时自动触发重新上门。',
    suggestion: {
      name: '客户验收结果',
      code: 'customerAcceptance',
      type: 'select',
      required: true,
      dataSource: 'dict_acceptance',
      usedInWorkflow: true,
    },
  },
  {
    id: 'ai-field-onsite-5',
    source: '场景关键词：现场照片/定位',
    reason:
      '上门服务需要记录现场证据，建议新增「签到 GPS 定位」定位字段和「现场签到照片」图片字段，用于合规审计。',
    suggestion: {
      name: '签到定位',
      code: 'checkinLocation',
      type: 'location',
      required: true,
    },
  },
];

// ---------------- SLA AI 推荐建议（基于制度条款 / 合同）----------------

export const mockSlaAiSuggestions: SlaAiSuggestion[] = [
  // ===== 运维工单 SLA（保留不变） =====
  {
    id: 'ai-sla-1',
    source: '《IT 运维服务管理规范》第 5.2 条',
    reason:
      'VIP 客户要求 7×24 小时响应，响应时效 30 分钟、解决时效 2 小时；超时升级至主管并邮件通知。',
    suggestion: {
      name: 'VIP 客户运维 SLA',
      code: 'SLA-VIP-OPS',
      applyConditionText: '客户等级为 VIP 的运维工单；7×24 小时响应。',
      responseHours: 0.5,
      resolveHours: 2,
      responseTimeoutRules: [
        {
          id: `ai-rtr-1-${Date.now()}`,
          description: '响应超时 25 分钟时通知处理人',
          atMinutes: 25,
          target: 'assignee',
          channels: ['in-app', 'wecom'],
        },
        {
          id: `ai-rtr-2-${Date.now()}`,
          description: '响应超时 30 分钟后升级主管并邮件通知',
          atMinutes: 30,
          target: 'leader',
          channels: ['wecom', 'email'],
          emailTemplateId: 'et-response-timeout-vip',
        },
      ],
      resolveTimeoutRules: [
        {
          id: `ai-dtr-1-${Date.now()}`,
          description: '解决超时 90 分钟时通知主管',
          atMinutes: 90,
          target: 'leader',
          channels: ['wecom', 'email'],
          emailTemplateId: 'et-resolve-timeout-vip',
        },
      ],
    },
  },
  {
    id: 'ai-sla-2',
    source: '《IT 运维服务合同》附件 B 第 3 条',
    reason:
      '普通客户工作时间响应，响应时效 2 小时、解决时效 8 小时；超时 120 分钟升级主管。',
    suggestion: {
      name: '普通客户运维 SLA',
      code: 'SLA-NORMAL-OPS',
      applyConditionText: '客户等级非 VIP 的运维工单；工作时间响应。',
      responseHours: 2,
      resolveHours: 8,
      responseTimeoutRules: [
        {
          id: `ai-rtr-3-${Date.now()}`,
          description: '响应超时 90 分钟时通知处理人',
          atMinutes: 90,
          target: 'assignee',
          channels: ['in-app'],
        },
        {
          id: `ai-rtr-4-${Date.now()}`,
          description: '响应超时 120 分钟后升级主管',
          atMinutes: 120,
          target: 'leader',
          channels: ['in-app', 'wecom'],
        },
      ],
      resolveTimeoutRules: [
        {
          id: `ai-dtr-2-${Date.now()}`,
          description: '解决超时 240 分钟时重新派单',
          atMinutes: 240,
          target: 'leader',
          channels: ['wecom'],
        },
      ],
    },
  },
  // ===== 上门工单专属 SLA =====
  {
    id: 'ai-sla-onsite-1',
    source: '《上门服务管理规范》第 4 条',
    reason:
      '上门工单要求 30 分钟内响应、4 小时内到达现场；超时邮件通知主管并重新派单。',
    suggestion: {
      name: '上门工单标准 SLA',
      code: 'SLA-ONSITE-STD',
      applyConditionText: '涉及上门服务的工单；7×24 小时响应。',
      responseHours: 0.5,
      resolveHours: 4,
      responseTimeoutRules: [
        {
          id: `ai-rtr-5-${Date.now()}`,
          description: '响应超时 25 分钟时通知处理人',
          atMinutes: 25,
          target: 'assignee',
          channels: ['in-app', 'wecom'],
        },
        {
          id: `ai-rtr-6-${Date.now()}`,
          description: '响应超时 30 分钟后升级主管',
          atMinutes: 30,
          target: 'leader',
          channels: ['wecom', 'email'],
          emailTemplateId: 'et-response-timeout-onsite',
        },
      ],
      resolveTimeoutRules: [
        {
          id: `ai-dtr-3-${Date.now()}`,
          description: '到达超时 180 分钟时重新派单',
          atMinutes: 180,
          target: 'leader',
          channels: ['wecom', 'email'],
          emailTemplateId: 'et-resolve-timeout-onsite',
        },
      ],
    },
  },
  {
    id: 'ai-sla-onsite-2',
    source: '《VIP 客户上门服务承诺》第 2 条',
    reason:
      'VIP 客户要求 15 分钟内响应、2 小时内到达现场；超时升级至服务总监并电话通知。',
    suggestion: {
      name: 'VIP 客户上门 SLA',
      code: 'SLA-ONSITE-VIP',
      applyConditionText: '客户等级为 VIP 的上门工单；7×24 小时响应。',
      responseHours: 0.25,
      resolveHours: 2,
      responseTimeoutRules: [
        {
          id: `ai-rtr-7-${Date.now()}`,
          description: '响应超时 10 分钟时短信提醒处理人',
          atMinutes: 10,
          target: 'assignee',
          channels: ['sms', 'in-app'],
        },
        {
          id: `ai-rtr-8-${Date.now()}`,
          description: '响应超时 15 分钟后升级服务总监',
          atMinutes: 15,
          target: 'leader',
          channels: ['phone', 'wecom', 'email'],
          emailTemplateId: 'et-response-timeout-onsite-vip',
        },
      ],
      resolveTimeoutRules: [
        {
          id: `ai-dtr-4-${Date.now()}`,
          description: '到达超时 90 分钟时立即重新派单并电话通知客户',
          atMinutes: 90,
          target: 'leader',
          channels: ['phone', 'wecom'],
        },
      ],
    },
  },
  {
    id: 'ai-sla-onsite-3',
    source: '《大型设备紧急抢修管理办法》第 3 条',
    reason:
      '关键设备紧急抢修需 1 小时内到达现场；超时视为重大服务事故，升级至运维经理并邮件通知客户对接人。',
    suggestion: {
      name: '紧急抢修上门 SLA',
      code: 'SLA-ONSITE-URGENT',
      applyConditionText: '服务类型=紧急抢修 的上门工单。',
      responseHours: 0.5,
      resolveHours: 1,
      responseTimeoutRules: [
        {
          id: `ai-rtr-9-${Date.now()}`,
          description: '响应超时 25 分钟时通知处理人 + 主管',
          atMinutes: 25,
          target: 'leader',
          channels: ['in-app', 'wecom'],
        },
      ],
      resolveTimeoutRules: [
        {
          id: `ai-dtr-5-${Date.now()}`,
          description: '到达超时 60 分钟时升级运维经理 + 通知客户',
          atMinutes: 60,
          target: 'leader',
          channels: ['wecom', 'email', 'phone'],
          emailTemplateId: 'et-onsite-urgent-escalation',
        },
      ],
    },
  },
];

// ---------------- 状态流程 AI 推荐建议（基于制度条款，提供状态定义建议）----------------

export const mockStatusFlowAiSuggestions: StatusFlowAiSuggestion[] = [
  // ===== 运维工单（保留不变） =====
  {
    id: 'ai-flow-1',
    source: '《IT 运维服务管理规范》第 5.1 条',
    reason:
      '运维工单闭环流程需覆盖派单、响应、处理、验收、关闭五个关键环节；每个环节应明确责任人及状态流转规则。',
    suggestion: {
      scenarioType: '运维工单',
      nodes: [
        {
          code: 'PENDING',
          name: '待派单',
          type: 'start',
          order: 1,
          desc: '工单创建后等待派单',
          colorKey: 'amber',
          system: true,
        },
        {
          code: 'DISPATCHED',
          name: '待接单',
          type: 'normal',
          order: 2,
          desc: '已派单至处理人，等待确认接单',
          colorKey: 'blue',
          system: true,
        },
        {
          code: 'PROCESSING',
          name: '处理中',
          type: 'normal',
          order: 3,
          desc: '处理人已开始现场/远程处理',
          colorKey: 'green',
          system: true,
        },
        {
          code: 'PENDING_ACCEPTANCE',
          name: '待验收',
          type: 'decision',
          order: 4,
          desc: '处理完成，等待客户/创建人验收',
          colorKey: 'purple',
          system: true,
        },
        {
          code: 'COMPLETED',
          name: '已完成',
          type: 'end',
          order: 5,
          desc: '验收通过，工单正常关闭',
          colorKey: 'teal',
          system: true,
        },
        {
          code: 'CANCELLED',
          name: '已取消',
          type: 'end',
          order: 6,
          desc: '创建人主动取消',
          colorKey: 'gray',
          system: true,
        },
      ],
    },
  },
  // ===== 上门工单 - 标准流程 =====
  {
    id: 'ai-flow-onsite-1',
    source: '《上门服务管理规范》第 4.1 条',
    reason:
      '标准上门流程需覆盖 预约→上门途中→签到→客户确认→现场处理→完工测试→客户验收 7 个核心环节；签到和验收为强制节点，验收不通过自动转"重新安排"。',
    suggestion: {
      scenarioType: '上门工单',
      nodes: [
        {
          code: 'PENDING',
          name: '待派单',
          type: 'start',
          order: 1,
          desc: '工单创建后等待系统/人工派单',
          colorKey: 'amber',
          system: true,
        },
        {
          code: 'SCHEDULING',
          name: '预约中',
          type: 'suspend',
          order: 2,
          desc: '派单后工程师与客户电话/短信预约时间',
          colorKey: 'coral',
          system: false,
        },
        {
          code: 'DISPATCHED',
          name: '已预约',
          type: 'normal',
          order: 3,
          desc: '预约确认后，生成行程安排',
          colorKey: 'blue',
          system: true,
        },
        {
          code: 'EN_ROUTE',
          name: '上门途中',
          type: 'normal',
          order: 4,
          desc: '工程师出发前往客户地址',
          colorKey: 'cyan',
          system: false,
        },
        {
          code: 'ONSITE',
          name: '现场服务中',
          type: 'normal',
          order: 5,
          desc: '工程师到达现场，签到后开始处理',
          colorKey: 'green',
          system: true,
        },
        {
          code: 'WAITING_PARTS',
          name: '等备件',
          type: 'suspend',
          order: 5.5,
          desc: '现场诊断发现缺少备件，SLA 暂停',
          colorKey: 'pink',
          system: false,
        },
        {
          code: 'ONSITE_DONE',
          name: '待验收',
          type: 'decision',
          order: 6,
          desc: '现场处理完成，等待客户验收',
          colorKey: 'purple',
          system: true,
        },
        {
          code: 'RESCHEDULE',
          name: '重新安排',
          type: 'decision',
          order: 6.5,
          desc: '验收不通过，需重新安排上门',
          colorKey: 'orange',
          system: false,
        },
        {
          code: 'COMPLETED',
          name: '已完成',
          type: 'end',
          order: 7,
          desc: '客户验收通过，工单正常关闭',
          colorKey: 'teal',
          system: true,
        },
        {
          code: 'CANCELLED',
          name: '已取消',
          type: 'end',
          order: 8,
          desc: '客户主动取消服务',
          colorKey: 'gray',
          system: true,
        },
      ],
    },
  },
  // ===== 上门工单 - 紧急抢修 =====
  {
    id: 'ai-flow-onsite-2',
    source: '《大型设备紧急抢修管理办法》第 3.2 条',
    reason:
      '紧急抢修场景简化预约环节，直接进入"出发→途中→到达"，突出"签到确认"和"抢修报告"两个关键节点；支持连续多次上门（一次诊断、二次更换）。',
    suggestion: {
      scenarioType: '紧急抢修',
      nodes: [
        {
          code: 'PENDING',
          name: '紧急待派单',
          type: 'start',
          order: 1,
          desc: '紧急工单，需 5 分钟内派单',
          colorKey: 'amber',
          system: true,
        },
        {
          code: 'EN_ROUTE',
          name: '紧急出发',
          type: 'normal',
          order: 2,
          desc: '工程师立即出发，电话确认客户位置',
          colorKey: 'red',
          system: false,
        },
        {
          code: 'ONSITE',
          name: '现场抢修中',
          type: 'normal',
          order: 3,
          desc: '到达现场签到，开始紧急抢修',
          colorKey: 'green',
          system: true,
        },
        {
          code: 'WAITING_PARTS',
          name: '紧急等件',
          type: 'suspend',
          order: 3.5,
          desc: '紧急调拨备件，SLA 暂停',
          colorKey: 'pink',
          system: false,
        },
        {
          code: 'ONSITE_DONE',
          name: '抢修完成待确认',
          type: 'decision',
          order: 4,
          desc: '抢修完成，客户/值班经理现场签字',
          colorKey: 'purple',
          system: true,
        },
        {
          code: 'REPAIR_REPORT',
          name: '抢修报告',
          type: 'normal',
          order: 5,
          desc: '工程师提交抢修报告和照片',
          colorKey: 'blue',
          system: false,
        },
        {
          code: 'COMPLETED',
          name: '已完成',
          type: 'end',
          order: 6,
          desc: '抢修报告归档，工单关闭',
          colorKey: 'teal',
          system: true,
        },
      ],
    },
  },
  // ===== 上门工单 - 定期巡检 =====
  {
    id: 'ai-flow-onsite-3',
    source: '《定期巡检上门服务规范》第 2.1 条',
    reason:
      '定期巡检类上门工单流程更精简，强调"批量签到"（同一客户多个点位）和"巡检报告"提交；异常发现需升级处理。',
    suggestion: {
      scenarioType: '定期巡检',
      nodes: [
        {
          code: 'PENDING',
          name: '待排班',
          type: 'start',
          order: 1,
          desc: '巡检计划生成后等待排班',
          colorKey: 'amber',
          system: true,
        },
        {
          code: 'PLANNED',
          name: '已排班',
          type: 'normal',
          order: 2,
          desc: '工程师已确认巡检计划',
          colorKey: 'blue',
          system: false,
        },
        {
          code: 'INSPECTING',
          name: '巡检中',
          type: 'normal',
          order: 3,
          desc: '逐点位签到巡检，采集数据',
          colorKey: 'green',
          system: true,
        },
        {
          code: 'ABNORMAL',
          name: '发现异常',
          type: 'decision',
          order: 4,
          desc: '巡检发现异常，自动创建维修工单',
          colorKey: 'orange',
          system: false,
        },
        {
          code: 'INSPECT_DONE',
          name: '待报告',
          type: 'decision',
          order: 5,
          desc: '所有点位巡检完成，等待提交巡检报告',
          colorKey: 'purple',
          system: true,
        },
        {
          code: 'COMPLETED',
          name: '已完成',
          type: 'end',
          order: 6,
          desc: '巡检报告审核通过，工单关闭',
          colorKey: 'teal',
          system: true,
        },
      ],
    },
  },
];

// ---------------- 平台层级动作事件（工单流转可绑定的事件集合）----------------

export const mockPlatformActionEvents: PlatformActionEvent[] = [
  {
    code: 'submit',
    name: '提交',
    category: 'common',
    desc: '通用提交动作，触发状态向后流转',
  },
  {
    code: 'approve',
    name: '审批通过',
    category: 'common',
    desc: '审批环节通过，进入下一状态',
  },
  {
    code: 'reject',
    name: '驳回',
    category: 'common',
    desc: '审批不通过，回退到上一状态',
  },
  {
    code: 'assign',
    name: '派单',
    category: 'common',
    desc: '指派处理人，工单进入待处理',
  },
  {
    code: 'transfer',
    name: '转派',
    category: 'common',
    desc: '改派到其他处理人',
  },
  {
    code: 'start-process',
    name: '开始处理',
    category: 'common',
    desc: '处理人开始作业',
  },
  {
    code: 'complete',
    name: '完成处理',
    category: 'common',
    desc: '处理完成，提交验收',
  },
  {
    code: 'accept',
    name: '验收通过',
    category: 'common',
    desc: '客户/创建人验收通过',
  },
  {
    code: 'accept-reject',
    name: '验收不通过',
    category: 'common',
    desc: '验收未通过，回退处理',
  },
  {
    code: 'cancel',
    name: '取消',
    category: 'common',
    desc: '创建人主动取消工单',
  },
  {
    code: 'suspend',
    name: '挂起',
    category: 'sla',
    desc: '挂起工单（如等备件），SLA 暂停计时',
  },
  {
    code: 'resume',
    name: '恢复',
    category: 'sla',
    desc: '恢复挂起的工单，SLA 继续计时',
  },
  {
    code: 'escalate',
    name: '升级',
    category: 'notify',
    desc: '升级到上级主管处理',
  },
  {
    code: 'notify',
    name: '通知',
    category: 'notify',
    desc: '发送通知给相关人员',
  },
  {
    code: 'create-subtask',
    name: '发起协助子任务',
    category: 'subtask',
    desc: '创建内嵌子工单，主工单等待',
  },
  {
    code: 'subtask-callback',
    name: '子任务回填',
    category: 'subtask',
    desc: '子任务完成回填，触发主工单异步流转',
  },
  {
    code: 'auto-dispatch',
    name: '自动派单',
    category: 'system',
    desc: '系统按派单规则自动指派',
  },
  {
    code: 'timeout-escalate',
    name: '超时升级',
    category: 'system',
    desc: 'SLA 超时触发自动升级',
  },
];

// ---------------- 状态流转：处理人角色下拉选项（岗位 / 角色 / 用户）----------------

/** 岗位列表（指定岗位时下拉选项） */
export const mockPositions = [
  { id: 'pos-01', name: '客户经理', code: 'AM' },
  { id: 'pos-02', name: '现场工程师', code: 'FE' },
  { id: 'pos-03', name: '运维专员', code: 'OPS' },
  { id: 'pos-04', name: '技术主管', code: 'TL' },
  { id: 'pos-05', name: '服务台坐席', code: 'SD' },
];

/** 角色列表（指定角色时下拉选项，与 TicketRole 枚举对应） */
export const mockRoles = [
  { id: 'role-am', name: '客户经理', code: 'account-manager' },
  { id: 'role-emp', name: '公司员工', code: 'employee' },
  { id: 'role-fe', name: '一线人员', code: 'field-engineer' },
  { id: 'role-ops', name: '运维人员', code: 'ops-staff' },
];

/** 用户列表（指定人员时下拉选项） */
export const mockStaffs = [
  { id: 'u-1001', name: '张伟', account: 'zhangwei' },
  { id: 'u-1002', name: '李娜', account: 'lina' },
  { id: 'u-1003', name: '王磊', account: 'wanglei' },
  { id: 'u-1004', name: '刘静宇', account: 'liujy' },
  { id: 'u-1005', name: '陈思琪', account: 'chensq' },
  { id: 'u-1006', name: '赵晓明', account: 'zhaoxm' },
  { id: 'u-1007', name: '孙浩然', account: 'sunhr' },
  { id: 'u-1008', name: '周敏', account: 'zhoumin' },
  { id: 'u-1009', name: '高学义', account: 'gaoxy' },
];

// ---------------- 派单 AI 推荐建议（基于制度条款 / 业务规则）----------------

export const mockAssignmentAiSuggestions: AssignmentAiSuggestion[] = [
  // ===== 运维工单派单规则（保留不变） =====
  {
    id: 'ai-assign-1',
    source: '《IT 运维服务管理规范》第 5.2 条',
    reason:
      'VIP 客户工单优先派单至客户经理本人；建议使用动态人员表达式派单，确保专人跟进。',
    suggestion: {
      name: 'VIP 客户工单 → 客户经理',
      code: 'AS-VIP-AM',
      trigger: 'create',
      applyConditionText: '客户等级=VIP',
      candidateScopeType: 'dynamic',
      dynamicExpr: '工单所属客户经理',
    },
  },
  {
    id: 'ai-assign-2',
    source: '《网络设备运维手册》第 3 条',
    reason:
      '网络设备故障按岗位派单至高级现场工程师，使用负载均衡策略分散负载，避免单人过载。',
    suggestion: {
      name: '网络设备故障 → 高级工程师',
      code: 'AS-NET-LB',
      trigger: 'enter-node',
      applyConditionText: '设备类型=网络设备',
      candidateScopeType: 'position',
      targetPosition: '高级现场工程师',
      strategy: 'load-balance',
    },
  },
  {
    id: 'ai-assign-3',
    source: '《二线技术支持管理办法》第 6 条',
    reason: '复杂技术问题按角色派单至二线技术支持，使用轮询策略均衡分配。',
    suggestion: {
      name: '复杂技术问题 → 二线技术支持（轮询）',
      code: 'AS-T2-RR',
      trigger: 'action',
      applyConditionText: '工单标签=复杂技术问题',
      candidateScopeType: 'role',
      targetRoleId: 'role-tier2-support',
      strategy: 'round-robin',
    },
  },
  // ===== 上门工单专属派单规则 =====
  {
    id: 'ai-assign-onsite-1',
    source: '《现场服务排班规范》第 4 条',
    reason:
      '上门工单按区域派单给该区域的现场工程师，使用轮询策略均衡分配；同区域客户优先匹配。',
    suggestion: {
      name: '上门工单 → 同区域现场工程师（轮询）',
      code: 'AS-ONSITE-RR',
      trigger: 'create',
      applyConditionText: '工单类型=上门服务',
      candidateScopeType: 'position',
      targetPosition: '现场工程师',
      strategy: 'round-robin',
    },
  },
  {
    id: 'ai-assign-onsite-2',
    source: '《紧急抢修调度办法》第 2 条',
    reason:
      '紧急抢修上门工单使用"最近可用"策略，匹配当前位置距客户地址最近的工程师；技能校验前置。',
    suggestion: {
      name: '紧急抢修 → 最近可用工程师（技能匹配）',
      code: 'AS-ONSITE-URGENT',
      trigger: 'create',
      applyConditionText: '服务类型=紧急抢修 AND 优先级=紧急',
      candidateScopeType: 'dynamic',
      dynamicExpr: '技能匹配 + 当前位置最近 + 空闲状态',
      strategy: 'nearest-available',
    },
  },
  {
    id: 'ai-assign-onsite-3',
    source: '《定期巡检上门服务规范》第 3 条',
    reason:
      '定期巡检类上门工单按巡检计划批量派单，同一客户的多个点位合并到同一位工程师同一天完成。',
    suggestion: {
      name: '定期巡检 → 同一客户合并派单',
      code: 'AS-INSPECTION-BATCH',
      trigger: 'create',
      applyConditionText: '服务类型=定期巡检',
      candidateScopeType: 'position',
      targetPosition: '巡检工程师',
      strategy: 'batch-by-customer',
    },
  },
  {
    id: 'ai-assign-onsite-4',
    source: '《重新上门处理流程》第 5 条',
    reason:
      '客户验收不通过触发"重新安排"时，优先派给上次的工程师（熟悉情况），失败再切换同区域其他工程师。',
    suggestion: {
      name: '验收不通过 → 原处理工程师优先',
      code: 'AS-RESCHEDULE-FIRST',
      trigger: 'enter-node',
      applyConditionText: '工单状态=重新安排',
      candidateScopeType: 'dynamic',
      dynamicExpr: '上一次处理工程师',
      fallbackPosition: '现场工程师',
    },
  },
];

// ---------------- 深拷贝工具（运行时改动不污染全局 mock）----------------

/** 深拷贝工单模型列表 */
export function cloneTicketSchemas(): TicketSchema[] {
  return structuredClone(mockTicketSchemas);
}

/** 深拷贝工单动作列表 */
export function cloneTicketActions(): TicketAction[] {
  return structuredClone(mockTicketActions);
}

/** 深拷贝派单策略列表 */
export function cloneAssignmentPolicies(): AssignmentPolicy[] {
  return structuredClone(mockAssignmentPolicies);
}

/** 深拷贝 SLA 策略列表 */
export function cloneSlaPolicies(): SlaPolicy[] {
  return structuredClone(mockSlaPolicies);
}

/** 深拷贝工单场景列表 */
export function cloneTicketScenarios(): TicketScenario[] {
  return structuredClone(mockTicketScenarios);
}

/** 按场景 id 查工单模型 */
export function getTicketSchemaByScene(
  sceneId: string,
): TicketSchema | undefined {
  return mockTicketSchemas.find((s) => s.sceneId === sceneId);
}

/** 按场景 id 查派单策略 */
export function getAssignmentPolicyByScene(
  sceneId: string,
): AssignmentPolicy | undefined {
  return mockAssignmentPolicies.find((p) => p.sceneId === sceneId);
}

/** 按场景 id 查 SLA 策略列表 */
export function getSlaPoliciesByScene(sceneId: string): SlaPolicy[] {
  return mockSlaPolicies.filter((p) => p.sceneId === sceneId);
}

// ---------------- 工单详情 · AI 处理建议（详情页右栏）----------------

/** 按工单类型组织的一套建议内容包 */
interface AiAdvisorPack {
  compliance: TicketAiAdvisor['compliance'];
  processSteps: TicketAiAdvisor['standardProcess']['steps'];
  cases: TicketAiAdvisor['similarCases']['cases'];
  plans: TicketAiAdvisor['plans']['plans'];
}

/**
 * 按工单类型生成差异化建议内容包。
 * 未覆盖的类型回退到通用内容。
 */
const aiAdvisorPacks: Record<string, AiAdvisorPack> = {
  设备故障: {
    compliance: [
      {
        id: 'cmp-1',
        title: '紧急工单须在响应时限内完成首次响应',
        content:
          '本工单为设备故障且优先级较高，按制度要求须在接单后 30 分钟内完成客户首次响应（电话或在线确认），并在处理记录中留存首次响应时间。',
        severity: 'required',
        clauses: [
          {
            docName: '《IT 运维服务管理规范》',
            clauseNo: '第 5.2 条',
            clauseText:
              '紧急及高优先级故障工单，处理人应在接单后 30 分钟内完成首次响应，2 小时内给出初步诊断结论。',
          },
        ],
        reviewStatus: 'reviewed',
      },
      {
        id: 'cmp-2',
        title: '现场处理涉及客户业务数据须遵守数据安全要求',
        content:
          '排查过程如需查看客户业务系统数据，仅限现场演示所需最小范围；禁止将客户数据拷贝至个人设备或外部存储，截图脱敏后方可作为附件上传。',
        severity: 'required',
        clauses: [
          {
            docName: '《客户数据安全管理办法》',
            clauseNo: '第 4.1 条',
            clauseText:
              '服务人员在客户现场访问业务数据时，应遵循最小授权原则；任何形式的客户数据导出须提前取得客户书面授权。',
          },
        ],
        reviewStatus: 'reviewed',
      },
      {
        id: 'cmp-3',
        title: '闭环须上传处理方案与验证凭证',
        content:
          '完成处理后须填写处理方案，并上传连续验证截图或视频；涉及现场作业的，需补充带时间地点水印的打卡照片。',
        severity: 'recommended',
        clauses: [
          {
            docName: '《工单闭环质量管理办法》',
            clauseNo: '第 3.4 条',
            clauseText:
              '设备故障类工单闭环材料包括：处理方案说明、验证凭证（截图/视频）、现场作业凭证（如适用）。',
          },
        ],
        reviewStatus: 'reviewed',
      },
    ],
    processSteps: [
      {
        name: '接单响应',
        desc: '联系联系人确认故障现象与现场可访问时间',
        owner: '一线服务部',
        sla: '接单后 30 分钟',
        done: true,
      },
      {
        name: '远程初判',
        desc: '调取设备日志与告警，按「耗材 → 参数 → 机械」顺序初判',
        owner: '技术支持组',
        sla: '2 小时内',
        done: true,
      },
      {
        name: '现场处置',
        desc: '携带可能备件上门，现场复现并定位根因',
        owner: '现场工程部',
        sla: '4 小时内到场',
        done: false,
      },
      {
        name: '验证与闭环',
        desc: '连续运行验证 30 次确认稳定，上传闭环材料',
        owner: '质量保障部',
        sla: '当日完成',
        done: false,
      },
    ],
    cases: [
      {
        id: 'sc-1',
        code: 'WO-2025-0187',
        title: '激光打标机出光功率骤降，打标深度不足',
        similarity: 93,
        customerMasked: '杭*恒**电子科技',
        problem:
          '客户反馈打标深度变浅，功率显示正常但实际出光衰减约 40%，现场判断为振镜镜片污染叠加冷却水温漂移。',
        solution:
          '更换场镜保护镜片，重新标定冷水机温度阈值（22±0.5℃），并对光路做全链路校准。',
        result: '功率恢复至出厂 96%，连续 8 小时运行无衰减，客户验收通过。',
        lesson:
          '同型号设备功率类故障优先检查保护镜片与冷却水温，可减少 60% 的误换激光器情况。',
        durationHours: 3.5,
        handler: '王*',
        completedAt: '2025-08-12',
      },
      {
        id: 'sc-2',
        code: 'WO-2025-0142',
        title: '打标图形错位，振镜漂移',
        similarity: 86,
        customerMasked: '苏州明**精密制造',
        problem:
          '批量打标出现图形整体偏移，偶发间歇性漂移，与产线振动环境相关。',
        solution:
          '重新做振镜校正并加固减震垫，固件升级至 V2.3 修复漂移补偿参数丢失问题。',
        result: '偏移量收敛至 ±0.02mm，一周回访无复发。',
        lesson: '振动环境的设备建议每次保养必做振镜校正，并检查减震垫老化。',
        durationHours: 4,
        handler: '刘**',
        completedAt: '2025-07-03',
      },
      {
        id: 'sc-3',
        code: 'WO-2025-0096',
        title: '设备开机报冷水机水流异常',
        similarity: 78,
        customerMasked: '宁波瑞**自动化',
        problem:
          '开机自检报 E03 水流异常，实际水路通畅，判断为流量传感器老化误报。',
        solution: '更换流量传感器并更新报警阈值标定。',
        result: '报警消除，传感器读数稳定，客户验收通过。',
        lesson: 'E03 报警先排查传感器再查水路，可避免无效拆机。',
        durationHours: 2.5,
        handler: '陈**',
        completedAt: '2025-05-21',
      },
      {
        id: 'sc-4',
        code: 'WO-2024-0311',
        title: '打标字符残缺，疑似场镜老化',
        similarity: 71,
        customerMasked: '佛山鼎**五金',
        problem: '边缘区域字符残缺，中心区域正常，确认场镜边缘进光量衰减。',
        solution: '更换同规格场镜并重做幅面校准。',
        result: '全幅面打标均匀，验收通过。',
        lesson: '使用超过 2 年的场镜建议在保养时安排预防性更换。',
        durationHours: 3,
        handler: '赵**',
        completedAt: '2024-11-08',
      },
    ],
    plans: [
      {
        id: 'plan-1',
        name: '方案 A · 现场更换备件 + 光路校准（AI 首选）',
        recommended: true,
        confidence: 92,
        applicableScene:
          '故障可复现、客户现场具备停机条件、备件库存可用（类似案例成功率 94%）',
        expectedEffect: '预计 3-4 小时恢复功率至出厂水平，一次闭环概率高',
        risks: [
          '备件若缺货需协调调拨，可能延长 1 个工作日',
          '光路校准依赖工程师经验，需携带校准工装',
        ],
        steps: [
          '调取备件库存并申请出库（保护镜片 + 场镜备件）',
          '上门更换备件并做全链路光路校准',
          '连续运行验证 30 次，记录功率曲线',
          '上传闭环材料并回访确认',
        ],
        estimatedHours: 4,
      },
      {
        id: 'plan-2',
        name: '方案 B · 远程参数修复 + 观察复测',
        recommended: false,
        confidence: 68,
        applicableScene: '故障为参数漂移类、客户不便停机、需要快速恢复基本可用',
        expectedEffect: '1 小时内恢复基本打标能力，但根因未排除，存在复发风险',
        risks: [
          '治标不治本，2 周内复发概率约 35%',
          '远程操作需客户 IT 配合开放权限',
        ],
        steps: [
          '远程会话接入设备，导出当前参数快照',
          '按基线参数回滚并小批量试打',
          '约定 72 小时观察期，必要时升级现场处理',
        ],
        estimatedHours: 1.5,
      },
      {
        id: 'plan-3',
        name: '方案 C · 设备返厂大修',
        recommended: false,
        confidence: 41,
        applicableScene: '光路核心器件（激光器/振镜）损坏且现场无法修复',
        expectedEffect: '彻底修复，周期 5-7 个工作日，成本最高',
        risks: [
          '客户停产影响大，需提前签署停机协议',
          '运输过程存在二次损伤风险',
        ],
        steps: [
          '现场初步检测并出具返厂评估单',
          '与客户确认返厂窗口与备用方案',
          '返厂检测维修后整机复检发货',
        ],
        estimatedHours: 40,
      },
    ],
  },
  配件更换: {
    compliance: [
      {
        id: 'cmp-1',
        title: '备件更换须执行旧件回收登记',
        content:
          '更换下的旧件须拍照留档并在备件系统登记回收，属于客户资产的须当场与客户确认归属。',
        severity: 'required',
        clauses: [
          {
            docName: '《备件领用与回收管理规范》',
            clauseNo: '第 6.2 条',
            clauseText:
              '现场更换的备件须执行「新件出库、旧件回收」双向登记；质保期内旧件统一返厂检测。',
          },
        ],
        reviewStatus: 'reviewed',
      },
    ],
    processSteps: [
      {
        name: '备件核验',
        desc: '确认备件型号、批次与库存可用性',
        owner: '备件管理组',
        sla: '1 小时内',
        done: true,
      },
      {
        name: '出库审批',
        desc: '提交备件出库申请并关联本工单',
        owner: '备件管理组',
        sla: '2 小时内',
        done: true,
      },
      {
        name: '现场更换',
        desc: '按 SOP 更换并做参数校准',
        owner: '现场工程部',
        sla: '4 小时内完成',
        done: false,
      },
      {
        name: '验证闭环',
        desc: '对比更换前后数据，回收旧件登记',
        owner: '质量保障部',
        sla: '当日完成',
        done: false,
      },
    ],
    cases: [
      {
        id: 'sc-1',
        code: 'WO-2025-0203',
        title: '激光管老化更换，功率恢复',
        similarity: 90,
        customerMasked: '东莞启**激光',
        problem: '激光管使用 26 个月出现功率衰减至 70%，打标变浅。',
        solution: '更换同型号激光管并重做光路，旧件按流程返厂。',
        result: '功率恢复至 98%，验收通过。',
        lesson: '激光管寿命约 24 个月，保养时提前预警可避免突发停机。',
        durationHours: 3,
        handler: '王*',
        completedAt: '2025-08-30',
      },
      {
        id: 'sc-2',
        code: 'WO-2025-0117',
        title: '振镜电机异响更换',
        similarity: 82,
        customerMasked: '无锡精**光电',
        problem: '振镜电机异响伴随定位抖动，确诊电机轴承磨损。',
        solution: '更换振镜电机并做全幅面校正。',
        result: '噪音消除，定位精度达标。',
        lesson: '振镜异响多与轴承磨损相关，更换时建议连密封圈一并更换。',
        durationHours: 2.5,
        handler: '刘**',
        completedAt: '2025-06-14',
      },
      {
        id: 'sc-3',
        code: 'WO-2024-0298',
        title: '冷水机压缩机故障更换',
        similarity: 75,
        customerMasked: '常州恒**机电',
        problem: '冷水机制冷失效，压缩机启动电容烧毁导致停机保护。',
        solution: '更换压缩机组件并清洗冷凝器。',
        result: '制冷恢复正常，水温稳定。',
        lesson: '夏季高温期前建议巡检冷凝器散热，可显著降低压缩机故障率。',
        durationHours: 5,
        handler: '陈**',
        completedAt: '2024-09-19',
      },
    ],
    plans: [
      {
        id: 'plan-1',
        name: '方案 A · 正品备件更换 + 校准（AI 首选）',
        recommended: true,
        confidence: 90,
        applicableScene: '备件库存可用、故障已定位到具体部件',
        expectedEffect: '预计 3 小时完成更换与校准，性能恢复至标准值',
        risks: ['如开箱发现兼容性问题需换货，延长 1 个工作日'],
        steps: [
          '备件出库并核对型号批次',
          '上门按 SOP 更换',
          '参数校准 + 前后数据对比',
          '旧件回收登记并闭环',
        ],
        estimatedHours: 3,
      },
      {
        id: 'plan-2',
        name: '方案 B · 临时替代件过渡 + 正件补换',
        recommended: false,
        confidence: 55,
        applicableScene: '正件缺货且客户生产紧急',
        expectedEffect: '2 小时内恢复生产，正件到货后二次上门正式更换',
        risks: ['替代件性能差异需客户签字确认', '产生两次上门成本'],
        steps: ['协调同系列替代件', '临时更换并记录差异', '正件到货后正式更换'],
        estimatedHours: 2,
      },
    ],
  },
  定期保养: {
    compliance: [
      {
        id: 'cmp-1',
        title: '保养须按季度清单执行并留存参数快照',
        content:
          '本次为季度保养，须按《设备保养清单》逐项执行，保养前后各留存一份设备参数快照并上传。',
        severity: 'required',
        clauses: [
          {
            docName: '《设备定期保养管理规范》',
            clauseNo: '第 2.3 条',
            clauseText:
              '季度保养须覆盖光路、冷却、场镜、固件四项基础内容，并留存保养前后参数快照备查。',
          },
        ],
        reviewStatus: 'reviewed',
      },
    ],
    processSteps: [
      {
        name: '保养预约',
        desc: '与客户约定保养窗口与停机时间',
        owner: '客户服务部',
        sla: '提前 3 个工作日',
        done: true,
      },
      {
        name: '清单执行',
        desc: '按清单逐项执行光路/冷却/场镜/固件',
        owner: '现场工程部',
        sla: '当日 4 小时',
        done: false,
      },
      {
        name: '性能验证',
        desc: '功率衰减检测 + 连续运行验证',
        owner: '质量保障部',
        sla: '当日完成',
        done: false,
      },
      {
        name: '报告归档',
        desc: '上传保养记录与前后参数快照',
        owner: '一线服务部',
        sla: '1 个工作日内',
        done: false,
      },
    ],
    cases: [
      {
        id: 'sc-1',
        code: 'WO-2025-0166',
        title: 'Q2 季度保养：光路清洁 + 冷却液更换',
        similarity: 88,
        customerMasked: '杭州联**智能装备',
        problem: '例行季度保养，上季度功率衰减 5%，冷却液浑浊。',
        solution: '光路全链路清洁，更换冷却液与滤芯，固件升级。',
        result: '功率回升至 99%，各参数在标准区间。',
        lesson: '冷却液建议每季度更换，浑浊会加剧温漂影响功率稳定。',
        durationHours: 3,
        handler: '王*',
        completedAt: '2025-07-18',
      },
      {
        id: 'sc-2',
        code: 'WO-2025-0054',
        title: 'Q1 季度保养：振镜校正 + 场镜检查',
        similarity: 79,
        customerMasked: '苏州明**精密制造',
        problem: '例行保养，客户反馈近两个月边缘打标轻微变浅。',
        solution: '振镜校正、场镜清洁检查，更新打标参数基线。',
        result: '全幅面均匀性恢复，客户确认无需其他处理。',
        lesson: '保养时同步收集客户使用反馈，可提前发现 80% 的潜在问题。',
        durationHours: 3.5,
        handler: '刘**',
        completedAt: '2025-03-06',
      },
      {
        id: 'sc-3',
        code: 'WO-2024-0420',
        title: '年度深度保养 + 预防性备件更换',
        similarity: 72,
        customerMasked: '宁波瑞**自动化',
        problem: '年度保养，结合运行数据建议预防性更换保护镜片。',
        solution: '深度保养 + 预防性更换易损件，建立年度基线档案。',
        result: '全年故障率下降 45%，客户续签保养合同。',
        lesson: '预防性更换易损件的成本远低于故障停机损失。',
        durationHours: 5,
        handler: '陈**',
        completedAt: '2024-12-15',
      },
    ],
    plans: [
      {
        id: 'plan-1',
        name: '方案 A · 标准季度保养（AI 首选）',
        recommended: true,
        confidence: 95,
        applicableScene: '设备运行正常、按计划执行例行保养',
        expectedEffect: '设备参数回到基线，季度内故障风险显著降低',
        risks: ['保养需客户停机 3-4 小时，需提前确认窗口'],
        steps: [
          '按清单执行四项基础保养',
          '功率衰减与连续运行验证',
          '上传保养记录与参数快照',
        ],
        estimatedHours: 4,
      },
      {
        id: 'plan-2',
        name: '方案 B · 保养 + 预防性备件更换',
        recommended: false,
        confidence: 76,
        applicableScene: '易损件接近寿命周期、客户可接受小额外成本',
        expectedEffect: '延长设备稳定运行周期，减少下季度突发工单',
        risks: ['额外备件成本需客户确认', '整体耗时增加约 1 小时'],
        steps: [
          '评估易损件剩余寿命',
          '标准保养 + 更换高风险易损件',
          '建立更换档案并提醒下周期',
        ],
        estimatedHours: 5,
      },
    ],
  },
  技术咨询: {
    compliance: [
      {
        id: 'cmp-1',
        title: '咨询结论须基于知识库与官方资料并注明来源',
        content:
          '给出方案建议时须引用知识库文章或官方文档作为依据，不得凭经验直接下结论；涉及报价的须经商务复核。',
        severity: 'recommended',
        clauses: [
          {
            docName: '《技术咨询服务管理细则》',
            clauseNo: '第 4.5 条',
            clauseText:
              '技术咨询工单的答复内容应注明依据来源；涉及商务条款的答复须经商务部门复核后方可发出。',
          },
        ],
        reviewStatus: 'reviewed',
      },
    ],
    processSteps: [
      {
        name: '需求澄清',
        desc: '收集客户具体问题与期望输出',
        owner: '一线服务部',
        sla: '接单后 2 小时',
        done: true,
      },
      {
        name: '方案研究',
        desc: '检索知识库与历史工单，形成初步答复',
        owner: '技术支持组',
        sla: '1 个工作日',
        done: false,
      },
      {
        name: '验证演示',
        desc: '远程演示或沙箱验证关键结论',
        owner: '技术支持组',
        sla: '1 个工作日',
        done: false,
      },
      {
        name: '结论归档',
        desc: '输出咨询结论并沉淀知识库',
        owner: '知识管理组',
        sla: '2 个工作日',
        done: false,
      },
    ],
    cases: [
      {
        id: 'sc-1',
        code: 'WO-2025-0131',
        title: '咨询：异形曲面打标参数方案',
        similarity: 85,
        customerMasked: '深圳锐**科技',
        problem: '客户咨询曲面工件打标的参数组合方案。',
        solution: '基于知识库 KB-031 给出 3 组参数基线，并远程演示验证。',
        result: '客户采用方案 2，打标良率提升至 98.6%。',
        lesson:
          '曲面打标优先给「功率-速度-频率」三参数基线，客户自行微调效率最高。',
        durationHours: 2,
        handler: '刘**',
        completedAt: '2025-06-27',
      },
      {
        id: 'sc-2',
        code: 'WO-2025-0028',
        title: '咨询：设备升级换代选型对比',
        similarity: 76,
        customerMasked: '佛山鼎**五金',
        problem: '客户咨询现有设备是否升级及新旧型号对比。',
        solution: '输出选型对比报告，含 ROI 测算，商务复核后发出。',
        result: '客户按建议选择扩产而非替换，节省预算 30%。',
        lesson: '选型咨询务必附 ROI 测算，客户决策周期可缩短一半。',
        durationHours: 4,
        handler: '陈**',
        completedAt: '2025-02-13',
      },
      {
        id: 'sc-3',
        code: 'WO-2024-0389',
        title: '咨询：打标数据对接 MES 方案',
        similarity: 68,
        customerMasked: '常州恒**机电',
        problem: '客户咨询打标数据与 MES 系统对接方案。',
        solution: '提供标准 API 对接文档与联调支持，两周完成对接。',
        result: '数据对接上线，追溯覆盖全部产线。',
        lesson: 'MES 对接先确认数据字段映射表，可避免反复联调。',
        durationHours: 6,
        handler: '赵**',
        completedAt: '2024-10-22',
      },
    ],
    plans: [
      {
        id: 'plan-1',
        name: '方案 A · 知识库答复 + 远程演示（AI 首选）',
        recommended: true,
        confidence: 91,
        applicableScene: '问题有成熟解法、客户期望快速获得答复',
        expectedEffect: '1 个工作日内闭环，答复可追溯、有依据',
        risks: ['若问题超出知识库覆盖范围需升级二线'],
        steps: [
          '检索知识库与历史案例',
          '整理答复并注明来源',
          '远程演示验证',
          '结论沉淀知识库',
        ],
        estimatedHours: 2,
      },
      {
        id: 'plan-2',
        name: '方案 B · 二线专案支持',
        recommended: false,
        confidence: 62,
        applicableScene: '问题复杂、涉及跨产品线或多系统集成',
        expectedEffect: '深度方案输出，周期 3-5 个工作日',
        risks: ['占用二线资源，需排队排期', '客户等待时间较长需做好预期管理'],
        steps: ['提交二线支持申请', '组织专项研讨', '输出专案方案并评审'],
        estimatedHours: 8,
      },
    ],
  },
};

/** 兜底建议内容包（类型未覆盖时使用，定义为"设备故障"包） */
function defaultAdvisorPack(): AiAdvisorPack {
  const pack = aiAdvisorPacks['设备故障'];
  if (!pack) throw new Error('默认 AI 建议内容包缺失');
  return pack;
}

/** 工单类型 → 标准流程名称映射 */
const standardProcessNameByType: Record<string, string> = {
  定期保养: '《设备定期保养标准流程》SQ-04',
  技术咨询: '《技术咨询处理标准流程》SQ-07',
  设备故障: '《设备故障处置标准流程》SQ-02',
};
const STANDARD_PROCESS_FALLBACK = '《设备故障处置标准流程》SQ-02';

/** 常用短语（处理记录录入快捷选择） */
const defaultQuickPhrases: TicketAiAdvisor['quickPhrases'] = [
  {
    id: 'qp-1',
    tag: '响应',
    text: '已电话联系客户确认现场可访问时间，约定明日上午上门。',
  },
  {
    id: 'qp-2',
    tag: '诊断',
    text: '经初步排查，故障定位为部件老化，需更换备件处理。',
  },
  {
    id: 'qp-3',
    tag: '进度',
    text: '备件已申请出库，预计明日到货后安排上门更换。',
  },
  {
    id: 'qp-4',
    tag: '验证',
    text: '现场处理完成，已连续运行验证 30 次无异常，功率恢复至标准值。',
  },
  {
    id: 'qp-5',
    tag: '闭环',
    text: '处理方案与验证凭证已上传，旧件已回收登记，工单闭环。',
  },
  {
    id: 'qp-6',
    tag: '协调',
    text: '已与客户 IT 部门协调远程会话权限，安排明日远程接入排查。',
  },
];

/**
 * 根据工单生成 AI 处理建议（详情页右栏）。
 * 按工单类型匹配内容包，未覆盖类型使用通用内容。
 */
export function getTicketAiAdvisor(order: WorkOrder): TicketAiAdvisor {
  const pack = aiAdvisorPacks[order.type] ?? defaultAdvisorPack();

  // ---- 综合置信度：按类型与优先级微调 ----
  const confidenceByType: Record<string, number> = {
    设备故障: 92,
    配件更换: 90,
    定期保养: 95,
    技术咨询: 91,
    现场复测: 89,
  };
  const overallConfidence = confidenceByType[order.type] || 88;

  const isUrgent = order.priority === 'urgent' || order.priority === 'high';
  const matchReason = [
    `实施事项类型「${order.type}」命中标准流程库`,
    isUrgent ? '紧急程度为高，启用加急通道' : '常规优先级通道',
    order.device ? `关联设备「${order.device}」` : '通用设备流程',
  ].join('；');

  // ---- 待接单 AI 引导：基于当前问题、历史案例与制度要求给出接单/转派建议 ----
  // 演示规则：常规处置类问题历史经验充足建议接单；咨询/复测类建议转派给对口责任人
  const topCase = pack.cases[0];
  const avgSimilarity = Math.round(
    pack.cases.reduce((sum, c) => sum + c.similarity, 0) /
      (pack.cases.length || 1),
  );
  const policyAdvice = pack.compliance.find((c) => c.severity === 'required');
  let guideSuggestion: 'confirm' | 'transfer' =
    order.type === '设备故障' ||
    order.type === '配件更换' ||
    order.type === '定期保养'
      ? 'confirm'
      : 'transfer';
  // 工单级剧本覆盖为"建议转派"时，接单引导同步建议转派
  if (ticketScenarioOverrides[order.id]?.recommend === 'transfer') {
    guideSuggestion = 'transfer';
  }
  const acceptGuide: AcceptGuideAdvice | undefined =
    order.status === 'dispatched'
      ? {
          suggestion: guideSuggestion,
          confidence: Math.min(96, avgSimilarity + 5),
          conclusion:
            guideSuggestion === 'confirm'
              ? `当前问题与历史处理经验匹配度 ${avgSimilarity}%，具备成熟处置经验，建议确认接单并按推荐方案执行。`
              : `当前问题与历史处理经验匹配度仅 ${avgSimilarity}%，建议转派给更对口的责任人，避免超时与返工。`,
          reasons: [
            {
              type: 'match',
              title: `当前问题 · ${order.title || order.type}`,
              detail: `实施事项类型「${order.type}」，${
                isUrgent ? '紧急程度为高，需优先响应' : '常规优先级'
              }；${matchReason}。`,
            },
            {
              type: 'case',
              title: topCase
                ? `历史处理情况 · ${topCase.code} 等 ${pack.cases.length} 例相似工单`
                : '历史处理情况 · 暂无高相似案例',
              detail: topCase
                ? `${topCase.solution}；处理结果：${topCase.result}（平均相似度 ${avgSimilarity}%，过往平均 ${topCase.durationHours}h 闭环）。既有经验可直接复用。`
                : '知识库中暂无高相似度案例，建议由对应产品线工程师承接。',
            },
            {
              type: 'policy',
              title: '制度要求 · 《IT 运维服务管理规范》第 5 章',
              detail: policyAdvice
                ? `${policyAdvice.title}（依据 ${policyAdvice.clauses[0]?.docName ?? '《IT 运维服务管理规范》'} ${policyAdvice.clauses[0]?.clauseNo ?? '5.2'}）；接单后 15 分钟内确认受理、30 分钟内完成首次响应，超时计入 SLA 考核。`
                : '接单后 15 分钟内确认受理、30 分钟内完成首次响应，超时计入 SLA 考核。',
            },
          ],
          transferHint:
            guideSuggestion === 'transfer'
              ? '建议转派理由：历史经验匹配不足，直接接单存在超时与返工风险；转派时可附上以上 AI 分析供调度助手参考。'
              : undefined,
        }
      : undefined;

  return {
    generatedAt: '2025-09-28 10:32',
    overallConfidence,
    reviewStatus: 'reviewed',
    reviewer: '',
    acceptGuide,
    compliance: pack.compliance,
    standardProcess: {
      id: `sp-${order.id}`,
      name: standardProcessNameByType[order.type] ?? STANDARD_PROCESS_FALLBACK,
      matchReason,
      steps: pack.processSteps,
      reviewStatus: 'reviewed',
    },
    similarCases: {
      id: `sc-${order.id}`,
      cases: pack.cases,
      reviewStatus: 'reviewed',
    },
    plans: {
      id: `pl-${order.id}`,
      plans: pack.plans,
      reviewStatus: 'pending',
    },
    contextLinks: {
      id: `cx-${order.id}`,
      items: [
        {
          id: 'cx-1',
          type: 'policy',
          title: '《IT 运维服务管理规范》',
          summary: '现行制度 · 含响应时限、升级路径与闭环要求',
          meta: '2025-03 修订 · 第 5 章',
          detail:
            '第 5 章 服务时效与升级\n\n5.1 所有工单应在接单后 15 分钟内确认受理。\n5.2 紧急及高优先级故障工单，处理人应在接单后 30 分钟内完成首次响应，2 小时内给出初步诊断结论。\n5.3 无法在 SLA 内解决的工单，处理人应发起升级，由技术主管接管并通知客户。\n5.4 闭环材料不齐全的工单，质量保障部有权驳回并退回处理人。',
        },
        {
          id: 'cx-2',
          type: 'chat',
          title: '历史沟通记录（3 条）',
          summary: '客户联系人确认了现场窗口与停机条件',
          meta: '最近 09-27 16:40',
          detail:
            '09-26 10:12 客户（138****5678）：设备打标深度明显变浅，影响交付。\n09-26 10:15 处理人：已记录，先远程看下日志，可能需要上门。\n09-27 16:40 客户：明天上午 9-11 点可以停机，你们可以过来。',
        },
        {
          id: 'cx-3',
          type: 'ticket',
          title: '关联工单 WO-2025-0187',
          summary: '同型号设备功率衰减案例，处理方案可参考',
          meta: '已完成 · 相似度 93%',
          detail:
            'WO-2025-0187 · 激光打标机出光功率骤降\n处理方案：更换场镜保护镜片，重新标定冷水机温度阈值，光路全链路校准。\n结果：功率恢复至出厂 96%，客户验收通过。',
        },
        {
          id: 'cx-4',
          type: 'kb',
          title: 'KB-012 激光设备功率类故障排查指南',
          summary: '「耗材 → 参数 → 机械」三段式排查路径',
          meta: '知识库 · 更新于 2025-08',
          detail:
            'KB-012 激光设备功率类故障排查指南\n\n第一步 耗材：检查保护镜片污染、激光管寿命。\n第二步 参数：核对功率/频率/速度基线，检查温漂补偿。\n第三步 机械：振镜校正、光路同轴度。\n\n附：常见误判案例 3 则。',
        },
      ],
    },
    quickPhrases: defaultQuickPhrases,
  };
}

// ============ AI 一句话报修演示数据（工单助理对话上报） ============

/** AI 理解结果：识别清单（逐条打勾动画展示） */
export const aiReportUnderstanding: AiUnderstandingItem[] = [
  { label: '已识别客户', value: 'XX连锁门店（上海虹桥店）' },
  { label: '已识别设备', value: '高速文档扫描仪 DS-520（SN: DS520-0231）' },
  { label: '问题类型', value: '扫描卡纸' },
  { label: '初步影响', value: '文档扫描录入无法进行，影响当日业务办理' },
];

/** AI 问题摘要卡数据（AI 生成 ≠ 自动提交，需一线人员确认） */
export const aiReportSummary: AiTicketSummary = {
  type: '扫描卡纸',
  phenomenon:
    'XX门店高速扫描仪连续进纸时频繁卡纸，取出卡纸后继续扫描仍会卡纸。',
  impact: '当前设备无法完成文档扫描录入，影响门店业务办理效率。',
  judge: '可能与进纸轮磨损、纸张规格或纸张传感器有关。',
  confidence: 82,
};

/** AI 提交工单后的后台补全分析 */
export const aiReportAnalysis: AiBackgroundAnalysis = {
  historyText: '过去 30 天该型号设备出现类似问题 21 次',
  causes: [
    { name: '进纸轮磨损', count: 13 },
    { name: '纸张规格不符', count: 5 },
    { name: '传感器异常', count: 3 },
  ],
  recommendSteps: ['① 检查进纸通道', '② 测试进纸轮', '③ 清洁纸张传感器'],
  dispatchText:
    '已匹配「扫描设备卡纸」派单规则，工单自动派给客户经理 王安康，SLA 响应时限 30 分钟。',
};

// ============ AI 工单处理驾驶舱演示剧本（扫描仪卡纸） ============

export const cockpitDemoScenario: CockpitScenario = {
  keyword: '卡纸',
  summary:
    '设备可以正常开机，但连续进纸时频繁卡纸，取出卡纸后复现。当前门店文档扫描录入无法正常进行。',
  judge: '更可能是进纸轮磨损或纸张传感器异常，纸张问题为次要怀疑项。',
  checkSteps: ['① 检查进纸通道', '② 测试进纸轮', '③ 清洁纸张传感器'],
  recommend: 'remote',
  recommendReason:
    '目前没有发现明确的硬件故障证据，先远程指导排查，避免上门等待。',
  confidence: 87,
  steps: [
    {
      id: 'step-1',
      name: '检查进纸通道',
      desc: '指导门店人员检查有无碎纸、订书钉等异物',
      estimate: '3 分钟',
      status: 'pending',
    },
    {
      id: 'step-2',
      name: '测试进纸轮',
      desc: '远程发起 10 次连续进纸测试并统计打滑次数',
      estimate: '4 分钟',
      status: 'pending',
    },
    {
      id: 'step-3',
      name: '清洁纸张传感器',
      desc: '指导现场清洁进纸传感器并复测响应',
      estimate: '3 分钟',
      status: 'pending',
    },
    {
      id: 'step-4',
      name: '切换手动单张模式（远程降级）',
      desc: '维持基本扫描业务，避免持续卡纸影响办理',
      estimate: '1 分钟',
      status: 'pending',
    },
  ],
  rejudge: {
    finding:
      '进纸通道无异物、传感器响应正常，但 10 次进纸测试打滑 7 次——已排除纸张与传感器问题，疑似进纸轮组件磨损，远程无法修复。',
    recommends: [
      '申请上门更换进纸轮组件（AI 已生成上门建议）',
      '上门前先切换手动单张慢速扫描，维持基本业务',
    ],
    confidence: 93,
  },
  visitAdvice: {
    reason:
      '远程排查已排除纸张与传感器问题，进纸轮打滑率 70%，疑似进纸轮组件磨损，需现场更换。',
    items: ['DS-520 进纸轮组件 × 1', '清洁保养套件 × 1', '备用扫描仪 × 1'],
    steps: [
      '① 检查进纸轮磨损情况',
      '② 更换进纸轮组件并校准',
      '③ 连续试扫 50 张验证',
    ],
    estimate: '1 小时',
  },
  fieldEngineer: { name: '李伟', phone: '139****2210' },
  fieldTasks: [
    { id: 'ft-1', name: '到场签到并确认设备 SN', done: true },
    { id: 'ft-2', name: '检查进纸轮磨损情况', done: true },
    { id: 'ft-3', name: '更换进纸轮组件并校准', done: false },
    { id: 'ft-4', name: '恢复自动进纸并连续试扫验证', done: false },
  ],
  fieldJudge: '进纸轮橡胶层磨损打滑，分离爪间隙偏大，建议直接更换进纸轮组件。',
  engineerNote: '换了进纸轮组件，现在不卡纸了。',
  solutionReport: {
    cause: '原进纸轮橡胶层磨损打滑，属于耗材老化故障。',
    process:
      '远程排查确认进纸通道与传感器正常后，现场检查发现进纸轮磨损明显，更换进纸轮组件并重新校准。',
    solution: '更换进纸轮组件，并重新完成连续进纸测试。',
    result: '连续进纸恢复正常，扫描不再卡纸。',
    acceptance: '建议门店连续扫描 50 张文档，确认不再卡纸。',
  },
};

/** 工单级 AI 研判剧本覆盖（按工单 id 定制推荐处理方式等，未覆盖字段回退默认剧本） */
const ticketScenarioOverrides: Record<string, Partial<CockpitScenario>> = {
  // WO-2026-1001：华达打印终端 A1 打印卷曲问题（新版详情页配套剧本）
  'wo-2026-1001': {
    recommend: 'remote',
    recommendReason:
      '已排除耗材批次问题，先远程校准走纸张力与定影参数，避免上门等待。',
    checkSteps: [
      '① 打印卷曲测试页',
      '② 检查走纸张力与压轮',
      '③ 校准定影温度与卷曲补偿',
    ],
    judge:
      '样品右侧边缘规律性卷曲，疑似走纸张力异常或加热定影参数漂移，可先远程校准参数验证。',
    confidence: 94,
    steps: [
      {
        id: 'step-1',
        name: '打印卷曲测试页',
        desc: '确认卷曲方向与幅面位置是否规律，区分张力与参数问题',
        estimate: '5 分钟',
        status: 'pending',
      },
      {
        id: 'step-2',
        name: '检查走纸张力与压轮',
        desc: '检查走纸通道压轮磨损与张力刻度是否在标准范围',
        estimate: '8 分钟',
        status: 'pending',
      },
      {
        id: 'step-3',
        name: '校准定影与卷曲补偿参数',
        desc: '按机型手册调整定影温度与卷曲补偿并下发参数模板',
        estimate: '10 分钟',
        status: 'pending',
      },
      {
        id: 'step-4',
        name: '连续打印复测',
        desc: '连续打印 50 张复测，确认卷曲量不超过 1mm',
        estimate: '12 分钟',
        status: 'pending',
      },
    ],
    solutionReport: {
      cause: '走纸张力刻度偏离标准值，且定影温度漂移导致纸张受热不均卷曲。',
      process:
        '远程打印测试页定位卷曲规律后，校准走纸张力并下发新的定影温度与卷曲补偿参数。',
      solution: '校准走纸张力，调整定影温度与卷曲补偿参数，连续打印复测验证。',
      result: '连续打印 50 张卷曲量不超过 1mm，打印质量恢复正常。',
      acceptance: '建议客户连续打印 50 张样品，确认边缘平整无卷曲。',
    },
    visitAdvice: {
      reason: '远程校准后卷曲仍超标的，需现场更换压轮组件。',
      items: ['A1 压轮组件 × 1', '张力校准工装 × 1', '清洁保养套件 × 1'],
      steps: [
        '① 检查走纸压轮磨损',
        '② 更换压轮并校准张力',
        '③ 连续打印 50 张验证',
      ],
      estimate: '1 小时',
    },
  },
  // WO-2026-1002：演示"建议转派"研判，推荐处理方式处展示转派原因
  'wo-2026-1002': {
    recommend: 'transfer',
    recommendReason:
      '该问题属于自动贴标机进纸定位模块的机型特有故障，历史同类工单均由影像设备线专员承接，当前处理人缺少该机型处置经验，建议转派给对口工程师，避免超时与返工。',
  },
  // WO-2026-1003：演示"建议上门"研判，推荐方案与推荐操作均为申请上门
  'wo-2026-1003': {
    recommend: 'onsite',
    recommendReason:
      '检测相机偶发识别失败，远程重启 2 次仍复现，疑似光学模组或线缆接触问题，需现场排查与校准。',
    checkSteps: [
      '① 远程重启并复测识别',
      '② 核对镜头与光源状态',
      '③ 检查线缆与接口连接',
    ],
    judge:
      '远程重启后仍偶发识别失败，疑似光学模组偏移或线缆接触不良，需现场校准排查。',
    visitAdvice: {
      reason: '远程重启 2 次仍复现，需现场排查光学模组与线缆连接。',
      items: ['光学校准工装 × 1', '备用线缆组件 × 1', '无尘清洁套件 × 1'],
      steps: [
        '① 检查镜头与光学模组状态',
        '② 重新插拔并固定线缆接口',
        '③ 现场校准并连续识别测试 50 次',
      ],
      estimate: '1.5 小时',
    },
  },
  // WO-2026-1102：上门处理中演示单（贴标偏移），AI 现场助手内容与工单一致
  'wo-2026-1102': {
    recommend: 'onsite',
    recommendReason:
      '远程校准电眼并重发参数模板后，贴标偏移仍间歇出现，疑似贴标头机械偏移或标带张力异常，需现场检修。',
    checkSteps: [
      '① 远程复位贴标伺服并复测',
      '② 校准标签电眼感应位置',
      '③ 重新下发贴标参数模板',
    ],
    judge:
      '远程校准后贴标偏移仍间歇出现，疑似贴标头机械偏移或标带张力异常，需现场检修校准。',
    visitAdvice: {
      reason:
        '远程复位伺服、校准电眼并重发参数模板后，B2 贴标偏移仍间歇出现，疑似贴标头机械偏移或标带张力异常，需现场检修。',
      items: ['伺服校准工装 × 1', '备用张力组件 × 1', '清洁保养套件 × 1'],
      steps: [
        '① 检查贴标头安装与机械偏移',
        '② 调整标带张力并更换磨损件',
        '③ 现场校准后连续贴标 200 件验证',
      ],
      estimate: '1.5 小时',
    },
  },
};

/** 获取工单 AI 研判剧本（默认驾驶舱剧本 + 工单级覆盖） */
export function getTicketScenario(orderId: string): CockpitScenario {
  return { ...cockpitDemoScenario, ...ticketScenarioOverrides[orderId] };
}

// ============ 新版工单详情页专属内容（AI 处理建议 / 关联知识 / 相似案例） ============

/** 新版详情页 AI 处理建议（WO-20261004001 专属演示内容） */
export const scanDemoAdvice = {
  /** 建议依据 */
  basis: '故障描述与历史案例',
  /** 故障判断 */
  judge: '疑似进纸辊磨损或纸张传感器异常，建议先检查进纸组件。',
  /** 推荐方案 */
  plan: '检查进纸组件，确认后更换配件并校准',
  /** 默认展示的处理步骤（折叠态） */
  steps: [
    '确认纸张规格与卡纸位置，检查进纸轮及传感器。',
    '确认磨损后更换配件，完成光路校准与连续扫描验证。',
  ],
  /** 关联知识文章 */
  knowledge: [
    { id: 'kb-scan-1', title: '扫描仪卡纸排查指南' },
    { id: 'kb-scan-2', title: '配件更换与校准规范' },
  ],
};

/** 新版详情页按工单定制的演示内容（AI 处理建议 / 关联知识 / 相似历史案例 / 设备维度信息） */
export interface CaseDetailAdvice {
  /** 故障判断 */
  judge: string;
  /** 推荐方案 */
  plan: string;
  /** 参考历史案例提示 */
  casesHint: string;
  /** 折叠态默认展示的处理步骤 */
  steps: string[];
  /** AI 置信度（百分比） */
  confidence: number;
  /** AI 置信度依据说明 */
  confidenceBasis: string;
  /** 关联知识文章 */
  knowledge: Array<{ id: string; title: string }>;
  /** 相似历史案例标签（标签 + 案例数） */
  similarTags: Array<{ count: number; id: string; label: string }>;
  /** 相似案例洞察结论 */
  similarSummary: string;
  /** 相似案例总条数 */
  similarCount: number;
  /** 该设备历史工单数 */
  deviceTicketCount: number;
}

/** 按工单 id 定制的新版详情页内容 */
const caseDetailAdviceMap: Record<string, CaseDetailAdvice> = {
  // WO-20261004001：XX 连锁门店高速扫描仪频繁卡纸
  'wo-scan-demo': {
    judge: '疑似进纸辊磨损或纸张传感器异常，建议先检查进纸组件。',
    plan: '检查进纸组件，确认后更换配件并校准',
    casesHint: '参考历史工单案例 4 条，结合现场检查结果确认。',
    steps: [
      '确认纸张规格与卡纸位置，检查进纸辊及传感器。',
      '确认磨损后更换配件，完成光路校准与走纸扫描验证。',
    ],
    confidence: 97,
    confidenceBasis: '基于 4 条相似历史工单 + 设备型号知识库',
    knowledge: [
      { id: 'kb-scan-1', title: '扫描仪卡纸排查指南' },
      { id: 'kb-scan-2', title: '配件更换与校准规范' },
      { id: 'kb-scan-3', title: 'DS-520 进纸组件拆装手册' },
    ],
    similarTags: [
      { id: 'st-scan-1', label: 'DS-520 卡纸 · 已闭环 进纸辊磨损', count: 3 },
      { id: 'st-scan-2', label: '传感器误报', count: 1 },
    ],
    similarSummary:
      '4 条相似案例中 3 条最终更换进纸组件，平均处理时长 1.5 小时。',
    similarCount: 4,
    deviceTicketCount: 7,
  },
  // WO-2026-1001：华达打印终端 A1 打印卷曲问题
  'wo-2026-1001': {
    judge:
      '样品右侧边缘规律性卷曲，已排除耗材批次问题，疑似走纸张力异常或加热定影参数漂移。',
    plan: '校准走纸张力，调整定影温度与卷曲补偿参数并复测',
    casesHint: '参考历史工单案例 3 条，结合现场复测结果确认。',
    steps: [
      '打印卷曲测试页，确认卷曲方向与幅面位置是否规律。',
      '检查走纸通道张力与压轮，校准定影温度及卷曲补偿参数。',
    ],
    confidence: 94,
    confidenceBasis: '基于 3 条相似历史工单 + 设备参数知识库',
    knowledge: [
      { id: 'kb-a1-1', title: '打印卷曲故障排查指南' },
      { id: 'kb-a1-2', title: '走纸张力校准规范' },
      { id: 'kb-a1-3', title: '智能打印终端 A1 参数配置手册' },
    ],
    similarTags: [
      { id: 'st-a1-1', label: 'A1 打印卷曲 · 已闭环 走纸张力异常', count: 2 },
      { id: 'st-a1-2', label: '定影参数漂移', count: 1 },
    ],
    similarSummary:
      '3 条相似案例中 2 条通过校准走纸张力并调整加热参数解决，平均处理时长 1.2 小时。',
    similarCount: 3,
    deviceTicketCount: 5,
  },
};

/** 获取新版详情页按工单定制的内容（未配置的工单返回 undefined） */
export function getCaseDetailAdvice(
  orderId: string,
): CaseDetailAdvice | undefined {
  return caseDetailAdviceMap[orderId];
}
