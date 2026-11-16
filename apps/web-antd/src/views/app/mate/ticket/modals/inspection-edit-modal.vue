<script setup lang="ts">
import type { InspectionPlan } from '#/types/inspection';

import { Alert, Input, InputNumber, Modal, Select } from 'ant-design-vue';

defineProps<{ busy: boolean; pendingCount: number; plan?: InspectionPlan }>();
defineEmits<{ save: [] }>();
const open = defineModel<boolean>('open');
const form = defineModel<{
  advanceDays: number;
  frequency: string;
  name: string;
  nextDate: string;
  owner: string;
}>('form', { required: true });
</script>
<template>
  <Modal
    v-model:open="open"
    title="编辑巡检计划"
    :width="600"
    :confirm-loading="busy"
    ok-text="确认保存"
    cancel-text="取消"
    @ok="$emit('save')"
  >
    <Alert
      class="mb-5"
      type="info"
      show-icon
      :message="`本次修改影响 ${pendingCount} 次未生成工单的排期；已生成工单不受影响。`"
    />
    <div class="grid gap-4">
      <label>
        计划名称
        <Input v-model:value="form.name" :maxlength="80" />
      </label>
      <label>
        负责人
        <Input v-model:value="form.owner" :maxlength="30" />
      </label>
      <label>
        巡检频次
        <Select
          v-model:value="form.frequency"
          class="w-full"
          :options="[
            { label: '每月', value: '每月' },
            { label: '每季度', value: '每季度' },
          ]"
          :disabled="!pendingCount"
        />
      </label>
      <label v-if="pendingCount">
        首次待生成执行日期
        <Input
          v-model:value="form.nextDate"
          type="date"
          :min="plan?.start"
          :max="plan?.end"
        />
        <span class="text-xs text-slate-500">
          后续按所选频次重新排期，合同有效期：{{ plan?.start }} 至
          {{ plan?.end }}
        </span>
      </label>
      <label>
        工单提前生成天数
        <InputNumber
          v-model:value="form.advanceDays"
          class="!w-full"
          :min="0"
          :max="30"
          :precision="0"
        />
      </label>
    </div>
  </Modal>
</template>
