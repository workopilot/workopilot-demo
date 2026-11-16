<script setup lang="ts">
import { ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Tabs } from 'ant-design-vue';

import ClassificationList from './components/classification-list.vue';
import ClassificationStrategy from './components/classification-strategy.vue';

const activeTab = ref('classification');
</script>

<template>
  <div class="flex h-full flex-col bg-background">
    <!-- Tab 页签 -->
    <div class="flex-1 overflow-hidden">
      <Tabs v-model:active-key="activeTab" class="h-full px-6 pt-4">
        <Tabs.TabPane key="classification">
          <template #tab>
            <span class="flex items-center">
              <Icon icon="lucide:list" class="mr-2" />
              附件分类 & 取数
            </span>
          </template>
          <ClassificationList />
        </Tabs.TabPane>

        <Tabs.TabPane key="strategy">
          <template #tab>
            <span class="flex items-center">
              <Icon icon="lucide:settings-2" class="mr-2" />
              附件分类策略
            </span>
          </template>
          <ClassificationStrategy />
        </Tabs.TabPane>
      </Tabs>
    </div>
  </div>
</template>

<style scoped>
:deep(.ant-tabs-content),
:deep(.ant-tabs-content-holder) {
  height: 100%;
}

:deep(.ant-tabs-tabpane) {
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
