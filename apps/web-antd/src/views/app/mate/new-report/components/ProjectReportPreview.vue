<script setup lang="ts">
import type {
  BusinessReportProfile,
  BusinessReportEdits,
} from '#/types/business-report';
import type { ReportDraft } from '#/types/new-report';
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
import { periodLabel } from '#/utils/report-period';
import { simplifyProjectReport } from '#/api/mock-project-report';
import ReportMarkdown from './ReportMarkdown.vue';
const props = defineProps<{
  profile: BusinessReportProfile;
  edits: BusinessReportEdits;
  report: ReportDraft;
}>();
const content = computed(() =>
  simplifyProjectReport(
    props.profile,
    props.report.business?.objectId ?? 'engine',
    false,
  ),
);
const modules = computed(() =>
  content.value.blocks.filter(
    (block) =>
      block.id !== 'risks' ||
      block.summary.trim() ||
      props.edits.notes[block.id]?.trim(),
  ),
);
const filesFor = (id: string) =>
  props.report.attachments?.[`business-project-${id}`] ?? [];
const tasks = computed(() => content.value.taskRecords ?? []);
const periodName = computed(() =>
  props.report.period === 'month' ? '本月' : '本周',
);
const taskStats = computed(() => {
  const rows = tasks.value;
  const known = rows.length > 0;
  const periodKnown =
    known && rows.every((task) => task.periodPlanned !== undefined);
  const completed = rows.filter((task) => task.state === 'completed').length;
  const current = rows.filter(
    (task) =>
      task.periodPlanned || task.state !== 'completed' || task.nextPeriod,
  );
  const owners = new Set(
    current
      .map((task) => task.owner)
      .filter((owner) => owner && owner !== '待确认'),
  );
  return {
    known,
    completed,
    percent: known ? Math.round((completed / rows.length) * 100) : 0,
    metrics: [
      {
        label: `${periodName.value}完成`,
        value: periodKnown
          ? rows.filter(
              (task) => task.periodPlanned && task.state === 'completed',
            ).length
          : '待确认',
        unit: periodKnown ? '项' : '',
        icon: 'lucide:check-check',
        tone: 'green',
        hint: '本期计划任务的完成数',
      },
      {
        label: '任务总数',
        value: known ? rows.length : '待采集',
        unit: known ? '项' : '',
        icon: 'lucide:layers',
        tone: 'blue',
        hint: '项目累计纳入的任务',
      },
      {
        label: '累计完成',
        value: known ? completed : '待采集',
        unit: known ? '项' : '',
        icon: 'lucide:circle-check',
        tone: 'teal',
        hint: '截至本期已完成任务',
      },
      {
        label: '当前进度',
        value: known ? Math.round((completed / rows.length) * 100) : '待采集',
        unit: known ? '%' : '',
        icon: 'lucide:chart-no-axes-combined',
        tone: 'violet',
        hint: '按累计任务完成比例计算',
      },
      {
        label: `${periodName.value}参与人数`,
        value:
          periodKnown &&
          current.every((task) => task.owner && task.owner !== '待确认')
            ? owners.size
            : '待确认',
        unit:
          periodKnown &&
          current.every((task) => task.owner && task.owner !== '待确认')
            ? '人'
            : '',
        icon: 'lucide:users',
        tone: 'amber',
        hint: '本期任务与在办任务负责人去重',
      },
    ],
  };
});
const overview = computed(
  () =>
    content.value.conclusion ||
    `项目当前处于${content.value.phase}，本期进展、任务及需协调事项如下。`,
);
// Demo classification only labels risks already present in the report text.
const riskCategories = (text: string) => {
  const categories = [
    {
      label: '延期风险',
      icon: 'lucide:clock-alert',
      tone: 'delay',
      match: /延期|延后|超期|超时|推迟|延误/,
    },
    {
      label: '资源短缺风险',
      icon: 'lucide:user-round-minus',
      tone: 'shortage',
      match:
        /资源不足|资源短缺|人手不足|人员不足|缺少人员|缺人|人力不足|产能不足/,
    },
    {
      label: '资源协调',
      icon: 'lucide:users-round',
      tone: 'resource',
      match: /增派|调配|支援|增援|协调.{0,12}(工程师|人员|资源|人力)|资源协调/,
    },
    {
      label: '外部协同',
      icon: 'lucide:handshake',
      tone: 'coordination',
      match: /客户.{0,12}(确认|配合|协调)|协调客户|客户经理|外部依赖|供应商/,
    },
    {
      label: '质量风险',
      icon: 'lucide:shield-alert',
      tone: 'quality',
      match: /质量|缺陷|故障|测试不通过|验收不通过/,
    },
  ].filter((category) => category.match.test(text));
  return categories.length
    ? categories
    : [{ label: '风险与协调', icon: 'lucide:flag', tone: 'coordination' }];
};
</script>
<template>
  <article
    class="project-final-report"
    :class="`presentation-${report.presentation ?? 'classic'}`"
  >
    <header>
      <span
        ><Icon icon="lucide:folder-kanban" />项目{{
          periodLabel(report.period ?? 'week')
        }}</span
      >
      <h1>{{ content.name }}</h1>
      <p>
        {{ report.start }} — {{ report.end }} · 项目经理 {{ content.manager }}
      </p>
      <strong class="project-phase-tag">{{ content.phase }}</strong>
      <div class="project-overview">
        <span><Icon icon="lucide:sparkles" />本期概述</span>
        <p>{{ overview }}</p>
      </div>
    </header>
    <div class="project-metric-grid">
      <div
        v-for="metric in taskStats.metrics"
        :key="metric.label"
        :class="['project-metric', metric.tone]"
      >
        <div class="metric-label">
          <span>{{ metric.label }}</span
          ><Icon :icon="metric.icon" />
        </div>
        <div class="metric-value">
          <strong>{{ metric.value }}</strong
          ><small>{{ metric.unit }}</small>
        </div>
        <p>{{ metric.hint }}</p>
      </div>
    </div>
    <section
      v-for="block in modules"
      :key="block.id"
      :class="['project-preview-module', block.tone]"
    >
      <h2><Icon :icon="block.icon" />{{ block.title }}</h2>
      <div v-if="block.id === 'delivery'" class="stage-dashboard">
        <div class="stage-heading">
          <span>项目阶段</span><strong>{{ content.phase }}</strong>
        </div>
        <ol
          v-if="content.stageIndex >= 0 && content.stages.length"
          class="stage-track"
        >
          <li
            v-for="(stage, index) in content.stages"
            :key="stage"
            :class="{
              done: index < content.stageIndex,
              current: index === content.stageIndex,
            }"
          >
            <span class="stage-point"
              ><Icon
                :icon="
                  index < content.stageIndex
                    ? 'lucide:check'
                    : index === content.stageIndex
                      ? 'lucide:map-pin'
                      : 'lucide:circle'
                "
            /></span>
            <strong>{{ stage }}</strong
            ><small>{{
              index < content.stageIndex
                ? '已完成'
                : index === content.stageIndex
                  ? '当前阶段'
                  : '待推进'
            }}</small>
          </li>
        </ol>
        <div v-if="taskStats.known" class="project-progress">
          <span
            >累计任务完成
            <b>{{ taskStats.completed }} / {{ tasks.length }}</b></span
          >
          <div class="progress-track">
            <i :style="{ width: `${taskStats.percent}%` }" />
          </div>
          <strong>{{ taskStats.percent }}%</strong>
        </div>
        <div v-if="content.milestones.length" class="milestone-list">
          <article
            v-for="milestone in content.milestones"
            :key="milestone.title"
            :class="{
              warning: /风险|延期/.test(milestone.status),
              complete: milestone.status === '已完成',
            }"
          >
            <Icon
              :icon="
                milestone.status === '已完成'
                  ? 'lucide:circle-check'
                  : /风险|延期/.test(milestone.status)
                    ? 'lucide:triangle-alert'
                    : 'lucide:flag'
              "
            />
            <div>
              <strong>{{ milestone.title }}</strong
              ><small>计划 {{ milestone.planned }}</small>
              <p>{{ milestone.actual }}</p>
            </div>
            <span>{{ milestone.status }}</span>
          </article>
        </div>
      </div>
      <template v-if="block.id === 'risks'">
        <div class="risk-card-list">
          <article
            v-for="item in block.items"
            :key="item.id"
            class="risk-detail-card"
          >
            <div class="risk-category-row">
              <span
                v-for="category in riskCategories(
                  `${item.title} ${item.detail}`,
                )"
                :key="category.label"
                :class="['risk-category', category.tone]"
              >
                <Icon :icon="category.icon" aria-hidden="true" />{{
                  category.label
                }}
              </span>
              <span v-if="item.status" class="risk-state">{{
                item.status
              }}</span>
            </div>
            <h3>{{ item.title }}</h3>
            <ReportMarkdown :text="item.detail" />
            <span v-if="item.owner" class="risk-owner"
              ><Icon icon="lucide:user-round" aria-hidden="true" />跟进人：{{
                item.owner
              }}</span
            >
          </article>
        </div>
        <div
          v-if="block.summary.trim()"
          :class="{ 'risk-context': block.items.length }"
        >
          <span v-if="block.items.length" class="risk-context-label"
            >整体影响与应对</span
          >
          <div v-else class="risk-category-row">
            <span
              v-for="category in riskCategories(block.summary)"
              :key="category.label"
              :class="['risk-category', category.tone]"
              ><Icon :icon="category.icon" aria-hidden="true" />{{
                category.label
              }}</span
            >
          </div>
          <ReportMarkdown :text="block.summary" />
        </div>
      </template>
      <ReportMarkdown v-else :text="block.summary" />
      <div v-if="edits.notes[block.id]" class="project-preview-note">
        <span>项目经理补充</span
        ><ReportMarkdown :text="edits.notes[block.id]!" />
      </div>
      <details
        v-if="block.items.length && block.id !== 'risks'"
        class="project-preview-records"
      >
        <summary>
          {{ block.id === 'tasks' ? '任务明细与负责人' : '关联记录' }} ·
          {{ block.items.length }} 条
        </summary>
        <article v-for="item in block.items" :key="item.id">
          <strong>{{ item.title }}</strong
          ><small v-if="item.owner"
            >负责人：{{ item.owner }} · {{ item.status }}</small
          >
          <p>{{ item.detail }}</p>
        </article>
      </details>
      <div v-if="filesFor(block.id).length" class="project-preview-files">
        <a
          v-for="file in filesFor(block.id)"
          :key="file.id"
          :href="file.url"
          :download="file.name"
          ><Icon icon="lucide:paperclip" />{{ file.name }}</a
        >
      </div>
    </section>
    <footer>按项目原始数据与项目经理补充整理 · V{{ report.version }}</footer>
  </article>
