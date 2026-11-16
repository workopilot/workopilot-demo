<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import {
  Avatar,
  Button,
  DatePicker,
  Input,
  Select,
  Table,
} from 'ant-design-vue';
import dayjs, { Dayjs } from 'dayjs';

const route = useRoute();
const router = useRouter();

// ==========================
// Filter State
// ==========================
const currentEmployeeId = ref((route.query.id as string) || 'EMP-012');
const dateRange = ref<[Dayjs, Dayjs]>([dayjs().subtract(7, 'day'), dayjs()]);
const searchUser = ref('');

const allEmployees = [
  { value: 'EMP-012', label: 'PPT自动生成专员 (独享)', type: '独享' },
  { value: 'EMP-015', label: '短视频数字人 (独享)', type: '独享' },
  { value: 'EMP-025', label: '数据分析师 (共享)', type: '共享' },
  { value: 'EMP-033', label: '全能问答助手 (共享)', type: '共享' },
  { value: 'EMP-041', label: '文案优化大师 (共享)', type: '共享' },
];

const currentEmployeeInfo = computed(() => {
  return (
    allEmployees.find((e) => e.value === currentEmployeeId.value) ||
    allEmployees[0]
  );
});

// ==========================
// Mock Data: 消耗明细
// ==========================
const detailLogs = ref([
  {
    id: 'LOG-1001',
    user: '张三 (运营部)',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=zhangsan',
    employee: 'PPT自动生成专员',
    date: '2026-05-11 14:32:01',
    cost: 5,
    unit: '点',
    remark: '生成了一份【Q3季度出海竞品分析报告】',
  },
  {
    id: 'LOG-1002',
    user: '李四 (市场部)',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=lisi',
    employee: 'PPT自动生成专员',
    date: '2026-05-11 10:15:22',
    cost: 5,
    unit: '点',
    remark: '年度营销复盘演示文稿',
  },
  {
    id: 'LOG-1003',
    user: '王五 (产品部)',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=wangwu',
    employee: 'PPT自动生成专员',
    date: '2026-05-10 16:45:00',
    cost: 10,
    unit: '点',
    remark: '批量生成了2份新产品培训文档',
  },
  {
    id: 'LOG-1004',
    user: '张三 (运营部)',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=zhangsan',
    employee: 'PPT自动生成专员',
    date: '2026-05-09 09:20:11',
    cost: 5,
    unit: '点',
    remark: '日常周报PPT化',
  },
]);

const columns = [
  { title: '使用用户', dataIndex: 'user', key: 'user', width: 200 },
  { title: '数字员工', dataIndex: 'employee', key: 'employee', width: 180 },
  { title: '消耗日期', dataIndex: 'date', key: 'date', width: 180 },
  {
    title: '扣除点数',
    dataIndex: 'cost',
    key: 'cost',
    align: 'center',
    width: 120,
  },
  { title: '备注事项', dataIndex: 'remark', key: 'remark' },
];

const handleBack = () => {
  router.push({ name: 'TenantBillOverview' });
};
</script>

