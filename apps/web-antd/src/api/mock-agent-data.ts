import type { AgentItem, BillRecord } from '#/types/agent';

// Mock Data
export const mockAgents: AgentItem[] = [
  {
    id: '1',
    name: '智能审核',
    code: 'smart_audit',
    description:
      '自然语言编写审核规则，工具链对接内外部数据，浏览器插件非侵入式对接。',
    logo: `${import.meta.env.BASE_URL}demo/shenhe.png`,
    logoColor: '#3b82f6', // blue-500
    logoBgColor: '#eff6ff', // blue-50
    status: 'active',
    tags: ['Risk Control', 'Finance'],
    version: 'v1.2.0',
  },
  {
    id: '2',
    name: '智能填报',
    code: 'smart_filling',
    description:
      '基于制度规则生成单据数据，AI-RPA智能填写三方系统，无需系统对接。',
    logo: `${import.meta.env.BASE_URL}demo/tianbao.png`,
    logoColor: '#10b981', // emerald-500
    logoBgColor: '#ecfdf5', // emerald-50
    status: 'active',
    tags: ['Efficiency', 'Automation'],
    version: 'v2.1.0',
  },
  {
    id: '3',
    name: '智能附件分类',
    code: 'smart_classify',
    description: '自然语言定义分类规则，智能分类非标附件并提取关键数据。',
    logo: `${import.meta.env.BASE_URL}demo/fenlei.png`,
    logoColor: '#f59e0b', // amber-500
    logoBgColor: '#fffbeb', // amber-50
    status: 'active',
    tags: ['Document', 'AI'],
    version: 'v1.0.5',
  },
  {
    id: '4',
    name: '智能对比',
    code: 'smart_compare',
    description: '快速对比合同、单据或文本差异，高亮显示变更细节。',
    logo: 'lucide:git-compare',
    logoColor: '#8b5cf6', // violet-500
    logoBgColor: '#f5f3ff', // violet-50
    status: 'development',
    tags: ['Analysis', 'Tools'],
    version: 'v0.9.0-beta',
  },
  {
    id: '5',
    name: '智能报告',
    code: 'smart_compliance',
    description: '实时监测业务操作，自动识别合规风险并提供整改建议。',
    logo: 'lucide:scale',
    logoColor: '#ec4899', // pink-500
    logoBgColor: '#fdf2f8', // pink-50
    status: 'development',
    tags: ['Legal', 'Risk'],
    version: 'v0.5.0-alpha',
  },
  {
    id: '6',
    name: '智能采集',
    code: 'data-collection',
    description:
      '通过接口、公网RPA及第三方系统RPA自动采集数据并统一归集为标准JSON池。',
    logo: 'lucide:database',
    logoColor: '#0ea5e9', // sky-500
    logoBgColor: '#f0f9ff', // sky-50
    status: 'active',
    tags: ['Data', 'Integration', 'RPA'],
    version: 'v1.0.0',
  },
];

// 单据审核记录 Mock 数据
export const mockBillRecords: BillRecord[] = [
  {
    id: '1',
    billNo: 'BX20250101001',
    billType: '费用报销单',
    systemId: '1',
    systemName: 'SAP Fiori (总部)',
    createdDate: '2025-01-15 10:30:00',
    auditDate: '2025-01-15 14:20:00',
    confidence: 95,
    auditStatus: '已通过',
    auditReport:
      '该单据符合公司费用报销制度，发票真实有效，金额准确，审核通过。',
  },
  {
    id: '2',
    billNo: 'CG20250102005',
    billType: '采购申请单',
    systemId: '1',
    systemName: 'SAP Fiori (总部)',
    createdDate: '2025-01-16 09:15:00',
    auditDate: '2025-01-16 16:45:00',
    confidence: 72,
    auditStatus: '已拒绝',
    auditReport: '采购金额超过部门预算限额，建议修改采购数量或申请预算追加。',
  },
  {
    id: '3',
    billNo: 'FK20250103012',
    billType: '付款申请单',
    systemId: '2',
    systemName: 'SAP Fiori (分部)',
    createdDate: '2025-01-17 11:20:00',
    auditDate: '2025-01-17 15:30:00',
    confidence: 98,
    auditStatus: '已通过',
    auditReport: '付款信息核对无误，供应商资质齐全，符合付款条件。',
  },
  {
    id: '4',
    billNo: 'QJ20250104008',
    billType: '请假申请单',
    systemId: '3',
    systemName: '用友 NC',
    createdDate: '2025-01-18 08:45:00',
    auditDate: '2025-01-18 10:15:00',
    confidence: 92,
    auditStatus: '已通过',
    auditReport: '请假时间符合规定，剩余年假天数充足，批准申请。',
  },
  {
    id: '5',
    billNo: 'BX20250105020',
    billType: '费用报销单',
    systemId: '1',
    systemName: 'SAP Fiori (总部)',
    createdDate: '2025-01-19 14:30:00',
    auditDate: '2025-01-19 17:00:00',
    confidence: 85,
    auditStatus: '审核中',
    auditReport: '正在核对发票信息和报销明细...',
  },
  {
    id: '6',
    billNo: 'CL20250106015',
    billType: '差旅申请单',
    systemId: '2',
    systemName: 'SAP Fiori (分部)',
    createdDate: '2025-01-20 09:00:00',
    auditDate: '2025-01-20 14:30:00',
    confidence: 88,
    auditStatus: '已通过',
    auditReport: '差旅申请符合公司差旅标准，交通和住宿费用合理，审核通过。',
  },
  {
    id: '7',
    billNo: 'CG20250107025',
    billType: '采购申请单',
    systemId: '3',
    systemName: '用友 NC',
    createdDate: '2025-01-21 10:15:00',
    auditDate: '',
    confidence: undefined,
    auditStatus: '待审核',
    auditReport: '',
  },
  {
    id: '8',
    billNo: 'BX20250108018',
    billType: '费用报销单',
    systemId: '1',
    systemName: 'SAP Fiori (总部)',
    createdDate: '2025-01-22 13:45:00',
    auditDate: '2025-01-22 16:20:00',
    confidence: 65,
    auditStatus: '已拒绝',
    auditReport: '发票抬头信息与公司信息不符，请更换正确发票后重新提交。',
  },
  {
    id: '9',
    billNo: 'FK20250109009',
    billType: '付款申请单',
    systemId: '2',
    systemName: 'SAP Fiori (分部)',
    createdDate: '2025-01-23 11:30:00',
    auditDate: '2025-01-23 15:45:00',
    confidence: 96,
    auditStatus: '已通过',
    auditReport: '付款申请审核通过，款项将在3个工作日内支付。',
  },
  {
    id: '10',
    billNo: 'QJ20250110012',
    billType: '请假申请单',
    systemId: '3',
    systemName: '用友 NC',
    createdDate: '2025-01-24 08:00:00',
    auditDate: '',
    confidence: undefined,
    auditStatus: '待审核',
    auditReport: '',
  },
];

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
