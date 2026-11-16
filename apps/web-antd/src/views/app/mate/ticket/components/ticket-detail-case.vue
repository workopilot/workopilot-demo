<!-- 新版工单详情布局（WO-20261004001 演示）：顶部标题区 + 左主列（工单信息/问题描述/故障附件/流转记录） + 右侧栏（下一步建议：AI 建议 + 数字员工操作，AI 推荐高亮引导） -->
<script setup lang="ts">
import type {
  TicketAttachment,
  TicketTimelineAction,
  WorkOrder,
} from '#/types/ticket';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Tag } from 'ant-design-vue';

import { mockMateEmployees } from '#/api/mock-data-mate';
import {
  engineers,
  slaStatusLabel,
  ticketPriorityLabel,
  ticketStatusLabel,
} from '#/api/mock-data-ticket';

const props = defineProps<{
  /** 是否有下一单 */
  hasNext: boolean;
  /** 是否有上一单 */
  hasPrev: boolean;
  /** 当前工单在列表中的序号（1 起始） */
  index: number;
  /** 当前详情工单 */
  order: WorkOrder;
  /** 列表总条数 */
  total: number;
}>();

const emit = defineEmits<{ back: []; next: []; prev: [] }>();

const router = useRouter();

// ==================== 头部信息条 ====================

const statusLabel = computed(
  () => ticketStatusLabel[props.order.status] ?? props.order.status,
);

const assigneeRole = computed(() => {
  const match = engineers.find((e) => e.id === props.order.assigneeId);
  return match?.role || props.order.source || '';
});

// ==================== 右侧栏：客户与设备 ====================

const deviceName = computed(
  () => props.order.device?.replace(/[（(][^）)]*[）)]/, '').trim() || '—',
);
const deviceCode = computed(
  () => /[（(]([^）)]+)[）)]/.exec(props.order.device ?? '')?.[1]?.trim() || '',
);

/** 信息卡片展开（查看创建时间、办理人、服务地点等） */
const metaExpanded = ref(false);

// ==================== 右侧：下一步建议（AI 建议 + 数字员工） ====================

/** 数字员工头像（复用数字员工中心的照片资源） */
const ticketAssistantAvatar =
  mockMateEmployees.find((e) => e.id === 'ticket-assistant')?.avatar ?? '';
const meetingAssistantAvatar =
  mockMateEmployees.find((e) => e.id === 'meeting-assistant')?.avatar ?? '';
const fillAssistantAvatar =
  mockMateEmployees.find((e) => e.id === 'fill-assistant')?.avatar ?? '';

/** AI 下一步建议文案（随工单状态变化） */
const nextAdviceText = computed(() => {
  switch (props.order.status) {
    case 'dispatched':
    case 'pending': {
      return '当前工单处于「待接单」，建议尽快确认接单并开始处理，避免超时升级督促。';
    }
    case 'onsite-processing': {
      return '工程师已在现场处理，完成后请提交处理结果并上传现场凭证。';
    }
    case 'pending-acceptance': {
      return '处理已完成并提交验收材料，建议跟进客户尽快完成验收。';
    }
    case 'pending-visit': {
      return '工单待上门调度，建议尽快确认出发时间并前往现场处理。';
    }
    case 'processing': {
      return '当前工单处理中，建议按推荐方案执行排查，完成后及时提交处理结果。';
    }
    default: {
      return '工单已完成流程闭环，建议归档并沉淀为知识案例。';
    }
  }
});

/** 是否处于待接单（可接单） */
const canAccept = computed(
  () => props.order.status === 'dispatched' || props.order.status === 'pending',
);

/** 是否可提交处理结果 */
const canComplete = computed(
  () =>
    props.order.status === 'processing' ||
    props.order.status === 'onsite-processing',
);

/** 是否可确认出发 */
const canDepart = computed(() => props.order.status === 'pending-visit');

/** 是否可转派 */
const canTransfer = computed(
  () => canAccept.value || canComplete.value || canDepart.value,
);

