<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, Input, message, Modal, Tag } from 'ant-design-vue';

import {
  engineers,
  mockDispatchDashboard,
  mockWorkOrders,
  ticketPriorityLabel,
  ticketStatusLabel,
} from '#/api/mock-data-ticket';
import { dispatchWorkOrderApi, transferWorkOrderApi } from '#/api/ticket';

const router = useRouter();
const route = useRoute();
const employeeId = computed(() =>
  String(route.params.employeeId || 'dispatch-assistant'),
);

const db = mockDispatchDashboard;

// ---------- 顶部统计 ----------
const topStats = computed(() => db.topStats);

// ---------- 工单状态分布 ----------
const statusTotal = computed(() =>
  db.statusDistribution.reduce((s, i) => s + i.count, 0),
);

// ---------- 工单量趋势（折线图坐标计算） ----------
const trendChart = computed(() => {
  const data = db.trend7d;
  const max = Math.max(...data.map((d) => d.count));
  const min = Math.min(...data.map((d) => d.count));
  const width = 360;
  const height = 120;
  const padX = 28;
  const padY = 14;
  const range = max - min || 1;
  const stepX = (width - padX * 2) / (data.length - 1);
  const points = data.map((d, i) => {
    const x = padX + i * stepX;
    const y = padY + (1 - (d.count - min) / range) * (height - padY * 2);
    return { x, y, ...d };
  });
  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');
  const firstPoint = points[0] || { x: padX, y: height - padY };
  const lastPoint = points[points.length - 1] || {
    x: width - padX,
    y: height - padY,
  };
  const areaD = `M${firstPoint.x},${height - padY} ${points
    .map((p) => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ')} L${lastPoint.x},${height - padY} Z`;
  const prevAvg =
    data.slice(0, -1).reduce((s, d) => s + d.count, 0) / (data.length - 1);
  const currAvg = data.reduce((s, d) => s + d.count, 0) / data.length;
  const changePct = prevAvg ? ((currAvg - prevAvg) / prevAvg) * 100 : 0;
  return { width, height, padX, padY, points, pathD, areaD, changePct };
});

// ---------- 区域热力 ----------
const regionHeatMax = computed(() =>
  Math.max(...db.regionHeat.map((r) => r.count)),
);

function heatColor(count: number) {
  const ratio = count / (regionHeatMax.value || 1);
  if (ratio > 0.75) return '#0b6e65';
  if (ratio > 0.5) return '#4ca87a';
  if (ratio > 0.25) return '#a3ccbe';
  if (ratio > 0.1) return '#d8ebe4';
  return '#edf5f1';
}

// ---------- 服务负载 ----------
const staffLoadMax = computed(() =>
  Math.max(...db.staffLoad.map((s) => s.max)),
);
const dispatchSaturation = computed(() => {
  const busy = db.staffLoad.find((s) => s.label === '忙碌')?.count || 0;
  const total = db.staffLoad.reduce((s, item) => s + item.count, 0);
  return total ? Math.round((busy / total) * 100) : 0;
});

// ---------- 类型条形图 ----------
const typeBreakdown = computed(() => {
  const max = Math.max(...db.typeBreakdown.map((t) => t.count));
  return db.typeBreakdown.map((t) => ({ ...t, max }));
});

// ---------- 工程师选择 Modal（派单 / 转派共用） ----------
const activeTab = ref<'dispatched' | 'pending'>('pending');
const engineerModalOpen = ref(false);
const engineerModalMode = ref<'dispatch' | 'transfer'>('dispatch');
const engineerModalOrderId = ref('');
const engineerModalSelectedId = ref('');
const engineerModalKeyword = ref('');
const engineerModalNote = ref('');

const engineerModalOrder = computed(() =>
  mockWorkOrders.find((item) => item.id === engineerModalOrderId.value),
);

const engineerPendingMap = computed<Record<string, number>>(() => {
  const counts: Record<string, number> = {};
  for (const order of mockWorkOrders) {
    if (
      order.assigneeId &&
      (order.status === 'dispatched' || order.status === 'processing')
    ) {
      counts[order.assigneeId] = (counts[order.assigneeId] || 0) + 1;
    }
  }
  return counts;
});

function engineerPendingCount(id: string) {
  return engineerPendingMap.value[id] || 0;
}

