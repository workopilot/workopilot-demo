<script setup lang="ts">
import type { Executor, ExecutorStatus, ExecutorType } from './types';

import { computed, onMounted, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Card,
  message,
  Popconfirm,
  Select,
  Space,
  Tag,
} from 'ant-design-vue';

import AllocationStrategyModal from './modals/allocation-strategy-modal.vue';
import ExecutorFormModal from './modals/executor-form-modal.vue';

// 列表数据
const tableData = ref<Executor[]>([]);
const loading = ref(false);

// 筛选条件
const filters = ref({
  status: undefined as ExecutorStatus | undefined,
  type: undefined as ExecutorType | undefined,
});

// 弹窗
const modalOpen = ref(false);
const editingExecutor = ref<Executor | null>(null);
const strategyModalOpen = ref(false);

// 统计数据
const stats = computed(() => {
  const total = tableData.value.length;
  const idle = tableData.value.filter((e) => e.status === 'idle').length;
  const busy = tableData.value.filter((e) => e.status === 'busy').length;
  const playwright = tableData.value.filter(
    (e) => e.type === 'playwright',
  ).length;
  const browserPlugin = tableData.value.filter(
    (e) => e.type === 'browser-plugin',
  ).length;

  return { total, idle, busy, playwright, browserPlugin };
});

// 过滤后的数据
const filteredData = computed(() => {
  let data = tableData.value;

  if (filters.value.status) {
    data = data.filter((e) => e.status === filters.value.status);
  }

  if (filters.value.type) {
    data = data.filter((e) => e.type === filters.value.type);
  }

  return data;
});

