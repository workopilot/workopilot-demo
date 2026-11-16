<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue';

import type { ModelLogListItem, ModelLogQueryParams } from '#/types/model-logs';

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

import { exportModelLogsApi, getModelLogsApi } from '#/api/model-logs';

import LogDetailDrawer from './modals/log-detail-drawer.vue';

const loading = ref(false);
const exporting = ref(false);
const tableData = ref<ModelLogListItem[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const searchExpanded = ref(true);

// 查询参数
const queryParams = ref<ModelLogQueryParams>({
  page: 1,
  pageSize: 20,
  sortBy: 'calledAt',
  sortOrder: 'desc',
});

// 日志详情抽屉
const detailDrawerOpen = ref(false);
const selectedLogId = ref<null | string>(null);

// 业务类型选项
const businessTypeOptions = [
  { label: '智能审核', value: 'audit' },
  { label: '智能问答', value: 'chat' },
  { label: '附件分类', value: 'classification' },
  { label: '信息提取', value: 'extraction' },
  { label: '文本翻译', value: 'translation' },
  { label: '内容摘要', value: 'summary' },
];

// 模型级别选项
const modelLevelOptions = [
  { label: '标准版', value: 'standard' },
  { label: '高级版', value: 'advanced' },
];

// 模型厂商选项
const modelVendorOptions = [
  { label: 'OpenAI', value: 'OpenAI' },
  { label: 'Anthropic', value: 'Anthropic' },
  { label: 'Google', value: 'Google' },
  { label: '百度', value: 'Baidu' },
  { label: '阿里云', value: 'Alibaba' },
  { label: 'Azure', value: 'Azure' },
];

// 状态选项
const statusOptions = [
  { label: '成功', value: 'success' },
  { label: '失败', value: 'failed' },
  { label: '超时', value: 'timeout' },
];

// 业务类型映射
const businessTypeMap: Record<string, string> = {
  audit: '智能审核',
  chat: '智能问答',
  classification: '附件分类',
  extraction: '信息提取',
  translation: '文本翻译',
  summary: '内容摘要',
};

// 模型级别映射
const modelLevelMap: Record<string, { color: string; text: string }> = {
  standard: { text: '标准版', color: 'blue' },
  advanced: { text: '高级版', color: 'cyan' },
};

// 状态映射
const statusMap: Record<string, { color: string; text: string }> = {
  success: { text: '成功', color: 'success' },
  failed: { text: '失败', color: 'error' },
  timeout: { text: '超时', color: 'warning' },
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
    const response = await getModelLogsApi(params);
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
    sortBy: 'calledAt',
    sortOrder: 'desc',
  };
  currentPage.value = 1;
  fetchLogs();
}

