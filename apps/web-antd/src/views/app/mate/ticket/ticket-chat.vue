<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import type { ChatMsg, TicketTimelineEvent, WorkOrder } from '#/types/ticket';

import { computed, nextTick, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, Input, message, Select } from 'ant-design-vue';

import { mockMateEmployees } from '#/api/mock-data-mate';
import {
  aiReportAnalysis,
  aiReportSummary,
  aiReportUnderstanding,
  CURRENT_USER,
  engineers,
  getCaseDetailAdvice,
  mockChatScenarios,
  mockFlowGraph,
  mockKnowledgeArticles,
  mockWorkOrders,
  resolveFlowTransition,
  slaStatusLabel,
  ticketPriorityLabel,
  ticketStatusLabel,
} from '#/api/mock-data-ticket';
import { createWorkOrderApi } from '#/api/ticket';

import InspectionActionCard from './components/inspection-action-card.vue';
import InspectionActivateCard from './components/inspection-activate-card.vue';
import InspectionCreateCard from './components/inspection-create-card.vue';

const route = useRoute();
const router = useRouter();
const draft = ref('');
const scroller = ref<HTMLElement>();
const submitting = ref(false);
const inspectionCardId = ref('');
const inspectionInput = ref('');
const inspectionPlanInput = ref('');

const employeeId = computed(() =>
  String(route.params.employeeId || 'ticket-assistant'),
);
const employee = computed(
  () =>
    mockMateEmployees.find((item) => item.id === employeeId.value) ||
    mockMateEmployees[0]!,
);

/** 根据当前数字员工加载预置对话场景 */
function loadScenario(): ChatMsg[] {
  const scenario = mockChatScenarios[employeeId.value];
  return scenario ? scenario.map((msg) => ({ ...msg })) : [];
}

const messages = ref<ChatMsg[]>(loadScenario());

// 表单：售后报修信息采集
const reportForm = ref({
  deviceCode: '',
  customer: '',
  contact: '',
  phone: '',
  fault: '',
  reproduce: '',
  environment: '',
  priority: 'medium' as 'high' | 'low' | 'medium' | 'urgent',
});

// 表单：工单创建
const ticketForm = ref({
  title: '',
  type: '设备故障',
  device: '',
  customer: '',
  contact: '',
  phone: '',
  priority: 'medium' as 'high' | 'low' | 'medium' | 'urgent',
  description: '',
  category: 'external' as 'external' | 'internal',
});

const intro = computed(() => {
  switch (employeeId.value) {
    case 'fill-assistant': {
      return `你好 ${CURRENT_USER.name}，我是填报助理数字员工。我可以帮你为处理中的工单创建上门申请单：补充上门时间与事由后自动填报并同步调度中心。`;
    }
    case 'ticket-assistant': {
      return `你好 ${CURRENT_USER.name}，我是工单助理数字员工。用一句话描述现场问题，我会自动识别客户、设备与问题类型，整理成结构化工单——AI 生成后由你确认，不会自动提交。`;
    }
    default: {
      return '你好，我是数字员工。';
    }
  }
});

const quickActions = computed<Array<[string, string]>>(() => {
  switch (employeeId.value) {
    case 'fill-assistant': {
      return [
        ['帮我创建上门申请单', 'onsite-request'],
        ['查看我的工单', '/app/mate/employee/ticket-assistant/my-tickets'],
      ];
    }
    case 'ticket-assistant': {
      return [
        ['创建巡检计划', 'inspection-create'],
        ['一句话报修（AI 建单）', 'ai-report'],
        [
          '管理巡检计划',
          '/app/mate/employee/ticket-assistant/inspection-plans',
        ],
        ['查看我的工单', '/app/mate/employee/ticket-assistant/my-tickets'],
      ];
    }
    default: {
      return [];
    }
  }
});

// ============ AI 一句话报修流程（理解 → 摘要确认 → 后台补全 → 派单） ============

const aiFlow = ref({
  /** AI 理解中卡片的消息 id */
  msgId: '',
  /** 已揭示的识别条目数 */
  revealed: 0,
  /** 流程阶段 */
  stage: 'idle' as 'idle' | 'submitted' | 'summary' | 'understanding',
  /** 用户的一句话原文 */
  draftText: '',
  /** 确认后生成的工单编号 / id */
  createdCode: '',
  createdId: '',
});

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 发起 AI 一句话报修：理解动画 → 问题摘要卡 */
async function startAiReport(text: string) {
  pushMsg({
    id: `user-${Date.now()}`,
    role: 'user',
    content: text,
    time: '刚刚',
  });
  const msgId = `assistant-${Date.now()}`;
  aiFlow.value = {
    msgId,
    revealed: 0,
    stage: 'understanding',
    draftText: text,
    createdCode: '',
    createdId: '',
  };
  pushMsg({
    id: msgId,
    role: 'assistant',
    content: '收到，我来帮你把问题说清楚——正在理解你描述的问题…',
    time: '刚刚',
    card: 'ai-understanding',
  });
  await scrollBottom();
  for (let i = 0; i < aiReportUnderstanding.length; i++) {
    await delay(650);
    aiFlow.value.revealed = i + 1;
    await scrollBottom();
  }
  await delay(500);
  aiFlow.value.stage = 'summary';
  pushMsg({
    id: `assistant-${Date.now()}`,
    role: 'assistant',
    content:
      'AI 已整理好问题摘要。请确认无误后生成工单——AI 不会自动提交，你可以随时修改。',
    time: '刚刚',
    card: 'ai-summary',
  });
  await scrollBottom();
}

/** 确认生成工单（AI 生成 ≠ 自动提交，此步由一线人员触发） */
async function confirmAiTicket() {
  if (aiFlow.value.stage !== 'summary') return;
  submitting.value = true;
  const text = aiFlow.value.draftText;
  const created = await createWorkOrderApi({
    title: 'XX连锁门店高速扫描仪频繁卡纸',
    type: '设备故障',
    device: '高速文档扫描仪 DS-520（SN: DS520-0231）',
    customer: 'XX连锁门店',
    contact: '李店长',
    phone: '137****6688',
    priority: 'high',
    description: `${text}\n\n【AI 摘要】问题现象：${aiReportSummary.phenomenon}影响范围：${aiReportSummary.impact}初步判断：${aiReportSummary.judge}`,
    category: 'external',
  });
  aiFlow.value.createdCode = created.data?.code || '';
  aiFlow.value.createdId = created.data?.id || '';
  aiFlow.value.stage = 'submitted';
  submitting.value = false;
  pushMsg({
    id: `assistant-${Date.now()}`,
    role: 'assistant',
    content: `工单 ${created.data?.code} 已生成，我正在后台补全分析…`,
    time: '刚刚',
    card: 'ai-analysis',
    ticketCode: created.data?.code,
  });
  await scrollBottom();
}

/** 修改问题描述：把原文回填输入框 */
function editAiReport() {
  draft.value = aiFlow.value.draftText;
}

const pendingOrders = computed(() =>
  mockWorkOrders.filter((item) => item.status === 'pending'),
);

/** 后台分析：原因合计（用于分布条形比例） */
const analysisTotal = computed(() =>
  aiReportAnalysis.causes.reduce((n, c) => n + c.count, 0),
);

/** 对话历史列表（按数字员工区分） */
const chatHistory = computed(() => {
  switch (employeeId.value) {
    case 'after-sales-service': {
      return [
        {
          icon: 'lucide:check',
          title: '华达 A1 打印卷曲报修',
          time: '今天',
          active: true,
        },
        {
          icon: 'lucide:message-square',
          title: '中粮 B2 贴标偏移咨询',
          time: '昨天',
        },
        {
          icon: 'lucide:message-square',
          title: '辉承 C3 保养规范咨询',
          time: '08-13',
        },
      ];
    }
    case 'dispatch-assistant': {
      return [
        {
          icon: 'lucide:check',
          title: '紧急工单派单（陈宇）',
          time: '今天',
          active: true,
        },
        {
          icon: 'lucide:message-square',
          title: '华达 A1 工单转派',
          time: '昨天',
        },
        {
          icon: 'lucide:message-square',
          title: '批量派单（3 单）',
          time: '08-14',
        },
      ];
    }
    case 'ticket-assistant': {
      return [
        {
          icon: 'lucide:check',
          title: '宁德 D4 检测相机故障建单',
          time: '今天',
          active: true,
        },
        {
          icon: 'lucide:message-square',
          title: '华达 F6 联机失败建单',
          time: '昨天',
        },
        {
          icon: 'lucide:message-square',
          title: '中粮 E5 急停故障建单',
          time: '08-14',
        },
      ];
    }
    default: {
      return [
        {
          icon: 'lucide:check',
          title: '本次服务会话',
          time: '今天',
          active: true,
        },
        { icon: 'lucide:message-square', title: '上一次咨询', time: '昨天' },
      ];
    }
  }
});

function pushMsg(msg: ChatMsg) {
  messages.value.push(msg);
}

async function scrollBottom() {
  await nextTick();
  if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight;
}

