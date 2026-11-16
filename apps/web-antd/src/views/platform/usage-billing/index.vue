<script setup lang="ts">
import type { Bill, BillStatus, UsageRecord } from '#/types/platform';

import { computed, onMounted, ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Card, message, Spin, Tabs, Tag } from 'ant-design-vue';

import { getBillsApi, getUsageRecordsApi } from '#/api/platform';
import {
  mockTenantActivityStats,
  mockTenantModelQuotas,
} from '#/api/platform-mock-data';

// 状态管理
const loading = ref(false);
const activeTab = ref('realtime');

// 实时用量数据
const realtimeStats = ref({
  totalCalls: 0,
  totalTokens: 0,
  totalCost: 0,
  topTenants: [] as any[],
  alertThresholds: [] as any[],
});

// 账单数据
const bills = ref<Bill[]>([]);

// 用量明细数据
const usageRecords = ref<UsageRecord[]>([]);

// 表格列定义 - 账单管理
const billColumns = computed(() => [
  {
    title: '账单编号',
    dataIndex: 'billNo',
    key: 'billNo',
    width: 150,
  },
  {
    title: '租户',
    dataIndex: 'tenantName',
    key: 'tenantName',
    width: 120,
  },
  {
    title: '账单周期',
    dataIndex: 'cycle',
    key: 'cycle',
    width: 100,
  },
  {
    title: '服务费(元)',
    dataIndex: 'serviceFees',
    key: 'serviceFees',
    width: 100,
  },
  {
    title: '模型费(元)',
    dataIndex: 'modelFees',
    key: 'modelFees',
    width: 100,
  },
  {
    title: '总金额(元)',
    dataIndex: 'totalAmount',
    key: 'totalAmount',
    width: 100,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 80,
  },
  {
    title: '到期日期',
    dataIndex: 'dueDate',
    key: 'dueDate',
    width: 120,
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    fixed: 'right',
  },
]);

// 表格列定义 - 用量明细
const usageColumns = computed(() => [
  {
    title: '租户',
    dataIndex: 'tenantName',
    key: 'tenantName',
    width: 120,
  },
  {
    title: '服务',
    dataIndex: 'serviceName',
    key: 'serviceName',
    width: 100,
  },
  {
    title: '模型',
    dataIndex: 'modelName',
    key: 'modelName',
    width: 120,
  },
  {
    title: '调用次数',
    dataIndex: 'callCount',
    key: 'callCount',
    width: 100,
  },
  {
    title: '输入Token',
    dataIndex: 'inputTokens',
    key: 'inputTokens',
    width: 100,
  },
  {
    title: '输出Token',
    dataIndex: 'outputTokens',
    key: 'outputTokens',
    width: 100,
  },
  {
    title: '总Token',
    dataIndex: 'totalTokens',
    key: 'totalTokens',
    width: 100,
  },
  {
    title: '费用(元)',
    dataIndex: 'cost',
    key: 'cost',
    width: 100,
  },
  {
    title: '日期',
    dataIndex: 'date',
    key: 'date',
    width: 120,
  },
]);

// 获取实时用量统计
async function fetchRealtimeStats() {
  try {
    // 模拟获取租户活跃度统计
    const stats = mockTenantActivityStats;

    // 汇总数据
    const totalCalls = stats.reduce((sum, s) => sum + s.serviceCalls, 0);
    const totalTokens = stats.reduce((sum, s) => sum + s.tokenUsage, 0);
    const totalCost = stats.reduce(
      (sum, s) => sum + (s.tokenUsage / 10_000) * 0.03,
      0,
    );

    // TOP租户排行
    const topTenants = stats
      .map((s) => ({
        tenantName: s.tenantName,
        calls: s.serviceCalls,
        tokens: s.tokenUsage,
        activeUsers: s.activeUsers,
      }))
      .toSorted((a, b) => b.calls - a.calls)
      .slice(0, 5);

    // 用量告警阈值 - 基于租户模型配额
    const quotaItems = mockTenantModelQuotas;
    const alertThresholds = quotaItems
      .filter((q) => (q.usedQuota / q.monthlyQuota) * 100 >= 80)
      .map((q) => ({
        tenantName: q.tenantName,
        modelName: q.modelName,
        usedQuota: q.usedQuota,
        monthlyQuota: q.monthlyQuota,
        usagePercentage: ((q.usedQuota / q.monthlyQuota) * 100).toFixed(1),
        level:
          (q.usedQuota / q.monthlyQuota) * 100 >= 90 ? 'critical' : 'warning',
      }));

    realtimeStats.value = {
      totalCalls,
      totalTokens,
      totalCost,
      topTenants,
      alertThresholds,
    };
  } catch {
    message.error('获取实时用量统计失败');
  }
}

