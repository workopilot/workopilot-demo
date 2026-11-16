/**
 * 档案管理模块类型定义
 */

// ==================== 档案文件类型 ====================

/** 档案文件类型 */
export type ArchiveFileType =
  | 'audio' // 音频文件（如录音）
  | 'document' // 文档文件（如会议纪要）
  | 'image' // 图片文件
  | 'other' // 其他文件
  | 'text' // 文本文件（如转录文字）
  | 'video'; // 视频文件

/** 档案关联文件 */
export interface ArchiveFile {
  /** 文件 ID */
  id: string;
  /** 文件类型 */
  type: ArchiveFileType;
  /** 文件名称 */
  name: string;
  /** 文件 URL */
  url?: string;
  /** 文件大小 */
  size?: number;
  /** 文件描述 */
  description?: string;
  /** 创建时间 */
  createdAt: string;
}

// ==================== 文件来源类型 ====================

/** 文件来源维度 */
export type FileSourceDimension = 'application' | 'system';

/** 系统级来源类型 */
export type SystemSourceType =
  | 'system_audit'
  | 'system_backup'
  | 'system_config'
  | 'system_log'
  | 'system_report';

/** 应用级来源类型 */
export type ApplicationSourceType =
  | 'business_app'
  | 'digital_employee'
  | 'third_party_system'
  | 'user_upload';

/** 文件来源详情 */
export interface FileSource {
  /** 来源维度 */
  dimension: FileSourceDimension;
  /** 系统级来源类型 */
  systemType?: SystemSourceType;
  /** 应用级来源类型 */
  applicationType?: ApplicationSourceType;
  /** 来源名称 */
  name: string;
  /** 来源编码 */
  code: string;
  /** 来源描述 */
  description?: string;
}

// ==================== 文件分类类型 ====================

/** 文件分类方式 */
export type FileCategoryType = 'ai_match' | 'other' | 'preset';

/** 系统预置分类 */
export type PresetCategory =
  | 'announcement'
  | 'approval_doc'
  | 'certificate'
  | 'contract'
  | 'invoice'
  | 'meeting_minutes'
  | 'report';

/** AI 匹配分类 */
export type AiMatchCategory =
  | 'configuration'
  | 'contract_doc'
  | 'financial_report'
  | 'personnel_doc'
  | 'technical_doc'
  | 'voucher';

/** 文件分类 */
export interface FileCategory {
  /** 分类方式 */
  type: FileCategoryType;
  /** 系统预置分类 */
  presetType?: PresetCategory;
  /** AI 匹配分类 */
  aiMatchType?: AiMatchCategory;
  /** 分类名称 */
  name: string;
  /** 分类编码 */
  code: string;
  /** 置信度 (AI 匹配时) */
  confidence?: number;
  /** 匹配关键词 */
  keywords?: string[];
}

// ==================== 权限类型 ====================

/** 数据权限类型 */
export type DataPermissionType =
  | 'all_data'
  | 'department_and_below'
  | 'personal_only';

/** 特殊权限约束类型 */
export type SpecialPermissionType =
  | 'contract_only_self'
  | 'department_admin'
  | 'normal_employee_default'
  | 'sensitive_dept_restricted';

/** 数据权限配置 */
export interface DataPermission {
  /** 权限类型 */
  type: DataPermissionType;
  /** 组织 ID 列表 */
  organizationIds?: string[];
  /** 部门 ID 列表 */
  departmentIds?: string[];
  /** 角色 ID 列表 */
  roleIds?: string[];
  /** 特殊权限约束 */
  specialPermissions?: SpecialPermissionType[];
}

// ==================== 文件实体 ====================

/** 文件状态 */
export type FileStatus = 'archived' | 'deleted' | 'normal';

/** 文件敏感级别 */
export type FileSensitivityLevel =
  | 'confidential'
  | 'internal'
  | 'public'
  | 'secret';

/** 文件标签 */
export interface FileTag {
  /** 标签 ID */
  id: string;
  /** 标签名称 */
  name: string;
  /** 标签颜色 */
  color?: string;
}

