<script setup lang="ts">
import type { WeeklyReportItem } from './demo-state';

import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, DatePicker, Tag } from 'ant-design-vue';

import {
  catalogReports,
  createCurrentDraft,
  filterReportsByRange,
  reportCatalog,
  reportPeriodColors,
  reportPeriodLabels,
  reportTypeIcons,
} from './demo-state';
import ReportDocument from './report-document.vue';

const route = useRoute();
const router = useRouter();

const catalogId = computed(() => String(route.params.catalogId ?? ''));
const catalog = computed(
  () => reportCatalog.find((item) => item.id === catalogId.value) ?? null,
);

// 日期区间查询：匹配与所选区间有交集的报告期次（日报是单日的特例）
const rangeFilter = ref<[string, string] | undefined>(undefined);

const allReports = computed(() => catalogReports(catalogId.value));
const reports = computed(() =>
  filterReportsByRange(
    allReports.value,
    rangeFilter.value?.[0],
    rangeFilter.value?.[1],
  ),
);

function clearRangeFilter() {
  rangeFilter.value = undefined;
}

const openMonths = ref<string[]>([]);
const archiveCollapsed = ref(false);

const statusLabels: Record<WeeklyReportItem['status'], string> = {
  draft: '草稿',
  reviewed: '已审阅',
  submitted: '已提交',
};

// 默认选中本期草稿；没有草稿则选最近一期
const selectedId = ref('');
const selectedReport = computed(() => {
  const list = reports.value;
  return (
    list.find((item) => item.id === selectedId.value) ||
    list.find((item) => item.status === 'draft') ||
    list[0]
  );
});

const grouped = computed(() => {
  const months = [...new Set(reports.value.map((item) => item.month))];
  return months.map((month) => ({
    month,
    reports: reports.value.filter((item) => item.month === month),
  }));
});

// 默认展开最近的两个月；openMonths 为空时按此规则兜底
function isMonthOpen(index: number, month: string) {
  return openMonths.value.length === 0
    ? index < 2
    : openMonths.value.includes(month);
}

function toggleMonth(month: string) {
  const current =
    openMonths.value.length > 0
      ? openMonths.value
      : grouped.value.slice(0, 2).map((group) => group.month);
  openMonths.value = current.includes(month)
    ? current.filter((item) => item !== month)
    : [...current, month];
}

function selectReport(id: string) {
  selectedId.value = id;
}

/** 生成本期草稿（Demo） */
function generateCurrent() {
  if (!catalog.value) return;
  const draft = createCurrentDraft(catalog.value);
  selectedId.value = draft.id;
  openMonths.value = [draft.month, ...openMonths.value];
}

function backToCenter() {
  void router.push('/app/mate/employee/report-copilot/reports');
}
</script>

<template>
  <div v-if="catalog" class="report-workspace">
    <aside v-if="!archiveCollapsed" class="archive-panel">
      <header>
        <button class="back-button" type="button" @click="backToCenter">
          <Icon icon="lucide:arrow-left" />
          报告中心
        </button>
        <div class="archive-title-row">
          <h2>{{ catalog.title }}</h2>
          <button
            type="button"
            aria-label="折叠归档面板"
            title="折叠归档面板"
            @click="archiveCollapsed = true"
          >
            <Icon icon="lucide:panel-left-close" />
          </button>
        </div>
        <p>
          <Tag :color="reportPeriodColors[catalog.period]">
            {{ reportPeriodLabels[catalog.period] }}
          </Tag>
          {{ catalog.schedule }} · 共 {{ reports.length }} 份
        </p>
        <div class="range-filter">
          <DatePicker.RangePicker
            v-model:value="rangeFilter"
            value-format="YYYY-MM-DD"
            :placeholder="['开始日期', '结束日期']"
          />
          <button
            v-if="rangeFilter"
            type="button"
            class="range-clear"
            title="清除日期筛选"
            @click="clearRangeFilter"
          >
            <Icon icon="lucide:x" />
          </button>
        </div>
      </header>
      <nav aria-label="报告期次归档">
        <section v-for="(group, groupIndex) in grouped" :key="group.month">
          <button
            class="month-button"
            type="button"
            :aria-expanded="isMonthOpen(groupIndex, group.month)"
            @click="toggleMonth(group.month)"
          >
            <Icon
              :icon="
                isMonthOpen(groupIndex, group.month)
                  ? 'lucide:folder-open'
                  : 'lucide:folder'
              "
            />
            <strong>{{ group.month }}</strong>
            <span>{{ group.reports.length }} 份</span>
            <Icon
              :icon="
                isMonthOpen(groupIndex, group.month)
                  ? 'lucide:chevron-down'
                  : 'lucide:chevron-right'
              "
            />
          </button>
          <div v-if="isMonthOpen(groupIndex, group.month)" class="period-list">
            <button
              v-for="report in group.reports"
              :key="report.id"
              type="button"
              :class="{ 'is-active': selectedReport?.id === report.id }"
              @click="selectReport(report.id)"
            >
              <span class="period-dot"></span>
              <div>
                <strong>{{ report.weekLabel }}</strong>
                <small>{{ report.range }}</small>
              </div>
              <span class="status-pill" :class="`is-${report.status}`">
                {{ statusLabels[report.status] }}
              </span>
            </button>
          </div>
        </section>
      </nav>
      <div class="archive-note">
        <Icon :icon="reportTypeIcons[catalog.reportType]" />
        <p>汇报由资料和对话生成。需要修改时，直接告诉汇报助理。</p>
      </div>
    </aside>

    <main class="document-panel">
      <ReportDocument
        v-if="selectedReport"
        :key="selectedReport.id"
        :report="selectedReport"
        :report-period="catalog.period"
        :readonly="selectedReport.status !== 'draft'"
        show-archive-toggle
        :archive-collapsed="archiveCollapsed"
        @toggle-archive="archiveCollapsed = !archiveCollapsed"
      />
      <div v-else class="empty-panel">
        <template v-if="allReports.length > 0">
          <Icon icon="lucide:calendar-x" />
          <h3>所选日期区间内没有报告期次</h3>
          <p>
            换个区间试试，或清除日期筛选查看全部 {{ allReports.length }} 份。
          </p>
          <Button @click="clearRangeFilter">
            <Icon icon="lucide:filter-x" />
            清除日期筛选
          </Button>
        </template>
        <template v-else>
          <Icon icon="lucide:file-plus-2" />
          <h3>本期报告尚未生成</h3>
          <p>
            {{ catalog.schedule }}，可由汇报助理根据资料和对话生成本期报告。
          </p>
          <Button type="primary" @click="generateCurrent">
            <Icon icon="lucide:sparkles" />
            生成本期报告
          </Button>
        </template>
      </div>
    </main>
  </div>

  <div v-else class="missing-panel">
    <Icon icon="lucide:file-question" />
    <h3>没有找到这份报告</h3>
    <Button type="primary" @click="backToCenter">返回报告中心</Button>
  </div>