async function performAction(id: string, inspectionContent = '') {
  if (id.startsWith('/')) {
    await router.push(id);
    return;
  }

  if (id === 'inspection-create') {
    if (route.query.planId) await router.replace({ query: {} });
    if (inspectionCardId.value) {
      message.info('请先完成或取消当前巡检计划收集');
      await scrollBottom();
      return;
    }
    inspectionInput.value = inspectionContent;
    pushMsg({
      id: `inspection-user-${Date.now()}`,
      role: 'user',
      content: inspectionContent || '创建巡检计划',
      time: '刚刚',
    });
    inspectionCardId.value = `inspection-card-${Date.now()}`;
    pushMsg({
      id: inspectionCardId.value,
      role: 'assistant',
      card: 'inspection-create',
      content: inspectionContent
        ? '已收集本次发送的合同信息，请点击巡检计划确认卡片，在抽屉中确认首次巡检日期和负责人后保存草稿。'
        : '已模拟提供一份智能收单机运维合同，合同名称、客户、服务期限和巡检频次将自动填充。请点击下方卡片，仅需填写首次巡检日期和负责人。',
      time: '刚刚',
    });
    await scrollBottom();
    return;
  }

  if (id === 'ai-report') {
    await startAiReport(
      'XX门店的高速扫描仪今天上午开始频繁卡纸，取出卡纸后继续扫描还是卡。',
    );
    return;
  }

  if (id === 'onsite-request') {
    // 快捷入口：带入上下文工单发起上门申请（无上下文则提示提供工单号）
    const order = chatTicketCode.value
      ? mockWorkOrders.find((o) => o.code === chatTicketCode.value)
      : undefined;
    pushMsg({
      id: `user-${Date.now()}`,
      role: 'user',
      content: '帮我创建上门申请单',
      time: '刚刚',
    });
    if (order) {
      await handleOnsite(`帮我创建上门申请单（工单 ${order.code}）`, order);
    } else {
      pushMsg({
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content:
          '好的，请告诉我要创建上门申请单的工单编号（如 WO-20261004001），我来帮你填报。',
        time: '刚刚',
      });
      await scrollBottom();
    }
    return;
  }

  if (id === 'report-collect') {
    pushMsg({
      id: `user-${Date.now()}`,
      role: 'user',
      content: '我要报修设备',
      time: '刚刚',
    });
    pushMsg({
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content:
        '好的，我将引导你采集报修信息。请填写下方信息采集卡，关键字段齐全后我会基于知识库给出处置建议，并可直接生成工单。',
      time: '刚刚',
      card: 'report-collect',
    });
    await scrollBottom();
    return;
  }

  if (id === 'ticket-create') {
    pushMsg({
      id: `user-${Date.now()}`,
      role: 'user',
      content: '创建工单',
      time: '刚刚',
    });
    pushMsg({
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content:
        '好的，我会引导你创建工单。请填写下方工单信息卡，提交后工单将进入待派单池，由派单助理分派给合适的工程师。',
      time: '刚刚',
      card: 'ticket-create',
    });
    await scrollBottom();
    return;
  }

  if (id === 'dispatch-list') {
    pushMsg({
      id: `user-${Date.now()}`,
      role: 'user',
      content: '查看待派工单',
      time: '刚刚',
    });
    pushMsg({
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: `当前共 ${pendingOrders.value.length} 张待派工单，已按优先级与 SLA 临期程度排序，请选择派单目标：`,
      time: '刚刚',
      card: 'dispatch-list',
    });
    await scrollBottom();
    return;
  }

  if (id === 'kb-list') {
    pushMsg({
      id: `user-${Date.now()}`,
      role: 'user',
      content: '查看故障排查指南',
      time: '刚刚',
    });
    const article = mockKnowledgeArticles[0];
    pushMsg({
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: `已为你匹配知识库《${article?.title}》，可直接查看排查步骤：`,
      time: '刚刚',
      card: 'kb-answer',
      kbArticleId: article?.id,
    });
    await scrollBottom();
    return;
  }

  if (id === 'query-device') {
    message.info(
      '请客户提供设备铭牌上的编号（如 EQ-1001），我会在报修时自动带出设备信息。',
    );
    return;
  }

  if (id === 'suggest-engineer') {
    const idle = [...engineers].toSorted((a, b) => a.workload - b.workload)[0];
    message.info(
      `建议派给 ${idle?.name}（${idle?.role}），当前负荷最低（${idle?.workload} 单在处理）。`,
    );
  }
}

async function submitReport() {
  if (
    !reportForm.value.deviceCode ||
    !reportForm.value.customer ||
    !reportForm.value.fault
  ) {
    message.warning('请至少填写设备编号、客户和故障现象');
    return;
  }
  submitting.value = true;
  const targetId = (() => {
    if (
      reportForm.value.fault.includes('卷曲') ||
      reportForm.value.deviceCode.includes('1001')
    )
      return 'kb-1';
    if (reportForm.value.fault.includes('联机')) return 'kb-2';
    if (reportForm.value.fault.includes('偏移')) return 'kb-3';
    return '';
  })();
  const matched = mockKnowledgeArticles.find((item) => item.id === targetId);
  pushMsg({
    id: `user-${Date.now()}`,
    role: 'user',
    content: `已提交报修信息：\n设备：${reportForm.value.deviceCode} · ${reportForm.value.customer}\n故障：${reportForm.value.fault}\n复现条件：${reportForm.value.reproduce || '—'}\n现场环境：${reportForm.value.environment || '—'}`,
    time: '刚刚',
  });
  const created = await createWorkOrderApi({
    title: `${reportForm.value.customer} ${reportForm.value.fault}`,
    type: '设备故障',
    device: reportForm.value.deviceCode,
    customer: reportForm.value.customer,
    contact: reportForm.value.contact,
    phone: reportForm.value.phone,
    priority: reportForm.value.priority,
    description: `${reportForm.value.fault}\n复现条件：${reportForm.value.reproduce}\n现场环境：${reportForm.value.environment}`,
    category: 'external',
  });
  pushMsg({
    id: `assistant-${Date.now()}`,
    role: 'assistant',
    content: `已为你生成工单 ${created.data?.code}，状态：待派单。${
      matched
        ? `基于知识库匹配到《${matched.title}》，建议现场先按排查指南处置：`
        : ''
    }`,
    time: '刚刚',
    card: matched ? 'kb-answer' : undefined,
    kbArticleId: matched?.id,
    ticketCode: created.data?.code,
  });
  reportForm.value = {
    deviceCode: '',
    customer: '',
    contact: '',
    phone: '',
    fault: '',
    reproduce: '',
    environment: '',
    priority: 'medium',
  };
  submitting.value = false;
  await scrollBottom();
}

async function submitTicket() {
  if (!ticketForm.value.title || !ticketForm.value.customer) {
    message.warning('请至少填写工单标题和客户');
    return;
  }
  submitting.value = true;
  const created = await createWorkOrderApi({
    title: ticketForm.value.title,
    type: ticketForm.value.type,
    device: ticketForm.value.device,
    customer: ticketForm.value.customer,
    contact: ticketForm.value.contact,
    phone: ticketForm.value.phone,
    priority: ticketForm.value.priority,
    description: ticketForm.value.description,
    category: ticketForm.value.category,
  });
  pushMsg({
    id: `user-${Date.now()}`,
    role: 'user',
    content: `提交工单：${ticketForm.value.title}（${ticketForm.value.customer}）`,
    time: '刚刚',
  });
  pushMsg({
    id: `assistant-${Date.now()}`,
    role: 'assistant',
    content: `工单 ${created.data?.code} 已创建成功，状态：待派单。你可以前往「我的工单」跟踪进度，或继续补充信息。`,
    time: '刚刚',
    ticketCode: created.data?.code,
  });
  ticketForm.value = {
    title: '',
    type: '设备故障',
    device: '',
    customer: '',
    contact: '',
    phone: '',
    priority: 'medium',
    description: '',
    category: 'external',
  };
  submitting.value = false;
  await scrollBottom();
}

function gotoMyTickets() {
  void router.push('/app/mate/employee/ticket-assistant/my-tickets');
}

// ============ 工单详情带入的操作上下文（帮我接单 / 帮我转派等） ============

/** 从工单详情页带入的工单编号（用于后续对话定位工单） */
const chatTicketCode = ref('');
/** 转派追问：等待用户补充承接人的工单编号 */
const pendingTransferCode = ref('');
/** 上门申请追问：等待用户补充上门时间的工单编号 */
const pendingOnsiteCode = ref('');
/** 验收登记追问：等待用户确认验收结果的工单编号 */
const pendingAcceptanceCode = ref('');
/** 处理结果追问：等待用户补充解决方案的工单编号 */
const pendingCompleteCode = ref('');
/** 处理结果追问：用户已补充的解决方案文本 */
const pendingCompleteSolution = ref('');

