# AI Work Demo 实施计划

## 阶段 1：路由与 Mate 壳层

1. 将 `/app/mate` 默认入口切换到周报助理聊天。
2. 增加三名员工的路由化业务页面。
3. 在一级侧栏加入“应用”，位置在“数字员工”和“文件”之间。
4. 增加智能应用中心二级列表和 AI Work 五个三级管理路由。
5. 保留旧 `/app/mate/employee/:employeeId` 的兼容重定向。

## 阶段 2：类型、Mock 与共享状态

1. 新建 `types/ai-work.ts`，定义周报、记录、风险、Evidence、应用和场景类型。
2. 新建 `api/mock-data-ai-work.ts`，提供张三—客户 B—华达主故事数据。
3. 新建 `store/ai-work-demo.ts`，用 Pinia 管理跨角色状态和 `sessionStorage` 持久化。
4. 提供生成草稿、加入工作、补充延期、提交、审核、重点关注和重置动作。
5. 将 Mate 可见员工替换为周报助理、周报审核、周报分析，并为每名员工配置独立菜单。

## 阶段 3：共享 AI Work 组件

1. 员工工作区布局与路由化胶囊菜单。
2. Action、Insight、Question、Deep Link 四类消息卡。
3. Evidence Chain 抽屉。
4. Ask AI 按钮与 Context 跳转。
5. 演示流程抽屉和一键重置。
6. KPI、状态标签、时间线和风险卡等共享业务组件。

## 阶段 4：员工、主管与洞察页面

1. 周报助理聊天首页、我的本周、我的周报三个 P0。
2. 周报审核聊天首页、待我审核、审核详情三个 P0。
3. 团队洞察、华达客户 Context 两个 P0。
4. 工作记录、历史周报、团队周报、重点关注、项目/客户列表、风险洞察按 P1 标准实现。
5. 串联八场景状态变化和关键词聊天 Mock。

## 阶段 5：应用中心与管理页面

1. 从 `matedemo/index.html` 迁移应用中心布局，并复用三个真实应用图标。
2. 应用目录显示 AI Work、智能 CRM、票N 发票验真。
3. 完成周报周期和部门分析策略两个 P0。
4. 完成周报模板、审核规则、执行记录三个 P1。

## 阶段 6：验证

1. 定向 ESLint、Stylelint 和格式检查。
2. `@vben/web-antd` production build。
3. 过滤类型检查，确保不新增 Mate/AI Work 错误。
4. 在 1912×914、1280×800 下执行核心交互回归。
5. 对照 WiseAI 员工页和 matedemo 应用中心截图修正可见差异。
6. 更新 `design-qa.md` 并提交最终实现。
