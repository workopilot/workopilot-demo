<script setup lang="ts">
import type { TableColumnType } from 'ant-design-vue';

import type {
  TicketPriority,
  TicketStatus,
  TicketTimelineAction,
  WorkOrder,
} from '#/types/ticket';

import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Descriptions,
  DescriptionsItem,
  Input,
  message,
  Modal,
  Select,
  Table,
  Tag,
  Timeline,
  TimelineItem,
} from 'ant-design-vue';

import {
  mockWorkOrders,
  ticketPriorityLabel,
  ticketStatusLabel,
} from '#/api/mock-data-ticket';

const keyword = ref('');
const scenarioFilter = ref<string>('');

// 候选工程师列表（用于派单/改派选择）
const engineerOptions = [
  { label: '王安康', value: 'u-wangankang' },
  { label: '李伟', value: 'e-liwei' },
  { label: '陈晓东', value: 'e-chenxiaodong' },
  { label: '刘建华', value: 'e-liujianhua' },
];

const scenarioOptions = [
  { label: '运维工单', value: '运维工单' },
  { label: '需求工单', value: '需求工单' },
  { label: '上门工单', value: '上门工单' },
];

const filteredList = computed(() => {
  let source = mockWorkOrders;
  // 场景筛选
  if (scenarioFilter.value) {
    source = source.filter((w) => w.scenario === scenarioFilter.value);
  }
  if (!keyword.value) return source;
  const kw = keyword.value.toLowerCase();
  return source.filter(
    (w) =>
      w.code.toLowerCase().includes(kw) ||
      w.title.toLowerCase().includes(kw) ||
      (w.customer || '').toLowerCase().includes(kw),
  );
});

function typeTagColor(type: string) {
  if (type === '设备故障') return 'red';
  if (type === '定期保养') return 'blue';
  if (type === '技术咨询') return 'purple';
  if (type === '备件更换') return 'orange';
  if (type === '现场复测') return 'cyan';
  return 'default';
}

function scenarioColor(scenario: string) {
  if (scenario === '运维工单') return 'blue';
  if (scenario === '需求工单') return 'purple';
  if (scenario === '上门工单') return 'cyan';
  return 'default';
}

function priorityColor(priority: TicketPriority) {
  switch (priority) {
    case 'high': {
      return 'orange';
    }
    case 'low': {
      return 'default';
    }
    case 'medium': {
      return 'blue';
    }
    case 'urgent': {
      return 'red';
    }
    default: {
      return 'default';
    }
  }
}

function statusColor(status: TicketStatus) {
  switch (status) {
    case 'cancelled': {
      return 'red';
    }
    case 'closed': {
      return 'default';
    }
    case 'completed': {
      return 'green';
    }
    case 'dispatched': {
      return 'blue';
    }
    case 'onsite-processing': {
      return 'geekblue';
    }
    case 'pending': {
      return 'orange';
    }
    case 'pending-acceptance': {
      return 'purple';
    }
    case 'pending-visit': {
      return 'cyan';
    }
    case 'processing': {
      return 'processing';
    }
    default: {
      return 'default';
    }
  }
}

interface TableRow {
  [key: string]: unknown;
}

const columns: TableColumnType<TableRow>[] = [
  {
    title: '编号',
    dataIndex: 'code',
    key: 'code',
    width: 150,
  },
  {
    title: '标题',
    dataIndex: 'title',
    key: 'title',
    ellipsis: true,
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 110,
  },
  {
    title: '场景',
    dataIndex: 'scenario',
    key: 'scenario',
    width: 100,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
  },
  {
    title: '处理人',
    dataIndex: 'assignee',
    key: 'assignee',
    width: 100,
  },
  {
    title: '优先级',
    key: 'stage',
    width: 90,
  },
  {
    title: 'SLA剩余',
    dataIndex: 'slaRemaining',
    key: 'slaRemaining',
    width: 140,
  },
  {
    title: '操作',
    key: 'action',
    width: 260,
    fixed: 'right',
  },
];

// 工单详情弹窗
const detailOpen = ref(false);
const detailOrder = ref<null | WorkOrder>(null);

function openDetail(record: WorkOrder) {
  detailOrder.value = record;
  detailOpen.value = true;
}

// 派单弹窗
const dispatchOpen = ref(false);
const dispatchOrder = ref<null | WorkOrder>(null);
const dispatchAssigneeId = ref<string>('');

function openDispatch(record: WorkOrder) {
  dispatchOrder.value = record;
  dispatchAssigneeId.value = '';
  dispatchOpen.value = true;
}

