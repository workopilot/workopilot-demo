<script setup lang="ts">
import type {
  IpRule,
  NotificationTemplate,
  SystemConfig,
} from '#/types/platform';

import { h, onMounted, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Card,
  Form,
  InputNumber,
  Menu,
  message,
  Popconfirm,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  getIpRulesApi,
  getNotificationTemplatesApi,
  getPackagesApi,
  getSystemConfigsApi,
  updateSystemConfigApi,
} from '#/api/platform';

// 菜单项
const menuItems = [
  {
    key: 'global',
    icon: () => h(Icon, { icon: 'lucide:settings', class: 'size-4' }),
    label: '全局参数',
  },
  {
    key: 'notification',
    icon: () => h(Icon, { icon: 'lucide:bell', class: 'size-4' }),
    label: '通知模板',
  },
  {
    key: 'ip',
    icon: () => h(Icon, { icon: 'lucide:shield', class: 'size-4' }),
    label: 'IP规则',
  },
];

// 菜单选择
const selectedMenuKeys = ref<string[]>(['global']);
const activeTab = ref('global');

// 全局参数
const configsLoading = ref(false);
const systemConfigs = ref<SystemConfig[]>([]);
const packages = ref<any[]>([]);
const defaultPackageId = ref('');
const overLimitStrategy = ref('block');
const enableRegistration = ref(true);
const maintenanceMode = ref(false);
const maxConcurrentUsers = ref(1000);
const sessionTimeout = ref(30);

// 通知模板
const templatesLoading = ref(false);
const notificationTemplates = ref<NotificationTemplate[]>([]);

const templateColumns = [
  {
    title: '模板名称',
    dataIndex: 'name',
    key: 'name',
    width: 150,
  },
  {
    title: '渠道',
    dataIndex: 'channel',
    key: 'channel',
    width: 100,
  },
  {
    title: '标题',
    dataIndex: 'title',
    key: 'title',
    width: 200,
  },
  {
    title: '内容预览',
    dataIndex: 'content',
    key: 'content',
    ellipsis: true,
  },
  {
    title: '状态',
    dataIndex: 'enabled',
    key: 'enabled',
    width: 80,
    align: 'center',
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    align: 'center',
  },
];

// IP规则
const ipRulesLoading = ref(false);
const ipRules = ref<IpRule[]>([]);

const ipRuleColumns = [
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 100,
  },
  {
    title: 'IP地址',
    dataIndex: 'ip',
    key: 'ip',
    width: 200,
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true,
  },
  {
    title: '状态',
    dataIndex: 'enabled',
    key: 'enabled',
    width: 80,
    align: 'center',
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    align: 'center',
  },
];

// 菜单切换
function handleMenuClick({ key }: { key: string }) {
  activeTab.value = key;
  selectedMenuKeys.value = [key];

  // 加载对应数据
  if (key === 'notification') {
    loadNotificationTemplates();
  } else if (key === 'ip') {
    loadIpRules();
  }
}

// 加载系统配置
async function loadSystemConfigs() {
  configsLoading.value = true;
  try {
    const { data } = await getSystemConfigsApi();
    systemConfigs.value = data;

    // 提取配置值
    const configMap = new Map(data.map((c) => [c.key, c.value]));
    defaultPackageId.value = configMap.get('defaultPackageId') || '';
    overLimitStrategy.value = configMap.get('overLimitStrategy') || 'block';
    enableRegistration.value = configMap.get('enableRegistration') ?? true;
    maintenanceMode.value = configMap.get('maintenanceMode') ?? false;
    maxConcurrentUsers.value = configMap.get('maxConcurrentUsers') || 1000;
    sessionTimeout.value = configMap.get('sessionTimeout') || 30;
  } catch {
    message.error('加载系统配置失败');
  } finally {
    configsLoading.value = false;
  }
}

// 加载套餐列表
async function loadPackages() {
  try {
    const { data } = await getPackagesApi();
    packages.value = data;
  } catch {
    message.error('加载套餐列表失败');
  }
}

