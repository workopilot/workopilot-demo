/**
 * 服务调用日志相关类型
 */

// 调用状态
export type CallStatus = 'failed' | 'success';

// 服务调用日志信息（对应数据库表 service_call_logs）
export interface ServiceCallLog {
  id: string; // 日志ID
  requestId: string; // 请求ID
  subscriptionId?: string; // 订阅ID
  tenantId: string; // 租户ID
  tenantName?: string; // 租户名称
  productId?: string; // 产品ID
  productSpecId?: string; // 产品规格ID
  serviceName: string; // 服务名称
  version?: string; // 版本号
  documentNo?: string; // 业务单号
  callCount: number; // 调用次数
  callStatus: CallStatus; // 调用状态
  requestIp?: string; // 请求IP
  requestUser?: string; // 请求用户
  requestMethod?: string; // 请求方法
  requestUrl?: string; // 请求URL
  requestHeaders?: Record<string, string>; // 请求头
  requestParams?: Record<string, any>; // 请求参数
  requestBody?: Record<string, any> | string; // 请求体
  responseCode?: number; // 响应状态码
  responseTime?: number; // 响应时间（毫秒）
  responseHeaders?: Record<string, string>; // 响应头
  responseBody?: Record<string, any> | string; // 响应体
  responseData?: Record<string, any>; // 响应数据
  errorCode?: string; // 错误代码
  errorMessage?: string; // 错误信息
  callTime: string; // 调用时间
  createdAt: string; // 创建时间
}

// 查询参数
export interface ServiceCallLogQueryParams {
  requestId?: string; // 请求ID筛选
  subscriptionId?: string; // 订阅ID筛选
  tenantName?: string; // 租户名称筛选
  serviceName?: string; // 服务名称筛选
  version?: string; // 版本号筛选
  documentNo?: string; // 业务单号筛选
  callStatus?: CallStatus; // 状态筛选
  requestIp?: string; // 请求IP筛选
  requestUser?: string; // 请求用户筛选
  startTime?: string; // 开始时间
  endTime?: string; // 结束时间
  page: number;
  pageSize: number;
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// 调用状态映射
export const CallStatusMap: Record<CallStatus, string> = {
  success: '成功',
  failed: '失败',
};

// 调用状态颜色映射
export const CallStatusColorMap: Record<CallStatus, string> = {
  success: 'success',
  failed: 'error',
};
