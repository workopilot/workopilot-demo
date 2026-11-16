import type { ExpenseCategory } from '../../types';

import { eventHandler, readBody } from 'h3';
import { useResponseSuccess } from '~/utils/response';

// POST 新增费用科目
export default eventHandler(async (event) => {
  const body = await readBody(event);

  const newCategory: ExpenseCategory = {
    id: `${Date.now()}`,
    ...body,
    aliases: body.aliases || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return useResponseSuccess(newCategory);
});
