<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Avatar, Button, RangePicker, Select, Table } from 'ant-design-vue';
import dayjs from 'dayjs';

const TableSummary = Table.Summary;
const TableSummaryRow = Table.Summary.Row;
const TableSummaryCell = Table.Summary.Cell;

const route = useRoute();
const tenantId = route.params.id;

const selectedEmployee = ref<null | string>(null);
const dateRange = ref<[any, any]>([dayjs().startOf('month'), dayjs()]);

const employeeOptions = [
  { label: '选品报价员 (EMP-001)', value: 'EMP-001' },
  { label: '数据分析员 (EMP-002)', value: 'EMP-002' },
  { label: '合规审核专员 (EMP-003)', value: 'EMP-003' },
];

const tenant = ref<any>({
  id: tenantId,
  name: '阿里巴巴集团(杭州)网络有限公司',
  manager: '张三 (13800000001)',
});

const columns = [
  { title: '数字员工', dataIndex: 'employee', key: 'employee' },
  { title: '编号', dataIndex: 'id', key: 'id' },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '任务次数', dataIndex: 'count', key: 'count', align: 'right' },
  { title: '单位', dataIndex: 'unit', key: 'unit' },
  { title: '消耗 Token', dataIndex: 'token', key: 'token', align: 'right' },
];

const records = ref<any[]>([]);

onMounted(() => {
  records.value = [
    {
      key: '1',
      id: 'EMP-001',
      name: '选品报价员',
      description: '熟悉市场的选品与报价专家',
      avatar: `${import.meta.env.BASE_URL}images/ai-employee/sales.png`,
      count: 120 + Math.floor(Math.random() * 100),
      unit: '生成报价单',
      token: 150_000,
    },
    {
      key: '2',
      id: 'EMP-002',
      name: '数据分析员',
      description: '抓取业务线数据生成报表',
      avatar: `${import.meta.env.BASE_URL}images/ai-employee/data.png`,
      count: 45 + Math.floor(Math.random() * 50),
      unit: '生成分析报表',
      token: 450_000,
    },
    {
      key: '3',
      id: 'EMP-003',
      name: '合规审核专员',
      description: '合同条款与规定自动比对',
      avatar: `${import.meta.env.BASE_URL}images/ai-employee/finance.png`,
      count: 320 + Math.floor(Math.random() * 200),
      unit: '合规检查',
      token: 80_000,
    },
  ];
});

const filteredRecords = computed(() => {
  if (!selectedEmployee.value) return records.value;
  return records.value.filter((r) => r.id === selectedEmployee.value);
});

const totalCount = computed(() => {
  return filteredRecords.value.reduce((sum, current) => sum + current.count, 0);
});

const totalToken = computed(() => {
  return filteredRecords.value.reduce((sum, current) => sum + current.token, 0);
});
</script>

<template>
  <div
    class="flex min-h-full w-full flex-col gap-6 bg-slate-50 p-4 md:p-6 dark:bg-slate-900"
  >
    <div class="flex items-center gap-4 border-b border-slate-100 pb-4">
      <Button type="text" @click="$router.back()">
        <template #icon><Icon icon="lucide:arrow-left" /></template>
        返回
      </Button>
      <h1 class="text-xl font-bold text-slate-800 dark:text-slate-100">
        租户调用明细
      </h1>
    </div>

    <div class="flex flex-col gap-6">
      <div
        class="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        <div
          class="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-2xl font-bold text-primary"
        >
          {{ tenant.name?.charAt(0) || 'T' }}
        </div>
        <div>
          <div class="text-xl font-semibold text-slate-800 dark:text-slate-200">
            {{ tenant.name }}
          </div>
          <div class="mt-1 text-sm text-slate-500">
            编号: {{ tenant.id }} | 负责人: {{ tenant.manager }}
          </div>
        </div>
      </div>

      <!-- Filter Section (Glassmorphism card) -->
      <div
        class="rounded-2xl border border-slate-200/60 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/80"
      >
        <div class="flex flex-wrap items-end gap-4">
          <div class="flex min-w-[200px] max-w-[300px] flex-1 flex-col gap-1.5">
            <label
              class="text-xs font-semibold uppercase tracking-wider text-slate-500"
              >数字员工</label
            >
            <Select
              v-model:value="selectedEmployee"
              show-search
              :options="employeeOptions"
              class="w-full"
              size="large"
              allow-clear
              placeholder="默认全选"
            />
          </div>
          <div class="flex min-w-[280px] max-w-[400px] flex-1 flex-col gap-1.5">
            <label
              class="text-xs font-semibold uppercase tracking-wider text-slate-500"
              >查询时间段</label
            >
            <RangePicker
              v-model:value="dateRange"
              class="w-full"
              size="large"
            />
          </div>
          <div class="flex items-center gap-3 pb-[2px]">
            <Button
              type="primary"
              size="large"
              class="!rounded-lg px-6 shadow-sm"
            >
              查询
            </Button>
            <Button size="large" class="!rounded-lg px-6">重置</Button>
          </div>
        </div>
      </div>

      <div
        class="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        <div class="mb-6 flex items-center justify-between">
          <h3 class="text-lg font-medium text-slate-700 dark:text-slate-300">
            员工统计列表
          </h3>
        </div>
        <Table
          :columns="columns"
          :data-source="filteredRecords"
          :pagination="{ pageSize: 10 }"
          size="middle"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'employee'">
              <div class="flex items-center gap-3">
                <Avatar :src="record.avatar" size="large" />
                <span class="font-medium text-slate-700 dark:text-slate-200">{{
                  record.name
                }}</span>
              </div>
            </template>
            <template v-if="column.key === 'count'">
              <span class="font-semibold text-primary">{{
                record.count.toLocaleString()
              }}</span>
            </template>
            <template v-if="column.key === 'token'">
              <span class="text-slate-600 dark:text-slate-300">{{
                record.token.toLocaleString()
              }}</span>
            </template>
          </template>
          <template #summary>
            <TableSummary>
              <TableSummaryRow>
                <TableSummaryCell
                  :index="0"
                  :col-span="3"
                  class="text-right font-bold"
                >
                  总计
                </TableSummaryCell>
                <TableSummaryCell
                  :index="3"
                  class="text-right font-bold text-primary"
                >
                  {{ totalCount.toLocaleString() }}
                </TableSummaryCell>
                <TableSummaryCell :index="4" />
                <TableSummaryCell :index="5" class="text-right font-bold">
                  {{ totalToken.toLocaleString() }}
                </TableSummaryCell>
              </TableSummaryRow>
            </TableSummary>
          </template>
        </Table>
      </div>
    </div>
  </div>
</template>
