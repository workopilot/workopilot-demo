<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
defineProps<{
  items: Array<{
    detail?: string;
    label: string;
    tone?: 'danger' | 'default' | 'success' | 'warning';
    value: number | string;
  }>;
}>();
</script>

<template>
  <div class="ai-kpi-grid">
    <article
      v-for="item in items"
      :key="item.label"
      :class="`is-${item.tone || 'default'}`"
    >
      <span>{{ item.label }}</span>
      <strong>{{ item.value }}</strong>
      <small v-if="item.detail">{{ item.detail }}</small>
    </article>
  </div>
</template>

<style scoped>
.ai-kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(128px, 1fr));
  gap: 10px;
}

.ai-kpi-grid article {
  display: grid;
  gap: 3px;
  align-content: center;
  min-height: 94px;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 16px;
}

.ai-kpi-grid span,
.ai-kpi-grid small {
  font-size: 11px;
  color: #72867f;
}

.ai-kpi-grid strong {
  font-size: 25px;
  line-height: 1.2;
  color: #123830;
}

.ai-kpi-grid .is-danger strong {
  color: #d84949;
}

.ai-kpi-grid .is-warning strong {
  color: #d18119;
}

.ai-kpi-grid .is-success strong {
  color: #0b8a73;
}
</style>
