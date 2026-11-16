<script setup lang="ts">
import type { InspectionPlan } from '#/types/inspection';

import { ref, watch } from 'vue';

import { Button, Input, message, Tag } from 'ant-design-vue';

import { acknowledgeContractBusinessChange } from '#/api/contract-business';
import {
  getContractOperationPermission,
  getContractRelatedItems,
} from '#/api/mock-contract-assistant';

const props = defineProps<{ plan: InspectionPlan }>();
const emit = defineEmits<{ changed: [] }>();
const required = ref(false);
const reason = ref('');
const note = ref('');
const canHandle = ref(false);
const busy = ref(false);
async function load() {
  required.value = false;
  if (!props.plan.contractId) return;
  try {
    const [rows, permission] = await Promise.all([
      getContractRelatedItems(props.plan.contractId),
      getContractOperationPermission(props.plan.contractId),
    ]);
    const row = rows.data.find((item) => item.id === props.plan.id);
    required.value = !!row?.needsReview;
    reason.value = row?.reviewReason || '';
    canHandle.value = permission.data !== 'view';
  } catch {
    canHandle.value = false;
  }
}
async function confirm() {
  if (!props.plan.contractId) return;
  busy.value = true;
  try {
    await acknowledgeContractBusinessChange(
      props.plan.contractId,
      props.plan.id,
      note.value,
    );
    await load();
    emit('changed');
    message.success('合同变更影响已核对');
  } catch (error) {
    message.error(error instanceof Error ? error.message : '保存失败');
  } finally {
    busy.value = false;
  }
}
watch(() => [props.plan.id, props.plan.contractId], load, { immediate: true });
</script>
<template>
  <section v-if="required" class="contract-review">
    <Tag color="orange">合同变更待核对</Tag>
    <p>{{ reason }}</p>
    <p>请先核对并调整未执行排期，或说明原安排继续适用；已生成工单保留。</p>
    <template v-if="canHandle">
      <Input.TextArea
        v-model:value="note"
        placeholder="变更影响及后续处理结论"
      />
      <Button :loading="busy" class="mt-3" @click="confirm">
        确认核对结果
      </Button>
    </template>
  </section>
</template>
<style scoped>
.contract-review {
  padding: 15px;
  margin: 12px 0;
  background: #fffcf4;
  border: 1px solid #eddfbd;
  border-radius: 10px;
}

.contract-review p {
  margin: 8px 0;
  font-size: 12px;
  line-height: 1.9;
  color: #917e54;
}
</style>
