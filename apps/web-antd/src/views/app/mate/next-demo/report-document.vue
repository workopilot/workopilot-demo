<script setup lang="ts">
import type {
  CommentKind,
  ReportEntity,
  ReportEntityType,
  WeeklyReportItem,
} from './demo-state';

import { computed, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import { Avatar, Button, Input, message, Modal } from 'ant-design-vue';
import MarkdownIt from 'markdown-it';

import {
  addComment,
  addEntityCorrection,
  addReportEntity,
  applyAllCorrections,
  buildReportOutline,
  comments,
  detectCorrectionsInText,
  detectEntitiesInText,
  evidenceItems,
  generatedReportVersions,
  getReportMarkdown,
  highlightEntitiesInHtml,
  likeCount,
  liked,
  removeEntityCorrection,
  removeReportEntity,
  reportAuthorOf,
  reportEntityCorrections,
  reportEntityDictionary,
  reportEntityTypeMeta,
  saveGeneratedReportVersion,
  sharedWith,
  submitReportInstance,
  toggleLike,
  updateReportEntity,
  withdrawReportInstance,
} from './demo-state';
import SubmitModal from './submit-modal.vue';
import SuggestedCollaboration from './suggested-collaboration.vue';

type ReportTab = 'files' | 'html' | 'markdown';

const props = defineProps<{
  archiveCollapsed?: boolean;
  readonly?: boolean;
  report: WeeklyReportItem;
  reportPeriod?:
    'biweekly' | 'custom' | 'daily' | 'monthly' | 'quarterly' | 'weekly';
  showArchiveToggle?: boolean;
}>();
const emit = defineEmits<{
  toggleArchive: [];
  updated: [report: WeeklyReportItem];
}>();

const STATUS_LABELS: Record<WeeklyReportItem['status'], string> = {
  draft: 'Markdown 草稿',
  reviewed: '已锁定周报',
  submitted: '已提交周报',
};

const markdown = new MarkdownIt({ breaks: true, html: true, linkify: true });

const status = ref<WeeklyReportItem['status']>(props.report.status);
watch(
  () => props.report.status,
  (value) => {
    status.value = value;
  },
);

const activeTab = ref<ReportTab>('markdown');
// HTML 版本：完整报告 Markdown
const rawMarkdown = ref('');
// 文本版本：精简提纲（可编辑、实体高亮、语音纠错）
const outlineMarkdown = ref('');
const draftOutline = ref('');
const editingOutline = ref(false);
const regenerating = ref(false);
const shareOpen = ref(false);
const submitOpen = ref(false);

// 互动
const commentDraft = ref('');
const commentKind = ref<CommentKind>('comment');
const replyTarget = ref<null | { author: string; id: string }>(null);

// AI 评价（草稿态）
const reviewResult = ref<null | {
  score: number;
  suggestions: string[];
  summary: string;
}>(null);
const reviewing = ref(false);

const userName = '王安康';
const canEdit = computed(() => !props.readonly && status.value === 'draft');
const canSubmit = computed(() => !props.readonly && status.value === 'draft');
const canWithdraw = computed(
  () => !props.readonly && status.value === 'submitted',
);
const canShare = computed(() => status.value !== 'draft');
const submitted = computed(() => status.value !== 'draft');

const generatedVersion = computed(
  () => generatedReportVersions.value[props.report.id],
);
const hasHtml = computed(
  () =>
    status.value !== 'draft' || generatedVersion.value?.htmlGenerated === true,
);
const outlineDirty = computed(
  () => editingOutline.value && draftOutline.value !== outlineMarkdown.value,
);

// 提纲预览渲染 + 实体/错字高亮
const renderedOutline = computed(() =>
  outlineMarkdown.value.trim() ? markdown.render(outlineMarkdown.value) : '',
);
const highlightedOutline = computed(() =>
  highlightEntitiesInHtml(
    renderedOutline.value,
    reportEntityDictionary.value,
    reportEntityCorrections.value,
  ),
);
// 左栏：命中的实体与疑似纠错
const detectedEntities = computed(() =>
  detectEntitiesInText(outlineMarkdown.value, reportEntityDictionary.value),
);
const detectedCorrections = computed(() =>
  detectCorrectionsInText(outlineMarkdown.value, reportEntityCorrections.value),
);

// 实体统计概览：按类型分组 + 总词频
const entityTypeStats = computed(() => {
  const groups = new Map<
    ReportEntityType,
    { count: number; occurrences: number }
  >();
  for (const e of detectedEntities.value) {
    const cur = groups.get(e.type) || { count: 0, occurrences: 0 };
    cur.count += 1;
    cur.occurrences += e.count;
    groups.set(e.type, cur);
  }
  return (Object.keys(reportEntityTypeMeta) as ReportEntityType[])
    .map((type) => ({
      type,
      label: type === '同事' ? '人名' : reportEntityTypeMeta[type].label,
      ...groups.get(type),
      count: groups.get(type)?.count ?? 0,
      occurrences: groups.get(type)?.occurrences ?? 0,
    }))
    .filter((s) => s.count > 0);
});

const entityTotalOccurrences = computed(() =>
  detectedEntities.value.reduce((sum, e) => sum + e.count, 0),
);

// 全部替换：一次性替换所有命中错字
function replaceAllCorrections() {
  if (detectedCorrections.value.length === 0) {
    message.info('未检测到疑似语音识别错误');
    return;
  }
  const n = detectedCorrections.value.length;
  outlineMarkdown.value = applyAllCorrections(
    outlineMarkdown.value,
    reportEntityCorrections.value,
  );
  if (editingOutline.value) {
    draftOutline.value = applyAllCorrections(
      draftOutline.value,
      reportEntityCorrections.value,
    );
  }
  message.success(`已全部替换 ${n} 处疑似错误`);
}

const statusLabel = computed(() => STATUS_LABELS[status.value] ?? '工作汇报');
const weekLabel = computed(
  () => `${props.report.month} · ${props.report.weekLabel}`,
);
const rangeLabel = computed(() => props.report.range);
const reportTitle = computed(() => props.report.title);
const reportKind = computed(() =>
  props.reportPeriod === 'daily' ? '日报' : '周报',
);
const archiveToggleLabel = computed(
  () =>
    `${props.report.month} · ${props.report.weekLabel.replace(/（.*$/, '')}`,
);

const renderedHtml = computed(() =>
  rawMarkdown.value.trim() ? markdown.render(rawMarkdown.value) : '',
);

const attachments = computed(
  () =>
    (props.report.evidenceIds || [])
      .map((id) => evidenceItems.find((item) => item.id === id))
      .filter(Boolean) as typeof evidenceItems,
);

const tabs: Array<{ icon: string; label: string; value: ReportTab }> = [
  { value: 'markdown', label: '文本版本', icon: 'lucide:file-text' },
  { value: 'html', label: 'HTML 版本', icon: 'lucide:layout-dashboard' },
  { value: 'files', label: '关联文件', icon: 'lucide:paperclip' },
];

watch(
  () => props.report.id,
  () => {
    resetEditor();
  },
  { immediate: true },
);

watch(
  () => props.report,
  () => {
    if (!editingOutline.value) {
      rawMarkdown.value = getReportMarkdown(props.report);
      outlineMarkdown.value = buildReportOutline(props.report);
    }
  },
  { immediate: true },
);

function resetEditor() {
  rawMarkdown.value = getReportMarkdown(props.report);
  outlineMarkdown.value = buildReportOutline(props.report);
  draftOutline.value = '';
  editingOutline.value = false;
  activeTab.value = 'markdown';
  reviewResult.value = null;
}

function enterOutlineEdit() {
  draftOutline.value = outlineMarkdown.value;
  activeTab.value = 'markdown';
  editingOutline.value = true;
}

function cancelOutlineEdit() {
  editingOutline.value = false;
}

function saveOutline() {
  outlineMarkdown.value = draftOutline.value;
  editingOutline.value = false;
  message.success('提纲已保存');
}

function regenerateOutline() {
  Modal.confirm({
    title: '重新生成提纲',
    content: '将基于本周工作记录重新生成提纲，当前编辑内容会丢失。是否继续？',
    okText: '重新生成',
    okType: 'primary',
    cancelText: '取消',
    onOk() {
      regenerating.value = true;
      setTimeout(() => {
        outlineMarkdown.value = buildReportOutline(props.report);
        if (editingOutline.value) draftOutline.value = outlineMarkdown.value;
        regenerating.value = false;
        message.success('已基于本周工作记录重新生成提纲');
      }, 500);
    },
  });
}

// 单个语音纠错替换
function applyOneCorrection(wrong: string, correct: string) {
  outlineMarkdown.value = outlineMarkdown.value.replaceAll(wrong, correct);
  if (editingOutline.value) {
    draftOutline.value = draftOutline.value.replaceAll(wrong, correct);
  }
  message.success(`已将「${wrong}」纠正为「${correct}」`);
}

// 预览区点击委托：点击错字标记触发替换
function handlePreviewClick(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (target.classList.contains('rd-entity-misspell')) {
    const wrong = target.dataset.wrong || '';
    const correct = target.dataset.correct || '';
    if (wrong && correct) applyOneCorrection(wrong, correct);
  }
}

// ===== 实体增删改 =====
const entityModalOpen = ref(false);
const editingEntityId = ref<null | string>(null);
const entityForm = ref({
  name: '',
  type: '同事' as ReportEntityType,
  description: '',
  meta: '',
  aliasesText: '',
});
const entityTypeOptions = (
  Object.keys(reportEntityTypeMeta) as ReportEntityType[]
).map((t) => ({
  label: t === '同事' ? '人名' : reportEntityTypeMeta[t].label,
  value: t,
}));

function openEntityModal(prefill?: Partial<ReportEntity>) {
  editingEntityId.value = prefill?.id ?? null;
  entityForm.value = {
    name: prefill?.name ?? '',
    type: (prefill?.type as ReportEntityType) ?? '同事',
    description: prefill?.description ?? '',
    meta: prefill?.meta ?? '',
    aliasesText: (prefill?.aliases || []).join('，'),
  };
  entityModalOpen.value = true;
}

function submitEntity() {
  if (!entityForm.value.name.trim()) {
    message.warning('请填写实体名称');
    return;
  }
  const aliases = entityForm.value.aliasesText
    .split(/[，,、\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const payload = {
    name: entityForm.value.name.trim(),
    type: entityForm.value.type,
    description: entityForm.value.description.trim(),
    meta: entityForm.value.meta.trim() || undefined,
    aliases,
  };
  if (editingEntityId.value) {
    updateReportEntity(editingEntityId.value, payload);
    message.success('实体已更新');
  } else {
    const ok = addReportEntity(payload);
    if (!ok) {
      message.warning('该实体已存在');
      return;
    }
    message.success('实体已新增');
  }
  entityModalOpen.value = false;
}

function deleteEntity(entity: ReportEntity) {
  Modal.confirm({
    title: '删除实体',
    content: `确定删除实体「${entity.name}」吗？删除后正文将不再高亮该词。`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    onOk() {
      removeReportEntity(entity.id);
      message.success('已删除');
    },
  });
}

// ===== 纠错规则增删 =====
const correctionModalOpen = ref(false);
const correctionForm = ref({ wrong: '', correct: '', reason: '' });

function openCorrectionModal() {
  correctionForm.value = { wrong: '', correct: '', reason: '' };
  correctionModalOpen.value = true;
}

function submitCorrection() {
  if (
    !correctionForm.value.wrong.trim() ||
    !correctionForm.value.correct.trim()
  ) {
    message.warning('请填写错词与正确词');
    return;
  }
  const ok = addEntityCorrection({
    wrong: correctionForm.value.wrong.trim(),
    correct: correctionForm.value.correct.trim(),
    reason: correctionForm.value.reason.trim() || '自定义纠错规则',
  });
  if (!ok) {
    message.warning('该错词规则已存在');
    return;
  }
  correctionModalOpen.value = false;
  message.success('纠错规则已添加');
}

function ignoreCorrection(wrong: string) {
  removeEntityCorrection(wrong);
  message.success('已忽略该规则');
}

// ===== 选区标记为实体 =====
const outlineTextarea = ref<HTMLTextAreaElement>();

function markSelectionAsEntity() {
  const ta = outlineTextarea.value;
  if (!ta) {
    message.info('请先进入编辑态');
    return;
  }
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const selected = draftOutline.value.slice(start, end).trim();
  if (!selected) {
    message.warning('请先在文本中选中要标记为实体的文字');
    return;
  }
  openEntityModal({ name: selected });
}

function submitReport() {
  if (canEdit.value && outlineDirty.value) {
    message.warning('存在未保存的修改，请先点击「保存」再提交');
    activeTab.value = 'markdown';
    return;
  }
  submitOpen.value = true;
}

function handleSubmitted() {
  status.value = 'submitted';
  submitReportInstance(props.report.id);
  if (!generatedVersion.value?.htmlGenerated) {
    saveGeneratedReportVersion({
      reportId: props.report.id,
      markdown: getReportMarkdown(props.report),
      prompt: '提交时自动生成 HTML',
      templateId: 'executive',
      generatedAt: '刚刚',
      htmlGenerated: true,
    });
  }
  emit('updated', { ...props.report, status: 'submitted' });
}

function withdrawReport() {
  Modal.confirm({
    title: '撤回周报',
    content: '撤回后周报将退回草稿状态，可重新编辑再次提交。确定要撤回吗？',
    okText: '撤回',
    okType: 'primary',
    cancelText: '取消',
    onOk() {
      status.value = 'draft';
      withdrawReportInstance(props.report.id);
      emit('updated', { ...props.report, status: 'draft' });
      message.success('已撤回为草稿');
    },
  });
}

function openShare() {
  shareOpen.value = true;
  message.success('分享链接已复制（Demo）');
}

// 互动
function handleCommentEnter(event: KeyboardEvent) {
  if (event.isComposing) return;
  if (!(event.ctrlKey || event.metaKey)) return;
  submitComment();
}

function submitComment() {
  if (!commentDraft.value.trim()) {
    message.warning('请先填写评论内容');
    return;
  }
  addComment(commentDraft.value.trim(), commentKind.value);
  commentDraft.value = '';
  replyTarget.value = null;
  message.success('评论已发表');
}

function startReply(id: string, author: string) {
  replyTarget.value = { id, author };
}

function cancelReply() {
  replyTarget.value = null;
}

// AI 评价
async function startReview() {
  if (!canEdit.value) return;
  reviewing.value = true;
  await new Promise((resolve) => setTimeout(resolve, 700));
  reviewResult.value = {
    score: Math.min(94, props.report.score),
    summary: `本周主线清晰，覆盖 ${props.report.highlights.length} 项核心成果，存在 ${props.report.blockers.length} 项待解决问题。`,
    suggestions: [
      '建议为已完成成果补充验证证据或业务价值说明。',
      '跨部门协作事项请明确责任人与完成时间。',
      '下周计划建议增加可量化的验收标准。',
    ],
  };
  reviewing.value = false;
  message.success('AI 评价已生成');
}

function attachmentIcon(type: string) {
  if (type === 'audio') return 'lucide:audio-lines';
  if (type === 'video') return 'lucide:video';
  if (type === 'image') return 'lucide:image';
  return 'lucide:file-text';
}
</script>

<template>
  <article class="report-workbench">
    <header class="workbench-header">
      <button
        v-if="showArchiveToggle"
        class="archive-collapse-trigger"
        type="button"
        :aria-label="archiveCollapsed ? '展开汇报档案' : '折叠汇报档案'"
        :title="archiveCollapsed ? '展开汇报档案' : '折叠汇报档案'"
        @click="emit('toggleArchive')"
      >
        <span>{{ archiveToggleLabel }}</span>
        <Icon
          :icon="
            archiveCollapsed ? 'lucide:chevron-right' : 'lucide:chevron-left'
          "
        />
      </button>
      <div class="report-identity">
        <span class="status-line">
          {{ statusLabel }}
          <template v-if="weekLabel">· {{ weekLabel }}</template>
        </span>
        <h1>{{ reportTitle }}</h1>
        <p>
          {{ userName }}
          <template v-if="rangeLabel">· {{ rangeLabel }}</template>
        </p>
      </div>
      <div class="header-actions">
        <Button v-if="canShare" class="white-button" @click="openShare">
          <Icon icon="lucide:share-2" />
          分享
        </Button>
        <Button v-if="canSubmit" class="brand-button" @click="submitReport">
          <Icon icon="lucide:send" />
          提交
        </Button>
        <Button v-if="canWithdraw" class="white-button" @click="withdrawReport">
          <Icon icon="lucide:undo-2" />
          撤回
        </Button>
      </div>
    </header>

    <nav class="report-tabs" aria-label="周报内容切换">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        role="tab"
        :aria-selected="activeTab === tab.value"
        :class="{ 'is-active': activeTab === tab.value }"
        @click="activeTab = tab.value"
      >
        <Icon :icon="tab.icon" />
        {{ tab.label }}
        <span v-if="tab.value === 'files'">{{ attachments.length }}</span>
        <em v-if="tab.value === 'html' && canEdit && !hasHtml">未生成</em>
      </button>
    </nav>

    <!-- HTML 版本 -->
    <section v-if="activeTab === 'html'" class="tab-panel html-tab-panel">
      <div class="html-preview-layout" :class="{ 'is-solo': !submitted }">
        <main class="html-canvas-shell">
          <div class="html-embed-frame">
            <div class="browser-chrome">
              <span></span>
              <span></span>
              <span></span>
              <div>周报 HTML 版本 · {{ weekLabel }}</div>
            </div>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div
              v-if="renderedHtml"
              class="html-embed-body markdown-body"
              v-html="renderedHtml"
            ></div>
            <div v-else class="html-empty">
              <Icon icon="lucide:file-code-2" />
              <p>尚未生成 HTML 版本</p>
              <small>在「文本版本」中点击「生成 HTML」即可产出新周报</small>
            </div>
          </div>
        </main>

        <aside v-if="submitted" class="html-side-column">
          <!-- 建议协同数字员工 -->
          <SuggestedCollaboration
            :report-id="report.id"
            :reporter-name="reportAuthorOf(report.id)"
            :period-label="report.title"
            source="report-copilot"
          />

          <!-- 点赞 -->
          <section class="like-stream">
            <button
              type="button"
              class="like-button"
              :class="{ 'is-active': liked }"
              @click="toggleLike"
            >
              <Icon icon="lucide:thumbs-up" />
              {{ liked ? '已点赞' : '点赞' }}
            </button>
            <div v-if="likeCount > 0" class="like-names">
              <Icon icon="lucide:thumbs-up" />
              <p>{{ likeCount }} 人点赞</p>
            </div>
          </section>

          <!-- 分享对象 -->
          <section v-if="sharedWith.length > 0" class="leader-feedback">
            <header>
              <span>
                <Icon icon="lucide:share-2" />
                <b>分享对象</b>
              </span>
              <em>{{ sharedWith.length }} 位</em>
            </header>
            <article v-for="(s, i) in sharedWith" :key="i" class="approved">
              <Avatar :size="34" class="feedback-avatar">
                {{ s.charAt(0) }}
              </Avatar>
              <div class="feedback-body">
                <header>
                  <b>{{ s }}</b>
                </header>
              </div>
            </article>
          </section>

          <section class="sidebar-divider">
            <span>公开评论 · {{ comments.length }} 条</span>
            <i></i>
          </section>

          <section class="comment-feed">
            <div v-if="comments.length === 0" class="comment-empty">
              暂无评论
            </div>
            <article
              v-for="item in comments"
              :key="item.id"
              class="comment-item"
            >
              <Avatar :size="36" class="comment-avatar">
                {{ item.avatar }}
              </Avatar>
              <div class="comment-body">
                <header>
                  <b>{{ item.author }}</b>
                  <small>{{ item.createdAt }}</small>
                </header>
                <p>{{ item.content }}</p>
                <div class="comment-actions">
                  <button
                    type="button"
                    @click="startReply(item.id, item.author)"
                  >
                    回复
                  </button>
                </div>
                <div
                  v-for="reply in item.replies"
                  :key="reply.author + reply.createdAt"
                  class="nested-reply"
                >
                  <Avatar :size="28" class="comment-avatar">
                    {{ reply.author.charAt(0) }}
                  </Avatar>
                  <div class="comment-body">
                    <header>
                      <b>{{ reply.author }}</b>
                      <small>{{ reply.createdAt }}</small>
                    </header>
                    <p>{{ reply.content }}</p>
                  </div>
                </div>
              </div>
            </article>
          </section>

          <section class="comment-compose">
            <div v-if="replyTarget" class="replying">
              <span>正在回复 {{ replyTarget.author }}</span>
              <button type="button" @click="cancelReply">取消</button>
            </div>
            <Input.TextArea
              v-model:value="commentDraft"
              :rows="3"
              placeholder="评论这份周报…（Ctrl+Enter 发送）"
              @press-enter="handleCommentEnter"
            />
            <Button type="primary" block @click="submitComment">
              {{ replyTarget ? `回复 ${replyTarget.author}` : '发表评论' }}
            </Button>
          </section>
        </aside>
      </div>
    </section>

    <!-- 文本版本 -->
    <section
      v-else-if="activeTab === 'markdown'"
      class="tab-panel markdown-tab-panel"
    >
      <div class="markdown-tab-layout" :class="{ 'is-solo': !canEdit }">
        <!-- 左：实体说明 + 语音纠错 -->
        <aside class="entity-side-panel">
          <!-- 实体统计概览 -->
          <!--          <section class="entity-section">-->
          <!--            <header>-->
          <!--              <span><Icon icon="lucide:chart-pie" /><b>实体统计</b></span>-->
          <!--              <em>{{ entityTotalOccurrences }}</em>-->
          <!--            </header>-->
          <!--            <div class="stat-grid">-->
          <!--              <div-->
          <!--                v-for="s in entityTypeStats"-->
          <!--                :key="s.type"-->
          <!--                class="stat-item"-->
          <!--                :class="`is-${s.type}`"-->
          <!--              >-->
          <!--                <span class="stat-icon"><Icon :icon="reportEntityTypeMeta[s.type].icon" /></span>-->
          <!--                <div>-->
          <!--                  <strong>{{ s.occurrences }}</strong>-->
          <!--                  <small>{{ s.label }} · {{ s.count }} 个</small>-->
          <!--                </div>-->
          <!--              </div>-->
          <!--              <div v-if="!entityTypeStats.length" class="entity-empty">-->
          <!--                <Icon icon="lucide:search-x" />未识别到实体-->
          <!--              </div>-->
          <!--            </div>-->
          <!--          </section>-->

          <section class="entity-section">
            <header>
              <span>
                <Icon icon="lucide:boxes" />
                <b>实体说明</b>
              </span>
              <em>{{ detectedEntities.length }}</em>
              <button
                type="button"
                class="entity-add-btn"
                title="新增实体"
                @click="openEntityModal()"
              >
                <Icon icon="lucide:plus" />
              </button>
            </header>
            <div class="entity-list">
              <div
                v-for="e in detectedEntities"
                :key="e.id"
                class="entity-item"
                :class="`is-${e.type}`"
              >
                <span class="entity-icon">
                  <Icon :icon="reportEntityTypeMeta[e.type].icon" />
                </span>
                <span class="entity-copy">
                  <b>{{ e.name }}</b>
                  <small>
                    {{ reportEntityTypeMeta[e.type].label }}
                    <template v-if="e.meta">· {{ e.meta }}</template>
                    <template v-if="e.aliases?.length">
                      · {{ e.aliases.join('、') }}
                    </template>
                  </small>
                </span>
                <span class="entity-ops">
                  <button
                    type="button"
                    title="编辑"
                    @click="openEntityModal(e)"
                  >
                    <Icon icon="lucide:pen" />
                  </button>
                  <button type="button" title="删除" @click="deleteEntity(e)">
                    <Icon icon="lucide:trash-2" />
                  </button>
                </span>
                <span class="entity-count">×{{ e.count }}</span>
              </div>
              <div v-if="detectedEntities.length === 0" class="entity-empty">
                <Icon icon="lucide:search-x" />
                未识别到实体
              </div>
            </div>
          </section>

          <!--          <section class="entity-section">-->
          <!--            <header>-->
          <!--              <span><Icon icon="lucide:wand-sparkles" /><b>疑似语音纠错</b></span>-->
          <!--              <em>{{ detectedCorrections.length }}</em>-->
          <!--            </header>-->
          <!--            <div class="correction-list">-->
          <!--              <div-->
          <!--                v-for="c in detectedCorrections"-->
          <!--                :key="c.wrong"-->
          <!--                class="correction-item"-->
          <!--              >-->
          <!--                <div class="correction-copy">-->
          <!--                  <span class="wrong">{{ c.wrong }}</span>-->
          <!--                  <Icon icon="lucide:arrow-right" />-->
          <!--                  <span class="correct">{{ c.correct }}</span>-->
          <!--                  <small>{{ c.reason }}</small>-->
          <!--                </div>-->
          <!--                <span class="correction-ops">-->
          <!--                  <button type="button" title="替换" @click="applyOneCorrection(c.wrong, c.correct)">-->
          <!--                    <Icon icon="lucide:replace" />-->
          <!--                  </button>-->
          <!--                  <button type="button" title="忽略（删除规则）" @click="ignoreCorrection(c.wrong)">-->
          <!--                    <Icon icon="lucide:x" />-->
          <!--                  </button>-->
          <!--                </span>-->
          <!--              </div>-->
          <!--              <div v-if="!detectedCorrections.length" class="entity-empty">-->
          <!--                <Icon icon="lucide:check-circle" />未检测到错字-->
          <!--              </div>-->
          <!--            </div>-->
          <!--            <div class="correction-actions">-->
          <!--              <Button-->
          <!--                v-if="detectedCorrections.length"-->
          <!--                size="small"-->
          <!--                type="primary"-->
          <!--                ghost-->
          <!--                @click="replaceAllCorrections"-->
          <!--              >-->
          <!--                <Icon icon="lucide:check-check" />全部替换-->
          <!--              </Button>-->
          <!--              <Button size="small" @click="openCorrectionModal">-->
          <!--                <Icon icon="lucide:plus" />添加纠错规则-->
          <!--              </Button>-->
          <!--            </div>-->
          <!--          </section>-->
        </aside>

        <!-- 中：提纲编辑/预览 -->
        <div class="markdown-tab-main">
          <div class="tab-content-toolbar">
            <div>
              <strong>内容提纲</strong>
              <span>
                {{
                  editingOutline
                    ? outlineDirty
                      ? '有未保存修改'
                      : '编辑中'
                    : '预览模式'
                }}
              </span>
            </div>
            <div v-if="canEdit">
              <Button v-if="!editingOutline" @click="enterOutlineEdit">
                <Icon icon="lucide:pen-line" />
                编辑文本
              </Button>
              <template v-else>
                <Button @click="cancelOutlineEdit">取消</Button>
                <Button type="primary" @click="saveOutline">
                  <Icon icon="lucide:save" />
                  保存
                </Button>
                <Button @click="markSelectionAsEntity">
                  <Icon icon="lucide:highlighter" />
                  标记选中为实体
                </Button>
              </template>
              <Button
                class="brand-button"
                :loading="regenerating"
                @click="regenerateOutline"
              >
                <Icon v-if="!regenerating" icon="lucide:wand-sparkles" />
                重新生成
              </Button>
            </div>
            <div v-else>
              <Button @click="activeTab = 'html'">
                <Icon icon="lucide:layout-dashboard" />
                查看 HTML
              </Button>
            </div>
          </div>

          <textarea
            v-if="editingOutline && canEdit"
            ref="outlineTextarea"
            v-model="draftOutline"
            class="markdown-source"
            spellcheck="false"
            aria-label="提纲编辑器"
          ></textarea>
          <div
            v-else
            class="markdown-preview-paper"
            @click="handlePreviewClick"
          >
            <div class="paper-meta">
              {{ weekLabel }}
              <template v-if="rangeLabel">· {{ rangeLabel }}</template>
            </div>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div class="markdown-body" v-html="highlightedOutline"></div>
            <div v-if="!renderedOutline" class="markdown-empty">
              暂无提纲内容，编辑后保存即可预览。
            </div>
          </div>
        </div>

        <aside v-if="canEdit" class="markdown-tab-aside">
          <section class="draft-ai-card">
            <header>
              <span>
                <Icon icon="lucide:sparkles" />
                <b>AI 评价</b>
              </span>
              <em>仅草稿</em>
            </header>
            <template v-if="reviewResult">
              <div class="draft-score">
                <div class="draft-score-meta">
                  <span>综合评分</span>
                  <small>AI 评审</small>
                </div>
                <strong>{{ reviewResult.score }}</strong>
              </div>
              <article
                v-if="reviewResult.summary"
                class="review-block review-summary"
              >
                <b>
                  <Icon icon="lucide:file-text" />
                  评审总结
                </b>
                <p>{{ reviewResult.summary }}</p>
              </article>
              <article
                v-if="reviewResult.suggestions.length > 0"
                class="review-block"
              >
                <b>
                  <Icon icon="lucide:lightbulb" />
                  改进建议
                </b>
                <ul class="suggestion-list">
                  <li
                    v-for="(s, i) in reviewResult.suggestions"
                    :key="`sug-${i}`"
                    class="suggestion-item"
                  >
                    <em>{{ i + 1 }}</em>
                    <p class="suggestion-text">{{ s }}</p>
                  </li>
                </ul>
              </article>
            </template>
            <template v-else>
              <article>
                <b>暂未生成 AI 评价</b>
                <p>
                  点击下方按钮发起 AI 评价：对当前 Markdown
                  周报打分并给出改进建议。
                </p>
              </article>
              <Button
                class="adopt-button"
                block
                :loading="reviewing"
                @click="startReview"
              >
                <Icon v-if="!reviewing" icon="lucide:scan-search" />
                {{ reviewing ? '正在评价…' : '开始 AI 评价' }}
              </Button>
            </template>
          </section>
        </aside>
      </div>
    </section>

    <!-- 关联文件 -->
    <section v-else class="tab-panel files-tab-panel">
      <div class="tab-content-toolbar">
        <div>
          <strong>关联文件</strong>
          <span>共 {{ attachments.length }} 份材料，作为周报内容依据</span>
        </div>
      </div>
      <div class="files-tab-list">
        <div v-for="item in attachments" :key="item.id" class="files-tab-row">
          <span class="files-tab-icon">
            <Icon :icon="attachmentIcon(item.type)" />
          </span>
          <span class="files-tab-copy">
            <b>{{ item.name }}</b>
            <small>{{ item.meta }}</small>
          </span>
          <span class="files-tab-actions">
            <button type="button" class="context-action-btn" title="预览">
              <Icon icon="lucide:eye" />
            </button>
          </span>
        </div>
        <div v-if="attachments.length === 0" class="files-tab-empty">
          <Icon icon="lucide:inbox" />
          <p>暂无关联资料</p>
          <small>AI 汇总时会自动关联工作记录附件</small>
        </div>
      </div>
    </section>

    <Modal
      v-model:open="shareOpen"
      title="分享周报"
      :width="520"
      :footer="null"
      destroy-on-close
    >
      <div class="share-body">
        <p>已生成可对外分享的 HTML 链接（Demo）：</p>
        <Input
          :value="`/report-share.html?reportId=${props.report.id}`"
          readonly
        />
      </div>
    </Modal>

    <SubmitModal
      v-model:open="submitOpen"
      :auto-html="!hasHtml"
      :report-kind="reportKind"
      @submitted="handleSubmitted"
    />

    <!-- 新增/编辑实体 -->
    <Modal
      v-model:open="entityModalOpen"
      :title="editingEntityId ? '编辑实体' : '新增实体'"
      :width="480"
      destroy-on-close
      @ok="submitEntity"
    >
      <div class="entity-form">
        <label>
          <span>名称</span>
          <Input
            v-model:value="entityForm.name"
            placeholder="实体名称"
            size="large"
          />
        </label>
        <label>
          <span>类型</span>
          <Select
            v-model:value="entityForm.type"
            :options="entityTypeOptions"
            size="large"
            style="width: 100%"
          />
        </label>
        <label>
          <span>描述 / 部门 / 职位</span>
          <Input
            v-model:value="entityForm.description"
            placeholder="如：产品研发部 / 负责人"
            size="large"
          />
        </label>
        <label>
          <span>别名 / 昵称（逗号分隔）</span>
          <Input
            v-model:value="entityForm.aliasesText"
            placeholder="如：安康，王工，老王"
            size="large"
          />
        </label>
      </div>
    </Modal>

    <!-- 添加纠错规则 -->
    <Modal
      v-model:open="correctionModalOpen"
      title="添加纠错规则"
      :width="480"
      destroy-on-close
      @ok="submitCorrection"
    >
      <div class="entity-form">
        <label>
          <span>错词</span>
          <Input
            v-model:value="correctionForm.wrong"
            placeholder="语音识别出现的错字"
            size="large"
          />
        </label>
        <label>
          <span>正确词</span>
          <Input
            v-model:value="correctionForm.correct"
            placeholder="应为的正确实体名"
            size="large"
          />
        </label>
        <label>
          <span>理由</span>
          <Input
            v-model:value="correctionForm.reason"
            placeholder="如：同音字识别错误"
            size="large"
          />
        </label>
      </div>
    </Modal>
  </article>
</template>

<style scoped>
.report-workbench {
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: #fff;
}

/* 头部 */
.workbench-header {
  display: flex;
  flex: none;
  gap: 14px;
  align-items: center;
  padding: 16px 22px;
  background: linear-gradient(180deg, #f6fbf9, #fff);
  border-bottom: 1px solid #e2ece8;
}

.archive-collapse-trigger {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  flex: none;
  padding: 6px 10px;
  font-size: 12px;
  color: #0b6e65;
  cursor: pointer;
  background: #e8f5f0;
  border: 1px solid #c2dfd6;
  border-radius: 8px;
}

.report-identity {
  flex: 1;
  min-width: 0;
}

.status-line {
  font-size: 12px;
  font-weight: 700;
  color: #087565;
  letter-spacing: 0.04em;
}

.report-identity h1 {
  margin: 4px 0 2px;
  font-size: 20px;
  font-weight: 700;
  color: #163f35;
}

.report-identity p {
  margin: 0;
  font-size: 12px;
  color: #6f847d;
}

.header-actions {
  display: flex;
  flex: none;
  gap: 8px;
}

.white-button {
  color: #0b6e65 !important;
  background: #fff !important;
  border-color: #c2dfd6 !important;
}

.brand-button {
  color: #fff !important;
  background: #0b6e65 !important;
  border-color: #0b6e65 !important;
}

/* tabs */
.report-tabs {
  display: flex;
  flex: none;
  gap: 4px;
  padding: 0 18px;
  background: #fbfdfc;
  border-bottom: 1px solid #e2ece8;
}

.report-tabs button {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  color: #6b8079;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-bottom: 2px solid transparent;
}

.report-tabs button.is-active {
  color: #0b6e65;
  border-bottom-color: #0b6e65;
}

.report-tabs button span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 16px;
  padding: 0 5px;
  font-size: 10px;
  color: #6b8079;
  background: #eef5f2;
  border-radius: 999px;
}

.report-tabs button em {
  font-size: 10px;
  font-style: normal;
  color: #c2761c;
}

/* tab 面板 */
.tab-panel {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.tab-content-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 22px;
  background: #fbfdfc;
  border-bottom: 1px solid #edf3f0;
}

.tab-content-toolbar strong {
  font-size: 13px;
  color: #163f35;
}

.tab-content-toolbar span {
  margin-left: 8px;
  font-size: 12px;
  color: #94a3b8;
}

/* HTML tab */
.html-preview-layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 16px;
  padding: 16px 22px;
}

.html-preview-layout.is-solo {
  grid-template-columns: 1fr;
}

.html-canvas-shell {
  min-width: 0;
}

.html-embed-frame {
  overflow: hidden;
  background: #fff;
  border: 1px solid #e2ece8;
  border-radius: 10px;
  box-shadow: 0 6px 18px rgb(18 57 45 / 5%);
}

.browser-chrome {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 9px 14px;
  background: #f1f6f4;
  border-bottom: 1px solid #e2ece8;
}

.browser-chrome span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #d4e3de;
}

.browser-chrome div {
  flex: 1;
  margin-left: 8px;
  font-size: 12px;
  color: #6f847d;
}

.html-embed-body {
  padding: 22px 26px;
  font-size: 14px;
  line-height: 1.75;
  color: #2d4a44;
}

.html-empty {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  padding: 60px 20px;
  color: #94a3b8;
}

.html-empty svg {
  font-size: 34px;
}

.html-empty p {
  margin: 0;
  font-size: 14px;
}

.html-empty small {
  font-size: 12px;
}

/* 侧栏 */
.html-side-column {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.like-stream {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 12px;
  background: #fff;
  border: 1px solid #e2ece8;
  border-radius: 10px;
}

.like-button {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 6px 14px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  background: #f7fbf9;
  border: 1px solid #dceae4;
  border-radius: 999px;
}

.like-button.is-active {
  color: #fff;
  background: #0b6e65;
  border-color: #0b6e65;
}

.like-names {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 12px;
  color: #6b8079;
}

.leader-feedback {
  padding: 14px;
  background: #fff;
  border: 1px solid #e2ece8;
  border-radius: 10px;
}

.leader-feedback header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 13px;
}

.leader-feedback header span {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  color: #163f35;
}

.leader-feedback article {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #edf3f0;
}

.feedback-avatar {
  flex: none;
  color: #0b6e65 !important;
  background: #d8efe8 !important;
}

.feedback-body header {
  display: flex;
  gap: 8px;
  align-items: baseline;
}

.sidebar-divider {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
  color: #5d756e;
}

.sidebar-divider i {
  flex: 1;
  height: 1px;
  background: #e2ece8;
}

.comment-feed {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: #fff;
  border: 1px solid #e2ece8;
  border-radius: 10px;
}

.comment-empty {
  padding: 14px;
  font-size: 12px;
  color: #94a3b8;
  text-align: center;
}

.comment-item {
  display: flex;
  gap: 10px;
}

.comment-avatar {
  flex: none;
  color: #0b6e65 !important;
  background: #d8efe8 !important;
}

.comment-body {
  flex: 1;
  min-width: 0;
}

.comment-body header {
  display: flex;
  gap: 8px;
  align-items: baseline;
  font-size: 12px;
}

.comment-body header small {
  color: #94a3b8;
}

.comment-body p {
  margin: 4px 0;
  font-size: 13px;
  line-height: 1.6;
  color: #2d4a44;
}

.comment-actions {
  display: flex;
  gap: 10px;
  font-size: 12px;
}

.comment-actions button {
  padding: 0;
  color: #0b6e65;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.nested-reply {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  padding-left: 4px;
  border-left: 2px solid #edf3f0;
}

.comment-compose {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #fff;
  border: 1px solid #e2ece8;
  border-radius: 10px;
}

.replying {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #0b6e65;
}

.replying button {
  padding: 0;
  font-size: 12px;
  color: #94a3b8;
  cursor: pointer;
  background: transparent;
  border: 0;
}

/* Markdown tab */
.markdown-tab-layout {
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr) 300px;
  gap: 16px;
  padding: 16px 22px;
}