async function applyRouteContext() {
  const q = route.query;
  const prefill = typeof q.prefill === 'string' ? q.prefill : '';
  const code = typeof q.ticketCode === 'string' ? q.ticketCode : '';
  if (code) chatTicketCode.value = code;
  if (
    employeeId.value === 'ticket-assistant' &&
    ['adjust', 'draft', 'enable', 'pause', 'report', 'resume', 'stop'].includes(
      String(q.action),
    ) &&
    typeof q.planId === 'string'
  ) {
    inspectionCardId.value = '';
    inspectionInput.value = '';
    inspectionPlanInput.value = '';
    draft.value = '';
    messages.value = [
      {
        id: `enable-user-${Date.now()}`,
        role: 'user',
        content:
          prefill ||
          `请帮我${({ enable: '启用', adjust: '调整', draft: '编辑草稿', pause: '暂停', resume: '恢复', report: '填报', stop: '终止' } as Record<string, string>)[String(q.action)]}巡检计划 ${q.planId}`,
        time: '刚刚',
      },
      {
        id: `enable-card-${Date.now()}`,
        role: 'assistant',
        content: ['adjust', 'draft', 'enable'].includes(String(q.action))
          ? '请核对当前计划信息。执行安排、设备和巡检模板可在确认抽屉中补充或调整。'
          : '已定位当前巡检计划，请确认下方操作；已有工单的设备与检查事项保持不变。',
        card: ['adjust', 'draft', 'enable'].includes(String(q.action))
          ? 'inspection-enable'
          : 'inspection-action',
        inspectionAction: String(q.action),
        inspectionPlanId: q.planId,
        time: '刚刚',
      },
    ];
    await scrollBottom();
    return;
  }
  const inspectionContext =
    typeof q.inspectionContext === 'string' ? q.inspectionContext : '';
  const isInspection =
    employeeId.value === 'ticket-assistant' &&
    (q.intent === 'inspection-create' ||
      (!q.planId && /(?:创建|制订|制定).*巡检计划/.test(prefill)));
  if (isInspection && (inspectionContext || prefill)) {
    inspectionCardId.value = '';
    inspectionInput.value = '';
    inspectionPlanInput.value = '';
    draft.value = prefill || inspectionContext;
    messages.value = [];
    await scrollBottom();
  } else if (prefill) draft.value = prefill;
}

/** 定位对话上下文中的工单：优先详情页带入的编号，其次从消息文本解析工单号 */
function findChatOrder(content: string): undefined | WorkOrder {
  if (chatTicketCode.value) {
    const ctx = mockWorkOrders.find((o) => o.code === chatTicketCode.value);
    if (ctx) return ctx;
  }
  const m = content.match(/WO-[\w-]+/);
  return m ? mockWorkOrders.find((o) => o.code === m[0]) : undefined;
}

function nowLabel() {
  return new Date().toISOString().replace('T', ' ').slice(0, 16);
}

function pushTimelineEvent(
  order: WorkOrder,
  event: Omit<TicketTimelineEvent, 'id'>,
) {
  const tl: TicketTimelineEvent = {
    id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ...event,
  };
  if (!order.timeline) order.timeline = [];
  order.timeline.push(tl);
}

