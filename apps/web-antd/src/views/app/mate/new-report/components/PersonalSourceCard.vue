<script setup lang="ts">
import type { ReportMaterialSection, ReportSource } from '#/types/new-report';
import { computed, nextTick, ref, watch } from 'vue';
import ReportMarkdown from './ReportMarkdown.vue';
import ReportSupplementHint from './ReportSupplementHint.vue';
import ReportAttachments from './ReportAttachments.vue';
import type { ReportAttachment } from '#/types/new-report';
import { Button, Input } from 'ant-design-vue';
import { Icon } from '@iconify/vue';
import {
  personalSourceOverview,
  needsNextWeekProjectTasks,
} from '#/api/mock-personal-report-statistics';

const props = defineProps<{
  section: ReportMaterialSection;
  readonly: boolean;
  busy: boolean;
  attachments?: ReportAttachment[];
  note?: { kind: string; text: string };
  suggestion?: string;
  allowDisable?: boolean;
  showSummaryWhenEmpty?: boolean;
}>();
const emit = defineEmits<{
  files: [files: ReportAttachment[]];
  regenerate: [];
  configure: [];
  disable: [];
  supplement: [note: { kind: string; text: string }];
  record: [record: ReportSource];
}>();
const editing = ref(true);
const settingsOpen = ref(false);
const noteText = ref('');
watch(
  () => props.note?.text,
  (value) => {
    noteText.value = value ?? '';
  },
  { immediate: true },
);
const needsProjectPlan = computed(() =>
  needsNextWeekProjectTasks(props.section),
);
const guidance = computed(() =>
  props.suggestion
    ? props.suggestion
    : needsProjectPlan.value
      ? '未检测到下周计划或进行中的项目任务，请补充下周项目任务，明确目标、交付物与计划完成时间；如任务数据尚未采集，请先核实。'
      : props.section.id === 'projects'
        ? '延期任务是否已申请延期？原计划与预计完成时间是什么？是否需要加班处理，或需要谁协调支持？'
        : props.section.id === 'tickets'
          ? '超时或仍在处理的工单原因是什么？是否已经联系客户、申请延期，或需要其他工程师协助？'
          : '成果是否达到完成标准？有无延期、阻塞或需要支持的事项？请补充成果物与下一步安排。',
);

watch(
  () => props.readonly,
  () => {
    editing.value = !props.readonly;
    settingsOpen.value = false;
  },
);
function edit() {
  editing.value = true;
  void nextTick(() =>
    document.getElementById(`note-${props.section.id}`)?.focus(),
  );
}
function save() {
  if (
    props.readonly ||
    noteText.value.trim() === (props.note?.text ?? '').trim()
  )
    return;
  emit('supplement', { kind: '工作补充', text: noteText.value.trim() });
}
defineExpose({
  savePending: () => {
    if (editing.value) save();
  },
});
const reviewHints = computed(() => {
  if (!props.section.records.length) return [];
  const note = props.note?.text ?? '';
  const hints: string[] = [];
  if (needsProjectPlan.value)
    hints.push(
      '下周项目任务：未检测到下周计划或进行中的任务，请补充下周项目任务，并检查是否需要创建任务或补充已有任务。',
    );
  for (const record of props.section.records) {
    if (record.statistics?.delayed)
      hints.push(
        `${record.title}：${record.statistics.delayed} 项延期任务，是否已申请延期，是否需要加班或协调支持？`,
      );
  }
  for (const record of props.section.records) {
    const text = record.detail + ' ' + note;
    if (
      /链接待补充/.test(record.detail) &&
      !/https?:/.test(note) &&
      !props.attachments?.length
    )
      hints.push(record.title + '：补充成果文档链接或附件。');
    if (
      !/交付物|成果物|文档|验收通过|https?:|附件/.test(text) &&
      !props.attachments?.length
    )
      hints.push(`${record.title}：补充成果物或处理依据。`);
    if (!/验收|完成标准|完成标志|验收标准/.test(text))
      hints.push(`${record.title}：说明完成标准或如何确认处理结果。`);
    if (
      /进行中|无法|延期|阻碍|排查/.test(record.detail) &&
      !/无需协调|不需要协调|协助|协调|支持/.test(text)
    )
      hints.push(`${record.title}：是否有风险，需要谁协助？`);
    else if (
      /协调建议|建议协调|需要协调/.test(text) &&
      !/协调人|协助人|负责人.*协调|无需协调/.test(note)
    )
      hints.push(`${record.title}：补充协调对象和希望解决的时间。`);
  }
  return [...new Set(hints)];
});
const content = computed(() =>
  props.section.summaryFormat === 'markdown-overview'
    ? props.section.summary
    : personalSourceOverview(props.section),
);
const compactHints = computed(() => [
  ...new Set(
    reviewHints.value.map((hint) => hint.slice(hint.indexOf('：') + 1)),
  ),
]);
const noteDirty = computed(
  () => noteText.value.trim() !== (props.note?.text ?? '').trim(),
);
const suggestionPlaceholder = computed(() =>
  [
    `AI 建议：${guidance.value}`,
    ...compactHints.value.map((hint) => `• ${hint}`),
  ].join('\n'),
);
</script>

