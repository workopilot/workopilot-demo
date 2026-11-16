/** 工单分类：内部工单（公司员工）/ 外部工单（运维人员） */
export type TicketCategory = 'external' | 'internal';

/** 角色：同一人可兼任多角色，权限按角色叠加 */
export type TicketRole =
  | 'account-manager' // 客户经理：判定是否前往现场，发起/跟进工单
  | 'employee' // 公司员工：内部工单的发起方
  | 'field-engineer' // 一线人员：实际处理工单，填写解决方案并上传凭证
  | 'ops-staff'; // 运维人员：外部工单的使用方

/** 设备在保状态 */
export type WarrantyStatus = 'expired' | 'expiring' | 'in-warranty';

/** 超时告警渠道（参考图片：站内信/邮件/K1扫描/企微/飞书/费控佳/单多啦/票音/百度网盘/钉钉） */
export type AlertChannel =
  | 'email' // 邮件
  | 'in-app' // 站内信
  | 'phone' // 电话
  | 'sms' // 短信
  | 'wecom'; // 企微

/** 派单目标模式：按岗位派单 / 按具体人员派单 */
export type DispatchTargetMode = 'person' | 'position';

/** SLA 超时阶段：未响应 / 未解决 */
export type SlaAlertStage = 'resolve' | 'response';

/** 售后制度文件解析状态 */
export type DocumentParseStatus = 'confirmed' | 'draft' | 'rejected';

/** 工单状态（保留枚举兼容存量；新逻辑使用 FlowNode.currentNodeId） */
export type TicketStatus =
  | 'cancelled' // 已取消（创建人主动取消）
  | 'closed' // 已关闭（正常结束）
  | 'completed' // 已完成
  | 'dispatched' // 待接单（已派单，等待承办人确认接单）
  | 'onsite-processing' // 上门处理中（行程执行中）
  | 'pending' // 待派单
  | 'pending-acceptance' // 待验收
  | 'pending-review' // 待复核（验收通过后的终审）
  | 'pending-visit' // 待上门调度（等待确认出发）
  | 'processing'; // 处理中

// ==================== 流程图：节点 / 边 / 子任务 ====================

/** 流程图节点类型 */
export type FlowNodeType =
  | 'decision' // 决策节点（承办判断）
  | 'end' // 终点
  | 'normal' // 常规节点
  | 'start' // 起点
  | 'subtask' // 发起协助子任务节点（主工单内嵌协作）
  | 'suspend'; // 挂起节点（等备件 / 等上门）

/** 处理人角色类型（节点级负责人选取方式） */
export type OwnerRoleType =
  | 'creator' // 单据创建人：无下拉
  | 'dispatch-rule' // 派单规则：无下拉（按维度匹配派单目标）
  | 'leader' // 部门领导：无下拉
  | 'person' // 指定人员：显示用户名称下拉框
  | 'position' // 指定岗位：显示岗位名称下拉框
  | 'role'; // 指定角色：显示角色名称下拉框

/** 处理人角色配置（ownerRoleType 决定使用哪个 id） */
export interface OwnerRoleConfig {
  /** 指定岗位时选取的岗位 id */
  positionId?: string;
  /** 指定角色时选取的角色 id */
  roleId?: string;
  /** 指定人员时选取的用户 id */
  staffId?: string;
}

/** 流程图节点（状态流转视角：节点 = 工单状态） */
export interface FlowNode {
  id: string;
  /** 状态编码 */
  code?: string;
  name: string; // 状态名：待派单 / 处理中 / 待验收 / 已完成
  /**
   * 节点负责人岗位（业务说明文本）
   *
   * 仅描述"进入该状态后由谁负责"的节点级岗位文字，
   * 不参与按维度匹配的结构化派单（结构化派单见 DispatchRule）。
   */
  ownerRole: string;
  type: FlowNodeType;
  /** 是否系统内置（不可删除） */
  system?: boolean;
  /** 节点说明 */
  desc?: string;
  /** 状态排序号（主路径按 1..N 排列；分支状态可插队） */
  order?: number;
  /**
   * SLA 时效说明（节点级业务目标文本）
   *
   * 仅描述"该状态目标时效"的自然语言文本，
   * 如"30 分钟确认 · 超 2 小时升级刘静宇督促改派"。
   * 结构化时效阈值 / 告警渠道 / 告警对象见 SlaConfig（第 5 步）。
   */
  slaHint?: string;
  /** 是否强制完工材料（4 类材料 + 本季度上门次数） */
  requireMaterial?: boolean;
  /** 子任务模板 ID 列表（协助子任务挂在本状态下，不另立单据） */
  subTaskTemplateIds?: string[];
  /** UI 颜色 key（沿用 custom-status.vue 的色板） */
  colorKey?: string;
  // ===== V1.1 扩展（可选；不破坏存量）=====
  /** 节点可用动作列表（PRD 流程模型：状态+动作+条件→下一状态） */
  actions?: TicketAction[];
  /** 进入该节点的条件（与 actions 中至少一条 transition 匹配后方可进入） */
  entryCondition?: ConditionRule;
  /** 是否起始节点 */
  isStart?: boolean;
  /** 是否结束节点 */
  isEnd?: boolean;
  /** 关联的 SLA 策略 id（节点级 SLA 绑定） */
  slaPolicyId?: string;
  // ===== 处理人角色扩展（状态信息：节点级负责人选取方式）=====
  /** 处理人角色类型（指定岗位/角色/人员、单据创建人、部门领导、派单规则） */
  ownerRoleType?: OwnerRoleType;
  /** 处理人角色配置（ownerRoleType 决定使用哪个 id：positionId/roleId/staffId） */
  ownerRoleConfig?: OwnerRoleConfig;
  // ===== 规则来源与确认（处理流程 ↔ 派单 / SLA 关联展示）=====
  /** 规则来源：AI 解析 / 人工配置 / 系统默认（缺省视为人工配置） */
  ruleSource?: FlowRuleSource;
  /** 确认状态（缺省视为已确认） */
  confirmStatus?: RuleConfirmStatus;
  /** 确认记录 */
  confirmRecord?: RuleConfirmRecord;
  /** AI 推断理由（ruleSource = 'ai' 时展示，明确标为 AI 推断） */
  aiReason?: string;
  /** 识别依据（资料名称·章节 + 原文摘录） */
  evidence?: RuleEvidence;
}

/** 平台层级定义的动作事件（工单流转可绑定的事件集合） */
export interface PlatformActionEvent {
  /** 事件 code（唯一标识） */
  code: string;
  /** 事件名称（展示文案） */
  name: string;
  /** 事件分类 */
  category: 'common' | 'notify' | 'sla' | 'subtask' | 'system';
  /** 事件说明 */
  desc?: string;
}

