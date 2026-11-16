import type { AiWorkApplication } from '#/types/ai-work';

const publicAsset = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

// ============ 账扣核销单请款单数据收集 - 应用配置 ============
export const zhangkouApplications: AiWorkApplication[] = [
  {
    id: 'zhangkou-filling',
    name: '账扣核销单请款单数据收集',
    description: '账扣核销与请款单智能填报',
    icon: publicAsset('mate/apps/zhangkou.svg'),
    path: '/app/mate/apps/zhangkou-filling/template',
  },
];

// ============ 核销周期配置 ============
export const zhangkouCycleConfig = {
  enabled: true,
  billingCycle: '月度',
  billingDay: 25,
  deadline: '18:00',
  reminder: true,
  autoSubmit: false,
  timezone: 'Asia/Shanghai',
};

// ============ 请款模板配置 ============
export const zhangkouTemplateConfig = {
  templates: [
    {
      id: 'tpl-1',
      name: '标准账扣核销单',
      description: '适用于月度结算的账扣核销申请',
      fields: [
        { name: '供应商名称', type: 'text', required: true },
        { name: '合同编号', type: 'text', required: true },
        { name: '核销金额', type: 'number', required: true },
        {
          name: '核销周期',
          type: 'select',
          options: ['月度', '季度', '年度'],
          required: true,
        },
        { name: '备注说明', type: 'textarea', required: false },
      ],
      version: 'v1.2',
      updatedAt: '2026-08-15',
    },
    {
      id: 'tpl-2',
      name: '请款单（预付）',
      description: '适用于预付款项的请款申请',
      fields: [
        { name: '收款方名称', type: 'text', required: true },
        { name: '收款方账号', type: 'text', required: true },
        { name: '开户行', type: 'text', required: true },
        { name: '预付款金额', type: 'number', required: true },
        { name: '合同编号', type: 'text', required: true },
        { name: '付款事由', type: 'textarea', required: true },
      ],
      version: 'v1.0',
      updatedAt: '2026-08-10',
    },
    {
      id: 'tpl-3',
      name: '请款单（尾款）',
      description: '适用于项目尾款结算的请款申请',
      fields: [
        { name: '收款方名称', type: 'text', required: true },
        { name: '项目名称', type: 'text', required: true },
        { name: '尾款金额', type: 'number', required: true },
        { name: '已付金额', type: 'number', required: true },
        { name: '验收确认单号', type: 'text', required: true },
        { name: '付款备注', type: 'textarea', required: false },
      ],
      version: 'v1.1',
      updatedAt: '2026-08-12',
    },
  ],
};

// ============ 执行记录 ============
export const zhangkouExecutionRecords = [
  {
    id: 'exec-1',
    templateName: '标准账扣核销单',
    submitter: '张三',
    department: '财务部',
    amount: '128,500.00',
    status: '已提交',
    submittedAt: '2026-08-18 14:30',
    completedAt: '',
  },
  {
    id: 'exec-2',
    templateName: '请款单（预付）',
    submitter: '李四',
    department: '采购部',
    amount: '56,000.00',
    status: '审核中',
    submittedAt: '2026-08-17 09:15',
    completedAt: '',
  },
  {
    id: 'exec-3',
    templateName: '请款单（尾款）',
    submitter: '王五',
    department: '项目部',
    amount: '230,000.00',
    status: '已完成',
    submittedAt: '2026-08-15 11:00',
    completedAt: '2026-08-17 16:45',
  },
  {
    id: 'exec-4',
    templateName: '标准账扣核销单',
    submitter: '赵六',
    department: '财务部',
    amount: '89,200.00',
    status: '已退回',
    submittedAt: '2026-08-14 08:50',
    completedAt: '2026-08-16 10:30',
    returnReason: '发票信息不完整，请补充后重新提交',
  },
  {
    id: 'exec-5',
    templateName: '请款单（预付）',
    submitter: '孙七',
    department: '市场部',
    amount: '12,800.00',
    status: '草稿',
    submittedAt: '',
    completedAt: '',
  },
];

