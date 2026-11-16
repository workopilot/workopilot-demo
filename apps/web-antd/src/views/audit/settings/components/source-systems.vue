<script setup lang="ts">
import type { ConnectionTestResult, SourceSystem } from '#/types/settings';

import { onMounted, ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Card, message, Popconfirm, Spin, Tag } from 'ant-design-vue';

import {
  deleteSourceSystemApi,
  getSourceSystemsApi,
  testConnectionApi,
} from '#/api/settings';

import SystemFormModal from '../modals/system-form-modal.vue';

const loading = ref(false);
const systems = ref<SourceSystem[]>([]);
const modalOpen = ref(false);
const editingSystem = ref<null | SourceSystem>(null);
const testingSystemId = ref<null | string>(null);

// 获取系统列表
async function fetchSystems() {
  loading.value = true;
  try {
    const response = await getSourceSystemsApi();
    systems.value = response.data || [];
  } catch (error) {
    message.error('获取业务系统列表失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

// 打开新增弹窗
function handleAdd() {
  editingSystem.value = null;
  modalOpen.value = true;
}

// 打开编辑弹窗
function handleEdit(system: SourceSystem) {
  editingSystem.value = system;
  modalOpen.value = true;
}

// 删除系统
async function handleDelete(id: string) {
  try {
    await deleteSourceSystemApi(id);
    message.success('删除成功');
    await fetchSystems();
  } catch (error) {
    message.error('删除失败');
    console.error(error);
  }
}

// 连接测试
async function handleTestConnection(id: string) {
  testingSystemId.value = id;
  try {
    const response = await testConnectionApi(id);
    const result: ConnectionTestResult = response.data;

    if (result.success) {
      message.success(`连接成功！延迟: ${result.latency}ms`);
    } else {
      message.error(`连接失败: ${result.message}`);
    }
  } catch (error) {
    message.error('连接测试失败');
    console.error(error);
  } finally {
    testingSystemId.value = null;
  }
}

// 保存成功回调
async function handleSaveSuccess() {
  modalOpen.value = false;
  await fetchSystems();
}

// 厂商映射
const vendorMap: Record<string, string> = {
  SAP: 'SAP',
  Yonyou: '用友',
  Kingdee: '金蝶',
  Custom: '自研',
};

// 状态映射
const statusMap = {
  enabled: { text: '已启用', color: 'success' },
  disabled: { text: '已禁用', color: 'default' },
};

onMounted(() => {
  fetchSystems();
});
</script>

<template>
  <div>
    <!-- 头部 -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-semibold">业务系统</h2>
        <p class="mt-1 text-sm text-muted-foreground">
          管理连接的业务系统和API配置
        </p>
      </div>
      <Button type="primary" @click="handleAdd">
        <Icon icon="lucide:plus" class="mr-1 size-4" />
        新增系统
      </Button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <Spin size="large" tip="加载中..." />
    </div>

    <!-- 系统卡片Grid -->
    <div
      v-else-if="systems.length > 0"
      class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
    >
      <Card
        v-for="system in systems"
        :key="system.id"
        class="transition-all hover:shadow-lg"
      >
        <template #title>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <Icon icon="lucide:database" class="size-8 text-primary" />
              <div>
                <div class="font-semibold">{{ system.name }}</div>
                <div class="text-xs font-normal text-muted-foreground">
                  {{ system.code }}
                </div>
              </div>
            </div>
            <Tag :color="statusMap[system.status].color">
              {{ statusMap[system.status].text }}
            </Tag>
          </div>
        </template>

        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-muted-foreground">厂商</span>
            <span>{{ vendorMap[system.vendor] }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Base URL</span>
            <span class="max-w-[180px] truncate" :title="system.baseUrl">
              {{ system.baseUrl }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">鉴权方式</span>
            <Tag size="small">{{ system.authConfig.type }}</Tag>
          </div>
        </div>

        <div class="mt-4 flex gap-2">
          <Button
            size="small"
            :loading="testingSystemId === system.id"
            @click="handleTestConnection(system.id)"
          >
            <Icon icon="lucide:wifi" class="mr-1 size-3" />
            连接测试
          </Button>
          <Button size="small" @click="handleEdit(system)"> 编辑 </Button>
          <Popconfirm
            title="确定要删除此系统吗?"
            ok-text="确定"
            cancel-text="取消"
            @confirm="handleDelete(system.id)"
          >
            <Button size="small" danger>
              <Icon icon="lucide:trash-2" class="size-3" />
            </Button>
          </Popconfirm>
        </div>
      </Card>
    </div>

    <!-- 空状态 -->
    <div
      v-else
      class="flex flex-col items-center justify-center py-20 text-center"
    >
      <Icon
        icon="lucide:inbox"
        class="mb-4 size-16 text-muted-foreground opacity-50"
      />
      <p class="mb-4 text-muted-foreground">暂无业务系统</p>
      <Button type="primary" @click="handleAdd">新增第一个系统</Button>
    </div>

    <!-- 系统表单弹窗 -->
    <SystemFormModal
      v-model:open="modalOpen"
      :system="editingSystem"
      @success="handleSaveSuccess"
    />
  </div>
</template>
