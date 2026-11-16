export type ServiceType = 'AUDIT' | 'CHAT';
export type OutputType = 'JSON' | 'MARKDOWN' | 'TEXT';
export type RouteMode = 'CODE' | 'INTENT';
export type InputComponentType = 'input' | 'select' | 'switch' | 'textarea';

export interface AiInputConfig {
  name: string;
  type: string;
  desc: string;
  ui: InputComponentType;
  options?: string[]; // For select
  defaultValue?: any;
}

export interface AiModelConfig {
  provider: string;
  model: string;
  temperature: number;
  topP: number;
  maxTokens?: number;
}

export interface AiServiceDef {
  id: string; // BIGINT in DB, string in frontend
  tenantId?: string;
  serviceName: string;
  serviceCode: string;
  aiModelId?: string; // ID of the LlmTenantModel
  description?: string;
  executionMode: ServiceType;
  tags?: string[];
  modelConfig: AiModelConfig;
  inputSchema: AiInputConfig[]; // Array of input definitions
  systemPrompt?: string;
  outputType: OutputType;
  outputSchema?: any; // JSON Schema for output validation
  isActive: boolean; // 1: enabled, 0: disabled
  isRouteEnabled?: boolean; // 0/1 mapped to boolean
  routeMode?: RouteMode;
  intentPrompt?: string; // Prompt base for intent recognition
  routes?: AiServiceRouteDef[]; // local routing table
  maxHistory?: number;
  enableHistory?: boolean;
  toolIds?: string[]; // IDs of associated tools
  createdAt?: string;
  updatedAt?: string;
}

export interface AiServiceRouteDef {
  id?: string;
  serviceId?: string;
  routeCode: string;
  routeName: string;
  systemPrompt: string;
  isActive: boolean;
}

export interface AiModel {
  id: string;
  name: string;
  provider: string; // OpenAI, Azure, etc.
  code: string;
}

export interface AiTool {
  id: string;
  name: string;
  code: string;
  description: string;
  parameters: any; // JSON Schema for tool parameters
}

export interface AiServiceQuery {
  pageIndex: number;
  pageSize: number;
  serviceName?: string;
  serviceCode?: string;
  isActive?: number;
  tags?: string[];
}

export interface ApiKeyDef {
  label: string;
  value: string;
  vendor: string;
}

export interface AiApiKey {
  id: string; // BIGINT in DB, string in frontend
  tenantId: string;
  createdBy: string;
  createdTime: string; // ISO 8601
  remark: string;
  accessKey: string;
  permissions: string[]; // JSON array e.g. ["*"]
  expirationTime?: string; // ISO 8601, nullable
  status: number; // 1: Active, 0: Revoked/Disabled
}

export interface AiApiKeyLog {
  id: string;
  apiKeyId: string;
  requestUrl: string;
  requestMethod: string;
  requestData: string; // Truncated
  responseData: string; // Truncated
  createdTime: string;
  isSuccess: boolean;
  message?: string;
}
