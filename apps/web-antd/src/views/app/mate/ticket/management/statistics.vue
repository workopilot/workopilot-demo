<script setup lang="ts">
import { computed } from 'vue';

import { Icon } from '@iconify/vue';

import { engineers, mockTicketOverview } from '#/api/mock-data-ticket';

const stats = computed(() => mockTicketOverview);

const trendMax = computed(() =>
  Math.max(...stats.value.trend.map((t) => Math.max(t.created, t.completed))),
);

function trendHeight(value: number) {
  return trendMax.value === 0 ? 0 : Math.max(6, (value / trendMax.value) * 100);
}

const totalByStatus = computed(() => {
  return [
    { label: '待处理', count: stats.value.pending, color: '#e0a32e' },
    { label: '处理中', count: stats.value.processing, color: '#0b6e65' },
    { label: '已完成', count: stats.value.completed, color: '#2c8a5d' },
    { label: '超时', count: stats.value.breached, color: '#d4541f' },
  ];
});

const totalStatusSum = computed(
  () => totalByStatus.value.reduce((s, i) => s + i.count, 0) || 1,
);

const topEngineers = computed(() => {
  return engineers
    .map((e) => ({
      id: e.id,
      name: e.name,
      role: e.role,
      workload: e.workload,
      score: Math.max(60, 100 - e.workload * 7),
    }))
    .toSorted((a, b) => b.score - a.score)
    .slice(0, 5);
});
</script>

