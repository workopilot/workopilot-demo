<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import {
  Button,
  DatePicker,
  Drawer,
  Input,
  InputNumber,
  message,
  Modal,
  Progress,
  Select,
  Steps,
  Switch,
  Table,
  Tag,
} from 'ant-design-vue';
import dayjs, { Dayjs } from 'dayjs';

// ==========================
// Mock Data: 租户列表与状态
// ==========================
const tenants = ref([
  {
    key: '1',
    name: 'A公司 (科技电商)',
    sharedVersion: 'Pro',
    perUseCount: 5,
    monthlyCount: 2,
    totalPoints: 100_000,
    usedPoints: 85_000, // 85% - warning < 20% left
    expireDate: dayjs().add(1, 'month').format('YYYY-MM-DD'),
    autoRenew: true,
  },
  {
    key: '2',
    name: 'B公司 (出海营销)',
    sharedVersion: 'Ultra',
    perUseCount: 12,
    monthlyCount: 4,
    totalPoints: 2_000_000,
    usedPoints: 500_000, // 25% - safe
    expireDate: dayjs().add(6, 'month').format('YYYY-MM-DD'),
    autoRenew: false,
  },
  {
    key: '3',
    name: 'C公司 (在线教育)',
    sharedVersion: 'Std',
    perUseCount: 2,
    monthlyCount: 0,
    totalPoints: 50_000,
    usedPoints: 48_000, // 96% - danger! < 20% left
    expireDate: dayjs().add(15, 'day').format('YYYY-MM-DD'),
    autoRenew: true,
  },
]);

// ==========================
// Main Table Columns
// ==========================
const columns = [
  { title: '序号', key: 'index', width: 60, align: 'center' },
  { title: '租户名称', dataIndex: 'name', key: 'name' },
  {
    title: '共享包配置',
    dataIndex: 'sharedVersion',
    key: 'sharedVersion',
    align: 'center',
  },
  {
    title: '计次',
    dataIndex: 'perUseCount',
    key: 'perUseCount',
    align: 'center',
  },
  {
    title: '包月',
    dataIndex: 'monthlyCount',
    key: 'monthlyCount',
    align: 'center',
  },
  {
    title: '点数消耗监控 (本月)',
    dataIndex: 'consumption',
    key: 'consumption',
    width: 250,
  },
  {
    title: '当前套餐到期日',
    dataIndex: 'expireDate',
    key: 'expireDate',
    align: 'center',
  },
  { title: '操作与管理', key: 'action', align: 'center', width: 330 },
];

// ==========================
// Drawer State
// ==========================
const configDrawerVisible = ref(false);
const detailDrawerVisible = ref(false);
const currentTenant = ref<any>(null);
const currentStep = ref(0);
const router = useRouter();

const goToBillingDetails = (record: any) => {
  router.push(
    `/ai-employee/platform-tenant-package/billing-details/${record.key}`,
  );
};
const addSharedEmpVisible = ref(false);
const addExclusiveEmpVisible = ref(false);
const isNewTenant = ref(false);

const unassignedTenants = ref([
  { id: 'T004', name: 'D公司 (跨境电商)' },
  { id: 'T005', name: 'E公司 (本地生活)' },
  { id: 'T006', name: 'F公司 (新媒体运营)' },
]);

const packageDateRange = ref<[Dayjs, Dayjs]>([
  dayjs(),
  dayjs().add(1, 'month'),
]);
const packageStartDate = ref<Dayjs>(dayjs());
const editCycleChoice = ref('current');
const packageAutoRenew = ref(true);

const derivedEndDate = computed(() => {
  return packageStartDate.value
    ? packageStartDate.value.add(1, 'month').format('YYYY-MM-DD')
    : '-';
});

watch(editCycleChoice, (val) => {
  if (currentTenant.value?.expireDate) {
    if (val === 'current') {
      packageDateRange.value = [dayjs(), dayjs(currentTenant.value.expireDate)];
    } else {
      const expire = dayjs(currentTenant.value.expireDate);
      packageDateRange.value = [expire, expire.add(1, 'month')];
    }
  }
});

const packageVersion = ref('Std');
const giftPoints = ref(0);
const selectedPackageEmployees = ref<any[]>([]);

const packagePoints = computed(() => {
  if (packageVersion.value === 'Std') return 50_000;
  if (packageVersion.value === 'Pro') return 100_000;
  if (packageVersion.value === 'Ultra') return 500_000;
  return 0;
});

const openConfig = (record: any) => {
  isNewTenant.value = false;
  currentTenant.value = { ...record };
  editCycleChoice.value = 'current';
  packageDateRange.value = [dayjs(), dayjs(record.expireDate)];
  packageAutoRenew.value = record.autoRenew;
  packageVersion.value = record.sharedVersion || 'Std';
  giftPoints.value = 0;
  selectedPackageEmployees.value = [];
  currentStep.value = 0;
  configDrawerVisible.value = true;
};

const openDetail = (record: any) => {
  currentTenant.value = record;
  detailDrawerVisible.value = true;
};

const openNewTenantConfig = () => {
  isNewTenant.value = true;
  currentTenant.value = {
    name: undefined,
    sharedVersion: 'Std',
    sharedCount: 0,
    exclusiveCount: 0,
    totalPoints: 0,
    usedPoints: 0,
  };
  packageStartDate.value = dayjs();
  packageAutoRenew.value = true;
  packageVersion.value = 'Std';
  giftPoints.value = 0;
  selectedPackageEmployees.value = [];
  currentStep.value = 0;
  configDrawerVisible.value = true;
};

// ==========================
// Renew Quota State
// ==========================
const renewModalVisible = ref(false);
const currentRenewTenant = ref<any>(null);
const renewDuration = ref(1);