// 配置变更
async function handleConfigChange(key: string, value: any) {
  try {
    await updateSystemConfigApi(key, value);
    message.success('配置更新成功');

    // 更新本地状态
    const config = systemConfigs.value.find((c) => c.key === key);
    if (config) {
      config.value = value;
    }
  } catch {
    message.error('配置更新失败');
  }
}

// 加载通知模板
async function loadNotificationTemplates() {
  templatesLoading.value = true;
  try {
    const { data } = await getNotificationTemplatesApi();
    notificationTemplates.value = data;
  } catch {
    message.error('加载通知模板失败');
  } finally {
    templatesLoading.value = false;
  }
}

// 渠道颜色
function getChannelColor(channel: string) {
  const colorMap: Record<string, string> = {
    email: 'blue',
    sms: 'green',
    webhook: 'orange',
    'in-app': 'purple',
  };
  return colorMap[channel] || 'default';
}

// 渠道标签
function getChannelLabel(channel: string) {
  const labelMap: Record<string, string> = {
    email: '邮件',
    sms: '短信',
    webhook: 'Webhook',
    'in-app': '站内信',
  };
  return labelMap[channel] || channel;
}

// 新增模板
function handleAddTemplate() {
  message.info('新增模板功能待实现');
}

// 编辑模板
function handleEditTemplate(record: NotificationTemplate) {
  message.info(`编辑模板: ${record.name}`);
}

// 删除模板
function handleDeleteTemplate(record: NotificationTemplate) {
  message.info(`删除模板: ${record.name}`);
}

// 切换模板状态
async function handleToggleTemplate(
  record: NotificationTemplate,
  checked: boolean,
) {
  record.enabled = checked;
  message.success(`${checked ? '启用' : '禁用'}成功`);
}

// 加载IP规则
async function loadIpRules() {
  ipRulesLoading.value = true;
  try {
    const { data } = await getIpRulesApi();
    ipRules.value = data;
  } catch {
    message.error('加载IP规则失败');
  } finally {
    ipRulesLoading.value = false;
  }
}

// 新增IP规则
function handleAddIpRule() {
  message.info('新增IP规则功能待实现');
}

// 编辑IP规则
function handleEditIpRule(record: IpRule) {
  message.info(`编辑IP规则: ${record.ip}`);
}

// 删除IP规则
function handleDeleteIpRule(record: IpRule) {
  const index = ipRules.value.findIndex((r) => r.id === record.id);
  if (index !== -1) {
    ipRules.value.splice(index, 1);
    message.success('删除成功');
  }
}

// 切换IP规则状态
async function handleToggleIpRule(record: IpRule, checked: boolean) {
  record.enabled = checked;
  message.success(`${checked ? '启用' : '禁用'}成功`);
}

// 初始化
onMounted(() => {
  loadSystemConfigs();
  loadPackages();
});
</script>

