<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, Progress, Tag } from 'ant-design-vue';

import { managedProjects } from '#/api/mock-project-management';
import AiWorkPage from '#/views/app/mate/ai-work/components/ai-work-page.vue';

import ProjectCreateWizard from '../components/project-create-wizard.vue';

const router = useRouter();
const wizardOpen = ref(false);

function healthColor(health: string) {
  if (health === 'healthy') return 'green';
  if (health === 'at-risk' || health === 'blocked') return 'red';
  return 'orange';
}
</script>

<template>
  <AiWorkPage
    eyebrow="MY PROJECTS"
    title="我的项目"
    description="从项目目标进入 O/KR、成果物、讨论与风险上下文"
  >
    <template #actions>
      <Button type="primary" @click="wizardOpen = true">
        <Icon icon="lucide:sparkles" /> AI 立项
      </Button>
    </template>

    <div class="projects-page">
      <section class="project-summary">
        <article><span>参与项目</span><strong>3</strong><small>2 个本周有进展</small></article>
        <article><span>我的成果物</span><strong>7</strong><small>1 项将在 3 天内到期</small></article>
        <article><span>需要说明</span><strong class="is-warning">1</strong><small>客户 B 联调延期</small></article>
        <article><span>已确认周报证据</span><strong>12</strong><small>本周新增 3 条</small></article>
      </section>

      <section class="project-cards">
        <article
          v-for="project in managedProjects"
          :key="project.id"
          tabindex="0"
          role="button"
          @click="router.push(`/app/mate/employee/project-assistant/project/${project.id}`)"
          @keydown.enter="router.push(`/app/mate/employee/project-assistant/project/${project.id}`)"
        >
          <header>
            <div class="project-icon"><Icon icon="lucide:folder-kanban" /></div>
            <div>
              <div class="project-labels">
                <Tag>{{ project.typeLabel }}</Tag>
                <Tag :color="healthColor(project.health)">{{ project.healthLabel }}</Tag>
              </div>
              <h2>{{ project.name }}</h2>
              <p>{{ project.customer }} · 项目经理 {{ project.manager }}</p>
            </div>
          </header>
          <p class="project-description">{{ project.summary }}</p>
          <div class="project-progress">
            <span>阶段进度 {{ project.stage }}</span>
            <strong>{{ project.progress }}%</strong>
          </div>
          <Progress :percent="project.progress" :show-info="false" stroke-color="#0b806f" />
          <footer>
            <span><Icon icon="lucide:calendar-days" /> {{ project.dueDate }}</span>
            <span>按期概率 <b>{{ project.onTimeProbability }}%</b></span>
            <Icon icon="lucide:arrow-up-right" />
          </footer>
        </article>
      </section>
    </div>
    <ProjectCreateWizard v-model:open="wizardOpen" />
  </AiWorkPage>
</template>

<style scoped>
.projects-page {
  display: grid;
  gap: 14px;
}

.project-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.project-summary article {
  display: grid;
  gap: 5px;
  padding: 15px;
  background: #fff;
  border: 1px solid #dbe7e3;
  border-radius: 13px;
}

.project-summary span,
.project-summary small {
  font-size: 10px;
  color: #71857e;
}

.project-summary strong {
  font-size: 24px;
  color: #173b33;
}

.project-summary strong.is-warning {
  color: #c66e2c;
}

.project-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.project-cards > article {
  padding: 18px;
  cursor: pointer;
  background: #fff;
  border: 1px solid #d9e6e1;
  border-radius: 17px;
  box-shadow: 0 10px 26px rgb(18 57 45 / 5%);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.project-cards > article:hover,
.project-cards > article:focus-visible {
  border-color: #78b5a7;
  box-shadow: 0 14px 32px rgb(18 57 45 / 10%);
}

.project-cards > article:focus-visible {
  outline: 3px solid rgb(11 128 111 / 18%);
  outline-offset: 2px;
}

.project-cards header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.project-icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 42px;
  height: 42px;
  font-size: 19px;
  color: #0b806f;
  background: #e8f4f0;
  border-radius: 11px;
}

.project-labels {
  display: flex;
  gap: 5px;
}

.project-cards h2 {
  margin: 8px 0 3px;
  font-size: 15px;
  color: #183b33;
}

.project-cards header p,
.project-description {
  margin: 0;
  font-size: 11px;
  line-height: 1.6;
  color: #687e76;
}

.project-description {
  min-height: 52px;
  padding: 14px 0;
}

.project-progress,
.project-cards footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.project-progress {
  margin-bottom: 4px;
  font-size: 10px;
  color: #6c8079;
}

.project-progress strong {
  color: #234b41;
}

.project-cards footer {
  gap: 10px;
  padding-top: 12px;
  margin-top: 10px;
  font-size: 10px;
  color: #70837c;
  border-top: 1px solid #e8efec;
}

.project-cards footer span {
  display: inline-flex;
  gap: 5px;
  align-items: center;
}

.project-cards footer b {
  color: #22483f;
}

.projects-page :deep(.ant-btn-primary) {
  background: #0b6e65;
  border-color: #0b6e65;
}

@media (max-width: 1080px) {
  .project-summary,
  .project-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .project-summary,
  .project-cards {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .project-cards > article {
    transition: none;
  }
}
</style>

