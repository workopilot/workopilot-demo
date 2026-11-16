<!-- 周报详情：完整周报视图 + 主管评价 + 论坛式评论 -->
<script setup lang="ts">
import type { EntityPick } from '../components/entity-context-drawer.vue';

import type { AiWorkComment, AiWorkEntities } from '#/types/ai-work';

import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Avatar, Button, Input, Rate, Tag } from 'ant-design-vue';

import { aiWorkReports } from '#/api/mock-data-ai-work';

import AiWorkPage from '../components/ai-work-page.vue';
import EntityContextDrawer from '../components/entity-context-drawer.vue';
import EntityTags from '../components/entity-tags.vue';
import MaterialList from '../components/material-list.vue';

const route = useRoute();
const router = useRouter();

const report = computed(
  () =>
    aiWorkReports.find((r) => r.id === route.params.reportId) ??
    aiWorkReports[1]!, // 默认第31周
);

const categories = ['achievement', 'work', 'risk', 'support', 'plan'] as const;
const categoryLabels: Record<(typeof categories)[number], string> = {
  achievement: '本周成果',
  plan: '下周计划',
  risk: '问题与风险',
  support: '需要协助',
  work: '本周主要工作',
};

// 评论（论坛式，可多轮）
const commentText = ref('');
const comments = ref<AiWorkComment[]>([...(report.value.comments ?? [])]);

// 实体穿透
const entityOpen = ref(false);
const pickedEntity = ref<EntityPick | null>(null);

function onEntityPick(payload: { name: string; type: keyof AiWorkEntities }) {
  pickedEntity.value = payload;
  entityOpen.value = true;
}

function formatScore(score: number) {
  return score.toFixed(1);
}

function submitComment() {
  if (!commentText.value.trim()) return;
  comments.value.push({
    id: `comment-new-${Date.now()}`,
    authorId: 'zhang-san',
    authorName: '张三',
    authorRole: 'employee',
    content: commentText.value,
    createdAt: '刚刚',
  });
  commentText.value = '';
}

function back() {
  router.push('/app/mate/employee/weekly-assistant/report-history');
}
</script>

