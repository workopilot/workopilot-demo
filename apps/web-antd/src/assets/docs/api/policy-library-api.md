# 制度库接口文档

本文档描述了制度库管理的相关接口，包括制度文档、条款、版本和发布记录。

## 1. 制度文档管理

### 1.1 获取制度列表

- **接口名称**: 获取制度列表
- **逻辑描述**: 获取所有制度文档列表。
- **接口相对路径**: `/api/policy`
- **请求方式**: GET

#### 入参

无

#### 返回值

| 字段名  | 类型     | 描述       |
| :------ | :------- | :--------- |
| code    | number   | 响应状态码 |
| data    | Policy[] | 制度列表   |
| message | string   | 响应消息   |

**Policy 结构**:

| 字段名    | 类型   | 描述     |
| :-------- | :----- | :------- |
| id        | string | 制度ID   |
| code      | string | 制度编码 |
| name      | string | 制度名称 |
| category  | string | 分类     |
| version   | string | 当前版本 |
| status    | string | 状态     |
| ruleCount | number | 规则数量 |
| updatedAt | string | 更新时间 |

### 1.2 新增制度

- **接口名称**: 新增制度
- **逻辑描述**: 创建新的制度文档。
- **接口相对路径**: `/api/policy`
- **请求方式**: POST

#### 入参

| 字段名      | 类型   | 必填 | 描述 |
| :---------- | :----- | :--- | :--- |
| code        | string | 是   | 编码 |
| name        | string | 是   | 名称 |
| category    | string | 否   | 分类 |
| description | string | 否   | 描述 |

#### 返回值

| 字段名  | 类型   | 描述       |
| :------ | :----- | :--------- |
| code    | number | 响应状态码 |
| data    | Policy | 创建的制度 |
| message | string | 响应消息   |

### 1.3 获取制度详情

- **接口名称**: 获取制度详情
- **逻辑描述**: 根据ID获取制度详细信息。
- **接口相对路径**: `/api/policy/:id`
- **请求方式**: GET

#### 入参

| 字段名 | 类型   | 必填 | 描述   |
| :----- | :----- | :--- | :----- |
| id     | string | 是   | 制度ID |

#### 返回值

| 字段名  | 类型   | 描述       |
| :------ | :----- | :--------- |
| code    | number | 响应状态码 |
| data    | Policy | 制度详情   |
| message | string | 响应消息   |

### 1.4 更新制度

- **接口名称**: 更新制度
- **逻辑描述**: 更新制度的基本信息。
- **接口相对路径**: `/api/policy/:id`
- **请求方式**: PUT

#### 入参

| 字段名      | 类型   | 必填 | 描述     |
| :---------- | :----- | :--- | :------- |
| id          | string | 是   | 制度ID   |
| code        | string | 否   | 制度编码 |
| name        | string | 否   | 制度名称 |
| category    | string | 否   | 分类     |
| description | string | 否   | 描述     |
| version     | string | 否   | 版本     |
| status      | string | 否   | 状态     |

#### 返回值

| 字段名  | 类型   | 描述         |
| :------ | :----- | :----------- |
| code    | number | 响应状态码   |
| data    | Policy | 更新后的制度 |
| message | string | 响应消息     |

## 2. 条款管理

### 2.1 获取条款列表

- **接口名称**: 获取条款列表
- **逻辑描述**: 获取指定制度下的所有条款。
- **接口相对路径**: `/api/policy/:policyId/clauses`
- **请求方式**: GET

#### 入参

| 字段名   | 类型   | 必填 | 描述   |
| :------- | :----- | :--- | :----- |
| policyId | string | 是   | 制度ID |

#### 返回值

| 字段名  | 类型           | 描述       |
| :------ | :------------- | :--------- |
| code    | number         | 响应状态码 |
| data    | PolicyClause[] | 条款列表   |
| message | string         | 响应消息   |

**PolicyClause 结构**:

| 字段名       | 类型   | 描述              |
| :----------- | :----- | :---------------- |
| id           | string | 条款ID            |
| policyId     | string | 所属制度ID        |
| clauseCode   | string | 条款编号          |
| title        | string | 条款标题          |
| content      | string | 条款内容 (HTML)   |
| summary      | string | 摘要              |
| source       | string | 来源 (ai, manual) |
| originalText | string | 引用原文          |
| order        | number | 排序              |

