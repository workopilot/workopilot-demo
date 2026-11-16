import { eventHandler } from 'h3';
import { useResponseSuccess } from '~/utils/response';

// DELETE 删除系统
export default eventHandler((event) => {
  const id = event.context.params?.id;
  console.log('Deleting system:', id);

  return useResponseSuccess(null);
});
