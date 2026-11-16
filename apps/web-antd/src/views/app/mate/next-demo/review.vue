<script setup lang="ts">
import type { PendingApprovalItem, ReportType } from './demo-state';

import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, message, Modal, Select } from 'ant-design-vue';

import {
  evidenceItems,
  mockPendingApprovals,
  reportTypeIcons,
  reportTypeLabels,
  workRecords,
} from './demo-state';

type ApprovalStatusFilter = 'all' | 'approved' | 'unapproved';

const typeFilter = ref<'all' | ReportType>('all');
const router = useRouter();
const approvalStatusFilter = ref<ApprovalStatusFilter>('all');

// 时间筛选：年份 + 周次（带日期），支持多选
const yearOptions = [
  { label: '2026 年', value: 2026 },
  { label: '2025 年', value: 2025 },
];
const selectedYear = ref(2026);
const selectedWeeks = ref<string[]>([]);

const weeksByYear: Record<number, Array<{ label: string; value: string }>> = {
  2026: [
    { value: '2026-w34', label: '第 34 周（8/17—8/23）' },
    { value: '2026-w33', label: '第 33 周（8/10—8/16）' },
    { value: '2026-w32', label: '第 32 周（8/3—8/9）' },
    { value: '2026-w31', label: '第 31 周（7/27—8/2）' },
  ],
  2025: [
    { value: '2025-w34', label: '第 34 周（8/18—8/24）' },
    { value: '2025-w33', label: '第 33 周（8/11—8/17）' },
  ],
};
const weekOptions = computed(() => weeksByYear[selectedYear.value] || []);

// 本周/上周快捷选项，与周次多选共用 selectedWeeks
const quickWeekPresets: Array<{ label: string; value: string }> = [
  { label: '本周', value: '2026-w34' },
  { label: '上周', value: '2026-w33' },
];

function toggleQuickWeek(value: string) {
  selectedWeeks.value = selectedWeeks.value.includes(value)
    ? selectedWeeks.value.filter((w) => w !== value)
    : [...selectedWeeks.value, value];
}

watch(selectedYear, () => {
  selectedWeeks.value = [];
});

const remindedIds = ref<Set<string>>(new Set());

const typeFilterOptions = computed(() => [
  { label: '全部类型', value: 'all' },
  ...(Object.keys(reportTypeLabels) as ReportType[])
    .filter((value) => value !== 'department')
    .map((value) => ({
      label: reportTypeLabels[value],
      value,
    })),
]);

const approvalStatusOptions: Array<{
  label: string;
  value: ApprovalStatusFilter;
}> = [
  { label: '全部', value: 'all' },
  { label: '已审批', value: 'approved' },
  { label: '未审批', value: 'unapproved' },
];

const hasActiveFilter = computed(
  () =>
    typeFilter.value !== 'all' ||
    approvalStatusFilter.value !== 'all' ||
    selectedWeeks.value.length > 0,
);

