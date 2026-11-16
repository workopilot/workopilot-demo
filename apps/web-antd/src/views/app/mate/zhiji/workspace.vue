<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { ConfigProvider, theme } from 'ant-design-vue';

import './zhiji.css';

const route = useRoute();
const router = useRouter();
const menus = [
  { id: 'home', label: '应用首页', icon: 'lucide:house' },
  { id: 'schemes', label: '汇报方案', icon: 'lucide:layout-list' },
  { id: 'types', label: '报告类型', icon: 'lucide:shapes' },
  { id: 'sources', label: '数据源', icon: 'lucide:database' },
  { id: 'policies', label: '策略设置', icon: 'lucide:git-pull-request' },
];
</script>
<template>
  <ConfigProvider
    :theme="{
      inherit: false,
      algorithm: theme.defaultAlgorithm,
      token: {
        colorPrimary: '#147d70',
        colorBgContainer: '#ffffff',
        colorBgElevated: '#ffffff',
        colorText: '#203c38',
        colorTextDisabled: '#89968f',
        colorBgContainerDisabled: '#f2f5f3',
        borderRadius: 8,
        fontFamily: 'inherit',
        fontSize: 14,
      },
    }"
  >
    <div class="zj-shell">
      <aside class="zj-sidebar">
        <div class="zj-brand">
          <span class="zj-logo"><Icon icon="lucide:book-open-check" /></span>
          <div><strong>知记</strong><small>AI 汇报管理</small></div>
        </div>
        <p class="zj-nav-label">管理工作区</p>
        <nav aria-label="知记管理菜单">
          <button
            v-for="menu in menus"
            :key="menu.id"
            :class="{ active: route.path.includes(`/zhiji/${menu.id}`) }"
            :aria-current="
              route.path.includes(`/zhiji/${menu.id}`) ? 'page' : undefined
            "
            @click="router.push(`/app/mate/apps/zhiji/${menu.id}`)"
          >
            <Icon :icon="menu.icon" /><span>{{ menu.label }}</span
            ><Icon
              v-if="route.path.includes(`/zhiji/${menu.id}`)"
              class="zj-nav-arrow"
              icon="lucide:chevron-right"
            />
          </button>
        </nav>
        <div class="zj-sidebar-bottom">
          <button
            @click="
              router.push('/app/mate/employee/new-report-assistant/reports')
            "
          >
            <Icon icon="lucide:arrow-up-right" /> 打开汇报者端</button
          ><small
            ><Icon icon="lucide:flask-conical" /> 演示工作区 · 刷新后重置</small
          >
        </div>
      </aside>
      <main class="zj-main"><RouterView /></main>
    </div>
  </ConfigProvider>
</template>
