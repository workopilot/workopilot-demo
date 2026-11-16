/**
 * 文件管理 API
 */

import type {
  FileCategoryConfig,
  FileGrant,
  FileListQuery,
  FileLogListResponse,
  FileSource,
  FileUploadResponse,
  GrantListQuery,
  GrantRequest,
  PermissionRuleConfig,
} from '#/types/file-management';

import {
  batchDeleteFilesApi,
  cancelGrantApi,
  deleteFileApi,
  getFileDetailApi,
  getFileGrantsApi,
  getFileListApi,
  getFileLogsApi,
  getFileSourcesApi,
  getPermissionRulesApi,
  grantFilesApi,
  uploadFileApi,
} from './mock-data-file-management';

// ==================== 文件列表 ====================

/** 获取文件列表 */
export async function getFileList(params: FileListQuery) {
  return getFileListApi(params);
}

/** 获取文件详情 */
export async function getFileDetail(id: string) {
  return getFileDetailApi(id);
}

// ==================== 文件上传 ====================

/** 上传文件 */
export async function uploadFile(params: {
  categoryId?: string;
  file: File;
  fileTags?: Array<{ color: string; id: string; name: string }>;
  sensitivityLevel?: string;
  source: FileSource;
  userDescription?: string;
}): Promise<{ data: FileUploadResponse }> {
  return uploadFileApi(params);
}

// ==================== 文件删除 ====================

/** 删除文件 */
export async function deleteFile(id: string) {
  return deleteFileApi(id);
}

/** 批量删除文件 */
export async function batchDeleteFiles(ids: string[]) {
  return batchDeleteFilesApi(ids);
}

// ==================== 文件来源 ====================

/** 获取文件来源列表 */
export async function getFileSources(): Promise<{ data: FileSource[] }> {
  return getFileSourcesApi();
}

// ==================== 文件分类 ====================

/** 获取分类配置列表 */
export async function getCategoryConfigs(): Promise<{
  data: FileCategoryConfig[];
}> {
  return getCategoryConfigsApi();
}

/** 创建分类配置 */
export async function createCategoryConfig(
  data: Partial<FileCategoryConfig>,
): Promise<{ data: FileCategoryConfig }> {
  // Mock 实现
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    data: {
      id: String(Date.now()),
      name: data.name || '',
      code: data.code || '',
      type: data.type || 'other',
      level: data.level || 1,
      sort: data.sort || 0,
      keywords: data.keywords,
      enabled: data.enabled ?? true,
      description: data.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}

/** 更新分类配置 */
export async function updateCategoryConfig(
  _id: string,
  data: Partial<FileCategoryConfig>,
): Promise<{ data: FileCategoryConfig }> {
  // Mock 实现
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    data: {
      id: _id,
      name: data.name || '',
      code: data.code || '',
      type: data.type || 'other',
      level: data.level || 1,
      sort: data.sort || 0,
      keywords: data.keywords,
      enabled: data.enabled ?? true,
      description: data.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}

/** 删除分类配置 */
export async function deleteCategoryConfig(_id: string) {
  // Mock 实现
  await new Promise((resolve) => setTimeout(resolve, 300));
  return { code: 0, data: undefined, message: 'success' };
}

// ==================== 权限规则 ====================

/** 获取权限规则列表 */
export async function getPermissionRules(): Promise<{
  data: PermissionRuleConfig[];
}> {
  return getPermissionRulesApi();
}

/** 创建权限规则 */
export async function createPermissionRule(
  data: Partial<PermissionRuleConfig>,
): Promise<{ data: PermissionRuleConfig }> {
  // Mock 实现
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    data: {
      id: String(Date.now()),
      name: data.name || '',
      dataPermissionType: data.dataPermissionType || 'all_data',
      applicableCategories: data.applicableCategories,
      departmentIds: data.departmentIds,
      roleIds: data.roleIds,
      specialPermissions: data.specialPermissions,
      priority: data.priority || 0,
      enabled: data.enabled ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}

/** 更新权限规则 */
export async function updatePermissionRule(
  _id: string,
  data: Partial<PermissionRuleConfig>,
): Promise<{ data: PermissionRuleConfig }> {
  // Mock 实现
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    data: {
      id: _id,
      name: data.name || '',
      dataPermissionType: data.dataPermissionType || 'all_data',
      applicableCategories: data.applicableCategories,
      departmentIds: data.departmentIds,
      roleIds: data.roleIds,
      specialPermissions: data.specialPermissions,
      priority: data.priority || 0,
      enabled: data.enabled ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}

/** 删除权限规则 */
export async function deletePermissionRule(_id: string) {
  // Mock 实现
  await new Promise((resolve) => setTimeout(resolve, 300));
  return { code: 0, data: undefined, message: 'success' };
}

// ==================== 操作日志 ====================

/** 获取文件操作日志 */
export async function getFileLogs(params: {
  fileId?: string;
  operation?: string;
  page: number;
  pageSize: number;
}): Promise<{ data: FileLogListResponse }> {
  return getFileLogsApi(params);
}

/** 导出操作日志 */
export async function exportFileLogs(_params: {
  endDate?: string;
  fileId?: string;
  operation?: string;
  startDate?: string;
}) {
  // Mock 实现
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    code: 0,
    data: { downloadUrl: '/api/logs/export' },
    message: 'success',
  };
}

// ==================== 档案授权 ====================

/** 授权档案 */
export async function grantFiles(
  data: GrantRequest,
): Promise<{ data: FileGrant[] }> {
  return grantFilesApi(data);
}

/** 获取档案授权列表 */
export async function getFileGrants(params: GrantListQuery): Promise<{
  data: { items: FileGrant[]; page: number; pageSize: number; total: number };
}> {
  return getFileGrantsApi(params);
}

/** 获取用户的档案授权 */
export async function getUserGrants(): Promise<{ data: FileGrant[] }> {
  // Mock 实现
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    data: [],
  };
}

/** 取消授权 */
export async function cancelGrant(grantId: string): Promise<{ data: null }> {
  return cancelGrantApi(grantId);
}
