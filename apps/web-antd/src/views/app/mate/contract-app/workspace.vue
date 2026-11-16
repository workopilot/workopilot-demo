<!-- 智能合同应用工作台外壳：左侧应用导航（合同类型管理/合同授权管理） + 右侧页面内容 -->
<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';

const appIcon = `${import.meta.env.BASE_URL}mate/apps/contract.svg`;

const route = useRoute();
const router = useRouter();

const menus = [
  {
    key: 'schemes',
    label: '合同类型管理',
    icon: 'lucide:files',
    path: '/app/mate/apps/smart-contract/schemes',
  },
  {
    key: 'authorization',
    label: '合同授权管理',
    icon: 'lucide:shield-check',
    path: '/app/mate/apps/smart-contract/authorization',
  },
];

function isActive(path: string) {
  return route.path.startsWith(path);
}
</script>

<template>
  <div class="sc-shell">
    <aside class="sc-menu">
      <header>
        <img :src="appIcon" alt="智能合同" />
        <div>
          <strong>智能合同</strong>
          <span>合同类型管理与授权</span>
        </div>
      </header>
      <div class="sc-menu__label">功能菜单</div>
      <nav aria-label="智能合同管理菜单" class="sc-menu__nav">
        <button
          v-for="menu in menus"
          :key="menu.key"
          type="button"
          :class="{ 'is-active': isActive(menu.path) }"
          @click="router.push(menu.path)"
        >
          <Icon :icon="menu.icon" />
          <span>{{ menu.label }}</span>
        </button>
      </nav>
      <footer>
        <Icon icon="lucide:flask-conical" />
        <span>演示工作区 · 刷新后重置</span>
      </footer>
    </aside>
    <main class="sc-main"><RouterView /></main>
  </div>
</template>

<style scoped>
.sc-shell {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.sc-menu {
  display: flex;
  flex: none;
  flex-direction: column;
  width: 248px;
  padding: 16px 12px;
  background: #f7faf9;
  border-right: 1px solid #dbe7e2;
}

.sc-menu header {
  display: flex;
  gap: 11px;
  align-items: center;
  padding: 6px 8px 14px;
  border-bottom: 1px solid #e3eeea;
}

.sc-menu header img {
  width: 38px;
  height: 38px;
  object-fit: cover;
  border-radius: 11px;
}

.sc-menu header strong {
  display: block;
  font-size: 15px;
  color: #12362f;
}

.sc-menu header span {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  color: #7a938b;
}

.sc-menu__label {
  padding: 14px 10px 6px;
  font-size: 10px;
  font-weight: 800;
  color: #7a938b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.sc-menu__nav {
  display: grid;
  gap: 5px;
}

.sc-menu__nav button {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
  min-height: 42px;
  padding: 9px 12px;
  font-size: 13px;
  color: #2c4b44;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 11px;
  transition: 0.16s ease;
}

.sc-menu__nav button svg {
  width: 16px;
  height: 16px;
  color: #5e7d75;
}

.sc-menu__nav button:hover {
  background: #fff;
  border-color: #cfe2db;
}

.sc-menu__nav button.is-active {
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #0c8777, #0b675e);
  border-color: transparent;
  box-shadow: 0 8px 18px rgb(11 110 101 / 22%);
}

.sc-menu__nav button.is-active svg {
  color: #fff;
}

.sc-menu footer {
  display: flex;
  gap: 7px;
  align-items: center;
  padding: 10px 12px;
  margin-top: auto;
  font-size: 11px;
  color: #7a938b;
  background: #eef5f2;
  border-radius: 10px;
}

.sc-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

@media (max-width: 960px) {
  .sc-menu {
    width: 64px;
    padding: 12px 8px;
  }

  .sc-menu header div,
  .sc-menu header strong,
  .sc-menu header span,
  .sc-menu__label,
  .sc-menu__nav button span,
  .sc-menu footer {
    display: none;
  }

  .sc-menu header,
  .sc-menu__nav button {
    justify-content: center;
    padding: 8px;
  }
}
</style>
