# 平台数据统计接口文档

本文档描述了平台数据统计模块的相关接口，用于展示全平台的租户调用统计和 Token 消耗情况。

## 1. 页面设计逻辑

### 1.1 页面结构

- **页面头部**: 展示平台管理员信息和页面标题
- **查询条件区**: 包含统计时间范围、租户ID、租户名称、员工ID、员工名称、员工类型等筛选条件
- **Tab页签**: 分为次数统计和 Token 统计两个 Tab
- **统计卡片区**: 展示关键统计指标，如全平台总调用次数、今日总调用次数、总消耗 Token、接入租户总数、活跃数字员工总数等
- **数据表格区**: 展示详细的统计数据，包括租户和数字员工的调用次数和 Token 消耗情况
- **租户排行区**: 展示租户调用排行和 Token 消耗排行
- **分页区**: 提供分页功能，方便查看大量数据

### 1.2 核心功能

- **数据筛选**: 支持按时间范围、租户信息、员工信息等多个条件进行筛选
- **数据导出**: 支持导出统计数据
- **数据刷新**: 支持手动刷新数据
- **分页导航**: 支持上下页导航
- **租户明细查看**: 支持查看租户的详细使用情况

### 1.3 技术实现

- 使用 Vue 3 + TypeScript + Ant Design Vue 开发
- 采用 Composition API 管理状态和逻辑
- 使用 Mock 数据模拟 API 响应
- 响应式设计，适配不同屏幕尺寸
- 使用 Tailwind CSS 进行样式设计
- 使用 Ant Design Vue 的 Tabs 组件实现 Tab 切换
- 使用 Ant Design Vue 的 Progress 组件展示占比数据

## 2. 平台数据统计查询

### 2.1 获取平台调用次数统计

- **接口名称**: 获取平台调用次数统计
- **逻辑描述**: 获取全平台的调用次数统计数据，支持按多个条件进行筛选。
- **接口相对路径**: `/api/platform/usage` (GET)
- **请求方式**: GET

#### 入参

| 字段名       | 类型   | 描述               | 必选 |
| ------------ | ------ | ------------------ | ---- |
| startTime    | string | 开始时间 (ISO格式) | 否   |
| endTime      | string | 结束时间 (ISO格式) | 否   |
| tenantId     | string | 租户ID             | 否   |
| tenantName   | string | 租户名称           | 否   |
| employeeId   | string | 数字员工ID         | 否   |
| employeeName | string | 员工名称           | 否   |
| employeeType | string | 员工类型           | 否   |
| page         | number | 页码               | 否   |
| pageSize     | number | 每页条数           | 否   |

#### 返回值

| 字段名       | 类型                | 描述                   |
| ------------ | ------------------- | ---------------------- |
| code         | number              | 响应状态码 (0表示成功) |
| message      | string              | 响应消息               |
| data         | object              | 响应数据               |
| data.list    | PlatformUsageStat[] | 平台调用次数统计列表   |
| data.total   | number              | 总记录数               |
| data.stats   | object              | 统计卡片数据           |
| data.ranking | object[]            | 租户排行数据           |

### 2.2 获取平台 Token 消耗统计

- **接口名称**: 获取平台 Token 消耗统计
- **逻辑描述**: 获取全平台的 Token 消耗统计数据，支持按多个条件进行筛选。
- **接口相对路径**: `/api/platform/token` (GET)
- **请求方式**: GET

#### 入参

| 字段名       | 类型   | 描述               | 必选 |
| ------------ | ------ | ------------------ | ---- |
| startTime    | string | 开始时间 (ISO格式) | 否   |
| endTime      | string | 结束时间 (ISO格式) | 否   |
| tenantId     | string | 租户ID             | 否   |
| tenantName   | string | 租户名称           | 否   |
| employeeId   | string | 数字员工ID         | 否   |
| employeeName | string | 员工名称           | 否   |
| employeeType | string | 员工类型           | 否   |
| page         | number | 页码               | 否   |
| pageSize     | number | 每页条数           | 否   |

#### 返回值

| 字段名       | 类型                | 描述                    |
| ------------ | ------------------- | ----------------------- |
| code         | number              | 响应状态码 (0表示成功)  |
| message      | string              | 响应消息                |
| data         | object              | 响应数据                |
| data.list    | PlatformTokenStat[] | 平台 Token 消耗统计列表 |
| data.total   | number              | 总记录数                |
| data.stats   | object              | 统计卡片数据            |
| data.ranking | object[]            | 租户 Token 消耗排行数据 |

## 3. 导出平台统计数据

### 3.1 导出平台调用次数统计

- **接口名称**: 导出平台调用次数统计
- **逻辑描述**: 导出平台调用次数统计数据为Excel文件。
- **接口相对路径**: `/api/platform/usage/export` (GET)
- **请求方式**: GET

#### 入参

| 字段名       | 类型   | 描述               | 必选 |
| ------------ | ------ | ------------------ | ---- |
| startTime    | string | 开始时间 (ISO格式) | 否   |
| endTime      | string | 结束时间 (ISO格式) | 否   |
| tenantId     | string | 租户ID             | 否   |
| tenantName   | string | 租户名称           | 否   |
| employeeId   | string | 数字员工ID         | 否   |
| employeeName | string | 员工名称           | 否   |
| employeeType | string | 员工类型           | 否   |

#### 返回值

| 字段名  | 类型   | 描述                   |
| ------- | ------ | ---------------------- |
| code    | number | 响应状态码 (0表示成功) |
| message | string | 响应消息               |
| data    | string | 导出文件URL            |

### 3.2 导出平台 Token 消耗统计

- **接口名称**: 导出平台 Token 消耗统计
- **逻辑描述**: 导出平台 Token 消耗统计数据为Excel文件。
- **接口相对路径**: `/api/platform/token/export` (GET)
- **请求方式**: GET

#### 入参

| 字段名       | 类型   | 描述               | 必选 |
| ------------ | ------ | ------------------ | ---- |
| startTime    | string | 开始时间 (ISO格式) | 否   |
| endTime      | string | 结束时间 (ISO格式) | 否   |
| tenantId     | string | 租户ID             | 否   |
| tenantName   | string | 租户名称           | 否   |
| employeeId   | string | 数字员工ID         | 否   |
| employeeName | string | 员工名称           | 否   |
| employeeType | string | 员工类型           | 否   |

#### 返回值

| 字段名  | 类型   | 描述                   |
| ------- | ------ | ---------------------- |
| code    | number | 响应状态码 (0表示成功) |
| message | string | 响应消息               |
| data    | string | 导出文件URL            |
