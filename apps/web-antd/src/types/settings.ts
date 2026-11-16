/**
 * 业务系统相关类型
 */

// 鉴权类型
export type AuthType = 'Basic' | 'OAuth';

// 业务系统状态
export type SystemStatus = 'disabled' | 'enabled';

// 业务系统厂商
export type SystemVendor = 'Custom' | 'Kingdee' | 'SAP' | 'Yonyou';

// Basic Auth配置
export interface BasicAuthConfig {
  type: 'Basic';
  username: string;
  password: string;
}

// OAuth配置
export interface OAuthConfig {
  type: 'OAuth';
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
}

// 鉴权配置联合类型
export type AuthConfig = BasicAuthConfig | OAuthConfig;

// 审核策略类型
export type AuditStrategyType = 'assist' | 'full_auto' | 'semi_auto';

// 状态映射配置
export interface StatusMapping {
  pass: number;
  rejected: number;
}

// 审核策略配置
export interface AuditPolicy {
  strategy: AuditStrategyType; // 审核策略：辅助、半自动、全自动
  confidenceThreshold?: number; // 置信度阈值（半自动时使用）
  approveApi: string; // 审核通过接口地址
  approveMethod: 'GET' | 'POST'; // 请求方法
  approveParams: {
    billid: string; // billid模板，如 "{{bill_id}}"
    manualReview: string; // 是否需要人工审核模板
    message: string; // 总结模板
    states: string; // approve_status模板
  };
  statusMapping: StatusMapping; // 状态映射值
}

// 业务系统
export interface SourceSystem {
  id: string;
  name: string;
  code: string;
  vendor: SystemVendor;
  baseUrl: string;
  authConfig: AuthConfig;
  status: SystemStatus;
  auditPolicy?: AuditPolicy; // 审核策略配置
  createdAt: string;
  updatedAt: string;
}

// 连接测试结果
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latency?: number; // ping延迟(ms)
}

/**
 * 单据类型相关类型
 */

// 提取策略类型
export type ExtractionStrategyType = 'CSS' | 'ID' | 'REGEX' | 'XPATH';

// 提取策略
export interface ExtractionStrategy {
  type: ExtractionStrategyType;
  selector: string;
}

// 字段提取规则
export interface FieldExtractionRule {
  id: string;
  fieldKey: string; // 字段键,如 bill_no
  fieldDesc: string; // 字段描述,如 单据号
  required: boolean; // 是否必填
  strategies: ExtractionStrategy[]; // 提取策略列表,按优先级排序
}

// 单据类型
export interface BillType {
  id: string;
  code: string;
  name: string;
  systemId: string; // 所属系统ID
  systemName: string; // 所属系统名称
  description?: string;
  enabled: boolean;
  urlRegex: string; // URL匹配正则表达式
  extractionRules: FieldExtractionRule[]; // 字段提取规则
  createdAt: string;
  updatedAt: string;
}

// 单据类型树节点(用于左侧树形结构)
export interface BillTypeTreeNode {
  key: string;
  title: string;
  type: 'billType' | 'system';
  systemId?: string;
  billTypeId?: string;
  children?: BillTypeTreeNode[];
}

/**
 * 费用科目相关类型
 */

// 费用科目
export interface ExpenseCategory {
  id: string;
  code: string;
  name: string;
  parentId?: string; // 父科目ID
  system: string; // 所属系统(如 "通用", "SAP", "用友")
  aliases: string[]; // AI别名
  children?: ExpenseCategory[]; // 子科目
  createdAt: string;
  updatedAt: string;
}

/**
 * 插件全局设置相关类型
 */

// 悬浮球位置
export type FloatPosition = 'bottom-left' | 'bottom-right';

// 插件全局设置
export interface PluginGlobalConfig {
  privateDeployment: boolean; // 是否启用私有化部署
  apiUrl?: string; // 私有化API地址
  debugMode: boolean; // 调试模式
  floatPosition: FloatPosition; // 悬浮球位置
}

/**
 * API请求/响应相关类型
 */

// 通用分页参数
export interface PaginationParams {
  page: number;
  pageSize: number;
}

// 通用分页响应
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// 通用API响应
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/**
 * 安全与权限相关类型
 */

// 管理员状态
export type AdminStatus = 'active' | 'disabled';

// MFA状态
export type MfaStatus = 'disabled' | 'enabled';

// 管理员
export interface Admin {
  id: string;
  username: string; // 用户名
  realName: string; // 姓名
  roleId: string; // 角色ID
  roleName: string; // 角色名称
  mfaEnabled: MfaStatus; // MFA状态
  lastLoginAt?: string; // 最后登录时间
  status: AdminStatus; // 状态
  createdAt: string;
  updatedAt: string;
}

// 角色状态
export type RoleStatus = 'disabled' | 'enabled';

// 角色
export interface Role {
  id: string;
  name: string; // 角色名称
  permissionKey: string; // 权限字符
  dataPermission: string; // 数据权限
  sort: number; // 排序
  status: RoleStatus; // 状态
  description?: string; // 描述
  permissions: Permission[]; // 权限列表
  adminCount: number; // 管理员数量
  isSystem: boolean; // 是否系统角色
  createdAt: string;
  updatedAt: string;
}

// 权限类型
export type PermissionType = 'module' | 'operation';

// 权限
export interface Permission {
  id: string;
  key: string; // 权限键,如 audit:view
  name: string; // 权限名称
  type: PermissionType; // 类型: module-模块, operation-操作
  parentId?: string; // 父权限ID
  children?: Permission[]; // 子权限
}

// 权限树节点
export interface PermissionTreeNode {
  key: string;
  title: string;
  type: PermissionType;
  permissionId: string;
  children?: PermissionTreeNode[];
}
