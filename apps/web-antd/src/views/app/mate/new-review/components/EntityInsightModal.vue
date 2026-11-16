<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Icon } from '@iconify/vue';
import { Modal, Table } from 'ant-design-vue';
import type { ReportObject } from '#/api/mock-report-objects';
import { entityInsights } from '#/api/mock-entity-insights';

const props = defineProps<{ entity?: ReportObject }>();
const emit = defineEmits<{ close: [] }>();
const view = ref<'trend' | 'people'>('trend');
const peoplePage = ref(1);
const peopleColumns = [
  { title: '序号', dataIndex: 'rank', key: 'rank', width: 70 },
  { title: '姓名', dataIndex: 'name', key: 'name' },
  {
    title: '提及次数',
    dataIndex: 'count',
    key: 'count',
    width: 120,
    align: 'right' as const,
  },
];
watch(
  () => props.entity?.id,
  () => {
    view.value = 'trend';
    peoplePage.value = 1;
  },
);
const insight = computed(() =>
  props.entity ? entityInsights(props.entity) : undefined,
);
const ceiling = computed(() =>
  Math.max(
    5,
    Math.ceil(
      Math.max(...(insight.value?.weeks.map((week) => week.count) ?? [0])) / 5,
    ) * 5,
  ),
);
const points = computed(
  () =>
    insight.value?.weeks.map((week, index) => ({
      ...week,
      x: 58 + index * 119,
      y: 180 - (week.count / ceiling.value) * 130,
    })) ?? [],
);
const line = computed(() =>
  points.value
    .map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`)
    .join(' '),
);
const area = computed(() => `${line.value} L 534 180 L 58 180 Z`);
const grid = computed(() =>
  [0, 1, 2].map((index) => ({
    value: (ceiling.value * index) / 2,
    y: 180 - index * 65,
  })),
);
const trendLabel = computed(
  () =>
    `${props.entity?.name ?? ''}最近五周提及次数：${insight.value?.weeks.map((week) => `${week.start}当周 ${week.count} 次`).join('，')}`,
);
</script>

<template>
  <Modal
    :open="!!entity"
    :footer="null"
    :width="700"
    :title="'实体与热词'"
    destroy-on-close
    @cancel="emit('close')"
  >
    <div v-if="entity && insight" class="entity-insight">
      <header class="entity-title">
        <span
          class="entity-symbol"
          :class="{ customer: entity.kind === 'customer' }"
          ><Icon
            :icon="
              entity.kind === 'project'
                ? 'lucide:folder-kanban'
                : 'lucide:building-2'
            "
        /></span>
        <div>
          <span class="entity-type">{{
            entity.kind === 'project' ? '项目实体' : '客户实体'
          }}</span>
          <h2>{{ entity.name }}</h2>
          <p>{{ entity.description }}</p>
        </div>
      </header>
      <section class="alias-section">
        <h3><Icon icon="lucide:tags" />识别别称</h3>
        <div class="alias-list">
          <span v-for="alias in insight.aliases" :key="alias">{{ alias }}</span>
        </div>
        <p>同义名称归并到同一实体，统一统计关注热度。</p>
      </section>
      <div class="entity-metrics">
        <div>
          <span class="metric-icon"
            ><Icon icon="lucide:message-square-text"
          /></span>
          <div>
            <span>总提及次数</span
            ><strong>{{ insight.totalMentions }}<small>次</small></strong>
          </div>
        </div>
        <button
          type="button"
          class="people-metric"
          :class="{ active: view === 'people' }"
          :aria-pressed="view === 'people'"
          :aria-label="`查看 ${insight.totalPeople} 人的提及次数排名`"
          @click="view = 'people'"
        >
          <span class="metric-icon people"
            ><Icon icon="lucide:users-round"
          /></span>
          <div>
            <span>提及人数</span
            ><strong>{{ insight.totalPeople }}<small>人</small></strong>
          </div>
          <span class="metric-link"
            >查看排名<Icon icon="lucide:chevron-right"
          /></span>
        </button>
      </div>
      <div class="insight-tabs" role="group" aria-label="实体统计视图">
        <button
          type="button"
          :aria-pressed="view === 'trend'"
          :class="{ active: view === 'trend' }"
          @click="view = 'trend'"
        >
          提及趋势</button
        ><button
          type="button"
          :aria-pressed="view === 'people'"
          :class="{ active: view === 'people' }"
          @click="view = 'people'"
        >
          人员排名<span>{{ insight.totalPeople }}</span>
        </button>
      </div>
      <section v-if="view === 'trend'" class="mention-trend">
        <header>
          <div>
            <h3>最近 5 周提及趋势</h3>
            <p>按周汇总名称及别称的提及次数</p>
          </div>
          <span><i></i>提及次数</span>
        </header>
        <svg viewBox="0 0 590 232" role="img" :aria-label="trendLabel">
          <defs>
            <linearGradient
              :id="`mentions-${entity.id}`"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stop-color="#10b981" stop-opacity=".30" />
              <stop offset="100%" stop-color="#10b981" stop-opacity=".025" />
            </linearGradient>
          </defs>
          <g v-for="tick in grid" :key="tick.y">
            <line
              x1="58"
              :y1="tick.y"
              x2="534"
              :y2="tick.y"
              stroke="#e2eae5"
              stroke-dasharray="4 5"
            />
            <text x="39" :y="tick.y + 4" text-anchor="end" class="axis-text">
              {{ tick.value }}
            </text>
          </g>
          <path :d="area" :fill="`url(#mentions-${entity.id})`" />
          <path
            :d="line"
            fill="none"
            stroke="#059669"
            stroke-width="3.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <g v-for="(point, index) in points" :key="point.start">
            <circle
              v-if="index === 4"
              :cx="point.x"
              :cy="point.y"
              r="11"
              fill="#10b981"
              fill-opacity=".14"
            />
            <circle
              :cx="point.x"
              :cy="point.y"
              r="5"
              fill="white"
              stroke="#059669"
              stroke-width="2.5"
            >
              <title>
                {{ point.start }} — {{ point.end }}：{{ point.count }} 次
              </title>
            </circle>
            <text
              :x="point.x"
              :y="point.y - 15"
              text-anchor="middle"
              class="point-value"
            >
              {{ point.count }}
            </text>
            <text :x="point.x" y="205" text-anchor="middle" class="axis-text">
              {{ point.label }}
            </text>
            <text
              v-if="index === 4"
              :x="point.x"
              y="222"
              text-anchor="middle"
              class="current-week"
            >
              本周
            </text>
          </g>
        </svg>
        <div class="trend-summary">
          <Icon icon="lucide:chart-line" /><span
            >近 5 周共提及 <b>{{ insight.recentMentions }}</b> 次，本周已提及
            <b>{{ insight.weeks[4]?.count ?? 0 }}</b> 次。</span
          >
        </div>
      </section>
      <section v-else class="people-ranking">
        <header>
          <h3><Icon icon="lucide:users-round" />提及人数统计</h3>
          <span>按提及次数降序</span>
        </header>
        <Table
          size="small"
          bordered
          :columns="peopleColumns"
          :data-source="insight.personMentions"
          row-key="id"
          :pagination="{
            current: peoplePage,
            pageSize: 5,
            showSizeChanger: false,
            showTotal: (total: number) => `共 ${total} 人`,
            onChange: (page: number) => (peoplePage = page),
          }"
          ><template #bodyCell="{ column, record }"
            ><span
              v-if="column.key === 'rank'"
              class="person-rank"
              :class="{ leading: record.rank <= 3 }"
              >{{ record.rank }}</span
            ><span v-else-if="column.key === 'name'" class="ranked-person"
              ><i>{{ record.name.slice(0, 1) }}</i
              >{{ record.name }}</span
            ><strong v-else-if="column.key === 'count'" class="person-count"
              >{{ record.count }}<small>次</small></strong
            ></template
          ></Table
        >
        <p>
          累计 {{ insight.totalMentions }} 次提及，按人员去重统计
          {{ insight.totalPeople }} 人。
        </p>
      </section>
      <details v-if="view === 'trend'" class="trend-data">
        <summary>查看每周数据</summary>
        <table>
          <thead>
            <tr>
              <th>周期</th>
              <th>提及次数</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="week in insight.weeks" :key="week.start">
              <td>{{ week.start }} — {{ week.end }}</td>
              <td>{{ week.count }}</td>
            </tr>
          </tbody>
        </table>
      </details>
      <p class="entity-demo-note">
        演示统计 · 累计次数合并识别别称，提及人数按人员去重；本周数据截至当前。
      </p>
    </div>
  </Modal>
</template>

<style scoped>
.entity-insight {
  color: #2b483a;
  padding: 12px 0 3px;
}
.entity-title {
  display: flex;
  gap: 13px;
  align-items: center;
  padding: 18px;
  border-radius: 12px;
  background:
    radial-gradient(ellipse at 100% 0%, #43c99b50, transparent 75%),
    linear-gradient(120deg, #153f35, #08735b);
  border: 1px solid #19644f;
  box-shadow: 0 7px 18px #145b3d17;
}
.entity-symbol {
  display: grid;
  place-items: center;
  flex: 0 0 46px;
  height: 46px;
  color: #fff;
  background: #ffffff1f;
  border: 1px solid #ffffff3b;
  font-size: 25px;
  border-radius: 12px;
}
.entity-symbol.customer {
  background: linear-gradient(145deg, #c4a16e, #a67c44);
}
.entity-type {
  display: inline-block;
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 4px;
  color: #dcfce7;
  background: #ffffff14;
  border: 1px solid #ffffff24;
}
.entity-title h2 {
  font-size: 20px;
  font-weight: 650;
  margin: 2px 0 4px;
  color: #fff;
}
.entity-title p {
  font-size: 12px;
  color: #c9e8dc;
  margin: 0;
}
.alias-section {
  margin: 22px 0;
}
h3 {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #254b3b;
  margin: 0 0 10px;
}
.alias-section h3 svg {
  color: #14875d;
}
.alias-list {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}
.alias-list span {
  font-size: 12px;
  background: #eaf7f0;
  border: 1px solid #bde2cc;
  padding: 4px 10px;
  border-radius: 6px;
  color: #28744c;
}
.alias-section > p {
  color: #687d71;
  font-size: 11px;
  margin: 9px 0 0;
}
.entity-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 20px;
}
.entity-metrics > :is(div, button) {
  display: flex;
  gap: 12px;
  align-items: center;
  border: 1px solid #e1e9e3;
  padding: 17px;
  border-radius: 10px;
  box-shadow: 0 3px 8px #254c3604;
}
.metric-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 11px;
  color: #fff;
  background: #168b61;
  font-size: 20px;
}
.metric-icon.people {
  color: #fff;
  background: #3479be;
}
.entity-metrics > :is(div, button) > div > span {
  display: block;
  color: #486454;
  font-size: 11px;
}
.entity-metrics strong {
  display: block;
  color: #146342;
  font-size: 32px;
  line-height: 1.4;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
}
.entity-metrics strong small {
  color: #62796b;
  margin-left: 5px;
  font-size: 11px;
  font-weight: 400;
}
.mention-trend {
  padding: 18px 16px 12px;
  border: 1px solid #bde2cc;
  border-radius: 12px;
  background: #fcfdfc;
}
.mention-trend > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.mention-trend h3 {
  margin-bottom: 3px;
}
.mention-trend header p {
  font-size: 11px;
  color: #6b8074;
  margin: 0;
}
.mention-trend header > span {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #40775b;
  font-size: 10px;
}
.mention-trend header i {
  width: 12px;
  height: 3px;
  background: #059669;
  border-radius: 2px;
}
.mention-trend > svg {
  display: block;
  width: 100%;
  height: auto;
  margin-top: 10px;
}
.axis-text {
  font-size: 10px;
  fill: #6c8274;
}
.point-value {
  font-size: 12px;
  fill: #087b50;
  font-weight: 600;
}
.current-week {
  font-size: 9px;
  fill: #168253;
}
.trend-summary {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  color: #4d715b;
  padding: 9px 10px;
  background: #e7f6ed;
  border-radius: 6px;
}
.trend-summary b {
  font-weight: 600;
  color: #087844;
}
.trend-summary > svg {
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  margin: 0;
}
.trend-summary > span {
  min-width: 0;
  line-height: 1.7;
}
.trend-data {
  margin-top: 12px;
  font-size: 11px;
  color: #3c7853;
}
.trend-data summary {
  cursor: pointer;
  padding: 5px 0;
}
.trend-data table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 7px;
}
.trend-data th,
.trend-data td {
  text-align: left;
  padding: 6px 9px;
  border: 1px solid #e1eae4;
}
.trend-data th {
  background: #f2f7f4;
  font-weight: 500;
}
.entity-demo-note {
  font-size: 10px;
  color: #74877a;
  margin: 15px 0 0;
  line-height: 1.8;
}
.entity-metrics > :is(div, button):first-child {
  border-left: 3px solid #20a271;
  background: linear-gradient(115deg, #edf9f1, #fff 75%);
}
.entity-metrics > :is(div, button):last-child {
  border-left: 3px solid #4b8fce;
  background: linear-gradient(115deg, #eef5fd, #fff 75%);
}
.entity-metrics > :is(div, button):last-child strong {
  color: #245d97;
}
.mention-trend {
  background: #fff;
  border-color: #d4e2d9;
}
.trend-summary {
  font-size: 12px;
  border: 1px solid #cce9d6;
}
.trend-summary > svg {
  color: #07915d;
}
.alias-list span {
  font-weight: 500;
}
.entity-title h2 {
  font-size: 22px;
  letter-spacing: -0.3px;
  margin-top: 6px;
}
.people-metric {
  position: relative;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition:
    border-color 160ms,
    box-shadow 160ms;
}
.people-metric:hover,
.people-metric.active {
  border-color: #7babd3;
  box-shadow: 0 3px 12px #3479be14;
}
.people-metric:focus-visible,
.insight-tabs button:focus-visible {
  outline: 2px solid #3479be;
  outline-offset: 3px;
}
.metric-link {
  position: absolute;
  right: 10px;
  bottom: 8px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: #3479be;
  font-size: 10px;
}
.metric-link > svg {
  width: 12px;
  height: 12px;
}
.insight-tabs {
  display: flex;
  gap: 4px;
  width: fit-content;
  padding: 4px;
  border: 1px solid #e0e8e3;
  border-radius: 9px;
  background: #f1f5f3;
  margin-bottom: 14px;
}
.insight-tabs button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #73877a;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
}
.insight-tabs button.active {
  color: #266c4b;
  background: #fff;
  box-shadow: 0 2px 5px #2448310d;
  font-weight: 500;
}
.insight-tabs button > span {
  font-size: 10px;
  padding: 0 5px;
  border-radius: 4px;
  background: #e8f1ec;
  color: #5e8a6f;
}
.people-ranking {
  border: 1px solid #d4e2d9;
  padding: 16px;
  border-radius: 12px;
  background: #fff;
}
.people-ranking > header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}
.people-ranking h3 {
  margin: 0;
}
.people-ranking > header > span {
  font-size: 11px;
  color: #799082;
}
.people-ranking :deep(.ant-table-thead > tr > th) {
  background: #eff6f2;
  color: #2d5b40;
  font-size: 12px;
  font-weight: 600;
}
.people-ranking :deep(.ant-table-tbody > tr > td) {
  font-size: 12px;
  padding: 9px 12px;
}
.people-ranking :deep(.ant-pagination) {
  font-size: 11px;
}
.person-rank {
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  color: #7a8c7e;
  font-size: 11px;
}
.person-rank.leading {
  color: #a77932;
  background: #fff2d9;
  border-radius: 5px;
  font-weight: 600;
}
.ranked-person {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #3b5b47;
}
.ranked-person i {
  display: inline-grid;
  place-items: center;
  width: 24px;
  height: 24px;
  background: #eaf2ed;
  border-radius: 50%;
  font-size: 10px;
  font-style: normal;
  color: #63866f;
}
.person-count {
  color: #3479a6;
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.person-count small {
  font-size: 10px;
  font-weight: 400;
  color: #8a9d90;
  margin-left: 4px;
}
.people-ranking > p {
  font-size: 11px;
  color: #728a7b;
  margin: 12px 0 0;
}
@media (prefers-reduced-motion: reduce) {
  .people-metric {
    transition: none;
  }
}
@media (max-width: 500px) {
  .entity-metrics {
    gap: 8px;
  }
  .entity-metrics > :is(div, button) {
    padding: 12px;
    gap: 8px;
  }
  .entity-metrics strong {
    font-size: 24px;
  }
  .metric-icon {
    width: 30px;
    height: 30px;
    flex-shrink: 0;
    font-size: 16px;
  }
  .entity-title h2 {
    font-size: 17px;
  }
}
</style>
