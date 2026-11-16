<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue';

import type { UsageMonitor, UsageQueryParams } from '#/types/billing';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import {
  Button,
  DatePicker,
  message,
  Progress,
  Select,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import { getUsageMonitorsApi } from '#/api/billing';
import { ProductVersionMap } from '#/types/billing';

const router = useRouter();

const loading = ref(false);
const tableData = ref<UsageMonitor[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

// 租户列表（从数据中提取）
const tenantList = ref<string[]>([]);

// 产品服务列表（固定的6项）
const serviceOptions = [
  { label: '智能附件分类', value: '智能附件分类' },
  { label: '智能附件比对', value: '智能附件比对' },
  { label: '智能单据填报', value: '智能单据填报' },
  { label: '智能单据审核', value: '智能单据审核' },
  { label: '智能业务合规', value: '智能业务合规' },
  { label: '智能合规审计', value: '智能合规审计' },
];

// 查询参数
const queryParams = ref<UsageQueryParams>({
  page: 1,
  pageSize: 10,
  tenantName: undefined,
  productName: undefined,
  status: undefined,
  expiryDateRange: null,
  sortByUsagePercentage: null,
  sortByExpiryDate: null,
});

// 排序状态
const usagePercentageSort = ref<'asc' | 'desc' | null>(null);
const expiryDateSort = ref<'asc' | 'desc' | null>(null);

// 状态选项
const statusOptions = [
  { label: '正常', value: 'normal' },
  { label: '即将超限', value: 'warning' },
  { label: '已超限', value: 'exceeded' },
];

// 状态映射
const statusMap: Record<string, { color: string; text: string }> = {
  normal: { text: '正常', color: 'success' },
  warning: { text: '即将超限', color: 'warning' },
  exceeded: { text: '已超限', color: 'error' },
};

// 版本映射（包含颜色）
const versionColorMap: Record<string, string> = {
  standard: 'blue',
  plus: 'cyan',
  pro: 'purple',
  promax: 'gold',
};

// 排序图标
function getSortIcon(sortState: 'asc' | 'desc' | null) {
  if (sortState === 'asc') return '↑';
  if (sortState === 'desc') return '↓';
  return '⇅';
}

// 获取用量监控列表
async function fetchUsageMonitors() {
  loading.value = true;
  try {
    const params = {
      ...queryParams.value,
      page: currentPage.value,
      pageSize: pageSize.value,
    };
    const response = await getUsageMonitorsApi(params);
    tableData.value = response.data.items;
    total.value = response.data.total;

    // 提取租户列表（去重）
    const tenants = new Set<string>();
    response.data.items.forEach((item: UsageMonitor) => {
      tenants.add(item.tenantName);
    });
    tenantList.value = [...tenants].toSorted();
  } catch (error) {
    message.error('获取用量监控列表失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

// 查询
function handleSearch() {
  currentPage.value = 1;
  fetchUsageMonitors();
}

// 重置查询
function handleReset() {
  queryParams.value = {
    page: 1,
    pageSize: pageSize.value,
    tenantName: undefined,
    productName: undefined,
    status: undefined,
    expiryDateRange: null,
    sortByUsagePercentage: null,
    sortByExpiryDate: null,
  };
  usagePercentageSort.value = null;
  expiryDateSort.value = null;
  currentPage.value = 1;
  fetchUsageMonitors();
}

// 排序处理
function handleUsagePercentageSort() {
  // 切换排序状态: null -> desc -> asc -> null
  if (usagePercentageSort.value === null) {
    usagePercentageSort.value = 'desc';
    expiryDateSort.value = null;
  } else if (usagePercentageSort.value === 'desc') {
    usagePercentageSort.value = 'asc';
  } else {
    usagePercentageSort.value = null;
  }
  queryParams.value.sortByUsagePercentage = usagePercentageSort.value;
  queryParams.value.sortByExpiryDate = null;
  fetchUsageMonitors();
}

function handleExpiryDateSort() {
  // 切换排序状态: null -> asc -> desc -> null
  if (expiryDateSort.value === null) {
    expiryDateSort.value = 'asc';
    usagePercentageSort.value = null;
  } else if (expiryDateSort.value === 'asc') {
    expiryDateSort.value = 'desc';
  } else {
    expiryDateSort.value = null;
  }
  queryParams.value.sortByExpiryDate = expiryDateSort.value;
  queryParams.value.sortByUsagePercentage = null;
  fetchUsageMonitors();
}

// 查看日志
function handleViewLogs(item: UsageMonitor) {
  router.push({
    name: 'ServiceCallLogs',
    query: {
      serviceName: item.productName,
    },
  });
}

// 分页改变
function handleTableChange(pagination: any) {
  currentPage.value = pagination.current;
  pageSize.value = pagination.pageSize;
  fetchUsageMonitors();
}

// 刷新
function handleRefresh() {
  fetchUsageMonitors();
}

// 导出
function handleExport() {
  // 生成CSV数据
  const headers = [
    '租户名称',
    '产品服务',
    '产品规格',
    '使用率',
    '已使用',
    '限额',
    '状态',
    '到期日期',
  ];
  const rows = tableData.value.map((item) => [
    item.tenantName,
    item.productName,
    ProductVersionMap[item.productVersion] || item.productVersion,
    `${item.usagePercentage.toFixed(2)}%`,
    item.usedAmount.toLocaleString(),
    item.usageLimit.toLocaleString(),
    statusMap[item.status].text,
    formatDate(item.expiryDate),
  ]);

  let csvContent = `${headers.join(',')}\n`;
  csvContent += rows.map((row) => row.join(',')).join('\n');

  // 添加BOM以支持中文
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `用量监控_${new Date().toISOString().split('T')[0]}.csv`,
  );
  link.style.visibility = 'hidden';
  document.body.append(link);
  link.click();
  link.remove();
  message.success('导出成功');
}

// 格式化日期
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

// 表格列定义
const columns: TableColumnsType<UsageMonitor> = [
  {
    title: '租户名称',
    dataIndex: 'tenantName',
    key: 'tenantName',
    width: 180,
  },
  {
    title: '产品服务',
    dataIndex: 'productName',
    key: 'productName',
    width: 140,
  },
  {
    title: '用量情况',
    key: 'usage',
    width: 250,
  },
  {
    title: '使用率',
    key: 'percentage',
    width: 120,
    customRender: ({ record }) => `${record.usagePercentage.toFixed(2)}%`,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
  },
  {
    title: '到期日期',
    dataIndex: 'expiryDate',
    key: 'expiryDate',
    width: 120,
    customRender: ({ record }) => formatDate(record.expiryDate),
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    fixed: 'right',
  },
];

onMounted(() => {
  fetchUsageMonitors();
});
</script>

<template>
  <div class="h-full space-y-4 overflow-y-auto p-6">
    <!-- 查询表单 -->
    <div class="rounded-lg border bg-card p-4 shadow-sm">
      <!-- 第一行：租户名称、产品服务、状态 -->
      <div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <!-- 租户名称 -->
        <div class="flex items-center gap-2">
          <label class="w-16 shrink-0 text-sm font-medium">租户名称</label>
          <Select
            v-model:value="queryParams.tenantName"
            allow-clear
            placeholder="请选择租户"
            class="flex-1"
            show-search
            :filter-option="
              (input: string, option: any) =>
                option.value.toLowerCase().includes(input.toLowerCase())
            "
          >
            <Select.Option
              v-for="tenant in tenantList"
              :key="tenant"
              :value="tenant"
            >
              {{ tenant }}
            </Select.Option>
          </Select>
        </div>

        <!-- 产品服务 -->
        <div class="flex items-center gap-2">
          <label class="w-16 shrink-0 text-sm font-medium">产品服务</label>
          <Select
            v-model:value="queryParams.productName"
            allow-clear
            placeholder="请选择产品服务"
            class="flex-1"
          >
            <Select.Option
              v-for="service in serviceOptions"
              :key="service.value"
              :value="service.value"
            >
              {{ service.label }}
            </Select.Option>
          </Select>
        </div>

        <!-- 状态筛选 -->
        <div class="flex items-center gap-2">
          <label class="w-16 shrink-0 text-sm font-medium">状态</label>
          <Select
            v-model:value="queryParams.status"
            allow-clear
            placeholder="请选择状态"
            class="flex-1"
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
      </div>

      <!-- 第二行：到期日期、操作按钮 -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <!-- 到期日期 -->
        <div class="flex items-center gap-2">
          <label class="w-16 shrink-0 text-sm font-medium">到期日期</label>
          <DatePicker.RangePicker
            v-model:value="queryParams.expiryDateRange"
            class="flex-1"
            placeholder="['开始日期', '结束日期']"
          />
        </div>

        <!-- 操作按钮 -->
        <div class="flex items-center justify-end gap-2 lg:col-span-2">
          <Button @click="handleReset">重置</Button>
          <Button type="primary" @click="handleSearch">搜索</Button>
        </div>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="rounded-lg border bg-card shadow-sm">
      <!-- 表格标题和操作栏 -->
      <div class="flex items-center justify-between border-b px-4 py-3">
        <h3 class="text-lg font-semibold">用量监控</h3>
        <Space>
          <Button @click="handleExport">
            <Icon icon="lucide:download" class="mr-1 size-4" />
            导出
          </Button>
          <Tooltip title="刷新">
            <Button @click="handleRefresh">
              <Icon icon="lucide:refresh-cw" class="size-4" />
            </Button>
          </Tooltip>
        </Space>
      </div>

      <table class="w-full">
        <thead class="bg-muted/50">
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              class="border-b px-4 py-3 text-left text-sm font-medium"
              :style="{ width: col.width }"
            >
              <template v-if="col.key === 'percentage'">
                <div
                  class="flex cursor-pointer items-center gap-1 transition-colors hover:text-primary"
                  @click="handleUsagePercentageSort"
                >
                  {{ col.title }}
                  <span class="text-xs text-muted-foreground">
                    {{ getSortIcon(usagePercentageSort) }}
                  </span>
                </div>
              </template>
              <template v-else-if="col.key === 'expiryDate'">
                <div
                  class="flex cursor-pointer items-center gap-1 transition-colors hover:text-primary"
                  @click="handleExpiryDateSort"
                >
                  {{ col.title }}
                  <span class="text-xs text-muted-foreground">
                    {{ getSortIcon(expiryDateSort) }}
                  </span>
                </div>
              </template>
              <template v-else>
                {{ col.title }}
              </template>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in tableData"
            :key="item.id"
            class="border-b transition-colors hover:bg-muted/50"
          >
            <td class="px-4 py-3 text-sm font-medium">{{ item.tenantName }}</td>
            <td class="px-4 py-3 text-sm">
              <div class="space-y-1">
                <div class="font-medium">{{ item.productName }}</div>
                <Tag
                  :color="versionColorMap[item.productVersion] || 'default'"
                  size="small"
                >
                  {{
                    ProductVersionMap[item.productVersion] ||
                    item.productVersion
                  }}
                </Tag>
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="space-y-2">
                <Progress
                  :percent="Number(item.usagePercentage.toFixed(2))"
                  :status="
                    item.status === 'exceeded'
                      ? 'exception'
                      : item.status === 'warning'
                        ? 'warning'
                        : 'success'
                  "
                  :stroke-color="
                    item.status === 'exceeded'
                      ? '#ff4d4f'
                      : item.status === 'warning'
                        ? '#faad14'
                        : '#52c41a'
                  "
                  size="small"
                />
                <div class="flex justify-between text-xs text-muted-foreground">
                  <span>已用: {{ item.usedAmount.toLocaleString() }}</span>
                  <span>
                    限额:
                    {{
                      item.usageLimit >= 1000000
                        ? '不限'
                        : item.usageLimit.toLocaleString()
                    }}
                  </span>
                </div>
              </div>
            </td>
            <td class="px-4 py-3 font-mono text-sm">
              {{ item.usagePercentage.toFixed(2) }}%
            </td>
            <td class="px-4 py-3">
              <Tag :color="statusMap[item.status].color">
                {{ statusMap[item.status].text }}
              </Tag>
            </td>
            <td class="px-4 py-3 text-sm">{{ formatDate(item.expiryDate) }}</td>
            <td class="px-4 py-3">
              <Button type="link" size="small" @click="handleViewLogs(item)">
                查看日志
              </Button>
            </td>
          </tr>
          <tr v-if="tableData.length === 0">
            <td
              :colspan="columns.length"
              class="px-4 py-8 text-center text-muted-foreground"
            >
              暂无数据
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 分页 -->
      <div
        v-if="total > 0"
        class="flex items-center justify-between border-t px-4 py-3"
      >
        <span class="text-sm text-muted-foreground">
          共 {{ total }} 条记录
        </span>
        <div class="flex gap-2">
          <Button
            :disabled="currentPage === 1"
            size="small"
            @click="
              currentPage--;
              handleTableChange({ current: currentPage, pageSize });
            "
          >
            上一页
          </Button>
          <Button
            :disabled="currentPage * pageSize >= total"
            size="small"
            @click="
              currentPage++;
              handleTableChange({ current: currentPage, pageSize });
            "
          >
            下一页
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
