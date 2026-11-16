<!-- 工单详情内容：左 60% 工单上下文 · 右 40% AI 工作区（随工单状态动态展示） -->
<!-- 供 my-tickets 详情 Drawer 复用；AI 工作区按状态提供研判 / 操作 / 验收辅助 -->
<script setup lang="ts">
import type {
  TicketAttachment,
  TicketTimelineAction,
  TicketTimelineEvent,
  WorkOrder,
} from '#/types/ticket';

import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Input, message, Modal, Tag } from 'ant-design-vue';

import {
  CURRENT_USER,
  engineers,
  getTicketAiAdvisor,
  getTicketScenario,
  mockFlowGraph,
  mockWorkOrders,
  resolveFlowTransition,
} from '#/api/mock-data-ticket';

const props = defineProps<{
  /** 当前详情工单 */
  order: WorkOrder;
}>();

/** 工单 AI 研判剧本（默认驾驶舱剧本 + 按工单 id 覆盖） */
const scenario = computed(() => getTicketScenario(props.order.id));

/** 推荐处理方式文案 */
function scenarioRecommendLabel(): string {
  const recommend = scenario.value.recommend;
  if (recommend === 'onsite') return '建议上门处理';
  if (recommend === 'transfer') return '建议转派处理';
  return '优先远程处理';
}

/** 处理中 AI 推荐操作（依据研判剧本的推荐处理方式映射） */
const remoteRecommend = computed<'complete' | 'onsite' | 'transfer'>(() => {
  const recommend = scenario.value.recommend;
  if (recommend === 'transfer') return 'transfer';
  if (recommend === 'onsite') return 'onsite';
  return 'complete';
});

/** 处理中 AI 推荐操作文案 */
const remoteRecommendLabel = computed(
  () =>
    ({
      complete: '完成处理',
      onsite: '申请上门',
      transfer: '转派',
    })[remoteRecommend.value],
);

// ==================== 工单上下文（左栏） ====================

const timelineIcon: Record<string, string> = {
  accepted: 'lucide:thumbs-up',
  cancelled: 'lucide:x-circle',
  closed: 'lucide:lock',
  completed: 'lucide:check-check',
  created: 'lucide:sparkles',
  dispatched: 'lucide:send',
  evaluated: 'lucide:star',
  note: 'lucide:sticky-note',
  started: 'lucide:play',
  transferred: 'lucide:arrow-right-left',
};

function timelineActionLabel(action: TicketTimelineAction) {
  const map: Record<TicketTimelineAction, string> = {
    accepted: '验收通过',
    cancelled: '取消工单',
    closed: '关闭工单',
    completed: '处理完成',
    created: '创建工单',
    dispatched: '派单',
    evaluated: '客户评价',
    note: '处理备注',
    started: '开始处理',
    transferred: '转派',
  };
  return map[action];
}

function timelineActionColor(action: TicketTimelineAction) {
  if (action === 'cancelled' || action === 'closed') return 'red';
  if (action === 'accepted' || action === 'completed') return 'green';
  return 'blue';
}

/** 时间字符串解析为时间戳（支持 YYYY-MM-DD HH:mm 与 今天/昨天 HH:mm，无法解析排最后） */
function timelineTimeValue(time: string): number {
  const hm = /(\d{1,2}):(\d{2})/.exec(time);
  if (time.startsWith('今天') || time.startsWith('昨天')) {
    const d = new Date();
    if (time.startsWith('昨天')) d.setDate(d.getDate() - 1);
    if (hm) d.setHours(Number(hm[1]), Number(hm[2]), 0, 0);
    return d.getTime();
  }
  const m = /(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})/.exec(time);
  if (m) {
    return new Date(
      Number(m[1]),
      Number(m[2]) - 1,
      Number(m[3]),
      Number(m[4]),
      Number(m[5]),
    ).getTime();
  }
  return Number.NEGATIVE_INFINITY;
}

/** 流转状态按时间降序展示（最近动作在最上方） */
const sortedTimeline = computed(() =>
  (props.order.timeline ?? []).toSorted(
    (a, b) => timelineTimeValue(b.time) - timelineTimeValue(a.time),
  ),
);

const attachmentIconMap: Record<string, string> = {
  audio: 'lucide:mic',
  image: 'lucide:image',
  pdf: 'lucide:file-text',
  recording: 'lucide:mic',
  screenshot: 'lucide:image',
  video: 'lucide:video',
};

function attachmentIcon(type: string) {
  return attachmentIconMap[type] || 'lucide:paperclip';
}

const attachmentLabelMap: Record<string, string> = {
  audio: '音频',
  image: '图片',
  pdf: 'PDF',
  recording: '录音',
  screenshot: '截图',
  video: '视频',
};

function attachmentLabel(type: string) {
  return attachmentLabelMap[type] || '附件';
}

// ==================== AI 工作区（右栏） ====================

/** 工单是否已闭环（验收完成 / 已关闭） */
const isClosed = computed(
  () => props.order.status === 'completed' || props.order.status === 'closed',
);

/**
 * AI 工作区形态：按工单状态动态推导，不再依赖内部四步导航。
 * 待接单 → AI问题研判 · 处理中 → 处理助手 · 待上门调度 → 上门调度助手 · 上门处理中 → 现场助手 · 待验收 → AI 验收助手 · 终态 → 处理总结
 */
const stage = computed<
  'accept' | 'diagnose' | 'done' | 'field' | 'remote' | 'visit'
>(() => {
  const status = props.order.status;
  // 上门处理中（行程执行）→ 现场助手
  if (status === 'onsite-processing') return 'field';
  if (status === 'processing' && props.order.travelOrder) return 'field';
  switch (status) {
    case 'cancelled': {
      return 'diagnose';
    }
    case 'dispatched':
    case 'pending': {
      return 'diagnose';
    }
    case 'pending-acceptance': {
      return 'accept';
    }
    case 'pending-visit': {
      // 待上门调度 → 上门调度助手
      return 'visit';
    }
    case 'processing': {
      return 'remote';
    }
    default: {
      // pending-review / completed / closed → 处理总结
      return 'done';
    }
  }
});

/** 形态标题（随工单状态变化） */
const formMeta = computed(() => {
  switch (stage.value) {
    case 'accept': {
      return {
        desc: 'AI 已核对完工材料并生成验收摘要，辅助快速完成验收',
        icon: 'lucide:clipboard-check',
        name: 'AI 验收助手',
      };
    }
    case 'diagnose': {
      return {
        desc: 'AI 已通读工单与历史案例，帮你把问题看清楚',
        icon: 'lucide:brain',
        name: 'AI问题研判',
      };
    }
    case 'field': {
      return {
        desc: `${scenario.value.fieldEngineer.name} 正在现场处理，AI 协助记录与总结`,
        icon: 'lucide:wrench',
        name: 'AI 现场助手',
      };
    }
    case 'remote': {
      return {
        desc: 'AI 推荐处理方案，并按「完成处理 / 转派 / 申请上门」三种路径辅助你',
        icon: 'lucide:monitor-check',
        name: 'AI 处理助手',
      };
    }
    case 'visit': {
      return {
        desc: 'AI 已完成上门调度评估，确认出发后前往现场',
        icon: 'lucide:truck',
        name: 'AI 上门调度助手',
      };
    }
    default: {
      return {
        desc: isClosed.value
          ? '工单已闭环，AI 已沉淀知识案例'
          : 'AI 已整理处理结果，供复核参考',
        icon: 'lucide:file-check-2',
        name: 'AI 处理总结',
      };
    }
  }
});

/** 当前置信度（待验收阶段取 AI 验收核对置信度） */
const confidence = computed(() => {
  if (stage.value === 'accept') return acceptSolved.value ? 92 : 64;
  return scenario.value.confidence;
});

/** 置信度环（SVG） */
const confRing = computed(() => {
  const r = 26;
  const c = 2 * Math.PI * r;
  return {
    dasharray: `${c}`,
    dashoffset: `${c * (1 - confidence.value / 100)}`,
    r,
  };
});

/** 待接单 AI 引导（复用 AI 处理建议数据源） */
const guide = computed(() => getTicketAiAdvisor(props.order).acceptGuide);

/** Mock 推荐：默认推荐确认接单 */
const recommendClaim = computed(
  () => (guide.value?.suggestion ?? 'confirm') === 'confirm',
);

const showBasis = ref(false);

// ==================== AI 推荐处理方案（处理中） ====================

const recommendedPlan = computed(() => {
  const plans = getTicketAiAdvisor(props.order).plans.plans;
  return plans.find((p) => p.recommended) ?? plans[0];
});

/** 处理中推荐处理方式文案（推荐上门时与推荐操作保持一致） */
const remotePlanName = computed(() => {
  if (remoteRecommend.value === 'onsite') return '申请上门';
  return recommendedPlan.value?.name ?? '';
});

/** 方案详情展开折叠 */
const showPlanDetail = ref(false);

/** 推荐处理方式一句话概括：适用场景 + 参考历史案例 */
const similarCaseSummary = computed(() => {
  const cases = getTicketAiAdvisor(props.order).similarCases.cases;
  const top = cases[0];
  if (!top) return '暂无高相似历史案例参考';
  return `参考历史「${top.code}」等 ${cases.length} 例相似案例`;
});

/** 关键步骤文案（换行编号展示） */
const planStepsText = computed(() =>
  (recommendedPlan.value?.steps ?? [])
    .map((s, i) => `${i + 1}. ${s}`)
    .join('\n'),
);

// ==================== 操作：确认接单（待接单 → 处理中） ====================