<template>
  <section
    :id="`report-${section.id}`"
    class="personal-source-group"
    :class="`source-${section.id}`"
    data-report-section
  >
    <header class="source-card-header">
      <h3>
        <span class="source-card-icon"><Icon :icon="section.icon" /></span
        >{{ section.title }}
      </h3>
      <div v-if="!readonly" class="source-card-actions">
        <Button
          type="text"
          size="small"
          :aria-label="`重新生成${section.title}`"
          :disabled="busy || section.needsAuth"
          @click="emit('regenerate')"
          ><Icon icon="lucide:refresh-cw" />重新生成</Button
        >
        <Button
          type="text"
          size="small"
          :aria-label="`补充${section.title}`"
          @click="edit"
          ><Icon icon="lucide:plus" />补充</Button
        >
        <Popover
          v-model:open="settingsOpen"
          trigger="click"
          placement="bottomRight"
        >
          <template #content
            ><div class="source-card-settings">
              <p>仅调整本期报告，补充内容会保留。</p>
              <Button
                block
                @click="
                  settingsOpen = false;
                  emit('configure');
                "
                >配置数据源</Button
              ><Button
                v-if="allowDisable !== false"
                block
                danger
                @click="
                  settingsOpen = false;
                  emit('disable');
                "
                >关闭此数据源</Button
              >
            </div></template
          >
          <Button type="text" size="small" :aria-label="`${section.title}设置`"
            ><Icon icon="lucide:settings-2"
          /></Button>
        </Popover>
      </div>
      <span v-else class="source-locked"
        ><Icon icon="lucide:lock-keyhole" />已提交</span
      >
    </header>
    <div class="personal-source-card">
      <ReportMarkdown
        v-if="
          section.records.length || (showSummaryWhenEmpty && content.trim())
        "
        :text="content"
      />
      <div
        v-if="
          !section.records.length && !(showSummaryWhenEmpty && content.trim())
        "
        class="source-card-empty"
      >
        <Icon
          :icon="section.needsAuth ? 'lucide:lock-keyhole' : 'lucide:inbox'"
        /><span>{{
          section.needsAuth
            ? 'Git 尚未授权，连接后可整理代码成果。'
            : '本周期暂无记录，可补充工作或重新生成。'
        }}</span
        ><Button
          v-if="!readonly && section.needsAuth"
          size="small"
          @click="emit('configure')"
          >去授权</Button
        >
      </div>
      <details v-if="section.records.length" class="source-card-evidence">
        <summary>
          关联数据源 · {{ section.records.length }} 条记录（展开查看明细）
        </summary>
        <button
          v-for="record in section.records"
          :key="record.id"
          @click="emit('record', record)"
        >
          {{ record.id }} · {{ record.title }}
          <small v-if="record.statistics"
            >任务 {{ record.statistics.total }} 项 · 完成
            {{ record.statistics.completed }} 项 · 进行中
            {{ record.statistics.active }} 项 · 延期
            {{ record.statistics.delayed }} 项</small
          >
        </button>
      </details>
      <div v-if="note && readonly" class="source-card-note">
        <span>人工补充</span>
        <ReportMarkdown :text="note.text" />
        <button v-if="!readonly" @click="edit">修改补充</button>
      </div>
      <div v-if="editing && !readonly" class="source-supplement-panel">
        <ReportSupplementHint
          v-if="section.records.length || suggestion"
          :text="guidance"
          :label="section.title"
          :hints="compactHints"
        />
        <div class="supplement-field-heading">
          <label :for="`note-${section.id}`"
            ><Icon icon="lucide:pencil-line" />补充说明</label
          >
          <span
            :class="{ pending: noteDirty, saved: !noteDirty && !!note?.text }"
            ><Icon v-if="!noteDirty && note?.text" icon="lucide:check" />{{
              noteDirty ? '待保存' : note?.text ? '已保存' : '选填'
            }}</span
          >
        </div>
        <Input.TextArea
          :id="`note-${section.id}`"
          v-model:value="noteText"
          :auto-size="{ minRows: 2, maxRows: 6 }"
          :placeholder="suggestionPlaceholder"
          class="supplement-textarea"
        />
        <div class="supplement-bottom-bar">
          <ReportAttachments
            :files="attachments ?? []"
            compact
            :label="section.title + '补充'"
            @change="emit('files', $event)"
          >
            <template #actions>
              <Button
                size="small"
                type="text"
                :disabled="!noteDirty"
                @click="noteText = note?.text ?? ''"
                >重置</Button
              >
              <Button
                size="small"
                type="primary"
                :disabled="!noteDirty"
                @click="save"
                ><Icon icon="lucide:check" />保存补充</Button
              >
            </template>
          </ReportAttachments>
        </div>
      </div>
      <ReportAttachments
        v-if="readonly && attachments?.length"
        :files="attachments ?? []"
        readonly
        :label="section.title + '补充'"
      />
      <slot name="after-supplement" />
    </div>
  </section>
