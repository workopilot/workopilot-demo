# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 开发前必读

开始新增功能、页面设计或修改、交互实现、Mock 数据开发前，必须先完整阅读根目录 [AGENTS.md](AGENTS.md) 和 [喔壳 Demo 开发规范](docs/Demo开发规范.md)。完整开发规范统一维护在 `docs/Demo开发规范.md`；下文历史说明与其不一致时，以当前用户要求及该规范为依据，按本次任务范围执行。

## 项目概述

这是一个基于 **Vben Admin 5.0** 的智能审核管理后台 Demo 项目。项目使用 Vue 3 + Vite + TypeScript + Ant Design Vue 技术栈,采用 Monorepo 架构管理。

**核心特点:**

- **仅前端 Demo**: 无需实现真实后端,所有数据通过 写在相关的mock-data.ts 中 # 前端 Mock 数据
- **单语言**: 仅支持中文,无需多语言配置
- **UI 组件库**: 使用 Ant Design Vue,优先使用 Vben 封装的组件(VbenForm、VbenModal、VbenTable)
- **工作目录**: 主要开发工作在 `vue-vben-admin/apps/web-antd/` 应用中进行

## 项目结构

### 1.2 目录结构

```
vue-vben-admin/apps/web-antd/
├── src/
│   ├── api/                    # API 接口定义
│   │   ├── settings.ts        # 设置相关 API
│   │   └── mock-data.ts       # 前端 Mock 数据
│   ├── views/                  # 页面组件
│   │   └── audit/             # 审核模块
│   │       ├── settings/      # 基础设置
│   │       │   ├── index.vue           # 主页面
│   │       │   ├── components/         # 页面组件
│   │       │   └── modals/            # 弹窗组件
│   │       └── history/       # 审核历史
│   ├── router/                # 路由配置
│   │   └── routes/modules/   # 模块路由
│   ├── types/                 # TypeScript 类型定义
│   └── locales/               # 国际化文件(仅中文)
```

## 二、组件开发规范

### 2.1 Ant Design Vue 组件导入

**重要**: 必须显式导入所有使用的 Ant Design 组件,否则会导致组件无样式!

#### ❌ 错误示例

```vue
<script setup lang="ts">
import { message } from 'ant-design-vue'; // 只导入了 message
</script>

<template>
  <a-button type="primary">点击</a-button>
  <!-- 按钮无样式! -->
  <a-tag>标签</a-tag>
  <!-- 标签无样式! -->
</template>
```

#### ✅ 正确示例

```vue
<script setup lang="ts">
import { Button, message, Tag } from 'ant-design-vue'; // 导入所有使用的组件
</script>

<template>
  <Button type="primary">点击</Button>
  <!-- 样式正常 -->
  <Tag>标签</Tag>
  <!-- 样式正常 -->
</template>
```

### 2.2 常用组件导入清单

```typescript
// 基础组件
import { Button, Card, Tag, Space } from 'ant-design-vue';

// 表单相关
import { Form, Input, Select, Switch, Radio } from 'ant-design-vue';

// 数据展示
import { Table, Tree, Descriptions, Tabs } from 'ant-design-vue';

// 反馈组件
import { message, Modal, Popconfirm, Spin } from 'ant-design-vue';
```

### 2.3 组件使用规范

1. **使用 PascalCase 命名**: 导入的组件使用 PascalCase,不使用 `a-` 前缀

   ```vue
   <Button>按钮</Button>
   <!-- ✅ 正确 -->
   <a-button>按钮</a-button>
   <!-- ❌ 错误,会导致无样式 -->
   ```

2. **优先使用 Vben 封装组件** (如果可用):
   - `VbenForm`: 动态表单
   - `VbenModal`: 弹窗
   - `VbenTable`: 高级表格
   - 参考: `packages/@core/ui-kit/` 和 `packages/effects/common-ui/`

3. **图标使用**:

   ```vue
   <script setup>
   import { Icon } from '@iconify/vue';
   </script>

   <template>
     <Icon icon="lucide:plus" class="size-4" />
   </template>
   ```

## 三、数据管理规范

### 3.1 Mock 数据策略

**采用前端 Mock 数据方式,无需后端 Mock 服务器**

#### 数据存放位置

```
src/api/mock-data.ts       # 所有 Mock 数据的统一定义
```

#### Mock 数据结构

