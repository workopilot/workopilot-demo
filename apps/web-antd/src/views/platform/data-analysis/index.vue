<script setup lang="ts">
import type {
  ModelPerformanceStats,
  Report,
  TenantActivityStats,
} from '#/types/platform';

import { computed, onMounted, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Card,
  DatePicker,
  message,
  Space,
  Table,
  Tabs,
  Tag,
} from 'ant-design-vue';

import {
  getModelPerformanceStatsApi,
  getReportsApi,
  getTenantActivityStatsApi,
} from '#/api/platform';

// 状态管理
const activeTab = ref('tenant');

// 租户活跃度数据
const tenantStats = ref<TenantActivityStats[]>([]);
const tenantLoading = ref(false);

// 模型性能数据
const modelStats = ref<ModelPerformanceStats[]>([]);
const modelLoading = ref(false);

// 报表数据
const reports = ref<Report[]>([]);
const reportsLoading = ref(false);

// 日期范围
const dateRange = ref<[string, string]>(['', '']);

// 租户活跃度表格列
const tenantColumns = [
  {
    title: '租户名称',
    dataIndex: 'tenantName',
    key: 'tenantName',
    width: 200,
  },
  {
    title: '登录次数',
    dataIndex: 'loginCount',
    key: 'loginCount',
    width: 120,
  },
  {
    title: '活跃用户',
    dataIndex: 'activeUsers',
    key: 'activeUsers',
    width: 120,
  },
  {
    title: '服务调用次数',
    dataIndex: 'serviceCalls',
    key: 'serviceCalls',
    width: 120,
  },
  {
    title: '模型调用次数',
    dataIndex: 'modelCalls',
    key: 'modelCalls',
    width: 120,
  },
  {
    title: 'Token使用量',
    dataIndex: 'tokenUsage',
    key: 'tokenUsage',
    width: 120,
  },
  {
    title: '日期',
    dataIndex: 'date',
    key: 'date',
    width: 120,
  },
];

// 模型性能表格列
const modelColumns = [
  {
    title: '模型名称',
    dataIndex: 'modelName',
    key: 'modelName',
    width: 200,
  },
  {
    title: '总调用次数',
    dataIndex: 'totalCalls',
    key: 'totalCalls',
    width: 120,
  },
  {
    title: '成功率',
    dataIndex: 'successRate',
    key: 'successRate',
    width: 100,
  },
  {
    title: '平均响应时间',
    dataIndex: 'avgResponseTime',
    key: 'avgResponseTime',
    width: 120,
  },
  {
    title: 'P95响应时间',
    dataIndex: 'p95ResponseTime',
    key: 'p95ResponseTime',
    width: 120,
  },
  {
    title: 'P99响应时间',
    dataIndex: 'p99ResponseTime',
    key: 'p99ResponseTime',
    width: 120,
  },
  {
    title: '总费用',
    dataIndex: 'totalCost',
    key: 'totalCost',
    width: 100,
  },
  {
    title: '错误率',
    dataIndex: 'errorCount',
    key: 'errorCount',
    width: 100,
  },
  {
    title: '日期',
    dataIndex: 'date',
    key: 'date',
    width: 120,
  },
];

// 报表表格列
const reportColumns = [
  {
    title: '报表名称',
    dataIndex: 'name',
    key: 'name',
    width: 200,
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 120,
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    width: 250,
  },
  {
    title: '定时发送',
    dataIndex: 'schedule',
    key: 'schedule',
    width: 120,
  },
  {
    title: '创建人',
    dataIndex: 'createdBy',
    key: 'createdBy',
    width: 120,
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 180,
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
    fixed: 'right',
  },
];

// 获取租户活跃度数据
async function fetchTenantStats() {
  tenantLoading.value = true;
  try {
    const res = await getTenantActivityStatsApi({
      startDate: dateRange.value[0] || undefined,
      endDate: dateRange.value[1] || undefined,
    });
    if (res.code === 0) {
      tenantStats.value = res.data;
    }
  } catch {
    message.error('获取租户活跃度数据失败');
  } finally {
    tenantLoading.value = false;
  }
}