/** 当前时间的展示字符串 */
function nowLabel() {
  return new Date().toISOString().replace('T', ' ').slice(0, 16);
}

/** 给工单追加一条流转事件（与列表页行为一致） */
function pushTimelineLocal(
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

function confirmAccept() {
  const order = mockOrder();
  if (!order) return;
  const t = nowLabel();
  if (order.scenario === '运维工单' && order.currentNodeId) {
    const nextId = resolveFlowTransition(
      mockFlowGraph,
      order.currentNodeId,
      '确认接单',
    );
    if (nextId) {
      order.currentNodeId = nextId;
      order.status = 'processing';
      pushTimelineLocal(order, {
        action: 'started',
        time: t,
        operator: CURRENT_USER.name,
        operatorId: CURRENT_USER.id,
        summary: `${CURRENT_USER.name} 确认接单（AI 推荐操作），工单进入处理中`,
      });
      message.success(`${order.code} 已确认接单，工单进入处理中`);
      return;
    }
  }
  order.status = 'processing';
  pushTimelineLocal(order, {
    action: 'started',
    time: t,
    operator: CURRENT_USER.name,
    operatorId: CURRENT_USER.id,
    summary: `${CURRENT_USER.name} 已接单，开始处理`,
  });
  message.success(`已开始处理 ${order.code}`);
}

/** 从工单池取当前工单实例（mock 数据为响应式，直接变更即可全局同步） */
function mockOrder(): undefined | WorkOrder {
  return mockWorkOrders.find((o) => o.id === props.order.id);
}

// ==================== 操作：AI 转派助手（待接单 / 处理中通用） ====================

interface TransferCandidate {
  id: string;
  name: string;
  role: string;
  team: string;
  area: string;
  workload: number;
  /** AI 匹配度 0-100 */
  score: number;
  recommended: boolean;
  reasons: string[];
}

const transferOpen = ref(false);
const transferSelectedId = ref('');
const transferKeyword = ref('');
const transferReason = ref('');

const transferCandidates = computed<TransferCandidate[]>(() => {
  const order = props.order;
  const customerText = `${order.customer ?? ''}${order.customerLocation ?? ''}`;
  return engineers
    .filter((e) => e.id !== order.assigneeId)
    .map((e) => {
      const areaMatch =
        customerText.length > 0 &&
        (e.area.includes('上海') || e.area.includes('全国'));
      const score = Math.min(
        98,
        Math.max(
          40,
          100 -
            e.workload * 6 +
            (areaMatch ? 10 : 0) +
            (e.role.includes('高级') ? 6 : 0),
        ),
      );
      return {
        id: e.id,
        name: e.name,
        role: e.role,
        team: e.team,
        area: e.area,
        workload: e.workload,
        score,
        recommended: false,
        reasons: [
          `服务区域「${e.area}」${areaMatch ? '，覆盖客户所在城市' : '，可远程支持该工单'}`,
          `当前负载 ${e.workload} 单，可在 SLA 时限内响应`,
          `近 90 天处理同类「${order.type}」工单 ${Math.max(1, 9 - e.workload * 2)} 例，闭环率 ${96 - e.workload * 2}%`,
        ],
      };
    })
    .toSorted((a, b) => b.score - a.score)
    .map((c, i) => ({ ...c, recommended: i === 0 }));
});

const transferRecommended = computed(() => transferCandidates.value[0]);

const transferFiltered = computed(() => {
  const kw = transferKeyword.value.trim().toLowerCase();
  return transferCandidates.value.filter(
    (c) =>
      !kw ||
      c.name.toLowerCase().includes(kw) ||
      c.area.toLowerCase().includes(kw) ||
      c.role.toLowerCase().includes(kw) ||
      c.team.toLowerCase().includes(kw),
  );
});

function openTransfer() {
  transferSelectedId.value = transferRecommended.value?.id ?? '';
  transferKeyword.value = '';
  transferReason.value = '';
  transferOpen.value = true;
}

/** 一键填写转派原因：AI 生成 转派原因 + 工作交接 + 上下文传递 */
function fillTransferReason() {
  const c = transferCandidates.value.find(
    (x) => x.id === transferSelectedId.value,
  );
  const order = props.order;
  transferReason.value = [
    `【转派原因】${c ? `${c.name}（${c.role}）` : 'AI 推荐承接人'}与该问题的技能方向、服务区域及当前负载更匹配（AI 匹配度 ${c?.score ?? 90}%），由其承接可保障 SLA 时限内响应。`,
    `【工作交接】${order.code} ${order.title}：故障附件 ${order.attachments?.length ?? 0} 份、排查记录与客户沟通记录已打包同步至承接人工作台，无需重复联系客户。`,
    `【上下文传递】客户 ${order.customer ?? '—'}（${order.contact ?? '—'} ${order.phone ?? '—'}），设备 ${order.device ?? '—'}，SLA 截止 ${order.deadline}，请优先跟进。`,
  ].join('\n');
  message.success('已一键填写转派原因（含工作交接与上下文传递）');
}

function submitTransfer() {
  const order = mockOrder();
  if (!order) return;
  const target = engineers.find((e) => e.id === transferSelectedId.value);
  if (!target) {
    message.warning('请选择转派承接人');
    return;
  }
  const reason = transferReason.value.trim();
  if (!reason) {
    message.warning('请填写转派原因，可点击「一键填写」由 AI 生成');
    return;
  }
  const t = nowLabel();
  const fromName = order.assignee;
  order.assigneeId = target.id;
  order.assignee = target.name;
  order.slaResetAt = t;
  if (!order.transferHistory) order.transferHistory = [];
  order.transferHistory.push({
    id: `th-${Date.now()}`,
    fromAssignee: fromName,
    fromAssigneeId:
      engineers.find((e) => e.name === fromName)?.id ?? CURRENT_USER.id,
    operator: CURRENT_USER.name,
    operatorId: CURRENT_USER.id,
    reason,
    time: t,
    toAssignee: target.name,
    toAssigneeId: target.id,
  });
  pushTimelineLocal(order, {
    action: 'transferred',
    time: t,
    operator: CURRENT_USER.name,
    operatorId: CURRENT_USER.id,
    summary: `${CURRENT_USER.name} 按AI推荐将工单转派给 ${target.name}（${target.role}）`,
    reason,
  });
  transferOpen.value = false;
  message.success(`${order.code} 已转派给 ${target.name}`);
}

// ==================== 操作：完成处理（处理中 → 待验收） ====================

const completeOpen = ref(false);
const completeCause = ref('');
const completeSolution = ref('');
const completeAtts = ref<TicketAttachment[]>([]);

function toggleComplete() {
  completeOpen.value = !completeOpen.value;
}

/** AI 优化录入内容：按工单上下文与历史案例生成结构化文案 */
function aiOptimize(field: 'cause' | 'solution') {
  const report = scenario.value.solutionReport;
  if (field === 'cause') {
    completeCause.value = report.cause;
  } else {
    completeSolution.value = `${report.solution}\n处理结果：${report.result}\n验收建议：${report.acceptance}`;
  }
  message.success('AI 已根据工单上下文与历史案例优化录入内容');
}

function addCompleteAtts() {
  const now = nowLabel();
  completeAtts.value.push(
    {
      id: `acc-${Date.now()}-1`,
      name: '复测视频_现场验收.mp4',
      type: 'video',
      size: '16.8 MB',
      uploader: CURRENT_USER.name,
      uploaderId: CURRENT_USER.id,
      uploadedAt: now,
      duration: '00:35',
      note: '处理完成后连续运行复测录像',
    },
    {
      id: `acc-${Date.now()}-2`,
      name: '设备正常运行截图.png',
      type: 'screenshot',
      size: '520 KB',
      uploader: CURRENT_USER.name,
      uploaderId: CURRENT_USER.id,
      uploadedAt: now,
      note: '设备显示无报错、参数正常',
    },
  );
  message.success('已添加 2 个验收附件（本地 demo，未实际上传）');
}

function removeCompleteAtt(id: string) {
  completeAtts.value = completeAtts.value.filter((a) => a.id !== id);
}

function submitComplete() {
  const order = mockOrder();
  if (!order) return;
  if (!completeCause.value.trim()) {
    message.warning('请补充问题原因，可点击「AI 优化」自动生成');
    return;
  }
  if (!completeSolution.value.trim()) {
    message.warning('请填写解决方案，可点击「AI 优化」自动生成');
    return;
  }
  if (completeAtts.value.length === 0) {
    message.warning('请至少上传 1 个验收附件（截图或视频）');
    return;
  }
  const t = nowLabel();
  order.rootCause = completeCause.value.trim();
  order.solution = completeSolution.value.trim();
  order.acceptanceAttachments = [...completeAtts.value];
  order.completedAt = t;
  order.slaRemaining = '待客户验收';
  if (order.scenario === '运维工单' && order.currentNodeId) {
    const nextId = resolveFlowTransition(
      mockFlowGraph,
      order.currentNodeId,
      '记录处理结果',
    );
    if (nextId) order.currentNodeId = nextId;
  }
  order.status = 'pending-acceptance';
  pushTimelineLocal(order, {
    action: 'completed',
    time: t,
    operator: CURRENT_USER.name,
    operatorId: CURRENT_USER.id,
    summary: `${CURRENT_USER.name} 完成处理并提交验收材料（${completeAtts.value.length} 件），进入待验收`,
    extra: { acceptanceCount: String(completeAtts.value.length) },
  });
  completeOpen.value = false;
  message.success(`${order.code} 已完成处理，等待验收`);
}

// ==================== 操作：申请上门（弹窗补充说明 → 待上门调度） ====================

const onsiteOpen = ref(false);
const onsiteNote = ref('');

/** 申请上门补充说明默认文案：按 AI 总结的问题排查与处理方案生成 */
function buildOnsiteNote(): string {
  const s = scenario.value;
  return [
    `【问题排查】已按 AI 排查路径执行并记录：${s.checkSteps.join('；')}。`,
    `【故障判断】${s.judge}`,
    `【处理方案】${s.visitAdvice.steps.join('；')}（预计处理时间 ${s.visitAdvice.estimate}）。`,
  ].join('\n');
}

function requestOnsite() {
  onsiteNote.value = buildOnsiteNote();
  onsiteOpen.value = true;
}

function submitOnsite() {
  const order = mockOrder();
  if (!order) return;
  const note = onsiteNote.value.trim();
  if (!note) {
    message.warning('请填写补充说明');
    return;
  }
  const t = nowLabel();
  if (order.scenario === '运维工单' && order.currentNodeId) {
    const nextId = resolveFlowTransition(
      mockFlowGraph,
      order.currentNodeId,
      '申请上门',
    );
    if (nextId) order.currentNodeId = nextId;
  }
  order.status = 'pending-visit';
  pushTimelineLocal(order, {
    action: 'dispatched',
    time: t,
    operator: CURRENT_USER.name,
    operatorId: CURRENT_USER.id,
    summary: `${CURRENT_USER.name} 申请上门，工单进入待上门调度，等待调度安排`,
    reason: note,
  });
  onsiteOpen.value = false;
  message.success(`${order.code} 已申请上门，进入待上门调度`);
}

// ==================== 操作：改期（填写原因 → 退回待上门调度） ====================

const postponeOpen = ref(false);
const postponeReason = ref('');

function openPostpone() {
  postponeReason.value = '';
  postponeOpen.value = true;
}

function submitPostpone() {
  const order = mockOrder();
  if (!order) return;
  const reason = postponeReason.value.trim();
  if (!reason) {
    message.warning('请填写改期原因');
    return;
  }
  const t = nowLabel();
  order.status = 'pending-visit';
  pushTimelineLocal(order, {
    action: 'dispatched',
    time: t,
    operator: CURRENT_USER.name,
    operatorId: CURRENT_USER.id,
    summary: `${CURRENT_USER.name} 申请改期，工单退回待上门调度，需重新确认出发时间`,
    reason,
  });
  postponeOpen.value = false;
  message.success(`${order.code} 已申请改期，进入待上门调度`);
}

// ==================== 操作：确认出发（待上门调度 → 上门处理中） ====================

function confirmDepart() {
  const order = mockOrder();
  if (!order) return;
  const t = nowLabel();
  if (order.scenario === '运维工单' && order.currentNodeId) {
    const nextId = resolveFlowTransition(
      mockFlowGraph,
      order.currentNodeId,
      '确认出发',
    );
    if (nextId) order.currentNodeId = nextId;
  }
  order.status = 'onsite-processing';
  pushTimelineLocal(order, {
    action: 'dispatched',
    time: t,
    operator: CURRENT_USER.name,
    operatorId: CURRENT_USER.id,
    summary: `${CURRENT_USER.name} 确认出发，前往现场处理，工单进入上门处理中`,
  });
  message.success(`${order.code} 已确认出发，进入上门处理中`);
}

// ==================== AI 验收助手（待验收） ====================

const acceptChecks = computed(() => {
  const order = props.order;
  return [
    {
      ok: !!order.solution,
      label: '解决方案已填写',
      detail: order.solution
        ? '工程师已记录处理方案与结果'
        : '缺少解决方案记录',
    },
    {
      ok: (order.acceptanceAttachments?.length ?? 0) > 0,
      label: '验收附件已上传',
      detail: `已上传 ${order.acceptanceAttachments?.length ?? 0} 件复测凭证（截图 / 视频）`,
    },
    {
      ok: !!order.completedAt,
      label: '完成时间已记录',
      detail: order.completedAt ?? '未记录完成时间',
    },
  ];
});

/** AI 验收结论：完工材料齐全 → 问题已解决 */
const acceptSolved = computed(
  () =>
    !!props.order.solution &&
    (props.order.acceptanceAttachments?.length ?? 0) > 0,
);

const acceptSummary = computed(() => {
  const order = props.order;
  const report = scenario.value.solutionReport;
  return [
    `工程师处理记录：${order.solution || report.solution}`,
    `处理结果：${report.result}`,
    `验收建议：${report.acceptance}（已上传验收附件 ${order.acceptanceAttachments?.length ?? 0} 件）`,
  ].join(' ');
});

/** AI 生成的验收不通过原因（退回处理时预填） */
const aiRejectReason = computed(() => {
  const missing = acceptChecks.value.filter((c) => !c.ok).map((c) => c.label);
  return `AI 验收核对：${missing.length > 0 ? `${missing.join('、')}不满足闭环要求` : '客户侧反馈问题仍有复现'}。依据《IT 运维服务管理规范》第 5.4 条「闭环材料不齐全的工单，质量保障部有权驳回并退回处理人」，建议退回补充处理后重新提交验收。`;
});

const returnOpen = ref(false);
const returnReason = ref('');

function toggleReturn() {
  returnOpen.value = !returnOpen.value;
  if (returnOpen.value && !returnReason.value) {
    returnReason.value = aiRejectReason.value;
  }
}

function submitReturn() {
  const reason = returnReason.value.trim();
  if (!reason) {
    message.warning('请填写退回原因');
    return;
  }
  const order = mockOrder();
  if (!order) return;
  const t = nowLabel();
  if (order.scenario === '运维工单' && order.currentNodeId) {
    order.currentNodeId = 'fn-10';
  }
  order.status = 'processing';
  order.slaRemaining = '验收退回，重新处理中';
  pushTimelineLocal(order, {
    action: 'note',
    time: t,
    operator: CURRENT_USER.name,
    operatorId: CURRENT_USER.id,
    summary: `${CURRENT_USER.name} 验收不通过（AI 核对辅助），工单退回处理人重新处理`,
    reason,
  });
  returnOpen.value = false;
  message.warning(`${order.code} 已退回处理人重新处理`);
}

function acceptPass() {
  const order = mockOrder();
  if (!order) return;
  const t = nowLabel();
  if (order.scenario === '运维工单' && order.currentNodeId) {
    order.currentNodeId = 'fn-8';
    order.status = 'completed';
    order.slaRemaining = '已完成';
    pushTimelineLocal(order, {
      action: 'accepted',
      time: t,
      operator: CURRENT_USER.name,
      operatorId: CURRENT_USER.id,
      summary: `${CURRENT_USER.name} 验收通过，工单已完成`,
    });
    message.success(`${order.code} 验收通过，工单已完成`);
  } else {
    order.status = 'completed';
    order.slaRemaining = '已按时完成';
    pushTimelineLocal(order, {
      action: 'accepted',
      time: t,
      operator: CURRENT_USER.name,
      operatorId: CURRENT_USER.id,
      summary: `${CURRENT_USER.name} 验收通过，工单处理完成`,
    });
    message.success(`${order.code} 验收通过，工单已完成`);
  }
}
</script>

<template>
  <div class="tad-root">
    <div class="tad-body">
      <!-- ============ 左 · 工单扩展信息（基本信息已在详情页顶部展示） ============ -->
      <aside class="tad-context">
        <section class="tad-card">
          <h4>
            <Icon icon="lucide:clipboard-list" />
            问题描述
          </h4>
          <div class="tad-desc">
            <p>{{ order.description }}</p>
          </div>
        </section>

        <section class="tad-card">
          <h4>
            <Icon icon="lucide:paperclip" />
            故障附件
          </h4>
          <ul
            v-if="order.attachments && order.attachments.length > 0"
            class="tad-attach"
          >
            <li v-for="att in order.attachments" :key="att.id">
              <span class="tad-attach__icon">
                <Icon :icon="attachmentIcon(att.type)" />
              </span>
              <div class="tad-attach__main">
                <strong>{{ att.name }}</strong>
                <small>
                  <Tag>{{ attachmentLabel(att.type) }}</Tag>
                  {{ att.size }}
                  <template v-if="att.duration">· {{ att.duration }}</template>
                  · {{ att.uploader }} · {{ att.uploadedAt }}
                </small>
                <em v-if="att.note">{{ att.note }}</em>
              </div>
            </li>
          </ul>
          <p v-else class="tad-empty">暂无故障附件。</p>
        </section>

        <section v-if="order.solution" class="tad-card">
          <h4>
            <Icon icon="lucide:file-check-2" />
            处理方案
          </h4>
          <template v-if="order.rootCause">
            <h5>问题原因</h5>
            <pre class="tad-pre">{{ order.rootCause }}</pre>
            <h5>解决方案</h5>
          </template>
          <pre class="tad-pre">{{ order.solution }}</pre>
          <div
            v-if="order.acceptanceAttachments?.length"
            class="tad-attach-wrap"
          >
            <h5>验收附件（{{ order.acceptanceAttachments.length }} 件）</h5>
            <ul class="tad-attach">
              <li v-for="att in order.acceptanceAttachments" :key="att.id">
                <span class="tad-attach__icon">
                  <Icon :icon="attachmentIcon(att.type)" />
                </span>
                <div class="tad-attach__main">
                  <strong>{{ att.name }}</strong>
                  <small>
                    <Tag>{{ attachmentLabel(att.type) }}</Tag>
                    {{ att.size }}
                    <template v-if="att.duration">
                      · {{ att.duration }}
                    </template>
                    · {{ att.uploader }} · {{ att.uploadedAt }}
                  </small>
                  <em v-if="att.note">{{ att.note }}</em>
                </div>
              </li>
            </ul>
          </div>
        </section>

        <section v-if="order.rating" class="tad-card">
          <h4>
            <Icon icon="lucide:star" />
            客户评价
          </h4>
          <p class="tad-rating">
            {{ '★'.repeat(order.rating) }}{{ '☆'.repeat(5 - order.rating) }}
          </p>
          <pre v-if="order.evaluation" class="tad-pre">{{
            order.evaluation
          }}</pre>
        </section>

        <section v-if="order.cancelReason" class="tad-card">
          <h4>
            <Icon icon="lucide:circle-x" />
            取消原因
          </h4>
          <pre class="tad-pre is-danger">{{ order.cancelReason }}</pre>
        </section>

        <section
          v-if="order.transferHistory && order.transferHistory.length > 0"
          class="tad-card"
        >
          <h4>
            <Icon icon="lucide:repeat" />
            转派历史
          </h4>
          <ul class="tad-transfer">
            <li v-for="r in order.transferHistory" :key="r.id">
              <strong>
                {{ r.fromAssignee || '—' }}
                <Icon icon="lucide:arrow-right" />
                {{ r.toAssignee }}
              </strong>
              <small>{{ r.operator }} 操作 · {{ r.time }}</small>
              <em>转派理由：{{ r.reason }}</em>
            </li>
          </ul>
        </section>

        <section class="tad-card">
          <h4>
            <Icon icon="lucide:git-branch" />
            流转状态
          </h4>
          <ul class="tad-timeline">
            <li v-for="t in sortedTimeline" :key="t.id">
              <i>
                <Icon :icon="timelineIcon[t.action] || 'lucide:circle'" />
              </i>
              <div>
                <strong>
                  <Tag
                    :color="timelineActionColor(t.action)"
                    class="tad-timeline__tag"
                  >
                    {{ timelineActionLabel(t.action) }}
                  </Tag>
                  {{ t.summary }}
                </strong>
                <small>{{ t.time }} · {{ t.operator }}</small>
                <em v-if="t.reason">备注：{{ t.reason }}</em>
              </div>
            </li>
          </ul>
        </section>
      </aside>

      <!-- ============ 右 70% · AI 工作区 ============ -->
      <main class="tad-workspace">
        <header class="tad-ws-head">
          <div class="tad-ws-title">
            <span class="ai-badge">
              <Icon :icon="formMeta.icon" />
              {{ formMeta.name }}
            </span>
            <p>{{ formMeta.desc }}</p>
          </div>
          <span
            v-if="['diagnose', 'remote', 'accept'].includes(stage)"
            class="tad-ws-conf"
          >
            <svg viewBox="0 0 64 64" class="tad-conf-ring">
              <circle
                cx="32"
                cy="32"
                :r="confRing.r"
                fill="none"
                stroke="rgba(255, 255, 255, 0.28)"
                stroke-width="6"
              />
              <circle
                cx="32"
                cy="32"
                :r="confRing.r"
                fill="none"
                stroke="#f6d88b"
                stroke-width="6"
                stroke-linecap="round"
                :stroke-dasharray="confRing.dasharray"
                :stroke-dashoffset="confRing.dashoffset"
                transform="rotate(-90 32 32)"
              />
              <text x="32" y="37" text-anchor="middle" class="tad-conf-num">
                {{ confidence }}%
              </text>
            </svg>
            置信度
          </span>
        </header>

        <!-- ✨ 形态一 · 刚接单：问题研判 -->
        <template v-if="stage === 'diagnose'">
          <article class="tad-pane is-diagnose">
            <ol class="tad-flow">
              <li>
                <h5>问题总结</h5>
                <p>{{ scenario.summary }}</p>
              </li>
              <li>
                <h5>故障判断</h5>
                <p>{{ scenario.judge }}</p>
              </li>
              <li class="is-recommend">
                <h5>推荐处理方式</h5>
                <p class="tad-recommend">
                  <span class="tad-recommend__dot"></span>
                  {{ scenarioRecommendLabel() }}
                </p>
                <p class="tad-recommend__reason">
                  {{
                    scenario.recommend === 'transfer' ? '转派原因：' : '原因：'
                  }}{{ scenario.recommendReason }}
                </p>
                <button
                  v-if="order.status === 'dispatched'"
                  type="button"
                  class="tad-basis-toggle"
                  @click="showBasis = !showBasis"
                >
                  <Icon
                    :icon="
                      showBasis ? 'lucide:chevron-up' : 'lucide:chevron-down'
                    "
                  />
                  {{ showBasis ? '收起 AI 分析依据' : '查看 AI 分析依据' }}
                </button>
                <ul v-if="showBasis && guide" class="tad-basis">
                  <li v-for="r in guide.reasons" :key="r.title">
                    <strong>{{ r.title }}</strong>
                    <p>{{ r.detail }}</p>
                  </li>
                </ul>
              </li>
            </ol>
          </article>

          <!-- ✨ AI 推荐操作（独立卡片，置于工作区所有卡片下方） -->
          <div v-if="order.status === 'dispatched'" class="tad-actions">
            <p class="tad-actions__tip">
              <Icon icon="lucide:sparkles" />
              AI 推荐操作：{{ recommendClaim ? '确认接单' : '建议转派' }}
            </p>
            <div class="tad-actions__btns">
              <Button
                :type="recommendClaim ? 'primary' : 'default'"
                @click="confirmAccept"
              >
                <Icon icon="lucide:check-check" />
                确认接单
              </Button>
              <Button
                :type="recommendClaim ? 'default' : 'primary'"
                @click="openTransfer"
              >
                <Icon icon="lucide:arrow-right-left" />
                转派
              </Button>
            </div>
          </div>
        </template>

        <!-- ✨ 形态二 · 远程处理：AI 处理助手 -->
        <template v-else-if="stage === 'remote'">
          <!-- ✨ AI 推荐处理方案卡片（问题总结/故障判断/推荐处理方式/推荐操作，与待接单研判卡样式一致） -->
          <article class="tad-pane is-diagnose">
            <ol v-if="recommendedPlan" class="tad-flow">
              <li>
                <h5>问题总结</h5>
                <p>{{ scenario.summary }}</p>
              </li>
              <li>
                <h5>故障判断</h5>
                <p>{{ scenario.judge }}</p>
              </li>
              <li class="is-recommend">
                <h5>推荐处理方式</h5>
                <p class="tad-recommend">
                  <span class="tad-recommend__dot"></span>
                  {{ remotePlanName }}
                </p>
                <p class="tad-recommend__reason">
                  {{ recommendedPlan.applicableScene }}；{{
                    similarCaseSummary
                  }}
                </p>
                <button
                  type="button"
                  class="tad-basis-toggle"
                  @click="showPlanDetail = !showPlanDetail"
                >
                  <Icon
                    :icon="
                      showPlanDetail
                        ? 'lucide:chevron-up'
                        : 'lucide:chevron-down'
                    "
                  />
                  {{ showPlanDetail ? '收起方案详情' : '查看方案详情' }}
                </button>
                <ul v-if="showPlanDetail" class="tad-basis">
                  <li>
                    <strong>预期效果</strong>
                    <p>{{ recommendedPlan.expectedEffect }}</p>
                  </li>
                  <li>
                    <strong>关键步骤</strong>
                    <p>{{ planStepsText }}</p>
                  </li>
                  <li v-if="recommendedPlan.risks.length > 0">
                    <strong>潜在风险</strong>
                    <p>{{ recommendedPlan.risks.join('\n') }}</p>
                  </li>
                </ul>
              </li>
            </ol>
          </article>

          <!-- ✨ AI 上门建议（远程无法修复时的处理预案；推荐直接完成处理时不展示） -->
          <article v-if="remoteRecommend !== 'complete'" class="tad-visit">
            <header class="tad-visit__head">
              <span class="ai-badge">
                <Icon icon="lucide:truck" />
                AI 上门建议
              </span>
              <span class="tad-visit__est">
                <Icon icon="lucide:clock" />
                预计处理时间：{{ scenario.visitAdvice.estimate }}
              </span>
            </header>
            <div class="tad-visit__grid">
              <div>
                <h5>建议上门原因</h5>
                <p>{{ scenario.visitAdvice.reason }}</p>
              </div>
              <div>
                <h5>建议携带</h5>
                <ul>
                  <li v-for="item in scenario.visitAdvice.items" :key="item">
                    <Icon icon="lucide:package-check" />
                    {{ item }}
                  </li>
                </ul>
              </div>
              <div>
                <h5>建议处理</h5>
                <ol>
                  <li v-for="s in scenario.visitAdvice.steps" :key="s">
                    {{ s }}
                  </li>
                </ol>
              </div>
            </div>
          </article>

          <!-- ✨ AI 推荐操作（独立卡片，置于工作区所有卡片下方）：完成处理 / 申请上门 / 转派 -->
          <div class="tad-actions">
            <p class="tad-actions__tip">
              <Icon icon="lucide:sparkles" />
              AI 推荐操作：{{ remoteRecommendLabel }}
            </p>
            <div class="tad-actions__btns">
              <Button
                :type="remoteRecommend === 'complete' ? 'primary' : 'default'"
                @click="toggleComplete"
              >
                <Icon icon="lucide:clipboard-pen" />
                完成处理
              </Button>
              <Button
                :type="remoteRecommend === 'onsite' ? 'primary' : 'default'"
                @click="requestOnsite"
              >
                <Icon icon="lucide:truck" />
                申请上门
              </Button>
              <Button
                :type="remoteRecommend === 'transfer' ? 'primary' : 'default'"
                @click="openTransfer"
              >
                <Icon icon="lucide:arrow-right-left" />
                转派
              </Button>
            </div>
          </div>
        </template>

        <!-- ✨ 形态二·五 · 待上门调度：AI 上门调度助手 -->
        <template v-else-if="stage === 'visit'">
          <!-- ✨ AI 上门调度建议 -->
          <article class="tad-visit">
            <header class="tad-visit__head">
              <span class="ai-badge">
                <Icon icon="lucide:truck" />
                AI 上门调度建议
              </span>
              <span class="tad-visit__est">
                <Icon icon="lucide:clock" />
                预计处理时间：{{ scenario.visitAdvice.estimate }}
              </span>
            </header>
            <div class="tad-visit__grid">
              <div>
                <h5>建议上门原因</h5>
                <p>{{ scenario.visitAdvice.reason }}</p>
              </div>
              <div>
                <h5>建议携带</h5>
                <ul>
                  <li v-for="item in scenario.visitAdvice.items" :key="item">
                    <Icon icon="lucide:package-check" />
                    {{ item }}
                  </li>
                </ul>
              </div>
              <div>
                <h5>建议处理</h5>
                <ol>
                  <li v-for="s in scenario.visitAdvice.steps" :key="s">
                    {{ s }}
                  </li>
                </ol>
              </div>
            </div>
          </article>

          <!-- 调度操作：确认出发 / 转派（样式与 AI 推荐操作区一致） -->
          <div class="tad-actions">
            <p class="tad-actions__tip">
              <Icon icon="lucide:sparkles" />
              AI 推荐操作：确认出发
            </p>
            <div class="tad-actions__btns">
              <Button type="primary" @click="confirmDepart">
                <Icon icon="lucide:send" />
                确认出发
              </Button>
              <Button @click="openTransfer">
                <Icon icon="lucide:arrow-right-left" />
                转派
              </Button>
            </div>
          </div>
        </template>

        <!-- ✨ 形态三 · 上门处理中：AI 现场助手 -->
        <template v-else-if="stage === 'field'">
          <article class="tad-pane">
            <ol class="tad-flow">
              <li>
                <h5>问题总结</h5>
                <p class="tad-fieldmeta">
                  <span>历史排查情况</span>
                  {{ scenario.checkSteps.join('；') }}
                </p>
                <p class="tad-fieldmeta">
                  <span>申请上门原因</span>
                  {{ scenario.visitAdvice.reason }}
                </p>
              </li>
              <li>
                <h5>建议现场处理事项</h5>
                <ul class="tad-fieldsteps">
                  <li v-for="s in scenario.visitAdvice.steps" :key="s">
                    <Icon icon="lucide:clipboard-check" />
                    {{ s }}
                  </li>
                </ul>
              </li>
            </ol>
          </article>

          <!-- ✨ AI 推荐操作（独立卡片，置于工作区所有卡片下方）：完成处理 / 改期 -->
          <div class="tad-actions">
            <p class="tad-actions__tip">
              <Icon icon="lucide:sparkles" />
              AI 推荐操作：完成处理
            </p>
            <div class="tad-actions__btns">
              <Button type="primary" @click="toggleComplete">
                <Icon icon="lucide:clipboard-pen" />
                完成处理
              </Button>
              <Button @click="openPostpone">
                <Icon icon="lucide:calendar-clock" />
                改期
              </Button>
            </div>
          </div>
        </template>

        <!-- ✨ 形态三·五 · 待验收：AI 验收助手 -->
        <template v-else-if="stage === 'accept'">
          <article class="tad-pane is-accept">
            <!-- 结果完整性检查 -->
            <section class="tad-accept">
              <header class="tad-accept__head">
                <span class="ai-badge">
                  <Icon icon="lucide:clipboard-check" />
                  结果完整性检查
                </span>
                <span class="tad-accept__count">
                  {{ acceptChecks.filter((c) => c.ok).length }}/{{
                    acceptChecks.length
                  }}
                  项通过
                </span>
              </header>
              <ul class="tad-accept__checks">
                <li
                  v-for="c in acceptChecks"
                  :key="c.label"
                  :class="c.ok ? 'is-ok' : 'is-miss'"
                >
                  <span class="tad-accept__mark">
                    <Icon
                      :icon="c.ok ? 'lucide:check' : 'lucide:alert-triangle'"
                    />
                  </span>
                  <div>
                    <strong>{{ c.label }}</strong>
                    <p>{{ c.detail }}</p>
                  </div>
                </li>
              </ul>
            </section>

            <!-- AI 验收摘要 + 结论 -->
            <section class="tad-accept">
              <header class="tad-accept__head">
                <span class="ai-badge">
                  <Icon icon="lucide:sparkles" />
                  AI 验收摘要
                </span>
              </header>
              <p class="tad-accept__summary">{{ acceptSummary }}</p>
              <div
                class="tad-accept__verdict"
                :class="acceptSolved ? 'is-solved' : 'is-hold'"
              >
                <span class="tad-accept__verdict-icon">
                  <Icon
                    :icon="
                      acceptSolved
                        ? 'lucide:circle-check'
                        : 'lucide:circle-alert'
                    "
                  />
                </span>
                <div>
                  <strong>
                    {{
                      acceptSolved
                        ? '结论：问题已解决，建议验收通过'
                        : '结论：建议暂不验收'
                    }}
                  </strong>
                  <p>
                    {{
                      acceptSolved
                        ? '完工材料齐全，处理结果与验收附件相互印证，可直接验收。'
                        : '闭环材料不齐全，建议退回处理人补充后重新提交验收。'
                    }}
                  </p>
                </div>
              </div>
            </section>

            <!-- 验收操作 -->
            <div class="tad-actions">
              <p class="tad-actions__tip">
                <Icon icon="lucide:sparkles" />
                AI 建议：{{ acceptSolved ? '验收通过' : '退回处理' }}（置信度
                {{ confidence }}%）
              </p>
              <div class="tad-actions__btns">
                <Button v-if="acceptSolved" type="primary" @click="acceptPass">
                  <Icon icon="lucide:check-check" />
                  验收通过
                </Button>
                <Button
                  :type="acceptSolved ? 'default' : 'primary'"
                  :danger="!acceptSolved"
                  @click="toggleReturn"
                >
                  <Icon icon="lucide:undo-2" />
                  退回处理
                </Button>
              </div>

              <!-- 退回原因（预填 AI 生成的验收不通过原因） -->
              <div v-if="returnOpen" class="tad-return">
                <label>
                  退回原因（AI 已生成验收不通过原因，可修改）
                  <button
                    type="button"
                    class="tad-ai-mini"
                    @click="returnReason = aiRejectReason"
                  >
                    <Icon icon="lucide:sparkles" />
                    重新生成
                  </button>
                </label>
                <Input.TextArea
                  v-model:value="returnReason"
                  :rows="4"
                  placeholder="填写验收不通过原因"
                />
                <div class="tad-return__btns">
                  <Button type="primary" danger @click="submitReturn">
                    <Icon icon="lucide:undo-2" />
                    确认退回
                  </Button>
                  <Button @click="returnOpen = false">取消</Button>
                </div>
              </div>
            </div>
          </article>
        </template>

        <!-- ✨ 形态四 · 处理完成：AI 处理总结 -->
        <article v-else class="tad-pane is-report">
          <section class="tad-report" :class="{ 'is-closed': isClosed }">
            <header class="tad-report__head">
              <span class="ai-badge">
                <Icon icon="lucide:sparkles" />
                AI 处理总结
              </span>
              <span v-if="isClosed" class="tad-report__ok">
                <Icon icon="lucide:party-popper" />
                工单已闭环
              </span>
            </header>
            <dl>
              <div>
                <dt>故障原因</dt>
                <dd>{{ scenario.solutionReport.cause }}</dd>
              </div>
              <div>
                <dt>处理过程</dt>
                <dd>{{ scenario.solutionReport.process }}</dd>
              </div>
              <div>
                <dt>处理方案</dt>
                <dd>{{ scenario.solutionReport.solution }}</dd>
              </div>
              <div>
                <dt>处理结果</dt>
                <dd>{{ scenario.solutionReport.result }}</dd>
              </div>
              <div>
                <dt>验收建议</dt>
                <dd>{{ scenario.solutionReport.acceptance }}</dd>
              </div>
            </dl>
            <footer class="tad-report__foot">
              <span class="tad-report__source">
                <Icon icon="lucide:info" />
                依据工程师现场记录「{{ scenario.engineerNote }}」自动整理
              </span>
            </footer>
          </section>
        </article>

        <!-- ✨ 完成处理录入框（问题原因 / 解决方案 / 附件，支持 AI 优化；远程 / 现场形态共用） -->
        <div v-if="completeOpen" class="tad-complete">
          <div class="tad-complete__field">
            <label>
              问题原因
              <button
                type="button"
                class="tad-ai-mini"
                @click="aiOptimize('cause')"
              >
                <Icon icon="lucide:sparkles" />
                AI 优化
              </button>
            </label>
            <Input.TextArea
              v-model:value="completeCause"
              :rows="2"
              placeholder="填写问题根因，可点击 AI 优化自动生成"
            />
          </div>
          <div class="tad-complete__field">
            <label>
              解决方案
              <button
                type="button"
                class="tad-ai-mini"
                @click="aiOptimize('solution')"
              >
                <Icon icon="lucide:sparkles" />
                AI 优化
              </button>
            </label>
            <Input.TextArea
              v-model:value="completeSolution"
              :rows="3"
              placeholder="填写解决方案与处理结果，可点击 AI 优化自动生成"
            />
          </div>
          <div class="tad-complete__field">
            <label>
              验收附件
              <button
                type="button"
                class="tad-ai-mini"
                @click="addCompleteAtts"
              >
                <Icon icon="lucide:upload" />
                添加演示附件
              </button>
            </label>
            <ul v-if="completeAtts.length > 0" class="tad-complete__atts">
              <li v-for="a in completeAtts" :key="a.id">
                <Icon icon="lucide:paperclip" />
                <span>{{ a.name }}</span>
                <small>{{ a.size }}</small>
                <button type="button" @click="removeCompleteAtt(a.id)">
                  <Icon icon="lucide:x" />
                </button>
              </li>
            </ul>
            <p v-else class="tad-complete__empty">
              至少上传 1 份复测截图或视频作为闭环凭证
            </p>
          </div>
          <div class="tad-complete__btns">
            <Button type="primary" @click="submitComplete">
              <Icon icon="lucide:check-check" />
              提交完成处理
            </Button>
            <Button @click="completeOpen = false">收起</Button>
          </div>
        </div>
      </main>

      <!-- ✨ AI 转派助手：人员匹配 + 转派原因 + 工作交接 + 上下文传递 -->
      <Modal
        v-model:open="transferOpen"
        title="AI 转派助手"
        :width="680"
        :footer="null"
      >
        <!-- AI 推荐人选 -->
        <div v-if="transferRecommended" class="tm-recommend">
          <header>
            <span class="ai-badge">
              <Icon icon="lucide:sparkles" />
              AI 推荐人选
            </span>
            <span class="tm-match">
              匹配度 {{ transferRecommended.score }}%
            </span>
          </header>
          <div
            class="tm-card is-recommend"
            :class="{
              'is-active': transferSelectedId === transferRecommended.id,
            }"
            @click="transferSelectedId = transferRecommended.id"
          >
            <span class="tm-card__avatar">
              {{ transferRecommended.name.slice(0, 1) }}
            </span>
            <span class="tm-card__main">
              <strong>
                {{ transferRecommended.name }}
                <em>{{ transferRecommended.role }}</em>
              </strong>
              <small>
                {{ transferRecommended.team }} ·
                {{ transferRecommended.area }} · 当前负载
                {{ transferRecommended.workload }} 单
              </small>
              <ul>
                <li v-for="r in transferRecommended.reasons" :key="r">
                  <Icon icon="lucide:sparkles" />
                  {{ r }}
                </li>
              </ul>
            </span>
            <span class="tm-card__pick">
              <Icon
                :icon="
                  transferSelectedId === transferRecommended.id
                    ? 'lucide:circle-check'
                    : 'lucide:circle'
                "
              />
            </span>
          </div>
        </div>

        <!-- 搜索其他人员 -->
        <div class="tm-search">
          <label>搜索其他人员</label>
          <Input
            v-model:value="transferKeyword"
            allow-clear
            placeholder="输入姓名 / 角色 / 团队 / 区域搜索"
          >
            <template #prefix>
              <Icon icon="lucide:search" />
            </template>
          </Input>
          <ul v-if="transferFiltered.length > 0" class="tm-list">
            <li
              v-for="c in transferFiltered"
              :key="c.id"
              :class="{ 'is-active': transferSelectedId === c.id }"
              @click="transferSelectedId = c.id"
            >
              <span class="tm-card__avatar">
                {{ c.name.slice(0, 1) }}
              </span>
              <span class="tm-card__main">
                <strong>
                  {{ c.name }}
                  <em>{{ c.role }}</em>
                </strong>
                <small>
                  {{ c.team }} · {{ c.area }} · 负载 {{ c.workload }} 单
                </small>
              </span>
              <span class="tm-card__score">{{ c.score }}%</span>
              <span class="tm-card__pick">
                <Icon
                  :icon="
                    transferSelectedId === c.id
                      ? 'lucide:circle-check'
                      : 'lucide:circle'
                  "
                />
              </span>
            </li>
          </ul>
          <p v-else class="tm-empty">未找到匹配人员，请更换关键词</p>
        </div>

        <!-- 转派原因（一键填写：转派原因 + 工作交接 + 上下文传递） -->
        <div class="tm-reason">
          <label>
            转派原因
            <button
              type="button"
              class="tad-ai-mini"
              @click="fillTransferReason"
            >
              <Icon icon="lucide:sparkles" />
              一键填写
            </button>
          </label>
          <Input.TextArea
            v-model:value="transferReason"
            :rows="5"
            placeholder="可点击「一键填写」由 AI 生成，自动覆盖转派原因、工作交接与上下文传递"
          />
        </div>

        <div class="tm-btns">
          <Button @click="transferOpen = false">取消</Button>
          <Button type="primary" @click="submitTransfer">
            <Icon icon="lucide:check-check" />
            确认转派
          </Button>
        </div>
      </Modal>

      <!-- 申请上门弹窗：补充说明默认按 AI 总结填充，支持人为修改 -->
      <Modal
        v-model:open="onsiteOpen"
        title="申请上门"
        :width="560"
        :footer="null"
      >
        <p class="om-tip">
          <Icon icon="lucide:sparkles" />
          补充说明已按 AI 总结的问题排查与处理方案自动填充，可自行修改
        </p>
        <div class="tm-reason">
          <label>补充说明</label>
          <Input.TextArea
            v-model:value="onsiteNote"
            :rows="7"
            placeholder="请补充上门说明"
          />
        </div>
        <div class="tm-btns">
          <Button @click="onsiteOpen = false">取消</Button>
          <Button type="primary" @click="submitOnsite">
            <Icon icon="lucide:truck" />
            确认申请上门
          </Button>
        </div>
      </Modal>

      <!-- 改期弹窗：填写改期原因（客户改期 / 待更换配件等），提交后退回待上门调度 -->
      <Modal
        v-model:open="postponeOpen"
        title="申请改期"
        :width="560"
        :footer="null"
      >
        <div class="tm-reason">
          <label>改期原因</label>
          <Input.TextArea
            v-model:value="postponeReason"
            :rows="5"
            placeholder="如：客户要求改期至明天下午；待更换配件到货后重新安排上门"
          />
        </div>
        <div class="tm-btns">
          <Button @click="postponeOpen = false">取消</Button>
          <Button type="primary" @click="submitPostpone">
            <Icon icon="lucide:calendar-check" />
            确认改期
          </Button>
        </div>
      </Modal>
    </div>
  </div>