const engineerModalList = computed(() => {
  const kw = engineerModalKeyword.value.trim().toLowerCase();
  const order = engineerModalOrder.value;
  return engineers
    .filter((e) =>
      engineerModalMode.value === 'transfer' && order?.assigneeId
        ? e.id !== order.assigneeId
        : true,
    )
    .filter(
      (e) =>
        !kw ||
        e.name.toLowerCase().includes(kw) ||
        e.area.toLowerCase().includes(kw) ||
        e.team.toLowerCase().includes(kw) ||
        e.role.toLowerCase().includes(kw),
    );
});

function openEngineerModal(mode: 'dispatch' | 'transfer', orderId: string) {
  engineerModalMode.value = mode;
  engineerModalOrderId.value = orderId;
  engineerModalSelectedId.value = '';
  engineerModalKeyword.value = '';
  engineerModalNote.value = '';
  engineerModalOpen.value = true;
}

async function confirmEngineerModal() {
  if (!engineerModalSelectedId.value) {
    message.warning('请选择一名工程师');
    return;
  }
  const target = engineers.find((e) => e.id === engineerModalSelectedId.value);
  if (!target) return;
  const orderId = engineerModalOrderId.value;

  if (engineerModalMode.value === 'dispatch') {
    await dispatchWorkOrderApi(orderId, target.id, target.name);
    message.success(`已派单给 ${target.name}（${target.role}）`);
  } else {
    await transferWorkOrderApi(
      orderId,
      target.id,
      target.name,
      engineerModalNote.value || '调度手动转派',
    );
    message.success(`已转派给 ${target.name}（${target.role}）`);
  }
  engineerModalOpen.value = false;
}

/** 明细表中"待派单"行直接派单 */
function handleDetailDispatch(code: string) {
  const order = mockWorkOrders.find((o) => o.code === code);
  if (order) openEngineerModal('dispatch', order.id);
}

