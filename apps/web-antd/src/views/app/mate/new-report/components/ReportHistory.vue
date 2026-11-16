<script setup lang="ts">
import type { ReportDraft, ReportScheme } from '#/types/new-report';
import { computed, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { Icon } from '@iconify/vue';
import { Button, DatePicker, Input, Select } from 'ant-design-vue';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { periodLabel } from '#/utils/report-period';
const props = defineProps<{
  reports: ReportDraft[];
  schemes: ReportScheme[];
}>();
const emit = defineEmits<{ back: [] }>();
const route = useRoute();
const search = ref('');
const type = ref('all');
const status = ref('all');
const dates = ref<[Dayjs, Dayjs]>();
const reportCycle = (report: ReportDraft) =>
  report.period ??
  report.schemeConfig?.defaultPeriod ??
  (report.schemeId === 'daily'
    ? 'day'
    : report.schemeId === 'customer'
      ? 'month'
      : 'week');
const reportType = (report: ReportDraft) =>
  props.schemes.find((s) => s.id === report.schemeId)?.type ?? '其他报告';
const typeOptions = computed(() => [
  { label: '全部报告类型', value: 'all' },
  ...Array.from(new Set(props.schemes.map((s) => s.type)))
    .filter((value) =>
      props.reports.some((report) => reportType(report) === value),
    )
    .map((value) => ({ label: value, value })),
]);
const filtered = computed(() =>
  props.reports
    .filter((report) => {
      const text = [
        report.title,
        report.start,
        report.end,
        reportType(report),
        periodLabel(reportCycle(report)),
      ]
        .join(' ')
        .toLowerCase();
      const inDates =
        !dates.value ||
        (report.end >= dates.value[0].format('YYYY-MM-DD') &&
          report.start <= dates.value[1].format('YYYY-MM-DD'));
      return (
        inDates &&
        (type.value === 'all' || reportType(report) === type.value) &&
        (status.value === 'all' || report.status === status.value) &&
        text.includes(search.value.trim().toLowerCase())
      );
    })
    .sort(
      (a, b) =>
        b.end.localeCompare(a.end) ||
        b.start.localeCompare(a.start) ||
        b.id.localeCompare(a.id, undefined, { numeric: true }),
    ),
);
function destination(report: ReportDraft) {
  return {
    name: 'NewReportAssistant',
    params: {
      employeeId: String(route.params.employeeId || 'new-report-assistant'),
    },
    query: {
      scheme: report.schemeId,
      report: report.id,
      view: 'preview',
      from: 'history',
      cycle: reportCycle(report),
    },
  };
}
function changeDates(value: unknown) {
  dates.value =
    Array.isArray(value) &&
    value.length === 2 &&
    value.every((item) => dayjs.isDayjs(item))
      ? (value as [Dayjs, Dayjs])
      : undefined;
}
function reset() {
  search.value = '';
  type.value = 'all';
  status.value = 'all';
  dates.value = undefined;
}
</script>
<template>
  <section class="report-history-query">
    <header class="history-query-header">
      <div>
        <Button type="text" class="history-back" @click="emit('back')"
          ><Icon icon="lucide:arrow-left" />返回汇报</Button
        >
        <h1>历史报告查询</h1>
        <p>按报告类型和日期查询，查看所有已生成报告。</p>
      </div>
      <span><Icon icon="lucide:files" />共 {{ reports.length }} 份</span>
    </header>
    <section class="history-query-filters" aria-label="历史报告查询条件">
      <label
        >报告类型<Select
          v-model:value="type"
          :options="typeOptions"
          aria-label="筛选历史报告类型" /></label
      ><label class="history-date-filter"
        >报告日期<DatePicker.RangePicker
          :value="dates"
          :allow-clear="true"
          :placeholder="['开始日期', '结束日期']"
          @change="changeDates" /></label
      ><label
        >报告状态<Select
          v-model:value="status"
          :options="[
            { label: '全部状态', value: 'all' },
            { label: '草稿', value: 'draft' },
            { label: '已提交', value: 'submitted' },
          ]"
          aria-label="筛选历史报告状态" /></label
      ><label class="history-title-filter"
        >报告标题<Input
          v-model:value="search"
          allow-clear
          placeholder="搜索标题或汇报对象"
          aria-label="搜索历史报告"
          ><template #prefix
            ><Icon icon="lucide:search" /></template></Input></label
      ><Button @click="reset"><Icon icon="lucide:rotate-ccw" />重置</Button>
    </section>
    <div class="history-query-results">
      <h2>
        报告列表<span>{{ filtered.length }} 份</span>
      </h2>
      <small>按报告周期倒序 · 日期范围按周期重叠匹配</small>
    </div>
    <div v-if="filtered.length" class="history-table-scroll">
      <table class="history-table">
        <thead>
          <tr>
            <th>报告标题</th>
            <th>报告类型</th>
            <th>汇报周期</th>
            <th>日期范围</th>
            <th>状态</th>
            <th>版本</th>
            <th class="history-action-cell">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="report in filtered" :key="report.id">
            <td>
              <RouterLink :to="destination(report)" class="history-title-link"
                ><Icon
                  :icon="
                    schemes.find((s) => s.id === report.schemeId)?.icon ??
                    'lucide:file-text'
                  "
                /><span>{{ report.title }}</span></RouterLink
              >
            </td>
            <td>{{ reportType(report) }}</td>
            <td>{{ periodLabel(reportCycle(report)) }}</td>
            <td class="history-range-cell">
              {{ report.start
              }}<template v-if="report.start !== report.end">
                — {{ report.end }}</template
              >
            </td>
            <td>
              <span
                class="history-status"
                :class="{ submitted: report.status === 'submitted' }"
                ><Icon
                  :icon="
                    report.status === 'submitted'
                      ? 'lucide:lock-keyhole'
                      : 'lucide:file-pen-line'
                  "
                />{{ report.status === 'submitted' ? '已提交' : '草稿' }}</span
              >
            </td>
            <td>V{{ report.version }}</td>
            <td class="history-action-cell">
              <RouterLink
                :to="destination(report)"
                class="history-preview-link"
                :title="'预览' + report.title"
                :aria-label="'预览' + report.title"
                ><Icon icon="lucide:eye" />预览</RouterLink
              >
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="history-empty">
      <Icon icon="lucide:files" />
      <h2>{{ reports.length ? '没有匹配的报告' : '暂时还没有报告' }}</h2>
      <p>
        {{
          reports.length
            ? '请调整报告类型、日期或其他查询条件。'
            : '生成并保存报告后，可在这里查询。'
        }}
      </p>
      <Button v-if="reports.length" @click="reset">清除筛选</Button
      ><Button v-else @click="emit('back')">返回生成报告</Button>
    </div>
  </section>
