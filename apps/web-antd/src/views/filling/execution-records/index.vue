<script setup lang="ts">
import type { ExecutorType } from '../executors/types';

import { computed, onMounted, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Card,
  DatePicker,
  Input,
  message,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import RecordDetailDrawer from './modals/record-detail-drawer.vue';

// 类型定义
type ExecutionStatus =
  | 'cancelled'
  | 'completed'
  | 'failed'
  | 'pending'
  | 'running';
type QueueStatus = 'processing' | 'timeout' | 'waiting';

interface ExecutionRecord {
  id: string;
  taskNumber: string;
  documentNumber?: string;
  billType?: string;
  executorId: string;
  executorName: string;
  executorType: ExecutorType;
  status: ExecutionStatus;
  queueStatus?: QueueStatus;
  queuePosition?: number;
  submitTime: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  formData: string;
  targetSystem: string;
  filledBy?: string;
  billStatus?: 'draft' | 'submitted';
  errorMessage?: string;
}

// 列表数据
const tableData = ref<ExecutionRecord[]>([]);
const loading = ref(false);

// 筛选条件
const filters = ref({
  taskNumber: undefined as string | undefined,
  documentNumber: undefined as string | undefined,
  billType: undefined as string | undefined,
  status: undefined as ExecutionStatus | undefined,
  type: undefined as ExecutorType | undefined,
  dateRange: undefined as any,
});

// 详情弹窗
const detailDrawerOpen = ref(false);
const currentRecordId = ref<null | string>(null);

// 过滤后的数据
const filteredData = computed(() => {
  let data = tableData.value;

  if (filters.value.taskNumber) {
    data = data.filter((r) => r.taskNumber.includes(filters.value.taskNumber!));
  }

  if (filters.value.documentNumber) {
    data = data.filter((r) =>
      r.documentNumber?.includes(filters.value.documentNumber!),
    );
  }

  if (filters.value.billType) {
    data = data.filter((r) => r.billType === filters.value.billType);
  }

  if (filters.value.status) {
    data = data.filter((r) => r.status === filters.value.status);
  }

  if (filters.value.type) {
    data = data.filter((r) => r.executorType === filters.value.type);
  }

  return data;
});

// 表格列定义
const columns = [
  {
    title: '任务编号',
    dataIndex: 'taskNumber',
    key: 'taskNumber',
    width: 160,
    fixed: 'left' as const,
  },
  {
    title: '单据编号',
    dataIndex: 'documentNumber',
    key: 'documentNumber',
    width: 140,
  },
  {
    title: '单据类型',
    dataIndex: 'billType',
    key: 'billType',
    width: 120,
  },
  {
    title: '填报人',
    dataIndex: 'filledBy',
    key: 'filledBy',
    width: 100,
  },
  {
    title: '执行器',
    dataIndex: 'executorName',
    key: 'executorName',
    width: 160,
  },
  {
    title: '目标系统',
    dataIndex: 'targetSystem',
    key: 'targetSystem',
    width: 140,
  },
  {
    title: '执行状态',
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
    title: '提交时间',
    dataIndex: 'submitTime',
    key: 'submitTime',
    width: 160,
  },
  {
    title: '耗时(s)',
    dataIndex: 'duration',
    key: 'duration',
    width: 100,
    align: 'center' as const,
  },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    align: 'center' as const,
    fixed: 'right' as const,
  },
];