/** 流程图边（流转规则：from → to） */
export interface FlowEdge {
  id: string;
  from: string; // 源节点 id
  to: string; // 目标节点 id
  action: string; // 动作名：挂起 / 恢复 / 验收不通过 / 协助回填
  /** 触发条件（自然语言展示；可选，无条件则默认可走） */
  condition?: string;
  /** 是否回退边（红色虚线） */
  rollback?: boolean;
  /** 是否异步边（协助子任务完成后才触发） */
  async?: boolean;
  // ===== V1.1 扩展（可选；不破坏存量）=====
  /** 关联的动作 id（结构化流转：from + action + conditions → to） */
  actionId?: string;
  /** 结构化流转条件（替代自然语言 condition） */
  conditions?: ConditionRule[];
  /** 动作事件（平台层级定义的事件 code，单个） */
  actionEvent?: string;
  /** 动作事件列表（支持多个） */
  actionEvents?: string[];
  /** 必填字段 code 列表（流转时强制填写） */
  requiredFields?: string[];
  /** 可填字段 code 列表（流转时可选填写） */
  optionalFields?: string[];
  /** 流转依据（制度章节与原文摘录，可选） */
  evidence?: RuleEvidence;
  // ===== 规则来源与确认（规则清单视图展示）=====
  /** 规则来源：AI 解析 / 人工配置 / 系统默认（缺省视为人工配置） */
  ruleSource?: FlowRuleSource;
  /** 确认状态（缺省视为已确认） */
  confirmStatus?: RuleConfirmStatus;
  /** 确认记录 */
  confirmRecord?: RuleConfirmRecord;
}

/** 子任务模板（流程图节点配置：可在"发起协助子任务"节点下配置多个模板） */
export interface SubTaskTemplate {
  id: string;
  name: string; // 子任务名：现场协助 / 远程排查
  description: string;
  /** 默认指派岗位：协助人岗位 */
  defaultRole: string;
  /** 协作完成后主工单才能继续（必填阻塞） */
  required: boolean;
}

/** 流程图（主工单 + 协助子任务共用一个图，行程单分支暂不纳入） */
export interface FlowGraph {
  id: string;
  name: string; // "运维工单闭环流程 V3"
  nodes: FlowNode[];
  edges: FlowEdge[];
  subTaskTemplates: SubTaskTemplate[];
  enabled: boolean;
}

// ==================== 工单实例字段扩展 ====================

/** 工单实例中的子任务（主工单内嵌，不另立单据） */
export interface SubTaskInstance {
  id: string;
  templateId: string;
  name: string;
  /** 子任务状态 */
  status: 'completed' | 'pending' | 'processing';
  assignee?: string;
  assigneeId?: string;
  result?: string; // 协助回填内容
  attachments?: TicketAttachment[];
  createdAt: string;
  completedAt?: string;
}

/** 工单流转动作类型 */
export type TicketTimelineAction =
  | 'accepted' // 客户验收通过
  | 'cancelled' // 创建人取消
  | 'closed' // 系统/管理员关闭
  | 'completed' // 处理完成（进入待验收）
  | 'created' // 工单创建
  | 'dispatched' // 派单（含首派 / 转派落地）
  | 'evaluated' // 客户评价（验收 + 评分）
  | 'note' // 补充说明 / 通用备注
  | 'started' // 处理人开始处理
  | 'transferred'; // 转派申请或转派成功

/** 工单流转事件（完整记录每一次操作，便于查看进展） */
export interface TicketTimelineEvent {
  id: string;
  action: TicketTimelineAction;
  /** 动作时间 */
  time: string;
  /** 操作人姓名 */
  operator: string;
  /** 操作人 ID */
  operatorId: string;
  /** 动作简要描述（展示给客户/创建人看） */
  summary: string;
  /** 可选：取消原因 / 转派理由 / 验收备注等 */
  reason?: string;
  /** 可选：动作前后的处理人等关键信息（用于转派/派单展示） */
  extra?: Record<string, string>;
}

/** 工单优先级 */
export type TicketPriority = 'high' | 'low' | 'medium' | 'urgent';

/** SLA 达成状态 */
export type SlaStatus = 'breached' | 'normal' | 'paused' | 'warning';

/** 行程单（需上门工单的出行安排） */
export interface TravelOrder {
  /** 行程单号，如 TR-2026-001 */
  code: string;
  /** 出行事由 */
  reason: string;
  /** 交通方式：驾车 / 高铁 / 公交 / 其他 */
  transport: string;
  /** 计划出发时间 */
  departAt: string;
  /** 行程状态：执行中 / 已完成 */
  status: 'done' | 'executing';
}

/** 设备状态 */
export type DeviceStatus = 'fault' | 'maintenance' | 'normal' | 'offline';

/** 故障附件类型（现场拍摄 / 上传的证明材料） */
export type TicketAttachmentType =
  'audio' | 'image' | 'pdf' | 'recording' | 'screenshot' | 'video';

/** 故障附件（用于报修采集 / 现场补充 / 处理留痕） */
export interface TicketAttachment {
  id: string;
  name: string;
  type: TicketAttachmentType;
  size: string;
  /** 上传人姓名 */
  uploader: string;
  /** 上传人 ID（创建人=现场提交，处理人=处置留痕） */
  uploaderId: string;
  uploadedAt: string;
  /** 附件说明 */
  note?: string;
  /** 预览图（image/screenshot/video 时提供缩略图） */
  thumbnail?: string;
  /** 时长（音频/视频） */
  duration?: string;
}

/** 现场打卡记录（带时间与地点水印的照片） */
export interface CheckInRecord {
  id: string;
  /** 打卡人姓名 */
  person: string;
  /** 打卡人 ID */
  personId: string;
  /** 打卡时间 */
  time: string;
  /** 地点（GPS / 地址描述） */
  location: string;
  /** 水印照片 URL */
  photoUrl: string;
  /** 备注 */
  note?: string;
}

// ==================== 资产管理（分类自带字段 schema，字段隔离在分类层级） ====================

/** 资产字段值类型 */
export type AssetFieldType = 'date' | 'enum' | 'number' | 'text';

/** 资产字段定义（挂在资产分类上，不同分类字段集互不污染） */
export interface AssetFieldDef {
  id: string;
  key: string;
  label: string;
  valueType: AssetFieldType;
  /** 枚举选项（valueType='enum' 时生效） */
  options?: string[];
}

/** 资产分类（一级分类；自带字段定义与生命周期状态） */
export interface AssetCategory {
  id: string;
  name: string;
  description?: string;
  /** 该分类资产的字段 schema */
  fieldDefs: AssetFieldDef[];
  /** 生命周期状态集（资产 status 取值范围） */
  lifecycleStates: string[];
  /** 是否系统内置分类（不可删除） */
  builtin?: boolean;
}

