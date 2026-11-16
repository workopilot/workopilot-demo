export interface AgentItem {
  id: string;
  name: string;
  code: string;
  description: string;
  logo: string;
  logoColor?: string;
  logoBgColor?: string;
  status: 'active' | 'development' | 'disabled';
  tags: string[];
  version: string;
}

export interface AgentApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

// 单据审核记录
export interface BillRecord {
  id: string;
  billNo: string; // 单据编号
  billType: string; // 单据类型
  systemId: string; // 业务系统ID
  systemName: string; // 业务系统名称
  createdDate: string; // 单据创建时间
  auditDate: string; // 审核时间
  confidence?: number; // 置信度（0-100）
  auditStatus: '审核中' | '已拒绝' | '已通过' | '待审核'; // 审核状态
  auditReport?: string; // 审核报告
}
