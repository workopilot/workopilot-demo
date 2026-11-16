<script setup lang="ts">
import type { Tenant } from '#/types/tenant';

import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Checkbox,
  Drawer,
  Empty,
  message,
  Popconfirm,
  Tabs,
  Tag,
} from 'ant-design-vue';

interface Props {
  open: boolean;
  tenant: null | Tenant;
}

interface Emits {
  (e: 'update:open', value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const drawerTitle = computed(() => {
  return props.tenant ? `${props.tenant.name} - 权限查看` : '权限查看';
});

// 模型提供商选中状态
const selectedProviderIds = ref<string[]>([]);

// 模拟模型提供商数据
const modelProviders = ref([
  { id: '1', name: 'OpenAI', modelCount: 2, enabled: true },
  { id: '2', name: 'Azure OpenAI', modelCount: 2, enabled: true },
  { id: '3', name: '百度文心', modelCount: 2, enabled: false },
  { id: '4', name: '阿里通义', modelCount: 2, enabled: true },
  { id: '5', name: '智谱 AI', modelCount: 3, enabled: false },
  { id: '6', name: '科大讯飞', modelCount: 2, enabled: false },
]);

// 模拟菜单权限数据
const menuPermissions = [
  {
    id: '1',
    name: '审核管理',
    icon: 'lucide:shield-check',
    children: [
      { id: '1-1', name: '基础设置', enabled: true },
      { id: '1-2', name: '工具和数据源', enabled: true },
      { id: '1-3', name: '规则配置', enabled: true },
      { id: '1-4', name: '审核方案', enabled: false },
      { id: '1-5', name: '规则测试', enabled: true },
    ],
  },
  {
    id: '2',
    name: '租户管理',
    icon: 'lucide:building-2',
    children: [{ id: '2-1', name: '租户管理', enabled: true }],
  },
  {
    id: '3',
    name: '运营管理',
    icon: 'lucide:settings-2',
    children: [
      { id: '3-1', name: '模型调用日志', enabled: true },
      { id: '3-2', name: '产品服务', enabled: true },
      { id: '3-3', name: '租户订阅', enabled: false },
      { id: '3-4', name: '用量监控', enabled: true },
    ],
  },
];

// 模拟产品服务数据
const productServices = [
  {
    id: '1',
    name: '智能附件分类',
    version: 'Pro',
    description: '基于 AI 的智能附件自动分类服务，支持多种文档格式',
    expiryDate: '2025-12-31',
    status: 'active',
  },
  {
    id: '2',
    name: '智能附件比对',
    version: 'Plus',
    description: '智能比对相似附件，识别差异和重复内容',
    expiryDate: '2025-06-30',
    status: 'active',
  },
  {
    id: '3',
    name: '智能单据填报',
    version: 'Standard',
    description: '自动识别单据内容并智能填报，提高工作效率',
    expiryDate: '2025-03-31',
    status: 'expired',
  },
  {
    id: '4',
    name: '智能单据审核',
    version: 'ProMax',
    description: 'AI 驱动的单据审核服务，智能识别异常和风险',
    expiryDate: '2025-09-30',
    status: 'active',
  },
];

function handleCancel() {
  emit('update:open', false);
}

// 全选/取消全选
function handleSelectAll(e: any) {
  const checked = e.target.checked;
  selectedProviderIds.value = checked
    ? modelProviders.value.map((p) => p.id)
    : [];
}

// 单个选择
function handleSelectChange(id: string, checked: boolean) {
  if (checked) {
    selectedProviderIds.value.push(id);
  } else {
    const index = selectedProviderIds.value.indexOf(id);
    if (index !== -1) {
      selectedProviderIds.value.splice(index, 1);
    }
  }
}

// 批量开通
function handleBatchEnable() {
  if (selectedProviderIds.value.length === 0) {
    message.warning('请先选择要开通的模型提供商');
    return;
  }

  modelProviders.value.forEach((provider) => {
    if (selectedProviderIds.value.includes(provider.id)) {
      provider.enabled = true;
    }
  });

  message.success(`成功开通 ${selectedProviderIds.value.length} 个模型提供商`);
  selectedProviderIds.value = [];
}

// 批量取消开通
function handleBatchDisable() {
  if (selectedProviderIds.value.length === 0) {
    message.warning('请先选择要取消的模型提供商');
    return;
  }

  modelProviders.value.forEach((provider) => {
    if (selectedProviderIds.value.includes(provider.id)) {
      provider.enabled = false;
    }
  });

  message.success(`成功取消 ${selectedProviderIds.value.length} 个模型提供商`);
  selectedProviderIds.value = [];
}

// 单个取消开通
function handleDisableProvider(id: string) {
  const provider = modelProviders.value.find((p) => p.id === id);
  if (provider) {
    provider.enabled = false;
    message.success(`已取消 ${provider.name} 的开通`);
  }
}

// 是否全选
const isAllSelected = computed(() => {
  return (
    modelProviders.value.length > 0 &&
    selectedProviderIds.value.length === modelProviders.value.length
  );
});

// 是否部分选中
const isIndeterminate = computed(() => {
  return (
    selectedProviderIds.value.length > 0 &&
    selectedProviderIds.value.length < modelProviders.value.length
  );
});

function formatExpiryDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN');
}
</script>

<template>
  <Drawer
    :open="open"
    :title="drawerTitle"
    placement="right"
    :width="800"
    @close="handleCancel"
  >
    <Tabs>
      <!-- 管理模型提供商 -->
      <Tabs.TabPane key="providers" tab="管理模型提供商">
        <div class="py-4">
          <!-- 功能描述 -->
          <div class="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
            管理租户可使用的 AI 模型提供商，支持批量开通或取消开通权限。
          </div>