<template>
  <div class="flex h-full gap-6">
    <!-- 左侧导航栏 -->
    <div class="w-56 flex-shrink-0">
      <Card class="h-full">
        <Menu
          v-model:selected-keys="selectedMenuKeys"
          mode="inline"
          class="border-none"
          :items="menuItems"
          @click="handleMenuClick"
        />
      </Card>
    </div>

    <!-- 右侧内容区 -->
    <div class="flex-1 overflow-auto">
      <!-- 全局参数 -->
      <div v-if="activeTab === 'global'" class="space-y-4">
        <Card title="全局参数" :bordered="false">
          <Spin :spinning="configsLoading">
            <Form :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
              <Form.Item label="默认套餐">
                <Select
                  v-model:value="defaultPackageId"
                  style="width: 100%"
                  @change="handleConfigChange('defaultPackageId', $event)"
                >
                  <Select.Option
                    v-for="pkg in packages"
                    :key="pkg.id"
                    :value="pkg.id"
                  >
                    {{ pkg.name }}
                  </Select.Option>
                </Select>
              </Form.Item>

              <Form.Item label="超限策略">
                <Select
                  v-model:value="overLimitStrategy"
                  style="width: 100%"
                  @change="handleConfigChange('overLimitStrategy', $event)"
                >
                  <Select.Option value="block">阻止访问</Select.Option>
                  <Select.Option value="charge">额外计费</Select.Option>
                  <Select.Option value="warning">仅警告</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item label="开放注册">
                <Switch
                  :checked="enableRegistration"
                  @change="
                    (checked: boolean) =>
                      handleConfigChange('enableRegistration', checked)
                  "
                />
                <span class="ml-2 text-sm text-gray-500">
                  是否允许新用户自助注册
                </span>
              </Form.Item>

              <Form.Item label="系统维护模式">
                <Switch
                  :checked="maintenanceMode"
                  @change="
                    (checked: boolean) =>
                      handleConfigChange('maintenanceMode', checked)
                  "
                />
                <span class="ml-2 text-sm text-gray-500">
                  开启后系统将进入维护模式,仅管理员可访问
                </span>
              </Form.Item>

              <Form.Item label="最大并发用户数">
                <InputNumber
                  v-model:value="maxConcurrentUsers"
                  :min="1"
                  :max="10000"
                  style="width: 100%"
                  @change="handleConfigChange('maxConcurrentUsers', $event)"
                />
              </Form.Item>

              <Form.Item label="会话超时时间">
                <InputNumber
                  v-model:value="sessionTimeout"
                  :min="5"
                  :max="1440"
                  addon-after="分钟"
                  style="width: 100%"
                  @change="handleConfigChange('sessionTimeout', $event)"
                />
              </Form.Item>
            </Form>
          </Spin>
        </Card>
      </div>

      <!-- 通知模板 -->
      <div v-if="activeTab === 'notification'" class="space-y-4">
        <Card title="通知模板" :bordered="false">
          <template #extra>
            <Button type="primary" @click="handleAddTemplate">
              <Icon icon="lucide:plus" class="size-4" />
              新增模板
            </Button>
          </template>

          <Spin :spinning="templatesLoading">
            <Table
              :columns="templateColumns"
              :data-source="notificationTemplates"
              :pagination="false"
              row-key="id"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'channel'">
                  <Tag :color="getChannelColor(record.channel)">
                    {{ getChannelLabel(record.channel) }}
                  </Tag>
                </template>

                <template v-if="column.key === 'enabled'">
                  <Switch
                    :checked="record.enabled"
                    @change="
                      (checked: boolean) =>
                        handleToggleTemplate(record, checked)
                    "
                  />
                </template>

                <template v-if="column.key === 'action'">
                  <Space>
                    <Button
                      type="link"
                      size="small"
                      @click="handleEditTemplate(record)"
                    >
                      编辑
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      danger
                      @click="handleDeleteTemplate(record)"
                    >
                      删除
                    </Button>
                  </Space>
                </template>
              </template>
            </Table>
          </Spin>
        </Card>
      </div>

      <!-- IP规则 -->
      <div v-if="activeTab === 'ip'" class="space-y-4">
        <Card title="IP规则" :bordered="false">
          <template #extra>
            <Button type="primary" @click="handleAddIpRule">
              <Icon icon="lucide:plus" class="size-4" />
              新增规则
            </Button>
          </template>

          <Spin :spinning="ipRulesLoading">
            <Table
              :columns="ipRuleColumns"
              :data-source="ipRules"
              :pagination="false"
              row-key="id"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'type'">
                  <Tag :color="record.type === 'whitelist' ? 'green' : 'red'">
                    {{ record.type === 'whitelist' ? '白名单' : '黑名单' }}
                  </Tag>
                </template>

                <template v-if="column.key === 'enabled'">
                  <Switch
                    :checked="record.enabled"
                    @change="
                      (checked: boolean) => handleToggleIpRule(record, checked)
                    "
                  />
                </template>

                <template v-if="column.key === 'action'">
                  <Space>
                    <Button
                      type="link"
                      size="small"
                      @click="handleEditIpRule(record)"
                    >
                      编辑
                    </Button>
                    <Popconfirm
                      title="确定要删除这条规则吗?"
                      @confirm="handleDeleteIpRule(record)"
                    >
                      <Button type="link" size="small" danger> 删除 </Button>
                    </Popconfirm>
                  </Space>
                </template>
              </template>
            </Table>
          </Spin>
        </Card>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.ant-menu-item) {
  height: 40px;
  margin: 0;
  line-height: 40px;
}
</style>
