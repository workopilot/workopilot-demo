<script setup lang="ts">
import type { ReportDraft, ReportAttachment } from '#/types/new-report';
import type {
  BusinessReportState,
  BusinessReportItem,
} from '#/types/business-report';
import { periodLabel } from '#/utils/report-period';
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { Icon } from '@iconify/vue';
import {
  Button,
  Checkbox,
  Drawer,
  Input,
  Modal,
  Select,
  Switch,
  message,
} from 'ant-design-vue';
import {
  businessProfileForPeriod,
  defaultBusinessEdits,
  newBusinessState,
} from '#/api/mock-business-reports';
import {
  reportObjects,
  followedReportObjects,
  defaultReportObject,
  scopedBusinessProfile,
} from '#/api/mock-report-objects';
import type { ReportObjectKind } from '#/api/mock-report-objects';
import { createMockResponse, mockDelay } from '#/api/mock-data';
import {
  businessSourceOptions,
  businessTemplateVersions,
  businessQuantities,
  collectBusinessReport,
} from '#/api/mock-business-report-config';
import { printReportElement } from '#/utils/report-presentation';
import BusinessReportPreview from './BusinessReportPreview.vue';
import CustomerReportContent from './CustomerReportContent.vue';
import PreviewTemplateBar from './PreviewTemplateBar.vue';
import ReportMarkdown from './ReportMarkdown.vue';
import ReportAttachments from './ReportAttachments.vue';

const props = defineProps<{
  report: ReportDraft;
  mode: 'edit' | 'preview';
  historyView?: boolean;
}>();
const emit = defineEmits<{
  preview: [];
  edit: [];
  submit: [];
  object: [id: string];
}>();
const state = ref<BusinessReportState>(newBusinessState(props.report.schemeId));
const saved = ref('');
const activeBlock = ref('outcomes');
const customerBlockTitle = (id: string, fallback: string) =>
  (
    ({
      outcomes: '工单处理情况',
      delivery: '任务与交付情况',
      tasks: '任务完成情况',
      risks: '待补充事项与协调',
      plan: '下期计划',
    }) as Record<string, string>
  )[id] ?? fallback;
