<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { Popover } from 'ant-design-vue';
defineProps<{ text: string; label: string; hints?: string[] }>();
</script>
<template>
  <div class="supplement-ai-line">
    <span class="supplement-ai-badge"
      ><Icon icon="lucide:sparkles" />AI 提示</span
    >
    <span class="supplement-ai-copy">{{ text }}</span>
    <Popover trigger="click" placement="topRight"
      ><template #content
        ><div class="supplement-tips-popover">
          <strong>建议补充哪些内容？</strong>
          <p>{{ text }}</p>
          <ul v-if="hints?.length">
            <li v-for="hint in hints" :key="hint">{{ hint }}</li>
          </ul>
        </div></template
      ><button
        type="button"
        class="supplement-tips-trigger"
        :aria-label="`查看${label}的补充建议`"
      >
        {{ hints?.length ? `${hints.length} 项建议` : '查看建议'
        }}<Icon icon="lucide:chevron-down" /></button
    ></Popover>
  </div>
</template>
<style scoped>
.supplement-ai-line {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 10px;
  margin-bottom: 10px;
  border-bottom: 1px solid #e4ebe7;
}
.supplement-ai-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  border-radius: 5px;
  padding: 3px 7px;
  background: #f8ecd2;
  color: #806026;
  font-size: 12px;
  font-weight: 600;
}
.supplement-ai-copy {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: #627769;
  font-size: 12px;
}
.supplement-tips-trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding: 5px 2px;
  background: transparent;
  border: 0;
  color: #3a7255;
  font-size: 12px;
  cursor: pointer;
}
.supplement-tips-trigger:focus-visible {
  outline: 2px solid #4b8a67;
  outline-offset: 3px;
  border-radius: 4px;
}
.supplement-tips-popover {
  max-width: min(360px, 75vw);
  color: #405b49;
  font-size: 13px;
  line-height: 1.8;
}
.supplement-tips-popover strong {
  color: #2c4c37;
}
.supplement-tips-popover p {
  margin: 8px 0;
}
.supplement-tips-popover ul {
  margin: 8px 0 0;
  padding-left: 18px;
  list-style: disc;
}
</style>
