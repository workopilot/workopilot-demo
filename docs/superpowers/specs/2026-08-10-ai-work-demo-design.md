# WorkoPilot AI Work Demo 设计规格

## 1. 背景与目标

本规格在现有 `/app/mate` 普通用户端中新增 AI Work 业务域。AI Work 不是独立的“AI 周报系统”，而是由三个具有连续工作记忆的数字员工组成：

- 周报助理：面向员工，整理工作、补充信息、生成并提交周报。
- 周报审核：面向直属主管，优先发现值得关注、追问和支持的事项。
- 周报分析：面向部门负责人和管理者，形成团队、项目、客户和风险洞察。

管理员通过“应用 → AI Work”进入配置控制台。Demo 的核心价值是让用户看到同一条数据链跨角色连续流动：

```text
Work Record
→ Work Context
→ 员工周报
→ 主管审核
→ Work Memory
→ 团队/客户 Insight
→ Evidence
→ Action
```

## 2. 已确认范围

### 2.1 P0 高保真页面

1. 周报助理聊天首页。
2. 我的本周。
3. 我的周报。
4. 周报审核聊天首页。
5. 待我审核。
6. 周报审核详情。
7. 团队洞察。
8. 华达客户 Context Detail。
9. 周报周期。
10. 部门分析策略。

### 2.2 P1 轻量功能页面

- 工作记录与工作记录详情。
- 历史周报。
- 团队周报。
- 重点关注。
- 项目列表与轻量项目详情。
- 客户列表。
- 风险洞察。
- 周报模板。
- 审核规则。
- 执行记录。

P1 页面必须具有真实 Mock 数据、基本筛选或状态切换、关键详情抽屉、Evidence 或 Ask AI 入口，不实现复杂 CRUD。

### 2.3 不在范围内

- 真实后端、数据库、登录权限和组织架构服务。
- 真实大模型调用。
- 完整移动端业务流程。
- 复杂 BI、报表配置器和管理后台级 CRUD。
- 附件上传、语音通话等真实外部能力。

## 3. 产品信息架构

### 3.1 一级侧栏

保持 WorkoPilot 平台结构，顺序固定为：

```text
工作台
数字员工
应用
文件
自动化
```

“应用”位于“数字员工”之后、“文件”之前。Pharma Logo 仍然返回工作台。

### 3.2 数字员工

当前可见员工替换为：

```text
周报助理
周报审核
周报分析
```

三个员工拥有不同的顶部胶囊菜单：

```text
周报助理
├─ 数字员工（聊天）
├─ 我的本周
├─ 工作记录
├─ 我的周报
└─ 历史周报

周报审核
├─ 数字员工（聊天）
├─ 待我审核
├─ 团队周报
└─ 重点关注

周报分析
├─ 数字员工（聊天）
├─ 团队洞察
├─ 项目洞察
├─ 客户洞察
└─ 风险洞察
```

菜单必须路由化，不使用仅存在于组件内的 `activeMenuKey` 作为最终页面状态。

### 3.3 应用中心

“应用”参考 `E:\work\AI\aidemo\wkClient\matedemo\index.html` 和用户提供的应用中心截图迁移，采用：

```text
64px 一级侧栏
→ 256px 智能应用中心
→ 240px 应用功能栏
→ 主内容区
```

二级应用目录只展示三个代表应用：

- AI Work，默认选中。
- 智能 CRM。
- 票N 发票验真。

AI Work 是管理员配置入口，三级菜单为：

```text
周报周期（默认）
周报模板
审核规则
部门分析策略
执行记录
```

三个数字员工仍从“数字员工”进入，不在应用中心重复设置启动页。

## 4. 路由设计

`/app/mate` 默认重定向至周报助理聊天首页。

```text
/app/mate/employee/weekly-assistant/chat
/app/mate/employee/weekly-assistant/my-week
/app/mate/employee/weekly-assistant/work-records
/app/mate/employee/weekly-assistant/my-report
/app/mate/employee/weekly-assistant/report-history

/app/mate/employee/weekly-review/chat
/app/mate/employee/weekly-review/pending
/app/mate/employee/weekly-review/report/:reportId
/app/mate/employee/weekly-review/team-reports
/app/mate/employee/weekly-review/focus

/app/mate/employee/weekly-analysis/chat
/app/mate/employee/weekly-analysis/team
/app/mate/employee/weekly-analysis/projects
/app/mate/employee/weekly-analysis/customers
/app/mate/employee/weekly-analysis/customer/:customerId
/app/mate/employee/weekly-analysis/risks

/app/mate/apps/ai-work/cycle
/app/mate/apps/ai-work/template
/app/mate/apps/ai-work/review-rules
/app/mate/apps/ai-work/department-policy
/app/mate/apps/ai-work/executions
```

