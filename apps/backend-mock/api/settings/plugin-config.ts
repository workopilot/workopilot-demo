import type { PluginGlobalConfig } from '../types';

import { eventHandler, readBody } from 'h3';
import { useResponseSuccess } from '~/utils/response';

// 模拟插件配置数据
let mockConfig: PluginGlobalConfig = {
  privateDeployment: false,
  apiUrl: '',
  debugMode: false,
  floatPosition: 'bottom-right',
};

// GET 获取插件配置
export default eventHandler(async (event) => {
  if (event.method === 'GET') {
    return useResponseSuccess(mockConfig);
  }

  // PUT 更新插件配置
  if (event.method === 'PUT') {
    const body = await readBody(event);
    mockConfig = { ...mockConfig, ...body };
    return useResponseSuccess(mockConfig);
  }

  throw createError({
    statusCode: 405,
    message: 'Method not allowed',
  });
});
