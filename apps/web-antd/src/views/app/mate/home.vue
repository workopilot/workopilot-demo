<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import type { MateStats } from '#/types/mate';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, Card, Tag } from 'ant-design-vue';

import { getMateStats } from '#/api/mate';
import {
  mockMateAutomationTasks,
  mockMateEmployees,
  mockMateFiles,
} from '#/api/mock-data-mate';

const router = useRouter();
const stats = ref<MateStats>(getMateStats());
const greeting = computed(() =>
  new Date().getHours() < 12 ? '早上好，韩立' : '下午好，韩立',
);

onMounted(() => {
  stats.value = getMateStats();
});

function go(path: string) {
  void router.push(path);
}
</script>

<template>
  <!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
  <div class="mate-page mate-home">
    <section class="mate-hero">
      <div>
        <span class="mate-kicker">MATE SMART WORKSPACE</span>
        <h1>{{ greeting }}</h1>
        <p>让数字员工、知识文件和自动化任务，成为你每天可靠的工作搭档。</p>
        <div class="mate-hero__actions">
          <Button
            type="primary"
            size="large"
            @click="go('/app/mate/employees')"
          >
            <Icon icon="lucide:message-circle" />
            开始与员工对话
          </Button>
          <Button size="large" @click="go('/app/mate/files')">
            <Icon icon="lucide:upload-cloud" />
            上传文件
          </Button>
        </div>
      </div>
      <div class="mate-hero__orb">
        <div class="mate-hero__orb-inner"><Icon icon="lucide:sparkles" /></div>
        <span>工作台已就绪</span>
      </div>
    </section>

    <section class="mate-stat-grid">
      <Card
        v-for="item in [
          {
            label: '数字员工',
            value: stats.employeeCount,
            icon: 'lucide:bot',
            tone: 'green',
          },
          {
            label: '知识文件',
            value: stats.fileCount,
            icon: 'lucide:files',
            tone: 'blue',
          },
          {
            label: '自动化任务',
            value: stats.automationCount,
            icon: 'lucide:zap',
            tone: 'amber',
          },
          {
            label: '已完成执行',
            value: stats.completedCount,
            icon: 'lucide:circle-check',
            tone: 'violet',
          },
        ]"
        :key="item.label"
        class="mate-stat-card"
      >
        <span class="mate-stat-card__icon" :class="`is-${item.tone}`">
          <Icon :icon="item.icon" />
        </span>
        <span class="mate-stat-card__label">{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <small>
          较上周
          <b>+12%</b>
        </small>
      </Card>
    </section>

    <section class="mate-home-grid">
      <Card class="mate-list-card" :body-style="{ padding: 0 }">
        <template #title>
          <span class="mate-card-title">
            <Icon icon="lucide:bot" />
            最近沟通的数字员工
          </span>
        </template>
        <template #extra>
          <Button type="link" size="small" @click="go('/app/mate/employees')">
            查看全部
          </Button>
        </template>
        <button
          v-for="employee in mockMateEmployees.slice(0, 4)"
          :key="employee.id"
          class="mate-row"
          type="button"
          @click="go(`/app/mate/employee/${employee.id}`)"
        >
          <span
            class="mate-row__avatar"
            :style="{ background: employee.accent }"
          >
            <img :src="employee.avatar" :alt="`${employee.name} 员工头像`" />
          </span>
          <span class="mate-row__main">
            <b>{{ employee.name }} · {{ employee.role }}</b>
            <small>{{ employee.description }}</small>
          </span>
          <span class="mate-row__meta">
            <Tag v-if="employee.unread" color="red">
              {{ employee.unread }} 条未读
            </Tag>
            <small>{{ employee.lastActive }}</small>
            <Icon icon="lucide:chevron-right" />
          </span>
        </button>
      </Card>

      <Card class="mate-list-card" :body-style="{ padding: 0 }">
        <template #title>
          <span class="mate-card-title">
            <Icon icon="lucide:folder-open" />
            最近上传的文件
          </span>
        </template>
        <template #extra>
          <Button type="link" size="small" @click="go('/app/mate/files')">
            文件中心
          </Button>
        </template>
        <button
          v-for="file in mockMateFiles.slice(0, 4)"
          :key="file.id"
          class="mate-row"
          type="button"
          @click="go('/app/mate/files')"
        >
          <span class="mate-file-icon"><Icon icon="lucide:file-text" /></span>
          <span class="mate-row__main">
            <b>{{ file.name }}</b>
            <small>{{ file.category }} · {{ file.size }}</small>
          </span>
          <span class="mate-row__meta">
            <Tag
              :color="
                file.status === 'ready'
                  ? 'green'
                  : file.status === 'processing'
                    ? 'blue'
                    : 'red'
              "
            >
              {{
                file.status === 'ready'
                  ? '已就绪'
                  : file.status === 'processing'
                    ? '处理中'
                    : '失败'
              }}
            </Tag>
            <Icon icon="lucide:chevron-right" />
          </span>
        </button>
      </Card>
    </section>

    <section class="mate-home-grid mate-home-grid--bottom">
      <Card class="mate-list-card" :body-style="{ padding: 0 }">
        <template #title>
          <span class="mate-card-title">
            <Icon icon="lucide:zap" />
            自动化任务
          </span>
        </template>
        <template #extra>
          <Button type="link" size="small" @click="go('/app/mate/automation')">
            管理任务
          </Button>
        </template>
        <div
          v-for="task in mockMateAutomationTasks.slice(0, 3)"
          :key="task.id"
          class="mate-task-row"
        >
          <span
            class="mate-task-row__status"
            :class="`is-${task.status}`"
          ></span>
          <span class="mate-row__main">
            <b>{{ task.title }}</b>
            <small>{{ task.schedule }} · {{ task.lastRun }}</small>
          </span>
          <Tag :color="task.status === 'disabled' ? 'default' : 'green'">
            {{
              task.status === 'running'
                ? '执行中'
                : task.status === 'enabled'
                  ? '运行中'
                  : '已停用'
            }}
          </Tag>
        </div>
      </Card>
      <Card class="mate-tip-card">
        <div class="mate-tip-card__mark"><Icon icon="lucide:lightbulb" /></div>
        <div>
          <span class="mate-kicker">今日小贴士</span>
          <h3>把重复工作交给自动化</h3>
          <p>你可以让数字员工定时检查文件、生成简报并发送提醒。</p>
          <Button type="link" size="small" @click="go('/app/mate/automation')">
            去创建任务
            <Icon icon="lucide:arrow-right" />
          </Button>
        </div>
      </Card>
    </section>
  </div>
</template>

<style scoped>
.mate-page {
  max-width: 1420px;
  margin: 0 auto;
}

.mate-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 230px;
  padding: 30px 42px;
  overflow: hidden;
  color: #fff;
  background: linear-gradient(125deg, #073a33 0%, #0b6e65 66%, #178f7b 100%);
  border-radius: 18px;
  box-shadow: 0 15px 36px rgb(7 71 60 / 18%);
}

.mate-kicker {
  font-size: 10px;
  font-weight: 800;
  color: #74c8b5;
  letter-spacing: 0.14em;
}

.mate-hero h1 {
  margin: 10px 0 7px;
  font-size: 30px;
  font-weight: 850;
  letter-spacing: -0.03em;
}

.mate-hero p {
  max-width: 560px;
  margin: 0;
  font-size: 13px;
  color: rgb(255 255 255 / 72%);
}

.mate-hero__actions {
  display: flex;
  gap: 10px;
  margin-top: 24px;
}

.mate-hero__actions :deep(.ant-btn-primary) {
  font-weight: 750;
  color: #073a33;
  background: #32c8a5;
  border-color: #3bd3ae;
}

.mate-hero__actions :deep(.ant-btn:not(.ant-btn-primary)) {
  color: #fff;
  background: rgb(255 255 255 / 10%);
  border-color: rgb(255 255 255 / 28%);
}

.mate-hero__orb {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 190px;
  height: 190px;
  font-size: 11px;
  color: #a6ead9;
  background: radial-gradient(
    circle,
    rgb(98 224 191 / 28%),
    rgb(98 224 191 / 2%) 70%
  );
  border: 1px solid rgb(153 255 227 / 25%);
  border-radius: 50%;
}

.mate-hero__orb::before,
.mate-hero__orb::after {
  position: absolute;
  content: '';
  border: 1px solid rgb(125 240 210 / 25%);
  border-radius: 50%;
}

.mate-hero__orb::before {
  inset: 17px;
}

.mate-hero__orb::after {
  inset: 35px;
}

.mate-hero__orb-inner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  font-size: 25px;
  color: #c9fff2;
  background: rgb(124 238 208 / 18%);
  border-radius: 18px;
}