.markdown-tab-layout.is-solo {
  grid-template-columns: 250px minmax(0, 1fr);
}

/* 左：实体说明栏 */
.entity-side-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.entity-section {
  overflow: hidden;
  background: #fff;
  border: 1px solid #e2ece8;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgb(22 61 51 / 5%);
}

.entity-section > header {
  display: flex;
  gap: 7px;
  align-items: center;
  padding: 11px 13px;
  color: #174e42;
  background: linear-gradient(135deg, #def1eb, #f1f8f5);
  border-bottom: 1px solid #e3ece9;
}

.entity-section > header span {
  display: flex;
  flex: 1;
  gap: 6px;
  align-items: center;
  font-size: 13px;
}

.entity-section > header em {
  padding: 2px 7px;
  font-size: 11px;
  font-style: normal;
  color: #fff;
  background: #087565;
  border-radius: 99px;
}

.entity-list,
.correction-list {
  display: flex;
  flex-direction: column;
  padding: 6px;
  max-height: 280px;
  overflow: auto;
}

.entity-item {
  display: flex;
  gap: 9px;
  align-items: center;
  width: 100%;
  padding: 8px 8px;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-bottom: 1px solid #f1f6f3;
}

.entity-item:last-child {
  border-bottom: 0;
}

.entity-item:hover {
  background: #f3f8f6;
}

.entity-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  font-size: 15px;
  border-radius: 7px;
  flex: none;
}

