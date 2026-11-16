<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { Icon } from '@iconify/vue';
import { Button, Input } from 'ant-design-vue';
import dayjs from 'dayjs';
import { demoReports, reportSchemes } from '#/api/mock-new-reports';
import { followedReportObjects } from '#/api/mock-report-objects';
import {
  hubObjects,
  hubReportGroups,
  recentHubReports,
  reportCategories,
  seedReportHub,
} from '#/api/mock-report-hub';
import type { ReportCategory } from '#/api/mock-report-hub';
import type { ReportDraft } from '#/types/new-report';
import { zhijiSchemes } from '#/api/mock-zhiji';

const props = defineProps<{ category?: ReportCategory }>();
const emit = defineEmits<{
  category: [category?: ReportCategory];
  open: [report: ReportDraft];
  history: [];
  manage: [schemeId: string, period: string];
}>();
const search = ref('');
const now = ref(dayjs());
let clock: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  clock = setInterval(() => {
    now.value = dayjs();
  }, 60_000);
});
onUnmounted(() => {
  if (clock) clearInterval(clock);
});
function submissionDeadline(report: ReportDraft) {
  const config =
    report.schemeConfig ??
    zhijiSchemes.find((item) => item.id === report.schemeId);
  const offset = config?.deadlineDay ?? 0;
  const [hour, minute] = (config?.deadlineTime ?? '23:59')
    .split(':')
    .map(Number);
  return dayjs(report.end)
    .add(offset, 'day')
    .hour(hour!)
    .minute(minute!)
    .second(0)
    .millisecond(0);
}
function overdue(report: ReportDraft) {
  return (
    report.status !== 'submitted' &&
    now.value.isAfter(submissionDeadline(report))
  );
}
function cardStatus(report: ReportDraft) {
  return report.status === 'submitted'
    ? '最后一次提交'
    : overdue(report)
      ? '已超期'
      : '未到期';
}
watch(
  () => [
    followedReportObjects.project.join(','),
    followedReportObjects.customer.join(','),
    reportSchemes
      .filter((item) => item.enabled)
      .map((item) => item.id)
      .join(','),
  ],
  seedReportHub,
  { immediate: true },
);
watch(
  () => props.category,
  () => {
    search.value = '';
  },
);
const category = computed(() =>
  reportCategories.find((item) => item.id === props.category),
);
const groups = computed(() =>
  hubReportGroups
    .filter(
      (group) =>
        group.category === props.category &&
        reportSchemes.some(
          (scheme) => scheme.id === group.schemeId && scheme.enabled,
        ),
    )
    .map((group) => ({
      ...group,
      rows: hubObjects(group.category)
        .map((object) => ({
          ...object,
          reports: recentHubReports(group, object.id),
        }))
        .filter((row) =>
          `${row.name} ${group.title}`
            .toLowerCase()
            .includes(search.value.trim().toLowerCase()),
        ),
    })),
);
const groupedByObject = computed(
  () => props.category === 'project' || props.category === 'customer',
);
function countDrafts(id: ReportCategory) {
  const ids = hubReportGroups
    .filter((group) => group.category === id)
    .map((group) => group.schemeId);
  return demoReports.filter(
    (report) => ids.includes(report.schemeId) && report.status === 'draft',
  ).length;
}
function periodTitle(report: ReportDraft) {
  const start = dayjs(report.start);
  if (report.period === 'month') return start.format('YYYY 年 M 月');
  if (report.period === 'day') return start.format('M 月 D 日');
  return `${start.format('MM.DD')} — ${dayjs(report.end).format('MM.DD')}`;
}
function paperSummary(report: ReportDraft) {
  if (report.schemeId === 'project')
    return '阶段与进展 · 任务情况\n风险与协调 · 下期计划';
  if (report.schemeId === 'customer')
    return '服务概述 · 工单与任务\n重点跟进 · 服务计划';
  if (report.schemeId === 'productline')
    return '版本与需求 · 交付成果\n迭代风险 · 下期安排';
  return '本期成果 · 工作完成情况\n下期计划 · 风险与协调';
}
</script>

