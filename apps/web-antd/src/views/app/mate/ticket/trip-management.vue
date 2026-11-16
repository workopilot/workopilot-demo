<script setup lang="ts">
import type { TableColumnType } from 'ant-design-vue';

import type {
  TicketAttachment,
  TripCompletion,
  TripOrder,
  WorkOrder,
} from '#/types/ticket';

import { computed, reactive, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Card,
  DatePicker,
  Drawer,
  Form,
  FormItem,
  Input,
  message,
  Select,
  Table,
  Tabs,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  cloneTripOrders,
  createTripApi,
  CURRENT_USER,
  deleteTripApi,
  engineers,
  mockTripOrders,
  mockWorkOrders,
  ticketPriorityLabel,
  tripSlotOptions,
  tripStatusColor,
  tripStatusLabel,
  updateTripApi,
} from '#/api/mock-data-ticket';

// ==================== Tab 切换 ====================

const activeTab = ref<'pending' | 'trips'>('pending');

// ==================== 待建行程工单 ====================

/** 待建工单列表：标记上门 + 运维工单 + 未被加入任何行程 */
const pendingOrders = ref<WorkOrder[]>([]);

function loadPendingOrders() {
  // 已被加入行程单的工单 ID 集合（基于源数组，避免重复加入）
  const usedWoIds = new Set(mockTripOrders.flatMap((t) => t.workOrderIds));
  pendingOrders.value = mockWorkOrders
    .filter(
      (wo) =>
        wo.onSiteRequired === true &&
        wo.scenario === '运维工单' &&
        !usedWoIds.has(wo.id),
    )
    .map((wo) => ({
      ...wo,
      timeline: wo.timeline ? [...wo.timeline] : [],
    }));
}

loadPendingOrders();

// ==================== 行间选择 ====================

const selectedWoIds = ref<string[]>([]);
const selectedCount = computed(() => selectedWoIds.value.length);

const pendingColumns = computed<TableColumnType<WorkOrder>[]>(() => [
  { title: '工单号', dataIndex: 'code', key: 'code', width: 140 },
  { title: '标题', dataIndex: 'title', key: 'title' },
  { title: '客户', dataIndex: 'customer', key: 'customer', width: 140 },
  {
    title: '客户所在城市/区域',
    dataIndex: 'customerLocation',
    key: 'customerLocation',
    width: 150,
  },
  { title: '设备', dataIndex: 'device', key: 'device', width: 180 },
  { title: '优先级', dataIndex: 'priority', key: 'priority', width: 90 },
  {
    title: 'SLA 剩余',
    dataIndex: 'slaRemaining',
    key: 'slaRemaining',
    width: 160,
  },
  { title: '上门决策人', key: 'onSiteDecisionBy', width: 110 },
  {
    title: '决策时间',
    dataIndex: 'onSiteDecisionAt',
    key: 'onSiteDecisionAt',
    width: 160,
  },
]);

const rowSelection = computed(() => ({
  selectedRowKeys: selectedWoIds.value,
  onChange: (keys: (number | string)[]) => {
    selectedWoIds.value = keys.map(String);
  },
}));

// ==================== 创建行程单 Drawer ====================

const createOpen = ref(false);
const submitting = ref(false);

const form = reactive({
  title: '',
  planDate: '',
  planSlot: '上午',
  ownerId: engineers[0]!.id,
  remark: '',
});

/** 行程负责人下拉选项 */
const ownerOptions = engineers.map((e) => ({
  label: `${e.name}（${e.role}）`,
  value: e.id,
}));

/** DatePicker v-model:value（dayjs）↔ form.planDate（字符串） */
const planDateModel = computed<dayjs.Dayjs | undefined>({
  get: () => (form.planDate ? dayjs(form.planDate) : undefined),
  set: (val) => {
    form.planDate = val ? val.format('YYYY-MM-DD') : '';
  },
});

function openCreateDrawer() {
  if (selectedWoIds.value.length === 0) {
    message.warning('请至少选择 1 张工单');
    return;
  }
  form.title = '';
  form.planDate = '';
  form.planSlot = '上午';
  form.ownerId = engineers[0]!.id;
  form.remark = '';
  createOpen.value = true;
}

