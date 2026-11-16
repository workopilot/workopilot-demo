# 数据库表结构设计文档

## 文档信息

- **版本**: 1.2.0
- **更新日期**: 2025-12-25
- **数据库**: MySQL 8.0+
- **字符集**: utf8mb4

---

## 目录

1. [租户管理模块](#1-租户管理模块)
2. [产品服务模块](#2-产品服务模块)
3. [租户订阅模块](#3-租户订阅模块)
4. [用量监控模块](#4-用量监控模块)
5. [服务调用日志模块](#5-服务调用日志模块)

---

## 1. 租户管理模块

### 1.1 租户基本信息表 (tenants)

**表说明**: 存储租户的基本信息

| 字段名 | 类型 | 长度 | 允许NULL | 默认值 | 说明 |
| --- | --- | --- | --- | --- | --- |
| id | BIGINT | - | NO | AUTO_INCREMENT | 租户ID（主键） |
| tenant_code | VARCHAR | 50 | NO | - | 租户编码（唯一标识） |
| tenant_name | VARCHAR | 100 | NO | - | 租户名称 |
| industry | VARCHAR | 50 | YES | NULL | 行业类型 |
| tenant_size | VARCHAR | 50 | YES | NULL | 企业规模 |
| contact_person | VARCHAR | 50 | YES | NULL | 联系人 |
| contact_phone | VARCHAR | 20 | YES | NULL | 联系电话 |
| contact_email | VARCHAR | 100 | YES | NULL | 联系邮箱 |
| address | VARCHAR | 500 | YES | NULL | 详细地址 |
| status | VARCHAR | 20 | NO | 'active' | 状态 |
| logo_url | VARCHAR | 500 | YES | NULL | 租户Logo URL |
| created_at | DATETIME | - | NO | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | - | NO | CURRENT_TIMESTAMP | 更新时间 |
| created_by | VARCHAR | 50 | YES | NULL | 创建人 |
| updated_by | VARCHAR | 50 | YES | NULL | 更新人 |
| remark | TEXT | - | YES | NULL | 备注信息 |

**索引设计**:

- PRIMARY KEY: `id`
- UNIQUE KEY: `tenant_code`
- INDEX: `tenant_name`, `status`, `industry`, `created_at`

**状态枚举值**:

- `active`: 启用
- `suspended`: 停用
- `deleted`: 删除

**行业类型枚举**:

- `finance`: 金融
- `manufacturing`: 制造
- `retail`: 零售
- `technology`: 科技
- `other`: 其他

**企业规模枚举**:

- `small`: 小型（1-100人）
- `medium`: 中型（101-500人）
- `large`: 大型（500人以上）

---

## 2. 产品服务模块

### 2.1 产品服务表 (products)

**表说明**: 存储产品服务的基本信息

| 字段名 | 类型 | 长度 | 允许NULL | 默认值 | 说明 |
| --- | --- | --- | --- | --- | --- |
| id | BIGINT | - | NO | AUTO_INCREMENT | 产品ID（主键） |
| product_name | VARCHAR | 100 | NO | - | 产品名称 |
| product_code | VARCHAR | 50 | NO | - | 产品编码（唯一） |
| description | TEXT | - | YES | NULL | 产品描述 |
| sort_order | INT | - | NO | 0 | 排序顺序 |
| is_hot | TINYINT | 1 | NO | 0 | 是否热门 |
| is_recommend | TINYINT | 1 | NO | 0 | 是否推荐 |
| status | VARCHAR | 20 | NO | 'enabled' | 状态 |
| created_at | DATETIME | - | NO | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | - | NO | CURRENT_TIMESTAMP | 更新时间 |

**索引设计**:

- PRIMARY KEY: `id`
- UNIQUE KEY: `product_code`
- INDEX: `product_name`, `status`, `sort_order`

**状态枚举值**:

- `enabled`: 启用
- `disabled`: 禁用

**产品名称枚举**:

- 智能附件分类
- 智能附件比对
- 智能单据填报
- 智能单据审核
- 智能业务合规
- 智能合规审计

---

### 2.2 产品规格表 (product_specs)

**表说明**: 存储产品的不同规格版本信息

| 字段名 | 类型 | 长度 | 允许NULL | 默认值 | 说明 |
| --- | --- | --- | --- | --- | --- |
| id | BIGINT | - | NO | AUTO_INCREMENT | 规格ID（主键） |
| product_id | BIGINT | - | NO | - | 产品ID（外键） |
| version | VARCHAR | 50 | NO | - | 规格版本 |
| version_name | VARCHAR | 50 | NO | - | 版本名称 |
| version_description | TEXT | YES | NULL | 版本描述 |
| price | DECIMAL | 10,2 | NO | - | 价格（元/年） |
| currency | VARCHAR | 10 | NO | 'CNY' | 货币单位 |
| usage_limit | INT | - | NO | 10000 | 数量限制（次/年） |
| usage_limit_unlimited | TINYINT | 1 | NO | 0 | 是否不限 |
| features | JSON | - | YES | NULL | 功能特性列表 |
| model_providers | JSON | - | YES | NULL | 可用模型提供商配置 |
| status | VARCHAR | 20 | NO | 'enabled' | 状态 |
| sort_order | INT | - | NO | 0 | 排序顺序 |
| created_at | DATETIME | - | NO | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | - | NO | CURRENT_TIMESTAMP | 更新时间 |

**索引设计**:

- PRIMARY KEY: `id`
- UNIQUE KEY: `product_id`, `version`
- INDEX: `product_id`, `status`, `sort_order`

**版本枚举值**:

- `standard`: 标准版
- `plus`: 增强版
- `pro`: 专业版
- `promax`: 尊享版

**状态枚举值**:

- `enabled`: 启用
- `disabled`: 禁用

---

## 3. 租户订阅模块

### 3.1 租户订阅表 (tenant_subscriptions)

**表说明**: 存储租户的产品服务订阅信息

| 字段名 | 类型 | 长度 | 允许NULL | 默认值 | 说明 |
| --- | --- | --- | --- | --- | --- |
| id | BIGINT | - | NO | AUTO_INCREMENT | 订阅ID（主键） |
| subscription_no | VARCHAR | 50 | NO | - | 订阅编号（唯一） |
| tenant_id | BIGINT | - | NO | - | 租户ID（外键） |
| tenant_name | VARCHAR | 100 | NO | - | 租户名称（冗余） |
| product_id | BIGINT | - | NO | - | 产品ID（外键） |
| product_spec_id | BIGINT | - | NO | - | 产品规格ID（外键） |
| product_name | VARCHAR | 100 | NO | - | 产品名称（冗余） |
| product_version | VARCHAR | 50 | NO | - | 产品规格版本（冗余） |
| subscription_type | VARCHAR | 20 | NO | 'paid' | 订阅类型 |
| subscription_status | VARCHAR | 20 | NO | 'active' | 订阅状态 |
| start_date | DATETIME | - | NO | - | 开始时间 |
| end_date | DATETIME | - | NO | - | 到期时间 |
| usage_limit | INT | - | NO | - | 使用限额（次/年） |
| usage_limit_unlimited | TINYINT | 1 | NO | 0 | 是否不限 |
| used_amount | INT | - | NO | 0 | 已使用量 |
| renewal_auto | TINYINT | 1 | NO | 0 | 是否自动续费 |
| payment_amount | DECIMAL | 10,2 | YES | NULL | 实付金额 |
| payment_status | VARCHAR | 20 | YES | NULL | 支付状态 |
| payment_time | DATETIME | YES | NULL | 支付时间 |
| order_no | VARCHAR | 50 | YES | NULL | 订单编号 |
| created_at | DATETIME | - | NO | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | - | NO | CURRENT_TIMESTAMP | 更新时间 |

**索引设计**:

- PRIMARY KEY: `id`
- UNIQUE KEY: `subscription_no`
- INDEX: `tenant_id`, `product_id`, `product_spec_id`, `subscription_status`, `end_date`
- INDEX: `tenant_id`, `product_spec_id` (联合索引)

**外键关系**:

- `tenant_id` → `tenants(id)`
- `product_id` → `products(id)`
- `product_spec_id` → `product_specs(id)`

**订阅类型枚举**:

- `trial`: 试用
- `paid`: 付费
- `free`: 免费

**订阅状态枚举**:

- `active`: 生效中
- `expired`: 已过期
- `suspended`: 已停用
- `cancelled`: 已取消

**支付状态枚举**:

- `unpaid`: 未支付
- `paid`: 已支付
- `refunded`: 已退款

---

### 3.2 订阅变更历史表 (subscription_history)

**表说明**: 记录订阅的所有变更历史

| 字段名 | 类型 | 长度 | 允许NULL | 默认值 | 说明 |
| --- | --- | --- | --- | --- | --- |
| id | BIGINT | - | NO | AUTO_INCREMENT | 历史ID（主键） |
| subscription_id | BIGINT | - | NO | - | 订阅ID（外键） |
| tenant_id | BIGINT | - | NO | - | 租户ID（外键） |
| product_id | BIGINT | - | NO | - | 产品ID（外键） |
| product_spec_id | BIGINT | - | NO | - | 产品规格ID（外键） |
| change_type | VARCHAR | 20 | NO | - | 变更类型 |
| before_status | VARCHAR | 50 | YES | NULL | 变更前状态 |
| after_status | VARCHAR | 50 | YES | NULL | 变更后状态 |
| before_config | JSON | YES | NULL | 变更前配置 |
| after_config | JSON | YES | NULL | 变更后配置 |
| reason | VARCHAR | 500 | YES | NULL | 变更原因 |
| operator | VARCHAR | 50 | YES | NULL | 操作人 |
| operator_type | VARCHAR | 20 | YES | NULL | 操作人类型 |
| created_at | DATETIME | - | NO | CURRENT_TIMESTAMP | 变更时间 |

**索引设计**:

- PRIMARY KEY: `id`
- INDEX: `subscription_id`, `tenant_id`, `change_type`, `created_at`

**外键关系**:

- `subscription_id` → `tenant_subscriptions(id)`
- `tenant_id` → `tenants(id)`
- `product_id` → `products(id)`
- `product_spec_id` → `product_specs(id)`

**变更类型枚举**:

- `create`: 新建
- `upgrade`: 升级
- `downgrade`: 降级
- `renew`: 续费
- `suspend`: 停用
- `activate`: 启用
- `cancel`: 取消

---

## 4. 用量监控模块

### 4.1 用量记录汇总表 (usage_records)

**表说明**: 存储租户的使用量汇总数据（按天/月/年）

| 字段名 | 类型 | 长度 | 允许NULL | 默认值 | 说明 |
| --- | --- | --- | --- | --- | --- |
| id | BIGINT | - | NO | AUTO_INCREMENT | 记录ID（主键） |
| subscription_id | BIGINT | - | NO | - | 订阅ID（外键） |
| tenant_id | BIGINT | - | NO | - | 租户ID（外键） |
| tenant_name | VARCHAR | 100 | NO | - | 租户名称（冗余） |
| product_id | BIGINT | - | NO | - | 产品ID（外键） |
| product_spec_id | BIGINT | - | NO | - | 产品规格ID（外键） |
| product_name | VARCHAR | 100 | NO | - | 产品名称（冗余） |
| product_version | VARCHAR | 50 | NO | - | 产品规格版本（冗余） |
| usage_limit | INT | - | NO | - | 使用限额 |
| used_amount | INT | - | NO | 0 | 已使用量 |
| usage_percentage | DECIMAL | 5,2 | NO | 0 | 使用率百分比 |
| usage_status | VARCHAR | 20 | NO | 'normal' | 用量状态 |
| record_date | DATE | - | NO | - | 记录日期 |
| record_type | VARCHAR | 20 | NO | 'daily' | 记录类型 |
| created_at | DATETIME | - | NO | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | - | NO | CURRENT_TIMESTAMP | 更新时间 |

**索引设计**:

- PRIMARY KEY: `id`
- UNIQUE KEY: `subscription_id`, `record_date`, `record_type`
- INDEX: `tenant_id`, `product_id`, `product_spec_id`, `record_date`, `usage_status`

**外键关系**:

- `subscription_id` → `tenant_subscriptions(id)`
- `tenant_id` → `tenants(id)`
- `product_id` → `products(id)`
- `product_spec_id` → `product_specs(id)`

**用量状态枚举**:

- `normal`: 正常（使用率 < 90%）
- `warning`: 即将超限（90% ≤ 使用率 < 100%）
- `exceeded`: 已超限（使用率 ≥ 100%）

**记录类型枚举**:

- `daily`: 日汇总
- `monthly`: 月汇总
- `yearly`: 年汇总

---

### 4.2 用量明细表 (usage_details)

**表说明**: 存储每次服务调用的详细记录

| 字段名 | 类型 | 长度 | 允许NULL | 默认值 | 说明 |
| --- | --- | --- | --- | --- | --- |
| id | BIGINT | - | NO | AUTO_INCREMENT | 明细ID（主键） |
| subscription_id | BIGINT | - | NO | - | 订阅ID（外键） |
| tenant_id | BIGINT | - | NO | - | 租户ID（外键） |
| product_id | BIGINT | - | NO | - | 产品ID（外键） |
| product_spec_id | BIGINT | - | NO | - | 产品规格ID（外键） |
| service_name | VARCHAR | 100 | NO | - | 服务名称 |
| document_no | VARCHAR | 100 | YES | NULL | 业务单号 |
| call_count | INT | - | NO | 1 | 调用次数 |
| call_result | VARCHAR | 20 | YES | NULL | 调用结果 |
| request_params | JSON | YES | NULL | 请求参数 |
| response_data | JSON | YES | NULL | 响应数据 |
| error_message | TEXT | YES | NULL | 错误信息 |
| call_time | DATETIME | - | NO | - | 调用时间 |
| created_at | DATETIME | - | NO | CURRENT_TIMESTAMP | 创建时间 |

**索引设计**:

- PRIMARY KEY: `id`
- INDEX: `subscription_id`, `tenant_id`, `product_id`, `product_spec_id`, `call_time`, `document_no`

**外键关系**:

- `subscription_id` → `tenant_subscriptions(id)`
- `tenant_id` → `tenants(id)`
- `product_id` → `products(id)`
- `product_spec_id` → `product_specs(id)`

**调用结果枚举**:

- `success`: 成功
- `failed`: 失败

---

## 5. 服务调用日志模块

### 5.1 服务调用日志表 (service_call_logs)

**表说明**: 记录所有服务调用的详细日志

| 字段名 | 类型 | 长度 | 允许NULL | 默认值 | 说明 |
| --- | --- | --- | --- | --- | --- |
| id | BIGINT | - | NO | AUTO_INCREMENT | 日志ID（主键） |
| batch_no | VARCHAR | 50 | NO | - | 批次号 |
| tenant_id | BIGINT | - | NO | - | 租户ID（外键） |
| tenant_name | VARCHAR | 100 | YES | NULL | 租户名称（冗余） |
| product_id | BIGINT | YES | NULL | - | 产品ID（外键） |
| product_spec_id | BIGINT | YES | NULL | - | 产品规格ID（外键） |
| service_name | VARCHAR | 100 | NO | - | 服务名称 |
| version | VARCHAR | 50 | YES | NULL | 版本号 |
| document_no | VARCHAR | 100 | YES | NULL | 业务单号 |
| call_count | INT | - | NO | 1 | 调用次数 |
| call_status | VARCHAR | 20 | NO | - | 调用状态 |
| request_ip | VARCHAR | 50 | YES | NULL | 请求IP |
| request_user | VARCHAR | 50 | YES | NULL | 请求用户 |
| request_method | VARCHAR | 10 | YES | NULL | 请求方法 |
| request_url | VARCHAR | 500 | YES | NULL | 请求URL |
| request_headers | JSON | YES | NULL | 请求头 |
| request_body | TEXT | YES | NULL | 请求体 |
| response_code | INT | YES | NULL | 响应状态码 |
| response_body | TEXT | YES | NULL | 响应体 |
| response_time | INT | YES | NULL | 响应时间（毫秒） |
| error_code | VARCHAR | 50 | YES | NULL | 错误代码 |
| error_message | TEXT | YES | NULL | 错误信息 |
| error_stack | TEXT | YES | NULL | 错误堆栈 |
| call_time | DATETIME | - | NO | - | 调用时间 |
| created_at | DATETIME | - | NO | CURRENT_TIMESTAMP | 创建时间 |

**索引设计**:

- PRIMARY KEY: `id`
- INDEX: `batch_no`, `tenant_id`, `product_id`, `product_spec_id`, `service_name`, `document_no`, `call_status`, `call_time`
- INDEX: `tenant_id`, `service_name`, `call_time` (联合索引，用于高频查询)

**外键关系**:

- `tenant_id` → `tenants(id)`
- `product_id` → `products(id)`
- `product_spec_id` → `product_specs(id)`

**调用状态枚举**:

- `success`: 成功
- `failed`: 失败

---

## 附录A: ER图关系说明

### 主要实体关系

```
租户 (tenants)
  ├─ 1:N ─> 租户订阅 (tenant_subscriptions)
  │           ├─ 1:N ─> 订阅变更历史 (subscription_history)
  │           ├─ 1:N ─> 用量记录汇总 (usage_records)
  │           └─ 1:N ─> 用量明细 (usage_details)
  └─ 1:N ─> 服务调用日志 (service_call_logs)

产品 (products)
  ├─ 1:N ─> 产品规格 (product_specs)
  └─ 1:N ─> 租户订阅 (tenant_subscriptions) [通过 product_specs]

产品规格 (product_specs)
  ├─ 1:N ─> 租户订阅 (tenant_subscriptions)
  ├─ 1:N ─> 用量记录汇总 (usage_records)
  ├─ 1:N ─> 用量明细 (usage_details)
  └─ 1:N ─> 服务调用日志 (service_call_logs)
```

---

## 附录B: 常用SQL查询示例

### B.1 查询产品服务列表（含规格信息）

```sql
SELECT
    p.id AS product_id,
    p.product_name,
    p.product_code,
    p.description,
    p.is_hot,
    p.is_recommend,
    ps.id AS spec_id,
    ps.version,
    ps.version_name,
    ps.price,
    ps.usage_limit,
    ps.features
FROM products p
LEFT JOIN product_specs ps ON p.id = ps.product_id
WHERE p.status = 'enabled' AND ps.status = 'enabled'
ORDER BY p.sort_order, ps.sort_order;
```

### B.2 查询租户订阅列表（含产品信息和用量）

```sql
SELECT
    ts.id,
    ts.subscription_no,
    ts.tenant_name,
    ts.product_name,
    ts.product_version,
    ts.subscription_status,
    ts.start_date,
    ts.end_date,
    ts.usage_limit,
    ts.used_amount,
    ROUND(ts.used_amount / ts.usage_limit * 100, 2) AS usage_percentage,
    ps.version_name,
    ps.price
FROM tenant_subscriptions ts
LEFT JOIN product_specs ps ON ts.product_spec_id = ps.id
WHERE ts.subscription_status = 'active'
ORDER BY ts.end_date ASC;
```

### B.3 查询用量监控数据

```sql
SELECT
    ur.tenant_name,
    ur.product_name,
    ur.product_version,
    ur.usage_limit,
    ur.used_amount,
    ur.usage_percentage,
    ur.usage_status,
    ts.end_date,
    ps.version_name,
    CASE
        WHEN ur.usage_percentage >= 90 THEN 'warning'
        WHEN ur.usage_percentage >= 100 THEN 'exceeded'
        ELSE 'normal'
    END AS calculated_status
FROM usage_records ur
LEFT JOIN tenant_subscriptions ts ON ur.subscription_id = ts.id
LEFT JOIN product_specs ps ON ur.product_spec_id = ps.id
WHERE ur.record_date = CURDATE()
ORDER BY ur.usage_percentage DESC;
```

### B.4 查询服务调用日志（带筛选和分页）

```sql
SELECT
    batch_no,
    service_name,
    version,
    document_no,
    call_count,
    call_status,
    request_ip,
    call_time
FROM service_call_logs
WHERE 1=1
    AND (:serviceName IS NULL OR service_name = :serviceName)
    AND (:documentNo IS NULL OR document_no = :documentNo)
    AND (:status IS NULL OR call_status = :status)
    AND (:startTime IS NULL OR call_time >= :startTime)
    AND (:endTime IS NULL OR call_time <= :endTime)
ORDER BY call_time DESC
LIMIT :pageSize OFFSET :offset;
```

### B.5 统计租户订阅数量和状态

```sql
SELECT
    t.tenant_name,
    COUNT(ts.id) AS total_subscriptions,
    SUM(CASE WHEN ts.subscription_status = 'active' THEN 1 ELSE 0 END) AS active_count,
    SUM(CASE WHEN ts.subscription_status = 'expired' THEN 1 ELSE 0 END) AS expired_count,
    SUM(ts.used_amount) AS total_usage
FROM tenants t
LEFT JOIN tenant_subscriptions ts ON t.id = ts.tenant_id
GROUP BY t.id, t.tenant_name
ORDER BY total_subscriptions DESC;
```

---

## 附录C: 数据库优化建议

### C.1 索引优化

**高频查询索引**:

```sql
-- 租户订阅活跃查询
CREATE INDEX idx_subscriptions_active ON tenant_subscriptions(tenant_id, subscription_status, end_date);

-- 产品规格查询
CREATE INDEX idx_product_specs_enabled ON product_specs(product_id, status, sort_order);

-- 服务日志最近查询
CREATE INDEX idx_service_logs_recent ON service_call_logs(tenant_id, service_name, call_time DESC);

-- 用量监控查询
CREATE INDEX idx_usage_monitoring ON usage_records(tenant_id, product_id, product_spec_id, record_date DESC);
```

### C.2 分区策略（针对大表）

**service_call_logs 表按月分区**:

```sql
ALTER TABLE service_call_logs
PARTITION BY RANGE (TO_DAYS(call_time)) (
    PARTITION p202501 VALUES LESS THAN (TO_DAYS('2025-02-01')),
    PARTITION p202502 VALUES LESS THAN (TO_DAYS('2025-03-01')),
    PARTITION p202503 VALUES LESS THAN (TO_DAYS('2025-04-01'))
);
```

### C.3 数据归档策略

| 表名              | 保留周期 | 归档方式     |
| ----------------- | -------- | ------------ |
| service_call_logs | 3个月    | 迁移到历史表 |
| usage_details     | 1年      | 迁移到历史表 |
| usage_records     | 3年      | 压缩归档     |

### C.4 定时任务建议

| 任务名称     | 频率     | 说明                |
| ------------ | -------- | ------------------- |
| 用量汇总     | 每天凌晨 | 汇总前一天的使用量  |
| 订阅状态更新 | 每小时   | 检查并更新过期订阅  |
| 临时文件清理 | 每周     | 清理过期的临时文件  |
| 日志归档     | 每月     | 归档超过3个月的日志 |

---

## 附录D: 初始化数据脚本

### D.1 初始化产品服务数据

```sql
-- 插入产品服务
INSERT INTO products (product_name, product_code, description, sort_order, is_hot, is_recommend, status) VALUES
('智能附件分类', 'ATTACHMENT_CLASSIFICATION', '智能识别和分类各类附件文档', 1, 1, 1, 'enabled'),
('智能附件比对', 'ATTACHMENT_COMPARISON', '智能比对附件内容差异', 2, 0, 0, 'enabled'),
('智能单据填报', 'INVOICE_FILLING', '智能识别和填报单据信息', 3, 0, 0, 'enabled'),
('智能单据审核', 'INVOICE_AUDIT', '智能审核各类单据发票', 4, 1, 1, 'enabled'),
('智能业务合规', 'BUSINESS_COMPLIANCE', '智能业务合规性检查', 5, 0, 0, 'enabled'),
('智能合规审计', 'COMPLIANCE_AUDIT', '智能合规性审计分析', 6, 0, 0, 'enabled');

-- 插入产品规格
INSERT INTO product_specs (product_id, version, version_name, version_description, price, usage_limit, usage_limit_unlimited, features, model_providers, sort_order, status) VALUES
-- 智能附件分类规格
(1, 'standard', '标准版', '适合小型企业基础使用', 10000.00, 10000, 0, '["基础分类功能", "支持10种附件类型", "月度报表"]', '["OpenAI"]', 1, 'enabled'),
(1, 'plus', '增强版', '适合中型企业使用', 30000.00, 50000, 0, '["基础分类功能", "支持50种附件类型", "周度报表", "API接口"]', '["OpenAI", "Azure OpenAI"]', 2, 'enabled'),
(1, 'pro', '专业版', '适合大型企业使用', 80000.00, 200000, 0, '["全部分类功能", "无限附件类型", "日报表", "高级API接口", "定制化训练"]', '["OpenAI", "Azure OpenAI", "阿里通义"]', 3, 'enabled'),

-- 智能单据审核规格
(4, 'standard', '标准版', '适合小型企业基础审核', 15000.00, 10000, 0, '["基础审核规则", "增值税发票", "月度报表"]', '["OpenAI"]', 1, 'enabled'),
(4, 'plus', '增强版', '适合中型企业审核', 45000.00, 50000, 0, '["标准审核规则", "全品类发票", "周度报表", "规则自定义"]', '["OpenAI", "Azure OpenAI"]', 2, 'enabled'),
(4, 'pro', '专业版', '适合大型企业专业审核', 100000.00, 200000, 0, '["高级审核规则", "全票据类型", "日报表", "智能学习", "行业定制"]', '["OpenAI", "Azure OpenAI", "阿里通义", "智谱AI"]', 3, 'enabled');
```

### D.2 初始化模型提供商（配置在代码中）

模型提供商配置建议在代码中维护，数据库中只存储租户的授权配置。

---

## 附录E: 建表DDL脚本

### E.1 租户管理模块

```sql
-- 租户基本信息表
CREATE TABLE tenants (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '租户ID',
    tenant_code VARCHAR(50) UNIQUE NOT NULL COMMENT '租户编码',
    tenant_name VARCHAR(100) NOT NULL COMMENT '租户名称',
    industry VARCHAR(50) COMMENT '行业类型',
    tenant_size VARCHAR(50) COMMENT '企业规模',
    contact_person VARCHAR(50) COMMENT '联系人',
    contact_phone VARCHAR(20) COMMENT '联系电话',
    contact_email VARCHAR(100) COMMENT '联系邮箱',
    address VARCHAR(500) COMMENT '详细地址',
    status VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '状态',
    logo_url VARCHAR(500) COMMENT '租户Logo URL',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    created_by VARCHAR(50) COMMENT '创建人',
    updated_by VARCHAR(50) COMMENT '更新人',
    remark TEXT COMMENT '备注信息',
    INDEX idx_tenant_code (tenant_code),
    INDEX idx_tenant_name (tenant_name),
    INDEX idx_status (status),
    INDEX idx_industry (industry)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='租户基本信息表';
```

### E.2 产品服务模块

```sql
-- 产品服务表
CREATE TABLE products (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '产品ID',
    product_name VARCHAR(100) NOT NULL COMMENT '产品名称',
    product_code VARCHAR(50) UNIQUE NOT NULL COMMENT '产品编码',
    description TEXT COMMENT '产品描述',
    sort_order INT DEFAULT 0 COMMENT '排序顺序',
    is_hot TINYINT(1) DEFAULT 0 COMMENT '是否热门',
    is_recommend TINYINT(1) DEFAULT 0 COMMENT '是否推荐',
    status VARCHAR(20) NOT NULL DEFAULT 'enabled' COMMENT '状态',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_product_code (product_code),
    INDEX idx_product_name (product_name),
    INDEX idx_status (status),
    INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='产品服务表';

-- 产品规格表
CREATE TABLE product_specs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '规格ID',
    product_id BIGINT NOT NULL COMMENT '产品ID',
    version VARCHAR(50) NOT NULL COMMENT '规格版本',
    version_name VARCHAR(50) NOT NULL COMMENT '版本名称',
    version_description TEXT COMMENT '版本描述',
    price DECIMAL(10, 2) NOT NULL COMMENT '价格',
    currency VARCHAR(10) NOT NULL DEFAULT 'CNY' COMMENT '货币单位',
    usage_limit INT NOT NULL DEFAULT 10000 COMMENT '数量限制',
    usage_limit_unlimited TINYINT(1) DEFAULT 0 COMMENT '是否不限',
    features JSON COMMENT '功能特性列表',
    model_providers JSON COMMENT '可用模型提供商配置',
    status VARCHAR(20) NOT NULL DEFAULT 'enabled' COMMENT '状态',
    sort_order INT DEFAULT 0 COMMENT '排序顺序',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_product_version (product_id, version),
    INDEX idx_product_id (product_id),
    INDEX idx_status (status),
    INDEX idx_sort_order (sort_order),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='产品规格表';
```

### E.3 租户订阅模块

```sql
-- 租户订阅表
CREATE TABLE tenant_subscriptions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '订阅ID',
    subscription_no VARCHAR(50) UNIQUE NOT NULL COMMENT '订阅编号',
    tenant_id BIGINT NOT NULL COMMENT '租户ID',
    tenant_name VARCHAR(100) NOT NULL COMMENT '租户名称',
    product_id BIGINT NOT NULL COMMENT '产品ID',
    product_spec_id BIGINT NOT NULL COMMENT '产品规格ID',
    product_name VARCHAR(100) NOT NULL COMMENT '产品名称',
    product_version VARCHAR(50) NOT NULL COMMENT '产品规格版本',
    subscription_type VARCHAR(20) NOT NULL DEFAULT 'paid' COMMENT '订阅类型',
    subscription_status VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '订阅状态',
    start_date DATETIME NOT NULL COMMENT '开始时间',
    end_date DATETIME NOT NULL COMMENT '到期时间',
    usage_limit INT NOT NULL COMMENT '使用限额',
    usage_limit_unlimited TINYINT(1) DEFAULT 0 COMMENT '是否不限',
    used_amount INT NOT NULL DEFAULT 0 COMMENT '已使用量',
    renewal_auto TINYINT(1) DEFAULT 0 COMMENT '是否自动续费',
    payment_amount DECIMAL(10, 2) COMMENT '实付金额',
    payment_status VARCHAR(20) COMMENT '支付状态',
    payment_time DATETIME COMMENT '支付时间',
    order_no VARCHAR(50) COMMENT '订单编号',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_subscription_no (subscription_no),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_product_id (product_id),
    INDEX idx_product_spec_id (product_spec_id),
    INDEX idx_subscription_status (subscription_status),
    INDEX idx_end_date (end_date),
    INDEX idx_tenant_product_spec (tenant_id, product_spec_id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (product_spec_id) REFERENCES product_specs(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='租户订阅表';

-- 订阅变更历史表
CREATE TABLE subscription_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '历史ID',
    subscription_id BIGINT NOT NULL COMMENT '订阅ID',
    tenant_id BIGINT NOT NULL COMMENT '租户ID',
    product_id BIGINT NOT NULL COMMENT '产品ID',
    product_spec_id BIGINT NOT NULL COMMENT '产品规格ID',
    change_type VARCHAR(20) NOT NULL COMMENT '变更类型',
    before_status VARCHAR(50) COMMENT '变更前状态',
    after_status VARCHAR(50) COMMENT '变更后状态',
    before_config JSON COMMENT '变更前配置',
    after_config JSON COMMENT '变更后配置',
    reason VARCHAR(500) COMMENT '变更原因',
    operator VARCHAR(50) COMMENT '操作人',
    operator_type VARCHAR(20) COMMENT '操作人类型',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '变更时间',
    INDEX idx_subscription_id (subscription_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_change_type (change_type),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (subscription_id) REFERENCES tenant_subscriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (product_spec_id) REFERENCES product_specs(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订阅变更历史表';
```

### E.4 用量监控模块

```sql
-- 用量记录汇总表
CREATE TABLE usage_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '记录ID',
    subscription_id BIGINT NOT NULL COMMENT '订阅ID',
    tenant_id BIGINT NOT NULL COMMENT '租户ID',
    tenant_name VARCHAR(100) NOT NULL COMMENT '租户名称',
    product_id BIGINT NOT NULL COMMENT '产品ID',
    product_spec_id BIGINT NOT NULL COMMENT '产品规格ID',
    product_name VARCHAR(100) NOT NULL COMMENT '产品名称',
    product_version VARCHAR(50) NOT NULL COMMENT '产品规格版本',
    usage_limit INT NOT NULL COMMENT '使用限额',
    used_amount INT NOT NULL DEFAULT 0 COMMENT '已使用量',
    usage_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0 COMMENT '使用率百分比',
    usage_status VARCHAR(20) NOT NULL DEFAULT 'normal' COMMENT '用量状态',
    record_date DATE NOT NULL COMMENT '记录日期',
    record_type VARCHAR(20) NOT NULL DEFAULT 'daily' COMMENT '记录类型',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_subscription_date (subscription_id, record_date, record_type),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_product_id (product_id),
    INDEX idx_product_spec_id (product_spec_id),
    INDEX idx_record_date (record_date),
    INDEX idx_usage_status (usage_status),
    FOREIGN KEY (subscription_id) REFERENCES tenant_subscriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (product_spec_id) REFERENCES product_specs(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用量记录汇总表';

-- 用量明细表
CREATE TABLE usage_details (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '明细ID',
    subscription_id BIGINT NOT NULL COMMENT '订阅ID',
    tenant_id BIGINT NOT NULL COMMENT '租户ID',
    product_id BIGINT NOT NULL COMMENT '产品ID',
    product_spec_id BIGINT NOT NULL COMMENT '产品规格ID',
    service_name VARCHAR(100) NOT NULL COMMENT '服务名称',
    document_no VARCHAR(100) COMMENT '业务单号',
    call_count INT NOT NULL DEFAULT 1 COMMENT '调用次数',
    call_result VARCHAR(20) COMMENT '调用结果',
    request_params JSON COMMENT '请求参数',
    response_data JSON COMMENT '响应数据',
    error_message TEXT COMMENT '错误信息',
    call_time DATETIME NOT NULL COMMENT '调用时间',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_subscription_id (subscription_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_product_id (product_id),
    INDEX idx_product_spec_id (product_spec_id),
    INDEX idx_call_time (call_time),
    INDEX idx_document_no (document_no),
    INDEX idx_service_name (service_name),
    FOREIGN KEY (subscription_id) REFERENCES tenant_subscriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (product_spec_id) REFERENCES product_specs(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用量明细表';
```

### E.5 服务调用日志模块

```sql
-- 服务调用日志表
CREATE TABLE service_call_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '日志ID',
    batch_no VARCHAR(50) NOT NULL COMMENT '批次号',
    tenant_id BIGINT NOT NULL COMMENT '租户ID',
    tenant_name VARCHAR(100) COMMENT '租户名称',
    product_id BIGINT COMMENT '产品ID',
    product_spec_id BIGINT COMMENT '产品规格ID',
    service_name VARCHAR(100) NOT NULL COMMENT '服务名称',
    version VARCHAR(50) COMMENT '版本号',
    document_no VARCHAR(100) COMMENT '业务单号',
    call_count INT NOT NULL DEFAULT 1 COMMENT '调用次数',
    call_status VARCHAR(20) NOT NULL COMMENT '调用状态',
    request_ip VARCHAR(50) COMMENT '请求IP',
    request_user VARCHAR(50) COMMENT '请求用户',
    request_method VARCHAR(10) COMMENT '请求方法',
    request_url VARCHAR(500) COMMENT '请求URL',
    request_headers JSON COMMENT '请求头',
    request_body TEXT COMMENT '请求体',
    response_code INT COMMENT '响应状态码',
    response_body TEXT COMMENT '响应体',
    response_time INT COMMENT '响应时间（毫秒）',
    error_code VARCHAR(50) COMMENT '错误代码',
    error_message TEXT COMMENT '错误信息',
    error_stack TEXT COMMENT '错误堆栈',
    call_time DATETIME NOT NULL COMMENT '调用时间',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_batch_no (batch_no),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_product_id (product_id),
    INDEX idx_product_spec_id (product_spec_id),
    INDEX idx_service_name (service_name),
    INDEX idx_document_no (document_no),
    INDEX idx_call_status (call_status),
    INDEX idx_call_time (call_time),
    INDEX idx_tenant_service_time (tenant_id, service_name, call_time),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY (product_spec_id) REFERENCES product_specs(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务调用日志表';
```

---

## 变更记录

| 版本 | 日期 | 变更内容 | 变更人 |
| --- | --- | --- | --- |
| 1.0.0 | 2025-12-25 | 初始版本，包含完整的表结构设计 | - |
| 1.1.0 | 2025-12-25 | 拆分产品服务表为产品表和规格表；删除产品表部分字段；删除系统配置模块 | - |
| 1.2.0 | 2025-12-25 | 删除租户权限配置表（tenant_permissions） | - |

---

**文档结束**