const filteredApprovals = computed(() => {
  let list = [...mockPendingApprovals.value];

  if (typeFilter.value !== 'all') {
    list = list.filter((r) => r.reportType === typeFilter.value);
  }

  if (approvalStatusFilter.value === 'approved') {
    list = list.filter((r) => r.status === 'approved');
  } else if (approvalStatusFilter.value === 'unapproved') {
    list = list.filter((r) => r.status !== 'approved');
  }

  if (selectedWeeks.value.length > 0) {
    list = list.filter((r) =>
      selectedWeeks.value.includes(`${r.date.slice(0, 4)}-${r.weekKey}`),
    );
  }

  // 默认按时间倒序：本周在前、上周在后；同周内按提交状态（未提交靠后）
  const weekOrder: Record<string, number> = { w34: 0, w33: 1 };
  const statusOrder: Record<string, number> = {
    pending: 0,
    approved: 1,
    missing: 2,
  };
  return list.sort((a, b) => {
    const wk = (weekOrder[a.weekKey] ?? 9) - (weekOrder[b.weekKey] ?? 9);
    if (wk !== 0) return wk;
    return (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
  });
});

function resetFilters() {
  typeFilter.value = 'all';
  approvalStatusFilter.value = 'all';
  selectedWeeks.value = [];
}

// 日报查看弹窗
const viewDailyItem = ref<null | PendingApprovalItem>(null);
const dailyModalOpen = ref(false);
const dailyAttachments = computed(
  () =>
    (viewDailyItem.value?.attachmentIds || [])
      .map((id) => evidenceItems.find((e) => e.id === id))
      .filter(Boolean) as typeof evidenceItems,
);

// 日报内容 = 当天工作记录（汇报助理工作记录页面当天的工作事项）
const dailyWorkRecords = computed(() =>
  viewDailyItem.value
    ? workRecords.value
        .filter((r) => r.date === viewDailyItem.value!.date)
        .sort((a, b) => a.time.localeCompare(b.time))
    : [],
);

function recordEvidenceNames(ids: string[]) {
  return ids
    .map((id) => evidenceItems.find((e) => e.id === id)?.name)
    .filter(Boolean) as string[];
}

function attachmentIcon(type: string) {
  if (type === 'audio') return 'lucide:audio-lines';
  if (type === 'video') return 'lucide:video';
  if (type === 'image') return 'lucide:image';
  return 'lucide:file-text';
}

// 查看：日报走弹窗，其他走新标签页（openReport）；missing 不可查看
function handleView(item: PendingApprovalItem) {
  if (item.status === 'missing') return;
  if (item.period === 'daily') {
    viewDailyItem.value = item;
    dailyModalOpen.value = true;
  } else {
    openReport(item.id);
  }
}

function sendReminder(id: string) {
  const item = mockPendingApprovals.value.find((r) => r.id === id);
  if (!item) return;
  remindedIds.value = new Set([id, ...remindedIds.value]);
  message.success(`已向 ${item.author} 发送催办提醒`);
}

function openReport(id: string) {
  const item = mockPendingApprovals.value.find((r) => r.id === id);
  if (!item || item.status === 'missing') return;
  const reportId = item.weekKey === 'w34' ? '2026-w34' : '2026-w33';
  void router.push({
    path: '/app/mate/employee/review-copilot/review-report',
    query: { reportId, review: '1', employee: item.id },
  });
}
</script>

<template>
  <div class="report-assistant">
    <header class="assistant-hero">
      <div>
        <span class="hero-eyebrow">REPORT ASSISTANT</span>
        <h1>报告助理</h1>
        <p>
          整合待审批报告，按报告类型、时间段与审批状态筛选，默认按时间倒序排列。
        </p>
      </div>
    </header>

    <div class="assistant-filters">
      <div class="filter-group">
        <span class="filter-label">报告类型</span>
        <div class="filter-chips">
          <button
            v-for="opt in typeFilterOptions"
            :key="opt.value"
            type="button"
            :class="{ 'is-active': typeFilter === opt.value }"
            @click="typeFilter = opt.value as ReportType | 'all'"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <div class="filter-group">
        <span class="filter-label">时间</span>
        <div class="filter-chips">
          <button
            v-for="opt in quickWeekPresets"
            :key="opt.value"
            type="button"
            :class="{ 'is-active': selectedWeeks.includes(opt.value) }"
            @click="toggleQuickWeek(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
        <Select
          v-model:value="selectedYear"
          :options="yearOptions"
          size="middle"
          class="year-select"
        />
        <Select
          v-model:value="selectedWeeks"
          mode="multiple"
          :options="weekOptions"
          placeholder="选择周次（可多选）"
          :max-tag-count="2"
          class="week-select"
        />
      </div>

      <div class="filter-group">
        <span class="filter-label">审批状态</span>
        <div class="filter-chips">
          <button
            v-for="opt in approvalStatusOptions"
            :key="opt.value"
            type="button"
            :class="{ 'is-active': approvalStatusFilter === opt.value }"
            @click="approvalStatusFilter = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <button
        v-if="hasActiveFilter"
        type="button"
        class="filter-clear"
        @click="resetFilters"
      >
        <Icon icon="lucide:rotate-ccw" />
        清除筛选
      </button>
    </div>

    <section class="approval-grid">
      <article
        v-for="item in filteredApprovals"
        :key="item.id"
        class="approval-card"
        :class="`is-${item.status}`"
      >
        <header>
          <button
            class="employee-avatar"
            type="button"
            @click="handleView(item)"
          >
            <img :src="item.avatar" :alt="item.author" />
          </button>
          <div>
            <strong>{{ item.author }}</strong>
            <small>{{ item.dept }}</small>
          </div>
          <span class="report-type-tag" :class="`type-${item.reportType}`">
            <Icon :icon="reportTypeIcons[item.reportType]" />
            {{ reportTypeLabels[item.reportType] }}
          </span>
        </header>
        <h3>{{ item.title }}</h3>
        <p>{{ item.summary }}</p>
        <div class="approval-meta">
          <small>{{ item.weekLabel }}</small>
          <small>{{ item.submittedAt }}</small>
        </div>
        <div v-if="item.entities.length > 0" class="card-entities">
          <span v-for="entity in item.entities" :key="entity">
            <Icon icon="lucide:boxes" />
            {{ entity }}
          </span>
        </div>
        <footer>
          <span v-if="item.status === 'approved'" class="approval-score">
            <Icon icon="lucide:star" />
            {{ item.score.toFixed(1) }}
          </span>
          <span class="approval-status" :class="`is-${item.status}`">
            <Icon
              :icon="
                item.status === 'approved'
                  ? 'lucide:circle-check'
                  : item.status === 'missing'
                    ? 'lucide:file-clock'
                    : 'lucide:message-circle-more'
              "
            />
            {{
              item.status === 'approved'
                ? '已审批'
                : item.status === 'missing'
                  ? '未提交'
                  : '待审批'
            }}
          </span>

          <Button
            v-if="item.status === 'missing' && !remindedIds.has(item.id)"
            size="small"
            type="primary"
            danger
            ghost
            @click="sendReminder(item.id)"
          >
            <Icon icon="lucide:bell-ring" />
            催办
          </Button>
          <span
            v-else-if="item.status === 'missing' && remindedIds.has(item.id)"
            class="reminded-tag"
          >
            <Icon icon="lucide:check" />
            已催办
          </span>

          <Button
            v-if="item.status === 'pending'"
            size="small"
            type="primary"
            @click="handleView(item)"
          >
            查看
          </Button>
          <Button
            v-if="item.status === 'approved'"
            size="small"
            @click="handleView(item)"
          >
            查看
          </Button>
        </footer>
      </article>

      <div v-if="filteredApprovals.length === 0" class="empty-state">
        <Icon icon="lucide:inbox" />
        <p>当前筛选下暂无报告</p>
      </div>
    </section>

    <!-- 日报查看弹窗 -->
    <Modal
      v-model:open="dailyModalOpen"
      :title="viewDailyItem?.title"
      :width="680"
      :footer="null"
      destroy-on-close
      @cancel="dailyModalOpen = false"
    >
      <div v-if="viewDailyItem" class="daily-modal">
        <div class="daily-meta">
          <span
            class="report-type-tag"
            :class="`type-${viewDailyItem.reportType}`"
          >
            <Icon :icon="reportTypeIcons[viewDailyItem.reportType]" />
            {{ reportTypeLabels[viewDailyItem.reportType] }}
          </span>
          <small>{{ viewDailyItem.author }} · {{ viewDailyItem.dept }}</small>
          <small>{{ viewDailyItem.weekLabel }}</small>
          <small>提交于 {{ viewDailyItem.submittedAt }}</small>
        </div>
        <!-- 当天工作事项（来源：工作记录页面） -->
        <div class="daily-section">
          <strong>
            <Icon icon="lucide:list-checks" />
            当日工作事项
          </strong>
          <div
            v-for="record in dailyWorkRecords"
            :key="record.id"
            class="daily-work-item"
          >
            <span class="work-time">{{ record.time }}</span>
            <div class="work-main">
              <b>{{ record.title }}</b>
              <div class="work-tags">
                <span class="work-source" :class="`is-${record.source}`">
                  {{
                    record.source === 'conversation' ? '对话生成' : '手动录入'
                  }}
                </span>
                <span
                  v-for="entity in record.entities"
                  :key="entity.name"
                  class="work-entity"
                  :class="`is-${entity.type}`"
                >
                  <Icon icon="lucide:boxes" />
                  {{ entity.name }}
                </span>
              </div>
              <small v-if="record.original" class="work-original">
                原文：{{ record.original }}
              </small>
              <small
                v-if="recordEvidenceNames(record.evidenceIds).length > 0"
                class="work-evidence"
              >
                关联证据：{{
                  recordEvidenceNames(record.evidenceIds).join('、')
                }}
              </small>
            </div>
          </div>
          <div v-if="dailyWorkRecords.length === 0" class="entity-empty">
            <Icon icon="lucide:inbox" />
            当日暂无工作事项
          </div>
        </div>
        <div v-if="dailyAttachments.length > 0" class="daily-attachments">
          <strong>
            <Icon icon="lucide:paperclip" />
            关联附件
          </strong>
          <div
            v-for="file in dailyAttachments"
            :key="file.id"
            class="daily-attachment-row"
          >
            <span class="daily-attachment-icon">
              <Icon :icon="attachmentIcon(file.type)" />
            </span>
            <span class="daily-attachment-copy">
              <b>{{ file.name }}</b>
              <small>{{ file.meta }}</small>
            </span>
            <span class="daily-attachment-summary">{{ file.summary }}</span>
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.report-assistant {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  height: 100%;
  min-height: 0;
  overflow: auto;
  background: #f3f7f5;
}

.assistant-hero {
  flex: none;
  padding: 20px 24px 16px;
  background: #fff;
  border-bottom: 1px solid #d5e3de;
}

.hero-eyebrow {
  font-size: 11px;
  font-weight: 800;
  color: #8ba39d;
  letter-spacing: 0.14em;
}

.assistant-hero h1 {
  margin: 4px 0 6px;
  font-size: 22px;
  font-weight: 700;
  color: #0f2925;
}

.assistant-hero > div > p {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: #58736c;
}

.assistant-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  align-items: center;
  padding: 12px 14px;
  margin: 16px 24px;
  background: #f7fbf9;
  border: 1px solid #dceae4;
  border-radius: 10px;
}

