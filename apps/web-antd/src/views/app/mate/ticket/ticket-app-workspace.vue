<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';

const route = useRoute();
const router = useRouter();

const publicAsset = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

const menuGroups = [
  {
    label: '工单中心',
    items: [
      {
        key: 'overview',
        title: '工单概览',
        icon: 'lucide:chart-no-axes-combined',
        path: '/app/mate/apps/smart-ticket/overview',
      },
      {
        key: 'ticket-query',
        title: '工单查询',
        icon: 'lucide:search',
        path: '/app/mate/apps/smart-ticket/ticket-query',
      },
    ],
  },
  {
    label: '主数据管理',
    items: [
      {
        key: 'devices',
        title: '资产管理',
        icon: 'lucide:server',
        path: '/app/mate/apps/smart-ticket/devices',
      },
      {
        key: 'ops-staff',
        title: '运维人员',
        icon: 'lucide:users',
        path: '/app/mate/apps/smart-ticket/ops-staff',
      },
    ],
  },
  {
    label: '实施中心',
    items: [
      {
        key: 'scenario',
        title: '场景管理',
        icon: 'lucide:layout-dashboard',
        path: '/app/mate/apps/smart-ticket/scenario',
      },
      {
        key: 'permission-control',
        title: '工单权限',
        icon: 'lucide:shield',
        path: '/app/mate/apps/smart-ticket/permission-control',
      },
    ],
  },
];

const allMenus = computed(() => menuGroups.flatMap((group) => group.items));

const activeKey = computed(
  () =>
    allMenus.value.find((item) => route.path.startsWith(item.path))?.key ||
    'scenario',
);

const appIcon = publicAsset('mate/apps/ticket.svg');
</script>

<template>
  <div class="ticket-app-shell">
    <aside class="ticket-app-menu">
      <header>
        <img :src="appIcon" alt="知应工单" />
        <div>
          <strong>知应工单</strong>
          <span>工单管理与智能派单</span>
        </div>
      </header>
      <div class="ticket-app-menu__label">业务功能菜单</div>
      <nav aria-label="知应工单管理菜单" class="ticket-app-menu__nav">
        <div
          v-for="group in menuGroups"
          :key="group.label"
          class="ticket-app-menu__group"
        >
          <div class="ticket-app-menu__group-label">{{ group.label }}</div>
          <button
            v-for="menu in group.items"
            :key="menu.key"
            type="button"
            :class="{ 'is-active': activeKey === menu.key }"
            @click="router.push(menu.path)"
          >
            <Icon :icon="menu.icon" />
            <span>{{ menu.title }}</span>
          </button>
        </div>
      </nav>
      <footer>
        <Icon icon="lucide:shield-check" />
        <a
          class="ticket-app-menu__doc-link"
          :href="publicAsset('ticket-design-doc.md')"
          rel="noopener noreferrer"
          target="_blank"
        >
          <span>知应工单技术设计文档</span>
          <Icon
            icon="lucide:arrow-up-right"
            class="ticket-app-menu__doc-link-icon"
          />
        </a>
      </footer>
    </aside>
    <main class="ticket-app-content"><RouterView /></main>
  </div>
</template>

<style scoped>
.ticket-app-shell {
  display: flex;
  gap: 16px;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.ticket-app-menu {
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

.ticket-app-menu header {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 2px 4px 14px;
  border-bottom: 1px solid #dbe7e3;
}

.ticket-app-menu header img {
  width: 38px;
  height: 38px;
  object-fit: cover;
  border-radius: 11px;
}

.ticket-app-menu header div {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.ticket-app-menu header strong {
  font-size: 16px;
  color: #0d2e28;
}

.ticket-app-menu header span,
.ticket-app-menu footer {
  font-size: 11px;
  color: #71867f;
}

.ticket-app-menu__doc-link {
  position: relative;
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 2px 4px;
  margin: -2px -4px;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.4;
  color: #0b6e65;
  text-decoration: none;
  cursor: pointer;
  border-radius: 6px;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.ticket-app-menu__doc-link::after {
  position: absolute;
  right: 4px;
  bottom: 0;
  left: 4px;
  height: 1px;
  content: '';
  background: currentcolor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.25s ease;
}

.ticket-app-menu__doc-link:hover {
  color: #087365;
  background-color: #ecf5f2;
}

.ticket-app-menu__doc-link:hover::after {
  transform: scaleX(1);
}

.ticket-app-menu__doc-link:active {
  transform: scale(0.97);
}

.ticket-app-menu__doc-link:focus-visible {
  outline: 2px solid #0b6e65;
  outline-offset: 2px;
}

.ticket-app-menu__doc-link-icon {
  flex-shrink: 0;
  font-size: 11px;
  transition: transform 0.2s ease;
}

.ticket-app-menu__doc-link:hover .ticket-app-menu__doc-link-icon {
  transform: translate(1px, -1px);
}

.ticket-app-menu__label {
  padding: 16px 8px 8px;
  font-size: 11px;
  font-weight: 700;
  color: #315e55;
}

.ticket-app-menu__nav {
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
}

.ticket-app-menu__group {
  display: grid;
  gap: 7px;
}

.ticket-app-menu__group-label {
  padding: 0 8px 4px;
  font-size: 10px;
  font-weight: 700;
  color: #94a8a1;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.ticket-app-menu nav button,
.ticket-app-menu__nav button {
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

.ticket-app-menu nav button.is-active,
.ticket-app-menu__nav button.is-active {
  font-weight: 700;
  color: #087365;
  background: #d9eee8;
  box-shadow: inset 0 0 0 1px #9dcfc2;
}

.ticket-app-menu footer {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 14px 4px 2px;
  margin-top: auto;
  border-top: 1px solid #e2ebe8;
}

.ticket-app-content {
  flex: 1;
  min-width: 0;
  min-height: 0;
}

@media (max-width: 1280px) {
  .ticket-app-menu {
    width: 210px;
    min-width: 210px;
  }
}
</style>
