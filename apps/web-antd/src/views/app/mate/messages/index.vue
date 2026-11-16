<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, Checkbox, Drawer, Empty, message } from 'ant-design-vue';
import MarkdownIt from 'markdown-it';

import {
  markAllMateMessagesRead,
  markMateMessageRead,
  mateMessages,
  mateNotificationChannels,
  type MateInboxMessage,
  type MateMessageCategory,
  type MateNotificationChannel,
} from './message-state';

const route = useRoute();
const router = useRouter();
const selectedId = ref(String(route.query.messageId || ''));
const bindingPromptChannel = ref<MateNotificationChannel>();
const notificationSettingsOpen = computed({
  get: () => route.query.notificationSettings === 'open',
  set: (isOpen: boolean) => {
    if (isOpen || route.query.notificationSettings !== 'open') return;
    const query = { ...route.query };
    delete query.notificationSettings;
    void router.replace({ path: '/app/mate/messages', query });
  },
});
const markdown = new MarkdownIt({
  breaks: true,
  html: false,
  linkify: true,
  typographer: false,
});

const categoryMeta: Record<
  MateMessageCategory,
  { icon: string; label: string }
> = {
  assistant: { label: '助理', icon: 'lucide:bot' },
  todo: { label: '待办', icon: 'lucide:circle-check-big' },
  application: { label: '应用', icon: 'lucide:blocks' },
  share: { label: '分享', icon: 'lucide:share-2' },
  other: { label: '其他', icon: 'lucide:ellipsis' },
};

const filteredMessages = computed(() => {
  const status = String(route.query.status || 'all');
  const category = String(route.query.category || 'all');
  const keyword = String(route.query.q || '')
    .trim()
    .toLocaleLowerCase();

  return mateMessages.filter((item) => {
    const statusMatches =
      status === 'all' ||
      (status === 'unread'
        ? item.unread
        : status === 'read'
          ? !item.unread
          : true);
    const categoryMatches = category === 'all' || item.category === category;
    const keywordMatches =
      !keyword ||
      [
        item.title,
        item.summary,
        item.sourceName,
        item.sender,
        item.contentMarkdown,
      ].some((value) => value.toLocaleLowerCase().includes(keyword));
    return statusMatches && categoryMatches && keywordMatches;
  });
});

const selectedMessage = computed(() =>
  filteredMessages.value.find((item) => item.id === selectedId.value),
);
const renderedMessageContent = computed(() =>
  markdown.render(selectedMessage.value?.contentMarkdown || ''),
);
const unreadCount = computed(
  () => mateMessages.filter((item) => item.unread).length,
);
const enabledChannelCount = computed(
  () => mateNotificationChannels.filter((item) => item.enabled).length,
);

watch(
  filteredMessages,
  (messages) => {
    if (!messages.some((item) => item.id === selectedId.value)) {
      selectedId.value = messages[0]?.id || '';
    }
  },
  { immediate: true },
);

watch(
  () => route.query.messageId,
  (value) => {
    if (value) selectedId.value = String(value);
  },
);

watch(notificationSettingsOpen, (isOpen) => {
  if (!isOpen) bindingPromptChannel.value = undefined;
});

function selectMessage(item: MateInboxMessage) {
  selectedId.value = item.id;
  markMateMessageRead(item.id);
  void router.replace({
    path: '/app/mate/messages',
    query: { ...route.query, messageId: item.id },
  });
}

function handleMessageAction(item: MateInboxMessage) {
  markMateMessageRead(item.id);
  void router.push(item.targetPath);
}

function clearFilters() {
  void router.push('/app/mate/messages');
}

function toggleNotificationChannel(channel: MateNotificationChannel) {
  if (!channel.bound) {
    bindingPromptChannel.value = channel;
    message.warning(`请先绑定${channel.label}账号`);
    return;
  }

  bindingPromptChannel.value = undefined;
  channel.enabled = !channel.enabled;
  message.success(`${channel.label}通知已${channel.enabled ? '开启' : '关闭'}`);
}

