# 租户管理首页需求说明书

## 文档信息

| 项目     | 内容                   |
| -------- | ---------------------- |
| 文档名称 | 租户管理首页需求说明书 |
| 产品名称 | 喔壳智能体平台         |
| 模块名称 | 租户管理首页           |
| 版本号   | v1.0.0                 |
| 创建日期 | 2025-01-06             |
| 文档状态 | 待评审                 |

## 1. 功能概述

### 1.1 模块定位

租户管理首页是租户管理员登录后的主要工作台，提供租户核心运营数据的实时监控、快捷操作入口和数据分析功能，帮助管理员快速掌握租户服务运行状况和使用情况。

### 1.2 目标用户

- **主要用户**：租户管理员
- **使用场景**：日常运营监控、数据查看、快捷操作

### 1.3 核心价值

- **数据可视化**：关键指标一目了然
- **快速操作**：常用功能一键直达
- **实时监控**：服务状态实时掌握
- **数据分析**：用量趋势辅助决策

## 2. 页面布局

### 2.1 整体结构

页面采用垂直布局，从上到下分为三个区域：

```
┌─────────────────────────────────────────────┐
│  页面标题区                                  │
│  - 租户名称                                  │
│  - 套餐信息                                  │
│  - 刷新按钮                                  │
├─────────────────────────────────────────────┤
│  第一行：数据统计卡片（4列）                  │
│  - 总调用次数  - 今日调用  - 活跃模型  - 服务健康度 │
├─────────────────────────────────────────────┤
│  第二行：服务运行状态（左） + 快捷操作（右）    │
├─────────────────────────────────────────────┤
│  第三行：服务用量监控（左） + 模型用量监控（右） │
└─────────────────────────────────────────────┘
```

### 2.2 布局规格

- **页面间距**：外边距 24px（p-6）
- **卡片间距**：16px（gutter）
- **响应式**：支持大屏（1920px+）、中屏（1366px）、小屏（1024px）

## 3. 功能模块详细说明

### 3.1 页面标题区

#### 3.1.1 功能描述

显示租户基本信息和操作入口

#### 3.1.2 UI元素

- **标题**：租户名称（例如：默认租户）
- **副标题**：套餐类型 | 到期时间
- **操作按钮**：刷新按钮（带图标）

#### 3.1.3 交互说明

- 点击刷新按钮：重新加载所有数据
- 刷新成功后提示"数据已刷新"

#### 3.1.4 数据来源

```typescript
{
  tenantName: string,      // 租户名称
  packageType: string,     // 套餐类型：基础版/标准版/企业版
  expiryDate: string       // 到期日期：YYYY-MM-DD
}
```

### 3.2 数据统计卡片

#### 3.2.1 功能描述

展示4个核心运营指标，提供租户整体运营状况的快速概览

#### 3.2.2 卡片列表

