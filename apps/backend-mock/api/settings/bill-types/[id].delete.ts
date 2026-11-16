import { eventHandler } from 'h3';
import { useResponseSuccess } from '~/utils/response';

// DELETE 删除单据类型
export default eventHandler((event) => {
  const id = event.context.params?.id;
  console.log('Deleting bill type:', id);

  return useResponseSuccess(null);
});