          <!-- 批量操作栏 -->
          <div
            class="mb-4 flex items-center justify-between rounded-lg bg-muted/50 p-3"
          >
            <div class="flex items-center gap-2">
              <Checkbox
                :indeterminate="isIndeterminate"
                :checked="isAllSelected"
                @change="handleSelectAll"
              >
                <span class="text-sm">全选</span>
              </Checkbox>
              <span class="text-sm text-muted-foreground">
                已选 {{ selectedProviderIds.length }} /
                {{ modelProviders.length }} 个
              </span>
            </div>
            <div class="flex gap-2">
              <Button
                size="small"
                :disabled="selectedProviderIds.length === 0"
                @click="handleBatchDisable"
              >
                <Icon icon="lucide:x" class="mr-1 size-4" />
                取消开通
              </Button>
              <Button
                type="primary"
                size="small"
                :disabled="selectedProviderIds.length === 0"
                @click="handleBatchEnable"
              >
                <Icon icon="lucide:check" class="mr-1 size-4" />
                批量开通
              </Button>
            </div>
          </div>

          <!-- 模型提供商列表 -->
          <div v-if="modelProviders.length > 0" class="space-y-3">
            <div
              v-for="provider in modelProviders"
              :key="provider.id"
              class="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors"
              :class="
                selectedProviderIds.includes(provider.id)
                  ? 'border-primary bg-primary/5'
                  : ''
              "
            >
              <div class="flex items-center gap-3">
                <Checkbox
                  :checked="selectedProviderIds.includes(provider.id)"
                  @change="
                    (e: any) =>
                      handleSelectChange(provider.id, e.target.checked)
                  "
                />
                <Icon icon="lucide:cpu" class="size-5 text-primary" />
                <div>
                  <div class="font-medium">
                    {{ provider.name }}
                    <Tag size="small" class="ml-1">
                      {{ provider.modelCount }}个模型
                    </Tag>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Tag :color="provider.enabled ? 'success' : 'default'">
                  {{ provider.enabled ? '已开通' : '未开通' }}
                </Tag>
                <Popconfirm
                  v-if="provider.enabled"
                  title="确定要取消开通此模型提供商吗?"
                  ok-text="确定"
                  cancel-text="取消"
                  @confirm="handleDisableProvider(provider.id)"
                >
                  <Button type="text" size="small" danger>
                    <Icon icon="lucide:x-circle" class="size-4" />
                  </Button>
                </Popconfirm>
              </div>
            </div>
          </div>
          <Empty v-else description="暂无模型提供商" />
        </div>
      </Tabs.TabPane>

      <!-- 查看菜单权限 -->
      <Tabs.TabPane key="menus" tab="查看菜单权限">
        <div class="py-4">
          <!-- 功能描述 -->
          <div class="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            查看租户当前拥有的菜单访问权限，按功能模块分组展示。
          </div>
          <div v-if="menuPermissions.length > 0" class="space-y-4">
            <div
              v-for="module in menuPermissions"
              :key="module.id"
              class="rounded-lg border border-border bg-card p-4"
            >
              <div class="mb-3 flex items-center gap-2">
                <Icon :icon="module.icon" class="size-5 text-primary" />
                <span class="font-medium">{{ module.name }}</span>
              </div>
              <div class="ml-7 space-y-2">
                <div
                  v-for="menu in module.children"
                  :key="menu.id"
                  class="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                >
                  <span class="text-sm">{{ menu.name }}</span>
                  <Tag
                    :color="menu.enabled ? 'success' : 'default'"
                    size="small"
                  >
                    {{ menu.enabled ? '已授权' : '未授权' }}
                  </Tag>
                </div>
              </div>
            </div>
          </div>
          <Empty v-else description="暂无菜单权限" />
        </div>
      </Tabs.TabPane>

      <!-- 查看产品服务 -->
      <Tabs.TabPane key="services" tab="查看产品服务">
        <div class="py-4">
          <!-- 功能描述 -->
          <div class="mb-4 rounded-lg bg-orange-50 p-3 text-sm text-orange-700">
            查看租户已订阅的产品服务及到期时间，了解服务使用状态。
          </div>
          <div v-if="productServices.length > 0" class="space-y-3">
            <div
              v-for="service in productServices"
              :key="service.id"
              class="flex items-start justify-between rounded-lg border border-border bg-card p-4"
            >
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-medium">{{ service.name }}</span>
                  <Tag color="blue" size="small">{{ service.version }}</Tag>
                </div>
                <div class="mt-2 text-sm text-muted-foreground">
                  {{ service.description }}
                </div>
                <div class="mt-1 text-sm text-muted-foreground">
                  到期时间：{{ formatExpiryDate(service.expiryDate) }}
                </div>
              </div>
              <div class="ml-4">
                <Tag
                  :color="
                    service.status === 'active'
                      ? 'success'
                      : service.status === 'expired'
                        ? 'error'
                        : 'default'
                  "
                >
                  {{
                    service.status === 'active'
                      ? '生效中'
                      : service.status === 'expired'
                        ? '已过期'
                        : '未启用'
                  }}
                </Tag>
              </div>
            </div>
          </div>
          <Empty v-else description="暂无产品服务" />
        </div>
      </Tabs.TabPane>
    </Tabs>
  </Drawer>
</template>