```typescript
// mock-data.ts
import type { SourceSystem } from '#/types/settings';

// 定义 Mock 数据
export const mockSourceSystems: SourceSystem[] = [
  {
    id: '1',
    name: 'SAP Fiori',
    code: 'sap_fiori_hq',
    vendor: 'SAP',
    // ...
  },
];

// 模拟异步延迟
export function mockDelay(ms: number = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 生成统一响应格式
export function createMockResponse<T>(data: T) {
  return {
    code: 0,
    data,
    message: 'success',
  };
}
```

### 3.2 API 函数定义

```typescript
// settings.ts
import { createMockResponse, mockDelay, mockSourceSystems } from './mock-data';

// GET 请求
export async function getSourceSystemsApi() {
  await mockDelay(); // 模拟网络延迟
  return createMockResponse(mockSourceSystems);
}

// POST 请求
export async function createSourceSystemApi(data: Partial<SourceSystem>) {
  await mockDelay();
  const newSystem: SourceSystem = {
    id: String(Date.now()),
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockSourceSystems.push(newSystem);
  return createMockResponse(newSystem);
}

// PUT 请求
export async function updateSourceSystemApi(
  id: string,
  data: Partial<SourceSystem>,
) {
  await mockDelay();
  const index = mockSourceSystems.findIndex((s) => s.id === id);
  if (index !== -1) {
    mockSourceSystems[index] = {
      ...mockSourceSystems[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return createMockResponse(mockSourceSystems[index]);
  }
  throw new Error('系统不存在');
}

// DELETE 请求
export async function deleteSourceSystemApi(id: string) {
  await mockDelay();
  const index = mockSourceSystems.findIndex((s) => s.id === id);
  if (index !== -1) {
    mockSourceSystems.splice(index, 1);
  }
  return createMockResponse(undefined);
}
```

### 3.3 数据特点

- ✅ 数据在内存中持久化(浏览器会话期间)
- ✅ 支持完整的 CRUD 操作
- ✅ 刷新页面会重置数据
- ✅ 无需后端服务,开发更简单
- ✅ 响应速度快(可配置延迟)

## 四、样式开发规范

### 4.1 Tailwind CSS 优先

```vue
<template>
  <!-- ✅ 优先使用 Tailwind 类名 -->
  <div class="flex items-center justify-between rounded-lg bg-white p-4 shadow">
    <h2 class="text-2xl font-semibold">标题</h2>
    <Button type="primary">操作</Button>
  </div>
</template>
```

### 4.2 常用 Tailwind 类名

```css
/* 布局 */
flex, grid, items-center, justify-between, gap-4, p-4, m-4

/* 间距 */
mb-6 (margin-bottom: 1.5rem)
mt-4 (margin-top: 1rem)
px-6 (padding-left/right: 1.5rem)

/* 尺寸 */
size-4 (width/height: 1rem)
w-full, h-full

/* 文字 */
text-2xl, font-semibold, text-muted-foreground

/* 颜色 */
bg-white, text-primary, border-gray-200

/* 圆角阴影 */
rounded-lg, shadow, shadow-lg

/* 响应式 */
md:grid-cols-2, xl:grid-cols-3
```

### 4.3 Scoped CSS (必要时)

```vue
<style scoped>
/* 仅在 Tailwind 无法满足需求时使用 */
.custom-component {
  /* 特殊样式 */
}
</style>
```

## 五、类型定义规范

### 5.1 类型文件位置

```
src/types/settings.ts          # 设置相关类型
```

### 5.2 类型定义示例

```typescript
// 基础类型
export type SystemStatus = 'enabled' | 'disabled';
export type SystemVendor = 'SAP' | 'Yonyou' | 'Kingdee' | 'Custom';

// 接口定义
export interface SourceSystem {
  id: string;
  name: string;
  code: string;
  vendor: SystemVendor;
  baseUrl: string;
  authConfig: AuthConfig;
  status: SystemStatus;
  createdAt: string;
  updatedAt: string;
}

// 联合类型
export type AuthConfig = BasicAuthConfig | OAuthConfig;

// API 响应类型
export interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}
```

## 六、路由配置规范

### 6.1 路由文件位置

```
src/router/routes/modules/audit.ts     # 审核模块路由
```

### 6.2 路由定义示例

```typescript
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:shield-check',
      order: 1,
      title: '审核管理',
    },
    name: 'Audit',
    path: '/audit',
    children: [
      {
        name: 'AuditSettings',
        path: '/audit/settings',
        component: () => import('#/views/audit/settings/index.vue'),
        meta: {
          icon: 'lucide:settings',
          title: '基础设置',
        },
      },
    ],
  },
];

export default routes;
```

