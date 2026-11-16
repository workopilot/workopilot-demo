<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';

import { zhangkouApplications } from '#/api/mock-data-zhangkou';

const route = useRoute();
const router = useRouter();

const menus = [
  {
    key: 'template',
    title: '发票附件上传',
    icon: 'lucide:upload',
    path: '/app/mate/apps/zhangkou-filling/template',
  },
  {
    key: 'upload-records',
    title: '发票附件上传记录',
    icon: 'lucide:file-search',
    path: '/app/mate/apps/zhangkou-filling/upload-records',
  },
  {
    key: 'cycle',
    title: '数据上传',
    icon: 'lucide:database',
    path: '/app/mate/apps/zhangkou-filling/cycle',
  },
  {
    key: 'executions',
    title: '执行记录',
    icon: 'lucide:history',
    path: '/app/mate/apps/zhangkou-filling/executions',
  },
];

const activeKey = computed(
  () =>
    menus.find((item) => route.path.startsWith(item.path))?.key || 'template',
);

const appIcon = zhangkouApplications[0]?.icon || '';
</script>

<template>
  <div class="zhangkou-app-shell">
    <aside class="zhangkou-app-menu">
      <header>
        <img :src="appIcon" alt="账扣核销" />
        <div>
          <strong>账扣核销单请款单数据收集</strong>
          <span>账扣核销与请款单智能填报</span>
        </div>
      </header>
      <div class="zhangkou-app-menu__label">业务功能菜单</div>
      <nav aria-label="账扣核销管理菜单">
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
    </aside>
    <main class="zhangkou-app-content"><RouterView /></main>
  </div>
</template>

<style scoped>
.zhangkou-app-shell {
  display: flex;
  gap: 16px;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.zhangkou-app-menu {
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

.zhangkou-app-menu header {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 2px 4px 14px;
  border-bottom: 1px solid #dbe7e3;
}

.zhangkou-app-menu header img {
  width: 38px;
  height: 38px;
  object-fit: cover;
  border-radius: 11px;
}

.zhangkou-app-menu header div {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.zhangkou-app-menu header strong {
  font-size: 14px;
  color: #0d2e28;
}

.zhangkou-app-menu header span {
  font-size: 11px;
  color: #71867f;
}

.zhangkou-app-menu__label {
  padding: 16px 8px 8px;
  font-size: 11px;
  font-weight: 700;
  color: #315e55;
}

.zhangkou-app-menu nav {
  display: grid;
  gap: 7px;
}

.zhangkou-app-menu nav button {
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

.zhangkou-app-menu nav button.is-active {
  font-weight: 700;
  color: #087365;
  background: #d9eee8;
  box-shadow: inset 0 0 0 1px #9dcfc2;
}

.zhangkou-app-content {
  flex: 1;
  min-width: 0;
  min-height: 0;
}

@media (max-width: 1280px) {
  .zhangkou-app-menu {
    width: 210px;
    min-width: 210px;
  }
}
</style>
