<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import {
  Avatar,
  Button,
  message,
  Modal,
  Radio,
  RadioGroup,
  Table,
  Tag,
} from 'ant-design-vue';

const router = useRouter();

// ==========================
// Mock Data: 租户账户与套餐
// ==========================
const accountOverview = ref({
  packageVersion: 'pro1', // 'std', 'pro', 'ultra'
  expireDate: '2026-12-31',
  usedPoints: 6400,
});

const packageLevels = {
  std1: { name: 'Std 1.0', points: 3000, level: 1 },
  std2: { name: 'Std 2.0', points: 5000, level: 2 },
  pro1: { name: 'Pro 1.0', points: 8000, level: 3 },
  pro2: { name: 'Pro 2.0', points: 10_000, level: 4 },
  pro3: { name: 'Pro 3.0', points: 12_000, level: 5 },
  ultra1: { name: 'Ultra 1.0', points: 15_000, level: 6 },
};

const currentPackage = computed(
  () =>
    packageLevels[
      accountOverview.value.packageVersion as keyof typeof packageLevels
    ] || packageLevels.pro1,
);

const totalPoints = computed(() => currentPackage.value.points);

const remainingPoints = computed(
  () => totalPoints.value - accountOverview.value.usedPoints,
);
const usagePercent = computed(() =>
  Math.round((accountOverview.value.usedPoints / totalPoints.value) * 100),
);

// ==========================
// Mock Data: 所有员工使用统计
// ==========================
const employeesUsage = ref([
  // 计次消耗
  {
    id: 'EMP-001',
    name: '订单专员',
    avatar: '/auditdemo/images/ai-employee/sales.png',
    used: 2500,
    unit: '10/订单',
    price: 10,
    priceUnit: '点/订单',
    monthlyPoints: 5000,
    billingType: 'per-use',
    pendingBillingType: null as null | string,
  },
  {
    id: 'EMP-002',
    name: '收单专员',
    avatar: '/auditdemo/images/ai-employee/warehouse.png',
    used: 1800,
    unit: '15/订单',
    price: 15,
    priceUnit: '点/订单',
    monthlyPoints: 4000,
    billingType: 'per-use',
    pendingBillingType: null as null | string,
  },
  {
    id: 'EMP-003',
    name: '审核助理',
    avatar: '/auditdemo/images/ai-employee/技术员.jpg',
    used: 1200,
    unit: '20/单',
    price: 20,
    priceUnit: '点/单',
    monthlyPoints: 6000,
    billingType: 'per-use',
    pendingBillingType: null as null | string,
  },
  {
    id: 'EMP-004',
    name: '财务对账专员',
    avatar: '/auditdemo/images/ai-employee/财务.jpg',
    used: 1000,
    unit: '10/单',
    price: 10,
    priceUnit: '点/单',
    monthlyPoints: 3000,
    billingType: 'per-use',
    pendingBillingType: null as null | string,
  },
  // 包月消耗
  {
    id: 'EMP-005',
    name: 'AI问数',
    avatar: '/auditdemo/images/ai-employee/咨询人员.jpg',
    used: 650,
    unit: '1/次, 包月 99',
    price: 1,
    priceUnit: '点/次',
    monthlyPoints: 2500,
    billingType: 'monthly',
    pendingBillingType: null as null | string,
  },
  {
    id: 'EMP-006',
    name: '知识库问答',
    avatar: '/auditdemo/images/ai-employee/商务分析助手.jpg',
    used: 420,
    unit: '1/次, 包月 59',
    price: 1,
    priceUnit: '点/次',
    monthlyPoints: 1500,
    billingType: 'monthly',
    pendingBillingType: null as null | string,
  },
  {
    id: 'EMP-007',
    name: 'PPT专员',
    avatar: '/auditdemo/images/ai-employee/产品经理.jpg',
    used: 310,
    unit: '10/PPT, 包月 99',
    price: 10,
    priceUnit: '点/PPT',
    monthlyPoints: 2000,
    billingType: 'monthly',
    pendingBillingType: null as null | string,
  },
  {
    id: 'EMP-008',
    name: '商业分析专员',
    avatar: '/auditdemo/images/ai-employee/数据分析师.jpg',
    used: 120,
    unit: '10/次, 99包月',
    price: 10,
    priceUnit: '点/次',
    monthlyPoints: 3500,
    billingType: 'monthly',
    pendingBillingType: null as null | string,
  },
]);