function confirmDispatch() {
  if (!dispatchOrder.value || !dispatchAssigneeId.value) {
    message.warning('请选择派单工程师');
    return;
  }
  const target = engineerOptions.find(
    (o) => o.value === dispatchAssigneeId.value,
  );
  const order = dispatchOrder.value;
  order.assignee = target?.label;
  order.assigneeId = target?.value;
  order.status = 'dispatched';
  order.timeline = order.timeline || [];
  order.timeline.push({
    id: `tl-${order.id}-${Date.now()}`,
    action: 'dispatched',
    time: new Date().toISOString().slice(0, 16).replace('T', ' '),
    operator: '当前用户',
    operatorId: 'u-current',
    summary: `派单给 ${target?.label}`,
    extra: { assignee: target?.label || '' },
  });
  message.success(`工单「${order.code}」已派单给 ${target?.label}`);
  dispatchOpen.value = false;
}

// 改派弹窗
const reassignOpen = ref(false);
const reassignOrder = ref<null | WorkOrder>(null);
const reassignAssigneeId = ref<string>('');
const reassignReason = ref<string>('');

function openReassign(record: WorkOrder) {
  reassignOrder.value = record;
  reassignAssigneeId.value = '';
  reassignReason.value = '';
  reassignOpen.value = true;
}

function confirmReassign() {
  if (!reassignOrder.value || !reassignAssigneeId.value) {
    message.warning('请选择改派工程师');
    return;
  }
  const target = engineerOptions.find(
    (o) => o.value === reassignAssigneeId.value,
  );
  const order = reassignOrder.value;
  const fromName = order.assignee || '—';
  order.assignee = target?.label;
  order.assigneeId = target?.value;
  order.timeline = order.timeline || [];
  order.timeline.push({
    id: `tl-${order.id}-${Date.now()}`,
    action: 'transferred',
    time: new Date().toISOString().slice(0, 16).replace('T', ' '),
    operator: '当前用户',
    operatorId: 'u-current',
    summary: `由 ${fromName} 改派给 ${target?.label}`,
    reason: reassignReason.value || '客户经理调整',
    extra: { assignee: target?.label || '', from: fromName },
  });
  order.transferHistory = order.transferHistory || [];
  order.transferHistory.push({
    id: `th-${order.id}-${Date.now()}`,
    fromAssignee: fromName,
    fromAssigneeId: order.assigneeId || '',
    toAssignee: target?.label || '',
    toAssigneeId: target?.value || '',
    operator: '当前用户',
    operatorId: 'u-current',
    reason: reassignReason.value || '客户经理调整',
    time: new Date().toISOString().slice(0, 16).replace('T', ' '),
  });
  message.success(`工单「${order.code}」已改派给 ${target?.label}`);
  reassignOpen.value = false;
}

function canDispatch(status: TicketStatus) {
  return status === 'pending';
}

function canReassign(status: TicketStatus) {
  return status === 'dispatched' || status === 'processing';
}

function timelineActionLabel(action: TicketTimelineAction) {
  const map: Record<TicketTimelineAction, string> = {
    accepted: '验收通过',
    cancelled: '取消工单',
    closed: '关闭工单',
    completed: '处理完成',
    created: '创建工单',
    dispatched: '派单',
    evaluated: '客户评价',
    note: '补充说明',
    started: '开始处理',
    transferred: '改派',
  };
  return map[action] || action;
}

function timelineDotColor(action: TicketTimelineAction) {
  switch (action) {
    case 'accepted':
    case 'completed':
    case 'evaluated': {
      return 'green';
    }
    case 'cancelled':
    case 'closed': {
      return 'red';
    }
    case 'created': {
      return 'blue';
    }
    case 'dispatched':
    case 'note':
    case 'started': {
      return 'blue';
    }
    case 'transferred': {
      return 'orange';
    }
    default: {
      return 'blue';
    }
  }
}
</script>