/** 自动接单：待接单 → 处理中，并给出解决方案与下一步建议 */
async function handleAccept(order: WorkOrder) {
  if (order.status !== 'dispatched' && order.status !== 'pending') {
    pushMsg({
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: `工单 ${order.code} 当前状态为「${ticketStatusLabel[order.status]}」，无需重复接单。如已完成排查，可回复「提交处理结果」。`,
      time: '刚刚',
    });
    await scrollBottom();
    return;
  }
  const t = nowLabel();
  if (order.currentNodeId) {
    const nextId = resolveFlowTransition(
      mockFlowGraph,
      order.currentNodeId,
      '确认接单',
    );
    if (nextId) order.currentNodeId = nextId;
  }
  order.status = 'processing';
  pushTimelineEvent(order, {
    action: 'started',
    time: t,
    operator: CURRENT_USER.name,
    operatorId: CURRENT_USER.id,
    summary: `${CURRENT_USER.name} 通过工单助理确认接单，工单进入处理中`,
  });
  message.success(`${order.code} 已接单，进入处理中`);
  pushMsg({
    id: `assistant-${Date.now()}`,
    role: 'assistant',
    content: `已完成自动接单：工单 ${order.code} 状态由「待接单」流转至「处理中」，处理人 ${order.assignee ?? CURRENT_USER.name}，SLA ${order.slaRemaining ?? '正常计时'}。`,
    time: '刚刚',
  });
  await delay(400);
  const advice = getCaseDetailAdvice(order.id);
  if (advice) {
    pushMsg({
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: `基于相似历史工单与设备知识库，我为你准备了处理参考（AI 置信度 ${advice.confidence}%，${advice.confidenceBasis}）：\n【故障判断】${advice.judge}\n【推荐方案】${advice.plan}\n${advice.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
      time: '刚刚',
    });
    await delay(400);
  }
  pushMsg({
    id: `assistant-${Date.now()}`,
    role: 'assistant',
    content:
      '下一步建议：现场按上述方案完成排查与处理后，回复「提交处理结果」，我会帮你录入原因与解决方案、附上验收材料，并将工单流转至待验收。',
    time: '刚刚',
  });
  await scrollBottom();
}

/** 自动转派：检查消息中是否提供了承接人，未提供则追问 */
async function handleTransfer(content: string, order?: WorkOrder) {
  const target = order ?? findChatOrder(content);
  if (!target) {
    pendingTransferCode.value = '';
    pushMsg({
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content:
        '请告诉我要转派的工单编号（如 WO-20261004001），我再帮你办理转派。',
      time: '刚刚',
    });
    await scrollBottom();
    return;
  }
  const mentioned = engineers.filter((e) => content.includes(e.name));
  const candidate = mentioned.find((e) => e.name !== target.assignee);
  if (!candidate) {
    pendingTransferCode.value = target.code;
    const idle = [...engineers].toSorted((a, b) => a.workload - b.workload)[0];
    const hint =
      mentioned.length > 0
        ? `${mentioned[0]!.name} 是该工单当前处理人，请换一位承接人`
        : '请补充转派承接人';
    pushMsg({
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: `收到，你要转派工单 ${target.code}（${target.title}）。${hint}（当前处理人：${target.assignee ?? '—'}）。当前负荷最低的是 ${idle?.name}（${idle?.role}，${idle?.workload} 单在处理），可直接回复工程师姓名，例如「转派给${idle?.name}」。`,
      time: '刚刚',
    });
    await scrollBottom();
    return;
  }
  const t = nowLabel();
  const fromName = target.assignee;
  target.assigneeId = candidate.id;
  target.assignee = candidate.name;
  target.slaResetAt = t;
  if (!target.transferHistory) target.transferHistory = [];
  target.transferHistory.push({
    id: `th-${Date.now()}`,
    fromAssignee: fromName,
    fromAssigneeId:
      engineers.find((e) => e.name === fromName)?.id ?? CURRENT_USER.id,
    operator: CURRENT_USER.name,
    operatorId: CURRENT_USER.id,
    reason: '工单助理会话中发起转派，由数字员工自动办理',
    time: t,
    toAssignee: candidate.name,
    toAssigneeId: candidate.id,
  });
  pushTimelineEvent(target, {
    action: 'transferred',
    time: t,
    operator: CURRENT_USER.name,
    operatorId: CURRENT_USER.id,
    summary: `${CURRENT_USER.name} 将工单转派给 ${candidate.name}（${candidate.role}）`,
    reason: '工单助理会话中确认转派',
  });
  pendingTransferCode.value = '';
  message.success(`${target.code} 已转派给 ${candidate.name}`);
  pushMsg({
    id: `assistant-${Date.now()}`,
    role: 'assistant',
    content: `已完成自动转派：工单 ${target.code} 处理人由 ${fromName ?? '—'} 变更为 ${candidate.name}（${candidate.role}），SLA 已重新计时。${candidate.name} 将收到交接通知，包含问题描述与故障附件。`,
    time: '刚刚',
  });
  await scrollBottom();
}

/** 提交处理结果：处理中 → 待验收。需用户依次补充解决方案、确认上传附件后才会流转 */
async function handleComplete(content: string, order?: WorkOrder) {
  const target = order ?? findChatOrder(content);
  if (!target) {
    pendingCompleteCode.value = '';
    pendingCompleteSolution.value = '';
    pushMsg({
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content:
        '请告诉我要提交处理结果的工单编号（如 WO-20261004001），我来帮你整理验收材料。',
      time: '刚刚',
    });
    await scrollBottom();
    return;
  }
  if (target.status !== 'processing' && target.status !== 'onsite-processing') {
    pendingCompleteCode.value = '';
    pendingCompleteSolution.value = '';
    pushMsg({
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: `工单 ${target.code} 当前状态为「${ticketStatusLabel[target.status]}」，暂不能提交处理结果。`,
      time: '刚刚',
    });
    await scrollBottom();
    return;
  }
  const mentionsAttachment =
    content.includes('附件') ||
    content.includes('已上传') ||
    content.includes('上传了') ||
    content.includes('已拍照');
  // 追问第二步：方案已记录，等待附件确认
  if (pendingCompleteSolution.value) {
    if (!mentionsAttachment) {
      pushMsg({
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content:
          '还没有收到附件确认。请在聊天中上传处理照片或复测截图，然后回复「已上传附件」；取消请回复「取消」。',
        time: '刚刚',
      });
      await scrollBottom();
      return;
    }
    await submitComplete(target, pendingCompleteSolution.value);
    pendingCompleteCode.value = '';
    pendingCompleteSolution.value = '';
    return;
  }
  // 追问第一步：必须先补充解决方案
  if (mentionsAttachment) {
    pushMsg({
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: `收到，要为工单 ${target.code} 提交处理结果。请先补充解决方案（问题原因与处理措施），例如「更换进纸辊并校准纸张传感器，连续扫描 200 页验证正常」，我会帮你整理验收材料。`,
      time: '刚刚',
    });
    pendingCompleteCode.value = target.code;
    await scrollBottom();
    return;
  }
  pendingCompleteCode.value = target.code;
  pendingCompleteSolution.value = content;
  pushMsg({
    id: `assistant-${Date.now()}`,
    role: 'assistant',
    content: `已记录解决方案，接下来请上传处理凭证附件（现场照片、复测截图等），完成后回复「已上传附件」，我会随验收材料一并提交；取消请回复「取消」。`,
    time: '刚刚',
  });
  await scrollBottom();
}

/** 流转执行：写入解决方案与验收附件，处理中 → 待验收 */
async function submitComplete(target: WorkOrder, solution: string) {
  const t = nowLabel();
  const advice = getCaseDetailAdvice(target.id);
  target.rootCause = advice?.judge ?? '现场排查确认设备进纸组件磨损';
  target.solution = solution;
  target.acceptanceAttachments = [
    {
      id: `acc-${Date.now()}-1`,
      name: '复测样品扫描件.jpg',
      type: 'image',
      size: '2.1 MB',
      uploader: CURRENT_USER.name,
      uploaderId: CURRENT_USER.id,
      uploadedAt: t,
      note: '处理后连续扫描 200 页，无卡纸、无偏移',
    },
    {
      id: `acc-${Date.now()}-2`,
      name: '设备正常运行截图.png',
      type: 'screenshot',
      size: '540 KB',
      uploader: CURRENT_USER.name,
      uploaderId: CURRENT_USER.id,
      uploadedAt: t,
      note: '设备无报错，走纸顺畅',
    },
  ];
  target.completedAt = t;
  target.slaRemaining = '待客户验收';
  if (target.currentNodeId) {
    const nextId = resolveFlowTransition(
      mockFlowGraph,
      target.currentNodeId,
      '记录处理结果',
    );
    if (nextId) target.currentNodeId = nextId;
  }
  target.status = 'pending-acceptance';
  pushTimelineEvent(target, {
    action: 'completed',
    time: t,
    operator: CURRENT_USER.name,
    operatorId: CURRENT_USER.id,
    summary: `${CURRENT_USER.name} 完成处理并提交验收材料（2 件），进入待验收`,
    reason: solution,
    extra: { acceptanceCount: '2' },
  });
  message.success(`${target.code} 已提交处理结果，等待客户验收`);
  pushMsg({
    id: `assistant-${Date.now()}`,
    role: 'assistant',
    content: `已为工单 ${target.code} 提交处理结果：\n【问题原因】${target.rootCause}\n【解决方案】${solution}\n【验收材料】复测样品扫描件.jpg、设备正常运行截图.png\n工单已流转至「待验收」。下一步建议在工单详情回复「登记验收结果」，跟进客户（${target.contact ?? '客户'}）完成验收确认。`,
    time: '刚刚',
  });
  await scrollBottom();
}

/** 确认出发：待上门调度 → 上门处理中 */
async function handleDepart(order: WorkOrder) {
  const t = nowLabel();
  if (order.currentNodeId) {
    const nextId = resolveFlowTransition(
      mockFlowGraph,
      order.currentNodeId,
      '确认出发',
    );
    if (nextId) order.currentNodeId = nextId;
  }
  order.status = 'onsite-processing';
  pushTimelineEvent(order, {
    action: 'dispatched',
    time: t,
    operator: CURRENT_USER.name,
    operatorId: CURRENT_USER.id,
    summary: `${CURRENT_USER.name} 通过工单助理确认出发，前往现场处理，工单进入上门处理中`,
  });
  message.success(`${order.code} 已确认出发，进入上门处理中`);
  pushMsg({
    id: `assistant-${Date.now()}`,
    role: 'assistant',
    content: `已为工单 ${order.code} 确认出发，工单进入「上门处理中」。到达现场后记得打卡，处理完成后回复「提交处理结果」，我会帮你整理验收材料。`,
    time: '刚刚',
  });
  await scrollBottom();
}

/** 创建上门申请单：检查是否提供上门时间，未提供则追问；完成后工单进入待上门处理 */
async function handleOnsite(content: string, order?: WorkOrder) {
  const target = order ?? findChatOrder(content);
  if (!target) {
    pendingOnsiteCode.value = '';
    pushMsg({
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content:
        '请告诉我要创建上门申请单的工单编号（如 WO-20261004001），我来帮你填报。',
      time: '刚刚',
    });
    await scrollBottom();
    return;
  }
  if (target.status !== 'processing' && target.status !== 'onsite-processing') {
    pendingOnsiteCode.value = '';
    pushMsg({
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: `工单 ${target.code} 当前状态为「${ticketStatusLabel[target.status]}」，暂无需申请上门。`,
      time: '刚刚',
    });
    await scrollBottom();
    return;
  }
  // 时间信息判定：今天/明天/上午/下午/周几/具体钟点等
  const timeRe =
    /今天|明天|后天|上午|下午|傍晚|晚上|周[一二三四五六日末]|星期[一二三四五六日末]|\d{1,2}\s*[点:：]|\d{1,2}\s*[日号]/;
  if (!timeRe.test(content)) {
    pendingOnsiteCode.value = target.code;
    pushMsg({
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: `收到，要为工单 ${target.code}（${target.title}）创建上门申请单。请补充计划上门时间与事由，例如「明天上午 10 点，现场复测进纸组件」；取消请回复「取消」。`,
      time: '刚刚',
    });
    await scrollBottom();
    return;
  }
  const t = nowLabel();
  if (target.currentNodeId) {
    const nextId = resolveFlowTransition(
      mockFlowGraph,
      target.currentNodeId,
      '申请上门',
    );
    if (nextId) target.currentNodeId = nextId;
  }
  target.status = 'pending-visit';
  pushTimelineEvent(target, {
    action: 'dispatched',
    time: t,
    operator: CURRENT_USER.name,
    operatorId: CURRENT_USER.id,
    summary: `${CURRENT_USER.name} 通过填报助理创建上门申请单，工单进入待上门处理`,
    reason: content,
  });
  pendingOnsiteCode.value = '';
  message.success(`${target.code} 上门申请单已创建，进入待上门处理`);
  pushMsg({
    id: `assistant-${Date.now()}`,
    role: 'assistant',
    content: `上门申请单已创建完成：工单 ${target.code} 状态流转至「待上门处理」。\n【申请单信息】${content}\n申请单已同步调度中心，调度确认后你可以在工单详情回复「确认出发」，我会帮你办理出发登记。`,
    time: '刚刚',
  });
  await scrollBottom();
}

/** 登记验收结果：通过 → 已完成；不通过 → 处理中（退回处理人重新处理） */
async function handleAcceptance(content: string, order?: WorkOrder) {
  const target = order ?? findChatOrder(content);
  if (!target) {
    pendingAcceptanceCode.value = '';
    pushMsg({
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content:
        '请告诉我要登记验收结果的工单编号（如 WO-20261004001），我来帮你办理。',
      time: '刚刚',
    });
    await scrollBottom();
    return;
  }
  if (target.status !== 'pending-acceptance') {
    pendingAcceptanceCode.value = '';
    pushMsg({
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: `工单 ${target.code} 当前状态为「${ticketStatusLabel[target.status]}」，暂不在验收环节。`,
      time: '刚刚',
    });
    await scrollBottom();
    return;
  }
  const isReject = content.includes('不通过') || content.includes('退回');
  const isPass = !isReject && content.includes('通过');
  if (!isPass && !isReject) {
    pendingAcceptanceCode.value = target.code;
    pushMsg({
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: `收到，要为工单 ${target.code}（${target.title}）登记验收结果。请回复「验收通过 + 客户确认意见」或「验收不通过 + 原因说明」；取消请回复「取消」。`,
      time: '刚刚',
    });
    await scrollBottom();
    return;
  }
  const t = nowLabel();
  if (isPass) {
    if (target.scenario === '运维工单' && target.currentNodeId) {
      target.currentNodeId = 'fn-8';
      target.slaRemaining = '已完成';
    } else {
      target.slaRemaining = '已按时完成';
    }
    target.status = 'completed';
    pushTimelineEvent(target, {
      action: 'accepted',
      time: t,
      operator: CURRENT_USER.name,
      operatorId: CURRENT_USER.id,
      summary: `${CURRENT_USER.name} 验收通过，工单已完成`,
      reason: content,
    });
    pendingAcceptanceCode.value = '';
    message.success(`${target.code} 验收通过，工单已完成`);
    pushMsg({
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: `已为工单 ${target.code} 登记验收通过，工单状态流转至「已完成」，本次处理闭环。验收意见已记录到流转历史；如需将本次处理沉淀为知识案例，随时告诉我。`,
      time: '刚刚',
    });
  } else {
    if (target.scenario === '运维工单' && target.currentNodeId) {
      target.currentNodeId = 'fn-10';
    }
    target.status = 'processing';
    target.slaRemaining = '验收退回，重新处理中';
    pushTimelineEvent(target, {
      action: 'note',
      time: t,
      operator: CURRENT_USER.name,
      operatorId: CURRENT_USER.id,
      summary: `${CURRENT_USER.name} 验收不通过，工单退回处理人重新处理`,
      reason: content,
    });
    pendingAcceptanceCode.value = '';
    message.warning(`${target.code} 已退回处理人重新处理`);
    pushMsg({
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: `已为工单 ${target.code} 登记验收不通过，工单退回处理人 ${target.assignee ?? '—'} 重新处理，退回原因已记录到流转历史。补充处理后回复「提交处理结果」，我会帮你重新整理验收材料。`,
      time: '刚刚',
    });
  }
  await scrollBottom();
}

async function send() {
  const content = draft.value.trim();
  if (!content) return;
  draft.value = '';
  if (
    employeeId.value === 'ticket-assistant' &&
    typeof route.query.planId === 'string' &&
    ['adjust', 'draft', 'enable'].includes(String(route.query.action)) &&
    !/创建巡检计划/.test(content)
  ) {
    inspectionPlanInput.value = content;
    pushMsg({
      id: `plan-input-${Date.now()}`,
      role: 'user',
      content,
      time: '刚刚',
    });
    pushMsg({
      id: `plan-input-reply-${Date.now()}`,
      role: 'assistant',
      content:
        '已把明确提供的字段补充到当前计划确认卡片，请打开抽屉核对并确认。',
      time: '刚刚',
    });
    await scrollBottom();
    return;
  }
  if (
    employeeId.value === 'ticket-assistant' &&
    /启用.*IP-\d{4}-\d+/.test(content)
  ) {
    const id = content.match(/IP-\d{4}-\d+/)?.[0];
    if (id) {
      await router.push({
        path: '/app/mate/employee/ticket-assistant/ticket-chat',
        query: { action: 'enable', planId: id },
      });
      return;
    }
  }
  if (
    employeeId.value === 'ticket-assistant' &&
    !inspectionCardId.value &&
    /(?:创建|制订|制定).*巡检计划/.test(content)
  ) {
    await performAction(
      'inspection-create',
      content === '创建巡检计划' ? '' : content,
    );
    return;
  }
  if (employeeId.value === 'ticket-assistant' && inspectionCardId.value) {
    pushMsg({
      id: `inspection-input-${Date.now()}`,
      role: 'user',
      content,
      time: '刚刚',
    });
    inspectionInput.value = content;
    pushMsg({
      id: `inspection-reply-${Date.now()}`,
      role: 'assistant',
      content:
        '已收集你提供的补充信息。请点击上方巡检计划卡片，在抽屉中核对字段、补齐缺失内容并预览排期，确认后创建。',
      time: '刚刚',
    });
    await scrollBottom();
    return;
  }
  // 工单助理 / 填报助理：先识别工单操作意图（转派优先于接单：预填文本含「待接单」字样）
  if (
    employeeId.value === 'ticket-assistant' ||
    employeeId.value === 'fill-assistant'
  ) {
    const isFill = employeeId.value === 'fill-assistant';
    const isTransfer = content.includes('转派');
    const isAccept = !isTransfer && content.includes('接单');
    const isComplete = content.includes('处理结果');
    const isDepart = !isComplete && content.includes('出发');
    const isOnsite =
      !isTransfer &&
      !isAccept &&
      !isComplete &&
      !isDepart &&
      (content.includes('上门') || Boolean(pendingOnsiteCode.value));
    const isAcceptance =
      !isTransfer &&
      !isAccept &&
      !isComplete &&
      !isDepart &&
      !isOnsite &&
      (content.includes('验收') || Boolean(pendingAcceptanceCode.value));
    const pendingOrder = pendingTransferCode.value
      ? mockWorkOrders.find((o) => o.code === pendingTransferCode.value)
      : undefined;
    const pendingCompleteOrder = pendingCompleteCode.value
      ? mockWorkOrders.find((o) => o.code === pendingCompleteCode.value)
      : undefined;
    const pendingOnsiteOrder = pendingOnsiteCode.value
      ? mockWorkOrders.find((o) => o.code === pendingOnsiteCode.value)
      : undefined;
    const pendingAcceptanceOrder = pendingAcceptanceCode.value
      ? mockWorkOrders.find((o) => o.code === pendingAcceptanceCode.value)
      : undefined;
    // 追问中：用户要求取消
    const isCancel = content.includes('取消') || content.includes('不用了');
    if (
      (pendingOrder ||
        pendingOnsiteOrder ||
        pendingAcceptanceOrder ||
        pendingCompleteOrder) &&
      isCancel
    ) {
      pendingTransferCode.value = '';
      pendingOnsiteCode.value = '';
      pendingAcceptanceCode.value = '';
      pendingCompleteCode.value = '';
      pendingCompleteSolution.value = '';
      pushMsg({
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        time: '刚刚',
      });
      pushMsg({
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content:
          '好的，已取消当前办理。如需接单、转派、提交处理结果、创建上门申请单或登记验收结果，随时告诉我。',
        time: '刚刚',
      });
      await scrollBottom();
      return;
    }
    if (
      isTransfer ||
      isAccept ||
      isComplete ||
      isDepart ||
      isOnsite ||
      isAcceptance ||
      pendingOrder ||
      pendingCompleteOrder ||
      pendingOnsiteOrder ||
      pendingAcceptanceOrder
    ) {
      pushMsg({
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        time: '刚刚',
      });
      if (isTransfer) {
        await handleTransfer(content);
      } else if (pendingOrder) {
        // 转派追问中：本条消息视为补充承接人
        await handleTransfer(content, pendingOrder);
      } else if (pendingCompleteOrder) {
        // 处理结果追问中：本条消息视为补充解决方案或附件确认
        await handleComplete(content, pendingCompleteOrder);
      } else if (isAccept) {
        const order = findChatOrder(content);
        if (order) {
          await handleAccept(order);
        } else {
          pushMsg({
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content:
              '请告诉我要接单的工单编号（如 WO-20261004001），我来帮你办理接单。',
            time: '刚刚',
          });
          await scrollBottom();
        }
      } else if (pendingOnsiteOrder) {
        // 上门申请追问中：本条消息视为补充上门时间与事由
        await handleOnsite(content, pendingOnsiteOrder);
      } else if (pendingAcceptanceOrder) {
        // 验收追问中：本条消息视为确认验收结果与补充说明
        await handleAcceptance(content, pendingAcceptanceOrder);
      } else if (isAcceptance) {
        const order = findChatOrder(content);
        if (order) {
          await handleAcceptance(content, order);
        } else {
          pushMsg({
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content:
              '请告诉我要登记验收结果的工单编号（如 WO-20261004001），我来帮你办理。',
            time: '刚刚',
          });
          await scrollBottom();
        }
      } else if (isOnsite) {
        const order = findChatOrder(content);
        if (order) {
          await handleOnsite(content, order);
        } else {
          pushMsg({
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content:
              '请告诉我要创建上门申请单的工单编号（如 WO-20261004001），我来帮你填报。',
            time: '刚刚',
          });
          await scrollBottom();
        }
      } else if (isComplete) {
        const order = findChatOrder(content);
        if (order) {
          await handleComplete(content, order);
        } else {
          pushMsg({
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content:
              '请告诉我要提交处理结果的工单编号，我来帮你整理原因、方案与验收材料。',
            time: '刚刚',
          });
          await scrollBottom();
        }
      } else if (isDepart) {
        const order = findChatOrder(content);
        if (order) {
          await handleDepart(order);
        } else {
          pushMsg({
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: '请告诉我要确认出发的工单编号，我来帮你办理。',
            time: '刚刚',
          });
          await scrollBottom();
        }
      }
      return;
    }
    if (isFill) {
      // 填报助理：非工单操作消息兜底
      pushMsg({
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        time: '刚刚',
      });
      pushMsg({
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content:
          '我是填报助理，当前可协助创建工单上门申请单。回复「帮我创建上门申请单 + 工单编号」即可开始。',
        time: '刚刚',
      });
      await scrollBottom();
      return;
    }
    // 其他任何一句话描述都进入 AI 理解流程（把问题说清楚 → 结构化工单）
    await startAiReport(content);
    return;
  }
  if (
    content.includes('报修') ||
    content.includes('设备') ||
    content.includes('故障')
  ) {
    await performAction('report-collect');
    return;
  }
  if (content.includes('创建') || content.includes('工单')) {
    await performAction('ticket-create');
    return;
  }
  if (content.includes('待派') || content.includes('派单')) {
    await performAction('dispatch-list');
    return;
  }
  if (content.includes('知识') || content.includes('排查')) {
    await performAction('kb-list');
    return;
  }
  pushMsg({
    id: `user-${Date.now()}`,
    role: 'user',
    content,
    time: '刚刚',
  });
  pushMsg({
    id: `assistant-${Date.now()}`,
    role: 'assistant',
    content: `已收到你的需求。我可以帮你采集报修信息、创建工单、查询待派工单或检索知识库。`,
    time: '刚刚',
  });
  await scrollBottom();
}

function kbArticle(id?: string) {
  return mockKnowledgeArticles.find((item) => item.id === id);
}

watch(
  employeeId,
  () => {
    inspectionCardId.value = '';
    inspectionInput.value = '';
    messages.value = loadScenario();
    // 售后客服场景：预填报修表单（与对话内容一致，便于一键提交）
    if (employeeId.value === 'after-sales-service') {
      reportForm.value = {
        deviceCode: 'EQ-1001',
        customer: '华达智能打印',
        contact: '王天豪',
        phone: '138****2104',
        fault:
          '打印出来的样品出现卷曲，已更换新耗材仍复现，连续打印几张都会出现。',
        reproduce: '连续复现',
        environment: '上海·华达工厂 1 号车间',
        priority: 'high',
      };
    }
    // 工单助理场景：预填第二张工单表单（中粮贴标偏移）
    if (employeeId.value === 'ticket-assistant') {
      ticketForm.value = {
        title: '中粮自动贴标机 B2 标签偏移',
        type: '设备故障',
        device: '自动贴标机 B2 (EQ-1002)',
        customer: '中粮包装',
        contact: '刘工',
        phone: '139****7720',
        priority: 'medium',
        description:
          '贴标位置出现 2-3mm 偏移，影响产线良率，需现场伺服参数校准。',
        category: 'external',
      };
    }
    void scrollBottom();
  },
  { immediate: true },
);
watch(
  () => [
    route.query.prefill,
    route.query.inspectionContext,
    route.query.intent,
    route.query.ticketCode,
    route.query.planId,
    route.query.action,
    employeeId.value,
  ],
  () => {
    void applyRouteContext();
  },
  { immediate: true, flush: 'post' },
);
</script>

<template>
  <!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
  <section class="ai-chat">
    <aside class="ai-chat-history">
      <header>
        <h2>对话历史</h2>
        <Button shape="circle" type="text" aria-label="新建对话">
          <Icon icon="lucide:plus" />
        </Button>
      </header>
      <button
        v-for="item in chatHistory"
        :key="item.title"
        type="button"
        :class="{ 'is-active': item.active }"
      >
        <Icon :icon="item.icon" />
        <strong>{{ item.title }}</strong>
        <small>{{ item.time }}</small>
      </button>
    </aside>

    <main class="ai-chat-main">
      <header class="ai-chat-main__header">
        <div>
          <img :src="employee.avatar" :alt="employee.name" />
          <span><i></i></span>
          <h2>{{ employee.name }}</h2>
        </div>
        <div>
          <Button
            v-if="employeeId === 'ticket-assistant'"
            shape="circle"
            type="text"
            aria-label="我的工单"
            @click="gotoMyTickets"
          >
            <Icon icon="lucide:clipboard-list" />
          </Button>
          <Button shape="circle" type="text" aria-label="新建会话">
            <Icon icon="lucide:message-square-plus" />
          </Button>
        </div>
      </header>

      <div ref="scroller" class="ai-chat-main__messages">
        <section class="ai-chat-summary">
          <span>{{ employee.role }}</span>
          <h1>{{ employee.name }}</h1>
          <p>{{ intro }}</p>
          <div>
            <button
              v-for="action in quickActions"
              :key="action[0]"
              type="button"
              @click="performAction(action[1])"
            >
              {{ action[0] }}
              <Icon icon="lucide:arrow-up-right" />
            </button>
          </div>
        </section>

        <template v-for="item in messages" :key="item.id">
          <div
            v-if="item.role === 'assistant'"
            class="ai-chat-message is-assistant"
          >
            <img
              :src="employee.avatar"
              :alt="employee.name"
              class="chat-msg-avatar shadow-xs size-9 flex-none rounded-full border border-[#E8E8E8] object-cover"
            />
            <div class="ai-chat-message__bubble">
              <p class="whitespace-pre-line">{{ item.content }}</p>

              <InspectionActionCard
                v-if="
                  item.card === 'inspection-action' && item.inspectionPlanId
                "
                :plan-id="item.inspectionPlanId"
                :action="item.inspectionAction || ''"
              />
              <InspectionActivateCard
                v-if="
                  item.card === 'inspection-enable' && item.inspectionPlanId
                "
                :plan-id="item.inspectionPlanId"
                :mode="item.inspectionAction === 'enable' ? 'enable' : 'edit'"
                :input="inspectionPlanInput"
                @activated="
                  (plan) => {
                    pushMsg({
                      id: `enabled-${Date.now()}`,
                      role: 'assistant',
                      content: `计划 ${plan.name} 已保存，当前为${plan.status}，已关联 ${plan.devices?.length || 0} 台设备、${plan.executions.length} 次排期。`,
                      time: '刚刚',
                    });
                    scrollBottom();
                  }
                "
              />
              <InspectionCreateCard
                v-if="item.card === 'inspection-create'"
                :input="item.id === inspectionCardId ? inspectionInput : ''"
                @cancel="inspectionCardId = ''"
                @created="
                  (plan) => {
                    inspectionCardId = '';
                    pushMsg({
                      id: `inspection-created-${Date.now()}`,
                      role: 'assistant',
                      content: `巡检计划 ${plan.name}（${plan.id}）已保存，状态为${plan.status}。${plan.status === '草稿' ? '可查看计划，继续确认后直接启用。' : '已确认设备与执行安排，将按排期生成巡检工单。'}`,
                      time: '刚刚',
                    });
                    scrollBottom();
                  }
                "
              />

              <!-- 售后报修信息采集卡 -->
              <div v-if="item.card === 'report-collect'" class="ticket-card">
                <div class="ticket-card__title">
                  <Icon icon="lucide:clipboard-pen" />
                  报修信息采集
                </div>
                <div class="ticket-card__grid">
                  <label class="ticket-field">
                    <span>设备编号 *</span>
                    <Input
                      v-model:value="reportForm.deviceCode"
                      size="small"
                      placeholder="如 EQ-1001"
                    />
                  </label>
                  <label class="ticket-field">
                    <span>客户 *</span>
                    <Input
                      v-model:value="reportForm.customer"
                      size="small"
                      placeholder="客户名称"
                    />
                  </label>
                  <label class="ticket-field">
                    <span>联系人</span>
                    <Input v-model:value="reportForm.contact" size="small" />
                  </label>
                  <label class="ticket-field">
                    <span>联系电话</span>
                    <Input v-model:value="reportForm.phone" size="small" />
                  </label>
                  <label class="ticket-field ticket-field--full">
                    <span>故障现象 *</span>
                    <Input.TextArea
                      v-model:value="reportForm.fault"
                      :rows="2"
                      size="small"
                      placeholder="描述故障表现"
                    />
                  </label>
                  <label class="ticket-field">
                    <span>复现条件</span>
                    <Input
                      v-model:value="reportForm.reproduce"
                      size="small"
                      placeholder="连续/偶发"
                    />
                  </label>
                  <label class="ticket-field">
                    <span>现场环境</span>
                    <Input
                      v-model:value="reportForm.environment"
                      size="small"
                      placeholder="温湿度/产线节拍"
                    />
                  </label>
                  <label class="ticket-field">
                    <span>优先级</span>
                    <Select
                      v-model:value="reportForm.priority"
                      size="small"
                      class="w-full"
                    >
                      <Select.Option value="urgent">紧急</Select.Option>
                      <Select.Option value="high">高</Select.Option>
                      <Select.Option value="medium">中</Select.Option>
                      <Select.Option value="low">低</Select.Option>
                    </Select>
                  </label>
                </div>
                <Button
                  type="primary"
                  size="small"
                  :loading="submitting"
                  class="ticket-card__submit"
                  @click="submitReport"
                >
                  <Icon icon="lucide:send" />
                  提交并生成工单
                </Button>
              </div>

              <!-- 工单创建卡 -->
              <div
                v-else-if="item.card === 'ticket-create'"
                class="ticket-card"
              >
                <div class="ticket-card__title">
                  <Icon icon="lucide:file-plus-2" />
                  创建工单
                </div>
                <div class="ticket-card__grid">
                  <label class="ticket-field ticket-field--full">
                    <span>工单标题 *</span>
                    <Input
                      v-model:value="ticketForm.title"
                      size="small"
                      placeholder="如 华达打印终端 A1 打印卷曲问题"
                    />
                  </label>
                  <label class="ticket-field">
                    <span>工单分类 *</span>
                    <Select
                      v-model:value="ticketForm.category"
                      size="small"
                      class="w-full"
                    >
                      <Select.Option value="external">
                        外部工单（运维人员）
                      </Select.Option>
                      <Select.Option value="internal">
                        内部工单（公司员工）
                      </Select.Option>
                    </Select>
                  </label>
                  <label class="ticket-field">
                    <span>工单类型</span>
                    <Select
                      v-model:value="ticketForm.type"
                      size="small"
                      class="w-full"
                    >
                      <Select.Option value="设备故障">设备故障</Select.Option>
                      <Select.Option value="定期保养">定期保养</Select.Option>
                      <Select.Option value="技术咨询">技术咨询</Select.Option>
                      <Select.Option value="备件更换">备件更换</Select.Option>
                      <Select.Option value="技术改进">技术改进</Select.Option>
                    </Select>
                  </label>
                  <label class="ticket-field">
                    <span>关联设备</span>
                    <Input v-model:value="ticketForm.device" size="small" />
                  </label>
                  <label class="ticket-field">
                    <span>客户 *</span>
                    <Input v-model:value="ticketForm.customer" size="small" />
                  </label>
                  <label class="ticket-field">
                    <span>优先级</span>
                    <Select
                      v-model:value="ticketForm.priority"
                      size="small"
                      class="w-full"
                    >
                      <Select.Option value="urgent">紧急</Select.Option>
                      <Select.Option value="high">高</Select.Option>
                      <Select.Option value="medium">中</Select.Option>
                      <Select.Option value="low">低</Select.Option>
                    </Select>
                  </label>
                  <label class="ticket-field">
                    <span>联系人</span>
                    <Input v-model:value="ticketForm.contact" size="small" />
                  </label>
                  <label class="ticket-field">
                    <span>联系电话</span>
                    <Input v-model:value="ticketForm.phone" size="small" />
                  </label>
                  <label class="ticket-field ticket-field--full">
                    <span>问题描述</span>
                    <Input.TextArea
                      v-model:value="ticketForm.description"
                      :rows="3"
                      size="small"
                    />
                  </label>
                </div>
                <Button
                  type="primary"
                  size="small"
                  :loading="submitting"
                  class="ticket-card__submit"
                  @click="submitTicket"
                >
                  <Icon icon="lucide:send" />
                  提交工单
                </Button>
              </div>

              <!-- 待派工单列表卡 -->
              <div
                v-else-if="item.card === 'dispatch-list'"
                class="ticket-card"
              >
                <div class="ticket-card__title">
                  <Icon icon="lucide:list-checks" />
                  待派工单
                </div>
                <div
                  v-for="order in pendingOrders"
                  :key="order.id"
                  class="dispatch-row"
                >
                  <div class="dispatch-row__main">
                    <strong>{{ order.code }} · {{ order.title }}</strong>
                    <small>
                      {{ order.customer }} · {{ order.type }} ·
                      {{ ticketPriorityLabel[order.priority] }} · SLA
                      {{ slaStatusLabel[order.slaStatus] }}（{{
                        order.slaRemaining
                      }}）
                    </small>
                  </div>
                </div>
                <p v-if="pendingOrders.length === 0" class="dispatch-empty">
                  暂无待派工单，所有工单已派单。
                </p>
              </div>

              <!-- 知识库答案卡 -->
              <div
                v-else-if="item.card === 'kb-answer'"
                class="ticket-card ticket-card--kb"
              >
                <template v-if="kbArticle(item.kbArticleId)">
                  <div class="ticket-card__title">
                    <Icon icon="lucide:book-open-text" />
                    {{ kbArticle(item.kbArticleId)?.title }}
                  </div>
                  <p class="whitespace-pre-line">
                    {{ kbArticle(item.kbArticleId)?.content }}
                  </p>
                  <div class="ticket-card__tags">
                    <span
                      v-for="tag in kbArticle(item.kbArticleId)?.tags"
                      :key="tag"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </template>
              </div>

              <!-- AI 理解中卡：逐条识别客户 / 设备 / 问题类型 / 影响 -->
              <div
                v-else-if="item.card === 'ai-understanding'"
                class="ticket-card ai-u-card"
              >
                <div class="ai-u-head">
                  <span class="ai-badge">
                    <Icon icon="lucide:sparkles" />
                    AI 工单理解
                  </span>
                  <span
                    v-if="aiFlow.stage === 'understanding'"
                    class="ai-u-tip"
                  >
                    <Icon icon="lucide:loader-2" class="ai-spin" />
                    AI 正在理解问题…
                  </span>
                  <span v-else class="ai-u-tip is-done">
                    <Icon icon="lucide:check-check" />
                    已完成理解
                  </span>
                </div>
                <div class="ai-u-list">
                  <div
                    v-for="(u, i) in aiReportUnderstanding"
                    :key="u.label"
                    class="ai-u-item"
                    :class="{
                      'is-show':
                        aiFlow.revealed > i || aiFlow.stage !== 'understanding',
                    }"
                  >
                    <span class="ai-u-check">
                      <Icon icon="lucide:check" />
                    </span>
                    <small>{{ u.label }}</small>
                    <strong>{{ u.value }}</strong>
                  </div>
                </div>
              </div>

              <!-- AI 问题摘要卡：AI 生成 ≠ 自动提交，需确认 -->
              <div
                v-else-if="item.card === 'ai-summary'"
                class="ticket-card ai-s-card"
              >
                <div class="ai-s-head">
                  <span class="ai-badge">
                    <Icon icon="lucide:sparkles" />
                    AI 问题摘要
                  </span>
                  <span class="ai-s-conf">
                    AI 置信度
                    <strong>{{ aiReportSummary.confidence }}%</strong>
                  </span>
                </div>
                <dl class="ai-s-rows">
                  <div>
                    <dt>问题类型</dt>
                    <dd>{{ aiReportSummary.type }}</dd>
                  </div>
                  <div>
                    <dt>问题现象</dt>
                    <dd>{{ aiReportSummary.phenomenon }}</dd>
                  </div>
                  <div>
                    <dt>影响范围</dt>
                    <dd>{{ aiReportSummary.impact }}</dd>
                  </div>
                  <div>
                    <dt>初步判断</dt>
                    <dd>{{ aiReportSummary.judge }}</dd>
                  </div>
                </dl>
                <div class="ai-s-actions">
                  <template v-if="aiFlow.stage === 'summary'">
                    <Button
                      type="primary"
                      size="small"
                      :loading="submitting"
                      class="ai-s-confirm"
                      @click="confirmAiTicket"
                    >
                      <Icon icon="lucide:check" />
                      确认生成工单
                    </Button>
                    <Button size="small" @click="editAiReport">
                      <Icon icon="lucide:pen-line" />
                      修改问题描述
                    </Button>
                  </template>
                  <span
                    v-else-if="aiFlow.stage === 'submitted'"
                    class="ai-s-done"
                  >
                    <Icon icon="lucide:circle-check" />
                    已生成工单 {{ aiFlow.createdCode }}
                  </span>
                </div>
              </div>

              <!-- AI 后台补全分析卡：历史案例 / 原因分布 / 推荐排查 / 派单结果 -->
              <div
                v-else-if="item.card === 'ai-analysis'"
                class="ticket-card ai-a-card"
              >
                <div class="ai-a-head">
                  <span class="ai-badge">
                    <Icon icon="lucide:sparkles" />
                    AI 已完成问题分析
                  </span>
                  <span class="ai-a-code">{{ item.ticketCode }}</span>
                </div>
                <div class="ai-a-history">
                  <Icon icon="lucide:history" />
                  {{ aiReportAnalysis.historyText }}
                </div>
                <div class="ai-a-causes">
                  <small>主要原因分布</small>
                  <div
                    v-for="c in aiReportAnalysis.causes"
                    :key="c.name"
                    class="ai-a-cause"
                  >
                    <span>{{ c.name }}</span>
                    <i>
                      <b
                        :style="{
                          width: `${Math.round((c.count / Math.max(analysisTotal, 1)) * 100)}%`,
                        }"
                      ></b>
                    </i>
                    <em>{{ c.count }} 次</em>
                  </div>
                </div>
                <div class="ai-a-steps">
                  <small>推荐排查路径</small>
                  <p>{{ aiReportAnalysis.recommendSteps.join(' → ') }}</p>
                </div>
                <div class="ai-a-dispatch">
                  <Icon icon="lucide:user-check" />
                  {{ aiReportAnalysis.dispatchText }}
                </div>
                <div class="ai-s-actions">
                  <Button size="small" @click="gotoMyTickets">
                    查看我的工单
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="ai-chat-message is-user">
            <div class="ai-chat-message__bubble">
              <p class="whitespace-pre-line">{{ item.content }}</p>
            </div>
            <div
              class="chat-msg-avatar shadow-xs flex size-9 flex-none items-center justify-center rounded-full border border-[#0D6853] bg-[#0D6853] text-sm font-bold text-white"
              :title="CURRENT_USER.name"
            >
              {{ CURRENT_USER.name.charAt(0) }}
            </div>
          </div>
        </template>
      </div>

      <div class="composer-container border-t border-[#E6EEEB] bg-white">
        <div
          class="composer-preset-bar flex items-center gap-2 overflow-x-auto border-b border-[#E8E8E8] bg-[#F7F8FA] px-4 py-2"
        >
          <span
            class="flex flex-none items-center gap-1 text-xs font-medium text-[#86909C]"
          >
            <Icon icon="lucide:sparkles" class="size-3.5 text-[#0D6853]" />
            快捷指令:
          </span>
          <button
            v-for="action in quickActions"
            :key="action[0]"
            type="button"
            class="preset-chip-btn shadow-xs flex flex-none cursor-pointer items-center gap-1 rounded-full border border-[#0D6853]/30 bg-white px-3 py-1 text-xs text-[#0D6853] transition-colors hover:bg-[#E8FFEA]"
            @click="performAction(action[1])"
          >
            <Icon icon="lucide:sparkles" class="size-3.5" />
            <span>{{ action[0] }}</span>
          </button>
        </div>

        <footer class="ai-chat-composer border-none">
          <Input.TextArea
            v-model:value="draft"
            :auto-size="{ minRows: 2, maxRows: 4 }"
            placeholder="输入消息，或点击上方快捷指令开始…"
            @press-enter.prevent="send"
          />
          <Button type="text" aria-label="添加附件">
            <Icon icon="lucide:paperclip" />
          </Button>
          <Button
            type="primary"
            shape="circle"
            :disabled="!draft.trim()"
            aria-label="发送消息"
            @click="send"
          >
            <Icon icon="lucide:arrow-up" />
          </Button>
        </footer>
      </div>
    </main>
  </section>
</template>

<style scoped>
@keyframes ai-rotate {
  to {
    transform: rotate(360deg);
  }
}

@keyframes ai-pop {
  0% {
    transform: scale(0.4);
  }

  70% {
    transform: scale(1.15);
  }

  100% {
    transform: scale(1);
  }
}

@keyframes ai-bar {
  from {
    width: 0;
  }
}

@media (max-width: 980px) {
  .ai-chat-history {
    display: none;
  }

  .ticket-card__grid {
    grid-template-columns: 1fr;
  }

  .dispatch-row {
    flex-wrap: wrap;
  }

  .dispatch-row__select {
    width: 100%;
  }
}

.ai-chat {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: #fff;
  border: 1px solid #d4e3de;
  border-radius: 28px;
  box-shadow: 0 22px 52px rgb(18 57 45 / 8%);
}

.ai-chat-history {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 308px;
  min-width: 308px;
  padding: 14px 12px;
  background: linear-gradient(180deg, #eef6f2, #f8fbf9);
  border-right: 1px solid #e1ebe8;
}

.ai-chat-history header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 46px;
  padding: 0 7px;
}

.ai-chat-history h2 {
  margin: 0;
  font-size: 16px;
  color: #102e29;
}

.ai-chat-history > button {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  color: #557067;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 14px;
}

.ai-chat-history > button.is-active {
  color: #102e29;
  background: #fff;
  box-shadow: 0 4px 14px rgb(18 57 45 / 7%);
}

.ai-chat-history > button small {
  margin-left: auto;
  font-size: 11px;
  color: #7b948b;
}

.ai-chat-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.ai-chat-main__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 20px;
  border-bottom: 1px solid #e4eee9;
}

.ai-chat-main__header > div {
  display: flex;
  gap: 10px;
  align-items: center;
}

.ai-chat-main__header img {
  width: 34px;
  height: 34px;
  border-radius: 50%;
}

.ai-chat-main__header h2 {
  margin: 0;
  font-size: 15px;
  color: #112d27;
}

.ai-chat-main__messages {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.ai-chat-summary {
  padding-bottom: 20px;
  margin-bottom: 24px;
  border-bottom: 1px dashed #dbe6e2;
}

.ai-chat-summary span {
  font-size: 11px;
  font-weight: 700;
  color: #0b806f;
}

.ai-chat-summary h1 {
  margin: 6px 0 10px;
  font-size: 26px;
  color: #102e29;
}

.ai-chat-summary p {
  margin: 0 0 14px;
  font-size: 13px;
  line-height: 1.6;
  color: #557067;
}

.ai-chat-summary div {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ai-chat-summary button {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #0b6e65;
  cursor: pointer;
  background: #f4faf7;
  border: 1px solid #cce0d9;
  border-radius: 999px;
}

.ai-chat-message {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.ai-chat-message.is-user {
  justify-content: flex-end;
}

.ai-chat-message__bubble {
  max-width: 80%;
  padding: 12px 16px;
  font-size: 13px;
  line-height: 1.65;
  border-radius: 18px;
}

.ai-chat-message.is-assistant .ai-chat-message__bubble {
  color: #17362e;
  background: #f8fbf9;
  border: 1px solid #e1ece7;
}

.ai-chat-message.is-user .ai-chat-message__bubble {
  color: #fff;
  background: #0d6853;
}

.ai-chat-composer {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 12px 16px;
}

.ai-chat-composer :deep(.ant-input) {
  font-size: 13px;
  border: 0;
  box-shadow: none;
}

.ai-chat-composer :deep(.ant-input:focus) {
  box-shadow: none;
}

/* 交互卡片 */
.ticket-card {
  padding: 14px;
  margin-top: 10px;
  background: #fff;
  border: 1px solid #d8e6e0;
  border-radius: 14px;
  box-shadow: 0 6px 18px rgb(18 57 45 / 5%);
}

.ticket-card__title {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 700;
  color: #0c4a3f;
}

.ticket-card__title :deep(svg) {
  color: #0b806f;
}

.ticket-card__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
}

.ticket-field {
  display: grid;
  gap: 4px;
  font-size: 11px;
  color: #5a756d;
}

.ticket-field--full {
  grid-column: span 2;
}

.ticket-card--kb p {
  margin: 4px 0 10px;
  font-size: 12px;
  line-height: 1.7;
  color: #3f5b53;
}

.ticket-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ticket-card__tags span {
  padding: 2px 8px;
  font-size: 10px;
  color: #087162;
  background: #e3f1ec;
  border-radius: 999px;
}

.ticket-card__submit {
  margin-top: 12px;
  background: #0b6e65;
  border-color: #0b6e65;
}

.dispatch-row {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 10px 0;
  border-top: 1px solid #eef3f0;
}

.dispatch-row:first-of-type {
  padding-top: 4px;
  border-top: 0;
}

.dispatch-row__main {
  flex: 1;
  min-width: 0;
}

.dispatch-row__main strong {
  display: block;
  font-size: 12px;
  color: #17362e;
}

.dispatch-row__main small {
  display: block;
  margin-top: 3px;
  font-size: 10px;
  color: #81958e;
}

.dispatch-row__select {
  width: 150px;
}

.dispatch-empty {
  margin: 8px 0 0;
  font-size: 12px;
  color: #81958e;
}

/* ============ AI 卡片通用徽章 ============ */
.ai-badge {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 800;
  color: #7a5418;
  background: linear-gradient(120deg, #f6d88b, #fbeec2);
  border-radius: 999px;
}

.ai-badge svg {
  width: 12px;
  height: 12px;
}

.ai-spin {
  animation: ai-rotate 1s linear infinite;
}

/* ============ AI 理解卡 ============ */
.ai-u-head {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
}

.ai-u-tip {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  color: #0b6e65;
}

.ai-u-tip.is-done {
  color: #1f8a5f;
}

.ai-u-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-top: 10px;
}

.ai-u-item {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
  background: #f7fbf9;
  border: 1px solid #e3efe9;
  border-radius: 9px;
  opacity: 0;
  transform: translateY(-4px);
  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
}

.ai-u-item.is-show {
  opacity: 1;
  transform: translateY(0);
}

.ai-u-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: #fff;
  background: #1f8a5f;
  border-radius: 50%;
  animation: ai-pop 0.4s ease;
}

.ai-u-check svg {
  width: 10px;
  height: 10px;
}

.ai-u-item small {
  flex: none;
  font-size: 11px;
  color: #5a756d;
}

.ai-u-item strong {
  font-size: 12px;
  color: #0c2f28;
}

/* ============ AI 问题摘要卡 ============ */
.ai-s-head {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.ai-s-conf {
  font-size: 11px;
  color: #7a5418;
}

.ai-s-conf strong {
  font-size: 14px;
  color: #c98b2c;
}

.ai-s-rows {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 0;
}

.ai-s-rows > div {
  display: flex;
  gap: 10px;
  padding: 8px 0;
  border-top: 1px dashed #e3efe9;
}

.ai-s-rows > div:first-child {
  border-top: 0;
}

.ai-s-rows dt {
  flex: none;
  width: 62px;
  font-size: 11px;
  font-weight: 700;
  color: #5a756d;
}

.ai-s-rows dd {
  flex: 1;
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: #17362e;
}

.ai-s-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 12px;
}

.ai-s-confirm {
  background: #0b6e65;
  border-color: #0b6e65;
}

.ai-s-done {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  font-size: 11.5px;
  font-weight: 700;
  color: #1f8a5f;
}

/* ============ AI 后台分析卡 ============ */
.ai-a-head {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.ai-a-code {
  font-size: 11px;
  font-weight: 700;
  color: #0b6e65;
}

.ai-a-history {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 8px 10px;
  font-size: 11.5px;
  font-weight: 600;
  color: #7a5418;
  background: #fdf8ec;
  border: 1px dashed #e5cf9a;
  border-radius: 8px;
}

.ai-a-history svg {
  flex: none;
  width: 13px;
  height: 13px;
  color: #b08a35;
}

.ai-a-causes {
  margin-top: 10px;
}

.ai-a-causes > small,
.ai-a-steps > small {
  font-size: 10.5px;
  font-weight: 700;
  color: #5a756d;
}

.ai-a-cause {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 6px;
}

.ai-a-cause span {
  flex: none;
  width: 84px;
  font-size: 11px;
  color: #35625a;
}

.ai-a-cause i {
  flex: 1;
  height: 8px;
  overflow: hidden;
  background: #eef4f1;
  border-radius: 999px;
}

.ai-a-cause b {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #0b6e65, #1f9e83);
  border-radius: 999px;
  animation: ai-bar 0.7s ease;
}

.ai-a-cause em {
  flex: none;
  font-size: 10.5px;
  font-style: normal;
  color: #81958e;
}

.ai-a-steps {
  margin-top: 10px;
}

.ai-a-steps p {
  margin: 5px 0 0;
  font-size: 12px;
  font-weight: 600;
  color: #0c4a3f;
}

.ai-a-dispatch {
  display: flex;
  gap: 6px;
  align-items: flex-start;
  padding: 8px 10px;
  margin-top: 10px;
  font-size: 11.5px;
  line-height: 1.6;
  color: #35625a;
  background: #f0f7f4;
  border-radius: 8px;
}

.ai-a-dispatch svg {
  flex: none;
  width: 13px;
  height: 13px;
  margin-top: 2px;
  color: #0b6e65;
}
</style>
