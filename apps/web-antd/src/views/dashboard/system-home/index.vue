<script setup lang="ts">
import type { Model, Service } from '#/types/platform';

import { computed, onMounted, ref } from 'vue';
import VChart from 'vue-echarts';
// ==================== 操作函数 ====================
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, Card, message, Select } from 'ant-design-vue';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';

import {
  getModelPerformanceStatsApi,
  getModelsApi,
  getPackagesApi,
  getServicesApi,
  getTenantsApi,
} from '#/api/platform';

// 注册必要的 ECharts 组件
echarts.use([
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
]);

// 加载状态
const loading = ref(false);

// ==================== 数据 ====================
const models = ref<Model[]>([]);
const services = ref<Service[]>([]);
const packages = ref<any[]>([]);
const tenants = ref<any[]>([]);
const modelStats = ref<any[]>([]);

// 租户流量监控数据
const trafficTimeRange = ref<'day' | 'month' | 'year'>('day');
const trafficData = ref({
  day: {
    xAxis: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
    tenants: [
      { name: '示例企业A', data: [45, 30, 75, 130, 105, 160, 145] },
      { name: '示例企业B', data: [35, 25, 60, 105, 85, 125, 110] },
      { name: '示例企业C', data: [25, 15, 45, 80, 65, 95, 85] },
      { name: '其他租户', data: [15, 10, 20, 35, 25, 40, 40] },
    ],
  },
  month: {
    xAxis: ['1日', '5日', '10日', '15日', '20日', '25日', '30日'],
    tenants: [
      { name: '示例企业A', data: [1300, 1550, 1400, 1850, 1750, 2050, 1900] },
      { name: '示例企业B', data: [1000, 1200, 1100, 1450, 1350, 1600, 1500] },
      { name: '示例企业C', data: [750, 900, 800, 1050, 975, 1150, 1075] },
      { name: '其他租户', data: [450, 550, 500, 750, 725, 800, 725] },
    ],
  },
  year: {
    xAxis: [
      '1月',
      '2月',
      '3月',
      '4月',
      '5月',
      '6月',
      '7月',
      '8月',
      '9月',
      '10月',
      '11月',
      '12月',
    ],
    tenants: [
      {
        name: '示例企业A',
        data: [
          16_500, 19_000, 17_500, 22_000, 21_000, 24_000, 22_500, 24_500,
          26_000, 28_000, 29_500, 30_500,
        ],
      },
      {
        name: '示例企业B',
        data: [
          13_000, 15_000, 14_000, 17_500, 16_500, 19_000, 18_000, 19_500,
          20_500, 22_000, 23_000, 24_000,
        ],
      },
      {
        name: '示例企业C',
        data: [
          9500, 11_000, 10_000, 12_500, 12_000, 13_500, 13_000, 14_000, 15_000,
          16_000, 17_000, 17_500,
        ],
      },
      {
        name: '其他租户',
        data: [
          6000, 7000, 6500, 9000, 8500, 9500, 8500, 10_000, 10_500, 12_000,
          12_500, 13_000,
        ],
      },
    ],
  },
});

// 服务订阅数据
const serviceSubscriptionData = ref([
  { name: '智能附件分类', value: 156, color: '#3b82f6' },
  { name: '智能附件对比', value: 134, color: '#10b981' },
  { name: '智能审核', value: 198, color: '#f59e0b' },
  { name: '智能填报', value: 167, color: '#ef4444' },
  { name: '智能合规', value: 145, color: '#8b5cf6' },
  { name: '智能审计', value: 123, color: '#06b6d4' },
]);

