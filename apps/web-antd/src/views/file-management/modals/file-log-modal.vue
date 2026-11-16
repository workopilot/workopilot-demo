<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue';

import type { FileInfo, FileOperationLog } from '#/types/file-management';

import { computed, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import {
  message,
  Modal,
  Pagination,
  Select,
  Table,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import { getFileLogs } from '#/api/file-management';

interface Props {
  open: boolean;
  file: FileInfo | null;
}

interface Emits {
  (e: 'update:open', value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const internalOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
});

// ==================== 操作类型配置 ====================

const OPERATION_CONFIG: Record<
  string,
  { color: string; icon: string; label: string }
> = {
  upload: { label: '上传', icon: 'lucide:upload', color: 'blue' },
  view: { label: '查看', icon: 'lucide:eye', color: 'green' },
  download: { label: '下载', icon: 'lucide:download', color: 'purple' },
  forward: { label: '转发', icon: 'lucide:share', color: 'orange' },
  delete: { label: '删除', icon: 'lucide:trash-2', color: 'red' },
  archive: { label: '归档', icon: 'lucide:archive', color: 'default' },
  restore: { label: '恢复', icon: 'lucide:undo', color: 'cyan' },
  permission_change: {
    label: '权限变更',
    icon: 'lucide:shield',
    color: 'gold',
  },
  category_change: { label: '分类变更', icon: 'lucide:tag', color: 'lime' },
};

const OPERATION_OPTIONS = [
  { label: '全部操作', value: '' },
  ...Object.entries(OPERATION_CONFIG).map(([value, { label }]) => ({
    label,
    value,
  })),
];

// ==================== 日志数据 ====================

const logData = ref<FileOperationLog[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const pageSizeOptions = ref([10, 20, 30, 40, 50]);
const loading = ref(false);
const selectedOperation = ref<string>('');

// ==================== 获取日志 ====================

async function fetchLogs() {
  if (!props.file) return;

  loading.value = true;
  try {
    const response = await getFileLogs({
      page: currentPage.value,
      pageSize: pageSize.value,
      fileId: props.file.id,
      operation: selectedOperation.value || undefined,
    });
    logData.value = response.data.items;
    total.value = response.data.total;
  } catch (error) {
    message.error('获取操作日志失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

// ==================== 工具函数 ====================

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN');
}

function getOperationConfig(type: string) {
  return (
    OPERATION_CONFIG[type] || {
      label: type,
      icon: 'lucide:help-circle',
      color: 'default',
    }
  );
}

// ==================== 导出日志 ====================

function handleExportLogs() {
  message.info('导出功能开发中...');
  // 实际场景中调用导出接口
}

// ==================== 表格列定义 ====================

const columns: TableColumnsType<FileOperationLog> = [
  {
    title: '操作类型',
    key: 'operation',
    width: 120,
  },
  {
    title: '操作详情',
    dataIndex: 'detail',
    key: 'detail',
    ellipsis: true,
  },
  {
    title: '操作人',
    key: 'operator',
    width: 140,
  },
  {
    title: '操作时间',
    dataIndex: 'operatedAt',
    key: 'operatedAt',
    width: 160,
  },
  {
    title: '结果',
    key: 'result',
    width: 80,
    align: 'center',
  },
];

// ==================== 监听弹窗打开 ====================

watch(
  () => props.open,
  (newVal) => {
    if (newVal && props.file) {
      currentPage.value = 1;
      selectedOperation.value = '';
      fetchLogs();
    }
  },
);

watch([currentPage, selectedOperation], () => {
  if (props.open) {
    fetchLogs();
  }
});
</script>

<template>
  <Modal
    v-model:open="internalOpen"
    title="文件操作日志"
    :width="900"
    :footer="null"
  >
    <template v-if="file">
      <!-- 文件信息 -->
      <div class="mb-4 flex items-center gap-3 rounded-lg bg-muted/50 p-3">
        <Icon icon="lucide:file-text" class="size-8 text-primary" />
        <div class="min-w-0 flex-1">
          <div class="truncate font-medium">{{ file.name }}</div>
          <div class="text-xs text-muted-foreground">文件ID: {{ file.id }}</div>
        </div>
      </div>

      <!-- 筛选条件 -->
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-sm text-muted-foreground">操作类型:</span>
          <Select
            v-model:value="selectedOperation"
            :options="OPERATION_OPTIONS"
            style="width: 150px"
          />
        </div>
        <Tooltip title="导出日志">
          <button
            class="flex size-8 items-center justify-center rounded hover:bg-muted"
            @click="handleExportLogs"
          >
            <Icon icon="lucide:download" class="size-4" />
          </button>
        </Tooltip>
      </div>

      <!-- 日志列表 -->
      <Table
        :columns="columns"
        :data-source="logData"
        :row-key="(record: FileOperationLog) => record.id"
        :pagination="false"
        :loading="loading"
        size="small"
        :scroll="{ y: 400 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'operation'">
            <div class="flex items-center gap-1.5">
              <Icon
                :icon="getOperationConfig(record.operation).icon"
                :class="`size-4 text-${getOperationConfig(record.operation).color}-500`"
              />
              <span>{{ getOperationConfig(record.operation).label }}</span>
            </div>
          </template>

          <template v-else-if="column.key === 'operator'">
            <div class="text-xs">
              <div class="font-medium">{{ record.operatorName }}</div>
              <div class="text-muted-foreground">{{ record.operatorDept }}</div>
            </div>
          </template>

          <template v-else-if="column.key === 'operatedAt'">
            <span class="text-xs text-muted-foreground">{{
              formatDate(record.operatedAt)
            }}</span>
          </template>

          <template v-else-if="column.key === 'result'">
            <Tag
              :color="record.result === 'success' ? 'success' : 'error'"
              size="small"
            >
              {{ record.result === 'success' ? '成功' : '失败' }}
            </Tag>
          </template>
        </template>
      </Table>

      <!-- 分页 -->
      <div class="mt-4 flex items-center justify-between border-t px-4 py-3">
        <!-- 左侧：共X条记录 -->
        <span class="text-sm text-muted-foreground">
          共 {{ total }} 条记录
        </span>

        <!-- 中间：每页条数选择 -->
        <Select
          v-model:value="pageSize"
          size="small"
          class="w-24"
          @change="
            () => {
              currentPage = 1;
              fetchLogs();
            }
          "
        >
          <Select.Option
            v-for="size in pageSizeOptions"
            :key="size"
            :value="size"
          >
            {{ size }}条/页
          </Select.Option>
        </Select>

        <!-- 右侧：翻页按钮 -->
        <Pagination
          v-model:current="currentPage"
          :total="total"
          :page-size="pageSize"
          size="small"
          :show-size-changer="false"
          :show-total="false"
          @change="fetchLogs"
        />
      </div>
    </template>

    <div v-else class="flex h-40 items-center justify-center">
      <span class="text-muted-foreground">暂无日志信息</span>
    </div>
  </Modal>
</template>
