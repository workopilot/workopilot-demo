<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue';

import type { FillingLog, FillingLogQueryParams } from '#/types/filling';

import { onMounted, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  DatePicker,
  Input,
  message,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import { exportFillingLogsApi, getFillingLogsApi } from '#/api/filling';

import LogDetailDrawer from './modals/log-detail-drawer.vue';

const loading = ref(false);
const exporting = ref(false);
const tableData = ref<FillingLog[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const searchExpanded = ref(true);

// 查询参数
const queryParams = ref<FillingLogQueryParams>({
  page: 1,
  pageSize: 20,
  sortBy: 'filledAt',
  sortOrder: 'desc',
});

// 日志详情抽屉
const detailDrawerOpen = ref(false);
const selectedLogId = ref<null | string>(null);

// 单据类型选项
const billTypeOptions = [
  { label: '费用报销单', value: '费用报销单' },
  { label: '采购申请单', value: '采购申请单' },
  { label: '付款申请单', value: '付款申请单' },
  { label: '请假申请单', value: '请假申请单' },
];

// 填报状态选项
const statusOptions = [
  { label: '成功', value: 'success' },
  { label: '失败', value: 'failed' },
];

// 单据状态选项
const billStatusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '已提交', value: 'submitted' },
];

// 状态映射
const statusMap: Record<string, { color: string; text: string }> = {
  success: { text: '成功', color: 'success' },
  failed: { text: '失败', color: 'error' },
};

// 单据状态映射
const billStatusMap: Record<string, { color: string; text: string }> = {
  draft: { text: '草稿', color: 'default' },
  submitted: { text: '已提交', color: 'blue' },
};