</template>
<style scoped>
.report-history-query {
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  background: #f4f8f6;
  border: 1px solid #dfe9e3;
  border-radius: 14px;
  padding: 22px;
  color: #2d4939;
}
.history-query-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
}
.history-back {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  color: #718c79;
  font-size: 12px;
}
.history-query-header h1 {
  font-size: 23px;
  font-weight: 600;
  margin: 10px 0 7px;
}
.history-query-header p {
  font-size: 13px;
  color: #83998b;
  margin: 0;
}
.history-query-header > span {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #769581;
  font-size: 12px;
}
.history-query-filters {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
  background: #fff;
  padding: 18px;
  border: 1px solid #e0e9e3;
  border-radius: 11px;
  margin-bottom: 22px;
}
.history-query-filters > label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
  color: #708b78;
}
.history-query-filters .ant-select {
  min-width: 145px;
}
.history-date-filter .ant-picker {
  width: 270px;
  max-width: 100%;
}
.history-title-filter {
  flex: 1;
  min-width: 200px;
}
.history-query-results {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}
.history-query-results h2 {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 15px;
  font-weight: 600;
  margin: 0;
}
.history-query-results h2 span {
  font-size: 11px;
  font-weight: 400;
  color: #8fa195;
}
.history-query-results > small {
  color: #8b9e90;
  font-size: 11px;
}
.history-table-scroll {
  overflow-x: auto;
  background: #fff;
  border: 1px solid #e0e9e3;
  border-radius: 11px;
}
.history-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 870px;
  text-align: left;
  font-size: 12px;
}
.history-table th {
  padding: 14px 16px;
  font-size: 11px;
  font-weight: 500;
  color: #829989;
  background: #f9fbfa;
  white-space: nowrap;
  border-bottom: 1px solid #e3ebe6;
}
.history-table td {
  padding: 16px;
  color: #698573;
  border-bottom: 1px solid #edf2ee;
  vertical-align: middle;
}
.history-table tbody tr:last-child td {
  border-bottom: 0;
}
.history-table tbody tr:hover {
  background: #f7faf8;
}
.history-table th:first-child {
  width: 30%;
}
.history-title-link {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #355d43;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.7;
  min-width: 190px;
}
.history-title-link > svg {
  font-size: 20px;
  color: #709d80;
  flex: none;
}
.history-title-link:hover {
  color: #247d69;
}
.history-range-cell {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  font-size: 11px;
}
.history-status {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  background: #faf3e5;
  color: #9d8048;
  border-radius: 5px;
  padding: 3px 7px;
  font-size: 10px;
  white-space: nowrap;
}
.history-status.submitted {
  background: #edf5ef;
  color: #628b6d;
}
.history-action-cell {
  text-align: right;
  white-space: nowrap;
}
.history-preview-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #4a8160;
  font-size: 12px;
}
.history-preview-link svg {
  font-size: 16px;
}
.history-title-link:focus-visible,
.history-preview-link:focus-visible {
  outline: 2px solid #438363;
  outline-offset: 3px;
  border-radius: 3px;
}
.history-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 50px 20px;
  border: 1px dashed #d1e0d6;
  border-radius: 12px;
  background: white;
  color: #809888;
}
.history-empty > svg {
  font-size: 34px;
  color: #94b29e;
}
.history-empty h2 {
  font-size: 17px;
  font-weight: 500;
  margin: 16px 0 8px;
}
.history-empty p {
  font-size: 12px;
  margin-bottom: 18px;
}
@media (max-width: 760px) {
  .report-history-query {
    padding: 16px;
  }
  .history-query-header h1 {
    font-size: 21px;
  }
  .history-query-header > span {
    display: none;
  }
  .history-query-filters {
    padding: 14px;
    gap: 12px;
  }
  .history-query-filters > label {
    flex: 1;
    min-width: 130px;
  }
  .history-query-filters > .history-date-filter {
    flex-basis: 100%;
  }
  .history-date-filter .ant-picker {
    width: 100%;
  }
  .history-query-results > small {
    display: none;
  }
}
</style>
