<script setup lang="ts">
import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';

import { reportArchive } from './demo-state';
import ReportDocument from './report-document.vue';

const openMonths = ref(['8月']);
const archiveCollapsed = ref(false);
const historyReports = computed(() =>
  reportArchive.filter((item) => item.status !== 'draft'),
);
const selectedHistoryId = ref(
  historyReports.value[0]?.id || reportArchive[0]!.id,
);
const selectedHistoryReport = computed(
  () =>
    historyReports.value.find((item) => item.id === selectedHistoryId.value) ||
    historyReports.value[0]!,
);
const grouped = computed(() =>
  ['8月', '7月'].map((month) => ({
    month,
    reports: historyReports.value.filter((item) => item.month === month),
  })),
);

function toggleMonth(month: string) {
  openMonths.value = openMonths.value.includes(month)
    ? openMonths.value.filter((item) => item !== month)
    : [...openMonths.value, month];
}
</script>

<template>
  <div
    class="report-workspace"
    :class="{ 'archive-collapsed': archiveCollapsed }"
  >
    <aside v-if="!archiveCollapsed" class="archive-panel">
      <header>
        <span>汇报档案</span>
        <div class="archive-title-row">
          <h2>历史周报</h2>
          <button
            type="button"
            aria-label="折叠汇报档案"
            title="折叠汇报档案"
            @click="archiveCollapsed = true"
          >
            <Icon icon="lucide:panel-left-close" />
          </button>
        </div>
        <p>2026 年 · 共 {{ historyReports.length }} 份</p>
      </header>
      <nav aria-label="周报时间归档">
        <section v-for="group in grouped" :key="group.month">
          <button
            class="month-button"
            type="button"
            :aria-expanded="openMonths.includes(group.month)"
            @click="toggleMonth(group.month)"
          >
            <Icon
              :icon="
                openMonths.includes(group.month)
                  ? 'lucide:folder-open'
                  : 'lucide:folder'
              "
            />
            <strong>{{ group.month }}</strong>
            <span>{{ group.reports.length }} 份</span>
            <Icon
              :icon="
                openMonths.includes(group.month)
                  ? 'lucide:chevron-down'
                  : 'lucide:chevron-right'
              "
            />
          </button>
          <div v-if="openMonths.includes(group.month)" class="week-list">
            <button
              v-for="report in group.reports"
              :key="report.id"
              type="button"
              :class="{ 'is-active': selectedHistoryId === report.id }"
              @click="selectedHistoryId = report.id"
            >
              <span class="week-dot"></span>
              <div>
                <strong>{{ report.weekLabel }}</strong>
                <small>{{ report.range }}</small>
              </div>
              <span class="status-pill" :class="`is-${report.status}`">
                {{
                  report.status === 'draft'
                    ? '草稿'
                    : report.status === 'submitted'
                      ? '已提交'
                      : '已审阅'
                }}
              </span>
            </button>
          </div>
        </section>
      </nav>
      <div class="archive-note">
        <Icon icon="lucide:sparkles" />
        <p>汇报由资料和对话生成。需要修改时，直接告诉汇报助理。</p>
      </div>
    </aside>
    <main class="document-panel">
      <ReportDocument
        :report="selectedHistoryReport"
        readonly
        show-archive-toggle
        :archive-collapsed="archiveCollapsed"
        @toggle-archive="archiveCollapsed = !archiveCollapsed"
      />
    </main>
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
  padding: 23px 20px 16px;
}

.archive-panel header > span {
  font-size: 10px;
  font-weight: 800;
  color: #0b806f;
  letter-spacing: 0.12em;
}

.archive-panel h2 {
  margin: 5px 0 4px;
  font-size: 20px;
}

.archive-panel header p {
  margin: 0;
  font-size: 12px;
  color: #82958e;
}

.archive-panel nav {
  flex: 1;
  padding: 0 11px;
  overflow: auto;
}

.month-button {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  min-height: 44px;
  padding: 8px 9px;
  color: #294a42;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 8px;
}

.month-button:hover {
  background: #edf5f2;
}

.month-button strong {
  flex: 1;
  text-align: left;
}

.month-button span {
  font-size: 10px;
  color: #687d76;
}

.week-list {
  position: relative;
  padding-left: 14px;
  margin-left: 17px;
  border-left: 1px solid #d7e4df;
}

.week-list > button {
  position: relative;
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  min-height: 62px;
  padding: 8px;
  color: #38564e;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 9px;
}

.week-list > button:hover {
  background: #fff;
}

.week-list > button.is-active {
  color: #0a675b;
  background: #e2f1ec;
  border-color: #8fc5b7;
}

.week-dot {
  position: absolute;
  left: -19px;
  width: 8px;
  height: 8px;
  background: #b9ccc6;
  border: 2px solid #f8fbfa;
  border-radius: 50%;
}

.is-active .week-dot {
  background: #0b806f;
}

.week-list > button > div {
  display: grid;
  flex: 1;
}

.week-list strong {
  font-size: 12px;
}

.week-list small {
  margin-top: 3px;
  font-size: 10px;
  color: #687d76;
}

.status-pill {
  min-width: 43px;
  padding: 3px 7px;
  font-size: 10px;
  font-weight: 700;
  line-height: 17px;
  text-align: center;
  background: #fff;
  border: 1px solid #ccd9d5;
  border-radius: 999px;
}

.status-pill.is-draft {
  color: #5d6c67;
}

.status-pill.is-submitted {
  color: #255f9e;
  background: #f2f7fd;
  border-color: #a9c9ea;
}

.status-pill.is-reviewed {
  color: #26733d;
  background: #f1f8f3;
  border-color: #a9d2b5;
}

.archive-note {
  display: flex;
  gap: 8px;
  padding: 13px;
  margin: 12px;
  font-size: 11px;
  line-height: 1.55;
  color: #59736b;
  background: #eaf3f0;
  border-radius: 9px;
}

.archive-note p {
  margin: 0;
}

.document-panel {
  min-width: 0;
  overflow: auto;
  background: #f3f7f5;
}

@media (max-width: 920px) {
  .report-workspace {
    grid-template-columns: 1fr;
  }

  .archive-panel {
    display: none;
  }
}
</style>
<style scoped>
.report-workspace.archive-collapsed {
  grid-template-columns: minmax(0, 1fr);
}

.archive-title-row {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
}

.archive-title-row h2 {
  margin: 5px 0 4px;
}

.archive-title-row button {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  padding: 0;
  color: #48675f;
  cursor: pointer;
  background: #fff;
  border: 1px solid #d2e0dc;
  border-radius: 8px;
}

.archive-title-row button:hover {
  color: #087565;
  background: #eaf4f0;
  border-color: #8ab9ac;
}

.archive-title-row button svg {
  width: 17px;
  height: 17px;
}
</style>