function statusColor(status: string) {
  switch (status) {
    case 'completed': {
      return 'green';
    }
    case 'dispatched': {
      return 'blue';
    }
    case 'pending': {
      return 'orange';
    }
    case 'pending-acceptance': {
      return 'purple';
    }
    case 'processing': {
      return 'processing';
    }
    default: {
      return 'default';
    }
  }
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

/** 顶部统计卡 → 工单明细带状态筛选 */
function goDetailWithStatus(key: string) {
  const statusMap: Record<string, string> = {
    pending: 'pending',
    processing: 'processing',
    'today-done': 'completed',
    breached: 'breached',
  };
  const status = statusMap[key];
  const query: Record<string, string> = {};
  if (status) query.status = status;
  router.push({
    path: `/app/mate/employee/${employeeId.value}/ticket-detail`,
    query,
  });
}

/** 状态分布图例 → 工单明细带状态筛选 */
function goDetailWithStatusKey(statusKey: string) {
  router.push({
    path: `/app/mate/employee/${employeeId.value}/ticket-detail`,
    query: statusKey ? { status: statusKey } : {},
  });
}
</script>

<template>
  <section class="dash-layout">
    <!-- 顶部标题 -->
    <header class="dash-header">
      <div>
        <span class="dash-header__eyebrow">DISPATCH DASHBOARD</span>
        <h1>调度中心</h1>
        <p>实时掌控工单状态、工程师负荷与 SLA 风险，AI 辅助智能派单</p>
      </div>
      <div class="dash-header__actions">
        <Button
          size="small"
          @click="router.push(`/app/mate/employee/${employeeId}/my-trips`)"
        >
          <Icon icon="lucide:route" class="size-3.5" />
          我的行程
        </Button>
        <Tag color="green">系统正常</Tag>
        <span class="dash-header__time">更新于 2 分钟前</span>
      </div>
    </header>

    <!-- 顶部 6 项核心指标 -->
    <section class="dash-top-stats">
      <article
        v-for="s in topStats"
        :key="s.key"
        class="stat-card"
        :class="`is-${s.color}`"
        @click="goDetailWithStatus(s.key)"
      >
        <div class="stat-card__inner">
          <strong class="stat-card__value">{{ s.value }}</strong>
          <small class="stat-card__label">{{ s.label }}</small>
        </div>
      </article>
    </section>

    <!-- 中部 3 个图表卡片 -->
    <section class="dash-mid-row">
      <!-- 工单状态分布 -->
      <article class="chart-card">
        <header class="chart-card__head">
          <h3>工单状态分布</h3>
          <button
            type="button"
            class="chart-card__more"
            @click="goDetailWithStatusKey('')"
          >
            查看全部
            <Icon icon="lucide:chevron-right" />
          </button>
        </header>
        <div class="status-bar">
          <div
            v-for="s in db.statusDistribution"
            :key="s.key"
            class="status-bar__seg"
            :style="{
              width: `${(s.count / statusTotal) * 100}%`,
              background: s.color,
            }"
            :title="`${s.label} ${s.count}（点击下钻）`"
            @click="goDetailWithStatusKey(s.key)"
          ></div>
        </div>
        <ul class="status-legend">
          <li
            v-for="s in db.statusDistribution"
            :key="s.key"
            :style="{ color: s.color }"
            class="status-legend__item"
            @click="goDetailWithStatusKey(s.key)"
          >
            <i :style="{ background: s.color }"></i>
            {{ s.label }}
            <b>{{ s.count }}</b>
          </li>
        </ul>
      </article>

      <!-- 工单量趋势·近7日 -->
      <article class="chart-card">
        <header class="chart-card__head">
          <h3>工单量趋势 · 近 7 日</h3>
          <span
            class="trend-change"
            :class="trendChart.changePct >= 0 ? 'is-up' : 'is-down'"
          >
            周同比 {{ trendChart.changePct >= 0 ? '+' : '' }}
            {{ trendChart.changePct.toFixed(1) }}%
          </span>
        </header>
        <div class="trend-chart">
          <svg
            :width="trendChart.width"
            :height="trendChart.height"
            :viewBox="`0 0 ${trendChart.width} ${trendChart.height}`"
          >
            <defs>
              <linearGradient id="trendArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#0b6e65" stop-opacity="0.25" />
                <stop offset="100%" stop-color="#0b6e65" stop-opacity="0.02" />
              </linearGradient>
            </defs>
            <path :d="trendChart.areaD" fill="url(#trendArea)" />
            <path
              :d="trendChart.pathD"
              fill="none"
              stroke="#0b6e65"
              stroke-width="2.5"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
            <circle
              v-for="(p, idx) in trendChart.points"
              :key="idx"
              :cx="p.x"
              :cy="p.y"
              r="3.5"
              fill="#fff"
              stroke="#0b6e65"
              stroke-width="2"
            />
          </svg>
        </div>
        <div class="trend-labels">
          <span v-for="p in trendChart.points" :key="p.day">{{ p.day }}</span>
        </div>
      </article>

      <!-- 实时预警 -->
      <article class="chart-card">
        <header class="chart-card__head">
          <h3>实时预警</h3>
          <Tag color="red">
            {{ db.alerts.reduce((s, a) => s + a.count, 0) }}
          </Tag>
        </header>
        <ul class="alert-list">
          <li v-for="a in db.alerts" :key="a.type" class="alert-item">
            <i :style="{ background: a.color }"></i>
            <span class="alert-item__label">{{ a.label }}</span>
            <b class="alert-item__count" :style="{ color: a.color }">
              {{ a.count }}
            </b>
          </li>
        </ul>
      </article>
    </section>

    <!-- 底部 3 个分析卡片 -->
    <section class="dash-bottom-row">
      <!-- 服务人员/网点负载 -->
      <article class="chart-card">
        <header class="chart-card__head">
          <h3>服务人员 / 网点负载</h3>
        </header>
        <ul class="staff-list">
          <li v-for="s in db.staffLoad" :key="s.label" class="staff-item">
            <span class="staff-item__label">{{ s.label }}</span>
            <div class="staff-item__bar">
              <i
                :style="{ width: `${(s.count / staffLoadMax) * 100}%` }"
                :class="`is-${s.label}`"
              ></i>
            </div>
            <b class="staff-item__count">{{ s.count }}</b>
          </li>
        </ul>
        <p class="staff-saturation">
          派单饱和率
          <strong :class="{ 'is-high': dispatchSaturation >= 80 }">
            {{ dispatchSaturation }}%
          </strong>
        </p>
      </article>

      <!-- 区域工单热力 -->
      <article class="chart-card">
        <header class="chart-card__head">
          <h3>区域工单热力</h3>
        </header>
        <div class="heat-grid">
          <div
            v-for="r in db.regionHeat"
            :key="r.region"
            class="heat-cell"
            :style="{ background: heatColor(r.count) }"
            :title="`${r.region}: ${r.count}`"
          >
            <span class="heat-cell__label">{{ r.region.split('-')[0] }}</span>
            <b class="heat-cell__count">{{ r.count }}</b>
          </div>
        </div>
        <p class="heat-legend">颜色越深，工单越密集</p>
      </article>

      <!-- 工单类型分布 -->
      <article class="chart-card">
        <header class="chart-card__head">
          <h3>工单类型分布</h3>
        </header>
        <div class="type-source-block">
          <ul class="bar-list">
            <li v-for="t in typeBreakdown" :key="t.type">
              <span class="bar-list__label">{{ t.type }}</span>
              <div class="bar-list__bar">
                <i
                  :style="{ width: `${(t.count / t.max) * 100}%` }"
                  class="is-teal"
                ></i>
              </div>
              <b class="bar-list__count">{{ t.count }}</b>
            </li>
          </ul>
        </div>
      </article>
    </section>

    <!-- 工单明细·可下钻 -->
    <section class="dash-detail">
      <header class="chart-card__head">
        <h3>工单明细 · 可下钻</h3>
        <div class="dash-detail__filters">
          <button
            type="button"
            :class="{ 'is-active': activeTab === 'pending' }"
            @click="activeTab = 'pending'"
          >
            待派单
          </button>
          <button
            type="button"
            :class="{ 'is-active': activeTab === 'dispatched' }"
            @click="activeTab = 'dispatched'"
          >
            已派单
          </button>
        </div>
      </header>
      <div class="detail-table">
        <div class="detail-table__head">
          <span>工单号</span>
          <span>客户</span>
          <span>类型</span>
          <span>区域</span>
          <span>状态</span>
          <span>SLA</span>
          <span>负责人</span>
          <span>操作</span>
        </div>
        <div
          v-for="order in db.detailList.filter((o) =>
            activeTab === 'pending'
              ? o.status === '待派单'
              : o.status !== '待派单',
          )"
          :key="order.id"
          class="detail-table__row"
        >
          <span class="detail-table__code">{{ order.code }}</span>
          <span>{{ order.customer }}</span>
          <span>{{ order.type }}</span>
          <span>{{ order.region }}</span>
          <span>
            <Tag
              :color="
                order.status === '待派单'
                  ? 'orange'
                  : order.status === '处理中'
                    ? 'blue'
                    : order.status === '已完工'
                      ? 'green'
                      : 'default'
              "
            >
              {{ order.status }}
            </Tag>
          </span>
          <span>
            <Tag
              :color="
                order.sla === '超时风险'
                  ? 'red'
                  : order.sla === '剩余1h'
                    ? 'orange'
                    : 'green'
              "
            >
              {{ order.sla }}
            </Tag>
          </span>
          <span>{{ order.assignee }}</span>
          <span class="detail-table__action">
            <button
              v-if="order.status === '待派单'"
              type="button"
              class="action-btn is-primary"
              @click="handleDetailDispatch(order.code)"
            >
              <Icon icon="lucide:send" />
              派单
            </button>
            <button
              v-else
              type="button"
              class="action-btn"
              @click="openEngineerModal('transfer', order.id)"
            >
              <Icon icon="lucide:repeat" />
              转派
            </button>
          </span>
        </div>
        <p
          v-if="
            db.detailList.filter((o) =>
              activeTab === 'pending'
                ? o.status === '待派单'
                : o.status !== '待派单',
            ).length === 0
          "
          class="detail-table__empty"
        >
          暂无{{ activeTab === 'pending' ? '待派单' : '已派单' }}工单。
        </p>
      </div>
    </section>

    <!-- 工程师选择 Modal（派单 / 转派共用） -->
    <Modal
      v-model:open="engineerModalOpen"
      :title="
        engineerModalMode === 'dispatch' ? '选择派单工程师' : '选择转派工程师'
      "
      width="720"
      :footer="null"
    >
      <div v-if="engineerModalOrder" class="eng-modal__summary">
        <strong>
          {{ engineerModalOrder.code }} · {{ engineerModalOrder.title }}
        </strong>
        <div class="eng-modal__tags">
          <Tag :color="statusColor(engineerModalOrder.status)">
            {{ ticketStatusLabel[engineerModalOrder.status] }}
          </Tag>
          <Tag :color="priorityColor(engineerModalOrder.priority)">
            {{ ticketPriorityLabel[engineerModalOrder.priority] }}
          </Tag>
          <span>
            {{ engineerModalOrder.customer }} · {{ engineerModalOrder.type }}
          </span>
        </div>
      </div>

      <Input
        v-model:value="engineerModalKeyword"
        placeholder="搜索姓名 / 区域 / 角色 / 团队"
        allow-clear
        style="margin-bottom: 16px"
      >
        <template #prefix>
          <Icon icon="lucide:search" />
        </template>
      </Input>

      <div v-if="engineerModalList.length > 0" class="eng-list">
        <div class="eng-list__head">
          <span class="eng-list__col-name">工程师</span>
          <span class="eng-list__col-role">角色</span>
          <span class="eng-list__col-area">区域</span>
          <span class="eng-list__col-team">团队</span>
          <span class="eng-list__col-load">待处理</span>
          <span class="eng-list__col-check"></span>
        </div>
        <ul class="eng-list__body">
          <li
            v-for="e in engineerModalList"
            :key="e.id"
            class="eng-list__row"
            :class="{ 'is-selected': engineerModalSelectedId === e.id }"
            @click="engineerModalSelectedId = e.id"
          >
            <span class="eng-list__col-name">
              <i class="eng-list__avatar">
                {{ e.name.slice(0, 1) }}
              </i>
              <strong>{{ e.name }}</strong>
            </span>
            <span class="eng-list__col-role">{{ e.role }}</span>
            <span class="eng-list__col-area">
              <Icon icon="lucide:map-pin" />
              {{ e.area }}
            </span>
            <span class="eng-list__col-team">
              <Icon icon="lucide:users" />
              {{ e.team }}
            </span>
            <span class="eng-list__col-load">
              <Tag
                :color="
                  engineerPendingCount(e.id) >= 4
                    ? 'orange'
                    : engineerPendingCount(e.id) >= 2
                      ? 'blue'
                      : 'green'
                "
              >
                {{ engineerPendingCount(e.id) }}
              </Tag>
            </span>
            <span class="eng-list__col-check">
              <Icon
                v-if="engineerModalSelectedId === e.id"
                icon="lucide:check-circle-2"
              />
            </span>
          </li>
        </ul>
      </div>
      <p v-else class="eng-list__empty">
        <Icon icon="lucide:search-x" />
        未找到匹配的工程师
      </p>

      <div class="eng-modal__note">
        <label>说明（非必填）</label>
        <Input.TextArea
          v-model:value="engineerModalNote"
          :rows="2"
          placeholder="例如：客户 VIP、需携带备件、优先现场等"
        />
      </div>

      <div class="eng-modal__footer">
        <Button @click="engineerModalOpen = false">取消</Button>
        <Button
          type="primary"
          :disabled="!engineerModalSelectedId"
          @click="confirmEngineerModal"
        >
          <Icon icon="lucide:check" />
          确认{{ engineerModalMode === 'dispatch' ? '派单' : '转派' }}
        </Button>
      </div>
    </Modal>
  </section>
