<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import { useRoute, useRouter } from 'vue-router';
import dayjs from 'dayjs';
import { Icon } from '@iconify/vue';
import {
  Button,
  Checkbox,
  ConfigProvider,
  Drawer,
  Input,
  Modal,
  Select,
  Table,
  Tooltip,
  message,
  theme,
} from 'ant-design-vue';
import { reviewReportTypes, submitReviewFeedback } from '#/api/mock-new-review';
import {
  reviewWorkItems,
  reviewWorkState,
  reviewWorkLabel,
  reviewSignals,
  reportFormatLabel,
  reviewReminderRecords,
  remindReviewReports,
} from '#/api/mock-review-workspace';
import type {
  ReviewWorkItem,
  ReviewWorkState,
} from '#/api/mock-review-workspace';
import { periodLabel, reportPeriodRange } from '#/utils/report-period';
import { reviewInsights } from '#/utils/review-insights';
import CompactReviewCard from './components/CompactReviewCard.vue';
import ReviewScoreInput from './components/ReviewScoreInput.vue';

const route = useRoute();
const router = useRouter();
type ViewMode = 'grid' | 'kanban' | 'table';
type StatusFilter = ReviewWorkState | 'all';
const statusValues = ['all', 'pending', 'approved', 'missing', 'shared'];
const status = ref<StatusFilter>(
  statusValues.includes(String(route.query.status))
    ? (String(route.query.status) as StatusFilter)
    : 'all',
);
const view = ref<ViewMode>(
  ['grid', 'kanban', 'table'].includes(String(route.query.view))
    ? (String(route.query.view) as ViewMode)
    : 'grid',
);
const isMobile = useMediaQuery('(max-width: 767px)');
const displayedView = computed<ViewMode>(() =>
  isMobile.value ? 'grid' : view.value,
);
const filterDrawerOpen = ref(false);
const typeFilter = ref(String(route.query.type ?? 'all'));
const formatFilter = ref(String(route.query.format ?? 'all'));
const year = ref(Number(route.query.year) || dayjs().year());
const periods = ref<string[]>(
  String(route.query.periods ?? '')
    .split(',')
    .filter(Boolean),
);
const search = ref(String(route.query.search ?? ''));
const riskOnly = ref(route.query.risk === '1');
const selected = ref<string[]>([]);
const tablePage = ref(1);
const signals = computed(
  () =>
    new Map(
      reviewWorkItems.value.map((item) => [
        item.id,
        item.entry ? reviewSignals(item.entry) : [],
      ]),
    ),
);
const types = [
  { label: '全部报告类型', value: 'all' },
  ...reviewReportTypes.map((item) => ({ label: item.title, value: item.id })),
];
const formats = computed(() => [
  { label: '全部形式', value: 'all' },
  ...Array.from(new Set(reviewWorkItems.value.map((item) => item.period))).map(
    (value) => ({ label: periodLabel(value), value }),
  ),
]);
const years = computed(() =>
  [
    ...new Set([
      dayjs().year(),
      ...reviewWorkItems.value.map((item) => Number(item.end.slice(0, 4))),
    ]),
  ]
    .sort((a, b) => b - a)
    .map((value) => ({ label: `${value} 年`, value })),
);
function periodOptionsFor(selectedYear: number) {
  return [
    ...new Map(
      reviewWorkItems.value
        .filter((item) => item.end.startsWith(String(selectedYear)))
        .map((item) => [
          `${item.start}~${item.end}`,
          {
            value: `${item.start}~${item.end}`,
            label: `${dayjs(item.start).format('M/D')}—${dayjs(item.end).format('M/D')} · ${periodLabel(item.period)}`,
          },
        ]),
    ).values(),
  ].sort((a, b) => b.value.localeCompare(a.value));
}
const periodOptions = computed(() => periodOptionsFor(year.value));
const mobileDraft = reactive({
  search: '',
  type: 'all',
  format: 'all',
  year: dayjs().year(),
  periods: [] as string[],
  riskOnly: false,
});
const mobilePeriodOptions = computed(() => periodOptionsFor(mobileDraft.year));
const activeFilterCount = computed(
  () =>
    [
      search.value.trim(),
      typeFilter.value !== 'all',
      formatFilter.value !== 'all',
      year.value !== dayjs().year(),
      periods.value.length > 0,
      riskOnly.value,
    ].filter(Boolean).length,
);
watch(
  () => mobileDraft.year,
  () => {
    mobileDraft.periods = [];
  },
  { flush: 'sync' },
);
watch(isMobile, (mobile) => {
  if (!mobile) filterDrawerOpen.value = false;
});
function openMobileFilters() {
  mobileDraft.search = search.value;
  mobileDraft.type = typeFilter.value;
  mobileDraft.format = formatFilter.value;
  mobileDraft.year = year.value;
  mobileDraft.periods = [...periods.value];
  mobileDraft.riskOnly = riskOnly.value;
  filterDrawerOpen.value = true;
}
function resetMobileFilters() {
  Object.assign(mobileDraft, {
    search: '',
    type: 'all',
    format: 'all',
    year: dayjs().year(),
    periods: [],
    riskOnly: false,
  });
}
function applyMobileFilters() {
  search.value = mobileDraft.search;
  typeFilter.value = mobileDraft.type;
  formatFilter.value = mobileDraft.format;
  year.value = mobileDraft.year;
  periods.value = [...mobileDraft.periods];
  riskOnly.value = mobileDraft.riskOnly;
  filterDrawerOpen.value = false;
}
function mobileQuickPeriod(offset: number) {
  const range = reportPeriodRange(
    dayjs().add(offset, 'week').format('YYYY-MM-DD'),
    'week',
  );
  mobileDraft.year = Number(range.end.slice(0, 4));
  mobileDraft.periods = [`${range.start}~${range.end}`];
}
watch(
  year,
  () => {
    periods.value = [];
  },
  { flush: 'sync' },
);
const baseItems = computed(() =>
  reviewWorkItems.value.filter((item) => {
    const inYear =
      item.start.slice(0, 4) <= String(year.value) &&
      item.end.slice(0, 4) >= String(year.value);
    const inPeriod =
      !periods.value.length ||
      periods.value.some((value) => {
        const [start, end] = value.split('~');
        return start && end && item.end >= start && item.start <= end;
      });
    return (
      inYear &&
      inPeriod &&
      (typeFilter.value === 'all' || item.type === typeFilter.value) &&
      (formatFilter.value === 'all' || item.period === formatFilter.value) &&
      `${item.author} ${item.department} ${item.title} ${item.summary}`
        .toLowerCase()
        .includes(search.value.trim().toLowerCase()) &&
      (!riskOnly.value ||
        signals.value.get(item.id)?.some((signal) => signal.tone === 'risk'))
    );
  }),
);
const tabs = computed(() => [
  { key: 'all' as const, label: '全部', count: baseItems.value.length },
  {
    key: 'pending' as const,
    label: '待我审批',
    count: baseItems.value.filter((item) => reviewWorkState(item) === 'pending')
      .length,
  },
  {
    key: 'approved' as const,
    label: '已审批',
    count: baseItems.value.filter(
      (item) => reviewWorkState(item) === 'approved',
    ).length,
  },
  {
    key: 'missing' as const,
    label: '未提交',
    count: baseItems.value.filter((item) => reviewWorkState(item) === 'missing')
      .length,
  },
  {
    key: 'shared' as const,
    label: '分享给我',
    count: baseItems.value.filter((item) => reviewWorkState(item) === 'shared')
      .length,
  },
]);
const items = computed(() =>
  baseItems.value
    .filter(
      (item) =>
        status.value === 'all' || reviewWorkState(item) === status.value,
    )
    .sort((a, b) => {
      const priority = { pending: 0, missing: 1, approved: 2, shared: 3 };
      return (
        priority[reviewWorkState(a)] - priority[reviewWorkState(b)] ||
        Number(
          signals.value.get(b.id)?.some((signal) => signal.tone === 'risk'),
        ) -
          Number(
            signals.value.get(a.id)?.some((signal) => signal.tone === 'risk'),
          ) ||
        b.end.localeCompare(a.end) ||
        a.author.localeCompare(b.author, 'zh-CN')
      );
    }),
);
const eligible = computed(() =>
  items.value.filter((item) => reviewWorkState(item) === 'missing'),
);
const missingSelection = computed(() =>
  eligible.value.filter(
    (item) =>
      selected.value.includes(item.id) &&
      reviewWorkState(item) === 'missing' &&
      !reviewReminderRecords[item.id],
  ),
);
const hasFilters = computed(
  () =>
    typeFilter.value !== 'all' ||
    formatFilter.value !== 'all' ||
    periods.value.length > 0 ||
    search.value ||
    riskOnly.value ||
    status.value !== 'all',
);
watch(
  () =>
    items.value.map((item) => `${item.id}:${reviewWorkState(item)}`).join('|'),
  () => {
    selected.value = selected.value.filter((id) =>
      eligible.value.some((item) => item.id === id),
    );
    tablePage.value = 1;
  },
);
function toggle(item: ReviewWorkItem, checked: boolean) {
  selected.value = checked
    ? [...new Set([...selected.value, item.id])]
    : selected.value.filter((id) => id !== item.id);
}
function toggleAll(checked: boolean) {
  selected.value = checked ? eligible.value.map((item) => item.id) : [];
}
function reset() {
  typeFilter.value = 'all';
  formatFilter.value = 'all';
  year.value = dayjs().year();
  periods.value = [];
  search.value = '';
  riskOnly.value = false;
  status.value = 'all';
  selected.value = [];
}
function quickPeriod(offset: number) {
  const range = reportPeriodRange(
    dayjs().add(offset, 'week').format('YYYY-MM-DD'),
    'week',
  );
  year.value = Number(range.end.slice(0, 4));
  periods.value = [`${range.start}~${range.end}`];
}
function openReport(item: ReviewWorkItem) {
  if (!item.entry) return;
  void router.push({
    name: 'NewReviewAssistantReportDetail',
    params: {
      employeeId: String(route.params.employeeId || 'new-review-assistant'),
    },
    query: {
      report: item.id,
      type: typeFilter.value,
      status: status.value,
      view: displayedView.value,
      year: String(year.value),
      format: formatFilter.value,
      periods: periods.value.join(','),
      search: search.value,
      risk: riskOnly.value ? '1' : '0',
    },
  });
}
const tableColumns = [
  { title: '姓名 / 组别', key: 'author', width: 155 },
  { title: '报告', key: 'title', width: 260 },
  { title: '类型', key: 'type', width: 92 },
  { title: '周期', key: 'period', width: 125 },
  { title: '状态', key: 'status', width: 120 },
  { title: 'AI 信号', key: 'signals', width: 155 },
  { title: '操作', key: 'actions', width: 150, fixed: 'right' as const },
];
const rowSelection = computed(() => ({
  selectedRowKeys: selected.value,
  onChange: (keys: (string | number)[]) => {
    selected.value = keys.map(String);
  },
  getCheckboxProps: (item: ReviewWorkItem) => ({
    disabled: reviewWorkState(item) !== 'missing',
  }),
  columnWidth: 36,
}));
const lanes = [
  { key: 'missing' as const, title: '未提交', icon: 'lucide:clock-3' },
  { key: 'pending' as const, title: '待我审批', icon: 'lucide:stamp' },
  { key: 'approved' as const, title: '已审批', icon: 'lucide:circle-check' },
  { key: 'shared' as const, title: '分享给我', icon: 'lucide:share-2' },
];
function laneItems(key: ReviewWorkState) {
  return items.value.filter((item) => reviewWorkState(item) === key);
}
const dragging = ref('');
const dropOver = ref<ReviewWorkState>();
function startDrag(event: DragEvent, item: ReviewWorkItem) {
  if (reviewWorkState(item) !== 'pending') {
    event.preventDefault();
    return;
  }
  dragging.value = item.id;
  event.dataTransfer?.setData('text/plain', item.id);
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
}
function dropReport(event: DragEvent, target: ReviewWorkState) {
  event.preventDefault();
  const id = dragging.value || event.dataTransfer?.getData('text/plain');
  dragging.value = '';
  dropOver.value = undefined;
  if (target !== 'approved') return;
  const item = items.value.find((entry) => entry.id === id);
  if (item && reviewWorkState(item) === 'pending') prepareReview(item);
}
interface ApprovalDraft {
  id: string;
  version: number;
  author: string;
  title: string;
  summary: string;
  score: number | null;
  feedback: string;
  customer: boolean;
  risk: string;
  error?: string;
}
const approvalOpen = ref(false);
const approvalBusy = ref(false);
const approvalDrafts = ref<ApprovalDraft[]>([]);
function prepareReview(item: ReviewWorkItem) {
  if (!item.entry || reviewWorkState(item) !== 'pending') return;
  const entry = item.entry;
  approvalDrafts.value = [
    {
      id: item.id,
      version: entry.report.version,
      author: item.author,
      title: item.title,
      summary: item.summary,
      score: 9,
      feedback: reviewInsights(entry).opinion,
      customer: entry.report.customerApproval?.status === 'pending',
      risk:
        signals.value
          .get(item.id)
          ?.filter((signal) => signal.tone === 'risk')
          .map((signal) => signal.label)
          .join('、') ?? '',
    },
  ];
  approvalOpen.value = true;
}
const approvalValid = computed(
  () =>
    approvalDrafts.value.length > 0 &&
    approvalDrafts.value.every(
      (item) =>
        item.score !== null &&
        Number.isFinite(item.score) &&
        item.score >= 0 &&
        item.score <= 10 &&
        item.feedback.trim(),
    ),
);
async function confirmApproval() {
  if (approvalBusy.value || !approvalValid.value) return;
  approvalBusy.value = true;
  const batch = [...approvalDrafts.value];
  const results = await Promise.allSettled(
    batch.map((draft) =>
      submitReviewFeedback(
        draft.id,
        draft.version,
        draft.score!,
        draft.feedback,
        draft.customer ? 'approved' : undefined,
      ),
    ),
  );
  const failed: ApprovalDraft[] = [];
  results.forEach((result, index) => {
    if (result.status === 'rejected')
      failed.push({
        ...batch[index]!,
        error:
          result.reason instanceof Error ? result.reason.message : '保存失败',
      });
  });
  const success = batch.length - failed.length;
  approvalBusy.value = false;
  if (!failed.length) {
    approvalOpen.value = false;
    message.success(`已审批 ${success} 份报告，评分与意见已保存到演示记录`);
  } else {
    approvalDrafts.value = failed;
    message.warning(
      `已完成 ${success} 份，${failed.length} 份未完成，请核对提示`,
    );
  }
}
const reminderOpen = ref(false);
const reminderBusy = ref(false);
const reminderTargets = ref<ReviewWorkItem[]>([]);
const reminderText = ref('');
function prepareReminder(targets: ReviewWorkItem[]) {
  reminderTargets.value = targets.filter(
    (item) =>
      reviewWorkState(item) === 'missing' && !reviewReminderRecords[item.id],
  );
  if (!reminderTargets.value.length) return message.info('没有待催交的报告');
  reminderText.value =
    '请及时提交本期工作报告，重点说明已完成成果、下期计划，以及风险与需要协调的事项。';
  reminderOpen.value = true;
}
async function confirmReminder() {
  if (reminderBusy.value || !reminderText.value.trim()) return;
  reminderBusy.value = true;
  try {
    const result = await remindReviewReports(
      reminderTargets.value.map((item) => item.id),
      reminderText.value,
    );
    reminderOpen.value = false;
    message.success(
      `已为 ${result.data.count} 人记录催交（演示，未发送真实通知）`,
    );
  } catch (error) {
    message.error(error instanceof Error ? error.message : '催交记录失败');
  } finally {
    reminderBusy.value = false;
  }
}
</script>

