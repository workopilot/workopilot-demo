<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';

const route = useRoute();
const router = useRouter();

const menus = [
  {
    key: 'weekly-settings',
    title: '周报设置',
    icon: 'lucide:settings-2',
    path: '/app/mate/apps/ai-work/weekly-settings',
  },
  {
    key: 'department-policy',
    title: '部门分析策略',
    icon: 'lucide:brain-circuit',
    path: '/app/mate/apps/ai-work/department-policy',
  },
  {
    key: 'executions',
    title: '执行记录',
    icon: 'lucide:history',
    path: '/app/mate/apps/ai-work/executions',
  },
];

const activeKey = computed(
  () =>
    menus.find((item) => route.path.startsWith(item.path))?.key ||
    'weekly-settings',
);
</script>

<template>
  <div class="ai-work-app-shell">
    <aside class="ai-work-app-menu">
      <header>
        <img src="/mate/apps/weekly.png" alt="AI Work" />
        <div>
          <strong>AI Work</strong>
          <span>AI 周报与工作复盘</span>
        </div>
      </header>
      <div class="ai-work-app-menu__label">业务功能菜单</div>
      <nav aria-label="AI Work 管理菜单">
        <button
          v-for="menu in menus"
          :key="menu.key"
          type="button"
          :class="{ 'is-active': activeKey === menu.key }"
          @click="router.push(menu.path)"
        >
          <Icon :icon="menu.icon" />
          <span>{{ menu.title }}</span>
        </button>
      </nav>
      <footer>
        <Icon icon="lucide:shield-check" />
        AI Work 配置仅用于 Demo
      </footer>
    </aside>
    <main class="ai-work-app-content"><RouterView /></main>
  </div>
</template>

<style scoped>
.ai-work-app-shell {
  display: flex;
  gap: 16px;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.ai-work-app-menu {
  display: flex;
  flex-direction: column;
  width: 240px;
  min-width: 240px;
  min-height: 0;
  padding: 16px;
  background: #fff;
  border: 1px solid #d5e4df;
  border-radius: 24px;
}

.ai-work-app-menu header {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 2px 4px 14px;
  border-bottom: 1px solid #dbe7e3;
}

.ai-work-app-menu header img {
  width: 38px;
  height: 38px;
  object-fit: cover;
  border-radius: 11px;
}

.ai-work-app-menu header div {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.ai-work-app-menu header strong {
  font-size: 16px;
  color: #0d2e28;
}

.ai-work-app-menu header span,
.ai-work-app-menu footer {
  font-size: 11px;
  color: #71867f;
}

.ai-work-app-menu__label {
  padding: 16px 8px 8px;
  font-size: 11px;
  font-weight: 700;
  color: #315e55;
}

.ai-work-app-menu nav {
  display: grid;
  gap: 7px;
}

.ai-work-app-menu nav button {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
  padding: 11px 12px;
  font-size: 13px;
  color: #536b65;
  text-align: left;
  cursor: pointer;
  background: #f7faf9;
  border: 0;
  border-radius: 14px;
}

.ai-work-app-menu nav button.is-active {
  font-weight: 700;
  color: #087365;
  background: #d9eee8;
  box-shadow: inset 0 0 0 1px #9dcfc2;
}

.ai-work-app-menu footer {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 14px 4px 2px;
  margin-top: auto;
  border-top: 1px solid #e2ebe8;
}

.ai-work-app-content {
  flex: 1;
  min-width: 0;
  min-height: 0;
}

@media (max-width: 1280px) {
  .ai-work-app-menu {
    width: 210px;
    min-width: 210px;
  }
}
</style>
