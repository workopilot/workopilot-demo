# 基础设置接口文档

本文档描述了基础设置模块的相关接口，包括业务系统、单据类型、费用科目和插件全局配置。

## 1. 业务系统管理

### 1.1 获取业务系统列表

- **接口名称**: 获取业务系统列表
- **逻辑描述**: 获取所有已配置的业务系统列表，模拟网络延迟。
- **接口相对路径**: `/api/settings/systems` (GET)
- **请求方式**: GET

#### 入参

无

#### 返回值

| 字段名  | 类型           | 描述                   |
| :------ | :------------- | :--------------------- |
| code    | number         | 响应状态码 (0表示成功) |
| message | string         | 响应消息               |
| data    | SourceSystem[] | 业务系统列表           |

**SourceSystem 结构**:

| 字段名     | 类型       | 描述                                |
| :--------- | :--------- | :---------------------------------- |
| id         | string     | 系统ID                              |
| name       | string     | 系统名称                            |
| code       | string     | 系统编码                            |
| vendor     | string     | 厂商 (Custom, Kingdee, SAP, Yonyou) |
| baseUrl    | string     | 基础URL                             |
| status     | string     | 状态 (enabled, disabled)            |
| authConfig | AuthConfig | 鉴权配置                            |
| createdAt  | string     | 创建时间                            |
| updatedAt  | string     | 更新时间                            |

### 1.2 新增业务系统

- **接口名称**: 新增业务系统
- **逻辑描述**: 创建新的业务系统配置。
- **接口相对路径**: `/api/settings/systems` (POST)
- **请求方式**: POST

#### 入参

| 字段名     | 类型       | 必填 | 描述               |
| :--------- | :--------- | :--- | :----------------- |
| name       | string     | 是   | 系统名称           |
| code       | string     | 是   | 系统编码           |
| vendor     | string     | 是   | 厂商               |
| baseUrl    | string     | 是   | 基础URL            |
| authConfig | AuthConfig | 是   | 鉴权配置           |
| status     | string     | 否   | 状态 (默认enabled) |

#### 返回值

| 字段名  | 类型         | 描述                   |
| :------ | :----------- | :--------------------- |
| code    | number       | 响应状态码             |
| data    | SourceSystem | 创建成功的业务系统对象 |
| message | string       | 响应消息               |

### 1.3 更新业务系统

- **接口名称**: 更新业务系统
- **逻辑描述**: 更新指定ID的业务系统配置。
- **接口相对路径**: `/api/settings/systems/:id`
- **请求方式**: PUT

#### 入参

| 字段名     | 类型       | 必填 | 描述                     |
| :--------- | :--------- | :--- | :----------------------- |
| id         | string     | 是   | 系统ID (路径参数)        |
| name       | string     | 否   | 系统名称                 |
| code       | string     | 否   | 系统编码                 |
| vendor     | string     | 否   | 厂商                     |
| baseUrl    | string     | 否   | 基础URL                  |
| authConfig | AuthConfig | 否   | 鉴权配置                 |
| status     | string     | 否   | 状态 (enabled, disabled) |

#### 返回值

| 字段名  | 类型         | 描述                 |
| :------ | :----------- | :------------------- |
| code    | number       | 响应状态码           |
| data    | SourceSystem | 更新后的业务系统对象 |
| message | string       | 响应消息             |

### 1.4 删除业务系统

- **接口名称**: 删除业务系统
- **逻辑描述**: 删除指定ID的业务系统。
- **接口相对路径**: `/api/settings/systems/:id`
- **请求方式**: DELETE

#### 入参

| 字段名 | 类型   | 必填 | 描述              |
| :----- | :----- | :--- | :---------------- |
| id     | string | 是   | 系统ID (路径参数) |

#### 返回值

| 字段名  | 类型   | 描述       |
| :------ | :----- | :--------- |
| code    | number | 响应状态码 |
| data    | null   | null       |
| message | string | 响应消息   |

## 2. 单据类型管理

### 2.1 获取单据类型树形列表

- **接口名称**: 获取单据类型树
- **逻辑描述**: 获取按系统分组的单据类型树结构，用于左侧导航。
- **接口相对路径**: `/api/settings/bill-types/tree`
- **请求方式**: GET

#### 入参

无

#### 返回值

| 字段名  | 类型               | 描述         |
| :------ | :----------------- | :----------- |
| code    | number             | 响应状态码   |
| data    | BillTypeTreeNode[] | 树形节点列表 |
| message | string             | 响应消息     |

### 2.2 获取单据类型详情

- **接口名称**: 获取单据类型详情
- **逻辑描述**: 根据ID获取单据类型的详细信息。
- **接口相对路径**: `/api/settings/bill-types/:id`
- **请求方式**: GET

#### 入参

| 字段名 | 类型   | 必填 | 描述       |
| :----- | :----- | :--- | :--------- |
| id     | string | 是   | 单据类型ID |

#### 返回值

| 字段名  | 类型     | 描述         |
| :------ | :------- | :----------- |
| code    | number   | 响应状态码   |
| data    | BillType | 单据类型详情 |
| message | string   | 响应消息     |

### 2.3 新增单据类型

- **接口名称**: 新增单据类型
- **逻辑描述**: 创建新的单据类型。
- **接口相对路径**: `/api/settings/bill-types`
- **请求方式**: POST

#### 入参

| 字段名      | 类型    | 必填 | 描述         |
| :---------- | :------ | :--- | :----------- |
| code        | string  | 是   | 单据类型编码 |
| name        | string  | 是   | 单据类型名称 |
| systemId    | string  | 是   | 所属系统ID   |
| systemName  | string  | 是   | 所属系统名称 |
| description | string  | 否   | 描述         |
| enabled     | boolean | 否   | 是否启用     |
| urlRegex    | string  | 否   | URL匹配正则  |

#### 返回值

| 字段名  | 类型     | 描述       |
| :------ | :------- | :--------- |
| code    | number   | 响应状态码 |
| data    | BillType | 创建的对象 |
| message | string   | 响应消息   |

## 3. 费用科目管理

### 3.1 获取费用科目树

- **接口名称**: 获取费用科目树
- **逻辑描述**: 获取费用科目的层级结构树。
- **接口相对路径**: `/api/settings/expense-categories`
- **请求方式**: GET

#### 入参

无

#### 返回值

| 字段名  | 类型              | 描述       |
| :------ | :---------------- | :--------- |
| code    | number            | 响应状态码 |
| data    | ExpenseCategory[] | 费用科目树 |
| message | string            | 响应消息   |

## 4. 插件全局配置

### 4.1 获取插件配置

- **接口名称**: 获取插件配置
- **逻辑描述**: 获取全局插件配置信息。
- **接口相对路径**: `/api/settings/plugin-config`
- **请求方式**: GET

#### 入参

无

#### 返回值

| 字段名  | 类型               | 描述         |
| :------ | :----------------- | :----------- |
| code    | number             | 响应状态码   |
| data    | PluginGlobalConfig | 全局配置对象 |
| message | string             | 响应消息     |

**PluginGlobalConfig 结构**:

| 字段名            | 类型    | 描述           |
| :---------------- | :------ | :------------- |
| privateDeployment | boolean | 是否私有化部署 |
| apiUrl            | string  | 私有化API地址  |
| debugMode         | boolean | 调试模式       |
| floatPosition     | string  | 悬浮球位置     |
