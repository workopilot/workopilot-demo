<script setup lang="ts">
import type { AiApiKey } from '#/types/aiservice';

import { onMounted, ref } from 'vue';

import { Icon } from '@iconify/vue';
import { useClipboard } from '@vueuse/core';
import {
  Button,
  Input,
  message,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  deleteApiKeyApi,
  getApiKeyListApi,
  revokeApiKeyApi,
} from '#/api/aiservice';

import KeyDrawer from './key-drawer.vue';
import LogModal from './log-modal.vue';

const loading = ref(false);
const dataList = ref<AiApiKey[]>([]);
const searchRemark = ref('');

const drawerOpen = ref(false);
const logsOpen = ref(false);
const currentKeyId = ref('');
const currentKeyRemark = ref('');

const { copy } = useClipboard({ legacy: true });
const showKeyMap = ref<Record<string, boolean>>({});

const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '备注', dataIndex: 'remark' },
  { title: 'Access Key', dataIndex: 'accessKey', width: 320 },
  { title: '状态', dataIndex: 'status', width: 100 },
  {
    title: '创建时间',
    dataIndex: 'createdTime',
    width: 180,
    customRender: ({ text }) => dayjs(text).format('YYYY-MM-DD HH:mm'),
  },
  { title: '过期时间', dataIndex: 'expirationTime', width: 180 },
  { title: '操作', key: 'action', width: 180, fixed: 'right' },
];

async function loadData() {
  loading.value = true;
  try {
    const res = await getApiKeyListApi({ remark: searchRemark.value });
    dataList.value = res.data;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

function handleCreate() {
  drawerOpen.value = true;
}

function handleLogs(item: AiApiKey) {
  currentKeyId.value = item.id;
  currentKeyRemark.value = item.remark;
  logsOpen.value = true;
}

async function handleRevoke(id: string) {
  try {
    await revokeApiKeyApi(id);
    message.success('已撤销');
    loadData();
  } catch (error) {
    console.error(error);
  }
}

async function handleDelete(id: string) {
  try {
    await deleteApiKeyApi(id);
    message.success('已删除');
    loadData();
  } catch (error) {
    console.error(error);
  }
}

function handleCopy(text: string) {
  copy(text);
  message.success('已复制到剪贴板');
}

function toggleShowKey(id: string) {
  showKeyMap.value[id] = !showKeyMap.value[id];
}

function getMaskedKey(key: string) {
  if (!key) return '';
  const prefix = key.slice(0, 3);
  const suffix = key.slice(Math.max(0, key.length - 4));
  return `${prefix}****************${suffix}`;
}

function isExpired(time?: string) {
  if (!time) return false;
  return dayjs(time).isBefore(dayjs());
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="flex min-h-full flex-col gap-4 bg-slate-50 p-4">
    <div
      class="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
    >
      <div class="flex items-center gap-4">
        <div class="rounded-lg bg-indigo-50 p-2 text-indigo-600">
          <Icon icon="lucide:key" class="size-6" />
        </div>
        <div>
          <h1 class="m-0 text-xl font-bold leading-none text-gray-800">
            API Key 管理
          </h1>
          <p class="mb-0 mt-1 text-xs text-gray-400">
            管理用于程序化访问的密钥凭证
          </p>
        </div>
      </div>
      <div class="flex gap-3">
        <Input.Search
          v-model:value="searchRemark"
          placeholder="搜索备注..."
          class="w-64"
          allow-clear
          @search="loadData"
        />
        <Button
          type="primary"
          class="shadow-md shadow-indigo-500/20"
          @click="handleCreate"
        >
          <Icon icon="lucide:plus" class="mr-1" /> 新建密钥
        </Button>
      </div>
    </div>

    <div
      class="flex flex-1 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
    >
      <Table
        :columns="columns"
        :data-source="dataList"
        :loading="loading"
        row-key="id"
        :pagination="{ pageSize: 10 }"
        :scroll="{ x: 1000 }"
        class="flex-1"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'accessKey'">
            <div class="group flex items-center gap-2">
              <div
                class="rounded border border-gray-200 bg-gray-50 px-2 py-1 font-mono text-gray-600"
              >
                {{
                  showKeyMap[record.id]
                    ? record.accessKey
                    : getMaskedKey(record.accessKey)
                }}
              </div>
              <div
                class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Tooltip title="显示/隐藏">
                  <Icon
                    :icon="
                      showKeyMap[record.id] ? 'lucide:eye-off' : 'lucide:eye'
                    "
                    class="cursor-pointer text-gray-400 hover:text-blue-600"
                    @click="toggleShowKey(record.id)"
                  />
                </Tooltip>
                <Tooltip title="复制">
                  <Icon
                    icon="lucide:copy"
                    class="cursor-pointer text-gray-400 hover:text-blue-600"
                    @click="handleCopy(record.accessKey)"
                  />
                </Tooltip>
              </div>
            </div>
          </template>

          <template v-if="column.dataIndex === 'status'">
            <Tag v-if="record.status === 0" color="error">已撤销</Tag>
            <Tag v-else-if="isExpired(record.expirationTime)" color="warning">
              已过期
            </Tag>
            <Tag v-else color="success">使用中</Tag>
          </template>

          <template v-if="column.dataIndex === 'expirationTime'">
            <span :class="isExpired(record) ? 'text-red-500' : 'text-gray-500'">
              {{
                record.expirationTime
                  ? dayjs(record.expirationTime).format('YYYY-MM-DD HH:mm')
                  : '永久有效'
              }}
            </span>
          </template>

          <template v-if="column.key === 'action'">
            <Space>
              <Button type="text" size="small" @click="handleLogs(record)">
                <span class="text-blue-600">日志</span>
              </Button>
              <Popconfirm
                v-if="record.status === 1"
                title="确定要撤销此密钥吗？撤销后将无法恢复使用。"
                @confirm="handleRevoke(record.id)"
              >
                <Button type="text" size="small" danger>撤销</Button>
              </Popconfirm>
              <Popconfirm
                title="确定删除吗？"
                @confirm="handleDelete(record.id)"
              >
                <Button
                  type="text"
                  size="small"
                  class="text-gray-400 hover:text-red-500"
                >
                  删除
                </Button>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>
    </div>

    <KeyDrawer v-model:open="drawerOpen" @success="loadData" />
    <LogModal
      v-model:open="logsOpen"
      :api-key-id="currentKeyId"
      :api-key-remark="currentKeyRemark"
    />
  </div>
</template>
