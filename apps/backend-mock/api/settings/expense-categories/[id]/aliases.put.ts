import type { ExpenseCategory } from '../../../types';

import { eventHandler, readBody } from 'h3';
import { useResponseSuccess } from '~/utils/response';

// PUT 更新费用科目别名
export default eventHandler(async (event) => {
  const id = event.context.params?.id;
  const body = await readBody(event);

  const updatedCategory: Partial<ExpenseCategory> = {
    id,
    aliases: body.aliases || [],
    updatedAt: new Date().toISOString(),
  };

  return useResponseSuccess(updatedCategory);
});