| 卡片标题 | 指标说明 | 数据类型 | 颜色 | 图标 |
| --- | --- | --- | --- | --- |
| 总调用次数 | 租户累计总调用次数 | 数字 | 蓝色 (#3b82f6) | ⚡ (zap) |
| 今日调用 | 当日调用次数 | 数字 | 绿色 (#10b981) | 📊 (activity) |
| 活跃模型 | 已激活的模型数量 | 数字 | 橙色 (#f59e0b) | 🖥️ (cpu) |
| 服务健康度 | 整体服务健康度评分 | 百分比 | 紫色 (#8b5cf6) | 💓 (heart-pulse) |

#### 3.2.3 UI规格

- **布局**：Row + Col，每列占25%（span=6）
- **卡片组件**：Ant Design Card
- **数字组件**：Ant Design Statistic
- **图标大小**：16px（size-4）

#### 3.2.4 数据结构

```typescript
{
  totalCalls: number,      // 总调用次数，例如：125680
  todayCalls: number,      // 今日调用次数，例如：1528
  activeModels: number,    // 活跃模型数，例如：8
  serviceHealth: number    // 服务健康度（0-100），例如：96
}
```

#### 3.2.5 显示规则

- 数字使用千分位分隔符（例如：125,680）
- 服务健康度显示为百分比（例如：96%）
- 颜色根据指标类型区分

### 3.3 服务运行状态

#### 3.3.1 功能描述

展示5个核心AI服务的实时运行状态和关键性能指标

#### 3.3.2 服务列表

| 服务ID    | 服务名称 | 说明               |
| --------- | -------- | ------------------ |
| service-1 | 智能填报 | AI智能填报单据服务 |
| service-2 | 智能审核 | AI智能审核单据服务 |
| service-3 | 智能合规 | AI合规检查服务     |
| service-4 | 附件分类 | AI附件自动分类服务 |
| service-5 | 附件比对 | AI附件比对服务     |

#### 3.3.3 显示内容

每项服务显示以下信息：

1. **服务名称** + **状态标签**
2. **今日调用次数**：当日该服务被调用的总次数
3. **总调用次数**：累计调用次数
4. **成功率**：成功调用占比（百分比）
5. **响应时间**：平均响应时间（毫秒）

#### 3.3.4 状态标签规则

| 状态值 | 显示文本 | 颜色 | 判断规则 |
| --- | --- | --- | --- |
| normal | 正常 | 绿色 (success) | 成功率 ≥ 95% 且 响应时间 < 2000ms |
| warning | 警告 | 黄色 (warning) | 90% ≤ 成功率 < 95% 或 2000ms ≤ 响应时间 < 3000ms |
| error | 异常 | 红色 (error) | 成功率 < 90% 或 响应时间 ≥ 3000ms |

#### 3.3.5 成功率颜色规则

- **绿色** (text-green-600)：成功率 > 95%
- **黄色** (text-yellow-600)：成功率 ≤ 95%

#### 3.3.6 UI布局

```
┌────────────────────────────────────────────┐
│ [图标] 智能审核 [正常]                       │
│ 今日调用: 623  总调用: 52,340  成功率: 97.8% 响应时间: 1250ms │
└────────────────────────────────────────────┘
```

#### 3.3.7 数据结构

```typescript
{
  id: string,              // 服务ID
  name: string,            // 服务名称
  status: 'normal' | 'warning' | 'error',
  todayCalls: number,      // 今日调用次数
  totalCalls: number,      // 总调用次数
  successRate: number,     // 成功率（0-100）
  avgResponseTime: number  // 平均响应时间（ms）
}
```

### 3.4 快捷操作

#### 3.4.1 功能描述

提供常用功能的快捷入口，提升操作效率

#### 3.4.2 操作列表

| 操作ID | 操作名称 | 描述 | 图标 | 跳转路径 |
| --- | --- | --- | --- | --- |
| action-1 | 管理基础数据 | 配置和管理业务基础数据 | 📁 (database) | /audit/tools-data |
| action-2 | 新建审核规则 | 创建新的审核规则 | ➕ (plus-circle) | /audit/rule-studio |
| action-3 | 附件分类配置 | 配置附件自动分类规则 | 🏷️ (tag) | /audit/settings |
| action-4 | 管理制度 | 查看和管理审核制度 | 📄 (file-text) | /audit/scheme-builder |

#### 3.4.3 UI规格

- **布局**：2行2列网格（Row gutter=[16,16], Col span=12）
- **卡片样式**：带边框、圆角、阴影
- **悬停效果**：
  - 边框变蓝色（border-blue-500）
  - 向上平移2px（translateY(-2px)）
  - 添加阴影（hover:shadow-md）

#### 3.4.4 卡片布局

```
┌─────────────────────────┐
│ [图标]  管理基础数据      │
│         配置和管理业务... │
└─────────────────────────┘
```

#### 3.4.5 交互说明

- 点击卡片：跳转到对应的功能页面
- 路由跳转使用 Vue Router push

#### 3.4.6 数据结构

```typescript
{
  id: string,              // 操作ID
  title: string,           // 操作标题
  description: string,     // 操作描述
  icon: string,            // 图标名称（lucide图标）
  route: string            // 跳转路径
}
```

### 3.5 服务用量监控

#### 3.5.1 功能描述

使用环形饼图展示各服务的用量占比，直观分析服务使用分布

#### 3.5.2 图表类型

- **图表类型**：环形饼图（Pie Chart with Donut）
- **内半径**：40%
- **外半径**：70%
- **图表位置**：左侧，居中

#### 3.5.3 显示内容

1. **图表中心**：今日总调用次数（大号数字）
2. **饼图扇区**：各服务用量占比
3. **图例**：显示在右侧，垂直排列

#### 3.5.4 数据示例

| 服务名称 | 调用次数 | 占比  |
| -------- | -------- | ----- |
| 智能审核 | 623      | 40.8% |
| 智能填报 | 456      | 29.8% |
| 智能合规 | 234      | 15.3% |
| 附件分类 | 145      | 9.5%  |
| 附件比对 | 70       | 4.6%  |

#### 3.5.5 图表配置

```typescript
{
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c} ({d}%)'  // 名称: 数量 (百分比)
  },
  legend: {
    orient: 'vertical',
    right: '10%',
    top: 'center'
  },
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    center: ['35%', '50%'],
    itemStyle: {
      borderRadius: 10,
      borderColor: '#fff',
      borderWidth: 2
    }
  }]
}
```

#### 3.5.6 交互说明

- 鼠标悬停扇区：显示具体数值和百分比
- 鼠标悬停图例：高亮对应扇区
- 点击图例：显示/隐藏对应数据

#### 3.5.7 数据结构

```typescript
{
  total: number,           // 总调用次数
  data: [{
    name: string,          // 服务名称
    value: number,         // 调用次数
    percentage: number     // 百分比
  }]
}
```

### 3.6 模型用量监控

#### 3.6.1 功能描述

使用折线图展示Top5模型的用量趋势，支持不同时间范围的数据查看

#### 3.6.2 图表类型

- **图表类型**：平滑折线图（Line Chart with Smooth）
- **线条样式**：平滑曲线（smooth: true）

#### 3.6.3 时间范围切换

提供4种时间范围选项：

- **今天**：按小时统计（00:00 - 23:00）
- **近7天**：按天统计（最近7天）
- **近30天**：按天统计（最近30天）
- **自定义**：用户选择起始和结束日期

#### 3.6.4 Top5模型列表

| 模型名称          | 模型厂商  | 说明             |
| ----------------- | --------- | ---------------- |
| GPT-4 审核模型    | OpenAI    | 高质量审核模型   |
| GPT-3.5 快速审核  | OpenAI    | 快速响应审核模型 |
| Claude 3 深度审核 | Anthropic | 深度分析审核模型 |
| 文心一言 4.0      | 百度      | 国产审核模型     |
| 通义千问-Plus     | 阿里云    | 国产审核模型     |

#### 3.6.5 图表配置

```typescript
{
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross'  // 十字准星指示器
    }
  },
  legend: {
    data: ['模型1', '模型2', ...],
    top: 10
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['时间点1', '时间点2', ...]
  },
  yAxis: {
    type: 'value',
    name: '调用次数'
  },
  series: [
    {
      name: '模型名称',
      type: 'line',
      smooth: true,
      data: [数值数组]
    }
  ]
}
```

#### 3.6.6 时间范围数据格式

**今天（24小时制）**：

```
00:00, 01:00, 02:00, ..., 23:00
```

**近7天**：

```
12-23, 12-24, 12-25, 12-26, 12-27, 12-28, 12-29
```

**近30天**：

```
12-01, 12-02, ..., 12-30
```

#### 3.6.7 交互说明

- 点击时间范围按钮：切换数据，重新渲染图表
- 切换时显示提示信息："切换到XX数据"
- 鼠标悬停数据点：显示具体数值
- 点击图例：显示/隐藏对应模型曲线

#### 3.6.8 数据结构

```typescript
{
  timeRange: 'today' | 'week' | 'month' | 'custom',
  customStart?: string,    // 自定义开始日期 YYYY-MM-DD
  customEnd?: string,      // 自定义结束日期 YYYY-MM-DD
  data: [{
    modelName: string,     // 模型名称
    modelVendor: string,   // 模型厂商
    totalCalls: number,    // 该时间范围总调用次数
    data: [{
      time: string,        // 时间点
      modelName: string,   // 模型名称
      calls: number        // 调用次数
    }]
  }]
}
```

## 4. 数据结构定义

### 4.1 租户概览数据

```typescript
interface TenantOverview {
  tenantId: string; // 租户ID
  tenantName: string; // 租户名称
  totalCalls: number; // 总调用次数
  todayCalls: number; // 今日调用次数
  activeModels: number; // 活跃模型数
  serviceHealth: number; // 服务健康度(0-100)
  expiryDate: string; // 套餐到期日期 YYYY-MM-DD
  packageType: string; // 套餐类型
}
```

### 4.2 服务运行状态

```typescript
interface ServiceRunningStatus {
  id: string; // 服务ID
  name: string; // 服务名称
  status: 'normal' | 'warning' | 'error';
  todayCalls: number; // 今日调用次数
  totalCalls: number; // 总调用次数
  successRate: number; // 成功率(0-100)
  avgResponseTime: number; // 平均响应时间(ms)
}
```

### 4.3 服务用量数据

```typescript
interface ServiceUsageData {
  name: string; // 服务名称
  value: number; // 调用次数
  percentage: number; // 百分比
}

interface ServiceUsageMonitor {
  total: number; // 总调用次数
  data: ServiceUsageData[];
}
```

### 4.4 模型用量数据

```typescript
interface ModelUsagePoint {
  time: string; // 时间点
  modelName: string; // 模型名称
  calls: number; // 调用次数
}

interface ModelUsageData {
  modelName: string; // 模型名称
  modelVendor: string; // 模型厂商
  totalCalls: number; // 总调用次数
  data: ModelUsagePoint[];
}

interface ModelUsageMonitor {
  timeRange: 'today' | 'week' | 'month' | 'custom';
  customStart?: string; // 自定义开始日期
  customEnd?: string; // 自定义结束日期
  data: ModelUsageData[];
}
```

### 4.5 快捷操作数据

```typescript
interface QuickAction {
  id: string; // 操作ID
  title: string; // 操作标题
  description: string; // 操作描述
  icon: string; // 图标名称
  route?: string; // 跳转路径
  action?: string; // 操作类型（非跳转类）
  badge?: number; // 徽章数字
}
```

### 4.6 首页聚合数据

```typescript
interface TenantHomeData {
  overview: TenantOverview;
  quickActions: QuickAction[];
  serviceStatus: ServiceRunningStatus[];
  serviceUsage: ServiceUsageMonitor;
  modelUsage: ModelUsageMonitor;
}
```

## 5. 接口定义

### 5.1 获取首页数据

**接口地址**：`GET /api/tenant/home`

**请求参数**：无

**响应示例**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "overview": {
      "tenantId": "tenant_001",
      "tenantName": "默认租户",
      "totalCalls": 125680,
      "todayCalls": 1528,
      "activeModels": 8,
      "serviceHealth": 96,
      "expiryDate": "2025-12-31",
      "packageType": "企业版"
    },
    "quickActions": [...],
    "serviceStatus": [...],
    "serviceUsage": {...},
    "modelUsage": {...}
  }
}
```

### 5.2 刷新数据

**接口地址**：`POST /api/tenant/home/refresh`

**请求参数**：无

**响应**：同获取首页数据

### 5.3 切换模型用量时间范围

**接口地址**：`GET /api/tenant/home/model-usage`

**请求参数**：

```typescript
{
  timeRange: 'today' | 'week' | 'month' | 'custom',
  customStart?: string,   // 自定义开始日期
  customEnd?: string      // 自定义结束日期
}
```

**响应示例**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "timeRange": "week",
    "data": [...]
  }
}
```

## 6. 技术要求

### 6.1 技术栈

- **前端框架**：Vue 3.4+
- **UI组件库**：Ant Design Vue 4.x
- **图表库**：ECharts 5.x + vue-echarts
- **状态管理**：Vue 3 Composition API
- **路由**：Vue Router 4.x
- **样式**：Tailwind CSS 3.x
- **图标**：Iconify + Lucide图标集

### 6.2 开发规范

#### 6.2.1 组件规范

- 使用 `<script setup>` 语法
- 组件导入必须显式导入 Ant Design 组件
- 使用 TypeScript 进行类型定义
- 组件名称使用 PascalCase

#### 6.2.2 样式规范

- 优先使用 Tailwind CSS 类名
- 保持与现有组件风格一致
- 响应式设计，支持多种屏幕尺寸
- 使用语义化的颜色变量

#### 6.2.3 数据规范

- 所有接口返回统一格式：`{ code, data, message }`
- 日期格式统一使用：YYYY-MM-DD
- 时间格式统一使用：HH:mm:ss
- 数字使用千分位分隔符

#### 6.2.4 错误处理

- 接口错误统一使用 message.error 提示
- 加载状态使用 loading 遮罩
- 空数据状态显示占位提示

### 6.3 性能要求

- 首屏加载时间 < 2秒
- 数据刷新响应时间 < 500ms
- 图表渲染时间 < 300ms
- 支持数据自动刷新（可配置间隔）

### 6.4 兼容性要求

- **浏览器**：Chrome 90+, Edge 90+, Firefox 88+, Safari 14+
- **分辨率**：
  - 最小支持：1024x768
  - 推荐：1920x1080
  - 最大支持：2560x1440

### 6.5 可访问性

- 支持键盘导航
- 图表支持鼠标悬停提示
- 颜色对比度符合 WCAG 2.1 AA 标准

## 7. 开发任务清单

### 7.1 前端开发任务

- [x] 创建类型定义文件
- [x] 创建 Mock 数据
- [x] 创建 API 函数
- [x] 开发页面组件
- [x] 集成 ECharts 图表
- [x] 实现数据加载和刷新
- [x] 实现路由跳转
- [ ] 添加自定义时间范围选择器
- [ ] 添加数据导出功能
- [ ] 优化移动端适配

### 7.2 后端开发任务（待实现）

- [ ] 设计数据库表结构
- [ ] 实现数据统计接口
- [ ] 实现服务状态监控
- [ ] 实现用量统计接口
- [ ] 实现模型用量数据聚合
- [ ] 添加缓存机制
- [ ] 添加权限控制

### 7.3 测试任务

- [ ] 单元测试：组件测试
- [ ] 单元测试：API 函数测试
- [ ] 集成测试：页面功能测试
- [ ] 性能测试：大数据量测试
- [ ] 兼容性测试：多浏览器测试
- [ ] 用户验收测试

## 8. 验收标准

### 8.1 功能验收

- [ ] 所有数据卡片正确显示
- [ ] 服务状态实时更新
- [ ] 快捷操作跳转正确
- [ ] 服务用量饼图渲染正确
- [ ] 模型用量折线图渲染正确
- [ ] 时间范围切换功能正常
- [ ] 刷新功能正常工作
- [ ] 加载状态正确显示

### 8.2 性能验收

- [ ] 首屏加载时间 < 2秒
- [ ] 数据刷新响应时间 < 500ms
- [ ] 图表切换无卡顿
- [ ] 内存占用 < 100MB

### 8.3 UI/UX 验收

- [ ] 布局符合设计稿
- [ ] 颜色使用正确
- [ ] 交互效果流畅
- [ ] 响应式适配正常
- [ ] 文案准确无误

## 9. 后续优化方向

### 9.1 功能增强

- 支持自定义快捷操作
- 支持数据导出（Excel、PDF）
- 支持数据对比功能
- 添加异常告警功能
- 添加数据预测功能

### 9.2 性能优化

- 实现数据按需加载
- 使用虚拟滚动优化长列表
- 添加客户端缓存
- 优化图表渲染性能

### 9.3 体验优化

- 添加数据动画效果
- 支持拖拽调整卡片顺序
- 支持个性化配置
- 添加暗黑模式支持

## 10. 附录

### 10.1 术语表

| 术语     | 说明                               |
| -------- | ---------------------------------- |
| 租户     | 系统中的企业客户实例               |
| 服务     | AI功能模块，如智能填报、智能审核等 |
| 模型     | 具体的AI模型，如GPT-4、Claude 3等  |
| 调用次数 | 服务或模型被使用的次数             |
| 成功率   | 成功调用的占比                     |
| 响应时间 | 从发起请求到收到响应的时间         |

### 10.2 图标参考

- [Lucide图标库](https://lucide.dev/icons/)
- [Iconify文档](https://iconify.design/)

### 10.3 相关文档

- [Ant Design Vue组件库](https://antdv.com/components/overview-cn)
- [ECharts配置项手册](https://echarts.apache.org/zh/option.html)
- [Vue 3文档](https://cn.vuejs.org/)
- [Tailwind CSS文档](https://tailwindcss.com/docs)

### 10.4 变更记录

| 版本   | 日期       | 变更内容 | 变更人 |
| ------ | ---------- | -------- | ------ |
| v1.0.0 | 2025-01-06 | 初始版本 | Claude |

---

**文档结束**
