<script setup lang="ts">
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
import { Button, Checkbox } from 'ant-design-vue';
import type { ReviewSignal, ReviewWorkItem } from '#/api/mock-review-workspace';
import {
  reportFormatLabel,
  reviewReminderRecords,
  reviewWorkLabel,
  reviewWorkScore,
  reviewWorkState,
} from '#/api/mock-review-workspace';

const props = defineProps<{
  item: ReviewWorkItem;
  signals: ReviewSignal[];
  selected?: boolean;
  dragEnabled?: boolean;
  paper?: boolean;
}>();
const emit = defineEmits<{
  open: [item: ReviewWorkItem];
  remind: [item: ReviewWorkItem];
  select: [item: ReviewWorkItem, checked: boolean];
  drag: [event: DragEvent, item: ReviewWorkItem];
}>();
const state = computed(() => reviewWorkState(props.item));
const selectable = computed(() => state.value === 'missing');
const avatar = computed(
  () =>
    `${import.meta.env.BASE_URL}images/ai-employee/${props.item.type === 'project' ? '项目经理.jpg' : props.item.type === 'customer' ? '商务分析助手.jpg' : '咨询人员.jpg'}`,
);
function openPaperReport() {
  if (props.paper && state.value !== 'missing') emit('open', props.item);
}
function handleCardClick(event: MouseEvent) {
  // Nested controls handle their own action, including selection of missing reports.
  if ((event.target as HTMLElement).closest('button, input, label, a')) return;
  openPaperReport();
}
</script>

<template>
  <article
    class="triage-card"
    :class="[`state-${state}`, { selected, 'paper-card': paper }]"
    :draggable="dragEnabled && state === 'pending'"
    :tabindex="paper && state !== 'missing' ? 0 : undefined"
    :role="paper ? 'group' : undefined"
    :aria-label="
      paper
        ? `${item.author}的${reportFormatLabel(item)}，${item.start}至${item.end}`
        : undefined
    "
    @click="handleCardClick"
    @keydown.enter.self="openPaperReport"
    @keydown.space.self.prevent="openPaperReport"
    @dragstart="emit('drag', $event, item)"
  >
    <header>
      <Checkbox
        v-if="selectable"
        :checked="selected"
        :aria-label="`选择${item.author}的${reportFormatLabel(item)}`"
        @change="emit('select', item, Boolean($event.target.checked))"
      />
      <img :src="avatar" :alt="item.author" />
      <div class="person">
        <button
          type="button"
          :disabled="state === 'missing'"
          :title="`${item.author} · ${item.department}`"
          @click="emit('open', item)"
        >
          {{ item.author
          }}<span v-if="!paper"> · {{ item.department }}</span></button
        ><small>{{ paper ? item.department : reportFormatLabel(item) }}</small>
      </div>
      <span
        v-if="state === 'approved'"
        class="score-badge"
        :aria-label="`已审批，评分${reviewWorkScore(item)}分`"
        :title="`评分 ${reviewWorkScore(item)} / 10`"
        >{{ reviewWorkScore(item) }}</span
      >
      <span v-else class="status-pill" :class="state"
        ><Icon
          :icon="
            state === 'missing'
              ? 'lucide:clock-3'
              : state === 'shared'
                ? 'lucide:share-2'
                : 'lucide:circle-dot'
          "
        />{{ reviewWorkLabel(item) }}</span
      >
    </header>
    <div v-if="paper" class="paper-period">
      <div class="paper-type">{{ reportFormatLabel(item) }}</div>
      <div class="paper-date-row">
        <span>{{ item.start.slice(0, 4) }} 年</span>
        <span
          >{{ item.start.slice(5).replace('-', '/')
          }}<template v-if="item.end !== item.start">
            — {{ item.end.slice(5).replace('-', '/') }}</template
          ></span
        >
      </div>
    </div>
    <div v-if="!paper" class="board-report-period">
      <strong>{{ reportFormatLabel(item) }}</strong>
      <span
        >{{ item.start
        }}<template v-if="item.end !== item.start">
          — {{ item.end }}</template
        ></span
      >
    </div>
    <footer>
      <span v-if="!paper" class="compact-meta">{{ item.reference }}</span>
      <div class="card-actions">
        <template v-if="state === 'pending'"
          ><Button size="small" type="primary" @click="emit('open', item)"
            ><svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              aria-hidden="true"
            >
              <path
                d="M9 5H6a2 2 0 0 0-2 2v13h13v-3M9 3h6v4H9zM13 13l3 3 5-6"
              /></svg
            >审批</Button
          ></template
        >
        <Button
          v-else-if="paper"
          size="small"
          :disabled="state === 'missing'"
          @click="emit('open', item)"
          ><svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            aria-hidden="true"
          >
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" /></svg
          >查看</Button
        >
        <Button
          v-else-if="state === 'missing'"
          size="small"
          :disabled="!!reviewReminderRecords[item.id]"
          @click="emit('remind', item)"
          ><Icon icon="lucide:bell-ring" />{{
            reviewReminderRecords[item.id] ? '已催交' : '催交'
          }}</Button
        >
        <Button v-else size="small" type="text" @click="emit('open', item)"
          ><svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            aria-hidden="true"
          >
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" /></svg
          >查看</Button
        >
      </div>
    </footer>
  </article>
