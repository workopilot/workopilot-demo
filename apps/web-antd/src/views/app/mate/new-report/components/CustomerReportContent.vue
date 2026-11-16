<script setup lang="ts">
import type {
  BusinessReportProfile,
  BusinessReportEdits,
  BusinessReportBlock,
} from '#/types/business-report';
import type { ReportDraft, ReportAttachment } from '#/types/new-report';
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
import { Button, Input } from 'ant-design-vue';
import { businessQuantities } from '#/api/mock-business-report-config';
import ReportMarkdown from './ReportMarkdown.vue';
import ReportAttachments from './ReportAttachments.vue';
import ReportSupplementHint from './ReportSupplementHint.vue';
import { periodLabel } from '#/utils/report-period';
const props = defineProps<{
  profile: BusinessReportProfile;
  edits: BusinessReportEdits;
  report: ReportDraft;
  mode: 'edit' | 'preview';
  external?: boolean;
  busy?: string;
  objectId?: string;
}>();
const emit = defineEmits<{
  regenerate: [id: string];
  note: [id: string, text: string];
  customerNote: [id: string, text: string];
  conclusion: [text: string];
  files: [id: string, files: ReportAttachment[]];
}>();
const locked = computed(
  () => props.mode === 'preview' || props.report.status === 'submitted',
);
const metrics = computed(() =>
  businessQuantities(
    props.profile,
    props.objectId ?? props.report.business?.objectId ?? '',
  ),
);
const duration = computed(() => {
  const start = props.profile.serviceStartedAt;
  if (!start) return '起始日期待采集';
  const days =
    Math.floor(
      (Date.parse(`${props.report.end}T00:00:00Z`) -
        Date.parse(`${start}T00:00:00Z`)) /
        86400000,
    ) + 1;
  return Number.isFinite(days) && days > 0
    ? `已运维 ${days} 天`
    : '尚未进入运维';
});
const sections = computed(() =>
  props.profile.blocks
    .map((block) => ({
      ...block,
      title:
        (
          {
            outcomes: '工单处理情况',
            delivery: '任务与交付情况',
            tasks: '任务完成情况',
            risks: '待补充事项与协调',
            plan: '下期计划',
          } as Record<string, string>
        )[block.id] ?? block.title,
    }))
    .filter(
      (block) =>
        props.mode === 'edit' ||
        block.id !== 'risks' ||
        block.items.length ||
        props.edits.customerNotes?.[block.id]?.trim() ||
        (!props.external && props.edits.notes[block.id]?.trim()),
    ),
);
const hints: Record<string, string> = {
  outcomes:
    '未闭环或超时工单为什么尚未解决？对客户有什么影响？请补充处理措施、预计解决时间和需要的支持。',
  delivery:
    '任务是否按计划完成？是否存在延期？请补充负责人、预计完成时间及成果依据；历史验收不计入本月新增交付。',
  tasks:
    '补充延期原因、负责人和预计完成时间；如需其他人员协助，请说明协调诉求。',
  risks: '补充当前阻塞、客户影响、需要谁配合以及下一次反馈时间；无异常可留空。',
  plan: '补充下期服务目标、巡检安排、遗留问题闭环计划和预计完成时间；先核对已有任务，再确认是否创建。',
};
const filesFor = (id: string) =>
  props.report.attachments?.[`business-${props.profile.id}-${id}`] ?? [];
const taskStats = computed(() => {
  const tasks = props.profile.taskRecords ?? [];
  return tasks.length
    ? [
        { label: '本期任务', value: tasks.length },
        {
          label: '已完成',
          value: tasks.filter((task) => task.state === 'completed').length,
        },
        {
          label: '进行中',
          value: tasks.filter((task) => task.state === 'active').length,
        },
        {
          label: '延期',
          value: tasks.filter((task) => task.state === 'delayed').length,
        },
      ]
    : [];
});
const markdownCell = (text: string) =>
  text.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