.entity-item.is-项目 .entity-icon {
  color: #0d6853;
  background: #e8ffea;
}
.entity-item.is-产品 .entity-icon {
  color: #16a34a;
  background: #f0fdf4;
}
.entity-item.is-客户 .entity-icon {
  color: #2563eb;
  background: #eff6ff;
}
.entity-item.is-同事 .entity-icon {
  color: #ea580c;
  background: #fff7ed;
}

.entity-copy {
  flex: 1;
  min-width: 0;
  display: grid;
}

.entity-copy b {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  white-space: nowrap;
  color: #163f35;
}

.entity-copy small {
  font-size: 11px;
  color: #7a8e87;
}

.entity-count {
  font-size: 11px;
  color: #94a3b8;
}

.entity-add-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: 14px;
  color: #087565;
  cursor: pointer;
  background: #fff;
  border: 1px solid #c2dfd6;
  border-radius: 6px;
}

.entity-add-btn:hover {
  background: #e8f5f0;
}

/* 实体统计概览 */
.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 10px;
}

.stat-item {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
  background: #f7fbf9;
  border: 1px solid #dceae4;
  border-radius: 8px;
}

.stat-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-size: 16px;
  border-radius: 7px;
  flex: none;
}

.stat-item.is-项目 .stat-icon {
  color: #0d6853;
  background: #e8ffea;
}
.stat-item.is-产品 .stat-icon {
  color: #16a34a;
  background: #f0fdf4;
}
.stat-item.is-客户 .stat-icon {
  color: #2563eb;
  background: #eff6ff;
}
.stat-item.is-同事 .stat-icon {
  color: #ea580c;
  background: #fff7ed;
}