async function submitCreate() {
  if (!form.title.trim()) {
    message.warning('请填写行程标题');
    return;
  }
  if (!form.planDate) {
    message.warning('请选择计划上门日期');
    return;
  }
  const owner = engineers.find((e) => e.id === form.ownerId);
  if (!owner) {
    message.warning('请选择行程负责人');
    return;
  }
  submitting.value = true;
  try {
    const res = await createTripApi({
      title: form.title.trim(),
      workOrderIds: [...selectedWoIds.value],
      owner: owner.name,
      ownerId: owner.id,
      planDate: form.planDate,
      planSlot: form.planSlot,
      remark: form.remark.trim() || undefined,
      status: 'planned',
    });
    const trip = res.data;
    const now = dayjs().format('YYYY-MM-DD HH:mm');
    // 回写工单 timeline
    selectedWoIds.value.forEach((woId) => {
      const wo = mockWorkOrders.find((w) => w.id === woId);
      if (wo) {
        if (!wo.timeline) wo.timeline = [];
        wo.timeline.push({
          id: `tl-${wo.id}-trip-${trip.id}`,
          action: 'dispatched',
          time: now,
          operator: owner.name,
          operatorId: owner.id,
          summary: `已加入行程单 ${trip.code}`,
          extra: { tripId: trip.id, tripCode: trip.code },
        });
      }
    });
    message.success(`行程单 ${trip.code} 创建成功`);
    createOpen.value = false;
    selectedWoIds.value = [];
    loadPendingOrders();
    loadTrips();
    activeTab.value = 'trips';
  } catch (error) {
    message.error(
      `创建行程单失败：${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    submitting.value = false;
  }
}

// ==================== 已建行程单 ====================

const trips = ref<TripOrder[]>([]);

function loadTrips() {
  trips.value = cloneTripOrders();
}

loadTrips();

function canStart(t: Record<string, any> | TripOrder) {
  return t.status === 'draft' || t.status === 'planned';
}
function canComplete(t: Record<string, any> | TripOrder) {
  return t.status === 'ongoing';
}
function canCancel(t: Record<string, any> | TripOrder) {
  return (
    t.status === 'draft' || t.status === 'planned' || t.status === 'ongoing'
  );
}

const innerWoColumns: TableColumnType<WorkOrder>[] = [
  { title: '工单号', dataIndex: 'code', key: 'code', width: 140 },
  { title: '标题', dataIndex: 'title', key: 'title' },
  { title: '客户', dataIndex: 'customer', key: 'customer', width: 140 },
  { title: '设备', dataIndex: 'device', key: 'device', width: 200 },
  { title: '优先级', key: 'priority', width: 90 },
  { title: '状态', key: 'status', width: 110 },
];

const tripColumns = computed<TableColumnType<TripOrder>[]>(() => [
  { title: '行程号', dataIndex: 'code', key: 'code', width: 140 },
  { title: '标题', dataIndex: 'title', key: 'title' },
  { title: '负责人', dataIndex: 'owner', key: 'owner', width: 110 },
  { title: '计划日期', dataIndex: 'planDate', key: 'planDate', width: 120 },
  { title: '时段', dataIndex: 'planSlot', key: 'planSlot', width: 90 },
  { title: '状态', key: 'status', width: 110 },
  { title: '工单数', key: 'count', width: 90, align: 'center' },
  { title: '操作', key: 'action', width: 240, fixed: 'right' },
]);

/** 获取行程内工单列表 */
function getTripWorkOrders(trip: Record<string, any> | TripOrder): WorkOrder[] {
  const ids: string[] = trip.workOrderIds || [];
  return mockWorkOrders.filter((wo) => ids.includes(wo.id));
}

/** 优先级 → Tag color */
function priorityColor(p: string | WorkOrder['priority']) {
  switch (p) {
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

function priorityLabel(p: string | WorkOrder['priority']) {
  return (ticketPriorityLabel as Record<string, string>)[p as string] ?? p;
}

function tripLabel(s: string | TripOrder['status']) {
  return (tripStatusLabel as Record<string, string>)[s as string] ?? s;
}

function tripColor(s: string | TripOrder['status']) {
  return (tripStatusColor as Record<string, string>)[s as string] ?? 'default';
}

// ==================== 执行行程单：填写关联工单信息与必须验收资料 ====================

interface WoExecuteForm {
  workOrderId: string;
  workOrderCode: string;
  title: string;
  /** 关联工单处理说明（必填） */
  handledNote: string;
  /** 必须验收资料说明（完成时必填或上传附件） */
  acceptanceNote: string;
  /** 模拟上传的验收资料附件 */
  attachments: { id: string; name: string }[];
}

const executeOpen = ref(false);
const executeMode = ref<'complete' | 'start'>('start');
const executeTrip = ref<null | TripOrder>(null);
const executeSummary = ref('');
const woExecuteForms = ref<WoExecuteForm[]>([]);
const executeSubmitting = ref(false);

function openExecute(trip: TripOrder, mode: 'complete' | 'start') {
  executeTrip.value = trip;
  executeMode.value = mode;
  executeSummary.value = '';
  woExecuteForms.value = getTripWorkOrders(trip).map((wo) => ({
    workOrderId: wo.id,
    workOrderCode: wo.code,
    title: wo.title,
    handledNote: '',
    acceptanceNote: '',
    attachments: [],
  }));
  executeOpen.value = true;
}

function mockAddAttachment(form: WoExecuteForm) {
  form.attachments.push({
    id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: `验收资料-${form.attachments.length + 1}.jpg`,
  });
}

function mockRemoveAttachment(form: WoExecuteForm, idx: number) {
  form.attachments.splice(idx, 1);
}

async function submitExecute() {
  if (!executeTrip.value) return;
  const trip = executeTrip.value;
  const mode = executeMode.value;

  for (const f of woExecuteForms.value) {
    if (!f.handledNote.trim()) {
      message.warning(`请填写工单 ${f.workOrderCode} 的处理说明`);
      return;
    }
    if (
      mode === 'complete' &&
      !f.acceptanceNote.trim() &&
      f.attachments.length === 0
    ) {
      message.warning(`请补充工单 ${f.workOrderCode} 的必须验收资料`);
      return;
    }
  }
  if (mode === 'complete' && executeSummary.value.trim().length < 10) {
    message.warning('行程总结不少于 10 个字');
    return;
  }

  executeSubmitting.value = true;
  try {
    const targetStatus = mode === 'start' ? 'ongoing' : 'completed';
    const now = dayjs().format('YYYY-MM-DD HH:mm');

    const woMarks = woExecuteForms.value.map((f) => ({
      workOrderId: f.workOrderId,
      workOrderCode: f.workOrderCode,
      status: 'ok' as const,
      handledNote: f.handledNote,
      attachments: f.attachments as unknown as TicketAttachment[],
    }));

    const completion: TripCompletion | undefined =
      mode === 'complete'
        ? {
            summary: executeSummary.value.trim(),
            attachments: [],
            woMarks,
            submittedAt: now,
          }
        : undefined;

    await updateTripApi(trip.id, {
      status: targetStatus,
      completion,
    });

    // 回写每张关联工单的 timeline 与验收资料
    woExecuteForms.value.forEach((f) => {
      const wo = mockWorkOrders.find((w) => w.id === f.workOrderId);
      if (!wo) return;
      if (!wo.timeline) wo.timeline = [];
      wo.timeline.push({
        id: `tl-${wo.id}-trip-${trip.id}-${mode}`,
        action: mode === 'complete' ? 'completed' : 'started',
        time: now,
        operator: CURRENT_USER.name,
        operatorId: CURRENT_USER.id,
        summary:
          mode === 'complete'
            ? `行程单 ${trip.code} 执行完成：${f.handledNote}`
            : `行程单 ${trip.code} 开始执行：${f.handledNote}`,
        extra: { tripId: trip.id, tripCode: trip.code },
      });
      if (mode === 'complete') {
        wo.solution = (wo.solution ? `${wo.solution}\n` : '') + f.handledNote;
        if (!wo.acceptanceAttachments) wo.acceptanceAttachments = [];
        wo.acceptanceAttachments.push(
          ...f.attachments.map((a) => ({
            ...a,
            type: 'image' as const,
            size: '—',
            uploader: CURRENT_USER.name,
            uploaderId: CURRENT_USER.id,
            uploadedAt: now,
          })),
        );
        wo.completedAt = now;
      }
    });

    message.success(
      mode === 'complete'
        ? `行程单 ${trip.code} 已完成，验收资料已回写工单`
        : `行程单 ${trip.code} 已开始执行`,
    );
    executeOpen.value = false;
    loadTrips();
    loadPendingOrders();
  } catch (error) {
    message.error(
      `提交失败：${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    executeSubmitting.value = false;
  }
}

async function cancelTrip(trip: Record<string, any> | TripOrder) {
  try {
    await updateTripApi(trip.id, { status: 'cancelled' });
    message.success(`行程单 ${trip.code} 已取消`);
    loadTrips();
  } catch (error) {
    message.error(
      `更新失败：${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function removeTrip(trip: Record<string, any> | TripOrder) {
  try {
    await deleteTripApi(trip.id);
    message.success(`行程单 ${trip.code} 已删除`);
    loadPendingOrders();
    loadTrips();
  } catch (error) {
    message.error(
      `删除失败：${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
</script>

<template>
  <section class="trip-page">
    <!-- 顶部标题区 -->
    <header class="trip-page__header">
      <div class="trip-page__heading">
        <span class="trip-page__icon">
          <Icon icon="lucide:route" />
        </span>
        <div>
          <span class="trip-page__eyebrow">TRIP MANAGEMENT</span>
          <h1>行程管理</h1>
          <p>将标记上门的运维工单合并为行程单，跟踪行程执行。</p>
        </div>
      </div>
    </header>

    <Card class="trip-page__body" :bordered="false">
      <Tabs v-model:active-key="activeTab">
        <!-- ===== 待建行程工单 ===== -->
        <Tabs.TabPane key="pending" tab="待建行程工单">
          <div class="trip-toolbar">
            <div class="trip-toolbar__left">
              <Icon icon="lucide:list-checks" class="size-4" />
              <span>共 {{ pendingOrders.length }} 张待建工单</span>
            </div>
            <div class="trip-toolbar__right">
              <span class="trip-toolbar__selected">
                已选 {{ selectedCount }} 张
              </span>
              <Button
                type="primary"
                :disabled="selectedCount === 0"
                @click="openCreateDrawer"
              >
                <Icon icon="lucide:plus" class="mr-1 inline-block size-4" />
                创建行程单
              </Button>
            </div>
          </div>

          <Table
            :columns="pendingColumns"
            :data-source="pendingOrders"
            :row-selection="rowSelection"
            row-key="id"
            :pagination="{ pageSize: 10, showSizeChanger: false }"
            size="middle"
            bordered
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'priority'">
                <Tag :color="priorityColor(record.priority)">
                  {{ priorityLabel(record.priority) }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'onSiteDecisionBy'">
                {{ record.onSiteDecisionBy || '—' }}
              </template>
            </template>
          </Table>
        </Tabs.TabPane>

        <!-- ===== 已建行程单 ===== -->
        <Tabs.TabPane key="trips" tab="已建行程单">
          <Table
            :columns="tripColumns"
            :data-source="trips"
            row-key="id"
            :pagination="{ pageSize: 10, showSizeChanger: false }"
            size="middle"
            bordered
            :expand-column-width="48"
          >
            <template #expandedRowRender="{ record }">
              <div class="trip-expand">
                <div class="trip-expand__meta">
                  <span>
                    <Icon icon="lucide:user" class="mr-1 inline-block size-3" />
                    负责人：{{ record.owner }}
                  </span>
                  <span>
                    <Icon
                      icon="lucide:calendar"
                      class="mr-1 inline-block size-3"
                    />
                    计划：{{ record.planDate }} {{ record.planSlot }}
                  </span>
                  <span v-if="record.remark">
                    <Icon
                      icon="lucide:sticky-note"
                      class="mr-1 inline-block size-3"
                    />
                    {{ record.remark }}
                  </span>
                  <span v-if="record.completedAt">
                    完成时间：{{ record.completedAt }}
                  </span>
                </div>
                <Table
                  :columns="innerWoColumns"
                  :data-source="getTripWorkOrders(record)"
                  row-key="id"
                  :pagination="false"
                  size="small"
                  bordered
                  class="mt-2"
                >
                  <template #bodyCell="{ column, record: wo }">
                    <template v-if="column.key === 'priority'">
                      <Tag :color="priorityColor(wo.priority)">
                        {{ priorityLabel(wo.priority) }}
                      </Tag>
                    </template>
                  </template>
                </Table>
              </div>
            </template>
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <Tag :color="tripColor(record.status)">
                  {{ tripLabel(record.status) }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'count'">
                {{ record.workOrderIds.length }}
              </template>
              <template v-else-if="column.key === 'action'">
                <div class="trip-actions">
                  <Button
                    v-if="canStart(record)"
                    type="primary"
                    size="small"
                    @click="openExecute(record as TripOrder, 'start')"
                  >
                    开始执行
                  </Button>
                  <Button
                    v-if="canComplete(record)"
                    type="primary"
                    size="small"
                    @click="openExecute(record as TripOrder, 'complete')"
                  >
                    完成
                  </Button>
                  <Button
                    v-if="canCancel(record)"
                    size="small"
                    danger
                    @click="cancelTrip(record)"
                  >
                    取消
                  </Button>
                  <Button size="small" @click="removeTrip(record)">删除</Button>
                </div>
              </template>
            </template>
          </Table>
        </Tabs.TabPane>
      </Tabs>
    </Card>

    <!-- 创建行程单 Drawer -->
    <Drawer
      v-model:open="createOpen"
      title="创建行程单"
      width="560px"
      :footer="null"
      :mask-closable="false"
    >
      <Form layout="vertical" class="trip-form">
        <FormItem label="行程标题" required>
          <Input
            v-model:value="form.title"
            placeholder="例如：上海·华达 + 中粮·上门行程"
            :maxlength="60"
          />
        </FormItem>
        <FormItem label="计划上门日期" required>
          <DatePicker
            v-model:value="planDateModel"
            class="w-full"
            value-format="YYYY-MM-DD"
            placeholder="选择计划上门日期"
          />
        </FormItem>
        <FormItem label="计划时段" required>
          <Select
            v-model:value="form.planSlot"
            :options="tripSlotOptions"
            placeholder="选择计划时段"
          />
        </FormItem>
        <FormItem label="行程负责人" required>
          <Select
            v-model:value="form.ownerId"
            :options="ownerOptions"
            placeholder="选择行程负责人"
          />
        </FormItem>
        <FormItem label="备注">
          <Input.TextArea
            v-model:value="form.remark"
            :rows="3"
            :maxlength="200"
            placeholder="行程说明 / 路线规划 / 注意事项（可选）"
          />
        </FormItem>
        <div class="flex justify-end gap-2 pt-2">
          <Button @click="createOpen = false">取消</Button>
          <Button type="primary" :loading="submitting" @click="submitCreate">
            创建
          </Button>
        </div>
      </Form>
    </Drawer>

    <!-- 执行行程单 Drawer：填写关联工单信息 + 必须验收资料 -->
    <Drawer
      v-model:open="executeOpen"
      :title="
        executeMode === 'complete'
          ? '完成行程单 · 填写验收资料'
          : '开始执行行程单'
      "
      width="640px"
      :footer="null"
      :mask-closable="false"
    >
      <Form layout="vertical" class="trip-form">
        <div class="trip-execute__head">
          <div>
            <div class="trip-execute__code">{{ executeTrip?.code }}</div>
            <div class="trip-execute__title">{{ executeTrip?.title }}</div>
          </div>
          <Tag v-if="executeMode === 'complete'" color="green">完成验收</Tag>
          <Tag v-else color="processing">开始执行</Tag>
        </div>

        <FormItem
          v-if="executeMode === 'complete'"
          label="行程总结"
          required
          extra="不少于 10 个字，将作为关联工单的统一闭环处理说明回写"
        >
          <Input.TextArea
            v-model:value="executeSummary"
            :rows="2"
            :maxlength="200"
            placeholder="例如：本次上门完成华达 A1 加热模组更换与中粮 B2 伺服参数校准，复测全部达标。"
          />
        </FormItem>

        <div class="trip-execute__section-title">
          关联工单处理信息（{{ woExecuteForms.length }} 张）
        </div>

        <div
          v-for="woForm in woExecuteForms"
          :key="woForm.workOrderId"
          class="trip-execute__wo"
        >
          <div class="trip-execute__wo-head">
            <span class="trip-execute__wo-code">
              {{ woForm.workOrderCode }}
            </span>
            <span class="trip-execute__wo-title">{{ woForm.title }}</span>
          </div>

          <FormItem label="关联工单处理说明" required>
            <Input.TextArea
              v-model:value="woForm.handledNote"
              :rows="2"
              :maxlength="300"
              placeholder="请填写本工单的现场处理情况 / 处置结果"
            />
          </FormItem>

          <template v-if="executeMode === 'complete'">
            <FormItem
              label="必须验收资料"
              required
              extra="可填写验收资料说明，或上传现场复测附件"
            >
              <Input.TextArea
                v-model:value="woForm.acceptanceNote"
                :rows="2"
                :maxlength="300"
                placeholder="例如：现场连跑 4 小时识别成功率 99.7%，客户签字确认。"
              />
              <div class="trip-execute__attachments">
                <div
                  v-for="(att, ai) in woForm.attachments"
                  :key="att.id"
                  class="trip-execute__att"
                >
                  <Icon icon="lucide:paperclip" class="size-3" />
                  <span>{{ att.name }}</span>
                  <Button
                    type="text"
                    size="small"
                    danger
                    @click="mockRemoveAttachment(woForm, ai)"
                  >
                    移除
                  </Button>
                </div>
                <Button
                  size="small"
                  type="dashed"
                  @click="mockAddAttachment(woForm)"
                >
                  <Icon icon="lucide:upload" class="mr-1 inline-block size-3" />
                  上传验收资料（模拟）
                </Button>
              </div>
            </FormItem>
          </template>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <Button @click="executeOpen = false">取消</Button>
          <Button
            type="primary"
            :loading="executeSubmitting"
            @click="submitExecute"
          >
            {{ executeMode === 'complete' ? '提交完成' : '开始执行' }}
          </Button>
        </div>
      </Form>
    </Drawer>
  </section>
</template>

<style scoped>
.trip-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 20px 24px 24px;
  overflow: auto;
  scrollbar-gutter: stable;
}

.trip-page__header {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 22px 26px;
  color: #fff;
  background: linear-gradient(125deg, #073a33, #0b6e65 66%, #178f7b);
  border-radius: 18px;
  box-shadow: 0 15px 36px #07473c2e;
}

.trip-page__heading {
  display: flex;
  gap: 14px;
  align-items: center;
}

.trip-page__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  font-size: 24px;
  color: #c9fff2;
  background: #7ceed02e;
  border-radius: 14px;
}

.trip-page__eyebrow {
  font-size: 10px;
  font-weight: 800;
  color: #74c8b5;
  letter-spacing: 0.14em;
}

.trip-page__header h1 {
  margin: 6px 0 4px;
  font-size: 22px;
  font-weight: 800;
}

.trip-page__header p {
  margin: 0;
  font-size: 12px;
  color: #ffffffb8;
}

.trip-page__body,
.trip-page__body :deep(.ant-card-body) {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.trip-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  margin-bottom: 12px;
  background: #f6fbf9;
  border: 1px solid #dce9e4;
  border-radius: 10px;
}

.trip-toolbar__left {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;
  color: #0b6e65;
}

.trip-toolbar__right {
  display: inline-flex;
  gap: 12px;
  align-items: center;
}

.trip-toolbar__selected {
  font-size: 13px;
  font-weight: 600;
  color: #5b9d8e;
}

.trip-expand {
  padding: 6px 8px 8px;
  background: #f9fbfa;
}

.trip-expand__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 8px;
  font-size: 12px;
  color: #4a5568;
}

.trip-actions {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
}

.trip-form {
  padding-top: 8px;
}

/* ============ 执行行程单 Drawer ============ */
.trip-execute__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  margin-bottom: 12px;
  background: #f6fbf9;
  border: 1px solid #dce9e4;
  border-radius: 8px;
}

.trip-execute__code {
  font-size: 13px;
  font-weight: 700;
  color: #0b6e65;
}

.trip-execute__title {
  margin-top: 2px;
  font-size: 12px;
  color: #4a6b62;
}

.trip-execute__section-title {
  margin: 16px 0 8px;
  font-size: 12px;
  font-weight: 700;
  color: #0c4a3f;
}

.trip-execute__wo {
  padding: 10px 12px;
  margin-bottom: 10px;
  background: #fff;
  border: 1px solid #e1ece7;
  border-radius: 8px;
}

.trip-execute__wo-head {
  display: flex;
  gap: 8px;
  align-items: baseline;
  margin-bottom: 6px;
}

.trip-execute__wo-code {
  font-weight: 700;
  color: #0b6e65;
}

.trip-execute__wo-title {
  font-size: 12px;
  color: #5a756d;
}

.trip-execute__attachments {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 6px;
}

.trip-execute__att {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 4px 8px;
  font-size: 12px;
  color: #4a6b62;
  background: #f1f7f4;
  border-radius: 4px;
}

.trip-execute__att :deep(.ant-btn) {
  margin-left: auto;
}
</style>