<template>
  <section class="ticket-page">
    <header class="ticket-page__header">
      <div class="ticket-page__heading">
        <span class="ticket-page__icon">
          <Icon icon="lucide:bar-chart-3" />
        </span>
        <div>
          <span class="ticket-page__eyebrow">STATISTICS</span>
          <h1>统计报表</h1>
          <p>全方位洞察工单运营数据，量化团队效率与服务质量。</p>
        </div>
      </div>
    </header>

    <section class="mb-5 grid grid-cols-4 gap-4">
      <div class="rounded-xl border border-[#dce9e4] bg-white p-5">
        <div class="mb-1 text-[11px] text-[#729088]">工单总数</div>
        <div class="text-[28px] font-extrabold text-[#0c4a3f]">
          {{ stats.total }}
        </div>
        <div class="mt-2 flex items-center gap-1 text-[11px] text-[#0b6e65]">
          <Icon icon="lucide:trending-up" class="size-3" />
          <span>较上周 +12%</span>
        </div>
      </div>
      <div class="rounded-xl border border-[#dce9e4] bg-white p-5">
        <div class="mb-1 text-[11px] text-[#729088]">待处理</div>
        <div class="text-[28px] font-extrabold text-[#e0a32e]">
          {{ stats.pending }}
        </div>
        <div class="mt-2 flex items-center gap-1 text-[11px] text-[#e0a32e]">
          <Icon icon="lucide:clock" class="size-3" />
          <span>需关注 SLA 临期</span>
        </div>
      </div>
      <div class="rounded-xl border border-[#dce9e4] bg-white p-5">
        <div class="mb-1 text-[11px] text-[#729088]">处理中</div>
        <div class="text-[28px] font-extrabold text-[#0b6e65]">
          {{ stats.processing }}
        </div>
        <div class="mt-2 flex items-center gap-1 text-[11px] text-[#0b6e65]">
          <Icon icon="lucide:loader-circle" class="size-3" />
          <span>正在推进</span>
        </div>
      </div>
      <div class="rounded-xl border border-[#dce9e4] bg-white p-5">
        <div class="mb-1 text-[11px] text-[#729088]">平均解决时长</div>
        <div class="text-[28px] font-extrabold text-[#0c4a3f]">
          {{ stats.avgResolveHours }}h
        </div>
        <div class="mt-2 flex items-center gap-1 text-[11px] text-[#2c8a5d]">
          <Icon icon="lucide:circle-check-big" class="size-3" />
          <span>优于目标 8h</span>
        </div>
      </div>
    </section>

    <section class="grid grid-cols-3 gap-4">
      <div class="col-span-2 rounded-xl border border-[#dce9e4] bg-white p-5">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-[14px] font-bold text-[#0c4a3f]">近 7 日工单趋势</h3>
          <div class="flex items-center gap-3 text-[11px] text-[#729088]">
            <span class="flex items-center gap-1">
              <i
                class="inline-block h-2.5 w-2.5 rounded-[3px] bg-[#0b6e65]"
              ></i>
              新建
            </span>
            <span class="flex items-center gap-1">
              <i
                class="inline-block h-2.5 w-2.5 rounded-[3px] bg-[#d3e4de]"
              ></i>
              完成
            </span>
          </div>
        </div>
        <div class="grid min-h-[220px] grid-cols-7 items-end gap-2.5 pt-3">
          <div
            v-for="day in stats.trend"
            :key="day.day"
            class="grid h-full items-end gap-2"
          >
            <div class="flex h-full min-h-[180px] items-end gap-1.5">
              <span
                class="min-h-[6px] flex-1 rounded-t-[6px] bg-gradient-to-b from-[#178f7b] to-[#0b6e65]"
                :style="{ height: `${trendHeight(day.created)}%` }"
                :title="`新建 ${day.created}`"
              ></span>
              <span
                class="min-h-[6px] flex-1 rounded-t-[6px] bg-gradient-to-b from-[#c9e6d8] to-[#a3cbb8]"
                :style="{ height: `${trendHeight(day.completed)}%` }"
                :title="`完成 ${day.completed}`"
              ></span>
            </div>
            <span class="text-center text-[10px] text-[#81958e]">
              {{ day.day }}
            </span>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-[#dce9e4] bg-white p-5">
        <h3 class="mb-4 text-[14px] font-bold text-[#0c4a3f]">状态分布</h3>
        <div
          class="mb-2 flex items-center justify-between text-[11px] text-[#729088]"
        >
          <span>共 {{ totalStatusSum }} 单</span>
        </div>
        <div
          class="mb-5 flex h-3 w-full overflow-hidden rounded-full bg-[#f0f5f3]"
        >
          <div
            v-for="item in totalByStatus"
            :key="item.label"
            :style="{
              width: `${(item.count / totalStatusSum) * 100}%`,
              background: item.color,
            }"
            :title="`${item.label}: ${item.count}`"
          ></div>
        </div>
        <ul class="m-0 grid list-none gap-3 p-0">
          <li
            v-for="item in totalByStatus"
            :key="item.label"
            class="flex items-center justify-between"
          >
            <span class="flex items-center gap-2">
              <i
                class="h-2.5 w-2.5 rounded-full"
                :style="{ background: item.color }"
              ></i>
              <span class="text-[12px] text-[#24483e]">{{ item.label }}</span>
            </span>
            <span class="text-[14px] font-extrabold text-[#0c4a3f]">
              {{ item.count }}
            </span>
          </li>
        </ul>
      </div>

      <div class="col-span-3 rounded-xl border border-[#dce9e4] bg-white p-5">
        <h3 class="mb-4 text-[14px] font-bold text-[#0c4a3f]">TOP 处理人</h3>
        <div class="grid grid-cols-5 gap-4">
          <div
            v-for="(e, idx) in topEngineers"
            :key="e.id"
            class="rounded-lg border border-[#e8f0ec] bg-[#f7faf9] p-4"
          >
            <div class="mb-2 flex items-center justify-between">
              <span
                class="flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold"
                :class="[
                  idx === 0 && 'bg-[#f5c543] text-white',
                  idx === 1 && 'bg-[#c5c8cc] text-white',
                  idx === 2 && 'bg-[#d2946a] text-white',
                  idx > 2 && 'bg-[#dce9e4] text-[#315e55]',
                ]"
              >
                {{ idx + 1 }}
              </span>
              <span class="text-[12px] font-bold text-[#0b6e65]">
                {{ e.score }} 分
              </span>
            </div>
            <div class="mb-1 text-[13px] font-bold text-[#0c4a3f]">
              {{ e.name }}
            </div>
            <div class="mb-2 text-[10px] text-[#729088]">{{ e.role }}</div>
            <div class="flex items-center gap-2 text-[11px]">
              <span class="text-[#729088]">在处理</span>
              <span class="font-bold text-[#0b6e65]">{{ e.workload }} 单</span>
            </div>
          </div>
        </div>
      </div>
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
</style>