// 获取执行器列表
async function fetchExecutors() {
  loading.value = true;
  try {
    // 模拟数据
    await new Promise((resolve) => setTimeout(resolve, 300));

    const mockData: Executor[] = [
      {
        id: '1',
        name: '生产环境Playwright执行器-01',
        code: 'EXEC-PROD-PW-001',
        type: 'playwright',
        status: 'busy',
        maxConcurrentTasks: 5,
        currentQueue: 2,
        playwrightConfig: {
          headless: true,
          browserType: 'chromium',
          viewport: { width: 1920, height: 1080 },
        },
        description: '生产环境主执行器，负责处理核心业务单据填报',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-03-20T14:25:00Z',
      },
      {
        id: '2',
        name: '生产环境Playwright执行器-02',
        code: 'EXEC-PROD-PW-002',
        type: 'playwright',
        status: 'idle',
        maxConcurrentTasks: 5,
        currentQueue: 0,
        playwrightConfig: {
          headless: true,
          browserType: 'chromium',
        },
        description: '生产环境备用执行器',
        createdAt: '2024-01-20T09:00:00Z',
        updatedAt: '2024-03-19T16:40:00Z',
      },
      {
        id: '3',
        name: '浏览器插件执行器-01',
        code: 'EXEC-BP-001',
        type: 'browser-plugin',
        status: 'busy',
        maxConcurrentTasks: 10,
        currentQueue: 3,
        browserPluginConfig: {
          pluginId: 'smart-filling-plugin-v2',
          requiredVersion: '2.1.0',
          supportedBrowsers: ['Chrome', 'Edge'],
        },
        description: '通过浏览器插件执行填报任务',
        createdAt: '2024-02-01T08:00:00Z',
        updatedAt: '2024-03-21T10:15:00Z',
      },
      {
        id: '4',
        name: '测试环境Playwright执行器',
        code: 'EXEC-TEST-PW-001',
        type: 'playwright',
        status: 'maintenance',
        maxConcurrentTasks: 3,
        currentQueue: 0,
        playwrightConfig: {
          headless: false,
          browserType: 'chromium',
        },
        description: '测试环境执行器，用于脚本调试',
        createdAt: '2024-02-10T11:20:00Z',
        updatedAt: '2024-03-18T13:50:00Z',
      },
    ];

    tableData.value = mockData;
  } catch (error) {
    message.error('获取执行器列表失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

// 新增执行器
function handleAdd() {
  editingExecutor.value = null;
  modalOpen.value = true;
}

// 编辑执行器
function handleEdit(executor: Executor) {
  editingExecutor.value = executor;
  modalOpen.value = true;
}

// 删除执行器
async function handleDelete(_id: string) {
  try {
    message.success('删除成功');
    fetchExecutors();
  } catch (error) {
    message.error('删除失败');
    console.error(error);
  }
}

// 类型配置
const typeConfig: Record<
  ExecutorType,
  { color: string; desc: string; icon: string; text: string }
> = {
  playwright: {
    color: 'blue',
    text: 'Playwright',
    icon: 'logos:nodejs-icon',
    desc: '服务端自动化，使用 Playwright 在服务器上运行无头浏览器执行填报任务',
  },
  'browser-plugin': {
    color: 'green',
    text: '浏览器插件',
    icon: 'lucide:puzzle',
    desc: '客户端自动化，通过浏览器插件操控用户浏览器进行填报操作',
  },
};

// 获取类型配置
function getTypeConfig(type: ExecutorType) {
  return typeConfig[type];
}

// 格式化时间
function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
}

// 格式化表单提交
function handleModalSuccess() {
  modalOpen.value = false;
  fetchExecutors();
}

onMounted(() => {
  fetchExecutors();
});
</script>

<template>
  <div class="executors-container min-h-screen bg-slate-50 p-6">
    <!-- 页面头部 -->
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">执行器管理</h1>
          <p class="mt-1 text-sm text-slate-500">
            管理自动填报执行器，支持Playwright服务端和浏览器插件两种模式
          </p>
        </div>
        <Space size="small">
          <Button @click="strategyModalOpen = true">
            <Icon icon="lucide:settings-2" class="mr-1 size-4" />
            执行器分配策略
          </Button>
          <Button type="primary" @click="handleAdd">
            <Icon icon="lucide:plus" class="mr-1 size-4" />
            新增执行器
          </Button>
        </Space>
      </div>

      <!-- 统计卡片 -->
      <div class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card class="border-l-4 border-l-blue-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500">执行器总数</p>
              <p class="mt-1 text-2xl font-bold text-slate-900">
                {{ stats.total }}
              </p>
            </div>
            <div
              class="flex size-12 items-center justify-center rounded-full bg-blue-100"
            >
              <Icon icon="lucide:server" class="size-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card class="border-l-4 border-l-blue-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500">Playwright</p>
              <p class="mt-1 text-2xl font-bold text-slate-900">
                {{ stats.playwright }}
              </p>
            </div>
            <div
              class="flex size-12 items-center justify-center rounded-full bg-blue-100"
            >
              <Icon icon="logos:nodejs-icon" class="size-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card class="border-l-4 border-l-emerald-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500">浏览器插件</p>
              <p class="mt-1 text-2xl font-bold text-slate-900">
                {{ stats.browserPlugin }}
              </p>
            </div>
            <div
              class="flex size-12 items-center justify-center rounded-full bg-emerald-100"
            >
              <Icon icon="lucide:puzzle" class="size-6 text-emerald-600" />
            </div>
          </div>
        </Card>
      </div>
    </div>

    <!-- 筛选栏 -->
    <Card class="mb-4">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-slate-600">状态:</span>
          <Select
            v-model:value="filters.status"
            placeholder="全部状态"
            allow-clear
            class="!w-32"
            size="small"
          >
            <Select.Option value="idle">空闲</Select.Option>
            <Select.Option value="busy">执行中</Select.Option>
            <Select.Option value="offline">离线</Select.Option>
            <Select.Option value="maintenance">维护中</Select.Option>
          </Select>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-slate-600">类型:</span>
          <Select
            v-model:value="filters.type"
            placeholder="全部类型"
            allow-clear
            class="!w-40"
            size="small"
          >
            <Select.Option value="playwright">Playwright</Select.Option>
            <Select.Option value="browser-plugin">浏览器插件</Select.Option>
          </Select>
        </div>

        <div class="ml-auto text-sm text-slate-500">
          共
          <span class="font-bold text-slate-900">
            {{ filteredData.length }}
          </span>
          个执行器
        </div>
      </div>
    </Card>

    <!-- 执行器列表 -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="text-center">
        <div
          class="mb-4 inline-block size-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"
        ></div>
        <p class="text-slate-500">加载中...</p>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="executor in filteredData"
        :key="executor.id"
        class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
      >
        <!-- 头部信息 -->
        <div class="mb-4 flex items-start justify-between">
          <div class="flex flex-1 items-start gap-4">
            <!-- 类型图标 -->
            <div
              class="flex size-14 shrink-0 items-center justify-center rounded-xl"
              :class="`bg-${getTypeConfig(executor.type).color}-100`"
            >
              <Icon
                :icon="getTypeConfig(executor.type).icon"
                class="size-7"
                :class="`text-${getTypeConfig(executor.type).color}-600`"
              />
            </div>

            <!-- 基本信息 -->
            <div class="flex-1">
              <div class="flex items-center gap-3">
                <h3 class="text-lg font-semibold text-slate-900">
                  {{ executor.name }}
                </h3>
                <Tag :color="getTypeConfig(executor.type).color">
                  {{ getTypeConfig(executor.type).text }}
                </Tag>
              </div>

              <div
                class="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500"
              >
                <div class="flex items-center gap-1">
                  <Icon icon="lucide:cpu" class="size-4" />
                  <span class="font-mono">{{ executor.code }}</span>
                </div>
              </div>

              <!-- 描述 -->
              <p
                v-if="executor.description"
                class="mt-2 text-sm text-slate-600"
              >
                {{ executor.description }}
              </p>

              <!-- 更新时间 -->
              <div class="mt-3 flex items-center gap-1 text-xs text-slate-400">
                <Icon icon="lucide:clock" class="size-3" />
                <span>更新于 {{ formatTime(executor.updatedAt) }}</span>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <Space size="small">
            <Button size="small" @click="handleEdit(executor)">
              <Icon icon="lucide:edit" class="size-4" />
            </Button>
            <Popconfirm
              title="确定要删除此执行器吗?"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleDelete(executor.id)"
            >
              <Button size="small" danger>
                <Icon icon="lucide:trash-2" class="size-4" />
              </Button>
            </Popconfirm>
          </Space>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div
      v-if="!loading && filteredData.length === 0"
      class="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-20"
    >
      <Icon icon="lucide:server" class="mb-4 size-16 text-slate-300" />
      <p class="text-lg text-slate-500">暂无执行器</p>
      <p class="mt-2 text-sm text-slate-400">点击"新增执行器"开始配置</p>
    </div>

    <!-- 执行器表单弹窗 -->
    <ExecutorFormModal
      v-model:open="modalOpen"
      :executor="editingExecutor"
      @success="handleModalSuccess"
    />

    <!-- 分配策略弹窗 -->
    <AllocationStrategyModal v-model:open="strategyModalOpen" />
  </div>
</template>