/** 跳转工单助理聊天框，并带入当前工单信息与待办操作 */
function goToAssistant(
  action: 'accept' | 'acceptance' | 'complete' | 'depart' | 'transfer',
) {
  const order = props.order;
  const actionText = {
    accept: '帮我接单',
    complete: '帮我提交处理结果',
    depart: '帮我确认出发',
    transfer: '帮我转派',
    acceptance: '帮我登记验收结果',
  }[action];
  const prefill = [
    `请帮我处理工单 ${order.code}（${order.title}）`,
    `客户：${order.customer ?? '—'}（${order.contact ?? '—'} ${order.phone ?? '—'}）`,
    `设备：${order.device ?? '—'}`,
    `当前状态：${ticketStatusLabel[order.status]}，处理人：${order.assignee ?? '待指派'}`,
    actionText,
  ].join('\n');
  void router.push({
    path: '/app/mate/employee/ticket-assistant/ticket-chat',
    query: { action, prefill, ticketCode: order.code },
  });
}

/** 跳转会议助理聊天框，并带入预约请求 */
function goToMeeting() {
  const order = props.order;
  const prefill = `请帮我为客户 ${order.customer ?? '—'}（工单 ${order.code} ${order.title}）预约一次客户沟通会议，同步问题处理进展，时间建议安排在今天下午。`;
  void router.push({
    path: '/app/mate/employee/meeting-assistant/project-chat',
    query: { prefill },
  });
}

/** 跳转填报助理聊天框，发起上门申请单创建（完成后工单进入待上门处理） */
function goToFillAssistant() {
  const order = props.order;
  const prefill = [
    `请帮我为工单 ${order.code}（${order.title}）创建上门申请单`,
    `客户：${order.customer ?? '—'}（${order.contact ?? '—'} ${order.phone ?? '—'}）`,
    `设备：${order.device ?? '—'}，服务地点：${order.customerLocation ?? '—'}`,
    `当前状态：${ticketStatusLabel[order.status]}，已按 AI 排查路径完成初步排查`,
    '帮我创建上门申请单',
  ].join('\n');
  void router.push({
    path: '/app/mate/employee/fill-assistant/ticket-chat',
    query: { action: 'onsite', prefill, ticketCode: order.code },
  });
}

// ==================== 故障附件 ====================

