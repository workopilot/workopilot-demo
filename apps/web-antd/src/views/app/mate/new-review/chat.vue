<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { Button, Input } from 'ant-design-vue';
import { mockMateEmployees } from '#/api/mock-data-mate';
import { reviewReportTypes } from '#/api/mock-new-review';
import {
  reviewChatSessions as sessions,
  replyReviewChat,
} from '#/api/mock-new-review';
import EmployeeConversationHistory from '../components/employee-conversation-history.vue';

const router = useRouter();
const employee = mockMateEmployees.find(
  (item) => item.id === 'new-review-assistant',
)!;
const activeId = ref(sessions[0]?.id || '');
const active = computed(() =>
  sessions.find((item) => item.id === activeId.value),
);
const draft = ref('');
const historyVisible = ref(window.innerWidth > 760);
const pending = ref<string[]>([]);
const sending = computed(() => pending.value.includes(activeId.value));
const scroller = ref<HTMLElement>();
const enabledSchemes = computed(() => reviewReportTypes);
const prompts = [
  '有哪些报告待我反馈？',
  '查看项目报告',
  '评分和反馈有什么要求？',
];
async function scrollBottom() {
  await nextTick();
  scroller.value?.scrollTo({ top: scroller.value.scrollHeight });
}
function createSession() {
  const id = crypto.randomUUID();
  sessions.unshift({
    id,
    employeeId: employee.id,
    title: '新对话',
    relativeTime: '刚刚',
    unread: 0,
    messages: [],
  });
  selectSession(id);
}
function selectSession(id: string) {
  if (window.innerWidth <= 760) historyVisible.value = false;
  activeId.value = id;
  draft.value = '';
  const session = sessions.find((item) => item.id === id);
  if (session) session.unread = 0;
  void scrollBottom();
}
function deleteSession(id: string) {
  const index = sessions.findIndex((item) => item.id === id);
  if (index >= 0) sessions.splice(index, 1);
  if (activeId.value === id) selectSession(sessions[0]?.id || '');
}
function clearSessions() {
  sessions.splice(0);
  selectSession('');
}
function openReports(scheme?: string) {
  void router.push({
    path: '/app/mate/employee/new-review-assistant/report-review',
    query: scheme ? { type: scheme } : {},
  });
}
async function send(text = draft.value) {
  if (!text.trim() || sending.value) return;
  if (!active.value) createSession();
  const session = active.value!;
  const content = text.trim();
  if (!session.messages.some((item) => item.role === 'user'))
    session.title = content.slice(0, 18);
  session.messages.push({
    id: crypto.randomUUID(),
    role: 'user',
    content,
    time: '刚刚',
  });
  draft.value = '';
  pending.value.push(session.id);
  void scrollBottom();
  try {
    const reply = await replyReviewChat(content);
    if (sessions.includes(session)) {
      session.messages.push({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: reply.data.content,
        time: '刚刚',
      });
      if (activeId.value !== session.id) session.unread++;
    }
  } finally {
    pending.value = pending.value.filter((id) => id !== session.id);
    void scrollBottom();
  }
}
function onEnter(event: KeyboardEvent) {
  if (!event.shiftKey && !event.isComposing && event.keyCode !== 229) {
    event.preventDefault();
    void send();
  }
}
</script>

<template>
  <section class="report-chat">
    <EmployeeConversationHistory
      v-if="historyVisible"
      :active-session-id="activeId"
      :sessions="sessions"
      @create="createSession"
      @select="selectSession"
      @delete="deleteSession"
      @clear="clearSessions"
      @toggle="historyVisible = false"
    />
    <main class="chat-main">
      <header class="chat-header">
        <div>
          <Button
            v-if="!historyVisible"
            type="text"
            aria-label="展开对话历史"
            @click="historyVisible = true"
            ><Icon icon="lucide:panel-left-open"
          /></Button>
          <img :src="employee.avatar" alt="新审核助理" />
          <h2>新审核助理</h2>
          <span class="online">在线</span>
        </div>
        <div>
          <Button type="text" @click="openReports()">汇报审核</Button
          ><Button type="text" aria-label="新建会话" @click="createSession"
            ><Icon icon="lucide:message-square-plus"
          /></Button>
        </div>
      </header>
      <div ref="scroller" class="chat-messages" aria-live="polite">
        <section class="welcome">
          <span>业务审核数字员工</span>
          <h1>先看关键风险，再给出有依据的反馈</h1>
          <p>
            可以询问待反馈清单，或按个人、项目、客户报告进入审核。AI
            辅助阅读，评分与意见由你确认。
          </p>
          <div class="scheme-links">
            <button
              v-for="scheme in enabledSchemes"
              :key="scheme.id"
              @click="openReports(scheme.id)"
            >
              <Icon :icon="scheme.icon" />{{ scheme.title
              }}<Icon icon="lucide:arrow-up-right" />
            </button>
          </div>
        </section>
        <div
          v-for="item in active?.messages || []"
          :key="item.id"
          class="chat-message"
          :class="item.role"
        >
          <img v-if="item.role === 'assistant'" :src="employee.avatar" alt="" />
          <div class="message-body">
            <small
              >{{ item.role === 'assistant' ? '新审核助理' : '我' }} ·
              {{ item.time }}</small
            >
            <p>{{ item.content }}</p>
          </div>
          <span v-if="item.role === 'user'" class="user-avatar">我</span>
        </div>
        <div v-if="sending" class="thinking">
          <Icon icon="lucide:ellipsis" />正在整理回复…
        </div>
      </div>
      <footer class="chat-composer">
        <div class="prompt-list">
          <button
            v-for="prompt in prompts"
            :key="prompt"
            :disabled="sending"
            @click="send(prompt)"
          >
            {{ prompt }}
          </button>
        </div>
        <div class="input-box">
          <Input.TextArea
            v-model:value="draft"
            :auto-size="{ minRows: 2, maxRows: 5 }"
            placeholder="询问待反馈报告、关键风险或评分规则…"
            aria-label="对话内容"
            @keydown.enter="onEnter"
          /><Button
            type="primary"
            shape="circle"
            aria-label="发送消息"
            :disabled="!draft.trim() || sending"
            :loading="sending"
            @click="send()"
            ><Icon icon="lucide:arrow-up"
          /></Button>
        </div>
        <small
          >Enter 发送 · Shift + Enter 换行
          <span
            >演示回复 · 对话刷新后重置，不会自动评分、提交反馈或修改报告</span
          ></small
        >
      </footer>
    </main>
  </section>