/** 资产实例（统一主档；售出设备 / 公司资产 / 产品模块都存在此） */
export interface Asset {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  status: string;
  /** 按所属分类 fieldDefs 填充的扩展属性 */
  extAttributes: Record<string, number | string>;
  createdAt: string;
  updatedAt: string;
}

/** 设备信息 */
export interface TicketDevice {
  id: string;
  code: string;
  name: string;
  model: string;
  category: string;
  customer: string;
  /** 客户等级（VIP/重要/普通） */
  customerLevel: string;
  location: string;
  status: DeviceStatus;
  /** 质保状态 */
  warrantyStatus: WarrantyStatus;
  /** 保修到期日（兼容旧字段） */
  warrantyExpiry?: string;
  /** 质保有效期起始日期 */
  warrantyStartDate?: string;
  /** 质保有效期结束日期 */
  warrantyEndDate?: string;
  /** 质保说明 */
  warrantyDescription?: string;
  installDate: string;
  lastMaintenance: string;
}

/**
 * 规则确认状态（处理流程 / 派单规则 / 时限提醒三步共用）
 *
 * AI 解析或待核对的规则须管理员确认后生效；
 * 编辑已确认的规则后，该规则重新进入待确认状态。
 * - pending-review：待确认（含 AI 待确认）
 * - pending-info：待补充（依据不完整，需补充资料后核对）
 * - confirmed：已确认
 */
export type RuleConfirmStatus = 'confirmed' | 'pending-info' | 'pending-review';

/** 规则确认记录（确认人 / 时间 / 规则版本） */
export interface RuleConfirmRecord {
  /** 确认时间 */
  at?: string;
  /** 确认人 */
  by?: string;
  /** 确认时的规则版本 */
  version?: string;
}

/** 规则来源（流程状态节点级：AI 解析 / 人工配置 / 系统默认） */
export type FlowRuleSource = 'ai' | 'manual' | 'system';

/** 派单规则 AI 解析依据 */
export interface RuleEvidence {
  /** 来源文件与章节 */
  source: string;
  /** AI 置信度 */
  confidence?: string;
  /** 制度原文片段 */
  snippet: string;
}

/** 派单规则 */
export interface DispatchRule {
  id: string;
  name: string;
  /** 触发条件描述（自然语言） */
  condition: string;
  /** 派单目标模式：按岗位 / 按具体人员 */
  targetMode: DispatchTargetMode;
  /** 派单目标岗位（targetMode = 'position' 时必填） */
  targetPosition?: string;
  /** 派单目标人员 ID（targetMode = 'person' 时必填） */
  targetPersonId?: string;
  /** 派单目标展示文案（由岗位/人员名称拼接而成，列表展示用） */
  target: string;
  priority: TicketPriority;
  /** 设备类型（维度） */
  deviceCategory?: string;
  /** 客户等级（维度） */
  customerLevel?: string;
  /** 故障级别（维度） */
  faultLevel?: string;
  /** 设备在保状态（维度） */
  warrantyStatus?: WarrantyStatus;
  enabled: boolean;
  /** 命中次数（仅类型保留，列表不再展示） */
  hitCount: number;
  /** 规则来源：AI 解析 / 手工配置（缺省视为手工配置） */
  source?: 'ai' | 'manual';
  /** AI 解析依据（source = 'ai' 时在详情中展示） */
  evidence?: RuleEvidence;
  /** 命中后进入的流程状态名（展示"派给谁 → 进入哪个状态"） */
  targetStatus?: string;
  /** 确认状态（缺省视为已确认） */
  confirmStatus?: RuleConfirmStatus;
  /** 确认记录 */
  confirmRecord?: RuleConfirmRecord;
  /** 与其他规则的冲突提示（如多条规则可能同时命中） */
  conflictNote?: string;
}

/** SLA 超时告警配置 */
export interface SlaAlertConfig {
  /** 是否启用本阶段告警 */
  enabled: boolean;
  /** 超时多久后告警（分钟）：0 表示超时立即告警 */
  delayMinutes: number;
  /** 通知对象（运维人员 ID 列表） */
  targetPersonIds: string[];
  /** 通知方式 */
  channels: AlertChannel[];
}

/** SLA 配置 */
export interface SlaConfig {
  id: string;
  name: string;
  priority: TicketPriority;
  /** 响应时效（小时） */
  responseHours: number;
  /** 解决时效（小时） */
  resolveHours: number;
  /** 超时处置 */
  penalty: string;
  /** 设备类型（SLA 计算维度） */
  deviceCategory?: string;
  /** 客户等级（SLA 计算维度） */
  customerLevel?: string;
  /** 故障级别（SLA 计算维度） */
  faultLevel?: string;
  /** 设备在保状态（SLA 计算维度） */
  warrantyStatus?: WarrantyStatus;
  /** 未响应超时告警配置 */
  responseAlert: SlaAlertConfig;
  /** 未解决超时告警配置 */
  resolveAlert: SlaAlertConfig;
  /** 超时告警渠道（兼容旧字段，列表展示用，新逻辑由 responseAlert/resolveAlert 承载） */
  alertChannels: AlertChannel[];
  enabled: boolean;
  /** 规则来源：AI 解析 / 手工配置（缺省视为手工配置） */
  source?: 'ai' | 'manual';
  /** AI 解析依据（source = 'ai' 时在详情中展示） */
  evidence?: RuleEvidence;
  /** 计时起点：工单创建 / 工单受理（缺省视为受理） */
  startTiming?: 'accept' | 'create';
  /** 暂停 SLA 计时的流程状态名列表（与第 3 步处理流程状态对应） */
  pauseStatuses?: string[];
  /** 确认状态（缺省视为已确认） */
  confirmStatus?: RuleConfirmStatus;
  /** 确认记录 */
  confirmRecord?: RuleConfirmRecord;
}

/** 工单运维人员状态 */
export type OpsStaffStatus = 'on' | 'rest';

/** 工单运维人员 */
export interface OpsStaff {
  id: string;
  /** 关联用户ID */
  userId?: string;
  /** 岗位（用于派单目标） */
  position: string;
  /** 服务区域 */
  area: string;
  /** 当前负荷（处理中的工单数） */
  workload: number;
  /** 在岗状态 */
  status: OpsStaffStatus;
  enabled: boolean;
}

