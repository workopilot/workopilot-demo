<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import {
  Button,
  DatePicker,
  Drawer,
  Empty,
  Input,
  Select,
  Table,
  message,
} from 'ant-design-vue';
import type {
  ApprovalKind,
  BusinessApproval,
  BusinessApprovalStatus,
} from '#/api/mock-business-approvals';
import {
  businessApprovals,
  submitBusinessApproval,
} from '#/api/mock-business-approvals';
const props = defineProps<{ kind: ApprovalKind }>();
const RangePicker = DatePicker.RangePicker;
const mobile = useMediaQuery('(max-width: 767px)');
const view = ref('grid');
const displayedView = computed(() => (mobile.value ? 'grid' : view.value));
const query = ref('');
const subtype = ref('all');
const dates = ref<[string, string]>();
const status = ref('all');
const filterOpen = ref(false);
const selected = ref<BusinessApproval>();
const opinion = ref('');
const busy = ref(false);
const page = ref(1);
const title = computed(() => (props.kind === 'project' ? '立项' : '工单'));
const source = computed(() =>
  businessApprovals.filter((item) => item.kind === props.kind),
);
const types = computed(() => [
  { label: '全部事项类型', value: 'all' },
  ...[...new Set(source.value.map((item) => item.subtype))].map((value) => ({
    label: value,
    value,
  })),
]);
const statuses = [
  { key: 'pending', label: '待我审批' },
  { key: 'approved', label: '已通过' },
  { key: 'returned', label: '已退回' },
  { key: 'shared', label: '分享给我' },
];
function label(value: BusinessApprovalStatus) {
  return statuses.find((item) => item.key === value)?.label ?? value;
}
const filtered = computed(() =>
  source.value.filter(
    (item) =>
      (subtype.value === 'all' || item.subtype === subtype.value) &&
      (!query.value.trim() ||
        [
          item.id,
          item.title,
          item.author,
          item.department,
          ...item.facts.map((f) => f.value),
        ]
          .join(' ')
          .includes(query.value.trim())) &&
      (!dates.value?.length ||
        (item.submittedAt >= dates.value[0] &&
          item.submittedAt <= dates.value[1])),
  ),
);
const items = computed(() =>
  filtered.value.filter(
    (item) => status.value === 'all' || item.status === status.value,
  ),
);
const columns = computed(() =>
  displayedView.value === 'kanban'
    ? statuses.map((state) => ({
        ...state,
        items: items.value.filter((item) => item.status === state.key),
      }))
    : [{ key: 'all', label: '', items: items.value }],
);
const tableColumns = [
  { title: '编号', dataIndex: 'id', width: 110 },
  { title: '审核事项', dataIndex: 'title', width: 260 },
  { title: '类型', dataIndex: 'subtype', width: 110 },
  { title: '提交人', dataIndex: 'author', width: 100 },
  { title: '提交日期', dataIndex: 'submittedAt', width: 120 },
  { title: '状态', key: 'status', width: 110 },
  { title: '操作', key: 'action', width: 90 },
];
watch([query, subtype, dates, status], () => {
  page.value = 1;
});
watch(mobile, () => {
  filterOpen.value = false;
});
function openById(id: string) {
  const item = source.value.find((entry) => entry.id === id);
  if (item) open(item);
}
function open(item: BusinessApproval) {
  selected.value = item;
  opinion.value = '';
}
async function decide(decision: 'approved' | 'returned') {
  if (!selected.value || busy.value) return;
  if (!opinion.value.trim()) {
    message.warning('请填写审批意见');
    return;
  }
  busy.value = true;
  try {
    await submitBusinessApproval(selected.value.id, decision, opinion.value);
    message.success(decision === 'approved' ? '已通过' : '已退回');
  } catch (error) {
    message.error(error instanceof Error ? error.message : '操作失败');
  } finally {
    busy.value = false;
  }
}
function clearFilters() {
  query.value = '';
  subtype.value = 'all';
  dates.value = undefined;
}
</script>
<template>
  <div class="business-list">
    <nav class="status-tabs" aria-label="审核状态">
      <button
        type="button"
        :class="{ active: status === 'all' }"
        @click="status = 'all'"
      >
        全部 <span>{{ filtered.length }}</span>
      </button>
      <button
        v-for="state in statuses"
        :key="state.key"
        type="button"
        :class="{ active: status === state.key }"
        @click="status = state.key"
      >
        {{ state.label }}
        <span>{{
          filtered.filter((item) => item.status === state.key).length
        }}</span>
      </button>
      <div class="business-status-actions">
        <div v-if="!mobile" class="view-switch" aria-label="列表视图">
          <button
            v-for="mode in [
              { key: 'grid', label: '卡片' },
              { key: 'kanban', label: '看板' },
              { key: 'table', label: '表格' },
            ]"
            :key="mode.key"
            type="button"
            :class="{ active: view === mode.key }"
            :aria-pressed="view === mode.key"
            @click="view = mode.key"
          >
            {{ mode.label }}
          </button>
        </div>
        <Button v-else @click="filterOpen = true">筛选</Button>
      </div>
    </nav>
    <div v-if="!mobile" class="filters">
      <Input
        v-model:value="query"
        allow-clear
        :placeholder="`搜索${title}、提交人、客户或编号`"
        aria-label="搜索审核事项"
      />
      <Select v-model:value="subtype" :options="types" aria-label="事项类型" />
      <RangePicker
        v-model:value="dates"
        value-format="YYYY-MM-DD"
        :placeholder="['提交开始日期', '提交结束日期']"
      />
      <Button type="text" @click="clearFilters">重置</Button>
    </div>
    <div class="result-count">共 {{ items.length }} 项</div>
    <main class="list-content">
      <Table
        v-if="displayedView === 'table'"
        :columns="tableColumns"
        :data-source="items"
        row-key="id"
        size="small"
        :scroll="{ x: 900 }"
        :pagination="{
          current: page,
          pageSize: 12,
          onChange: (value: number) => (page = value),
          showSizeChanger: false,
        }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'"
            ><span class="state" :class="record.status">{{
              label(record.status)
            }}</span></template
          >
          <template v-else-if="column.key === 'action'"
            ><Button type="link" size="small" @click="openById(record.id)">{{
              record.status === 'pending' ? '审批' : '查看'
            }}</Button></template
          >
        </template>
      </Table>
      <div
        v-else
        class="collections"
        :class="{ board: displayedView === 'kanban' }"
      >
        <section
          v-for="column in columns"
          :key="column.key"
          :class="{ 'board-lane': displayedView === 'kanban' }"
        >
          <header v-if="displayedView === 'kanban'" class="lane-title">
            {{ column.label }} <span>{{ column.items.length }}</span>
          </header>
          <div
            class="business-grid"
            :class="{ stack: displayedView === 'kanban' }"
          >
            <article
              v-for="item in column.items"
              :key="item.id"
              class="business-card"
              :class="item.status"
              tabindex="0"
              :aria-label="item.title"
              @click="open(item)"
              @keydown.enter.self="open(item)"
              @keydown.space.self.prevent="open(item)"
            >
              <header>
                <div class="avatar">{{ item.author.slice(0, 1) }}</div>
                <div class="person">
                  <b>{{ item.author }}</b
                  ><span>{{ item.department }}</span>
                </div>
                <span class="state" :class="item.status">{{
                  label(item.status)
                }}</span>
              </header>
              <div class="business-body">
                <span class="subtype">{{ item.subtype }}</span>
                <h3>{{ item.title }}</h3>
                <p>{{ item.id }} · {{ item.submittedAt }}</p>
              </div>
              <footer>
                <Button @click.stop="open(item)"
                  ><svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    aria-hidden="true"
                  >
                    <path
                      v-if="item.status === 'pending'"
                      d="M9 5H5v16h14v-7M9 3h6v4H9zM12 12l3 3 6-6"
                    />
                    <template v-else>
                      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </template></svg
                  >{{ item.status === 'pending' ? '审批' : '查看' }}</Button
                >
              </footer>
            </article>
            <div
              v-if="!column.items.length && displayedView === 'kanban'"
              class="lane-empty"
            >
              暂无事项
            </div>
          </div>
        </section>
      </div>
      <Empty
        v-if="!items.length && displayedView === 'grid'"
        description="当前筛选下没有审核事项"
      />
    </main>
    <Drawer
      :open="filterOpen"
      title="筛选审核事项"
      width="min(88vw, 360px)"
      @close="filterOpen = false"
    >
      <div class="mobile-filters">
        <label>关键词</label
        ><Input
          v-model:value="query"
          allow-clear
          placeholder="搜索事项、提交人或客户"
        /><label>事项类型</label
        ><Select v-model:value="subtype" :options="types" /><label
          >提交日期</label
        ><RangePicker v-model:value="dates" value-format="YYYY-MM-DD" />
      </div>
      <template #footer
        ><div class="drawer-actions">
          <Button @click="clearFilters">重置</Button
          ><Button type="primary" @click="filterOpen = false">完成</Button>
        </div></template
      >
    </Drawer>
    <Drawer
      :open="!!selected"
      :title="`${title}审核`"
      width="min(720px, 100vw)"
      :closable="!busy"
      :mask-closable="!busy"
      :keyboard="!busy"
      @close="selected = undefined"
    >
      <template v-if="selected">
        <div class="detail-heading">
          <span class="state" :class="selected.status">{{
            label(selected.status)
          }}</span>
          <h2>{{ selected.title }}</h2>
          <p>
            {{ selected.id }} · {{ selected.author }} ·
            {{ selected.submittedAt }}
          </p>
        </div>
        <dl class="detail-facts">
          <div v-for="fact in selected.facts" :key="fact.label">
            <dt>{{ fact.label }}</dt>
            <dd>{{ fact.value }}</dd>
          </div>
        </dl>
        <section
          v-for="section in selected.sections"
          :key="section.title"
          class="detail-section"
        >
          <h3>{{ section.title }}</h3>
          <p>{{ section.text }}</p>
        </section>
        <section v-if="selected.feedback" class="detail-section decision">
          <h3>审批意见</h3>
          <p>{{ selected.feedback }}</p>
          <small v-if="selected.reviewedAt">{{ selected.reviewedAt }}</small>
        </section>
        <section v-if="selected.status === 'pending'" class="detail-section">
          <h3>审批意见</h3>
          <Input.TextArea
            v-model:value="opinion"
            :rows="4"
            :maxlength="1000"
            show-count
            :disabled="busy"
            placeholder="请填写核对结论；退回时请说明需要补充的内容"
            aria-label="审批意见"
          />
        </section>
      </template>
      <template #footer
        ><div class="drawer-actions">
          <Button :disabled="busy" @click="selected = undefined">关闭</Button
          ><template v-if="selected?.status === 'pending'"
            ><Button :loading="busy" @click="decide('returned')"
              >退回补充</Button
            ><Button type="primary" :loading="busy" @click="decide('approved')"
              >通过</Button
            ></template
          >
        </div></template
      >
    </Drawer>
  </div>
