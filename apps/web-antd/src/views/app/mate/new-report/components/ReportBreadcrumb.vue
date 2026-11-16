<script setup lang="ts">
import { Icon } from '@iconify/vue';
defineProps<{ listLabel: string; objectLabel?: string }>();
const emit = defineEmits<{ home: []; list: [] }>();
</script>
<template>
  <nav class="report-breadcrumb" aria-label="汇报位置">
    <ol>
      <li>
        <button type="button" title="返回汇报首页" @click="emit('home')">
          汇报
        </button>
      </li>
      <li class="breadcrumb-separator" aria-hidden="true">
        <Icon icon="lucide:chevron-right" />
      </li>
      <li>
        <button
          v-if="objectLabel"
          type="button"
          :title="`返回${listLabel}`"
          @click="emit('list')"
        >
          {{ listLabel }}</button
        ><span v-else aria-current="page">{{ listLabel }}</span>
      </li>
      <template v-if="objectLabel"
        ><li class="breadcrumb-separator" aria-hidden="true">
          <Icon icon="lucide:chevron-right" />
        </li>
        <li class="breadcrumb-current">
          <span aria-current="page" :title="objectLabel">{{
            objectLabel
          }}</span>
        </li></template
      >
    </ol>
  </nav>
</template>
<style scoped>
.report-breadcrumb {
  min-width: 0;
}
ol {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  padding: 0;
  margin: 0;
  list-style: none;
  font-size: 13px;
}
li {
  display: inline-flex;
  align-items: center;
  min-width: 0;
}
button {
  border: 0;
  background: none;
  padding: 5px 6px;
  cursor: pointer;
  color: #326e9f;
  font-weight: 400;
  text-decoration: underline;
  text-decoration-color: #326e9f66;
  text-underline-offset: 4px;
  text-decoration-thickness: 1px;
  border-radius: 4px;
  white-space: nowrap;
}
button:hover {
  color: #245b88;
  background: #edf4fa;
  text-decoration-color: currentColor;
}
button:focus-visible {
  outline: 2px solid #4981ad;
  outline-offset: 2px;
  background: #edf4fa;
}
span[aria-current] {
  font-weight: 400;
  color: #6c7b72;
}
.breadcrumb-separator {
  color: #a3b0a8;
  font-size: 13px;
}
.breadcrumb-current {
  max-width: 230px;
}
.breadcrumb-current span {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