.filter-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.filter-label {
  font-size: 11px;
  font-weight: 700;
  color: #78918a;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.filter-chips button {
  padding: 5px 12px;
  font-size: 12px;
  color: #475569;
  cursor: pointer;
  background: #fff;
  border: 1px solid #d6e4df;
  border-radius: 999px;
  transition: 0.18s ease;
}

.filter-chips button:hover {
  border-color: #9cc9bd;
  color: #0b6e65;
}

.filter-chips button.is-active {
  font-weight: 700;
  color: #fff;
  background: #0b6e65;
  border-color: #0b6e65;
}

.year-select {
  width: 110px;
}

.week-select {
  min-width: 240px;
  max-width: 360px;
}

.filter-clear {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  margin-left: auto;
  padding: 5px 10px;
  font-size: 11px;
  color: #55736a;
  cursor: pointer;
  background: #fff;
  border: 1px solid #d6e4df;
  border-radius: 8px;
}

.approval-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  padding: 0 24px 24px;
}

.approval-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: #fff;
  border: 1px solid #d5e3de;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgb(18 57 45 / 4%);
  transition: 0.18s ease;
}

.approval-card:hover {
  border-color: #9cc9bd;
  box-shadow: 0 8px 22px rgb(18 57 45 / 8%);
}

.approval-card.is-approved {
  border-left: 3px solid #10b981;
}