// 租户流量监控折线图配置
const trafficChartOption = computed(() => {
  const currentData = trafficData.value[trafficTimeRange.value];
  const colors = ['#667eea', '#10b981', '#f59e0b', '#ef4444'];

  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        let result = `${params[0].axisValue}<br/>`;
        params.forEach((item: any) => {
          result += `${item.marker} ${item.seriesName}: ${item.value}<br/>`;
        });
        return result;
      },
    },
    legend: {
      data: currentData.tenants.map((t: any) => t.name),
      top: 0,
      left: 'center',
      textStyle: {
        fontSize: 11,
      },
      itemWidth: 12,
      itemHeight: 12,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: currentData.xAxis,
      axisLabel: {
        fontSize: 10,
      },
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 10,
        formatter: '{value}',
      },
    },
    series: currentData.tenants.map((tenant: any, index: number) => ({
      name: tenant.name,
      type: 'line',
      data: tenant.data,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: {
        width: 2,
        color: colors[index % colors.length],
      },
      itemStyle: {
        color: colors[index % colors.length],
      },
    })),
  };
});

// 饼状图配置
const pieChartOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c} ({d}%)',
  },
  legend: {
    orient: 'vertical',
    right: '0',
    top: 'center',
    textStyle: {
      fontSize: 11,
    },
    itemWidth: 12,
    itemHeight: 12,
  },
  series: [
    {
      name: '服务订阅',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 4,
        borderColor: '#fff',
        borderWidth: 2,
      },
      label: {
        show: false,
        position: 'center',
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold',
        },
      },
      labelLine: {
        show: false,
      },
      data: serviceSubscriptionData.value,
    },
  ],
}));

// 柱形图配置
const barChartOption = computed(() => {
  const top10Models = modelStats.value.slice(0, 10);
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: top10Models.map((m) => m.modelName),
      axisLabel: {
        interval: 0,
        rotate: 30,
        fontSize: 10,
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 10,
      },
    },
    series: [
      {
        name: '调用次数',
        type: 'bar',
        data: top10Models.map((m) => m.totalCalls),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#667eea' },
            { offset: 1, color: '#764ba2' },
          ]),
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: '60%',
      },
    ],
  };
});

// ==================== 计算属性 ====================
const stats = computed(() => ({
  totalTenants: tenants.value?.length || 0,
  totalModels: models.value?.length || 0,
  totalServices: services.value?.length || 0,
  totalCalls: Array.isArray(modelStats.value)
    ? modelStats.value.reduce(
        (sum: number, m: any) => sum + (m.totalCalls || 0),
        0,
      )
    : 0,
  totalPackages: packages.value?.length || 0,
}));

// ==================== API 调用 ====================
async function fetchModels() {
  try {
    const res = await getModelsApi();
    if (res.code === 0 && Array.isArray(res.data)) {
      models.value = res.data;
    }
  } catch (error) {
    console.error('获取模型列表失败', error);
  }
}

async function fetchServices() {
  try {
    const res = await getServicesApi();
    if (res.code === 0 && Array.isArray(res.data)) {
      services.value = res.data;
    }
  } catch (error) {
    console.error('获取服务列表失败', error);
  }
}

async function fetchPackages() {
  try {
    const res = await getPackagesApi();
    if (res.code === 0 && Array.isArray(res.data)) {
      packages.value = res.data;
    }
  } catch (error) {
    console.error('获取套餐列表失败', error);
  }
}

async function fetchTenants() {
  try {
    const res = await getTenantsApi();
    if (res.code === 0 && res.data?.items) {
      tenants.value = res.data.items;
    }
  } catch (error) {
    console.error('获取租户列表失败', error);
  }
}

