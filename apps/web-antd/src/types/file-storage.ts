/**
 * 文件存储管理模块类型定义
 */

/** 权限桶类型 */
export type BucketPermissionType = 'custom' | 'private' | 'public';

/** 存储配置状态 */
export type StorageConfigStatus = 'disabled' | 'enabled';

/** 文件存储配置 */
export interface FileStorageConfig {
  /** 配置ID */
  id: string;
  /** 配置名称 */
  configName: string;
  /** 服务地址 */
  serviceUrl: string;
  /** 自定义域名 */
  customDomain?: string;
  /** Access Key */
  accessKey: string;
  /** Secret Key */
  secretKey: string;
  /** 桶名称 */
  bucketName: string;
  /** 前缀 */
  prefix?: string;
  /** 权限桶类型 */
  bucketPermission: BucketPermissionType;
  /** 是否HTTPS */
  isHttps: boolean;
  /** 区域 */
  region?: string;
  /** 备注 */
  remark?: string;
  /** 状态 */
  status: StorageConfigStatus;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/** 存储配置列表查询参数 */
export interface StorageConfigQuery {
  /** 页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 配置名称关键词 */
  configName?: string;
  /** 服务地址关键词 */
  serviceUrl?: string;
  /** 桶名称关键词 */
  bucketName?: string;
  /** 权限桶类型 */
  bucketPermission?: BucketPermissionType;
}

/** 存储配置列表响应 */
export interface StorageConfigListResponse {
  /** 配置列表 */
  items: FileStorageConfig[];
  /** 总数 */
  total: number;
  /** 当前页 */
  page: number;
  /** 每页数量 */
  pageSize: number;
}

/** 新增/编辑存储配置表单 */
export interface StorageConfigForm {
  /** 配置ID（编辑时需要） */
  id?: string;
  /** 配置名称 */
  configName: string;
  /** 服务地址 */
  serviceUrl: string;
  /** 自定义域名 */
  customDomain?: string;
  /** Access Key */
  accessKey: string;
  /** Secret Key */
  secretKey: string;
  /** 桶名称 */
  bucketName: string;
  /** 前缀 */
  prefix?: string;
  /** 权限桶类型 */
  bucketPermission: BucketPermissionType;
  /** 是否HTTPS */
  isHttps: boolean;
  /** 区域 */
  region?: string;
  /** 备注 */
  remark?: string;
}