// 排序改变
function handleTableChange(pagination: any, filters: any, sorter: any) {
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
    await exportModelLogsApi(params);
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

// 表格列定义
const columns: TableColumnsType<ModelLogListItem> = [
  {
    title: '请求ID',
    dataIndex: 'requestId',
    key: 'requestId',
    width: 160,
    fixed: 'left',
  },
  {
    title: '业务类型',
    dataIndex: 'businessType',
    key: 'businessType',
    width: 100,
  },
  {
    title: '模型名称',
    dataIndex: 'modelName',
    key: 'modelName',
    width: 140,
  },
  {
    title: '模型厂商',
    dataIndex: 'modelVendor',
    key: 'modelVendor',
    width: 100,
  },
  {
    title: '模型级别',
    dataIndex: 'modelLevel',
    key: 'modelLevel',
    width: 100,
  },
  {
    title: '租户名称',
    dataIndex: 'tenantName',
    key: 'tenantName',
    width: 120,
  },
  {
    title: '调用状态',
    dataIndex: 'status',
    key: 'status',
    width: 90,
  },
  {
    title: '输入Token',
    dataIndex: 'inputTokens',
    key: 'inputTokens',
    width: 100,
    align: 'right',
  },
  {
    title: '输出Token',
    dataIndex: 'outputTokens',
    key: 'outputTokens',
    width: 100,
    align: 'right',
  },
  {
    title: '总Token',
    dataIndex: 'totalTokens',
    key: 'totalTokens',
    width: 100,
    align: 'right',
    sorter: true,
  },
  {
    title: '调用时间',
    dataIndex: 'calledAt',
    key: 'calledAt',
    width: 160,
    sorter: true,
    defaultSortOrder: 'descend',
  },
  {
    title: '耗时(ms)',
    dataIndex: 'duration',
    key: 'duration',
    width: 100,
    align: 'right',
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
        <!-- 租户名称 -->
        <div class="space-y-1">
          <label class="text-sm font-medium">租户名称</label>
          <Input
            v-model:value="queryParams.tenantId"
            allow-clear
            placeholder="请输入租户ID"
          />
        </div>

        <!-- 调用时间 -->
        <div class="space-y-1">
          <label class="text-sm font-medium">调用时间</label>
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

        <!-- 请求ID -->
        <div class="space-y-1">
          <label class="text-sm font-medium">请求ID</label>
          <Input
            v-model:value="queryParams.requestId"
            allow-clear
            placeholder="请输入请求ID"
          />
        </div>

        <!-- 模型厂商 -->
        <div v-show="searchExpanded" class="space-y-1">
          <label class="text-sm font-medium">模型厂商</label>
          <Select
            v-model:value="queryParams.modelVendor"
            allow-clear
            placeholder="请选择模型厂商"
            class="w-full"
          >
            <Select.Option
              v-for="item in modelVendorOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </Select.Option>
          </Select>
        </div>

        <!-- 模型级别 -->
        <div v-show="searchExpanded" class="space-y-1">
          <label class="text-sm font-medium">模型级别</label>
          <Select
            v-model:value="queryParams.modelLevel"
            allow-clear
            placeholder="请选择模型级别"
            class="w-full"
          >
            <Select.Option
              v-for="item in modelLevelOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </Select.Option>
          </Select>
        </div>

        <!-- 调用状态 -->
        <div v-show="searchExpanded" class="space-y-1">
          <label class="text-sm font-medium">调用状态</label>
          <Select
            v-model:value="queryParams.status"
            allow-clear
            placeholder="请选择调用状态"
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

        <!-- 业务类型 -->
        <div v-show="searchExpanded" class="space-y-1">
          <label class="text-sm font-medium">业务类型</label>
          <Select
            v-model:value="queryParams.businessType"
            allow-clear
            placeholder="请选择业务类型"
            class="w-full"
          >
            <Select.Option
              v-for="item in businessTypeOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </Select.Option>
          </Select>
        </div>

        <!-- 关键字 -->
        <div v-show="searchExpanded" class="space-y-1">
          <label class="text-sm font-medium">关键字</label>
          <Input
            v-model:value="queryParams.keyword"
            allow-clear
            placeholder="搜索提示词或响应内容"
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
        <h3 class="text-lg font-semibold">模型调用日志列表</h3>
        <Space>
          <Button type="primary" :loading="exporting" @click="handleExport">
            导出
          </Button>
          <Tooltip title="刷新">
            <Button @click="handleRefresh">
              <Icon icon="lucide:refresh-cw" class="size-4" />
            </Button>
          </Tooltip>
          <Tooltip title="最大化">
            <Button>
              <Icon icon="lucide:maximize" class="size-4" />
            </Button>
          </Tooltip>
          <Tooltip title="设置">
            <Button>
              <Icon icon="lucide:settings" class="size-4" />
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
        :scroll="{ x: 1500 }"
        row-key="id"
        bordered
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <!-- 业务类型 -->
          <template v-if="column.key === 'businessType'">
            <Tag color="blue">{{ businessTypeMap[record.businessType] }}</Tag>
          </template>

          <!-- 模型级别 -->
          <template v-else-if="column.key === 'modelLevel'">
            <Tag :color="modelLevelMap[record.modelLevel].color">
              {{ modelLevelMap[record.modelLevel].text }}
            </Tag>
          </template>

          <!-- 模型厂商 -->
          <template v-else-if="column.key === 'modelVendor'">
            <Tag>{{ record.modelVendor }}</Tag>
          </template>

          <!-- Token数 -->
          <template
            v-else-if="
              column.key === 'inputTokens' ||
              column.key === 'outputTokens' ||
              column.key === 'totalTokens'
            "
          >
            <span class="font-mono">
              {{
                record[column.key as keyof ModelLogListItem].toLocaleString()
              }}
            </span>
          </template>

          <!-- 状态 -->
          <template v-else-if="column.key === 'status'">
            <Tag :color="statusMap[record.status].color">
              {{ statusMap[record.status].text }}
            </Tag>
          </template>

          <!-- 耗时 -->
          <template v-else-if="column.key === 'duration'">
            <span class="font-mono">{{
              record.duration.toLocaleString()
            }}</span>
          </template>

          <!-- 调用时间 -->
          <template v-else-if="column.key === 'calledAt'">
            <span class="text-xs">{{ formatTime(record.calledAt) }}</span>
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