/** 档案信息 */
export interface FileInfo {
  /** 档案 ID */
  id: string;
  /** 档案编号 */
  archiveNo: string;
  /** 档案标题 */
  title: string;
  /** 文件扩展名 */
  extension: string;
  /** 文件大小（字节） */
  size: number;
  /** 文件类型 MIME */
  mimeType: string;
  /** 文件存储路径 */
  storagePath: string;
  /** 文件访问 URL */
  accessUrl?: string;

  // 来源信息
  source: FileSource;

  // 分类信息
  category: FileCategory;

  // 权限信息
  sensitivityLevel: FileSensitivityLevel;
  dataPermission: DataPermission;

  // 上传信息
  uploaderId: string;
  uploaderName: string;
  uploaderDeptId: string;
  uploaderDeptName: string;
  uploadedAt: string;

  // 状态信息
  status: FileStatus;

  // AI 生成内容
  /** 文件摘要 - AI 分析自动生成 */
  fileSummary?: string;
  /** 文件标签 - 支持多个标签 */
  fileTags?: FileTag[];

  // 用户输入内容
  /** 用户描述 - 用户上传时自行添加的备注 */
  userDescription?: string;

  // 关联文件列表（用于详情卡片展示）
  relatedFiles?: ArchiveFile[];

  // 结构化数据（用于详情展示）
  structuredData?: Record<string, any>;

  // 时间戳
  createdAt: string;
  updatedAt: string;
}

// ==================== 操作日志类型 ====================

/** 文件操作类型 */
export type FileOperationType =
  | 'archive'
  | 'category_change'
  | 'delete'
  | 'download'
  | 'forward'
  | 'permission_change'
  | 'restore'
  | 'upload'
  | 'view';

/** 文件操作日志 */
export interface FileOperationLog {
  /** 日志 ID */
  id: string;
  /** 文件 ID */
  fileId: string;
  /** 文件名称（快照） */
  fileName: string;
  /** 操作类型 */
  operation: FileOperationType;
  /** 操作人 ID */
  operatorId: string;
  /** 操作人姓名 */
  operatorName: string;
  /** 操作人部门 */
  operatorDept: string;
  /** 操作时间 */
  operatedAt: string;
  /** 操作详情 */
  detail?: string;
  /** 操作结果 */
  result: 'failed' | 'success';
  /** 失败原因 */
  failureReason?: string;
  /** IP 地址 */
  ipAddress?: string;
}

// ==================== 文件列表查询参数 ====================

/** 文件列表查询参数 */
export interface FileListQuery {
  /** 页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 文件名称关键词 */
  keyword?: string;
  /** 来源维度过滤 */
  sourceDimension?: FileSourceDimension;
  /** 具体来源类型过滤 */
  sourceType?: string;
  /** 分类类型过滤 */
  categoryType?: FileCategoryType;
  /** 具体分类过滤 */
  categoryCode?: string;
  /** 敏感级别过滤 */
  sensitivityLevel?: FileSensitivityLevel;
  /** 上传人 ID */
  uploaderId?: string;
  /** 上传时间范围-开始 */
  uploadedAfter?: string;
  /** 上传时间范围-结束 */
  uploadedBefore?: string;
  /** 文件扩展名 */
  extension?: string;
}

/** 文件列表响应 */
export interface FileListResponse {
  /** 文件列表 */
  items: FileInfo[];
  /** 总数 */
  total: number;
  /** 当前页 */
  page: number;
  /** 每页数量 */
  pageSize: number;
}

// ==================== 文件日志查询参数 ====================

/** 文件日志查询参数 */
export interface FileLogQuery {
  /** 页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 文件 ID */
  fileId?: string;
  /** 操作类型 */
  operation?: FileOperationType;
  /** 操作人 ID */
  operatorId?: string;
  /** 操作时间范围-开始 */
  operatedAfter?: string;
  /** 操作时间范围-结束 */
  operatedBefore?: string;
}

/** 文件日志列表响应 */
export interface FileLogListResponse {
  /** 日志列表 */
  items: FileOperationLog[];
  /** 总数 */
  total: number;
  /** 当前页 */
  page: number;
  /** 每页数量 */
  pageSize: number;
}

// ==================== 文件分类配置 ====================

