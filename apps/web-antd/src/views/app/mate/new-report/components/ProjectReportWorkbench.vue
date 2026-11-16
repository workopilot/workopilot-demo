<script setup lang="ts">
import type {
  BusinessReportState,
  BusinessReportItem,
} from '#/types/business-report';
import type {
  ReportDraft,
  ReportMaterialSection,
  ReportAttachment,
} from '#/types/new-report';
import { computed, ref, watch, onBeforeUnmount, nextTick } from 'vue';
import {
  Button,
  Drawer,
  Select,
  Switch,
  Input,
  Modal,
  message,
} from 'ant-design-vue';
import { Icon } from '@iconify/vue';
import {
  collectBusinessReport,
  businessSourceOptions,
  businessTemplateVersions,
} from '#/api/mock-business-report-config';
import {
  defaultBusinessEdits,
  newBusinessState,
} from '#/api/mock-business-reports';
import { simplifyProjectReport } from '#/api/mock-project-report';
import { mockDelay } from '#/api/mock-data';
import { printReportElement } from '#/utils/report-presentation';
import { periodLabel } from '#/utils/report-period';
import PersonalSourceCard from './PersonalSourceCard.vue';
import ProjectReportPreview from './ProjectReportPreview.vue';
import PreviewTemplateBar from './PreviewTemplateBar.vue';
const props = defineProps<{ report: ReportDraft; mode: 'edit' | 'preview' }>();
const emit = defineEmits<{ preview: []; edit: []; submit: [] }>();
const state = ref<BusinessReportState>(newBusinessState('project'));
const saved = ref('');
const busy = ref('');
const sourceOpen = ref(false);
const actionOpen = ref(false);
const actionTitle = ref('');
const actionOwner = ref('');
const actionDate = ref('');
const actionKind = ref('');
const actionTarget = ref('');
const actionModal = ref(false);
const actionCandidates = computed(() => {
  const candidates = [
    ...(profile.value.blocks.find((block) => block.id === 'plan')?.items ?? []),
  ];
  if (edits.value.notes.plan?.trim())
    candidates.push({
      id: 'manual-plan',
      title: '项目经理补充的下期计划',
      detail: edits.value.notes.plan,
      evidence: '人工计划',
    });
  return candidates.map((item) => {
    const target = profile.value.taskRecords?.find(
      (task) => task.id === item.id,
    );
    const subtask = !target && /子任务/.test(item.detail);
    return {
      ...item,
      kind: target ? '关联已有任务' : subtask ? '补充子任务' : '创建任务',
      target:
        target ??
        (subtask
          ? profile.value.taskRecords?.find((task) => task.state === 'active')
          : undefined),
    };
  });
});
const templateDraft = ref('standard-v2');
const sourceDraft = ref<string[]>([]);
const evidence = ref<BusinessReportItem>();
const scroller = ref<HTMLElement>();
const cards = ref<InstanceType<typeof PersonalSourceCard>[]>([]);
const readonly = computed(() => props.report.status === 'submitted');
const profile = computed(() => state.value.snapshots!.project!);
const edits = computed(() => state.value.drafts.project!);
const dirty = computed(() => saved.value !== JSON.stringify(state.value));
const suggestions: Record<string, string> = {
  delivery: '当前阶段是否按计划推进？补充实际进展、阶段成果及与计划的偏差。',
  tasks:
    '请核对每位负责人的任务数量、完成情况和延期任务；是否已申请延期，是否需要加班或协调支持？',
  risks:
    '补充风险影响、处理措施，以及需要谁在何时提供什么支持；没有风险可以留空。',
  plan: '补充下期目标、任务负责人、交付物与预计完成时间；优先关联已有任务，新增任务需人工确认。',
};
watch(
  () => props.report.id,
  () => {
    state.value = props.report.business
      ? JSON.parse(JSON.stringify(props.report.business))
      : newBusinessState('project');
    state.value.objectId ??= 'engine';
    state.value.scenario = 'project';
    state.value.snapshots ??= {};
    const old = state.value.snapshots.project;
    state.value.snapshots.project = simplifyProjectReport(
      old ??
        collectBusinessReport(
          state.value.objectId,
          'project',
          props.report.start,
          props.report.end,
          state.value.dataSources,
          state.value.templateVersion,
        ),
      state.value.objectId,
      !readonly.value,
    );
    state.value.drafts.project ??= defaultBusinessEdits(profile.value);
    if (
      old?.blocks.some((block) => block.id === 'outcomes') &&
      edits.value.notes.outcomes
    )
      edits.value.notes.delivery = [
        edits.value.notes.delivery,
        edits.value.notes.outcomes,
      ]
        .filter(Boolean)
        .join('\n\n');
    templateDraft.value = state.value.templateVersion ?? 'standard-v2';
    saved.value = JSON.stringify(state.value);
  },
  { immediate: true },
);
function persist(quiet = true) {
  if (readonly.value) return;
  if (
    dirty.value ||
    JSON.stringify(props.report.business) !== JSON.stringify(state.value)
  ) {
    if (props.report.business && dirty.value) {
      props.report.versions.unshift({
        business: JSON.parse(JSON.stringify(props.report.business)),
        attachments: JSON.parse(JSON.stringify(props.report.attachments ?? {})),
        version: props.report.version,
        summary: props.report.summary,
        supplement: props.report.supplement,
        plan: props.report.plan,
        risk: props.report.risk,
        status: props.report.status,
      });
      props.report.version++;
    }
    if (dirty.value || !quiet)
      props.report.filledAt = new Date().toLocaleString('zh-CN');
    props.report.business = JSON.parse(JSON.stringify(state.value));
    props.report.title = `${profile.value.name} · 项目${periodLabel(props.report.period ?? 'week')}`;
    props.report.summary =
      profile.value.blocks.find((block) => block.id === 'delivery')?.summary ??
      '';
    saved.value = JSON.stringify(state.value);
  }
  if (!quiet) message.success('项目报告已保存');
}
function savePending(quiet = true) {
  cards.value.forEach((card) => card.savePending());
  persist(quiet);
}
function supplement(id: string, note: { text: string }) {
  if (readonly.value) return;
  edits.value.notes[id] = note.text;
  props.report.filledAt = new Date().toLocaleString('zh-CN');
  persist();
}
function setFiles(id: string, files: ReportAttachment[]) {
  if (!readonly.value) {
    props.report.attachments = {
      ...props.report.attachments,
      [`business-project-${id}`]: files,
    };
    props.report.filledAt = new Date().toLocaleString('zh-CN');
  }
}
function sectionFor(id: string): ReportMaterialSection {
  const block = profile.value.blocks.find((block) => block.id === id)!;
  return {
    id: block.id,
    title: block.title,
    icon: block.icon,
    description: '',
    enabled: true,
    needsAuth: false,
    summaryFormat: 'markdown-overview',
    summary: block.summary,
    records: block.items.map((item) => ({
      id: item.id,
      title: item.title,
      kind: '项目业务记录',
      detail: `${item.owner ? `负责人：${item.owner}；` : ''}${item.status ? `状态：${item.status}；` : ''}${item.detail}`,
    })),
  };
}
async function regenerate(scope = 'all') {
  if (readonly.value || busy.value) return;
  savePending();
  busy.value = scope;
  try {
    await mockDelay(350);
    const fresh = simplifyProjectReport(
      collectBusinessReport(
        state.value.objectId!,
        'project',
        props.report.start,
        props.report.end,
        state.value.dataSources,
        state.value.templateVersion,
      ),
      state.value.objectId!,
    );
    if (scope === 'all') state.value.snapshots!.project = fresh;
    else {
      profile.value.blocks = profile.value.blocks.map((block) =>
        block.id === scope
          ? fresh.blocks.find((item) => item.id === scope)!
          : block,
      );
      if (scope === 'tasks') profile.value.taskRecords = fresh.taskRecords;
    }
    state.value.updatedAt = new Date().toLocaleString('zh-CN');
    persist();
    message.success('AI 内容已重新整理，人工补充与附件已保留');
  } finally {
    busy.value = '';
  }
}
watch(sourceOpen, (open) => {
  if (open) {
    sourceDraft.value = [
      ...(state.value.dataSources ??
        businessSourceOptions.map((item) => item.id)),
    ];
    templateDraft.value = state.value.templateVersion ?? 'standard-v2';
  }
});
async function applySources() {
  if (!sourceDraft.value.length) {
    message.warning('至少保留一个数据源');
    return;
  }
  state.value.dataSources = [...sourceDraft.value];
  state.value.templateVersion = templateDraft.value;
  sourceOpen.value = false;
  await regenerate();
}
async function jump(id: string) {
  if (props.mode === 'preview') {
    emit('edit');
    await nextTick();
  }
  scroller.value?.querySelector(`#report-${id}`)?.scrollIntoView({
    block: 'start',
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth',
  });
}
function submit() {
  savePending();
  props.report.filledAt ??= new Date().toLocaleString('zh-CN');
  emit('submit');
}
function exportPdf() {
  const element = scroller.value?.querySelector<HTMLElement>(
    '.project-final-report',
  );
  if (element) printReportElement(element, props.report.title);
}
function prepareAction(item: (typeof actionCandidates.value)[number]) {
  actionTitle.value = item.title;
  actionOwner.value = item.target?.owner ?? profile.value.manager;
  actionKind.value = item.kind;
  actionTarget.value = item.target?.id ?? state.value.objectId!;
  actionDate.value = '';
  actionModal.value = true;
}
function confirmAction() {
  if (
    readonly.value ||
    !actionTitle.value.trim() ||
    !actionOwner.value.trim() ||
    (actionKind.value !== '关联已有任务' && !actionDate.value)
  )
    return;
  const target = `${profile.value.name} / ${actionTarget.value} · ${actionOwner.value} ${actionDate.value}`;
  if (
    !props.report.actions.some(
      (action) =>
        action.title === actionTitle.value && action.target === target,
    )
  )
    props.report.actions.push({
      id: crypto.randomUUID(),
      title: actionTitle.value,
      target,
      kind: actionKind.value,
    });
  actionModal.value = false;
  message.success('已记录确认的演示行动，未创建真实任务');
}
onBeforeUnmount(() => {
  if (!readonly.value) savePending();
});
defineExpose({
  busy,
  savePending,
  regenerate,
  configure: () => {
    sourceOpen.value = true;
  },
});
</script>
<template>
  <div class="simple-project-workspace">
    <main class="simple-project-main">
      <div ref="scroller" class="simple-project-scroll">
        <ProjectReportPreview
          v-if="mode === 'preview'"
          :profile="profile"
          :edits="edits"
          :report="report"
        />
        <template v-else
          ><div class="simple-project-heading">
            <div>
              <strong>{{ profile.name }}</strong
              ><span>{{ profile.phase }}</span>
            </div>
            <small
              >项目经理 {{ profile.manager }} ·
              {{ readonly ? '已提交，只读' : '核对 AI 内容，按需补充' }}</small
            >
          </div>
          <PersonalSourceCard
            v-for="block in profile.blocks"
            :key="block.id"
            ref="cards"
            :section="sectionFor(block.id)"
            :readonly="readonly"
            :busy="!!busy"
            :allow-disable="false"
            show-summary-when-empty
            :suggestion="suggestions[block.id]"
            :note="{ kind: '项目经理补充', text: edits.notes[block.id] ?? '' }"
            :attachments="
              report.attachments?.[`business-project-${block.id}`] ?? []
            "
            @supplement="supplement(block.id, $event)"
            @files="setFiles(block.id, $event)"
            @regenerate="regenerate(block.id)"
            @configure="sourceOpen = true"
            @disable="sourceOpen = true"
            @record="
              (record) =>
                (evidence = profile.blocks
                  .flatMap((block) => block.items)
                  .find((item) => item.id === record.id))
            "
          >
            <template v-if="block.id === 'plan' && !readonly" #after-supplement
              ><div class="project-plan-actions">
                <span>计划先匹配已有任务，再确认是否新增。</span
                ><Button
                  size="small"
                  @click="
                    savePending();
                    actionOpen = true;
                  "
                  ><Icon icon="lucide:workflow" />检查任务覆盖</Button
                >
              </div></template
            >
          </PersonalSourceCard>
        </template>
      </div>
      <footer>
        <PreviewTemplateBar
          v-if="mode === 'preview'"
          :report="report"
          class="report-template-controls"
        />
        <span>{{
          readonly
            ? '已提交内容锁定'
            : dirty
              ? '有待保存的补充'
              : '补充内容已保存'
        }}</span>
        <div>
          <Button v-if="!readonly" @click="savePending(false)">保存草稿</Button
          ><Button
            v-if="mode === 'edit'"
            @click="
              savePending();
              emit('preview');
            "
            ><Icon icon="lucide:eye" />预览</Button
          ><Button v-else @click="emit('edit')"
            >返回{{ readonly ? '内容' : '编辑' }}</Button
          ><Button v-if="mode === 'preview'" @click="exportPdf"
            ><Icon icon="lucide:file-down" />导出 PDF</Button
          ><Button
            v-if="!readonly"
            type="primary"
            :disabled="!!busy"
            @click="submit"
            >提报 PMO / 项目负责人</Button
          >
        </div>
      </footer>
    </main>
    <aside>
      <h3>报告内容</h3>
      <button
        v-for="block in profile.blocks"
        :key="block.id"
        @click="jump(block.id)"
      >
        <Icon :icon="block.icon" />{{ block.title
        }}<Icon icon="lucide:chevron-right" />
      </button>
      <p>AI 总结可重新生成；补充说明和附件按模块保留。</p>
    </aside>
    <Drawer
      :open="sourceOpen"
      title="项目数据源与生成设置"
      :width="460"
      @close="sourceOpen = false"
      ><div class="simple-project-settings">
        <h3>{{ profile.name }}</h3>
        <p>仅采集当前项目，不需要等待成员个人周报。</p>
        <label>管理员开放的模板版本</label
        ><Select
          v-model:value="templateDraft"
          :options="businessTemplateVersions"
          :disabled="readonly"
          style="width: 100%"
        />
        <div
          v-for="source in businessSourceOptions"
          :key="source.id"
          class="simple-project-source"
        >
          <div>
            <strong>{{ source.title }}</strong>
            <p>{{ source.description }}</p>
          </div>
          <Switch
            :checked="sourceDraft.includes(source.id)"
            :disabled="readonly"
            :aria-label="`启用${source.title}`"
            @update:checked="
              (checked) => {
                sourceDraft = sourceDraft.filter((id) => id !== source.id);
                if (checked) sourceDraft.push(source.id);
              }
            "
          />
        </div>
      </div>
      <template #footer
        ><Button
          v-if="!readonly"
          type="primary"
          :disabled="!!busy"
          @click="applySources"
          >保存并重新生成</Button
        ></template
      ></Drawer
    >
    <Drawer
      :open="!!evidence"
      :title="evidence?.title"
      :width="440"
      @close="evidence = undefined"
      ><div class="simple-project-settings">
        <p v-if="evidence?.owner">
          负责人：{{ evidence.owner }} · {{ evidence.status }}
        </p>
        <p>{{ evidence?.detail }}</p>
        <p>{{ evidence?.evidence }}</p>
      </div></Drawer
    >
    <Drawer
      :open="actionOpen"
      title="下期计划的任务覆盖（演示）"
      :width="520"
      @close="actionOpen = false"
      ><div class="simple-project-settings">
        <p>
          以下按示例任务 ID 匹配；自由文本计划需人工核实。AI 不自动创建任务。
        </p>
        <p v-if="!actionCandidates.length">
          请先在下期计划中补充目标与交付物。
        </p>
        <article
          v-for="item in actionCandidates"
          :key="item.id"
          class="project-action-candidate"
        >
          <strong>{{ item.title }}</strong>
          <p>{{ item.detail }}</p>
          <p>
            {{
              item.target
                ? `已匹配 ${item.target.id} · ${item.target.owner}`
                : '尚无匹配任务'
            }}
            · 建议{{ item.kind }}
          </p>
          <Button size="small" @click="prepareAction(item)">核对并确认</Button>
        </article>
        <h3 v-if="report.actions.length">已确认行动</h3>
        <p v-for="action in report.actions" :key="action.id">
          {{ action.kind }} · {{ action.title }} · {{ action.target }}
        </p>
      </div></Drawer
    >
    <Modal
      :open="actionModal"
      :title="`确认${actionKind}（演示）`"
      ok-text="确认演示行动"
      cancel-text="暂不处理"
      :ok-button-props="{
        disabled:
          !actionTitle.trim() ||
          !actionOwner.trim() ||
          (actionKind !== '关联已有任务' && !actionDate),
      }"
      @ok="confirmAction"
      @cancel="actionModal = false"
      ><div class="simple-project-settings">
        <p>目标：{{ profile.name }} / {{ actionTarget }}</p>
        <label>任务标题<Input v-model:value="actionTitle" /></label
        ><label>负责人<Input v-model:value="actionOwner" /></label
        ><label v-if="actionKind !== '关联已有任务'"
          >计划完成时间<Input v-model:value="actionDate" type="date"
        /></label></div
    ></Modal>
  </div>