/** 工单 */
export interface WorkOrder {
  inspection?: import('#/types/inspection').InspectionTicketData;
  id: string;
  code: string;
  title: string;
  type: string;
  /** 所属场景：运维工单 / 需求工单 / 上门工单 */
  scenario: string;
  /** 工单分类：内部工单 / 外部工单 */
  category: TicketCategory;
  device?: string;
  customer?: string;
  /** 客户所在城市 / 区域（用于行程规划） */
  customerLocation?: string;
  contact?: string;
  phone?: string;
  priority: TicketPriority;
  status: TicketStatus;
  source: string;
  /** 创建人 */
  creator: string;
  creatorId: string;
  /** 创建人角色 */
  creatorRole?: TicketRole;
  /** 当前处理人（已派单时） */
  assignee?: string;
  assigneeId?: string;
  createdAt: string;
  deadline: string;
  slaStatus: SlaStatus;
  description: string;
  /** SLA 剩余时间展示 */
  slaRemaining?: string;
  /** SLA 计时基准时间（转派后重新计时） */
  slaResetAt?: string;
  /** 故障附件：现场照片、视频、报错截图、录音等 */
  attachments?: TicketAttachment[];
  /** 处理方案/解决方案（处理人完成时填写，闭环必填） */
  solution?: string;
  /** 问题根因（完成处理时补充，AI 可优化生成） */
  rootCause?: string;
  /** 处理完成时间 */
  completedAt?: string;
  /** 验收附件：处理完成时上传的现场复测截图 / 视频（闭环必填） */
  acceptanceAttachments?: TicketAttachment[];
  /** 现场打卡记录（前往现场时，带时间与地点水印的照片） */
  checkInRecords?: CheckInRecord[];
  /** 取消原因（创建人取消时填写） */
  cancelReason?: string;
  /** 取消/关闭时间 */
  cancelledAt?: string;
  /** 客户评价：1-5 星评分 */
  rating?: number;
  /** 客户评价：文字反馈 */
  evaluation?: string;
  /** 客户评价时间 */
  evaluatedAt?: string;
  /** 当前流程图节点 id（替代 status 枚举做精确流转） */
  currentNodeId?: string;
  /** 流程图 id（引用哪套流程配置） */
  flowGraphId?: string;
  /** 工单内嵌协助子任务池（不另立单据） */
  subTasks?: SubTaskInstance[];
  /** 关联行程单（需上门工单发起行程后挂载；执行期间 SLA 暂停） */
  travelOrder?: TravelOrder;
  /** 现场决策：是否需要前往现场（客户经理人为判定） */
  onSiteRequired?: boolean;
  /** 现场决策人（客户经理） */
  onSiteDecisionBy?: string;
  /** 现场决策时间 */
  onSiteDecisionAt?: string;
  /** 流转进展事件（按时间正序：创建→派单→开始→完成→验收 等） */
  timeline?: TicketTimelineEvent[];
  /** 转派历史记录：每次转派保留前处理人/后处理人/转派理由/时间 */
  transferHistory?: Array<{
    fromAssignee?: string;
    fromAssigneeId?: string;
    id: string;
    operator: string;
    operatorId: string;
    reason: string;
    time: string;
    toAssignee: string;
    toAssigneeId: string;
  }>;
}

/** 知识库条目 */
export interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  views: number;
  helpful: number;
  updatedAt: string;
  tags: string[];
}

/** 工单概览统计 */
export interface TicketOverviewStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  breached: number;
  avgResolveHours: number;
  byType: Array<{ count: number; type: string }>;
  byPriority: Array<{ count: number; priority: TicketPriority }>;
  /** 按分类统计（内部/外部） */
  byCategory: Array<{ category: TicketCategory; count: number }>;
  trend: Array<{ completed: number; created: number; day: string }>;
}

/** 售后制度文件解析条目（自动解析生成的派单规则与 SLA 草稿） */
export interface DocumentParseResult {
  id: string;
  /** 源文件名 */
  fileName: string;
  /** 文件格式 */
  fileType: string;
  /** 上传时间 */
  uploadedAt: string;
  /** 解析状态：草稿 → 复核确认 / 驳回 */
  status: DocumentParseStatus;
  /** 解析出的派单规则数量 */
  ruleCount: number;
  /** 解析出的 SLA 配置数量 */
  slaCount: number;
  /** 解析出的规则预览 */
  parsedRules: Array<{
    condition: string;
    id: string;
    priority: TicketPriority;
    target: string;
  }>;
  /** 解析出的 SLA 预览 */
  parsedSlas: Array<{
    id: string;
    name: string;
    priority: TicketPriority;
    resolveHours: number;
    responseHours: number;
  }>;
  /** 复核人 */
  reviewedBy?: string;
  /** 复核时间 */
  reviewedAt?: string;
  /** 复核备注 */
  reviewNote?: string;
}

/** 数字员工对话消息 */
export interface ChatMsg {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  time: string;
  /** 消息附加的交互卡片类型 */
  card?:
    | 'active-tickets'
    | 'ai-analysis'
    | 'ai-summary'
    | 'ai-understanding'
    | 'dispatch-list'
    | 'inspection-action'
    | 'inspection-create'
    | 'inspection-enable'
    /** AI 一句话报修：理解中（逐条识别动画） */
    | 'kb-answer'
    /** AI 一句话报修：问题摘要卡（确认生成工单） */
    | 'report-collect'
    /** AI 一句话报修：提交后后台补全分析 + 派单结果 */
    | 'ticket-create';
  inspectionPlanId?: string;
  inspectionAction?: string;
  /** 知识库卡片关联的文章 ID */
  kbArticleId?: string;
  /** 关联的工单编号 */
  ticketCode?: string;
}

/** 工单场景配置（每个场景绑定一套流程图 + 派单规则 + SLA） */
export interface TicketScenario {
  id: string;
  code: string;
  name: string;
  description: string;
  /** 最新版本状态 */
  latestStatus: 'draft' | 'published';
  /** 最新版本号 */
  latestVersion: string;
  /** 最后发布的版本号 */
  lastPublishedVersion: string;
  /** 场景整体状态 */
  status: 'archived' | 'draft' | 'published';
  updatedAt: string;
  by: string;
  /** ⭐ 关联的流程图 id（核心关联键） */
  flowGraphId: string;
  /** 备注：该场景适用的流程图名称（列表展示用） */
  flowGraphName?: string;
  // ===== V1.1 扩展（可选；不破坏存量）=====
  /** 关联的工单模型 id（TicketSchema） */
  schemaId?: string;
  /** 关联的派单策略 id（AssignmentPolicy） */
  assignmentPolicyId?: string;
  /** 关联的 SLA 策略 id 列表（SlaPolicy） */
  slaPolicyIds?: string[];
}

// ==================== 行程单（上门运维工单合并出行） ====================

/** 行程单状态 */
export type TripStatus =
  | 'cancelled' // 已取消
  | 'completed' // 已完成
  | 'draft' // 草稿
  | 'ongoing' // 执行中
  | 'planned'; // 已计划

/** 行程单（将多张需上门的运维工单合并为一次出行） */
export interface TripOrder {
  id: string;
  /** 行程号 */
  code: string;
  title: string;
  /** 关联的工单 id 列表 */
  workOrderIds: string[];
  /** 负责人姓名 */
  owner: string;
  /** 负责人 id */
  ownerId: string;
  /** 计划上门日期 YYYY-MM-DD */
  planDate: string;
  /** 计划时段 */
  planSlot: string;
  status: TripStatus;
  remark?: string;
  /** 完成时间 */
  completedAt?: string;
  /** 完成行程时提交的验收材料 + 工单标记（回写至各关联工单） */
  completion?: TripCompletion;
  createdAt: string;
  updatedAt?: string;
}

