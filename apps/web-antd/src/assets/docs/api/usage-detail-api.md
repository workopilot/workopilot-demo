# 次数使用明细接口文档

本文档描述了次数使用明细模块的相关接口，用于展示数字员工的调用记录。

## 1. 页面设计逻辑

### 1.1 页面结构

- **查询条件区**: 包含租户、员工ID、员工名称、时间范围等筛选条件
- **数据表格区**: 展示详细的调用记录，包含租户、数字员工信息、调用时间、调用人信息、成果物和规格等字段
- **分页区**: 提供分页功能，方便查看大量数据

### 1.2 核心功能

- **数据筛选**: 支持按租户、员工ID、员工名称和时间范围进行筛选
- **数据导出**: 支持导出调用记录
- **数据刷新**: 支持手动刷新数据
- **分页导航**: 支持上下页导航

### 1.3 技术实现

- 使用 Vue 3 + TypeScript + Ant Design Vue 开发
- 采用 Composition API 管理状态和逻辑
- 使用 Mock 数据模拟 API 响应
- 响应式设计，适配不同屏幕尺寸
- 使用 Tailwind CSS 进行样式设计

## 2. 次数使用明细查询

### 2.1 获取次数使用明细列表

- **接口名称**: 获取次数使用明细列表
- **逻辑描述**: 获取数字员工的调用记录，支持按租户、员工ID、员工名称和时间范围进行筛选。
- **接口相对路径**: `/api/usage/detail` (GET)
- **请求方式**: GET

#### 入参

| 字段名       | 类型   | 描述               | 必选 |
| :----------- | :----- | :----------------- | :--- |
| tenant       | string | 租户ID             | 否   |
| employeeId   | string | 数字员工ID         | 否   |
| employeeName | string | 数字员工名称       | 否   |
| startTime    | string | 开始时间 (ISO格式) | 否   |
| endTime      | string | 结束时间 (ISO格式) | 否   |
| page         | number | 页码               | 否   |
| pageSize     | number | 每页条数           | 否   |

#### 返回值

| 字段名     | 类型          | 描述                   |
| :--------- | :------------ | :--------------------- |
| code       | number        | 响应状态码 (0表示成功) |
| message    | string        | 响应消息               |
| data       | object        | 响应数据               |
| data.list  | UsageDetail[] | 次数使用明细列表       |
| data.total | number        | 总记录数               |

**UsageDetail 结构**:

| 字段名        | 类型   | 描述         |
| :------------ | :----- | :----------- |
| id            | string | 记录ID       |
| tenant        | string | 租户名称     |
| employeeId    | string | 数字员工ID   |
| employeeName  | string | 数字员工名称 |
| employeeType  | string | 数字员工类型 |
| callTime      | string | 调用时间     |
| callerAccount | string | 调用人账号   |
| callerName    | string | 调用人姓名   |
| result        | string | 成果物       |
| specification | string | 规格         |

## 3. 导出次数使用明细

### 3.1 导出次数使用明细

- **接口名称**: 导出次数使用明细
- **逻辑描述**: 导出数字员工的调用记录为Excel文件。
- **接口相对路径**: `/api/usage/export` (GET)
- **请求方式**: GET

#### 入参

| 字段名       | 类型   | 描述               | 必选 |
| :----------- | :----- | :----------------- | :--- |
| tenant       | string | 租户ID             | 否   |
| employeeId   | string | 数字员工ID         | 否   |
| employeeName | string | 数字员工名称       | 否   |
| startTime    | string | 开始时间 (ISO格式) | 否   |
| endTime      | string | 结束时间 (ISO格式) | 否   |

#### 返回值

| 字段名  | 类型   | 描述                   |
| :------ | :----- | :--------------------- |
| code    | number | 响应状态码 (0表示成功) |
| message | string | 响应消息               |
| data    | string | 导出文件URL            |