// Sorted by usage
const rankedEmployees = computed(() => {
  // eslint-disable-next-line unicorn/no-array-sort
  return [...employeesUsage.value].sort((a, b) => b.used - a.used);
});

// Table Columns
const columns = [
  { title: '排名', key: 'rank', width: 80, align: 'center' },
  { title: '数字员工', key: 'employee', minWidth: 200 },
  { title: '计费模式', key: 'billingType', width: 120, align: 'center' },
  { title: '当月用量 (点)', dataIndex: 'used', key: 'used', align: 'right' },
  { title: '计费标准', dataIndex: 'unit', key: 'unit', align: 'center' },
  { title: '操作', key: 'action', align: 'center', width: 120 },
];

// ==========================
// Change Package Modal Logic
// ==========================
const upgradeModalVisible = ref(false);
const selectedPackage = ref(accountOverview.value.packageVersion);

const upgradePackages = [
  { key: 'std1', name: 'Std 1.0', points: '3,000 点' },
  { key: 'std2', name: 'Std 2.0', points: '5,000 点' },
  { key: 'pro1', name: 'Pro 1.0', points: '8,000 点' },
  { key: 'pro2', name: 'Pro 2.0', points: '10,000 点' },
  { key: 'pro3', name: 'Pro 3.0', points: '12,000 点' },
  { key: 'ultra1', name: 'Ultra 1.0', points: '15,000 点' },
];

const openUpgrade = () => {
  selectedPackage.value = accountOverview.value.packageVersion;
  upgradeModalVisible.value = true;
};

const isUpgrade = computed(() => {
  if (
    !selectedPackage.value ||
    selectedPackage.value === accountOverview.value.packageVersion
  )
    return null;
  const current =
    packageLevels[
      accountOverview.value.packageVersion as keyof typeof packageLevels
    ] || packageLevels.pro1;
  const target =
    packageLevels[selectedPackage.value as keyof typeof packageLevels];
  if (!current || !target) return null;
  return target.level > current.level;
});

const packageChangeTips = computed(() => {
  if (isUpgrade.value === null) return '';
  return isUpgrade.value
    ? '当前为升级操作，确认后将立即生效'
    : '当前为降级操作，确认后将于下月生效';
});

const handleUpgradeRequest = () => {
  if (selectedPackage.value === accountOverview.value.packageVersion) {
    message.warning('请选择不同的套餐');
    return;
  }

  const successMsg = isUpgrade.value
    ? `升级成功！新额度已立即生效`
    : `降级预约成功！将于次月 1 日切换至新套餐`;
  accountOverview.value.packageVersion = selectedPackage.value;
  upgradeModalVisible.value = false;
  message.success(successMsg);
};

const goToDetail = (record: any) => {
  router.push({
    name: 'TenantBillDetail',
    query: { id: record.id, name: record.name },
  });
};

const getStatusColor = (percent: number) => {
  if (percent >= 90) return '#f43f5e'; // red
  if (percent >= 80) return '#f97316'; // orange (warning)
  if (percent >= 60) return '#eab308'; // yellow
  return '#10b981'; // green
};
</script>

