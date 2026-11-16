import type { RouteRecordRaw } from 'vue-router';

const underDevelopment = () =>
  import('#/views/_core/fallback/under-development.vue');

function pendingRoute(
  name: string,
  path: string,
  title: string,
  icon: string,
): RouteRecordRaw {
  return {
    name,
    path,
    component: underDevelopment,
    meta: {
      icon,
      title,
    },
  };
}

const routes: RouteRecordRaw[] = [
  {
    name: 'MateDemoEntry',
    path: '/mate-demo',
    redirect: '/app/mate/home',
    meta: {
      icon: 'lucide:sparkles',
      order: 0,
      title: '用户端 Demo',
    },
  },
  {
    meta: {
      icon: 'lucide:layout-dashboard',
      order: 1,
      title: '工作台',
    },
    name: 'WorkbenchCenter',
    path: '/workbench',
    children: [
      {
        name: 'PlatformHome',
        path: '/workspace',
        component: () => import('#/views/dashboard/system-home/index.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:house',
          title: '首页',
        },
      },
      {
        name: 'DigitalEmployeeBill',
        path: '/workbench/digital-employee-bill',
        component: () =>
          import('#/views/agent/tenant-billing/bill-overview.vue'),
        meta: {
          icon: 'lucide:receipt-text',
          title: '数字员工账单',
        },
      },
      {
        name: 'TenantBillDetail',
        path: '/ai-employee/tenant-bill-detail',
        component: () => import('#/views/agent/tenant-billing/bill-detail.vue'),
        meta: {
          hideInMenu: true,
          title: '消耗流水明细',
        },
      },
      {
        name: 'TenantSupportGuide',
        path: '/ai-employee/tenant-support-guide',
        component: () =>
          import('#/views/agent/tenant-billing/support-guide.vue'),
        meta: {
          hideInMenu: true,
          title: '续费与升级指南',
        },
      },
    ],
  },
  {
    meta: {
      icon: 'lucide:bot-message-square',
      order: 2,
      title: '数字员工中心',
    },
    name: 'DigitalEmployeeCenter',
    path: '/digital-employees',
    children: [
      {
        name: 'DigitalEmployeeConfig',
        path: '/digital-employees/config',
        component: () => import('#/views/ai-employee/agent-config/list.vue'),
        meta: {
          icon: 'lucide:bot',
          title: '数字员工配置',
        },
      },
      {
        name: 'DigitalEmployeeDebugWorkbench',
        path: '/digital-employees/debug-workbench',
        component: () => import('#/views/ai-employee/workbench/list.vue'),
        meta: {
          icon: 'lucide:monitor-cog',
          title: '调试工作台',
        },
      },
      pendingRoute(
        'DigitalEmployeeSkillCenter',
        '/digital-employees/skills',
        '技能中心',
        'lucide:sparkles',
      ),
      pendingRoute(
        'DigitalEmployeeRuntimeStatistics',
        '/digital-employees/runtime-statistics',
        '员工运行统计',
        'lucide:chart-no-axes-combined',
      ),
      {
        name: 'DigitalEmployeePerformanceDashboard',
        path: '/digital-employees/performance-dashboard',
        component: () =>
          import('#/views/ai-employee/performance/dashboard.vue'),
        meta: {
          icon: 'lucide:chart-spline',
          title: '绩效看板',
        },
      },
      {
        name: 'DigitalEmployeePerformanceSettings',
        path: '/digital-employees/performance',
        component: () => import('#/views/ai-employee/performance/index.vue'),
        meta: {
          icon: 'lucide:gauge',
          title: '数字绩效设置',
        },
      },
      {
        name: 'DigitalEmployeePerformanceDetail',
        path: '/digital-employees/performance/:id',
        component: () => import('#/views/ai-employee/performance/detail.vue'),
        meta: {
          hideInMenu: true,
          title: '员工绩效详情',
        },
      },
      {
        name: 'AIEmployeeAgentConfigEdit',
        path: '/ai-employee/agent-config/edit/:id',
        component: () => import('#/views/ai-employee/agent-config/index.vue'),
        meta: {
          hideInMenu: true,
          title: '编辑数字员工',
        },
      },
      {
        name: 'AIEmployeeWorkbenchChat',
        path: '/ai-employee/workbench/chat/:id',
        component: () => import('#/views/ai-employee/workbench/index.vue'),
        meta: {
          hideInMenu: true,
          title: '工作台会话',
        },
      },
    ],
  },
  {
    meta: {
      icon: 'lucide:blocks',
      order: 3,
      title: '能力中心',
    },
    name: 'CapabilityCenter',
    path: '/capabilities',
    children: [
      {
        name: 'AgentCapabilities',
        path: '/capabilities/agents',
        component: () => import('#/views/agent/management/index.vue'),
        meta: {
          icon: 'lucide:brain-circuit',
          title: '智能体能力',
        },
      },
      {
        name: 'AIServiceAccess',
        path: '/capabilities/ai-services',
        component: () => import('#/views/smart/service-mgmt/index.vue'),
        meta: {
          icon: 'lucide:server-cog',
          title: 'AI服务接入',
        },
      },
      {
        name: 'SecretAuthentication',
        path: '/capabilities/api-keys',
        component: () => import('#/views/smart/api-key/index.vue'),
        meta: {
          icon: 'lucide:key-round',
          title: '密钥鉴权',
        },
      },
      {
        name: 'McpToolManagement',
        path: '/capabilities/mcp-tools',
        component: () => import('#/views/audit/tools-data/index.vue'),
        meta: {
          icon: 'lucide:wrench',
          title: 'MCP工具管理',
        },
      },
      {
        name: 'CapabilityModelManagement',
        path: '/capabilities/models',
        component: () => import('#/views/platform/model-management/index.vue'),
        meta: {
          icon: 'lucide:cpu',
          title: '模型管理',
        },
      },
      {
        name: 'BusinessSystemsAndDocuments',
        path: '/capabilities/business-systems',
        component: () => import('#/views/audit/settings/index.vue'),
        meta: {
          icon: 'lucide:panels-top-left',
          title: '业务系统与单据',
        },
      },
    ],
  },
  {
    meta: {
      icon: 'lucide:library-big',
      order: 4,
      title: '知识与档案',
    },
    name: 'KnowledgeAndArchives',
    path: '/knowledge-archives',
    children: [
      {
        name: 'EnterpriseEntities',
        path: '/knowledge-archives/entities',
        component: () => import('#/views/enterprise-entity/index.vue'),
        meta: { icon: 'lucide:boxes', title: '企业实体' },
      },
      {
        name: 'EnterpriseEntityWorkbench',
        path: '/knowledge-archives/entities/:id',
        component: () => import('#/views/enterprise-entity/workbench.vue'),
        meta: { hideInMenu: true, title: '实体实施工作台' },
      },
      {
        name: 'CustomerMasterData',
        path: '/knowledge-archives/customers',
        component: () => import('#/views/ai-employee/data-center/index.vue'),
        meta: {
          icon: 'lucide:contact-round',
          title: '客户主数据',
        },
      },
      {
        name: 'ProductMasterData',
        path: '/knowledge-archives/products',
        component: () => import('#/views/ai-employee/data-center/index.vue'),
        meta: {
          icon: 'lucide:package-search',
          title: '商品主数据',
        },
      },
      {
        name: 'ElectronicArchives',
        path: '/knowledge-archives/electronic-archives',
        component: () => import('#/views/file-management/index.vue'),
        meta: {
          icon: 'lucide:archive',
          title: '电子档案',
        },
      },
      {
        name: 'ArchiveUserGroups',
        path: '/knowledge-archives/user-groups',
        component: () => import('#/views/audit/settings/user-groups/index.vue'),
        meta: {
          icon: 'lucide:users-round',
          title: '档案用户组',
        },
      },
    ],
  },
  {
    meta: {
      icon: 'lucide:settings',
      order: 5,
      title: '系统管理',
    },
    name: 'SystemManagement',
    path: '/system-management',
    children: [
      pendingRoute(
        'SystemUserManagement',
        '/system-management/users',
        '用户管理',
        'lucide:user-cog',
      ),
      {
        name: 'SystemRolePermissions',
        path: '/system-management/roles',
        component: () => import('#/views/audit/settings/role/index.vue'),
        meta: {
          icon: 'lucide:shield-user',
          title: '角色与权限',
        },
      },
      {
        name: 'SystemAuthorizationGroups',
        path: '/system-management/authorization',
        component: () => import('#/views/system/authorization/index.vue'),
        meta: { icon: 'lucide:shield-check', title: '授权管理' },
      },
      pendingRoute(
        'SystemOrganizations',
        '/system-management/organizations',
        '组织部门',
        'lucide:network',
      ),
      pendingRoute(
        'SystemPositions',
        '/system-management/positions',
        '岗位配置',
        'lucide:briefcase-business',
      ),
      pendingRoute(
        'SystemMenusAndPermissions',
        '/system-management/menus',
        '菜单与权限点',
        'lucide:list-tree',
      ),
      pendingRoute(
        'SystemDataDictionary',
        '/system-management/dictionaries',
        '数据字典',
        'lucide:book-key',
      ),
      pendingRoute(
        'SystemParameters',
        '/system-management/parameters',
        '系统参数',
        'lucide:sliders-horizontal',
      ),
      pendingRoute(
        'SystemNotifications',
        '/system-management/notifications',
        '通知与公告',
        'lucide:megaphone',
      ),
      {
        name: 'SystemStorageAndFiles',
        path: '/system-management/storage-files',
        component: () => import('#/views/file-storage/index.vue'),
        meta: {
          icon: 'lucide:hard-drive',
          title: '存储与文件管理',
        },
      },
      pendingRoute(
        'SystemClients',
        '/system-management/clients',
        '客户端与终端',
        'lucide:monitor-smartphone',
      ),
      pendingRoute(
        'SystemMailGateway',
        '/system-management/mail-gateway',
        '邮件网关设置',
        'lucide:mail-cog',
      ),
      pendingRoute(
        'SystemMailTemplates',
        '/system-management/mail-templates',
        '邮件通知模板',
        'lucide:mail-check',
      ),
    ],
  },
  {
    meta: {
      icon: 'lucide:monitor-up',
      order: 6,
      title: '运维与监控',
    },
    name: 'OperationsAndMonitoring',
    path: '/operations-monitoring',
    children: [
      pendingRoute(
        'OnlineUserMonitoring',
        '/operations-monitoring/online-users',
        '在线用户监控',
        'lucide:users',
      ),
      pendingRoute(
        'CachePerformanceMonitoring',
        '/operations-monitoring/cache-performance',
        '缓存与性能监控',
        'lucide:gauge',
      ),
      {
        name: 'SystemUsageMonitoring',
        path: '/operations-monitoring/usage',
        component: () => import('#/views/operations/usage/index.vue'),
        meta: {
          icon: 'lucide:activity',
          title: '系统用量监控',
        },
      },
    ],
  },
  {
    meta: {
      icon: 'lucide:shield-check',
      order: 7,
      title: '安全与审计',
    },
    name: 'SecurityAndAudit',
    path: '/security-audit',
    children: [
      pendingRoute(
        'UserOperationLogs',
        '/security-audit/operation-logs',
        '用户操作日志',
        'lucide:logs',
      ),
      pendingRoute(
        'SystemLoginLogs',
        '/security-audit/login-logs',
        '系统登录日志',
        'lucide:log-in',
      ),
      {
        name: 'ApiServiceCallLogs',
        path: '/security-audit/api-service-logs',
        component: () => import('#/views/operations/service-logs/index.vue'),
        meta: {
          icon: 'lucide:webhook',
          title: 'API服务调用日志',
        },
      },
      {
        name: 'ModelInferenceLogs',
        path: '/security-audit/model-inference-logs',
        component: () => import('#/views/audit/model-logs/index.vue'),
        meta: {
          icon: 'lucide:scroll-text',
          title: '模型推理日志',
        },
      },
    ],
  },
  {
    meta: {
      icon: 'lucide:building-2',
      order: 8,
      title: '租户管理',
    },
    name: 'TenantCenter',
    path: '/tenants',
    children: [
      {
        name: 'TenantArchiveManagement',
        path: '/tenants/archives',
        component: () => import('#/views/tenant/management/index.vue'),
        meta: {
          icon: 'lucide:building',
          title: '租户档案管理',
        },
      },
      {
        name: 'TenantPackageConfiguration',
        path: '/tenants/packages',
        component: () =>
          import('#/views/platform/package-management/index.vue'),
        meta: {
          icon: 'lucide:layers-3',
          title: '租户套餐配置',
        },
      },
      {
        name: 'TenantSubscriptionManagement',
        path: '/tenants/subscriptions',
        component: () =>
          import('#/views/ai-employee/tenant-subscription-management/index.vue'),
        meta: {
          icon: 'lucide:receipt',
          title: '租户订阅管理',
        },
      },
      {
        name: 'DigitalEmployeeBilling',
        path: '/tenants/digital-employee-billing',
        component: () =>
          import('#/views/ai-employee/tenant-employee-billing-management/index.vue'),
        meta: {
          icon: 'lucide:badge-dollar-sign',
          title: '数字员工计费',
        },
      },
    ],
  },
  {
    meta: {
      icon: 'lucide:orbit',
      order: 9,
      title: '平台运营中心',
    },
    name: 'PlatformOperationsCenter',
    path: '/platform-operations',
    children: [
      pendingRoute(
        'OfficialDigitalEmployeeLibrary',
        '/platform-operations/digital-employees',
        '官方数字员工库',
        'lucide:library',
      ),
      pendingRoute(
        'OfficialSkillLibrary',
        '/platform-operations/skills',
        '官方技能库',
        'lucide:wand-sparkles',
      ),
      {
        name: 'ProductServiceCatalog',
        path: '/platform-operations/products',
        component: () => import('#/views/operations/products/index.vue'),
        meta: {
          icon: 'lucide:package',
          title: '产品与服务目录',
        },
      },
      {
        name: 'DeveloperEcosystemManagement',
        path: '/platform-operations/developers',
        component: () =>
          import('#/views/operations/developer-management/index.vue'),
        meta: {
          icon: 'lucide:code-xml',
          title: '开发者生态管理',
        },
      },
      {
        name: 'TenantSubscriptionOverview',
        path: '/platform-operations/subscriptions',
        component: () => import('#/views/operations/subscriptions/index.vue'),
        meta: {
          icon: 'lucide:chart-pie',
          title: '租户订阅总览',
        },
      },
      {
        name: 'PlatformModelResources',
        path: '/platform-operations/models',
        component: () => import('#/views/platform/model-management/index.vue'),
        meta: {
          icon: 'lucide:server',
          title: '平台模型资源',
        },
      },
      pendingRoute(
        'OperationalAlertRules',
        '/platform-operations/alerts',
        '运营预警规则',
        'lucide:triangle-alert',
      ),
      pendingRoute(
        'ApplicationThemeManagement',
        '/platform-operations/application-themes',
        '应用主题管理',
        'lucide:palette',
      ),
    ],
  },
];

export default routes;