</template>
<style scoped>
.project-plan-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e4ebe6;
}
.project-plan-actions span {
  font-size: 12px;
  color: #809284;
}
.project-action-candidate {
  padding: 16px 0;
  border-bottom: 1px solid #e3ebe5;
}
.simple-project-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 18px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  color: #2f4d39;
}
.simple-project-main {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
}
.simple-project-scroll {
  overflow: auto;
  min-height: 0;
  flex: 1;
  overscroll-behavior: contain;
  padding: 0 3px 12px 0;
  scroll-padding: 12px;
}
.simple-project-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 22px;
  padding: 16px 18px;
  background: #eef5f0;
  border: 1px solid #dde8e0;
  border-radius: 10px;
}
.simple-project-heading > div {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.simple-project-heading strong {
  font-size: 17px;
  color: #2d5038;
}
.simple-project-heading span {
  background: white;
  border-radius: 5px;
  padding: 3px 8px;
  font-size: 12px;
  color: #5c8067;
}
.simple-project-heading small {
  color: #7b8d7e;
  font-size: 12px;
}
.simple-project-workspace aside {
  align-self: start;
  padding: 18px;
  background: #fff;
  border: 1px solid #dfe8e2;
  border-radius: 12px;
}
.simple-project-workspace aside h3 {
  font-size: 14px;
  color: #37573f;
  margin: 0 0 12px;
}
.simple-project-workspace aside button {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 8px;
  background: none;
  border: 0;
  border-radius: 7px;
  text-align: left;
  font-size: 12px;
  color: #5e7c67;
  cursor: pointer;
}
.simple-project-workspace aside button:hover {
  background: #eef5f0;
}
.simple-project-workspace aside button:focus-visible {
  outline: 2px solid #5c9471;
}
.simple-project-workspace aside button svg:last-child {
  margin-left: auto;
}
.simple-project-workspace aside p {
  font-size: 12px;
  line-height: 1.8;
  color: #859689;
  margin: 14px 0 0;
  padding-top: 12px;
  border-top: 1px solid #e7ede9;
}
.simple-project-main > footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 12px;
}
.report-template-controls {
  flex: 1 0 100%;
  padding-bottom: 10px;
  border-bottom: 1px solid #e2eae5;
}
.simple-project-main > footer > span {
  font-size: 12px;
  color: #7c9082;
}
.simple-project-main > footer > div {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.simple-project-settings {
  color: #3c5b46;
  font-size: 13px;
  line-height: 1.9;
}
.simple-project-settings h3 {
  color: #2f5039;
}
.simple-project-settings label {
  display: block;
  margin: 18px 0 8px;
  color: #51715b;
}
.simple-project-source {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid #e1e9e4;
}
.simple-project-source strong {
  color: #3b6046;
}
.simple-project-source p {
  margin: 4px 0 0;
  color: #7b9081;
  font-size: 12px;
}
@media (max-width: 1000px) {
  .simple-project-workspace {
    grid-template-columns: minmax(0, 1fr);
  }
  .simple-project-workspace aside {
    display: none;
  }
  .simple-project-heading {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
