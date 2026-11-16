import type { BillType } from '../../types';

import { eventHandler } from 'h3';
import { useResponseSuccess } from '~/utils/response';

// 模拟单据类型详情数据
const mockBillTypes: Record<string, BillType> = {
  '1': {
    id: '1',
    code: 'travel_expense',
    name: '差旅费用单',
    systemId: '1',
    systemName: 'SAP Fiori',
    description: '用于报销差旅费用的单据类型',
    enabled: true,
    urlRegex: String.raw`^https://fiori\.sap\.com/bills/travel/.*`,
    extractionRules: [
      {
        id: 'rule-1',
        fieldKey: 'bill_no',
        fieldDesc: '单据号',
        required: true,
        strategies: [
          { type: 'ID', selector: 'billNo' },
          { type: 'XPATH', selector: "//input[@id='billNo']/@value" },
        ],
      },
      {
        id: 'rule-2',
        fieldKey: 'applicant',
        fieldDesc: '申请人',
        required: true,
        strategies: [{ type: 'ID', selector: 'applicantName' }],
      },
      {
        id: 'rule-3',
        fieldKey: 'amount',
        fieldDesc: '总金额',
        required: true,
        strategies: [
          { type: 'ID', selector: 'totalAmount' },
          { type: 'CSS', selector: '#totalAmount' },
        ],
      },
    ],
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z',
  },
  '2': {
    id: '2',
    code: 'purchase_request',
    name: '采购申请单',
    systemId: '1',
    systemName: 'SAP Fiori',
    description: '用于申请采购物资的单据类型',
    enabled: true,
    urlRegex: String.raw`^https://fiori\.sap\.com/purchase/request/.*`,
    extractionRules: [
      {
        id: 'rule-4',
        fieldKey: 'request_no',
        fieldDesc: '申请单号',
        required: true,
        strategies: [{ type: 'ID', selector: 'requestNo' }],
      },
      {
        id: 'rule-5',
        fieldKey: 'supplier',
        fieldDesc: '供应商',
        required: false,
        strategies: [{ type: 'CSS', selector: '.supplier-name' }],
      },
    ],
    createdAt: '2024-01-16T09:00:00Z',
    updatedAt: '2024-01-16T09:00:00Z',
  },
  '3': {
    id: '3',
    code: 'reimbursement',
    name: '报销单',
    systemId: '2',
    systemName: '用友 U8',
    description: '通用报销单据类型',
    enabled: true,
    urlRegex: String.raw`^https://u8\.yonyou\.com/reimburse/.*`,
    extractionRules: [
      {
        id: 'rule-6',
        fieldKey: 'bill_no',
        fieldDesc: '单据号',
        required: true,
        strategies: [
          { type: 'ID', selector: 'billNumber' },
          { type: 'REGEX', selector: String.raw`单据号[:：]\s*([A-Z0-9]+)` },
        ],
      },
    ],
    createdAt: '2024-01-17T10:00:00Z',
    updatedAt: '2024-01-17T10:00:00Z',
  },
};

// GET 获取单据类型详情
export default eventHandler((event) => {
  const id = event.context.params?.id;
  const billType = mockBillTypes[id || ''];

  if (!billType) {
    throw createError({
      statusCode: 404,
      message: '单据类型不存在',
    });
  }

  return useResponseSuccess(billType);
});