// ============ 发票附件上传记录（异步批量上传结果） ============
export interface ZipUploadItem {
  name: string;
  type: string;
  status: '处理中' | '失败' | '成功';
  error?: string;
  processedAt: string;
}

export interface ZipUploadRecord {
  id: string;
  zipName: string;
  period: string;
  totalFiles: number;
  invoices: ZipUploadItem[];
  attachments: ZipUploadItem[];
  overallStatus: '全部失败' | '处理中' | '已完成' | '部分失败';
  uploadedAt: string;
  completedAt: string;
}

export const zhangkouZipUploadRecords: ZipUploadRecord[] = [
  {
    id: 'zip-1',
    zipName: '2026年7月发票附件.zip',
    period: '2026-07',
    totalFiles: 8,
    overallStatus: '部分失败',
    uploadedAt: '2026-08-10 09:30',
    completedAt: '2026-08-10 09:35',
    invoices: [
      {
        name: '发票_001.pdf',
        type: 'PDF',
        status: '成功',
        processedAt: '2026-08-10 09:31',
      },
      {
        name: '发票_002.pdf',
        type: 'PDF',
        status: '成功',
        processedAt: '2026-08-10 09:32',
      },
      {
        name: '发票_003.ofd',
        type: 'OFD',
        status: '失败',
        error: '发票代码重复，系统中已存在相同发票',
        processedAt: '2026-08-10 09:33',
      },
    ],
    attachments: [
      {
        name: '合同_供应商A.pdf',
        type: 'PDF',
        status: '成功',
        processedAt: '2026-08-10 09:31',
      },
      {
        name: '银行回单_001.pdf',
        type: 'PDF',
        status: '成功',
        processedAt: '2026-08-10 09:32',
      },
      {
        name: '验收单_项目B.jpg',
        type: '图片',
        status: '成功',
        processedAt: '2026-08-10 09:33',
      },
      {
        name: '协议_补充条款.pdf',
        type: 'PDF',
        status: '失败',
        error: '上传失败',
        processedAt: '2026-08-10 09:34',
      },
      {
        name: '收据_002.jpg',
        type: '图片',
        status: '成功',
        processedAt: '2026-08-10 09:34',
      },
    ],
  },
  {
    id: 'zip-2',
    zipName: '2026年6月发票附件.zip',
    period: '2026-06',
    totalFiles: 5,
    overallStatus: '已完成',
    uploadedAt: '2026-07-05 14:00',
    completedAt: '2026-07-05 14:08',
    invoices: [
      {
        name: '6月发票_001.pdf',
        type: 'PDF',
        status: '成功',
        processedAt: '2026-07-05 14:02',
      },
      {
        name: '6月发票_002.pdf',
        type: 'PDF',
        status: '成功',
        processedAt: '2026-07-05 14:03',
      },
    ],
    attachments: [
      {
        name: '6月合同_001.pdf',
        type: 'PDF',
        status: '成功',
        processedAt: '2026-07-05 14:02',
      },
      {
        name: '6月回单_001.pdf',
        type: 'PDF',
        status: '成功',
        processedAt: '2026-07-05 14:03',
      },
      {
        name: '6月收据_001.jpg',
        type: '图片',
        status: '成功',
        processedAt: '2026-07-05 14:04',
      },
    ],
  },
  {
    id: 'zip-3',
    zipName: '2026年8月发票附件.zip',
    period: '2026-08',
    totalFiles: 6,
    overallStatus: '处理中',
    uploadedAt: '2026-08-19 10:15',
    completedAt: '',
    invoices: [
      {
        name: '8月发票_001.pdf',
        type: 'PDF',
        status: '成功',
        processedAt: '2026-08-19 10:16',
      },
      {
        name: '8月发票_002.pdf',
        type: 'PDF',
        status: '处理中',
        processedAt: '',
      },
      {
        name: '8月发票_003.ofd',
        type: 'OFD',
        status: '处理中',
        processedAt: '',
      },
    ],
    attachments: [
      {
        name: '8月合同_001.pdf',
        type: 'PDF',
        status: '成功',
        processedAt: '2026-08-19 10:16',
      },
      {
        name: '8月回单_001.pdf',
        type: 'PDF',
        status: '处理中',
        processedAt: '',
      },
      {
        name: '8月收据_001.jpg',
        type: '图片',
        status: '处理中',
        processedAt: '',
      },
    ],
  },
];