</template>
<style scoped>
.business-list {
  display: flex;
  width: 100%;
  min-width: 0;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 16px 20px;
  color: #2b4738;
  container-type: inline-size;
}
.list-heading,
.status-tabs,
.filters,
.result-count {
  flex-shrink: 0;
}
.list-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 650;
}
.view-switch {
  display: flex;
  gap: 3px;
  padding: 3px;
  border: 1px solid #dce6df;
  border-radius: 8px;
  background: #eaf0ec;
}
.view-switch button {
  padding: 5px 12px;
  border: 0;
  background: transparent;
  border-radius: 5px;
  font-size: 12px;
  color: #62796b;
  cursor: pointer;
}
.view-switch button.active {
  background: #fff;
  color: #24664e;
}
.status-tabs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
  padding-bottom: 10px;
  border-bottom: 1px solid #dce6df;
}
.status-tabs > button {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 12px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: #62796b;
  font-size: 12px;
  cursor: pointer;
}
.status-tabs > button.active {
  background: #fff;
  border-color: #d6e5da;
  color: #2b6241;
  font-weight: 600;
}
.status-tabs > button span {
  background: #e9eeea;
  padding: 0 5px;
  border-radius: 5px;
  font-variant-numeric: tabular-nums;
}
.filters {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  padding: 14px 0;
}
.filters > :deep(.ant-input-affix-wrapper) {
  width: 250px;
}
.filters > :deep(.ant-select) {
  width: 160px;
}
.result-count {
  font-size: 12px;
  color: #667a6d;
  padding: 4px 0 12px;
}
.list-content {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 1px 3px 10px 1px;
}
.business-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 22px;
}
.collections.board {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: start;
  gap: 12px;
}
.board-lane {
  background: #eaf0eb;
  border: 1px solid #dce6df;
  border-radius: 10px;
  overflow: hidden;
}
.lane-title {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  font-size: 13px;
  font-weight: 600;
}
.business-grid.stack {
  grid-template-columns: 1fr;
  gap: 10px;
  padding: 9px;
}
.business-card {
  --tint: #f1ecdd;
  --ink: #786542;
  --edge: #cfc3a2;
  --deep: #8c7950;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 22px 18px 12px;
  border: 1px solid #dfe5e1;
  border-top: 8px solid var(--edge);
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  box-shadow: 0 3px 12px #263d3006;
  transition: border-color 180ms;
}
.business-card.approved {
  --tint: #e7f1ea;
  --ink: #396a4e;
  --edge: #a8cbb4;
  --deep: #28634a;
}
.business-card.shared {
  --tint: #e8f0f8;
  --ink: #3f678a;
  --edge: #acc8e1;
  --deep: #2c5f91;
}
.business-card.returned {
  --tint: #f5ece8;
  --ink: #8b6255;
  --edge: #d6b6aa;
  --deep: #855d50;
}
.business-card:hover {
  border-top-color: var(--deep);
}
.business-card > header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 14px;
  border-bottom: 1px solid #edf0ed;
  flex-wrap: wrap;
}
.avatar {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #e5eee8;
  color: #52745e;
  font-size: 13px;
}
.person {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.person b {
  font-size: 14px;
}
.person span {
  font-size: 12px;
  color: #68776e;
}
.state {
  display: inline-flex;
  padding: 3px 6px;
  border-radius: 5px;
  color: #68766e;
  background: #f1f3f1;
  font-size: 12px;
  white-space: nowrap;
}
.state.pending {
  background: #f4f2ec;
  color: #71694f;
}
.state.approved {
  background: #edf4ef;
  color: #47725a;
}
.state.returned {
  background: #f5ece8;
  color: #8b6255;
}
.state.shared {
  background: #edf3f8;
  color: #526f88;
}
.business-body {
  flex: 1;
  padding: 18px 0;
}
.subtype {
  font-size: 12px;
  color: #68776e;
}
.business-body h3 {
  font-size: 15px;
  line-height: 1.6;
  margin: 7px 0 10px;
  color: #304b3b;
  font-weight: 650;
}
.business-body p {
  font-size: 12px;
  color: #667a6d;
  margin: 0;
}
.business-card footer {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #edf0ed;
  padding-top: 12px;
}
.business-card :deep(.ant-btn) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  background: var(--tint);
  color: var(--ink);
  border-color: var(--edge);
  box-shadow: none;
}
.business-card:hover :deep(.ant-btn),
.business-card:focus-within :deep(.ant-btn) {
  background: var(--deep);
  color: #fff;
  border-color: var(--deep);
}
.business-card svg {
  width: 14px;
  height: 14px;
}
.lane-empty {
  padding: 25px 10px;
  text-align: center;
  font-size: 12px;
  color: #75877b;
}
button:focus-visible,
.business-card:focus-visible {
  outline: 2px solid #468b65;
  outline-offset: 2px;
}
.mobile-filters {
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 13px;
}
.mobile-filters label:not(:first-child) {
  margin-top: 8px;
}
.detail-heading h2 {
  font-size: 22px;
  line-height: 1.5;
  margin: 14px 0 8px;
  color: #264b36;
}
.detail-heading p {
  font-size: 13px;
  color: #68776e;
}
.detail-facts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  background: #f3f7f4;
  padding: 18px;
  border-radius: 8px;
  margin: 20px 0;
}
.detail-facts dt {
  color: #697c70;
  font-size: 12px;
}
.detail-facts dd {
  color: #304b3b;
  font-size: 14px;
  margin: 4px 0 0;
}
.detail-section {
  margin: 22px 0;
}
.detail-section h3 {
  font-size: 15px;
  font-weight: 650;
  color: #304b3b;
  margin: 0 0 10px;
}
.detail-section p {
  font-size: 14px;
  line-height: 1.8;
  color: #536c5c;
  margin: 0;
}
.detail-section small {
  font-size: 12px;
  color: #738779;
}
.decision {
  padding: 16px;
  border-radius: 8px;
  background: #f3f7f4;
}
.drawer-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 6px 0;
}
@container (max-width:1000px) {
  .business-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }
  .collections.board {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@container (max-width:650px) {
  .business-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 767px) {
  .business-list {
    padding: 12px;
  }
  .business-grid {
    grid-template-columns: 1fr;
  }
  .status-tabs > button {
    min-height: 40px;
    padding: 6px 8px;
  }
  .result-count {
    padding-top: 12px;
  }
  .business-card :deep(.ant-btn) {
    min-height: 44px;
    min-width: 70px;
  }
  .detail-facts {
    grid-template-columns: 1fr;
  }
  .drawer-actions :deep(.ant-btn) {
    min-height: 44px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .business-card {
    transition: none;
  }
}
.business-status-actions {
  display: flex;
  align-items: center;
  margin-left: auto;
}
</style>
