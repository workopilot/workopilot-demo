<script setup lang="ts">
import { computed } from 'vue';

import { Progress } from 'ant-design-vue';

const props = defineProps({
  title: { type: String, default: 'Lite' },
  total: { type: Number, default: 1000 },
  remaining: { type: Number, default: 500 },
  expireDate: { type: String, default: '2026-05-01' },
  lastRechargeDate: { type: String, default: '2026-04-01' },
  color: { type: String, default: '#0960bd' },
});

const percent = computed(() => {
  if (props.total <= 0) return 0;
  return Math.round((props.remaining / props.total) * 100);
});
</script>

<template>
  <div
    class="relative flex flex-col gap-3 overflow-hidden rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
  >
    <div
      class="absolute right-0 top-0 -mr-10 -mt-10 h-24 w-24 rounded-full bg-primary/10 blur-xl"
    ></div>
    <div class="z-10 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-lg font-bold text-slate-800 dark:text-slate-100"
          >{{ title }} 包</span
        >
        <span
          class="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs text-primary"
          >生效中</span
        >
      </div>
      <div class="text-sm text-slate-500">{{ expireDate }} 到期</div>
    </div>

    <div class="z-10 mt-2 flex flex-col gap-1">
      <div class="mb-1 flex justify-between text-sm">
        <span class="text-slate-500">剩余调用次数</span>
        <span class="font-semibold">{{ remaining }} / {{ total }}</span>
      </div>
      <Progress :percent="percent" :stroke-color="color" :show-info="false" />
    </div>

    <div class="z-10 mt-2 flex justify-between text-xs text-slate-400">
      <span>最近充值: {{ lastRechargeDate }}</span>
    </div>
  </div>
</template>
