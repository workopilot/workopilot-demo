<script setup lang="ts">
import type { DeveloperApplication } from '#/types/developer-application';

import { computed } from 'vue';

import { Icon } from '@iconify/vue';
import { Descriptions, DescriptionsItem, Drawer, Tag } from 'ant-design-vue';

const props = defineProps<{
  application: DeveloperApplication | null;
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

// 申请时间本地化
const applyTimeText = computed(() => {
  if (!props.application?.applyTime) return '-';
  return new Date(props.application.applyTime).toLocaleString('zh-CN');
});

// 处理状态展示
const statusInfo = computed(() => {
  if (props.application?.status === 'pending') {
    return { text: '未处理', color: 'default' };
  }
  if (props.application?.processResult === 'approved') {
    return { text: '已处理 · 通过', color: 'success' };
  }
  return { text: '已处理 · 不通过', color: 'error' };
});

function handleClose() {
  emit('update:open', false);
}
</script>

<template>
  <Drawer
    :open="open"
    title="申请详情"
    placement="right"
    :width="640"
    @close="handleClose"
  >
    <template v-if="application">
      <Descriptions
        :column="1"
        bordered
        size="small"
        :label-style="{ width: '120px', background: '#fafafa' }"
      >
        <DescriptionsItem label="申请人">
          {{ application.applicantName }}
        </DescriptionsItem>
        <DescriptionsItem label="申请时间">
          {{ applyTimeText }}
        </DescriptionsItem>
        <DescriptionsItem label="手机号">
          {{ application.phone }}
        </DescriptionsItem>
        <DescriptionsItem label="邮箱">
          {{ application.email }}
        </DescriptionsItem>
        <DescriptionsItem label="技术方向">
          {{ application.techDirection }}
        </DescriptionsItem>
        <DescriptionsItem label="处理状态">
          <Tag :color="statusInfo.color" class="m-0">
            {{ statusInfo.text }}
          </Tag>
        </DescriptionsItem>
        <DescriptionsItem label="GitHub 主页">
          <a
            v-if="application.githubUrl"
            :href="application.githubUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-blue-600 hover:underline"
          >
            <Icon icon="lucide:github" class="size-4" />
            {{ application.githubUrl }}
          </a>
          <span v-else class="text-gray-400">-</span>
        </DescriptionsItem>
        <DescriptionsItem label="GitLab 主页">
          <a
            v-if="application.gitlabUrl"
            :href="application.gitlabUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-blue-600 hover:underline"
          >
            <Icon icon="lucide:gitlab" class="size-4" />
            {{ application.gitlabUrl }}
          </a>
          <span v-else class="text-gray-400">-</span>
        </DescriptionsItem>
        <DescriptionsItem label="申请目的">
          <div class="whitespace-pre-wrap leading-relaxed">
            {{ application.purpose }}
          </div>
        </DescriptionsItem>
      </Descriptions>
    </template>
  </Drawer>
</template>
