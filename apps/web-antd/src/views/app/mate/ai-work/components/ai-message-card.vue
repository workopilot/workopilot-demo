<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import type { AiWorkCard } from '#/types/ai-work';

import { Icon } from '@iconify/vue';
import { Button, Tag } from 'ant-design-vue';

defineProps<{ card: AiWorkCard }>();
const emit = defineEmits<{ action: [id: string] }>();
</script>

<template>
  <!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
  <article class="ai-message-card" :class="`is-${card.type}`">
    <template v-if="card.type === 'action'">
      <header>
        <Icon icon="lucide:sparkles" />
        <span>AI Action</span>
      </header>
      <h3>{{ card.title }}</h3>
      <p>{{ card.description }}</p>
      <div class="ai-message-card__meta">
        <Tag v-for="item in card.meta" :key="item">{{ item }}</Tag>
      </div>
      <footer>
        <Button
          v-for="action in card.actions"
          :key="action.id"
          :type="action.kind === 'primary' ? 'primary' : 'default'"
          size="small"
          @click="emit('action', action.id)"
        >
          {{ action.label }}
        </Button>
      </footer>
    </template>

    <template v-else-if="card.type === 'insight'">
      <header>
        <Icon icon="lucide:triangle-alert" />
        <span>AI Insight</span>
      </header>
      <div class="ai-message-card__headline">
        <h3>{{ card.title }}</h3>
        <Tag :color="card.level === 'high' ? 'red' : 'orange'">
          {{ card.level === 'high' ? '高风险' : '中风险' }}
        </Tag>
      </div>
      <p>{{ card.description }}</p>
      <div class="ai-message-card__meta">
        <Tag>{{ card.object }}</Tag>
        <Tag>{{ card.duration }}</Tag>
      </div>
      <footer>
        <Button size="small" @click="emit('action', 'evidence')">
          查看证据
        </Button>
        <Button type="primary" size="small" @click="emit('action', 'review')">
          查看周报
        </Button>
      </footer>
    </template>

    <template v-else-if="card.type === 'question'">
      <header>
        <Icon icon="lucide:message-circle-question" />
        <span>AI Question</span>
      </header>
      <h3>{{ card.question }}</h3>
      <footer class="is-wrap">
        <Button
          v-for="option in card.options"
          :key="option"
          size="small"
          @click="emit('action', `answer:${option}`)"
        >
          {{ option }}
        </Button>
      </footer>
    </template>

    <template v-else>
      <header>
        <Icon icon="lucide:link" />
        <span>AI Deep Link</span>
      </header>
      <h3>{{ card.title }}</h3>
      <p>{{ card.description }}</p>
      <footer>
        <Button type="primary" size="small" @click="emit('action', card.route)">
          {{ card.actionLabel }}
          <Icon icon="lucide:arrow-right" />
        </Button>
      </footer>
    </template>
  </article>
</template>

<style scoped>
.ai-message-card {
  width: min(560px, 100%);
  padding: 14px 16px;
  margin-top: 8px;
  background: #fff;
  border: 1px solid #dce7e3;
  border-radius: 14px;
  box-shadow: 0 9px 26px rgb(18 57 45 / 8%);
}

.ai-message-card header {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 10px;
  font-weight: 800;
  color: #0b806f;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.ai-message-card h3 {
  margin: 10px 0 5px;
  font-size: 14px;
  color: #15372f;
}

.ai-message-card p {
  margin: 0;
  font-size: 12px;
  line-height: 1.65;
  color: #61776f;
}

.ai-message-card__headline {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.ai-message-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.ai-message-card footer {
  display: flex;
  gap: 8px;
  padding-top: 11px;
  margin-top: 13px;
  border-top: 1px solid #edf2f0;
}

.ai-message-card footer.is-wrap {
  flex-wrap: wrap;
  margin-top: 8px;
  border-top: 0;
}

.ai-message-card :deep(.ant-btn-primary) {
  background: #0b6e65;
  border-color: #0b6e65;
}

.ai-message-card.is-insight {
  border-left: 4px solid #e9a23b;
}

.ai-message-card.is-question {
  background: #f5fbf8;
  border-color: #badbd2;
}
</style>
