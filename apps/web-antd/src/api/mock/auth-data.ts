export interface MockUser {
  userId: string;
  username: string;
  realName: string;
  avatar: string;
  desc?: string;
  password?: string;
  token: string;
  roles: string[];
  homePath?: string;
}

const users: MockUser[] = [
  {
    userId: '1',
    username: 'vben',
    realName: 'Vben Admin',
    avatar:
      'https://unpkg.com/@vbenjs/static-source@0.1.7/source/avatar-v1.webp',
    desc: 'manager',
    password: 'vben',
    token: 'fake-token-vben',
    roles: ['super'],
    homePath: '/workspace',
  },
  {
    userId: '2',
    username: 'admin',
    realName: 'Admin',
    avatar:
      'https://unpkg.com/@vbenjs/static-source@0.1.7/source/avatar-v1.webp',
    desc: 'manager',
    password: 'admin',
    token: 'fake-token-admin',
    roles: ['admin'],
    homePath: '/workspace',
  },
];

export function getMockUser(username: string): MockUser | undefined {
  return users.find((user) => user.username === username);
}

export function getMockUserByToken(token: string): MockUser | undefined {
  return users.find((user) => user.token === token);
}

export const MOCK_MENUS = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: 'LAYOUT',
    redirect: '/workspace',
    meta: {
      title: 'routes.dashboard.dashboard',
      icon: 'lucide:layout-dashboard',
    },
    children: [
      {
        path: 'analytics',
        name: 'Analytics',
        component: '/dashboard/analytics/index',
        meta: {
          title: 'routes.dashboard.analytics',
          icon: 'lucide:area-chart',
        },
      },
      {
        path: 'workspace',
        name: 'Workspace',
        component: '/dashboard/workspace/index',
        meta: {
          title: 'routes.dashboard.workspace',
          icon: 'lucide:briefcase',
        },
      },
    ],
  },
];

export function mockDelay(ms = 500) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
