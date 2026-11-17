import type { RouteRecordRaw } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';

import { $t } from '#/locales';

const BasicLayout = () => import('#/layouts/basic.vue');
const AuthPageLayout = () => import('#/layouts/auth.vue');
const MateAppLayout = () => import('#/layouts/mate-app-shell.vue');

const mateAppRoute: RouteRecordRaw = {
  path: '/app/mate',
  component: MateAppLayout,
  meta: {
    hideInBreadcrumb: true,
    hideInMenu: true,
    hideInTab: true,
    ignoreAccess: true,
    title: 'Mate 用户端',
  },
  children: [
    {
      path: '',
      redirect: '/app/mate/employee/new-report-assistant/report-chat',
    },
    {
      name: 'MateDemoGuide',
      path: 'help',
      component: () => import('#/views/app/mate/demo-guide/index.vue'),
      meta: { hideInMenu: true, title: 'Demo 开发指南' },
    },
    {
      name: 'MateHome',
      path: 'home',
      component: () => import('#/views/app/mate/home.vue'),
      meta: { hideInMenu: true, title: '工作台' },
    },
    {
      name: 'MateEmployees',
      path: 'employees',
      redirect: '/app/mate/employee/new-report-assistant/report-chat',
      meta: { hideInMenu: true, title: '数字员工' },
    },
    {
      name: 'MateEmployeeWorkspace',
      path: 'employee/:employeeId',
      component: () =>
        import('#/views/app/mate/ai-work/employee-workspace.vue'),
      redirect: (to) => {
        return to.params.employeeId === 'ticket-assistant'
          ? '/app/mate/employee/ticket-assistant/ticket-chat'
          : '/app/mate/employee/new-report-assistant/report-chat';
      },
      meta: { hideInMenu: true, title: 'AI Work 数字员工' },
      children: [
        {
          name: 'NewSalesAssistantPage',
          path: 'sales/chat',
          component: () => import('#/views/app/mate/new-sales/chat.vue'),
          meta: { hideInMenu: true, title: '新销售助理' },
        },
        {
          name: 'SalesCommandCenter',
          path: 'sales/workbench',
          component: () => import('#/views/app/mate/new-sales/workspace.vue'),
          meta: { hideInMenu: true, title: '销售工作台' },
        },
        {
          name: 'SalesDealsPipeline',
          path: 'sales/pipeline',
          component: () => import('#/views/app/mate/new-sales/pipeline.vue'),
          meta: { hideInMenu: true, title: '商机' },
        },
        {
          name: 'SalesCustomerHub',
          path: 'sales/customers',
          component: () => import('#/views/app/mate/new-sales/workspace.vue'),
          meta: { hideInMenu: true, title: '客户中心' },
        },
        {
          path: 'sales/:salesPage',
          redirect: '/app/mate/employee/new-sales-assistant/sales/chat',
        },
        {
          name: 'NewReviewAssistantChat',
          path: 'review-chat',
          component: () => import('#/views/app/mate/new-review/chat.vue'),
          meta: { hideInMenu: true, title: '对话' },
        },
        {
          name: 'NewReviewAssistantReports',
          path: 'report-review',
          component: () => import('#/views/app/mate/new-review/index.vue'),
          meta: { hideInMenu: true, title: '审核中心' },
        },
        {
          name: 'NewReportAssistantChat',
          path: 'report-chat',
          component: () => import('#/views/app/mate/new-report/chat.vue'),
          meta: { hideInMenu: true, title: '对话' },
        },
        {
          name: 'NewReportAssistantHistory',
          path: 'report-history',
          component: () => import('#/views/app/mate/new-report/history.vue'),
          meta: { hideInMenu: true, title: '历史报告查询' },
        },
        {
          name: 'NewReportAssistant',
          path: 'reports',
          component: () => import('#/views/app/mate/new-report/index.vue'),
          meta: { hideInMenu: true, title: '汇报' },
        },
        {
          name: 'NewReportAssistantPersonalSettings',
          path: 'report-settings',
          component: () =>
            import('#/views/app/mate/new-report/personal-settings.vue'),
          meta: { hideInMenu: true, title: '个人设置' },
        },
        {
          name: 'AiWorkEmployeeChat',
          path: 'chat',
          component: () => import('#/views/app/mate/ai-work/chat.vue'),
          meta: { hideInMenu: true, title: '数字员工' },
        },
        {
          name: 'TicketEmployeeChat',
          path: 'ticket-chat',
          component: () => import('#/views/app/mate/ticket/ticket-chat.vue'),
          meta: { hideInMenu: true, title: '对话' },
        },
        {
          name: 'FillEmployeeChat',
          path: 'fill-chat',
          component: () => import('#/views/app/mate/fill/fill-chat.vue'),
          meta: { hideInMenu: true, title: '数字员工' },
        },
        {
          name: 'FillMyBills',
          path: 'my-bills',
          component: () => import('#/views/app/mate/fill/my-bills.vue'),
          meta: { hideInMenu: true, title: '我的单据' },
        },
        {
          name: 'TicketTripManagement',
          path: 'trip-management',
          component: () =>
            import('#/views/app/mate/ticket/trip-management.vue'),
          meta: { hideInMenu: true, title: '行程管理' },
        },
        {
          name: 'TicketDispatchWorkbench',
          path: 'dispatch-workbench',
          component: () =>
            import('#/views/app/mate/ticket/management/dispatch-workbench.vue'),
          meta: { hideInMenu: true, title: '调度工作台' },
        },
        {
          name: 'TicketKnowledgeBase',
          path: 'knowledge-base',
          component: () => import('#/views/app/mate/ticket/knowledge-base.vue'),
          meta: { hideInMenu: true, title: '知识库' },
        },
        {
          name: 'TicketInspectionPlans',
          path: 'inspection-plans',
          component: () =>
            import('#/views/app/mate/ticket/inspection-plans.vue'),
          meta: { hideInMenu: true, title: '巡检计划' },
        },
        {
          name: 'TicketInspectionPlanDetail',
          path: 'inspection-plan-detail',
          component: () =>
            import('#/views/app/mate/ticket/inspection-plan-detail.vue'),
          meta: { hideInMenu: true, title: '巡检计划详情' },
        },
        {
          name: 'TicketMyTickets',
          path: 'my-tickets',
          component: () => import('#/views/app/mate/ticket/my-tickets.vue'),
          meta: { hideInMenu: true, title: '我的工单' },
        },
        {
          name: 'TicketMyTrips',
          path: 'my-trips',
          component: () => import('#/views/app/mate/ticket/my-trips.vue'),
          meta: { hideInMenu: true, title: '我的行程' },
        },
        {
          name: 'TicketCenter',
          path: 'ticket-center',
          component: () => import('#/views/app/mate/ticket/ticket-center.vue'),
          meta: { hideInMenu: true, title: '调度中心' },
        },
        {
          name: 'TicketDetail',
          path: 'ticket-detail',
          component: () => import('#/views/app/mate/ticket/ticket-detail.vue'),
          meta: { hideInMenu: true, title: '工单明细' },
        },
        {
          name: 'AiWorkMyWeek',
          path: 'my-week',
          component: () =>
            import('#/views/app/mate/ai-work/assistant/my-week.vue'),
          meta: { hideInMenu: true, title: '我的本周' },
        },
        {
          name: 'AiWorkMyWork',
          path: 'my-work',
          component: () =>
            import('#/views/app/mate/ai-work/assistant/my-work.vue'),
          meta: { hideInMenu: true, title: '我的工作' },
        },
        {
          name: 'AiWorkRecords',
          path: 'work-records',
          component: () =>
            import('#/views/app/mate/next-demo/work-records.vue'),
          meta: { hideInMenu: true, title: '工作记录' },
        },
        {
          name: 'AiWorkMyReport',
          path: 'my-report',
          component: () =>
            import('#/views/app/mate/ai-work/assistant/my-report.vue'),
          meta: { hideInMenu: true, title: '我的周报' },
        },
        {
          name: 'AiWorkReportHistory',
          path: 'report-history',
          component: () =>
            import('#/views/app/mate/ai-work/assistant/report-history.vue'),
          meta: { hideInMenu: true, title: '历史周报' },
        },
        {
          name: 'AiWorkEmployeeReportDetail',
          path: 'report/:reportId',
          component: () =>
            import('#/views/app/mate/ai-work/assistant/report-detail.vue'),
          meta: { hideInMenu: true, title: '周报详情' },
        },
        {
          name: 'AiWorkPendingReview',
          path: 'pending',
          component: () =>
            import('#/views/app/mate/ai-work/review/pending.vue'),
          meta: { hideInMenu: true, title: '待我审核' },
        },
        {
          name: 'AiWorkReviewDetail',
          path: 'report/:reportId',
          component: () =>
            import('#/views/app/mate/ai-work/review/report-detail.vue'),
          meta: { hideInMenu: true, title: '周报审核详情' },
        },
        {
          name: 'AiWorkTeamReports',
          path: 'team-reports',
          component: () =>
            import('#/views/app/mate/ai-work/review/team-reports.vue'),
          meta: { hideInMenu: true, title: '团队周报' },
        },
        {
          name: 'AiWorkFocus',
          path: 'focus',
          component: () => import('#/views/app/mate/ai-work/review/focus.vue'),
          meta: { hideInMenu: true, title: '重点关注' },
        },
        {
          name: 'AiWorkNextWeek',
          path: 'next-week',
          component: () =>
            import('#/views/app/mate/ai-work/review/next-week.vue'),
          meta: { hideInMenu: true, title: '下周计划' },
        },
        {
          name: 'AiWorkTeamInsight',
          path: 'team',
          component: () => import('#/views/app/mate/ai-work/insight/team.vue'),
          meta: { hideInMenu: true, title: '团队洞察' },
        },
        {
          name: 'AiWorkProjects',
          path: 'insight-projects',
          component: () =>
            import('#/views/app/mate/ai-work/insight/projects.vue'),
          meta: { hideInMenu: true, title: '项目洞察' },
        },
        {
          name: 'AiWorkCustomers',
          path: 'customers',
          component: () =>
            import('#/views/app/mate/ai-work/insight/customers.vue'),
          meta: { hideInMenu: true, title: '客户洞察' },
        },
        {
          name: 'AiWorkCustomerDetail',
          path: 'customer/:customerId',
          component: () =>
            import('#/views/app/mate/ai-work/insight/customer-detail.vue'),
          meta: { hideInMenu: true, title: '客户 Context' },
        },
        {
          name: 'AiWorkRisks',
          path: 'risks',
          component: () => import('#/views/app/mate/ai-work/insight/risks.vue'),
          meta: { hideInMenu: true, title: '风险洞察' },
        },
        {
          name: 'ProjectManagementChat',
          path: 'project-chat',
          component: () =>
            import('#/views/app/mate/project-management/project-chat.vue'),
          meta: { hideInMenu: true, title: '项目管理对话' },
        },
        {
          name: 'ProjectAssistantToday',
          path: 'today',
          component: () =>
            import('#/views/app/mate/project-management/executor/today.vue'),
          meta: { hideInMenu: true, title: '今日推进' },
        },
        {
          name: 'ProjectAssistantProjects',
          path: 'projects',
          component: () =>
            import('#/views/app/mate/project-management/projects-workbench.vue'),
          meta: { hideInMenu: true, title: '我的项目' },
        },
        {
          name: 'ProjectAssistantMyGoals',
          path: 'my-goals',
          component: () =>
            import('#/views/app/mate/project-management/executor/my-goals.vue'),
          meta: { hideInMenu: true, title: '我的目标' },
        },
        {
          name: 'ProjectAssistantDeliverables',
          path: 'deliverables',
          component: () =>
            import('#/views/app/mate/project-management/executor/deliverables.vue'),
          meta: { hideInMenu: true, title: '成果物' },
        },
        {
          name: 'PmoAssistantCockpit',
          path: 'cockpit',
          component: () =>
            import('#/views/app/mate/project-management/pmo/cockpit.vue'),
          meta: { hideInMenu: true, title: '管理驾驶舱' },
        },
        {
          name: 'PmoAssistantInitiation',
          path: 'initiation',
          component: () =>
            import('#/views/app/mate/project-management/pmo/initiation.vue'),
          meta: { hideInMenu: true, title: '项目立项' },
        },
        {
          name: 'PmoAssistantPortfolio',
          path: 'portfolio',
          component: () =>
            import('#/views/app/mate/project-management/projects-workbench.vue'),
          meta: { hideInMenu: true, title: '项目' },
        },
        {
          name: 'PmoAssistantRisks',
          path: 'risks',
          component: () =>
            import('#/views/app/mate/project-management/pmo/risks.vue'),
          meta: { hideInMenu: true, title: '风险升级' },
        },
        {
          name: 'ContractAssistantChat',
          path: 'contract-chat',
          component: () =>
            import('#/views/app/mate/contract-assistant/contract-chat.vue'),
          meta: { hideInMenu: true, title: '合同助理' },
        },
        {
          name: 'ContractAssistantArchiveDetail',
          path: 'contract-archives/:archiveId',
          component: () =>
            import('#/views/app/mate/contract-assistant/archive-detail.vue'),
          meta: { hideInMenu: true, title: '合同详情' },
        },
        {
          name: 'ContractAssistantArchives',
          path: 'contract-archives',
          component: () =>
            import('#/views/app/mate/contract-assistant/archives.vue'),
          meta: { hideInMenu: true, title: '合同档案' },
        },
        {
          name: 'PmoAssistantTemplates',
          path: 'templates',
          component: () =>
            import('#/views/app/mate/project-management/pmo/templates.vue'),
          meta: { hideInMenu: true, title: '制度与模板' },
        },
        {
          name: 'SalesAssistantChat',
          path: 'sales-chat',
          component: () =>
            import('#/views/app/mate/sales-management/sales-chat.vue'),
          meta: { hideInMenu: true, title: '销售助理对话' },
        },
        {
          name: 'SalesOpportunities',
          path: 'opportunities',
          component: () =>
            import('#/views/app/mate/sales-management/opportunity-board.vue'),
          meta: { hideInMenu: true, title: '商机' },
        },
        {
          name: 'SalesCustomerFollowup',
          path: 'customer-followup',
          component: () =>
            import('#/views/app/mate/sales-management/customer-followup.vue'),
          meta: { hideInMenu: true, title: '客户跟进' },
        },
        {
          name: 'SalesScope',
          path: 'sales-scope',
          component: () =>
            import('#/views/app/mate/sales-management/sales-scope.vue'),
          meta: { hideInMenu: true, title: '销售范围' },
        },
        {
          name: 'SalesPerformance',
          path: 'sales-performance',
          component: () =>
            import('#/views/app/mate/sales-management/sales-performance.vue'),
          meta: { hideInMenu: true, title: '绩效提成' },
        },
        {
          name: 'SalesOpportunityRegistration',
          path: 'opportunity-registration',
          component: () =>
            import('#/views/app/mate/sales-management/opportunity-registration.vue'),
          meta: { hideInMenu: true, title: '商机报备' },
        },
        {
          name: 'SalesAssistantPolicy',
          path: 'sales-policy',
          component: () =>
            import('#/views/app/mate/sales-management/sales-policy.vue'),
          meta: { hideInMenu: true, title: '销售制度' },
        },
        {
          name: 'ProjectManagementDetail',
          path: 'project/:projectId',
          component: () =>
            import('#/views/app/mate/project-management/project-detail.vue'),
          meta: { hideInMenu: true, title: '项目详情' },
        },
        {
          name: 'MateNextEmployeeChat',
          path: 'new-chat',
          component: () => import('#/views/app/mate/next-demo/chat.vue'),
          meta: { hideInMenu: true, title: '数字员工对话' },
        },
        {
          name: 'MateNextCurrentReport',
          path: 'current-report',
          component: () =>
            import('#/views/app/mate/next-demo/current-report.vue'),
          meta: { hideInMenu: true, title: '本周周报' },
        },
        {
          name: 'MateNextReport',
          path: 'report',
          component: () => import('#/views/app/mate/next-demo/report.vue'),
          meta: { hideInMenu: true, title: '历史周报' },
        },
        {
          name: 'MateNextReportCenter',
          path: 'reports',
          component: () =>
            import('#/views/app/mate/next-demo/report-center.vue'),
          meta: { hideInMenu: true, title: '报告' },
        },
        {
          name: 'MateNextReportWorkspace',
          path: 'reports/:catalogId',
          component: () =>
            import('#/views/app/mate/next-demo/report-workspace.vue'),
          meta: { hideInMenu: true, title: '报告工作区' },
        },
        {
          name: 'MateNextMentions',
          path: 'mentions',
          component: () => import('#/views/app/mate/next-demo/mentions.vue'),
          meta: { hideInMenu: true, title: '我的待办' },
        },
        {
          name: 'MateNextPersonalSettings',
          path: 'personal-settings',
          component: () =>
            import('#/views/app/mate/next-demo/personal-settings.vue'),
          meta: { hideInMenu: true, title: '个人设置' },
        },
        {
          name: 'MateNextReview',
          path: 'review',
          component: () => import('#/views/app/mate/next-demo/review.vue'),
          meta: { hideInMenu: true, title: '审阅中心' },
        },
        {
          name: 'MateNextReviewReport',
          path: 'review-report',
          component: () =>
            import('#/views/app/mate/next-demo/standalone-report.vue'),
          meta: { hideInMenu: true, title: '审阅报告详情' },
        },
        {
          name: 'MateNextFollowUps',
          path: 'follow-ups',
          component: () => import('#/views/app/mate/next-demo/follow-ups.vue'),
          meta: { hideInMenu: true, title: '下周关注' },
        },
        {
          name: 'MateNextApprovalStyle',
          path: 'approval-style',
          component: () =>
            import('#/views/app/mate/next-demo/approval-style.vue'),
          meta: { hideInMenu: true, title: '审批风格' },
        },
        {
          name: 'MateNextReviewSettings',
          path: 'settings',
          component: () =>
            import('#/views/app/mate/next-demo/review-settings.vue'),
          meta: { hideInMenu: true, title: '审核设置' },
        },
        {
          name: 'MateNextEntityManagement',
          path: 'entity-management',
          component: () =>
            import('#/views/app/mate/next-demo/entity-management.vue'),
          meta: { hideInMenu: true, title: '实体管理' },
        },
        {
          name: 'MateNextInsights',
          path: 'insights',
          component: () => import('#/views/app/mate/next-demo/insights.vue'),
          meta: { hideInMenu: true, title: '本周洞察' },
        },
        {
          name: 'MateNextContext',
          path: 'context/:contextId',
          component: () => import('#/views/app/mate/next-demo/context.vue'),
          meta: { hideInMenu: true, title: '事件 Context' },
        },
      ],
    },
    {
      name: 'MateZhijiApps',
      path: 'apps/zhiji',
      component: () => import('#/views/app/mate/zhiji/workspace.vue'),
      redirect: '/app/mate/apps/zhiji/home',
      meta: { hideInMenu: true, title: '知记 · AI 汇报管理' },
      children: [
        {
          name: 'ZhijiHome',
          path: 'home',
          component: () => import('#/views/app/mate/application-home.vue'),
          props: { applicationId: 'zhiji' },
          meta: { hideInMenu: true, title: '知记 · 首页' },
        },
        {
          name: 'ZhijiSchemes',
          path: 'schemes',
          component: () => import('#/views/app/mate/zhiji/schemes.vue'),
          meta: { hideInMenu: true, title: '汇报方案' },
        },
        {
          name: 'ZhijiSchemeEditor',
          path: 'schemes/:id',
          component: () => import('#/views/app/mate/zhiji/scheme-editor.vue'),
          meta: { hideInMenu: true, title: '配置汇报方案' },
        },
        {
          name: 'ZhijiTypes',
          path: 'types',
          component: () => import('#/views/app/mate/zhiji/types.vue'),
          meta: { hideInMenu: true, title: '报告类型' },
        },
        {
          name: 'ZhijiSources',
          path: 'sources',
          component: () => import('#/views/app/mate/zhiji/sources.vue'),
          meta: { hideInMenu: true, title: '数据源' },
        },
        {
          name: 'ZhijiPolicies',
          path: 'policies',
          component: () => import('#/views/app/mate/zhiji/policies.vue'),
          meta: { hideInMenu: true, title: '策略设置' },
        },
      ],
    },
    {
      name: 'MateAiWorkApps',
      path: 'apps/ai-work',
      component: () => import('#/views/app/mate/ai-work/apps-workspace.vue'),
      redirect: '/app/mate/apps/ai-work/weekly-settings',
      meta: { hideInMenu: true, title: 'AI Work 管理' },
      children: [
        {
          name: 'AiWorkCycle',
          path: 'cycle',
          component: () =>
            import('#/views/app/mate/ai-work/management/cycle.vue'),
          meta: { hideInMenu: true, title: '周报周期' },
        },
        {
          name: 'AiWorkTemplate',
          path: 'template',
          component: () =>
            import('#/views/app/mate/ai-work/management/template.vue'),
          meta: { hideInMenu: true, title: '周报模板' },
        },
        {
          name: 'AiWorkReviewRules',
          path: 'review-rules',
          component: () =>
            import('#/views/app/mate/ai-work/management/review-rules.vue'),
          meta: { hideInMenu: true, title: '审核规则' },
        },
        {
          name: 'AiWorkDepartmentPolicy',
          path: 'department-policy',
          component: () =>
            import('#/views/app/mate/ai-work/management/department-policy.vue'),
          meta: { hideInMenu: true, title: '部门分析策略' },
        },
        {
          name: 'AiWorkWeeklySettings',
          path: 'weekly-settings',
          component: () =>
            import('#/views/app/mate/ai-work/management/weekly-settings.vue'),
          meta: { hideInMenu: true, title: '周报设置' },
        },
        {
          name: 'AiWorkExecutions',
          path: 'executions',
          component: () =>
            import('#/views/app/mate/ai-work/management/executions.vue'),
          meta: { hideInMenu: true, title: '执行记录' },
        },
      ],
    },
    {
      name: 'MateSmartTicketApp',
      path: 'apps/smart-ticket',
      component: () =>
        import('#/views/app/mate/ticket/ticket-app-workspace.vue'),
      redirect: '/app/mate/apps/smart-ticket/scenario',
      meta: { hideInMenu: true, title: '知应工单' },
      children: [
        {
          name: 'SmartTicketDevices',
          path: 'devices',
          component: () =>
            import('#/views/app/mate/ticket/management/devices.vue'),
          meta: { hideInMenu: true, title: '设备管理' },
        },
        {
          name: 'SmartTicketOpsStaff',
          path: 'ops-staff',
          component: () =>
            import('#/views/app/mate/ticket/management/ops-staff.vue'),
          meta: { hideInMenu: true, title: '工单运维人员管理' },
        },
        {
          name: 'SmartTicketScenario',
          path: 'scenario',
          component: () =>
            import('#/views/app/mate/ticket/management/scenario.vue'),
          meta: { hideInMenu: true, title: '场景管理' },
        },
        {
          name: 'SmartTicketWizard',
          path: 'wizard',
          component: () =>
            import('#/views/app/mate/ticket/management/wizard.vue'),
          redirect: '/app/mate/apps/smart-ticket/wizard/scenario-description',
          meta: { hideInMenu: true, title: '场景配置向导' },
          children: [
            {
              name: 'SmartTicketWizardDescription',
              path: 'scenario-description',
              component: () =>
                import('#/views/app/mate/ticket/management/scenario-description.vue'),
              meta: { hideInMenu: true, title: '场景描述' },
            },
            {
              name: 'SmartTicketWizardFieldReview',
              path: 'field-review',
              component: () =>
                import('#/views/app/mate/ticket/management/field-review.vue'),
              meta: { hideInMenu: true, title: '单据模型' },
            },
            {
              name: 'SmartTicketWizardDispatchRules',
              path: 'dispatch-rules',
              component: () =>
                import('#/views/app/mate/ticket/management/dispatch-rules.vue'),
              meta: { hideInMenu: true, title: '派单规则' },
            },
            {
              name: 'SmartTicketWizardCustomStatus',
              path: 'custom-status',
              component: () =>
                import('#/views/app/mate/ticket/management/custom-status.vue'),
              meta: { hideInMenu: true, title: '状态流转' },
            },
            {
              name: 'SmartTicketWizardSlaConfig',
              path: 'sla-config',
              component: () =>
                import('#/views/app/mate/ticket/management/sla-config.vue'),
              meta: { hideInMenu: true, title: 'SLA 配置' },
            },
            {
              name: 'SmartTicketWizardTestPublish',
              path: 'test-publish',
              component: () =>
                import('#/views/app/mate/ticket/management/test-publish.vue'),
              meta: { hideInMenu: true, title: '完成发布' },
            },
          ],
        },
        {
          name: 'SmartTicketScenarioDescription',
          path: 'scenario-description',
          component: () =>
            import('#/views/app/mate/ticket/management/scenario-description.vue'),
          meta: { hideInMenu: true, title: '场景描述' },
        },
        {
          name: 'SmartTicketFieldReview',
          path: 'field-review',
          component: () =>
            import('#/views/app/mate/ticket/management/field-review.vue'),
          meta: { hideInMenu: true, title: '单据模型' },
        },
        {
          name: 'SmartTicketDispatchRules',
          path: 'dispatch-rules',
          component: () =>
            import('#/views/app/mate/ticket/management/dispatch-rules.vue'),
          meta: { hideInMenu: true, title: '派单规则' },
        },
        {
          name: 'SmartTicketCustomStatus',
          path: 'custom-status',
          component: () =>
            import('#/views/app/mate/ticket/management/custom-status.vue'),
          meta: { hideInMenu: true, title: '状态流转' },
        },
        {
          name: 'SmartTicketSlaConfig',
          path: 'sla-config',
          component: () =>
            import('#/views/app/mate/ticket/management/sla-config.vue'),
          meta: { hideInMenu: true, title: 'SLA 配置' },
        },
        {
          name: 'SmartTicketTestPublish',
          path: 'test-publish',
          component: () =>
            import('#/views/app/mate/ticket/management/test-publish.vue'),
          meta: { hideInMenu: true, title: '测试发布' },
        },
        {
          name: 'SmartTicketPermissionControl',
          path: 'permission-control',
          component: () =>
            import('#/views/app/mate/ticket/management/permission-control.vue'),
          meta: { hideInMenu: true, title: '权限控制' },
        },
        {
          name: 'SmartTicketOverview',
          path: 'overview',
          component: () =>
            import('#/views/app/mate/ticket/management/overview.vue'),
          meta: { hideInMenu: true, title: '工单概览' },
        },
        {
          name: 'SmartTicketQuery',
          path: 'ticket-query',
          component: () =>
            import('#/views/app/mate/ticket/management/ticket-list.vue'),
          meta: { hideInMenu: true, title: '工单查询' },
        },
        {
          name: 'SmartTicketDocumentParse',
          path: 'document-parse',
          component: () =>
            import('#/views/app/mate/ticket/management/document-parse.vue'),
          meta: { hideInMenu: true, title: '制度文件解析' },
        },
      ],
    },
    {
      name: 'MateSmartContractApp',
      path: 'apps/smart-contract',
      component: () => import('#/views/app/mate/contract-app/workspace.vue'),
      redirect: '/app/mate/apps/smart-contract/schemes',
      meta: { hideInMenu: true, title: '智能合同' },
      children: [
        {
          name: 'SmartContractSchemes',
          path: 'schemes',
          component: () =>
            import('#/views/app/mate/contract-assistant/schemes.vue'),
          meta: { hideInMenu: true, title: '合同类型管理' },
        },
        {
          name: 'SmartContractAuthorization',
          path: 'authorization',
          component: () =>
            import('#/views/app/mate/contract-assistant/authorization.vue'),
          meta: { hideInMenu: true, title: '合同授权管理' },
        },
      ],
    },
    {
      name: 'MateZhangkouFillingApp',
      path: 'apps/zhangkou-filling',
      component: () =>
        import('#/views/app/mate/zhangkou-filling/zhangkou-app-workspace.vue'),
      redirect: '/app/mate/apps/zhangkou-filling/template',
      meta: { hideInMenu: true, title: '账扣核销单请款单数据收集' },
      children: [
        {
          name: 'ZhangkouFillingCycle',
          path: 'cycle',
          component: () =>
            import('#/views/app/mate/zhangkou-filling/management/cycle.vue'),
          meta: { hideInMenu: true, title: '数据上传' },
        },
        {
          name: 'ZhangkouFillingTemplate',
          path: 'template',
          component: () =>
            import('#/views/app/mate/zhangkou-filling/management/template.vue'),
          meta: { hideInMenu: true, title: '发票附件上传' },
        },
        {
          name: 'ZhangkouFillingExecutions',
          path: 'executions',
          component: () =>
            import('#/views/app/mate/zhangkou-filling/management/executions.vue'),
          meta: { hideInMenu: true, title: '执行记录' },
        },
        {
          name: 'ZhangkouFillingUploadRecords',
          path: 'upload-records',
          component: () =>
            import('#/views/app/mate/zhangkou-filling/management/upload-records.vue'),
          meta: { hideInMenu: true, title: '发票附件上传记录' },
        },
      ],
    },
    {
      name: 'ZhiyingSettings',
      path: 'apps/smart-crm/settings/:salesPage',
      component: () => import('#/views/app/mate/new-sales/settings.vue'),
      meta: { hideInMenu: true, title: '知赢 · 销售配置' },
    },
    {
      name: 'ZhiyingHome',
      path: 'apps/smart-crm',
      redirect: '/app/mate/apps/smart-crm/settings/process',
      meta: { hideInMenu: true, title: '知赢 · 销售设置' },
    },
    {
      name: 'ZhiyingTicketHome',
      path: 'apps/smart-ticket/home',
      component: () => import('#/views/app/mate/application-home.vue'),
      props: { applicationId: 'zhiying-ticket' },
      meta: { hideInMenu: true, title: '知应 · 首页' },
    },
    {
      name: 'ZhiyueHome',
      path: 'apps/zhiyue',
      component: () => import('#/views/app/mate/application-home.vue'),
      props: { applicationId: 'zhiyue' },
      meta: { hideInMenu: true, title: '知约 · 首页' },
    },
    {
      name: 'ZhixingHome',
      path: 'apps/zhixing',
      component: () => import('#/views/app/mate/application-home.vue'),
      props: { applicationId: 'zhixing' },
      meta: { hideInMenu: true, title: '知行 · 首页' },
    },
    {
      name: 'MateAppPreview',
      path: 'apps/:appId',
      component: () => import('#/views/app/mate/ai-work/app-preview.vue'),
      meta: { hideInMenu: true, title: '智能应用' },
    },
    {
      name: 'MateFiles',
      path: 'files',
      component: () => import('#/views/app/mate/files.vue'),
      meta: { hideInMenu: true, title: '文件' },
    },
    {
      name: 'MateAutomation',
      path: 'automation',
      component: () => import('#/views/app/mate/automation.vue'),
      meta: { hideInMenu: true, title: '自动化' },
    },
    {
      name: 'MateMessages',
      path: 'messages',
      component: () => import('#/views/app/mate/messages/index.vue'),
      meta: { hideInMenu: true, title: '消息中心' },
    },
  ],
};

