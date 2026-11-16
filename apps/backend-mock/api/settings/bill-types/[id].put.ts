import { eventHandler, readBody } from 'h3';
import { useResponseSuccess } from '~/utils/response';

// PUT 更新单据类型
export default eventHandler(async (event) => {
  const id = event.context.params?.id;
  const body = await readBody(event);

  const updatedBillType = {
    id,
    ...body,
    updatedAt: new Date().toISOString(),
  };

  return useResponseSuccess(updatedBillType);
});
