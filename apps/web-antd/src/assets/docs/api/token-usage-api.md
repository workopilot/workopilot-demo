# Token 使用明细接口文档

本文档描述了 Token 使用明细模块的相关接口，用于展示模型调用的 Token 使用情况。

## 1. 页面设计逻辑

### 1.1 页面结构

- **查询条件区**: 包含租户名称、调用时间、请求ID、模型厂商、模型级别、调用状态、业务类型、关键字等筛选条件
- **数据表格区**: 展示详细的 Token 使用记录，包含请求ID、业务类型、模型信息、租户信息、Token 使用情况、调用时间等字段
- **分页区**: 提供分页功能，方便查看大量数据

### 1.2 核心功能

- **数据筛选**: 支持按多个条件进行组合筛选
- **数据导出**: 支持导出 Token 使用记录
- **数据刷新**: 支持手动刷新数据
- **分页导航**: 支持上下页导航
- **详情查看**: 支持查看请求详情

### 1.3 技术实现

- 使用 Vue 3 + TypeScript + Ant Design Vue 开发
- 采用 Composition API 管理状态和逻辑
- 使用 Mock 数据模拟 API 响应
- 响应式设计，适配不同屏幕尺寸
- 使用 Tailwind CSS 进行样式设计

## 2. Token 使用明细查询

### 2.1 获取 Token 使用明细列表

- **接口名称**: 获取 Token 使用明细列表
- **逻辑描述**: 获取模型调用的 Token 使用记录，支持按多个条件进行筛选。
- **接口相对路径**: `/api/token/usage` (GET)
- **请求方式**: GET

#### 入参

| 字段名       | 类型   | 描述               | 必选 |
| ------------ | ------ | ------------------ | ---- |
| tenantName   | string | 租户名称           | 否   |
| startTime    | string | 开始时间 (ISO格式) | 否   |
| endTime      | string | 结束时间 (ISO格式) | 否   |
| requestId    | string | 请求ID             | 否   |
| modelVendor  | string | 模型厂商           | 否   |
| modelLevel   | string | 模型级别           | 否   |
| callStatus   | string | 调用状态           | 否   |
| businessType | string | 业务类型           | 否   |
| keyword      | string | 关键字             | 否   |
| page         | number | 页码               | 否   |
| pageSize     | number | 每页条数           | 否   |

#### 返回值

| 字段名     | 类型         | 描述                   |
| ---------- | ------------ | ---------------------- |
| code       | number       | 响应状态码 (0表示成功) |
| message    | string       | 响应消息               |
| data       | object       | 响应数据               |
| data.list  | TokenUsage[] | Token 使用明细列表     |
| data.total | number       | 总记录数               |

**TokenUsage 结构**:

| 字段名       | 类型   | 描述        |
| ------------ | ------ | ----------- |
| id           | string | 记录ID      |
| requestId    | string | 请求ID      |
| businessType | string | 业务类型    |
| modelName    | string | 模型名称    |
| modelVendor  | string | 模型厂商    |
| modelLevel   | string | 模型级别    |
| tenantName   | string | 租户名称    |
| callStatus   | string | 调用状态    |
| inputTokens  | number | 输入Token数 |
| outputTokens | number | 输出Token数 |
| totalTokens  | number | 总Token数   |
| callTime     | string | 调用时间    |
| duration     | number | 耗时(秒)    |

## 3. 导出 Token 使用明细

### 3.1 导出 Token 使用明细

- **接口名称**: 导出 Token 使用明细
- **逻辑描述**: 导出 Token 使用记录为Excel文件。
- **接口相对路径**: `/api/token/export` (GET)
- **请求方式**: GET

#### 入参

| 字段名       | 类型   | 描述               | 必选 |
| ------------ | ------ | ------------------ | ---- |
| tenantName   | string | 租户名称           | 否   |
| startTime    | string | 开始时间 (ISO格式) | 否   |
| endTime      | string | 结束时间 (ISO格式) | 否   |
| requestId    | string | 请求ID             | 否   |
| modelVendor  | string | 模型厂商           | 否   |
| modelLevel   | string | 模型级别           | 否   |
| callStatus   | string | 调用状态           | 否   |
| businessType | string | 业务类型           | 否   |
| keyword      | string | 关键字             | 否   |

#### 返回值

| 字段名  | 类型   | 描述                   |
| ------- | ------ | ---------------------- |
| code    | number | 响应状态码 (0表示成功) |
| message | string | 响应消息               |
| data    | string | 导出文件URL            |
