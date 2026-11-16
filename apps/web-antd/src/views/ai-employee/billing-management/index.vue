<script setup lang="ts">
import { ref } from 'vue';

import PlatformStatistics from './components/platform-statistics.vue';
import BillingSidebar from './components/sidebar.vue';
import TenantStatistics from './components/tenant-statistics.vue';
import TokenUsage from './components/token-usage.vue';
import UsageDetail from './components/usage-detail.vue';

// 当前激活的模块
const activeModule = ref<string>('usage-detail');

// 面包屑映射
const breadcrumbMap: Record<string, string> = {
  'usage-detail': '次数使用明细',
  'token-usage': 'Token 使用明细',
  'tenant-statistics': '租户数据统计',
  'platform-statistics': '平台数据统计',
};

// 处理导航切换
function handleNavigationChange(module: string) {
  activeModule.value = module;
}
</script>

<template>
  <div class="flex h-full overflow-hidden bg-background">
    <!-- 左侧导航栏 -->
    <BillingSidebar
      :active-module="activeModule"
      @change="handleNavigationChange"
    />

    <!-- 右侧内容区 -->
    <div class="flex flex-1 flex-col overflow-hidden">
      <!-- 面包屑 -->
      <div class="border-b bg-muted/40 px-6 py-3">
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <span>计费管理</span>
          <span>/</span>
          <span class="text-foreground">{{ breadcrumbMap[activeModule] }}</span>
        </div>
      </div>

      <!-- 动态内容区 -->
      <div class="flex-1 overflow-y-auto p-6">
        <Transition name="fade" mode="out-in">
          <UsageDetail v-if="activeModule === 'usage-detail'" />
          <TokenUsage v-else-if="activeModule === 'token-usage'" />
          <TenantStatistics v-else-if="activeModule === 'tenant-statistics'" />
          <PlatformStatistics
            v-else-if="activeModule === 'platform-statistics'"
          />
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 页面切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