</template>

<style scoped>
/* ===== 响应式 ===== */
@media (max-width: 1180px) {
  .dash-top-stats {
    grid-template-columns: repeat(3, 1fr);
  }

  .dash-mid-row,
  .dash-bottom-row {
    grid-template-columns: 1fr;
  }

  .detail-table__head {
    display: none;
  }

  .detail-table__row {
    grid-template-columns: 1fr 1fr;
    gap: 8px 10px;
  }

  .detail-table__action {
    grid-column: span 2;
    justify-content: flex-start;
  }

  .eng-list__head {
    display: none;
  }

  .eng-list__head,
  .eng-list__row {
    grid-template-columns: 1.6fr 1fr 0.6fr 32px;
    gap: 6px 8px;
    padding: 9px 12px;
  }

  .eng-list__col-team,
  .eng-list__col-area {
    display: none;
  }
}

.dash-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  height: 100%;
  padding: 20px;
  overflow: auto;
  background: #f0f5f2;
}

/* ===== 顶部标题 ===== */
.dash-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 18px 24px;
  color: #fff;
  background: linear-gradient(125deg, #073a33 0%, #0b6e65 66%, #178f7b 100%);
  border-radius: 14px;
  box-shadow: 0 12px 30px rgb(7 71 60 / 16%);
}

