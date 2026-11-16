<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Avatar, Button, RangePicker, Select, Table } from 'ant-design-vue';
import dayjs from 'dayjs';

const route = useRoute();
const employeeId = route.params.id as string;

// Initialize filters with defaults passed from previous page
const selectedEmployee = ref<string>(employeeId || 'EMP-001');
const dateRange = ref<[any, any]>([dayjs().startOf('month'), dayjs()]);

const employeeOptions = [
  { label: '选品报价员 (EMP-001)', value: 'EMP-001' },
  { label: '数据分析员 (EMP-002)', value: 'EMP-002' },
  { label: '合规审核专员 (EMP-003)', value: 'EMP-003' },
];

const columns = [
  { title: '数字员工', dataIndex: 'employee', key: 'employee', width: 250 },
  { title: '调用日期', dataIndex: 'time', key: 'time', width: 200 },
  { title: '调用用户', dataIndex: 'user', key: 'user', width: 180 },
  { title: '备注', dataIndex: 'remarks', key: 'remarks' },
];

const records = ref<any[]>([]);

onMounted(() => {
  const employeeNames: Record<string, { avatar: string; name: string }> = {
    'EMP-001': {
      name: '选品报价员',
      avatar: '/auditdemo/images/ai-employee/sales.png',
    },
    'EMP-002': {
      name: '数据分析员',
      avatar: '/auditdemo/images/ai-employee/data.png',
    },
    'EMP-003': {
      name: '合规审核专员',
      avatar: '/auditdemo/images/ai-employee/finance.png',
    },
  };

  const users = ['张三', '李四', '王五', '系统自动触发', '赵六'];
  const remarkTemplates = [
    '生成 Q3 市场分析报告',
    '处理客户询价单 #88902',
    '巡检库房过期产品',
    '合同条款风险审查',
    '生成对外宣传册内容',
  ];

  const targetEmp =
    employeeNames[selectedEmployee.value] || employeeNames['EMP-001'];

  records.value = Array.from({ length: 45 }).map((_, i) => ({
    key: i,
    avatar: targetEmp.avatar,
    name: targetEmp.name,
    time: dayjs()
      .subtract(i * 3, 'hour')
      .format('YYYY-MM-DD HH:mm:ss'),
    user: users[i % users.length],
    remarks: `${remarkTemplates[i % remarkTemplates.length]} - 耗时 ${1.2 + (i % 3)}s`,
  }));
});
</script>

<template>
  <div
    class="flex min-h-full w-full flex-col gap-6 bg-slate-50/50 p-4 md:p-6 dark:bg-slate-900"
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between border-b border-slate-200/60 pb-4"
    >
      <div class="flex items-center gap-3">
        <Button
          type="text"
          class="!px-2 hover:bg-slate-100"
          @click="$router.back()"
        >
          <template #icon>
            <Icon icon="lucide:arrow-left" class="text-lg" />
          </template>
        </Button>
        <h1
          class="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
        >
          数字员工调用明细
        </h1>
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
          />
        </div>
        <div class="flex min-w-[280px] max-w-[400px] flex-1 flex-col gap-1.5">
          <label
            class="text-xs font-semibold uppercase tracking-wider text-slate-500"
            >查询时间段</label
          >
          <RangePicker v-model:value="dateRange" class="w-full" size="large" />
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

    <!-- Table Section -->
    <div
      class="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
    >
      <div
        class="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-5 dark:border-slate-700/50 dark:bg-slate-800/50"
      >
        <h3 class="font-semibold text-slate-800 dark:text-slate-200">
          调用记录列表
        </h3>
        <span class="text-sm text-slate-500"
          >共找到
          <span class="font-semibold text-primary">1,248</span> 条记录</span
        >
      </div>

      <div class="p-0">
        <Table
          :columns="columns"
          :data-source="records"
          :pagination="{
            pageSize: 20,
            showSizeChanger: true,
            class: '!mr-5 !mb-5',
          }"
          :scroll="{ x: 'max-content' }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'employee'">
              <div class="flex items-center gap-3 py-1">
                <Avatar
                  :src="record.avatar"
                  :size="40"
                  class="border border-slate-100 shadow-sm"
                />
                <span class="font-medium text-slate-800 dark:text-slate-200">{{
                  record.name
                }}</span>
              </div>
            </template>
            <template v-if="column.key === 'user'">
              <div class="flex items-center gap-2">
                <div
                  class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600"
                >
                  {{ record.user.charAt(0) }}
                </div>
                <span class="text-slate-600 dark:text-slate-300">{{
                  record.user
                }}</span>
              </div>
            </template>
            <template v-if="column.key === 'remarks'">
              <div
                class="max-w-md truncate text-slate-500"
                :title="record.remarks"
              >
                {{ record.remarks }}
              </div>
            </template>
          </template>
        </Table>
      </div>
    </div>
  </div>
</template>
