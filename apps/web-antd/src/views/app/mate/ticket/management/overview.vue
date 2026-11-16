<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import type { SlaStatus, TicketPriority, TicketStatus } from '#/types/ticket';

import { computed } from 'vue';

import { Icon } from '@iconify/vue';

import {
  mockTicketOverview,
  mockWorkOrders,
  ticketPriorityLabel,
  ticketStatusLabel,
} from '#/api/mock-data-ticket';

const stats = computed(() => mockTicketOverview);

const trendMax = computed(() =>
  Math.max(...stats.value.trend.map((t) => Math.max(t.created, t.completed))),
);

function trendHeight(value: number) {
  return trendMax.value === 0 ? 0 : Math.max(6, (value / trendMax.value) * 100);
}

function slaStatusColor(status: SlaStatus) {
  switch (status) {
    case 'breached': {
      return '#d4541f';
    }
    case 'warning': {
      return '#e0a32e';
    }
    default: {
      return '#0b6e65';
    }
  }
}

function priorityColor(priority: TicketPriority) {
  switch (priority) {
    case 'high': {
      return '#e0a32e';
    }
    case 'medium': {
      return '#0b6e65';
    }
    case 'urgent': {
      return '#d4541f';
    }
    default: {
      return '#729088';
    }
  }
}

function statusColor(status: TicketStatus) {
  switch (status) {
    case 'completed': {
      return '#5b8c72';
    }
    case 'dispatched': {
      return '#3b82c4';
    }
    case 'onsite-processing': {
      return '#3f5aa8';
    }
    case 'pending': {
      return '#e0a32e';
    }
    case 'pending-acceptance': {
      return '#8a4b15';
    }
    case 'pending-visit': {
      return '#2a8fa0';
    }
    case 'processing': {
      return '#0b6e65';
    }
    default: {
      return '#729088';
    }
  }
}

