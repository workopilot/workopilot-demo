<script setup lang="ts">
import type { WorkRecordItem } from './demo-state';

import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Input, message, Popconfirm, Upload } from 'ant-design-vue';

import { addManualWorkRecord, evidenceItems, workRecords } from './demo-state';

type DateRange = 'all' | 'month' | 'week' | 'year';

const activeRange = ref<DateRange>('week');
const draft = ref('');
const expandedId = ref('');
const editingId = ref('');
const editingTitle = ref('');
const rangeOptions: Array<{ icon: string; label: string; value: DateRange }> = [
  { icon: 'lucide:layout-list', label: '全部', value: 'all' },
  { icon: 'lucide:calendar-days', label: '本周', value: 'week' },
  { icon: 'lucide:calendar-range', label: '本月', value: 'month' },
  { icon: 'lucide:calendar-fold', label: '今年', value: 'year' },
];

const sortedRecords = computed(() =>
  [...workRecords.value]
    .filter((item) => {
      if (activeRange.value === 'all') return true;
      if (activeRange.value === 'week') return item.date >= '2026-08-10';
      if (activeRange.value === 'month') return item.date.startsWith('2026-08');
      return item.date.startsWith('2026');
    })
    .toSorted((a, b) =>
      `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`),
    ),
);

const dateCount = computed(
  () => new Set(sortedRecords.value.map((item) => item.date)).size,
);

function rangeCount(range: DateRange) {
  if (range === 'all') return workRecords.value.length;
  if (range === 'week')
    return workRecords.value.filter((item) => item.date >= '2026-08-10').length;
  if (range === 'month')
    return workRecords.value.filter((item) => item.date.startsWith('2026-08'))
      .length;
  return workRecords.value.filter((item) => item.date.startsWith('2026'))
    .length;
}

function addRecord() {
  if (!draft.value.trim()) {
    message.warning('请先填写工作内容');
    return;
  }
  addManualWorkRecord(draft.value);
  draft.value = '';
  activeRange.value = 'week';
  message.success('工作记录已添加');
}

function getEvidence(id: string) {
  return evidenceItems.find((item) => item.id === id);
}

function deleteRecord(id: string) {
  workRecords.value = workRecords.value.filter((item) => item.id !== id);
  if (expandedId.value === id) expandedId.value = '';
  message.success('工作记录已删除');
}

function startEdit(record: WorkRecordItem) {
  editingId.value = record.id;
  editingTitle.value = record.title;
}

function saveEdit(record: WorkRecordItem) {
  if (editingId.value !== record.id) return;
  const title = editingTitle.value.trim();
  if (!title) {
    message.warning('工作事项不能为空');
    return;
  }
  record.title = title;
  editingId.value = '';
  message.success('工作事项已更新');
}

function cancelEdit() {
  editingId.value = '';
  editingTitle.value = '';
}

function attachEvidence(
  record: WorkRecordItem,
  file: { name: string; type?: string },
) {
  const id = `ev-upload-${Date.now()}`;
  let type: string;
  if (file.type?.startsWith('image/')) {
    type = 'image';
  } else if (file.type?.startsWith('audio/')) {
    type = 'audio';
  } else if (file.type?.startsWith('video/')) {
    type = 'video';
  } else {
    type = 'document';
  }
  let icon: string;
  switch (type) {
    case 'audio': {
      icon = 'lucide:audio-lines';
      break;
    }
    case 'image': {
      icon = 'lucide:image';
      break;
    }
    case 'video': {
      icon = 'lucide:video';
      break;
    }
    default: {
      icon = 'lucide:file-text';
      break;
    }
  }
  evidenceItems.push({
    id,
    name: file.name,
    type,
    icon,
    meta: '刚刚关联',
    summary: '员工在工作记录中补充的关联附件。',
  });
  record.evidenceIds.push(id);
  message.success(`已关联附件：${file.name}`);
  return false;
}
</script>