function goToChannelBinding(channel: MateNotificationChannel) {
  void router.push({
    path: '/profile',
    query: {
      bind: channel.key,
      redirect: '/app/mate/messages',
    },
  });
}
</script>

<template>
  <section class="message-workspace" aria-label="消息中心">
    <aside class="message-list-pane" aria-labelledby="message-list-title">
      <header class="message-list-head">
        <div>
          <h1 id="message-list-title">消息</h1>
          <span>{{ filteredMessages.length }} 条</span>
        </div>
        <Button
          v-if="unreadCount"
          type="text"
          title="全部标为已读"
          aria-label="全部标为已读"
          @click="markAllMateMessagesRead"
        >
          <Icon icon="lucide:check-check" />
        </Button>
      </header>

      <div v-if="filteredMessages.length" class="message-list" role="list">
        <button
          v-for="item in filteredMessages"
          :key="item.id"
          class="message-list-item"
          :class="{
            'is-selected': selectedId === item.id,
            'is-unread': item.unread,
          }"
          type="button"
          role="listitem"
          :aria-current="selectedId === item.id ? 'true' : undefined"
          :aria-label="`${categoryMeta[item.category].label}，${item.sourceName}，${item.title}，发送方 ${item.sender}，${item.date}`"
          @click="selectMessage(item)"
        >
          <span class="message-list-item__topline">
            <span class="message-type">
              <Icon :icon="categoryMeta[item.category].icon" />
              <span>{{ categoryMeta[item.category].label }}</span>
              <i aria-hidden="true">·</i>
              <b>{{ item.sourceName }}</b>
            </span>
            <time>{{ item.date }}</time>
          </span>
          <span class="message-list-item__title">
            <i v-if="item.unread" aria-label="未读"></i>
            <span>{{ item.title }}</span>
          </span>
        </button>
      </div>

      <div v-else class="message-list-empty">
        <Empty description="没有匹配的消息" />
        <Button size="small" @click="clearFilters">清除筛选</Button>
      </div>
    </aside>

    <main class="message-detail-pane">
      <article v-if="selectedMessage" class="message-detail">
        <header class="message-detail__head">
          <div class="message-detail__type">
            <span
              ><Icon :icon="categoryMeta[selectedMessage.category].icon"
            /></span>
            <strong>{{ categoryMeta[selectedMessage.category].label }}</strong>
            <i aria-hidden="true">·</i>
            {{ selectedMessage.sourceName }}
          </div>
          <h2>{{ selectedMessage.title }}</h2>
          <div class="message-detail__meta">
            <span class="message-detail__sender-icon">
              <Icon icon="lucide:user-round" />
            </span>
            <div>
              <strong>{{ selectedMessage.sender }}</strong>
              <time>{{ selectedMessage.fullDate }}</time>
            </div>
          </div>
        </header>

        <div class="message-detail__body">
          <!-- MarkdownIt 已关闭 html 选项，消息内容不会执行原始 HTML。 -->
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="message-markdown" v-html="renderedMessageContent"></div>
        </div>

        <footer class="message-detail__footer">
          <span>
            <Icon icon="lucide:corner-down-right" />
            {{ selectedMessage.actionHint }}
          </span>
          <Button type="primary" @click="handleMessageAction(selectedMessage)">
            去处理<Icon icon="lucide:arrow-right" />
          </Button>
        </footer>
      </article>

      <div v-else class="message-detail-empty">
        <Icon icon="lucide:mail-open" />
        <strong>选择一条消息</strong>
        <span>消息详细内容将在这里展示</span>
      </div>
    </main>

    <Drawer
      v-model:open="notificationSettingsOpen"
      title="通知设置"
      placement="right"
      :width="440"
      root-class-name="message-notification-drawer"
    >
      <div class="notification-settings">
        <div class="notification-settings__intro">
          <div>
            <strong>外部通知渠道</strong>
            <span>
              已开启 {{ enabledChannelCount }}/{{
                mateNotificationChannels.length
              }}
            </span>
          </div>
          <p>默认全部关闭，开启后仅同步重要消息，站内消息会始终保留。</p>
        </div>

        <div class="notification-channel-list" aria-label="通知渠道列表">
          <section
            v-for="channel in mateNotificationChannels"
            :key="channel.key"
            class="notification-channel"
            :class="{
              'is-enabled': channel.enabled,
              'needs-binding': !channel.bound,
            }"
          >
            <span class="notification-channel__icon">
              <Icon :icon="channel.icon" />
            </span>
            <div class="notification-channel__content">
              <div class="notification-channel__title">
                <strong>{{ channel.label }}</strong>
                <span :class="{ 'is-bound': channel.bound }">
                  {{ channel.bound ? '已绑定' : '未绑定' }}
                </span>
              </div>
              <p>{{ channel.description }}</p>
              <span class="notification-channel__account">
                {{ channel.accountLabel }}
              </span>
              <Button
                v-if="!channel.bound"
                type="link"
                size="small"
                @click="goToChannelBinding(channel)"
              >
                去个人后台绑定
                <Icon icon="lucide:arrow-up-right" />
              </Button>
            </div>
            <Checkbox
              class="notification-channel__checkbox"
              :checked="channel.enabled"
              :aria-label="`${channel.enabled ? '关闭' : '开启'}${channel.label}通知`"
              @change="toggleNotificationChannel(channel)"
            />
          </section>
        </div>

        <div
          v-if="bindingPromptChannel"
          class="notification-binding-alert"
          role="alert"
        >
          <Icon icon="lucide:circle-alert" />
          <div>
            <strong>{{ bindingPromptChannel.label }}尚未绑定</strong>
            <p>请先在个人后台完成账号绑定，再回来开启通知。</p>
          </div>
          <Button
            type="link"
            size="small"
            @click="goToChannelBinding(bindingPromptChannel)"
          >
            去绑定
          </Button>
        </div>

        <div class="notification-settings__note">
          <Icon icon="lucide:shield-check" />
          通知内容仅用于消息提醒，可随时关闭。
        </div>
      </div>
    </Drawer>
  </section>
