<script setup lang="ts">
import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import { message, Table } from 'ant-design-vue';

interface Invoice {
  id: string;
  type: string;
  seller: string;
  number: string;
  amount: string;
  date: string;
  basis: string;
}

const props = defineProps<{
  availableInvoices: Invoice[];
  initialSelectedInvoices?: string[];
}>();

const emit = defineEmits<{
  confirm: [data: { selectedInvoices: string[] }];
}>();

const submitting = ref(false);
const selectedKeys = ref<string[]>(props.initialSelectedInvoices || []);

const columns = [
  { title: '发票类型', dataIndex: 'type', key: 'type', width: 130 },
  { title: '销方名称', dataIndex: 'seller', key: 'seller' },
  { title: '发票号码', dataIndex: 'number', key: 'number', width: 110 },
  { title: '发票金额', dataIndex: 'amount', key: 'amount', width: 100 },
  { title: '开票日期', dataIndex: 'date', key: 'date', width: 100 },
];

const rowSelection = computed(() => ({
  selectedRowKeys: selectedKeys.value,
  onChange: (keys: any[]) => {
    selectedKeys.value = keys as string[];
  },
}));

function handleConfirm() {
  if (selectedKeys.value.length === 0) {
    message.warning('请至少选择一张发票');
    return;
  }
  submitting.value = true;
  emit('confirm', { selectedInvoices: [...selectedKeys.value] });
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
          <Icon icon="lucide:receipt" class="size-3" />
        </span>
        <h4 class="m-0 text-sm font-bold text-white">4. 选择发票</h4>
      </div>
      <span
        class="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white/90"
      >
        待选择
      </span>
    </div>

    <div class="space-y-3 p-4">
      <Table
        :columns="columns"
        :data-source="availableInvoices"
        :pagination="false"
        :row-selection="rowSelection"
        :row-key="(record: Invoice) => record.id"
        size="middle"
        class="modern-table overflow-hidden rounded-xl border border-slate-200 !bg-white text-sm shadow-sm"
      />

      <div class="rounded-lg bg-blue-50/50 p-3 text-xs">
        <div class="flex items-center gap-2">
          <Icon icon="lucide:info" class="size-4 text-blue-500" />
          <span class="font-medium text-slate-600">
            请确认数据，确认后进入下一步
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