</template>
<style scoped>
.project-final-report {
  max-width: 1088px;
  margin: auto;
  background: #f2f6f3;
  padding: 24px;
  border: 1px solid #e0e8e2;
  border-radius: 14px;
  color: #2d4937;
}
.project-final-report > header {
  position: relative;
  padding: 28px;
  border: 1px solid #d8e7dd;
  border-radius: 12px;
  background: linear-gradient(130deg, #eef7f1, #e0eee5);
  margin-bottom: 18px;
}
.project-final-report header > span {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: #5b8068;
}
.project-final-report h1 {
  font-size: 28px;
  margin: 12px 0 8px;
  color: #294e36;
}
.project-final-report header p {
  font-size: 13px;
  color: #718579;
  margin: 0;
}
.project-phase-tag {
  display: inline-block;
  margin-top: 14px;
  background: #fff9;
  color: #3c7450;
  border-radius: 6px;
  padding: 4px 9px;
  font-size: 12px;
}
.project-overview {
  margin-top: 20px;
  padding: 16px 18px;
  background: #ffffffb8;
  border: 1px solid #ffffff;
  border-radius: 10px;
}
.project-overview > span {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #36755a;
  font-size: 12px;
  font-weight: 700;
}
.project-final-report .project-overview p {
  margin-top: 8px;
  line-height: 1.9;
  color: #3d5e4c;
  font-size: 14px;
}
.project-metric-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  margin: 18px 0 24px;
}
.project-metric {
  --metric-color: #278260;
  --metric-tint: #eef8f2;
  padding: 16px 14px;
  border: 1px solid #e1e9e4;
  border-radius: 12px;
  background: linear-gradient(150deg, #fff 40%, var(--metric-tint));
  box-shadow: 0 3px 12px #264c3705;
}
.project-metric.blue {
  --metric-color: #4978b7;
  --metric-tint: #eef4fd;
}
.project-metric.teal {
  --metric-color: #218c91;
  --metric-tint: #ecf8f8;
}
.project-metric.violet {
  --metric-color: #8068ab;
  --metric-tint: #f4f0fb;
}
.project-metric.amber {
  --metric-color: #a2772c;
  --metric-tint: #fcf6e9;
}
.metric-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 5px;
  font-size: 12px;
  color: #657a6e;
}
.metric-label svg {
  color: var(--metric-color);
  background: var(--metric-tint);
  border-radius: 8px;
  padding: 6px;
  width: 29px;
  height: 29px;
  flex-shrink: 0;
}
.metric-value {
  display: flex;
  align-items: baseline;
  gap: 5px;
  margin-top: 13px;
}
.metric-value strong {
  color: var(--metric-color);
  font-size: 29px;
  font-variant-numeric: tabular-nums;
  letter-spacing: -1px;
  line-height: 1.2;
}
.metric-value small {
  color: #809185;
  font-size: 12px;
}
.project-metric p {
  margin: 8px 0 0;
  color: #8a998f;
  font-size: 10px;
  line-height: 1.6;
}
.stage-dashboard {
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #e2ece5;
  border-radius: 12px;
  background: #f6faf7;
}
.stage-heading {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  color: #809185;
}
.stage-heading strong {
  color: #327650;
}
.stage-track {
  display: flex;
  list-style: none;
  margin: 24px 0;
  padding: 0;
}
.stage-track li {
  position: relative;
  flex: 1;
  text-align: center;
  color: #9ba99f;
  min-width: 0;
}
.stage-track li:not(:last-child)::after {
  content: '';
  position: absolute;
  height: 2px;
  background: #dce7df;
  top: 17px;
  left: calc(50% + 22px);
  width: calc(100% - 44px);
}
.stage-track li.done::after {
  background: #85b79a;
}
.stage-point {
  display: flex;
  position: relative;
  z-index: 1;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin: 0 auto 10px;
  border-radius: 50%;
  background: #e9eeeb;
  font-size: 16px;
}
.stage-track .done .stage-point {
  background: #dceee3;
  color: #39865a;
}
.stage-track .current .stage-point {
  background: #347f5e;
  color: white;
  box-shadow: 0 0 0 5px #e1eee6;
}
.stage-track strong {
  display: block;
  font-size: 12px;
}
.stage-track small {
  display: block;
  margin-top: 5px;
  font-size: 10px;
}
.stage-track .current strong,
.stage-track .done strong {
  color: #326044;
}
.project-progress {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 11px;
  color: #73897b;
}
.project-progress > span {
  white-space: nowrap;
}
.project-progress b {
  margin-left: 6px;
  color: #3b7152;
}
.progress-track {
  height: 7px;
  flex: 1;
  border-radius: 10px;
  background: #e2ece5;
  overflow: hidden;
}
.progress-track i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #80b499, #378865);
  border-radius: inherit;
}
.milestone-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 20px;
}
.milestone-list article {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 13px;
  border: 1px solid #e3eae5;
  border-radius: 9px;
  background: white;
}
.milestone-list article > svg {
  flex-shrink: 0;
  margin-top: 2px;
  color: #8a9e92;
}
.milestone-list article > div {
  flex: 1;
  min-width: 0;
}
.milestone-list strong {
  display: block;
  font-size: 12px;
  color: #41634d;
}
.milestone-list small {
  display: block;
  font-size: 10px;
  color: #8a998e;
  margin-top: 6px;
}
.milestone-list p {
  font-size: 11px;
  color: #6a8173;
  margin: 4px 0 0;
}
.milestone-list article > span {
  font-size: 10px;
  padding: 3px 6px;
  border-radius: 5px;
  background: #f0f4f1;
  white-space: nowrap;
}
.milestone-list .complete > svg {
  color: #3d9162;
}
.milestone-list .warning {
  background: #fffbf2;
  border-color: #eddfbf;
}
.milestone-list .warning > svg,
.milestone-list .warning > span {
  color: #ac7b25;
}
.project-preview-module :deep(table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.project-preview-module :deep(th) {
  background: #edf4ef;
  color: #587461;
  padding: 11px 12px;
}
.project-preview-module :deep(td) {
  padding: 11px 12px;
  border-color: #e2ebe5;
}
.project-preview-module :deep(blockquote) {
  background: #f3f8f4;
  border-left-color: #8db79c;
  border-radius: 0 8px 8px 0;
}
.project-preview-module {
  padding: 22px;
  margin-top: 16px;
  background: white;
  border: 1px solid #dfe8e1;
  border-radius: 12px;
}
.project-preview-module h2 {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 17px;
  margin: 0 0 14px;
  color: #31553d;
}
.project-preview-module h2 svg {
  font-size: 20px;
  color: #5e9170;
}
.project-preview-module.risk {
  border-color: #e9dcc2;
  background: #fffdf7;
}
.risk-card-list {
  display: grid;
  gap: 12px;
}
.risk-detail-card {
  padding: 18px;
  border: 1px solid #eee2c9;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 3px 12px #74501b05;
  break-inside: avoid;
}
.risk-category-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 12px;
}
.risk-category {
  --risk-ink: #436d96;
  --risk-bg: #edf4fc;
  display: inline-flex;
  gap: 7px;
  align-items: center;
  padding: 6px 10px;
  border-radius: 8px;
  background: var(--risk-bg);
  color: var(--risk-ink);
  font-size: 12px;
  font-weight: 700;
}
.risk-category svg {
  width: 17px;
  height: 17px;
  flex-shrink: 0;
}
.risk-category.delay {
  --risk-ink: #a3611a;
  --risk-bg: #fff3de;
}
.risk-category.shortage {
  --risk-ink: #af5147;
  --risk-bg: #fceeea;
}
.risk-category.resource {
  --risk-ink: #7760a1;
  --risk-bg: #f2eefb;
}
.risk-category.quality {
  --risk-ink: #a54f6a;
  --risk-bg: #fbeef3;
}
.risk-state {
  margin-left: auto;
  font-size: 12px;
  color: #897044;
}
.risk-detail-card h3 {
  margin: 0 0 8px;
  color: #634f2e;
  font-size: 15px;
  font-weight: 700;
}
.risk-detail-card :deep(p) {
  margin: 6px 0;
  line-height: 1.85;
}
.risk-owner {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  color: #7b806d;
  font-size: 12px;
}
.risk-context {
  margin-top: 16px;
  padding: 12px 15px;
  border-radius: 9px;
  background: #f8f4ea;
}
.risk-context-label {
  color: #88724b;
  font-size: 12px;
  font-weight: 600;
}
.project-preview-module.plan {
  background: #f8fbff;
  border-color: #dce6f0;
}
.project-preview-note {
  margin-top: 14px;
  padding: 12px 14px;
  background: #f5f8f5;
  border-left: 3px solid #bad3c3;
  border-radius: 0 7px 7px 0;
}
.project-preview-note > span {
  font-size: 12px;
  color: #6e8676;
}
.project-preview-records {
  margin-top: 16px;
  border-top: 1px solid #e6ece7;
  padding-top: 12px;
  font-size: 12px;
  color: #678270;
}
.project-preview-records summary {
  cursor: pointer;
}
.project-preview-records article {
  padding: 12px 0;
  border-bottom: 1px solid #eef2ee;
}
.project-preview-records strong {
  font-size: 13px;
  color: #3e6048;
}
.project-preview-records small {
  display: block;
  margin-top: 4px;
}
.project-preview-records p {
  line-height: 1.8;
  margin: 5px 0 0;
}
.project-preview-files {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 12px;
}
.project-preview-files a {
  display: flex;
  gap: 5px;
  align-items: center;
  color: #4f805d;
  font-size: 12px;
}
.project-final-report footer {
  text-align: center;
  color: #859488;
  font-size: 12px;
  margin-top: 20px;
}
.presentation-executive > header {
  background: linear-gradient(130deg, #eef3fc, #dce7f7);
  border-color: #d7e1ee;
}
.presentation-warm > header {
  background: linear-gradient(130deg, #fff8ec, #efe3cb);
  border-color: #e9dcc3;
}
@media (max-width: 700px) {
  .project-metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .project-metric-grid > :last-child {
    grid-column: 1 / -1;
  }
  .milestone-list {
    grid-template-columns: 1fr;
  }
  .stage-dashboard {
    padding: 14px 10px;
  }
  .stage-track strong {
    font-size: 10px;
  }
  .project-progress {
    flex-wrap: wrap;
  }
  .project-final-report {
    padding: 14px;
  }
  .project-preview-module {
    padding: 16px;
  }
}
</style>