// 获取模型性能数据
async function fetchModelStats() {
  modelLoading.value = true;
  try {
    const res = await getModelPerformanceStatsApi({
      startDate: dateRange.value[0] || undefined,
      endDate: dateRange.value[1] || undefined,
    });
    if (res.code === 0) {
      modelStats.value = res.data;
    }
  } catch {
    message.error('获取模型性能数据失败');
  } finally {
    modelLoading.value = false;
  }
}

// 获取报表列表
async function fetchReports() {
  reportsLoading.value = true;
  try {
    const res = await getReportsApi();
    if (res.code === 0) {
      reports.value = res.data;
    }
  } catch {
    message.error('获取报表列表失败');
  } finally {
    reportsLoading.value = false;
  }
}

// Tab切换处理
function handleTabChange(key: string) {
  activeTab.value = key;
  if (key === 'tenant' && tenantStats.value.length === 0) {
    fetchTenantStats();
  } else if (key === 'model' && modelStats.value.length === 0) {
    fetchModelStats();
  } else if (key === 'report' && reports.value.length === 0) {
    fetchReports();
  }
}

// 日期范围变化
function handleDateChange(dates: any) {
  if (dates && dates.length === 2) {
    dateRange.value = dates;
    // 刷新当前tab的数据
    if (activeTab.value === 'tenant') {
      fetchTenantStats();
    } else if (activeTab.value === 'model') {
      fetchModelStats();
    }
  }
}

// 新建报表
function handleCreateReport() {
  message.info('新建报表功能开发中');
}

// 导出数据
function handleExport() {
  message.info('导出数据功能开发中');
}

// 查看报表
function handleViewReport(report: Report) {
  message.info(`查看报表: ${report.name}`);
}

// 编辑报表
function handleEditReport(report: Report) {
  message.info(`编辑报表: ${report.name}`);
}

// 删除报表
function handleDeleteReport(report: Report) {
  message.info(`删除报表: ${report.name}`);
}

// 格式化报表类型
function formatReportType(type: string) {
  const map: Record<string, string> = {
    tenant: '租户报表',
    service: '服务报表',
    model: '模型报表',
    billing: '计费报表',
    custom: '自定义报表',
  };
  return map[type] || type;
}

// 格式化成功率
function formatSuccessRate(rate: number) {
  return `${(rate * 100).toFixed(2)}%`;
}

// 格式化费用
function formatCost(cost: number) {
  return `¥${cost.toFixed(2)}`;
}

// 格式化错误率
function formatErrorRate(record: ModelPerformanceStats) {
  const errorRate = (record.errorCount / record.totalCalls) * 100;
  return `${errorRate.toFixed(2)}%`;
}

// 计算汇总数据
const tenantSummary = computed(() => {
  if (tenantStats.value.length === 0) {
    return {
      totalLogins: 0,
      totalActiveUsers: 0,
      totalServiceCalls: 0,
      totalModelCalls: 0,
      totalTokens: 0,
    };
  }
  return {
    totalLogins: tenantStats.value.reduce(
      (sum, item) => sum + item.loginCount,
      0,
    ),
    totalActiveUsers: tenantStats.value.reduce(
      (sum, item) => sum + item.activeUsers,
      0,
    ),
    totalServiceCalls: tenantStats.value.reduce(
      (sum, item) => sum + item.serviceCalls,
      0,
    ),
    totalModelCalls: tenantStats.value.reduce(
      (sum, item) => sum + item.modelCalls,
      0,
    ),
    totalTokens: tenantStats.value.reduce(
      (sum, item) => sum + item.tokenUsage,
      0,
    ),
  };
});

const modelSummary = computed(() => {
  if (modelStats.value.length === 0) {
    return {
      totalCalls: 0,
      avgSuccessRate: 0,
      avgResponseTime: 0,
      totalCost: 0,
    };
  }
  const totalCalls = modelStats.value.reduce(
    (sum, item) => sum + item.totalCalls,
    0,
  );
  const avgSuccessRate =
    modelStats.value.reduce((sum, item) => sum + item.successRate, 0) /
    modelStats.value.length;
  const avgResponseTime =
    modelStats.value.reduce((sum, item) => sum + item.avgResponseTime, 0) /
    modelStats.value.length;
  const totalCost = modelStats.value.reduce(
    (sum, item) => sum + item.totalCost,
    0,
  );
  return {
    totalCalls,
    avgSuccessRate,
    avgResponseTime,
    totalCost,
  };
});