// 获取执行记录
async function fetchExecutionRecords() {
  loading.value = true;
  try {
    // 模拟数据
    await new Promise((resolve) => setTimeout(resolve, 300));

    const mockData: ExecutionRecord[] = [
      {
        id: '1',
        taskNumber: 'TASK-20250318-001',
        executorId: '1',
        executorName: '生产环境Playwright执行器-01',
        executorType: 'playwright',
        status: 'running',
        billType: '差旅报销单',
        filledBy: '张三',
        submitTime: '2025-03-18 11:15:00',
        startTime: '2025-03-18 11:15:05',
        duration: 350,
        formData: '差旅报销单-北京出差',
        targetSystem: 'SAP S/4HANA (总部)',
      },
      {
        id: '2',
        taskNumber: 'TASK-20250318-002',
        executorId: '3',
        executorName: '浏览器插件执行器-01',
        executorType: 'browser-plugin',
        status: 'running',
        billType: '对公付款申请',
        filledBy: '李四',
        submitTime: '2025-03-18 11:16:30',
        startTime: '2025-03-18 11:17:00',
        duration: 280,
        formData: '对公付款申请-耗材采购',
        targetSystem: '用友U8',
      },
      {
        id: '3',
        taskNumber: 'TASK-20250318-003',
        executorId: '1',
        executorName: '生产环境Playwright执行器-01',
        executorType: 'playwright',
        status: 'pending',
        billType: '差旅报销单',
        filledBy: '王五',
        queueStatus: 'waiting',
        queuePosition: 2,
        submitTime: '2025-03-18 11:18:15',
        formData: '差旅报销单-上海出差',
        targetSystem: 'SAP S/4HANA (总部)',
      },
      {
        id: '4',
        taskNumber: 'TASK-20250318-004',
        executorId: '3',
        executorName: '浏览器插件执行器-01',
        executorType: 'browser-plugin',
        status: 'pending',
        billType: '差旅报销单',
        filledBy: '赵六',
        queueStatus: 'waiting',
        queuePosition: 4,
        submitTime: '2025-03-18 11:18:45',
        formData: '差旅报销单-广州出差',
        targetSystem: 'SAP S/4HANA (总部)',
      },
      {
        id: '5',
        taskNumber: 'TASK-20250318-005',
        documentNumber: 'BILL-20250318-001',
        executorId: '2',
        executorName: '生产环境Playwright执行器-02',
        executorType: 'playwright',
        status: 'completed',
        billType: '办公用品采购申请',
        filledBy: '孙七',
        billStatus: 'submitted',
        submitTime: '2025-03-18 11:10:00',
        startTime: '2025-03-18 11:10:03',
        endTime: '2025-03-18 11:12:30',
        duration: 147,
        formData: '办公用品采购申请',
        targetSystem: '金蝶K3',
      },
      {
        id: '6',
        taskNumber: 'TASK-20250318-006',
        documentNumber: 'BILL-20250318-002',
        executorId: '2',
        executorName: '生产环境Playwright执行器-02',
        executorType: 'playwright',
        status: 'completed',
        billType: '差旅报销单',
        filledBy: '周八',
        billStatus: 'submitted',
        submitTime: '2025-03-18 11:08:00',
        startTime: '2025-03-18 11:08:02',
        endTime: '2025-03-18 11:09:15',
        duration: 73,
        formData: '差旅报销单-深圳出差',
        targetSystem: 'SAP S/4HANA (总部)',
      },
      {
        id: '7',
        taskNumber: 'TASK-20250318-007',
        documentNumber: 'BILL-20250318-003',
        executorId: '5',
        executorName: '浏览器插件执行器-02',
        executorType: 'browser-plugin',
        status: 'failed',
        billType: '对公付款申请',
        filledBy: '吴九',
        billStatus: 'draft',
        submitTime: '2025-03-18 11:05:00',
        startTime: '2025-03-18 11:05:05',
        endTime: '2025-03-18 11:07:30',
        duration: 145,
        formData: '对公付款申请-设备采购',
        targetSystem: '用友U8',
        errorMessage: '连接超时：目标系统响应超过120秒',
      },
      {
        id: '8',
        taskNumber: 'TASK-20250318-008',
        executorId: '3',
        executorName: '浏览器插件执行器-01',
        executorType: 'browser-plugin',
        status: 'cancelled',
        billType: '差旅报销单',
        filledBy: '郑十',
        submitTime: '2025-03-18 11:03:00',
        startTime: '2025-03-18 11:03:05',
        endTime: '2025-03-18 11:04:00',
        duration: 55,
        formData: '差旅报销单-杭州出差',
        targetSystem: 'SAP S/4HANA (总部)',
        errorMessage: '用户取消',
      },
    ];

    tableData.value = mockData;
  } catch (error) {
    message.error('获取执行记录失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

// 状态颜色
const getStatusColor = (status: ExecutionStatus) => {
  const colorMap: Record<ExecutionStatus, string> = {
    pending: 'default',
    running: 'processing',
    completed: 'success',
    failed: 'error',
    cancelled: 'warning',
  };
  return colorMap[status];
};

// 状态文本
const getStatusText = (status: ExecutionStatus) => {
  const textMap: Record<ExecutionStatus, string> = {
    pending: '等待中',
    running: '执行中',
    completed: '已完成',
    failed: '失败',
    cancelled: '已取消',
  };
  return textMap[status];
};

// 单据状态映射
const getBillStatusConfig = (status?: string) => {
  if (!status) return { color: 'default', text: '-' };
  const statusMap: Record<string, { color: string; text: string }> = {
    draft: { color: 'default', text: '草稿' },
    submitted: { color: 'blue', text: '已提交' },
  };
  return statusMap[status] || { color: 'default', text: '-' };
};

// 查看详情
function handleViewDetail(record: ExecutionRecord) {
  currentRecordId.value = record.id;
  detailDrawerOpen.value = true;
}

// 重新执行
function handleRetry(record: ExecutionRecord) {
  message.success(`重新提交任务: ${record.taskNumber}`);
  fetchExecutionRecords();
}

// 取消任务
function handleCancel(record: ExecutionRecord) {
  message.success(`取消任务: ${record.taskNumber}`);
  fetchExecutionRecords();
}

onMounted(() => {
  fetchExecutionRecords();
});
</script>

<template>
  <div class="execution-records-container min-h-screen bg-slate-50 p-6">
    <!-- 页面标题 -->
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">执行记录</h1>
          <p class="mt-1 text-sm text-slate-500">
            查看所有智能填报任务的执行记录和单据信息
          </p>
        </div>
        <Button @click="fetchExecutionRecords">
          <Icon icon="lucide:refresh-cw" class="mr-1 size-4" />
          刷新
        </Button>
      </div>
    </div>

    <!-- 筛选栏 -->
    <Card class="mb-4">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-slate-600">任务编号:</span>
          <Input
            v-model:value="filters.taskNumber"
            placeholder="请输入任务编号"
            allow-clear
            size="small"
            class="!flex-1"
          />
        </div>

        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-slate-600">单据编号:</span>
          <Input
            v-model:value="filters.documentNumber"
            placeholder="请输入单据编号"
            allow-clear
            size="small"
            class="!flex-1"
          />
        </div>

        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-slate-600">单据类型:</span>
          <Select
            v-model:value="filters.billType"
            placeholder="全部类型"
            allow-clear
            size="small"
            class="!flex-1"
          >
            <Select.Option value="差旅报销单">差旅报销单</Select.Option>
            <Select.Option value="对公付款申请">对公付款申请</Select.Option>
            <Select.Option value="办公用品采购申请">
              办公用品采购申请
            </Select.Option>
          </Select>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-slate-600">执行状态:</span>
          <Select
            v-model:value="filters.status"
            placeholder="全部状态"
            allow-clear
            size="small"
            class="!flex-1"
          >
            <Select.Option value="pending">等待中</Select.Option>
            <Select.Option value="running">执行中</Select.Option>
            <Select.Option value="completed">已完成</Select.Option>
            <Select.Option value="failed">失败</Select.Option>
            <Select.Option value="cancelled">已取消</Select.Option>
          </Select>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-slate-600">执行器类型:</span>
          <Select
            v-model:value="filters.type"
            placeholder="全部类型"
            allow-clear
            size="small"
            class="!flex-1"
          >
            <Select.Option value="playwright">Playwright</Select.Option>
            <Select.Option value="browser-plugin">浏览器插件</Select.Option>
          </Select>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-slate-600">日期:</span>
          <DatePicker.RangePicker
            v-model:value="filters.dateRange"
            size="small"
            class="!flex-1"
          />
        </div>
      </div>

      <div class="mt-4 flex items-center justify-end border-t pt-3">
        <div class="mr-auto text-sm text-slate-500">
          共
          <span class="font-bold text-slate-900">
            {{ filteredData.length }}
          </span>
          条记录
        </div>
        <Space size="small">
          <Button
            size="small"
            @click="
              filters = {
                taskNumber: undefined,
                documentNumber: undefined,
                billType: undefined,
                status: undefined,
                type: undefined,
                dateRange: undefined,
              }
            "
          >
            <Icon icon="lucide:rotate-ccw" class="mr-1 size-4" />
            重置
          </Button>
          <Button size="small" type="primary">
            <Icon icon="lucide:search" class="mr-1 size-4" />
            搜索
          </Button>
        </Space>
      </div>
    </Card>

    <!-- 执行记录列表 -->
    <Card>
      <Table
        :columns="columns"
        :data-source="filteredData"
        row-key="id"
        :loading="loading"
        :pagination="{ pageSize: 20 }"
        :scroll="{ x: 1400 }"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'billStatus'">
            <Tag :color="getBillStatusConfig(record.billStatus).color">
              {{ getBillStatusConfig(record.billStatus).text }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'documentNumber'">
            <span v-if="record.documentNumber" class="font-mono text-blue-600">
              {{ record.documentNumber }}
            </span>
            <span v-else class="text-slate-400">-</span>
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space size="small">
              <Button
                type="text"
                size="small"
                @click="handleViewDetail(record)"
              >
                <Icon icon="lucide:eye" class="size-4 text-blue-500" />
              </Button>
              <Button
                v-if="
                  record.status === 'failed' || record.status === 'cancelled'
                "
                type="text"
                size="small"
                @click="handleRetry(record)"
              >
                <Icon icon="lucide:rotate-ccw" class="size-4 text-orange-500" />
              </Button>
              <Popconfirm
                v-if="
                  record.status === 'pending' || record.status === 'running'
                "
                title="确定要取消此任务吗?"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleCancel(record)"
              >
                <Button type="text" size="small" danger>
                  <Icon icon="lucide:x-circle" class="size-4" />
                </Button>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 详情侧边弹窗 -->
    <RecordDetailDrawer
      v-model:open="detailDrawerOpen"
      :record-id="currentRecordId"
    />
  </div>
</template>

<style scoped>
.execution-records-container {
  min-height: calc(100vh - 100px);
}
</style>
