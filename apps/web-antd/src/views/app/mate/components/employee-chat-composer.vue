<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { Button, Input } from 'ant-design-vue';

defineProps<{
  disabled: boolean;
  modelValue: string;
  prompts: string[];
  sending: boolean;
}>();

const emit = defineEmits<{
  attach: [];
  send: [];
  'update:modelValue': [value: string];
  voice: [];
}>();
</script>

<template>
  <footer class="employee-chat-composer">
    <div v-if="prompts.length > 0" class="employee-chat-composer__prompts">
      <button
        v-for="prompt in prompts"
        :key="prompt"
        type="button"
        :disabled="disabled"
        @click="emit('update:modelValue', prompt)"
      >
        {{ prompt }}
      </button>
    </div>
    <div class="employee-chat-composer__input">
      <Input.TextArea
        :value="modelValue"
        :auto-size="{ minRows: 1, maxRows: 4 }"
        placeholder="输入消息..."
        @update:value="emit('update:modelValue', $event)"
        @press-enter.prevent="emit('send')"
      />
      <Button
        aria-label="添加附件"
        class="employee-chat-composer__attach"
        type="text"
        @click="emit('attach')"
      >
        <Icon icon="lucide:paperclip" />
      </Button>
      <Button
        aria-label="语音输入"
        class="employee-chat-composer__voice"
        type="text"
        @click="emit('voice')"
      >
        <Icon icon="lucide:mic" />
      </Button>
      <Button
        aria-label="发送消息"
        class="employee-chat-composer__send"
        shape="circle"
        type="primary"
        :disabled="disabled || !modelValue.trim()"
        :loading="sending"
        @click="emit('send')"
      >
        <Icon icon="lucide:arrow-up" />
      </Button>
    </div>
  </footer>
</template>

<style scoped>
.employee-chat-composer {
  flex: none;
  padding: 12px 20px 18px;
  background: rgb(255 255 255 / 82%);
  border-top: 1px solid rgb(14 83 69 / 8%);
}

.employee-chat-composer__prompts {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  overflow-x: auto;
}

.employee-chat-composer__prompts button {
  flex: none;
  padding: 6px 10px;
  font-size: 11px;
  color: #58736c;
  cursor: pointer;
  background: #f8fbfa;
  border: 1px solid #d3e4de;
  border-radius: 7px;
}

.employee-chat-composer__prompts button:hover {
  color: #0b6e65;
  border-color: #8fc5b7;
}

.employee-chat-composer__input {
  position: relative;
  display: flex;
  gap: 6px;
  align-items: flex-end;
  min-height: 112px;
  padding: 12px 12px 10px;
  background: #fbfdfc;
  border: 1px solid #d3e4de;
  border-radius: 30px;
}

.employee-chat-composer__input :deep(.ant-input) {
  position: absolute;
  inset: 12px 16px 46px;
  width: calc(100% - 32px);
  color: #30433e;
  resize: none;
  background: transparent;
  border: 0 !important;
  box-shadow: none !important;
}

.employee-chat-composer__attach {
  margin-right: auto;
}

.employee-chat-composer__attach,
.employee-chat-composer__voice {
  font-size: 20px;
  color: #172b3a;
}

.employee-chat-composer__send {
  width: 42px;
  min-width: 42px;
  height: 42px;
  color: #9aacbf;
  background: #e5ebf2;
  border-color: #e5ebf2;
}

.employee-chat-composer__send:not([disabled]) {
  color: #fff;
  background: #0b6e65;
  border-color: #0b6e65;
}

@media (max-width: 768px) {
  .employee-chat-composer {
    padding: 10px 12px 12px;
  }

  .employee-chat-composer__input {
    min-height: 92px;
    border-radius: 24px;
  }
}
</style>