/** 行程完成时对每张关联工单的独立标记状态 */
export type TripWoMarkStatus =
  | 'fail' // 未处理
  | 'ok' // 已处理
  | 'partial' // 部分处理
  | 'rework'; // 需返修

/** 行程完成时对单张工单的标记内容（不同 status 联动不同字段必填） */
export interface TripWoMark {
  /** 关联工单 id */
  workOrderId: string;
  /** 关联工单号（冗余便于展示） */
  workOrderCode?: string;
  /** 标记状态 */
  status: TripWoMarkStatus;
  /** 处理说明：ok/final 时为处理结果；partial 时为已处理部分 */
  handledNote?: string;
  /** 未完成部分：partial/fail 时填写 */
  unhandledNote?: string;
  /** 未处理原因：fail 时填写 */
  failReason?: string;
  /** 返修原因：rework 时填写 */
  reworkReason?: string;
  /** 返修类型：rework 时填写（同故障复发/客户验收不通过/处理不彻底/新发关联故障） */
  reworkType?: string;
  /** 期望返修时间：partial/rework 时填写 */
  reworkExpectedAt?: string;
  /** 遗留风险说明：partial 时填写 */
  leftoverRisk?: string;
  /** 工单级验收附件（与行程级附件合并回写到工单 acceptanceAttachments） */
  attachments?: TicketAttachment[];
  /** 是否需要重新派单：partial/fail/rework 时可标记 */
  needRedispatch?: boolean;
  /** 是否升级处理：fail 时可标记 */
  needEscalate?: boolean;
}

/** 行程完成提交的统一验收材料 + 各工单标记 */
export interface TripCompletion {
  /** 行程总结（≥10 字，作为工单闭环统一处理说明回写） */
  summary: string;
  /** 行程级验收附件（回写到所有关联工单的 acceptanceAttachments） */
  attachments: TicketAttachment[];
  /** 各关联工单的标记内容 */
  woMarks: TripWoMark[];
  /** 提交时间 */
  submittedAt: string;
}

// ==================== V1.1：可配置流程模型扩展（PRD 工单V1.1prd.md）====================

/** 条件比较操作符 */
export type ConditionOperator =
  | 'contains' // 字符串包含
  | 'eq' // 等于
  | 'gt' // 大于
  | 'in' // 包含于
  | 'lt' // 小于
  | 'ne'; // 不等于

/** 条件之间的逻辑关系 */
export type ConditionLogic = 'and' | 'or';

/**
 * 业务规则统一模型（PRD 第 12 节）
 *
 * 用于流程流转条件、派单适用条件、SLA 适用条件、字段校验等。
 * 底层规则引擎是平台能力，工单只定义"什么场景需要判断什么规则"。
 */
export interface ConditionRule {
  id: string;
  /** 字段编码（系统字段或自定义字段 code） */
  field: string;
  /** 比较操作符 */
  op: ConditionOperator;
  /** 比较值（eq/ne: 单值；in: 数组；gt/lt: 数字；contains: 字符串） */
  value?: number | string | string[];
  /** 与上一条规则的逻辑关系（首条规则忽略） */
  logic?: ConditionLogic;
  /** 嵌套分组（用于复杂条件 AND/OR 嵌套） */
  children?: ConditionRule[];
}

/** 动作后置事件类型 */
export type TicketActionEventType =
  | 'create-sub' // 创建子工单
  | 'escalate' // 升级
  | 'notify' // 通知
  | 'sla-pause' // 暂停 SLA
  | 'sla-resume'; // 恢复 SLA

/** 动作后置事件 */
export interface TicketActionEvent {
  /** 事件类型 */
  type: TicketActionEventType;
  /** 事件载荷（如通知对象、子工单模板 id 等） */
  payload?: Record<string, any>;
}

/**
 * 工单动作（PRD 第 7.4 节）
 *
 * 用户在当前状态下可以执行的业务操作。
 * 流转模型：当前状态 + 动作 + 条件 → 下一状态 + 处理人 + 后续动作
 */
export interface TicketAction {
  id: string;
  /** 动作编码（系统唯一） */
  code: string;
  /** 动作名称（页面显示） */
  name: string;
  /** 可执行角色列表（谁可以操作） */
  allowedRoles?: TicketRole[];
  /** 执行前置条件（什么情况下可以操作） */
  condition?: ConditionRule;
  /** 执行时需要填写的字段 code 列表 */
  inputFields?: string[];
  /** 操作完成后的目标节点 id */
  nextStateId: string;
  /** 后置事件（调用平台事件能力） */
  triggers?: TicketActionEvent[];
  /** 是否需要填写原因 */
  requireReason?: boolean;
  /** 是否启用 */
  enabled: boolean;
}

// ==================== 工单模型（PRD 第 6 节）====================

/** 工单字段类型（PRD 第 6.2 节自定义字段） */
export type TicketFieldType =
  | 'address' // 地址
  | 'amount' // 金额
  | 'attachment' // 附件
  | 'customer' // 客户
  | 'date' // 日期
  | 'datetime' // 日期时间
  | 'department' // 部门
  | 'device' // 设备
  | 'location' // 定位
  | 'multiselect' // 多选
  | 'number' // 数字
  | 'person' // 人员
  | 'position' // 岗位
  | 'select' // 单选
  | 'table' // 表格
  | 'text' // 文本
  | 'textarea'; // 多行文本

/**
 * 工单字段元数据（PRD 第 6.3 节）
 *
 * 字段本身不负责实现流程，真正的业务行为由其他模块定义。
 */
export interface SchemaFieldDef {
  id: string;
  /** 字段编码（系统唯一；流程/规则不能依赖字段显示名称） */
  code: string;
  /** 字段名称（页面展示名） */
  name: string;
  /** 字段类型 */
  type: TicketFieldType;
  /** 是否必填（创建/处理时是否必填） */
  required?: boolean;
  /** 默认值 */
  defaultValue?: any;
  /** 数据源（下拉数据来源字典 code） */
  dataSource?: string;
  /** 是否可见（页面是否展示） */
  visible?: boolean;
  /** 是否可编辑（是否允许修改） */
  editable?: boolean;
  /** 校验规则（数据合法性，自然语言或表达式） */
  validation?: string;
  /** 是否参与流程规则（可作为条件） */
  usedInWorkflow?: boolean;
  /** 是否参与 SLA（可作为 SLA 条件） */
  usedInSla?: boolean;
  /** 是否参与派单（可作为派单条件） */
  usedInDispatch?: boolean;
  /** 是否系统字段（不可删除） */
  system?: boolean;
  /** 所属分组 id */
  group?: string;
  /** 排序号 */
  order?: number;
}