### 2.2 新增条款

- **接口名称**: 新增条款
- **逻辑描述**: 在指定制度下添加新条款。
- **接口相对路径**: `/api/policy/clauses`
- **请求方式**: POST

#### 入参

| 字段名     | 类型   | 必填 | 描述   |
| :--------- | :----- | :--- | :----- |
| policyId   | string | 是   | 制度ID |
| title      | string | 是   | 标题   |
| content    | string | 是   | 内容   |
| clauseCode | string | 否   | 编号   |

#### 返回值

| 字段名  | 类型         | 描述       |
| :------ | :----------- | :--------- |
| code    | number       | 响应状态码 |
| data    | PolicyClause | 创建的条款 |
| message | string       | 响应消息   |

### 2.3 更新条款

- **接口名称**: 更新条款
- **逻辑描述**: 更新指定ID的条款内容。
- **接口相对路径**: `/api/policy/clauses/:id`
- **请求方式**: PUT

#### 入参

| 字段名       | 类型   | 必填 | 描述              |
| :----------- | :----- | :--- | :---------------- |
| id           | string | 是   | 条款ID            |
| policyId     | string | 否   | 所属制度ID        |
| clauseCode   | string | 否   | 条款编号          |
| title        | string | 否   | 条款标题          |
| content      | string | 否   | 条款内容 (HTML)   |
| summary      | string | 否   | 摘要              |
| source       | string | 否   | 来源 (ai, manual) |
| originalText | string | 否   | 引用原文          |
| order        | number | 否   | 排序              |

#### 返回值

| 字段名  | 类型         | 描述         |
| :------ | :----------- | :----------- |
| code    | number       | 响应状态码   |
| data    | PolicyClause | 更新后的条款 |
| message | string       | 响应消息     |

### 2.4 删除条款

- **接口名称**: 删除条款
- **逻辑描述**: 删除指定ID的条款。
- **接口相对路径**: `/api/policy/clauses/:id`
- **请求方式**: DELETE

#### 入参

| 字段名 | 类型   | 必填 | 描述   |
| :----- | :----- | :--- | :----- |
| id     | string | 是   | 条款ID |

#### 返回值

| 字段名  | 类型    | 描述       |
| :------ | :------ | :--------- |
| code    | number  | 响应状态码 |
| data    | boolean | 成功标识   |
| message | string  | 响应消息   |

## 3. 版本与发布

### 3.1 获取版本历史

- **接口名称**: 获取版本历史
- **逻辑描述**: 获取制度的文件版本历史。
- **接口相对路径**: `/api/policy/:policyId/versions`
- **请求方式**: GET

#### 入参

| 字段名   | 类型   | 必填 | 描述   |
| :------- | :----- | :--- | :----- |
| policyId | string | 是   | 制度ID |

#### 返回值

| 字段名  | 类型            | 描述       |
| :------ | :-------------- | :--------- |
| code    | number          | 响应状态码 |
| data    | PolicyVersion[] | 版本列表   |
| message | string          | 响应消息   |

### 3.2 获取发布记录

- **接口名称**: 获取发布记录
- **逻辑描述**: 获取制度的发布变更记录。
- **接口相对路径**: `/api/policy/:policyId/releases`
- **请求方式**: GET

#### 入参

| 字段名   | 类型   | 必填 | 描述   |
| :------- | :----- | :--- | :----- |
| policyId | string | 是   | 制度ID |

#### 返回值

| 字段名  | 类型            | 描述         |
| :------ | :-------------- | :----------- |
| code    | number          | 响应状态码   |
| data    | PolicyRelease[] | 发布记录列表 |
| message | string          | 响应消息     |

### 3.3 发布新版本

- **接口名称**: 发布新版本
- **逻辑描述**: 发布制度的新版本记录。
- **接口相对路径**: `/api/policy/releases`
- **请求方式**: POST

#### 入参

| 字段名   | 类型   | 必填 | 描述     |
| :------- | :----- | :--- | :------- |
| policyId | string | 是   | 制度ID   |
| version  | string | 是   | 版本号   |
| title    | string | 是   | 标题     |
| content  | string | 是   | 变更内容 |

#### 返回值

| 字段名  | 类型          | 描述       |
| :------ | :------------ | :--------- |
| code    | number        | 响应状态码 |
| data    | PolicyRelease | 发布记录   |
| message | string        | 响应消息   |