.dash-header__eyebrow {
  font-size: 10px;
  font-weight: 800;
  color: #74c8b5;
  letter-spacing: 0.14em;
}

.dash-header h1 {
  margin: 6px 0 4px;
  font-size: 22px;
  font-weight: 800;
}

.dash-header p {
  margin: 0;
  font-size: 12px;
  color: rgb(255 255 255 / 72%);
}

.dash-header__actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}

.dash-header__time {
  font-size: 11px;
  color: rgb(255 255 255 / 60%);
}

/* ===== 顶部统计卡 ===== */
.dash-top-stats {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

.stat-card {
  position: relative;
  padding: 16px 18px;
  overflow: hidden;
  cursor: pointer;
  background: #fff;
  border: 1px solid #e1ece7;
  border-radius: 12px;
  transition:
    box-shadow 0.15s,
    transform 0.15s;
}

.stat-card:hover {
  box-shadow: 0 6px 18px rgb(8 117 101 / 14%);
  transform: translateY(-1px);
}

.stat-card::before {
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  content: '';
}

.stat-card.is-orange::before {
  background: #c9a43a;
}

.stat-card.is-blue::before {
  background: #4a7da5;
}

.stat-card.is-green::before {
  background: #2c8a5d;
}

.stat-card.is-red::before {
  background: #d4541f;
}

.stat-card.is-teal::before {
  background: #087565;
}

.stat-card.is-purple::before {
  background: #7a5da8;
}

.stat-card__inner {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-card__value {
  font-size: 28px;
  font-weight: 800;
  line-height: 1.1;
  color: #0c4a3f;
}

.stat-card.is-orange .stat-card__value {
  color: #c9a43a;
}

.stat-card.is-blue .stat-card__value {
  color: #4a7da5;
}

.stat-card.is-green .stat-card__value {
  color: #2c8a5d;
}

.stat-card.is-red .stat-card__value {
  color: #d4541f;
}

.stat-card.is-teal .stat-card__value {
  color: #087565;
}

.stat-card.is-purple .stat-card__value {
  color: #7a5da8;
}

.stat-card__label {
  font-size: 12px;
  color: #729088;
}

/* ===== 中部 3 图 ===== */
.dash-mid-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.chart-card {
  padding: 16px 18px;
  background: #fff;
  border: 1px solid #e1ece7;
  border-radius: 12px;
}

.chart-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.chart-card__head h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #1c3e35;
}

.chart-card__more {
  display: inline-flex;
  gap: 2px;
  align-items: center;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  color: #0b6e65;
  cursor: pointer;
  background: #e3f1ec;
  border: 1px solid #b7d9cf;
  border-radius: 999px;
}

.chart-card__more svg {
  width: 12px;
  height: 12px;
}

/* 状态分布条 */
.status-bar {
  display: flex;
  width: 100%;
  height: 22px;
  overflow: hidden;
  border-radius: 6px;
}

.status-bar__seg {
  height: 100%;
  cursor: pointer;
  transition: width 0.3s;
}

.status-legend {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px 12px;
  padding: 0;
  margin: 10px 0 0;
  list-style: none;
}

.status-legend__item {
  display: flex;
  gap: 5px;
  align-items: center;
  padding: 4px 6px;
  font-size: 11px;
  color: #4a6b62;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.12s;
}

.status-legend__item:hover {
  background: #f2f8f5;
}

.status-legend li {
  display: flex;
  gap: 5px;
  align-items: center;
  font-size: 11px;
  color: #4a6b62;
}

.status-legend i {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.status-legend b {
  margin-left: auto;
  font-size: 11px;
  font-weight: 700;
  color: #0c4a3f;
}

/* 趋势图 */
.trend-change {
  font-size: 12px;
  font-weight: 600;
}

.trend-change.is-up {
  color: #2c8a5d;
}

.trend-change.is-down {
  color: #d4541f;
}

.trend-chart {
  display: flex;
  align-items: center;
  justify-content: center;
}

.trend-chart svg {
  max-width: 100%;
  height: auto;
}

.trend-labels {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-top: 6px;
  font-size: 10px;
  color: #729088;
  text-align: center;
}

/* 预警列表 */
.alert-list {
  display: grid;
  gap: 8px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.alert-item {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 8px 12px;
  background: #f8faf9;
  border-radius: 8px;
}

.alert-item i {
  flex: none;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.alert-item__label {
  flex: 1;
  font-size: 12px;
  color: #355b51;
}

.alert-item__count {
  font-size: 18px;
  font-weight: 800;
}

/* ===== 底部 3 分析卡 ===== */
.dash-bottom-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

/* 服务负载 */
.staff-list {
  display: grid;
  gap: 8px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.staff-item {
  display: grid;
  grid-template-columns: 48px 1fr 30px;
  gap: 10px;
  align-items: center;
}

.staff-item__label {
  font-size: 12px;
  color: #4a6b62;
}

.staff-item__bar {
  height: 14px;
  overflow: hidden;
  background: #eef3f0;
  border-radius: 4px;
}

.staff-item__bar i {
  display: block;
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.staff-item__count {
  font-size: 14px;
  font-weight: 700;
  color: #0c4a3f;
  text-align: right;
}

.staff-saturation {
  padding-top: 10px;
  margin: 12px 0 0;
  font-size: 12px;
  color: #729088;
  border-top: 1px dashed #e1ece7;
}

.staff-saturation strong {
  margin-left: 8px;
  font-size: 16px;
  font-weight: 800;
  color: #2c8a5d;
}

.staff-saturation strong.is-high {
  color: #d4541f;
}

/* 热力图 */
.heat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.heat-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 6px;
  border-radius: 6px;
  transition: transform 0.15s;
}

.heat-cell:hover {
  transform: scale(1.05);
}

.heat-cell__label {
  font-size: 11px;
  color: #fff;
  text-shadow: 0 1px 2px rgb(0 0 0 / 15%);
}

.heat-cell__count {
  font-size: 16px;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 1px 2px rgb(0 0 0 / 20%);
}

.heat-legend {
  margin: 10px 0 0;
  font-size: 11px;
  color: #729088;
  text-align: center;
}

/* 类型/来源 */
.type-source-block h4 {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 600;
  color: #355b51;
}

.type-source-block h4:not(:first-child) {
  margin-top: 12px;
}

.bar-list {
  display: grid;
  gap: 8px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.bar-list li {
  display: grid;
  grid-template-columns: 1fr auto;
  column-gap: 10px;
  align-items: center;
}

.bar-list__label {
  grid-column: 1 / -1;
  margin-bottom: 2px;
  font-size: 11px;
  color: #4a6b62;
}

.bar-list__bar {
  height: 10px;
  overflow: hidden;
  background: #eef3f0;
  border-radius: 3px;
}

.bar-list__bar i {
  display: block;
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s;
}

.bar-list__bar i.is-teal {
  background: linear-gradient(90deg, #4ca87a, #087565);
}

.bar-list__bar i.is-amber {
  background: linear-gradient(90deg, #c9a43a, #8a6d1f);
}

.bar-list__count {
  font-size: 12px;
  font-weight: 700;
  color: #0c4a3f;
}

/* ===== 明细表 ===== */
.dash-detail {
  padding: 16px 18px;
  background: #fff;
  border: 1px solid #e1ece7;
  border-radius: 12px;
}

.dash-detail__filters {
  display: flex;
  gap: 6px;
}

.dash-detail__filters button {
  padding: 5px 14px;
  font-size: 12px;
  font-weight: 600;
  color: #4a6b62;
  cursor: pointer;
  background: #f4f8f6;
  border: 1px solid #d3e4de;
  border-radius: 999px;
}

.dash-detail__filters button.is-active {
  color: #fff;
  background: #0b6e65;
  border-color: #0b6e65;
}

.detail-table {
  margin-top: 10px;
  overflow: hidden;
  border: 1px solid #e1ece7;
  border-radius: 10px;
}

.detail-table__head,
.detail-table__row {
  display: grid;
  grid-template-columns: 1.2fr 1fr 0.6fr 0.6fr 0.8fr 0.8fr 0.8fr 1fr;
  gap: 10px;
  align-items: center;
  padding: 10px 16px;
}

.detail-table__head {
  font-size: 12px;
  font-weight: 700;
  color: #5a756d;
  background: #f4f8f6;
  border-bottom: 1px solid #e1ece7;
}

.detail-table__row {
  font-size: 12px;
  color: #355b51;
  border-bottom: 1px solid #f0f5f2;
  transition: background 0.1s;
}

.detail-table__row:last-child {
  border-bottom: 0;
}

.detail-table__row:hover {
  background: #f6fbf9;
}

.detail-table__code {
  font-weight: 700;
  color: #0c4a3f;
}

.detail-table__action {
  display: flex;
  justify-content: flex-end;
}

.action-btn {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #0b6e65;
  cursor: pointer;
  background: #e3f1ec;
  border: 1px solid #b7d9cf;
  border-radius: 6px;
}

.action-btn svg {
  width: 13px;
  height: 13px;
}

.action-btn.is-primary {
  color: #fff;
  background: #0b6e65;
  border-color: #0b6e65;
}

.detail-table__empty {
  padding: 40px 0;
  font-size: 13px;
  color: #81958e;
  text-align: center;
}

/* ===== 工程师选择 Modal ===== */
.eng-modal__summary {
  padding: 12px 14px;
  margin-bottom: 16px;
  background: #f7faf9;
  border: 1px solid #e1ece7;
  border-radius: 8px;
}

.eng-modal__summary strong {
  display: block;
  font-size: 14px;
  color: #1c3e35;
}

.eng-modal__tags {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-top: 6px;
  font-size: 12px;
  color: #6c8780;
}

.eng-list {
  overflow: hidden;
  background: #fff;
  border: 1px solid #e1ece7;
  border-radius: 10px;
}

.eng-list__head,
.eng-list__row {
  display: grid;
  grid-template-columns: minmax(120px, 1.4fr) 1fr 1fr 1fr 0.6fr 32px;
  gap: 8px;
  align-items: center;
  padding: 10px 14px;
}

.eng-list__head {
  font-size: 11px;
  font-weight: 700;
  color: #5a756d;
  letter-spacing: 0.02em;
  background: #f4f8f6;
  border-bottom: 1px solid #e1ece7;
}

.eng-list__body {
  max-height: 360px;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  list-style: none;
}

.eng-list__row {
  position: relative;
  cursor: pointer;
  border-bottom: 1px solid #f0f5f2;
  transition: background 0.15s;
}

.eng-list__row:last-child {
  border-bottom: 0;
}

.eng-list__row:hover {
  background: #f6fbf9;
}

.eng-list__row.is-selected {
  background: #eef6f2;
  box-shadow: inset 3px 0 0 #0b6e65;
}

.eng-list__col-name {
  display: inline-flex;
  gap: 8px;
  align-items: center;
}

.eng-list__avatar {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-size: 12px;
  font-style: normal;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #0b6e65, #2c8a5d);
  border-radius: 50%;
}

.eng-list__col-name strong {
  font-size: 13px;
  color: #1c3e35;
}

.eng-list__col-role {
  font-size: 12px;
  color: #4a6b62;
}

.eng-list__col-area,
.eng-list__col-team {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font-size: 11px;
  color: #6c8780;
}

.eng-list__col-area svg,
.eng-list__col-team svg {
  width: 12px;
  height: 12px;
  opacity: 0.7;
}

.eng-list__col-load :deep(.ant-tag) {
  min-width: 30px;
  margin: 0;
  font-size: 11px;
  text-align: center;
}

.eng-list__col-check {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  color: #0b6e65;
}

.eng-list__col-check svg {
  width: 18px;
  height: 18px;
}

.eng-list__empty {
  padding: 40px 0;
  font-size: 13px;
  color: #81958e;
  text-align: center;
}

.eng-list__empty svg {
  width: 28px;
  height: 28px;
  margin-right: 6px;
  vertical-align: middle;
  opacity: 0.5;
}

.eng-modal__note {
  margin-top: 16px;
}

.eng-modal__note label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #1c3e35;
}

.eng-modal__footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding-top: 14px;
  margin-top: 18px;
  border-top: 1px solid #e1ece7;
}
</style>
