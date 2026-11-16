export type ToolType = 'MCP_HTTP' | 'MCP_SSE' | 'NATIVE';

export interface AgentTool {
  id: string;
  name: string;
  key: string;
  type: ToolType;
  description: string;
  schema?: string; // JSON string
  endpoint?: string; // For MCP
  nativeMethod?: string; // For Native
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export type AuthType = 'API_KEY' | 'BASIC' | 'BEARER' | 'NONE';

export interface PluginService {
  id: string;
  relativeUrl: string;
  method: 'DELETE' | 'GET' | 'POST' | 'PUT';
  description: string; // 入参描述
  returnType?: string; // 返回参数格式
}

export interface DataPlugin {
  id: string;
  code: string;
  name: string;
  baseUrl: string; // 基础地址
  description?: string; // 备注
  status: 'active' | 'inactive';
  authType: AuthType;
  authToken?: string; // Masked when displaying
  services: PluginService[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}
