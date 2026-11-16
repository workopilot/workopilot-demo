<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import type {
  TicketAttachment,
  TicketAttachmentType,
  TicketPriority,
  TicketTimelineEvent,
  WorkOrder,
} from '#/types/ticket';

import { computed, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Icon } from '@iconify/vue';
import {
  Alert,
  Button,
  DatePicker,
  Drawer,
  Form,
  Input,
  message,
  Pagination,
  Radio,
  Select,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  CURRENT_USER,
  getFlowNode,
  mockDevices,
  mockFlowGraph,
  mockWorkOrders,
  slaStatusLabel,
  ticketPriorityLabel,
  ticketStatusLabel,
} from '#/api/mock-data-ticket';

import TicketAiDetail from './components/ticket-ai-detail.vue';
import TicketDetailCase from './components/ticket-detail-case.vue';
import InspectionOrderDrawer from './modals/inspection-order-drawer.vue';

const route = useRoute();

/** 当前数字员工 ID（用于区分售后客服与工程师视角） */
const employeeId = computed(() => String(route.params.employeeId || ''));

/** 售后客服视角：客户查询自己的报修记录 */
const isCustomerView = computed(
  () => employeeId.value === 'after-sales-service',
);

const activeTab = ref<'assigned' | 'created'>('assigned');
const inspectionOrderOpen = ref(false);
const inspectionOrderCode = ref('');
const inspectionVersion = ref(0);

const createdOrders = computed(() => {
  // 引用巡检版本号，使工单列表在巡检数据变化后重新计算
  void inspectionVersion.value;
  return mockWorkOrders.filter((item) => item.creatorId === CURRENT_USER.id);
});
const assignedOrders = computed(() => {
  // 引用巡检版本号，使工单列表在巡检数据变化后重新计算
  void inspectionVersion.value;
  return mockWorkOrders.filter(
    (item) =>
      item.assigneeId === CURRENT_USER.id &&
      item.status !== 'completed' &&
      item.status !== 'closed' &&
      item.status !== 'cancelled',
  );
});

// 员工视角筛选：v-model 临时状态 + 应用后的状态
const filterInput = reactive({
  type: undefined as string | undefined,
  status: undefined as undefined | WorkOrder['status'],
  slaStatus: undefined as undefined | WorkOrder['slaStatus'],
  keyword: '',
});
const filterApplied = ref({
  type: undefined as string | undefined,
  status: undefined as undefined | WorkOrder['status'],
  slaStatus: undefined as undefined | WorkOrder['slaStatus'],
  keyword: '',
});

function applyFilter() {
  filterApplied.value = {
    type: filterInput.type,
    status: filterInput.status,
    slaStatus: filterInput.slaStatus,
    keyword: filterInput.keyword.trim().toLowerCase(),
  };
}

/** 统计卡片点击筛选：切换查看范围 / 快捷筛选 */
function selectScope(scope: 'assigned' | 'created') {
  activeTab.value = scope;
  filterInput.status = undefined;
  filterInput.slaStatus = undefined;
  applyFilter();
}

function selectQuick(kind: 'breached' | 'processing') {
  activeTab.value = 'assigned';
  filterInput.status = kind === 'processing' ? 'processing' : undefined;
  filterInput.slaStatus = kind === 'breached' ? 'breached' : undefined;
  applyFilter();
}

/** 当前高亮的统计卡片 */
const activeStat = computed(() => {
  if (activeTab.value === 'created') return 'created';
  if (filterApplied.value.status === 'processing') return 'processing';
  if (filterApplied.value.slaStatus === 'breached') return 'breached';
  return 'assigned';
});

// 工单状态选项（label/value）— 仅包含员工视角常遇到的几个状态
const statusOptions = Object.entries(ticketStatusLabel).map(
  ([value, label]) => ({ label, value }),
);

const list = computed(() => {
  const source =
    activeTab.value === 'created' ? createdOrders.value : assignedOrders.value;
  const { keyword, status, type, slaStatus } = filterApplied.value;
  return source.filter((item) => {
    if (type && item.type !== type) return false;
    if (status && item.status !== status) return false;
    if (slaStatus && item.slaStatus !== slaStatus) return false;
    if (
      keyword &&
      !`${item.code} ${item.title} ${item.customer || ''} ${item.device || ''}`
        .toLowerCase()
        .includes(keyword)
    ) {
      return false;
    }
    return true;
  });
});

const stats = computed(() => ({
  created: createdOrders.value.length,
  assigned: assignedOrders.value.length,
  processing: assignedOrders.value.filter(
    (item) => item.status === 'processing',
  ).length,
  breached: assignedOrders.value.filter((item) => item.slaStatus === 'breached')
    .length,
}));

// ---------- 列表分页（默认每页 10 条） ----------
const pageSize = 10;
const currentPage = ref(1);

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return list.value.slice(start, start + pageSize);
});

// 切换 tab 或筛选条件变化时回到第一页
watch([activeTab, filterApplied], () => {
  currentPage.value = 1;
});

// ---------- 工单详情（工程师/派单助理视图页面化，客户视图仍用抽屉） ----------
const detailDrawerOpen = ref(false);
const detailId = ref('');
const detail = computed(() =>
  mockWorkOrders.find((item) => item.id === detailId.value),
);

function openDetail(id: string) {
  const order = mockWorkOrders.find((item) => item.id === id);
  if (order?.inspection) {
    inspectionOrderCode.value = order.code;
    inspectionOrderOpen.value = true;
    return;
  }
  detailId.value = id;
  if (isCustomerView.value) detailDrawerOpen.value = true;
}

function closeDetail() {
  detailId.value = '';
}

/** 详情页上一单 / 下一单（基于当前筛选后的列表顺序） */
const detailIndex = computed(() =>
  list.value.findIndex((item) => item.id === detailId.value),
);
const prevOrder = computed(() =>
  detailIndex.value > 0 ? list.value[detailIndex.value - 1] : undefined,
);
const nextOrder = computed(() =>
  detailIndex.value >= 0 && detailIndex.value < list.value.length - 1
    ? list.value[detailIndex.value + 1]
    : undefined,
);
function gotoOrder(order?: WorkOrder) {
  if (order) detailId.value = order.id;
}

function attachmentTypeIcon(type: TicketAttachmentType) {
  switch (type) {
    case 'audio':
    case 'recording': {
      return 'lucide:mic';
    }
    case 'image':
    case 'screenshot': {
      return 'lucide:image';
    }
    case 'video': {
      return 'lucide:film';
    }
    default: {
      return 'lucide:file-text';
    }
  }
}

function attachmentTypeLabel(type: TicketAttachmentType) {
  switch (type) {
    case 'audio': {
      return '音频';
    }
    case 'image': {
      return '图片';
    }
    case 'recording': {
      return '现场录音';
    }
    case 'screenshot': {
      return '截图';
    }
    case 'video': {
      return '视频';
    }
    default: {
      return '文档';
    }
  }
}

/** 给工单追加一条流转事件 */
function pushTimeline(
  order: { timeline?: TicketTimelineEvent[] },
  event: Omit<TicketTimelineEvent, 'id'>,
) {
  const tl: TicketTimelineEvent = {
    id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ...event,
  };
  if (!order.timeline) order.timeline = [];
  order.timeline.push(tl);
}

/** 当前时间的展示字符串 */
function nowLabel() {
  return new Date().toISOString().replace('T', ' ').slice(0, 16);
}

// ---------- 流程图节点（运维工单 currentNodeId 驱动状态与动作） ----------

/** 是否使用流程图节点状态：运维工单且存在当前节点 */
function useFlowNode(order: WorkOrder) {
  return order.scenario === '运维工单' && !!order.currentNodeId;
}

/** 当前流程节点名称 */
function flowNodeName(order: WorkOrder) {
  if (!useFlowNode(order) || !order.currentNodeId) return '';
  return getFlowNode(mockFlowGraph, order.currentNodeId)?.name ?? '';
}

/** 流程节点对应的 Tag 颜色 */
function flowNodeColor(nodeId?: string) {
  if (!nodeId) return 'default';
  switch (getFlowNode(mockFlowGraph, nodeId)?.colorKey) {
    case 'amber': {
      return 'orange';
    }
    case 'blue': {
      return 'blue';
    }
    case 'coral': {
      return 'red';
    }
    case 'gray': {
      return 'default';
    }
    case 'green': {
      return 'green';
    }
    default: {
      return 'default';
    }
  }
}

// ---------- 创建工单 Drawer ----------
const createDrawerOpen = ref(false);

interface CreateTicketForm {
  title: string;
  type: string;
  deviceCode: string;
  customer: string;
  contact: string;
  phone: string;
  priority: TicketPriority;
  description: string;
}

const createForm = ref<CreateTicketForm>({
  title: '',
  type: '设备故障',
  deviceCode: '',
  customer: '',
  contact: CURRENT_USER.name,
  phone: '',
  priority: 'medium',
  description: '',
});

const createAttachments = ref<TicketAttachment[]>([]);

function openCreate() {
  createForm.value = {
    title: '',
    type: '设备故障',
    deviceCode: '',
    customer: '',
    contact: CURRENT_USER.name,
    phone: '',
    priority: 'medium',
    description: '',
  };
  createAttachments.value = [];
  createDrawerOpen.value = true;
}

/** 选择设备后自动带出客户与位置信息（仅 demo） */
function onDeviceSelected(value: unknown) {
  const code = String(value || '');
  const device = mockDevices.find((d) => d.code === code);
  if (device) {
    createForm.value.customer = device.customer;
    if (!createForm.value.title)
      createForm.value.title = `${device.customer} ${device.name} 现场建单`;
  }
}

function mockUploadAttachments() {
  // 模拟上传，生成一些演示附件记录
  const demo: TicketAttachment[] = [
    {
      id: `att-${Date.now()}-1`,
      name: '现场照片_演示上传.JPG',
      type: 'image',
      size: '1.6 MB',
      uploader: CURRENT_USER.name,
      uploaderId: CURRENT_USER.id,
      uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      note: '由我现场拍摄',
    },
    {
      id: `att-${Date.now()}-2`,
      name: '报错截图_演示上传.png',
      type: 'screenshot',
      size: '420 KB',
      uploader: CURRENT_USER.name,
      uploaderId: CURRENT_USER.id,
      uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      note: 'HMI 显示的报错画面',
    },
  ];
  createAttachments.value.push(...demo);
  message.success('已添加 2 个演示附件（本地 demo，未实际上传）');
}

function removeUploaded(id: string) {
  createAttachments.value = createAttachments.value.filter((a) => a.id !== id);
}

