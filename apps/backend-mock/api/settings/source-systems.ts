import type { SourceSystem } from '../types';

import { eventHandler } from 'h3';
import { useResponseSuccess } from '~/utils/response';

// 模拟数据
const mockSystems: SourceSystem[] = [
  {
    id: '1',
    name: 'SAP Fiori',
    code: 'sap_fiori_hq',
    vendor: 'SAP',
    baseUrl: 'https://fiori.sap.com',
    authConfig: {
      type: 'OAuth',
      clientId: 'fiori_client_123',
      clientSecret: '***********',
      tokenUrl: 'https://auth.sap.com/oauth/token',
    },
    status: 'enabled',
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z',
  },
  {
    id: '2',
    name: '用友 U8',
    code: 'yonyou_u8',
    vendor: 'Yonyou',
    baseUrl: 'https://u8.yonyou.com/api',
    authConfig: {
      type: 'Basic',
      username: 'admin',
      password: '***********',
    },
    status: 'enabled',
    createdAt: '2024-01-16T09:30:00Z',
    updatedAt: '2024-01-16T09:30:00Z',
  },
  {
    id: '3',
    name: '金蝶 K3',
    code: 'kingdee_k3',
    vendor: 'Kingdee',
    baseUrl: 'https://k3.kingdee.com/api',
    authConfig: {
      type: 'Basic',
      username: 'k3admin',
      password: '***********',
    },
    status: 'disabled',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
  },
];

// GET 获取系统列表
export default eventHandler(() => {
  return useResponseSuccess(mockSystems);
});
