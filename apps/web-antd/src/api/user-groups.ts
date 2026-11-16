// ==================== API 接口 ====================

import type {
  GroupMember,
  GroupPermission,
  MemberFormData,
  UserGroup,
  UserGroupDetail,
  UserGroupFormData,
  UserGroupListResponse,
  UserGroupQueryParams,
} from '#/types/user-groups';

import {
  createMockResponse,
  currentUserId,
  currentUserRole,
  getGroupDetailById,
  mockDelay,
  mockGroupMembers,
  mockUserGroups,
  mockUsers,
} from './mock-data-user-groups';

// ==================== 群组管理 ====================

/** 获取用户群组列表 */
export async function getUserGroups(
  params: UserGroupQueryParams,
): Promise<{ data: UserGroupListResponse }> {
  await mockDelay();

  let filteredGroups = [...mockUserGroups];

  // 关键词搜索
  if (params.keyword) {
    filteredGroups = filteredGroups.filter(
      (g) =>
        g.name.includes(params.keyword!) ||
        g.code.includes(params.keyword!) ||
        g.description?.includes(params.keyword!),
    );
  }

  // 范围筛选
  if (params.scope) {
    filteredGroups = filteredGroups.filter((g) => g.scope === params.scope);
  }

  // 状态筛选
  if (params.status) {
    filteredGroups = filteredGroups.filter((g) => g.status === params.status);
  }

  // 标签筛选
  if (params.tags) {
    filteredGroups = filteredGroups.filter((g) =>
      g.tags?.some((t) => t.includes(params.tags!)),
    );
  }

  // 分页
  const start = (params.page - 1) * params.pageSize;
  const end = start + params.pageSize;
  const items = filteredGroups.slice(start, end);

  return createMockResponse({
    items,
    total: filteredGroups.length,
  });
}

/** 获取群组详情 */
export async function getGroupDetail(
  id: string,
): Promise<{ data: UserGroupDetail }> {
  await mockDelay();

  const detail = getGroupDetailById(id);
  if (!detail) {
    throw new Error('群组不存在');
  }

  return createMockResponse(detail);
}

