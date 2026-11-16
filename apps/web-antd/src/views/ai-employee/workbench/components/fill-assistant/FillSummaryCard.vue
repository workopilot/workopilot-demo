<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { Button } from 'ant-design-vue';

interface SummaryItem {
  amount: string;
  category: string;
  count: number;
  invoiceNos: string;
  status: 'pass' | 'warn';
  tip: string;
}

const props = defineProps<{
  allowance?: { amount: string; label: string };
  docTitle: string;
  items: SummaryItem[];
  total: string;
}>();

const emit = defineEmits<{
  confirm: [];
}>();

function handleConfirm() {
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
          <Icon icon="lucide:calculator" class="size-3" />
        </span>
        <h4 class="m-0 text-sm font-bold text-white">2. 费用汇总与合规校验</h4>
      </div>
      <span
        class="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white/90"
      >
        待确认
      </span>
    </div>

    <div class="space-y-3 p-4">
      <!-- 汇总明细 -->
      <div class="space-y-1.5">
        <div
          v-for="item in props.items"
          :key="item.category"
          class="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-bold text-slate-700">
                {{ item.category }}
              </span>
              <span class="text-[10px] text-slate-400">
                {{ item.count }} 张 · {{ item.invoiceNos }}
              </span>
            </div>
            <span class="text-xs font-bold text-slate-800">
              {{ item.amount }}
            </span>
          </div>
          <!-- AI 校验依据 -->
          <div
            class="mt-1 flex items-start gap-1 text-[11px] leading-snug"
            :class="
              item.status === 'pass' ? 'text-emerald-600' : 'text-amber-600'
            "
          >
            <Icon
              :icon="
                item.status === 'pass'
                  ? 'lucide:shield-check'
                  : 'lucide:alert-triangle'
              "
              class="mt-0.5 size-3 shrink-0"
            />
            <span>{{ item.tip }}</span>
          </div>
        </div>

        <!-- 差旅补贴 -->
        <div
          v-if="props.allowance"
          class="flex items-center justify-between rounded-lg border border-dashed border-violet-200 bg-violet-50/40 px-3 py-2"
        >
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-bold text-violet-700">差旅补贴</span>
            <span class="text-[10px] text-slate-400">
              {{ props.allowance.label }}
            </span>
          </div>
          <span class="text-xs font-bold text-violet-600">
            {{ props.allowance.amount }}
          </span>
        </div>
      </div>

      <!-- 合计 -->
      <div
        class="flex items-center justify-between rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 px-3 py-2.5"
      >
        <span class="text-xs font-bold text-slate-600">
          {{ props.docTitle }} 合计金额
        </span>
        <span class="text-lg font-black text-violet-700">
          {{ props.total }}
        </span>
      </div>

      <div class="flex justify-end">
        <Button
          type="primary"
          class="flex items-center gap-1.5 rounded-lg bg-violet-600 px-5 text-sm font-bold hover:!bg-violet-700"
          @click="handleConfirm"
        >
          <Icon icon="lucide:file-check-2" class="size-4" />
          确认无误，生成报销单
        </Button>
      </div>
    </div>
  </div>
</template>