</template>

<style scoped>
@keyframes tad-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes tad-slide-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ============ 响应式（抽屉内窄屏） ============ */
@media (max-width: 1000px) {
  .tad-body {
    grid-template-columns: 1fr;
  }
}

.tad-root {
  min-width: 0;
}

.tad-body {
  display: grid;

  /* 左 60% 工单上下文 · 右 40% AI 工作区 */
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  gap: 16px;
}

/* ============ 左栏 · 工单上下文 ============ */
.tad-context {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.tad-card {
  padding: 13px 15px;
  background: #f9fcfa;
  border: 1px solid #e3efe9;
  border-radius: 14px;
}

.tad-card h4 {
  display: flex;
  gap: 6px;
  align-items: center;
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 800;
  color: #0c2f28;
}

.tad-card h4 svg {
  width: 14px;
  height: 14px;
  color: #0b6e65;
}

.tad-desc {
  padding: 0;
  margin: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
}

.tad-desc p {
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: #2c4a42;
}

.tad-pre {
  padding: 0;
  margin: 0;
  font-family: inherit;
  font-size: 12px;
  line-height: 1.7;
  color: #2c4a42;
  word-break: break-all;
  white-space: pre-wrap;
}

.tad-pre.is-danger {
  color: #a3382e;
}

.tad-rating {
  margin: 0 0 6px;
  font-size: 13px;
  color: #d5922c;
}

/* 附件列表（故障附件 / 验收附件共用） */
.tad-attach {
  padding: 0;
  margin: 0;
  list-style: none;
}

.tad-attach li {
  display: flex;
  gap: 9px;
  padding: 7px 9px;
  margin-bottom: 6px;
  background: #f4faf7;
  border: 1px solid #e3efe8;
  border-radius: 8px;
}

.tad-attach__icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  color: #0b6e65;
  background: #e0efe8;
  border-radius: 7px;
}