async function fetchModelStats() {
  // 默认数据 - Top15
  const defaultModelStats = [
    {
      modelId: '1',
      modelName: 'GPT-4',
      totalCalls: 45_000,
      successRate: 0.99,
      avgResponseTime: 1200,
      totalCost: 5000,
    },
    {
      modelId: '2',
      modelName: 'Claude 3 Opus',
      totalCalls: 38_000,
      successRate: 0.98,
      avgResponseTime: 1500,
      totalCost: 4500,
    },
    {
      modelId: '3',
      modelName: 'GPT-3.5 Turbo',
      totalCalls: 52_000,
      successRate: 0.97,
      avgResponseTime: 800,
      totalCost: 3200,
    },
    {
      modelId: '4',
      modelName: 'Claude 3 Sonnet',
      totalCalls: 41_000,
      successRate: 0.98,
      avgResponseTime: 1000,
      totalCost: 3800,
    },
    {
      modelId: '5',
      modelName: 'Gemini Pro',
      totalCalls: 35_000,
      successRate: 0.96,
      avgResponseTime: 900,
      totalCost: 2800,
    },
    {
      modelId: '6',
      modelName: 'Llama 3 70B',
      totalCalls: 28_000,
      successRate: 0.95,
      avgResponseTime: 1800,
      totalCost: 2200,
    },
    {
      modelId: '7',
      modelName: 'Mistral Large',
      totalCalls: 32_000,
      successRate: 0.97,
      avgResponseTime: 1100,
      totalCost: 2600,
    },
    {
      modelId: '8',
      modelName: 'Qwen Turbo',
      totalCalls: 48_000,
      successRate: 0.96,
      avgResponseTime: 700,
      totalCost: 2900,
    },
    {
      modelId: '9',
      modelName: 'GLM-4',
      totalCalls: 25_000,
      successRate: 0.94,
      avgResponseTime: 1300,
      totalCost: 1900,
    },
    {
      modelId: '10',
      modelName: 'Baichuan 2',
      totalCalls: 22_000,
      successRate: 0.93,
      avgResponseTime: 1400,
      totalCost: 1700,
    },
    {
      modelId: '11',
      modelName: 'Yi-34B',
      totalCalls: 19_000,
      successRate: 0.92,
      avgResponseTime: 1600,
      totalCost: 1500,
    },
    {
      modelId: '12',
      modelName: 'Phi-3 Medium',
      totalCalls: 21_000,
      successRate: 0.93,
      avgResponseTime: 1200,
      totalCost: 1600,
    },
    {
      modelId: '13',
      modelName: 'DeepSeek V2',
      totalCalls: 24_000,
      successRate: 0.95,
      avgResponseTime: 950,
      totalCost: 1800,
    },
    {
      modelId: '14',
      modelName: 'ChatGLM 3',
      totalCalls: 17_500,
      successRate: 0.91,
      avgResponseTime: 1450,
      totalCost: 1400,
    },
    {
      modelId: '15',
      modelName: 'Spark 3.5',
      totalCalls: 16_500,
      successRate: 0.92,
      avgResponseTime: 1100,
      totalCost: 1350,
    },
  ];

  try {
    const res = await getModelPerformanceStatsApi();
    modelStats.value =
      res.code === 0 && Array.isArray(res.data) && res.data.length >= 10
        ? res.data
        : defaultModelStats;
  } catch (error) {
    console.error('获取模型性能统计失败', error);
    // API 调用失败，使用默认数据
    modelStats.value = defaultModelStats;
  }
}

const router = useRouter();

function handleAction(type: string) {
  const actions = {
    manageModels: '/platform/model-management',
    manageAgents: '/agent/management',
    manageServices: '/platform/service-management',
    createPackage: '创建租户套餐',
    createTenant: '/platform/tenant-management',
    authorizeModel: '授权模型',
    subscribeService: '订阅服务',
    viewDetails: '查看详情',
  };

  const target = actions[type as keyof typeof actions];
  if (target?.startsWith('/')) {
    router.push(target);
  } else {
    message.info(target);
  }
}

// 切换流量时间范围
function handleTrafficTimeRangeChange(range: 'day' | 'month' | 'year') {
  trafficTimeRange.value = range;
}

