<script setup lang="ts">
import type {
  AlertLevel,
  AlertRule,
  AlertStatus,
  ApiKey,
  Webhook,
  WebhookEvent,
  WebhookLog,
} from '#/types/platform';

import { onMounted, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Card,
  message,
  Modal,
  Popconfirm,
  Space,
  Tabs,
  Tag,
} from 'ant-design-vue';

import {
  getAlertRulesApi,
  getApiKeysApi,
  getWebhookLogsApi,
  getWebhooksApi,
} from '#/api/platform';

// Tab管理
const activeTab = ref('alertRules');

// ==================== 告警规则 ====================
const alertRulesLoading = ref(false);
const alertRules = ref<AlertRule[]>([]);

// 获取告警规则列表
async function fetchAlertRules() {
  alertRulesLoading.value = true;
  try {
    const res = await getAlertRulesApi();
    if (res.code === 0) {
      alertRules.value = res.data;
    }
  } catch {
    message.error('获取告警规则失败');
  } finally {
    alertRulesLoading.value = false;
  }
}

// 格式化告警类型
function formatAlertType(type: string) {
  const map: Record<string, string> = {
    usage: '用量告警',
    error: '错误告警',
    performance: '性能告警',
    billing: '计告警',
  };
  return map[type] || type;
}

// 格式化告警级别
function formatAlertLevel(level: AlertLevel) {
  const map: Record<AlertLevel, { color: string; text: string }> = {
    info: { text: '信息', color: 'default' },
    warning: { text: '警告', color: 'warning' },
    critical: { text: '严重', color: 'error' },
  };
  return map[level] || { text: level, color: 'default' };
}

// 格式化告警状态
function formatAlertStatus(status: AlertStatus) {
  const map: Record<AlertStatus, { color: string; text: string }> = {
    enabled: { text: '启用', color: 'success' },
    disabled: { text: '禁用', color: 'default' },
    triggered: { text: '已触发', color: 'warning' },
  };
  return map[status] || { text: status, color: 'default' };
}

// 告警规则操作
function handleAddAlertRule() {
  message.info('打开新增告警规则弹窗');
}

function handleEditAlertRule(record: AlertRule) {
  message.info(`编辑告警规则: ${record.name}`);
}

async function handleDeleteAlertRule(_id: string) {
  try {
    message.success('删除成功');
    await fetchAlertRules();
  } catch {
    message.error('删除失败');
  }
}

function handleToggleAlertStatus(record: AlertRule) {
  message.info(`切换告警规则状态: ${record.name}`);
}

// ==================== API密钥 ====================
const apiKeysLoading = ref(false);
const apiKeys = ref<ApiKey[]>([]);

// 获取API密钥列表
async function fetchApiKeys() {
  apiKeysLoading.value = true;
  try {
    const res = await getApiKeysApi();
    if (res.code === 0) {
      apiKeys.value = res.data;
    }
  } catch {
    message.error('获取API密钥失败');
  } finally {
    apiKeysLoading.value = false;
  }
}

// 格式化密钥状态
function formatApiKeyStatus(status: string) {
  const map: Record<string, { color: string; text: string }> = {
    active: { text: '活跃', color: 'success' },
    disabled: { text: '禁用', color: 'default' },
    expired: { text: '已过期', color: 'error' },
  };
  return map[status] || { text: status, color: 'default' };
}

// API密钥操作
function handleAddApiKey() {
  message.info('打开新增API密钥弹窗');
}

function handleEditApiKey(record: ApiKey) {
  message.info(`编辑API密钥: ${record.name}`);
}

async function handleDeleteApiKey(_id: string) {
  try {
    message.success('删除成功');
    await fetchApiKeys();
  } catch {
    message.error('删除失败');
  }
}

function handleToggleApiKeyStatus(record: ApiKey) {
  message.info(`切换API密钥状态: ${record.name}`);
}

function handleViewApiKey(record: ApiKey) {
  message.info(`查看API密钥详情: ${record.name}`);
}

// ==================== Webhook配置 ====================
const webhooksLoading = ref(false);
const webhooks = ref<Webhook[]>([]);
const webhookLogsVisible = ref(false);
const webhookLogsLoading = ref(false);
const webhookLogs = ref<WebhookLog[]>([]);
const currentWebhook = ref<null | Webhook>(null);

// 获取Webhook列表
async function fetchWebhooks() {
  webhooksLoading.value = true;
  try {
    const res = await getWebhooksApi();
    if (res.code === 0) {
      webhooks.value = res.data;
    }
  } catch {
    message.error('获取Webhook配置失败');
  } finally {
    webhooksLoading.value = false;
  }
}

