<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  Avatar,
  Button,
  Card,
  Form,
  FormItem,
  Modal,
  Progress,
  RadioButton,
  RadioGroup,
  RangePicker,
  Select,
  Table,
  Tag,
} from 'ant-design-vue';

const TableSummary = Table.Summary;
const TableSummaryRow = Table.Summary.Row;
const TableSummaryCell = Table.Summary.Cell;

const router = useRouter();
const timeRange = ref('month');
const customDateRange = ref<any>(null);
const selectedEmployee = ref<null | string>(null);

const columns = [
  { title: '数字员工', dataIndex: 'employee', key: 'employee' },
  { title: '编号', dataIndex: 'id', key: 'id' },
  { title: '业务线', dataIndex: 'businessLine', key: 'businessLine' },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '任务次数', dataIndex: 'count', key: 'count', align: 'right' },
  { title: '单位', dataIndex: 'unit', key: 'unit' },
  { title: '消耗 Token', dataIndex: 'token', key: 'token', align: 'right' },
  { title: '操作', key: 'action', width: 120, align: 'center' },
];

const employeeData = ref([
  {
    key: '1',
    id: 'EMP-001',
    name: '选品报价员',
    businessLine: '销售部',
    description: '熟悉市场的选品与报价专家',
    avatar: '/auditdemo/images/ai-employee/sales.png',
    count: 342,
    unit: '生成报价单',
    token: 450_200,
  },
  {
    key: '2',
    id: 'EMP-002',
    name: '数据分析员',
    businessLine: '数据部',
    description: '抓取业务线数据生成报表',
    avatar: '/auditdemo/images/ai-employee/data.png',
    count: 128,
    unit: '生成分析报表',
    token: 890_500,
  },
  {
    key: '3',
    id: 'EMP-003',
    name: '合规审核专员',
    businessLine: '法务部',
    description: '合同条款与规定自动比对',
    avatar: '/auditdemo/images/ai-employee/finance.png',
    count: 512,
    unit: '合规检查',
    token: 210_000,
  },
]);

const rechargeColumns = [
  { title: '充值日期', dataIndex: 'rechargeDate', key: 'rechargeDate' },
  { title: '充值套餐包', dataIndex: 'package', key: 'package' },
  { title: '充值次数', dataIndex: 'count', key: 'count' },
  { title: '到期日期', dataIndex: 'expireDate', key: 'expireDate' },
];

const rechargeData = ref([
  {
    key: '1',
    rechargeDate: '2026-04-24 10:00:00',
    package: 'Pro',
    count: '2,000',
    expireDate: '2026-05-24 23:59:59',
  },
  {
    key: '2',
    rechargeDate: '2026-03-01 09:30:00',
    package: 'Lite',
    count: '1,000',
    expireDate: '2026-06-01 23:59:59',
  },
  {
    key: '3',
    rechargeDate: '2026-02-15 14:20:00',
    package: 'Pro',
    count: '2,000',
    expireDate: '2026-03-15 23:59:59',
  },
]);

const getPkgColor = (pkg: string) => {
  switch (pkg) {
    case 'Lite': {
      return 'blue';
    }
    case 'Max': {
      return 'purple';
    }
    case 'Pro': {
      return 'green';
    }
    default: {
      return 'default';
    }
  }
};

const employeeOptions = computed(() => {
  return employeeData.value.map((emp) => ({
    label: emp.name,
    value: emp.id,
  }));
});

const filterOption = (input: string, option: any) => {
  return option.label.toLowerCase().includes(input.toLowerCase());
};

const filteredEmployeeData = computed(() => {
  if (!selectedEmployee.value) return employeeData.value;
  return employeeData.value.filter((emp) => emp.id === selectedEmployee.value);
});

const totalCount = computed(() => {
  return filteredEmployeeData.value.reduce(
    (sum, current) => sum + current.count,
    0,
  );
});

const totalToken = computed(() => {
  return filteredEmployeeData.value.reduce(
    (sum, current) => sum + current.token,
    0,
  );
});

const handleViewDetail = (record: any) => {
  router.push(`/ai-employee/tenant-billing/detail/${record.id}`);
};

const isRenewVisible = ref(false);
const isTopupVisible = ref(false);
const topupForm = ref<any>({ target: 'shared', amount: 10_000 });

