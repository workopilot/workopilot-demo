import type { RouteRecordStringComponent } from '@vben/types';

import { MOCK_MENUS, mockDelay } from '../mock/auth-data';

/**
 * 获取用户所有菜单
 */
export async function getAllMenusApi() {
  await mockDelay();
  return MOCK_MENUS as RouteRecordStringComponent[];
}
