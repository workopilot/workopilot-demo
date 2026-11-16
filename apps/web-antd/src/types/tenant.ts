/**
 * 租户管理相关类型
 */

// 租户状态
export type TenantStatus = 'active' | 'disabled' | 'expired';

// 租户行业
export type TenantIndustry =
  | 'finance'
  | 'government'
  | 'healthcare'
  | 'manufacturing'
  | 'other'
  | 'retail'
  | 'technology';

// 租户规模
export type TenantSize = 'enterprise' | 'large' | 'medium' | 'small';

// 租户信息
export interface Tenant {
  id: string; // 租户ID
  name: string; // 租户名称
  code: string; // 租户编码
  industry: TenantIndustry; // 所属行业
  size: TenantSize; // 企业规模
  contact: string; // 联系人
  phone: string; // 联系电话
  email: string; // 邮箱
  address: string; // 地址
  status: TenantStatus; // 状态
  expiryDate: string; // 到期时间
  subscriptionCount: number; // 订阅数量
  createdAt: string; // 创建时间
  updatedAt: string; // 更新时间
}

// 租户查询参数
export interface TenantQueryParams {
  code?: string; // 租户编号筛选
  name?: string; // 租户名称筛选
  contact?: string; // 联系人筛选
  status?: TenantStatus; // 状态筛选
  page: number;
  pageSize: number;
}

// 租户行业映射
export const TenantIndustryMap: Record<TenantIndustry, string> = {
  finance: '金融',
  government: '政府',
  healthcare: '医疗',
  manufacturing: '制造',
  retail: '零售',
  technology: '科技',
  other: '其他',
};

// 租户规模映射
export const TenantSizeMap: Record<TenantSize, string> = {
  small: '小型企业',
  medium: '中型企业',
  large: '大型企业',
  enterprise: '集团企业',
};

// 租户状态映射
export const TenantStatusMap: Record<TenantStatus, string> = {
  active: '启用',
  disabled: '禁用',
  expired: '过期',
};

// ==================== 管理员相关类型 ====================

// 管理员状态
export type AdminStatus = 'active' | 'disabled' | 'locked';

// 管理员角色
export type AdminRole = 'admin' | 'operator' | 'super_admin';

// 管理员信息
export interface TenantAdmin {
  id: string; // 管理员ID
  tenantId: string; // 所属租户ID
  tenantName: string; // 所属租户名称
  username: string; // 用户名
  realName: string; // 真实姓名
  phone: string; // 手机号
  email: string; // 邮箱
  role: AdminRole; // 角色
  status: AdminStatus; // 状态
  lastLoginTime: string; // 最后登录时间
  createdAt: string; // 创建时间
  updatedAt: string; // 更新时间
}

// 管理员状态映射
export const AdminStatusMap: Record<AdminStatus, string> = {
  active: '正常',
  disabled: '禁用',
  locked: '锁定',
};

// 管理员角色映射
export const AdminRoleMap: Record<AdminRole, string> = {
  super_admin: '超级管理员',
  admin: '管理员',
  operator: '操作员',
};