const orderAttachments = computed<TicketAttachment[]>(
  () => props.order.attachments ?? [],
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

const attachmentTypeLabel: Record<string, string> = {
  audio: '录音',
  image: '图片',
  pdf: '文档',
  recording: '录音',
  screenshot: '截图',
  video: '视频',
};

function attachmentMeta(att: TicketAttachment) {
  return [
    attachmentTypeLabel[att.type] || '文件',
    att.size,
    att.uploader,
    att.uploadedAt,
  ]
    .filter(Boolean)
    .join(' · ');
}

// ==================== 流转记录 ====================

/** 时间字符串解析为时间戳（支持 今天/昨天 HH:mm 与 YYYY-MM-DD HH:mm） */
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

const flowOpen = ref(false);

const sortedTimeline = computed(() =>
  (props.order.timeline ?? []).toSorted(
    (a, b) => timelineTimeValue(b.time) - timelineTimeValue(a.time),
  ),
);

const latestEvent = computed(() => sortedTimeline.value[0]);

/** 最新一条记录的简短描述：王安康开始处理 */
const latestShort = computed(() => {
  const t = latestEvent.value;
  if (!t) return '暂无流转记录';
  const actionName = timelineActionLabel(t.action);
  return `${t.operator}${actionName}`;
});

const timelineIconMap: Record<string, string> = {
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

// ==================== 处理操作（随状态变化，右侧数字员工操作区） ====================

/**
 * AI 推荐的主操作（与 AI 建议文案同源，按工单状态确定性映射）：
 * accept=帮我接单 complete=帮我提交处理结果 depart=帮我确认出发 acceptance=帮我登记验收结果
 */
const recommendedAction = computed<
  'accept' | 'acceptance' | 'complete' | 'depart' | null
>(() => {
  switch (props.order.status) {
    case 'dispatched':
    case 'pending': {
      return 'accept';
    }
    case 'onsite-processing':
    case 'processing': {
      return 'complete';
    }
    case 'pending-acceptance': {
      return 'acceptance';
    }
    case 'pending-visit': {
      return 'depart';
    }
    default: {
      return null;
    }
  }
});

/** 处理中可申请上门（填报助理：帮我创建上门申请单） */
const canRequestOnsite = computed(() => props.order.status === 'processing');
/** 待验收显示验收登记操作 */
const canAcceptance = computed(
  () => props.order.status === 'pending-acceptance',
);
</script>

<template>
  <section class="wdc-root">
    <!-- ============ 布局：左工单详情卡（6）+ 右下一步建议卡（4） ============ -->
    <div class="wdc-layout">
      <!-- 左：工单详情卡片（标题区 + 正文） -->
      <section class="wdc-detail">
        <!-- ============ 顶部标题区 ============ -->
        <header class="wdc-topbar">
          <div class="wdc-topbar__row">
            <button type="button" class="wdc-back" @click="emit('back')">
              <Icon icon="lucide:arrow-left" />
              返回列表
            </button>
            <div class="wdc-nav">
              <button type="button" :disabled="!hasPrev" @click="emit('prev')">
                <Icon icon="lucide:chevron-left" />
                上一单
              </button>
              <span class="wdc-nav__pos">{{ index }} / {{ total }}</span>
              <button type="button" :disabled="!hasNext" @click="emit('next')">
                下一单
                <Icon icon="lucide:chevron-right" />
              </button>
            </div>
          </div>
          <div class="wdc-titlebar">
            <h1 class="wdc-title">{{ order.title }}</h1>
            <span class="wdc-code">{{ order.code }}</span>
          </div>
        </header>

        <!-- 左主列 -->
        <div class="wdc-main">
          <!-- 工单信息：默认展示一行，可展开查看更多 -->
          <section class="wdc-card wdc-info">
            <h3 class="wdc-card__title">工单信息</h3>
            <div class="wdc-info__row">
              <div class="wdc-meta__cell">
                <label>工单类型</label>
                <span class="wdc-meta__type">{{ order.type }}</span>
              </div>
              <div class="wdc-meta__cell">
                <label>工单状态</label>
                <span class="wdc-meta__dot" :class="`is-${order.status}`">
                  <i></i>
                  {{ statusLabel }}
                </span>
              </div>
              <div class="wdc-meta__cell">
                <label>时效</label>
                <span
                  class="wdc-meta__dot"
                  :class="`is-sla-${order.slaStatus}`"
                >
                  <i></i>
                  {{ slaStatusLabel[order.slaStatus] }} ·
                  {{ order.slaRemaining }}
                </span>
              </div>
              <div class="wdc-meta__cell">
                <label>客户</label>
                <span class="wdc-meta__strong">
                  {{ order.customer || '—' }}
                </span>
                <small>{{ order.phone }}</small>
              </div>
            </div>
            <div v-if="metaExpanded" class="wdc-info__more">
              <div class="wdc-meta__cell">
                <label>设备</label>
                <span class="wdc-meta__strong">{{ deviceName }}</span>
                <small v-if="deviceCode">{{ deviceCode }}</small>
              </div>
              <div class="wdc-meta__cell">
                <label>优先级</label>
                <span class="wdc-meta__strong">
                  {{ ticketPriorityLabel[order.priority] }}
                </span>
              </div>
              <div class="wdc-meta__cell">
                <label>创建时间</label>
                <span class="wdc-meta__strong">{{ order.createdAt }}</span>
              </div>
              <div class="wdc-meta__cell">
                <label>办理人</label>
                <span class="wdc-meta__strong">
                  {{ order.assignee || '待派单' }}
                </span>
                <small>{{ assigneeRole }}</small>
              </div>
              <div class="wdc-meta__cell wdc-meta__cell--wide">
                <label>服务地点</label>
                <span class="wdc-meta__strong">
                  {{ order.customerLocation || '—' }}
                </span>
              </div>
              <div class="wdc-meta__cell">
                <label>截止时间</label>
                <span class="wdc-meta__strong">{{ order.deadline }}</span>
              </div>
            </div>
            <button
              type="button"
              class="wdc-info__toggle"
              @click="metaExpanded = !metaExpanded"
            >
              {{ metaExpanded ? '收起' : '展开更多' }}
              <Icon
                :icon="
                  metaExpanded ? 'lucide:chevron-up' : 'lucide:chevron-down'
                "
              />
            </button>
          </section>

          <!-- 问题描述 -->
          <section class="wdc-card">
            <h3 class="wdc-card__title">问题描述</h3>
            <p class="wdc-desc">{{ order.description }}</p>
          </section>

          <!-- 故障附件 -->
          <section class="wdc-card">
            <header class="wdc-card__head">
              <h3 class="wdc-card__title">故障附件</h3>
              <span v-if="orderAttachments.length > 0" class="wdc-card__extra">
                {{ orderAttachments.length }} 个文件
              </span>
            </header>
            <ul v-if="orderAttachments.length > 0" class="wdc-attach">
              <li v-for="att in orderAttachments" :key="att.id">
                <span class="wdc-attach__thumb">
                  <Icon :icon="attachmentIcon(att.type)" />
                </span>
                <div class="wdc-attach__info">
                  <b>{{ att.name }}</b>
                  <small>{{ attachmentMeta(att) }}</small>
                </div>
              </li>
            </ul>
            <p v-else class="wdc-empty">暂无故障附件</p>
          </section>

          <!-- 流转记录 -->
          <section class="wdc-card wdc-flow">
            <button
              type="button"
              class="wdc-flow__toggle"
              @click="flowOpen = !flowOpen"
            >
              <Icon
                :icon="
                  flowOpen ? 'lucide:chevron-down' : 'lucide:chevron-right'
                "
              />
              流转记录 · {{ sortedTimeline.length }} 条
            </button>
            <p v-if="latestEvent && !flowOpen" class="wdc-flow__latest">
              最新：{{ latestEvent.time }}
              <b>{{ latestShort }}</b>
            </p>
            <span class="wdc-flow__hint">展开后按最新记录优先展示</span>
          </section>
          <section v-if="flowOpen" class="wdc-card wdc-flow-list">
            <ul class="wdc-timeline">
              <li v-for="t in sortedTimeline" :key="t.id">
                <i>
                  <Icon :icon="timelineIconMap[t.action] || 'lucide:circle'" />
                </i>
                <div>
                  <strong>
                    <Tag
                      :color="timelineActionColor(t.action)"
                      class="wdc-timeline__tag"
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
        </div>
      </section>

      <!-- 右：下一步建议（独立卡片） -->
      <aside class="wdc-side">
        <!-- 下一步建议：AI 建议 + 数字员工 -->
        <section class="wdc-card wdc-next">
          <header class="wdc-next__head">
            <i class="wdc-next__icon">
              <Icon icon="lucide:sparkles" />
            </i>
            <div class="wdc-next__heading">
              <small>AI COPILOT</small>
              <h3>下一步建议</h3>
              <p>基于当前工单阶段选择合适的数字员工。</p>
            </div>
          </header>

          <!-- AI 建议卡 -->
          <div class="wdc-next__advice">
            <span class="wdc-next__badge">
              <Icon icon="lucide:lightbulb" />
              AI 建议
            </span>
            <p class="wdc-next__text">{{ nextAdviceText }}</p>
          </div>

          <!-- 数字员工：工单助理 -->
          <article class="wdc-emp">
            <div class="wdc-emp__head">
              <img
                class="wdc-emp__avatar"
                :src="ticketAssistantAvatar"
                alt="工单助理"
              />
              <div class="wdc-emp__meta">
                <b>工单助理</b>
                <small>接单、转派与处理结果跟进</small>
              </div>
              <Icon class="wdc-emp__goto" icon="lucide:arrow-up-right" />
            </div>
            <div class="wdc-emp__actions">
              <button
                v-if="canAccept"
                type="button"
                class="wdc-emp__action"
                :class="{ 'is-recommended': recommendedAction === 'accept' }"
                @click="goToAssistant('accept')"
              >
                <Icon icon="lucide:check-circle-2" />
                <span>帮我接单</span>
              </button>
              <button
                v-if="canComplete"
                type="button"
                class="wdc-emp__action"
                :class="{ 'is-recommended': recommendedAction === 'complete' }"
                @click="goToAssistant('complete')"
              >
                <Icon icon="lucide:clipboard-check" />
                <span>帮我提交处理结果</span>
              </button>
              <button
                v-if="canDepart"
                type="button"
                class="wdc-emp__action"
                :class="{ 'is-recommended': recommendedAction === 'depart' }"
                @click="goToAssistant('depart')"
              >
                <Icon icon="lucide:truck" />
                <span>帮我确认出发</span>
              </button>
              <button
                v-if="canTransfer"
                type="button"
                class="wdc-emp__action"
                @click="goToAssistant('transfer')"
              >
                <Icon icon="lucide:user-round-cog" />
                <span>帮我转派</span>
              </button>
              <button
                v-if="canAcceptance"
                type="button"
                class="wdc-emp__action"
                :class="{
                  'is-recommended': recommendedAction === 'acceptance',
                }"
                @click="goToAssistant('acceptance')"
              >
                <Icon icon="lucide:badge-check" />
                <span>帮我登记验收结果</span>
              </button>
            </div>
            <p
              v-if="!canAccept && !canComplete && !canDepart && !canAcceptance"
              class="wdc-next__dim"
            >
              <Icon icon="lucide:check-circle-2" />
              当前工单状态暂无需数字员工执行的操作
            </p>
          </article>

          <!-- 数字员工：会议助理 -->
          <article class="wdc-emp">
            <div class="wdc-emp__head">
              <img
                class="wdc-emp__avatar"
                :src="meetingAssistantAvatar"
                alt="会议助理"
              />
              <div class="wdc-emp__meta">
                <b>会议助理</b>
                <small>客户沟通预约与会议跟进</small>
              </div>
              <Icon class="wdc-emp__goto" icon="lucide:arrow-up-right" />
            </div>
            <div class="wdc-emp__actions">
              <button
                type="button"
                class="wdc-emp__action"
                @click="goToMeeting"
              >
                <Icon icon="lucide:calendar-plus" />
                <span>帮我预约客户沟通</span>
              </button>
            </div>
          </article>

          <!-- 数字员工：填报助理（处理中可发起上门申请） -->
          <article v-if="canRequestOnsite" class="wdc-emp">
            <div class="wdc-emp__head">
              <img
                class="wdc-emp__avatar"
                :src="fillAssistantAvatar"
                alt="填报助理"
              />
              <div class="wdc-emp__meta">
                <b>填报助理</b>
                <small>上门申请单创建与单据填报</small>
              </div>
              <Icon class="wdc-emp__goto" icon="lucide:arrow-up-right" />
            </div>
            <div class="wdc-emp__actions">
              <button
                type="button"
                class="wdc-emp__action"
                @click="goToFillAssistant"
              >
                <Icon icon="lucide:file-plus-2" />
                <span>帮我创建上门申请单</span>
              </button>
            </div>
          </article>

          <p class="wdc-next__hint">
            <Icon icon="lucide:pencil-line" />
            点击后会自动带入工单、客户、设备与当前处理进度上下文。
          </p>
        </section>
      </aside>
    </div>
  </section>
</template>

<style scoped>
@keyframes wdc-pulse {
  0% {
    box-shadow: 0 0 0 0 rgb(44 138 93 / 42%);
  }

  70% {
    box-shadow: 0 0 0 6px rgb(44 138 93 / 0%);
  }

  100% {
    box-shadow: 0 0 0 0 rgb(44 138 93 / 0%);
  }
}

@media (max-width: 1024px) {
  .wdc-layout {
    grid-template-columns: 1fr;
  }

  .wdc-topbar__row {
    flex-wrap: wrap;
  }

  .wdc-title {
    white-space: normal;
  }

  .wdc-info__row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .wdc-info__more {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.wdc-root {
  --jade: #0b6e65;
  --jade-deep: #073a33;
  --ai: #0e8074;
  --ai-soft: #e8f5f1;
  --ink: #10231f;
  --txt: #46554f;
  --line: #e2eae6;
  --bg-soft: #f6faf8;

  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100%;
  color: var(--txt);
}

/* ============ 布局：左详情卡 + 右下一步建议卡 ============ */
.wdc-layout {
  display: grid;
  grid-template-columns: minmax(0, 6fr) minmax(0, 4fr);
  gap: 14px;
  align-items: start;
}

/* 左侧工单详情卡片（标题区 + 正文各内容卡） */
.wdc-detail {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  padding: 18px 20px 20px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 14px;
  box-shadow: 0 10px 30px rgb(7 71 60 / 6%);
}

/* ============ 顶部标题区 + 信息条 ============ */
.wdc-topbar {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.wdc-topbar__row {
  display: flex;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px 12px;

  /* 返回列表下方分割线 */
  border-bottom: 1px solid var(--line);
}

.wdc-back {
  display: inline-flex;
  flex: none;
  gap: 5px;
  align-items: center;
  padding: 5px 12px 5px 8px;
  font-size: 12.5px;
  font-weight: 500;
  color: #5a6b64;
  cursor: pointer;
  background: none;
  border: 1px solid transparent;
  border-radius: 999px;
  transition: all 0.2s ease;
}

.wdc-back:hover {
  color: var(--jade);
  background: var(--ai-soft);
}

.wdc-back svg {
  width: 14px;
  height: 14px;
}

.wdc-code {
  flex: none;
  font-size: 14px;
  font-weight: 800;
  color: var(--jade-deep);
  letter-spacing: 0.2px;
}

.wdc-title {
  flex: 0 1 auto;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 15px;
  font-weight: 700;
  color: var(--ink);
  white-space: nowrap;
}

.wdc-nav {
  display: flex;
  flex: none;
  gap: 8px;
  align-items: center;
}

.wdc-nav button {
  display: inline-flex;
  gap: 3px;
  align-items: center;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #4a5b54;
  cursor: pointer;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 7px;
  transition: all 0.15s;
}

.wdc-nav button:hover:not(:disabled) {
  color: var(--jade);
  border-color: var(--jade);
}

.wdc-nav button:disabled {
  color: #b3c1bb;
  cursor: not-allowed;
  background: #f7faf8;
}

.wdc-nav button svg {
  width: 13px;
  height: 13px;
}

.wdc-nav__pos {
  font-size: 12px;
  color: #7a8b84;
  white-space: nowrap;
}

/* 顶部标题行（工单标题 + 工单号） */
.wdc-titlebar {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 0 4px;
}

/* ============ 工单信息卡（默认一行，可展开；「展开更多」骑下边框线居中） ============ */
.wdc-info {
  position: relative;
  padding-bottom: 24px;
}

.wdc-info__row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px 18px;
}

.wdc-info__more {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px 18px;
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px dashed var(--line);
}

.wdc-info__toggle {
  position: absolute;
  bottom: -12px;
  left: 50%;
  z-index: 1;
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  color: #4a5b54;
  cursor: pointer;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 999px;
  transform: translateX(-50%);
  transition:
    color 0.15s,
    border-color 0.15s;
}

.wdc-info__toggle:hover {
  color: var(--jade);
  border-color: var(--jade);
}

.wdc-info__toggle svg {
  width: 13px;
  height: 13px;
}

.wdc-meta__cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 88px;
}

.wdc-meta__cell--wide {
  min-width: 180px;
}

.wdc-meta__cell > label {
  font-size: 11px;
  color: #84948d;
}

.wdc-meta__cell small {
  font-size: 11px;
  color: #97a6a0;
}

.wdc-meta__strong {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}

.wdc-meta__type {
  display: inline-flex;
  align-items: center;
  padding: 1px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #4a5b54;
  background: #f1f5f3;
  border: 1px solid var(--line);
  border-radius: 999px;
}

.wdc-meta__dot {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}

.wdc-meta__dot i {
  flex: none;
  width: 7px;
  height: 7px;
  background: #98a8a1;
  border-radius: 50%;
}

/* 状态点颜色 */
.wdc-meta__dot.is-dispatched i,
.wdc-meta__dot.is-pending i {
  background: #1668dc;
}

.wdc-meta__dot.is-processing i,
.wdc-meta__dot.is-onsite-processing i {
  background: #0e8074;
}

.wdc-meta__dot.is-pending-visit i {
  background: #d97706;
}

.wdc-meta__dot.is-pending-acceptance i {
  background: #7c3aed;
}

.wdc-meta__dot.is-completed i,
.wdc-meta__dot.is-closed i,
.wdc-meta__dot.is-cancelled i {
  background: #98a8a1;
}

/* SLA 点颜色 */
.wdc-meta__dot.is-sla-normal i {
  background: #16a34a;
}

.wdc-meta__dot.is-sla-warning i {
  background: #d97706;
}

.wdc-meta__dot.is-sla-breached i {
  background: #dc2626;
}

.wdc-meta__dot.is-sla-paused i {
  background: #98a8a1;
}

/* ============ 主体布局（左右 6:4） ============ */
.wdc-main {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.wdc-side {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ============ 卡片 ============ */
.wdc-card {
  padding: 16px 18px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 12px;
}

.wdc-card__head {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
}

.wdc-card__title {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
}

.wdc-card__head .wdc-card__title {
  margin: 0;
}

.wdc-card__title::before {
  width: 3px;
  height: 14px;
  content: '';
  background: var(--jade);
  border-radius: 2px;
}

.wdc-card__extra {
  margin-left: auto;
  font-size: 12px;
  color: #84948d;
}

/* ============ 下一步建议（AI 建议 + 数字员工） ============ */

/* 头部：AI Copilot 图标 + 标题 */
.wdc-next__head {
  display: flex;
  gap: 12px;
  align-items: center;
  padding-bottom: 14px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--line);
}

.wdc-next__icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  color: #fff;
  background: linear-gradient(135deg, #0b6e65, #2c8a5d);
  border-radius: 12px;
  box-shadow: 0 4px 10px rgb(11 110 101 / 22%);
}

.wdc-next__icon svg {
  width: 22px;
  height: 22px;
}

.wdc-next__heading small {
  display: block;
  font-size: 10.5px;
  font-weight: 800;
  color: var(--jade);
  letter-spacing: 0.12em;
}

.wdc-next__heading h3 {
  margin: 2px 0 0;
  font-size: 17px;
  font-weight: 700;
  color: var(--ink);
}

.wdc-next__heading p {
  margin: 3px 0 0;
  font-size: 12px;
  color: #8a9a93;
}

/* AI 建议卡 */
.wdc-next__advice {
  padding: 14px;
  margin-bottom: 12px;
  background: #eef7f3;
  border: 1px solid #cfe6dc;
  border-radius: 12px;
}

.wdc-next__badge {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  font-size: 12px;
  font-weight: 800;
  color: #0b6e65;
}

.wdc-next__badge svg {
  width: 13px;
  height: 13px;
}

.wdc-next__text {
  margin: 8px 0 0;
  font-size: 13.5px;
  font-weight: 700;
  line-height: 1.6;
  color: var(--ink);
}

/* 数字员工卡片 */
.wdc-emp {
  padding: 12px;
  margin-bottom: 10px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 12px;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.wdc-emp:last-of-type {
  margin-bottom: 0;
}

.wdc-emp:hover {
  border-color: #9dc6b9;
  box-shadow: 0 4px 12px rgb(11 110 101 / 8%);
}

.wdc-emp__head {
  position: relative;
  display: flex;
  gap: 10px;
  align-items: center;
}

.wdc-emp__avatar {
  flex: none;
  width: 40px;
  height: 40px;
  object-fit: cover;
  background: var(--bg-soft);
  border-radius: 50%;
}

.wdc-emp__meta b {
  display: block;
  font-size: 13.5px;
  line-height: 1.3;
  color: var(--ink);
}

.wdc-emp__meta small {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  line-height: 1.4;
  color: #8a9a93;
}

.wdc-emp__goto {
  position: absolute;
  top: 2px;
  right: 0;
  width: 15px;
  height: 15px;
  color: #9db3ab;
}

/* 操作标签：横向排列，超出换行 */
.wdc-emp__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.wdc-emp__action {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #0b6e65;
  cursor: pointer;
  background: #f2f9f5;
  border: 1px solid #d8ece4;
  border-radius: 999px;
  transition:
    background 0.15s,
    border-color 0.15s;
}

.wdc-emp__action > svg:first-child {
  flex: none;
  width: 13px;
  height: 13px;
}

.wdc-emp__action:hover {
  background: #e2f1ea;
  border-color: #bcdcd0;
}

/* AI 推荐高亮：实心渐变 + 脉冲光晕 */
.wdc-emp__action.is-recommended {
  color: #fff;
  background: linear-gradient(135deg, #0b6e65, #2c8a5d);
  border-color: transparent;
  animation: wdc-pulse 2.4s ease-out infinite;
}

.wdc-emp__action.is-recommended > svg:first-child {
  color: #fff;
}

.wdc-next__hint {
  display: flex;
  gap: 6px;
  align-items: flex-start;
  margin: 12px 0 0;
  font-size: 11.5px;
  line-height: 1.5;
  color: #9aa9a2;
}

.wdc-next__hint svg {
  flex: none;
  width: 13px;
  height: 13px;
  margin-top: 1px;
}

.wdc-next__dim {
  display: flex;
  gap: 6px;
  align-items: center;
  margin: 10px 0 0;
  font-size: 12px;
  color: #8a9a93;
}

.wdc-next__dim svg {
  width: 14px;
  height: 14px;
  color: #16a34a;
}

/* 故障附件 */
.wdc-attach {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.wdc-attach li {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 10px;
  transition: border-color 0.15s;
}

.wdc-attach li:hover {
  border-color: #bfe0d7;
}

.wdc-attach__thumb {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  font-size: 22px;
  color: var(--jade);
  background: var(--ai-soft);
  border-radius: 8px;
}

.wdc-attach__thumb svg {
  width: 22px;
  height: 22px;
}

.wdc-attach__info {
  flex: 1;
  min-width: 0;
}

.wdc-attach__info > b {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  color: var(--ink);
  white-space: nowrap;
}

.wdc-attach__info > small {
  display: block;
  margin-top: 2px;
  font-size: 11.5px;
  color: #8a9a93;
}

.wdc-empty {
  padding: 24px 0;
  margin: 0;
  font-size: 12.5px;
  color: #97a6a0;
  text-align: center;
}

/* ============ 右侧栏 ============ */

/* ============ 流转记录 ============ */
.wdc-flow {
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 13px 18px;
}

.wdc-flow__toggle {
  display: inline-flex;
  flex: none;
  gap: 6px;
  align-items: center;
  padding: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
  cursor: pointer;
  background: none;
  border: none;
}

.wdc-flow__toggle svg {
  width: 14px;
  height: 14px;
  color: var(--jade);
}

.wdc-flow__latest {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: #7a8b84;
  white-space: nowrap;
}

.wdc-flow__latest b {
  font-weight: 600;
  color: #4a5b54;
}

.wdc-flow__hint {
  flex: none;
  margin-left: auto;
  font-size: 11.5px;
  color: #a9b7b1;
}

.wdc-flow-list {
  padding-top: 6px;
}

.wdc-timeline {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.wdc-timeline li {
  display: flex;
  gap: 12px;
}

.wdc-timeline li > i {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-size: 13px;
  color: var(--jade);
  background: var(--ai-soft);
  border-radius: 50%;
}

.wdc-timeline li > i svg {
  width: 14px;
  height: 14px;
}

.wdc-timeline strong {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--ink);
}

.wdc-timeline__tag {
  margin: 0;
  font-size: 11px;
}

.wdc-timeline small {
  display: block;
  margin-top: 2px;
  font-size: 11.5px;
  color: #8a9a93;
}

.wdc-timeline em {
  padding: 6px 10px;
  margin-top: 6px;
  font-size: 12px;
  font-style: normal;
  line-height: 1.55;
  color: #4a5b54;
  background: var(--bg-soft);
  border-radius: 8px;
}

/* ============ 弹窗表单 ============ */
.wdc-form {
  display: flex;
  flex-direction: column;
}

.wdc-form > label {
  margin: 14px 0 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}

.wdc-form > label:first-child {
  margin-top: 0;
}

.wdc-form__footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding-top: 16px;
  margin-top: 18px;
  border-top: 1px solid var(--line);
}

/* ============ 响应式 ============ */

/* ============ 根布局 ============ */
</style>

<style>
/* 详情弹窗全局样式（Modal 传送至 body，需非 scoped 覆盖） */
.wdc-modal .ant-modal-content {
  overflow: hidden;
  border: 1px solid #dbe8e2;
  border-radius: 16px;
  box-shadow:
    0 24px 60px rgb(7 58 51 / 22%),
    0 4px 14px rgb(7 58 51 / 8%);
}

/* 头部：标题 + 主色竖条 */
.wdc-modal .ant-modal-header {
  padding: 18px 22px 0;
  margin: 0;
  background: transparent;
  border-bottom: none;
}

.wdc-modal .ant-modal-title {
  position: relative;
  padding-left: 13px;
  font-size: 15.5px;
  font-weight: 700;
  line-height: 1.4;
  color: #10231f;
}

.wdc-modal .ant-modal-title::before {
  position: absolute;
  top: 50%;
  left: 0;
  width: 4px;
  height: 15px;
  content: '';
  background: linear-gradient(180deg, #0d655a, #178f7b);
  border-radius: 2px;
  transform: translateY(-50%);
}

.wdc-modal .ant-modal-close {
  top: 14px;
  right: 16px;
  color: #7a8b84;
}

.wdc-modal .ant-modal-close:hover {
  color: #0b6e65;
  background: #e8f5f1;
}

/* 主体 */
.wdc-modal .ant-modal-body {
  padding: 16px 22px 20px;
}

/* 输入控件统一圆角与聚焦态 */
.wdc-modal .ant-input,
.wdc-modal .ant-input-affix-wrapper {
  border-radius: 10px;
}

.wdc-modal .ant-input:hover,
.wdc-modal .ant-input-affix-wrapper:hover {
  border-color: #9dc9be;
}

.wdc-modal .ant-input:focus,
.wdc-modal .ant-input-focused,
.wdc-modal .ant-input-affix-wrapper:focus,
.wdc-modal .ant-input-affix-wrapper-focused {
  border-color: #0b6e65;
  box-shadow: 0 0 0 3px rgb(11 110 101 / 12%);
}

.wdc-modal .ant-btn {
  border-radius: 10px;
}

.wdc-modal .ant-btn-primary:not(:disabled) {
  background: linear-gradient(135deg, #0d655a, #0b6e65);
  border-color: transparent;
  box-shadow: 0 4px 12px rgb(11 110 101 / 28%);
}

.wdc-modal .ant-btn-primary:not(:disabled):hover {
  background: linear-gradient(135deg, #0b6e65, #0e8074);
}
</style>
