// ==================== 类型定义 ====================

/** 用户群组类型 */
export type UserGroupScope = 'personal' | 'tenant';

/** 用户群组状态 */
export type UserGroupStatus = 'active' | 'inactive';

/** 成员角色 */
export type MemberRole = 'admin' | 'member' | 'owner';

/** 成员状态 */
export type MemberStatus = 'active' | 'inactive' | 'pending';

// ==================== 接口定义 ====================

/** 群组成员 */
export interface GroupMember {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userDepartment?: string;
  role: MemberRole;
  status: MemberStatus;
  joinedAt: string;
}

/** 用户群组 */
export interface UserGroup {
  id: string;
  name: string;
  code: string;
  description?: string;
  scope: UserGroupScope;
  ownerId: string;
  ownerName: string;
  memberCount: number;
  status: UserGroupStatus;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

/** 群组详情（含成员列表） */
export interface UserGroupDetail extends UserGroup {
  members: GroupMember[];
}

/** 群组表单数据 */
export interface UserGroupFormData {
  name: string;
  code: string;
  description?: string;
  tags?: string[];
}

/** 成员表单数据 */
export interface MemberFormData {
  userIds: string[];
  role: MemberRole;
}

/** 列表查询参数 */
export interface UserGroupQueryParams {
  page: number;
  pageSize: number;
  keyword?: string;
  scope?: UserGroupScope;
  status?: UserGroupStatus;
  tags?: string;
}

/** 列表响应 */
export interface UserGroupListResponse {
  items: UserGroup[];
  total: number;
}

/** 权限信息 */
export interface GroupPermission {
  canEdit: boolean;
  canDelete: boolean;
  canAddMember: boolean;
  canRemoveMember: boolean;
  canChangeMemberRole: boolean;
}
