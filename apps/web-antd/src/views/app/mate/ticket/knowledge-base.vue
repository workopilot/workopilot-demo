<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Input, Modal, Tag } from 'ant-design-vue';

import { mockKnowledgeArticles } from '#/api/mock-data-ticket';

const keyword = ref('');
const activeCategory = ref('全部');
const categories = computed(() => [
  '全部',
  ...new Set(mockKnowledgeArticles.map((item) => item.category)),
]);

const filtered = computed(() =>
  mockKnowledgeArticles.filter((item) => {
    const matchCategory =
      activeCategory.value === '全部' || item.category === activeCategory.value;
    const matchKeyword =
      !keyword.value ||
      item.title.includes(keyword.value) ||
      item.summary.includes(keyword.value) ||
      item.tags.some((tag) => tag.includes(keyword.value));
    return matchCategory && matchKeyword;
  }),
);

const previewOpen = ref(false);
const previewId = ref<string>('');
const preview = computed(
  () =>
    mockKnowledgeArticles.find((item) => item.id === previewId.value) ||
    mockKnowledgeArticles[0]!,
);

function openArticle(id: string) {
  previewId.value = id;
  previewOpen.value = true;
}
</script>

<template>
  <section class="ticket-page">
    <header class="ticket-page__header">
      <div class="ticket-page__heading">
        <span class="ticket-page__icon">
          <Icon icon="lucide:book-open-text" />
        </span>
        <div>
          <span class="ticket-page__eyebrow">KNOWLEDGE BASE</span>
          <h1>售后知识库</h1>
          <p>设备故障排查、操作指引与保养规范，支撑客服一线与客户自助。</p>
        </div>
      </div>
      <Input
        v-model:value="keyword"
        allow-clear
        placeholder="搜索标题、摘要或标签…"
        class="ticket-page__search"
      >
        <template #prefix><Icon icon="lucide:search" /></template>
      </Input>
    </header>

    <div class="ticket-page__chips">
      <button
        v-for="cat in categories"
        :key="cat"
        type="button"
        :class="{ 'is-active': activeCategory === cat }"
        @click="activeCategory = cat"
      >
        {{ cat }}
      </button>
    </div>

    <div class="kb-grid">
      <article
        v-for="item in filtered"
        :key="item.id"
        class="kb-card"
        @click="openArticle(item.id)"
      >
        <div class="kb-card__top">
          <Tag color="green">{{ item.category }}</Tag>
          <span class="kb-card__views">
            <Icon icon="lucide:eye" />
            {{ item.views }}
          </span>
        </div>
        <h3>{{ item.title }}</h3>
        <p>{{ item.summary }}</p>
        <div class="kb-card__tags">
          <span v-for="tag in item.tags" :key="tag">#{{ tag }}</span>
        </div>
        <div class="kb-card__foot">
          <small>更新于 {{ item.updatedAt }}</small>
          <span class="kb-card__helpful">
            <Icon icon="lucide:thumbs-up" />
            {{ item.helpful }} 有帮助
          </span>
        </div>
      </article>
    </div>
    <p v-if="filtered.length === 0" class="kb-empty">未找到匹配的知识条目。</p>

    <Modal
      v-model:open="previewOpen"
      :title="preview?.title"
      :footer="null"
      width="640px"
    >
      <div class="kb-modal">
        <div class="kb-modal__meta">
          <Tag color="green">{{ preview?.category }}</Tag>
          <span>更新于 {{ preview?.updatedAt }}</span>
          <span>
            <Icon icon="lucide:eye" />
            {{ preview?.views }}
          </span>
        </div>
        <p class="kb-modal__summary">{{ preview?.summary }}</p>
        <pre class="kb-modal__content">{{ preview?.content }}</pre>
        <div class="kb-modal__tags">
          <span v-for="tag in preview?.tags" :key="tag">#{{ tag }}</span>
        </div>
      </div>
    </Modal>
  </section>
</template>

<style scoped>
.ticket-page {
  max-width: 1280px;
  height: 100%;
  min-height: 0;
  padding: 24px;
  overflow: auto;
}

.ticket-page__header {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 22px 26px;
  margin-bottom: 18px;
  color: #fff;
  background: linear-gradient(125deg, #073a33 0%, #0b6e65 66%, #178f7b 100%);
  border-radius: 18px;
  box-shadow: 0 15px 36px rgb(7 71 60 / 18%);
}

.ticket-page__heading {
  display: flex;
  gap: 14px;
  align-items: center;
}

.ticket-page__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  font-size: 24px;
  color: #c9fff2;
  background: rgb(124 238 208 / 18%);
  border-radius: 14px;
}

.ticket-page__eyebrow {
  font-size: 10px;
  font-weight: 800;
  color: #74c8b5;
  letter-spacing: 0.14em;
}

.ticket-page__header h1 {
  margin: 6px 0 4px;
  font-size: 22px;
  font-weight: 800;
}

.ticket-page__header p {
  margin: 0;
  font-size: 12px;
  color: rgb(255 255 255 / 72%);
}

.ticket-page__search {
  width: 280px;
}

.ticket-page__search :deep(.ant-input-affix-wrapper) {
  background: rgb(255 255 255 / 14%);
  border-color: rgb(255 255 255 / 28%);
}

.ticket-page__search :deep(.ant-input) {
  color: #fff;
}

.ticket-page__search :deep(.ant-input::placeholder),
.ticket-page__search :deep(.anticon) {
  color: rgb(255 255 255 / 70%);
}

.ticket-page__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.ticket-page__chips button {
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  color: #4a6b62;
  cursor: pointer;
  background: #fff;
  border: 1px solid #d3e4de;
  border-radius: 999px;
}

.ticket-page__chips button.is-active {
  color: #fff;
  background: #0b6e65;
  border-color: #0b6e65;
}

.kb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;
}

.kb-card {
  padding: 16px 18px;
  cursor: pointer;
  background: #fff;
  border: 1px solid #dce9e4;
  border-radius: 16px;
  transition: 0.2s ease;
}

.kb-card:hover {
  border-color: #9dcfc2;
  box-shadow: 0 12px 28px rgb(11 110 101 / 10%);
  transform: translateY(-2px);
}

.kb-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.kb-card__views {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font-size: 11px;
  color: #81958e;
}

.kb-card h3 {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 700;
  color: #143028;
}

.kb-card p {
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 1.6;
  color: #5a756d;
}

.kb-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.kb-card__tags span {
  padding: 2px 8px;
  font-size: 10px;
  color: #087162;
  background: #e3f1ec;
  border-radius: 999px;
}

.kb-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid #eef3f0;
}

.kb-card__foot small {
  font-size: 10px;
  color: #95a7a1;
}

.kb-card__helpful {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font-size: 10px;
  color: #0b806f;
}

.kb-empty {
  padding: 40px 0;
  font-size: 13px;
  color: #81958e;
  text-align: center;
}

.kb-modal__meta {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
  font-size: 11px;
  color: #81958e;
}

.kb-modal__meta :deep(.ant-tag) {
  margin: 0;
}

.kb-modal__summary {
  margin: 0 0 14px;
  font-size: 13px;
  font-weight: 600;
  color: #143028;
}

.kb-modal__content {
  padding: 14px;
  margin: 0 0 12px;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.8;
  color: #3f5b53;
  white-space: pre-wrap;
  background: #f7faf9;
  border: 1px solid #e1ece7;
  border-radius: 12px;
}

.kb-modal__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.kb-modal__tags span {
  padding: 2px 8px;
  font-size: 10px;
  color: #087162;
  background: #e3f1ec;
  border-radius: 999px;
}
</style>
