# 工具和插件接口文档

本文档描述了 Agent 工具和数据插件管理的相关接口。

## 1. Agent 工具管理

### 1.1 获取工具列表

- **接口名称**: 获取工具列表
- **逻辑描述**: 获取所有配置的 Agent 工具。
- **接口相对路径**: `/api/tools/agent`
- **请求方式**: GET

#### 入参

无

#### 返回值

| 字段名  | 类型        | 描述       |
| :------ | :---------- | :--------- |
| code    | number      | 响应状态码 |
| data    | AgentTool[] | 工具列表   |
| message | string      | 响应消息   |

**AgentTool 结构**:

| 字段名       | 类型   | 描述                             |
| :----------- | :----- | :------------------------------- |
| id           | string | 工具ID                           |
| name         | string | 工具名称                         |
| key          | string | 工具标识 Key                     |
| type         | string | 类型 (MCP_HTTP, MCP_SSE, NATIVE) |
| description  | string | 描述                             |
| schema       | string | JSON Schema 定义                 |
| endpoint     | string | MCP 端点地址                     |
| nativeMethod | string | 本地方法名                       |
| status       | string | 状态 (active, inactive)          |

### 1.2 新增工具

- **接口名称**: 新增工具
- **逻辑描述**: 注册新的 Agent 工具。
- **接口相对路径**: `/api/tools/agent`
- **请求方式**: POST

#### 入参

| 字段名      | 类型   | 必填 | 描述     |
| :---------- | :----- | :--- | :------- |
| name        | string | 是   | 名称     |
| key         | string | 是   | 标识 Key |
| type        | string | 是   | 类型     |
| description | string | 是   | 描述     |
| schema      | string | 否   | Schema   |
| endpoint    | string | 否   | 端点     |

#### 返回值

| 字段名  | 类型      | 描述       |
| :------ | :-------- | :--------- |
| code    | number    | 响应状态码 |
| data    | AgentTool | 创建的工具 |
| message | string    | 响应消息   |

### 1.3 更新工具

- **接口名称**: 更新工具
- **逻辑描述**: 更新现有工具配置。
- **接口相对路径**: `/api/tools/agent/:id`
- **请求方式**: PUT

#### 入参

| 字段名       | 类型   | 必填 | 描述                             |
| :----------- | :----- | :--- | :------------------------------- |
| id           | string | 是   | 工具ID (路径参数)                |
| name         | string | 否   | 工具名称                         |
| key          | string | 否   | 工具标识 Key                     |
| type         | string | 否   | 类型 (MCP_HTTP, MCP_SSE, NATIVE) |
| description  | string | 否   | 描述                             |
| schema       | string | 否   | JSON Schema 定义                 |
| endpoint     | string | 否   | MCP 端点地址                     |
| nativeMethod | string | 否   | 本地方法名                       |
| status       | string | 否   | 状态 (active, inactive)          |

#### 返回值

| 字段名  | 类型      | 描述         |
| :------ | :-------- | :----------- |
| code    | number    | 响应状态码   |
| data    | AgentTool | 更新后的工具 |
| message | string    | 响应消息     |

### 1.4 删除工具

- **接口名称**: 删除工具
- **逻辑描述**: 删除指定ID的工具。
- **接口相对路径**: `/api/tools/agent/:id`
- **请求方式**: DELETE

#### 入参

| 字段名 | 类型   | 必填 | 描述   |
| :----- | :----- | :--- | :----- |
| id     | string | 是   | 工具ID |

#### 返回值

| 字段名  | 类型   | 描述       |
| :------ | :----- | :--------- |
| code    | number | 响应状态码 |
| data    | null   | null       |
| message | string | 响应消息   |

## 2. 数据插件管理

### 2.1 获取插件列表

- **接口名称**: 获取插件列表
- **逻辑描述**: 获取所有数据插件配置。
- **接口相对路径**: `/api/tools/plugins`
- **请求方式**: GET

#### 入参

无

#### 返回值

| 字段名  | 类型         | 描述       |
| :------ | :----------- | :--------- |
| code    | number       | 响应状态码 |
| data    | DataPlugin[] | 插件列表   |
| message | string       | 响应消息   |

**DataPlugin 结构**:

| 字段名    | 类型            | 描述                            |
| :-------- | :-------------- | :------------------------------ |
| id        | string          | 插件ID                          |
| code      | string          | 插件编码                        |
| name      | string          | 插件名称                        |
| baseUrl   | string          | 基础地址                        |
| authType  | string          | 鉴权类型 (API_KEY, BASIC, etc.) |
| authToken | string          | 鉴权令牌                        |
| services  | PluginService[] | 服务列表                        |

**PluginService 结构**:

| 字段名      | 类型   | 描述     |
| :---------- | :----- | :------- |
| id          | string | 服务ID   |
| relativeUrl | string | 相对URL  |
| method      | string | 请求方法 |
| description | string | 描述     |
| returnType  | string | 返回类型 |

### 2.2 新增插件

- **接口名称**: 新增插件
- **逻辑描述**: 创建新的数据插件。
- **接口相对路径**: `/api/tools/plugins`
- **请求方式**: POST

#### 入参

| 字段名   | 类型            | 必填 | 描述     |
| :------- | :-------------- | :--- | :------- |
| code     | string          | 是   | 编码     |
| name     | string          | 是   | 名称     |
| baseUrl  | string          | 是   | 基础地址 |
| authType | string          | 是   | 鉴权类型 |
| services | PluginService[] | 否   | 服务列表 |

#### 返回值

| 字段名  | 类型       | 描述       |
| :------ | :--------- | :--------- |
| code    | number     | 响应状态码 |
| data    | DataPlugin | 创建的插件 |
| message | string     | 响应消息   |