<template>
  <div
    class="relative flex min-h-full w-full flex-col gap-6 bg-slate-50/50 p-4 md:p-6 dark:bg-slate-900/50"
  >
    <!-- Header Banner: Refined Light Aesthetic -->
    <div
      class="relative overflow-hidden rounded-[2.5rem] border border-blue-100/50 bg-[#f8fbff] p-8 shadow-[0_20px_50px_-12px_rgba(186,210,243,0.3)] dark:border-slate-800 dark:bg-slate-900"
    >
      <!-- Subtle Digital Grid Pattern -->
      <div
        class="pointer-events-none absolute inset-0 opacity-[0.03]"
        style="
          background-image: radial-gradient(#1e40af 0.5px, transparent 0.5px);
          background-size: 24px 24px;
        "
      ></div>

      <!-- Soft Gradient Mesh Overlays -->
      <div
        class="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-blue-100/40 blur-[100px] dark:bg-blue-900/20"
      ></div>
      <div
        class="pointer-events-none absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-indigo-50/50 blur-[100px] dark:bg-indigo-900/10"
      ></div>

      <div class="relative z-10">
        <div class="mb-8 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <h1
              class="m-0 text-3xl font-black tracking-tight text-slate-900 drop-shadow-sm dark:text-white"
            >
              {{ currentPackage.name }}
            </h1>
            <Tag
              class="flex items-center gap-1 border-0 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-600 backdrop-blur-md dark:bg-emerald-500/20 dark:text-emerald-400"
            >
              <Icon icon="lucide:check-circle" />
              当前生效
            </Tag>
          </div>
          <div class="flex items-center gap-2 text-slate-400">
            <Icon icon="lucide:shield-check" class="text-xl text-blue-500/50" />
            <span class="text-sm font-bold tracking-wider"
              >企业级安全防护已开启</span
            >
          </div>
        </div>

        <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
          <!-- Stats Section: Spans 2 positions -->
          <div class="md:col-span-2">
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <!-- Package Quota -->
              <div
                class="group flex flex-col gap-2 rounded-3xl border border-blue-50 bg-white/60 p-5 shadow-sm backdrop-blur-sm transition-all hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-800/40"
              >
                <span
                  class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400"
                  >套餐额度</span
                >
                <div class="flex items-baseline gap-1">
                  <span
                    class="font-mono text-3xl font-black text-slate-900 dark:text-white"
                  >
                    {{ totalPoints.toLocaleString() }}
                  </span>
                  <span class="text-xs font-bold text-slate-400">点</span>
                </div>
              </div>

              <!-- Consumption -->
              <div
                class="group flex flex-col gap-2 rounded-3xl border border-blue-50 bg-white/60 p-5 shadow-sm backdrop-blur-sm transition-all hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-800/40"
              >
                <div class="flex items-center justify-between">
                  <span
                    class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400"
                    >消耗情况</span
                  >
                  <span
                    class="font-mono text-sm font-black"
                    :style="{ color: getStatusColor(usagePercent) }"
                    >{{ usagePercent }}%</span
                  >
                </div>
                <div
                  class="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700"
                >
                  <div
                    class="h-full transition-all duration-700 ease-out"
                    :style="{
                      width: `${usagePercent}%`,
                      backgroundColor: getStatusColor(usagePercent),
                    }"
                  ></div>
                </div>
                <div
                  class="mt-1 flex justify-between text-[8px] font-bold text-slate-400"
                >
                  <span
                    >已用:
                    {{ accountOverview.usedPoints.toLocaleString() }}</span
                  >
                  <span>剩余: {{ remainingPoints.toLocaleString() }}</span>
                </div>
              </div>

              <!-- Expiry Date -->
              <div
                class="group flex flex-col gap-2 rounded-3xl border border-blue-50 bg-white/60 p-5 shadow-sm backdrop-blur-sm transition-all hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-800/40"
              >
                <span
                  class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400"
                  >到期日期</span
                >
                <div class="flex items-center gap-2">
                  <Icon icon="lucide:calendar" class="text-blue-500/40" />
                  <span
                    class="font-mono text-xl font-black text-slate-900 dark:text-white"
                  >
                    {{ accountOverview.expireDate }}
                  </span>
                </div>
              </div>
            </div>

            <div class="mt-8 flex items-center">
              <Button
                type="primary"
                class="group h-12 rounded-xl border-0 bg-blue-600 px-8 text-base font-black text-white shadow-lg shadow-blue-200 transition-all hover:scale-[1.02] hover:bg-blue-700 active:scale-95 dark:shadow-none"
                @click="openUpgrade"
              >
                <template #icon>
                  <Icon
                    icon="lucide:refresh-cw"
                    class="text-lg transition-transform group-hover:rotate-180"
                  />
                </template>
                变更套餐
              </Button>
            </div>
          </div>

          <!-- Decorative/Secondary Info Column -->
          <div class="hidden items-center justify-center md:flex">
            <div class="relative">
              <div
                class="absolute inset-0 animate-pulse rounded-full bg-blue-100/50 blur-3xl dark:bg-blue-900/30"
              ></div>
              <Icon
                icon="lucide:rocket"
                class="relative text-[120px] text-blue-500/10 dark:text-white/5"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Ranking Table Section -->
    <div
      class="mt-2 overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800"
    >
      <div
        class="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6 dark:border-slate-700 dark:bg-slate-900/30"
      >
        <div class="flex items-center gap-4">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none"
          >
            <Icon icon="lucide:users" class="text-xl" />
          </div>
          <div>
            <h2
              class="m-0 text-xl font-black text-slate-800 dark:text-slate-100"
            >
              数字员工消耗排名
            </h2>
            <p class="m-0 mt-0.5 text-xs font-semibold text-slate-400">
              基于当前计费周期的实时用量统计
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2 text-xs font-bold text-slate-400">
          <Icon icon="lucide:clock" />
          数据更新于: {{ new Date().toLocaleTimeString() }}
        </div>
      </div>

      <div class="p-2">
        <Table
          :data-source="rankedEmployees"
          :columns="columns"
          :pagination="false"
          class="modern-table"
        >
          <template #bodyCell="{ column, record, index }">
            <!-- Rank -->
            <template v-if="column.key === 'rank'">
              <div
                class="flex h-8 w-8 items-center justify-center rounded-xl font-mono text-sm font-black"
                :class="[
                  index === 0
                    ? 'bg-amber-100 text-amber-600'
                    : index === 1
                      ? 'bg-slate-100 text-slate-500'
                      : index === 2
                        ? 'bg-orange-50 text-orange-500'
                        : 'bg-transparent text-slate-400',
                ]"
              >
                {{ index + 1 }}
              </div>
            </template>

            <!-- Employee Info -->
            <template v-if="column.key === 'employee'">
              <div class="flex items-center gap-4 py-2">
                <div class="relative">
                  <Avatar
                    :src="record.avatar"
                    :size="48"
                    class="border-2 border-white bg-slate-100 shadow-md ring-1 ring-slate-100 dark:ring-slate-700"
                  />
                  <div
                    v-if="index === 0"
                    class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] text-white ring-2 ring-white"
                  >
                    <Icon icon="lucide:crown" />
                  </div>
                </div>
                <div class="flex flex-col">
                  <span
                    class="text-sm font-black text-slate-800 dark:text-slate-100"
                  >
                    {{ record.name }}
                  </span>
                  <span
                    class="mt-0.5 font-mono text-[10px] tracking-wider text-slate-400"
                  >
                    ID: {{ record.id }}
                  </span>
                </div>
              </div>
            </template>

            <!-- Billing Type -->
            <template v-if="column.key === 'billingType'">
              <div class="flex flex-col items-center gap-1">
                <Tag
                  v-if="record.billingType === 'per-use'"
                  color="blue"
                  class="m-0 border-0 bg-blue-50 px-3 py-1 text-[10px] font-black text-blue-600"
                >
                  计次消耗
                </Tag>
                <Tag
                  v-else
                  color="purple"
                  class="m-0 border-0 bg-purple-50 px-3 py-1 text-[10px] font-black text-purple-600"
                >
                  包月消耗
                </Tag>
                <Tag
                  v-if="record.pendingBillingType"
                  color="orange"
                  class="m-0 mt-1 origin-top scale-90 transform border-0 bg-orange-50 px-2 py-0.5 text-[9px] font-black text-orange-500"
                >
                  <Icon
                    icon="lucide:clock"
                    class="mr-0.5 inline-block align-text-bottom"
                  />
                  次月:{{
                    record.pendingBillingType === 'per-use' ? '计次' : '包月'
                  }}
                </Tag>
              </div>
            </template>

            <!-- Usage -->
            <template v-if="column.key === 'used'">
              <div class="flex flex-col items-end gap-1">
                <span
                  class="font-mono text-lg font-black text-slate-800 dark:text-slate-100"
                >
                  {{ record.used.toLocaleString() }}
                </span>
              </div>
            </template>

            <!-- Unit -->
            <template v-if="column.key === 'unit'">
              <span class="text-xs font-bold text-slate-500">{{
                record.unit
              }}</span>
            </template>

            <!-- Action -->
            <template v-if="column.key === 'action'">
              <Button
                type="text"
                class="flex items-center gap-1 text-xs font-black text-blue-600 hover:bg-blue-50"
                @click="goToDetail(record)"
              >
                查看明细
                <Icon icon="lucide:chevron-right" />
              </Button>
            </template>
          </template>
        </Table>
      </div>
    </div>

    <!-- ========================== -->
    <!-- Modal: Package Change -->
    <!-- ========================== -->
    <Modal
      v-model:open="upgradeModalVisible"
      title="变更套餐"
      width="800"
      :footer="null"
      centered
      class="upgrade-modal"
    >
      <div class="p-2 sm:p-4">
        <div class="mb-6 text-center">
          <h2 class="mb-1 text-xl font-black text-slate-800 dark:text-white">
            业务规模灵活调整
          </h2>
          <p class="text-xs text-slate-500">
            按需选择最适合您当前阶段的算力套餐
          </p>
        </div>

        <RadioGroup v-model:value="selectedPackage" class="w-full">
          <div class="grid grid-cols-2 gap-3 md:grid-cols-3">
            <label
              v-for="pkg in upgradePackages"
              :key="pkg.key"
              class="relative cursor-pointer"
            >
              <Radio
                :value="pkg.key"
                class="absolute right-3 top-3 z-10 scale-75"
              />
              <div
                class="flex h-full flex-col items-center rounded-2xl border-2 p-4 text-center transition-all"
                :class="[
                  selectedPackage === pkg.key
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20'
                    : 'border-slate-50 bg-white hover:border-slate-200 dark:border-slate-800 dark:bg-slate-800/40',
                ]"
              >
                <div
                  class="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white"
                  :class="{ 'opacity-30': selectedPackage !== pkg.key }"
                >
                  <Icon
                    :icon="
                      pkg.key.startsWith('std')
                        ? 'lucide:award'
                        : pkg.key.startsWith('pro')
                          ? 'lucide:zap'
                          : 'lucide:crown'
                    "
                    class="text-xl"
                  />
                </div>
                <h4
                  class="mb-1 text-xs font-black text-slate-800 dark:text-white"
                >
                  {{ pkg.name }}
                </h4>
                <div class="mb-1">
                  <div class="text-base font-black text-blue-600">
                    {{ pkg.points }}
                  </div>
                </div>
              </div>
            </label>
          </div>
        </RadioGroup>

        <div v-if="packageChangeTips" class="mt-6 flex justify-center">
          <Tag
            :color="isUpgrade ? 'success' : 'error'"
            class="border-0 px-4 py-1 text-xs font-bold"
          >
            <Icon
              :icon="isUpgrade ? 'lucide:trending-up' : 'lucide:trending-down'"
              class="mr-1"
            />
            {{ packageChangeTips }}
          </Tag>
        </div>

        <div class="mt-8 flex flex-col items-center gap-4">
          <Button
            type="primary"
            size="large"
            block
            class="h-14 rounded-2xl border-0 bg-blue-600 text-lg font-black shadow-xl shadow-blue-200 dark:shadow-none"
            @click="handleUpgradeRequest"
          >
            确认变更
          </Button>
          <span class="text-xs font-bold text-slate-400">
            * 变更套餐后，相关额度与计费将按生效规则自动调整
          </span>
        </div>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
