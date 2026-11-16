<script setup lang="ts">
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Icon } from '@iconify/vue';
import { Tabs } from 'ant-design-vue';

import AgentToolsList from './agent-tools/agent-tools-list.vue';
import DataPluginsList from './data-plugins/data-plugins-list.vue';

const activeTab = ref('tools');
</script>

<template>
  <Page title="工具与数据源">
    <template #description>
      <span class="text-muted-foreground">
        配置 AI 智能体可调用的外部能力。
        <strong>工具 (Agent Tools)</strong> 是 AI 的"手"，主动执行任务；
        <strong>数据插件 (Data Plugins)</strong> 是 AI 的"眼"，获取必要信息。
      </span>
    </template>

    <div class="rounded-lg border border-border bg-card p-4">
      <Tabs v-model:active-key="activeTab">
        <Tabs.TabPane key="tools">
          <template #tab>
            <span class="flex items-center gap-2">
              <Icon icon="lucide:hammer" class="size-4" />
              智能体工具箱
            </span>
          </template>
          <AgentToolsList />
        </Tabs.TabPane>

        <Tabs.TabPane key="data">
          <template #tab>
            <span class="flex items-center gap-2">
              <Icon icon="lucide:database" class="size-4" />
              数据源插件
            </span>
          </template>
          <DataPluginsList />
        </Tabs.TabPane>
      </Tabs>
    </div>
  </Page>
</template>