.approval-card.is-pending {
  border-left: 3px solid #f59e0b;
}

.approval-card.is-missing {
  border-left: 3px solid #ef626b;
}

.approval-card header {
  display: flex;
  gap: 10px;
  align-items: center;
}

.employee-avatar {
  flex: none;
  width: 40px;
  height: 40px;
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  background: #e4f2ed;
  border: 0;
  border-radius: 50%;
}

.employee-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
}

.approval-card header > div {
  flex: 1;
  min-width: 0;
}

.approval-card header strong {
  display: block;
  font-size: 14px;
  color: #0f2925;
}

.approval-card header small {
  display: block;
  font-size: 11px;
  color: #759087;
}

.report-type-tag {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 3px 9px;
  font-size: 11px;
  font-weight: 600;
  color: #0b6e65;
  background: #e4f2ed;
  border-radius: 999px;
}

.approval-card h3 {
  margin: 4px 0 0;
  font-size: 14px;
  font-weight: 700;
  color: #14382f;
}

.approval-card > p {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: #475569;
}

.approval-meta {
  display: flex;
  gap: 12px;
}

.approval-meta small {
  font-size: 11px;
  color: #94a3b8;
}

.card-entities {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.card-entities span {
  display: inline-flex;
  gap: 3px;
  align-items: center;
  padding: 2px 8px;
  font-size: 11px;
  color: #475569;
  background: #f1f6f4;
  border-radius: 6px;
}

.approval-card footer {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 4px;
  padding-top: 10px;
  border-top: 1px solid #edf3f0;
}

.approval-score {
  display: inline-flex;
  gap: 3px;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
  color: #d97706;
}

.approval-status {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  flex: 1;
  font-size: 12px;
  font-weight: 600;
}

.approval-status.is-approved {
  color: #059669;
}

.approval-status.is-pending {
  color: #d97706;
}

.approval-status.is-missing {
  color: #ef626b;
}

.reminded-tag {
  display: inline-flex;
  gap: 3px;
  align-items: center;
  padding: 2px 8px;
  font-size: 11px;
  color: #059669;
  background: #d1fae5;
  border-radius: 999px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: center;
  grid-column: 1 / -1;
  padding: 48px 0;
  color: #94a3b8;
  font-size: 13px;
}

.empty-state svg {
  font-size: 36px;
}

/* 日报查看弹窗 */
.daily-modal {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.daily-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #edf3f0;
}

.daily-meta small {
  font-size: 12px;
  color: #759087;
}

.daily-content {
  padding: 16px 18px;
  font-size: 14px;
  line-height: 1.75;
  color: #2d4a44;
  background: #f7fbf9;
  border: 1px solid #dceae4;
  border-radius: 10px;
}

.daily-content :deep(h2) {
  margin: 12px 0 6px;
  font-size: 15px;
  color: #163f35;
}

.daily-content :deep(ul) {
  padding-left: 20px;
}

.daily-content :deep(li) {
  margin: 4px 0;
  line-height: 1.7;
}

/* 当日工作事项 */
.daily-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.daily-section > strong {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 13px;
  color: #174e42;
}

.daily-work-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f7fbf9;
  border: 1px solid #dceae4;
  border-radius: 8px;
}

