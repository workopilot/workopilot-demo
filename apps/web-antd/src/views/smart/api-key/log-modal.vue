<script setup lang="ts">
import type { AiApiKeyLog } from '#/types/aiservice';

import { reactive, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import { useClipboard } from '@vueuse/core';
import {
  Button,
  Input,
  message,
  Modal,
  RangePicker,
  Table,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { getApiKeyLogsApi } from '#/api/aiservice';

const props = defineProps<{
  apiKeyId?: string;
  apiKeyRemark?: string;
  open: boolean;
}>();

const emit = defineEmits(['update:open']);

const loading = ref(false);
const logs = ref([] as AiApiKeyLog[]);
const searchParams = reactive({
  keyword: '',
  dateRange: [] as any[],
});

const { copy } = useClipboard({ legacy: true });

const columns = [
  {
    title: '时间',
    dataIndex: 'createdTime',
    width: 180,
    customRender: ({ text }: { text: string }) =>
      dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
  },
  { title: '请求方法', dataIndex: 'requestMethod', width: 100 },
  { title: '调用路径', dataIndex: 'requestUrl' },
  { title: '状态', dataIndex: 'isSuccess', width: 100 },
];

function handleClose() {
  emit('update:open', false);
  searchParams.keyword = '';
  searchParams.dateRange = [];
}

function handleCopy(text: string) {
  if (!text) return;
  copy(text);
  message.success('已复制');
}

async function loadLogs() {
  if (!props.apiKeyId) return;

  loading.value = true;
  try {
    const [start, end] = searchParams.dateRange || [];
    const res = await getApiKeyLogsApi(props.apiKeyId, {
      keyword: searchParams.keyword,
      startTime: start ? dayjs(start).startOf('day').toISOString() : undefined,
      endTime: end ? dayjs(end).endOf('day').toISOString() : undefined,
    });
    logs.value = res.data;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.open,
  (val) => {
    if (val) {
      loadLogs();
    } else {
      logs.value = [];
    }
  },
);
</script>

<template>
  <Modal
    :open="open"
    :title="`调用日志 - ${apiKeyRemark || props.apiKeyId}`"
    width="900px"
    @cancel="handleClose"
    :footer="null"
    :body-style="{ padding: '0 24px 24px 24px' }"
  >
    <div class="mb-4 flex gap-2">
      <Input.Search
        v-model:value="searchParams.keyword"
        placeholder="搜索路径/请求/响应..."
        class="w-64"
        allow-clear
        @search="loadLogs"
      />
      <div class="flex-1"></div>

      <RangePicker v-model:value="searchParams.dateRange" @change="loadLogs" />
      <Button @click="loadLogs">刷新</Button>
    </div>

    <Table
      :columns="columns"
      :data-source="logs"
      :loading="loading"
      row-key="id"
      :pagination="{ pageSize: 10, size: 'small' }"
      size="middle"
      :scroll="{ y: 500 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'requestMethod'">
          <Tag :color="record.requestMethod === 'GET' ? 'blue' : 'green'">
            {{ record.requestMethod }}
          </Tag>
        </template>
        <template v-if="column.dataIndex === 'isSuccess'">
          <Tag :color="record.isSuccess ? 'success' : 'error'">
            {{ record.isSuccess ? '成功' : '失败' }}
          </Tag>
        </template>
      </template>

      <template #expandedRowRender="{ record }">
        <div
          class="flex flex-col gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4 shadow-inner"
        >
          <div v-if="record.message" class="text-sm font-medium text-red-500">
            <Icon icon="lucide:alert-circle" class="mr-1 inline" />
            {{ record.message }}
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1">
              <div
                class="flex items-center justify-between text-xs text-gray-500"
              >
                <span class="font-bold">Request Data</span>
                <Icon
                  icon="lucide:copy"
                  class="cursor-pointer hover:text-blue-500"
                  @click="handleCopy(record.requestData)"
                />
              </div>
              <div
                class="h-32 overflow-auto whitespace-pre-wrap break-all rounded border bg-white p-2 font-mono text-xs text-gray-600"
              >
                {{ record.requestData }}
              </div>
            </div>
            <div class="flex flex-col gap-1">
              <div
                class="flex items-center justify-between text-xs text-gray-500"
              >
                <span class="font-bold">Response Data</span>
                <Icon
                  icon="lucide:copy"
                  class="cursor-pointer hover:text-blue-500"
                  @click="handleCopy(record.responseData)"
                />
              </div>
              <div
                class="h-32 overflow-auto whitespace-pre-wrap break-all rounded border bg-white p-2 font-mono text-xs text-gray-600"
              >
                {{ record.responseData }}
              </div>
            </div>
          </div>
        </div>
      </template>
    </Table>
  </Modal>
</template>
