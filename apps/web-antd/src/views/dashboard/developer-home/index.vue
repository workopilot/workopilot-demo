<script setup lang="ts">
import type {
  AppStatus,
  DeveloperHomeData,
  MyApp,
  QuickNavItem,
} from '#/types/developer-home';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, Card, message, Progress, Tag, Tooltip } from 'ant-design-vue';

import {
  claimStarterPackApi,
  getDeveloperHomeDataApi,
} from '#/api/developer-home';

const router = useRouter();

// 加载状态
const loading = ref(false);
// 新手礼包领取中
const claiming = ref(false);
// 首页数据
const homeData = ref<DeveloperHomeData | null>(null);

// 获取首页数据
const fetchHomeData = async () => {
  try {
    loading.value = true;
    const res = await getDeveloperHomeDataApi();
    if (res.code === 0) {
      // 使用新对象引用,避免赋值同一引用时 Vue 跳过更新(如领取礼包后刷新)
      homeData.value = { ...res.data };
    } else {
      message.error(res.message || '获取数据失败');
    }
  } catch (error) {
    console.error('获取开发者首页数据失败:', error);
    message.error('获取数据失败');
  } finally {
    loading.value = false;
  }
};

// Token 消耗百分比
const tokenUsagePercent = computed(() => {
  if (!homeData.value) return 0;
  const { used, total } = homeData.value.tokenUsage;
  if (!total) return 0;
  return Math.min(Math.round((used / total) * 100), 100);
});

// Token 进度条颜色(根据使用率)
const tokenProgressColor = computed(() => {
  const percent = tokenUsagePercent.value;
  if (percent >= 80) return '#ef4444';
  if (percent >= 60) return '#f59e0b';
  return '#3b82f6';
});

// 是否未开通额度(总额度与已使用均为 0):展示新手礼包引导
const isTokenZero = computed(() => {
  if (!homeData.value) return false;
  const { used, total } = homeData.value.tokenUsage;
  return used === 0 && total === 0;
});

// 开启新手礼包
const handleClaimStarterPack = async () => {
  try {
    claiming.value = true;
    await claimStarterPackApi();
    message.success('新手礼包已开启,体验额度已到账');
    await fetchHomeData();
  } catch (error) {
    console.error('开启新手礼包失败:', error);
    message.error('开启失败,请重试');
  } finally {
    claiming.value = false;
  }
};

// 应用状态配置
const statusConfig: Record<
  AppStatus,
  { bg: string; color: string; text: string }
> = {
  developing: { text: '开发中', color: 'processing', bg: '#e6f4ff' },
  published: { text: '已发版', color: 'success', bg: '#f6ffed' },
};

// 格式化 Token 数字
function formatNumber(num: number): string {
  if (num >= 10_000) {
    return `${(num / 10_000).toFixed(1)}万`;
  }
  return num.toLocaleString();
}

// 跳转到应用详情
function handleAppClick(app: MyApp) {
  if (app.route) {
    router.push(app.route);
  } else {
    message.info(`${app.name} 暂未提供跳转入口`);
  }
}

// 跳转到快捷导航
function handleNavClick(nav: QuickNavItem) {
  if (nav.route) {
    router.push(nav.route);
  } else {
    message.info(`${nav.title} 暂未提供跳转入口`);
  }
}

onMounted(() => {
  fetchHomeData();
});
</script>