function submitCreateTicket() {
  if (
    !createForm.value.title ||
    !createForm.value.type ||
    !createForm.value.priority ||
    !createForm.value.description
  ) {
    message.warning('请填写标题、类型、优先级和故障描述');
    return;
  }
  const code = `WO-2026-${1012 + mockWorkOrders.length}`;
  const now = new Date();
  now.setDate(now.getDate() + 3);
  const deadline = now.toISOString().replace('T', ' ').slice(0, 16);
  const created = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const newOrder = {
    id: `wo-${Date.now()}`,
    code,
    title: createForm.value.title,
    type: createForm.value.type,
    scenario: '运维工单',
    category: 'internal' as const,
    device: createForm.value.deviceCode
      ? `${
          mockDevices.find((d) => d.code === createForm.value!.deviceCode)?.name
        } (${createForm.value.deviceCode})`
      : undefined,
    customer: createForm.value.customer || undefined,
    contact: createForm.value.contact || undefined,
    phone: createForm.value.phone || undefined,
    priority: createForm.value.priority,
    status: 'pending' as const,
    source: '工单助理',
    creator: CURRENT_USER.name,
    creatorId: CURRENT_USER.id,
    createdAt: created,
    deadline,
    slaStatus: 'normal' as const,
    slaRemaining: '剩余 72 小时',
    description: createForm.value.description,
    attachments:
      createAttachments.value.length > 0
        ? [...createAttachments.value]
        : undefined,
    timeline: [] as TicketTimelineEvent[],
  };
  pushTimeline(newOrder, {
    action: 'created',
    time: created,
    operator: CURRENT_USER.name,
    operatorId: CURRENT_USER.id,
    summary: `${CURRENT_USER.name} 通过工单助理创建工单`,
  });
  mockWorkOrders.unshift(newOrder);
  createDrawerOpen.value = false;
  // 新建完成自动切到「我创建的」
  activeTab.value = 'created';
  message.success(`工单 ${code} 已创建，已进入待派单池`);
}

// ---------- 取消工单（创建人用） ----------
const cancelDrawerOpen = ref(false);
const cancelId = ref('');
const cancelOrder = computed(() =>
  mockWorkOrders.find((item) => item.id === cancelId.value),
);
const cancelForm = ref<{ reason: string }>({ reason: '' });

function openCancel(id: string) {
  const order = mockWorkOrders.find((item) => item.id === id);
  if (!order) return;
  // 只有创建人自己，且状态在待派单/已派单/处理中 可以取消（不影响已完成的闭环）
  if (order.creatorId !== CURRENT_USER.id) {
    message.warning('仅创建人可取消该工单');
    return;
  }
  if (
    order.status !== 'pending' &&
    order.status !== 'dispatched' &&
    order.status !== 'processing'
  ) {
    message.warning('当前状态无法取消工单');
    return;
  }
  cancelId.value = id;
  cancelForm.value = { reason: '' };
  cancelDrawerOpen.value = true;
}

function submitCancelTicket() {
  if (!cancelForm.value.reason || !cancelForm.value.reason.trim()) {
    message.warning('请填写取消原因（便于客服与团队复盘）');
    return;
  }
  const order = cancelOrder.value;
  if (!order) return;
  const t = nowLabel();
  order.status = 'cancelled';
  order.cancelReason = cancelForm.value.reason.trim();
  order.cancelledAt = t;
  order.slaRemaining = '已取消';
  pushTimeline(order, {
    action: 'cancelled',
    time: t,
    operator: CURRENT_USER.name,
    operatorId: CURRENT_USER.id,
    summary: `${CURRENT_USER.name} 主动取消工单`,
    reason: order.cancelReason,
  });
  cancelDrawerOpen.value = false;
  message.success(`${order.code} 已取消`);
}

// ---------- 售后客服：报修记录查询 / 编辑 / 评价 ----------
interface CustomerFilter {
  dateRange: [dayjs.Dayjs, dayjs.Dayjs] | undefined;
  status: string;
  keyword: string;
}

const customerFilter = ref<CustomerFilter>({
  dateRange: undefined,
  status: 'all',
  keyword: '',
});

/** 售后客服可见状态选项 */
const customerStatusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '待派单', value: 'pending' },
  { label: '待接单', value: 'dispatched' },
  { label: '处理中', value: 'processing' },
  { label: '待验收', value: 'pending-acceptance' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
];