// 格式化事件类型
function formatWebhookEvent(event: WebhookEvent) {
  const map: Record<WebhookEvent, string> = {
    'subscription.expired': '订阅到期',
    'usage.threshold': '用量告警',
    'alert.triggered': '告警触发',
    'tenant.created': '租户创建',
    'tenant.disabled': '租户禁用',
  };
  return map[event] || event;
}

// 格式化Webhook状态
function formatWebhookStatus(status: string) {
  const map: Record<string, { color: string; text: string }> = {
    enabled: { text: '启用', color: 'success' },
    disabled: { text: '禁用', color: 'default' },
  };
  return map[status] || { text: status, color: 'default' };
}

// 格式化最后状态
function formatLastStatus(status?: string) {
  const map: Record<string, { color: string; text: string }> = {
    success: { text: '成功', color: 'success' },
    failed: { text: '失败', color: 'error' },
  };
  return status ? map[status] || { text: status, color: 'default' } : null;
}

// Webhook操作
function handleAddWebhook() {
  message.info('打开新增Webhook弹窗');
}

function handleEditWebhook(record: Webhook) {
  message.info(`编辑Webhook: ${record.name}`);
}

async function handleDeleteWebhook(_id: string) {
  try {
    message.success('删除成功');
    await fetchWebhooks();
  } catch {
    message.error('删除失败');
  }
}

function handleToggleWebhookStatus(record: Webhook) {
  message.info(`切换Webhook状态: ${record.name}`);
}

// 查看Webhook调用日志
async function handleViewWebhookLogs(record: Webhook) {
  currentWebhook.value = record;
  webhookLogsVisible.value = true;
  await fetchWebhookLogs(record.id);
}

// 获取Webhook调用日志
async function fetchWebhookLogs(webhookId: string) {
  webhookLogsLoading.value = true;
  try {
    const res = await getWebhookLogsApi(webhookId);
    if (res.code === 0) {
      webhookLogs.value = res.data;
    }
  } catch {
    message.error('获取Webhook日志失败');
  } finally {
    webhookLogsLoading.value = false;
  }
}

// 处理查看日志详情
function handleViewLogDetail(record: WebhookLog) {
  Modal.info({
    title: 'Webhook调用详情',
    width: 600,
    content: `
      <div class="space-y-4">
        <div>
          <div class="font-medium">事件</div>
          <div class="text-gray-600">${formatWebhookEvent(record.event)}</div>
        </div>
        <div>
          <div class="font-medium">请求负载</div>
          <pre class="mt-1 rounded bg-gray-100 p-2 text-xs">${JSON.stringify(record.payload, null, 2)}</pre>
        </div>
        <div>
          <div class="font-medium">响应状态码</div>
          <div class="text-gray-600">${record.responseCode || '-'}</div>
        </div>
        <div>
          <div class="font-medium">响应内容</div>
          <pre class="mt-1 rounded bg-gray-100 p-2 text-xs">${record.responseBody || '-'}</pre>
        </div>
        <div>
          <div class="font-medium">耗时</div>
          <div class="text-gray-600">${record.duration}ms</div>
        </div>
        ${
          record.errorMessage
            ? `
        <div>
          <div class="font-medium text-red-600">错误信息</div>
          <div class="text-red-500">${record.errorMessage}</div>
        </div>
        `
            : ''
        }
        <div>
          <div class="font-medium">重试次数</div>
          <div class="text-gray-600">${record.retryCount}</div>
        </div>
      </div>
    `,
  });
}

// ==================== 初始化 ====================
onMounted(() => {
  fetchAlertRules();
  fetchApiKeys();
  fetchWebhooks();
});
</script>

