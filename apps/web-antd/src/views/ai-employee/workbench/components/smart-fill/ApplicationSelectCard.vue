<script setup lang="ts">
import { ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Checkbox, message } from 'ant-design-vue';

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
const selectedApplications = ref<string[]>(
  props.initialSelectedApplications || [],
);

function handleConfirm() {
  if (selectedApplications.value.length === 0) {
    message.warning('请至少选择一份差旅申请单');
    return;
  }
  submitting.value = true;
  emit('confirm', { selectedApplications: [...selectedApplications.value] });
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
        <h4 class="m-0 text-sm font-bold text-white">1. 关联差旅申请单</h4>
      </div>
      <span
        class="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white/90"
      >
        待选择
      </span>
    </div>

    <div class="space-y-3 p-4">
      <p class="mb-3 text-xs text-slate-500">
        请选择需要关联的差旅申请单，系统将根据选中申请单的明细生成行程。
      </p>

      <div class="space-y-2">
        <Checkbox.Group v-model:value="selectedApplications" class="!w-full">
          <label
            v-for="app in availableApplications"
            :key="app.id"
            class="!mb-2 flex cursor-pointer items-center gap-3 rounded-lg border border-slate-100 bg-white p-3 text-sm transition-all hover:border-teal-200"
            :class="{
              'border-teal-300 bg-teal-50/50': selectedApplications.includes(
                app.id,
              ),
            }"
          >
            <Checkbox :value="app.id" />
            <div class="min-w-0 flex-1">
              <div class="font-bold text-slate-800">
                {{ app.id }} {{ app.title }}
              </div>
              <div class="text-xs text-slate-500">
                {{ app.dateRange }} · {{ app.description }}
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
          确认，进入行程编辑
        </Button>
      </div>
    </div>
  </div>
</template>
