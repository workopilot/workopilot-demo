import { getMockUser, mockDelay } from '../mock/auth-data';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    password?: string;
    username?: string;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    accessToken: string;
  }

  export interface RefreshTokenResult {
    data: string;
    status: number;
  }
}

/**
 * 登录
 */
export async function loginApi(data: AuthApi.LoginParams) {
  await mockDelay();
  const user = getMockUser(data.username || '');
  if (user) {
    return { accessToken: user.token };
  }
  // Default fallback
  return { accessToken: 'fake-token-admin' };
}

/**
 * 刷新accessToken
 */
export async function refreshTokenApi() {
  await mockDelay();
  return {
    data: 'fake-refresh-token',
    status: 200,
  };
}

/**
 * 退出登录
 */
export async function logoutApi() {
  await mockDelay();
  return {};
}

/**
 * 获取用户权限码
 */
export async function getAccessCodesApi() {
  await mockDelay();
  return ['AC_100100', 'AC_100110', 'AC_100120'];
}