AI Deep Link 和页面反向 Ask AI 必须使用这些可刷新、可复制的 URL。

## 5. 视觉与布局

### 5.1 设计语言

- 延续现有 WiseAI/Mate 的低饱和灰绿色背景、深绿色选中态和紧凑企业应用密度。
- 不新建另一套通用后台视觉，不使用装饰性渐变、Emoji 或占位图片替代真实资产。
- 头像、AI Work 应用图标和 Pharma Logo 使用真实静态资源。
- 主要验收视口为 1912×914；1280px 宽度保持可用；平板进行布局降级，不承诺完整移动端流程。

### 5.2 聊天页

复用现有员工聊天框架：顶部员工工具栏，下方为 308px 对话历史和聊天工作区。三名员工均禁止空白首屏：

- 周报助理显示 18 条工作记录、当前草稿状态、遗漏和上周承诺。
- 周报审核显示团队提交、未提交、重点关注和风险提醒。
- 周报分析显示团队工作量、重点项目、重点客户和风险概览。

消息支持 Action Card、Insight Card、Question Card 和 Deep Link。

### 5.3 我的本周

- 顶部显示周次、日期和工作完整度、工作记录、关联项目、关联客户四个 KPI。
- 正文使用 8/4 栅格：左侧为 AI 本周摘要和工作时间线，右侧为 AI 发现、上周承诺和周报状态。
- 主要操作是“生成/继续完善周报”。

### 5.4 我的周报

- 使用 70/30 布局。
- 左侧是结构化周报内容，每个 Work Item 显示客户、项目、结果和 Evidence 数量。
- 右侧是 AI Review Panel，显示工作完整度、遗漏、上周承诺和 AI 操作。
- 底部固定保存草稿和提交周报。

### 5.5 待我审核与审核详情

- 待我审核顶部显示待审核、重点关注、未提交、已审核四个 KPI。
- 列表按高风险、需要管理支持、连续延期、普通周报排序。
- 审核详情使用 65/35 布局。左侧为周报正文，右侧为 AI Management Review。
- 底部固定通过、退回补充、标记重点关注；退回必须填写原因。

### 5.6 团队洞察

顶部六个 KPI，正文包括 AI 部门总结、重点项目、重点客户、重点风险和最近四周趋势。趋势只使用轻量图表。

### 5.7 华达客户 Context

页面包括客户状态与指标、AI 摘要、工作时间线、相关项目、相关员工、相关周报、当前问题、历史风险、Evidence Chain 和“问 AI 这个客户”。该页面是八场景故事的最终落点。

### 5.8 AI Work 管理

- 周报周期 P0：周期、草稿生成、提交截止、提醒、初步分析、正式分析。
- 部门分析策略 P0：策略列表、基础信息、关注维度、判断规则、输出要求和自定义补充。
- 周报模板、审核规则、执行记录按 P1 标准实现。

## 6. 数据与状态模型

Demo 状态保存到 `sessionStorage`，跨路由和刷新保留；关闭浏览器会话或点击“重置演示”后回到初始状态。

核心状态包括：

```text
WeeklyReportStatus = DRAFT | SUBMITTED | RETURNED | APPROVED | ARCHIVED
WorkCompleteness = 76 → 82 → 93
CustomerBRisk = 未确认 → 已补充延期原因 → 延期到下周三
HuadaAttention = 正常 → 需要关注 → 重点关注 → 已处理
```

“工作完整度”只表示信息质量，不作为绩效分数或人员排名。

## 7. 八场景演示链

1. 员工打开周报助理，AI 显示已整理 18 条工作记录。
2. 用户生成 Draft，AI 同时发现三项可能遗漏工作。
3. 用户将华达打印问题加入周报。
4. AI 检查上周承诺，用户补充客户 B 延期原因和新完成日期，完整度提升至 93%。
5. 员工确认提交，周报状态变为 `SUBMITTED`。
6. 主管进入周报审核，张三成为风险优先首项。
7. 主管通过并标记重点关注，团队洞察和华达客户 Context 同步更新。
8. 周报分析打开华达客户详情，展示完整 Evidence Chain。

一级侧栏底部提供演示流程抽屉，支持上一步、下一步、跳转场景和重置演示；该工具默认收起，不破坏正常产品感。

## 8. AI 交互模型

### 8.1 消息卡

