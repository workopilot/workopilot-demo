import { eventHandler, readBody } from 'h3';
import { useResponseSuccess } from '~/utils/response';

// GET/PUT 字段提取规则
export default eventHandler(async (event) => {
  const id = event.context.params?.id;

  if (event.method === 'GET') {
    // 返回空规则列表
    return useResponseSuccess([]);
  }

  if (event.method === 'PUT') {
    const body = await readBody(event);
    console.log('Updating extraction rules for bill type:', id, body);
    return useResponseSuccess(body.rules || []);
  }

  throw createError({
    statusCode: 405,
    message: 'Method not allowed',
  });
});