const recentOrders = computed(() =>
  [...mockWorkOrders]
    .toSorted((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 6),
);
</script>

<template>
  <section class="ticket-page">
    <header class="ticket-page__header">
      <div class="ticket-page__heading">
        <span class="ticket-page__icon">
          <Icon icon="lucide:chart-no-axes-combined" />
        </span>
        <div>
          <span class="ticket-page__eyebrow">WORK ORDER OVERVIEW</span>
          <h1>工单概览</h1>
          <p>实时跟踪工单总量、SLA 达成与趋势，支撑服务运营决策。</p>
        </div>
      </div>
    </header>

    <section class="overview-stats">
      <div class="overview-stat">
        <span class="overview-stat__num">{{ stats.total }}</span>
        <span class="overview-stat__label">工单总数</span>
        <Icon icon="lucide:clipboard-list" class="overview-stat__icon" />
      </div>
      <div class="overview-stat">
        <span class="overview-stat__num is-warn">{{ stats.pending }}</span>
        <span class="overview-stat__label">待派单</span>
        <Icon icon="lucide:clock" class="overview-stat__icon" />
      </div>
      <div class="overview-stat">
        <span class="overview-stat__num is-active">{{ stats.processing }}</span>
        <span class="overview-stat__label">处理中</span>
        <Icon icon="lucide:loader-circle" class="overview-stat__icon" />
      </div>
      <div class="overview-stat">
        <span class="overview-stat__num">{{ stats.completed }}</span>
        <span class="overview-stat__label">已完成</span>
        <Icon icon="lucide:circle-check-big" class="overview-stat__icon" />
      </div>
      <div class="overview-stat">
        <span class="overview-stat__num is-danger">{{ stats.breached }}</span>
        <span class="overview-stat__label">SLA 超时</span>
        <Icon icon="lucide:alert-triangle" class="overview-stat__icon" />
      </div>
      <div class="overview-stat">
        <span class="overview-stat__num">{{ stats.avgResolveHours }}h</span>
        <span class="overview-stat__label">平均解决时长</span>
        <Icon icon="lucide:timer" class="overview-stat__icon" />
      </div>
    </section>

    <section class="overview-grid">
      <article class="overview-card overview-trend">
        <header>
          <h3>近 7 日工单趋势</h3>
          <span>
            <i class="legend legend--created"></i>
            新建
            <i class="legend legend--completed"></i>
            完成
          </span>
        </header>
        <div class="trend-chart">
          <div v-for="day in stats.trend" :key="day.day" class="trend-col">
            <div class="trend-bars">
              <span
                class="trend-bar trend-bar--created"
                :style="{ height: `${trendHeight(day.created)}%` }"
                :title="`新建 ${day.created}`"
              ></span>
              <span
                class="trend-bar trend-bar--completed"
                :style="{ height: `${trendHeight(day.completed)}%` }"
                :title="`完成 ${day.completed}`"
              ></span>
            </div>
            <span class="trend-label">{{ day.day }}</span>
          </div>
        </div>
      </article>

      <article class="overview-card">
        <header>
          <h3>工单类型分布</h3>
          <span>{{ stats.byType.length }} 类</span>
        </header>
        <ul class="bar-list">
          <li v-for="item in stats.byType" :key="item.type">
            <span class="bar-list__label">{{ item.type }}</span>
            <span class="bar-list__track">
              <span
                class="bar-list__fill"
                :style="{ width: `${(item.count / stats.total) * 100}%` }"
              ></span>
            </span>
            <span class="bar-list__count">{{ item.count }}</span>
          </li>
        </ul>
      </article>

      <article class="overview-card">
        <header>
          <h3>优先级分布</h3>
          <span>共 {{ stats.total }} 单</span>
        </header>
        <ul class="priority-list">
          <li v-for="item in stats.byPriority" :key="item.priority">
            <span
              class="priority-list__dot"
              :style="{ background: priorityColor(item.priority) }"
            ></span>
            <span class="priority-list__label">
              {{ ticketPriorityLabel[item.priority] }}
            </span>
            <span class="priority-list__count">{{ item.count }}</span>
          </li>
        </ul>
      </article>

      <article class="overview-card overview-recent">
        <header>
          <h3>最新工单</h3>
          <span>实时更新</span>
        </header>
        <ul class="recent-list">
          <li v-for="order in recentOrders" :key="order.id">
            <span
              class="recent-list__status"
              :style="{ background: statusColor(order.status) }"
            ></span>
            <div class="recent-list__main">
              <strong>{{ order.title }}</strong>
              <small>{{ order.code }} · {{ order.customer }}</small>
            </div>
            <div class="recent-list__meta">
              <span
                class="recent-list__sla"
                :style="{ color: slaStatusColor(order.slaStatus) }"
              >
                {{ order.slaRemaining || '-' }}
              </span>
              <span class="recent-list__status-text">
                {{ ticketStatusLabel[order.status] }}
              </span>
            </div>
          </li>
        </ul>
      </article>
    </section>
  </section>
</template>

<style scoped>
.ticket-page {
  height: 100%;
  min-height: 0;
  padding: 24px;
  overflow: auto;
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

.overview-stats {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.overview-stat {
  position: relative;
  display: grid;
  gap: 4px;
  padding: 18px 20px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #dce9e4;
  border-radius: 14px;
}

.overview-stat__num {
  font-size: 28px;
  font-weight: 800;
  color: #0c4a3f;
}

.overview-stat__num.is-warn {
  color: #e0a32e;
}

.overview-stat__num.is-active {
  color: #0b6e65;
}

.overview-stat__num.is-danger {
  color: #d4541f;
}

.overview-stat__label {
  font-size: 11px;
  color: #729088;
}

.overview-stat__icon {
  position: absolute;
  top: 14px;
  right: 14px;
  font-size: 22px;
  color: #d3e4de;
}

.overview-grid {
  display: grid;
  grid-template-rows: auto auto;
  grid-template-columns: 1.4fr 1fr 0.8fr;
  gap: 14px;
}

.overview-card {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 14px;
  padding: 18px 20px;
  background: #fff;
  border: 1px solid #dce9e4;
  border-radius: 16px;
}

.overview-card header {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.overview-card header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #0c4a3f;
}

.overview-card header span {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 11px;
  color: #729088;
}

.overview-trend {
  grid-row: span 2;
}

.legend {
  display: inline-block;
  width: 10px;
  height: 10px;
  margin-right: 2px;
  border-radius: 3px;
}

.legend--created {
  background: #0b6e65;
}

.legend--completed {
  margin-left: 8px;
  background: #d3e4de;
}

.trend-chart {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
  align-items: end;
  min-height: 200px;
  padding: 12px 4px 0;
}

.trend-col {
  display: grid;
  gap: 8px;
  align-items: end;
  height: 100%;
}

.trend-bars {
  display: flex;
  gap: 6px;
  align-items: end;
  height: 100%;
  min-height: 160px;
}

.trend-bar {
  flex: 1;
  min-height: 6px;
  border-radius: 6px 6px 0 0;
  transition: height 0.4s ease;
}

.trend-bar--created {
  background: linear-gradient(180deg, #178f7b 0%, #0b6e65 100%);
}

.trend-bar--completed {
  background: linear-gradient(180deg, #c9e6d8 0%, #a3cbb8 100%);
}

.trend-label {
  font-size: 10px;
  color: #81958e;
  text-align: center;
}

.bar-list {
  display: grid;
  gap: 10px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.bar-list li {
  display: grid;
  grid-template-columns: 90px 1fr 24px;
  gap: 10px;
  align-items: center;
}

.bar-list__label {
  font-size: 12px;
  color: #24483e;
}

.bar-list__track {
  height: 8px;
  background: #f0f5f3;
  border-radius: 999px;
}

.bar-list__fill {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #0b6e65, #32c8a5);
  border-radius: 999px;
}

.bar-list__count {
  font-size: 12px;
  font-weight: 700;
  color: #0c4a3f;
  text-align: right;
}

.priority-list {
  display: grid;
  gap: 12px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.priority-list li {
  display: grid;
  grid-template-columns: 14px 1fr auto;
  gap: 10px;
  align-items: center;
}

.priority-list__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.priority-list__label {
  font-size: 12px;
  color: #24483e;
}

.priority-list__count {
  font-size: 14px;
  font-weight: 800;
  color: #0c4a3f;
}

.overview-recent {
  grid-column: span 2;
}

.recent-list {
  display: grid;
  gap: 8px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.recent-list li {
  display: grid;
  grid-template-columns: 8px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  background: #f7faf9;
  border-radius: 10px;
}

.recent-list__status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.recent-list__main strong {
  display: block;
  font-size: 12px;
  color: #0c4a3f;
}

.recent-list__main small {
  display: block;
  margin-top: 2px;
  font-size: 10px;
  color: #81958e;
}

.recent-list__meta {
  display: grid;
  gap: 2px;
  text-align: right;
}

.recent-list__sla {
  font-size: 11px;
  font-weight: 700;
}

.recent-list__status-text {
  font-size: 10px;
  color: #6c8780;
}

@media (max-width: 1280px) {
  .overview-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .overview-grid {
    grid-template-columns: 1fr 1fr;
  }

  .overview-trend {
    grid-row: auto;
    grid-column: span 2;
  }

  .overview-recent {
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  .overview-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .overview-grid {
    grid-template-columns: 1fr;
  }

  .overview-trend,
  .overview-recent {
    grid-column: auto;
  }
}
</style>
