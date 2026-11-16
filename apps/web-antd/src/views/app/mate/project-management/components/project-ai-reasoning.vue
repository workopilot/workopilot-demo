<script setup lang="ts">
import { computed } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Tag } from 'ant-design-vue';

import { useProjectManagementDemoStore } from '#/store/project-management-demo';

const props = withDefaults(
  defineProps<{
    compact?: boolean;
    role?: 'executor' | 'manager';
  }>(),
  { compact: false, role: 'executor' },
);

const emit = defineEmits<{
  action: [action: string];
}>();

const store = useProjectManagementDemoStore();
const tone = computed(() => {
  const health = store.activeStage.health;
  if (health === 'blocked' || health === 'at-risk') return 'danger';
  if (health === 'watch') return 'warning';
  return 'success';
});

const actionLabel = computed(() =>
  props.role === 'manager'
    ? store.state.stage >= 4
      ? '生成升级会议议程'
      : '查看干预建议'
    : store.state.stage >= 3
      ? '生成补救计划'
      : '开始处理',
);
</script>

<template>
  <article
    class="reasoning-card"
    :class="[`is-${tone}`, { 'is-compact': compact }]"
  >
    <header>
      <div>
        <span class="reasoning-card__icon"><Icon icon="lucide:sparkles" /></span>
        <div>
          <small>AI MANAGEMENT JUDGEMENT</small>
          <h2>{{ store.activeStage.headline }}</h2>
        </div>
      </div>
      <Tag :color="tone === 'danger' ? 'red' : tone === 'warning' ? 'orange' : 'green'">
        {{ store.activeStage.healthLabel }} · 按期 {{ store.activeStage.probability }}%
      </Tag>
    </header>

    <p>{{ store.activeStage.explanation }}</p>

    <div v-if="!compact" class="reasoning-card__why">
      <div>
        <Icon icon="lucide:book-open-check" />
        <span><b>规则</b> 标准交付项目成果物与三段升级规则</span>
      </div>
      <div>
        <Icon icon="lucide:paperclip" />
        <span><b>证据</b> W31/W32 周报、联调记录与客户环境沟通</span>
      </div>
      <div>
        <Icon icon="lucide:user-round-check" />
        <span><b>角色</b> {{ role === 'manager' ? '项目经理拥有协调与升级决策权' : '负责人可补充成果物并执行补救动作' }}</span>
      </div>
    </div>

    <footer>
      <div>
        <small>下一步建议</small>
        <strong>{{ store.activeStage.nextAction }}</strong>
      </div>
      <Button type="primary" @click="emit('action', actionLabel)">
        {{ actionLabel }} <Icon icon="lucide:arrow-right" />
      </Button>
    </footer>
  </article>
</template>

<style scoped>
.reasoning-card {
  padding: 18px;
  background: #fff;
  border: 1px solid #d7e5df;
  border-left: 4px solid #12806e;
  border-radius: 16px;
  box-shadow: 0 12px 28px rgb(18 57 45 / 7%);
}

.reasoning-card.is-warning {
  border-left-color: #d18a2e;
}

.reasoning-card.is-danger {
  border-left-color: #d45146;
}

.reasoning-card header,
.reasoning-card header > div,
.reasoning-card footer,
.reasoning-card__why > div {
  display: flex;
  align-items: center;
}

.reasoning-card header {
  gap: 16px;
  justify-content: space-between;
}

.reasoning-card header > div {
  gap: 12px;
  min-width: 0;
}

.reasoning-card__icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 42px;
  height: 42px;
  font-size: 19px;
  color: #0b806f;
  background: #e8f4f0;
  border-radius: 12px;
}

.reasoning-card small {
  font-size: 9px;
  font-weight: 800;
  color: #0b806f;
  letter-spacing: 0.09em;
}

.reasoning-card h2 {
  margin: 3px 0 0;
  font-size: 17px;
  color: #14362f;
}

.reasoning-card > p {
  margin: 14px 0;
  font-size: 13px;
  line-height: 1.7;
  color: #5b736a;
}

.reasoning-card__why {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding: 10px;
  background: #f4f8f6;
  border-radius: 10px;
}

.reasoning-card__why > div {
  gap: 8px;
  min-width: 0;
  font-size: 11px;
  color: #61786f;
}

.reasoning-card__why svg {
  flex: none;
  color: #0b806f;
}

.reasoning-card__why b {
  color: #284b43;
}

.reasoning-card footer {
  gap: 18px;
  justify-content: space-between;
  padding-top: 14px;
  margin-top: 14px;
  border-top: 1px solid #e8efec;
}

.reasoning-card footer > div {
  display: grid;
  gap: 4px;
}

.reasoning-card footer strong {
  font-size: 12px;
  color: #23443d;
}

.reasoning-card :deep(.ant-btn-primary) {
  min-height: 40px;
  background: #0b6e65;
  border-color: #0b6e65;
}

.reasoning-card.is-compact {
  padding: 14px;
}

.reasoning-card.is-compact > p {
  margin-bottom: 8px;
}

@media (max-width: 900px) {
  .reasoning-card__why {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .reasoning-card header,
  .reasoning-card footer {
    align-items: flex-start;
  }

  .reasoning-card footer {
    flex-direction: column;
  }
}
</style>