.stat-item strong {
  display: block;
  font-size: 16px;
  color: #163f35;
}

.stat-item small {
  display: block;
  font-size: 11px;
  color: #7a8e87;
}

.entity-ops {
  display: flex;
  gap: 2px;
  flex: none;
}

.entity-ops button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  font-size: 13px;
  color: #7a8e87;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 4px;
}

.entity-ops button:hover {
  color: #087565;
  background: #eef6f3;
}

.correction-ops {
  display: flex;
  gap: 2px;
  flex: none;
}

.correction-ops button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  font-size: 13px;
  color: #7a8e87;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
}

.correction-ops button:hover {
  color: #087565;
  background: #eef6f3;
}

.correction-actions {
  display: flex;
  gap: 8px;
  padding: 8px;
}

.entity-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.entity-form label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}

textarea.markdown-source {
  width: 100%;
  min-height: 420px;
  padding: 14px 16px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 13px;
  line-height: 1.7;
  color: #2d4a44;
  resize: vertical;
  background: #fbfdfc;
  border: 1px solid #dceae4;
  border-radius: 10px;
  outline: none;
}

textarea.markdown-source:focus {
  border-color: #0b6e65;
  box-shadow: 0 0 0 3px rgb(11 110 101 / 12%);
}

.entity-empty {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  padding: 16px 8px;
  font-size: 12px;
  color: #94a3b8;
}

