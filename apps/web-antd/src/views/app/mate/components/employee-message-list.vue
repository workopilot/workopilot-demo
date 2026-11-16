<script setup lang="ts">
import type { MateEmployee, MateMessage } from '#/types/mate';

import { nextTick, ref, watch } from 'vue';

import { Button, Empty, Spin } from 'ant-design-vue';

const props = defineProps<{
  employee: MateEmployee;
  loading: boolean;
  messages: MateMessage[];
  sending: boolean;
}>();

const emit = defineEmits<{
  viewCard: [message: MateMessage];
}>();

const scroller = ref<HTMLElement>();

watch(
  () => [props.messages.length, props.sending],
  async () => {
    await nextTick();
    if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight;
  },
  { flush: 'post' },
);
</script>

<template>
  <div ref="scroller" class="employee-message-list">
    <div v-if="loading" class="employee-message-list__state"><Spin /></div>
    <Empty
      v-else-if="messages.length === 0"
      class="employee-message-list__state"
      description="开始一段新的协同对话"
    />
    <template v-else>
      <div
        v-for="item in messages"
        :key="item.id"
        class="employee-message"
        :class="`is-${item.role}`"
      >
        <div class="employee-message__stack">
          <div class="employee-message__bubble">
            <p>{{ item.content }}</p>
            <ol v-if="item.list?.length">
              <li v-for="entry in item.list" :key="entry">{{ entry }}</li>
            </ol>
            <p v-if="item.closing" class="employee-message__closing">
              {{ item.closing }}
            </p>
          </div>
          <section v-if="item.card" class="employee-skill-card">
            <div class="employee-skill-card__body">
              <span>{{ item.card.tag }}</span>
              <h3>{{ item.card.title }}</h3>
              <p>{{ item.card.summary }}</p>
            </div>
            <footer>
              <Button
                size="small"
                type="primary"
                @click="emit('viewCard', item)"
              >
                {{ item.card.actionLabel }}
              </Button>
            </footer>
          </section>
          <small>{{ item.time }}</small>
        </div>
      </div>
      <div v-if="sending" class="employee-message is-assistant">
        <div class="employee-message__bubble employee-message__thinking">
          <i></i>
          <i></i>
          <i></i>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.employee-message-list {
  flex: 1;
  min-height: 0;
  padding: 0 7.5% 20px;
  overflow-y: auto;
  background: linear-gradient(180deg, rgb(255 255 255 / 76%), #fbfdfc);
}

.employee-message-list__state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
}

.employee-message {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  max-width: 78%;
  margin-bottom: 16px;
}

.employee-message.is-user {
  flex-direction: row-reverse;
  margin-left: auto;
}

.employee-message__stack {
  min-width: 0;
}

.employee-message__bubble {
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.75;
  color: #34475d;
  background: #fff;
  border: 1px solid #e2eae7;
  border-radius: 4px 16px 16px;
  box-shadow: 0 6px 18px rgb(18 57 45 / 5%);
}

.is-user .employee-message__bubble {
  color: #fff;
  background: #0b6e65;
  border-color: #0b6e65;
  border-radius: 16px 4px 16px 16px;
}

.employee-message__bubble p {
  margin: 0;
  white-space: pre-line;
}

.employee-message__bubble ol {
  display: grid;
  gap: 8px;
  padding: 0;
  margin: 12px 0 0;
  list-style: none;
  counter-reset: result-item;
}

.employee-message__bubble li {
  counter-increment: result-item;
}

.employee-message__bubble li::before {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  margin-right: 9px;
  font-size: 12px;
  color: #3b82f6;
  content: counter(result-item);
  background: #eff6ff;
  border-radius: 4px;
}

.employee-message__closing {
  margin-top: 12px !important;
}

.employee-message__stack > small {
  display: block;
  margin-top: 4px;
  font-size: 10px;
  color: #9aaba5;
}

.is-user .employee-message__stack > small {
  text-align: right;
}

.employee-skill-card {
  min-width: min(520px, 100%);
  margin-top: 8px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #dfe7e4;
  border-radius: 8px;
  box-shadow: 0 8px 22px rgb(18 57 45 / 7%);
}

.employee-skill-card__body {
  padding: 14px 16px;
}

.employee-skill-card__body > span {
  display: inline-flex;
  padding: 3px 9px;
  font-size: 11px;
  font-weight: 650;
  color: #4f46e5;
  background: #eef2ff;
  border-radius: 4px;
}

.employee-skill-card h3 {
  margin: 11px 0 7px;
  font-size: 14px;
  color: #162c3a;
}

.employee-skill-card p {
  margin: 0;
  font-size: 12px;
  color: #73858f;
}

.employee-skill-card footer {
  padding: 10px 16px;
  border-top: 1px solid #e8eeeb;
}

.employee-skill-card footer :deep(.ant-btn-primary) {
  background: #063b34;
  border-color: #063b34;
}

.employee-message__thinking {
  display: flex;
  gap: 5px;
}

.employee-message__thinking i {
  width: 6px;
  height: 6px;
  background: #8da8a0;
  border-radius: 50%;
  animation: employee-thinking 1s infinite;
}

.employee-message__thinking i:nth-child(2) {
  animation-delay: 0.15s;
}

.employee-message__thinking i:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes employee-thinking {
  50% {
    opacity: 0.4;
    transform: translateY(-3px);
  }
}

@media (max-width: 768px) {
  .employee-message-list {
    padding: 16px;
  }

  .employee-message {
    max-width: 92%;
  }

  .employee-skill-card {
    min-width: 0;
  }
}
</style>