<template>
  <div
    class="flex min-h-full w-full flex-col gap-6 bg-slate-50/50 p-4 md:p-6 dark:bg-slate-900/50"
  >
    <!-- Header with Back Button -->
    <div class="flex items-center gap-4">
      <Button
        shape="circle"
        class="border-slate-200 shadow-sm"
        @click="handleBack"
      >
        <template #icon>
          <Icon icon="lucide:arrow-left" class="text-slate-600" />
        </template>
      </Button>
      <div>
        <h1
          class="m-0 text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100"
        >
          消耗流水明细
        </h1>
        <p class="m-0 mt-1 text-xs text-slate-500">
          查看具体的员工调用记录与计费详情
        </p>
      </div>
    </div>

    <!-- Filters Card -->
    <div
      class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
    >
      <div class="flex flex-col gap-6 md:flex-row md:items-center">
        <!-- Switcher -->
        <div class="flex max-w-[300px] flex-1 flex-col gap-1.5">
          <span class="text-xs font-bold uppercase tracking-wide text-slate-500"
            >切换数字员工</span
          >
          <Select v-model:value="currentEmployeeId" class="w-full" size="large">
            <Select.Option
              v-for="emp in allEmployees"
              :key="emp.value"
              :value="emp.value"
            >
              {{ emp.label }}
            </Select.Option>
          </Select>
        </div>

        <div
          class="hidden h-10 w-px bg-slate-100 md:block dark:bg-slate-700"
        ></div>

        <!-- Date Range -->
        <div class="flex max-w-[350px] flex-1 flex-col gap-1.5">
          <span class="text-xs font-bold uppercase tracking-wide text-slate-500"
            >查询日期区间</span
          >
          <DatePicker.RangePicker
            v-model:value="dateRange"
            size="large"
            class="w-full"
          />
        </div>

        <div
          class="hidden h-10 w-px bg-slate-100 md:block dark:bg-slate-700"
        ></div>

        <!-- User Search -->
        <div class="flex max-w-[250px] flex-1 flex-col gap-1.5">
          <span class="text-xs font-bold uppercase tracking-wide text-slate-500"
            >使用用户过滤</span
          >
          <Input.Search
            v-model:value="searchUser"
            placeholder="输入用户姓名"
            size="large"
          />
        </div>
      </div>
    </div>

    <!-- Main Table -->
    <div
      class="flex flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
    >
      <div
        class="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-5 dark:border-slate-700 dark:bg-slate-900/50"
      >
        <div class="flex items-center gap-3">
          <div
            class="rounded-lg p-1.5"
            :class="
              currentEmployeeInfo?.type === '独享'
                ? 'bg-purple-100 text-purple-600'
                : 'bg-blue-100 text-blue-600'
            "
          >
            <Icon
              :icon="
                currentEmployeeInfo?.type === '独享'
                  ? 'lucide:gem'
                  : 'lucide:layers'
              "
            />
          </div>
          <h2
            class="m-0 text-base font-bold text-slate-800 dark:text-slate-100"
          >
            {{ currentEmployeeInfo?.label.split(' ')[0] }}
            <span class="ml-2 text-xs font-normal text-slate-500"
              >流水账单</span
            >
          </h2>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-sm text-slate-500">本期合计消耗:</span>
          <span class="text-xl font-black text-rose-500">- 25 点</span>
          <Button type="primary" ghost class="ml-4 rounded-lg">
            导出 Excel
          </Button>
        </div>
      </div>

      <div class="flex-1 p-2">
        <Table
          :data-source="detailLogs"
          :columns="columns"
          :pagination="{ pageSize: 15 }"
          class="custom-table"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'user'">
              <div class="flex items-center gap-3 py-1">
                <Avatar
                  :src="record.avatar"
                  :size="32"
                  class="border border-slate-200 bg-slate-100"
                />
                <span
                  class="text-sm font-bold text-slate-700 dark:text-slate-200"
                  >{{ record.user }}</span
                >
              </div>
            </template>

            <template v-if="column.key === 'employee'">
              <span class="font-medium text-slate-600 dark:text-slate-400">{{
                record.employee
              }}</span>
            </template>

            <template v-if="column.key === 'date'">
              <span
                class="rounded bg-slate-50 px-2 py-1 font-mono text-xs text-slate-500 dark:bg-slate-700"
                >{{ record.date }}</span
              >
            </template>

            <template v-if="column.key === 'cost'">
              <div
                class="inline-flex items-center gap-1 rounded bg-rose-50 px-2.5 py-0.5 font-mono font-bold text-rose-600 dark:bg-rose-900/20"
              >
                - {{ record.cost }} {{ record.unit }}
              </div>
            </template>

            <template v-if="column.key === 'remark'">
              <div class="flex items-start gap-2">
                <Icon
                  icon="lucide:message-square"
                  class="mt-1 text-slate-400"
                />
                <span
                  class="text-sm leading-snug text-slate-600 dark:text-slate-300"
                  >{{ record.remark }}</span
                >
              </div>
            </template>
          </template>
        </Table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-table :deep(.ant-table-wrapper) {
  background: transparent;
}

.custom-table :deep(.ant-table) {
  background: transparent;
}

.custom-table :deep(.ant-table-thead > tr > th) {
  font-weight: 700;
  color: #64748b;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
}

.dark .custom-table :deep(.ant-table-thead > tr > th) {
  color: #94a3b8;
  background: rgb(30 41 59 / 50%);
  border-bottom-color: #334155;
}
</style>