const standaloneReportRoute: RouteRecordRaw = {
  name: 'MateStandaloneReport',
  path: '/report-share.html',
  component: () => import('#/views/app/mate/next-demo/standalone-report.vue'),
  meta: {
    hideInBreadcrumb: true,
    hideInMenu: true,
    hideInTab: true,
    ignoreAccess: true,
    title: 'HTML 汇报',
  },
};
// Report review owns its full viewport and deliberately bypasses both app shells.
const standaloneReviewRoute: RouteRecordRaw = {
  name: 'NewReviewAssistantReportDetail',
  path: '/app/mate/employee/:employeeId/report-review-detail',
  component: () => import('#/views/app/mate/new-review/report-detail.vue'),
  meta: {
    hideInBreadcrumb: true,
    hideInMenu: true,
    hideInTab: true,
    ignoreAccess: true,
    title: '报告审核详情',
  },
};
/** 全局404页面 */
const fallbackNotFoundRoute: RouteRecordRaw = {
  component: () => import('#/views/_core/fallback/not-found.vue'),
  meta: {
    hideInBreadcrumb: true,
    hideInMenu: true,
    hideInTab: true,
    title: '404',
  },
  name: 'FallbackNotFound',
  path: '/:path(.*)*',
};

/** 基本路由，这些路由是必须存在的 */
const coreRoutes: RouteRecordRaw[] = [
  /**
   * 根路由
   * 使用基础布局，作为所有页面的父级容器，子级就不必配置BasicLayout。
   * 此路由必须存在，且不应修改
   */
  {
    component: BasicLayout,
    meta: {
      hideInBreadcrumb: true,
      title: 'Root',
    },
    name: 'Root',
    path: '/',
    redirect: preferences.app.defaultHomePath,
    children: [],
  },
  mateAppRoute,
  standaloneReportRoute,
  standaloneReviewRoute,
  {
    component: AuthPageLayout,
    meta: {
      hideInTab: true,
      title: 'Authentication',
    },
    name: 'Authentication',
    path: '/auth',
    redirect: LOGIN_PATH,
    children: [
      {
        name: 'Login',
        path: 'login',
        component: () => import('#/views/_core/authentication/login.vue'),
        meta: {
          title: $t('page.auth.login'),
        },
      },
      {
        name: 'CodeLogin',
        path: 'code-login',
        component: () => import('#/views/_core/authentication/code-login.vue'),
        meta: {
          title: $t('page.auth.codeLogin'),
        },
      },
      {
        name: 'QrCodeLogin',
        path: 'qrcode-login',
        component: () =>
          import('#/views/_core/authentication/qrcode-login.vue'),
        meta: {
          title: $t('page.auth.qrcodeLogin'),
        },
      },
      {
        name: 'ForgetPassword',
        path: 'forget-password',
        component: () =>
          import('#/views/_core/authentication/forget-password.vue'),
        meta: {
          title: $t('page.auth.forgetPassword'),
        },
      },
      {
        name: 'Register',
        path: 'register',
        component: () => import('#/views/_core/authentication/register.vue'),
        meta: {
          title: $t('page.auth.register'),
        },
      },
    ],
  },
  {
    name: 'License',
    path: '/license',
    component: () => import('#/views/_core/license/index.vue'),
    meta: {
      title: '系统授权',
    },
  },
  // Agent Sub-System Routes (独立布局)
  {
    path: '/agent/smart_audit',
    component: () => import('#/layouts/agent/index.vue'),
    meta: { title: '智能审核', hideInMenu: true },
    children: [
      {
        path: '',
        name: 'SmartAuditDashboard',
        component: () => import('#/views/agent/dashboard/index.vue'),
        meta: { title: '介绍', icon: 'lucide:info' },
      },
      {
        name: 'AgentPolicyList',
        path: 'policy',
        component: () => import('#/views/audit/policy/index.vue'),
        meta: { title: '制度列表', icon: 'lucide:library' },
      },
      {
        name: 'AgentPolicyWorkbench',
        path: 'policy/:id',
        component: () => import('#/views/audit/policy/workbench.vue'),
        meta: {
          hideInMenu: true,
          title: '制度编辑器',
          activePath: '/agent/smart_audit/policy',
        },
      },
      {
        name: 'RuleStudio',
        path: 'rule-studio',
        component: () => import('#/views/audit/rule-studio/index.vue'),
        meta: { title: '规则配置', icon: 'lucide:brain-circuit' },
      },
      {
        name: 'RuleSandbox',
        path: 'rule-sandbox',
        component: () => import('#/views/audit/rule-sandbox/index.vue'),
        meta: { title: '规则测试', icon: 'lucide:flask-conical' },
      },
      {
        name: 'SchemeBuilder',
        path: 'scheme-builder',
        component: () => import('#/views/audit/scheme-builder/index.vue'),
        meta: { title: '审核方案', icon: 'lucide:workflow' },
      },
      {
        name: 'AuditPolicyConfig',
        path: 'audit-policy',
        component: () => import('#/views/agent/audit-policy/config.vue'),
        meta: { title: '审核策略', icon: 'lucide:shield-check' },
      },
      {
        name: 'BillQuery',
        path: 'bill-query',
        component: () => import('#/views/agent/bill-query/index.vue'),
        meta: { title: '单据查询', icon: 'lucide:file-search' },
      },
    ],
  },
  {
    path: '/agent/smart_filling',
    component: () => import('#/layouts/agent/index.vue'),
    meta: { title: '智能填报', hideInMenu: true },
    children: [
      {
        path: '',
        name: 'SmartFillingDashboard',
        component: () => import('#/views/agent/dashboard/index.vue'),
        meta: { title: '介绍', icon: 'lucide:info' },
      },
      {
        name: 'FillingTemplateCenter',
        path: 'template',
        component: () => import('#/views/filling/template/index.vue'),
        meta: { title: '模板中心', icon: 'lucide:layout-template' },
      },
      {
        name: 'FillingTemplatePreview',
        path: 'template/preview/:id',
        component: () => import('#/views/filling/template/preview.vue'),
        meta: {
          title: '模板预览',
          hideInMenu: true,
          activePath: '/agent/smart_filling/template',
        },
      },
      {
        name: 'FillingSettings',
        path: 'settings',
        component: () => import('#/views/filling/settings/index.vue'),
        meta: { title: '智能填报设置', icon: 'lucide:settings-2' },
      },
      {
        name: 'FillingSystemConfig',
        path: 'system',
        component: () => import('#/views/filling/system/index.vue'),
        meta: { title: '系统配置', icon: 'lucide:settings', hideInMenu: true },
      },
      {
        name: 'FillingScripts',
        path: 'scripts',
        component: () => import('#/views/filling/scripts/index.vue'),
        meta: { title: '填报规则与脚本', icon: 'lucide:scroll-text' },
      },
      {
        name: 'FillingScriptStudio',
        path: 'scripts/studio',
        component: () => import('#/views/filling/scripts/studio.vue'),
        meta: {
          title: '脚本配置',
          hideInMenu: true,
          activePath: '/agent/smart_filling/scripts',
        },
      },
      {
        name: 'FillingTaskOrchestration',
        path: 'scripts/task-orchestration',
        component: () =>
          import('#/views/filling/scripts/task-orchestration.vue'),
        meta: {
          title: '任务编排',
          hideInMenu: true,
          activePath: '/agent/smart_filling/scripts',
        },
      },
      {
        name: 'FillingStepConfig',
        path: 'scripts/step-config',
        component: () => import('#/views/filling/scripts/step-config.vue'),
        meta: {
          title: '步骤配置',
          hideInMenu: true,
          activePath: '/agent/smart_filling/scripts',
        },
      },
      {
        name: 'FillingRuleConfig',
        path: 'rules',
        component: () => import('#/views/filling/rules/index.vue'),
        meta: {
          title: '规则配置',
          icon: 'lucide:shield-check',
        },
      },
      {
        name: 'FillingTestingSandbox',
        path: 'testing',
        component: () => import('#/views/filling/testing/index.vue'),
        meta: { title: '测试沙箱', icon: 'lucide:flask-conical' },
      },
      {
        name: 'FillingExecutionLogs',
        path: 'execution-logs',
        component: () => import('#/views/filling/execution-logs/index.vue'),
        meta: { title: '填报日志', icon: 'lucide:scroll-text' },
      },
      {
        name: 'FillingExecutorManagement',
        path: 'executors',
        component: () => import('#/views/filling/executors/index.vue'),
        meta: { title: '执行器管理', icon: 'lucide:bot' },
      },
      {
        name: 'FillingExecutionRecords',
        path: 'execution-records',
        component: () => import('#/views/filling/execution-records/index.vue'),
        meta: { title: '执行记录', icon: 'lucide:list-todo' },
      },
    ],
  },
  {
    path: '/agent/smart_classify',
    component: () => import('#/layouts/agent/index.vue'),
    meta: { title: '智能附件分类', hideInMenu: true },
    children: [
      {
        path: '',
        name: 'SmartClassifyDashboard',
        component: () => import('#/views/agent/dashboard/index.vue'),
        meta: { title: '介绍', icon: 'lucide:info' },
      },
      {
        name: 'AttachmentClassificationConfig',
        path: 'config',
        component: () =>
          import('#/views/audit/attachment-classification/index.vue'),
        meta: { title: '分类配置', icon: 'lucide:settings-2' },
      },
      {
        name: 'AttachmentAdjustment',
        path: 'adjustment',
        component: () =>
          import('#/views/audit/attachment-classification/adjustment/index.vue'),
        meta: { title: '分类调整', icon: 'lucide:move' },
      },
      {
        name: 'ClassificationSandbox',
        path: 'sandbox',
        component: () =>
          import('#/views/audit/attachment-classification/sandbox.vue'),
        meta: { title: '测试沙箱', icon: 'lucide:flask-conical' },
      },
    ],
  },
  {
    path: '/smart/smart-filling',
    component: () => import('#/layouts/agent/index.vue'),
    meta: { title: '智能填报', icon: 'lucide:clipboard-typing' },
    redirect: '/agent/smart_filling',
    children: [],
  },
  {
    path: '/agent/data-collection',
    component: () => import('#/layouts/agent/index.vue'),
    meta: { title: '智能采集', hideInMenu: true },
    children: [
      {
        path: '',
        name: 'DataCollectionDashboard',
        component: () => import('#/views/agent/dashboard/index.vue'),
        meta: { title: '介绍', icon: 'lucide:info' },
      },
      {
        name: 'DataCollectionTasks',
        path: 'tasks',
        component: () =>
          import('#/views/smart/data-collection/tasks/index.vue'),
        meta: { title: '采集任务', icon: 'lucide:calendar-clock' },
      },
      {
        name: 'DataCollectionQuery',
        path: 'query',
        component: () =>
          import('#/views/smart/data-collection/query/index.vue'),
        meta: { title: '数据查询', icon: 'lucide:database' },
      },
    ],
  },
  {
    path: '/agent/smart_compliance',
    component: () => import('#/layouts/agent/index.vue'),
    meta: { title: '智能报告', hideInMenu: true },
    children: [
      {
        path: '',
        name: 'SmartComplianceDashboard',
        component: () => import('#/views/agent/dashboard/index.vue'),
        meta: { title: '介绍', icon: 'lucide:info' },
      },
    ],
  },
];

export { coreRoutes, fallbackNotFoundRoute };