.tad-attach__icon svg {
  width: 13px;
  height: 13px;
}

.tad-attach__main {
  min-width: 0;
}

.tad-attach__main strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11.5px;
  font-weight: 600;
  line-height: 1.5;
  color: #17362e;
  white-space: nowrap;
}

.tad-attach__main small {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  align-items: center;
  margin-top: 1px;
  font-size: 10.5px;
  color: #8ba09a;
}

.tad-attach__main small :deep(.ant-tag) {
  margin: 0;
  font-size: 10px;
  line-height: 15px;
}

.tad-attach__main em {
  display: block;
  margin-top: 2px;
  font-size: 10.5px;
  font-style: normal;
  color: #5f7a72;
}

/* 验收附件包裹区 */
.tad-attach-wrap {
  padding-top: 8px;
  margin-top: 8px;
  border-top: 1px dashed #dceae3;
}

.tad-card h5 {
  margin: 9px 0 7px;
  font-size: 11.5px;
  font-weight: 600;
  color: #40615a;
}

.tad-attach-wrap h5 {
  margin: 0 0 7px;
  font-size: 11.5px;
  font-weight: 600;
  color: #40615a;
}

/* 卡片内空态 */
.tad-empty {
  margin: 0;
  font-size: 11.5px;
  color: #9db3ac;
}

