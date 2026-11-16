[TOC]

# 附件分类接口文档

本文档描述了附件分类模块的相关接口，包括附件组、附件分类、分类策略及测试功能。

## 1. 附件组管理

### 1.1 获取附件组列表

- **接口名称**: 获取附件组列表
- **逻辑描述**: 获取所有附件组定义。
- **接口相对路径**: `/api/attachment/groups`
- **请求方式**: GET

#### 入参

无

#### 返回值

| 字段名  | 类型              | 描述       |
| :------ | :---------------- | :--------- |
| code    | number            | 响应状态码 |
| data    | AttachmentGroup[] | 附件组列表 |
| message | string            | 响应消息   |

**AttachmentGroup 结构**:

| 字段名      | 类型    | 描述     |
| :---------- | :------ | :------- |
| id          | string  | 组ID     |
| code        | string  | 组编码   |
| name        | string  | 组名称   |
| description | string  | 描述     |
| enabled     | boolean | 是否启用 |
| createdAt   | string  | 创建时间 |
| updatedAt   | string  | 更新时间 |

### 1.2 新增附件组

- **接口名称**: 新增附件组
- **逻辑描述**: 创建新的附件组。
- **接口相对路径**: `/api/attachment/groups`
- **请求方式**: POST

#### 入参

| 字段名      | 类型    | 必填 | 描述     |
| :---------- | :------ | :--- | :------- |
| code        | string  | 是   | 组编码   |
| name        | string  | 是   | 组名称   |
| description | string  | 否   | 描述     |
| enabled     | boolean | 否   | 是否启用 |

#### 返回值

| 字段名  | 类型            | 描述         |
| :------ | :-------------- | :----------- |
| code    | number          | 响应状态码   |
| data    | AttachmentGroup | 创建的附件组 |
| message | string          | 响应消息     |

## 2. 附件分类管理

### 2.1 获取分类列表

- **接口名称**: 获取分类列表
- **逻辑描述**: 获取所有附件分类定义。
- **接口相对路径**: `/api/attachment/classifications`
- **请求方式**: GET

#### 入参

无

#### 返回值

| 字段名  | 类型                       | 描述       |
| :------ | :------------------------- | :--------- |
| code    | number                     | 响应状态码 |
| data    | AttachmentClassification[] | 分类列表   |
| message | string                     | 响应消息   |

**AttachmentClassification 结构**:

| 字段名         | 类型        | 描述                   |
| :------------- | :---------- | :--------------------- |
| id             | string      | 分类ID                 |
| groupId        | string      | 所属组ID               |
| name           | string      | 分类名称               |
| code           | string      | 分类编码               |
| description    | string      | 描述                   |
| enabled        | boolean     | 是否启用               |
| extractionMode | string      | 取数模式 (OCR, VISION) |
| ocrVendor      | string      | OCR供应商              |
| recognizeCover | boolean     | 是否识别封面           |
| llmModel       | string      | LLM模型                |
| visionModel    | string      | 视觉模型(仅Vision模式) |
| fieldRules     | FieldRule[] | 字段提取规则           |
| createdAt      | string      | 创建时间               |
| updatedAt      | string      | 更新时间               |

### 2.2 新增附件分类

- **接口名称**: 新增附件分类
- **逻辑描述**: 创建新的附件分类配置。
- **接口相对路径**: `/api/attachment/classifications`
- **请求方式**: POST

#### 入参

| 字段名         | 类型        | 必填 | 描述         |
| :------------- | :---------- | :--- | :----------- |
| groupId        | string      | 否   | 所属组ID     |
| name           | string      | 是   | 名称         |
| code           | string      | 是   | 编码         |
| description    | string      | 否   | 描述         |
| enabled        | boolean     | 否   | 是否启用     |
| extractionMode | string      | 否   | 取数模式     |
| ocrVendor      | string      | 否   | OCR供应商    |
| recognizeCover | boolean     | 否   | 是否识别封面 |
| llmModel       | string      | 否   | LLM模型      |
| visionModel    | string      | 否   | 视觉模型     |
| fieldRules     | FieldRule[] | 否   | 字段提取规则 |