/** 当前客户提交的报修记录（按创建时间倒序） */
const customerAllOrders = computed(() =>
  mockWorkOrders
    .filter((item) => item.creatorId === CURRENT_USER.id)
    .toSorted((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
);

/** 按筛选条件过滤后的报修记录 */
const customerFilteredOrders = computed(() => {
  const { dateRange, status, keyword } = customerFilter.value;
  const kw = keyword.trim().toLowerCase();
  return customerAllOrders.value.filter((order) => {
    if (status !== 'all' && order.status !== status) return false;
    if (
      kw &&
      !order.code.toLowerCase().includes(kw) &&
      !order.title.toLowerCase().includes(kw) &&
      !(order.customer || '').toLowerCase().includes(kw) &&
      !(order.device || '').toLowerCase().includes(kw)
    )
      return false;
    if (dateRange && dateRange[0] && dateRange[1]) {
      const created = dayjs(order.createdAt);
      if (
        created.isBefore(dayjs(dateRange[0]).startOf('day')) ||
        created.isAfter(dayjs(dateRange[1]).endOf('day'))
      )
        return false;
    }
    return true;
  });
});

function resetCustomerFilter() {
  customerFilter.value = { dateRange: undefined, status: 'all', keyword: '' };
}

// 编辑报修工单（仅待派单状态可编辑）
const editDrawerOpen = ref(false);
const editId = ref('');
const editOrder = computed(() =>
  mockWorkOrders.find((item) => item.id === editId.value),
);

interface EditTicketForm {
  title: string;
  type: string;
  customer: string;
  contact: string;
  phone: string;
  priority: TicketPriority;
  description: string;
}

const editForm = ref<EditTicketForm>({
  title: '',
  type: '设备故障',
  customer: '',
  contact: '',
  phone: '',
  priority: 'medium',
  description: '',
});

const ticketTypeOptions = [
  '设备故障',
  '定期保养',
  '技术咨询',
  '现场复测',
  '配件更换',
];

function openEdit(id: string) {
  const order = mockWorkOrders.find((item) => item.id === id);
  if (!order) return;
  if (order.creatorId !== CURRENT_USER.id) {
    message.warning('仅创建人可编辑工单');
    return;
  }
  if (order.status !== 'pending') {
    message.warning('仅待派单状态的工单可编辑');
    return;
  }
  editId.value = id;
  editForm.value = {
    title: order.title,
    type: order.type,
    customer: order.customer || '',
    contact: order.contact || '',
    phone: order.phone || '',
    priority: order.priority,
    description: order.description,
  };
  editDrawerOpen.value = true;
}

function submitEditTicket() {
  const order = editOrder.value;
  if (!order) return;
  if (
    !editForm.value.title.trim() ||
    !editForm.value.type ||
    !editForm.value.description.trim()
  ) {
    message.warning('请填写标题、类型与故障描述');
    return;
  }
  order.title = editForm.value.title.trim();
  order.type = editForm.value.type;
  order.customer = editForm.value.customer || undefined;
  order.contact = editForm.value.contact || undefined;
  order.phone = editForm.value.phone || undefined;
  order.priority = editForm.value.priority;
  order.description = editForm.value.description.trim();
  const t = nowLabel();
  pushTimeline(order, {
    action: 'note',
    time: t,
    operator: CURRENT_USER.name,
    operatorId: CURRENT_USER.id,
    summary: `${CURRENT_USER.name} 编辑了工单信息（派单前修改）`,
  });
  editDrawerOpen.value = false;
  message.success(`${order.code} 已更新`);
}

// ---------- 验收工单（创建人对待验收工单执行验收操作） ----------
const acceptDrawerOpen = ref(false);
const acceptId = ref('');
const acceptOrder = computed(() =>
  mockWorkOrders.find((item) => item.id === acceptId.value),
);

interface AcceptForm {
  result: 'approved' | 'rejected';
  opinion: string;
}

const acceptForm = ref<AcceptForm>({ result: 'approved', opinion: '' });

function openAccept(id: string, result: 'approved' | 'rejected' = 'approved') {
  const order = mockWorkOrders.find((item) => item.id === id);
  if (!order) return;
  if (order.creatorId !== CURRENT_USER.id) {
    message.warning('仅创建人可验收工单');
    return;
  }
  if (order.status !== 'pending-acceptance') {
    message.warning('仅待验收状态的工单可执行验收');
    return;
  }
  acceptId.value = id;
  acceptForm.value = { result, opinion: '' };
  acceptDrawerOpen.value = true;
}

function submitAcceptTicket() {
  const order = acceptOrder.value;
  if (!order) return;
  const opinion = acceptForm.value.opinion.trim();
  if (acceptForm.value.result === 'rejected' && !opinion) {
    message.warning('验收不通过时请填写退回原因');
    return;
  }
  const t = nowLabel();
  // 流程工单：验收通过 → 已完成；验收不通过 → 待整改（回承办人）
  const inFlow = useFlowNode(order);
  if (acceptForm.value.result === 'approved') {
    if (inFlow) {
      order.currentNodeId = 'fn-8';
      order.status = 'completed';
      order.slaRemaining = '已完成';
      pushTimeline(order, {
        action: 'accepted',
        time: t,
        operator: CURRENT_USER.name,
        operatorId: CURRENT_USER.id,
        summary: `${CURRENT_USER.name} 验收通过，工单处理完成`,
        reason: opinion || undefined,
      });
      acceptDrawerOpen.value = false;
      message.success(`${order.code} 验收通过，工单已完成`);
    } else {
      order.status = 'completed';
      order.slaRemaining = '已按时完成';
      pushTimeline(order, {
        action: 'accepted',
        time: t,
        operator: CURRENT_USER.name,
        operatorId: CURRENT_USER.id,
        summary: `${CURRENT_USER.name} 验收通过，工单处理完成`,
        reason: opinion || undefined,
      });
      acceptDrawerOpen.value = false;
      message.success(`${order.code} 验收通过，工单已完成`);
    }
  } else {
    if (inFlow) order.currentNodeId = 'fn-10';
    order.status = 'processing';
    order.slaRemaining = '验收退回，重新处理中';
    pushTimeline(order, {
      action: 'note',
      time: t,
      operator: CURRENT_USER.name,
      operatorId: CURRENT_USER.id,
      summary: `${CURRENT_USER.name} 验收不通过，工单退回处理人重新处理`,
      reason: opinion,
    });
    acceptDrawerOpen.value = false;
    message.warning(`${order.code} 已退回处理人重新处理`);
  }
}

// 评价工单（验收通过后可评价）
const evaluateDrawerOpen = ref(false);
const evaluateId = ref('');
const evaluateOrder = computed(() =>
  mockWorkOrders.find((item) => item.id === evaluateId.value),
);

interface EvaluateForm {
  rating: number;
  evaluation: string;
}

const evaluateForm = ref<EvaluateForm>({ rating: 5, evaluation: '' });

function openEvaluate(id: string) {
  const order = mockWorkOrders.find((item) => item.id === id);
  if (!order) return;
  if (order.creatorId !== CURRENT_USER.id) {
    message.warning('仅创建人可评价工单');
    return;
  }
  if (order.status !== 'completed') {
    message.warning('仅验收通过（已完成）的工单可评价');
    return;
  }
  if (order.rating) {
    message.warning('该工单已评价过');
    return;
  }
  evaluateId.value = id;
  evaluateForm.value = {
    rating: order.rating || 5,
    evaluation: order.evaluation || '',
  };
  evaluateDrawerOpen.value = true;
}

function submitEvaluateTicket() {
  const order = evaluateOrder.value;
  if (!order) return;
  if (!evaluateForm.value.evaluation || !evaluateForm.value.evaluation.trim()) {
    message.warning('请填写评价内容');
    return;
  }
  const t = nowLabel();
  order.rating = evaluateForm.value.rating;
  order.evaluation = evaluateForm.value.evaluation.trim();
  order.evaluatedAt = t;
  pushTimeline(order, {
    action: 'evaluated',
    time: t,
    operator: CURRENT_USER.name,
    operatorId: CURRENT_USER.id,
    summary: `${CURRENT_USER.name} 完成评价（${'★'.repeat(order.rating)}）`,
    reason: order.evaluation,
  });
  evaluateDrawerOpen.value = false;
  message.success(`${order.code} 已评价，感谢您的反馈`);
}

// ---------- 通用颜色 ----------
function statusColor(status: string) {
  switch (status) {
    case 'cancelled': {
      return 'red';
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

function slaColor(status: string) {
  if (status === 'breached') return 'red';
  if (status === 'paused') return 'default';
  if (status === 'warning') return 'orange';
  return 'green';
}

function priorityColor(priority: string) {
  switch (priority) {
    case 'high': {
      return 'orange';
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
</script>

<template>
  <!-- 售后客服：报修记录查询视图 -->
  <section v-if="isCustomerView" class="ticket-page customer-view">
    <header class="ticket-page__header">
      <div class="ticket-page__heading">
        <span class="ticket-page__icon">
          <Icon icon="lucide:clipboard-list" />
        </span>
        <div>
          <span class="ticket-page__eyebrow">MY REPAIR TICKETS</span>
          <h1>我的报修</h1>
          <p>
            查询我提交的报修记录，支持取消、编辑（派单前）与评价（验收后）。
          </p>
        </div>
      </div>
      <Button type="primary" class="ticket-page__cta" @click="openCreate">
        <Icon icon="lucide:plus" />
        提交报修
      </Button>
    </header>

    <!-- 查询条件 -->
    <section class="customer-filter">
      <div class="customer-filter__row">
        <div class="customer-filter__field">
          <label>提交时间</label>
          <DatePicker.RangePicker
            v-model:value="customerFilter.dateRange"
            format="YYYY-MM-DD"
            :placeholder="['开始日期', '结束日期']"
            allow-clear
          />
        </div>
        <div class="customer-filter__field">
          <label>状态</label>
          <Select
            v-model:value="customerFilter.status"
            style="width: 160px"
            :options="customerStatusOptions"
          />
        </div>
        <div class="customer-filter__field customer-filter__field--grow">
          <label>关键词</label>
          <Input
            v-model:value="customerFilter.keyword"
            placeholder="工单号 / 标题 / 客户 / 设备"
            allow-clear
          >
            <template #prefix>
              <Icon icon="lucide:search" />
            </template>
          </Input>
        </div>
        <div class="customer-filter__actions">
          <Button @click="resetCustomerFilter">
            <Icon icon="lucide:rotate-ccw" />
            重置
          </Button>
        </div>
      </div>
      <div class="customer-filter__summary">
        <span>
          共
          <strong>{{ customerFilteredOrders.length }}</strong>
          条报修记录
        </span>
        <span
          v-if="customerFilter.status !== 'all'"
          class="customer-filter__chip"
        >
          <Icon icon="lucide:filter" />
          {{
            customerStatusOptions.find((o) => o.value === customerFilter.status)
              ?.label
          }}
        </span>
      </div>
    </section>

    <!-- 报修记录表格 -->
    <div class="customer-table">
      <div class="customer-table__head">
        <span>工单</span>
        <span>客户 / 设备</span>
        <span>优先级</span>
        <span>状态</span>
        <span>处理人</span>
        <span>提交时间</span>
        <span>操作</span>
      </div>
      <div
        v-for="order in customerFilteredOrders"
        :key="order.id"
        class="customer-table__row"
        role="button"
        tabindex="0"
        @click="openDetail(order.id)"
        @keydown.enter="openDetail(order.id)"
      >
        <span class="customer-table__main">
          <strong>{{ order.code }}</strong>
          <small>{{ order.title }}</small>
        </span>
        <span>
          <b>{{ order.customer || '—' }}</b>
          <small>{{ order.device || '—' }}</small>
        </span>
        <span>
          <Tag :color="priorityColor(order.priority)">
            {{ ticketPriorityLabel[order.priority] }}
          </Tag>
        </span>
        <span>
          <Tag :color="statusColor(order.status)">
            {{ ticketStatusLabel[order.status] }}
          </Tag>
          <small v-if="order.rating">
            {{ '★'.repeat(order.rating) }}
          </small>
        </span>
        <span>
          <b>{{ order.assignee || '待派单' }}</b>
        </span>
        <span class="customer-table__time">{{ order.createdAt }}</span>
        <span class="customer-table__actions" @click.stop>
          <!-- 待派单：编辑 / 取消 -->
          <template v-if="order.status === 'pending'">
            <Button
              size="small"
              type="primary"
              ghost
              style="margin-right: 4px"
              @click="openEdit(order.id)"
            >
              <Icon icon="lucide:pencil" />
              编辑
            </Button>
            <Button size="small" danger ghost @click="openCancel(order.id)">
              <Icon icon="lucide:x" />
              取消
            </Button>
          </template>
          <!-- 已派单 / 处理中：取消 -->
          <template
            v-else-if="
              order.status === 'dispatched' || order.status === 'processing'
            "
          >
            <Button size="small" danger ghost @click="openCancel(order.id)">
              <Icon icon="lucide:x" />
              取消
            </Button>
          </template>
          <!-- 待验收：验收 -->
          <template v-else-if="order.status === 'pending-acceptance'">
            <Button size="small" type="primary" @click="openAccept(order.id)">
              <Icon icon="lucide:clipboard-check" />
              验收
            </Button>
          </template>
          <!-- 已完成未评价：评价 -->
          <template v-else-if="order.status === 'completed' && !order.rating">
            <Button
              size="small"
              type="primary"
              ghost
              @click="openEvaluate(order.id)"
            >
              <Icon icon="lucide:star" />
              评价
            </Button>
          </template>
          <!-- 已评价：展示评分 -->
          <template v-else-if="order.status === 'completed' && order.rating">
            <Tag color="gold">
              {{ '★'.repeat(order.rating) }}
            </Tag>
          </template>
          <!-- 已取消 -->
          <template v-else-if="order.status === 'cancelled'">
            <Tag color="default">已取消</Tag>
          </template>
        </span>
      </div>
      <p
        v-if="customerFilteredOrders.length === 0"
        class="customer-table__empty"
      >
        <Icon icon="lucide:inbox" />
        没有符合条件的报修记录，可调整筛选条件或
        <a @click.stop.prevent="openCreate">立即提交报修</a>
        。
      </p>
    </div>

    <!-- 复用：工单详情 Drawer -->
    <Drawer
      v-model:open="detailDrawerOpen"
      :title="detail?.code"
      width="min(1280px, 92vw)"
      placement="right"
    >
      <!-- AI 工单详情：左 30% 工单上下文 · 右 70% AI 工作区（随状态变化四种形态） -->
      <TicketAiDetail v-if="detail" :key="detail.id" :order="detail" />
    </Drawer>

    <!-- 编辑报修工单 Drawer -->
    <Drawer
      v-model:open="editDrawerOpen"
      title="编辑报修工单"
      width="520"
      placement="right"
    >
      <Form v-if="editOrder" layout="vertical" class="ticket-form">
        <div class="ticket-form__row">
          <Form.Item label="工单编号">
            <Input :value="editOrder.code" disabled />
          </Form.Item>
          <Form.Item label="优先级">
            <Select
              v-model:value="editForm.priority"
              :options="[
                { label: '紧急', value: 'urgent' },
                { label: '高', value: 'high' },
                { label: '中', value: 'medium' },
                { label: '低', value: 'low' },
              ]"
            />
          </Form.Item>
        </div>
        <Form.Item label="标题">
          <Input v-model:value="editForm.title" placeholder="简述故障现象" />
        </Form.Item>
        <Form.Item label="工单类型">
          <Select
            v-model:value="editForm.type"
            :options="ticketTypeOptions.map((t) => ({ label: t, value: t }))"
          />
        </Form.Item>
        <div class="ticket-form__row">
          <Form.Item label="客户">
            <Input v-model:value="editForm.customer" />
          </Form.Item>
          <Form.Item label="联系人">
            <Input v-model:value="editForm.contact" />
          </Form.Item>
        </div>
        <Form.Item label="联系电话">
          <Input v-model:value="editForm.phone" />
        </Form.Item>
        <Form.Item label="故障描述">
          <Input.TextArea
            v-model:value="editForm.description"
            :rows="4"
            placeholder="请描述故障现象、复现步骤、现场环境等"
          />
        </Form.Item>
        <p class="ticket-form__hint">
          <Icon icon="lucide:info" />
          仅待派单状态可编辑，派单后将进入流转环节。
        </p>
      </Form>
      <template #footer>
        <div class="ticket-form__footer">
          <Button @click="editDrawerOpen = false">取消</Button>
          <Button type="primary" @click="submitEditTicket">
            <Icon icon="lucide:save" />
            保存修改
          </Button>
        </div>
      </template>
    </Drawer>

    <!-- 评价工单 Drawer -->
    <Drawer
      v-model:open="evaluateDrawerOpen"
      title="评价工单"
      width="520"
      placement="right"
    >
      <Form v-if="evaluateOrder" layout="vertical" class="ticket-form">
        <div class="evaluate-summary">
          <strong>{{ evaluateOrder.code }}</strong>
          <span>{{ evaluateOrder.title }}</span>
          <div class="evaluate-summary__meta">
            <Tag :color="statusColor(evaluateOrder.status)">
              {{ ticketStatusLabel[evaluateOrder.status] }}
            </Tag>
            <span>处理人：{{ evaluateOrder.assignee || '—' }}</span>
          </div>
        </div>
        <Form.Item label="满意度评分">
          <div class="evaluate-stars">
            <button
              v-for="n in 5"
              :key="n"
              type="button"
              class="evaluate-stars__btn"
              :class="{ 'is-on': n <= evaluateForm.rating }"
              @click="evaluateForm.rating = n"
            >
              <Icon icon="lucide:star" />
            </button>
            <span class="evaluate-stars__text">
              {{
                ['很差', '较差', '一般', '满意', '非常满意'][
                  evaluateForm.rating - 1
                ]
              }}
            </span>
          </div>
        </Form.Item>
        <Form.Item label="评价内容">
          <Input.TextArea
            v-model:value="evaluateForm.evaluation"
            :rows="5"
            placeholder="请填写对本次服务的评价，例如响应速度、处理效果、服务态度等"
          />
        </Form.Item>
        <div v-if="evaluateOrder.solution" class="evaluate-solution">
          <h4>处理方案（参考）</h4>
          <pre>{{ evaluateOrder.solution }}</pre>
        </div>
      </Form>
      <template #footer>
        <div class="ticket-form__footer">
          <Button @click="evaluateDrawerOpen = false">稍后再说</Button>
          <Button
            type="primary"
            :disabled="!evaluateForm.evaluation.trim()"
            @click="submitEvaluateTicket"
          >
            <Icon icon="lucide:check" />
            提交评价
          </Button>
        </div>
      </template>
    </Drawer>

    <!-- 复用：创建工单 Drawer -->
    <Drawer
      v-model:open="createDrawerOpen"
      title="提交报修"
      width="540"
      placement="right"
    >
      <Form layout="vertical" class="ticket-form">
        <Form.Item label="标题" required>
          <Input v-model:value="createForm.title" placeholder="简述故障现象" />
        </Form.Item>
        <div class="ticket-form__row">
          <Form.Item label="工单类型" required>
            <Select
              v-model:value="createForm.type"
              :options="
                [
                  '设备故障',
                  '定期保养',
                  '技术咨询',
                  '现场复测',
                  '配件更换',
                ].map((t) => ({ label: t, value: t }))
              "
            />
          </Form.Item>
          <Form.Item label="优先级" required>
            <Select
              v-model:value="createForm.priority"
              :options="[
                { label: '紧急', value: 'urgent' },
                { label: '高', value: 'high' },
                { label: '中', value: 'medium' },
                { label: '低', value: 'low' },
              ]"
            />
          </Form.Item>
        </div>
        <Form.Item label="设备编号">
          <Select
            v-model:value="createForm.deviceCode"
            show-search
            placeholder="选择设备自动带出客户信息"
            :options="
              mockDevices.map((d) => ({
                label: `${d.name} (${d.code})`,
                value: d.code,
              }))
            "
            option-filter-prop="label"
            :list-height="320"
            @change="onDeviceSelected"
          />
        </Form.Item>
        <div class="ticket-form__row">
          <Form.Item label="客户">
            <Input v-model:value="createForm.customer" />
          </Form.Item>
          <Form.Item label="联系人">
            <Input v-model:value="createForm.contact" />
          </Form.Item>
        </div>
        <Form.Item label="联系电话">
          <Input v-model:value="createForm.phone" />
        </Form.Item>
        <Form.Item label="故障描述" required>
          <Input.TextArea
            v-model:value="createForm.description"
            :rows="4"
            placeholder="请描述故障现象、复现步骤、现场环境等"
          />
        </Form.Item>
        <Form.Item label="故障附件">
          <div class="ticket-form__attach">
            <Button @click="mockUploadAttachments">
              <Icon icon="lucide:upload" />
              添加演示附件
            </Button>
            <span class="ticket-form__attach-hint">
              支持照片、视频、截图、录音等（demo 仅模拟）
            </span>
          </div>
          <ul
            v-if="createAttachments.length > 0"
            class="ticket-form__attach-list"
          >
            <li
              v-for="att in createAttachments"
              :key="att.id"
              class="ticket-form__attach-item"
            >
              <Icon :icon="attachmentTypeIcon(att.type)" />
              <span>{{ att.name }}</span>
              <small>{{ att.size }}</small>
              <button type="button" @click="removeUploaded(att.id)">
                <Icon icon="lucide:x" />
              </button>
            </li>
          </ul>
        </Form.Item>
      </Form>
      <template #footer>
        <div class="ticket-form__footer">
          <Button @click="createDrawerOpen = false">取消</Button>
          <Button type="primary" @click="submitCreateTicket">
            <Icon icon="lucide:send" />
            提交报修
          </Button>
        </div>
      </template>
    </Drawer>

    <!-- 复用：取消工单 Drawer -->
    <Drawer
      v-model:open="cancelDrawerOpen"
      title="取消工单"
      width="460"
      placement="right"
    >
      <Form v-if="cancelOrder" layout="vertical" class="ticket-form">
        <p class="ticket-form__hint ticket-form__hint--warn">
          <Icon icon="lucide:alert-triangle" />
          确认取消工单
          <strong>{{ cancelOrder.code }}</strong>
          ？取消后将通知派单助理与处理人，且无法恢复。
        </p>
        <Form.Item label="取消原因（必填）" required>
          <Input.TextArea
            v-model:value="cancelForm.reason"
            :rows="4"
            placeholder="请简要说明取消原因，便于客服与团队复盘"
          />
        </Form.Item>
      </Form>
      <template #footer>
        <div class="ticket-form__footer">
          <Button @click="cancelDrawerOpen = false">再想想</Button>
          <Button type="primary" danger @click="submitCancelTicket">
            <Icon icon="lucide:x" />
            确认取消
          </Button>
        </div>
      </template>
    </Drawer>
  </section>

  <!-- 工程师 / 派单助理 视图：原 my-tickets 页面 -->
  <section v-else class="ticket-page" :class="{ 'is-detail': !!detail }">
    <!-- 工单详情页（平铺视图）：标题区 + 基本信息条 + AI 工单详情 -->
    <template v-if="detail">
      <!-- 新版详情布局（全部工单统一使用，参照 WO-2026-1001） -->
      <TicketDetailCase
        :key="detail.id"
        :order="detail"
        :index="detailIndex + 1"
        :total="list.length"
        :has-prev="!!prevOrder"
        :has-next="!!nextOrder"
        @back="closeDetail"
        @prev="gotoOrder(prevOrder)"
        @next="gotoOrder(nextOrder)"
      />
    </template>

    <!-- 工单列表视图 -->
    <template v-else>
      <section class="ticket-stats">
        <button
          type="button"
          class="ticket-stat"
          :class="{ 'is-active': activeStat === 'created' }"
          @click="selectScope('created')"
        >
          <span class="ticket-stat__num">{{ stats.created }}</span>
          <span class="ticket-stat__label">我创建的</span>
        </button>
        <button
          type="button"
          class="ticket-stat"
          :class="{ 'is-active': activeStat === 'assigned' }"
          @click="selectScope('assigned')"
        >
          <span class="ticket-stat__num">{{ stats.assigned }}</span>
          <span class="ticket-stat__label">分派给我</span>
        </button>
        <button
          type="button"
          class="ticket-stat"
          :class="{ 'is-active': activeStat === 'processing' }"
          @click="selectQuick('processing')"
        >
          <span class="ticket-stat__num">{{ stats.processing }}</span>
          <span class="ticket-stat__label">处理中</span>
        </button>
        <button
          type="button"
          class="ticket-stat"
          :class="{ 'is-active': activeStat === 'breached' }"
          @click="selectQuick('breached')"
        >
          <span class="ticket-stat__num is-warn">{{ stats.breached }}</span>
          <span class="ticket-stat__label">时效超时</span>
        </button>
        <button type="button" class="ticket-stat-create" @click="openCreate">
          <Icon icon="lucide:plus-circle" />
          <span>创建工单</span>
        </button>
      </section>

      <div class="ticket-filter">
        <Select
          v-model:value="filterInput.type"
          placeholder="工单类型"
          allow-clear
          class="ticket-filter__type"
          :options="ticketTypeOptions.map((t) => ({ label: t, value: t }))"
        />
        <Select
          v-model:value="filterInput.status"
          placeholder="工单状态"
          allow-clear
          class="ticket-filter__status"
          :options="statusOptions"
        />
        <Input
          v-model:value="filterInput.keyword"
          class="ticket-filter__keyword"
          placeholder="搜索工单号 / 标题 / 客户 / 设备"
          allow-clear
          @press-enter="applyFilter"
        >
          <template #prefix>
            <Icon icon="lucide:search" />
          </template>
        </Input>
        <Button type="primary" class="ticket-filter__btn" @click="applyFilter">
          <Icon icon="lucide:search" />
          搜索
        </Button>
      </div>

      <!-- 工单列表（卡片 → 紧凑表格样式） -->
      <div class="mt-list-wrap">
        <div class="mt-list__head">
          <span>工单号 / 工单标题</span>
          <span>工单类型</span>
          <span>工单状态</span>
          <span>时效</span>
          <span>客户 / 联系人 / 设备</span>
          <span>创建人 / 时间</span>
          <span class="mt-list__head-go"></span>
        </div>
        <div class="mt-card-grid">
          <article
            v-for="order in pagedList"
            :key="order.id"
            class="mt-ticket-card"
            :class="`is-${order.priority}`"
            role="button"
            tabindex="0"
            @click="openDetail(order.id)"
            @keydown.enter="openDetail(order.id)"
          >
            <!-- 第 1 列：工单号 + 工单标题 -->
            <header class="mt-ticket-card__head">
              <div class="mt-ticket-card__code">
                <Icon icon="lucide:ticket" />
                <strong>{{ order.code }}</strong>
              </div>
              <h3 class="mt-ticket-card__title">{{ order.title }}</h3>
            </header>

            <!-- 第 2 列：工单类型 -->
            <span class="mt-ticket-card__col-type">{{ order.type }}</span>

            <!-- 第 3 列：工单状态（流程节点优先） -->
            <span class="mt-ticket-card__col-status">
              <Tag
                v-if="useFlowNode(order)"
                :color="flowNodeColor(order.currentNodeId)"
              >
                {{ flowNodeName(order) }}
              </Tag>
              <Tag v-else :color="statusColor(order.status)">
                {{ ticketStatusLabel[order.status] }}
              </Tag>
            </span>

            <!-- 第 4 列：时效状态 + 剩余时间 -->
            <span class="mt-ticket-card__col-sla">
              <Tag :color="slaColor(order.slaStatus)">
                {{ slaStatusLabel[order.slaStatus] }}
              </Tag>
              <small>{{ order.slaRemaining }}</small>
            </span>

            <!-- 第 5 列：客户 / 联系人 / 设备 Meta -->
            <dl class="mt-ticket-card__meta">
              <div>
                <dt>
                  <Icon icon="lucide:building-2" />
                  客户
                </dt>
                <dd>{{ order.customer || '—' }}</dd>
              </div>
              <div>
                <dt>
                  <Icon icon="lucide:phone" />
                  联系
                </dt>
                <dd>{{ order.contact }} {{ order.phone }}</dd>
              </div>
              <div>
                <dt>
                  <Icon icon="lucide:cpu" />
                  设备
                </dt>
                <dd>{{ order.device || '—' }}</dd>
              </div>
            </dl>

            <!-- 第 6 列：创建人 / 创建时间（我创建的附处理人） -->
            <span class="mt-ticket-card__col-creator">
              <b>{{ order.creator }}</b>
              <small>{{ order.createdAt }}</small>
              <small v-if="activeTab === 'created'">
                处理人：{{ order.assignee || '待派单' }}
              </small>
            </span>

            <!-- 第 7 列：查看详情（所有操作在工单详情中进行） -->
            <span class="mt-ticket-card__go">
              查看详情
              <Icon icon="lucide:arrow-right-circle" />
            </span>
          </article>

          <p v-if="list.length === 0" class="mt-card-grid__empty">
            <Icon icon="lucide:inbox" />
            {{
              activeTab === 'assigned'
                ? '暂无分派给你的工单。'
                : '暂无你创建的工单。'
            }}
          </p>
        </div>
        <Pagination
          v-if="list.length > 0"
          v-model:current="currentPage"
          class="mt-pagination"
          :page-size="pageSize"
          :total="list.length"
          :show-size-changer="false"
        />
      </div>
    </template>

    <Drawer
      v-model:open="cancelDrawerOpen"
      :title="cancelOrder ? `取消工单 · ${cancelOrder.code}` : '取消工单'"
      width="500"
      placement="right"
    >
      <div v-if="cancelOrder" class="complete-form">
        <div class="complete-form__summary">
          <h2>{{ cancelOrder.title }}</h2>
          <div class="ticket-detail__tags">
            <Tag :color="statusColor(cancelOrder.status)">
              {{ ticketStatusLabel[cancelOrder.status] }}
            </Tag>
            <Tag>{{ cancelOrder.type }}</Tag>
          </div>
          <dl>
            <div>
              <dt>客户</dt>
              <dd>{{ cancelOrder.customer || '—' }}</dd>
            </div>
            <div>
              <dt>创建人</dt>
              <dd>{{ cancelOrder.creator }}</dd>
            </div>
            <div>
              <dt>创建时间</dt>
              <dd>{{ cancelOrder.createdAt }}</dd>
            </div>
            <div>
              <dt>处理人</dt>
              <dd>{{ cancelOrder.assignee || '待派单' }}</dd>
            </div>
          </dl>
        </div>
        <Form layout="vertical">
          <Form.Item label="取消原因 *" required>
            <Input.TextArea
              v-model:value="cancelForm.reason"
              :rows="5"
              placeholder="例如：客户自行解决 / 原因误报错 / 现场无需处置…"
            />
          </Form.Item>
          <div class="create-form__actions">
            <Button @click="cancelDrawerOpen = false">再想想</Button>
            <Button danger type="primary" @click="submitCancelTicket">
              <Icon icon="lucide:x-circle" />
              确认取消
            </Button>
          </div>
        </Form>
      </div>
    </Drawer>

    <Drawer
      v-model:open="createDrawerOpen"
      title="创建工单"
      width="540"
      placement="right"
    >
      <Form layout="vertical" class="create-form">
        <div class="create-form__row">
          <Form.Item label="工单标题 *" required>
            <Input
              v-model:value="createForm.title"
              placeholder="例如：宁德 D4 偶发识别异常"
            />
          </Form.Item>
        </div>
        <div class="create-form__row">
          <Form.Item label="工单类型">
            <Select v-model:value="createForm.type" style="width: 100%">
              <Select.Option value="设备故障">设备故障</Select.Option>
              <Select.Option value="定期保养">定期保养</Select.Option>
              <Select.Option value="技术咨询">技术咨询</Select.Option>
              <Select.Option value="备件更换">备件更换</Select.Option>
              <Select.Option value="现场复测">现场复测</Select.Option>
              <Select.Option value="技术改进">技术改进</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="优先级">
            <Select v-model:value="createForm.priority" style="width: 100%">
              <Select.Option value="urgent">紧急</Select.Option>
              <Select.Option value="high">高</Select.Option>
              <Select.Option value="medium">中</Select.Option>
              <Select.Option value="low">低</Select.Option>
            </Select>
          </Form.Item>
        </div>
        <div class="create-form__row">
          <Form.Item label="设备编号">
            <Select
              v-model:value="createForm.deviceCode"
              allow-clear
              show-search
              placeholder="选择 / 搜索设备编号"
              style="width: 100%"
              @change="onDeviceSelected"
            >
              <Select.Option
                v-for="d in mockDevices"
                :key="d.id"
                :value="d.code"
              >
                {{ d.code }} · {{ d.name }}
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="所属客户">
            <Input
              v-model:value="createForm.customer"
              placeholder="选设备后自动带出"
            />
          </Form.Item>
        </div>
        <div class="create-form__row">
          <Form.Item label="现场联系人">
            <Input v-model:value="createForm.contact" />
          </Form.Item>
          <Form.Item label="联系电话">
            <Input
              v-model:value="createForm.phone"
              placeholder="客户方联系电话"
            />
          </Form.Item>
        </div>
        <Form.Item label="故障描述 / 现场情况 *" required>
          <Input.TextArea
            v-model:value="createForm.description"
            :rows="5"
            placeholder="故障现象、复现方式、影响范围、已尝试处置…"
          />
        </Form.Item>
        <div class="create-form__attachments">
          <header>
            <h3>故障附件</h3>
            <Button size="small" @click="mockUploadAttachments">
              <Icon icon="lucide:upload-cloud" />
              添加演示附件
            </Button>
          </header>
          <ul v-if="createAttachments.length > 0" class="attach-list">
            <li
              v-for="att in createAttachments"
              :key="att.id"
              class="attach-item"
            >
              <span class="attach-item__icon" :class="`is-${att.type}`">
                <Icon :icon="attachmentTypeIcon(att.type)" />
              </span>
              <div class="attach-item__main">
                <strong>{{ att.name }}</strong>
                <small>
                  <Tag>{{ attachmentTypeLabel(att.type) }}</Tag>
                  <span>{{ att.size }}</span>
                  <span v-if="att.duration">· {{ att.duration }}</span>
                  <span>· {{ att.uploader }} · {{ att.uploadedAt }}</span>
                </small>
                <em v-if="att.note">{{ att.note }}</em>
              </div>
              <Button
                type="text"
                danger
                size="small"
                @click="removeUploaded(att.id)"
              >
                <Icon icon="lucide:x" />
                移除
              </Button>
            </li>
          </ul>
          <p v-else class="ticket-empty">
            暂无附件，可点击「添加演示附件」模拟现场照片、截图上传。
          </p>
        </div>
        <div class="create-form__actions">
          <Button @click="createDrawerOpen = false">取消</Button>
          <Button type="primary" @click="submitCreateTicket">
            <Icon icon="lucide:send" />
            提交工单
          </Button>
        </div>
      </Form>
    </Drawer>
  </section>

  <!-- 验收工单 Drawer（客户/工程师视角共用） -->
  <Drawer
    v-model:open="acceptDrawerOpen"
    title="工单验收"
    width="520"
    placement="right"
  >
    <Form v-if="acceptOrder" layout="vertical" class="ticket-form">
      <div class="evaluate-summary">
        <strong>{{ acceptOrder.code }}</strong>
        <span>{{ acceptOrder.title }}</span>
        <div class="evaluate-summary__meta">
          <Tag :color="statusColor(acceptOrder.status)">
            {{ ticketStatusLabel[acceptOrder.status] }}
          </Tag>
          <span>处理人：{{ acceptOrder.assignee || '—' }}</span>
        </div>
      </div>
      <div v-if="acceptOrder.solution" class="evaluate-solution">
        <h4>处理方案</h4>
        <pre>{{ acceptOrder.solution }}</pre>
      </div>
      <Form.Item label="验收结论">
        <Radio.Group v-model:value="acceptForm.result">
          <Radio.Button value="approved">验收通过</Radio.Button>
          <Radio.Button value="rejected">验收不通过</Radio.Button>
        </Radio.Group>
      </Form.Item>
      <Form.Item label="验收意见" :required="acceptForm.result === 'rejected'">
        <Input.TextArea
          v-model:value="acceptForm.opinion"
          :rows="4"
          :placeholder="
            acceptForm.result === 'rejected'
              ? '请填写验收不通过的原因，便于处理人重新处理'
              : '可填写验收备注（选填）'
          "
        />
      </Form.Item>
      <Alert v-if="acceptForm.result === 'rejected'" type="warning" show-icon>
        验收不通过后工单将退回处理人重新处理，处理完成后需重新提交验收。
      </Alert>
    </Form>
    <template #footer>
      <div class="ticket-form__footer">
        <Button @click="acceptDrawerOpen = false">稍后再说</Button>
        <Button
          type="primary"
          :danger="acceptForm.result === 'rejected'"
          @click="submitAcceptTicket"
        >
          <Icon
            :icon="
              acceptForm.result === 'approved'
                ? 'lucide:check'
                : 'lucide:undo-2'
            "
          />
          {{
            acceptForm.result === 'approved' ? '确认验收通过' : '退回重新处理'
          }}
        </Button>
      </div>
    </template>
  </Drawer>
  <InspectionOrderDrawer
    v-model:open="inspectionOrderOpen"
    :code="inspectionOrderCode"
    @changed="inspectionVersion++"
  />
</template>

<style scoped>
/* 窄屏回退：AI 建议块移到顶部 */
@media (max-width: 760px) {
  .ticket-detail {
    grid-template-columns: 1fr;
  }

  .ticket-detail__aside {
    position: static;
    order: -1;
  }
}

@media (max-width: 1100px) {
  .ticket-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .ticket-table__head {
    display: none;
  }

  .ticket-table__row {
    grid-template-columns: 1fr 1fr;
    gap: 6px 10px;
  }
}

/* 客服视图响应式 */
@media (max-width: 1180px) {
  .customer-table__head {
    display: none;
  }

  .customer-table__row {
    grid-template-columns: 1fr 1fr;
    gap: 8px 10px;
  }

  .customer-table__actions {
    grid-column: span 2;
  }
}

/* 响应式：窄屏时列表头隐藏，行按 2/3 列网格 */
@media (max-width: 1180px) {
  .mt-list__head {
    display: none;
  }

  .mt-ticket-card {
    grid-template-columns: 1fr 1fr;
    gap: 6px 12px;
  }

  .mt-ticket-card__footer {
    grid-column: span 2;
    justify-content: flex-start;
  }

  .mt-ticket-card__meta {
    grid-template-columns: 1fr 1fr;
    grid-column: span 2;
  }
}

@media (max-width: 1180px) {
  .mt-card-grid,
  .mt-ai-grid {
    grid-template-columns: 1fr;
  }
}

.ticket-page {
  width: 100%;
  height: 100%;
  min-height: 0;

  /* 水平不留白：内容与顶部数字员工标题卡片左右对齐 */
  padding: 12px 0 24px;
  overflow: auto;
  scrollbar-gutter: stable;
}

/* 详情视图：减小与顶部数字员工卡片的行间距 */
.ticket-page.is-detail {
  padding-top: 8px;
}

.ticket-page__header {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 22px 26px;
  margin-bottom: 18px;
  color: #fff;
  background: linear-gradient(125deg, #073a33 0%, #0b6e65 66%, #178f7b 100%);
  border-radius: 18px;
  box-shadow: 0 15px 36px rgb(7 71 60 / 18%);
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

.ticket-page__cta {
  font-weight: 700;
  color: #073a33;
  background: #32c8a5;
  border-color: #3bd3ae;
}

.ticket-stats {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

/* 统计卡片：点击筛选列表 */
.ticket-stat {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px 10px;
  align-items: baseline;
  padding: 10px 14px;
  font: inherit;
  text-align: left;
  cursor: pointer;
  background: #fff;
  border: 1px solid #dce9e4;
  border-radius: 10px;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.ticket-stat:hover {
  border-color: #0b6e65;
}

.ticket-stat.is-active {
  background: #eef7f4;
  border-color: #0b6e65;
  box-shadow: inset 3px 0 0 #0b6e65;
}

.ticket-stat__num {
  grid-row: span 2;
  font-size: 20px;
  font-weight: 800;
  line-height: 1;
  color: #0c4a3f;
}

.ticket-stat__num.is-warn {
  color: #d4541f;
}

.ticket-stat__label {
  grid-column: 2;
  font-size: 10.5px;
  color: #729088;
}

/* 创建工单按钮：跨 2 列，蓝色虚线边框 */
.ticket-stat-create {
  display: flex;
  flex-direction: row;
  grid-column: span 2;
  gap: 6px;
  align-items: center;
  justify-content: center;
  padding: 10px 14px;
  font-size: 12px;
  font-weight: 600;
  color: #1677ff;
  cursor: pointer;
  background: #e6f4ff;
  border: 1px dashed #91caff;
  border-radius: 10px;
  transition: all 0.15s;
}

.ticket-stat-create :deep(svg),
.ticket-stat-create svg {
  width: 20px;
  height: 20px;
}

.ticket-stat-create:hover {
  color: #fff;
  background: #1677ff;
  border-color: #1677ff;
  border-style: solid;
}

/* ============ 工单详情页（平铺视图） ============ */
.td-head {
  display: flex;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.td-back {
  display: inline-flex;
  flex-shrink: 0;
  gap: 5px;
  align-items: center;
  padding: 7px 14px;
  font-size: 12.5px;
  font-weight: 600;
  color: #0c4a3f;
  cursor: pointer;
  background: #fff;
  border: 1px solid #d3e4de;
  border-radius: 999px;
  transition: all 0.15s;
}

.td-back svg {
  width: 14px;
  height: 14px;
}

.td-back:hover {
  color: #fff;
  background: #0b6e65;
  border-color: #0b6e65;
}

.td-head__title {
  display: flex;
  flex: 1;
  gap: 10px;
  align-items: center;
  min-width: 0;
  margin: 0;
  overflow: hidden;
}

/* 工单标题（标题区内与工单号同行） */
.td-head__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 16px;
  font-weight: 700;
  color: #123c33;
  white-space: nowrap;
}

.td-nav {
  display: inline-flex;
  flex-shrink: 0;
  gap: 8px;
  align-items: center;
}

.td-nav :deep(.ant-btn) {
  display: inline-flex;
  gap: 3px;
  align-items: center;
}

.td-nav :deep(svg) {
  width: 13px;
  height: 13px;
}

.td-nav__pos {
  font-size: 11px;
  color: #729088;
}

/* 基本信息条：内容与列表卡片一致 */
.td-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  margin-bottom: 14px;
  background: #fff;
  border: 1px solid #e1ece7;
  border-left-width: 3px;
  border-radius: 12px;
}

.td-info.is-urgent {
  border-left-color: #d4541f;
}

.td-info.is-high {
  border-left-color: #c9a43a;
}

.td-info.is-medium {
  border-left-color: #4ca87a;
}

.td-info.is-low {
  border-left-color: #c4d4cd;
}

.td-info__fields {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px 18px;
  padding: 0;
  margin: 0;
}

.td-info__fields div {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.td-info__fields dt {
  font-size: 10px;
  color: #81958e;
}

.td-info__fields dd {
  display: flex;
  gap: 6px;
  align-items: center;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11.5px;
  font-weight: 500;
  color: #355b51;
  white-space: nowrap;
}

.td-info__fields dd :deep(.ant-tag) {
  margin: 0;
  font-size: 10.5px;
}

.td-info__sla small {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 10.5px;
  color: #6c8780;
  white-space: nowrap;
}

/* 筛选区：工单类型 / 状态 / 关键词 / 搜索按钮 */
.ticket-filter {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}

.ticket-filter__type,
.ticket-filter__status {
  width: 140px;
}

.ticket-filter__keyword {
  flex: 1;
  min-width: 220px;
}

.ticket-table {
  padding: 0;
  overflow: hidden;
  background: #fff;
  border: 1px solid #dce9e4;
  border-radius: 16px;
}

.ticket-table__head {
  display: grid;
  grid-template-columns: 2fr 1.4fr 0.8fr 1fr 1.2fr 1fr 1fr;
  gap: 10px;
  padding: 12px 18px;
  font-size: 11px;
  font-weight: 700;
  color: #5a756d;
  background: #f4f8f6;
  border-bottom: 1px solid #e1ece7;
}

.ticket-table.is-assigned .ticket-table__head,
.ticket-table.is-assigned .ticket-table__row,
.ticket-table.is-created .ticket-table__head,
.ticket-table.is-created .ticket-table__row {
  grid-template-columns: 2fr 1.4fr 0.8fr 1fr 1.2fr 1fr 1fr 1.1fr;
}

.ticket-table__row {
  display: grid;
  grid-template-columns: 2fr 1.4fr 0.8fr 1fr 1.2fr 1fr 1fr;
  gap: 10px;
  align-items: center;
  width: 100%;
  padding: 12px 18px;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-bottom: 1px solid #eef3f0;
}

.ticket-table__row:last-child {
  border-bottom: 0;
}

.ticket-table__row:hover {
  background: #f6fbf9;
}

.ticket-table__main strong {
  display: block;
  font-size: 12px;
  color: #0c4a3f;
}

.ticket-table__main small {
  display: block;
  margin-top: 3px;
  font-size: 11px;
  color: #6c8780;
}

.ticket-table__row b {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #24483e;
}

.ticket-table__row small {
  display: block;
  margin-top: 3px;
  font-size: 10px;
  color: #81958e;
}

.ticket-table__row :deep(.ant-tag) {
  margin: 0;
  font-size: 10px;
}

.ticket-table__time {
  font-size: 11px;
  color: #81958e;
}

.ticket-table__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.ticket-table__actions :deep(.ant-btn) {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 2px 10px;
  font-size: 11px;
}

.ticket-table__actions :deep(.ant-btn .anticon) {
  font-size: 12px;
}

.ticket-empty {
  padding: 40px 0;
  font-size: 13px;
  color: #81958e;
  text-align: center;
}

.ticket-detail__solution {
  padding: 14px;
  margin-top: 20px;
  background: #f6fbf9;
  border: 1px solid #d8ebe4;
  border-radius: 10px;
}

.ticket-detail__solution header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.ticket-detail__solution h3 {
  margin: 0;
  font-size: 13px;
  color: #0c4a3f;
}

.ticket-detail__solution header span {
  font-size: 11px;
  color: #81958e;
}

.ticket-detail__solution-text {
  padding: 12px;
  margin: 0 0 14px;
  font-family: inherit;
  font-size: 12px;
  line-height: 1.8;
  color: #3f5b53;
  white-space: pre-wrap;
  background: #fff;
  border: 1px solid #e1ece7;
  border-radius: 8px;
}

.complete-form__summary {
  padding-bottom: 16px;
  margin-bottom: 18px;
  border-bottom: 1px dashed #e1ece7;
}

.complete-form__summary h2 {
  margin: 0 0 10px;
  font-size: 18px;
  color: #0c4a3f;
}

.complete-form__summary dl {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 16px;
  margin: 12px 0 0;
}

.complete-form__summary dl > div {
  display: grid;
  gap: 3px;
}

.complete-form__summary dt {
  font-size: 10px;
  color: #95a7a1;
}

.complete-form__summary dd {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #24483e;
}

.ticket-detail__cancel {
  padding: 14px;
  margin-top: 20px;
  background: #fbeaea;
  border: 1px solid #efc9c6;
  border-radius: 10px;
}

.ticket-detail__cancel header,
.ticket-detail__transfer header,
.ticket-detail__timeline header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.ticket-detail__cancel h3,
.ticket-detail__transfer h3,
.ticket-detail__timeline h3 {
  margin: 0;
  font-size: 13px;
  color: #0c4a3f;
}

.ticket-detail__cancel header span,
.ticket-detail__transfer header span,
.ticket-detail__timeline header span {
  font-size: 11px;
  color: #81958e;
}

.ticket-detail__transfer {
  padding: 14px;
  margin-top: 20px;
  background: #fdf7ee;
  border: 1px solid #f0dbb9;
  border-radius: 10px;
}

.transfer-list {
  display: grid;
  gap: 10px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.transfer-item {
  display: grid;
  grid-template-columns: 36px 1fr;
  gap: 10px;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #e1ece7;
  border-radius: 8px;
}

.transfer-item__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: #c7772a;
  background: #fbeedc;
  border-radius: 8px;
}

.transfer-item__main strong {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #1c3e35;
}

.transfer-item__main small {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: #81958e;
}

.transfer-item__main em {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  font-style: normal;
  color: #6c8780;
}

.ticket-detail__timeline {
  padding: 14px;
  margin-top: 20px;
  background: #f7faf9;
  border: 1px solid #e1ece7;
  border-radius: 10px;
}

.tl-list {
  position: relative;
  padding: 0;
  margin: 0;
  list-style: none;
}

.tl-item {
  position: relative;
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: 12px;
  padding: 8px 0 16px;
}

.tl-item:not(:last-child)::before {
  position: absolute;
  top: 32px;
  bottom: 0;
  left: 15px;
  width: 2px;
  content: '';
  background: #e1ece7;
}

.tl-item__dot {
  z-index: 1;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: #fff;
  border-radius: 50%;
}

.tl-item__dot svg {
  width: 16px;
  height: 16px;
}

.tl-item__main strong {
  display: block;
  font-size: 12px;
  line-height: 1.6;
  color: #1c3e35;
}

.tl-item__main small {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: #81958e;
}

.tl-item__main em {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  font-style: normal;
  color: #6c8780;
}

/* 工单详情：左右 7:3 分栏 */
.ticket-detail {
  display: grid;
  grid-template-columns: 7fr 3fr;
  gap: 18px;
  align-items: start;
}

.ticket-detail__main {
  min-width: 0;
}

.ticket-detail__aside {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ticket-detail h2 {
  margin: 0 0 12px;
  font-size: 18px;
  color: #0c4a3f;
}

.ticket-detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 18px;
}

.ticket-detail dl {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
  margin: 0 0 20px;
}

.ticket-detail dl > div {
  display: grid;
  gap: 3px;
}

.ticket-detail dt {
  font-size: 10px;
  color: #95a7a1;
}

.ticket-detail dd {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #24483e;
}

.ticket-detail__desc h3 {
  margin: 0 0 8px;
  font-size: 13px;
  color: #0c4a3f;
}

.ticket-detail__desc pre {
  padding: 12px;
  margin: 0;
  font-family: inherit;
  font-size: 12px;
  line-height: 1.7;
  color: #3f5b53;
  white-space: pre-wrap;
  background: #f7faf9;
  border: 1px solid #e1ece7;
  border-radius: 10px;
}

.ticket-detail__attachments,
.create-form__attachments {
  margin-top: 20px;
}

.ticket-detail__attachments header,
.create-form__attachments header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 10px;
}

.ticket-detail__attachments h3,
.create-form__attachments h3 {
  margin: 0;
  font-size: 13px;
  color: #0c4a3f;
}

.ticket-detail__attachments header span {
  font-size: 11px;
  color: #81958e;
}

.attach-list {
  padding: 0;
  margin: 0;
  overflow: hidden;
  list-style: none;
  border: 1px solid #e1ece7;
  border-radius: 10px;
}

.attach-item {
  display: grid;
  grid-template-columns: 36px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  background: #fbfdfc;
  border-bottom: 1px solid #f0f5f3;
}

.attach-item:last-child {
  border-bottom: 0;
}

.attach-item__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: #0b6e65;
  background: #eef5f2;
  border-radius: 8px;
}

.attach-item__icon.is-video,
.attach-item__icon.is-audio,
.attach-item__icon.is-recording {
  color: #7d5397;
  background: #f3ecf6;
}

.attach-item__icon.is-pdf {
  color: #b74137;
  background: #f9e9e8;
}

.attach-item__main strong {
  display: block;
  font-size: 12px;
  color: #1c3e35;
}

.attach-item__main small {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin-top: 4px;
  font-size: 11px;
  color: #81958e;
}

.attach-item__main :deep(.ant-tag) {
  margin: 0;
  font-size: 10px;
}

.attach-item__main em {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  font-style: normal;
  color: #6c8780;
}

.create-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.create-form__actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding-top: 16px;
  margin-top: 22px;
  border-top: 1px dashed #e1ece7;
}

/* 工程师选择卡片（派单 / 转派下拉里使用） */
.engineer-card {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  padding: 4px 2px 6px;
}

.engineer-card__left {
  display: flex;
  gap: 10px;
  align-items: baseline;
}

.engineer-card__name {
  font-size: 13px;
  color: #1c3e35;
}

.engineer-card__role {
  font-size: 11px;
  color: #6c8780;
}

.engineer-card__right {
  padding-left: 10px;
}

.engineer-card__meta {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  grid-column: 1 / -1;
  gap: 8px;
  margin-top: 6px;
  font-size: 11px;
  color: #6c8780;
}

.engineer-card__area,
.engineer-card__team {
  display: inline-flex;
  gap: 4px;
  align-items: center;
}

.engineer-card__area svg,
.engineer-card__team svg {
  width: 11px;
  height: 11px;
  opacity: 0.75;
}

/* ============== 售后客服：报修记录视图 ============== */
.customer-view {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.customer-filter {
  padding: 14px 18px;
  background: #fff;
  border: 1px solid #e1ece7;
  border-radius: 14px;
}

.customer-filter__row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
}

.customer-filter__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.customer-filter__field--grow {
  flex: 1;
  min-width: 220px;
}

.customer-filter__field label {
  font-size: 11px;
  font-weight: 600;
  color: #5a756d;
  letter-spacing: 0.02em;
}

.customer-filter__actions {
  display: flex;
  align-items: flex-end;
}

.customer-filter__summary {
  display: flex;
  gap: 10px;
  align-items: center;
  padding-top: 10px;
  margin-top: 10px;
  font-size: 12px;
  color: #6c8780;
  border-top: 1px dashed #e1ece7;
}

.customer-filter__summary strong {
  font-weight: 700;
  color: #0b6e65;
}

.customer-filter__chip {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 2px 9px;
  font-size: 11px;
  color: #087565;
  background: #e3f1ec;
  border-radius: 999px;
}

.customer-table {
  overflow: hidden;
  background: #fff;
  border: 1px solid #e1ece7;
  border-radius: 14px;
}

.customer-table__head {
  display: grid;
  grid-template-columns: 2fr 1.5fr 0.8fr 1.2fr 1fr 1.1fr 1.1fr;
  gap: 10px;
  padding: 12px 18px;
  font-size: 11px;
  font-weight: 700;
  color: #5a756d;
  background: #f4f8f6;
  border-bottom: 1px solid #e1ece7;
}

.customer-table__row {
  display: grid;
  grid-template-columns: 2fr 1.5fr 0.8fr 1.2fr 1fr 1.1fr 1.1fr;
  gap: 10px;
  align-items: center;
  padding: 12px 18px;
  cursor: pointer;
  border-bottom: 1px solid #eef3f0;
  transition: background 0.15s;
}

.customer-table__row:last-child {
  border-bottom: 0;
}

.customer-table__row:hover {
  background: #f6fbf9;
}

.customer-table__main strong {
  display: block;
  font-size: 12px;
  color: #0c4a3f;
}

.customer-table__main small {
  display: block;
  margin-top: 3px;
  font-size: 11px;
  color: #6c8780;
}

.customer-table__row b {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #24483e;
}

.customer-table__row small {
  display: block;
  margin-top: 3px;
  font-size: 10px;
  color: #81958e;
}

.customer-table__row :deep(.ant-tag) {
  margin: 0;
  font-size: 10px;
}

.customer-table__time {
  font-size: 11px;
  color: #6c8780;
}

.customer-table__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.customer-table__empty {
  padding: 48px 0;
  font-size: 13px;
  color: #81958e;
  text-align: center;
}

.customer-table__empty :deep(svg),
.customer-table__empty svg {
  width: 28px;
  height: 28px;
  margin-right: 8px;
  vertical-align: middle;
  opacity: 0.5;
}

.customer-table__empty a {
  color: #0b6e65;
  text-decoration: underline;
  cursor: pointer;
}

/* 评价抽屉 */
.evaluate-summary {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  margin-bottom: 12px;
  background: linear-gradient(125deg, #f8fbf9 0%, #eef6f2 100%);
  border: 1px solid #d5e4df;
  border-radius: 12px;
}

.evaluate-summary strong {
  font-size: 14px;
  color: #0f2925;
}

.evaluate-summary span {
  font-size: 12px;
  color: #6c8780;
}

.evaluate-summary__meta {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 4px;
  font-size: 11px;
  color: #6c8780;
}

.evaluate-stars {
  display: flex;
  gap: 6px;
  align-items: center;
}

.evaluate-stars__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  font-size: 22px;
  color: #c4d4cd;
  cursor: pointer;
  background: transparent;
  border: 0;
  transition:
    color 0.15s,
    transform 0.1s;
}

.evaluate-stars__btn:hover {
  transform: scale(1.1);
}

.evaluate-stars__btn.is-on {
  color: #f5a623;
}

.evaluate-stars__btn :deep(svg),
.evaluate-stars__btn svg {
  width: 26px;
  height: 26px;
}

.evaluate-stars__text {
  margin-left: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #5a756d;
}

.evaluate-solution {
  padding: 12px;
  margin-top: 14px;
  background: #f8faf9;
  border: 1px solid #e1ece7;
  border-radius: 8px;
}

.evaluate-solution h4 {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 700;
  color: #1c453c;
}

.evaluate-solution pre {
  margin: 0;
  font-family: inherit;
  font-size: 12px;
  line-height: 1.6;
  color: #4a6b62;
  white-space: pre-wrap;
}

.ticket-detail__rating {
  margin: 6px 0;
  font-size: 18px;
  color: #f5a623;
  letter-spacing: 2px;
}

/* ============== 工程师视图：AI 处理建议 ============== */
.mt-ai-section {
  padding: 10px 12px;
  margin-bottom: 12px;
  background: linear-gradient(125deg, #fffaf0 0%, #fff5e6 100%);
  border: 1px solid #f0d8b8;
  border-radius: 10px;
}

.mt-ai-section__head {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 8px;
}

.mt-ai-section__head :deep(svg) {
  width: 18px;
  height: 18px;
  color: #c7772a;
}

.mt-ai-section__head strong {
  display: block;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
  color: #7a4a16;
}

.mt-ai-section__head small {
  display: block;
  margin-top: 2px;
  font-size: 10.5px;
  color: #a08070;
}

.mt-ai-section__head em {
  padding: 2px 9px;
  margin-left: auto;
  font-size: 10.5px;
  font-style: normal;
  color: #c7772a;
  background: #fff;
  border-radius: 999px;
}

.mt-ai-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 10px;
}

.mt-ai-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  background: #fff;
  border: 1px solid #f0d8b8;
  border-radius: 8px;
  box-shadow: 0 1px 5px rgb(199 119 42 / 7%);
}

.mt-ai-card.is-rank-1 {
  border-color: #d4541f;
  box-shadow: 0 2px 8px rgb(212 84 31 / 10%);
}

.mt-ai-card.is-rank-2 {
  border-color: #c9a43a;
}

.mt-ai-card.is-rank-3 {
  border-color: #4ca87a;
}

.mt-ai-card__head {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.mt-ai-card__rank {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 20px;
  padding: 0 5px;
  font-size: 10.5px;
  font-weight: 800;
  color: #fff;
  background: #c7772a;
  border-radius: 999px;
}

.mt-ai-card.is-rank-1 .mt-ai-card__rank {
  background: #d4541f;
}

.mt-ai-card.is-rank-2 .mt-ai-card__rank {
  background: #c9a43a;
}

.mt-ai-card.is-rank-3 .mt-ai-card__rank {
  background: #4ca87a;
}

.mt-ai-card__head strong {
  font-size: 12px;
  color: #0f2925;
}

.mt-ai-card__head :deep(.ant-tag) {
  margin: 0;
  font-size: 10px;
}

.mt-ai-card__title {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.45;
  color: #1c3e35;
}

.mt-ai-card__reason {
  display: flex;
  gap: 5px;
  margin: 0;
  font-size: 10.5px;
  line-height: 1.5;
  color: #81958e;
}

.mt-ai-card__reason :deep(svg) {
  flex: none;
  margin-top: 2px;
  color: #a08070;
}

.mt-ai-card__eta {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 4px 8px;
  font-size: 10.5px;
  color: #6c8780;
  background: #f8faf9;
  border-radius: 6px;
}

.mt-ai-card__eta :deep(svg) {
  width: 13px;
  height: 13px;
  color: #087565;
}

.mt-ai-card__eta strong {
  font-weight: 700;
  color: #0b6e65;
}

.mt-ai-card__sla {
  margin-left: auto;
  color: #a08070;
}

.mt-ai-card__steps {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.mt-ai-card__steps li {
  display: flex;
  gap: 6px;
  align-items: flex-start;
  font-size: 10.5px;
  line-height: 1.5;
  color: #4a6b62;
}

.mt-ai-card__steps li i {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 15px;
  height: 15px;
  margin-top: 1px;
  font-size: 10px;
  font-style: normal;
  font-weight: 700;
  color: #fff;
  background: #c4d4cd;
  border-radius: 50%;
}

.mt-ai-card.is-rank-1 .mt-ai-card__steps li i {
  background: #d4541f;
}

.mt-ai-card.is-rank-2 .mt-ai-card__steps li i {
  background: #c9a43a;
}

.mt-ai-card.is-rank-3 .mt-ai-card__steps li i {
  background: #4ca87a;
}

.mt-ai-card__kb {
  padding: 6px 8px;
  margin-top: 2px;
  background: #f8faf9;
  border-radius: 6px;
}

.mt-ai-card__kb header {
  display: flex;
  gap: 5px;
  align-items: center;
  margin-bottom: 5px;
  font-size: 10.5px;
  font-weight: 700;
  color: #1c453c;
}

.mt-ai-card__kb header :deep(svg) {
  width: 12px;
  height: 12px;
  color: #087565;
}

.mt-ai-card__kb ul {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.mt-ai-card__kb li {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 10.5px;
}

.mt-ai-card__kb li a {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  color: #0b6e65;
  text-decoration: none;
  cursor: pointer;
}

.mt-ai-card__kb li a:hover {
  text-decoration: underline;
}

.mt-ai-card__kb li :deep(svg) {
  width: 11px;
  height: 11px;
  opacity: 0.7;
}

.mt-ai-card__kb li :deep(.ant-tag) {
  margin: 0 0 0 auto;
  font-size: 10px;
}

.mt-ai-card__footer {
  display: flex;
  gap: 6px;
  padding-top: 6px;
  margin-top: auto;
  border-top: 1px solid #f0e8d8;
}

/* ============== 工程师视图：工单列表（原卡片改为紧凑表格行） ============== */
.mt-list-wrap {
  overflow: hidden;
  background: #fff;
  border: 1px solid #e1ece7;
  border-radius: 12px;
}

/* 列表分页条 */
.mt-pagination {
  padding: 12px 14px;
  border-top: 1px solid #e1ece7;
}

.mt-list__head {
  display: grid;
  grid-template-columns: 1.8fr 0.7fr 0.8fr 1fr 1.5fr 1.2fr 0.9fr;
  gap: 10px;
  align-items: center;
  padding: 10px 14px;
  font-size: 11px;
  font-weight: 700;
  color: #5a756d;
  background: #f4f8f6;
  border-bottom: 1px solid #e1ece7;
}

.mt-card-grid {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.mt-ticket-card {
  display: grid;
  grid-template-columns: 1.8fr 0.7fr 0.8fr 1fr 1.5fr 1.2fr 0.9fr;
  gap: 10px;
  align-items: center;
  padding: 10px 14px;
  cursor: pointer;
  background: #fff;
  border: 0;
  border-top: 0;
  border-bottom: 1px solid #eef3f0;
  border-radius: 0;
  transition: background 0.1s;
}

.mt-ticket-card:hover {
  background: #f6fbf9;
  box-shadow: none;
  transform: none;
}

.mt-ticket-card:focus-visible {
  outline: none;
  background: #e8f5f0;
}

/* 优先级侧边条（用左侧 border 代替 top border） */
.mt-ticket-card.is-urgent {
  padding-left: 11px;
  border-top: 0;
  border-left: 3px solid #d4541f;
}

.mt-ticket-card.is-high {
  padding-left: 11px;
  border-top: 0;
  border-left: 3px solid #c9a43a;
}

.mt-ticket-card.is-medium {
  padding-left: 11px;
  border-top: 0;
  border-left: 3px solid #4ca87a;
}

.mt-ticket-card.is-low {
  padding-left: 11px;
  border-top: 0;
  border-left: 3px solid #c4d4cd;
}

.mt-ticket-card__head {
  display: flex;
  flex-direction: column;
  gap: 4px;
  justify-content: flex-start;
  min-width: 0;
}

.mt-ticket-card__code {
  display: inline-flex;
  flex-shrink: 0;
  gap: 4px;
  align-items: center;
}

.mt-ticket-card__code :deep(svg) {
  width: 12px;
  height: 12px;
  color: #087565;
}

.mt-ticket-card__code strong {
  font-size: 12px;
  color: #0c4a3f;
}

/* 第 1 列：标题（工单号下方） */
.mt-ticket-card__title {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
  color: #1c3e35;
  white-space: nowrap;
}

/* 第 2 列：工单类型（浅绿胶囊） */
.mt-ticket-card__col-type {
  display: inline-block;
  justify-self: start;
  padding: 2px 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11.5px;
  font-weight: 500;
  color: #355b51;
  white-space: nowrap;
  background: #f1f7f4;
  border-radius: 4px;
}

/* 第 3 列：工单状态 */
.mt-ticket-card__col-status {
  justify-self: start;
}

.mt-ticket-card__col-status :deep(.ant-tag) {
  margin: 0;
  font-size: 10.5px;
  white-space: nowrap;
}

/* 第 6 列：时效状态 + 剩余时间 */
.mt-ticket-card__col-sla {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.mt-ticket-card__col-sla :deep(.ant-tag) {
  width: fit-content;
  margin: 0;
  font-size: 10px;
  white-space: nowrap;
}

.mt-ticket-card__col-sla small {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 10.5px;
  color: #6c8780;
  white-space: nowrap;
}

/* 第 6 列：创建人 / 创建时间（我创建的附处理人） */
.mt-ticket-card__col-creator {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.mt-ticket-card__col-creator b {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11.5px;
  font-weight: 600;
  color: #1c3e35;
  white-space: nowrap;
}

.mt-ticket-card__col-creator small {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 10px;
  color: #81958e;
  white-space: nowrap;
}

.mt-ticket-card__meta {
  display: grid;
  grid-template-columns: 1fr;
  gap: 3px;
  min-width: 0;
  padding: 0;
  margin: 0;
  border-top: 0;
}

.mt-ticket-card__meta div {
  display: inline-flex;
  flex-direction: row;
  gap: 4px;
  align-items: center;
  min-width: 0;
  font-size: 11px;
  line-height: 1.4;
  color: #355b51;
}

.mt-ticket-card__meta dt {
  display: inline-flex;
  flex-shrink: 0;
  gap: 3px;
  align-items: center;
  justify-content: flex-start;
  min-width: 36px;
  font-size: 10px;
  color: #81958e;
}

.mt-ticket-card__meta dt :deep(svg) {
  width: 10px;
  height: 10px;
  opacity: 0.7;
}

.mt-ticket-card__meta dd {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px;
  font-weight: 500;
  color: #355b51;
  white-space: nowrap;
}

/* 第 7 列：查看详情 */
.mt-ticket-card__go {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #0b6e65;
  white-space: nowrap;
  opacity: 0.55;
  transition: opacity 0.15s;
}

.mt-ticket-card__go svg {
  width: 17px;
  height: 17px;
}

.mt-ticket-card:hover .mt-ticket-card__go {
  opacity: 1;
}

.mt-card-grid__empty {
  grid-column: unset;
  padding: 48px 0;
  font-size: 13px;
  color: #81958e;
  text-align: center;
}

.mt-card-grid__empty :deep(svg) {
  width: 28px;
  height: 28px;
  margin-right: 8px;
  vertical-align: middle;
  opacity: 0.4;
}

/* ==================== 确认接单弹窗 ==================== */
.am-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.am-info {
  padding: 14px 16px;
  background: #f7faf8;
  border: 1px solid #e3efe8;
  border-radius: 10px;
}

.am-info h3 {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 600;
  color: #17362e;
}

.am-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.am-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px 14px;
  margin: 0 0 12px;
}

.am-fields > div {
  display: flex;
  gap: 6px;
  min-width: 0;
  font-size: 12px;
}

.am-fields dt {
  flex: none;
  color: #8ba09a;
}

.am-fields dd {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #2c4a42;
  white-space: nowrap;
}

.am-desc h5 {
  margin: 0 0 4px;
  font-size: 12px;
  color: #40615a;
}

.am-desc p {
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: #2c4a42;
}

.am-ai {
  padding: 14px 16px;
  background: linear-gradient(160deg, #f2faf6, #eef7f3);
  border: 1px solid #d5e8de;
  border-radius: 10px;
}

.am-ai__head {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.am-ai__badge {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #0b6e65;
  background: #fff;
  border: 1px solid #bfe0d3;
  border-radius: 999px;
}

.am-ai__badge svg {
  width: 13px;
  height: 13px;
  color: #d5922c;
}

.am-ai__conf {
  font-size: 12px;
  color: #0b6e65;
}

.am-judge {
  display: grid;
  gap: 9px;
  padding: 12px 14px;
  margin: 0 0 12px;
  background: #fff;
  border-radius: 8px;
}

.am-judge > div {
  display: flex;
  gap: 12px;
  align-items: baseline;
  font-size: 12.5px;
}

.am-judge dt {
  flex: none;
  width: 58px;
  color: #8ba09a;
}

.am-judge dd {
  display: flex;
  gap: 6px;
  align-items: center;
  margin: 0;
  font-weight: 500;
  color: #17362e;
}

.am-judge dd small {
  color: #8ba09a;
}

.am-dot {
  flex: none;
  width: 8px;
  height: 8px;
  background: #3cb371;
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgb(60 179 113 / 15%);
}

.am-dot.is-gold {
  background: #e6a700;
  box-shadow: 0 0 0 3px rgb(230 167 0 / 15%);
}

.am-dot.is-orange {
  background: #e07a3f;
  box-shadow: 0 0 0 3px rgb(224 122 63 / 15%);
}

.am-basis-toggle {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 0;
  margin-bottom: 10px;
  font-size: 12px;
  color: #0b6e65;
  cursor: pointer;
  background: none;
  border: none;
}

.am-basis-toggle svg {
  width: 13px;
  height: 13px;
}

.am-basis {
  display: grid;
  gap: 8px;
  padding: 0;
  margin: 0 0 10px;
  list-style: none;
}

.am-basis li {
  padding: 8px 10px;
  background: #fff;
  border-radius: 8px;
}

.am-basis li strong {
  display: block;
  margin-bottom: 2px;
  font-size: 12px;
  color: #17362e;
}

.am-basis li p {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.65;
  color: #5f7a72;
}

.am-hint {
  display: flex;
  gap: 5px;
  align-items: center;
  margin: 0 0 12px;
  font-size: 11.5px;
  color: #8ba09a;
}

.am-hint svg {
  flex: none;
  width: 12px;
  height: 12px;
}

.am-actions {
  padding-top: 12px;
  border-top: 1px dashed #cfe4d9;
}

.am-transfer {
  margin: 10px 0 0;
  font-size: 12px;
  color: #8ba09a;
  text-align: center;
}

.am-transfer a {
  color: #0b6e65;
  cursor: pointer;
}

.am-transfer a:hover {
  text-decoration: underline;
}
</style>
