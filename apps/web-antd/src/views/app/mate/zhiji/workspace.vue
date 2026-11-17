<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import ApplicationNavigation from '../components/application-navigation.vue';
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
const activePath = computed(() => {
  const menu = menus.find(
    (item) =>
      route.path === `/app/mate/apps/zhiji/${item.id}` ||
      route.path.startsWith(`/app/mate/apps/zhiji/${item.id}/`),
  );
  return menu ? `/app/mate/apps/zhiji/${menu.id}` : '';
});
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
      <ApplicationNavigation
        name="知记"
        description="AI 汇报管理"
        icon="lucide:book-open-check"
        :menus="
          menus.map((menu) => ({
            label: menu.label,
            icon: menu.icon,
            path: `/app/mate/apps/zhiji/${menu.id}`,
          }))
        "
        :active-path="activePath"
      >
        <button
          class="zj-open-reporter"
          type="button"
          @click="
            router.push('/app/mate/employee/new-report-assistant/reports')
          "
        >
          <Icon icon="lucide:arrow-up-right" aria-hidden="true" />
          打开汇报者端
        </button>
      </ApplicationNavigation>
      <main class="zj-main"><RouterView /></main>
    </div>
  </ConfigProvider>
</template>
