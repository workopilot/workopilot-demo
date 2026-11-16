/**
 * 文件存储管理 API
 */

import type {
  StorageConfigForm,
  StorageConfigQuery,
} from '#/types/file-storage';

import {
  createStorageConfigApi,
  deleteStorageConfigApi,
  getStorageConfigDetailApi,
  getStorageConfigsApi,
  testConnectionApi,
  toggleStorageConfigStatusApi,
  updateStorageConfigApi,
} from './mock-data-file-storage';

// ==================== 存储配置列表 ====================

/** 获取存储配置列表 */
export async function getStorageConfigs(params: StorageConfigQuery) {
  return getStorageConfigsApi(params);
}

/** 获取存储配置详情 */
export async function getStorageConfigDetail(id: string) {
  return getStorageConfigDetailApi(id);
}

// ==================== 存储配置操作 ====================

/** 创建存储配置 */
export async function createStorageConfig(form: StorageConfigForm) {
  return createStorageConfigApi(form);
}

/** 更新存储配置 */
export async function updateStorageConfig(id: string, form: StorageConfigForm) {
  return updateStorageConfigApi(id, form);
}

/** 删除存储配置 */
export async function deleteStorageConfig(id: string) {
  return deleteStorageConfigApi(id);
}

// ==================== 其他操作 ====================

/** 测试连接 */
export async function testConnection(id: string) {
  return testConnectionApi(id);
}

/** 切换状态 */
export async function toggleStorageConfigStatus(id: string) {
  return toggleStorageConfigStatusApi(id);
}
