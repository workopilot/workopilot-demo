/**
 * Mock API 类型定义
 * 与前端类型定义保持一致
 */

// 业务系统相关类型
export type AuthType = 'Basic' | 'OAuth';
export type SystemStatus = 'disabled' | 'enabled';
export type SystemVendor = 'Custom' | 'Kingdee' | 'SAP' | 'Yonyou';

export interface BasicAuthConfig {
  type: 'Basic';
  username: string;
  password: string;
}

export interface OAuthConfig {
  type: 'OAuth';
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
}

export type AuthConfig = BasicAuthConfig | OAuthConfig;

export interface SourceSystem {
  id: string;
  name: string;
  code: string;
  vendor: SystemVendor;
  baseUrl: string;
  authConfig: AuthConfig;
  status: SystemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latency?: number;
}

// 单据类型相关类型
export type ExtractionStrategyType = 'CSS' | 'ID' | 'REGEX' | 'XPATH';

export interface ExtractionStrategy {
  type: ExtractionStrategyType;
  selector: string;
}

export interface FieldExtractionRule {
  id: string;
  fieldKey: string;
  fieldDesc: string;
  required: boolean;
  strategies: ExtractionStrategy[];
}

export interface BillType {
  id: string;
  code: string;
  name: string;
  systemId: string;
  systemName: string;
  description?: string;
  enabled: boolean;
  urlRegex: string;
  extractionRules: FieldExtractionRule[];
  createdAt: string;
  updatedAt: string;
}

export interface BillTypeTreeNode {
  key: string;
  title: string;
  type: 'billType' | 'system';
  systemId?: string;
  billTypeId?: string;
  children?: BillTypeTreeNode[];
}

// 费用科目相关类型
export interface ExpenseCategory {
  id: string;
  code: string;
  name: string;
  parentId?: string;
  system: string;
  aliases: string[];
  children?: ExpenseCategory[];
  createdAt: string;
  updatedAt: string;
}

// 插件设置相关类型
export type FloatPosition = 'bottom-left' | 'bottom-right';

export interface PluginGlobalConfig {
  privateDeployment: boolean;
  apiUrl?: string;
  debugMode: boolean;
  floatPosition: FloatPosition;
}