// 获取账单列表
async function fetchBills() {
  loading.value = true;
  try {
    const res = await getBillsApi();
    if (res.code === 0) {
      bills.value = res.data;
    }
  } catch {
    message.error('获取账单列表失败');
  } finally {
    loading.value = false;
  }
}

// 获取用量明细
async function fetchUsageRecords() {
  loading.value = true;
  try {
    const res = await getUsageRecordsApi();
    if (res.code === 0) {
      usageRecords.value = res.data;
    }
  } catch {
    message.error('获取用量明细失败');
  } finally {
    loading.value = false;
  }
}

// 格式化账单状态
function formatBillStatus(status: BillStatus) {
  const map: Record<BillStatus, { color: string; text: string }> = {
    unpaid: { text: '未支付', color: 'warning' },
    paid: { text: '已支付', color: 'success' },
    overdue: { text: '已逾期', color: 'error' },
    cancelled: { text: '已取消', color: 'default' },
  };
  return map[status] || { text: status, color: 'default' };
}

// 格式化日期
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

// 导出账单
function handleExportBill(bill: Bill) {
  message.info(`导出账单: ${bill.billNo}`);
}

// 查看账单详情
function handleViewBill(bill: Bill) {
  message.info(`查看账单详情: ${bill.billNo}`);
}

// 导出所有账单
function handleExportAllBills() {
  message.info('导出所有账单');
}

// Tab切换事件
function handleTabChange(key: string) {
  activeTab.value = key;
  switch (key) {
    case 'bills': {
      fetchBills();

      break;
    }
    case 'realtime': {
      fetchRealtimeStats();

      break;
    }
    case 'usage': {
      fetchUsageRecords();

      break;
    }
    // No default
  }
}

onMounted(() => {
  fetchRealtimeStats();
});
</script>