const metricTable = (items: { label: string; value: string | number }[]) =>
  items.length
    ? [
        `| ${items.map((item) => markdownCell(item.label)).join(' | ')} |`,
        `| ${items.map(() => '---').join(' | ')} |`,
        `| ${items.map((item) => `**\`${markdownCell(String(item.value))}\`**`).join(' | ')} |`,
      ].join('\n')
    : '本周期统计待采集，不沿用其他周期数字。';
const overviewMarkdown = computed(() =>
  [
    `## ${markdownCell(props.profile.name)}`,
    `${props.report.start} — ${props.report.end} · 客户${periodLabel(props.report.period ?? 'month')}`,
    `> 当前阶段：${props.profile.phase} · ${duration.value} · 客户经理：${props.profile.manager}${props.profile.serviceStartedAt ? `\n> 运维起始：${props.profile.serviceStartedAt}，时长截至本报告期末。` : ''}`,
    '**客户概述**',
    props.profile.conclusion,
    '**本周期统计**',
    metricTable(metrics.value),
  ].join('\n\n'),
);
function blockMarkdown(block: BusinessReportBlock) {
  if (props.mode === 'preview') return block.summary;
  let statistics = '';
  if (block.id === 'outcomes' && props.profile.service) {
    const { resolved, open } = props.profile.service;
    const total = resolved + open;
    statistics = metricTable([
      { label: '本期受理问题', value: total },
      { label: '已闭环', value: resolved },
      { label: '待跟进', value: open },
      {
        label: '问题闭环率',
        value: total
          ? `${Math.round((resolved / total) * 100)}%`
          : '暂无受理问题',
      },
    ]);
  }
  if (block.id === 'delivery' && taskStats.value.length)
    statistics = metricTable(taskStats.value);
  return [statistics, block.summary].filter(Boolean).join('\n\n');
}
</script>
<template>
  <article
    :class="[
      'customer-report-content',
      { 'business-preview': mode === 'preview', editing: mode === 'edit' },
      `presentation-${report.presentation ?? 'classic'}`,
    ]"
  >
    <section
      v-if="mode === 'edit'"
      id="business-edit-overview"
      class="customer-edit-overview"
    >
      <ReportMarkdown :text="overviewMarkdown" />
    </section>
    <header v-else class="customer-overview" id="business-edit-overview">
      <div class="customer-eyebrow">
        <span
          ><Icon icon="lucide:building-2" />客户{{
            periodLabel(report.period ?? 'month')
          }}</span
        ><span>{{ report.start }} — {{ report.end }}</span>
      </div>
      <h1>{{ profile.name }}</h1>
      <div class="customer-context">
        <span><Icon icon="lucide:scan-line" />{{ profile.phase }}</span
        ><span><Icon icon="lucide:calendar-clock" />{{ duration }}</span
        ><span
          ><Icon icon="lucide:user-round" />客户经理 {{ profile.manager }}</span
        >
      </div>
      <div class="customer-summary">
        <strong><Icon icon="lucide:scan-text" />客户概述</strong>
        <p>{{ profile.conclusion }}</p>
      </div>
      <p v-if="profile.serviceStartedAt" class="service-start">
        运维起始 {{ profile.serviceStartedAt }} · 时长截至本报告期末
      </p>
    </header>
    <section
      v-if="mode === 'preview'"
      class="customer-stats"
      aria-label="本周期统计"
    >
      <div v-for="metric in metrics" :key="metric.label">
        <Icon :icon="metric.icon" /><span>{{ metric.label }}</span
        ><strong>{{ metric.value }}</strong
        ><small>{{ metric.hint }}</small>
      </div>
      <p v-if="!metrics.length" class="customer-empty">
        本周期统计待采集，不沿用其他周期数字。
      </p>
    </section>
    <section
      v-for="block in sections"
      :key="block.id"
      :id="`business-edit-${block.id}`"
      :class="['customer-section', block.tone]"
    >
      <div class="customer-section-head">
        <h2>
          <span><Icon :icon="block.icon" /></span>{{ block.title }}
        </h2>
        <Button
          v-if="!locked"
          size="small"
          :disabled="!!busy"
          :loading="busy === block.id"
          @click="emit('regenerate', block.id)"
          ><Icon icon="lucide:refresh-cw" />重新生成</Button
        >
      </div>
      <div class="customer-section-body">
        <ReportMarkdown :text="blockMarkdown(block)" />
        <div
          v-if="
            mode === 'preview' && block.id === 'outcomes' && profile.service
          "
          class="customer-service-meter"
        >
          <span
            >问题闭环
            <b
              >{{ profile.service.resolved }} /
              {{ profile.service.resolved + profile.service.open }}</b
            ></span
          >
          <small>{{ profile.service.open }} 个持续跟进</small>
        </div>
        <div
          v-if="
            mode === 'preview' && block.id === 'delivery' && taskStats.length
          "
          class="customer-task-stats"
        >
          <div v-for="stat in taskStats" :key="stat.label">
            <span>{{ stat.label }}</span
            ><strong>{{ stat.value }}<small> 项</small></strong>
          </div>
        </div>
        <details
          v-if="block.id === 'delivery' && profile.taskRecords?.length"
          class="customer-records"
        >
          <summary>关联任务 · {{ profile.taskRecords.length }} 项</summary>
          <div v-for="task in profile.taskRecords" :key="task.id">
            <strong>{{ task.title }}</strong
            ><span>{{ task.status }}</span>
            <p>负责人：{{ task.owner }}</p>
            <ReportMarkdown :text="task.detail" />
          </div>
        </details>
        <p
          v-if="
            block.id === 'delivery' &&
            !taskStats.length &&
            !profile.blocks.some((item) => item.id === 'tasks')
          "
          class="customer-data-note"
        >
          任务数量尚未单独采集，以下关联记录用于核对交付情况，不将工单或接口数量当作任务数。
        </p>
        <details v-if="block.items.length" class="customer-records">
          <summary>
            关联{{ block.id === 'outcomes' ? '工单' : '任务与业务' }}记录 ·
            {{ block.items.length }} 条
          </summary>
          <div v-for="item in block.items" :key="item.id">
            <strong>{{ item.title }}</strong
            ><span>{{ item.status }}</span
            ><ReportMarkdown :text="item.detail" /><small v-if="!external">{{
              item.evidence
            }}</small>
          </div>
        </details>
        <template v-if="!locked">
          <div class="customer-supplement-panel">
            <ReportSupplementHint
              :text="hints[block.id] ?? '请补充经核实的成果、原因与后续安排。'"
              :label="block.title"
            />
            <label :for="`customer-public-${block.id}`"
              >{{ block.id === 'plan' ? '补充下期计划' : '补充说明' }}
              <small>纳入审批与对客报告</small></label
            >
            <Input.TextArea
              :id="`customer-public-${block.id}`"
              :value="edits.customerNotes?.[block.id] ?? ''"
              :auto-size="{ minRows: 2, maxRows: 8 }"
              :placeholder="hints[block.id]"
              @update:value="emit('customerNote', block.id, String($event))"
            />
          </div>
          <details class="customer-internal">
            <summary>
              内部说明（仅内部审查可见）{{
                edits.notes[block.id] ? ' · 已补充' : ''
              }}
            </summary>
            <label :for="`customer-internal-${block.id}`">内部协调说明</label
            ><Input.TextArea
              :id="`customer-internal-${block.id}`"
              :value="edits.notes[block.id] ?? ''"
              :auto-size="{ minRows: 2, maxRows: 6 }"
              placeholder="内部原因、资源协调或尚未核实的信息，不向客户展示。"
              @update:value="emit('note', block.id, String($event))"
            />
          </details>
        </template>
        <template v-else>
          <div v-if="edits.customerNotes?.[block.id]" class="customer-note">
            <strong>补充说明</strong
            ><ReportMarkdown :text="edits.customerNotes[block.id]!" />
          </div>
          <div
            v-if="!external && edits.notes[block.id]"
            class="customer-note internal"
          >
            <strong>内部说明</strong
            ><ReportMarkdown :text="edits.notes[block.id]!" />
          </div>
        </template>
        <ReportAttachments
          v-if="mode === 'edit' || filesFor(block.id).length"
          :files="filesFor(block.id)"
          :readonly="locked"
          :label="block.title"
          @change="emit('files', block.id, $event)"
        />
        <slot v-if="block.id === 'plan' && !locked" name="plan-actions" />
      </div>
    </section>
    <section
      v-if="
        mode === 'edit' ||
        edits.customerNotes?.supplement ||
        (!external && edits.conclusion)
      "
      id="business-edit-supplement"
      class="customer-section"
    >
      <div class="customer-section-head">
        <h2>
          <span><Icon icon="lucide:notebook-pen" /></span>其他补充
        </h2>
      </div>
      <div class="customer-section-body">
        <label v-if="!locked" for="customer-general-note"
          >其他补充说明 <small>纳入审批与对客报告</small></label
        >
        <Input.TextArea
          v-if="!locked"
          id="customer-general-note"
          :value="edits.customerNotes?.supplement ?? ''"
          :auto-size="{ minRows: 2, maxRows: 8 }"
          placeholder="补充本周期的其他成果、客户沟通结果或配合事项。"
          @update:value="emit('customerNote', 'supplement', String($event))"
        />
        <ReportMarkdown
          v-else-if="edits.customerNotes?.supplement"
          :text="edits.customerNotes.supplement"
        />
        <details
          v-if="!external && (!locked || edits.conclusion)"
          class="customer-internal"
        >
          <summary>内部综合说明（不对客户展示）</summary>
          <label v-if="!locked" for="customer-overall-note">内部综合说明</label
          ><Input.TextArea
            v-if="!locked"
            id="customer-overall-note"
            :value="edits.conclusion"
            :auto-size="{ minRows: 2, maxRows: 8 }"
            placeholder="其他需要运维负责人了解的事项，不对客户展示。"
            @update:value="emit('conclusion', String($event))"
          /><ReportMarkdown v-else :text="edits.conclusion" />
        </details>
      </div>
    </section>
    <footer v-if="mode === 'preview'">
      {{ external ? '客户服务报告' : '内部审查预览' }} ·
      {{
        report.customerApproval?.status === 'approved' ? '已审批' : '待审批草稿'
      }}
      · V{{ report.version }}
    </footer>
  </article>
