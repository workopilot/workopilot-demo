/**
 * 开发者首页 API
 */

import type { DeveloperHomeData } from '#/types/developer-home';

import { createMockResponse, mockDelay } from './mock-data';

// Mock 数据
const mockDeveloperHomeData: DeveloperHomeData = {
  profile: {
    id: 'dev-001',
    name: '张丽峰',
    avatar: '',
    role: '开发负责人',
    department: '张氏人工智能服务公司',
    email: 'zhanglifeng@wiseai.com',
    joinDate: '2024-03-15',
    totalApps: 5,
  },
  // 初始无额度:触发首页「开启新手礼包」引导
  tokenUsage: {
    used: 0,
    total: 0,
    remainDays: 0,
    unit: 'Tokens',
  },
  myApps: [
    {
      id: 'app-1',
      name: '智能填报专员',
      logo: 'lucide:edit-3',
      logoColor: '#3b82f6',
      logoBgColor: '#eff6ff',
      status: 'published',
      description: '基于 LLM 的智能表单填写助手,支持多类型表单自动识别与填入。',
      updatedAt: '2026-06-12',
      route: '/filling/scripts',
    },
    {
      id: 'app-2',
      name: 'PPT 助手',
      logo: 'lucide:presentation',
      logoColor: '#f59e0b',
      logoBgColor: '#fffbeb',
      status: 'developing',
      description: '一键生成演示文稿,支持大纲整理、内容生成与样式模板。',
      updatedAt: '2026-06-15',
      route: '',
    },
    {
      id: 'app-3',
      name: '智能合同审核',
      logo: 'lucide:file-check-2',
      logoColor: '#10b981',
      logoBgColor: '#ecfdf5',
      status: 'published',
      description: '面向法务场景的合同条款比对与风险点提示。',
      updatedAt: '2026-05-28',
      route: '/audit/policy',
    },
    {
      id: 'app-4',
      name: '附件智能分类',
      logo: 'lucide:folder-tree',
      logoColor: '#8b5cf6',
      logoBgColor: '#f5f3ff',
      status: 'published',
      description: '基于视觉与文本理解的附件自动归类与打标。',
      updatedAt: '2026-04-20',
      route: '/audit/settings',
    },
    {
      id: 'app-5',
      name: '数据洞察助手',
      logo: 'lucide:bar-chart-3',
      logoColor: '#ef4444',
      logoBgColor: '#fef2f2',
      status: 'developing',
      description: '通过自然语言对话完成指标查询与可视化分析。',
      updatedAt: '2026-06-10',
      route: '',
    },
  ],
  quickNav: [
    {
      id: 'nav-1',
      title: '附件分类配置',
      description: '配置附件分类规则',
      icon: 'lucide:folder-cog',
      color: '#3b82f6',
      route: '/audit/settings',
    },
    {
      id: 'nav-2',
      title: '数字员工管理',
      description: '管理数字员工',
      icon: 'lucide:bot',
      color: '#10b981',
      route: '/agent/management',
    },
    {
      id: 'nav-3',
      title: '模型管理',
      description: '配置 AI 模型',
      icon: 'lucide:cpu',
      color: '#8b5cf6',
      route: '/platform/model-management',
    },
    {
      id: 'nav-4',
      title: 'APIKey 管理',
      description: '管理 API 密钥',
      icon: 'lucide:key',
      color: '#f59e0b',
      route: '/developer/api-keys',
    },
    {
      id: 'nav-5',
      title: '字典管理',
      description: '管理系统字典',
      icon: 'lucide:book-open',
      color: '#ef4444',
      route: '/platform/dictionary',
    },
  ],
};

/**
 * 获取开发者首页数据
 */
export async function getDeveloperHomeDataApi(): Promise<
  ReturnType<typeof createMockResponse<DeveloperHomeData>>
> {
  await mockDelay();
  return createMockResponse(mockDeveloperHomeData);
}

// 新手礼包赠送的额度
const STARTER_PACK_USAGE = {
  used: 1_280_000,
  total: 5_000_000,
  remainDays: 48,
  unit: 'Tokens',
};

/**
 * 开启新手礼包(赠送 Token 体验额度)
 */
export async function claimStarterPackApi() {
  await mockDelay();
  mockDeveloperHomeData.tokenUsage = { ...STARTER_PACK_USAGE };
  return createMockResponse({ success: true });
}