<template>
  <div class="flex h-full flex-col gap-4 p-4">
    <!-- 顶部操作栏 -->
    <Card class="m-0">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Icon icon="lucide:bar-chart-3" class="size-5 text-gray-600" />
          <h2 class="text-lg font-semibold">用量与计费</h2>
        </div>
        <Button type="primary" @click="handleExportAllBills">
          <Icon icon="lucide:download" class="mr-1 size-4" />
          导出账单
        </Button>
      </div>
    </Card>

    <!-- Tab内容 -->
    <Card class="flex-1 overflow-hidden p-0">
      <Tabs
        v-model:active-key="activeTab"
        class="flex h-full flex-col"
        @change="handleTabChange"
      >
        <!-- 实时用量Tab -->
        <Tabs.TabPane key="realtime" tab="实时用量">
          <div class="h-full overflow-auto p-4">
            <Spin :spinning="loading">
              <!-- 统计卡片 -->
              <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card class="text-center">
                  <div class="text-2xl font-bold text-blue-600">
                    {{ realtimeStats.totalCalls.toLocaleString() }}
                  </div>
                  <div class="mt-2 text-sm text-gray-500">总调用量(次)</div>
                </Card>
                <Card class="text-center">
                  <div class="text-2xl font-bold text-green-600">
                    {{ (realtimeStats.totalTokens / 10000).toFixed(1) }}万
                  </div>
                  <div class="mt-2 text-sm text-gray-500">Token使用量</div>
                </Card>
                <Card class="text-center">
                  <div class="text-2xl font-bold text-orange-600">
                    ¥{{ realtimeStats.totalCost.toFixed(2) }}
                  </div>
                  <div class="mt-2 text-sm text-gray-500">总费用(元)</div>
                </Card>
              </div>

              <!-- TOP租户排行 -->
              <Card class="mb-4" title="TOP租户排行">
                <div
                  v-if="realtimeStats.topTenants.length === 0"
                  class="py-8 text-center text-gray-500"
                >
                  暂无数据
                </div>
                <table v-else class="w-full border-collapse">
                  <thead>
                    <tr class="border-b">
                      <th class="px-4 py-2 text-left">排名</th>
                      <th class="px-4 py-2 text-left">租户名称</th>
                      <th class="px-4 py-2 text-right">调用次数</th>
                      <th class="px-4 py-2 text-right">Token用量</th>
                      <th class="px-4 py-2 text-right">活跃用户</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(tenant, index) in realtimeStats.topTenants"
                      :key="tenant.tenantName"
                      class="border-b hover:bg-gray-50"
                    >
                      <td class="px-4 py-2">
                        <Tag
                          :color="
                            index === 0
                              ? 'gold'
                              : index === 1
                                ? 'blue'
                                : index === 2
                                  ? 'cyan'
                                  : 'default'
                          "
                        >
                          {{ index + 1 }}
                        </Tag>
                      </td>
                      <td class="px-4 py-2">{{ tenant.tenantName }}</td>
                      <td class="px-4 py-2 text-right">
                        {{ tenant.calls.toLocaleString() }}
                      </td>
                      <td class="px-4 py-2 text-right">
                        {{ (tenant.tokens / 10000).toFixed(1) }}万
                      </td>
                      <td class="px-4 py-2 text-right">
                        {{ tenant.activeUsers }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Card>

              <!-- 用量告警阈值 -->
              <Card title="用量告警阈值">
                <div
                  v-if="realtimeStats.alertThresholds.length === 0"
                  class="py-8 text-center text-gray-500"
                >
                  当前无告警
                </div>
                <div v-else class="space-y-3">
                  <div
                    v-for="alert in realtimeStats.alertThresholds"
                    :key="alert.tenantName + alert.modelName"
                    class="flex items-center justify-between rounded-lg border p-4"
                    :class="
                      alert.level === 'critical'
                        ? 'border-red-300 bg-red-50'
                        : 'border-yellow-300 bg-yellow-50'
                    "
                  >
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <span class="font-medium">{{ alert.tenantName }}</span>
                        <span class="text-gray-500">-</span>
                        <span class="text-gray-600">{{ alert.modelName }}</span>
                        <Tag
                          :color="
                            alert.level === 'critical' ? 'error' : 'warning'
                          "
                        >
                          {{ alert.level === 'critical' ? '严重' : '警告' }}
                        </Tag>
                      </div>
                      <div class="mt-2 text-sm text-gray-600">
                        已使用 {{ (alert.usedQuota / 10000).toFixed(1) }}万 /
                        {{ (alert.monthlyQuota / 10000).toFixed(1) }}万 Token
                        ({{ alert.usagePercentage }}%)
                      </div>
                    </div>
                    <Icon
                      :icon="
                        alert.level === 'critical'
                          ? 'lucide:alert-octagon'
                          : 'lucide:alert-triangle'
                      "
                      class="size-6"
                      :class="
                        alert.level === 'critical'
                          ? 'text-red-500'
                          : 'text-yellow-500'
                      "
                    />
                  </div>
                </div>
              </Card>
            </Spin>
          </div>
        </Tabs.TabPane>

        <!-- 账单管理Tab -->
        <Tabs.TabPane key="bills" tab="账单管理">
          <div class="h-full overflow-auto">
            <table class="w-full border-collapse">
              <thead class="sticky top-0 bg-gray-50">
                <tr>
                  <th
                    v-for="col in billColumns"
                    :key="col.key"
                    class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
                    :style="{ width: `${col.width}px` }"
                  >
                    {{ col.title }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading">
                  <td
                    :colspan="billColumns.length"
                    class="border-b px-4 py-8 text-center"
                  >
                    加载中...
                  </td>
                </tr>
                <tr
                  v-else-if="bills.length === 0"
                  :colspan="billColumns.length"
                  class="border-b px-4 py-8 text-center text-gray-500"
                >
                  暂无数据
                </tr>
                <tr
                  v-for="item in bills"
                  v-else
                  :key="item.id"
                  class="border-b hover:bg-gray-50"
                >
                  <td class="border-b px-4 py-3 font-mono text-sm">
                    {{ item.billNo }}
                  </td>
                  <td class="border-b px-4 py-3">{{ item.tenantName }}</td>
                  <td class="border-b px-4 py-3">{{ item.cycle }}</td>
                  <td class="border-b px-4 py-3">
                    ¥{{ item.serviceFees.toFixed(2) }}
                  </td>
                  <td class="border-b px-4 py-3">
                    ¥{{ item.modelFees.toFixed(2) }}
                  </td>
                  <td class="border-b px-4 py-3 font-medium">
                    ¥{{ item.totalAmount.toFixed(2) }}
                  </td>
                  <td class="border-b px-4 py-3">
                    <Tag :color="formatBillStatus(item.status).color">
                      {{ formatBillStatus(item.status).text }}
                    </Tag>
                  </td>
                  <td class="border-b px-4 py-3 text-sm text-gray-500">
                    {{ formatDate(item.dueDate) }}
                  </td>
                  <td class="border-b px-4 py-3">
                    <Button
                      type="link"
                      size="small"
                      @click="handleViewBill(item)"
                    >
                      详情
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      @click="handleExportBill(item)"
                    >
                      导出
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Tabs.TabPane>

        <!-- 用量明细Tab -->
        <Tabs.TabPane key="usage" tab="用量明细">
          <div class="h-full overflow-auto">
            <table class="w-full border-collapse">
              <thead class="sticky top-0 bg-gray-50">
                <tr>
                  <th
                    v-for="col in usageColumns"
                    :key="col.key"
                    class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
                    :style="{ width: `${col.width}px` }"
                  >
                    {{ col.title }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading">
                  <td
                    :colspan="usageColumns.length"
                    class="border-b px-4 py-8 text-center"
                  >
                    加载中...
                  </td>
                </tr>
                <tr
                  v-else-if="usageRecords.length === 0"
                  :colspan="usageColumns.length"
                  class="border-b px-4 py-8 text-center text-gray-500"
                >
                  暂无数据
                </tr>
                <tr
                  v-for="item in usageRecords"
                  v-else
                  :key="item.id"
                  class="border-b hover:bg-gray-50"
                >
                  <td class="border-b px-4 py-3">{{ item.tenantName }}</td>
                  <td class="border-b px-4 py-3">{{ item.serviceName }}</td>
                  <td class="border-b px-4 py-3">{{ item.modelName }}</td>
                  <td class="border-b px-4 py-3">
                    {{ item.callCount.toLocaleString() }}
                  </td>
                  <td class="border-b px-4 py-3">
                    {{ item.inputTokens.toLocaleString() }}
                  </td>
                  <td class="border-b px-4 py-3">
                    {{ item.outputTokens.toLocaleString() }}
                  </td>
                  <td class="border-b px-4 py-3 font-medium">
                    {{ item.totalTokens.toLocaleString() }}
                  </td>
                  <td class="border-b px-4 py-3">
                    ¥{{ item.cost.toFixed(2) }}
                  </td>
                  <td class="border-b px-4 py-3 text-sm text-gray-500">
                    {{ item.date }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </div>
</template>
