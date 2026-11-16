<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';

import BillingSidebar from './components/sidebar.vue';
import TenantDataStatistics from './components/tenant-data-statistics.vue';
import UsageDetail from './components/usage-detail.vue';

const route = useRoute();

const activeModule = ref<string>('tenant-data-statistics');

const breadcrumbMap: Record<string, string> = {
  'usage-detail': '使用明细',
  'tenant-data-statistics': '租户数据统计',
};

function handleNavigationChange(module: string) {
  activeModule.value = module;
}
</script>

<template>
  <div class="flex h-full overflow-hidden bg-background">
    <BillingSidebar
      :active-module="activeModule"
      @change="handleNavigationChange"
    />

    <div class="flex flex-1 flex-col overflow-hidden">
      <div class="border-b bg-muted/40 px-6 py-3">
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <span>租户计费统计</span>
          <span>/</span>
          <span class="text-foreground">{{ breadcrumbMap[activeModule] }}</span>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto">
        <Transition name="fade" mode="out-in">
          <TenantDataStatistics
            v-if="activeModule === 'tenant-data-statistics'"
          />
          <UsageDetail v-else-if="activeModule === 'usage-detail'" />
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
