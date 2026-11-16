<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue';

import type {
  ServiceCallLog,
  ServiceCallLogQueryParams,
} from '#/types/service-log';

import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

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

import {
  CallStatusColorMap as callStatusColorMap,
  CallStatusMap as callStatusMap,
  exportServiceCallLogsApi,
  getServiceCallLogsApi,
} from '#/api/service-log';

import LogDetailDrawer from './modals/log-detail-drawer.vue';

const route = useRoute();

// 表格数据
const tableData = ref<ServiceCallLog[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const loading = ref(false);
const exporting = ref(false);

// 详情抽屉
const detailDrawerOpen = ref(false);
const selectedLogId = ref<null | string>(null);
const selectedLog = ref<null | ServiceCallLog>(null);
const drawerRef = ref<InstanceType<typeof LogDetailDrawer> | null>(null);

// 搜索展开状态
const searchExpanded = ref(true);

// 查询参数
const queryParams = ref<ServiceCallLogQueryParams>({
  page: 1,
  pageSize: 20,
});

// 状态选项
const statusOptions = [
  { label: '成功', value: 'success' },
  { label: '失败', value: 'failed' },
];

// 切换展开/收起
function toggleExpand() {
  searchExpanded.value = !searchExpanded.value;
}

// 获取服务调用日志列表
async function fetchLogs() {
  loading.value = true;
  try {
    const params = {
      ...queryParams.value,
      page: currentPage.value,
      pageSize: pageSize.value,
    };
    const response = await getServiceCallLogsApi(params);
    tableData.value = response.data.items;
    total.value = response.data.total;
  } catch (error) {
    message.error('获取服务调用日志失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
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
  };
  currentPage.value = 1;
  fetchLogs();
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
    await exportServiceCallLogsApi(params);
    message.success('导出成功');
  } catch (error) {
    message.error('导出失败');
    console.error(error);
  } finally {
    exporting.value = false;
  }
}

// 查看详情
function handleViewDetail(record: ServiceCallLog) {
  selectedLog.value = record;
  selectedLogId.value = record.id;
  detailDrawerOpen.value = true;
  // 将日志详情数据传递给抽屉组件
  setTimeout(() => {
    drawerRef.value?.setLogDetail(record);
  }, 0);
}

// 表格列定义
const columns: TableColumnsType<ServiceCallLog> = [
  {
    title: '请求ID',
    dataIndex: 'requestId',
    key: 'requestId',
    width: 160,
    fixed: 'left',
  },
  {
    title: '订阅ID',
    dataIndex: 'subscriptionId',
    key: 'subscriptionId',
    width: 120,
  },
  {
    title: '租户名称',
    dataIndex: 'tenantName',
    key: 'tenantName',
    width: 120,
  },
  {
    title: '服务名称',
    dataIndex: 'serviceName',
    key: 'serviceName',
    width: 140,
  },
  {
    title: '产品规格',
    dataIndex: 'version',
    key: 'version',
    width: 100,
  },
  {
    title: '业务单号',
    dataIndex: 'documentNo',
    key: 'documentNo',
    width: 160,
  },
  {
    title: '调用状态',
    dataIndex: 'callStatus',
    key: 'callStatus',
    width: 90,
  },
  {
    title: '请求IP',
    dataIndex: 'requestIp',
    key: 'requestIp',
    width: 120,
  },
  {
    title: '请求用户',
    dataIndex: 'requestUser',
    key: 'requestUser',
    width: 100,
  },
  {
    title: '请求方法',
    dataIndex: 'requestMethod',
    key: 'requestMethod',
    width: 90,
  },
  {
    title: '响应码',
    dataIndex: 'responseCode',
    key: 'responseCode',
    width: 90,
    align: 'center',
  },
  {
    title: '响应时间(ms)',
    dataIndex: 'responseTime',
    key: 'responseTime',
    width: 110,
    align: 'right',
  },
  {
    title: '错误代码',
    dataIndex: 'errorCode',
    key: 'errorCode',
    width: 130,
  },
  {
    title: '调用时间',
    dataIndex: 'callTime',
    key: 'callTime',
    width: 160,
  },
  {
    title: '操作',
    key: 'action',
    width: 80,
    fixed: 'right',
  },
];

onMounted(() => {
  // 从 URL 查询参数中获取筛选条件
  const { serviceName } = route.query;
  if (serviceName && typeof serviceName === 'string') {
    queryParams.value.serviceName = serviceName;
  }
  fetchLogs();
});
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- 顶部: 模块名称和描述 (置顶固定) -->
    <div class="shrink-0 border-b bg-background p-6 shadow-sm">
      <div class="rounded-lg border bg-card p-6 shadow-sm">
        <h1 class="text-2xl font-bold">服务调用日志</h1>
        <p class="mt-2 text-muted-foreground">
          记录所有服务调用的详细日志信息,包括调用状态、请求参数、响应结果和错误信息等。支持按请求ID、订阅ID、租户、服务名称、时间范围等多维度查询和筛选。
        </p>
      </div>
    </div>

    <!-- 中部和底部: 可滚动区域 -->
    <div class="flex flex-1 flex-col space-y-4 overflow-y-auto p-6 pt-4">
      <!-- 中部: 查询条件 -->
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
          <!-- 请求ID -->
          <div class="space-y-1">
            <label class="text-sm font-medium">请求ID</label>
            <Input
              v-model:value="queryParams.requestId"
              allow-clear
              placeholder="请输入请求ID"
            />
          </div>

          <!-- 订阅ID -->
          <div class="space-y-1">
            <label class="text-sm font-medium">订阅ID</label>
            <Input
              v-model:value="queryParams.subscriptionId"
              allow-clear
              placeholder="请输入订阅ID"
            />
          </div>

          <!-- 租户名称 -->
          <div class="space-y-1">
            <label class="text-sm font-medium">租户名称</label>
            <Input
              v-model:value="queryParams.tenantName"
              allow-clear
              placeholder="请输入租户名称"
            />
          </div>

          <!-- 服务名称 -->
          <div class="space-y-1">
            <label class="text-sm font-medium">服务名称</label>
            <Input
              v-model:value="queryParams.serviceName"
              allow-clear
              placeholder="请输入服务名称"
            />
          </div>

          <!-- 产品规格 -->
          <div v-show="searchExpanded" class="space-y-1">
            <label class="text-sm font-medium">产品规格</label>
            <Input
              v-model:value="queryParams.version"
              allow-clear
              placeholder="请输入产品规格"
            />
          </div>

          <!-- 业务单号 -->
          <div v-show="searchExpanded" class="space-y-1">
            <label class="text-sm font-medium">业务单号</label>
            <Input
              v-model:value="queryParams.documentNo"
              allow-clear
              placeholder="请输入业务单号"
            />
          </div>

          <!-- 调用状态 -->
          <div v-show="searchExpanded" class="space-y-1">
            <label class="text-sm font-medium">调用状态</label>
            <Select
              v-model:value="queryParams.callStatus"
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

          <!-- 请求IP -->
          <div v-show="searchExpanded" class="space-y-1">
            <label class="text-sm font-medium">请求IP</label>
            <Input
              v-model:value="queryParams.requestIp"
              allow-clear
              placeholder="请输入请求IP"
            />
          </div>

          <!-- 请求用户 -->
          <div v-show="searchExpanded" class="space-y-1">
            <label class="text-sm font-medium">请求用户</label>
            <Input
              v-model:value="queryParams.requestUser"
              allow-clear
              placeholder="请输入请求用户"
            />
          </div>

          <!-- 调用时间 -->
          <div class="space-y-1">
            <label class="text-sm font-medium">调用时间</label>
            <DatePicker.RangePicker
              v-model:value="queryParams.timeRange"
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

      <!-- 底部: 查询结果 -->
      <div class="rounded-lg border bg-card shadow-sm">
        <!-- 表格标题和操作栏 -->
        <div class="flex items-center justify-between border-b px-4 py-3">
          <h3 class="text-lg font-semibold">服务调用日志列表</h3>
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
          :scroll="{ x: 1900 }"
          row-key="id"
          bordered
          @change="
            (pagination: any) => {
              currentPage = pagination.current;
              pageSize = pagination.pageSize;
              fetchLogs();
            }
          "
        >
          <template #bodyCell="{ column, record }">
            <!-- 调用状态 -->
            <template v-if="column.key === 'callStatus'">
              <Tag :color="callStatusColorMap[record.callStatus]">
                {{ callStatusMap[record.callStatus] }}
              </Tag>
            </template>

            <!-- 响应时间 -->
            <template v-else-if="column.key === 'responseTime'">
              <span v-if="record.responseTime" class="font-mono">
                {{ record.responseTime.toLocaleString() }}
              </span>
              <span v-else class="text-muted-foreground">-</span>
            </template>

            <!-- 调用时间 -->
            <template v-else-if="column.key === 'callTime'">
              <span class="text-xs">{{
                new Date(record.callTime).toLocaleString('zh-CN')
              }}</span>
            </template>

            <!-- 错误信息 -->
            <template v-else-if="column.key === 'errorCode'">
              <Tooltip v-if="record.errorCode" :title="record.errorMessage">
                <Tag color="warning">{{ record.errorCode }}</Tag>
              </Tooltip>
              <span v-else class="text-muted-foreground">-</span>
            </template>

            <!-- 操作 -->
            <template v-else-if="column.key === 'action'">
              <Button
                type="link"
                size="small"
                @click="handleViewDetail(record)"
              >
                查看
              </Button>
            </template>
          </template>
        </Table>
      </div>
    </div>

    <!-- 日志详情抽屉 -->
    <LogDetailDrawer
      ref="drawerRef"
      v-model:open="detailDrawerOpen"
      :log-id="selectedLogId"
    />
  </div>
</template>
