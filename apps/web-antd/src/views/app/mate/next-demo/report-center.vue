<script setup lang="ts">
import type { ReportPeriod, ReportType } from './demo-state';

import { computed, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import {
  Button,
  DatePicker,
  Input,
  message,
  Modal,
  Radio,
  Select,
  Tag,
} from 'ant-design-vue';

import {
  buildReportTitle,
  createReportInstance,
  currentPeriodRange,
  DEMO_TODAY,
  getCatalogSummary,
  instancePeriodLabel,
  mockProducts,
  mockProjects,
  reportCatalog,
  reportPeriodLabels,
  reportTypeIcons,
  reportTypeLabels,
} from './demo-state';

const router = useRouter();

const keyword = ref('');
const typeFilter = ref<'all' | ReportType>('all');

const typeOptions: Array<{ label: string; value: 'all' | ReportType }> = [
  { label: '全部', value: 'all' },
  ...(Object.keys(reportTypeLabels) as ReportType[]).map((value) => ({
    label: reportTypeLabels[value],
    value,
  })),
];

/** 时间段快捷筛选 */
type TimeWindow = 'all' | 'custom' | 'lastWeek' | 'thisMonth' | 'thisWeek';

const timeWindow = ref<TimeWindow>('all');

const timeQuickOptions: Array<{ label: string; value: TimeWindow }> = [
  { label: '全部时间', value: 'all' },
  { label: '本周', value: 'thisWeek' },
  { label: '上周', value: 'lastWeek' },
  { label: '本月', value: 'thisMonth' },
  { label: '自定义', value: 'custom' },
];

const customWindow = ref<[string, string]>([DEMO_TODAY, DEMO_TODAY]);

function shiftISODate(value: string, days: number): string {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
  date.setDate(date.getDate() + days);
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

function shiftRange(range: [string, string], days: number): [string, string] {
  return [shiftISODate(range[0], days), shiftISODate(range[1], days)];
}

const activeWindow = computed<null | [string, string]>(() => {
  switch (timeWindow.value) {
    case 'custom': {
      return customWindow.value;
    }
    case 'lastWeek': {
      return shiftRange(currentPeriodRange('weekly'), -7);
    }
    case 'thisMonth': {
      return currentPeriodRange('monthly');
    }
    case 'thisWeek': {
      return currentPeriodRange('weekly');
    }
    default: {
      return null;
    }
  }
});

/** 热词：一键命中高频查询 */
const hotWords = ['项目周报', '延期', '跨部门', '客户验收', '部门'];

/** 各报告类型的发起方：汇报助理只提供能力，业务助理负责发起 */
const ownerLabels: Record<ReportType, string> = {
  personal: '本页发起',
  project: '项目助理发起',
  product: '产品线发起',
  department: '部门助理发起',
};

const statusLabels = {
  draft: '本期草稿',
  reviewed: '已审阅',
  submitted: '已提交',
} as const;

const filteredCatalog = computed(() => {
  const key = keyword.value.trim();
  const win = activeWindow.value;
  return reportCatalog
    .map((item) => ({ item, summary: getCatalogSummary(item.id) }))
    .filter(
      ({ item }) =>
        typeFilter.value === 'all' || item.reportType === typeFilter.value,
    )
    .filter(({ summary }) => {
      if (!win) return true;
      const latest = summary.latest;
      if (!latest) return false;
      return latest.startDate <= win[1] && latest.endDate >= win[0];
    })
    .filter(
      ({ item }) =>
        !key ||
        item.title.includes(key) ||
        (item.subtitle ?? '').includes(key) ||
        reportPeriodLabels[item.period].includes(key),
    )
    .toSorted(
      (a, b) =>
        Number(Boolean(b.summary.draft)) - Number(Boolean(a.summary.draft)),
    );
});

function openCatalog(id: string) {
  void router.push(`/app/mate/employee/report-copilot/reports/${id}`);
}

// ===== 新建报告（从 0 生成） =====

const DEPARTMENT_OPTIONS = [
  '产品研发部',
  '销售部',
  '交付部',
  '测试部',
  '设计部',
  '售前部',
];

const createOpen = ref(false);
const creating = ref(false);
const createForm = reactive<{
  customRange: [string, string];
  period: ReportPeriod;
  reportType: ReportType;
  target: string;
}>({
  reportType: 'personal',
  target: '我的',
  period: 'weekly',
  customRange: [DEMO_TODAY, DEMO_TODAY],
});

const targetOptions = computed(() => {
  switch (createForm.reportType) {
    case 'department': {
      return DEPARTMENT_OPTIONS.map((name) => ({ label: name, value: name }));
    }
    case 'product': {
      return mockProducts.map((item) => ({
        label: item.name,
        value: item.name,
      }));
    }
    case 'project': {
      return mockProjects.map((item) => ({
        label: item.name,
        value: item.name,
      }));
    }
    default: {
      return [{ label: '我的', value: '我的' }];
    }
  }
});

watch(
  () => createForm.reportType,
  () => {
    createForm.target = targetOptions.value[0]?.value ?? '我的';
  },
);

const periodOptions = (Object.keys(reportPeriodLabels) as ReportPeriod[]).map(
  (value) => ({ label: reportPeriodLabels[value], value }),
);

const previewRange = computed<[string, string]>(() => {
  if (createForm.period === 'custom') return createForm.customRange;
  const [start, end] = currentPeriodRange(createForm.period);
  return [start, end];
});

const previewTitle = computed(() =>
  buildReportTitle({
    period: createForm.period,
    reportType: createForm.reportType,
    target: createForm.target,
  }),
);

const previewPeriodLabel = computed(() =>
  instancePeriodLabel(
    createForm.period,
    previewRange.value[0],
    previewRange.value[1],
  ),
);

function openCreate() {
  createOpen.value = true;
}

function submitCreate() {
  if (creating.value) return;
  creating.value = true;
  const [startDate, endDate] = previewRange.value;
  const item = createReportInstance({
    endDate,
    period: createForm.period,
    reportType: createForm.reportType,
    startDate,
    target: createForm.target,
  });
  creating.value = false;
  createOpen.value = false;
  message.success('已创建本期报告草稿');
  void router.push(
    `/app/mate/employee/report-copilot/reports/${item.catalogId}`,
  );
}
</script>

<template>
  <div class="report-center">
    <header class="center-header">
      <div>
        <span class="eyebrow">汇报助理</span>
        <h1>报告</h1>
        <p>统一管理我参与的个人、项目、产品、部门报告，查询历史与编辑本期。</p>
      </div>
      <div class="header-actions">
        <Input
          v-model:value="keyword"
          class="center-search"
          allow-clear
          placeholder="搜索报告名称 / 周期"
        >
          <template #prefix>
            <Icon icon="lucide:search" />
          </template>
        </Input>
        <Button type="primary" @click="openCreate">
          <Icon icon="lucide:plus" />
          新建报告
        </Button>
      </div>
    </header>

    <div class="filter-row">
      <nav class="type-filter" aria-label="按类型筛选">
        <button
          v-for="opt in typeOptions"
          :key="opt.value"
          type="button"
          :class="{ 'is-active': typeFilter === opt.value }"
          @click="typeFilter = opt.value"
        >
          {{ opt.label }}
        </button>
      </nav>
      <nav class="type-filter" aria-label="按时间段筛选">
        <button
          v-for="opt in timeQuickOptions"
          :key="opt.value"
          type="button"
          :class="{ 'is-active': timeWindow === opt.value }"
          @click="timeWindow = opt.value"
        >
          {{ opt.label }}
        </button>
        <DatePicker.RangePicker
          v-if="timeWindow === 'custom'"
          v-model:value="customWindow"
          value-format="YYYY-MM-DD"
          class="window-range"
        />
      </nav>
    </div>

    <div class="hot-words">
      <span>热词</span>
      <button
        v-for="word in hotWords"
        :key="word"
        type="button"
        @click="keyword = word"
      >
        {{ word }}
      </button>
    </div>

    <div class="catalog-grid">
      <article
        v-for="{ item, summary } in filteredCatalog"
        :key="item.id"
        class="catalog-card"
        :class="{ 'has-draft': summary.draft }"
      >
        <header>
          <span class="type-icon">
            <Icon :icon="reportTypeIcons[item.reportType]" />
          </span>
          <div class="card-titles">
            <strong>{{ item.title }}</strong>
            <small v-if="item.subtitle">{{ item.subtitle }}</small>
          </div>
          <Tag color="green">{{ reportTypeLabels[item.reportType] }}</Tag>
          <span class="owner-tag">{{ ownerLabels[item.reportType] }}</span>
        </header>

        <div class="latest-row">
          <template v-if="summary.latest">
            <span class="latest-label">最近一期</span>
            <div class="latest-info">
              <strong>{{ summary.latest.weekLabel }}</strong>
              <small>{{ summary.latest.range }}</small>
            </div>
            <span class="status-pill" :class="`is-${summary.latest.status}`">
              {{ statusLabels[summary.latest.status] }}
            </span>
            <span v-if="summary.latest.status !== 'draft'" class="score">
              <Icon icon="lucide:star" />
              {{ summary.latest.score }}
            </span>
          </template>
          <template v-else>
            <span class="latest-label">最近一期</span>
            <div class="latest-info">
              <strong>本期待生成</strong>
              <small>{{ item.schedule }}</small>
            </div>
          </template>
        </div>

        <footer>
          <span class="schedule">
            <Icon icon="lucide:clock-3" />
            {{ reportPeriodLabels[item.period] }} · {{ item.schedule }}
            <template v-if="summary.total">
              · 已归档 {{ summary.total }} 份
            </template>
          </span>
          <Button type="primary" size="small" @click="openCatalog(item.id)">
            {{ summary.draft ? '继续编辑本期' : '进入报告' }}
            <Icon icon="lucide:arrow-right" />
          </Button>
        </footer>
      </article>
    </div>

    <p v-if="filteredCatalog.length === 0" class="empty-tip">没有匹配的报告</p>

    <Modal
      v-model:open="createOpen"
      title="新建报告"
      :confirm-loading="creating"
      ok-text="生成报告"
      cancel-text="取消"
      @ok="submitCreate"
    >
      <div class="create-form">
        <section>
          <label>报告类型</label>
          <Radio.Group v-model:value="createForm.reportType">
            <Radio.Button
              v-for="opt in typeOptions.slice(1)"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </Radio.Button>
          </Radio.Group>
        </section>
        <section>
          <label>报告对象</label>
          <Select
            v-model:value="createForm.target"
            class="create-target"
            :options="targetOptions"
          />
        </section>
        <section>
          <label>报告周期</label>
          <Radio.Group v-model:value="createForm.period">
            <Radio.Button
              v-for="opt in periodOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </Radio.Button>
          </Radio.Group>
        </section>
        <section>
          <label>报告区间</label>
          <DatePicker.RangePicker
            v-model:value="createForm.customRange"
            value-format="YYYY-MM-DD"
            :disabled="createForm.period !== 'custom'"
            class="create-range"
          />
          <p class="range-preview">
            本期：{{ previewPeriodLabel }} · {{ previewRange[0] }} 至
            {{ previewRange[1] }}
          </p>
        </section>
        <section class="title-preview">
          <label>报告标题</label>
          <strong>{{ previewTitle }}</strong>
        </section>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.report-center {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  min-width: 0;
  height: 100%;
  min-height: 0;
  padding: 24px 28px;
  overflow-y: auto;
  background: #f3f7f5;
  border: 1px solid #d5e3de;
  border-radius: 14px;
}

.center-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.eyebrow {
  font-size: 10px;
  font-weight: 800;
  color: #0b806f;
  letter-spacing: 0.12em;
}

.center-header h1 {
  margin: 4px 0 6px;
  font-size: 24px;
  font-weight: 700;
  color: #1c2b27;
}

.center-header p {
  margin: 0;
  font-size: 13px;
  color: #64756f;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.center-search {
  width: 220px;
}

.type-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.type-filter button {
  padding: 5px 14px;
  font-size: 13px;
  color: #44554f;
  background: #fff;
  border: 1px solid #d5e3de;
  border-radius: 999px;
  cursor: pointer;
  transition:
    color 0.15s,
    background 0.15s,
    border-color 0.15s;
}

.type-filter button:hover {
  color: #0b806f;
  border-color: #0b806f;
}

.type-filter button.is-active {
  color: #fff;
  background: #0b806f;
  border-color: #0b806f;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.hot-words {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.hot-words > span {
  font-size: 12px;
  color: #8a9a94;
}

.hot-words button {
  padding: 2px 10px;
  font-size: 12px;
  color: #0b806f;
  cursor: pointer;
  background: #e6f4f0;
  border: 0;
  border-radius: 999px;
}

.hot-words button:hover {
  background: #d7efe8;
}

.catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;
}

.catalog-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  background: #fff;
  border: 1px solid #dbe7e3;
  border-radius: 12px;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.catalog-card:hover {
  border-color: #0b806f;
  box-shadow: 0 6px 18px rgb(11 128 111 / 8%);
}

.catalog-card.has-draft {
  border-left: 3px solid #0b806f;
}

.catalog-card > header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.type-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  font-size: 18px;
  color: #0b806f;
  background: #e6f4f0;
  border-radius: 10px;
  flex-shrink: 0;
}