</template>
<style scoped>
.customer-report-content {
  color: #294b40;
  max-width: 1088px;
  margin: auto;
}
.customer-report-content.business-preview {
  padding: 24px;
  background: #f0f6f3;
  border: 1px solid #dfe9e3;
  border-radius: 16px;
}
.customer-overview {
  padding: 24px;
  border-radius: 14px;
  border: 1px solid #d6e6df;
  background: linear-gradient(125deg, #edf7f2, #e2f0eb);
}
.customer-eyebrow,
.customer-eyebrow > span,
.customer-context,
.customer-context > span {
  display: flex;
  gap: 7px;
  align-items: center;
  flex-wrap: wrap;
}
.customer-eyebrow {
  justify-content: space-between;
  color: #5e7d71;
  font-size: 12px;
}
.customer-overview h1 {
  margin: 16px 0 12px;
  font-size: 27px;
  font-weight: 700;
}
.customer-context {
  gap: 10px;
  font-size: 12px;
}
.customer-context > span {
  padding: 5px 9px;
  background: #ffffffb8;
  border-radius: 6px;
}
.customer-detected,
.service-start {
  font-size: 12px;
  color: #6d857a;
  margin: 12px 0 0;
}
.customer-summary {
  margin-top: 18px;
  padding: 15px 18px;
  border-radius: 10px;
  background: #ffffffb8;
}
.customer-summary > strong {
  display: flex;
  gap: 7px;
  align-items: center;
  font-size: 12px;
  color: #537b66;
}
.customer-summary p {
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.9;
}
.customer-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  margin: 16px 0 24px;
}
.customer-stats > div {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 17px;
  border: 1px solid #dfe9e3;
  border-radius: 12px;
  background: white;
}
.customer-stats svg {
  position: absolute;
  right: 14px;
  top: 14px;
  width: 28px;
  height: 28px;
  padding: 5px;
  border-radius: 8px;
  color: #3a8d71;
  background: #edf6f1;
}
.customer-stats span {
  font-size: 12px;
  color: #6c8176;
  padding-right: 26px;
}
.customer-stats strong {
  font-size: 25px;
  color: #326e55;
  font-variant-numeric: tabular-nums;
}
.customer-stats small {
  font-size: 11px;
  color: #7f8f85;
  line-height: 1.6;
}
.customer-section {
  margin: 18px 0;
  scroll-margin-top: 12px;
}
.customer-section-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 0 3px 10px;
}
.customer-section-head h2 {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 16px;
  font-weight: 700;
  margin: 0;
}
.customer-section-head h2 > span {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  color: #387e60;
  background: linear-gradient(130deg, #e2f2e9, #d6e9e3);
}
.customer-section-body {
  background: white;
  padding: 20px;
  border: 1px solid #dfe9e3;
  border-radius: 12px;
}
.customer-section.risk .customer-section-body {
  border-color: #eaddc3;
  background: #fffdf7;
}
.customer-section.plan .customer-section-body {
  border-color: #dbe5ef;
  background: #f8fbff;
}
.customer-section-body > label,
.customer-internal label {
  display: block;
  margin: 12px 0 8px;
  font-size: 12px;
  font-weight: 600;
}
.customer-section-body label small {
  font-weight: 400;
  color: #839387;
  margin-left: 8px;
}
.customer-edit-overview {
  padding: 20px;
  background: #fff;
  border: 1px solid #dfe9e3;
  border-radius: 12px;
  margin-bottom: 22px;
}
.customer-supplement-panel {
  margin-top: 12px;
  padding: 12px 14px;
  border: 1px solid #e2eae5;
  border-radius: 10px;
  background: #f6f9f7;
}
.customer-supplement-panel label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px;
  color: #3a5947;
  font-size: 12px;
  font-weight: 600;
}
.customer-supplement-panel label small {
  color: #76897d;
  font-size: 12px;
  font-weight: 400;
}
.customer-supplement-panel :deep(textarea) {
  border-color: #dce6df;
  border-radius: 7px;
  padding: 8px 10px;
  font-size: 13px;
  line-height: 1.6;
  background: white;
}
.customer-records,
.customer-internal {
  font-size: 12px;
  margin: 14px 0;
  color: #6e8579;
}
summary {
  cursor: pointer;
  padding: 7px 0;
}
.customer-records > div {
  border-top: 1px solid #e8eee9;
  padding: 12px 0;
}
.customer-records > div > span {
  float: right;
  font-size: 11px;
}
.customer-records small {
  color: #8c9b90;
}
.customer-service-meter {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f3f8f5;
  border-radius: 8px;
  font-size: 12px;
  margin-top: 12px;
  flex-wrap: wrap;
}
.customer-task-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  margin-top: 14px;
  background: #dfe9e3;
  border: 1px solid #dfe9e3;
  border-radius: 10px;
  overflow: hidden;
}
.customer-task-stats > div {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #f6faf7;
}
.customer-task-stats span {
  font-size: 12px;
  color: #73867b;
}
.customer-task-stats strong {
  font-size: 22px;
  color: #3b7156;
}
.customer-task-stats small {
  font-size: 11px;
  font-weight: 400;
}
.customer-data-note {
  font-size: 12px;
  color: #849287;
  line-height: 1.7;
}
.customer-note {
  margin-top: 12px;
  padding: 12px 15px;
  border-left: 3px solid #bad5c5;
  background: #f3f8f5;
  border-radius: 0 8px 8px 0;
}
.customer-note > strong {
  font-size: 12px;
  color: #638371;
}
.customer-empty,
footer {
  font-size: 12px;
  color: #7c8e82;
}
footer {
  text-align: center;
  margin-top: 20px;
}
.presentation-executive .customer-overview {
  background: #edf3fc;
  border-color: #dbe5f3;
}
.presentation-warm .customer-overview {
  background: #fbf4e8;
  border-color: #ede1c8;
}
@media (max-width: 700px) {
  .customer-report-content.business-preview {
    padding: 12px;
  }
  .customer-overview,
  .customer-section-body {
    padding: 16px;
  }
  .customer-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