// ============ 数据上传 - 文件处理记录 ============
export interface FillingTask {
  taskId: string;
  status: '处理中' | '失败' | '成功';
  completedAt: string;
  result: string;
}

export interface DataFileRecord {
  id: string;
  fileName: string;
  period: string;
  fileStatus: '创建任务完成' | '处理中' | '失败';
  uploadedAt: string;
  completedAt: string;
  errorMessage: string;
  tasks: FillingTask[];
}

export const zhangkouDataFileRecords: DataFileRecord[] = [
  {
    id: 'df-1',
    fileName: '2026年7月数据.xlsx',
    period: '2026-07',
    fileStatus: '创建任务完成',
    uploadedAt: '2026-08-10 09:30',
    completedAt: '2026-08-10 09:32',
    errorMessage: '',
    tasks: [
      {
        taskId: 'ZK20260810001',
        status: '成功',
        completedAt: '2026-08-10 09:35',
        result: '填报成功, billCode: HK2026070001',
      },
      {
        taskId: 'ZK20260810002',
        status: '成功',
        completedAt: '2026-08-10 09:36',
        result: '填报成功, billCode: HK2026070002',
      },
      {
        taskId: 'ZK20260810003',
        status: '失败',
        completedAt: '2026-08-10 09:37',
        result: '未找到对应的前置单据',
      },
      {
        taskId: 'ZK20260810004',
        status: '成功',
        completedAt: '2026-08-10 09:38',
        result: '填报成功, billCode: QK2026070005',
      },
      {
        taskId: 'ZK20260810005',
        status: '失败',
        completedAt: '2026-08-10 09:39',
        result: '预算不足',
      },
    ],
  },
  {
    id: 'df-2',
    fileName: '2026年6月数据.xlsx',
    period: '2026-06',
    fileStatus: '创建任务完成',
    uploadedAt: '2026-07-05 14:00',
    completedAt: '2026-07-05 14:05',
    errorMessage: '',
    tasks: [
      {
        taskId: 'ZK20260705001',
        status: '成功',
        completedAt: '2026-07-05 14:08',
        result: '填报成功, billCode: HK2026060001',
      },
      {
        taskId: 'ZK20260705002',
        status: '成功',
        completedAt: '2026-07-05 14:09',
        result: '填报成功, billCode: HK2026060002',
      },
      {
        taskId: 'ZK20260705003',
        status: '成功',
        completedAt: '2026-07-05 14:10',
        result: '填报成功, billCode: QK2026060003',
      },
    ],
  },
  {
    id: 'df-3',
    fileName: '2026年8月数据.xlsx',
    period: '2026-08',
    fileStatus: '处理中',
    uploadedAt: '2026-08-19 10:15',
    completedAt: '',
    errorMessage: '',
    tasks: [],
  },
  {
    id: 'df-4',
    fileName: '2026年5月数据.xlsx',
    period: '2026-05',
    fileStatus: '失败',
    uploadedAt: '2026-06-10 10:50',
    completedAt: '2026-06-10 11:20',
    errorMessage: '文件格式不正确，无法解析数据内容',
    tasks: [],
  },
];

// ============ 模拟异步延迟 ============
export function mockDelay(ms: number = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============ 统一响应格式 ============
export function createMockResponse<T>(data: T) {
  return {
    code: 0,
    data,
    message: 'success',
  };
}
