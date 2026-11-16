<script setup lang="ts">
import { computed } from 'vue';

import { reportArchive } from './demo-state';
import ReportDocument from './report-document.vue';

const currentReport = computed(
  () =>
    reportArchive.find((item) => item.status === 'draft') || reportArchive[0]!,
);
</script>

<template>
  <div class="current-report-page">
    <ReportDocument :report="currentReport" />
  </div>
</template>

<style scoped>
.current-report-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: #f3f7f5;
  border: 1px solid #d5e3de;
  border-radius: 14px;
}
</style>
