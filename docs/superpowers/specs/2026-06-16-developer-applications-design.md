# 开发者申请原型页面 — 设计文档

- 日期: 2026-06-16
- 模块: 运营平台 (Platform) → 开发者申请
- 类型: 纯前端 Demo(内存 Mock 数据,无后端)

## 1. 目标与范围

在运营平台菜单下新增「开发者申请」页面,用于运营/管理员审核开发者提交的原型访问申请。

功能范围:

1. **列表查询页**:按处理状态、申请日期范围筛选;展示申请人、申请时间、手机号、邮箱、技术方向、处理状态;操作列提供查看详情、处理 / 查看处理结果。
2. **查看详情**(右侧抽屉):展示申请全部信息,GitHub/GitLab 主页渲染为外链。
3. **查看处理结果**(弹窗):只读渲染富文本处理结果。
4. **申请处理**(弹窗):选择 通过/不通过 + 富文本编辑处理结果,提交后更新记录状态。

## 2. 关键技术决策

| 决策项 | 选择 | 理由 |
| --- | --- | --- |
| 富文本编辑器 | `@wangeditor/editor` + `@wangeditor/editor-for-vue` | Vue 3 友好、中文后台常用、输出 HTML 可直接 `v-html` 渲染。仓库当前未安装任何富文本编辑器。 |
| 菜单归属 | 运营平台 (Platform) 菜单 | 与现有 operations 下其它页面同处,符合「在 operations 下」的要求。 |
| 详情呈现 | 右侧抽屉 Drawer | 与 `service-logs` 详情抽屉风格一致。 |
| Modal/Drawer 实现 | 直接使用 ant-design-vue 的 `Modal`/`Drawer` | 项目内 operations/audit 模块均未使用 VbenModal,保持一致。 |
| Mock 数据位置 | 内联在 `api/developer-application.ts`,复用 `mock-data.ts` 的 `createMockResponse`/`mockDelay` | 与近期新增模块(`developer-home`、`service-log`)一致;`CLAUDE.md` 建议 centralize,但近期实际代码以内联为准,这里跟随实际惯例。 |

## 3. 数据模型

`apps/web-antd/src/types/developer-application.ts`:

```ts
// 处理状态
export type ApplicationStatus = 'pending' | 'processed'; // 未处理 / 已处理
// 处理结果(已处理时)
export type ProcessResult = 'approved' | 'rejected'; // 通过 / 不通过

export interface DeveloperApplication {
  id: string;
  applicantName: string; // 申请人
  applyTime: string; // 申请时间 ISO
  phone: string; // 手机号
  email: string; // 邮箱
  techDirection: string; // 技术方向
  purpose: string; // 申请目的
  githubUrl?: string; // GitHub 主页(可选)
  gitlabUrl?: string; // GitLab 主页(可选)
  status: ApplicationStatus;
  processResult?: ProcessResult; // 通过/不通过(已处理时)
  processDetail?: string; // 处理结果富文本 HTML(已处理时)
  processedAt?: string; // 处理时间 ISO
  processedBy?: string; // 处理人
  createdAt: string;
  updatedAt: string;
}

export interface DeveloperApplicationQueryParams {
  page: number;
  pageSize: number;
  status?: 'all' | 'pending' | 'processed'; // 默认 pending
  startDate?: string; // 申请日期起(YYYY-MM-DD)
  endDate?: string; // 申请日期止(YYYY-MM-DD)
}

export interface DeveloperApplicationListResult {
  items: DeveloperApplication[];
  total: number;
}
```

## 4. API 与 Mock 数据

`apps/web-antd/src/api/developer-application.ts`,内联 Mock 数组 + 以下函数(均 `await mockDelay()` + `createMockResponse(...)`):

- `getDeveloperApplicationsApi(params)`:支持 status / startDate / endDate 过滤 + 分页,返回 `{ items, total }`。
- `getDeveloperApplicationApi(id)`:取单条详情。
- `processDeveloperApplicationApi(id, { processResult, processDetail })`:更新对应记录为 processed(置 `status='processed'`、写 `processResult`、`processDetail`、`processedAt=now`、`processedBy='运营管理员'`、`updatedAt=now`)。

种子数据:约 10 条,`pending`/`processed` 混合;processed 中含通过与不通过;部分记录带 `githubUrl`/`gitlabUrl`;申请日期分散在近 2 个月内。

> 说明:Demo 场景下 CRUD 在内存数组上操作,刷新页面数据重置,符合项目 Mock 策略。

## 5. 路由

编辑 `apps/web-antd/src/router/routes/modules/platform.ts`,在 Platform children 末尾追加:

```ts
{
  name: 'DeveloperApplications',
  path: '/platform/developer-applications',
  component: () => import('#/views/operations/developer-applications/index.vue'),
  meta: { icon: 'lucide:user-cog', title: '开发者申请' },
},
```

## 6. 页面与组件结构

```
apps/web-antd/src/views/operations/developer-applications/
├── index.vue                       # 列表查询页
├── components/
│   └── RichTextEditor.vue          # WangEditor 封装(v-model: html)
└── modals/
    ├── detail-drawer.vue           # 查看详情(右侧 Drawer)
    ├── process-modal.vue           # 申请处理(Modal)
    └── result-modal.vue            # 查看处理结果(Modal,只读)
```

### 6.1 列表页 `index.vue`