<template>
  <AiWorkPage
    eyebrow="REPORT DETAIL"
    :title="`${report.weekLabel}周报`"
    :description="`${report.ownerName} · ${report.ownerDepartment} · ${report.dateRange}`"
  >
    <template #actions>
      <Tag
        :color="
          report.status === 'APPROVED'
            ? 'green'
            : report.status === 'DRAFT'
              ? 'blue'
              : 'default'
        "
      >
        {{
          report.status === 'APPROVED'
            ? '已通过'
            : report.status === 'DRAFT'
              ? '草稿'
              : report.status === 'SUBMITTED'
                ? '已提交'
                : report.status
        }}
      </Tag>
      <Tag v-if="report.review" color="gold">
        ⭐ {{ formatScore(report.review.score) }} / 5.0
      </Tag>
      <Button @click="back">
        <Icon icon="lucide:arrow-left" />
        返回历史
      </Button>
    </template>

    <div class="report-detail">
      <!-- 周报正文 -->
      <section class="report-body">
        <h2 class="report-body__title">
          <Icon icon="lucide:file-text" />
          周报正文
        </h2>
        <div
          v-for="category in categories"
          :key="category"
          class="report-section"
        >
          <h3>{{ categoryLabels[category] }}</h3>
          <article
            v-for="item in report.items.filter((i) => i.category === category)"
            :key="item.id"
            class="report-item"
          >
            <h4>{{ item.title }}</h4>
            <p>{{ item.content }}</p>
            <MaterialList :materials="item.materials" />
            <EntityTags
              :entities="item.entities"
              :show-group-title="false"
              :clickable="true"
              class="report-item__entities"
              @pick="onEntityPick"
            />
            <div class="report-item__meta">
              <span v-if="item.customer">
                <Icon icon="lucide:building-2" />
                {{ item.customer }}
              </span>
              <span v-if="item.project">
                <Icon icon="lucide:briefcase-business" />
                {{ item.project }}
              </span>
            </div>
          </article>
          <div
            v-if="!report.items.some((i) => i.category === category)"
            class="report-item--empty"
          >
            本周无此类事项
          </div>
        </div>
      </section>

      <!-- 侧栏 -->
      <aside>
        <!-- AI 完整度分析 -->
        <section class="side-card">
          <h3>
            <Icon icon="lucide:gauge" />
            AI 完整度分析
          </h3>
          <div class="completeness">
            <strong>{{ report.completeness }}%</strong>
            <p>工作完整度</p>
          </div>
          <ul class="completeness-list">
            <li>
              <Icon icon="lucide:check" />
              资料关联充分
            </li>
            <li>
              <Icon icon="lucide:check" />
              上周承诺全部说明
            </li>
            <li>
              <Icon icon="lucide:check" />
              实体标注完整
            </li>
          </ul>
          <small class="side-card__hint">
            此分析由 AI 完整度检查在周报生成时自动产出。
          </small>
        </section>

        <!-- 全局实体关联 -->
        <section class="side-card">
          <h3>
            <Icon icon="lucide:network" />
            本周涉及的实体
          </h3>
          <EntityTags
            :entities="report.entities"
            :clickable="true"
            @pick="onEntityPick"
          />
        </section>
      </aside>
    </div>

    <!-- 主管评价 -->
    <section v-if="report.review" class="review-block">
      <h2 class="review-block__title">
        <Icon icon="lucide:user-check" />
        主管评价
      </h2>
      <div class="review-head">
        <Avatar size="large">{{ report.review.reviewerName[0] }}</Avatar>
        <div class="review-head__info">
          <div class="review-head__name">
            {{ report.review.reviewerName }}
            <span class="review-head__role">
              {{ report.review.reviewerRole }}
            </span>
          </div>
          <div class="review-head__meta">
            <Rate :value="report.review.score" disabled allow-half />
            <span class="review-head__score">
              {{ formatScore(report.review.score) }} / 5.0
            </span>
            <span class="review-head__time">
              {{ report.review.reviewedAt }}
            </span>
          </div>
        </div>
      </div>
      <p class="review-comment">{{ report.review.comment }}</p>

      <!-- 逐项评价 -->
      <div v-if="report.review.itemScores.length > 0" class="item-scores">
        <h4>📌 逐项评价</h4>
        <div
          v-for="(score, idx) in report.review.itemScores"
          :key="idx"
          class="item-score"
        >
          <div class="item-score__head">
            <span class="item-score__title">{{ score.itemTitle }}</span>
            <span class="item-score__value">
              ⭐ {{ formatScore(score.score) }}
            </span>
          </div>
          <p class="item-score__comment">{{ score.comment }}</p>
        </div>
      </div>
    </section>

    <!-- 评论（论坛式） -->
    <section class="comments-block">
      <h2 class="comments-block__title">
        <Icon icon="lucide:message-square" />
        讨论
        <Tag size="small">{{ comments.length }}</Tag>
      </h2>

      <div class="comment-input">
        <Avatar>张</Avatar>
        <Input.TextArea
          v-model:value="commentText"
          :rows="2"
          placeholder="写下你的回复…"
          class="comment-input__field"
        />
        <Button
          type="primary"
          :disabled="!commentText.trim()"
          @click="submitComment"
        >
          <Icon icon="lucide:send" />
          回复
        </Button>
      </div>

      <div class="comment-list">
        <div
          v-for="comment in comments"
          :key="comment.id"
          class="comment-item"
          :class="{
            'comment-item--manager': comment.authorRole === 'manager',
            'comment-item--reply': !!comment.replyTo,
          }"
        >
          <Avatar
            :class="{
              'comment-item__avatar--manager': comment.authorRole === 'manager',
            }"
          >
            {{ comment.authorName[0] }}
          </Avatar>
          <div class="comment-item__body">
            <div class="comment-item__head">
              <span class="comment-item__name">{{ comment.authorName }}</span>
              <Tag
                v-if="comment.authorRole === 'manager'"
                color="blue"
                size="small"
              >
                主管
              </Tag>
              <Tag v-else size="small">员工</Tag>
              <span class="comment-item__time">{{ comment.createdAt }}</span>
            </div>
            <p class="comment-item__content">{{ comment.content }}</p>
          </div>
        </div>
        <div v-if="comments.length === 0" class="comment-empty">
          <Icon icon="lucide:message-circle" />
          还没有讨论，说点什么吧
        </div>
      </div>
    </section>

    <EntityContextDrawer
      v-model:open="entityOpen"
      :entity="pickedEntity"
      mode="personal"
    />
  </AiWorkPage>
</template>

<style scoped>
@media (max-width: 1280px) {
  .report-detail {
    grid-template-columns: 1fr;
  }
}

.report-detail {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(260px, 3fr);
  gap: 14px;
  margin-bottom: 14px;
}

.report-body,
.side-card {
  padding: 16px 18px;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 17px;
}

aside {
  display: grid;
  gap: 12px;
  align-content: start;
}

.report-body__title,
.review-block__title,
.comments-block__title {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 0 0 14px;
  font-size: 16px;
  color: #183e35;
}

.report-body__title svg,
.review-block__title svg,
.comments-block__title svg {
  width: 18px;
  height: 18px;
  color: #0b806f;
}

