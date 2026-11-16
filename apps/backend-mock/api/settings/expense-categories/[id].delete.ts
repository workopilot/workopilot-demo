import { eventHandler } from 'h3';
import { useResponseSuccess } from '~/utils/response';

// DELETE 删除费用科目
export default eventHandler((event) => {
  const id = event.context.params?.id;
  console.log('Deleting expense category:', id);

  return useResponseSuccess(null);
});