</template>

<style scoped>
.triage-card {
  display: grid;
  grid-template-rows: 48px 20px 20px 20px 26px;
  gap: 3px;
  height: 160px;
  min-width: 0;
  padding: 0 0 8px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #dee7e1;
  border-radius: 10px;
  color: #294837;
  box-shadow: 0 2px 6px #23493104;
  transition:
    border-color 150ms,
    box-shadow 150ms;
}
.board-report-period {
  grid-row: 2 / span 3;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  min-width: 0;
  padding: 4px 12px;
}
.board-report-period strong {
  font-size: 13px;
  font-weight: 650;
  line-height: 20px;
  color: #34543e;
}
.board-report-period span {
  font-size: 12px;
  font-weight: 400;
  line-height: 20px;
  color: #6c8072;
}
.triage-card:hover {
  border-color: #a8c5b2;
  box-shadow: 0 4px 12px #2349310b;
}
.triage-card.selected {
  border-color: #6f9fb8;
  box-shadow: 0 0 0 1px #6f9fb838;
}
.triage-card[draggable='true'] {
  cursor: grab;
}
.triage-card[draggable='true']:active {
  cursor: grabbing;
}
header {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  padding: 7px 12px;
  border-bottom: 1px solid #e6ebe7;
  border-radius: 9px 9px 0 0;
}
.state-approved > header {
  background: linear-gradient(110deg, #deeee2, #f2f9f3);
  border-color: #d5e6d9;
}
.state-pending > header {
  background: linear-gradient(110deg, #eee4c8, #faf6e8);
  border-color: #e7dec7;
}
.state-shared > header {
  background: linear-gradient(110deg, #e0ecf8, #f2f7fd);
  border-color: #d7e4f1;
}
.state-missing > header {
  background: linear-gradient(110deg, #e9eeeb, #f1f4f2);
  border-color: #dde5df;
}
header :deep(.ant-checkbox-wrapper) {
  margin: 0;
}
header img {
  height: 28px;
  width: 28px;
  border-radius: 50%;
  flex: 0 0 28px;
  object-fit: cover;
}
.person {
  min-width: 0;
  flex: 1;
}
.person > button {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0;
  border: 0;
  background: none;
  color: #244431;
  font-size: 12px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}
.person > button span {
  font-weight: 400;
  color: #728879;
  font-size: 12px;
}
.person small {
  display: block;
  color: #789080;
  font-size: 12px;
  line-height: 1.4;
}
.status-pill {
  display: inline-flex;
  gap: 3px;
  align-items: center;
  font-size: 12px;
  padding: 3px 6px;
  border-radius: 5px;
  white-space: nowrap;
  flex-shrink: 0;
}
.status-pill.pending {
  background: #f4efdf;
  color: #786448;
  border: 1px solid #e4dac3;
}
.status-pill.approved {
  background: #e9f5ed;
  color: #488161;
}
.status-pill.missing {
  background: #e9edef;
  color: #7c8a83;
}
.status-pill.shared {
  background: #edf4fb;
  color: #6184a2;
}
.report-title {
  min-width: 0;
  width: calc(100% - 24px);
  margin: 0 12px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  color: #34543e;
  padding: 0;
  border: 0;
  background: none;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: pointer;
}
.one-line-summary {
  font-size: 12px;
  color: #7a8e80;
  line-height: 20px;
  margin: 0 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.signal-row {
  display: flex;
  align-items: center;
  gap: 5px;
  overflow: hidden;
  min-width: 0;
  margin: 0 12px;
}
.signal-row > small {
  font-size: 12px;
  color: #93a196;
}
.ai-signal {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  border-radius: 4px;
  padding: 1px 5px;
  font-size: 12px;
  white-space: nowrap;
}
.ai-signal.risk {
  color: #b2654f;
  background: #fdf0eb;
}
.ai-signal.positive {
  color: #4f8a63;
  background: #edf7ef;
}
footer {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  margin: 0 12px;
}
.compact-meta {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  color: #8b9c90;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.compact-meta > svg {
  display: inline-block;
  margin-right: 3px;
  vertical-align: -2px;
}
.card-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.card-actions :deep(.ant-btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 0 7px;
  height: 24px;
  font-size: 12px;
  box-shadow: none;
}
.card-actions :deep(.ant-btn-primary) {
  background: #247d69;
  border-color: #247d69;
  color: #fff;
}
.card-actions :deep(.ant-btn-default) {
  background: #fff;
  color: #688672;
  border-color: #d7e3da;
}
.card-actions :deep(.ant-btn-text) {
  color: #668a76;
  padding-right: 0;
}
.card-actions :deep(.ant-btn:disabled) {
  color: #9aa89f;
  border-color: #e2e8e4;
  background: #f1f4f2;
}

.triage-card svg {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}
.state-missing {
  background: #f5f7f6;
  border-style: dashed;
  border-color: #cfdad3;
  box-shadow: none;
}
.state-missing header img {
  filter: grayscale(1);
  opacity: 0.55;
}
.state-missing .report-title,
.state-missing .person > button {
  cursor: default;
  color: #7e9184;
}
.score-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #28734f;
  color: #fff;
  font-size: 14px;
  font-weight: 650;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.paper-card .score-badge {
  position: absolute;
  top: 34px;
  right: 22px;
  width: 42px;
  height: 42px;
  font-size: 15px;
}
button:focus-visible {
  outline: 2px solid #4a8d6b;
  outline-offset: 2px;
  border-radius: 3px;
}
@media (max-width: 767px) {
  .triage-card {
    height: 184px;
    grid-template-rows: 52px 22px 20px 22px 44px;
  }
  header {
    padding-top: 9px;
    padding-bottom: 9px;
  }
  header img {
    width: 32px;
    height: 32px;
    flex-basis: 32px;
  }
  .person > button,
  .report-title {
    font-size: 13px;
  }
  .report-title {
    line-height: 22px;
  }
  .card-actions :deep(.ant-btn) {
    height: 44px;
    min-width: 52px;
    padding-left: 11px;
    padding-right: 11px;
    font-size: 13px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .triage-card,
  .paper-card::before {
    transition: none;
  }
}

/* Grid reports use a portrait paper layout; kanban retains compact cards. */
.paper-card {
  position: relative;
  display: flex;
  flex-direction: column;
  aspect-ratio: auto;
  height: auto;
  min-height: 0;
  padding: 32px 22px 14px;
  gap: 0;
  cursor: pointer;
  border-radius: 8px;
  border-color: #dfe5e1;
  box-shadow:
    0 2px 3px #263d3004,
    0 8px 24px #263d3006;
}
.paper-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 10px;
  background: #cfc3a2;
  transition: background-color 180ms ease;
}
.paper-card.state-approved::before {
  background: #a8cbb4;
}
.paper-card.state-shared::before {
  background: #acc8e1;
}
.paper-card.state-pending:hover::before {
  background: #8c7950;
}
.paper-card.state-approved:hover::before {
  background: #28634a;
}
.paper-card.state-shared:hover::before {
  background: #2c5f91;
}
.paper-card.state-missing::before {
  background: #b8c1bb;
}
.paper-type {
  font-weight: 700;
  letter-spacing: 1px;
  margin-bottom: 8px;
  padding-right: 0;
  line-height: 24px;
  color: #304b3b;
  font-size: 17px;
}
.paper-card header {
  padding: 0 0 22px;
  margin-bottom: 0;
  border-radius: 0;
  background: transparent;
  border-bottom: 1px solid #edf0ed;
  gap: 10px;
  min-height: 72px;
  padding-right: 82px;
}
.paper-card header img {
  width: 34px;
  height: 34px;
  flex-basis: 34px;
}
.paper-card .person > button {
  font-size: 14px;
  color: #2c4035;
  line-height: 22px;
}
.paper-card .person small {
  color: #68776e;
  line-height: 20px;
}
.paper-card .status-pill {
  position: absolute;
  top: 38px;
  right: 18px;
  color: #68766e;
  background: #f2f4f2;
  border: 0;
  padding: 3px 7px;
  line-height: 18px;
}
.paper-card .status-pill.approved {
  color: #47725a;
  background: #edf4ef;
}
.paper-card .status-pill.pending {
  color: #71694f;
  background: #f4f2ec;
}
.paper-card .status-pill.shared {
  color: #5e726e;
  background: #eff3f2;
}
.paper-period {
  display: flex;
  flex: none;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 8px;
  padding: 18px 0;
  color: #6a7b70;
  font-size: 13px;
}
.paper-period > svg {
  width: 22px;
  height: 22px;
  color: #879c8e;
  margin-bottom: 2px;
}
.paper-date-row {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px 12px;
  font-size: 13px;
  font-weight: 400;
  color: #667a6d;
  line-height: 1.6;
  font-variant-numeric: tabular-nums;
}
.paper-date-row > span {
  white-space: nowrap;
}
.paper-period strong {
  font-size: 20px;
  font-weight: 400;
  line-height: 1.5;
  color: #50665a;
  font-variant-numeric: tabular-nums;
}
.paper-card .report-title {
  margin: 0;
  width: 100%;
  min-height: 52px;
  font-size: 17px;
  line-height: 26px;
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  color: #253d30;
}
.paper-card .one-line-summary {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  white-space: normal;
  margin: 14px 0 0;
  line-height: 1.75;
  color: #69786f;
  font-size: 13px;
}
.paper-card .signal-row {
  margin: 16px 0 0;
  flex-wrap: wrap;
  gap: 6px;
}
.paper-card .ai-signal {
  padding: 0;
  background: transparent;
  line-height: 20px;
}
.paper-card .ai-signal.risk {
  color: #9c705e;
}
.paper-card .ai-signal.positive {
  color: #65816e;
}
.paper-card footer {
  margin: auto 0 0;
  border-top: 1px solid #edf0ed;
  padding-top: 12px;
  gap: 8px;
  flex-wrap: wrap;
}
.paper-card .compact-meta {
  flex-basis: 100%;
  color: #69796f;
  border-top: 1px solid #edf0ed;
  padding-top: 14px;
  line-height: 20px;
}
.paper-card .card-actions {
  margin-left: auto;
}
.paper-card .card-actions :deep(.ant-btn) {
  height: 36px;
  min-width: 76px;
  padding: 0 16px;
}
/* The action and edge share the same state palette on card hover. */
.triage-card {
  --action-bg: #edf0ed;
  --action-border: #d9e0da;
  --action-text: #627469;
  --action-active: #64756a;
}
.triage-card.state-pending {
  --action-bg: #f1ecdd;
  --action-border: #e0d6bc;
  --action-text: #786542;
  --action-active: #8c7950;
}
.triage-card.state-approved {
  --action-bg: #e7f1ea;
  --action-border: #cfdfd4;
  --action-text: #396a4e;
  --action-active: #28634a;
}
.triage-card.state-shared {
  --action-bg: #e8f0f8;
  --action-border: #d0deec;
  --action-text: #3f678a;
  --action-active: #2c5f91;
}
.triage-card .card-actions :deep(.ant-btn:not(:disabled)) {
  color: var(--action-text);
  background: var(--action-bg);
  border: 1px solid var(--action-border);
  gap: 6px;
  transition:
    background-color 180ms,
    border-color 180ms,
    color 180ms;
}
.triage-card:hover .card-actions :deep(.ant-btn:not(:disabled)),
.triage-card:focus-within .card-actions :deep(.ant-btn:not(:disabled)) {
  background: var(--action-active);
  border-color: var(--action-active);
  color: #fff;
}
.triage-card .card-actions svg {
  width: 14px;
  height: 14px;
}
.paper-card .card-actions :deep(.ant-btn:disabled) {
  color: #8d9991;
  background: #e9edea;
  border-color: #dfe5e0;
}
@media (prefers-reduced-motion: reduce) {
  .triage-card::before,
  .triage-card .card-actions :deep(.ant-btn:not(:disabled)) {
    transition: none;
  }
}
.paper-card:focus-visible {
  outline: 2px solid #468b65;
  outline-offset: 3px;
}
.paper-card.state-missing {
  cursor: default;
  background: #f5f6f5;
}
@media (max-width: 767px) {
  .paper-card {
    min-height: 0;
    aspect-ratio: auto;
    padding: 32px 22px 14px;
  }
  .paper-card .card-actions :deep(.ant-btn) {
    height: 44px;
    min-width: 64px;
  }
}
</style>