<template>
  <section class="report-hub" :class="category ? `tone-${category.color}` : ''">
    <template v-if="!category">
      <header class="hub-heading">
        <div>
          <span class="eyebrow">REPORT WORKSPACE</span>
          <h2>我的汇报</h2>
          <p>选择报告类别，继续完成最近的汇报。</p>
        </div>
        <Button class="hub-history" @click="emit('history')"
          ><Icon icon="lucide:history" />历史报告</Button
        >
      </header>
      <div class="category-grid">
        <button
          v-for="item in reportCategories"
          :key="item.id"
          type="button"
          class="category-card"
          :class="`tone-${item.color}`"
          @click="emit('category', item.id)"
        >
          <div class="category-top">
            <span class="category-icon"><Icon :icon="item.icon" /></span
            ><span class="category-arrow"
              ><Icon icon="lucide:arrow-up-right"
            /></span>
          </div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.description }}</p>
          <span class="category-types">{{ item.hint }}</span>
          <div class="category-footer">
            <span
              ><b>{{ countDrafts(item.id) }}</b> 份未提交</span
            ><span>进入报告 <Icon icon="lucide:arrow-right" /></span>
          </div>
        </button>
      </div>
      <p class="hub-footnote">
        按报告类型归类，最近未提交的报告与最后一次提交记录集中展示。示例数据仅在本次演示中生效。
      </p>
    </template>

    <template v-else>
      <header class="category-toolbar">
        <Button
          class="category-back"
          aria-label="返回汇报"
          @click="emit('category')"
          ><Icon icon="lucide:chevron-left"
        /></Button>
        <nav aria-label="汇报位置">
          <button type="button" @click="emit('category')">汇报</button
          ><span>/</span><span aria-current="page">{{ category.title }}</span>
        </nav>
        <Button class="hub-history" @click="emit('history')"
          ><Icon icon="lucide:history" />历史报告</Button
        >
      </header>
      <div class="category-heading">
        <div>
          <span class="category-heading-icon"
            ><Icon :icon="category.icon"
          /></span>
          <div>
            <h2>{{ category.title }}</h2>
            <p>最后一次提交在左侧，最近 3 份未提交报告按周期从早到晚排列。</p>
          </div>
        </div>
        <Input
          v-model:value="search"
          allow-clear
          :placeholder="
            groupedByObject
              ? `搜索${category.id === 'project' ? '项目' : '客户'}或报告`
              : '搜索报告类型'
          "
          aria-label="搜索报告"
          class="hub-search"
          ><template #prefix><Icon icon="lucide:search" /></template
        ></Input>
      </div>
      <section
        v-for="group in groups"
        :key="`${group.schemeId}:${group.period}`"
        class="report-group"
      >
        <header class="group-heading">
          <h3>{{ group.title }}</h3>
          <div>
            <span class="group-legend"
              ><i class="submitted-dot"></i>最后一次提交<i
                class="overdue-dot"
              ></i
              >已超期<i></i>未到期</span
            ><Button
              v-if="groupedByObject"
              size="small"
              @click="emit('manage', group.schemeId, group.period)"
              ><Icon icon="lucide:settings-2" />管理{{
                category.id === 'project' ? '项目' : '客户'
              }}</Button
            >
          </div>
        </header>
        <div
          v-for="row in group.rows"
          :key="row.id || group.schemeId"
          class="object-report-row"
          :class="{ 'with-object': groupedByObject }"
        >
          <aside v-if="groupedByObject" class="object-label">
            <span><Icon :icon="category.icon" /></span>
            <h4>{{ row.name }}</h4>
            <small
              >{{ category.id === 'project' ? '项目负责人' : '客户经理' }} ·
              {{ row.owner }}</small
            >
          </aside>
          <div
            class="paper-grid"
            :style="{ '--paper-columns': Math.min(row.reports.length, 6) }"
          >
            <button
              v-for="report in row.reports"
              :key="report.id"
              class="paper-report"
              :class="{
                'is-submitted': report.status === 'submitted',
                'is-overdue': overdue(report),
              }"
              type="button"
              :aria-label="`${group.title} ${periodTitle(report)}，${cardStatus(report)}，${report.status === 'submitted' ? '查看预览' : '继续填写'}`"
              @click="emit('open', report)"
            >
              <span class="paper-status"
                ><Icon
                  :icon="
                    report.status === 'submitted'
                      ? 'lucide:circle-check'
                      : overdue(report)
                        ? 'lucide:clock-alert'
                        : 'lucide:clock-3'
                  "
                />{{ cardStatus(report) }}</span
              >
              <span class="paper-type">{{ group.title }}</span
              ><strong class="paper-period">{{ periodTitle(report) }}</strong
              ><span
                v-if="report.period !== 'day' && report.period !== 'month'"
                class="paper-year"
                >{{ dayjs(report.start).format('YYYY') }}</span
              >
              <span class="paper-divider"></span>
              <span class="paper-outline">{{ paperSummary(report) }}</span>
              <span class="paper-lines" aria-hidden="true"
                ><i></i><i></i><i></i
              ></span>
              <span class="paper-meta">{{
                report.status === 'submitted'
                  ? `提交于 ${report.submittedAt || report.end}`
                  : `截止 ${submissionDeadline(report).format('MM-DD HH:mm')}`
              }}</span>
              <span class="paper-action"
                >{{ report.status === 'submitted' ? '查看报告' : '继续填写'
                }}<Icon
                  :icon="
                    report.status === 'submitted'
                      ? 'lucide:arrow-up-right'
                      : 'lucide:arrow-right'
                  "
              /></span>
            </button>
          </div>
        </div>
        <div v-if="!group.rows.length" class="group-empty">
          {{
            search
              ? '没有匹配的报告对象，请调整搜索条件。'
              : '尚未添加填写对象，可通过右上方管理入口添加。'
          }}
        </div>
      </section>
      <div v-if="!groups.length" class="group-empty">
        管理员尚未开放该类别的报告。
      </div>
      <p class="hub-footnote">
        未到期与已超期按报告配置的提交截止时间判断；最后一次提交进入只读预览。更多记录请查看历史报告。
      </p>
    </template>
  </section>