/** 字段分组 */
export interface FieldGroup {
  id: string;
  name: string;
  /** 包含的字段 id 列表（按顺序） */
  fieldIds: string[];
}

/** 工单字段 AI 推荐建议（基于场景描述 / 制度条款） */
export interface FieldAiSuggestion {
  id: string;
  /** 推荐依据（场景关键词 / 制度条款名称） */
  source: string;
  /** 推荐理由摘要 */
  reason: string;
  /** 建议字段数据（可回写至单据模型自定义字段表单） */
  suggestion: {
    code: string;
    /** 数据源（下拉数据来源字典 code） */
    dataSource?: string;
    /** 默认值 */
    defaultValue?: string;
    name: string;
    /** 是否必填 */
    required?: boolean;
    type: TicketFieldType;
    /** 是否参与派单 */
    usedInDispatch?: boolean;
    /** 是否参与 SLA */
    usedInSla?: boolean;
    /** 是否参与流程规则 */
    usedInWorkflow?: boolean;
  };
}

/** 工单模型（PRD 第 6 节） */
export interface TicketSchema {
  id: string;
  /** 关联场景 id */
  sceneId: string;
  /** 系统字段列表（工单编号/标题/创建人/创建时间/当前状态/当前处理人/优先级/来源/更新时间） */
  systemFields: SchemaFieldDef[];
  /** 自定义字段列表 */
  customFields: SchemaFieldDef[];
  /** 表单布局（字段分组及顺序） */
  layout?: FieldGroup[];
}

// ==================== 派单策略（PRD 第 8 节）====================

/** 分配策略（PRD 第 8.3.5 节） */
export type AssignStrategy =
  | 'fixed' // 指定人员
  | 'least-tickets' // 最少工单
  | 'load-balance' // 负载均衡
  | 'priority' // 优先级分配
  | 'random' // 随机
  | 'round-robin'; // 轮询

/** 候选范围类型（PRD 第 8.3.3 节） */
export type CandidateScopeType =
  | 'account-manager' // 设备客户经理
  | 'department' // 指定部门
  | 'dynamic' // 动态人员
  | 'field-engineer' // 一线人员
  | 'person' // 指定人员
  | 'position' // 指定岗位
  | 'role'; // 指定角色

/** 候选范围 */
export interface CandidateScope {
  /** 候选类型 */
  type: CandidateScopeType;
  /** 指定的人员/岗位/部门/角色 id 列表 */
  ids: string[];
  /** 动态人员表达式（type='dynamic' 时生效，如"工单所属客户经理"） */
  dynamicExpr?: string;
}

/**
 * 派单规则（升级版，PRD 第 8 节）
 *
 * 兼容 DispatchRule（继承其所有字段），扩展为多规则结构。
 * 注：DispatchRule.priority 是 TicketPriority（工单优先级匹配维度），
 *     V1.1 规则排序用 rulePriority（数字越小优先级越高）。
 */
export interface AssignmentRule extends DispatchRule {
  /** 规则编码（必填，唯一） */
  code?: string;
  /** 触发节点（PRD 第 8.3.1 节：工单创建/进入待派单/转派/某动作完成） */
  trigger: 'action' | 'create' | 'enter-node' | 'transfer';
  /** 触发节点 id（trigger=enter-node/action 时生效） */
  triggerNodeId?: string;
  /** 候选范围（PRD 第 8.3.3 节） */
  candidateScope: CandidateScope;
  /** 过滤条件（PRD 第 8.3.4 节：在岗/在线/技能/区域/客户归属/当前负载） */
  filters?: ConditionRule[];
  /** 分配策略 */
  strategy: AssignStrategy;
  /** 规则优先级（数字越小优先级越高；PRD 第 8.4 节） */
  rulePriority: number;
  /** 是否继续匹配（PRD 第 8.4 节：命中后是否继续匹配下一条） */
  stopOnMatch: boolean;
  /** 是否默认规则（PRD 第 8.4 节：兜底） */
  isDefault?: boolean;
}

/** 派单 AI 推荐建议（基于制度条款 / 业务规则） */
export interface AssignmentAiSuggestion {
  id: string;
  /** 推荐依据（制度条款 / 业务规则名称） */
  source: string;
  /** 推荐理由摘要 */
  reason: string;
  /** 建议规则数据（可回写至表单） */
  suggestion: {
    applyConditionText: string;
    /** 派单目标分派对象（精简为4项） */
    candidateScopeType: 'dynamic' | 'person' | 'position' | 'role';
    code: string;
    /** 动态人员表达式（type=dynamic 时） */
    dynamicExpr?: string;
    /** 兜底岗位（无人命中时转派的岗位） */
    fallbackPosition?: string;
    name: string;
    /** 分派策略（type=position/role 时） */
    strategy?:
      | 'batch-by-customer'
      | 'load-balance'
      | 'nearest-available'
      | 'round-robin';
    /** 目标人员 id（type=person 时） */
    targetPersonId?: string;
    /** 目标岗位（type=position 时） */
    targetPosition?: string;
    /** 目标角色 id（type=role 时） */
    targetRoleId?: string;
    trigger: 'action' | 'create' | 'enter-node' | 'transfer';
  };
}

/** 派单策略（一个场景一套，包含多条规则） */
export interface AssignmentPolicy {
  id: string;
  /** 关联场景 id */
  sceneId: string;
  /** 派单规则列表（按 priority 排序） */
  rules: AssignmentRule[];
  /** 默认派单人 id（所有规则都不命中时使用） */
  defaultAssigneeId?: string;
}

// ==================== SLA 策略（PRD 第 9 节）====================

/** 计时模式（PRD 第 9.5 节） */
export type TimingMode =
  | 'natural' // 自然时间（24小时连续）
  | 'service' // 服务时间（根据平台服务日历）
  | 'working'; // 工作时间（周一至周五 09:00-18:00）

/** SLA 服务目标 */
export interface SlaTarget {
  /** 目标时效（小时） */
  hours: number;
  /** 计时模式 */
  timeMode: TimingMode;
  /** 计时开始节点 id（PRD 第 9.6 节） */
  startNodeId: string;
  /** 计时结束节点 id */
  endNodeId: string;
  /** 工作时间配置（timeMode='working' 时生效） */
  worktime?: {
    /** 工作日（1-7，周一=1，周日=7） */
    days: number[];
    /** 每日结束时间 HH:mm */
    end: string;
    /** 每日开始时间 HH:mm */
    start: string;
  };
}

/** SLA 暂停规则（PRD 第 9.7 节） */
export interface PauseRule {
  id: string;
  /** 暂停条件 */
  condition: ConditionRule;
  /** 最大暂停时间（分钟） */
  maxPauseMinutes?: number;
  /** 暂停是否累计 */
  accumulate?: boolean;
}

