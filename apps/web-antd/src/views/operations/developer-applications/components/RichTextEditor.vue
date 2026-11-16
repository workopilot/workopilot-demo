<script setup lang="ts">
import { ref, watch } from 'vue';

import { Textarea } from 'ant-design-vue';

const props = defineProps<{
  modelValue: string;
  placeholder?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const localValue = ref(props.modelValue);

watch(
  () => props.modelValue,
  (val) => {
    localValue.value = val;
  },
);

function handleChange(e: Event) {
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value);
}
</script>

<template>
  <div class="rich-text-editor">
    <Textarea
      v-model:value="localValue"
      :placeholder="placeholder || '请输入处理结果...'"
      :auto-size="{ minRows: 4, maxRows: 10 }"
      @change="handleChange"
    />
  </div>
</template>
