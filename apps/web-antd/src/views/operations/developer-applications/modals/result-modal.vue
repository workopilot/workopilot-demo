<script setup lang="ts">
import type { DeveloperApplication } from '#/types/developer-application';

import { computed } from 'vue';

import { Icon } from '@iconify/vue';
import { Modal, Tag } from 'ant-design-vue';

const props = defineProps<{
  application: DeveloperApplication | null;
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

// 处理结果状态展示
const statusInfo = computed(() => {
  if (props.application?.processResult === 'approved') {
    return { text: '通过', color: 'success', icon: 'lucide:circle-check' };
  }
  return { text: '不通过', color: 'error', icon: 'lucide:circle-x' };
});

// 处理时间本地化
const processedTime = computed(() => {
  if (!props.application?.processedAt) return '-';
  return new Date(props.application.processedAt).toLocaleString('zh-CN');
});

function handleClose() {
  emit('update:open', false);
}
</script>

<template>
  <Modal
    :open="open"
    title="查看处理结果"
    :width="720"
    :footer="null"
    @cancel="handleClose"
  >
    <template v-if="application">
      <!-- 顶部状态摘要 -->
      <div
        class="mb-4 flex items-center justify-between rounded-lg border bg-gray-50 p-3"
      >
        <div class="flex items-center gap-2">
          <Icon :icon="statusInfo.icon" class="size-5" />
          <span class="text-sm text-gray-500">处理结果</span>
          <Tag :color="statusInfo.color" class="m-0">
            {{ statusInfo.text }}
          </Tag>
        </div>
        <div class="text-xs text-gray-400">处理时间:{{ processedTime }}</div>
      </div>

      <!-- 富文本处理结果 -->
      <div
        class="rich-text-view min-h-[200px] rounded-lg border p-4"
        style="max-height: 60vh; overflow-y: auto"
        v-html="
          application.processDetail ||
          '<span class=\'text-gray-400\'>暂无处理结果</span>'
        "
      ></div>
    </template>
  </Modal>
</template>

<style scoped>
/* 富文本渲染兜底排版 */
.rich-text-view :deep(h1),
.rich-text-view :deep(h2),
.rich-text-view :deep(h3) {
  margin: 0.6em 0 0.4em;
  font-weight: 600;
  line-height: 1.4;
}

.rich-text-view :deep(h1) {
  font-size: 1.4em;
}

.rich-text-view :deep(h2) {
  font-size: 1.25em;
}

.rich-text-view :deep(h3) {
  font-size: 1.1em;
}

.rich-text-view :deep(p) {
  margin: 0.4em 0;
  line-height: 1.7;
}

.rich-text-view :deep(ul),
.rich-text-view :deep(ol) {
  padding-left: 1.6em;
  margin: 0.4em 0;
}

.rich-text-view :deep(li) {
  margin: 0.2em 0;
  line-height: 1.7;
}

.rich-text-view :deep(a) {
  color: #1677ff;
  text-decoration: none;
}

.rich-text-view :deep(a:hover) {
  text-decoration: underline;
}

.rich-text-view :deep(code) {
  padding: 2px 6px;
  font-family: ui-monospace, monospace;
  font-size: 0.9em;
  background-color: #f5f5f5;
  border-radius: 4px;
}
</style>