/** SLA 预警规则（PRD 第 9.8 节） */
export interface WarnRule {
  id: string;
  /** 预警阈值（达到多少分钟时触发） */
  atMinutes: number;
  /** 通知对象（处理人/主管） */
  target: 'assignee' | 'leader';
  /** 通知渠道 */
  channels: AlertChannel[];
}

/** SLA 升级规则（PRD 第 9.9 节） */
export interface EscalateRule {
  id: string;
  /** 升级阈值（达到多少分钟时触发） */
  atMinutes: number;
  /** 升级动作 */
  action: 'create-ticket' | 'notify-leader' | 'reassign' | 'upgrade-priority';
}

/** SLA 邮件模板（预定义，供超时告警渠道引用） */
export interface SlaEmailTemplate {
  id: string;
  /** 模板名称（展示为下拉选项） */
  name: string;
  /** 模板正文（含占位符，如 {ticketCode}、{customerName}、{title}） */
  content: string;
  /** 适用场景描述 */
  scene?: string;
}

/** SLA 超时处置规则（响应超时 / 解决超时通用，V1.1 简化版） */
export interface SlaTimeoutRule {
  id: string;
  /** 规则描述 */
  description?: string;
  /** 超时后告警延迟（分钟，达到该分钟数时触发告警） */
  atMinutes: number;
  /** 通知对象 */
  target: 'assignee' | 'leader';
  /** 通知渠道 */
  channels: AlertChannel[];
  /** 邮件模板 id（channels 含 email 时展示，引用预定义邮件模板） */
  emailTemplateId?: string;
}

/**
 * SLA 策略（PRD 第 9 节）
 *
 * 定义：什么工单，要求多长时间响应/解决，以及超时后怎么办。
 * 兼容 SlaConfig（独立类型，不继承，因 SlaConfig 字段较多且结构差异较大）。
 */
export interface SlaPolicy {
  id: string;
  /** 关联场景 id */
  sceneId: string;
  /** 策略名称 */
  name: string;
  /** 策略编码 */
  code?: string;
  /** 适用条件（PRD 第 9.3 节，结构化） */
  applyCondition?: ConditionRule;
  /** 触发条件（文本描述，V1.1 简化版） */
  applyConditionText?: string;
  /** 响应目标（PRD 第 9.4 节；如 30分钟内接单） */
  responseTarget?: SlaTarget;
  /** 解决目标（PRD 第 9.4 节；如 2小时内完成） */
  resolveTarget: SlaTarget;
  /** 暂停规则列表（PRD 第 9.7 节） */
  pauseRules?: PauseRule[];
  /** 预警规则列表（PRD 第 9.8 节） */
  warnRules?: WarnRule[];
  /** 升级规则列表（PRD 第 9.9 节） */
  escalateRules?: EscalateRule[];
  /** 响应超时处置告警开关（开启后启用响应超时告警配置） */
  responseAlertEnabled?: boolean;
  /** 响应超时处置告警规则（V1.1 简化版） */
  responseTimeoutRules?: SlaTimeoutRule[];
  /** 解决超时处置告警开关（开启后启用解决超时告警配置） */
  resolveAlertEnabled?: boolean;
  /** 解决超时处置告警规则（V1.1 简化版） */
  resolveTimeoutRules?: SlaTimeoutRule[];
  /** 是否启用 */
  enabled: boolean;
}

/** SLA AI 推荐建议（基于制度条款 / 合同条款） */
export interface SlaAiSuggestion {
  id: string;
  /** 推荐依据（制度条款 / 合同条款名称） */
  source: string;
  /** 推荐理由摘要 */
  reason: string;
  /** 建议策略数据（可回写至表单） */
  suggestion: {
    applyConditionText: string;
    code: string;
    name: string;
    resolveHours: number;
    resolveTimeoutRules: SlaTimeoutRule[];
    responseHours: number;
    responseTimeoutRules: SlaTimeoutRule[];
  };
}

/** 状态流程 AI 推荐建议中的单个状态定义 */
export interface StatusFlowSuggestedNode {
  /** 状态编码 */
  code: string;
  /** 状态名称 */
  name: string;
  /** 状态类型 */
  type: FlowNodeType;
  /** 排序号 */
  order: number;
  /** 状态说明 */
  desc: string;
  /** UI 颜色 key */
  colorKey: string;
  /** 是否系统内置 */
  system?: boolean;
}

/** 状态流程 AI 推荐建议（基于制度条款，提供状态定义建议） */
export interface StatusFlowAiSuggestion {
  id: string;
  /** 推荐依据（制度条款名称） */
  source: string;
  /** 推荐理由摘要 */
  reason: string;
  /** 建议的状态定义列表 */
  suggestion: {
    /** 建议的状态节点列表 */
    nodes: StatusFlowSuggestedNode[];
    /** 适用的场景类型 */
    scenarioType: string;
  };
}

// ==================== 工单详情 · AI 处理建议（详情页右栏） ====================

/** AI 建议人工审核状态：待人工审核 / 已人工复核 */
export type AiReviewStatus = 'pending' | 'reviewed';

/** 用户对单条 AI 建议的反馈 */
export type AiFeedback = 'down' | 'up';

/** 待接单 AI 引导：接单判断依据的类型 */
export type GuideReasonType = 'case' | 'match' | 'policy';

/** 待接单 AI 引导（待接单状态下：确认接单 vs 转派的决策指引） */
export interface AcceptGuideAdvice {
  /** AI 建议动作：confirm = 建议确认接单 / transfer = 建议转派 */
  suggestion: 'confirm' | 'transfer';
  /** 建议置信度 0-100 */
  confidence: number;
  /** 一句话结论 */
  conclusion: string;
  /** 判断依据（当前问题匹配 / 历史案例 / 制度要求） */
  reasons: Array<{
    detail: string;
    title: string;
    type: GuideReasonType;
  }>;
  /** 转派提示（suggestion='transfer' 时展示） */
  transferHint?: string;
}

/** 合规性处理建议（依据现行制度条款） */
export interface ComplianceAdvice {
  id: string;
  title: string;
  content: string;
  /** 是否制度强制要求（重要建议突出显示） */
  severity: 'recommended' | 'required';
  /** 建议依据的具体制度条款 */
  clauses: Array<{
    /** 条款号 */
    clauseNo: string;
    /** 条款摘要 */
    clauseText: string;
    /** 制度文件名 */
    docName: string;
  }>;
  reviewStatus: AiReviewStatus;
}

/** 标准处理流程步骤 */
export interface StandardProcessStep {
  name: string;
  desc: string;
  /** 责任部门 */
  owner: string;
  /** 处理时限 */
  sla: string;
  done: boolean;
}

