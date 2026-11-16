import type { SourceSystem } from '../../types';

import { eventHandler, readBody } from 'h3';
import { useResponseSuccess } from '~/utils/response';

// POST 新增系统
export default eventHandler(async (event) => {
  const body = await readBody(event);

  // 生成新ID
  const newId = `${Date.now()}`;

  const newSystem: SourceSystem = {
    id: newId,
    ...body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return useResponseSuccess(newSystem);
});
