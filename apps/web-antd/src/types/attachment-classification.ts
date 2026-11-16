/**
 * 附件分类相关类型定义
 */

// 取数模式（单页/文档）
export type DocumentMode = 'document' | 'page';

// 取数策略
export type ExtractionMode = 'OCR' | 'VISION';

// OCR 供应商
export type OCRVendor =
  | 'Azure-Form-Recognizer'
  | 'Deepseek-OCR'
  | 'PaddleOCR'
  | 'Tesseract';

// LLM 模型
export type LLMModel =
  | 'Deepseek-Chat'
  | 'GPT-4o'
  | 'GPT-4o-mini'
  | 'Qwen-Turbo';

// Vision 模型
export type VisionModel = 'Gemini-Vision-Pro' | 'GPT-4o-Vision' | 'Qwen-VL-Max';

// 字段类型
export type FieldType = 'Date' | 'JSON' | 'Number' | 'String';

// 提取方案
export type ExtractionMethod = 'AI' | 'REGEX';

// 分类状态
export type ClassificationStatus = 'disabled' | 'enabled';

// 分类模式
export type GroupMode = 'document' | 'page' | 'specified';

/**
 * 附件组
 */
export interface AttachmentGroup {
  id: string;
  code: string;
  name: string;
  description?: string;
  groupMode: GroupMode; // 分类模式：单页、文档、指定编码
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 字段提取规则
 */
export interface FieldRule {
  name: string; // 字段名称 (如: 发票金额)
  code: string; // 字段编码 (如: amount)
  type: string; // 字段类型 (string, number, date, money)
  prompt?: string; // LLM 提示词
  regex?: string; // 正则表达式 (用于校验)
  required: boolean; // 是否必填
}

/**
 * 附件分类
 */
export interface AttachmentClassification {
  id: string;
  groupIds?: string[]; // 所属附件组ID列表
  name: string; // 分类名称 (如: 增值税专用发票)
  code: string; // 分类编码 (如: invoice_vat)
  description?: string; // 描述
  enabled: boolean; // 是否启用
  documentMode: DocumentMode; // 取数模式（单页/文档）
  extractionMode: ExtractionMode; // 取数策略
  ocrVendor: OCRVendor; // OCR厂商
  recognizeCover: boolean; // 是否识别封面
  llmModel: LLMModel; // 推理模型
  visionModel?: VisionModel; // 视觉模型(仅Vision模式)
  fieldRules: FieldRule[]; // 字段提取规则
  createdAt: string;
  updatedAt: string;
}

/**
 * 分类策略全局配置
 */
export interface ClassificationStrategy {
  strategyMode: ExtractionMode; // 技术路线: OCR+LLM 或 Vision
  defaultOCR: OCRVendor; // 默认OCR引擎
  defaultTextLLM: LLMModel; // 默认文本模型
  defaultVisionModel: VisionModel; // 默认视觉模型
  updatedAt: string;
}

/**
 * 测试相关类型
 */

// 文件状态
export type FileProcessStatus =
  | 'completed'
  | 'failed'
  | 'pending'
  | 'processing';

// 页面属性 (合同场景特有)
export type PageAttribute = 'attachment' | 'content' | 'cover';

// 页级分类结果
export interface PageClassificationResult {
  pageNumber: number;
  classificationName: string; // 分类名称
  classificationCode: string; // 分类编码
  confidence: number; // 置信度 (0-1)
  pageAttribute?: PageAttribute; // 页面属性
  ocrSummary: string; // OCR摘要(前50字符)
  extractedData?: Record<string, any>; // 提取结果 (仅当开启提取时)
}

// 文件测试结果
export interface FileTestResult {
  fileId: string;
  fileName: string;
  totalPages: number;
  elapsedTime: number; // 耗时(毫秒)
  status: FileProcessStatus;
  pages: PageClassificationResult[];
}

// 测试参数
export interface TestParams {
  files: File[];
  selectedClassifications: string[]; // 参测分类ID列表
  enableExtraction: boolean; // 是否执行字段提取
}

/**
 * API 响应类型
 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