const openRenew = (record: any) => {
  currentRenewTenant.value = record;
  renewDuration.value = 1;
  renewModalVisible.value = true;
};

// ==========================
// Temp Quota State
// ==========================
const tempQuotaModalVisible = ref(false);
const currentTempTenant = ref<any>(null);
const tempSharedPoints = ref<null | number>(null);
const tempSharedExpireDate = ref<any>(null);
const exclusiveTempEmployees = ref<any[]>([]);

const openTempQuota = (record: any) => {
  currentTempTenant.value = record;
  tempSharedPoints.value = null;
  tempSharedExpireDate.value = dayjs().add(1, 'month');
  exclusiveTempEmployees.value = [];
  tempQuotaModalVisible.value = true;
};

// ==========================
// Monitor Mock Data
// ==========================
const monitorActiveKeys = ref<string[]>(['exclusive']);

const togglePanel = (key: string) => {
  if (monitorActiveKeys.value.includes(key)) {
    monitorActiveKeys.value = monitorActiveKeys.value.filter((k) => k !== key);
  } else {
    monitorActiveKeys.value.push(key);
  }
};
const isPanelOpen = (key: string) => monitorActiveKeys.value.includes(key);

const activeSharedEmployees = computed(() =>
  sharedEmployees.value.filter((e) => e.active),
);

const exclusiveMonitorEmployees = computed(() => {
  return exclusiveEmployees.value.map((e) => {
    const used = Math.floor(e.points * 0.65); // Mock 65% usage
    return {
      ...e,
      used,
      remain: e.points - used,
      avatar:
        allEmployees.value.find((a) => a.name === e.name)?.avatar ||
        '/auditdemo/images/ai-employee/sales.png',
    };
  });
});

const exclusiveMonitorColumns = [
  { title: '数字员工', key: 'employee', width: 180 },
  { title: '上限数(点)', dataIndex: 'points', align: 'right' },
  { title: '已使用(点)', key: 'used', align: 'right' },
  { title: '余量(点)', key: 'remain', align: 'right' },
  { title: '单价单位', dataIndex: 'unit', align: 'right' },
];

const sharedMonitorEmployees = computed(() => {
  return activeSharedEmployees.value.map((e) => ({
    ...e,
    used: Math.floor(Math.random() * 500) + 100,
    avatar:
      allEmployees.value.find((a) => a.name === e.name)?.avatar ||
      '/auditdemo/images/ai-employee/sales.png',
  }));
});

const sharedMonitorColumns = [
  { title: '数字员工', key: 'employee', width: 180 },
  { title: '已使用(次数)', key: 'used', align: 'right' },
  { title: '单价单位', key: 'unit', align: 'right' },
];

const rankedEmployees = computed(() => {
  // 模拟当前租户下的所有员工使用数据排行
  return allEmployees.value
    .map((emp, index) => ({
      ...emp,
      chargeMode: index % 2 === 0 ? 'per-use' : 'monthly',
      used: Math.floor(Math.random() * 5000) + (index === 0 ? 8000 : 100), // 确保有一个高分的
    }))
    .sort((a, b) => b.used - a.used);
});

// ==========================
// Mock Data: 配置抽屉中的套餐逻辑
// ==========================
const sharedEnabled = ref(true);
const selectedSharedVersion = ref('Pro');

const sharedEmployees = ref([
  { id: '1', name: '全能问答助手', active: true, price: 1, unit: '次/交互' },
  { id: '2', name: '数据报表生成器', active: true, price: 5, unit: '份/报表' },
  { id: '3', name: '文案优化大师', active: false, price: 2, unit: '千字' },
  { id: '4', name: '竞品监控蜘蛛', active: true, price: 10, unit: '次/采集' },
]);

const exclusiveEmployees = ref([
  {
    id: '1',
    name: 'PPT自动生成专员',
    version: 'Pro',
    points: 1000,
    unit: '5/PPT',
  },
  {
    id: '2',
    name: '订单专员',
    version: 'Ultra',
    points: 2000,
    unit: '10/订单',
  },
]);

const handleExclusiveVersionChange = (record: any) => {
  if (record.version === 'Std') record.points = 500;
  else if (record.version === 'Pro') record.points = 1000;
  else record.points = 2000;
};

// ==========================
// Standardized Employee Selection
// ==========================
const employeeSearchKey = ref('');
const selectedEmployeeKeys = ref<string[]>([]);
const employeeSelectionVisible = ref(false);
const currentSelectionMode = ref<
  'exclusive' | 'exclusiveTemp' | 'package' | 'shared'
>('shared');

const openEmployeeSelection = (
  mode: 'exclusive' | 'exclusiveTemp' | 'package' | 'shared',
) => {
  currentSelectionMode.value = mode;
  selectedEmployeeKeys.value = [];
  employeeSearchKey.value = '';
  employeeSelectionVisible.value = true;
};

const allEmployees = ref([
  {
    id: 'EMP-012',
    name: 'PPT自动生成专员',
    avatar: '/auditdemo/images/ai-employee/产品经理.jpg',
    desc: '根据大纲自动生成精美的演示文稿。',
    price: 5,
    unit: '点/PPT',
  },
  {
    id: 'EMP-015',
    name: '订单专员',
    avatar: '/auditdemo/images/ai-employee/sales.png',
    desc: '处理海量订单流入与状态追踪。',
    price: 10,
    unit: '点/订单',
  },
  {
    id: 'EMP-022',
    name: '财务对账专员',
    avatar: '/auditdemo/images/ai-employee/财务.jpg',
    desc: '自动化核对流水账单与对账单。',
    price: 10,
    unit: '点/单',
  },
  {
    id: 'EMP-025',
    name: '数据分析师',
    avatar: '/auditdemo/images/ai-employee/数据分析师.jpg',
    desc: '自动化分析报表数据并出具总结。',
    price: 15,
    unit: '点/报表',
  },
  {
    id: 'EMP-033',
    name: '全能问答助手',
    avatar: '/auditdemo/images/ai-employee/咨询人员.jpg',
    desc: '支持多领域的全能对话智能体。',
    price: 1,
    unit: '点/交互',
  },
  {
    id: 'EMP-041',
    name: '文案优化大师',
    avatar: '/auditdemo/images/ai-employee/设计师.jpg',
    desc: '商业文案与新媒体软文润色大师。',
    price: 2,
    unit: '点/千字',
  },
]);