<template>
  <div class="work-record-page">
    <header class="page-toolbar">
      <div>
        <span>WORK LOG</span>
        <h1>工作记录</h1>
        <p>对话自动拆分与员工录入的工作事实</p>
      </div>
      <div class="quick-entry">
        <Input
          v-model:value="draft"
          placeholder="快速记录一项已完成工作"
          @press-enter="addRecord"
        />
        <Button class="primary-button" @click="addRecord">
          <Icon icon="lucide:plus" />
          添加
        </Button>
      </div>
    </header>

    <div class="record-layout">
      <aside class="date-filter" aria-label="日期范围筛选">
        <div class="filter-title">
          <span>日期范围</span>
          <Icon icon="lucide:sliders-horizontal" />
        </div>
        <button
          v-for="option in rangeOptions"
          :key="option.value"
          type="button"
          :class="{ 'is-active': activeRange === option.value }"
          @click="activeRange = option.value"
        >
          <Icon :icon="option.icon" />
          <span>{{ option.label }}</span>
          <strong>{{ rangeCount(option.value) }}</strong>
        </button>
        <div class="filter-summary">
          <Icon icon="lucide:list-checks" />
          <span>
            <strong>{{ sortedRecords.length }}</strong>
            条记录
            <br />
            分布于 {{ dateCount }} 个工作日
          </span>
        </div>
        <div class="source-legend">
          <span>
            <i class="conversation-dot"></i>
            对话自动拆分
          </span>
          <span>
            <i class="manual-dot"></i>
            员工录入
          </span>
        </div>
      </aside>

      <main class="record-content">
        <header class="list-header">
          <span>日期</span>
          <div>
            <strong>
              {{
                rangeOptions.find((item) => item.value === activeRange)?.label
              }}工作事项
            </strong>
            <span>按时间倒序</span>
          </div>
          <span>来源</span>
          <span>附件 / 实体</span>
          <span></span>
        </header>

        <section class="compact-list" aria-label="工作记录列表">
          <article
            v-for="record in sortedRecords"
            :key="record.id"
            class="record-row"
            :class="{ 'is-expanded': expandedId === record.id }"
          >
            <div class="record-summary">
              <time>
                <strong>
                  {{ Number(record.date.slice(5, 7)) }}/{{
                    Number(record.date.slice(8, 10))
                  }}
                </strong>
                <small>{{ record.weekday }} · {{ record.time }}</small>
              </time>
              <span class="work-item-cell">
                <span class="status-mark" :class="`is-${record.source}`">
                  <Icon
                    :icon="
                      record.source === 'conversation'
                        ? 'lucide:message-square-text'
                        : 'lucide:notebook-pen'
                    "
                  />
                </span>
                <Input
                  v-if="editingId === record.id"
                  v-model:value="editingTitle"
                  class="inline-title-editor"
                  autofocus
                  aria-label="编辑工作事项"
                  @press-enter="saveEdit(record)"
                  @blur="saveEdit(record)"
                  @keydown.esc="cancelEdit"
                />
                <button
                  v-else
                  class="record-title"
                  type="button"
                  title="点击编辑工作事项"
                  @click="startEdit(record)"
                >
                  <strong>{{ record.title }}</strong>
                  <Icon icon="lucide:pen-line" />
                </button>
              </span>
              <span class="source-label">
                <Icon
                  :icon="
                    record.source === 'conversation'
                      ? 'lucide:messages-square'
                      : 'lucide:user-round-pen'
                  "
                />
                {{ record.source === 'conversation' ? '对话提取' : '员工录入' }}
              </span>
              <span class="relation-summary">
                <span v-if="record.evidenceIds.length > 0">
                  <Icon icon="lucide:paperclip" />
                  {{ record.evidenceIds.length }}
                </span>
                <span v-if="record.entities.length > 0">
                  <Icon icon="lucide:scan-search" />
                  {{ record.entities.length }}
                </span>
                <em
                  v-if="
                    record.evidenceIds.length === 0 &&
                    record.entities.length === 0
                  "
                >
                  —
                </em>
              </span>
              <button
                class="expand-button"
                type="button"
                :aria-label="
                  expandedId === record.id ? '收起记录详情' : '展开记录详情'
                "
                @click="expandedId = expandedId === record.id ? '' : record.id"
              >
                <Icon
                  class="expand-icon"
                  :icon="
                    expandedId === record.id
                      ? 'lucide:chevron-up'
                      : 'lucide:chevron-down'
                  "
                />
              </button>
            </div>

            <div v-if="expandedId === record.id" class="record-detail">
              <Upload
                :show-upload-list="false"
                :before-upload="(file) => attachEvidence(record, file)"
              >
                <button type="button" class="detail-action">
                  <Icon icon="lucide:paperclip" />
                  关联附件
                </button>
              </Upload>
              <button
                v-for="id in record.evidenceIds"
                :key="id"
                type="button"
                class="detail-chip"
                @click="message.info(`正在预览：${getEvidence(id)?.name}`)"
              >
                <Icon :icon="getEvidence(id)?.icon || 'lucide:file'" />
                {{ getEvidence(id)?.name }}
              </button>
              <span
                v-for="entity in record.entities"
                :key="`${entity.type}-${entity.name}`"
                class="detail-chip entity"
              >
                <Icon icon="lucide:scan-search" />
                {{ entity.type }} · {{ entity.name }}
              </span>
              <Popconfirm
                title="确定删除这条工作记录吗？"
                ok-text="删除"
                cancel-text="取消"
                @confirm="deleteRecord(record.id)"
              >
                <button type="button" class="detail-more delete-action">
                  <Icon icon="lucide:trash-2" />
                  删除记录
                </button>
              </Popconfirm>
            </div>
          </article>
          <div v-if="sortedRecords.length === 0" class="empty-state">
            <Icon icon="lucide:inbox" />
            <span>当前范围暂无工作记录</span>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<style scoped>
