<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Rate } from 'ant-design-vue';
const props = defineProps<{
  value: number | null;
  disabled?: boolean;
  id?: string;
}>();
const hoverScore = ref<number>();
const displayedScore = computed(() =>
  props.disabled ? props.value : (hoverScore.value ?? props.value),
);
watch(
  () => [props.value, props.disabled, props.id],
  () => {
    hoverScore.value = undefined;
  },
);
function previewScore(value?: number) {
  hoverScore.value = props.disabled ? undefined : value;
}
const emit = defineEmits<{ 'update:value': [value: number] }>();
</script>
<template>
  <div class="review-score-input">
    <label :for="id">评分</label>
    <Rate
      :id="id"
      :value="value ?? 0"
      :count="10"
      allow-half
      :allow-clear="false"
      :disabled="disabled"
      aria-label="评分，满分10分，支持半星，每半星0.5分"
      @change="emit('update:value', $event)"
      @hover-change="previewScore"
    />
    <output class="score-value" aria-live="polite">{{
      displayedScore === null ? '—' : `${displayedScore} 分`
    }}</output>
  </div>
</template>
<style scoped>
.review-score-input {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) 3.8em;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
  container-type: inline-size;
}
.review-score-input > label {
  font-size: 13px;
  color: #41654c;
  white-space: nowrap;
}
.review-score-input :deep(.ant-rate) {
  justify-self: center;
  font-size: clamp(14px, 5cqi, 20px);
  line-height: 1.6;
  white-space: nowrap;
  color: #b78628;
}
.review-score-input :deep(.ant-rate-star:not(:last-child)) {
  margin-inline-end: 3px;
}
.review-score-input :deep(.ant-rate-star-zero .ant-rate-star-first),
.review-score-input :deep(.ant-rate-star-zero .ant-rate-star-second),
.review-score-input :deep(.ant-rate-star-half .ant-rate-star-second) {
  color: #d9e0dc;
}
.score-value {
  text-align: right;
  white-space: nowrap;
  color: #30654a;
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
</style>