const employeeSelectionColumns = [
  { title: '数字员工', key: 'employee', width: 220 },
  { title: '功能简介', dataIndex: 'desc', key: 'desc' },
  { title: '默认单价', key: 'price', align: 'center', width: 100 },
  {
    title: '计费单位',
    dataIndex: 'unit',
    key: 'unit',
    align: 'center',
    width: 100,
  },
];

const handleAddEmployees = () => {
  const selected = allEmployees.value.filter((e) =>
    selectedEmployeeKeys.value.includes(e.id),
  );
  switch (currentSelectionMode.value) {
    case 'exclusive': {
      selected.forEach((emp) => {
        if (!exclusiveEmployees.value.find((e) => e.id === emp.id)) {
          exclusiveEmployees.value.push({
            id: emp.id,
            name: emp.name,
            version: 'Std',
            points: 500,
            unit: emp.unit,
          });
        }
      });

      break;
    }
    case 'exclusiveTemp': {
      selected.forEach((emp) => {
        if (!exclusiveTempEmployees.value.find((e) => e.id === emp.id)) {
          exclusiveTempEmployees.value.push({
            id: emp.id,
            name: emp.name,
            points: 1000,
            expireDate: dayjs().add(1, 'month'),
          });
        }
      });

      break;
    }
    case 'package': {
      selected.forEach((emp) => {
        if (!selectedPackageEmployees.value.find((e) => e.id === emp.id)) {
          selectedPackageEmployees.value.push({
            id: emp.id,
            name: emp.name,
            avatar: emp.avatar,
            chargeMode: 'per-use',
            price: emp.price,
            unit: emp.unit,
            monthlyPoints: emp.price * 100,
            oneTimePoints: emp.price * 50,
            maxLimit: 0,
          });
        }
      });
      break;
    }
    case 'shared': {
      selected.forEach((emp) => {
        if (!sharedEmployees.value.find((e) => e.id === emp.id)) {
          sharedEmployees.value.push({
            id: emp.id,
            name: emp.name,
            active: true,
            price: emp.price,
            unit: emp.unit,
          });
        }
      });

      break;
    }
    // No default
  }
  employeeSelectionVisible.value = false;
  message.success(`已成功添加 ${selected.length} 个数字员工`);
};

const installPipeline = ref([
  { id: '1', name: '全能问答助手', type: '共享', status: 'installed' },
  { id: '2', name: '数据报表生成器', type: '共享', status: 'installed' },
  { id: '3', name: '竞品监控蜘蛛', type: '共享', status: 'uninstalled' },
  {
    id: '4',
    name: 'PPT自动生成专员',
    type: '独享 (Pro)',
    status: 'uninstalled',
  },
  {
    id: '5',
    name: '订单专员',
    type: '独享 (Ultra)',
    status: 'uninstalled',
  },
]);

// Actions
const installAll = () => {
  message.success('已触发批量安装指令，正在后台部署至租户工作空间...');
  installPipeline.value.forEach((item) => (item.status = 'installed'));
};

const installSingle = (record: any) => {
  message.success(`已向租户空间推送安装指令: ${record.name}`);
  record.status = 'installed';
};

const checkStatus = () => {
  message.loading('正在巡检租户工作空间...');
  setTimeout(() => {
    message.success('状态核对完成，无漂移');
  }, 1000);
};

// Utils
const getPercent = (used: number, total: number) =>
  Math.round((used / total) * 100);
const getStatusColor = (percent: number) => {
  if (percent >= 80) return '#f43f5e'; // Danger (<20% left)
  if (percent >= 60) return '#eab308'; // Warning
  return '#10b981'; // Safe
};
</script>