<template>
  <div class="flex h-full flex-col gap-4 p-4">
    <Card class="m-0 p-4">
      <Tabs v-model:active-key="activeTab">
        <!-- 告警规则 -->
        <Tabs.TabPane key="alertRules" tab="告警规则">
          <div class="flex h-full flex-col gap-4">
            <!-- 顶部操作栏 -->
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-500">
                共 {{ alertRules.length }} 条告警规则
              </div>
              <Button type="primary" @click="handleAddAlertRule">
                <Icon icon="lucide:plus" class="mr-1 size-4" />
                新增告警规则
              </Button>
            </div>

            <!-- 告警规则表格 -->
            <Card class="flex-1 overflow-hidden p-0">
              <div class="h-full overflow-auto">
                <table class="w-full border-collapse">
                  <thead class="sticky top-0 bg-gray-50">
                    <tr>
                      <th
                        class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
                      >
                        名称
                      </th>
                      <th
                        class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
                      >
                        类型
                      </th>
                      <th
                        class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
                      >
                        触发条件
                      </th>
                      <th
                        class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
                      >
                        级别
                      </th>
                      <th
                        class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
                      >
                        通知渠道
                      </th>
                      <th
                        class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
                      >
                        状态
                      </th>
                      <th
                        class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
                      >
                        最后触发
                      </th>
                      <th
                        class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
                      >
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="alertRulesLoading">
                      <td colspan="8" class="border-b px-4 py-8 text-center">
                        加载中...
                      </td>
                    </tr>
                    <tr
                      v-else-if="alertRules.length === 0"
                      colspan="8"
                      class="border-b px-4 py-8 text-center text-gray-500"
                    >
                      暂无数据
                    </tr>
                    <tr
                      v-for="item in alertRules"
                      v-else
                      :key="item.id"
                      class="border-b hover:bg-gray-50"
                    >
                      <td class="border-b px-4 py-3">{{ item.name }}</td>
                      <td class="border-b px-4 py-3">
                        <Tag color="blue">{{ formatAlertType(item.type) }}</Tag>
                      </td>
                      <td class="border-b px-4 py-3 text-sm">
                        <div class="text-xs text-gray-500">
                          <span
                            v-for="(value, key) in item.condition"
                            :key="key"
                          >
                            {{ key }} {{ value.operator || '>' }}
                            {{ value.threshold || value }}
                          </span>
                        </div>
                      </td>
                      <td class="border-b px-4 py-3">
                        <Tag :color="formatAlertLevel(item.level).color">
                          {{ formatAlertLevel(item.level).text }}
                        </Tag>
                      </td>
                      <td class="border-b px-4 py-3">
                        <Space>
                          <Tag
                            v-for="channel in item.channels"
                            :key="channel"
                            color="cyan"
                          >
                            {{ channel }}
                          </Tag>
                        </Space>
                      </td>
                      <td class="border-b px-4 py-3">
                        <Tag :color="formatAlertStatus(item.status).color">
                          {{ formatAlertStatus(item.status).text }}
                        </Tag>
                      </td>
                      <td class="border-b px-4 py-3 text-sm text-gray-500">
                        {{
                          item.lastTriggeredAt
                            ? new Date(item.lastTriggeredAt).toLocaleString(
                                'zh-CN',
                              )
                            : '-'
                        }}
                      </td>
                      <td class="border-b px-4 py-3">
                        <Space>
                          <Button
                            type="link"
                            size="small"
                            @click="handleEditAlertRule(item)"
                          >
                            编辑
                          </Button>
                          <Button
                            type="link"
                            size="small"
                            @click="handleToggleAlertStatus(item)"
                          >
                            {{ item.status === 'enabled' ? '禁用' : '启用' }}
                          </Button>
                          <Popconfirm
                            title="确定要删除该告警规则吗?"
                            @confirm="handleDeleteAlertRule(item.id)"
                          >
                            <Button type="link" danger size="small">
                              删除
                            </Button>
                          </Popconfirm>
                        </Space>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </Tabs.TabPane>

        <!-- API密钥 -->
        <Tabs.TabPane key="apiKeys" tab="API密钥">
          <div class="flex h-full flex-col gap-4">
            <!-- 顶部操作栏 -->
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-500">
                共 {{ apiKeys.length }} 个API密钥
              </div>
              <Button type="primary" @click="handleAddApiKey">
                <Icon icon="lucide:plus" class="mr-1 size-4" />
                新增API密钥
              </Button>
            </div>

            <!-- API密钥表格 -->
            <Card class="flex-1 overflow-hidden p-0">
              <div class="h-full overflow-auto">
                <table class="w-full border-collapse">
                  <thead class="sticky top-0 bg-gray-50">
                    <tr>
                      <th
                        class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
                      >
                        名称
                      </th>
                      <th
                        class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
                      >
                        密钥
                      </th>
                      <th
                        class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
                      >
                        租户
                      </th>
                      <th
                        class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
                      >
                        权限
                      </th>
                      <th
                        class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
                      >
                        速率限制
                      </th>
                      <th
                        class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
                      >
                        过期时间
                      </th>
                      <th
                        class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
                      >
                        最后使用
                      </th>
                      <th
                        class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
                      >
                        状态
                      </th>
                      <th
                        class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
                      >
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="apiKeysLoading">
                      <td colspan="9" class="border-b px-4 py-8 text-center">
                        加载中...
                      </td>
                    </tr>
                    <tr
                      v-else-if="apiKeys.length === 0"
                      colspan="9"
                      class="border-b px-4 py-8 text-center text-gray-500"
                    >
                      暂无数据
                    </tr>
                    <tr
                      v-for="item in apiKeys"
                      v-else
                      :key="item.id"
                      class="border-b hover:bg-gray-50"
                    >
                      <td class="border-b px-4 py-3">{{ item.name }}</td>
                      <td
                        class="border-b px-4 py-3 font-mono text-sm text-gray-600"
                      >
                        {{ item.key }}
                      </td>
                      <td class="border-b px-4 py-3">{{ item.tenantName }}</td>
                      <td class="border-b px-4 py-3">
                        <Space>
                          <Tag
                            v-for="perm in item.permissions"
                            :key="perm"
                            :color="perm === '*' ? 'red' : 'blue'"
                          >
                            {{ perm === '*' ? '全部' : perm }}
                          </Tag>
                        </Space>
                      </td>
                      <td class="border-b px-4 py-3 text-sm">
                        {{ item.rateLimit }} 次/分钟
                      </td>
                      <td class="border-b px-4 py-3 text-sm text-gray-500">
                        {{
                          item.expiredAt
                            ? new Date(item.expiredAt).toLocaleDateString(
                                'zh-CN',
                              )
                            : '永不过期'
                        }}
                      </td>
                      <td class="border-b px-4 py-3 text-sm text-gray-500">
                        {{
                          item.lastUsedAt
                            ? new Date(item.lastUsedAt).toLocaleString('zh-CN')
                            : '-'
                        }}
                      </td>
                      <td class="border-b px-4 py-3">
                        <Tag :color="formatApiKeyStatus(item.status).color">
                          {{ formatApiKeyStatus(item.status).text }}
                        </Tag>
                      </td>
                      <td class="border-b px-4 py-3">
                        <Space>
                          <Button
                            type="link"
                            size="small"
                            @click="handleViewApiKey(item)"
                          >
                            查看
                          </Button>
                          <Button
                            type="link"
                            size="small"
                            @click="handleEditApiKey(item)"
                          >
                            编辑
                          </Button>
                          <Button
                            type="link"
                            size="small"
                            @click="handleToggleApiKeyStatus(item)"
                          >
                            {{ item.status === 'active' ? '禁用' : '启用' }}
                          </Button>
                          <Popconfirm
                            title="确定要删除该API密钥吗?"
                            @confirm="handleDeleteApiKey(item.id)"
                          >
                            <Button type="link" danger size="small">
                              删除
                            </Button>
                          </Popconfirm>
                        </Space>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </Tabs.TabPane>

        <!-- Webhook配置 -->
        <Tabs.TabPane key="webhooks" tab="Webhook配置">
          <div class="flex h-full flex-col gap-4">
            <!-- 顶部操作栏 -->
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-500">
                共 {{ webhooks.length }} 个Webhook
              </div>
              <Button type="primary" @click="handleAddWebhook">
                <Icon icon="lucide:plus" class="mr-1 size-4" />
                新增Webhook
              </Button>
            </div>

            <!-- Webhook表格 -->
            <Card class="flex-1 overflow-hidden p-0">
              <div class="h-full overflow-auto">
                <table class="w-full border-collapse">
                  <thead class="sticky top-0 bg-gray-50">
                    <tr>
                      <th
                        class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
                      >
                        名称
                      </th>
                      <th
                        class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
                      >
                        URL
                      </th>
                      <th
                        class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
                      >
                        事件类型
                      </th>
                      <th
                        class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
                      >
                        状态
                      </th>
                      <th
                        class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
                      >
                        最后触发
                      </th>
                      <th
                        class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
                      >
                        最后状态
                      </th>
                      <th
                        class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
                      >
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="webhooksLoading">
                      <td colspan="7" class="border-b px-4 py-8 text-center">
                        加载中...
                      </td>
                    </tr>
                    <tr
                      v-else-if="webhooks.length === 0"
                      colspan="7"
                      class="border-b px-4 py-8 text-center text-gray-500"
                    >
                      暂无数据
                    </tr>
                    <tr
                      v-for="item in webhooks"
                      v-else
                      :key="item.id"
                      class="border-b hover:bg-gray-50"
                    >
                      <td class="border-b px-4 py-3">{{ item.name }}</td>
                      <td
                        class="border-b px-4 py-3 font-mono text-sm text-gray-600"
                      >
                        {{ item.url }}
                      </td>
                      <td class="border-b px-4 py-3">
                        <Space>
                          <Tag
                            v-for="event in item.events"
                            :key="event"
                            color="purple"
                          >
                            {{ formatWebhookEvent(event) }}
                          </Tag>
                        </Space>
                      </td>
                      <td class="border-b px-4 py-3">
                        <Tag :color="formatWebhookStatus(item.status).color">
                          {{ formatWebhookStatus(item.status).text }}
                        </Tag>
                      </td>
                      <td class="border-b px-4 py-3 text-sm text-gray-500">
                        {{
                          item.lastTriggeredAt
                            ? new Date(item.lastTriggeredAt).toLocaleString(
                                'zh-CN',
                              )
                            : '-'
                        }}
                      </td>
                      <td class="border-b px-4 py-3">
                        <Tag
                          v-if="item.lastStatus"
                          :color="formatLastStatus(item.lastStatus)?.color"
                        >
                          {{ formatLastStatus(item.lastStatus)?.text }}
                        </Tag>
                        <span v-else class="text-gray-400">-</span>
                      </td>
                      <td class="border-b px-4 py-3">
                        <Space>
                          <Button
                            type="link"
                            size="small"
                            @click="handleEditWebhook(item)"
                          >
                            编辑
                          </Button>
                          <Button
                            type="link"
                            size="small"
                            @click="handleToggleWebhookStatus(item)"
                          >
                            {{ item.status === 'enabled' ? '禁用' : '启用' }}
                          </Button>
                          <Button
                            type="link"
                            size="small"
                            @click="handleViewWebhookLogs(item)"
                          >
                            查看日志
                          </Button>
                          <Popconfirm
                            title="确定要删除该Webhook吗?"
                            @confirm="handleDeleteWebhook(item.id)"
                          >
                            <Button type="link" danger size="small">
                              删除
                            </Button>
                          </Popconfirm>
                        </Space>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </Tabs.TabPane>
      </Tabs>
    </Card>

    <!-- Webhook调用日志弹窗 -->
    <Modal
      v-model:open="webhookLogsVisible"
      :title="`${currentWebhook?.name || ''} - 调用日志`"
      width="90%"
      :footer="null"
    >
      <div class="max-h-[600px] overflow-auto">
        <table class="w-full border-collapse">
          <thead class="sticky top-0 bg-gray-50">
            <tr>
              <th
                class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
              >
                事件
              </th>
              <th
                class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
              >
                状态码
              </th>
              <th
                class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
              >
                耗时
              </th>
              <th
                class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
              >
                成功
              </th>
              <th
                class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
              >
                重试次数
              </th>
              <th
                class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
              >
                调用时间
              </th>
              <th
                class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
              >
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="webhookLogsLoading">
              <td colspan="7" class="border-b px-4 py-8 text-center">
                加载中...
              </td>
            </tr>
            <tr
              v-else-if="webhookLogs.length === 0"
              colspan="7"
              class="border-b px-4 py-8 text-center text-gray-500"
            >
              暂无日志
            </tr>
            <tr
              v-for="log in webhookLogs"
              v-else
              :key="log.id"
              class="border-b hover:bg-gray-50"
            >
              <td class="border-b px-4 py-3">
                <Tag color="purple">{{ formatWebhookEvent(log.event) }}</Tag>
              </td>
              <td class="border-b px-4 py-3">
                <Tag :color="log.responseCode === 200 ? 'success' : 'error'">
                  {{ log.responseCode || '-' }}
                </Tag>
              </td>
              <td class="border-b px-4 py-3 text-sm">{{ log.duration }}ms</td>
              <td class="border-b px-4 py-3">
                <Tag :color="log.success ? 'success' : 'error'">
                  {{ log.success ? '成功' : '失败' }}
                </Tag>
              </td>
              <td class="border-b px-4 py-3 text-sm">
                {{ log.retryCount }}
              </td>
              <td class="border-b px-4 py-3 text-sm text-gray-500">
                {{ new Date(log.createdAt).toLocaleString('zh-CN') }}
              </td>
              <td class="border-b px-4 py-3">
                <Button
                  type="link"
                  size="small"
                  @click="handleViewLogDetail(log)"
                >
                  查看详情
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Modal>
  </div>
</template>