.correction-item {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  border-bottom: 1px solid #f1f6f3;
}

.correction-item:last-child {
  border-bottom: 0;
}

.correction-copy {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.correction-copy {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  font-size: 12px;
}

.correction-copy .wrong {
  font-weight: 700;
  color: #dc2626;
  text-decoration: line-through;
}

.correction-copy .correct {
  font-weight: 700;
  color: #059669;
}

.correction-copy small {
  width: 100%;
  font-size: 11px;
  font-weight: 400;
  color: #7a8e87;
}

.entity-autocorrect {
  margin: 8px;
}

/* 实体高亮（预览正文内） */
.markdown-body :deep(.rd-entity) {
  padding: 1px 4px;
  margin: 0 1px;
  font-weight: 600;
  border-radius: 4px;
  cursor: help;
}

.markdown-body :deep(.rd-entity.is-项目) {
  color: #0d6853;
  background: #e8ffea;
}
.markdown-body :deep(.rd-entity.is-产品) {
  color: #16a34a;
  background: #f0fdf4;
}
.markdown-body :deep(.rd-entity.is-客户) {
  color: #2563eb;
  background: #eff6ff;
}
.markdown-body :deep(.rd-entity.is-同事) {
  color: #ea580c;
  background: #fff7ed;
}

.markdown-body :deep(.rd-entity-misspell) {
  padding: 1px 4px;
  margin: 0 1px;
  font-weight: 600;
  color: #dc2626;
  background: #fef2f2;
  border-bottom: 2px wavy #dc2626;
  border-radius: 4px;
  cursor: pointer;
}

.markdown-body :deep(.rd-entity-misspell:hover) {
  background: #fee2e2;
}

.markdown-source {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 13px;
}

.markdown-preview-paper {
  padding: 26px 30px;
  background: #fff;
  border: 1px solid #e2ece8;
  border-radius: 10px;
  box-shadow: 0 6px 18px rgb(18 57 45 / 5%);
}

.paper-meta {
  margin-bottom: 14px;
  font-size: 12px;
  color: #94a3b8;
}

.markdown-empty {
  padding: 40px 0;
  font-size: 13px;
  color: #94a3b8;
  text-align: center;
}

.markdown-tab-aside {
  min-width: 0;
}

.draft-ai-card {
  padding: 16px;
  background: #fff;
  border: 1px solid #e2ece8;
  border-radius: 10px;
}

.draft-ai-card header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.draft-ai-card header span {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: 13px;
  font-weight: 700;
  color: #163f35;
}

.draft-ai-card header em {
  font-size: 11px;
  font-style: normal;
  color: #94a3b8;
}

.draft-score {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  margin-bottom: 12px;
  background: #f7fbf9;
  border-radius: 8px;
}

.draft-score strong {
  font-size: 28px;
  color: #0b6e65;
}

.draft-score-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.draft-score-meta small {
  font-size: 11px;
  color: #94a3b8;
}

.review-block {
  margin-bottom: 12px;
}

.review-block b {
  display: flex;
  gap: 5px;
  align-items: center;
  margin-bottom: 6px;
  font-size: 12px;
  color: #475569;
}

.review-block p {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: #2d4a44;
}

.suggestion-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.suggestion-item {
  display: flex;
  gap: 8px;
  padding: 6px 0;
}

.suggestion-item em {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  font-size: 11px;
  font-style: normal;
  color: #0b6e65;
  background: #d8efe8;
  border-radius: 50%;
  flex: none;
}

.suggestion-text {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  color: #475569;
}

.adopt-button {
  color: #fff !important;
  background: #0b6e65 !important;
  border-color: #0b6e65 !important;
}

/* 文件 tab */
.files-tab-list {
  display: flex;
  flex-direction: column;
  padding: 6px 22px 16px;
}

.files-tab-row {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 8px;
  border-bottom: 1px solid #edf3f0;
}

.files-tab-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  font-size: 18px;
  color: #0b6e65;
  background: #e8f5f0;
  border-radius: 8px;
  flex: none;
}

