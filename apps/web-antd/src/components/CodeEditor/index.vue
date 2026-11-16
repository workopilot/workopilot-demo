<script setup lang="ts">
import { ref, watch } from 'vue';

import { Input } from 'ant-design-vue';

interface Props {
  value?: string;
  mode?: 'json' | 'text';
  placeholder?: string;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'text',
  readonly: false,
  value: '',
  placeholder: '',
});

const emit = defineEmits(['update:value', 'change', 'blur']);

const internalValue = ref(props.value || '');
const error = ref('');

watch(
  () => props.value,
  (val) => {
    internalValue.value = val || '';
  },
);

function handleChange(e: Event) {
  const val = (e.target as HTMLTextAreaElement).value;
  internalValue.value = val;
  emit('update:value', val);
  emit('change', val);

  if (props.mode === 'json') {
    validateJson(val);
  }
}

function handleBlur() {
  emit('blur');
  if (props.mode === 'json' && !error.value && internalValue.value) {
    try {
      // Auto format JSON on blur
      const parsed = JSON.parse(internalValue.value);
      const formatted = JSON.stringify(parsed, null, 2);
      internalValue.value = formatted;
      emit('update:value', formatted);
    } catch {
      // Ignore format error if it's not valid JSON (already caught by validation)
    }
  }
}

function validateJson(val: string) {
  if (!val) {
    error.value = '';
    return;
  }
  try {
    JSON.parse(val);
    error.value = '';
  } catch (error_: any) {
    error.value = error_.message;
  }
}
</script>

<template>
  <div class="code-editor-wrapper">
    <Input.TextArea
      :value="internalValue"
      :placeholder="placeholder"
      :rows="10"
      class="code-textarea font-mono text-sm"
      :class="{ 'border-red-500': error }"
      :readonly="readonly"
      @change="handleChange"
      @blur="handleBlur"
    />
    <div v-if="error" class="mt-1 text-xs text-red-500">{{ error }}</div>
  </div>
</template>

<style scoped>
.code-editor-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.code-textarea {
  flex: 1;
  resize: none;
  background-color: #fafafa;
}

:deep(.ant-input) {
  height: 100% !important;
}
</style>
