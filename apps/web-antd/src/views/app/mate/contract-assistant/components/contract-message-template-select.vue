<script setup lang="ts">
import type { NotificationTemplate } from '#/types/platform';

import { computed, onMounted, ref } from 'vue';

import { Button, Select } from 'ant-design-vue';

import { getNotificationTemplatesApi } from '#/api/platform';

import {
  defaultContractMessageTemplateId,
  supportsContractMessageTemplate,
} from '../utils/message-template';

const props = defineProps<{ disabled?: boolean }>();
const model = defineModel<string>();
const templates = ref<NotificationTemplate[]>([]);
const loading = ref(false);
const failed = ref(false);
const selectedId = computed(
  () => model.value || defaultContractMessageTemplateId,
);
const options = computed(() => {
  const values = templates.value
    .filter((item) => supportsContractMessageTemplate(item))
    .map((item) => ({ value: item.id, label: item.name, disabled: false }));
  if (
    !loading.value &&
    !failed.value &&
    !values.some((item) => item.value === selectedId.value)
  )
    values.push({
      value: selectedId.value,
      label: '原消息模版不可用，请重新选择',
      disabled: true,
    });
  return values;
});
async function load() {
  loading.value = true;
  failed.value = false;
  try {
    const response = await getNotificationTemplatesApi();
    templates.value = response.data;
  } catch {
    failed.value = true;
  } finally {
    loading.value = false;
  }
}
onMounted(load);
</script>
<template>
  <div class="template-select">
    <Select
      :value="selectedId"
      :options="options"
      :disabled="props.disabled || failed"
      :loading="loading"
      show-search
      option-filter-prop="label"
      placeholder="请选择消息模版"
      @change="(value) => (model = String(value))"
    />
    <Button v-if="failed" type="link" size="small" @click="load">
      加载失败，重试
    </Button>
  </div>
</template>
<style scoped>
.template-select :deep(.ant-select) {
  width: 100%;
}
</style>
