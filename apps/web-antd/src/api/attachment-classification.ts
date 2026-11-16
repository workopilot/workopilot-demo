/**
 * 附件分类相关 API
 */

import type {
  AttachmentClassification,
  AttachmentGroup,
  ClassificationStrategy,
  FieldRule,
  TestParams,
} from '#/types/attachment-classification';

import {
  createMockResponse,
  mockAttachmentClassifications,
  mockAttachmentGroups,
  mockClassificationStrategy,
  mockDelay,
  mockTestResults,
} from './mock-data-attachment';

/**
 * 附件分类相关 API
 */

// --- 附件组相关 API ---

// 获取附件组列表
export async function getAttachmentGroupsApi() {
  await mockDelay();
  return createMockResponse(mockAttachmentGroups);
}

// 新增附件组
export async function createAttachmentGroupApi(data: Partial<AttachmentGroup>) {
  await mockDelay();
  const newGroup: AttachmentGroup = {
    id: String(Date.now()),
    code: data.code || '',
    name: data.name || '',
    description: data.description,
    groupMode: data.groupMode || 'page',
    enabled: data.enabled ?? true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockAttachmentGroups.push(newGroup);
  return createMockResponse(newGroup);
}

// 更新附件组
export async function updateAttachmentGroupApi(
  id: string,
  data: Partial<AttachmentGroup>,
) {
  await mockDelay();
  const index = mockAttachmentGroups.findIndex((g) => g.id === id);
  if (index !== -1) {
    mockAttachmentGroups[index] = {
      ...mockAttachmentGroups[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return createMockResponse(mockAttachmentGroups[index]);
  }
  throw new Error('附件组不存在');
}

// 删除附件组
export async function deleteAttachmentGroupApi(id: string) {
  await mockDelay();
  const index = mockAttachmentGroups.findIndex((g) => g.id === id);
  if (index !== -1) {
    mockAttachmentGroups.splice(index, 1);
  }
  return createMockResponse(undefined);
}

// --- 附件分类相关 API ---

// 获取附件分类列表
export async function getClassificationsApi() {
  await mockDelay();
  return createMockResponse(mockAttachmentClassifications);
}

// 新增附件分类
export async function createClassificationApi(
  data: Partial<AttachmentClassification>,
) {
  await mockDelay();
  const newClassification: AttachmentClassification = {
    id: String(Date.now()),
    groupIds: data.groupIds,
    name: data.name || '',
    code: data.code || '',
    description: data.description,
    enabled: data.enabled ?? true,
    documentMode: data.documentMode || 'page',
    extractionMode: data.extractionMode || 'OCR',
    ocrVendor: data.ocrVendor || 'Deepseek-OCR',
    recognizeCover: data.recognizeCover ?? false,
    llmModel: data.llmModel || 'GPT-4o-mini',
    visionModel: data.visionModel,
    fieldRules: data.fieldRules || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockAttachmentClassifications.push(newClassification);
  return createMockResponse(newClassification);
}

// 更新附件分类基本信息
export async function updateClassificationApi(
  id: string,
  data: Partial<AttachmentClassification>,
) {
  await mockDelay();
  const index = mockAttachmentClassifications.findIndex((c) => c.id === id);
  if (index !== -1) {
    mockAttachmentClassifications[index] = {
      ...mockAttachmentClassifications[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return createMockResponse(mockAttachmentClassifications[index]);
  }
  throw new Error('分类不存在');
}

// 删除附件分类
export async function deleteClassificationApi(id: string) {
  await mockDelay();
  const index = mockAttachmentClassifications.findIndex((c) => c.id === id);
  if (index !== -1) {
    mockAttachmentClassifications.splice(index, 1);
  }
  return createMockResponse(undefined);
}

// 更新字段提取规则
export async function updateFieldRulesApi(
  classificationId: string,
  fieldRules: FieldRule[],
) {
  await mockDelay();
  const index = mockAttachmentClassifications.findIndex(
    (c) => c.id === classificationId,
  );
  if (index !== -1) {
    mockAttachmentClassifications[index].fieldRules = fieldRules;
    mockAttachmentClassifications[index].updatedAt = new Date().toISOString();
    return createMockResponse(fieldRules);
  }
  throw new Error('分类不存在');
}

// 导入分类配置
export async function importClassificationsApi(_file: File) {
  await mockDelay(1000);
  // TODO: 实际解析 JSON/Excel 文件
  return createMockResponse({
    successCount: 3,
    failedCount: 0,
  });
}

// 导出分类配置
export async function exportClassificationsApi() {
  await mockDelay();
  return createMockResponse(mockAttachmentClassifications);
}

/**
 * 分类策略相关 API
 */

// 获取分类策略配置
export async function getClassificationStrategyApi() {
  await mockDelay();
  return createMockResponse(mockClassificationStrategy);
}

// 更新分类策略配置
export async function updateClassificationStrategyApi(
  config: ClassificationStrategy,
) {
  await mockDelay();
  Object.assign(mockClassificationStrategy, config);
  mockClassificationStrategy.updatedAt = new Date().toISOString();
  return createMockResponse(mockClassificationStrategy);
}

/**
 * 测试相关 API
 */

// 快速测试单个分类
export async function quickTestClassificationApi(
  _classificationId: string,
  _file: File,
) {
  await mockDelay(1500);
  // 模拟返回单个文件的测试结果
  return createMockResponse(mockTestResults[0]);
}

// 沙箱批量测试
export async function batchTestClassificationsApi(_params: TestParams) {
  await mockDelay(2000);
  // 模拟返回多个文件的测试结果
  return createMockResponse(mockTestResults);
}