.mate-hero__orb span {
  position: absolute;
  bottom: 25px;
}

.mate-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.mate-stat-card :deep(.ant-card-body) {
  position: relative;
  display: grid;
  grid-template-columns: 42px 1fr;
  column-gap: 11px;
  min-height: 102px;
  padding: 16px;
}

.mate-stat-card__icon {
  display: inline-flex;
  grid-row: span 3;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  font-size: 19px;
  border-radius: 12px;
}

.is-green {
  color: #0c8b73;
  background: #e2f4ed;
}

.is-blue {
  color: #4e83b5;
  background: #e7f0f9;
}

.is-amber {
  color: #c78e21;
  background: #fff2d9;
}

.is-violet {
  color: #8865bd;
  background: #eee8fb;
}

.mate-stat-card__label {
  font-size: 11px;
  color: #729088;
}

.mate-stat-card strong {
  font-size: 28px;
  line-height: 1.1;
  color: #163c32;
}

.mate-stat-card small {
  font-size: 10px;
  color: #8b9f99;
}

.mate-stat-card small b {
  color: #18a77f;
}

.mate-home-grid {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 14px;
  margin-top: 18px;
}

.mate-home-grid--bottom {
  grid-template-columns: 1fr 1fr;
}

.mate-list-card :deep(.ant-card-head) {
  min-height: 54px;
  border-bottom-color: #edf2ef;
}

