<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import EmployeeRecommendations from '../../components/employee-recommendations.vue';
import { Icon } from '@iconify/vue';
import { Button, Input, Modal, message } from 'ant-design-vue';
import type { ReviewReport } from '#/api/mock-new-review';
import { reviewIdentity, reviewKey } from '#/api/mock-new-review';
import {
  addReviewComment,
  discussionFor,
  toggleReviewLike,
} from '#/api/mock-review-discussion';
import type { ReviewComment } from '#/api/mock-review-discussion';
import { materialSections } from '#/api/mock-report-materials';
import { defaultReportObject, reportObjects } from '#/api/mock-report-objects';
import ReportMarkdown from '../../new-report/components/ReportMarkdown.vue';
import EntityInsightModal from './EntityInsightModal.vue';
import type { ReportObject } from '#/api/mock-report-objects';
import { reviewInsights } from '#/utils/review-insights';

const props = defineProps<{ entry: ReviewReport; disabled?: boolean }>();
const route = useRoute();
const key = computed(() => reviewKey(props.entry));
const discussion = computed(() => discussionFor(key.value));
const roots = computed(() =>
  discussion.value.comments.filter((item) => !item.parentId),
);
const liked = computed(() => discussion.value.likes.includes(reviewIdentity));
const draft = ref('');
const reply = ref<ReviewComment>();
const posting = ref(false);
watch(key, () => {
  draft.value = '';
  reply.value = undefined;
});
async function postComment() {
  if (posting.value || !draft.value.trim()) return;
  const currentKey = key.value;
  posting.value = true;
  try {
    await addReviewComment(
      currentKey,
      reviewIdentity,
      draft.value,
      reply.value?.id,
    );
    if (currentKey === key.value) {
      draft.value = '';
      reply.value = undefined;
    }
    message.success('评论已保存到当前演示记录');
  } catch (error) {
    message.error(error instanceof Error ? error.message : '评论保存失败');
  } finally {
    posting.value = false;
  }
}
const records = computed(() =>
  (props.entry.report.generatedSections ?? materialSections(props.entry.report))
    .filter((section) => section.enabled)
    .flatMap((section) => section.records),
);
const attachments = computed(() => {
  const uploaded = Object.values(props.entry.report.attachments ?? {})
    .flat()
    .map((file) => ({
      id: file.id,
      name: file.name,
      meta: `${Math.max(1, Math.round(file.size / 1024))} KB · 报告附件`,
      url: file.url,
      detail: '',
    }));
  const references = records.value
    .filter((record) => /文件|文档|附件/.test(record.kind))
    .map((record) => ({
      id: record.id,
      name: record.title,
      meta: `${record.id} · 关联材料记录`,
      url: '',
      detail: record.detail,
    }));
  return [
    ...new Map(
      [...uploaded, ...references].map((item) => [item.id, item]),
    ).values(),
  ];
});
const entities = computed(() => {
  const report = props.entry.report;
  const businessId =
    report.business?.objectId ??
    (['project', 'customer'].includes(report.schemeId)
      ? defaultReportObject(report.schemeId)
      : '');
  const text = records.value
    .map((record) => `${record.title} ${record.detail}`)
    .join('\n');
  return reportObjects.filter(
    (entity) => entity.id === businessId || text.includes(entity.name),
  );
});
const detail = ref<{ title: string; text: string }>();
const entityDetail = ref<ReportObject>();
watch(key, () => {
  detail.value = undefined;
  entityDetail.value = undefined;
});
const insights = computed(() => reviewInsights(props.entry));
const employees = computed(() => insights.value.employees);
const collaborationContext = computed(() => ({
  currentEmployeeId: String(route.params.employeeId || 'new-review-assistant'),
  source: 'report-review',
  businessId: props.entry.report.id,
  title: `报告审阅 · ${props.entry.report.title}`,
  query: { reportId: props.entry.report.id },
  summary: `汇报人：${props.entry.author}\n周期：${props.entry.report.start} — ${props.entry.report.end}\n审核关注：${props.entry.concern}\n报告概述：${props.entry.report.summary}\n风险与协调：${insights.value.risk || '当前没有已确认的风险事项，请核对原文'}\n下期计划：${insights.value.plan || '待核对补充'}`,
}));
const collaborationEmployees = computed(() =>
  employees.value.map((employee) => ({
    ...employee,
    avatar: `${import.meta.env.BASE_URL}images/ai-employee/${employee.avatar}`,
  })),
);
</script>

