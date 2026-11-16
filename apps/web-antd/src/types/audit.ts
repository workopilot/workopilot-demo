export type AuditScope = 'entire' | 'line';
export type RuleStatus = 'active' | 'inactive';
export type DataSourceType = 'ATTACH' | 'PLUGIN' | 'POLICY';
export type ActionType = 'BLOCK' | 'WARNING';

export interface DataSource {
  type: DataSourceType;
  filterCats?: string[]; // e.g., ['增值税发票', '酒店水单']
  pluginId?: string;
  serviceId?: string;
  serviceName?: string;
  policyId?: string;
  policyName?: string; // Cache name for display
  clauses?: { content: string; id: string; title: string }[];
  params?: Record<string, string>;
}

export interface AuditRule {
  id: string;
  code: string;
  name: string;
  scope: AuditScope;
  applicableCategories?: string[]; // e.g., ['住宿费', '业务招待费']
  prompt: string;
  description?: string;
  version: string;
  status: RuleStatus;
  dataSources: DataSource[]; // Dependencies
  tools: string[]; // e.g., ['exchange_rate']
  usageCount: number; // Mock usage count
  createdAt: string;
  updatedAt: string;
}

export interface SchemeRuleConfig {
  ruleId: string;
  action: ActionType;
  priority: number; // Sort order
  localConfidenceThreshold?: number;
  paramOverrides?: Record<string, any>;
}

export interface AuditScheme {
  id: string;
  code: string;
  name: string;
  billType: string; // e.g., 'SAP_TRAVEL'
  globalConfidenceThreshold: number;
  rules: SchemeRuleConfig[];
  createdAt: string;
  updatedAt: string;
}

export interface SandboxResult {
  passed: boolean;
  reason: string;
  duration: string;
  tokens: number;
  confidence: 'High' | 'Low' | 'Medium';
  toolLogs?: string[];
  contextSnapshot?: Record<string, any>;
}
