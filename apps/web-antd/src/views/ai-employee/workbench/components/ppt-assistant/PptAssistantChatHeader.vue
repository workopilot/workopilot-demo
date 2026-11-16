<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { Avatar, Button } from 'ant-design-vue';

interface AgentProfile {
  image: string;
  name: string;
  role: string;
}

interface MenuItem {
  label: string;
}

const props = defineProps<{
  activeMenu: MenuItem;
  agent: AgentProfile;
  operationSteps: string[];
}>();
</script>

<template>
  <div
    class="flex h-16 items-center justify-between gap-4 border-b border-slate-100 px-6"
  >
    <div class="flex shrink-0 items-center gap-3">
      <Avatar :src="agent.image" :size="36" />
      <div>
        <div
          class="flex items-center gap-2 text-base font-black text-slate-900"
        >
          {{ agent.name }}
          <span class="size-2 rounded-full bg-emerald-500"></span>
        </div>
        <div class="text-xs font-medium text-slate-400">
          {{ agent.role }} · 当前模块：{{ activeMenu.label }}
        </div>
      </div>
    </div>

    <div
      class="hidden min-w-0 flex-1 items-center justify-center overflow-x-auto xl:flex"
    >
      <div
        class="flex items-center rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 shadow-inner shadow-emerald-900/5"
      >
        <template v-for="(step, index) in operationSteps" :key="step">
          <div class="flex shrink-0 items-center gap-1.5">
            <span
              class="flex size-5 items-center justify-center rounded-full bg-emerald-950 text-[10px] font-black text-white"
            >
              {{ index + 1 }}
            </span>
            <span class="text-xs font-black text-slate-700">{{ step }}</span>
          </div>
          <Icon
            v-if="index < operationSteps.length - 1"
            icon="lucide:chevron-right"
            class="mx-1.5 size-3.5 shrink-0 text-emerald-400"
          />
        </template>
      </div>
    </div>

    <div class="flex shrink-0 gap-2 text-slate-600">
      <Button shape="circle" class="!flex !items-center !justify-center">
        <Icon icon="lucide:phone" class="size-4" />
      </Button>
      <Button shape="circle" class="!flex !items-center !justify-center">
        <Icon icon="lucide:panel-right-open" class="size-4" />
      </Button>
    </div>
  </div>
</template>