.files-tab-copy {
  flex: 1;
  min-width: 0;
}

.files-tab-copy b {
  display: block;
  font-size: 13px;
  color: #163f35;
}

.files-tab-copy small {
  display: block;
  font-size: 11px;
  color: #94a3b8;
}

.files-tab-actions {
  display: flex;
  gap: 4px;
  flex: none;
}

.context-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  color: #475569;
  cursor: pointer;
  background: transparent;
  border: 1px solid #e2ece8;
  border-radius: 6px;
}

.context-action-btn:hover {
  color: #0b6e65;
  border-color: #9cc9bd;
}

.files-tab-empty {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  padding: 50px 0;
  color: #94a3b8;
}

.share-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.share-body p {
  margin: 0;
  font-size: 13px;
  color: #475569;
}

/* markdown body 排版 */
.markdown-body :deep(h1) {
  margin: 0 0 12px;
  font-size: 20px;
  color: #163f35;
}

.markdown-body :deep(h2) {
  margin: 18px 0 10px;
  font-size: 16px;
  color: #163f35;
}

.markdown-body :deep(h3) {
  margin: 14px 0 8px;
  font-size: 14px;
  color: #1a4d44;
}

.markdown-body :deep(p) {
  margin: 8px 0;
  line-height: 1.75;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 20px;
}

.markdown-body :deep(li) {
  margin: 4px 0;
  line-height: 1.7;
}

.markdown-body :deep(blockquote) {
  margin: 10px 0;
  padding: 6px 12px;
  color: #6b8079;
  border-left: 3px solid #9cc9bd;
  background: #f7fbf9;
}

.markdown-body :deep(code) {
  padding: 2px 6px;
  font-size: 12px;
  color: #0b6e65;
  background: #e8f5f0;
  border-radius: 4px;
}

@media (max-width: 1100px) {
  .html-preview-layout,
  .markdown-tab-layout {
    grid-template-columns: 1fr;
  }

  .html-side-column,
  .markdown-tab-aside,
  .entity-side-panel {
    display: none;
  }
}
</style>
