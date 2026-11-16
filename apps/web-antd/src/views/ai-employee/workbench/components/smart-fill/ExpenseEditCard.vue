<script setup lang="ts">
import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Input, InputNumber, message, Select } from 'ant-design-vue';

interface ExpenseItem {
  category: string;
  invoiceType: string;
  invoiceNo: string;
  invoiceAmount: string;
  reimbursementAmount: string;
  detail: string;
  attachment: string;
  trip: string;
  anomalyWarning?: string;
  modifyDescription?: string;
  checkInDate?: string;
  checkOutDate?: string;
  guests?: string;
  nights?: string;
}

const props = defineProps<{
  allowanceLabel: string;
  initialExpenses: ExpenseItem[];
  selectedInvoices: string[];
  totalAllowance: number;
}>();

const emit = defineEmits<{
  confirm: [data: { expenseItems: ExpenseItem[] }];
  save: [data: { expenseItems: ExpenseItem[] }];
}>();

const submitting = ref(false);
const expenseItems = ref<ExpenseItem[]>(
  props.initialExpenses.map((e) => ({ ...e })),
);
const fileInputs = ref<Map<number, HTMLInputElement>>(new Map());
const allowanceModifyDesc = ref('');

const expenseCategories = [
  '火车票',
  '市内交通费',
  '其他',
  '国内住宿费',
  '国内餐费',
  '业务招待费',
];