/* 转派历史 */
.tad-transfer {
  padding: 0;
  margin: 0;
  list-style: none;
}

.tad-transfer li {
  padding: 7px 9px;
  margin-bottom: 6px;
  background: #fdf8ef;
  border: 1px solid #f0e6d2;
  border-radius: 8px;
}

.tad-transfer li strong {
  display: flex;
  gap: 5px;
  align-items: center;
  font-size: 11.5px;
  font-weight: 600;
  color: #17362e;
}

.tad-transfer li strong svg {
  width: 11px;
  height: 11px;
  color: #c7772a;
}

.tad-transfer li small {
  display: block;
  margin-top: 1px;
  font-size: 10.5px;
  color: #8ba09a;
}

.tad-transfer li em {
  display: block;
  margin-top: 2px;
  font-size: 10.5px;
  font-style: normal;
  color: #5f7a72;
}

/* 流转状态时间线 */
.tad-timeline {
  padding: 0;
  margin: 0;
  list-style: none;
}

.tad-timeline li {
  position: relative;
  display: flex;
  gap: 9px;
  padding: 0 0 13px 6px;
}

.tad-timeline li i {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  color: #0b6e65;
  background: #e5f2ee;
  border-radius: 50%;
}

.tad-timeline li i svg {
  width: 12px;
  height: 12px;
}