<template>
  <section class="ticket-page">
    <header class="ticket-page__header">
      <div class="ticket-page__heading">
        <span class="ticket-page__icon"><Icon icon="lucide:list-todo" /></span>
        <div>
          <span class="ticket-page__eyebrow">TICKET QUERY</span>
          <h1>工单查询</h1>
          <p>统一管理全部工单，支持多维度筛选、派单改派与状态流转追踪。</p>
        </div>
      </div>
    </header>

    <div class="ticket-page__body">
      <div class="filter-card">
        <div class="filter-card__row filter-card__row--right">
          <Select
            v-model:value="scenarioFilter"
            allow-clear
            placeholder="场景筛选"
            class="w-40"
            :options="scenarioOptions"
          />
          <Input
            v-model:value="keyword"
            allow-clear
            placeholder="搜索编号/标题/客户"
            class="w-72"
          >
            <template #prefix><Icon icon="lucide:search" /></template>
          </Input>
        </div>
      </div>

      <div class="table-card">
        <Table
          :columns="columns"
          :data-source="filteredList"
          :pagination="{ pageSize: 8, showSizeChanger: false }"
          row-key="id"
          size="middle"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'type'">
              <Tag :color="typeTagColor(record.type)">{{ record.type }}</Tag>
            </template>
            <template v-else-if="column.key === 'scenario'">
              <Tag :color="scenarioColor(record.scenario as string)">
                {{ record.scenario }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'status'">
              <Tag :color="statusColor(record.status)">
                {{ ticketStatusLabel[record.status as TicketStatus] }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'assignee'">
              <span>{{ record.assignee || '—' }}</span>
            </template>
            <template v-else-if="column.key === 'stage'">
              <Tag :color="priorityColor(record.priority as TicketPriority)">
                {{ ticketPriorityLabel[record.priority as TicketPriority] }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'slaRemaining'">
              <span
                class="sla-text"
                :class="[
                  record.slaStatus === 'breached' && 'is-danger',
                  record.slaStatus === 'warning' && 'is-warn',
                ]"
              >
                {{ record.slaRemaining || '—' }}
              </span>
            </template>
            <template v-else-if="column.key === 'action'">
              <div class="cell-actions">
                <Button
                  v-if="canDispatch(record.status as TicketStatus)"
                  type="primary"
                  size="small"
                  @click="openDispatch(record as WorkOrder)"
                >
                  <Icon icon="lucide:send" />
                  派单
                </Button>
                <Button
                  v-if="canReassign(record.status as TicketStatus)"
                  size="small"
                  @click="openReassign(record as WorkOrder)"
                >
                  <Icon icon="lucide:shuffle" />
                  改派
                </Button>
                <Button
                  type="primary"
                  size="small"
                  ghost
                  @click="openDetail(record as WorkOrder)"
                >
                  <Icon icon="lucide:eye" />
                  查看
                </Button>
              </div>
            </template>
          </template>
        </Table>
      </div>
    </div>

    <!-- 工单详情弹窗 -->
    <Modal
      v-model:open="detailOpen"
      :footer="null"
      :width="880"
      title="工单详情"
      class="ticket-detail-modal"
    >
      <template v-if="detailOrder">
        <div class="detail-header">
          <div class="detail-header__left">
            <Tag :color="statusColor(detailOrder.status)">
              {{ ticketStatusLabel[detailOrder.status] }}
            </Tag>
            <Tag :color="priorityColor(detailOrder.priority)">
              {{ ticketPriorityLabel[detailOrder.priority] }}
            </Tag>
            <Tag :color="typeTagColor(detailOrder.type)">
              {{ detailOrder.type }}
            </Tag>
          </div>
          <div class="detail-header__right">
            <span class="detail-code">{{ detailOrder.code }}</span>
          </div>
        </div>

        <Descriptions :column="3" bordered size="small" class="detail-desc">
          <DescriptionsItem label="工单标题" :span="2">
            {{ detailOrder.title }}
          </DescriptionsItem>
          <DescriptionsItem label="场景">
            {{ detailOrder.scenario }}
          </DescriptionsItem>
          <DescriptionsItem label="来源">
            {{ detailOrder.source }}
          </DescriptionsItem>
          <DescriptionsItem label="客户">
            {{ detailOrder.customer || '—' }}
          </DescriptionsItem>
          <DescriptionsItem label="联系人">
            {{ detailOrder.contact || '—' }}
          </DescriptionsItem>
          <DescriptionsItem label="联系电话">
            {{ detailOrder.phone || '—' }}
          </DescriptionsItem>
          <DescriptionsItem label="设备">
            {{ detailOrder.device || '—' }}
          </DescriptionsItem>
          <DescriptionsItem label="创建人">
            {{ detailOrder.creator }}
          </DescriptionsItem>
          <DescriptionsItem label="创建时间">
            {{ detailOrder.createdAt }}
          </DescriptionsItem>
          <DescriptionsItem label="处理人">
            {{ detailOrder.assignee || '—' }}
          </DescriptionsItem>
          <DescriptionsItem label="截止时间">
            {{ detailOrder.deadline }}
          </DescriptionsItem>
          <DescriptionsItem label="SLA状态">
            <span
              class="sla-text"
              :class="[
                detailOrder.slaStatus === 'breached' && 'is-danger',
                detailOrder.slaStatus === 'warning' && 'is-warn',
              ]"
            >
              {{ detailOrder.slaRemaining || '—' }}
            </span>
          </DescriptionsItem>
          <DescriptionsItem label="工单描述" :span="3">
            {{ detailOrder.description }}
          </DescriptionsItem>
          <DescriptionsItem
            v-if="detailOrder.solution"
            label="处理方案"
            :span="3"
          >
            {{ detailOrder.solution }}
          </DescriptionsItem>
          <DescriptionsItem
            v-if="detailOrder.cancelReason"
            label="取消原因"
            :span="3"
          >
            {{ detailOrder.cancelReason }}
          </DescriptionsItem>
          <DescriptionsItem
            v-if="detailOrder.evaluation"
            label="客户评价"
            :span="3"
          >
            {{ detailOrder.rating || '' }} 星 / {{ detailOrder.evaluation }}
          </DescriptionsItem>
        </Descriptions>

        <div class="detail-section">
          <div class="detail-section__title">
            <Icon icon="lucide:git-branch" class="size-4" />
            <span>流转日志</span>
          </div>
          <Timeline class="detail-timeline">
            <TimelineItem
              v-for="event in detailOrder.timeline || []"
              :key="event.id"
              :color="timelineDotColor(event.action)"
            >
              <div class="timeline-item">
                <div class="timeline-item__head">
                  <span class="timeline-item__action">
                    {{ timelineActionLabel(event.action) }}
                  </span>
                  <span class="timeline-item__time">{{ event.time }}</span>
                </div>
                <div class="timeline-item__summary">{{ event.summary }}</div>
                <div class="timeline-item__meta">
                  <span>操作人：{{ event.operator }}</span>
                  <span v-if="event.reason">原因：{{ event.reason }}</span>
                </div>
              </div>
            </TimelineItem>
          </Timeline>
        </div>

        <div
          v-if="
            detailOrder.transferHistory &&
            detailOrder.transferHistory.length > 0
          "
          class="detail-section"
        >
          <div class="detail-section__title">
            <Icon icon="lucide:shuffle" class="size-4" />
            <span>改派历史</span>
          </div>
          <div class="transfer-list">
            <div
              v-for="t in detailOrder.transferHistory"
              :key="t.id"
              class="transfer-item"
            >
              <span class="transfer-item__from">
                {{ t.fromAssignee || '—' }}
              </span>
              <Icon icon="lucide:arrow-right" class="size-3.5" />
              <span class="transfer-item__to">{{ t.toAssignee }}</span>
              <span class="transfer-item__time">{{ t.time }}</span>
              <span class="transfer-item__reason">{{ t.reason }}</span>
            </div>
          </div>
        </div>
      </template>
    </Modal>

    <!-- 派单弹窗 -->
    <Modal
      v-model:open="dispatchOpen"
      title="派单"
      ok-text="确认派单"
      @ok="confirmDispatch"
    >
      <div v-if="dispatchOrder" class="space-y-3 py-2">
        <p class="text-sm text-gray-600">
          工单「
          <strong>{{ dispatchOrder.code }}</strong>
          」- {{ dispatchOrder.title }}
        </p>
        <div>
          <label class="mb-1 block text-xs font-semibold text-gray-700">
            选择工程师 *
          </label>
          <Select
            v-model:value="dispatchAssigneeId"
            placeholder="请选择派单工程师"
            class="w-full"
            :options="engineerOptions"
          />
        </div>
      </div>
    </Modal>

    <!-- 改派弹窗 -->
    <Modal
      v-model:open="reassignOpen"
      title="改派"
      ok-text="确认改派"
      @ok="confirmReassign"
    >
      <div v-if="reassignOrder" class="space-y-3 py-2">
        <p class="text-sm text-gray-600">
          工单「
          <strong>{{ reassignOrder.code }}</strong>
          」当前处理人：{{ reassignOrder.assignee || '—' }}
        </p>
        <div>
          <label class="mb-1 block text-xs font-semibold text-gray-700">
            改派给 *
          </label>
          <Select
            v-model:value="reassignAssigneeId"
            placeholder="请选择改派工程师"
            class="w-full"
            :options="engineerOptions"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs font-semibold text-gray-700">
            改派原因
          </label>
          <Input.TextArea
            v-model:value="reassignReason"
            :rows="3"
            placeholder="请说明改派原因（如：原工程师请假、客户要求更换等）"
          />
        </div>
      </div>
    </Modal>
  </section>
</template>

<style scoped>
@media (max-width: 1280px) {
  .filter-card {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-card__row--right {
    justify-content: flex-end;
  }
}

.ticket-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: #f8fbfa;
  border: 1px solid #d5e4df;
  border-radius: 24px;
  box-shadow: 0 18px 44px rgb(18 57 45 / 6%);
}

.ticket-page__header {
  display: flex;
  flex: none;
  gap: 20px;
  align-items: center;
  justify-content: space-between;
  min-height: 84px;
  padding: 15px 22px;
  color: #fff;
  background: linear-gradient(125deg, #073a33 0%, #0b6e65 66%, #178f7b 100%);
  border-radius: 24px 24px 0 0;
  box-shadow: 0 10px 30px rgb(7 71 60 / 14%);
}

.ticket-page__heading {
  display: flex;
  gap: 14px;
  align-items: center;
}

.ticket-page__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  font-size: 24px;
  color: #c9fff2;
  background: rgb(124 238 208 / 18%);
  border-radius: 14px;
}

.ticket-page__eyebrow {
  font-size: 10px;
  font-weight: 800;
  color: #74c8b5;
  letter-spacing: 0.14em;
}

.ticket-page__header h1 {
  margin: 6px 0 4px;
  font-size: 22px;
  font-weight: 800;
}

.ticket-page__header p {
  margin: 0;
  font-size: 12px;
  color: rgb(255 255 255 / 72%);
}

.ticket-page__body {
  flex: 1;
  min-height: 0;
  padding: 18px;
  overflow: auto;
}

.filter-card {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin-bottom: 12px;
  background: #fff;
  border: 1px solid #e4edea;
  border-radius: 14px;
}

.filter-card__row {
  display: flex;
  flex: 1;
  align-items: center;
}

.filter-card__row--right {
  flex: none;
  gap: 10px;
}

.table-card {
  padding: 12px 16px;
  background: #fff;
  border: 1px solid #e4edea;
  border-radius: 14px;
}

.cell-actions {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.sla-text {
  font-size: 12px;
  font-weight: 600;
  color: #0b6e65;
}

.sla-text.is-warn {
  color: #e0a32e;
}

.sla-text.is-danger {
  color: #d4541f;
}

:deep(.ticket-tabs .ant-tabs-nav) {
  margin-bottom: 0;
}

:deep(.ant-table-thead > tr > th) {
  font-size: 12px;
  font-weight: 600;
  color: #315e55;
  background: #f6fbf9;
  border-bottom: 1px solid #e4edea;
}

:deep(.ant-table-tbody > tr > td) {
  font-size: 12px;
  color: #536b65;
  border-bottom: 1px solid #eef5f2;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background: #f8fdfa;
}

:deep(.ant-tag) {
  margin: 0;
}

/* 工单详情弹窗 */
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  margin-bottom: 16px;
  border-bottom: 1px solid #eef5f2;
}

.detail-header__left {
  display: flex;
  gap: 8px;
}

.detail-code {
  font-family: SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 14px;
  font-weight: 700;
  color: #0b6e65;
}

.detail-desc {
  margin-bottom: 18px;
}

.detail-section {
  margin-top: 18px;
}

.detail-section__title {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 700;
  color: #0c4a3f;
}

.detail-timeline {
  padding-left: 6px;
}

.timeline-item {
  display: grid;
  gap: 4px;
  padding-bottom: 4px;
}

.timeline-item__head {
  display: flex;
  gap: 10px;
  align-items: center;
}

.timeline-item__action {
  font-size: 13px;
  font-weight: 700;
  color: #0c4a3f;
}

.timeline-item__time {
  font-size: 11px;
  color: #71867f;
}

.timeline-item__summary {
  font-size: 12px;
  color: #1f3b34;
}

.timeline-item__meta {
  display: flex;
  gap: 16px;
  font-size: 11px;
  color: #71867f;
}

.transfer-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.transfer-item {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  font-size: 12px;
  color: #1f3b34;
  background: #f6fbf9;
  border: 1px solid #e4edea;
  border-radius: 8px;
}

.transfer-item__from {
  font-weight: 600;
  color: #315e55;
}

.transfer-item__to {
  font-weight: 700;
  color: #0b6e65;
}

.transfer-item__time {
  margin-left: auto;
  color: #71867f;
}

.transfer-item__reason {
  color: #71867f;
}
</style>
