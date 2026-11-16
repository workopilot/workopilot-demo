<script setup lang="ts">
import { ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Input, Table, Tag } from 'ant-design-vue';

import ConfigDrawer from './drawer.vue';

// State
const drawerOpen = ref(false);
const editingSystem = ref(null);
const searchText = ref('');

// Mock Data
const dataSource = ref([
  {
    id: 's_1',
    name: '用友 NC Cloud',
    url: 'https://nc.example.com/login',
    authPolicy: 'global',
    status: 'success',
    createdAt: '2024-03-01 10:23',
  },
  {
    id: 's_2',
    name: 'SAP S/4HANA (总部)',
    url: 'https://sap.group.com/fiori',
    authPolicy: 'user',
    status: 'success',
    createdAt: '2024-03-02 14:10',
  },
  {
    id: 's_3',
    name: '自研差旅报销平台',
    url: 'http://travel.internal.corp:8080',
    authPolicy: 'user',
    status: 'warning',
    createdAt: '2024-03-05 09:45',
  },
]);

// Columns
const columns = [
  { title: '系统名称', dataIndex: 'name', key: 'name', width: 220 },
  { title: '登录 URL', dataIndex: 'url', key: 'url', width: 300 },
  {
    title: '账户授权策略',
    dataIndex: 'authPolicy',
    key: 'authPolicy',
    width: 180,
  },
  { title: '连通状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160 },
  { title: '操作', key: 'action', width: 120, align: 'center' },
];

function handleAdd() {
  editingSystem.value = null;
  drawerOpen.value = true;
}

function handleEdit(record: any) {
  editingSystem.value = { ...record };
  drawerOpen.value = true;
}

function handleSaved(record: any) {
  const index = dataSource.value.findIndex((item) => item.id === record.id);
  if (index === -1) {
    dataSource.value.unshift(record);
  } else {
    dataSource.value[index] = record;
  }
}
</script>

<template>
  <div class="flex h-full flex-col gap-6 bg-slate-50/50 p-6 md:p-8">
    <!-- Header -->
    <div class="flex items-end justify-between">
      <div>
        <h1 class="mb-2 text-3xl font-bold tracking-tight text-slate-900">
          系统配置
        </h1>
        <p class="font-medium text-slate-500">
          统一管理目标业务系统地址及前置账户授权策略。
        </p>
      </div>
      <div class="flex items-center gap-3">
        <Input.Search
          v-model:value="searchText"
          placeholder="搜索系统名称或地址"
          allow-clear
          class="!w-[280px]"
          size="large"
        />
        <Button
          size="large"
          type="primary"
          class="!rounded-xl !bg-slate-900 !px-6 !font-semibold"
          @click="handleAdd"
        >
          <Icon icon="lucide:plus" class="mr-2" />
          添加系统
        </Button>
      </div>
    </div>

    <!-- Table Card -->
    <div
      class="flex-1 rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm"
    >
      <Table
        :columns="columns"
        :data-source="dataSource"
        :pagination="{ pageSize: 15 }"
        class="custom-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <div class="flex items-center gap-3">
              <div
                class="flex h-8 w-8 items-center justify-center rounded bg-slate-100 text-slate-500"
              >
                <Icon icon="lucide:layout-dashboard" />
              </div>
              <span class="font-bold text-slate-800">{{ record.name }}</span>
            </div>
          </template>

          <template v-if="column.key === 'url'">
            <a
              :href="record.url"
              target="_blank"
              class="font-mono text-xs text-blue-500 hover:underline"
            >
              {{ record.url }}
            </a>
          </template>

          <template v-else-if="column.key === 'authPolicy'">
            <Tag
              v-if="record.authPolicy === 'global'"
              class="mt-1 flex w-fit items-center gap-1.5 !rounded-md !border-blue-200 !bg-blue-50 !px-2.5 !py-0.5 text-xs font-medium !text-blue-600"
            >
              <Icon icon="lucide:bot" />
              全局代理 (Agent)
            </Tag>
            <Tag
              v-else
              class="mt-1 flex w-fit items-center gap-1.5 !rounded-md !border-emerald-200 !bg-emerald-50 !px-2.5 !py-0.5 text-xs font-medium !text-emerald-700"
            >
              <Icon icon="lucide:user" />
              用户本人 (User Auth)
            </Tag>
          </template>

          <template v-else-if="column.key === 'status'">
            <div class="flex items-center gap-2">
              <span class="relative flex h-2.5 w-2.5">
                <span
                  v-if="record.status === 'success'"
                  class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
                ></span>
                <span
                  class="relative inline-flex h-2.5 w-2.5 rounded-full"
                  :class="
                    record.status === 'success'
                      ? 'bg-emerald-500'
                      : 'bg-amber-400'
                  "
                ></span>
              </span>
              <span class="text-sm font-medium text-slate-600">
                {{ record.status === 'success' ? '已连通' : '离线' }}
              </span>
            </div>
          </template>

          <template v-else-if="column.key === 'action'">
            <Button
              type="text"
              class="font-medium text-slate-500 hover:text-blue-600"
              @click="handleEdit(record)"
            >
              <Icon icon="lucide:settings-2" class="mr-1" />
              配置
            </Button>
          </template>
        </template>
      </Table>
    </div>

    <!-- Drawer -->
    <ConfigDrawer
      v-model:open="drawerOpen"
      :system="editingSystem"
      @saved="handleSaved"
    />
  </div>
</template>

<style scoped>
:deep(.ant-table-wrapper .ant-table-thead > tr > th) {
  @apply border-b border-slate-200 bg-slate-50 py-4 font-semibold text-slate-500;
}

:deep(.ant-table-wrapper .ant-table-tbody > tr > td) {
  @apply border-b border-slate-100 py-4;
}
</style>