/** 文件分类配置项 */
export interface FileCategoryConfig {
  /** 分类 ID */
  id: string;
  /** 分类名称 */
  name: string;
  /** 分类编码 */
  code: string;
  /** 分类方式 */
  type: FileCategoryType;
  /** 父分类 ID */
  parentId?: string;
  /** 分类层级 */
  level: number;
  /** 排序 */
  sort: number;
  /** 关键词列表（用于 AI 匹配） */
  keywords?: string[];
  /** 是否启用 */
  enabled: boolean;
  /** 描述 */
  description?: string;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

// ==================== 文件上传 ====================

/** 文件上传参数 */
export interface FileUploadParams {
  /** 文件对象 */
  file: File;
  /** 来源信息 */
  source: FileSource;
  /** 分类 ID（可选，不传则由 AI 自动分类） */
  categoryId?: string;
  /** 敏感级别 */
  sensitivityLevel?: FileSensitivityLevel;
  /** 自定义权限配置（可选） */
  customPermission?: DataPermission;
}

/** 文件上传响应 */
export interface FileUploadResponse {
  /** 文件信息 */
  fileInfo: FileInfo;
  /** AI 分类结果 */
  aiCategoryResult?: {
    /** 匹配的分类 */
    category: FileCategory;
    /** 置信度 */
    confidence: number;
  };
}

// ==================== 权限配置 ====================

/** 权限规则配置 */
export interface PermissionRuleConfig {
  /** 规则 ID */
  id: string;
  /** 规则名称 */
  name: string;
  /** 适用分类（全部则不限制） */
  applicableCategories?: string[];
  /** 数据权限类型 */
  dataPermissionType: DataPermissionType;
  /** 适用组织 */
  organizationIds?: string[];
  /** 适用部门 */
  departmentIds?: string[];
  /** 适用角色 */
  roleIds?: string[];
  /** 特殊权限约束 */
  specialPermissions?: SpecialPermissionType[];
  /** 优先级（数字越大优先级越高） */
  priority: number;
  /** 是否启用 */
  enabled: boolean;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

// ==================== 档案授权类型 ====================

/** 授权目标类型 */
export enum GrantTargetType {
  DEPARTMENT = 'department',
  GROUP = 'group',
  USER = 'user',
}

/** 档案操作权限 */
export enum FilePermission {
  DELETE = 'delete', // 删除权限
  DOWNLOAD = 'download', // 下载权限
  EDIT = 'edit', // 编辑权限
  MANAGE = 'manage', // 管理权限（包含所有权限）
  SHARE = 'share', // 分享权限
  VIEW = 'view', // 查看权限
}

/** 授权目标信息 */
export interface GrantTarget {
  /** 目标 ID */
  id: string;
  /** 目标类型 */
  type: GrantTargetType;
  /** 目标名称 */
  name: string;
  /** 头像/图标 */
  avatar?: string;
  /** 部门名称（当 type 是 user 时） */
  department?: string;
}

/** 档案授权记录 */
export interface FileGrant {
  /** 授权 ID */
  id: string;
  /** 档案 ID */
  fileId: string;
  /** 授权目标 */
  target: GrantTarget;
  /** 授权的权限列表 */
  permissions: FilePermission[];
  /** 授权人 ID */
  grantorId: string;
  /** 授权人姓名 */
  grantorName: string;
  /** 授权时间 */
  grantedAt: string;
  /** 过期时间（可选，null 表示永久） */
  expiresAt?: null | string;
  /** 是否有效 */
  active: boolean;
  /** 备注 */
  remark?: string;
}

/** 授权请求参数 */
export interface GrantRequest {
  /** 档案 ID 列表 */
  fileIds: string[];
  /** 授权目标列表 */
  targets: Array<{
    /** 目标 ID */
    id: string;
    /** 目标类型 */
    type: GrantTargetType;
  }>;
  /** 授权的权限列表 */
  permissions: FilePermission[];
  /** 过期时间（可选） */
  expiresAt?: string;
  /** 备注 */
  remark?: string;
}

/** 授权列表查询参数 */
export interface GrantListQuery {
  /** 页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 档案 ID */
  fileId?: string;
  /** 目标类型过滤 */
  targetType?: GrantTargetType;
  /** 是否只显示有效授权 */
  activeOnly?: boolean;
}