// 初始化
onMounted(() => {
  fetchTenantStats();
});
</script>

<template>
  <div class="data-analysis-container">
    <!-- 页面标题 -->
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold">数据分析</h1>
        <p class="mt-1 text-muted-foreground">查看平台运营数据和分析报表</p>
      </div>
      <Space>
        <DatePicker.RangePicker
          v-model:value="dateRange"
          @change="handleDateChange"
        />
        <Button
          v-if="activeTab === 'report'"
          type="primary"
          @click="handleCreateReport"
        >
          <Icon icon="lucide:plus" class="size-4" />
          新建报表
        </Button>
        <Button @click="handleExport">
          <Icon icon="lucide:download" class="size-4" />
          导出数据
        </Button>
      </Space>
    </div>

    <!-- Tab内容 -->
    <Tabs v-model:active-key="activeTab" @change="handleTabChange">
      <!-- 租户活跃度 -->
      <Tabs.TabPane key="tenant" tab="租户活跃度">
        <Card>
          <!-- 统计卡片 -->
          <div
            class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5"
          >
            <div class="rounded-lg border bg-white p-4 shadow">
              <div class="mb-2 flex items-center text-sm text-muted-foreground">
                <Icon icon="lucide:users" class="mr-2 size-4" />
                总登录次数
              </div>
              <div class="text-2xl font-semibold">
                {{ tenantSummary.totalLogins.toLocaleString() }}
              </div>
            </div>
            <div class="rounded-lg border bg-white p-4 shadow">
              <div class="mb-2 flex items-center text-sm text-muted-foreground">
                <Icon icon="lucide:user-check" class="mr-2 size-4" />
                活跃用户数
              </div>
              <div class="text-2xl font-semibold">
                {{ tenantSummary.totalActiveUsers.toLocaleString() }}
              </div>
            </div>
            <div class="rounded-lg border bg-white p-4 shadow">
              <div class="mb-2 flex items-center text-sm text-muted-foreground">
                <Icon icon="lucide:activity" class="mr-2 size-4" />
                服务调用次数
              </div>
              <div class="text-2xl font-semibold">
                {{ tenantSummary.totalServiceCalls.toLocaleString() }}
              </div>
            </div>
            <div class="rounded-lg border bg-white p-4 shadow">
              <div class="mb-2 flex items-center text-sm text-muted-foreground">
                <Icon icon="lucide:cpu" class="mr-2 size-4" />
                模型调用次数
              </div>
              <div class="text-2xl font-semibold">
                {{ tenantSummary.totalModelCalls.toLocaleString() }}
              </div>
            </div>
            <div class="rounded-lg border bg-white p-4 shadow">
              <div class="mb-2 flex items-center text-sm text-muted-foreground">
                <Icon icon="lucide:coins" class="mr-2 size-4" />
                Token使用量
              </div>
              <div class="text-2xl font-semibold">
                {{ tenantSummary.totalTokens.toLocaleString() }}
              </div>
            </div>
          </div>

          <!-- 数据表格 -->
          <Table
            :columns="tenantColumns"
            :data-source="tenantStats"
            :loading="tenantLoading"
            :pagination="{ pageSize: 10 }"
            row-key="tenantId"
            :scroll="{ x: 1000 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'tokenUsage'">
                {{ record.tokenUsage.toLocaleString() }}
              </template>
            </template>
          </Table>
        </Card>
      </Tabs.TabPane>

      <!-- 模型性能 -->
      <Tabs.TabPane key="model" tab="模型性能">
        <Card>
          <!-- 统计卡片 -->
          <div
            class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
          >
            <div class="rounded-lg border bg-white p-4 shadow">
              <div class="mb-2 flex items-center text-sm text-muted-foreground">
                <Icon icon="lucide:zap" class="mr-2 size-4" />
                总调用次数
              </div>
              <div class="text-2xl font-semibold">
                {{ modelSummary.totalCalls.toLocaleString() }}
              </div>
            </div>
            <div class="rounded-lg border bg-white p-4 shadow">
              <div class="mb-2 flex items-center text-sm text-muted-foreground">
                <Icon icon="lucide:check-circle" class="mr-2 size-4" />
                平均成功率
              </div>
              <div class="text-2xl font-semibold">
                {{ formatSuccessRate(modelSummary.avgSuccessRate) }}
              </div>
            </div>
            <div class="rounded-lg border bg-white p-4 shadow">
              <div class="mb-2 flex items-center text-sm text-muted-foreground">
                <Icon icon="lucide:clock" class="mr-2 size-4" />
                平均响应时间
              </div>
              <div class="text-2xl font-semibold">
                {{ modelSummary.avgResponseTime.toFixed(0) }}ms
              </div>
            </div>
            <div class="rounded-lg border bg-white p-4 shadow">
              <div class="mb-2 flex items-center text-sm text-muted-foreground">
                <Icon icon="lucide:dollar-sign" class="mr-2 size-4" />
                总费用
              </div>
              <div class="text-2xl font-semibold">
                {{ formatCost(modelSummary.totalCost) }}
              </div>
            </div>
          </div>

          <!-- 数据表格 -->
          <Table
            :columns="modelColumns"
            :data-source="modelStats"
            :loading="modelLoading"
            :pagination="{ pageSize: 10 }"
            row-key="modelId"
            :scroll="{ x: 1200 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'successRate'">
                <Tag
                  :color="
                    record.successRate >= 0.95
                      ? 'success'
                      : record.successRate >= 0.9
                        ? 'warning'
                        : 'error'
                  "
                >
                  {{ formatSuccessRate(record.successRate) }}
                </Tag>
              </template>
              <template v-if="column.key === 'avgResponseTime'">
                {{ record.avgResponseTime.toFixed(0) }}ms
              </template>
              <template v-if="column.key === 'p95ResponseTime'">
                {{ record.p95ResponseTime.toFixed(0) }}ms
              </template>
              <template v-if="column.key === 'p99ResponseTime'">
                {{ record.p99ResponseTime.toFixed(0) }}ms
              </template>
              <template v-if="column.key === 'totalCost'">
                {{ formatCost(record.totalCost) }}
              </template>
              <template v-if="column.key === 'errorCount'">
                <Tag
                  :color="
                    record.errorCount / record.totalCalls > 0.05
                      ? 'error'
                      : 'success'
                  "
                >
                  {{ formatErrorRate(record) }}
                </Tag>
              </template>
            </template>
          </Table>
        </Card>
      </Tabs.TabPane>

      <!-- 自定义报表 -->
      <Tabs.TabPane key="report" tab="自定义报表">
        <Card>
          <Table
            :columns="reportColumns"
            :data-source="reports"
            :loading="reportsLoading"
            :pagination="{ pageSize: 10 }"
            row-key="id"
            :scroll="{ x: 1200 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'type'">
                <Tag color="blue">{{ formatReportType(record.type) }}</Tag>
              </template>
              <template v-if="column.key === 'schedule'">
                <Tag v-if="record.schedule" color="green">
                  <Icon icon="lucide:clock" class="mr-1 size-3" />
                  {{ record.schedule }}
                </Tag>
                <Tag v-else color="default">否</Tag>
              </template>
              <template v-if="column.key === 'createdAt'">
                {{
                  new Date(record.createdAt).toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                }}
              </template>
              <template v-if="column.key === 'action'">
                <Space>
                  <Button
                    type="link"
                    size="small"
                    @click="handleViewReport(record)"
                  >
                    查看
                  </Button>
                  <Button
                    type="link"
                    size="small"
                    @click="handleEditReport(record)"
                  >
                    编辑
                  </Button>
                  <Button
                    type="link"
                    danger
                    size="small"
                    @click="handleDeleteReport(record)"
                  >
                    删除
                  </Button>
                </Space>
              </template>
            </template>
          </Table>
        </Card>
      </Tabs.TabPane>
    </Tabs>
  </div>
</template>

<style scoped>
.data-analysis-container {
  padding: 24px;
}
</style>