.card-titles {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.card-titles strong {
  font-size: 15px;
  font-weight: 600;
  color: #1c2b27;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-titles small {
  font-size: 12px;
  color: #8a9a94;
}

.owner-tag {
  flex-shrink: 0;
  padding: 2px 8px;
  font-size: 11px;
  color: #64756f;
  background: #f2f8f6;
  border-radius: 999px;
}

.latest-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #f6faf9;
  border-radius: 8px;
}

.latest-label {
  font-size: 11px;
  color: #8a9a94;
  flex-shrink: 0;
}

.latest-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1;
}

.latest-info strong {
  font-size: 13px;
  font-weight: 600;
  color: #2a3b36;
}

.latest-info small {
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

.score {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  font-weight: 600;
  color: #b45309;
  flex-shrink: 0;
}

.catalog-card > footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.schedule {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #64756f;
}

.empty-tip {
  padding: 40px 0;
  font-size: 13px;
  color: #8a9a94;
  text-align: center;
}

.create-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.create-form section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.create-form label {
  font-size: 13px;
  font-weight: 600;
  color: #44554f;
}

.create-target {
  width: 100%;
}

.create-range {
  width: 100%;
}

.range-preview {
  margin: 0;
  font-size: 12px;
  color: #8a9a94;
}

.title-preview strong {
  font-size: 15px;
  color: #1c2b27;
}

.window-range {
  width: 240px;
}
</style>
