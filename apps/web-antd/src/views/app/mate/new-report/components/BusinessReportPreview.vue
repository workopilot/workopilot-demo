<script setup lang="ts">
import type {
  BusinessReportProfile,
  BusinessReportEdits,
} from '#/types/business-report';
import type { ReportDraft } from '#/types/new-report';
import { periodLabel } from '#/utils/report-period';
import { computed } from 'vue';
import { businessQuantities } from '#/api/mock-business-report-config';
import { Icon } from '@iconify/vue';
import ReportMarkdown from './ReportMarkdown.vue';
import CustomerReportContent from './CustomerReportContent.vue';
const props = defineProps<{
  profile: BusinessReportProfile;
  edits: BusinessReportEdits;
  report: ReportDraft;
  audience?: 'internal' | 'customer';
}>();
const external = computed(
  () => props.profile.kind === 'customer' && props.audience === 'customer',
);
const quantities = computed(() =>
  businessQuantities(
    props.profile,
    props.report.business?.objectId ??
      (props.profile.kind === 'project' ? 'engine' : 'huachen'),
  ),
);
const progress = computed(() =>
  props.profile.progress
    ? Math.round(
        (props.profile.progress.done / props.profile.progress.total) * 100,
      )
    : 0,
);
const serviceTotal = computed(
  () =>
    (props.profile.service?.resolved ?? 0) + (props.profile.service?.open ?? 0),
);
const files = computed(() =>
  Object.entries(props.report.attachments ?? {})
    .filter(([key]) => key.startsWith(`business-${props.profile.id}-`))
    .flatMap(([, items]) => items),
);
</script>
<template>
  <CustomerReportContent
    v-if="profile.kind === 'customer'"
    :profile="profile"
    :edits="edits"
    :report="report"
    mode="preview"
    :external="external"
  />
  <article
    v-else
    class="business-preview"
    :class="`presentation-${report.presentation ?? 'classic'}`"
  >
    <header class="business-cover">
      <div class="cover-meta">
        <span
          ><Icon
            :icon="
              profile.kind === 'project'
                ? 'lucide:folder-kanban'
                : 'lucide:building-2'
            "
          />{{
            profile.kind === 'project' ? '项目进展报告' : '客户服务与交付报告'
          }}</span
        ><span v-if="external">{{
          report.customerApproval?.status === 'approved'
            ? '已审批 · 对外版本'
            : '未审批草稿 · 仅供核对'
        }}</span
        ><span v-else>{{
          report.status === 'submitted' ? '已提交 · 内容锁定' : '报告预览'
        }}</span>
      </div>
      <h1>
        {{ profile.name
        }}<small>{{
          `${profile.kind === 'project' ? '项目' : '客户'}${periodLabel(report.period ?? (profile.kind === 'project' ? 'week' : 'month'))}`
        }}</small>
      </h1>
      <p>
        <Icon icon="lucide:calendar-days" />{{ report.start }} — {{ report.end
        }}<span>·</span>{{ profile.role }}：{{ profile.manager }}
      </p>
      <div class="cover-conclusion">
        <span class="cover-status" :class="{ warning: edits.health !== '正常' }"
          ><Icon
            :icon="
              edits.health === '正常'
                ? 'lucide:circle-check'
                : 'lucide:triangle-alert'
            "
          />{{ edits.health }}</span
        ><strong>{{ profile.phase }}</strong>
        <p>{{ profile.conclusion }}</p>
      </div>
      <div v-if="edits.conclusion && !external" class="manager-note">
        <strong>{{ profile.role }}补充判断</strong
        ><ReportMarkdown :text="edits.conclusion" />
      </div>
    </header>
    <section
      class="business-metrics"
      v-if="quantities.length"
      aria-label="核心业务指标"
    >
      <div v-for="metric in quantities" :key="metric.label">
        <Icon :icon="metric.icon" /><span>{{ metric.label }}</span
        ><strong>{{ metric.value }}</strong
        ><small>{{ metric.hint }}</small>
      </div>
    </section>
    <div v-if="profile.service" class="business-secondary-metrics">
      <span v-for="item in profile.metrics" :key="item.label"
        >{{ item.label }} <strong>{{ item.value }}</strong></span
      >
    </div>
    <section class="business-phase" aria-label="阶段与推进情况">
      <div class="preview-title">
        <h2>
          <Icon icon="lucide:route" />{{
            profile.kind === 'project'
              ? '当前阶段与交付路径'
              : '客户项目所处阶段'
          }}
        </h2>
        <span>{{ profile.phase }}</span>
      </div>
      <ol class="stage-track">
        <li
          v-for="(stage, index) in profile.stages"
          :key="stage"
          :class="{
            done: index < profile.stageIndex,
            current: index === profile.stageIndex,
          }"
        >
          <span
            ><Icon
              :icon="
                index < profile.stageIndex
                  ? 'lucide:check'
                  : index === profile.stageIndex
                    ? 'lucide:map-pin'
                    : 'lucide:circle'
              " /></span
          ><strong>{{ stage }}</strong
          ><small>{{
            index < profile.stageIndex
              ? '已推进'
              : index === profile.stageIndex
                ? '当前阶段'
                : '后续阶段'
          }}</small>
        </li>
      </ol>
      <div v-if="profile.progress" class="business-progress">
        <div>
          <b>{{ profile.progress.label }}</b
          ><span
            >{{ profile.progress.done }} / {{ profile.progress.total }}</span
          >
        </div>
        <div
          class="progress-track"
          role="img"
          :aria-label="`${profile.progress.label}，${profile.progress.done}/${profile.progress.total}`"
        >
          <i :style="{ width: progress + '%' }" />
        </div>
        <small
          >仅表示{{
            profile.progress.label.replace('情况', '')
          }}，不等同于项目整体进度或最终验收。</small
        >
      </div>
      <div v-if="profile.service" class="service-chart">
        <div class="service-close">
          <strong
            >{{ profile.service.resolved
            }}<small> / {{ serviceTotal }}</small></strong
          ><span>本期问题已解决</span>
          <div class="progress-track">
            <i
              :style="{
                width:
                  (serviceTotal ? profile.service.resolved / serviceTotal : 0) *
                    100 +
                  '%',
              }"
            />
          </div>
          <p>剩余 {{ profile.service.open }} 个问题持续跟进</p>
        </div>
        <div class="service-categories">
          <h3>本期受理问题分布</h3>
          <div
            v-for="category in profile.service.categories"
            :key="category.label"
          >
            <span>{{ category.label }}</span>
            <div>
              <i
                :style="{ width: (category.count / serviceTotal) * 100 + '%' }"
              />
            </div>
            <b>{{ category.count }} 个</b>
          </div>
          <small
            >各分类合计 {{ serviceTotal }} 个，包含已解决与未闭环问题。</small
          >
        </div>
      </div>
      <div
        v-if="profile.kind === 'project' && edits.forecast"
        class="forecast-note"
      >
        <Icon icon="lucide:calendar-clock" />项目经理预计验收：<strong>{{
          edits.forecast
        }}</strong
        ><span>预测不自动修改项目基线</span>
      </div>
    </section>
    <section v-if="profile.milestones.length" class="milestone-sheet">
      <div class="preview-title">
        <h2>
          <Icon icon="lucide:milestone" />{{
            profile.kind === 'project' ? '关键里程碑' : '交付承诺与完成情况'
          }}
        </h2>
      </div>
      <div
        class="milestone-table"
        role="table"
        aria-label="里程碑计划与实际对照"
      >
        <div role="row" class="milestone-head">
          <span role="columnheader">里程碑</span
          ><span role="columnheader">原计划</span
          ><span role="columnheader">实际 / 预测</span
          ><span role="columnheader">状态</span>
        </div>
        <div v-for="item in profile.milestones" :key="item.title" role="row">
          <strong role="cell">{{ item.title }}</strong
          ><span role="cell">{{ item.planned }}</span
          ><span role="cell">{{ item.actual }}</span
          ><span
            role="cell"
            class="milestone-status"
            :class="{ warning: /风险|延后|待闭环/.test(item.status) }"
            >{{ item.status }}</span
          >
        </div>
      </div>
    </section>
    <section
      v-for="block in profile.blocks"
      :key="block.id"
      :id="`business-preview-${block.id}`"
      class="business-output"
      :class="block.tone"
    >
      <div class="preview-title">
        <h2><Icon :icon="block.icon" />{{ block.title }}</h2>
        <span v-if="block.id === 'outcomes'">成果与价值</span>
      </div>
      <p class="block-summary">{{ block.summary }}</p>
      <div v-if="block.metrics?.length" class="business-metrics">
        <div v-for="item in block.metrics" :key="item.label">
          <Icon :icon="item.icon" /><span>{{ item.label }}</span
          ><strong>{{ item.value }}</strong
          ><small>{{ item.hint }}</small>
        </div>
      </div>
      <div class="business-output-grid">
        <article v-for="item in block.items" :key="item.id">
          <div class="output-card-head">
            <Icon :icon="block.icon" /><span>{{ item.status }}</span>
          </div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.detail }}</p>
          <div v-if="!external" class="evidence-caption">
            <Icon icon="lucide:paperclip" /><span>{{ item.evidence }}</span>
          </div>
        </article>
      </div>
      <div
        v-if="edits.notes[block.id] && !external"
        class="business-review-note"
      >
        <strong>{{ profile.role }}补充</strong
        ><ReportMarkdown :text="edits.notes[block.id]!" />
      </div>
      <div v-if="edits.customerNotes?.[block.id]" class="business-review-note">
        <strong>{{ external ? '补充说明' : '对客补充' }}</strong
        ><ReportMarkdown :text="edits.customerNotes[block.id]!" />
      </div>
    </section>
    <section v-if="files.length" class="business-files">
      <h2><Icon icon="lucide:files" />附件与交付依据</h2>
      <a
        v-for="file in files"
        :key="file.id"
        :href="file.url"
        :download="file.name"
        ><Icon icon="lucide:file-text" />{{ file.name
        }}<Icon icon="lucide:download"
      /></a>
    </section>
    <footer>
      <Icon icon="lucide:shield-check" />{{ profile.role }}核对后分发 ·
      本报告仅覆盖当前{{
        profile.kind === 'project' ? '项目' : '客户及其已关联项目'
      }}
      · 示例业务数据
    </footer>
  </article>