#### 返回值

| 字段名  | 类型                     | 描述       |
| :------ | :----------------------- | :--------- |
| code    | number                   | 响应状态码 |
| data    | AttachmentClassification | 创建的分类 |
| message | string                   | 响应消息   |

### 2.3 更新字段提取规则

- **接口名称**: 更新字段提取规则
- **逻辑描述**: 更新指定分类的字段提取规则列表。
- **接口相对路径**: `/api/attachment/classifications/:id/rules`
- **请求方式**: PUT

#### 入参

| 字段名           | 类型        | 必填 | 描述              |
| :--------------- | :---------- | :--- | :---------------- |
| classificationId | string      | 是   | 分类ID (路径参数) |
| fieldRules       | FieldRule[] | 是   | 规则列表          |

**FieldRule 结构**:

| 字段名   | 类型    | 描述     |
| :------- | :------ | :------- |
| name     | string  | 字段名称 |
| code     | string  | 字段编码 |
| type     | string  | 字段类型 |
| prompt   | string  | 提示词   |
| regex    | string  | 正则校验 |
| required | boolean | 是否必填 |

#### 返回值

| 字段名  | 类型        | 描述             |
| :------ | :---------- | :--------------- |
| code    | number      | 响应状态码       |
| data    | FieldRule[] | 更新后的规则列表 |
| message | string      | 响应消息         |

## 3. 分类策略配置

### 3.1 获取分类策略

- **接口名称**: 获取分类策略
- **逻辑描述**: 获取全局分类策略配置。
- **接口相对路径**: `/api/attachment/strategy`
- **请求方式**: GET

#### 入参

无

#### 返回值

| 字段名  | 类型                   | 描述       |
| :------ | :--------------------- | :--------- |
| code    | number                 | 响应状态码 |
| data    | ClassificationStrategy | 策略配置   |
| message | string                 | 响应消息   |

**ClassificationStrategy 结构**:

| 字段名             | 类型   | 描述         |
| :----------------- | :----- | :----------- |
| strategyMode       | string | 策略模式     |
| defaultOCR         | string | 默认OCR      |
| defaultTextLLM     | string | 默认文本模型 |
| defaultVisionModel | string | 默认视觉模型 |

## 4. 测试相关

### 4.1 快速测试

- **接口名称**: 快速测试
- **逻辑描述**: 上传单个文件进行快速分类测试。
- **接口相对路径**: `/api/attachment/test/quick`
- **请求方式**: POST

#### 入参

| 字段名           | 类型   | 必填 | 描述       |
| :--------------- | :----- | :--- | :--------- |
| classificationId | string | 是   | 目标分类ID |
| file             | File   | 是   | 上传的文件 |

#### 返回值

| 字段名  | 类型           | 描述       |
| :------ | :------------- | :--------- |
| code    | number         | 响应状态码 |
| data    | FileTestResult | 测试结果   |
| message | string         | 响应消息   |

### 4.2 批量测试

- **接口名称**: 批量测试
- **逻辑描述**: 批量上传文件进行分类和提取测试。
- **接口相对路径**: `/api/attachment/test/batch`
- **请求方式**: POST

#### 入参

| 字段名                  | 类型     | 必填 | 描述           |
| :---------------------- | :------- | :--- | :------------- |
| files                   | File[]   | 是   | 文件列表       |
| selectedClassifications | string[] | 是   | 参测分类ID列表 |
| enableExtraction        | boolean  | 是   | 是否提取字段   |

#### 返回值

| 字段名  | 类型             | 描述         |
| :------ | :--------------- | :----------- |
| code    | number           | 响应状态码   |
| data    | FileTestResult[] | 测试结果列表 |
| message | string           | 响应消息     |
