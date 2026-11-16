<script setup lang="ts">
import type { ReportDraft, ReportMaterialSection } from '#/types/new-report';
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
import ReportMarkdown from './ReportMarkdown.vue';
import { personalReportOverview } from '#/api/mock-personal-report-statistics';
const props = defineProps<{
  report?: ReportDraft;
  sections: ReportMaterialSection[];
}>();
const clean = (value: string) =>
  value.replace(
    /此处为演示素材快照，不打开真实公司文件。|此条为所选周期的演示工单素材。|仅展示模拟授权后的提交摘要。/g,
    '',
  );
const records = computed(() =>
  Array.from(
    new Map(
      props.sections
        .filter((s) => s.enabled)
        .flatMap((s) => s.records)
        .map((r) => [r.id, r]),
    ).values(),
  ),
);
// Counts describe report records, not task completion rates or business totals.
const isOngoing = (detail: string) => /进行中|排查/.test(detail);
const isDone = (detail: string) =>
  /已完成|已验收|已处理|已确认|已关闭|完成 \d+ 次/.test(detail) &&
  !isOngoing(detail);
const doneCount = computed(
  () => records.value.filter((r) => isDone(r.detail)).length,
);
const ongoingCount = computed(
  () => records.value.filter((r) => isOngoing(r.detail)).length,
);
const otherCount = computed(
  () => records.value.length - doneCount.value - ongoingCount.value,
);
const evidenceCount = computed(
  () =>
    records.value.filter((r) =>
      /(?:链接|文档|证明|成果|附件|依据)[^。；]{0,16}(?:待补充|尚待|尚未|未归档)|(?:待补充|尚待|尚未)[^。；]{0,16}(?:链接|文档|证明|成果|附件|依据)/.test(
        r.detail,
      ),
    ).length,
);
const chartSegments = computed(() => {
  let offset = 0;
  return [
    { label: '已完成', value: doneCount.value, color: '#35876c' },
    { label: '跟进中', value: ongoingCount.value, color: '#d49b3e' },
    { label: '其他记录', value: otherCount.value, color: '#9baeb9' },
  ].map((item) => {
    const length = records.value.length
      ? (item.value / records.value.length) * 100
      : 0;
    const result = { ...item, length, offset };
    offset += length;
    return result;
  });
});
const notes = computed(() =>
  props.sections
    .filter((s) => s.enabled && props.report?.sourceNotes?.[s.id]?.text)
    .map((s) => ({ id: s.id, text: props.report!.sourceNotes![s.id]!.text })),
);
const includedSections = computed(() =>
  props.sections.filter((section) => section.enabled && section.records.length),
);
const projectRecords = computed(() =>
  includedSections.value
    .filter((section) => section.id === 'projects')
    .flatMap((section) => section.records),
);
const overviewText = computed(() =>
  personalReportOverview(props.sections, props.report?.period ?? 'week'),
);
const aggregateMetrics = computed(() =>
  includedSections.value.map((section) => {
    const done = section.records.filter((record) =>
      isDone(record.detail),
    ).length;
    if (section.id === 'projects') {
      const stats = section.records.map((record) => record.statistics);
      const complete = stats.every((item) => !!item);
      return {
        id: section.id,
        icon: section.icon,
        title: '参与项目',
        value: String(section.records.length),
        unit: '个',
        detail: complete
          ? `完成 ${stats.reduce((sum, item) => sum + item!.completed, 0)} 项关联任务`
          : '项目任务状态待核对',
        tone: 'blue',
      };
    }
    const labels: Record<string, [string, string, string]> = {
      tickets: ['处理工单', '条', 'green'],
      tasks: ['推进任务', '条', 'purple'],
      git: ['代码变更', '条', 'amber'],
      files: ['成果记录', '条', 'cyan'],
      requirements: ['需求记录', '条', 'rose'],
    };
    const [title, unit, tone] = labels[section.id] ?? [
      section.title,
      '条',
      'green',
    ];
    return {
      id: section.id,
      icon: section.icon,
      title,
      value: String(section.records.length),
      unit,
      detail: ['tickets', 'tasks', 'requirements'].includes(section.id)
        ? `已完成 ${done} · 待跟进 ${section.records.length - done}`
        : '已归集，作为成果与交付依据',
      tone,
    };
  }),
);
const completionTracks = computed(() =>
  includedSections.value
    .filter((section) => ['tickets', 'projects', 'tasks'].includes(section.id))
    .map((section) => {
      const stats = section.records.map((record) => record.statistics);
      const valid = section.id !== 'projects' || stats.every((item) => !!item);
      const total =
        section.id === 'projects'
          ? stats.reduce((sum, item) => sum + (item?.total ?? 0), 0)
          : section.records.length;
      const done =
        section.id === 'projects'
          ? stats.reduce((sum, item) => sum + (item?.completed ?? 0), 0)
          : section.records.filter((record) => isDone(record.detail)).length;
      return {
        id: section.id,
        title:
          section.id === 'projects'
            ? '项目关联任务完成'
            : section.id === 'tickets'
              ? '工单闭环'
              : '任务记录完成',
        done,
        total,
        valid,
        percent: valid && total ? Math.round((done / total) * 100) : 0,
      };
    }),
);
const nextProjectCount = computed(() =>
  projectRecords.value.length &&
  projectRecords.value.every(
    (record) => record.statistics?.nextWeekPlanned !== undefined,
  )
    ? projectRecords.value.reduce(
        (sum, record) => sum + record.statistics!.nextWeekPlanned!,
        0,
      )
    : undefined,
);
const hasRiskText = (text: string) => {
  const positive = text.replace(
    /(?:暂未发现|未发现|不存在|没有|暂无|无)(?:任何|明显|已知)?(?:风险(?:与协调)?(?:事项)?|延期(?:任务)?|阻碍|阻塞|异常)|无需(?:协调|支持)|不需要(?:协调|支持)/g,
    '',
  );
  return /风险|协调|支持|延期|超时|阻碍|阻塞|无法|排查|异常/.test(positive);
};
const riskItems = computed(() => {
  const result: {
    id: string;
    title: string;
    text: string;
    note?: string;
    tag: string;
  }[] = [];
  for (const record of records.value) {
    if (record.statistics?.delayed)
      result.push({
        id: record.id,
        title: record.title.split(' · ')[0] + ' · 任务延期',
        text:
          record.statistics.delayedDescription ||
          `${record.statistics.delayed} 项任务延期，原因、影响及预计完成时间待补充。`,
        tag: '项目进度',
      });
    else if (hasRiskText(record.detail))
      result.push({
        id: record.id,
        title: record.title,
        text: clean(record.detail),
        tag: '业务异常',
      });
  }
  const manual = [
    ...notes.value
      .filter((note) => hasRiskText(note.text))
      .map((note) => ({ id: note.id, text: note.text })),
    ...(props.report?.risk && hasRiskText(props.report.risk)
      ? [{ id: 'manual-risk', text: props.report.risk }]
      : []),
  ];
  for (const note of manual) {
    const matching = result.find((item) => {
      const name = item.title.split(' · ')[0]?.trim();
      return name && name.length >= 2 && note.text.includes(name);
    });
    if (matching)
      matching.note = [matching.note, note.text].filter(Boolean).join('\n\n');
    else if (
      !result.some((item) => item.text === note.text || item.note === note.text)
    )
      result.push({
        id: `note-${note.id}`,
        title: '人工补充的风险与支持诉求',
        text: '',
        note: note.text,
        tag: '员工确认',
      });
  }
  return result;
});
const completionNotes = computed(() =>
  notes.value.filter((note) => !hasRiskText(note.text)),
);
const files = computed(() =>
  Object.entries(props.report?.attachments ?? {})
    .filter(
      ([key]) =>
        ['plan', 'supplement'].includes(key) ||
        props.sections.some((s) => s.id === key && s.enabled),
    )
    .flatMap(([, items]) => items),
);
</script>
<template>
  <article
    v-if="report"
    class="report-final-preview"
    :class="`presentation-${report.presentation ?? 'classic'}`"
  >
    <header class="preview-heading">
      <div class="preview-eyebrow">
        <Icon icon="lucide:book-open-check" />工作报告
        <span>{{
          report.status === 'submitted' ? '已提交' : '已保存 · 预览'
        }}</span>
      </div>
      <h1>{{ report.title }}</h1>
      <p>
        <Icon icon="lucide:calendar-days" />{{ report.start }} —
        {{ report.end }}
      </p>
    </header>
    <section class="report-pulse" aria-label="本期工作记录概览">
      <div class="pulse-copy">
        <span class="pulse-label"
          ><Icon icon="lucide:chart-no-axes-combined" />本期工作一览</span
        >
        <h2>交付有成果，推进有重点</h2>
        <p>从已纳入报告的工作记录，快速了解本期交付与待跟进事项。</p>
        <div class="pulse-metrics">
          <div>
            <Icon icon="lucide:circle-check" /><strong>{{ doneCount }}</strong
            ><span>已完成记录</span>
          </div>
          <div>
            <Icon icon="lucide:timer" /><strong>{{ ongoingCount }}</strong
            ><span>持续跟进</span>
          </div>
          <div>
            <Icon icon="lucide:file-clock" /><strong>{{ evidenceCount }}</strong
            ><span>待补充依据</span>
          </div>
        </div>
      </div>
      <div class="pulse-chart">
        <div
          class="record-ring"
          role="img"
          :aria-label="
            '报告共 ' +
            records.length +
            ' 条记录，已完成 ' +
            doneCount +
            ' 条，跟进中 ' +
            ongoingCount +
            ' 条，其他 ' +
            otherCount +
            ' 条'
          "
        >
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle
              cx="60"
              cy="60"
              r="48"
              fill="none"
              stroke="#e5ece8"
              stroke-width="10"
            />
            <circle
              v-for="segment in chartSegments"
              :key="segment.label"
              cx="60"
              cy="60"
              r="48"
              fill="none"
              :stroke="segment.color"
              stroke-width="10"
              pathLength="100"
              :stroke-dasharray="segment.length + ' ' + (100 - segment.length)"
              :stroke-dashoffset="-segment.offset"
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div>
            <strong>{{ records.length }}</strong
            ><span>本期记录</span>
          </div>
        </div>
        <ul class="chart-key">
          <li v-for="segment in chartSegments" :key="segment.label">
            <i :style="{ background: segment.color }" />{{ segment.label
            }}<b>{{ segment.value }}</b>
          </li>
        </ul>
        <small>按记录状态统计，非业务完成率</small>
      </div>
    </section>
    <section class="preview-overview">
      <h2><Icon icon="lucide:scan-text" />概述</h2>
      <p class="overview-summary consolidated-overview-text">
        {{ overviewText }}
      </p>
    </section>
    <section class="delivery-section consolidated-delivery">
      <div class="preview-section-heading">
        <h2><Icon icon="lucide:package-check" />本期完成</h2>
        <span>工作成果统一归集 · 各业务口径分别统计</span>
      </div>
      <div
        v-if="aggregateMetrics.length"
        class="aggregate-metric-grid"
        :style="{ '--metric-columns': Math.min(aggregateMetrics.length, 6) }"
      >
        <article
          v-for="metric in aggregateMetrics"
          :key="metric.id"
          class="aggregate-metric"
          :class="metric.tone"
        >
          <span class="aggregate-metric-icon"
            ><Icon :icon="metric.icon"
          /></span>
          <span class="aggregate-metric-title">{{ metric.title }}</span>
          <strong
            >{{ metric.value }}<small>{{ metric.unit }}</small></strong
          >
          <p>{{ metric.detail }}</p>
        </article>
      </div>
      <p v-else class="empty-copy">本期暂无已采集统计。</p>
      <div v-if="projectRecords.length" class="participating-projects">
        <h3>
          <Icon icon="lucide:folders" />参与的项目
          <small>{{ projectRecords.length }} 个 · 展开查看任务</small>
        </h3>
        <details
          v-for="project in projectRecords"
          :key="project.id"
          class="preview-project-item"
        >
          <summary>
            <span class="preview-project-icon"
              ><Icon icon="lucide:folder-kanban" /></span
            ><span class="preview-project-name">{{
              project.title.split(' · ')[0]
            }}</span
            ><span v-if="project.statistics" class="preview-project-counts"
              >完成 {{ project.statistics.completed }} /
              {{ project.statistics.total }} 项<span
                v-if="project.statistics.delayed"
                class="preview-project-delay"
                >延期 {{ project.statistics.delayed }} 项</span
              ></span
            ><span class="preview-project-expand"
              >任务明细<Icon icon="lucide:chevron-down"
            /></span>
          </summary>
          <div class="preview-project-tasks">
            <div v-if="!project.projectTasks?.length" class="empty-copy">
              暂无已关联任务明细，当前仅展示已采集的项目统计。
            </div>
            <article
              v-for="task in project.projectTasks ?? []"
              :key="task.id"
              class="preview-project-task"
            >
              <Icon
                :icon="
                  task.status === 'completed'
                    ? 'lucide:circle-check'
                    : task.status === 'delayed'
                      ? 'lucide:clock-alert'
                      : 'lucide:circle-dot'
                "
                :class="task.status"
              />
              <div>
                <strong>{{ task.title }}</strong>
                <p v-if="task.detail">{{ task.detail }}</p>
              </div>
              <span :class="task.status">{{
                task.status === 'completed'
                  ? '已完成'
                  : task.status === 'delayed'
                    ? '延期'
                    : '进行中'
              }}</span>
            </article>
          </div>
        </details>
      </div>
      <div v-if="completionTracks.length" class="completion-board">
        <h3><Icon icon="lucide:chart-no-axes-combined" />完成情况</h3>
        <div
          v-for="track in completionTracks"
          :key="track.id"
          class="completion-track"
        >
          <span>{{ track.title }}</span>
          <div
            class="completion-bar"
            role="img"
            :aria-label="
              track.valid
                ? `${track.title} ${track.done}/${track.total}`
                : `${track.title}，统计待采集`
            "
          >
            <i :style="{ width: track.percent + '%' }" />
          </div>
          <strong>{{
            track.valid ? `${track.done} / ${track.total}` : '待采集'
          }}</strong
          ><small>{{ track.valid ? track.percent + '%' : '—' }}</small>
        </div>
        <p>项目任务与任务来源记录分别展示，避免重复合计。</p>
      </div>
      <div
        v-if="completionNotes.length || report.supplement"
        class="supplement-sheet"
      >
        <h3><Icon icon="lucide:message-square-plus" />成果补充</h3>
        <ReportMarkdown
          v-for="note in completionNotes"
          :key="note.id"
          :text="note.text"
        /><ReportMarkdown v-if="report.supplement" :text="report.supplement" />
      </div>
    </section>
    <section class="next-plan consolidated-plan">
      <div class="preview-section-heading">
        <h2><Icon icon="lucide:calendar-arrow-up" />下期计划</h2>
        <span v-if="nextProjectCount !== undefined" class="plan-count"
          >已记录 {{ nextProjectCount }} 项下周项目任务</span
        >
      </div>
      <div class="plan-document">
        <span class="plan-document-icon"
          ><Icon icon="lucide:calendar-check-2" /></span
        ><ReportMarkdown :text="report.plan || '尚未补充下期计划。'" />
      </div>
    </section>
    <section v-if="riskItems.length" class="risk-panel consolidated-risks">
      <div class="preview-section-heading">
        <h2><Icon icon="lucide:flag" />风险与协调</h2>
        <span class="risk-count">{{ riskItems.length }} 项需关注</span>
      </div>
      <div class="consolidated-risk-list">
        <article
          v-for="item in riskItems"
          :key="item.id"
          class="consolidated-risk-item"
        >
          <span class="risk-item-icon"
            ><Icon icon="lucide:triangle-alert"
          /></span>
          <div>
            <div class="risk-item-heading">
              <h3>{{ item.title }}</h3>
              <small>{{ item.tag }}</small>
            </div>
            <p v-if="item.text">{{ item.text }}</p>
            <ReportMarkdown v-if="item.note" :text="item.note" />
          </div>
        </article>
      </div>
    </section>
    <section v-if="files.length" class="evidence-panel">
      <h2><Icon icon="lucide:paperclip" />附件与成果依据</h2>
      <div class="evidence-list">
        <a
          v-for="file in files"
          :key="file.id"
          :href="file.url"
          :download="file.name"
          ><Icon icon="lucide:file-text" /><span>{{ file.name }}</span
          ><Icon icon="lucide:download"
        /></a>
      </div>
    </section>
    <footer>
      <Icon icon="lucide:shield-check" />根据已保存内容编排，缺失信息未自动补造
      · 前端演示
    </footer>
  </article>