/* Custom Progress Bar Styling */
.custom-progress :deep(.ant-progress-inner) {
  background-color: #f1f5f9;
}

.dark .custom-progress :deep(.ant-progress-inner) {
  background-color: #1e293b;
}

/* Modern Table Styling */
.modern-table :deep(.ant-table) {
  background: transparent;
}

.modern-table :deep(.ant-table-thead > tr > th) {
  font-size: 11px;
  font-weight: 800;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  background: transparent;
  border-bottom: 1px solid #f1f5f9;
}

.dark .modern-table :deep(.ant-table-thead > tr > th) {
  border-bottom-color: #334155;
}

.modern-table :deep(.ant-table-tbody > tr > td) {
  border-bottom: 1px solid #f8fafc;
}

.dark .modern-table :deep(.ant-table-tbody > tr > td) {
  border-bottom-color: #1e293b;
}

.modern-table :deep(.ant-table-tbody > tr:hover > td) {
  background: #f8fafc !important;
}

.dark .modern-table :deep(.ant-table-tbody > tr:hover > td) {
  background: #1e293b !important;
}

/* Modal Styling */
.upgrade-modal :deep(.ant-modal-content) {
  overflow: hidden;
  border-radius: 2rem;
}

.upgrade-modal :deep(.ant-modal-header) {
  display: none;
}
</style>