.mate-list-card :deep(.ant-card-head-title) {
  padding: 0;
}

.mate-card-title {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;
  color: #1a4338;
}

.mate-card-title :deep(svg) {
  color: #0b8a73;
}

.mate-row {
  display: flex;
  gap: 11px;
  align-items: center;
  width: 100%;
  min-height: 68px;
  padding: 10px 18px;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-bottom: 1px solid #eef3f0;
}

.mate-row:last-child {
  border-bottom: 0;
}

.mate-row:hover {
  background: #f6fbf9;
}

.mate-row__avatar,
.mate-file-icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 35px;
  height: 35px;
  overflow: hidden;
  font-weight: 800;
  color: #fff;
  border-radius: 11px;
}

.mate-row__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mate-file-icon {
  font-size: 17px;
  color: #0a806c;
  background: #e3f0ed;
}

.mate-row__main {
  flex: 1;
  min-width: 0;
}

.mate-row__main b,
.mate-row__main small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mate-row__main b {
  font-size: 12px;
  color: #24483e;
}

.mate-row__main small {
  margin-top: 4px;
  font-size: 10px;
  color: #81958e;
}

.mate-row__meta {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 10px;
  color: #95a7a1;
}

.mate-row__meta :deep(.ant-tag) {
  margin: 0;
  font-size: 10px;
}

.mate-task-row {
  display: flex;
  gap: 10px;
  align-items: center;
  min-height: 54px;
  padding: 8px 18px;
  border-bottom: 1px solid #eef3f0;
}

.mate-task-row:last-child {
  border-bottom: 0;
}

.mate-task-row__status {
  width: 8px;
  height: 8px;
  background: #b2c2bd;
  border-radius: 50%;
}

.mate-task-row__status.is-enabled {
  background: #20b486;
  box-shadow: 0 0 0 4px #def4eb;
}

.mate-task-row__status.is-running {
  background: #f2a52e;
  box-shadow: 0 0 0 4px #fff0d3;
}

.mate-tip-card :deep(.ant-card-body) {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  min-height: 162px;
  background: linear-gradient(135deg, #eff8f4, #e3f1ec);
}

.mate-tip-card__mark {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  font-size: 20px;
  color: #0d8b73;
  background: #cdece1;
  border-radius: 13px;
}

.mate-tip-card h3 {
  margin: 8px 0 6px;
  font-size: 16px;
  color: #1b473b;
}

.mate-tip-card p {
  margin: 0;
  font-size: 12px;
  line-height: 1.65;
  color: #6c8780;
}

@media (max-width: 900px) {
  .mate-hero {
    padding: 24px;
  }

  .mate-hero__orb {
    display: none;
  }

  .mate-stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .mate-home-grid,
  .mate-home-grid--bottom {
    grid-template-columns: 1fr;
  }
}
</style>
