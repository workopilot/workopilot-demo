<script setup lang="ts">
import type { ReportAttachment } from '#/types/new-report';
import { ref } from 'vue';
import { Button } from 'ant-design-vue';
import { Icon } from '@iconify/vue';
const props = defineProps<{
  files: ReportAttachment[];
  readonly?: boolean;
  label: string;
  compact?: boolean;
}>();
const emit = defineEmits<{ change: [files: ReportAttachment[]] }>();
const picker = ref<HTMLInputElement>();
function add(event: Event) {
  if (props.readonly) return;
  const input = event.target as HTMLInputElement;
  const added = Array.from(input.files ?? []).map((file) => ({
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    url: URL.createObjectURL(file),
  }));
  emit('change', [...props.files, ...added]);
  input.value = '';
}
</script>
<template>
  <div class="report-attachments" :class="{ 'is-compact': compact }">
    <input
      ref="picker"
      type="file"
      multiple
      hidden
      :aria-label="`${label}选择文件`"
      @change="add"
    />
    <div v-for="file in files" :key="file.id" class="attachment-row">
      <Icon icon="lucide:paperclip" /><a
        :href="file.url"
        :download="file.name"
        >{{ file.name }}</a
      ><small>{{ Math.max(1, Math.round(file.size / 1024)) }} KB</small
      ><Button
        v-if="!readonly"
        type="text"
        size="small"
        :aria-label="`移除${file.name}`"
        @click="
          emit(
            'change',
            files.filter((item) => item.id !== file.id),
          )
        "
        ><Icon icon="lucide:x"
      /></Button>
    </div>
    <div v-if="!readonly" class="attachment-tools">
      <Button
        size="small"
        :aria-label="`${label}上传文件`"
        @click="picker?.click()"
        ><Icon icon="lucide:paperclip" />上传文件</Button
      ><small>附件仅保存在本次 Demo 会话中</small>
      <div v-if="$slots.actions" class="attachment-actions">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>
<style scoped>
.report-attachments.is-compact {
  margin: 0;
}
.is-compact .attachment-tools {
  margin-top: 0;
}
.is-compact .attachment-tools > small {
  display: none;
}
.attachment-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-left: auto;
}
.report-attachments {
  margin: 12px 0;
}
.attachment-row,
.attachment-tools {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 12px;
}
.attachment-row a {
  color: #247d69;
  overflow-wrap: anywhere;
  flex: 1;
}
.attachment-row small,
.attachment-tools small {
  color: #738276;
}
.attachment-tools {
  flex-wrap: wrap;
}
.attachment-tools :deep(.ant-btn) {
  display: flex;
  gap: 5px;
  align-items: center;
}
</style>
