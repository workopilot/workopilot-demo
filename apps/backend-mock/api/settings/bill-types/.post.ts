import type { BillType } from '../../types';

import { eventHandler, readBody } from 'h3';
import { useResponseSuccess } from '~/utils/response';

// POST 新增单据类型
export default eventHandler(async (event) => {
  const body = await readBody(event);

  const newBillType: BillType = {
    id: `${Date.now()}`,
    ...body,
    extractionRules: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return useResponseSuccess(newBillType);
});