</template>

<style scoped>
.report-hub {
  color: #243f36;
  container-type: inline-size;
}
.tone-green {
  --accent: #23785e;
  --soft: #eaf5ee;
  --edge: #bdd8c7;
}
.tone-blue {
  --accent: #2d6494;
  --soft: #edf4fc;
  --edge: #c2d6e9;
}
.tone-orange {
  --accent: #a36529;
  --soft: #fff3e5;
  --edge: #ebd2b5;
}
.tone-teal {
  --accent: #267b80;
  --soft: #ebf6f5;
  --edge: #bedbda;
}
.hub-heading,
.category-heading,
.category-toolbar,
.group-heading,
.category-top,
.category-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.hub-heading {
  margin: 4px 0 26px;
}
.eyebrow {
  font-size: 10px;
  letter-spacing: 2px;
  color: #6f887b;
}
.hub-heading h2,
.category-heading h2 {
  margin: 5px 0;
  font-size: 24px;
  font-weight: 650;
  letter-spacing: -0.5px;
}
.hub-heading p,
.category-heading p {
  margin: 0;
  font-size: 13px;
  color: #74877c;
}
.hub-history {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
}
.category-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}
.category-card {
  position: relative;
  overflow: hidden;
  text-align: left;
  padding: 23px;
  border: 1px solid var(--edge);
  border-radius: 16px;
  background:
    radial-gradient(ellipse at 100% 0%, #ffffffd9, transparent 68%),
    linear-gradient(150deg, var(--soft), #fff);
  color: #243f36;
  box-shadow: 0 4px 14px #28493406;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}
.category-card:hover {
  transform: translateY(-4px);
  border-color: var(--accent);
  box-shadow: 0 12px 30px #28493412;
}
.category-icon,
.category-heading-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: var(--accent);
  color: #fff;
  font-size: 24px;
  box-shadow: 0 4px 12px #213e3412;
}
.category-arrow {
  color: var(--accent);
  opacity: 0.65;
  font-size: 20px;
}
.category-card h3 {
  font-size: 20px;
  margin: 25px 0 10px;
  font-weight: 650;
}
.category-card p {
  color: #62776c;
  line-height: 1.8;
  font-size: 13px;
  margin: 0;
  min-height: 48px;
}
.category-types {
  display: block;
  font-size: 12px;
  color: var(--accent);
  margin: 17px 0;
}
.category-footer {
  border-top: 1px solid var(--edge);
  padding-top: 15px;
  font-size: 12px;
  color: #678073;
}
.category-footer > span:last-child {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--accent);
}
.category-footer b {
  color: var(--accent);
  font-size: 18px;
  margin-right: 3px;
  font-weight: 650;
}
.hub-footnote {
  font-size: 12px;
  color: #7a8c81;
  margin: 24px 0 0;
  line-height: 1.8;
}
.category-toolbar {
  background: #fff;
  border: 1px solid #dde7e1;
  border-radius: 12px;
  padding: 11px 15px;
  justify-content: flex-start;
  margin-bottom: 25px;
}
.category-back {
  display: grid;
  place-items: center;
  width: 34px;
  padding: 0;
}
.category-toolbar nav {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}
.category-toolbar nav button {
  border: 0;
  background: transparent;
  padding: 5px;
  color: #316e97;
  text-decoration: underline;
  text-underline-offset: 4px;
}
.category-toolbar nav > span:first-of-type {
  color: #a0b1a6;
}
.category-toolbar > .hub-history {
  margin-left: auto;
}
.category-heading {
  margin-bottom: 28px;
  flex-wrap: wrap;
}
.category-heading > div {
  display: flex;
  align-items: center;
  gap: 13px;
}
.category-heading h2 {
  font-size: 21px;
}
.category-heading-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  font-size: 21px;
}
.hub-search {
  width: 235px;
}
.report-group {
  margin: 0 0 28px;
  background: #f0f4f2;
  border: 1px solid #e0e8e2;
  border-radius: 14px;
  overflow: hidden;
}
.group-heading {
  padding: 17px 21px;
  background: #f8faf9;
  border-bottom: 1px solid #e0e8e2;
}
.group-heading h3 {
  font-size: 18px;
  font-weight: 650;
  margin: 0;
}
.group-heading > div,
.group-legend {
  display: flex;
  align-items: center;
  gap: 10px;
}
.group-heading :deep(.ant-btn) {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.group-legend {
  color: #74877b;
  font-size: 11px;
  gap: 6px;
}
.group-legend i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #6c91b2;
}
.group-legend .submitted-dot {
  background: #4c8a6d;
}
.group-legend .overdue-dot {
  background: #c66b57;
}
.object-report-row {
  padding: 22px;
}
.object-report-row + .object-report-row {
  border-top: 1px solid #dfe7e1;
}
.object-report-row.with-object {
  display: grid;
  grid-template-columns: 155px minmax(0, 1fr);
  gap: 22px;
}
.object-label {
  padding: 9px 10px 0 0;
}
.object-label > span {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  background: #fff;
  border: 1px solid var(--edge);
  color: var(--accent);
  border-radius: 9px;
  font-size: 17px;
}
.object-label h4 {
  font-size: 14px;
  font-weight: 600;
  margin: 12px 0 8px;
  line-height: 1.65;
  overflow-wrap: anywhere;
}
.object-label small {
  font-size: 11px;
  color: #758a7c;
}
.paper-grid {
  display: grid;
  grid-template-columns: repeat(var(--paper-columns), minmax(0, 190px));
  align-items: start;
  gap: 16px;
  min-width: 0;
}
.paper-report {
  position: relative;
  display: flex;
  flex-direction: column;
  aspect-ratio: 210/297;
  padding: 17px 16px 0;
  border: 1px solid #d4e0eb;
  border-top: 3px solid #789cbb;
  border-radius: 3px 11px 5px 5px;
  background: #fcfdff;
  box-shadow:
    0 2px 3px #243d3210,
    0 6px 16px #243d3207;
  color: #32483c;
  text-align: left;
  min-width: 0;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}