// 获取日志列表
async function fetchLogs() {
  loading.value = true;
  try {
    const params = {
      ...queryParams.value,
      page: currentPage.value,
      pageSize: pageSize.value,
    };
    const response = await getFillingLogsApi(params);
    tableData.value = response.data.items;
    total.value = response.data.total;
  } catch (error) {
    message.error('获取日志列表失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

// 切换展开/收起
function toggleExpand() {
  searchExpanded.value = !searchExpanded.value;
}

// 查询
function handleSearch() {
  currentPage.value = 1;
  fetchLogs();
}

// 重置查询
function handleReset() {
  queryParams.value = {
    page: 1,
    pageSize: pageSize.value,
    sortBy: 'filledAt',
    sortOrder: 'desc',
  };
  currentPage.value = 1;
  fetchLogs();
}

// 排序改变
function handleTableChange(_pagination: any, _filters: any, sorter: any) {
  if (sorter.field) {
    queryParams.value.sortBy = sorter.field;
    queryParams.value.sortOrder = sorter.order === 'ascend' ? 'asc' : 'desc';
  }
  fetchLogs();
}

// 查看详情
function handleViewDetail(logId: string) {
  selectedLogId.value = logId;
  detailDrawerOpen.value = true;
}

// 刷新
function handleRefresh() {
  fetchLogs();
}

// 导出Excel
async function handleExport() {
  exporting.value = true;
  try {
    const params = {
      ...queryParams.value,
      page: 1,
      pageSize: 999_999,
    };
    await exportFillingLogsApi(params);
    message.success('导出成功');
  } catch (error) {
    message.error('导出失败');
    console.error(error);
  } finally {
    exporting.value = false;
  }
}

// 格式化时间
function formatTime(time: string) {
  return new Date(time).toLocaleString('zh-CN');
}

// 格式化耗时
function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}

// 表格列定义
const columns: TableColumnsType<FillingLog> = [
  {
    title: '单号',
    dataIndex: 'billNo',
    key: 'billNo',
    width: 150,
    fixed: 'left',
  },
  {
    title: '单据类型',
    dataIndex: 'billType',
    key: 'billType',
    width: 120,
  },
  {
    title: '执行脚本',
    dataIndex: 'scriptName',
    key: 'scriptName',
    width: 180,
  },
  {
    title: '目标系统',
    dataIndex: 'systemName',
    key: 'systemName',
    width: 150,
  },
  {
    title: '填报状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
  },
  {
    title: '单据状态',
    dataIndex: 'billStatus',
    key: 'billStatus',
    width: 100,
  },
  {
    title: '填报人',
    dataIndex: 'filledBy',
    key: 'filledBy',
    width: 100,
  },
  {
    title: '填报时间',
    dataIndex: 'filledAt',
    key: 'filledAt',
    width: 160,
    sorter: true,
    defaultSortOrder: 'descend',
  },
  {
    title: '耗时',
    dataIndex: 'duration',
    key: 'duration',
    width: 100,
    align: 'right',
    sorter: true,
  },
  {
    title: '操作',
    key: 'action',
    width: 80,
    fixed: 'right',
  },
];

onMounted(() => {
  fetchLogs();
});
</script>

<template>
  <div class="h-full space-y-4 overflow-y-auto p-6">
    <!-- 查询表单 -->
    <div class="rounded-lg border bg-card p-4 shadow-sm">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-lg font-semibold">筛选条件</h3>
        <Button type="text" size="small" @click="toggleExpand">
          <template #icon>
            <Icon
              :icon="
                searchExpanded ? 'lucide:chevron-up' : 'lucide:chevron-down'
              "
              class="size-4"
            />
          </template>
          {{ searchExpanded ? '收起' : '展开' }}
        </Button>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <!-- 单号 -->
        <div class="space-y-1">
          <label class="text-sm font-medium">单号</label>
          <Input
            v-model:value="queryParams.billNo"
            allow-clear
            placeholder="请输入单号"
          />
        </div>

        <!-- 单据类型 -->
        <div class="space-y-1">
          <label class="text-sm font-medium">单据类型</label>
          <Select
            v-model:value="queryParams.billType"
            allow-clear
            placeholder="请选择单据类型"
            class="w-full"
          >
            <Select.Option
              v-for="item in billTypeOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </Select.Option>
          </Select>
        </div>

        <!-- 填报时间 -->
        <div class="space-y-1">
          <label class="text-sm font-medium">填报时间</label>
          <DatePicker.RangePicker
            class="w-full"
            format="YYYY-MM-DD HH:mm:ss"
            show-time
            @change="
              (dates: any) => {
                if (dates && dates[0] && dates[1]) {
                  queryParams.startTime = dates[0].toISOString();
                  queryParams.endTime = dates[1].toISOString();
                } else {
                  queryParams.startTime = undefined;
                  queryParams.endTime = undefined;
                }
              }
            "
          />
        </div>

        <!-- 填报状态 -->
        <div v-show="searchExpanded" class="space-y-1">
          <label class="text-sm font-medium">填报状态</label>
          <Select
            v-model:value="queryParams.status"
            allow-clear
            placeholder="请选择填报状态"
            class="w-full"
          >
            <Select.Option
              v-for="item in statusOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </Select.Option>
          </Select>
        </div>

        <!-- 单据状态 -->
        <div v-show="searchExpanded" class="space-y-1">
          <label class="text-sm font-medium">单据状态</label>
          <Select
            v-model:value="queryParams.billStatus"
            allow-clear
            placeholder="请选择单据状态"
            class="w-full"
          >
            <Select.Option
              v-for="item in billStatusOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </Select.Option>
          </Select>
        </div>

        <!-- 执行脚本 -->
        <div v-show="searchExpanded" class="space-y-1">
          <label class="text-sm font-medium">执行脚本</label>
          <Input
            v-model:value="queryParams.scriptId"
            allow-clear
            placeholder="请输入脚本ID"
          />
        </div>
      </div>

      <div class="mt-4 flex items-center justify-end gap-2 border-t pt-3">
        <Button size="small" @click="handleReset">
          <Icon icon="lucide:rotate-ccw" class="mr-1 size-4" />
          重置
        </Button>
        <Button type="primary" size="small" @click="handleSearch">
          <Icon icon="lucide:search" class="mr-1 size-4" />
          搜索
        </Button>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="rounded-lg border bg-card shadow-sm">
      <!-- 表格标题和操作栏 -->
      <div class="flex items-center justify-between border-b px-4 py-3">
        <h3 class="text-lg font-semibold">填报日志列表</h3>
        <Space>
          <Button type="primary" :loading="exporting" @click="handleExport">
            导出
          </Button>
          <Tooltip title="刷新">
            <Button @click="handleRefresh">
              <Icon icon="lucide:refresh-cw" class="size-4" />
            </Button>
          </Tooltip>
        </Space>
      </div>

      <Table
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :pagination="{
          current: currentPage,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }"
        :scroll="{ x: 1200 }"
        row-key="id"
        bordered
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <!-- 填报状态 -->
          <template v-if="column.key === 'status'">
            <Tag :color="statusMap[record.status].color">
              {{ statusMap[record.status].text }}
            </Tag>
          </template>

          <!-- 单据状态 -->
          <template v-else-if="column.key === 'billStatus'">
            <Tag :color="billStatusMap[record.billStatus].color">
              {{ billStatusMap[record.billStatus].text }}
            </Tag>
          </template>

          <!-- 填报时间 -->
          <template v-else-if="column.key === 'filledAt'">
            <span class="text-xs">{{ formatTime(record.filledAt) }}</span>
          </template>

          <!-- 耗时 -->
          <template v-else-if="column.key === 'duration'">
            <span class="font-mono">{{ formatDuration(record.duration) }}</span>
          </template>

          <!-- 操作 -->
          <template v-else-if="column.key === 'action'">
            <Button
              type="link"
              size="small"
              @click="handleViewDetail(record.id)"
            >
              查看
            </Button>
          </template>
        </template>
      </Table>
    </div>

    <!-- 日志详情抽屉 -->
    <LogDetailDrawer v-model:open="detailDrawerOpen" :log-id="selectedLogId" />
  </div>
</template>
