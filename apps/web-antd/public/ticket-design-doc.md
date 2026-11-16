# 智能工单应用 & 工单助理数字员工 · 技术设计文档

## 1. 系统概述

智能工单应用是一套面向设备运维场景的工单全生命周期管理系统，配合「工单助理」数字员0工，通过对话式交互覆盖工单创建、派单、处理、闭环的完整链路。系统采用前端 Mock 数据驱动，核心模块均在 `apps/web-antd` 中实现。

| 维度   | 说明                                                                               |
| ---- | -------------------------------------------------------------------------------- |
| 技术栈  | Vue 3 + Vite + TypeScript + Ant Design Vue + Vben Admin 5.0                      |
| 数据模式 | 前端内存 Mock（`mock-data-ticket.ts` / `mock-data-mate.ts`），无需后端                      |
| 应用入口 | `/app/mate/apps/smart-ticket`（管理后台）/ `/app/mate/employee/ticket-assistant`（数字员工） |
| 角色模型 | 客户经理、公司员工、一线人员、运维人员（同一人可兼任多角色，权限叠加）                                              |

***

## 2. 系统架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Mate App Shell (mate-app-shell.vue)        │
├──────────────────────────┬──────────────────────────────────┤
│   智能工单应用 (smart-ticket)  │   工单助理数字员工 (ticket-assistant) │
│  ┌────────────────────┐  │  ┌─────────────────────────────┐ │
│  │ 工单中心            │  │  │ 对话页 (ticket-chat.vue)     │ │
│  │  ├ 工单概览         │  │  │  ├ 创建内/外部工单            │ │
│  │  └ 工单查询         │  │  │  ├ 现场打卡                   │ │
│  │ 主数据管理          │  │  │  ├ 提交解决方案               │ │
│  │  ├ 资产管理         │  │  │  └ 查看我的工单               │ │
│  │  └ 运维人员         │  │  │ 我的工单 (my-tickets.vue)    │ │
│  │ 实施中心            │  │  │ 工单中心 (ticket-center.vue)  │ │
│  │  ├ 场景管理         │  │  │ 工单详情 (ticket-detail.vue)  │ │
│  │  └ 工单权限         │  │  │ 知识库 (knowledge-base.vue)   │ │
│  │ 场景配置向导        │  │  └─────────────────────────────┘ │
│  │  ├ 场景描述         │  └──────────────────────────────────┘
│  │  ├ 单据模型         │          API 层 (src/api/ticket.ts)
│  │  ├ 派单规则         │          ├ CRUD: 工单/资产/派单规则/SLA
│  │  ├ 状态流转         │          ├ 派单/转派/打卡/闭环
│  │  ├ SLA 配置         │          └ 制度文件解析
│  │  └ 测试发布         │
│  │ 制度文件解析        │          Mock 层 (mock-data-ticket.ts)
│  └────────────────────┘
└─────────────────────────────────────────────────────────────┘
```

### 2.2 路由分层

- **管理后台路由**：`/app/mate/apps/smart-ticket/*`，由 `ticket-app-workspace.vue` 作为容器，左侧菜单分组导航。
- **数字员工路由**：`/app/mate/employee/:employeeId/*`，通过 `employee-workspace.vue` 根据 `employeeId` 分发到对应会话页。
- 路由定义集中在 `core.ts`。

***

## 3. 核心模块设计

### 3.1 场景配置向导（Wizard）

场景是工单系统的核心抽象，每个场景对应一套完整的工单流程配置。向导采用六步式配置：

| 步骤        | 页面                       | 职责                                   |
| --------- | ------------------------ | ------------------------------------ |
| 1. 场景描述   | scenario-description.vue | 定义场景名称、编码、适用范围、业务描述                  |
| 2. 单据模型   | field-review\.vue        | 配置工单字段（来源：数据字典）、字段属性、必填/只读           |
| 3. 派单规则   | dispatch-rules.vue       | 匹配条件 → 派单目标（按岗位/具体人员），支持优先级排序        |
| 4. 状态流转   | custom-status.vue        | 自定义工单状态机与流转动作                        |
| 5. SLA 配置 | sla-config.vue           | 按设备类型/客户等级/故障级别/在保状态计算响应与解决时效，配置超时告警 |
| 6. 测试发布   | test-publish.vue         | 模拟流转测试，确认后发布生效                       |

**版本管理**：场景支持多版本，`latestVersion`（最新版本号）与 `latestStatus`（草稿/已发布）分离，已发布版本可查看、草稿版本可编辑、可创建新版本。

### 3.2 派单规则引擎

**数据结构**（`DispatchRule`）：

- `matchConditions`：匹配条件（场景、工单类型、客户等级、故障等级、在保状态等）
- `targetMode`：派单目标模式 — `position`（按岗位）/ `person`（按具体人员）
- `targetPosition` / `targetPersonId`：目标岗位或人员
- `priority`：规则优先级（数值越小优先级越高）

**关键机制**：

- 转派受派单规则约束，转派后 SLA 重新计时，避免责任真空
- 支持按岗位批量匹配（运维人员列表按岗位分组维护）

### 3.3 SLA 与超时告警

**SLA 计算维度**：设备类型 × 客户等级 × 故障级别 × 设备在保状态 → 响应时效 + 解决时效。

**告警配置**（`SlaAlertConfig`）：

- `stage`：告警阶段 — `response`（未响应）/ `resolve`（未解决）
- `threshold`：超时阈值（分钟）
- `notifyRoles`：通知对象角色
- `channels`：通知渠道 — `in-app`（站内信）/ `email`（邮件）/ `wecom`（企业微信），多渠道并行

### 3.4 工单权限模型

按「工单 × 状态」二维维度配置字段级权限：

- 每个工单类型（运维工单/需求工单/上门工单）在每个状态下，对每个字段独立配置「显示权限」与「编辑权限」
- 适用角色：管理员、工程师、客服、财务、普通员工
- 字段来源：场景单据模型中定义的字段集合

### 3.5 制度文件解析

document-parse.vue 支持上传售后制度文件，自动解析生成派单规则与 SLA 草稿，经人工复核后生效。解析状态：`draft` / `confirmed` / `rejected`。

***

## 4. 工单助理数字员工

### 4.1 定位与角色

工单助理（`ticket-assistant`）是运维工单全生命周期管理数字员工，面向客户经理、公司员工、运维人员与一线人员（支持一人兼任多角色）。

定义位于 `mock-data-mate.ts`，核心属性：`role`、`description`、`quickPrompts`、`profile`（受众、核心能力、亮点、场景）。

### 4.2 对话式交互设计

`ticket-chat.vue` 实现数字员工对话页：

**快捷指令**：

- 创建内部工单 / 创建外部工单
- 查看我的工单
- 现场打卡
- 提交解决方案

**对话式工单创建流程**：

```
用户描述现场现象
   ↓
引导采集：设备编号 → 故障现象 → 复现方式 → 影响范围 → 优先级建议
   ↓
自动匹配资产台账与在保状态（关联 TicketDevice）
   ↓
生成工单草稿，用户确认后提交（createWorkOrderApi）
```

**关键表单**：

- `reportForm`：售后报修信息采集（设备编号、客户、联系人、故障现象、复现方式、环境、优先级）
- `ticketForm`：工单创建（标题、类型、资产、客户、联系人、优先级、描述、内/外部）

### 4.3 核心能力

1. **工单分类管理**：内部工单（公司员工发起）与外部工单（运维人员发起）共用同一套状态机，仅按使用对象标记分类
2. **故障附件管理**：支持现场照片、短视频、报错截图、录音等材料随工单上传
3. **现场决策记录**：客户经理判定是否前往现场，系统记录判定结果并据此要求现场打卡留痕
4. **现场打卡留痕**：前往现场时上传带时间与地点水印的照片，作为服务质量追溯凭证
5. **处理闭环管理**：解决方案必填 + 视频/截图凭证上传 + 现场打卡记录，三项齐备方可闭环
6. **SLA 多维度计算**：按资产类型、客户等级、故障级别、资产在保状态分别计算响应与解决时效
7. **超时多渠道告警**：站内消息、邮件、企业微信并行通知

***

## 5. 数据库设计

### 5.1 表命名规范

- **设置/配置类**：前缀 `wo_sys_`（管理员在实施中心维护，数据量小、变更低频）
- **业务数据类**：前缀 `wo_data_`（工单运行过程中产生，数据量大、写入频繁）
- 数据库：MySQL 8.0，InnoDB 引擎，utf8mb4 字符集，所有业务表带 `is_deleted` 软删除字段

### 5.2 表总览（共 14 张）

**设置相关表（`wo_sys_`，10 张）**

| 表名                                 | 说明          |
| ---------------------------------- | ----------- |
| wo\_sys\_scenario           | 场景表         |
| wo\_sys\_scenario\_version  | 场景版本表       |
| wo\_sys\_field              | 单据模型字段表     |
| wo\_sys\_custom\_status     | 自定义状态与流转表   |
| wo\_sys\_dispatch\_rule     | 派单规则表       |
| wo\_sys\_sla\_config        | SLA 配置表     |
| wo\_sys\_sla\_alert\_config | SLA 超时告警配置表 |
| wo\_sys\_field\_permission  | 字段权限配置表     |
| wo\_sys\_ops\_staff         | 运维人员表       |
| wo\_sys\_device             | 资产表       |

**业务数据相关表（`wo_data_`，4 张）**

| 表名                                         | 说明             |
| ------------------------------------------ | -------------- |
| wo\_data\_work\_order               | 工单主表           |
| wo\_data\_work\_order\_field\_value | 工单自定义字段值表（EAV） |
| wo\_data\_timeline\_event           | 工单流转事件表        |
| wo\_data\_attachment                | 附件表            |

> 用户角色关系复用系统已有用户角色体系，不单独建表。

### 5.3 设置相关表 DDL

#### 5.3.1 wo\_sys\_scenario（场景表）

```sql
CREATE TABLE `wo_sys_scenario` (
  `id`                       BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `code`                     VARCHAR(64)  NOT NULL COMMENT '场景编码（如 ops-ticket）',
  `name`                     VARCHAR(128) NOT NULL COMMENT '场景名称（如 运维工单）',
  `description`              VARCHAR(512)          DEFAULT NULL COMMENT '场景描述',
  `status`                   TINYINT      NOT NULL DEFAULT 1 COMMENT '状态：1=草稿 2=已发布 3=已归档',
  `latest_version`           VARCHAR(32)           DEFAULT NULL COMMENT '最新版本号（如 v1.2.0）',
  `latest_status`            TINYINT      NOT NULL DEFAULT 1 COMMENT '最新版本状态：1=草稿 2=已发布',
  `last_published_version`   VARCHAR(32)           DEFAULT NULL COMMENT '最后发布的版本号',
  `created_by`               BIGINT                DEFAULT NULL COMMENT '创建人ID',
  `created_by_name`          VARCHAR(64)           DEFAULT NULL COMMENT '创建人姓名',
  `created_at`               DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`               DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted`               TINYINT      NOT NULL DEFAULT 0 COMMENT '软删除：0=正常 1=已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='场景表';
```

#### 5.3.2 wo\_sys\_scenario\_version（场景版本表）

```sql
CREATE TABLE `wo_sys_scenario_version` (
  `id`               BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `scenario_id`      BIGINT       NOT NULL COMMENT '场景ID',
  `version`          VARCHAR(32)  NOT NULL COMMENT '版本号（如 v1.2.0）',
  `status`           TINYINT      NOT NULL DEFAULT 1 COMMENT '版本状态：1=草稿 2=已发布',
  `note`             VARCHAR(512)          DEFAULT NULL COMMENT '版本说明',
  `config_snapshot`  JSON                  DEFAULT NULL COMMENT '配置快照（字段模型/派单规则/SLA等JSON）',
  `published_by`     BIGINT                DEFAULT NULL COMMENT '发布人ID',
  `published_by_name` VARCHAR(64)          DEFAULT NULL COMMENT '发布人姓名',
  `published_at`     DATETIME              DEFAULT NULL COMMENT '发布时间',
  `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `is_deleted`       TINYINT      NOT NULL DEFAULT 0 COMMENT '软删除：0=正常 1=已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_scenario_version` (`scenario_id`, `version`),
  KEY `idx_scenario_id` (`scenario_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='场景版本表';
```

#### 5.3.3 wo\_sys\_field（单据模型字段表）

```sql
CREATE TABLE `wo_sys_field` (
  `id`               BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `scenario_id`      BIGINT       NOT NULL COMMENT '场景ID',
  `field_key`        VARCHAR(64)  NOT NULL COMMENT '字段标识（如 fault_level）',
  `field_name`       VARCHAR(128) NOT NULL COMMENT '字段名称（如 故障等级）',
  `field_type`       VARCHAR(32)  NOT NULL COMMENT '字段类型：text/textarea/select/date/datetime/number/file',
  `dict_code`        VARCHAR(64)           DEFAULT NULL COMMENT '数据字典编码（select类型时使用）',
  `is_required`      TINYINT      NOT NULL DEFAULT 0 COMMENT '是否必填：0=否 1=是',
  `is_readonly`      TINYINT      NOT NULL DEFAULT 0 COMMENT '是否只读：0=否 1=是',
  `sort_order`       INT          NOT NULL DEFAULT 0 COMMENT '排序序号',
  `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted`       TINYINT      NOT NULL DEFAULT 0 COMMENT '软删除：0=正常 1=已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_scenario_field_key` (`scenario_id`, `field_key`),
  KEY `idx_scenario_id` (`scenario_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='单据模型字段表';
```

#### 5.3.4 wo\_sys\_custom\_status（自定义状态与流转表）

```sql
CREATE TABLE `wo_sys_custom_status` (
  `id`               BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `scenario_id`      BIGINT       NOT NULL COMMENT '场景ID',
  `status_code`      VARCHAR(32)  NOT NULL COMMENT '状态编码（如 pending）',
  `status_name`      VARCHAR(64)  NOT NULL COMMENT '状态名称（如 待派单）',
  `status_type`      VARCHAR(16)  NOT NULL COMMENT '状态类型：todo/doing/done/cancel',
  `sort_order`       INT          NOT NULL DEFAULT 0 COMMENT '排序序号',
  `is_initial`       TINYINT      NOT NULL DEFAULT 0 COMMENT '是否初始状态：0=否 1=是',
  `allowed_actions`  JSON                  DEFAULT NULL COMMENT '允许的流转动作（JSON数组）',
  `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `is_deleted`       TINYINT      NOT NULL DEFAULT 0 COMMENT '软删除：0=正常 1=已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_scenario_status_code` (`scenario_id`, `status_code`),
  KEY `idx_scenario_id` (`scenario_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='自定义状态与流转表';
```

#### 5.3.5 wo\_sys\_dispatch\_rule（派单规则表）

```sql
CREATE TABLE `wo_sys_dispatch_rule` (
  `id`               BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `scenario_id`      BIGINT       NOT NULL COMMENT '场景ID',
  `rule_name`        VARCHAR(128) NOT NULL COMMENT '规则名称',
  `priority`         INT          NOT NULL DEFAULT 0 COMMENT '优先级（数值越小优先级越高）',
  `match_conditions` JSON         NOT NULL COMMENT '匹配条件（JSON：工单类型/客户等级/故障等级/在保状态等）',
  `target_mode`      VARCHAR(16)  NOT NULL COMMENT '派单目标模式：position=按岗位 person=按具体人员',
  `target_position`  VARCHAR(64)           DEFAULT NULL COMMENT '目标岗位（target_mode=position时）',
  `target_person_id` BIGINT                DEFAULT NULL COMMENT '目标人员ID（target_mode=person时）',
  `is_enabled`       TINYINT      NOT NULL DEFAULT 1 COMMENT '是否启用：0=禁用 1=启用',
  `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted`       TINYINT      NOT NULL DEFAULT 0 COMMENT '软删除：0=正常 1=已删除',
  PRIMARY KEY (`id`),
  KEY `idx_scenario_priority` (`scenario_id`, `priority`),
  KEY `idx_target_person` (`target_person_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='派单规则表';
```

#### 5.3.6 wo\_sys\_sla\_config（SLA 配置表）

```sql
CREATE TABLE `wo_sys_sla_config` (
  `id`               BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `scenario_id`      BIGINT       NOT NULL COMMENT '场景ID',
  `device_category`  VARCHAR(64)           DEFAULT NULL COMMENT '资产类别（NULL表示不限）',
  `customer_level`   VARCHAR(32)           DEFAULT NULL COMMENT '客户等级（NULL表示不限）',
  `fault_level`      VARCHAR(32)           DEFAULT NULL COMMENT '故障等级（NULL表示不限）',
  `warranty_status`  VARCHAR(32)           DEFAULT NULL COMMENT '在保状态：in-warranty/expiring/expired（NULL表示不限）',
  `response_time`    INT          NOT NULL COMMENT '响应时效（分钟）',
  `resolve_time`     INT          NOT NULL COMMENT '解决时效（分钟）',
  `is_enabled`       TINYINT      NOT NULL DEFAULT 1 COMMENT '是否启用：0=禁用 1=启用',
  `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted`       TINYINT      NOT NULL DEFAULT 0 COMMENT '软删除：0=正常 1=已删除',
  PRIMARY KEY (`id`),
  KEY `idx_scenario_conditions` (`scenario_id`, `device_category`, `customer_level`, `fault_level`, `warranty_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='SLA配置表';
```

#### 5.3.7 wo\_sys\_sla\_alert\_config（SLA 超时告警配置表）

```sql
CREATE TABLE `wo_sys_sla_alert_config` (
  `id`               BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `sla_config_id`    BIGINT       NOT NULL COMMENT 'SLA配置ID',
  `alert_stage`      VARCHAR(16)  NOT NULL COMMENT '告警阶段：response=未响应 resolve=未解决',
  `threshold`        INT          NOT NULL COMMENT '超时阈值（分钟，相对SLA时效的提前量）',
  `notify_roles`     JSON         NOT NULL COMMENT '通知对象角色（JSON数组）',
  `channels`         JSON         NOT NULL COMMENT '通知渠道（JSON数组：in-app/email/wecom）',
  `is_enabled`       TINYINT      NOT NULL DEFAULT 1 COMMENT '是否启用：0=禁用 1=启用',
  `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `is_deleted`       TINYINT      NOT NULL DEFAULT 0 COMMENT '软删除：0=正常 1=已删除',
  PRIMARY KEY (`id`),
  KEY `idx_sla_config_id` (`sla_config_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='SLA超时告警配置表';
```

#### 5.3.8 wo\_sys\_field\_permission（字段权限配置表）

```sql
CREATE TABLE `wo_sys_field_permission` (
  `id`             BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `scenario_id`    BIGINT       NOT NULL COMMENT '场景ID',
  `status_code`    VARCHAR(32)  NOT NULL COMMENT '工单状态编码',
  `role_code`      VARCHAR(32)  NOT NULL COMMENT '角色编码：admin/engineer/service/finance/employee',
  `field_key`      VARCHAR(64)  NOT NULL COMMENT '字段标识',
  `can_show`       TINYINT      NOT NULL DEFAULT 1 COMMENT '显示权限：0=不可见 1=可见',
  `can_edit`       TINYINT      NOT NULL DEFAULT 1 COMMENT '编辑权限：0=不可编辑 1=可编辑',
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_scenario_status_role_field` (`scenario_id`, `status_code`, `role_code`, `field_key`),
  KEY `idx_scenario_id` (`scenario_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='字段权限配置表';
```

#### 5.3.9 wo\_sys\_ops\_staff（运维人员表）

```sql
CREATE TABLE `wo_sys_ops_staff` (
  `id`            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `code`          VARCHAR(32)  NOT NULL COMMENT '工号',
  `name`          VARCHAR(64)  NOT NULL COMMENT '姓名',
  `position`      VARCHAR(64)  NOT NULL COMMENT '岗位',
  `team`          VARCHAR(64)           DEFAULT NULL COMMENT '所属团队',
  `phone`         VARCHAR(32)  NOT NULL COMMENT '联系电话',
  `email`         VARCHAR(128)          DEFAULT NULL COMMENT '邮箱',
  `wecom_id`      VARCHAR(64)           DEFAULT NULL COMMENT '企业微信账号',
  `area`          VARCHAR(256)          DEFAULT NULL COMMENT '服务区域',
  `status`        VARCHAR(16)  NOT NULL DEFAULT 'on' COMMENT '状态：on=在岗 rest=休息',
  `enabled`       TINYINT      NOT NULL DEFAULT 1 COMMENT '是否启用：0=禁用 1=启用',
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted`    TINYINT      NOT NULL DEFAULT 0 COMMENT '软删除：0=正常 1=已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_position` (`position`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='运维人员表';
```

#### 5.3.10 wo\_sys\_device（资产表）

```sql
CREATE TABLE `wo_sys_device` (
  `id`                   BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `code`                 VARCHAR(64)  NOT NULL COMMENT '资产编号',
  `name`                 VARCHAR(128) NOT NULL COMMENT '资产名称',
  `model`                VARCHAR(128)          DEFAULT NULL COMMENT '型号',
  `category`             VARCHAR(64)           DEFAULT NULL COMMENT '类别（打印产品/包装产品等）',
  `customer`             VARCHAR(128)          DEFAULT NULL COMMENT '所属客户',
  `customer_level`       VARCHAR(32)           DEFAULT NULL COMMENT '客户等级',
  `location`             VARCHAR(256)          DEFAULT NULL COMMENT '安装位置',
  `status`               VARCHAR(16)  NOT NULL DEFAULT 'normal' COMMENT '状态：normal/fault/maintenance/offline',
  `warranty_status`      VARCHAR(16)  NOT NULL DEFAULT 'in-warranty' COMMENT '质保状态：in-warranty/expiring/expired',
  `warranty_start_date`  DATE                  DEFAULT NULL COMMENT '质保起始日期',
  `warranty_end_date`    DATE                  DEFAULT NULL COMMENT '质保结束日期',
  `warranty_description` VARCHAR(512)          DEFAULT NULL COMMENT '质保说明',
  `install_date`         DATE                  DEFAULT NULL COMMENT '安装日期',
  `last_maintenance`     DATE                  DEFAULT NULL COMMENT '上次保养日期',
  `created_at`           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted`           TINYINT      NOT NULL DEFAULT 0 COMMENT '软删除：0=正常 1=已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_customer` (`customer`),
  KEY `idx_status` (`status`),
  KEY `idx_warranty_status` (`warranty_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资产表';
```

### 5.4 业务数据相关表 DDL

#### 5.4.1 wo\_data\_work\_order（工单主表）

```sql
CREATE TABLE `wo_data_work_order` (
  `id`                  BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `code`                VARCHAR(32)  NOT NULL COMMENT '工单编号',
  `title`               VARCHAR(256) NOT NULL COMMENT '工单标题',
  `scenario_code`       VARCHAR(64)  NOT NULL COMMENT '场景编码',
  `type`                VARCHAR(64)  NOT NULL COMMENT '工单类型（设备故障/定期保养等）',
  `category`            VARCHAR(16)  NOT NULL DEFAULT 'external' COMMENT '工单分类：internal=内部工单 external=外部工单',
  `status`              VARCHAR(32)  NOT NULL DEFAULT 'pending' COMMENT '工单状态：pending/dispatched/processing/pending-acceptance/completed/closed/cancelled',
  `priority`            VARCHAR(16)  NOT NULL DEFAULT 'medium' COMMENT '优先级：low/medium/high/urgent',
  `fault_level`         VARCHAR(32)           DEFAULT NULL COMMENT '故障等级',
  `customer`            VARCHAR(128)          DEFAULT NULL COMMENT '客户名称',
  `customer_level`      VARCHAR(32)           DEFAULT NULL COMMENT '客户等级',
  `contact`             VARCHAR(64)           DEFAULT NULL COMMENT '联系人',
  `contact_phone`       VARCHAR(32)           DEFAULT NULL COMMENT '联系电话',
  `device_id`           BIGINT                DEFAULT NULL COMMENT '资产ID',
  `device_code`         VARCHAR(64)           DEFAULT NULL COMMENT '资产编号（冗余）',
  `device_name`         VARCHAR(128)          DEFAULT NULL COMMENT '资产名称（冗余）',
  `assignee_id`         BIGINT                DEFAULT NULL COMMENT '处理人ID',
  `assignee_name`       VARCHAR(64)           DEFAULT NULL COMMENT '处理人姓名',
  `creator_id`          BIGINT                DEFAULT NULL COMMENT '创建人ID',
  `creator_name`        VARCHAR(64)           DEFAULT NULL COMMENT '创建人姓名',
  `creator_role`        VARCHAR(32)           DEFAULT NULL COMMENT '创建人角色',
  `description`         TEXT                  DEFAULT NULL COMMENT '问题描述',
  `reproduce`           TEXT                  DEFAULT NULL COMMENT '复现方式',
  `environment`         VARCHAR(512)          DEFAULT NULL COMMENT '环境信息',
  `solution`            TEXT                  DEFAULT NULL COMMENT '解决方案',
  `on_site_decision`    TINYINT               DEFAULT NULL COMMENT '客户经理现场决策：0=不前往 1=前往',
  `on_site_decided_by`  BIGINT                DEFAULT NULL COMMENT '现场决策人ID',
  `on_site_decided_at`  DATETIME              DEFAULT NULL COMMENT '现场决策时间',
  `sla_response_time`   INT                   DEFAULT NULL COMMENT '响应时效（分钟）',
  `sla_resolve_time`    INT                   DEFAULT NULL COMMENT '解决时效（分钟）',
  `responded_at`        DATETIME              DEFAULT NULL COMMENT '响应时间',
  `resolved_at`         DATETIME              DEFAULT NULL COMMENT '解决时间',
  `accepted_at`         DATETIME              DEFAULT NULL COMMENT '验收通过时间',
  `closed_at`           DATETIME              DEFAULT NULL COMMENT '关闭时间',
  `evaluation_score`    TINYINT               DEFAULT NULL COMMENT '客户评价评分（1-5）',
  `evaluation_comment`  VARCHAR(512)          DEFAULT NULL COMMENT '客户评价内容',
  `created_at`          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted`          TINYINT      NOT NULL DEFAULT 0 COMMENT '软删除：0=正常 1=已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_status` (`status`),
  KEY `idx_scenario_code` (`scenario_code`),
  KEY `idx_assignee` (`assignee_id`),
  KEY `idx_creator` (`creator_id`),
  KEY `idx_device_id` (`device_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工单主表';
```

#### 5.4.2 wo\_data\_work\_order\_field\_value（工单自定义字段值表 EAV）

工单主表只存通用固定字段，场景配置的自定义字段值通过此 EAV 扩展表存储。

```sql
CREATE TABLE `wo_data_work_order_field_value` (
  `id`             BIGINT        NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `work_order_id`  BIGINT        NOT NULL COMMENT '工单ID',
  `scenario_id`    BIGINT        NOT NULL COMMENT '场景ID（冗余，便于按场景批量查询）',
  `field_id`       BIGINT        NOT NULL COMMENT '字段ID（关联 wo_sys_field.id）',
  `field_key`      VARCHAR(64)   NOT NULL COMMENT '字段标识（冗余，如 env_temperature）',
  `field_type`     VARCHAR(32)   NOT NULL COMMENT '字段类型：text/textarea/select/date/datetime/number/file',
  `value_text`     TEXT                   DEFAULT NULL COMMENT '文本值（text/textarea/select/file 类型）',
  `value_number`   DECIMAL(18,4)          DEFAULT NULL COMMENT '数值（number 类型）',
  `value_date`     DATETIME               DEFAULT NULL COMMENT '日期时间（date/datetime 类型）',
  `created_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_work_order_field` (`work_order_id`, `field_id`),
  KEY `idx_work_order_id` (`work_order_id`),
  KEY `idx_scenario_field_key` (`scenario_id`, `field_key`),
  KEY `idx_field_key_value` (`field_key`, `value_text`(64))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工单自定义字段值表（EAV）';
```

**字段类型到存储列的映射**：

| field\_type     | 存储列           | 说明                 |
| --------------- | ------------- | ------------------ |
| text / textarea | value\_text   | 短文本 / 长文本          |
| select          | value\_text   | 存选中的字典值编码          |
| file            | value\_text   | JSON 数组，存文件 URL 列表 |
| number          | value\_number | DECIMAL 支持小数       |
| date / datetime | value\_date   | 归一化到 DATETIME      |

**写入示例**：

```sql
INSERT INTO wo_data_work_order_field_value
  (work_order_id, scenario_id, field_id, field_key, field_type, value_number, value_text)
VALUES
  (1001, 1, 11, 'env_temperature', 'number', 36.5, NULL),
  (1001, 1, 12, 'device_sn', 'text', NULL, 'SN20260826001')
ON DUPLICATE KEY UPDATE
  value_number = VALUES(value_number),
  value_text   = VALUES(value_text),
  updated_at   = CURRENT_TIMESTAMP;
```

**按自定义字段筛选工单**（多字段用多次 JOIN）：

```sql
SELECT wo.*
FROM wo_data_work_order wo
INNER JOIN wo_data_work_order_field_value v1
        ON v1.work_order_id = wo.id AND v1.field_key = 'env_temperature' AND v1.value_number > 30
INNER JOIN wo_data_work_order_field_value v2
        ON v2.work_order_id = wo.id AND v2.field_key = 'device_sn' AND v2.value_text LIKE 'SN2026%'
WHERE wo.scenario_code = 'ops-ticket' AND wo.is_deleted = 0;
```

#### 5.4.3 wo\_data\_timeline\_event（工单流转事件表）

```sql
CREATE TABLE `wo_data_timeline_event` (
  `id`            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `work_order_id` BIGINT       NOT NULL COMMENT '工单ID',
  `action`        VARCHAR(32)  NOT NULL COMMENT '动作类型：created/dispatched/started/transferred/completed/accepted/evaluated/cancelled/closed/note',
  `summary`       VARCHAR(512)          DEFAULT NULL COMMENT '动作摘要',
  `operator_id`   BIGINT                DEFAULT NULL COMMENT '操作人ID',
  `operator_name` VARCHAR(64)           DEFAULT NULL COMMENT '操作人姓名',
  `extra`         JSON                  DEFAULT NULL COMMENT '扩展信息（JSON，如转派前后处理人、SLA重计时等）',
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  PRIMARY KEY (`id`),
  KEY `idx_work_order_id` (`work_order_id`),
  KEY `idx_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工单流转事件表';
```

#### 5.4.4 wo\_data\_attachment（附件表）

```sql
CREATE TABLE `wo_data_attachment` (
  `id`             BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `work_order_id`  BIGINT       NOT NULL COMMENT '工单ID',
  `biz_type`       VARCHAR(32)  NOT NULL COMMENT '业务类型：fault=故障附件 solution=解决方案凭证 check_in=打卡照片',
  `file_name`      VARCHAR(256) NOT NULL COMMENT '文件名',
  `file_url`       VARCHAR(512) NOT NULL COMMENT '文件URL',
  `file_type`      VARCHAR(64)           DEFAULT NULL COMMENT '文件类型：image/video/audio/pdf/other',
  `file_size`      BIGINT                DEFAULT NULL COMMENT '文件大小（字节）',
  `uploader_id`    BIGINT                DEFAULT NULL COMMENT '上传人ID',
  `uploader_name`  VARCHAR(64)           DEFAULT NULL COMMENT '上传人姓名',
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
  `is_deleted`     TINYINT      NOT NULL DEFAULT 0 COMMENT '软删除：0=正常 1=已删除',
  PRIMARY KEY (`id`),
  KEY `idx_work_order_id` (`work_order_id`),
  KEY `idx_biz_type` (`biz_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='附件表';
```

### 5.5 表关系总览

```
wo_sys_scenario (1) ──── (N) wo_sys_scenario_version
       │
       ├── (1) ── (N) wo_sys_field (1) ── (N) wo_data_work_order_field_value
       ├── (1) ── (N) wo_sys_custom_status
       ├── (1) ── (N) wo_sys_dispatch_rule
       ├── (1) ── (N) wo_sys_sla_config (1) ── (N) wo_sys_sla_alert_config
       └── (1) ── (N) wo_sys_field_permission

wo_sys_ops_staff (1) ─────── (N) wo_sys_dispatch_rule (target_person_id)
wo_sys_ops_staff (1) ─────── (N) wo_data_work_order (assignee_id)

wo_sys_device (1) ───────── (N) wo_data_work_order (device_id)

wo_data_work_order (1) ──── (N) wo_data_timeline_event
       │
       ├── (N) wo_data_work_order_field_value
       └── (N) wo_data_attachment
```

### 5.6 数据库设计要点

1. **场景驱动**：所有配置（字段、状态、派单规则、SLA、权限）均挂在场景下，支持多场景独立配置与版本管理。
2. **主表 + EAV 扩展**：通用字段入工单主表（高频查询、可索引），场景自定义字段入 EAV 扩展表（灵活、可按字段筛选）。
3. **状态机可配置**：工单状态与流转动作通过 `wo_sys_custom_status` 配置，`wo_data_timeline_event` 完整记录每一次流转。
4. **SLA 多维度**：四维匹配（资产类别 × 客户等级 × 故障等级 × 在保状态），分阶段、多渠道超时告警。
5. **闭环校验**：工单闭环需「解决方案 + 凭证附件 + 现场打卡」三项齐备，打卡照片通过附件表 `biz_type=check_in` 关联校验。
6. **软删除**：所有业务表带 `is_deleted`，避免物理删除导致关联数据丢失。
7. **冗余字段**：工单表冗余资产编号/名称、处理人姓名等，减少列表查询 JOIN。
8. **JSON 字段**：匹配条件、配置快照、通知渠道等用 JSON 存储，兼顾灵活性与查询能力。

***

## 6. 数据模型

核心类型定义在 `types/ticket.ts`。

### 6.1 工单状态机

```
pending(待派单) → dispatched(已派单) → processing(处理中) → pending-acceptance(待验收) → completed(已完成) → closed(已关闭)
     │                │                  │                                              │
     └── cancelled(已取消)               └── transferred(转派) ──→ 重新派单              └── evaluated(评价)
```

### 6.2 核心实体

| 实体                  | 对应表                              | 关键字段                                                                                                               |
| ------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| WorkOrder           | wo\_data\_work\_order     | id, code, title, type, scenario\_code, category, status, priority, customer, device\_id, assignee\_id, sla         |
| TicketDevice        | wo\_sys\_device           | id, code, name, model, category, customer, location, status, warranty\_status, warranty\_start/end\_date           |
| OpsStaff            | wo\_sys\_ops\_staff       | id, code, name, position, team, phone, area, status(on/rest)                                                       |
| Scenario            | wo\_sys\_scenario         | id, code, name, latest\_version, latest\_status                                                                    |
| DispatchRule        | wo\_sys\_dispatch\_rule   | id, scenario\_id, match\_conditions, target\_mode, target\_position, target\_person\_id, priority                  |
| SlaConfig           | wo\_sys\_sla\_config      | id, scenario\_id, device\_category, customer\_level, fault\_level, warranty\_status, response\_time, resolve\_time |
| TicketTimelineEvent | wo\_data\_timeline\_event | id, work\_order\_id, action, time, operator, summary                                                               |

***

## 7. API 层设计

API 函数定义在 `ticket.ts`，统一使用 `mockDelay` + `createMockResponse` 模式。

### 7.1 查询类

| 函数                           | 说明         |
| ---------------------------- | ---------- |
| `getWorkOrdersApi`           | 获取工单列表     |
| `getDevicesApi`              | 获取资产台账     |
| `getDispatchRulesApi`        | 获取派单规则     |
| `getSlaConfigsApi`           | 获取 SLA 配置  |
| `getKnowledgeArticlesApi`    | 获取知识库文章    |
| `getTicketOverviewApi`       | 获取工单概览统计   |
| `getDocumentParseResultsApi` | 获取制度文件解析结果 |

### 7.2 操作类

| 函数                          | 说明              |
| --------------------------- | --------------- |
| `createWorkOrderApi`        | 创建工单（含自定义字段写入）  |
| `dispatchWorkOrderApi`      | 派单（首派）          |
| `transferWorkOrderApi`      | 转派（SLA 重新计时）    |
| `setOnSiteDecisionApi`      | 客户经理现场决策判定      |
| `checkInApi`                | 现场打卡（上传水印照片）    |
| `completeWorkOrderApi`      | 处理完成（解决方案 + 凭证） |
| `uploadDocumentForParseApi` | 上传制度文件解析        |
| `reviewDocumentParseApi`    | 复核解析结果          |

***

## 8. 核心业务流程

### 8.1 工单创建与闭环

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ 对话创建  │───→│  派单     │───→│  处理中   │───→│ 待验收    │───→│  已完成   │───→│  已关闭   │
│ (pending) │    │(dispatched)│   │(processing)│  │(pending-  │    │(completed)│    │ (closed) │
└──────────┘    └──────────┘    └──────────┘    │acceptance)│    └──────────┘    └──────────┘
                                                └──────────┘
       │              │               │               │
       │              │               │               └─ 现场打卡 + 解决方案 + 凭证 三项齐备
       │              │               └─ 转派 → SLA 重新计时
       │              └─ 派单规则匹配（按岗位/人员）
       └─ 自动匹配资产台账 + 在保状态 + 写入自定义字段值（EAV）
```

### 8.2 SLA 超时告警

```
工单创建
   ↓
SLA 计算（响应时效/解决时效）
   ↓
定时检测 ──→ 未响应超时 ──→ 通知（站内信+邮件+企微）→ 处理人/主管
        └─→ 未解决超时 ──→ 通知（站内信+邮件+企微）→ 处理人/主管
```

***

## 9. 前端工程要点

### 9.1 组件规范

- 显式导入所有 Ant Design Vue 组件（PascalCase 命名），否则无样式
- 优先使用 Vben 封装组件（VbenForm / VbenModal / VbenTable）
- 图标使用 `@iconify/vue` 的 `Icon` 组件，图标集 `lucide`

### 9.2 样式规范

- Tailwind CSS 优先，保持与现有页面一致的绿色系风格（`#0b6e65` 主色）
- Modal 内容通过 teleport 渲染到 body，scoped CSS 需用 `:deep()` 穿透作用域

### 9.3 数据管理

- 所有 Mock 数据集中在 `mock-data-ticket.ts`，内存持久化（刷新重置）
- API 统一返回 `{ code: 0, data, message: 'success' }` 格式
- 列表页采用本地 `ref` 副本维护可变状态，避免污染全局 mock 数据

***

## 10. 扩展方向

1. **后端对接**：当前为前端 Mock，后续可替换 `ticket.ts` 中的实现对接真实后端，保持 `ApiResponse<T>` 契约不变
2. **现场打卡水印**：当前为 Demo 占位，后续可集成定位 SDK 与图片水印生成
3. **报销系统对接**：现场打卡记录可扩展对接报销系统
4. **知识库增强**：工单处理沉淀的解决方案可自动入库，辅助后续故障诊断
5. **数字员工多轮对话**：当前快捷指令为预设流程，后续可接入 LLM 实现自然语言多轮引导