// 初始化
onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([
      fetchModels(),
      fetchServices(),
      fetchPackages(),
      fetchTenants(),
      fetchModelStats(),
    ]);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="system-home-container">
    <!-- 关键指标 -->
    <div class="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      <div
        class="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-3 text-white"
      >
        <div class="flex items-center gap-2">
          <Icon icon="lucide:users" class="size-5" />
          <span class="text-sm opacity-90">租户总数</span>
        </div>
        <div class="mt-2 text-2xl font-bold">{{ stats.totalTenants }}</div>
      </div>

      <div
        class="rounded-lg bg-gradient-to-br from-green-500 to-green-600 p-3 text-white"
      >
        <div class="flex items-center gap-2">
          <Icon icon="lucide:layers" class="size-5" />
          <span class="text-sm opacity-90">套餐数量</span>
        </div>
        <div class="mt-2 text-2xl font-bold">{{ stats.totalPackages }}</div>
      </div>

      <div
        class="rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 p-3 text-white"
      >
        <div class="flex items-center gap-2">
          <Icon icon="lucide:cpu" class="size-5" />
          <span class="text-sm opacity-90">模型数量</span>
        </div>
        <div class="mt-2 text-2xl font-bold">{{ stats.totalModels }}</div>
      </div>

      <div
        class="rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 p-3 text-white"
      >
        <div class="flex items-center gap-2">
          <Icon icon="lucide:server" class="size-5" />
          <span class="text-sm opacity-90">服务数量</span>
        </div>
        <div class="mt-2 text-2xl font-bold">{{ stats.totalServices }}</div>
      </div>

      <div
        class="rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 p-3 text-white"
      >
        <div class="flex items-center gap-2">
          <Icon icon="lucide:activity" class="size-5" />
          <span class="text-sm opacity-90">调用次数</span>
        </div>
        <div class="mt-2 text-2xl font-bold">
          {{ stats.totalCalls.toLocaleString() }}
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <!-- 基础配置 -->
      <Card title="基础配置" size="small" :bordered="false">
        <template #extra>
          <span class="text-xs text-gray-500">平台核心功能</span>
        </template>

        <div class="space-y-3">
          <!-- 模型管理 -->
          <div
            class="flex items-start justify-between rounded border bg-gray-50 p-2"
          >
            <div class="flex items-start gap-2">
              <div
                class="flex size-8 shrink-0 items-center justify-center rounded bg-blue-100"
              >
                <Icon icon="lucide:cpu" class="size-4 text-blue-600" />
              </div>
              <div>
                <div class="text-sm font-medium">模型管理</div>
                <div class="text-xs text-gray-500">管理模型提供商和模型</div>
                <div class="mt-1 text-xs text-blue-600">
                  {{ models.length }} 个模型
                </div>
              </div>
            </div>
            <Button size="small" @click="handleAction('manageModels')">
              管理
            </Button>
          </div>

          <!-- 智能体管理 -->
          <div
            class="flex items-start justify-between rounded border bg-gray-50 p-2"
          >
            <div class="flex items-start gap-2">
              <div
                class="flex size-8 shrink-0 items-center justify-center rounded bg-purple-100"
              >
                <Icon icon="lucide:bot" class="size-4 text-purple-600" />
              </div>
              <div>
                <div class="text-sm font-medium">智能体管理</div>
                <div class="text-xs text-gray-500">管理智能助手</div>
                <div class="mt-1 text-xs text-purple-600">配置和管理智能体</div>
              </div>
            </div>
            <Button size="small" @click="handleAction('manageAgents')">
              管理
            </Button>
          </div>

          <!-- 服务管理 -->
          <div
            class="flex items-start justify-between rounded border bg-gray-50 p-2"
          >
            <div class="flex items-start gap-2">
              <div
                class="flex size-8 shrink-0 items-center justify-center rounded bg-green-100"
              >
                <Icon icon="lucide:server" class="size-4 text-green-600" />
              </div>
              <div>
                <div class="text-sm font-medium">服务管理</div>
                <div class="text-xs text-gray-500">管理产品服务</div>
                <div class="mt-1 text-xs text-green-600">
                  {{ services.length }} 个服务
                </div>
              </div>
            </div>
            <Button size="small" @click="handleAction('manageServices')">
              管理
            </Button>
          </div>
        </div>
      </Card>

      <!-- 开通租户流程 -->
      <Card title="开通租户流程" size="small" :bordered="false">
        <template #extra>
          <span class="text-xs text-gray-500">4步流程</span>
        </template>

        <div class="space-y-2">
          <!-- 步骤1 -->
          <div
            class="flex items-center gap-2 rounded border border-blue-200 bg-blue-50 p-2"
          >
            <div
              class="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white"
            >
              1
            </div>
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-medium">创建套餐</div>
              <div class="text-xs text-gray-500">统一管理租户菜单权限</div>
              <div class="text-xs text-blue-600">
                {{ packages.length }} 个套餐
              </div>
            </div>
            <Button
              size="small"
              type="primary"
              @click="handleAction('createPackage')"
            >
              <Icon icon="lucide:plus" class="size-3" />
            </Button>
          </div>

          <!-- 步骤2 -->
          <div
            class="flex items-center gap-2 rounded border border-green-200 bg-green-50 p-2"
          >
            <div
              class="flex size-6 shrink-0 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white"
            >
              2
            </div>
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-medium">创建租户</div>
              <div class="text-xs text-gray-500">定义租户名称及企业信息</div>
              <div class="text-xs text-green-600">
                {{ tenants.length }} 个租户
              </div>
            </div>
            <Button
              size="small"
              type="primary"
              @click="handleAction('createTenant')"
            >
              <Icon icon="lucide:plus" class="size-3" />
            </Button>
          </div>

          <!-- 步骤3 -->
          <div
            class="flex items-center gap-2 rounded border border-orange-200 bg-orange-50 p-2"
          >
            <div
              class="flex size-6 shrink-0 items-center justify-center rounded-full bg-orange-600 text-xs font-bold text-white"
            >
              3
            </div>
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-medium">授权模型</div>
              <div class="text-xs text-gray-500">分配配额权限</div>
            </div>
            <Button size="small" @click="handleAction('authorizeModel')">
              <Icon icon="lucide:shield" class="size-3" />
            </Button>
          </div>

          <!-- 步骤4 -->
          <div
            class="flex items-center gap-2 rounded border border-purple-200 bg-purple-50 p-2"
          >
            <div
              class="flex size-6 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white"
            >
              4
            </div>
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-medium">订阅服务</div>
              <div class="text-xs text-gray-500">开通所需服务</div>
            </div>
            <Button size="small" @click="handleAction('subscribeService')">
              <Icon icon="lucide:check" class="size-3" />
            </Button>
          </div>
        </div>
      </Card>
    </div>

    <!-- 运营监控 -->
    <Card title="运营监控" size="small" class="mt-4" :bordered="false">
      <template #extra>
        <span class="text-xs text-gray-500">实时数据</span>
      </template>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <!-- 租户流量监控 -->
        <div class="lg:col-span-2">
          <div class="mb-2 flex items-center justify-between">
            <div
              class="flex items-center gap-1 text-xs font-medium text-gray-600"
            >
              <Icon icon="lucide:trending-up" class="size-3" />
              租户流量监控
            </div>
            <Select
              :value="trafficTimeRange"
              size="small"
              style="width: 100px"
              @change="handleTrafficTimeRangeChange"
            >
              <Select.Option value="day">当天</Select.Option>
              <Select.Option value="month">本月</Select.Option>
              <Select.Option value="year">本年</Select.Option>
            </Select>
          </div>
          <div class="h-[200px]">
            <VChart :option="trafficChartOption" autoresize />
          </div>
        </div>

        <!-- 模型调用 Top10 -->
        <div>
          <div
            class="mb-2 flex items-center gap-1 text-xs font-medium text-gray-600"
          >
            <Icon icon="lucide:cpu" class="size-3" />
            模型调用 Top10
          </div>
          <div class="h-[200px]">
            <VChart :option="barChartOption" autoresize />
          </div>
        </div>

        <!-- 服务订阅占比 -->
        <div>
          <div
            class="mb-2 flex items-center gap-1 text-xs font-medium text-gray-600"
          >
            <Icon icon="lucide:server" class="size-3" />
            服务订阅占比
          </div>
          <div class="h-[200px]">
            <VChart :option="pieChartOption" autoresize />
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>

<style scoped>
.system-home-container {
  max-height: calc(100vh - 120px);
  padding: 16px;
  overflow-y: auto;
}
</style>
