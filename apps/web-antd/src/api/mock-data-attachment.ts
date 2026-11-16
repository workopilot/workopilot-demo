/**
 * 附件分类 Mock 数据
 * 直接在前端定义所有Mock数据,无需后端Mock服务器
 */

import type {
  AttachmentClassification,
  AttachmentGroup,
  ClassificationStrategy,
  FileTestResult,
} from '#/types/attachment-classification';

/**
 * 模拟网络延迟
 */
export function mockDelay(ms: number = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 创建 Mock 响应
 */
export function createMockResponse<T>(data: T, code = 0, message = 'success') {
  return {
    code,
    data,
    message,
  };
}

/**
 * 附件组 Mock 数据
 */
export const mockAttachmentGroups: AttachmentGroup[] = [
  {
    id: '1',
    code: 'RECEIPT_MACHINE',
    name: '收单机附件组',
    description:
      '用于收单机扫描上传的附件，按单页模式对每页进行独立分类和字段提取',
    groupMode: 'page',
    enabled: true,
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2025-01-10T08:00:00Z',
  },
  {
    id: '2',
    code: 'AUDIT_GROUP',
    name: '审核附件组',
    description:
      '用于人工审核环节补充的附件，按文档模式对整个文件进行整体分类和字段提取',
    groupMode: 'document',
    enabled: true,
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2025-01-10T08:00:00Z',
  },
  {
    id: '3',
    code: 'CONTRACT_GROUP',
    name: '合同附件组',
    description:
      '用于合同类附件处理，指定编码模式直接按预分类进行字段提取，无需再次分类',
    groupMode: 'specified',
    enabled: true,
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2025-01-10T08:00:00Z',
  },
];

/**
 * 附件分类 Mock 数据
 */
export const mockAttachmentClassifications: AttachmentClassification[] = [
  {
    id: '1',
    groupIds: ['1'],
    name: '增值税专用发票',
    code: 'invoice_vat',
    description: '国家税务总局统一格式的增值税专用发票',
    enabled: true,
    documentMode: 'page',
    extractionMode: 'OCR',
    ocrVendor: 'Deepseek-OCR',
    recognizeCover: false,
    llmModel: 'GPT-4o-mini',
    fieldRules: [
      {
        code: 'invoice_code',
        name: '发票代码',
        type: 'String',
        prompt: '请提取左上角的10位或12位发票代码',
        required: true,
      },
      {
        code: 'invoice_number',
        name: '发票号码',
        type: 'String',
        regex: String.raw`\d{8}`,
        required: true,
      },
      {
        code: 'total_amount',
        name: '价税合计',
        type: 'Number',
        prompt: '提取价税合计金额,仅返回数字',
        required: true,
      },
      {
        code: 'billing_date',
        name: '开票日期',
        type: 'Date',
        prompt: '提取开票日期,格式:YYYY-MM-DD',
        required: true,
      },
    ],
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2025-01-10T08:00:00Z',
  },
  {
    id: '2',
    groupIds: ['1'],
    name: '差旅-滴滴行程单',
    code: 'travel_didi',
    description: '滴滴出行电子行程单',
    enabled: true,
    documentMode: 'page',
    extractionMode: 'OCR',
    ocrVendor: 'Deepseek-OCR',
    recognizeCover: false,
    llmModel: 'Deepseek-Chat',
    fieldRules: [
      {
        code: 'order_number',
        name: '订单号',
        type: 'String',
        regex: String.raw`\d{15,20}`,
        required: true,
      },
      {
        code: 'trip_date',
        name: '行程日期',
        type: 'Date',
        prompt: '提取行程日期',
        required: true,
      },
      {
        code: 'fare',
        name: '车费',
        type: 'Number',
        prompt: '提取总车费金额',
        required: true,
      },
    ],
    createdAt: '2025-01-11T09:30:00Z',
    updatedAt: '2025-01-11T09:30:00Z',
  },
  {
    id: '3',
    name: '购销合同',
    code: 'contract_purchase',
    description: '标准购销合同文件',
    enabled: false,
    documentMode: 'document',
    extractionMode: 'VISION',
    ocrVendor: 'Azure-Form-Recognizer',
    recognizeCover: true,
    llmModel: 'GPT-4o',
    visionModel: 'Qwen-VL-Max',
    fieldRules: [
      {
        code: 'contract_number',
        name: '合同编号',
        type: 'String',
        prompt: '提取合同编号',
        required: true,
      },
      {
        code: 'contract_amount',
        name: '合同金额',
        type: 'Number',
        prompt: '提取合同总金额',
        required: true,
      },
      {
        code: 'signing_date',
        name: '签订日期',
        type: 'Date',
        prompt: '提取合同签订日期',
        required: false,
      },
      {
        code: 'parties',
        name: '签约方',
        type: 'JSON',
        prompt: '提取甲方和乙方信息,返回JSON格式',
        required: true,
      },
    ],
    createdAt: '2025-01-12T10:00:00Z',
    updatedAt: '2025-01-12T10:00:00Z',
  },
];

/**
 * 全局策略配置 Mock 数据
 */
export const mockClassificationStrategy: ClassificationStrategy = {
  strategyMode: 'OCR',
  defaultOCR: 'Deepseek-OCR',
  defaultTextLLM: 'GPT-4o-mini',
  defaultVisionModel: 'Qwen-VL-Max',
  updatedAt: '2025-01-10T08:00:00Z',
};

/**
 * 测试结果 Mock 数据
 */
export const mockTestResults: FileTestResult[] = [
  {
    fileId: 'f1',
    fileName: '增值税发票_202501.pdf',
    totalPages: 1,
    elapsedTime: 1230,
    status: 'completed',
    pages: [
      {
        pageNumber: 1,
        classificationName: '增值税专用发票',
        classificationCode: 'invoice_vat',
        confidence: 0.98,
        ocrSummary:
          '发票代码: 1100234567 发票号码: 12345678 价税合计: ¥1200.00...',
        extractedData: {
          invoice_code: '1100234567',
          invoice_number: '12345678',
          total_amount: 1200,
          billing_date: '2025-01-15',
        },
      },
    ],
  },
  {
    fileId: 'f2',
    fileName: '滴滴行程单_20250110.jpeg',
    totalPages: 1,
    elapsedTime: 850,
    status: 'completed',
    pages: [
      {
        pageNumber: 1,
        classificationName: '差旅-滴滴行程单',
        classificationCode: 'travel_didi',
        confidence: 0.95,
        ocrSummary: '滴滴出行 2025-01-10 10:30 快车...',
        extractedData: {
          order_number: '1234567890123456',
          trip_date: '2025-01-10',
          fare: 35.5,
        },
      },
    ],
  },
  {
    fileId: 'f3',
    fileName: '采购合同_v1.pdf',
    totalPages: 5,
    elapsedTime: 4500,
    status: 'completed',
    pages: [
      {
        pageNumber: 1,
        classificationName: '购销合同',
        classificationCode: 'contract_purchase',
        confidence: 0.99,
        pageAttribute: 'cover',
        ocrSummary: '采购合同 合同编号: CT-2025001...',
      },
      {
        pageNumber: 2,
        classificationName: '购销合同',
        classificationCode: 'contract_purchase',
        confidence: 0.96,
        pageAttribute: 'content',
        ocrSummary: '第一条 产品名称...',
        extractedData: {
          contract_number: 'CT-2025001',
          contract_amount: 500_000,
          signing_date: '2025-01-10',
          parties: {
            partyA: 'XX科技有限公司',
            partyB: 'YY贸易有限公司',
          },
        },
      },
    ],
  },
];

// 合同助理演示引用的分类；沿用附件分类模块的数据结构与提取字段。
const contractClassification = mockAttachmentClassifications.find(
  (item) => item.code === 'contract_purchase',
);
if (contractClassification) {
  for (const scenario of [
    {
      id: 'contract-maintenance',
      name: '运维服务合同',
      code: 'contract_maintenance',
      fields: [
        { code: 'service_scope', name: '服务范围' },
        { code: 'service_period', name: '服务期限' },
        { code: 'inspection_frequency', name: '巡检次数或频率' },
        { code: 'service_location', name: '服务地点' },
      ],
    },
    {
      id: 'contract-sales',
      name: '销售合同',
      code: 'contract_sales',
      fields: [
        { code: 'payment_terms', name: '收款约定' },
        { code: 'invoice_terms', name: '开票约定' },
      ],
    },
  ]) {
    mockAttachmentClassifications.push({
      ...structuredClone(contractClassification),
      id: scenario.id,
      name: scenario.name,
      code: scenario.code,
      enabled: true,
      groupIds: ['3'],
      description: `${scenario.name}分类与信息提取（演示配置）`,
      fieldRules: [
        ...contractClassification.fieldRules,
        ...scenario.fields.map((field) => ({
          ...field,
          type: 'String' as const,
          prompt: `按合同原文提取${field.name}，未约定时留空`,
          required: false,
        })),
      ],
    });
  }
}