## 七、常见问题和解决方案

### 7.1 按钮无样式问题

**问题**: 页面按钮显示为纯文本,没有背景和边框

**原因**: 未导入 Ant Design 组件

**解决方案**:

```vue
<script setup lang="ts">
// ✅ 导入 Button 组件
import { Button } from 'ant-design-vue';
</script>

<template>
  <Button type="primary">按钮</Button>
</template>
```

### 7.2 Mock 数据不显示

**问题**: 页面显示"暂无数据"或一直加载

**原因**: API 函数未正确返回 Mock 数据

**解决方案**: 确保 API 函数使用 `createMockResponse` 包装数据

```typescript
export async function getDataApi() {
  await mockDelay();
  return createMockResponse(mockData); // ✅ 正确
  // return mockData;  // ❌ 错误
}
```

### 7.3 TypeScript 类型错误

**问题**: 类型不匹配或找不到类型

**解决方案**:

1. 确保类型文件已创建: `src/types/settings.ts`
2. 使用正确的导入路径: `import type { SourceSystem } from '#/types/settings'`
3. Mock 数据和 API 返回类型必须一致

### 7.4 图标不显示

**问题**: Icon 组件无法显示图标

**解决方案**:

```vue
<script setup>
import { Icon } from '@iconify/vue'; // ✅ 导入 Icon
</script>

<template>
  <!-- 使用 lucide 图标集 -->
  <Icon icon="lucide:plus" class="size-4" />
</template>
```

图标搜索: https://lucide.dev/icons/

## 八、代码规范清单

### 8.1 组件开发

- [ ] 使用 `<script setup>` 语法
- [ ] 显式导入所有 Ant Design 组件
- [ ] 使用 PascalCase 命名导入的组件
- [ ] Props 和 Emits 使用 TypeScript 类型定义
- [ ] 优先使用 Composition API

### 8.2 样式开发

- [ ] 优先使用 Tailwind CSS 类名
- [ ] 保持类名的一致性(参考现有组件)
- [ ] 必要时使用 scoped CSS
- [ ] 避免内联样式

### 8.3 数据处理

- [ ] API 函数返回统一格式 (`createMockResponse`)
- [ ] 添加模拟延迟 (`mockDelay`)
- [ ] 类型定义完整且准确
- [ ] 错误处理使用 try-catch + message.error

### 8.4 文件组织

- [ ] 页面组件放在 `views/模块名/` 下
- [ ] 可复用组件放在 `components/` 子目录
- [ ] 弹窗组件放在 `modals/` 子目录
- [ ] API 函数统一在 `api/` 目录管理
- [ ] Mock 数据统一在 `api/mock-data.ts` 管理

## 九、开发流程

### 9.1 新增页面流程

1. **创建路由**: 在 `router/routes/modules/` 下添加路由配置
2. **创建页面**: 在 `views/` 下创建页面组件
3. **定义类型**: 在 `types/` 下定义 TypeScript 类型
4. **添加 Mock 数据**: 在 `api/mock-data.ts` 添加数据
5. **创建 API**: 在 `api/` 下创建 API 函数
6. **开发页面**: 实现页面逻辑和 UI
7. **测试**: 验证功能和样式

### 9.2 常用命令

```bash
# 启动开发服务器
pnpm dev:antd

# 类型检查
pnpm check:type

# 代码格式化
pnpm format

# 构建
pnpm build:antd
```

## 十、参考资源

- Vben Admin 文档: https://doc.vben.pro
- Ant Design Vue: https://antdv.com/components/overview-cn
- Tailwind CSS: https://tailwindcss.com/docs
- Lucide Icons: https://lucide.dev/icons/
- Vue 3 文档: https://cn.vuejs.org

## 十一、总结

本规范的核心要点:

1. **组件导入**: 必须显式导入所有 Ant Design 组件
2. **数据管理**: 使用前端 Mock 数据,简化开发流程
3. **样式开发**: Tailwind CSS 优先,保持一致性
4. **类型安全**: 完整的 TypeScript 类型定义
5. **代码组织**: 清晰的目录结构和文件命名

遵循这些规范,可以确保代码质量和开发效率,减少常见问题的发生。

## 重要提示

1. **不要修改 Vben 核心代码**: `packages/@core/` 和 `views/_core/` 下的文件不要修改
2. **仅开发 Demo**: 无需实现复杂的增删改查,重点在于展示界面和交互
3. **保持 Vben 风格**: 参考 `views/dashboard/` 下的示例页面,保持界面风格一致
