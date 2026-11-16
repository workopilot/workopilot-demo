import type { UserInfo } from '@vben/types';

import { useAccessStore } from '@vben/stores';

import { getMockUserByToken, mockDelay } from '../mock/auth-data';

/**
 * 获取用户信息
 */
export async function getUserInfoApi() {
  await mockDelay();
  const accessStore = useAccessStore();
  const token = accessStore.accessToken;

  const user = getMockUserByToken(token || '');
  if (user) {
    return user as UserInfo;
  }

  // Default fallback to Admin
  return {
    userId: '2',
    username: 'admin',
    realName: 'Admin',
    avatar:
      'https://unpkg.com/@vbenjs/static-source@0.1.7/source/avatar-v1.webp',
    desc: 'manager',
    roles: ['admin'],
    homePath: '/workspace',
  } as UserInfo;
}
