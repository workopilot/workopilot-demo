/**
 * 档案管理模块 Mock 数据
 */

/* eslint-disable unicorn/no-nested-ternary */

import type {
  FileCategory,
  FileCategoryConfig,
  FileGrant,
  FileInfo,
  FileListQuery,
  FileOperationLog,
  FileSource,
  GrantRequest,
  GrantTargetType,
  PermissionRuleConfig,
} from '#/types/file-management';

// ==================== 档案授权 Mock 数据 ====================
import { FilePermission } from '#/types/file-management';

// ==================== 工具函数 ====================

export function mockDelay(ms: number = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createMockResponse<T>(data: T) {
  return {
    code: 0,
    data,
    message: 'success',
  };
}

// ==================== 文件来源定义 ====================

export const mockFileSources: FileSource[] = [
  // 系统级来源
  {
    dimension: 'system',
    systemType: 'system_log',
    name: '系统日志',
    code: 'SYSTEM_LOG',
    description: '平台底层自动生成的系统运行日志',
  },
  {
    dimension: 'system',
    systemType: 'system_report',
    name: '系统报表',
    code: 'SYSTEM_REPORT',
    description: '平台自动生成的统计报表',
  },
  {
    dimension: 'system',
    systemType: 'system_audit',
    name: '审计日志',
    code: 'SYSTEM_AUDIT',
    description: '系统审计追踪记录',
  },
  // 应用级来源
  {
    dimension: 'application',
    applicationType: 'business_app',
    name: '财务系统',
    code: 'FINANCE_APP',
    description: '财务管理业务系统',
  },
  {
    dimension: 'application',
    applicationType: 'business_app',
    name: '人事系统',
    code: 'HR_APP',
    description: '人力资源管理业务系统',
  },
  {
    dimension: 'application',
    applicationType: 'digital_employee',
    name: '数字员工-财务助手',
    code: 'DIGITAL_EMPLOYEE_FINANCE',
    description: '智能财务处理数字员工',
  },
  {
    dimension: 'application',
    applicationType: 'digital_employee',
    name: '数字员工-审核助手',
    code: 'DIGITAL_EMPLOYEE_AUDIT',
    description: '智能审核处理数字员工',
  },
  {
    dimension: 'application',
    applicationType: 'user_upload',
    name: '用户上传',
    code: 'USER_UPLOAD',
    description: '用户手动上传的文件',
  },
];

// ==================== 文件分类定义 ====================

export const mockFileCategories: FileCategory[] = [
  // 系统预置分类
  {
    type: 'preset',
    presetType: 'meeting_minutes',
    name: '会议纪要',
    code: 'MEETING_MINUTES',
  },
  {
    type: 'preset',
    presetType: 'approval_doc',
    name: '审批单据',
    code: 'APPROVAL_DOC',
  },
  {
    type: 'preset',
    presetType: 'announcement',
    name: '公告通知',
    code: 'ANNOUNCEMENT',
  },
  {
    type: 'preset',
    presetType: 'report',
    name: '统计报表',
    code: 'REPORT',
  },
  {
    type: 'preset',
    presetType: 'contract',
    name: '合同文件',
    code: 'CONTRACT',
  },
  {
    type: 'preset',
    presetType: 'invoice',
    name: '发票单据',
    code: 'INVOICE',
  },
  // AI 匹配分类
  {
    type: 'ai_match',
    aiMatchType: 'configuration',
    name: '配置类',
    code: 'AI_CONFIGURATION',
    keywords: ['配置', '参数', '设置', 'config'],
    confidence: 0.95,
  },
  {
    type: 'ai_match',
    aiMatchType: 'voucher',
    name: '凭证类',
    code: 'AI_VOUCHER',
    keywords: ['凭证', '单据', '发票', 'invoice'],
    confidence: 0.92,
  },
  {
    type: 'ai_match',
    aiMatchType: 'contract_doc',
    name: '合同类',
    code: 'AI_CONTRACT',
    keywords: ['合同', '协议', 'contract'],
    confidence: 0.98,
  },
  {
    type: 'ai_match',
    aiMatchType: 'financial_report',
    name: '财务报表',
    code: 'AI_FINANCIAL_REPORT',
    keywords: ['报表', '财报', '财务'],
    confidence: 0.89,
  },
  // 兜底分类
  {
    type: 'other',
    name: '其他',
    code: 'OTHER',
  },
];

// ==================== 分类配置数据 ====================

export const mockCategoryConfigs: FileCategoryConfig[] = [
  {
    id: '1',
    name: '会议纪要',
    code: 'MEETING_MINUTES',
    type: 'preset',
    level: 1,
    sort: 1,
    enabled: true,
    description: '系统预置分类：各类会议记录和纪要',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: '审批单据',
    code: 'APPROVAL_DOC',
    type: 'preset',
    level: 1,
    sort: 2,
    enabled: true,
    description: '系统预置分类：各类审批流程单据',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: '配置类',
    code: 'AI_CONFIGURATION',
    type: 'ai_match',
    level: 2,
    sort: 3,
    keywords: ['配置', '参数', '设置', 'config', '配置文件'],
    enabled: true,
    description: 'AI智能分类：系统配置相关文件',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '4',
    name: '凭证类',
    code: 'AI_VOUCHER',
    type: 'ai_match',
    level: 2,
    sort: 4,
    keywords: ['凭证', '单据', '发票', 'invoice', '收据'],
    enabled: true,
    description: 'AI智能分类：财务凭证相关文件',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '5',
    name: '合同类',
    code: 'AI_CONTRACT',
    type: 'ai_match',
    level: 2,
    sort: 5,
    keywords: ['合同', '协议', 'contract', 'agreement'],
    enabled: true,
    description: 'AI智能分类：各类合同协议文件',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '6',
    name: '财务报表',
    code: 'AI_FINANCIAL_REPORT',
    type: 'ai_match',
    level: 2,
    sort: 6,
    keywords: ['报表', '财报', '财务', '资产负债表', '利润表'],
    enabled: true,
    description: 'AI智能分类：财务报表相关文件',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// ==================== 权限规则配置 ====================

export const mockPermissionRules: PermissionRuleConfig[] = [
  {
    id: '1',
    name: '合同文件仅本人上传',
    dataPermissionType: 'personal_only',
    applicableCategories: ['CONTRACT', 'AI_CONTRACT'],
    specialPermissions: ['contract_only_self'],
    priority: 100,
    enabled: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: '财务单据部门限制',
    dataPermissionType: 'department_and_below',
    applicableCategories: ['INVOICE', 'AI_VOUCHER', 'AI_FINANCIAL_REPORT'],
    specialPermissions: ['sensitive_dept_restricted'],
    departmentIds: ['finance_dept', 'audit_dept'],
    priority: 90,
    enabled: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: '部门管理员权限',
    dataPermissionType: 'department_and_below',
    roleIds: ['dept_admin', 'dept_manager'],
    priority: 80,
    enabled: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '4',
    name: '普通员工默认权限',
    dataPermissionType: 'personal_only',
    priority: 10,
    enabled: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// ==================== 档案列表 Mock 数据 ====================

// 生成档案号（预留给未来使用）

function _generateArchiveNo(
  category: string,
  date: string,
  index: number,
): string {
  const dateStr = date.replaceAll('-', '').slice(0, 8);
  const categoryCode = category.slice(0, 3).toUpperCase();
  return `DA${dateStr}${categoryCode}${String(index).padStart(3, '0')}`;
}

export const mockFileList: FileInfo[] = [
  {
    id: '1',
    archiveNo: 'DA20240315REP001',
    title: '2024年度财务审计报告',
    extension: '.pdf',
    size: 2_458_624,
    mimeType: 'application/pdf',
    storagePath: '/files/2024/01/audit_report_2024.pdf',
    accessUrl: '/api/files/1/download',
    source: {
      dimension: 'application',
      applicationType: 'business_app',
      name: '财务系统',
      code: 'FINANCE_APP',
      description: '财务管理业务系统',
    },
    category: {
      type: 'preset',
      presetType: 'report',
      name: '统计报表',
      code: 'REPORT',
    },
    sensitivityLevel: 'confidential',
    dataPermission: {
      type: 'department_and_below',
      departmentIds: ['finance_dept'],
      specialPermissions: ['sensitive_dept_restricted'],
    },
    uploaderId: 'u001',
    uploaderName: '张会计',
    uploaderDeptId: 'finance_dept',
    uploaderDeptName: '财务部',
    uploadedAt: '2024-03-15T10:30:00Z',
    status: 'normal',
    fileSummary:
      '本报告为公司2024年度财务状况的全面审计，由德勤会计师事务所出具。报告涵盖资产负债表、利润表、现金流量表等核心财务报表，审计意见为无保留意见。主要财务指标显示公司财务状况良好，盈利能力稳定。',
    fileTags: [
      { id: 't1', name: '年度审计', color: 'blue' },
      { id: 't2', name: '财务报表', color: 'green' },
      { id: 't3', name: '德勤', color: 'purple' },
    ],
    userDescription: '2024年度财务审计报告正式版，已通过董事会审批',
    relatedFiles: [
      {
        id: 'f1-1',
        type: 'document',
        name: '2024年度财务审计报告.pdf',
        url: '/api/files/1/download',
        size: 2_458_624,
        description: '完整审计报告文档',
        createdAt: '2024-03-15T10:30:00Z',
      },
    ],
    structuredData: {
      reportYear: '2024',
      reportType: '年度审计报告',
      auditor: '德勤会计师事务所',
      auditDate: '2024-03-10',
    },
    createdAt: '2024-03-15T10:30:00Z',
    updatedAt: '2024-03-15T10:30:00Z',
  },
  {
    id: '2',
    archiveNo: 'DA20240320CON001',
    title: '供应商采购合同_SAP公司',
    extension: '.docx',
    size: 128_512,
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    storagePath: '/files/2024/02/contract_sap.docx',
    accessUrl: '/api/files/2/download',
    source: {
      dimension: 'application',
      applicationType: 'user_upload',
      name: '用户上传',
      code: 'USER_UPLOAD',
      description: '用户手动上传的文件',
    },
    category: {
      type: 'ai_match',
      aiMatchType: 'contract_doc',
      name: '合同类',
      code: 'AI_CONTRACT',
      keywords: ['合同', '协议', 'contract'],
      confidence: 0.98,
    },
    sensitivityLevel: 'confidential',
    dataPermission: {
      type: 'personal_only',
      specialPermissions: ['contract_only_self'],
    },
    uploaderId: 'u002',
    uploaderName: '李采购',
    uploaderDeptId: 'purchase_dept',
    uploaderDeptName: '采购部',
    uploadedAt: '2024-03-20T14:20:00Z',
    status: 'normal',
    fileSummary:
      '与SAP中国公司签署的企业软件采购合同，合同金额58万元，合同期限为2024年3月18日至2025年3月18日。合同包含软件许可、技术服务、售后服务等内容，付款方式为分期付款。',
    fileTags: [
      { id: 't4', name: '采购合同', color: 'orange' },
      { id: 't5', name: 'SAP', color: 'blue' },
      { id: 't6', name: '58万', color: 'red' },
      { id: 't7', name: '2024年度', color: 'cyan' },
    ],
    userDescription: 'SAP ERP系统采购合同，已法务审核通过',
    relatedFiles: [
      {
        id: 'f2-1',
        type: 'document',
        name: '供应商采购合同_SAP公司.docx',
        url: '/api/files/2/download',
        size: 128_512,
        description: '采购合同正本',
        createdAt: '2024-03-20T14:20:00Z',
      },
    ],
    structuredData: {
      contractNo: 'HT-2024-0156',
      contractType: '采购合同',
      supplier: 'SAP中国公司',
      contractAmount: '580000',
      signDate: '2024-03-18',
      expireDate: '2025-03-18',
    },
    createdAt: '2024-03-20T14:20:00Z',
    updatedAt: '2024-03-20T14:20:00Z',
  },
  {
    id: '3',
    archiveNo: 'DA20240401CFG001',
    title: '系统配置参数_v2.0',
    extension: '.json',
    size: 8192,
    mimeType: 'application/json',
    storagePath: '/files/2024/03/config_v2.json',
    accessUrl: '/api/files/3/download',
    source: {
      dimension: 'application',
      applicationType: 'digital_employee',
      name: '数字员工-财务助手',
      code: 'DIGITAL_EMPLOYEE_FINANCE',
      description: '智能财务处理数字员工',
    },
    category: {
      type: 'ai_match',
      aiMatchType: 'configuration',
      name: '配置类',
      code: 'AI_CONFIGURATION',
      keywords: ['配置', '参数', '设置'],
      confidence: 0.95,
    },
    sensitivityLevel: 'internal',
    dataPermission: {
      type: 'department_and_below',
      departmentIds: ['it_dept', 'finance_dept'],
    },
    uploaderId: 'system_robot_001',
    uploaderName: '财务助手',
    uploaderDeptId: 'ai_center',
    uploaderDeptName: 'AI中心',
    uploadedAt: '2024-04-01T09:15:00Z',
    status: 'normal',
    fileSummary:
      '财务助手数字员工系统配置文件版本2.0，用于生产环境部署。包含156项配置参数，涵盖数据库连接、API接口、业务规则等核心配置项。',
    fileTags: [
      { id: 't8', name: '系统配置', color: 'purple' },
      { id: 't9', name: 'v2.0', color: 'green' },
      { id: 't10', name: '生产环境', color: 'red' },
    ],
    userDescription: '数字员工配置文件更新，用于生产部署',
    relatedFiles: [
      {
        id: 'f3-1',
        type: 'document',
        name: '系统配置参数_v2.0.json',
        url: '/api/files/3/download',
        size: 8192,
        description: '配置文件',
        createdAt: '2024-04-01T09:15:00Z',
      },
    ],
    structuredData: {
      configVersion: '2.0',
      environment: 'production',
      lastModified: '2024-04-01T09:15:00Z',
      itemCount: 156,
    },
    createdAt: '2024-04-01T09:15:00Z',
    updatedAt: '2024-04-01T09:15:00Z',
  },
  // 会议纪要示例 - 包含录音、转录文字、会议纪要
  {
    id: '5',
    archiveNo: 'DA20240510MTM001',
    title: '2024年5月产品规划会议',
    extension: '',
    size: 0,
    mimeType: '',
    storagePath: '',
    source: {
      dimension: 'application',
      applicationType: 'digital_employee',
      name: '数字员工-会议助手',
      code: 'DIGITAL_EMPLOYEE_MEETING',
      description: '智能会议记录数字员工',
    },
    category: {
      type: 'preset',
      presetType: 'meeting_minutes',
      name: '会议纪要',
      code: 'MEETING_MINUTES',
    },
    sensitivityLevel: 'internal',
    dataPermission: {
      type: 'department_and_below',
      departmentIds: ['product_dept', 'tech_dept'],
    },
    uploaderId: 'u003',
    uploaderName: '王产品',
    uploaderDeptId: 'product_dept',
    uploaderDeptName: '产品部',
    uploadedAt: '2024-05-10T14:00:00Z',
    status: 'normal',
    fileSummary:
      '本次产品规划会议讨论了Q2产品路线图，重点包括AI智能审核功能升级、移动端优化、用户体验改进等内容。会议明确了各模块的开发优先级和时间节点，确定了技术方案选型。',
    fileTags: [
      { id: 't11', name: '产品规划', color: 'blue' },
      { id: 't12', name: 'Q2会议', color: 'cyan' },
      { id: 't13', name: 'AI功能', color: 'purple' },
      { id: 't14', name: 'A302会议室', color: 'orange' },
    ],
    userDescription: '产品部门月度规划会议，重要决策记录',
    relatedFiles: [
      {
        id: 'f5-1',
        type: 'audio',
        name: '会议录音.mp3',
        url: '/api/files/audio/meeting_20240510.mp3',
        size: 15_680_000,
        description: '完整会议录音，时长1小时45分钟',
        createdAt: '2024-05-10T14:00:00Z',
      },
      {
        id: 'f5-2',
        type: 'text',
        name: '实时转录文字.txt',
        url: '/api/files/transcript/meeting_20240510.txt',
        size: 128_000,
        description: 'AI实时转录的会议文字记录',
        createdAt: '2024-05-10T14:05:00Z',
      },
      {
        id: 'f5-3',
        type: 'document',
        name: '会议纪要.docx',
        url: '/api/files/minutes/meeting_20240510.docx',
        size: 45_000,
        description: '整理后的会议纪要文档',
        createdAt: '2024-05-10T15:30:00Z',
      },
    ],
    structuredData: {
      meetingDate: '2024-05-10',
      meetingTime: '14:00-15:45',
      attendees: ['张三', '李四', '王五', '赵六'],
      meetingRoom: 'A302会议室',
      topics: ['产品规划', '技术方案讨论', '项目排期'],
    },
    createdAt: '2024-05-10T14:00:00Z',
    updatedAt: '2024-05-10T15:30:00Z',
  },
  {
    id: '6',
    archiveNo: 'DA20240512MTM002',
    title: 'Q2季度销售总结会议',
    extension: '',
    size: 0,
    mimeType: '',
    storagePath: '',
    source: {
      dimension: 'application',
      applicationType: 'digital_employee',
      name: '数字员工-会议助手',
      code: 'DIGITAL_EMPLOYEE_MEETING',
      description: '智能会议记录数字员工',
    },
    category: {
      type: 'preset',
      presetType: 'meeting_minutes',
      name: '会议纪要',
      code: 'MEETING_MINUTES',
    },
    sensitivityLevel: 'confidential',
    dataPermission: {
      type: 'department_and_below',
      departmentIds: ['sales_dept'],
    },
    uploaderId: 'u004',
    uploaderName: '赵销售',
    uploaderDeptId: 'sales_dept',
    uploaderDeptName: '销售部',
    uploadedAt: '2024-05-12T10:00:00Z',
    status: 'normal',
    fileSummary:
      'Q2季度销售总结会议回顾了第二季度销售业绩，整体达成率95%。分析了各地区销售数据，讨论了重点客户跟进策略，制定了Q3销售目标和激励政策。',
    fileTags: [
      { id: 't15', name: '销售总结', color: 'green' },
      { id: 't16', name: 'Q2季度', color: 'blue' },
      { id: 't17', name: '业绩分析', color: 'purple' },
      { id: 't18', name: '机密', color: 'red' },
    ],
    relatedFiles: [
      {
        id: 'f6-1',
        type: 'audio',
        name: '会议录音.mp3',
        url: '/api/files/audio/sales_meeting_20240512.mp3',
        size: 12_500_000,
        description: '完整会议录音，时长1小时20分钟',
        createdAt: '2024-05-12T10:00:00Z',
      },
      {
        id: 'f6-2',
        type: 'text',
        name: '实时转录文字.txt',
        url: '/api/files/transcript/sales_meeting_20240512.txt',
        size: 95_000,
        description: 'AI实时转录的会议文字记录',
        createdAt: '2024-05-12T10:05:00Z',
      },
      {
        id: 'f6-3',
        type: 'document',
        name: 'Q2销售总结报告.docx',
        url: '/api/files/minutes/sales_q2_20240512.docx',
        size: 38_000,
        description: 'Q2季度销售总结会议纪要',
        createdAt: '2024-05-12T11:30:00Z',
      },
    ],
    structuredData: {
      meetingDate: '2024-05-12',
      meetingTime: '10:00-11:20',
      attendees: ['赵销售', '钱经理', '孙总监', '周主管'],
      meetingRoom: 'B201会议室',
      topics: ['Q2销售数据回顾', '业绩分析', 'Q3目标设定'],
    },
    createdAt: '2024-05-12T10:00:00Z',
    updatedAt: '2024-05-12T11:30:00Z',
  },
  {
    id: '4',
    archiveNo: 'DA20240325INV001',
    title: '增值税专用发票_202403',
    extension: '.xlsx',
    size: 52_428,
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    storagePath: '/files/2024/03/invoice_202403.xlsx',
    accessUrl: '/api/files/4/download',
    source: {
      dimension: 'application',
      applicationType: 'business_app',
      name: '财务系统',
      code: 'FINANCE_APP',
    },
    category: {
      type: 'ai_match',
      aiMatchType: 'voucher',
      name: '凭证类',
      code: 'AI_VOUCHER',
      keywords: ['发票', '凭证'],
      confidence: 0.92,
    },
    sensitivityLevel: 'confidential',
    dataPermission: {
      type: 'department_and_below',
      departmentIds: ['finance_dept'],
      specialPermissions: ['sensitive_dept_restricted'],
    },
    uploaderId: 'u001',
    uploaderName: '张会计',
    uploaderDeptId: 'finance_dept',
    uploaderDeptName: '财务部',
    uploadedAt: '2024-04-05T16:45:00Z',
    status: 'normal',
    fileSummary:
      '北京科技有限公司开具的增值税专用发票，发票日期2024年3月28日，价税合计35,600元，税额4,528元。货物或服务名称为技术服务费。',
    fileTags: [
      { id: 't19', name: '增值税发票', color: 'red' },
      { id: 't20', name: '3.56万', color: 'orange' },
      { id: 't21', name: '技术服务', color: 'blue' },
    ],
    userDescription: '2024年3月技术服务费发票，已入账',
    structuredData: {
      invoiceType: '增值税专用发票',
      invoiceDate: '2024-03-28',
      totalAmount: '35600.00',
      taxAmount: '4528.00',
      seller: '北京科技有限公司',
      buyer: '本公司',
    },
    createdAt: '2024-04-05T16:45:00Z',
    updatedAt: '2024-04-05T16:45:00Z',
  },
  {
    id: '5',
    archiveNo: 'DA20240410MTM003',
    title: 'Q1季度经营分析会议',
    extension: '',
    size: 0,
    mimeType: '',
    storagePath: '',
    source: {
      dimension: 'system',
      systemType: 'system_report',
      name: '系统报表',
      code: 'SYSTEM_REPORT',
    },
    category: {
      type: 'preset',
      presetType: 'meeting_minutes',
      name: '会议纪要',
      code: 'MEETING_MINUTES',
    },
    sensitivityLevel: 'internal',
    dataPermission: {
      type: 'all_data',
    },
    uploaderId: 'system',
    uploaderName: '系统',
    uploaderDeptId: 'system',
    uploaderDeptName: '系统',
    uploadedAt: '2024-04-10T11:00:00Z',
    status: 'normal',
    fileSummary:
      '2024年Q1季度经营分析会议，参会人员12人，会议时长2小时。会议回顾了Q1经营业绩，分析了主要经营指标完成情况，讨论了存在的问题和改进措施，部署了Q2重点工作任务。',
    fileTags: [
      { id: 't22', name: '经营分析', color: 'blue' },
      { id: 't23', name: 'Q1季度', color: 'green' },
      { id: 't24', name: '管理会议', color: 'purple' },
    ],
    relatedFiles: [
      {
        id: 'f5-1',
        type: 'audio',
        name: 'Q1经营分析会议录音.mp3',
        url: '/api/files/audio/q1_meeting.mp3',
        size: 18_500_000,
        description: '完整会议录音，时长2小时5分钟',
        createdAt: '2024-04-08T09:00:00Z',
      },
      {
        id: 'f5-2',
        type: 'text',
        name: '实时转录文字.txt',
        url: '/api/files/transcript/q1_meeting.txt',
        size: 145_000,
        description: 'AI实时转录的会议文字记录',
        createdAt: '2024-04-08T09:05:00Z',
      },
      {
        id: 'f5-3',
        type: 'document',
        name: '会议纪要.pdf',
        url: '/api/files/5/download',
        size: 512_000,
        description: '整理后的Q1季度经营分析会议纪要',
        createdAt: '2024-04-10T11:00:00Z',
      },
    ],
    structuredData: {
      meetingTitle: '2024年Q1季度经营分析会议',
      meetingDate: '2024-04-08',
      meetingRoom: 'A301会议室',
      attendees: 12,
      meetingDuration: '2小时',
      keyTopics: ['Q1业绩回顾', 'Q2目标设定', '重点工作部署'],
    },
    createdAt: '2024-04-10T11:00:00Z',
    updatedAt: '2024-04-10T11:00:00Z',
  },
  {
    id: '6',
    archiveNo: 'DA20240412APP001',
    title: '员工入职审批单_王明',
    extension: '.pdf',
    size: 128_000,
    mimeType: 'application/pdf',
    storagePath: '/files/2024/04/onboarding_wangming.pdf',
    accessUrl: '/api/files/6/download',
    source: {
      dimension: 'application',
      applicationType: 'business_app',
      name: '人事系统',
      code: 'HR_APP',
    },
    category: {
      type: 'preset',
      presetType: 'approval_doc',
      name: '审批单据',
      code: 'APPROVAL_DOC',
    },
    sensitivityLevel: 'internal',
    dataPermission: {
      type: 'department_and_below',
      departmentIds: ['hr_dept'],
    },
    uploaderId: 'u003',
    uploaderName: 'HR专员',
    uploaderDeptId: 'hr_dept',
    uploaderDeptName: '人力资源部',
    uploadedAt: '2024-04-12T09:30:00Z',
    status: 'normal',
    fileSummary:
      '王明的员工入职审批单，应聘岗位为Java开发工程师，所属部门为研发部。申请日期为2024年4月10日，审批人为HR总监，当前审批状态为已通过。',
    fileTags: [
      { id: 't25', name: '入职审批', color: 'green' },
      { id: 't26', name: 'Java开发', color: 'blue' },
      { id: 't27', name: '研发部', color: 'purple' },
    ],
    userDescription: '新员工王明入职审批，已通过所有流程',
    relatedFiles: [
      {
        id: 'f6-1',
        type: 'document',
        name: '员工入职审批单_王明.pdf',
        url: '/api/files/6/download',
        size: 128_000,
        description: '入职审批单正本',
        createdAt: '2024-04-12T09:30:00Z',
      },
    ],
    structuredData: {
      approvalType: '入职审批',
      applicantName: '王明',
      position: 'Java开发工程师',
      department: '研发部',
      applyDate: '2024-04-10',
      approver: 'HR总监',
      approvalStatus: '已通过',
    },
    createdAt: '2024-04-12T09:30:00Z',
    updatedAt: '2024-04-12T09:30:00Z',
  },
  {
    id: '7',
    archiveNo: 'DA20240414ANN001',
    title: '平台服务维护公告',
    extension: '.pdf',
    size: 64_000,
    mimeType: 'application/pdf',
    storagePath: '/files/2024/04/maintenance_notice.pdf',
    accessUrl: '/api/files/7/download',
    source: {
      dimension: 'system',
      systemType: 'system_report',
      name: '系统报表',
      code: 'SYSTEM_REPORT',
    },
    category: {
      type: 'preset',
      presetType: 'announcement',
      name: '公告通知',
      code: 'ANNOUNCEMENT',
    },
    sensitivityLevel: 'public',
    dataPermission: {
      type: 'all_data',
    },
    uploaderId: 'system',
    uploaderName: '系统',
    uploaderDeptId: 'system',
    uploaderDeptName: '系统',
    uploadedAt: '2024-04-14T08:00:00Z',
    status: 'normal',
    fileSummary:
      '平台服务升级维护通知公告，维护时间为2024年4月15日22:00至4月16日02:00，共计4小时。维护期间平台服务将暂停，影响范围为全部用户。',
    fileTags: [
      { id: 't28', name: '维护公告', color: 'orange' },
      { id: 't29', name: '系统升级', color: 'blue' },
      { id: 't30', name: '全员通知', color: 'cyan' },
    ],
    userDescription: '平台维护公告，需提前通知所有用户',
    relatedFiles: [
      {
        id: 'f7-1',
        type: 'document',
        name: '平台服务维护公告.pdf',
        url: '/api/files/7/download',
        size: 64_000,
        description: '维护公告文档',
        createdAt: '2024-04-14T08:00:00Z',
      },
    ],
    structuredData: {
      announcementType: '维护公告',
      title: '平台服务升级维护通知',
      publishDate: '2024-04-14',
      maintStartTime: '2024-04-15 22:00',
      maintEndTime: '2024-04-16 02:00',
      impactScope: '全部用户',
    },
    createdAt: '2024-04-14T08:00:00Z',
    updatedAt: '2024-04-14T08:00:00Z',
  },
  {
    id: '8',
    archiveNo: 'DA20240418DOC001',
    title: '技术文档_API接口规范',
    extension: '.pdf',
    size: 1_024_000,
    mimeType: 'application/pdf',
    storagePath: '/files/2024/04/api_doc.pdf',
    accessUrl: '/api/files/8/download',
    source: {
      dimension: 'application',
      applicationType: 'user_upload',
      name: '用户上传',
      code: 'USER_UPLOAD',
    },
    category: {
      type: 'other',
      name: '其他',
      code: 'OTHER',
    },
    sensitivityLevel: 'internal',
    dataPermission: {
      type: 'department_and_below',
      departmentIds: ['it_dept', 'dev_dept'],
    },
    uploaderId: 'u004',
    uploaderName: '技术架构师',
    uploaderDeptId: 'dev_dept',
    uploaderDeptName: '研发部',
    uploadedAt: '2024-04-18T15:20:00Z',
    status: 'normal',
    fileSummary:
      'API接口规范技术文档，版本v2.5，共85页。文档详细描述了系统各模块的API接口定义、请求参数、响应格式、错误码等内容，供开发人员参考使用。',
    fileTags: [
      { id: 't31', name: '技术文档', color: 'blue' },
      { id: 't32', name: 'API规范', color: 'purple' },
      { id: 't33', name: 'v2.5', color: 'green' },
    ],
    userDescription: 'API接口规范文档v2.5，供开发团队使用',
    structuredData: {
      docType: '技术文档',
      docTitle: 'API接口规范文档',
      version: 'v2.5',
      author: '技术架构师',
      pageCount: 85,
    },
    createdAt: '2024-04-18T15:20:00Z',
    updatedAt: '2024-04-18T15:20:00Z',
  },
];

// ==================== 操作日志 Mock 数据 ====================

export const mockFileLogs: FileOperationLog[] = [
  {
    id: 'log1',
    fileId: '1',
    fileName: '2024年度财务审计报告.pdf',
    operation: 'upload',
    operatorId: 'u001',
    operatorName: '张会计',
    operatorDept: '财务部',
    operatedAt: '2024-03-15T10:30:00Z',
    detail: '上传文件',
    result: 'success',
    ipAddress: '192.168.1.100',
  },
  {
    id: 'log2',
    fileId: '1',
    fileName: '2024年度财务审计报告.pdf',
    operation: 'view',
    operatorId: 'u001',
    operatorName: '张会计',
    operatorDept: '财务部',
    operatedAt: '2024-03-15T11:00:00Z',
    detail: '查看文件详情',
    result: 'success',
    ipAddress: '192.168.1.100',
  },
  {
    id: 'log3',
    fileId: '2',
    fileName: '供应商采购合同_SAP公司.docx',
    operation: 'upload',
    operatorId: 'u002',
    operatorName: '李采购',
    operatorDept: '采购部',
    operatedAt: '2024-03-20T14:20:00Z',
    detail: '上传合同文件',
    result: 'success',
    ipAddress: '192.168.1.105',
  },
  {
    id: 'log4',
    fileId: '2',
    fileName: '供应商采购合同_SAP公司.docx',
    operation: 'view',
    operatorId: 'u002',
    operatorName: '李采购',
    operatorDept: '采购部',
    operatedAt: '2024-03-20T14:25:00Z',
    detail: '查看文件详情',
    result: 'success',
    ipAddress: '192.168.1.105',
  },
  {
    id: 'log5',
    fileId: '1',
    fileName: '2024年度财务审计报告.pdf',
    operation: 'download',
    operatorId: 'u001',
    operatorName: '张会计',
    operatorDept: '财务部',
    operatedAt: '2024-03-21T09:15:00Z',
    detail: '下载文件',
    result: 'success',
    ipAddress: '192.168.1.100',
  },
  {
    id: 'log6',
    fileId: '3',
    fileName: '系统配置参数_v2.0.json',
    operation: 'upload',
    operatorId: 'system_robot_001',
    operatorName: '财务助手',
    operatorDept: 'AI中心',
    operatedAt: '2024-04-01T09:15:00Z',
    detail: '数字员工自动生成配置文件',
    result: 'success',
    ipAddress: '10.0.0.50',
  },
  {
    id: 'log7',
    fileId: '4',
    fileName: '增值税专用发票_202403.xlsx',
    operation: 'upload',
    operatorId: 'u001',
    operatorName: '张会计',
    operatorDept: '财务部',
    operatedAt: '2024-04-05T16:45:00Z',
    detail: '上传发票文件',
    result: 'success',
    ipAddress: '192.168.1.100',
  },
  {
    id: 'log8',
    fileId: '5',
    fileName: 'Q1季度经营分析会议纪要.pdf',
    operation: 'upload',
    operatorId: 'system',
    operatorName: '系统',
    operatorDept: '系统',
    operatedAt: '2024-04-10T11:00:00Z',
    detail: '系统自动生成会议纪要',
    result: 'success',
  },
  {
    id: 'log9',
    fileId: '5',
    fileName: 'Q1季度经营分析会议纪要.pdf',
    operation: 'view',
    operatorId: 'u005',
    operatorName: '总经理',
    operatorDept: '管理层',
    operatedAt: '2024-04-10T14:30:00Z',
    detail: '查看会议纪要',
    result: 'success',
    ipAddress: '192.168.1.200',
  },
  {
    id: 'log10',
    fileId: '4',
    fileName: '增值税专用发票_202403.xlsx',
    operation: 'permission_change',
    operatorId: 'admin',
    operatorName: '系统管理员',
    operatorDept: 'IT部',
    operatedAt: '2024-04-08T10:00:00Z',
    detail: '修改数据权限：从仅本人改为本部门及以下',
    result: 'success',
    ipAddress: '192.168.1.1',
  },
];

// ==================== 模拟查询函数 ====================

/** 获取文件列表 */
export async function getFileListApi(params: FileListQuery) {
  await mockDelay();

  let filteredList = [...mockFileList];

  // 按关键词过滤
  if (params.keyword) {
    const keyword = params.keyword.toLowerCase();
    filteredList = filteredList.filter(
      (file) =>
        file.title.toLowerCase().includes(keyword) ||
        file.uploaderName.toLowerCase().includes(keyword),
    );
  }

  // 按来源维度过滤
  if (params.sourceDimension) {
    filteredList = filteredList.filter(
      (file) => file.source.dimension === params.sourceDimension,
    );
  }

  // 按分类类型过滤
  if (params.categoryType) {
    filteredList = filteredList.filter(
      (file) => file.category.type === params.categoryType,
    );
  }

  // 按敏感级别过滤
  if (params.sensitivityLevel) {
    filteredList = filteredList.filter(
      (file) => file.sensitivityLevel === params.sensitivityLevel,
    );
  }

  // 按上传人过滤
  if (params.uploaderId) {
    filteredList = filteredList.filter(
      (file) => file.uploaderId === params.uploaderId,
    );
  }

  // 按扩展名过滤
  if (params.extension) {
    filteredList = filteredList.filter(
      (file) => file.extension === params.extension,
    );
  }

  // 时间范围过滤
  if (params.uploadedAfter) {
    const after = new Date(params.uploadedAfter).getTime();
    filteredList = filteredList.filter(
      (file) => new Date(file.uploadedAt).getTime() >= after,
    );
  }
  if (params.uploadedBefore) {
    const before = new Date(params.uploadedBefore).getTime();
    filteredList = filteredList.filter(
      (file) => new Date(file.uploadedAt).getTime() <= before,
    );
  }

  // 分页
  const total = filteredList.length;
  const start = (params.page - 1) * params.pageSize;
  const end = start + params.pageSize;
  const items = filteredList.slice(start, end);

  return createMockResponse({
    items,
    total,
    page: params.page,
    pageSize: params.pageSize,
  });
}

/** 获取文件操作日志 */
export async function getFileLogsApi(params: {
  fileId?: string;
  operation?: string;
  page: number;
  pageSize: number;
}) {
  await mockDelay();

  let filteredList = [...mockFileLogs];

  // 按文件 ID 过滤
  if (params.fileId) {
    filteredList = filteredList.filter((log) => log.fileId === params.fileId);
  }

  // 按操作类型过滤
  if (params.operation) {
    filteredList = filteredList.filter(
      (log) => log.operation === params.operation,
    );
  }

  // 分页
  const total = filteredList.length;
  const start = (params.page - 1) * params.pageSize;
  const end = start + params.pageSize;
  const items = filteredList.slice(start, end);

  return createMockResponse({
    items,
    total,
    page: params.page,
    pageSize: params.pageSize,
  });
}

/** 获取文件来源列表 */
export async function getFileSourcesApi() {
  await mockDelay();
  return createMockResponse(mockFileSources);
}

/** 获取文件分类配置 */
export async function getCategoryConfigsApi() {
  await mockDelay();
  return createMockResponse(mockCategoryConfigs);
}

/** 获取权限规则配置 */
export async function getPermissionRulesApi() {
  await mockDelay();
  return createMockResponse(mockPermissionRules);
}

/** 获取文件详情 */
export async function getFileDetailApi(id: string) {
  await mockDelay();
  const file = mockFileList.find((f) => f.id === id);
  if (!file) {
    throw new Error('文件不存在');
  }
  return createMockResponse(file);
}

/** 文件上传 */
export async function uploadFileApi(params: {
  categoryId?: string;
  file: File;
  fileTags?: Array<{ color: string; id: string; name: string }>;
  sensitivityLevel?: string;
  source: any;
  userDescription?: string;
}) {
  await mockDelay(800);

  // 模拟 AI 生成文件摘要
  const fileName = params.file.name;
  let summary = `系统已自动识别文件"${fileName}"，文件大小${(params.file.size / 1024).toFixed(2)}KB。`;
  if (fileName.includes('合同') || fileName.includes('协议')) {
    summary += 'AI分析认为此文件为合同类文档，包含法律条款和签署信息。';
  } else if (fileName.includes('发票') || fileName.includes('凭证')) {
    summary += 'AI分析认为此文件为财务凭证类文档，包含金额和税务信息。';
  } else if (fileName.includes('报表') || fileName.includes('报告')) {
    summary += 'AI分析认为此文件为报告类文档，包含数据分析结果。';
  } else {
    summary += 'AI已完成初步分析，建议用户确认文件分类和标签。';
  }

  // 使用用户自定义标签，如果没有则使用 AI 生成的默认标签
  let tags: Array<{ color?: string; id: string; name: string }> = [];
  if (params.fileTags && params.fileTags.length > 0) {
    tags = params.fileTags;
  } else {
    const fileExt = fileName
      .slice(Math.max(0, fileName.lastIndexOf('.')))
      .toLowerCase();
    tags.push(
      {
        id: `t_${Date.now()}_1`,
        name: `${fileExt.replace('.', '').toUpperCase()}文件`,
        color: 'blue',
      },
      { id: `t_${Date.now()}_2`, name: '2024年度', color: 'green' },
    );
  }

  const matchedCategory =
    mockFileCategories.find((c) => c.type === 'ai_match') ||
    mockFileCategories[0];

  const newFile: FileInfo = {
    id: String(Date.now()),
    archiveNo: `DA${new Date().toISOString().slice(0, 10).replaceAll('-', '')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    title: params.file.name.replace(
      fileName.slice(Math.max(0, fileName.lastIndexOf('.'))),
      '',
    ),
    extension: fileName.slice(Math.max(0, fileName.lastIndexOf('.'))),
    size: params.file.size,
    mimeType: params.file.type || 'application/octet-stream',
    storagePath: `/files/${new Date().toISOString().split('T')[0].replaceAll('-', '/')}/${params.file.name}`,
    accessUrl: `/api/files/${Date.now()}/download`,
    source: params.source,
    category: matchedCategory,
    sensitivityLevel: (params.sensitivityLevel as any) || 'internal',
    dataPermission: {
      type: 'personal_only',
    },
    uploaderId: 'current_user',
    uploaderName: '当前用户',
    uploaderDeptId: 'current_dept',
    uploaderDeptName: '当前部门',
    uploadedAt: new Date().toISOString(),
    status: 'normal',
    fileSummary: summary,
    fileTags: tags,
    userDescription: params.userDescription,
    relatedFiles: [
      {
        id: `f_${Date.now()}_1`,
        type: 'document',
        name: params.file.name,
        url: `/api/files/${Date.now()}/download`,
        size: params.file.size,
        description: '上传的文件',
        createdAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockFileList.unshift(newFile);

  return createMockResponse({
    fileInfo: newFile,
    aiCategoryResult: {
      category: matchedCategory,
      confidence: 0.92,
    },
  });
}

/** 删除文件 */
export async function deleteFileApi(id: string) {
  await mockDelay();
  const index = mockFileList.findIndex((f) => f.id === id);
  if (index !== -1) {
    mockFileList.splice(index, 1);
  }
  return createMockResponse(undefined);
}

/** 批量删除文件 */
export async function batchDeleteFilesApi(ids: string[]) {
  await mockDelay();
  ids.forEach((id) => {
    const index = mockFileList.findIndex((f) => f.id === id);
    if (index !== -1) {
      mockFileList.splice(index, 1);
    }
  });
  return createMockResponse({ deletedCount: ids.length });
}

/** 模拟授权记录数据 */
export const mockFileGrants: FileGrant[] = [
  // 档案1 - 2024年度财务审计报告
  {
    id: 'grant1',
    fileId: '1',
    target: {
      id: 'u1',
      type: 'user' as GrantTargetType,
      name: '张三',
      department: '技术部',
    },
    permissions: [FilePermission.VIEW, FilePermission.DOWNLOAD],
    grantorId: 'admin',
    grantorName: '管理员',
    grantedAt: '2024-03-16T10:00:00Z',
    expiresAt: null,
    active: true,
    remark: '项目协作需要',
  },
  {
    id: 'grant2',
    fileId: '1',
    target: {
      id: 'g1',
      type: 'group' as GrantTargetType,
      name: '财务审批组',
    },
    permissions: [FilePermission.VIEW, FilePermission.MANAGE],
    grantorId: 'admin',
    grantorName: '管理员',
    grantedAt: '2024-03-17T14:30:00Z',
    expiresAt: null,
    active: true,
    remark: '财务部门管理权限',
  },
  {
    id: 'grant3',
    fileId: '1',
    target: {
      id: 'd1',
      type: 'department' as GrantTargetType,
      name: '技术部',
    },
    permissions: [FilePermission.VIEW],
    grantorId: 'u001',
    grantorName: '张会计',
    grantedAt: '2024-03-18T09:00:00Z',
    expiresAt: '2024-12-31T23:59:59Z',
    active: true,
    remark: '年底前有效',
  },
  // 档案2 - 供应商采购合同
  {
    id: 'grant4',
    fileId: '2',
    target: {
      id: 'u2',
      type: 'user' as GrantTargetType,
      name: '李四',
      department: '财务部',
    },
    permissions: [
      FilePermission.VIEW,
      FilePermission.DOWNLOAD,
      FilePermission.EDIT,
    ],
    grantorId: 'u002',
    grantorName: '李采购',
    grantedAt: '2024-03-20T15:00:00Z',
    expiresAt: null,
    active: true,
    remark: '合同审核需要',
  },
  {
    id: 'grant5',
    fileId: '2',
    target: {
      id: 'g2',
      type: 'group' as GrantTargetType,
      name: '技术审核组',
    },
    permissions: [FilePermission.VIEW, FilePermission.DOWNLOAD],
    grantorId: 'u002',
    grantorName: '李采购',
    grantedAt: '2024-03-21T10:30:00Z',
    expiresAt: null,
    active: true,
    remark: '',
  },
  // 档案3 - 系统配置参数
  {
    id: 'grant6',
    fileId: '3',
    target: {
      id: 'u3',
      type: 'user' as GrantTargetType,
      name: '王五',
      department: '人事部',
    },
    permissions: [FilePermission.VIEW],
    grantorId: 'admin',
    grantorName: '管理员',
    grantedAt: '2024-04-01T10:00:00Z',
    expiresAt: null,
    active: true,
    remark: '',
  },
  {
    id: 'grant7',
    fileId: '3',
    target: {
      id: 'g3',
      type: 'group' as GrantTargetType,
      name: '管理员组',
    },
    permissions: [
      FilePermission.VIEW,
      FilePermission.DOWNLOAD,
      FilePermission.EDIT,
      FilePermission.DELETE,
      FilePermission.MANAGE,
    ],
    grantorId: 'admin',
    grantorName: '管理员',
    grantedAt: '2024-04-01T11:00:00Z',
    expiresAt: null,
    active: true,
    remark: '完整管理权限',
  },
  // 档案5 - 会议纪要
  {
    id: 'grant8',
    fileId: '5',
    target: {
      id: 'u4',
      type: 'user' as GrantTargetType,
      name: '赵六',
      department: '技术部',
    },
    permissions: [
      FilePermission.VIEW,
      FilePermission.DOWNLOAD,
      FilePermission.SHARE,
    ],
    grantorId: 'u003',
    grantorName: '王产品',
    grantedAt: '2024-05-10T15:00:00Z',
    expiresAt: null,
    active: true,
    remark: '会议参与人员',
  },
  {
    id: 'grant9',
    fileId: '5',
    target: {
      id: 'd2',
      type: 'department' as GrantTargetType,
      name: '财务部',
    },
    permissions: [FilePermission.VIEW],
    grantorId: 'u003',
    grantorName: '王产品',
    grantedAt: '2024-05-10T15:30:00Z',
    expiresAt: '2024-06-30T23:59:59Z',
    active: true,
    remark: '临时查看权限',
  },
  // 档案6 - Q2季度销售总结会议
  {
    id: 'grant10',
    fileId: '6',
    target: {
      id: 'g4',
      type: 'group' as GrantTargetType,
      name: '合同审批组',
    },
    permissions: [FilePermission.VIEW, FilePermission.DOWNLOAD],
    grantorId: 'u004',
    grantorName: '赵销售',
    grantedAt: '2024-05-12T11:00:00Z',
    expiresAt: null,
    active: true,
    remark: '',
  },
  {
    id: 'grant11',
    fileId: '6',
    target: {
      id: 'u5',
      type: 'user' as GrantTargetType,
      name: '钱七',
      department: '市场部',
    },
    permissions: [FilePermission.VIEW, FilePermission.MANAGE],
    grantorId: 'u004',
    grantorName: '赵销售',
    grantedAt: '2024-05-12T11:30:00Z',
    expiresAt: null,
    active: true,
    remark: '会议纪要管理',
  },
  // 档案4 - 增值税专用发票
  {
    id: 'grant12',
    fileId: '4',
    target: {
      id: 'd3',
      type: 'department' as GrantTargetType,
      name: '人事部',
    },
    permissions: [FilePermission.VIEW],
    grantorId: 'u001',
    grantorName: '张会计',
    grantedAt: '2024-04-05T17:00:00Z',
    expiresAt: null,
    active: true,
    remark: '部门共享',
  },
  // 过期的授权（示例）
  {
    id: 'grant13',
    fileId: '1',
    target: {
      id: 'u6',
      type: 'user' as GrantTargetType,
      name: '孙八',
      department: '运营部',
    },
    permissions: [FilePermission.VIEW, FilePermission.DOWNLOAD],
    grantorId: 'admin',
    grantorName: '管理员',
    grantedAt: '2024-01-15T10:00:00Z',
    expiresAt: '2024-03-15T23:59:59Z',
    active: false,
    remark: '已过期',
  },
];

/** 授权档案 */
export async function grantFilesApi(data: GrantRequest) {
  await mockDelay();

  const grants: FileGrant[] = [];

  for (const fileId of data.fileIds) {
    for (const target of data.targets) {
      const grant: FileGrant = {
        id: `grant_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        fileId,
        target: {
          id: target.id,
          type: target.type,
          name:
            target.type === 'user'
              ? '用户'
              : target.type === 'group'
                ? '群组'
                : '部门',
        } as any,
        permissions: data.permissions,
        grantorId: 'current_user',
        grantorName: '当前用户',
        grantedAt: new Date().toISOString(),
        expiresAt: data.expiresAt || null,
        active: true,
        remark: data.remark,
      };
      mockFileGrants.push(grant);
      grants.push(grant);
    }
  }

  return createMockResponse(grants);
}

/** 获取档案授权列表 */
export async function getFileGrantsApi(params: {
  fileId?: string;
  page?: number;
  pageSize?: number;
}) {
  await mockDelay();

  let filtered = mockFileGrants;
  if (params.fileId) {
    filtered = filtered.filter((g) => g.fileId === params.fileId);
  }

  const page = params.page || 1;
  const pageSize = params.pageSize || 10;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return createMockResponse({
    items,
    total: filtered.length,
    page,
    pageSize,
  });
}

/** 取消授权 */
export async function cancelGrantApi(grantId: string) {
  await mockDelay();
  const index = mockFileGrants.findIndex((g) => g.id === grantId);
  if (index !== -1) {
    mockFileGrants.splice(index, 1);
  }
  return createMockResponse(null);
}
