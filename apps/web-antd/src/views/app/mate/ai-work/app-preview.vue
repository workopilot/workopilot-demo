<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button } from 'ant-design-vue';

import { aiWorkApplications } from '#/api/mock-data-ai-work';

const route = useRoute();
const application = computed(
  () =>
    aiWorkApplications.find((item) => item.id === route.params.appId) ||
    aiWorkApplications[1]!,
);
</script>

<template>
  <section class="app-preview">
    <img :src="application.icon" :alt="application.name" />
    <div>
      <span>SMART APPLICATION</span>
      <h1>{{ application.name }}</h1>
      <p>{{ application.description }}</p>
      <Button type="primary">
        <Icon icon="lucide:play" />
        进入演示
      </Button>
    </div>
  </section>
</template>

<style scoped>
.app-preview {
  display: flex;
  gap: 24px;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #fff;
  border: 1px solid #d5e4df;
  border-radius: 24px;
}

.app-preview img {
  width: 88px;
  height: 88px;
  object-fit: cover;
  border-radius: 24px;
}

.app-preview span {
  font-size: 10px;
  font-weight: 800;
  color: #0b8b76;
  letter-spacing: 0.12em;
}

.app-preview h1 {
  margin: 8px 0;
  font-size: 28px;
  color: #102e29;
}

.app-preview p {
  margin: 0 0 18px;
  color: #698078;
}

.app-preview :deep(.ant-btn-primary) {
  background: #0b6e65;
  border-color: #0b6e65;
}
</style>
