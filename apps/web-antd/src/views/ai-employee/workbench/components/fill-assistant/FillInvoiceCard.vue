<script setup lang="ts">
import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Checkbox } from 'ant-design-vue';

interface FillInvoice {
  amount: string;
  anomaly?: string;
  date: string;
  id: string;
  number: string;
  seller: string;
  type: string;
}

const props = defineProps<{
  invoices: FillInvoice[];
  matchBasis: string;
}>();

const emit = defineEmits<{
  confirm: [selected: FillInvoice[]];
}>();

// 默认勾选无异常的发票
const selectedIds = ref<Set<string>>(
  new Set(props.invoices.filter((inv) => !inv.anomaly).map((inv) => inv.id)),
);

const selectedList = computed(() =>
  props.invoices.filter((inv) => selectedIds.value.has(inv.id)),
);

const selectedTotal = computed(() => {
  const sum = selectedList.value.reduce(
    (acc, inv) =>
      acc + Number.parseFloat(inv.amount.replaceAll(/[¥,]/g, '') || '0'),
    0,
  );
  return `¥${sum.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
});

function toggleInvoice(id: string) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id);
  } else {
    selectedIds.value.add(id);
  }
}

function handleConfirm() {
  if (selectedList.value.length === 0) {
    return;
  }
  emit('confirm', selectedList.value);
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
          <Icon icon="lucide:scan-search" class="size-3" />
        </span>
        <h4 class="m-0 text-sm font-bold text-white">1. 发票智能筛选</h4>
      </div>
      <span
        class="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white/90"
      >
        待确认
      </span>
    </div>

    <div class="space-y-3 p-4">
      <!-- AI 依据 -->
      <div
        class="flex items-start gap-2 rounded-xl bg-violet-50/60 px-3 py-2 text-[11px] leading-relaxed text-violet-700"
      >
        <Icon icon="lucide:brain-circuit" class="mt-0.5 size-3.5 shrink-0" />
        <span>AI 依据：{{ props.matchBasis }}</span>
      </div>

      <!-- 发票列表 -->
      <div class="space-y-1.5">
        <div
          v-for="inv in props.invoices"
          :key="inv.id"
          class="flex items-center gap-2 rounded-lg border px-2.5 py-2 transition-colors"
          :class="
            inv.anomaly
              ? 'border-amber-200 bg-amber-50/60'
              : selectedIds.has(inv.id)
                ? 'border-violet-200 bg-violet-50/40'
                : 'border-slate-100 bg-slate-50/60'
          "
        >
          <Checkbox
            :checked="selectedIds.has(inv.id)"
            class="shrink-0"
            @change="toggleInvoice(inv.id)"
          />
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-bold text-slate-700">
                {{ inv.type }}
              </span>
              <span class="font-mono text-[10px] text-slate-400">
                {{ inv.number }}
              </span>
              <span
                v-if="inv.anomaly"
                class="flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-600"
              >
                <Icon icon="lucide:alert-triangle" class="size-2.5" />
                {{ inv.anomaly }}
              </span>
            </div>
            <div class="mt-0.5 truncate text-[11px] text-slate-400">
              {{ inv.seller }} · {{ inv.date }}
            </div>
          </div>
          <span class="shrink-0 text-xs font-bold text-slate-800">
            {{ inv.amount }}
          </span>
        </div>
      </div>

      <!-- 汇总 -->
      <div
        class="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
      >
        <span class="text-xs font-medium text-slate-500">
          已选
          <span class="font-bold text-violet-600">
            {{ selectedList.length }}
          </span>
          / {{ props.invoices.length }} 张
        </span>
        <span class="text-xs font-medium text-slate-500">
          合计
          <span class="text-sm font-bold text-slate-800">
            {{ selectedTotal }}
          </span>
        </span>
      </div>

      <div class="flex justify-end">
        <Button
          type="primary"
          :disabled="selectedList.length === 0"
          class="flex items-center gap-1.5 rounded-lg bg-violet-600 px-5 text-sm font-bold hover:!bg-violet-700"
          @click="handleConfirm"
        >
          <Icon icon="lucide:check" class="size-4" />
          确认发票，进入下一步
        </Button>
      </div>
    </div>
  </div>
</template>
