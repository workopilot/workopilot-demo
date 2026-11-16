<script setup lang="ts">
import type { MateEmployee } from '#/types/mate';

import { Icon } from '@iconify/vue';
import { Button, Tooltip } from 'ant-design-vue';

defineProps<{
  employee: MateEmployee;
  historyVisible: boolean;
}>();

const emit = defineEmits<{
  files: [];
  newSession: [];
  toggleHistory: [];
  voice: [];
}>();
</script>

<template>
  <header class="employee-chat-header">
    <div class="employee-chat-header__identity">
      <Tooltip :title="historyVisible ? '收起对话历史' : '展开对话历史'">
        <Button
          :aria-label="historyVisible ? '收起对话历史' : '展开对话历史'"
          shape="circle"
          type="text"
          @click="emit('toggleHistory')"
        >
          <Icon
            :icon="
              historyVisible
                ? 'lucide:panel-left-close'
                : 'lucide:panel-left-open'
            "
          />
        </Button>
      </Tooltip>
      <span class="employee-chat-header__avatar">
        <img :src="employee.avatar" :alt="employee.name" />
        <i></i>
      </span>
      <h2>{{ employee.name }}</h2>
    </div>
    <div class="employee-chat-header__actions">
      <Tooltip title="历史文件">
        <Button
          aria-label="历史文件"
          shape="circle"
          type="text"
          @click="emit('files')"
        >
          <Icon icon="lucide:folder-open" />
        </Button>
      </Tooltip>
      <Tooltip title="语音通话">
        <Button
          aria-label="语音通话"
          shape="circle"
          type="text"
          @click="emit('voice')"
        >
          <Icon icon="lucide:phone-call" />
        </Button>
      </Tooltip>
      <Tooltip title="新建会话">
        <Button
          aria-label="新建会话"
          shape="circle"
          type="text"
          @click="emit('newSession')"
        >
          <Icon icon="lucide:message-square-plus" />
        </Button>
      </Tooltip>
    </div>
  </header>
</template>

<style scoped>
.employee-chat-header {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  min-height: 60px;
  padding: 8px 20px;
  background: rgb(255 255 255 / 78%);
  border-bottom: 1px solid rgb(14 83 69 / 8%);
}

.employee-chat-header__identity,
.employee-chat-header__actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.employee-chat-header :deep(.ant-btn) {
  color: #132d42;
}

.employee-chat-header__avatar {
  position: relative;
  display: inline-flex;
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.employee-chat-header__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
}

.employee-chat-header__avatar i {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 12px;
  height: 12px;
  background: #10b981;
  border: 2px solid #fff;
  border-radius: 50%;
}

.employee-chat-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #162c3a;
}

.employee-chat-header__actions :deep(svg),
.employee-chat-header__identity :deep(svg) {
  font-size: 20px;
}

@media (max-width: 768px) {
  .employee-chat-header {
    padding: 8px 12px;
  }

  .employee-chat-header__actions > :nth-child(1),
  .employee-chat-header__actions > :nth-child(2) {
    display: none;
  }
}
</style>
