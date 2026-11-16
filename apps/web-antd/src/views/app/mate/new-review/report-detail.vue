<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import {
  Button,
  ConfigProvider,
  Input,
  Select,
  theme,
  message,
} from 'ant-design-vue';
import { printReportElement } from '#/utils/report-presentation';
import { reviewInsights } from '#/utils/review-insights';
import {
  reviewIdentity,
  reviewReports,
  reviewReportTypes,
  reviewFeedbacks,
  reviewKey,
  submitReviewFeedback,
} from '#/api/mock-new-review';
import type { ReviewReport } from '#/api/mock-new-review';
import ReviewReportDocument from './components/ReviewReportDocument.vue';
import ReviewScoreInput from './components/ReviewScoreInput.vue';
import ReviewContextPanels from './components/ReviewContextPanels.vue';
import ReviewShareModal from './components/ReviewShareModal.vue';
const route = useRoute();
const router = useRouter();
const documentRoot = ref<HTMLElement>();
const shareOpen = ref(false);
const aiExpanded = ref(false);
const shareMode = computed(() => route.query.share === '1');
const readingQueue = computed(() =>
  reviewReports.value.filter(
    (entry) =>
      !route.query.type ||
      route.query.type === 'all' ||
      entry.type === route.query.type,
  ),
);
const currentIndex = computed(() =>
  readingQueue.value.findIndex((entry) => entry.id === selected.value?.id),
);
const reportOptions = computed(() =>
  readingQueue.value.map((entry) => ({
    value: entry.id,
    label: `${entry.author} · ${entry.report.title} · ${entry.report.start}`,
  })),
);
const selected = computed(() =>
  reviewReports.value.find(
    (entry) =>
      entry.id === route.query.report &&
      (!shareMode.value ||
        !route.query.version ||
        String(entry.report.version) === route.query.version),
  ),
);
const canReview = computed(
  () => !!selected.value?.assigned && !shareMode.value,
);
watch(
  () => selected.value?.id,
  () => {
    shareOpen.value = false;
  },
);
const completed = computed(() =>
  selected.value ? reviewFeedbacks[reviewKey(selected.value)] : undefined,
);
const insights = computed(() =>
  selected.value ? reviewInsights(selected.value) : undefined,
);
const approvers = computed(() => [
  ...new Set([
    ...(selected.value?.report.reviewers ?? []),
    ...(selected.value?.assigned ? [reviewIdentity] : []),
  ]),
]);
const reviewedCount = computed(() =>
  completed.value && approvers.value.includes(reviewIdentity) ? 1 : 0,
);
const busy = ref(false);
const score = ref<number | null>(9);
const feedback = ref('');
const typeOf = (entry: ReviewReport) =>
  reviewReportTypes.find((type) => type.id === entry.type)!;
const statusOf = (entry: ReviewReport) =>
  shareMode.value || !entry.assigned
    ? 'shared'
    : reviewFeedbacks[reviewKey(entry)]
      ? 'done'
      : 'pending';
const statusLabel = (entry: ReviewReport) =>
  statusOf(entry) === 'shared'
    ? shareMode.value
      ? '只读查看'
      : '分享给我'
    : statusOf(entry) === 'done'
      ? '已反馈'
      : '待我反馈';
