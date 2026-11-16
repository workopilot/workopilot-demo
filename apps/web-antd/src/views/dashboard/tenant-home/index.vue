<script setup lang="ts">
import type { ModelUsageData, ServiceUsageData } from '#/types/tenant-home';

import { computed, onMounted, ref } from 'vue';
import VChart from 'vue-echarts';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import {
  Card,
  Col,
  message,
  Row,
  Select,
  Statistic,
  Tag,
} from 'ant-design-vue';
import { LineChart, PieChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';

import { getTenantHomeDataApi } from '#/api/tenant-home';

// 注册必要的 ECharts 组件
echarts.use([
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  CanvasRenderer,
  LineChart,
  PieChart,
]);

const router = useRouter();

// 加载状态
const loading = ref(false);

// 首页数据
const homeData = ref<any>(null);

// 模型用量时间范围
const modelTimeRange = ref<'custom' | 'month' | 'today' | 'week'>('today');

// 获取首页数据
const fetchHomeData = async () => {
  try {
    loading.value = true;
    const res = await getTenantHomeDataApi();
    if (res.code === 0) {
      homeData.value = res.data;
    } else {
      message.error(res.message || '获取数据失败');
    }
  } catch (error) {
    console.error('获取首页数据失败:', error);
    message.error('获取数据失败');
  } finally {
    loading.value = false;
  }
};

// 快捷操作跳转
const handleQuickAction = (action: any) => {
  if (action.route) {
    router.push(action.route);
  } else if (action.action) {
    message.info(`执行操作: ${action.action}`);
  }
};

// 服务状态颜色
const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    normal: 'success',
    warning: 'warning',
    error: 'error',
  };
  return colorMap[status] || 'default';
};

// 服务状态文本
const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    normal: '正常',
    warning: '警告',
    error: '异常',
  };
  return textMap[status] || status;
};

// 服务用量饼图配置
const serviceUsageChartOption = computed(() => {
  if (!homeData.value) return {};

  const data = homeData.value.serviceUsage.data || [];

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: '10%',
      top: 'center',
    },
    series: [
      {
        name: '服务用量',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
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
            fontSize: 20,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: data.map((item: ServiceUsageData) => ({
          value: item.value,
          name: item.name,
        })),
      },
    ],
  };
});

// 模型用量折线图配置
const modelUsageChartOption = computed(() => {
  if (!homeData.value) return {};

  const models = homeData.value.modelUsage.data || [];
  if (models.length === 0) return {};

  // 获取第一个模型的时间点作为X轴
  const times = models[0]?.data?.map((item: any) => item.time) || [];

  // 生成系列数据
  const series = models.map((model: ModelUsageData) => ({
    name: model.modelName,
    type: 'line',
    smooth: true,
    data: model.data?.map((item: any) => item.calls) || [],
  }));

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
    },
    legend: {
      data: models.map((m: ModelUsageData) => m.modelName),
      top: 10,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: times,
    },
    yAxis: {
      type: 'value',
      name: '调用次数',
    },
    series,
  };
});

// 切换模型用量时间范围
const handleTimeRangeChange = async (
  value: 'custom' | 'month' | 'today' | 'week',
) => {
  modelTimeRange.value = value;
  // 这里可以重新调用API获取不同时间范围的数据
  let timeText = '近30天';
  if (value === 'today') {
    timeText = '今天';
  } else if (value === 'week') {
    timeText = '近7天';
  }
  message.info(`切换到${timeText}数据`);
};

onMounted(() => {
  fetchHomeData();
});
</script>