</template>
<style scoped>
.consolidated-overview-text {
  color: #4c6656;
  font-size: 14px;
  line-height: 2;
  margin: 12px 0 0;
}
.participating-projects {
  margin-top: 14px;
  background: white;
  border: 1px solid #e0e9e3;
  border-radius: 12px;
  padding: 18px;
}
.participating-projects > h3 {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  margin: 0 0 14px;
  color: #3b5a47;
  font-size: 14px;
}
.participating-projects > h3 small {
  margin-left: auto;
  color: #7d9082;
  font-size: 12px;
  font-weight: 400;
}
.preview-project-item {
  border: 1px solid #e2eae5;
  border-radius: 9px;
  margin-top: 9px;
  overflow: hidden;
}
.preview-project-item > summary {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  list-style: none;
  cursor: pointer;
  background: #f8faf8;
}
.preview-project-item > summary::-webkit-details-marker {
  display: none;
}
.preview-project-item > summary:focus-visible {
  outline: 2px solid #4d8968;
  outline-offset: -2px;
  border-radius: 9px;
}
.preview-project-icon {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  flex: none;
  background: #e7eff9;
  color: #4d76a1;
  border-radius: 8px;
  font-size: 17px;
}
.preview-project-name {
  color: #34513e;
  font-size: 13px;
  font-weight: 600;
}
.preview-project-counts {
  margin-left: auto;
  font-size: 12px;
  color: #758879;
}
.preview-project-delay {
  margin-left: 8px;
  color: #a07632;
}
.preview-project-expand {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #72917c;
  font-size: 12px;
  white-space: nowrap;
}
.preview-project-expand svg {
  transition: transform 0.18s;
}
.preview-project-item[open] .preview-project-expand svg {
  transform: rotate(180deg);
}
.preview-project-tasks {
  padding: 3px 14px;
  border-top: 1px solid #e2eae5;
}
.preview-project-task {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 0;
}
.preview-project-task + .preview-project-task {
  border-top: 1px solid #eef2ef;
}
.preview-project-task > svg {
  flex: none;
  font-size: 16px;
  margin-top: 3px;
}
.preview-project-task > div {
  flex: 1;
  min-width: 0;
}
.preview-project-task strong {
  color: #4d6654;
  font-size: 13px;
  font-weight: 500;
}
.preview-project-task p {
  color: #7e9081;
  font-size: 12px;
  margin: 4px 0 0;
}
.preview-project-task > span {
  font-size: 12px;
  white-space: nowrap;
}
.preview-project-task .completed {
  color: #438363;
}
.preview-project-task .active {
  color: #597da7;
}
.preview-project-task .delayed {
  color: #a17a35;
}
@container (max-width: 560px) {
  .preview-project-item > summary {
    flex-wrap: wrap;
  }
  .preview-project-counts {
    margin-left: 40px;
    flex-basis: calc(100% - 100px);
  }
  .preview-project-expand {
    margin-left: auto;
  }
  .participating-projects {
    padding: 12px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .preview-project-expand svg {
    transition: none;
  }
}
.consolidated-delivery {
  background: #edf3ef;
}
.aggregate-metric-grid {
  display: grid;
  grid-template-columns: repeat(var(--metric-columns, 6), minmax(0, 1fr));
  gap: 12px;
}
.aggregate-metric {
  position: relative;
  padding: 18px;
  border: 1px solid #e0e9e3;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 3px 10px #29483406;
}
.aggregate-metric-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, #e4f4eb, #cce8da);
  color: #367757;
  margin-bottom: 12px;
  font-size: 19px;
}
.aggregate-metric.blue .aggregate-metric-icon {
  background: linear-gradient(135deg, #e5edfc, #ceddf5);
  color: #456d9c;
}
.aggregate-metric.purple .aggregate-metric-icon {
  background: linear-gradient(135deg, #eee9f8, #ded3ef);
  color: #795ca0;
}
.aggregate-metric.amber .aggregate-metric-icon {
  background: linear-gradient(135deg, #faf0dc, #efddb8);
  color: #936c30;
}
.aggregate-metric.cyan .aggregate-metric-icon {
  background: linear-gradient(135deg, #e5f4f6, #cce6eb);
  color: #397b86;
}
.aggregate-metric.rose .aggregate-metric-icon {
  background: linear-gradient(135deg, #fae9ef, #edcfda);
  color: #9e5b75;
}
.aggregate-metric-title {
  display: block;
  color: #677e6f;
  font-size: 13px;
}
.aggregate-metric > strong {
  display: block;
  margin: 4px 0;
  color: #244634;
  font-size: 30px;
  font-weight: 650;
  line-height: 1.4;
  font-variant-numeric: tabular-nums;
}
.aggregate-metric > strong small {
  margin-left: 6px;
  color: #819386;
  font-size: 12px;
  font-weight: 400;
}
.aggregate-metric > p {
  color: #728577;
  font-size: 12px;
  margin: 0;
}
.completion-board {
  background: white;
  border: 1px solid #e0e9e3;
  border-radius: 12px;
  padding: 18px;
  margin-top: 14px;
}
.completion-board h3 {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 14px;
  margin: 0 0 16px;
  color: #3b5a47;
}
.completion-track {
  display: grid;
  grid-template-columns: 140px minmax(60px, 1fr) 70px 40px;
  gap: 12px;
  align-items: center;
  margin: 14px 0;
  font-size: 12px;
}
.completion-track > span {
  color: #5d7565;
}
.completion-track strong {
  text-align: right;
  color: #375a43;
  font-variant-numeric: tabular-nums;
}
.completion-track small {
  text-align: right;
  color: #7e9184;
}
.completion-bar {
  height: 7px;
  background: #edf2ee;
  border-radius: 7px;
  overflow: hidden;
}
.completion-bar i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #75af91, #3c8463);
  border-radius: inherit;
}
.completion-track:nth-of-type(2) .completion-bar i {
  background: linear-gradient(90deg, #8aa8d1, #527aa8);
}
.completion-board > p {
  margin: 14px 0 0;
  font-size: 12px;
  color: #7b8d80;
}
.consolidated-plan {
  background: #edf3fa;
}
.plan-count {
  color: #4f7596;
  font-size: 12px;
  padding: 3px 9px;
  background: #e0eaf5;
  border-radius: 20px;
}
.plan-document {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #ffffffd9;
  border: 1px solid #dae6f0;
  border-radius: 11px;
  padding: 16px;
}
.plan-document-icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  color: #517c9c;
  background: #e6eef8;
  font-size: 19px;
}
.plan-document :deep(.report-markdown) {
  padding: 0;
  border: 0;
  background: none;
  flex: 1;
  min-width: 0;
}
.plan-document :deep(.report-markdown p:first-child) {
  margin-top: 0;
}
.consolidated-risk-list {
  display: grid;
  gap: 12px;
}
.consolidated-risk-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #ffffffde;
  border: 1px solid #ebdfc6;
  border-radius: 11px;
}
.risk-item-icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  color: #a57a30;
  background: #fbefd5;
  font-size: 18px;
}
.consolidated-risk-item > div {
  flex: 1;
  min-width: 0;
}
.risk-item-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.risk-item-heading h3 {
  margin: 0;
  color: #735625;
  font-size: 14px;
}
.risk-item-heading small {
  color: #9b7a41;
  font-size: 11px;
}
.consolidated-risk-item p {
  font-size: 13px;
  color: #7a694c;
  line-height: 1.85;
  margin: 9px 0 0;
}
.consolidated-risk-item :deep(.report-markdown) {
  font-size: 13px;
  background: #faf7ef;
  padding: 8px 12px;
  border: 0;
  margin-top: 10px;
}
@container (max-width: 720px) {
  .aggregate-metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .completion-track {
    grid-template-columns: 110px minmax(40px, 1fr) 60px;
    gap: 8px;
  }
  .completion-track small {
    display: none;
  }
}
@container (max-width: 420px) {
  .aggregate-metric {
    padding: 12px;
  }
  .aggregate-metric > strong {
    font-size: 25px;
  }
  .completion-board {
    padding: 12px;
  }
  .completion-track {
    grid-template-columns: 1fr 60px;
  }
  .completion-bar {
    grid-row: 2;
    grid-column: 1/-1;
  }
  .consolidated-risk-item {
    padding: 12px;
  }
}
.presentation-executive .preview-heading {
  background: #eaf0fa;
  border-color: #d6e1f1;
}
.presentation-executive .preview-heading h1 {
  color: #254b7a;
}
.presentation-executive :deep(h2) {
  color: #2c527c;
}
.presentation-executive .report-pulse {
  background: #eef3fb;
}
.presentation-warm .preview-heading {
  background: #fbf3e5;
  border-color: #eddfc5;
}
.presentation-warm .preview-heading h1 {
  color: #79582b;
}
.presentation-warm :deep(h2) {
  color: #79582b;
}
.presentation-warm .report-pulse {
  background: #fcf6eb;
}
.report-final-preview {
  background: #f4f7f5;
  color: #243b32;
  border: 1px solid #e2e9e5;
  border-radius: 16px;
  padding: 24px;
  max-width: 1088px;
  margin: 0 auto;
  font-size: 14px;
  line-height: 1.75;
  overflow-wrap: anywhere;
  container-type: inline-size;
}
.preview-heading {
  padding: 2px 2px 22px;
}
.preview-eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #496b5a;
}
.preview-eyebrow > svg {
  font-size: 18px;
}
.preview-eyebrow span {
  margin-left: auto;
  color: #557562;
  background: #e6efe9;
  border: 1px solid #d5e4d9;
  padding: 3px 9px;
  border-radius: 20px;
}
.preview-heading h1 {
  font-size: 26px;
  font-weight: 600;
  line-height: 1.4;
  margin: 12px 0 9px;
  letter-spacing: -0.5px;
}
.preview-heading > p {
  display: flex;
  gap: 8px;
  align-items: center;
  color: #64766b;
  margin: 0;
  font-size: 13px;
}
section {
  margin-top: 22px;
}
h2 {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 17px;
  font-weight: 600;
  margin: 0 0 16px;
}
h2 svg {
  color: #397a60;
  width: 20px;
  height: 20px;
  flex: none;
}
.report-pulse {
  margin-top: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 158px;
  gap: 20px;
  background: #e7f0eb;
  border: 1px solid #d8e6de;
  border-radius: 14px;
  padding: 22px;
}
.pulse-label {
  display: flex;
  gap: 7px;
  align-items: center;
  font-size: 12px;
  color: #48745e;
}
.pulse-copy h2 {
  font-size: 20px;
  margin: 12px 0 8px;
  line-height: 1.45;
}
.pulse-copy > p {
  margin: 0;
  color: #63786b;
  font-size: 12px;
  max-width: 360px;
}
.pulse-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 20px;
}
.pulse-metrics > div {
  background: #fff;
  border: 1px solid #dfe9e3;
  border-radius: 10px;
  padding: 12px 9px;
  display: grid;
  grid-template-columns: 18px 1fr;
  column-gap: 7px;
  align-items: center;
}
.pulse-metrics svg {
  font-size: 17px;
  color: #348067;
}
.pulse-metrics > div:nth-child(2) svg {
  color: #a5762a;
}
.pulse-metrics > div:nth-child(3) svg {
  color: #55768d;
}
.pulse-metrics strong {
  font-size: 25px;
  font-weight: 600;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}
