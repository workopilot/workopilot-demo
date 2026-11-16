<script setup lang="ts">
import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import { message, Table } from 'ant-design-vue';

interface Application {
  id: string;
  title: string;
  dateRange: string;
  description: string;
}

const props = defineProps<{
  availableApplications: Application[];
  initialSelectedApplications?: string[];
}>();

const emit = defineEmits<{
  confirm: [data: { selectedApplications: string[] }];
}>();

const submitting = ref(false);
const selectedKeys = ref<string[]>(props.initialSelectedApplications || []);

const columns = [
  { title: '申请单号', dataIndex: 'id', key: 'id', width: 150 },
  { title: '主题', dataIndex: 'title', key: 'title' },
  { title: '出差日期', dataIndex: 'dateRange', key: 'dateRange', width: 180 },
  { title: '事项描述', dataIndex: 'description', key: 'description' },
];

const rowSelection = computed(() => ({
  selectedRowKeys: selectedKeys.value,
  onChange: (keys: any[]) => {
    selectedKeys.value = keys as string[];
  },
}));

function handleConfirm() {
  if (selectedKeys.value.length === 0) {
    message.warning('请至少选择一份差旅申请单');
    return;
  }
  submitting.value = true;
  emit('confirm', { selectedApplications: [...selectedKeys.value] });
  message.success('关联申请单已确认');
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
          <Icon icon="lucide:link" class="size-3" />
        </span>
        <h4 class="m-0 text-sm font-bold text-white">3. 选择差旅申请单</h4>
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
        :data-source="availableApplications"
        :pagination="false"
        :row-selection="rowSelection"
        :row-key="(record: Application) => record.id"
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
