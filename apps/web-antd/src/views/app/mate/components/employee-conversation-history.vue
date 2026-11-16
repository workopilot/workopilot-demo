<script setup lang="ts">
import type { MateChatSession } from '#/types/mate';

import { Icon } from '@iconify/vue';
import { Button, Empty, Popconfirm, Tooltip } from 'ant-design-vue';

defineProps<{
  activeSessionId: string;
  sessions: MateChatSession[];
}>();

const emit = defineEmits<{
  clear: [];
  create: [];
  delete: [sessionId: string];
  select: [sessionId: string];
  toggle: [];
}>();
</script>

<template>
  <aside class="conversation-history">
    <header class="conversation-history__head">
      <h2>对话历史</h2>
      <div>
        <Tooltip title="新建对话">
          <Button
            aria-label="新建对话"
            shape="circle"
            type="text"
            @click="emit('create')"
          >
            <Icon icon="lucide:plus" />
          </Button>
        </Tooltip>
        <Popconfirm
          title="确认清空全部对话？"
          ok-text="清空"
          cancel-text="取消"
          @confirm="emit('clear')"
        >
          <Tooltip title="清空全部">
            <Button
              aria-label="清空全部对话"
              shape="circle"
              type="text"
              :disabled="sessions.length === 0"
            >
              <Icon icon="lucide:trash-2" />
            </Button>
          </Tooltip>
        </Popconfirm>
        <Tooltip title="收起对话历史">
          <Button
            aria-label="收起对话历史"
            shape="circle"
            type="text"
            @click="emit('toggle')"
          >
            <Icon icon="lucide:panel-left-close" />
          </Button>
        </Tooltip>
      </div>
    </header>

    <div class="conversation-history__body">
      <div
        v-for="session in sessions"
        :key="session.id"
        class="conversation-session"
        :class="{ 'is-active': activeSessionId === session.id }"
        role="button"
        tabindex="0"
        @click="emit('select', session.id)"
        @keydown.enter="emit('select', session.id)"
      >
        <span class="conversation-session__select">
          <Icon
            :icon="
              activeSessionId === session.id ? 'lucide:check' : 'lucide:plus'
            "
          />
        </span>
        <strong>{{ session.title }}</strong>
        <i v-if="session.unread" title="有未读消息"></i>
        <small>{{ session.relativeTime }}</small>
        <Popconfirm
          title="删除该对话？"
          ok-text="删除"
          cancel-text="取消"
          @confirm="emit('delete', session.id)"
        >
          <Button
            :aria-label="`删除对话：${session.title}`"
            class="conversation-session__delete"
            danger
            shape="circle"
            size="small"
            type="text"
            @click.stop
          >
            <Icon icon="lucide:trash-2" />
          </Button>
        </Popconfirm>
      </div>
      <Empty v-if="sessions.length === 0" description="暂无对话" />
    </div>
  </aside>
</template>

<style scoped>
.conversation-history {
  display: flex;
  flex-direction: column;
  width: 308px;
  min-width: 308px;
  min-height: 0;
  background: linear-gradient(
    180deg,
    rgb(240 246 242 / 98%),
    rgb(248 251 249 / 96%)
  );
  border-right: 1px solid rgb(14 83 69 / 10%);
}

.conversation-history__head {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  min-height: 72px;
  padding: 14px 18px;
  border-bottom: 1px solid rgb(14 83 69 / 8%);
}

.conversation-history__head h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #0f2925;
}

.conversation-history__head > div {
  display: flex;
  gap: 6px;
}

.conversation-history__head :deep(.ant-btn) {
  width: 32px;
  min-width: 32px;
  height: 32px;
  color: #8ca09a;
  background: rgb(255 255 255 / 74%);
  border: 1px solid #dce7e3;
}

.conversation-history__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  padding: 12px;
  overflow-y: auto;
}

.conversation-session {
  display: flex;
  gap: 9px;
  align-items: center;
  width: 100%;
  min-height: 48px;
  padding: 8px 10px;
  color: #263d38;
  text-align: left;
  cursor: pointer;
  background: rgb(255 255 255 / 76%);
  border: 1px solid rgb(14 83 69 / 10%);
  border-radius: 18px;
  transition: 0.18s ease;
}

.conversation-session:hover {
  background: #fff;
  border-color: #c6dcd5;
}

.conversation-session.is-active {
  background: rgb(255 255 255 / 96%);
  border-color: #c9dff7;
  box-shadow: 0 0 0 2px rgb(191 219 254 / 34%);
}

.conversation-session__select {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: #9bada7;
  background: #fff;
  border: 1px solid #dce6e2;
  border-radius: 50%;
}

.is-active .conversation-session__select {
  color: #fff;
  background: #3b82f6;
  border-color: #3b82f6;
}

.conversation-session strong {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  font-weight: 650;
  color: #203a34;
  white-space: nowrap;
}

.conversation-session > i {
  flex: none;
  width: 7px;
  height: 7px;
  background: #ef4444;
  border-radius: 50%;
}

.conversation-session small {
  flex: none;
  font-size: 11px;
  color: #82958f;
}

.conversation-session__delete {
  display: none;
}

.conversation-session:hover .conversation-session__delete {
  display: inline-flex;
}

@media (max-width: 1120px) {
  .conversation-history {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 8;
    box-shadow: 18px 0 36px rgb(18 57 45 / 16%);
  }
}
</style>
