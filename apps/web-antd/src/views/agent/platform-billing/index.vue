<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import {
  Button,
  Form,
  FormItem,
  Input,
  InputNumber,
  Modal,
  Progress,
  RadioButton,
  RadioGroup,
  RangePicker,
  Select,
  Table,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

const TableSummary = Table.Summary;
const TableSummaryRow = Table.Summary.Row;
const TableSummaryCell = Table.Summary.Cell;

const router = useRouter();
const timeRange = ref('month');
const customDateRange = ref<any>(null);
const selectedTenant = ref<null | string>(null);

const columns = [
  { title: '租户信息', dataIndex: 'tenant', key: 'tenant' },
  { title: '负责人', dataIndex: 'manager', key: 'manager' },
  { title: '当前订阅', dataIndex: 'packages', key: 'packages' },
  { title: '到期日期', dataIndex: 'expireDate', key: 'expireDate' },
  {
    title: '总体消耗情况',
    dataIndex: 'progress',
    key: 'progress',
    align: 'right',
  },
  { title: '消耗 Token', dataIndex: 'token', key: 'token', align: 'right' },
  { title: '操作', key: 'action', width: 200, align: 'center' },
];

const tenantData = ref([
  {
    key: '1',
    id: 'TEN-1001',
    name: '阿里巴巴集团(杭州)网络有限公司',
    manager: '张三 (13800000001)',
    packages: ['Pro', 'Max'],
    expireDate: dayjs().add(3, 'day').format('YYYY-MM-DD'),
    progress: 85,
    taskUsed: 42_500,
    taskTotal: 50_000,
    token: 1_250_000,
  },
  {
    key: '2',
    id: 'TEN-1002',
    name: '腾讯科技(深圳)有限公司',
    manager: '李四 (13900000002)',
    packages: ['Max'],
    expireDate: dayjs().add(20, 'day').format('YYYY-MM-DD'),
    progress: 42,
    taskUsed: 42_000,
    taskTotal: 100_000,
    token: 3_800_000,
  },
  {
    key: '3',
    id: 'TEN-1003',
    name: '字节跳动科技有限公司',
    manager: '王五 (13700000003)',
    packages: ['Lite', 'Pro'],
    expireDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
    progress: 95,
    taskUsed: 9500,
    taskTotal: 10_000,
    token: 485_000,
  },
  {
    key: '4',
    id: 'TEN-1004',
    name: '上海米哈游网络科技股份有限公司',
    manager: '赵六 (13600000004)',
    packages: ['Pro'],
    expireDate: dayjs().add(60, 'day').format('YYYY-MM-DD'),
    progress: 12,
    taskUsed: 1200,
    taskTotal: 10_000,
    token: 52_000,
  },
]);

const tenantOptions = computed(() => {
  return tenantData.value.map((t) => ({
    label: t.name,
    value: t.id,
  }));
});

const filteredTenantData = computed(() => {
  if (!selectedTenant.value) return tenantData.value;
  return tenantData.value.filter((t) => t.id === selectedTenant.value);
});

const isExpiringSoon = (dateStr: string) => {
  const daysDiff = dayjs(dateStr).diff(dayjs(), 'day');
  return daysDiff <= 5 && daysDiff >= 0;
};

const totalTaskUsed = computed(() => {
  return filteredTenantData.value.reduce(
    (sum, current) => sum + current.taskUsed,
    0,
  );
});

const totalTaskTotal = computed(() => {
  return filteredTenantData.value.reduce(
    (sum, current) => sum + current.taskTotal,
    0,
  );
});

const totalToken = computed(() => {
  return filteredTenantData.value.reduce(
    (sum, current) => sum + current.token,
    0,
  );
});

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

const handleViewDetail = (record: any) => {
  router.push(`/ai-employee/platform-billing/detail/${record.id}`);
};

const isProvisionVisible = ref(false);
const provisionForm = ref<any>({});
const isAdjustVisible = ref(false);
const adjustForm = ref<any>({});
const operatingTenant = ref<any>(null);

const openProvision = (record: any) => {
  operatingTenant.value = record;
  provisionForm.value = { shared: undefined, exclusive: [] };
  isProvisionVisible.value = true;
};

const handleProvisionOk = () => {
  isProvisionVisible.value = false;
};

const openAdjust = (record: any) => {
  operatingTenant.value = record;
  adjustForm.value = { target: 'shared', amount: 0, reason: '' };
  isAdjustVisible.value = true;
};

const handleAdjustOk = () => {
  isAdjustVisible.value = false;
};
</script>

<template>
  <div
    class="flex min-h-full w-full flex-col gap-6 bg-slate-50 p-4 md:p-6 dark:bg-slate-900"
  >
    <div class="flex flex-col gap-2">
      <h1 class="text-2xl font-bold text-slate-800 dark:text-slate-100">
        平台运营计费
      </h1>
      <p class="text-sm text-slate-500">
        全局总览各个租户的数字员工使用情况和包消耗进度。
      </p>
    </div>

    <!-- 全局概览区 -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
      <div
        class="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        <div class="mb-1 text-sm text-slate-500">活跃租户数</div>
        <div class="text-2xl font-bold text-slate-800 dark:text-slate-100">
          128
        </div>
      </div>
      <div
        class="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        <div class="mb-1 text-sm text-slate-500">总计调用次数 (月)</div>
        <div class="text-2xl font-bold text-slate-800 dark:text-slate-100">
          45,231
        </div>
      </div>
      <div
        class="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        <div class="mb-1 text-sm text-slate-500">系统 Token 消耗</div>
        <div class="text-2xl font-bold text-slate-800 dark:text-slate-100">
          1.2M
        </div>
      </div>
      <div
        class="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        <div class="mb-1 text-sm text-slate-500">员工总数</div>
        <div class="text-2xl font-bold text-slate-800 dark:text-slate-100">
          1,452
        </div>
      </div>
    </div>

    <!-- 租户列表区 -->
    <div
      class="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
    >
      <div class="mb-6 flex items-center justify-between">
        <h2 class="text-lg font-semibold">租户统计</h2>
        <div class="flex items-center">
          <Select
            v-model:value="selectedTenant"
            :options="tenantOptions"
            class="mr-4 w-[240px]"
            allow-clear
            placeholder="默认全选"
          />
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

      <Table
        :columns="columns"
        :data-source="filteredTenantData"
        :pagination="{ pageSize: 20, showSizeChanger: true }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'tenant'">
            <div class="flex flex-col">
              <span class="font-medium text-slate-700 dark:text-slate-200">{{
                record.name
              }}</span>
              <span class="text-xs text-slate-400">{{ record.id }}</span>
            </div>
          </template>
          <template v-if="column.key === 'packages'">
            <div class="flex gap-1">
              <Tag
                v-for="pkg in record.packages"
                :key="pkg"
                :color="getPkgColor(pkg)"
              >
                {{ pkg }}
              </Tag>
            </div>
          </template>
          <template v-if="column.key === 'expireDate'">
            <div class="flex items-center gap-1.5">
              <span
                :class="{
                  'font-semibold text-rose-500': isExpiringSoon(
                    record.expireDate,
                  ),
                }"
                >{{ record.expireDate }}</span
              >
              <Icon
                v-if="isExpiringSoon(record.expireDate)"
                icon="lucide:alert-circle"
                class="text-rose-500"
                title="即将到期"
              />
            </div>
          </template>
          <template v-if="column.key === 'progress'">
            <div class="flex flex-col items-end">
              <div class="mb-1 text-sm">
                <span class="font-semibold text-primary">{{
                  record.taskUsed.toLocaleString()
                }}</span>
                <span class="text-slate-500">
                  / {{ record.taskTotal.toLocaleString() }} 次</span
                >
              </div>
              <Progress
                :percent="record.progress"
                size="small"
                :status="record.progress > 90 ? 'exception' : 'active'"
                :show-info="false"
                class="m-0 max-w-[150px]"
              />
            </div>
          </template>
          <template v-if="column.key === 'token'">
            <span class="text-slate-600 dark:text-slate-300">{{
              record.token.toLocaleString()
            }}</span>
          </template>
          <template v-if="column.key === 'action'">
            <div class="flex items-center justify-center gap-1">
              <Button type="link" size="small" @click="openProvision(record)">
                开通
              </Button>
              <Button type="link" size="small" @click="openAdjust(record)">
                调账
              </Button>
              <Button
                type="link"
                size="small"
                @click="handleViewDetail(record)"
              >
                明细
              </Button>
            </div>
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
                {{ totalTaskUsed.toLocaleString() }} /
                {{ totalTaskTotal.toLocaleString() }} 次
              </TableSummaryCell>
              <TableSummaryCell :index="5" class="text-right font-bold">
                {{ totalToken.toLocaleString() }}
              </TableSummaryCell>
              <TableSummaryCell :index="6" />
            </TableSummaryRow>
          </TableSummary>
        </template>
      </Table>
    </div>

    <!-- 开通/分配弹窗 -->
    <Modal
      v-model:open="isProvisionVisible"
      title="一键开通与分配"
      @ok="handleProvisionOk"
      ok-text="确认开通"
      cancel-text="取消"
      width="500px"
    >
      <div class="mb-4 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
        <div>
          当前租户：<strong>{{ operatingTenant?.name }}</strong>
        </div>
      </div>
      <Form layout="vertical">
        <FormItem label="共享包套餐选择" required>
          <Select
            v-model:value="provisionForm.shared"
            placeholder="请选择共享包版本"
          >
            <Select.Option value="Std">通用共享包 - 基础版</Select.Option>
            <Select.Option value="Pro">通用共享包 - 专业版</Select.Option>
            <Select.Option value="Ultra">通用共享包 - 旗舰版</Select.Option>
          </Select>
        </FormItem>
        <FormItem label="独享包追加">
          <Select
            v-model:value="provisionForm.exclusive"
            mode="multiple"
            placeholder="可选：为特定员工追加独享包"
          >
            <Select.Option value="PPT_Std">
              PPT专员独享包 - 标准版
            </Select.Option>
            <Select.Option value="Video_Pro">
              视频生成专员独享包 - 专业版
            </Select.Option>
          </Select>
        </FormItem>
      </Form>
    </Modal>

    <!-- 手动调账弹窗 -->
    <Modal
      v-model:open="isAdjustVisible"
      title="手动调账"
      @ok="handleAdjustOk"
      ok-text="确认调整"
      cancel-text="取消"
      width="500px"
    >
      <div class="mb-4 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
        <div>
          当前租户：<strong>{{ operatingTenant?.name }}</strong>
        </div>
      </div>
      <Form layout="vertical">
        <FormItem label="调整目标" required>
          <Select v-model:value="adjustForm.target">
            <Select.Option value="shared">通用共享池</Select.Option>
            <Select.Option value="PPT">独享 - PPT专员</Select.Option>
          </Select>
        </FormItem>
        <FormItem label="增减点数 (正数增加，负数扣除)" required>
          <InputNumber v-model:value="adjustForm.amount" class="w-full" />
        </FormItem>
        <FormItem label="调整原因" required>
          <Input.TextArea
            v-model:value="adjustForm.reason"
            placeholder="如：客诉补偿、测试赠送等"
            :rows="3"
          />
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>
