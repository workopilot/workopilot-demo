<script setup lang="ts">
import type { ReportDraft } from '#/types/new-report';
import type { ReportKind } from '#/types/zhiji';
import { computed, ref, watch } from 'vue';
import { Icon } from '@iconify/vue';
import { Button, Select, message } from 'ant-design-vue';
import { reportLayoutTemplates } from '#/api/mock-report-layout-templates';
import { zhijiSchemes } from '#/api/mock-zhiji';
import { mockDelay } from '#/api/mock-data';
const props = defineProps<{ report: ReportDraft }>();
const emit = defineEmits<{ applied: [] }>();
const selected = ref('');
const generating = ref(false);
const kind = computed<ReportKind>(
  () =>
    props.report.schemeConfig?.type ??
    zhijiSchemes.find((item) => item.id === props.report.schemeId)?.type ??
    (props.report.schemeId === 'project'
      ? 'project'
      : props.report.schemeId === 'customer'
        ? 'customer'
        : props.report.schemeId === 'productline'
          ? 'productline'
          : 'personal'),
);
const scheme = computed(
  () =>
    props.report.schemeConfig ??
    zhijiSchemes.find((item) => item.id === props.report.schemeId),
);
const options = computed(() =>
  (scheme.value?.layoutTemplates ?? reportLayoutTemplates).filter(
    (item) =>
      item.enabled &&
      item.kinds.includes(kind.value) &&
      (!scheme.value?.layoutTemplateIds ||
        scheme.value.layoutTemplateIds.includes(item.id)),
  ),
);
watch(
  () => props.report.id,
  () => {
    selected.value =
      props.report.layoutTemplate?.id ??
      options.value.find(
        (item) => item.id === scheme.value?.defaultLayoutTemplateId,
      )?.id ??
      options.value.find(
        (item) =>
          item.presentation === (props.report.presentation ?? 'classic'),
      )?.id ??
      options.value[0]?.id ??
      '';
  },
  { immediate: true },
);
async function generate() {
  if (generating.value || props.report.status === 'submitted') return;
  const template = options.value.find((item) => item.id === selected.value);
  if (!template) return message.warning('请选择管理员开放的展示模板');
  const report = props.report;
  const snapshot = {
    id: template.id,
    name: template.name,
    version: template.version,
    prompt: template.prompt,
    htmlFile: template.htmlFile ? { ...template.htmlFile } : undefined,
    presentation: template.presentation,
    generatedAt: new Date().toLocaleString('zh-CN'),
  };
  generating.value = true;
  try {
    await mockDelay(500);
    if (props.report.id !== report.id || report.status === 'submitted') return;
    // Local demo applies the configured visual direction; no live AI call is made.
    report.layoutTemplate = snapshot;
    report.presentation = snapshot.presentation;
    report.history.unshift(
      `按展示模板「${snapshot.name}」V${snapshot.version} 重新生成排版（演示），正文未改变。`,
    );
    emit('applied');
    message.success('已按所选模板重新生成预览（演示），正文和补充已保留');
  } finally {
    generating.value = false;
  }
}
</script>
<template>
  <div class="preview-template-bar">
    <template v-if="report.status !== 'submitted'">
      <label :for="`preview-template-${report.id}`"
        ><Icon icon="lucide:panels-top-left" />展示模板</label
      >
      <Select
        :id="`preview-template-${report.id}`"
        v-model:value="selected"
        :options="options.map((item) => ({ value: item.id, label: item.name }))"
        :disabled="generating"
        placeholder="选择模板"
        style="width: 156px"
      />
      <Button
        :loading="generating"
        :disabled="!options.length"
        @click="generate"
        ><Icon icon="lucide:sparkles" />{{
          report.layoutTemplate?.id === selected ? '重新排版' : '生成预览'
        }}</Button
      >
    </template>
    <span v-else
      ><Icon icon="lucide:lock-keyhole" />{{
        report.layoutTemplate?.name ?? '标准报告'
      }}
      · 已锁定</span
    >
  </div>
</template>
<style scoped>
.preview-template-bar {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}
.preview-template-bar label,
.preview-template-bar > span {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  color: #647f70;
  font-size: 12px;
  white-space: nowrap;
}
.preview-template-bar :deep(.ant-btn) {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
</style>