</template>
<style scoped>
.presentation-executive .business-cover {
  background: #eaf0fa;
  border-color: #d6e1f1;
}
.presentation-executive .business-cover h1 {
  color: #254b7a;
}
.presentation-executive .cover-conclusion {
  background: #dfe9f7;
  border-color: #cddced;
}
.presentation-executive .business-metrics > div {
  background: #f2f6fc;
}
.presentation-warm .business-cover {
  background: #fbf3e5;
  border-color: #eddfc5;
}
.presentation-warm .business-cover h1 {
  color: #79582b;
}
.presentation-warm .cover-conclusion {
  background: #f4e8d2;
  border-color: #e7d6b6;
}
.presentation-warm .business-metrics > div {
  background: #fdf8ef;
}
.business-secondary-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 20px;
  padding: 0 0 20px;
  color: #61796b;
  font-size: 12px;
}
.business-secondary-metrics strong {
  margin-left: 6px;
  color: #2c5b41;
}
.business-preview {
  container-type: inline-size;
  background: #f2f6f5;
  border: 1px solid #dfe8e3;
  border-radius: 16px;
  padding: 24px;
  color: #263e34;
  font-size: 14px;
  line-height: 1.75;
  overflow-wrap: anywhere;
}
.business-cover {
  padding: 0 2px 20px;
}
.cover-meta,
.cover-meta > span:first-child {
  display: flex;
  align-items: center;
  gap: 8px;
}
.cover-meta {
  justify-content: space-between;
  font-size: 12px;
  color: #587465;
}
.business-cover h1 {
  font-size: 25px;
  font-weight: 600;
  margin: 14px 0 10px;
  line-height: 1.5;
}
.business-cover h1 small {
  display: block;
  font-size: 15px;
  color: #667c6f;
  font-weight: 400;
  margin-top: 4px;
}
.business-cover > p {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #66796e;
}
.cover-conclusion {
  margin-top: 20px;
  padding: 18px;
  background: #e5efe9;
  border: 1px solid #d4e4da;
  border-radius: 12px;
}
.cover-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: white;
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 12px;
  color: #31785b;
  margin-right: 10px;
}
.warning {
  color: #966b22 !important;
}
.cover-conclusion > strong {
  font-size: 13px;
}
.cover-conclusion p {
  margin: 10px 0 0;
  color: #405e4d;
}
.manager-note {
  margin-top: 14px;
  background: white;
  border-radius: 10px;
  padding: 14px;
}
.manager-note > strong,
.business-review-note > strong {
  display: block;
  font-size: 12px;
  color: #637c6a;
  margin-bottom: 6px;
}
.business-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin: 0 0 20px;
}
.business-metrics > div {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  background: white;
  border: 1px solid #e1e9e4;
  border-radius: 11px;
  padding: 14px;
  gap: 7px;
}
.business-metrics svg {
  font-size: 21px;
  color: #43816a;
}
.business-metrics span {
  font-size: 12px;
  color: #657b6c;
}
.business-metrics strong {
  font-size: 20px;
  line-height: 1.35;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.business-metrics small {
  font-size: 11px;
  color: #718277;
}
.business-phase,
.milestone-sheet,
.business-files {
  background: white;
  padding: 20px;
  border: 1px solid #e0e9e4;
  border-radius: 13px;
  margin-bottom: 20px;
}
.preview-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 16px;
}
h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}
h2 svg {
  color: #478167;
  font-size: 19px;
  flex: none;
}
.preview-title > span {
  font-size: 11px;
  color: #607f6b;
}
.stage-track {
  display: flex;
  list-style: none;
  padding: 0;
  margin: 0 0 20px;
}
.stage-track li {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  text-align: center;
  gap: 5px;
}
.stage-track li:before {
  content: '';
  position: absolute;
  top: 15px;
  left: -50%;
  width: 100%;
  height: 2px;
  background: #e5ece8;
}
.stage-track li:first-child:before {
  display: none;
}
.stage-track li > span {
  position: relative;
  display: grid;
  place-items: center;
  background: #f1f4f2;
  border: 1px solid #dfe8e2;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: #a0ada4;
}
.stage-track .done > span,
.stage-track .current > span {
  color: #337c5a;
  background: #e7f2eb;
  border-color: #adcbb7;
}
.stage-track .current > span {
  background: #387e60;
  color: white;
}
.stage-track .done:before,
.stage-track .current:before {
  background: #b5d2c0;
}
.stage-track strong {
  font-size: 12px;
  font-weight: 500;
}
.stage-track small {
  font-size: 10px;
  color: #809084;
}
.business-progress {
  background: #f6f9f7;
  border-radius: 9px;
  padding: 14px;
}
.business-progress > div:first-child {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
}
.progress-track {
  height: 8px;
  background: #e7eee9;
  border-radius: 10px;
  overflow: hidden;
  margin: 10px 0;
}
.progress-track > i {
  display: block;
  height: 100%;
  background: #438b6a;
  border-radius: 10px;
}
.business-progress > small,
.service-categories > small {
  font-size: 11px;
  color: #748578;
}
.forecast-note {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
  padding-top: 16px;
  font-size: 12px;
  color: #577260;
}
.forecast-note > span {
  font-size: 11px;
  color: #7b8b7f;
}
.service-chart {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
  gap: 20px;
  border-top: 1px solid #e7ede9;
  padding-top: 16px;
}
.service-close {
  display: flex;
  flex-direction: column;
}
.service-close > strong {
  font-size: 30px;
  font-weight: 600;
  line-height: 1.4;
}
.service-close strong small {
  font-size: 16px;
  font-weight: 400;
  color: #8b9b90;
}
.service-close > span,
.service-close p {
  font-size: 12px;
  color: #6a8071;
}
.service-close p {
  margin: 0;
}
.service-categories h3 {
  font-size: 13px;
  font-weight: 500;
  margin: 0 0 12px;
}
.service-categories > div {
  display: grid;
  grid-template-columns: 85px minmax(0, 1fr) 40px;
  gap: 10px;
  align-items: center;
  font-size: 12px;
  margin-bottom: 10px;
}
.service-categories > div > div {
  height: 7px;
  background: #eef2ef;
  border-radius: 3px;
}
.service-categories i {
  display: block;
  height: 100%;
  background: #79a38d;
  border-radius: 3px;
}
.service-categories b {
  font-weight: 500;
  text-align: right;
}
.milestone-table {
  overflow-x: auto;
}
.milestone-table > div {
  display: grid;
  grid-template-columns: 1.1fr 1fr 1.35fr 0.8fr;
  gap: 12px;
  min-width: 520px;
  padding: 12px 0;
  border-bottom: 1px solid #edf1ee;
  font-size: 12px;
}
.milestone-table > div:last-child {
  border-bottom: 0;
}
.milestone-table strong {
  font-weight: 500;
}
.milestone-head {
  color: #839186;
  font-size: 11px !important;
}
.milestone-status {
  color: #3b7f5f;
}
.business-output {
  background: #e8efeb;
  padding: 20px;
  border: 1px solid #dbe6df;
  border-radius: 13px;
  margin-bottom: 20px;
}
.business-output.risk {
  background: #faf3e6;
  border-color: #ecdfc4;
}
.business-output.plan {
  background: #edf2f8;
  border-color: #dce6ef;
}
.business-output.risk h2 svg {
  color: #9a742f;
}
.business-output.plan h2 svg {
  color: #567c9d;
}
.block-summary {
  color: #5d7465;
  font-size: 13px;
  margin: 0 0 16px;
}
.business-output-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.business-output-grid > article {
  background: #fff;
  border: 1px solid #e3eae6;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 3px 12px #2a4c3505;
}
.output-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
  color: #65806e;
}
.output-card-head > svg {
  font-size: 21px;
  color: #44836b;
}
.output-card-head span {
  background: #f0f5f1;
  border-radius: 5px;
  padding: 2px 6px;
}
.business-output h3 {
  font-size: 14px;
  font-weight: 600;
  margin: 10px 0;
}
.business-output article > p {
  font-size: 13px;
  color: #637769;
  margin: 0;
}
.evidence-caption {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  border-top: 1px solid #eef2ef;
  padding-top: 10px;
  margin-top: 12px;
  color: #859389;
  font-size: 10px;
}
.evidence-caption svg {
  flex: none;
  margin-top: 4px;
}
.business-review-note {
  background: #ffffffbd;
  border-radius: 9px;
  padding: 15px;
  margin-top: 14px;
}
.business-files a {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #3a785a;
  font-size: 13px;
  padding: 10px 0;
}
.business-files a > svg:last-child {
  margin-left: auto;
}
.business-files h2 {
  margin-bottom: 10px;
}
footer {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  color: #7d8f82;
  font-size: 11px;
}
footer svg {
  flex: none;
  margin-top: 4px;
}
@container (max-width:600px) {
  .business-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .business-output-grid {
    grid-template-columns: 1fr;
  }
  .service-chart {
    grid-template-columns: 1fr;
  }
  .service-close {
    max-width: 230px;
  }
  .stage-track strong {
    font-size: 11px;
  }
}
@media (max-width: 600px) {
  .business-preview {
    padding: 14px;
  }
  .business-cover h1 {
    font-size: 21px;
  }
  .business-phase,
  .milestone-sheet,
  .business-output,
  .business-files {
    padding: 15px;
  }
  .business-metrics > div {
    padding: 12px;
  }
  .business-metrics strong {
    font-size: 19px;
  }
}
</style>