.work-record-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: #173f36;
  background: #f2f6f4;
  border: 1px solid #d4e2dd;
  border-radius: 14px;
}

.page-toolbar {
  display: flex;
  flex: none;
  gap: 24px;
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
  padding: 8px 20px;
  background: #fff;
  border-bottom: 1px solid #dce7e3;
}

.page-toolbar > div:first-child > span {
  font-size: 12px;
  font-weight: 800;
  color: #087565;
  letter-spacing: 0.12em;
}

.page-toolbar h1 {
  display: inline;
  margin: 0 10px 0 0;
  font-size: 22px;
}

.page-toolbar p {
  display: inline;
  margin: 0;
  font-size: 12px;
  color: #71867f;
}

.quick-entry {
  display: flex;
  gap: 8px;
  width: min(470px, 45%);
}

.quick-entry :deep(.ant-input) {
  height: 36px;
  font-size: 12px;
  border-color: #c6d8d2;
  border-radius: 7px;
}

.primary-button {
  height: 36px !important;
  font-size: 12px;
  font-weight: 700;
  color: #fff !important;
  background: #086f61 !important;
  border-color: #086f61 !important;
}

.record-layout {
  display: grid;
  flex: 1;
  grid-template-columns: 190px minmax(0, 1fr);
  min-height: 0;
}

.date-filter {
  padding: 14px 12px;
  background: #f9fbfa;
  border-right: 1px solid #d9e5e1;
}

.filter-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px 9px;
  font-size: 12px;
  font-weight: 800;
  color: #587069;
}

.date-filter > button {
  display: grid;
  grid-template-columns: 20px 1fr auto;
  gap: 8px;
  align-items: center;
  width: 100%;
  height: 44px;
  padding: 0 10px;
  margin-bottom: 4px;
  font-size: 13px;
  color: #426158;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
}

.date-filter > button:hover {
  background: #eef5f2;
}

.date-filter > button.is-active {
  color: #076d5f;
  background: #e1f1ec;
  border-color: #abd0c5;
}

.date-filter > button strong {
  display: grid;
  place-items: center;
  min-width: 25px;
  height: 22px;
  font-size: 12px;
  background: #fff;
  border: 1px solid #d7e4e0;
  border-radius: 999px;
}

.filter-summary {
  display: flex;
  gap: 9px;
  padding: 12px 9px;
  margin-top: 14px;
  font-size: 12px;
  line-height: 1.6;
  color: #6d827b;
  background: #eef4f2;
  border-radius: 8px;
}

.filter-summary > svg {
  flex: none;
  margin-top: 3px;
  color: #087565;
}

.filter-summary strong {
  font-size: 16px;
  color: #0b7768;
}

.source-legend {
  display: grid;
  gap: 8px;
  padding: 14px 8px;
  font-size: 12px;
  color: #71857f;
}

.source-legend span {
  display: flex;
  gap: 7px;
  align-items: center;
}

.source-legend i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.conversation-dot {
  background: #0b806f;
}

.manual-dot {
  background: #80958e;
}

.record-content {
  min-width: 0;
  padding: 6px 14px 12px;
  overflow: auto;
}

.list-header {
  display: grid;
  grid-template-columns: minmax(320px, 1fr) 110px 106px 105px 24px;
  gap: 8px;
  align-items: center;
  height: 32px;
  padding: 0 13px;
  font-size: 12px;
  color: #70847d;
}

.list-header > div {
  display: flex;
  gap: 9px;
  align-items: center;
}

.list-header > div strong {
  font-size: 13px;
  color: #244c42;
}

.compact-list {
  overflow: hidden;
  background: #fff;
  border: 1px solid #d7e4df;
  border-radius: 9px;
}

.record-row {
  border-bottom: 1px solid #e7eeeb;
}

.record-row:last-child {
  border-bottom: 0;
}

.record-row:hover {
  background: #f8fbfa;
}