</template>

<style scoped>
.message-workspace {
  display: grid;
  grid-template-columns: 350px minmax(0, 1fr);
  width: 100%;
  height: 100%;
  min-height: 580px;
  overflow: hidden;
  color: #173d35;
  background: #fff;
  border: 1px solid #d8e5e1;
  border-radius: 14px;
  box-shadow: 0 6px 22px rgb(22 70 60 / 6%);
}

.message-list-pane {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: #f8fbfa;
  border-right: 1px solid #dce8e4;
}

.message-list-head {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  min-height: 66px;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e3ece9;
}

.message-list-head > div:first-child {
  display: flex;
  gap: 8px;
  align-items: baseline;
}

.message-list-head h1 {
  margin: 0;
  font-size: 18px;
  color: #12372f;
}

.message-list-head span {
  font-size: 11px;
  color: #7b928c;
}

.message-list-head :deep(.ant-btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: #0b6e65;
  border-radius: 9px;
}

.message-list-head :deep(.ant-btn:hover) {
  color: #075b54;
  background: #e8f3f0;
}

.message-list-head :deep(.ant-btn:focus-visible) {
  outline: 3px solid rgb(11 128 111 / 26%);
  outline-offset: 1px;
}

.message-list {
  display: grid;
  gap: 8px;
  align-content: start;
  flex: 1;
  min-height: 0;
  padding: 10px;
  overflow: auto;
  background: #e9f1ee;
}