<template>
  <div class="review-context-panels">
    <EmployeeRecommendations
      :context="collaborationContext"
      :employees="collaborationEmployees"
      :disabled="disabled"
    />

    <section class="context-card">
      <h2>
        <Icon icon="lucide:paperclip" />
        关联的附件
        <span class="section-count">{{ attachments.length }}</span>
      </h2>
      <div v-if="!attachments.length" class="context-empty">
        当前报告没有关联附件。
      </div>
      <div v-for="file in attachments" :key="file.id" class="related-row">
        <span class="related-icon"><Icon icon="lucide:file-text" /></span>
        <a v-if="file.url" :href="file.url" :download="file.name">
          <b>{{ file.name }}</b>
          <small>{{ file.meta }} · 下载</small>
        </a>
        <button
          v-else
          type="button"
          @click="
            detail = {
              title: file.name,
              text: `**材料引用**\n\n${file.detail}\n\n来源：\`${file.id}\`\n\n> 当前为材料记录快照，未提供可下载的文件。`,
            }
          "
        >
          <b>{{ file.name }}</b>
          <small>{{ file.meta }} · 查看</small>
        </button>
        <Icon :icon="file.url ? 'lucide:download' : 'lucide:chevron-right'" />
      </div>
    </section>
    <section class="context-card">
      <h2>
        <Icon icon="lucide:scan-search" />
        关联的实体
        <span class="section-count">{{ entities.length }}</span>
      </h2>
      <div v-if="!entities.length" class="context-empty">
        当前报告尚未关联项目或客户实体。
      </div>
      <button
        v-for="entity in entities"
        :key="entity.id"
        type="button"
        class="related-row entity-row"
        @click="entityDetail = entity"
      >
        <span
          class="related-icon"
          :class="{ orange: entity.kind === 'customer' }"
        >
          <Icon
            :icon="
              entity.kind === 'project'
                ? 'lucide:folder-kanban'
                : 'lucide:building-2'
            "
          />
        </span>
        <span>
          <b>{{ entity.name }}</b>
          <small>
            {{ entity.kind === 'project' ? '项目' : '客户' }} ·
            {{ entity.owner }}
          </small>
        </span>
        <Icon icon="lucide:chevron-right" />
      </button>
    </section>
    <section class="context-card social-panel">
      <h2>
        <Icon icon="lucide:thumbs-up" />
        点赞
        <span class="section-count">{{ discussion.likes.length }}</span>
      </h2>
      <button
        type="button"
        class="like-button"
        :class="{ active: liked }"
        :aria-pressed="liked"
        @click="toggleReviewLike(key, reviewIdentity)"
      >
        <Icon icon="lucide:thumbs-up" />
        {{ liked ? '已点赞' : '点赞认可' }}
      </button>
      <div v-if="discussion.likes.length" class="like-people">
        <span v-for="name in discussion.likes" :key="name">
          <i>{{ name.slice(0, 1) }}</i>
          {{ name }}
        </span>
      </div>
      <p v-else class="context-empty">还没有人点赞，为这份报告留下认可。</p>
    </section>
    <section class="context-card discussion-panel">
      <h2>
        <Icon icon="lucide:messages-square" />
        评论
        <span class="section-count">{{ discussion.comments.length }}</span>
      </h2>
      <p class="context-note">报告讨论与正式审批意见分别记录。</p>
      <div v-if="!roots.length" class="context-empty">
        暂无评论，可以就成果、风险或计划展开讨论。
      </div>
      <article v-for="comment in roots" :key="comment.id" class="comment-item">
        <span class="comment-avatar">{{ comment.author.slice(0, 1) }}</span>
        <div>
          <header>
            <b>{{ comment.author }}</b>
            <small>{{ comment.time }}</small>
          </header>
          <p>{{ comment.text }}</p>
          <button type="button" @click="reply = comment">回复</button>
          <div
            v-for="child in discussion.comments.filter(
              (item) => item.parentId === comment.id,
            )"
            :key="child.id"
            class="comment-reply"
          >
            <b>{{ child.author }}</b>
            <small>{{ child.time }}</small>
            <p>{{ child.text }}</p>
          </div>
        </div>
      </article>
      <div v-if="reply" class="reply-context">
        回复 {{ reply.author }}
        <button type="button" @click="reply = undefined">取消</button>
      </div>
      <Input.TextArea
        v-model:value="draft"
        :rows="3"
        :maxlength="2000"
        :disabled="posting"
        :placeholder="reply ? `回复 ${reply.author}…` : '写下对这份报告的评论…'"
        aria-label="报告评论"
      />
      <Button
        type="primary"
        block
        :loading="posting"
        :disabled="!draft.trim()"
        @click="postComment"
      >
        {{ reply ? '发布回复' : '发表评论' }}
      </Button>
      <small class="context-note">仅在当前 Demo 中记录，不发送真实通知。</small>
    </section>
  </div>
  <EntityInsightModal
    :entity="entityDetail"
    @close="entityDetail = undefined"
  />
  <Modal
    :open="!!detail"
    :title="detail?.title"
    :footer="null"
    :width="640"
    @cancel="detail = undefined"
  >
    <ReportMarkdown :text="detail?.text ?? ''" />
  </Modal>
</template>

<style scoped src="../review-context-panels.css"></style>
