<script setup lang="ts">
import type { ReportScheme } from '#/types/new-report';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { computed, ref, watch } from 'vue';
import {
  Button,
  DatePicker,
  Input,
  Modal,
  Select,
  Table,
  message,
} from 'ant-design-vue';
import { Icon } from '@iconify/vue';
import {
  reportObjects,
  defaultReportObject,
  followedReportObjects,
} from '#/api/mock-report-objects';
import { demoReports } from '#/api/mock-new-reports';
import { reportPeriodRange, periodLabel } from '#/utils/report-period';
import ReportBreadcrumb from './ReportBreadcrumb.vue';
const props = defineProps<{
  scheme: ReportScheme;
  period: 'week' | 'month';
  initialStart?: string;
}>();
const emit = defineEmits<{
  back: [];
  open: [objectId: string, start: string, end: string];
}>();
const date = ref(dayjs(props.initialStart ?? props.scheme.start));
const page = ref(1);
const status = ref('all');
const search = ref('');
const range = computed(() =>
  reportPeriodRange(date.value.format('YYYY-MM-DD'), props.period),
);
const noun = computed(() => (props.scheme.id === 'project' ? '项目' : '客户'));
const objectKind = computed(() =>
  props.scheme.id === 'project' ? 'project' : 'customer',
);
const availableObjects = computed(() =>
  reportObjects.filter((object) => object.kind === objectKind.value),
);
const selectedIds = computed(() => followedReportObjects[objectKind.value]);
const manageOpen = ref(false);
const manageSearch = ref('');
const manageScope = ref('all');
const selectionDraft = ref<string[]>([]);
const managePage = ref(1);
const managementColumns = computed(() => [
  { title: `${noun.value}名称`, key: 'name', dataIndex: 'name', width: 250 },
  { title: '负责人', key: 'owner', dataIndex: 'owner', width: 130 },
  {
    title: '说明',
    key: 'description',
    dataIndex: 'description',
    ellipsis: true,
  },
  { title: '填写范围', key: 'added', width: 100 },
]);
const managementSelection = computed(() => ({
  selectedRowKeys: selectionDraft.value,
  preserveSelectedRowKeys: true,
  getCheckboxProps: (record: { id: string }) => ({
    disabled: selectedIds.value.includes(record.id),
  }),
  onChange: (keys: (string | number)[]) => {
    selectionDraft.value = keys.map(String);
  },
}));
watch([manageSearch, manageScope], () => {
  managePage.value = 1;
});
const managementResults = computed(() =>
  availableObjects.value.filter(
    (object) =>
      (manageScope.value !== 'owned' || object.owned) &&
      `${object.name} ${object.owner}`
        .toLowerCase()
        .includes(manageSearch.value.trim().toLowerCase()),
  ),
);
function openManagement() {
  selectionDraft.value = [];
  managePage.value = 1;
  manageSearch.value = '';
  manageScope.value = 'all';
  manageOpen.value = true;
}
function saveSelection() {
  const added = availableObjects.value
    .filter(
      (object) =>
        selectionDraft.value.includes(object.id) &&
        !selectedIds.value.includes(object.id),
    )
    .map((object) => object.id);
  if (!added.length) return message.info(`请先选择需要添加的${noun.value}`);
  followedReportObjects[objectKind.value] = [
    ...new Set([...selectedIds.value, ...added]),
  ];
  page.value = 1;
  search.value = '';
  status.value = 'all';
  manageOpen.value = false;
  selectionDraft.value = [];
  message.success(`已添加 ${added.length} 个${noun.value}到汇报列表`);
}
function removeFromReporting(id: string) {
  followedReportObjects[objectKind.value] = selectedIds.value.filter(
    (value) => value !== id,
  );
  message.success(`已移除填写，可从“管理${noun.value}”重新添加；已有报告保留`);
}
const columns = computed(() => [
  { title: `${noun.value}信息`, key: 'name', dataIndex: 'name', width: 340 },
  { title: '负责人', key: 'owner', dataIndex: 'owner', width: 150 },
  { title: '填报状态', key: 'status', width: 130 },
  { title: '提交时间', key: 'submittedAt', width: 190 },
  { title: '操作', key: 'action', width: 240 },
]);
const rows = computed(() =>
  reportObjects
    .filter(
      (object) =>
        object.kind === props.scheme.id &&
        selectedIds.value.includes(object.id),
    )
    .map((object) => {
      const report = demoReports.find(
        (report) =>
          report.schemeId === props.scheme.id &&
          report.start === range.value.start &&
          report.end === range.value.end &&
          (report.business?.objectId ??
            defaultReportObject(report.schemeId)) === object.id,
      );
      return {
        ...object,
        report,
        status:
          report?.status === 'submitted'
            ? 'submitted'
            : report?.filledAt
              ? 'filled'
              : 'empty',
      };
    }),
);
const filtered = computed(() =>
  rows.value.filter(
    (row) =>
      (status.value === 'all' || row.status === status.value) &&
      `${row.name} ${row.owner}`
        .toLowerCase()
        .includes(search.value.trim().toLowerCase()),
  ),
);
watch([range, status, search, selectedIds], () => {
  page.value = 1;
});
function chooseDate(value: string | Dayjs | null) {
  if (value) date.value = dayjs(value);
}
</script>
<template>
  <section class="business-report-list" :class="`list-kind-${scheme.id}`">
    <header class="business-list-toolbar">
      <Button
        class="list-back"
        aria-label="返回汇报"
        title="返回汇报"
        @click="emit('back')"
        ><Icon icon="lucide:chevron-left"
      /></Button>
      <ReportBreadcrumb
        :list-label="`${noun}${periodLabel(period)}列表`"
        @home="emit('back')"
      />
      <div class="list-toolbar-period" :title="`${range.start} — ${range.end}`">
        <Button aria-label="上一周期" @click="date = date.subtract(1, period)"
          ><Icon icon="lucide:chevron-left"
        /></Button>
        <DatePicker
          id="business-list-period"
          :value="date"
          :picker="period"
          :format="period === 'month' ? 'YYYY 年 MM 月' : 'YYYY-MM-DD'"
          :allow-clear="false"
          :aria-label="period === 'week' ? '选择汇报周' : '选择汇报月份'"
          @change="chooseDate"
        />
        <Button aria-label="下一周期" @click="date = date.add(1, period)"
          ><Icon icon="lucide:chevron-right"
        /></Button>
      </div>
    </header>
    <section class="business-list-panel">
      <div class="list-panel-heading">
        <h1>{{ noun }}列表</h1>
        <div class="list-filters">
          <Select
            v-model:value="status"
            aria-label="按填报状态筛选"
            :options="[
              { value: 'all', label: '全部状态' },
              { value: 'empty', label: '未填写' },
              { value: 'filled', label: '已填写' },
              { value: 'submitted', label: '已提交' },
            ]"
          />
          <Input
            v-model:value="search"
            :placeholder="`搜索${noun}或负责人`"
            :aria-label="`搜索${noun}或负责人`"
            allow-clear
            ><template #prefix><Icon icon="lucide:search" /></template
          ></Input>
          <Button class="manage-objects-button" @click="openManagement"
            ><Icon icon="lucide:sliders-horizontal" />管理{{ noun }}</Button
          >
        </div>
      </div>
      <Table
        class="report-object-table"
        :columns="columns"
        :data-source="filtered"
        row-key="id"
        :scroll="{ x: 1050 }"
        :locale="{
          emptyText: selectedIds.length
            ? `未找到匹配的${noun}，请调整搜索或筛选条件。`
            : `尚未选择需要汇报的${noun}，点击右上角“管理${noun}”添加。`,
        }"
        :pagination="{
          current: page,
          pageSize: 5,
          total: filtered.length,
          showSizeChanger: false,
          hideOnSinglePage: false,
          showTotal: (total) => `共 ${total} 个${noun}`,
        }"
        @change="(pagination) => (page = pagination.current ?? 1)"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <div class="object-name-cell">
              <span class="object-symbol"
                ><Icon
                  :icon="
                    scheme.id === 'project'
                      ? 'lucide:folder-kanban'
                      : 'lucide:building-2'
                  "
              /></span>
              <div class="object-name-content">
                <div class="object-name-line">
                  <button
                    class="object-name-link"
                    @click="emit('open', record.id, range.start, range.end)"
                  >
                    {{ record.name }}</button
                  ><small v-if="record.owned" class="owned">我负责</small>
                </div>
                <p :title="record.description">
                  {{ record.description.replace(/ · 我负责$/, '') }}
                </p>
              </div>
            </div>
          </template>
          <template v-else-if="column.key === 'owner'"
            ><div class="object-owner">
              <span>{{ record.owner.slice(0, 1) }}</span
              ><strong>{{ record.owner }}</strong>
            </div></template
          >
          <template v-else-if="column.key === 'status'"
            ><span class="fill-status" :class="record.status"
              ><Icon
                :icon="
                  record.status === 'submitted'
                    ? 'lucide:circle-check'
                    : record.status === 'filled'
                      ? 'lucide:pencil-line'
                      : 'lucide:circle-dashed'
                "
              />{{
                record.status === 'submitted'
                  ? '已提交'
                  : record.status === 'filled'
                    ? '已填写'
                    : '未填写'
              }}</span
            ></template
          >
          <template v-else-if="column.key === 'submittedAt'"
            ><span v-if="record.report?.submittedAt" class="submission-time">{{
              record.report.submittedAt
            }}</span
            ><span v-else class="submission-empty">{{
              record.status === 'submitted' ? '日期待补充' : '尚未提交'
            }}</span></template
          >
          <template v-else-if="column.key === 'action'">
            <div class="row-report-actions">
              <Button
                class="row-report-action"
                :class="{ 'is-submitted': record.status === 'submitted' }"
                @click="emit('open', record.id, range.start, range.end)"
                >{{
                  record.status === 'submitted'
                    ? '查看报告'
                    : record.status === 'filled'
                      ? '继续填写'
                      : '填写报告'
                }}<Icon icon="lucide:arrow-right" /></Button
              ><Button
                type="text"
                size="small"
                class="remove-reporting"
                @click="removeFromReporting(record.id)"
                >移除填写</Button
              >
            </div></template
          >
        </template>
      </Table>
    </section>
    <Modal
      :open="manageOpen"
      :title="`管理${noun} · 添加需要汇报的${noun}`"
      :width="820"
      centered
      @cancel="manageOpen = false"
      @ok="saveSelection"
    >
      <div class="manage-object-content">
        <p class="manage-object-note">
          仅展示你有权查看的{{
            noun
          }}，选中后点击“添加”加入列表。已添加的无需重复勾选；不再填写可在列表中点击“移除填写”，已有报告保留。
        </p>
        <div class="manage-object-query">
          <Input
            v-model:value="manageSearch"
            :placeholder="`搜索${noun}名称或负责人`"
            :aria-label="`查询可选${noun}`"
            allow-clear
            ><template #prefix><Icon icon="lucide:search" /></template></Input
          ><Select
            v-model:value="manageScope"
            :options="[
              { value: 'all', label: '全部可见' },
              { value: 'owned', label: '我负责的' },
            ]"
            aria-label="筛选可选对象范围"
          />
        </div>
        <div class="manage-object-selection">
          <span
            >已选择 <strong>{{ selectionDraft.length }}</strong> 个{{
              noun
            }}</span
          >
        </div>
        <Table
          class="management-object-table"
          size="middle"
          row-key="id"
          :columns="managementColumns"
          :data-source="managementResults"
          :row-selection="managementSelection"
          :scroll="{ x: 640, y: 360 }"
          :locale="{ emptyText: `没有匹配的${noun}，请调整查询条件。` }"
          :pagination="{
            current: managePage,
            pageSize: 8,
            total: managementResults.length,
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 个${noun}`,
          }"
          @change="(pagination) => (managePage = pagination.current ?? 1)"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'"
              ><strong class="manage-object-name">{{ record.name }}</strong
              ><small v-if="record.owned" class="manage-object-owned"
                >我负责</small
              ></template
            >
            <template v-else-if="column.key === 'added'"
              ><span
                class="object-added-status"
                :class="{ added: selectedIds.includes(record.id) }"
                >{{
                  selectedIds.includes(record.id) ? '已添加' : '可添加'
                }}</span
              ></template
            >
          </template>
        </Table>
      </div>
      <template #footer
        ><div class="manage-object-footer">
          <span>仅调整汇报范围，不修改业务数据。</span
          ><Button @click="manageOpen = false">取消</Button
          ><Button
            type="primary"
            :disabled="!selectionDraft.length"
            @click="saveSelection"
            >添加{{
              selectionDraft.length ? `（${selectionDraft.length}）` : ''
            }}</Button
          >
        </div></template
      >
    </Modal>
  </section>
</template>
<style scoped>
.business-report-list {
  --list-accent: #3865a3;
  --list-tint: #edf3fc;
  --list-hover: #f8faff;
  overflow: auto;
  min-height: 0;
  color: #294035;
}
.business-report-list.list-kind-customer {
  --list-accent: #a5612c;
  --list-tint: #fbf0e6;
  --list-hover: #fffaf5;
}
.business-list-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px;
  margin-bottom: 16px;
  background: #fff;
  border: 1px solid #dfe7e2;
  border-radius: 14px;
  box-shadow: 0 3px 12px #213d3506;
}
.list-back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  padding: 0;
}
.list-toolbar-period {
  display: flex;
  gap: 6px;
  align-items: center;
}
.list-toolbar-period :deep(.ant-picker) {
  width: 142px;
}
.list-toolbar-period :deep(.ant-btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
}
.business-list-panel {
  padding: 20px;
  background: white;
  border: 1px solid #dfe7e2;
  border-radius: 14px;
}
.list-panel-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 18px;
}
.list-panel-heading h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #294b3c;
}
.list-filters {
  display: flex;
  gap: 10px;
  align-items: center;
}
.manage-objects-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  color: var(--list-accent);
  border-color: var(--list-tint);
  background: var(--list-tint);
  box-shadow: none;
}
.manage-object-content {
  color: #425e4e;
}
.manage-object-note {
  font-size: 13px;
  line-height: 1.85;
  color: #7b8b80;
  margin: 8px 0 18px;
}
.manage-object-query {
  display: flex;
  gap: 10px;
}
.manage-object-query :deep(.ant-select) {
  width: 130px;
  flex-shrink: 0;
}
.manage-object-selection {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0 10px;
  color: #7a8d80;
  font-size: 12px;
}
.manage-object-selection strong {
  color: #377458;
  margin: 0 3px;
}
.manage-object-name {
  font-size: 14px;
  font-weight: 600;
  color: #3f5d4b;
}
.manage-object-owned {
  font-size: 10px;
  color: #649074;
  margin-left: 8px;
}
.management-object-table :deep(.ant-table-container) {
  border: 1px solid #e4ece6;
  border-radius: 8px;
  overflow: hidden;
}
.management-object-table :deep(.ant-table-thead > tr > th) {
  font-size: 12px;
  color: #788b7f;
  background: #f5f8f6;
}
.management-object-table :deep(.ant-table-tbody > tr > td) {
  font-size: 13px;
}
.management-object-table :deep(.ant-table-pagination) {
  margin: 12px 0 0;
}
.manage-object-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.manage-object-footer > span {
  margin-right: auto;
  font-size: 12px;
  color: #8a9b8e;
}
.list-filters :deep(.ant-select) {
  width: 118px;
  flex-shrink: 0;
}
.list-filters :deep(.ant-input-affix-wrapper) {
  width: 230px;
}
.fill-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 5px 9px;
  border-radius: 7px;
  background: #f1f3f2;
  color: #64756b;
}
.fill-status.filled {
  background: #fff4da;
  color: #846320;
}
.fill-status.submitted {
  background: #e8f3ed;
  color: #2b7050;
}
.owned {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 500;
  color: var(--list-accent);
  padding: 2px 6px;
  border-radius: 5px;
  background: var(--list-tint);
}
.object-name-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.object-symbol {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  border-radius: 12px;
  color: var(--list-accent);
  background: linear-gradient(145deg, #fff, var(--list-tint));
  border: 1px solid var(--list-tint);
  font-size: 21px;
}
.object-name-content {
  min-width: 0;
}
.object-name-line {
  display: flex;
  align-items: center;
  gap: 7px;
}
.object-name-link {
  padding: 2px 0;
  border: none;
  background: none;
  cursor: pointer;
  color: #304f40;
  font-size: 14px;
  font-weight: 600;
  text-align: left;
  line-height: 1.6;
}
.object-name-link:hover {
  color: var(--list-accent);
}
.object-name-link:focus-visible {
  outline: 2px solid var(--list-accent);
  outline-offset: 3px;
  border-radius: 3px;
}
.object-name-content p {
  margin: 4px 0 0;
  color: #7b8b81;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 260px;
}
.object-owner {
  display: flex;
  align-items: center;
  gap: 8px;
}
.object-owner > span {
  display: grid;
  place-items: center;
  width: 27px;
  height: 27px;
  border-radius: 50%;
  color: #6c8174;
  background: #f0f4f1;
  font-size: 11px;
}
.object-owner strong {
  color: #5e7367;
  font-size: 13px;
  font-weight: 500;
}
.submission-time {
  color: #687d70;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.submission-empty {
  font-size: 12px;
  color: #98a49c;
}
.row-report-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 12px;
  height: 34px;
  border-radius: 8px;
  color: var(--list-accent);
  border-color: transparent;
  background: var(--list-tint);
  box-shadow: none;
  font-size: 12px;
  transition:
    background 160ms ease,
    border-color 160ms ease;
}
.row-report-actions {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  white-space: nowrap;
}
.remove-reporting {
  color: #8a8f88;
  font-size: 12px;
}
.remove-reporting:hover {
  color: #a56342;
  background: #fff5ed;
}
.object-added-status {
  color: #8a998f;
  font-size: 12px;
}
.object-added-status.added {
  color: #518568;
}
.row-report-action:hover {
  color: var(--list-accent);
  border-color: var(--list-accent);
  background: #fff;
}
.row-report-action.is-submitted {
  border-color: #e3eae5;
  background: #fff;
  color: #6b7e71;
}
.report-object-table :deep(.ant-table) {
  background: transparent;
}
.report-object-table :deep(.ant-table-container) {
  border: 1px solid #e6ede8;
  border-radius: 10px;
  overflow: hidden;
}
.report-object-table :deep(.ant-table-thead > tr > th) {
  background: #f5f8f6;
  color: #7a8d80;
  font-size: 12px;
  font-weight: 500;
  padding: 13px 18px;
  border-bottom: 1px solid #e7eee9;
}
.report-object-table :deep(.ant-table-thead > tr > th::before) {
  display: none;
}
.report-object-table :deep(.ant-table-tbody > tr > td) {
  padding: 18px;
  border-bottom: 1px solid #edf2ee;
  transition: background 160ms ease;
}
.report-object-table :deep(.ant-table-tbody > tr:last-child > td) {
  border-bottom: none;
}
.report-object-table :deep(.ant-table-tbody > tr:hover > td) {
  background: var(--list-hover);
}
.report-object-table :deep(.ant-table-pagination) {
  margin: 18px 0 0;
  font-size: 12px;
  color: #7b8d80;
}
.report-object-table :deep(.ant-table-placeholder > td) {
  padding: 42px 18px !important;
  color: #829487;
  font-size: 13px;
}
.list-filters :deep(.ant-input-prefix) {
  color: #8b9c90;
  margin-right: 7px;
}
@media (prefers-reduced-motion: reduce) {
  .row-report-action,
  .report-object-table :deep(.ant-table-tbody > tr > td) {
    transition: none;
  }
}
@media (max-width: 620px) {
  .business-list-panel {
    padding: 14px;
  }
  .list-filters {
    flex-wrap: wrap;
    width: 100%;
  }
  .list-filters :deep(.ant-input-affix-wrapper) {
    flex: 1;
    width: auto;
    min-width: 150px;
  }
}
</style>