/** 标准处理流程推荐 */
export interface StandardProcessAdvice {
  id: string;
  name: string;
  /** 智能匹配理由：实施事项类型 / 紧急程度 / 涉及部门 */
  matchReason: string;
  steps: StandardProcessStep[];
  reviewStatus: AiReviewStatus;
}

/** 相似历史案例（已脱敏） */
export interface SimilarCase {
  id: string;
  code: string;
  title: string;
  /** 与当前工单的相似度 0-100 */
  similarity: number;
  /** 脱敏后的客户名 */
  customerMasked: string;
  /** 案例详情（问题摘要） */
  problem: string;
  /** 处理方案 */
  solution: string;
  /** 处理结果 */
  result: string;
  /** 经验总结 */
  lesson: string;
  durationHours: number;
  handler: string;
  completedAt: string;
}

/** 相似案例参考建议 */
export interface SimilarCasesAdvice {
  id: string;
  cases: SimilarCase[];
  reviewStatus: AiReviewStatus;
}

/** 差异化处理方案（2-3 套供选择） */
export interface RecommendedPlan {
  id: string;
  name: string;
  /** AI 首选方案 */
  recommended: boolean;
  /** AI 置信度 0-100 */
  confidence: number;
  /** 适用场景 */
  applicableScene: string;
  /** 预期效果 */
  expectedEffect: string;
  /** 潜在风险 */
  risks: string[];
  /** 方案关键步骤 */
  steps: string[];
  estimatedHours: number;
}

/** 处理方案智能推荐建议 */
export interface PlanAdvice {
  id: string;
  plans: RecommendedPlan[];
  reviewStatus: AiReviewStatus;
}

/** 上下文关联信息条目（制度文件 / 历史沟通记录 / 关联工单） */
export interface ContextLinkItem {
  id: string;
  type: 'chat' | 'kb' | 'policy' | 'ticket';
  title: string;
  summary: string;
  meta: string;
  /** 一键查看的内容详情 */
  detail: string;
}

/** 上下文信息关联建议 */
export interface ContextLinksAdvice {
  id: string;
  items: ContextLinkItem[];
}

/** 常用短语（处理记录录入快捷选择） */
export interface QuickPhrase {
  id: string;
  tag: string;
  text: string;
}

/** 工单 AI 处理建议聚合数据（详情页右栏整体） */
export interface TicketAiAdvisor {
  /** 建议生成时间 */
  generatedAt: string;
  /** 综合置信度 0-100 */
  overallConfidence: number;
  /** 整体人工审核状态 */
  reviewStatus: AiReviewStatus;
  reviewer?: string;
  /** 待接单 AI 引导（仅待接单状态生成） */
  acceptGuide?: AcceptGuideAdvice;
  /** 合规性处理建议（可多条） */
  compliance: ComplianceAdvice[];
  /** 标准处理流程推荐 */
  standardProcess: StandardProcessAdvice;
  /** 相似案例参考 */
  similarCases: SimilarCasesAdvice;
  /** 处理方案智能推荐 */
  plans: PlanAdvice;
  /** 上下文信息关联 */
  contextLinks: ContextLinksAdvice;
  /** 常用短语 */
  quickPhrases: QuickPhrase[];
}

// ============ AI 工单处理驾驶舱（演示剧本） ============

/** AI 理解结果条目（一句话报修 → 识别清单） */
export interface AiUnderstandingItem {
  /** 识别维度，如「已识别客户」 */
  label: string;
  /** 识别值，如「XX连锁门店」 */
  value: string;
}

/** AI 问题摘要卡（上报阶段确认用） */
export interface AiTicketSummary {
  /** 问题类型，如「扫码支付异常」 */
  type: string;
  /** 问题现象 */
  phenomenon: string;
  /** 影响范围 */
  impact: string;
  /** 初步判断 */
  judge: string;
  /** AI 置信度 0-100 */
  confidence: number;
}

/** AI 提交工单后的后台补全分析 */
export interface AiBackgroundAnalysis {
  /** 历史案例说明，如「过去30天该型号设备出现类似问题 18 次」 */
  historyText: string;
  /** 主要原因分布 */
  causes: Array<{ count: number; name: string }>;
  /** 推荐排查路径 */
  recommendSteps: string[];
  /** 派单说明 */
  dispatchText: string;
}

/** 驾驶舱可执行排查步骤 */
export interface CockpitStep {
  id: string;
  /** 步骤名称，如「检查设备网络」 */
  name: string;
  /** 执行方式说明 */
  desc?: string;
  /** 预计耗时 */
  estimate?: string;
  /** 执行结果 */
  status: 'ok' | 'pending' | 'running' | 'warn';
  /** 结果说明，如「网络连接正常（时延 34ms）」 */
  resultText?: string;
}

/** AI 动态重判（步骤执行后触发） */
export interface AiRejudge {
  /** 发现描述 */
  finding: string;
  /** 调整后的推荐动作 */
  recommends: string[];
  /** 更新后的置信度 */
  confidence: number;
}

/** AI 上门建议 */
export interface AiVisitAdvice {
  /** 建议上门原因 */
  reason: string;
  /** 建议携带物品 */
  items: string[];
  /** 建议处理步骤 */
  steps: string[];
  /** 预计处理时间 */
  estimate: string;
}

/** 现场处理任务项 */
export interface FieldTask {
  id: string;
  name: string;
  done: boolean;
}

/** AI 自动生成的正式处理记录 */
export interface AiSolutionReport {
  /** 故障原因 */
  cause: string;
  /** 处理过程 */
  process: string;
  /** 解决方案 */
  solution: string;
  /** 处理结果 */
  result: string;
  /** 验收建议 */
  acceptance: string;
}

/** 驾驶舱演示剧本（按工单主题编排） */
export interface CockpitScenario {
  /** 关键词，用于匹配工单标题 */
  keyword: string;
  /** AI 处理建议：问题总结 */
  summary: string;
  /** AI 处理建议：初步判断 */
  judge: string;
  /** AI 处理建议：建议先排查 */
  checkSteps: string[];
  /** 推荐处理方式：remote 远程优先 / onsite 建议上门 / transfer 建议转派 */
  recommend: 'onsite' | 'remote' | 'transfer';
  /** 推荐原因 */
  recommendReason: string;
  /** 推荐处理方式置信度 */
  confidence: number;
  /** 远程排查步骤（演示执行序列） */
  steps: CockpitStep[];
  /** 步骤执行后 AI 动态重判 */
  rejudge: AiRejudge;
  /** AI 上门建议 */
  visitAdvice: AiVisitAdvice;
  /** 现场工程师 */
  fieldEngineer: { name: string; phone: string };
  /** 现场处理任务卡 */
  fieldTasks: FieldTask[];
  /** 现场判断 */
  fieldJudge: string;
  /** 工程师一句话输入示例 */
  engineerNote: string;
  /** AI 自动生成处理记录 */
  solutionReport: AiSolutionReport;
}