<template>
  <div
    class="relative flex min-h-full w-full flex-col gap-6 bg-slate-50/50 p-4 md:p-6 dark:bg-slate-900/50"
  >
    <!-- Hero Header -->
    <div
      class="relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-900 p-5 text-white shadow-xl dark:from-slate-900 dark:to-black"
    >
      <!-- Glow Effects -->
      <div
        class="pointer-events-none absolute right-1/4 top-0 h-64 w-64 rounded-full bg-blue-500/20 blur-[80px]"
      ></div>
      <div
        class="pointer-events-none absolute bottom-0 left-10 h-48 w-48 rounded-full bg-purple-500/20 blur-[60px]"
      ></div>

      <div class="relative z-10 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/10 shadow-inner backdrop-blur-md"
          >
            <Icon icon="lucide:boxes" class="text-2xl text-blue-400" />
          </div>
          <div>
            <h1
              class="m-0 flex items-center gap-3 text-2xl font-black tracking-tight text-white drop-shadow-sm"
            >
              租户套餐综合管理
              <Tag
                color="blue"
                class="mt-0.5 rounded-md border-0 bg-blue-500/20 px-2 py-0.5 text-xs font-bold text-blue-300"
              >
                运营大盘
              </Tag>
            </h1>
            <p
              class="m-0 mt-1 max-w-2xl text-sm font-medium tracking-wide text-slate-300"
            >
              集中管控租户的共享与独享资源，实时监测额度消耗水位与员工部署健康度。
            </p>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="hidden gap-6 lg:flex">
          <div class="flex flex-col items-end">
            <span
              class="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400"
              >告警租户 (< 20%)</span
            >
            <span
              class="flex items-baseline gap-1 text-2xl font-black text-rose-400"
              >2
              <span class="text-xs font-medium text-slate-500">家</span></span
            >
          </div>
          <div class="w-px bg-slate-700"></div>
          <div class="flex flex-col items-end">
            <span
              class="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400"
              >待安装员工</span
            >
            <span
              class="flex items-baseline gap-1 text-2xl font-black text-amber-400"
              >3
              <span class="text-xs font-medium text-slate-500">个</span></span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Main Table Card -->
    <div
      class="w-full rounded-3xl border border-slate-200/60 bg-white/70 p-3 shadow-xl backdrop-blur-xl transition-all dark:border-slate-700/50 dark:bg-slate-900/60"
    >
      <div
        class="mb-5 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row dark:border-slate-700 dark:bg-slate-800"
      >
        <div class="flex w-full items-center gap-3 sm:w-auto">
          <Input.Search
            placeholder="搜索租户名称..."
            size="large"
            class="max-w-[300px]"
          />
        </div>
        <div class="flex items-center gap-3">
          <Button>导出报表</Button>
          <Button
            type="primary"
            class="border-0 bg-indigo-600 hover:bg-indigo-700"
            @click="openNewTenantConfig"
          >
            <template #icon><Icon icon="lucide:user-plus" /></template>
            新增租户套餐
          </Button>
        </div>
      </div>

      <div
        class="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        <Table
          :columns="columns"
          :data-source="tenants"
          :pagination="{ pageSize: 10, showSizeChanger: true }"
          class="custom-table"
          :row-class-name="
            () =>
              'hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors'
          "
        >
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'index'">
              <span class="font-medium text-slate-400">{{ index + 1 }}</span>
            </template>
            <template v-if="column.key === 'name'">
              <span class="font-bold text-slate-800 dark:text-slate-100">{{
                record.name
              }}</span>
            </template>

            <template v-if="column.key === 'sharedVersion'">
              <div
                class="inline-flex items-center justify-center rounded-md border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider shadow-sm"
                :class="{
                  'border-slate-200 bg-slate-50 text-slate-600':
                    record.sharedVersion === 'Std',
                  'border-indigo-200 bg-indigo-50 text-indigo-700':
                    record.sharedVersion === 'Pro',
                  'border-amber-200 bg-amber-50 text-amber-700':
                    record.sharedVersion === 'Ultra',
                }"
              >
                {{ record.sharedVersion }}
              </div>
            </template>

            <template v-if="column.key === 'perUseCount'">
              <Tag color="blue" class="m-0 font-mono font-bold">
                {{ record.perUseCount }}
              </Tag>
            </template>

            <template v-if="column.key === 'monthlyCount'">
              <Tag color="purple" class="m-0 font-mono font-bold">
                {{ record.monthlyCount }}
              </Tag>
            </template>

            <template v-if="column.key === 'consumption'">
              <div class="flex w-full flex-col pr-4">
                <div class="mb-1 flex justify-between text-xs font-semibold">
                  <span class="text-slate-700 dark:text-slate-300">{{
                    record.usedPoints.toLocaleString()
                  }}</span>
                  <span class="text-slate-400"
                    >/ {{ record.totalPoints.toLocaleString() }}</span
                  >
                </div>
                <Progress
                  :percent="getPercent(record.usedPoints, record.totalPoints)"
                  :stroke-color="
                    getStatusColor(
                      getPercent(record.usedPoints, record.totalPoints),
                    )
                  "
                  :show-info="false"
                  size="small"
                  class="m-0"
                />
                <div
                  v-if="getPercent(record.usedPoints, record.totalPoints) >= 80"
                  class="mt-1 flex items-center gap-1 text-[10px] font-bold text-rose-500"
                >
                  <Icon icon="lucide:alert-triangle" /> 余量告警 (< 20%)
                </div>
              </div>
            </template>

            <template v-if="column.key === 'expireDate'">
              <div class="flex flex-col items-center">
                <span class="font-bold text-slate-700">{{
                  record.expireDate
                }}</span>
                <Tag
                  v-if="record.autoRenew"
                  color="blue"
                  class="m-0 mt-1 scale-90 border-0 bg-blue-50 text-blue-500"
                >
                  自动续费
                </Tag>
                <Tag
                  v-else
                  color="default"
                  class="m-0 mt-1 scale-90 border-0 bg-slate-50 text-slate-400"
                >
                  手动续费
                </Tag>
              </div>
            </template>

            <template v-if="column.key === 'action'">
              <div class="flex justify-center gap-1.5">
                <Button
                  type="primary"
                  ghost
                  size="small"
                  class="flex items-center gap-1 rounded-md font-medium"
                  @click="openConfig(record)"
                >
                  <Icon icon="lucide:settings" /> 配置
                </Button>
                <Button
                  size="small"
                  class="flex items-center gap-1 rounded-md font-medium text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                  @click="goToBillingDetails(record)"
                >
                  <Icon icon="lucide:file-text" /> 账单明细
                </Button>
                <Button
                  size="small"
                  class="flex items-center gap-1 rounded-md font-medium text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                  @click="openTempQuota(record)"
                >
                  <Icon icon="lucide:clock-4" /> 临额
                </Button>
                <Button
                  size="small"
                  class="flex items-center gap-1 rounded-md font-medium text-slate-600 hover:text-indigo-600"
                  @click="openDetail(record)"
                >
                  <Icon icon="lucide:line-chart" /> 监控
                </Button>
              </div>
            </template>
          </template>
        </Table>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- Drawer: 配置与安装面板 -->
    <!-- ============================================== -->
    <Drawer
      v-model:open="configDrawerVisible"
      :title="isNewTenant ? '新增租户套餐' : `正在配置: ${currentTenant?.name}`"
      width="1100"
      :footer-style="{ textAlign: 'right' }"
      class="custom-drawer"
    >
      <div class="mb-8 px-10">
        <Steps :current="currentStep">
          <Steps.Step
            title="套餐与员工配置"
            description="设置基础套餐及员工计费方式"
          />
          <Steps.Step title="激活与安装" description="一键下发部署指令" />
        </Steps>
      </div>

      <div class="px-2">
        <!-- 第 1 步: 套餐与员工配置 -->
        <div v-if="currentStep === 0" class="animate-fade-in">
          <!-- 基础套餐配置 -->
          <div
            class="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div
              class="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3"
            >
              <div class="rounded-lg bg-indigo-100 p-1.5 text-indigo-600">
                <Icon icon="lucide:settings" />
              </div>
              <h3 class="m-0 font-bold text-slate-800">基础套餐配置</h3>
            </div>

            <div
              class="grid grid-cols-1 gap-6 rounded-xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-2"
            >
              <div class="flex items-center gap-4">
                <span class="w-24 text-sm font-semibold text-slate-600"
                  >关联租户:</span
                >
                <Select
                  v-if="isNewTenant"
                  v-model:value="currentTenant.name"
                  class="flex-1"
                  placeholder="请下拉选择待配置的租户"
                >
                  <Select.Option
                    v-for="t in unassignedTenants"
                    :key="t.id"
                    :value="t.name"
                  >
                    {{ t.name }}
                  </Select.Option>
                </Select>
                <Input
                  v-else
                  :value="currentTenant?.name"
                  disabled
                  class="flex-1 bg-slate-100 font-bold text-slate-700"
                />
              </div>

              <div class="flex items-center gap-4">
                <span class="w-24 text-sm font-semibold text-slate-600"
                  >自动续费:</span
                >
                <Switch
                  v-model:checked="packageAutoRenew"
                  checked-children="开启"
                  un-checked-children="关闭"
                />
              </div>

              <div class="flex items-center gap-4">
                <span class="w-24 text-sm font-semibold text-slate-600"
                  >套餐版本:</span
                >
                <Select v-model:value="packageVersion" class="flex-1">
                  <Select.Option value="Std">基础版 (Std)</Select.Option>
                  <Select.Option value="Pro">专业版 (Pro)</Select.Option>
                  <Select.Option value="Ultra">旗舰版 (Ultra)</Select.Option>
                </Select>
              </div>

              <div class="flex items-center gap-4">
                <span class="w-24 text-sm font-semibold text-slate-600"
                  >套餐点数:</span
                >
                <InputNumber
                  :value="packagePoints"
                  disabled
                  class="flex-1 bg-slate-100 font-bold text-slate-700"
                />
              </div>

              <div class="flex items-center gap-4">
                <span class="w-24 text-sm font-semibold text-slate-600"
                  >赠送点数:</span
                >
                <InputNumber
                  v-model:value="giftPoints"
                  :min="0"
                  class="flex-1"
                  placeholder="输入赠送点数"
                />
              </div>
            </div>
          </div>

          <!-- 员工计费配置 -->
          <div
            class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div
              class="mb-4 flex items-center justify-between border-b border-slate-100 pb-3"
            >
              <div class="flex items-center gap-2">
                <div class="rounded-lg bg-blue-100 p-1.5 text-blue-600">
                  <Icon icon="lucide:users" />
                </div>
                <h3 class="m-0 font-bold text-slate-800">员工计费配置</h3>
                <span
                  class="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-400"
                  >不再扣除套餐点数</span
                >
              </div>
              <Button
                type="primary"
                size="small"
                class="border-0 bg-blue-600 hover:bg-blue-700"
                @click="openEmployeeSelection('package')"
              >
                <template #icon><Icon icon="lucide:plus" /></template>选择员工
              </Button>
            </div>

            <div
              class="overflow-hidden rounded-xl border border-slate-200 shadow-inner"
            >
              <Table
                :data-source="selectedPackageEmployees"
                row-key="id"
                :pagination="false"
                size="small"
                :columns="[
                  { title: '员工信息', key: 'name', width: 180 },
                  { title: '收费方式', key: 'chargeMode', width: 130 },
                  { title: '计费配置', key: 'config' },
                  { title: '操作', key: 'action', width: 60, align: 'center' },
                ]"
              >
                <template #bodyCell="{ column, record, index }">
                  <template v-if="column.key === 'name'">
                    <div class="flex items-center gap-2.5">
                      <img
                        :src="record.avatar"
                        class="h-7 w-7 rounded-full border border-slate-200 bg-slate-50 shadow-sm"
                      />
                      <span class="font-bold text-slate-700">{{
                        record.name
                      }}</span>
                    </div>
                  </template>
                  <template v-if="column.key === 'chargeMode'">
                    <div
                      class="flex w-max items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5"
                    >
                      <div
                        class="flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-bold transition-all duration-200"
                        :class="
                          record.chargeMode === 'per-use'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        "
                        @click="record.chargeMode = 'per-use'"
                      >
                        <Icon icon="lucide:hash" class="text-sm" />
                        计次
                      </div>
                      <div
                        class="flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-bold transition-all duration-200"
                        :class="
                          record.chargeMode === 'monthly'
                            ? 'bg-white text-emerald-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        "
                        @click="record.chargeMode = 'monthly'"
                      >
                        <Icon icon="lucide:calendar-days" class="text-sm" />
                        包月
                      </div>
                    </div>
                  </template>
                  <template v-if="column.key === 'config'">
                    <div
                      v-if="record.chargeMode === 'per-use'"
                      class="flex items-center gap-5"
                    >
                      <div class="flex items-center gap-2">
                        <div
                          class="flex h-5 w-5 items-center justify-center rounded bg-indigo-50 text-indigo-500"
                        >
                          <Icon icon="lucide:tag" class="text-[10px]" />
                        </div>
                        <span class="text-[11px] font-bold text-slate-500"
                          >默认单价:</span
                        >
                        <InputNumber
                          :value="record.price"
                          disabled
                          size="small"
                          class="w-20 border-slate-200 bg-slate-50 font-bold text-slate-400"
                        />
                      </div>
                      <div
                        class="flex items-center gap-2 border-l border-slate-200 pl-4"
                      >
                        <div
                          class="flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-slate-400"
                        >
                          <Icon icon="lucide:scale" class="text-[10px]" />
                        </div>
                        <span class="text-[11px] font-bold text-slate-500"
                          >计费单位:</span
                        >
                        <Input
                          :value="record.unit"
                          disabled
                          size="small"
                          class="w-16 border-slate-200 bg-slate-50 text-center font-medium text-slate-400"
                        />
                      </div>
                    </div>
                    <div v-else class="flex items-center gap-5">
                      <div class="flex items-center gap-2">
                        <div
                          class="flex h-5 w-5 items-center justify-center rounded bg-emerald-50 text-emerald-500"
                        >
                          <Icon icon="lucide:coins" class="text-[10px]" />
                        </div>
                        <span class="text-[11px] font-bold text-slate-700"
                          >扣除点数:</span
                        >
                        <InputNumber
                          v-model:value="record.oneTimePoints"
                          size="small"
                          :min="0"
                          class="w-24 border-emerald-200 font-bold text-emerald-600 shadow-sm"
                        />
                        <span class="text-[10px] text-slate-400">点/月</span>
                      </div>
                      <div
                        class="flex items-center gap-2 border-l border-slate-200 pl-4"
                      >
                        <div
                          class="flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-slate-400"
                        >
                          <Icon
                            icon="lucide:arrow-up-to-line"
                            class="text-[10px]"
                          />
                        </div>
                        <span class="text-[11px] font-bold text-slate-700"
                          >计费上限:</span
                        >
                        <InputNumber
                          v-model:value="record.maxLimit"
                          size="small"
                          placeholder="无上限"
                          :min="0"
                          class="w-20"
                        />
                        <span class="text-[10px] text-slate-400">点</span>
                      </div>
                    </div>
                  </template>
                  <template v-if="column.key === 'action'">
                    <Button
                      type="text"
                      danger
                      size="small"
                      class="rounded-md hover:bg-rose-50"
                      @click="selectedPackageEmployees.splice(index, 1)"
                    >
                      <Icon icon="lucide:trash-2" />
                    </Button>
                  </template>
                </template>
              </Table>
            </div>
          </div>
        </div>

        <!-- 第 2 步: 激活与安装 -->
        <div v-if="currentStep === 1" class="animate-fade-in">
          <div
            class="mb-6 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm"
          >
            <div class="flex items-start gap-3">
              <Icon
                icon="lucide:plug-zap"
                class="mt-0.5 text-2xl text-amber-500"
              />
              <div>
                <h4 class="m-0 text-sm font-bold text-slate-800">
                  部署检测与下发
                </h4>
                <p class="m-0 mt-1 text-xs text-slate-500">
                  系统会自动检测员工是否成功挂载至目标租户工作台。可触发重新下发指令。
                </p>
              </div>
            </div>
            <div class="flex gap-2">
              <Button @click="checkStatus">检测状态</Button>
              <Button
                type="primary"
                class="border-0 bg-emerald-600 hover:bg-emerald-700"
                @click="installAll"
              >
                一键部署所有待安装项
              </Button>
            </div>
          </div>

          <div class="flex flex-col gap-3">
            <div
              v-for="item in installPipeline"
              :key="item.id"
              class="flex items-center justify-between rounded-xl border bg-white p-3 shadow-sm transition-all"
              :class="
                item.status === 'installed'
                  ? 'border-emerald-100'
                  : 'border-rose-100 bg-rose-50/30'
              "
            >
              <div class="flex items-center gap-4">
                <div
                  v-if="item.status === 'installed'"
                  class="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                ></div>
                <div
                  v-else
                  class="h-2 w-2 animate-pulse rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                ></div>
                <div class="flex flex-col">
                  <span class="text-sm font-bold text-slate-700">{{
                    item.name
                  }}</span>
                  <span class="mt-0.5 font-mono text-[10px] text-slate-400">{{
                    item.type
                  }}</span>
                </div>
              </div>
              <div>
                <Tag
                  v-if="item.status === 'installed'"
                  color="success"
                  class="border-0 bg-emerald-50 font-bold text-emerald-600"
                >
                  已安装至租户
                </Tag>
                <div v-else class="flex items-center gap-2">
                  <Tag
                    color="error"
                    class="border-0 bg-rose-50 font-bold text-rose-600"
                  >
                    未安装/异常
                  </Tag>
                  <Button
                    size="small"
                    type="primary"
                    danger
                    ghost
                    @click="installSingle(item)"
                  >
                    单点触发部署
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <Button
          v-if="currentStep > 0"
          style="margin-right: 8px"
          @click="currentStep--"
        >
          上一步
        </Button>
        <Button v-if="currentStep < 1" type="primary" @click="currentStep++">
          下一步
        </Button>
        <Button
          v-if="currentStep === 1"
          type="primary"
          class="bg-emerald-600 hover:bg-emerald-700"
          @click="configDrawerVisible = false"
        >
          保存并完成配置
        </Button>
      </template>
    </Drawer>

    <!-- 续费弹窗 -->
    <Modal
      v-model:open="renewModalVisible"
      :title="`为租户续费: ${currentRenewTenant?.name}`"
      width="500px"
      ok-text="确认续费"
      @ok="
        renewModalVisible = false;
        message.success('已成功续费');
      "
    >
      <div class="mb-2 mt-4 rounded-xl border border-slate-200 bg-slate-50 p-6">
        <div class="mb-6 flex items-center gap-4">
          <span class="w-24 text-sm font-medium text-slate-600"
            >当前到期日:</span
          >
          <span
            class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-800"
            >{{ currentRenewTenant?.expireDate }}</span
          >
        </div>
        <div class="mb-6 flex items-center gap-4">
          <span class="w-24 text-sm font-medium text-slate-600"
            >快捷续费时长:</span
          >
          <Select v-model:value="renewDuration" class="flex-1" size="large">
            <Select.Option :value="1">1个月 (标准月付)</Select.Option>
            <Select.Option :value="3">3个月 (季度付)</Select.Option>
            <Select.Option :value="6">6个月 (半年付 - 享95折)</Select.Option>
            <Select.Option :value="12">12个月 (年付 - 享8折)</Select.Option>
          </Select>
        </div>
        <div class="flex items-center gap-4">
          <span class="w-24 text-sm font-medium text-slate-600"
            >续费后到期日:</span
          >
          <span
            class="flex items-center gap-2 text-lg font-bold text-emerald-600"
          >
            {{
              dayjs(currentRenewTenant?.expireDate)
                .add(renewDuration, 'month')
                .format('YYYY-MM-DD')
            }}
            <Icon icon="lucide:arrow-up-right" class="text-emerald-500" />
          </span>
        </div>
      </div>
    </Modal>

    <!-- 临时额度弹窗 -->
    <Modal
      v-model:open="tempQuotaModalVisible"
      :title="`配置临时额度: ${currentTempTenant?.name}`"
      width="700px"
      ok-text="确认生效"
      @ok="
        tempQuotaModalVisible = false;
        message.success('临时额度已生效');
      "
    >
      <div class="mt-4 flex flex-col gap-6">
        <!-- 共享包临时额度 -->
        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div class="mb-3 flex items-center gap-2">
            <div class="rounded-lg bg-blue-100 p-1.5 text-blue-600">
              <Icon icon="lucide:layers" />
            </div>
            <h4 class="m-0 font-bold text-slate-800">共享包临时提额</h4>
          </div>
          <div class="flex items-center gap-4">
            <div class="flex w-1/2 flex-col gap-1">
              <span class="text-xs font-medium text-slate-500"
                >临时额度点数</span
              >
              <InputNumber
                v-model:value="tempSharedPoints"
                placeholder="输入点数"
                class="w-full"
                :min="0"
              />
            </div>
            <div class="flex w-1/2 flex-col gap-1">
              <span class="text-xs font-medium text-slate-500">到期日期</span>
              <DatePicker v-model:value="tempSharedExpireDate" class="w-full" />
            </div>
          </div>
        </div>

        <!-- 独享员工临时额度已移除 -->
      </div>
    </Modal>

    <!-- 标准化数字员工选择弹窗 -->
    <Modal
      v-model:open="employeeSelectionVisible"
      :title="
        currentSelectionMode === 'shared'
          ? '选择激活共享员工'
          : '选择添加独享员工'
      "
      @ok="handleAddEmployees"
      ok-text="确定添加"
      width="800px"
    >
      <div class="mb-4 mt-4 flex items-center justify-between">
        <Input.Search
          v-model:value="employeeSearchKey"
          placeholder="搜索员工名称或编号"
          class="max-w-[300px]"
        />
        <div class="text-sm text-slate-500">
          已选择
          <span class="font-bold text-indigo-600">{{
            selectedEmployeeKeys.length
          }}</span>
          项
        </div>
      </div>

      <div class="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
        <Table
          :data-source="allEmployees"
          :columns="employeeSelectionColumns"
          :pagination="{ pageSize: 10, showSizeChanger: false }"
          :row-selection="{
            selectedRowKeys: selectedEmployeeKeys,
            onChange: (keys) => (selectedEmployeeKeys = keys),
          }"
          row-key="id"
          size="middle"
          class="custom-table"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'employee'">
              <div class="flex items-center gap-3">
                <img
                  :src="record.avatar"
                  class="h-8 w-8 rounded-full border border-slate-200 bg-slate-100"
                />
                <div class="flex flex-col">
                  <span class="font-bold leading-tight text-slate-800">{{
                    record.name
                  }}</span>
                  <span
                    class="mt-0.5 w-fit rounded-sm bg-slate-100 px-1 font-mono text-[10px] text-slate-400"
                    >{{ record.id }}</span
                  >
                </div>
              </div>
            </template>
            <template v-if="column.key === 'desc'">
              <span class="text-xs text-slate-500">{{ record.desc }}</span>
            </template>
            <template v-if="column.key === 'price'">
              <span class="font-bold text-slate-700">{{ record.price }}</span>
            </template>
            <template v-if="column.key === 'unit'">
              <Tag color="blue" class="border-0 bg-blue-50 text-blue-600">
                {{ record.unit }}
              </Tag>
            </template>
          </template>
        </Table>
      </div>
    </Modal>

    <!-- ============================================== -->
    <!-- Drawer: 消耗明细监控 -->
    <!-- ============================================== -->
    <Drawer
      v-model:open="detailDrawerVisible"
      :title="`消耗明细与预警: ${currentTenant?.name}`"
      width="500"
      placement="right"
      class="custom-drawer"
    >
      <div class="flex flex-col gap-6">
        <!-- 核心数据卡片 -->
        <div
          class="relative overflow-hidden rounded-3xl bg-indigo-600 p-6 text-white shadow-xl"
        >
          <div
            class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"
          ></div>

          <div class="relative z-10 flex flex-col gap-6">
            <div class="flex items-start justify-between">
              <div class="flex flex-col gap-1">
                <span
                  class="text-xs font-bold uppercase tracking-widest text-indigo-200"
                  >当前套餐余量</span
                >
                <span class="text-4xl font-black tabular-nums">
                  {{
                    (
                      (currentTenant?.totalPoints || 0) -
                      (currentTenant?.usedPoints || 0)
                    ).toLocaleString()
                  }}
                  <span class="text-sm font-medium">点</span>
                </span>
              </div>
              <div class="rounded-xl bg-white/20 p-2.5 backdrop-blur-md">
                <Icon icon="lucide:wallet" class="text-2xl" />
              </div>
            </div>

            <div
              class="grid grid-cols-2 gap-4 rounded-2xl bg-black/10 p-4 backdrop-blur-sm"
            >
              <div class="flex flex-col">
                <span class="text-[10px] font-bold uppercase text-indigo-200"
                  >总额度</span
                >
                <span class="text-lg font-black leading-tight">{{
                  currentTenant?.totalPoints.toLocaleString()
                }}</span>
              </div>
              <div class="flex flex-col">
                <span class="text-[10px] font-bold uppercase text-indigo-200"
                  >已使用</span
                >
                <span class="text-lg font-black leading-tight">{{
                  currentTenant?.usedPoints.toLocaleString()
                }}</span>
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <div
                class="flex justify-between text-[11px] font-black uppercase tracking-wider"
              >
                <span>消耗进度</span>
                <span
                  >{{
                    getPercent(
                      currentTenant?.usedPoints || 0,
                      currentTenant?.totalPoints || 1,
                    )
                  }}%</span
                >
              </div>
              <Progress
                :percent="
                  getPercent(
                    currentTenant?.usedPoints || 0,
                    currentTenant?.totalPoints || 1,
                  )
                "
                stroke-color="#fff"
                trail-color="rgba(255,255,255,0.2)"
                :show-info="false"
                stroke-width="8"
              />
            </div>
          </div>
        </div>

        <!-- 员工排行榜 -->
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between px-1">
            <h3
              class="m-0 flex items-center gap-2 text-base font-black text-slate-800 dark:text-slate-100"
            >
              <div
                class="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"
              >
                <Icon icon="lucide:bar-chart-3" />
              </div>
              员工消耗排行
            </h3>
            <span class="text-xs font-bold text-slate-400">实时统计数据</span>
          </div>

          <div class="flex flex-col gap-3">
            <div
              v-for="(emp, index) in rankedEmployees"
              :key="emp.id"
              class="group relative flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-3.5 transition-all hover:border-indigo-100 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <!-- Rank Number -->
              <div
                class="flex h-7 w-7 items-center justify-center rounded-lg font-mono text-xs font-black transition-colors"
                :class="[
                  index === 0
                    ? 'bg-amber-100 text-amber-600'
                    : index === 1
                      ? 'bg-slate-200 text-slate-500'
                      : index === 2
                        ? 'bg-orange-50 text-orange-500'
                        : 'bg-slate-50 text-slate-400',
                ]"
              >
                {{ index + 1 }}
              </div>

              <!-- Avatar & Info -->
              <div class="relative">
                <img
                  :src="emp.avatar"
                  class="h-11 w-11 rounded-xl border-2 border-white bg-slate-50 shadow-sm transition-transform group-hover:scale-105"
                />
                <div
                  v-if="index === 0"
                  class="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] text-white ring-2 ring-white"
                >
                  <Icon icon="lucide:crown" />
                </div>
              </div>

              <div class="flex min-w-0 flex-1 flex-col gap-0.5">
                <div class="flex items-center justify-between">
                  <span
                    class="truncate text-sm font-black text-slate-800 dark:text-slate-100"
                    >{{ emp.name }}</span
                  >
                  <div class="flex items-baseline gap-0.5">
                    <span
                      class="font-mono text-base font-black text-indigo-600"
                      >{{ emp.used.toLocaleString() }}</span
                    >
                    <span class="text-[10px] font-bold uppercase text-slate-400"
                      >点</span
                    >
                  </div>
                </div>

                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Tag
                      v-if="emp.chargeMode === 'per-use'"
                      class="m-0 border-0 bg-blue-50 px-1.5 py-0 text-[10px] font-bold text-blue-500"
                    >
                      计次
                    </Tag>
                    <Tag
                      v-else
                      class="m-0 border-0 bg-purple-50 px-1.5 py-0 text-[10px] font-bold text-purple-500"
                    >
                      包月
                    </Tag>
                    <span class="font-mono text-[10px] text-slate-300"
                      >#{{ emp.id }}</span
                    >
                  </div>
                  <div
                    class="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
                  >
                    <div
                      class="h-full bg-indigo-400/50"
                      :style="{
                        width: `${(emp.used / rankedEmployees[0].used) * 100}%`,
                      }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fade-in 0.3s ease-out forwards;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modern-tabs :deep(.ant-tabs-nav::before) {
  border-bottom-color: transparent !important;
}

.custom-drawer :deep(.ant-drawer-content) {
  border-top-left-radius: 24px;
  border-bottom-left-radius: 24px;
}
</style>