.paper-report::before {
  content: '';
  position: absolute;
  right: -1px;
  top: -3px;
  width: 18px;
  height: 18px;
  background: linear-gradient(225deg, #f0f4f2 50%, #e9e3d7 51%, #f7f4ed 100%);
  border-bottom-left-radius: 4px;
}
.paper-report:hover {
  transform: translateY(-4px);
  box-shadow:
    0 5px 7px #243d3210,
    0 12px 23px #243d3212;
}
.paper-report.is-submitted {
  background: #fff;
  border-color: #d1e0d5;
  border-top-color: #76a18a;
}
.paper-report.is-submitted::before {
  background: linear-gradient(225deg, #f0f4f2 50%, #d3e4da 51%, #f1f7f3 100%);
}
.paper-report.is-overdue {
  border-color: #ead4ce;
  border-top-color: #c87661;
  background: #fffcfa;
}
.paper-report.is-overdue::before {
  background: linear-gradient(225deg, #f0f4f2 50%, #ead4cc 51%, #fff2ec 100%);
}
.is-overdue .paper-status,
.is-overdue .paper-action {
  color: #a95340;
}
.paper-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #4e7596;
}
.is-submitted .paper-status {
  color: #42765a;
}
.paper-type {
  margin-top: 18px;
  font-size: 12px;
  color: #75867b;
}
.paper-period {
  font-size: 16px;
  font-weight: 650;
  margin-top: 4px;
  line-height: 1.55;
}
.paper-year {
  font-size: 10px;
  letter-spacing: 1px;
  color: #92a096;
}
.paper-divider {
  height: 1px;
  background: #e9e9e1;
  margin: 12px 0;
  flex-shrink: 0;
}
.paper-outline {
  font-size: 10px;
  color: #829187;
  white-space: pre-line;
  line-height: 1.8;
}
.paper-lines {
  display: grid;
  gap: 6px;
  margin: 12px 0;
}
.paper-lines i {
  height: 3px;
  border-radius: 2px;
  background: #eff0ea;
}
.paper-lines i:nth-child(2) {
  width: 85%;
}
.paper-lines i:last-child {
  width: 60%;
}
.paper-meta {
  margin-top: auto;
  font-size: 10px;
  color: #8a988f;
  line-height: 1.6;
  padding-bottom: 10px;
}
.paper-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-top: 1px solid #ecece4;
  font-size: 11px;
  color: #4e7596;
}
.is-submitted .paper-action {
  color: #49765d;
}
.group-empty {
  padding: 35px 24px;
  text-align: center;
  font-size: 13px;
  color: #758a7c;
}
button:focus-visible {
  outline: 2px solid #387e68;
  outline-offset: 4px;
}
@container (max-width:1100px) {
  .category-card {
    padding: 18px 16px;
  }
  .category-grid {
    gap: 12px;
  }
  .category-footer {
    flex-wrap: wrap;
    gap: 8px;
  }
  .object-report-row.with-object {
    grid-template-columns: 130px minmax(0, 1fr);
    gap: 16px;
  }
  .paper-grid {
    gap: 12px;
  }
  .paper-report {
    padding: 13px 12px 0;
  }
  .paper-period {
    font-size: 14px;
  }
}
@container (max-width:850px) {
  .paper-grid {
    grid-template-columns: repeat(3, minmax(0, 190px));
  }
  .object-report-row.with-object {
    display: block;
  }
  .object-label {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 0 16px;
  }
  .object-label h4 {
    margin: 0;
  }
  .paper-outline {
    font-size: 11px;
  }
}
@container (max-width:600px) {
  .category-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .paper-grid {
    grid-template-columns: repeat(2, minmax(0, 190px));
  }
  .category-heading > div {
    align-items: flex-start;
  }
  .category-heading p {
    max-width: 280px;
  }
  .category-heading {
    gap: 18px;
  }
  .group-legend {
    display: none;
  }
  .object-label small {
    display: none;
  }
  .hub-heading h2 {
    font-size: 22px;
  }
  .category-card {
    padding: 18px;
  }
  .category-footer {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }
  .object-report-row {
    padding: 16px;
  }
}
@container (max-width:380px) {
  .category-grid {
    grid-template-columns: 1fr;
  }
  .paper-grid {
    grid-template-columns: minmax(0, 190px);
  }
  .category-toolbar {
    gap: 8px;
  }
  .category-toolbar > .hub-history {
    font-size: 11px;
    padding: 0 6px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .category-card,
  .paper-report {
    transition: none;
  }
  .category-card:hover,
  .paper-report:hover {
    transform: none;
  }
}
</style>