.message-list-item {
  position: relative;
  display: grid;
  gap: 9px;
  width: 100%;
  min-height: 78px;
  padding: 12px 14px;
  color: #8a9c97;
  text-align: left;
  cursor: pointer;
  background: rgb(248 251 250 / 72%);
  border: 1px solid #d9e5e1;
  border-radius: 10px;
  transition:
    color 180ms ease,
    background 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease;
}

.message-list-item:hover {
  color: #536f68;
  background: #fff;
  border-color: #bad4cc;
  box-shadow: 0 4px 12px rgb(30 79 68 / 7%);
}

.message-list-item.is-selected {
  background: #dcece7;
  border-color: #9fc8bd;
}

.message-list-item.is-selected::before {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 3px;
  content: '';
  background: #0b806f;
}

.message-list-item.is-unread {
  color: #33584f;
  background: #fff;
  border-color: #ccdeda;
}

.message-list-item.is-unread.is-selected {
  background: #dcece7;
  border-color: #9fc8bd;
}

.message-list-item__topline,
.message-list-item__title,
.message-type {
  display: flex;
  align-items: center;
}

.message-list-item__topline {
  justify-content: space-between;
}

.message-type {
  gap: 5px;
  font-size: 11px;
}

.message-type i {
  font-style: normal;
  color: #a5b4b0;
}

.message-type b {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: inherit;
  font-weight: 600;
  white-space: nowrap;
}

.message-type svg {
  width: 14px;
  height: 14px;
}

.message-list-item time {
  font-size: 11px;
  color: #95a6a1;
}

.message-list-item__title {
  gap: 8px;
  min-width: 0;
  font-size: 13px;
  font-weight: 400;
  color: #728680;
}

.message-list-item__title i {
  flex: none;
  width: 7px;
  height: 7px;
  background: #df4d58;
  border-radius: 50%;
}

.message-list-item__title span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-list-item.is-unread .message-list-item__title {
  font-weight: 700;
  color: #173d35;
}

.message-list-item:focus-visible {
  z-index: 1;
  outline: 3px solid rgb(11 128 111 / 28%);
  outline-offset: -3px;
}

.message-list-empty,
.message-detail-empty {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  justify-content: center;
}

.message-detail-pane {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: #fff;
}

.message-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.message-detail__head {
  flex: none;
  padding: 28px 34px 22px;
  border-bottom: 1px solid #e5edeb;
}

.message-detail__type {
  display: inline-flex;
  gap: 7px;
  align-items: center;
  margin-bottom: 13px;
  font-size: 11px;
  font-weight: 700;
  color: #51736a;
}

.message-detail__type strong {
  font-weight: 700;
}

.message-detail__type i {
  font-style: normal;
  color: #9aaca7;
}

.message-detail__type > span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  color: #0b6e65;
  background: #e4f1ed;
  border-radius: 7px;
}

.message-detail h2 {
  margin: 0 0 18px;
  font-size: 22px;
  line-height: 1.35;
  color: #153a31;
}

.message-detail__meta {
  display: flex;
  gap: 10px;
  align-items: center;
}

.message-detail__sender-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  color: #507068;
  background: #edf4f2;
  border-radius: 50%;
}

.message-detail__meta strong,
.message-detail__meta time {
  display: block;
}

.message-detail__meta strong {
  font-size: 12px;
}

.message-detail__meta time {
  margin-top: 2px;
  font-size: 10px;
  color: #839791;
}

.message-detail__body {
  flex: 1;
  min-height: 0;
  padding: 28px 34px;
  overflow: auto;
  font-size: 13px;
  line-height: 1.75;
  color: #526f67;
}

.message-markdown {
  max-width: 760px;
}

.message-markdown :deep(p) {
  margin: 0 0 14px;
}

.message-markdown :deep(p:first-child) {
  font-size: 14px;
  color: #294f45;
}

.message-markdown :deep(h1),
.message-markdown :deep(h2),
.message-markdown :deep(h3),
.message-markdown :deep(h4) {
  margin: 22px 0 9px;
  font-weight: 700;
  color: #244b41;
}