<template>
  <ConfigProvider
    :theme="{
      inherit: false,
      algorithm: theme.defaultAlgorithm,
      token: {
        colorPrimary: '#247d69',
        colorText: '#2b4738',
        colorBgContainer: '#fff',
        colorBgElevated: '#fff',
        colorBorder: '#d8e3dc',
      },
    }"
  >
    <div class="review-triage" :class="{ 'is-mobile': isMobile }">
      <div class="triage-status-tabs" role="group" aria-label="审核状态">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          :class="[tab.key, { active: status === tab.key }]"
          :aria-pressed="status === tab.key"
          @click="status = tab.key"
        >
          {{ tab.label }}<span>{{ tab.count }}</span>
        </button>
        <div class="triage-status-actions">
          <div
            v-if="!isMobile"
            class="view-switch"
            role="group"
            aria-label="列表视图"
          >
            <button
              v-for="opt in [
                { key: 'grid', label: '紧凑网格', icon: 'lucide:layout-grid' },
                { key: 'kanban', label: '看板', icon: 'lucide:columns-3' },
                { key: 'table', label: '密集表格', icon: 'lucide:table-2' },
              ]"
              :key="opt.key"
              type="button"
              :class="{ active: view === opt.key }"
              :aria-pressed="view === opt.key"
              @click="view = opt.key as ViewMode"
            >
              <Icon :icon="opt.icon" />{{ opt.label }}
            </button>
          </div>
          <Button
            v-if="isMobile"
            class="mobile-filter-trigger"
            @click="openMobileFilters"
            ><Icon icon="lucide:sliders-horizontal" />筛选<span
              v-if="activeFilterCount"
              >{{ activeFilterCount }}</span
            ></Button
          >
        </div>
      </div>
      <div v-if="!isMobile" class="triage-filters">
        <Input
          v-model:value="search"
          allow-clear
          placeholder="搜索姓名、组别或报告"
          class="triage-search"
          aria-label="搜索审核报告"
          ><template #prefix><Icon icon="lucide:search" /></template></Input
        ><Select
          v-model:value="typeFilter"
          :options="types"
          aria-label="报告类型"
          class="filter-type"
        /><Select
          v-model:value="formatFilter"
          :options="formats"
          aria-label="汇报形式"
          class="filter-format"
        /><Select
          v-model:value="year"
          :options="years"
          aria-label="报告年份"
          class="filter-year"
        /><Select
          v-model:value="periods"
          :options="periodOptions"
          mode="multiple"
          :max-tag-count="1"
          allow-clear
          placeholder="全部周期"
          aria-label="筛选报告周期"
          class="filter-period"
        /><button type="button" class="week-shortcut" @click="quickPeriod(0)">
          本周</button
        ><button type="button" class="week-shortcut" @click="quickPeriod(-1)">
          上周</button
        ><Checkbox v-model:checked="riskOnly">仅看风险</Checkbox
        ><button
          v-if="hasFilters"
          type="button"
          class="clear-filter"
          @click="reset"
        >
          重置
        </button>
      </div>
      <div v-if="isMobile && activeFilterCount" class="mobile-filter-summary">
        <span>已启用 {{ activeFilterCount }} 项筛选</span
        ><button type="button" @click="openMobileFilters">
          调整条件<Icon icon="lucide:chevron-right" />
        </button>
      </div>
      <div class="triage-selection">
        <Checkbox
          v-if="eligible.length"
          :checked="eligible.length > 0 && selected.length === eligible.length"
          :indeterminate="
            selected.length > 0 && selected.length < eligible.length
          "
          :disabled="!eligible.length"
          @change="toggleAll(Boolean($event.target.checked))"
          >全选未提交</Checkbox
        ><span v-if="selected.length"
          >已选 <b>{{ selected.length }}</b> 项</span
        ><span v-else>共 {{ items.length }} 项</span>
        <div class="selection-actions">
          <Button
            v-if="missingSelection.length"
            size="small"
            @click="prepareReminder(missingSelection)"
            >催交所选 {{ missingSelection.length }} 人</Button
          ><button v-if="selected.length" type="button" @click="selected = []">
            清空
          </button>
        </div>
      </div>
      <main class="triage-content">
        <div v-if="displayedView === 'grid'" class="compact-review-grid">
          <CompactReviewCard
            v-for="item in items"
            :key="item.id"
            paper
            :item="item"
            :signals="signals.get(item.id) ?? []"
            :selected="selected.includes(item.id)"
            @select="toggle"
            @open="openReport"
            @remind="prepareReminder([$event])"
          />
        </div>
        <template v-else-if="displayedView === 'kanban'">
          <div class="kanban-board">
            <section
              v-for="lane in lanes"
              :key="lane.key"
              class="kanban-lane"
              :class="[
                lane.key,
                { 'drop-over': dropOver === lane.key && dragging },
              ]"
              @dragover.prevent="dropOver = lane.key"
              @dragleave.self="dropOver = undefined"
              @drop="dropReport($event, lane.key)"
            >
              <header>
                <span><Icon :icon="lane.icon" />{{ lane.title }}</span
                ><b>{{ laneItems(lane.key).length }}</b>
              </header>
              <div class="lane-body">
                <CompactReviewCard
                  v-for="item in laneItems(lane.key)"
                  :key="item.id"
                  :item="item"
                  :signals="signals.get(item.id) ?? []"
                  :selected="selected.includes(item.id)"
                  drag-enabled
                  @select="toggle"
                  @drag="startDrag"
                  @dragend="
                    dragging = '';
                    dropOver = undefined;
                  "
                  @open="openReport"
                  @remind="prepareReminder([$event])"
                />
                <div v-if="!laneItems(lane.key).length" class="lane-empty">
                  {{
                    lane.key === 'shared'
                      ? '暂无分享给我的报告'
                      : lane.key === 'approved'
                        ? '暂无已审批报告'
                        : '当前没有待处理报告'
                  }}
                </div>
              </div>
            </section>
          </div>
        </template>
        <Table
          v-else
          class="dense-review-table"
          size="small"
          :columns="tableColumns"
          :data-source="items"
          row-key="id"
          :row-selection="eligible.length ? rowSelection : undefined"
          :scroll="{ x: 1050, y: 'calc(100dvh - 390px)' }"
          :pagination="{
            current: tablePage,
            pageSize: 30,
            showSizeChanger: false,
            showTotal: (total: number) => `共 ${total} 项`,
            onChange: (page: number) => (tablePage = page),
          }"
          ><template #bodyCell="{ column, record }"
            ><div v-if="column.key === 'author'" class="table-person">
              <b>{{ record.author }}</b
              ><small>{{ record.department }}</small>
            </div>
            <Tooltip v-else-if="column.key === 'title'" :title="record.summary"
              ><button
                class="table-title"
                type="button"
                :disabled="!record.entry"
                @click="openReport(record as ReviewWorkItem)"
              >
                {{ record.title }}
              </button></Tooltip
            ><span v-else-if="column.key === 'type'">{{
              reportFormatLabel(record as ReviewWorkItem)
            }}</span
            ><span v-else-if="column.key === 'period'" class="table-period"
              >{{ record.start.slice(5)
              }}<template v-if="record.start !== record.end">
                — {{ record.end.slice(5) }}</template
              ></span
            ><span
              v-else-if="column.key === 'status'"
              class="table-status"
              :class="reviewWorkState(record as ReviewWorkItem)"
              >{{ reviewWorkLabel(record as ReviewWorkItem) }}</span
            >
            <div v-else-if="column.key === 'signals'" class="table-signals">
              <Tooltip
                v-for="signal in signals.get(record.id) ?? []"
                :key="signal.label"
                :title="signal.detail"
                ><span :class="signal.tone"
                  ><Icon
                    :icon="
                      signal.tone === 'risk'
                        ? 'lucide:triangle-alert'
                        : 'lucide:sparkles'
                    "
                  />{{ signal.label }}</span
                ></Tooltip
              >
            </div>
            <div v-else-if="column.key === 'actions'" class="table-actions">
              <template
                v-if="reviewWorkState(record as ReviewWorkItem) === 'pending'"
                ><Button
                  type="link"
                  size="small"
                  @click="openReport(record as ReviewWorkItem)"
                  >审批</Button
                ></template
              ><Button
                v-else-if="!record.entry"
                type="link"
                size="small"
                :disabled="!!reviewReminderRecords[record.id]"
                @click="prepareReminder([record as ReviewWorkItem])"
                >{{
                  reviewReminderRecords[record.id] ? '已催交' : '催交'
                }}</Button
              ><Button
                v-else
                type="link"
                size="small"
                @click="openReport(record as ReviewWorkItem)"
                >查看</Button
              >
            </div></template
          ></Table
        >
        <div
          v-if="!items.length && displayedView !== 'table'"
          class="triage-empty"
        >
          <Icon icon="lucide:inbox" />
          <p>当前筛选下没有报告</p>
          <Button size="small" @click="reset">清除筛选</Button>
        </div>
      </main>
    </div>
    <Drawer
      :open="filterDrawerOpen && isMobile"
      title="筛选汇报"
      placement="right"
      width="min(88vw, 360px)"
      :body-style="{ padding: '20px 16px' }"
      @close="filterDrawerOpen = false"
    >
      <div class="mobile-review-filters">
        <label for="mobile-review-search">搜索姓名、组别或报告</label
        ><Input
          id="mobile-review-search"
          v-model:value="mobileDraft.search"
          allow-clear
          placeholder="输入关键词"
        />
        <label for="mobile-review-type">报告类型</label
        ><Select
          id="mobile-review-type"
          v-model:value="mobileDraft.type"
          :options="types"
        />
        <label for="mobile-review-format">汇报形式</label
        ><Select
          id="mobile-review-format"
          v-model:value="mobileDraft.format"
          :options="formats"
        />
        <label for="mobile-review-year">报告年份</label
        ><Select
          id="mobile-review-year"
          v-model:value="mobileDraft.year"
          :options="years"
        />
        <div class="mobile-period-label">
          <label for="mobile-review-period">报告周期</label>
          <div>
            <button type="button" @click="mobileQuickPeriod(0)">本周</button
            ><button type="button" @click="mobileQuickPeriod(-1)">上周</button>
          </div>
        </div>
        <Select
          id="mobile-review-period"
          v-model:value="mobileDraft.periods"
          :options="mobilePeriodOptions"
          mode="multiple"
          allow-clear
          placeholder="全部周期，可多选"
        />
        <Checkbox v-model:checked="mobileDraft.riskOnly"
          >仅看有风险的报告</Checkbox
        >
      </div>
      <template #footer
        ><div class="mobile-filter-footer">
          <Button @click="resetMobileFilters">重置</Button
          ><Button type="primary" @click="applyMobileFilters">应用筛选</Button>
        </div></template
      >
    </Drawer>
    <Modal
      :open="approvalOpen"
      title="审批确认"
      :width="760"
      :confirm-loading="approvalBusy"
      :ok-button-props="{ disabled: !approvalValid }"
      :cancel-button-props="{ disabled: approvalBusy }"
      :closable="!approvalBusy"
      :mask-closable="!approvalBusy"
      :keyboard="!approvalBusy"
      ok-text="确认评分并审批通过"
      cancel-text="取消"
      @ok="confirmApproval"
      @cancel="approvalOpen = false"
      ><p class="approval-modal-intro">
        请核对每份报告的评分和意见后确认。AI 仅提供初稿，满分 10 分。
      </p>
      <div class="approval-draft-list">
        <article
          v-for="draft in approvalDrafts"
          :key="`${draft.id}:${draft.version}`"
        >
          <header>
            <div>
              <b>{{ draft.author }}</b
              ><span>V{{ draft.version }} · {{ draft.title }}</span>
            </div>
            <div class="approval-draft-score">
              <ReviewScoreInput
                :id="`review-score-${draft.id}`"
                v-model:value="draft.score"
                :disabled="approvalBusy"
              />
            </div>
          </header>
          <p :title="draft.summary" class="draft-summary">
            {{ draft.summary }}
          </p>
          <span v-if="draft.risk" class="draft-risk"
            ><Icon icon="lucide:triangle-alert" />{{
              draft.risk
            }}，请重点核对</span
          >
          <p v-if="draft.customer" class="customer-approval-note">
            此项为客户报告运维审批，通过后客户经理可对外分享。
          </p>
          <Input.TextArea
            v-model:value="draft.feedback"
            :rows="3"
            :disabled="approvalBusy"
            :aria-label="`${draft.author}的审批意见`"
          />
          <p v-if="draft.error" class="draft-error">{{ draft.error }}</p>
        </article>
      </div></Modal
    >
    <Modal
      :open="reminderOpen"
      title="确认催交"
      :width="560"
      :confirm-loading="reminderBusy"
      :ok-button-props="{ disabled: !reminderText.trim() }"
      :cancel-button-props="{ disabled: reminderBusy }"
      :closable="!reminderBusy"
      :mask-closable="!reminderBusy"
      :keyboard="!reminderBusy"
      ok-text="记录催交"
      cancel-text="取消"
      @ok="confirmReminder"
      @cancel="reminderOpen = false"
      ><p class="approval-modal-intro">
        向以下 {{ reminderTargets.length }} 位未提交报告的人员记录催交。
      </p>
      <div class="reminder-people">
        <span v-for="item in reminderTargets" :key="item.id"
          >{{ item.author
          }}<small
            >{{ item.start.slice(5) }}—{{ item.end.slice(5) }}</small
          ></span
        >
      </div>
      <Input.TextArea
        v-model:value="reminderText"
        :rows="4"
        :disabled="reminderBusy"
        aria-label="催交内容"
      />
      <p class="approval-modal-intro">
        本地演示，不向真实人员发送通知。
      </p></Modal
    >
  </ConfigProvider>
</template>
<style scoped src="./review-triage.css"></style>