镜像 `views/operations/service-logs/index.vue` 的三段式布局:顶部固定标题/描述 → 筛选条件卡 → 结果表格。

- **筛选条件**
  - 处理状态 `Select`:全部 / 未处理 / 已处理,默认 **未处理**。
  - 申请日期 `DatePicker.RangePicker`(`format="YYYY-MM-DD"`,仅日期);选值后写入 `startDate`/`endDate`。
  - 重置 / 搜索 按钮。
- **表格列**
  1. 申请人 `applicantName`
  2. 申请时间 `applyTime`(`zh-CN` 本地化)
  3. 手机号 `phone`
  4. 邮箱 `email`
  5. 技术方向 `techDirection`
  6. 处理状态:未处理 → 灰色 Tag;已处理 → 蓝色 Tag + 通过(绿)/不通过(红)小标。
  7. 操作(固定右侧)
- **操作列逻辑**
  - `查看详情`:始终显示 → 打开 `detail-drawer`。
  - `处理`:仅 `status === 'pending'` 显示 → 打开 `process-modal`。
  - `查看处理结果`:仅 `status === 'processed'` 显示 → 打开 `result-modal`。
- 分页与 service-logs 一致(`showSizeChanger`、`showTotal`、`pageSizeOptions`)。

### 6.2 WangEditor 封装 `components/RichTextEditor.vue`

- `defineProps<{ modelValue: string }>()` + `update:modelValue`。
- 模板使用 `@wangeditor/editor-for-vue` 的 `<Toolbar>` + `<Editor>`。
- `onMounted` 创建 editor 实例并设初始 HTML;`onBeforeUnmount` 调用 `editor.destroy()` 防止内存泄漏。
- 导入样式 `@wangeditor/editor/dist/css/style.css`。
- 容器加边框/最小高度,贴合 antd 表单外观。

### 6.3 详情抽屉 `modals/detail-drawer.vue`

- 右侧 `Drawer`(`placement="right"`,`:width="640"`)。
- `props: { open, application }`;`emits: ['update:open']`。
- 展示字段:申请人、申请时间、手机号、邮箱、技术方向、申请目的、(GitHub/GitLab 主页)。
- `githubUrl`/`gitlabUrl` 有值时渲染为 `<a :href target="_blank">` 外链,无值显示「-」。
- 复用 antd `Descriptions` 或 label/值列表布局。

### 6.4 处理弹窗 `modals/process-modal.vue`

- `Modal`(`:width="720"`,`ok-text="提交处理"`,`cancel-text="取消"`,`:confirm-loading`)。
- `props: { open, application }`;`emits: ['update:open', 'success']`。
- `watch(open)` 为 true 时重置表单。
- 表单(antd `Form` + `Form.Item`,`layout="vertical"`):
  - 处理结果状态:`Radio.Group`(通过 `approved` / 不通过 `rejected`),默认通过,必填。
  - 处理结果:`RichTextEditor`(v-model 绑定 `processDetail`),必填(非空 HTML 校验)。
- `@ok`:校验 → `processDeveloperApplicationApi(application.id, { processResult, processDetail })` → `message.success('处理成功')` → `emit('success')` → 关闭。

### 6.5 查看处理结果弹窗 `modals/result-modal.vue`

- `Modal`(`:width="720"`,`:footer="null"`)。
- `props: { open, application }`;`emits: ['update:open']`。
- 顶部展示处理状态 Tag(通过绿/不通过红)+ 处理时间。
- 主体 `<div v-html="application.processDetail" class="rich-text-view" />` 渲染富文本。

## 7. 组件导入与样式规范(遵循 CLAUDE.md)

- 所有 antd 组件从 `ant-design-vue` 显式 `import`,模板用 PascalCase。
- 布局优先 Tailwind 类名;富文本渲染区在 `<style scoped>` 内做基础排版兜底(标题、列表、链接、代码块)。
- 仅中文,无 i18n。

## 8. 文件清单(改动总览)

新增:
- `apps/web-antd/src/types/developer-application.ts`
- `apps/web-antd/src/api/developer-application.ts`
- `apps/web-antd/src/views/operations/developer-applications/index.vue`
- `apps/web-antd/src/views/operations/developer-applications/components/RichTextEditor.vue`
- `apps/web-antd/src/views/operations/developer-applications/modals/detail-drawer.vue`
- `apps/web-antd/src/views/operations/developer-applications/modals/process-modal.vue`
- `apps/web-antd/src/views/operations/developer-applications/modals/result-modal.vue`

修改:
- `apps/web-antd/src/router/routes/modules/platform.ts`(新增路由)
- `apps/web-antd/package.json`(新增 `@wangeditor/editor`、`@wangeditor/editor-for-vue` 依赖,需 `pnpm install`)

## 9. 验证清单

- [ ] 依赖安装后 dev 启动无报错,菜单出现「开发者申请」。
- [ ] 默认筛选为「未处理」,仅列未处理记录。
- [ ] 全部/未处理/已处理切换、日期范围筛选、分页均生效。
- [ ] 未处理行:显示「查看详情」「处理」;已处理行:显示「查看详情」「查看处理结果」。
- [ ] 详情抽屉展示全部字段,GitHub/GitLab 为可点击外链。
- [ ] 处理弹窗:状态默认通过、富文本必填校验;提交后列表中该行变为已处理、操作列切换、处理结果可回看。
- [ ] 查看处理结果弹窗正确渲染富文本。
- [ ] `pnpm check:type` 通过。