</template>

<style scoped>
.report-workspace {
  display: grid;
  grid-template-columns: 270px minmax(0, 1fr);
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: #eef4f2;
  border: 1px solid #d5e3de;
  border-radius: 14px;
}

.archive-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #f8fbfa;
  border-right: 1px solid #dbe7e3;
}

.archive-panel header {
  padding: 18px 20px 14px;
}

.range-filter {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
}

.range-filter :deep(.ant-picker) {
  width: 100%;
}

.range-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  font-size: 13px;
  color: #64756f;
  background: #fff;
  border: 1px solid #dbe7e3;
  border-radius: 7px;
  cursor: pointer;
  flex-shrink: 0;
}

.range-clear:hover {
  color: #0b806f;
  border-color: #0b806f;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  font-size: 12px;
  color: #64756f;
  background: none;
  border: none;
  cursor: pointer;
}

.back-button:hover {
  color: #0b806f;
}

.archive-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
}

.archive-title-row h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1c2b27;
}

.archive-title-row > button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  font-size: 14px;
  color: #64756f;
  background: #fff;
  border: 1px solid #dbe7e3;
  border-radius: 7px;
  cursor: pointer;
}

.archive-panel header > p {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 8px 0 0;
  font-size: 12px;
  color: #64756f;
}

.archive-panel nav {
  flex: 1;
  min-height: 0;
  padding: 4px 12px;
  overflow-y: auto;
}

.month-button {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  font-size: 13px;
  color: #44554f;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.month-button:hover {
  background: #edf5f2;
}

.month-button strong {
  font-weight: 600;
}

.month-button span {
  margin-left: auto;
  font-size: 11px;
  color: #8a9a94;
}

.period-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 2px 0 6px;
}

.period-list > button {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px 8px 22px;
  font-size: 13px;
  text-align: left;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.period-list > button:hover {
  background: #edf5f2;
}

.period-list > button.is-active {
  background: #d7efe8;
}

.period-dot {
  width: 7px;
  height: 7px;
  background: #9fc4bb;
  border-radius: 50%;
  flex-shrink: 0;
}

.period-list > button.is-active .period-dot {
  background: #0b806f;
}

.period-list > button > div {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1;
}

.period-list strong {
  font-weight: 600;
  color: #2a3b36;
}

.period-list small {
  font-size: 11px;
  color: #8a9a94;
}

.status-pill {
  padding: 2px 8px;
  font-size: 11px;
  border-radius: 999px;
  flex-shrink: 0;
}

.status-pill.is-draft {
  color: #b45309;
  background: #fef3c7;
}

.status-pill.is-submitted {
  color: #1d4ed8;
  background: #dbeafe;
}

.status-pill.is-reviewed {
  color: #0b806f;
  background: #d7efe8;
}

.archive-note {
  display: flex;
  gap: 8px;
  margin: 10px 14px 14px;
  padding: 10px 12px;
  font-size: 12px;
  color: #0b806f;
  background: #e6f4f0;
  border-radius: 9px;
}

.archive-note p {
  margin: 0;
  line-height: 1.5;
}

.document-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.empty-panel,
.missing-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  height: 100%;
  min-height: 0;
  color: #64756f;
  background: #f3f7f5;
  border: 1px solid #d5e3de;
  border-radius: 14px;
}

.empty-panel .iconify,
.missing-panel .iconify {
  font-size: 36px;
  color: #9fc4bb;
}

.empty-panel h3,
.missing-panel h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2a3b36;
}

.empty-panel p {
  margin: 0 0 6px;
  font-size: 13px;
}
</style>