const scroller = ref<HTMLElement>();
const sourceOpen = ref(false);
const evidence = ref<BusinessReportItem>();
const busy = ref('');
const previewAudience = computed(() =>
  props.report.schemeId === 'customer' ? 'customer' : 'internal',
);
const templateDraft = ref('standard-v2');
const sourceDraft = ref<string[]>([]);
const shareOpen = ref(false);
const shareTarget = ref('');
const quantities = computed(() =>
  businessQuantities(profile.value, state.value.objectId ?? ''),
);
const approval = computed(() => props.report.customerApproval);
const canShare = computed(
  () =>
    approval.value?.status === 'approved' &&
    approval.value.version === props.report.version,
);
const approvalLabel = computed(() =>
  !approval.value
    ? '待提交审批'
    : approval.value.status === 'approved'
      ? '审批通过'
      : approval.value.status === 'changes'
        ? '待修改'
        : '待运维负责人审批',
);
const visibilityOptions = [
  { label: '杨总', value: '杨总' },
  { label: '小刚', value: '小刚' },
  { label: 'PMO / 项目管理部', value: 'PMO / 项目管理部' },
  { label: '交付项目组', value: '交付项目组' },
  { label: '客户服务组', value: '客户服务组' },
  { label: '产品团队', value: '产品团队' },
  { label: '韩立', value: '韩立' },
];
const readonly = computed(() => props.report.status === 'submitted');
const objectKind = computed<ReportObjectKind>(() =>
  props.report.schemeId === 'project' ? 'project' : 'customer',
);
const objectLabel = computed(() =>
  objectKind.value === 'project' ? '项目' : '客户',
);
const availableObjects = computed(() =>
  reportObjects.filter((object) => object.kind === objectKind.value),
);
const followedIds = computed(() => followedReportObjects[objectKind.value]);
const selectedObject = computed(() =>
  availableObjects.value.find((object) => object.id === state.value.objectId),
);
const scopeDraft = ref<string[]>([]);
watch(sourceOpen, (open) => {
  if (open) {
    scopeDraft.value = [...followedIds.value];
    sourceDraft.value = [
      ...(state.value.dataSources ??
        businessSourceOptions.map((item) => item.id)),
    ];
  }
});
const profile = computed(
  () =>
    state.value.snapshots?.[state.value.scenario] ??
    businessProfileForPeriod(
      scopedBusinessProfile(
        state.value.objectId || defaultReportObject(props.report.schemeId),
        state.value.scenario,
      ),
      props.report.start,
      props.report.end,
    ),
);
const edits = computed(() => state.value.drafts[state.value.scenario]!);
const dirty = computed(() => JSON.stringify(state.value) !== saved.value);
const reviewCount = computed(
  () =>
    profile.value.blocks.filter((b) => edits.value.reviewed.includes(b.id))
      .length,
);
const role = computed(() => profile.value.role);
function toggleFollow(id: string, checked: boolean) {
  scopeDraft.value = scopeDraft.value.filter((value) => value !== id);
  if (checked) scopeDraft.value.push(id);
}
function restoreOwned() {
  scopeDraft.value = availableObjects.value
    .filter((object) => object.owned)
    .map((object) => object.id);
}
function applyScope() {
  if (readonly.value || busy.value) return;
  savePending();
  const valid: string[] = availableObjects.value
    .filter((object) => scopeDraft.value.includes(object.id))
    .map((object) => object.id);
  followedReportObjects[objectKind.value] = valid;
  sourceOpen.value = false;
  if (valid.length && !valid.includes(state.value.objectId ?? ''))
    emit('object', valid[0]!);
  message.success(
    valid.length
      ? '已保存汇报范围，取消关注不会删除已有报告'
      : '已取消全部关注，可随时重新选择汇报对象',
  );
}
function ensureScenario() {
  if (!state.value.objectId) return;
  const object = reportObjects.find((item) => item.id === state.value.objectId);
  if (!object) return;
  // Current mock business records identify the latest lifecycle stage.
  // Submitted snapshots keep their historical stage unchanged.
  if (object.kind === 'customer' && !readonly.value && !props.historyView)
    state.value.scenario = object.scenarios[object.scenarios.length - 1]!;
  if (!(object.scenarios as readonly string[]).includes(state.value.scenario))
    state.value.scenario = object.scenarios[0];
  const scenario = state.value.scenario;
  state.value.snapshots ??= {};
  state.value.snapshots[scenario] ??= collectBusinessReport(
    state.value.objectId,
    scenario,
    props.report.start,
    props.report.end,
    state.value.dataSources,
    state.value.templateVersion,
  );
  if (object.kind === 'customer' && !readonly.value && !props.historyView) {
    const fresh = collectBusinessReport(
      object.id,
      scenario,
      props.report.start,
      props.report.end,
      state.value.dataSources,
      state.value.templateVersion,
    );
    state.value.snapshots[scenario]!.serviceStartedAt ??=
      fresh.serviceStartedAt;
    state.value.snapshots[scenario]!.taskRecords ??= fresh.taskRecords;
  }
  state.value.drafts[scenario] ??= defaultBusinessEdits(
    state.value.snapshots[scenario]!,
  );
}
watch(
  () => props.report.id,
  () => {
    state.value = props.report.business
      ? JSON.parse(JSON.stringify(props.report.business))
      : newBusinessState(props.report.schemeId);
    state.value.objectId ??=
      props.report.business || props.historyView
        ? defaultReportObject(props.report.schemeId)
        : (followedIds.value[0] ?? '');
    ensureScenario();
    templateDraft.value = state.value.templateVersion ?? 'standard-v2';
    saved.value = JSON.stringify(state.value);
    activeBlock.value = 'outcomes';
    void nextTick(() => scroller.value?.scrollTo({ top: 0 }));
  },
  { immediate: true },
);
function savePending(quiet = true) {
  if (readonly.value || !selectedObject.value) return;
  if (!quiet || dirty.value)
    props.report.filledAt = new Date().toLocaleString('zh-CN');
  ensureScenario();
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
      props.report.version += 1;
    }
    props.report.business = JSON.parse(JSON.stringify(state.value));
    props.report.title =
      profile.value.name +
      ' · ' +
      (props.report.schemeId === 'project' ? '项目' : '客户') +
      periodLabel(
        props.report.period ??
          (props.report.schemeId === 'project' ? 'week' : 'month'),
      );
    props.report.summary = profile.value.conclusion;
    props.report.history.unshift(
      props.report.schemeId === 'customer'
        ? `${role.value}已保存客户月报补充与下期计划。`
        : `${role.value}已保存${profile.value.label}审查内容，已核对 ${reviewCount.value}/${profile.value.blocks.length} 节。`,
    );
    saved.value = JSON.stringify(state.value);
  }
  if (!quiet) message.success('审查补充已保存到本期演示报告');
}
onBeforeUnmount(() => {
  if (dirty.value) savePending();
});
watch(
  () => props.mode,
  async () => {
    await nextTick();
    scroller.value?.scrollTo({ top: 0 });
  },
);
async function jump(id: string) {
  activeBlock.value = id;
  if (props.mode === 'preview') emit('edit');
  await nextTick();
  const content = scroller.value;
  const root =
    content && getComputedStyle(content).overflowY === 'auto'
      ? content
      : content?.closest<HTMLElement>('.business-workspace');
  const target = root?.querySelector<HTMLElement>(`#business-edit-${id}`);
  if (root && target)
    root.scrollTo({
      top:
        target.getBoundingClientRect().top -
        root.getBoundingClientRect().top +
        root.scrollTop -
        12,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    });
}
function invalidate(id: string) {
  edits.value.reviewed = edits.value.reviewed.filter((key) => key !== id);
}
function review(id: string, checked: boolean) {
  edits.value.reviewed = edits.value.reviewed.filter((key) => key !== id);
  if (checked) edits.value.reviewed.push(id);
}
async function regenerate(scope = 'all') {
  if (readonly.value || busy.value || !selectedObject.value) return;
  const reportId = props.report.id;
  const scenario = state.value.scenario;
  busy.value = scope;
  try {
    await mockDelay(450);
    if (
      props.report.id !== reportId ||
      readonly.value ||
      state.value.scenario !== scenario
    )
      return;
    const fresh = createMockResponse(
      collectBusinessReport(
        state.value.objectId!,
        scenario,
        props.report.start,
        props.report.end,
        state.value.dataSources,
        state.value.templateVersion,
      ),
    ).data;
    if (scope === 'all') {
      state.value.snapshots![scenario] = fresh;
      edits.value.reviewed = [];
    } else {
      const snapshot = state.value.snapshots![scenario]!;
      snapshot.blocks = snapshot.blocks.map((block) =>
        block.id === scope ? fresh.blocks.find((b) => b.id === scope)! : block,
      );
      invalidate(scope);
    }
    state.value.updatedAt = new Date().toLocaleString('zh-CN', {
      hour12: false,
    });
    savePending();
    message.success('已重新整理项目数据，人工补充已保留，请重新核对生成内容');
  } finally {
    busy.value = '';
  }
}
function requestSubmit() {
  props.report.filledAt ??= new Date().toLocaleString('zh-CN');
  savePending();
  if (
    props.report.schemeId !== 'customer' &&
    reviewCount.value < profile.value.blocks.length
  ) {
    message.info(
      `请先完成剩余 ${profile.value.blocks.length - reviewCount.value} 节的事实核对`,
    );
    return;
  }
  emit('submit');
}
async function applyTemplate() {
  if (readonly.value || busy.value) return;
  state.value.templateVersion = templateDraft.value;
  state.value.snapshots = {};
  Object.values(state.value.drafts).forEach((draft) => {
    draft.reviewed = [];
  });
  ensureScenario();
  await regenerate();
}
async function applySources() {
  if (readonly.value || busy.value) return;
  if (!sourceDraft.value.length) {
    message.warning('请至少保留一个数据源');
    return;
  }
  const changed =
    JSON.stringify(sourceDraft.value) !==
    JSON.stringify(
      state.value.dataSources ?? businessSourceOptions.map((item) => item.id),
    );
  state.value.dataSources = [...sourceDraft.value];
  // Each scenario keeps its manual edits but must recollect facts after changing sources.
  if (changed) {
    state.value.snapshots = {};
    Object.values(state.value.drafts).forEach((draft) => {
      draft.reviewed = [];
    });
    ensureScenario();
  }
  applyScope();
  if (changed) await regenerate();
}
function setVisibility(values: string[]) {
  if (readonly.value) return;
  props.report.recipients = [...values];
}
function resumeRevision() {
  if (approval.value?.status !== 'changes') return;
  props.report.status = 'draft';
  edits.value.reviewed = [];
  saved.value = '';
  emit('edit');
}
function shareCustomer() {
  if (!canShare.value || !shareTarget.value.trim()) return;
  approval.value!.sharedAt = new Date().toLocaleString('zh-CN');
  approval.value!.sharedWith = shareTarget.value.trim();
  props.report.history.unshift(
    `审批通过版本 V${props.report.version} 已记录分享给 ${shareTarget.value.trim()}（演示）。`,
  );
  shareOpen.value = false;
  message.success('已记录客户分享，未发送真实消息；可导出文件后自行发送');
}
function exportReport() {
  savePending();
  const element =
    scroller.value?.querySelector<HTMLElement>('.business-preview');
  if (element) printReportElement(element, props.report.title);
}
function setFiles(block: string, files: ReportAttachment[]) {
  if (readonly.value) return;
  props.report.attachments = {
    ...props.report.attachments,
    [`business-${profile.value.id}-${block}`]: files,
  };
  invalidate(block);
}
const actionChecked = ref(false);
watch(
  () => state.value.scenario,
  () => {
    actionChecked.value = false;
    actionModal.value = false;
  },
);
const actionModal = ref(false);
const actionTitle = ref('');
const actionKind = ref('');
const actionOwner = ref('');
const actionDate = ref('');
const actionSource = ref('');
const actionResults = computed(() => {
  const plans = profile.value.blocks.find((b) => b.id === 'plan')?.items ?? [];
  const result = plans.map((item) => ({
    ...item,
    kind:
      /子任务/.test(item.status ?? '') || item.id === 'PLAN-02'
        ? '补充子任务'
        : /已有/.test(item.status ?? '')
          ? '关联已有任务或工单'
          : '创建任务',
  }));
  if (edits.value.notes.plan?.trim())
    result.push({
      id: 'MANUAL-PLAN',
      title: '负责人补充的计划',
      detail: edits.value.notes.plan,
      status: '尚无匹配结果',
      evidence: '当前报告人工计划',
      kind: '创建任务',
    });
  return result;
});
function prepareAction(item: (typeof actionResults.value)[number]) {
  actionTitle.value = item.title;
  actionKind.value = item.kind;
  actionOwner.value = profile.value.manager;
  actionDate.value =
    props.report.schemeId === 'project' ? '2026-10-30' : '2026-10-09';
  actionSource.value = item.evidence;
  actionModal.value = true;
}
function confirmAction() {
  if (
    readonly.value ||
    !actionTitle.value.trim() ||
    !actionOwner.value.trim() ||
    !actionDate.value
  )
    return;
  const target = `${profile.value.projectNames[0]} · ${actionOwner.value} · ${actionDate.value}`;
  if (
    props.report.actions.some(
      (a) => a.title === actionTitle.value && a.target === target,
    )
  ) {
    message.info('相同行动已确认，无需重复处理');
    actionModal.value = false;
    return;
  }
  props.report.actions.push({
    id: `BA-${Date.now()}`,
    title: actionTitle.value,
    target,
    kind: actionKind.value,
  });
  props.report.history.unshift(
    `${role.value}已确认${actionKind.value}：${actionTitle.value}（演示）。`,
  );
  actionModal.value = false;
  message.success('已记录人工确认的演示行动，未写入真实项目系统');
}
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
  <div class="business-container">
    <div v-if="!selectedObject" class="business-no-objects">
      <Icon icon="lucide:folder-search" />
      <h2>尚未关注需要汇报的{{ objectLabel }}</h2>
      <p>
        在数据源设置中选择汇报对象，默认推荐你负责的{{
          objectLabel
        }}。取消关注不会删除已有草稿和报告。
      </p>
      <Button type="primary" @click="sourceOpen = true"
        >选择汇报{{ objectLabel }}</Button
      >
    </div>
    <div v-else class="business-workspace">
      <main class="business-main">
        <div ref="scroller" :key="mode" class="business-scroll">
          <section
            v-if="report.schemeId === 'customer'"
            class="business-approval-strip"
          >
            <div>
              <Icon icon="lucide:shield-check" /><strong>{{
                approvalLabel
              }}</strong
              ><span>客户经理核对 → 运维负责人审批 → 客户经理分享</span>
            </div>
            <p v-if="approval?.feedback">
              运维负责人：{{ approval.feedback }} · {{ approval.score }} 分
            </p>
            <p v-if="approval?.sharedAt">
              已记录分享给 {{ approval.sharedWith }} · {{ approval.sharedAt }}
            </p>
            <Button
              v-if="approval?.status === 'changes' && readonly"
              @click="resumeRevision"
              >按反馈修改</Button
            >
            <p v-if="approval?.status === 'pending'">
              审批期间内容锁定，请在「新审核助理 → 汇报审核」完成审批。
            </p>
          </section>
          <BusinessReportPreview
            v-if="mode === 'preview'"
            :profile="profile"
            :edits="edits"
            :report="report"
            :audience="previewAudience"
          />
          <CustomerReportContent
            v-else-if="report.schemeId === 'customer'"
            :profile="profile"
            :edits="edits"
            :report="report"
            :object-id="state.objectId"
            mode="edit"
            :busy="busy"
            @regenerate="regenerate"
            @note="
              (id, text) => {
                edits.notes[id] = text;
                invalidate(id);
              }
            "
            @customer-note="
              (id, text) => {
                edits.customerNotes ??= {};
                edits.customerNotes[id] = text;
                invalidate(id);
              }
            "
            @conclusion="(text) => (edits.conclusion = text)"
            @files="setFiles"
          >
            <template #plan-actions>
              <div class="customer-plan-action">
                <span>计划先核对已有任务，执行前由你确认。</span
                ><Button size="small" @click="actionChecked = !actionChecked"
                  >检查任务覆盖</Button
                >
              </div>
              <div v-if="actionChecked" class="business-action-check">
                <article v-for="item in actionResults" :key="item.id">
                  <div>
                    <strong>{{ item.title }}</strong>
                    <p>{{ item.status }} · 建议{{ item.kind }}</p>
                  </div>
                  <Button size="small" @click="prepareAction(item)"
                    >核对并确认</Button
                  >
                </article>
              </div>
            </template>
          </CustomerReportContent>
          <template v-else>
            <section class="business-brief">
              <div class="business-brief-top">
                <span class="business-role"
                  ><Icon icon="lucide:user-round-check" />{{ role }}工作台 ·
                  {{ profile.manager }}</span
                ><span>{{
                  readonly ? '已提交 · 只读' : '草稿 · 待负责人核对'
                }}</span>
              </div>
              <h1>
                {{ profile.name
                }}<small>{{
                  `${report.schemeId === 'project' ? '项目' : '客户'}${periodLabel(report.period ?? (report.schemeId === 'project' ? 'week' : 'month'))}`
                }}</small>
              </h1>
              <p class="business-period">
                {{ report.start }} — {{ report.end }} · {{ profile.phase }}
              </p>
              <div class="business-template-picker">
                <label for="business-template-version">生成模板</label>
                <Select
                  id="business-template-version"
                  v-model:value="templateDraft"
                  :options="businessTemplateVersions"
                  :disabled="readonly || !!busy"
                />
                <Button
                  v-if="!readonly"
                  :disabled="!!busy"
                  :loading="busy === 'all'"
                  @click="applyTemplate"
                  >按此版本重新生成</Button
                >
                <p>
                  {{
                    businessTemplateVersions.find(
                      (item) => item.value === templateDraft,
                    )?.description
                  }}
                  提示词由管理员维护，你可切换版本，不能修改提示词。
                </p>
              </div>
              <div class="business-scope">
                <Icon icon="lucide:database" />
                <div>
                  <strong>{{
                    report.schemeId === 'project'
                      ? '仅采集当前项目'
                      : '仅采集当前客户的关联项目'
                  }}</strong>
                  <p>{{ profile.projectNames.join('、') }}</p>
                </div>
                <button @click="sourceOpen = true">
                  查看取数范围<Icon icon="lucide:arrow-up-right" />
                </button>
              </div>
              <div class="business-workflow">
                <span><Icon icon="lucide:database" />项目数据归集</span
                ><Icon icon="lucide:chevron-right" /><span
                  ><Icon icon="lucide:sparkles" />AI 整理草稿</span
                ><Icon icon="lucide:chevron-right" /><strong
                  ><Icon icon="lucide:user-round-check" />{{
                    role
                  }}审查补充</strong
                ><Icon icon="lucide:chevron-right" /><span
                  ><Icon icon="lucide:send" />{{
                    report.schemeId === 'customer'
                      ? '审批后分享客户'
                      : '提报 PMO / 项目负责人'
                  }}</span
                >
              </div>
            </section>
            <section class="business-edit-quantities" aria-label="本期量化概览">
              <div class="business-section-heading">
                <h2>
                  <Icon icon="lucide:chart-no-axes-combined" />本期量化概览
                </h2>
                <span>AI 归集 · 原始记录可展开</span>
              </div>
              <div v-if="quantities.length" class="business-quantity-grid">
                <article v-for="item in quantities" :key="item.label">
                  <Icon :icon="item.icon" /><span>{{ item.label }}</span
                  ><strong>{{ item.value }}</strong
                  ><small>{{ item.hint }}</small>
                </article>
              </div>
              <p v-else class="business-empty-stats">
                本周期暂无完整统计，不沿用其他周期或其他对象的数字。
              </p>
              <div v-if="profile.service" class="business-secondary-metrics">
                <span v-for="item in profile.metrics" :key="item.label"
                  >{{ item.label }} <strong>{{ item.value }}</strong></span
                >
              </div>
              <div class="business-ai-question">
                <Icon icon="lucide:lightbulb" />
                <p>
                  {{
                    report.schemeId === 'project'
                      ? 'AI 提醒：任务是否偏离计划？延期会影响哪个里程碑，需要谁在何时提供什么支持？请在下方「风险与协调」补充。'
                      : 'AI 提醒：仍未解决或已超时的问题是什么？为什么未闭环、对客户有什么影响、需要谁协助？请补充原因和下一次反馈时间。'
                  }}
                </p>
              </div>
            </section>
            <section class="business-edit-summary">
              <div class="business-section-heading">
                <h2>
                  <Icon icon="lucide:scan-text" />{{
                    report.schemeId === 'project'
                      ? '项目整体判断'
                      : '客户服务与交付结论'
                  }}
                </h2>
                <span>AI 生成 · 源事实只读</span>
              </div>
              <p>{{ profile.conclusion }}</p>
              <div class="business-manager-fields">
                <label
                  >负责人判断<Select
                    v-model:value="edits.health"
                    :disabled="readonly"
                    :options="
                      ['正常', '需关注', '延期', '待核对'].map((value) => ({
                        label: value,
                        value,
                      }))
                    " /></label
                ><label v-if="report.schemeId === 'project'"
                  >预计验收日期<Input
                    v-model:value="edits.forecast"
                    type="date"
                    :disabled="readonly"
                /></label>
              </div>
              <label
                class="business-input-label"
                :for="`business-conclusion-${report.id}`"
                >{{ role }}补充判断</label
              ><Input.TextArea
                v-if="!readonly"
                :id="`business-conclusion-${report.id}`"
                v-model:value="edits.conclusion"
                :auto-size="{ minRows: 2, maxRows: 8 }"
                placeholder="补充偏差原因、交付判断或需沟通的结论。原始事实如有错误，请回源业务系统修正。"
              /><ReportMarkdown
                v-else
                :text="edits.conclusion || '未补充判断。'"
              />
            </section>
            <section
              v-for="block in profile.blocks"
              :key="block.id"
              :id="`business-edit-${block.id}`"
              class="business-edit-block"
              :class="block.tone"
            >
              <div class="business-section-heading">
                <h2><Icon :icon="block.icon" />{{ block.title }}</h2>
                <Button
                  v-if="!readonly"
                  size="small"
                  :loading="busy === block.id"
                  :disabled="!!busy"
                  @click="regenerate(block.id)"
                  ><Icon icon="lucide:refresh-cw" />重新生成</Button
                >
              </div>
              <div class="business-generated">
                <div
                  v-if="block.metrics?.length"
                  class="business-quantity-grid"
                >
                  <article v-for="item in block.metrics" :key="item.label">
                    <Icon :icon="item.icon" /><span>{{ item.label }}</span
                    ><strong>{{ item.value }}</strong
                    ><small>{{ item.hint }}</small>
                  </article>
                </div>
                <span class="generated-label"
                  ><Icon icon="lucide:sparkles" />AI 按项目事实整理 ·
                  {{ state.updatedAt || report.generatedAt }}</span
                ><ReportMarkdown :text="block.summary" />
                <details class="business-evidence-details">
                  <summary>
                    查看原始记录与成果依据 · {{ block.items.length }} 条
                  </summary>
                  <div class="business-evidence">
                    <button
                      v-for="item in block.items"
                      :key="item.id"
                      @click="evidence = item"
                    >
                      <Icon icon="lucide:link" /><span>{{ item.title }}</span
                      ><small>{{ item.id }}</small
                      ><Icon icon="lucide:chevron-right" />
                    </button>
                    <p v-if="!block.items.length">
                      本周期暂无来源记录，请重新采集或补充经确认的事实。
                    </p>
                  </div>
                </details>
              </div>
              <div
                v-if="
                  block.id === 'risks' ||
                  block.id === 'delivery' ||
                  block.id === 'tasks'
                "
                class="business-ai-question"
              >
                <Icon icon="lucide:lightbulb" />
                <p>
                  {{
                    block.id === 'tasks'
                      ? '延期任务是否已申请延期？预计何时完成？是否需要加班处理或增加协作人员，是否影响里程碑？请补充说明。'
                      : block.id === 'risks'
                        ? '请解释异常原因、业务影响、已采取的措施，以及需要谁在何时提供什么支持。没有风险也请确认。'
                        : '计划与实际是否一致？如有延误，请解释原因、预计完成时间，以及是否影响最终交付。'
                  }}
                </p>
              </div>
              <div
                v-if="block.id === 'delivery' && profile.milestones.length"
                class="edit-milestones"
              >
                <div
                  v-for="milestone in profile.milestones"
                  :key="milestone.title"
                >
                  <Icon icon="lucide:milestone" /><strong>{{
                    milestone.title
                  }}</strong
                  ><span>计划 {{ milestone.planned }}</span
                  ><small
                    >{{ milestone.actual }} · {{ milestone.status }}</small
                  >
                </div>
              </div>
              <label
                class="business-input-label"
                :for="`business-note-${block.id}`"
                >{{
                  report.schemeId === 'customer'
                    ? '内部说明 · 不对客户展示'
                    : role + '补充'
                }}{{
                  block.id === 'plan'
                    ? '计划'
                    : block.id === 'risks'
                      ? '影响与协调诉求'
                      : '说明'
                }}</label
              ><Input.TextArea
                v-if="!readonly"
                :id="`business-note-${block.id}`"
                v-model:value="edits.notes[block.id]"
                :auto-size="{ minRows: 3, maxRows: 10 }"
                :placeholder="
                  block.id === 'plan'
                    ? '写清下一周期的目标、交付物与预期时间；AI 会建议先检查已有任务是否覆盖。'
                    : block.id === 'risks'
                      ? '补充风险影响、已采取措施、需要谁在何时提供什么支持。'
                      : '可补充成果链接、验收依据、偏差原因，或对 AI 总结的更正说明。'
                "
                @change="invalidate(block.id)"
              /><ReportMarkdown
                v-else
                :text="edits.notes[block.id] || '未补充。'"
              />
              <template v-if="report.schemeId === 'customer'">
                <label
                  class="business-input-label"
                  :for="`customer-note-${block.id}`"
                  >对客补充 · 纳入对外预览与审批</label
                >
                <Input.TextArea
                  v-if="!readonly"
                  :id="`customer-note-${block.id}`"
                  :value="edits.customerNotes?.[block.id] ?? ''"
                  :auto-size="{ minRows: 2, maxRows: 8 }"
                  placeholder="填写可向客户说明的结果、后续安排或需要客户配合的事项。"
                  @update:value="
                    (value) => {
                      edits.customerNotes ??= {};
                      edits.customerNotes[block.id] = value;
                      invalidate(block.id);
                    }
                  "
                />
                <ReportMarkdown
                  v-else
                  :text="edits.customerNotes?.[block.id] || '无对客补充。'"
                />
              </template>
              <ReportAttachments
                :files="
                  report.attachments?.[`business-${profile.id}-${block.id}`] ??
                  []
                "
                :readonly="readonly"
                :label="block.title"
                @change="setFiles(block.id, $event)"
              />
              <div class="business-review-check">
                <Checkbox
                  :checked="edits.reviewed.includes(block.id)"
                  :disabled="readonly || !!busy"
                  @change="(event) => review(block.id, event.target.checked)"
                  >我已核对本节事实、成果依据与补充说明</Checkbox
                ><span v-if="edits.reviewed.includes(block.id)"
                  ><Icon icon="lucide:circle-check" />已核对</span
                >
              </div>
              <div
                v-if="block.id === 'plan' && !readonly"
                class="business-action-check"
              >
                <div>
                  <Icon icon="lucide:workflow" /><strong
                    >计划如何落到行动？</strong
                  >
                  <p>
                    先检查本项目已有任务或工单，再由你确认关联、补充子任务或新建。
                  </p>
                </div>
                <Button @click="actionChecked = true">检查任务覆盖</Button
                ><template v-if="actionChecked"
                  ><p class="action-demo-note">
                    以下为示例任务匹配，新增的自由文本计划需人工核实匹配结果。
                  </p>
                  <article v-for="item in actionResults" :key="item.id">
                    <div>
                      <strong>{{ item.title }}</strong>
                      <p>{{ item.status }} · 建议{{ item.kind }}</p>
                    </div>
                    <Button size="small" @click="prepareAction(item)"
                      >核对并确认</Button
                    >
                  </article></template
                >
              </div>
            </section>
            <section class="business-edit-block business-distribution">
              <div class="business-section-heading">
                <h2><Icon icon="lucide:users" />提报与可见范围</h2>
              </div>
              <label class="business-input-label" for="business-visible-to"
                >授权谁可见 · 人员 / 部门</label
              >
              <Select
                id="business-visible-to"
                :value="report.recipients"
                mode="multiple"
                :options="visibilityOptions"
                :disabled="readonly"
                placeholder="选择内部授权人员或部门"
                style="width: 100%"
                @update:value="(values) => setVisibility(values as string[])"
              />
              <p>
                {{
                  report.schemeId === 'project'
                    ? '提交时默认提报 PMO / 项目管理部，可增加项目负责人。按单个项目查看，不自动合并多个项目。'
                    : '内部可见范围不等于客户分享范围。运维负责人（杨总，演示）审批通过后，客户经理才能分享对外版本。'
                }}
              </p>
            </section>
          </template>
        </div>
        <footer class="business-footer">
          <PreviewTemplateBar
            v-if="mode === 'preview'"
            :report="report"
            class="report-template-controls"
          />
          <span
            ><Icon
              :icon="
                readonly
                  ? 'lucide:lock-keyhole'
                  : dirty
                    ? 'lucide:pencil-line'
                    : 'lucide:save'
              "
            />{{
              readonly
                ? '已提交内容锁定'
                : dirty
                  ? '有待保存的审查内容'
                  : '审查内容已保存'
            }}<small v-if="report.schemeId !== 'customer'"
              >{{ reviewCount }} / {{ profile.blocks.length }} 节已核对</small
            ></span
          >
          <div>
            <Button v-if="!readonly" @click="savePending(false)"
              >保存草稿</Button
            ><Button v-if="mode === 'edit'" @click="emit('preview')"
              ><Icon icon="lucide:eye" />保存并预览</Button
            ><Button v-else @click="emit('edit')"
              >返回{{ readonly ? '内容' : '审查' }}</Button
            ><Button
              v-if="!readonly"
              type="primary"
              :disabled="!!busy"
              @click="requestSubmit"
              >{{
                report.schemeId === 'customer'
                  ? '提交运维负责人审批'
                  : '提报 PMO / 项目负责人'
              }}</Button
            >
            <Button v-if="mode === 'preview'" @click="exportReport"
              ><Icon icon="lucide:file-down" />导出 PDF</Button
            >
            <Button
              v-if="report.schemeId === 'customer' && readonly"
              type="primary"
              :disabled="!canShare"
              @click="shareOpen = true"
              ><Icon icon="lucide:share-2" />分享给客户</Button
            >
          </div>
        </footer>
      </main>
      <aside class="business-rail">
        <section
          v-if="report.schemeId === 'customer'"
          class="business-navigation"
        >
          <h3>客户月报导航</h3>
          <p>{{ profile.phase }} · 系统识别</p>
          <button
            :class="{ selected: activeBlock === 'overview' }"
            @click="jump('overview')"
          >
            <Icon icon="lucide:scan-text" /><span>客户概述与本期统计</span>
          </button>
          <button
            v-for="block in profile.blocks"
            :key="block.id"
            :class="{ selected: activeBlock === block.id }"
            @click="jump(block.id)"
          >
            <Icon :icon="block.icon" /><span>{{
              customerBlockTitle(block.id, block.title)
            }}</span>
          </button>
          <button @click="jump('supplement')">
            <Icon icon="lucide:notebook-pen" /><span>其他补充</span>
          </button>
          <p>
            补充异常原因、处理时间与协调诉求。提交运维负责人审批后，由客户经理分享。
          </p>
          <Button size="small" @click="sourceOpen = true"
            >数据源与汇报配置</Button
          >
        </section>
        <section v-else class="business-navigation">
          <h3>{{ mode === 'preview' ? '报告内容与核对' : '审查导航' }}</h3>
          <p>{{ profile.phase }} · {{ role }}负责</p>
          <button
            v-for="block in profile.blocks"
            :key="block.id"
            :class="{ selected: activeBlock === block.id }"
            @click="jump(block.id)"
          >
            <Icon :icon="block.icon" /><span>{{ block.title }}</span
            ><Icon
              :icon="
                edits.reviewed.includes(block.id)
                  ? 'lucide:circle-check'
                  : 'lucide:circle'
              "
            /></button
          ><small v-if="mode === 'preview'">点击章节，返回对应审查位置。</small>
        </section>
        <section
          v-if="report.schemeId !== 'customer'"
          class="business-boundary"
        >
          <h3><Icon icon="lucide:shield-check" />取数与分发边界</h3>
          <p>
            {{
              report.schemeId === 'project'
                ? '项目原始数据为主，已确认披露的成员素材为辅，无需等待成员周报。'
                : '客户 → 已关联项目 → 项目业务数据；不汇总其他客户项目。'
            }}
          </p>
          <p>
            {{
              report.schemeId === 'customer'
                ? '客户报告必须由运维负责人审批通过后，客户经理才可对外分享。内部说明不会出现在对外预览中。'
                : '提报 PMO / 项目负责人统一查看；指定反馈人需要评分并写意见。'
            }}源记录与附件仍按权限访问。
          </p>
          <Button size="small" @click="sourceOpen = true"
            >查看数据源与汇报范围</Button
          >
        </section>
        <section v-if="report.actions.length" class="business-confirmed">
          <h3>已确认后续行动</h3>
          <p v-for="action in report.actions" :key="action.id">
            <strong>{{ action.kind }} · {{ action.title }}</strong
            ><small>{{ action.target }}</small>
          </p>
        </section>
        <section v-if="readonly" class="business-confirmed">
          <h3>分发记录</h3>
          <p>分享：{{ report.recipients.join('、') || '未单独选择' }}</p>
          <p>指定反馈：{{ report.reviewers.join('、') || '无' }}</p>
        </section>
      </aside>
    </div>
    <Drawer
      :open="sourceOpen"
      :title="`数据源 · 汇报${objectLabel}范围`"
      :width="520"
      @close="sourceOpen = false"
      ><div class="business-scope-drawer">
        <template v-if="report.schemeId === 'customer'">
          <h3>生成模板</h3>
          <Select
            v-model:value="templateDraft"
            :options="businessTemplateVersions"
            :disabled="readonly || !!busy"
            style="width: 100%"
          /><Button
            v-if="!readonly"
            style="margin-top: 10px"
            :disabled="!!busy"
            @click="applyTemplate"
            >按此版本重新生成</Button
          >
          <h3 style="margin-top: 24px">内部可见范围</h3>
          <Select
            :value="report.recipients"
            mode="multiple"
            :options="visibilityOptions"
            :disabled="readonly"
            style="width: 100%"
            @update:value="(values) => setVisibility(values as string[])"
          />
          <p>
            客户经理提交 → 运维负责人审批 →
            客户经理分享；内部授权不等于对外分享。
          </p>
        </template>
        <h3>本报告采集的数据源</h3>
        <p>
          关闭后不参与重新生成，人工补充与附件保留。切换来源会清除相关核对状态。
        </p>
        <div
          v-for="item in businessSourceOptions"
          :key="item.id"
          class="business-source-toggle"
        >
          <div>
            <strong>{{ item.title }}</strong>
            <p>{{ item.description }}</p>
          </div>
          <Switch
            :checked="sourceDraft.includes(item.id)"
            :disabled="readonly || !!busy"
            :aria-label="`启用${item.title}`"
            @update:checked="
              (checked) => {
                sourceDraft = sourceDraft.filter((id) => id !== item.id);
                if (checked) sourceDraft.push(item.id);
              }
            "
          />
        </div>
        <div class="follow-scope-heading">
          <h3>选择需要汇报的{{ objectLabel }}</h3>
          <Button
            v-if="!readonly"
            size="small"
            :disabled="!!busy"
            @click="restoreOwned"
            >恢复我负责的</Button
          >
        </div>
        <p class="follow-scope-intro">
          默认勾选你负责的{{
            objectLabel
          }}；取消勾选即取消关注。可重新关注权限范围内的对象，已有报告会保留。
        </p>
        <div class="follow-object-list">
          <div
            v-for="object in availableObjects"
            :key="object.id"
            :class="{ followed: scopeDraft.includes(object.id) }"
          >
            <Checkbox
              :checked="scopeDraft.includes(object.id)"
              :disabled="readonly || !!busy"
              @change="(event) => toggleFollow(object.id, event.target.checked)"
              ><strong>{{ object.name }}</strong
              ><span v-if="object.owned" class="owned-object-badge"
                >我负责的</span
              ></Checkbox
            >
            <p>{{ object.description }} · 负责人：{{ object.owner }}</p>
            <small>{{
              scopeDraft.includes(object.id)
                ? '已关注 · 纳入汇报选择'
                : '未关注'
            }}</small>
          </div>
        </div>
        <p class="follow-scope-intro">
          已选择 {{ scopeDraft.length }} 个{{
            objectLabel
          }}。每个对象按周期独立成报，不合并成多项目总览。
        </p>
        <template v-if="selectedObject">
          <p>
            当前{{
              report.schemeId === 'project' ? '项目' : '客户'
            }}：<strong>{{ profile.name }}</strong>
          </p>
          <ol>
            <li v-for="step in profile.sourcePath" :key="step">{{ step }}</li>
          </ol>
          <h3>已纳入的项目</h3>
          <p v-for="name in profile.projectNames" :key="name">{{ name }}</p>
        </template>
        <h3>采集规则</h3>
        <p>
          仅采集 {{ report.start }} —
          {{ report.end }}
          范围内且有查看权限的记录；里程碑计划、当前阶段及历史验收用于对照，明确标注其时间口径。
        </p>
        <p>
          项目任务、工单、成果文件提供事实；项目经理确认披露的风险、计划补充说明。Git
          只在关联项目且已授权时参与，客户报告不直接展示代码流水。
        </p>
        <p>
          管理员配置连接器、模板与字段；你在这里调整关注的项目或客户。客户报告仍仅采集所选客户关联的项目，项目/客户关联关系在业务系统维护。
        </p>
        <p class="action-demo-note">当前为前端示例取数，不连接真实业务系统。</p>
      </div>
      <template #footer
        ><div class="follow-scope-footer">
          <Button @click="sourceOpen = false">{{
            readonly ? '关闭' : '取消'
          }}</Button
          ><Button
            v-if="!readonly"
            type="primary"
            :disabled="!!busy"
            @click="applySources"
            >保存范围与数据源</Button
          >
        </div></template
      ></Drawer
    >
    <Drawer
      :open="!!evidence"
      :title="evidence?.title"
      :width="440"
      @close="evidence = undefined"
      ><div class="business-scope-drawer">
        <p>{{ evidence?.detail }}</p>
        <h3>依据与来源</h3>
        <p>{{ evidence?.evidence }}</p>
        <p>
          此处为关联项目的演示来源快照。业务事实如有错误，应回源记录修正后重新采集。
        </p>
      </div></Drawer
    >
    <Modal
      :open="shareOpen"
      title="分享审批通过的客户报告"
      ok-text="记录分享（演示）"
      cancel-text="取消"
      :ok-button-props="{ disabled: !canShare || !shareTarget.trim() }"
      @ok="shareCustomer"
      @cancel="shareOpen = false"
    >
      <p>
        仅分享运维负责人已审批的 V{{ report.version }}
        对外版本，不包含内部协调备注。此处不发送真实消息。
      </p>
      <label for="customer-share-target">客户接收人</label
      ><Input
        id="customer-share-target"
        v-model:value="shareTarget"
        placeholder="填写客户联系人或邮箱，用于记录分享对象"
      />
    </Modal>
    <Modal
      :open="actionModal"
      :title="`确认${actionKind} · 演示`"
      ok-text="确认演示动作"
      cancel-text="暂不执行"
      :ok-button-props="{
        disabled: !actionTitle.trim() || !actionOwner.trim() || !actionDate,
      }"
      @ok="confirmAction"
      @cancel="actionModal = false"
      ><div class="business-action-form">
        <p>目标项目：{{ profile.projectNames[0] }}</p>
        <p>已有依据：{{ actionSource }}</p>
        <label>行动标题<Input v-model:value="actionTitle" /></label
        ><label>负责人<Input v-model:value="actionOwner" /></label
        ><label
          >计划完成日期<Input v-model:value="actionDate" type="date"
        /></label>
        <p>仅确认后记录演示动作，不自动创建真实任务或工单。</p>
      </div></Modal
    >
  </div>
</template>
<style scoped src="../business-report.css"></style>
<style scoped>
.business-footer {
  flex-wrap: wrap;
}
.report-template-controls {
  flex: 1 0 100%;
  padding-bottom: 10px;
  border-bottom: 1px solid #e2eae5;
}
.customer-plan-action {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 14px;
  color: #7d8e81;
  font-size: 12px;
}
</style>
