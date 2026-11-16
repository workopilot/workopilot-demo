<script setup lang="ts">
import { ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Checkbox, message, Tag } from 'ant-design-vue';

interface Invoice {
  id: string;
  type: string;
  seller: string;
  number: string;
  amount: string;
  date: string;
}

const props = defineProps<{
  initialSelectedInvoices?: string[];
  matchedInvoices: Invoice[];
}>();

const emit = defineEmits<{
  confirm: [data: { selectedInvoices: string[] }];
}>();

const submitting = ref(false);
const selectedInvoices = ref<string[]>(props.initialSelectedInvoices || []);

function handleConfirm() {
  if (selectedInvoices.value.length === 0) {
    message.warning('请至少选择一张发票');
    return;
  }
  submitting.value = true;
  emit('confirm', { selectedInvoices: [...selectedInvoices.value] });
  message.success('发票已确认');
}
</script>

<template>
  <div
    class="overflow-hidden rounded-2xl border border-teal-100 bg-white shadow-lg shadow-teal-100/30"
  >
    <div
      class="flex items-center justify-between bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-3"
    >
      <div class="flex items-center gap-2">
        <span
          class="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs text-white"
        >
          <Icon icon="lucide:search-check" class="size-3" />
        </span>
        <h4 class="m-0 text-sm font-bold text-white">4. 发票确认</h4>
      </div>
      <span
        class="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white/90"
      >
        待选择
      </span>
    </div>

    <div class="space-y-3 p-4">
      <p class="mb-3 text-xs text-slate-500">
        系统已根据行程日期和公司信息匹配到以下发票，请勾选需要报销的发票：
      </p>

      <div class="space-y-2">
        <Checkbox.Group v-model:value="selectedInvoices" class="!w-full">
          <label
            v-for="inv in matchedInvoices"
            :key="inv.id"
            class="!mb-2 flex cursor-pointer items-center gap-3 rounded-lg border border-slate-100 bg-white p-2.5 text-sm transition-all hover:border-teal-200"
            :class="{
              'border-teal-300 bg-teal-50/50': selectedInvoices.includes(
                inv.id,
              ),
            }"
          >
            <Checkbox :value="inv.id" />
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <Tag
                  class="!m-0 !text-[10px]"
                  :color="inv.type.includes('专用') ? 'blue' : 'green'"
                >
                  {{ inv.type }}
                </Tag>
                <span class="font-bold text-slate-800">{{ inv.seller }}</span>
              </div>
              <div class="mt-0.5 text-xs text-slate-500">
                {{ inv.number }} · {{ inv.date }} ·
                <span class="font-bold text-red-600">{{ inv.amount }}</span>
              </div>
            </div>
          </label>
        </Checkbox.Group>
      </div>

      <div class="flex justify-end pt-2">
        <Button
          type="primary"
          class="flex items-center gap-1.5 rounded-lg bg-teal-600 px-5 text-sm font-bold hover:!bg-teal-700"
          :disabled="submitting"
          @click="handleConfirm"
        >
          <Icon icon="lucide:check" class="size-4" />
          确认，生成费用明细
        </Button>
      </div>
    </div>
  </div>
</template>