const totalAmount = computed(() => {
  const items = expenseItems.value;
  const sum = items.reduce((acc, item) => {
    return (
      acc +
      Number.parseFloat(item.reimbursementAmount.replaceAll(/[¥,]/g, '') || '0')
    );
  }, 0);
  return `¥${sum.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
});

const hasAnomalies = computed(() => {
  return expenseItems.value.some(
    (item) => item.anomalyWarning && item.anomalyWarning.trim().length > 0,
  );
});

function setFileInputRef(index: number, el: HTMLInputElement | null) {
  if (el) {
    fileInputs.value.set(index, el);
  }
}

function handleUpload(index: number) {
  const input = fileInputs.value.get(index);
  if (input) {
    input.value = '';
    input.click();
  }
}

function onFileSelected(event: Event, index: number) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    expenseItems.value[index].attachment = file.name;
    message.success(`已上传：${file.name}`);
  }
}

function updateAmount(item: ExpenseItem, value: null | number) {
  if (value !== null) {
    item.reimbursementAmount = `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

function handleSave() {
  expenseItems.value.forEach((item) => {
    const desc = (item.modifyDescription || '').trim();

    if (desc) {
      const guestMatch = desc.match(/人数[：:]?\s*(\d+)/);
      if (guestMatch) {
        item.guests = guestMatch[1];
      }

      const checkInMatch = desc.match(
        /入住?(?:日期)?[：:]\s*(\d{4}-\d{2}-\d{2})/,
      );
      if (checkInMatch) {
        item.checkInDate = checkInMatch[1];
      }

      const checkOutMatch = desc.match(
        /(?:离店|离)(?:日期)?[：:]\s*(\d{4}-\d{2}-\d{2})/,
      );
      if (checkOutMatch) {
        item.checkOutDate = checkOutMatch[1];
      }

      if (desc.includes('水单') || desc.includes('已上传')) {
        item.attachment = '已上传';
      }

      if (item.category === '国内住宿费') {
        const parts: string[] = [];
        if (item.guests) parts.push(`人数：${item.guests}人`);
        if (item.checkInDate) parts.push(`入住日期：${item.checkInDate}`);
        if (item.checkOutDate) parts.push(`离店日期：${item.checkOutDate}`);
        if (parts.length > 0) {
          item.detail = parts.join('；');
        }
      }
    }

    // Always clear anomaly warnings that have been addressed
    if (item.anomalyWarning) {
      const remaining: string[] = [];
      if (
        item.anomalyWarning.includes('待上传水单') &&
        (!item.attachment || item.attachment === '—')
      ) {
        remaining.push('待上传水单');
      }
      if (item.anomalyWarning.includes('人数待补充') && !item.guests) {
        remaining.push('人数待补充');
      }
      item.anomalyWarning =
        remaining.length > 0 ? remaining.join('；') : undefined;
    }
  });
  emit('save', { expenseItems: expenseItems.value.map((e) => ({ ...e })) });
  message.success('修改信息已保存，异常提示已更新');
}

function handleConfirm() {
  submitting.value = true;
  emit('confirm', { expenseItems: expenseItems.value.map((e) => ({ ...e })) });
  message.success('费用明细已确认');
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
          <Icon icon="lucide:receipt" class="size-3" />
        </span>
        <h4 class="m-0 text-sm font-bold text-white">5. 费用明细编辑</h4>
      </div>
      <span
        class="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white/90"
      >
        待编辑
      </span>
    </div>

    <div class="space-y-3 p-4">
      <p class="mb-3 text-xs text-slate-500">
        已确认
        {{ selectedInvoices.length }}
        张发票，系统已自动匹配费用明细，可编辑调整。
      </p>

      <div class="overflow-x-auto rounded-lg border border-slate-200">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-slate-500">
            <tr>
              <th class="px-2 py-2">科目</th>
              <th class="px-2 py-2">发票号码</th>
              <th class="px-2 py-2">发票金额</th>
              <th class="px-2 py-2">报销金额</th>
              <th class="px-2 py-2">详细信息</th>
              <th class="px-2 py-2">附件</th>
              <th class="px-2 py-2">异常提示</th>
              <th class="px-2 py-2">详细信息修改说明</th>
              <th class="px-2 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, index) in expenseItems"
              :key="index"
              class="border-t border-slate-100"
            >
              <td class="px-2 py-1.5">
                <Select
                  v-model:value="item.category"
                  size="small"
                  class="!w-20 !text-xs"
                >
                  <Select.Option
                    v-for="cat in expenseCategories"
                    :key="cat"
                    :value="cat"
                  >
                    {{ cat }}
                  </Select.Option>
                </Select>
              </td>
              <td
                class="whitespace-nowrap px-2 py-1.5 font-mono text-slate-600"
              >
                {{ item.invoiceNo }}
              </td>
              <td class="whitespace-nowrap px-2 py-1.5 font-bold text-red-600">
                {{ item.invoiceAmount }}
              </td>
              <td class="px-2 py-1.5">
                <InputNumber
                  :value="
                    Number.parseFloat(
                      item.reimbursementAmount.replace(/[¥,]/g, ''),
                    )
                  "
                  :min="0"
                  :step="0.01"
                  size="small"
                  class="!w-20 !text-xs"
                  @change="(val: number | null) => updateAmount(item, val)"
                />
              </td>
              <td class="max-w-[120px] px-2 py-1.5">
                <span class="text-slate-500">{{ item.detail || '—' }}</span>
              </td>
              <td class="px-2 py-1.5">
                <span
                  v-if="item.attachment && item.attachment !== '—'"
                  class="text-teal-600"
                >
                  <Icon icon="lucide:paperclip" class="mr-0.5 inline size-3" />
                  {{ item.attachment }}
                </span>
                <span v-else class="text-slate-400">—</span>
              </td>
              <td class="px-2 py-1.5">
                <span v-if="item.anomalyWarning" class="text-amber-600">
                  <Icon
                    icon="lucide:alert-triangle"
                    class="mr-0.5 inline size-3"
                  />
                  {{ item.anomalyWarning }}
                </span>
                <span v-else class="text-slate-400">—</span>
              </td>
              <td class="px-2 py-1.5">
                <Input
                  v-model:value="item.modifyDescription"
                  size="small"
                  class="!w-24 !text-xs"
                  placeholder="例：人数2"
                />
              </td>
              <td class="px-2 py-1.5">
                <input
                  :ref="
                    (el: any) => setFileInputRef(index, el as HTMLInputElement)
                  "
                  type="file"
                  class="hidden"
                  @change="(e: Event) => onFileSelected(e, index)"
                />
                <Button
                  type="link"
                  size="small"
                  class="!h-auto !p-0 !text-xs text-blue-600"
                  @click="handleUpload(index)"
                >
                  <Icon icon="lucide:upload" class="size-3" />
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 差旅补贴 -->
      <div class="rounded-lg bg-teal-50/50 p-3 text-sm">
        <div class="flex items-center justify-between">
          <span class="font-medium text-slate-600">{{ allowanceLabel }}</span>
          <span class="font-bold text-green-600">
            ¥{{ totalAllowance.toFixed(2) }}
          </span>
        </div>
        <div class="mt-2 flex items-center gap-2">
          <span class="text-xs text-slate-400">补贴修改说明</span>
          <Input
            v-model:value="allowanceModifyDesc"
            size="small"
            class="!w-48 !text-xs"
            placeholder="例：天数改为3天"
          />
        </div>
      </div>

      <div class="rounded-lg bg-blue-50/50 p-3 text-sm">
        <div class="flex items-center justify-between">
          <span class="font-bold text-slate-700">合计报销金额</span>
          <span class="text-lg font-bold text-red-600">{{ totalAmount }}</span>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <Button
          type="default"
          class="flex items-center gap-1.5 rounded-lg border-teal-300 px-5 text-sm font-bold text-teal-700"
          @click="handleSave"
        >
          <Icon icon="lucide:save" class="size-4" />
          修改信息
        </Button>
        <Button
          type="primary"
          class="flex items-center gap-1.5 rounded-lg bg-teal-600 px-5 text-sm font-bold hover:!bg-teal-700"
          :disabled="submitting || hasAnomalies"
          @click="handleConfirm"
        >
          <Icon icon="lucide:check" class="size-4" />
          确认费用，生成待办卡片
        </Button>
      </div>
    </div>
  </div>
</template>
