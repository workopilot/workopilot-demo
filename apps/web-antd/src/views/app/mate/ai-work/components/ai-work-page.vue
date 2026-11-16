<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import { Icon } from '@iconify/vue';

defineProps<{
  description?: string;
  eyebrow?: string;
  icon?: string;
  title: string;
}>();
</script>

<template>
  <section class="ai-work-page">
    <header
      class="ai-work-page__header"
      :class="{ 'is-compact': !eyebrow && !description }"
    >
      <div>
        <span v-if="eyebrow">{{ eyebrow }}</span>
        <h1>
          <Icon v-if="icon" :icon="icon" />
          {{ title }}
          <slot name="title-suffix"></slot>
        </h1>
        <p v-if="description">{{ description }}</p>
      </div>
      <div class="ai-work-page__actions"><slot name="actions"></slot></div>
    </header>
    <div class="ai-work-page__body"><slot></slot></div>
  </section>
</template>

<style scoped>
.ai-work-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  container-type: inline-size;
  overflow: hidden;
  background: #f8fbfa;
  border: 1px solid #d5e4df;
  border-radius: 24px;
  box-shadow: 0 18px 44px rgb(18 57 45 / 6%);
}

.ai-work-page__header {
  display: flex;
  flex: none;
  gap: 20px;
  align-items: center;
  justify-content: space-between;
  min-height: 84px;
  padding: 15px 22px;
  background: rgb(255 255 255 / 88%);
  border-bottom: 1px solid #e0ebe7;
}

.ai-work-page__header span {
  font-size: 10px;
  font-weight: 800;
  color: #0b8a73;
  letter-spacing: 0.12em;
}

.ai-work-page__header h1 {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 3px 0 0;
  font-size: 22px;
  line-height: 1.2;
  color: #102e29;
}

.ai-work-page__header h1 svg {
  font-size: 20px;
  color: #287564;
}

.ai-work-page__header.is-compact {
  min-height: 54px;
  padding-top: 9px;
  padding-bottom: 9px;
}

.ai-work-page__header.is-compact h1 {
  margin: 0;
  font-size: 19px;
}

.ai-work-page__header p {
  margin: 5px 0 0;
  font-size: 12px;
  color: #6d827b;
}

.ai-work-page__actions {
  display: flex;
  flex: none;
  gap: 8px;
  align-items: center;
}

.ai-work-page__body {
  flex: 1;
  min-height: 0;
  padding: 18px;
  overflow: auto;
}

:deep(.ant-btn-primary) {
  background: #0b6e65;
  border-color: #0b6e65;
}

@media (max-width: 1280px) {
  .ai-work-page__header {
    padding-right: 16px;
    padding-left: 16px;
  }

  .ai-work-page__body {
    padding: 14px;
  }
}

@container (max-width: 620px) {
  .ai-work-page__header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .ai-work-page__actions {
    flex-wrap: wrap;
    width: 100%;
  }

  .ai-work-page__body {
    padding: 12px;
  }
}
</style>
