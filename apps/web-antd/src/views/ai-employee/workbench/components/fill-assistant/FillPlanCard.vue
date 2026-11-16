<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { Button } from 'ant-design-vue';

interface FillStep {
  desc: string;
  title: string;
}

const props = defineProps<{
  docType: string;
  invoiceCount: number;
  invoiceTotal: string;
  period: string;
  steps: FillStep[];
}>();

const emit = defineEmits<{
  confirm: [];
}>();

function handleStart() {
  emit('confirm');
}
</script>

<template>
  <div
    class="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-lg shadow-violet-100/40"
  >
    <!-- Card Header -->
    <div
      class="flex items-center justify-between bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3"
    >
      <div class="flex items-center gap-2">
        <span
          class="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-white"
        >
          <Icon icon="lucide:clipboard-list" class="size-3" />
        </span>
        <h4 class="m-0 text-sm font-bold text-white">填报方案已生成</h4>
      </div>
      <span
        class="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white/90"
      >
        待确认
      </span>
    </div>

    <div class="space-y-3 p-4">
      <!-- 任务理解 -->
      <div class="rounded-xl bg-violet-50/60 p-3">
        <div
          class="mb-2 flex items-center gap-1.5 text-xs font-bold text-violet-700"
        >
          <Icon icon="lucide:brain-circuit" class="size-3.5" />
          任务理解
        </div>
        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="rounded-lg bg-white p-2 shadow-sm">
            <div class="text-[10px] text-slate-400">单据类型</div>
            <div class="mt-0.5 text-xs font-bold text-slate-800">
              {{ props.docType }}
            </div>
          </div>
          <div class="rounded-lg bg-white p-2 shadow-sm">
            <div class="text-[10px] text-slate-400">报销期间</div>
            <div class="mt-0.5 text-xs font-bold text-slate-800">
              {{ props.period }}
            </div>
          </div>
          <div class="rounded-lg bg-white p-2 shadow-sm">
            <div class="text-[10px] text-slate-400">命中发票</div>
            <div class="mt-0.5 text-xs font-bold text-violet-600">
              {{ props.invoiceCount }} 张 · {{ props.invoiceTotal }}
            </div>
          </div>
        </div>
      </div>

      <!-- 填报步骤预览 -->
      <div>
        <div
          class="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-600"
        >
          <Icon icon="lucide:list-checks" class="size-3.5 text-violet-600" />
          填报步骤
        </div>
        <div class="space-y-1.5">
          <div
            v-for="(step, index) in props.steps"
            :key="step.title"
            class="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2"
          >
            <span
              class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-[10px] font-bold text-white"
            >
              {{ index + 1 }}
            </span>
            <div class="min-w-0">
              <div class="text-xs font-bold text-slate-700">
                {{ step.title }}
              </div>
              <div class="truncate text-[11px] text-slate-400">
                {{ step.desc }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end">
        <Button
          type="primary"
          class="flex items-center gap-1.5 rounded-lg bg-violet-600 px-5 text-sm font-bold hover:!bg-violet-700"
          @click="handleStart"
        >
          <Icon icon="lucide:rocket" class="size-4" />
          开始填报
        </Button>
      </div>
    </div>
  </div>
</template>