</template>

<style scoped>
.report-chat {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: #fff;
  border: 1px solid #d4e3de;
  border-radius: 28px;
  box-shadow: 0 22px 52px rgb(18 57 45 / 8%);
}
.chat-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}
.chat-header {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 20px;
  border-bottom: 1px solid #e4eee9;
}
.chat-header > div {
  display: flex;
  align-items: center;
  gap: 10px;
}
.chat-header img,
.chat-message > img {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
}
.chat-header h2 {
  margin: 0;
  font-size: 15px;
  color: #112d27;
}
.online {
  font-size: 11px;
  color: #238873;
}
.online::before {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 5px;
  content: '';
  background: #238873;
  border-radius: 50%;
}
.chat-messages {
  flex: 1;
  min-height: 0;
  padding: 26px;
  overflow-y: auto;
}
.welcome {
  padding-bottom: 24px;
  margin-bottom: 26px;
  border-bottom: 1px dashed #dbe6e2;
}
.welcome > span {
  font-size: 12px;
  color: #238873;
}
.welcome h1 {
  margin: 8px 0;
  font-size: 25px;
  font-weight: 650;
  color: #163d33;
}
.welcome p {
  font-size: 13px;
  line-height: 1.8;
  color: #6a8179;
}
.scheme-links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}
.scheme-links button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 15px;
  color: #285d4d;
  background: #f4f9f6;
  border: 1px solid #dbe8e1;
  border-radius: 12px;
  cursor: pointer;
}
.scheme-links button:hover {
  background: #e8f4ed;
  border-color: #87b8a3;
}
.chat-message {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 24px;
}
.message-body {
  max-width: 82%;
  min-width: 0;
}
.message-body small {
  font-size: 11px;
  color: #81968d;
}
.message-body p {
  padding: 14px 17px;
  margin: 7px 0 0;
  font-size: 14px;
  line-height: 1.9;
  color: #25483c;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  background: #f4f8f6;
  border: 1px solid #e2ece6;
  border-radius: 0 14px 14px;
}
.chat-message.user {
  justify-content: flex-end;
}
.user .message-body p {
  background: #e5f3eb;
  border-color: #cfe5d8;
  border-radius: 14px 0 14px 14px;
}
.user .message-body small {
  display: block;
  text-align: right;
}
.user-avatar {
  display: grid;
  flex: none;
  width: 34px;
  height: 34px;
  place-items: center;
  color: #fff;
  background: #28866b;
  border-radius: 50%;
  font-size: 12px;
}
.thinking {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6c8277;
  font-size: 13px;
}
.chat-composer {
  flex: none;
  padding: 14px 22px 16px;
  border-top: 1px solid #e4eee9;
}
.prompt-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.prompt-list button {
  padding: 6px 10px;
  font-size: 12px;
  color: #58736c;
  cursor: pointer;
  background: #f8fbfa;
  border: 1px solid #d3e4de;
  border-radius: 8px;
}
.input-box {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  padding: 10px;
  border: 1px solid #cadfd4;
  border-radius: 16px;
}
.input-box:focus-within {
  border-color: #28866b;
  box-shadow: 0 0 0 2px #edf6f0;
}
.input-box :deep(textarea) {
  border: 0;
  box-shadow: none !important;
  resize: none;
}
.chat-composer > small {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
  font-size: 11px;
  color: #8a9c93;
}
.report-chat :deep(.ant-btn) {
  color: #466b5c;
  background: #fff;
  border-color: #d6e5dc;
}
.report-chat :deep(.ant-btn-primary) {
  color: #fff;
  background: #238873;
  border-color: #238873;
}
.report-chat :deep(.ant-btn-primary:disabled) {
  color: #9aaea2;
  background: #edf3ef;
  border-color: #e1e9e4;
}
@media (max-width: 1100px) {
  .report-chat :deep(.conversation-history) {
    width: 240px;
    min-width: 240px;
  }
  .chat-messages {
    padding: 18px;
  }
  .welcome h1 {
    font-size: 21px;
  }
}
@media (max-width: 760px) {
  .report-chat {
    position: relative;
  }
  .report-chat :deep(.conversation-history) {
    position: absolute;
    z-index: 5;
    width: 280px;
    max-width: 90%;
    height: 100%;
    box-shadow: 8px 0 20px #163d3322;
  }
  .chat-header {
    padding: 0 12px;
  }
  .chat-composer {
    padding: 12px;
  }
  .message-body {
    max-width: 90%;
  }
}
</style>