.work-time {
  flex: none;
  width: 48px;
  font-size: 12px;
  font-weight: 700;
  color: #0b6e65;
}

.work-main {
  flex: 1;
  min-width: 0;
}

.work-main b {
  display: block;
  font-size: 13px;
  color: #163f35;
}

.work-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.work-source {
  padding: 1px 7px;
  font-size: 10px;
  border-radius: 999px;
}

.work-source.is-conversation {
  color: #316998;
  background: #eaf3fa;
}

.work-source.is-manual {
  color: #95601e;
  background: #fff3df;
}

.work-entity {
  display: inline-flex;
  gap: 3px;
  align-items: center;
  padding: 1px 7px;
  font-size: 10px;
  color: #496a61;
  background: #edf5f2;
  border-radius: 5px;
}

.work-original,
.work-evidence {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: #94a3b8;
}

.daily-attachments {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.daily-attachments > strong {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 13px;
  color: #174e42;
}

.daily-attachment-row {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  background: #f7fbf9;
  border: 1px solid #dceae4;
  border-radius: 8px;
}

.daily-attachment-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  font-size: 16px;
  color: #0b6e65;
  background: #e8f5f0;
  border-radius: 7px;
  flex: none;
}

.daily-attachment-copy {
  flex: none;
  min-width: 180px;
}

.daily-attachment-copy b {
  display: block;
  font-size: 13px;
  color: #163f35;
}

.daily-attachment-copy small {
  display: block;
  font-size: 11px;
  color: #94a3b8;
}

.daily-attachment-summary {
  flex: 1;
  font-size: 12px;
  line-height: 1.6;
  color: #475569;
}
</style>