.message-markdown :deep(h1) {
  font-size: 20px;
}

.message-markdown :deep(h2) {
  font-size: 17px;
}

.message-markdown :deep(h3),
.message-markdown :deep(h4) {
  font-size: 14px;
}

.message-markdown :deep(ul),
.message-markdown :deep(ol) {
  padding: 14px 18px 14px 38px;
  margin: 8px 0 16px;
  background: #f7faf9;
  border: 1px solid #e1ebe8;
  border-radius: 10px;
}

.message-markdown :deep(li + li) {
  margin-top: 5px;
}

.message-markdown :deep(strong) {
  font-weight: 700;
  color: #17483d;
}

.message-markdown :deep(blockquote) {
  padding: 10px 14px;
  margin: 14px 0;
  color: #476a61;
  background: #edf5f2;
  border-left: 3px solid #4e9b88;
  border-radius: 0 8px 8px 0;
}

.message-markdown :deep(blockquote p:last-child) {
  margin-bottom: 0;
}

.message-markdown :deep(a) {
  color: #087468;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.message-markdown :deep(table) {
  width: 100%;
  margin: 14px 0 18px;
  overflow: hidden;
  border-spacing: 0;
  border-collapse: separate;
  border: 1px solid #dbe8e4;
  border-radius: 10px;
}

.message-markdown :deep(th),
.message-markdown :deep(td) {
  padding: 9px 12px;
  text-align: left;
  border-right: 1px solid #e3ece9;
  border-bottom: 1px solid #e3ece9;
}

.message-markdown :deep(th) {
  font-weight: 700;
  color: #294f45;
  background: #edf5f2;
}

.message-markdown :deep(tr:last-child td) {
  border-bottom: 0;
}

.message-markdown :deep(th:last-child),
.message-markdown :deep(td:last-child) {
  border-right: 0;
}

.message-detail__footer {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  min-height: 72px;
  padding: 14px 34px;
  background: #fbfdfc;
  border-top: 1px solid #e2ebe8;
}

.message-detail__footer > span {
  display: inline-flex;
  gap: 7px;
  align-items: center;
  font-size: 11px;
  color: #748a84;
}

.message-detail__footer :deep(.ant-btn-primary) {
  display: inline-flex;
  gap: 7px;
  align-items: center;
  justify-content: center;
  min-width: 100px;
  height: 38px;
  background: #0b6e65;
  border-color: #0b6e65;
  border-radius: 9px;
  box-shadow: none;
}

.message-detail-empty {
  height: 100%;
  color: #8ca09a;
}

.message-detail-empty > svg {
  width: 36px;
  height: 36px;
  color: #aac0ba;
}

.message-detail-empty strong {
  font-size: 14px;
  color: #607a73;
}

.message-detail-empty span {
  font-size: 12px;
}

.notification-settings {
  display: flex;
  flex-direction: column;
  gap: 18px;
  color: #173d35;
}

.notification-settings__intro {
  padding: 16px;
  background: #edf5f2;
  border: 1px solid #d5e4df;
  border-radius: 12px;
}

.notification-settings__intro > div {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.notification-settings__intro strong {
  font-size: 15px;
  color: #153a31;
}

.notification-settings__intro span {
  padding: 3px 8px;
  font-size: 11px;
  color: #0b6e65;
  background: #fff;
  border: 1px solid #c8ddd7;
  border-radius: 999px;
}

.notification-settings__intro p {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: #647e77;
}

.notification-channel-list {
  display: grid;
  gap: 10px;
}

.notification-channel {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) 40px;
  gap: 12px;
  align-items: start;
  min-height: 108px;
  padding: 15px;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 12px;
  transition:
    background 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease;
}

.notification-channel:hover {
  border-color: #bad4cc;
  box-shadow: 0 4px 12px rgb(30 79 68 / 6%);
}