.pulse-metrics span {
  grid-column: 1/-1;
  margin-top: 6px;
  font-size: 11px;
  color: #64766b;
}
.pulse-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  border-left: 1px solid #d4e3da;
  padding-left: 18px;
}
.record-ring {
  position: relative;
  width: 118px;
  height: 118px;
}
.record-ring > svg {
  width: 100%;
  height: 100%;
  display: block;
}
.record-ring > div {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.record-ring strong {
  font-size: 28px;
  line-height: 1.25;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.record-ring span {
  font-size: 11px;
  color: #64766b;
}
.chart-key {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  width: 100%;
  font-size: 11px;
  display: grid;
  gap: 3px;
}
.chart-key li {
  display: flex;
  gap: 6px;
  align-items: center;
  color: #52695c;
}
.chart-key i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex: none;
}
.chart-key b {
  margin-left: auto;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}
.pulse-chart > small {
  font-size: 10px;
  color: #617869;
  line-height: 1.5;
  margin-top: 8px;
  text-align: center;
}
.preview-overview {
  background: white;
  border: 1px solid #e2eae5;
  padding: 22px;
  border-radius: 14px;
}
.overview-summary {
  color: #536b5e;
  margin: 0 0 18px;
}
.preview-section-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.preview-section-heading > span {
  font-size: 12px;
  color: #64766b;
}
.outcome-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0;
}
.outcome-list li {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #edf2ee;
}
.outcome-list li:first-child {
  padding-top: 0;
}
.outcome-list li:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}
.outcome-list li > svg {
  color: #27775b;
  background: #eaf4ee;
  border-radius: 50%;
  padding: 4px;
  width: 24px;
  height: 24px;
  margin-top: 2px;
  flex: none;
}
.outcome-list strong {
  font-weight: 600;
}
.outcome-list p {
  color: #617368;
  margin: 3px 0 0;
  font-size: 13px;
}
.attention-line {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  margin-top: 18px;
  color: #805b18;
  background: #fcf5e6;
  border-radius: 8px;
  font-size: 12px;
}
.attention-line > svg {
  flex: none;
  margin-top: 4px;
  font-size: 17px;
}
.attention-line p {
  margin: 0;
}
.delivery-section {
  padding: 20px;
  border: 1px solid #e0e8e3;
  border-radius: 14px;
  background: #eaf0ec;
}
.deliverable-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.deliverable-card {
  border: 1px solid #e2eae5;
  border-radius: 12px;
  background: white;
  padding: 18px;
  box-shadow: 0 3px 10px #29483406;
  transition:
    transform 0.18s,
    border-color 0.18s,
    box-shadow 0.18s;
}
.deliverable-card:hover {
  transform: translateY(-2px);
  border-color: #adc7b7;
  box-shadow: 0 6px 14px #2948340c;
}
.delivery-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.delivery-icon {
  color: #3c7a61;
  font-size: 25px;
}
.delivery-code {
  font-size: 12px;
  color: #8fa196;
  font-variant-numeric: tabular-nums;
}
.delivery-status {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  color: #347357;
  background: #edf6f0;
  border-radius: 5px;
  padding: 2px 7px;
  font-size: 11px;
}
.delivery-status.pending {
  color: #87611e;
  background: #fcf3df;
}
.deliverable-card h3 {
  font-size: 15px;
  line-height: 1.65;
  font-weight: 600;
  margin: 10px 0 8px;
}
.deliverable-card p {
  color: #617368;
  font-size: 13px;
  margin: 0;
  white-space: pre-line;
}
.supplement-sheet {
  margin-top: 14px;
  padding: 18px;
  background: white;
  border: 1px dashed #c7d7cd;
  border-radius: 10px;
}
.supplement-sheet h3 {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 14px;
  margin: 0 0 12px;
}
.supplement-sheet :deep(.report-markdown) + :deep(.report-markdown) {
  margin-top: 14px;
}
.forward-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}
.next-plan,
.risk-panel {
  border: 1px solid #dce5ef;
  border-radius: 14px;
  padding: 22px;
  background: #eef3f9;
}
.next-plan h2 svg {
  color: #4c7795;
}
.risk-panel {
  background: #fcf5e8;
  border-color: #ebdfc6;
}
.risk-panel h2 svg {
  color: #a67c32;
}
.next-plan :deep(.report-markdown),
.risk-panel :deep(.report-markdown) {
  background: #ffffffc9;
  border-radius: 10px;
  padding: 16px;
  border: 1px solid #ffffff;
}
.evidence-panel {
  padding: 22px;
  border: 1px solid #e2eae5;
  border-radius: 14px;
  background: white;
}
.evidence-list {
  display: grid;
  gap: 8px;
}
.evidence-list a {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #28654c;
  border: 1px solid #e3ebe6;
  background: #f8faf8;
  border-radius: 9px;
  padding: 12px;
}
.evidence-list a span {
  flex: 1;
}
.evidence-list a svg {
  flex: none;
  font-size: 18px;
}
.empty-copy {
  color: #64766b;
}
footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px 2px 0;
  color: #64766b;
  font-size: 11px;
}
footer svg {
  flex: none;
}
@container (max-width:560px) {
  .report-pulse {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 18px;
  }
  .pulse-chart {
    border-left: 0;
    border-top: 1px solid #d4e3da;
    padding: 14px 0 0;
    display: grid;
    grid-template-columns: 100px 1fr;
    column-gap: 20px;
  }
  .record-ring {
    width: 100px;
    height: 100px;
    grid-row: 1/3;
  }
  .chart-key {
    margin: 0;
  }
  .pulse-chart > small {
    text-align: left;
    margin: 4px 0 0;
  }
  .deliverable-grid {
    grid-template-columns: 1fr;
  }
  .preview-section-heading > span {
    display: none;
  }
}
@media (max-width: 600px) {
  .report-final-preview {
    padding: 14px;
    border-radius: 12px;
  }
  .preview-heading h1 {
    font-size: 22px;
  }
  .preview-eyebrow {
    flex-wrap: wrap;
  }
  .preview-eyebrow span {
    margin-left: 0;
  }
  .preview-overview,
  .delivery-section,
  .next-plan,
  .risk-panel,
  .evidence-panel {
    padding: 16px;
  }
  .pulse-metrics {
    gap: 5px;
  }
  .pulse-metrics > div {
    padding: 10px 6px;
    column-gap: 4px;
  }
  .pulse-metrics strong {
    font-size: 22px;
  }
  .pulse-copy h2 {
    font-size: 18px;
  }
  .pulse-metrics span {
    font-size: 10px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .deliverable-card {
    transition: none;
  }
  .deliverable-card:hover {
    transform: none;
  }
}
</style>