.tad-timeline li::after {
  position: absolute;
  top: 26px;
  bottom: 2px;
  left: 16px;
  width: 1px;
  content: '';
  background: #dceae3;
}

.tad-timeline li:last-child::after {
  display: none;
}

.tad-timeline li:last-child i {
  color: #fff;
  background: #0b6e65;
}

.tad-timeline strong {
  display: block;
  font-size: 11.5px;
  font-weight: 600;
  line-height: 1.55;
  color: #17362e;
}

.tad-timeline__tag {
  margin-right: 5px;
  font-size: 10px;
}

.tad-timeline small {
  display: block;
  margin-top: 1px;
  font-size: 10.5px;
  color: #8ba09a;
}

.tad-timeline em {
  display: block;
  margin-top: 2px;
  font-size: 10.5px;
  font-style: normal;
  color: #a3382e;
}

/* ============ 右栏 · AI 工作区 ============ */
.tad-workspace {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.tad-ws-head {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(165deg, #0b6e65, #0f8072);
  border: 1px solid #0b6e65;
  border-radius: 14px;
}

.tad-ws-title {
  display: flex;

  /* 说明区占 80% 宽度 */
  flex: 8;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.tad-ws-title p {
  margin: 0;
  font-size: 11.5px;
  color: rgb(255 255 255 / 75%);
}

.tad-ws-conf {
  /* 置信度区占 20% 宽度，内容靠右 */
  display: flex;
  flex: 2;
  gap: 7px;
  align-items: flex-start;
  justify-content: flex-end;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
}

.tad-conf-ring {
  width: 44px;
  height: 44px;
}

.tad-conf-num {
  font-size: 15px;
  font-weight: 800;
  fill: #fff;
}

/* ============ AI 徽章 ============ */
.ai-badge {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  width: fit-content;
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
  animation: tad-spin 1s linear infinite;
}

/* ============ 形态面板通用 ============ */
.tad-pane {
  padding: 16px;
  background: #fff;
  border: 1px solid #dceae3;
  border-radius: 14px;
  animation: tad-slide-in 0.4s ease;
}

.tad-pane.is-diagnose {
  background: linear-gradient(165deg, #fdfef9, #f4faf7);
  border-top: 3px solid #c98b2c;
}

.tad-pane.is-report {
  background: linear-gradient(165deg, #fdfef9, #f9fcfa);
}

/* ============ 形态一 · 问题研判（垂直流程） ============ */
.tad-flow {
  padding: 0;
  margin: 0;
  list-style: none;
}

.tad-flow > li {
  position: relative;
  padding: 0 0 16px 22px;
}

.tad-flow > li::before {
  position: absolute;
  top: 18px;
  bottom: 2px;
  left: 5px;
  width: 2px;
  content: '';
  background: #dceae3;
}

.tad-flow > li:last-child::before {
  display: none;
}

.tad-flow > li::after {
  position: absolute;
  top: 4px;
  left: 0;
  width: 12px;
  height: 12px;
  content: '';
  background: #0b6e65;
  border-radius: 50%;
  box-shadow: 0 0 0 3px #e5f2ee;
}

.tad-flow > li.is-recommend::after {
  background: #c98b2c;
  box-shadow: 0 0 0 3px #fdf3e0;
}

.tad-flow h5 {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 800;
  color: #0c4a3f;
}

.tad-flow p {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.7;
  color: #2c4a42;
}

.tad-recommend {
  display: inline-flex;
  gap: 7px;
  align-items: center;
  font-size: 13px !important;
  font-weight: 800;
  color: #1f8a5f !important;
}

.tad-recommend__dot {
  width: 9px;
  height: 9px;
  background: #22a06b;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgb(34 160 107 / 18%);
}

.tad-recommend__reason {
  margin-top: 4px !important;
  font-size: 11.5px !important;
  color: #5a756d !important;
}

/* ============ AI 上门建议 ============ */
.tad-visit {
  padding: 12px 16px;
  background: linear-gradient(165deg, #fdfef9, #f7fbf8);
  border: 1px solid #cfe4da;
  border-left: 3px solid #0b6e65;
  border-radius: 14px;
  animation: tad-slide-in 0.45s ease;
}

.tad-visit__head {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
}

.tad-visit__est {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  font-size: 11.5px;
  font-weight: 600;
  color: #557067;
}

.tad-visit__est svg {
  width: 12px;
  height: 12px;
}

.tad-visit__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  margin-top: 12px;
}

.tad-visit__grid h5 {
  margin: 0 0 6px;
  font-size: 11.5px;
  font-weight: 800;
  color: #0c4a3f;
}

.tad-visit__grid p {
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: #2c4a42;
}

.tad-visit__grid ul,
.tad-visit__grid ol {
  padding: 0;
  margin: 0;
  list-style: none;
}

.tad-visit__grid li {
  display: flex;
  gap: 6px;
  align-items: flex-start;
  padding: 3px 0;
  font-size: 12px;
  line-height: 1.6;
  color: #2c4a42;
}

.tad-visit__grid li svg {
  flex: none;
  width: 13px;
  height: 13px;
  margin-top: 3px;
  color: #0b6e65;
}

/* ============ 形态三 · AI 现场助手 ============ */
.tad-fieldmeta {
  margin: 0 0 7px;
  font-size: 12.5px;
  line-height: 1.7;
  color: #2c4a42;
}

.tad-fieldmeta span {
  display: inline-block;
  padding: 1px 8px;
  margin-right: 7px;
  font-size: 10.5px;
  font-weight: 700;
  color: #0c4a3f;
  background: #e5f2ee;
  border-radius: 5px;
}

.tad-fieldsteps {
  padding: 0;
  margin: 0;
  list-style: none;
}

.tad-fieldsteps li {
  display: flex;
  gap: 7px;
  align-items: flex-start;
  padding: 5px 0;
  font-size: 12.5px;
  line-height: 1.65;
  color: #2c4a42;
}

.tad-fieldsteps li svg {
  flex: none;
  width: 14px;
  height: 14px;
  margin-top: 3px;
  color: #1f8a5f;
}

/* ============ 形态四 · AI 处理总结 ============ */
.tad-report {
  overflow: hidden;
  background: #fff;
  border: 1px solid #cfe4da;
  border-top: 3px solid #1f8a5f;
  border-radius: 14px;
  animation: tad-slide-in 0.45s ease;
}

.tad-report.is-closed {
  border-top-color: #0b6e65;
}

.tad-report__head {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
}

.tad-report__ok {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  font-size: 12px;
  font-weight: 800;
  color: #0b6e65;
}

.tad-report dl {
  padding: 0 16px;
  margin: 0;
}

.tad-report dl > div {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 10px;
  padding: 9px 0;
  border-top: 1px dashed #e3efe9;
}

.tad-report dl > div:first-child {
  border-top: 0;
}

.tad-report dt {
  font-size: 11.5px;
  font-weight: 800;
  line-height: 1.9;
  color: #0c4a3f;
}

.tad-report dd {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.7;
  color: #2c4a42;
}

.tad-report__foot {
  padding: 12px 16px;
  background: #f7fbf9;
  border-top: 1px solid #eef4f1;
}

.tad-report__source {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  font-size: 11px;
  color: #557067;
}

.tad-report__source svg {
  flex: none;
  width: 12px;
  height: 12px;
}

/* ============ 形态一扩展 · AI 分析依据折叠 ============ */
.tad-basis-toggle {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 0;
  margin-top: 11px;
  font-size: 11.5px;
  font-weight: 600;
  color: #0b6e65;
  cursor: pointer;
  background: none;
  border: none;
}

.tad-basis-toggle svg {
  width: 13px;
  height: 13px;
}

.tad-basis {
  display: grid;
  gap: 8px;
  padding: 10px 12px;
  margin: 10px 0 0;
  list-style: none;
  background: #fff;
  border: 1px dashed #bcd9cc;
  border-radius: 10px;
}

.tad-basis strong {
  font-size: 11.5px;
  color: #0b6e65;
}

.tad-basis p {
  margin: 3px 0 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: #4c6b62;
  white-space: pre-line;
}

/* ============ 推荐操作区（确认接单 / 验收操作共用） ============ */
.tad-actions {
  padding: 13px 15px;
  margin-top: 14px;
  background: linear-gradient(135deg, #effaf5 0%, #f6fbef 100%);
  border: 1px solid #cfe9db;
  border-radius: 14px;
}

.tad-actions__tip {
  display: flex;
  gap: 6px;
  align-items: center;
  margin: 0 0 11px;
  font-size: 12px;
  font-weight: 600;
  color: #0b6e65;
}

.tad-actions__tip svg {
  width: 14px;
  height: 14px;
}

.tad-actions__btns {
  display: flex;
  gap: 10px;
}

/* workspace 直接子级操作区：间距由 workspace gap 控制，避免双重 margin */
.tad-workspace > .tad-actions {
  margin-top: 0;
}

/* ============ 完成处理录入框 ============ */
.tad-complete {
  display: grid;
  gap: 12px;
  padding: 13px 14px;
  margin-top: 12px;
  background: #fff;
  border: 1px dashed #b7d8ca;
  border-radius: 12px;
}

.tad-complete__field label {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #24524a;
}

.tad-complete__atts {
  display: grid;
  gap: 7px;
  padding: 0;
  margin: 8px 0 0;
  list-style: none;
}

.tad-complete__atts li {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 7px 10px;
  font-size: 11.5px;
  color: #24524a;
  background: #f4faf7;
  border: 1px solid #dcebe4;
  border-radius: 9px;
}

.tad-complete__atts svg {
  width: 13px;
  height: 13px;
  color: #0b6e65;
}

.tad-complete__atts small {
  margin-left: auto;
  color: #8ba09a;
}

.tad-complete__atts button {
  display: inline-flex;
  padding: 2px;
  color: #b0563c;
  cursor: pointer;
  background: none;
  border: none;
}

.tad-complete__atts button svg {
  width: 12px;
  height: 12px;
  color: #b0563c;
}

.tad-complete__empty {
  margin: 8px 0 0;
  font-size: 11.5px;
  color: #a98d52;
}

.tad-complete__btns {
  display: flex;
  gap: 10px;
}

/* ============ AI 优化迷你按钮（录入框 / 弹窗共用） ============ */
.tad-ai-mini {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 2px 9px;
  font-size: 11px;
  font-weight: 600;
  color: #0b6e65;
  cursor: pointer;
  background: #eaf6f0;
  border: 1px solid #c3e0d5;
  border-radius: 999px;
}

.tad-ai-mini svg {
  width: 11px;
  height: 11px;
}

.tad-ai-mini:hover {
  background: #d9efe4;
}

/* ============ 形态三·五 · AI 验收助手 ============ */
.tad-accept {
  padding: 13px 15px;
  background: #f8f5fc;
  border: 1px solid #e2d9f0;
  border-radius: 14px;
}

.tad-accept + .tad-accept,
.tad-pane.is-accept .tad-actions {
  margin-top: 14px;
}

.tad-accept__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tad-accept__count {
  font-size: 11.5px;
  font-weight: 600;
  color: #6d54a8;
}

.tad-accept__checks {
  display: grid;
  gap: 9px;
  padding: 0;
  margin: 12px 0 0;
  list-style: none;
}

.tad-accept__checks li {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 9px 12px;
  background: #fff;
  border: 1px solid #e6dff2;
  border-radius: 10px;
}

.tad-accept__mark {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
}

.tad-accept__mark svg {
  width: 13px;
  height: 13px;
}

.tad-accept__checks li.is-ok .tad-accept__mark {
  color: #2c8a5d;
  background: #e8f6ee;
}

.tad-accept__checks li.is-miss .tad-accept__mark {
  color: #c07a1f;
  background: #fdf3e2;
}

.tad-accept__checks strong {
  font-size: 12px;
  color: #2e2344;
}

.tad-accept__checks p {
  margin: 2px 0 0;
  font-size: 11.5px;
  line-height: 1.5;
  color: #7d7495;
}

.tad-accept__summary {
  padding: 10px 12px;
  margin: 11px 0 0;
  font-size: 12px;
  line-height: 1.7;
  color: #3c3355;
  background: #fff;
  border: 1px solid #e6dff2;
  border-radius: 10px;
}

.tad-accept__verdict {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 11px 13px;
  margin-top: 11px;
  border-radius: 10px;
}

.tad-accept__verdict-icon svg {
  width: 18px;
  height: 18px;
}

.tad-accept__verdict strong {
  display: block;
  font-size: 12.5px;
}

.tad-accept__verdict p {
  margin: 3px 0 0;
  font-size: 11.5px;
  line-height: 1.6;
}

.tad-accept__verdict.is-solved {
  background: #e9f7ef;
  border: 1px solid #bfe4cd;
}

.tad-accept__verdict.is-solved .tad-accept__verdict-icon svg,
.tad-accept__verdict.is-solved strong {
  color: #1f7a4d;
}

.tad-accept__verdict.is-solved p {
  color: #41775d;
}

.tad-accept__verdict.is-hold {
  background: #fdf3e2;
  border: 1px solid #ecd6a8;
}

.tad-accept__verdict.is-hold .tad-accept__verdict-icon svg,
.tad-accept__verdict.is-hold strong {
  color: #a9701a;
}

.tad-accept__verdict.is-hold p {
  color: #8a6a35;
}

/* ============ 验收退回原因 ============ */
.tad-return {
  display: grid;
  gap: 8px;
  padding: 12px 13px;
  margin-top: 12px;
  background: #fff;
  border: 1px dashed #e0b8b8;
  border-radius: 12px;
}

.tad-return label {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  color: #8a4a4a;
}

.tad-return__btns {
  display: flex;
  gap: 10px;
}

/* ============ AI 转派助手弹窗 ============ */
.tm-recommend header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 9px;
}

.tm-match {
  font-size: 12px;
  font-weight: 700;
  color: #a97e22;
}

.tm-card {
  display: flex;
  gap: 11px;
  align-items: flex-start;
  width: 100%;
  padding: 12px 13px;
  text-align: left;
  cursor: pointer;
  background: #fbf8ef;
  border: 1.5px solid #e2d3a6;
  border-radius: 12px;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.tm-card.is-active {
  border-color: #0b6e65;
  box-shadow: 0 3px 12px rgb(11 110 101 / 16%);
}

.tm-card__avatar {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #0b6e65 0%, #12967f 100%);
  border-radius: 50%;
}

.tm-card__main {
  display: block;
  flex: 1;
  min-width: 0;
}

.tm-card__main strong {
  font-size: 13px;
  color: #123f36;
}

.tm-card__main em {
  margin-left: 6px;
  font-size: 11px;
  font-style: normal;
  color: #0b6e65;
}

.tm-card__main small {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  color: #8ba09a;
}

.tm-card__main ul {
  display: grid;
  gap: 3px;
  padding: 0;
  margin: 8px 0 0;
  list-style: none;
}

.tm-card__main li {
  display: flex;
  gap: 5px;
  align-items: baseline;
  font-size: 11.5px;
  line-height: 1.55;
  color: #5a6e66;
}

.tm-card__main li svg {
  flex-shrink: 0;
  width: 11px;
  height: 11px;
  color: #c98b2c;
  transform: translateY(1px);
}

.tm-card__pick {
  flex-shrink: 0;
}

.tm-card__pick svg {
  width: 18px;
  height: 18px;
  color: #b9cec6;
}

.tm-card.is-active .tm-card__pick svg {
  color: #0b6e65;
}

.tm-card__score {
  flex-shrink: 0;
  font-size: 11.5px;
  font-weight: 700;
  color: #0b6e65;
}

.tm-search {
  margin-top: 14px;
}

.tm-search > label {
  display: block;
  margin-bottom: 7px;
  font-size: 12px;
  font-weight: 600;
  color: #24524a;
}

.tm-list {
  display: grid;
  gap: 8px;
  max-height: 218px;
  padding: 0;
  margin: 10px 0 0;
  overflow-y: auto;
  list-style: none;
}

.tm-list li {
  display: flex;
  gap: 11px;
  align-items: center;
  padding: 9px 12px;
  cursor: pointer;
  background: #fff;
  border: 1.5px solid #e3efe9;
  border-radius: 11px;
  transition: border-color 0.2s;
}

.tm-list li:hover {
  border-color: #8fc3b5;
}

.tm-list li.is-active {
  background: #f2faf7;
  border-color: #0b6e65;
}

.tm-empty {
  margin: 10px 0 0;
  font-size: 11.5px;
  color: #a3b3ad;
  text-align: center;
}

/* 申请上门弹窗提示 */
.om-tip {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 8px 12px;
  margin: 0 0 12px;
  font-size: 12px;
  font-weight: 600;
  color: #7a5418;
  background: linear-gradient(120deg, #fdf3e0, #fbeec2);
  border-radius: 8px;
}

.om-tip svg {
  flex: none;
  width: 13px;
  height: 13px;
}

.tm-reason {
  margin-top: 14px;
}

.tm-reason label {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 7px;
  font-size: 12px;
  font-weight: 600;
  color: #24524a;
}

.tm-btns {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding-top: 13px;
  margin-top: 16px;
  border-top: 1px solid #eef4f1;
}

/* eslint-disable */
</style>