const handleRenew = () => {
  isRenewVisible.value = true;
};
const submitRenew = () => {
  isRenewVisible.value = false;
};

const handleTopup = (target?: string) => {
  topupForm.value = { target: target || 'shared', amount: 10_000 };
  isTopupVisible.value = true;
};
const submitTopup = () => {
  isTopupVisible.value = false;
};
</script>

<template>
  <div
    class="flex min-h-full w-full flex-col gap-6 bg-slate-50 p-4 md:p-6 dark:bg-slate-900"
  >
    <div class="flex flex-col gap-2">
      <h1 class="text-2xl font-bold text-slate-800 dark:text-slate-100">
        租户计费统计
      </h1>
      <div class="flex w-full items-center justify-between">
        <p class="text-sm text-slate-500">
          查看当前租户的数字员工使用情况与订阅包状态。
        </p>
        <Button type="primary" class="shadow-sm" @click="handleRenew">
          一键续费 (Renew)
        </Button>
      </div>
    </div>

    <!-- 资产看板区 -->
    <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
      <!-- 共享池 -->
      <Card
        title="通用共享点数池"
        :bordered="false"
        class="rounded-xl shadow-sm md:col-span-2"
      >
        <template #extra>
          <Button type="link" @click="handleTopup('shared')">购买加油包</Button>
        </template>
        <div class="flex items-center gap-6">
          <div class="flex-1">
            <div class="mb-2 flex justify-between">
              <span class="text-slate-500">剩余点数</span>
              <span class="text-lg font-bold text-primary"
                >850,200 / 1,000,000</span
              >
            </div>
            <Progress :percent="85" :stroke-width="12" stroke-color="#10b981" />
            <div class="mt-2 text-xs text-slate-400">
              当前套餐：Pro专业版 (到期时间：2026-05-24)
            </div>
          </div>
        </div>
      </Card>

      <!-- 独享池 -->
      <Card title="独享专属点数" :bordered="false" class="rounded-xl shadow-sm">
        <div class="flex flex-col gap-4">
          <div
            class="rounded-lg border border-slate-100 p-3 dark:border-slate-700"
          >
            <div class="mb-1 flex justify-between">
              <span class="font-medium">PPT专员</span>
              <Button
                type="link"
                size="small"
                class="h-auto p-0"
                @click="handleTopup('PPT')"
              >
                充值
              </Button>
            </div>
            <div class="mb-2 text-xs text-slate-500">标准版</div>
            <Progress :percent="20" size="small" stroke-color="#3b82f6" />
            <div class="mt-1 text-right text-xs">200 / 1,000</div>
          </div>
          <div
            class="rounded-lg border border-slate-100 p-3 dark:border-slate-700"
          >
            <div class="mb-1 flex justify-between">
              <span class="font-medium">短视频编导</span>
              <Button
                type="link"
                size="small"
                class="h-auto p-0"
                @click="handleTopup('Video')"
              >
                充值
              </Button>
            </div>
            <div class="mb-2 text-xs text-slate-500">专业版</div>
            <Progress
              :percent="90"
              size="small"
              status="exception"
              stroke-color="#ef4444"
            />
            <div class="mt-1 text-right text-xs font-semibold text-rose-500">
              180 / 200
            </div>
          </div>
        </div>
      </Card>
    </div>

    <!-- 统计控制与列表区 -->
    <div
      class="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
    >
      <div class="mb-6 flex items-center justify-between">
        <h2 class="text-lg font-semibold">员工调用统计</h2>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="text-sm text-slate-500">员工:</span>
            <Select
              v-model:value="selectedEmployee"
              show-search
              allow-clear
              placeholder="全部员工"
              :options="employeeOptions"
              class="w-48"
              :filter-option="filterOption"
            />
          </div>
          <div class="flex items-center">
            <RadioGroup v-model:value="timeRange" button-style="solid">
              <RadioButton value="month">本月</RadioButton>
              <RadioButton value="quarter">本季度</RadioButton>
              <RadioButton value="year">今年</RadioButton>
              <RadioButton value="custom">自定义</RadioButton>
            </RadioGroup>
            <RangePicker
              v-if="timeRange === 'custom'"
              v-model:value="customDateRange"
              class="ml-2 w-[240px]"
            />
          </div>
        </div>
      </div>

      <Table
        :columns="columns"
        :data-source="filteredEmployeeData"
        :pagination="{ pageSize: 20, showSizeChanger: true }"
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
          <template v-if="column.key === 'action'">
            <Button type="link" size="small" @click="handleViewDetail(record)">
              查看明细
            </Button>
          </template>
        </template>
        <template #summary>
          <TableSummary>
            <TableSummaryRow>
              <TableSummaryCell
                :index="0"
                :col-span="4"
                class="text-right font-bold"
              >
                总计
              </TableSummaryCell>
              <TableSummaryCell
                :index="4"
                class="text-right font-bold text-primary"
              >
                {{ totalCount.toLocaleString() }}
              </TableSummaryCell>
              <TableSummaryCell :index="5" />
              <TableSummaryCell :index="6" class="text-right font-bold">
                {{ totalToken.toLocaleString() }}
              </TableSummaryCell>
              <TableSummaryCell :index="7" />
            </TableSummaryRow>
          </TableSummary>
        </template>
      </Table>
    </div>

    <!-- 充值记录区 -->
    <div
      class="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
    >
      <div class="mb-6 flex items-center justify-between">
        <h2 class="text-lg font-semibold">充值记录</h2>
      </div>
      <Table
        :columns="rechargeColumns"
        :data-source="rechargeData"
        :pagination="{ pageSize: 5 }"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'package'">
            <Tag :color="getPkgColor(record.package)">{{ record.package }}</Tag>
          </template>
        </template>
      </Table>
    </div>

    <!-- 一键续费弹窗 -->
    <Modal
      v-model:open="isRenewVisible"
      title="一键续费订单确认"
      @ok="submitRenew"
      ok-text="确认支付"
      cancel-text="取消"
      width="600px"
    >
      <div class="mb-4 text-sm text-slate-500">
        系统已自动为您带出当前生效的所有订阅套餐，续费后有效期将顺延。
      </div>
      <div
        class="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:bg-slate-800"
      >
        <div
          class="flex items-center justify-between border-b border-slate-200 py-2 dark:border-slate-700"
        >
          <div>
            <div class="font-medium">通用共享包 - 专业版 (Pro)</div>
            <div class="mt-1 text-xs text-slate-500">包含 500,000 点/年</div>
          </div>
          <div class="font-semibold">¥ 3,998</div>
        </div>
        <div
          class="flex items-center justify-between border-b border-slate-200 py-2 dark:border-slate-700"
        >
          <div>
            <div class="font-medium">独享包 - PPT专员 - 标准版</div>
            <div class="mt-1 text-xs text-slate-500">包含 1,000 点/月</div>
          </div>
          <div class="font-semibold">¥ 499</div>
        </div>
        <div
          class="flex items-center justify-between border-b border-slate-200 py-2 dark:border-slate-700"
        >
          <div>
            <div class="font-medium">独享包 - 短视频编导 - 专业版</div>
            <div class="mt-1 text-xs text-slate-500">包含 200 点/月</div>
          </div>
          <div class="font-semibold">¥ 2,999</div>
        </div>
        <div class="mt-2 flex items-center justify-between py-4">
          <div class="text-lg font-bold">总计应付</div>
          <div class="text-2xl font-bold text-rose-500">¥ 7,496</div>
        </div>
      </div>
    </Modal>

    <!-- 增量包购买弹窗 -->
    <Modal
      v-model:open="isTopupVisible"
      title="购买临时加油包"
      @ok="submitTopup"
      ok-text="确认购买"
      cancel-text="取消"
      width="500px"
    >
      <div class="mb-4 text-sm text-slate-500">
        加油包仅增加可用点数额度，不改变当前套餐的到期时间。
      </div>
      <Form layout="vertical">
        <FormItem label="充值目标" required>
          <Select v-model:value="topupForm.target" disabled>
            <Select.Option value="shared">通用共享池</Select.Option>
            <Select.Option value="PPT">独享 - PPT专员</Select.Option>
            <Select.Option value="Video">独享 - 短视频编导</Select.Option>
          </Select>
        </FormItem>
        <FormItem label="选择加油包规格" required>
          <Select v-model:value="topupForm.amount">
            <Select.Option :value="10000">1万点 (¥ 120)</Select.Option>
            <Select.Option :value="50000">5万点 (¥ 500)</Select.Option>
          </Select>
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>