.report-section {
  margin-bottom: 14px;
}

.report-section h3 {
  padding-left: 8px;
  margin: 0 0 8px;
  font-size: 14px;
  color: #183e35;
  border-left: 3px solid #0b806f;
}

.report-item {
  padding: 12px;
  margin-bottom: 10px;
  border: 1px solid #e4ece9;
  border-radius: 12px;
}

.report-item h4 {
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 600;
  color: #102e29;
}

.report-item p {
  margin: 0 0 8px;
  font-size: 12px;
  line-height: 1.7;
  color: #596f68;
}

.report-item__entities {
  margin: 6px 0;
}

.report-item__meta {
  display: flex;
  gap: 12px;
  margin-top: 6px;
  font-size: 10px;
  color: #6c8179;
}

.report-item__meta span {
  display: inline-flex;
  gap: 3px;
  align-items: center;
}

.report-item--empty {
  padding: 14px;
  font-size: 11px;
  color: #8b9b96;
  text-align: center;
}

/* 侧栏 */
.side-card h3 {
  display: flex;
  gap: 6px;
  align-items: center;
  margin: 0 0 12px;
  font-size: 14px;
  color: #183e35;
}

.side-card h3 svg {
  width: 16px;
  height: 16px;
  color: #0b806f;
}

.completeness {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
}

.completeness strong {
  font-size: 36px;
  color: #0b806f;
}

.completeness p {
  margin: 4px 0 0;
  font-size: 11px;
  color: #71857e;
}

.completeness-list {
  padding: 0;
  margin: 0;
  list-style: none;
}

.completeness-list li {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 6px 0;
  font-size: 12px;
  color: #3a6257;
  border-top: 1px solid #edf2f0;
}

.completeness-list svg {
  width: 14px;
  height: 14px;
  color: #0b7668;
}

.side-card__hint {
  display: block;
  margin-top: 8px;
  font-size: 10px;
  line-height: 1.5;
  color: #8b9b96;
}

/* 评价块 */
.review-block {
  padding: 18px;
  margin-bottom: 14px;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 17px;
}

.review-head {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.review-head__info {
  flex: 1;
}

.review-head__name {
  font-size: 14px;
  font-weight: 600;
  color: #102e29;
}

.review-head__role {
  margin-left: 6px;
  font-size: 11px;
  font-weight: 400;
  color: #8b9b96;
}

.review-head__meta {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 2px;
}

.review-head__score {
  font-size: 13px;
  font-weight: 600;
  color: #c67a0a;
}

.review-head__time {
  margin-left: auto;
  font-size: 11px;
  color: #8b9b96;
}

.review-comment {
  padding: 12px;
  margin: 0 0 14px;
  font-size: 13px;
  line-height: 1.7;
  color: #3a6257;
  background: #f8fbfa;
  border-radius: 10px;
}

.item-scores h4 {
  margin: 0 0 8px;
  font-size: 13px;
  color: #183e35;
}

.item-score {
  padding: 10px 0;
  border-top: 1px solid #edf2f0;
}

.item-score__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.item-score__title {
  font-size: 12px;
  font-weight: 500;
  color: #3a6257;
}

.item-score__value {
  font-size: 12px;
  color: #c67a0a;
}

.item-score__comment {
  margin: 4px 0 0;
  font-size: 11px;
  line-height: 1.6;
  color: #6c8179;
}

/* 评论块 */
.comments-block {
  padding: 18px;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 17px;
}

.comments-block__title {
  display: flex;
  gap: 8px;
  align-items: center;
}

.comment-input {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.comment-input__field {
  flex: 1;
}

.comment-list {
  display: grid;
  gap: 12px;
}

.comment-item {
  display: flex;
  gap: 10px;
}

.comment-item--reply {
  padding-left: 14px;
  margin-left: 44px;
  border-left: 2px solid #e0ebe7;
}

.comment-item__avatar--manager {
  background: #2563a8 !important;
}

.comment-item__body {
  flex: 1;
}

.comment-item__head {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 4px;
}

.comment-item__name {
  font-size: 13px;
  font-weight: 500;
  color: #102e29;
}

.comment-item__time {
  margin-left: auto;
  font-size: 10px;
  color: #8b9b96;
}

.comment-item__content {
  padding: 8px 12px;
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: #3a6257;
  background: #f8fbfa;
  border-radius: 10px;
}

.comment-item--manager .comment-item__content {
  background: #eef4fb;
}

.comment-empty {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  padding: 30px 0;
  font-size: 12px;
  color: #8b9b96;
}

.comment-empty svg {
  width: 28px;
  height: 28px;
}
</style>
