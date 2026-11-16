<script setup lang="ts">
import type { BillType } from '#/types/settings';

import { ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Descriptions,
  Popconfirm,
  Switch,
  Tabs,
  Tag,
} from 'ant-design-vue';

import ExtractionRules from './extraction-rules.vue';

defineProps<{
  billType: BillType;
}>();

const emit = defineEmits<{
  delete: [];
  edit: [];
  refresh: [];
}>();

const activeTab = ref('basic');
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- 头部 -->
    <div class="border-b px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <Icon icon="lucide:file-text" class="size-6 text-primary" />
          <div>
            <h3 class="text-lg font-semibold">{{ billType.name }}</h3>
            <p class="text-xs text-muted-foreground">{{ billType.code }}</p>
          </div>
          <Tag :color="billType.enabled ? 'success' : 'default'">
            {{ billType.enabled ? '已启用' : '已禁用' }}
          </Tag>
        </div>
        <div class="flex gap-2">
          <Button size="small" @click="emit('edit')">
            <Icon icon="lucide:edit" class="mr-1 size-3" />
            编辑
          </Button>
          <Popconfirm
            title="确定要删除此单据类型吗?"
            ok-text="确定"
            cancel-text="取消"
            @confirm="emit('delete')"
          >
            <Button size="small" danger>
              <Icon icon="lucide:trash-2" class="mr-1 size-3" />
              删除
            </Button>
          </Popconfirm>
        </div>
      </div>
    </div>

    <!-- 标签页 -->
    <div class="flex-1 overflow-hidden">
      <Tabs v-model:active-key="activeTab" class="h-full px-6 pt-4">
        <Tabs.TabPane key="basic" tab="基础信息">
          <div class="space-y-4 py-4">
            <Descriptions :column="2" bordered>
              <Descriptions.Item label="单据编码">
                {{ billType.code }}
              </Descriptions.Item>
              <Descriptions.Item label="单据名称">
                {{ billType.name }}
              </Descriptions.Item>
              <Descriptions.Item label="所属系统">
                <div class="flex items-center gap-2">
                  <Icon icon="lucide:database" class="size-4 text-primary" />
                  {{ billType.systemName }}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="启用状态">
                <Switch :checked="billType.enabled" disabled />
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {{ billType.createdAt }}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {{ billType.updatedAt }}
              </Descriptions.Item>
              <Descriptions.Item label="描述" :span="2">
                {{ billType.description || '-' }}
              </Descriptions.Item>
            </Descriptions>
          </div>
        </Tabs.TabPane>

        <Tabs.TabPane key="plugin" tab="插件感知配置">
          <div class="space-y-6 py-4">
            <!-- URL 正则 -->
            <div>
              <h4 class="mb-2 text-sm font-semibold">URL 匹配规则</h4>
              <div class="rounded-lg border bg-muted/30 p-3">
                <code class="text-xs">{{ billType.urlRegex }}</code>
              </div>
              <p class="mt-1 text-xs text-muted-foreground">
                插件会根据此正则表达式自动识别单据类型
              </p>
            </div>

            <!-- 字段提取规则 -->
            <div>
              <div class="mb-3 flex items-center justify-between">
                <h4 class="text-sm font-semibold">字段提取规则</h4>
                <span class="text-xs text-muted-foreground">
                  共 {{ billType.extractionRules.length }} 条规则
                </span>
              </div>

              <ExtractionRules
                :bill-type-id="billType.id"
                :rules="billType.extractionRules"
                @refresh="emit('refresh')"
              />
            </div>
          </div>
        </Tabs.TabPane>
      </Tabs>
    </div>
  </div>
</template>
