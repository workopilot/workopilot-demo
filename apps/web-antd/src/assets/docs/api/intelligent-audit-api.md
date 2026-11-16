# 智能审核接口文档

本文档描述了智能审核模块的相关接口，包括审核规则、审核方案及沙箱测试。

## 1. 审核规则管理

### 1.1 获取规则列表

- **接口名称**: 获取规则列表
- **逻辑描述**: 获取所有定义的审核规则。
- **接口相对路径**: `/api/audit/rules`
- **请求方式**: GET

#### 入参

无

#### 返回值

| 字段名  | 类型        | 描述       |
| :------ | :---------- | :--------- |
| code    | number      | 响应状态码 |
| data    | AuditRule[] | 规则列表   |
| message | string      | 响应消息   |

**AuditRule 结构**:

| 字段名      | 类型         | 描述                  |
| :---------- | :----------- | :-------------------- |
| id          | string       | 规则ID                |
| code        | string       | 规则编码              |
| name        | string       | 规则名称              |
| scope       | string       | 作用域 (line, entire) |
| prompt      | string       | 提示词                |
| version     | string       | 版本                  |
| status      | string       | 状态                  |
| dataSources | DataSource[] | 数据源依赖            |
| tools       | string[]     | 使用的工具            |
| usageCount  | number       | 使用次数              |

**DataSource 结构**:

| 字段名     | 类型     | 描述                          |
| :--------- | :------- | :---------------------------- |
| type       | string   | 类型 (ATTACH, PLUGIN, POLICY) |
| filterCats | string[] | 过滤分类                      |
| pluginId   | string   | 插件ID                        |
| policyId   | string   | 制度ID                        |
| clauses    | object[] | 条款列表                      |

### 1.2 新增规则

- **接口名称**: 新增规则
- **逻辑描述**: 创建新的审核规则。
- **接口相对路径**: `/api/audit/rules`
- **请求方式**: POST

#### 入参

| 字段名      | 类型         | 必填 | 描述   |
| :---------- | :----------- | :--- | :----- |
| code        | string       | 否   | 编码   |
| name        | string       | 否   | 名称   |
| scope       | string       | 否   | 作用域 |
| prompt      | string       | 否   | 提示词 |
| dataSources | DataSource[] | 否   | 数据源 |

#### 返回值

| 字段名  | 类型      | 描述       |
| :------ | :-------- | :--------- |
| code    | number    | 响应状态码 |
| data    | AuditRule | 创建的规则 |
| message | string    | 响应消息   |

### 1.3 更新规则

- **接口名称**: 更新规则
- **逻辑描述**: 更新指定ID的审核规则。
- **接口相对路径**: `/api/audit/rules/:id`
- **请求方式**: PUT

#### 入参

| 字段名               | 类型         | 必填 | 描述     |
| :------------------- | :----------- | :--- | :------- |
| id                   | string       | 是   | 规则ID   |
| code                 | string       | 否   | 规则编码 |
| name                 | string       | 否   | 规则名称 |
| scope                | string       | 否   | 作用域   |
| applicableCategories | string[]     | 否   | 适用分类 |
| prompt               | string       | 否   | 提示词   |
| description          | string       | 否   | 描述     |
| status               | string       | 否   | 状态     |
| dataSources          | DataSource[] | 否   | 数据源   |
| tools                | string[]     | 否   | 使用工具 |

#### 返回值

| 字段名  | 类型      | 描述         |
| :------ | :-------- | :----------- |
| code    | number    | 响应状态码   |
| data    | AuditRule | 更新后的规则 |
| message | string    | 响应消息     |

### 1.4 删除规则

- **接口名称**: 删除规则
- **逻辑描述**: 删除指定ID的审核规则（如果未被使用）。
- **接口相对路径**: `/api/audit/rules/:id`
- **请求方式**: DELETE

#### 入参

| 字段名 | 类型   | 必填 | 描述   |
| :----- | :----- | :--- | :----- |
| id     | string | 是   | 规则ID |

#### 返回值

| 字段名  | 类型   | 描述       |
| :------ | :----- | :--------- |
| code    | number | 响应状态码 |
| data    | null   | null       |
| message | string | 响应消息   |

## 2. 审核方案管理

### 2.1 获取方案列表

- **接口名称**: 获取方案列表
- **逻辑描述**: 获取所有审核方案配置。
- **接口相对路径**: `/api/audit/schemes`
- **请求方式**: GET

#### 入参

无

#### 返回值

| 字段名  | 类型          | 描述       |
| :------ | :------------ | :--------- |
| code    | number        | 响应状态码 |
| data    | AuditScheme[] | 方案列表   |
| message | string        | 响应消息   |

**AuditScheme 结构**:

| 字段名                    | 类型               | 描述           |
| :------------------------ | :----------------- | :------------- |
| id                        | string             | 方案ID         |
| name                      | string             | 方案名称       |
| billType                  | string             | 适用单据类型   |
| globalConfidenceThreshold | number             | 全局置信度阈值 |
| rules                     | SchemeRuleConfig[] | 规则配置列表   |

**SchemeRuleConfig 结构**:

| 字段名                   | 类型   | 描述                  |
| :----------------------- | :----- | :-------------------- |
| ruleId                   | string | 规则ID                |
| action                   | string | 动作 (BLOCK, WARNING) |
| priority                 | number | 优先级                |
| localConfidenceThreshold | number | 局部阈值              |

### 2.2 新增方案

- **接口名称**: 新增方案
- **逻辑描述**: 创建新的审核方案。
- **接口相对路径**: `/api/audit/schemes`
- **请求方式**: POST

#### 入参

| 字段名   | 类型               | 必填 | 描述     |
| :------- | :----------------- | :--- | :------- |
| name     | string             | 否   | 名称     |
| billType | string             | 否   | 单据类型 |
| rules    | SchemeRuleConfig[] | 否   | 规则列表 |

#### 返回值

| 字段名  | 类型        | 描述       |
| :------ | :---------- | :--------- |
| code    | number      | 响应状态码 |
| data    | AuditScheme | 创建的方案 |
| message | string      | 响应消息   |

### 2.3 更新方案

- **接口名称**: 更新方案
- **逻辑描述**: 更新指定ID的审核方案。
- **接口相对路径**: `/api/audit/schemes/:id`
- **请求方式**: PUT

#### 入参

| 字段名                    | 类型               | 必填 | 描述           |
| :------------------------ | :----------------- | :--- | :------------- |
| id                        | string             | 是   | 方案ID         |
| code                      | string             | 否   | 方案编码       |
| name                      | string             | 否   | 方案名称       |
| billType                  | string             | 否   | 适用单据类型   |
| globalConfidenceThreshold | number             | 否   | 全局置信度阈值 |
| rules                     | SchemeRuleConfig[] | 否   | 规则配置列表   |

#### 返回值

| 字段名  | 类型        | 描述         |
| :------ | :---------- | :----------- |
| code    | number      | 响应状态码   |
| data    | AuditScheme | 更新后的方案 |
| message | string      | 响应消息     |

### 2.4 删除方案

- **接口名称**: 删除方案
- **逻辑描述**: 删除指定ID的审核方案。
- **接口相对路径**: `/api/audit/schemes/:id`
- **请求方式**: DELETE

#### 入参

| 字段名 | 类型   | 必填 | 描述   |
| :----- | :----- | :--- | :----- |
| id     | string | 是   | 方案ID |

#### 返回值

| 字段名  | 类型   | 描述       |
| :------ | :----- | :--------- |
| code    | number | 响应状态码 |
| data    | null   | null       |
| message | string | 响应消息   |