.record-summary {
  display: grid;
  grid-template-columns: 26px minmax(280px, 1fr) 110px 106px 105px 24px;
  gap: 8px;
  align-items: center;
  width: 100%;
  min-height: 44px;
  padding: 2px 12px;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.status-mark {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  color: #fff;
  background: #81968f;
  border-radius: 6px;
}

.status-mark.is-conversation {
  background: #0b806f;
}

.status-mark svg {
  width: 13px;
}

.record-title {
  display: grid;
  min-width: 0;
}

.record-title strong {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  font-weight: 650;
  white-space: nowrap;
}

.record-title small {
  margin-top: 1px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: #83948f;
  white-space: nowrap;
}

.record-summary time {
  display: grid;
}

.record-summary time strong {
  font-size: 13px;
}

.record-summary time small {
  font-size: 12px;
  color: #7b8e88;
}

.source-label {
  display: flex;
  gap: 5px;
  align-items: center;
  font-size: 12px;
  color: #59736b;
}

.relation-summary {
  display: flex;
  gap: 6px;
  align-items: center;
}

.relation-summary > span {
  display: inline-flex;
  gap: 3px;
  align-items: center;
  min-width: 34px;
  font-size: 12px;
  color: #4d6e65;
}

.relation-summary em {
  font-size: 12px;
  color: #9aaba6;
}

.expand-icon {
  color: #879a94;
}

.record-detail {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  min-height: 41px;
  padding: 5px 12px 7px 46px;
  background: #f5f9f7;
  border-top: 1px dashed #dce7e3;
}

.detail-action,
.detail-chip,
.detail-more {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  min-height: 29px;
  padding: 4px 8px;
  font-size: 12px;
  color: #46685f;
  background: #fff;
  border: 1px solid #d2e1dc;
  border-radius: 6px;
}

.detail-action,
.detail-more,
.detail-chip:is(button) {
  cursor: pointer;
}

.detail-action:hover,
.detail-more:hover,
.detail-chip:is(button):hover {
  color: #087565;
  border-color: #9fc9bd;
}

.detail-chip.entity {
  color: #46618a;
  background: #f4f7fb;
  border-color: #d8e0eb;
}

.detail-more {
  margin-left: auto;
  background: transparent;
}

.empty-state {
  display: grid;
  gap: 8px;
  place-items: center;
  padding: 70px;
  color: #81958e;
}

.empty-state svg {
  font-size: 28px;
}

@media (max-width: 900px) {
  .page-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .quick-entry {
    width: 100%;
  }

  .record-layout {
    grid-template-columns: 1fr;
  }

  .date-filter {
    display: flex;
    gap: 6px;
    padding: 8px;
    border-right: 0;
    border-bottom: 1px solid #d9e5e1;
  }

  .filter-title,
  .filter-summary,
  .source-legend {
    display: none;
  }

  .date-filter > button {
    margin: 0;
  }

  .list-header {
    display: none;
  }

  .record-content {
    padding: 10px;
  }

  .record-summary {
    grid-template-columns: 26px minmax(180px, 1fr) 92px 24px;
  }

  .source-label,
  .relation-summary {
    display: none;
  }
}
</style>
<style scoped>
.list-header,
.record-summary {
  grid-template-columns: 110px minmax(320px, 1fr) 106px 105px 24px;
}

.record-summary {
  cursor: default;
}

.work-item-cell {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.record-title {
  display: flex;
  flex: 1;
  gap: 7px;
  align-items: center;
  min-width: 0;
  padding: 4px 2px;
  color: inherit;
  text-align: left;
  cursor: text;
  background: transparent;
  border: 0;
}

.record-title strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-title svg {
  flex: none;
  color: #82958f;
  opacity: 0;
  transition: opacity 160ms ease;
}

.record-title:hover svg,
.record-title:focus-visible svg {
  opacity: 1;
}

.inline-title-editor {
  flex: 1;
  min-width: 0;
}

.inline-title-editor :deep(.ant-input),
.inline-title-editor {
  height: 32px;
  font-size: 13px;
}

.expand-button {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: #71867f;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 6px;
}

.expand-button:hover {
  color: #087565;
  background: #e8f2ef;
}

.delete-action {
  color: #a34040;
  border-color: #e3caca;
}

.delete-action:hover {
  color: #8d2525 !important;
  background: #fff5f5 !important;
  border-color: #cf9292 !important;
}

@media (max-width: 900px) {
  .record-summary {
    grid-template-columns: 92px minmax(180px, 1fr) 24px;
  }

  .record-summary > .source-label,
  .record-summary > .relation-summary {
    display: none;
  }
}
</style>
