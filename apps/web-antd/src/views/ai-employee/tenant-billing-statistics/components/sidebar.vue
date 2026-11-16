<script setup lang="ts">
import { computed } from 'vue';

import { Icon } from '@iconify/vue';

interface MenuItem {
  key: string;
  label: string;
  icon: string;
}

const props = defineProps<{
  activeModule: string;
}>();

const emit = defineEmits<{
  change: [module: string];
}>();

const menuItems = computed(() => [
  {
    key: 'tenant-data-statistics',
    label: '租户数据统计',
    icon: 'lucide:bar-chart-3',
  },
  {
    key: 'usage-detail',
    label: '使用明细',
    icon: 'lucide:list-checks',
  },
]);

function handleMenuClick(key: string) {
  emit('change', key);
}
</script>

<template>
  <div class="w-[220px] border-r bg-sidebar">
    <div class="flex h-full flex-col">
      <nav class="flex-1 p-2">
        <div
          v-for="item in menuItems"
          :key="item.key"
          class="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all"
          :class="[
            activeModule === item.key
              ? 'border-l-4 border-primary bg-primary/10 font-medium text-primary'
              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
          ]"
          @click="handleMenuClick(item.key)"
        >
          <Icon :icon="item.icon" class="size-4" />
          <span>{{ item.label }}</span>
        </div>
      </nav>
    </div>
  </div>
</template>
