<script setup lang="ts">
import { computed, reactive, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Card,
  DatePicker,
  Input,
  message,
  Modal,
  Spin,
  Table,
  Tooltip,
} from 'ant-design-vue';

const activeTab = ref('usage');

const loading = ref(false);
const usageTableData = ref<any[]>([]);
const tokenTableData = ref<any[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

const helpModalVisible = ref(false);

// 数字员工分页
const currentModelPage = ref(1);
const modelPageSize = ref(4);

const currentModels = computed(() => {
  const start = (currentModelPage.value - 1) * modelPageSize.value;
  const end = start + modelPageSize.value;
  return modelUsage.value.slice(start, end);
});

const totalModelPages = computed(() => {
  return Math.ceil(modelUsage.value.length / modelPageSize.value);
});

const nextModelPage = () => {
  if (currentModelPage.value < totalModelPages.value) {
    currentModelPage.value++;
  }
};

const prevModelPage = () => {
  if (currentModelPage.value > 1) {
    currentModelPage.value--;
  }
};

const searchForm = reactive({
  timeRange: [],
  employeeId: '',
  employeeName: '',
  employeeType: '',
});

const employeeTypeOptions = [
  { label: 'RPA', value: 'rpa' },
  { label: '对话机器人', value: 'chatbot' },
  { label: '审核机器人', value: 'audit-bot' },
  { label: '财务机器人', value: 'finance-bot' },
];

const usageStats = ref([
  {
    title: '本租户总调用次数',
    value: '3,247',
    sub: '累计服务调用总量',
    icon: 'lucide:activity',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    trend: '+12.5%',
    trendUp: true,
  },
  {
    title: '今日调用次数',
    value: '156',
    sub: '较昨日增长 23 次',
    icon: 'lucide:zap',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    trend: '+17.3%',
    trendUp: true,
  },
  {
    title: '本月调用次数',
    value: '1,753',
    sub: '本月累计调用总量',
    icon: 'lucide:calendar',
    color: 'text-purple-500',
    bg: 'bg-purple-50',
    trend: '+8.2%',
    trendUp: true,
  },
  {
    title: '活跃数字员工',
    value: '12',
    sub: '近30天有调用记录',
    icon: 'lucide:users',
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    trend: '+2',
    trendUp: true,
  },
]);

const tokenStats = ref([
  {
    title: '本租户总消耗Token',
    value: '1,250,000',
    sub: '累计Token消耗总量',
    icon: 'lucide:flame',
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    trend: '+15.8%',
    trendUp: true,
  },
  {
    title: '今日消耗Token',
    value: '15,600',
    sub: '较昨日增长 2,100',
    icon: 'lucide:sparkles',
    color: 'text-cyan-500',
    bg: 'bg-cyan-50',
    trend: '+15.6%',
    trendUp: true,
  },
  {
    title: '本月消耗Token',
    value: '325,000',
    sub: '本月累计消耗总量',
    icon: 'lucide:trending-up',
    color: 'text-pink-500',
    bg: 'bg-pink-50',
    trend: '+9.5%',
    trendUp: true,
  },
]);

const employeeUsageBreakdown = ref([
  { name: '智能客服助手', percent: 42, count: 1250, color: '#3b82f6' },
  { name: '销售助手', percent: 28, count: 980, color: '#8b5cf6' },
  { name: '财务RPA', percent: 18, count: 850, color: '#10b981' },
  { name: '审核机器人', percent: 12, count: 720, color: '#f59e0b' },
]);

const tokenUsageBreakdown = ref([
  { name: '智能客服助手', percent: 38, tokens: 125_000, color: '#3b82f6' },
  { name: '销售助手', percent: 25, tokens: 98_000, color: '#8b5cf6' },
  { name: '财务RPA', percent: 20, tokens: 85_000, color: '#10b981' },
  { name: '审核机器人', percent: 17, tokens: 72_000, color: '#f59e0b' },
]);

const usageMockData = [
  {
    id: '1',
    employeeId: 'AGENT001',
    employeeName: '智能客服助手',
    employeeType: 'chatbot',
    callCount: 1250,
    firstCallTime: '2026-03-15 09:00:00',
    lastCallTime: '2026-04-14 16:30:00',
    trend: '+15%',
    taskDescription: '产品推荐',
  },
  {
    id: '2',
    employeeId: 'AGENT002',
    employeeName: '销售助手',
    employeeType: 'chatbot',
    callCount: 980,
    firstCallTime: '2026-03-16 10:00:00',
    lastCallTime: '2026-04-14 15:45:00',
    trend: '+12%',
    taskDescription: '报价单',
  },
  {
    id: '3',
    employeeId: 'RPA001',
    employeeName: '财务RPA',
    employeeType: 'rpa',
    callCount: 850,
    firstCallTime: '2026-03-17 08:30:00',
    lastCallTime: '2026-04-14 14:20:00',
    trend: '+8%',
    taskDescription: '财务报表',
  },
  {
    id: '4',
    employeeId: 'AUDIT001',
    employeeName: '审核机器人',
    employeeType: 'audit-bot',
    callCount: 720,
    firstCallTime: '2026-03-18 11:00:00',
    lastCallTime: '2026-04-14 13:15:00',
    trend: '+5%',
    taskDescription: '医疗记录审核',
  },
  {
    id: '5',
    employeeId: 'FIN001',
    employeeName: '财务机器人',
    employeeType: 'finance-bot',
    callCount: 680,
    firstCallTime: '2026-03-19 09:30:00',
    lastCallTime: '2026-04-14 12:00:00',
    trend: '+3%',
    taskDescription: '调研报告',
  },
];

const tokenMockData = [
  {
    id: '1',
    employeeId: 'AGENT001',
    employeeName: '智能客服助手',
    employeeType: 'chatbot',
    totalTokens: 125_000,
    firstUseTime: '2026-03-15 09:00:00',
    lastUseTime: '2026-04-14 16:30:00',
    trend: '+18%',
  },
  {
    id: '2',
    employeeId: 'AGENT002',
    employeeName: '销售助手',
    employeeType: 'chatbot',
    totalTokens: 98_000,
    firstUseTime: '2026-03-16 10:00:00',
    lastUseTime: '2026-04-14 15:45:00',
    trend: '+14%',
  },
  {
    id: '3',
    employeeId: 'RPA001',
    employeeName: '财务RPA',
    employeeType: 'rpa',
    totalTokens: 85_000,
    firstUseTime: '2026-03-17 08:30:00',
    lastUseTime: '2026-04-14 14:20:00',
    trend: '+10%',
  },
  {
    id: '4',
    employeeId: 'AUDIT001',
    employeeName: '审核机器人',
    employeeType: 'audit-bot',
    totalTokens: 72_000,
    firstUseTime: '2026-03-18 11:00:00',
    lastUseTime: '2026-04-14 13:15:00',
    trend: '+6%',
  },
  {
    id: '5',
    employeeId: 'FIN001',
    employeeName: '财务机器人',
    employeeType: 'finance-bot',
    totalTokens: 68_000,
    firstUseTime: '2026-03-19 09:30:00',
    lastUseTime: '2026-04-14 12:00:00',
    trend: '+4%',
  },
];

const plans = ref([
  {
    id: '1',
    name: '专业版 · 月付',
    period: '2026年4月1日 — 2026年4月30日',
    daysLeft: 10,
    status: 'active',
    taskUsage: '1,823 / 2,500',
    taskPercent: 72.9,
    tokenUsage: '15.2万 / 20万',
    tokenPercent: 76,
  },
  {
    id: '2',
    name: '企业版 · 年付',
    period: '2026年5月1日 — 2027年4月30日',
    daysLeft: 40,
    status: 'upcoming',
    taskUsage: '0 / 10,000',
    taskPercent: 0,
    tokenUsage: '0万 / 100万',
    tokenPercent: 0,
  },
  {
    id: '3',
    name: '基础版 · 月付',
    period: '2026年3月1日 — 2026年3月31日',
    daysLeft: 0,
    status: 'expired',
    taskUsage: '1,500 / 1,500',
    taskPercent: 100,
    tokenUsage: '15万 / 15万',
    tokenPercent: 100,
  },
]);

const modelUsage = ref([
  {
    id: '1',
    name: 'PPT助理',
    version: '智能文档生成',
    taskUsage: '1,823 / 2,500',
    taskPercent: 72.9,
    tokenUsage: '15.2万 / 20万',
    tokenPercent: 76,
    icon: 'lucide:file-text',
    taskColor: 'from-blue-500 to-purple-500',
    tokenColor: 'from-cyan-500 to-blue-500',
  },
  {
    id: '2',
    name: '报价助理',
    version: '智能报价分析',
    taskUsage: '856 / 1,500',
    taskPercent: 57.1,
    tokenUsage: '8.6万 / 15万',
    tokenPercent: 57.3,
    icon: 'lucide:dollar-sign',
    taskColor: 'from-green-500 to-emerald-500',
    tokenColor: 'from-teal-500 to-green-500',
  },
  {
    id: '3',
    name: '销售助理',
    version: '智能销售跟进',
    taskUsage: '568 / 1,000',
    taskPercent: 56.8,
    tokenUsage: '3.0万 / 5万',
    tokenPercent: 60,
    icon: 'lucide:users',
    taskColor: 'from-orange-500 to-amber-500',
    tokenColor: 'from-yellow-500 to-orange-500',
  },
  {
    id: '4',
    name: '财务助理',
    version: '智能财务分析',
    taskUsage: '324 / 800',
    taskPercent: 40.5,
    tokenUsage: '2.1万 / 4万',
    tokenPercent: 52.5,
    icon: 'lucide:calculator',
    taskColor: 'from-red-500 to-pink-500',
    tokenColor: 'from-purple-500 to-red-500',
  },
  {
    id: '5',
    name: '法务助理',
    version: '智能法律分析',
    taskUsage: '210 / 600',
    taskPercent: 35,
    tokenUsage: '1.5万 / 3万',
    tokenPercent: 50,
    icon: 'lucide:scale',
    taskColor: 'from-purple-500 to-indigo-500',
    tokenColor: 'from-blue-500 to-indigo-500',
  },
  {
    id: '6',
    name: '人力资源助理',
    version: '智能招聘管理',
    taskUsage: '450 / 1,200',
    taskPercent: 37.5,
    tokenUsage: '2.8万 / 6万',
    tokenPercent: 46.7,
    icon: 'lucide:user-plus',
    taskColor: 'from-pink-500 to-rose-500',
    tokenColor: 'from-red-500 to-rose-500',
  },
  {
    id: '7',
    name: '市场分析助理',
    version: '智能市场调研',
    taskUsage: '680 / 1,000',
    taskPercent: 68,
    tokenUsage: '4.2万 / 7万',
    tokenPercent: 60,
    icon: 'lucide:bar-chart',
    taskColor: 'from-amber-500 to-orange-500',
    tokenColor: 'from-yellow-500 to-amber-500',
  },
  {
    id: '8',
    name: '供应链助理',
    version: '智能供应链管理',
    taskUsage: '320 / 800',
    taskPercent: 40,
    tokenUsage: '1.8万 / 4万',
    tokenPercent: 45,
    icon: 'lucide:truck',
    taskColor: 'from-emerald-500 to-teal-500',
    tokenColor: 'from-green-500 to-teal-500',
  },
]);

const purchaseRecords = ref([
  {
    id: '1',
    name: '专业版 · 月付',
    price: '¥1,299',
    date: '2026-04-01',
    status: 'active',
    icon: 'lucide:credit-card',
  },
  {
    id: '2',
    name: '企业版 · 年付',
    price: '¥12,999',
    date: '2026-03-15',
    status: 'upcoming',
    icon: 'lucide:building',
  },
  {
    id: '3',
    name: '基础版 · 月付',
    price: '¥599',
    date: '2026-03-01',
    status: 'expired',
    icon: 'lucide:package',
  },
]);

const loadData = () => {
  loading.value = true;
  setTimeout(() => {
    usageTableData.value = usageMockData;
    tokenTableData.value = tokenMockData;
    total.value = usageMockData.length;
    loading.value = false;
  }, 500);
};

const handleSearch = () => {
  currentPage.value = 1;
  loadData();
};

const handleReset = () => {
  Object.assign(searchForm, {
    timeRange: [],
    employeeId: '',
    employeeName: '',
    employeeType: '',
  });
  currentPage.value = 1;
  loadData();
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  loadData();
};

const handleExport = () => {
  message.success('导出功能开发中');
};

const handleViewDetail = (item: any) => {
  message.info(`查看 ${item.employeeName} 的使用明细`);
};

const getEmployeeTypeText = (type: string) => {
  const option = employeeTypeOptions.find((opt) => opt.value === type);
  return option ? option.label : type;
};

const handleTabChange = (key: string) => {
  activeTab.value = key;
};

const showHelpModal = () => {
  helpModalVisible.value = true;
};

loadData();
</script>

<template>
  <div
    class="relative flex min-h-[calc(100vh-100px)] flex-col gap-6 bg-slate-50/50 p-6"
  >
    <div class="fixed right-8 top-24 z-50">
      <Tooltip title="查看设计逻辑" placement="bottom">
        <Button
          type="primary"
          style="background-color: #f59e0b; border-color: #f59e0b"
          class="flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:shadow-xl"
          @click="showHelpModal"
        >
          <Icon icon="lucide:help-circle" class="size-7" />
        </Button>
      </Tooltip>
    </div>

    <Modal
      v-model:open="helpModalVisible"
      title="租户数据统计接口文档"
      width="800px"
    >
      <Card class="min-h-[500px]">
        <Spin :spinning="false">
          <div class="min-h-[500px]">
            <h1 class="mb-4 text-2xl font-bold">租户数据统计页面</h1>
            <p class="mb-4 text-muted-foreground">
              本页面展示租户的数字员工调用统计和 Token 消耗情况。
            </p>
            <h2 class="mb-3 mt-6 text-xl font-semibold">页面结构</h2>
            <ul class="list-disc space-y-2 pl-5 text-muted-foreground">
              <li><strong>Expiry Card</strong>: 展示套餐到期信息</li>
              <li><strong>Summary Cards</strong>: 4个统计卡片展示关键指标</li>
              <li>
                <strong>Tab页签</strong>: 分为次数统计和 Token 统计两个 Tab
              </li>
              <li><strong>数据表格区</strong>: 展示详细的统计数据</li>
              <li>
                <strong>占比分析区</strong>: 展示各数字员工的调用占比和 Token
                消耗占比
              </li>
            </ul>
          </div>
        </Spin>
      </Card>
    </Modal>

    <!-- 多套餐显示 -->
    <div class="overflow-x-auto pb-4">
      <div class="flex min-w-max gap-4">
        <Card
          v-for="plan in plans"
          :key="plan.id"
          class="min-w-[400px] shadow-sm"
          :style="{
            background:
              plan.status === 'active'
                ? 'linear-gradient(135deg, rgba(79,125,249,0.06), rgba(139,92,246,0.04))'
                : plan.status === 'upcoming'
                  ? 'linear-gradient(135deg, rgba(6,214,160,0.06), rgba(79,125,249,0.04))'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
            borderColor:
              plan.status === 'active'
                ? 'rgba(79,125,249,0.12)'
                : plan.status === 'upcoming'
                  ? 'rgba(6,214,160,0.12)'
                  : 'rgba(255,255,255,0.05)',
          }"
        >
          <div class="space-y-4">
            <div class="flex items-center gap-6">
              <div
                class="flex h-14 w-14 items-center justify-center rounded-xl"
                :style="{
                  background:
                    plan.status === 'active'
                      ? 'rgba(79,125,249,0.1)'
                      : plan.status === 'upcoming'
                        ? 'rgba(6,214,160,0.1)'
                        : 'rgba(255,255,255,0.05)',
                  border:
                    plan.status === 'active'
                      ? '1px solid rgba(79,125,249,0.2)'
                      : plan.status === 'upcoming'
                        ? '1px solid rgba(6,214,160,0.2)'
                        : '1px solid rgba(255,255,255,0.05)',
                }"
              >
                <Icon
                  :icon="
                    plan.status === 'active'
                      ? 'lucide:clock'
                      : plan.status === 'upcoming'
                        ? 'lucide:calendar'
                        : 'lucide:x-circle'
                  "
                  class="size-7"
                  :style="{
                    color:
                      plan.status === 'active'
                        ? '#4f7df9'
                        : plan.status === 'upcoming'
                          ? '#06d6a0'
                          : '#9ca3af',
                  }"
                />
              </div>
              <div class="flex-1">
                <h4 class="text-base font-semibold">{{ plan.name }}</h4>
                <p class="text-sm text-muted-foreground">
                  {{ plan.period }} · 支持同时购买多个不同套餐
                </p>
              </div>
              <div class="text-center">
                <div
                  class="text-3xl font-bold"
                  :style="{
                    background:
                      plan.status === 'active'
                        ? 'linear-gradient(135deg, #4f7df9, #8b5cf6)'
                        : plan.status === 'upcoming'
                          ? 'linear-gradient(135deg, #06d6a0, #4f7df9)'
                          : 'linear-gradient(135deg, #9ca3af, #6b7280)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }"
                >
                  {{ plan.daysLeft }}
                </div>
                <div class="text-xs text-muted-foreground">
                  {{
                    plan.status === 'active'
                      ? '天后到期'
                      : plan.status === 'upcoming'
                        ? '天后生效'
                        : '已过期'
                  }}
                </div>
              </div>
            </div>
            <div class="space-y-3">
              <div>
                <div class="mb-2 flex justify-between text-sm">
                  <span>任务次数</span>
                  <span>{{ plan.taskUsage }}</span>
                </div>
                <div
                  class="h-2 w-full overflow-hidden rounded-full bg-gray-100"
                >
                  <div
                    class="duration-1500 h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all ease-out"
                    :style="{ width: `${plan.taskPercent}%` }"
                  ></div>
                </div>
              </div>
              <div>
                <div class="mb-2 flex justify-between text-sm">
                  <span>Token用量</span>
                  <span>{{ plan.tokenUsage }}</span>
                </div>
                <div
                  class="h-2 w-full overflow-hidden rounded-full bg-gray-100"
                >
                  <div
                    class="duration-1500 h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all ease-out"
                    :style="{ width: `${plan.tokenPercent}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>

    <!-- 次数统计 -->
    <Card title="次数统计" class="shadow-sm">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="stat in usageStats"
          :key="stat.title"
          class="w-full rounded-lg border bg-white p-4 transition-all hover:shadow-md"
        >
          <div class="mb-3 flex items-center justify-between">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-lg"
              :class="stat.bg"
            >
              <Icon :icon="stat.icon" class="size-5" :class="[stat.color]" />
            </div>
            <span
              v-if="stat.trend"
              class="flex items-center gap-1 text-sm"
              :class="stat.trendUp ? 'text-emerald-500' : 'text-red-500'"
            >
              <Icon
                :icon="
                  stat.trendUp ? 'lucide:trending-up' : 'lucide:trending-down'
                "
                class="size-4"
              />
              {{ stat.trend }}
            </span>
          </div>
          <div class="text-2xl font-bold">{{ stat.value }}</div>
          <div class="text-sm text-muted-foreground">{{ stat.title }}</div>
          <div class="mt-1 text-xs text-muted-foreground">{{ stat.sub }}</div>
        </div>
      </div>
    </Card>

    <!-- 数字员工用量 -->
    <Card title="数字员工用量" class="shadow-sm">
      <div class="relative">
        <div class="flex justify-center">
          <div
            class="flex gap-4 overflow-x-auto pb-4"
            style="min-width: max-content; max-width: 1200px"
          >
            <div
              v-for="model in currentModels"
              :key="model.id"
              class="w-64 flex-shrink-0 rounded-lg border bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <div class="mb-4 flex items-center gap-3">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50"
                >
                  <Icon :icon="model.icon" class="size-5 text-blue-500" />
                </div>
                <div>
                  <div class="font-semibold">{{ model.name }}</div>
                  <div class="text-xs text-muted-foreground">
                    {{ model.version }}
                  </div>
                </div>
              </div>
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Icon
                      icon="lucide:bar-chart-2"
                      class="size-4 text-blue-500"
                    />
                    <span class="text-sm text-muted-foreground">任务次数</span>
                  </div>
                  <span class="text-xl font-bold text-blue-600">{{
                    model.taskUsage.split(' / ')[0]
                  }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Icon icon="lucide:coins" class="size-4 text-emerald-500" />
                    <span class="text-sm text-muted-foreground">Token用量</span>
                  </div>
                  <span class="text-xl font-bold text-emerald-600">{{
                    model.tokenUsage.split(' / ')[0]
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Button
          type="text"
          @click="prevModelPage"
          :disabled="currentModelPage === 1"
          class="absolute left-0 top-1/2 z-10 -translate-y-1/2 transform rounded-full bg-white/80 shadow-md"
          style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
          "
        >
          <Icon icon="lucide:chevron-left" class="size-5" />
        </Button>
        <Button
          type="text"
          @click="nextModelPage"
          :disabled="currentModelPage === totalModelPages"
          class="absolute right-0 top-1/2 z-10 -translate-y-1/2 transform rounded-full bg-white/80 shadow-md"
          style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
          "
        >
          <Icon icon="lucide:chevron-right" class="size-5" />
        </Button>
        <div class="mt-4 flex justify-center">
          <span class="text-sm text-muted-foreground">
            {{ currentModelPage }} / {{ totalModelPages }}
          </span>
        </div>
      </div>
    </Card>

    <!-- 使用明细 -->
    <Card title="使用明细" class="shadow-sm">
      <!-- 查询条件 -->
      <div class="mb-6 rounded-lg border bg-white p-4">
        <div class="flex flex-wrap gap-4">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium">时间范围：</span>
            <DatePicker.RangePicker style="width: 300px" />
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium">员工名称：</span>
            <Input style="width: 200px" placeholder="请输入员工名称" />
          </div>
          <div class="flex items-center gap-2">
            <Button type="primary" class="ml-2">查询</Button>
            <Button>重置</Button>
          </div>
        </div>
      </div>

      <Table
        :loading="loading"
        :data-source="usageTableData"
        :pagination="{
          current: currentPage,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t: number) => `共 ${t} 条`,
        }"
        @change="
          (pag: any) => {
            currentPage = pag.current;
            loadData();
          }
        "
      >
        <Table.Column title="数字员工ID" data-index="employeeId" />
        <Table.Column title="数字员工名称" data-index="employeeName" />
        <Table.Column title="员工类型" data-index="employeeType">
          <template #default="{ text }">
            {{ getEmployeeTypeText(text) }}
          </template>
        </Table.Column>
        <Table.Column title="调用次数" data-index="callCount" />
        <Table.Column title="首次调用时间" data-index="firstCallTime" />
        <Table.Column title="最近调用时间" data-index="lastCallTime" />
        <Table.Column title="趋势" data-index="trend">
          <template #default="{ text }">
            <span class="text-emerald-500">{{ text }}</span>
          </template>
        </Table.Column>
        <Table.Column title="任务描述" data-index="taskDescription" />
        <Table.Column title="操作">
          <template #default="{ record }">
            <Button type="link" size="small" @click="handleViewDetail(record)">
              查看明细
            </Button>
          </template>
        </Table.Column>
      </Table>
    </Card>

    <!-- 购买记录 -->
    <Card title="购买记录" class="shadow-sm">
      <div class="space-y-4">
        <div
          v-for="record in purchaseRecords"
          :key="record.id"
          class="flex items-center gap-4 rounded-lg border bg-white p-4 transition-all hover:shadow-md"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-lg"
            :style="{
              background:
                record.status === 'active'
                  ? 'rgba(79,125,249,0.1)'
                  : record.status === 'upcoming'
                    ? 'rgba(6,214,160,0.1)'
                    : 'rgba(255,255,255,0.05)',
            }"
          >
            <Icon
              :icon="record.icon"
              class="size-6"
              :style="{
                color:
                  record.status === 'active'
                    ? '#4f7df9'
                    : record.status === 'upcoming'
                      ? '#06d6a0'
                      : '#9ca3af',
              }"
            />
          </div>
          <div class="flex-1">
            <div class="font-semibold">{{ record.name }}</div>
            <div class="text-sm text-muted-foreground">
              购买日期：{{ record.date }}
            </div>
          </div>
          <div class="text-right">
            <div class="text-lg font-bold">{{ record.price }}</div>
            <div
              class="inline-block rounded-full px-2 py-1 text-xs"
              :style="{
                background:
                  record.status === 'active'
                    ? 'rgba(79,125,249,0.1)'
                    : record.status === 'upcoming'
                      ? 'rgba(6,214,160,0.1)'
                      : 'rgba(255,255,255,0.05)',
                color:
                  record.status === 'active'
                    ? '#4f7df9'
                    : record.status === 'upcoming'
                      ? '#06d6a0'
                      : '#9ca3af',
              }"
            >
              {{
                record.status === 'active'
                  ? '使用中'
                  : record.status === 'upcoming'
                    ? '即将生效'
                    : '已过期'
              }}
            </div>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>