watch(
  () => (selected.value ? reviewKey(selected.value) : ''),
  () => {
    aiExpanded.value = false;
    score.value = completed.value?.score ?? 9;
    feedback.value = completed.value?.text ?? '';
  },
  { immediate: true },
);
function back() {
  if (busy.value) return;
  void router.push({
    name: 'NewReviewAssistantReports',
    params: {
      employeeId: String(route.params.employeeId || 'new-review-assistant'),
    },
    query: Object.fromEntries(
      Object.entries(route.query).filter(([key]) => key !== 'report'),
    ),
  });
}
function switchReport(value: unknown) {
  if (busy.value || shareMode.value) return;
  void router.replace({
    name: 'NewReviewAssistantReportDetail',
    params: route.params,
    query: { ...route.query, report: String(value) },
  });
}
function stepReport(direction: number) {
  const target = readingQueue.value[currentIndex.value + direction];
  if (target) switchReport(target.id);
}
function exportPdf() {
  if (documentRoot.value && selected.value)
    printReportElement(documentRoot.value, selected.value.report.title);
}
function adoptSuggestion() {
  if (busy.value || !canReview.value || !selected.value || completed.value)
    return;
  score.value = Math.round(selected.value.aiScore * 2) / 2;
  feedback.value = insights.value?.opinion ?? selected.value.aiFeedback;
}
async function submit(decision?: 'approved' | 'changes') {
  const entry = selected.value;
  if (!entry || busy.value || !canReview.value || completed.value) return;
  if (
    score.value === null ||
    !Number.isFinite(score.value) ||
    score.value < 0 ||
    score.value > 10 ||
    !feedback.value.trim()
  ) {
    message.warning('请填写 0—10 分和反馈意见');
    return;
  }
  busy.value = true;
  try {
    await submitReviewFeedback(
      entry.id,
      entry.report.version,
      score.value,
      feedback.value,
      decision,
    );
    message.success('评分与反馈已保存到演示记录，未发送真实消息');
  } catch (error) {
    message.error(
      error instanceof Error ? error.message : '反馈保存失败，请重试',
    );
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <ConfigProvider
    :theme="{
      inherit: false,
      algorithm: theme.defaultAlgorithm,
      token: {
        colorPrimary: '#247d69',
        colorBgContainer: '#ffffff',
        colorBgElevated: '#ffffff',
        colorText: '#213d35',
        colorTextSecondary: '#5f7269',
        colorBorder: '#cddad2',
      },
    }"
  >
    <div class="review-standalone" :class="{ 'is-shared': shareMode }">
      <div v-if="!selected" class="review-empty">
        <Icon icon="lucide:files" />
        <p>报告不存在或当前不可查看。</p>
        <Button v-if="!shareMode" @click="back">返回审核列表</Button>
      </div>
      <template v-else>
        <header class="review-topbar">
          <div class="review-brand">
            <Button
              v-if="!shareMode"
              class="review-back"
              :disabled="busy"
              @click="back"
              ><Icon icon="lucide:arrow-left" />返回审核列表</Button
            >
            <span v-if="!shareMode" class="topbar-divider"></span>
            <div class="review-brand-title">
              <b>报告审阅</b
              ><small
                >{{ typeOf(selected).title }} · V{{
                  selected.report.version
                }}</small
              >
            </div>
          </div>
          <div v-if="!shareMode" class="review-report-switch">
            <Button
              class="review-step"
              aria-label="上一份报告"
              :disabled="busy || currentIndex <= 0"
              @click="stepReport(-1)"
              ><Icon icon="lucide:chevron-left"
            /></Button>
            <Select
              :value="selected.id"
              :options="reportOptions"
              :disabled="busy"
              show-search
              option-filter-prop="label"
              aria-label="切换审核报告"
              @change="switchReport"
            />
            <Button
              class="review-step"
              aria-label="下一份报告"
              :disabled="
                busy ||
                currentIndex < 0 ||
                currentIndex >= readingQueue.length - 1
              "
              @click="stepReport(1)"
              ><Icon icon="lucide:chevron-right"
            /></Button>
            <span class="queue-position"
              >{{ currentIndex + 1 }} / {{ readingQueue.length }}</span
            >
          </div>
          <div class="review-topbar-actions">
            <span class="review-status" :class="statusOf(selected)">{{
              statusLabel(selected)
            }}</span
            ><Button
              v-if="!shareMode"
              class="review-share"
              :disabled="busy"
              @click="shareOpen = true"
              ><Icon icon="lucide:share-2" />分享</Button
            ><Button class="review-export" @click="exportPdf"
              ><Icon icon="lucide:download" />导出 PDF</Button
            >
          </div>
        </header>
        <div class="review-reading-layout">
          <main class="review-document-scroll" :key="reviewKey(selected)">
            <div class="reading-context">
              <span
                ><Icon icon="lucide:lock-keyhole" />已提交快照 · 正文只读</span
              ><span
                >{{ selected.author }} · {{ selected.department }}<i>·</i
                >{{ selected.report.start }} — {{ selected.report.end }}</span
              >
            </div>
            <div ref="documentRoot" class="review-report-document">
              <ReviewReportDocument :report="selected.report" />
            </div>
          </main>
          <aside class="review-feedback-rail">
            <section class="review-approval-card">
              <header class="rail-card-heading approval-heading">
                <span class="rail-heading-icon"
                  ><Icon icon="lucide:stamp"
                /></span>
                <div>
                  <h2>审批</h2>
                </div>
              </header>
              <div class="approval-card-body">
                <div v-if="approvers.length" class="approval-progress-label">
                  <b>{{ reviewedCount }} / {{ approvers.length }} 已反馈</b
                  ><span :class="{ 'approval-complete': completed }">{{
                    shareMode
                      ? '查看审批进度'
                      : completed
                        ? '我的批复已完成'
                        : canReview
                          ? '等待我的批复'
                          : '查看审批进度'
                  }}</span>
                </div>
                <div v-if="approvers.length" class="approval-progress-track">
                  <i
                    :style="{
                      width: `${(reviewedCount / approvers.length) * 100}%`,
                    }"
                  ></i>
                </div>
                <details
                  v-if="approvers.length"
                  class="approval-people"
                  :open="approvers.length <= 2"
                >
                  <summary>
                    审核人员<span>{{ approvers.length }} 人</span>
                  </summary>
                  <div
                    v-for="name in approvers"
                    :key="name"
                    class="approval-person"
                  >
                    <span class="approval-avatar">{{ name.slice(0, 1) }}</span>
                    <div>
                      <b
                        >{{ name
                        }}<small v-if="name === reviewIdentity && !shareMode"
                          >我</small
                        ></b
                      >
                      <p>
                        {{
                          name === reviewIdentity && completed
                            ? `${completed.score} 分 · ${completed.time}`
                            : '等待评分与批复'
                        }}
                      </p>
                    </div>
                    <em
                      :class="{ done: name === reviewIdentity && completed }"
                      >{{
                        name === reviewIdentity && completed
                          ? selected.report.customerApproval?.status ===
                            'changes'
                            ? '已退回'
                            : '已反馈'
                          : '待审核'
                      }}</em
                    >
                  </div>
                </details>
                <div v-if="!canReview" class="approval-shared-note">
                  <Icon icon="lucide:share-2" />
                  <p>
                    此报告分享给你阅读，无需评分或批复。可以在下方点赞或评论。
                  </p>
                </div>
                <div
                  v-else-if="completed"
                  class="approval-result"
                  :class="{
                    returned:
                      selected.report.customerApproval?.status === 'changes',
                  }"
                >
                  <div class="approval-result-score">
                    <span
                      ><Icon
                        :icon="
                          selected.report.customerApproval?.status === 'changes'
                            ? 'lucide:rotate-ccw'
                            : 'lucide:badge-check'
                        "
                      />{{
                        selected.report.customerApproval?.status === 'changes'
                          ? '已退回修改'
                          : '我的批复'
                      }}</span
                    ><strong>{{ completed.score }}<small> / 10</small></strong>
                  </div>
                  <blockquote>{{ completed.text }}</blockquote>
                  <p
                    v-if="selected.report.customerApproval"
                    class="approval-customer-status"
                  >
                    {{
                      selected.report.customerApproval.status === 'approved'
                        ? '审批通过，可由客户经理对外分享。'
                        : '已退回，待客户经理修改并重新提交。'
                    }}
                  </p>
                  <small>{{ completed.time }} · {{ reviewIdentity }}</small>
                </div>
                <div v-else class="review-form">
                  <div class="approval-form-score">
                    <ReviewScoreInput
                      id="review-score"
                      v-model:value="score"
                      :disabled="busy"
                    />
                  </div>
                  <label for="review-feedback">审批意见<span>必填</span></label
                  ><Input.TextArea
                    id="review-feedback"
                    v-model:value="feedback"
                    :rows="4"
                    :disabled="busy"
                    placeholder="可采纳下方 AI 建议，修改后确认提交。"
                  />
                  <template
                    v-if="
                      selected.report.customerApproval?.status === 'pending'
                    "
                    ><p class="approval-customer-status">
                      审批通过后，客户经理才可对外分享。
                    </p>
                    <div class="approval-buttons">
                      <Button
                        type="primary"
                        :loading="busy"
                        :disabled="score === null || !feedback.trim()"
                        @click="submit('approved')"
                        >审批通过</Button
                      ><Button
                        :disabled="busy || score === null || !feedback.trim()"
                        @click="submit('changes')"
                        >退回修改</Button
                      >
                    </div></template
                  >
                  <Button
                    v-else
                    type="primary"
                    block
                    :loading="busy"
                    :disabled="score === null || !feedback.trim()"
                    @click="submit()"
                    ><Icon icon="lucide:check" />确认批复</Button
                  >
                  <small class="approval-footer-note"
                    >AI 辅助判断，评分与批复由你最终确认。</small
                  >
                </div>
              </div>
            </section>
            <section v-if="insights" class="review-ai-panel">
              <header class="rail-card-heading ai-heading">
                <span class="rail-heading-icon"
                  ><Icon icon="lucide:sparkles"
                /></span>
                <div>
                  <h2>AI 审核建议</h2>
                  <small>基于当前已提交的报告</small>
                </div>
                <button
                  type="button"
                  class="ai-score-badge"
                  :aria-expanded="aiExpanded"
                  aria-controls="review-ai-insights"
                  :aria-label="
                    aiExpanded ? '收起 AI 审核建议' : '展开 AI 审核建议'
                  "
                  @click="aiExpanded = !aiExpanded"
                >
                  <strong>{{ selected.aiScore }}</strong
                  ><small>参考分</small>
                </button>
                <button
                  type="button"
                  class="ai-collapse-toggle"
                  :aria-expanded="aiExpanded"
                  aria-controls="review-ai-insights"
                  :aria-label="
                    aiExpanded ? '收起 AI 审核建议' : '展开 AI 审核建议'
                  "
                  :title="aiExpanded ? '收起' : '展开'"
                  @click="aiExpanded = !aiExpanded"
                >
                  <svg
                    :class="{ expanded: aiExpanded }"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </header>
              <div
                v-show="aiExpanded"
                id="review-ai-insights"
                class="ai-insights-body"
              >
                <div class="ai-insight-section overview">
                  <h3><Icon icon="lucide:align-left" />概述</h3>
                  <p>{{ insights.summary }}</p>
                </div>
                <div class="ai-insight-section strengths">
                  <h3><Icon icon="lucide:circle-check" />优点</h3>
                  <ul>
                    <li v-for="text in insights.strengths" :key="text">
                      {{ text }}
                    </li>
                  </ul>
                </div>
                <div class="ai-insight-section improvements">
                  <h3><Icon icon="lucide:lightbulb" />改进点</h3>
                  <ul>
                    <li v-for="text in insights.improvements" :key="text">
                      {{ text }}
                    </li>
                  </ul>
                </div>
                <div class="ai-insight-section opinion">
                  <h3><Icon icon="lucide:message-square-text" />建议意见</h3>
                  <blockquote>{{ insights.opinion }}</blockquote>
                  <Button
                    v-if="canReview && !completed"
                    block
                    :disabled="busy"
                    @click="adoptSuggestion"
                    ><Icon icon="lucide:corner-left-up" />采纳到审批意见</Button
                  >
                </div>
              </div>
            </section>
            <ReviewContextPanels
              :key="reviewKey(selected)"
              :entry="selected"
              :disabled="busy || shareMode"
            />
          </aside>
        </div>
      </template>
    </div>
    <ReviewShareModal
      v-if="selected && !shareMode"
      :entry="selected"
      :open="shareOpen"
      :employee-id="String(route.params.employeeId || 'new-review-assistant')"
      @close="shareOpen = false"
    />
  </ConfigProvider>
</template>
<style scoped src="./review-standalone.css"></style>
