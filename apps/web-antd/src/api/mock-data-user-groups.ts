// ==================== Mock 数据 ====================

import type {
  GroupMember,
  UserGroup,
  UserGroupDetail,
} from '#/types/user-groups';

/** 模拟用户数据 */
export const mockUsers = [
  {
    id: 'u001',
    name: '张三',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    department: '技术部',
  },
  {
    id: 'u002',
    name: '李四',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    department: '产品部',
  },
  {
    id: 'u003',
    name: '王五',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    department: '运营部',
  },
  {
    id: 'u004',
    name: '赵六',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucy',
    department: '市场部',
  },
  {
    id: 'u005',
    name: '孙七',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
    department: '财务部',
  },
  {
    id: 'u006',
    name: '周八',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    department: '技术部',
  },
  {
    id: 'u007',
    name: '吴九',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tom',
    department: '人力资源',
  },
  {
    id: 'u008',
    name: '郑十',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
    department: '行政部',
  },
];

/** 模拟群组成员数据 */
export const mockGroupMembers: Record<string, GroupMember[]> = {
  g001: [
    {
      id: 'm001',
      userId: 'u001',
      userName: '张三',
      userAvatar: mockUsers[0].avatar,
      userDepartment: '技术部',
      role: 'owner',
      status: 'active',
      joinedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 'm002',
      userId: 'u002',
      userName: '李四',
      userAvatar: mockUsers[1].avatar,
      userDepartment: '产品部',
      role: 'admin',
      status: 'active',
      joinedAt: '2024-01-16T10:00:00Z',
    },
    {
      id: 'm003',
      userId: 'u003',
      userName: '王五',
      userAvatar: mockUsers[2].avatar,
      userDepartment: '运营部',
      role: 'member',
      status: 'active',
      joinedAt: '2024-01-17T10:00:00Z',
    },
  ],
  g002: [
    {
      id: 'm004',
      userId: 'u001',
      userName: '张三',
      userAvatar: mockUsers[0].avatar,
      userDepartment: '技术部',
      role: 'owner',
      status: 'active',
      joinedAt: '2024-02-01T10:00:00Z',
    },
    {
      id: 'm005',
      userId: 'u004',
      userName: '赵六',
      userAvatar: mockUsers[3].avatar,
      userDepartment: '市场部',
      role: 'admin',
      status: 'active',
      joinedAt: '2024-02-02T10:00:00Z',
    },
    {
      id: 'm006',
      userId: 'u005',
      userName: '孙七',
      userAvatar: mockUsers[4].avatar,
      userDepartment: '财务部',
      role: 'member',
      status: 'active',
      joinedAt: '2024-02-03T10:00:00Z',
    },
  ],
  g003: [
    {
      id: 'm007',
      userId: 'u002',
      userName: '李四',
      userAvatar: mockUsers[1].avatar,
      userDepartment: '产品部',
      role: 'owner',
      status: 'active',
      joinedAt: '2024-02-10T10:00:00Z',
    },
  ],
  g004: [
    {
      id: 'm008',
      userId: 'u001',
      userName: '张三',
      userAvatar: mockUsers[0].avatar,
      userDepartment: '技术部',
      role: 'owner',
      status: 'active',
      joinedAt: '2024-03-01T10:00:00Z',
    },
    {
      id: 'm009',
      userId: 'u006',
      userName: '周八',
      userAvatar: mockUsers[5].avatar,
      userDepartment: '技术部',
      role: 'member',
      status: 'active',
      joinedAt: '2024-03-02T10:00:00Z',
    },
  ],
  g005: [
    {
      id: 'm010',
      userId: 'u003',
      userName: '王五',
      userAvatar: mockUsers[2].avatar,
      userDepartment: '运营部',
      role: 'owner',
      status: 'active',
      joinedAt: '2024-03-15T10:00:00Z',
    },
  ],
};

/** 模拟用户群组数据 */
export const mockUserGroups: UserGroup[] = [
  {
    id: 'g001',
    name: '项目管理组',
    code: 'PROJECT_MGMT',
    description: '负责项目全流程管理的专业团队',
    scope: 'tenant',
    ownerId: 'u001',
    ownerName: '张三',
    memberCount: 3,
    status: 'active',
    tags: ['项目管理', '协作'],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-05-10T10:00:00Z',
  },
  {
    id: 'g002',
    name: '市场推广组',
    code: 'MARKETING',
    description: '负责市场营销活动策划与执行',
    scope: 'tenant',
    ownerId: 'u001',
    ownerName: '张三',
    memberCount: 3,
    status: 'active',
    tags: ['市场', '推广'],
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-05-08T10:00:00Z',
  },
  {
    id: 'g003',
    name: '产品研发组',
    code: 'PRODUCT_RND',
    description: '李四的个人研发小组',
    scope: 'personal',
    ownerId: 'u002',
    ownerName: '李四',
    memberCount: 1,
    status: 'active',
    tags: ['研发', '产品'],
    createdAt: '2024-02-10T10:00:00Z',
    updatedAt: '2024-04-20T10:00:00Z',
  },
  {
    id: 'g004',
    name: '技术交流群',
    code: 'TECH_SHARE',
    description: '张三创建的技术分享交流群',
    scope: 'personal',
    ownerId: 'u001',
    ownerName: '张三',
    memberCount: 2,
    status: 'active',
    tags: ['技术', '交流'],
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-05-05T10:00:00Z',
  },
  {
    id: 'g005',
    name: '运营策划组',
    code: 'OPS_PLANNING',
    description: '王五的运营策划小组',
    scope: 'personal',
    ownerId: 'u003',
    ownerName: '王五',
    memberCount: 1,
    status: 'inactive',
    tags: ['运营'],
    createdAt: '2024-03-15T10:00:00Z',
    updatedAt: '2024-03-15T10:00:00Z',
  },
];

// ==================== 工具函数 ====================

/** 模拟网络延迟 */
export function mockDelay(ms: number = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 生成统一响应格式 */
export function createMockResponse<T>(data: T) {
  return {
    code: 0,
    data,
    message: 'success',
  };
}

/** 获取群组详情 */
export function getGroupDetailById(id: string): undefined | UserGroupDetail {
  const group = mockUserGroups.find((g) => g.id === id);
  if (!group) return undefined;

  return {
    ...group,
    members: mockGroupMembers[id] || [],
  };
}

/** 模拟当前用户（实际项目中从状态管理获取） */
export const currentUserId = 'u001';
export const currentUserRole = 'tenant_admin'; // tenant_admin | user
