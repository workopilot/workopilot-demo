import type { ConnectionTestResult } from '../../../types';

import { eventHandler } from 'h3';
import { useResponseSuccess } from '~/utils/response';

// POST 连接测试
export default eventHandler((event) => {
  const id = event.context.params?.id;
  console.log('Testing connection for system:', id);

  // 模拟连接测试(80%成功率)
  const success = Math.random() > 0.2;

  const result: ConnectionTestResult = {
    success,
    message: success ? '连接成功' : '连接超时,请检查网络和配置',
    latency: success ? Math.floor(Math.random() * 200) + 50 : undefined,
  };

  return useResponseSuccess(result);
});