<template>
  <div v-loading="loading" class="tenant-home p-6">
    <!-- 租户信息 + 概览统计 -->
    <Row :gutter="16" class="mb-6">
      <!-- 租户名称和到期时间 -->
      <Col :span="8">
        <Card>
          <div class="flex h-full flex-col justify-center">
            <div class="text-2xl font-semibold text-gray-900">
              {{ homeData?.overview?.tenantName || '-' }}
            </div>
            <div class="mt-2 text-base text-gray-500">
              到期日期: {{ homeData?.overview?.expiryDate || '-' }}
            </div>
          </div>
        </Card>
      </Col>
      <!-- 总调用次数 -->
      <Col :span="5">
        <Card>
          <Statistic
            title="总调用次数"
            :value="homeData?.overview?.totalCalls || 0"
            :value-style="{ color: '#3b82f6', fontSize: '20px' }"
          >
            <template #prefix>
              <Icon icon="lucide:zap" class="size-4" />
            </template>
          </Statistic>
        </Card>
      </Col>
      <!-- 今日调用 -->
      <Col :span="5">
        <Card>
          <Statistic
            title="今日调用"
            :value="homeData?.overview?.todayCalls || 0"
            :value-style="{ color: '#10b981', fontSize: '20px' }"
          >
            <template #prefix>
              <Icon icon="lucide:activity" class="size-4" />
            </template>
          </Statistic>
        </Card>
      </Col>
      <!-- 活跃模型 -->
      <Col :span="6">
        <Card>
          <Statistic
            title="活跃模型"
            :value="homeData?.overview?.activeModels || 0"
            :value-style="{ color: '#f59e0b', fontSize: '20px' }"
          >
            <template #prefix>
              <Icon icon="lucide:cpu" class="size-4" />
            </template>
          </Statistic>
        </Card>
      </Col>
    </Row>

    <!-- 智能体服务 & 快捷操作 -->
    <Row :gutter="16" class="mb-6">
      <!-- 智能体服务 -->
      <Col :span="16">
        <Card title="智能体服务" class="h-full">
          <Row :gutter="[16, 16]">
            <Col
              v-for="service in homeData?.serviceStatus || []"
              :key="service.id"
              :span="8"
            >
              <div
                class="service-card group relative flex cursor-pointer flex-col items-center rounded-lg border p-6 text-center transition-all hover:shadow-lg hover:shadow-blue-500/10"
                @click="
                  service.route
                    ? router.push(service.route)
                    : message.info('该服务暂未开放')
                "
              >
                <!-- 状态标签 -->
                <Tag
                  :color="getStatusColor(service.status)"
                  class="absolute right-2 top-2"
                >
                  {{ getStatusText(service.status) }}
                </Tag>

                <!-- 服务图标 -->
                <div
                  :style="{
                    backgroundColor: service.logoBgColor || '#f8fafc',
                  }"
                  class="mb-3 flex size-16 items-center justify-center rounded-full"
                >
                  <img
                    v-if="
                      service.logo &&
                      (service.logo.startsWith('data:') ||
                        service.logo.startsWith('http') ||
                        service.logo.startsWith('/'))
                    "
                    :src="service.logo"
                    :alt="service.name"
                    class="size-14 object-contain p-2 transition-transform group-hover:scale-110"
                  />
                  <Icon
                    v-else
                    :icon="service.logo || 'lucide:bot'"
                    :style="{ color: service.logoColor || '#475569' }"
                    class="size-14 transition-transform group-hover:scale-110"
                  />
                </div>

                <!-- 服务名称 -->
                <div class="mb-2 text-base font-medium text-gray-900">
                  {{ service.name }}
                </div>

                <!-- 统计数据 -->
                <div class="w-full space-y-1 text-xs text-gray-500">
                  <div class="flex items-center justify-between">
                    <span>今日调用</span>
                    <span class="font-medium text-gray-900">{{
                      service.todayCalls
                    }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span>成功率</span>
                    <span
                      :class="
                        service.successRate > 95
                          ? 'text-green-600'
                          : 'text-yellow-600'
                      "
                      class="font-medium"
                    >
                      {{ service.successRate }}%
                    </span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span>响应时间</span>
                    <span class="font-medium text-gray-900"
                      >{{ service.avgResponseTime }}ms</span
                    >
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      </Col>

      <!-- 快捷导航 -->
      <Col :span="8">
        <Card title="快捷导航" class="h-full">
          <div class="flex flex-wrap p-0">
            <div
              v-for="(action, index) in homeData?.quickActions || []"
              :key="action.id"
              :class="{
                'border-r-0': index % 3 === 2,
                'pb-4': index > 2,
                'rounded-bl-xl': index === homeData?.quickActions?.length! - 2,
                'rounded-br-xl': index === homeData?.quickActions?.length! - 1,
              }"
              class="group flex w-1/3 cursor-pointer flex-col items-center justify-center border-r border-t py-8 transition-all hover:shadow-xl"
              @click="handleQuickAction(action)"
            >
              <Icon
                :icon="action.icon"
                :color="action.color"
                class="size-7 transition-all duration-300 group-hover:scale-125"
              />
              <span class="text-md mt-2 truncate text-gray-700">{{
                action.title
              }}</span>
            </div>
          </div>
        </Card>
      </Col>
    </Row>

    <!-- 服务用量监控 & 模型用量监控 -->
    <Row :gutter="16" class="mb-6">
      <!-- 服务用量监控 -->
      <Col :span="10">
        <Card title="服务用量监控" class="h-full">
          <div class="mb-4 flex items-center gap-4">
            <div class="text-center">
              <div class="text-sm text-gray-500">今日总调用</div>
              <div class="mt-1 text-2xl font-semibold text-blue-600">
                {{ homeData?.serviceUsage?.total || 0 }}
              </div>
            </div>
          </div>
          <VChart
            :option="serviceUsageChartOption"
            class="h-[300px] w-full"
            autoresize
          />
        </Card>
      </Col>

      <!-- 模型用量监控 -->
      <Col :span="14">
        <Card title="模型用量监控" class="h-full">
          <template #extra>
            <span class="text-xs text-gray-500">已开通模型 Top5</span>
          </template>
          <div class="mb-2 flex items-center justify-between">
            <div
              class="flex items-center gap-1 text-xs font-medium text-gray-600"
            >
              <Icon icon="lucide:cpu" class="size-3" />
              模型调用趋势
            </div>
            <Select
              :value="modelTimeRange"
              size="small"
              style="width: 100px"
              @change="handleTimeRangeChange"
            >
              <Select.Option value="today">今天</Select.Option>
              <Select.Option value="week">近7天</Select.Option>
              <Select.Option value="month">近30天</Select.Option>
              <Select.Option value="custom">自定义</Select.Option>
            </Select>
          </div>
          <VChart
            :option="modelUsageChartOption"
            class="h-[200px] w-full"
            autoresize
          />
        </Card>
      </Col>
    </Row>
  </div>
</template>

<style scoped>
.tenant-home {
  min-height: calc(100vh - 100px);
  background-color: #f5f5f5;
}

.service-card {
  transition: all 0.3s ease;
}

.service-card:hover {
  border-color: #3b82f6;
  transform: translateY(-4px);
}
</style>
