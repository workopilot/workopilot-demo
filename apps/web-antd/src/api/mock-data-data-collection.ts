export type SourceType = 'API' | 'PUBLIC_RPA' | 'THIRD_PARTY_RPA';
export type DataType = 'DOCUMENT' | 'MASTER_DATA';
export type TaskStatus = 'error' | 'running' | 'stopped';

export interface CollectionTask {
  id: string;
  name: string;
  sourceType: SourceType;
  dataType: DataType;
  status: TaskStatus;
  lastRunTime?: string;
  recordCount: number;
  config: {
    endpoint?: string;
    frequency?: string;
    rpaScriptId?: string;
  };
}

export interface DataPoolRecord {
  id: string;
  taskId: string;
  taskName: string;
  sourceType: SourceType;
  dataType: DataType;
  basicInfo: {
    billDate?: string;
    billNo?: string;
    code?: string;
    name?: string;
    remark?: string;
  };
  extendedData: any; // JSON object
  collectedAt: string;
}

export const mockCollectionTasks: CollectionTask[] = [
  {
    id: 'T001',
    name: '企查查主数据采集',
    sourceType: 'PUBLIC_RPA',
    dataType: 'MASTER_DATA',
    status: 'running',
    lastRunTime: '2026-07-07 10:30:00',
    recordCount: 1250,
    config: {
      rpaScriptId: 'script_qcc_01',
      frequency: '每天 02:00',
    },
  },
  {
    id: 'T002',
    name: '用友U8财务单据对接',
    sourceType: 'THIRD_PARTY_RPA',
    dataType: 'DOCUMENT',
    status: 'running',
    lastRunTime: '2026-07-07 11:45:00',
    recordCount: 8420,
    config: {
      rpaScriptId: 'script_u8_finance',
      frequency: '每小时',
    },
  },
  {
    id: 'T003',
    name: '内部系统订单接口',
    sourceType: 'API',
    dataType: 'DOCUMENT',
    status: 'stopped',
    lastRunTime: '2026-07-06 18:00:00',
    recordCount: 560,
    config: {
      endpoint: 'https://api.internal.com/v1/orders',
      frequency: '实时(Webhook)',
    },
  },
];

export const mockDataPoolRecords: DataPoolRecord[] = [
  {
    id: 'D001',
    taskId: 'T002',
    taskName: '用友U8财务单据对接',
    sourceType: 'THIRD_PARTY_RPA',
    dataType: 'DOCUMENT',
    basicInfo: {
      billNo: 'BX20260707001',
      billDate: '2026-07-07',
    },
    extendedData: {
      department: '研发部',
      amount: 1500.5,
      currency: 'CNY',
      items: [
        { name: '差旅费', value: 1000 },
        { name: '餐补', value: 500.5 },
      ],
      approvalStatus: 'PENDING',
    },
    collectedAt: '2026-07-07 11:45:12',
  },
  {
    id: 'D002',
    taskId: 'T001',
    taskName: '企查查主数据采集',
    sourceType: 'PUBLIC_RPA',
    dataType: 'MASTER_DATA',
    basicInfo: {
      code: 'USCC91440300MA5XXXXXX',
      name: '深圳市某科技有限公司',
      remark: '已认证高新技术企业',
    },
    extendedData: {
      legalPerson: '张三',
      registeredCapital: '1000万人民币',
      establishDate: '2015-05-20',
      industry: '软件和信息技术服务业',
      address: '深圳市南山区科技园',
    },
    collectedAt: '2026-07-07 10:30:45',
  },
  {
    id: 'D003',
    taskId: 'T003',
    taskName: '内部系统订单接口',
    sourceType: 'API',
    dataType: 'DOCUMENT',
    basicInfo: {
      billNo: 'ORD-2026-889021',
      billDate: '2026-07-06',
    },
    extendedData: {
      customerId: 'CUST-9901',
      customerName: '北京大客户A',
      totalAmount: 450_000,
      paymentMethod: 'BANK_TRANSFER',
      shippingAddress: '北京市朝阳区CBD',
    },
    collectedAt: '2026-07-06 18:00:05',
  },
];
