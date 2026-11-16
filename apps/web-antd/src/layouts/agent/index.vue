<script lang="ts" setup>
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Breadcrumb, BreadcrumbItem } from 'ant-design-vue';

import { useAgentStore } from '#/store/agent';

const route = useRoute();
const router = useRouter();
const agentStore = useAgentStore();

const currentAgent = computed(() => agentStore.currentAgent);

// Extract agent code from route path
watch(
  () => route.path,
  (path) => {
    const match = path.match(/^\/agent\/([^/]+)/);
    if (match && match[1] && match[1] !== 'management') {
      agentStore.setCurrentAgent(match[1]);
    }
  },
  { immediate: true },
);

// Agent info
const agentLogo = computed(() => currentAgent.value?.logo || 'lucide:bot');
const agentName = computed(() => currentAgent.value?.name || '智能体');
const agentLogoBgColor = computed(
  () => currentAgent.value?.logoBgColor || '#eff6ff',
);
const agentLogoColor = computed(
  () => currentAgent.value?.logoColor || '#3b82f6',
);

// Check if logo is an image URL
const isImageLogo = computed(() => {
  const logo = agentLogo.value;
  return (
    logo.startsWith('data:') || logo.startsWith('http') || logo.startsWith('/')
  );
});

// Breadcrumb items
const breadcrumbItems = computed(() => {
  const items = [{ title: '智能体', path: '/agent/management' }];
  if (currentAgent.value) {
    items.push({
      title: currentAgent.value.name,
      path: `/agent/${currentAgent.value.code}`,
    });
  }
  // Add current page title from route meta
  if (route.meta?.title && route.meta.title !== currentAgent.value?.name) {
    items.push({ title: route.meta.title as string, path: route.path });
  }
  return items;
});

// Menu items for current agent (based on route children)
const menuItems = computed(() => {
  const agentCode = currentAgent.value?.code;
  if (!agentCode) return [];

  const basePath = `/agent/${agentCode}`;

  // Find agent route and its children
  const agentRoutes = router
    .getRoutes()
    .filter((r) => r.path.startsWith(basePath) && r.meta && !r.meta.hideInMenu);

  // Define menu order for smart_audit subsystem
  const menuOrder: Record<string, number> = {
    [basePath]: 0, // 介绍
    [`${basePath}/policy`]: 1, // 制度列表
    [`${basePath}/rule-studio`]: 2, // 规则配置
    [`${basePath}/rule-sandbox`]: 3, // 规则测试
    [`${basePath}/scheme-builder`]: 4, // 审核方案
    [`${basePath}/audit-policy`]: 5, // 审核策略
    [`${basePath}/bill-query`]: 6, // 单据查询
  };

  return agentRoutes
    .map((r) => ({
      path: r.path,
      title: (r.meta?.title as string) || '',
      icon: (r.meta?.icon as string) || 'lucide:file',
    }))
    .toSorted((a, b) => {
      const orderA = menuOrder[a.path] ?? 999;
      const orderB = menuOrder[b.path] ?? 999;
      return orderA - orderB;
    });
});

// Check if menu item is active
function isMenuActive(path: string) {
  const agentCode = currentAgent.value?.code;
  const basePath = agentCode ? `/agent/${agentCode}` : '';

  // For introduction page (base path), only match exactly
  if (path === basePath) {
    return route.path === path;
  }
  // For other pages, match exact or child routes
  return route.path === path || route.path.startsWith(`${path}/`);
}

function handleBackToAgents() {
  router.push('/agent/management');
}

function handleMenuClick(path: string) {
  router.push(path);
}
</script>

<template>
  <div class="flex h-screen bg-slate-50">
    <!-- Sidebar -->
    <aside
      class="flex w-64 flex-col border-r border-slate-100 bg-white shadow-sm"
    >
      <!-- Agent Header -->
      <div
        class="flex h-16 cursor-pointer items-center gap-3 border-b border-slate-100 px-5 transition-colors hover:bg-slate-50"
        @click="handleBackToAgents"
      >
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-sm"
          :style="{ backgroundColor: agentLogoBgColor, color: agentLogoColor }"
        >
          <img
            v-if="isImageLogo"
            :src="agentLogo"
            class="h-full w-full object-cover"
            alt="Logo"
          />
          <Icon v-else :icon="agentLogo" class="size-5" />
        </div>
        <!-- eslint-disable vue/html-closing-bracket-newline -->
        <div class="flex flex-col overflow-hidden">
          <span
            class="truncate text-sm font-bold leading-tight text-slate-800"
            >{{ agentName }}</span
          ><span
            class="truncate text-[10px] font-medium leading-tight text-slate-400"
            >智能业务助手</span
          >
        </div>
        <!-- eslint-enable vue/html-closing-bracket-newline -->
        <Icon
          icon="lucide:chevron-down"
          class="ml-auto size-4 text-slate-300"
        />
      </div>

      <!-- Menu -->
      <nav class="flex-1 overflow-y-auto px-3 py-4">
        <div class="space-y-1">
          <button
            v-for="item in menuItems"
            :key="item.path"
            class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all"
            :class="
              isMenuActive(item.path)
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            "
            @click="handleMenuClick(item.path)"
          >
            <Icon :icon="item.icon" class="size-4" />
            <span>{{ item.title }}</span>
          </button>
        </div>
      </nav>

      <!-- Footer -->
      <div class="border-t border-slate-100 p-4">
        <button
          class="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          @click="handleBackToAgents"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
          <span>返回智能体列表</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex flex-1 flex-col overflow-hidden">
      <!-- Header -->
      <header
        class="flex h-14 items-center border-b border-slate-100 bg-white px-6 shadow-sm"
      >
        <Breadcrumb>
          <BreadcrumbItem v-for="(item, index) in breadcrumbItems" :key="index">
            <router-link
              v-if="index < breadcrumbItems.length - 1"
              :to="item.path"
              class="text-slate-500 transition-colors hover:text-slate-700"
            >
              {{ item.title }}
            </router-link>
            <span v-else class="font-medium text-slate-800">{{
              item.title
            }}</span>
          </BreadcrumbItem>
        </Breadcrumb>
      </header>

      <!-- Content Area -->
      <main class="flex-1 overflow-auto bg-slate-50 p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar for sidebar */
nav::-webkit-scrollbar {
  width: 4px;
}

nav::-webkit-scrollbar-track {
  background: transparent;
}

nav::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 2px;
}

nav::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}
</style>