```text
Action Card
- 加入周报
- 查看记录
- 忽略

Insight Card
- 风险类型
- 业务对象
- 持续时间
- 查看证据

Question Card
- AI 追问
- 快捷答案
- 补充说明

Deep Link
- 目标路由
- 路由参数
- 当前 Context
```

### 8.2 Chat Mock

- 快捷操作保证主故事稳定演示。
- 自由输入按“生成周报”“客户 B”“延期”“华达”“风险”等关键词匹配脚本。
- 未命中关键词时返回明确的 Demo 通用回复和建议操作，不伪装成真实模型推理。

### 8.3 页面反向 Ask AI

业务页面通过 Ask AI 将 `currentPage`、业务对象 ID 和时间范围写入 Context，然后跳转到对应数字员工聊天页。

## 9. Evidence Chain

统一抽屉按时间顺序展示：

```text
第 31 周承诺
→ 第 32 周工作记录
→ 延期原因补充
→ 周报引用
→ 主管审核结论
→ 团队/客户 Insight
```

每个节点包含来源、时间、原文摘要和“打开来源”操作。缺失来源时展示明确空状态，不生成虚假文件或记录。

## 10. 组件与数据边界

### 10.1 页面目录

```text
views/app/mate/ai-work/
├─ assistant/
├─ review/
├─ insight/
├─ management/
└─ components/
```

P0 页面使用独立 Vue 组件。现有 `employee-chat.vue` 只保留聊天编排职责，不继续承载业务页面。

### 10.2 共享组件

```text
ai-action-card.vue
ai-insight-card.vue
ai-question-card.vue
ai-deep-link.vue
evidence-chain-drawer.vue
ask-ai-button.vue
demo-story-drawer.vue
```

消息类型使用可区分联合类型，不通过员工 ID 在模板中堆叠条件判断。

### 10.3 数据层

```text
types/ai-work.ts
api/mock-data-ai-work.ts
api/ai-work.ts
stores/ai-work-demo.ts
```

- `mock-data-ai-work.ts` 提供不可变初始数据。
- `ai-work.ts` 提供模拟延迟和统一响应。
- Store 管理跨角色状态、场景进度、持久化和重置。
- 三个员工分别配置菜单和会话，不共享同一个可变菜单数组。

## 11. 错误与边界状态

- 无效员工、菜单或业务对象参数回到对应员工默认聊天页，并给出提示。
- 缺失数据展示空状态，禁止白屏。
- 已提交周报不能重复提交；已审核周报不能再次审核。
- 退回后周报回到可编辑状态并保存退回原因。
- Mock 请求失败时保留当前页面数据并提供重试。
- 重置演示前二次确认，重置后清空 `sessionStorage` 并返回 Scene 01。

## 12. 验收标准

### 12.1 功能

- 三名数字员工及其路由化胶囊菜单可用。
- 应用中心显示三个代表应用，AI Work 默认选中且五个管理菜单可访问。
- 八场景从初始状态完整走通。
- 工作完整度、提交、审核、重点关注和洞察状态跨角色同步。
- Evidence Chain 和页面反向 Ask AI 可用。
- 演示流程抽屉和一键重置可用。

### 12.2 视觉与可访问性

- 1912×914 下与 WiseAI、matedemo 参考图完成同视口对比。
- 1280px 下无页面级横向溢出，主要操作保持可用。
- 70/30、65/35 页面保持清晰层级。
- 所有图片使用真实资产，图标统一使用 Iconify/Lucide。
- 图标按钮具有可访问名称，核心操作支持键盘焦点。

### 12.3 工程

- Mate/AI Work 相关 ESLint、Stylelint 通过。
- `@vben/web-antd` production build 通过。
- 不新增 Mate/AI Work 类型错误。
- 浏览器控制台无运行时错误。

## 13. 决策记录

- 采用路由化模块架构，不采用单组件动态面板或独立微应用。
- 10 个 P0 高保真，P1 轻量可用，不实现 21 页全量高保真。
- 使用三个 AI Work 数字员工替换当前可见员工。
- 默认进入周报助理聊天页。
- 使用顶部胶囊菜单和全宽业务工作区。
- 高保真 Context 选择华达客户，而不是同时实现项目和客户两个详情。
- 使用会话级持久化、一键重置和演示流程抽屉。
- Chat 使用脚本快捷动作和关键词响应。
- 主故事数据完整跨角色联动。
- Evidence 使用统一链路抽屉。
- 一级菜单新增“应用”，应用中心只展示三个代表应用。
- AI Work 应用进入五项管理配置，不作为三个员工的重复启动页。
