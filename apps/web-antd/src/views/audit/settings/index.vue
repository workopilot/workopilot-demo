<script setup lang="ts">
import { ref } from 'vue';

import BillTypes from './components/bill-types.vue';
import ExpenseCategories from './components/expense-categories.vue';
import PluginConfig from './components/plugin-config.vue';
import SettingsSidebar from './components/sidebar.vue';
import SourceSystems from './components/source-systems.vue';

// 当前激活的模块
const activeModule = ref<string>('source-systems');

// 面包屑映射
const breadcrumbMap: Record<string, string> = {
  'source-systems': '业务系统',
  'bill-types': '单据类型',
  'expense-categories': '费用科目',
  'plugin-config': '插件设置',
};

// 处理导航切换
function handleNavigationChange(module: string) {
  activeModule.value = module;
}
</script>

<template>
  <div class="flex h-full overflow-hidden bg-background">
    <!-- 左侧导航栏 -->
    <SettingsSidebar
      :active-module="activeModule"
      @change="handleNavigationChange"
    />

    <!-- 右侧内容区 -->
    <div class="flex flex-1 flex-col overflow-hidden">
      <!-- 面包屑 -->
      <div class="border-b bg-muted/40 px-6 py-3">
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <span>基础设置</span>
          <span>/</span>
          <span class="text-foreground">{{ breadcrumbMap[activeModule] }}</span>
        </div>
      </div>

      <!-- 动态内容区 -->
      <div class="flex-1 overflow-y-auto p-6">
        <Transition name="fade" mode="out-in">
          <SourceSystems v-if="activeModule === 'source-systems'" />
          <BillTypes v-else-if="activeModule === 'bill-types'" />
          <ExpenseCategories
            v-else-if="activeModule === 'expense-categories'"
          />
          <PluginConfig v-else-if="activeModule === 'plugin-config'" />
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 页面切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
