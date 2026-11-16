import type { BillTypeTreeNode } from '../../types';

import { eventHandler } from 'h3';
import { useResponseSuccess } from '~/utils/response';

// 模拟单据类型树数据
const mockTree: BillTypeTreeNode[] = [
  {
    key: 'system-1',
    title: 'SAP Fiori',
    type: 'system',
    systemId: '1',
    children: [
      {
        key: 'billtype-1',
        title: '差旅费用单',
        type: 'billType',
        billTypeId: '1',
      },
      {
        key: 'billtype-2',
        title: '采购申请单',
        type: 'billType',
        billTypeId: '2',
      },
    ],
  },
  {
    key: 'system-2',
    title: '用友 U8',
    type: 'system',
    systemId: '2',
    children: [
      {
        key: 'billtype-3',
        title: '报销单',
        type: 'billType',
        billTypeId: '3',
      },
    ],
  },
];

// GET 获取单据类型树
export default eventHandler(() => {
  return useResponseSuccess(mockTree);
});
