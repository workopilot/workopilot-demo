/**
 * 开发者首页相关类型定义
 */

// 应用状态
export type AppStatus = 'developing' | 'published';

// 开发者信息
export interface DeveloperProfile {
  id: string;
  name: string; // 开发者名称
  avatar?: string; // 头像
  role: string; // 角色,如:高级开发者
  department: string; // 所属部门
  email: string; // 邮箱
  joinDate: string; // 加入时间
  totalApps: number; // 创建应用数
}

// Token 消耗
export interface TokenUsage {
  used: number; // 已使用 token
  total: number; // 总额度
  remainDays: number; // 预计可用天数
  unit: string; // 单位,如:Tokens
}

// 我的应用
export interface MyApp {
  id: string;
  name: string; // 应用名称
  logo: string; // 应用 logo(图片路径或图标名)
  logoColor?: string; // logo 颜色
  logoBgColor?: string; // logo 背景色
  status: AppStatus; // 状态
  description: string; // 简介
  updatedAt: string; // 更新时间
  route?: string; // 跳转路由
}

// 快捷导航
export interface QuickNavItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  route?: string;
}

// 首页数据聚合
export interface DeveloperHomeData {
  profile: DeveloperProfile;
  tokenUsage: TokenUsage;
  myApps: MyApp[];
  quickNav: QuickNavItem[];
}