<template>
  <div v-loading="loading" class="developer-home">
    <!-- 第一行: 开发者信息 + Token 消耗 -->
    <div class="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <!-- 开发者信息 Card -->
      <Card :bordered="false" size="small" class="profile-card">
        <template #title>
          <div class="flex items-center gap-2">
            <Icon icon="lucide:user-circle-2" class="size-4 text-blue-600" />
            <span>开发者信息</span>
          </div>
        </template>

        <div v-if="homeData" class="flex items-center gap-4">
          <!-- 头像 -->
          <div
            class="flex size-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-2xl font-semibold text-white"
          >
            {{ homeData.profile.name?.slice(0, 1) || '?' }}
          </div>

          <!-- 基本信息 -->
          <div class="min-w-0 flex-1">
            <div class="flex items-baseline gap-2">
              <span class="truncate text-xl font-semibold text-gray-900">
                {{ homeData.profile.name }}
              </span>
              <Tag color="blue" class="m-0">{{ homeData.profile.role }}</Tag>
            </div>
            <div
              class="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500"
            >
              <div class="flex items-center gap-1">
                <Icon icon="lucide:building-2" class="size-3" />
                <span class="truncate">{{ homeData.profile.department }}</span>
              </div>
              <div class="flex items-center gap-1">
                <Icon icon="lucide:mail" class="size-3" />
                <span class="truncate">{{ homeData.profile.email }}</span>
              </div>
              <div class="flex items-center gap-1">
                <Icon icon="lucide:calendar-clock" class="size-3" />
                <span>加入时间: {{ homeData.profile.joinDate }}</span>
              </div>
              <div class="flex items-center gap-1">
                <Icon icon="lucide:app-window" class="size-3" />
                <span>已创建 {{ homeData.profile.totalApps }} 个应用</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <!-- Token 消耗 Card -->
      <Card :bordered="false" size="small" class="token-card">
        <template #title>
          <div class="flex items-center gap-2">
            <Icon icon="lucide:coins" class="size-4 text-amber-600" />
            <span>Token 消耗</span>
          </div>
        </template>

        <!-- 未开通额度:新手礼包引导 -->
        <div
          v-if="homeData && isTokenZero"
          class="flex flex-col items-center justify-center py-6 text-center"
        >
          <div
            class="mb-3 flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow"
          >
            <Icon icon="lucide:gift" class="size-7" />
          </div>
          <div class="text-sm font-medium text-gray-700">
            暂无可用 Token 额度
          </div>
          <div class="mt-1 text-xs text-gray-400">
            开启新手礼包,立即获得 100 万 Tokens 体验额度
          </div>
          <Button
            type="primary"
            class="mt-4"
            :loading="claiming"
            @click="handleClaimStarterPack"
          >
            <Icon icon="lucide:gift" class="mr-1 size-4" />
            开启新手礼包
          </Button>
        </div>

        <!-- 已开通:展示用量 -->
        <div v-else-if="homeData">
          <!-- 数字概览 -->
          <div class="mb-3 flex items-end justify-between">
            <div>
              <div class="text-xs text-gray-500">本周期已使用</div>
              <div class="mt-1 flex items-baseline gap-1">
                <span class="text-3xl font-bold text-blue-600">
                  {{ formatNumber(homeData.tokenUsage.used) }}
                </span>
                <span class="text-sm text-gray-500">
                  / {{ formatNumber(homeData.tokenUsage.total) }}
                  {{ homeData.tokenUsage.unit }}
                </span>
              </div>
            </div>
            <Tooltip title="预计可用天数基于过去 7 天平均使用量估算">
              <div
                class="flex items-center gap-1 rounded-md bg-orange-50 px-2 py-1 text-xs text-orange-600"
              >
                <Icon icon="lucide:hourglass" class="size-3" />
                预计可用 {{ homeData.tokenUsage.remainDays }} 天
              </div>
            </Tooltip>
          </div>

          <!-- 进度条 -->
          <Progress
            :percent="tokenUsagePercent"
            :stroke-color="tokenProgressColor"
            :show-info="false"
            :stroke-width="10"
          />

          <div class="mt-2 flex items-center justify-between text-xs">
            <span class="text-gray-500">已使用 {{ tokenUsagePercent }}%</span>
            <span class="text-gray-500">
              剩余
              {{
                formatNumber(
                  homeData.tokenUsage.total - homeData.tokenUsage.used,
                )
              }}
              {{ homeData.tokenUsage.unit }}
            </span>
          </div>

          <!-- 快捷统计 -->
          <div class="mt-3 grid grid-cols-3 gap-2 border-t pt-3">
            <div class="text-center">
              <div class="text-xs text-gray-500">今日消耗</div>
              <div class="mt-1 text-sm font-semibold text-gray-900">12.4K</div>
            </div>
            <div class="text-center">
              <div class="text-xs text-gray-500">本周消耗</div>
              <div class="mt-1 text-sm font-semibold text-gray-900">86.2K</div>
            </div>
            <div class="text-center">
              <div class="text-xs text-gray-500">本月消耗</div>
              <div class="mt-1 text-sm font-semibold text-gray-900">328.5K</div>
            </div>
          </div>
        </div>
      </Card>
    </div>

    <!-- 第二行: 我的应用 + 快捷导航 -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <!-- 我的应用 Card -->
      <Card :bordered="false" size="small">
        <template #title>
          <div class="flex items-center gap-2">
            <Icon icon="lucide:layout-grid" class="size-4 text-purple-600" />
            <span>我的应用</span>
            <Tag v-if="homeData" color="purple" class="m-0">
              {{ homeData.myApps.length }}
            </Tag>
          </div>
        </template>

        <div class="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          <div
            v-for="app in homeData?.myApps || []"
            :key="app.id"
            class="app-item group flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-all hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm"
            @click="handleAppClick(app)"
          >
            <!-- Logo -->
            <div
              :style="{ backgroundColor: app.logoBgColor || '#f1f5f9' }"
              class="flex size-11 shrink-0 items-center justify-center rounded-lg"
            >
              <Icon
                :icon="app.logo"
                :style="{ color: app.logoColor || '#475569' }"
                class="size-6"
              />
            </div>

            <!-- 信息 -->
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="truncate text-sm font-medium text-gray-900">
                  {{ app.name }}
                </span>
                <Tag
                  :color="statusConfig[app.status].color"
                  class="m-0"
                  style="padding: 0 6px; font-size: 11px; line-height: 18px"
                >
                  {{ statusConfig[app.status].text }}
                </Tag>
              </div>
              <div class="mt-1 line-clamp-1 text-xs text-gray-500">
                {{ app.description }}
              </div>
              <div class="mt-1 flex items-center gap-1 text-xs text-gray-400">
                <Icon icon="lucide:clock-3" class="size-3" />
                <span>更新于 {{ app.updatedAt }}</span>
              </div>
            </div>

            <!-- 箭头 -->
            <Icon
              icon="lucide:chevron-right"
              class="size-4 shrink-0 text-gray-300 transition-all group-hover:translate-x-1 group-hover:text-blue-500"
            />
          </div>
        </div>
      </Card>

      <!-- 快捷导航 Card -->
      <Card :bordered="false" size="small">
        <template #title>
          <div class="flex items-center gap-2">
            <Icon icon="lucide:compass" class="size-4 text-emerald-600" />
            <span>快捷导航</span>
          </div>
        </template>

        <div class="grid grid-cols-3 gap-3 p-1">
          <div
            v-for="(nav, index) in homeData?.quickNav || []"
            :key="nav.id"
            :class="{
              'rounded-bl-xl': index === 3,
              'rounded-br-xl': index === 4,
            }"
            class="nav-item group flex cursor-pointer flex-col items-center justify-center rounded-lg border p-4 transition-all hover:border-blue-300 hover:shadow-md"
            @click="handleNavClick(nav)"
          >
            <div
              :style="{ backgroundColor: `${nav.color}15` }"
              class="mb-2 flex size-12 items-center justify-center rounded-lg transition-transform group-hover:scale-110"
            >
              <Icon
                :icon="nav.icon"
                :style="{ color: nav.color }"
                class="size-6"
              />
            </div>
            <div class="text-sm font-medium text-gray-900">{{ nav.title }}</div>
            <div class="mt-1 text-xs text-gray-500">{{ nav.description }}</div>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.developer-home {
  min-height: calc(100vh - 100px);
  padding: 16px;
  background-color: #f5f5f5;
}

.profile-card,
.token-card {
  height: 100%;
}

.app-item {
  background-color: #fff;
}

.line-clamp-1 {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.nav-item {
  background-color: #fafafa;
}

.nav-item:hover {
  background-color: #fff;
}
</style>