.notification-channel.is-enabled {
  background: #f5faf8;
  border-color: #91c4b6;
}

.notification-channel__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  color: #0b6e65;
  background: #e7f2ef;
  border-radius: 10px;
}

.notification-channel__icon svg {
  width: 19px;
  height: 19px;
}

.notification-channel__content {
  min-width: 0;
}

.notification-channel__title {
  display: flex;
  gap: 8px;
  align-items: center;
}

.notification-channel__title strong {
  font-size: 14px;
  color: #173d35;
}

.notification-channel__title span {
  padding: 2px 7px;
  font-size: 10px;
  line-height: 1.5;
  color: #9a6b24;
  background: #fff7e8;
  border-radius: 999px;
}

.notification-channel__title span.is-bound {
  color: #26715f;
  background: #e8f5f0;
}

.notification-channel__content p {
  margin: 5px 0 3px;
  font-size: 12px;
  line-height: 1.5;
  color: #5e7972;
}

.notification-channel__account {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px;
  color: #8a9c97;
  white-space: nowrap;
}

.notification-channel__content :deep(.ant-btn-link) {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  height: 28px;
  padding: 0;
  margin-top: 5px;
  font-size: 11px;
  color: #0b6e65;
}

.notification-channel > :deep(.notification-channel__checkbox) {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  width: 40px;
  min-height: 44px;
  cursor: pointer;
}

.notification-channel :deep(.ant-checkbox-checked .ant-checkbox-inner) {
  background: #0b6e65;
  border-color: #0b6e65;
}

.notification-channel :deep(.ant-checkbox-wrapper:focus-visible),
.notification-channel :deep(.ant-checkbox-input:focus-visible + .ant-checkbox-inner) {
  outline: 3px solid rgb(11 128 111 / 26%);
  outline-offset: 2px;
}

.notification-binding-alert {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: start;
  padding: 12px 14px;
  color: #724d18;
  background: #fff8ea;
  border: 1px solid #efdbb6;
  border-radius: 10px;
}

.notification-binding-alert > svg {
  width: 18px;
  height: 18px;
  margin-top: 2px;
}

.notification-binding-alert strong {
  display: block;
  font-size: 12px;
}

.notification-binding-alert p {
  margin: 3px 0 0;
  font-size: 11px;
  line-height: 1.5;
  color: #87662f;
}

.notification-binding-alert :deep(.ant-btn-link) {
  height: 28px;
  padding: 0;
  font-size: 11px;
  color: #8a5a12;
}

.notification-settings__note {
  display: flex;
  gap: 7px;
  align-items: center;
  padding: 0 2px;
  font-size: 11px;
  color: #7c928c;
}

.notification-settings__note svg {
  width: 15px;
  height: 15px;
  color: #5d8b7f;
}

@media (max-width: 1050px) {
  .message-workspace {
    grid-template-columns: 310px minmax(0, 1fr);
  }

  .message-detail__head,
  .message-detail__body {
    padding-right: 22px;
    padding-left: 22px;
  }

  .message-detail__footer {
    padding-right: 22px;
    padding-left: 22px;
  }
}

@media (max-width: 760px) {
  .message-workspace {
    grid-template-columns: 1fr;
    height: auto;
    min-height: 0;
    overflow: visible;
  }

  .message-list-pane {
    max-height: 360px;
    border-right: 0;
    border-bottom: 1px solid #dce8e4;
  }

  .message-detail-pane,
  .message-detail {
    min-height: 540px;
  }

  .message-detail__head,
  .message-detail__body {
    padding: 20px;
  }

  .message-detail__footer {
    padding: 14px 20px;
  }
}

@media (max-width: 480px) {
  :global(.message-notification-drawer .ant-drawer-content-wrapper) {
    width: 100% !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  .message-list-item {
    transition: none;
  }

  .notification-channel {
    transition: none;
  }
}
</style>