</template>

<style scoped>
.source-supplement-panel {
  margin-top: 12px;
  padding: 12px 14px;
  border: 1px solid #e2eae5;
  border-radius: 10px;
  background: #f6f9f7;
}
.supplement-field-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 7px;
}
.supplement-field-heading label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #3a5947;
  font-size: 12px;
  font-weight: 600;
}
.supplement-field-heading > span {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: #76897d;
  font-size: 12px;
}
.supplement-field-heading > .pending {
  color: #936826;
}
.supplement-field-heading > .saved {
  color: #438263;
}
.source-supplement-panel :deep(.supplement-textarea) {
  border-color: #dce6df;
  border-radius: 7px;
  padding: 8px 10px;
  background: white;
  color: #344f3e;
  font-size: 13px;
  line-height: 1.6;
  box-shadow: none;
}
.source-supplement-panel :deep(.supplement-textarea:focus) {
  border-color: #65a082;
  box-shadow: 0 0 0 2px #508b6c12;
}
.supplement-bottom-bar {
  margin-top: 8px;
}
.supplement-bottom-bar :deep(.ant-btn) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 6px;
}
.supplement-bottom-bar :deep(.ant-btn-primary:not(:disabled)) {
  background: #347758;
  box-shadow: 0 1px 3px #23583d15;
}
@media (max-width: 600px) {
  .source-supplement-panel {
    padding: 10px;
  }
}
.personal-source-card {
  background: #fff;
  border: 1px solid #dfebe3;
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 0;
  box-shadow: 0 3px 12px #294b3605;
}
.personal-source-group {
  margin-bottom: 24px;
}
.source-card-header,
.source-card-header h3,
.source-card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.source-card-header {
  justify-content: space-between;
  gap: 12px;
  padding: 0 2px 10px;
}
.source-card-header h3 {
  margin: 0;
  font-size: 17px;
  color: #243e32;
  white-space: nowrap;
  font-weight: 700;
}
.source-card-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(
    135deg,
    var(--source-icon-start, #e0f6ed),
    var(--source-icon-end, #bfe5d5)
  );
  color: var(--source-icon-ink, #216f56);
  box-shadow:
    inset 0 1px 0 #ffffffc0,
    0 2px 5px #284e3710;
  font-size: 18px;
  flex-shrink: 0;
}
.source-projects {
  --source-icon-start: #e5edff;
  --source-icon-end: #cbdcfa;
  --source-icon-ink: #3b64aa;
}
.source-tasks {
  --source-icon-start: #eee9ff;
  --source-icon-end: #dbcef6;
  --source-icon-ink: #7150a7;
}
.source-git {
  --source-icon-start: #fff1da;
  --source-icon-end: #f5dcb2;
  --source-icon-ink: #946124;
}
.source-requirements {
  --source-icon-start: #fbe7ed;
  --source-icon-end: #f1cfda;
  --source-icon-ink: #a14f70;
}
.source-files {
  --source-icon-start: #e1f3f8;
  --source-icon-end: #bfe1ed;
  --source-icon-ink: #2c7287;
}
.source-card-actions {
  gap: 2px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.source-card-actions :deep(.ant-btn) {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #5d7165;
  font-size: 12px;
}
.source-card-stats {
  display: flex;
  gap: 32px;
  margin: 20px 0 14px;
}
.source-card-stats > div {
  display: flex;
  align-items: baseline;
  gap: 7px;
}
.source-card-stats strong {
  font-size: 25px;
  font-weight: 600;
  color: #234d38;
}
.source-card-stats span,
.source-locked {
  font-size: 12px;
  color: #64786b;
}
.source-card-summary {
  font-size: 14px;
  line-height: 1.8;
  margin: 14px 0;
  color: #3f5548;
}
.source-card-attention {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 11px 13px;
  background: #f5f8f5;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: #536446;
}
.source-card-attention > svg {
  flex-shrink: 0;
  margin-top: 3px;
}
.source-card-attention b {
  margin-right: 10px;
  font-weight: 500;
}
.source-card-evidence {
  margin-top: 14px;
  color: #60766a;
  font-size: 12px;
}
.source-card-evidence summary {
  cursor: pointer;
  padding: 5px 0;
}
.source-card-evidence > div {
  padding: 12px 0;
  border-top: 1px solid #edf2ee;
}
.source-card-evidence button {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #247d69;
}
.source-card-evidence button small {
  display: block;
  margin-top: 5px;
  color: #708579;
  font-size: 12px;
}
.source-card-evidence p {
  margin: 6px 0 0;
  line-height: 1.8;
}
.source-card-empty {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 20px 0 4px;
  font-size: 13px;
  color: #708073;
}
.source-card-note {
  border-top: 1px dashed #dbe7de;
  padding-top: 14px;
  margin-top: 14px;
}
.source-card-note span {
  color: #247d69;
  font-size: 12px;
}
.source-card-note p {
  white-space: pre-wrap;
  margin: 8px 0;
  font-size: 14px;
  line-height: 1.8;
}
.source-card-note button {
  color: #247d69;
  font-size: 12px;
}
.source-card-editor {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid #e4ece6;
}
.source-card-editor label {
  font-size: 13px;
  font-weight: 600;
}
.source-card-editor :deep(.ant-select) {
  width: 140px;
}
.source-card-editor > div:last-child {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.source-card-editor > div:last-child > span {
  margin-right: auto;
  font-size: 12px;
  color: #6a7e70;
}
.source-card-settings {
  display: grid;
  gap: 8px;
  font-size: 12px;
}
@media (max-width: 900px) {
  .source-card-header {
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .source-card-stats {
    gap: 18px;
    flex-wrap: wrap;
  }
}
.source-result-label {
  margin-top: 16px;
  font-size: 12px;
  color: #355944;
  font-weight: 600;
}
.source-result-label span {
  color: #809084;
  font-weight: 400;
  margin-left: 10px;
  font-size: 11px;
}
.source-deliverables {
  display: grid;
  gap: 9px;
  padding: 12px;
  background: #f3f8f4;
  border-radius: 8px;
  font-size: 12px;
}
.source-deliverables button {
  display: flex;
  align-items: center;
  gap: 6px;
  text-align: left;
  color: #247d69;
  line-height: 1.8;
}
.source-outcome-gap {
  color: #927746;
  font-size: 12px;
  margin: 12px 0;
}
.source-yellow-light {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 12px 0 4px;
  padding: 5px 8px;
  color: #8b641d;
  background: #fff7df;
  border: 1px solid #f2dfaa;
  border-radius: 6px;
  font-size: 12px;
  text-align: left;
}
.source-yellow-light span {
  color: #907b52;
  font-size: 11px;
}
.review-hints {
  max-width: 340px;
  font-size: 12px;
  line-height: 1.8;
}
.review-hints ul {
  padding-left: 18px;
  list-style: disc;
  max-height: 240px;
  overflow: auto;
  margin: 10px 0;
}
.review-hints small {
  display: block;
  color: #889187;
  margin-top: 8px;
}
</style>