/** 创建用户群组 */
export async function createGroup(
  data: UserGroupFormData,
): Promise<{ data: UserGroup }> {
  await mockDelay();

  const newGroup: UserGroup = {
    id: `g${Date.now()}`,
    ...data,
    scope: 'personal', // 默认为个人级群组
    ownerId: currentUserId,
    ownerName: '当前用户',
    memberCount: 1,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 添加成员
  mockGroupMembers[newGroup.id] = [
    {
      id: `m${Date.now()}`,
      userId: currentUserId,
      userName: '当前用户',
      role: 'owner',
      status: 'active',
      joinedAt: new Date().toISOString(),
    },
  ];

  mockUserGroups.unshift(newGroup);

  return createMockResponse(newGroup);
}

/** 更新用户群组 */
export async function updateGroup(
  id: string,
  data: Partial<UserGroupFormData>,
): Promise<{ data: UserGroup }> {
  await mockDelay();

  const index = mockUserGroups.findIndex((g) => g.id === id);
  if (index === -1) {
    throw new Error('群组不存在');
  }

  mockUserGroups[index] = {
    ...mockUserGroups[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  return createMockResponse(mockUserGroups[index]);
}

/** 删除用户群组 */
export async function deleteGroup(id: string): Promise<{ data: void }> {
  await mockDelay();

  const index = mockUserGroups.findIndex((g) => g.id === id);
  if (index === -1) {
    throw new Error('群组不存在');
  }

  mockUserGroups.splice(index, 1);
  delete mockGroupMembers[id];

  return createMockResponse(undefined);
}

/** 切换群组状态 */
export async function toggleGroupStatus(
  id: string,
): Promise<{ data: UserGroup }> {
  await mockDelay();

  const group = mockUserGroups.find((g) => g.id === id);
  if (!group) {
    throw new Error('群组不存在');
  }

  group.status = group.status === 'active' ? 'inactive' : 'active';
  group.updatedAt = new Date().toISOString();

  return createMockResponse(group);
}

// ==================== 成员管理 ====================

/** 获取群组成员列表 */
export async function getGroupMembers(
  groupId: string,
): Promise<{ data: GroupMember[] }> {
  await mockDelay();

  const members = mockGroupMembers[groupId] || [];
  return createMockResponse(members);
}

/** 添加群组成员 */
export async function addGroupMembers(
  groupId: string,
  data: MemberFormData,
): Promise<{ data: GroupMember[] }> {
  await mockDelay();

  const members = mockGroupMembers[groupId];
  if (!members) {
    throw new Error('群组不存在');
  }

  const newMembers: GroupMember[] = data.userIds.map((userId) => {
    const user = mockUsers.find((u) => u.id === userId);
    return {
      id: `m${Date.now()}_${userId}`,
      userId,
      userName: user?.name || '未知用户',
      userAvatar: user?.avatar,
      userDepartment: user?.department,
      role: data.role,
      status: 'active',
      joinedAt: new Date().toISOString(),
    };
  });

  members.push(...newMembers);

  // 更新成员计数
  const group = mockUserGroups.find((g) => g.id === groupId);
  if (group) {
    group.memberCount = members.length;
    group.updatedAt = new Date().toISOString();
  }

  return createMockResponse(newMembers);
}

/** 移除群组成员 */
export async function removeGroupMember(
  groupId: string,
  memberId: string,
): Promise<{ data: void }> {
  await mockDelay();

  const members = mockGroupMembers[groupId];
  if (!members) {
    throw new Error('群组不存在');
  }

  const index = members.findIndex((m) => m.id === memberId);
  if (index === -1) {
    throw new Error('成员不存在');
  }

  members.splice(index, 1);

  // 更新成员计数
  const group = mockUserGroups.find((g) => g.id === groupId);
  if (group) {
    group.memberCount = members.length;
    group.updatedAt = new Date().toISOString();
  }

  return createMockResponse(undefined);
}

/** 更改成员角色 */
export async function changeMemberRole(
  groupId: string,
  memberId: string,
  role: 'admin' | 'member',
): Promise<{ data: GroupMember }> {
  await mockDelay();

  const members = mockGroupMembers[groupId];
  if (!members) {
    throw new Error('群组不存在');
  }

  const member = members.find((m) => m.id === memberId);
  if (!member) {
    throw new Error('成员不存在');
  }

  member.role = role;

  return createMockResponse(member);
}

// ==================== 权限判断 ====================

/** 获取群组权限信息 */
export async function getGroupPermission(
  groupId: string,
): Promise<{ data: GroupPermission }> {
  await mockDelay();

  const group = mockUserGroups.find((g) => g.id === groupId);
  if (!group) {
    throw new Error('群组不存在');
  }

  const isOwner = group.ownerId === currentUserId;
  const isTenantAdmin = currentUserRole === 'tenant_admin';
  const isTenantGroup = group.scope === 'tenant';
  const members = mockGroupMembers[groupId] || [];
  const isMember = members.some((m) => m.userId === currentUserId);

  // 租户管理员对租户级群组有完全权限
  if (isTenantAdmin && isTenantGroup) {
    return createMockResponse({
      canEdit: true,
      canDelete: true,
      canAddMember: true,
      canRemoveMember: true,
      canChangeMemberRole: true,
    });
  }

  // 群组拥有者有完全权限
  if (isOwner) {
    return createMockResponse({
      canEdit: true,
      canDelete: true,
      canAddMember: true,
      canRemoveMember: true,
      canChangeMemberRole: true,
    });
  }

  // 普通成员只能查看
  return createMockResponse({
    canEdit: false,
    canDelete: false,
    canAddMember: false,
    canRemoveMember: false,
    canChangeMemberRole: false,
  });
}

/** 获取可选用户列表 */
export async function getAvailableUsers(
  keyword?: string,
): Promise<{ data: typeof mockUsers }> {
  await mockDelay();

  if (!keyword) {
    return createMockResponse(mockUsers);
  }

  const filtered = mockUsers.filter(
    (u) =>
      u.name.includes(keyword) ||
      u.department?.includes(keyword) ||
      u.id.includes(keyword),
  );

  return createMockResponse(filtered);
}
