import type { SourceSystem } from '../../types';

import { eventHandler, readBody } from 'h3';
import { useResponseSuccess } from '~/utils/response';

// PUT 更新系统
export default eventHandler(async (event) => {
  const id = event.context.params?.id;
  const body = await readBody(event);

  // 模拟更新操作
  const updatedSystem: SourceSystem = {
    id: id!,
    ...body,
    updatedAt: new Date().toISOString(),
  };

  return useResponseSuccess(updatedSystem);
});
